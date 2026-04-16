import { useEffect, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  Building2,
  Loader2,
  MapPin,
  Package,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { fetchVendorsCached, getProductTags } from "../../utils/vendorData";

const formatPurchaseDate = (value) => {
  if (!value) return "No purchase date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const VendorSearch = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partyFilter, setPartyFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        const { vendors: vendorRecords } = await fetchVendorsCached();
        setVendors(vendorRecords);
      } catch (fetchError) {
        console.error("Error fetching vendor search data:", fetchError);
        setError(fetchError.message || "Unable to load vendors");
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const productOptions = useMemo(() => {
    const unique = new Set();
    vendors.forEach((vendor) => {
      getProductTags(vendor.productsTheySell).forEach((tag) => unique.add(tag));
    });

    return Array.from(unique).sort((left, right) => left.localeCompare(right));
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    const normalizedParty = partyFilter.trim().toLowerCase();
    const normalizedProduct = productFilter.trim().toLowerCase();

    return vendors.filter((vendor) => {
      const matchesParty =
        !normalizedParty ||
        vendor.partyName?.toLowerCase().includes(normalizedParty) ||
        vendor.contactPerson?.toLowerCase().includes(normalizedParty) ||
        vendor.stateName?.toLowerCase().includes(normalizedParty);

      const matchesProduct =
        !normalizedProduct ||
        getProductTags(vendor.productsTheySell).some((tag) =>
          tag.toLowerCase().includes(normalizedProduct)
        ) ||
        vendor.productsTheySell?.toLowerCase().includes(normalizedProduct);

      return matchesParty && matchesProduct;
    });
  }, [partyFilter, productFilter, vendors]);

  const metrics = useMemo(
    () => ({
      totalVendors: vendors.length,
      matchingResults: filteredVendors.length,
      statesCovered: new Set(vendors.map((vendor) => vendor.stateName).filter(Boolean)).size,
      productsCovered: productOptions.length,
    }),
    [filteredVendors.length, productOptions.length, vendors]
  );

  const clearFilters = () => {
    setPartyFilter("");
    setProductFilter("");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#eff6ff,#f8fafc,#ecfeff)]">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-lg">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          <span className="text-sm font-semibold text-slate-700">
            Loading vendor search...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-red-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Vendor data load failed</h2>
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#bfdbfe,_#eff6ff_25%,_#f8fafc_55%,_#ecfeff_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#020617,#0f172a_30%,#0f766e_100%)] text-white shadow-[0_30px_80px_-35px_rgba(15,23,42,0.85)]">
          <div className="grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative space-y-5">
              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Vendor Search</h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                  Review vendor records using party name and product filters with a
                  structured operational view of the current vendor database.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">
                    Total Vendors
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{metrics.totalVendors}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">
                    Matching
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{metrics.matchingResults}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">
                    States
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{metrics.statesCovered}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">
                    Products
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{metrics.productsCovered}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filter panel</h2>
                {(partyFilter || productFilter) && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                    Clear all
                  </button>
                )}
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                    Party name filter
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-slate-900">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      value={partyFilter}
                      onChange={(event) => setPartyFilter(event.target.value)}
                      placeholder="Search by party, contact or state"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                    Product name filter
                  </label>
                  <div className="rounded-2xl bg-white px-4 py-3 text-slate-900">
                    <select
                      value={productFilter}
                      onChange={(event) => setProductFilter(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                    >
                      <option value="">All products</option>
                      {productOptions.map((product) => (
                        <option key={product} value={product}>
                          {product}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-200/20 bg-slate-950/20 p-4">
                  <p className="text-sm font-semibold text-white">Quick insight</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    Current filters ke hisaab se aapko {filteredVendors.length} vendor
                    records mil rahe hain. Product dropdown same sheet ke live values se
                    generate ho raha hai.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.7)] backdrop-blur sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
                  Vendor cards
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Filtered vendor results
                </h2>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                {filteredVendors.length} records
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/70"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {vendor.partyName || "Unnamed vendor"}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                          <MapPin className="h-3.5 w-3.5" />
                          {vendor.stateName || "State missing"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <UserRound className="h-3.5 w-3.5" />
                          {vendor.contactPerson || "Contact missing"}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-900 p-3 text-white">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-600">
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                      <span>{vendor.whatsappNumber || "Whatsapp not available"}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-400" />
                      <span>{vendor.gstNumber || "GST not available"}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <BadgeIndianRupee className="mt-0.5 h-4 w-4 text-slate-400" />
                      <span>{formatPurchaseDate(vendor.lastPurchaseDate)}</span>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs leading-6 text-slate-500">
                      {vendor.billingAddress || "Billing address missing"}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {getProductTags(vendor.productsTheySell).length > 0 ? (
                      getProductTags(vendor.productsTheySell).map((product) => (
                        <span
                          key={`${vendor.id}-${product}`}
                          className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                        >
                          {product}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Product missing
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredVendors.length === 0 && (
              <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <p className="text-sm text-slate-500">
                  Current party name aur product filter se koi vendor match nahi hua.
                </p>
              </div>
            )}
          </article>

          <article className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.7)] backdrop-blur sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-600">
                  Compact view
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  Vendor quick directory
                </h2>
              </div>
              <Package className="h-5 w-5 text-violet-600" />
            </div>

            <div className="mt-5 space-y-3">
              {filteredVendors.slice(0, 10).map((vendor) => (
                <div
                  key={`${vendor.id}-compact`}
                  className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {vendor.partyName || "Unnamed vendor"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {vendor.productsTheySell || "Product not specified"}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                      {vendor.stateName || "No state"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default VendorSearch;
