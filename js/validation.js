(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EncompassoValidation = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DATA_FIELDS = [
    "nome_completo", "nome_social", "data_nascimento", "nacionalidade",
    "tipo_documento", "documento", "telefone", "email", "pais",
    "estado_provincia", "municipio_cidade", "logradouro_numero", "complemento",
    "bairro_distrito", "cep_codigo_postal"
  ];

  const REQUIRED_FIELDS = [
    "nome_completo", "data_nascimento", "nacionalidade", "tipo_documento",
    "documento", "telefone", "email", "pais", "estado_provincia",
    "municipio_cidade", "logradouro_numero", "bairro_distrito", "cep_codigo_postal"
  ];

  const MAX_LENGTHS = {
    nome_completo: 150, nome_social: 150, nacionalidade: 80, telefone: 20,
    email: 254, pais: 80, estado_provincia: 100, municipio_cidade: 120,
    logradouro_numero: 200, complemento: 150, bairro_distrito: 120,
    cep_codigo_postal: 20
  };

  const REQUIRED_MESSAGE = "Este campo é obrigatório.";

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function isValidUuid(value) {
    return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  function isValidCpf(value) {
    const digits = value.replace(/[.\-\s]/g, "");
    if (!/^\d{11}$/.test(digits) || /^([0-9])\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let index = 0; index < 9; index += 1) sum += Number(digits[index]) * (10 - index);
    let first = (sum * 10) % 11;
    if (first === 10) first = 0;
    if (first !== Number(digits[9])) return false;
    sum = 0;
    for (let index = 0; index < 10; index += 1) sum += Number(digits[index]) * (11 - index);
    let second = (sum * 10) % 11;
    if (second === 10) second = 0;
    return second === Number(digits[10]);
  }

  function normalizePhone(value) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (trimmed.length > MAX_LENGTHS.telefone) return null;
    if (!/^[+0-9()\s.-]+$/.test(trimmed)) return null;
    const compact = trimmed.replace(/[()\s.-]/g, "");
    let national;
    if (compact.startsWith("+55")) national = compact.slice(3);
    else if (compact.startsWith("+")) return null;
    else national = compact;
    if (!/^\d{10,11}$/.test(national) || !/^[1-9]\d/.test(national)) return null;
    const local = national.slice(2);
    if (national.length === 10 && !/^[2-5]\d{7}$/.test(local)) return null;
    if (national.length === 11 && !/^9\d{8}$/.test(local)) return null;
    return "+55" + national;
  }

  function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return false;
    const today = new Date();
    const todayValue = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
    return value <= todayValue;
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
      if (national.length <= 7) return "+55 (" + national.slice(0, 2) + ") " + national.slice(2);
      if (national.length <= 11) {
        const local = national.length === 11 ? national.slice(2, 7) + "-" + national.slice(7) : national.slice(2, 6) + "-" + national.slice(6);
        return "+55 (" + national.slice(0, 2) + ") " + local;
      }
    }
    if (national.length <= 2) return national;
    if (national.length <= 6) return "(" + national.slice(0, 2) + ") " + national.slice(2);
    const local = national.length === 11 ? national.slice(2, 7) + "-" + national.slice(7) : national.slice(2, 6) + "-" + national.slice(6);
    return "(" + national.slice(0, 2) + ") " + local;
  }

  function validateText(raw, field, required) {
    if (typeof raw !== "string") return { error: "Valor inválido." };
    const value = raw.trim();
    if (required && value === "") return { error: REQUIRED_MESSAGE };
    if (MAX_LENGTHS[field] && value.length > MAX_LENGTHS[field]) return { error: "Este campo excede o limite permitido." };
    return { value };
  }

  function validateFormValues(input) {
    const source = isPlainObject(input) ? input : {};
    const errors = {};
    const normalized = {};

    for (const field of DATA_FIELDS) {
      const result = validateText(source[field] === undefined ? "" : source[field], field, REQUIRED_FIELDS.includes(field));
      if (result.error) errors[field] = result.error;
      else normalized[field] = result.value;
    }

    if (!errors.data_nascimento && !isValidDate(normalized.data_nascimento)) errors.data_nascimento = "Informe uma data de nascimento válida.";

    if (!errors.tipo_documento && !["cpf", "passaporte"].includes(normalized.tipo_documento)) {
      errors.tipo_documento = "Selecione um tipo de documento válido.";
    }

    if (!errors.documento) {
      if (normalized.tipo_documento === "cpf") {
        normalized.documento = normalized.documento.replace(/[.\-\s]/g, "");
        if (!isValidCpf(normalized.documento)) errors.documento = "Informe um CPF válido.";
      } else if (normalized.tipo_documento === "passaporte") {
        if (normalized.documento.length <= 4) errors.documento = normalized.documento === "" ? REQUIRED_MESSAGE : "Você digitou um número insuficiente de caracteres.";
        else if (normalized.documento.length > 30) errors.documento = "O passaporte deve ter no máximo 30 caracteres.";
        else if (!/^[A-Za-z0-9]+$/.test(normalized.documento)) errors.documento = "O passaporte deve conter apenas letras e números.";
      }
    }

    if (!errors.telefone) {
      const phone = normalizePhone(normalized.telefone);
      if (!phone) errors.telefone = "Informe um telefone brasileiro válido.";
      else normalized.telefone = phone;
    }

    if (!errors.email) {
      normalized.email = normalized.email.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) errors.email = "Informe um e-mail válido.";
    }

    return { ok: Object.keys(errors).length === 0, errors, normalized };
  }

  function validateSubmission(input) {
    const errors = {};
    if (!isPlainObject(input)) return { ok: false, errors: { form: "Dados inválidos." } };
    if (!isValidUuid(input.id_submissao)) errors.id_submissao = "Identificação da submissão inválida.";
    if (typeof input.website !== "string" || input.website.trim() !== "") errors.website = "Não foi possível processar o envio.";
    const result = validateFormValues(input);
    Object.assign(errors, result.errors);
    return { ok: Object.keys(errors).length === 0, errors, normalized: result.normalized };
  }

  return {
    DATA_FIELDS, REQUIRED_FIELDS, MAX_LENGTHS, REQUIRED_MESSAGE,
    isValidCpf, isValidUuid, normalizePhone, isValidDate, formatCpf,
    formatPhone, validateFormValues, validateSubmission
  };
});
