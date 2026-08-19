import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clipboard,
  History,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL =
  import.meta.env.VITE_REACT_APP_BACKEND_BASEURL ||
  "http://localhost:5000/api/v1";

const qty = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

const dispositionMeta = {
  quarantine: {
    label: "Quarantine",
    className: "bg-amber-100 text-amber-800",
    icon: ShieldAlert,
  },
  rework: {
    label: "Rework",
    className: "bg-blue-100 text-blue-800",
    icon: Wrench,
  },
  scrap: {
    label: "Scrap",
    className: "bg-red-100 text-red-800",
    icon: Trash2,
  },
  return_to_customer: {
    label: "Return to Customer",
    className: "bg-violet-100 text-violet-800",
    icon: Package,
  },
  approved_for_reuse: {
    label: "Approved for Reuse",
    className: "bg-emerald-100 text-emerald-800",
    icon: ShieldCheck,
  },
};

const transitions = {
  quarantine: ["rework", "scrap", "return_to_customer", "approved_for_reuse"],
  rework: ["quarantine", "scrap", "return_to_customer", "approved_for_reuse"],
  approved_for_reuse: ["quarantine"],
  scrap: [],
  return_to_customer: [],
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("en-IN");
};

const Inventory = ({ rejection, onClose, onSuccess }) => {
  const rejectedQuantity = qty(rejection?.rejectedQuantity);
  const rejectionStoredQuantity = qty(rejection?.inventoryAddedQuantity);
  const canStore = ["approved", "recorded"].includes(rejection?.status);
  const [inventoryRows, setInventoryRows] = useState([]);
  const inventoryStoredQuantity = useMemo(
    () => inventoryRows.reduce((sum, entry) => sum + qty(entry.quantity), 0),
    [inventoryRows],
  );
  const alreadyStored = Math.max(rejectionStoredQuantity, inventoryStoredQuantity);
  const remainingQuantity = Math.max(0, rejectedQuantity - alreadyStored);

  const initialQuantity = useMemo(
    () => (remainingQuantity > 0 ? remainingQuantity : 0),
    [remainingQuantity],
  );

  const [formData, setFormData] = useState({
    storageLocation: "",
    rackNumber: "",
    shelfNumber: "",
    quantity: initialQuantity,
    condition: "good",
    batchNumber: "",
    unit: "pcs",
    expiryDate: "",
    manufactureDate: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [dispositionSavingId, setDispositionSavingId] = useState("");

  const loadInventory = useCallback(async () => {
    if (!rejection?._id) return;
    setLoadingInventory(true);
    try {
      const response = await axios.get(
        `${API_URL}/inventory/rejection/${rejection._id}`,
        { withCredentials: true },
      );
      setInventoryRows(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (loadError) {
      console.error("Could not load rejection inventory:", loadError);
      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Could not load inventory history",
      );
    } finally {
      setLoadingInventory(false);
    }
  }, [rejection?._id]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      quantity: remainingQuantity,
      unit: rejection?.unit || current.unit || "pcs",
      batchNumber: rejection?.batchNumber || rejection?.batchNo || "",
    }));
    setError("");
  }, [rejection, remainingQuantity]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!rejection?._id || loading) return;

    if (!canStore) {
      setError(
        rejection.status === "pending_review"
          ? "Approve this rejection before storing it in inventory."
          : "Denied rejection cannot be stored in inventory.",
      );
      return;
    }

    const quantity = Number(formData.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Enter a quantity greater than zero.");
      return;
    }
    if (quantity > remainingQuantity) {
      setError(`Only ${remainingQuantity} rejected piece(s) remain to store.`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${API_URL}/inventory/rejection/${rejection._id}/add-to-inventory`,
        { ...formData, quantity },
        { withCredentials: true },
      );

      toast.success(response.data?.message || "Rejected material stored in inventory");
      await loadInventory();
      await onSuccess?.(response.data?.data, { close: false });
      setFormData((current) => ({
        ...current,
        storageLocation: "",
        rackNumber: "",
        shelfNumber: "",
        notes: "",
      }));
    } catch (submitError) {
      const message =
        submitError?.response?.data?.message ||
        submitError?.message ||
        "Failed to store rejected material in inventory";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateDisposition = async (inventoryId, disposition, reason) => {
    if (!inventoryId || dispositionSavingId) return;
    setDispositionSavingId(inventoryId);
    setError("");
    try {
      const response = await axios.patch(
        `${API_URL}/inventory/${inventoryId}/disposition`,
        { disposition, reason },
        { withCredentials: true },
      );
      toast.success(response.data?.message || "Disposition updated");
      await loadInventory();
      await onSuccess?.(response.data?.data, { close: false });
    } catch (updateError) {
      const message =
        updateError?.response?.data?.message ||
        updateError?.message ||
        "Failed to update disposition";
      setError(message);
      toast.error(message);
    } finally {
      setDispositionSavingId("");
    }
  };

  if (!rejection) return null;

  const rejectionStatus = String(rejection.status || "-").replaceAll("_", " ");

  return (
    <div
      className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/65 p-2 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inventory-dialog-title"
    >
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 px-5 py-4 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/15 shadow-inner">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="inventory-dialog-title" className="truncate text-lg font-bold tracking-tight sm:text-xl">
                  Rejection Inventory & Disposition
                </h2>
                <p className="mt-0.5 truncate text-xs text-violet-100 sm:text-sm">
                  {rejection.itemCode || rejection.description || "-"} · PO {rejection.poNumber || "-"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10 transition hover:bg-white/20"
              type="button"
              aria-label="Close inventory"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="thin-scrollbar flex-1 overflow-y-auto bg-slate-50/70">
          <div className="space-y-4 p-4 sm:p-5">
            {/* Status strip */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                <SummaryCell label="Company" value={rejection.companyName || "-"} />
                <SummaryCell label="Status" value={rejectionStatus} capitalize />
                <SummaryCell label="Reason" value={rejection.reason || "-"} />
                <SummaryCell label="Inventory Progress" value={`${alreadyStored.toLocaleString("en-IN")} / ${rejectedQuantity.toLocaleString("en-IN")}`} />
              </div>
            </section>

            {/* Quantity cards */}
            <section className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Rejected Quantity"
                value={rejectedQuantity.toLocaleString("en-IN")}
                helper="Total rejected"
                tone="red"
              />
              <MetricCard
                label="Stored Quantity"
                value={alreadyStored.toLocaleString("en-IN")}
                helper="Linked to inventory"
                tone="emerald"
              />
              <MetricCard
                label="Remaining Quantity"
                value={remainingQuantity.toLocaleString("en-IN")}
                helper={remainingQuantity > 0 ? "Still needs a location" : "Fully stored"}
                tone={remainingQuantity > 0 ? "amber" : "emerald"}
              />
            </section>

            {/* Errors / state messages */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!canStore && remainingQuantity > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {rejection.status === "pending_review"
                    ? "This rejection is waiting for approval. Approve it first, then store the material."
                    : "This rejection is denied and cannot be stored in inventory."}
                </span>
              </div>
            )}

            {/* Stored material */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-violet-600" />
                    <h3 className="font-bold text-slate-800">Stored Material</h3>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Each stored inventory row can follow its own disposition path.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void loadInventory()}
                  className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingInventory ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              {loadingInventory ? (
                <div className="grid min-h-32 place-items-center">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-600" />
                    <p className="mt-2 text-xs text-slate-500">Loading inventory...</p>
                  </div>
                </div>
              ) : inventoryRows.length === 0 ? (
                <div className="grid min-h-32 place-items-center p-6 text-center">
                  <div>
                    <Package className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-600">No stored material yet</p>
                    <p className="mt-1 text-xs text-slate-400">Store rejected material below to create an inventory row.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {inventoryRows.map((entry) => (
                    <InventoryDispositionRow
                      key={entry._id}
                      entry={entry}
                      saving={dispositionSavingId === entry._id}
                      onUpdate={updateDisposition}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Store remaining */}
            {remainingQuantity > 0 && canStore && (
              <form
                onSubmit={handleSubmit}
                className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm"
              >
                <div className="border-b border-violet-100 bg-violet-50/70 px-4 py-3 sm:px-5">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Store Remaining Rejected Material</h3>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">
                        {remainingQuantity.toLocaleString("en-IN")} piece(s) still need a physical location. New material enters <b>Quarantine</b> first.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-4 sm:p-5">
                  <FormSection icon={MapPin} title="Storage Location">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Storage Location *">
                        <input
                          name="storageLocation"
                          value={formData.storageLocation}
                          onChange={handleChange}
                          required
                          placeholder="Rejection Store"
                          className="field"
                        />
                      </Field>
                      <Field label="Rack Number *">
                        <input
                          name="rackNumber"
                          value={formData.rackNumber}
                          onChange={handleChange}
                          required
                          placeholder="R-12"
                          className="field"
                        />
                      </Field>
                      <Field label="Shelf Number *">
                        <input
                          name="shelfNumber"
                          value={formData.shelfNumber}
                          onChange={handleChange}
                          required
                          placeholder="S-03"
                          className="field"
                        />
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection icon={Package} title="Quantity & Identification">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Quantity to Store *">
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          min="0.01"
                          max={remainingQuantity}
                          step="0.01"
                          required
                          className="field"
                        />
                      </Field>
                      <Field label="Unit">
                        <input name="unit" value={formData.unit} onChange={handleChange} className="field" />
                      </Field>
                      <Field label="Batch Number">
                        <input
                          name="batchNumber"
                          value={formData.batchNumber}
                          onChange={handleChange}
                          placeholder="Optional"
                          className="field"
                        />
                      </Field>
                      <Field label="Condition">
                        <select name="condition" value={formData.condition} onChange={handleChange} className="field">
                          <option value="excellent">Excellent</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                        </select>
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection icon={Calendar} title="Dates">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Manufacture Date">
                        <input
                          type="date"
                          name="manufactureDate"
                          value={formData.manufactureDate}
                          onChange={handleChange}
                          className="field"
                        />
                      </Field>
                      <Field label="Expiry Date">
                        <input
                          type="date"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleChange}
                          className="field"
                        />
                      </Field>
                    </div>
                  </FormSection>

                  <Field label="Notes">
                    <textarea
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Quarantine instructions, physical condition, etc."
                      className="field resize-none"
                    />
                  </Field>
                </div>

                <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-w-48 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                    Store in Quarantine
                  </button>
                </div>
              </form>
            )}

            {remainingQuantity <= 0 && inventoryRows.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">All rejected material is linked to inventory.</p>
                  <p className="mt-0.5 text-xs leading-5 text-emerald-700">
                    Use the stored material rows above to record Rework, Scrap, Return to Customer, or Approved for Reuse.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <p className="hidden text-xs text-slate-400 sm:block">
              Inventory quantities are linked to this rejection record.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .field {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 0.5rem;
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(51 65 85);
          outline: none;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }
        .field::placeholder {
          color: rgb(148 163 184);
        }
        .field:focus {
          border-color: rgb(124 58 237);
          box-shadow: 0 0 0 3px rgb(124 58 237 / 0.10);
        }
        .field:disabled {
          cursor: not-allowed;
          background: rgb(248 250 252);
          color: rgb(148 163 184);
        }
        .thin-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(148 163 184) transparent;
        }
        .thin-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(148 163 184);
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
};

function SummaryCell({ label, value, capitalize = false }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold text-slate-800 ${capitalize ? "capitalize" : ""}`} title={String(value || "-")}>
        {value || "-"}
      </p>
    </div>
  );
}

function MetricCard({ label, value, helper, tone = "slate" }) {
  const tones = {
    red: "border-red-200 bg-red-50/70 text-red-700",
    emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-700",
    amber: "border-amber-200 bg-amber-50/70 text-amber-700",
    slate: "border-slate-200 bg-white text-slate-700",
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${tones[tone] || tones.slate}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs opacity-70">{helper}</p>
    </div>
  );
}

function FormSection({ icon: Icon, title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
        <Icon className="h-4 w-4 text-violet-600" />
        {title}
      </h4>
      {children}
    </section>
  );
}

function InventoryDispositionRow({ entry, saving, onUpdate }) {
  const current = entry.disposition || "quarantine";
  const meta = dispositionMeta[current] || dispositionMeta.quarantine;
  const Icon = meta.icon;
  const allowed = transitions[current] || [];
  const [nextDisposition, setNextDisposition] = useState(allowed[0] || "");
  const [reason, setReason] = useState("");

  useEffect(() => {
    setNextDisposition(allowed[0] || "");
    setReason("");
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!nextDisposition) return;
    if (!reason.trim()) {
      toast.error("Enter a disposition reason");
      return;
    }
    await onUpdate(entry._id, nextDisposition, reason.trim());
  };

  return (
    <div className="p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500">
              #{String(entry._id || "").slice(-8)}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${meta.className}`}>
              <Icon className="h-3 w-3" /> {meta.label}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
              {qty(entry.quantity).toLocaleString("en-IN")} {entry.unit || "pcs"}
            </span>
          </div>
          <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
            <span><b>Location:</b> {entry.storageLocation || "-"}</span>
            <span><b>Rack/Shelf:</b> {entry.rackNumber || "-"} / {entry.shelfNumber || "-"}</span>
            <span><b>Condition:</b> {entry.condition || "-"}</span>
            <span><b>Physical Status:</b> {entry.status || "-"}</span>
          </div>
          {entry.dispositionReason && (
            <p className="mt-2 text-xs text-slate-500">
              <b>Latest decision:</b> {entry.dispositionReason}
            </p>
          )}
        </div>

        <div>
          {allowed.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Change Disposition
              </div>
              <div className="grid gap-2 sm:grid-cols-[180px_1fr_auto]">
                <select
                  value={nextDisposition}
                  onChange={(e) => setNextDisposition(e.target.value)}
                  className="field"
                  disabled={saving}
                >
                  {allowed.map((value) => (
                    <option key={value} value={value}>
                      {dispositionMeta[value]?.label || value}
                    </option>
                  ))}
                </select>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason / decision reference *"
                  className="field"
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={saving || !nextDisposition}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  Apply
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <b>Final disposition:</b> {meta.label}. This inventory row is closed for further disposition changes.
            </div>
          )}
        </div>
      </div>

      {Array.isArray(entry.dispositionHistory) && entry.dispositionHistory.length > 0 && (
        <details className="mt-3 rounded-xl border border-slate-100 bg-white">
          <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600">
            <History className="h-3.5 w-3.5" /> Disposition History ({entry.dispositionHistory.length})
          </summary>
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {[...entry.dispositionHistory].reverse().map((history) => (
              <div key={history._id || `${history.date}-${history.to}`} className="grid gap-1 px-3 py-2 text-xs text-slate-600 sm:grid-cols-[180px_1fr_1fr]">
                <span>{formatDate(history.date)}</span>
                <span>
                  {(dispositionMeta[history.from]?.label || history.from || "-")} → {dispositionMeta[history.to]?.label || history.to || "-"}
                </span>
                <span>{history.reason || "-"}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export default Inventory;
