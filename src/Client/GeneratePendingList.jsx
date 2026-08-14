import React from "react";
import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useTransition,
} from "react";
import * as XLSX from "xlsx";
import {
  createDispatchRequestId,
  getApiErrorMessage,
  pendingPoApi,
} from "./pendingPoApi.js";
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
  ChevronDown,
  ChevronUp,
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
  History,
  IndianRupee,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  Package,
  RefreshCw,
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
  Pencil,
  Trash2,
} from "lucide-react";

// ============================================
// DISPATCH HISTORY BILL DETAILS COMPONENT
// ============================================
const DispatchBillDetails = React.memo(function DispatchBillDetails({
  billNumber,
  entries,
  onClose,
  onEditDispatch,
  onDeleteDispatch,
}) {
  const totalItems = entries.length;
  const totalQuantity = entries.reduce(
    (sum, entry) => sum + (entry.dispatchQty || 0),
    0,
  );
  const dispatchDate = entries[0]?.dispatchDate;
  const transportMode = entries[0]?.transportMode;
  const remarks = entries[0]?.remarks;
  const receivedBy = entries[0]?.receivedBy;

  const handleEdit = useCallback(
    (entry) => {
      onEditDispatch?.(entry, billNumber);
    },
    [onEditDispatch, billNumber],
  );

  const handleDelete = useCallback(
    (dispatchId, poId) => {
      if (!dispatchId) return;
      if (
        window.confirm("Are you sure you want to delete this dispatch entry?")
      ) {
        onDeleteDispatch?.(dispatchId, poId);
      }
    },
    [onDeleteDispatch],
  );

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
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry, idx) => (
                  <tr
                    key={entry.po + idx}
                    className="hover:bg-blue-50 transition"
                  >
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
                      {entry.newPending ?? entry.pending ?? 0}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit dispatch"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const dispatchId = entry._id || entry.id;
                            const poId = entry.poId;
                            if (dispatchId && poId) {
                              handleDelete(dispatchId, poId);
                            }
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                          title="Delete dispatch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
});

// ============================================
// GLOBAL DISPATCH HISTORY MODAL
// ============================================
const GlobalDispatchHistoryModal = React.memo(
  function GlobalDispatchHistoryModal({
    isOpen,
    onClose,
    dispatchHistory,
    formatDate,
    onDispatchEdit,
    onDispatchDelete,
  }) {
    const [selectedBill, setSelectedBill] = useState(null);
    const [showBillDetails, setShowBillDetails] = useState(false);

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
            poId: entry.poId || entry.poId,
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

    const handleEditDispatch = useCallback(
      (entry, billNumber) => {
        setShowBillDetails(false);
        setSelectedBill(null);
        onDispatchEdit?.(entry, billNumber);
      },
      [onDispatchEdit],
    );

    const handleDeleteDispatch = useCallback(
      async (dispatchId, poId) => {
        if (!dispatchId) return;
        try {
          await onDispatchDelete?.({ dispatchId, poId });
          setShowBillDetails(false);
          setSelectedBill(null);
        } catch (error) {
          console.error("Failed to delete dispatch:", error);
        }
      },
      [onDispatchDelete],
    );

    if (!isOpen) return null;

    return (
      <>
        {showBillDetails && selectedBill && (
          <DispatchBillDetails
            billNumber={selectedBill.billNumber}
            entries={selectedBill.entries}
            onClose={() => {
              setShowBillDetails(false);
              setSelectedBill(null);
            }}
            onEditDispatch={handleEditDispatch}
            onDeleteDispatch={handleDeleteDispatch}
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
                      {allBills.map((bill) => (
                        <div
                          key={bill.billNumber}
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
  },
);

// ============================================
// MULTIPLE DISPATCH MODAL COMPONENT
// ============================================
const MultipleDispatchModal = React.memo(function MultipleDispatchModal({
  isOpen,
  onClose,
  selectedItems = [],
  onDispatchUpdate,
  dispatchHistory = {},
}) {
  const [individualQuantities, setIndividualQuantities] = useState({});
  const [dispatchDate, setDispatchDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [billNumber, setBillNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [transportMode, setTransportMode] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
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

  const getItemKey = useCallback(
    (item) =>
      String(
        item?._id ||
          [item?.company, item?.po, item?.itemCode, item?.drawing, item?.item]
            .filter(Boolean)
            .join("::"),
      ),
    [],
  );

  const getTotalPending = useCallback(() => {
    return selectedItems.reduce((sum, item) => sum + (item.pending || 0), 0);
  }, [selectedItems]);

  const getTotalPendingValue = useCallback(() => {
    return selectedItems.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [selectedItems]);

  const validate = useCallback(() => {
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
  }, [
    selectedItems,
    individualQuantities,
    dispatchDate,
    billNumber,
    getItemKey,
  ]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validate()) return;

      setIsSubmitting(true);
      setErrors((current) => ({ ...current, form: "" }));

      try {
        const items = selectedItems
          .map((item) => ({
            poId: item._id,
            dispatchQty: Number(individualQuantities[getItemKey(item)]) || 0,
          }))
          .filter((item) => item.dispatchQty > 0);

        await onDispatchUpdate({
          isBulk: true,
          requestId: createDispatchRequestId(),
          items,
          dispatchDate,
          billNumber: billNumber.trim(),
          remarks: remarks.trim(),
          transportMode: transportMode.trim(),
          trackingNumber: trackingNumber.trim(),
          receivedBy: receivedBy.trim(),
        });
        onClose();
      } catch (error) {
        setErrors((current) => ({
          ...current,
          form: getApiErrorMessage(error, "Bulk dispatch could not be saved"),
        }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      validate,
      selectedItems,
      individualQuantities,
      getItemKey,
      onDispatchUpdate,
      dispatchDate,
      billNumber,
      remarks,
      transportMode,
      trackingNumber,
      receivedBy,
      onClose,
    ],
  );

  const handleIndividualQuantityChange = useCallback(
    (itemKey, value) => {
      setIndividualQuantities((prev) => ({
        ...prev,
        [itemKey]: value,
      }));
      if (errors.dispatchQty) {
        setErrors((current) => ({ ...current, dispatchQty: "" }));
      }
    },
    [errors.dispatchQty],
  );

  const truncateText = useCallback((text, maxLength = 60) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }, []);

  if (!isOpen || selectedItems.length === 0) return null;

  return (
    <>
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
                        {Object.values(groupedHistory).map((group) => (
                          <div
                            key={group.billNumber}
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
                      {selectedItems.map((item) => {
                        const itemKey = getItemKey(item);
                        const historyCount =
                          dispatchHistory[itemKey]?.length || 0;
                        const individualQty =
                          individualQuantities[itemKey] || "";
                        const maxQty = item.pending || 0;

                        return (
                          <div
                            key={itemKey}
                            className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:border-purple-200 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  {errors.form && (
                    <div
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                      role="alert"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errors.form}</span>
                    </div>
                  )}
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
});

// ============================================
// DISPATCH HISTORY ITEM COMPONENT
// ============================================
const DispatchHistoryItem = React.memo(function DispatchHistoryItem({
  entry,
  index,
  onEdit,
  onDelete,
  isEditable = false,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!showDeleteConfirm) {
        setShowDeleteConfirm(true);
        return;
      }
      onDelete?.(entry._id || entry.id);
      setShowDeleteConfirm(false);
    },
    [showDeleteConfirm, onDelete, entry],
  );

  const handleEditClick = useCallback(
    (e) => {
      e.stopPropagation();
      onEdit?.(entry);
    },
    [onEdit, entry],
  );

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
      {isEditable && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleEditClick}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Edit dispatch"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDeleteClick}
            className={`p-1.5 rounded-lg transition ${
              showDeleteConfirm
                ? "text-white bg-red-600 hover:bg-red-700"
                : "text-red-500 hover:bg-red-50"
            }`}
            title={showDeleteConfirm ? "Confirm delete" : "Delete dispatch"}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {showDeleteConfirm && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(false);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition text-xs"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================
// DISPATCH MODAL COMPONENT (with Edit/Delete)
// ============================================
const DispatchModal = React.memo(function DispatchModal({
  isOpen,
  onClose,
  item,
  onDispatchUpdate,
  onDispatchEdit,
  onDispatchDelete,
  dispatchHistory = [],
}) {
  const [dispatchQty, setDispatchQty] = useState("");
  const [dispatchDate, setDispatchDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [billNumber, setBillNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [transportMode, setTransportMode] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("dispatch");
  const [isEditingDispatch, setIsEditingDispatch] = useState(false);
  const [editingDispatchEntry, setEditingDispatchEntry] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    setDispatchQty("");
    setDispatchDate(new Date().toISOString().split("T")[0]);
    setBillNumber("");
    setRemarks("");
    setTransportMode("");
    setTrackingNumber("");
    setReceivedBy("");
    setErrors({});
    setActiveTab((Number(item?.pending) || 0) > 0 ? "dispatch" : "history");
    setIsEditingDispatch(false);
    setEditingDispatchEntry(null);

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

  const getMaxDispatch = useCallback(() => {
    return item?.pending || 0;
  }, [item]);

  const validate = useCallback(() => {
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
  }, [dispatchQty, item, dispatchDate, billNumber]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validate()) return;

      setIsSubmitting(true);
      const quantity = Number(dispatchQty);
      setErrors((current) => ({ ...current, form: "" }));

      try {
        await onDispatchUpdate({
          isBulk: false,
          requestId: createDispatchRequestId(),
          poId: item._id,
          dispatchQty: quantity,
          dispatchDate,
          billNumber: billNumber.trim(),
          remarks: remarks.trim(),
          transportMode: transportMode.trim(),
          trackingNumber: trackingNumber.trim(),
          receivedBy: receivedBy.trim(),
        });
        onClose();
      } catch (error) {
        setErrors((current) => ({
          ...current,
          form: getApiErrorMessage(error, "Dispatch could not be saved"),
        }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      validate,
      dispatchQty,
      dispatchDate,
      billNumber,
      remarks,
      transportMode,
      trackingNumber,
      receivedBy,
      onDispatchUpdate,
      item,
      onClose,
    ],
  );

  const applyQuickQuantity = useCallback(
    (fraction) => {
      const maximum = Number(getMaxDispatch()) || 0;
      const quantity =
        fraction === 1
          ? maximum
          : Math.min(maximum, Math.max(1, Math.ceil(maximum * fraction)));
      setDispatchQty(String(quantity));
      if (errors.dispatchQty) {
        setErrors((current) => ({ ...current, dispatchQty: "" }));
      }
    },
    [getMaxDispatch, errors.dispatchQty],
  );

  const getPendingPercentage = useCallback(() => {
    if (!item) return 0;
    const total = Number(item.poQty) || 0;
    if (total <= 0) return 0;
    return Math.min(
      100,
      Math.max(0, ((Number(item.pending) || 0) / total) * 100),
    );
  }, [item]);

  const getProgressColor = useCallback(() => {
    const percentage = getPendingPercentage();
    if (percentage > 50) return "bg-rose-500";
    if (percentage > 25) return "bg-amber-500";
    return "bg-emerald-500";
  }, [getPendingPercentage]);

  const handleEditDispatch = useCallback((entry) => {
    setEditingDispatchEntry(entry);
    setIsEditingDispatch(true);
    setDispatchQty(String(entry.dispatchQty || 0));
    setDispatchDate(
      entry.dispatchDate
        ? entry.dispatchDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
    );
    setBillNumber(entry.billNumber || "");
    setRemarks(entry.remarks || "");
    setTransportMode(entry.transportMode || "");
    setTrackingNumber(entry.trackingNumber || "");
    setReceivedBy(entry.receivedBy || "");
    setActiveTab("dispatch");
  }, []);

  const handleUpdateDispatch = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validate()) return;

      setIsSubmitting(true);
      setErrors((current) => ({ ...current, form: "" }));

      try {
        await onDispatchEdit?.({
          dispatchId: editingDispatchEntry._id || editingDispatchEntry.id,
          poId: item._id,
          dispatchQty: Number(dispatchQty),
          dispatchDate,
          billNumber: billNumber.trim(),
          remarks: remarks.trim(),
          transportMode: transportMode.trim(),
          trackingNumber: trackingNumber.trim(),
          receivedBy: receivedBy.trim(),
        });
        setIsEditingDispatch(false);
        setEditingDispatchEntry(null);
        onClose();
      } catch (error) {
        setErrors((current) => ({
          ...current,
          form: getApiErrorMessage(error, "Dispatch update failed"),
        }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      validate,
      dispatchQty,
      dispatchDate,
      billNumber,
      remarks,
      transportMode,
      trackingNumber,
      receivedBy,
      onDispatchEdit,
      item,
      editingDispatchEntry,
      onClose,
    ],
  );

  const handleDeleteDispatch = useCallback(
    async (dispatchId) => {
      try {
        await onDispatchDelete?.({
          dispatchId,
          poId: item._id,
        });
        onClose();
      } catch (error) {
        setErrors((current) => ({
          ...current,
          form: getApiErrorMessage(error, "Delete failed"),
        }));
      }
    },
    [onDispatchDelete, item, onClose],
  );

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
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .animate-slideIn { animation: slideIn 0.3s ease-out; }
          .animate-pulse-slow { animation: pulse 2s infinite; }
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
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-5 py-4 sm:px-6">
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
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3
                    id="dispatch-modal-title"
                    className="text-lg font-bold tracking-tight text-white"
                  >
                    {isEditingDispatch
                      ? "Edit Dispatch"
                      : "Dispatch Management"}
                  </h3>
                  <p className="text-sm text-blue-100">
                    {isEditingDispatch
                      ? `Editing dispatch for ${item?.po || "PO"}`
                      : `Update dispatch details for ${item?.po || "PO"}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFullscreen((current) => !current)}
                  className="grid h-9 w-9 place-items-center rounded-xl text-white transition hover:bg-white/15"
                  aria-label={
                    isFullscreen ? "Exit fullscreen" : "Open fullscreen"
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </button>
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
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4 inline-flex rounded-xl bg-slate-200/70 p-1">
                <button
                  onClick={() => {
                    setActiveTab("dispatch");
                    setIsEditingDispatch(false);
                    setEditingDispatchEntry(null);
                    setDispatchQty("");
                    setDispatchDate(new Date().toISOString().split("T")[0]);
                    setBillNumber("");
                    setRemarks("");
                    setTransportMode("");
                    setTrackingNumber("");
                    setReceivedBy("");
                  }}
                  disabled={
                    (Number(item?.pending) || 0) <= 0 && !isEditingDispatch
                  }
                  className={`relative inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    activeTab === "dispatch"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Truck className="w-4 h-4 inline mr-2" />
                  {isEditingDispatch ? "Edit Dispatch" : "New Dispatch"}
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

              {activeTab === "history" && (
                <div className="thin-scrollbar mb-6 max-h-[440px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-100/70 p-4">
                  {dispatchHistory && dispatchHistory.length > 0 ? (
                    <div className="space-y-3">
                      {dispatchHistory.map((entry, index) => (
                        <DispatchHistoryItem
                          key={entry._id || index}
                          entry={entry}
                          index={index}
                          isEditable={true}
                          onEdit={handleEditDispatch}
                          onDelete={handleDeleteDispatch}
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

              {activeTab === "dispatch" && (
                <form
                  onSubmit={
                    isEditingDispatch ? handleUpdateDispatch : handleSubmit
                  }
                  className="space-y-4"
                >
                  {errors.form && (
                    <div
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                      role="alert"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errors.form}</span>
                    </div>
                  )}
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
                    {isEditingDispatch && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingDispatch(false);
                          setEditingDispatchEntry(null);
                          setDispatchQty("");
                          setDispatchDate(
                            new Date().toISOString().split("T")[0],
                          );
                          setBillNumber("");
                          setRemarks("");
                          setTransportMode("");
                          setTrackingNumber("");
                          setReceivedBy("");
                          setActiveTab("history");
                        }}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                      >
                        Cancel Edit
                      </button>
                    )}
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
                          {isEditingDispatch
                            ? "Update Dispatch"
                            : "Confirm Dispatch"}
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
});

// ============================================
// EDIT/DELETE PO MODAL COMPONENT
// ============================================
// ============================================
// EDIT/DELETE PO MODAL COMPONENT - FIXED
// ============================================
const EditDeleteModal = React.memo(function EditDeleteModal({
  isOpen,
  onClose,
  item,
  onUpdate,
  onDelete,
  formatDate,
}) {
  // ✅ ALL HOOKS MUST BE AT THE TOP LEVEL - BEFORE ANY CONDITIONAL RETURNS
  const [formData, setFormData] = useState({
    po: "",
    poDate: "",
    deliveryDate: "",
    company: "",
    item: "",
    itemCode: "",
    drawing: "",
    poQty: "",
    rate: "",
    total: "",
    status: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ✅ useEffect must be at top level
  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        po: item.po || "",
        poDate: item.poDate ? item.poDate.split("T")[0] : "",
        deliveryDate: item.deliveryDate ? item.deliveryDate.split("T")[0] : "",
        company: item.company || "",
        item: item.item || "",
        itemCode: item.itemCode || "",
        drawing: item.drawing || "",
        poQty: item.poQty || "",
        rate: item.rate || "",
        total: item.total || "",
        status: item.status || "Pending",
      });
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [item, isOpen]);

  // ✅ useCallback hooks must be at top level
  const handleChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors],
  );

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.po.trim()) newErrors.po = "PO number is required";
    if (!formData.company.trim()) newErrors.company = "Company is required";
    if (!formData.item.trim()) newErrors.item = "Item description is required";
    if (!formData.poQty || Number(formData.poQty) <= 0) {
      newErrors.poQty = "PO quantity must be greater than 0";
    }
    if (!formData.rate || Number(formData.rate) <= 0) {
      newErrors.rate = "Rate must be greater than 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validate()) return;

      setIsSubmitting(true);
      try {
        const updateData = {
          ...formData,
          poQty: Number(formData.poQty),
          rate: Number(formData.rate),
          total: Number(formData.poQty) * Number(formData.rate),
        };
        await onUpdate(item._id, updateData);
        onClose();
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          form: getApiErrorMessage(error, "Update failed"),
        }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validate, onUpdate, item, onClose],
  );

  const handleDelete = useCallback(async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onDelete(item._id);
      onClose();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: getApiErrorMessage(error, "Delete failed"),
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [showDeleteConfirm, onDelete, item, onClose]);

  // ✅ Conditional return comes AFTER all hooks
  if (!isOpen || !item) return null;

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

        <div className="relative w-full max-w-2xl overflow-hidden bg-white rounded-2xl shadow-2xl animate-fadeIn">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Edit Purchase Order
                </h3>
                <p className="text-sm text-blue-100">
                  #{item.po} · {item.company}
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg text-white hover:bg-white/15 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {errors.form && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 mb-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> PO Number
                </label>
                <input
                  type="text"
                  value={formData.po}
                  onChange={(e) => handleChange("po", e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.po ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.po && (
                  <p className="text-xs text-red-600 mt-1">{errors.po}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.company ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.company && (
                  <p className="text-xs text-red-600 mt-1">{errors.company}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PO Date
                </label>
                <input
                  type="date"
                  value={formData.poDate}
                  onChange={(e) => handleChange("poDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => handleChange("deliveryDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> Item Description
                </label>
                <input
                  type="text"
                  value={formData.item}
                  onChange={(e) => handleChange("item", e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.item ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.item && (
                  <p className="text-xs text-red-600 mt-1">{errors.item}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Code
                </label>
                <input
                  type="text"
                  value={formData.itemCode}
                  onChange={(e) => handleChange("itemCode", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drawing Number
                </label>
                <input
                  type="text"
                  value={formData.drawing}
                  onChange={(e) => handleChange("drawing", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> PO Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.poQty}
                  onChange={(e) => handleChange("poQty", e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.poQty ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.poQty && (
                  <p className="text-xs text-red-600 mt-1">{errors.poQty}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> Rate (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => handleChange("rate", e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.rate ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.rate && (
                  <p className="text-xs text-red-600 mt-1">{errors.rate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Value (₹)
                </label>
                <input
                  type="text"
                  value={
                    Number(formData.poQty || 0) * Number(formData.rate || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  disabled
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-gray-200">
              <div>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete PO
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    Confirm Delete
                  </button>
                )}
                {showDeleteConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Pencil className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

// ============================================
// COMPANY ACCORDION ROW COMPONENT
// ============================================
// ============================================
// COMPANY ACCORDION ROW COMPONENT - FIXED
// ============================================
const CompanyAccordion = React.memo(function CompanyAccordion({
  company,
  items,
  isExpanded,
  onToggle,
  selectedItems,
  onToggleSelection,
  onDispatchClick,
  onEditClick,
  onDeleteClick,
  dispatchHistory,
  getCompletionPercentage,
  getRiskMeta,
  formatCurrency,
  formatDate,
  getCategory,
  getItemKey,
}) {
  const historyCount = useMemo(() => {
    return items.reduce((sum, item) => {
      const key = getItemKey(item);
      return sum + (dispatchHistory[key]?.length || 0);
    }, 0);
  }, [items, dispatchHistory, getItemKey]);

  const totalPending = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.pending || 0), 0);
  }, [items]);

  const totalPOQty = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.poQty || 0), 0);
  }, [items]);

  const completionPercentage = useMemo(() => {
    if (totalPOQty === 0) return 0;
    const dispatched = totalPOQty - totalPending;
    return Math.round((dispatched / totalPOQty) * 100);
  }, [totalPOQty, totalPending]);

  const allSelected = useMemo(() => {
    return items.length > 0 && items.every((item) => selectedItems.has(getItemKey(item)));
  }, [items, selectedItems, getItemKey]);

  const handleSelectAll = useCallback((e) => {
    e.stopPropagation();
    items.forEach((item) => {
      onToggleSelection(item);
    });
  }, [items, onToggleSelection]);

  return (
    <div className="border border-gray-200 rounded-lg mb-2 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
      {/* Company Header - Clickable to expand/collapse */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
              {(company || "?").charAt(0).toUpperCase()}
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-[300px]">
                {company || "Unknown Company"}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>{items.length} PO{items.length > 1 ? "s" : ""}</span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />
                  {totalPending.toLocaleString()} pending
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {completionPercentage}% complete
                </span>
                {historyCount > 0 && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1 text-blue-600">
                      <History className="w-3 h-3" />
                      {historyCount} dispatch{historyCount > 1 ? "es" : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSelectAll}
            className="p-1.5 rounded hover:bg-blue-100 transition"
            title={allSelected ? "Deselect all" : "Select all"}
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => {}}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Table */}
      {isExpanded && (
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full border-collapse text-sm text-center">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                    aria-label={`Select all items for ${company}`}
                  />
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  PO details
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Item / drawing
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Progress
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  PO qty
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Dispatched
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Pending
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Unit rate
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Pending value
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
              {items.map((item, index) => {
                const itemKey = getItemKey(item);
                const isSelected = selectedItems.has(itemKey);
                const itemHistoryCount = dispatchHistory[itemKey]?.length || 0;
                const completion = getCompletionPercentage(item);
                const risk = getRiskMeta(item);

                return (
                  <tr
                    key={itemKey}
                    className={`hover:bg-blue-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(item)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                        aria-label={`Select ${item.po} ${item.item}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      <p className="font-mono text-sm font-semibold text-slate-800">
                        {item.po || "—"}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 justify-center">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(item.poDate)}
                      </p>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      <p
                        className="max-w-[200px] truncate text-sm font-medium text-slate-800"
                        title={item.item}
                      >
                        {item.item || "Unnamed item"}
                      </p>
                      <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-slate-400">
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
                      {Number(item.dispatched || 0).toLocaleString("en-IN")}
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
                        <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                        {risk.label}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onDispatchClick(item)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                          title={item.pending > 0 ? "Record dispatch" : "View dispatch history"}
                        >
                          {item.pending > 0 ? (
                            <Truck className="h-3.5 w-3.5" />
                          ) : (
                            <History className="h-3.5 w-3.5" />
                          )}
                          {itemHistoryCount > 0 && (
                            <span className="ml-0.5 rounded-full bg-blue-200 px-1.5 py-0.5 text-[9px] text-blue-800">
                              {itemHistoryCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => onEditClick(item)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          title="Edit PO"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteClick(item)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition"
                          title="Delete PO"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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
});

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
const StatCard = React.memo(function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "blue",
  progress,
}) {
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
});

// ============================================
// MAIN COMPONENT
// ============================================
const GeneratePendingList = () => {
  const [data, setData] = useState([]);
  const [manager, setManager] = useState(null);
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
  const [isDataReady, setIsDataReady] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [viewMode, setViewMode] = useState("accordion");
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [expandedCompanies, setExpandedCompanies] = useState(new Set());

  const getCategory = useCallback((description = "") => {
    const value = String(description).toLowerCase();
    if (value.includes("bus bar")) return "Bus Bars";
    if (value.includes("heat sink")) return "Heat Sinks";
    if (value.includes("accessory") || value.includes("assembly"))
      return "Accessories";
    if (value.includes("hardware")) return "Hardware";
    if (value.includes("plate")) return "Plates";
    return "Others";
  }, []);

  const getItemKey = useCallback(
    (item) =>
      String(
        item?._id ||
          [item?.company, item?.po, item?.itemCode, item?.drawing, item?.item]
            .filter(Boolean)
            .join("::"),
      ),
    [],
  );

  const showNotification = useCallback((message, type = "info") => {
    setNotification({ message, type });
  }, []);

  const filteredData = useMemo(() => {
    if (!manager) return [];
    const filters = {
      company: selectedCompany,
      searchTerm: debouncedSearchTerm,
      status: selectedStatus,
      category: selectedCategory,
      minPending: minPending,
      maxPending: maxPending,
      dateRange: dateRange,
    };
    return manager.filterData(filters);
  }, [
    manager,
    selectedCompany,
    debouncedSearchTerm,
    selectedStatus,
    selectedCategory,
    minPending,
    maxPending,
    dateRange,
  ]);

  const groupedByCompany = useMemo(() => {
    const groups = {};
    filteredData.forEach((item) => {
      const company = item.company || "Unknown Company";
      if (!groups[company]) {
        groups[company] = [];
      }
      groups[company].push(item);
    });
    return groups;
  }, [filteredData]);

  const companyList = useMemo(() => {
    return Object.keys(groupedByCompany).sort();
  }, [groupedByCompany]);

  const filteredManager = useMemo(
    () => (filteredData.length > 0 ? new PendingPOManager(filteredData) : null),
    [filteredData],
  );

  const selectedRows = useMemo(
    () => data.filter((item) => selectedItems.has(getItemKey(item))),
    [data, selectedItems, getItemKey],
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

  const loadPurchaseOrders = useCallback(
    async ({ quiet = false, signal } = {}) => {
      if (!quiet) setIsLoading(true);
      try {
        const result = await pendingPoApi.listAll({ signal });
        const records = result.records || [];
        const nextManager = new PendingPOManager(records);
        const nextHistory = {};

        records.forEach((item) => {
          nextHistory[getItemKey(item)] = Array.isArray(item.dispatchHistory)
            ? item.dispatchHistory
            : [];
        });

        startTransition(() => {
          setData(records);
          setManager(nextManager);
          setDispatchHistory(nextHistory);
          setCompanies(["all", ...Object.keys(nextManager.companyStats)]);
          setCategories(["all", ...nextManager.itemCategories]);
          setSelectedItems(new Set());
          setIsDataReady(true);
          if (!quiet) setIsLoading(false);
        });
      } catch (error) {
        if (!quiet) {
          setIsLoading(false);
          setNotification({
            message: getApiErrorMessage(
              error,
              "Could not load purchase orders",
            ),
            type: "error",
          });
        }
      }
    },
    [getItemKey, startTransition],
  );

  const handleFileUpload = useCallback(
    async (event) => {
      const file = event.target.files[0];
      if (file) {
        if (!/\.(xlsx|xls)$/i.test(file.name)) {
          showNotification("Please upload an .xlsx or .xls file", "error");
          event.target.value = "";
          return;
        }

        setIsLoading(true);

        try {
          const result = await pendingPoApi.importFile(file);
          setUploadedFile(file);
          setSelectedItems(new Set());
          setSortConfig({ key: null, direction: "asc" });
          setCurrentPage(1);
          clearFilters();
          await loadPurchaseOrders({ quiet: true });

          const warningCount = Number(result.skipped || 0);
          showNotification(
            `${result.inserted || 0} inserted, ${result.updated || 0} updated${
              warningCount ? `, ${warningCount} skipped` : ""
            }`,
            warningCount ? "warning" : "success",
          );
        } catch (error) {
          console.error("Error importing file:", error);
          showNotification(
            getApiErrorMessage(
              error,
              "Could not import the file. Please check its columns.",
            ),
            "error",
          );
        } finally {
          setIsLoading(false);
          event.target.value = "";
        }
      }
    },
    [loadPurchaseOrders, showNotification],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadPurchaseOrders({ signal: controller.signal }).catch((error) => {
      if (error?.code === "ERR_CANCELED") return;
      setNotification({
        message: getApiErrorMessage(
          error,
          "Saved purchase orders could not be loaded",
        ),
        type: "error",
      });
    });
    
    return () => controller.abort();
  }, [loadPurchaseOrders]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearchTerm(searchTerm.trim()),
      220,
    );
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (manager && companies.length === 0) {
      setCompanies(["all", ...Object.keys(manager.companyStats)]);
      setCategories(["all", ...manager.itemCategories]);
    }
  }, [manager, companies.length]);

  const handleDispatchUpdate = useCallback(
    async (payload) => {
      const result = payload.isBulk
        ? await pendingPoApi.createBulkDispatch(payload)
        : await pendingPoApi.createDispatch(payload);

      await loadPurchaseOrders({ quiet: true });

      if (payload.isBulk) {
        const successCount = Number(
          result.totalProcessed ?? result.successful?.length ?? 0,
        );
        const failCount = Number(
          result.totalFailed ?? result.failed?.length ?? 0,
        );
        showNotification(
          `${successCount} item(s) dispatched${failCount ? `, ${failCount} skipped` : ""}`,
          failCount ? "warning" : "success",
        );
      } else {
        showNotification(
          `Dispatch saved. New pending quantity: ${result.updatedPO?.pending ?? "-"}`,
          "success",
        );
      }

      return result;
    },
    [loadPurchaseOrders, showNotification],
  );

  const handleDispatchEdit = useCallback(
    async (payload) => {
      try {
        const result = await pendingPoApi.updateDispatch(payload);
        await loadPurchaseOrders({ quiet: true });
        showNotification("Dispatch updated successfully", "success");
        return result;
      } catch (error) {
        showNotification(getApiErrorMessage(error, "Update failed"), "error");
        throw error;
      }
    },
    [loadPurchaseOrders, showNotification],
  );

  const handleDispatchDelete = useCallback(
    async (payload) => {
      try {
        await pendingPoApi.deleteDispatch(payload);
        await loadPurchaseOrders({ quiet: true });
        showNotification("Dispatch deleted successfully", "success");
      } catch (error) {
        showNotification(getApiErrorMessage(error, "Delete failed"), "error");
        throw error;
      }
    },
    [loadPurchaseOrders, showNotification],
  );

  const openDispatchModal = useCallback(
    (item) => {
      const itemKey = getItemKey(item);
      setSelectedItemForDispatch({
        ...item,
        dispatchHistory: dispatchHistory[itemKey] || [],
      });
      setIsDispatchModalOpen(true);
    },
    [dispatchHistory, getItemKey],
  );

  const openMultipleDispatchModal = useCallback(() => {
    const itemsToDispatch = data.filter(
      (item) => selectedItems.has(getItemKey(item)) && (item.pending || 0) > 0,
    );

    if (itemsToDispatch.length === 0) {
      showNotification("No selected items with pending quantity", "warning");
      return;
    }

    const itemsWithHistory = itemsToDispatch.map((item) => ({
      ...item,
      dispatchHistory: dispatchHistory[getItemKey(item)] || [],
    }));

    setSelectedItemForDispatch(itemsWithHistory);
    setIsMultipleDispatchModalOpen(true);
  }, [data, selectedItems, getItemKey, dispatchHistory, showNotification]);

  const closeDispatchModal = useCallback(() => {
    setIsDispatchModalOpen(false);
    setIsMultipleDispatchModalOpen(false);
    setSelectedItemForDispatch(null);
  }, []);

  const openGlobalHistory = useCallback(() => {
    setIsGlobalHistoryOpen(true);
  }, []);

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const formatDate = useCallback((dateStr) => {
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
  }, []);

  const getCompletionPercentage = useCallback((item) => {
    const total = Number(item?.poQty) || 0;
    if (total <= 0) return 0;
    return Math.min(
      100,
      Math.max(0, ((Number(item?.dispatched) || 0) / total) * 100),
    );
  }, []);

  const getRiskMeta = useCallback(
    (item) => {
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
    },
    [getCompletionPercentage],
  );

  const clearFilters = useCallback(() => {
    setSelectedCompany("all");
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedCategory("all");
    setMinPending("");
    setMaxPending("");
    setDateRange({ start: "", end: "" });
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const getSortIcon = useCallback(
    (key) => {
      if (sortConfig.key !== key) return ArrowUpDown;
      return sortConfig.direction === "asc" ? ArrowUp : ArrowDown;
    },
    [sortConfig],
  );

  const toggleItemSelection = useCallback(
    (item) => {
      const itemKey = getItemKey(item);
      setSelectedItems((current) => {
        const next = new Set(current);
        if (next.has(itemKey)) next.delete(itemKey);
        else next.add(itemKey);
        return next;
      });
    },
    [getItemKey],
  );

  const handleHoverStart = useCallback((key) => {
    setIsHovered(key);
  }, []);

  const handleHoverEnd = useCallback(() => {
    setIsHovered(null);
  }, []);

  const handleDispatchClick = useCallback(
    (item) => {
      const itemKey = getItemKey(item);
      setSelectedItemForDispatch({
        ...item,
        dispatchHistory: dispatchHistory[itemKey] || [],
      });
      setIsDispatchModalOpen(true);
    },
    [dispatchHistory, getItemKey],
  );

  const handleEditClick = useCallback((item) => {
    setSelectedItemForEdit(item);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((item) => {
    setSelectedItemForEdit(item);
    setIsEditModalOpen(true);
  }, []);

  const handleUpdatePO = useCallback(
    async (id, updateData) => {
      try {
        const result = await pendingPoApi.updatePO(id, updateData);
        await loadPurchaseOrders({ quiet: true });
        showNotification("Purchase order updated successfully", "success");
        return result;
      } catch (error) {
        showNotification(getApiErrorMessage(error, "Update failed"), "error");
        throw error;
      }
    },
    [loadPurchaseOrders, showNotification],
  );

  const handleDeletePO = useCallback(
    async (id) => {
      try {
        await pendingPoApi.deletePO(id);
        await loadPurchaseOrders({ quiet: true });
        showNotification("Purchase order deleted successfully", "success");
      } catch (error) {
        showNotification(getApiErrorMessage(error, "Delete failed"), "error");
        throw error;
      }
    },
    [loadPurchaseOrders, showNotification],
  );

  const toggleCompany = useCallback((company) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(company)) {
        next.delete(company);
      } else {
        next.add(company);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allCompanies = new Set(companyList);
    setExpandedCompanies(allCompanies);
  }, [companyList]);

  const collapseAll = useCallback(() => {
    setExpandedCompanies(new Set());
  }, []);

  const exportRows = useCallback(
    (rows, label = "filtered") => {
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
    },
    [getCompletionPercentage, showNotification],
  );

  const downloadTemplate = useCallback(async () => {
    try {
      await pendingPoApi.downloadTemplate();
      showNotification("Import template downloaded", "success");
    } catch (error) {
      showNotification(
        getApiErrorMessage(error, "Template could not be downloaded"),
        "error",
      );
    }
  }, [showNotification]);

  const renderNotification = useCallback(() => {
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
  }, [notification]);

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
          .animate-slideIn { animation: slideIn 0.3s ease-out; }
          .animate-fadeInUp { animation: fadeInUp 0.5s ease-out; }
          .thin-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
          .thin-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
          .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
          @media (prefers-reduced-motion: reduce) {
            .animate-slideIn, .animate-fadeInUp, .animate-pulse-slow {
              animation: none !important;
            }
          }
        `}
      </style>

      {renderNotification()}

      {/* Edit/Delete PO Modal */}
      <EditDeleteModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItemForEdit(null);
        }}
        item={selectedItemForEdit}
        onUpdate={handleUpdatePO}
        onDelete={handleDeletePO}
        formatDate={formatDate}
      />

      {/* Dispatch Modal */}
      <DispatchModal
        isOpen={isDispatchModalOpen}
        onClose={closeDispatchModal}
        item={selectedItemForDispatch}
        onDispatchUpdate={handleDispatchUpdate}
        onDispatchEdit={handleDispatchEdit}
        onDispatchDelete={handleDispatchDelete}
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

      {/* Global History Modal */}
      <GlobalDispatchHistoryModal
        isOpen={isGlobalHistoryOpen}
        onClose={() => setIsGlobalHistoryOpen(false)}
        dispatchHistory={dispatchHistory}
        formatDate={formatDate}
        onDispatchEdit={(entry, billNumber) => {
          setIsGlobalHistoryOpen(false);
          setSelectedItemForDispatch({
            ...entry,
            dispatchHistory: dispatchHistory[entry.itemKey] || [],
            _id: entry.poId || entry.poId,
          });
          setIsDispatchModalOpen(true);
        }}
        onDispatchDelete={handleDispatchDelete}
      />

      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <header className="relative rounded-2xl shadow-lg mb-8 overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 animate-fadeInUp sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/15 shadow-inner backdrop-blur-sm sm:h-14 sm:w-14">
                <LayoutDashboard className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
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
                {data.length > 0 ? "Import / update Excel" : "Upload Excel"}
              </label>

              {isDataReady && (
                <button
                  type="button"
                  onClick={() =>
                    loadPurchaseOrders().catch((error) =>
                      showNotification(
                        getApiErrorMessage(error, "Refresh failed"),
                        "error",
                      ),
                    )
                  }
                  disabled={isLoading || isPending}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading || isPending ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              )}

              {data.length > 0 && (
                <>
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

          {isDataReady && (
            <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-white/15 bg-slate-950/10 px-4 py-3 text-xs text-blue-50 backdrop-blur-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                <span className="max-w-[280px] truncate">
                  {uploadedFile?.name || "Saved purchase-order records"}
                </span>
              </span>
              {uploadedFile?.size ? (
                <span>{(uploadedFile.size / 1024).toFixed(1)} KB imported</span>
              ) : null}
              <span>{manager?.summary.totalPOs || 0} purchase orders</span>
              <span>{manager?.summary.totalCompanies || 0} companies</span>
              <span className="ml-auto flex items-center gap-1.5 text-blue-100">
                <ShieldCheck className="h-3.5 w-3.5" /> Synced with database
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
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                      <option value="completed">Completed</option>
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

        {/* Main Data Table - Accordion View */}
        {isLoading ? (
          <div className="rounded-3xl border border-blue-100 bg-white p-12 text-center shadow-xl shadow-blue-900/5">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50">
              <RefreshCw className="h-7 w-7 animate-spin text-blue-600" />
            </div>
            <p className="mt-5 font-semibold text-slate-800">
              Loading your PO workspace
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Reading saved purchase orders and dispatch history...
            </p>
          </div>
        ) : data.length > 0 ? (
          <section className="print-card overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] animate-fadeInUp">
            {/* View Mode Selector */}
            <div className="no-print flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Purchase orders by Company
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {companyList.length} companies · {filteredData.length} POs
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Click on a company to expand and view PO details
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

                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:bg-white hover:text-blue-700"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:bg-white hover:text-blue-700"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                    Collapse All
                  </button>
                </div>

                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("accordion")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      viewMode === "accordion"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" /> Companies
                  </button>
                </div>
              </div>
            </div>

            {/* Accordion View */}
            <div className="p-4 bg-gray-50">
              {companyList.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No companies found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {companyList.map((company) => (
                    <CompanyAccordion
                      key={company}
                      company={company}
                      items={groupedByCompany[company]}
                      isExpanded={expandedCompanies.has(company)}
                      onToggle={() => toggleCompany(company)}
                      selectedItems={selectedItems}
                      onToggleSelection={toggleItemSelection}
                      onDispatchClick={handleDispatchClick}
                      onEditClick={handleEditClick}
                      onDeleteClick={handleDeleteClick}
                      dispatchHistory={dispatchHistory}
                      getCompletionPercentage={getCompletionPercentage}
                      getRiskMeta={getRiskMeta}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      getCategory={getCategory}
                      getItemKey={getItemKey}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span>
                  <strong className="text-slate-800">
                    {companyList.length}
                  </strong>{" "}
                  companies ·{" "}
                  <strong className="text-slate-800">
                    {filteredData.length}
                  </strong>{" "}
                  POs
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
                <span>
                  {expandedCompanies.size} company
                  {expandedCompanies.size > 1 ? "ies" : ""} expanded
                </span>
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
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Saved to
                  your database
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
