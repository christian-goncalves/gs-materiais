"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const required = ["index.html", "css/styles.css", "js/validation.js", "js/app.js", "api/submissions.js", "package.json"];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error("missing-required-file:" + file);
}
for (const file of ["js/validation.js", "js/app.js", "api/submissions.js", "scripts/dev-server.js"]) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  try { new Function(source); } catch (error) { throw new Error("syntax-error:" + file + ":" + error.message); }
}
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
if ((html.match(/class="form-card"/g) || []).length !== 1) throw new Error("expected-one-form-card");
for (const text of ["GS Materiais", "Preencha seus dados nos campos abaixo.", "Dados pessoais"]) {
  if (!html.includes(text)) throw new Error("missing-required-copy:" + text);
}
const app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
if (!app.includes("/api/submissions")) throw new Error("missing-api-contract");
if (html.includes("Encompasso") || html.includes("Passaporte") || html.includes("email")) throw new Error("legacy-form-content-found");
console.log("build-check: passed");
