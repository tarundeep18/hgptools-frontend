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
  ChevronDown,
  ChevronRight,
  Building2,
  Hash,
  Tag,
  Layers,
  Box,
  Clock,
  FileText,
  ArrowRight,
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
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: ShieldAlert,
    color: "amber",
  },
  rework: {
    label: "Rework",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Wrench,
    color: "blue",
  },
  scrap: {
    label: "Scrap",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: Trash2,
    color: "red",
  },
  return_to_customer: {
    label: "Return to Customer",
    className: "bg-violet-50 text-violet-700 border-violet-200",
    icon: Package,
    color: "violet",
  },
  approved_for_reuse: {
    label: "Approved for Reuse",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: ShieldCheck,
    color: "emerald",
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
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const progressPercentage = rejectedQuantity > 0 
    ? Math.min(100, Math.round((alreadyStored / rejectedQuantity) * 100))
    : 0;

  return (
    <div
      className="fixed inset-0 z-[170] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inventory-dialog-title"
    >
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20 ring-1 ring-black/5">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="inventory-dialog-title" className="truncate text-xl font-bold tracking-tight">
                  Inventory & Disposition
                </h2>
                <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-400">
                  <span className="truncate">{rejection.itemCode || rejection.description || "-"}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-600" />
                  <span>PO #{rejection.poNumber || "-"}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 backdrop-blur-sm ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20"
              type="button"
              aria-label="Close inventory"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="thin-scrollbar flex-1 overflow-y-auto bg-slate-50/80">
          <div className="space-y-5 p-5 sm:p-6">
            {/* Status strip */}
            <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <div className="grid divide-y divide-slate-100 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                <SummaryCell 
                  icon={Building2}
                  label="Company" 
                  value={rejection.companyName || "-"} 
                />
                <SummaryCell 
                  icon={Clipboard}
                  label="Status" 
                  value={rejectionStatus} 
                  capitalize 
                />
                <SummaryCell 
                  icon={AlertCircle}
                  label="Reason" 
                  value={rejection.reason || "-"} 
                />
                <SummaryCell 
                  icon={Package}
                  label="Inventory Progress" 
                  value={`${alreadyStored.toLocaleString("en-IN")} / ${rejectedQuantity.toLocaleString("en-IN")}`}
                />
              </div>
            </section>

            {/* Progress bar */}
            <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Package className="h-4 w-4 text-indigo-600" />
                  Storage Progress
                </div>
                <span className="text-sm font-bold text-slate-800">{progressPercentage}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </section>

            {/* Quantity cards */}
            <section className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Rejected Quantity"
                value={rejectedQuantity.toLocaleString("en-IN")}
                helper="Total rejected items"
                tone="red"
                icon={AlertCircle}
              />
              <MetricCard
                label="Stored Quantity"
                value={alreadyStored.toLocaleString("en-IN")}
                helper="Linked to inventory"
                tone="emerald"
                icon={CheckCircle}
              />
              <MetricCard
                label="Remaining Quantity"
                value={remainingQuantity.toLocaleString("en-IN")}
                helper={remainingQuantity > 0 ? "Awaiting storage location" : "Fully stored"}
                tone={remainingQuantity > 0 ? "amber" : "emerald"}
                icon={remainingQuantity > 0 ? Clock : CheckCircle}
              />
            </section>

            {/* Errors / state messages */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!canStore && remainingQuantity > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  {rejection.status === "pending_review"
                    ? "This rejection is awaiting approval. Approve it first before storing the material."
                    : "This rejection is denied and cannot be stored in inventory."}
                </span>
              </div>
            )}

            {/* Stored material */}
            <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Stored Material</h3>
                    <p className="text-xs text-slate-500">
                      {inventoryRows.length} row{inventoryRows.length !== 1 ? "s" : ""} in inventory
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void loadInventory()}
                  className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingInventory ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              {loadingInventory ? (
                <div className="grid min-h-40 place-items-center">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
                    <p className="mt-3 text-sm text-slate-500">Loading inventory...</p>
                  </div>
                </div>
              ) : inventoryRows.length === 0 ? (
                <div className="grid min-h-40 place-items-center p-8 text-center">
                  <div>
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100">
                      <Package className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="mt-3 font-medium text-slate-700">No stored material yet</p>
                    <p className="mt-1 text-sm text-slate-400">Store rejected material below to create an inventory row.</p>
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
                className="overflow-hidden rounded-xl border border-indigo-200/60 bg-white shadow-sm"
              >
                <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-100 text-indigo-700">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Store Remaining Rejected Material</h3>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {remainingQuantity.toLocaleString("en-IN")} piece(s) remain. New material enters <span className="font-medium text-amber-600">Quarantine</span> by default.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <FormSection icon={MapPin} title="Storage Location">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Storage Location" required>
                        <input
                          name="storageLocation"
                          value={formData.storageLocation}
                          onChange={handleChange}
                          required
                          placeholder="e.g., Main Warehouse"
                          className="field"
                        />
                      </Field>
                      <Field label="Rack Number" required>
                        <input
                          name="rackNumber"
                          value={formData.rackNumber}
                          onChange={handleChange}
                          required
                          placeholder="e.g., R-12"
                          className="field"
                        />
                      </Field>
                      <Field label="Shelf Number" required>
                        <input
                          name="shelfNumber"
                          value={formData.shelfNumber}
                          onChange={handleChange}
                          required
                          placeholder="e.g., S-03"
                          className="field"
                        />
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection icon={Box} title="Quantity & Identification">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Quantity to Store" required>
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
                    <div className="grid gap-4 sm:grid-cols-2">
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
                      placeholder="Add quarantine instructions, physical condition notes, or any relevant details..."
                      className="field resize-none"
                    />
                  </Field>
                </div>

                <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-w-48 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-md hover:shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                    Store in Quarantine
                  </button>
                </div>
              </form>
            )}

            {remainingQuantity <= 0 && inventoryRows.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-emerald-800">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">All rejected material is linked to inventory.</p>
                  <p className="mt-0.5 text-sm text-emerald-700">
                    Use the stored material rows above to record Rework, Scrap, Return to Customer, or Approved for Reuse.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-200/80 bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="hidden text-sm text-slate-400 sm:block">
              Inventory quantities are linked to this rejection record.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .field {
          width: 100%;
          border: 1px solid rgb(226 232 240);
          border-radius: 0.625rem;
          background: white;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: rgb(51 65 85);
          outline: none;
          transition: border-color 150ms ease, box-shadow 150ms ease;
          font-family: inherit;
        }
        .field::placeholder {
          color: rgb(148 163 184);
        }
        .field:focus {
          border-color: rgb(99 102 241);
          box-shadow: 0 0 0 3px rgb(99 102 241 / 0.10);
        }
        .field:disabled {
          cursor: not-allowed;
          background: rgb(248 250 252);
          color: rgb(148 163 184);
        }
        .field:user-invalid {
          border-color: rgb(239 68 68);
        }
        .thin-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(148 163 184) transparent;
        }
        .thin-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .thin-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(203 213 225);
          border-radius: 999px;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(148 163 184);
        }
      `}</style>
    </div>
  );
};

function SummaryCell({ icon: Icon, label, value, capitalize = false }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`mt-0.5 truncate text-sm font-semibold text-slate-800 ${capitalize ? "capitalize" : ""}`} title={String(value || "-")}>
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper, tone = "slate", icon: Icon }) {
  const tones = {
    red: "border-red-100 bg-gradient-to-br from-red-50 to-red-50/50 text-red-700",
    emerald: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-50/50 text-emerald-700",
    amber: "border-amber-100 bg-gradient-to-br from-amber-50 to-amber-50/50 text-amber-700",
    slate: "border-slate-100 bg-white text-slate-700",
  };

  const iconTones = {
    red: "bg-red-100 text-red-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${tones[tone] || tones.slate}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">{label}</p>
        {Icon && (
          <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${iconTones[tone] || iconTones.slate}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs opacity-70">{helper}</p>
    </div>
  );
}

function FormSection({ icon: Icon, title, children }) {
  return (
    <section className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 transition-colors">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon className="h-3.5 w-3.5" />
        </div>
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
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    setNextDisposition(allowed[0] || "");
    setReason("");
  }, [current]);

  const submit = async () => {
    if (!nextDisposition) return;
    if (!reason.trim()) {
      toast.error("Enter a disposition reason");
      return;
    }
    await onUpdate(entry._id, nextDisposition, reason.trim());
  };

  const colorClasses = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-700 border-red-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <div className="p-4 hover:bg-slate-50/50 transition-colors">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-medium text-slate-400">
              #{String(entry._id || "").slice(-8)}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${colorClasses[meta.color] || colorClasses.amber}`}>
              <Icon className="h-3 w-3" /> {meta.label}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {qty(entry.quantity).toLocaleString("en-IN")} {entry.unit || "pcs"}
            </span>
          </div>
          <div className="mt-2.5 grid gap-1.5 text-sm text-slate-600 sm:grid-cols-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{entry.storageLocation || "-"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-slate-400" />
              <span>Rack {entry.rackNumber || "-"} / Shelf {entry.shelfNumber || "-"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span>Condition: {entry.condition || "-"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clipboard className="h-3.5 w-3.5 text-slate-400" />
              <span>Status: {entry.status || "-"}</span>
            </div>
          </div>
          {entry.dispositionReason && (
            <p className="mt-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
              <span className="font-medium">Latest decision:</span> {entry.dispositionReason}
            </p>
          )}
        </div>

        <div>
          {allowed.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-2 mb-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                <ArrowRight className="h-3.5 w-3.5" />
                Change Disposition
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
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
                  placeholder="Reason for change *"
                  className="field"
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={saving || !nextDisposition}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-700 hover:shadow disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  Apply
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span><span className="font-medium">Final disposition:</span> {meta.label}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">This inventory row is closed for further disposition changes.</p>
            </div>
          )}
        </div>
      </div>

      {Array.isArray(entry.dispositionHistory) && entry.dispositionHistory.length > 0 && (
        <div className="mt-3 rounded-xl border border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex w-full items-center justify-between px-3.5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Disposition History ({entry.dispositionHistory.length})
            </div>
            {historyOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {historyOpen && (
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {[...entry.dispositionHistory].reverse().map((history) => (
                <div key={history._id || `${history.date}-${history.to}`} className="grid gap-1 px-3.5 py-2.5 text-sm text-slate-600 sm:grid-cols-[180px_1fr_1fr]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatDate(history.date)}</span>
                  </div>
                  <span>
                    <span className="font-medium">{dispositionMeta[history.from]?.label || history.from || "-"}</span>
                    <ArrowRight className="mx-1.5 inline h-3 w-3 text-slate-400" />
                    <span className="font-medium">{dispositionMeta[history.to]?.label || history.to || "-"}</span>
                  </span>
                  <span className="text-slate-500">{history.reason || "-"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export default Inventory;