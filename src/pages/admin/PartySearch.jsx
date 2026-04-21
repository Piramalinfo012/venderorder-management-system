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
  Plus,
  ChevronDown,
  Save,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2
} from "lucide-react";
import { fetchVendorsCached, getProductTags } from "../../utils/vendorData";
import { motion, AnimatePresence } from "framer-motion";

// Configuration for POST request
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyn7g_Mt7zSTjTmukJhpKWokUCZNFb0l6g-bwd5jgUZLpbTBq-f4LviMjBBQlM85XeX/exec";

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

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const slideInRight = {
  hidden: { opacity: 0, x: "100%" },
  visible: { opacity: 1, x: 0, transition: { type: "spring", damping: 30, stiffness: 300 } },
  exit: { opacity: 0, x: "100%", transition: { duration: 0.2 } }
};


const VendorSearch = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partyFilter, setPartyFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // New Vendor Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [editingVendor, setEditingVendor] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    "Party Name": "",
    "State Name": "",
    "Billing address": "",
    "Gst Number": "",
    "Contact Person": "",
    "Whatsapp Number Contact Person": "",
    "Products They Sell": "",
    "Last Purchase Date": "",
    "Payment Term": "",
    "Credit Litmit": "",
    "ID": ""
  });

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

  useEffect(() => {
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

  const handleCreateNew = () => {
    setEditingVendor(null);
    setFormData({
      "Party Name": "", "State Name": "", "Billing address": "", "Gst Number": "",
      "Contact Person": "", "Whatsapp Number Contact Person": "", "Products They Sell": "",
      "Last Purchase Date": "", "Payment Term": "", "Credit Litmit": "", "ID": ""
    });
    setSubmitStatus(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      "Party Name": vendor.partyName || "",
      "State Name": vendor.stateName || "",
      "Billing address": vendor.billingAddress || "",
      "Gst Number": vendor.gstNumber || "",
      "Contact Person": vendor.contactPerson || "",
      "Whatsapp Number Contact Person": vendor.whatsappNumber || "",
      "Products They Sell": vendor.productsTheySell || "",
      "Last Purchase Date": vendor.lastPurchaseDate || "",
      "Payment Term": vendor.paymentTerm || "",
      "Credit Litmit": vendor.creditLitmit || "",
      "ID": vendor.documentId || vendor.id || ""
    });
    setSubmitStatus(null);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (vendor) => {
    if (!window.confirm(`Are you sure you want to delete ${vendor.partyName || "this vendor"}?`)) return;
    setDeletingId(vendor.id);
    try {
      const payload = new FormData();
      payload.append("action", "delete");
      payload.append("sheetName", "Vendor");
      payload.append("rowIndex", vendor.rowIndex);

      await fetch(SCRIPT_URL, { method: "POST", body: payload, mode: "no-cors" });
      
      setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
      sessionStorage.removeItem("vendor-rate-tracking:vendors");
    } catch (err) {
      console.error(err);
      alert("Failed to delete vendor");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      // Maps to the exact column order in the Google Sheet:
      // Party Name, State Name, Billing address, Gst Number, Contact Person, Whatsapp Number, Products They Sell, Last Purchase Date, Payment Term, Credit Litmit, ID
      const rowDataArray = [
        formData["Party Name"] || "",
        formData["State Name"] || "",
        formData["Billing address"] || "",
        formData["Gst Number"] || "",
        formData["Contact Person"] || "",
        formData["Whatsapp Number Contact Person"] || "",
        formData["Products They Sell"] || "",
        formData["Last Purchase Date"] || "",
        formData["Payment Term"] || "",
        formData["Credit Litmit"] || "",
        formData["ID"] || new Date().getTime().toString()
      ];

      const formPayload = new FormData();
      formPayload.append("action", editingVendor ? "update" : "insert");
      formPayload.append("sheetName", "Vendor");
      formPayload.append("rowData", JSON.stringify(rowDataArray));
      if (editingVendor) {
        formPayload.append("rowIndex", editingVendor.rowIndex);
      }

      await fetch(SCRIPT_URL, {
        method: "POST",
        body: formPayload,
        mode: "no-cors" // Prevent CORS preflight errors while submitting FormData
      });

      setSubmitStatus("success");
      // Reset form
      setFormData({
        "Party Name": "", "State Name": "", "Billing address": "", "Gst Number": "",
        "Contact Person": "", "Whatsapp Number Contact Person": "", "Products They Sell": "",
        "Last Purchase Date": "", "Payment Term": "", "Credit Litmit": "", "ID": ""
      });

      // Optionally refresh vendor list locally to remove stale cache
      sessionStorage.removeItem("vendor-rate-tracking:vendors");
      setTimeout(() => {
        setIsAddModalOpen(false);
        setSubmitStatus(null);
        fetchVendors();
      }, 1500);

    } catch (err) {
      console.error(err);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading && vendors.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600 mb-4" />
        <span className="text-sm font-bold uppercase tracking-widest text-slate-500">
          Loading Directory
        </span>
      </div>
    );
  }

  if (error && vendors.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7f9] px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-[2rem] border border-red-100 bg-white p-10 text-center shadow-xl">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Load Failed</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-8 w-full rounded-2xl bg-slate-900 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 hover:-translate-y-1">
            Reinitialize System
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="min-h-screen relative bg-[#f4f7f9] px-4 py-8 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Dynamic Header Section */}
        <motion.section variants={fadeInUp} className="relative overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#020617,#0f172a_30%,#0e7490_100%)] text-white shadow-2xl shadow-sky-900/10">
           {/* Animated Orbs Background */}
           <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }} className="absolute -right-[10%] -top-[40%] h-[800px] w-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
          </div>

          <div className="relative z-10 grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_0.6fr]">
            {/* Title & Stats */}
            <div className="space-y-8">
              <div className="space-y-3">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-sky-200 backdrop-blur-sm">
                  <UserRound className="h-4 w-4" /> Global Directory
                </motion.div>
                <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-cyan-200">
                  Vendor Search
                </h1>
                <p className="max-w-xl text-sky-100/70 text-base sm:text-lg leading-relaxed font-light">
                  Instantly locate vendor records using smart queries. Connect, verify, and monitor the complete supply chain network.
                </p>
              </div>

              {/* Stats Grid (Mobile Responsive) */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Providers", val: metrics.totalVendors },
                  { label: "Matches", val: metrics.matchingResults },
                  { label: "States", val: metrics.statesCovered },
                  { label: "Products", val: metrics.productsCovered },
                ].map((stat, i) => (
                  <motion.div key={stat.label} custom={i} variants={fadeInUp} className="group flex flex-col justify-center rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/80">{stat.label}</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-black tabular-nums">{stat.val}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Insights / Add New Vendor Panel */}
            <div className="flex flex-col gap-4 justify-between h-full">
               <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateNew}
                  className="group relative flex w-full justify-center md:justify-between items-center rounded-[1.5rem] bg-gradient-to-br from-cyan-400 to-sky-600 p-5 shadow-lg shadow-cyan-900/40 transition-all hover:shadow-cyan-900/60"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-black tracking-wide text-white">Add Vendor</p>
                      <p className="text-xs font-semibold text-cyan-50">Onboard to master sheet</p>
                    </div>
                  </div>
              </motion.button>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md hidden sm:block">
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">Insight Radar</p>
                <p className="mt-3 text-sm leading-relaxed text-sky-100/80">
                  Your search filters are currently targeting <span className="font-bold text-white">{filteredVendors.length}</span> verified profiles. Dropdowns actively reflect the live dataset available in the network.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Mobile Filters Toggle Button */}
        <div className="sm:hidden -mb-4">
           <button 
             onClick={() => setMobileFiltersOpen((prev) => !prev)}
             className="flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-500" />
                <span className="font-bold text-slate-800">Search & Filter</span>
              </div>
              <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
           </button>
        </div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr] xl:grid-cols-[1fr_350px]">
          
          {/* Main Content List */}
          <motion.div variants={fadeInUp} className="flex flex-col gap-6">
            
            {/* Intelligent Filter Bar (Visible natively on LG, conditionally on Mobile) */}
            <AnimatePresence>
              {(mobileFiltersOpen || window.innerWidth >= 640) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  className="rounded-[2rem] border-2 border-slate-200 bg-white p-4 sm:p-5 shadow-lg shadow-slate-200/50 backdrop-blur-xl"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={partyFilter}
                        onChange={(e) => setPartyFilter(e.target.value)}
                        placeholder="Search party, focus, or region..."
                        className="h-14 w-full rounded-2xl border border-slate-300 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 placeholder:font-medium focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select
                          value={productFilter}
                          onChange={(e) => setProductFilter(e.target.value)}
                          className="h-14 w-full appearance-none rounded-2xl border border-slate-300 bg-slate-50 pl-5 pr-10 text-sm font-semibold text-slate-800 outline-none transition-all focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 cursor-pointer"
                        >
                          <option value="">All Commodities</option>
                          {productOptions.map((product) => (
                            <option key={product} value={product}>
                              {product}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      {(partyFilter || productFilter) && (
                        <button
                          onClick={clearFilters}
                          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition-colors hover:bg-rose-100"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Vendor List */}
            <div className="space-y-4">
              <AnimatePresence>
                {filteredVendors.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/50 px-6 py-20 text-center">
                    <Search className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-lg font-bold text-slate-900">Zero Matches Found</p>
                    <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm">No vendors match your specific combination of filters. Try reducing the restrictions.</p>
                  </motion.div>
                ) : (
                  filteredVendors.map((vendor, position) => (
                    <motion.article
                      key={vendor.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: position > 10 ? 0 : position * 0.05 }}
                      className="group relative overflow-hidden rounded-[1.25rem] sm:rounded-[2rem] border-2 border-slate-200 bg-white p-4 sm:p-7 shadow-md transition-all hover:border-sky-300 hover:shadow-2xl hover:shadow-sky-200 hover:-translate-y-1"
                    >
                      <div className="absolute top-0 right-0 h-32 w-32 -translate-y-10 translate-x-10 rounded-full bg-slate-50 transition-colors group-hover:bg-sky-50/50" />
                      
                      {/* Action Overlays */}
                      <div className="absolute top-4 right-4 z-20 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(vendor)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-md border border-slate-100 transition-transform hover:scale-110">
                           <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(vendor)} disabled={deletingId === vendor.id} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-500 shadow-md border border-slate-100 transition-transform hover:scale-110 disabled:opacity-50">
                           {deletingId === vendor.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="relative z-10 grid gap-4 sm:gap-6 sm:grid-cols-[1fr_auto]">
                        {/* Primary Info */}
                        <div className="space-y-3 sm:space-y-5">
                          <div className="flex flex-wrap items-start gap-4">
                            <div className="flex items-center justify-center h-12 w-12 rounded-[1.2rem] bg-gradient-to-br from-slate-800 to-slate-950 text-white shadow-lg">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{vendor.partyName || "Unnamed Vendor"}</h3>
                                <div className="mt-1.5 flex flex-wrap gap-2">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                    <MapPin className="h-3 w-3" /> {vendor.stateName || "Location TBA"}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                                    <UserRound className="h-3 w-3" /> {vendor.contactPerson || "Contact TBA"}
                                  </span>
                                </div>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                              <Phone className="h-5 w-5 text-sky-500 shrink-0" />
                              <span className="font-semibold text-slate-700 truncate">{vendor.whatsappNumber || "No Phone"}</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                              <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0" />
                              <span className="font-semibold text-slate-700 truncate">{vendor.gstNumber || "No GST ID"}</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2 lg:col-span-1">
                              <BadgeIndianRupee className="h-5 w-5 text-emerald-500 shrink-0" />
                              <span className="font-semibold text-slate-700 truncate">{formatPurchaseDate(vendor.lastPurchaseDate)}</span>
                            </div>
                          </div>

                          {vendor.billingAddress && (
                            <p className="text-[13px] leading-relaxed font-medium text-slate-500 pl-1 border-l-2 border-slate-200 ml-1">
                              {vendor.billingAddress}
                            </p>
                          )}
                        </div>

                        {/* Product Tags */}
                        <div className="sm:border-l sm:border-slate-100 sm:pl-6 min-w-[200px]">
                           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Commodities Segment</p>
                           <div className="flex flex-wrap gap-2">
                              {getProductTags(vendor.productsTheySell).length > 0 ? (
                                getProductTags(vendor.productsTheySell).map((product) => (
                                  <span key={`${vendor.id}-${product}`} className="rounded-[0.8rem] border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800 shadow-sm">
                                    {product}
                                  </span>
                                ))
                              ) : (
                                <span className="rounded-[0.8rem] bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">Unspecified</span>
                              )}
                           </div>
                        </div>
                      </div>
                    </motion.article>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Compact View Side Panel */}
          <motion.div variants={fadeInUp} className="hidden sm:flex flex-col gap-5 h-max rounded-[2.5rem] border border-white/60 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-500">Compact List</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">Directory Overview</h2>
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2 max-h-[600px] custom-scroll">
              {filteredVendors.slice(0, 15).map((vendor) => (
                <div key={`${vendor.id}-compact`} className="group rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100/70">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2 text-sm font-black text-slate-900">
                      <span className="line-clamp-1 group-hover:text-violet-700 transition-colors">{vendor.partyName || "Unnamed Vendor"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-500 truncate max-w-[140px]">{vendor.productsTheySell || "..."}</span>
                        <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm shrink-0">
                          {vendor.stateName || "N/A"}
                        </span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredVendors.length > 15 && (
                <div className="pt-2 text-center text-xs font-bold text-slate-400">
                  + {filteredVendors.length - 15} more hidden
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Add Vendor Slide-in Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsAddModalOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              variants={slideInRight}
              initial="hidden" animate="visible" exit="exit"
              className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{editingVendor ? "Edit Vendor Details" : "New Vendor Onboarding"}</h2>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sync directly to Master Sheet</p>
                </div>
                <button 
                  onClick={() => !isSubmitting && setIsAddModalOpen(false)}
                  className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-6 custom-scroll">
                <form id="new-vendor-form" onSubmit={handleFormSubmit} className="space-y-5 shadow-none pb-20">
                  
                  {submitStatus === "success" && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 mb-6">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-800">Vendor securely stored to master sheet!</p>
                    </motion.div>
                  )}
                  {submitStatus === "error" && (
                     <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 mb-6">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <p className="text-sm font-semibold text-red-800">Failed to store vendor. Please try again or verify endpoint.</p>
                    </motion.div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Party Name *</label>
                      <input required name="Party Name" value={formData["Party Name"]} onChange={handleFormChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10" placeholder="E.g., Global Traders" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">State Name</label>
                      <input name="State Name" value={formData["State Name"]} onChange={handleFormChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10" placeholder="E.g., Maharashtra" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">GST Number</label>
                      <input name="Gst Number" value={formData["Gst Number"]} onChange={handleFormChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10" placeholder="27XXXX..." />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Billing Address</label>
                      <textarea name="Billing address" value={formData["Billing address"]} onChange={handleFormChange} rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10" placeholder="Full registered address" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Contact Person</label>
                      <input name="Contact Person" value={formData["Contact Person"]} onChange={handleFormChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10" placeholder="Primary contact name" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Whatsapp Number</label>
                      <input name="Whatsapp Number Contact Person" value={formData["Whatsapp Number Contact Person"]} onChange={handleFormChange} type="tel" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10" placeholder="10-digit number" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Products They Sell</label>
                      <input name="Products They Sell" value={formData["Products They Sell"]} onChange={handleFormChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10" placeholder="E.g., 10PPM, MHO, LDO (comma separated)" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Payment Term</label>
                      <input name="Payment Term" value={formData["Payment Term"]} onChange={handleFormChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10" placeholder="E.g., Advance, 15 days" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Credit Limit</label>
                      <input name="Credit Litmit" value={formData["Credit Litmit"]} onChange={handleFormChange} type="number" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10" placeholder="Amount if applicable" />
                    </div>
                  </div>
                </form>
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 shrink-0 box-border">
                <button
                  type="submit"
                  form="new-vendor-form"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-sky-500 to-cyan-500 py-4 text-sm font-black text-white shadow-lg shadow-sky-500/30 transition-transform active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  {isSubmitting ? "Syncing..." : (editingVendor ? "Update Vendor Data" : "Save Vendor to Sheet")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default VendorSearch;
