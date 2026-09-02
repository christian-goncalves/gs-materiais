(function () {
  "use strict";

  const validation = window.EncompassoValidation;
  const form = document.getElementById("encompasso-form");
  if (!validation || !form) return;

  const fieldNames = validation.DATA_FIELDS;
  const documentType = document.getElementById("tipo_documento");
  const documentInput = document.getElementById("documento");
  const documentLabel = document.getElementById("documento-label");
  const documentHint = document.getElementById("documento-hint");
  const summary = document.getElementById("form-summary");
  const status = document.getElementById("form-status");
  const button = document.getElementById("submit-button");
  let attemptId = null;
  let submitting = false;

  function getField(name) { return document.getElementById(name); }

  function collectValues() {
    const values = {};
    for (const name of fieldNames) values[name] = getField(name).value;
    values.website = getField("website").value;
    return values;
  }

  function updateDocumentMode() {
    const isPassport = documentType.value === "passaporte";
    documentLabel.firstChild.textContent = isPassport ? "Passaporte " : "CPF ";
    documentHint.textContent = isPassport ? "Use de 5 a 30 letras e números, sem máscara." : "Informe 11 dígitos.";
    documentInput.inputMode = isPassport ? "text" : "numeric";
    documentInput.maxLength = isPassport ? 30 : 14;
    documentInput.autocomplete = "off";
    documentInput.placeholder = isPassport ? "Ex.: AB12345" : "000.000.000-00";
    documentInput.setAttribute("aria-label", isPassport ? "Passaporte" : "CPF");
  }

  function clearFieldError(name) {
    const field = getField(name);
    const error = document.getElementById(name + "-error");
    if (!field || !error) return;
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-errormessage");
    const describedBy = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter((id) => id && id !== name + "-error");
    if (describedBy.length) field.setAttribute("aria-describedby", describedBy.join(" "));
    else field.removeAttribute("aria-describedby");
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
      const error = document.getElementById(name + "-error");
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-errormessage", name + "-error");
      const describedBy = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
      if (!describedBy.includes(name + "-error")) describedBy.push(name + "-error");
      field.setAttribute("aria-describedby", describedBy.join(" "));
      error.textContent = errors[name];
    }
    if (visibleErrors.length > 1 || errors.form || errors.website) {
      summary.textContent = "Revise os campos destacados antes de enviar.";
      summary.hidden = false;
    }
    if (focusFirst && visibleErrors.length) getField(visibleErrors[0]).focus();
  }

  function createAttemptId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "00000000-0000-4000-8000-000000000000";
  }

  function setSubmitting(value) {
    submitting = value;
    button.disabled = value;
    button.setAttribute("aria-busy", String(value));
    button.textContent = value ? "Enviando…" : "Enviar dados";
  }

  function setStatus(message, kind) {
    status.textContent = message;
    status.className = "form-status" + (kind ? " is-" + kind : "");
  }

  function handleInput(event) {
    const name = event.target.name;
    if (!fieldNames.includes(name)) return;
    clearFieldError(name);
    if (name === "documento" && documentType.value === "cpf") event.target.value = validation.formatCpf(event.target.value);
    if (name === "telefone") event.target.value = validation.formatPhone(event.target.value);
  }

  function handleDocumentTypeChange() {
    documentInput.value = "";
    clearFieldError("documento");
    updateDocumentMode();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setStatus("", "");
    const values = collectValues();
    const result = validation.validateFormValues(values);
    if (!result.ok) {
      renderErrors(result.errors, true);
      return;
    }
    if (!attemptId) attemptId = createAttemptId();
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
        form.reset();
        attemptId = null;
        clearErrors();
        updateDocumentMode();
        setStatus("Dados enviados com sucesso.", "success");
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

  form.addEventListener("input", handleInput);
  documentType.addEventListener("change", handleDocumentTypeChange);
  form.addEventListener("submit", handleSubmit);
  updateDocumentMode();

  window.EncompassoApp = {
    getAttemptId: function () { return attemptId; },
    isSubmitting: function () { return submitting; },
    collectValues: collectValues,
    validate: validation.validateFormValues
  };
})();
