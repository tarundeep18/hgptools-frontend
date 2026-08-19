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

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Rejection Inventory & Disposition</h2>
                <p className="text-xs text-slate-300">
                  {rejection.poNumber || "-"} · {rejection.itemCode || rejection.description || "-"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-white/10"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <section className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold text-red-800">
              <Clipboard className="h-4 w-4" /> Rejection Summary
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <span><b>Company:</b> {rejection.companyName || "-"}</span>
              <span><b>PO:</b> {rejection.poNumber || "-"}</span>
              <span><b>Item:</b> {rejection.itemCode || "-"}</span>
              <span><b>Status:</b> {rejection.status || "-"}</span>
              <span><b>Rejected:</b> {rejectedQuantity.toLocaleString("en-IN")}</span>
              <span><b>Stored:</b> {alreadyStored.toLocaleString("en-IN")}</span>
              <span className="font-semibold text-red-700">
                Remaining: {remainingQuantity.toLocaleString("en-IN")}
              </span>
              <span><b>Reason:</b> {rejection.reason || "-"}</span>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <h3 className="font-bold text-slate-800">Stored Material</h3>
                <p className="text-xs text-slate-500">
                  Disposition is controlled per inventory row so different quantities can follow different paths.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadInventory()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingInventory ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {loadingInventory ? (
              <div className="grid min-h-28 place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              </div>
            ) : inventoryRows.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                No rejected material has been stored yet.
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

          {error && (
            <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {!canStore && remainingQuantity > 0 && (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {rejection.status === "pending_review"
                ? "This rejection is waiting for approval. Approve it first, then store the material."
                : "This rejection is denied and cannot be stored in inventory."}
            </div>
          )}

          {remainingQuantity > 0 && canStore && (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  New rejected material always enters <b>Quarantine</b>. A disposition decision can be made after it is stored.
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">Store Remaining Rejected Material</h3>
                  <p className="text-xs text-slate-500">
                    {remainingQuantity.toLocaleString("en-IN")} piece(s) still need a physical inventory location.
                  </p>
                </div>
              </div>

              <section className="rounded-xl bg-white p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
                  <MapPin className="h-4 w-4 text-emerald-600" /> Storage Location
                </h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Storage Location *">
                    <input name="storageLocation" value={formData.storageLocation} onChange={handleChange} required placeholder="Rejection Store" className="field" />
                  </Field>
                  <Field label="Rack Number *">
                    <input name="rackNumber" value={formData.rackNumber} onChange={handleChange} required placeholder="R-12" className="field" />
                  </Field>
                  <Field label="Shelf Number *">
                    <input name="shelfNumber" value={formData.shelfNumber} onChange={handleChange} required placeholder="S-03" className="field" />
                  </Field>
                </div>
              </section>

              <section className="rounded-xl bg-white p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
                  <Package className="h-4 w-4 text-emerald-600" /> Quantity & Identification
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Quantity to Store *">
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="0.01" max={remainingQuantity} step="0.01" required className="field" />
                  </Field>
                  <Field label="Unit">
                    <input name="unit" value={formData.unit} onChange={handleChange} className="field" />
                  </Field>
                  <Field label="Batch Number">
                    <input name="batchNumber" value={formData.batchNumber} onChange={handleChange} placeholder="Optional" className="field" />
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
              </section>

              <section className="rounded-xl bg-white p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
                  <Calendar className="h-4 w-4 text-emerald-600" /> Dates
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Manufacture Date">
                    <input type="date" name="manufactureDate" value={formData.manufactureDate} onChange={handleChange} className="field" />
                  </Field>
                  <Field label="Expiry Date">
                    <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="field" />
                  </Field>
                </div>
              </section>

              <Field label="Notes">
                <textarea name="notes" rows="2" value={formData.notes} onChange={handleChange} placeholder="Quarantine instructions, physical condition, etc." className="field resize-none" />
              </Field>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-w-48 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                  Store in Quarantine
                </button>
              </div>
            </form>
          )}

          {remainingQuantity <= 0 && inventoryRows.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle className="h-4 w-4" /> All rejected material is linked to inventory.
              </div>
              <p className="mt-1 text-xs">
                Use each inventory row above to record Rework, Scrap, Return to Customer, or Approved for Reuse.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        .field {
          width: 100%;
          border: 1px solid rgb(226 232 240);
          border-radius: 0.75rem;
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .field:focus {
          border-color: rgb(16 185 129);
          box-shadow: 0 0 0 3px rgb(16 185 129 / 0.10);
        }
      `}</style>
    </div>
  );
};

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
