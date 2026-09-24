const telegram = window.Telegram?.WebApp;
telegram?.ready();
telegram?.expand();

const form = document.querySelector("#expense-form");
const saveButton = document.querySelector("#save-button");
const isTransfer = new URLSearchParams(window.location.search).get("mode") === "transfer";

if (!isTransfer) {
  document.title = "Добавить операцию";
  document.querySelector("#form-title").textContent = "Добавить операцию";
  document.querySelector("#success-title").textContent = "Операция сохранена";
}

if (isTransfer) {
  document.title = "Добавить операцию (черновик)";
  document.querySelector("#form-title").textContent = "Добавить операцию (черновик)";
  document.querySelector("#success-title").textContent = "Черновая операция сохранена";
  document.querySelectorAll("[data-expense-only]").forEach((row) => {
    row.hidden = true;
  });
}

document.querySelector("#back-button").addEventListener("click", () => {
  if (telegram) telegram.close();
  else window.history.back();
});

document.querySelectorAll("select").forEach((select) => {
  select.addEventListener("change", () => {
    select.style.color = "var(--ink)";
  });
});

const amountInput = document.querySelector("#amount");
const operationDateInput = document.querySelector("#operation-date");

function localIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

operationDateInput.value = localIsoDate();

amountInput.addEventListener("input", () => {
  const raw = amountInput.value.replace(/\s/g, "").replace(/[^\d,.]/g, "");
  const separatorIndex = raw.search(/[,.]/);
  const integerRaw = separatorIndex === -1 ? raw : raw.slice(0, separatorIndex);
  const fractionRaw = separatorIndex === -1 ? "" : raw.slice(separatorIndex + 1).replace(/[,.]/g, "").slice(0, 2);
  const integer = integerRaw.replace(/^0+(?=\d)/, "");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  amountInput.value = grouped + (separatorIndex === -1 ? "" : `,${fractionRaw}`);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const amountText = document.querySelector("#amount").value.replace(",", ".").replace(/\s/g, "");
  const amount = Number(amountText);
  const operationDate = operationDateInput.value;
  const description = document.querySelector("#description").value.trim();
  const paymentMethod = document.querySelector("#payment-method").value;
  const category = document.querySelector("#category").value;
  const purpose = document.querySelector("#purpose").value;
  const comment = document.querySelector("#comment").value.trim();
  const error = document.querySelector("#error");

  let message = "";
  if (!Number.isFinite(amount) || amount <= 0) message = isTransfer ? "Укажите сумму операции" : "Укажите сумму операции";
  else if (!operationDate) message = "Выберите дату";
  else if (!isTransfer && !description) message = "Введите описание";
  else if (!isTransfer && !paymentMethod) message = "Выберите способ оплаты";
  else if (!isTransfer && !category) message = "Выберите категорию";
  else if (!isTransfer && !purpose) message = "Выберите назначение";

  if (message) {
    error.textContent = message;
    error.hidden = false;
    return;
  }

  const payload = JSON.stringify(isTransfer
    ? {
        type: "manual_transfer",
        amount,
        date: operationDate,
        currency: "KZT",
        comment,
        submitted_at: new Date().toISOString(),
      }
    : {
        type: "manual_expense",
        amount,
        date: operationDate,
        currency: document.querySelector("#currency").value,
        description,
        payment_method: paymentMethod,
        category,
        purpose,
        comment,
        submitted_at: new Date().toISOString(),
      });

  error.hidden = true;
  telegram?.HapticFeedback?.notificationOccurred("success");

  if (telegram?.sendData) {
    saveButton.disabled = true;
    saveButton.textContent = "Сохраняю…";
    telegram.sendData(payload);

    // sendData closes a Mini App opened from the keyboard button. If Telegram
    // keeps the page open, it was launched from an unsupported menu surface.
    window.setTimeout(() => {
      saveButton.disabled = false;
      saveButton.textContent = "Сохранить";
      error.textContent = isTransfer
        ? "Откройте форму кнопкой «➕ Добавить операцию (черновик)» внутри чата с ботом."
        : "Откройте форму кнопкой «➕ Добавить операцию» внутри чата с ботом.";
      error.hidden = false;
      error.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 1800);
  } else {
    form.hidden = true;
    document.querySelector("#success").hidden = false;
  }
});
