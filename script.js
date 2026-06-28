let products = (globalThis.RANDOM_FITS_DEFAULT_PRODUCTS || []).length
  ? globalThis.RANDOM_FITS_DEFAULT_PRODUCTS.map(product => ({ ...product }))
  : [
  {
    id: 1,
    name: "Black Oversized Shirt",
    category: "shirts",
    color: "Black",
    price: 24.99,
    type: "shirt",
    garmentLight: "#404040",
    garmentDark: "#070707"
  },
  {
    id: 2,
    name: "Smoke Gray Heavy Tee",
    category: "shirts",
    color: "Gray",
    price: 26.99,
    type: "shirt",
    garmentLight: "#8a8a8a",
    garmentDark: "#222222"
  },
  {
    id: 3,
    name: "Core Black Hoodie",
    category: "hoodies",
    color: "Black",
    price: 49.99,
    type: "hoodie",
    garmentLight: "#4f4f4f",
    garmentDark: "#090909"
  },
  {
    id: 4,
    name: "Dark Gray Oversized Hoodie",
    category: "hoodies",
    color: "Dark Gray",
    price: 54.99,
    type: "hoodie",
    garmentLight: "#777777",
    garmentDark: "#1b1b1b"
  },
  {
    id: 5,
    name: "Black Cargo Pants",
    category: "pants",
    color: "Black",
    price: 44.99,
    type: "pants",
    garmentLight: "#363636",
    garmentDark: "#080808"
  },
  {
    id: 6,
    name: "Gray Relaxed Pants",
    category: "pants",
    color: "Gray",
    price: 42.99,
    type: "pants",
    garmentLight: "#707070",
    garmentDark: "#222222"
  },
  {
    id: 7,
    name: "Polar Zip Hoodie",
    category: "hoodies",
    color: "Dark Gray",
    price: 59.99,
    type: "hoodie",
    garmentLight: "#676767",
    garmentDark: "#111111"
  },
  {
    id: 8,
    name: "Night Wide Pants",
    category: "pants",
    color: "Dark Gray",
    price: 46.99,
    type: "pants",
    garmentLight: "#595959",
    garmentDark: "#111111"
  }
];

let cart = JSON.parse(localStorage.getItem("randomFitsCart")) || [];
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

function renderProducts() {
  const filtered = activeFilter === "all"
    ? products
    : products.filter(product => product.category === activeFilter);

  productGrid.innerHTML = filtered.map(product => {
    const image = product.imageUrl
      ? `<div class="product-visual product-photo"><img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy"></div>`
      : `<div class="product-visual ${escapeHtml(product.type)}" style="--garment-light:${escapeHtml(product.garmentLight)}; --garment-dark:${escapeHtml(product.garmentDark)};"></div>`;

    return `
    <article class="product-card" data-category="${escapeHtml(product.category)}">
      ${image}

      <div class="product-info">
        <div class="product-row">
          <h3>${escapeHtml(product.name)}</h3>
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

          <button class="add-btn" data-add-product="${escapeHtml(product.id)}">Add to Bag</button>
        </div>
      </div>
    </article>
  `;
  }).join("");
}

function addHeroItem() {
  const size = document.getElementById("heroSize").value;
  addItemToCart({
    id: 100,
    name: "Core Black Hoodie",
    category: "hoodies",
    color: "Black",
    price: 49.99,
    type: "hoodie",
    garmentLight: "#4f4f4f",
    garmentDark: "#090909"
  }, size);
}

function addToCart(productId) {
  const product = products.find(item => String(item.id) === String(productId));
  if (!product) return;
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
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="note">Your bag is empty.</p>`;
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div>
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
  const button = event.target.closest("[data-add-product]");
  if (button) addToCart(button.dataset.addProduct);
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
});

renderProducts();
renderCart();

globalThis.setCatalogProducts = nextProducts => {
  if (!Array.isArray(nextProducts) || nextProducts.length === 0) return;
  products = nextProducts.map(product => ({ ...product }));
  renderProducts();
};

