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
  Save,
  Edit2,
  Upload,
  MousePointer,
  FileCheck,
  Lightbulb,
  Rocket,
  Star,
  LayoutGrid,
  List,
  Plus,
  Truck,
  CircleAlert,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { GoogleGenAI, Type } from "@google/genai";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}`;

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_REACT_APP_GEMINI_API_KEY,
});

// Schema definitions
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

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    x: -30,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    x: 30,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

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

  // View mode state
  const [viewMode, setViewMode] = useState("history");

  // Extraction state
  const [file, setFile] = useState(null);
  const [items, setItems] = useState([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [poDate, setPoDate] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [extractionStep, setExtractionStep] = useState("upload");

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const clientProfile = {
    id: "CLT-001",
    companyName: user?.companyName || "Company Name",
    contactPerson: user?.name || "",
    email: user?.email || "",
    phone: user?.phoneNumber ? `+91 ${user.phoneNumber}` : "Phone Number",
  };

  // Tour steps with extraction included
  const tourSteps = [
    {
      title: "🎯 Welcome to Smart PO Dashboard!",
      description:
        "Let me guide you through the amazing features that will revolutionize your purchase order management.",
      target: "header",
      icon: <Rocket className="text-yellow-400" size={32} />,
    },
    {
      title: "📄 Extract New Purchase Order",
      description:
        "Upload any PDF or image containing purchase orders. Our AI will automatically extract all relevant data.",
      target: "extract-button",
      icon: <CloudUpload className="text-blue-400" size={32} />,
    },
    {
      title: "📊 View All Orders",
      description:
        "Browse through all your purchase orders in one centralized dashboard.",
      target: "orders-grid",
      icon: <Database className="text-purple-400" size={32} />,
    },
    {
      title: "🔍 Search & Filter",
      description:
        "Quickly find orders using search or filter by company to streamline your workflow.",
      target: "search-bar",
      icon: <Search className="text-green-400" size={32} />,
    },
    {
      title: "📈 Track Performance",
      description:
        "Monitor your procurement metrics and export reports for analysis.",
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
        "All data is encrypted and stored securely in the database with enterprise-grade protection.",
      icon: <Shield className="text-green-500" size={20} />,
    },
  ];

  const [tipContent, setTipContent] = useState({
    title: "",
    message: "",
    icon: null,
  });
  const [showTip, setShowTip] = useState(true);

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
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/purchase-orders`, {
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

  // Normalize company name
  const normalizeCompanyName = (name) => {
    if (!name) return "";
    return name.trim().toLowerCase();
  };

  const uniqueCompanies = useMemo(() => {
    const companyMap = new Map();
    orders.forEach((order) => {
      const company = order.submittedBy?.companyName;
      if (company) {
        const normalized = normalizeCompanyName(company);
        if (!companyMap.has(normalized)) {
          companyMap.set(normalized, company);
        }
      }
    });
    return Array.from(companyMap.values()).sort();
  }, [orders]);

  // File handling functions
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
      setExtractionStep("upload");
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
      setExtractionStep("upload");
      showNotification("success", `File "${e.target.files[0].name}" selected`);
    }
  };

  // Extraction function
  const handleExtract = async () => {
    if (!file) {
      showNotification("error", "Please upload a file first");
      return;
    }

    setExtracting(true);
    try {
      const filePart = await fileToGenerativePart(file);

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

      setExtractedData(result);

      let extractedOrderNumber = result.orderNumber || "";
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
        setExtractionStep("extracted");
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
      setExtracting(false);
    }
  };

  // Save to database
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
      formData.append("orderNumber", orderNumber);
      formData.append("companyName", companyName || clientProfile.companyName);
      formData.append(
        "poDate",
        poDate || new Date().toISOString().split("T")[0],
      );
      formData.append("items", JSON.stringify(items));

      if (file) {
        formData.append("attachments", file);
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
        const pendingSync = data?.data?.pendingSync || data?.pendingSync;
        const syncSuffix = pendingSync
          ? ` Pending PO: ${Number(pendingSync.inserted || 0)} inserted, ${Number(pendingSync.updated || 0)} updated${Number(pendingSync.skippedDuplicates || 0) ? `, ${Number(pendingSync.skippedDuplicates)} duplicate line(s) ignored` : ""}.`
          : "";

        showNotification(
          "success",
          `🎉 Purchase order ${orderNumber} saved successfully!${syncSuffix}`,
        );

        setItems([]);
        setFile(null);
        setOrderNumber("");
        setCompanyName("");
        setPoDate("");
        setExtractionStep("upload");
        setExtractedData(null);
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

  // Download CSV
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

  const filteredOrders = orders
    .filter((order) => {
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

      const matchesStatus =
        filterStatus === "all" || order.status === filterStatus;

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
        "🎉 Tour completed! You're ready to manage purchase orders like a pro!",
      );
    }
  };

  // Helper function for animated navigation
  const handleAnimatedNavigation = (path) => {
    if (location.pathname === path) return;
    navigate(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
    >
      {/* Interactive Tour Modal */}
      <AnimatePresence>
        {showTour && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowTour(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="fixed right-6 top-24 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
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
                  <p className="font-semibold text-sm">Extract New PO</p>
                  <p className="text-xs text-gray-500">
                    Upload PDF or images to automatically extract PO data using
                    AI
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Database size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">View All Orders</p>
                  <p className="text-xs text-gray-500">
                    Browse and manage all your purchase orders in one place
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Tip */}
      <AnimatePresence>
        {showTip && tipContent.title && !showTour && !showHelp && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 z-40 max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">{tipContent.icon}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">
                  {tipContent.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {tipContent.message}
                </p>
              </div>
              <button
                onClick={() =>
                  setTipContent({ title: "", message: "", icon: null })
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-sm ${
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600"
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Section */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer shrink-0"
                onClick={() => setShowTour(true)}
              >
                <div className="bg-white/20 rounded-xl p-2 sm:p-3 backdrop-blur-sm shadow-lg">
                  <Package className="text-white w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </motion.div>

              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                  Purchase Order Dashboard
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-blue-100">
                  <Sparkles size={14} className="text-blue-200" />
                  Centralized purchase order management platform
                  <Sparkles size={14} className="text-blue-200" />
                </p>
              </div>
            </div>

            {/* Right Section - All Header Options */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto">
              {/* Extract Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setViewMode("extract");
                  setFile(null);
                  setItems([]);
                  setExtractionStep("upload");
                }}
                className={`relative flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 overflow-hidden backdrop-blur-sm ${
                  viewMode === "extract"
                    ? "text-white shadow-md shadow-blue-500/20"
                    : "text-blue-100 bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                {viewMode === "extract" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl"
                  />
                )}
                <span className="relative flex items-center gap-1 sm:gap-2">
                  <CloudUpload size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm">Extract</span>
                </span>
              </motion.button>

              {/* History Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setViewMode("history");
                  fetchOrders();
                }}
                className={`relative flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 overflow-hidden backdrop-blur-sm ${
                  viewMode === "history"
                    ? "text-white shadow-md shadow-blue-500/20"
                    : "text-blue-100 bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                {viewMode === "history" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl"
                  />
                )}
                <span className="relative flex items-center gap-1 sm:gap-2">
                  <Database size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm">All POs</span>
                  {orders.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${
                        viewMode === "history"
                          ? "bg-white text-blue-600"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {orders.length}
                    </motion.span>
                  )}
                </span>
              </motion.button>

              {/* Pending Orders Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  handleAnimatedNavigation("/generate/pendinglist")
                }
                className={`relative flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 overflow-hidden backdrop-blur-sm ${
                  location.pathname === "/pending-purchase-orders"
                    ? "text-white shadow-md shadow-blue-500/20"
                    : "text-blue-100 bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                {location.pathname === "/generate/pendinglist" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl"
                  />
                )}
                <span className="relative flex items-center gap-1 sm:gap-2">
                  <CloudUpload size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm">Pending Orders</span>
                </span>
              </motion.button>

              {/* Rejection Item Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnimatedNavigation("/order-history")}
                className={`relative flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 overflow-hidden backdrop-blur-sm ${
                  location.pathname === "/order-tracking"
                    ? "text-white shadow-md shadow-blue-500/20"
                    : "text-blue-100 bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                {location.pathname === "/rejection-items" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl"
                  />
                )}
                <span className="relative flex items-center gap-1 sm:gap-2">
                  <CircleAlert size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm">Rejection Items</span>
                </span>
              </motion.button>
              {/* Dispatch history Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnimatedNavigation("/order-history")}
                className={`relative flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 overflow-hidden backdrop-blur-sm ${
                  location.pathname === "/order-tracking"
                    ? "text-white shadow-md shadow-blue-500/20"
                    : "text-blue-100 bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                {location.pathname === "/order-history" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl"
                  />
                )}
                <span className="relative flex items-center gap-1 sm:gap-2">
                  <Truck size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm">Dispatch history</span>
                </span>
              </motion.button>

              {/* Help Button */}
              <motion.button
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHelp(!showHelp)}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-medium transition-all duration-300 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-blue-300"
              >
                <HelpCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="text-xs sm:text-sm">Help</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Welcome Banner */}
      {viewMode === "extract" && items.length === 0 && !extracting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-20 mx-auto px-6 lg:px-8 mt-8"
        >
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
                    Welcome to Smart PO Dashboard! 🎉
                  </h3>
                </div>
                <p className="text-gray-600 mb-4 max-w-2xl">
                  Transform your purchase order management with AI. Upload any
                  PDF or image to extract data, or browse your existing orders
                  in one place.
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTour(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Play size={18} />
                Take Quick Tour
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative z-20 mx-auto px-6 lg:px-8 py-8"
        >
          <div className="animate-fade-in-up">
            {viewMode === "extract" ? (
              // Extraction View
              <div id="extraction-area">
                {/* Hero Upload Section */}
                <div className="mb-10" id="upload-area">
                  <motion.div
                    whileHover={{ scale: 1.01 }}
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
                        <motion.div
                          animate={{
                            y: dragActive ? -10 : 0,
                            scale: dragActive ? 1.1 : 1,
                          }}
                          className="inline-flex p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl"
                        >
                          <CloudUpload
                            className={`w-12 h-12 transition-colors ${
                              dragActive ? "text-indigo-600" : "text-indigo-400"
                            }`}
                          />
                        </motion.div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {dragActive
                          ? "Drop your document here"
                          : "Upload your document"}
                      </h3>
                      <p className="text-gray-500 mb-4 max-w-md mx-auto">
                        Drag & drop or click to upload. Our AI will
                        automatically extract all purchase order details.
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

                      <div className="flex gap-4 justify-center flex-wrap">
                        <motion.label
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="cursor-pointer"
                        >
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <div className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                            Choose File
                          </div>
                        </motion.label>
                        {file && (
                          <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleExtract}
                            disabled={extracting}
                            id="extract-button"
                            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {extracting ? (
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
                          </motion.button>
                        )}
                      </div>
                      {file && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-3 bg-green-50 rounded-xl inline-flex items-center gap-2"
                        >
                          <CheckCircle className="text-green-600" size={16} />
                          <span className="text-sm text-green-700">
                            Ready: {file.name}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Extracted Data Section */}
                <AnimatePresence>
                  {items.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      className="animate-fade-in-up"
                    >
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {[
                          {
                            label: "PO Number",
                            value: orderNumber || "Not extracted",
                            sub: companyName || "Company name not extracted",
                            icon: (
                              <FileText className="text-indigo-600" size={24} />
                            ),
                            bg: "bg-indigo-100",
                          },
                          {
                            label: "PO Date",
                            value: poDate || "Not extracted",
                            sub: `${items.length} items extracted`,
                            icon: (
                              <Calendar className="text-blue-600" size={24} />
                            ),
                            bg: "bg-blue-100",
                          },
                          {
                            label: "Total Items",
                            value: items.length,
                            sub: "Extracted from document",
                            icon: (
                              <Package className="text-green-600" size={24} />
                            ),
                            bg: "bg-green-100",
                          },
                          {
                            label: "Total Value",
                            value: `₹${items
                              .reduce((sum, item) => sum + (item.value || 0), 0)
                              .toLocaleString()}`,
                            sub: "Including all items",
                            icon: (
                              <DollarSign
                                className="text-purple-600"
                                size={24}
                              />
                            ),
                            bg: "bg-purple-100",
                          },
                        ].map((card, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{
                              scale: 1.02,
                              boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
                            }}
                            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 group"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div
                                className={`p-3 ${card.bg} rounded-xl group-hover:scale-110 transition-transform`}
                              >
                                {card.icon}
                              </div>
                              <TrendingUp
                                className="text-green-500"
                                size={20}
                              />
                            </div>
                            <p className="text-gray-500 text-sm mb-1">
                              {card.label}
                            </p>
                            <p className="text-xl font-bold text-gray-900 truncate">
                              {card.value}
                            </p>
                            <div className="mt-2 text-xs text-gray-400">
                              {card.sub}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Manual PO Number Input */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <div className="flex flex-wrap items-center gap-3">
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
                            className="flex-1 min-w-[150px] px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                          />
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Company Name"
                            className="flex-1 min-w-[150px] px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                          />
                        </div>
                      </div>

                      {/* Data Table */}
                      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <FileCheck
                                  className="text-indigo-600"
                                  size={24}
                                />
                                Extracted Purchase Order Details
                              </h2>
                              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                <MousePointer size={12} />
                                Review extracted data before saving
                              </p>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={downloadAsCSV}
                                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                              >
                                <Download size={18} />
                                Export CSV
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSaveToDatabase}
                                disabled={saving}
                                id="save-button"
                                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                              >
                                {saving ? (
                                  <RefreshCw
                                    className="animate-spin"
                                    size={18}
                                  />
                                ) : (
                                  <Save size={18} />
                                )}
                                Save to Database
                              </motion.button>
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
                                  "Qty",
                                  "Rate (₹)",
                                  "Value (₹)",
                                  "IGST (₹)",
                                  "Delivery Date",
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
                                <motion.tr
                                  key={idx}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="hover:bg-gray-50 transition-colors duration-150"
                                >
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {item.srNo || idx + 1}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                                    {item.itemCode || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                    {item.description || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {item.unit || "pcs"}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                    {item.quantity || 0}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    ₹{item.ratePerUnit?.toLocaleString() || 0}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                    ₹{item.value?.toLocaleString() || 0}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    ₹{item.igst?.toLocaleString() || 0}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {item.deliveryDate || "-"}
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // History View
              <>
                {/* Statistics Dashboard */}
                {showStats && orders.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
                    id="stats-section"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Package size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">
                          {stats.totalOrders}
                        </span>
                      </div>
                      <p className="text-sm opacity-90">Total Orders</p>
                      <p className="text-xs opacity-75 mt-1">
                        {stats.totalOrders > 0
                          ? "Active orders"
                          : "No orders yet"}
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Package size={28} className="text-purple-600" />
                        <span className="text-2xl font-bold text-gray-900">
                          {stats.totalItems}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">
                        Total Items Ordered
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Across all purchase orders
                      </p>
                    </motion.div>
                  </motion.div>
                )}

                {/* Search and Filter Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchOrders}
                        disabled={loading}
                        className="px-5 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw
                          size={18}
                          className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                      </motion.button>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {(filterCompany !== "all" ||
                    filterStatus !== "all" ||
                    searchTerm) && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Active Filters:
                      </span>
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
                </motion.div>

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
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-100"
                    >
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
                          : "Upload a document to extract a new purchase order"}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setViewMode("extract");
                          setFile(null);
                          setItems([]);
                          setExtractionStep("upload");
                        }}
                        className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
                      >
                        <CloudUpload size={18} />
                        Extract New PO
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-gray-300 overflow-auto"
                    >
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
                            <motion.tr
                              key={order._id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className={`hover:bg-blue-50 ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }`}
                            >
                              <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                {order.universalId || "N/A"}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {order.orderNumber}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {order.items.length}{" "}
                                    {order.items.length === 1
                                      ? "item"
                                      : "items"}
                                  </div>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                {order.submittedBy?.companyName ||
                                  order.companyName ||
                                  "N/A"}
                              </td>
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
                              <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                ₹{order.totalValue?.toLocaleString() || 0}
                              </td>
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
                              <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                <div className="flex justify-center items-center gap-2">
                                  {order.attachments?.length > 0 && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => {
                                        const pdfUrl =
                                          order.attachments?.[0]?.url;
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
                                    </motion.button>
                                  )}
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleViewOrder(order)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                    title="View"
                                  >
                                    <Eye size={16} />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDeleteOrder(order._id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.main>
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-7xl h-[95vh] sm:h-[90vh] flex flex-col overflow-auto"
            >
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
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => downloadOrderPDF(selectedOrder)}
                    className="p-1.5 hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 rounded-lg transition-colors focus:outline-none disabled:opacity-50"
                    title="Download PDF"
                  >
                    {downloadingPdf === selectedOrder._id ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : (
                      <Download size={20} />
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowOrderModal(false)}
                    className="p-1.5 hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 rounded-lg transition-colors focus:outline-none"
                  >
                    <X size={20} />
                  </motion.button>
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
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
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
                          {item.ratePerUnit?.toLocaleString() ||
                            item.ratePerUnit}
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
                      </motion.tr>
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
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
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
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
          
        )}
      </AnimatePresence>

      {/* CSS */}
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
    </motion.div>
  );
};

export default AllPo;
