// ⬇️ Your Firebase config here:
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_ID",
    appId: "YOUR_APP_ID"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  let userId = null;
  
  // 🔐 Sign-up
  function signup() {
    const emailVal = email.value;
    const passwordVal = password.value;
  
    firebase.auth().createUserWithEmailAndPassword(emailVal, passwordVal)
      .then(() => alert("✅ Signup successful! Please log in."))
      .catch(e => alert("❌ " + e.message));
  }
  
  // 🔐 Login
  function signin() {
    const emailVal = email.value;
    const passwordVal = password.value;
  
    firebase.auth().signInWithEmailAndPassword(emailVal, passwordVal)
      .then(userCredential => {
        userId = userCredential.user.uid;
        userEmail.textContent = emailVal;
        auth.style.display = 'none';
        tracker.style.display = 'block';
        loadTransactions();
      })
      .catch(e => alert("❌ " + e.message));
  }
  
  // 🔐 Logout
  function logout() {
    firebase.auth().signOut()
      .then(() => {
        auth.style.display = 'block';
        tracker.style.display = 'none';
        document.querySelector("#transactions tbody").innerHTML = "";
        document.getElementById("balance").textContent = "$0.00";
      });
  }
  
  // ➕ Add transaction
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
  
  // 📥 Load and show transactions
  function loadTransactions() {
    db.collection("users").doc(userId).collection("transactions")
      .orderBy("created")
      .get()
      .then(snapshot => {
        let balance = 0;
        const expenses = {};
        let tableRows = "";
  
        snapshot.forEach(doc => {
          const t = doc.data();
          balance += t.amount;
  
          tableRows += `
            <tr>
              <td>${t.type}</td>
              <td>${t.category}</td>
              <td>${t.amount.toFixed(2)}</td>
            </tr>`;
  
          if (t.type === "Expense") {
            expenses[t.category] = (expenses[t.category] || 0) + Math.abs(t.amount);
          }
        });
  
        document.querySelector("#transactions tbody").innerHTML = tableRows;
        document.getElementById("balance").textContent = `$${balance.toFixed(2)}`;
        renderPieChart(expenses);
      });
  }
  
  // 📊 Pie chart for expenses
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
          backgroundColor: [
            "#FFB6C1", "#87CEFA", "#FFD700", "#98FB98", "#DDA0DD", "#FFA07A",
            "#AEEEEE", "#FFC0CB"
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
  