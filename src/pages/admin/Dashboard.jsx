import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Building2,
  FileBadge,
  FileText,
  Globe2,
  Layers3,
  MapPinned,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchVendorsCached, getProductTags } from "../../utils/vendorData";

const formatDateTime = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDate = (value) => {
  if (!value) return "No purchase date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        const { vendors: vendorRecords, updated } = await fetchVendorsCached();
        setVendors(vendorRecords);
        setLastUpdated(updated || "");
      } catch (fetchError) {
        console.error("Error fetching dashboard data:", fetchError);
        setError(fetchError.message || "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return vendors;

    return vendors.filter((vendor) =>
      [
        vendor.partyName,
        vendor.stateName,
        vendor.contactPerson,
        vendor.productsTheySell,
        vendor.gstNumber,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [searchText, vendors]);

  const insights = useMemo(() => {
    const stateCounts = {};
    const productCounts = {};

    vendors.forEach((vendor) => {
      if (vendor.stateName) {
        stateCounts[vendor.stateName] = (stateCounts[vendor.stateName] || 0) + 1;
      }

      getProductTags(vendor.productsTheySell).forEach((tag) => {
        productCounts[tag] = (productCounts[tag] || 0) + 1;
      });
    });

    const topStates = Object.entries(stateCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topProducts = Object.entries(productCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    return {
      totalVendors: vendors.length,
      activeContacts: vendors.filter((vendor) => vendor.whatsappNumber).length,
      gstReady: vendors.filter((vendor) => vendor.gstNumber).length,
      statesCovered: Object.keys(stateCounts).length,
      topStates,
      topProducts,
      missingProfiles: vendors.filter(
        (vendor) => !vendor.partyName || !vendor.contactPerson || !vendor.stateName
      ).length,
    };
  }, [vendors]);

  const headlineCards = [
    {
      label: "Vendor Records",
      value: insights.totalVendors,
      note: "Live synced operational base",
      icon: Building2,
      accent: "from-sky-500 to-blue-700",
      surface: "bg-sky-50",
    },
    {
      label: "States Covered",
      value: insights.statesCovered,
      note: "Regional business spread",
      icon: Globe2,
      accent: "from-emerald-500 to-teal-600",
      surface: "bg-emerald-50",
    },
    {
      label: "GST Available",
      value: insights.gstReady,
      note: "Tax-ready vendor profiles",
      icon: ShieldCheck,
      accent: "from-amber-500 to-orange-600",
      surface: "bg-amber-50",
    },
    {
      label: "Contactable",
      value: insights.activeContacts,
      note: "Whatsapp-enabled contacts",
      icon: PhoneCall,
      accent: "from-fuchsia-500 to-rose-600",
      surface: "bg-rose-50",
    },
  ];

  const quickActions = [
    {
      label: "Open Vendor Search",
      description: "Search by party or product name",
      icon: Search,
      action: () => navigate("/party-search"),
      style: "bg-white text-slate-900",
    },
    {
      label: "Generate SO",
      description: "Generate a professional SO document",
      icon: FileBadge,
      action: () => navigate("/sales-order"),
      style: "bg-cyan-400 text-slate-950",
    },
    {
      label: "Create Quotation",
      description: "Prepare a customer quotation document",
      icon: FileText,
      action: () => navigate("/quotation"),
      style: "bg-white/90 text-slate-900",
    },
    {
      label: "Vendor Search",
      description: "Open filtered vendor directory",
      icon: Search,
      action: () => navigate("/party-search"),
      style: "bg-slate-900 text-white border border-white/10",
    },
    {
      label: "Purchase Order",
      description: "Prepare vendor purchase order document",
      icon: FileText,
      action: () => navigate("/purchase-order"),
      style: "bg-white text-slate-900",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-72 animate-pulse rounded-[2rem] bg-slate-900/90" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-[1.75rem] bg-white shadow-sm"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <div className="h-[32rem] animate-pulse rounded-[2rem] bg-white shadow-sm" />
            <div className="h-[32rem] animate-pulse rounded-[2rem] bg-white shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-2xl rounded-[2rem] border border-red-100 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard load failed</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Retry dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_35%,_#cffafe_75%,_#ffffff_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#020617,#0f172a_35%,#155e75_70%,#0891b2_100%)] px-6 py-7 text-white shadow-[0_30px_90px_-35px_rgba(8,145,178,0.7)] sm:px-8 sm:py-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.22),transparent_22%),radial-gradient(circle_at_70%_75%,rgba(125,211,252,0.18),transparent_24%)]" />

          <div className="relative z-10 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
                <Sparkles className="h-4 w-4" />
                Advanced dashboard
              </div>

              <div className="max-w-3xl space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                  Vendor operations ka smarter, sharper aur zyada premium control room.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                  Live Vendor sheet ko metrics, coverage, product mix, searchable insights
                  aur quick action modules me convert kiya gaya hai, taaki dashboard
                  sirf summary na lage, actual command center feel de.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {quickActions.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`group inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 ${item.style}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>
                      {item.label}
                      <span className="block text-xs font-medium opacity-70">
                        {item.description}
                      </span>
                    </span>
                    <ArrowRight className="ml-1 h-4 w-4 opacity-70 transition group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">
                      Sync status
                    </p>
                    <p className="mt-2 text-3xl font-semibold">{insights.totalVendors}</p>
                    <p className="mt-1 text-sm text-slate-200">records currently usable</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Activity className="h-5 w-5 text-cyan-100" />
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-slate-950/25 p-4">
                  <p className="text-sm text-slate-200">Last sync</p>
                  <p className="mt-2 text-lg font-semibold">{formatDateTime(lastUpdated)}</p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">
                    Quick search
                  </p>
                  <Search className="h-4 w-4 text-cyan-100" />
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-slate-900">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search party, state, contact, product..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-xs text-cyan-100">Matching</p>
                    <p className="mt-1 text-2xl font-semibold">{filteredVendors.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-xs text-cyan-100">Missing profiles</p>
                    <p className="mt-1 text-2xl font-semibold">{insights.missingProfiles}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {headlineCards.map((card) => (
            <article
              key={card.label}
              className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.7)] backdrop-blur"
            >
              <div className={`absolute right-0 top-0 h-24 w-24 rounded-bl-[2rem] bg-gradient-to-br ${card.accent} opacity-10`} />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{card.note}</p>
                </div>
                <div className={`rounded-2xl p-3 ${card.surface}`}>
                  <card.icon className="h-6 w-6 text-slate-900" />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.75fr]">
          <article className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.7)] backdrop-blur sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
                  Command board
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  High-signal vendor overview
                </h2>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                {filteredVendors.length} visible
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredVendors.slice(0, 6).map((vendor) => (
                <div
                  key={vendor.id}
                  className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {vendor.partyName || "Unnamed vendor"}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          <MapPinned className="h-3.5 w-3.5" />
                          {vendor.stateName || "State missing"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                          <UserRound className="h-3.5 w-3.5" />
                          {vendor.contactPerson || "Contact missing"}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-950 p-3 text-white">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Product mix
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {getProductTags(vendor.productsTheySell).length > 0 ? (
                          getProductTags(vendor.productsTheySell).map((product) => (
                            <span
                              key={`${vendor.id}-${product}`}
                              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                            >
                              {product}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                            Product data missing
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Whatsapp</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {vendor.whatsappNumber || "N/A"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Last Purchase</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {formatDate(vendor.lastPurchaseDate)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Billing address
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {vendor.billingAddress || "Billing address missing"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="space-y-6">
            <article className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.7)] backdrop-blur sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                    State intensity
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    Top locations
                  </h2>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>

              <div className="mt-5 space-y-4">
                {insights.topStates.map((state) => {
                  const width = insights.totalVendors
                    ? Math.max((state.count / insights.totalVendors) * 100, 12)
                    : 0;

                  return (
                    <div key={state.name}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700">{state.name}</span>
                        <span className="text-slate-500">{state.count}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#10b981,#06b6d4)]"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.7)] backdrop-blur sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-600">
                    Product matrix
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    Top products
                  </h2>
                </div>
                <Layers3 className="h-5 w-5 text-violet-600" />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {insights.topProducts.map((product) => (
                  <div
                    key={product.name}
                    className="rounded-2xl bg-violet-50 px-4 py-3 text-sm"
                  >
                    <p className="font-semibold text-violet-900">{product.name}</p>
                    <p className="text-violet-700">{product.count} profiles</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
