const summaryItems = document.getElementById("summaryItems");
const summaryTotal = document.getElementById("summaryTotal");
const checkoutForm = document.getElementById("checkoutForm");
const orderMessage = document.getElementById("orderMessage");

let cart = JSON.parse(localStorage.getItem("randomFitsCart")) || [];

function money(value) {
  return `$${value.toFixed(2)}`;
}

function renderSummary() {
  if (cart.length === 0) {
    summaryItems.innerHTML = `<p class="note">Your bag is empty. Go back and add a fit first.</p>`;
    summaryTotal.textContent = "$0.00";
    return;
  }

  summaryItems.innerHTML = cart.map(item => `
    <div class="summary-item">
      <strong>${item.name}</strong>
      <span>${item.color} â€¢ Qty ${item.quantity} â€¢ ${money(item.price * item.quantity)}</span>
    </div>
  `).join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  summaryTotal.textContent = money(total);
}

checkoutForm.addEventListener("submit", event => {
  event.preventDefault();

  if (cart.length === 0) {
    orderMessage.innerHTML = "Your bag is empty. Add something before placing a test order.";
    orderMessage.classList.add("show");
    return;
  }

  const form = new FormData(checkoutForm);
  const name = form.get("firstName");
  const orderNumber = "RF-" + Math.floor(100000 + Math.random() * 900000);

  orderMessage.innerHTML = `
    <strong>Test order placed.</strong><br>
    Thanks ${name}. Your order number is <strong>${orderNumber}</strong>.
  `;
  orderMessage.classList.add("show");

  localStorage.removeItem("randomFitsCart");
  cart = [];
  checkoutForm.reset();
  renderSummary();
});

renderSummary();

