import React from "react";
import { useState, useCallback, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleAlert,
  CircleCheckBig,
  Clock3,
  Download,
  Eye,
  EyeOff,
  FileDown,
  FileSpreadsheet,
  FileText,
  Gauge,
  Grid2X2,
  History,
  IndianRupee,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  Package,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Truck,
  Upload,
  X,
  AlertCircle,
  Layers,
  Copy,
} from "lucide-react";

// ============================================
// DISPATCH HISTORY BILL DETAILS COMPONENT
// ============================================
// ============================================
// DISPATCH HISTORY BILL DETAILS COMPONENT
// ============================================
const DispatchBillDetails = ({ billNumber, entries, onClose }) => {
  const totalItems = entries.length;
  const totalQuantity = entries.reduce(
    (sum, entry) => sum + (entry.dispatchQty || 0),
    0,
  );
  const dispatchDate = entries[0]?.dispatchDate;
  const transportMode = entries[0]?.transportMode;
  const remarks = entries[0]?.remarks;
  const receivedBy = entries[0]?.receivedBy;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative w-full max-w-4xl overflow-hidden bg-white rounded-2xl shadow-2xl animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Bill Details</h3>
                <p className="text-sm text-blue-100">Bill #: {billNumber}</p>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg text-white hover:bg-white/15 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bill Summary */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Dispatch Date</p>
                <p className="text-sm font-semibold text-gray-800">
                  {dispatchDate
                    ? new Date(dispatchDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Items</p>
                <p className="text-sm font-semibold text-gray-800">
                  {totalItems}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Quantity</p>
                <p className="text-sm font-semibold text-gray-800">
                  {totalQuantity}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Transport</p>
                <p className="text-sm font-semibold text-gray-800">
                  {transportMode || "-"}
                </p>
              </div>
            </div>
            {receivedBy && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Received By</p>
                <p className="text-sm font-semibold text-gray-800">
                  {receivedBy}
                </p>
              </div>
            )}
            {remarks && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Remarks</p>
                <p className="text-sm text-gray-700">{remarks}</p>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="max-h-[400px] overflow-y-auto p-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                    #
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                    PO Number
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                    Company
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                    Item
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">
                    Qty Dispatched
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition">
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-mono text-sm font-semibold text-gray-800">
                      {entry.po || "-"}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {entry.company || "-"}
                    </td>
                    <td
                      className="px-3 py-2 text-sm text-gray-700 max-w-[200px] truncate"
                      title={entry.item}
                    >
                      {entry.item || "-"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-green-600">
                      {entry.dispatchQty || 0}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {entry.newPending || entry.pending || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-3 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// GLOBAL DISPATCH HISTORY MODAL
// ============================================
const GlobalDispatchHistoryModal = ({
  isOpen,
  onClose,
  dispatchHistory,
  formatCurrency,
  formatDate,
}) => {
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillDetails, setShowBillDetails] = useState(false);

  // Get all unique bills from dispatch history
  const allBills = useMemo(() => {
    const bills = {};
    Object.entries(dispatchHistory).forEach(([itemKey, history]) => {
      history.forEach((entry) => {
        const bill = entry.billNumber || "Unknown Bill";
        if (!bills[bill]) {
          bills[bill] = {
            billNumber: bill,
            entries: [],
            dispatchDate: entry.dispatchDate,
            transportMode: entry.transportMode,
            remarks: entry.remarks,
            receivedBy: entry.receivedBy,
            totalItems: 0,
            totalQuantity: 0,
          };
        }
        bills[bill].entries.push({
          ...entry,
          itemKey,
          po: entry.po || "Unknown PO",
          company: entry.company || "Unknown Company",
          item: entry.item || "Unknown Item",
        });
        bills[bill].totalItems += 1;
        bills[bill].totalQuantity += entry.dispatchQty || 0;
      });
    });
    return Object.values(bills).sort(
      (a, b) => new Date(b.dispatchDate) - new Date(a.dispatchDate),
    );
  }, [dispatchHistory]);

  const totalBills = allBills.length;
  const totalItemsDispatched = allBills.reduce(
    (sum, bill) => sum + bill.totalItems,
    0,
  );
  const totalQuantityDispatched = allBills.reduce(
    (sum, bill) => sum + bill.totalQuantity,
    0,
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Bill Details Modal */}
      {showBillDetails && selectedBill && (
        <DispatchBillDetails
          billNumber={selectedBill.billNumber}
          entries={selectedBill.entries}
          onClose={() => {
            setShowBillDetails(false);
            setSelectedBill(null);
          }}
        />
      )}

      <div
        className="fixed inset-0 z-[70] overflow-y-auto p-2 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-history-modal-title"
      >
        <div className="flex min-h-screen items-center justify-center">
          <div
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm transition-all duration-300"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-6xl overflow-hidden bg-white rounded-3xl shadow-2xl shadow-slate-950/25 ring-1 ring-white/20 transition-all duration-300 animate-fadeIn">
            {/* Modal Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-purple-600 to-blue-700 px-5 py-4 sm:px-6">
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/15">
                    <History className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3
                      id="global-history-modal-title"
                      className="text-lg font-bold tracking-tight text-white"
                    >
                      Dispatch History
                    </h3>
                    <p className="text-sm text-blue-100">
                      {totalBills} bills · {totalItemsDispatched} items ·{" "}
                      {totalQuantityDispatched} units
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="grid h-9 w-9 place-items-center rounded-xl text-white transition hover:bg-white/15"
                  aria-label="Close history dialog"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="thin-scrollbar bg-slate-50 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="px-4 py-5 sm:px-6">
                {allBills.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">
                      No dispatch history available
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Dispatch some items to see history here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allBills.map((bill, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedBill(bill);
                          setShowBillDetails(true);
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-mono font-bold text-indigo-600 text-sm">
                                #{bill.billNumber}
                              </span>
                              <span className="text-gray-300">|</span>
                              <span className="text-xs text-gray-500">
                                {bill.dispatchDate
                                  ? formatDate(bill.dispatchDate)
                                  : "-"}
                              </span>
                              {bill.transportMode && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <span className="text-xs text-gray-500">
                                    🚚 {bill.transportMode}
                                  </span>
                                </>
                              )}
                              {bill.receivedBy && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <span className="text-xs text-gray-500">
                                    👤 {bill.receivedBy}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                📦{" "}
                                <strong className="text-gray-700">
                                  {bill.totalItems}
                                </strong>{" "}
                                item{bill.totalItems > 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                📊{" "}
                                <strong className="text-gray-700">
                                  {bill.totalQuantity}
                                </strong>{" "}
                                units
                              </span>
                              {bill.remarks && (
                                <span className="text-gray-400">
                                  💬{" "}
                                  {bill.remarks.length > 30
                                    ? bill.remarks.substring(0, 30) + "..."
                                    : bill.remarks}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBill(bill);
                                setShowBillDetails(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                            >
                              View Details
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white rounded-lg hover:bg-gray-100 transition border border-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================
// MULTIPLE DISPATCH MODAL COMPONENT
// ============================================
const MultipleDispatchModal = ({
  isOpen,
  onClose,
  selectedItems = [],
  onDispatchUpdate,
  dispatchHistory = {},
}) => {
  const [individualQuantities, setIndividualQuantities] = useState({});
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
  const [errors, setErrors] = useState({});
  const [selectedBillForDetails, setSelectedBillForDetails] = useState(null);
  const [showBillDetails, setShowBillDetails] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    setIndividualQuantities({});
    setDispatchDate(new Date().toISOString().split("T")[0]);
    setBillNumber("");
    setRemarks("");
    setTransportMode("");
    setTrackingNumber("");
    setReceivedBy("");
    setStatus("Partial");
    setErrors({});
    setSelectedBillForDetails(null);
    setShowBillDetails(false);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Group dispatch history by bill number
  const groupedHistory = useMemo(() => {
    const groups = {};
    Object.entries(dispatchHistory).forEach(([itemKey, history]) => {
      history.forEach((entry) => {
        const bill = entry.billNumber || "Unknown Bill";
        if (!groups[bill]) {
          groups[bill] = {
            billNumber: bill,
            entries: [],
            dispatchDate: entry.dispatchDate,
            transportMode: entry.transportMode,
            remarks: entry.remarks,
            receivedBy: entry.receivedBy,
            totalItems: 0,
            totalQuantity: 0,
          };
        }
        groups[bill].entries.push({
          ...entry,
          itemKey,
          po: entry.po || "Unknown PO",
          company: entry.company || "Unknown Company",
          item: entry.item || "Unknown Item",
        });
        groups[bill].totalItems += 1;
        groups[bill].totalQuantity += entry.dispatchQty || 0;
      });
    });
    return groups;
  }, [dispatchHistory]);

  const getTotalPending = () => {
    return selectedItems.reduce((sum, item) => sum + (item.pending || 0), 0);
  };

  const validate = () => {
    const newErrors = {};
    let hasValidQuantity = false;
    const invalidItems = [];

    selectedItems.forEach((item) => {
      const itemKey = getItemKey(item);
      const qty = Number(individualQuantities[itemKey]) || 0;
      const pending = item.pending || 0;

      if (qty > 0 && qty <= pending) {
        hasValidQuantity = true;
      } else if (qty > 0 && qty > pending) {
        invalidItems.push(`${item.po} (max: ${pending})`);
      }
    });

    if (!hasValidQuantity) {
      newErrors.dispatchQty =
        "Please enter valid quantities for at least one item";
    }
    if (invalidItems.length > 0) {
      newErrors.dispatchQty = `Invalid quantities for: ${invalidItems.join(", ")}`;
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

    const dispatchEntry = {
      dispatchDate,
      billNumber: billNumber.trim(),
      remarks: remarks.trim(),
      transportMode: transportMode.trim(),
      trackingNumber: trackingNumber.trim(),
      receivedBy: receivedBy.trim(),
      status: status,
      timestamp: new Date().toISOString(),
      isBulkDispatch: true,
      totalItemsDispatched: selectedItems.length,
    };

    // Process each selected item
    const updates = selectedItems.map((item) => {
      const itemKey = getItemKey(item);
      const qtyToDispatch = Math.min(
        Number(individualQuantities[itemKey]) || 0,
        item.pending || 0,
      );

      if (qtyToDispatch <= 0) {
        return {
          item,
          dispatched: item.dispatched,
          pending: item.pending,
          status: item.status,
          dispatchEntry: null,
          skipped: true,
          reason: "No valid quantity specified",
        };
      }

      const currentPending = Number(item.pending) || 0;
      const newPending = Math.max(0, currentPending - qtyToDispatch);
      const newDispatched = (Number(item.dispatched) || 0) + qtyToDispatch;

      const itemDispatchEntry = {
        ...dispatchEntry,
        dispatchQty: qtyToDispatch,
        itemKey: itemKey,
        po: item.po,
        company: item.company,
        item: item.item,
        originalPending: currentPending,
        newPending: newPending,
      };

      return {
        item,
        dispatched: newDispatched,
        pending: newPending,
        status: newPending === 0 ? "Completed" : "Partial",
        dispatchEntry: itemDispatchEntry,
        skipped: false,
      };
    });

    // Apply updates
    const successfulUpdates = updates.filter((u) => !u.skipped);
    const failedUpdates = updates.filter((u) => u.skipped);

    // Update the state
    const updateData = {
      updates: successfulUpdates,
      failed: failedUpdates,
      totalProcessed: successfulUpdates.length,
      totalFailed: failedUpdates.length,
      dispatchEntry,
      isBulk: true,
    };

    setTimeout(() => {
      onDispatchUpdate(updateData);
      setIsSubmitting(false);
      onClose();
    }, 350);
  };

  const handleIndividualQuantityChange = (itemKey, value) => {
    setIndividualQuantities((prev) => ({
      ...prev,
      [itemKey]: value,
    }));
    if (errors.dispatchQty) {
      setErrors((current) => ({ ...current, dispatchQty: "" }));
    }
  };

  const getItemKey = (item) =>
    [item?.company, item?.po, item?.itemCode, item?.drawing, item?.item]
      .filter(Boolean)
      .join("::");

  const getTotalPendingValue = () => {
    return selectedItems.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  // Truncate text function
  const truncateText = (text, maxLength = 60) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (!isOpen || selectedItems.length === 0) return null;

  return (
    <>
      {/* Bill Details Modal */}
      {showBillDetails && selectedBillForDetails && (
        <DispatchBillDetails
          billNumber={selectedBillForDetails.billNumber}
          entries={selectedBillForDetails.entries}
          onClose={() => {
            setShowBillDetails(false);
            setSelectedBillForDetails(null);
          }}
        />
      )}

      <div
        className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="multiple-dispatch-modal-title"
      >
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
            @keyframes slideIn {
              from { opacity: 0; transform: translateX(-20px); }
              to { opacity: 1; transform: translateX(0); }
            }
            .animate-slideIn {
              animation: slideIn 0.3s ease-out;
            }
          `}
        </style>

        <div className="flex min-h-screen items-center justify-center">
          <div
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm transition-all duration-300"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-5xl overflow-hidden bg-white rounded-3xl shadow-2xl shadow-slate-950/25 ring-1 ring-white/20 transition-all duration-300 animate-fadeIn">
            {/* Modal Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-purple-600 to-blue-700 px-5 py-4 sm:px-6">
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/15">
                    <Layers className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3
                      id="multiple-dispatch-modal-title"
                      className="text-lg font-bold tracking-tight text-white"
                    >
                      Multiple Dispatch
                    </h3>
                    <p className="text-sm text-blue-100">
                      {selectedItems.length} items selected for dispatch
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="grid h-9 w-9 place-items-center rounded-xl text-white transition hover:bg-white/15"
                  aria-label="Close dispatch dialog"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="thin-scrollbar bg-slate-50 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <div className="px-4 py-5 sm:px-6">
                {/* Selected Items Summary */}
                <div className="mb-5 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <Package className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Items</p>
                        <p className="font-medium text-gray-800">
                          {selectedItems.length} POs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-rose-100 rounded-lg">
                        <Clock3 className="w-4 h-4 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Pending</p>
                        <p className="font-medium text-gray-800">
                          {getTotalPending().toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 rounded-lg">
                        <IndianRupee className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Value</p>
                        <p className="font-medium text-gray-800">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(getTotalPendingValue())}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dispatch History Section */}
                {Object.keys(groupedHistory).length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Dispatch History (Bill-wise)
                      </label>
                      <span className="text-xs text-gray-500">
                        {Object.keys(groupedHistory).length} bills
                      </span>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <div className="space-y-2">
                        {Object.values(groupedHistory).map((group, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedBillForDetails(group);
                              setShowBillDetails(true);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-semibold text-indigo-600 text-sm">
                                    #{group.billNumber}
                                  </span>
                                  <span className="text-gray-300">|</span>
                                  <span className="text-xs text-gray-500">
                                    {group.dispatchDate
                                      ? new Date(
                                          group.dispatchDate,
                                        ).toLocaleDateString("en-IN", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "-"}
                                  </span>
                                  {group.transportMode && (
                                    <>
                                      <span className="text-gray-300">|</span>
                                      <span className="text-xs text-gray-500">
                                        🚚 {group.transportMode}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span>
                                    📦 {group.totalItems} item
                                    {group.totalItems > 1 ? "s" : ""}
                                  </span>
                                  <span>📊 {group.totalQuantity} units</span>
                                  {group.receivedBy && (
                                    <span>👤 {group.receivedBy}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-indigo-600 font-medium">
                                  View Details
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Individual Quantities Section */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Set Quantity Per Item
                    </label>
                    <span className="text-xs text-gray-500">
                      Enter quantity for each item below
                    </span>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="space-y-3">
                      {selectedItems.map((item, idx) => {
                        const itemKey = getItemKey(item);
                        const historyCount =
                          dispatchHistory[itemKey]?.length || 0;
                        const individualQty =
                          individualQuantities[itemKey] || "";
                        const maxQty = item.pending || 0;

                        return (
                          <div
                            key={idx}
                            className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:border-purple-200 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              {/* Item Info - Left Side */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="font-mono font-semibold text-gray-600 text-sm">
                                    {item.po}
                                  </span>
                                  <span className="text-gray-300">|</span>
                                  <span className="text-gray-700 text-sm font-medium">
                                    {item.company}
                                  </span>
                                  {historyCount > 0 && (
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                      {historyCount} dispatches
                                    </span>
                                  )}
                                </div>

                                {/* Item Description */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                  <span
                                    className="text-gray-500 truncate max-w-[200px] sm:max-w-[300px]"
                                    title={item.item}
                                  >
                                    📦 {truncateText(item.item, 50)}
                                  </span>
                                  {item.drawing && (
                                    <>
                                      <span className="text-gray-300">|</span>
                                      <span
                                        className="text-gray-500 font-mono"
                                        title={item.drawing}
                                      >
                                        📐 {item.drawing}
                                      </span>
                                    </>
                                  )}
                                  {item.itemCode && (
                                    <>
                                      <span className="text-gray-300">|</span>
                                      <span className="text-gray-400 font-mono text-[10px]">
                                        Code: {item.itemCode}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* Pending Quantity */}
                                <div className="mt-1">
                                  <span className="text-xs text-gray-500">
                                    Pending:{" "}
                                    <span className="font-semibold text-rose-600">
                                      {maxQty}
                                    </span>
                                    {item.poQty && (
                                      <span className="text-gray-400">
                                        {" "}
                                        (Total: {item.poQty})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Quantity Input - Right Side */}
                              <div className="flex items-center gap-2 sm:ml-4">
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  Qty:
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max={maxQty}
                                  value={individualQty}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    handleIndividualQuantityChange(
                                      itemKey,
                                      val,
                                    );
                                  }}
                                  className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Enter qty"
                                />
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                  / {maxQty}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {errors.dispatchQty && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.dispatchQty}
                    </p>
                  )}
                </div>

                {/* Dispatch Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>

                  <div>
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

                  {/* Dispatch Summary */}
                  <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Bulk Dispatch Summary</p>
                        <p className="text-xs text-blue-600">
                          This will dispatch specified quantities across{" "}
                          {selectedItems.length} items.
                          {Object.values(individualQuantities).some(
                            (qty) => Number(qty) > 0,
                          )
                            ? ` Total items with quantity: ${Object.values(individualQuantities).filter((qty) => Number(qty) > 0).length}`
                            : " Please enter quantities for items you want to dispatch."}
                        </p>
                      </div>
                    </div>
                  </div>

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
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Dispatch All
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================
// DISPATCH HISTORY ITEM COMPONENT
// ============================================
const DispatchHistoryItem = ({ entry, index }) => {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-sm border border-gray-100 animate-slideIn">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-sm font-semibold text-gray-800">
            {entry.dispatchQty} units
          </span>
          <span className="text-xs text-gray-500">
            {new Date(entry.dispatchDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          {entry.billNumber && (
            <span className="text-xs text-gray-500">
              Bill: {entry.billNumber}
            </span>
          )}
          {entry.transportMode && (
            <span className="text-xs text-gray-500">
              Mode: {entry.transportMode}
            </span>
          )}
          {entry.isBulkDispatch && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              <Layers className="w-3 h-3" />
              Bulk ({entry.totalItemsDispatched} items)
            </span>
          )}
          {entry.trackingNumber && (
            <span className="text-xs text-gray-500">
              Tracking: {entry.trackingNumber}
            </span>
          )}
        </div>
        {entry.remarks && (
          <p className="mt-1 text-xs text-gray-500">{entry.remarks}</p>
        )}
        {entry.receivedBy && (
          <p className="mt-0.5 text-xs text-gray-400">
            Received by: {entry.receivedBy}
          </p>
        )}
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
  const [errors, setErrors] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("dispatch");

  useEffect(() => {
    if (!isOpen) return undefined;

    setDispatchQty("");
    setDispatchDate(new Date().toISOString().split("T")[0]);
    setBillNumber("");
    setRemarks("");
    setTransportMode("");
    setTrackingNumber("");
    setReceivedBy("");
    setStatus("Partial");
    setErrors({});
    setActiveTab((Number(item?.pending) || 0) > 0 ? "dispatch" : "history");

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, item, onClose]);

  const validate = () => {
    const newErrors = {};
    const quantity = Number(dispatchQty);
    const pending = Number(item?.pending) || 0;

    if (!Number.isFinite(quantity) || quantity <= 0) {
      newErrors.dispatchQty = "Please enter a valid dispatch quantity";
    }
    if (quantity > pending) {
      newErrors.dispatchQty = `Cannot dispatch more than pending quantity (${pending.toLocaleString("en-IN")})`;
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
    const quantity = Number(dispatchQty);
    const currentPending = Number(item?.pending) || 0;
    const newPending = Math.max(0, currentPending - quantity);
    const newDispatched = (Number(item?.dispatched) || 0) + quantity;

    const dispatchEntry = {
      dispatchQty: quantity,
      dispatchDate,
      billNumber: billNumber.trim(),
      remarks: remarks.trim(),
      transportMode: transportMode.trim(),
      trackingNumber: trackingNumber.trim(),
      receivedBy: receivedBy.trim(),
      status: newPending === 0 ? "Completed" : status,
      timestamp: new Date().toISOString(),
      isBulkDispatch: false,
    };

    const updateData = {
      dispatched: newDispatched,
      pending: newPending,
      status: newPending === 0 ? "Completed" : "Partial",
      dispatchEntry,
      lastDispatch: dispatchEntry,
    };

    setTimeout(() => {
      onDispatchUpdate(updateData);
      setIsSubmitting(false);
      onClose();
    }, 350);
  };

  const getMaxDispatch = () => {
    return item?.pending || 0;
  };

  const applyQuickQuantity = (fraction) => {
    const maximum = Number(getMaxDispatch()) || 0;
    const quantity =
      fraction === 1
        ? maximum
        : Math.min(maximum, Math.max(1, Math.ceil(maximum * fraction)));
    setDispatchQty(String(quantity));
    if (errors.dispatchQty) {
      setErrors((current) => ({ ...current, dispatchQty: "" }));
    }
  };

  const getPendingPercentage = () => {
    if (!item) return 0;
    const total = Number(item.poQty) || 0;
    if (total <= 0) return 0;
    return Math.min(
      100,
      Math.max(0, ((Number(item.pending) || 0) / total) * 100),
    );
  };

  const getProgressColor = () => {
    const percentage = getPendingPercentage();
    if (percentage > 50) return "bg-rose-500";
    if (percentage > 25) return "bg-amber-500";
    return "bg-emerald-500";
  };

  if (!isOpen || !item) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto ${isFullscreen ? "p-0" : "p-2 sm:p-4"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispatch-modal-title"
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
          .animate-slideIn {
            animation: slideIn 0.3s ease-out;
          }
          .animate-pulse-slow {
            animation: pulse 2s infinite;
          }
        `}
      </style>

      <div className="flex min-h-screen items-center justify-center">
        <div
          className={`fixed inset-0 transition-all duration-300 ${isOpen ? "bg-slate-950/65 backdrop-blur-sm" : "bg-slate-950/0"}`}
          onClick={onClose}
          aria-hidden="true"
        />

        <div
          className={`relative overflow-hidden bg-white shadow-2xl shadow-slate-950/25 ring-1 ring-white/20 transition-all duration-300 ${
            isFullscreen
              ? "h-full w-full rounded-none"
              : "w-full max-w-5xl rounded-3xl"
          } ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        >
          {/* Modal Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-5 py-4 sm:px-6">
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
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/15">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3
                    id="dispatch-modal-title"
                    className="text-lg font-bold tracking-tight text-white"
                  >
                    Dispatch Management
                  </h3>
                  <p className="text-sm text-blue-100">
                    Update dispatch details for {item?.po || "PO"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="grid h-9 w-9 place-items-center rounded-xl text-white transition hover:bg-white/15"
                  aria-label="Close dispatch dialog"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div
            className={`thin-scrollbar bg-slate-50 ${isFullscreen ? "h-[calc(100vh-72px)] overflow-y-auto" : "max-h-[calc(100vh-7rem)] overflow-y-auto"}`}
          >
            <div className="px-4 py-5 sm:px-6">
              {/* Item Summary */}
              <div className="mb-5 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
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
                      <Building2 className="w-4 h-4 text-purple-600" />
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
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          item?.pending === 0
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item?.pending === 0 ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock3 className="h-3 w-3" />
                        )}
                        {item?.pending === 0 ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-100 rounded-lg">
                      <Clock3 className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pending %</p>
                      <p className="font-medium text-gray-800">
                        {getPendingPercentage().toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{getPendingPercentage().toFixed(1)}% remaining</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
                      style={{
                        width: `${100 - getPendingPercentage()}%`,
                        transition: "width 1s ease-in-out",
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="mb-4 inline-flex rounded-xl bg-slate-200/70 p-1">
                <button
                  onClick={() => setActiveTab("dispatch")}
                  disabled={(Number(item?.pending) || 0) <= 0}
                  className={`relative inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    activeTab === "dispatch"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Truck className="w-4 h-4 inline mr-2" />
                  New Dispatch
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`relative inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "history"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <History className="w-4 h-4 inline mr-2" />
                  History ({dispatchHistory.length})
                  {dispatchHistory.length > 0 && (
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              </div>

              {/* Dispatch History */}
              {activeTab === "history" && (
                <div className="thin-scrollbar mb-6 max-h-[440px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-100/70 p-4">
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
                          step="1"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                          / {getMaxDispatch()}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        {[0.25, 0.5, 1].map((fraction) => (
                          <button
                            key={fraction}
                            type="button"
                            onClick={() => applyQuickQuantity(fraction)}
                            className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-100 transition hover:bg-blue-100"
                          >
                            {fraction === 1 ? "Max" : `${fraction * 100}%`}
                          </button>
                        ))}
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
    const uniquePOs = new Set(this.data.map((item) => item.po).filter(Boolean));
    const uniqueCompanies = new Set(
      this.data.map((item) => item.company).filter(Boolean),
    );
    const uniqueDrawings = new Set(
      this.data.map((item) => item.drawing).filter(Boolean),
    );
    const completedItems = this.data.filter((item) => item.pending <= 0).length;
    const partialItems = this.data.filter(
      (item) => item.pending > 0 && item.dispatched > 0,
    ).length;
    const untouchedItems = this.data.filter(
      (item) => item.pending > 0 && item.dispatched <= 0,
    ).length;
    const highRiskItems = this.data.filter((item) => {
      const total = Number(item.poQty) || 0;
      if (total <= 0) return false;
      const remaining = ((Number(item.pending) || 0) / total) * 100;
      return remaining >= 75;
    }).length;

    return {
      totalPending,
      totalDispatched,
      totalPOQty,
      totalValue,
      totalPOs: uniquePOs.size,
      totalCompanies: uniqueCompanies.size,
      totalDrawings: uniqueDrawings.size,
      totalItems: this.data.length,
      completedItems,
      partialItems,
      untouchedItems,
      highRiskItems,
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
      if (desc.toLowerCase().includes("bus bar")) {
        categories.add("Bus Bars");
      } else if (desc.toLowerCase().includes("heat sink")) {
        categories.add("Heat Sinks");
      } else if (
        desc.toLowerCase().includes("accessory") ||
        desc.toLowerCase().includes("assembly")
      ) {
        categories.add("Accessories");
      } else if (desc.toLowerCase().includes("hardware")) {
        categories.add("Hardware");
      } else if (desc.toLowerCase().includes("plate")) {
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
          return desc.toLowerCase().includes("bus bar");
        if (filters.category === "Heat Sinks")
          return desc.toLowerCase().includes("heat sink");
        if (filters.category === "Accessories")
          return (
            desc.toLowerCase().includes("accessory") ||
            desc.toLowerCase().includes("assembly")
          );
        if (filters.category === "Hardware")
          return desc.toLowerCase().includes("hardware");
        if (filters.category === "Plates")
          return desc.toLowerCase().includes("plate");
        return true;
      });
    }

    if (filters.minPending !== undefined && filters.minPending !== "") {
      filtered = filtered.filter(
        (item) => item.pending >= Number(filters.minPending),
      );
    }

    if (filters.maxPending !== undefined && filters.maxPending !== "") {
      filtered = filtered.filter(
        (item) => item.pending <= Number(filters.maxPending),
      );
    }

    if (
      filters.dateRange &&
      (filters.dateRange.start || filters.dateRange.end)
    ) {
      const start = filters.dateRange.start
        ? new Date(`${filters.dateRange.start}T00:00:00`)
        : new Date(-8640000000000000);
      const end = filters.dateRange.end
        ? new Date(`${filters.dateRange.end}T23:59:59.999`)
        : new Date(8640000000000000);
      filtered = filtered.filter((item) => {
        const date = new Date(item.poDate);
        return !Number.isNaN(date.getTime()) && date >= start && date <= end;
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
// STAT CARD COMPONENT
// ============================================
const StatCard = ({
  label,
  value,
  helper,
  icon: Icon,
  tone = "blue",
  progress,
}) => {
  const tones = {
    blue: {
      icon: "bg-blue-50 text-blue-600 ring-blue-100",
      bar: "bg-gradient-to-r from-blue-500 to-indigo-500",
      glow: "from-blue-500/10",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      bar: "bg-gradient-to-r from-emerald-500 to-teal-500",
      glow: "from-emerald-500/10",
    },
    rose: {
      icon: "bg-rose-50 text-rose-600 ring-rose-100",
      bar: "bg-gradient-to-r from-rose-500 to-orange-400",
      glow: "from-rose-500/10",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600 ring-violet-100",
      bar: "bg-gradient-to-r from-violet-500 to-indigo-500",
      glow: "from-violet-500/10",
    },
  };
  const palette = tones[tone] || tones.blue;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white p-4 shadow-[0_12px_35px_-20px_rgba(30,64,175,0.35)] ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-22px_rgba(30,64,175,0.4)] sm:p-5">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${palette.glow} to-transparent blur-2xl`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${palette.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="relative mt-3">
        <p className="truncate text-xs text-slate-500">{helper}</p>
        {Number.isFinite(progress) && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ${palette.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </article>
  );
};

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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minPending, setMinPending] = useState("");
  const [maxPending, setMaxPending] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [notification, setNotification] = useState(null);
  const [selectedItemForDispatch, setSelectedItemForDispatch] = useState(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isMultipleDispatchModalOpen, setIsMultipleDispatchModalOpen] =
    useState(false);
  const [dispatchHistory, setDispatchHistory] = useState({});
  const [isHovered, setIsHovered] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [isGlobalHistoryOpen, setIsGlobalHistoryOpen] = useState(false);

  const getCategory = (description = "") => {
    const value = String(description).toLowerCase();
    if (value.includes("bus bar")) return "Bus Bars";
    if (value.includes("heat sink")) return "Heat Sinks";
    if (value.includes("accessory") || value.includes("assembly")) {
      return "Accessories";
    }
    if (value.includes("hardware")) return "Hardware";
    if (value.includes("plate")) return "Plates";
    return "Others";
  };

  const filteredManager = useMemo(
    () => (filteredData.length > 0 ? new PendingPOManager(filteredData) : null),
    [filteredData],
  );

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((first, second) => {
      const firstValue = first?.[sortConfig.key];
      const secondValue = second?.[sortConfig.key];
      const firstNumber = Number(firstValue);
      const secondNumber = Number(secondValue);

      let comparison = 0;
      if (
        Number.isFinite(firstNumber) &&
        Number.isFinite(secondNumber) &&
        firstValue !== "" &&
        secondValue !== ""
      ) {
        comparison = firstNumber - secondNumber;
      } else {
        comparison = String(firstValue ?? "").localeCompare(
          String(secondValue ?? ""),
          undefined,
          { numeric: true, sensitivity: "base" },
        );
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const getItemKey = (item) =>
    [item?.company, item?.po, item?.itemCode, item?.drawing, item?.item]
      .filter(Boolean)
      .join("::");

  const selectedRows = useMemo(
    () => data.filter((item) => selectedItems.has(getItemKey(item))),
    [data, selectedItems],
  );

  const companyRanking = useMemo(() => {
    if (!manager) return [];
    return Object.entries(manager.companyStats)
      .map(([company, stats]) => ({ company, ...stats }))
      .sort((a, b) => b.totalPending - a.totalPending)
      .slice(0, 5);
  }, [manager]);

  const activeFilterCount = useMemo(
    () =>
      [
        searchTerm,
        selectedCompany !== "all",
        selectedStatus !== "all",
        selectedCategory !== "all",
        minPending,
        maxPending,
        dateRange.start,
        dateRange.end,
      ].filter(Boolean).length,
    [
      searchTerm,
      selectedCompany,
      selectedStatus,
      selectedCategory,
      minPending,
      maxPending,
      dateRange,
    ],
  );

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  // Parse Excel file
  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          const mappedData = jsonData
            .map((row) => {
              const po = row["PO"] || row["PO Number"] || row["PO #"] || "";
              const poDate =
                row["PO Date"] ||
                row["Date"] ||
                new Date().toISOString().split("T")[0];
              const deliveryDate =
                row["Delivery Date"] || row["Due Date"] || "";
              const drawing = row["Drawing"] || row["Drawing #"] || "";
              const itemCode = row["Item Code"] || row["Code"] || "";
              const item =
                row["Item"] ||
                row["Description"] ||
                row["Item Description"] ||
                "";
              const poQty = Math.max(
                0,
                Number(row["PO Qty"] || row["Quantity"] || 0),
              );
              const dispatched = Math.min(
                poQty,
                Math.max(
                  0,
                  Number(row["Dispatched"] || row["Dispatched Qty"] || 0),
                ),
              );
              const pending = Math.max(0, poQty - dispatched);
              const rate = Math.max(
                0,
                Number(row["Rate"] || row["Unit Price"] || 0),
              );
              const total = pending * rate;
              const company =
                row["Company Name"] || row["Company"] || "Unknown";
              const status = pending > 0 ? "Pending" : "Completed";

              return {
                company: company.toString().trim(),
                po: po.toString().trim(),
                poDate: poDate,
                deliveryDate,
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
            })
            .filter(
              (item) => item.po || item.itemCode || item.drawing || item.item,
            );

          resolve(mappedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () =>
        reject(new Error("The selected file could not be read"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!/\.(xlsx|xls)$/i.test(file.name)) {
        showNotification("Please upload an .xlsx or .xls file", "error");
        event.target.value = "";
        return;
      }

      setIsLoading(true);

      try {
        const parsedData = await parseExcelFile(file);
        if (!parsedData.length) {
          throw new Error("No usable purchase-order rows were found");
        }
        setUploadedFile(file);
        setData(parsedData);
        const newManager = new PendingPOManager(parsedData);
        setManager(newManager);
        setSelectedItems(new Set());
        setDispatchHistory({});
        setSortConfig({ key: null, direction: "asc" });
        setCurrentPage(1);
        clearFilters();

        setCompanies(["all", ...Object.keys(newManager.companyStats)]);
        setCategories(["all", ...newManager.itemCategories]);

        applyFilters(newManager, "all", "", "all", "all", "", "", {
          start: "",
          end: "",
        });

        showNotification(
          `${parsedData.length.toLocaleString("en-IN")} records loaded successfully`,
          "success",
        );
      } catch (error) {
        console.error("Error parsing file:", error);
        showNotification(
          error?.message ||
            "Could not parse the file. Please check its columns.",
          "error",
        );
      }

      setIsLoading(false);
      event.target.value = "";
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
    const timer = window.setTimeout(
      () => setDebouncedSearchTerm(searchTerm.trim()),
      220,
    );
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (manager) {
      applyFilters(
        manager,
        selectedCompany,
        debouncedSearchTerm,
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
    debouncedSearchTerm,
    selectedStatus,
    selectedCategory,
    minPending,
    maxPending,
    dateRange,
    applyFilters,
  ]);

  useEffect(() => {
    if (manager && companies.length === 0) {
      setCompanies(["all", ...Object.keys(manager.companyStats)]);
      setCategories(["all", ...manager.itemCategories]);
    }
  }, [manager, companies.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    selectedCompany,
    selectedStatus,
    selectedCategory,
    minPending,
    maxPending,
    dateRange,
    pageSize,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleDispatchUpdate = (updateData) => {
    // Check if this is a bulk update
    if (updateData.isBulk && updateData.updates) {
      // Bulk update
      const newData = [...data];
      const updates = updateData.updates || [];

      updates.forEach((update) => {
        const itemKey = getItemKey(update.item);
        const index = newData.findIndex(
          (entry) => getItemKey(entry) === itemKey,
        );

        if (index !== -1 && !update.skipped) {
          const updatedItem = {
            ...newData[index],
            dispatched: update.dispatched,
            pending: update.pending,
            status: update.status,
            total: update.pending * (Number(newData[index].rate) || 0),
            lastDispatch: update.dispatchEntry,
          };

          newData[index] = updatedItem;

          // Update dispatch history
          if (update.dispatchEntry) {
            setDispatchHistory((current) => ({
              ...current,
              [itemKey]: [...(current[itemKey] || []), update.dispatchEntry],
            }));
          }
        }
      });

      setData(newData);
      setManager(new PendingPOManager(newData));

      const successCount = updateData.totalProcessed || 0;
      const failCount = updateData.totalFailed || 0;

      let message = `Successfully dispatched ${successCount} items`;
      if (failCount > 0) {
        message += `, ${failCount} item(s) skipped`;
      }
      showNotification(message, successCount > 0 ? "success" : "warning");
    } else if (!updateData.isBulk && updateData.dispatchEntry) {
      // Single item update
      const itemKey = getItemKey(selectedItemForDispatch);
      const index = data.findIndex((entry) => getItemKey(entry) === itemKey);

      if (index !== -1) {
        const updatedItem = {
          ...data[index],
          dispatched: updateData.dispatched,
          pending: updateData.pending,
          status: updateData.status,
          total: updateData.pending * (Number(data[index].rate) || 0),
          lastDispatch: updateData.lastDispatch,
        };

        const newData = [...data];
        newData[index] = updatedItem;
        setData(newData);
        setManager(new PendingPOManager(newData));

        if (updateData.dispatchEntry) {
          setDispatchHistory((current) => ({
            ...current,
            [itemKey]: [...(current[itemKey] || []), updateData.dispatchEntry],
          }));
        }

        showNotification(
          `Dispatch updated successfully! New pending: ${updateData.pending}`,
          "success",
        );
      }
    }
  };

  const openDispatchModal = (item) => {
    const itemKey = getItemKey(item);
    setSelectedItemForDispatch({
      ...item,
      dispatchHistory: dispatchHistory[itemKey] || [],
    });
    setIsDispatchModalOpen(true);
  };

  const openMultipleDispatchModal = () => {
    const itemsToDispatch = data.filter(
      (item) => selectedItems.has(getItemKey(item)) && (item.pending || 0) > 0,
    );

    if (itemsToDispatch.length === 0) {
      showNotification("No selected items with pending quantity", "warning");
      return;
    }

    // Pass the dispatch history for each item
    const itemsWithHistory = itemsToDispatch.map((item) => ({
      ...item,
      dispatchHistory: dispatchHistory[getItemKey(item)] || [],
    }));

    setSelectedItemForDispatch(itemsWithHistory);
    setIsMultipleDispatchModalOpen(true);
  };

  const closeDispatchModal = useCallback(() => {
    setIsDispatchModalOpen(false);
    setIsMultipleDispatchModalOpen(false);
    setSelectedItemForDispatch(null);
  }, []);

  const openGlobalHistory = () => {
    setIsGlobalHistoryOpen(true);
  };

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
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
      if (Number.isNaN(date.getTime())) return String(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getCompletionPercentage = (item) => {
    const total = Number(item?.poQty) || 0;
    if (total <= 0) return 0;
    return Math.min(
      100,
      Math.max(0, ((Number(item?.dispatched) || 0) / total) * 100),
    );
  };

  const getRiskMeta = (item) => {
    if ((Number(item?.pending) || 0) <= 0) {
      return {
        label: "Completed",
        dot: "bg-emerald-500",
        badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      };
    }

    const remaining = 100 - getCompletionPercentage(item);
    if (remaining >= 75) {
      return {
        label: "High pending",
        dot: "bg-rose-500",
        badge: "bg-rose-50 text-rose-700 ring-rose-200",
      };
    }
    if (remaining >= 35) {
      return {
        label: "Needs attention",
        dot: "bg-amber-500",
        badge: "bg-amber-50 text-amber-700 ring-amber-200",
      };
    }
    return {
      label: "Near completion",
      dot: "bg-blue-500",
      badge: "bg-blue-50 text-blue-700 ring-blue-200",
    };
  };

  const clearFilters = () => {
    setSelectedCompany("all");
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedCategory("all");
    setMinPending("");
    setMaxPending("");
    setDateRange({ start: "", end: "" });
  };

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ArrowUpDown;
    return sortConfig.direction === "asc" ? ArrowUp : ArrowDown;
  };

  const renderSortHeader = (label, key, align = "left") => {
    const SortIcon = getSortIcon(key);
    return (
      <button
        type="button"
        onClick={() => handleSort(key)}
        className={`group inline-flex w-full items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 transition hover:text-blue-700 ${
          align === "right" ? "justify-end" : "justify-start"
        }`}
      >
        {label}
        <SortIcon
          className={`h-3 w-3 ${sortConfig.key === key ? "text-blue-600" : "text-slate-300 group-hover:text-blue-500"}`}
        />
      </button>
    );
  };

  const toggleItemSelection = (item) => {
    const itemKey = getItemKey(item);
    setSelectedItems((current) => {
      const next = new Set(current);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const togglePageSelection = () => {
    const pageKeys = paginatedData.map(getItemKey);
    const allSelected =
      pageKeys.length > 0 && pageKeys.every((key) => selectedItems.has(key));

    setSelectedItems((current) => {
      const next = new Set(current);
      pageKeys.forEach((key) => {
        if (allSelected) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  const exportRows = (rows, label = "filtered") => {
    if (!rows.length) {
      showNotification("No records available to export", "warning");
      return;
    }

    const exportData = rows.map((item) => ({
      Company: item.company,
      "PO Number": item.po,
      "PO Date": item.poDate,
      "Delivery Date": item.deliveryDate || "",
      Drawing: item.drawing,
      "Item Code": item.itemCode,
      "Item Description": item.item,
      "PO Quantity": item.poQty,
      Dispatched: item.dispatched,
      Pending: item.pending,
      "Completion %": Number(getCompletionPercentage(item).toFixed(1)),
      Status: item.status,
      "Unit Rate": item.rate,
      "Pending Value": item.total,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 16 },
      { wch: 13 },
      { wch: 13 },
      { wch: 18 },
      { wch: 16 },
      { wch: 36 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 12 },
      { wch: 16 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pending PO");
    const stamp = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `pending-po-${label}-${stamp}.xlsx`);
    showNotification(`${rows.length} records exported`, "success");
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      [
        "Company Name",
        "PO Number",
        "PO Date",
        "Delivery Date",
        "Drawing",
        "Item Code",
        "Item Description",
        "PO Qty",
        "Dispatched Qty",
        "Rate",
      ],
    ]);
    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 16 },
      { wch: 13 },
      { wch: 13 },
      { wch: 18 },
      { wch: 16 },
      { wch: 36 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PO Import");
    XLSX.writeFile(workbook, "pending-po-import-template.xlsx");
    showNotification("Blank import template downloaded", "success");
  };

  const handlePrint = () => window.print();

  // Render notification
  const renderNotification = () => {
    if (!notification) return null;

    const variants = {
      success: {
        classes: "border-emerald-200 bg-white text-emerald-800",
        icon: CheckCircle2,
        iconClasses: "bg-emerald-50 text-emerald-600",
      },
      error: {
        classes: "border-rose-200 bg-white text-rose-800",
        icon: CircleAlert,
        iconClasses: "bg-rose-50 text-rose-600",
      },
      warning: {
        classes: "border-amber-200 bg-white text-amber-800",
        icon: AlertCircle,
        iconClasses: "bg-amber-50 text-amber-600",
      },
      info: {
        classes: "border-blue-200 bg-white text-blue-800",
        icon: Activity,
        iconClasses: "bg-blue-50 text-blue-600",
      },
    };
    const variant = variants[notification.type] || variants.info;
    const NotificationIcon = variant.icon;

    return (
      <div
        className={`fixed right-4 top-4 z-[70] flex max-w-sm items-center gap-3 rounded-2xl border p-3 pr-4 shadow-2xl shadow-slate-900/10 ${variant.classes} animate-slideIn`}
        role="status"
      >
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${variant.iconClasses}`}
        >
          <NotificationIcon className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium">{notification.message}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/70 to-indigo-50 p-3 text-slate-900 sm:p-5 lg:p-6">
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
          .premium-grid {
            background-image:
              linear-gradient(rgba(255,255,255,.075) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.075) 1px, transparent 1px);
            background-size: 28px 28px;
          }
          .thin-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
          .thin-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
          .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
          @media (prefers-reduced-motion: reduce) {
            .animate-slideIn, .animate-fadeInUp, .animate-pulse-slow {
              animation: none !important;
            }
          }
          @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
            .print-card { box-shadow: none !important; break-inside: avoid; }
            .print-table { overflow: visible !important; }
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

      {/* Multiple Dispatch Modal */}
      <MultipleDispatchModal
        isOpen={isMultipleDispatchModalOpen}
        onClose={closeDispatchModal}
        selectedItems={selectedItemForDispatch || []}
        onDispatchUpdate={handleDispatchUpdate}
        dispatchHistory={dispatchHistory}
      />

      {/* Global Dispatch History Modal */}
      <GlobalDispatchHistoryModal
        isOpen={isGlobalHistoryOpen}
        onClose={() => setIsGlobalHistoryOpen(false)}
        dispatchHistory={dispatchHistory}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <header className=" relative rounded-2xl shadow-lg mb-8 overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 animate-fadeInUp sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/15 shadow-inner backdrop-blur-sm sm:h-14 sm:w-14">
                <LayoutDashboard className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center  gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                    <Sparkles className="h-3 w-3" /> Operations workspace
                  </span>
                </div>
                <h1 className="truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Pending PO
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-white">
                  Track commitments, prioritize pending quantities, and record
                  every dispatch from one responsive workspace.
                </p>
              </div>
            </div>

            <div className="no-print flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                <Upload className="h-4 w-4" />
                {uploadedFile ? "Replace Excel" : "Upload Excel"}
              </label>

              {uploadedFile && (
                <>
                  {/* View Dispatch History Button */}
                  <button
                    type="button"
                    onClick={openGlobalHistory}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <History className="h-4 w-4" />
                    View History
                  </button>

                  <button
                    type="button"
                    onClick={() => exportRows(filteredData, "filtered")}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </>
              )}
            </div>
          </div>

          {uploadedFile && (
            <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-white/15 bg-slate-950/10 px-4 py-3 text-xs text-blue-50 backdrop-blur-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                <span className="max-w-[280px] truncate">
                  {uploadedFile.name}
                </span>
              </span>
              <span>{(uploadedFile.size / 1024).toFixed(1)} KB</span>
              <span>{manager?.summary.totalPOs || 0} purchase orders</span>
              <span>{manager?.summary.totalCompanies || 0} companies</span>
              <span className="ml-auto flex items-center gap-1.5 text-blue-100">
                <ShieldCheck className="h-3.5 w-3.5" /> Parsed and ready
              </span>
            </div>
          )}
        </header>

        {/* Executive summary */}
        {data.length > 0 && manager && (
          <section className="mb-5 animate-fadeInUp">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                  Portfolio snapshot
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                  Dispatch performance at a glance
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAnalytics((current) => !current)}
                className="no-print inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
              >
                {showAnalytics ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {showAnalytics ? "Hide insights" : "Show insights"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="Pending quantity"
                value={manager.summary.totalPending.toLocaleString("en-IN")}
                helper={`${manager.summary.pendingPercentage.toFixed(1)}% of ordered quantity remains`}
                icon={Clock3}
                tone="rose"
                progress={manager.summary.pendingPercentage}
              />
              <StatCard
                label="Dispatched quantity"
                value={manager.summary.totalDispatched.toLocaleString("en-IN")}
                helper={`${manager.summary.dispatchedPercentage.toFixed(1)}% fulfilment across all POs`}
                icon={CircleCheckBig}
                tone="emerald"
                progress={manager.summary.dispatchedPercentage}
              />

              <StatCard
                label="Active portfolio"
                value={`${manager.summary.totalCompanies} companies`}
                helper={`${manager.summary.totalDrawings} drawings · ${manager.summary.totalItems} line items`}
                icon={Building2}
                tone="blue"
              />
            </div>

            {showAnalytics && (
              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
                <article className="print-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_-25px_rgba(15,23,42,0.35)] xl:col-span-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Fulfilment overview
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Quantity-weighted progress
                      </p>
                    </div>
                    <Gauge className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="mt-5 flex items-center gap-6">
                    <div
                      className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full"
                      style={{
                        background: `conic-gradient(#2563eb ${manager.summary.dispatchedPercentage}%, #e2e8f0 0)`,
                      }}
                    >
                      <div className="grid h-[82px] w-[82px] place-items-center rounded-full bg-white shadow-inner">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-slate-900">
                            {manager.summary.dispatchedPercentage.toFixed(0)}%
                          </p>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            complete
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      {[
                        [
                          "Completed",
                          manager.summary.completedItems,
                          "bg-emerald-500",
                        ],
                        [
                          "In progress",
                          manager.summary.partialItems,
                          "bg-blue-500",
                        ],
                        [
                          "Not started",
                          manager.summary.untouchedItems,
                          "bg-rose-500",
                        ],
                      ].map(([label, value, color]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="flex items-center gap-2 text-slate-500">
                            <span className={`h-2 w-2 rounded-full ${color}`} />
                            {label}
                          </span>
                          <span className="font-bold text-slate-800">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>

                <article className="print-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_-25px_rgba(15,23,42,0.35)] xl:col-span-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Company workload
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Highest pending quantity first
                      </p>
                    </div>
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="mt-4 space-y-3.5">
                    {companyRanking.map((company) => {
                      const maxPending = Math.max(
                        1,
                        ...companyRanking.map((entry) => entry.totalPending),
                      );
                      return (
                        <div key={company.company}>
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                            <span className="truncate font-medium text-slate-700">
                              {company.company}
                            </span>
                            <span className="shrink-0 font-bold text-slate-900">
                              {company.totalPending.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                              style={{
                                width: `${(company.totalPending / maxPending) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              </div>
            )}
          </section>
        )}

        {/* Filters Section */}
        {data.length > 0 && (
          <section className="no-print mb-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_40px_-25px_rgba(15,23,42,0.35)] animate-fadeInUp">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Filters
                    </h3>
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {activeFilterCount} active
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    Clear filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFilters((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {showFilters ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  {showFilters ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                  <div className="sm:col-span-2 xl:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Search records
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        placeholder="PO, drawing, code, description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 pl-9 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  <div className="xl:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Company
                    </label>
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    >
                      {companies.map((company) => (
                        <option key={company} value={company}>
                          {company === "all" ? "All companies" : company}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category === "all" ? "All categories" : category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Min pending
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minPending}
                      onChange={(e) => setMinPending(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Max pending
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={maxPending}
                      onChange={(e) => setMaxPending(e.target.value)}
                      placeholder="Any"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div className="sm:col-span-1 xl:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      PO date from
                    </label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange((current) => ({
                          ...current,
                          start: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div className="sm:col-span-1 xl:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      PO date to
                    </label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange((current) => ({
                          ...current,
                          end: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Main Data Table */}
        {isLoading ? (
          <div className="rounded-3xl border border-blue-100 bg-white p-12 text-center shadow-xl shadow-blue-900/5">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50">
              <RefreshCw className="h-7 w-7 animate-spin text-blue-600" />
            </div>
            <p className="mt-5 font-semibold text-slate-800">
              Building your PO workspace
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Reading, validating, and organizing the Excel records...
            </p>
          </div>
        ) : data.length > 0 ? (
          <section className="print-card overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] animate-fadeInUp">
            {/* View Mode Selector */}
            <div className="no-print flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Purchase order
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {filteredData.length.toLocaleString("en-IN")} of{" "}
                    {data.length.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Select records, sort columns, or open an item to record
                  dispatch
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedRows.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                      <Check className="h-3.5 w-3.5" />
                      {selectedRows.length} selected
                      <button
                        type="button"
                        onClick={() => exportRows(selectedRows, "selected")}
                        className="ml-1 inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] shadow-sm transition hover:text-blue-900"
                      >
                        <FileDown className="h-3 w-3" /> Export
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedItems(new Set())}
                        className="rounded-md p-1 transition hover:bg-white"
                        aria-label="Clear selected records"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Multiple Dispatch Button */}
                    <button
                      type="button"
                      onClick={openMultipleDispatchModal}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-purple-700"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      Dispatch Selected
                    </button>
                  </>
                )}

                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      viewMode === "table"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Table2 className="h-3.5 w-3.5" /> Table
                  </button>
                </div>
              </div>
            </div>

            {/* Table View */}
            {viewMode === "table" && (
              <div className="bg-white border border-gray-300 overflow-auto">
                <table className="w-full border-collapse text-sm text-center">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={
                            paginatedData.length > 0 &&
                            paginatedData.every((item) =>
                              selectedItems.has(getItemKey(item)),
                            )
                          }
                          onChange={togglePageSelection}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                          aria-label="Select all records on this page"
                        />
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                        {renderSortHeader("Company", "company")}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                        {renderSortHeader("PO details", "po")}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                        {renderSortHeader("Item / drawing", "item")}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                        {renderSortHeader("Progress", "pending")}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                        {renderSortHeader("PO qty", "poQty", "right")}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                        {renderSortHeader("Dispatched", "dispatched", "right")}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                        {renderSortHeader("Pending", "pending", "right")}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                        {renderSortHeader("Unit rate", "rate", "right")}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                        {renderSortHeader("Pending value", "total", "right")}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                        Priority
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedData.map((item, index) => {
                      const itemKey = getItemKey(item);
                      const historyCount =
                        dispatchHistory[itemKey]?.length || 0;
                      const isItemHovered = isHovered === itemKey;
                      const completion = getCompletionPercentage(item);
                      const risk = getRiskMeta(item);
                      const isSelected = selectedItems.has(itemKey);

                      return (
                        <tr
                          key={itemKey}
                          className={`hover:bg-blue-50 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                          onMouseEnter={() => setIsHovered(itemKey)}
                          onMouseLeave={() => setIsHovered(null)}
                        >
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItemSelection(item)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                              aria-label={`Select ${item.po} ${item.item}`}
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                                {(item.company || "?").charAt(0).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p
                                  className="max-w-[145px] truncate text-sm font-semibold text-slate-800"
                                  title={item.company}
                                >
                                  {item.company || "Unknown"}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {getCategory(item.item)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <p className="font-mono text-sm font-semibold text-slate-800">
                              {item.po || "—"}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(item.poDate)}
                            </p>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <p
                              className="max-w-[240px] truncate text-sm font-medium text-slate-800"
                              title={item.item}
                            >
                              {item.item || "Unnamed item"}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                              <span>{item.itemCode || "No code"}</span>
                              <span className="h-1 w-1 rounded-full bg-slate-300" />
                              <span>{item.drawing || "No drawing"}</span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <div className="mb-1.5 flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-slate-600">
                                {completion.toFixed(0)}%
                              </span>
                              <span className="text-slate-400">fulfilled</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                style={{ width: `${completion}%` }}
                              />
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            {Number(item.poQty || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            {Number(item.dispatched || 0).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                          <td
                            className={`border border-gray-300 px-3 py-2 align-middle text-center ${item.pending > 0 ? "text-rose-600" : "text-emerald-600"}`}
                          >
                            {Number(item.pending || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            {formatCurrency(item.rate)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${risk.badge}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${risk.dot}`}
                              />
                              {risk.label}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <button
                              onClick={() => openDispatchModal(item)}
                              className={`relative mx-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                isItemHovered
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              }`}
                              title={
                                item.pending > 0
                                  ? "Record dispatch"
                                  : "View dispatch history"
                              }
                            >
                              {item.pending > 0 ? (
                                <Truck className="h-3.5 w-3.5" />
                              ) : (
                                <History className="h-3.5 w-3.5" />
                              )}
                              {item.pending > 0 ? "Dispatch" : "Review"}
                              {historyCount > 0 && (
                                <span
                                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] ${isItemHovered ? "bg-white/20" : "bg-blue-200 text-blue-800"}`}
                                >
                                  {historyCount}
                                </span>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedData.length === 0 && (
                      <tr>
                        <td colSpan="12" className="px-6 py-16 text-center">
                          <Search className="mx-auto h-8 w-8 text-slate-300" />
                          <p className="mt-3 text-sm font-semibold text-slate-700">
                            No records match these filters
                          </p>
                          <button
                            type="button"
                            onClick={clearFilters}
                            className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Clear all filters
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span>
                  Showing{" "}
                  <strong className="text-slate-800">
                    {sortedData.length === 0
                      ? 0
                      : (currentPage - 1) * pageSize + 1}
                    –{Math.min(currentPage * pageSize, sortedData.length)}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-slate-800">
                    {sortedData.length}
                  </strong>
                </span>
                {filteredManager && (
                  <>
                    <span>
                      Pending{" "}
                      <strong className="text-rose-600">
                        {filteredManager.summary.totalPending.toLocaleString(
                          "en-IN",
                        )}
                      </strong>
                    </span>
                    <span>
                      Outstanding{" "}
                      <strong className="text-slate-800">
                        {formatCurrency(filteredManager.summary.totalValue)}
                      </strong>
                    </span>
                  </>
                )}
              </div>

              <div className="no-print flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  Rows
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                  >
                    {[10, 15, 25, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="ml-1 flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="First page"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[76px] px-2 text-center text-xs font-semibold text-slate-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Last page"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white px-5 py-14 text-center shadow-[0_24px_70px_-40px_rgba(30,64,175,0.5)] animate-fadeInUp sm:py-20">
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-blue-100/80 blur-3xl" />
            <div className="relative mx-auto max-w-xl">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/25">
                <FileSpreadsheet className="h-9 w-9" />
              </div>
              
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Start with your source file
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Turn your pending PO sheet into an operating dashboard
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                Upload an Excel file and the workspace will organize quantities,
                company workload, progress, and dispatch history.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
                <label
                  htmlFor="file-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Upload className="h-4 w-4" />
                  Choose Excel file
                </label>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                >
                  <FileDown className="h-4 w-4" />
                  Download template
                </button>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> .xlsx and
                  .xls
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> No data
                  leaves this screen
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Instant
                  analytics
                </span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default GeneratePendingList;
