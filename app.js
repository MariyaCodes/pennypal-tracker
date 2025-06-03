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
  renderChart();
  generateCSVLink();
}

function renderTransactions() {
  tableBody.innerHTML = "";
  transactions.forEach(tx => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${tx.type}</td>
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
  balanceEl.textContent = `$${total.toFixed(2)}`;
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

function renderChart() {
  const ctx = document.getElementById("pieChart").getContext("2d");
  const expenseData = transactions.filter(tx => tx.type === "Expense");

  const categorySums = {};
  expenseData.forEach(tx => {
    categorySums[tx.category] = (categorySums[tx.category] || 0) + tx.amount;
  });

  const labels = Object.keys(categorySums);
  const values = Object.values(categorySums);

  if (window.pieChart) window.pieChart.destroy();

  window.pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#FFB6C1", "#87CEFA", "#FFD700", "#98FB98",
          "#DDA0DD", "#FFA07A", "#AEEEEE", "#FFC0CB"
        ]
      }]
    },
    options: {
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
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


