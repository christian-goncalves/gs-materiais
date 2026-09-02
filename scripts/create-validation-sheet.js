"use strict";

const fs = require("node:fs");
const { google } = require("googleapis");

const serviceAccountFile = process.env.SERVICE_ACCOUNT_FILE;
const idFile = process.env.VALIDATION_ID_FILE || "/tmp/formulario-encompasso-validation-id";

async function main() {
  if (!serviceAccountFile) throw new Error("SERVICE_ACCOUNT_FILE is required");
  const credentials = JSON.parse(fs.readFileSync(serviceAccountFile, "utf8"));
  const auth = new google.auth.GoogleAuth({ credentials: { client_email: credentials.client_email, private_key: credentials.private_key }, scopes: ["https://www.googleapis.com/auth/drive.file"] });
  const drive = google.drive({ version: "v3", auth });
  const created = await drive.files.create({ requestBody: { name: "Encompasso Unificado - Validacao", mimeType: "application/vnd.google-apps.spreadsheet" }, fields: "id" });
  if (!created.data.id) throw new Error("validation-spreadsheet-id-missing");
  fs.writeFileSync(idFile, created.data.id + "\n", { mode: 0o600 });
  console.log("validation-sheet-created");
}

main().catch((error) => { console.error("validation-sheet-create: failed:" + error.message); process.exitCode = 1; });
