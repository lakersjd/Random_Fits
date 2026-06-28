const summaryItems = document.getElementById("summaryItems");
const summaryTotal = document.getElementById("summaryTotal");
const checkoutForm = document.getElementById("checkoutForm");
const orderMessage = document.getElementById("orderMessage");

const addressInput = document.getElementById("address");
const addressSuggestions = document.getElementById("addressSuggestions");
const zipInput = document.getElementById("zip");
const cityInput = document.getElementById("city");
const stateInput = document.getElementById("state");
const zipStatus = document.getElementById("zipStatus");

let cart = JSON.parse(localStorage.getItem("randomFitsCart")) || [];
let addressTimer = null;
let addressAbortController = null;

const stateAbbreviations = {
  "Alabama": "AL",
  "Alaska": "AK",
  "Arizona": "AZ",
  "Arkansas": "AR",
  "California": "CA",
  "Colorado": "CO",
  "Connecticut": "CT",
  "Delaware": "DE",
  "Florida": "FL",
  "Georgia": "GA",
  "Hawaii": "HI",
  "Idaho": "ID",
  "Illinois": "IL",
  "Indiana": "IN",
  "Iowa": "IA",
  "Kansas": "KS",
  "Kentucky": "KY",
  "Louisiana": "LA",
  "Maine": "ME",
  "Maryland": "MD",
  "Massachusetts": "MA",
  "Michigan": "MI",
  "Minnesota": "MN",
  "Mississippi": "MS",
  "Missouri": "MO",
  "Montana": "MT",
  "Nebraska": "NE",
  "Nevada": "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  "Ohio": "OH",
  "Oklahoma": "OK",
  "Oregon": "OR",
  "Pennsylvania": "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  "Tennessee": "TN",
  "Texas": "TX",
  "Utah": "UT",
  "Vermont": "VT",
  "Virginia": "VA",
  "Washington": "WA",
  "West Virginia": "WV",
  "Wisconsin": "WI",
  "Wyoming": "WY",
  "District of Columbia": "DC"
};

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

function getSavedOrders() {
  return JSON.parse(localStorage.getItem("randomFitsOrders")) || [];
}

function saveOrder(order) {
  const orders = getSavedOrders();
  orders.unshift(order);
  localStorage.setItem("randomFitsOrders", JSON.stringify(orders));
}


function removeCheckoutItem(productId, size, color) {
  cart = cart.filter(product => !(String(product.id) === String(productId) && product.size === size && product.color === color));
  saveCart();
  renderSummary();
}

/* ----------------------------------------------------------
   FREE NO-KEY ADDRESS AUTOCOMPLETE
   Uses free public search + manual fallback.
   No Google key. No billing.
---------------------------------------------------------- */

function fixCommonAddressTypos(value) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\bguildford\b/gi, "guilford")
    .replace(/\bguildfords\b/gi, "guilford")
    .replace(/\bguilfords\b/gi, "guilford");
}

function getTypedHouseNumber(value) {
  const match = (value || "").trim().match(/^(\d+[A-Za-z]?)/);
  return match ? match[1] : "";
}

function streetAlreadyHasHouseNumber(street) {
  return /^\d+[A-Za-z]?\b/.test((street || "").trim());
}

function keepTypedHouseNumber(street, typedValue) {
  const cleanStreet = (street || "").trim();
  const typedHouseNumber = getTypedHouseNumber(typedValue);

  if (!cleanStreet) return typedHouseNumber;
  if (!typedHouseNumber) return cleanStreet;
  if (streetAlreadyHasHouseNumber(cleanStreet)) return cleanStreet;

  return `${typedHouseNumber} ${cleanStreet}`.trim();
}


function getStateAbbreviation(state) {
  if (!state) return "";
  return stateAbbreviations[state] || state.slice(0, 2).toUpperCase();
}

function hideAddressSuggestions() {
  if (!addressSuggestions) return;
  addressSuggestions.innerHTML = "";
  addressSuggestions.classList.remove("show");
}

function setAddressStatus(message, type = "") {
  if (!zipStatus) return;

  zipStatus.textContent = message;
  zipStatus.classList.remove("success", "error");

  if (type) {
    zipStatus.classList.add(type);
  }
}

function buildAddressQueries(rawQuery) {
  const typed = rawQuery.trim().replace(/\s+/g, " ");
  const fixed = fixCommonAddressTypos(typed);
  const queries = new Set();

  if (typed) queries.add(typed);
  if (fixed) queries.add(fixed);

  const city = cityInput ? cityInput.value.trim() : "";
  const state = stateInput ? stateInput.value.trim() : "";
  const zip = zipInput ? zipInput.value.trim() : "";

  if (city || state) {
    queries.add(`${typed} ${city} ${state}`.trim());
    queries.add(`${fixed} ${city} ${state}`.trim());
  }

  if (zip.length === 5) {
    queries.add(`${typed} ${zip}`);
    queries.add(`${fixed} ${zip}`);
  }

  const numberStreet = fixed.match(/^(\d+)\s+(.+)$/);

  if (numberStreet) {
    const houseNumber = numberStreet[1];
    const streetName = numberStreet[2].trim();

    queries.add(streetName);
    queries.add(`${houseNumber} ${streetName}`);

    ["st", "street", "ave", "avenue", "rd", "road", "blvd", "drive", "dr", "lane", "ln", "court", "ct", "place", "pl", "way"].forEach(type => {
      queries.add(`${houseNumber} ${streetName} ${type}`);
    });
  }

  return Array.from(queries)
    .filter(query => query.length >= 3)
    .slice(0, 12);
}

function resultKey(result) {
  return `${result.street}|${result.city}|${result.state}|${result.zip}`.toLowerCase();
}

function scoreAddress(result, typedQuery) {
  const display = `${result.street} ${result.city} ${result.state} ${result.zip}`.toLowerCase();
  const fixed = fixCommonAddressTypos(typedQuery).toLowerCase();
  const parts = fixed.split(" ").filter(Boolean);

  let score = 0;

  if (display.includes(fixed)) score += 100;

  const houseNumber = fixed.match(/^(\d+)/);
  if (houseNumber && display.includes(houseNumber[1])) score += 35;
  if (houseNumber && !display.includes(houseNumber[1])) score -= 10;

  parts.forEach(part => {
    if (display.includes(part)) score += 12;
  });

  if (fixed.includes("guilford") && display.includes("guilford")) score += 50;

  if (result.zip) score += 10;
  if (result.city) score += 8;
  if (result.state) score += 8;
  if (result.street.match(/^\d+\s/)) score += 12;

  return score;
}

function fromPhotonFeature(feature) {
  const props = feature.properties || {};
  const houseNumber = props.housenumber || "";
  const road = props.street || props.name || "";
  const street = `${houseNumber} ${road}`.trim() || props.name || "";

  const city = props.city || props.town || props.village || props.county || "";
  const state = getStateAbbreviation(props.state || "");
  const zip = (props.postcode || "").toString().split("-")[0].slice(0, 5);
  const country = props.countrycode || props.country || "";

  if (country && country.toString().toLowerCase() !== "us" && country.toString().toLowerCase() !== "usa" && country.toString().toLowerCase() !== "united states") {
    return null;
  }

  if (!street) return null;

  return {
    street,
    city,
    state,
    zip,
    source: "photon"
  };
}

function fromNominatimResult(result) {
  const address = result.address || {};
  const houseNumber = address.house_number || "";
  const road = address.road || address.pedestrian || address.residential || address.neighbourhood || result.name || "";
  const street = `${houseNumber} ${road}`.trim() || result.display_name || "";

  const city = address.city || address.town || address.village || address.hamlet || address.county || "";
  const state = getStateAbbreviation(address.state || "");
  const zip = (address.postcode || "").split("-")[0].slice(0, 5);

  if (!street) return null;

  return {
    street,
    city,
    state,
    zip,
    source: "nominatim"
  };
}

async function searchPhoton(query, signal) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=en`;
  const response = await fetch(url, { signal });

  if (!response.ok) return [];

  const data = await response.json();
  return (data.features || [])
    .map(fromPhotonFeature)
    .filter(Boolean);
}

async function searchNominatim(query, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=us&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    signal,
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) return [];

  const data = await response.json();
  return (data || [])
    .map(fromNominatimResult)
    .filter(Boolean);
}

function renderAddressSuggestions(results, typedValue) {
  if (!addressSuggestions || !addressInput) return;

  const manualOption = {
    manual: true,
    street: addressInput.value.trim(),
    city: cityInput ? cityInput.value.trim() : "",
    state: stateInput ? stateInput.value.trim() : "",
    zip: zipInput ? zipInput.value.trim() : ""
  };

  const suggestions = [...results.slice(0, 6), manualOption];

  addressSuggestions.innerHTML = suggestions.map((result, index) => {
    if (result.manual) {
      return `
        <button class="address-suggestion manual" type="button" data-index="${index}">
          <strong>Use typed address</strong>
          <span>${result.street || typedValue}</span>
        </button>
      `;
    }

    const displayStreet = keepTypedHouseNumber(result.street, addressInput.value);
    const small = [result.city, result.state, result.zip].filter(Boolean).join(", ");

    return `
      <button class="address-suggestion" type="button" data-index="${index}">
        <strong>${displayStreet}</strong>
        <span>${small || "United States"}</span>
      </button>
    `;
  }).join("");

  addressSuggestions.classList.add("show");

  addressSuggestions.querySelectorAll(".address-suggestion").forEach(button => {
    button.addEventListener("click", () => {
      const result = suggestions[Number(button.dataset.index)];
      selectAddressSuggestion(result);
    });
  });
}

function selectAddressSuggestion(result) {
  if (!result || !addressInput) return;

  if (result.street) addressInput.value = keepTypedHouseNumber(result.street, addressInput.value);
  if (result.city && cityInput) cityInput.value = result.city;
  if (result.state && stateInput) stateInput.value = result.state;
  if (result.zip && zipInput) zipInput.value = result.zip;

  hideAddressSuggestions();

  if (result.manual) {
    setAddressStatus("Using typed address. Fill city/state/ZIP if needed.");
  } else if (result.city && result.state) {
    setAddressStatus(`Auto-filled ${result.city}, ${result.state}.`, "success");
  }
}

async function searchAddressSuggestions(rawQuery) {
  if (!addressInput || !addressSuggestions) return;

  const cleanQuery = rawQuery.trim();

  if (cleanQuery.length < 3) {
    hideAddressSuggestions();
    setAddressStatus("Type at least 3 letters to search addresses.");
    return;
  }

  if (addressAbortController) {
    addressAbortController.abort();
  }

  addressAbortController = new AbortController();
  const signal = addressAbortController.signal;

  addressSuggestions.innerHTML = `<div class="address-suggestion muted">Searching free address suggestions...</div>`;
  addressSuggestions.classList.add("show");

  try {
    const queries = buildAddressQueries(cleanQuery);
    const allResults = [];

    for (const query of queries) {
      if (signal.aborted) return;

      const photonResults = await searchPhoton(query, signal);
      allResults.push(...photonResults);

      if (allResults.length < 5) {
        const nominatimResults = await searchNominatim(query, signal);
        allResults.push(...nominatimResults);
      }

      if (allResults.length >= 8) {
        break;
      }
    }

    const seen = new Set();
    const filtered = allResults
      .filter(result => {
        const key = resultKey(result);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => scoreAddress(b, cleanQuery) - scoreAddress(a, cleanQuery))
      .slice(0, 6);

    renderAddressSuggestions(filtered, cleanQuery);

    if (filtered.length === 0) {
      setAddressStatus("No exact free match yet. You can still use the typed address.", "error");
    } else {
      setAddressStatus("Select an address suggestion, or use the typed address.");
    }
  } catch (error) {
    if (error.name === "AbortError") return;

    renderAddressSuggestions([], cleanQuery);
    setAddressStatus("Free search could not find it. You can still use the typed address.", "error");
  }
}

if (addressInput) {
  addressInput.addEventListener("input", () => {
    clearTimeout(addressTimer);
    addressTimer = setTimeout(() => {
      searchAddressSuggestions(addressInput.value);
    }, 250);
  });

  addressInput.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      hideAddressSuggestions();
    }
  });

  document.addEventListener("click", event => {
    if (!event.target.closest(".address-field")) {
      hideAddressSuggestions();
    }
  });
}

/* ----------------------------------------------------------
   ZIP TO CITY / STATE AUTOFILL
---------------------------------------------------------- */

async function autofillCityStateFromZip(zip) {
  if (!zipInput || !cityInput || !stateInput || !zipStatus) return;

  const cleanZip = zip.replace(/\D/g, "").slice(0, 5);
  zipInput.value = cleanZip;

  if (cleanZip.length !== 5) {
    setAddressStatus("Type an address for free suggestions, or enter ZIP to auto-fill city/state.");
    return;
  }

  setAddressStatus("Looking up city and state...");

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);

    if (!response.ok) {
      throw new Error("ZIP not found");
    }

    const data = await response.json();
    const place = data.places && data.places[0];

    if (!place) {
      throw new Error("No city found");
    }

    cityInput.value = place["place name"] || "";
    stateInput.value = place["state abbreviation"] || "";

    setAddressStatus(`Auto-filled ${cityInput.value}, ${stateInput.value}.`, "success");
  } catch (error) {
    setAddressStatus("Could not auto-fill this ZIP. Please enter city and state manually.", "error");
  }
}

if (zipInput) {
  zipInput.addEventListener("input", () => {
    const cleanZip = zipInput.value.replace(/\D/g, "").slice(0, 5);
    zipInput.value = cleanZip;

    if (cleanZip.length === 5) {
      autofillCityStateFromZip(cleanZip);
    } else {
      setAddressStatus("Type an address for free suggestions, or enter ZIP to auto-fill city/state.");
    }
  });

  zipInput.addEventListener("blur", () => {
    const cleanZip = zipInput.value.replace(/\D/g, "").slice(0, 5);
    if (cleanZip.length === 5) {
      autofillCityStateFromZip(cleanZip);
    }
  });
}

/* ----------------------------------------------------------
   ORDER SUMMARY / CHECKOUT
---------------------------------------------------------- */

function renderSummary() {
  if (cart.length === 0) {
    summaryItems.innerHTML = `<p class="note">Your bag is empty. Go back and add something first.</p>`;
    summaryTotal.textContent = "$0.00";
    return;
  }

  summaryItems.innerHTML = cart.map(item => {
    const image = item.imageUrl
      ? `<div class="summary-thumb product-photo"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}"></div>`
      : `<div class="summary-thumb product-image-empty"><span>No image</span></div>`;

    return `
      <div class="summary-item">
        ${image}

        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.color)} / Size ${escapeHtml(item.size)} / Qty ${Number(item.quantity || 0)} / ${money(item.price * item.quantity)}</span>

          <div class="summary-actions">
            <button class="remove-summary-item" data-remove-checkout="${escapeHtml(item.id)}" data-size="${escapeHtml(item.size)}" data-color="${escapeHtml(item.color)}">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  summaryTotal.textContent = money(total);
}

summaryItems.addEventListener("click", event => {
  const button = event.target.closest("[data-remove-checkout]");
  if (button) removeCheckoutItem(button.dataset.removeCheckout, button.dataset.size, button.dataset.color);
});

checkoutForm.addEventListener("submit", event => {
  event.preventDefault();

  if (cart.length === 0) {
    orderMessage.innerHTML = "Your bag is empty.";
    orderMessage.classList.add("show");
    return;
  }

  const form = new FormData(checkoutForm);
  const name = form.get("firstName");
  const orderNumber = "RF-" + Math.floor(100000 + Math.random() * 900000);
  const orderTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = {
    orderNumber,
    createdAt: new Date().toISOString(),
    status: "New",
    customer: {
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      email: form.get("email"),
      phone: form.get("phone")
    },
    shipping: {
      address: form.get("address"),
      city: form.get("city"),
      state: form.get("state"),
      zip: form.get("zip"),
      notes: form.get("notes")
    },
    items: cart,
    total: orderTotal
  };

  saveOrder(order);

  orderMessage.innerHTML = `<strong>Test order placed.</strong><br>Thanks ${name}. Your order number is <strong>${orderNumber}</strong>.`;
  orderMessage.classList.add("show");

  localStorage.removeItem("randomFitsCart");
  cart = [];
  checkoutForm.reset();
  hideAddressSuggestions();
  setAddressStatus("Type an address for free suggestions, or enter ZIP to auto-fill city/state.");
  renderSummary();
});

renderSummary();

