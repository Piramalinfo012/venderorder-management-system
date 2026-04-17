const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzQGz5S4rrdZJNB2FN4YmgPb68Do-dUsZ3pogb3OxVyeOzHcIt-SSKc2iautiPyamL5/exec";

const CACHE_KEY = "vendor-rate-tracking:vendors";
const CACHE_TTL_MS = 5 * 60 * 1000;

const columns = [
  "partyName",
  "stateName",
  "billingAddress",
  "gstNumber",
  "contactPerson",
  "whatsappNumber",
  "productsTheySell",
  "lastPurchaseDate",
];

let memoryCache = null;

const normalizeVendors = (rows) =>
  rows
    .map((row, index) => {
      const mapped = columns.reduce((accumulator, key, columnIndex) => {
        accumulator[key] = row[columnIndex] ?? "";
        return accumulator;
      }, {});

      return {
        id: `${index}-${mapped.partyName || mapped.contactPerson || "vendor"}`,
        ...mapped,
      };
    })
    .filter((vendor) => columns.some((key) => String(vendor[key] || "").trim() !== ""));

const readCache = () => {
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache;
  }

  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || !Array.isArray(parsed?.vendors)) {
      return null;
    }

    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    memoryCache = parsed;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (payload) => {
  memoryCache = payload;

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore session storage failures and continue with memory cache.
  }
};

export const getProductTags = (value) => {
  if (!value) return [];

  return value
    .split(/[\/,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const fetchVendorsCached = async () => {
  const cached = readCache();
  if (cached) {
    return { vendors: cached.vendors, updated: cached.updated, fromCache: true };
  }

  const response = await fetch(`${SCRIPT_URL}?sheet=Vendor`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !Array.isArray(result.data)) {
    throw new Error(result.error || "Vendor data is unavailable");
  }

  const payload = {
    vendors: normalizeVendors(result.data.slice(1)),
    updated: result.updated || "",
    timestamp: Date.now(),
  };

  writeCache(payload);

  return { vendors: payload.vendors, updated: payload.updated, fromCache: false };
};
