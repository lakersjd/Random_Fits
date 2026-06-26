const products = [
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
  return `$${value.toFixed(2)}`;
}

function saveCart() {
  localStorage.setItem("randomFitsCart", JSON.stringify(cart));
}

function renderProducts() {
  const filtered = activeFilter === "all"
    ? products
    : products.filter(product => product.category === activeFilter);

  productGrid.innerHTML = filtered.map(product => `
    <article class="product-card" id="${product.category}">
      <div
        class="product-visual ${product.type}"
        style="--garment-light:${product.garmentLight}; --garment-dark:${product.garmentDark};"
      ></div>

      <div class="product-info">
        <div class="product-row">
          <h3>${product.name}</h3>
          <strong>${money(product.price)}</strong>
        </div>

        <p>${product.color} / ${product.category}</p>

        <div class="product-controls">
          <label>
            Size
            <select id="size-${product.id}">
              <option>S</option>
              <option selected>M</option>
              <option>L</option>
              <option>XL</option>
              <option>2XL</option>
            </select>
          </label>

          <button class="add-btn" onclick="addToCart(${product.id})">Add to Bag</button>
        </div>
      </div>
    </article>
  `).join("");
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
  const product = products.find(item => item.id === productId);
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
  const item = cart.find(product => product.id === productId && product.size === size && product.color === color);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(product => !(product.id === productId && product.size === size && product.color === color));
  }

  saveCart();
  renderCart();
}


function removeItem(productId, size, color) {
  cart = cart.filter(product => !(product.id === productId && product.size === size && product.color === color));
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
          <h4>${item.name}</h4>
          <p>${item.color} / Size ${item.size} / ${money(item.price)}</p>
          <button class="remove-item" onclick="removeItem(${item.id}, '${item.size}', '${item.color}')">Remove</button>
        </div>

        <div class="qty">
          <button onclick="updateQuantity(${item.id}, '${item.size}', '${item.color}', -1)">−</button>
          <strong>${item.quantity}</strong>
          <button onclick="updateQuantity(${item.id}, '${item.size}', '${item.color}', 1)">+</button>
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

