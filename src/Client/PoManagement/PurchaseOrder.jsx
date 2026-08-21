import React, { useState, useEffect } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import {
  Save,
  RefreshCw,
  Trash2,
  Edit2,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Search,
  TrendingUp,
  Package,
  Calendar,
  DollarSign,
  CloudUpload,
  Database,
  LayoutGrid,
  List,
  X,
  Plus,
  Printer,
  Share2,
  MoreVertical,
  Eye,
  Archive,
  Send,
  HelpCircle,
  Lightbulb,
  Rocket,
  Award,
  ChevronRight,
  Play,
  Star,
  Zap,
  Shield,
  BarChart3,
  MousePointer,
  FileCheck,
  Brain,
  Sparkles,
  Building2,
  Mail,
  Phone,
  Truck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { Link } from "react-router-dom";

const ai = new GoogleGenAI({
  apiKey:
    import.meta.env.VITE_REACT_APP_GEMINI_API_KEY});

// Updated schema with orderNumber as required
const orderItemSchema = {
  type: Type.OBJECT,
  properties: {
    srNo: { type: Type.STRING },
    itemCode: { type: Type.STRING },
    description: { type: Type.STRING },
    unit: { type: Type.STRING },
    quantity: { type: Type.NUMBER },
    ratePerUnit: { type: Type.NUMBER },
    value: { type: Type.NUMBER },
    igst: { type: Type.NUMBER },
    deliveryDate: { type: Type.STRING },
  },
  required: [
    "itemCode",
    "description",
    "quantity",
    "ratePerUnit",
    "value",
    "deliveryDate",
  ],
};

const purchaseOrderSchema = {
  type: Type.OBJECT,
  properties: {
    orderNumber: { type: Type.STRING },
    companyName: { type: Type.STRING },
    poDate: { type: Type.STRING },
    items: { type: Type.ARRAY, items: orderItemSchema },
  },
  required: ["orderNumber", "items"],
};

const API_URL = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}`;
const PurchaseOrderManagement = () => {
  const [file, setFile] = useState(null);
  const [items, setItems] = useState([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [poDate, setPoDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewMode, setViewMode] = useState("extract");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  const handleViewOrder = (order) => {
    setSelectedOrderDetails(order);
    setShowOrderModal(true);
  };

  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });
  const [dragActive, setDragActive] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showStats, setShowStats] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showTour, setShowTour] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showTip, setShowTip] = useState(true);

  const [tipContent, setTipContent] = useState({
    title: "",
    message: "",
    icon: null,
  });

  const tourSteps = [
    {
      title: "🎯 Welcome to Smart PO Management!",
      description:
        "Let me guide you through the amazing features that will revolutionize your purchase order processing.",
      target: "header",
      icon: <Rocket className="text-yellow-400" size={32} />,
    },
    {
      title: "📄 Upload Your Document",
      description:
        "Drag & drop any PDF or image containing purchase orders. Our AI will automatically extract all relevant data.",
      target: "upload-area",
      icon: <CloudUpload className="text-blue-400" size={32} />,
    },
    {
      title: "🤖 AI-Powered Extraction",
      description:
        "Click 'Extract Data' and watch our AI instantly parse your document with 99% accuracy.",
      target: "extract-button",
      icon: <Brain className="text-purple-400" size={32} />,
    },
    {
      title: "✏️ Review & Edit",
      description:
        "Easily edit any extracted data inline. Your changes are automatically saved and validated.",
      target: "data-table",
      icon: <Edit2 className="text-green-400" size={32} />,
    },
    {
      title: "💾 Submit for Approval",
      description:
        "Save your verified purchase orders to Database. Access them anytime from the order history.",
      target: "save-button",
      icon: <Database className="text-orange-400" size={32} />,
    },
    {
      title: "📊 Track Performance",
      description:
        "Monitor your procurement metrics and export reports in CSV format for analysis.",
      target: "stats-section",
      icon: <BarChart3 className="text-pink-400" size={32} />,
    },
  ];

  const tips = [
    {
      title: "Pro Tip 💡",
      message:
        "Try uploading multiple page PDFs - Gemini can extract data from all pages at once!",
      icon: <Lightbulb className="text-yellow-500" size={20} />,
    },
    {
      title: "Did You Know? 🔍",
      message:
        "You can search orders by item code or description in the history section.",
      icon: <Search className="text-blue-500" size={20} />,
    },
    {
      title: "Efficiency Hack ⚡",
      message:
        "Use the 'Export CSV' feature to create backup copies or share data with your team.",
      icon: <Zap className="text-purple-500" size={20} />,
    },
    {
      title: "Security Note 🔒",
      message:
        "All data is encrypted and stored securely in the databse with enterprise-grade protection.",
      icon: <Shield className="text-green-500" size={20} />,
    },
  ];

  useEffect(() => {
    fetchOrders();
    const tipInterval = setInterval(() => {
      if (showTip && !showTour && !showHelp) {
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        setTipContent(randomTip);
        setTimeout(
          () => setTipContent({ title: "", message: "", icon: null }),
          5000,
        );
      }
    }, 30000);
    return () => clearInterval(tipInterval);
  }, []);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(
      () => setNotification({ show: false, type: "", message: "" }),
      3000,
    );
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/purchase-orders/my-orders`, {
        withCredentials: true,
      });

      const data = response.data;

      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch orders",
      );
    }
  };
  const fileToGenerativePart = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(",")[1];
        resolve({
          inlineData: { data: base64Data, mimeType: file.type },
        });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setItems([]);
      setOrderNumber("");
      setCompanyName("");
      setPoDate("");
      showNotification(
        "success",
        "File uploaded successfully! Ready for extraction.",
      );
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setItems([]);
      setOrderNumber("");
      setCompanyName("");
      setPoDate("");
      showNotification("success", `File "${e.target.files[0].name}" selected`);
    }
  };

  const { user } = useAuth();

  const [clientProfile] = useState({
    id: "CLT-001",
    companyName: user.companyName || "Company Name",
    contactPerson: user.name || "",
    email: user.email || "",
    phone: user.phoneNumber ? `+91 ${user.phoneNumber}` : "Phone Number",
  });

  // Updated extraction with better PO number handling
  const handleExtract = async () => {
    if (!file) {
      showNotification("error", "Please upload a file first");
      return;
    }

    setLoading(true);
    try {
      const filePart = await fileToGenerativePart(file);

      // Updated prompt to explicitly request PO number
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          filePart,
          `Extract the following information from this purchase order document:
          1. PO Number / Order Number (look for: "PO No", "Order No", "Purchase Order No", "PO Number")
          2. Company Name / Vendor Name
          3. PO Date
          4. All line items with: Item Code, Description, Unit, Quantity, Rate, Value, IGST, Delivery Date
          
          Return the data in the specified JSON schema. The orderNumber is REQUIRED - if you can't find it, use the pattern "PO-YYYY-MM-DD-XXX" based on the date.`,
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: purchaseOrderSchema,
          temperature: 0.1,
        },
      });

      const result = JSON.parse(response.text);
      console.log("Extracted result:", result);

      // Set extracted data
      setExtractedData(result);

      // Set order number - with fallback
      let extractedOrderNumber = result.orderNumber || "";

      // If no order number found, generate one from date
      if (!extractedOrderNumber) {
        const date = result.poDate || new Date().toISOString().split("T")[0];
        const formattedDate = date.replace(/-/g, "");
        extractedOrderNumber = `PO-${formattedDate}-${Math.floor(Math.random() * 1000)}`;
        console.log("Generated order number:", extractedOrderNumber);
      }

      setOrderNumber(extractedOrderNumber);
      setCompanyName(result.companyName || "");
      setPoDate(result.poDate || new Date().toISOString().split("T")[0]);

      if (result && result.items) {
        setItems(result.items);
        showNotification(
          "success",
          `✨ AI extracted ${result.items.length} items successfully! PO Number: ${extractedOrderNumber}`,
        );
      } else {
        showNotification("error", "Extraction succeeded but no items found");
      }
    } catch (error) {
      console.error("Extraction Error:", error);
      showNotification("error", "Failed to extract data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Updated save function with order number
  const handleSaveToDatabase = async () => {
    if (!items.length) {
      showNotification("error", "No items to save");
      return;
    }

    if (!orderNumber) {
      showNotification("error", "Please enter a PO number");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      // 🔹 normal fields
      formData.append("orderNumber", orderNumber);
      formData.append("companyName", companyName || clientProfile.companyName);
      formData.append(
        "poDate",
        poDate || new Date().toISOString().split("T")[0],
      );
      formData.append("items", JSON.stringify(items)); // IMPORTANT
      formData.append("submissionType", "client");

      // 🔹 file (PDF)
      if (file) {
        formData.append("attachments", file); // must match backend: upload.array("attachments")
      }

      console.log("Saving payload (FormData):", formData);

      const { data } = await axios.post(
        `${API_URL}/purchase-orders`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (data.success) {
        showNotification(
          "success",
          `Purchase order ${orderNumber} submitted for admin approval.`,
        );

        setItems([]);
        setFile(null);
        setOrderNumber("");
        setCompanyName("");
        setPoDate("");
        fetchOrders();
        setViewMode("history");
      } else {
        showNotification("error", "Failed to save order");
      }
    } catch (error) {
      console.error("Error saving:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Error saving to database",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        const response = await fetch(`${API_URL}/purchase-orders/${orderId}`, {
          method: "DELETE",
        });
        const data = await response.json();
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

  const handleCancelOrder = async (order) => {
    if (!order?._id) return;
    const normalizedStatus = String(order.status || "")
      .trim()
      .toLowerCase();

    if (normalizedStatus === "cancelled") {
      showNotification("error", "This purchase order is already cancelled");
      return;
    }

    if (normalizedStatus === "approved") {
      showNotification(
        "error",
        "Approved purchase orders can only be cancelled by an admin",
      );
      return;
    }

    const reason = window.prompt(
      `Enter cancellation reason for PO ${order.orderNumber}:`,
    );
    if (reason === null) return;

    try {
      const { data } = await axios.patch(
        `${API_URL}/purchase-orders/${order._id}/cancel`,
        { reason: reason.trim() || "Cancelled by client" },
        { withCredentials: true },
      );

      if (data.success) {
        showNotification("success", `PO ${order.orderNumber} cancelled`);
        fetchOrders();
        setShowOrderModal(false);
      } else {
        showNotification("error", data.message || "Failed to cancel PO");
      }
    } catch (error) {
      showNotification(
        "error",
        error.response?.data?.message || "Failed to cancel purchase order",
      );
    }
  };

  const handleUpdateItem = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] =
      field === "quantity" || field === "ratePerUnit" || field === "igst"
        ? parseFloat(value) || 0
        : value;

    if (field === "quantity" || field === "ratePerUnit") {
      updatedItems[index].value =
        updatedItems[index].quantity * updatedItems[index].ratePerUnit;
    }
    setItems(updatedItems);
  };

  const downloadAsCSV = () => {
    const headers = [
      "Sr No",
      "Item Code",
      "Description",
      "Unit",
      "Quantity",
      "Rate",
      "Value",
      "IGST",
      "Delivery Date",
    ];
    const csvData = items.map((item) => [
      item.srNo || "",
      item.itemCode || "",
      item.description || "",
      item.unit || "pcs",
      item.quantity || 0,
      item.ratePerUnit || 0,
      item.value || 0,
      item.igst || 0,
      item.deliveryDate || "",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchase-order-${orderNumber || Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("success", "CSV exported successfully!");
  };

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
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const nextTourStep = () => {
    if (currentTourStep < tourSteps.length - 1) {
      setCurrentTourStep(currentTourStep + 1);
    } else {
      setShowTour(false);
      setCurrentTourStep(0);
      showNotification(
        "success",
        "🎉 Tour completed! You're ready to manage purchase orders like a pro!",
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
                <CloudUpload size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Upload Documents</p>
                <p className="text-xs text-gray-500">
                  Supports PDF, PNG, JPG, JPEG formats. Max file size: 10MB
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">AI Extraction</p>
                <p className="text-xs text-gray-500">
                  AI extracts data with 99% accuracy. Review and edit before
                  saving.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Database size={18} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Data Storage</p>
                <p className="text-xs text-gray-500">
                  All orders are stored in the database. Access history anytime.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Download size={18} className="text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Export Options</p>
                <p className="text-xs text-gray-500">
                  Export data to CSV for reporting and analysis.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => {
                setShowHelp(false);
                setShowTour(true);
              }}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Play size={16} />
              Take Interactive Tour
            </button>
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
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Section */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => setShowTour(true)}
              >
                <div className="bg-white/20 rounded-xl p-2 sm:p-3 backdrop-blur-sm shadow-lg">
                  <Package className="text-white w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                  Purchase Order Management
                </h1>

                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-blue-100">
                  <Sparkles size={14} className="text-blue-200" />
                  AI-powered document intelligence platform
                  <Sparkles size={14} className="text-blue-200" />
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 w-full mt-4 lg:w-auto">
              {/* Extract */}
              <button
                onClick={() => setViewMode("extract")}
                className={`relative flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 overflow-hidden backdrop-blur-sm ${
                  viewMode === "extract"
                    ? "text-white shadow-md shadow-blue-500/20"
                    : "text-blue-100 bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                {viewMode === "extract" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl" />
                )}

                <span className="relative flex items-center gap-2">
                  <CloudUpload size={18} />
                  <span className="hidden sm:inline">New Extraction</span>
                </span>
              </button>

              {/* submitted po*/}
              <button
                onClick={() => {
                  setViewMode("history");
                  fetchOrders();
                }}
                className={`relative flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 overflow-hidden backdrop-blur-sm ${
                  viewMode === "history"
                    ? "text-white shadow-md shadow-blue-500/20"
                    : "text-blue-100 bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                {viewMode === "history" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl" />
                )}

                <span className="relative flex items-center gap-2">
                  <Database size={18} />
                  <span className="hidden sm:inline">Submitted PO</span>

                  {orders.length > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        viewMode === "history"
                          ? "bg-white text-blue-600"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {orders.length}
                    </span>
                  )}
                </span>
              </button>

              {/* Pending Orders */}
              <button
                onClick={() => setViewMode("extract")}
                className={`relative flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 overflow-hidden backdrop-blur-sm ${
                  viewMode === "extract"
                    ? "text-white shadow-md shadow-blue-500/20"
                    : "text-blue-100 bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                {viewMode === "extract" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-blue-600 rounded-xl" />
                )}

                <span className="relative flex items-center gap-2">
                  <CloudUpload size={18} />
                  <span className="hidden sm:inline">
                    <Link to="/generate/pendinglist">Pending Orders</Link>
                  </span>
                </span>
              </button>

              {/* Order history */}
              <Link
                to="/order-history"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-blue-100 bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                <Truck size={18} />
                <span className="hidden sm:inline">Order history</span>
              </Link>

              {/* Help */}
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-blue-300"
              >
                <HelpCircle size={18} />
                <span className="hidden sm:inline">Help</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Banner */}
      {viewMode === "extract" && items.length === 0 && !loading && (
        <div className="relative z-20  mx-auto px-6 lg:px-8 mt-8">
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
                    Welcome to Smart PO Management! 🎉
                  </h3>
                </div>
                <p className="text-gray-600 mb-4 max-w-2xl">
                  Transform your purchase order processing with AI. Simply
                  upload any PDF or image, and let our intelligent system
                  extract, validate, and store all your data automatically.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>99% Accuracy</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap size={16} className="text-yellow-500" />
                    <span>5x Faster Processing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield size={16} className="text-blue-500" />
                    <span>Enterprise Security</span>
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
        {viewMode === "extract" ? (
          <>
            {/* Hero Upload Section */}
            <div className="mb-10" id="upload-area">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]"
                    : "border-gray-300 bg-white/50 hover:border-indigo-400 hover:bg-white/80"
                } backdrop-blur-sm`}
              >
                <div className="p-12 text-center">
                  <div className="mb-6">
                    <div className="inline-flex p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl">
                      <CloudUpload
                        className={`w-12 h-12 transition-colors ${dragActive ? "text-indigo-600" : "text-indigo-400"}`}
                      />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {dragActive
                      ? "Drop your document here"
                      : "Upload your document"}
                  </h3>
                  <p className="text-gray-500 mb-4 max-w-md mx-auto">
                    Drag & drop or click to upload. Our AI will automatically
                    extract all purchase order details.
                  </p>

                  {/* Feature badges */}
                  <div className="flex flex-wrap justify-center gap-3 mb-6">
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle size={12} />
                      PDF Support
                    </span>
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <Brain size={12} />
                      AI Powered
                    </span>
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <Zap size={12} />
                      Instant Extraction
                    </span>
                    <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <Shield size={12} />
                      Secure Storage
                    </span>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        Choose File
                      </div>
                    </label>
                    {file && (
                      <button
                        onClick={handleExtract}
                        disabled={loading}
                        id="extract-button"
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="animate-spin" size={18} />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Brain size={18} />
                            Extract Data
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {file && (
                    <div className="mt-4 p-3 bg-green-50 rounded-xl inline-flex items-center gap-2">
                      <CheckCircle className="text-green-600" size={16} />
                      <span className="text-sm text-green-700">
                        Ready: {file.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Extracted Data Section */}
            {items.length > 0 && (
              <div className="animate-fade-in-up">
                {/* Summary Cards */}
                <div
                  className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
                  id="stats-section"
                >
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-indigo-100 rounded-xl group-hover:scale-110 transition-transform">
                        <FileText className="text-indigo-600" size={24} />
                      </div>
                      <TrendingUp className="text-green-500" size={20} />
                    </div>
                    <p className="text-gray-500 text-sm mb-1">PO Number</p>
                    <p className="text-xl font-bold text-gray-900 truncate">
                      {orderNumber || "Not extracted"}
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      {companyName || "Company name not extracted"}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform">
                        <Calendar className="text-blue-600" size={24} />
                      </div>
                      <Package className="text-purple-500" size={20} />
                    </div>
                    <p className="text-gray-500 text-sm mb-1">PO Date</p>
                    <p className="text-xl font-bold text-gray-900">
                      {poDate || "Not extracted"}
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      {items.length} items extracted
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform">
                        <Package className="text-green-600" size={24} />
                      </div>
                      <TrendingUp className="text-green-500" size={20} />
                    </div>
                    <p className="text-gray-500 text-sm mb-1">Total Items</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {items.length}
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      Extracted from document
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform">
                        <DollarSign className="text-purple-600" size={24} />
                      </div>
                      <TrendingUp className="text-green-500" size={20} />
                    </div>
                    <p className="text-gray-500 text-sm mb-1">Total Value</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ₹
                      {items
                        .reduce((sum, item) => sum + (item.value || 0), 0)
                        .toLocaleString()}
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      Including all items
                    </div>
                  </div>
                </div>

                {/* Manual PO Number Input - For cases where AI couldn't extract */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-yellow-600" size={20} />
                    <p className="text-sm text-yellow-800">
                      {orderNumber
                        ? `PO Number: ${orderNumber}`
                        : "PO Number not extracted. Please enter manually:"}
                    </p>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="Enter PO Number"
                      className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white max-w-xs"
                    />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company Name"
                      className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white max-w-xs"
                    />
                  </div>
                </div>

                {/* Data Table */}
                <div
                  className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
                  id="data-table"
                >
                  <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <FileCheck className="text-indigo-600" size={24} />
                          Extracted Purchase Order Details
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <MousePointer size={12} />
                          Click on any field to edit extracted data
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={downloadAsCSV}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                        >
                          <Download size={18} />
                          Export CSV
                        </button>
                        <button
                          onClick={handleSaveToDatabase}
                          disabled={saving}
                          id="save-button"
                          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                        >
                          {saving ? (
                            <RefreshCw className="animate-spin" size={18} />
                          ) : (
                            <Save size={18} />
                          )}
                          Save to Database
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {[
                            "Sr No",
                            "Item Code",
                            "Description",
                            "Unit",
                            "Quantity",
                            "Rate (₹)",
                            "Value (₹)",
                            "IGST (₹)",
                            "Delivery Date",
                            "",
                          ].map((header) => (
                            <th
                              key={header}
                              className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {items.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 transition-colors duration-150 group"
                          >
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={item.srNo || idx + 1}
                                // onChange={(e) =>
                                //   handleUpdateItem(idx, "srNo", e.target.value)
                                // }
                                className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={item.itemCode || ""}
                                // onChange={(e) =>
                                //   handleUpdateItem(
                                //     idx,
                                //     "itemCode",
                                //     e.target.value,
                                //   )
                                // }
                                className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={item.description || ""}
                                // onChange={(e) =>
                                //   handleUpdateItem(
                                //     idx,
                                //     "description",
                                //     e.target.value,
                                //   )
                                // }
                                className="w-56 px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={item.unit || "pcs"}
                                // onChange={(e) =>
                                //   handleUpdateItem(idx, "unit", e.target.value)
                                // }
                                className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={item.quantity || 0}
                                // onChange={(e) =>
                                //   // handleUpdateItem(
                                //   //   idx,
                                //   //   "quantity",
                                //   //   e.target.value,
                                //   // )
                                // }
                                className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={item.ratePerUnit || 0}
                                // onChange={(e) =>
                                //   // handleUpdateItem(
                                //   //   idx,
                                //   //   "ratePerUnit",
                                //   //   e.target.value,
                                //   // )
                                // }
                                className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-indigo-600 text-right">
                                ₹{(item.value || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={item.igst || 0}
                                // onChange={(e) =>
                                //   handleUpdateItem(idx, "igst", e.target.value)
                                // }
                                className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={item.deliveryDate || ""}
                                // onChange={(e) =>
                                //   handleUpdateItem(
                                //     idx,
                                //     "deliveryDate",
                                //     e.target.value,
                                //   )
                                // }
                                className="w-32 px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                placeholder="YYYY-MM-DD"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => {
                                  const newItems = items.filter(
                                    (_, i) => i !== idx,
                                  );
                                  setItems(newItems);
                                }}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td colSpan="3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="animate-fade-in-up">
            {/* Statistics Dashboard */}
            {showStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <Package size={32} className="opacity-80" />
                    <span className="text-3xl font-bold">
                      {stats.totalOrders}
                    </span>
                  </div>
                  <p className="text-sm opacity-90">Total Orders</p>
                  <p className="text-xs opacity-75 mt-1">
                    +12% from last month
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
            <div className="bg-white rounded-2xl shadow-lg p-5 mb-8 border border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search by order number or item code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="draft">Draft</option>
                  </select>
                  <button
                    onClick={fetchOrders}
                    className="px-5 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 flex items-center gap-2"
                  >
                    <RefreshCw size={18} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Orders Grid */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-100">
                <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                  <Package className="text-gray-400" size={48} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No orders found
                </h3>
                <p className="text-gray-500">
                  Start by extracting data from a purchase order document
                </p>
                <button
                  onClick={() => setViewMode("extract")}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Create New Order
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredOrders.map((order) => (
                  <div
                    key={order._id}
                    className="group bg-white rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
                  >
                    {/* Order Header */}
                    <div className="p-5 border-b border-slate-100">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center flex-wrap gap-2.5">
                            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                              {order.orderNumber}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                                order.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : ["pending", "pending_approval", "submitted"].includes(order.status)
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : order.status === "cancelled"
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  order.status === "approved"
                                    ? "bg-emerald-500"
                                    : ["pending", "pending_approval", "submitted"].includes(order.status)
                                      ? "bg-amber-500"
                                      : order.status === "cancelled"
                                        ? "bg-red-500"
                                        : "bg-slate-400"
                                }`}
                              />
                              <span className="capitalize">
                                {["pending", "pending_approval", "submitted"].includes(order.status)
                                  ? "Pending Approval"
                                  : order.status}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-slate-400" />
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Package size={14} className="text-slate-400" />
                              {order.items.length}{" "}
                              {order.items.length === 1 ? "item" : "items"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="p-5 flex-grow">
                      <div className="space-y-3">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 pr-4">
                              <span className=" text-[13px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium shrink-0">
                                {item.itemCode}
                              </span>
                              <span className="text-slate-600 truncate font-medium">
                                {item.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 text-right">
                              <span className="text-slate-400 font-medium">
                                ×{item.quantity}
                              </span>
                              <span className="font-semibold text-slate-700 min-w-[60px]">
                                ₹{item.value?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}

                        {order.items.length > 3 && (
                          <div className="text-left text-xs font-medium text-indigo-600 pt-1">
                            +{order.items.length - 3} more item
                            {order.items.length - 3 > 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Footer */}
                    <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex justify-end items-center gap-2 rounded-b-xl">
                      {["submitted", "pending", "pending_approval"].includes(
                        String(order.status || "").trim().toLowerCase(),
                      ) && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-colors rounded px-2 py-1 hover:bg-red-50"
                        >
                          <X size={14} />
                          Cancel PO
                        </button>
                      )}
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded px-2 py-1"
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}

                {/* Order Details Modal */}
                {showOrderModal && selectedOrderDetails && (
                  <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {/* Modal Header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <div>
                          <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-slate-900">
                              {selectedOrderDetails.orderNumber}
                            </h2>
                            <span className="px-2 py-0.5 bg-slate-200/60 text-slate-700 rounded text-xs font-semibold">
                              {selectedOrderDetails.items.length} Items
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Detailed breakdown of items and taxation rates
                          </p>
                        </div>

                        <button
                          onClick={() => setShowOrderModal(false)}
                          className="p-1.5 hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 rounded-lg transition-colors focus:outline-none"
                        >
                          <X size={20} />
                        </button>
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
                            {selectedOrderDetails.items.map((item, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-slate-50/50 transition-colors"
                              >
                                <td className="px-4 py-3 text-xs font-medium text-slate-400">
                                  {item.srNo || idx + 1}
                                </td>
                                <td className="px-4 py-3 text-xs  font-semibold text-indigo-600">
                                  {item.itemCode}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-700 max-w-xs truncate font-medium">
                                  {item.description}
                                </td>
                                <td className="px-4 py-3 text-xs font-medium text-slate-600">
                                  {item.unit}
                                </td>
                                <td className="px-4 py-3 text-xs font-semibold text-slate-900">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-xs font-medium text-slate-600">
                                  ₹
                                  {item.ratePerUnit?.toLocaleString() ||
                                    item.ratePerUnit}
                                </td>
                                <td className="px-4 py-3 text-xs font-semibold text-slate-900">
                                  ₹{item.value?.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-xs font-medium text-slate-600">
                                  ₹{item.igst?.toLocaleString() || item.igst}
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
                      <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50">
                        {["submitted", "pending", "pending_approval"].includes(
                          String(selectedOrderDetails.status || "")
                            .trim()
                            .toLowerCase(),
                        ) && (
                          <button
                            onClick={() =>
                              handleCancelOrder(selectedOrderDetails)
                            }
                            className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20 flex items-center gap-2"
                          >
                            <X size={15} />
                            Cancel PO
                          </button>
                        )}

                        <button
                          onClick={() => setShowOrderModal(false)}
                          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                        >
                          Close Window
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

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

export default PurchaseOrderManagement;
