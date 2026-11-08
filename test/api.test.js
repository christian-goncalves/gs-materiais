"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const { randomUUID } = require("node:crypto");
const handler = require("../api/submissions.js");

function payload(overrides = {}) {
  return Object.assign({
    id_submissao: "11111111-1111-4111-8111-111111111111",
    nome_completo: "Amostra Sintética",
    cpf: "529.982.247-25",
    telefone: "(11) 99876-5432",
    cep: "01001000",
    logradouro: "Praça Sintética",
    numero: "123",
    complemento: "=TEXTO_SINTETICO",
    bairro: "Centro",
    cidade: "São Paulo",
    uf: "sp",
    website: "",
    autorizacao_dados_ficha_branca: true
  }, overrides);
}
function makeResponse() {
  return { statusCode: 200, headers: {}, body: "", setHeader(name, value) { this.headers[name.toLowerCase()] = value; }, end(value = "") { this.body += value; }, json(value) { this.body = JSON.stringify(value); } };
}
function makeRequest(method, body, headers = {}, ip = "198.51.100.10") {
  const req = Readable.from(body === undefined ? [] : [typeof body === "string" ? body : JSON.stringify(body)]);
  req.method = method;
  req.headers = Object.assign({ "content-type": "application/json", "x-forwarded-for": ip }, headers);
  return req;
}
async function invoke(method = "POST", body = payload(), headers = {}, ip) {
  const req = makeRequest(method, body, headers, ip);
  const res = makeResponse();
  await handler(req, res);
  return { req, res, data: JSON.parse(res.body) };
}
function setupStore(options = {}) {
  const rows = [];
  const store = {
    async hasSubmission(id) { return rows.some((row) => row[0] === id); },
    async appendRow(row) { if (options.failAppend) throw new Error("synthetic-storage-failure"); rows.push(row); }
  };
  handler._setStorageFactoryForTests(() => store);
  return { rows, store };
}

test.beforeEach(() => {
  handler._resetForTests();
  process.env.RATE_LIMIT_MAX_REQUESTS = "5";
  process.env.RATE_LIMIT_WINDOW_SECONDS = "60";
});
test.after(() => {
  delete process.env.RATE_LIMIT_MAX_REQUESTS;
  delete process.env.RATE_LIMIT_WINDOW_SECONDS;
  handler._resetForTests();
});

test("grava 13 valores sintéticos na ordem A-M com data e hora brasileiras", async () => {
  const { rows } = setupStore();
  const result = await invoke();
  assert.equal(result.res.statusCode, 201);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].length, 13);
  assert.deepEqual(rows[0].slice(2), ["Amostra Sintética", "52998224725", "+5511998765432", "01001000", "Praça Sintética", "123", "=TEXTO_SINTETICO", "Centro", "São Paulo", "SP"]);
  assert.equal(rows[0][12], "TRUE");
  assert.equal(rows[0][0], payload().id_submissao);
  assert.match(rows[0][1], /^\d{2}\/\d{2}\/\d{4} \| \d{2}:\d{2}$/);
});

test("formata data_hora_envio no fuso de São Paulo", () => {
  assert.equal(handler._formatSubmissionTimestamp(new Date("2026-11-08T12:34:00Z")), "08/11/2026 | 09:34");
});

test("retry do mesmo UUID retorna 200 e não duplica linha", async () => {
  const { rows } = setupStore();
  assert.equal((await invoke()).res.statusCode, 201);
  const retry = await invoke();
  assert.equal(retry.res.statusCode, 200);
  assert.equal(retry.data.code, "already_processed");
  assert.equal(rows.length, 1);
});

test("bloqueia método, tipo de conteúdo, JSON inválido, honeypot e payload antigo", async () => {
  const { rows } = setupStore();
  assert.equal((await invoke("GET", "not-read", { "content-type": "text/plain" })).res.statusCode, 405);
  assert.equal((await invoke("POST", payload(), { "content-type": "text/plain" }, "198.51.100.11")).res.statusCode, 415);
  assert.equal((await invoke("POST", "{broken", {}, "198.51.100.12")).res.statusCode, 400);
  assert.equal((await invoke("POST", payload({ id_submissao: randomUUID(), website: "bot" }), {}, "198.51.100.13")).res.statusCode, 400);
  const old = Object.assign(payload({ id_submissao: randomUUID() }), { email: "fixture@example.invalid", documento: "52998224725" });
  const oldResult = await invoke("POST", old, {}, "198.51.100.14");
  assert.equal(oldResult.res.statusCode, 400);
  assert.equal(oldResult.data.code, "validation_error");
  assert.equal(rows.length, 0);
});

test("rejeita campos inválidos e complemento acima de 50 caracteres sem gravar", async () => {
  const { rows } = setupStore();
  const result = await invoke("POST", payload({ nome_completo: "", cpf: "11111111111", telefone: "123", cep: "1234567" }), {}, "198.51.100.15");
  assert.equal(result.res.statusCode, 400);
  assert.ok(result.data.errors.nome_completo);
  assert.ok(result.data.errors.cpf);
  assert.ok(result.data.errors.telefone);
  assert.ok(result.data.errors.cep);
  const longComplement = await invoke("POST", payload({ id_submissao: randomUUID(), complemento: "x".repeat(51) }), {}, "198.51.100.16");
  assert.equal(longComplement.res.statusCode, 400);
  assert.ok(longComplement.data.errors.complemento);
  assert.equal(rows.length, 0);
});

test("rejeita corpo grande e aplica rate limit 5 por 60 segundos", async () => {
  const { rows } = setupStore();
  const large = await invoke("POST", payload(), { "content-length": String(handler.MAX_BODY_BYTES + 1) }, "198.51.100.17");
  assert.equal(large.res.statusCode, 400);
  assert.equal(large.data.code, "payload_too_large");
  for (let i = 0; i < 5; i += 1) assert.notEqual((await invoke("POST", payload({ id_submissao: randomUUID() }), {}, "198.51.100.18")).res.statusCode, 429);
  const limited = await invoke("POST", payload({ id_submissao: randomUUID() }), {}, "198.51.100.18");
  assert.equal(limited.res.statusCode, 429);
  assert.equal(limited.data.code, "rate_limited");
  assert.equal(rows.length, 5);
});

test("falha de armazenamento retorna 500 genérico sem dados pessoais nos logs", async () => {
  setupStore({ failAppend: true });
  const originalError = console.error;
  const logs = [];
  console.error = (message) => logs.push(String(message));
  try {
    const result = await invoke("POST", payload({ id_submissao: randomUUID() }));
    assert.equal(result.res.statusCode, 500);
    assert.equal(result.data.code, "internal_error");
    assert.doesNotMatch(result.res.body, /Amostra|529|Praça|synthetic|@/);
    assert.equal(logs.length, 1);
    assert.doesNotMatch(logs[0], /Amostra|529|Praça|synthetic|@/);
  } finally { console.error = originalError; }
});
