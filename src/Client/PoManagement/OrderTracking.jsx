import React, { useState, useEffect } from "react";
import {
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Search,
  Clock,
  Box,
  Wrench,
  Microscope,
  ClipboardList,
  Calendar,
  DollarSign,
  Building2,
  Mail,
  Phone,
  Eye,
  RefreshCw,
  X,
  TrendingUp,
  Users,
  Navigation,
  FileMinus,
  Star,
  Award,
  Shield,
  Zap,
  Filter,
  Send,
  History,
  Upload,
  FileText,
  Edit,
  Save,
  Users as UsersIcon,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { FaEye } from "react-icons/fa";

const TrackOrderItem = () => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("order");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });

  const [showItemSearchResults, setShowItemSearchResults] = useState(false);
  const [itemSearchResults, setItemSearchResults] = useState([]);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedItemForDispatch, setSelectedItemForDispatch] = useState(null);
  const [dispatchQuantity, setDispatchQuantity] = useState(1);
  const [selectedFileQC, setSelectedFileQC] = useState(null);
  const [selectedFileMTC, setSelectedFileMTC] = useState(null);
  const [uploadingQC, setUploadingQC] = useState(false);
  const [uploadingMTC, setUploadingMTC] = useState(false);
  const [dispatchHistoryModal, setDispatchHistoryModal] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);

  const [editingProgress, setEditingProgress] = useState(null);
  const [progressValue, setProgressValue] = useState(0);
  const [stageValue, setStageValue] = useState("");

  const { user } = useAuth();
  const API_URL = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}`;

  // Define roles with proper null check
  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const isClient = user?.role === "client" || !isAdmin;

  // Add authentication check
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (user !== undefined) {
      setIsAuthenticated(true);
      console.log("user", user);
    }
  }, [user]);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(
      () => setNotification({ show: false, type: "", message: "" }),
      3000,
    );
  };

  const fetchAllCompanies = async () => {
    if (!isAdmin) return;

    try {
      const response = await axios.get(`${API_URL}/users/companies`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setCompanies(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  // Helper function to fetch fresh dispatch history for an item
  const fetchItemDispatchHistory = async (orderId, itemId) => {
    try {
      let endpoint;

      if (isAdmin) {
        endpoint = `${API_URL}/dispatch-orders/${orderId}/items/${itemId}/dispatches`;
      } else {
        endpoint = `${API_URL}/dispatch-orders/my-dispatches`;
      }

      const response = await axios.get(endpoint, {
        withCredentials: true,
        params: isAdmin ? {} : { poId: orderId, itemId: itemId },
      });

      if (response.data.success) {
        let dispatchRecords = [];

        if (isAdmin) {
          dispatchRecords = response.data.data.dispatchHistory || [];
        } else {
          // Client response structure - filter by itemId if needed
          const allDispatches = response.data.data || [];
          dispatchRecords = allDispatches.filter(
            (dispatch) =>
              dispatch.itemId === itemId || dispatch.itemId?._id === itemId,
          );
        }

        return dispatchRecords.map((record) => ({
          _id: record._id,
          quantity: record.dispatchQuantity || record.quantity,
          unit: record.unit,
          dispatchDate: record.dispatchDate,
          dispatchedBy: record.dispatchedBy,
          batchNumber: record.batchNumber,
          trackingNumber: record.trackingNumber || "",
          qcReport: record.qcReport || null,
          mtcReport: record.mtcReport || null,
          status: record.status,
          billNumber: record.billNumber || "",
          billFile: record.billFile || "",
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching item dispatch history:", error);
      return [];
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);

      let ordersResponse;

      if (isAdmin) {
        ordersResponse = await axios.get(`${API_URL}/purchase-orders`, {
          withCredentials: true,
        });
      } else {
        ordersResponse = await axios.get(
          `${API_URL}/purchase-orders/my-orders`,
          {
            withCredentials: true,
          },
        );
      }

      const ordersData = ordersResponse.data;

      if (!ordersData.success || !ordersData.data) {
        setLoading(false);
        return;
      }

      let dispatchMap = {};

      if (isAdmin) {
        try {
          const dispatchResponse = await axios.get(
            `${API_URL}/dispatch-orders`,
            {
              withCredentials: true,
            },
          );

          const dispatchData = dispatchResponse.data;
          console.log("admin dispach", dispatchData);

          if (dispatchData.success && dispatchData.data) {
            dispatchData.data.forEach((dispatch) => {
              const itemId = dispatch.itemId;

              if (!dispatchMap[itemId]) {
                dispatchMap[itemId] = [];
              }

              dispatchMap[itemId].push({
                _id: dispatch._id,
                quantity: dispatch.dispatchQuantity,
                unit: dispatch.unit,
                dispatchDate: dispatch.dispatchDate,
                dispatchedBy: dispatch.dispatchedBy,
                batchNumber: dispatch.batchNumber,
                trackingNumber: dispatch.trackingNumber || "",
                qcReport: dispatch.qcReport || null,
                mtcReport: dispatch.mtcReport || null,
                status: dispatch.status,
                billNumber: dispatch.billNumber || "",
                billFile: dispatch.billFile || "",
              });
            });
          }
        } catch (dispatchError) {
          console.warn(
            "Could not fetch dispatch orders:",
            dispatchError.message,
          );
        }
      } else {
        try {
          const dispatchResponse = await axios.get(
            `${API_URL}/dispatch-orders/my-dispatches`,
            {
              withCredentials: true,
            },
          );

          const dispatchData = dispatchResponse.data;

          if (dispatchData.success && dispatchData.data) {
            dispatchData.data.forEach((dispatch) => {
              const itemId = dispatch.itemId;

              if (itemId && !dispatchMap[itemId]) {
                dispatchMap[itemId] = [];
              }

              if (itemId) {
                dispatchMap[itemId].push({
                  _id: dispatch._id,
                  quantity: dispatch.dispatchQuantity || dispatch.quantity,
                  unit: dispatch.unit,
                  dispatchDate: dispatch.dispatchDate,
                  dispatchedBy: dispatch.dispatchedBy,
                  batchNumber: dispatch.batchNumber,
                  trackingNumber: dispatch.trackingNumber || "",
                  qcReport: dispatch.qcReport || null,
                  mtcReport: dispatch.mtcReport || null,
                  status: dispatch.status,
                  billNumber: dispatch.billNumber || "",
                  billFile: dispatch.billFile || "",
                });
              }
            });

            console.log(
              `Fetched ${dispatchData.data.length} dispatch records for client`,
            );
          }
        } catch (dispatchError) {
          console.warn(
            "Could not fetch client dispatch orders:",
            dispatchError.message,
          );
        }
      }

      const ordersWithDispatches = ordersData.data.map((order) => {
        const items =
          order.items?.map((item) => {
            const itemId = item._id || item.id;
            const dispatchRecords =
              dispatchMap[itemId] || item.dispatchRecords || [];

            return {
              ...item,
              dispatchRecords: dispatchRecords,
            };
          }) || [];

        const totalOrdered = items.reduce(
          (sum, item) => sum + (Number(item.quantity) || 0),
          0,
        );

        const totalDispatched = items.reduce((sum, item) => {
          const dispatched =
            item.dispatchRecords?.reduce(
              (dispatchSum, record) =>
                dispatchSum + (Number(record.quantity) || 0),
              0,
            ) || 0;
          return sum + dispatched;
        }, 0);

        const overallProgress =
          totalOrdered > 0
            ? Math.round((totalDispatched / totalOrdered) * 100)
            : 0;

        return {
          ...order,
          items,
          overallProgress,
          totalOrdered,
          totalDispatched,
        };
      });

      if (isAdmin) {
        setAllOrders(ordersWithDispatches);
        const companyMap = new Map();
        ordersWithDispatches.forEach((order) => {
          const companyId = order.submittedBy?.companyId || order.companyId;
          const companyName =
            order.submittedBy?.companyName || order.companyName || "Unknown";

          if (!companyMap.has(companyId)) {
            companyMap.set(companyId, {
              id: companyId,
              name: companyName,
              email: order.submittedBy?.email,
              phone: order.submittedBy?.phoneNumber,
              totalOrders: 0,
              totalValue: 0,
              orders: [],
            });
          }

          const companyData = companyMap.get(companyId);
          companyData.totalOrders++;
          companyData.totalValue += order.totalValue || 0;
          companyData.orders.push(order);
        });

        setCompanies(Array.from(companyMap.values()));
        setOrders(ordersWithDispatches);
      } else {
        setOrders(ordersWithDispatches);
      }

      console.log(
        `Orders fetched successfully: ${ordersWithDispatches.length} orders`,
      );
      if (!isAdmin && ordersWithDispatches.length > 0) {
        const sampleItem = ordersWithDispatches[0]?.items?.[0];
        console.log("Sample dispatch data:", {
          orderNumber: ordersWithDispatches[0].orderNumber,
          hasDispatchRecords: sampleItem?.dispatchRecords?.length > 0,
          dispatchCount: sampleItem?.dispatchRecords?.length || 0,
        });
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

  useEffect(() => {
    fetchOrders();
    if (isAdmin) {
      fetchAllCompanies();
    }
  }, []);

  const calculatePOProgress = (order) => {
    if (!order?.items?.length) return 0;

    const totalOrdered = order.items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0,
    );

    const totalDispatched = order.items.reduce((sum, item) => {
      const dispatched =
        item.dispatchRecords?.reduce(
          (dispatchSum, record) => dispatchSum + (Number(record.quantity) || 0),
          0,
        ) || 0;

      return sum + dispatched;
    }, 0);

    if (totalOrdered === 0) return 0;

    return Math.round((totalDispatched / totalOrdered) * 100);
  };

  const getDispatchedQuantity = (item) => {
    if (!item.dispatchRecords) return 0;
    return item.dispatchRecords.reduce(
      (sum, record) => sum + record.quantity,
      0,
    );
  };

  const getRemainingQuantity = (item) => {
    const dispatched = getDispatchedQuantity(item);
    return item.quantity - dispatched;
  };

  const getDispatchProgress = (item) => {
    return (getDispatchedQuantity(item) / item.quantity) * 100;
  };

  const handleUpdateProgress = async (orderId, itemId, progress, stage) => {
    try {
      const response = await axios.put(
        `${API_URL}/purchase-orders/update-item-progress`,
        {
          orderId,
          itemId,
          progress,
          currentStage: stage,
          updatedBy: user?.name,
          updateDate: new Date().toISOString(),
        },
        { withCredentials: true },
      );

      if (response.data.success) {
        showNotification("success", "Progress updated successfully!");
        fetchOrders();
        setEditingProgress(null);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to update progress",
      );
    }
  };

  const handleDispatch = async () => {
    if (!selectedFileQC || !selectedFileMTC) {
      showNotification(
        "error",
        "Please upload both QC Report and MTC Certificate for this dispatch batch",
      );
      return;
    }

    const remainingQty = getRemainingQuantity(selectedItemForDispatch);
    if (dispatchQuantity > remainingQty) {
      showNotification(
        "error",
        `Only ${remainingQty} ${selectedItemForDispatch.unit} remaining`,
      );
      return;
    }

    try {
      setUploadingQC(true);
      setUploadingMTC(true);

      const qcFormData = new FormData();
      qcFormData.append("file", selectedFileQC);
      qcFormData.append("type", "qc");
      qcFormData.append("orderId", selectedOrder?._id);
      qcFormData.append("itemId", selectedItemForDispatch._id);

      const qcResponse = await axios.post(
        `${API_URL}/purchase-orders/upload-dispatch-report`,
        qcFormData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const mtcFormData = new FormData();
      mtcFormData.append("file", selectedFileMTC);
      mtcFormData.append("type", "mtc");
      mtcFormData.append("orderId", selectedOrder?._id);
      mtcFormData.append("itemId", selectedItemForDispatch._id);

      const mtcResponse = await axios.post(
        `${API_URL}/purchase-orders/upload-dispatch-report`,
        mtcFormData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const dispatchData = {
        orderId: selectedOrder?._id,
        itemId: selectedItemForDispatch._id,
        quantity: dispatchQuantity,
        unit: selectedItemForDispatch.unit,
        qcReport: {
          url: qcResponse.data.data.fileUrl,
          fileName: selectedFileQC.name,
          uploadDate: new Date().toISOString(),
        },
        mtcReport: {
          url: mtcResponse.data.data.fileUrl,
          fileName: selectedFileMTC.name,
          uploadDate: new Date().toISOString(),
        },
        dispatchedBy: user?.name,
        dispatchDate: new Date().toISOString(),
        trackingNumber: `DISP-${Date.now()}`,
      };

      const dispatchResponse = await axios.post(
        `${API_URL}/purchase-orders/create-dispatch-record`,
        dispatchData,
        { withCredentials: true },
      );

      if (dispatchResponse.data.success) {
        showNotification(
          "success",
          `${dispatchQuantity} ${selectedItemForDispatch.unit} dispatched successfully!`,
        );

        setDispatchModalOpen(false);
        setSelectedItemForDispatch(null);
        setSelectedFileQC(null);
        setSelectedFileMTC(null);
        setDispatchQuantity(1);

        fetchOrders();
      }
    } catch (error) {
      console.error("Dispatch error:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to dispatch",
      );
    } finally {
      setUploadingQC(false);
      setUploadingMTC(false);
    }
  };

  const searchByItemName = (searchText) => {
    if (!searchText.trim()) {
      setShowItemSearchResults(false);
      setItemSearchResults([]);
      return;
    }
    const results = [];
    const ordersToSearch = isAdmin ? allOrders : orders;

    ordersToSearch.forEach((order) => {
      const matchingItems = order.items?.filter(
        (item) =>
          item.description?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.itemCode?.toLowerCase().includes(searchText.toLowerCase()),
      );

      if (matchingItems && matchingItems.length > 0) {
        results.push({
          order: order,
          matchingItems: matchingItems,
          completedItems:
            order.items?.filter((item) => item.progress === 100) || [],
          inProgressItems:
            order.items?.filter(
              (item) => item.progress < 100 && item.progress > 0,
            ) || [],
          pendingItems:
            order.items?.filter((item) => item.progress === 0) || [],
        });
      }
    });

    setItemSearchResults(results);
    setShowItemSearchResults(results.length > 0);
    return results;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "raw_material":
        return <Package className="w-5 h-5 text-blue-500" />;
      case "tooling":
        return <Wrench className="w-5 h-5 text-purple-500" />;
      case "production":
        return <Box className="w-5 h-5 text-orange-500" />;
      case "quality":
      case "quality_check":
        return <Microscope className="w-5 h-5 text-green-500" />;
      case "dispatch":
      case "dispatched":
        return <Truck className="w-5 h-5 text-indigo-500" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default:
        return <ClipboardList className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      raw_material: "Raw Material",
      tooling: "Tooling",
      production: "Production",
      quality: "Quality Inspection",
      quality_check: "Quality Check",
      dispatch: "Dispatch",
      dispatched: "Dispatched",
      delivered: "Delivered",
      submitted: "Submitted",
      approved: "Approved",
      in_progress: "In Progress",
    };
    return statusMap[status] || status;
  };

  const getProgressGradient = (progress) => {
    if (progress < 30) return "from-blue-500 to-blue-600";
    if (progress < 70) return "from-orange-500 to-orange-600";
    return "from-green-500 to-emerald-600";
  };

  const getCompletedItems = (order) => {
    return order.items?.filter((item) => item.progress === 100) || [];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (searchType === "item") {
      searchByItemName(value);
    }
  };

  const getFilteredOrders = () => {
    if (searchType === "item" && searchTerm) {
      return [];
    }

    let filtered = isAdmin ? allOrders : orders;

    if (isAdmin && filterCompany !== "all") {
      filtered = filtered.filter(
        (order) =>
          order.submittedBy?.companyId === filterCompany ||
          order.companyId === filterCompany ||
          order.submittedBy?.companyName === filterCompany,
      );
    }

    if (searchTerm && searchType === "order") {
      filtered = filtered.filter(
        (order) =>
          (order.orderNumber || order.poNumber || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (order.customerName || order.companyName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (order.submittedBy?.companyName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((order) => order.status === filterStatus);
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  const { user: authUser } = useAuth();
  const clientProfile = {
    companyName: authUser?.companyName || "Company Name",
    email: authUser?.email || "Email",
    phone: authUser?.phoneNumber
      ? `+91 ${authUser.phoneNumber}`
      : "Phone Number",
  };

  const adminStats = {
    total: allOrders.length,
    totalCompanies: companies.length,
    totalValue: allOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0),
    inProduction: allOrders.filter(
      (o) => o.status === "production" || o.status === "in_progress",
    ).length,
    quality: allOrders.filter(
      (o) => o.status === "quality" || o.status === "quality_check",
    ).length,
    dispatch: allOrders.filter(
      (o) => o.status === "dispatch" || o.status === "dispatched",
    ).length,
  };

  const clientStats = {
    total: orders.length,
    inProduction: orders.filter(
      (o) => o.status === "production" || o.status === "in_progress",
    ).length,
    quality: orders.filter(
      (o) => o.status === "quality" || o.status === "quality_check",
    ).length,
    dispatch: orders.filter(
      (o) => o.status === "dispatch" || o.status === "dispatched",
    ).length,
    totalValue: orders.reduce((sum, o) => sum + (o.totalValue || 0), 0),
  };

  const stats = isAdmin ? adminStats : clientStats;

  return (
    <>
      {/* <div className="fixed top-20 right-6 z-40">
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${
            isAdmin ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
          }`}
        >
          {isAdmin
            ? "🔧 Admin Mode - Full Access"
            : "👁️ Client Mode - View Only"}
        </div>
      </div> */}

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

      <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <div className="flex gap-3 items-center">
                  <div className="bg-white/20 rounded-xl p-1.5 backdrop-blur-sm">
                    <FileMinus className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {isAdmin
                      ? "Admin Dashboard - All Orders"
                      : "Live Order Tracking"}
                  </h2>
                </div>
                <p className="text-blue-100">
                  {isAdmin
                    ? "Track and manage all purchase orders across all companies"
                    : "Track your purchase orders progress in real-time"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchOrders}
                  disabled={loading}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-all flex items-center gap-2"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="px-8 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center space-x-6 text-sm">
              {isAdmin ? (
                <>
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {stats.total} Total Orders
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {clientProfile.companyName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{clientProfile.email}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building2 size={16} />
                Filter by Company:
              </label>
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              >
                <option value="all">All Companies</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => {
                  setSearchType("order");
                  setShowItemSearchResults(false);
                  setSearchTerm("");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  searchType === "order"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                🔍 Search by Order
              </button>
              <button
                onClick={() => {
                  setSearchType("item");
                  setShowItemSearchResults(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  searchType === "item"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                📦 Search by Item Name
              </button>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={
                  searchType === "order"
                    ? "Search by PO number, customer name, or company name..."
                    : "Search by item name (e.g., Engine, Brake, Piston)..."
                }
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            {/* <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="raw_material">Raw Material</option>
              <option value="tooling">Tooling</option>
              <option value="production">Production</option>
              <option value="in_progress">In Progress</option>
              <option value="quality_check">Quality Check</option>
              <option value="dispatched">Dispatch</option>
              <option value="delivered">Delivered</option>
            </select> */}
          </div>

          {searchType === "item" && searchTerm && (
            <div className="mt-3 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
              💡 Showing results for items containing "{searchTerm}"
            </div>
          )}
        </div>

        {searchType === "item" &&
          searchTerm &&
          showItemSearchResults &&
          itemSearchResults.length > 0 && (
            <div className="space-y-6 mb-8">
              <h3 className="font-semibold text-gray-900 text-lg">
                Found {itemSearchResults.length} order(s) containing "
                {searchTerm}"
              </h3>
              {itemSearchResults.map(
                ({ order, matchingItems, completedItems }) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
                  >
                    <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b">
                      <div className="flex justify-between items-start flex-wrap gap-3">
                        <div>
                          <h4 className="font-bold text-gray-900">
                            {order.orderNumber || order.poNumber}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Customer: {order.customerName || order.companyName}
                          </p>
                          {isAdmin && (
                            <p className="text-xs text-purple-600 mt-1">
                              Company: {order.submittedBy?.companyName || "N/A"}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all flex items-center gap-1"
                        >
                          <Eye size={14} />
                          View Full Order
                        </button>
                      </div>
                    </div>

                    <div className="p-4 border-b bg-yellow-50">
                      <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Search size={14} className="text-yellow-600" />
                        Matching Items
                      </h5>
                      <div className="space-y-2">
                        {matchingItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg p-3 border border-yellow-200"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-mono text-blue-600 text-sm">
                                  {item.itemCode}
                                </span>
                                <p className="font-medium text-gray-900">
                                  {item.description}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Qty: {item.quantity} {item.unit} | Value:{" "}
                                  {formatCurrency(item.value)}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  Dispatched: {getDispatchedQuantity(item)}{" "}
                                  {item.unit} | Remaining:{" "}
                                  {getRemainingQuantity(item)} {item.unit}
                                </p>
                              </div>
                              <div
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  item.progress === 100
                                    ? "bg-green-100 text-green-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {item.progress === 100
                                  ? "✓ Completed"
                                  : `${item.progress}% Complete`}
                              </div>
                            </div>
                            {isAdmin &&
                              item.currentStage === "quality" &&
                              getRemainingQuantity(item) > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setSelectedItemForDispatch(item);
                                    setDispatchModalOpen(true);
                                  }}
                                  className="mt-2 px-3 py-1 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 flex items-center gap-1"
                                >
                                  <Send size={12} />
                                  Dispatch Batch
                                </button>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {completedItems.length > 0 && (
                      <div className="p-4 bg-green-50">
                        <h5 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                          <CheckCircle size={14} />
                          Completed Items ({completedItems.length})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {completedItems.slice(0, 5).map((item, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-white px-2 py-1 rounded-full text-green-700"
                            >
                              ✓ {item.itemCode}
                            </span>
                          ))}
                          {completedItems.length > 5 && (
                            <span className="text-xs text-gray-500">
                              +{completedItems.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          )}

        {searchType === "item" &&
          searchTerm &&
          !showItemSearchResults &&
          !loading && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Search className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No items found
              </h3>
              <p className="text-gray-500">
                No orders contain "{searchTerm}". Try a different search term.
              </p>
            </div>
          )}

        {searchType === "order" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="animate-spin text-blue-600" size={40} />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20">
                <Package className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No orders found
                </h3>
                <p className="text-gray-500">
                  No purchase orders match your search criteria.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        {isAdmin && (
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                            Company
                          </th>
                        )}

                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                          PO Number
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                          Items
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                          Progress
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr
                          key={order._id}
                          onClick={() => setSelectedOrder(order)}
                          className="border-b border-gray-100 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                        >
                          {isAdmin && (
                            <td className="px-6 py-5">
                              <div className="font-medium text-gray-900">
                                {order.submittedBy?.companyName || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {order.submittedBy?.email}
                              </div>
                            </td>
                          )}

                          <td className="px-6 py-5">
                            <div className="font-semibold text-gray-900">
                              {order.orderNumber ||
                                order.poNumber ||
                                order._id.slice(-8)}
                            </div>

                            <div className="text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span className="text-sm text-gray-600">
                              {order.items?.length || 0} items
                            </span>
                          </td>

                          <td className="px-6 py-5 min-w-[180px]">
                            <div>
                              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  style={{
                                    width: `${order.overallProgress || 0}%`,
                                  }}
                                  className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${getProgressGradient(
                                    order.overallProgress || 0,
                                  )}`}
                                />
                              </div>

                              <span className="text-xs text-gray-500 mt-2 inline-block">
                                {order.overallProgress || 0}%
                              </span>
                            </div>
                          </td>
                          

                          <td className="px-6 py-5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                              }}
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Reduces Customer Follow-ups
                </p>
                <p className="text-sm text-gray-600">
                  Real-time visibility answers questions instantly
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-full p-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Builds Transparency
                </p>
                <p className="text-sm text-gray-600">
                  Complete production lifecycle visibility
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 rounded-full p-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Improves Trust</p>
                <p className="text-sm text-gray-600">
                  Reliable updates build lasting relationships
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && selectedCompany && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[55] p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 rounded-t-xl sticky top-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Company Details
                  </h3>
                  <p className="text-purple-100 text-sm">
                    {selectedCompany.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-white hover:bg-white/20 rounded-lg p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Company Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">
                      {selectedCompany.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">
                      {selectedCompany.phone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Orders Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedCompany.totalOrders}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedCompany.totalValue)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ClipboardList size={16} />
                  Orders ({selectedCompany.totalOrders})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedCompany.orders.map((order) => (
                    <div
                      key={order._id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedCompany(null);
                        setSelectedOrder(order);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">
                            {order.orderNumber || order.poNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(order.totalValue)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.items?.length || 0} items
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t rounded-b-xl flex justify-end">
              <button
                onClick={() => setSelectedCompany(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed z-50 inset-0 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="sticky z-30 top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Order Details
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {selectedOrder.orderNumber || selectedOrder.poNumber}
                  </p>
                  {isAdmin && (
                    <p className="text-purple-100 text-xs mt-1">
                      Company: {selectedOrder.submittedBy?.companyName || "N/A"}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Items</p>
                  <p className="text-xl font-bold text-blue-600">
                    {selectedOrder.items?.length || 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="text-xl font-bold text-green-600">
                    {getCompletedItems(selectedOrder).length}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Progress</p>
                  <p className="text-xl font-bold text-orange-600">
                    {selectedOrder.overallProgress || 0}%
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Value</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(selectedOrder.totalValue)}
                  </p>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={18} />
                Items in this Order ({selectedOrder.items?.length || 0})
              </h3>

              <div className="space-y-4">
                {selectedOrder.items?.map((item, idx) => {
                  const dispatchedQty = getDispatchedQuantity(item);
                  const remainingQty = getRemainingQuantity(item);
                  const dispatchProgress = getDispatchProgress(item);

                  return (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-blue-600 font-bold text-sm bg-blue-50 px-2 py-1 rounded">
                              {item.itemCode}
                            </span>
                            {item.progress === 100 && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                <CheckCircle size={12} /> Completed
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-gray-900">
                            {item.description}
                          </p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                            <span>
                              Total: {item.quantity} {item.unit || "pcs"}
                            </span>
                            <span className="text-green-600">
                              Dispatched: {dispatchedQty} {item.unit}
                            </span>
                            <span className="text-orange-600">
                              Remaining: {remainingQty} {item.unit}
                            </span>
                            <span>
                              Rate: {formatCurrency(item.ratePerUnit)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {isAdmin && editingProgress === item._id ? (
                            <div className="space-y-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={progressValue}
                                onChange={(e) =>
                                  setProgressValue(parseInt(e.target.value))
                                }
                                className="w-20 px-2 py-1 border rounded text-sm"
                              />
                              <select
                                value={stageValue}
                                onChange={(e) => setStageValue(e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm"
                              >
                                <option value="raw_material">
                                  Raw Material
                                </option>
                                <option value="tooling">Tooling</option>
                                <option value="production">Production</option>
                                <option value="quality">Quality</option>
                                <option value="dispatch">Dispatch</option>
                              </select>
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    handleUpdateProgress(
                                      selectedOrder._id,
                                      item._id,
                                      progressValue,
                                      stageValue,
                                    )
                                  }
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                                >
                                  <Save size={12} />
                                </button>
                                <button
                                  onClick={() => setEditingProgress(null)}
                                  className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-sm font-semibold text-blue-600">
                                {item.progress || 0}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {getStatusText(item.currentStage)}
                              </div>
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    setEditingProgress(item._id);
                                    setProgressValue(item.progress || 0);
                                    setStageValue(item.currentStage);
                                  }}
                                  className="mt-1 text-xs text-purple-600 hover:text-purple-800"
                                >
                                  <Edit size={12} className="inline" /> Edit
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {dispatchProgress > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Dispatch Progress</span>
                            <span>{dispatchProgress.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500 rounded-full"
                              style={{ width: `${dispatchProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="mt-3 flex justify-end gap-2">
                          {item.currentStage === "quality" &&
                            remainingQty > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedItemForDispatch(item);
                                  setDispatchModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 flex items-center gap-1"
                              >
                                <Send size={12} />
                                Dispatch Batch
                              </button>
                            )}
                          {item.dispatchRecords &&
                            item.dispatchRecords.length > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedItemForHistory(item);
                                  setDispatchHistoryModal(true);
                                }}
                                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-50 flex items-center gap-1"
                              >
                                <History size={12} />
                                History ({item.dispatchRecords.length})
                              </button>
                            )}
                        </div>
                      )}

                      {!isAdmin && (
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={async () => {
                              const freshHistory =
                                await fetchItemDispatchHistory(
                                  selectedOrder._id,
                                  item._id,
                                );
                              const updatedItem = {
                                ...item,
                                dispatchRecords: freshHistory,
                              };
                              setSelectedItemForHistory(updatedItem);
                              setDispatchHistoryModal(true);
                            }}
                            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-50 flex items-center gap-1"
                          >
                            <History size={12} />
                            View History
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && dispatchModalOpen && selectedItemForDispatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Dispatch Item</h3>
                <button
                  onClick={() => {
                    setDispatchModalOpen(false);
                    setSelectedItemForDispatch(null);
                    setSelectedFileQC(null);
                    setSelectedFileMTC(null);
                    setDispatchQuantity(1);
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Item</p>
                <p className="font-medium">
                  {selectedItemForDispatch.description}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <span className="ml-1 font-medium">
                      {selectedItemForDispatch.quantity}{" "}
                      {selectedItemForDispatch.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Remaining:</span>
                    <span className="ml-1 font-medium text-orange-600">
                      {getRemainingQuantity(selectedItemForDispatch)}{" "}
                      {selectedItemForDispatch.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dispatch Quantity ({selectedItemForDispatch.unit})
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max={getRemainingQuantity(selectedItemForDispatch)}
                    value={dispatchQuantity}
                    onChange={(e) =>
                      setDispatchQuantity(
                        Math.min(
                          parseInt(e.target.value) || 1,
                          getRemainingQuantity(selectedItemForDispatch),
                        ),
                      )
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() =>
                      setDispatchQuantity(
                        getRemainingQuantity(selectedItemForDispatch),
                      )
                    }
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  QC Report *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    id="qc-dispatch"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFileQC(e.target.files[0])}
                    className="hidden"
                  />
                  <label htmlFor="qc-dispatch" className="cursor-pointer block">
                    <Upload size={24} className="mx-auto text-gray-400 mb-1" />
                    <p className="text-sm text-gray-600">
                      {selectedFileQC
                        ? selectedFileQC.name
                        : "Click to upload QC Report"}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MTC Certificate *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    id="mtc-dispatch"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFileMTC(e.target.files[0])}
                    className="hidden"
                  />
                  <label
                    htmlFor="mtc-dispatch"
                    className="cursor-pointer block"
                  >
                    <Shield size={24} className="mx-auto text-gray-400 mb-1" />
                    <p className="text-sm text-gray-600">
                      {selectedFileMTC
                        ? selectedFileMTC.name
                        : "Click to upload MTC Certificate"}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setDispatchModalOpen(false);
                  setSelectedItemForDispatch(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatch}
                disabled={
                  !selectedFileQC ||
                  !selectedFileMTC ||
                  uploadingQC ||
                  uploadingMTC
                }
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploadingQC || uploadingMTC ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Dispatch {dispatchQuantity} {selectedItemForDispatch.unit}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {dispatchHistoryModal && selectedItemForHistory && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDispatchHistoryModal(false);
              setSelectedItemForHistory(null);
            }
          }}
        >
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 rounded-t-xl z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Dispatch History
                  </h3>
                  <p className="text-purple-100 text-xs mt-1">
                    {selectedItemForHistory.itemCode} -{" "}
                    {selectedItemForHistory.description?.substring(0, 50)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDispatchHistoryModal(false);
                    setSelectedItemForHistory(null);
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Quantity</p>
                  <p className="text-lg font-bold text-blue-600">
                    {selectedItemForHistory.quantity}{" "}
                    {selectedItemForHistory.unit}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Dispatched</p>
                  <p className="text-lg font-bold text-green-600">
                    {getDispatchedQuantity(selectedItemForHistory)}{" "}
                    {selectedItemForHistory.unit}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="text-lg font-bold text-orange-600">
                    {getRemainingQuantity(selectedItemForHistory)}{" "}
                    {selectedItemForHistory.unit}
                  </p>
                </div>
              </div>

              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <History size={16} />
                Dispatch Batches (
                {selectedItemForHistory.dispatchRecords?.length || 0})
              </h4>

              {selectedItemForHistory.dispatchRecords &&
              selectedItemForHistory.dispatchRecords.length > 0 ? (
                <div className="space-y-3">
                  {selectedItemForHistory.dispatchRecords.map(
                    (record, idx) => (
                      console.log("Record:", record),
                      (
                        <div
                          key={record._id || idx}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex flex-wrap justify-between items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-mono">
                                  Batch #{idx + 1}
                                </span>
                                {record.trackingNumber && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-mono">
                                    {record.trackingNumber}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-gray-500">
                                    Quantity Dispatched
                                  </p>
                                  <p className="font-semibold text-gray-900">
                                    {record.quantity}{" "}
                                    {record.unit || selectedItemForHistory.unit}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-gray-500">Dispatch Date</p>
                                  <p className="font-semibold text-gray-900">
                                    {formatDate(record.dispatchDate)}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-gray-500">Dispatched By</p>
                                  <p className="font-semibold text-gray-900">
                                    {record.dispatchedBy || "N/A"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-gray-500">Bill No.</p>
                                  <p className="font-semibold text-gray-900">
                                    {record.billNumber || "N/A"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-gray-500">Bill Document</p>

                                  {record.billFile ? (
                                    <a
                                      href={record.billFile}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      <FaEye />
                                      View Bill
                                    </a>
                                  ) : (
                                    <p className="font-semibold text-gray-900">
                                      N/A
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {record.qcReport && (
                                <button
                                  onClick={() => {
                                    const url = record.qcReport.url;
                                    if (url) window.open(url, "_blank");
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 flex items-center gap-1 transition-colors"
                                >
                                  <FileText size={12} />
                                  QC Report
                                </button>
                              )}
                              {record.mtcReport && (
                                <button
                                  onClick={() => {
                                    const url = record.mtcReport.url;
                                    if (url) window.open(url, "_blank");
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700 flex items-center gap-1 transition-colors"
                                >
                                  <Shield size={12} />
                                  MTC Report
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    ),
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <History size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">
                    No dispatch records found for this item
                  </p>
                  {isAdmin && (
                    <p className="text-xs text-gray-400 mt-2">
                      Dispatch items to see history here
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl flex justify-end">
              <button
                onClick={() => {
                  setDispatchHistoryModal(false);
                  setSelectedItemForHistory(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Close
              </button>
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
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default TrackOrderItem;
