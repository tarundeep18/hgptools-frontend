import React, { useState, useEffect, useMemo } from "react";
import {
  RefreshCw,
  Trash2,
  Eye,
  Download,
  Search,
  Package,
  Calendar,
  DollarSign,
  Database,
  X,
  FileText,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Sparkles,
  Building2,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  Filter,
  ArrowUpDown,
  Printer,
  Share2,
  MoreVertical,
  Archive,
  Send,
  HelpCircle,
  Shield,
  Zap,
  Award,
  Play,
  CloudUpload,
  Brain,
  File,
  User,
  Building,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}`;

const AllPo = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showHelp, setShowHelp] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  const { user } = useAuth();

  const clientProfile = {
    id: "CLT-001",
    companyName: user?.companyName || "Company Name",
    contactPerson: user?.name || "",
    email: user?.email || "",
    phone: user?.phoneNumber ? `+91 ${user.phoneNumber}` : "Phone Number",
  };

  // Normalize company name - trim and convert to lowercase for case-insensitive comparison
  const normalizeCompanyName = (name) => {
    if (!name) return "";
    return name.trim().toLowerCase();
  };

  // Get unique companies from orders - ONLY from submittedBy.companyName
  const uniqueCompanies = useMemo(() => {
    const companyMap = new Map();

    orders.forEach((order) => {
      // Only use submittedBy.companyName
      const company = order.submittedBy?.companyName;
      if (company) {
        const normalized = normalizeCompanyName(company);
        // Store the original display name (preserve case)
        if (!companyMap.has(normalized)) {
          companyMap.set(normalized, company);
        }
      }
    });

    // Return sorted array of display names
    return Array.from(companyMap.values()).sort();
  }, [orders]);

  const tourSteps = [
    {
      title: "📊 Welcome to PO Dashboard!",
      description:
        "View and manage all your purchase orders in one centralized location.",
      target: "header",
      icon: <Sparkles className="text-yellow-400" size={32} />,
    },
    {
      title: "📋 Order Management",
      description:
        "Browse through all your purchase orders. Click on any order to view detailed information.",
      target: "orders-grid",
      icon: <Package className="text-blue-400" size={32} />,
    },
    {
      title: "🔍 Search & Filter",
      description:
        "Quickly find orders using search or filter by status or company to streamline your workflow.",
      target: "search-bar",
      icon: <Search className="text-purple-400" size={32} />,
    },
    {
      title: "📊 Performance Metrics",
      description:
        "Track key metrics like total orders, items, and values at a glance.",
      target: "stats-section",
      icon: <BarChart3 className="text-pink-400" size={32} />,
    },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(
      () => setNotification({ show: false, type: "", message: "" }),
      3000,
    );
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/purchase-orders`, {
        withCredentials: true,
      });

      const data = response.data;
      console.log("po data", data);

      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch orders",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        const response = await axios.delete(
          `${API_URL}/purchase-orders/${orderId}`,
          {
            withCredentials: true,
          },
        );
        const data = response.data;
        if (data.success) {
          showNotification("success", "Order deleted successfully");
          fetchOrders();
          if (selectedOrder?._id === orderId) setSelectedOrder(null);
        } else {
          showNotification("error", "Failed to delete order");
        }
      } catch (error) {
        showNotification("error", "Error deleting order");
      }
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // const downloadOrderPDF = async (order) => {
  //   try {
  //     setDownloadingPdf(order._id);

  //     if (order.attachments && order.attachments.length > 0) {
  //       const attachment = order.attachments[0];
  //       const pdfUrl = attachment.url;

  //       if (pdfUrl) {
  //         const response = await axios.get(pdfUrl, {
  //           responseType: "blob",
  //           withCredentials: true,
  //         });

  //         const blob = new Blob([response.data], { type: "application/pdf" });
  //         const blobUrl = window.URL.createObjectURL(blob);
  //         const link = document.createElement("a");
  //         link.href = blobUrl;
  //         link.setAttribute(
  //           "download",
  //           attachment.filename || `purchase-order-${order.orderNumber}.pdf`,
  //         );
  //         document.body.appendChild(link);
  //         link.click();
  //         link.remove();
  //         window.URL.revokeObjectURL(blobUrl);

  //         showNotification("success", "PDF downloaded successfully!");
  //       } else {
  //         showNotification("error", "PDF URL not found");
  //       }
  //     } else {
  //       showNotification("error", "No PDF attachment found for this order");
  //     }
  //   } catch (error) {
  //     console.error("Error downloading PDF:", error);
  //     showNotification("error", "Failed to download PDF. Please try again.");
  //   } finally {
  //     setDownloadingPdf(null);
  //   }
  // };

  const getStatistics = () => {
    const totalOrders = orders.length;
    const totalValue = orders.reduce(
      (sum, order) => sum + (order.totalValue || 0),
      0,
    );
    const totalItems = orders.reduce(
      (sum, order) => sum + order.items.length,
      0,
    );
    const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;
    return { totalOrders, totalValue, totalItems, avgOrderValue };
  };

  const stats = getStatistics();

  const filteredOrders = orders
    .filter((order) => {
      // Search filter
      const matchesSearch =
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some((item) =>
          item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()),
        ) ||
        order.items.some((item) =>
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()),
        ) ||
        order.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.submittedBy?.companyName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        filterStatus === "all" || order.status === filterStatus;

      // Company filter - check both companyName and submittedBy.companyName
      const matchesCompany =
        filterCompany === "all" ||
        order.companyName === filterCompany ||
        order.submittedBy?.companyName === filterCompany;

      return matchesSearch && matchesStatus && matchesCompany;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === "highest") {
        return (b.totalValue || 0) - (a.totalValue || 0);
      } else if (sortBy === "lowest") {
        return (a.totalValue || 0) - (b.totalValue || 0);
      }
      return 0;
    });

  const nextTourStep = () => {
    if (currentTourStep < tourSteps.length - 1) {
      setCurrentTourStep(currentTourStep + 1);
    } else {
      setShowTour(false);
      setCurrentTourStep(0);
      showNotification(
        "success",
        "🎉 Tour completed! You're ready to manage your orders!",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Interactive Tour Modal */}
      {showTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTour(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="inline-flex p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
                {tourSteps[currentTourStep].icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {tourSteps[currentTourStep].title}
              </h3>
              <p className="text-gray-600">
                {tourSteps[currentTourStep].description}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTour(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
              >
                Skip Tour
              </button>
              <button
                onClick={nextTourStep}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {currentTourStep === tourSteps.length - 1
                  ? "Get Started"
                  : "Next Step"}
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {tourSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentTourStep
                      ? "w-8 bg-indigo-600"
                      : "w-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Help Panel */}
      {showHelp && (
        <div className="fixed right-6 top-24 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-in">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle size={20} />
                <h3 className="font-semibold">Quick Help Guide</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="hover:opacity-80"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">View Orders</p>
                <p className="text-xs text-gray-500">
                  Click on any order card to view detailed information
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Download size={18} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Download PDF</p>
                <p className="text-xs text-gray-500">
                  Download any order as a PDF for offline viewing
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Delete Orders</p>
                <p className="text-xs text-gray-500">
                  Remove unwanted orders from your history
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-sm animate-slide-in ${
            notification.type === "success"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              : "bg-gradient-to-r from-red-500 to-rose-600 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span className="font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification({ show: false })}
            className="ml-2 hover:opacity-80"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="rounded-2xl shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Section */}
            <div className="flex items-start sm:items-center gap-4">
              <div
                className="relative group cursor-pointer flex-shrink-0"
                onClick={() => setShowTour(true)}
              >
                <div className="bg-white/20 rounded-xl p-2 sm:p-2.5 backdrop-blur-sm shadow-lg">
                  <Package
                    className="text-white"
                    size={window.innerWidth < 640 ? 24 : 28}
                  />
                </div>
              </div>

              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-words">
                  Purchase Order Dashboard
                </h1>

                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-blue-100">
                  <Sparkles size={14} className="text-blue-200 shrink-0" />
                  <span>Centralized purchase order management</span>
                  <Sparkles size={14} className="text-blue-200 shrink-0" />
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-medium transition-all duration-300 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-blue-300"
              >
                <div className="flex items-center justify-center gap-2">
                  <HelpCircle size={18} />
                  Help
                </div>
              </button>

              <button
                onClick={fetchOrders}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Banner */}
      {orders.length === 0 && !loading && (
        <div className="relative z-20 mx-auto px-6 lg:px-8 mt-8">
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-100 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 opacity-10">
              <Sparkles size={120} />
            </div>
            <div className="relative flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <Award className="text-indigo-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    No Orders Found 📋
                  </h3>
                </div>
                <p className="text-gray-600 mb-4 max-w-2xl">
                  You don't have any purchase orders yet. Upload a document to
                  get started with AI-powered extraction.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>AI Powered Extraction</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap size={16} className="text-yellow-500" />
                    <span>Quick Processing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield size={16} className="text-blue-500" />
                    <span>Secure Storage</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowTour(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Play size={18} />
                Take Quick Tour
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-20 mx-auto px-6 lg:px-8 py-8">
        <div className="animate-fade-in-up">
          {/* Statistics Dashboard */}
          {showStats && orders.length > 0 && (
            <div
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
              id="stats-section"
            >
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <Package size={32} className="opacity-80" />
                  <span className="text-3xl font-bold">
                    {stats.totalOrders}
                  </span>
                </div>
                <p className="text-sm opacity-90">Total Orders</p>
                <p className="text-xs opacity-75 mt-1">
                  {stats.totalOrders > 0 ? "Active orders" : "No orders yet"}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <Package size={28} className="text-purple-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.totalItems}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">Total Items Ordered</p>
                <p className="text-xs text-gray-400 mt-1">
                  Across all purchase orders
                </p>
              </div>
            </div>
          )}

          {/* Search and Filter Bar */}
          <div
            className="bg-white rounded-2xl shadow-lg p-5 mb-8 border border-gray-100"
            id="search-bar"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search by order number, item code, description, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                {/* Company Filter */}
                <div className="relative">
                  <select
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    className="px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white appearance-none min-w-[180px]"
                  >
                    <option value="all">All Companies</option>
                    {uniqueCompanies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                  <Building
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={18}
                  />
                </div>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Value</option>
                  <option value="lowest">Lowest Value</option>
                </select>

                <button
                  onClick={fetchOrders}
                  disabled={loading}
                  className="px-5 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw
                    size={18}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(filterCompany !== "all" ||
              filterStatus !== "all" ||
              searchTerm) && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Active Filters:</span>
                {filterCompany !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                    <Building size={12} />
                    {filterCompany}
                    <button
                      onClick={() => setFilterCompany("all")}
                      className="hover:text-indigo-900 ml-1"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filterStatus !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    <Filter size={12} />
                    {filterStatus}
                    <button
                      onClick={() => setFilterStatus("all")}
                      className="hover:text-blue-900 ml-1"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    <Search size={12} />
                    {searchTerm}
                    <button
                      onClick={() => setSearchTerm("")}
                      className="hover:text-gray-900 ml-1"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilterCompany("all");
                    setFilterStatus("all");
                    setSearchTerm("");
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium ml-2"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Orders Grid */}
          <div id="orders-grid">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <RefreshCw
                    className="animate-spin mx-auto text-indigo-600"
                    size={48}
                  />
                  <p className="mt-4 text-gray-500">Loading orders...</p>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-100">
                <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                  <Package className="text-gray-400" size={48} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No orders found
                </h3>
                <p className="text-gray-500">
                  {searchTerm ||
                  filterStatus !== "all" ||
                  filterCompany !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Start by uploading a purchase order document"}
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-300 overflow-auto">
                <div className="bg-white border border-gray-300 overflow-auto">
                  <table className="w-full border-collapse text-sm text-center">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          Universal PO ID
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          Order
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          Company
                        </th>

                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          Items
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          Total
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          Status
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredOrders.map((order, index) => (
                        <tr
                          key={order._id}
                          className={`hover:bg-blue-50 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          {/* Universal Po id */}
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            {order.universalId || "N/A"}
                          </td>
                          {/* Order */}
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {order.orderNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.items.length}{" "}
                                {order.items.length === 1 ? "item" : "items"}
                              </div>
                            </div>
                          </td>

                          {/* Company */}
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            {order.submittedBy?.companyName ||
                              order.companyName ||
                              "N/A"}
                          </td>

                          {/* Items Preview */}
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <div className="space-y-1">
                              {order.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">
                                    {item.itemCode}
                                  </span>{" "}
                                  -{" "}
                                  <span className="text-gray-600">
                                    {item.description}
                                  </span>{" "}
                                  <span className="text-gray-500">
                                    ×{item.quantity}
                                  </span>
                                </div>
                              ))}

                              {order.items.length > 2 && (
                                <div className="text-xs text-indigo-600">
                                  +{order.items.length - 2} more items
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Total */}
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            ₹{order.totalValue?.toLocaleString() || 0}
                          </td>

                          {/* Status */}
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                order.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : order.status === "submitted"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <div className="flex justify-center items-center gap-2">
                              {order.attachments?.length > 0 && (
                                <button
                                  onClick={() => {
                                    const pdfUrl = order.attachments?.[0]?.url;
                                    if (pdfUrl) {
                                      window.open(
                                        pdfUrl,
                                        "_blank",
                                        "noopener,noreferrer",
                                      );
                                    }
                                  }}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Download PDF"
                                >
                                  {downloadingPdf === order._id ? (
                                    <RefreshCw
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Download size={16} />
                                  )}
                                </button>
                              )}

                              <button
                                onClick={() => handleViewOrder(order)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="View"
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                onClick={() => handleDeleteOrder(order._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
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
        </div>
      </main>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl h-[95vh] sm:h-[90vh] flex flex-col overflow-auto">
            {/* Modal Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 break-all">
                    {selectedOrder.orderNumber}
                  </h2>
                  <span className="px-2 py-0.5 bg-slate-200/60 text-slate-700 rounded text-xs font-semibold">
                    {selectedOrder.items.length} Items
                  </span>
                  {selectedOrder.attachments &&
                    selectedOrder.attachments.length > 0 && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold flex items-center gap-1">
                        <File size={12} />
                        PDF Attached
                      </span>
                    )}
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 lg:gap-4">
                  <p className="text-xs text-slate-500">
                    Company: {selectedOrder.companyName || "N/A"}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <User size={12} />
                    Submitted by:{" "}
                    {selectedOrder.submittedBy?.companyName || "N/A"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Date:{" "}
                    {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadOrderPDF(selectedOrder)}
                  className="p-1.5 hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 rounded-lg transition-colors focus:outline-none disabled:opacity-50"
                  title="Download PDF"
                >
                  {downloadingPdf === selectedOrder._id ? (
                    <RefreshCw size={20} className="animate-spin" />
                  ) : (
                    <Download size={20} />
                  )}
                </button>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="p-1.5 hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 rounded-lg transition-colors focus:outline-none"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-auto flex-1">
              <table className="min-w-full divide-y divide-slate-200 border-separate border-spacing-0">
                <thead className="bg-slate-50/70 sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    {[
                      "Sr No",
                      "Item Code",
                      "Description",
                      "Unit",
                      "Qty",
                      "Rate",
                      "Value",
                      "IGST",
                      "Delivery Date",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-[13px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {selectedOrder.items.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-slate-400">
                        {item.srNo || idx + 1}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-indigo-600">
                        {item.itemCode}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 max-w-xs truncate font-medium">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-600">
                        {item.unit || "pcs"}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-600">
                        ₹
                        {item.ratePerUnit?.toLocaleString() || item.ratePerUnit}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-900">
                        ₹{item.value?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-600">
                        ₹{item.igst?.toLocaleString() || item.igst || 0}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                        {item.deliveryDate || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/50">
              <div className="text-sm text-slate-600">
                Total Value:{" "}
                <span className="font-bold text-slate-900">
                  ₹{selectedOrder.totalValue?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadOrderPDF(selectedOrder)}
                  disabled={downloadingPdf === selectedOrder._id}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {downloadingPdf === selectedOrder._id ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  Download PDF
                </button>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default AllPo;
