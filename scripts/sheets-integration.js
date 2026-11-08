"use strict";

const fs = require("node:fs");
const { Readable } = require("node:stream");
const { randomUUID } = require("node:crypto");
const { google } = require("googleapis");
const handler = require("../api/submissions.js");

const HEADERS = ["id_submissao", "data_hora_envio", "nome_completo", "cpf", "telefone", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf", "autorizacao_dados_ficha_branca"];
const spreadsheetId = process.env.GS_MATERIAIS_VALIDATION_SPREADSHEET_ID;
const tabName = process.env.GOOGLE_SHEETS_TAB_NAME;
const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const reportFile = process.env.REPORT_FILE || "/tmp/gs-materiais-sheets-report.json";
function quotedTab() { return "'" + tabName.replace(/'/g, "''") + "'"; }
function requestFor(body, ip = "198.51.100.40") {
  const request = Readable.from([JSON.stringify(body)]);
  request.method = "POST";
  request.headers = { "content-type": "application/json", "x-forwarded-for": ip };
  return request;
}
function responseFor() {
  return { statusCode: 200, body: "", headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value; }, end(value = "") { this.body += value; }, json(value) { this.body = JSON.stringify(value); } };
}
async function invoke(body) {
  const response = responseFor(); await handler(requestFor(body), response);
  return { status: response.statusCode, data: JSON.parse(response.body) };
}
async function readRows(sheets) {
  const result = await sheets.spreadsheets.values.get({ spreadsheetId, range: quotedTab() + "!A:M", majorDimension: "ROWS" });
  return result.data.values || [];
}
async function removeSyntheticRow(sheets, sheetId, id) {
  const rows = await readRows(sheets);
  const index = rows.findIndex((row) => row && row[0] === id);
  if (index < 1) return false;
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: index, endIndex: index + 1 } } }] } });
  return true;
}

async function main() {
  if (process.env.GS_MATERIAIS_VALIDATION_SHEET !== "confirmed" || !spreadsheetId || !tabName || !email || !privateKey) {
    throw new Error("requires-confirmed-GS-Materiais-validation-sheet-and-Google-credentials");
  }
  const auth = new google.auth.GoogleAuth({ credentials: { client_email: email, private_key: privateKey }, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const sheets = google.sheets({ version: "v4", auth });
  const metadata = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets(properties(sheetId,title))" });
  const sheet = (metadata.data.sheets || []).find((item) => item.properties.title === tabName);
  if (!sheet) throw new Error("validation-tab-not-found");
  const before = await readRows(sheets);
  if (JSON.stringify(before[0] || []) !== JSON.stringify(HEADERS)) throw new Error("validation-header-contract-mismatch");

  const id = randomUUID();
  const fixture = {
    id_submissao: id, nome_completo: "Amostra Sintética", cpf: "529.982.247-25", telefone: "(11) 99876-5432",
    cep: "01001000", logradouro: "Praça Sintética", numero: "123", complemento: "=TEXTO_SINTETICO",
    bairro: "Centro", cidade: "São Paulo", uf: "sp", website: "", autorizacao_dados_ficha_branca: true
  };
  process.env.RATE_LIMIT_MAX_REQUESTS = "5";
  process.env.RATE_LIMIT_WINDOW_SECONDS = "60";
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID = spreadsheetId;
  process.env.GOOGLE_SHEETS_TAB_NAME = tabName;
  handler._resetForTests();
  let cleanup = false;
  try {
    const created = await invoke(fixture);
    const afterCreate = await readRows(sheets);
    const retry = await invoke(fixture);
    const afterRetry = await readRows(sheets);
    const row = afterCreate.find((item) => item && item[0] === id);
    const grid = await sheets.spreadsheets.get({ spreadsheetId, ranges: [quotedTab() + "!I:I"], includeGridData: true, fields: "sheets(data(rowData(values(userEnteredValue))))" });
    const cells = grid.data.sheets?.[0]?.data?.[0]?.rowData || [];
    const literal = cells.some((line) => line.values?.[0]?.userEnteredValue?.stringValue === "=TEXTO_SINTETICO" && line.values[0].userEnteredValue.formulaValue === undefined);
    cleanup = await removeSyntheticRow(sheets, sheet.properties.sheetId, id);
    const afterCleanup = await readRows(sheets);
    const report = {
      headerCount: HEADERS.length, headersMatch: JSON.stringify(before[0]) === JSON.stringify(HEADERS),
      rowsBefore: before.length, rowsAfterCreate: afterCreate.length, rowsAfterRetry: afterRetry.length,
      createdStatus: created.status, retryStatus: retry.status, storedRowLength: row?.length || 0,
      timestampIsBrazilian: /^\d{2}\/\d{2}\/\d{4} \| \d{2}:\d{2}$/.test(row?.[1] || ""), cpfIsDigits: /^\d{11}$/.test(row?.[3] || ""),
      phoneIsE164: /^\+55\d{10,11}$/.test(row?.[4] || ""), cepIsEightDigits: /^\d{8}$/.test(row?.[5] || ""),
      formulaLikeTextStoredLiterally: literal, cleanup, rowsAfterCleanup: afterCleanup.length
    };
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), { mode: 0o600 });
    if (created.status !== 201 || retry.status !== 200 || afterRetry.length !== afterCreate.length || row?.length !== 13 || row?.[12] !== "TRUE" || !report.timestampIsBrazilian || !literal || !cleanup) throw new Error("sheets-integration-assertion-failed");
    console.log("sheets-integration: passed");
    console.log(JSON.stringify({ headerCount: report.headerCount, createdStatus: report.createdStatus, retryStatus: report.retryStatus, storedRowLength: report.storedRowLength, cleanup: report.cleanup }));
  } catch (error) {
    if (!cleanup) { try { await removeSyntheticRow(sheets, sheet.properties.sheetId, id); } catch (_) {} }
    throw error;
  } finally { handler._resetForTests(); }
}
main().catch((error) => { console.error("sheets-integration: failed:" + error.message); process.exitCode = 1; });
