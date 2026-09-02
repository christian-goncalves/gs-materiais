"use strict";

const fs = require("node:fs");
const { google } = require("googleapis");

const serviceAccountFile = process.env.SERVICE_ACCOUNT_FILE;
const spreadsheetId = process.env.SPREADSHEET_ID;
const tabName = "formulario-encompasso";
const expectedHeaders = [
  "id_submissao", "data_hora_envio", "nome_completo", "nome_social", "data_nascimento",
  "nacionalidade", "tipo_documento", "documento", "telefone", "email", "pais",
  "estado_provincia", "municipio_cidade", "logradouro_numero", "complemento",
  "bairro_distrito", "cep_codigo_postal"
];

async function main() {
  if (!serviceAccountFile || !spreadsheetId) throw new Error("SERVICE_ACCOUNT_FILE and SPREADSHEET_ID are required");
  const credentials = JSON.parse(fs.readFileSync(serviceAccountFile, "utf8"));
  const auth = new google.auth.GoogleAuth({ credentials: { client_email: credentials.client_email, private_key: credentials.private_key }, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const sheets = google.sheets({ version: "v4", auth });
  const metadata = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets(properties(sheetId,title))" });
  const tab = (metadata.data.sheets || []).find((item) => item.properties.title === tabName);
  if (!tab) throw new Error("production-tab-not-found");
  const values = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'formulario-encompasso'!A:Q", majorDimension: "ROWS" });
  const rows = values.data.values || [];
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => String(cell || "") !== ""));
  if (dataRows.length) throw new Error("production-has-data");
  const currentHeaders = rows[0] || [];
  let headersWritten = false;
  if (JSON.stringify(currentHeaders) !== JSON.stringify(expectedHeaders)) {
    if (currentHeaders.length) throw new Error("production-header-mismatch");
    await sheets.spreadsheets.values.update({ spreadsheetId, range: "'formulario-encompasso'!A1:Q1", valueInputOption: "RAW", requestBody: { values: [expectedHeaders] } });
    headersWritten = true;
  }
  const verified = (await sheets.spreadsheets.values.get({ spreadsheetId, range: "'formulario-encompasso'!A1:Q1", majorDimension: "ROWS" })).data.values?.[0] || [];
  const report = { tabName, dataRowsBefore: dataRows.length, headersWritten, headerCount: verified.length, headersMatch: JSON.stringify(verified) === JSON.stringify(expectedHeaders) };
  console.log(JSON.stringify(report));
  if (!report.headersMatch) throw new Error("production-header-verification-failed");
}

main().catch((error) => { console.error("production-sheet: failed:" + error.message); process.exitCode = 1; });
