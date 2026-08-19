import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Package,
  Search,
  RefreshCw,
  Eye,
  MapPin,
  Calendar,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingDown,
  Filter,
  Download,
  Printer,
  MoreVertical,
  Edit,
  Trash2,
  ArrowUpDown,
  Building2,
  Hash,
  Layers,
  FileText,
  DownloadCloud,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  LayoutGrid,
  User,
  Calendar as CalendarIcon,
  Box,
  ClipboardList,
  Tag,
  Info,
  Zap,
  ShoppingCart,
  Warehouse,
  PackageCheck,
  PackageX,
  PackageOpen,
  TrendingUp,
  BarChart3,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL || "http://localhost:5000/api/v1";

const RejectedInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  const [filters, setFilters] = useState({
    status: "all",
    condition: "all",
    dateRange: "all",
    itemCode: "",
    poNumber: "",
    companyName: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [sortBy, setSortBy] = useState("addedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [stats, setStats] = useState({
    totalItems: 0,
    totalQuantity: 0,
    available: 0,
    allocated: 0,
    damaged: 0,
    returned: 0,
  });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder,
        ...filters,
        search: searchTerm,
      });

      const response = await axios.get(
        `${API_URL}/inventory?${params}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        setInventory(response.data.data);
        setTotalItems(response.data.pagination.total);
        setTotalPages(response.data.pagination.pages);
        await fetchStats();
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError(error.response?.data?.message || "Failed to load inventory");
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/inventory/stats`,
        { withCredentials: true },
      );

      if (response.data.success) {
        const data = response.data.data.overall;
        setStats({
          totalItems: data.totalItems || 0,
          totalQuantity: data.totalQuantity || 0,
          available: data.availableQuantity || 0,
          allocated: data.allocatedQuantity || 0,
          damaged: data.damagedQuantity || 0,
          returned: data.returnedQuantity || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, filters, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInventory();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      condition: "all",
      dateRange: "all",
      itemCode: "",
      poNumber: "",
      companyName: "",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const exportToCSV = () => {
    const headers = [
      "PO Number",
      "Company",
      "Item Code",
      "Description",
      "Batch Number",
      "Quantity",
      "Unit",
      "Storage Location",
      "Rack",
      "Shelf",
      "Status",
      "Condition",
      "Received Date",
      "Added By",
    ];

    const rows = inventory.map((item) => [
      item.poNumber,
      item.companyName,
      item.itemCode,
      item.description,
      item.batchNumber,
      item.quantity,
      item.unit || "pcs",
      `${item.storageLocation} - ${item.rackNumber} - ${item.shelfNumber}`,
      item.rackNumber,
      item.shelfNumber,
      item.status,
      item.condition,
      new Date(item.addedAt).toLocaleDateString(),
      item.addedByName || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rejected_inventory_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: "bg-emerald-50 text-emerald-700 border-emerald-200",
      allocated: "bg-blue-50 text-blue-700 border-blue-200",
      damaged: "bg-red-50 text-red-700 border-red-200",
      returned: "bg-slate-50 text-slate-700 border-slate-200",
    };
    return badges[status] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getConditionBadge = (condition) => {
    const badges = {
      excellent: "bg-emerald-50 text-emerald-700 border-emerald-200",
      good: "bg-blue-50 text-blue-700 border-blue-200",
      fair: "bg-amber-50 text-amber-700 border-amber-200",
      poor: "bg-red-50 text-red-700 border-red-200",
    };
    return badges[condition] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "available":
        return <PackageCheck className="w-4 h-4 text-emerald-600" />;
      case "allocated":
        return <PackageOpen className="w-4 h-4 text-blue-600" />;
      case "damaged":
        return <PackageX className="w-4 h-4 text-red-600" />;
      case "returned":
        return <RefreshCw className="w-4 h-4 text-slate-600" />;
      default:
        return <Package className="w-4 h-4 text-slate-600" />;
    }
  };

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(val => val !== "all" && val !== "").length;
  }, [filters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          </div>
          <p className="text-slate-700 font-medium">Loading inventory...</p>
          <p className="text-sm text-slate-400 mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 rounded-2xl to-indigo-600 px-8 py-6 shadow-lg shadow-indigo-500/10">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 ring-1 ring-white/20">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                  Rejected Inventory
                </h1>
                <p className="text-indigo-100 text-sm mt-0.5">
                  Manage and track rejected items in inventory
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition text-white text-sm font-medium ring-1 ring-white/20 hover:ring-white/30"
              >
                <DownloadCloud className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                onClick={fetchInventory}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition text-white text-sm font-medium ring-1 ring-white/20 hover:ring-white/30"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            label="Total Items"
            value={stats.totalItems}
            icon={Package}
            color="indigo"
          />
          <StatCard
            label="Total Quantity"
            value={stats.totalQuantity}
            icon={Layers}
            color="blue"
          />
          <StatCard
            label="Available"
            value={stats.available}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            label="Allocated"
            value={stats.allocated}
            icon={Clock}
            color="blue"
          />
          <StatCard
            label="Damaged"
            value={stats.damaged}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            label="Returned"
            value={stats.returned}
            icon={RefreshCw}
            color="slate"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by PO, Item Code, Description, or Batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm placeholder:text-slate-400"
              />
            </form>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition text-sm ${
                  activeFilterCount > 0
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg transition text-sm ${
                    viewMode === "table"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-lg transition text-sm ${
                    viewMode === "list"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="allocated">Allocated</option>
                  <option value="damaged">Damaged</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Condition
                </label>
                <select
                  value={filters.condition}
                  onChange={(e) => handleFilterChange("condition", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  <option value="all">All Conditions</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Item Code
                </label>
                <input
                  type="text"
                  value={filters.itemCode}
                  onChange={(e) => handleFilterChange("itemCode", e.target.value)}
                  placeholder="Enter item code"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  PO Number
                </label>
                <input
                  type="text"
                  value={filters.poNumber}
                  onChange={(e) => handleFilterChange("poNumber", e.target.value)}
                  placeholder="Enter PO number"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  value={filters.companyName}
                  onChange={(e) => handleFilterChange("companyName", e.target.value)}
                  placeholder="Enter company name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Inventory Items */}
        {error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-12 text-center shadow-sm">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchInventory}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        ) : inventory.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Warehouse className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-600 font-medium text-lg">No inventory items found</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchTerm || activeFilterCount > 0
                ? "Try adjusting your search or filters"
                : "No rejected items have been added to inventory yet"}
            </p>
          </div>
        ) : (
          <>
            {/* Excel-style Table View */}
            {viewMode === "table" && (
              <div className="overflow-hidden border border-slate-300 bg-white shadow-sm">
                {/* Excel-style sheet title bar */}
                <div className="flex flex-col gap-2 border-b border-slate-300 bg-[#217346] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <div className="grid h-7 w-7 place-items-center border border-white/20 bg-white/10">
                      <Grid className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide">
                        Rejected Inventory Worksheet
                      </p>
                      <p className="text-[10px] text-emerald-100">
                        {totalItems.toLocaleString("en-IN")} total record
                        {totalItems === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-emerald-50">
                    <span>
                      Page {currentPage} of {Math.max(totalPages, 1)}
                    </span>
                    <span className="hidden sm:inline">
                      Showing {inventory.length} row
                      {inventory.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="min-w-[2380px] w-full border-collapse table-fixed text-[11px] text-slate-700">
                    {/* Excel column letters */}
                    <thead className="sticky top-0 z-30">
                      <tr className="h-6 bg-slate-200 text-center text-[10px] font-semibold text-slate-600">
                        <th className="sticky left-0 z-50 w-12 border border-slate-300 bg-slate-300">
                          ▾
                        </th>
                        {[
                          "A",
                          "B",
                          "C",
                          "D",
                          "E",
                          "F",
                          "G",
                          "H",
                          "I",
                          "J",
                          "K",
                          "L",
                          "M",
                          "N",
                          "O",
                          "P",
                        ].map((letter) => (
                          <th
                            key={letter}
                            className="border border-slate-300 bg-slate-200 px-2 py-1"
                          >
                            {letter}
                          </th>
                        ))}
                        <th className="sticky right-0 z-50 w-24 border border-slate-300 bg-slate-300">
                          Q
                        </th>
                      </tr>

                      {/* Field header row */}
                      <tr className="bg-[#E2EFDA] text-left text-[10px] font-bold uppercase tracking-wide text-slate-700">
                        <th className="sticky left-0 z-50 w-12 border border-slate-300 bg-slate-200 px-2 py-2 text-center">
                          #
                        </th>

                        <th className="w-[145px] border border-slate-300 px-2 py-2">
                          <button
                            type="button"
                            onClick={() => handleSort("itemCode")}
                            className="flex w-full items-center justify-between gap-1 text-left hover:text-[#217346]"
                          >
                            Item Code
                            <ArrowUpDown className="h-3 w-3 shrink-0" />
                          </button>
                        </th>

                        <th className="w-[300px] border border-slate-300 px-2 py-2">
                          Description
                        </th>

                        <th className="w-[135px] border border-slate-300 px-2 py-2">
                          <button
                            type="button"
                            onClick={() => handleSort("poNumber")}
                            className="flex w-full items-center justify-between gap-1 text-left hover:text-[#217346]"
                          >
                            PO Number
                            <ArrowUpDown className="h-3 w-3 shrink-0" />
                          </button>
                        </th>

                        <th className="w-[170px] border border-slate-300 px-2 py-2">
                          Company
                        </th>

                        <th className="w-[125px] border border-slate-300 px-2 py-2">
                          <button
                            type="button"
                            onClick={() => handleSort("batchNumber")}
                            className="flex w-full items-center justify-between gap-1 text-left hover:text-[#217346]"
                          >
                            Batch
                            <ArrowUpDown className="h-3 w-3 shrink-0" />
                          </button>
                        </th>

                        <th className="w-[95px] border border-slate-300 px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleSort("quantity")}
                            className="flex w-full items-center justify-end gap-1 hover:text-[#217346]"
                          >
                            Quantity
                            <ArrowUpDown className="h-3 w-3 shrink-0" />
                          </button>
                        </th>

                        <th className="w-[70px] border border-slate-300 px-2 py-2 text-center">
                          Unit
                        </th>

                        <th className="w-[175px] border border-slate-300 px-2 py-2">
                          Storage Location
                        </th>

                        <th className="w-[90px] border border-slate-300 px-2 py-2">
                          Rack
                        </th>

                        <th className="w-[90px] border border-slate-300 px-2 py-2">
                          Shelf
                        </th>

                        <th className="w-[125px] border border-slate-300 px-2 py-2">
                          Status
                        </th>

                        <th className="w-[115px] border border-slate-300 px-2 py-2">
                          Condition
                        </th>

                        <th className="w-[120px] border border-slate-300 px-2 py-2">
                          Received Date
                        </th>

                        <th className="w-[120px] border border-slate-300 px-2 py-2">
                          <button
                            type="button"
                            onClick={() => handleSort("addedAt")}
                            className="flex w-full items-center justify-between gap-1 text-left hover:text-[#217346]"
                          >
                            Added Date
                            <ArrowUpDown className="h-3 w-3 shrink-0" />
                          </button>
                        </th>

                        <th className="w-[190px] border border-slate-300 px-2 py-2">
                          Added By
                        </th>

                        <th className="w-[170px] border border-slate-300 px-2 py-2">
                          Notes
                        </th>

                        <th className="sticky right-0 z-50 w-24 border border-slate-300 bg-[#E2EFDA] px-2 py-2 text-center">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {inventory.map((item, index) => {
                        const rowNumber =
                          (currentPage - 1) * itemsPerPage + index + 1;

                        return (
                          <tr
                            key={item._id}
                            onDoubleClick={() => handleViewDetails(item)}
                            className="group bg-white hover:bg-[#EAF4E4]"
                          >
                            {/* Excel row number */}
                            <td className="sticky left-0 z-20 border border-slate-300 bg-slate-100 px-2 py-1.5 text-center font-mono text-[10px] font-semibold text-slate-500 group-hover:bg-[#D9EAD3]">
                              {rowNumber}
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5 font-mono font-semibold text-slate-800">
                              <div
                                className="truncate"
                                title={item.itemCode || "-"}
                              >
                                {item.itemCode || "-"}
                              </div>
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5">
                              <div
                                className="truncate"
                                title={item.description || "-"}
                              >
                                {item.description || "-"}
                              </div>
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5 font-mono">
                              <div
                                className="truncate"
                                title={item.poNumber || "-"}
                              >
                                {item.poNumber || "-"}
                              </div>
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5">
                              <div
                                className="truncate"
                                title={item.companyName || "-"}
                              >
                                {item.companyName || "-"}
                              </div>
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5 font-mono">
                              {item.batchNumber || "-"}
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold tabular-nums text-slate-900">
                              {Number(item.quantity || 0).toLocaleString("en-IN")}
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5 text-center">
                              {item.unit || "pcs"}
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5">
                              <div
                                className="truncate"
                                title={item.storageLocation || "-"}
                              >
                                {item.storageLocation || "-"}
                              </div>
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5 font-mono">
                              {item.rackNumber || "-"}
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5 font-mono">
                              {item.shelfNumber || "-"}
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5">
                              <span
                                className={`inline-flex max-w-full items-center gap-1 border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${getStatusBadge(
                                  item.status,
                                )}`}
                              >
                                {getStatusIcon(item.status)}
                                <span className="truncate">
                                  {item.status || "-"}
                                </span>
                              </span>
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5">
                              <span
                                className={`inline-flex max-w-full border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${getConditionBadge(
                                  item.condition,
                                )}`}
                              >
                                {item.condition || "-"}
                              </span>
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                              {item.receivedDate
                                ? new Date(item.receivedDate).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    },
                                  )
                                : "-"}
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                              {item.addedAt
                                ? new Date(item.addedAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    },
                                  )
                                : "-"}
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5">
                              <div
                                className="truncate"
                                title={item.addedByName || "-"}
                              >
                                {item.addedByName || "-"}
                              </div>
                            </td>

                            <td className="border border-slate-300 px-2 py-1.5">
                              <div
                                className="truncate text-slate-500"
                                title={item.notes || "-"}
                              >
                                {item.notes || "-"}
                              </div>
                            </td>

                            <td className="sticky right-0 z-20 border border-slate-300 bg-white px-2 py-1 text-center group-hover:bg-[#EAF4E4]">
                              <button
                                type="button"
                                onClick={() => handleViewDetails(item)}
                                className="inline-flex items-center gap-1 border border-[#217346] bg-white px-2 py-1 text-[10px] font-semibold text-[#217346] transition hover:bg-[#217346] hover:text-white"
                                title="View inventory details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Excel-style worksheet status bar */}
                <div className="flex flex-col gap-1 border-t border-slate-300 bg-slate-100 px-3 py-2 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-semibold text-[#217346]">
                      Ready
                    </span>
                    <span>
                      Records: {inventory.length.toLocaleString("en-IN")}
                    </span>
                    <span>
                      Total Qty:{" "}
                      {inventory
                        .reduce(
                          (sum, item) => sum + Number(item.quantity || 0),
                          0,
                        )
                        .toLocaleString("en-IN")}
                    </span>
                  </div>

                  <span className="text-slate-400">
                    Double-click a row to open details
                  </span>
                </div>
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-3">
                {inventory.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all hover:border-indigo-200 cursor-pointer"
                    onClick={() => handleViewDetails(item)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                          {getStatusIcon(item.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <span className="font-semibold text-slate-800">
                              {item.itemCode}
                            </span>
                            <span className="text-sm text-slate-500 truncate">
                              {item.description}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-slate-400" />
                              {item.poNumber}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Hash className="w-3.5 h-3.5 text-slate-400" />
                              {item.batchNumber || "N/A"}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                              <Package className="w-3.5 h-3.5 text-slate-400" />
                              {item.quantity} {item.unit || "pcs"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {item.storageLocation}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}
                        >
                          {item.status}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getConditionBadge(item.condition)}`}
                        >
                          {item.condition}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(item);
                          }}
                          className="p-2 hover:bg-indigo-100 rounded-lg transition text-indigo-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 bg-white rounded-2xl border border-slate-200/80 px-6 py-4 shadow-sm">
                <p className="text-sm text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                  {totalItems} items
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm disabled:opacity-40 hover:bg-slate-50 transition flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm disabled:opacity-40 hover:bg-slate-50 transition flex items-center gap-1.5"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>


      {/* Details Modal */}
      {showDetailsModal && selectedItem && (
        <InventoryDetailsModal
          item={selectedItem}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-50 text-slate-600",
  };

  const valueColorClasses = {
    indigo: "text-indigo-700",
    blue: "text-blue-700",
    emerald: "text-emerald-700",
    red: "text-red-700",
    slate: "text-slate-700",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {label}
          </p>
          <p className={`text-2xl font-bold ${valueColorClasses[color]}`}>
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-2.5 ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

// Inventory Details Modal Component
// Inventory Details Modal Component - Excel Style
const InventoryDetailsModal = ({ item, onClose }) => {
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status) => {
    const badges = {
      quarantine: "bg-amber-50 text-amber-700 border-amber-200",
      available: "bg-emerald-50 text-emerald-700 border-emerald-200",
      allocated: "bg-blue-50 text-blue-700 border-blue-200",
      damaged: "bg-red-50 text-red-700 border-red-200",
      returned: "bg-slate-50 text-slate-700 border-slate-200",
      rework: "bg-blue-50 text-blue-700 border-blue-200",
      scrap: "bg-red-50 text-red-700 border-red-200",
      return_to_customer: "bg-violet-50 text-violet-700 border-violet-200",
      approved_for_reuse: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pending_review: "bg-amber-50 text-amber-700 border-amber-200",
      denied: "bg-red-50 text-red-700 border-red-200",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      recorded: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return badges[status] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getConditionBadge = (condition) => {
    const badges = {
      excellent: "bg-emerald-50 text-emerald-700 border-emerald-200",
      good: "bg-blue-50 text-blue-700 border-blue-200",
      fair: "bg-amber-50 text-amber-700 border-amber-200",
      poor: "bg-red-50 text-red-700 border-red-200",
    };
    return badges[condition] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Excel-style Header */}
        <div className="bg-[#217346] px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 rounded-lg p-1.5">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">
                Inventory Details
              </h2>
              <div className="flex items-center gap-2 text-sm text-emerald-100">
                <span className="font-mono">{item.itemCode || "-"}</span>
                <span className="w-1 h-1 rounded-full bg-emerald-300/50" />
                <span>PO #{item.poNumber || "-"}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content - Excel Style Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {/* Status Bar - Excel-style ribbon */}
          <div className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(item.status || "quarantine")}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {(item.status || "QUARANTINE").toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Condition:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border ${getConditionBadge(item.condition || "good")}`}
              >
                {(item.condition || "GOOD").toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Added:</span>
              <span className="text-xs text-slate-700">
                {item.addedAt ? new Date(item.addedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }) : "19 Aug 2026"}
              </span>
            </div>
          </div>

          {/* Excel-style Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column - Item Information */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-[#E2EFDA] px-3 py-1.5 border-b border-slate-200">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-[#217346]" />
                  Item Information
                </h4>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50/50 w-1/3">Item Code</td>
                    <td className="px-3 py-2 text-sm font-medium text-slate-800">{item.itemCode || "-"}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50/50">Description</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{item.description || "-"}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50/50">PO Number</td>
                    <td className="px-3 py-2 text-sm font-medium text-slate-800">{item.poNumber || "-"}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50/50">Company</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{item.companyName || "-"}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50/50">Batch Number</td>
                    <td className="px-3 py-2 text-sm font-mono text-slate-800">{item.batchNumber || "N/A"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Column - Quantity & Location */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-[#E2EFDA] px-3 py-1.5 border-b border-slate-200">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-[#217346]" />
                  Quantity & Location
                </h4>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50/50 w-1/3">Quantity</td>
                    <td className="px-3 py-2 text-sm font-bold text-slate-800">
                      {item.quantity || 0} {item.unit || "pcs"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50/50">Storage Location</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{item.storageLocation || "-"}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50/50">Rack Number</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{item.rackNumber || "-"}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50/50">Shelf Number</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{item.shelfNumber || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Dates Section - Excel Style */}
          <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-[#E2EFDA] px-3 py-1.5 border-b border-slate-200">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#217346]" />
                Dates
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
              <div className="px-3 py-2 flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 w-28 shrink-0">Received Date</span>
                <span className="text-sm text-slate-700">
                  {item.receivedDate
                    ? new Date(item.receivedDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "19 Aug 2026"}
                </span>
              </div>
              <div className="px-3 py-2 flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 w-28 shrink-0">Added By</span>
                <span className="text-sm text-slate-700">{item.addedByName || "hgptools@gmail.com"}</span>
              </div>
              {item.manufactureDate && (
                <div className="px-3 py-2 flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200">
                  <span className="text-xs font-medium text-slate-500 w-28 shrink-0">Manufacture Date</span>
                  <span className="text-sm text-slate-700">
                    {new Date(item.manufactureDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {item.expiryDate && (
                <div className="px-3 py-2 flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200">
                  <span className="text-xs font-medium text-slate-500 w-28 shrink-0">Expiry Date</span>
                  <span className="text-sm text-slate-700">
                    {new Date(item.expiryDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section - Excel Style */}
          {item.notes && (
            <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-[#E2EFDA] px-3 py-1.5 border-b border-slate-200">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#217346]" />
                  Notes
                </h4>
              </div>
              <div className="px-3 py-2">
                <p className="text-sm text-slate-700">{item.notes}</p>
              </div>
            </div>
          )}

          {/* Movement History - Excel Style */}
          {item.movementHistory && item.movementHistory.length > 0 && (
            <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-[#E2EFDA] px-3 py-1.5 border-b border-slate-200 flex justify-between items-center">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#217346]" />
                  Movement History
                </h4>
                <span className="text-xs text-slate-500">{item.movementHistory.length} entries</span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 sticky top-0">
                    <tr>
                      <th className="px-3 py-1.5 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                      <th className="px-3 py-1.5 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                      <th className="px-3 py-1.5 text-left text-xs font-medium text-slate-500 uppercase">Quantity</th>
                      <th className="px-3 py-1.5 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {item.movementHistory.slice().reverse().map((movement, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="px-3 py-1.5 text-xs text-slate-600">
                          {new Date(movement.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-1.5 text-xs font-medium capitalize text-slate-700">
                          {movement.action}
                        </td>
                        <td className="px-3 py-1.5 text-xs text-slate-600">
                          {movement.quantity} {item.unit || "pcs"}
                        </td>
                        <td className="px-3 py-1.5 text-xs text-slate-500 max-w-[150px] truncate">
                          {movement.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-4 py-2.5 bg-[#F5F5F5] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 transition text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectedInventory;