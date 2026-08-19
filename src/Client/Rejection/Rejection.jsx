import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ThumbsDown,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { pendingPoApi } from "./../pendingPoApi.js";
import rejectionApi, { getApiErrorMessage } from "../rejectionApi.js";
import ItemRejection from "./ItemRejection.jsx";
import Inventory from "./Inventory.jsx";

const text = (value) => String(value ?? "").trim();
const qty = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};

const extractRecords = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.records)) return result.records;
  if (Array.isArray(result?.data?.records)) return result.data.records;
  if (Array.isArray(result?.data)) return result.data;
  return [];
};

const flattenDispatches = (purchaseOrders, rejections) => {
  const committedByDispatch = new Map();
  rejections
    .filter((r) => r.status !== "denied" && r.source === "manual")
    .forEach((r) => {
      const id = text(r.dispatchId);
      if (!id) return;
      committedByDispatch.set(
        id,
        (committedByDispatch.get(id) || 0) + qty(r.rejectedQuantity),
      );
    });

  return purchaseOrders.flatMap((po) =>
    (Array.isArray(po.dispatchHistory) ? po.dispatchHistory : []).map(
      (dispatch) => {
        const dispatchId = text(dispatch._id || dispatch.id);
        const quantity = qty(dispatch.dispatchQty ?? dispatch.quantity);
        const alreadyCommitted = committedByDispatch.get(dispatchId) || 0;
        return {
          poId: text(po._id || po.id),
          dispatchId,
          poNumber: text(po.po),
          companyName: text(po.company),
          itemCode: text(po.itemCode),
          drawing: text(po.drawing),
          description: text(po.item),
          quantity,
          availableForRejection: Math.max(0, quantity - alreadyCommitted),
          date: dispatch.dispatchDate || dispatch.date,
          billNumber: text(dispatch.billNumber),
          dispatchedBy: dispatch.dispatchedBy,
        };
      },
    ),
  );
};

const statusMeta = {
  pending_review: ["Pending review", "bg-amber-100 text-amber-700", Clock3],
  approved: ["Approved", "bg-emerald-100 text-emerald-700", CheckCircle2],
  denied: ["Denied", "bg-red-100 text-red-700", XCircle],
  recorded: ["Recorded", "bg-blue-100 text-blue-700", CheckCircle2],
};

const RejectionHistory = () =>  {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const [activeTab, setActiveTab] = useState("rejections");
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [rejections, setRejections] = useState([]);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [selectedRejection, setSelectedRejection] = useState(null);
  const [selectedInventoryRejection, setSelectedInventoryRejection] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [poResult, rejectionResult] = await Promise.all([
        pendingPoApi.listAll({
          all: true,
          includeHistory: true,
          page: 1,
          limit: 1000,
        }),
        rejectionApi.list({ limit: 2000 }),
      ]);
      setPurchaseOrders(extractRecords(poResult));
      setRejections(
        Array.isArray(rejectionResult?.records)
          ? rejectionResult.records
          : rejectionResult || [],
      );
    } catch (e) {
      setError(getApiErrorMessage(e, "Could not load rejection data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dispatches = useMemo(
    () => flattenDispatches(purchaseOrders, rejections),
    [purchaseOrders, rejections],
  );

  const filteredRejections = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rejections.filter((r) => {
      const matchText =
        !q ||
        [r.poNumber, r.companyName, r.itemCode, r.description, r.reason].some(
          (value) => text(value).toLowerCase().includes(q),
        );
      const matchStatus = status === "all" || r.status === status;
      return matchText && matchStatus;
    });
  }, [rejections, search, status]);

  const filteredDispatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dispatches.filter(
      (d) =>
        !q ||
        [
          d.poNumber,
          d.companyName,
          d.itemCode,
          d.description,
          d.billNumber,
        ].some((value) => text(value).toLowerCase().includes(q)),
    );
  }, [dispatches, search]);

  const stats = useMemo(
    () => ({
      total: rejections.length,
      pending: rejections.filter((r) => r.status === "pending_review").length,
      approved: rejections.filter((r) => r.status === "approved").length,
      recorded: rejections.filter((r) => r.status === "recorded").length,
      qty: rejections
        .filter((r) => r.affectsPending)
        .reduce((sum, r) => sum + qty(r.rejectedQuantity), 0),
      inventoryQty: rejections.reduce(
        (sum, r) => sum + qty(r.inventoryAddedQuantity),
        0,
      ),
      inventoryRecords: rejections.filter(
        (r) => r.inventoryStatus === "stored" || r.inventoryStatus === "partial",
      ).length,
    }),
    [rejections],
  );

  const review = async (rejection, action) => {
    const adminRemarks = window.prompt(
      action === "approve"
        ? "Approval remarks (optional)"
        : "Reason for denial (optional)",
      "",
    );
    if (adminRemarks === null) return;
    try {
      await rejectionApi.review(rejection._id, { action, adminRemarks });
      toast.success(
        action === "approve" ? "Rejection approved" : "Rejection denied",
      );
      setSelectedRejection(null);
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Review failed"));
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto  space-y-5">
        <header className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 px-8 py-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h1 className="text-xl font-bold">Rejection Management</h1>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                One history for manual and Excel-imported rejections, with quarantine inventory traceability.
              </p>
            </div>
            <button
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="Total Records" value={stats.total} />
          <Stat label="Pending Review" value={stats.pending} />
          <Stat label="Approved" value={stats.approved} />
          <Stat label="Excel Recorded" value={stats.recorded} />
          <Stat
            label="Effective Rejected Qty"
            value={stats.qty.toLocaleString("en-IN")}
          />
          <Stat
            label="Stored in Inventory"
            value={`${stats.inventoryQty.toLocaleString("en-IN")} / ${stats.inventoryRecords} record(s)`}
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              <Tab
                active={activeTab === "rejections"}
                onClick={() => setActiveTab("rejections")}
              >
                Rejection History ({rejections.length})
              </Tab>
              <Tab
                active={activeTab === "dispatches"}
                onClick={() => setActiveTab("dispatches")}
              >
                Dispatches ({dispatches.length})
              </Tab>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search PO, item, company..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-red-400 sm:w-72"
                />
              </div>
              {activeTab === "rejections" && (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="all">All statuses</option>
                  <option value="pending_review">Pending review</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                  <option value="recorded">Excel recorded</option>
                </select>
              )}
            </div>
          </div>

          {activeTab === "rejections" ? (
            <div className="divide-y divide-slate-100">
              {filteredRejections.length === 0 ? (
                <Empty text="No rejection records found" />
              ) : (
                filteredRejections.map((r) => {
                  const [label, badge, Icon] =
                    statusMeta[r.status] || statusMeta.pending_review;
                  return (
                    <div key={r._id} className="p-4 hover:bg-slate-50">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900">
                              {r.poNumber || "-"}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${badge}`}
                            >
                              <Icon className="h-3 w-3" />
                              {label}
                            </span>
                            <span className="rounded-full bg-violet-100 px-2 py-1 text-[11px] font-semibold text-violet-700">
                              {r.source === "excel_import"
                                ? "Excel Import"
                                : "Manual"}
                            </span>
                            {r.inventoryStatus && r.inventoryStatus !== "not_stored" && (
                              <span
                                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                  r.inventoryStatus === "stored"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-cyan-100 text-cyan-700"
                                }`}
                              >
                                {r.inventoryStatus === "stored"
                                  ? "Inventory stored"
                                  : `Inventory ${qty(r.inventoryAddedQuantity).toLocaleString("en-IN")} / ${qty(r.rejectedQuantity).toLocaleString("en-IN")}`}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-5">
                            <span>
                              <b>Company:</b> {r.companyName || "-"}
                            </span>
                            <span>
                              <b>Item:</b> {r.itemCode || "-"}
                            </span>
                            <span>
                              <b>Rejected:</b>{" "}
                              <strong className="text-red-600">
                                {qty(r.rejectedQuantity).toLocaleString(
                                  "en-IN",
                                )}
                              </strong>
                            </span>
                            <span>
                              <b>Reason:</b> {r.reason || "-"}
                            </span>
                            <span>
                              <b>Date:</b>{" "}
                              {r.rejectionDate
                                ? new Date(r.rejectionDate).toLocaleDateString(
                                    "en-IN",
                                  )
                                : "-"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {["approved", "recorded"].includes(r.status) && (
                            <button
                              onClick={() => setSelectedInventoryRejection(r)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              <Package className="h-3.5 w-3.5" />{
                                qty(r.inventoryAddedQuantity) > 0
                                  ? "Inventory / Disposition"
                                  : "Store Inventory"
                              }
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedRejection(r)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDispatches.length === 0 ? (
                <Empty text="No dispatch records found" />
              ) : (
                filteredDispatches.map((d) => (
                  <div
                    key={`${d.poId}-${d.dispatchId}`}
                    className="flex flex-col gap-3 p-4 hover:bg-slate-50 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="font-mono text-sm font-bold">
                          {d.poNumber}
                        </span>
                        <span className="text-sm text-slate-500">
                          {d.itemCode || d.description}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                        <span>{d.companyName}</span>
                        <span>
                          Dispatch: {d.quantity.toLocaleString("en-IN")}
                        </span>
                        <span>
                          Available to reject:{" "}
                          {d.availableForRejection.toLocaleString("en-IN")}
                        </span>
                        <span>Bill: {d.billNumber || "-"}</span>
                      </div>
                    </div>
                    <button
                      disabled={d.availableForRejection <= 0}
                      onClick={() => setSelectedDispatch(d)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>

      {selectedDispatch && (
        <ItemRejection
          dispatch={selectedDispatch}
          onClose={() => setSelectedDispatch(null)}
          onSaved={() => void load()}
        />
      )}
      {selectedRejection && (
        <RejectionDetails
          rejection={selectedRejection}
          isAdmin={isAdmin}
          onClose={() => setSelectedRejection(null)}
          onReview={review}
          onStoreInventory={(rejection) => {
            setSelectedRejection(null);
            setSelectedInventoryRejection(rejection);
          }}
        />
      )}
      {selectedInventoryRejection && (
        <Inventory
          rejection={selectedInventoryRejection}
          onClose={() => setSelectedInventoryRejection(null)}
          onSuccess={async (_data, options = {}) => {
            await load();
            if (options.close) setSelectedInventoryRejection(null);
          }}
        />
      )}
    </div>
  );
}

function RejectionDetails({
  rejection,
  isAdmin,
  onClose,
  onReview,
  onStoreInventory,
}) {
  const [label, badge] =
    statusMeta[rejection.status] || statusMeta.pending_review;
  return (
    <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="font-bold text-slate-900">Rejection Details</h2>
            <p className="text-xs text-slate-500">
              {rejection.poNumber} · {rejection.itemCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <Detail
            label="Status"
            value={
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${badge}`}
              >
                {label}
              </span>
            }
          />
          <Detail
            label="Source"
            value={
              rejection.source === "excel_import" ? "Excel Import" : "Manual"
            }
          />
          <Detail label="Company" value={rejection.companyName} />
          <Detail label="PO Number" value={rejection.poNumber} />
          <Detail label="Item Code" value={rejection.itemCode} />
          <Detail label="Drawing" value={rejection.drawing} />
          <Detail
            label="Rejected Qty"
            value={qty(rejection.rejectedQuantity).toLocaleString("en-IN")}
          />
          <Detail
            label="Inventory Stored"
            value={`${qty(rejection.inventoryAddedQuantity).toLocaleString("en-IN")} / ${qty(rejection.rejectedQuantity).toLocaleString("en-IN")}`}
          />
          <Detail
            label="Inventory Status"
            value={
              rejection.inventoryStatus === "stored"
                ? "Fully stored"
                : rejection.inventoryStatus === "partial"
                  ? "Partially stored"
                  : "Not stored"
            }
          />
          <Detail label="Reason" value={rejection.reason} />
          <Detail label="Detailed Reason" value={rejection.subReason} />
          <Detail label="Severity" value={rejection.severity} />
          <Detail
            label="Replacement"
            value={rejection.requiresReplacement ? "Required" : "Not required"}
          />
          <Detail label="Inspector" value={rejection.inspectorName} />
          <Detail label="Notes" value={rejection.notes} />
          <Detail label="Admin Remarks" value={rejection.adminRemarks} />
        </div>
        {(isAdmin && rejection.status === "pending_review") ||
        ["approved", "recorded"].includes(rejection.status) ? (
          <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row">
            {isAdmin && rejection.status === "pending_review" && (
              <>
                <button
                  onClick={() => onReview(rejection, "approve")}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Approve & Reopen Pending
                </button>
                <button
                  onClick={() => onReview(rejection, "deny")}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Deny
                </button>
              </>
            )}
            {["approved", "recorded"].includes(rejection.status) && (
              <button
                onClick={() => onStoreInventory(rejection)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                <Package className="h-4 w-4" />{
                  qty(rejection.inventoryAddedQuantity) > 0
                    ? "Manage Inventory / Disposition"
                    : "Store in Inventory"
                }
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "-"}
      </div>
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
    >
      {children}
    </button>
  );
}
function Empty({ text }) {
  return <div className="p-12 text-center text-sm text-slate-400">{text}</div>;
}


export default RejectionHistory;