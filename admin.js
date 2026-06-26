const ADMIN_PIN = "1234";

const adminLock = document.getElementById("adminLock");
const adminDashboard = document.getElementById("adminDashboard");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminPin = document.getElementById("adminPin");
const lockAdmin = document.getElementById("lockAdmin");

const ordersList = document.getElementById("ordersList");
const orderDetails = document.getElementById("orderDetails");
const refreshOrders = document.getElementById("refreshOrders");
const exportOrders = document.getElementById("exportOrders");
const printAllLabels = document.getElementById("printAllLabels");
const clearAllOrders = document.getElementById("clearAllOrders");

const statTotalOrders = document.getElementById("statTotalOrders");
const statNewOrders = document.getElementById("statNewOrders");
const statSales = document.getElementById("statSales");

let selectedOrderNumber = null;

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

function unlockAdmin() {
  sessionStorage.setItem("randomFitsAdminUnlocked", "true");
  adminLock.classList.add("hidden");
  adminDashboard.classList.remove("hidden");
  renderOrders();
}

function lockAdminPanel() {
  sessionStorage.removeItem("randomFitsAdminUnlocked");
  adminDashboard.classList.add("hidden");
  adminLock.classList.remove("hidden");
  selectedOrderNumber = null;
  orderDetails.innerHTML = `
    <div class="order-details-empty">
      <h2>Select an order</h2>
      <p>Click an order to see customer info, items, shipping details, and label actions.</p>
    </div>
  `;
}

function renderStats(orders) {
  const totalOrders = orders.length;
  const newOrders = orders.filter(order => order.status === "New").length;
  const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  statTotalOrders.textContent = totalOrders;
  statNewOrders.textContent = newOrders;
  statSales.textContent = money(totalSales);
}

function renderOrders() {
  const orders = getOrders();
  renderStats(orders);

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
      <button class="order-row ${isActive}" onclick="selectOrder('${order.orderNumber}')">
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

      <select class="status-select" onchange="updateStatus('${order.orderNumber}', this.value)">
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
          <div class="summary-thumb product-visual ${item.type || "hoodie"}"
            style="--garment-light:${item.garmentLight || "#4f4f4f"}; --garment-dark:${item.garmentDark || "#090909"};"></div>
          <div>
            <strong>${item.name}</strong>
            <p>${item.color} / Size ${item.size} / Qty ${item.quantity}</p>
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
      <button class="primary-btn" onclick="printLabel('${order.orderNumber}')">Print Shipping Label</button>
      <button class="secondary-btn" onclick="printPackingSlip('${order.orderNumber}')">Print Packing Slip</button>
      <button class="secondary-btn" onclick="deleteOrder('${order.orderNumber}')">Delete Order</button>
    </div>
  `;
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

adminLoginForm.addEventListener("submit", event => {
  event.preventDefault();

  if (adminPin.value === ADMIN_PIN) {
    unlockAdmin();
  } else {
    alert("Wrong PIN.");
  }
});

lockAdmin.addEventListener("click", lockAdminPanel);
refreshOrders.addEventListener("click", renderOrders);
exportOrders.addEventListener("click", exportCsv);
printAllLabels.addEventListener("click", printAllOrderLabels);
clearAllOrders.addEventListener("click", clearOrders);

if (sessionStorage.getItem("randomFitsAdminUnlocked") === "true") {
  unlockAdmin();
}

