import {
  initializeApp,
  getApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
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
const accountSettingsCard = document.getElementById("accountSettingsCard");
const accountSettingsForm = document.getElementById("accountSettingsForm");
const accountSettingsMessage = document.getElementById("accountSettingsMessage");
const preferredSize = document.getElementById("preferredSize");
const savedPhone = document.getElementById("savedPhone");
const orderUpdates = document.getElementById("orderUpdates");

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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getAccountSettings() {
  try {
    const email = getSavedCustomer()?.email?.toLowerCase() || "guest";
    return JSON.parse(localStorage.getItem(`randomFitsAccountSettings:${email}`)) || {};
  } catch {
    return {};
  }
}

function renderAccountSettings() {
  if (!accountSettingsForm) return;
  const settings = getAccountSettings();
  if (preferredSize) preferredSize.value = settings.preferredSize || "M";
  if (savedPhone) savedPhone.value = settings.phone || "";
  if (orderUpdates) orderUpdates.checked = settings.orderUpdates !== false;
}

function prefillCheckout(user) {
  const emailInput = document.getElementById("email");
  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const phoneInput = document.getElementById("phone");
  const settings = getAccountSettings();
  const nameParts = String(user?.displayName || "").trim().split(/\s+/).filter(Boolean);

  if (emailInput && !emailInput.value) emailInput.value = user?.email || "";
  if (firstNameInput && !firstNameInput.value) firstNameInput.value = nameParts[0] || "";
  if (lastNameInput && !lastNameInput.value) lastNameInput.value = nameParts.slice(1).join(" ");
  if (phoneInput && !phoneInput.value) phoneInput.value = settings.phone || "";
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

  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
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
    if (accountSettingsCard) accountSettingsCard.classList.remove("hidden");
    if (accountName) accountName.textContent = customer.name || "Customer";
    if (accountEmail) accountEmail.textContent = customer.email || "";
    if (accountPhoto) {
      accountPhoto.src = customer.photo || "";
      accountPhoto.style.display = customer.photo ? "block" : "none";
    }
  }

  renderAccountSettings();
  renderAccountOrders();
}

function renderSignedIn(user) {
  if (customerAuthButton) customerAuthButton.textContent = user.displayName?.split(" ")[0] || "Account";

  if (signedOutCard) signedOutCard.classList.add("hidden");
  if (signedInCard) signedInCard.classList.remove("hidden");
  if (accountSettingsCard) accountSettingsCard.classList.remove("hidden");

  if (accountName) accountName.textContent = user.displayName || "Customer";
  if (accountEmail) accountEmail.textContent = user.email || "";
  if (accountPhoto) {
    accountPhoto.src = user.photoURL || "";
    accountPhoto.style.display = user.photoURL ? "block" : "none";
  }

  setMessage(`Signed in as ${user.email}.`, "success");
  renderAccountSettings();
  prefillCheckout(user);
  renderAccountOrders();
}

function renderSignedOut() {
  if (customerAuthButton) customerAuthButton.textContent = "Sign in";

  if (signedOutCard) signedOutCard.classList.remove("hidden");
  if (signedInCard) signedInCard.classList.add("hidden");
  if (accountSettingsCard) accountSettingsCard.classList.add("hidden");

  renderAccountOrders();
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function renderAccountOrders() {
  if (!accountOrders) return;

  const customer = getSavedCustomer();

  if (!customer?.email) {
    accountOrders.innerHTML = `<p class="note">Sign in to view your orders.</p>`;
    return;
  }

  const customerEmail = customer.email.toLowerCase();
  const orders = (JSON.parse(localStorage.getItem("randomFitsOrders")) || [])
    .filter(order => String(order.customer?.email || "").toLowerCase() === customerEmail);

  if (orders.length === 0) {
    accountOrders.innerHTML = `<p class="note">No orders found for ${escapeHtml(customer.email)}.</p>`;
    return;
  }

  accountOrders.innerHTML = orders.map(order => `
    <article class="account-order-card">
      <div class="account-order-head">
        <div>
          <strong>${escapeHtml(order.orderNumber)}</strong>
          <span>${new Date(order.createdAt).toLocaleString()}</span>
        </div>
        <em class="status-pill ${escapeHtml(String(order.status || "New").toLowerCase().replace(/\s+/g, "-"))}">${escapeHtml(order.status || "New")}</em>
      </div>

      <div class="account-order-items">
        ${(order.items || []).map(item => `
          <div>
            <span>${escapeHtml(item.name)} · ${escapeHtml(item.color)} · Size ${escapeHtml(item.size)}</span>
            <strong>Qty ${Number(item.quantity || 0)}</strong>
          </div>
        `).join("")}
      </div>

      <div class="account-order-shipping">
        <span>Ship to</span>
        <p>${escapeHtml(order.shipping?.address || "")}</p>
        <p>${escapeHtml(order.shipping?.city || "")}, ${escapeHtml(order.shipping?.state || "")} ${escapeHtml(order.shipping?.zip || "")}</p>
      </div>

      <div class="account-order-footer">
        <b>${money(order.total)}</b>
        ${["New", "Packing"].includes(order.status || "New")
          ? `<button class="remove-summary-item" type="button" data-cancel-order="${escapeHtml(order.orderNumber)}">Cancel Order</button>`
          : ""}
      </div>
    </article>
  `).join("");
}

function cancelCustomerOrder(orderNumber) {
  const customer = getSavedCustomer();
  if (!customer?.email) return;

  const orders = JSON.parse(localStorage.getItem("randomFitsOrders")) || [];
  const order = orders.find(item => item.orderNumber === orderNumber);
  const ownsOrder = String(order?.customer?.email || "").toLowerCase() === customer.email.toLowerCase();
  const canCancel = order && ["New", "Packing"].includes(order.status || "New");

  if (!ownsOrder || !canCancel) return;
  if (!confirm(`Cancel order ${orderNumber}?`)) return;

  order.status = "Cancelled";
  order.cancelledAt = new Date().toISOString();
  localStorage.setItem("randomFitsOrders", JSON.stringify(orders));
  renderAccountOrders();
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

if (accountSettingsForm) {
  accountSettingsForm.addEventListener("submit", event => {
    event.preventDefault();

    const settings = {
      preferredSize: preferredSize?.value || "M",
      phone: savedPhone?.value.trim() || "",
      orderUpdates: Boolean(orderUpdates?.checked)
    };

    const email = getSavedCustomer()?.email?.toLowerCase() || "guest";
    localStorage.setItem(`randomFitsAccountSettings:${email}`, JSON.stringify(settings));
    if (accountSettingsMessage) {
      accountSettingsMessage.textContent = "Settings saved on this device.";
      accountSettingsMessage.classList.add("success");
    }
  });
}

if (accountOrders) {
  accountOrders.addEventListener("click", event => {
    const button = event.target.closest("[data-cancel-order]");
    if (button) cancelCustomerOrder(button.dataset.cancelOrder);
  });
}

initFirebase();

