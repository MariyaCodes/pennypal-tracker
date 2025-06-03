const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_ID",
    appId: "YOUR_APP_ID"
  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  let userId = null;
  
  // Signup with verification
  function signup() {
    const emailVal = email.value;
    const passwordVal = password.value;
  
    firebase.auth().createUserWithEmailAndPassword(emailVal, passwordVal)
      .then(userCredential => {
        userCredential.user.sendEmailVerification()
          .then(() => {
            alert("✅ Verification email sent. Please verify and then log in.");
          });
      })
      .catch(e => alert("❌ " + e.message));
  }
  
  // Login with redirect + verification check
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
  
          // Redirect to Google Site
          window.location.href = "https://sites.google.com/view/pennypal-financial-tracke/home";
        } else {
          alert("❗ Please verify your email address.");
          firebase.auth().signOut();
        }
      })
      .catch(e => alert("❌ " + e.message));
  }
  
  function logout() {
    firebase.auth().signOut().then(() => {
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
        const now = new Date();
  
        snapshot.forEach(doc => {
          const t = doc.data();
          const docId = doc.id;
          const dateObj = t.created.toDate ? t.created.toDate() : new Date(t.created);
  
          // Monthly filter
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
  
  let pieChart;
  function renderPieChart(data) {
    const ctx = document.getElementById("pieChart").getContext("2d");
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(data),
        datasets: [{
          data: Object.values(data),
          backgroundColor: ["#FFB6C1", "#87CEFA", "#FFD700", "#98FB98", "#DDA0DD", "#FFA07A", "#AEEEEE", "#FFC0CB"]
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
  
  // 🎯 Filter by current month
  function filterThisMonth() {
    const now = new Date();
    loadTransactions(now);
  }
  
  
