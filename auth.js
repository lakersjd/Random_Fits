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
  onAuthStateChanged,
  updateProfile,
  deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { ADMIN_EMAILS, firebaseConfig, firebaseIsConfigured } from "./firebase-config.js";

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
const savedDisplayName = document.getElementById("savedDisplayName");
const promotionUpdates = document.getElementById("promotionUpdates");
const stockUpdates = document.getElementById("stockUpdates");
const notificationSettingsForm = document.getElementById("notificationSettingsForm");
const notificationSettingsMessage = document.getElementById("notificationSettingsMessage");
const accountAddressesCard = document.getElementById("accountAddressesCard");
const accountWishlistCard = document.getElementById("accountWishlistCard");
const notificationSettingsCard = document.getElementById("notificationSettingsCard");
const accountSecurityCard = document.getElementById("accountSecurityCard");
const savedAddresses = document.getElementById("savedAddresses");
const addressBookForm = document.getElementById("addressBookForm");
const addressBookMessage = document.getElementById("addressBookMessage");
const accountWishlist = document.getElementById("accountWishlist");
const deleteCustomerAccount = document.getElementById("deleteCustomerAccount");
const accountSecurityMessage = document.getElementById("accountSecurityMessage");
let profileMenu = null;

function notify(message, type = "info", title = "") {
  globalThis.RandomFitsUI?.notify(message, { type, title });
}

function ensureProfileMenu() {
  if (!customerAuthButton || profileMenu) return profileMenu;
  const actions = customerAuthButton.closest?.(".header-actions");
  if (!actions) return null;

  profileMenu = document.createElement("div");
  profileMenu.id = "profileDropdown";
  profileMenu.className = "profile-dropdown hidden";
  profileMenu.innerHTML = `
    <div class="profile-dropdown-user">
      <strong id="profileDropdownName">Customer</strong>
      <span id="profileDropdownEmail"></span>
    </div>
    <nav aria-label="Account menu">
      <a href="account.html#signedInCard">Profile</a>
      <a href="account.html#accountOrdersCard">Orders</a>
      <a href="account.html#accountWishlistCard">Wishlist</a>
      <a href="account.html#accountAddressesCard">Addresses</a>
      <a href="account.html#accountSettingsCard">Settings</a>
      <a class="profile-admin-link hidden" href="admin.html" id="profileAdminLink">Admin Dashboard</a>
    </nav>
    <button class="profile-dropdown-signout" type="button" id="profileDropdownSignOut">Sign Out</button>
  `;
  actions.appendChild(profileMenu);
  customerAuthButton.setAttribute("aria-haspopup", "menu");
  customerAuthButton.setAttribute("aria-expanded", "false");

  profileMenu.querySelector("#profileDropdownSignOut").addEventListener("click", signOutCustomer);
  profileMenu.addEventListener("click", event => {
    if (event.target.closest("a")) closeProfileMenu();
  });
  return profileMenu;
}

function openProfileMenu() {
  const menu = ensureProfileMenu();
  if (!menu) return;
  menu.classList.remove("hidden");
  customerAuthButton.classList.add("active");
  customerAuthButton.setAttribute("aria-expanded", "true");
}

function closeProfileMenu() {
  if (!profileMenu || !customerAuthButton) return;
  profileMenu.classList.add("hidden");
  customerAuthButton.classList.remove("active");
  customerAuthButton.setAttribute("aria-expanded", "false");
}

function toggleProfileMenu() {
  const menu = ensureProfileMenu();
  if (!menu) return;
  if (menu.classList.contains("hidden")) openProfileMenu();
  else closeProfileMenu();
}

function updateProfileMenu(customer) {
  const menu = ensureProfileMenu();
  if (!menu || !customer) return;
  const name = menu.querySelector("#profileDropdownName");
  const email = menu.querySelector("#profileDropdownEmail");
  const adminLink = menu.querySelector("#profileAdminLink");
  if (name) name.textContent = customer.displayName || customer.name || "Customer";
  if (email) email.textContent = customer.email || "";
  if (adminLink) {
    const isAdmin = ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === String(customer.email || "").toLowerCase());
    adminLink.classList.toggle("hidden", !isAdmin);
  }
}

function scrollToAccountHash() {
  if (!window.location.hash) return;
  const target = document.querySelector(window.location.hash);
  if (target && !target.classList.contains("hidden")) {
    setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }
}

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
    name: user.displayName || user.name || "Customer",
    email: user.email || "",
    photo: user.photoURL || user.photo || ""
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
  if (savedDisplayName) savedDisplayName.value = settings.displayName || getSavedCustomer()?.name || "";
  if (preferredSize) preferredSize.value = settings.preferredSize || "M";
  if (savedPhone) savedPhone.value = settings.phone || "";
  if (orderUpdates) orderUpdates.checked = settings.orderUpdates !== false;
  if (promotionUpdates) promotionUpdates.checked = Boolean(settings.promotionUpdates);
  if (stockUpdates) stockUpdates.checked = settings.stockUpdates !== false;
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
    const result = await signInWithPopup(auth, provider);
    const isNewCustomer = Boolean(result?._tokenResponse?.isNewUser);
    notify(
      isNewCustomer ? "Your Random Fits account is ready." : "Welcome back to Random Fits.",
      "success",
      isNewCustomer ? "Signup successful" : "Login successful"
    );
  } catch (error) {
    setMessage(`Google sign-in failed: ${error.message}`, "error");
    notify("Google sign-in could not be completed.", "error", "Login failed");
  }
}

async function signOutCustomer() {
  if (auth) {
    await signOut(auth);
  }

  saveCustomer(null);
  renderSignedOut();
  notify("You have been signed out.", "info", "Signed out");
}

function renderSavedCustomer() {
  const customer = getSavedCustomer();

  if (customer) {
    if (customerAuthButton) customerAuthButton.textContent = customer.name?.split(" ")[0] || "Account";
    updateProfileMenu(customer);
    if (signedOutCard) signedOutCard.classList.add("hidden");
    if (signedInCard) signedInCard.classList.remove("hidden");
    if (accountSettingsCard) accountSettingsCard.classList.remove("hidden");
    [accountAddressesCard, accountWishlistCard, notificationSettingsCard, accountSecurityCard].forEach(card => card?.classList.remove("hidden"));
    if (accountName) accountName.textContent = customer.name || "Customer";
    if (accountEmail) accountEmail.textContent = customer.email || "";
    if (accountPhoto) {
      accountPhoto.src = customer.photo || "";
      accountPhoto.style.display = customer.photo ? "block" : "none";
    }
  }

  renderAccountSettings();
  renderSavedAddresses();
  renderWishlist();
  renderAccountOrders();
  scrollToAccountHash();
}

function renderSignedIn(user) {
  if (customerAuthButton) customerAuthButton.textContent = user.displayName?.split(" ")[0] || "Account";
  updateProfileMenu(user);

  if (signedOutCard) signedOutCard.classList.add("hidden");
  if (signedInCard) signedInCard.classList.remove("hidden");
  if (accountSettingsCard) accountSettingsCard.classList.remove("hidden");
  [accountAddressesCard, accountWishlistCard, notificationSettingsCard, accountSecurityCard].forEach(card => card?.classList.remove("hidden"));

  if (accountName) accountName.textContent = user.displayName || "Customer";
  if (accountEmail) accountEmail.textContent = user.email || "";
  if (accountPhoto) {
    accountPhoto.src = user.photoURL || "";
    accountPhoto.style.display = user.photoURL ? "block" : "none";
  }

  setMessage(`Signed in as ${user.email}.`, "success");
  renderAccountSettings();
  renderSavedAddresses();
  renderWishlist();
  prefillCheckout(user);
  renderAccountOrders();
  scrollToAccountHash();
}

function renderSignedOut() {
  if (customerAuthButton) customerAuthButton.textContent = "Sign in";
  closeProfileMenu();

  if (signedOutCard) signedOutCard.classList.remove("hidden");
  if (signedInCard) signedInCard.classList.add("hidden");
  if (accountSettingsCard) accountSettingsCard.classList.add("hidden");
  [accountAddressesCard, accountWishlistCard, notificationSettingsCard, accountSecurityCard].forEach(card => card?.classList.add("hidden"));

  renderAccountOrders();
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function customerStorageKey(name) {
  const email = getSavedCustomer()?.email?.toLowerCase() || "guest";
  return `randomFits${name}:${email}`;
}

function getSavedAddresses() {
  try {
    const addresses = JSON.parse(localStorage.getItem(customerStorageKey("Addresses")));
    return Array.isArray(addresses) ? addresses : [];
  } catch {
    return [];
  }
}

function renderSavedAddresses() {
  if (!savedAddresses) return;
  const addresses = getSavedAddresses();
  if (!addresses.length) {
    savedAddresses.innerHTML = `<p class="note">No saved addresses yet.</p>`;
    return;
  }

  savedAddresses.innerHTML = addresses.map(address => `
    <article class="saved-address-card">
      <div><strong>${escapeHtml(address.label)}</strong><p>${escapeHtml(address.address)}</p><p>${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.zip)}</p></div>
      <button class="remove-summary-item" type="button" data-delete-address="${escapeHtml(address.id)}">Remove</button>
    </article>
  `).join("");
}

function renderWishlist() {
  if (!accountWishlist) return;
  const ids = JSON.parse(localStorage.getItem("randomFitsWishlist") || "[]").map(String);
  let catalog = [];
  try {
    catalog = JSON.parse(localStorage.getItem("randomFitsCatalog")) || [];
  } catch {
    catalog = [];
  }
  const products = catalog.filter(product => ids.includes(String(product.id)));

  if (!products.length) {
    accountWishlist.innerHTML = `<p class="note">Your wishlist is empty. Save products from the shop or product page.</p>`;
    return;
  }

  accountWishlist.innerHTML = products.map(product => `
    <article class="wishlist-row">
      ${product.imageUrl ? `<img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}">` : `<div class="wishlist-image-empty">No image</div>`}
      <div><a href="product.html?id=${encodeURIComponent(product.id)}"><strong>${escapeHtml(product.name)}</strong></a><span>${money(product.price)}</span></div>
      <button class="remove-summary-item" type="button" data-remove-wishlist="${escapeHtml(product.id)}">Remove</button>
    </article>
  `).join("");
}

function orderTrackingHtml(status) {
  const steps = ["New", "Packing", "Shipped"];
  const current = steps.indexOf(status);
  if (status === "Cancelled") return `<div class="order-tracking cancelled"><strong>Order cancelled</strong><span>This order will not be shipped.</span></div>`;

  return `<div class="order-tracking" aria-label="Order tracking">
    ${steps.map((step, index) => `<div class="${index <= Math.max(0, current) ? "complete" : ""}"><span></span><small>${step}</small></div>`).join("")}
  </div>`;
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

      ${orderTrackingHtml(order.status || "New")}

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
  notify(`Order ${orderNumber} was cancelled.`, "success", "Order updated");
}

if (customerAuthButton) {
  customerAuthButton.addEventListener("click", event => {
    event.stopPropagation();
    const saved = getSavedCustomer();

    if (saved) {
      toggleProfileMenu();
    } else {
      signInWithGoogle();
    }
  });
}

document.addEventListener?.("click", event => {
  if (profileMenu && !event.target.closest(".header-actions")) closeProfileMenu();
});

document.addEventListener?.("keydown", event => {
  if (event.key === "Escape") closeProfileMenu();
});

if (accountGoogleLogin) {
  accountGoogleLogin.addEventListener("click", signInWithGoogle);
}

if (accountSignOut) {
  accountSignOut.addEventListener("click", signOutCustomer);
}

if (accountSettingsForm) {
  accountSettingsForm.addEventListener("submit", async event => {
    event.preventDefault();

    const settings = {
      ...getAccountSettings(),
      displayName: savedDisplayName?.value.trim() || getSavedCustomer()?.name || "Customer",
      preferredSize: preferredSize?.value || "M",
      phone: savedPhone?.value.trim() || "",
      orderUpdates: Boolean(orderUpdates?.checked)
    };

    const email = getSavedCustomer()?.email?.toLowerCase() || "guest";
    localStorage.setItem(`randomFitsAccountSettings:${email}`, JSON.stringify(settings));
    const customer = getSavedCustomer();
    if (customer) saveCustomer({ ...customer, displayName: settings.displayName });

    try {
      if (auth?.currentUser && auth.currentUser.displayName !== settings.displayName) {
        await updateProfile(auth.currentUser, { displayName: settings.displayName });
      }
      if (accountName) accountName.textContent = settings.displayName;
      if (accountSettingsMessage) {
        accountSettingsMessage.textContent = "Profile saved.";
        accountSettingsMessage.classList.add("success");
      }
      notify("Your profile information was updated.", "success", "Profile saved");
    } catch (error) {
      if (accountSettingsMessage) accountSettingsMessage.textContent = "Your local profile was saved, but Google could not be updated.";
      notify("Some profile changes could not be synced.", "error", "Profile error");
    }
  });
}

if (notificationSettingsForm) {
  notificationSettingsForm.addEventListener("submit", event => {
    event.preventDefault();
    const email = getSavedCustomer()?.email?.toLowerCase() || "guest";
    const settings = {
      ...getAccountSettings(),
      orderUpdates: Boolean(orderUpdates?.checked),
      promotionUpdates: Boolean(promotionUpdates?.checked),
      stockUpdates: Boolean(stockUpdates?.checked)
    };
    localStorage.setItem(`randomFitsAccountSettings:${email}`, JSON.stringify(settings));
    if (notificationSettingsMessage) notificationSettingsMessage.textContent = "Notification preferences saved.";
    notify("Your notification preferences were updated.", "success", "Preferences saved");
  });
}

if (addressBookForm) {
  addressBookForm.addEventListener("submit", event => {
    event.preventDefault();
    const addresses = getSavedAddresses();
    addresses.push({
      id: globalThis.crypto?.randomUUID?.() || `address-${Date.now()}`,
      label: document.getElementById("addressLabel").value.trim(),
      address: document.getElementById("accountAddress").value.trim(),
      city: document.getElementById("accountCity").value.trim(),
      state: document.getElementById("accountState").value.trim(),
      zip: document.getElementById("accountZip").value.trim()
    });
    localStorage.setItem(customerStorageKey("Addresses"), JSON.stringify(addresses.slice(0, 10)));
    addressBookForm.reset();
    if (addressBookMessage) addressBookMessage.textContent = "Address saved.";
    renderSavedAddresses();
    notify("A delivery address was added.", "success", "Address saved");
  });
}

if (savedAddresses) {
  savedAddresses.addEventListener("click", event => {
    const button = event.target.closest("[data-delete-address]");
    if (!button) return;
    const addresses = getSavedAddresses().filter(address => address.id !== button.dataset.deleteAddress);
    localStorage.setItem(customerStorageKey("Addresses"), JSON.stringify(addresses));
    renderSavedAddresses();
    notify("The saved address was removed.", "info", "Address removed");
  });
}

if (accountWishlist) {
  accountWishlist.addEventListener("click", event => {
    const button = event.target.closest("[data-remove-wishlist]");
    if (!button) return;
    const ids = JSON.parse(localStorage.getItem("randomFitsWishlist") || "[]")
      .filter(id => String(id) !== String(button.dataset.removeWishlist));
    localStorage.setItem("randomFitsWishlist", JSON.stringify(ids));
    renderWishlist();
    notify("The product was removed from your wishlist.", "info", "Wishlist updated");
  });
}

if (deleteCustomerAccount) {
  deleteCustomerAccount.addEventListener("click", async () => {
    if (!confirm("Delete your Random Fits account data? This cannot be undone.")) return;
    try {
      const email = getSavedCustomer()?.email?.toLowerCase() || "guest";
      if (auth?.currentUser) await deleteUser(auth.currentUser);
      localStorage.removeItem(`randomFitsAccountSettings:${email}`);
      localStorage.removeItem(customerStorageKey("Addresses"));
      localStorage.removeItem("randomFitsWishlist");
      saveCustomer(null);
      renderSignedOut();
      notify("Your Random Fits account was deleted.", "success", "Account deleted");
    } catch (error) {
      if (accountSecurityMessage) accountSecurityMessage.textContent = "Please sign out, sign in again, and retry account deletion.";
      notify("Google requires a recent login before account deletion.", "error", "Delete account failed");
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

