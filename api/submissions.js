"use strict";

const { validateSubmission } = require("../js/validation.js");

const MAX_BODY_BYTES = 32 * 1024;
const DEFAULT_RATE_LIMIT_MAX = 5;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const rateBuckets = new Map();
const submissionLocks = new Map();
let testStorageFactory = null;

function formatSubmissionTimestamp(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.day}/${parts.month}/${parts.year} | ${parts.hour}:${parts.minute}`;
}

function json(res, status, body) {
  if (typeof res.status === "function" && typeof res.json === "function") return res.status(status).json(body);
  res.statusCode = status;
  if (typeof res.setHeader === "function") res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function errorResponse(res, status, code, message, errors) {
  const body = { ok: false, code, message };
  if (errors && Object.keys(errors).length) body.errors = errors;
  return json(res, status, body);
}

function header(req, name) {
  const value = req && req.headers ? req.headers[name.toLowerCase()] : undefined;
  return Array.isArray(value) ? value[0] : value;
}

function contentTypeIsJson(req) {
  const contentType = header(req, "content-type");
  return typeof contentType === "string" && contentType.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

function getClientKey(req) {
  const forwarded = header(req, "x-forwarded-for");
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",", 1)[0].trim();
  const realIp = header(req, "x-real-ip");
  if (typeof realIp === "string" && realIp.trim()) return realIp.trim();
  return "unknown";
}

function configuredRateLimit() {
  const max = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || String(DEFAULT_RATE_LIMIT_MAX), 10);
  const windowSeconds = Number.parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || String(DEFAULT_RATE_LIMIT_WINDOW_SECONDS), 10);
  return {
    max: Number.isInteger(max) && max > 0 ? max : DEFAULT_RATE_LIMIT_MAX,
    windowMs: Number.isInteger(windowSeconds) && windowSeconds > 0 ? windowSeconds * 1000 : DEFAULT_RATE_LIMIT_WINDOW_SECONDS * 1000
  };
}

function isRateLimited(req) {
  const now = Date.now();
  const { max, windowMs } = configuredRateLimit();
  const key = getClientKey(req);
  const current = rateBuckets.get(key);
  if (!current || now - current.startedAt >= windowMs) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > max;
}

function readRequestBody(req) {
  if (req && req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") return Promise.resolve(req.body);
    if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body.toString("utf8"));
    return Promise.resolve(JSON.stringify(req.body));
  }
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      total += Buffer.byteLength(chunk);
      if (total > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("body-too-large"), { code: "body_too_large" }));
        if (typeof req.destroy === "function") req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(chunks.join("")));
    req.on("error", reject);
  });
}

function parseBody(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    return null;
  }
}

function quoteSheetName(name) {
  return "'" + String(name).replace(/'/g, "''") + "'";
}

function createGoogleSheetsStorage() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const tabName = process.env.GOOGLE_SHEETS_TAB_NAME;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!spreadsheetId || !tabName || !email || !privateKey) throw new Error("storage-not-configured");
  const { google } = require("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: [SHEETS_SCOPE]
  });
  const sheets = google.sheets({ version: "v4", auth });
  const tab = quoteSheetName(tabName);
  return {
    async hasSubmission(id) {
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: tab + "!A2:A",
        majorDimension: "ROWS"
      });
      return (result.data.values || []).some((row) => row && row[0] === id);
    },
    async appendRow(row) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: tab + "!A:L",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        includeValuesInResponse: false,
        requestBody: { values: [row] }
      });
    }
  };
}

async function getStorage() {
  if (testStorageFactory) return testStorageFactory();
  return createGoogleSheetsStorage();
}

async function withSubmissionLock(id, work) {
  const previous = submissionLocks.get(id) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  submissionLocks.set(id, current);
  await previous;
  try {
    return await work();
  } finally {
    release();
    if (submissionLocks.get(id) === current) submissionLocks.delete(id);
  }
}

function safeInternalLog(code, status) {
  console.error(JSON.stringify({ event: "submission_request_failed", code, status }));
}

async function handler(req, res) {
  if (!req || req.method !== "POST") return errorResponse(res, 405, "method_not_allowed", "Método não permitido.");
  if (!contentTypeIsJson(req)) return errorResponse(res, 415, "unsupported_media_type", "Tipo de conteúdo não suportado.");

  const contentLength = header(req, "content-length");
  if (contentLength !== undefined) {
    const declared = Number(contentLength);
    if (!Number.isSafeInteger(declared) || declared < 0 || declared > MAX_BODY_BYTES) {
      return errorResponse(res, 400, "payload_too_large", "Dados inválidos.");
    }
  }
  if (isRateLimited(req)) return errorResponse(res, 429, "rate_limited", "Muitas tentativas. Tente novamente mais tarde.");

  let raw;
  try {
    raw = await readRequestBody(req);
  } catch (cause) {
    if (cause && cause.code === "body_too_large") return errorResponse(res, 400, "payload_too_large", "Dados inválidos.");
    safeInternalLog("request_read_failed", 500);
    return errorResponse(res, 500, "internal_error", "Não foi possível processar o envio.");
  }
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return errorResponse(res, 400, "payload_too_large", "Dados inválidos.");
  const payload = parseBody(raw);
  if (!payload) return errorResponse(res, 400, "invalid_json", "Dados inválidos.");

  if (typeof payload.website !== "string" || payload.website.trim() !== "") {
    return errorResponse(res, 400, "invalid_submission", "Não foi possível processar o envio.");
  }
  const validation = validateSubmission(payload);
  if (!validation.ok) return errorResponse(res, 400, "validation_error", "Revise os campos informados.", validation.errors);

  try {
    const result = await withSubmissionLock(payload.id_submissao, async () => {
      const storage = await getStorage();
      if (await storage.hasSubmission(payload.id_submissao)) return { created: false };
      const row = [
        payload.id_submissao,
        formatSubmissionTimestamp(new Date()),
        ...["nome_completo", "cpf", "telefone", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf"]
          .map((field) => validation.normalized[field])
      ];
      await storage.appendRow(row);
      return { created: true };
    });
    return json(res, result.created ? 201 : 200, {
      ok: true,
      code: result.created ? "created" : "already_processed",
      id_submissao: payload.id_submissao
    });
  } catch (_) {
    safeInternalLog("storage_error", 500);
    return errorResponse(res, 500, "internal_error", "Não foi possível processar o envio.");
  }
}

handler.MAX_BODY_BYTES = MAX_BODY_BYTES;
handler._formatSubmissionTimestamp = formatSubmissionTimestamp;
handler._setStorageFactoryForTests = function (factory) { testStorageFactory = factory; };
handler._resetForTests = function () { testStorageFactory = null; rateBuckets.clear(); submissionLocks.clear(); };
handler._createGoogleSheetsStorage = createGoogleSheetsStorage;
handler._quoteSheetName = quoteSheetName;
handler._configuredRateLimit = configuredRateLimit;

module.exports = handler;
