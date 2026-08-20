import React, { useState, useEffect } from "react";
import {
  Package,
  Truck,
  Calendar,
  FileText,
  Search,
  Filter,
  Plus,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Building2,
  Download,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Upload,
  File,
  Trash2,
  ShoppingCart,
  Send,
  CheckSquare,
  Square,
  ListChecks,
  Edit2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import EditDispatchModal from "./EditDispatch";
import OldData from "../PoManagement/OldData";

const UpdateDispatch = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredPOs, setFilteredPOs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notification, setNotification] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDispatchId, setEditDispatchId] = useState(null);
  const [editDispatchInfo, setEditDispatchInfo] = useState({
    poNumber: "",
    companyName: "",
    itemCode: "",
    itemDescription: "",
  });

  const [dispatchQueue, setDispatchQueue] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkDispatchForm, setBulkDispatchForm] = useState({
    dispatchDate: new Date().toISOString().split("T")[0],
    notes: "",
    billNumber: "",
    billFile: null,
  });

  const [dispatchForm, setDispatchForm] = useState({
    poNumber: "",
    itemId: "",
    itemCode: "",
    itemName: "",
    dispatchQuantity: "",
    dispatchDate: new Date().toISOString().split("T")[0],
    batchNumber: 1,
    notes: "",
    billNumber: "",
    billFile: null,
  });

  const [loading, setLoading] = useState(false);
  const [expandedPOs, setExpandedPOs] = useState({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [showOldDispatch, setShowOldDispatch] = useState(false);

  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalPOs: 0,
    totalItems: 0,
    totalDispatched: 0,
    totalRemaining: 0,
    completionRate: 0,
    queueCount: 0,
  });

  // Get unique company names for filter dropdown
  const getUniqueCompanies = () => {
    const companies = purchaseOrders.map((po) => po.companyName);
    return [...new Set(companies)].sort();
  };

  // Calculate PO progress percentage
  const calculatePOProgress = (po) => {
    const totalItems = po.items.reduce((sum, item) => sum + item.quantity, 0);
    const dispatchedItems = po.items.reduce(
      (sum, item) => sum + item.dispatchedQuantity,
      0,
    );
    return totalItems > 0 ? (dispatchedItems / totalItems) * 100 : 0;
  };

  // Determine if PO is completed based on progress
  const isPOCompleted = (po) => {
    const progress = calculatePOProgress(po);
    return progress >= 100;
  };

  // Get PO status for display (active or completed)
  const getPOStatus = (po) => {
    return isPOCompleted(po) ? "completed" : "active";
  };

  // Fetch Purchase Orders
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch-orders/purchase-orders`,
        { withCredentials: true },
      );
      const data = response.data;

      if (data.success && data.data) {
        const transformedData = data.data.map((po) => {
          const items = po.items.map((item) => {
            const dispatchedQty = item.dispatchedQuantity || 0;
            const totalQty = item.quantity || 0;
            const remainingQty =
              item.remainingQuantity !== undefined
                ? item.remainingQuantity
                : totalQty - dispatchedQty;

            return {
              id: item._id,
              srNo: item.srNo,
              itemCode: item.itemCode,
              description: item.description,
              quantity: totalQty,
              unit: item.unit,
              unitPrice: item.ratePerUnit,
              totalPrice: item.value,
              dispatchedQuantity: dispatchedQty,
              remainingQuantity: remainingQty,
              dispatchHistory: item.dispatchHistory || [],
              currentStage: item.currentStage,
              progress: item.progress || 0,
            };
          });

          const poObj = {
            id: po._id,
            poNumber: po.orderNumber,
            orderDate: new Date(po.createdAt).toLocaleDateString(),
            companyName: po.companyName || "Vendor Name",
            status: mapPOStatus(po.status),
            totalValue: po.totalValue,
            items: items,
          };

          // Calculate progress and determine if completed
          const progress = calculatePOProgress(poObj);
          poObj.progress = progress;
          poObj.isCompleted = progress >= 100;

          return poObj;
        });

        setPurchaseOrders(transformedData);
        setFilteredPOs(transformedData);
        calculateStats(transformedData);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch purchase orders",
      );
    } finally {
      setLoading(false);
    }
  };

  const mapPOStatus = (status) => {
    const statusMap = {
      submitted: "active",
      tooling: "active",
      production: "active",
      quality: "active",
      dispatch: "active",
      delivered: "completed",
      partially_dispatched: "active",
    };
    return statusMap[status] || "active";
  };

  const calculateStats = (orders) => {
    let totalItems = 0;
    let totalDispatched = 0;
    let totalRemaining = 0;
    let completedPOs = 0;

    orders.forEach((po) => {
      po.items.forEach((item) => {
        totalItems += item.quantity;
        totalDispatched += item.dispatchedQuantity;
        totalRemaining += item.remainingQuantity;
      });
      if (po.isCompleted) {
        completedPOs++;
      }
    });

    const completionRate =
      totalItems > 0 ? (totalDispatched / totalItems) * 100 : 0;

    setStats({
      totalPOs: orders.length,
      completedPOs: completedPOs,
      activePOs: orders.length - completedPOs,
      totalItems: totalItems,
      totalDispatched: totalDispatched,
      totalRemaining: totalRemaining,
      completionRate: completionRate.toFixed(1),
      queueCount: dispatchQueue.length,
    });
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    filterPOs();
  }, [searchTerm, statusFilter, companyFilter, purchaseOrders]);

  useEffect(() => {
    calculateStats(purchaseOrders);
  }, [dispatchQueue.length]);

  const filterPOs = () => {
    let filtered = [...purchaseOrders];

    // Search filter - searches PO number, item code, and description
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((po) => {
        // Check if PO number matches
        if (po.poNumber.toLowerCase().includes(searchLower)) {
          return true;
        }

        // Check if any item matches the search term
        const itemMatch = po.items.some((item) => {
          const itemCodeMatch = item.itemCode
            .toLowerCase()
            .includes(searchLower);
          const descriptionMatch = item.description
            .toLowerCase()
            .includes(searchLower);
          return itemCodeMatch || descriptionMatch;
        });

        return itemMatch;
      });
    }

    // Company filter
    if (companyFilter !== "all") {
      filtered = filtered.filter((po) => po.companyName === companyFilter);
    }

    // Status filter - based on progress (100% = completed)
    if (statusFilter !== "all") {
      filtered = filtered.filter((po) => {
        const status = getPOStatus(po);
        return status === statusFilter;
      });
    }

    setFilteredPOs(filtered);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // ============ DELETE DISPATCH FUNCTION ============
  const deleteDispatch = async (dispatchId, poId, itemId) => {
    if (
      !window.confirm("Are you sure you want to delete this dispatch record?")
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch-orders/${dispatchId}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        showNotification("success", "Dispatch record deleted successfully!");
        await fetchPurchaseOrders(); // Refresh the data
      }
    } catch (error) {
      console.error("Error deleting dispatch:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to delete dispatch record",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============ EDIT DISPATCH FUNCTION ============
  const editDispatch = async (dispatchId, updatedData) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch-orders/${dispatchId}`,
        updatedData,
        { withCredentials: true },
      );

      if (response.data.success) {
        showNotification("success", "Dispatch record updated successfully!");
        await fetchPurchaseOrders(); // Refresh the data
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating dispatch:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to update dispatch record",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ============ BULK DISPATCH FUNCTIONS ============

  const addToDispatchQueue = (po, item, quantity) => {
    if (!quantity || quantity <= 0 || quantity > item.remainingQuantity) {
      showNotification("error", `Invalid quantity for ${item.itemCode}`);
      return false;
    }

    const existingIndex = dispatchQueue.findIndex(
      (q) => q.poId === po.id && q.itemId === item.id,
    );

    if (existingIndex >= 0) {
      const newQueue = [...dispatchQueue];
      const newQuantity = newQueue[existingIndex].quantity + quantity;

      if (newQuantity > item.remainingQuantity) {
        showNotification(
          "error",
          `Total quantity exceeds remaining for ${item.itemCode}`,
        );
        return false;
      }

      newQueue[existingIndex].quantity = newQuantity;
      setDispatchQueue(newQueue);
    } else {
      const queueId = `${po.id}-${item.id}-${Date.now()}-${Math.random()}`;
      setDispatchQueue([
        ...dispatchQueue,
        {
          id: queueId,
          poId: po.id,
          poNumber: po.poNumber,
          companyName: po.companyName,
          itemId: item.id,
          itemCode: item.itemCode,
          description: item.description,
          quantity: quantity,
          unit: item.unit,
          remainingQuantity: item.remainingQuantity,
          batchNumber: (item.dispatchHistory?.length || 0) + 1,
        },
      ]);
    }

    showNotification(
      "success",
      `Added ${quantity} ${item.unit} of ${item.itemCode} to dispatch queue`,
    );
    return true;
  };

  const removeFromQueue = (queueId) => {
    setDispatchQueue(dispatchQueue.filter((item) => item.id !== queueId));
    showNotification("info", "Item removed from dispatch queue");
  };

  const updateQueueItem = (queueId, field, value) => {
    setDispatchQueue(
      dispatchQueue.map((item) =>
        item.id === queueId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const submitBulkDispatch = async () => {
    if (dispatchQueue.length === 0) {
      showNotification("error", "Dispatch queue is empty");
      return;
    }

    setLoading(true);

    try {
      let successCount = 0;
      let failCount = 0;
      const failedItems = [];

      const itemsByPO = {};
      dispatchQueue.forEach((item) => {
        if (!itemsByPO[item.poId]) {
          itemsByPO[item.poId] = {
            poId: item.poId,
            poNumber: item.poNumber,
            companyName: item.companyName,
            dispatches: [],
          };
        }
        itemsByPO[item.poId].dispatches.push({
          ...item,
          billNumber: bulkDispatchForm.billNumber || "",
        });
      });

      for (const queueItem of dispatchQueue) {
        try {
          const formData = new FormData();
          formData.append("poId", queueItem.poId);
          formData.append("itemId", queueItem.itemId);
          formData.append("dispatchQuantity", queueItem.quantity);
          formData.append("dispatchDate", bulkDispatchForm.dispatchDate);
          formData.append("notes", bulkDispatchForm.notes || "");
          formData.append("dispatchedBy", user?.user?.name || "Admin");

          if (bulkDispatchForm.billNumber) {
            formData.append("billNumber", bulkDispatchForm.billNumber);
          }

          if (bulkDispatchForm.billFile) {
            formData.append("billFile", bulkDispatchForm.billFile);
          }

          formData.append("skipEmail", "true");

          const po = purchaseOrders.find((p) => p.id === queueItem.poId);
          const item = po?.items.find((i) => i.id === queueItem.itemId);
          const nextBatch =
            queueItem.batchNumber || (item?.dispatchHistory?.length || 0) + 1;
          formData.append("batchNumber", nextBatch);

          const response = await axios.post(
            `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch-orders`,
            formData,
            {
              withCredentials: true,
              headers: { "Content-Type": "multipart/form-data" },
            },
          );

          if (response.data.success) {
            successCount++;
            const poGroup = itemsByPO[queueItem.poId];
            if (poGroup) {
              const dispatchData = response.data.data;
              const existingDispatch = poGroup.dispatches.find(
                (d) => d.itemId === queueItem.itemId,
              );
              if (existingDispatch) {
                existingDispatch.batchNumber =
                  dispatchData.dispatch.batchNumber;
                existingDispatch.dispatchId = dispatchData.dispatch.id;
                existingDispatch.billUrl = dispatchData.dispatch.billFile;
                existingDispatch.billNumber = bulkDispatchForm.billNumber || "";
              }
            }
          } else {
            failCount++;
            failedItems.push(queueItem.itemCode);
          }
        } catch (err) {
          console.error(`Failed to dispatch ${queueItem.itemCode}:`, err);
          failCount++;
          failedItems.push(queueItem.itemCode);
        }
      }

      // Send consolidated email
      for (const poId in itemsByPO) {
        const poData = itemsByPO[poId];
        if (poData.dispatches && poData.dispatches.length > 0) {
          try {
            const dispatchesWithBill = poData.dispatches.map((d) => ({
              itemCode: d.itemCode,
              description: d.description || d.itemDescription || "",
              quantity: d.quantity,
              unit: d.unit || "pcs",
              batchNumber: d.batchNumber || 0,
              billNumber: d.billNumber || "",
              billUrl: d.billUrl || null,
              itemId: d.itemId,
            }));

            const emailFormData = new FormData();
            emailFormData.append("poId", poId);
            emailFormData.append("poNumber", poData.poNumber);
            emailFormData.append("companyName", poData.companyName);
            emailFormData.append(
              "dispatches",
              JSON.stringify(dispatchesWithBill),
            );
            emailFormData.append("dispatchDate", bulkDispatchForm.dispatchDate);
            emailFormData.append("notes", bulkDispatchForm.notes || "");

            if (bulkDispatchForm.billNumber) {
              emailFormData.append("billNumber", bulkDispatchForm.billNumber);
            }

            if (bulkDispatchForm.billFile) {
              emailFormData.append("billFile", bulkDispatchForm.billFile);
            }

            await axios.post(
              `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch-orders/send-consolidated-email`,
              emailFormData,
              {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
              },
            );
          } catch (emailError) {
            console.error(
              `Failed to send consolidated email for PO ${poData.poNumber}:`,
              emailError.response?.data || emailError.message,
            );
          }
        }
      }

      await fetchPurchaseOrders();
      setDispatchQueue([]);
      setShowBulkModal(false);
      setBulkDispatchForm({
        dispatchDate: new Date().toISOString().split("T")[0],
        notes: "",
        billNumber: "",
        billFile: null,
      });

      showNotification(
        "success",
        `Bulk dispatch completed: ${successCount} successful, ${failCount} failed${
          failedItems.length > 0 ? `. Failed: ${failedItems.join(", ")}` : ""
        }`,
      );
    } catch (error) {
      console.error("Error in bulk dispatch:", error);
      showNotification("error", "Failed to process bulk dispatch");
    } finally {
      setLoading(false);
    }
  };

  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantityModalData, setQuantityModalData] = useState({
    po: null,
    item: null,
    quantity: "",
  });

  const openQuantityModal = (po, item) => {
    setQuantityModalData({
      po,
      item,
      quantity: item.remainingQuantity.toString(),
    });
    setShowQuantityModal(true);
  };

  const confirmAddToQueue = () => {
    const { po, item, quantity } = quantityModalData;
    const qtyNum = parseFloat(quantity);
    if (!isNaN(qtyNum) && qtyNum > 0) {
      addToDispatchQueue(po, item, qtyNum);
    }
    setShowQuantityModal(false);
  };

  const clearAllQueue = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all items from the dispatch queue?",
      )
    ) {
      setDispatchQueue([]);
      showNotification("info", "Dispatch queue cleared");
    }
  };

  // ============ SINGLE DISPATCH FUNCTIONS ============

  const handlePONumberChange = (poNumber) => {
    const po = purchaseOrders.find((p) => p.poNumber === poNumber);
    setSelectedPO(po);
    setSelectedItem(null);
    setDispatchForm({
      ...dispatchForm,
      poNumber: poNumber,
      itemId: "",
      itemCode: "",
      itemName: "",
      dispatchQuantity: "",
      batchNumber: 1,
      notes: "",
      billNumber: "",
      billFile: null,
    });
  };

  const handleItemSelect = (itemId) => {
    const item = selectedPO?.items.find((i) => i.id === itemId);
    setSelectedItem(item);
    const nextBatch = (item?.dispatchHistory?.length || 0) + 1;

    setDispatchForm({
      ...dispatchForm,
      itemId: itemId,
      itemCode: item?.itemCode || "",
      itemName: item?.description || "",
      dispatchQuantity: "",
      batchNumber: nextBatch,
      notes: "",
      billNumber: "",
      billFile: null,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!validTypes.includes(file.type)) {
        showNotification("error", "Please upload PDF, JPEG, or PNG files only");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showNotification("error", "File size should be less than 5MB");
        return;
      }
      setDispatchForm({ ...dispatchForm, billFile: file });
    }
  };

  const removeFile = () => {
    setDispatchForm({ ...dispatchForm, billFile: null });
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPO || !selectedItem) {
      showNotification("error", "Please select PO and Item");
      return;
    }

    const dispatchQty = parseFloat(dispatchForm.dispatchQuantity);

    if (isNaN(dispatchQty) || dispatchQty <= 0) {
      showNotification("error", "Please enter a valid dispatch quantity");
      return;
    }

    if (dispatchQty > selectedItem.remainingQuantity) {
      showNotification(
        "error",
        `Dispatch quantity cannot exceed remaining quantity (${selectedItem.remainingQuantity} ${selectedItem.unit})`,
      );
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("poId", selectedPO.id);
      formData.append("itemId", selectedItem.id);
      formData.append("dispatchQuantity", dispatchQty);
      formData.append("dispatchDate", dispatchForm.dispatchDate);
      formData.append("batchNumber", dispatchForm.batchNumber);
      formData.append("notes", dispatchForm.notes);
      formData.append("dispatchedBy", user?.user?.name || "Admin");

      if (dispatchForm.billNumber) {
        formData.append("billNumber", dispatchForm.billNumber);
      }

      if (dispatchForm.billFile) {
        formData.append("billFile", dispatchForm.billFile);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch-orders`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.success) {
        showNotification("success", `Dispatch created successfully!`);
        await fetchPurchaseOrders();
        resetForm();
        setShowDispatchModal(false);
      }
    } catch (error) {
      console.error("Error creating dispatch:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to create dispatch",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPO(null);
    setSelectedItem(null);
    setDispatchForm({
      poNumber: "",
      itemId: "",
      itemCode: "",
      itemName: "",
      dispatchQuantity: "",
      dispatchDate: new Date().toISOString().split("T")[0],
      batchNumber: 1,
      notes: "",
      billNumber: "",
      billFile: null,
    });
  };

  const viewDispatchHistory = (item) => {
    setSelectedHistoryItem(item);
    setShowHistoryModal(true);
  };

  const getStatusBadge = (remaining, total) => {
    if (remaining === 0) {
      return {
        text: "Fully Dispatched",
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      };
    } else if (remaining < total / 2) {
      return {
        text: "Partially Dispatched",
        color: "bg-blue-100 text-blue-700",
        icon: <Clock className="w-3 h-3 mr-1" />,
      };
    } else {
      return {
        text: "Pending Dispatch",
        color: "bg-yellow-100 text-yellow-700",
        icon: <AlertCircle className="w-3 h-3 mr-1" />,
      };
    }
  };

  const getProgressPercentage = (dispatched, total) =>
    total > 0 ? (dispatched / total) * 100 : 0;

  const togglePOExpand = (poId) => {
    setExpandedPOs((prev) => ({ ...prev, [poId]: !prev[poId] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl backdrop-blur-sm ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : notification.type === "error"
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
          } animate-slide-in max-w-md`}
        >
          <div className="flex items-center">
            {notification.type === "success" && (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {notification.type === "error" && (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <>
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg mb-6 md:mb-8 overflow-hidden">
  {/* Header */}
  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 lg:px-8 py-5 md:py-6">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

      {/* Left Section */}
      <div>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg md:rounded-xl p-2 backdrop-blur-sm shrink-0">
            <Truck className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            Dispatch Management
          </h2>
        </div>

        <p className="text-blue-100 mt-2 text-sm sm:text-base">
          Manage and track all purchase order dispatches
        </p>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3 w-full lg:w-auto">

        <button
          onClick={() => setShowOldDispatch(true)}
          className="w-full lg:w-auto px-4 md:px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all"
        >
          Import Old Data
        </button>

        <button
          onClick={() => setShowBulkModal(true)}
          disabled={dispatchQueue.length === 0}
          className={`w-full lg:w-auto px-4 md:px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg ${
            dispatchQueue.length === 0
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
        >
          <ListChecks className="w-5 h-5" />
          <span className="truncate">
            Dispatch Queue ({dispatchQueue.length})
          </span>
        </button>

        <button
          onClick={() => setShowDispatchModal(true)}
          className="w-full sm:col-span-2 lg:col-span-1 lg:w-auto px-4 md:px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Single Dispatch</span>
        </button>

      </div>
    </div>
  </div>

  {/* Stats */}
  <div className="px-4 sm:px-6 lg:px-8 py-4 bg-gray-50 border-b border-gray-100">

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 text-sm">

      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-gray-600 truncate">
          Admin: {user?.user?.name || "Administrator"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-gray-600">
          {stats.totalPOs} Total POs
        </span>
      </div>

      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
        <span className="text-gray-600">
          {stats.completedPOs || 0} Completed
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="text-gray-600">
          {stats.activePOs || 0} Active
        </span>
      </div>

      {stats.queueCount > 0 && (
        <div className="flex items-center gap-2 bg-emerald-100 px-3 py-2 rounded-full w-fit">
          <ShoppingCart className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-700 font-medium whitespace-nowrap">
            {stats.queueCount} items in queue
          </span>
        </div>
      )}

    </div>
  </div>
</div>

        {/* Render OldData OUTSIDE the button row */}
        {showOldDispatch && (
          <OldData onClose={() => setShowOldDispatch(false)} />
        )}
      </>

      {/* Statistics Cards */}
      <div className="px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total POs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalPOs}
                </p>
              </div>
              <div className="bg-blue-100 rounded-xl p-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active POs</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {stats.activePOs || 0}
                </p>
              </div>
              <div className="bg-amber-100 rounded-xl p-3">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Completed POs
                </p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {stats.completedPOs || 0}
                </p>
              </div>
              <div className="bg-green-100 rounded-xl p-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Queue</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">
                  {stats.queueCount}
                </p>
              </div>
              <div className="bg-indigo-100 rounded-xl p-3">
                <ShoppingCart className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by PO Number, Item Code, or Description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-12 w-full md:w-auto">
              {/* Company Filter */}
              <div className="relative">
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="py-2.5 border text-center border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none appearance-none min-w-[150px]"
                >
                  <option value="all">All Companies</option>
                  {getUniqueCompanies().map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
                <Building2 className="absolute left-3 top-1/3  transform  text-gray-400 w-4 h-4 pointer-events-none text-center" />
              </div>

              {/* Status Filter - Updated to use active/completed based on progress */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none appearance-none min-w-[140px]"
                >
                  <option value="all">All Status</option>
                  <option value="active">
                    Active ({stats.activePOs || 0})
                  </option>
                  <option value="completed">
                    Completed ({stats.completedPOs || 0})
                  </option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(searchTerm ||
                companyFilter !== "all" ||
                statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCompanyFilter("all");
                    setStatusFilter("all");
                  }}
                  className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}

              {/* Results Count */}
              <div className="flex items-center px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-600">
                <span className="font-medium">{filteredPOs.length}</span>
                <span className="ml-1">POs found</span>
              </div>
            </div>
          </div>

          {/* Search hint */}
          <div className="mt-2 text-xs text-gray-400 flex items-center gap-4">
            <span>Search in: PO Number, Item Code, Description</span>
            <span>|</span>
            <span>Filter by: Company, Status (based on 100% progress)</span>
          </div>
        </div>
      </div>

      {/* POs List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6 mx-6 lg:mx-8 mb-8">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Purchase Orders
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {filteredPOs.length} PO(s) found
                {searchTerm && ` for "${searchTerm}"`}
                {companyFilter !== "all" && ` | Company: ${companyFilter}`}
                {statusFilter !== "all" && ` | Status: ${statusFilter}`}
              </p>
            </div>
            <button
              onClick={fetchPurchaseOrders}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading && purchaseOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-500 mt-4">Loading purchase orders...</p>
          </div>
        ) : filteredPOs.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center justify-center">
              <div className="bg-slate-100 rounded-full p-4 mb-4">
                <Package className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No POs found
              </h3>
              <p className="text-slate-500 mb-4">
                {searchTerm
                  ? `No purchase orders match "${searchTerm}"`
                  : "No purchase orders match your filter criteria"}
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCompanyFilter("all");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredPOs.map((po) => {
              const progress = calculatePOProgress(po);
              const isCompleted = progress >= 100;

              return (
                <div key={po.id} className="transition-all">
                  {/* PO Header */}
                  <div
                    className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-all ${
                      isCompleted ? "bg-green-50/30" : "bg-white"
                    }`}
                    onClick={() => togglePOExpand(po.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {expandedPOs[po.id] ? (
                          <ChevronDown className="w-5 h-5 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-blue-600" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-semibold text-slate-800">
                              {po.poNumber}
                            </h3>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {po.companyName}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                isCompleted
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {isCompleted ? "COMPLETED" : "ACTIVE"}
                            </span>
                            {isCompleted && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                100% Complete
                              </span>
                            )}
                          </div>
                          <div className="flex gap-4 mt-1 text-sm text-slate-500 flex-wrap">
                            <span>Order Date: {po.orderDate}</span>
                            <span>Items: {po.items.length}</span>
                            <span>
                              Total Value: ₹{po.totalValue?.toLocaleString()}
                            </span>
                            <span>Progress: {progress.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-slate-700">
                            Progress
                          </div>
                          <div className="text-xs text-slate-500">
                            {progress.toFixed(1)}% Complete
                          </div>
                        </div>
                        {!isCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPO(po);
                              setShowDispatchModal(true);
                            }}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1"
                          >
                            <Truck className="w-4 h-4" /> New Dispatch
                          </button>
                        )}
                        {isCompleted && (
                          <div className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> All Dispatched
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  {expandedPOs[po.id] && (
                    <div className="overflow-x-auto bg-gray-50">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Item Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Ordered Qty
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Dispatched
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Remaining
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Progress
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {po.items.map((item) => {
                            const status = getStatusBadge(
                              item.remainingQuantity,
                              item.quantity,
                            );
                            const progress = getProgressPercentage(
                              item.dispatchedQuantity,
                              item.quantity,
                            );
                            const isInQueue = dispatchQueue.some(
                              (q) => q.poId === po.id && q.itemId === item.id,
                            );
                            const queueItem = dispatchQueue.find(
                              (q) => q.poId === po.id && q.itemId === item.id,
                            );
                            const isItemCompleted =
                              item.remainingQuantity === 0;

                            return (
                              <tr
                                key={item.id}
                                className={`hover:bg-white transition-colors ${
                                  isItemCompleted ? "bg-green-50/30" : ""
                                }`}
                              >
                                <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">
                                  {item.itemCode}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-gray-800">
                                    {item.description}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Unit: {item.unit}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-gray-700 font-medium">
                                  {item.quantity}
                                </td>
                                <td className="px-6 py-4 text-emerald-700 font-medium">
                                  {item.dispatchedQuantity}
                                </td>
                                <td className="px-6 py-4 text-amber-700 font-medium">
                                  {item.remainingQuantity}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                                  >
                                    {status.icon}
                                    {status.text}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="w-32">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>{progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all ${
                                          progress >= 100
                                            ? "bg-green-600"
                                            : "bg-blue-600"
                                        }`}
                                        style={{ width: `${progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    {item.remainingQuantity > 0 &&
                                      !isCompleted && (
                                        <button
                                          onClick={() =>
                                            openQuantityModal(po, item)
                                          }
                                          className={`px-3 py-1 text-xs rounded-lg flex items-center gap-1 transition-all ${
                                            isInQueue
                                              ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                                          }`}
                                        >
                                          <ShoppingCart className="w-3 h-3" />
                                          {isInQueue
                                            ? `In Queue (${queueItem?.quantity})`
                                            : "Add to Queue"}
                                        </button>
                                      )}
                                    {item.remainingQuantity === 0 && (
                                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Done
                                      </span>
                                    )}
                                    {item.dispatchHistory &&
                                      item.dispatchHistory.length > 0 && (
                                        <button
                                          onClick={() =>
                                            viewDispatchHistory(item)
                                          }
                                          className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center gap-1"
                                        >
                                          <Eye className="w-3 h-3" /> History (
                                          {item.dispatchHistory.length})
                                        </button>
                                      )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ BULK DISPATCH MODAL ============ */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-600" />
                  Bulk Dispatch Queue
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {dispatchQueue.length} item(s) ready for dispatch
                </p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div
              className="flex flex-col overflow-auto"
              style={{ maxHeight: "calc(90vh - 180px)" }}
            >
              <div className="p-6 space-y-4">
                {/* Common Dispatch Details */}
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                  <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Common Dispatch Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Dispatch Date *
                      </label>
                      <input
                        type="date"
                        value={bulkDispatchForm.dispatchDate}
                        onChange={(e) =>
                          setBulkDispatchForm({
                            ...bulkDispatchForm,
                            dispatchDate: e.target.value,
                          })
                        }
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Common Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={bulkDispatchForm.notes}
                        onChange={(e) =>
                          setBulkDispatchForm({
                            ...bulkDispatchForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Add notes for all items"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bill Section - Now Optional */}
                <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl p-4 border border-blue-100">
                  <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Bill Details (Optional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Bill Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={bulkDispatchForm.billNumber}
                        onChange={(e) =>
                          setBulkDispatchForm({
                            ...bulkDispatchForm,
                            billNumber: e.target.value,
                          })
                        }
                        placeholder="Enter bill/invoice number"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Bill number is optional
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Upload Bill File (Optional)
                      </label>
                      <div className="flex items-center gap-2">
                        <label
                          className={`flex-1 flex items-center justify-center px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                            bulkDispatchForm.billFile
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const validTypes = [
                                  "application/pdf",
                                  "image/jpeg",
                                  "image/png",
                                  "image/jpg",
                                ];
                                if (!validTypes.includes(file.type)) {
                                  showNotification(
                                    "error",
                                    "Please upload PDF, JPEG, or PNG files only",
                                  );
                                  return;
                                }
                                if (file.size > 5 * 1024 * 1024) {
                                  showNotification(
                                    "error",
                                    "File size should be less than 5MB",
                                  );
                                  return;
                                }
                                setBulkDispatchForm({
                                  ...bulkDispatchForm,
                                  billFile: file,
                                });
                              }
                            }}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                          {bulkDispatchForm.billFile ? (
                            <div className="flex items-center gap-2 text-sm text-emerald-600">
                              <File className="w-4 h-4" />{" "}
                              {bulkDispatchForm.billFile.name}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Upload className="w-4 h-4" /> Click to upload
                              bill (optional)
                            </div>
                          )}
                        </label>
                        {bulkDispatchForm.billFile && (
                          <button
                            onClick={() =>
                              setBulkDispatchForm({
                                ...bulkDispatchForm,
                                billFile: null,
                              })
                            }
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 bg-white p-2 rounded-lg">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Bill details are optional. You can skip or add them later.
                  </div>
                </div>

                {/* Queue Items List */}
                {dispatchQueue.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Dispatch queue is empty</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add items using "Add to Queue" button
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-slate-700 flex items-center gap-2">
                        <Package className="w-4 h-4 text-emerald-600" />
                        Items in Queue ({dispatchQueue.length})
                      </h3>
                      <button
                        onClick={clearAllQueue}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear All
                      </button>
                    </div>
                    {dispatchQueue.map((queueItem, index) => (
                      <div
                        key={queueItem.id}
                        className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all bg-white"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm font-bold text-slate-800">
                                  {queueItem.itemCode}
                                </span>
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  {queueItem.poNumber}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">
                                {queueItem.description}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {queueItem.companyName}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromQueue(queueItem.id)}
                            className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Quantity ({queueItem.unit}) *
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="1"
                              max={queueItem.remainingQuantity}
                              value={queueItem.quantity}
                              onChange={(e) =>
                                updateQueueItem(
                                  queueItem.id,
                                  "quantity",
                                  parseFloat(e.target.value),
                                )
                              }
                              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
                            />
                            <p className="text-xs text-slate-400 mt-1">
                              Max: {queueItem.remainingQuantity}
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Batch Number
                            </label>
                            <input
                              type="number"
                              value={
                                queueItem.batchNumber ||
                                (queueItem.dispatchHistory?.length || 0) + 1
                              }
                              onChange={(e) =>
                                updateQueueItem(
                                  queueItem.id,
                                  "batchNumber",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
                            />
                          </div>
                          <div className="flex items-center">
                            <div className="text-xs text-slate-500 bg-gray-50 p-2 rounded-lg w-full">
                              <span className="text-emerald-600">✓</span> Bill:{" "}
                              {bulkDispatchForm.billNumber || "Not set"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-between gap-3 rounded-b-2xl sticky bottom-0">
              <div className="text-sm text-slate-600 bg-white px-3 py-1.5 rounded-lg">
                Total items:{" "}
                <span className="font-bold text-emerald-600">
                  {dispatchQueue.length}
                </span>{" "}
                | Total quantity:{" "}
                <span className="font-bold text-emerald-600">
                  {dispatchQueue.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBulkModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={submitBulkDispatch}
                  disabled={loading || dispatchQueue.length === 0}
                  className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <Send className="w-4 h-4" />
                  Dispatch All ({dispatchQueue.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ QUANTITY INPUT MODAL ============ */}
      {showQuantityModal && quantityModalData.item && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                Add to Dispatch Queue
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {quantityModalData.item.itemCode} -{" "}
                {quantityModalData.item.description.substring(0, 60)}
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dispatch Quantity
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={quantityModalData.item.remainingQuantity}
                  value={quantityModalData.quantity}
                  onChange={(e) =>
                    setQuantityModalData({
                      ...quantityModalData,
                      quantity: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-slate-400">
                  {quantityModalData.item.unit}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Max available: {quantityModalData.item.remainingQuantity}{" "}
                {quantityModalData.item.unit}
              </p>
              <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  You can add multiple quantities from the same item. They will
                  be combined in the queue.
                </p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowQuantityModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddToQueue}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ SINGLE DISPATCH MODAL ============ */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[98vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Create Single Dispatch
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Record dispatch details for a single purchase order item
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDispatchModal(false);
                  resetForm();
                }}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form
              onSubmit={handleDispatchSubmit}
              className="flex flex-col overflow-auto"
            >
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* PO Number Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    PO Number <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={dispatchForm.poNumber}
                    onChange={(e) => handlePONumberChange(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none bg-white"
                    required
                  >
                    <option value="">Select PO Number</option>
                    {purchaseOrders
                      .filter((po) => !po.isCompleted) // Only show active POs for dispatch
                      .map((po) => (
                        <option key={po.id} value={po.poNumber}>
                          {po.poNumber} - {po.companyName} (
                          {
                            po.items.filter(
                              (item) => item.remainingQuantity > 0,
                            ).length
                          }{" "}
                          items remaining)
                        </option>
                      ))}
                  </select>
                  {purchaseOrders.filter((po) => !po.isCompleted).length ===
                    0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      All POs are completed. No active POs available for
                      dispatch.
                    </p>
                  )}
                </div>

                {/* Item Selection */}
                {selectedPO && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Select Item <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={dispatchForm.itemId}
                      onChange={(e) => handleItemSelect(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none bg-white"
                      required
                    >
                      <option value="">Select Item</option>
                      {selectedPO.items
                        .filter((item) => item.remainingQuantity > 0)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.itemCode} -{" "}
                            {item.description.substring(0, 50)} (Remaining:{" "}
                            {item.remainingQuantity} {item.unit})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Item Details Display */}
                {selectedItem && (
                  <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Item Code:</span>
                      <span className="font-medium text-slate-800">
                        {selectedItem.itemCode}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Description:</span>
                      <span className="font-medium text-slate-800">
                        {selectedItem.description}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Unit:</span>
                      <span className="font-medium text-slate-800">
                        {selectedItem.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Ordered Quantity:</span>
                      <span className="font-medium text-slate-800">
                        {selectedItem.quantity}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        Already Dispatched:
                      </span>
                      <span className="font-medium text-emerald-600">
                        {selectedItem.dispatchedQuantity}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        Remaining Quantity:
                      </span>
                      <span className="font-medium text-amber-600">
                        {selectedItem.remainingQuantity}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Next Batch Number:</span>
                      <span className="font-medium text-blue-600">
                        Batch #{dispatchForm.batchNumber}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dispatch Details */}
                {selectedItem && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Bill Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={dispatchForm.billNumber}
                        onChange={(e) =>
                          setDispatchForm({
                            ...dispatchForm,
                            billNumber: e.target.value,
                          })
                        }
                        placeholder="Enter bill/invoice number (optional)"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Bill number is optional
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Dispatch Quantity{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="1"
                          max={selectedItem.remainingQuantity}
                          value={dispatchForm.dispatchQuantity}
                          onChange={(e) =>
                            setDispatchForm({
                              ...dispatchForm,
                              dispatchQuantity: e.target.value,
                            })
                          }
                          placeholder={`Enter quantity (Max: ${selectedItem.remainingQuantity} ${selectedItem.unit})`}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none pr-24"
                          required
                        />
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-slate-400">
                          {selectedItem.unit}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Dispatch Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={dispatchForm.dispatchDate}
                        onChange={(e) =>
                          setDispatchForm({
                            ...dispatchForm,
                            dispatchDate: e.target.value,
                          })
                        }
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={dispatchForm.notes}
                        onChange={(e) =>
                          setDispatchForm({
                            ...dispatchForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Add any additional notes..."
                        rows="3"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Upload Bill (Optional)
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-xl hover:border-blue-400 transition-colors">
                        {!dispatchForm.billFile ? (
                          <div className="space-y-1 text-center">
                            <Upload className="mx-auto h-12 w-12 text-slate-400" />
                            <div className="flex text-sm text-slate-600">
                              <label
                                htmlFor="bill-upload"
                                className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="bill-upload"
                                  name="bill-upload"
                                  type="file"
                                  className="sr-only"
                                  onChange={handleFileChange}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-slate-500">
                              PDF, PNG, JPG up to 5MB (optional)
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-3">
                              <File className="h-8 w-8 text-blue-500" />
                              <div className="text-sm">
                                <p className="font-medium text-slate-700">
                                  {dispatchForm.billFile.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {(dispatchForm.billFile.size / 1024).toFixed(
                                    2,
                                  )}{" "}
                                  KB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={removeFile}
                              className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-5 w-5 text-red-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl sticky bottom-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowDispatchModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    loading || !selectedItem || !dispatchForm.dispatchQuantity
                  }
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <Truck className="w-4 h-4" />
                  Create Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ DISPATCH HISTORY MODAL ============ */}
      {showHistoryModal && selectedHistoryItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Dispatch History
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedHistoryItem.itemCode} -{" "}
                  {selectedHistoryItem.description}
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Total Ordered:</span>
                    <span className="ml-2 font-medium text-slate-800">
                      {selectedHistoryItem.quantity} {selectedHistoryItem.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Dispatched:</span>
                    <span className="ml-2 font-medium text-emerald-600">
                      {selectedHistoryItem.dispatchedQuantity}{" "}
                      {selectedHistoryItem.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Remaining:</span>
                    <span className="ml-2 font-medium text-amber-600">
                      {selectedHistoryItem.remainingQuantity}{" "}
                      {selectedHistoryItem.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Batches:</span>
                    <span className="ml-2 font-medium text-blue-600">
                      {selectedHistoryItem.dispatchHistory?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Dispatch Records
                </h3>
                {selectedHistoryItem.dispatchHistory &&
                selectedHistoryItem.dispatchHistory.length > 0 ? (
                  selectedHistoryItem.dispatchHistory.map((dispatch, index) => {
                    console.log("Dispatch object:", dispatch);
                    console.log("Available ID fields:", {
                      dispatchId: dispatch.dispatchId,
                      _id: dispatch._id,
                      id: dispatch.id,
                      batchNo: dispatch.batchNo,
                    });

                    return (
                      <div
                        key={index}
                        className="border border-slate-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 rounded-lg px-2 py-1">
                              <span className="text-xs font-bold text-blue-700">
                                Batch #{dispatch.batchNo}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {new Date(dispatch.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-bold text-emerald-600">
                                {dispatch.quantity}
                              </div>
                              <div className="text-xs text-slate-500">
                                {selectedHistoryItem.unit}
                              </div>
                            </div>
                            {/* EDIT BUTTON */}
                            <button
                              onClick={() => {
                                const po = purchaseOrders.find((p) =>
                                  p.items.some(
                                    (item) =>
                                      item.id === selectedHistoryItem.id,
                                  ),
                                );
                                setEditDispatchId(
                                  dispatch.dispatchId || dispatch._id,
                                );
                                setEditDispatchInfo({
                                  poNumber: po?.poNumber || "",
                                  companyName: po?.companyName || "",
                                  itemCode: selectedHistoryItem.itemCode || "",
                                  itemDescription:
                                    selectedHistoryItem.description || "",
                                });
                                setShowEditModal(true);
                                setShowHistoryModal(false);
                              }}
                              className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Edit this dispatch"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {/* DELETE BUTTON */}
                            <button
                              onClick={() => {
                                const po = purchaseOrders.find((p) =>
                                  p.items.some(
                                    (item) =>
                                      item.id === selectedHistoryItem.id,
                                  ),
                                );
                                const dispatchId =
                                  dispatch.dispatchId || dispatch._id;
                                if (dispatchId) {
                                  deleteDispatch(
                                    dispatchId,
                                    po?.id,
                                    selectedHistoryItem.id,
                                  );
                                }
                              }}
                              className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="Delete this dispatch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {dispatch.billNumber && (
                          <div className="text-sm text-slate-600 mb-1">
                            Bill Number: {dispatch.billNumber}
                          </div>
                        )}
                        <div className="text-sm text-slate-600 mb-1">
                          Dispatched by: {dispatch.dispatchedBy}
                        </div>
                        {dispatch.notes && (
                          <div className="text-xs text-slate-500 bg-gray-100 rounded-lg p-2 mt-2">
                            {dispatch.notes}
                          </div>
                        )}
                        {dispatch.billFile && (
                          <div className="mt-2">
                            <a
                              href={dispatch.billFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                              <File className="w-3 h-3" />
                              View Bill
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No dispatch records found
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <EditDispatchModal
          dispatchId={editDispatchId}
          onClose={() => {
            setShowEditModal(false);
            setEditDispatchId(null);
          }}
          onSuccess={() => {
            fetchPurchaseOrders(); // Refresh data
          }}
          poNumber={editDispatchInfo.poNumber}
          companyName={editDispatchInfo.companyName}
          itemCode={editDispatchInfo.itemCode}
          itemDescription={editDispatchInfo.itemDescription}
        />
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
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default UpdateDispatch;
