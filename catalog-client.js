import { getCachedStoreSettings, loadCatalog } from "./catalog.js";

const result = await loadCatalog();

if (typeof window.setCatalogProducts === "function") {
  window.setCatalogProducts(result.products);
}

const settings = result.settings || getCachedStoreSettings();
const announcement = document.getElementById("siteAnnouncement");
const homeTag = document.getElementById("homeTag");
const homeTitle = document.getElementById("homeTitle");
const homeText = document.getElementById("homeText");

if (announcement) {
  announcement.textContent = settings.announcementText;
  announcement.classList.toggle("hidden", !settings.announcementEnabled);
}
if (homeTag) homeTag.textContent = settings.homeTag;
if (homeTitle) homeTitle.textContent = settings.homeTitle;
if (homeText) homeText.textContent = settings.homeText;

if (!result.remoteReady) {
  console.info("Using the local product catalog until Firestore is enabled.");
}
