"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const validation = require("../js/validation.js");

function validValues(overrides = {}) {
  return Object.assign({
    nome_completo: "  Amostra Sintética  ",
    nome_social: "",
    data_nascimento: "1990-01-01",
    nacionalidade: "  Brasileira  ",
    tipo_documento: "cpf",
    documento: "529.982.247-25",
    telefone: "(11) 99876-5432",
    email: "  Fixture@Example.INVALID  ",
    pais: "  Brasil  ",
    estado_provincia: "São Paulo",
    municipio_cidade: "São Paulo",
    logradouro_numero: "Rua Sintética, 123",
    complemento: "",
    bairro_distrito: "Centro",
    cep_codigo_postal: "  SW1A 1AA  "
  }, overrides);
}

test("normaliza o payload válido sem apagar acentos ou símbolos internos", () => {
  const result = validation.validateFormValues(validValues());
  assert.equal(result.ok, true);
  assert.equal(result.normalized.nome_completo, "Amostra Sintética");
  assert.equal(result.normalized.email, "fixture@example.invalid");
  assert.equal(result.normalized.documento, "52998224725");
  assert.equal(result.normalized.telefone, "+5511998765432");
  assert.equal(result.normalized.cep_codigo_postal, "SW1A 1AA");
  assert.equal(result.normalized.complemento, "");
});

test("valida CPF pelos dígitos verificadores", () => {
  assert.equal(validation.isValidCpf("529.982.247-25"), true);
  assert.equal(validation.isValidCpf("529.982.247-26"), false);
  assert.equal(validation.isValidCpf("111.111.111-11"), false);
});

test("valida passaporte nos limites e mantém a mensagem exata para até quatro caracteres", () => {
  const shortResult = validation.validateFormValues(validValues({ tipo_documento: "passaporte", documento: "ABCD" }));
  assert.equal(shortResult.errors.documento, "Você digitou um número insuficiente de caracteres.");
  assert.equal(validation.validateFormValues(validValues({ tipo_documento: "passaporte", documento: "A1234" })).ok, true);
  assert.equal(validation.validateFormValues(validValues({ tipo_documento: "passaporte", documento: "A".repeat(30) })).ok, true);
  assert.match(validation.validateFormValues(validValues({ tipo_documento: "passaporte", documento: "A".repeat(31) })).errors.documento, /no máximo/);
  assert.match(validation.validateFormValues(validValues({ tipo_documento: "passaporte", documento: "AB 123" })).errors.documento, /apenas letras/);
});

test("aceita telefones brasileiros fixo, celular e entrada com +55", () => {
  for (const phone of ["(11) 2345-6789", "11998765432", "+55 (11) 99876-5432"]) {
    const result = validation.validateFormValues(validValues({ telefone: phone }));
    assert.equal(result.ok, true, phone);
    assert.match(result.normalized.telefone, /^\+55\d{10,11}$/);
  }
  assert.equal(validation.validateFormValues(validValues({ telefone: "123" })).ok, false);
});

test("rejeita data futura, email inválido e limites de texto", () => {
  const future = new Date();
  future.setDate(future.getDate() + 1);
  const futureValue = [future.getFullYear(), String(future.getMonth() + 1).padStart(2, "0"), String(future.getDate()).padStart(2, "0")].join("-");
  const result = validation.validateFormValues(validValues({ data_nascimento: futureValue, email: "not-an-email", nome_completo: "x".repeat(151) }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.data_nascimento);
  assert.equal(result.errors.email, "Informe um e-mail válido.");
  assert.ok(result.errors.nome_completo);
});

test("formata apenas a apresentação de CPF e telefone", () => {
  assert.equal(validation.formatCpf("52998224725"), "529.982.247-25");
  assert.equal(validation.formatPhone("11998765432"), "(11) 99876-5432");
  assert.equal(validation.formatPhone("+5511998765432"), "+55 (11) 99876-5432");
  assert.equal(validation.isValidUuid("00000000-0000-4000-8000-000000000000"), true);
});
