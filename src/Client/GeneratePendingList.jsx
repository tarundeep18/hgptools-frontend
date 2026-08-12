import React, { useState, useCallback, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  Search,
  Filter,
  Edit2,
  Save,
  X,
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  DollarSign,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronRight,
  PieChart,
  BarChart3,
  Calendar,
  Truck,
  AlertTriangle,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Settings,
  Printer,
  Mail,
  MoreVertical,
  Plus,
  Minus,
  Zap,
  Shield,
  Globe,
  Award,
  History,
  FileText,
  User,
  MapPin,
  Phone,
  Mail as MailIcon,
  Calendar as CalendarIcon,
  Info,
  Check,
  AlertOctagon,
  FileCheck,
  ClipboardList,
  Send,
  Printer as PrinterIcon,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Maximize2,
  Minimize2,
} from "lucide-react";

// ============================================
// DISPATCH HISTORY ITEM COMPONENT
// ============================================
const DispatchHistoryItem = ({ entry, index }) => {
  const statusColors = {
    Completed: "bg-green-100 text-green-800",
    Partial: "bg-yellow-100 text-yellow-800",
    Pending: "bg-red-100 text-red-800",
    "In Transit": "bg-blue-100 text-blue-800",
    Delivered: "bg-purple-100 text-purple-800",
  };

  const statusIcons = {
    Completed: <CheckCircle className="w-3 h-3" />,
    Partial: <AlertCircle className="w-3 h-3" />,
    Pending: <Clock className="w-3 h-3" />,
    "In Transit": <Truck className="w-3 h-3" />,
    Delivered: <Package className="w-3 h-3" />,
  };

  return (
    <div className="border-l-4 border-blue-400 pl-4 py-2 hover:bg-gray-50 transition-colors animate-slideIn">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            #{index + 1}
          </span>
          <span className="text-sm font-semibold text-gray-800">
            {entry.dispatchQty} units
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[entry.status] || "bg-gray-100 text-gray-800"}`}
          >
            {statusIcons[entry.status]}
            {entry.status || "Pending"}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            {entry.dispatchDate || "N/A"}
          </span>
          {entry.billNumber && (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Bill: {entry.billNumber}
            </span>
          )}
        </div>
      </div>

      {entry.remarks && (
        <p className="text-sm text-gray-600 mt-1 ml-1">{entry.remarks}</p>
      )}

      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 flex-wrap">
        {entry.transportMode && <span>🚚 {entry.transportMode}</span>}
        {entry.trackingNumber && (
          <span>📦 Tracking: {entry.trackingNumber}</span>
        )}
        {entry.receivedBy && <span>👤 Received by: {entry.receivedBy}</span>}
      </div>
    </div>
  );
};

// ============================================
// DISPATCH MODAL COMPONENT WITH ANIMATIONS
// ============================================
const DispatchModal = ({
  isOpen,
  onClose,
  item,
  onDispatchUpdate,
  dispatchHistory = [],
}) => {
  const [dispatchQty, setDispatchQty] = useState("");
  const [dispatchDate, setDispatchDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [billNumber, setBillNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [transportMode, setTransportMode] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [status, setStatus] = useState("Partial");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [errors, setErrors] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("dispatch");
  const [animation, setAnimation] = useState("fadeIn");

  const validate = () => {
    const newErrors = {};
    if (!dispatchQty || parseFloat(dispatchQty) <= 0) {
      newErrors.dispatchQty = "Please enter a valid dispatch quantity";
    }
    if (parseFloat(dispatchQty) > (item?.pending || 0)) {
      newErrors.dispatchQty = `Cannot dispatch more than pending quantity (${item?.pending})`;
    }
    if (!dispatchDate) {
      newErrors.dispatchDate = "Please select a dispatch date";
    }
    if (!billNumber.trim()) {
      newErrors.billNumber = "Please enter a bill number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setAnimation("fadeOut");

    const dispatchEntry = {
      dispatchQty: parseFloat(dispatchQty),
      dispatchDate,
      billNumber: billNumber.trim(),
      remarks: remarks.trim(),
      transportMode: transportMode.trim(),
      trackingNumber: trackingNumber.trim(),
      receivedBy: receivedBy.trim(),
      status: status,
      timestamp: new Date().toISOString(),
    };

    // Calculate new pending quantity
    const newPending = (item?.pending || 0) - parseFloat(dispatchQty);
    const newDispatched = (item?.dispatched || 0) + parseFloat(dispatchQty);

    const updateData = {
      dispatched: newDispatched,
      pending: newPending,
      status: newPending === 0 ? "Completed" : "Partial",
      dispatchHistory: [...(dispatchHistory || []), dispatchEntry],
      lastDispatch: dispatchEntry,
    };

    // Simulate API call
    setTimeout(() => {
      onDispatchUpdate(updateData);
      setIsSubmitting(false);
      onClose();
      setAnimation("fadeIn");
    }, 500);
  };

  const getMaxDispatch = () => {
    return item?.pending || 0;
  };

  const getPendingPercentage = () => {
    if (!item) return 0;
    return ((item.pending / item.poQty) * 100).toFixed(1);
  };

  const getProgressColor = () => {
    const percentage = getPendingPercentage();
    if (percentage > 50) return "bg-red-500";
    if (percentage > 25) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (!isOpen || !item) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto ${isFullscreen ? "p-0" : "p-4"}`}
      style={{ animation: `${animation} 0.3s ease-in-out` }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes fadeOut {
            from { opacity: 1; transform: scale(1); }
            to { opacity: 0; transform: scale(0.95); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .animate-slideIn {
            animation: slideIn 0.3s ease-out;
          }
          .animate-pulse-slow {
            animation: pulse 2s infinite;
          }
          .shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
        `}
      </style>

      <div className="flex items-center justify-center min-h-screen">
        {/* Backdrop with blur */}
        <div
          className={`fixed inset-0 transition-all duration-300 ${isOpen ? "bg-black/50 backdrop-blur-sm" : "bg-black/0"}`}
          onClick={onClose}
        ></div>

        {/* Modal Container */}
        <div
          className={`relative bg-white rounded-2xl shadow-2xl transition-all duration-300 transform ${
            isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-4xl"
          } ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        >
          {/* Modal Header with gradient */}
          <div
            className={`bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 ${isFullscreen ? "rounded-none" : "rounded-t-2xl"} relative overflow-hidden`}
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg animate-pulse-slow">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Dispatch Management
                  </h3>
                  <p className="text-sm text-blue-100">
                    Update dispatch details for {item?.po || "PO"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/20 rounded-lg"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/20 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div
            className={`${isFullscreen ? "h-[calc(100vh-80px)] overflow-y-auto" : ""}`}
          >
            <div className="px-6 py-4">
              {/* Item Summary with animated progress */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 mb-6 border border-blue-100 shadow-inner">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">PO Number</p>
                      <p className="font-medium text-gray-800">{item?.po}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <Building className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="font-medium text-gray-800">
                        {item?.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item?.pending === 0
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item?.pending === 0 ? "✓ Completed" : "⏳ Pending"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-100 rounded-lg">
                      <Clock className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pending %</p>
                      <p className="font-medium text-gray-800">
                        {getPendingPercentage()}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar with animation */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{getPendingPercentage()}% remaining</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
                      style={{
                        width: `${100 - parseFloat(getPendingPercentage())}%`,
                        transition: "width 1s ease-in-out",
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setActiveTab("dispatch")}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === "dispatch"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Truck className="w-4 h-4 inline mr-2" />
                  New Dispatch
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === "history"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <History className="w-4 h-4 inline mr-2" />
                  History ({dispatchHistory.length})
                  {dispatchHistory.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
              </div>

              {/* Dispatch History */}
              {activeTab === "history" && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-60 overflow-y-auto border border-gray-200">
                  {dispatchHistory && dispatchHistory.length > 0 ? (
                    <div className="space-y-3">
                      {dispatchHistory.map((entry, index) => (
                        <DispatchHistoryItem
                          key={index}
                          entry={entry}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No dispatch history available</p>
                    </div>
                  )}
                </div>
              )}

              {/* Dispatch Form */}
              {activeTab === "dispatch" && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <span className="text-red-500">*</span>
                        Dispatch Quantity
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={dispatchQty}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDispatchQty(val);
                            if (errors.dispatchQty)
                              setErrors({ ...errors, dispatchQty: "" });
                          }}
                          placeholder={`Max: ${getMaxDispatch()}`}
                          className={`w-full px-3 py-2 border ${errors.dispatchQty ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                          min="1"
                          max={getMaxDispatch()}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                          / {getMaxDispatch()}
                        </div>
                      </div>
                      {errors.dispatchQty && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.dispatchQty}
                        </p>
                      )}
                    </div>

                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <span className="text-red-500">*</span>
                        Dispatch Date
                      </label>
                      <input
                        type="date"
                        value={dispatchDate}
                        onChange={(e) => {
                          setDispatchDate(e.target.value);
                          if (errors.dispatchDate)
                            setErrors({ ...errors, dispatchDate: "" });
                        }}
                        className={`w-full px-3 py-2 border ${errors.dispatchDate ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      />
                      {errors.dispatchDate && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.dispatchDate}
                        </p>
                      )}
                    </div>

                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <span className="text-red-500">*</span>
                        Bill Number
                      </label>
                      <input
                        type="text"
                        value={billNumber}
                        onChange={(e) => {
                          setBillNumber(e.target.value);
                          if (errors.billNumber)
                            setErrors({ ...errors, billNumber: "" });
                        }}
                        placeholder="Enter bill number"
                        className={`w-full px-3 py-2 border ${errors.billNumber ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      />
                      {errors.billNumber && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.billNumber}
                        </p>
                      )}
                    </div>

                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="Partial">🔄 Partial Dispatch</option>
                        <option value="Completed">✅ Completed</option>
                        <option value="In Transit">🚚 In Transit</option>
                        <option value="Delivered">📦 Delivered</option>
                      </select>
                    </div>

                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transport Mode
                      </label>
                      <input
                        type="text"
                        value={transportMode}
                        onChange={(e) => setTransportMode(e.target.value)}
                        placeholder="e.g., Road, Air, Sea"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Received By
                      </label>
                      <input
                        type="text"
                        value={receivedBy}
                        onChange={(e) => setReceivedBy(e.target.value)}
                        placeholder="Name of receiver"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2 transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Additional notes, special instructions, etc."
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Action Buttons with animations */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all transform hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Confirm Dispatch
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PENDING PO MANAGER CLASS
// ============================================
class PendingPOManager {
  constructor(data = []) {
    this.data = data;
    this.summary = this.calculateSummary();
    this.companyStats = this.calculateCompanyStats();
    this.itemCategories = this.extractCategories();
  }

  calculateSummary() {
    const totalPending = this.data.reduce(
      (sum, item) => sum + (item.pending || 0),
      0,
    );
    const totalDispatched = this.data.reduce(
      (sum, item) => sum + (item.dispatched || 0),
      0,
    );
    const totalPOQty = this.data.reduce(
      (sum, item) => sum + (item.poQty || 0),
      0,
    );
    const totalValue = this.data.reduce(
      (sum, item) => sum + (item.total || 0),
      0,
    );
    const uniquePOs = new Set(this.data.map((item) => item.po));
    const uniqueCompanies = new Set(this.data.map((item) => item.company));
    const uniqueDrawings = new Set(this.data.map((item) => item.drawing));

    return {
      totalPending,
      totalDispatched,
      totalPOQty,
      totalValue,
      totalPOs: uniquePOs.size,
      totalCompanies: uniqueCompanies.size,
      totalDrawings: uniqueDrawings.size,
      totalItems: this.data.length,
      pendingPercentage: totalPOQty > 0 ? (totalPending / totalPOQty) * 100 : 0,
      dispatchedPercentage:
        totalPOQty > 0 ? (totalDispatched / totalPOQty) * 100 : 0,
    };
  }

  calculateCompanyStats() {
    const stats = {};
    this.data.forEach((item) => {
      if (!stats[item.company]) {
        stats[item.company] = {
          totalPending: 0,
          totalDispatched: 0,
          totalPOQty: 0,
          totalValue: 0,
          poCount: new Set(),
          itemCount: 0,
          pendingItems: 0,
          completedItems: 0,
        };
      }
      stats[item.company].totalPending += item.pending || 0;
      stats[item.company].totalDispatched += item.dispatched || 0;
      stats[item.company].totalPOQty += item.poQty || 0;
      stats[item.company].totalValue += item.total || 0;
      stats[item.company].poCount.add(item.po);
      stats[item.company].itemCount += 1;
      if (item.pending === 0) {
        stats[item.company].completedItems += 1;
      } else {
        stats[item.company].pendingItems += 1;
      }
    });

    Object.keys(stats).forEach((company) => {
      const s = stats[company];
      s.totalPOs = s.poCount.size;
      s.completionRate =
        s.itemCount > 0 ? (s.completedItems / s.itemCount) * 100 : 0;
      s.pendingRate =
        s.itemCount > 0 ? (s.pendingItems / s.itemCount) * 100 : 0;
      s.avgPendingPerPO = s.totalPOs > 0 ? s.totalPending / s.totalPOs : 0;
      delete s.poCount;
    });

    return stats;
  }

  extractCategories() {
    const categories = new Set();
    this.data.forEach((item) => {
      const desc = item.item || "";
      if (desc.includes("Bus Bar") || desc.includes("BUS BAR")) {
        categories.add("Bus Bars");
      } else if (desc.includes("Heat Sink")) {
        categories.add("Heat Sinks");
      } else if (desc.includes("Accessory") || desc.includes("Assembly")) {
        categories.add("Accessories");
      } else if (desc.includes("Hardware")) {
        categories.add("Hardware");
      } else if (desc.includes("Plate")) {
        categories.add("Plates");
      } else {
        categories.add("Others");
      }
    });
    return [...categories];
  }

  filterData(filters) {
    let filtered = [...this.data];

    if (filters.company && filters.company !== "all") {
      filtered = filtered.filter((item) => item.company === filters.company);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.po?.toLowerCase().includes(term) ||
          item.drawing?.toLowerCase().includes(term) ||
          item.item?.toLowerCase().includes(term) ||
          item.itemCode?.toLowerCase().includes(term),
      );
    }

    if (filters.status && filters.status !== "all") {
      if (filters.status === "pending") {
        filtered = filtered.filter((item) => item.pending > 0);
      } else if (filters.status === "completed") {
        filtered = filtered.filter((item) => item.pending === 0);
      } else if (filters.status === "partial") {
        filtered = filtered.filter(
          (item) => item.pending > 0 && item.pending < item.poQty,
        );
      }
    }

    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter((item) => {
        const desc = item.item || "";
        if (filters.category === "Bus Bars")
          return desc.includes("Bus Bar") || desc.includes("BUS BAR");
        if (filters.category === "Heat Sinks")
          return desc.includes("Heat Sink");
        if (filters.category === "Accessories")
          return desc.includes("Accessory") || desc.includes("Assembly");
        if (filters.category === "Hardware") return desc.includes("Hardware");
        if (filters.category === "Plates") return desc.includes("Plate");
        return true;
      });
    }

    if (filters.minPending !== undefined && filters.minPending !== "") {
      filtered = filtered.filter(
        (item) => item.pending >= parseInt(filters.minPending),
      );
    }

    if (filters.maxPending !== undefined && filters.maxPending !== "") {
      filtered = filtered.filter(
        (item) => item.pending <= parseInt(filters.maxPending),
      );
    }

    if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      filtered = filtered.filter((item) => {
        const date = new Date(item.poDate);
        return date >= start && date <= end;
      });
    }

    return filtered;
  }

  updateDispatch(index, newDispatch) {
    if (index >= 0 && index < this.data.length) {
      const item = this.data[index];
      const validDispatch = Math.min(Math.max(0, newDispatch), item.poQty);
      const newPending = item.poQty - validDispatch;

      this.data[index] = {
        ...item,
        dispatched: validDispatch,
        pending: newPending,
        total: newPending * item.rate,
        status: newPending > 0 ? "Pending" : "Completed",
      };

      this.summary = this.calculateSummary();
      this.companyStats = this.calculateCompanyStats();
      return true;
    }
    return false;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================
const GeneratePendingList = () => {
  const [data, setData] = useState([]);
  const [manager, setManager] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minPending, setMinPending] = useState("");
  const [maxPending, setMaxPending] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [expandedPOs, setExpandedPOs] = useState(new Set());
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [notification, setNotification] = useState(null);
  const [selectedItemForDispatch, setSelectedItemForDispatch] = useState(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchHistory, setDispatchHistory] = useState({});
  const [isHovered, setIsHovered] = useState(null);

  // Parse Excel file
  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          const mappedData = jsonData.map((row) => {
            const po = row["PO"] || row["PO Number"] || row["PO #"] || "";
            const poDate =
              row["PO Date"] ||
              row["Date"] ||
              new Date().toISOString().split("T")[0];
            const drawing = row["Drawing"] || row["Drawing #"] || "";
            const itemCode = row["Item Code"] || row["Code"] || "";
            const item =
              row["Item"] ||
              row["Description"] ||
              row["Item Description"] ||
              "";
            const poQty = parseFloat(row["PO Qty"] || row["Quantity"] || 0);
            const dispatched = parseFloat(
              row["Dispatched"] || row["Dispatched Qty"] || 0,
            );
            const pending = poQty - dispatched;
            const rate = parseFloat(row["Rate"] || row["Unit Price"] || 0);
            const total = pending * rate;
            const company = row["Company Name"] || row["Company"] || "Unknown";
            const status = pending > 0 ? "Pending" : "Completed";

            return {
              company: company.toString().trim(),
              po: po.toString().trim(),
              poDate: poDate,
              drawing: drawing.toString().trim(),
              itemCode: itemCode.toString().trim(),
              item: item.toString().trim(),
              poQty: poQty,
              dispatched: dispatched,
              pending: pending,
              status: status,
              rate: rate,
              total: total,
            };
          });

          resolve(mappedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true);
      setUploadedFile(file);

      try {
        const parsedData = await parseExcelFile(file);
        setData(parsedData);
        const newManager = new PendingPOManager(parsedData);
        setManager(newManager);

        setCompanies(["all", ...Object.keys(newManager.companyStats)]);
        setCategories(["all", ...newManager.itemCategories]);

        applyFilters(newManager, "all", "", "all", "all", "", "", {
          start: "",
          end: "",
        });

        showNotification("File uploaded successfully!", "success");
      } catch (error) {
        console.error("Error parsing file:", error);
        showNotification(
          "Error parsing file. Please check the format.",
          "error",
        );
      }

      setIsLoading(false);
    }
  };

  const applyFilters = useCallback(
    (mgr, company, search, status, category, min, max, date) => {
      const filters = {
        company,
        searchTerm: search,
        status,
        category,
        minPending: min,
        maxPending: max,
        dateRange: date,
      };

      const filtered = mgr ? mgr.filterData(filters) : [];
      setFilteredData(filtered);
    },
    [],
  );

  useEffect(() => {
    if (manager) {
      applyFilters(
        manager,
        selectedCompany,
        searchTerm,
        selectedStatus,
        selectedCategory,
        minPending,
        maxPending,
        dateRange,
      );
    }
  }, [
    manager,
    selectedCompany,
    searchTerm,
    selectedStatus,
    selectedCategory,
    minPending,
    maxPending,
    dateRange,
    applyFilters,
  ]);

  const handleDispatchUpdate = (updateData) => {
    if (!selectedItemForDispatch) return;

    const itemKey = `${selectedItemForDispatch.po}-${selectedItemForDispatch.itemCode}`;
    const currentHistory = dispatchHistory[itemKey] || [];

    // Find the actual index of the item
    const index = data.findIndex(
      (d) =>
        d.po === selectedItemForDispatch.po &&
        d.itemCode === selectedItemForDispatch.itemCode &&
        d.company === selectedItemForDispatch.company,
    );

    if (index !== -1 && manager) {
      // Update the item with new values
      const updatedItem = {
        ...data[index],
        dispatched: updateData.dispatched,
        pending: updateData.pending,
        status: updateData.status,
      };

      // Update in manager
      manager.data[index] = updatedItem;

      // Update local data
      const newData = [...data];
      newData[index] = updatedItem;
      setData(newData);

      // Update dispatch history
      const newHistory = [
        ...currentHistory,
        ...(updateData.dispatchHistory || []),
      ];
      setDispatchHistory({
        ...dispatchHistory,
        [itemKey]: newHistory,
      });

      // Update filtered data
      const filtered = manager.filterData({
        company: selectedCompany,
        searchTerm: searchTerm,
        status: selectedStatus,
        category: selectedCategory,
        minPending: minPending,
        maxPending: maxPending,
        dateRange: dateRange,
      });
      setFilteredData(filtered);

      showNotification(
        `Dispatch updated successfully! New pending: ${updateData.pending}`,
        "success",
      );
    }
  };

  const openDispatchModal = (item) => {
    const itemKey = `${item.po}-${item.itemCode}`;
    setSelectedItemForDispatch({
      ...item,
      dispatchHistory: dispatchHistory[itemKey] || [],
    });
    setIsDispatchModalOpen(true);
  };

  const closeDispatchModal = () => {
    setIsDispatchModalOpen(false);
    setSelectedItemForDispatch(null);
  };

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const resetAll = () => {
    setData([]);
    setManager(null);
    setFilteredData([]);
    setCompanies([]);
    setCategories([]);
    setSelectedCompany("all");
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedCategory("all");
    setMinPending("");
    setMaxPending("");
    setDateRange({ start: "", end: "" });
    setUploadedFile(null);
    setSelectedItems(new Set());
    setExpandedPOs(new Set());
    setDispatchHistory({});
    showNotification("Data reset successfully", "info");
  };

  // Render notification
  const renderNotification = () => {
    if (!notification) return null;

    const colors = {
      success: "bg-green-50 border-green-400 text-green-800",
      error: "bg-red-50 border-red-400 text-red-800",
      warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
      info: "bg-blue-50 border-blue-400 text-blue-800",
    };

    return (
      <div
        className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg ${colors[notification.type]} animate-slideIn`}
      >
        {notification.message}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      <style>
        {`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(100px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slideIn {
            animation: slideIn 0.3s ease-out;
          }
          .animate-fadeInUp {
            animation: fadeInUp 0.5s ease-out;
          }
        `}
      </style>

      {renderNotification()}

      {/* Dispatch Modal */}
      <DispatchModal
        isOpen={isDispatchModalOpen}
        onClose={closeDispatchModal}
        item={selectedItemForDispatch}
        onDispatchUpdate={handleDispatchUpdate}
        dispatchHistory={selectedItemForDispatch?.dispatchHistory || []}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-blue-100 animate-fadeInUp">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <FileSpreadsheet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Advanced Pending PO Manager
                </h1>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Enterprise-grade purchase order tracking with dispatch
                  management
                  {data.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {data.length} items loaded
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Upload className="w-4 h-4" />
                Upload Excel
              </label>

              {uploadedFile && (
                <>
                  <button
                    onClick={resetAll}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all transform hover:scale-105"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105"
                  >
                    {showFilters ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {showFilters ? "Hide" : "Show"} Filters
                  </button>
                </>
              )}
            </div>
          </div>

          {uploadedFile && (
            <div className="mt-3 flex items-center gap-3 text-sm bg-gray-50 p-2 rounded-lg border border-gray-200">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">File: {uploadedFile.name}</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                Size: {(uploadedFile.size / 1024).toFixed(1)} KB
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Items: {data.length}</span>
            </div>
          )}
        </div>

        {/* Summary Cards with animations */}
        {data.length > 0 && manager && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div
              className="bg-white p-4 rounded-xl shadow-md border border-blue-100 hover:shadow-lg transition-all transform hover:scale-105 animate-fadeInUp"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Clock className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Pending</p>
                    <p className="text-xl font-bold text-gray-800">
                      {manager.summary.totalPending.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {manager.summary.pendingPercentage.toFixed(1)}% of total
                  </p>
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(manager.summary.pendingPercentage, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div
              className="bg-white p-4 rounded-xl shadow-md border border-green-100 hover:shadow-lg transition-all transform hover:scale-105 animate-fadeInUp"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Dispatched</p>
                    <p className="text-xl font-bold text-gray-800">
                      {manager.summary.totalDispatched.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {manager.summary.dispatchedPercentage.toFixed(1)}% of total
                  </p>
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(manager.summary.dispatchedPercentage, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div
              className="bg-white p-4 rounded-xl shadow-md border border-purple-100 hover:shadow-lg transition-all transform hover:scale-105 animate-fadeInUp"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-xl font-bold text-gray-800">
                    {formatCurrency(manager.summary.totalValue)}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Across {manager.summary.totalPOs} purchase orders
              </div>
            </div>

            <div
              className="bg-white p-4 rounded-xl shadow-md border border-orange-100 hover:shadow-lg transition-all transform hover:scale-105 animate-fadeInUp"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Building className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Companies</p>
                  <p className="text-xl font-bold text-gray-800">
                    {manager.summary.totalCompanies}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {manager.summary.totalDrawings} unique drawings
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        {data.length > 0 && showFilters && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-200 animate-fadeInUp">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Advanced Filters
              </h3>
              <button
                onClick={() => {
                  setSelectedCompany("all");
                  setSearchTerm("");
                  setSelectedStatus("all");
                  setSelectedCategory("all");
                  setMinPending("");
                  setMaxPending("");
                  setDateRange({ start: "", end: "" });
                }}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Reset All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="PO, Drawing, Item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Company
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                >
                  {companies.map((company, index) => (
                    <option key={index} value={company}>
                      {company === "all" ? "All Companies" : company}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending Only</option>
                  <option value="completed">Completed</option>
                  <option value="partial">Partial Dispatch</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                >
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Min Pending
                </label>
                <input
                  type="number"
                  value={minPending}
                  onChange={(e) => setMinPending(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Max Pending
                </label>
                <input
                  type="number"
                  value={maxPending}
                  onChange={(e) => setMaxPending(e.target.value)}
                  placeholder="1000"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Data Table */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Processing Excel file...</p>
            <p className="text-sm text-gray-400 mt-2">
              Please wait while we parse your data
            </p>
          </div>
        ) : data.length > 0 ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 animate-fadeInUp">
            {/* View Mode Selector */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">View:</span>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1 text-sm rounded-lg transition-all ${
                    viewMode === "table"
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-200"
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1 text-sm rounded-lg transition-all ${
                    viewMode === "cards"
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-200"
                  }`}
                >
                  Cards
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>
                  Showing {filteredData.length} of {data.length} items
                </span>
              </div>
            </div>

            {/* Table View */}
            {viewMode === "table" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO #
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Drawing
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO Qty
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dispatched
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((item) => {
                      const hasHistory =
                        dispatchHistory[`${item.po}-${item.itemCode}`]?.length >
                        0;
                      const isItemHovered =
                        isHovered === `${item.po}-${item.itemCode}`;

                      return (
                        <tr
                          key={`${item.po}-${item.itemCode}`}
                          className="hover:bg-gray-50 transition-colors"
                          onMouseEnter={() =>
                            setIsHovered(`${item.po}-${item.itemCode}`)
                          }
                          onMouseLeave={() => setIsHovered(null)}
                        >
                          <td className="px-3 py-2 text-sm">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {item.company}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm font-mono">
                            {item.po}
                          </td>
                          <td className="px-3 py-2 text-sm">{item.drawing}</td>
                          <td
                            className="px-3 py-2 text-sm max-w-xs truncate"
                            title={item.item}
                          >
                            {item.item}
                          </td>
                          <td className="px-3 py-2 text-sm text-right">
                            {item.poQty}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-green-600">
                            {item.dispatched}
                          </td>
                          <td className="px-3 py-2 text-sm text-right">
                            <span
                              className={`font-semibold ${item.pending > 0 ? "text-red-600" : "text-green-600"}`}
                            >
                              {item.pending}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-right">
                            {formatCurrency(item.rate)}
                          </td>
                          <td className="px-3 py-2 text-sm text-right font-semibold">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => openDispatchModal(item)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all text-xs mx-auto ${
                                isItemHovered
                                  ? "bg-blue-600 text-white shadow-md transform scale-105"
                                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                              }`}
                              title="Manage dispatch"
                            >
                              <Truck className="w-3 h-3" />
                              Dispatch
                              {hasHistory && (
                                <span
                                  className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                                    isItemHovered
                                      ? "bg-white/20 text-white"
                                      : "bg-blue-200 text-blue-700"
                                  }`}
                                >
                                  {
                                    dispatchHistory[
                                      `${item.po}-${item.itemCode}`
                                    ].length
                                  }
                                </span>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cards View */}
            {viewMode === "cards" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredData.map((item) => {
                  const hasHistory =
                    dispatchHistory[`${item.po}-${item.itemCode}`]?.length > 0;

                  return (
                    <div
                      key={`${item.po}-${item.itemCode}`}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all transform hover:scale-105"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {item.company}
                          </span>
                          {hasHistory && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                              <History className="w-3 h-3" />
                              {
                                dispatchHistory[`${item.po}-${item.itemCode}`]
                                  .length
                              }
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(item.poDate)}
                        </span>
                      </div>

                      <div className="mb-2">
                        <div className="text-sm font-mono text-gray-600">
                          PO: {item.po}
                        </div>
                        <div className="text-sm text-gray-500">
                          Drawing: {item.drawing}
                        </div>
                      </div>

                      <div
                        className="text-sm text-gray-700 truncate"
                        title={item.item}
                      >
                        {item.item}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-500">PO Qty:</span>
                          <span className="font-medium ml-1">{item.poQty}</span>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <span className="text-green-600">Dispatched:</span>
                          <span className="font-medium ml-1">
                            {item.dispatched}
                          </span>
                        </div>
                        <div className="bg-red-50 p-2 rounded">
                          <span className="text-red-600">Pending:</span>
                          <span className="font-medium ml-1">
                            {item.pending}
                          </span>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <span className="text-purple-600">Total:</span>
                          <span className="font-medium ml-1">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => openDispatchModal(item)}
                          className="flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all transform hover:scale-105 text-sm"
                        >
                          <Truck className="w-4 h-4" />
                          Manage Dispatch
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
              <div>Total: {filteredData.length} items</div>
              <div className="flex items-center gap-4">
                <span>
                  Pending:{" "}
                  {filteredData.reduce((sum, item) => sum + item.pending, 0)}
                </span>
                <span>
                  Value:{" "}
                  {formatCurrency(
                    filteredData.reduce((sum, item) => sum + item.total, 0),
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border-2 border-dashed border-gray-300 animate-fadeInUp">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full animate-pulse-slow">
                <Upload className="w-16 h-16 text-blue-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Data Uploaded
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Upload an Excel file to view and manage pending purchase orders
              across multiple companies.
              <br />
              <span className="text-sm text-gray-400">
                Supported formats: .xlsx, .xls
              </span>
            </p>
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Upload className="w-4 h-4" />
              Upload Excel File
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratePendingList;
