(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.GSMateriaisValidation = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DATA_FIELDS = ["nome_completo", "cpf", "telefone", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf"];
  const REQUIRED_FIELDS = DATA_FIELDS.filter((field) => field !== "complemento");
  const MAX_LENGTHS = { nome_completo: 150, telefone: 20, complemento: 50, uf: 2 };
  const REQUIRED_MESSAGE = "Este campo é obrigatório.";
  const VALID_DDDS = new Set([11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99]);

  function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
  function isValidUuid(value) { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }

  function isValidCpf(value) {
    if (typeof value !== "string") return false;
    const digits = value.replace(/[.\-\s]/g, "");
    if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i += 1) sum += Number(digits[i]) * (10 - i);
    let digit = (sum * 10) % 11; if (digit === 10) digit = 0;
    if (digit !== Number(digits[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i += 1) sum += Number(digits[i]) * (11 - i);
    digit = (sum * 10) % 11; if (digit === 10) digit = 0;
    return digit === Number(digits[10]);
  }

  function normalizePhone(value) {
    if (typeof value !== "string" || value.trim().length > MAX_LENGTHS.telefone || !/^[+0-9()\s.-]+$/.test(value.trim())) return null;
    const compact = value.trim().replace(/[()\s.-]/g, "");
    let national;
    if (compact.startsWith("+55")) national = compact.slice(3);
    else if (compact.startsWith("+")) return null;
    else national = compact;
    if (!/^\d{10,11}$/.test(national) || !VALID_DDDS.has(Number(national.slice(0, 2)))) return null;
    const local = national.slice(2);
    if (national.length === 10 && !/^[2-5]\d{7}$/.test(local)) return null;
    if (national.length === 11 && !/^9\d{8}$/.test(local)) return null;
    return "+55" + national;
  }

  function formatCpf(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.slice(0, 3) + "." + digits.slice(3);
    if (digits.length <= 9) return digits.slice(0, 3) + "." + digits.slice(3, 6) + "." + digits.slice(6);
    return digits.slice(0, 3) + "." + digits.slice(3, 6) + "." + digits.slice(6, 9) + "-" + digits.slice(9);
  }

  function formatPhone(value) {
    const raw = String(value || "").trim();
    const hasCountry = raw.startsWith("+55");
    const allDigits = raw.replace(/\D/g, "");
    const national = hasCountry ? allDigits.slice(2) : allDigits.slice(0, 11);
    if (hasCountry || raw.startsWith("+")) {
      if (national.length <= 2) return "+55 (" + national;
      const local = national.slice(2);
      return "+55 (" + national.slice(0, 2) + ") " + (local.length > 8 ? local.slice(0, 5) + "-" + local.slice(5) : local.length > 4 ? local.slice(0, 4) + "-" + local.slice(4) : local);
    }
    if (national.length <= 2) return national;
    const local = national.slice(2);
    return "(" + national.slice(0, 2) + ") " + (local.length > 8 ? local.slice(0, 5) + "-" + local.slice(5) : local.length > 4 ? local.slice(0, 4) + "-" + local.slice(4) : local);
  }

  function validateFormValues(input) {
    const source = isPlainObject(input) ? input : {};
    const errors = {};
    const normalized = {};
    for (const field of DATA_FIELDS) {
      const raw = source[field] === undefined ? "" : source[field];
      if (typeof raw !== "string") { errors[field] = "Valor inválido."; continue; }
      const value = raw.trim();
      if (REQUIRED_FIELDS.includes(field) && !value) errors[field] = REQUIRED_MESSAGE;
      else if (MAX_LENGTHS[field] && value.length > MAX_LENGTHS[field]) errors[field] = "Este campo excede o limite permitido.";
      else normalized[field] = value;
    }
    if (!errors.cpf) {
      normalized.cpf = normalized.cpf.replace(/[.\-\s]/g, "");
      if (!isValidCpf(normalized.cpf)) errors.cpf = "Informe um CPF válido.";
    }
    if (!errors.telefone) {
      const phone = normalizePhone(normalized.telefone);
      if (!phone) errors.telefone = "Informe um telefone brasileiro válido com DDD.";
      else normalized.telefone = phone;
    }
    if (!errors.cep && !/^\d{8}$/.test(normalized.cep)) errors.cep = "Informe um CEP com exatamente 8 números.";
    if (!errors.uf) {
      normalized.uf = normalized.uf.toUpperCase();
      if (!/^[A-Z]{2}$/.test(normalized.uf)) errors.uf = "Informe uma UF com duas letras.";
    }
    return { ok: Object.keys(errors).length === 0, errors, normalized };
  }

  function validateSubmission(input) {
    if (!isPlainObject(input)) return { ok: false, errors: { form: "Dados inválidos." } };
    const allowed = new Set(["id_submissao", "website", ...DATA_FIELDS]);
    const errors = {};
    for (const key of Object.keys(input)) if (!allowed.has(key)) errors.form = "Contrato de envio inválido.";
    if (!isValidUuid(input.id_submissao)) errors.id_submissao = "Identificação da submissão inválida.";
    if (typeof input.website !== "string" || input.website.trim() !== "") errors.website = "Não foi possível processar o envio.";
    const result = validateFormValues(input);
    Object.assign(errors, result.errors);
    return { ok: Object.keys(errors).length === 0, errors, normalized: result.normalized };
  }

  return { DATA_FIELDS, REQUIRED_FIELDS, MAX_LENGTHS, REQUIRED_MESSAGE, isValidUuid, isValidCpf, normalizePhone, formatCpf, formatPhone, validateFormValues, validateSubmission };
});
