"use strict";

const fs = require("node:fs");
const { google } = require("googleapis");

const serviceAccountFile = process.env.SERVICE_ACCOUNT_FILE;
const spreadsheetId = process.env.SPREADSHEET_ID;
const submissionId = process.env.SUBMISSION_ID;
const reportFile = process.env.REPORT_FILE || "/tmp/formulario-encompasso-reconcile-report.json";

async function main() {
  if (!serviceAccountFile || !spreadsheetId || !submissionId) throw new Error("SERVICE_ACCOUNT_FILE, SPREADSHEET_ID and SUBMISSION_ID are required");
  const credentials = JSON.parse(fs.readFileSync(serviceAccountFile, "utf8"));
  const auth = new google.auth.GoogleAuth({ credentials: { client_email: credentials.client_email, private_key: credentials.private_key }, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const sheets = google.sheets({ version: "v4", auth });
  const metadata = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets(properties(sheetId,title))" });
  const tab = (metadata.data.sheets || []).find((item) => item.properties.title === "formulario-encompasso");
  if (!tab) throw new Error("tab-not-found");
  const read = async () => (await sheets.spreadsheets.values.get({ spreadsheetId, range: "'formulario-encompasso'!A:Q", majorDimension: "ROWS" })).data.values || [];
  const before = await read();
  const matches = before.map((row, index) => ({ row, index })).filter((item) => item.row?.[0] === submissionId);
  const item = matches[0];
  if (matches.length !== 1 || !item || item.index < 1) throw new Error("synthetic-row-count-unexpected");
  const row = item.row;
  const report = { rowsBefore: before.length, matchingRows: matches.length, rowLength: row.length, timestampIsUtc: /^\d{4}-\d{2}-\d{2}T.*Z$/.test(row[1] || ""), cpfIsDigits: /^\d{11}$/.test(row[7] || ""), phoneIsE164: /^\+55\d{10,11}$/.test(row[8] || ""), emailLowercase: row[9] === "fixture@example.invalid", formulaLikeValuePreserved: row[14] === "=VALOR_SINTETICO" };
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ deleteDimension: { range: { sheetId: tab.properties.sheetId, dimension: "ROWS", startIndex: item.index, endIndex: item.index + 1 } } }] } });
  const after = await read();
  report.rowsAfterCleanup = after.length;
  report.cleaned = !after.some((candidate) => candidate?.[0] === submissionId);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), { mode: 0o600 });
  if (!report.cleaned || report.rowLength !== 17 || !report.timestampIsUtc || !report.cpfIsDigits || !report.phoneIsE164 || !report.formulaLikeValuePreserved) throw new Error("synthetic-row-assertion-failed");
  console.log("reconcile-synthetic: passed");
  console.log(JSON.stringify({ rowsBefore: report.rowsBefore, matchingRows: report.matchingRows, rowLength: report.rowLength, cleaned: report.cleaned }));
}

main().catch((error) => { console.error("reconcile-synthetic: failed:" + error.message); process.exitCode = 1; });
