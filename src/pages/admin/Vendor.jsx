import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Building, User, Phone, FileText, Calendar,
  MapPin, Truck, Package, Info, Download, X, ChevronDown,
  CreditCard, Clock, UserCheck, Loader2
} from "lucide-react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyn7g_Mt7zSTjTmukJhpKWokUCZNFb0l6g-bwd5jgUZLpbTBq-f4LviMjBBQlM85XeX/exec";

const CompanySearchDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = companies.filter(c => 
        c.partyName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
  }, [searchQuery, companies]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SCRIPT_URL}?sheet=vendor`);
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 1) {
        const rows = result.data.slice(1);
        const companyList = rows
          .filter(row => row[0] && row[0].toString().trim() !== "")
          .map((row, index) => ({
            id: index,
            partyName: row[0] || "",
            stateName: row[1] || "",
            billingAddress: row[2] || "",
            shippingAddress: row[3] || "",
            gstNumber: row[4] || "",
            contactPerson: row[5] || "",
            whatsappNumber: row[6] || "",
            productsWeSell: row[7] || "",
            lastPurchaseDate: row[8] || "",
            averageOrderCycle: row[9] || "",
            paymentTerm: row[10] || "",
            creditLimit: row[11] || "",
            crmName: row[12] || ""
          }));
        setCompanies(companyList);
        setFilteredCompanies(companyList);
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
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedCompanyName(value);
    setIsDropdownOpen(true);
    // Auto clear result when user types new input
    if (selectedCompany) {
      setSelectedCompany(null);
    }
  };

  const handleSelectCompany = (company) => {
    setSelectedCompanyName(company.partyName);
    setSearchQuery(company.partyName);
    setIsDropdownOpen(false);
    // Auto clear previous result
    setSelectedCompany(null);
  };

  const handleSearch = () => {
    if (!selectedCompanyName.trim()) return;
    const company = companies.find(c => 
      c.partyName.toLowerCase() === selectedCompanyName.toLowerCase()
    );
    setSelectedCompany(company || null);
    setIsDropdownOpen(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedCompanyName("");
    setSelectedCompany(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return dateString;
  };

  const downloadPDF = () => {
    if (!selectedCompany) return;
    const c = selectedCompany;
    const now = new Date();
    const generatedDate = now.toLocaleDateString('en-US', { 
      month: '2-digit', day: '2-digit', year: 'numeric' 
    }) + ', ' + now.toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    });

    // Create PDF content
    const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R/F2 6 0 R>>>>>>endobj
4 0 obj<</Length 3500>>stream
BT
/F2 18 Tf 0.227 0.388 0.702 rg
50 750 Td (Party Search Report) Tj
0 g /F1 10 Tf
0 -25 Td (Generated on: ${generatedDate}) Tj
350 0 Td (Total Results: 1) Tj
-350 -30 Td /F2 12 Tf (1. ${c.partyName}) Tj
/F1 10 Tf
0 -25 Td (Industry: -) Tj
0 -15 Td (Headquarters: ${c.billingAddress || '-'}) Tj
0 -15 Td (Contact Person: ${c.contactPerson || '-'}) Tj
0 -15 Td (Phone: ${c.whatsappNumber || '-'}) Tj
0 -15 Td (WhatsApp: ${c.whatsappNumber || '-'}) Tj
0 -15 Td (GST Number: ${c.gstNumber || '-'}) Tj
0 -15 Td (Products: ${c.productsWeSell || '-'}) Tj
0 -15 Td (Last Purchase Date: ${c.lastPurchaseDate || '-'}) Tj
0 -15 Td (Billing Address: ${c.billingAddress || '-'}) Tj
0 -15 Td (Shipping Address: ${c.shippingAddress || '-'}) Tj
0 -15 Td (Payment Term: ${c.paymentTerm || '-'}) Tj
0 -15 Td (Credit Limit: ${c.creditLimit || '-'}) Tj
0 -15 Td (CRM Handler: ${c.crmName || '-'}) Tj
0 -15 Td (Average Order Cycle: ${c.averageOrderCycle || '-'}) Tj
0 -25 Td (Description:) Tj
0 -15 Td (Company based in ${c.stateName || '-'}. Contact: ${c.contactPerson || '-'}) Tj
0 -50 Td 0.5 g /F1 8 Tf (Page 1) Tj
180 0 Td (Powered by Botivate) Tj
150 0 Td (Generated: ${generatedDate}) Tj
ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
6 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold>>endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000003818 00000 n 
0000003895 00000 n 
trailer<</Size 7/Root 1 0 R>>
startxref
3978
%%EOF`;

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${c.partyName.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Search Section - Always Visible */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <h1 className="text-base font-semibold text-gray-700 mb-3">Search Company by Name</h1>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-2" />
              <span className="text-gray-600">Loading companies...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">
              {error}
              <button onClick={fetchCompanies} className="ml-2 text-blue-600 underline">Retry</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1" ref={dropdownRef}>
                <div 
                  className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-white cursor-pointer flex items-center"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <input
                    type="text"
                    placeholder="Select or search company..."
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(true);
                    }}
                    className="flex-1 outline-none text-sm bg-transparent"
                  />
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map((company) => (
                        <div
                          key={company.id}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSelectCompany(company)}
                        >
                          <div className="font-medium text-gray-800">{company.partyName}</div>
                          <div className="text-xs text-gray-500">{company.stateName}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-gray-500 text-sm">No companies found</div>
                    )}
                  </div>
                )}
              </div>
              <button 
                onClick={handleSearch} 
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          )}
        </div>

        {/* Company Details - Shows when company is selected */}
        {selectedCompany && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Building className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white">{selectedCompany.partyName}</h2>
                  <p className="text-sm text-blue-100">{selectedCompany.stateName}</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-blue-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs text-gray-500 font-semibold mb-1">CONTACT PERSON</p><p className="text-sm font-semibold text-gray-900">{selectedCompany.contactPerson || "-"}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"><Phone className="w-5 h-5 text-blue-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs text-gray-500 font-semibold mb-1">WHATSAPP NUMBER</p><p className="text-sm font-semibold text-blue-600">{selectedCompany.whatsappNumber || "-"}</p></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-green-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs text-gray-500 font-semibold mb-1">GST NUMBER</p><p className="text-sm font-semibold text-gray-900">{selectedCompany.gstNumber || "-"}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0"><Calendar className="w-5 h-5 text-purple-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs text-gray-500 font-semibold mb-1">LAST PURCHASE DATE</p><p className="text-sm font-semibold text-gray-900">{formatDate(selectedCompany.lastPurchaseDate)}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-yellow-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs text-gray-500 font-semibold mb-1">AVG ORDER CYCLE</p><p className="text-sm font-semibold text-gray-900">{selectedCompany.averageOrderCycle || "-"}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0"><CreditCard className="w-5 h-5 text-pink-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs text-gray-500 font-semibold mb-1">PAYMENT TERM</p><p className="text-sm font-semibold text-gray-900">{selectedCompany.paymentTerm || "-"}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"><CreditCard className="w-5 h-5 text-red-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs text-gray-500 font-semibold mb-1">CREDIT LIMIT</p><p className="text-sm font-semibold text-gray-900">{selectedCompany.creditLimit || "-"}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0"><UserCheck className="w-5 h-5 text-teal-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs text-gray-500 font-semibold mb-1">CRM HANDLER</p><p className="text-sm font-semibold text-gray-900">{selectedCompany.crmName || "-"}</p></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-orange-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs text-gray-500 font-semibold mb-1">BILLING ADDRESS</p><p className="text-sm text-gray-700 leading-relaxed">{selectedCompany.billingAddress || "-"}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0"><Truck className="w-5 h-5 text-cyan-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs text-gray-500 font-semibold mb-1">SHIPPING ADDRESS</p><p className="text-sm text-gray-700 leading-relaxed">{selectedCompany.shippingAddress || "-"}</p></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Products & Services</h3>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0"><Package className="w-5 h-5 text-indigo-600" /></div>
                  <div className="flex-1 min-w-0"><p className="text-xs text-gray-500 font-semibold mb-1">PRODUCTS WE SELL</p><p className="text-sm text-gray-900 font-medium">{selectedCompany.productsWeSell || "-"}</p></div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={downloadPDF} className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <Download className="w-4 h-4" />Download PDF
                </button>
                <button onClick={handleClear} className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <X className="w-4 h-4" />Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {searchQuery && !selectedCompany && !loading && !isDropdownOpen && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-10 text-center">
            <Building className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-2">No Company Found</h3>
            <p className="text-sm text-gray-500">Select a company from the dropdown and click Search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySearchDashboard;