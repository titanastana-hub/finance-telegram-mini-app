const telegram = window.Telegram?.WebApp;
telegram?.ready();
telegram?.expand();

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

amountInput.addEventListener("input", () => {
  const raw = amountInput.value.replace(/\s/g, "").replace(/[^\d,.]/g, "");
  const separatorIndex = raw.search(/[,.]/);
  const integerRaw = separatorIndex === -1 ? raw : raw.slice(0, separatorIndex);
  const fractionRaw = separatorIndex === -1 ? "" : raw.slice(separatorIndex + 1).replace(/[,.]/g, "").slice(0, 2);
  const integer = integerRaw.replace(/^0+(?=\d)/, "");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  amountInput.value = grouped + (separatorIndex === -1 ? "" : `,${fractionRaw}`);
});

document.querySelector("#expense-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const amountText = document.querySelector("#amount").value.replace(",", ".").replace(/\s/g, "");
  const amount = Number(amountText);
  const description = document.querySelector("#description").value.trim();
  const paymentMethod = document.querySelector("#payment-method").value;
  const category = document.querySelector("#category").value;
  const purpose = document.querySelector("#purpose").value;
  const error = document.querySelector("#error");

  let message = "";
  if (!Number.isFinite(amount) || amount <= 0) message = "Укажите сумму расхода";
  else if (!description) message = "Введите описание";
  else if (!paymentMethod) message = "Выберите способ оплаты";
  else if (!category) message = "Выберите категорию";
  else if (!purpose) message = "Выберите назначение";

  if (message) {
    error.textContent = message;
    error.hidden = false;
    return;
  }

  const payload = JSON.stringify({
    type: "manual_expense",
    amount,
    currency: document.querySelector("#currency").value,
    description,
    payment_method: paymentMethod,
    category,
    purpose,
    comment: document.querySelector("#comment").value.trim(),
    submitted_at: new Date().toISOString(),
  });

  error.hidden = true;
  telegram?.HapticFeedback?.notificationOccurred("success");

  if (telegram) {
    telegram.sendData(payload);
  } else {
    document.querySelector("#expense-form").hidden = true;
    document.querySelector("#success").hidden = false;
  }
});
