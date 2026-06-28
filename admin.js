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

import {
  firebaseConfig,
  ADMIN_EMAILS,
  firebaseIsConfigured,
  adminEmailsAreConfigured
} from "./firebase-config.js";
import {
  cacheCatalog,
  getCachedStoreSettings,
  loadCatalog,
  loadStoreSettings,
  normalizeCatalog,
  saveCatalog,
  saveStoreSettings,
  uploadCatalogImage
} from "./catalog.js";

const adminLock = document.getElementById("adminLock");
const adminDashboard = document.getElementById("adminDashboard");
const googleLoginButton = document.getElementById("googleLoginButton");
const adminLoginMessage = document.getElementById("adminLoginMessage");
const lockAdmin = document.getElementById("lockAdmin");

const ordersList = document.getElementById("ordersList");
const orderDetails = document.getElementById("orderDetails");
const refreshOrders = document.getElementById("refreshOrders");
const exportOrders = document.getElementById("exportOrders");
const printAllLabels = document.getElementById("printAllLabels");
const clearAllOrders = document.getElementById("clearAllOrders");

const productEditorList = document.getElementById("productEditorList");
const catalogStatus = document.getElementById("catalogStatus");
const addProductButton = document.getElementById("addProduct");
const saveCatalogButton = document.getElementById("saveCatalog");
const saveCatalogDraftButton = document.getElementById("saveCatalogDraft");

const statTotalOrders = document.getElementById("statTotalOrders");
const statNewOrders = document.getElementById("statNewOrders");
const statSales = document.getElementById("statSales");
const adminNavItems = document.querySelectorAll("[data-admin-target]");
const adminPanels = document.querySelectorAll("[data-admin-panel]");
const adminJumpButtons = document.querySelectorAll("[data-admin-jump]");
const customersList = document.getElementById("customersList");
const homeOrderCount = document.getElementById("homeOrderCount");
const homeProductCount = document.getElementById("homeProductCount");
const homeSalesTotal = document.getElementById("homeSalesTotal");
const analyticsSales = document.getElementById("analyticsSales");
const analyticsOrders = document.getElementById("analyticsOrders");
const analyticsAverage = document.getElementById("analyticsAverage");
const analyticsCustomers = document.getElementById("analyticsCustomers");
const contentSettingsForm = document.getElementById("contentSettingsForm");
const storeSettingsForm = document.getElementById("storeSettingsForm");
const discountSettingsForm = document.getElementById("discountSettingsForm");
const adminReviewList = document.getElementById("adminReviewList");

let selectedOrderNumber = null;
let firebaseReady = false;
let app = null;
let auth = null;
let provider = null;
let catalogProducts = [];
let catalogDirty = false;
let catalogRemoteReady = false;
let storeSettings = getCachedStoreSettings();

function notify(message, type = "info", title = "") {
  globalThis.RandomFitsUI?.notify(message, { type, title });
}

function setLoginMessage(message, type = "") {
  if (!adminLoginMessage) return;

  adminLoginMessage.innerHTML = message;
  adminLoginMessage.classList.remove("success", "error");

  if (type) {
    adminLoginMessage.classList.add(type);
  }
}

function initFirebaseLogin() {
  if (!firebaseIsConfigured()) {
    setLoginMessage(
      "Google login is not connected yet. Paste your Firebase config inside <strong>firebase-config.js</strong>.",
      "error"
    );

    if (googleLoginButton) {
      googleLoginButton.disabled = true;
    }

    return;
  }

  if (!adminEmailsAreConfigured()) {
    setLoginMessage(
      "Add your approved Google admin email inside <strong>ADMIN_EMAILS</strong> in firebase-config.js.",
      "error"
    );

    if (googleLoginButton) {
      googleLoginButton.disabled = true;
    }

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
    if (!user) {
      showLocked();
      return;
    }

    if (isApprovedAdmin(user.email)) {
      unlockAdmin(user);
    } else {
      showLocked();
      setLoginMessage(
        `Signed in as <strong>${user.email}</strong>, but this email is not allowed as admin.`,
        "error"
      );
      signOut(auth);
    }
  });
}

function isApprovedAdmin(email) {
  return ADMIN_EMAILS.map(item => item.toLowerCase()).includes(String(email || "").toLowerCase());
}

async function signInWithGoogle() {
  if (!firebaseReady || !auth || !provider) {
    setLoginMessage("Google login is not ready. Check firebase-config.js.", "error");
    return;
  }

  try {
    setLoginMessage("Opening Google sign-in...");
    await signInWithPopup(auth, provider);
  } catch (error) {
    setLoginMessage(`Google sign-in failed: ${error.message}`, "error");
  }
}

async function signOutAdmin() {
  if (auth) {
    await signOut(auth);
  }

  showLocked();
}

function showLocked() {
  adminDashboard.classList.add("hidden");
  adminLock.classList.remove("hidden");
  selectedOrderNumber = null;
}

function unlockAdmin(user) {
  adminLock.classList.add("hidden");
  adminDashboard.classList.remove("hidden");

  if (user?.email) {
    setLoginMessage(`Signed in as ${user.email}.`, "success");
  }

  renderOrders();
  loadCatalogEditor();
  loadAdminStoreSettings();
  renderAdminReviews();
}

function showAdminPanel(target) {
  const panelExists = Array.from(adminPanels).some(panel => panel.dataset.adminPanel === target);
  if (!panelExists) return;

  adminPanels.forEach(panel => {
    panel.classList.toggle("active", panel.dataset.adminPanel === target);
  });

  adminNavItems.forEach(item => {
    const isActive = item.dataset.adminTarget === target;
    item.classList.toggle("active", isActive);
    if (isActive) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
}

adminNavItems.forEach(item => {
  item.addEventListener("click", () => showAdminPanel(item.dataset.adminTarget));
});

adminJumpButtons.forEach(item => {
  item.addEventListener("click", () => showAdminPanel(item.dataset.adminJump));
});

function fillAdminSettings() {
  const values = {
    announcementEnabled: storeSettings.announcementEnabled,
    announcementText: storeSettings.announcementText,
    settingHomeTag: storeSettings.homeTag,
    settingHomeTitle: storeSettings.homeTitle,
    settingHomeText: storeSettings.homeText,
    alertsEnabled: storeSettings.alertsEnabled,
    supportEmail: storeSettings.supportEmail,
    lowStockThreshold: storeSettings.lowStockThreshold,
    shippingMessage: storeSettings.shippingMessage,
    returnsMessage: storeSettings.returnsMessage,
    discountEnabled: storeSettings.discountEnabled,
    discountCode: storeSettings.discountCode,
    discountPercent: storeSettings.discountPercent
  };

  Object.entries(values).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (!input) return;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = value ?? "";
  });
}

async function loadAdminStoreSettings() {
  const result = await loadStoreSettings();
  storeSettings = result.settings;
  fillAdminSettings();
}

async function persistStoreSettings(nextSettings, statusId, successMessage) {
  const status = document.getElementById(statusId);
  storeSettings = { ...storeSettings, ...nextSettings };
  if (status) status.textContent = "Saving settings...";
  try {
    storeSettings = await saveStoreSettings(storeSettings);
    if (status) {
      status.textContent = successMessage;
      status.classList.add("success");
      status.classList.remove("error");
    }
    notify(successMessage, "success", "Settings published");
  } catch (error) {
    console.error("Store settings could not be published.", error);
    localStorage.setItem("randomFitsStoreSettings", JSON.stringify(storeSettings));
    if (status) {
      status.textContent = "Saved on this device, but Firebase publishing failed.";
      status.classList.add("error");
      status.classList.remove("success");
    }
    notify("Settings were saved locally but could not be published.", "error", "Publishing failed");
  }
  fillAdminSettings();
}

function getAllReviews() {
  try {
    const reviews = JSON.parse(localStorage.getItem("randomFitsReviews"));
    return Array.isArray(reviews) ? reviews : [];
  } catch {
    return [];
  }
}

function renderAdminReviews() {
  if (!adminReviewList) return;
  const reviews = getAllReviews();
  if (!reviews.length) {
    adminReviewList.innerHTML = `<div class="admin-empty-panel"><h2>No reviews yet</h2><p>Customer product reviews will appear here.</p></div>`;
    return;
  }

  adminReviewList.innerHTML = reviews.map(review => `
    <article class="admin-review-row">
      <div><span class="stars">${"★".repeat(Number(review.rating || 0))}${"☆".repeat(5 - Number(review.rating || 0))}</span><strong>${escapeHtml(review.productName || "Product")}</strong><small>${escapeHtml(review.name || "Customer")} · ${new Date(review.createdAt).toLocaleDateString()}</small><p>${escapeHtml(review.text)}</p></div>
      <div class="admin-review-actions"><button class="secondary-btn" type="button" data-review-action="toggle" data-review-id="${escapeHtml(review.id)}">${review.status === "hidden" ? "Publish" : "Hide"}</button><button class="danger-btn" type="button" data-review-action="delete" data-review-id="${escapeHtml(review.id)}">Delete</button></div>
    </article>
  `).join("");
}

if (contentSettingsForm) {
  contentSettingsForm.addEventListener("submit", event => {
    event.preventDefault();
    persistStoreSettings({
      announcementEnabled: document.getElementById("announcementEnabled").checked,
      announcementText: document.getElementById("announcementText").value.trim(),
      homeTag: document.getElementById("settingHomeTag").value.trim(),
      homeTitle: document.getElementById("settingHomeTitle").value.trim(),
      homeText: document.getElementById("settingHomeText").value.trim()
    }, "contentSettingsStatus", "Homepage content published.");
  });
}

if (storeSettingsForm) {
  storeSettingsForm.addEventListener("submit", event => {
    event.preventDefault();
    persistStoreSettings({
      alertsEnabled: document.getElementById("alertsEnabled").checked,
      supportEmail: document.getElementById("supportEmail").value.trim(),
      lowStockThreshold: Number(document.getElementById("lowStockThreshold").value),
      shippingMessage: document.getElementById("shippingMessage").value.trim(),
      returnsMessage: document.getElementById("returnsMessage").value.trim()
    }, "storeSettingsStatus", "Store settings published.");
  });
}

if (discountSettingsForm) {
  discountSettingsForm.addEventListener("submit", event => {
    event.preventDefault();
    persistStoreSettings({
      discountEnabled: document.getElementById("discountEnabled").checked,
      discountCode: document.getElementById("discountCode").value.trim(),
      discountPercent: Number(document.getElementById("discountPercent").value)
    }, "discountSettingsStatus", "Discount settings published.");
  });
}

if (adminReviewList) {
  adminReviewList.addEventListener("click", event => {
    const button = event.target.closest("[data-review-action]");
    if (!button) return;
    let reviews = getAllReviews();
    if (button.dataset.reviewAction === "delete") reviews = reviews.filter(review => review.id !== button.dataset.reviewId);
    else reviews = reviews.map(review => review.id === button.dataset.reviewId ? { ...review, status: review.status === "hidden" ? "published" : "hidden" } : review);
    localStorage.setItem("randomFitsReviews", JSON.stringify(reviews));
    renderAdminReviews();
    notify("Review moderation was updated.", "success", "Reviews updated");
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setCatalogStatus(message, type = "") {
  if (!catalogStatus) return;
  catalogStatus.textContent = message;
  catalogStatus.classList.remove("success", "error");
  if (type) catalogStatus.classList.add(type);
}

function createProductDraft() {
  const id = globalThis.crypto?.randomUUID?.() || `product-${Date.now()}`;

  return {
    id,
    name: "New Product",
    category: "shirts",
    color: "Black",
    price: 29.99,
    type: "shirt",
    imageUrl: "",
    imageUrls: [],
    description: "",
    colors: ["Black"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    stock: 25,
    stockStatus: "in-stock",
    garmentLight: "#4f4f4f",
    garmentDark: "#090909"
  };
}

function renderProductPreview(product) {
  if (product.imageUrl) {
    return `<div class="editor-product-preview product-photo"><img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}"></div>`;
  }

  return `<div class="editor-product-preview product-image-empty"><span>No image</span></div>`;
}

function renderCatalogEditor() {
  if (!productEditorList) return;

  if (catalogProducts.length === 0) {
    productEditorList.innerHTML = `<div class="empty-orders"><h3>No products</h3><p>Add a product to begin building the catalog.</p></div>`;
    return;
  }

  productEditorList.innerHTML = catalogProducts.map((product, index) => `
    <article class="product-editor-card" data-product-index="${index}">
      <div class="editor-preview-column">
        ${renderProductPreview(product)}
        <label class="image-upload-button">
          Upload Picture
          <input type="file" accept="image/*" data-image-upload hidden>
        </label>
        <small>Best size: 1200 × 1500 px (4:5), JPG or WebP, under 2 MB. Free mode compresses uploads into the catalog; public image URLs also work.</small>
      </div>

      <div class="product-editor-fields">
        <label class="editor-full">Product Name
          <input type="text" maxlength="100" data-product-field="name" value="${escapeHtml(product.name)}" required>
        </label>

        <div class="editor-field-grid">
          <label>Price
            <input type="number" min="0" step="0.01" data-product-field="price" value="${escapeHtml(product.price)}" required>
          </label>
          <label>Color Name
            <input type="text" maxlength="50" data-product-field="color" value="${escapeHtml(product.color)}">
          </label>
          <label>Category
            <select data-product-field="category">
              <option value="shirts" ${product.category === "shirts" ? "selected" : ""}>Shirts</option>
              <option value="hoodies" ${product.category === "hoodies" ? "selected" : ""}>Hoodies</option>
              <option value="pants" ${product.category === "pants" ? "selected" : ""}>Pants</option>
            </select>
          </label>
          <label>Product Shape
            <select data-product-field="type">
              <option value="shirt" ${product.type === "shirt" ? "selected" : ""}>Shirt</option>
              <option value="hoodie" ${product.type === "hoodie" ? "selected" : ""}>Hoodie</option>
              <option value="pants" ${product.type === "pants" ? "selected" : ""}>Pants</option>
            </select>
          </label>
        </div>

        <label class="editor-full">Image URL
          <input type="url" maxlength="2000" data-product-field="imageUrl" value="${escapeHtml(product.imageUrl)}" placeholder="https://example.com/product.jpg">
        </label>

        <label class="editor-full">Product Description
          <textarea rows="4" maxlength="3000" data-product-field="description" placeholder="Describe the fit, material, and details.">${escapeHtml(product.description || "")}</textarea>
        </label>

        <label class="editor-full">Extra Gallery Image URLs
          <textarea rows="3" data-product-list="imageUrls" placeholder="One image URL per line">${escapeHtml((product.imageUrls || []).join("\n"))}</textarea>
        </label>

        <div class="editor-field-grid">
          <label>Available Colors
            <input type="text" data-product-list="colors" value="${escapeHtml((product.colors || [product.color]).join(", "))}" placeholder="Black, Gray, White">
          </label>
          <label>Available Sizes
            <input type="text" data-product-list="sizes" value="${escapeHtml((product.sizes || ["S", "M", "L", "XL", "2XL"]).join(", "))}" placeholder="S, M, L, XL, 2XL">
          </label>
          <label>Inventory Quantity
            <input type="number" min="0" step="1" data-product-field="stock" value="${Number(product.stock ?? 25)}">
          </label>
          <label>Product Status
            <select data-product-field="stockStatus">
              <option value="in-stock" ${product.stockStatus !== "out-of-stock" && product.stockStatus !== "draft" ? "selected" : ""}>Active / In Stock</option>
              <option value="out-of-stock" ${product.stockStatus === "out-of-stock" ? "selected" : ""}>Out of Stock</option>
              <option value="draft" ${product.stockStatus === "draft" ? "selected" : ""}>Draft / Hidden</option>
            </select>
          </label>
        </div>

        <div class="editor-delete-row">
          <button class="remove-summary-item editor-delete" type="button" data-editor-action="delete">Delete Product</button>
        </div>
      </div>
    </article>
  `).join("");
}

async function loadCatalogEditor() {
  if (!productEditorList || catalogProducts.length) return;

  setCatalogStatus("Loading product catalog...");
  const result = await loadCatalog();
  catalogProducts = result.products.map(product => ({ ...product }));
  catalogRemoteReady = result.remoteReady;
  catalogDirty = false;
  renderCatalogEditor();
  renderAdminInsights(getOrders());

  if (catalogRemoteReady) {
    setCatalogStatus(
      result.source === "firebase"
        ? "Live Firebase catalog loaded."
        : "Default products loaded. Publish once to create the live catalog.",
      "success"
    );
  } else {
    setCatalogStatus("Local draft mode: enable Cloud Firestore before products can publish to every visitor.", "error");
  }
}

async function publishCatalog() {
  const invalid = catalogProducts.find(product => !String(product.name || "").trim() || Number(product.price) < 0);
  if (invalid) {
    setCatalogStatus("Every product needs a name and a valid price.", "error");
    return;
  }

  saveCatalogButton.disabled = true;
  setCatalogStatus("Publishing products...");
  catalogProducts = normalizeCatalog(catalogProducts);
  cacheCatalog(catalogProducts);

  try {
    catalogProducts = await saveCatalog(catalogProducts);
    catalogDirty = false;
    catalogRemoteReady = true;
    renderCatalogEditor();
    renderAdminInsights(getOrders());
    setCatalogStatus("Products published. Refresh the storefront to see the changes.", "success");
  } catch (error) {
    console.error("Product publishing failed.", error);
    const message = String(error?.message || "");
    setCatalogStatus(
      message.includes("free catalog image limit")
        ? message
        : "Saved as a local draft, but Firebase publishing failed. Check Firestore and try again.",
      "error"
    );
  } finally {
    saveCatalogButton.disabled = false;
  }
}

if (productEditorList) {
  productEditorList.addEventListener("input", event => {
    const field = event.target.dataset.productField;
    const listField = event.target.dataset.productList;
    const card = event.target.closest("[data-product-index]");
    if ((!field && !listField) || !card) return;

    const index = Number(card.dataset.productIndex);
    if (!catalogProducts[index]) return;

    if (listField) {
      catalogProducts[index][listField] = event.target.value
        .split(/[\n,]+/)
        .map(value => value.trim())
        .filter(Boolean);
    } else {
      catalogProducts[index][field] = ["price", "stock"].includes(field) ? Number(event.target.value) : event.target.value;
    }
    catalogDirty = true;
    setCatalogStatus("Unpublished changes.");
  });

  productEditorList.addEventListener("change", async event => {
    if (event.target.dataset.productField === "imageUrl") {
      renderCatalogEditor();
      return;
    }

    if (!event.target.matches("[data-image-upload]")) return;

    const card = event.target.closest("[data-product-index]");
    const index = Number(card?.dataset.productIndex);
    const product = catalogProducts[index];
    const file = event.target.files?.[0];
    if (!product || !file) return;

    setCatalogStatus(`Compressing ${file.name} for free upload...`);

    try {
      product.imageUrl = await uploadCatalogImage(product.id, file);
      catalogDirty = true;
      renderCatalogEditor();
      setCatalogStatus("Picture ready. Click Publish Products to make it live.", "success");
    } catch (error) {
      console.error("Image upload failed.", error);
      setCatalogStatus(error.message || "Picture processing failed. Try a smaller JPG or WebP image.", "error");
    }
  });

  productEditorList.addEventListener("click", event => {
    const button = event.target.closest("[data-editor-action='delete']");
    if (!button) return;

    const card = button.closest("[data-product-index]");
    const index = Number(card?.dataset.productIndex);
    if (!catalogProducts[index]) return;

    catalogProducts.splice(index, 1);
    catalogDirty = true;
    renderCatalogEditor();
    renderAdminInsights(getOrders());
    setCatalogStatus("Product removed from the draft. Publish to make it live.");
  });
}

if (addProductButton) {
  addProductButton.addEventListener("click", () => {
    catalogProducts.unshift(createProductDraft());
    catalogDirty = true;
    renderCatalogEditor();
    renderAdminInsights(getOrders());
    setCatalogStatus("New product added to the draft. Fill it out, then publish.");
  });
}

if (saveCatalogButton) saveCatalogButton.addEventListener("click", publishCatalog);

if (saveCatalogDraftButton) {
  saveCatalogDraftButton.addEventListener("click", () => {
    catalogProducts = cacheCatalog(catalogProducts);
    catalogDirty = false;
    renderCatalogEditor();
    renderAdminInsights(getOrders());
    setCatalogStatus("Draft saved on this device.", "success");
  });
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getOrders() {
  return JSON.parse(localStorage.getItem("randomFitsOrders")) || [];
}

function saveOrders(orders) {
  localStorage.setItem("randomFitsOrders", JSON.stringify(orders));
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

function renderStats(orders) {
  const totalOrders = orders.length;
  const newOrders = orders.filter(order => order.status === "New").length;
  const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  statTotalOrders.textContent = totalOrders;
  statNewOrders.textContent = newOrders;
  statSales.textContent = money(totalSales);
}

function getUniqueCustomers(orders) {
  const customers = new Map();

  orders.forEach(order => {
    const customer = order.customer || {};
    const name = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer";
    const email = String(customer.email || "").trim();
    const key = email.toLowerCase() || `${name.toLowerCase()}-${customer.phone || ""}`;
    const current = customers.get(key) || {
      name,
      email,
      phone: customer.phone || "",
      orders: 0,
      spent: 0
    };

    current.orders += 1;
    current.spent += Number(order.total || 0);
    customers.set(key, current);
  });

  return Array.from(customers.values()).sort((a, b) => b.spent - a.spent);
}

function renderAdminInsights(orders = getOrders()) {
  const sales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const customers = getUniqueCustomers(orders);
  const averageOrder = orders.length ? sales / orders.length : 0;

  if (homeOrderCount) homeOrderCount.textContent = orders.length;
  if (homeProductCount) homeProductCount.textContent = catalogProducts.length;
  if (homeSalesTotal) homeSalesTotal.textContent = money(sales);
  if (analyticsSales) analyticsSales.textContent = money(sales);
  if (analyticsOrders) analyticsOrders.textContent = orders.length;
  if (analyticsAverage) analyticsAverage.textContent = money(averageOrder);
  if (analyticsCustomers) analyticsCustomers.textContent = customers.length;

  if (!customersList) return;

  if (customers.length === 0) {
    customersList.innerHTML = `
      <div class="admin-empty-panel">
        <h2>No customers yet</h2>
        <p>Customer profiles will appear after the first order is placed.</p>
      </div>
    `;
    return;
  }

  customersList.innerHTML = `
    <div class="admin-data-head">
      <span>Customer</span><span>Orders</span><span>Total spent</span>
    </div>
    ${customers.map(customer => `
      <div class="admin-customer-row">
        <div>
          <strong>${escapeHtml(customer.name)}</strong>
          <small>${escapeHtml(customer.email || customer.phone || "No contact information")}</small>
        </div>
        <span>${customer.orders}</span>
        <strong>${money(customer.spent)}</strong>
      </div>
    `).join("")}
  `;
}

function renderOrders() {
  const orders = getOrders();
  renderStats(orders);
  renderAdminInsights(orders);

  if (orders.length === 0) {
    ordersList.innerHTML = `
      <div class="empty-orders">
        <h3>No orders yet</h3>
        <p>Place a test order from checkout and it will show here.</p>
      </div>
    `;
    return;
  }

  ordersList.innerHTML = orders.map(order => {
    const name = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() || "No name";
    const isActive = order.orderNumber === selectedOrderNumber ? "active" : "";

    return `
      <button class="order-row ${isActive}" data-order="${order.orderNumber}">
        <div>
          <strong>${order.orderNumber}</strong>
          <span>${name}</span>
          <small>${formatDate(order.createdAt)}</small>
        </div>

        <div>
          <em class="status-pill ${String(order.status || "New").toLowerCase().replace(/\s+/g, "-")}">${order.status || "New"}</em>
          <b>${money(order.total)}</b>
        </div>
      </button>
    `;
  }).join("");

  document.querySelectorAll(".order-row").forEach(button => {
    button.addEventListener("click", () => selectOrder(button.dataset.order));
  });
}

function selectOrder(orderNumber) {
  selectedOrderNumber = orderNumber;
  const order = getOrders().find(item => item.orderNumber === orderNumber);

  if (!order) {
    renderOrders();
    return;
  }

  renderOrders();
  renderOrderDetails(order);
}

function renderOrderDetails(order) {
  const customerName = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim();
  const address = order.shipping || {};
  const items = order.items || [];

  orderDetails.innerHTML = `
    <div class="details-head">
      <div>
        <p class="tag">Order Details</p>
        <h2>${order.orderNumber}</h2>
        <p>${formatDate(order.createdAt)}</p>
      </div>

      <select class="status-select" id="statusSelect">
        <option ${order.status === "New" ? "selected" : ""}>New</option>
        <option ${order.status === "Packing" ? "selected" : ""}>Packing</option>
        <option ${order.status === "Shipped" ? "selected" : ""}>Shipped</option>
        <option ${order.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
      </select>
    </div>

    <div class="detail-grid">
      <div class="detail-box">
        <h3>Customer</h3>
        <p><strong>${customerName || "No name"}</strong></p>
        <p>${order.customer?.email || "No email"}</p>
        <p>${order.customer?.phone || "No phone"}</p>
      </div>

      <div class="detail-box">
        <h3>Ship To</h3>
        <p><strong>${customerName || "No name"}</strong></p>
        <p>${address.address || ""}</p>
        <p>${address.city || ""}, ${address.state || ""} ${address.zip || ""}</p>
        ${address.notes ? `<p><em>Notes: ${address.notes}</em></p>` : ""}
      </div>
    </div>

    <div class="items-box">
      <h3>Items</h3>
      ${items.map(item => `
        <div class="admin-item-row">
          ${item.imageUrl
            ? `<div class="summary-thumb product-photo"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}"></div>`
            : `<div class="summary-thumb product-image-empty"><span>No image</span></div>`}
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <p>${escapeHtml(item.color)} / Size ${escapeHtml(item.size)} / Qty ${Number(item.quantity || 0)}</p>
          </div>
          <b>${money(item.price * item.quantity)}</b>
        </div>
      `).join("")}

      <div class="admin-total">
        <span>Total</span>
        <strong>${money(order.total)}</strong>
      </div>
    </div>

    <div class="detail-actions">
      <button class="primary-btn" id="printLabelButton">Print Shipping Label</button>
      <button class="secondary-btn" id="printPackingSlipButton">Print Packing Slip</button>
      <button class="secondary-btn" id="deleteOrderButton">Delete Order</button>
    </div>
  `;

  document.getElementById("statusSelect").addEventListener("change", event => {
    updateStatus(order.orderNumber, event.target.value);
  });

  document.getElementById("printLabelButton").addEventListener("click", () => printLabel(order.orderNumber));
  document.getElementById("printPackingSlipButton").addEventListener("click", () => printPackingSlip(order.orderNumber));
  document.getElementById("deleteOrderButton").addEventListener("click", () => deleteOrder(order.orderNumber));
}

function updateStatus(orderNumber, status) {
  const orders = getOrders().map(order => {
    if (order.orderNumber === orderNumber) {
      return { ...order, status };
    }

    return order;
  });

  saveOrders(orders);
  renderOrders();

  const updated = orders.find(order => order.orderNumber === orderNumber);
  if (updated) renderOrderDetails(updated);
}

function deleteOrder(orderNumber) {
  const confirmDelete = confirm(`Delete order ${orderNumber}?`);
  if (!confirmDelete) return;

  const orders = getOrders().filter(order => order.orderNumber !== orderNumber);
  saveOrders(orders);

  selectedOrderNumber = null;
  renderOrders();

  orderDetails.innerHTML = `
    <div class="order-details-empty">
      <h2>Select an order</h2>
      <p>Click an order to see customer info, items, shipping details, and label actions.</p>
    </div>
  `;
}

function clearOrders() {
  const confirmClear = confirm("Clear all orders? This cannot be undone.");
  if (!confirmClear) return;

  localStorage.removeItem("randomFitsOrders");
  selectedOrderNumber = null;
  renderOrders();

  orderDetails.innerHTML = `
    <div class="order-details-empty">
      <h2>Select an order</h2>
      <p>Click an order to see customer info, items, shipping details, and label actions.</p>
    </div>
  `;
}

function labelHtml(order) {
  const customerName = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim();
  const shipping = order.shipping || {};

  return `
    <section class="shipping-label">
      <div class="label-top">
        <div>
          <strong>RANDOM FITS</strong>
          <span>SHIP TO</span>
        </div>
        <b>${order.orderNumber}</b>
      </div>

      <div class="label-address">
        <h1>${customerName || "Customer"}</h1>
        <p>${shipping.address || ""}</p>
        <p>${shipping.city || ""}, ${shipping.state || ""} ${shipping.zip || ""}</p>
      </div>

      <div class="label-bottom">
        <div>
          <span>Order Date</span>
          <strong>${formatDate(order.createdAt)}</strong>
        </div>
        <div>
          <span>Items</span>
          <strong>${(order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</strong>
        </div>
      </div>

      <div class="fake-barcode">${order.orderNumber.replace(/[^A-Z0-9]/g, "")}</div>
    </section>
  `;
}

function packingSlipHtml(order) {
  const customerName = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim();
  const shipping = order.shipping || {};
  const items = order.items || [];

  return `
    <section class="packing-slip">
      <h1>Random Fits</h1>
      <h2>Packing Slip</h2>
      <p><strong>Order:</strong> ${order.orderNumber}</p>
      <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>

      <hr>

      <h3>Ship To</h3>
      <p>${customerName}</p>
      <p>${shipping.address || ""}</p>
      <p>${shipping.city || ""}, ${shipping.state || ""} ${shipping.zip || ""}</p>

      <hr>

      <h3>Items</h3>
      ${items.map(item => `
        <div class="slip-item">
          <span>${item.name}<br><small>${item.color} / Size ${item.size}</small></span>
          <strong>Qty ${item.quantity}</strong>
        </div>
      `).join("")}

      <hr>

      <h2>Total: ${money(order.total)}</h2>
    </section>
  `;
}

function openPrintWindow(content, title = "Print") {
  const printWindow = window.open("", "_blank", "width=900,height=700");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          background: #f5f5f5;
          font-family: Arial, sans-serif;
          color: #000;
        }

        .shipping-label {
          width: 4in;
          height: 6in;
          background: #fff;
          margin: 20px auto;
          border: 2px solid #000;
          padding: .22in;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          page-break-after: always;
        }

        .label-top,
        .label-bottom {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 2px solid #000;
          padding-bottom: 12px;
        }

        .label-bottom {
          border-top: 2px solid #000;
          border-bottom: 0;
          padding-top: 12px;
          padding-bottom: 0;
        }

        .label-top strong {
          display: block;
          font-size: 18px;
        }

        .label-top span,
        .label-bottom span {
          display: block;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .label-address h1 {
          font-size: 28px;
          margin: 0 0 16px;
          text-transform: uppercase;
        }

        .label-address p {
          font-size: 22px;
          margin: 8px 0;
          font-weight: bold;
        }

        .fake-barcode {
          border: 2px solid #000;
          padding: 12px;
          text-align: center;
          font-size: 20px;
          letter-spacing: 6px;
          font-weight: bold;
        }

        .packing-slip {
          width: 8.5in;
          min-height: 11in;
          background: #fff;
          margin: 20px auto;
          padding: .5in;
          box-sizing: border-box;
        }

        .packing-slip h1 {
          font-size: 34px;
          margin: 0;
          text-transform: uppercase;
        }

        .packing-slip h2 {
          margin: 12px 0;
        }

        .slip-item {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #ddd;
          padding: 12px 0;
        }

        @media print {
          body {
            background: #fff;
          }

          .shipping-label,
          .packing-slip {
            margin: 0;
            border-color: #000;
          }
        }
      </style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = () => {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
}

function printLabel(orderNumber) {
  const order = getOrders().find(item => item.orderNumber === orderNumber);
  if (!order) return;

  openPrintWindow(labelHtml(order), `Label ${order.orderNumber}`);
}

function printPackingSlip(orderNumber) {
  const order = getOrders().find(item => item.orderNumber === orderNumber);
  if (!order) return;

  openPrintWindow(packingSlipHtml(order), `Packing Slip ${order.orderNumber}`);
}

function printAllOrderLabels() {
  const orders = getOrders();

  if (orders.length === 0) {
    alert("No orders to print.");
    return;
  }

  const content = orders.map(labelHtml).join("");
  openPrintWindow(content, "All Shipping Labels");
}

function exportCsv() {
  const orders = getOrders();

  if (orders.length === 0) {
    alert("No orders to export.");
    return;
  }

  const rows = [
    ["Order Number", "Date", "Status", "Customer", "Email", "Phone", "Address", "City", "State", "ZIP", "Items", "Total"]
  ];

  orders.forEach(order => {
    const customerName = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim();
    const shipping = order.shipping || {};
    const items = (order.items || []).map(item => `${item.name} (${item.color}, Size ${item.size}, Qty ${item.quantity})`).join(" | ");

    rows.push([
      order.orderNumber,
      formatDate(order.createdAt),
      order.status,
      customerName,
      order.customer?.email || "",
      order.customer?.phone || "",
      shipping.address || "",
      shipping.city || "",
      shipping.state || "",
      shipping.zip || "",
      items,
      money(order.total)
    ]);
  });

  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "random-fits-orders.csv";
  link.click();

  URL.revokeObjectURL(url);
}

if (googleLoginButton) {
  googleLoginButton.addEventListener("click", signInWithGoogle);
}

lockAdmin.addEventListener("click", signOutAdmin);
refreshOrders.addEventListener("click", renderOrders);
exportOrders.addEventListener("click", exportCsv);
printAllLabels.addEventListener("click", printAllOrderLabels);
clearAllOrders.addEventListener("click", clearOrders);

initFirebaseLogin();

