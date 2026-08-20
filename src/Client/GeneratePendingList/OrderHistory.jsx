import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Package,
  Loader2,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  FileMinus,
  Building2,
  Shield,
  Eye,
  Filter,
  Calendar,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Save,
  Upload,
  FileText,
  Download,
  Plus,
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Funnel,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const OrderHistory = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingDispatch, setViewingDispatch] = useState(null);
  const [editFormData, setEditFormData] = useState({
    dispatchQuantity: "",
    dispatchDate: "",
    batchNumber: "",
    notes: "",
    billNumber: "",
    billFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const userCompany =
    user?.companyName ||
    user?.company?.name ||
    (typeof user?.company === "string" ? user.company : "") ||
    user?.companyname ||
    user?.clientCompany ||
    user?.customerName ||
    user?.organization?.name ||
    "";

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const res = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch/history`,
        {
          withCredentials: true,
        },
      );

      if (res.data.success) {
        const groups = Array.isArray(res.data.data) ? res.data.data : [];

        // API returns:
        // [
        //   {
        //     billNumber,
        //     dispatchDate,
        //     entries: [...]
        //   }
        // ]
        //
        // Flatten every bill's entries into individual table rows.
        let formatted = groups
          .flatMap((group) => {
            const entries = Array.isArray(group.entries) ? group.entries : [];

            return entries.map((entry) => ({
              // Unique row ID
              id:
                entry._id ||
                `${entry.dispatchId}-${entry.poId}-${entry.itemCode}`,

              dispatchId: entry.dispatchId,
              poId: entry.poId,

              // Accept both the current grouped API names and legacy aliases.
              orderNumber: entry.po || entry.poNumber || "",

              companyName: entry.company || entry.companyName || "",

              itemId: entry.itemId || null,
              itemCode: entry.itemCode || "",

              description: entry.item || entry.itemDescription || "",

              drawing: entry.drawing || "",

              quantity: Number(entry.dispatchQty ?? entry.quantity ?? 0),

              originalPending: Number(entry.originalPending || 0),
              newPending: Number(entry.newPending || 0),

              batchNumber: entry.batchNumber || "",

              // Prefer entry date, fallback to group date
              date:
                entry.dispatchDate ||
                group.dispatchDate ||
                entry.createdAt ||
                "",

              dispatchDate: entry.dispatchDate || group.dispatchDate || "",

              dispatchedBy: entry.dispatchedBy || entry.createdBy || "System",

              notes: entry.remarks || entry.notes || "",
              remarks: entry.remarks || entry.notes || group.remarks || "",

              transportMode: entry.transportMode || group.transportMode || "",

              trackingNumber: entry.trackingNumber || "",

              receivedBy: entry.receivedBy || group.receivedBy || "",

              createdAt:
                entry.createdAt ||
                entry.timestamp ||
                entry.dispatchDate ||
                group.dispatchDate,

              // Prefer entry bill number
              billNumber: entry.billNumber || group.billNumber || "",

              billFile: entry.billFile || group.billFile || null,

              status: entry.status || "confirmed",

              isBulkDispatch: Boolean(entry.isBulkDispatch),

              totalItemsDispatched:
                entry.totalItemsDispatched ?? group.totalItems ?? 0,

              totalQuantityDispatched:
                entry.totalQuantityDispatched ?? group.totalQuantity ?? 0,
            }));
          })
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.dispatchDate || 0) -
              new Date(a.createdAt || a.dispatchDate || 0),
          );

        console.log("Raw Dispatch API:", res.data.data);
        console.log("Formatted Dispatch Rows:", formatted);

        // Client can only see its own company
        if (!isAdmin && userCompany) {
          const normalizedUserCompany = String(userCompany)
            .toLowerCase()
            .trim();

          formatted = formatted.filter((item) => {
            const normalizedItemCompany = String(item.companyName || "")
              .toLowerCase()
              .trim();

            return normalizedItemCompany === normalizedUserCompany;
          });
        }

        setData(formatted);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch dispatch timeline:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin && !userCompany) {
      setData([]);
      setIsLoading(false);
      return;
    }

    fetchData();
  }, [isAdmin, userCompany]);

  // Get unique companies for filter (admin only)
  const uniqueCompanies = isAdmin
    ? ["all", ...new Set(data.map((item) => item.companyName).filter(Boolean))]
    : [];

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Apply all filters
  const filteredData = data.filter((row) => {
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !searchTerm ||
      row.orderNumber?.toLowerCase().includes(search) ||
      row.companyName?.toLowerCase().includes(search) ||
      row.description?.toLowerCase().includes(search) ||
      row.itemCode?.toLowerCase().includes(search) ||
      row.drawing?.toString().toLowerCase().includes(search) ||
      row.billNumber?.toString().toLowerCase().includes(search) ||
      row.status?.toString().toLowerCase().includes(search) ||
      row.batchNumber?.toString().toLowerCase().includes(search);

    const matchesCompany =
      !isAdmin ||
      selectedCompany === "all" ||
      row.companyName === selectedCompany;

    let matchesDate = true;
    if (dateFilter && row.date) {
      const rowDate = new Date(row.date).toDateString();
      const filterDate = new Date(dateFilter).toDateString();
      matchesDate = rowDate === filterDate;
    }

    return matchesSearch && matchesCompany && matchesDate;
  });

  // Apply sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;

    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle different data types
    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Calculate pagination with dynamic rowsPerPage
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Reset to page 1 when filters or rows per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCompany, dateFilter, rowsPerPage]);

  const handleView = (row) => {
    if (!row) return;
    setViewingDispatch(row);
  };

  const handleEdit = async (row) => {
    if (!isAdmin) {
      alert("Only administrators can edit dispatch records.");
      return;
    }

    try {
      // Fetch full dispatch details
      const res = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch/dispatch-orders/${row.dispatchId}?poId=${encodeURIComponent(row.poId || "")}`,
        { withCredentials: true },
      );

      if (res.data.success) {
        const dispatch = res.data.data;
        setEditingDispatch(dispatch);
        setEditFormData({
          dispatchQuantity: dispatch.dispatchQuantity,
          dispatchDate:
            dispatch.dispatchDate?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          batchNumber: dispatch.batchNumber,
          notes: dispatch.notes || "",
          billNumber: dispatch.billNumber || "",
          billFile: null,
        });
        setIsEditModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch dispatch details:", error);
      alert("Failed to load dispatch details for editing.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("poId", editingDispatch.poId || "");
      formData.append("dispatchQuantity", editFormData.dispatchQuantity);
      formData.append("dispatchDate", editFormData.dispatchDate);
      formData.append("batchNumber", editFormData.batchNumber);
      formData.append("notes", editFormData.notes);
      formData.append("billNumber", editFormData.billNumber);

      if (editFormData.billFile) {
        formData.append("billFile", editFormData.billFile);
      }

      const res = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch/dispatch-orders/${editingDispatch.dispatchId}?poId=${encodeURIComponent(editingDispatch.poId || "")}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (res.data.success) {
        alert("Dispatch record updated successfully!");
        setIsEditModalOpen(false);
        setEditingDispatch(null);
        fetchData(); // Refresh the data
      }
    } catch (error) {
      console.error("Failed to update dispatch:", error);
      alert(
        error.response?.data?.message || "Failed to update dispatch record.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!isAdmin) {
      alert("Only administrators can delete dispatch records.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete dispatch record for PO ${row.orderNumber}?\n\nItem: ${row.itemCode}\nQuantity: ${row.quantity}\nThis action cannot be undone.`,
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch/dispatch-orders/${row.dispatchId}?poId=${encodeURIComponent(row.poId || "")}`,
        { withCredentials: true },
      );

      setData((prev) =>
        prev.filter(
          (item) =>
            !(
              item.dispatchId === row.dispatchId &&
              String(item.poId || "") === String(row.poId || "")
            ),
        ),
      );
      alert("Dispatch record deleted successfully.");
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error.response?.data?.message || "Failed to delete record.");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCompany("all");
    setDateFilter("");
    setShowFilters(false);
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = String(status || "")
      .trim()
      .toLowerCase();

    const statusConfig = {
      completed: {
        icon: CheckCircle,
        classes: "bg-green-50 text-green-700 border-green-200",
        label: "Completed",
      },

      full: {
        icon: CheckCircle,
        classes: "bg-green-50 text-green-700 border-green-200",
        label: "Completed",
      },

      confirmed: {
        icon: CheckCircle,
        classes: "bg-green-50 text-green-700 border-green-200",
        label: "Confirmed",
      },

      partial: {
        icon: Clock,
        classes: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Partial",
      },

      pending: {
        icon: Clock,
        classes: "bg-yellow-50 text-yellow-700 border-yellow-200",
        label: "Pending",
      },

      cancelled: {
        icon: AlertCircle,
        classes: "bg-red-50 text-red-700 border-red-200",
        label: "Cancelled",
      },
    };

    const config = statusConfig[normalizedStatus] || {
      icon: Clock,
      classes: "bg-gray-50 text-gray-700 border-gray-200",
      label: status || "Unknown",
    };

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1
        rounded-full text-xs font-medium border ${config.classes}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <Funnel className="w-3 h-3 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3 text-blue-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-600" />
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Welcome Banner */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-6 sm:mb-8 overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4 shadow-xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute -top-24 -right-24 w-72 sm:w-96 h-72 sm:h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-32 -left-32 w-72 sm:w-96 h-72 sm:h-96 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative px-2 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                {/* Left Section */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 backdrop-blur-sm shadow-lg shrink-0">
                    <FileMinus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                      Dispatch History
                    </h1>

                    <p className="mt-2 text-sm sm:text-base lg:text-lg text-blue-100">
                      {isAdmin
                        ? "Monitor all dispatched orders across companies"
                        : "Track your company's dispatch history"}
                    </p>
                  </div>
                </div>

                {/* Right Badge */}
                <div className="w-full lg:w-auto">
                  <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 py-3 border border-white/20">
                    {isAdmin ? (
                      <>
                        <Shield className="w-5 h-5 text-yellow-300" />
                        <span className="text-sm sm:text-base text-white font-medium">
                          Admin Access
                        </span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-5 h-5 text-blue-200" />
                        <span className="text-sm sm:text-base text-white font-medium truncate max-w-[180px] sm:max-w-none">
                          {userCompany || "Client"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Search Input - Positioned on left */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search po number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
              />
            </div>

            {/* Action Buttons - Positioned on right */}
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium shadow-sm">
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
                </button>
              )}
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition text-sm font-medium shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg transition text-sm font-medium shadow-sm ${
                  showFilters
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                }`}
              >
                <Filter className="w-4 h-4" /> Filter
                {(selectedCompany !== "all" || dateFilter || searchTerm) && (
                  <span className="ml-1 w-2 h-2 bg-white rounded-full"></span>
                )}
              </button>
            </div>
          </div>

          {/* ====== FILTER DROPDOWN (YOUR ORIGINAL UI) ====== */}
          {showFilters && (
            <div className="relative z-20 mt-4">
              <div className="absolute left-0 top-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64">
                <div className="space-y-3">
                  {/* Sort options */}
                  <div className="border-b border-gray-100 pb-2">
                    <button
                      onClick={() => handleSort("orderNumber")}
                      className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700"
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-gray-500" /> Sort A
                      to Z
                    </button>
                    <button
                      onClick={() => handleSort("orderNumber")}
                      className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-gray-500" /> Sort Z
                      to A
                    </button>
                  </div>

                  {/* Filter Items */}
                  <div className="border-b border-gray-100 pb-2">
                    <div className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm text-gray-700">
                      <span className="font-medium">Text Filters</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Filter Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Company Filter for Admin */}
                  {isAdmin && (
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      <label className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer text-sm text-gray-700">
                        <input
                          type="radio"
                          name="company"
                          checked={selectedCompany === "all"}
                          onChange={() => setSelectedCompany("all")}
                          className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                        />{" "}
                        All Companies
                      </label>
                      {uniqueCompanies
                        .filter((c) => c !== "all")
                        .map((company) => (
                          <label
                            key={company}
                            className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer text-sm text-gray-700"
                          >
                            <input
                              type="radio"
                              name="company"
                              checked={selectedCompany === company}
                              onChange={() => setSelectedCompany(company)}
                              className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                            />{" "}
                            {company}
                          </label>
                        ))}
                    </div>
                  )}

                  {/* Date Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Dispatch Date
                    </label>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Filter Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 mt-2">
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 shadow-sm"
                    >
                      OK
                    </button>
                    <button
                      onClick={clearFilters}
                      className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====== TABLE (YOUR ORIGINAL UI) ====== */}
        <div className="bg-white border border-gray-300 overflow-auto">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                    #
                  </th>
                  <th
                    className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("orderNumber")}
                  >
                    <div className="flex items-center gap-1">
                      PO Number
                      <div className="flex flex-col -space-y-1">
                        {renderSortIcon("orderNumber")}
                      </div>
                    </div>
                  </th>
                  {isAdmin && (
                    <th
                      className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("companyName")}
                    >
                      <div className="flex items-center gap-1">
                        Company
                        <div className="flex flex-col -space-y-1">
                          {renderSortIcon("companyName")}
                        </div>
                      </div>
                    </th>
                  )}
                  <th
                    className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("itemCode")}
                  >
                    <div className="flex items-center gap-1">
                      Item Details
                      <div className="flex flex-col -space-y-1">
                        {renderSortIcon("itemCode")}
                      </div>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Qty
                      <div className="flex flex-col -space-y-1">
                        {renderSortIcon("quantity")}
                      </div>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("newPending")}
                  >
                    <div className="flex items-center gap-1">
                      Pending
                      <div className="flex flex-col -space-y-1">
                        {renderSortIcon("newPending")}
                      </div>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <div className="flex flex-col -space-y-1">
                        {renderSortIcon("status")}
                      </div>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("dispatchDate")}
                  >
                    <div className="flex items-center gap-1">
                      Dispatch Date
                      <div className="flex flex-col -space-y-1">
                        {renderSortIcon("dispatchDate")}
                      </div>
                    </div>
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      Bill Info
                      <Filter className="w-3.5 h-3.5 text-gray-400 ml-1" />
                    </div>
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      Actions
                      <div className="flex flex-col -space-y-1">
                        <Funnel className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 10 : 9}
                      className="py-16 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <p className="text-gray-500">
                          Loading dispatch records...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <tr
                      key={
                        row.id ||
                        `${row.dispatchId}-${row.poId}-${row.itemCode}-${index}`
                      }
                      className={`hover:bg-blue-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="border border-gray-300 px-3 py-2 align-middle">
                        {startIndex + index + 1}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 align-middle">
                        <div>
                          <p className="font-mono font-semibold text-gray-900">
                            {row.orderNumber}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {row.dispatchDate
                              ? new Date(row.dispatchDate).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </p>
                        </div>
                      </td>

                      {isAdmin && (
                        <td className="border border-gray-300 px-3 py-2 align-middle">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-700">
                              {row.companyName}
                            </span>
                          </div>
                        </td>
                      )}

                      <td className="border border-gray-300 px-3 py-2 align-middle">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-700">
                            {row.itemCode}
                          </span>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {row.description}
                          </p>
                        </div>
                      </td>

                      <td className="border border-gray-300 px-3 py-2 align-middle">
                        <span className="font-semibold text-gray-900">
                          {row.quantity?.toLocaleString()}
                        </span>
                      </td>

                      <td className="border border-gray-300 px-3 py-2 align-middle">
                        <div className="text-xs">
                          <div className="text-gray-500">
                            Before:{" "}
                            <span className="font-medium text-gray-700">
                              {row.originalPending ?? "—"}
                            </span>
                          </div>
                          <div className="text-gray-500 mt-0.5">
                            After:{" "}
                            <span className="font-semibold text-blue-700">
                              {row.newPending ?? "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="border border-gray-300 px-3 py-2 align-middle">
                        {getStatusBadge(row.status)}
                      </td>

                      <td className="border border-gray-300 px-3 py-2 align-middle">
                        <p className="text-xs text-gray-500">
                          {row.dispatchDate
                            ? new Date(row.dispatchDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </p>
                      </td>

                      <td className="border border-gray-300 px-3 py-2 align-middle">
                        {row.billFile ? (
                          <a
                            href={row.billFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                          >
                            <Eye className="w-3 h-3" />{" "}
                            {row.billNumber || "View Bill"}
                          </a>
                        ) : row.billNumber ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gray-50 text-gray-700 rounded-lg border border-gray-200">
                            <FileText className="w-3 h-3" />
                            {row.billNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">No bill</span>
                        )}
                      </td>

                      <td className="border border-gray-300 px-3 py-2 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleView(row)}
                            className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEdit(row)}
                                className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(row)}
                                className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isAdmin ? 10 : 9}
                      className="py-16 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Package className="w-12 h-12 text-gray-300" />
                        <div>
                          <p className="text-gray-900 font-medium">
                            No records found
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {!isAdmin && userCompany
                              ? `No dispatch records found for ${userCompany}`
                              : searchTerm ||
                                  selectedCompany !== "all" ||
                                  dateFilter
                                ? "Try adjusting your filters"
                                : "No dispatch records available"}
                          </p>
                        </div>
                        {(searchTerm ||
                          selectedCompany !== "all" ||
                          dateFilter) && (
                          <button
                            onClick={clearFilters}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ====== PAGINATION (YOUR ORIGINAL UI WITH ROWS PER PAGE FIX) ====== */}
          {filteredData.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <span>Rows per page:</span>
                <select
                  className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing rows per page
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="500">500</option>
                </select>
                <span className="text-gray-500">
                  {filteredData.length > 0 ? startIndex + 1 : 0} to{" "}
                  {Math.min(endIndex, filteredData.length)} of{" "}
                  {filteredData.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <span className="text-sm font-medium">«</span>
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    if (pageNum > totalPages) return null;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white shadow-sm"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <span className="text-sm font-medium">»</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {viewingDispatch && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Dispatch Details
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {isAdmin
                    ? "Dispatch record details"
                    : "Read-only order history"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingDispatch(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <ViewField
                label="PO Number"
                value={viewingDispatch.orderNumber}
              />
              <ViewField label="Company" value={viewingDispatch.companyName} />
              <ViewField label="Item Code" value={viewingDispatch.itemCode} />
              <ViewField
                label="Description"
                value={viewingDispatch.description}
              />
              <ViewField label="Drawing" value={viewingDispatch.drawing} />
              <ViewField
                label="Dispatch Quantity"
                value={
                  viewingDispatch.quantity?.toLocaleString?.() ||
                  viewingDispatch.quantity
                }
              />
              <ViewField
                label="Pending Before"
                value={viewingDispatch.originalPending}
              />
              <ViewField
                label="Pending After"
                value={viewingDispatch.newPending}
              />
              <ViewField label="Status" value={viewingDispatch.status} />
              <ViewField
                label="Dispatch Date"
                value={
                  viewingDispatch.dispatchDate
                    ? new Date(viewingDispatch.dispatchDate).toLocaleDateString(
                        "en-IN",
                      )
                    : "-"
                }
              />
              <ViewField
                label="Bill Number"
                value={viewingDispatch.billNumber}
              />
              <ViewField
                label="Transport Mode"
                value={viewingDispatch.transportMode}
              />
              <ViewField
                label="Tracking Number"
                value={viewingDispatch.trackingNumber}
              />
              <ViewField
                label="Received By"
                value={viewingDispatch.receivedBy}
              />
              <div className="sm:col-span-2">
                <ViewField
                  label="Remarks / Notes"
                  value={viewingDispatch.remarks || viewingDispatch.notes}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4">
              {viewingDispatch.billFile && (
                <a
                  href={viewingDispatch.billFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                >
                  <FileText className="h-4 w-4" />
                  View Bill
                </a>
              )}
              <button
                type="button"
                onClick={() => setViewingDispatch(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && isEditModalOpen && editingDispatch && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Edit Dispatch Record
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  PO: {editingDispatch.poNumber} | Item:{" "}
                  {editingDispatch.itemCode}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dispatch Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dispatch Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={editFormData.dispatchQuantity}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        dispatchQuantity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="1"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Original quantity: {editingDispatch.originalQuantity}
                  </p>
                </div>

                {/* Batch Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Number
                  </label>
                  <input
                    type="number"
                    value={editFormData.batchNumber}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        batchNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="1"
                    min="1"
                  />
                </div>

                {/* Dispatch Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dispatch Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.dispatchDate}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        dispatchDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Bill Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bill Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.billNumber}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        billNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter bill number"
                  />
                </div>

                {/* Bill File */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bill File (PDF/Image)
                  </label>
                  {editingDispatch.billFile && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        Current Bill:
                      </p>
                      <a
                        href={editingDispatch.billFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <FileText className="w-4 h-4" />
                        View Current Bill
                      </a>
                    </div>
                  )}
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload a new file</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                billFile: e.target.files[0],
                              })
                            }
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, PNG, JPG up to 5MB
                      </p>
                      {editFormData.billFile && (
                        <p className="text-sm text-green-600">
                          Selected: {editFormData.billFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  
                  <textarea
                    rows="3"
                    value={editFormData.notes}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        notes: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes about this dispatch..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const ViewField = ({ label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
    <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
      {label}
    </div>
    <div className="mt-1 break-words text-sm font-semibold text-gray-800">
      {value === undefined || value === null || value === "" ? "-" : value}
    </div>
  </div>
);

export default OrderHistory;
