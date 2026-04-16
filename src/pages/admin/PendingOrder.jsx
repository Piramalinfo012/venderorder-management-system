import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Building, User, Phone, Package, Calendar, FileText, 
  Truck, CreditCard, Clock, TrendingUp, Hash, X, Download, 
  ChevronDown, Loader2, CheckCircle, AlertCircle, DollarSign,
  Users, ShoppingCart, MapPin
} from "lucide-react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyn7g_Mt7zSTjTmukJhpKWokUCZNFb0l6g-bwd5jgUZLpbTBq-f4LviMjBBQlM85XeX/exec";

const PendingOrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [customerNames, setCustomerNames] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = customerNames.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customerNames);
    }
  }, [searchQuery, customerNames]);

  const fetchPendingOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SCRIPT_URL}?sheet=Pending Order`);
      const result = await response.json();
      if (result.success && result.data && result.data.length > 1) {
        const rows = result.data.slice(1);
        const orderList = rows.filter(row => row[1] && row[1].toString().trim() !== "").map((row, idx) => ({
          id: idx,
          deliveryOrderNumber: row[1] || "",
          salesPersonName: row[2] || "",
          partyPoNo: row[3] || "",
          customerName: row[4] || "",
          productName: row[5] || "",
          unit: row[6] || "",
          quantity: row[7] || "",
          rateOfMaterial: row[8] || "",
          typeOfTransporting: row[9] || "",
          uploadPO: row[10] || "",
          contactPersonName: row[11] || "",
          contactPersonWhatsAppNo: row[12] || "",
          noOfCreditDays: row[13] || "",
          creditDays: row[14] || "",
          typeOfCustomer: row[15] || "",
          deliveryDate: row[16] || "",
          haltingCharges24Hour: row[17] || "",
          gstCertificate: row[18] || "",
          productSection: row[19] || "",
          totalPlannedDispatch: row[20] || "",
          dispatchPendingQty: row[21] || "",
          quantityDelivered: row[22] || "",
          orderCancel: row[23] || "",
          pendingQty: row[24] || "",
          status: row[25] || "",
          dispatchStatus: row[26] || ""
        }));
        setOrders(orderList);
        const uniqueCustomers = [...new Set(orderList.map(o => o.customerName).filter(c => c.trim() !== ""))];
        setCustomerNames(uniqueCustomers);
        setFilteredCustomers(uniqueCustomers);
      } else {
        setError("No data found in sheet");
      }
    } catch (err) {
      setError("Failed to fetch data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setSelectedCustomerName(e.target.value);
    setIsDropdownOpen(true);
    if (selectedOrders.length > 0) setSelectedOrders([]);
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomerName(customer);
    setSearchQuery(customer);
    setIsDropdownOpen(false);
    setSelectedOrders([]);
  };

  const handleSearch = () => {
    if (!selectedCustomerName.trim()) return;
    const matched = orders.filter(o => o.customerName.toLowerCase() === selectedCustomerName.toLowerCase());
    setSelectedOrders(matched);
    setIsDropdownOpen(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedCustomerName("");
    setSelectedOrders([]);
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("complete") || s.includes("delivered")) return "bg-green-100 text-green-700";
    if (s.includes("pending") || s.includes("progress")) return "bg-yellow-100 text-yellow-700";
    if (s.includes("cancel") || s.includes("hold")) return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const downloadPDF = () => {
    if (selectedOrders.length === 0) return;
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      const now = new Date();
      const generatedDate = now.toLocaleDateString('en-US', { 
        month: '2-digit', day: '2-digit', year: 'numeric' 
      }) + ', ' + now.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      });
      
      doc.setFontSize(18);
      doc.setTextColor(35, 99, 179);
      doc.text('Pending Orders Report', 105, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generated: ${generatedDate}`, 10, 25);
      doc.text(`Customer Name: ${selectedCustomerName}`, 10, 31);
      doc.text(`Total Pending Orders: ${selectedOrders.length}`, 10, 37);
      
      doc.line(10, 40, 200, 40);
      
      let yPos = 48;
      const pageHeight = 280;
      
      selectedOrders.forEach((order, index) => {
        if (yPos > pageHeight) {
          doc.addPage();
          yPos = 15;
        }
        
        doc.setFontSize(11);
        doc.setTextColor(35, 99, 179);
        doc.text(`Order #${index + 1}`, 10, yPos);
        yPos += 6;
        
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        const details = [
          { label: 'Delivery Order Number:', value: order.deliveryOrderNumber },
          { label: 'Sales Person Name:', value: order.salesPersonName },
          { label: 'Party Po No:', value: order.partyPoNo },
          { label: 'Customer Name:', value: order.customerName },
          { label: 'Product Name:', value: order.productName },
          { label: 'Unit:', value: order.unit },
          { label: 'Quantity:', value: order.quantity },
          { label: 'Rate Of Material:', value: order.rateOfMaterial },
          { label: 'Type Of Transporting:', value: order.typeOfTransporting },
          { label: 'Upload PO:', value: order.uploadPO },
          { label: 'Contact Person Name:', value: order.contactPersonName },
          { label: 'Contact Person WhatsApp No:', value: order.contactPersonWhatsAppNo },
          { label: 'No. Of Credit Days:', value: order.noOfCreditDays },
          { label: 'Credit Days:', value: order.creditDays },
          { label: 'Type Of Customer:', value: order.typeOfCustomer },
          { label: 'Delivery Date:', value: order.deliveryDate },
          { label: 'Halting Charges 24 Hour:', value: order.haltingCharges24Hour },
          { label: 'GST Certificate:', value: order.gstCertificate },
          { label: 'Product Section:', value: order.productSection },
          { label: 'Total Planned Dispatch:', value: order.totalPlannedDispatch },
          { label: 'Dispatch Pending Qty:', value: order.dispatchPendingQty },
          { label: 'Quantity Delivered:', value: order.quantityDelivered },
          { label: 'Order Cancel:', value: order.orderCancel },
          { label: 'Pending Qty:', value: order.pendingQty },
          { label: 'Status:', value: order.status },
          { label: 'Dispatch Status:', value: order.dispatchStatus }
        ];
        
        details.forEach(detail => {
          if (yPos > pageHeight) {
            doc.addPage();
            yPos = 15;
          }
          
          doc.setFont(undefined, 'bold');
          doc.text(detail.label, 10, yPos);
          doc.setFont(undefined, 'normal');
          
          const textValue = (detail.value || '-').toString();
          const maxWidth = 120;
          const lines = doc.splitTextToSize(textValue, maxWidth);
          doc.text(lines, 70, yPos);
          yPos += (lines.length * 5);
        });
        
        yPos += 3;
        doc.line(10, yPos, 200, yPos);
        yPos += 5;
      });
      
      doc.save(`${selectedCustomerName.replace(/[^a-zA-Z0-9]/g, '_')}_Pending_Orders_Report.pdf`);
    };
    
    document.head.appendChild(script);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <h1 className="text-base font-semibold text-gray-700 mb-3">Pending Orders - Search by Customer Name</h1>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-2" />
              <span className="text-gray-600">Loading data...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">
              {error}
              <button onClick={fetchPendingOrders} className="ml-2 text-blue-600 underline">Retry</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1" ref={dropdownRef}>
                <div className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-white cursor-pointer flex items-center" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  <input type="text" placeholder="Select or search customer..." value={searchQuery} onChange={handleInputChange} onKeyPress={handleKeyPress} onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(true); }} className="flex-1 outline-none text-sm bg-transparent" />
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.length > 0 ? filteredCustomers.map((customer, idx) => (
                      <div key={idx} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0" onClick={() => handleSelectCustomer(customer)}>
                        <div className="font-medium text-gray-800">{customer}</div>
                      </div>
                    )) : (
                      <div className="px-3 py-4 text-center text-gray-500 text-sm">No customers found</div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={handleSearch} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          )}
        </div>

        {selectedOrders.length > 0 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl px-5 py-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Building className="w-6 h-6 text-white" /></div>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedCustomerName}</h2>
                  <p className="text-sm text-blue-100">{selectedOrders.length} pending order(s) found</p>
                </div>
              </div>
            </div>

            {selectedOrders.map((order, idx) => (
              <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-800">Order #{idx + 1}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>{order.status || "N/A"}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.dispatchStatus)}`}>{order.dispatchStatus || "N/A"}</span>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0"><Hash className="w-5 h-5 text-indigo-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">DELIVERY ORDER NUMBER</p><p className="text-sm font-semibold text-gray-900">{order.deliveryOrderNumber || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-blue-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">SALES PERSON NAME</p><p className="text-sm font-semibold text-gray-900">{order.salesPersonName || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-purple-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">PARTY PO NO</p><p className="text-sm font-semibold text-gray-900">{order.partyPoNo || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0"><Building className="w-5 h-5 text-green-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">CUSTOMER NAME</p><p className="text-sm font-semibold text-gray-900">{order.customerName || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0"><Package className="w-5 h-5 text-orange-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">PRODUCT NAME</p><p className="text-sm font-semibold text-gray-900">{order.productName || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0"><Package className="w-5 h-5 text-cyan-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">UNIT</p><p className="text-sm font-semibold text-gray-900">{order.unit || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0"><TrendingUp className="w-5 h-5 text-pink-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">QUANTITY</p><p className="text-sm font-semibold text-gray-900">{order.quantity || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0"><DollarSign className="w-5 h-5 text-yellow-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">RATE OF MATERIAL</p><p className="text-sm font-semibold text-gray-900">{order.rateOfMaterial || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0"><Truck className="w-5 h-5 text-teal-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">TYPE OF TRANSPORTING</p><p className="text-sm font-semibold text-gray-900">{order.typeOfTransporting || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-red-600" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-semibold mb-1">UPLOAD PO</p>
                        {order.uploadPO && order.uploadPO.trim() !== "" && order.uploadPO !== "-" ? (
                          <a 
                            href={order.uploadPO} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View
                          </a>
                        ) : (
                          <p className="text-sm font-semibold text-gray-400">-</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-violet-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">CONTACT PERSON NAME</p><p className="text-sm font-semibold text-gray-900">{order.contactPersonName || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center flex-shrink-0"><Phone className="w-5 h-5 text-lime-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">CONTACT WHATSAPP NO</p><p className="text-sm font-semibold text-blue-600">{order.contactPersonWhatsAppNo || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-amber-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">NO. OF CREDIT DAYS</p><p className="text-sm font-semibold text-gray-900">{order.noOfCreditDays || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0"><CreditCard className="w-5 h-5 text-emerald-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">CREDIT DAYS</p><p className="text-sm font-semibold text-gray-900">{order.creditDays || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-fuchsia-100 rounded-lg flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-fuchsia-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">TYPE OF CUSTOMER</p><p className="text-sm font-semibold text-gray-900">{order.typeOfCustomer || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0"><Calendar className="w-5 h-5 text-sky-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">DELIVERY DATE</p><p className="text-sm font-semibold text-gray-900">{order.deliveryDate || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-rose-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">HALTING CHARGES 24 HOUR</p><p className="text-sm font-semibold text-gray-900">{order.haltingCharges24Hour || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-slate-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">GST CERTIFICATE</p><p className="text-sm font-semibold text-gray-900">{order.gstCertificate || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0"><Package className="w-5 h-5 text-stone-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">PRODUCT SECTION</p><p className="text-sm font-semibold text-gray-900">{order.productSection || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0"><TrendingUp className="w-5 h-5 text-zinc-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">TOTAL PLANNED DISPATCH</p><p className="text-sm font-semibold text-gray-900">{order.totalPlannedDispatch || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0"><AlertCircle className="w-5 h-5 text-orange-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">DISPATCH PENDING QTY</p><p className="text-sm font-semibold text-gray-900">{order.dispatchPendingQty || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">QUANTITY DELIVERED</p><p className="text-sm font-semibold text-gray-900">{order.quantityDelivered || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"><X className="w-5 h-5 text-red-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">ORDER CANCEL</p><p className="text-sm font-semibold text-gray-900">{order.orderCancel || "-"}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0"><ShoppingCart className="w-5 h-5 text-yellow-600" /></div>
                      <div><p className="text-xs text-gray-500 font-semibold mb-1">PENDING QTY</p><p className="text-sm font-semibold text-gray-900">{order.pendingQty || "-"}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={downloadPDF} className="flex-1 px-4 py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <Download className="w-4 h-4" />Download Report
                </button>
                <button onClick={handleClear} className="flex-1 px-4 py-3 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <X className="w-4 h-4" />Clear Search
                </button>
              </div>
            </div>
          </div>
        )}

        {searchQuery && selectedOrders.length === 0 && !loading && !isDropdownOpen && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-10 text-center">
            <Building className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-2">No Pending Orders Found</h3>
            <p className="text-sm text-gray-500">Select a customer from the dropdown and click Search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingOrderDashboard;