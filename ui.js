(function initializeRandomFitsUI() {
  const icons = {
    success: "✓",
    error: "!",
    warning: "!",
    info: "i"
  };

  function getContainer() {
    let container = document.getElementById("notificationCenter");
    if (container) return container;

    container = document.createElement("div");
    container.id = "notificationCenter";
    container.className = "notification-center";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-label", "Notifications");
    document.body.appendChild(container);
    return container;
  }

  function notify(message, options = {}) {
    try {
      const settings = JSON.parse(localStorage.getItem("randomFitsStoreSettings"));
      if (settings?.alertsEnabled === false && options.force !== true) return null;
    } catch {
      // Use notifications when settings are not available yet.
    }
    const type = ["success", "error", "warning", "info"].includes(options.type) ? options.type : "info";
    const toast = document.createElement("div");
    toast.className = `shopify-toast ${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${icons[type]}</span>
      <div class="toast-copy">
        ${options.title ? `<strong>${escapeHtml(options.title)}</strong>` : ""}
        <p>${escapeHtml(message)}</p>
      </div>
      <button class="toast-close" type="button" aria-label="Dismiss notification">×</button>
    `;

    const remove = () => {
      toast.classList.add("leaving");
      setTimeout(() => toast.remove(), 180);
    };

    toast.querySelector(".toast-close").addEventListener("click", remove);
    getContainer().appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(remove, Math.max(1800, Number(options.duration) || 4200));
    return toast;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  globalThis.RandomFitsUI = { notify };
})();
