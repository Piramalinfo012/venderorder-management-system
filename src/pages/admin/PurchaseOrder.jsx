import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  Eye,
  FileText,
  Hash,
  Loader2,
  Package,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyn7g_Mt7zSTjTmukJhpKWokUCZNFb0l6g-bwd5jgUZLpbTBq-f4LviMjBBQlM85XeX/exec";

const PO_FORM_URL =
  "https://script.google.com/macros/s/AKfycbxuERnJ4UbK9abqRiuccfaxrPVPUnhHU9Y-WAMy8_tCS5cH7_pg7JSWIWIfY-WfWeX_Gg/exec";

// Sheet columns (0-indexed): Date | Proforma No | Party Name | Purchase Being Done For | Contact Person | Contact Number | GST Number | Pan | Billing Address | Shipping Address | Product | Quantity | Rate | Density Content | Sulphur Content | GCV | Moisture | Flash Point | Viscosity | Payment Terms & Conditions | PO Number | Transportation Type | Transportation Date & Time | Unloading Basis | Test Report Attachment | Any Other Information | Doc URL | PDF URL
const PO_COLUMNS = [
  "date",
  "orderNo",
  "partyName",
  "purchaseFor",
  "contactPerson",
  "contactNo",
  "gstNo",
  "pan",
  "address",
  "shippingAddress",
  "productName",
  "quantity",
  "price",
  "density",
  "sulphur",
  "gcv",
  "moisture",
  "flashPoint",
  "viscosity",
  "paymentTerms",
  "poNo",
  "transportation",
  "transportationDate",
  "unloading",
  "testReport",
  "otherInfo",
  "pdfEditUrl",
  "pdfUrl",
];

const HEADER_NAME_MAP = {
  "date": "date",
  "proforma no": "orderNo",
  "party name": "partyName",
  "purchase being done for": "purchaseFor",
  "contact person": "contactPerson",
  "contact number": "contactNo",
  "gst number": "gstNo",
  "pan": "pan",
  "billing address": "address",
  "shipping address": "shippingAddress",
  "product": "productName",
  "quantity": "quantity",
  "rate": "price",
  "density content": "density",
  "sulphur content": "sulphur",
  "gcv": "gcv",
  "moisture": "moisture",
  "flash point": "flashPoint",
  "viscosity": "viscosity",
  "payment terms & conditions": "paymentTerms",
  "po number": "poNo",
  "transportation type": "transportation",
  "transportation date & time": "transportationDate",
  "unloading basis": "unloading",
  "test report attachment": "testReport",
  "any other information": "otherInfo",
  "doc url": "pdfEditUrl",
  "pdf url": "pdfUrl",
};

const normalizePOs = (rows, headerRow = []) => {
  const headerMap = {};
  if (Array.isArray(headerRow)) {
    headerRow.forEach((col, idx) => {
      const normalized = String(col || "").trim().toLowerCase();
      if (HEADER_NAME_MAP[normalized]) {
        headerMap[HEADER_NAME_MAP[normalized]] = idx;
      }
    });
  }

  return rows
    .map((row, index) => {
      // Find PDF Edit URL (starts with docs.google.com)
      const pdfEditUrl = row.find((val) => typeof val === "string" && val.includes("docs.google.com/document")) || "";

      // Find PDF URL (starts with drive.google.com)
      const pdfUrl = row.find((val) => typeof val === "string" && val.includes("drive.google.com/file")) || "";

      const mapped = PO_COLUMNS.reduce((acc, key, colIdx) => {
        const actualIdx = headerMap[key] !== undefined ? headerMap[key] : colIdx;
        acc[key] = row[actualIdx] ?? "";
        return acc;
      }, {});

      if (pdfEditUrl) mapped.pdfEditUrl = pdfEditUrl;
      if (pdfUrl) mapped.pdfUrl = pdfUrl;

      return { id: `po-${index}`, ...mapped };
    })
    .filter((po) => po.orderNo || po.partyName || po.date);
};

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
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const cacheKey = "vendor-admin:po-data-purchase-order-v3";
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

        const rows = normalizePOs(data.slice(1), data[0]).reverse();

        // Save to cache
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            data: rows,
          })
        );

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
        <div className="w-full max-w-xl rounded-[1.25rem] sm:rounded-[2rem] border border-red-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Failed to load</h2>
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ddd6fe,_#f5f3ff_25%,_#f8fafc_55%,_#ede9fe_100%)] px-2 py-4 sm:px-6 sm:py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {debugInfo && (
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 font-mono text-[10px] text-violet-900 backdrop-blur-sm overflow-auto max-h-40">
            <strong>DEBUG RAW DATA:</strong> {debugInfo}
          </div>
        )}

        {/* Hero Header */}
        <section className="overflow-hidden rounded-[1.25rem] sm:rounded-[2rem] bg-[linear-gradient(135deg,#020617,#4c1d95_40%,#6d28d9_100%)] text-white shadow-[0_30px_80px_-35px_rgba(109,40,217,0.7)]">
          <div className="grid gap-4 sm:gap-6 px-2 py-4 sm:px-6 sm:py-5 sm:px-8 lg:grid-cols-[1.4fr_0.6fr]">
            {/* Left: Title + Stats */}
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
                  Purchase Orders
                </p>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight sm:text-4xl">
                  PO Command Center
                </h1>
                <p className="text-sm leading-7 text-violet-100">
                  Live purchase order records fetched directly from your Google Sheet.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-200">Total POs</p>
                  <p className="mt-2 text-xl sm:text-2xl font-bold">{orders.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-200">Filtered</p>
                  <p className="mt-2 text-xl sm:text-2xl font-bold">{filtered.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-200">With PDF</p>
                  <p className="mt-2 text-xl sm:text-2xl font-bold">
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
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
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
        <section className="rounded-[1.25rem] sm:rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.5)] backdrop-blur sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-600">
                Records
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
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
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((po) => (
                <div
                  key={po.id}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100"
                >
                  <div>
                    {/* Compact Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="rounded-xl bg-violet-950 p-2 text-white shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate" title={po.orderNo}>
                            {po.orderNo || "—"}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <CalendarDays className="h-3 w-3 shrink-0" />
                            {formatDate(po.date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(po)}
                          className="rounded-xl bg-violet-50 p-1.5 text-violet-600 transition hover:bg-violet-100 hover:text-violet-800"
                          title="View Full Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {po.pdfUrl && (
                          <a
                            href={po.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl bg-slate-100 p-1.5 text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
                            title="View PDF"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Compact Summary Info */}
                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold truncate" title={po.partyName}>
                          {po.partyName || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Package className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate" title={po.productName}>
                          {po.productName || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Hash className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {po.quantity || "—"}
                          {po.price ? ` · ₹${po.price}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="truncate text-slate-500 max-w-[60%]">
                      {po.paymentTerms || po.transportation || "PO"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(po)}
                      className="inline-flex items-center gap-1 font-semibold text-violet-600 hover:text-violet-800 transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full Details Modal */}
          {selectedOrder && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
              onClick={() => setSelectedOrder(null)}
            >
              <div
                className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-xl bg-violet-600 p-2 text-white shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {selectedOrder.orderNo || "Purchase Order"}
                        </h3>
                        <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                          {formatDate(selectedOrder.date)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {selectedOrder.partyName || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedOrder.pdfUrl && (
                      <a
                        href={selectedOrder.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>PDF</span>
                      </a>
                    )}
                    {selectedOrder.pdfEditUrl && (
                      <a
                        href={selectedOrder.pdfEditUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                      >
                        <span>Doc</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      title="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                  {/* Party & Contact */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                      Party & Contact Information
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block">Party Name</span>
                        <span className="font-semibold text-slate-800 text-sm">
                          {selectedOrder.partyName || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Purchase Being Done For</span>
                        <span className="font-semibold text-slate-800">
                          {selectedOrder.purchaseFor || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">GST Number</span>
                        <span className="font-semibold text-slate-800">
                          {selectedOrder.gstNo || "—"}
                        </span>
                      </div>
                      {selectedOrder.pan && (
                        <div>
                          <span className="text-slate-400 block">PAN</span>
                          <span className="font-semibold text-slate-800">
                            {selectedOrder.pan}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400 block">Contact Person</span>
                        <span className="font-medium text-slate-700">
                          {selectedOrder.contactPerson || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Contact Number</span>
                        <span className="font-medium text-slate-700">
                          {selectedOrder.contactNo || "—"}
                        </span>
                      </div>
                    </div>

                    {(selectedOrder.address || selectedOrder.shippingAddress) && (
                      <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedOrder.address && (
                          <div>
                            <span className="text-slate-400 block">Billing Address</span>
                            <span className="text-slate-700">{selectedOrder.address}</span>
                          </div>
                        )}
                        {selectedOrder.shippingAddress && (
                          <div>
                            <span className="text-slate-400 block">Shipping Address</span>
                            <span className="text-slate-700">{selectedOrder.shippingAddress}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Product & Commercials */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                      Product & Commercials
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-400 block">Product</span>
                        <span className="font-semibold text-slate-800">
                          {selectedOrder.productName || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Quantity</span>
                        <span className="font-semibold text-slate-800">
                          {selectedOrder.quantity || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Rate / Price</span>
                        <span className="font-bold text-emerald-700">
                          {selectedOrder.price ? `₹${selectedOrder.price}` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Payment Terms</span>
                        <span className="font-medium text-slate-700">
                          {selectedOrder.paymentTerms || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">PO Number</span>
                        <span className="font-medium text-slate-700">
                          {selectedOrder.poNo || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Specifications & Quality Parameters */}
                  {(selectedOrder.density ||
                    selectedOrder.sulphur ||
                    selectedOrder.gcv ||
                    selectedOrder.moisture ||
                    selectedOrder.flashPoint ||
                    selectedOrder.viscosity) && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                        Specifications & Quality Parameters
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedOrder.density && (
                          <div>
                            <span className="text-slate-400 block">Density Content</span>
                            <span className="font-medium text-slate-700">{selectedOrder.density}</span>
                          </div>
                        )}
                        {selectedOrder.sulphur && (
                          <div>
                            <span className="text-slate-400 block">Sulphur Content</span>
                            <span className="font-medium text-slate-700">{selectedOrder.sulphur}</span>
                          </div>
                        )}
                        {selectedOrder.gcv && (
                          <div>
                            <span className="text-slate-400 block">GCV</span>
                            <span className="font-medium text-slate-700">{selectedOrder.gcv}</span>
                          </div>
                        )}
                        {selectedOrder.moisture && (
                          <div>
                            <span className="text-slate-400 block">Moisture</span>
                            <span className="font-medium text-slate-700">{selectedOrder.moisture}</span>
                          </div>
                        )}
                        {selectedOrder.flashPoint && (
                          <div>
                            <span className="text-slate-400 block">Flash Point</span>
                            <span className="font-medium text-slate-700">{selectedOrder.flashPoint}</span>
                          </div>
                        )}
                        {selectedOrder.viscosity && (
                          <div>
                            <span className="text-slate-400 block">Viscosity</span>
                            <span className="font-medium text-slate-700">{selectedOrder.viscosity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Transportation & Logistics */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                      Transportation & Logistics
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-400 block">Transportation Type</span>
                        <span className="font-medium text-slate-700">
                          {selectedOrder.transportation || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Transportation Date & Time</span>
                        <span className="font-medium text-slate-700">
                          {formatDate(selectedOrder.transportationDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Unloading Basis</span>
                        <span className="font-medium text-slate-700">
                          {selectedOrder.unloading || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Test Report Attachment</span>
                        <span className="font-medium text-slate-700">
                          {selectedOrder.testReport || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Extra Info */}
                  {selectedOrder.otherInfo && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                        Additional Information
                      </p>
                      <p className="text-slate-700">{selectedOrder.otherInfo}</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PurchaseOrder;
