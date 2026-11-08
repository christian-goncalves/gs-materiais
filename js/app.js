(function () {
  "use strict";
  const validation = window.GSMateriaisValidation;
  const form = document.getElementById("materiais-form");
  if (!validation || !form) return;

  const fieldNames = validation.DATA_FIELDS;
  const summary = document.getElementById("form-summary");
  const status = document.getElementById("form-status");
  const button = document.getElementById("submit-button");
  const cepStatus = document.getElementById("cep-status");
  const cepInput = document.getElementById("cep");
  const modal = document.getElementById("success-modal");
  let attemptId = null;
  let submitting = false;
  let cepRequestVersion = 0;
  const consultedCeps = new Set();

  function getField(name) { return document.getElementById(name); }
  function collectValues() {
    const values = {};
    for (const name of fieldNames) values[name] = getField(name).value;
    values.website = getField("website").value;
    return values;
  }
  function clearFieldError(name) {
    const field = getField(name);
    const error = document.getElementById(name + "-error");
    if (!field || !error) return;
    field.removeAttribute("aria-invalid");
    error.textContent = "";
  }
  function clearErrors() {
    for (const name of fieldNames) clearFieldError(name);
    summary.hidden = true;
    summary.textContent = "";
  }
  function renderErrors(errors, focusFirst) {
    clearErrors();
    const visibleErrors = fieldNames.filter((name) => errors[name]);
    for (const name of visibleErrors) {
      const field = getField(name);
      field.setAttribute("aria-invalid", "true");
      document.getElementById(name + "-error").textContent = errors[name];
    }
    if (visibleErrors.length > 1 || errors.form || errors.website) {
      summary.textContent = "Revise os campos destacados antes de enviar.";
      summary.hidden = false;
    }
    if (focusFirst && visibleErrors.length) getField(visibleErrors[0]).focus();
  }
  function createAttemptId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    if (!window.crypto || typeof window.crypto.getRandomValues !== "function") throw new Error("uuid-unavailable");
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
    return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
  }
  function setSubmitting(value) {
    submitting = value;
    button.disabled = value;
    button.setAttribute("aria-busy", String(value));
    button.textContent = value ? "Enviando…" : "Enviar cadastro";
  }
  function setStatus(message, kind) {
    status.textContent = message;
    status.className = "form-status" + (kind ? " is-" + kind : "");
  }
  function handleInput(event) {
    const name = event.target.name;
    if (!fieldNames.includes(name)) return;
    clearFieldError(name);
    if (name === "cpf") event.target.value = validation.formatCpf(event.target.value);
    if (name === "telefone") event.target.value = validation.formatPhone(event.target.value);
    if (name === "uf") event.target.value = event.target.value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();
    if (name === "cep") {
      const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
      if (event.target.value !== digits) event.target.value = digits;
      const version = ++cepRequestVersion;
      if (digits.length !== 8) {
        cepStatus.textContent = "";
      } else if (!consultedCeps.has(digits)) {
        consultedCeps.add(digits);
        lookupCep(digits, version);
      }
    }
  }
  function handleValidationBlur(event) {
    const name = event.target.name;
    if (!['cpf', 'telefone', 'cep'].includes(name)) return;

    const value = event.target.value.trim();
    const digits = value.replace(/\D/g, "");
    let message = "";

    if (!digits) {
      message = validation.REQUIRED_MESSAGE;
    } else if (name === "cpf") {
      if (digits.length !== 11) message = "CPF deve conter exatamente 11 dígitos.";
      else if (!validation.isValidCpf(value)) message = "Informe um CPF válido.";
    } else if (name === "telefone") {
      if (!validation.normalizePhone(value)) message = "Informe telefone com DDD: 10 dígitos (fixo) ou 11 (celular). Com +55, acrescente 2 dígitos.";
    } else if (name === "cep") {
      if (!/^\d{8}$/.test(value)) message = "CEP deve conter exatamente 8 dígitos.";
    }

    const error = document.getElementById(name + "-error");
    if (message) {
      event.target.setAttribute("aria-invalid", "true");
      error.textContent = message;
    } else {
      clearFieldError(name);
    }
  }
  async function lookupCep(cep, version) {
    cepStatus.textContent = "Consultando CEP…";
    try {
      const response = await fetch("https://viacep.com.br/ws/" + encodeURIComponent(cep) + "/json/");
      if (!response.ok) throw new Error("lookup-failed");
      const data = await response.json();
      if (version !== cepRequestVersion || cepInput.value !== cep) return;
      if (!data || data.erro === true) {
        cepStatus.textContent = "CEP não encontrado. Preencha o endereço manualmente.";
        return;
      }
      const values = { logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, uf: data.uf };
      for (const [name, value] of Object.entries(values)) getField(name).value = typeof value === "string" ? value : "";
      cepStatus.textContent = "Endereço preenchido. Você pode editar os campos.";
    } catch (_) {
      if (version === cepRequestVersion && cepInput.value === cep) cepStatus.textContent = "Não foi possível consultar o CEP. Preencha o endereço manualmente.";
    }
  }
  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setStatus("", "");
    const values = collectValues();
    const result = validation.validateFormValues(values);
    if (!result.ok) { renderErrors(result.errors, true); return; }
    if (!attemptId) {
      try { attemptId = createAttemptId(); }
      catch (_) { setStatus("Não foi possível preparar o envio. Tente novamente.", "error"); return; }
    }
    const payload = Object.assign({ id_submissao: attemptId, website: values.website }, result.normalized);
    clearErrors();
    setSubmitting(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      let data = {};
      try { data = await response.json(); } catch (_) { data = {}; }
      if (response.status === 200 || response.status === 201) {
        setStatus("", "");
        modal.showModal();
      } else if (response.status === 400 && data.errors) {
        renderErrors(data.errors, true);
        setStatus(data.message || "Revise os campos destacados antes de enviar.", "error");
      } else if (response.status === 429) {
        setStatus("Muitas tentativas. Tente novamente mais tarde.", "error");
      } else {
        setStatus("Não foi possível enviar os dados. Tente novamente.", "error");
      }
    } catch (_) {
      setStatus("Não foi possível enviar os dados. Tente novamente.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  document.getElementById("close-modal").addEventListener("click", () => modal.close());
  modal.addEventListener("close", () => {
    form.reset();
    attemptId = null;
    consultedCeps.clear();
    cepRequestVersion += 1;
    cepStatus.textContent = "";
    clearErrors();
    setStatus("", "");
    getField("nome_completo").focus();
  });
  form.addEventListener("input", handleInput);
  for (const name of ["cpf", "telefone", "cep"]) {
    getField(name).addEventListener("blur", handleValidationBlur);
  }
  form.addEventListener("submit", handleSubmit);

  window.GSMateriaisApp = {
    getAttemptId: () => attemptId,
    isSubmitting: () => submitting,
    collectValues,
    validate: validation.validateFormValues,
    consultedCeps
  };
})();
