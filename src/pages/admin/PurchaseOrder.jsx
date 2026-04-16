import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Loader2,
  Plus,
  Printer,
  Save,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchVendorsCached } from "../../utils/vendorData";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyn7g_Mt7zSTjTmukJhpKWokUCZNFb0l6g-bwd5jgUZLpbTBq-f4LviMjBBQlM85XeX/exec";

const initialItem = {
  id: 1,
  productName: "",
  unit: "Ltr",
  price: "",
  freight: "",
  delivered: "",
  payment: "",
  rateValidity: "",
};

const PurchaseOrder = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [showSaved, setShowSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    orderNo: `PPPL/${new Date().getFullYear().toString().slice(-2)}-${(
      new Date().getFullYear() +
      1
    )
      .toString()
      .slice(-2)}/${Math.floor(Math.random() * 9000) + 1000}`,
    partyName: "",
    address: "",
    kindlyAttn: "",
    contactNo: "",
    pdfEditUrl: "",
    pdfUrl: "",
  });
  const [items, setItems] = useState([initialItem]);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoadingVendors(true);
        const { vendors: vendorRecords } = await fetchVendorsCached();
        setVendors(vendorRecords);
      } catch (error) {
        console.error("Error fetching vendors for purchase order:", error);
      } finally {
        setLoadingVendors(false);
      }
    };

    loadVendors();
  }, []);

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.partyName === form.partyName) || null,
    [form.partyName, vendors]
  );

  useEffect(() => {
    if (!selectedVendor) return;

    setForm((current) => ({
      ...current,
      address: current.address || selectedVendor.billingAddress || "",
      kindlyAttn: current.kindlyAttn || selectedVendor.contactPerson || "",
      contactNo: current.contactNo || String(selectedVendor.whatsappNumber || ""),
    }));

    setItems((current) =>
      current.map((item, index) =>
        index === 0 && !item.productName
          ? { ...item, productName: selectedVendor.productsTheySell || "" }
          : item
      )
    );
  }, [selectedVendor]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateItem = (id, field, value) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    const nextId = items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
    setItems((current) => [...current, { ...initialItem, id: nextId }]);
  };

  const removeItem = (id) => {
    if (items.length === 1) return;
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handlePrint = () => window.print();

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setSubmitError("");

      const payload = {
        ...form,
        items,
      };

      const params = new URLSearchParams();
      params.set("action", "createPurchaseOrder");
      params.set("payload", JSON.stringify(payload));

      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || result.message || "Failed to create purchase order");
      }

      setForm((current) => ({
        ...current,
        pdfEditUrl: result.editUrl || "",
        pdfUrl: result.pdfUrl || "",
      }));

      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    } catch (error) {
      console.error("Error creating purchase order:", error);
      setSubmitError(
        error.message ||
          "Purchase Order create nahi ho paya. Apps Script me createPurchaseOrder action check karein."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white no-print">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Generate Purchase Order
              </h1>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                Purchase Order Document Builder
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 transition-all hover:bg-slate-50"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-[#1e40af] px-4 py-2 font-bold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : showSaved ? (
                <CheckCircle2 size={18} />
              ) : (
                <Save size={18} />
              )}
              <span>
                {submitting ? "Generating..." : showSaved ? "Generated" : "Generate PO"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-4 sm:p-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {(submitError || showSaved) && (
            <div
              className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                submitError
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {submitError ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
              )}
              <div className="text-sm leading-6">
                {submitError ? (
                  submitError
                ) : (
                  <>
                    Purchase Order generate ho gaya. Agar Apps Script setup sahi hai to
                    `PDF Edit URL` aur `PDF URL` fields fill ho jayenge aur sheet me record save hoga.
                  </>
                )}
              </div>
            </div>
          )}

          <div className="border-b border-slate-300 pb-5">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <img src="/PPPL.png" alt="PPPL" className="h-14 w-auto object-contain" />
                  <div>
                    <h2 className="text-4xl font-black uppercase tracking-[0.08em] text-[#1f3864]">
                      Piramal
                    </h2>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      ISO 9001:2015 | ISO 14001:2015
                    </p>
                  </div>
                </div>
                <div className="space-y-1 text-sm font-medium text-slate-700">
                  <p>PIRAMAL PETROLEUM PVT. LTD.</p>
                  <p>SF-8, Shyam Plaza, Pandri, Raipur (Chhattisgarh) 492001</p>
                  <p>Office No. 0771-2439923, 0771-2439922</p>
                </div>
              </div>

              <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#1f3864] p-2 text-white">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-[0.18em] text-slate-900">
                      Purchase Order
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      Company Issue Format
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => updateForm("date", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Order No
                  </label>
                  <input
                    type="text"
                    value={form.orderNo}
                    onChange={(event) => updateForm("orderNo", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
                    Party Details
                  </h3>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Party Name
                    </label>
                    <select
                      disabled={loadingVendors}
                      value={form.partyName}
                      onChange={(event) => updateForm("partyName", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400 disabled:opacity-60"
                    >
                      <option value="">
                        {loadingVendors ? "Loading party accounts..." : "Select party name"}
                      </option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.partyName}>
                          {vendor.partyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Address
                    </label>
                    <textarea
                      rows="3"
                      value={form.address}
                      onChange={(event) => updateForm("address", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Kindly Attn
                    </label>
                    <input
                      type="text"
                      value={form.kindlyAttn}
                      onChange={(event) => updateForm("kindlyAttn", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Contact No
                    </label>
                    <input
                      type="text"
                      value={form.contactNo}
                      onChange={(event) => updateForm("contactNo", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
                  Document Links
                </h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      PDF Edit URL
                    </label>
                    <input
                      type="text"
                      value={form.pdfEditUrl}
                      onChange={(event) => updateForm("pdfEditUrl", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      PDF URL
                    </label>
                    <input
                      type="text"
                      value={form.pdfUrl}
                      onChange={(event) => updateForm("pdfUrl", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs leading-6 text-slate-500">
                    Sheet fields supported:
                    <br />
                    DATE, ORDER NO, PARTY NAME, ADDRESS, KINDLY ATTN, CONTACT NO, PRODUCT
                    NAME, UNIT, PRICE, FREIGHT, DELIVERED, PAYMENT, PDF EDIT URL, PDF URL,
                    RAT VALIDITY
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-6 text-blue-700">
                    Template Doc ID: <strong>165nqyULE4yhGEwhj2vGofDrPwOsvIrgtL7Vamdkn-a8</strong>
                    <br />
                    Upload Folder ID: <strong>1PGjujm1FdR4dhM9uFG7rSuf68wX6Eo3_</strong>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
                  Shipping Details
                </h3>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p className="font-semibold">Piramal Petroleum Pvt. Ltd.</p>
                  <p>Kh.No.300/1, 300/2, 300/3, Village-Raita, Block-Dharsiwa, Raipur (C.G.) 493221</p>
                  <p>Contact Details - Mr. Rahul Agrawal - 9993831316</p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-300 bg-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
                Material Details
              </h3>
              <button
                onClick={addItem}
                className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-700 no-print"
              >
                <Plus size={14} />
                Add Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    <th className="border-b border-r border-slate-200 px-4 py-3 text-left">Sr. No.</th>
                    <th className="border-b border-r border-slate-200 px-4 py-3 text-left">Product Name</th>
                    <th className="border-b border-r border-slate-200 px-4 py-3 text-left">Unit</th>
                    <th className="border-b border-r border-slate-200 px-4 py-3 text-left">Price</th>
                    <th className="border-b border-r border-slate-200 px-4 py-3 text-left">Freight</th>
                    <th className="border-b border-r border-slate-200 px-4 py-3 text-left">Delivered</th>
                    <th className="border-b border-r border-slate-200 px-4 py-3 text-left">Payment</th>
                    <th className="border-b border-r border-slate-200 px-4 py-3 text-left">Rate Validity</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left no-print">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="align-top">
                      <td className="border-b border-r border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                        {index + 1}
                      </td>
                      <td className="border-b border-r border-slate-200 px-2 py-2">
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(event) => updateItem(item.id, "productName", event.target.value)}
                          className="w-full rounded-lg bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-b border-r border-slate-200 px-2 py-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(event) => updateItem(item.id, "unit", event.target.value)}
                          className="w-full rounded-lg bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-b border-r border-slate-200 px-2 py-2">
                        <input
                          type="text"
                          value={item.price}
                          onChange={(event) => updateItem(item.id, "price", event.target.value)}
                          className="w-full rounded-lg bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-b border-r border-slate-200 px-2 py-2">
                        <input
                          type="text"
                          value={item.freight}
                          onChange={(event) => updateItem(item.id, "freight", event.target.value)}
                          className="w-full rounded-lg bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-b border-r border-slate-200 px-2 py-2">
                        <input
                          type="text"
                          value={item.delivered}
                          onChange={(event) => updateItem(item.id, "delivered", event.target.value)}
                          className="w-full rounded-lg bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-b border-r border-slate-200 px-2 py-2">
                        <input
                          type="text"
                          value={item.payment}
                          onChange={(event) => updateItem(item.id, "payment", event.target.value)}
                          className="w-full rounded-lg bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-b border-r border-slate-200 px-2 py-2">
                        <input
                          type="text"
                          value={item.rateValidity}
                          onChange={(event) => updateItem(item.id, "rateValidity", event.target.value)}
                          className="w-full rounded-lg bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3 no-print">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
                  Terms & Conditions
                </h3>
              </div>
              <div className="space-y-3 p-5 text-sm text-slate-700">
                <p>Transportation - Self Scope / Others</p>
                <p>PAN - AADCP8688D</p>
                <p>Taxes - 18% GST</p>
                <p>GSTIN - 22AADCP8688D2Z9</p>
                <p>Lifting - 1-2 Days</p>
                <p>Payment - Advance</p>
                <p>Note - Applicable TDS Provision Effective from 01.07.2021 @ 0.10%</p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
                  Registration Details
                </h3>
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <p>PAN - AADCP8688D</p>
                  <p>GSTIN - 22AADCP8688D2Z9</p>
                  <p>Website - www.piramalpetroleum.com</p>
                  <p>Email - piramalpetroleumpltd@yahoo.co.in</p>
                </div>
              </div>

              <div className="mt-12 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  For, Piramal Petroleum Pvt. Ltd.
                </p>
                <div className="mt-16 border-t border-slate-300 pt-3 text-sm font-semibold text-slate-700">
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrder;
