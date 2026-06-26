import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { firebaseConfig, firebaseIsConfigured } from "./firebase-config.js";

let app = null;
let auth = null;
let provider = null;
let firebaseReady = false;

const customerAuthButton = document.getElementById("customerAuthButton");
const accountGoogleLogin = document.getElementById("accountGoogleLogin");
const accountLoginMessage = document.getElementById("accountLoginMessage");
const accountSignOut = document.getElementById("accountSignOut");
const signedOutCard = document.getElementById("signedOutCard");
const signedInCard = document.getElementById("signedInCard");
const accountPhoto = document.getElementById("accountPhoto");
const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const accountOrders = document.getElementById("accountOrders");

function setMessage(message, type = "") {
  if (!accountLoginMessage) return;

  accountLoginMessage.innerHTML = message;
  accountLoginMessage.classList.remove("success", "error");

  if (type) {
    accountLoginMessage.classList.add(type);
  }
}

function saveCustomer(user) {
  if (!user) {
    localStorage.removeItem("randomFitsCustomer");
    return;
  }

  localStorage.setItem("randomFitsCustomer", JSON.stringify({
    uid: user.uid,
    name: user.displayName || "Customer",
    email: user.email || "",
    photo: user.photoURL || ""
  }));
}

function getSavedCustomer() {
  return JSON.parse(localStorage.getItem("randomFitsCustomer")) || null;
}

function initFirebase() {
  if (!firebaseIsConfigured()) {
    if (customerAuthButton) customerAuthButton.textContent = "Login setup needed";
    if (accountGoogleLogin) accountGoogleLogin.disabled = true;

    setMessage(
      "Google customer login is not connected yet. Paste your Firebase config inside <strong>auth.js</strong>.",
      "error"
    );

    renderSavedCustomer();
    return;
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account"
  });

  firebaseReady = true;

  onAuthStateChanged(auth, user => {
    if (user) {
      saveCustomer(user);
      renderSignedIn(user);
    } else {
      saveCustomer(null);
      renderSignedOut();
    }
  });
}

async function signInWithGoogle() {
  if (!firebaseReady || !auth || !provider) {
    setMessage("Google login is not ready. Add Firebase config in firebase-config.js.", "error");
    return;
  }

  try {
    setMessage("Opening Google sign-in...");
    await signInWithPopup(auth, provider);
  } catch (error) {
    setMessage(`Google sign-in failed: ${error.message}`, "error");
  }
}

async function signOutCustomer() {
  if (auth) {
    await signOut(auth);
  }

  saveCustomer(null);
  renderSignedOut();
}

function renderSavedCustomer() {
  const customer = getSavedCustomer();

  if (customer) {
    if (customerAuthButton) customerAuthButton.textContent = customer.name?.split(" ")[0] || "Account";
    if (signedOutCard) signedOutCard.classList.add("hidden");
    if (signedInCard) signedInCard.classList.remove("hidden");
    if (accountName) accountName.textContent = customer.name || "Customer";
    if (accountEmail) accountEmail.textContent = customer.email || "";
    if (accountPhoto) {
      accountPhoto.src = customer.photo || "";
      accountPhoto.style.display = customer.photo ? "block" : "none";
    }
  }

  renderAccountOrders();
}

function renderSignedIn(user) {
  if (customerAuthButton) customerAuthButton.textContent = user.displayName?.split(" ")[0] || "Account";

  if (signedOutCard) signedOutCard.classList.add("hidden");
  if (signedInCard) signedInCard.classList.remove("hidden");

  if (accountName) accountName.textContent = user.displayName || "Customer";
  if (accountEmail) accountEmail.textContent = user.email || "";
  if (accountPhoto) {
    accountPhoto.src = user.photoURL || "";
    accountPhoto.style.display = user.photoURL ? "block" : "none";
  }

  setMessage(`Signed in as ${user.email}.`, "success");
  renderAccountOrders();
}

function renderSignedOut() {
  if (customerAuthButton) customerAuthButton.textContent = "Sign in";

  if (signedOutCard) signedOutCard.classList.remove("hidden");
  if (signedInCard) signedInCard.classList.add("hidden");

  renderAccountOrders();
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function renderAccountOrders() {
  if (!accountOrders) return;

  const orders = JSON.parse(localStorage.getItem("randomFitsOrders")) || [];

  if (orders.length === 0) {
    accountOrders.innerHTML = `<p class="note">No test orders yet.</p>`;
    return;
  }

  accountOrders.innerHTML = orders.map(order => `
    <div class="account-order">
      <div>
        <strong>${order.orderNumber}</strong>
        <span>${new Date(order.createdAt).toLocaleString()}</span>
      </div>
      <b>${money(order.total)}</b>
    </div>
  `).join("");
}

if (customerAuthButton) {
  customerAuthButton.addEventListener("click", () => {
    const saved = getSavedCustomer();

    if (saved) {
      window.location.href = "account.html";
    } else {
      signInWithGoogle();
    }
  });
}

if (accountGoogleLogin) {
  accountGoogleLogin.addEventListener("click", signInWithGoogle);
}

if (accountSignOut) {
  accountSignOut.addEventListener("click", signOutCustomer);
}

initFirebase();

