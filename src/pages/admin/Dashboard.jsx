import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, Building2, FileText, Globe2, Layers3,
  MapPinned, PhoneCall, Search, ShieldCheck, TrendingUp, Package, Map
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchVendorsCached, getProductTags } from "../../utils/vendorData";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Filler, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend
);

const formatDateTime = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
};

// High-end animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");

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
      .slice(0, 7) // Extended limit for better chart visualization
      .map(([name, count]) => ({ name, count }));

    const topProducts = Object.entries(productCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    return {
      totalVendors: vendors.length,
      activeContacts: vendors.filter((vendor) => vendor.whatsappNumber).length,
      gstReady: vendors.filter((vendor) => vendor.gstNumber).length,
      statesCovered: Object.keys(stateCounts).length,
      topStates,
      topProducts,
    };
  }, [vendors]);

  const headlineCards = [
    {
      label: "Vendor Records",
      value: insights.totalVendors,
      note: "Live synced operational base",
      icon: Building2,
      from: "from-indigo-500", to: "to-purple-600", shadow: "shadow-indigo-500/30"
    },
    {
      label: "States Covered",
      value: insights.statesCovered,
      note: "Regional business spread",
      icon: Globe2,
      from: "from-emerald-400", to: "to-teal-600", shadow: "shadow-emerald-500/30"
    },
    {
      label: "GST Available",
      value: insights.gstReady,
      note: "Tax-ready vendor profiles",
      icon: ShieldCheck,
      from: "from-amber-400", to: "to-orange-500", shadow: "shadow-orange-500/30"
    },
    {
      label: "Contactable",
      value: insights.activeContacts,
      note: "Whatsapp-enabled contacts",
      icon: PhoneCall,
      from: "from-pink-500", to: "to-rose-600", shadow: "shadow-rose-500/30"
    },
  ];

  const quickActions = [
    {
      label: "Vendor Directory", description: "Search and filter parties", icon: Search,
      action: () => navigate("/party-search"),
      style: "bg-white text-slate-900 border-transparent shadow-xl",
    },
    {
      label: "Quotations", description: "Manage sales quotations", icon: FileText,
      action: () => navigate("/quotation"),
      style: "bg-cyan-900/40 text-white border border-cyan-500/30 hover:bg-cyan-800/60 shadow-lg backdrop-blur",
    },
    {
      label: "Purchase Orders", description: "Manage vendor POs", icon: Package,
      action: () => navigate("/purchase-order"),
      style: "bg-cyan-900/40 text-white border border-cyan-500/30 hover:bg-cyan-800/60 shadow-lg backdrop-blur",
    },
  ];

  // Chart Configuration
  const chartData = {
    labels: insights.topStates.map(s => s.name),
    datasets: [
      {
        fill: true,
        label: 'Vendor Reach',
        data: insights.topStates.map(s => s.count),
        borderColor: '#0284c7', // Sky 600
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(56, 189, 248, 0.6)'); // Sky 400 with opacity
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
          return gradient;
        },
        borderWidth: 3,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#0284c7',
        pointHoverBackgroundColor: '#0369a1', // Sky 700
        pointHoverBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.4 // Smooth splines for beautiful rendering
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        titleColor: '#e0f2fe',
        bodyColor: '#ffffff',
        titleFont: { size: 14, family: "'Inter', sans-serif", weight: 'bold' },
        bodyFont: { size: 14, family: "'Inter', sans-serif" },
        padding: 14,
        cornerRadius: 16,
        displayColors: false,
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.2)'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(241, 245, 249, 0.6)', drawBorder: false },
        ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif", size: 11 }, padding: 10 }
      },
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 11, weight: '500' }, padding: 10 }
      }
    },
    interaction: { intersect: false, mode: 'index' },
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-6">
        <div className="h-[400px] animate-pulse rounded-[2.5rem] bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-[2.5rem] bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl rounded-[2.5rem] border border-red-100 bg-white p-10 text-center shadow-2xl shadow-red-100">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard load failed</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 hover:-translate-y-1">
            Retry dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="min-h-screen bg-[#f4f7f9] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Dynamic Hero Section */}
        <motion.section variants={scaleIn} className="relative overflow-hidden rounded-[3rem] bg-[linear-gradient(135deg,#020617,#0f172a_40%,#0369a1_100%)] p-8 text-white shadow-2xl shadow-sky-900/10 sm:p-12">
          {/* Animated Background Elements */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }} className="absolute -right-[20%] -top-[50%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.1)_0%,transparent_60%)]" />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 200, repeat: Infinity, ease: "linear" }} className="absolute -bottom-[50%] -left-[20%] h-[800px] w-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.1)_0%,transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
          </div>

          <div className="relative z-10 grid gap-10 xl:grid-cols-[1fr_350px]">
            <div className="flex flex-col justify-center space-y-10">
              <div className="space-y-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-sky-200 backdrop-blur-sm">
                  <Activity className="h-4 w-4" /> Live System Command
                </motion.div>
                <h1 className="text-5xl font-black tracking-tight sm:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-sky-300">
                  Global Dashboard
                </h1>
                <p className="max-w-xl text-lg text-sky-100/70 leading-relaxed font-light">
                  Seamlessly orchestrate your vendor directory, generate stunning quotations, and manage dynamic purchase orders all from one powerful command center.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {quickActions.map((item, idx) => (
                  <motion.button custom={idx} variants={fadeInUp} whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.98 }} key={item.label} onClick={item.action} className={`group relative flex items-center gap-4 rounded-2xl p-4 transition-all duration-300 ${item.style}`}>
                    <div className="rounded-xl bg-black/10 p-2.5 backdrop-blur-md">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="text-left pr-4">
                      <p className="text-[15px] font-bold tracking-wide">{item.label}</p>
                      <p className="mt-1 text-xs font-medium opacity-70">{item.description}</p>
                    </div>
                    <ArrowRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.div variants={fadeInUp} className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl transition hover:bg-white/10">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl transition duration-500 group-hover:bg-sky-400/30" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Network Pulse</p>
                  <p className="mt-6 text-7xl font-black tabular-nums text-white drop-shadow-sm">{insights.totalVendors}</p>
                  <p className="mt-2 text-sm font-medium text-sky-100/70">total synced records</p>
                </div>
                <div className="mt-10 rounded-2xl bg-black/20 p-5 backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-2 text-sky-200">
                    <Activity className="h-4 w-4" />
                    <p className="text-xs font-bold uppercase tracking-wider">Last Sync</p>
                  </div>
                  <p className="text-sm font-medium text-white">{formatDateTime(lastUpdated)}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Ultra-Premium Stats Grid */}
        <motion.section variants={staggerContainer} className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {headlineCards.map((card) => (
            <motion.article key={card.label} variants={fadeInUp} whileHover={{ y: -8, scale: 1.02 }} className="group relative overflow-hidden rounded-[2.5rem] bg-white p-[1px] shadow-sm transition-all duration-500 hover:shadow-2xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.from} ${card.to} opacity-10 transition-opacity duration-500 group-hover:opacity-20`} />
              <div className="relative h-full overflow-hidden rounded-[2.4rem] bg-white p-7 backdrop-blur-3xl">
                <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${card.from} ${card.to} opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-40`} />
                <div className="relative z-10 flex h-full flex-col justify-between">
                  {/* Card Icon & Label */}
                  <div className="flex flex-col gap-2">
                    <div className={`self-start rounded-[1.25rem] bg-gradient-to-br ${card.from} ${card.to} p-4 text-white shadow-lg ${card.shadow}`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-8">
                    <p className="text-5xl font-black tracking-tight text-slate-800 tabular-nums">
                      {card.value}
                    </p>
                    <p className="mt-3 text-[15px] font-bold text-slate-400 uppercase tracking-widest">
                      {card.label}
                    </p>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.section>

        {/* Beautiful Charts Layout */}
        <motion.section variants={staggerContainer} className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          
          {/* Geograhic Area Covered Chart */}
          <motion.article variants={fadeInUp} className="group flex flex-col rounded-[2.5rem] border border-white/60 bg-white p-8 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-500">
                  Area Covered
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  Geographic Footprint
                </h2>
              </div>
              <div className="rounded-full bg-sky-50 p-4 transition-transform group-hover:scale-110 group-hover:bg-sky-100">
                <Map className="h-6 w-6 text-sky-600" />
              </div>
            </div>
            <div className="mt-8 flex-1 h-72">
              <Line data={chartData} options={chartOptions} />
            </div>
          </motion.article>

          {/* Top Products Grid */}
          <motion.article variants={fadeInUp} className="flex flex-col rounded-[2.5rem] border border-white/60 bg-white p-8 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-500">
                  Product Matrix
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  Trending Categories
                </h2>
              </div>
              <div className="rounded-full bg-violet-50 p-4 transition-transform hover:scale-110 hover:bg-violet-100">
                <Layers3 className="h-6 w-6 text-violet-600" />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-max overflow-y-auto pr-2" style={{ maxHeight: '288px' }}>
              {insights.topProducts.map((product, index) => (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} key={product.name} className="group relative overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-violet-50/50 to-white border border-violet-100/60 p-5 transition-all hover:border-violet-300 hover:shadow-lg hover:shadow-violet-200/40 hover:-translate-y-1">
                  <div className="absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full bg-violet-200 opacity-20 blur-xl transition-all group-hover:scale-150 group-hover:bg-violet-300" />
                  <p className="relative z-10 text-[17px] font-black tracking-tight text-violet-950 line-clamp-1">
                    {product.name}
                  </p>
                  <p className="relative z-10 mt-2 flex items-center gap-2 text-sm font-bold text-violet-600/70">
                    <span className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                    {product.count} vendor matches
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.article>

        </motion.section>
      </div>
    </motion.div>
  );
};

export default Dashboard;
