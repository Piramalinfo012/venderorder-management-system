import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  Hash,
  Loader2,
  Package,
  Plus,
  Search,
  User,
} from "lucide-react";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyn7g_Mt7zSTjTmukJhpKWokUCZNFb0l6g-bwd5jgUZLpbTBq-f4LviMjBBQlM85XeX/exec";

const PO_FORM_URL =
  "https://script.google.com/macros/s/AKfycbxuERnJ4UbK9abqRiuccfaxrPVPUnhHU9Y-WAMy8_tCS5cH7_pg7JSWIWIfY-WfWeX_Gg/exec";

// Sheet columns (0-indexed): DATE ORDER_NO PARTY_NAME ADDRESS KINDLY_ATTN CONTACT_NO GST_NO PAN_NO HSN_CODE QUANTITY PRODUCT_NAME UNIT PRICE TRANSPORTATION LIFTING NOTE PAYMENT_TERMS SHIPPING_ADDRESS PDF_EDIT_URL PDF_URL
const PO_COLUMNS = [
  "date",
  "orderNo",
  "partyName",
  "address",
  "kindlyAttn",
  "contactNo",
  "gstNo",
  "panNo",
  "hsnCode",
  "quantity",
  "productName",
  "unit",
  "price",
  "transportation",
  "lifting",
  "note",
  "paymentTerms",
  "shippingAddress",
  "pdfEditUrl",
  "pdfUrl",
];

const normalizePOs = (rows) =>
  rows
    .map((row, index) => {
      const mapped = PO_COLUMNS.reduce((acc, key, colIdx) => {
        acc[key] = row[colIdx] ?? "";
        return acc;
      }, {});
      return { id: `po-${index}`, ...mapped };
    })
    .filter((po) => po.orderNo || po.partyName || po.date);

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const PurchaseOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      const cacheKey = "vendor-admin:po-data";
      const cacheTTL = 5 * 60 * 1000; // 5 minutes cache

      try {
        setLoading(true);
        setError(null);

        const cachedRaw = sessionStorage.getItem(cacheKey);
        if (cachedRaw) {
          try {
            const parsedCache = JSON.parse(cachedRaw);
            if (parsedCache && Date.now() - parsedCache.timestamp < cacheTTL) {
              setOrders(parsedCache.data);
              setLoading(false);
              return;
            }
          } catch (e) {
            // Ignore corrupted cache
          }
        }

        const sheetName = encodeURIComponent("Purchase Order");
        const url = `${SCRIPT_URL}?sheet=${sheetName}&t=${Date.now()}`;
        console.log("Fetching PO from:", url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const result = await res.json();

        const data = result.data ?? result.rows ?? result.values ?? null;
        if (!Array.isArray(data)) {
          throw new Error(result.error || "Purchase Order data unavailable — check sheet name in Google Script");
        }
        
        const rows = normalizePOs(data.slice(1)).reverse();
        
        // Save to cache
        sessionStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: rows
        }));

        setOrders(rows);
      } catch (err) {
        console.error("PO fetch error:", err);
        setError(err.message || "Failed to load purchase orders");
        setDebugInfo(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((po) =>
      [po.orderNo, po.partyName, po.productName, po.date]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [search, orders]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#f5f3ff,#f8fafc,#ecfeff)]">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-lg">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          <span className="text-sm font-semibold text-slate-700">
            Loading Purchase Orders…
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-red-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Failed to load</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ddd6fe,_#f5f3ff_25%,_#f8fafc_55%,_#ede9fe_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {debugInfo && (
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 font-mono text-[10px] text-violet-900 backdrop-blur-sm overflow-auto max-h-40">
            <strong>DEBUG RAW DATA:</strong> {debugInfo}
          </div>
        )}

        {/* Hero Header */}
        <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#020617,#4c1d95_40%,#6d28d9_100%)] text-white shadow-[0_30px_80px_-35px_rgba(109,40,217,0.7)]">
          <div className="grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1.4fr_0.6fr]">

            {/* Left: Title + Stats */}
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
                  Purchase Orders
                </p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  PO Command Center
                </h1>
                <p className="text-sm leading-7 text-violet-100">
                  Live purchase order records fetched directly from your Google Sheet.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-200">Total POs</p>
                  <p className="mt-2 text-2xl font-bold">{orders.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-200">Filtered</p>
                  <p className="mt-2 text-2xl font-bold">{filtered.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-200">With PDF</p>
                  <p className="mt-2 text-2xl font-bold">
                    {orders.filter((o) => o.pdfUrl).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: New PO Button + Search */}
            <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
                Quick Actions
              </p>

              <button
                onClick={() => window.open(PO_FORM_URL, "_blank")}
                className="group flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-left text-violet-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="rounded-xl bg-violet-600 p-2 text-white">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">New Purchase Order</p>
                  <p className="text-xs text-slate-500 mt-0.5">Open PO form in new tab</p>
                </div>
                <ExternalLink className="ml-auto h-4 w-4 text-slate-400 group-hover:text-violet-600 transition" />
              </button>

              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <Search className="h-4 w-4 text-violet-200 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order, party, product…"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-violet-300"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Orders Grid */}
        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.5)] backdrop-blur sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-600">
                Records
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Purchase Order List
              </h2>
            </div>
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
              {filtered.length} orders
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-sm text-slate-500">
                {orders.length === 0
                  ? "No purchase orders found in the sheet."
                  : "No orders match your search."}
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {filtered.map((po) => (
                <div
                  key={po.id}
                  className="group rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/60"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-violet-950 p-2 text-white">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {po.orderNo || "—"}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(po.date)}
                        </p>
                      </div>
                    </div>
                    {po.pdfUrl && (
                      <a
                        href={po.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-violet-50 p-2 text-violet-600 transition hover:bg-violet-100"
                        title="View PDF"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  {/* Info Rows */}
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {po.partyName || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Package className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{po.productName || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Hash className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        {po.quantity || "—"} {po.unit || ""}
                        {po.price ? ` · ₹${po.price}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {po.gstNo && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        GST: {po.gstNo}
                      </span>
                    )}
                    {po.paymentTerms && (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        {po.paymentTerms}
                      </span>
                    )}
                    {po.pdfEditUrl && (
                      <a
                        href={po.pdfEditUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition"
                      >
                        Edit PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PurchaseOrder;
