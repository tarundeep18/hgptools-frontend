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
import { pendingPoApi } from "../GeneratePendingList/pendingPoApi.js";
import rejectionApi, { getApiErrorMessage } from "./rejectionApi.js";
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
        <header className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 px-8 py-12 text-white shadow-lg">
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

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <Stat label="Total Records" value={stats.total} />
          <Stat label="Pending Review" value={stats.pending} />
          <Stat label="Approved" value={stats.approved} />
          <Stat
            label="Effective Rejected Qty"
            value={stats.qty.toLocaleString("en-IN")}
          />
          
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
  {/* Toolbar */}
  <div className="border-b border-slate-300 bg-slate-50">
    <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Tabs */}
      <div className="inline-flex w-fit overflow-hidden rounded-md border border-slate-300 bg-white">
        <button
          type="button"
          onClick={() => setActiveTab("rejections")}
          className={`border-r border-slate-300 px-4 py-2 text-xs font-semibold transition ${
            activeTab === "rejections"
              ? "bg-red-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          Rejection History ({rejections.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dispatches")}
          className={`px-4 py-2 text-xs font-semibold transition ${
            activeTab === "dispatches"
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          Dispatches ({dispatches.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO, item, company..."
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-72"
          />
        </div>

        {activeTab === "rejections" && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
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
  </div>

  {/* Excel style table */}
  <div className="overflow-x-auto">
    {activeTab === "rejections" ? (
      filteredRejections.length === 0 ? (
        <Empty text="No rejection records found" />
      ) : (
        <table className="min-w-[1500px] w-full border-collapse text-xs">
          {/* Header */}
          <thead className="sticky top-0 z-20 bg-slate-200">
            <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-slate-700">
              <th className="w-12 border border-slate-300 px-2 py-2 text-center">
                #
              </th>

              <th className="min-w-[120px] border border-slate-300 px-3 py-2">
                PO Number
              </th>

              <th className="min-w-[150px] border border-slate-300 px-3 py-2">
                Company
              </th>

              <th className="min-w-[120px] border border-slate-300 px-3 py-2">
                Item Code
              </th>

              <th className="min-w-[110px] border border-slate-300 px-3 py-2">
                Rejected Qty
              </th>

              <th className="min-w-[110px] border border-slate-300 px-3 py-2">
                Status
              </th>

              <th className="min-w-[100px] border border-slate-300 px-3 py-2">
                Source
              </th>

              <th className="min-w-[170px] border border-slate-300 px-3 py-2">
                Inventory
              </th>

              <th className="min-w-[180px] border border-slate-300 px-3 py-2">
                Reason
              </th>

              <th className="min-w-[120px] border border-slate-300 px-3 py-2">
                Rejection Date
              </th>

              <th className="sticky right-0 z-30 min-w-[210px] border border-slate-300 bg-slate-200 px-3 py-2 text-center">
                Action
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {filteredRejections.map((r, index) => {
              const [label, badge, Icon] =
                statusMeta[r.status] || statusMeta.pending_review;

              return (
                <tr
                  key={r._id}
                  className={`transition hover:bg-blue-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  {/* Row Number */}
                  <td className="border border-slate-300 px-2 py-2 text-center font-mono text-slate-500">
                    {index + 1}
                  </td>

                  {/* PO */}
                  <td className="border border-slate-300 px-3 py-2">
                    <span className="font-mono font-bold text-slate-900">
                      {r.poNumber || "-"}
                    </span>
                  </td>

                  {/* Company */}
                  <td className="border border-slate-300 px-3 py-2 text-slate-700">
                    {r.companyName || "-"}
                  </td>

                  {/* Item */}
                  <td className="border border-slate-300 px-3 py-2 font-mono text-slate-700">
                    {r.itemCode || "-"}
                  </td>

                  {/* Rejected */}
                  <td className="border border-slate-300 px-3 py-2 text-right font-bold text-red-600">
                    {qty(r.rejectedQuantity).toLocaleString("en-IN")}
                  </td>

                  {/* Status */}
                  <td className="border border-slate-300 px-3 py-2">
                    <span
                      className={`inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-1 text-[10px] font-semibold ${badge}`}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </span>
                  </td>

                  {/* Source */}
                  <td className="border border-slate-300 px-3 py-2">
                    <span
                      className={`inline-flex whitespace-nowrap rounded px-2 py-1 text-[10px] font-semibold ${
                        r.source === "excel_import"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-violet-100 text-violet-700"
                      }`}
                    >
                      {r.source === "excel_import"
                        ? "Excel Import"
                        : "Manual"}
                    </span>
                  </td>

                  {/* Inventory */}
                  <td className="border border-slate-300 px-3 py-2">
                    {!r.inventoryStatus ||
                    r.inventoryStatus === "not_stored" ? (
                      <span className="text-slate-400">Not Stored</span>
                    ) : r.inventoryStatus === "stored" ? (
                      <span className="inline-flex whitespace-nowrap rounded bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                        Stored
                      </span>
                    ) : (
                      <span className="inline-flex whitespace-nowrap rounded bg-cyan-100 px-2 py-1 text-[10px] font-semibold text-cyan-700">
                        {qty(r.inventoryAddedQuantity).toLocaleString("en-IN")} /{" "}
                        {qty(r.rejectedQuantity).toLocaleString("en-IN")}
                      </span>
                    )}
                  </td>

                  {/* Reason */}
                  <td
                    className="max-w-[220px] truncate border border-slate-300 px-3 py-2 text-slate-700"
                    title={r.reason || "-"}
                  >
                    {r.reason || "-"}
                  </td>

                  {/* Date */}
                  <td className="whitespace-nowrap border border-slate-300 px-3 py-2 text-slate-600">
                    {r.rejectionDate
                      ? new Date(r.rejectionDate).toLocaleDateString("en-IN")
                      : "-"}
                  </td>

                  {/* Actions */}
                  <td
                    className={`sticky right-0 border border-slate-300 px-2 py-1.5 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {["approved", "recorded"].includes(r.status) && (
                        <button
                          type="button"
                          onClick={() => setSelectedInventoryRejection(r)}
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <Package className="h-3.5 w-3.5" />

                          {qty(r.inventoryAddedQuantity) > 0
                            ? "Inventory"
                            : "Store"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedRejection(r)}
                        className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )
    ) : filteredDispatches.length === 0 ? (
      <Empty text="No dispatch records found" />
    ) : (
      <table className="min-w-[1350px] w-full border-collapse text-xs">
        {/* Dispatch Header */}
        <thead className="sticky top-0 z-20 bg-slate-200">
          <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-slate-700">
            <th className="w-12 border border-slate-300 px-2 py-2 text-center">
              #
            </th>

            <th className="min-w-[120px] border border-slate-300 px-3 py-2">
              PO Number
            </th>

            <th className="min-w-[160px] border border-slate-300 px-3 py-2">
              Company
            </th>

            <th className="min-w-[130px] border border-slate-300 px-3 py-2">
              Item Code
            </th>

            <th className="min-w-[240px] border border-slate-300 px-3 py-2">
              Description
            </th>

            <th className="min-w-[110px] border border-slate-300 px-3 py-2 text-right">
              Dispatch Qty
            </th>

            <th className="min-w-[140px] border border-slate-300 px-3 py-2 text-right">
              Available To Reject
            </th>

            <th className="min-w-[130px] border border-slate-300 px-3 py-2">
              Bill Number
            </th>

            <th className="sticky right-0 z-30 min-w-[110px] border border-slate-300 bg-slate-200 px-3 py-2 text-center">
              Action
            </th>
          </tr>
        </thead>

        {/* Dispatch Body */}
        <tbody>
          {filteredDispatches.map((d, index) => (
            <tr
              key={`${d.poId}-${d.dispatchId}`}
              className={`transition hover:bg-blue-50 ${
                index % 2 === 0 ? "bg-white" : "bg-slate-50"
              }`}
            >
              <td className="border border-slate-300 px-2 py-2 text-center font-mono text-slate-500">
                {index + 1}
              </td>

              <td className="border border-slate-300 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 shrink-0 text-blue-600" />

                  <span className="font-mono font-bold text-slate-900">
                    {d.poNumber || "-"}
                  </span>
                </div>
              </td>

              <td className="border border-slate-300 px-3 py-2 text-slate-700">
                {d.companyName || "-"}
              </td>

              <td className="border border-slate-300 px-3 py-2 font-mono text-slate-700">
                {d.itemCode || "-"}
              </td>

              <td
                className="max-w-[300px] truncate border border-slate-300 px-3 py-2 text-slate-600"
                title={d.description || ""}
              >
                {d.description || "-"}
              </td>

              <td className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-800">
                {qty(d.quantity).toLocaleString("en-IN")}
              </td>

              <td
                className={`border border-slate-300 px-3 py-2 text-right font-bold ${
                  d.availableForRejection > 0
                    ? "text-red-600"
                    : "text-slate-400"
                }`}
              >
                {qty(d.availableForRejection).toLocaleString("en-IN")}
              </td>

              <td className="border border-slate-300 px-3 py-2 font-mono text-slate-600">
                {d.billNumber || "-"}
              </td>

              <td
                className={`sticky right-0 border border-slate-300 px-2 py-1.5 text-center ${
                  index % 2 === 0 ? "bg-white" : "bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  disabled={d.availableForRejection <= 0}
                  onClick={() => setSelectedDispatch(d)}
                  className="inline-flex items-center gap-1.5 rounded border border-red-300 bg-red-50 px-3 py-1.5 text-[10px] font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>

  {/* Bottom status bar */}
  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-300 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
    <span>
      {activeTab === "rejections"
        ? `${filteredRejections.length} rejection record${
            filteredRejections.length === 1 ? "" : "s"
          }`
        : `${filteredDispatches.length} dispatch record${
            filteredDispatches.length === 1 ? "" : "s"
          }`}
    </span>

    <span>Scroll horizontally to view all columns</span>
  </div>
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