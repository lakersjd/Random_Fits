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
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

import { firebaseConfig } from "./firebase-config.js";

const CATALOG_CACHE_KEY = "randomFitsCatalog";
const CATALOG_COLLECTION = "catalog";
const CATALOG_DOCUMENT = "products";

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

  return {
    id: String(product?.id || `product-${Date.now()}-${index}`),
    name: String(product?.name || "Untitled Product").trim().slice(0, 100),
    category,
    color: String(product?.color || "Black").trim().slice(0, 50),
    price: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? Math.round(parsedPrice * 100) / 100 : 0,
    type,
    imageUrl: String(product?.imageUrl || "").trim().slice(0, 2000),
    garmentLight: String(product?.garmentLight || "#4f4f4f").slice(0, 20),
    garmentDark: String(product?.garmentDark || "#090909").slice(0, 20)
  };
}

export function normalizeCatalog(products) {
  if (!Array.isArray(products)) return DEFAULT_PRODUCTS.map(product => ({ ...product }));
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
      return { products: fallback, source: "defaults", remoteReady: true };
    }

    const products = normalizeCatalog(snapshot.data()?.items);
    cacheCatalog(products);
    return { products, source: "firebase", remoteReady: true };
  } catch (error) {
    return { products: fallback, source: "local", remoteReady: false, error };
  }
}

export async function saveCatalog(products) {
  const normalized = cacheCatalog(products);
  const database = getFirestore(getFirebaseApp());

  await setDoc(doc(database, CATALOG_COLLECTION, CATALOG_DOCUMENT), {
    items: normalized,
    updatedAt: serverTimestamp()
  });

  return normalized;
}

export async function uploadCatalogImage(productId, file) {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("Choose a valid image file.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Images must be smaller than 8 MB.");
  }

  const safeName = String(file.name || "product-image")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .slice(-100);
  const path = `products/${String(productId).replace(/[^a-zA-Z0-9_-]/g, "-")}/${Date.now()}-${safeName}`;
  const reference = storageRef(getStorage(getFirebaseApp()), path);

  await uploadBytes(reference, file, { contentType: file.type });
  return getDownloadURL(reference);
}
