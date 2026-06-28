import { loadCatalog } from "./catalog.js";

const result = await loadCatalog();

if (typeof window.setCatalogProducts === "function") {
  window.setCatalogProducts(result.products);
}

if (!result.remoteReady) {
  console.info("Using the local product catalog until Firestore is enabled.");
}
