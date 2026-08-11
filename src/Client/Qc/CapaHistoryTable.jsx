// CAPAHistoryFull.jsx - With Edit and Delete Modals

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AlertTriangle,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  Search,
  Download,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building2,
  Activity,
  Wrench,
  ShieldCheck,
  ClipboardCheck,
  Zap,
  Trash2,
  Pencil,
  X,
  Save,
} from "lucide-react";

// ============================================================
// CONFIGURATION
// ============================================================
const API_ROOT =
  import.meta.env.VITE_REACT_APP_BACKEND_BASEURL ||
  "http://localhost:5000/api/v1";
const SPC_EVENTS_API = `${API_ROOT}/spc/alert/spc-events`;

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const formatDateOnly = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString();
};

const formatNumber = (value, decimals = 4) => {
  if (value === null || value === undefined || value === "") return "—";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(decimals) : String(value);
};

// ============================================================
// STYLING HELPERS
// ============================================================
const severityClasses = (severity) => {
  const normalized = String(severity || "").toLowerCase();
  if (normalized === "critical")
    return "bg-rose-100 text-rose-700 border-rose-200";
  if (normalized === "warning")
    return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const statusClasses = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "OPEN") return "bg-blue-100 text-blue-700 border-blue-200";
  if (normalized === "UNDER_INVESTIGATION")
    return "bg-amber-100 text-amber-700 border-amber-200";
  if (normalized === "ACTION_TAKEN")
    return "bg-purple-100 text-purple-700 border-purple-200";
  if (normalized === "VERIFICATION_PENDING")
    return "bg-orange-100 text-orange-700 border-orange-200";
  if (normalized === "RESOLVED" || normalized === "CLOSED")
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const sourceClasses = (source) => {
  const normalized = String(source || "").toUpperCase();
  if (
    normalized === "INSPECTION REJECTION" ||
    normalized === "INSPECTION_REJECTION"
  )
    return "bg-rose-50 text-rose-700 border-rose-200";
  if (normalized === "SPC ALERT" || normalized === "SPC_ALERT")
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

const Pill = ({ children, className = "" }) => (
  <span
    className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
  >
    {children}
  </span>
);


const EditSPCAlertModal = ({ event, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    // Core SPC Alert fields (from SimpleSPCAlertModal)
    status: event?.status || "DRAFT",
    createCapa: event?.capa?.created || false,
    capaNumber: event?.capa?.number || event?.capaNumber || "",
    capaTitle: event?.capa?.title || event?.capaTitle || "",
    source: event?.source || "SPC ALERT",
    severity: event?.priority || event?.severity || "MEDIUM",
    
    // Investigation fields
    problem: event?.investigation?.problemStatement || "",
    immediateContainment: event?.containment?.immediateAction || "",
    rootCause: event?.investigation?.rootCause || "",
    
    // Action fields
    correctiveAction: event?.correctiveAction?.action || "",
    preventiveAction: event?.correctiveAction?.preventiveAction || "",
    
    // Assignment & Dates
    assignedTo: event?.assignedTo || "",
    targetDate: event?.correctiveAction?.dueDate ? 
      new Date(event.correctiveAction.dueDate).toISOString().slice(0, 10) : "",
    
    // Verification fields
    effectivenessCheck: event?.verification?.effectivenessNotes || "",
    verification: event?.verification?.result || "PENDING",
    verifiedBy: event?.verification?.verifiedBy || "",
    approvedBy: event?.approvals?.qualityManager || "",
    closureDate: event?.resolvedAt ? 
      new Date(event.resolvedAt).toISOString().slice(0, 10) : "",
    
    // Comments
    comments: event?.comments || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inspectors, setInspectors] = useState([]);
  const [loadingInspectors, setLoadingInspectors] = useState(false);

  // Fetch inspectors for dropdown
  useEffect(() => {
    const fetchInspectors = async () => {
      setLoadingInspectors(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/employee`,
          { withCredentials: true },
        );
        if (response.data.success) setInspectors(response.data.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoadingInspectors(false);
      }
    };
    fetchInspectors();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    if (formData.createCapa) {
      if (!formData.capaTitle.trim()) {
        setError("CAPA title is required.");
        setLoading(false);
        return;
      }
      if (!formData.problem.trim()) {
        setError("Problem statement is required.");
        setLoading(false);
        return;
      }
      if (!formData.assignedTo) {
        setError("Responsible person is required.");
        setLoading(false);
        return;
      }
      if (!formData.targetDate) {
        setError("Target completion date is required.");
        setLoading(false);
        return;
      }
    }

    // Prepare payload with only SPC alert fields
    const payload = {
      status: formData.status,
      createCapa: formData.createCapa,
      capaTitle: formData.capaTitle,
      source: formData.source,
      priority: formData.severity,
      problem: formData.problem,
      immediateContainment: formData.immediateContainment,
      rootCause: formData.rootCause,
      correctiveAction: formData.correctiveAction,
      preventiveAction: formData.preventiveAction,
      assignedTo: formData.assignedTo,
      targetDate: formData.targetDate,
      effectivenessCheck: formData.effectivenessCheck,
      verification: formData.verification,
      verifiedBy: formData.verifiedBy,
      approvedBy: formData.approvedBy,
      closureDate: formData.closureDate,
      comments: formData.comments,
    };

    const result = await onSave(event._id, payload);
    if (result.success) {
      onClose();
    } else {
      setError(result.message || "Failed to update SPC alert");
    }
    setLoading(false);
  };

  if (!event) return null;

  const isClosed = formData.status === "CLOSED";

  // ============================================================
// STATUS BADGE COMPONENT (Add this before EditSPCAlertModal)
// ============================================================
const StatusBadge = ({ status }) => {
  const STATUS_CONFIG = {
    DRAFT: {
      label: "Draft",
      bg: "bg-gradient-to-r from-slate-100 to-slate-200",
      text: "text-slate-700",
      dot: "bg-slate-400",
      border: "border-slate-300",
    },
    OPEN: {
      label: "Open",
      bg: "bg-gradient-to-r from-blue-50 to-blue-100",
      text: "text-blue-700",
      dot: "bg-blue-500",
      border: "border-blue-300",
    },
    ACKNOWLEDGED: {
      label: "Acknowledged",
      bg: "bg-gradient-to-r from-indigo-50 to-indigo-100",
      text: "text-indigo-700",
      dot: "bg-indigo-500",
      border: "border-indigo-300",
    },
    UNDER_INVESTIGATION: {
      label: "Under Investigation",
      bg: "bg-gradient-to-r from-amber-50 to-amber-100",
      text: "text-amber-700",
      dot: "bg-amber-500",
      border: "border-amber-300",
    },
    ACTION_TAKEN: {
      label: "Action Taken",
      bg: "bg-gradient-to-r from-purple-50 to-purple-100",
      text: "text-purple-700",
      dot: "bg-purple-500",
      border: "border-purple-300",
    },
    VERIFICATION_PENDING: {
      label: "Verification Pending",
      bg: "bg-gradient-to-r from-orange-50 to-orange-100",
      text: "text-orange-700",
      dot: "bg-orange-500",
      border: "border-orange-300",
    },
    CLOSED: {
      label: "Closed",
      bg: "bg-gradient-to-r from-emerald-50 to-emerald-100",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      border: "border-emerald-300",
    },
    REOPENED: {
      label: "Reopened",
      bg: "bg-gradient-to-r from-rose-50 to-rose-100",
      text: "text-rose-700",
      dot: "bg-rose-500",
      border: "border-rose-300",
    },
    ARCHIVED: {
      label: "Archived",
      bg: "bg-gradient-to-r from-slate-100 to-slate-200",
      text: "text-slate-600",
      dot: "bg-slate-400",
      border: "border-slate-300",
    },
  };

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${config.bg} ${config.text} border ${config.border} shadow-sm`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </span>
  );
};
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div
          className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <Pencil className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Edit SPC Alert
              </h2>
            
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/50 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {/* CAPA Toggle */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="createCapa"
                  checked={formData.createCapa}
                  onChange={handleChange}
                  disabled={isClosed}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Create CAPA for this alert
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Enable to create a full CAPA record with investigation and actions
                  </span>
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CAPA Title */}
              {formData.createCapa && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    CAPA Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="capaTitle"
                    value={formData.capaTitle}
                    onChange={handleChange}
                    placeholder="Describe the issue briefly"
                    disabled={isClosed}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50"
                  />
                </div>
              )}

              {/* Severity */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Severity
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  disabled={isClosed}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Source
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  disabled={isClosed || !formData.createCapa}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50"
                >
                  <option value="SPC ALERT">SPC Alert</option>
                  <option value="INSPECTION REJECTION">Inspection Rejection</option>
                  <option value="CUSTOMER COMPLAINT">Customer Complaint</option>
                  <option value="AUDIT">Audit</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Assigned To */}
              {formData.createCapa && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Responsible Person <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    disabled={isClosed || loadingInspectors}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50"
                  >
                    <option value="">Select Responsible Person...</option>
                    {inspectors.map((inspector) => (
                      <option
                        key={inspector._id}
                        value={`${inspector.firstName} ${inspector.lastName || ""}`.trim()}
                      >
                        {`${inspector.firstName} ${inspector.lastName || ""}`.trim()}
                        {inspector.role ? ` - ${inspector.role}` : ""}
                      </option>
                    ))}
                  </select>
                  {loadingInspectors && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading employees...
                    </div>
                  )}
                </div>
              )}

              {/* Target Date */}
              {formData.createCapa && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Target Completion Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="targetDate"
                    value={formData.targetDate}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50"
                  />
                </div>
              )}

              {/* Problem Statement */}
              {formData.createCapa && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Problem Statement <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="problem"
                    value={formData.problem}
                    onChange={handleChange}
                    rows="2"
                    placeholder="What happened, where, and which subgroup was affected?"
                    disabled={isClosed}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50 resize-none"
                  />
                </div>
              )}

              {/* Immediate Containment */}
              {formData.createCapa && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Immediate Containment Action
                  </label>
                  <textarea
                    name="immediateContainment"
                    value={formData.immediateContainment}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Example: Hold the lot, stop the machine, segregate affected parts"
                    disabled={isClosed}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50 resize-none"
                  />
                </div>
              )}

              {/* Root Cause */}
              {formData.createCapa && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Root Cause
                  </label>
                  <textarea
                    name="rootCause"
                    value={formData.rootCause}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Why did the issue occur? Use 5-Why or Fishbone analysis"
                    disabled={isClosed}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50 resize-none"
                  />
                </div>
              )}

              {/* Corrective Action */}
              {formData.createCapa && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Corrective Action
                  </label>
                  <textarea
                    name="correctiveAction"
                    value={formData.correctiveAction}
                    onChange={handleChange}
                    rows="2"
                    placeholder="What was done to remove the root cause?"
                    disabled={isClosed}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50 resize-none"
                  />
                </div>
              )}

              {/* Preventive Action */}
              {formData.createCapa && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Preventive Action
                  </label>
                  <textarea
                    name="preventiveAction"
                    value={formData.preventiveAction}
                    onChange={handleChange}
                    rows="2"
                    placeholder="What change will prevent recurrence?"
                    disabled={isClosed}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50 resize-none"
                  />
                </div>
              )}

              {/* Verification Result */}
              {formData.createCapa && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Verification Result
                  </label>
                  <select
                    name="verification"
                    value={formData.verification}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="EFFECTIVE">Effective</option>
                    <option value="NOT_EFFECTIVE">Not Effective</option>
                    <option value="INCONCLUSIVE">Inconclusive</option>
                  </select>
                </div>
              )}

              {/* Effectiveness Check */}
              {formData.createCapa && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Effectiveness Check
                  </label>
                  <textarea
                    name="effectivenessCheck"
                    value={formData.effectivenessCheck}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Example: Monitor the next 20 subgroups with no SPC rule violation"
                    disabled={isClosed}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50 resize-none"
                  />
                </div>
              )}

              {/* Verified By */}
              {formData.createCapa && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Verified By
                  </label>
                  <input
                    type="text"
                    name="verifiedBy"
                    value={formData.verifiedBy}
                    onChange={handleChange}
                    placeholder="Name of verifier"
                    disabled={isClosed}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50"
                  />
                </div>
              )}

              {/* Approved By */}
              {formData.createCapa && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Approved By
                  </label>
                  <input
                    type="text"
                    name="approvedBy"
                    value={formData.approvedBy}
                    onChange={handleChange}
                    placeholder="Name of approver"
                    disabled={isClosed}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50"
                  />
                </div>
              )}

              {/* Closure Date */}
              {formData.createCapa && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    Closure Date
                  </label>
                  <input
                    type="date"
                    name="closureDate"
                    value={formData.closureDate}
                    onChange={handleChange}
                    disabled={isClosed}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50"
                  />
                </div>
              )}

              {/* Comments */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Additional Comments
                </label>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Add evidence references, observations, or closure comments"
                  disabled={isClosed}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-50 resize-none"
                />
              </div>
            </div>

            {/* Status Display */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Current Status:</span>
                <StatusBadge status={formData.status} />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


const DeleteConfirmationModal = ({ event, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  if (!event) return null;

  const handleDelete = async () => {
    setLoading(true);
    await onConfirm(event._id);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Delete SPC Alert?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to permanently delete this SPC alert?
              <br />
              <span className="font-mono text-xs text-slate-400">
                {event.eventNumber || event._id}
              </span>
            </p>
            {event.capaNumber && (
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-xl">
                ⚠️ This event has a CAPA: <strong>{event.capaNumber}</strong>
              </p>
            )}
            <p className="mt-2 text-xs text-rose-600 font-semibold">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CAPA DETAILS MODAL
// ============================================================
const CAPADetailsModal = ({ record, onClose }) => {
  if (!record) return null;

  const event = record.event || record;
  const capa = event?.capaSummary || event?.capa || {};
  const signal = event?.signal || {};
  const investigation = event?.investigation || {};
  const containment = event?.containment || {};
  const correctiveAction = event?.correctiveAction || {};
  const verification = event?.verification || {};
  const attachments = event?.attachments || [];

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div
          className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 via-white to-blue-50 px-6 py-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-slate-400">
                  {event.eventNumber || event._id}
                </span>
                <Pill
                  className={severityClasses(
                    event.priority || event.severity || "info",
                  )}
                >
                  {event.priority || event.severity || "Unknown"}
                </Pill>
                <Pill className={statusClasses(event.status || "OPEN")}>
                  {event.status || "OPEN"}
                </Pill>
                <Pill className={sourceClasses(capa.source || event.source)}>
                  {capa.source || event.source || "SPC ALERT"}
                </Pill>
                {capa.capaNumber && (
                  <Pill className="border-purple-200 bg-purple-100 text-purple-700">
                    CAPA: {capa.capaNumber}
                  </Pill>
                )}
              </div>
              <h2 className="mt-3 break-words text-xl font-bold text-slate-900">
                {capa.capaTitle || event.title || "CAPA Event"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {event.companyName || "Company"} ·{" "}
                {event.itemName || event.itemCode || "Item"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6 space-y-6">
            {/* CAPA Summary */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  CAPA Summary
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <DetailValue
                  label="CAPA Number"
                  value={
                    capa.capaNumber ||
                    correctiveAction.capaNumber ||
                    "Not Created"
                  }
                />
                <DetailValue
                  label="CAPA Title"
                  value={capa.capaTitle || "Untitled"}
                />
                <DetailValue
                  label="Status"
                  value={event.status || capa.status || "OPEN"}
                />
                <DetailValue
                  label="Severity"
                  value={
                    event.priority ||
                    capa.severity ||
                    event.severity ||
                    "MEDIUM"
                  }
                />
                <DetailValue
                  label="Source"
                  value={capa.source || event.source || "SPC ALERT"}
                />
                <DetailValue
                  label="Assigned To"
                  value={event.assignedTo || capa.assignedTo || "Unassigned"}
                />
                <DetailValue
                  label="Target Date"
                  value={formatDateOnly(
                    correctiveAction.dueDate || capa.targetDate,
                  )}
                />
                <DetailValue
                  label="Created By"
                  value={capa.createdBy || "System"}
                />
                <DetailValue
                  label="Created At"
                  value={formatDateTime(capa.createdAt || event.createdAt)}
                />
                <DetailValue
                  label="Updated At"
                  value={formatDateTime(event.updatedAt)}
                />
              </div>
            </section>

            {/* Company & Item */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Company & Item
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <DetailValue label="Company Name" value={event.companyName} />
                <DetailValue label="Item Name" value={event.itemName} />
                <DetailValue label="Item Code" value={event.itemCode} />
                <DetailValue
                  label="Item Description"
                  value={event.itemDescription}
                />
                <DetailValue label="Process Name" value={event.processName} />
              </div>
            </section>

            {/* Inspection Details */}
            {event.inspectionId ||
            event.reportNumber ||
            event.inspectionRunId ||
            event.drawingTitle ||
            event.drawingRevision ||
            event.machine ||
            event.batchNumber ||
            event.quantity ||
            event.timeSlot ||
            event.date ||
            event.inspector ||
            event.collectedAt ? (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Inspection Details
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {event.inspectionId && (
                    <DetailValue
                      label="Inspection ID"
                      value={event.inspectionId}
                      mono
                    />
                  )}
                  {event.reportNumber && (
                    <DetailValue
                      label="Report Number"
                      value={event.reportNumber}
                    />
                  )}
                  {event.inspectionRunId && (
                    <DetailValue
                      label="Inspection Run"
                      value={event.inspectionRunId}
                      mono
                    />
                  )}
                  {event.drawingTitle && (
                    <DetailValue
                      label="Drawing Title"
                      value={event.drawingTitle}
                    />
                  )}
                  {event.drawingRevision && (
                    <DetailValue
                      label="Drawing Revision"
                      value={event.drawingRevision}
                    />
                  )}
                  {event.machine && (
                    <DetailValue label="Machine" value={event.machine} />
                  )}
                  {event.batchNumber && (
                    <DetailValue
                      label="Batch Number"
                      value={event.batchNumber}
                    />
                  )}
                  {event.quantity && (
                    <DetailValue label="Quantity" value={event.quantity} />
                  )}
                  {event.timeSlot && (
                    <DetailValue label="Time Slot" value={event.timeSlot} />
                  )}
                  {event.date && (
                    <DetailValue label="Date" value={event.date} />
                  )}
                  {event.inspector && (
                    <DetailValue label="Inspector" value={event.inspector} />
                  )}
                  {event.collectedAt && (
                    <DetailValue
                      label="Collected At"
                      value={formatDateTime(event.collectedAt)}
                    />
                  )}
                </div>
              </section>
            ) : null}

            {/* Investigation */}
            {(investigation.problemStatement ||
              investigation.rootCause ||
              capa.problem ||
              capa.rootCause) && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Search className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Investigation
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <DetailText
                    label="Problem Statement"
                    value={investigation.problemStatement || capa.problem}
                  />
                  <DetailText
                    label="Root Cause"
                    value={investigation.rootCause || capa.rootCause}
                  />
                  {investigation.investigatedBy && (
                    <DetailValue
                      label="Investigated By"
                      value={investigation.investigatedBy}
                    />
                  )}
                </div>
              </section>
            )}

            {/* Containment */}
            {(containment.immediateAction || capa.immediateContainment) && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Containment
                  </h3>
                </div>
                <DetailText
                  label="Immediate Action"
                  value={
                    containment.immediateAction || capa.immediateContainment
                  }
                />
              </section>
            )}

            {/* Corrective & Preventive Action */}
            {(correctiveAction.action ||
              correctiveAction.preventiveAction ||
              capa.correctiveAction ||
              capa.preventiveAction) && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Corrective & Preventive Action
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <DetailText
                    label="Corrective Action"
                    value={correctiveAction.action || capa.correctiveAction}
                  />
                  <DetailText
                    label="Preventive Action"
                    value={
                      correctiveAction.preventiveAction || capa.preventiveAction
                    }
                  />
                </div>
              </section>
            )}

            {/* Verification */}
            {(verification.result ||
              verification.verifiedBy ||
              verification.effectivenessNotes ||
              capa.verification ||
              capa.verifiedBy ||
              capa.effectivenessCheck) && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Verification
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <DetailValue
                    label="Result"
                    value={
                      verification.result || capa.verification || "PENDING"
                    }
                  />
                  {verification.verifiedBy && (
                    <DetailValue
                      label="Verified By"
                      value={verification.verifiedBy}
                    />
                  )}
                  {verification.effectivenessNotes && (
                    <DetailValue
                      label="Effectiveness Check"
                      value={verification.effectivenessNotes}
                    />
                  )}
                </div>
              </section>
            )}

            {/* SPC Signal */}
            {(signal.value || event.value || signal.usl || signal.lsl) && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    SPC Signal
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <DetailValue
                    label="Value"
                    value={formatNumber(signal.value || event.value)}
                  />
                  {event.unit && (
                    <DetailValue label="Unit" value={event.unit} />
                  )}
                  {signal.usl && (
                    <DetailValue label="USL" value={formatNumber(signal.usl)} />
                  )}
                  {signal.lsl && (
                    <DetailValue label="LSL" value={formatNumber(signal.lsl)} />
                  )}
                  {event.chartType && (
                    <DetailValue label="Chart Type" value={event.chartType} />
                  )}
                  {event.checkpointName && (
                    <DetailValue
                      label="Checkpoint"
                      value={event.checkpointName}
                    />
                  )}
                  {event.subgroupNumber && (
                    <DetailValue
                      label="Subgroup"
                      value={event.subgroupNumber}
                    />
                  )}
                </div>
              </section>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Attachments
                    </h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {attachments.length} file
                    {attachments.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {att.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {att.mimeType} ·{" "}
                          {att.size
                            ? `${(att.size / 1024).toFixed(1)} KB`
                            : "—"}
                        </p>
                      </div>
                      {att.url ? (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-slate-400 text-sm">No URL</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Close
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

// Detail Value component for modal
const DetailValue = ({ label, value, mono = false }) => {
  if (value === "" || value === null || value === undefined || value === "—")
    return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-sm font-medium text-slate-800 ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
};

const DetailText = ({ label, value }) => {
  if (value === "" || value === null || value === undefined || value === "—")
    return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 col-span-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
        {value}
      </p>
    </div>
  );
};

// ============================================================
// ADVANCED PAGINATION COMPONENT
// ============================================================
const AdvancedPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100, 200],
}) => {
  if (totalPages <= 1 && totalItems <= pageSize) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-1 py-2 border-t border-slate-200">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>
          Showing{" "}
          <span className="font-semibold text-slate-700">{startItem}</span> to{" "}
          <span className="font-semibold text-slate-700">{endItem}</span> of{" "}
          <span className="font-semibold text-slate-700">{totalItems}</span>{" "}
          CAPAs
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/15"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                currentPage === page
                  ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MAIN CAPA HISTORY PAGE WITH ADVANCED PAGINATION
// ============================================================
const CAPAHistoryFull = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    severity: "all",
    status: "all",
    company: "all",
    item: "all",
    process: "all",
    checkpoint: "all",
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(
    async (page = 1, limit = 20) => {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get(SPC_EVENTS_API, {
          params: {
            page: page,
            limit: limit,
            sortBy: "createdAt",
            sortOrder: "desc",
            hasCapa: "true",
            ...(filters.company !== "all" && { companyName: filters.company }),
            ...(filters.item !== "all" && { itemName: filters.item }),
            ...(filters.process !== "all" && { processName: filters.process }),
            ...(filters.checkpoint !== "all" && {
              checkpointName: filters.checkpoint,
            }),
            ...(filters.severity !== "all" && {
              severity: filters.severity.toUpperCase(),
            }),
            ...(filters.status !== "all" && {
              status: filters.status.toUpperCase(),
            }),
          },
          withCredentials: true,
        });

        if (response.data.success) {
          const eventData = response.data.data;
          const eventsList = eventData?.events || [];
          const paginationData = eventData?.pagination || {};

          setEvents(eventsList);
          setPagination({
            page: paginationData.page || page,
            limit: paginationData.limit || limit,
            totalItems: paginationData.totalItems || eventsList.length,
            totalPages:
              paginationData.totalPages || Math.ceil(eventsList.length / limit),
          });
        } else {
          setError(response.data.message || "Failed to load CAPA events");
          setEvents([]);
        }
      } catch (err) {
        console.error("Unable to load CAPA events:", err);
        setEvents([]);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load CAPA events.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    loadEvents(pagination.page, pagination.limit);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents(pagination.page, pagination.limit);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
    loadEvents(newPage, pagination.limit);
    const tableContainer = document.getElementById("capa-table-container");
    if (tableContainer) {
      tableContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePageSizeChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
    loadEvents(1, newLimit);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadEvents(1, pagination.limit);
  };

  // ============================================================
  // EDIT FUNCTIONS
  // ============================================================
  const handleEdit = (event) => {
    setEditingEvent(event);
  };

  const handleEditSave = async (eventId, payload) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/spc/alert/spc-alerts/${eventId}/fields`,
        payload,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.data.success) {
        await loadEvents(pagination.page, pagination.limit);
        return { success: true, data: response.data.data };
      } else {
        return {
          success: false,
          message: response.data.message || "Failed to update SPC alert",
        };
      }
    } catch (error) {
      console.error("Error updating SPC alert:", error);
      return {
        success: false,
        message:
          error?.response?.data?.message ||
          error?.message ||
          "An error occurred while updating",
      };
    }
  };

  // ============================================================
  // DELETE FUNCTIONS
  // ============================================================
  const handleDelete = (event) => {
    setDeletingEvent(event);
  };

  const handleDeleteConfirm = async (eventId) => {
    try {
      const response = await axios.delete(
        `${SPC_EVENTS_API}/${eventId}/permanent`,
        { withCredentials: true },
      );

      if (response.data.success) {
        await loadEvents(pagination.page, pagination.limit);
        setDeletingEvent(null);
        return { success: true, data: response.data.data };
      } else {
        alert(response.data.message || "Failed to delete SPC alert");
        return {
          success: false,
          message: response.data.message || "Failed to delete SPC alert",
        };
      }
    } catch (error) {
      console.error("Error deleting SPC alert:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An error occurred while deleting";
      alert(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Extract CAPA info from event
  const extractCAPAInfo = (event) => {
    const capa = event?.capaSummary || event?.capa || {};
    const signal = event?.signal || {};

    return {
      id: event?._id || event?.id,
      event: event,
      eventNumber: event?.eventNumber || "—",
      companyName: event?.companyName || "—",
      itemName: event?.itemName || event?.itemCode || "—",
      itemCode: event?.itemCode || "—",
      itemDescription: event?.itemDescription || "—",
      processName: event?.processName || "—",
      capaNumber:
        capa?.capaNumber ||
        event?.correctiveAction?.capaNumber ||
        event?.capa?.number,
      capaTitle: capa?.capaTitle || event?.title || "Untitled CAPA",
      status: event?.status || capa?.status || "OPEN",
      severity: event?.priority || capa?.severity || event?.severity || "info",
      source: capa?.source || event?.source || "SPC ALERT",
      checkpointName: event?.checkpointName || "—",
      subgroupNumber: event?.subgroupNumber,
      value: signal?.value || event?.value,
      assignedTo: event?.assignedTo || capa?.assignedTo || "Unassigned",
      targetDate: event?.correctiveAction?.dueDate || capa?.targetDate,
      problem: event?.investigation?.problemStatement || capa?.problem,
      rootCause: event?.investigation?.rootCause || capa?.rootCause,
      correctiveAction:
        event?.correctiveAction?.action || capa?.correctiveAction,
      preventiveAction:
        event?.correctiveAction?.preventiveAction || capa?.preventiveAction,
      verification:
        event?.verification?.result || capa?.verification || "PENDING",
      createdAt: event?.createdAt || capa?.createdAt,
      attachments: event?.attachments || [],
      comments: event?.comments || capa?.comments || "—",
      priority: event?.priority || "MEDIUM",
      classification: event?.classification || "CONTROL_LIMIT_VIOLATION",
      machine: event?.machine || "",
      line: event?.line || "",
      cavity: event?.cavity || "",
      toolNumber: event?.toolNumber || "",
      batchNumber: event?.batchNumber || "",
      inspector: event?.inspector || "",
      chartType: event?.chartType || "",
      chartPanel: event?.chartPanel || "xbar",
      chartPointIndex: event?.chartPointIndex || "",
      sourceAlertId: event?.sourceAlertId || "",
      unit: event?.unit || "",
      collectedAt: event?.collectedAt || "",
      signal: event?.signal || {},
    };
  };

  // Process events
  const capaEvents = useMemo(() => {
    return events.map(extractCAPAInfo);
  }, [events]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const companies = new Set();
    const items = new Set();
    const processes = new Set();
    const checkpoints = new Set();
    const severities = new Set();
    const statuses = new Set();

    capaEvents.forEach((event) => {
      if (event.companyName && event.companyName !== "—")
        companies.add(event.companyName);
      if (event.itemName && event.itemName !== "—") items.add(event.itemName);
      if (event.processName && event.processName !== "—")
        processes.add(event.processName);
      if (event.checkpointName && event.checkpointName !== "—")
        checkpoints.add(event.checkpointName);
      if (event.severity) severities.add(event.severity);
      if (event.status) statuses.add(event.status);
    });

    return {
      companies: Array.from(companies).sort(),
      items: Array.from(items).sort(),
      processes: Array.from(processes).sort(),
      checkpoints: Array.from(checkpoints).sort(),
      severities: Array.from(severities).sort(),
      statuses: Array.from(statuses).sort(),
    };
  }, [capaEvents]);

  const summary = useMemo(() => {
    const total = pagination.totalItems || capaEvents.length;
    const critical = capaEvents.filter(
      (e) => String(e.severity || "").toLowerCase() === "critical",
    ).length;
    const warning = capaEvents.filter(
      (e) => String(e.severity || "").toLowerCase() === "warning",
    ).length;
    const open = capaEvents.filter(
      (e) => String(e.status || "").toUpperCase() === "OPEN",
    ).length;
    const underInvestigation = capaEvents.filter(
      (e) => String(e.status || "").toUpperCase() === "UNDER_INVESTIGATION",
    ).length;
    const actionTaken = capaEvents.filter(
      (e) => String(e.status || "").toUpperCase() === "ACTION_TAKEN",
    ).length;
    const resolved = capaEvents.filter(
      (e) =>
        String(e.status || "").toUpperCase() === "RESOLVED" ||
        String(e.status || "").toUpperCase() === "CLOSED",
    ).length;

    return {
      total,
      critical,
      warning,
      open,
      underInvestigation,
      actionTaken,
      resolved,
    };
  }, [capaEvents, pagination.totalItems]);

  // Filter events based on search text
  const filteredEvents = useMemo(() => {
    if (!searchText.trim()) return capaEvents;
    const search = searchText.toLowerCase().trim();
    return capaEvents.filter(
      (event) =>
        (event.capaNumber && event.capaNumber.toLowerCase().includes(search)) ||
        (event.capaTitle && event.capaTitle.toLowerCase().includes(search)) ||
        (event.companyName &&
          event.companyName.toLowerCase().includes(search)) ||
        (event.itemName && event.itemName.toLowerCase().includes(search)) ||
        (event.processName &&
          event.processName.toLowerCase().includes(search)) ||
        (event.checkpointName &&
          event.checkpointName.toLowerCase().includes(search)) ||
        (event.assignedTo && event.assignedTo.toLowerCase().includes(search)) ||
        (event.status && event.status.toLowerCase().includes(search)),
    );
  }, [capaEvents, searchText]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <header className="sticky rounded-2xl top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>

              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                <FileCheck2 className="h-6 w-6 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">CAPA History</h1>
                <p className="text-x text-blue-100">
                  Complete CAPA history with full details
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              <Link
                to="/qc-inspection"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-blue-50"
              >
                Back to QC
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <p className="text-[10px] text-slate-500 font-medium">
              Total CAPAs
            </p>
            <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-rose-200 p-3 shadow-sm">
            <p className="text-[10px] text-rose-500 font-medium">Critical</p>
            <p className="text-2xl font-bold text-rose-600">
              {summary.critical}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-3 shadow-sm">
            <p className="text-[10px] text-amber-500 font-medium">Warning</p>
            <p className="text-2xl font-bold text-amber-600">
              {summary.warning}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-3 shadow-sm">
            <p className="text-[10px] text-blue-500 font-medium">Open</p>
            <p className="text-2xl font-bold text-blue-600">{summary.open}</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-3 shadow-sm">
            <p className="text-[10px] text-amber-500 font-medium">
              Under Investigation
            </p>
            <p className="text-2xl font-bold text-amber-600">
              {summary.underInvestigation}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-purple-200 p-3 shadow-sm">
            <p className="text-[10px] text-purple-500 font-medium">
              Action Taken
            </p>
            <p className="text-2xl font-bold text-purple-600">
              {summary.actionTaken}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-emerald-200 p-3 shadow-sm">
            <p className="text-[10px] text-emerald-500 font-medium">Resolved</p>
            <p className="text-2xl font-bold text-emerald-600">
              {summary.resolved}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search CAPA number, title..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-500/15"
              />
            </div>

            {filterOptions.companies.length > 0 && (
              <select
                value={filters.company}
                onChange={(e) => handleFilterChange("company", e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/15"
              >
                <option value="all">All Companies</option>
                {filterOptions.companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {filterOptions.items.length > 0 && (
              <select
                value={filters.item}
                onChange={(e) => handleFilterChange("item", e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/15"
              >
                <option value="all">All Items</option>
                {filterOptions.items.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            )}

            {filterOptions.processes.length > 0 && (
              <select
                value={filters.process}
                onChange={(e) => handleFilterChange("process", e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/15"
              >
                <option value="all">All Processes</option>
                {filterOptions.processes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}

            {filterOptions.severities.length > 0 && (
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange("severity", e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/15"
              >
                <option value="all">All Severities</option>
                {filterOptions.severities.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}

            {filterOptions.statuses.length > 0 && (
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/15"
              >
                <option value="all">All Statuses</option>
                {filterOptions.statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}

            <span className="text-xs text-slate-500 ml-auto">
              Showing {filteredEvents.length} of {pagination.totalItems} CAPAs
            </span>
          </div>
        </div>

        {/* Table Container */}
        <div id="capa-table-container">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-purple-600" />
                <p className="mt-4 text-sm font-medium text-slate-600">
                  Loading CAPA history...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Failed to load CAPA events</p>
                  <p className="mt-1">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div>
                <FileCheck2 className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-semibold text-slate-700">
                  No CAPA events found
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white border border-gray-300 overflow-auto">
                <table className="w-full border-collapse text-sm text-center">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap uppercase">
                        #
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap uppercase">
                        CAPA
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap uppercase">
                        Company
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap uppercase">
                        Item
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap uppercase">
                        Process
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap uppercase">
                        Checkpoint
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap uppercase">
                        Assigned To
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap uppercase">
                        Status
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap uppercase">
                        Created
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEvents.map((event, idx) => (
                      <tr
                        key={event.id || idx}
                        className="hover:bg-purple-50/30 transition"
                      >
                        <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                          {(pagination.page - 1) * pagination.limit + idx + 1}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                          <p
                            className="font-medium text-slate-800 truncate"
                            title={event.capaTitle}
                          >
                            {event.capaNumber && (
                              <span className="text-[12px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono mr-1">
                                {event.capaNumber}
                              </span>
                            )}
                          </p>
                        </td>
                        <td
                          className="border border-gray-300 px-3 py-2 align-middle text-center"
                          title={event.companyName}
                        >
                          {event.companyName}
                        </td>
                        <td
                          className="border border-gray-300 px-3 py-2 align-middle text-center"
                          title={event.itemName}
                        >
                          {event.itemName}
                        </td>
                        <td
                          className="border border-gray-300 px-3 py-2 align-middle text-center"
                          title={event.processName}
                        >
                          {event.processName}
                        </td>
                        <td
                          className="border border-gray-300 px-3 py-2 align-middle text-center"
                          title={event.checkpointName}
                        >
                          {event.checkpointName}
                        </td>
                        <td
                          className="border border-gray-300 px-3 py-2 align-middle text-center"
                          title={event.assignedTo}
                        >
                          {event.assignedTo}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                          <Pill className={statusClasses(event.status)}>
                            {event.status}
                          </Pill>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                          {formatDateOnly(event.createdAt)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* View */}
                            <button
                              onClick={() => setSelectedEvent({ event })}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2.5 py-1.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-200 transition"
                              title="View details"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleEdit(event.event)}
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-200 transition"
                              title="Edit SPC alert fields"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(event.event)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1.5 text-[10px] font-semibold text-red-700 hover:bg-red-200 transition"
                              title="Delete permanently"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Advanced Pagination */}
              <AdvancedPagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.limit}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 20, 50, 100, 200]}
              />
            </>
          )}
        </div>

        <footer className="mt-6 border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Page {pagination.page} of {pagination.totalPages} · Last updated:{" "}
            {new Date().toLocaleString()}
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-rose-500"></span>
              Critical: {summary.critical}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
              Warning: {summary.warning}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
              Open: {summary.open}
            </span>
          </div>
        </footer>
      </main>

      {/* Modals */}
      {selectedEvent && (
        <CAPADetailsModal
          record={selectedEvent.event}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {editingEvent && (
        <EditSPCAlertModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={handleEditSave}
        />
      )}

      {deletingEvent && (
        <DeleteConfirmationModal
          event={deletingEvent}
          onClose={() => setDeletingEvent(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default CAPAHistoryFull;
