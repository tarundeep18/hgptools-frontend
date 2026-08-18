import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Package,
  Save,
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

export default function RejectionForm({ dispatch, onClose, onSaved }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    rejectedQuantity: "",
    reason: "",
    subReason: "",
    severity: "medium",
    requiresReplacement: true,
    rejectionDate: today(),
    inspectorName: user?.name || user?.username || "",
    notes: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm((current) => ({
      ...current,
      inspectorName: current.inspectorName || user?.name || user?.username || "",
    }));
  }, [user]);

  const maximum = qty(dispatch?.availableForRejection ?? dispatch?.quantity);
  const rejected = qty(form.rejectedQuantity);
  const isPartial = rejected > 0 && rejected < maximum;

  const validation = useMemo(() => {
    const next = {};
    if (!dispatch?.poId) next.form = "This dispatch is missing its PO database id.";
    if (!dispatch?.dispatchId) next.form = "This dispatch is missing its dispatch id.";
    if (!(rejected > 0)) next.rejectedQuantity = "Enter a rejection quantity greater than zero.";
    if (rejected > maximum) {
      next.rejectedQuantity = `Maximum available rejection quantity is ${maximum.toLocaleString("en-IN")}.`;
    }
    if (!form.reason) next.reason = "Select a rejection reason.";
    if (!form.rejectionDate) next.rejectionDate = "Select the rejection date.";
    return next;
  }, [dispatch, form.reason, form.rejectionDate, maximum, rejected]);

  const submit = async (event) => {
    event.preventDefault();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      const result = await rejectionApi.create({
        poId: dispatch.poId,
        dispatchId: dispatch.dispatchId,
        rejectedQuantity: rejected,
        reason: form.reason,
        subReason: form.subReason.trim(),
        severity: form.severity,
        requiresReplacement: form.requiresReplacement,
        rejectionDate: form.rejectionDate,
        inspectorName: form.inspectorName.trim(),
        notes: form.notes.trim(),
      });
      toast.success("Rejection submitted for review");
      onSaved?.(result);
      onClose?.();
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not create rejection");
      setErrors({ form: message });
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
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-rose-600 to-red-600 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Record Rejection</h2>
              <p className="text-xs text-red-100">
                {dispatch.poNumber || "PO"} · {dispatch.itemCode || dispatch.description || "Item"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Company" value={dispatch.companyName || "-"} icon={Package} />
            <Info label="PO" value={dispatch.poNumber || "-"} icon={Package} />
            <Info label="Dispatch Qty" value={qty(dispatch.quantity).toLocaleString("en-IN")} icon={Truck} />
            <Info label="Available to Reject" value={maximum.toLocaleString("en-IN")} icon={CheckCircle2} />
          </div>

          {errors.form && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errors.form}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rejected Quantity" error={errors.rejectedQuantity} required>
              <input
                type="number"
                min="0"
                step="1"
                max={maximum}
                value={form.rejectedQuantity}
                onChange={(e) => setForm((x) => ({ ...x, rejectedQuantity: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="e.g. 50"
              />
              {rejected > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {isPartial ? "Partial rejection" : "Full dispatch rejection"}
                </p>
              )}
            </Field>

            <Field label="Rejection Date" error={errors.rejectionDate} required>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={form.rejectionDate}
                  onChange={(e) => setForm((x) => ({ ...x, rejectionDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </Field>
          </div>

          <Field label="Reason" error={errors.reason} required>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {REASONS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((x) => ({ ...x, reason: value }))}
                  className={`rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${
                    form.reason === value
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Severity">
              <select
                value={form.severity}
                onChange={(e) => setForm((x) => ({ ...x, severity: e.target.value }))}
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
                value={form.inspectorName}
                onChange={(e) => setForm((x) => ({ ...x, inspectorName: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-red-500"
                placeholder="Inspector name"
              />
            </Field>
          </div>

          <Field label="Detailed Reason">
            <textarea
              rows={2}
              value={form.subReason}
              onChange={(e) => setForm((x) => ({ ...x, subReason: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-red-500"
              placeholder="Optional defect details"
            />
          </Field>

          <Field label="Notes">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((x) => ({ ...x, notes: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-red-500"
              placeholder="Optional comments"
            />
          </Field>

          <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <input
              type="checkbox"
              checked={form.requiresReplacement}
              onChange={(e) => setForm((x) => ({ ...x, requiresReplacement: e.target.checked }))}
              className="mt-1 h-4 w-4 accent-red-600"
            />
            <span>
              <span className="block text-sm font-semibold text-amber-900">Replacement required</span>
              <span className="block text-xs leading-5 text-amber-700">
                When approved, this rejected quantity will reopen the PO pending balance.
              </span>
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Submit Rejection
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}{required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function Info({ label, value, icon: Icon }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-800" title={String(value)}>{value}</div>
    </div>
  );
}
