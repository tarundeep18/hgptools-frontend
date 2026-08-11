// components/RejectedInventory.jsx
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";

const RejectedInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // table, grid, list

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    condition: "all",
    dateRange: "all",
    itemCode: "",
    poNumber: "",
    companyName: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Sort states
  const [sortBy, setSortBy] = useState("addedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Stats
  const [stats, setStats] = useState({
    totalItems: 0,
    totalQuantity: 0,
    available: 0,
    allocated: 0,
    damaged: 0,
    returned: 0,
  });

  // Fetch rejected inventory
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder,
        ...filters,
        search: searchTerm,
      });

      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/inventory?${params}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        setInventory(response.data.data);
        setTotalItems(response.data.pagination.total);
        setTotalPages(response.data.pagination.pages);

        // Also fetch stats
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

  // Fetch inventory stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/inventory/stats`,
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

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInventory();
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  // Reset filters
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

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Handle view details
  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  // Export to CSV
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

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      available: "bg-green-100 text-green-700",
      allocated: "bg-blue-100 text-blue-700",
      damaged: "bg-red-100 text-red-700",
      returned: "bg-gray-100 text-gray-700",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  // Get condition badge
  const getConditionBadge = (condition) => {
    const badges = {
      excellent: "bg-green-100 text-green-700",
      good: "bg-blue-100 text-blue-700",
      fair: "bg-yellow-100 text-yellow-700",
      poor: "bg-red-100 text-red-700",
    };
    return badges[condition] || "bg-gray-100 text-gray-700";
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "available":
        return <PackageCheck className="w-4 h-4 text-green-600" />;
      case "allocated":
        return <PackageOpen className="w-4 h-4 text-blue-600" />;
      case "damaged":
        return <PackageX className="w-4 h-4 text-red-600" />;
      case "returned":
        return <Package className="w-4 h-4 text-gray-600" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading inventory...</p>
          <p className="text-sm text-gray-400 mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
      {/* Header */}
     <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
    {/* Left Section */}
    <div className="flex-1">
      <div className="flex items-center gap-3">
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 sm:p-3">
          <Warehouse className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Rejected Inventory
          </h1>

          <p className="text-blue-100 text-sm sm:text-base mt-1">
            Manage and track rejected items in inventory
          </p>
        </div>
      </div>
    </div>

    {/* Right Section */}
    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
      <button
        onClick={exportToCSV}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition text-white text-sm font-medium w-full sm:w-auto"
      >
        <DownloadCloud className="w-4 h-4" />
        <span>Export</span>
      </button>

      <button
        onClick={fetchInventory}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition text-white text-sm font-medium w-full sm:w-auto"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Refresh</span>
      </button>
    </div>
  </div>
</div>

      <div className="max-w-8xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Items</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalItems}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-2">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Quantity</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalQuantity}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.available}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Allocated</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.allocated}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Damaged</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.damaged}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Returned</p>
                <p className="text-2xl font-bold text-gray-600">
                  {stats.returned}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by PO, Item Code, Description, or Batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition text-sm"
              />
            </form>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition text-sm"
              >
                <Filter className="w-4 h-4" />
                Filters
                {Object.values(filters).some(
                  (val) => val !== "all" && val !== "",
                ) && (
                  <span className="bg-purple-600 text-white text-xs rounded-full px-2 py-0.5">
                    {
                      Object.values(filters).filter(
                        (val) => val !== "all" && val !== "",
                      ).length
                    }
                  </span>
                )}
              </button>

              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg transition text-sm ${
                    viewMode === "table"
                      ? "bg-white shadow-sm"
                      : "hover:bg-white/50"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-lg transition text-sm ${
                    viewMode === "list"
                      ? "bg-white shadow-sm"
                      : "hover:bg-white/50"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="allocated">Allocated</option>
                  <option value="damaged">Damaged</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Condition
                </label>
                <select
                  value={filters.condition}
                  onChange={(e) =>
                    handleFilterChange("condition", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="all">All Conditions</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Item Code
                </label>
                <input
                  type="text"
                  value={filters.itemCode}
                  onChange={(e) =>
                    handleFilterChange("itemCode", e.target.value)
                  }
                  placeholder="Enter item code"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  PO Number
                </label>
                <input
                  type="text"
                  value={filters.poNumber}
                  onChange={(e) =>
                    handleFilterChange("poNumber", e.target.value)
                  }
                  placeholder="Enter PO number"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={filters.companyName}
                  onChange={(e) =>
                    handleFilterChange("companyName", e.target.value)
                  }
                  placeholder="Enter company name"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Inventory Items */}
        {inventory.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Warehouse className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">
              No inventory items found
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm ||
              Object.values(filters).some((val) => val !== "all" && val !== "")
                ? "Try adjusting your search or filters"
                : "No rejected items have been added to inventory yet"}
            </p>
          </div>
        ) : (
          <>
            {/* Table View */}
            {viewMode === "table" && (
              <div className="bg-white border border-gray-300 overflow-auto">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm text-center">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleSort("itemCode")}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            Item
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleSort("poNumber")}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            PO Number
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleSort("batchNumber")}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            Batch
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleSort("quantity")}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            Qty
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          Location
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          Status
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          Condition
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleSort("addedAt")}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            Added Date
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {inventory.map((item, index) => (
                        <tr
                          key={item._id}
                          className={`hover:bg-blue-50 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">
                                {item.itemCode}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                {item.description}
                              </p>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <span className="font-mono text-sm text-gray-600">
                              {item.poNumber}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <span className="px-2 py-1 text-xs font-mono bg-amber-50 text-amber-700 rounded-md">
                              {item.batchNumber}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <span className="font-semibold text-gray-800">
                              {item.quantity} {item.unit || "pcs"}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-600">
                                {item.storageLocation} - R{item.rackNumber} S
                                {item.shelfNumber}
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}
                            >
                              {getStatusIcon(item.status)}
                              {item.status}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${getConditionBadge(item.condition)}`}
                            >
                              {item.condition}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            {new Date(item.addedAt).toLocaleDateString()}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="p-1.5 hover:bg-purple-50 rounded-lg transition text-purple-600"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-3">
                {inventory.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all hover:border-purple-200 cursor-pointer flex items-center justify-between"
                    onClick={() => handleViewDetails(item)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-purple-50 rounded-lg p-2">
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-gray-800">
                            {item.itemCode}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.description}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-gray-400" />
                            {item.poNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3 text-gray-400" />
                            {item.batchNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-gray-400" />
                            {item.quantity} {item.unit || "pcs"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {item.storageLocation}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}
                      >
                        {item.status}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getConditionBadge(item.condition)}`}
                      >
                        {item.condition}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(item);
                        }}
                        className="p-1.5 hover:bg-purple-50 rounded-lg transition text-purple-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 bg-white rounded-xl border border-gray-100 px-6 py-4">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                  {totalItems} items
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1"
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

// Inventory Details Modal Component
const InventoryDetailsModal = ({ item, onClose }) => {
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status) => {
    const badges = {
      available: "bg-green-100 text-green-700",
      allocated: "bg-blue-100 text-blue-700",
      damaged: "bg-red-100 text-red-700",
      returned: "bg-gray-100 text-gray-700",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  const getConditionBadge = (condition) => {
    const badges = {
      excellent: "bg-green-100 text-green-700",
      good: "bg-blue-100 text-blue-700",
      fair: "bg-yellow-100 text-yellow-700",
      poor: "bg-red-100 text-red-700",
    };
    return badges[condition] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-2">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Inventory Details
                  </h2>
                  <p className="text-purple-100 text-sm">
                    {item.itemCode} - {item.poNumber}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Status and Condition */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Status:
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}
                >
                  {item.status?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Condition:
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getConditionBadge(item.condition)}`}
                >
                  {item.condition?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Added:
                </span>
                <span className="text-sm text-gray-700">
                  {new Date(item.addedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-purple-500" />
                  Item Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Item Code</span>
                    <span className="font-medium">{item.itemCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Description</span>
                    <span className="font-medium">{item.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">PO Number</span>
                    <span className="font-medium">{item.poNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Company</span>
                    <span className="font-medium">{item.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Batch Number</span>
                    <span className="font-medium">#{item.batchNumber}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-500" />
                  Quantity & Location
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantity</span>
                    <span className="font-bold text-gray-800">
                      {item.quantity} {item.unit || "pcs"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Storage Location</span>
                    <span className="font-medium">{item.storageLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rack Number</span>
                    <span className="font-medium">{item.rackNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shelf Number</span>
                    <span className="font-medium">{item.shelfNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-purple-500" />
                Dates
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Received Date</span>
                  <p className="font-medium">
                    {item.receivedDate
                      ? new Date(item.receivedDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                {item.manufactureDate && (
                  <div>
                    <span className="text-gray-500">Manufacture Date</span>
                    <p className="font-medium">
                      {new Date(item.manufactureDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {item.expiryDate && (
                  <div>
                    <span className="text-gray-500">Expiry Date</span>
                    <p className="font-medium">
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Added By</span>
                  <p className="font-medium">{item.addedByName || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {item.notes && (
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </h4>
                <p className="text-sm text-yellow-700">{item.notes}</p>
              </div>
            )}

            {/* Movement History */}
            {item.movementHistory && item.movementHistory.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  Movement History
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {item.movementHistory
                    .slice()
                    .reverse()
                    .map((movement, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm border-b border-gray-100 pb-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {movement.action}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span>
                            {movement.quantity} {item.unit || "pcs"}
                          </span>
                        </div>
                        <div className="text-gray-400 text-xs">
                          {new Date(movement.date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectedInventory;
