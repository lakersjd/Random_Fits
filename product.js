import { getCachedStoreSettings, loadCatalog } from "./catalog.js";

const productLoading = document.getElementById("productLoading");
const productDetail = document.getElementById("productDetail");
const productInformation = document.getElementById("productInformation");
const reviewsSection = document.getElementById("reviewsSection");
const relatedSection = document.getElementById("relatedSection");
const productThumbnails = document.getElementById("productThumbnails");
const productGallery = document.getElementById("productGallery");
const productMainImage = document.getElementById("productMainImage");
const productCategory = document.getElementById("productCategory");
const productName = document.getElementById("productName");
const breadcrumbName = document.getElementById("breadcrumbName");
const productPrice = document.getElementById("productPrice");
const productStockMessage = document.getElementById("productStockMessage");
const productShortDescription = document.getElementById("productShortDescription");
const productDescription = document.getElementById("productDescription");
const selectedColorName = document.getElementById("selectedColorName");
const colorOptions = document.getElementById("colorOptions");
const sizeOptions = document.getElementById("sizeOptions");
const productQuantity = document.getElementById("productQuantity");
const decreaseQuantity = document.getElementById("decreaseQuantity");
const increaseQuantity = document.getElementById("increaseQuantity");
const productAddToCart = document.getElementById("productAddToCart");
const productBuyNow = document.getElementById("productBuyNow");
const productWishlist = document.getElementById("productWishlist");
const productActionMessage = document.getElementById("productActionMessage");
const productStars = document.getElementById("productStars");
const jumpToReviews = document.getElementById("jumpToReviews");
const reviewAverage = document.getElementById("reviewAverage");
const reviewSummaryStars = document.getElementById("reviewSummaryStars");
const reviewCount = document.getElementById("reviewCount");
const reviewsList = document.getElementById("reviewsList");
const reviewForm = document.getElementById("reviewForm");
const reviewerName = document.getElementById("reviewerName");
const reviewText = document.getElementById("reviewText");
const reviewFormMessage = document.getElementById("reviewFormMessage");
const relatedProducts = document.getElementById("relatedProducts");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const openCartButton = document.getElementById("openCart");
const closeCartButton = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const clearCartButton = document.getElementById("clearCart");
const productShippingMessage = document.getElementById("productShippingMessage");
const productReturnsMessage = document.getElementById("productReturnsMessage");
const shippingReturnsDescription = document.getElementById("shippingReturnsDescription");

let catalogProducts = [];
let currentProduct = null;
let selectedSize = "M";
let selectedColor = "Black";
let cart = readJson("randomFitsCart", []);
let wishlist = readJson("randomFitsWishlist", []);
let storeSettings = getCachedStoreSettings();

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function notify(message, type = "info", title = "") {
  globalThis.RandomFitsUI?.notify(message, { type, title });
}

function stars(rating) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
}

function formatCategory(category) {
  const value = String(category || "New arrival");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getDescription(product) {
  if (product.description) return product.description;
  const kind = product.category === "hoodies" ? "hoodie" : product.category === "pants" ? "pants" : "shirt";
  return `${product.name} is a clean, easy-to-style ${kind} designed for everyday wear. Built with a modern fit and a versatile ${String(product.color || "neutral").toLowerCase()} finish.`;
}

function getGalleryImages(product) {
  return [product.imageUrl, ...(Array.isArray(product.imageUrls) ? product.imageUrls : [])]
    .map(value => String(value || "").trim())
    .filter((value, index, list) => value && list.indexOf(value) === index);
}

function renderMainImage(imageUrl, name) {
  productMainImage.innerHTML = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}">`
    : `<div class="product-image-empty"><span>No image</span></div>`;
}

function renderGallery(product) {
  const images = getGalleryImages(product);
  renderMainImage(images[0] || "", product.name);

  if (images.length <= 1) {
    productThumbnails.innerHTML = "";
    productThumbnails.classList.add("hidden");
    productGallery.classList.add("single-image");
    return;
  }

  productGallery.classList.remove("single-image");
  productThumbnails.classList.remove("hidden");
  productThumbnails.innerHTML = images.map((image, index) => `
    <button class="product-thumbnail ${index === 0 ? "active" : ""}" type="button" data-gallery-image="${escapeHtml(image)}" aria-label="View image ${index + 1}">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)} view ${index + 1}">
    </button>
  `).join("");
}

function getProductColors(product) {
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const values = [product.color, ...colors].map(value => String(value || "").trim()).filter(Boolean);
  return values.filter((value, index) => values.findIndex(item => item.toLowerCase() === value.toLowerCase()) === index);
}

function getProductSizes(product) {
  const sizes = Array.isArray(product.sizes) && product.sizes.length
    ? product.sizes
    : ["S", "M", "L", "XL", "2XL"];
  return sizes.map(value => String(value).trim()).filter(Boolean);
}

function sizeLabel(size) {
  return ({ S: "Small", M: "Medium", L: "Large", XL: "XL", "2XL": "XXL", XXL: "XXL" })[size] || size;
}

function colorToCss(color) {
  const value = String(color || "").trim().toLowerCase();
  const namedColors = {
    black: "#111111",
    white: "#f5f5f5",
    gray: "#777777",
    grey: "#777777",
    "dark gray": "#333333",
    "dark grey": "#333333",
    red: "#c83d3d",
    blue: "#315fa8",
    green: "#3f7650",
    brown: "#6f4d38",
    cream: "#e8dfc8"
  };
  if (namedColors[value]) return namedColors[value];
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
  return "#555555";
}

function renderOptions(product) {
  const colors = getProductColors(product);
  const sizes = getProductSizes(product);
  selectedColor = colors[0] || "Black";
  selectedSize = sizes.includes("M") ? "M" : sizes[0];
  selectedColorName.textContent = selectedColor;

  colorOptions.innerHTML = colors.map((color, index) => `
    <button class="color-option ${index === 0 ? "active" : ""}" type="button" data-product-color="${escapeHtml(color)}" aria-pressed="${index === 0}">
      <span class="color-swatch" style="--swatch:${colorToCss(color)}"></span>${escapeHtml(color)}
    </button>
  `).join("");

  sizeOptions.innerHTML = sizes.map(size => `
    <button class="size-option ${size === selectedSize ? "active" : ""}" type="button" data-product-size="${escapeHtml(size)}" aria-pressed="${size === selectedSize}">${escapeHtml(sizeLabel(size))}</button>
  `).join("");
}

function getReviews() {
  const allReviews = readJson("randomFitsReviews", []);
  const central = Array.isArray(allReviews)
    ? allReviews.filter(review => String(review.productId) === String(currentProduct?.id) && review.status !== "hidden")
    : [];
  const legacy = readJson(`randomFitsReviews:${currentProduct?.id || "unknown"}`, []);
  return [...central, ...(Array.isArray(legacy) ? legacy : [])]
    .filter((review, index, list) => list.findIndex(item => item.id === review.id) === index)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function renderReviews() {
  const reviews = getReviews();
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;
  const countLabel = reviews.length === 1 ? "1 review" : `${reviews.length} reviews`;

  productStars.textContent = stars(average);
  productStars.setAttribute("aria-label", reviews.length ? `${average.toFixed(1)} out of 5 stars` : "No ratings yet");
  jumpToReviews.textContent = reviews.length ? countLabel : "No reviews yet";
  reviewAverage.textContent = reviews.length ? average.toFixed(1) : "—";
  reviewSummaryStars.textContent = stars(average);
  reviewCount.textContent = reviews.length ? countLabel : "No reviews yet";

  if (reviews.length === 0) {
    reviewsList.innerHTML = `<div class="reviews-empty"><h3>Be the first to review this product</h3><p>Share your experience with the fit, quality, and feel.</p></div>`;
    return;
  }

  reviewsList.innerHTML = reviews.map(review => `
    <article class="review-card">
      <div class="review-card-head">
        <div><strong>${escapeHtml(review.name || "Customer")}</strong><span class="stars" aria-label="${Number(review.rating)} out of 5 stars">${stars(review.rating)}</span></div>
        <time datetime="${escapeHtml(review.createdAt)}">${new Date(review.createdAt).toLocaleDateString()}</time>
      </div>
      <p>${escapeHtml(review.text)}</p>
    </article>
  `).join("");
}

function relatedCard(product) {
  const image = product.imageUrl
    ? `<div class="product-visual product-photo"><img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy"></div>`
    : `<div class="product-visual product-image-empty"><span>No image</span></div>`;

  return `
    <a class="product-card related-product-card" href="product.html?id=${encodeURIComponent(product.id)}">
      ${image}
      <div class="product-info"><div class="product-row"><h3>${escapeHtml(product.name)}</h3><strong>${money(product.price)}</strong></div><p>${escapeHtml(product.color)} / ${escapeHtml(product.category)}</p></div>
    </a>
  `;
}

function renderRelatedProducts() {
  const related = catalogProducts
    .filter(product => String(product.id) !== String(currentProduct.id) && product.stockStatus !== "draft")
    .sort((a, b) => Number(b.category === currentProduct.category) - Number(a.category === currentProduct.category))
    .slice(0, 4);

  if (related.length === 0) {
    relatedSection.classList.add("hidden");
    return;
  }

  relatedProducts.innerHTML = related.map(relatedCard).join("");
  relatedSection.classList.remove("hidden");
}

function renderProduct(product) {
  currentProduct = product;
  const description = getDescription(product);
  document.title = `${product.name} | Random Fits`;
  breadcrumbName.textContent = product.name;
  productCategory.textContent = formatCategory(product.category);
  productName.textContent = product.name;
  productPrice.textContent = money(product.price);
  productShortDescription.textContent = description;
  productDescription.textContent = description;
  renderGallery(product);
  renderOptions(product);
  renderInventory(product);
  renderWishlistButton();
  renderReviews();
  renderRelatedProducts();
  productLoading.classList.add("hidden");
  productDetail.classList.remove("hidden");
  productInformation.classList.remove("hidden");
  reviewsSection.classList.remove("hidden");
}

function renderInventory(product) {
  const soldOut = product.stockStatus === "out-of-stock" || Number(product.stock) === 0;
  const lowStock = !soldOut && Number(product.stock) <= Number(storeSettings.lowStockThreshold || 5);
  productAddToCart.disabled = soldOut;
  productBuyNow.disabled = soldOut;
  productAddToCart.textContent = soldOut ? "Out of Stock" : "Add to Cart";
  productBuyNow.textContent = soldOut ? "Unavailable" : "Buy Now";
  productStockMessage.className = `product-stock-message ${soldOut ? "out" : lowStock ? "low" : "in"}`;
  productStockMessage.textContent = soldOut ? "Out of stock" : lowStock ? `Only ${Number(product.stock)} left in stock` : "In stock and ready to ship";

  if (storeSettings.alertsEnabled && (soldOut || lowStock)) {
    notify(productStockMessage.textContent, "warning", soldOut ? "Out of stock" : "Low stock");
  }
}

function renderWishlistButton() {
  const wished = wishlist.map(String).includes(String(currentProduct?.id));
  productWishlist.classList.toggle("active", wished);
  productWishlist.textContent = wished ? "Saved to Wishlist" : "Add to Wishlist";
}

function toggleCurrentWishlist() {
  const id = String(currentProduct.id);
  const wished = wishlist.map(String).includes(id);
  wishlist = wished ? wishlist.filter(item => String(item) !== id) : [...wishlist, id];
  localStorage.setItem("randomFitsWishlist", JSON.stringify(wishlist));
  renderWishlistButton();
  notify(wished ? "Removed from your wishlist." : "Saved to your wishlist.", "success", "Wishlist updated");
}

function showNotFound() {
  productLoading.innerHTML = `<div class="product-not-found"><h1>Product not found</h1><p>This item may have been removed or is no longer available.</p><a class="primary-btn" href="index.html#shop">Back to Shop</a></div>`;
}

function saveCart() {
  localStorage.setItem("randomFitsCart", JSON.stringify(cart));
}

function addCurrentProductToCart(openDrawer = true) {
  if (!currentProduct) return;
  if (currentProduct.stockStatus === "out-of-stock" || Number(currentProduct.stock) === 0) {
    notify("This product is currently out of stock.", "warning", "Unavailable");
    return;
  }
  const quantity = Math.max(1, Math.min(10, Number(productQuantity.value) || 1));
  productQuantity.value = quantity;
  const existing = cart.find(item => String(item.id) === String(currentProduct.id) && item.size === selectedSize && item.color === selectedColor);

  if (existing) existing.quantity += quantity;
  else cart.push({ ...currentProduct, color: selectedColor, size: selectedSize, quantity });

  saveCart();
  renderCart();
  productActionMessage.textContent = `${quantity} item${quantity === 1 ? "" : "s"} added to your bag.`;
  if (openDrawer) openCart();
  notify(`${currentProduct.name} was added to your bag.`, "success", "Added to cart");
}

function updateCartItem(productId, size, color, change) {
  const item = cart.find(product => String(product.id) === String(productId) && product.size === size && product.color === color);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) {
    cart = cart.filter(product => !(String(product.id) === String(productId) && product.size === size && product.color === color));
  }
  saveCart();
  renderCart();
}

function removeCartItem(productId, size, color) {
  cart = cart.filter(product => !(String(product.id) === String(productId) && product.size === size && product.color === color));
  saveCart();
  renderCart();
  notify("The product was removed from your bag.", "info", "Cart updated");
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="note">Your bag is empty.</p>`;
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        ${item.imageUrl ? `<img class="cart-item-thumb" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}">` : `<div class="cart-item-thumb product-image-empty"><span>No image</span></div>`}
        <div class="cart-item-copy"><h4>${escapeHtml(item.name)}</h4><p>${escapeHtml(item.color)} / Size ${escapeHtml(item.size)} / ${money(item.price)}</p><button class="remove-item" data-cart-action="remove" data-id="${escapeHtml(item.id)}" data-size="${escapeHtml(item.size)}" data-color="${escapeHtml(item.color)}">Remove</button></div>
        <div class="qty"><button data-cart-action="quantity" data-change="-1" data-id="${escapeHtml(item.id)}" data-size="${escapeHtml(item.size)}" data-color="${escapeHtml(item.color)}">−</button><strong>${Number(item.quantity || 0)}</strong><button data-cart-action="quantity" data-change="1" data-id="${escapeHtml(item.id)}" data-size="${escapeHtml(item.size)}" data-color="${escapeHtml(item.color)}">+</button></div>
      </div>
    `).join("");
  }

  cartCount.textContent = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  cartTotal.textContent = money(cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0));
}

function openCart() {
  cartDrawer.classList.add("open");
  overlay.classList.add("show");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  overlay.classList.remove("show");
}

productThumbnails.addEventListener("click", event => {
  const button = event.target.closest("[data-gallery-image]");
  if (!button) return;
  productThumbnails.querySelectorAll(".product-thumbnail").forEach(item => item.classList.toggle("active", item === button));
  renderMainImage(button.dataset.galleryImage, currentProduct.name);
});

colorOptions.addEventListener("click", event => {
  const button = event.target.closest("[data-product-color]");
  if (!button) return;
  selectedColor = button.dataset.productColor;
  selectedColorName.textContent = selectedColor;
  colorOptions.querySelectorAll(".color-option").forEach(item => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
});

sizeOptions.addEventListener("click", event => {
  const button = event.target.closest("[data-product-size]");
  if (!button) return;
  selectedSize = button.dataset.productSize;
  sizeOptions.querySelectorAll(".size-option").forEach(item => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
});

decreaseQuantity.addEventListener("click", () => {
  productQuantity.value = Math.max(1, Number(productQuantity.value || 1) - 1);
});

increaseQuantity.addEventListener("click", () => {
  productQuantity.value = Math.min(10, Number(productQuantity.value || 1) + 1);
});

productQuantity.addEventListener("change", () => {
  productQuantity.value = Math.max(1, Math.min(10, Number(productQuantity.value) || 1));
});

productAddToCart.addEventListener("click", () => addCurrentProductToCart(true));
productBuyNow.addEventListener("click", () => {
  addCurrentProductToCart(false);
  window.location.href = "checkout.html";
});
productWishlist.addEventListener("click", toggleCurrentWishlist);

jumpToReviews.addEventListener("click", () => reviewsSection.scrollIntoView({ behavior: "smooth" }));

reviewForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!currentProduct) return;
  const rating = Number(new FormData(reviewForm).get("rating"));
  const name = reviewerName.value.trim();
  const text = reviewText.value.trim();
  if (!rating || !name || !text) return;

  const reviews = readJson("randomFitsReviews", []);
  reviews.unshift({ id: globalThis.crypto?.randomUUID?.() || `review-${Date.now()}`, productId: currentProduct.id, productName: currentProduct.name, name, rating, text, status: "published", createdAt: new Date().toISOString() });
  localStorage.setItem("randomFitsReviews", JSON.stringify(reviews.slice(0, 500)));
  reviewForm.reset();
  reviewFormMessage.textContent = "Thanks! Your review was added.";
  renderReviews();
  notify("Your review is now visible.", "success", "Review submitted");
});

cartItems.addEventListener("click", event => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;
  const { id, size, color, cartAction } = button.dataset;
  if (cartAction === "remove") removeCartItem(id, size, color);
  if (cartAction === "quantity") updateCartItem(id, size, color, Number(button.dataset.change));
});

openCartButton.addEventListener("click", openCart);
closeCartButton.addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
clearCartButton.addEventListener("click", () => {
  cart = [];
  saveCart();
  renderCart();
  notify("Your bag is now empty.", "info", "Cart cleared");
});

async function initializeProductPage() {
  renderCart();
  const productId = new URLSearchParams(window.location.search).get("id");
  if (!productId) {
    showNotFound();
    return;
  }

  const result = await loadCatalog();
  catalogProducts = result.products;
  storeSettings = result.settings || getCachedStoreSettings();
  productShippingMessage.textContent = storeSettings.shippingMessage;
  productReturnsMessage.textContent = storeSettings.returnsMessage;
  shippingReturnsDescription.textContent = `${storeSettings.shippingMessage} ${storeSettings.returnsMessage}`;
  const product = catalogProducts.find(item => String(item.id) === String(productId));
  if (!product || product.stockStatus === "draft") {
    showNotFound();
    return;
  }

  const savedCustomer = readJson("randomFitsCustomer", null);
  if (savedCustomer?.name) reviewerName.value = savedCustomer.name;
  renderProduct(product);
}

initializeProductPage();
