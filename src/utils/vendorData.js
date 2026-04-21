const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyn7g_Mt7zSTjTmukJhpKWokUCZNFb0l6g-bwd5jgUZLpbTBq-f4LviMjBBQlM85XeX/exec";

const CACHE_KEY = "vendor-rate-tracking:vendors";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache for ultra-fast navigation between pages

const columns = [
  "partyName",
  "stateName",
  "billingAddress",
  "gstNumber",
  "contactPerson",
  "whatsappNumber",
  "productsTheySell",
  "lastPurchaseDate",
  "paymentTerm",
  "creditLitmit",
  "documentId"
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
        rowIndex: index + 2, // Row 1 is header, data starts at Row 2
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
