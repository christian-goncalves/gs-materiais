"use strict";

const fs = require("node:fs");
const { google } = require("googleapis");

const spreadsheetId = process.env.SPREADSHEET_ID;
const serviceAccountFile = process.env.SERVICE_ACCOUNT_FILE;
const reportFile = process.env.REPORT_FILE || "/tmp/formulario-encompasso-sheets-access-report.json";
const expectedHeaders = [
  "id_submissao", "data_hora_envio", "nome_completo", "nome_social", "data_nascimento",
  "nacionalidade", "tipo_documento", "documento", "telefone", "email", "pais",
  "estado_provincia", "municipio_cidade", "logradouro_numero", "complemento",
  "bairro_distrito", "cep_codigo_postal"
];

async function main() {
  if (!spreadsheetId || !serviceAccountFile) throw new Error("SPREADSHEET_ID and SERVICE_ACCOUNT_FILE are required");
  const credentials = JSON.parse(fs.readFileSync(serviceAccountFile, "utf8"));
  const auth = new google.auth.GoogleAuth({ credentials: { client_email: credentials.client_email, private_key: credentials.private_key }, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const sheets = google.sheets({ version: "v4", auth });
  const metadata = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets(properties(sheetId,title))" });
  const tab = (metadata.data.sheets || []).find((sheet) => sheet.properties.title === "formulario-encompasso");
  let headers = [];
  if (tab) {
    const values = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'formulario-encompasso'!A1:Q1", majorDimension: "ROWS" });
    headers = values.data.values?.[0] || [];
  }
  const report = { apiRead: true, tabPresent: Boolean(tab), headerCount: headers.length, headersMatch: JSON.stringify(headers) === JSON.stringify(expectedHeaders), publicSharingNotTested: true };
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log("sheets-access: read-allowed");
  console.log(JSON.stringify(report));
}

main().catch((error) => { console.error("sheets-access: failed:" + error.message); process.exitCode = 1; });
