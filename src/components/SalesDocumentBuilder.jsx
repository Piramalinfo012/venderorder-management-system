import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Printer,
  Save,
  ChevronLeft,
  Building2,
  FileText,
  Info,
  Package,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchVendorsCached } from "../utils/vendorData";

const currencySymbol = "\u20B9";

const SalesDocumentBuilder = ({
  pageTitle,
  pageCode,
  documentLabel,
  documentNumberPrefix,
  saveLabel,
  footerLabel,
  noteTemplate,
}) => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentNumber, setDocumentNumber] = useState(
    `${documentNumberPrefix}-${Math.floor(Math.random() * 90000) + 10000}`
  );
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split("T")[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [items, setItems] = useState([{ id: 1, description: "", quantity: 1, rate: 0, total: 0 }]);
  const [gstRate, setGstRate] = useState(18);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoading(true);
        const { vendors: vendorRecords } = await fetchVendorsCached();

        setVendors(
          vendorRecords.map((vendor) => ({
            id: vendor.id,
            name: vendor.partyName,
            address: vendor.billingAddress,
            gst: vendor.gstNumber,
            contactPerson: vendor.contactPerson,
            contact: vendor.whatsappNumber,
            product: vendor.productsTheySell,
          }))
        );
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVendors();
  }, []);

  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
    setItems([...items, { id: newId, description: "", quantity: 1, rate: 0, total: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          updatedItem.total = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      })
    );
  };

  const calculateSubtotal = () => items.reduce((sum, item) => sum + item.total, 0);
  const calculateGST = () => (calculateSubtotal() * gstRate) / 100;
  const calculateTotal = () => calculateSubtotal() + calculateGST();

  const handleSave = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">{pageTitle}</h1>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                {pageCode}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e40af] text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              {showSuccess ? <Check size={18} /> : <Save size={18} />}
              {showSuccess ? "Saved!" : saveLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Vendor Details</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Select Vendor
                </label>
                <select
                  disabled={loading}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-60"
                  onChange={(event) => {
                    const vendor = vendors.find((item) => item.name === event.target.value);
                    setSelectedVendor(vendor || null);
                  }}
                  value={selectedVendor?.name || ""}
                >
                  <option value="">
                    {loading ? "Loading vendor accounts..." : "Select a vendor account..."}
                  </option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.name}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedVendor && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex items-start gap-3">
                    <Info size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-800 tracking-tight">
                        {selectedVendor.name}
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed mt-1">
                        {selectedVendor.address}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 border-t border-gray-200/50 pt-3 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        GST Number
                      </p>
                      <p className="text-xs font-bold text-blue-600">{selectedVendor.gst || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Contact Person
                      </p>
                      <p className="text-xs font-bold text-gray-700">
                        {selectedVendor.contactPerson || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Whatsapp
                      </p>
                      <p className="text-xs font-bold text-gray-700">
                        {selectedVendor.contact || "N/A"}
                      </p>
                    </div>
                  </div>
                  {selectedVendor.product && (
                    <div className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-emerald-700 border border-emerald-100">
                      Product Line: {selectedVendor.product}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <FileText size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{documentLabel} Info</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {documentLabel} Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">#</span>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(event) => setDocumentNumber(event.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {documentLabel} Date
                </label>
                <input
                  type="date"
                  value={documentDate}
                  onChange={(event) => setDocumentDate(event.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Client Reference / PO No.
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(event) => setReferenceNumber(event.target.value)}
                  placeholder="Enter client reference, PO number or internal note..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Package size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Line Items</h2>
            </div>
            <button
              onClick={addItem}
              className="flex items-center gap-2 text-[#1e40af] bg-white border border-blue-100 px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-50 transition-all shadow-sm no-print"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] uppercase tracking-widest font-black text-gray-400 border-b border-gray-100">
                  <th className="px-8 py-4">Item Description</th>
                  <th className="px-4 py-4 w-24 text-center">Qty</th>
                  <th className="px-4 py-4 w-32 text-center">Rate</th>
                  <th className="px-5 py-4 w-32 text-right">Amount</th>
                  <th className="px-8 py-4 w-16 no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                    <td className="px-8 py-4">
                      <input
                        type="text"
                        placeholder="Description of item..."
                        className="w-full bg-transparent text-sm font-semibold text-gray-700 outline-none focus:text-blue-600"
                        value={item.description}
                        onChange={(event) => updateItem(item.id, "description", event.target.value)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        className="w-full bg-transparent text-center text-sm font-bold text-gray-700 outline-none"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(item.id, "quantity", parseFloat(event.target.value) || 0)
                        }
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center gap-1 justify-center bg-gray-50 rounded-lg py-1 px-2 group-hover:bg-white border border-transparent group-hover:border-blue-100 transition-all">
                        <span className="text-[10px] text-gray-400">{currencySymbol}</span>
                        <input
                          type="number"
                          className="w-full max-w-[80px] bg-transparent text-center text-sm font-bold text-gray-700 outline-none"
                          value={item.rate}
                          onChange={(event) =>
                            updateItem(item.id, "rate", parseFloat(event.target.value) || 0)
                          }
                        />
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {currencySymbol}
                        {item.total.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-4 no-print">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all transform hover:scale-110"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-8 bg-gray-50/50 flex flex-col items-end space-y-4">
            <div className="w-full sm:w-72 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-semibold tracking-wide uppercase text-[10px]">
                  Subtotal
                </span>
                <span className="font-bold text-gray-900 tracking-tight">
                  {currencySymbol}
                  {calculateSubtotal().toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-semibold tracking-wide uppercase text-[10px]">
                    GST
                  </span>
                  <select
                    className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-blue-600 outline-none no-print"
                    value={gstRate}
                    onChange={(event) => setGstRate(parseInt(event.target.value, 10))}
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <span className="font-bold text-gray-900 tracking-tight">
                  {currencySymbol}
                  {calculateGST().toLocaleString()}
                </span>
              </div>
              <div className="h-px bg-gray-200 w-full my-2" />
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-black tracking-widest uppercase text-xs">
                  Total Amount
                </span>
                <span className="text-xl font-black text-[#1e40af] tracking-tighter">
                  {currencySymbol}
                  {calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">
              <Info size={14} /> Notes / Terms
            </div>
            <textarea
              placeholder="Enter payment terms, delivery notes, etc."
              className="w-full bg-white border border-gray-200 rounded-3xl p-6 text-sm text-gray-600 min-h-[120px] outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              defaultValue={noteTemplate}
            />
          </div>
          <div className="flex flex-col justify-end items-center sm:items-end space-y-8 pb-4">
            <div className="h-20 w-48 border-b-2 border-gray-200 relative flex items-center justify-center">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] absolute -bottom-6">
                Authorized Signatory
              </span>
              <img
                src="/PPPL.png"
                className="opacity-20 max-h-12 object-contain filter grayscale"
                alt="Stamp"
              />
            </div>
            <p className="text-[10px] text-gray-400 text-center sm:text-right font-medium leading-relaxed">
              {footerLabel} <br />
              Generated through <strong>Vendor Rate Tracking System</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDocumentBuilder;
