const form = document.getElementById("transactionForm");
const type = document.getElementById("type");
const category = document.getElementById("category");
const amount = document.getElementById("amount");
const balanceEl = document.getElementById("balance");
const tableBody = document.querySelector("#transactionTable tbody");
const downloadCSV = document.getElementById("downloadCSV");

let transactions = JSON.parse(localStorage.getItem("pennypal-transactions")) || [];

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const transaction = {
    id: Date.now(),
    type: type.value,
    category: category.value.trim(),
    amount: parseFloat(amount.value),
    created: new Date().toISOString()
  };
  transactions.push(transaction);
  saveAndRender();
  form.reset();
});

function saveAndRender() {
  localStorage.setItem("pennypal-transactions", JSON.stringify(transactions));
  renderTransactions();
  renderBalance();
  renderPieChartCategoryWise();
  renderPieChartAllExpenses();
  generateCSVLink();
}

function renderTransactions() {
  tableBody.innerHTML = "";
  transactions.forEach(tx => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="color:${tx.type === "Income" ? "green" : "red"}">${tx.type}</td>
      <td>${tx.category}</td>
      <td>${tx.amount.toFixed(2)}</td>
      <td>
        <button onclick="editTransaction(${tx.id})">✏️</button>
        <button onclick="deleteTransaction(${tx.id})">🗑️</button>
      </td>`;
    tableBody.appendChild(row);
  });
}

function renderBalance() {
  const total = transactions.reduce((acc, tx) => {
    return tx.type === "Expense" ? acc - tx.amount : acc + tx.amount;
  }, 0);
  balanceEl.textContent = `${total.toFixed(2)}`;
}

function deleteTransaction(id) {
  transactions = transactions.filter(tx => tx.id !== id);
  saveAndRender();
}

function editTransaction(id) {
  const tx = transactions.find(tx => tx.id === id);
  const newCategory = prompt("Edit category:", tx.category);
  const newAmount = parseFloat(prompt("Edit amount:", tx.amount));
  if (newCategory && !isNaN(newAmount)) {
    tx.category = newCategory;
    tx.amount = newAmount;
    saveAndRender();
  }
}

// PIE CHART #1 – Category-wise Expense Summary
function renderPieChartCategoryWise() {
  const ctx = document.getElementById("pieChart").getContext("2d");
  const expenses = transactions.filter(tx => tx.type === "Expense");

  const categoryTotals = {};
  expenses.forEach(tx => {
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
  });

  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);

  if (window.pieChart1) window.pieChart1.destroy();

  if (labels.length === 0) {
    ctx.clearRect(0, 0, 300, 300);
    ctx.font = "14px Arial";
    ctx.fillStyle = "#999";
    ctx.fillText("No expense data to display", 50, 150);
    return;
  }

  window.pieChart1 = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ["#FFA07A", "#87CEFA", "#FFB6C1", "#DA70D6", "#98FB98", "#FFD700"]
      }]
    },
    options: {
      plugins: { legend: { position: "bottom" } }
    }
  });
}

// PIE CHART #2 – Every Expense as Slice
function renderPieChartAllExpenses() {
  const ctx2 = document.getElementById("pieChart2").getContext("2d");
  const expenses = transactions.filter(tx => tx.type === "Expense");

  const labels = expenses.map((tx, i) => `${tx.category} ${i + 1}`);
  const values = expenses.map(tx => tx.amount);
  const colors = values.map(() => getRandomPastel());

  if (window.pieChart2) window.pieChart2.destroy();

  window.pieChart2 = new Chart(ctx2, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors
      }]
    },
    options: {
      plugins: { legend: { position: "bottom" } }
    }
  });
}

// Pastel random color generator
function getRandomPastel() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 85%)`;
}

function generateCSVLink() {
  const rows = [["Type", "Category", "Amount", "Date"]];
  transactions.forEach(tx => {
    rows.push([tx.type, tx.category, tx.amount.toFixed(2), new Date(tx.created).toLocaleDateString()]);
  });

  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  downloadCSV.href = url;
  downloadCSV.download = "pennypal-transactions.csv";
}

// Initial render
saveAndRender();
