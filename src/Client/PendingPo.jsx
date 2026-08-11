import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import axios from "axios";
import {
  Search,
  Building2,
  Package,
  Clock,
  AlertCircle,
  RefreshCw,
  X,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Check,
  Hash,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let dataCache = null;
let cacheTimestamp = null;

// Optimized debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const PendingPOList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedPO, setSelectedPO] = useState("");
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "company",
    direction: "asc",
  });
  const [companySearch, setCompanySearch] = useState("");
  const [poSearch, setPoSearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showPODropdown, setShowPODropdown] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const companyRef = useRef(null);
  const poRef = useRef(null);
  const isFetchingRef = useRef(false);
  const fetchCountRef = useRef(0);
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(null);

  // Debounce search terms
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedCompanySearch = useDebounce(companySearch, 200);
  const debouncedPoSearch = useDebounce(poSearch, 200);

  // Memoized fetch function with caching
  const fetchPendingPOs = useCallback(async (forceRefresh = false) => {
    if (isFetchingRef.current && !forceRefresh) {
      console.log("Already fetching, skipping...");
      return;
    }

    if (!forceRefresh && dataCache && cacheTimestamp) {
      const now = Date.now();
      if (now - cacheTimestamp < CACHE_DURATION) {
        console.log("Using cached data");
        setData(dataCache);
        setLoading(false);
        setIsInitialLoad(false);
        return;
      }
    }

    isFetchingRef.current = true;
    fetchCountRef.current += 1;
    const currentFetchId = fetchCountRef.current;
    startTimeRef.current = performance.now();

    setLoading(true);
    setError(null);

    try {
      console.log(
        `[Performance] Fetching data from API... (Attempt ${currentFetchId})`,
      );
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch-orders/pending`,
        {
          withCredentials: true,
        },
      );

      if (currentFetchId !== fetchCountRef.current) {
        console.log("Request was superseded, ignoring...");
        return;
      }

      if (response.data.success) {
        const newData = response.data.data;
        const fetchTime = (performance.now() - startTimeRef.current).toFixed(2);
        console.log(`[Performance] API fetch completed in ${fetchTime}ms`);
        console.log(`[Performance] Data length: ${newData?.length}`);

        setData(newData);
        dataCache = newData;
        cacheTimestamp = Date.now();
      } else {
        console.error("API returned success: false", response.data.message);
        setError(response.data.message || "Failed to fetch data");
      }
    } catch (err) {
      if (currentFetchId === fetchCountRef.current) {
        console.error("Fetch error:", err);
        setError(err.response?.data?.message || "Failed to fetch data");
      }
    } finally {
      if (currentFetchId === fetchCountRef.current) {
        isFetchingRef.current = false;
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, []);

  // Initial load with caching - only run once
  useEffect(() => {
    fetchPendingPOs();
    return () => {
      isFetchingRef.current = false;
    };
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyRef.current && !companyRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
      }
      if (poRef.current && !poRef.current.contains(event.target)) {
        setShowPODropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // OPTIMIZED: Process data only when data changes
  const processedData = useMemo(() => {
    const start = performance.now();
    renderCountRef.current += 1;
    console.log(
      `[Performance] Processing data - Render #${renderCountRef.current}`,
    );

    if (!data || data.length === 0) {
      console.log("No data to process");
      return {
        availableCompanies: [],
        availablePOs: [],
        filteredData: [],
        summary: {
          totalCompanies: 0,
          totalItems: 0,
          totalQuantity: 0,
          criticalItems: 0,
          highItems: 0,
          normalItems: 0,
        },
      };
    }

    // Get unique companies (optimized)
    const companies = [...new Set(data.map((item) => item.company))].sort();

    // Filter companies based on selected company
    let filteredData = data;
    if (selectedCompany) {
      filteredData = filteredData.filter(
        (company) => company.company === selectedCompany,
      );
    }

    // Get unique PO numbers (optimized)
    const poSet = new Set();
    filteredData.forEach((company) => {
      company.items.forEach((item) => {
        item.poDetails.forEach((po) => {
          poSet.add(po.poNumber);
        });
      });
    });
    const availablePOs = [...poSet].sort();

    // Apply search filter (optimized with early returns)
    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== "") {
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      filteredData = filteredData
        .map((company) => ({
          ...company,
          items: company.items.filter((item) => {
            if (item.itemCode?.toLowerCase().includes(searchLower)) return true;
            if (item.description?.toLowerCase().includes(searchLower))
              return true;
            return item.poDetails?.some((po) =>
              po.poNumber?.toLowerCase().includes(searchLower),
            );
          }),
        }))
        .filter((company) => company.items.length > 0);
    }

    // Apply PO filter
    if (selectedPO) {
      filteredData = filteredData
        .map((company) => ({
          ...company,
          items: company.items
            .map((item) => ({
              ...item,
              poDetails: item.poDetails.filter(
                (po) => po.poNumber === selectedPO,
              ),
            }))
            .filter((item) => item.poDetails.length > 0),
        }))
        .filter((company) => company.items.length > 0);
    }

    // Calculate summary (single pass)
    let totalItems = 0;
    let totalQuantity = 0;
    let criticalItems = 0;
    let highItems = 0;
    let normalItems = 0;

    filteredData.forEach((company) => {
      company.items.forEach((item) => {
        totalItems++;
        totalQuantity += item.pendingQuantity;
        if (item.pendingQuantity > 1000) criticalItems++;
        else if (item.pendingQuantity > 500) highItems++;
        else normalItems++;
      });
    });

    const result = {
      availableCompanies: companies,
      availablePOs,
      filteredData: filteredData,
      summary: {
        totalCompanies: filteredData.length,
        totalItems,
        totalQuantity,
        criticalItems,
        highItems,
        normalItems,
      },
    };

    const processTime = (performance.now() - start).toFixed(2);
    console.log(`[Performance] Data processing completed in ${processTime}ms`);
    console.log(
      `[Performance] Companies: ${companies.length}, POs: ${availablePOs.length}, Items: ${totalItems}`,
    );

    return result;
  }, [data, debouncedSearchTerm, selectedCompany, selectedPO]);

  const { availableCompanies, availablePOs, filteredData, summary } =
    processedData;

  // Filter companies and POs (optimized)
  const filteredCompanies = useMemo(() => {
    if (!debouncedCompanySearch) return availableCompanies;
    const searchLower = debouncedCompanySearch.toLowerCase();
    return availableCompanies.filter((company) =>
      company.toLowerCase().includes(searchLower),
    );
  }, [availableCompanies, debouncedCompanySearch]);

  const filteredPOs = useMemo(() => {
    if (!debouncedPoSearch) return availablePOs;
    const searchLower = debouncedPoSearch.toLowerCase();
    return availablePOs.filter((po) => po.toLowerCase().includes(searchLower));
  }, [availablePOs, debouncedPoSearch]);

  // Sort data (optimized)
  const sortedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const sorted = [...filteredData];
    if (sortConfig.key) {
      const key = sortConfig.key;
      const direction = sortConfig.direction;

      sorted.sort((a, b) => {
        let aVal, bVal;
        if (key === "company") {
          aVal = a.company;
          bVal = b.company;
        } else if (key === "items") {
          aVal = a.items.length;
          bVal = b.items.length;
        } else if (key === "quantity") {
          aVal =
            a._totalQuantity !== undefined
              ? a._totalQuantity
              : a.items.reduce((sum, item) => sum + item.pendingQuantity, 0);
          bVal =
            b._totalQuantity !== undefined
              ? b._totalQuantity
              : b.items.reduce((sum, item) => sum + item.pendingQuantity, 0);
          a._totalQuantity = aVal;
          b._totalQuantity = bVal;
        }
        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredData, sortConfig]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    const excelData = [];

    filteredData.forEach((company) => {
      company.items.forEach((item) => {
        item.poDetails.forEach((po) => {
          excelData.push({
            Company: company.company,
            "PO Number": po.poNumber,
            "Item Code": item.itemCode,
            Description: item.description,
            Unit: item.unit,
            "Pending Quantity": po.pendingQuantity,
            Status:
              po.pendingQuantity > 500
                ? "Critical"
                : po.pendingQuantity > 100
                  ? "High"
                  : "Normal",
          });
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 20 },
      { wch: 50 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pending POs");

    const summaryData = [
      { Metric: "Report Generated", Value: new Date().toLocaleString() },
      { Metric: "Total Companies", Value: summary.totalCompanies },
      { Metric: "Total Items", Value: summary.totalItems },
      {
        Metric: "Total Pending Quantity",
        Value: summary.totalQuantity.toLocaleString(),
      },
      { Metric: "Critical Items (>1000)", Value: summary.criticalItems },
      { Metric: "High Items (500-1000)", Value: summary.highItems },
      { Metric: "Normal Items (<500)", Value: summary.normalItems },
      { Metric: "Company Filter", Value: selectedCompany || "All" },
      { Metric: "PO Filter", Value: selectedPO || "All" },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(
      dataBlob,
      `Pending_POs_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  }, [filteredData, summary, selectedCompany, selectedPO]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCompany("");
    setSelectedPO("");
    setCompanySearch("");
    setPoSearch("");
  }, []);

  const handleCompanyChange = useCallback((company) => {
    setSelectedCompany(company);
    setSelectedPO("");
    setShowCompanyDropdown(false);
    setCompanySearch("");
  }, []);

  const hasActiveFilters = searchTerm || selectedCompany || selectedPO;

  // Loading state
  if (loading && isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending orders...</p>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Error Loading Data
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchPendingPOs(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-7 h-7" />
                Pending Purchase Orders
              </h1>
              <p className="text-blue-100 mt-1">
                Track and manage pending orders across companies
              </p>
              {data && data.length > 0 && (
                <p className="text-blue-200 text-sm mt-2">
                  Loaded {data.length} companies
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium"
                disabled={filteredData.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </button>
              <button
                onClick={() => fetchPendingPOs(true)}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Companies</p>
                <p className="text-3xl font-bold text-gray-800">
                  {summary.totalCompanies}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Items</p>
                <p className="text-3xl font-bold text-gray-800">
                  {summary.totalItems}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Quantity</p>
                <p className="text-3xl font-bold text-gray-800">
                  {summary.totalQuantity.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Critical Items</p>
                <p className="text-3xl font-bold text-red-600">
                  {summary.criticalItems}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div> */}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by company, item code, description, PO number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Company Dropdown */}
            <div className="w-64 relative" ref={companyRef}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Filter by Company
              </label>
              <div
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                className="flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 transition-colors bg-white"
              >
                <span
                  className={
                    selectedCompany ? "text-gray-800" : "text-gray-400"
                  }
                >
                  {selectedCompany || "All Companies"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    showCompanyDropdown ? "rotate-180" : ""
                  }`}
                />
              </div>

              {showCompanyDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-80 overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      type="text"
                      placeholder="Search company..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <div
                      onClick={() => handleCompanyChange("")}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    >
                      <span
                        className={
                          !selectedCompany
                            ? "font-medium text-blue-600"
                            : "text-gray-600"
                        }
                      >
                        All Companies
                      </span>
                      {!selectedCompany && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    {filteredCompanies.map((company) => (
                      <div
                        key={company}
                        onClick={() => handleCompanyChange(company)}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                      >
                        <span
                          className={
                            selectedCompany === company
                              ? "font-medium text-blue-600"
                              : "text-gray-600"
                          }
                        >
                          {company}
                        </span>
                        {selectedCompany === company && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    ))}
                    {filteredCompanies.length === 0 && (
                      <div className="px-3 py-4 text-center text-gray-400 text-sm">
                        No companies found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PO Number Dropdown */}
            <div className="w-64 relative" ref={poRef}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Filter by PO Number
              </label>
              <div
                onClick={() => {
                  if (availablePOs.length > 0) {
                    setShowPODropdown(!showPODropdown);
                  }
                }}
                className={`flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-xl transition-colors bg-white ${
                  availablePOs.length > 0
                    ? "cursor-pointer hover:border-blue-400"
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                <span
                  className={selectedPO ? "text-gray-800" : "text-gray-400"}
                >
                  {selectedPO || "All PO Numbers"}
                </span>
                {availablePOs.length > 0 && (
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      showPODropdown ? "rotate-180" : ""
                    }`}
                  />
                )}
              </div>

              {showPODropdown && availablePOs.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-80 overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      type="text"
                      placeholder="Search PO number..."
                      value={poSearch}
                      onChange={(e) => setPoSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <div
                      onClick={() => {
                        setSelectedPO("");
                        setShowPODropdown(false);
                        setPoSearch("");
                      }}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    >
                      <span
                        className={
                          !selectedPO
                            ? "font-medium text-blue-600"
                            : "text-gray-600"
                        }
                      >
                        All PO Numbers
                      </span>
                      {!selectedPO && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    {filteredPOs.map((po) => (
                      <div
                        key={po}
                        onClick={() => {
                          setSelectedPO(po);
                          setShowPODropdown(false);
                          setPoSearch("");
                        }}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between font-mono text-sm"
                      >
                        <span
                          className={
                            selectedPO === po
                              ? "font-medium text-blue-600"
                              : "text-gray-600"
                          }
                        >
                          {po}
                        </span>
                        {selectedPO === po && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    ))}
                    {filteredPOs.length === 0 && (
                      <div className="px-3 py-4 text-center text-gray-400 text-sm">
                        No PO numbers found
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedCompany && availablePOs.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  No POs found for this company
                </p>
              )}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2.5 text-gray-600 hover:text-gray-800 flex items-center gap-1 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              {selectedCompany && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                  <Building2 className="w-3 h-3" />
                  <span>Company: {selectedCompany}</span>
                  <button
                    onClick={() => handleCompanyChange("")}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {selectedPO && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm">
                  <Hash className="w-3 h-3" />
                  <span>PO: {selectedPO}</span>
                  <button
                    onClick={() => setSelectedPO("")}
                    className="ml-1 hover:text-purple-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {searchTerm && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                  <Search className="w-3 h-3" />
                  <span>Search: {searchTerm}</span>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:text-gray-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 flex justify-center">
            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No data found
            </h3>
            <p className="text-gray-400">
              {data && data.length > 0
                ? "Try adjusting your filters or search criteria"
                : "No pending orders available"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedData.map((company) => {
              const totalQuantity = company.items.reduce(
                (sum, item) => sum + item.pendingQuantity,
                0,
              );
              const isExpanded = expandedCompany === company.company;

              return (
                <div
                  key={company.company}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
                >
                  <div
                    onClick={() =>
                      setExpandedCompany(isExpanded ? null : company.company)
                    }
                    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {company.company}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {company.items.length} items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total Pending</p>
                          <p className="font-bold text-orange-600 text-lg">
                            {totalQuantity.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-gray-400">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-white border border-gray-300 overflow-auto">
                      <div className="overflow-x-auto max-h-[600px]">
                        <table className="w-full border-collapse text-sm text-center">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                Item
                              </th>
                              <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                Description
                              </th>
                              <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                Unit
                              </th>
                              <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                Pending Qty
                              </th>
                              <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                PO Breakdown
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-gray-100">
                            {company.items.map((item, index) => (
                              <tr
                                key={item.itemCode}
                                className={`hover:bg-blue-50 ${
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }`}
                              >
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <div className="inline-flex items-center rounded-xl bg-blue-50 px-3 py-1.5">
                                    <span className="font-mono text-sm font-semibold text-blue-700">
                                      {item.itemCode}
                                    </span>
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <div
                                    title={item.description}
                                    className="max-w-lg text-sm text-gray-700 line-clamp-2"
                                  >
                                    {item.description}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                    {item.unit}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                                      item.pendingQuantity > 1000
                                        ? "bg-red-100 text-red-700"
                                        : item.pendingQuantity > 500
                                          ? "bg-orange-100 text-orange-700"
                                          : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {item.pendingQuantity.toLocaleString()}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <div className="flex flex-wrap gap-2">
                                    {item.poDetails.map((po) => (
                                      <div
                                        key={po.poId}
                                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 transition group-hover:border-blue-200"
                                      >
                                        <div className="font-mono text-xs text-gray-600">
                                          {po.poNumber}
                                        </div>
                                        <div className="mt-1 text-sm font-semibold text-gray-900">
                                          {po.pendingQuantity.toLocaleString()}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingPOList;
