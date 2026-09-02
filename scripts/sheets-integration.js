"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");
const { randomUUID } = require("node:crypto");
const { google } = require("googleapis");
const handler = require("../api/submissions.js");

const HEADERS = [
  "id_submissao", "data_hora_envio", "nome_completo", "nome_social", "data_nascimento",
  "nacionalidade", "tipo_documento", "documento", "telefone", "email", "pais",
  "estado_provincia", "municipio_cidade", "logradouro_numero", "complemento",
  "bairro_distrito", "cep_codigo_postal"
];
const tabName = "formulario-encompasso";
const serviceAccountFile = process.env.SERVICE_ACCOUNT_FILE;
const idFile = process.env.VALIDATION_ID_FILE || "/tmp/formulario-encompasso-validation-id";
const reportFile = process.env.REPORT_FILE || "/tmp/formulario-encompasso-sheets-report.json";

function quotedTab() { return "'" + tabName + "'"; }

function requestFor(body, ip = "198.51.100.40") {
  const request = Readable.from([JSON.stringify(body)]);
  request.method = "POST";
  request.headers = { "content-type": "application/json", "x-forwarded-for": ip };
  return request;
}

function responseFor() {
  return {
    statusCode: 200, body: "", headers: {},
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(value = "") { this.body += value; },
    json(value) { this.body = JSON.stringify(value); }
  };
}

async function invoke(body) {
  const response = responseFor();
  await handler(requestFor(body), response);
  return { status: response.statusCode, data: JSON.parse(response.body) };
}

async function readRows(sheets, spreadsheetId) {
  const result = await sheets.spreadsheets.values.get({ spreadsheetId, range: quotedTab() + "!A:Q", majorDimension: "ROWS" });
  return result.data.values || [];
}

async function ensureTabAndHeaders(sheets, spreadsheetId) {
  let metadata = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets(properties(sheetId,title))" });
  let sheet = (metadata.data.sheets || []).find((item) => item.properties.title === tabName);
  if (!sheet) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] } });
    metadata = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets(properties(sheetId,title))" });
    sheet = (metadata.data.sheets || []).find((item) => item.properties.title === tabName);
  }
  if (!sheet) throw new Error("controlled-tab-unavailable");
  await sheets.spreadsheets.values.update({ spreadsheetId, range: quotedTab() + "!A1:Q1", valueInputOption: "RAW", requestBody: { values: [HEADERS] } });
  return sheet.properties.sheetId;
}

async function deleteSyntheticRow(sheets, spreadsheetId, sheetId, id) {
  const rows = await readRows(sheets, spreadsheetId);
  const index = rows.findIndex((row) => row && row[0] === id);
  if (index < 1) return false;
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: index, endIndex: index + 1 } } }] } });
  return true;
}

async function main() {
  if (!serviceAccountFile) throw new Error("SERVICE_ACCOUNT_FILE is required");
  const credentials = JSON.parse(fs.readFileSync(serviceAccountFile, "utf8"));
  if (credentials.type !== "service_account") throw new Error("unexpected-credential-type");
  const auth = new google.auth.GoogleAuth({ credentials: { client_email: credentials.client_email, private_key: credentials.private_key }, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const sheets = google.sheets({ version: "v4", auth });

  let spreadsheetId = process.env.VALIDATION_SPREADSHEET_ID;
  if (!spreadsheetId && fs.existsSync(idFile)) spreadsheetId = fs.readFileSync(idFile, "utf8").trim();
  let createdSpreadsheet = false;
  if (!spreadsheetId) {
    const created = await sheets.spreadsheets.create({ requestBody: { properties: { title: "Encompasso Unificado - Validacao" }, sheets: [{ properties: { title: tabName } }] }, fields: "spreadsheetId" });
    spreadsheetId = created.data.spreadsheetId;
    createdSpreadsheet = true;
    fs.writeFileSync(idFile, spreadsheetId + "\n", { mode: 0o600 });
  }
  const sheetId = await ensureTabAndHeaders(sheets, spreadsheetId);
  const before = await readRows(sheets, spreadsheetId);
  const id = randomUUID();
  const fixture = {
    id_submissao: id, nome_completo: "Amostra Sintética", nome_social: "", data_nascimento: "1990-01-01",
    nacionalidade: "Brasileira", tipo_documento: "cpf", documento: "529.982.247-25", telefone: "(11) 99876-5432",
    email: "fixture@example.invalid", pais: "Brasil", estado_provincia: "São Paulo", municipio_cidade: "São Paulo",
    logradouro_numero: "Rua Sintética, 123", complemento: "=VALOR_SINTETICO", bairro_distrito: "Centro",
    cep_codigo_postal: "SW1A 1AA", website: ""
  };
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = credentials.client_email;
  process.env.GOOGLE_PRIVATE_KEY = credentials.private_key;
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID = spreadsheetId;
  process.env.GOOGLE_SHEETS_TAB_NAME = tabName;
  process.env.RATE_LIMIT_MAX_REQUESTS = "5";
  process.env.RATE_LIMIT_WINDOW_SECONDS = "60";
  handler._resetForTests();

  let cleanup = false;
  try {
    const createdResponse = await invoke(fixture);
    const afterCreate = await readRows(sheets, spreadsheetId);
    const duplicateResponse = await invoke(fixture);
    const afterDuplicate = await readRows(sheets, spreadsheetId);
    const createdRow = afterCreate.find((row) => row && row[0] === id);
    const formulaGrid = await sheets.spreadsheets.get({ spreadsheetId, ranges: [quotedTab() + "!A1:Q"], includeGridData: true, fields: "sheets(data(rowData(values(userEnteredValue))))" });
    const gridRows = formulaGrid.data.sheets?.[0]?.data?.[0]?.rowData || [];
    const gridRow = gridRows.find((row) => row.values?.[0]?.userEnteredValue?.stringValue === id);
    const literalCell = gridRow?.values?.[14]?.userEnteredValue || {};
    cleanup = await deleteSyntheticRow(sheets, spreadsheetId, sheetId, id);
    const afterCleanup = await readRows(sheets, spreadsheetId);
    let publicStatus = "not-checked";
    try {
      const publicResponse = await fetch("https://docs.google.com/spreadsheets/d/" + spreadsheetId + "/export?format=csv");
      const publicBody = await publicResponse.text();
      publicStatus = publicResponse.status + ":" + (publicBody.includes("id_submissao") ? "readable" : "not-readable");
    } catch (_) { publicStatus = "unavailable"; }
    const report = {
      createdSpreadsheet, apiCall: "sheets-read-write", tab: tabName, headerCount: HEADERS.length,
      headerOrder: afterCreate[0] || [], beforeRows: before.length, afterCreateRows: afterCreate.length,
      afterDuplicateRows: afterDuplicate.length, createdStatus: createdResponse.status,
      duplicateStatus: duplicateResponse.status, storedRowLength: createdRow?.length || 0,
      storedTimestampIsUtc: /^\d{4}-\d{2}-\d{2}T.*Z$/.test(createdRow?.[1] || ""),
      storedCpfIsDigits: /^\d{11}$/.test(createdRow?.[7] || ""), storedPhoneIsE164: /^\+55\d{10,11}$/.test(createdRow?.[8] || ""),
      storedEmailIsLowercase: createdRow?.[9] === "fixture@example.invalid", literalStoredAsString: literalCell.stringValue === "=VALOR_SINTETICO" && literalCell.formulaValue === undefined,
      cleanup, afterCleanupRows: afterCleanup.length, publicAccess: publicStatus, idFile: path.basename(idFile)
    };
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), { mode: 0o600 });
    if (createdResponse.status !== 201 || duplicateResponse.status !== 200 || afterDuplicate.length !== afterCreate.length || !createdRow || createdRow.length !== 17 || !report.literalStoredAsString || !cleanup) throw new Error("sheets-integration-assertion-failed");
    console.log("sheets-integration: passed");
    console.log(JSON.stringify({ createdStatus: createdResponse.status, duplicateStatus: duplicateResponse.status, headerCount: report.headerCount, storedRowLength: report.storedRowLength, cleanup: report.cleanup, publicAccess: report.publicAccess }));
  } catch (error) {
    if (!cleanup) {
      try { await deleteSyntheticRow(sheets, spreadsheetId, sheetId, id); } catch (_) {}
    }
    throw error;
  } finally {
    handler._resetForTests();
  }
}

main().catch((error) => { console.error("sheets-integration: failed:" + error.message); process.exitCode = 1; });
