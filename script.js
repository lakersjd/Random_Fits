let products = (globalThis.RANDOM_FITS_DEFAULT_PRODUCTS || []).map(product => ({ ...product }));

let cart = JSON.parse(localStorage.getItem("randomFitsCart")) || [];
let wishlist = JSON.parse(localStorage.getItem("randomFitsWishlist")) || [];
let activeFilter = "all";

const productGrid = document.getElementById("productGrid");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const openCartBtn = document.getElementById("openCart");
const closeCartBtn = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const clearCart = document.getElementById("clearCart");
const filterButtons = document.querySelectorAll(".filter");

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function saveCart() {
  localStorage.setItem("randomFitsCart", JSON.stringify(cart));
}

function notify(message, type = "info", title = "") {
  globalThis.RandomFitsUI?.notify(message, { type, title });
}

function saveWishlist() {
  localStorage.setItem("randomFitsWishlist", JSON.stringify(wishlist));
}

function toggleWishlist(productId) {
  const id = String(productId);
  const existing = wishlist.map(String).includes(id);
  wishlist = existing ? wishlist.filter(item => String(item) !== id) : [...wishlist, id];
  saveWishlist();
  renderProducts();
  notify(existing ? "Removed from your wishlist." : "Saved to your wishlist.", "success", "Wishlist updated");
}

function renderProducts() {
  const activeProducts = products.filter(product => product.stockStatus !== "draft");
  const filtered = activeFilter === "all"
    ? activeProducts
    : activeProducts.filter(product => product.category === activeFilter);

  if (filtered.length === 0) {
    productGrid.innerHTML = `<div class="empty-store"><h3>No products yet</h3><p>New products will appear here after they are published from the admin page.</p></div>`;
    return;
  }

  productGrid.innerHTML = filtered.map(product => {
    const productUrl = `product.html?id=${encodeURIComponent(product.id)}`;
    const image = product.imageUrl
      ? `<div class="product-visual product-photo"><img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy"></div>`
      : `<div class="product-visual product-image-empty"><span>No image</span></div>`;

    const soldOut = product.stockStatus === "out-of-stock" || Number(product.stock) === 0;
    const wished = wishlist.map(String).includes(String(product.id));
    return `
    <article class="product-card" data-category="${escapeHtml(product.category)}" data-product-url="${escapeHtml(productUrl)}">
      <button class="wishlist-button ${wished ? "active" : ""}" type="button" data-wishlist-product="${escapeHtml(product.id)}" aria-label="${wished ? "Remove from" : "Add to"} wishlist">${wished ? "Saved" : "Save"}</button>
      ${soldOut ? `<span class="product-stock-badge">Sold out</span>` : ""}
      <a class="product-card-image-link" href="${escapeHtml(productUrl)}" aria-label="View ${escapeHtml(product.name)}">
        ${image}
      </a>

      <div class="product-info">
        <div class="product-row">
          <h3><a href="${escapeHtml(productUrl)}">${escapeHtml(product.name)}</a></h3>
          <strong>${money(product.price)}</strong>
        </div>

        <p>${escapeHtml(product.color)} / ${escapeHtml(product.category)}</p>

        <div class="product-controls">
          <label>
            Size
            <select id="size-${escapeHtml(product.id)}">
              <option>S</option>
              <option selected>M</option>
              <option>L</option>
              <option>XL</option>
              <option>2XL</option>
            </select>
          </label>

          <button class="add-btn" data-add-product="${escapeHtml(product.id)}" ${soldOut ? "disabled" : ""}>${soldOut ? "Sold Out" : "Add to Bag"}</button>
        </div>
      </div>
    </article>
  `;
  }).join("");
}

function addToCart(productId) {
  const product = products.find(item => String(item.id) === String(productId));
  if (!product) return;
  if (product.stockStatus === "out-of-stock" || Number(product.stock) === 0) {
    notify("This product is currently out of stock.", "warning", "Unavailable");
    return;
  }
  const size = document.getElementById(`size-${productId}`).value;
  addItemToCart(product, size);
}

function addItemToCart(product, size) {
  const existing = cart.find(item => item.id === product.id && item.size === size && item.color === product.color);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, size, quantity: 1 });
  }

  saveCart();
  renderCart();
  openCart();
  notify(`${product.name} was added to your bag.`, "success", "Added to cart");
}

function updateQuantity(productId, size, color, change) {
  const item = cart.find(product => String(product.id) === String(productId) && product.size === size && product.color === color);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(product => !(String(product.id) === String(productId) && product.size === size && product.color === color));
  }

  saveCart();
  renderCart();
}


function removeItem(productId, size, color) {
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
        <div class="cart-item-copy">
          <h4>${escapeHtml(item.name)}</h4>
          <p>${escapeHtml(item.color)} / Size ${escapeHtml(item.size)} / ${money(item.price)}</p>
          <button class="remove-item" data-cart-action="remove" data-id="${escapeHtml(item.id)}" data-size="${escapeHtml(item.size)}" data-color="${escapeHtml(item.color)}">Remove</button>
        </div>

        <div class="qty">
          <button data-cart-action="quantity" data-change="-1" data-id="${escapeHtml(item.id)}" data-size="${escapeHtml(item.size)}" data-color="${escapeHtml(item.color)}">−</button>
          <strong>${item.quantity}</strong>
          <button data-cart-action="quantity" data-change="1" data-id="${escapeHtml(item.id)}" data-size="${escapeHtml(item.size)}" data-color="${escapeHtml(item.color)}">+</button>
        </div>
      </div>
    `).join("");
  }

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartCount.textContent = count;
  cartTotal.textContent = money(total);
}

function openCart() {
  cartDrawer.classList.add("open");
  overlay.classList.add("show");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  overlay.classList.remove("show");
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderProducts();
  });
});

productGrid.addEventListener("click", event => {
  const wishlistButton = event.target.closest("[data-wishlist-product]");
  if (wishlistButton) {
    toggleWishlist(wishlistButton.dataset.wishlistProduct);
    return;
  }
  const button = event.target.closest("[data-add-product]");
  if (button) {
    addToCart(button.dataset.addProduct);
    return;
  }

  if (event.target.closest("a, button, select, label")) return;
  const card = event.target.closest("[data-product-url]");
  if (card) window.location.href = card.dataset.productUrl;
});

cartItems.addEventListener("click", event => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;

  const { id, size, color, cartAction } = button.dataset;

  if (cartAction === "remove") {
    removeItem(id, size, color);
  } else if (cartAction === "quantity") {
    updateQuantity(id, size, color, Number(button.dataset.change));
  }
});

openCartBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

clearCart.addEventListener("click", () => {
  cart = [];
  saveCart();
  renderCart();
  notify("Your bag is now empty.", "info", "Cart cleared");
});

renderProducts();
renderCart();

globalThis.setCatalogProducts = nextProducts => {
  if (!Array.isArray(nextProducts)) return;
  products = nextProducts.map(product => ({ ...product }));
  renderProducts();
};

