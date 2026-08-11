import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  AlertTriangle,
  Loader2,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Package,
  Building2,
  Search,
  RefreshCw,
  ThumbsDown,
  Truck,
  TrendingDown,
  Layers,
  CheckSquare,
  Square,
  ListChecks,
  ArrowUpDown,
  Filter,
  MoreHorizontal,
  User,
  MessageCircle,
  Image as ImageIcon,
  Download,
  Send,
  X,
  Edit,
  Trash2,
  Printer,
  DownloadCloud,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import BulkItemRejection from "./ItemRejection";
import toast from "react-hot-toast";
import Inventory from "./Inventory";

const AdminRejectionReview = ({ rejection, onClose, onUpdate }) => {
  const [adminRemarks, setAdminRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  const [inventoryModalType, setInventoryModalType] = useState("direct");

  const handleReview = async (action) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rejection/${rejection._id}/review`,
        {
          status: action,
          adminRemarks: adminRemarks || `${action} by admin`,
        },
        { withCredentials: true },
      );

      if (response.data.success) {
        const statusMessages = {
          approved:
            "✅ Rejection approved! Quantity has been deducted from dispatch.",
          rejected: "❌ Rejection denied. No quantity deducted.",
          resolved: "✅ Issue resolved! Quantity has been adjusted.",
        };
        toast(statusMessages[action] || `Rejection ${action} successfully!`);
        if (onUpdate) onUpdate(response.data.data);
        if (onClose) onClose();
      }
    } catch (error) {
      console.error("Review error:", error);
      setError(error.response?.data?.message || "Failed to review rejection");
    } finally {
      setLoading(false);
    }
  };

  if (!rejection) return null;

  const getStatusBadge = (status) => {
    const badges = {
      pending_review: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      resolved: "bg-blue-100 text-blue-700",
    };
    return badges[status] || badges.pending_review;
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      low: "bg-blue-100 text-blue-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700",
    };
    return badges[severity] || badges.medium;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-2">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {rejection.status === "pending_review" ? "Review" : "View"}{" "}
                    Rejection
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {rejection.poNumber} - {rejection.itemCode}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Status and Severity */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Status:
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(rejection.status)}`}
                >
                  {rejection.status?.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Severity:
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityBadge(rejection.severity)}`}
                >
                  {rejection.severity?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {rejection.isPartialRejection ? "Partial" : "Full"} Rejection
                </span>
              </div>
            </div>
            {/* Quantity Information - Show deduction status */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Quantity Information
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Original Qty:</span>
                  <span className="font-medium ml-2">
                    {rejection.originalQuantity || rejection.dispatchedQuantity}{" "}
                    {rejection.unit}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Rejected Qty:</span>
                  <span className="font-medium text-red-600 ml-2">
                    {rejection.rejectedQuantity} {rejection.unit}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`font-medium ml-2 ${rejection.quantityDeducted ? "text-green-600" : "text-yellow-600"}`}
                  >
                    {rejection.quantityDeducted ? "✅ Deducted" : "⏳ Pending"}
                  </span>
                </div>
                {rejection.remainingQuantity !== undefined && (
                  <div>
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium ml-2 text-blue-600">
                      {rejection.remainingQuantity} {rejection.unit}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Dispatch Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-500" />
                  Dispatch Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">PO Number:</span>{" "}
                    <span className="font-medium ml-2">
                      {rejection.poNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Company:</span>{" "}
                    <span className="font-medium ml-2">
                      {rejection.companyName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Item Code:</span>{" "}
                    <span className="font-medium ml-2">
                      {rejection.itemCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Description:</span>{" "}
                    <span className="font-medium ml-2">
                      {rejection.description}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Batch No:</span>{" "}
                    <span className="font-medium ml-2">
                      #{rejection.batchNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dispatched Qty:</span>{" "}
                    <span className="font-medium ml-2">
                      {rejection.dispatchedQuantity} {rejection.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Rejection Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Rejected Qty:</span>{" "}
                    <span className="font-medium text-red-600 ml-2">
                      {rejection.rejectedQuantity} {rejection.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Reason:</span>{" "}
                    <span className="font-medium ml-2">{rejection.reason}</span>
                  </div>
                  {rejection.subReason && (
                    <div>
                      <span className="text-gray-500">Sub Reason:</span>{" "}
                      <span className="font-medium ml-2">
                        {rejection.subReason}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Resolution:</span>{" "}
                    <span className="font-medium ml-2">
                      {rejection.resolution}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Inspector:</span>{" "}
                    <span className="font-medium ml-2">
                      {rejection.inspectorName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Inspection Date:</span>{" "}
                    <span className="font-medium ml-2">
                      {new Date(rejection.inspectionDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Return Required:</span>{" "}
                    <span className="font-medium ml-2">
                      {rejection.requiresReturn ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Notes */}
            {rejection.additionalNotes && (
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Client Notes
                </h4>
                <p className="text-sm text-yellow-700">
                  {rejection.additionalNotes}
                </p>
              </div>
            )}
            {/* Evidence */}
            {rejection.evidenceFiles && rejection.evidenceFiles.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Evidence ({rejection.evidenceFiles.length} files)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {rejection.evidenceFiles.map((file, index) => (
                    <div key={index} className="bg-white rounded-lg border p-2">
                      {file.type?.startsWith("image/") ? (
                        <img
                          src={file.url}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {file.filename}
                      </p>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        <Download className="w-3 h-3" />
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Admin Review Section */}
            {rejection.status === "pending_review" && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Admin Review
                </h4>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Remarks
                  </label>
                  <textarea
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    rows="3"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
                    placeholder="Add your remarks about this rejection..."
                  />
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg mb-4 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Approving this rejection will deduct{" "}
                    <strong>
                      {rejection.rejectedQuantity} {rejection.unit}
                    </strong>{" "}
                    from the dispatch quantity.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleReview("approved")}
                    disabled={loading}
                    className="flex-1 min-w-[100px] px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve & Deduct
                  </button>
                  <button
                    onClick={() => handleReview("rejected")}
                    disabled={loading}
                    className="flex-1 min-w-[100px] px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Reject
                  </button>
                  <button
                    onClick={() => handleReview("resolved")}
                    disabled={loading}
                    className="flex-1 min-w-[100px] px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Resolve
                  </button>

                  {/* Add to Inventory - Direct (No Approval Required) */}
                  {/* <button
                    onClick={() => {
                      setInventoryModalType("direct");
                      setShowInventoryModal(true);
                    }}
                    disabled={loading || rejection.inventoryAdded}
                    className="flex-1 min-w-[100px] px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    {rejection.inventoryAdded
                      ? "Already Added"
                      : "Add Directly"}
                  </button> */}

                  {/* Add to Inventory - With Approval */}
                  <button
                    onClick={() => {
                      setInventoryModalType("with_approval");
                      setShowInventoryModal(true);
                    }}
                    disabled={loading || rejection.inventoryAdded}
                    className="flex-1 min-w-[100px] px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Package className="w-4 h-4" />
                    {!rejection.inventoryAdded && "Add to Inventory"}
                  </button>
                </div>
              </div>
            )}

            {showInventoryModal && (
              <Inventory
                rejection={rejection}
                onClose={() => {
                  setShowInventoryModal(false);
                }}
                onSuccess={(data) => {
                  const updatedRejection = {
                    ...rejection,
                    inventoryAdded: true,
                    inventoryId: data.inventory._id,
                    status: data.rejection.status || "added_to_inventory",
                  };
                  if (onUpdate) onUpdate(updatedRejection);
                  setShowInventoryModal(false);
                  setInventoryModalType("direct");
                }}
                directOnly={inventoryModalType === "direct"}
              />
            )}
            {/* Already Reviewed */}
            {rejection.status !== "pending_review" && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Review Completed
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {rejection.status.toUpperCase()}
                  </p>
                  {rejection.adminRemarks && (
                    <p>
                      <span className="font-medium">Admin Remarks:</span>{" "}
                      {rejection.adminRemarks}
                    </p>
                  )}
                  {rejection.reviewedBy && (
                    <p>
                      <span className="font-medium">Reviewed By:</span>{" "}
                      {rejection.reviewedBy?.name || "Admin"}
                    </p>
                  )}
                  {rejection.reviewedAt && (
                    <p>
                      <span className="font-medium">Reviewed At:</span>{" "}
                      {new Date(rejection.reviewedAt).toLocaleString()}
                    </p>
                  )}
                  {rejection.quantityDeducted && (
                    <p className="text-green-600">
                      <span className="font-medium">Quantity Deducted:</span>{" "}
                      Yes ({rejection.rejectedQuantity} {rejection.unit})
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RejectionHistory = () => {
  const [dispatchHistory, setDispatchHistory] = useState([]);
  const [rejections, setRejections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [selectedRejection, setSelectedRejection] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("dispatches");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Multi-select state
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const recordsPerPage = 10;

  // Admin stats
  const [adminStats, setAdminStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    resolved: 0,
  });

  // Fetch real dispatch data
  const fetchDispatchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dispatchRes = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch-orders/timeline`,
        { withCredentials: true },
      );

      if (dispatchRes.data.success) {
        let formatted = dispatchRes.data.data.map((d) => ({
          dispatchId: d.dispatchId,
          poNumber: d.poNumber,
          companyName: d.companyName,
          itemCode: d.itemCode,
          description: d.itemDescription,
          batchNumber: d.batchNumber,
          quantity: d.quantity,
          date: d.date,
          dispatchedBy: d.dispatchedBy,
          billNumber: d.billNumber,
          billFile: d.billFile,
          rejectionStatus: d.rejectionStatus || "none",
          rejectedQuantity: d.rejectedQuantity || 0,
          unit: "pcs",
          rejectionId: d.rejectionId,
        }));

        // Filter for client based on company name
        if (!isAdmin && user?.companyName) {
          const originalCount = formatted.length;
          formatted = formatted.filter(
            (item) =>
              item.companyName?.toLowerCase() ===
              user.companyName?.toLowerCase(),
          );
        }

        setDispatchHistory(formatted);

        // Fetch real rejections from API
        await fetchRejections();
      } else {
        setError("Failed to fetch dispatch data");
      }
    } catch (error) {
      console.error("Failed to fetch dispatch data:", error);
      setError(
        error.response?.data?.message || error.message || "Network error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real rejections from API
  const fetchRejections = async () => {
    try {
      let url;
      if (isAdmin) {
        url = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rejection/all`;
      } else {
        url = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rejection/my-rejections`;
      }

      const response = await axios.get(url, { withCredentials: true });

      if (response.data.success) {
        const rejectionsData = isAdmin
          ? response.data.data
          : response.data.data;
        setRejections(rejectionsData || []);

        // Update admin stats if admin
        if (isAdmin) {
          const data = rejectionsData || [];
          setAdminStats({
            total: data.length,
            pending: data.filter((r) => r.status === "pending_review").length,
            approved: data.filter((r) => r.status === "approved").length,
            rejected: data.filter((r) => r.status === "rejected").length,
            resolved: data.filter((r) => r.status === "resolved").length,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch rejections:", error);
      setRejections([]);
    }
  };

  useEffect(() => {
    fetchDispatchData();
  }, []);

  // Handle item selection
  const handleSelectItem = (dispatchId) => {
    if (selectedItems.includes(dispatchId)) {
      setSelectedItems(selectedItems.filter((id) => id !== dispatchId));
    } else {
      setSelectedItems([...selectedItems, dispatchId]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const allIds = paginatedDispatches.map((item) => item.dispatchId);
      setSelectedItems(allIds);
      setSelectAll(true);
    }
  };

  const handleBulkReject = () => {
    const selectedDispatchItems = dispatchHistory.filter((item) =>
      selectedItems.includes(item.dispatchId),
    );
    setIsRejectionModalOpen(true);
  };

  const handleRejectSubmit = async (response) => {
    alert(response.message);
    setIsRejectionModalOpen(false);
    setSelectedItems([]);
    setSelectAll(false);
    await fetchDispatchData();
  };

  // Handle opening rejection details for admin review
  const handleReviewRejection = (rejection) => {
    setSelectedRejection(rejection);
    setShowDetailsModal(true);
  };

  // Handle update after review
  const handleReviewUpdate = (updatedRejection) => {
    // Update the rejection in the list
    setRejections((prev) =>
      prev.map((r) => (r._id === updatedRejection._id ? updatedRejection : r)),
    );
    // Update admin stats
    if (isAdmin) {
      setAdminStats((prev) => {
        const oldStatus = updatedRejection.status;
        const newStats = { ...prev };
        // Decrease old status count
        if (oldStatus === "pending_review")
          newStats.pending = Math.max(0, prev.pending - 1);
        if (oldStatus === "approved")
          newStats.approved = Math.max(0, prev.approved - 1);
        if (oldStatus === "rejected")
          newStats.rejected = Math.max(0, prev.rejected - 1);
        if (oldStatus === "resolved")
          newStats.resolved = Math.max(0, prev.resolved - 1);
        // Increase new status count
        if (updatedRejection.status === "pending_review") newStats.pending += 1;
        if (updatedRejection.status === "approved") newStats.approved += 1;
        if (updatedRejection.status === "rejected") newStats.rejected += 1;
        if (updatedRejection.status === "resolved") newStats.resolved += 1;
        return newStats;
      });
    }
    // Refresh dispatch data to update status
    fetchDispatchData();
  };

  // Filter dispatches
  const filteredDispatches = dispatchHistory.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Filter rejections for admin
  const filteredRejections = rejections.filter((rejection) => {
    const matchesSearch =
      !searchTerm ||
      rejection.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rejection.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rejection.companyName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || rejection.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDispatches.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedDispatches = filteredDispatches.slice(
    startIndex,
    startIndex + recordsPerPage,
  );

  // Update selectAll when selection changes
  useEffect(() => {
    if (
      paginatedDispatches.length > 0 &&
      selectedItems.length === paginatedDispatches.length
    ) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, paginatedDispatches]);

  const stats = {
    totalDispatches: dispatchHistory.length,
    pendingRejections: rejections.filter((r) => r.status === "pending_review")
      .length,
    totalRejectedQty: rejections.reduce(
      (sum, r) => sum + (r.rejectedQuantity || 0),
      0,
    ),
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const badges = {
      pending_review: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      resolved: "bg-blue-100 text-blue-700",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  // Get severity badge color
  const getSeverityBadge = (severity) => {
    const badges = {
      low: "bg-blue-100 text-blue-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700",
    };
    return badges[severity] || "bg-gray-100 text-gray-700";
  };

  // Export rejections to CSV
  const exportToCSV = () => {
    const headers = [
      "PO Number",
      "Company",
      "Item Code",
      "Rejected Qty",
      "Reason",
      "Status",
      "Severity",
      "Date",
    ];
    const rows = rejections.map((r) => [
      r.poNumber,
      r.companyName,
      r.itemCode,
      r.rejectedQuantity,
      r.reason,
      r.status,
      r.severity,
      new Date(r.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rejections_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-100 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading dispatch data...</p>
          <p className="text-sm text-gray-400 mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-800 font-medium mb-2">Error loading data</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchDispatchData}
            className="mt-6 px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-sm hover:shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
      {/* Modern Header with subtle gradient */}
      <div
        className={`bg-gradient-to-r rounded-2xl ${isAdmin ? "from-blue-700 to-blue-600" : "from-red-700 to-red-600"} shadow-lg`}
      >
        <div className="px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2">
                  {isAdmin ? (
                    <Eye className="w-6 h-6 text-white" />
                  ) : (
                    <Package className="w-6 h-6 text-white" />
                  )}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {isAdmin
                    ? "Admin - Rejection Management"
                    : "Rejection Management"}
                </h1>
              </div>
              <p
                className={`${isAdmin ? "text-blue-100" : "text-red-100"} text-sm ml-11`}
              >
                {isAdmin
                  ? "Review and manage all quality rejections"
                  : "Track and manage quality rejections"}
              </p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition text-white text-sm"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Export</span>
                </button>
              )}
              <button
                onClick={fetchDispatchData}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition text-white text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 py-8">
        {/* Modern Stats Cards - Enhanced for Admin */}
        {isAdmin ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-800">
                {adminStats.total}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {adminStats.pending}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {adminStats.approved}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {adminStats.rejected}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-2xl font-bold text-blue-600">
                {adminStats.resolved}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Dispatches
                  </p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {stats.totalDispatches}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 group-hover:scale-105 transition">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Pending Reviews
                  </p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">
                    {stats.pendingRejections}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 group-hover:scale-105 transition">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Rejected
                  </p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    {stats.totalRejectedQty}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 group-hover:scale-105 transition">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs with better styling */}
        <div className="mb-7 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("dispatches")}
              className={`pb-3 px-1 font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === "dispatches"
                  ? isAdmin
                    ? "text-blue-700 border-b-2 border-blue-600"
                    : "text-red-700 border-b-2 border-red-600"
                  : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
              }`}
            >
              <Package className="w-4 h-4" />
              All Dispatches
              <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {dispatchHistory.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("rejections")}
              className={`pb-3 px-1 font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === "rejections"
                  ? isAdmin
                    ? "text-blue-700 border-b-2 border-blue-600"
                    : "text-red-700 border-b-2 border-red-600"
                  : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {isAdmin ? "All Rejections" : "Rejection History"}
              <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {rejections.length}
                {isAdmin && adminStats.pending > 0 && (
                  <span className="ml-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs">
                    {adminStats.pending}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* All Dispatches Tab */}
        {activeTab === "dispatches" && (
          <div>
            {/* Search and Bulk Actions */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by PO, Item Code, or Description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm"
                />
              </div>
              {!isAdmin && selectedItems.length > 0 && (
                <button
                  onClick={handleBulkReject}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-sm hover:shadow-md text-sm font-medium"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Reject Selected ({selectedItems.length})
                </button>
              )}
            </div>

            {/* No Data Message */}
            {filteredDispatches.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">
                  No dispatch records found
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your search
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {/* Dispatches Table */}
            {filteredDispatches.length > 0 && (
              <div className="bg-white border border-gray-300 overflow-auto">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {!isAdmin && (
                          <th className="w-12 py-4 px-4">
                            <button
                              onClick={handleSelectAll}
                              className="p-1 rounded hover:bg-gray-200 transition"
                            >
                              {selectAll ? (
                                <CheckSquare className="w-5 h-5 text-red-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          </th>
                        )}
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          PO Number
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Item Details
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Quantity
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Batch No
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Dispatch Date
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedDispatches.map((dispatch, index) => (
                        <tr
                          key={dispatch.dispatchId}
                          className={`hover:bg-blue-50 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          {!isAdmin && (
                            <td className="py-4 px-4">
                              <button
                                onClick={() =>
                                  handleSelectItem(dispatch.dispatchId)
                                }
                                className="p-1 rounded hover:bg-gray-100 transition"
                              >
                                {selectedItems.includes(dispatch.dispatchId) ? (
                                  <CheckSquare className="w-5 h-5 text-red-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                            </td>
                          )}
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            <div>
                              <p className="font-mono font-semibold text-gray-800">
                                {dispatch.poNumber}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {dispatch.dispatchedBy}
                              </p>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            <div>
                              <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-mono bg-gray-100 text-gray-700">
                                {dispatch.itemCode}
                              </span>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2 max-w-xs">
                                {dispatch.description}
                              </p>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            <span className="font-semibold text-gray-800">
                              {dispatch.quantity}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            <span className="px-2 py-1 text-xs font-mono bg-amber-50 text-amber-700 rounded-md">
                              {dispatch.batchNumber}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            {new Date(dispatch.date).toLocaleDateString()}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            {dispatch.rejectionStatus === "none" && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Accepted
                              </span>
                            )}
                            {dispatch.rejectionStatus ===
                              "partial_rejected" && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Partial
                              </span>
                            )}
                            {dispatch.rejectionStatus === "fully_rejected" && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                <XCircle className="w-3 h-3 mr-1" />
                                Rejected
                              </span>
                            )}
                            {dispatch.rejectionStatus === "resolved" && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Resolved
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-gray-100 px-6 py-4 flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(
                        startIndex + recordsPerPage,
                        filteredDispatches.length,
                      )}{" "}
                      of {filteredDispatches.length} results
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* Rejection History Tab - Enhanced for Admin */}
        {activeTab === "rejections" && (
          <div>
            {/* Admin Filters */}
            {isAdmin && (
              <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by PO, Item Code, or Company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {filteredRejections.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    {isAdmin
                      ? "No rejections found"
                      : "No rejection records found"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "All dispatches are currently accepted"}
                  </p>
                </div>
              ) : (
                filteredRejections.map((rejection) => (
                  <div
                    key={rejection._id}
                    className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <p className="font-mono font-semibold text-gray-800">
                            {rejection.poNumber}
                          </p>

                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            {rejection.isPartialRejection ? "Partial" : "Full"}
                          </span>
                          {rejection.quantityDeducted && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Qty Deducted
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Company:</span>{" "}
                            <span className="font-medium">
                              {rejection.companyName}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Item:</span>{" "}
                            <span className="font-medium">
                              {rejection.itemCode}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Rejected:</span>{" "}
                            <span className="font-medium text-red-600">
                              {rejection.rejectedQuantity}{" "}
                              {rejection.unit || "pcs"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Reason:</span>{" "}
                            <span className="font-medium">
                              {rejection.reason}
                            </span>
                          </div>

                          <div>
                            <span className="text-gray-500">Submitted:</span>{" "}
                            <span className="font-medium">
                              {new Date(
                                rejection.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {rejection.adminRemarks && (
                          <p className="text-xs text-blue-600 mt-2">
                            Admin: {rejection.adminRemarks}
                          </p>
                        )}
                        {rejection.status === "resolved" && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Issue resolved
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {isAdmin && (
                          <button
                            onClick={() => handleReviewRejection(rejection)}
                            className={`px-3 py-1.5 rounded-lg transition text-sm flex items-center gap-1 ${
                              rejection.status === "pending_review"
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-600 text-white hover:bg-gray-700"
                            }`}
                          >
                            <Eye className="w-3 h-3" />
                            {rejection.status === "pending_review"
                              ? "Review"
                              : "View"}
                          </button>
                        )}
                        {!isAdmin && rejection.status === "pending_review" && (
                          <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                        {!isAdmin && rejection.status === "approved" && (
                          <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                        {!isAdmin && rejection.status === "rejected" && (
                          <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Denied
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Rejection Modal */}
      {isRejectionModalOpen && (
        <BulkItemRejection
          selectedItems={dispatchHistory.filter((item) =>
            selectedItems.includes(item.dispatchId),
          )}
          onClose={() => {
            setIsRejectionModalOpen(false);
            setSelectedItems([]);
            setSelectAll(false);
          }}
          onSubmit={handleRejectSubmit}
          isDemo={false}
        />
      )}

      {/* Admin Review Modal */}
      {showDetailsModal && selectedRejection && (
        <AdminRejectionReview
          rejection={selectedRejection}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRejection(null);
          }}
          onUpdate={handleReviewUpdate}
        />
      )}
    </div>
  );
};

export default RejectionHistory;
