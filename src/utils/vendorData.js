const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzQGz5S4rrdZJNB2FN4YmgPb68Do-dUsZ3pogb3OxVyeOzHcIt-SSKc2iautiPyamL5/exec";

const CACHE_KEY = "vendor-rate-tracking:vendors";
const CACHE_TTL_MS = 10 * 1000; // 10 seconds for 'instant' feel

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

// Evict any stale cache from older sessions on module load
try {
  sessionStorage.removeItem(CACHE_KEY);
} catch {
  // ignore
}

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
  if (value === undefined || value === null) return [];
  const str = String(value).trim();
  if (!str) return [];

  // Split by common separators: / \ | , ; but preserve spaces within names
  return str
    .split(/\s*[\/\\|;,]\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const fetchVendorsCached = async () => {
  const cached = readCache();
  if (cached) {
    return { vendors: cached.vendors, updated: cached.updated, fromCache: true };
  }

  // Force refresh with a timestamp to bypass any network layer caching
  const fetchUrl = `${SCRIPT_URL}?sheet=Vendor&t=${Date.now()}`;
  const response = await fetch(fetchUrl);
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
