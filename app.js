// Firebase configuration for PennyPalTracker
const firebaseConfig = {
  apiKey: "AIzaSyClGm83y88ZBvEvUzMydZe123wQRm0IZ9I",
  authDomain: "pennypaltracker.firebaseapp.com",
  projectId: "pennypaltracker",
  storageBucket: "pennypaltracker.appspot.com",  // Fixed typo: should be .appspot.com
  messagingSenderId: "443059272077",
  appId: "1:443059272077:web:7ebaf98ce929da5ba5a5c4",
  measurementId: "G-VSJS9KBD11"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let userId = null;


function signup() {
  const emailVal = email.value;
  const passwordVal = password.value;

  firebase.auth().createUserWithEmailAndPassword(emailVal, passwordVal)
    .then(userCredential => {
      userCredential.user.sendEmailVerification()
        .then(() => {
          alert("✅ Signup success! Please verify your email before logging in.");
        });
    })
    .catch(e => alert("❌ " + e.message));
}

function signin() {
  const emailVal = email.value;
  const passwordVal = password.value;

  firebase.auth().signInWithEmailAndPassword(emailVal, passwordVal)
    .then(userCredential => {
      if (userCredential.user.emailVerified) {
        userId = userCredential.user.uid;
        userEmail.textContent = emailVal;
        auth.style.display = 'none';
        tracker.style.display = 'block';
        loadTransactions();
      } else {
        alert("❗ Please verify your email before logging in.");
        firebase.auth().signOut();
      }
    })
    .catch(e => alert("❌ " + e.message));
}

function logout() {
  firebase.auth().signOut()
    .then(() => {
      auth.style.display = 'block';
      tracker.style.display = 'none';
      document.querySelector("#transactions tbody").innerHTML = "";
      document.getElementById("balance").textContent = "$0.00";
    });
}

function addTransaction() {
  const tType = type.value;
  const tCategory = category.value.trim();
  const tAmount = parseFloat(amount.value);

  if (!tCategory || isNaN(tAmount)) {
    alert("Please enter valid category and amount.");
    return;
  }

  const transaction = {
    type: tType,
    category: tCategory,
    amount: tType === "Expense" ? -Math.abs(tAmount) : Math.abs(tAmount),
    created: new Date()
  };

  db.collection("users").doc(userId).collection("transactions").add(transaction)
    .then(() => {
      category.value = "";
      amount.value = "";
      loadTransactions();
    });
}

function updateTransaction(id, updatedData) {
  db.collection("users").doc(userId).collection("transactions").doc(id).update(updatedData)
    .then(loadTransactions);
}

function deleteTransaction(id) {
  db.collection("users").doc(userId).collection("transactions").doc(id).delete()
    .then(loadTransactions);
}

function loadTransactions(monthFilter = null) {
  db.collection("users").doc(userId).collection("transactions")
    .orderBy("created")
    .get()
    .then(snapshot => {
      let balance = 0;
      const expenses = {};
      let tableRows = "";
      const csvRows = [["Type", "Category", "Amount", "Date"]];

      snapshot.forEach(doc => {
        const t = doc.data();
        const docId = doc.id;
        const dateObj = t.created.toDate ? t.created.toDate() : new Date(t.created);

        if (monthFilter) {
          if (dateObj.getMonth() !== monthFilter.getMonth() || dateObj.getFullYear() !== monthFilter.getFullYear()) return;
        }

        balance += t.amount;
        csvRows.push([t.type, t.category, t.amount.toFixed(2), dateObj.toLocaleDateString()]);

        tableRows += `
          <tr>
            <td>${t.type}</td>
            <td>${t.category}</td>
            <td>${t.amount.toFixed(2)}</td>
            <td>
              <button onclick="editPrompt('${docId}', '${t.type}', '${t.category}', ${t.amount})">✏️</button>
              <button onclick="deleteTransaction('${docId}')">🗑️</button>
            </td>
          </tr>`;

        if (t.type === "Expense") {
          expenses[t.category] = (expenses[t.category] || 0) + Math.abs(t.amount);
        }
      });

      document.querySelector("#transactions tbody").innerHTML = tableRows;
      document.getElementById("balance").textContent = `$${balance.toFixed(2)}`;
      renderPieChart(expenses);
      generateCSV(csvRows);
    });
}

function renderPieChart(data) {
  const ctx = document.getElementById("pieChart").getContext("2d");
  if (window.pieChart) window.pieChart.destroy();
  window.pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: ["#FFB6C1", "#87CEFA", "#FFD700", "#98FB98", "#DDA0DD", "#FFA07A"]
      }]
    },
    options: {
      plugins: { legend: { position: "bottom" } }
    }
  });
}

function editPrompt(id, type, category, amount) {
  const newCategory = prompt("Edit category:", category);
  const newAmount = parseFloat(prompt("Edit amount:", amount));
  if (newCategory && !isNaN(newAmount)) {
    updateTransaction(id, {
      category: newCategory,
      amount: type === "Expense" ? -Math.abs(newAmount) : Math.abs(newAmount)
    });
  }
}

function generateCSV(data) {
  const csvContent = data.map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  document.getElementById("downloadCSV").href = url;
  document.getElementById("downloadCSV").download = "transactions.csv";
}
