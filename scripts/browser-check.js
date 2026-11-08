"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const WebSocket = require("ws");

const root = path.resolve(__dirname, "..");
const serverPort = 3317;
const debugPort = 9333;
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:" + serverPort;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(url, predicate, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const response = await fetch(url); const value = await response.text(); if (predicate(value, response)) return value; } catch (_) {}
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
        const pending = this.pending.get(message.id); this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message)); else pending.resolve(message.result);
      } else if (message.method) this.events.push(message);
    });
    await new Promise((resolve, reject) => { this.socket.addEventListener("open", resolve, { once: true }); this.socket.addEventListener("error", reject, { once: true }); });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.socket.send(JSON.stringify({ id, method, params })); });
  }
  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "browser-evaluation-failed");
    return result.result && result.result.value;
  }
  close() { if (this.socket) this.socket.close(); }
}

async function main() {
  const server = process.env.BASE_URL ? null : spawn(process.execPath, [path.join(root, "scripts/dev-server.js")], { env: Object.assign({}, process.env, { PORT: String(serverPort) }), stdio: "ignore" });
  await waitFor(baseUrl, (html) => html.includes("GS Materiais"));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "gs-materiais-chrome-"));
  const chrome = spawn("google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=" + debugPort, "--user-data-dir=" + profile, baseUrl], { stdio: "ignore" });
  let cdp;
  try {
    const targets = JSON.parse(await waitFor("http://127.0.0.1:" + debugPort + "/json/list", (body) => body.includes("webSocketDebuggerUrl")));
    const target = targets.find((item) => item.type === "page") || targets[0];
    cdp = new CdpClient(target.webSocketDebuggerUrl); await cdp.connect();
    await cdp.send("Runtime.enable"); await cdp.send("Page.enable");
    await cdp.send("Page.navigate", { url: baseUrl }); await sleep(350);

    const structure = await cdp.evaluate(`JSON.stringify({
      title: document.querySelector('h1')?.textContent.trim(), intro: document.querySelector('.intro')?.textContent.trim(),
      cards: document.querySelectorAll('.form-card').length,
      fields: [...document.querySelectorAll('input[name]')].filter((field) => field.name !== 'website').map((field) => field.name),
      required: [...document.querySelectorAll('input[name]')].filter((field) => field.name !== 'website' && field.required).map((field) => field.name),
      accessibleFields: [...document.querySelectorAll('input[name]')].filter((field) => field.name !== 'website').every((field) => field.labels.length === 1 && field.getAttribute('aria-describedby')?.includes(field.name+'-error')),
      heading: document.querySelector('.form-card h2')?.textContent.trim(), oldContent: /Encompasso|Passaporte|E-mail/.test(document.body.innerText),
      maxComplement: document.querySelector('#complemento').maxLength, scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth,
      tabOrder: [...document.querySelectorAll('input[name]')].filter((field) => field.name !== 'website').map((field) => field.name)
    })`);
    const parsedStructure = JSON.parse(structure);
    assert.equal(parsedStructure.title, "GS Materiais");
    assert.equal(parsedStructure.intro, "Preencha seus dados nos campos abaixo.");
    assert.equal(parsedStructure.cards, 1);
    assert.equal(parsedStructure.heading, "Dados pessoais");
    assert.deepEqual(parsedStructure.fields, ["nome_completo", "cpf", "telefone", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf"]);
    assert.deepEqual(parsedStructure.required, ["nome_completo", "cpf", "telefone", "cep", "logradouro", "numero", "bairro", "cidade", "uf"]);
    assert.equal(parsedStructure.accessibleFields, true);
    assert.equal(parsedStructure.maxComplement, 50);
    assert.equal(parsedStructure.oldContent, false);

    await cdp.evaluate("document.querySelector('#nome_completo').focus()");
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    assert.equal(await cdp.evaluate("document.activeElement.name"), "cpf");

    const invalidFocus = await cdp.evaluate(`(() => { document.querySelector('#materiais-form').requestSubmit(); return {focus:document.activeElement.name,error:document.querySelector('#nome_completo-error').textContent,invalid:document.querySelector('#nome_completo').getAttribute('aria-invalid')}; })()`);
    assert.equal(invalidFocus.focus, "nome_completo");
    assert.equal(invalidFocus.error, "Este campo é obrigatório.");
    assert.equal(invalidFocus.invalid, "true");

    const cepChecks = await cdp.evaluate(`(async () => {
      const cep = document.querySelector('#cep'); const calls = [];
      window.fetch = async (url) => { calls.push(String(url)); return new Response(JSON.stringify({logradouro:'Rua Sintética', bairro:'Centro', localidade:'Cidade Sintética', uf:'SP'}), {status:200}); };
      cep.value='01001000'; cep.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>setTimeout(r,20));
      const found = {calls: [...calls], status:document.querySelector('#cep-status').textContent, address:[...['logradouro','bairro','cidade','uf']].map(n=>document.querySelector('#'+n).value)};
      cep.value='01001000'; cep.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>setTimeout(r,10));
      const repeatedCallCount=calls.length;
      const pending = new Map(); window.fetch = (url) => new Promise((resolve,reject)=>pending.set(String(url).split('/').find(part=>part.length===8),{resolve,reject}));
      cep.value='11111111'; cep.dispatchEvent(new Event('input',{bubbles:true}));
      cep.value='22222222'; cep.dispatchEvent(new Event('input',{bubbles:true}));
      pending.get('22222222').resolve(new Response(JSON.stringify({logradouro:'Rua Nova',bairro:'Bairro Novo',localidade:'Cidade Nova',uf:'RJ'}),{status:200}));
      await new Promise(r=>setTimeout(r,20));
      pending.get('11111111').resolve(new Response(JSON.stringify({logradouro:'Rua Antiga',bairro:'Antigo',localidade:'Antiga',uf:'SP'}),{status:200}));
      await new Promise(r=>setTimeout(r,20));
      const order = [...['logradouro','bairro','cidade','uf']].map(n=>document.querySelector('#'+n).value);
      window.fetch = async () => new Response(JSON.stringify({erro:true}),{status:200});
      document.querySelector('#logradouro').value='Manual'; cep.value='33333333'; cep.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>setTimeout(r,20));
      const missing={status:document.querySelector('#cep-status').textContent, manual:document.querySelector('#logradouro').value};
      window.fetch = async () => {throw new Error('network')};
      document.querySelector('#bairro').value='Manual Bairro'; cep.value='44444444'; cep.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>setTimeout(r,20));
      const unavailable={status:document.querySelector('#cep-status').textContent, manual:document.querySelector('#bairro').value};
      window.fetch = async () => new Response('{invalid',{status:200});
      document.querySelector('#cidade').value='Cidade Manual'; cep.value='55555555'; cep.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>setTimeout(r,20));
      const invalidJson={status:document.querySelector('#cep-status').textContent,manual:document.querySelector('#cidade').value};
      cep.value='12x34567890'; cep.dispatchEvent(new Event('input',{bubbles:true}));
      const digitsOnly=cep.value;
      return {found, repeatedCallCount, order, missing, unavailable, invalidJson, digitsOnly};
    })()`);
    assert.deepEqual(cepChecks.found.address, ["Rua Sintética", "Centro", "Cidade Sintética", "SP"]);
    assert.equal(cepChecks.found.calls.length, 1);
    assert.equal(cepChecks.found.calls[0], "https://viacep.com.br/ws/01001000/json/");
    assert.equal(cepChecks.repeatedCallCount, 1);
    assert.deepEqual(cepChecks.order, ["Rua Nova", "Bairro Novo", "Cidade Nova", "RJ"]);
    assert.match(cepChecks.missing.status, /CEP não encontrado/);
    assert.equal(cepChecks.missing.manual, "Manual");
    assert.match(cepChecks.unavailable.status, /Não foi possível consultar o CEP/);
    assert.equal(cepChecks.unavailable.manual, "Manual Bairro");
    assert.match(cepChecks.invalidJson.status, /Não foi possível consultar o CEP/);
    assert.equal(cepChecks.invalidJson.manual, "Cidade Manual");
    assert.equal(cepChecks.digitsOnly, "12345678");

    const flow = await cdp.evaluate(`(async () => {
      const form=document.querySelector('#materiais-form'); const modal=document.querySelector('#success-modal'); const calls=[];
      const values={nome_completo:'Amostra Sintética',cpf:'52998224725',telefone:'11998765432',cep:'01001000',logradouro:'Praça Sintética',numero:'123',complemento:'',bairro:'Centro',cidade:'São Paulo',uf:'SP'};
      for(const [name,value] of Object.entries(values)){const field=document.querySelector('[name="'+name+'"]');field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));}
      document.querySelector('#cep-status').textContent='';
      const responses=[new Error('network'),{status:400,body:{message:'Revise os campos.',errors:{cpf:'CPF inválido.'}}},{status:429,body:{message:'Limite.'}},{status:500,body:{}}];
      window.fetch=async (url,options)=>{calls.push({url,options});const next=responses.shift();if(next instanceof Error)throw next;return new Response(JSON.stringify(next.body),{status:next.status,headers:{'Content-Type':'application/json'}})};
      form.requestSubmit(); await new Promise(r=>setTimeout(r,20)); const firstId=window.GSMateriaisApp.getAttemptId(); const network={id:firstId,name:document.querySelector('#nome_completo').value,modal:modal.open,status:document.querySelector('#form-status').textContent};
      form.requestSubmit(); await new Promise(r=>setTimeout(r,20)); const after400={id:window.GSMateriaisApp.getAttemptId(),fieldError:document.querySelector('#cpf-error').textContent,modal:modal.open};
      form.requestSubmit(); await new Promise(r=>setTimeout(r,20)); const after429={id:window.GSMateriaisApp.getAttemptId(),modal:modal.open};
      form.requestSubmit(); await new Promise(r=>setTimeout(r,20)); const after500={id:window.GSMateriaisApp.getAttemptId(),modal:modal.open};
      window.fetch=async (url,options)=>{calls.push({url,options});return new Response(JSON.stringify({ok:true}),{status:201,headers:{'Content-Type':'application/json'}})};
      form.requestSubmit(); await new Promise(r=>setTimeout(r,20)); const success={open:modal.open,id:window.GSMateriaisApp.getAttemptId(),name:document.querySelector('#nome_completo').value,focus:document.activeElement.id};
      document.querySelector('#close-modal').click(); await new Promise(r=>setTimeout(r,20));
      const closed={open:modal.open,id:window.GSMateriaisApp.getAttemptId(),empty:[...document.querySelectorAll('input[name]')].filter(x=>x.name!=='website').every(x=>x.value===''),focus:document.activeElement.id};
      const secondValues={...values,cep:'01001000'};for(const [name,value] of Object.entries(secondValues)){const field=document.querySelector('[name="'+name+'"]');field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));}
      window.fetch=async()=>new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json'}});
      form.requestSubmit(); await new Promise(r=>setTimeout(r,20)); const duplicate={open:modal.open};
      return {network,after400,after429,after500,success,closed,duplicate,requestBodies:calls.filter(c=>c.url==='/api/submissions').map(c=>JSON.parse(c.options.body))};
    })()`);
    assert.match(flow.network.id, /^[0-9a-f-]{36}$/i);
    assert.equal(flow.network.name, "Amostra Sintética"); assert.equal(flow.network.modal, false);
    assert.equal(flow.after400.id, flow.network.id); assert.equal(flow.after400.fieldError, "CPF inválido."); assert.equal(flow.after400.modal, false);
    assert.equal(flow.after429.id, flow.network.id); assert.equal(flow.after429.modal, false);
    assert.equal(flow.after500.id, flow.network.id); assert.equal(flow.after500.modal, false);
    assert.equal(flow.success.open, true); assert.equal(flow.success.id, flow.network.id); assert.equal(flow.success.name, "Amostra Sintética");
    assert.equal(flow.success.focus, "close-modal");
    assert.equal(flow.closed.open, false); assert.equal(flow.closed.id, null); assert.equal(flow.closed.empty, true); assert.equal(flow.closed.focus, "nome_completo");
    assert.equal(flow.duplicate.open, true);
    assert.ok(flow.requestBodies.every((body) => body.id_submissao === flow.network.id));
    assert.deepEqual(Object.keys(flow.requestBodies[0]).sort(), ["bairro","cep","cidade","complemento","cpf","id_submissao","logradouro","nome_completo","numero","telefone","uf","website"].sort());
    await cdp.evaluate("document.querySelector('#close-modal').click()");

    const responsive = [];
    for (const width of [360, 768, 1280]) {
      await cdp.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 680 });
      responsive.push(JSON.parse(await cdp.evaluate("JSON.stringify({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth})")));
    }
    assert.ok(responsive.every((item) => item.scrollWidth <= item.width && item.bodyScrollWidth <= item.width));
    await cdp.send("Emulation.clearDeviceMetricsOverride");
    const screenshot = await cdp.send("Page.captureScreenshot", { format: "png" });
    const screenshotPath = path.join(os.tmpdir(), "gs-materiais-browser.png");
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));
    const report = { structure: parsedStructure, cepChecks, flow: { networkPreserved: true, sameUuidAcrossRetry: true, successOnlyOn2xx: true, modalClears: true }, responsive, screenshotPath, consoleErrors: cdp.events.filter((event) => event.method === "Runtime.exceptionThrown").length };
    fs.writeFileSync(path.join(os.tmpdir(), "gs-materiais-browser-report.json"), JSON.stringify(report, null, 2));
    assert.equal(report.consoleErrors, 0);
    console.log("browser-check: passed");
    console.log(JSON.stringify({ cards: parsedStructure.cards, fields: parsedStructure.fields.length, viaCepFoundAndFallback: true, outOfOrderProtected: true, responseStatuses: ["network",400,429,500,201,200], responsive, consoleErrors: report.consoleErrors }));
  } finally { if (cdp) cdp.close(); chrome.kill(); if (server) server.kill(); }
}
main().catch((error) => { console.error("browser-check: failed:" + error.message); process.exitCode = 1; });
