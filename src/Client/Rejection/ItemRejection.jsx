import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Package,
  Plus,
  Save,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import rejectionApi, { getApiErrorMessage } from "./../rejectionApi.js";

const REASONS = [
  ["dimensional", "Dimensional out of tolerance"],
  ["visual", "Visual defect / damage"],
  ["wrong_item", "Wrong item / specification"],
  ["material", "Material issue"],
  ["surface", "Surface / finish issue"],
  ["quantity", "Quantity mismatch"],
  ["functional", "Functional failure"],
  ["other", "Other"],
];

const today = () => new Date().toISOString().slice(0, 10);
const qty = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};

let rowCounter = 0;
const makeRow = (inspectorName = "") => ({
  id: `rejection-${Date.now()}-${++rowCounter}`,
  rejectedQuantity: "",
  reason: "",
  subReason: "",
  severity: "medium",
  requiresReplacement: true,
  rejectionDate: today(),
  inspectorName,
  notes: "",
});

export default function ItemRejection({ dispatch, onClose, onSaved }) {
  const { user } = useAuth();
  const inspector = user?.name || user?.username || "";
  const [submitting, setSubmitting] = useState(false);
  const [rows, setRows] = useState(() => [makeRow(inspector)]);
  const [error, setError] = useState("");

  const maximum = qty(dispatch?.availableForRejection ?? dispatch?.quantity);
  const totalRejected = useMemo(
    () => rows.reduce((sum, row) => sum + qty(row.rejectedQuantity), 0),
    [rows],
  );
  const remaining = Math.max(0, maximum - totalRejected);

  const updateRow = (id, field, value) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
    setError("");
  };

  const addRow = () => {
    if (totalRejected >= maximum) {
      setError("No quantity remains available for another rejection entry.");
      return;
    }
    setRows((current) => [...current, makeRow(inspector)]);
  };

  const removeRow = (id) => {
    setRows((current) =>
      current.length === 1 ? current : current.filter((row) => row.id !== id),
    );
    setError("");
  };

  const validate = () => {
    if (!dispatch?.poId) return "This dispatch is missing its PO database id.";
    if (!dispatch?.dispatchId) return "This dispatch is missing its dispatch id.";
    if (rows.length === 0) return "Add at least one rejection.";

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (!(qty(row.rejectedQuantity) > 0)) {
        return `Rejection ${index + 1}: enter a quantity greater than zero.`;
      }
      if (!row.reason) return `Rejection ${index + 1}: select a reason.`;
      if (!row.rejectionDate) {
        return `Rejection ${index + 1}: select the rejection date.`;
      }
    }

    if (totalRejected > maximum) {
      return `Total rejected quantity ${totalRejected.toLocaleString(
        "en-IN",
      )} exceeds the available ${maximum.toLocaleString("en-IN")}.`;
    }
    return "";
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const result = await rejectionApi.createMany({
        poId: dispatch.poId,
        dispatchId: dispatch.dispatchId,
        rejections: rows.map((row) => ({
          rejectedQuantity: qty(row.rejectedQuantity),
          reason: row.reason,
          subReason: row.subReason.trim(),
          severity: row.severity,
          requiresReplacement: row.requiresReplacement,
          rejectionDate: row.rejectionDate,
          inspectorName: row.inspectorName.trim(),
          notes: row.notes.trim(),
        })),
      });

      toast.success(
        `${rows.length} rejection${rows.length === 1 ? "" : "s"} submitted for review`,
      );
      onSaved?.(result);
      onClose?.();
    } catch (submitError) {
      const message = getApiErrorMessage(
        submitError,
        "Could not create rejection entries",
      );
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!dispatch) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-rose-600 to-red-600 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Record Rejections</h2>
              <p className="text-xs text-red-100">
                {dispatch.poNumber || "PO"} ·{" "}
                {dispatch.itemCode || dispatch.description || "Item"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <Info label="Company" value={dispatch.companyName || "-"} icon={Package} />
            <Info label="PO" value={dispatch.poNumber || "-"} icon={Package} />
            <Info
              label="Dispatch Qty"
              value={qty(dispatch.quantity).toLocaleString("en-IN")}
              icon={Truck}
            />
            <Info
              label="Available to Reject"
              value={maximum.toLocaleString("en-IN")}
              icon={CheckCircle2}
            />
            <Info
              label="Remaining after draft"
              value={remaining.toLocaleString("en-IN")}
              icon={CheckCircle2}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {rows.map((row, index) => (
              <section
                key={row.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Rejection #{index + 1}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Quantity + reason are stored as a separate history record.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1 || submitting}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Rejected Quantity" required>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      max={maximum}
                      value={row.rejectedQuantity}
                      onChange={(e) =>
                        updateRow(row.id, "rejectedQuantity", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      placeholder="e.g. 20"
                    />
                  </Field>

                  <Field label="Rejection Date" required>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="date"
                        value={row.rejectionDate}
                        onChange={(e) =>
                          updateRow(row.id, "rejectionDate", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 outline-none focus:border-red-500"
                      />
                    </div>
                  </Field>

                  <Field label="Severity">
                    <select
                      value={row.severity}
                      onChange={(e) =>
                        updateRow(row.id, "severity", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-red-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </Field>

                  <Field label="Inspector">
                    <input
                      value={row.inspectorName}
                      onChange={(e) =>
                        updateRow(row.id, "inspectorName", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-red-500"
                      placeholder="Inspector name"
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label="Reason" required>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {REASONS.map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateRow(row.id, "reason", value)}
                          className={`rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${
                            row.reason === value
                              ? "border-red-500 bg-red-50 text-red-700"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Detailed Reason">
                    <textarea
                      rows={2}
                      value={row.subReason}
                      onChange={(e) =>
                        updateRow(row.id, "subReason", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-red-500"
                      placeholder="Optional defect details"
                    />
                  </Field>
                  <Field label="Notes">
                    <textarea
                      rows={2}
                      value={row.notes}
                      onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-red-500"
                      placeholder="Optional comments"
                    />
                  </Field>
                </div>

                <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <input
                    type="checkbox"
                    checked={row.requiresReplacement}
                    onChange={(e) =>
                      updateRow(row.id, "requiresReplacement", e.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-red-600"
                  />
                  <span className="text-xs text-amber-800">
                    <strong>Replacement required.</strong> When this rejection is
                    approved, its quantity reopens the PO pending balance.
                  </span>
                </label>
              </section>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            disabled={submitting || totalRejected >= maximum}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add another rejection
          </button>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Draft total: <strong>{totalRejected.toLocaleString("en-IN")}</strong>{" "}
            / {maximum.toLocaleString("en-IN")}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rows.length === 0 || totalRejected <= 0}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Submit {rows.length > 1 ? `${rows.length} Rejections` : "Rejection"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Info({ label, value, icon: Icon }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}
