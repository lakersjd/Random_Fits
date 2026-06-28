import "./catalog-defaults.js";
import {
  initializeApp,
  getApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const CATALOG_CACHE_KEY = "randomFitsCatalog";
const CATALOG_COLLECTION = "catalog";
const CATALOG_DOCUMENT = "products";
const STORE_SETTINGS_CACHE_KEY = "randomFitsStoreSettings";

export const DEFAULT_STORE_SETTINGS = {
  announcementEnabled: false,
  announcementText: "Free shipping on orders over $75",
  homeTag: "Drop 01 / Modern Streetwear",
  homeTitle: "Clean fits for every day.",
  homeText: "Premium black, gray, and dark-gray essentials built around shirts, hoodies, and pants.",
  supportEmail: "",
  shippingMessage: "Orders ship within 1–3 business days.",
  returnsMessage: "Unworn items may be returned within 30 days.",
  lowStockThreshold: 5,
  alertsEnabled: true,
  discountEnabled: false,
  discountCode: "",
  discountPercent: 10
};

export const DEFAULT_PRODUCTS = (globalThis.RANDOM_FITS_DEFAULT_PRODUCTS || []).map(product => ({ ...product }));

function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

function normalizeProduct(product, index = 0) {
  const allowedCategories = ["shirts", "hoodies", "pants"];
  const allowedTypes = ["shirt", "hoodie", "pants"];
  const category = allowedCategories.includes(product?.category) ? product.category : "shirts";
  const fallbackType = category === "hoodies" ? "hoodie" : category === "pants" ? "pants" : "shirt";
  const type = allowedTypes.includes(product?.type) ? product.type : fallbackType;
  const parsedPrice = Number(product?.price);
  const parsedStock = Number(product?.stock);
  const normalizeList = (value, maxItems, maxLength) => {
    const items = Array.isArray(value) ? value : String(value || "").split(/[\n,]+/);
    return items
      .map(item => String(item || "").trim().slice(0, maxLength))
      .filter((item, itemIndex, list) => item && list.indexOf(item) === itemIndex)
      .slice(0, maxItems);
  };

  return {
    id: String(product?.id || `product-${Date.now()}-${index}`),
    name: String(product?.name || "Untitled Product").trim().slice(0, 100),
    category,
    color: String(product?.color || "Black").trim().slice(0, 50),
    price: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? Math.round(parsedPrice * 100) / 100 : 0,
    type,
    imageUrl: String(product?.imageUrl || "").trim().slice(0, 240000),
    imageUrls: normalizeList(product?.imageUrls, 8, 2000),
    description: String(product?.description || "").trim().slice(0, 3000),
    colors: normalizeList(product?.colors, 12, 50),
    sizes: normalizeList(product?.sizes, 12, 20),
    stock: Number.isFinite(parsedStock) && parsedStock >= 0 ? Math.floor(parsedStock) : 25,
    stockStatus: ["in-stock", "out-of-stock", "draft"].includes(product?.stockStatus) ? product.stockStatus : "in-stock",
    garmentLight: String(product?.garmentLight || "#4f4f4f").slice(0, 20),
    garmentDark: String(product?.garmentDark || "#090909").slice(0, 20)
  };
}

export function normalizeStoreSettings(settings = {}) {
  return {
    announcementEnabled: Boolean(settings.announcementEnabled),
    announcementText: String(settings.announcementText || DEFAULT_STORE_SETTINGS.announcementText).trim().slice(0, 160),
    homeTag: String(settings.homeTag || DEFAULT_STORE_SETTINGS.homeTag).trim().slice(0, 100),
    homeTitle: String(settings.homeTitle || DEFAULT_STORE_SETTINGS.homeTitle).trim().slice(0, 140),
    homeText: String(settings.homeText || DEFAULT_STORE_SETTINGS.homeText).trim().slice(0, 500),
    supportEmail: String(settings.supportEmail || "").trim().slice(0, 200),
    shippingMessage: String(settings.shippingMessage || DEFAULT_STORE_SETTINGS.shippingMessage).trim().slice(0, 300),
    returnsMessage: String(settings.returnsMessage || DEFAULT_STORE_SETTINGS.returnsMessage).trim().slice(0, 300),
    lowStockThreshold: Math.max(0, Math.min(100, Number(settings.lowStockThreshold) || DEFAULT_STORE_SETTINGS.lowStockThreshold)),
    alertsEnabled: settings.alertsEnabled !== false,
    discountEnabled: Boolean(settings.discountEnabled),
    discountCode: String(settings.discountCode || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30),
    discountPercent: Math.max(1, Math.min(90, Number(settings.discountPercent) || 10))
  };
}

export function getCachedStoreSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_SETTINGS_CACHE_KEY));
    if (saved && typeof saved === "object") return normalizeStoreSettings(saved);
  } catch (error) {
    console.warn("Could not read cached store settings.", error);
  }
  return { ...DEFAULT_STORE_SETTINGS };
}

export function cacheStoreSettings(settings) {
  const normalized = normalizeStoreSettings(settings);
  localStorage.setItem(STORE_SETTINGS_CACHE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function normalizeCatalog(products) {
  if (!Array.isArray(products)) return [];
  return products.slice(0, 100).map(normalizeProduct);
}

export function getCachedCatalog() {
  try {
    const saved = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY));
    if (Array.isArray(saved) && saved.length) return normalizeCatalog(saved);
  } catch (error) {
    console.warn("Could not read the cached product catalog.", error);
  }

  return DEFAULT_PRODUCTS.map(product => ({ ...product }));
}

export function cacheCatalog(products) {
  const normalized = normalizeCatalog(products);
  localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function loadCatalog() {
  const fallback = getCachedCatalog();

  try {
    const database = getFirestore(getFirebaseApp());
    const snapshot = await getDoc(doc(database, CATALOG_COLLECTION, CATALOG_DOCUMENT));

    if (!snapshot.exists()) {
      return { products: fallback, settings: getCachedStoreSettings(), source: "defaults", remoteReady: true };
    }

    const products = normalizeCatalog(snapshot.data()?.items);
    cacheCatalog(products);
    const settings = cacheStoreSettings(snapshot.data()?.settings || getCachedStoreSettings());
    return { products, settings, source: "firebase", remoteReady: true };
  } catch (error) {
    return { products: fallback, settings: getCachedStoreSettings(), source: "local", remoteReady: false, error };
  }
}

export async function saveCatalog(products) {
  const normalized = cacheCatalog(products);
  const catalogSize = new Blob([JSON.stringify(normalized)]).size;
  if (catalogSize > 900000) {
    throw new Error("The free catalog image limit was reached. Use smaller images or public image URLs.");
  }
  const database = getFirestore(getFirebaseApp());

  await setDoc(doc(database, CATALOG_COLLECTION, CATALOG_DOCUMENT), {
    items: normalized,
    updatedAt: serverTimestamp()
  }, { merge: true });

  return normalized;
}

export async function loadStoreSettings() {
  const fallback = getCachedStoreSettings();
  try {
    const database = getFirestore(getFirebaseApp());
    const snapshot = await getDoc(doc(database, CATALOG_COLLECTION, CATALOG_DOCUMENT));
    if (!snapshot.exists()) return { settings: fallback, source: "defaults", remoteReady: true };
    return { settings: cacheStoreSettings(snapshot.data()?.settings || fallback), source: "firebase", remoteReady: true };
  } catch (error) {
    return { settings: fallback, source: "local", remoteReady: false, error };
  }
}

export async function saveStoreSettings(settings) {
  const normalized = cacheStoreSettings(settings);
  const database = getFirestore(getFirebaseApp());
  await setDoc(doc(database, CATALOG_COLLECTION, CATALOG_DOCUMENT), {
    settings: normalized,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return normalized;
}

export async function uploadCatalogImage(productId, file) {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("Choose a valid image file.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Images must be smaller than 8 MB.");
  }

  void productId;
  return compressImageForFreeCatalog(file);
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("The selected file is not a supported image."));
      image.onload = () => resolve(image);
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function compressImageForFreeCatalog(file) {
  const image = await readImageFile(file);
  const maximumWidth = 900;
  const maximumHeight = 1125;
  const scale = Math.min(1, maximumWidth / image.naturalWidth, maximumHeight / image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.72, 0.62, 0.52, 0.42]) {
    const dataUrl = canvas.toDataURL("image/webp", quality);
    if (dataUrl.length <= 220000) return dataUrl;
  }

  throw new Error("This picture is still too large after compression. Choose a smaller image.");
}
