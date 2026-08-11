import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Bar, Line } from "react-chartjs-2";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Maximize2,
  MoveHorizontal,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  X,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Loader2,
  Save,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Wrench,
  Activity,
  BarChart3,
  AlertCircle,
  CheckCircle,
  FileText,
  Search,
  Clock,
  Gauge,
  Database,
  LayoutDashboard,
  Clipboard,
  Hash,
  RotateCw,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin,
);

// ============= CONSTANTS =============
const DEFAULT_VISIBLE_POINTS = 60;
const MIN_VISIBLE_POINTS = 4;
const WINDOW_PRESETS = [20, 40, 60, 120];
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const MONGODB_OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const SPC_API_ROOT = String(
  import.meta.env.VITE_REACT_APP_BACKEND_BASEURL ||
    "http://localhost:5000/api/v1",
).replace(/\/$/, "");
const SPC_EVENTS_API = `${SPC_API_ROOT}/spc/alert/spc-events`;

const firstNonBlankValue = (...values) => {
  for (const value of values.flat()) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return value;
  }
  return "";
};

// Add this after ChartJS.register
// Smooth easing function
const easeInOut = (t) => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

// Sine wave with easing
const smoothPulse = (time, speed = 1.5, offset = 0) => {
  const raw = Math.sin(time * speed + offset);
  const normalized = (raw + 1) / 2; // 0 to 1
  return 0.3 + 0.7 * easeInOut(normalized);
};

const glowPlugin = {
  id: "capaGlow",
  beforeDraw(chart) {
    const { ctx, data } = chart;

    data.datasets.forEach((dataset, datasetIndex) => {
      if (dataset.spcRole !== "primary") return;

      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta || !meta.data) return;

      meta.data.forEach((element, index) => {
        const hasCapa =
          dataset.pointBorderColor &&
          typeof dataset.pointBorderColor === "function" &&
          dataset.pointBorderColor({ dataIndex: index }) === "#4c1d95";

        if (hasCapa && element && element.x && element.y) {
          const x = element.x;
          const y = element.y;

          const time = Date.now() / 1000;

          // Multiple pulses with different speeds
          const pulse1 = smoothPulse(time, 1.2, 0);
          const pulse2 = smoothPulse(time, 0.8, 1.8);
          const pulse3 = smoothPulse(time, 2.0, 0.5);

          // ========== MASSIVE GLOW WITH SMOOTH EASING ==========

          // Outer glow
          const outerRadius = 40 + 15 * pulse1;
          const gradient1 = ctx.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            outerRadius,
          );
          gradient1.addColorStop(0, `rgba(168, 85, 247, ${0.12 * pulse1})`);
          gradient1.addColorStop(0.4, `rgba(168, 85, 247, ${0.06 * pulse1})`);
          gradient1.addColorStop(1, "rgba(168, 85, 247, 0)");

          ctx.save();
          ctx.shadowColor = `rgba(168, 85, 247, ${0.25 * pulse1})`;
          ctx.shadowBlur = 50 * pulse1;
          ctx.beginPath();
          ctx.arc(x, y, outerRadius * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = gradient1;
          ctx.fill();
          ctx.restore();

          // Medium intense glow
          const mediumRadius = 22 + 10 * pulse2;
          const gradient2 = ctx.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            mediumRadius,
          );
          gradient2.addColorStop(0, `rgba(168, 85, 247, ${0.6 * pulse2})`);
          gradient2.addColorStop(0.4, `rgba(168, 85, 247, ${0.3 * pulse2})`);
          gradient2.addColorStop(0.7, `rgba(168, 85, 247, ${0.1 * pulse2})`);
          gradient2.addColorStop(1, "rgba(168, 85, 247, 0)");

          ctx.save();
          ctx.shadowColor = `rgba(168, 85, 247, ${0.8 * pulse2})`;
          ctx.shadowBlur = 35 * pulse2;
          ctx.beginPath();
          ctx.arc(x, y, mediumRadius * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = gradient2;
          ctx.fill();
          ctx.restore();

          // Inner bright core
          const innerRadius = 10 + 6 * pulse1;
          const gradient3 = ctx.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            innerRadius,
          );
          gradient3.addColorStop(0, `rgba(200, 100, 255, ${0.9 * pulse1})`);
          gradient3.addColorStop(0.5, `rgba(168, 85, 247, ${0.5 * pulse1})`);
          gradient3.addColorStop(1, "rgba(168, 85, 247, 0)");

          ctx.save();
          ctx.shadowColor = `rgba(168, 85, 247, ${0.95 * pulse1})`;
          ctx.shadowBlur = 30 * pulse1;
          ctx.beginPath();
          ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
          ctx.fillStyle = gradient3;
          ctx.fill();
          ctx.restore();

          // Pulsing ring
          const ringRadius = 13 + 10 * pulse3;
          ctx.save();
          ctx.shadowColor = `rgba(168, 85, 247, ${0.5 * pulse3})`;
          ctx.shadowBlur = 25;
          ctx.beginPath();
          ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.35 * pulse3})`;
          ctx.lineWidth = 2.5 + 2 * pulse3;
          ctx.setLineDash([5, 8]);
          ctx.stroke();
          ctx.restore();

          // Outer ring
          const outerRingRadius = 20 + 12 * pulse2;
          ctx.save();
          ctx.shadowColor = `rgba(168, 85, 247, ${0.2 * pulse2})`;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(x, y, outerRingRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.12 * pulse2})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();

          // Sparkle with smooth animation
          const sparkleSize = 5 + 5 * pulse3;
          const sparkleGrad = ctx.createRadialGradient(
            x - 4 * pulse3,
            y - 4 * pulse3,
            0,
            x - 4 * pulse3,
            y - 4 * pulse3,
            sparkleSize,
          );
          sparkleGrad.addColorStop(
            0,
            `rgba(255, 255, 255, ${0.7 + 0.3 * pulse3})`,
          );
          sparkleGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.2 * pulse3})`);
          sparkleGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

          ctx.save();
          ctx.beginPath();
          ctx.arc(
            x - 3 * pulse3,
            y - 3 * pulse3,
            sparkleSize * 0.9,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = sparkleGrad;
          ctx.fill();
          ctx.restore();
        }
      });
    });
  },
};

ChartJS.register(glowPlugin);

const buildSPCEventContext = (chart = {}, subgroupData = {}) => {
  const metadata = subgroupData?.metadata || {};
  const originalIndex = Number.isInteger(Number(subgroupData?.originalIndex))
    ? Number(subgroupData.originalIndex)
    : null;
  const subgroupId = firstNonBlankValue(
    subgroupData?.subgroupId,
    metadata?.subgroupId,
    metadata?.subgroupKey,
    subgroupData?.sourceLabel,
    metadata?.subgroupLabel,
    originalIndex === null ? "" : `SG-${originalIndex + 1}`,
  );

  return {
    inspectionId: firstNonBlankValue(
      subgroupData?.inspectionId,
      metadata?.inspectionId,
      chart?.inspectionId,
    ),
    inspectionRunId: firstNonBlankValue(
      subgroupData?.inspectionRunId,
      metadata?.inspectionRunId,
      chart?.inspectionRunId,
    ),
    reportNumber: firstNonBlankValue(
      subgroupData?.reportNumber,
      metadata?.reportNumber,
      chart?.reportNumber,
    ),
    companyId: firstNonBlankValue(
      subgroupData?.companyId,
      metadata?.companyId,
      chart?.companyId,
    ),
    companyName: firstNonBlankValue(
      subgroupData?.companyName,
      metadata?.companyName,
      chart?.companyName,
    ),
    itemId: firstNonBlankValue(
      subgroupData?.itemId,
      metadata?.itemId,
      chart?.itemId,
    ),
    itemCode: firstNonBlankValue(
      subgroupData?.itemCode,
      metadata?.itemCode,
      chart?.itemCode,
    ),
    itemName: firstNonBlankValue(
      subgroupData?.itemName,
      metadata?.itemName,
      chart?.itemName,
    ),
    processId: firstNonBlankValue(
      subgroupData?.processId,
      metadata?.processId,
      chart?.processId,
    ),
    processName: firstNonBlankValue(
      subgroupData?.processName,
      metadata?.processName,
      chart?.processName,
    ),
    checkpointId: firstNonBlankValue(
      subgroupData?.checkpointId,
      metadata?.checkpointId,
      metadata?.characteristicId,
      chart?.checkpointId,
      chart?.characteristicId,
    ),
    checkpointName: firstNonBlankValue(
      subgroupData?.checkpointName,
      metadata?.checkpointName,
      metadata?.characteristicName,
      chart?.checkpointName,
    ),
    subgroupId,
    subgroupNumber:
      subgroupData?.subgroupNumber ||
      metadata?.subgroupNumber ||
      (originalIndex === null ? null : originalIndex + 1),
    subgroupSequence: firstNonBlankValue(
      subgroupData?.subgroupSequence,
      metadata?.subgroupSequence,
    ),
    subgroupSequenceInDay: firstNonBlankValue(
      subgroupData?.subgroupSequenceInDay,
      metadata?.subgroupSequenceInDay,
    ),
    spcStreamKey: firstNonBlankValue(
      subgroupData?.spcStreamKey,
      metadata?.spcStreamKey,
      chart?.spcStreamKey,
    ),
    chartType: firstNonBlankValue(chart?.type, chart?.chartType),
    chartPanel: firstNonBlankValue(subgroupData?.chartPanel, "xbar"),
    chartPointIndex: originalIndex,
    sourceAlertId: firstNonBlankValue(
      subgroupData?.sourceAlertId,
      metadata?.sourceAlertId,
    ),
    machine: firstNonBlankValue(metadata?.machine, chart?.machine),
    line: firstNonBlankValue(metadata?.line, chart?.line),
    cavity: firstNonBlankValue(metadata?.cavity, chart?.cavity),
    toolNumber: firstNonBlankValue(metadata?.toolNumber, chart?.toolNumber),
    batchNumber: firstNonBlankValue(metadata?.batchNumber, chart?.batchNumber),
    inspector: firstNonBlankValue(metadata?.inspector, chart?.inspector),
    collectedAt: firstNonBlankValue(
      subgroupData?.collectedAt,
      metadata?.collectedAt,
      metadata?.date,
    ),
    unit: firstNonBlankValue(chart?.unit, metadata?.unit),
  };
};

const getSPCPointSubgroupId = (point = {}) =>
  String(
    firstNonBlankValue(
      point?.subgroupId,
      point?.metadata?.subgroupId,
      point?.metadata?.subgroupKey,
      point?.sourceLabel,
      point?.metadata?.subgroupLabel,
    ) || "",
  );

const useCAPABySubgroup = (chart = {}) => {
  const [capaBySubgroup, setCapaBySubgroup] = useState({});
  const checkpointId = firstNonBlankValue(
    chart?.checkpointId,
    chart?.characteristicId,
  );
  const spcStreamKey = firstNonBlankValue(chart?.spcStreamKey);

  useEffect(() => {
    if (!checkpointId) {
      setCapaBySubgroup({});
      return undefined;
    }

    let cancelled = false;
    axios
      .get(SPC_EVENTS_API, {
        params: {
          checkpointId,
          spcStreamKey: spcStreamKey || undefined,
          hasCapa: true,
          limit: 100,
        },
        withCredentials: true,
      })
      .then((response) => {
        if (cancelled) return;
        const events = response?.data?.data?.events || [];
        const nextMap = {};
        events.forEach((event) => {
          const subgroupId = String(event?.subgroupId || "").trim();
          if (!subgroupId) return;
          nextMap[subgroupId] = event?.capaSummary ||
            event?.capa || {
              capaNumber: event?.correctiveAction?.capaNumber || "",
            };
        });
        setCapaBySubgroup(nextMap);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Unable to load CAPA subgroup markers:", error);
        setCapaBySubgroup({});
      });

    return () => {
      cancelled = true;
    };
  }, [checkpointId, spcStreamKey]);

  useEffect(() => {
    const handleCAPAUpdate = (event) => {
      const detail = event?.detail || {};
      if (String(detail.checkpointId || "") !== String(checkpointId || "")) {
        return;
      }
      const subgroupId = String(detail.subgroupId || "").trim();
      if (!subgroupId) return;

      setCapaBySubgroup((current) => {
        const next = { ...current };
        if (detail.hasCapa) next[subgroupId] = detail.capa || {};
        else delete next[subgroupId];
        return next;
      });
    };

    window.addEventListener("spc-capa-updated", handleCAPAUpdate);
    return () =>
      window.removeEventListener("spc-capa-updated", handleCAPAUpdate);
  }, [checkpointId]);

  return capaBySubgroup;
};

// ============= STATUS CONFIGURATION =============
const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    bg: "bg-gradient-to-r from-slate-100 to-slate-200",
    text: "text-slate-700",
    dot: "bg-slate-400",
    border: "border-slate-300",
    icon: "FileText",
  },
  OPEN: {
    label: "Open",
    bg: "bg-gradient-to-r from-blue-50 to-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
    border: "border-blue-300",
    icon: "AlertCircle",
  },
  ACKNOWLEDGED: {
    label: "Acknowledged",
    bg: "bg-gradient-to-r from-indigo-50 to-indigo-100",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
    border: "border-indigo-300",
    icon: "CheckCircle",
  },
  UNDER_INVESTIGATION: {
    label: "Under Investigation",
    bg: "bg-gradient-to-r from-amber-50 to-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-300",
    icon: "Search",
  },
  ACTION_TAKEN: {
    label: "Action Taken",
    bg: "bg-gradient-to-r from-purple-50 to-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
    border: "border-purple-300",
    icon: "Wrench",
  },
  VERIFICATION_PENDING: {
    label: "Verification Pending",
    bg: "bg-gradient-to-r from-orange-50 to-orange-100",
    text: "text-orange-700",
    dot: "bg-orange-500",
    border: "border-orange-300",
    icon: "Clock",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-gradient-to-r from-emerald-50 to-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-300",
    icon: "CheckCircle2",
  },
};

// ============= UTILITY FUNCTIONS =============
const toFiniteNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const isMongoObjectId = (value) =>
  typeof value === "string" && MONGODB_OBJECT_ID_PATTERN.test(value.trim());

const getReadableText = (...values) => {
  for (const value of values.flat()) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (!text || isMongoObjectId(text)) continue;
    return text;
  }
  return "";
};

const formatCustomerReportValue = (value, precision = 3) => {
  if (value === "" || value === null || value === undefined) return "-";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric.toFixed(Math.max(0, Number(precision) || 0));
};

const formatNumber = (value, decimals = 2) => {
  if (!value && value !== 0) return "—";
  return Number(value).toFixed(decimals);
};

const unwrapSubgroupReadingDate = (value) => {
  if (!value) return null;
  if (typeof value === "object" && value.$date) return value.$date;
  return value;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });

const formatFileSize = (bytes) => {
  const numericBytes = Number(bytes || 0);
  if (!numericBytes) return "Existing file";
  if (numericBytes < 1024) return `${numericBytes} B`;
  if (numericBytes < 1024 * 1024) {
    return `${(numericBytes / 1024).toFixed(1)} KB`;
  }
  return `${(numericBytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ============= COMMON COMPONENTS =============

// Status Badge
const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

  // Map status to icon component directly
  const iconMap = {
    FileText: FileText,
    AlertCircle: AlertCircle,
    CheckCircle: CheckCircle,
    Search: Search,
    Wrench: Wrench,
    Clock: Clock,
    CheckCircle2: CheckCircle2,
  };

  const IconComponent = iconMap[config.icon] || FileText;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${config.bg} ${config.text} border ${config.border} shadow-sm`}
    >
      <IconComponent className="h-3.5 w-3.5" />
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot} animate-pulse`}
      />
      {config.label}
    </span>
  );
};

// Section Header
const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-2.5 shadow-sm">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

// Form Field
const FormField = ({ label, required, children, error: fieldError }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1">
      <label className="text-xs font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
    </div>
    {children}
    {fieldError && <p className="text-xs text-rose-600">{fieldError}</p>}
  </div>
);

// Enhanced Input
const EnhancedInput = ({
  label,
  required,
  error,
  className = "",
  ...props
}) => (
  <FormField label={label} required={required} error={error}>
    <input
      {...props}
      className={`w-full rounded-xl border ${error ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"} px-4 py-2.5 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 ${className}`}
    />
  </FormField>
);

// Enhanced Select
const EnhancedSelect = ({
  label,
  required,
  error,
  options,
  className = "",
  ...props
}) => (
  <FormField label={label} required={required} error={error}>
    <select
      {...props}
      className={`w-full rounded-xl border ${error ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"} px-4 py-2.5 text-sm text-slate-900 transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${className}`}
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </FormField>
);

// Enhanced TextArea
const EnhancedTextArea = ({
  label,
  required,
  error,
  className = "",
  ...props
}) => (
  <FormField label={label} required={required} error={error}>
    <textarea
      {...props}
      rows={3}
      className={`w-full rounded-xl border ${error ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"} px-4 py-2.5 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 resize-none ${className}`}
    />
  </FormField>
);

// Action Button
const ActionButton = ({
  children,
  variant = "primary",
  icon: Icon,
  loading,
  ...props
}) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-blue-500/25",
    success:
      "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-500/25",
    warning:
      "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 shadow-amber-500/25",
    danger:
      "bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-700 hover:to-rose-800 shadow-rose-500/25",
    secondary:
      "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-slate-200/25",
  };
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${variants[variant]} ${props.className || ""}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
    </button>
  );
};

// Metric Card
const MetricCard = ({
  label,
  value,
  unit,
  icon: Icon,
  color = "slate",
  subtitle,
  alert,
}) => (
  <div
    className={`group relative overflow-hidden rounded-2xl border ${alert ? "border-rose-200" : `border-${color}-100`} bg-gradient-to-br ${alert ? "from-rose-50/80 to-white" : `from-${color}-50/80 to-white`} p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]`}
  >
    <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-current opacity-5 transition-opacity group-hover:opacity-10" />
    <div className="relative">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {Icon && (
          <Icon
            className={`h-4 w-4 ${alert ? "text-rose-500" : `text-${color}-500`}`}
          />
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`text-2xl font-bold tracking-tight ${alert ? "text-rose-700" : "text-slate-900"}`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-slate-500">{unit}</span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  </div>
);

// Tab Button
const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
      active
        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`}
  >
    <Icon className={`h-4 w-4 ${active ? "text-white" : "text-slate-400"}`} />
    {label}
    {active && (
      <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
      </span>
    )}
  </button>
);

// ============= CREATED CAPA HISTORY MODAL =============

const getCAPAHistoryPerson = (...values) => {
  for (const value of values.flat()) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) return text;
      continue;
    }
    if (typeof value === "object") {
      const fullName = [value.firstName, value.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      const text = firstNonBlankValue(
        value.name,
        value.fullName,
        fullName,
        value.employeeName,
        value.email,
        value.employeeId,
        value._id,
      );
      if (text) return String(text);
    }
  }
  return "";
};

const normalizeCAPAHistoryAttachments = (...collections) => {
  const source = collections.find(
    (collection) => Array.isArray(collection) && collection.length > 0,
  );
  if (!source) return [];

  return source.map((attachment, index) => {
    const isUrl = typeof attachment === "string";
    const url = isUrl
      ? attachment
      : firstNonBlankValue(
          attachment?.url,
          attachment?.fileUrl,
          attachment?.secureUrl,
          attachment?.downloadUrl,
          attachment?.path,
        );
    const name = isUrl
      ? String(attachment).split("/").pop() || `Attachment ${index + 1}`
      : firstNonBlankValue(
          attachment?.originalName,
          attachment?.fileName,
          attachment?.name,
          `Attachment ${index + 1}`,
        );
    const type = isUrl
      ? String(attachment).toLowerCase().includes(".pdf")
        ? "application/pdf"
        : "image/*"
      : firstNonBlankValue(attachment?.mimeType, attachment?.type);

    return {
      id: String(
        (!isUrl && firstNonBlankValue(attachment?._id, attachment?.id)) ||
          `history-attachment-${index}-${name}`,
      ),
      name: String(name || `Attachment ${index + 1}`),
      type: String(type || ""),
      size: isUrl ? 0 : Number(attachment?.size || 0),
      url: String(url || ""),
    };
  });
};

const getCreatedCAPARecord = (event = {}, index = 0) => {
  const capa = event?.capaSummary || event?.capa || {};
  const context = event?.context || {};
  const signal = event?.signal || event?.signalInfo || capa?.signal || {};
  const chartPoint = event?.chartPoint || capa?.chartPoint || {};

  const capaNumber = firstNonBlankValue(
    capa?.capaNumber,
    capa?.number,
    event?.correctiveAction?.capaNumber,
  );
  const capaTitle = firstNonBlankValue(
    capa?.capaTitle,
    capa?.title,
    event?.correctiveAction?.capaTitle,
    event?.investigation?.problemStatement,
    "Untitled CAPA",
  );
  const createdAt = firstNonBlankValue(
    capa?.createdAt,
    event?.capaCreatedAt,
    event?.createdAt,
  );

  const hasCreatedCapa = Boolean(
    event?.hasCapa === true ||
    capa?.created === true ||
    capaNumber ||
    event?.correctiveAction?.capaNumber,
  );

  return {
    id: String(event?._id || capa?._id || `capa-history-${index}`),
    event,
    capa,
    hasCreatedCapa,
    capaNumber: String(capaNumber || "CAPA Saved"),
    capaTitle: String(capaTitle || "Untitled CAPA"),
    status: String(capa?.status || event?.status || "OPEN").toUpperCase(),
    source: String(
      firstNonBlankValue(capa?.source, event?.capa?.source, "SPC ALERT"),
    ).toUpperCase(),
    severity: String(
      capa?.severity || event?.priority || event?.severity || "MEDIUM",
    ).toUpperCase(),
    problem: String(
      firstNonBlankValue(
        capa?.problem,
        capa?.problemStatement,
        event?.investigation?.problemStatement,
      ) || "",
    ),
    immediateContainment: String(
      firstNonBlankValue(
        capa?.immediateContainment,
        capa?.containmentAction,
        event?.containment?.immediateAction,
      ) || "",
    ),
    rootCause: String(
      firstNonBlankValue(
        capa?.rootCause,
        capa?.cause,
        event?.investigation?.rootCause,
      ) || "",
    ),
    correctiveAction: String(
      firstNonBlankValue(
        capa?.correctiveAction,
        capa?.action,
        event?.correctiveAction?.action,
      ) || "",
    ),
    preventiveAction: String(
      firstNonBlankValue(
        capa?.preventiveAction,
        event?.correctiveAction?.preventiveAction,
      ) || "",
    ),
    assignedTo: String(
      firstNonBlankValue(
        capa?.assignedTo,
        capa?.responsiblePerson,
        event?.assignedTo,
        event?.correctiveAction?.assignedTo,
      ) || "Unassigned",
    ),
    targetDate: firstNonBlankValue(
      capa?.targetDate,
      event?.correctiveAction?.dueDate,
    ),
    effectivenessCheck: String(
      firstNonBlankValue(
        capa?.effectivenessCheck,
        event?.verification?.effectivenessNotes,
      ) || "",
    ),
    verification: String(
      firstNonBlankValue(
        capa?.verification,
        capa?.verificationResult,
        event?.verification?.result,
        "PENDING",
      ),
    ).toUpperCase(),
    verifiedBy: getCAPAHistoryPerson(
      capa?.verifiedBy,
      event?.verification?.verifiedBy,
    ),
    approvedBy: getCAPAHistoryPerson(
      capa?.approvedBy,
      event?.approvals?.qualityManager,
    ),
    closureDate: firstNonBlankValue(
      capa?.closureDate,
      event?.resolvedAt,
      event?.closedAt,
    ),
    comments: String(firstNonBlankValue(capa?.comments, event?.comments) || ""),
    attachments: normalizeCAPAHistoryAttachments(
      capa?.attachments,
      capa?.evidenceAttachments,
      capa?.evidence,
      event?.attachments,
      event?.evidenceAttachments,
      event?.evidence,
    ),
    subgroupId: String(
      firstNonBlankValue(
        event?.subgroupId,
        context?.subgroupId,
        capa?.subgroupId,
      ) || "",
    ),
    subgroupNumber: firstNonBlankValue(
      event?.subgroupNumber,
      context?.subgroupNumber,
      capa?.subgroupNumber,
    ),
    subgroupSequence: firstNonBlankValue(
      event?.subgroupSequence,
      context?.subgroupSequence,
    ),
    collectedAt: firstNonBlankValue(
      event?.collectedAt,
      context?.collectedAt,
      chartPoint?.collectedAt,
    ),
    checkpointId: String(
      firstNonBlankValue(
        event?.checkpointId,
        context?.checkpointId,
        capa?.checkpointId,
      ) || "",
    ),
    checkpointName: String(
      firstNonBlankValue(
        event?.checkpointName,
        context?.checkpointName,
        capa?.checkpointName,
      ) || "Checkpoint",
    ),
    itemCode: String(
      firstNonBlankValue(event?.itemCode, context?.itemCode, capa?.itemCode) ||
        "",
    ),
    itemName: String(
      firstNonBlankValue(event?.itemName, context?.itemName, capa?.itemName) ||
        "",
    ),
    processName: String(
      firstNonBlankValue(
        event?.processName,
        context?.processName,
        capa?.processName,
      ) || "",
    ),
    reportNumber: String(
      firstNonBlankValue(
        event?.reportNumber,
        context?.reportNumber,
        capa?.reportNumber,
      ) || "",
    ),
    inspectionRunId: String(
      firstNonBlankValue(event?.inspectionRunId, context?.inspectionRunId) ||
        "",
    ),
    spcStreamKey: String(
      firstNonBlankValue(event?.spcStreamKey, context?.spcStreamKey) || "",
    ),
    chartType: String(
      firstNonBlankValue(event?.chartType, context?.chartType) || "",
    ),
    chartPanel: String(
      firstNonBlankValue(event?.chartPanel, context?.chartPanel) || "",
    ),
    signalValue: toFiniteNumberOrNull(
      firstNonBlankValue(signal?.value, chartPoint?.value, chartPoint?.xbar),
    ),
    ucl: toFiniteNumberOrNull(firstNonBlankValue(signal?.ucl, chartPoint?.ucl)),
    lcl: toFiniteNumberOrNull(firstNonBlankValue(signal?.lcl, chartPoint?.lcl)),
    usl: toFiniteNumberOrNull(firstNonBlankValue(signal?.usl, chartPoint?.usl)),
    lsl: toFiniteNumberOrNull(firstNonBlankValue(signal?.lsl, chartPoint?.lsl)),
    violation: String(
      firstNonBlankValue(
        signal?.violation,
        signal?.ruleName,
        event?.ruleName,
        event?.violationType,
        chartPoint?.ruleName,
      ) || "",
    ),
    createdAt,
    updatedAt: firstNonBlankValue(capa?.updatedAt, event?.updatedAt),
    createdBy: getCAPAHistoryPerson(
      capa?.createdBy,
      event?.createdBy,
      event?.reportedBy,
    ),
    updatedBy: getCAPAHistoryPerson(capa?.updatedBy, event?.updatedBy),
  };
};

const CAPAHistoryValue = ({ label, value, mono = false }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p
      className={`mt-1 break-words text-sm font-medium text-slate-800 ${mono ? "font-mono text-xs" : ""}`}
    >
      {value === "" || value === null || value === undefined ? "—" : value}
    </p>
  </div>
);

const CAPAHistoryText = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
      {String(value || "").trim() || "—"}
    </p>
  </div>
);

const CAPAHistoryModal = ({
  isOpen,
  onClose,
  checkpointId,
  checkpointName,
  spcStreamKey,
  selectedSubgroupId,
  refreshKey = 0,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [searchText, setSearchText] = useState("");

  const loadCreatedCAPAHistory = useCallback(async () => {
    if (!checkpointId || !selectedSubgroupId) {
      setEvents([]);
      setError(
        !checkpointId
          ? "Checkpoint ID is required to load CAPA history."
          : "Selected subgroup ID is required to load CAPA history.",
      );
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.get(SPC_EVENTS_API, {
        params: {
          checkpointId,
          subgroupId: selectedSubgroupId,
          spcStreamKey: spcStreamKey || undefined,
          hasCapa: true,
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
        withCredentials: true,
      });

      const loadedEvents = response?.data?.data?.events || [];
      setEvents(Array.isArray(loadedEvents) ? loadedEvents : []);
    } catch (historyError) {
      console.error("Unable to load created CAPA history:", historyError);
      setEvents([]);
      setError(
        historyError?.response?.data?.message ||
          historyError?.message ||
          "Unable to load created CAPA history.",
      );
    } finally {
      setLoading(false);
    }
  }, [checkpointId, selectedSubgroupId, spcStreamKey]);

  useEffect(() => {
    if (!isOpen) return;
    setSearchText("");
    loadCreatedCAPAHistory();
  }, [isOpen, loadCreatedCAPAHistory, refreshKey]);

  if (!isOpen) return null;

  const createdCAPAs = events
    .map(getCreatedCAPARecord)
    .filter(
      (record) =>
        record.hasCreatedCapa &&
        String(record.subgroupId || "") === String(selectedSubgroupId || ""),
    );

  const normalizedSearch = searchText.trim().toLowerCase();
  const visibleCAPAs = createdCAPAs.filter((record) => {
    if (!normalizedSearch) return true;
    return [
      record.capaNumber,
      record.capaTitle,
      record.status,
      record.source,
      record.severity,
      record.problem,
      record.immediateContainment,
      record.rootCause,
      record.correctiveAction,
      record.preventiveAction,
      record.assignedTo,
      record.effectivenessCheck,
      record.verification,
      record.verifiedBy,
      record.approvedBy,
      record.comments,
      record.subgroupId,
      record.subgroupNumber,
      record.checkpointName,
      record.itemCode,
      record.itemName,
      record.processName,
      record.reportNumber,
      record.violation,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  const severityClass = (severity) => {
    if (severity === "CRITICAL" || severity === "HIGH") {
      return "border-rose-200 bg-rose-50 text-rose-700";
    }
    if (severity === "LOW") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  const verificationClass = (verification) => {
    if (verification === "EFFECTIVE") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (verification === "NOT_EFFECTIVE") {
      return "border-rose-200 bg-rose-50 text-rose-700";
    }
    if (verification === "INCONCLUSIVE") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }
    return "border-slate-200 bg-slate-100 text-slate-700";
  };

  const formatHistoryDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  };

  const formatHistoryNumber = (value) =>
    value === null || value === undefined ? "—" : formatNumber(value, 4);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div
          className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-purple-50 via-white to-slate-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-100 p-2.5">
                <Clock className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Selected Subgroup CAPA Full History
                </h2>
                <p className="text-xs text-slate-500">
                  Every saved CAPA field for subgroup{" "}
                  {selectedSubgroupId || "—"} of{" "}
                  {checkpointName || "this checkpoint"}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadCreatedCAPAHistory}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="border-b border-slate-100 bg-white px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search any CAPA field"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-500/15"
                />
              </div>
              <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
                {visibleCAPAs.length} created CAPA
                {visibleCAPAs.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6">
            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600" />
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    Loading complete CAPA history...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">
                      CAPA history could not be loaded
                    </p>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
              </div>
            ) : visibleCAPAs.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div>
                  <FileCheck2 className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No CAPA history for this subgroup
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    No created CAPA exists for the selected subgroup.
                    Investigation-only events are excluded.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {visibleCAPAs.map((record) => (
                  <article
                    key={record.id}
                    className="overflow-hidden rounded-2xl border border-purple-300 bg-white shadow-sm ring-2 ring-purple-500/10"
                  >
                    <div className="border-b border-slate-200 bg-gradient-to-r from-purple-50 via-white to-blue-50 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800">
                              {record.capaNumber}
                            </span>
                            <StatusBadge status={record.status} />
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${severityClass(record.severity)}`}
                            >
                              {record.severity}
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${verificationClass(record.verification)}`}
                            >
                              Verification: {record.verification}
                            </span>
                          </div>
                          <h3 className="mt-3 text-lg font-bold text-slate-900">
                            {record.capaTitle}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {record.checkpointName} · Selected subgroup{" "}
                            {record.subgroupNumber || record.subgroupId || "—"}
                          </p>
                        </div>
                        <div className="grid min-w-[220px] grid-cols-1 gap-1 text-right text-xs text-slate-500">
                          <p>
                            <span className="font-semibold text-slate-700">
                              Created:
                            </span>{" "}
                            {formatHistoryDate(record.createdAt)}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700">
                              Updated:
                            </span>{" "}
                            {formatHistoryDate(record.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 p-5">
                      <section>
                        <div className="mb-3 flex items-center gap-2">
                          <FileCheck2 className="h-4 w-4 text-purple-600" />
                          <h4 className="text-sm font-bold text-slate-900">
                            CAPA Record
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <CAPAHistoryValue
                            label="CAPA Number"
                            value={record.capaNumber}
                          />
                          <CAPAHistoryValue
                            label="CAPA Title"
                            value={record.capaTitle}
                          />
                          <CAPAHistoryValue
                            label="Status"
                            value={record.status}
                          />
                          <CAPAHistoryValue
                            label="Source"
                            value={record.source}
                          />
                          <CAPAHistoryValue
                            label="Severity"
                            value={record.severity}
                          />
                          <CAPAHistoryValue
                            label="Responsible Person"
                            value={record.assignedTo}
                          />
                          <CAPAHistoryValue
                            label="Target Completion Date"
                            value={formatHistoryDate(record.targetDate)}
                          />
                          <CAPAHistoryValue
                            label="Created By"
                            value={record.createdBy}
                          />
                          <CAPAHistoryValue
                            label="Created At"
                            value={formatHistoryDate(record.createdAt)}
                          />
                          <CAPAHistoryValue
                            label="Updated By"
                            value={record.updatedBy}
                          />
                          <CAPAHistoryValue
                            label="Last Updated"
                            value={formatHistoryDate(record.updatedAt)}
                          />
                          <CAPAHistoryValue
                            label="Event ID"
                            value={record.id}
                            mono
                          />
                        </div>
                      </section>

                      <section>
                        <div className="mb-3 flex items-center gap-2">
                          <Search className="h-4 w-4 text-blue-600" />
                          <h4 className="text-sm font-bold text-slate-900">
                            Problem Investigation
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                          <CAPAHistoryText
                            label="Problem Statement"
                            value={record.problem}
                          />
                          <CAPAHistoryText
                            label="Immediate Containment Action"
                            value={record.immediateContainment}
                          />
                          <CAPAHistoryText
                            label="Root Cause"
                            value={record.rootCause}
                          />
                        </div>
                      </section>

                      <section>
                        <div className="mb-3 flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-amber-600" />
                          <h4 className="text-sm font-bold text-slate-900">
                            Corrective and Preventive Action
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                          <CAPAHistoryText
                            label="Corrective Action"
                            value={record.correctiveAction}
                          />
                          <CAPAHistoryText
                            label="Preventive Action"
                            value={record.preventiveAction}
                          />
                          <CAPAHistoryText
                            label="Effectiveness Check"
                            value={record.effectivenessCheck}
                          />
                          <CAPAHistoryText
                            label="Additional Comments"
                            value={record.comments}
                          />
                        </div>
                      </section>

                      <section>
                        <div className="mb-3 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          <h4 className="text-sm font-bold text-slate-900">
                            Verification, Approval and Closure
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <CAPAHistoryValue
                            label="Verification Result"
                            value={record.verification}
                          />
                          <CAPAHistoryValue
                            label="Verified By"
                            value={record.verifiedBy}
                          />
                          <CAPAHistoryValue
                            label="Approved By"
                            value={record.approvedBy}
                          />
                          <CAPAHistoryValue
                            label="Closure Date"
                            value={formatHistoryDate(record.closureDate)}
                          />
                        </div>
                      </section>

                      <section>
                        <div className="mb-3 flex items-center gap-2">
                          <Database className="h-4 w-4 text-slate-600" />
                          <h4 className="text-sm font-bold text-slate-900">
                            Selected Subgroup and SPC Context
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <CAPAHistoryValue
                            label="Subgroup Number"
                            value={record.subgroupNumber}
                          />
                          <CAPAHistoryValue
                            label="Subgroup ID"
                            value={record.subgroupId}
                            mono
                          />
                          <CAPAHistoryValue
                            label="Subgroup Sequence"
                            value={record.subgroupSequence}
                          />
                          <CAPAHistoryValue
                            label="Collected At"
                            value={formatHistoryDate(record.collectedAt)}
                          />
                          <CAPAHistoryValue
                            label="Checkpoint"
                            value={record.checkpointName}
                          />
                          <CAPAHistoryValue
                            label="Checkpoint ID"
                            value={record.checkpointId}
                            mono
                          />
                          <CAPAHistoryValue
                            label="Item Code"
                            value={record.itemCode}
                          />
                          <CAPAHistoryValue
                            label="Item Name"
                            value={record.itemName}
                          />
                          <CAPAHistoryValue
                            label="Process"
                            value={record.processName}
                          />
                          <CAPAHistoryValue
                            label="Report Number"
                            value={record.reportNumber}
                          />
                          <CAPAHistoryValue
                            label="Inspection Run ID"
                            value={record.inspectionRunId}
                            mono
                          />
                          <CAPAHistoryValue
                            label="SPC Stream Key"
                            value={record.spcStreamKey}
                            mono
                          />
                          <CAPAHistoryValue
                            label="Chart Type"
                            value={record.chartType?.toUpperCase()}
                          />
                          <CAPAHistoryValue
                            label="Chart Panel"
                            value={record.chartPanel?.toUpperCase()}
                          />
                          <CAPAHistoryValue
                            label="Signal Value"
                            value={formatHistoryNumber(record.signalValue)}
                          />
                          <CAPAHistoryValue
                            label="Rule / Violation"
                            value={record.violation}
                          />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <CAPAHistoryValue
                            label="UCL"
                            value={formatHistoryNumber(record.ucl)}
                          />
                          <CAPAHistoryValue
                            label="LCL"
                            value={formatHistoryNumber(record.lcl)}
                          />
                          <CAPAHistoryValue
                            label="USL"
                            value={formatHistoryNumber(record.usl)}
                          />
                          <CAPAHistoryValue
                            label="LSL"
                            value={formatHistoryNumber(record.lsl)}
                          />
                        </div>
                      </section>

                      <section>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <h4 className="text-sm font-bold text-slate-900">
                              Evidence Attachments
                            </h4>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {record.attachments.length} file
                            {record.attachments.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        {record.attachments.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {record.attachments.map((attachment) => {
                              const isImage =
                                attachment.type?.startsWith("image/");
                              return (
                                <div
                                  key={attachment.id}
                                  className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                                >
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                                    {isImage && attachment.url ? (
                                      <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <FileText className="h-5 w-5 text-rose-600" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className="truncate text-sm font-semibold text-slate-800"
                                      title={attachment.name}
                                    >
                                      {attachment.name}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                      {formatFileSize(attachment.size)}
                                    </p>
                                    {attachment.url ? (
                                      <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-1 inline-flex text-xs font-semibold text-blue-600 hover:underline"
                                      >
                                        View attachment
                                      </a>
                                    ) : (
                                      <p className="mt-1 text-xs text-slate-400">
                                        Saved file URL unavailable
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                            No evidence attachments were saved with this CAPA.
                          </div>
                        )}
                      </section>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
            <p className="text-xs text-slate-500">
              All CAPA form fields are displayed. A dash means that field was
              not saved by the API.
            </p>
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

// ============= SUBGROUP DETAILS MODAL =============
const getSubgroupReadingRows = (metadata = {}) => {
  const normalizeReading = (reading, index, defaults = {}) => {
    const source =
      reading && typeof reading === "object" ? reading : { value: reading };

    const numericValue = toFiniteNumberOrNull(
      source.value ??
        source.measured ??
        source.reading ??
        source.result ??
        source.numericValue,
    );

    if (numericValue === null) return null;

    const explicitStatus = String(source.status ?? "").trim();
    const pass =
      typeof source.pass === "boolean"
        ? source.pass
        : explicitStatus
          ? /^(pass|passed|ok|accepted|within specification)$/i.test(
              explicitStatus,
            )
          : null;

    return {
      id: `${defaults.pieceNumber ?? source.pieceNumber ?? index + 1}-${source.readingNumber ?? defaults.readingNumber ?? 1}-${index}`,
      pieceNumber: source.pieceNumber ?? defaults.pieceNumber ?? index + 1,
      readingNumber: source.readingNumber ?? defaults.readingNumber ?? 1,
      value: numericValue,
      deviation: toFiniteNumberOrNull(source.deviation),
      pass,
      status:
        explicitStatus ||
        (pass === true ? "Pass" : pass === false ? "Fail" : ""),
      resultReason: source.resultReason ?? source.reason ?? "",
      measuredAt: unwrapSubgroupReadingDate(
        source.measuredAt ?? source.collectedAt ?? defaults.measuredAt,
      ),
      instrumentId: source.instrumentId ?? defaults.instrumentId ?? "",
    };
  };

  const directCollections = [
    metadata.rawReadings,
    metadata.readings,
    metadata.rawValues,
    metadata.values,
  ];

  for (const collection of directCollections) {
    if (Array.isArray(collection) && collection.length > 0) {
      const normalizedRows = collection
        .map((reading, index) => normalizeReading(reading, index))
        .filter(Boolean);
      if (normalizedRows.length > 0) return normalizedRows;
    }
  }

  const pieceCollection = Array.isArray(metadata.pieceValues)
    ? metadata.pieceValues
    : Array.isArray(metadata.pieceMeasurements)
      ? metadata.pieceMeasurements
      : [];

  if (pieceCollection.length > 0) {
    return pieceCollection.flatMap((piece, pieceIndex) => {
      const pieceNumber = piece?.pieceNumber ?? pieceIndex + 1;
      const nestedReadings = Array.isArray(piece?.readings)
        ? piece.readings
        : [];

      if (nestedReadings.length > 0) {
        return nestedReadings
          .map((reading, readingIndex) =>
            normalizeReading(reading, readingIndex, {
              pieceNumber,
              readingNumber: readingIndex + 1,
              measuredAt: piece?.measuredAt,
              instrumentId: piece?.instrumentId,
            }),
          )
          .filter(Boolean);
      }

      const singlePieceReading = normalizeReading(piece, pieceIndex, {
        pieceNumber,
        readingNumber: 1,
      });

      return singlePieceReading ? [singlePieceReading] : [];
    });
  }

  if (
    Array.isArray(metadata.allPieceValues) &&
    metadata.allPieceValues.length > 0
  ) {
    return metadata.allPieceValues
      .map((reading, index) => normalizeReading(reading, index))
      .filter(Boolean);
  }

  return [];
};

const SubgroupDetailsModal = ({
  isOpen,
  onClose,
  subgroupData,
  chart,
  onAlertSubmit,
}) => {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showCAPAHistory, setShowCAPAHistory] = useState(false);
  const [capaHistoryRefreshKey, setCapaHistoryRefreshKey] = useState(0);
  const [alertFormData, setAlertFormData] = useState(null);
  const [eventLookup, setEventLookup] = useState({
    loading: false,
    event: null,
    capa: null,
    hasCapa: false,
  });

  const eventContext = useMemo(
    () => buildSPCEventContext(chart, subgroupData),
    [chart, subgroupData],
  );

  useEffect(() => {
    if (!isOpen || !eventContext.checkpointId || !eventContext.subgroupId) {
      return undefined;
    }

    let cancelled = false;
    setEventLookup((current) => ({ ...current, loading: true }));

    axios
      .get(`${SPC_EVENTS_API}/point`, {
        params: eventContext,
        withCredentials: true,
      })
      .then((response) => {
        if (cancelled) return;
        const data = response?.data?.data || {};
        setEventLookup({
          loading: false,
          event: data.event || null,
          capa: data.capa || null,
          hasCapa: data.hasCapa === true,
        });
      })
      .catch((lookupError) => {
        if (cancelled) return;
        console.error("Unable to load SPC event for subgroup:", lookupError);
        setEventLookup({
          loading: false,
          event: null,
          capa: null,
          hasCapa: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    eventContext.checkpointId,
    eventContext.subgroupId,
    eventContext.chartPanel,
    eventContext.chartPointIndex,
    eventContext.spcStreamKey,
  ]);

  if (!isOpen || !subgroupData) return null;

  const metadata = subgroupData.metadata || {};
  const subgroupIndex = subgroupData.originalIndex;
  const sourceLabel = subgroupData.sourceLabel;
  const chartReadingPayload =
    chart?.subgroupReadings?.[subgroupIndex] ??
    chart?.rawReadingsSeries?.[subgroupIndex] ??
    chart?.readingsByIndex?.[subgroupIndex] ??
    chart?.readingsBySubgroup?.[sourceLabel] ??
    null;

  const firstNonEmptyArray = (...values) =>
    values.find((value) => Array.isArray(value) && value.length > 0);

  const metadataWithReadings = {
    ...metadata,
    rawReadings: firstNonEmptyArray(
      metadata.rawReadings,
      chartReadingPayload?.rawReadings,
      Array.isArray(chartReadingPayload) ? chartReadingPayload : undefined,
    ),
    pieceValues: firstNonEmptyArray(
      metadata.pieceValues,
      chartReadingPayload?.pieceValues,
    ),
    allPieceValues: firstNonEmptyArray(
      metadata.allPieceValues,
      chartReadingPayload?.allPieceValues,
    ),
  };

  const readingRows = getSubgroupReadingRows(metadataWithReadings);
  const readingPrecision = Math.min(
    8,
    Math.max(
      0,
      Number(chart?.decimalPrecision ?? metadata?.decimalPrecision ?? 4),
    ),
  );

  const hiddenMetadataKeys = new Set([
    "rawvalues",
    "values",
    "readings",
    "rawreadings",
    "piecevalues",
    "piecemeasurements",
    "allpiecevalues",
    "readingsrecorded",
    "readingsperpiece",
    "inspectionid",
    "label",
    "collectedat",
    "reactionstate",
  ]);

  const visibleMetadataEntries = Object.entries(metadata).filter(([key]) => {
    const normalizedKey = String(key)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    return !hiddenMetadataKeys.has(normalizedKey);
  });

  const getControlLimits = () => {
    const limits = { center: null, ucl: null, lcl: null, usl: null, lsl: null };

    if (subgroupData.xbar !== undefined && chart?.xbarCenterSeries) {
      limits.center = chart.xbarCenterSeries[subgroupData.originalIndex];
      limits.ucl = chart.xbarUclSeries?.[subgroupData.originalIndex];
      limits.lcl = chart.xbarLclSeries?.[subgroupData.originalIndex];
    } else if (
      subgroupData.individual !== undefined &&
      chart?.individualCenter
    ) {
      limits.center = chart.individualCenter[subgroupData.originalIndex];
      limits.ucl = chart.individualUcl?.[subgroupData.originalIndex];
      limits.lcl = chart.individualLcl?.[subgroupData.originalIndex];
    } else if (subgroupData.value !== undefined && chart?.center) {
      limits.center = chart.center[subgroupData.originalIndex];
      limits.ucl = chart.ucl?.[subgroupData.originalIndex];
      limits.lcl = chart.lcl?.[subgroupData.originalIndex];
    }

    limits.usl = chart?.usl;
    limits.lsl = chart?.lsl;

    return limits;
  };

  const limits = getControlLimits();

  const isOutOfControl = () => {
    const value =
      subgroupData.xbar ?? subgroupData.individual ?? subgroupData.value;
    if (value === null || value === undefined) return false;
    if (limits.ucl !== null && limits.ucl !== undefined && value > limits.ucl)
      return true;
    if (limits.lcl !== null && limits.lcl !== undefined && value < limits.lcl)
      return true;
    return false;
  };

  const isOutOfSpec = () => {
    const value =
      subgroupData.xbar ?? subgroupData.individual ?? subgroupData.value;
    if (value === null || value === undefined) return false;
    if (limits.usl !== null && limits.usl !== undefined && value > limits.usl)
      return true;
    if (limits.lsl !== null && limits.lsl !== undefined && value < limits.lsl)
      return true;
    return false;
  };

  const outOfControl = isOutOfControl();
  const outOfSpec = isOutOfSpec();

  const handleOpenAlert = () => {
    const alertData = {
      subgroup: subgroupData,
      chart: chart,
      signalInfo: {
        isAlert: outOfControl || outOfSpec,
        value:
          subgroupData.xbar ?? subgroupData.individual ?? subgroupData.value,
        severity: outOfControl ? "Critical" : outOfSpec ? "Warning" : "Normal",
        ucl: limits.ucl,
        lcl: limits.lcl,
        usl: limits.usl,
        lsl: limits.lsl,
      },
      readings: readingRows,
      metadata: metadata,
      context: eventContext,
      existingEvent: eventLookup.event,
      capa: eventLookup.capa,
      createCapa: Boolean(eventLookup.hasCapa || outOfControl || outOfSpec),
    };

    setAlertFormData(alertData);
    setShowAlertModal(true);
  };

  const handleSaveAlertEvent = async (payload) => {
    if (!eventContext.checkpointId || !eventContext.subgroupId) {
      throw new Error(
        "Checkpoint ID and subgroup ID are required before saving the SPC event.",
      );
    }

    const requestPayload = {
      ...payload,
      eventId: eventLookup.event?._id || undefined,
      context: eventContext,
      workflowAction: payload.workflowAction || "SAVE",
      createCapa: payload.createCapa === true,
    };
    delete requestPayload.attachmentFiles;

    const response = await axios.post(
      `${SPC_EVENTS_API}/upsert`,
      requestPayload,
      { withCredentials: true },
    );

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Unable to save SPC event.");
    }

    const data = response.data.data || {};
    setEventLookup({
      loading: false,
      event: data.event || null,
      capa: data.capa || null,
      hasCapa: data.hasCapa === true,
    });
    if (data.hasCapa === true) {
      setCapaHistoryRefreshKey((current) => current + 1);
    }
    window.dispatchEvent(
      new CustomEvent("spc-capa-updated", {
        detail: {
          checkpointId: eventContext.checkpointId,
          subgroupId: eventContext.subgroupId,
          hasCapa: data.hasCapa === true,
          capa: data.capa || null,
        },
      }),
    );
    toast.success(response.data.message || "SPC event saved successfully");
    await onAlertSubmit?.(data);
    return data;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
  <div
    className="fixed inset-0 bg-black/60 transition-opacity"
    onClick={onClose}
  />

  <div className="relative flex min-h-[100dvh] items-stretch justify-center sm:items-center sm:p-4">
    <div className="relative flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-white shadow-xl sm:h-auto sm:max-h-[90dvh] sm:rounded-xl">
      {/* Header */}
      <div className="relative z-20 flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 pr-10 lg:pr-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Subgroup Details
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {outOfControl && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
                  ⚠️ Out of Control
                </span>
              )}

              {outOfSpec && !outOfControl && (
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-800">
                  ⚠️ Out of Spec
                </span>
              )}
              {!outOfControl && !outOfSpec && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                  ✓ In Control
                </span>
              )}
              {eventLookup.loading ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking CAPA
                </span>
              ) : eventLookup.hasCapa ? (
                <span className="inline-flex max-w-full items-center rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800 [overflow-wrap:anywhere]">
                  CAPA Created · {eventLookup.capa?.capaNumber || "Saved"}
                </span>
              ) : eventLookup.event ? (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                  Investigation Saved · No CAPA
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  No CAPA
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <button
            type="button"
            onClick={() => setShowCAPAHistory(true)}
            disabled={!eventContext.checkpointId || !eventContext.subgroupId}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition-all hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-4"
            title="Show CAPA history only for the selected subgroup"
          >
            <Clock className="h-4 w-4 shrink-0" />
            Subgroup CAPA History
          </button>
          <button
            onClick={handleOpenAlert}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all sm:w-auto sm:px-4 ${
              outOfControl || outOfSpec
                ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            {outOfControl || outOfSpec ? "Report Alert" : "Create CAPA"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:static"
            aria-label="Close subgroup details"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:space-y-6 sm:p-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          <div className="min-w-0 space-y-2 rounded-lg bg-slate-50 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">
                Subgroup
              </span>
              <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                #{subgroupData.originalIndex + 1}
              </span>
            </div>
            {subgroupData.collectedAt && (
              <div className="flex flex-wrap items-start gap-x-2 gap-y-1 text-sm">
                <span className="shrink-0 text-slate-500">Collected:</span>
                <span className="min-w-0 text-slate-700 [overflow-wrap:anywhere]">
                  {new Date(subgroupData.collectedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-2 rounded-lg bg-slate-50 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Chart</span>
            </div>
            <p className="text-base font-semibold text-slate-900">
              {chart?.type?.toUpperCase() || "N/A"}
            </p>
            <div className="flex flex-wrap items-start gap-x-2 gap-y-1 text-sm">
              <span className="shrink-0 text-slate-500">Checkpoint:</span>
              <span className="min-w-0 text-slate-700 [overflow-wrap:anywhere]">
                {chart?.checkpointName || "N/A"}
              </span>
            </div>
          </div>

          <div className="min-w-0 space-y-2 rounded-lg bg-slate-50 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">
                Details
              </span>
            </div>
            {subgroupData.baselineVersion && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Baseline:</span>
                <span className="text-slate-700">
                  v{subgroupData.baselineVersion}
                </span>
              </div>
            )}
            {chart?.subgroupSize && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Subgroup Size:</span>
                <span className="text-slate-700">{chart.subgroupSize}</span>
              </div>
            )}
            {chart?.unit && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Unit:</span>
                <span className="text-slate-700">{chart.unit}</span>
              </div>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            📊 Metrics & Control Limits
          </h3>
          <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {subgroupData.xbar !== undefined && subgroupData.xbar !== null && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <span className="text-xs text-blue-600 font-medium">X-bar</span>
                <p className="text-xl font-bold text-blue-900">
                  {formatCustomerReportValue(subgroupData.xbar, 4)}
                </p>
                {limits.center !== null && limits.center !== undefined && (
                  <div className="text-xs text-slate-500 mt-1">
                    Center: {formatCustomerReportValue(limits.center, 4)}
                  </div>
                )}
              </div>
            )}
            {subgroupData.individual !== undefined &&
              subgroupData.individual !== null && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <span className="text-xs text-blue-600 font-medium">
                    Individual
                  </span>
                  <p className="text-xl font-bold text-blue-900">
                    {formatCustomerReportValue(subgroupData.individual, 4)}
                  </p>
                  {limits.center !== null && limits.center !== undefined && (
                    <div className="text-xs text-slate-500 mt-1">
                      Center: {formatCustomerReportValue(limits.center, 4)}
                    </div>
                  )}
                </div>
              )}
            {subgroupData.value !== undefined &&
              subgroupData.value !== null && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <span className="text-xs text-blue-600 font-medium">
                    Value
                  </span>
                  <p className="text-xl font-bold text-blue-900">
                    {formatCustomerReportValue(subgroupData.value, 4)}
                  </p>
                  {limits.center !== null && limits.center !== undefined && (
                    <div className="text-xs text-slate-500 mt-1">
                      Center: {formatCustomerReportValue(limits.center, 4)}
                    </div>
                  )}
                </div>
              )}
            {subgroupData.range !== undefined &&
              subgroupData.range !== null && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <span className="text-xs text-purple-600 font-medium">
                    Range
                  </span>
                  <p className="text-xl font-bold text-purple-900">
                    {formatCustomerReportValue(subgroupData.range, 4)}
                  </p>
                </div>
              )}
            {subgroupData.movingRange !== undefined &&
              subgroupData.movingRange !== null && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <span className="text-xs text-purple-600 font-medium">
                    Moving Range
                  </span>
                  <p className="text-xl font-bold text-purple-900">
                    {formatCustomerReportValue(subgroupData.movingRange, 4)}
                  </p>
                </div>
              )}
            {limits.ucl !== null && limits.ucl !== undefined && (
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <span className="text-xs text-orange-600 font-medium">UCL</span>
                <p className="text-lg font-semibold text-orange-900">
                  {formatCustomerReportValue(limits.ucl, 4)}
                </p>
              </div>
            )}
            {limits.lcl !== null && limits.lcl !== undefined && (
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <span className="text-xs text-orange-600 font-medium">LCL</span>
                <p className="text-lg font-semibold text-orange-900">
                  {formatCustomerReportValue(limits.lcl, 4)}
                </p>
              </div>
            )}
            {limits.usl !== null && limits.usl !== undefined && (
              <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                <span className="text-xs text-red-600 font-medium">USL</span>
                <p className="text-lg font-semibold text-red-900">
                  {formatCustomerReportValue(limits.usl, 4)}
                </p>
              </div>
            )}
            {limits.lsl !== null && limits.lsl !== undefined && (
              <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                <span className="text-xs text-red-600 font-medium">LSL</span>
                <p className="text-lg font-semibold text-red-900">
                  {formatCustomerReportValue(limits.lsl, 4)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            📊 Summary
          </h3>
          <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div>
                <span className="text-xs text-slate-500">Status</span>
                <p
                  className={`text-sm font-semibold ${outOfControl ? "text-red-600" : outOfSpec ? "text-orange-600" : "text-green-600"}`}
                >
                  {outOfControl
                    ? "⚠️ Out of Control"
                    : outOfSpec
                      ? "⚠️ Out of Spec"
                      : "✅ In Control"}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Subgroup Size</span>
                <p className="text-sm font-semibold text-slate-900">
                  {chart?.subgroupSize || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">
                  Readings Recorded
                </span>
                <p className="text-sm font-semibold text-slate-900">
                  {readingRows.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Readings Table */}
        <div className="border-t border-slate-200 pt-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2 sm:items-end">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-700">
                📋 Selected Subgroup Readings
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Every recorded reading belonging to this subgroup.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {readingRows.length} reading
              {readingRows.length === 1 ? "" : "s"}
            </span>
          </div>

          {readingRows.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="overflow-visible md:overflow-x-auto">
                <table className="block min-w-full md:table md:divide-y md:divide-slate-200">
                  <thead className="hidden bg-slate-50 md:table-header-group">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Piece
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Reading
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Value
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Deviation
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Measured At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="block bg-slate-50 p-3 md:table-row-group md:divide-y md:divide-slate-100 md:bg-white md:p-0">
                    {readingRows.map((reading, index) => {
                      const derivedPass =
                        reading.pass !== null
                          ? reading.pass
                          : limits.usl !== null &&
                              limits.usl !== undefined &&
                              reading.value > limits.usl
                            ? false
                            : limits.lsl !== null &&
                                limits.lsl !== undefined &&
                                reading.value < limits.lsl
                              ? false
                              : limits.usl !== null || limits.lsl !== null
                                ? true
                                : null;

                      const statusText =
                        reading.status ||
                        (derivedPass === true
                          ? "Pass"
                          : derivedPass === false
                            ? "Fail"
                            : "N/A");
                      const measuredDate = reading.measuredAt
                        ? new Date(reading.measuredAt)
                        : null;
                      const validMeasuredDate =
                        measuredDate && !Number.isNaN(measuredDate.getTime());

                      return (
                        <tr
                          key={reading.id || index}
                          className="mb-3 block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm last:mb-0 hover:bg-slate-50/80 md:mb-0 md:table-row md:rounded-none md:border-0 md:shadow-none"
                        >
                          <td className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-sm font-medium text-slate-900 md:table-cell md:whitespace-nowrap md:border-b-0 md:px-4 md:py-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 md:hidden">
                              Piece
                            </span>
                            <span>{reading.pieceNumber ?? index + 1}</span>
                          </td>
                          <td className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-sm text-slate-700 md:table-cell md:whitespace-nowrap md:border-b-0 md:px-4 md:py-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 md:hidden">
                              Reading
                            </span>
                            <span>{reading.readingNumber ?? 1}</span>
                          </td>
                          <td className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-sm font-semibold tabular-nums text-slate-900 md:table-cell md:whitespace-nowrap md:border-b-0 md:px-4 md:py-3 md:text-right">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 md:hidden">
                              Value
                            </span>
                            <span>
                              {formatCustomerReportValue(
                                reading.value,
                                readingPrecision,
                              )}{" "}
                              <span className="font-normal text-slate-500">
                                {chart?.unit || ""}
                              </span>
                            </span>
                          </td>
                          <td className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-sm tabular-nums text-slate-700 md:table-cell md:whitespace-nowrap md:border-b-0 md:px-4 md:py-3 md:text-right">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 md:hidden">
                              Deviation
                            </span>
                            <span>
                              {reading.deviation !== null &&
                              reading.deviation !== undefined
                                ? formatCustomerReportValue(
                                    reading.deviation,
                                    readingPrecision,
                                  )
                                : "—"}
                            </span>
                          </td>
                          <td className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-center md:table-cell md:whitespace-nowrap md:border-b-0 md:px-4 md:py-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 md:hidden">
                              Status
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                derivedPass === true
                                  ? "bg-green-100 text-green-700"
                                  : derivedPass === false
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-600"
                              }`}
                              title={reading.resultReason || undefined}
                            >
                              {statusText}
                            </span>
                          </td>
                          <td className="flex items-start justify-between gap-3 px-3 py-2 text-sm text-slate-600 md:table-cell md:whitespace-nowrap md:px-4 md:py-3">
                            <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500 md:hidden">
                              Measured At
                            </span>
                            <span className="min-w-0 text-right [overflow-wrap:anywhere] md:text-left">
                              {validMeasuredDate
                                ? measuredDate.toLocaleString()
                                : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Raw readings are not available in this subgroup metadata.
            </div>
          )}
        </div>

        {/* Additional Metadata */}
        {visibleMetadataEntries.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              🔍 Additional Information
            </h3>
            <div className="rounded-lg bg-slate-50 p-3 sm:p-4">
              <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {visibleMetadataEntries.slice(0, 12).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex min-w-0 flex-col items-start justify-between border-b border-slate-200 py-2 sm:flex-row"
                  >
                    <dt className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </dt>
                    <dd className="mt-1 min-w-0 max-w-full whitespace-pre-wrap text-left text-sm font-medium text-slate-900 [overflow-wrap:anywhere] sm:ml-4 sm:mt-0 sm:text-right">
                      {typeof value === "object"
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-xs text-slate-500 [overflow-wrap:anywhere]">
            <span className="font-medium">
              Subgroup #{subgroupData.originalIndex + 1}
            </span>
            {subgroupData.collectedAt && (
              <>
                {" "}
                • Collected:{" "}
                {new Date(subgroupData.collectedAt).toLocaleString()}
              </>
            )}
          </div>
          <div className="flex w-full flex-col-reverse gap-2 min-[380px]:flex-row sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 min-[380px]:w-auto"
            >
              Close
            </button>
            <button
              onClick={handleOpenAlert}
              className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all min-[380px]:w-auto ${
                outOfControl || outOfSpec
                  ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              {eventLookup.hasCapa
                ? "Open CAPA"
                : outOfControl || outOfSpec
                  ? "Create CAPA"
                  : "Submit Observation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  
      <CAPAHistoryModal
        isOpen={showCAPAHistory}
        onClose={() => setShowCAPAHistory(false)}
        checkpointId={eventContext.checkpointId}
        checkpointName={eventContext.checkpointName || chart?.checkpointName}
        spcStreamKey={eventContext.spcStreamKey}
        selectedSubgroupId={eventContext.subgroupId}
        refreshKey={capaHistoryRefreshKey}
      />

      {/* Alert Modal */}
      {showAlertModal && (
        <SimpleSPCAlertModal
          isOpen={showAlertModal}
          onClose={() => {
            setShowAlertModal(false);
            setAlertFormData(null);
          }}
          subgroupData={alertFormData?.subgroup || subgroupData}
          chart={alertFormData?.chart || chart}
          onSaveEvent={handleSaveAlertEvent}
          initialData={alertFormData}
        />
      )}
    </>
  );
};

const SimpleSPCAlertModal = ({
  isOpen,
  onClose,
  subgroupData,
  chart,
  onSaveEvent,
  onViewDetails,
  initialData,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSubgroupDetails, setShowSubgroupDetails] = useState(false);
  const [inspectors, setInspectors] = useState([]);
  const [loadingInspectors, setLoadingInspectors] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const emptyForm = {
    status: "DRAFT",
    createCapa: false,
    capaNumber: "",
    capaTitle: "",
    source: "SPC ALERT",
    severity: "MEDIUM",
    problem: "",
    immediateContainment: "",
    rootCause: "",
    correctiveAction: "",
    preventiveAction: "",
    assignedTo: "",
    targetDate: "",
    effectivenessCheck: "",
    verification: "PENDING",
    verifiedBy: "",
    approvedBy: "",
    closureDate: "",
    comments: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [attachments, setAttachments] = useState([]);

  const subgroupNumber =
    subgroupData?.originalIndex !== undefined
      ? subgroupData.originalIndex + 1
      : subgroupData?.subgroupNumber || subgroupData?.index || "—";

  const checkpointName =
    chart?.checkpointName ||
    subgroupData?.checkpointName ||
    subgroupData?.characteristicName ||
    "Checkpoint";
  const itemReference =
    chart?.itemCode ||
    subgroupData?.itemCode ||
    chart?.itemName ||
    subgroupData?.itemName ||
    "";

  const createDefaultTitle = () => {
    const itemText = itemReference ? ` – ${itemReference}` : "";
    return `Out-of-Control ${checkpointName}${itemText} – Subgroup ${subgroupNumber}`;
  };

  const signalInfo = useMemo(() => {
    const point = subgroupData || {};
    const rawValue =
      point.xbar ?? point.value ?? point.mean ?? point.average ?? point.y ?? 0;
    const value = Number(rawValue);
    const ucl = initialData?.signalInfo?.ucl ?? chart?.ucl ?? point.ucl ?? null;
    const lcl = initialData?.signalInfo?.lcl ?? chart?.lcl ?? point.lcl ?? null;
    const usl = initialData?.signalInfo?.usl ?? chart?.usl ?? point.usl ?? null;
    const lsl = initialData?.signalInfo?.lsl ?? chart?.lsl ?? point.lsl ?? null;

    const numericUcl = Number(ucl);
    const numericLcl = Number(lcl);

    const aboveUcl =
      Number.isFinite(value) &&
      Number.isFinite(numericUcl) &&
      value > numericUcl;
    const belowLcl =
      Number.isFinite(value) &&
      Number.isFinite(numericLcl) &&
      value < numericLcl;
    const explicitAlert =
      initialData?.signalInfo?.isAlert === true ||
      point.isAlert === true ||
      point.isOutOfControl === true ||
      point.outOfControl === true ||
      point.violations?.length > 0;
    const isAlert = explicitAlert || aboveUcl || belowLcl;

    return {
      isAlert,
      value: Number.isFinite(value) ? value : 0,
      severity: isAlert ? "CRITICAL" : "MEDIUM",
      ucl,
      lcl,
      usl,
      lsl,
      violation:
        point.ruleName ||
        point.violationType ||
        point.violations?.[0]?.rule ||
        (aboveUcl ? "Point above UCL" : belowLcl ? "Point below LCL" : ""),
    };
  }, [subgroupData, chart, initialData]);

  useEffect(() => {
    if (!isOpen || !subgroupData) return;

    const existingEvent =
      initialData?.existingEvent || subgroupData?.capaEvent || {};
    const existing =
      initialData?.capa ||
      subgroupData?.capa ||
      existingEvent?.capaSummary ||
      {};
    const existingHasCapa = Boolean(
      initialData?.capa ||
      initialData?.createCapa ||
      existing?.created ||
      existing?.capaNumber ||
      existingEvent?.capa?.created,
    );

    setForm({
      ...emptyForm,
      status:
        existing.status ||
        existingEvent.status ||
        (signalInfo.isAlert ? "OPEN" : "DRAFT"),
      createCapa: existingHasCapa,
      capaNumber:
        existing.capaNumber ||
        existingEvent?.capa?.number ||
        subgroupData?.capaNumber ||
        "",
      capaTitle:
        existing.capaTitle ||
        existing.title ||
        existingEvent?.capa?.title ||
        createDefaultTitle(),
      source: existing.source || existingEvent?.capa?.source || "SPC ALERT",
      severity:
        existing.severity || existingEvent.priority || signalInfo.severity,
      problem:
        existing.problem ||
        existing.problemStatement ||
        existingEvent?.investigation?.problemStatement ||
        "",
      immediateContainment:
        existing.immediateContainment ||
        existing.containmentAction ||
        existingEvent?.containment?.immediateAction ||
        "",
      rootCause:
        existing.rootCause ||
        existing.cause ||
        existingEvent?.investigation?.rootCause ||
        "",
      correctiveAction:
        existing.correctiveAction ||
        existing.action ||
        existingEvent?.correctiveAction?.action ||
        "",
      preventiveAction:
        existing.preventiveAction ||
        existingEvent?.correctiveAction?.preventiveAction ||
        "",
      assignedTo:
        existing.assignedTo ||
        existing.responsiblePerson ||
        existingEvent.assignedTo ||
        "",
      targetDate: firstNonBlankValue(
        existing.targetDate,
        existingEvent?.correctiveAction?.dueDate,
      )
        ? String(
            firstNonBlankValue(
              existing.targetDate,
              existingEvent?.correctiveAction?.dueDate,
            ),
          ).slice(0, 10)
        : "",
      effectivenessCheck:
        existing.effectivenessCheck ||
        existingEvent?.verification?.effectivenessNotes ||
        "",
      verification:
        existing.verification ||
        existing.verificationResult ||
        existingEvent?.verification?.result ||
        "PENDING",
      verifiedBy:
        existing.verifiedBy || existingEvent?.verification?.verifiedBy || "",
      approvedBy:
        existing.approvedBy || existingEvent?.approvals?.qualityManager || "",
      closureDate: firstNonBlankValue(
        existing.closureDate,
        existingEvent?.resolvedAt,
      )
        ? String(
            firstNonBlankValue(existing.closureDate, existingEvent?.resolvedAt),
          ).slice(0, 10)
        : "",
      comments: existing.comments || existingEvent.comments || "",
    });

    const savedAttachments =
      existing.attachments ||
      existing.evidenceAttachments ||
      existing.evidence ||
      [];
    setAttachments(
      Array.isArray(savedAttachments)
        ? savedAttachments.map((attachment, index) => {
            const isUrl = typeof attachment === "string";
            const url = isUrl
              ? attachment
              : attachment?.url ||
                attachment?.fileUrl ||
                attachment?.path ||
                "";
            const name = isUrl
              ? attachment.split("/").pop() || `Attachment ${index + 1}`
              : attachment?.originalName ||
                attachment?.fileName ||
                attachment?.name ||
                `Attachment ${index + 1}`;
            const type = isUrl
              ? attachment.toLowerCase().includes(".pdf")
                ? "application/pdf"
                : "image/*"
              : attachment?.mimeType || attachment?.type || "";

            return {
              id:
                (!isUrl && (attachment?._id || attachment?.id)) ||
                `existing-${index}-${name}`,
              name,
              type,
              size: isUrl ? 0 : Number(attachment?.size || 0),
              previewUrl: url,
              url,
              isExisting: true,
              raw: attachment,
            };
          })
        : [],
    );

    setActiveTab("overview");
    setError("");
    setShowSubgroupDetails(false);
    setIsClosing(false);
  }, [
    isOpen,
    subgroupData,
    initialData,
    signalInfo.isAlert,
    signalInfo.severity,
  ]);

  const status = form.status || "DRAFT";
  const isClosed = status === "CLOSED";

  useEffect(() => {
    if (isOpen) fetchInspectors();
  }, [isOpen]);

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

  if (!isOpen) return null;

  const updateForm = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAttachmentChange = async (event) => {
    setError("");
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selectedFiles.length) return;

    const availableSlots = MAX_ATTACHMENTS - attachments.length;
    if (availableSlots <= 0) {
      setError(`You can upload a maximum of ${MAX_ATTACHMENTS} attachments.`);
      return;
    }

    const filesToCheck = selectedFiles.slice(0, availableSlots);
    const rejected = [];
    const accepted = [];

    for (const file of filesToCheck) {
      const extensionAllowed = /\.(jpe?g|png|gif|webp|bmp|heic|pdf)$/i.test(
        file.name,
      );
      const typeAllowed =
        file.type?.startsWith("image/") ||
        file.type === "application/pdf" ||
        (!file.type && extensionAllowed);

      if (!typeAllowed) {
        rejected.push(`${file.name}: only image or PDF files are allowed`);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        rejected.push(`${file.name}: file size must not exceed 10 MB`);
        continue;
      }

      try {
        const previewUrl = await readFileAsDataUrl(file);
        accepted.push({
          id: `${Date.now()}-${file.name}-${file.lastModified}`,
          name: file.name,
          type:
            file.type ||
            (file.name.toLowerCase().endsWith(".pdf")
              ? "application/pdf"
              : "image/*"),
          size: file.size,
          lastModified: file.lastModified,
          previewUrl,
          file,
          isExisting: false,
        });
      } catch (readError) {
        rejected.push(readError.message);
      }
    }

    setAttachments((prev) => [...prev, ...accepted]);
    if (selectedFiles.length > availableSlots) {
      rejected.push(
        `Only ${availableSlots} more file${availableSlots === 1 ? "" : "s"} could be added.`,
      );
    }
    if (rejected.length) setError(rejected.join(" "));
  };

  const removeAttachment = (attachmentId) => {
    if (isClosed) return;
    setAttachments((prev) =>
      prev.filter((attachment) => attachment.id !== attachmentId),
    );
  };

  const validateForm = (candidateStatus = status) => {
    if (!form.createCapa) {
      if (["UNDER_INVESTIGATION", "ACTION_TAKEN"].includes(candidateStatus)) {
        if (!String(form.problem || "").trim()) {
          return "Please enter the problem statement.";
        }
      }
      return "";
    }

    const required = [
      ["capaTitle", "CAPA title"],
      ["problem", "problem statement"],
      ["assignedTo", "responsible person"],
      ["targetDate", "target completion date"],
    ];

    if (
      ["ACTION_TAKEN", "VERIFICATION_PENDING", "CLOSED"].includes(
        candidateStatus,
      )
    ) {
      required.push(["immediateContainment", "immediate containment action"]);
      required.push(["rootCause", "root cause"]);
      required.push(["correctiveAction", "corrective action"]);
    }

    if (candidateStatus === "CLOSED") {
      required.push(["effectivenessCheck", "effectiveness check"]);
      required.push(["verifiedBy", "verified by"]);
      required.push(["approvedBy", "approved by"]);
      required.push(["closureDate", "closure date"]);

      if (form.verification !== "EFFECTIVE") {
        return "Verification result must be EFFECTIVE before closing the CAPA.";
      }
    }

    for (const [field, label] of required) {
      if (!String(form[field] || "").trim()) {
        return `Please enter the ${label}.`;
      }
    }

    return "";
  };

  const handleSave = async () => {
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      if (!onSaveEvent) {
        throw new Error("SPC event save handler is not connected.");
      }

      await onSaveEvent({
        ...form,
        createCapa: form.createCapa === true,
        workflowAction: "SAVE",
        signal: signalInfo,
        chartPoint: subgroupData,
        subgroupNumber,
        checkpointName,
        itemReference,
        attachments: attachments.map((attachment) =>
          attachment.isExisting
            ? attachment.raw || {
                id: attachment.id,
                name: attachment.name,
                type: attachment.type,
                size: attachment.size,
                url: attachment.url,
              }
            : {
                name: attachment.name,
                type: attachment.type,
                size: attachment.size,
                lastModified: attachment.lastModified,
              },
        ),
        attachmentFiles: attachments
          .filter((attachment) => attachment.file)
          .map((attachment) => attachment.file),
      });
      handleClose();
    } catch (err) {
      setError(err?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(subgroupData);
      return;
    }
    setShowSubgroupDetails(true);
  };

  const canAcknowledge = ["DRAFT", "OPEN"].includes(status);
  const canInvestigate = ["OPEN", "ACKNOWLEDGED"].includes(status);
  const canMarkActionTaken = status === "UNDER_INVESTIGATION";
  const canRequestVerification = status === "ACTION_TAKEN";
  const canClose =
    status === "VERIFICATION_PENDING" && form.verification === "EFFECTIVE";

  const handleStatusChange = (newStatus) => {
    setError("");
    const validationError = validateForm(newStatus);
    if (validationError) {
      setError(validationError);
      return;
    }
    setForm((prev) => ({ ...prev, status: newStatus }));
  };

  // Tab Content Renderers
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Value"
          value={formatNumber(signalInfo.value)}
          unit={chart?.unit || ""}
          icon={Activity}
          color="blue"
        />
        <MetricCard
          label="SPC Status"
          value={signalInfo.isAlert ? "Active Alert" : "Process Normal"}
          icon={signalInfo.isAlert ? AlertTriangle : CheckCircle}
          color={signalInfo.isAlert ? "rose" : "emerald"}
          alert={signalInfo.isAlert}
        />
        <MetricCard
          label={form.createCapa ? "CAPA Severity" : "Event Severity"}
          value={form.severity}
          icon={ShieldAlert}
          color={form.severity === "CRITICAL" ? "rose" : "slate"}
          alert={form.severity === "CRITICAL"}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          icon={FileText}
          title={form.createCapa ? "CAPA Record" : "SPC Event Record"}
          subtitle={
            form.createCapa
              ? "CAPA number is generated only when CAPA is enabled and saved"
              : "Save the subgroup investigation without creating a CAPA"
          }
        />
        <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={form.createCapa}
            onChange={(event) => updateForm("createCapa", event.target.checked)}
            disabled={isClosed || Boolean(initialData?.capa)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-800">
              Create CAPA for this subgroup
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Leave unchecked for an SPC observation or investigation only.
            </span>
          </span>
        </label>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <EnhancedInput
            label="CAPA Number"
            value={form.capaNumber || `CAPA-${new Date().getFullYear()}-XXX`}
            disabled
            placeholder="Auto-generated on save"
            className="bg-slate-50"
          />
          <EnhancedInput
            label="CAPA Title"
            required={form.createCapa}
            value={form.capaTitle}
            onChange={(e) => updateForm("capaTitle", e.target.value)}
            placeholder="Describe the issue briefly"
            disabled={isClosed || !form.createCapa}
          />
          <EnhancedSelect
            label="Source"
            value={form.source}
            onChange={(e) => updateForm("source", e.target.value)}
            options={[
              "SPC ALERT",
              "INSPECTION REJECTION",
              "CUSTOMER COMPLAINT",
              "AUDIT",
              "OTHER",
            ]}
            disabled={isClosed || !form.createCapa}
          />
          <EnhancedSelect
            label="Severity"
            value={form.severity}
            onChange={(e) => updateForm("severity", e.target.value)}
            options={["LOW", "MEDIUM", "HIGH", "CRITICAL"]}
            disabled={isClosed}
          />
          <FormField label="Responsible Person" required={form.createCapa}>
            <select
              value={form.assignedTo}
              onChange={(e) => updateForm("assignedTo", e.target.value)}
              disabled={isClosed || loadingInspectors}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10"
            >
              <option value="">Select Responsible Person...</option>
              {inspectors.map((inspector) => (
                <option
                  key={inspector._id}
                  value={`${inspector.firstName} ${inspector.lastName || ""}`.trim()}
                >
                  {`${inspector.firstName} ${inspector.lastName || ""}`.trim()}{" "}
                  - {inspector.role} ({inspector.employeeId})
                </option>
              ))}
            </select>
            {loadingInspectors && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading
                employees...
              </div>
            )}
          </FormField>
          <EnhancedInput
            label="Target Completion Date"
            required={form.createCapa}
            type="date"
            value={form.targetDate}
            onChange={(e) => updateForm("targetDate", e.target.value)}
            disabled={isClosed || !form.createCapa}
          />
        </div>
      </div>

      <div
        className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300"
        onClick={handleViewDetails}
      >
        <div className="flex items-center justify-between">
          <SectionHeader
            icon={Database}
            title="Subgroup Information"
            subtitle={`Subgroup #${subgroupNumber} • ${checkpointName}`}
          />
          <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 group-hover:underline">
            <Maximize2 className="h-3.5 w-3.5" /> View Full Details
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="block text-xs text-slate-400">Subgroup</span>
            <span className="font-semibold text-slate-800">
              #{subgroupNumber}
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="block text-xs text-slate-400">Collected</span>
            <span className="font-semibold text-slate-800">
              {subgroupData?.collectedAt
                ? new Date(subgroupData.collectedAt).toLocaleString()
                : "—"}
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="block text-xs text-slate-400">Chart Type</span>
            <span className="font-semibold uppercase text-slate-800">
              {chart?.type || "—"}
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="block text-xs text-slate-400">Subgroup Size</span>
            <span className="font-semibold text-slate-800">
              {chart?.subgroupSize || "—"}
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="block text-xs text-slate-400">Checkpoint</span>
            <span className="font-semibold text-slate-800">
              {checkpointName}
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="block text-xs text-slate-400">Item</span>
            <span className="font-semibold text-slate-800">
              {itemReference || "—"}
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
            <span className="block text-xs text-slate-400">Violation</span>
            <span className="font-semibold text-rose-700">
              {signalInfo.violation || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader icon={Gauge} title="Control & Specification Limits" />
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[
            [
              "UCL",
              signalInfo.ucl,
              "text-rose-600",
              "border-rose-100",
              "bg-rose-50",
            ],
            [
              "LCL",
              signalInfo.lcl,
              "text-blue-600",
              "border-blue-100",
              "bg-blue-50",
            ],
            [
              "USL",
              signalInfo.usl,
              "text-emerald-600",
              "border-emerald-100",
              "bg-emerald-50",
            ],
            [
              "LSL",
              signalInfo.lsl,
              "text-amber-600",
              "border-amber-100",
              "bg-amber-50",
            ],
          ].map(([label, value, textColor, borderColor, bgColor]) => (
            <div
              key={label}
              className={`rounded-xl border ${borderColor} ${bgColor} p-3 text-center transition-all hover:scale-[1.02]`}
            >
              <span className="block text-xs font-medium text-slate-500">
                {label}
              </span>
              <span className={`font-bold ${textColor}`}>
                {formatNumber(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`rounded-2xl border p-4 shadow-sm ${signalInfo.isAlert ? "border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100/50 text-rose-800" : "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-800"}`}
      >
        <div className="flex items-center gap-3">
          {signalInfo.isAlert ? (
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />
          )}
          <p className="text-sm font-medium">
            {signalInfo.isAlert
              ? "⚠ This point is out of control. Start containment and investigation immediately."
              : "✓ This point is within control limits. Save as observation when needed."}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleViewDetails}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-r from-blue-50/50 to-blue-100/50 px-4 py-3.5 text-sm font-medium text-blue-700 shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
      >
        <Maximize2 className="h-5 w-5" /> View Complete Subgroup Details{" "}
        <span className="ml-auto text-xs font-normal text-blue-500">
          Readings, Metrics & More
        </span>
      </button>
    </div>
  );

  const renderAttachments = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <SectionHeader
        icon={FileText}
        title="Evidence Attachments"
        subtitle="Upload inspection images, containment proof, analysis sheets, or PDF reports"
        action={
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {attachments.length}/{MAX_ATTACHMENTS}
          </span>
        }
      />
      <div className="mt-5">
        <input
          id="capa-evidence-upload"
          type="file"
          accept="image/*,application/pdf,.pdf"
          multiple
          onChange={handleAttachmentChange}
          disabled={isClosed || attachments.length >= MAX_ATTACHMENTS}
          className="sr-only"
        />
        <label
          htmlFor="capa-evidence-upload"
          className={`flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-6 text-center transition-all ${isClosed || attachments.length >= MAX_ATTACHMENTS ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60" : "cursor-pointer border-blue-300 bg-blue-50/40 hover:border-blue-500 hover:bg-blue-50"}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-9 w-9 text-blue-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13.5v4A2.5 2.5 0 007.5 20h9a2.5 2.5 0 002.5-2.5v-4"
            />
          </svg>
          <span className="mt-3 text-sm font-semibold text-slate-800">
            Click to upload images or PDF files
          </span>
          <span className="mt-1 text-xs text-slate-500">
            Maximum {MAX_ATTACHMENTS} files · 10 MB per file
          </span>
        </label>
      </div>
      {attachments.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {attachments.map((attachment) => {
            const isImage = attachment.type?.startsWith("image/");
            const previewUrl = attachment.previewUrl || attachment.url;
            return (
              <div
                key={attachment.id}
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {isImage && previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={attachment.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <span className="block text-xs font-black text-rose-600">
                        PDF
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Document
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-semibold text-slate-800"
                    title={attachment.name}
                  >
                    {attachment.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatFileSize(attachment.size)}
                    {attachment.isExisting ? " · Saved" : " · New"}
                  </p>
                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View file
                    </a>
                  )}
                </div>
                {!isClosed && (
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderInvestigation = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          icon={Search}
          title="Problem Investigation"
          subtitle="Document the investigation findings"
        />
        <div className="mt-5 space-y-5">
          <EnhancedTextArea
            label="Problem Statement"
            required
            value={form.problem}
            onChange={(e) => updateForm("problem", e.target.value)}
            placeholder="What happened, where, and which subgroup was affected?"
            disabled={isClosed}
            rows={3}
          />
          <EnhancedTextArea
            label="Immediate Containment Action"
            value={form.immediateContainment}
            onChange={(e) => updateForm("immediateContainment", e.target.value)}
            placeholder="Example: Hold the lot, stop the machine, segregate affected parts"
            disabled={isClosed}
            rows={2}
          />
          <EnhancedTextArea
            label="Root Cause"
            value={form.rootCause}
            onChange={(e) => updateForm("rootCause", e.target.value)}
            placeholder="Why did the issue occur? Use 5-Why or Fishbone analysis"
            disabled={isClosed}
            rows={3}
          />
        </div>
      </div>
      {renderAttachments()}
    </div>
  );

  const renderAction = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          icon={Wrench}
          title="Corrective and Preventive Action"
          subtitle="Define actions to eliminate the root cause"
        />
        <div className="mt-5 space-y-5">
          <EnhancedTextArea
            label="Corrective Action"
            value={form.correctiveAction}
            onChange={(e) => updateForm("correctiveAction", e.target.value)}
            placeholder="What was done to remove the root cause?"
            disabled={isClosed}
            rows={3}
          />
          <EnhancedTextArea
            label="Preventive Action"
            value={form.preventiveAction}
            onChange={(e) => updateForm("preventiveAction", e.target.value)}
            placeholder="What change will prevent recurrence?"
            disabled={isClosed}
            rows={3}
          />
          <EnhancedTextArea
            label="Effectiveness Check"
            value={form.effectivenessCheck}
            onChange={(e) => updateForm("effectivenessCheck", e.target.value)}
            placeholder="Example: Monitor the next 20 subgroups with no SPC rule violation"
            disabled={isClosed}
            rows={2}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <EnhancedSelect
              label="Verification Result"
              value={form.verification}
              onChange={(e) => updateForm("verification", e.target.value)}
              options={[
                "PENDING",
                "EFFECTIVE",
                "NOT_EFFECTIVE",
                "INCONCLUSIVE",
              ]}
              disabled={isClosed}
            />
            <EnhancedInput
              label="Verified By"
              value={form.verifiedBy}
              onChange={(e) => updateForm("verifiedBy", e.target.value)}
              disabled={isClosed}
              placeholder="Name of verifier"
            />
            <EnhancedInput
              label="Approved By"
              value={form.approvedBy}
              onChange={(e) => updateForm("approvedBy", e.target.value)}
              disabled={isClosed}
              placeholder="Name of approver"
            />
            <EnhancedInput
              label="Closure Date"
              type="date"
              value={form.closureDate}
              onChange={(e) => updateForm("closureDate", e.target.value)}
              disabled={isClosed}
            />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleViewDetails}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-100 hover:shadow-md"
      >
        <Maximize2 className="h-4 w-4" /> View Subgroup Data
      </button>
    </div>
  );

  const renderComments = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          icon={Clipboard}
          title="Comments & Notes"
          subtitle="Additional information and observations"
        />
        <div className="mt-5">
          <EnhancedTextArea
            label="Additional Comments"
            value={form.comments}
            onChange={(e) => updateForm("comments", e.target.value)}
            placeholder="Add evidence references, observations, or closure comments"
            disabled={isClosed}
            rows={6}
          />
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "investigation", label: "Investigate", icon: Search },
    {
      id: "action",
      label: form.createCapa ? "CAPA Action" : "Action",
      icon: Wrench,
    },
    { id: "comments", label: "Notes", icon: Clipboard },
  ];

  const tabContent = {
    overview: renderOverview,
    investigation: renderInvestigation,
    action: renderAction,
    comments: renderComments,
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}
        onClick={handleClose}
      >
        <div
          className={`flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl transition-all duration-300 ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="relative flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-base font-bold text-slate-900">
                  {form.createCapa
                    ? "CAPA Management"
                    : "SPC Event Investigation"}
                </h2>
                <StatusBadge status={status} />
                {signalInfo.isAlert && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                    <AlertTriangle className="h-3.5 w-3.5" /> SPC Alert
                  </span>
                )}
                {subgroupData?.originalIndex !== undefined && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                    <Hash className="h-3.5 w-3.5" /> #{subgroupNumber}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">
                {form.createCapa
                  ? `${form.capaNumber || "New CAPA"} · ${form.capaTitle || "Untitled CAPA"}`
                  : `SPC event · Subgroup ${subgroupNumber}`}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                type="button"
                onClick={handleViewDetails}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:shadow-md"
              >
                <Maximize2 className="mr-1.5 inline h-3.5 w-3.5" /> Details
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Tabs */}
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  id={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6">
            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100/50 p-4 text-sm text-rose-700 shadow-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <p className="font-medium">Validation Error</p>
                  <p className="text-rose-600">{error}</p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="ml-auto shrink-0 text-rose-400 hover:text-rose-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {tabContent[activeTab]?.()}
          </div>

          {/* Footer */}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-gradient-to-r from-white to-slate-50/80 px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {!isClosed && (
                <>
                  {canAcknowledge && (
                    <ActionButton
                      variant="primary"
                      icon={CheckCircle}
                      onClick={() => handleStatusChange("ACKNOWLEDGED")}
                    >
                      Acknowledge
                    </ActionButton>
                  )}
                  {canInvestigate && (
                    <ActionButton
                      variant="warning"
                      icon={Search}
                      onClick={() => handleStatusChange("UNDER_INVESTIGATION")}
                    >
                      Investigate
                    </ActionButton>
                  )}
                  {canMarkActionTaken && (
                    <ActionButton
                      variant="primary"
                      icon={Wrench}
                      onClick={() => handleStatusChange("ACTION_TAKEN")}
                    >
                      Mark Action Taken
                    </ActionButton>
                  )}
                  {canRequestVerification && (
                    <ActionButton
                      variant="warning"
                      icon={Clock}
                      onClick={() => handleStatusChange("VERIFICATION_PENDING")}
                    >
                      Request Verification
                    </ActionButton>
                  )}
                  {canClose && (
                    <ActionButton
                      variant="success"
                      icon={CheckCircle2}
                      onClick={() => handleStatusChange("CLOSED")}
                    >
                      {form.createCapa ? "Close CAPA" : "Close Event"}
                    </ActionButton>
                  )}
                </>
              )}
              {isClosed && (
                <ActionButton
                  variant="danger"
                  icon={RotateCw}
                  onClick={() => handleStatusChange("OPEN")}
                >
                  Reopen
                </ActionButton>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100"
              >
                Cancel
              </button>
              <ActionButton
                variant="primary"
                icon={Save}
                onClick={handleSave}
                loading={saving}
              >
                {saving
                  ? "Saving..."
                  : form.createCapa
                    ? "Save CAPA"
                    : "Save Event"}
              </ActionButton>
            </div>
          </footer>
        </div>
      </div>

      {showSubgroupDetails && (
        <SubgroupDetailsModal
          isOpen={showSubgroupDetails}
          onClose={() => setShowSubgroupDetails(false)}
          subgroupData={subgroupData}
          chart={chart}
        />
      )}
    </>
  );
};

const buildConstantReportSeries = (length, value) =>
  Array.from({ length }, () => toFiniteNumberOrNull(value));

const getReportSeriesValue = (chart, seriesField, scalarField, sourceIndex) => {
  const series = chart?.[seriesField];
  if (Array.isArray(series)) {
    const hasHistoricalLimits = series.some(
      (value) => toFiniteNumberOrNull(value) !== null,
    );
    if (hasHistoricalLimits) return toFiniteNumberOrNull(series[sourceIndex]);
  }
  return toFiniteNumberOrNull(chart?.[scalarField]);
};

const getReportAxisLabel = (metadata, fallback) => {
  const rawDate = metadata?.date || metadata?.collectedAt;
  if (!rawDate) return fallback;
  const parsed = new Date(rawDate);
  if (!Number.isFinite(parsed.getTime())) return fallback;
  const dateLabel = parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  
  const sequence =
    metadata?.subgroupSequenceInDay ??
    metadata?.inspectionSequenceInDay ??
    metadata?.subgroupSequence ??
    null;
  return sequence ? `${dateLabel} · ${sequence}` : dateLabel;
};

const buildReportControlLine = ({ label, data, borderColor, borderDash }) => ({
  label,
  data,
  borderColor,
  pointRadius: 0,
  pointHoverRadius: 0,
  borderDash,
  borderWidth: 1.5,
  tension: 0,
  stepped: "before",
  spanGaps: false,
  fill: false,
  spcRole: "control-line",
});

const getVisiblePointCount = (chartInstance, fallbackCount) => {
  const xScale = chartInstance?.scales?.x;
  if (!xScale) return fallbackCount;
  const minimum = Number(xScale.min);
  const maximum = Number(xScale.max);
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum))
    return fallbackCount;
  return Math.max(1, Math.round(maximum - minimum + 1));
};

const buildPointRadius =
  ({ filteredPoints, oocIndexes, indexField, capaBySubgroup = {} }) =>
  (context) => {
    const point = filteredPoints[context.dataIndex];
    const sourceIndex = point?.[indexField];
    const isOutOfControl = oocIndexes.has(sourceIndex);
    const hasCapa = Boolean(capaBySubgroup[getSPCPointSubgroupId(point)]);
    const visibleCount = getVisiblePointCount(
      context.chart,
      filteredPoints.length,
    );
    if (isOutOfControl || hasCapa) {
      if (visibleCount > 180) return hasCapa ? 3 : 2.25;
      if (visibleCount > 90) return hasCapa ? 4 : 3;
      return hasCapa ? 5.5 : 4.75;
    }
    if (visibleCount > 180) return 0;
    if (visibleCount > 100) return 1;
    if (visibleCount > 55) return 1.8;
    return 3;
  };

const buildPointColor =
  ({
    filteredPoints,
    oocIndexes,
    indexField,
    normalColor,
    outOfControlColor,
    capaBySubgroup = {},
    capaColor = null,
  }) =>
  (context) => {
    const point = filteredPoints[context.dataIndex];
    const hasCapa = Boolean(capaBySubgroup[getSPCPointSubgroupId(point)]);
    if (hasCapa && capaColor) return capaColor;
    return oocIndexes.has(point?.[indexField])
      ? outOfControlColor
      : normalColor;
  };

// Add this NEW function for glow effect
const buildPointGlowColor = (capaColor = null) => {
  return (context) => {
    const chart = context.chart;
    const dataIndex = context.dataIndex;
    const dataset = chart.data.datasets[context.datasetIndex];
    if (!dataset) return "transparent";

    // Check if this point has CAPA by checking if it has a purple color
    const hasCapa = dataset.pointBackgroundColor(dataIndex) === capaColor;
    if (hasCapa && capaColor) {
      return capaColor + "40"; // Add 25% opacity for glow
    }
    return "transparent";
  };
};

const buildTooltipMetadataLines = (point, unit = "") => {
  if (!point) return [];
  const metadata = point.metadata || {};
  const lines = [];
  const subgroupId = getReadableText(
    metadata.subgroupLabel,
    metadata.subgroupName,
    metadata.label,
    metadata.subgroupId,
    point.sourceLabel,
  );
  const inspectionReference = getReadableText(
    metadata.reportNumber,
    metadata.inspectionRunId,
    metadata.inspectionNumber,
    metadata.batchNumber,
    metadata.inspectionId,
  );
  const readings = flattenNumericReadings(metadata);

  if (subgroupId && subgroupId !== point.sourceLabel)
    lines.push(`Subgroup: ${subgroupId}`);
  if (inspectionReference) lines.push(`Inspection: ${inspectionReference}`);
  if (readings.length > 0) {
    const formatted = readings
      .slice(0, 12)
      .map((value) => formatCustomerReportValue(value, 3))
      .join(", ");
    const remaining = Math.max(0, readings.length - 12);
    lines.push(
      `Readings: ${formatted}${remaining > 0 ? ` (+${remaining} more)` : ""}${unit ? ` ${unit}` : ""}`,
    );
  }
  if (point.baselineVersion) lines.push(`Baseline: v${point.baselineVersion}`);
  return lines;
};

const flattenNumericReadings = (metadata = {}) => {
  const candidates = [
    metadata.rawValues,
    metadata.values,
    metadata.readings,
    metadata.rawReadings,
    metadata.pieceValues,
  ];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const values = candidate
      .flatMap((entry) => {
        if (typeof entry === "number") return [entry];
        if (entry === null || entry === undefined) return [];
        if (Array.isArray(entry?.readings)) {
          return entry.readings.map((reading) =>
            toFiniteNumberOrNull(reading?.value ?? reading?.measured),
          );
        }
        return [toFiniteNumberOrNull(entry?.value ?? entry?.measured ?? entry)];
      })
      .filter((value) => value !== null);
    if (values.length > 0) return values;
  }
  return [];
};

// ============= HISTOGRAM HELPERS =============

const getHistogramTimestamp = (metadata = {}) => {
  const rawDate = unwrapSubgroupReadingDate(
    metadata.collectedAt ||
      metadata.date ||
      metadata.inspectionDate ||
      metadata.timestamp,
  );
  if (!rawDate) return null;
  const timestamp = new Date(rawDate).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const isHistogramSubgroupSelected = ({
  metadata,
  index,
  selectedSubgroup,
  startDate,
  endDate,
}) => {
  if (
    selectedSubgroup !== "all" &&
    String(index) !== String(selectedSubgroup)
  ) {
    return false;
  }

  if (!startDate && !endDate) return true;
  const timestamp = getHistogramTimestamp(metadata);
  if (timestamp === null) return false;
  if (startDate && timestamp < startDate.getTime()) return false;
  if (endDate && timestamp > endDate.getTime()) return false;
  return true;
};

const getFilteredHistogramReadings = ({
  chart,
  selectedSubgroup = "all",
  startDate = null,
  endDate = null,
}) => {
  const metadata = Array.isArray(chart?.subgroupMetadata)
    ? chart.subgroupMetadata
    : [];

  const readingsFromMetadata = metadata.flatMap((entry, index) => {
    if (
      !isHistogramSubgroupSelected({
        metadata: entry,
        index,
        selectedSubgroup,
        startDate,
        endDate,
      })
    ) {
      return [];
    }
    return flattenNumericReadings(entry);
  });

  if (readingsFromMetadata.length > 0) return readingsFromMetadata;

  const type = String(chart?.type || "")
    .trim()
    .toLowerCase();
  if (["imr", "i-mr", "x-mr"].includes(type)) {
    const individuals = Array.isArray(chart?.individualValues)
      ? chart.individualValues
      : [];
    return individuals
      .map((value, index) => ({
        value: toFiniteNumberOrNull(value),
        metadata: metadata[index] || {},
        index,
      }))
      .filter(({ value }) => value !== null)
      .filter(({ metadata: entry, index }) =>
        isHistogramSubgroupSelected({
          metadata: entry,
          index,
          selectedSubgroup,
          startDate,
          endDate,
        }),
      )
      .map(({ value }) => value);
  }

  // Top-level raw arrays are used only when no subgroup/date filter needs to
  // be applied. X-bar values are deliberately excluded because a histogram
  // must use individual measurements, not subgroup averages.
  if (selectedSubgroup === "all" && !startDate && !endDate) {
    const topLevelReadings = flattenNumericReadings({
      rawValues:
        chart?.histogramValues ||
        chart?.rawValues ||
        chart?.rawReadings ||
        chart?.pieceValues ||
        chart?.measurementValues ||
        chart?.readings,
    });
    if (topLevelReadings.length > 0) return topLevelReadings;
  }

  return [];
};

const getSampleStandardDeviation = (values, mean) => {
  if (values.length < 2 || mean === null) return null;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
};

const buildHistogramSummary = ({ values, lsl, usl, nominal }) => {
  const sortedValues = values
    .map(toFiniteNumberOrNull)
    .filter((value) => value !== null)
    .sort((a, b) => a - b);

  if (sortedValues.length === 0) return null;

  const count = sortedValues.length;
  const mean = sortedValues.reduce((sum, value) => sum + value, 0) / count;
  const standardDeviation = getSampleStandardDeviation(sortedValues, mean);
  const dataMin = sortedValues[0];
  const dataMax = sortedValues[count - 1];
  const numericLsl = toFiniteNumberOrNull(lsl);
  const numericUsl = toFiniteNumberOrNull(usl);
  const numericNominal = toFiniteNumberOrNull(nominal);
  const hasSpecification = numericLsl !== null || numericUsl !== null;
  const hasTwoSidedSpecification =
    numericLsl !== null && numericUsl !== null && numericUsl > numericLsl;

  const referenceValues = [numericLsl, numericUsl, numericNominal].filter(
    (value) => value !== null,
  );
  let displayMin = Math.min(dataMin, ...referenceValues);
  let displayMax = Math.max(dataMax, ...referenceValues);
  const rawSpan = displayMax - displayMin;
  const fallbackSpan = Math.max(Math.abs(mean) * 0.02, 1);
  const padding = (rawSpan > 0 ? rawSpan : fallbackSpan) * 0.04;
  displayMin -= padding;
  displayMax += padding;

  const binCount = clamp(Math.ceil(Math.log2(count) + 1), 5, 24);
  const binWidth = (displayMax - displayMin) / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => ({
    lower: displayMin + index * binWidth,
    upper: displayMin + (index + 1) * binWidth,
    center: displayMin + (index + 0.5) * binWidth,
    count: 0,
  }));

  sortedValues.forEach((value) => {
    const rawIndex = Math.floor((value - displayMin) / binWidth);
    const binIndex = clamp(rawIndex, 0, binCount - 1);
    bins[binIndex].count += 1;
  });

  const outOfSpecCount = sortedValues.filter(
    (value) =>
      (numericLsl !== null && value < numericLsl) ||
      (numericUsl !== null && value > numericUsl),
  ).length;
  const inSpecCount = count - outOfSpecCount;
  const cp =
    hasTwoSidedSpecification &&
    standardDeviation !== null &&
    standardDeviation > 0
      ? (numericUsl - numericLsl) / (6 * standardDeviation)
      : null;
  const cpk =
    hasTwoSidedSpecification &&
    standardDeviation !== null &&
    standardDeviation > 0
      ? Math.min(
          (numericUsl - mean) / (3 * standardDeviation),
          (mean - numericLsl) / (3 * standardDeviation),
        )
      : null;

  return {
    bins,
    count,
    mean,
    standardDeviation,
    dataMin,
    dataMax,
    displayMin,
    displayMax,
    lsl: numericLsl,
    usl: numericUsl,
    nominal: numericNominal,
    inSpecCount,
    outOfSpecCount,
    hasSpecification,
    inSpecPercent:
      hasSpecification && count > 0 ? (inSpecCount / count) * 100 : null,
    cp,
    cpk,
  };
};

const histogramReferenceLinesPlugin = {
  id: "histogramReferenceLines",
  afterDatasetsDraw(chartInstance, _args, options) {
    const { ctx, chartArea } = chartInstance;
    const minimum = toFiniteNumberOrNull(options?.minimum);
    const maximum = toFiniteNumberOrNull(options?.maximum);
    const lines = Array.isArray(options?.lines) ? options.lines : [];
    if (
      !chartArea ||
      minimum === null ||
      maximum === null ||
      maximum <= minimum ||
      lines.length === 0
    ) {
      return;
    }

    lines.forEach((line) => {
      const value = toFiniteNumberOrNull(line.value);
      if (value === null || value < minimum || value > maximum) return;
      const ratio = (value - minimum) / (maximum - minimum);
      const x = chartArea.left + ratio * (chartArea.right - chartArea.left);

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash(line.dash || [5, 4]);
      ctx.lineWidth = line.width || 1.5;
      ctx.strokeStyle = line.color || "#0f172a";
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = line.color || "#0f172a";
      ctx.font = "600 10px sans-serif";
      ctx.textAlign = x > chartArea.right - 55 ? "right" : "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `${line.label}: ${formatCustomerReportValue(value, 4)}`,
        x + (ctx.textAlign === "right" ? -4 : 4),
        chartArea.top + (line.offsetY || 4),
      );
      ctx.restore();
    });
  },
};

// ============= VIEWPORT CONTROLS =============

const normalizeViewport = ({ min, max, pointCount }) => {
  if (pointCount <= 0) return { min: 0, max: 0 };
  const lastIndex = pointCount - 1;
  let nextMin = clamp(Math.floor(Number(min) || 0), 0, lastIndex);
  let nextMax = clamp(Math.ceil(Number(max) || lastIndex), 0, lastIndex);
  if (nextMax < nextMin) [nextMin, nextMax] = [nextMax, nextMin];
  const minimumSpan = Math.min(MIN_VISIBLE_POINTS, pointCount);
  if (nextMax - nextMin + 1 < minimumSpan) {
    nextMax = Math.min(lastIndex, nextMin + minimumSpan - 1);
    nextMin = Math.max(0, nextMax - minimumSpan + 1);
  }
  return { min: nextMin, max: nextMax };
};

const getInitialViewport = (pointCount, requestedVisiblePoints) => {
  if (pointCount <= 0) return { min: 0, max: 0 };
  const visiblePoints = clamp(
    Number(requestedVisiblePoints) || DEFAULT_VISIBLE_POINTS,
    MIN_VISIBLE_POINTS,
    pointCount,
  );
  return { min: Math.max(0, pointCount - visiblePoints), max: pointCount - 1 };
};

const useSynchronizedViewport = ({
  pointCount,
  initialVisiblePoints,
  chartRefs,
}) => {
  const initialViewport = useMemo(
    () => getInitialViewport(pointCount, initialVisiblePoints),
    [pointCount, initialVisiblePoints],
  );
  const [viewport, setViewport] = useState(initialViewport);
  const syncingRef = useRef(false);

  const applyViewportToCharts = useCallback(
    (nextViewport, sourceChart = null) => {
      const normalized = normalizeViewport({ ...nextViewport, pointCount });
      setViewport(normalized);
      syncingRef.current = true;
      chartRefs.forEach((chartRef) => {
        const chartInstance = chartRef.current;
        if (!chartInstance || chartInstance === sourceChart) return;
        chartInstance.options.scales.x.min = normalized.min;
        chartInstance.options.scales.x.max = normalized.max;
        chartInstance.update("none");
      });
      syncingRef.current = false;
      return normalized;
    },
    [chartRefs, pointCount],
  );

  useEffect(() => {
    setViewport(initialViewport);
    const animationFrame = window.requestAnimationFrame(() => {
      chartRefs.forEach((chartRef) => {
        const chartInstance = chartRef.current;
        if (!chartInstance) return;
        chartInstance.options.scales.x.min = initialViewport.min;
        chartInstance.options.scales.x.max = initialViewport.max;
        chartInstance.update("none");
      });
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [chartRefs, initialViewport]);

  const synchronizeFromChart = useCallback(
    (chartInstance) => {
      if (syncingRef.current || !chartInstance?.scales?.x) return;
      applyViewportToCharts(
        { min: chartInstance.scales.x.min, max: chartInstance.scales.x.max },
        chartInstance,
      );
    },
    [applyViewportToCharts],
  );

  const showLast = useCallback(
    (count) => {
      if (pointCount <= 0) return;
      const visibleCount = clamp(
        Number(count) || DEFAULT_VISIBLE_POINTS,
        MIN_VISIBLE_POINTS,
        pointCount,
      );
      applyViewportToCharts({
        min: Math.max(0, pointCount - visibleCount),
        max: pointCount - 1,
      });
    },
    [applyViewportToCharts, pointCount],
  );

  const showAll = useCallback(() => {
    if (pointCount <= 0) return;
    applyViewportToCharts({ min: 0, max: pointCount - 1 });
  }, [applyViewportToCharts, pointCount]);

  const reset = useCallback(() => {
    chartRefs.forEach((chartRef) => chartRef.current?.resetZoom?.("none"));
    applyViewportToCharts(initialViewport);
  }, [applyViewportToCharts, chartRefs, initialViewport]);

  const zoomBy = useCallback(
    (factor) => {
      if (pointCount <= 0) return;
      const currentSpan = viewport.max - viewport.min + 1;
      const nextSpan = clamp(
        Math.round(currentSpan * factor),
        Math.min(MIN_VISIBLE_POINTS, pointCount),
        pointCount,
      );
      const center = (viewport.min + viewport.max) / 2;
      let min = Math.round(center - (nextSpan - 1) / 2);
      let max = min + nextSpan - 1;
      if (min < 0) {
        min = 0;
        max = nextSpan - 1;
      }
      if (max > pointCount - 1) {
        max = pointCount - 1;
        min = Math.max(0, max - nextSpan + 1);
      }
      applyViewportToCharts({ min, max });
    },
    [applyViewportToCharts, pointCount, viewport],
  );

  const panBy = useCallback(
    (direction) => {
      if (pointCount <= 0) return;
      const span = viewport.max - viewport.min + 1;
      const step = Math.max(1, Math.round(span * 0.35)) * direction;
      let min = viewport.min + step;
      let max = viewport.max + step;
      if (min < 0) {
        min = 0;
        max = span - 1;
      }
      if (max > pointCount - 1) {
        max = pointCount - 1;
        min = Math.max(0, max - span + 1);
      }
      applyViewportToCharts({ min, max });
    },
    [applyViewportToCharts, pointCount, viewport],
  );

  return {
    viewport,
    synchronizeFromChart,
    showLast,
    showAll,
    reset,
    zoomIn: () => zoomBy(0.65),
    zoomOut: () => zoomBy(1.55),
    panLeft: () => panBy(-1),
    panRight: () => panBy(1),
    jumpToLatest: () => showLast(initialVisiblePoints),
  };
};

// ============= CHART VIEWPORT TOOLBAR =============

const ChartViewportToolbar = ({
  pointCount,
  viewport,
  showLast,
  showAll,
  reset,
  zoomIn,
  zoomOut,
  panLeft,
  panRight,
  jumpToLatest,
}) => {
  const visibleCount =
    pointCount > 0 ? Math.min(pointCount, viewport.max - viewport.min + 1) : 0;
  const firstPoint = pointCount > 0 ? viewport.min + 1 : 0;
  const lastPoint = pointCount > 0 ? viewport.max + 1 : 0;
  const buttonClass =
    "inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50/90 px-2 py-2 print:hidden">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="mr-1 flex items-center gap-1 text-[10px] font-semibold text-slate-600">
          <MoveHorizontal className="h-3.5 w-3.5" /> View
        </div>
        {WINDOW_PRESETS.filter((count) => count <= pointCount).map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => showLast(count)}
            className={`${buttonClass} ${visibleCount === count ? "border-blue-400 bg-blue-50 text-blue-700" : ""}`}
          >
            {count}
          </button>
        ))}
        <button
          type="button"
          onClick={showAll}
          className={`${buttonClass} ${visibleCount === pointCount ? "border-blue-400 bg-blue-50 text-blue-700" : ""}`}
          disabled={pointCount <= 0}
        >
          All
        </button>
        <span className="mx-0.5 h-5 w-px bg-slate-300" />
        <button
          type="button"
          onClick={panLeft}
          className={buttonClass}
          disabled={viewport.min <= 0}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={panRight}
          className={buttonClass}
          disabled={viewport.max >= pointCount - 1}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={zoomIn}
          className={buttonClass}
          disabled={visibleCount <= Math.min(MIN_VISIBLE_POINTS, pointCount)}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className={buttonClass}
          disabled={visibleCount >= pointCount}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={jumpToLatest}
          className={buttonClass}
          disabled={viewport.max >= pointCount - 1}
        >
          <ChevronsRight className="h-3.5 w-3.5" /> Latest
        </button>
        <button
          type="button"
          onClick={reset}
          className={buttonClass}
          disabled={pointCount <= 0}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
        <div className="ml-auto rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600">
          {firstPoint}–{lastPoint} of {pointCount}
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-500">
        <span>Mouse wheel: zoom</span>
        <span>Drag: pan</span>
        <span>Ctrl + drag: area zoom</span>
        <span>Pinch: touch zoom</span>
        <span>Click on point: View details</span>
      </div>
    </div>
  );
};

// ============= CHART OPTIONS BUILDER =============

const buildReportChartOptions = ({
  filteredPoints,
  yTitle,
  beginAtZero = false,
  legendFilter = null,
  viewport,
  onViewportChange,
  unit = "",
  onClick = null,
}) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  normalized: true,
  parsing: true,
  interaction: { mode: "index", intersect: false },
  onClick,
  elements: { line: { capBezierPoints: false } },
  plugins: {
    legend: {
      position: "top",
      align: "end",
      labels: {
        boxWidth: 18,
        boxHeight: 2,
        padding: 8,
        font: { size: 9 },
        ...(legendFilter ? { filter: legendFilter } : {}),
      },
    },
    tooltip: {
      enabled: true,
      displayColors: true,
      callbacks: {
        title: (contexts) => {
          const point = filteredPoints[contexts?.[0]?.dataIndex];
          if (!point) return "";
          const dateText = point.collectedAt
            ? new Date(point.collectedAt).toLocaleString()
            : "";
          return `${point.sourceLabel}${dateText ? ` | ${dateText}` : ""}`;
        },
        label: (context) => {
          if (context.parsed.y === null || context.parsed.y === undefined)
            return null;
          return `${context.dataset.label}: ${formatCustomerReportValue(context.parsed.y, 4)}${unit ? ` ${unit}` : ""}`;
        },
        afterBody: (contexts) => {
          const point = filteredPoints[contexts?.[0]?.dataIndex];
          return buildTooltipMetadataLines(point, unit);
        },
      },
    },
    zoom: {
      limits: {
        x: {
          min: 0,
          max: Math.max(0, filteredPoints.length - 1),
          minRange: Math.min(MIN_VISIBLE_POINTS, filteredPoints.length),
        },
      },
      pan: {
        enabled: true,
        mode: "x",
        threshold: 3,
        onPanComplete: ({ chart }) => onViewportChange(chart),
      },
      zoom: {
        mode: "x",
        wheel: { enabled: true, speed: 0.08 },
        pinch: { enabled: true },
        drag: {
          enabled: true,
          modifierKey: "ctrl",
          threshold: 6,
          backgroundColor: "rgba(37, 99, 235, 0.10)",
          borderColor: "rgba(37, 99, 235, 0.65)",
          borderWidth: 1,
        },
        onZoomComplete: ({ chart }) => onViewportChange(chart),
      },
    },
  },
  scales: {
    x: {
      min: viewport.min,
      max: viewport.max,
      offset: false,
      grid: { color: "rgba(148, 163, 184, 0.18)" },
      ticks: {
        autoSkip: true,
        maxTicksLimit: 14,
        maxRotation: 0,
        minRotation: 0,
        font: { size: 8 },
      },
    },
    y: {
      beginAtZero,
      grid: { color: "rgba(148, 163, 184, 0.22)" },
      ticks: {
        font: { size: 8 },
        callback: (value) => formatCustomerReportValue(value, 4),
      },
      title: { display: true, text: yTitle, font: { size: 9 } },
    },
  },
});

// ============= CHART COMPONENTS =============

const CombinedXbarRReportChart = ({
  chart,
  selectedSubgroup = "all",
  startDate = null,
  endDate = null,
  initialVisiblePoints = DEFAULT_VISIBLE_POINTS,
}) => {
  const xbarChartRef = useRef(null);
  const rangeChartRef = useRef(null);
  const chartRefs = useMemo(() => [xbarChartRef, rangeChartRef], []);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const capaBySubgroup = useCAPABySubgroup(chart);

  const filteredPoints = useMemo(() => {
    if (!Array.isArray(chart?.xbarValues)) return [];
    const metadata = Array.isArray(chart.subgroupMetadata)
      ? chart.subgroupMetadata
      : [];
    const sourceLabels = Array.isArray(chart.labels) ? chart.labels : [];
    const ranges = Array.isArray(chart.rangeValues) ? chart.rangeValues : [];

    return chart.xbarValues
      .map((xbar, index) => {
        const meta = metadata[index] || {};
        const collectedAt = meta.collectedAt || meta.date || null;
        const timestamp = collectedAt ? new Date(collectedAt).getTime() : null;
        return {
          originalIndex: index,
          axisLabel: getReportAxisLabel(meta, `SG-${index + 1}`),
          sourceLabel:
            getReadableText(
              sourceLabels[index],
              meta.subgroupLabel,
              meta.subgroupName,
              meta.label,
            ) || `Subgroup ${index + 1}`,
          collectedAt,
          timestamp: Number.isFinite(timestamp) ? timestamp : null,
          baselineVersion:
            meta.baselineVersion ?? chart.baselineVersions?.[index] ?? null,
          metadata: meta,
          xbar: toFiniteNumberOrNull(xbar),
          range: toFiniteNumberOrNull(ranges[index]),
        };
      })
      .filter((point) => point.xbar !== null && point.range !== null)
      .filter(
        (point) =>
          selectedSubgroup === "all" ||
          String(point.originalIndex) === String(selectedSubgroup),
      )
      .filter((point) => {
        if (!startDate && !endDate) return true;
        if (point.timestamp === null) return false;
        if (startDate && point.timestamp < startDate.getTime()) return false;
        if (endDate && point.timestamp > endDate.getTime()) return false;
        return true;
      });
  }, [chart, selectedSubgroup, startDate, endDate]);

  const viewportControls = useSynchronizedViewport({
    pointCount: filteredPoints.length,
    initialVisiblePoints,
    chartRefs,
  });

  const handleChartClick = useCallback(
    (event, elements) => {
      if (elements.length === 0) return;
      const element = elements[0];
      const dataset = event.chart.data.datasets[element.datasetIndex];
      if (dataset.spcRole !== "primary") return;
      const point = filteredPoints[element.index];
      if (point) {
        const datasetLabel = String(dataset?.label || "").toLowerCase();
        const chartPanel = datasetLabel.includes("moving range")
          ? "movingRange"
          : datasetLabel.includes("subgroup range")
            ? "range"
            : datasetLabel.includes("individual")
              ? "individual"
              : datasetLabel.includes("observed")
                ? "attribute"
                : "xbar";
        setSelectedPoint({ ...point, chartPanel });
        setModalOpen(true);
      }
    },
    [filteredPoints],
  );

  if (!Array.isArray(chart?.xbarValues) || chart.xbarValues.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
        Historical rational subgroups are not yet available for this checkpoint.
      </div>
    );
  }
  if (filteredPoints.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
        No complete rational subgroup falls inside the selected filter.
      </div>
    );
  }

  const labels = filteredPoints.map((point) => point.axisLabel);
  const xbarOocIndexes = new Set(chart.xbarOocIndexes || []);
  const rangeOocIndexes = new Set(chart.rangeOocIndexes || []);
  const latestPointIndex = filteredPoints.length - 1;

  const xbarCenterData = filteredPoints.map((point) =>
    getReportSeriesValue(
      chart,
      "xbarCenterSeries",
      "xbarCenterLine",
      point.originalIndex,
    ),
  );
  const xbarUclData = filteredPoints.map((point) =>
    getReportSeriesValue(
      chart,
      "xbarUclSeries",
      "xbarUcl",
      point.originalIndex,
    ),
  );
  const xbarLclData = filteredPoints.map((point) =>
    getReportSeriesValue(
      chart,
      "xbarLclSeries",
      "xbarLcl",
      point.originalIndex,
    ),
  );
  const rangeCenterData = filteredPoints.map((point) =>
    getReportSeriesValue(
      chart,
      "rangeCenterSeries",
      "rangeCenterLine",
      point.originalIndex,
    ),
  );
  const rangeUclData = filteredPoints.map((point) =>
    getReportSeriesValue(
      chart,
      "rangeUclSeries",
      "rangeUcl",
      point.originalIndex,
    ),
  );
  const rangeLclData = filteredPoints.map((point) =>
    getReportSeriesValue(
      chart,
      "rangeLclSeries",
      "rangeLcl",
      point.originalIndex,
    ),
  );

  const xbarData = {
    labels,
    datasets: [
      {
        label: "Subgroup mean",
        data: filteredPoints.map((point) => point.xbar),
        borderColor: "#0369a1",
        backgroundColor: "rgba(3, 105, 161, 0.08)",
        pointBackgroundColor: buildPointColor({
          filteredPoints,
          oocIndexes: xbarOocIndexes,
          indexField: "originalIndex",
          normalColor: "#0369a1",
          outOfControlColor: "#dc2626",
        }),
        pointBorderColor: buildPointColor({
          filteredPoints,
          oocIndexes: xbarOocIndexes,
          indexField: "originalIndex",
          normalColor: "#0369a1",
          outOfControlColor: "#991b1b",
          capaBySubgroup,
          capaColor: "#4c1d95",
        }),
        pointRadius: buildPointRadius({
          filteredPoints,
          oocIndexes: xbarOocIndexes,
          indexField: "originalIndex",
          capaBySubgroup,
        }),
        pointHoverRadius: 6,
        pointHitRadius: 8,
        fill: true,
        tension: 0,
        borderWidth: 1.5,
        spcRole: "primary",
      },
      buildReportControlLine({
        label: "Center line",
        data: xbarCenterData,
        borderColor: "#0f766e",
        borderDash: [7, 4],
      }),
      buildReportControlLine({
        label: "UCL",
        data: xbarUclData,
        borderColor: "#b45309",
        borderDash: [5, 3],
      }),
      buildReportControlLine({
        label: "LCL",
        data: xbarLclData,
        borderColor: "#b45309",
        borderDash: [5, 3],
      }),
      buildReportControlLine({
        label: "USL",
        data: buildConstantReportSeries(labels.length, chart.usl),
        borderColor: "#dc2626",
        borderDash: [2, 3],
      }),
      buildReportControlLine({
        label: "LSL",
        data: buildConstantReportSeries(labels.length, chart.lsl),
        borderColor: "#dc2626",
        borderDash: [2, 3],
      }),
    ],
  };

  const rangeData = {
    labels,
    datasets: [
      {
        label: "Subgroup range",
        data: filteredPoints.map((point) => point.range),
        borderColor: "#7c3aed",
        backgroundColor: "rgba(124, 58, 237, 0.06)",
        pointBackgroundColor: buildPointColor({
          filteredPoints,
          oocIndexes: rangeOocIndexes,
          indexField: "originalIndex",
          normalColor: "#7c3aed",
          outOfControlColor: "#dc2626",
        }),
        pointBorderColor: buildPointColor({
          filteredPoints,
          oocIndexes: rangeOocIndexes,
          indexField: "originalIndex",
          normalColor: "#7c3aed",
          outOfControlColor: "#991b1b",
          capaBySubgroup,
          capaColor: "#4c1d95",
        }),
        pointRadius: buildPointRadius({
          filteredPoints,
          oocIndexes: rangeOocIndexes,
          indexField: "originalIndex",
          capaBySubgroup,
        }),
        pointHoverRadius: 6,
        pointHitRadius: 8,
        fill: true,
        tension: 0,
        borderWidth: 1.5,
        spcRole: "primary",
      },
      buildReportControlLine({
        label: "R-bar",
        data: rangeCenterData,
        borderColor: "#0f766e",
        borderDash: [7, 4],
      }),
      buildReportControlLine({
        label: "R UCL",
        data: rangeUclData,
        borderColor: "#b45309",
        borderDash: [5, 3],
      }),
      buildReportControlLine({
        label: "R LCL",
        data: rangeLclData,
        borderColor: "#b45309",
        borderDash: [5, 3],
      }),
    ],
  };

  return (
    <>
      <div className="border border-slate-300 bg-white px-2 pb-2 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1">
          <div>
            <div className="text-sm font-bold text-slate-950">
              X-bar–R Control Chart | {chart.checkpointName} | n ={" "}
              {chart.subgroupSize || "-"}
            </div>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[9px] font-medium text-blue-700 print:hidden">
            <Maximize2 className="h-3 w-3" /> X-axis zoom only · Purple ring =
            CAPA
          </div>
        </div>
        <ChartViewportToolbar
          pointCount={filteredPoints.length}
          {...viewportControls}
        />
        <div className="border-b border-slate-300">
          <div className="text-center text-[10px] text-slate-600">
            X-bar panel — subgroup averages
          </div>
          <div className="h-[260px] sm:h-[300px]">
            <Line
              ref={xbarChartRef}
              data={xbarData}
              options={buildReportChartOptions({
                filteredPoints,
                yTitle: `X-bar (${chart.unit || "value"})`,
                viewport: viewportControls.viewport,
                onViewportChange: viewportControls.synchronizeFromChart,
                unit: chart.unit || "",
                onClick: handleChartClick,
              })}
            />
          </div>
        </div>
        <div>
          <div className="text-center text-[10px] text-slate-600">
            R panel — within-subgroup variation
          </div>
          <div className="h-[190px] sm:h-[220px]">
            <Line
              ref={rangeChartRef}
              data={rangeData}
              options={buildReportChartOptions({
                filteredPoints,
                yTitle: `R (${chart.unit || "value"})`,
                beginAtZero: true,
                legendFilter: (legendItem) =>
                  ["Subgroup range", "R-bar", "R UCL", "R LCL"].includes(
                    legendItem.text,
                  ),
                viewport: viewportControls.viewport,
                onViewportChange: viewportControls.synchronizeFromChart,
                unit: chart.unit || "",
                onClick: handleChartClick,
              })}
            />
          </div>
        </div>
        <div className="text-center text-[10px] text-slate-700">
          Loaded {filteredPoints.length} subgroup(s) | Visible{" "}
          {viewportControls.viewport.min + 1}–
          {viewportControls.viewport.max + 1} | Current center ={" "}
          {formatCustomerReportValue(xbarCenterData[latestPointIndex], 4)} |
          Current R-bar ={" "}
          {formatCustomerReportValue(rangeCenterData[latestPointIndex], 4)} |
          Limits: {chart.limitsSource || "Not available"} | Status:{" "}
          {chart.status || "Insufficient data"}
        </div>
      </div>
      <SubgroupDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        subgroupData={selectedPoint}
        chart={chart}
      />
    </>
  );
};

const CombinedIMRReportChart = ({
  chart,
  selectedSubgroup = "all",
  startDate = null,
  endDate = null,
  initialVisiblePoints = DEFAULT_VISIBLE_POINTS,
}) => {
  const individualChartRef = useRef(null);
  const movingRangeChartRef = useRef(null);
  const chartRefs = useMemo(
    () => [individualChartRef, movingRangeChartRef],
    [],
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const capaBySubgroup = useCAPABySubgroup(chart);

  const filteredPoints = useMemo(() => {
    if (!Array.isArray(chart?.individualValues)) return [];
    const metadata = Array.isArray(chart.subgroupMetadata)
      ? chart.subgroupMetadata
      : [];
    const sourceLabels = Array.isArray(chart.labels) ? chart.labels : [];
    const movingRanges = Array.isArray(chart.movingRangeValues)
      ? chart.movingRangeValues
      : [];

    return chart.individualValues
      .map((individual, index) => {
        const meta = metadata[index] || {};
        const collectedAt = meta.collectedAt || meta.date || null;
        const timestamp = collectedAt ? new Date(collectedAt).getTime() : null;
        return {
          originalIndex: index,
          movingRangeIndex: index - 1,
          axisLabel: getReportAxisLabel(meta, `Reading ${index + 1}`),
          sourceLabel:
            getReadableText(
              sourceLabels[index],
              meta.readingLabel,
              meta.label,
            ) || `Reading ${index + 1}`,
          collectedAt,
          timestamp: Number.isFinite(timestamp) ? timestamp : null,
          baselineVersion:
            meta.baselineVersion ?? chart.baselineVersions?.[index] ?? null,
          metadata: meta,
          individual: toFiniteNumberOrNull(individual),
          movingRange:
            index === 0 ? null : toFiniteNumberOrNull(movingRanges[index - 1]),
        };
      })
      .filter((point) => point.individual !== null)
      .filter(
        (point) =>
          selectedSubgroup === "all" ||
          String(point.originalIndex) === String(selectedSubgroup),
      )
      .filter((point) => {
        if (!startDate && !endDate) return true;
        if (point.timestamp === null) return false;
        if (startDate && point.timestamp < startDate.getTime()) return false;
        if (endDate && point.timestamp > endDate.getTime()) return false;
        return true;
      });
  }, [chart, selectedSubgroup, startDate, endDate]);

  const viewportControls = useSynchronizedViewport({
    pointCount: filteredPoints.length,
    initialVisiblePoints,
    chartRefs,
  });

  const handleChartClick = useCallback(
    (event, elements) => {
      if (elements.length === 0) return;
      const element = elements[0];
      const dataset = event.chart.data.datasets[element.datasetIndex];
      if (dataset.spcRole !== "primary") return;
      const point = filteredPoints[element.index];
      if (point) {
        const datasetLabel = String(dataset?.label || "").toLowerCase();
        const chartPanel = datasetLabel.includes("moving range")
          ? "movingRange"
          : datasetLabel.includes("subgroup range")
            ? "range"
            : datasetLabel.includes("individual")
              ? "individual"
              : datasetLabel.includes("observed")
                ? "attribute"
                : "xbar";
        setSelectedPoint({ ...point, chartPanel });
        setModalOpen(true);
      }
    },
    [filteredPoints],
  );

  if (
    !Array.isArray(chart?.individualValues) ||
    chart.individualValues.length === 0
  ) {
    return (
      <div className="flex min-h-[220px] items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
        Sequential individual readings are not yet available for this
        checkpoint.
      </div>
    );
  }
  if (filteredPoints.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
        No reading falls inside the selected filter.
      </div>
    );
  }

  const labels = filteredPoints.map((point) => point.axisLabel);
  const individualOocIndexes = new Set(chart.individualOocIndexes || []);
  const movingRangeOocIndexes = new Set(chart.movingRangeOocIndexes || []);
  const latestPointIndex = filteredPoints.length - 1;

  const individualCenterData = filteredPoints.map((point) =>
    getReportSeriesValue(
      chart,
      "individualCenterSeries",
      "individualCenter",
      point.originalIndex,
    ),
  );
  const individualUclData = filteredPoints.map((point) =>
    getReportSeriesValue(
      chart,
      "individualUclSeries",
      "individualUcl",
      point.originalIndex,
    ),
  );
  const individualLclData = filteredPoints.map((point) =>
    getReportSeriesValue(
      chart,
      "individualLclSeries",
      "individualLcl",
      point.originalIndex,
    ),
  );
  const movingRangeCenterData = filteredPoints.map((point) =>
    point.movingRangeIndex < 0
      ? null
      : getReportSeriesValue(
          chart,
          "movingRangeCenterSeries",
          "movingRangeCenter",
          point.movingRangeIndex,
        ),
  );
  const movingRangeUclData = filteredPoints.map((point) =>
    point.movingRangeIndex < 0
      ? null
      : getReportSeriesValue(
          chart,
          "movingRangeUclSeries",
          "movingRangeUcl",
          point.movingRangeIndex,
        ),
  );
  const movingRangeLclData = filteredPoints.map((point) =>
    point.movingRangeIndex < 0
      ? null
      : getReportSeriesValue(
          chart,
          "movingRangeLclSeries",
          "movingRangeLcl",
          point.movingRangeIndex,
        ),
  );

  const individualData = {
    labels,
    datasets: [
      {
        label: "Individual value",
        data: filteredPoints.map((point) => point.individual),
        borderColor: "#0369a1",
        backgroundColor: "rgba(3, 105, 161, 0.08)",
        pointBackgroundColor: buildPointColor({
          filteredPoints,
          oocIndexes: individualOocIndexes,
          indexField: "originalIndex",
          normalColor: "#0369a1",
          outOfControlColor: "#dc2626",
        }),
        pointBorderColor: buildPointColor({
          filteredPoints,
          oocIndexes: individualOocIndexes,
          indexField: "originalIndex",
          normalColor: "#0369a1",
          outOfControlColor: "#991b1b",
          capaBySubgroup,
          capaColor: "#4c1d95",
        }),
        pointRadius: buildPointRadius({
          filteredPoints,
          oocIndexes: individualOocIndexes,
          indexField: "originalIndex",
          capaBySubgroup,
        }),
        pointHoverRadius: 6,
        pointHitRadius: 8,
        fill: true,
        tension: 0,
        borderWidth: 1.5,
        spcRole: "primary",
      },
      buildReportControlLine({
        label: "Center line",
        data: individualCenterData,
        borderColor: "#0f766e",
        borderDash: [7, 4],
      }),
      buildReportControlLine({
        label: "UCL",
        data: individualUclData,
        borderColor: "#b45309",
        borderDash: [5, 3],
      }),
      buildReportControlLine({
        label: "LCL",
        data: individualLclData,
        borderColor: "#b45309",
        borderDash: [5, 3],
      }),
      buildReportControlLine({
        label: "USL",
        data: buildConstantReportSeries(labels.length, chart.usl),
        borderColor: "#dc2626",
        borderDash: [2, 3],
      }),
      buildReportControlLine({
        label: "LSL",
        data: buildConstantReportSeries(labels.length, chart.lsl),
        borderColor: "#dc2626",
        borderDash: [2, 3],
      }),
    ],
  };

  const movingRangeData = {
    labels,
    datasets: [
      {
        label: "Moving range",
        data: filteredPoints.map((point) => point.movingRange),
        borderColor: "#7c3aed",
        backgroundColor: "rgba(124, 58, 237, 0.06)",
        pointBackgroundColor: buildPointColor({
          filteredPoints,
          oocIndexes: movingRangeOocIndexes,
          indexField: "movingRangeIndex",
          normalColor: "#7c3aed",
          outOfControlColor: "#dc2626",
        }),
        pointBorderColor: buildPointColor({
          filteredPoints,
          oocIndexes: movingRangeOocIndexes,
          indexField: "movingRangeIndex",
          normalColor: "#7c3aed",
          outOfControlColor: "#991b1b",
          capaBySubgroup,
          capaColor: "#4c1d95",
        }),
        pointRadius: buildPointRadius({
          filteredPoints,
          oocIndexes: movingRangeOocIndexes,
          indexField: "movingRangeIndex",
          capaBySubgroup,
        }),
        pointHoverRadius: 6,
        pointHitRadius: 8,
        fill: true,
        tension: 0,
        borderWidth: 1.5,
        spanGaps: false,
        spcRole: "primary",
      },
      buildReportControlLine({
        label: "MR-bar",
        data: movingRangeCenterData,
        borderColor: "#0f766e",
        borderDash: [7, 4],
      }),
      buildReportControlLine({
        label: "MR UCL",
        data: movingRangeUclData,
        borderColor: "#b45309",
        borderDash: [5, 3],
      }),
      buildReportControlLine({
        label: "MR LCL",
        data: movingRangeLclData,
        borderColor: "#b45309",
        borderDash: [5, 3],
      }),
    ],
  };

  return (
    <>
      <div className="border border-slate-300 bg-white px-2 pb-2 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1">
          <div>
            <div className="text-sm font-bold text-slate-950">
              I–MR Control Chart | {chart.checkpointName}
            </div>
            <div className="text-[9px] text-slate-500">
              Zoom and pan remain synchronized between the Individuals and MR
              panels.
            </div>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[9px] font-medium text-blue-700 print:hidden">
            <Maximize2 className="h-3 w-3" /> X-axis zoom only · Purple ring =
            CAPA
          </div>
        </div>
        <ChartViewportToolbar
          pointCount={filteredPoints.length}
          {...viewportControls}
        />
        <div className="border-b border-slate-300">
          <div className="text-center text-[10px] text-slate-600">
            Individuals panel — sequential process values
          </div>
          <div className="h-[260px] sm:h-[300px]">
            <Line
              ref={individualChartRef}
              data={individualData}
              options={buildReportChartOptions({
                filteredPoints,
                yTitle: `Individual (${chart.unit || "value"})`,
                viewport: viewportControls.viewport,
                onViewportChange: viewportControls.synchronizeFromChart,
                unit: chart.unit || "",
                onClick: handleChartClick,
              })}
            />
          </div>
        </div>
        <div>
          <div className="text-center text-[10px] text-slate-600">
            Moving-range panel — change between consecutive readings
          </div>
          <div className="h-[190px] sm:h-[220px]">
            <Line
              ref={movingRangeChartRef}
              data={movingRangeData}
              options={buildReportChartOptions({
                filteredPoints,
                yTitle: `MR (${chart.unit || "value"})`,
                beginAtZero: true,
                legendFilter: (legendItem) =>
                  ["Moving range", "MR-bar", "MR UCL", "MR LCL"].includes(
                    legendItem.text,
                  ),
                viewport: viewportControls.viewport,
                onViewportChange: viewportControls.synchronizeFromChart,
                unit: chart.unit || "",
                onClick: handleChartClick,
              })}
            />
          </div>
        </div>
        <div className="text-center text-[10px] text-slate-700">
          Loaded {filteredPoints.length} reading(s) | Visible{" "}
          {viewportControls.viewport.min + 1}–
          {viewportControls.viewport.max + 1} | Current center ={" "}
          {formatCustomerReportValue(individualCenterData[latestPointIndex], 4)}{" "}
          | Current MR-bar ={" "}
          {formatCustomerReportValue(
            movingRangeCenterData[latestPointIndex],
            4,
          )}{" "}
          | Limits: {chart.limitsSource || "Not available"} | Status:{" "}
          {chart.status || "Insufficient data"}
        </div>
      </div>
      <SubgroupDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        subgroupData={selectedPoint}
        chart={chart}
      />
    </>
  );
};

const CombinedAttributeReportChart = ({
  chart,
  selectedSubgroup = "all",
  startDate = null,
  endDate = null,
  initialVisiblePoints = DEFAULT_VISIBLE_POINTS,
}) => {
  const attributeChartRef = useRef(null);
  const chartRefs = useMemo(() => [attributeChartRef], []);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const capaBySubgroup = useCAPABySubgroup(chart);

  const filteredPoints = useMemo(() => {
    if (!Array.isArray(chart?.values)) return [];
    const metadata = Array.isArray(chart.subgroupMetadata)
      ? chart.subgroupMetadata
      : [];
    const sourceLabels = Array.isArray(chart.labels) ? chart.labels : [];

    return chart.values
      .map((value, index) => {
        const meta = metadata[index] || {};
        const collectedAt = meta.collectedAt || meta.date || null;
        const timestamp = collectedAt ? new Date(collectedAt).getTime() : null;
        return {
          originalIndex: index,
          axisLabel: getReportAxisLabel(meta, `SG-${index + 1}`),
          sourceLabel:
            getReadableText(
              sourceLabels[index],
              meta.subgroupLabel,
              meta.subgroupName,
              meta.label,
            ) || `Subgroup ${index + 1}`,
          collectedAt,
          timestamp: Number.isFinite(timestamp) ? timestamp : null,
          metadata: meta,
          value: toFiniteNumberOrNull(value),
        };
      })
      .filter((point) => point.value !== null)
      .filter(
        (point) =>
          selectedSubgroup === "all" ||
          String(point.originalIndex) === String(selectedSubgroup),
      )
      .filter((point) => {
        if (!startDate && !endDate) return true;
        if (point.timestamp === null) return false;
        if (startDate && point.timestamp < startDate.getTime()) return false;
        if (endDate && point.timestamp > endDate.getTime()) return false;
        return true;
      });
  }, [chart, selectedSubgroup, startDate, endDate]);

  const viewportControls = useSynchronizedViewport({
    pointCount: filteredPoints.length,
    initialVisiblePoints,
    chartRefs,
  });

  const handleChartClick = useCallback(
    (event, elements) => {
      if (elements.length === 0) return;
      const element = elements[0];
      const dataset = event.chart.data.datasets[element.datasetIndex];
      if (dataset.spcRole !== "primary") return;
      const point = filteredPoints[element.index];
      if (point) {
        const datasetLabel = String(dataset?.label || "").toLowerCase();
        const chartPanel = datasetLabel.includes("moving range")
          ? "movingRange"
          : datasetLabel.includes("subgroup range")
            ? "range"
            : datasetLabel.includes("individual")
              ? "individual"
              : datasetLabel.includes("observed")
                ? "attribute"
                : "xbar";
        setSelectedPoint({ ...point, chartPanel });
        setModalOpen(true);
      }
    },
    [filteredPoints],
  );

  if (!Array.isArray(chart?.values) || chart.values.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
        Attribute subgroup data is not yet available for this checkpoint.
      </div>
    );
  }
  if (filteredPoints.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
        No attribute subgroup falls inside the selected filter.
      </div>
    );
  }

  const labels = filteredPoints.map((point) => point.axisLabel);
  const oocIndexes = new Set(chart.oocIndexes || []);
  const centerData = filteredPoints.map((point) =>
    getReportSeriesValue(chart, "centerSeries", "center", point.originalIndex),
  );
  const uclData = filteredPoints.map((point) =>
    getReportSeriesValue(chart, "uclSeries", "ucl", point.originalIndex),
  );
  const lclData = filteredPoints.map((point) =>
    getReportSeriesValue(chart, "lclSeries", "lcl", point.originalIndex),
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Observed value",
        data: filteredPoints.map((point) => point.value),
        borderColor: "#0369a1",
        backgroundColor: "rgba(3, 105, 161, 0.08)",
        pointBackgroundColor: buildPointColor({
          filteredPoints,
          oocIndexes,
          indexField: "originalIndex",
          normalColor: "#0369a1",
          outOfControlColor: "#dc2626",
        }),
        pointBorderColor: buildPointColor({
          filteredPoints,
          oocIndexes,
          indexField: "originalIndex",
          normalColor: "#0369a1",
          outOfControlColor: "#991b1b",
          capaBySubgroup,
          capaColor: "#4c1d95",
        }),
        pointRadius: buildPointRadius({
          filteredPoints,
          oocIndexes,
          indexField: "originalIndex",
          capaBySubgroup,
        }),
        pointHoverRadius: 6,
        pointHitRadius: 8,
        fill: true,
        tension: 0,
        borderWidth: 1.5,
        spcRole: "primary",
      },
      buildReportControlLine({
        label: "Center line",
        data: centerData,
        borderColor: "#0f766e",
        borderDash: [7, 4],
      }),
      buildReportControlLine({
        label: "UCL",
        data: uclData,
        borderColor: "#b45309",
        borderDash: [5, 3],
      }),
      buildReportControlLine({
        label: "LCL",
        data: lclData,
        borderColor: "#b45309",
        borderDash: [5, 3],
      }),
    ],
  };

  return (
    <>
      <div className="border border-slate-300 bg-white px-2 pb-2 pt-1">
        <div className="px-1 py-1 text-sm font-bold text-slate-950">
          {String(chart.type || "").toUpperCase()} Control Chart |{" "}
          {chart.checkpointName}
        </div>
        <ChartViewportToolbar
          pointCount={filteredPoints.length}
          {...viewportControls}
        />
        <div className="h-[340px] sm:h-[420px]">
          <Line
            ref={attributeChartRef}
            data={data}
            options={buildReportChartOptions({
              filteredPoints,
              yTitle: chart.unit || "value",
              beginAtZero: true,
              viewport: viewportControls.viewport,
              onViewportChange: viewportControls.synchronizeFromChart,
              unit: chart.unit || "",
              onClick: handleChartClick,
            })}
          />
        </div>
        <div className="text-center text-[10px] text-slate-700">
          Loaded {filteredPoints.length} subgroup(s) | Visible{" "}
          {viewportControls.viewport.min + 1}–
          {viewportControls.viewport.max + 1} | Limits:{" "}
          {chart.limitsSource || "Calculated attribute limits"} | Status:{" "}
          {chart.status || "Insufficient data"}
        </div>
      </div>
      <SubgroupDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        subgroupData={selectedPoint}
        chart={chart}
      />
    </>
  );
};

// ============= HISTOGRAM CHART =============

const HistogramReportChart = ({
  chart,
  selectedSubgroup = "all",
  startDate = null,
  endDate = null,
}) => {
  const readings = useMemo(
    () =>
      getFilteredHistogramReadings({
        chart,
        selectedSubgroup,
        startDate,
        endDate,
      }),
    [chart, selectedSubgroup, startDate, endDate],
  );

  const summary = useMemo(
    () =>
      buildHistogramSummary({
        values: readings,
        lsl: chart?.lsl,
        usl: chart?.usl,
        nominal:
          chart?.nominal ??
          chart?.target ??
          chart?.expectedValue ??
          chart?.expected ??
          chart?.specification?.nominal,
      }),
    [
      readings,
      chart?.lsl,
      chart?.usl,
      chart?.nominal,
      chart?.target,
      chart?.expectedValue,
      chart?.expected,
      chart?.specification?.nominal,
    ],
  );

  if (!summary) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50 px-6 text-center">
        <BarChart3 className="mb-3 h-9 w-9 text-amber-500" />
        <div className="text-sm font-semibold text-amber-900">
          Raw numeric readings are not available
        </div>
        <p className="mt-1 max-w-xl text-xs leading-5 text-amber-700">
          The histogram requires the individual measurements for the selected
          checkpoint and filter. Include rawValues, rawReadings, readings, or
          pieceValues in each subgroupMetadata record returned by the SPC API.
        </p>
      </div>
    );
  }

  const unit = chart?.unit || "";
  const referenceLines = [
    summary.lsl !== null
      ? { label: "LSL", value: summary.lsl, color: "#dc2626", offsetY: 4 }
      : null,
    summary.usl !== null
      ? { label: "USL", value: summary.usl, color: "#dc2626", offsetY: 18 }
      : null,
    summary.nominal !== null
      ? {
          label: "Target",
          value: summary.nominal,
          color: "#7c3aed",
          dash: [3, 3],
          offsetY: 32,
        }
      : null,
    {
      label: "Mean",
      value: summary.mean,
      color: "#0f766e",
      dash: [7, 4],
      offsetY: 46,
    },
  ].filter(Boolean);

  const histogramData = {
    labels: summary.bins.map(
      (bin) =>
        `${formatCustomerReportValue(bin.lower, 4)}–${formatCustomerReportValue(bin.upper, 4)}`,
    ),
    datasets: [
      {
        label: "Frequency",
        data: summary.bins.map((bin) => bin.count),
        backgroundColor: summary.bins.map((bin) => {
          const outsideLower = summary.lsl !== null && bin.center < summary.lsl;
          const outsideUpper = summary.usl !== null && bin.center > summary.usl;
          return outsideLower || outsideUpper
            ? "rgba(220, 38, 38, 0.72)"
            : "rgba(2, 132, 199, 0.72)";
        }),
        borderColor: summary.bins.map((bin) => {
          const outsideLower = summary.lsl !== null && bin.center < summary.lsl;
          const outsideUpper = summary.usl !== null && bin.center > summary.usl;
          return outsideLower || outsideUpper ? "#b91c1c" : "#0369a1";
        }),
        borderWidth: 1,
        borderRadius: 3,
        barPercentage: 1,
        categoryPercentage: 0.98,
      },
    ],
  };

  const histogramOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (contexts) => {
            const bin = summary.bins[contexts?.[0]?.dataIndex];
            if (!bin) return "";
            return `${formatCustomerReportValue(bin.lower, 4)} to ${formatCustomerReportValue(bin.upper, 4)}${unit ? ` ${unit}` : ""}`;
          },
          label: (context) => `Frequency: ${context.parsed.y}`,
        },
      },
      histogramReferenceLines: {
        minimum: summary.displayMin,
        maximum: summary.displayMax,
        lines: referenceLines,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 12,
          maxRotation: 45,
          minRotation: 0,
          font: { size: 9 },
        },
        title: {
          display: true,
          text: `${chart?.checkpointName || "Measurement"}${unit ? ` (${unit})` : ""}`,
          font: { size: 10, weight: "600" },
        },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, stepSize: 1, font: { size: 9 } },
        grid: { color: "rgba(148, 163, 184, 0.22)" },
        title: {
          display: true,
          text: "Frequency",
          font: { size: 10, weight: "600" },
        },
      },
    },
  };

  const metricClass =
    "rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-sky-50 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
              <BarChart3 className="h-4 w-4 text-sky-700" /> Measurement
              Histogram | {chart?.checkpointName || "Checkpoint"}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Distribution of raw measurements for the currently selected SPC
              subgroup and date filters.
            </p>
          </div>
          <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-semibold text-sky-700">
            {summary.count} reading{summary.count === 1 ? "" : "s"} ·{" "}
            {summary.bins.length} bins
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className={metricClass}>
          <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            Mean
          </div>
          <div className="mt-1 text-sm font-bold text-slate-900">
            {formatCustomerReportValue(summary.mean, 4)} {unit}
          </div>
        </div>
        <div className={metricClass}>
          <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            Std. deviation
          </div>
          <div className="mt-1 text-sm font-bold text-slate-900">
            {formatCustomerReportValue(summary.standardDeviation, 4)} {unit}
          </div>
        </div>
        <div className={metricClass}>
          <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            Minimum
          </div>
          <div className="mt-1 text-sm font-bold text-slate-900">
            {formatCustomerReportValue(summary.dataMin, 4)} {unit}
          </div>
        </div>
        <div className={metricClass}>
          <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            Maximum
          </div>
          <div className="mt-1 text-sm font-bold text-slate-900">
            {formatCustomerReportValue(summary.dataMax, 4)} {unit}
          </div>
        </div>
        <div className={metricClass}>
          <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            Estimated Cp / Cpk
          </div>
          <div className="mt-1 text-sm font-bold text-slate-900">
            {formatCustomerReportValue(summary.cp, 2)} /{" "}
            {formatCustomerReportValue(summary.cpk, 2)}
          </div>
        </div>
        <div
          className={`${metricClass} ${summary.outOfSpecCount > 0 ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50"}`}
        >
          <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            In specification
          </div>
          <div
            className={`mt-1 text-sm font-bold ${summary.outOfSpecCount > 0 ? "text-rose-700" : "text-emerald-700"}`}
          >
            {summary.hasSpecification
              ? `${formatCustomerReportValue(summary.inSpecPercent, 1)}% (${summary.inSpecCount}/${summary.count})`
              : "Specifications not set"}
          </div>
        </div>
      </div>

      <div className="h-[340px] p-3 sm:h-[430px] sm:p-4">
        <Bar
          data={histogramData}
          options={histogramOptions}
          plugins={[histogramReferenceLinesPlugin]}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 text-[10px] text-slate-600">
        <span>
          LSL: {formatCustomerReportValue(summary.lsl, 4)} · USL:{" "}
          {formatCustomerReportValue(summary.usl, 4)} · Out of specification:{" "}
          {summary.hasSpecification ? summary.outOfSpecCount : "—"}
        </span>
        <span>
          Cp/Cpk are estimates and should be interpreted only after process
          stability is confirmed.
        </span>
      </div>
    </div>
  );
};

// ============= MAIN EXPORT WITH CONTROL/HISTOGRAM TABS =============

export const CombinedSPCReportChart = (props) => {
  const [activeReportTab, setActiveReportTab] = useState("control");
  const type = String(props.chart?.type || "")
    .trim()
    .toLowerCase();

  const isIMR = ["imr", "i-mr", "x-mr"].includes(type);
  const isXbarR = ["xbar-r", "x-bar-r", "xbar r", "x-bar r"].includes(type);
  const isAttribute = ["p", "np", "c", "u"].includes(type);
  const supportsHistogram = isIMR || isXbarR;

  useEffect(() => {
    setActiveReportTab("control");
  }, [props.chart?.checkpointId, type]);

  let controlChart = null;
  if (isIMR) controlChart = <CombinedIMRReportChart {...props} />;
  else if (isXbarR) controlChart = <CombinedXbarRReportChart {...props} />;
  else if (isAttribute) {
    controlChart = <CombinedAttributeReportChart {...props} />;
  } else {
    controlChart = (
      <div className="flex min-h-[220px] items-center justify-center border border-dashed border-amber-300 bg-amber-50 px-4 text-center text-sm text-amber-800">
        No supported SPC chart is available for this checkpoint.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {supportsHistogram && (
        <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1.5 print:hidden">
          <button
            type="button"
            onClick={() => setActiveReportTab("control")}
            aria-pressed={activeReportTab === "control"}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeReportTab === "control"
                ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            <Activity className="h-4 w-4" /> Control Chart
          </button>
          <button
            type="button"
            onClick={() => setActiveReportTab("histogram")}
            aria-pressed={activeReportTab === "histogram"}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeReportTab === "histogram"
                ? "bg-white text-sky-700 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Histogram
          </button>
        </div>
      )}

      {activeReportTab === "histogram" && supportsHistogram ? (
        <HistogramReportChart {...props} />
      ) : (
        controlChart
      )}
    </div>
  );
};
export { CAPAHistoryModal, SimpleSPCAlertModal, SubgroupDetailsModal };
export default CombinedSPCReportChart;
