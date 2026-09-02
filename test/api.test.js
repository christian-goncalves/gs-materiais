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
    nome_social: "",
    data_nascimento: "1990-01-01",
    nacionalidade: "Brasileira",
    tipo_documento: "cpf",
    documento: "529.982.247-25",
    telefone: "(11) 99876-5432",
    email: "fixture@example.invalid",
    pais: "Brasil",
    estado_provincia: "São Paulo",
    municipio_cidade: "São Paulo",
    logradouro_numero: "Rua Sintética, 123",
    complemento: "=VALOR_SINTETICO",
    bairro_distrito: "Centro",
    cep_codigo_postal: "SW1A 1AA",
    website: ""
  }, overrides);
}

function makeResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(value = "") { this.body += value; this.done = true; },
    json(value) { this.body = JSON.stringify(value); this.done = true; }
  };
}

function makeRequest(method, body, headers = {}, ip = "198.51.100.10") {
  const request = Readable.from(body === undefined ? [] : [typeof body === "string" ? body : JSON.stringify(body)]);
  request.method = method;
  request.headers = Object.assign({ "content-type": "application/json", "x-forwarded-for": ip }, headers);
  return request;
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

test("cria uma linha sintética com 17 colunas e timestamp UTC server-side", async () => {
  const { rows } = setupStore();
  const result = await invoke();
  assert.equal(result.res.statusCode, 201);
  assert.equal(result.data.code, "created");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].length, 17);
  assert.equal(rows[0][0], payload().id_submissao);
  assert.match(rows[0][1], /^\d{4}-\d{2}-\d{2}T.*Z$/);
  assert.equal(rows[0][7], "52998224725");
  assert.equal(rows[0][8], "+5511998765432");
  assert.equal(rows[0][9], "fixture@example.invalid");
  assert.equal(rows[0][14], "=VALOR_SINTETICO");
});

test("retorna 200 no mesmo UUID sem criar duplicidade", async () => {
  const { rows } = setupStore();
  const first = await invoke();
  const second = await invoke();
  assert.equal(first.res.statusCode, 201);
  assert.equal(second.res.statusCode, 200);
  assert.equal(second.data.code, "already_processed");
  assert.equal(rows.length, 1);
});

test("bloqueia método, Content-Type, JSON inválido e honeypot antes do armazenamento", async () => {
  const { rows } = setupStore();
  assert.equal((await invoke("GET", "not-read", { "content-type": "text/plain" })).res.statusCode, 405);
  assert.equal((await invoke("POST", payload(), { "content-type": "text/plain" }, "198.51.100.11")).res.statusCode, 415);
  assert.equal((await invoke("POST", "{broken", {}, "198.51.100.12")).res.statusCode, 400);
  const honey = await invoke("POST", payload({ id_submissao: randomUUID(), website: "bot" }), {}, "198.51.100.13");
  assert.equal(honey.res.statusCode, 400);
  assert.equal(honey.data.code, "invalid_submission");
  assert.equal(rows.length, 0);
});

test("rejeita dados inválidos com erros por campo e não grava", async () => {
  const { rows } = setupStore();
  const result = await invoke("POST", payload({ id_submissao: "bad", nome_completo: "", telefone: "123", email: "bad" }), {}, "198.51.100.14");
  assert.equal(result.res.statusCode, 400);
  assert.equal(result.data.code, "validation_error");
  assert.ok(result.data.errors.nome_completo);
  assert.ok(result.data.errors.telefone);
  assert.ok(result.data.errors.email);
  assert.equal(rows.length, 0);
});

test("rejeita corpo grande antes da camada de armazenamento", async () => {
  const { rows } = setupStore();
  const result = await invoke("POST", payload(), { "content-length": String(handler.MAX_BODY_BYTES + 1) }, "198.51.100.15");
  assert.equal(result.res.statusCode, 400);
  assert.equal(result.data.code, "payload_too_large");
  assert.equal(rows.length, 0);
});

test("aplica 5 requisições por janela e retorna 429 na seguinte", async () => {
  setupStore();
  for (let index = 0; index < 5; index += 1) {
    const result = await invoke("POST", payload({ id_submissao: randomUUID() }), {}, "198.51.100.16");
    assert.notEqual(result.res.statusCode, 429);
  }
  const limited = await invoke("POST", payload({ id_submissao: randomUUID() }), {}, "198.51.100.16");
  assert.equal(limited.res.statusCode, 429);
  assert.equal(limited.data.code, "rate_limited");
});

test("mapeia falha do armazenamento para 500 genérico e log sanitizado", async () => {
  setupStore({ failAppend: true });
  const originalError = console.error;
  const logs = [];
  console.error = (message) => logs.push(String(message));
  try {
    const result = await invoke("POST", payload({ id_submissao: randomUUID() }), {}, "198.51.100.17");
    assert.equal(result.res.statusCode, 500);
    assert.equal(result.data.code, "internal_error");
    assert.doesNotMatch(result.res.body, /synthetic|fixture|529|Rua|@/);
    assert.equal(logs.length, 1);
    assert.doesNotMatch(logs[0], /synthetic|fixture|529|Rua|@/);
  } finally {
    console.error = originalError;
  }
});
