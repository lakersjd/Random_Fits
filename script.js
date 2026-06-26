const products = [
  {
    id: 1,
    name: "Glacier Black Oversized Shirt",
    category: "shirts",
    color: "Black",
    price: 24.99,
    type: "shirt",
    toneLight: "#777",
    toneDark: "#151515",
    garmentLight: "#3b3b3b",
    garmentDark: "#070707"
  },
  {
    id: 2,
    name: "Smoke Gray Heavy Tee",
    category: "shirts",
    color: "Gray",
    price: 26.99,
    type: "shirt",
    toneLight: "#898989",
    toneDark: "#242424",
    garmentLight: "#727272",
    garmentDark: "#1a1a1a"
  },
  {
    id: 3,
    name: "Core Black Heavy Puffer Hoodie",
    category: "hoodies",
    color: "Black",
    price: 49.99,
    type: "hoodie",
    toneLight: "#707070",
    toneDark: "#101010",
    garmentLight: "#4e4e4e",
    garmentDark: "#090909"
  },
  {
    id: 4,
    name: "Orbit Gray Oversized Hoodie",
    category: "hoodies",
    color: "Dark Gray",
    price: 54.99,
    type: "hoodie",
    toneLight: "#9a9a9a",
    toneDark: "#202020",
    garmentLight: "#8a8a8a",
    garmentDark: "#202020"
  },
  {
    id: 5,
    name: "Stealth Black Cargo Pants",
    category: "pants",
    color: "Black",
    price: 44.99,
    type: "pants",
    toneLight: "#5f5f5f",
    toneDark: "#080808",
    garmentLight: "#343434",
    garmentDark: "#090909"
  },
  {
    id: 6,
    name: "Concrete Gray Relaxed Pants",
    category: "pants",
    color: "Gray",
    price: 42.99,
    type: "pants",
    toneLight: "#858585",
    toneDark: "#1f1f1f",
    garmentLight: "#6f6f6f",
    garmentDark: "#242424"
  },
  {
    id: 7,
    name: "Polar Dark Zip Hoodie",
    category: "hoodies",
    color: "Dark Gray",
    price: 59.99,
    type: "hoodie",
    toneLight: "#6a6a6a",
    toneDark: "#111",
    garmentLight: "#565656",
    garmentDark: "#101010"
  },
  {
    id: 8,
    name: "Night Gray Wide Pants",
    category: "pants",
    color: "Dark Gray",
    price: 46.99,
    type: "pants",
    toneLight: "#707070",
    toneDark: "#181818",
    garmentLight: "#5a5a5a",
    garmentDark: "#111111"
  }
];

let cart = JSON.parse(localStorage.getItem("randomFitsCart")) || [];

const productGrid = document.getElementById("productGrid");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const openCartBtn = document.getElementById("openCart");
const closeCartBtn = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const clearCart = document.getElementById("clearCart");

function money(value) {
  return `$${value.toFixed(2)}`;
}

function saveCart() {
  localStorage.setItem("randomFitsCart", JSON.stringify(cart));
}

function renderProducts() {
  productGrid.innerHTML = products.map(product => `
    <article class="product-card" id="${product.category}">
      <div
        class="product-art ${product.type}"
        style="
          --tone-light: ${product.toneLight};
          --tone-dark: ${product.toneDark};
          --garment-light: ${product.garmentLight};
          --garment-dark: ${product.garmentDark};
        "
      ></div>

      <div class="product-info">
        <h3>${product.name}</h3>
        <p>Â© ${product.color} // ${product.category}</p>

        <div class="product-row">
          <strong>${money(product.price)}</strong>
          <button class="add-mini" onclick="addToCart(${product.id})">Add</button>
        </div>
      </div>
    </article>
  `).join("");
}

function addToCart(productId) {
  const product = products.find(item => item.id === productId);
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  renderCart();
  openCart();
}

function updateQuantity(productId, change) {
  const item = cart.find(product => product.id === productId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(product => product.id !== productId);
  }

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
          <p>${item.color} â€¢ ${money(item.price)}</p>
        </div>

        <div class="qty">
          <button onclick="updateQuantity(${item.id}, -1)">âˆ’</button>
          <strong>${item.quantity}</strong>
          <button onclick="updateQuantity(${item.id}, 1)">+</button>
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

openCartBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

clearCart.addEventListener("click", () => {
  cart = [];
  saveCart();
  renderCart();
});

document.getElementById("filterAll").addEventListener("click", () => {
  document.getElementById("new").scrollIntoView({ behavior: "smooth" });
});

renderProducts();
renderCart();

