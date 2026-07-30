const telegram = window.Telegram?.WebApp;
telegram?.ready();
telegram?.expand();

const selections = {
  payment_method: "Наличные",
  purpose: "Личное",
};

document.querySelectorAll(".segments").forEach((group) => {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");
    if (!button) return;

    group.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selections[group.dataset.group] = button.dataset.value;
  });
});

document.querySelector("#expense-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const amountText = document.querySelector("#amount").value.replace(",", ".").replace(/\s/g, "");
  const amount = Number(amountText);
  const description = document.querySelector("#description").value.trim();
  const error = document.querySelector("#error");

  if (!Number.isFinite(amount) || amount <= 0) {
    error.textContent = "Укажите сумму расхода";
    error.hidden = false;
    return;
  }
  if (!description) {
    error.textContent = "Добавьте описание";
    error.hidden = false;
    return;
  }

  const payload = JSON.stringify({
    type: "manual_expense",
    amount,
    description,
    payment_method: selections.payment_method,
    category: document.querySelector("#category").value,
    purpose: selections.purpose,
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
