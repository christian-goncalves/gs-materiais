"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const validation = require("../js/validation.js");

function validValues(overrides = {}) {
  return Object.assign({
    nome_completo: "Amostra Sintética",
    cpf: "529.982.247-25",
    telefone: "(11) 99876-5432",
    cep: "01001000",
    logradouro: "Praça Sintética",
    numero: "123",
    complemento: "",
    bairro: "Centro",
    cidade: "São Paulo",
    uf: "sp"
  }, overrides);
}

test("normaliza os dez campos sem perder acentos e mantém complemento vazio", () => {
  const result = validation.validateFormValues(validValues());
  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(result.normalized), validation.DATA_FIELDS);
  assert.equal(result.normalized.cpf, "52998224725");
  assert.equal(result.normalized.telefone, "+5511998765432");
  assert.equal(result.normalized.cep, "01001000");
  assert.equal(result.normalized.uf, "SP");
  assert.equal(result.normalized.complemento, "");
  assert.equal(result.normalized.cidade, "São Paulo");
});

test("valida CPF pelos dígitos verificadores e rejeita sequências repetidas", () => {
  assert.equal(validation.isValidCpf("529.982.247-25"), true);
  assert.equal(validation.isValidCpf("529.982.247-26"), false);
  assert.equal(validation.isValidCpf("111.111.111-11"), false);
  assert.equal(validation.validateFormValues(validValues({ cpf: "52998224726" })).ok, false);
});

test("valida telefone brasileiro com DDD e normaliza para E.164", () => {
  for (const telefone of ["(11) 2345-6789", "11998765432", "+55 (21) 98765-4321"]) {
    const result = validation.validateFormValues(validValues({ telefone }));
    assert.equal(result.ok, true, telefone);
    assert.match(result.normalized.telefone, /^\+55\d{10,11}$/);
  }
  for (const telefone of ["(00) 99876-5432", "(11) 1234-5678", "123"]) {
    assert.equal(validation.validateFormValues(validValues({ telefone })).ok, false, telefone);
  }
});

test("CEP exige oito dígitos numéricos sem pontuação", () => {
  for (const cep of ["1234567", "123456789", "1234-678", "abcdefgh"]) {
    assert.equal(validation.validateFormValues(validValues({ cep })).ok, false, cep);
  }
  assert.equal(validation.validateFormValues(validValues({ cep: "12345678" })).ok, true);
});

test("complemento é o único campo opcional e aceita no máximo 50 caracteres", () => {
  assert.equal(validation.validateFormValues(validValues({ complemento: "x".repeat(50) })).ok, true);
  assert.equal(validation.validateFormValues(validValues({ complemento: "x".repeat(51) })).errors.complemento, "Este campo excede o limite permitido.");
  for (const field of validation.REQUIRED_FIELDS) {
    assert.ok(validation.validateFormValues(validValues({ [field]: " " })).errors[field], field);
  }
});

test("limita o nome a 150 caracteres e UF a duas letras", () => {
  assert.ok(validation.validateFormValues(validValues({ nome_completo: "x".repeat(151) })).errors.nome_completo);
  assert.ok(validation.validateFormValues(validValues({ uf: "São" })).errors.uf);
});

test("valida UUID e rejeita o contrato antigo e campos inesperados", () => {
  const submission = Object.assign({ id_submissao: "11111111-1111-4111-8111-111111111111", website: "" }, validValues());
  assert.equal(validation.validateSubmission(submission).ok, true);
  assert.equal(validation.validateSubmission(Object.assign({}, submission, { email: "old@example.invalid" })).ok, false);
  assert.equal(validation.validateSubmission(Object.assign({}, submission, { documento: submission.cpf })).ok, false);
  assert.equal(validation.validateSubmission(Object.assign({}, submission, { id_submissao: "bad" })).ok, false);
});

test("formata CPF e telefone somente para apresentação", () => {
  assert.equal(validation.formatCpf("52998224725"), "529.982.247-25");
  assert.equal(validation.formatPhone("11998765432"), "(11) 99876-5432");
  assert.equal(validation.isValidUuid("00000000-0000-4000-8000-000000000000"), true);
});
