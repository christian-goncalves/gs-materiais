"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const serverPort = 3317;
const debugPort = 9333;
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:" + serverPort;

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function waitFor(url, predicate, timeout = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url);
      const value = await response.text();
      if (predicate(value, response)) return value;
    } catch (_) {}
    await sleep(100);
  }
  throw new Error("timeout:" + url);
}

class CdpClient {
  constructor(url) { this.url = url; this.nextId = 1; this.pending = new Map(); this.events = []; }
  async connect() {
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message)); else pending.resolve(message.result);
      } else if (message.method) this.events.push(message);
    });
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.socket.send(JSON.stringify({ id, method, params })); });
  }
  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "browser-evaluation-failed");
    return result.result && result.result.value;
  }
  close() { if (this.socket) this.socket.close(); }
}

async function main() {
  const server = process.env.BASE_URL ? null : spawn(process.execPath, [path.join(root, "scripts/dev-server.js")], { env: Object.assign({}, process.env, { PORT: String(serverPort) }), stdio: "ignore" });
  await waitFor(baseUrl, (body) => body.includes("Encompasso Unificado"));
  const chromeProfile = fs.mkdtempSync(path.join(os.tmpdir(), "formulario-encompasso-chrome-"));
  const chrome = spawn("google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=" + debugPort, "--user-data-dir=" + chromeProfile, baseUrl], { stdio: "ignore" });
  let cdp;
  try {
    const targets = JSON.parse(await waitFor("http://127.0.0.1:" + debugPort + "/json/list", (body) => body.includes("webSocketDebuggerUrl")));
    const target = targets.find((item) => item.type === "page") || targets[0];
    cdp = new CdpClient(target.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    await cdp.send("Page.navigate", { url: baseUrl });
    await waitFor(baseUrl, (body) => body.includes("Encompasso Unificado"));
    await sleep(400);
    await cdp.evaluate("document.readyState");

    const structural = JSON.parse(await cdp.evaluate(`JSON.stringify({
      cards: document.querySelectorAll('.form-card').length,
      fields: [...document.querySelectorAll('input[name], select[name]')].filter((field) => field.name !== 'website').map((field) => field.name),
      required: [...document.querySelectorAll('input[name], select[name]')].filter((field) => field.name !== 'website' && field.required).map((field) => field.name),
      hasHoneypot: Boolean(document.querySelector('#website')), hasHeading: document.querySelector('h1')?.textContent.trim(),
      scrollWidth: document.documentElement.scrollWidth, viewport: window.innerWidth
    })`));
    assert.equal(structural.cards, 3);
    assert.deepEqual(structural.fields, ["nome_completo", "nome_social", "data_nascimento", "nacionalidade", "tipo_documento", "documento", "telefone", "email", "pais", "estado_provincia", "municipio_cidade", "logradouro_numero", "complemento", "bairro_distrito", "cep_codigo_postal"]);
    assert.equal(structural.required.length, 13);
    assert.equal(structural.hasHeading, "Encompasso Unificado");

    const passport = await cdp.evaluate(`(() => {
      const form = document.querySelector('#encompasso-form'); const type = document.querySelector('#tipo_documento'); const doc = document.querySelector('#documento');
      type.value = 'passaporte'; type.dispatchEvent(new Event('change', { bubbles: true })); doc.value = 'ABCD'; doc.dispatchEvent(new Event('input', { bubbles: true })); form.requestSubmit();
      return { message: document.querySelector('#documento-error').textContent, mode: doc.inputMode, maxLength: doc.maxLength };
    })()`);
    assert.equal(passport.message, "Você digitou um número insuficiente de caracteres.");
    assert.equal(passport.mode, "text");
    assert.equal(passport.maxLength, 30);

    const failure = await cdp.evaluate(`(async () => {
      const type = document.querySelector('#tipo_documento'); type.value = 'cpf'; type.dispatchEvent(new Event('change', { bubbles: true }));
      const values = { nome_completo:'Amostra Sintética', data_nascimento:'1990-01-01', nacionalidade:'Brasileira', documento:'529.982.247-25', telefone:'(11) 99876-5432', email:'fixture@example.invalid', pais:'Brasil', estado_provincia:'São Paulo', municipio_cidade:'São Paulo', logradouro_numero:'Rua Sintética, 123', bairro_distrito:'Centro', cep_codigo_postal:'SW1A 1AA' };
      for (const [name, value] of Object.entries(values)) document.querySelector('[name="' + name + '"]').value = value;
      window.fetch = () => Promise.reject(new Error('synthetic-network-failure')); document.querySelector('#encompasso-form').requestSubmit(); await new Promise((resolve) => setTimeout(resolve, 0));
      return { attempt: window.EncompassoApp.getAttemptId(), name: document.querySelector('[name="nome_completo"]').value, status: document.querySelector('#form-status').textContent, enabled: !document.querySelector('#submit-button').disabled };
    })()`);
    assert.match(failure.attempt, /^[0-9a-f-]{36}$/i);
    assert.equal(failure.name, "Amostra Sintética");
    assert.match(failure.status, /Não foi possível enviar/);
    assert.equal(failure.enabled, true);

    const multipleClick = await cdp.evaluate(`(async () => {
      let calls = 0; let resolveFetch; window.fetch = () => { calls += 1; return new Promise((resolve) => { resolveFetch = resolve; }); };
      document.querySelector('#encompasso-form').requestSubmit(); document.querySelector('#encompasso-form').requestSubmit(); await Promise.resolve();
      const before = { calls, disabled: document.querySelector('#submit-button').disabled };
      resolveFetch(new Response(JSON.stringify({ ok:true }), { status: 201, headers: { 'Content-Type':'application/json' } })); await new Promise((resolve) => setTimeout(resolve, 25));
      return { before, success: document.querySelector('#form-status').textContent };
    })()`);
    assert.deepEqual(multipleClick.before, { calls: 1, disabled: true });
    assert.equal(multipleClick.success, "Dados enviados com sucesso.");

    const finalState = JSON.parse(await cdp.evaluate(`JSON.stringify({ empty: [...document.querySelectorAll('input[name], select[name]')].filter((field) => field.name !== 'website').every((field) => field.value === ''), attempt: window.EncompassoApp.getAttemptId(), scrollWidth: document.documentElement.scrollWidth })`));
    assert.equal(finalState.empty, true);
    assert.equal(finalState.attempt, null);

    const responsive = [];
    for (const width of [360, 768, 1280]) {
      await cdp.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 680 });
      responsive.push(JSON.parse(await cdp.evaluate("JSON.stringify({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth })")));
    }
    assert.ok(responsive.every((entry) => entry.scrollWidth <= entry.width && entry.bodyScrollWidth <= entry.width));

    const screenshot = await cdp.send("Page.captureScreenshot", { format: "png" });
    const screenshotPath = path.join(os.tmpdir(), "formulario-encompasso-browser.png");
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));
    const report = { structural, passport, failure: { preserved: failure.name, status: failure.status, uuidPresent: Boolean(failure.attempt) }, multipleClick, finalState, responsive, screenshotPath, consoleErrors: cdp.events.filter((event) => event.method === "Runtime.exceptionThrown").length };
    fs.writeFileSync(path.join(os.tmpdir(), "formulario-encompasso-browser-report.json"), JSON.stringify(report, null, 2));
    console.log("browser-check: passed");
    console.log(JSON.stringify({ cards: structural.cards, fields: structural.fields.length, passportMessage: passport.message, multipleClicks: multipleClick.before.calls, responsive, consoleErrors: report.consoleErrors }));
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
    if (server) server.kill();
  }
}

main().catch((error) => { console.error("browser-check: failed:" + error.message); process.exitCode = 1; });
