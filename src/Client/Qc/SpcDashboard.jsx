import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  BarChart3,
  Download,
  Printer,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  LayoutDashboard,
  Activity,
  PieChart,
  Layers,
  Grid3x3,
  LineChart,
  BarChart,
  Target,
  Minimize2,
  Maximize2,
  Info,
  Package,
  Building2,
  Calendar,
  Hash,
  PlusCircle,
  MoreVertical,
  ChartColumnIncreasing,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSocket } from "../../context/SocketContext";
import CombinedSPCReportChart from "./SPCControllChart";
import {
  Bell,
  AlertTriangle,
  FileWarning,
  Check,
  CheckCheck,
} from "lucide-react";
const API_URL =
  import.meta.env.VITE_REACT_APP_BACKEND_BASEURL ||
  "http://localhost:5000/api/v1";

const finiteNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

/**
 * Normalize all backend/UI baseline status formats to one token.
 * Examples:
 *   "Review Required"          -> "REVIEW_REQUIRED"
 *   "REVIEW-REQUIRED"          -> "REVIEW_REQUIRED"
 *   "BASELINE REVIEW REQUIRED" -> "BASELINE_REVIEW_REQUIRED"
 */
const normalizeBaselineStatusToken = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const resolveCandidateStatus = (candidate = {}, chart = {}) => {
  // Candidate status must come from a persisted candidate, not from the trial
  // chart baselineStatus. BASELINE_REVIEW_REQUIRED can exist before any
  // SPCBaseline document has been created.
  const rawStatus = candidate.status || chart.candidateBaselineStatus || "";
  const normalized = normalizeBaselineStatusToken(rawStatus);

  if (
    normalized === "BASELINE_REVIEW_REQUIRED" ||
    normalized === "REVIEW_REQUIRED"
  ) {
    return "REVIEW_REQUIRED";
  }

  if (
    normalized === "BUILDING_BASELINE" ||
    normalized === "BASELINE_BUILDING" ||
    normalized === "COLLECTING"
  ) {
    return "COLLECTING";
  }

  return normalized;
};

/**
 * Resolve one consistent baseline-candidate state for every frontend view.
 *
 * Some legacy API responses can return a REVIEW_REQUIRED candidate whose
 * persisted subgroupsCollected value is still 0 while the chart already
 * contains the validated complete subgroup count. In that case the chart
 * count is the trustworthy fallback for UI readiness; the backend remains
 * the final authority when the approve endpoint is called.
 */
const resolveBaselineCandidateState = (chartData = {}) => {
  const candidate = chartData?.candidateBaseline || {};
  const chart = chartData?.chart || chartData || {};

  const candidateId = String(
    candidate.id || candidate._id || chart.candidateBaselineId || "",
  ).trim();
  const hasPersistedCandidate = Boolean(candidateId);
  const status = hasPersistedCandidate
    ? resolveCandidateStatus(candidate, chart)
    : "";
  const trialStatus = normalizeBaselineStatusToken(chart.baselineStatus);
  const trialReadyWithoutCandidate =
    !hasPersistedCandidate && trialStatus === "BASELINE_REVIEW_REQUIRED";

  const chartSubgroupCount =
    finiteNumberOrNull(chart.subgroupCount) ??
    finiteNumberOrNull(chart.readingCount) ??
    (Array.isArray(chart.xbarValues)
      ? chart.xbarValues.length
      : Array.isArray(chart.individualValues)
        ? chart.individualValues.length
        : 0);

  const candidateCollected = finiteNumberOrNull(candidate.subgroupsCollected);
  const chartCollected = finiteNumberOrNull(chart.subgroupsCollected);


  const collected = Math.max(
    0,
    ["COLLECTING", "REVIEW_REQUIRED"].includes(status)
      ? Math.max(
          candidateCollected ?? 0,
          chartCollected ?? 0,
          chartSubgroupCount ?? 0,

        )
      : (candidateCollected ?? chartCollected ?? chartSubgroupCount ?? 0),
  );


  const minimum = Math.max(
    2,
    finiteNumberOrNull(candidate.minimumSubgroups) ??
      finiteNumberOrNull(chart.minimumSubgroups) ??
      20,
  );

  const controlMode = String(
    candidate.controlMode || chart.controlMode || "auto",
  )
    .trim()
    .toLowerCase();

  return {
    candidate,
    candidateId,
    hasPersistedCandidate,
    trialReadyWithoutCandidate,
    chart,
    status,
    collected,
    minimum,
    controlMode,
    canApprove:
      hasPersistedCandidate &&
      status === "REVIEW_REQUIRED" &&
      (controlMode === "manual" || collected >= minimum),
  };
};

const formatNumber = (value, precision = 4) => {
  const number = finiteNumberOrNull(value);
  return number === null ? "-" : number.toFixed(precision);
};

const MONGODB_OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

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

const getInspectionTimestamp = (inspection = {}) => {
  const rawValue =
    inspection.inspectionDate ||
    inspection.date ||
    inspection.collectedAt ||
    inspection.timestamp ||
    inspection.createdAt ||
    null;

  if (!rawValue) return null;
  const timestamp = new Date(rawValue).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const formatInspectionDate = (value) => {
  const timestamp =
    typeof value === "number" ? value : getInspectionTimestamp(value || {});
  if (!Number.isFinite(timestamp)) return "N/A";

  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInspectionPeriod = (inspections = []) => {
  const timestamps = inspections
    .map(getInspectionTimestamp)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (timestamps.length === 0) return "N/A";
  if (timestamps[0] === timestamps[timestamps.length - 1]) {
    return formatInspectionDate(timestamps[0]);
  }

  return `${formatInspectionDate(timestamps[0])} – ${formatInspectionDate(
    timestamps[timestamps.length - 1],
  )}`;
};

const getLatestInspection = (checkpoint, fallbackInspection = {}) => {
  const inspections = Array.isArray(checkpoint?.inspections)
    ? checkpoint.inspections
    : [];

  return (
    [...inspections].sort(
      (left, right) =>
        (getInspectionTimestamp(right) || 0) -
        (getInspectionTimestamp(left) || 0),
    )[0] ||
    fallbackInspection ||
    {}
  );
};

const normalizeStatusLabel = (value) => {
  const status = getReadableText(value) || "Pending";
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusClasses = (status) => {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();
  if (["pass", "passed", "ok", "accepted", "in control"].includes(normalized)) {
    return "bg-green-100 text-green-800 border-green-200";
  }
  if (["fail", "failed", "rejected", "out of control"].includes(normalized)) {
    return "bg-red-100 text-red-800 border-red-200";
  }
  return "bg-yellow-100 text-yellow-800 border-yellow-200";
};

const HISTORY_LIMIT_BY_RANGE = {
  today: 100,
  week: 250,
  month: 500,
  quarter: 1000,
  year: 5000,
  custom: 5000,
  all: 5000,
};

const getHistoryLimitForRange = (range) =>
  HISTORY_LIMIT_BY_RANGE[String(range || "all").toLowerCase()] || 500;

const INITIAL_VISIBLE_POINTS_BY_RANGE = {
  today: 40,
  week: 40,
  month: 60,
  quarter: 60,
  year: 90,
  custom: 60,
  all: 90,
};

const getInitialVisiblePointsForRange = (range) =>
  INITIAL_VISIBLE_POINTS_BY_RANGE[
    String(range || "month")
      .trim()
      .toLowerCase()
  ] || 60;

const normalizeDateOnly = (value) => {
  if (!value) return "";
  const text = String(value);
  const directMatch = text.match(/^\d{4}-\d{2}-\d{2}/);
  if (directMatch) return directMatch[0];

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? parsed.toISOString().slice(0, 10)
    : "";
};

const toBoundaryDate = (value, endOfDay = false) => {
  const dateOnly = normalizeDateOnly(value);
  if (!dateOnly) return null;
  const parsed = new Date(
    `${dateOnly}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`,
  );
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

const DEFAULT_DASHBOARD_FILTERS = {
  companyId: "",
  itemId: "",
  processId: "",
  status: "",
  resultType: "",
  criticality: "",
  spcMethod: "",
  stability: "",
  capability: "",
  hasPatterns: "",
  hasOutOfControl: "",
  fromDate: "",
  toDate: "",
  timeRange: "month",
  search: "",
  sortBy: "inspectionDate",
  sortOrder: "desc",
  page: 1,
  limit: 20,
  historyLimit: 500,
};

const DEFAULT_CHART_FILTERS = {
  dateRange: "month",
  fromDate: "",
  toDate: "",
  companyId: "",
  itemId: "",
  processId: "",
  checkpointId: "",
  status: "",
  spcMethod: "",
  resultType: "",
  stability: "",
  capability: "",
  hasOOC: "",
};

const normalizeSPCChartType = (value) => {
  const token = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");
  const withoutChart = token.replace(/\s*-?\s*chart$/, "").trim();

  if (
    /^x\s*-?\s*bar\s*-?\s*r$/.test(withoutChart) ||
    withoutChart === "xbar-r"
  ) {
    return "xbar-r";
  }
  if (
    /^x\s*-?\s*bar\s*-?\s*s$/.test(withoutChart) ||
    withoutChart === "xbar-s"
  ) {
    return "xbar-s";
  }
  if (["imr", "i-mr", "x-mr", "individuals mr"].includes(withoutChart)) {
    return "imr";
  }

  if (withoutChart === "p") return "p";
  if (withoutChart === "np" || withoutChart === "n p") return "np";
  if (withoutChart === "c") return "c";
  if (withoutChart === "u") return "u";
  return "";
};

const getSPCChartTypeLabel = (value) => {
  const type = normalizeSPCChartType(value) || String(value || "");
  const labels = {
    "xbar-r": "X-bar R",
    "xbar-s": "X-bar S",
    imr: "I-MR",
    p: "P-Chart",
    np: "NP-Chart",
    c: "C-Chart",
    u: "U-Chart",
  };
  return labels[type] || "SPC Chart";
};

const SPC_METHOD_FILTER_BY_CHART_TYPE = {
  "xbar-r": "X-bar R",
  "xbar-s": "X-bar S",
  imr: "I-MR",
  p: "P Chart",
  np: "NP Chart",
  c: "C Chart",
  u: "U Chart",
};

const getSPCMethodFilterForChartType = (chartType, availableMethods = []) => {
  const normalizedType = normalizeSPCChartType(chartType);
  const exactAvailableMethod = availableMethods.find(
    (method) => normalizeSPCChartType(method) === normalizedType,
  );
  return (
    exactAvailableMethod ||
    SPC_METHOD_FILTER_BY_CHART_TYPE[normalizedType] ||
    ""
  );
};

const getCheckpointSPCChartType = (checkpoint = {}) => {
  const latestInspection = checkpoint.inspections?.[0] || {};
  const explicitType = normalizeSPCChartType(
    checkpoint.spcMethod ||
      checkpoint.selectedSPCMethod ||
      checkpoint.controlChartType ||
      checkpoint.recommendedSPCMethod ||
      checkpoint.chart?.type ||
      checkpoint.spc?.chart?.type ||
      latestInspection.spcMethod ||
      latestInspection.selectedSPCMethod ||
      latestInspection.controlChartType ||
      latestInspection.measurement?.selectedSPCMethod ||
      latestInspection.measurement?.controlChartType,
  );
  if (explicitType) return explicitType;

  const resultType = String(checkpoint.resultType || "").toLowerCase();
  if (resultType === "numeric") {
    const subgroupSize = Number(
      checkpoint.subgroupSize || checkpoint.sampling?.subgroupSize || 1,
    );
    return subgroupSize > 1 ? "xbar-r" : "imr";
  }
  return "";
};

const isCheckpointCompatibleWithChart = (checkpoint = {}, chartType) => {
  if (
    !Array.isArray(checkpoint.inspections) ||
    checkpoint.inspections.length === 0
  ) {
    return false;
  }

  const requestedType = normalizeSPCChartType(chartType);
  const configuredType = getCheckpointSPCChartType(checkpoint);
  if (configuredType) return configuredType === requestedType;

  const resultType = String(checkpoint.resultType || "").toLowerCase();
  if (["xbar-r", "xbar-s", "imr"].includes(requestedType)) {
    return resultType === "numeric";
  }
  if (["p", "np"].includes(requestedType)) {
    return ["binary", "defective_count", "attribute"].includes(resultType);
  }
  if (["c", "u"].includes(requestedType)) {
    return resultType === "defect_count";
  }
  return false;
};

const getCheckpointChartOptionKey = (checkpoint = {}) => {
  const latestInspection = checkpoint.inspections?.[0] || {};
  const specification = checkpoint.specification || {};
  const normalizeIdentityPart = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  const normalizeNumberPart = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const number = Number(value);
    return Number.isFinite(number) ? String(number) : normalizeIdentityPart(value);
  };
  const checkpointName = normalizeIdentityPart(
    checkpoint.checkpointName ||
      checkpoint.name ||
      checkpoint.characteristic ||
      latestInspection.checkpointName,
  );
  const balloon = normalizeIdentityPart(
    checkpoint.balloonNumber || checkpoint.balloon || latestInspection.balloon,
  );
  const logicalCharacteristic =
    normalizeIdentityPart(checkpoint.logicalCharacteristicKey) ||
    [balloon && `balloon:${balloon}`, checkpointName && `name:${checkpointName}`]
      .filter(Boolean)
      .join("|") ||
    normalizeIdentityPart(
      checkpoint.checkpointId || checkpoint.characteristicId || checkpoint.name,
    );

  // Batch, inspection ID, date, inspector and generated checkpoint ID are
  // intentionally absent. They describe subgroups, not separate SPC streams.
  return JSON.stringify([
    checkpoint.companyId || latestInspection.companyId || checkpoint.companyName,
    checkpoint.itemId || latestInspection.itemId || checkpoint.itemName,
    checkpoint.drawingId ||
      latestInspection.drawingId ||
      checkpoint.drawingTitle ||
      latestInspection.drawingTitle,
    checkpoint.drawingRevision || latestInspection.drawingRevision,
    checkpoint.processId || latestInspection.processId || checkpoint.processName,
    logicalCharacteristic,
    normalizeNumberPart(specification.nominal ?? checkpoint.nominal),
    normalizeNumberPart(specification.lsl ?? checkpoint.lsl),
    normalizeNumberPart(specification.usl ?? checkpoint.usl),
    normalizeIdentityPart(specification.unit || checkpoint.unit),
    getCheckpointSPCChartType(checkpoint),
    checkpoint.machine || latestInspection.machine,
    checkpoint.line || latestInspection.line,
    checkpoint.cavity || latestInspection.cavity,
    checkpoint.toolNumber || latestInspection.toolNumber,
    checkpoint.subgroupSize ||
      checkpoint.sampling?.subgroupSizePlanned ||
      latestInspection.subgroupSizePlanned ||
      1,
  ].map(normalizeIdentityPart));
};

const mergeCheckpointChartOptions = (checkpoints = []) => {
  const grouped = new Map();

  checkpoints.forEach((checkpoint) => {
    const optionKey = getCheckpointChartOptionKey(checkpoint);
    const existing = grouped.get(optionKey);
    const checkpointIds = new Set(
      [
        ...(checkpoint.checkpointIds || []),
        checkpoint.checkpointId,
        checkpoint.characteristicId,
      ]
        .filter(Boolean)
        .map(String),
    );
    const spcStreamKeys = new Set(
      [
        ...(checkpoint.spcStreamKeys || []),
        checkpoint.spcStreamKey,
        checkpoint.streamKey,
      ]
        .filter(Boolean)
        .map(String),
    );
    const normalizedInspections = (checkpoint.inspections || []).map(
      (inspection) => ({
        ...inspection,
        checkpointId:
          inspection.checkpointId ||
          checkpoint.checkpointId ||
          checkpoint.characteristicId ||
          "",
        spcStreamKey:
          inspection.spcStreamKey ||
          checkpoint.spcStreamKey ||
          checkpoint.streamKey ||
          "",
      }),
    );
    if (!existing) {
      grouped.set(optionKey, {
        ...checkpoint,
        _chartOptionKey: optionKey,
        checkpointIds: Array.from(checkpointIds),
        spcStreamKeys: Array.from(spcStreamKeys),
        inspections: normalizedInspections,
      });
      return;
    }

    (existing.checkpointIds || []).forEach((value) => checkpointIds.add(String(value)));
    (existing.spcStreamKeys || []).forEach((value) => spcStreamKeys.add(String(value)));

    const inspectionsById = new Map();
    [...(existing.inspections || []), ...normalizedInspections].forEach(
      (inspection, index) => {
        const naturalInspectionKey = [
          inspection.inspectionRunId,
          inspection.date,
          inspection.timeSlot,
          inspection.batchNumber,
        ]
          .map((value) => String(value || "").trim())
          .join("|");
        const inspectionKey = String(
          inspection.inspectionId ||
            inspection._id ||
            (naturalInspectionKey.replaceAll("|", "")
              ? naturalInspectionKey
              : `unknown-inspection-${index}`),
        );
        inspectionsById.set(inspectionKey, inspection);
      },
    );

    grouped.set(optionKey, {
      ...existing,
      ...checkpoint,
      _chartOptionKey: optionKey,
      checkpointIds: Array.from(checkpointIds),
      spcStreamKeys: Array.from(spcStreamKeys),
      inspections: Array.from(inspectionsById.values()),
    });
  });

  return Array.from(grouped.values()).map((checkpoint) => {
    const inspections = [...(checkpoint.inspections || [])].sort(
      (a, b) =>
        new Date(b.collectedAt || b.date || 0).getTime() -
        new Date(a.collectedAt || a.date || 0).getTime(),
    );
    const latestInspection = inspections[0] || {};
    const statuses = inspections.map((inspection) => inspection.status);

    return {
      ...checkpoint,
      checkpointId:
        latestInspection.checkpointId || checkpoint.checkpointId || "",
      spcStreamKey:
        latestInspection.spcStreamKey || checkpoint.spcStreamKey || "",
      inspections,
      latestStatus: latestInspection.status || checkpoint.latestStatus,
      batchNumber: latestInspection.batchNumber || checkpoint.batchNumber,
      date: latestInspection.date || checkpoint.date,
      totalPassed: statuses.filter((status) => ["Pass", "OK"].includes(status))
        .length,
      totalFailed: statuses.filter((status) => status === "Fail").length,
      totalPending: statuses.filter((status) => status === "Pending").length,
    };
  });
};

const formatResultTypeLabel = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const unwrapNotificationDate = (value) => {
  if (!value) return null;
  if (typeof value === "object" && value.$date) return value.$date;
  return value;
};

const getNotificationTimestamp = (notification = {}) => {
  const rawValue = unwrapNotificationDate(
    notification.detectedAt ||
      notification.createdAt ||
      notification.updatedAt ||
      notification.collectedAt,
  );

  if (!rawValue) return 0;
  const timestamp = new Date(rawValue).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const formatNotificationTime = (notification = {}) => {
  const timestamp = getNotificationTimestamp(notification);
  if (!timestamp) return "Time unavailable";

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000),
  );
  if (elapsedSeconds < 60) return "Just now";

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min${elapsedMinutes === 1 ? "" : "s"} ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) {
    return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
  }

  return new Date(timestamp).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isFailureNotification = (notification = {}) => {
  const source = String(notification.source || "")
    .trim()
    .toUpperCase();
  const type = String(notification.type || "")
    .trim()
    .toLowerCase();
  const inspectionStatus = String(
    notification.inspectionStatus || notification.resultStatus || "",
  )
    .trim()
    .toLowerCase();

  return (
    ["SPECIFICATION_FAILURE", "INSPECTION_FAILURE"].includes(source) ||
    type === "failure" ||
    ["fail", "failed", "rejected", "ng"].includes(inspectionStatus)
  );
};

const normalizeDashboardNotifications = (notifications = []) => {
  const uniqueNotifications = new Map();

  (Array.isArray(notifications) ? notifications : []).forEach(
    (notification, index) => {
      if (!notification || typeof notification !== "object") return;

      const status = String(notification.status || "OPEN")
        .trim()
        .toUpperCase();
      const resolved =
        notification.resolved === true ||
        ["RESOLVED", "CLOSED", "DISMISSED"].includes(status);
      if (resolved) return;

      const rawChartPointIndex = notification.chartPointIndex;
      const chartPointIndex =
        rawChartPointIndex === null ||
        rawChartPointIndex === undefined ||
        rawChartPointIndex === ""
          ? Number.NaN
          : Number(rawChartPointIndex);
      const subgroupId = getReadableText(
        notification.subgroupId,
        notification.pointLabel,
      );
      const failureNotification = isFailureNotification(notification);

      // SPC notifications still represent red chart points. Failed inspection
      // notifications are also valid even when there is no control-chart point.
      if (
        !failureNotification &&
        !Number.isInteger(chartPointIndex) &&
        !subgroupId
      ) {
        return;
      }

      const id = String(
        notification.alertId ||
          notification.id ||
          `${notification.inspectionId || "inspection"}:${
            notification.checkpointId || "checkpoint"
          }:${notification.chartPanel || (failureNotification ? "failure" : "chart")}:${
            Number.isInteger(chartPointIndex) ? chartPointIndex : index
          }`,
      );

      if (uniqueNotifications.has(id)) return;

      const severity = String(
        notification.severity ||
          notification.type ||
          (failureNotification ? "Critical" : "Warning"),
      )
        .trim()
        .toLowerCase();
      const rules = Array.isArray(notification.rules) ? notification.rules : [];
      const ruleReason = rules
        .map((rule) =>
          getReadableText(rule?.message, rule?.ruleName, rule?.rule),
        )
        .filter(Boolean)
        .join("; ");
      const checkpointName = getReadableText(
        notification.checkpointName,
        "Checkpoint",
      );

      uniqueNotifications.set(id, {
        ...notification,
        id,
        alertId: id,
        severity,
        status,
        subgroupId,
        chartPointIndex: Number.isInteger(chartPointIndex)
          ? chartPointIndex
          : null,
        title:
          getReadableText(notification.title) ||
          (failureNotification
            ? `${checkpointName} inspection failed`
            : `${checkpointName} SPC signal`),
        description:
          getReadableText(
            notification.reason,
            ruleReason,
            notification.description,
          ) ||
          (failureNotification
            ? "Inspection result is outside specification"
            : "Control-chart signal detected"),
        time: formatNotificationTime(notification),
        timestamp: getNotificationTimestamp(notification),
        failureNotification,
      });
    },
  );

  return Array.from(uniqueNotifications.values()).sort(
    (left, right) => right.timestamp - left.timestamp,
  );
};

const buildDashboardNotificationSummary = (notifications = []) => {
  const normalized = normalizeDashboardNotifications(notifications);
  return {
    total: normalized.length,
    critical: normalized.filter((notification) =>
      ["critical", "high", "failure"].includes(
        String(notification.severity || "").toLowerCase(),
      ),
    ).length,
    warning: normalized.filter(
      (notification) =>
        !["critical", "high", "failure"].includes(
          String(notification.severity || "").toLowerCase(),
        ),
    ).length,
    provisional: normalized.filter(
      (notification) => notification.provisional === true,
    ).length,
    unacknowledged: normalized.filter(
      (notification) => notification.acknowledged !== true,
    ).length,
  };
};

const mergeDashboardNotifications = (current = [], incoming = []) =>
  normalizeDashboardNotifications([
    ...(Array.isArray(incoming) ? incoming : []),
    ...(Array.isArray(current) ? current : []),
  ]);

const extractRealtimeNotifications = (event = {}) => {
  const candidates = [
    event.notification,
    ...(Array.isArray(event.notifications) ? event.notifications : []),
    event.extra?.notification,
    ...(Array.isArray(event.extra?.notifications)
      ? event.extra.notifications
      : []),
    event.data?.notification,
    ...(Array.isArray(event.data?.notifications)
      ? event.data.notifications
      : []),
  ].filter(Boolean);

  return normalizeDashboardNotifications(candidates);
};

const getNotificationPresentation = (severity = "warning") => {
  const normalized = String(severity).toLowerCase();
  if (normalized === "critical" || normalized === "high") {
    return {
      Icon: AlertTriangle,
      color: "text-rose-600",
      bgColor: "bg-rose-50 border-rose-100",
      dotColor: "bg-rose-500 animate-pulse",
      label: "Critical",
    };
  }

  return {
    Icon: FileWarning,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-100",
    dotColor: "bg-amber-500",
    label: "Warning",
  };
};

const BaselineHistoryModal = ({ isOpen, onClose, baselines, loading }) => {
  if (!isOpen) return null;

  const formatLimit = (value) => formatNumber(value, 4);
  const getLimitGroups = (baseline) => {
    const isIMR = baseline.spcMethod === "I-MR";
    return isIMR
      ? [
          ["Individuals", baseline.limits?.individual],
          ["Moving range", baseline.limits?.movingRange],
        ]
      : [
          ["X-bar", baseline.limits?.xBar],
          ["Range", baseline.limits?.range],
        ];
  };

  return (
    <div className="fixed inset-0 z-[330] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Baseline History
              </h3>
              <p className="text-xs text-slate-500">
                {baselines.length} baseline{baselines.length !== 1 ? "s" : ""}{" "}
                found
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : baselines.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-slate-500">
                No baselines found for this SPC stream
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {baselines.map((baseline) => (
                <div
                  key={baseline._id || baseline.id}
                  className={`p-4 rounded-xl border ${
                    baseline.status === "APPROVED"
                      ? "border-green-200 bg-green-50"
                      : baseline.status === "REVIEW_REQUIRED"
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">
                        Version {baseline.version}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {baseline.status || "UNKNOWN"}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {baseline.spcMethod}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {baseline.controlMode}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {baseline.createdAt
                        ? new Date(baseline.createdAt).toLocaleString()
                        : "-"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Reason:</span>{" "}
                      <span className="font-medium">{baseline.reason}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Effective:</span>{" "}
                      <span className="font-medium">
                        {baseline.effectiveFrom}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Collected:</span>{" "}
                      <span className="font-medium">
                        {baseline.subgroupsCollected || 0}/
                        {baseline.minimumSubgroups || 20}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getLimitGroups(baseline).map(([label, limits]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <p className="text-xs font-semibold text-slate-700 mb-2">
                          {label}
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">CL</span>
                            <p className="font-semibold">
                              {formatLimit(limits?.center)}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">UCL</span>
                            <p className="font-semibold text-amber-700">
                              {formatLimit(limits?.ucl)}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">LCL</span>
                            <p className="font-semibold text-amber-700">
                              {formatLimit(limits?.lcl)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {baseline.reviewReason && (
                    <div className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-900">
                      {baseline.reviewReason}
                    </div>
                  )}
                  {baseline.remarks && (
                    <div className="mt-2 text-xs text-slate-500">
                      <span className="font-medium">Remarks:</span>{" "}
                      {baseline.remarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardNavbar = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  summary,
  notifications = [],
  onClose,
}) => {
  const navItems = [
    { id: "summary", label: "Summary", icon: LayoutDashboard },
    { id: "checkpoints", label: "Checkpoints", icon: Grid3x3 },
    { id: "charts", label: "Control Charts", icon: LineChart },
  ];

  const NOTIFICATION_READ_STORAGE_KEY = "spc-dashboard-read-notification-ids";

  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationRange, setNotificationRange] = useState("latest");
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    if (typeof window === "undefined") return [];

    try {
      const savedValue = window.localStorage.getItem(
        NOTIFICATION_READ_STORAGE_KEY,
      );
      const parsedValue = savedValue ? JSON.parse(savedValue) : [];
      return Array.isArray(parsedValue)
        ? parsedValue.map(String).filter(Boolean)
        : [];
    } catch (error) {
      console.warn("Unable to load notification read state", error);
      return [];
    }
  });
  const notificationRef = useRef(null);

  const notificationItems = useMemo(() => {
    const readIds = new Set(readNotificationIds);

    return normalizeDashboardNotifications(notifications).map(
      (notification) => ({
        ...notification,
        isRead:
          notification.isRead === true ||
          notification.read === true ||
          Boolean(notification.readAt) ||
          readIds.has(String(notification.id)),
      }),
    );
  }, [notifications, readNotificationIds]);

  const unreadNotificationCount = useMemo(
    () =>
      notificationItems.filter((notification) => !notification.isRead).length,
    [notificationItems],
  );

  const filteredNotificationItems = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (notificationRange === "week") {
      return notificationItems.filter(
        (notification) => notification.timestamp >= now - 7 * oneDay,
      );
    }

    if (notificationRange === "month") {
      return notificationItems.filter(
        (notification) => notification.timestamp >= now - 30 * oneDay,
      );
    }

    // "Latest" keeps the dropdown compact while still showing the newest
    // signals first. The full week/month views remain available in the filter.
    return notificationItems.slice(0, 10);
  }, [notificationItems, notificationRange]);

  const filteredUnreadCount = useMemo(
    () =>
      filteredNotificationItems.filter((notification) => !notification.isRead)
        .length,
    [filteredNotificationItems],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Keep the newest IDs only so local storage cannot grow indefinitely.
      window.localStorage.setItem(
        NOTIFICATION_READ_STORAGE_KEY,
        JSON.stringify(readNotificationIds.slice(-2000)),
      );
    } catch (error) {
      console.warn("Unable to save notification read state", error);
    }
  }, [readNotificationIds]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markNotificationAsRead = (notificationId) => {
    const normalizedId = String(notificationId || "").trim();
    if (!normalizedId) return;

    setReadNotificationIds((currentIds) =>
      currentIds.includes(normalizedId)
        ? currentIds
        : [...currentIds, normalizedId].slice(-2000),
    );
  };

  const markAllNotificationsAsRead = () => {
    const allNotificationIds = notificationItems.map((notification) =>
      String(notification.id),
    );

    setReadNotificationIds((currentIds) =>
      Array.from(new Set([...currentIds, ...allNotificationIds])).slice(-2000),
    );
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-lg shadow-slate-200/20 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur-md opacity-30"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg shadow-md shadow-blue-500/25">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent truncate">
                SPC Dashboard
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block truncate font-medium tracking-wide">
                Statistical Process Control • Real-time Monitoring
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-slate-50/50 p-1 rounded-xl border border-slate-200/50">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-out ${
                    activeTab === item.id
                      ? "bg-white text-slate-900 shadow-lg shadow-slate-200/50 scale-100"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  }`}
                >
                  {activeTab === item.id && (
                    <span className="absolute inset-0 rounded-lg bg-white shadow-sm -z-10"></span>
                  )}
                  <Icon
                    className={`h-4 w-4 transition-transform duration-200 ${
                      activeTab === item.id ? "scale-110" : ""
                    }`}
                  />
                  <span>{item.label}</span>
                  {activeTab === item.id && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {summary && (
              <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-slate-50/80 rounded-xl border border-slate-200/50">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></span>
                  <span className="text-xs font-medium text-slate-600">
                    {summary.totalPassed || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Passed
                  </span>
                </div>
                <div className="w-px h-4 bg-slate-200"></div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500 ring-2 ring-rose-500/20"></span>
                  <span className="text-xs font-medium text-slate-600">
                    {summary.totalFailed || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Failed
                  </span>
                </div>
                <div className="w-px h-4 bg-slate-200"></div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20"></span>
                  <span className="text-xs font-medium text-slate-600">
                    {summary.totalPending || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Pending
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1">
              <div ref={notificationRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications((current) => !current)}
                  className="relative p-2 rounded-xl hover:bg-slate-100/80 transition-all duration-200 group"
                  title={`${unreadNotificationCount} unread SPC signal notification${
                    unreadNotificationCount === 1 ? "" : "s"
                  }`}
                  aria-label="SPC signal notifications"
                  aria-expanded={showNotifications}
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 group-hover:text-slate-700 transition-colors" />

                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[18px] px-1.5 bg-gradient-to-r from-rose-500 to-red-500 text-white text-[10px] font-bold rounded-full shadow-lg shadow-rose-500/25 animate-pulse">
                      {unreadNotificationCount > 999
                        ? "999+"
                        : unreadNotificationCount}
                    </span>
                  )}

                  <span className="absolute inset-0 rounded-xl bg-slate-100/0 group-hover:bg-slate-100/50 -z-10 transition-all duration-200"></span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-[440px] max-h-[560px] overflow-y-auto bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200/80 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 py-3 rounded-t-2xl">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            SPC Signal Notifications
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {filteredNotificationItems.length} shown •{" "}
                            {unreadNotificationCount} unread
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNotifications(false)}
                          className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                          aria-label="Close notifications"
                        >
                          <X className="h-4 w-4 text-slate-400" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <select
                          value={notificationRange}
                          onChange={(event) =>
                            setNotificationRange(event.target.value)
                          }
                          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          aria-label="Filter notifications by date"
                        >
                          <option value="latest">Latest 10</option>
                          <option value="week">Last 7 days</option>
                          <option value="month">Last 30 days</option>
                        </select>

                        <button
                          type="button"
                          onClick={markAllNotificationsAsRead}
                          disabled={unreadNotificationCount === 0}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Mark every active notification as read"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </button>
                      </div>
                    </div>

                    <div className="p-2 space-y-1.5" aria-live="polite">
                      {filteredNotificationItems.length > 0 ? (
                        filteredNotificationItems.map((notification) => {
                          const presentation = getNotificationPresentation(
                            notification.severity,
                          );
                          const Icon = presentation.Icon;
                          const pointNumber =
                            Number.isInteger(notification.chartPointIndex) &&
                            notification.chartPointIndex >= 0
                              ? notification.chartPointIndex + 1
                              : null;
                          const value = finiteNumberOrNull(notification.value);
                          const unit = getReadableText(notification.unit);
                          const traceability = [
                            getReadableText(
                              notification.itemCode,
                              notification.itemName,
                            ),
                            getReadableText(notification.processName),
                            getReadableText(notification.subgroupId),
                          ]
                            .filter(Boolean)
                            .join(" • ");

                          return (
                            <div
                              key={notification.id}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition ${
                                notification.isRead
                                  ? "border-slate-200 bg-slate-50/70 opacity-75"
                                  : presentation.bgColor
                              }`}
                            >
                              <div
                                className={`flex-shrink-0 p-1.5 rounded-lg bg-white shadow-sm ${
                                  notification.isRead
                                    ? "text-slate-400"
                                    : presentation.color
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className={`text-sm font-semibold ${
                                      notification.isRead
                                        ? "text-slate-600"
                                        : "text-slate-800"
                                    }`}
                                  >
                                    {notification.title}
                                  </p>
                                  <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-slate-500 bg-white/80 border border-slate-200 rounded-full px-2 py-0.5">
                                    {notification.isRead
                                      ? "Read"
                                      : presentation.label}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600 mt-1 leading-5">
                                  {notification.description}
                                </p>

                                {traceability && (
                                  <p className="text-[10px] text-slate-500 mt-1.5 truncate">
                                    {traceability}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-slate-500">
                                  {pointNumber !== null && (
                                    <span>Chart point {pointNumber}</span>
                                  )}
                                  {value !== null && (
                                    <span>
                                      Value {formatNumber(value, 4)}
                                      {unit ? ` ${unit}` : ""}
                                    </span>
                                  )}
                                  {notification.provisional && (
                                    <span className="font-semibold text-amber-700">
                                      Trial limits
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    {notification.time}
                                  </p>

                                  {!notification.isRead && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        markNotificationAsRead(notification.id)
                                      }
                                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                    >
                                      <Check className="h-3 w-3" />
                                      Mark read
                                    </button>
                                  )}
                                </div>
                              </div>

                              {!notification.isRead && (
                                <span
                                  className={`flex-shrink-0 mt-1 inline-block w-2 h-2 rounded-full ${presentation.dotColor}`}
                                  title="Unread red chart signal"
                                ></span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 px-4">
                          <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-slate-600">
                            No notifications in this period
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Try selecting another notification date filter.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200/80 px-4 py-2.5 rounded-b-2xl">
                      <p className="text-[10px] text-center text-slate-400">
                        {filteredUnreadCount} unread in this view. Read status
                        is saved in this browser.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="relative p-2 rounded-xl hover:bg-slate-100/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                title="Refresh Data"
              >
                <RefreshCw
                  className={`h-4 w-4 sm:h-5 sm:w-5 text-slate-500 group-hover:text-slate-700 transition-colors ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                <span className="absolute inset-0 rounded-xl bg-slate-100/0 group-hover:bg-slate-100/50 -z-10 transition-all duration-200"></span>
              </button>

              <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

              <button
                onClick={onClose}
                className="relative p-2 rounded-xl hover:bg-rose-50 transition-all duration-200 group"
                title="Close Dashboard"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
                <span className="absolute inset-0 rounded-xl bg-rose-50/0 group-hover:bg-rose-50/50 -z-10 transition-all duration-200"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-sm px-2 py-1.5">
        <div className="flex justify-around items-center max-w-sm mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px] ${
                  activeTab === item.id
                    ? "text-blue-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div
                  className={`relative ${
                    activeTab === item.id ? "scale-110" : ""
                  } transition-transform duration-200`}
                >
                  <Icon className="h-5 w-5" />
                  {activeTab === item.id && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    activeTab === item.id ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

const ControlChart = ({
  chart,
  selectedSubgroup = "all",
  startDate = null,
  endDate = null,
  title = "Control Chart",
  chartType = "xbar-r",
  onCreateBaseline,
  onApproveBaseline,
  approvingBaseline = false,
  onViewBaselineHistory,
  initialVisiblePoints = 60,
}) => {
  const [showFullScreen, setShowFullScreen] = useState(false);

  if (!chart) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
        No control chart data available
      </div>
    );
  }

  const normalizedType =
    normalizeSPCChartType(chart.type || chartType) ||
    String(chart.type || chartType || "")
      .trim()
      .toLowerCase();
  const isIMR = normalizedType === "imr";
  const isAttributeChart = ["p", "np", "c", "u"].includes(normalizedType);
  const normalizedChart = chart.type
    ? chart
    : {
        ...chart,
        type: normalizedType || "xbar-r",
      };

  const statusText = String(chart.status || "Insufficient data");
  const subgroupCount =
    finiteNumberOrNull(chart.subgroupCount) ??
    finiteNumberOrNull(chart.readingCount) ??
    (isAttributeChart
      ? [
          chart.values,
          chart.pValues,
          chart.npValues,
          chart.cValues,
          chart.uValues,
          chart.sampleSizes,
          chart.labels,
        ].find(Array.isArray)?.length || 0
      : isIMR
        ? Array.isArray(chart.individualValues)
          ? chart.individualValues.length
          : 0
        : Array.isArray(chart.xbarValues)
          ? chart.xbarValues.length
          : 0);

  const candidateState = resolveBaselineCandidateState({ chart });
  const candidateStatus = candidateState.status;
  const candidateMinimum = candidateState.minimum;
  const candidateCollected = candidateState.collected;
  const hasPersistedCandidate = candidateState.hasPersistedCandidate;
  const trialReadyWithoutCandidate = candidateState.trialReadyWithoutCandidate;

  const hasOpenCandidate =
    hasPersistedCandidate &&
    ["COLLECTING", "REVIEW_REQUIRED"].includes(candidateStatus);

  const canApproveCandidate =
    hasPersistedCandidate &&
    (Boolean(chart.canApproveBaseline) || candidateState.canApprove);

  const mainOocCount = isAttributeChart
    ? (chart.oocIndexes || chart.outOfControlIndexes || []).length
    : isIMR
      ? (chart.individualOocIndexes || []).length
      : (chart.xbarOocIndexes || []).length;

  const secondaryOocCount = isAttributeChart
    ? 0
    : isIMR
      ? (chart.movingRangeOocIndexes || []).length
      : (chart.rangeOocIndexes || []).length;

  const totalOocCount = Array.isArray(chart.signalIndexes)
    ? new Set(
        chart.signalIndexes
          .map(Number)
          .filter((index) => Number.isInteger(index) && index >= 0),
      ).size
    : mainOocCount + secondaryOocCount;

  const candidateReviewReason = String(
    chart.candidateReviewReason || "",
  ).trim();
  const candidateTrialSignalCount = Math.max(
    0,
    Number(chart.candidateTrialSignalCount ?? totalOocCount) || 0,
  );

  const baselineStatus = String(chart.baselineStatus || "");
  const baselineStatusToken = baselineStatus.toUpperCase();
  const baselineApproved = baselineStatusToken === "APPROVED";
  const baselineBuilding = [
    "BUILDING_BASELINE",
    "AWAITING BASELINE",
    "COLLECTING",
  ].includes(baselineStatusToken);

  const chartContent = (
    <div className={`space-y-4 ${showFullScreen ? "min-h-full" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="min-w-0">
          <h4 className="truncate text-base font-bold text-slate-800">
            {title}
          </h4>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>
              {getSPCChartTypeLabel(normalizedType)} • n=
              {chart.subgroupSize ||
                chart.sampleSize ||
                (isIMR
                  ? 1
                  : chart.sampleSizeMode === "variable"
                    ? "variable"
                    : "-")}
            </span>

            <span>
              Status:{" "}
              <span
                className={`font-semibold ${
                  statusText === "Stable"
                    ? "text-emerald-600"
                    : statusText === "Unstable"
                      ? "text-rose-600"
                      : "text-amber-600"
                }`}
              >
                {statusText}
              </span>
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
              {subgroupCount || 0} {isIMR ? "reading(s)" : "subgroup(s)"}
            </span>

            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                totalOocCount > 0
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              OOC: {totalOocCount}
            </span>

            {baselineStatus && (
              <span className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    baselineApproved
                      ? "bg-emerald-500"
                      : baselineBuilding
                        ? "bg-amber-500"
                        : "bg-blue-500"
                  }`}
                />
                <span className="text-[10px] font-medium text-blue-700">
                  Baseline: {baselineStatus.replaceAll("_", " ")}
                  {chart.activeBaselineVersion
                    ? ` v${chart.activeBaselineVersion}`
                    : ""}
                </span>
              </span>
            )}

            {hasPersistedCandidate && candidateStatus && (
              <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5">
                {candidateStatus === "COLLECTING" && (
                  <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-600" />
                )}
                <span className="text-[10px] font-medium text-amber-700">
                  Candidate v{chart.candidateBaselineVersion || "-"}:{" "}
                  {candidateStatus.replaceAll("_", " ")} • {candidateCollected}/
                  {candidateMinimum}
                </span>
              </span>
            )}

            {trialReadyWithoutCandidate && (
              <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5">
                <AlertTriangle className="h-2.5 w-2.5 text-amber-600" />
                <span className="text-[10px] font-medium text-amber-700">
                  Trial limits ready — create baseline candidate
                </span>
              </span>
            )}

            {(chart.isFrozen || chart.limitsFrozen) && (
              <span className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5">
                <CheckCircle className="h-2.5 w-2.5 text-blue-600" />
                <span className="text-[10px] font-medium text-blue-700">
                  Limits frozen
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {onCreateBaseline && (
            <button
              type="button"
              onClick={onCreateBaseline}
              disabled={hasOpenCandidate || approvingBaseline}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              title={
                hasOpenCandidate
                  ? "Finish or approve the current baseline candidate first"
                  : trialReadyWithoutCandidate
                    ? "Create a persisted candidate from the ready trial limits"
                    : "Create a new baseline"
              }
            >
              <PlusCircle className="h-3 w-3" />
              {trialReadyWithoutCandidate ? "Create candidate" : "New baseline"}
            </button>
          )}

          {onApproveBaseline && canApproveCandidate && (
            <button
              type="button"
              onClick={onApproveBaseline}
              disabled={approvingBaseline}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              title="Approve and freeze the reviewed control limits"
            >
              {approvingBaseline ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              {approvingBaseline ? "Approving..." : "Approve baseline"}
            </button>
          )}

          {onApproveBaseline && candidateStatus === "COLLECTING" && (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-800"
              title={`Collect ${Math.max(
                0,
                candidateMinimum - candidateCollected,
              )} more complete ${isIMR ? "readings" : "subgroups"}`}
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Collecting {candidateCollected}/{candidateMinimum}
            </button>
          )}

          {onViewBaselineHistory && (
            <button
              type="button"
              onClick={onViewBaselineHistory}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-300"
              title="View baseline history"
            >
              <Clock className="h-3 w-3" />
              History
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowFullScreen((current) => !current)}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
            title={showFullScreen ? "Exit full screen" : "Open full screen"}
          >
            {showFullScreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {(candidateStatus === "REVIEW_REQUIRED" ||
        trialReadyWithoutCandidate) && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                Baseline review required
              </div>
              <p className="mt-1 text-xs leading-5 text-amber-900">
                Trial limits are ready from {candidateCollected} complete{" "}
                {isIMR ? "readings" : "subgroups"}.
                {trialReadyWithoutCandidate
                  ? " Create a persisted baseline candidate before approval."
                  : candidateTrialSignalCount > 0
                    ? ` ${candidateTrialSignalCount} control-chart signal${candidateTrialSignalCount === 1 ? "" : "s"} must be investigated before authorized approval.`
                    : " Review the trial limits before freezing them."}
              </p>
              {candidateReviewReason && (
                <p className="mt-1 text-xs font-medium text-amber-800">
                  {candidateReviewReason}
                </p>
              )}
            </div>
            {trialReadyWithoutCandidate && onCreateBaseline && (
              <button
                type="button"
                onClick={onCreateBaseline}
                disabled={approvingBaseline}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Create baseline candidate
              </button>
            )}
            {onApproveBaseline && canApproveCandidate && (
              <button
                type="button"
                onClick={onApproveBaseline}
                disabled={approvingBaseline}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {approvingBaseline ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5" />
                )}
                {approvingBaseline ? "Approving..." : "Review and approve"}
              </button>
            )}
          </div>
        </div>
      )}

      <CombinedSPCReportChart
        chart={normalizedChart}
        selectedSubgroup={selectedSubgroup}
        startDate={startDate}
        endDate={endDate}
        initialVisiblePoints={initialVisiblePoints}
      />
    </div>
  );

  if (showFullScreen) {
    return (
      <div className="fixed inset-0 z-[300] overflow-y-auto bg-slate-950/95 p-4 backdrop-blur-sm sm:p-6">
        <div className="mx-auto min-h-[92vh] max-w-7xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setShowFullScreen(false)}
              className="rounded-lg bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
              title="Exit full screen"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
          </div>
          {chartContent}
        </div>
      </div>
    );
  }

  return chartContent;
};

const CheckpointDetailsCard = ({ checkpoint, inspection }) => {
  if (!checkpoint) return null;

  const inspections = Array.isArray(checkpoint.inspections)
    ? checkpoint.inspections
    : [];
  const latestInspection = getLatestInspection(checkpoint, inspection);
  const inspectionPeriod = getInspectionPeriod(
    inspections.length > 0 ? inspections : [latestInspection],
  );

  const itemLabel =
    getReadableText(
      latestInspection.itemCode,
      latestInspection.itemNumber,
      latestInspection.partNumber,
      latestInspection.itemName,
      checkpoint.itemCode,
      checkpoint.itemNumber,
      checkpoint.itemName,
    ) || "N/A";
  const itemDescription =
    getReadableText(
      latestInspection.itemDescription,
      latestInspection.description,
      checkpoint.itemDescription,
    ) || "No description";
  const companyName =
    getReadableText(
      latestInspection.companyName,
      latestInspection.customerName,
      checkpoint.companyName,
    ) || "N/A";
  const processName =
    getReadableText(
      latestInspection.processName,
      latestInspection.operationName,
      checkpoint.processName,
    ) || "No process";
  const rawStatus = getReadableText(
    latestInspection.status,
    latestInspection.result,
    latestInspection.inspectionStatus,
    latestInspection.overallStatus,
    checkpoint.latestStatus,
  );
  const statusLabel = normalizeStatusLabel(rawStatus);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Item</p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {itemLabel}
            </p>
            <p className="text-xs text-slate-500 truncate max-w-[240px]">
              {itemDescription}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Building2 className="h-4 w-4 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Company / Process</p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {companyName}
            </p>
            <p className="text-xs text-slate-500 truncate">{processName}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Calendar className="h-4 w-4 text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Inspection Period</p>
            <p className="text-sm font-semibold text-slate-800">
              {inspectionPeriod}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusClasses(
                  rawStatus,
                )}`}
              >
                {statusLabel}
              </span>
              <span className="text-[10px] text-slate-500">
                {inspections.length || 1} inspection
                {(inspections.length || 1) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-slate-500">Specification:</span>
          <span className="ml-1 font-medium text-slate-700">
            {checkpoint.specification?.display ||
              `${checkpoint.nominal || ""} ${checkpoint.tolerance || ""} ${checkpoint.unit || ""}`.trim() ||
              "N/A"}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Unit:</span>
          <span className="ml-1 font-medium text-slate-700">
            {checkpoint.unit || "N/A"}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Result Type:</span>
          <span className="ml-1 font-medium text-slate-700">
            {checkpoint.resultType || "N/A"}
          </span>
        </div>
        <div>
          <span className="text-slate-500">SPC Method:</span>
          <span className="ml-1 font-medium text-slate-700">
            {checkpoint.spcMethod || "X-bar R"}
          </span>
        </div>
      </div>
    </div>
  );
};

const BASELINE_REASONS = [
  "Machine Change",
  "Tool Change",
  "Material Change",
  "Process Improvement",
  "Operator Change",
  "Customer Requirement",
  "Other",
];

const SubgroupFilter = ({
  subgroups = [],
  selectedSubgroup = "all",
  onSelect,
  chartType,
  onChartTypeChange,
}) => {
  const safeSubgroups = Array.isArray(subgroups) ? subgroups : [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" />
          <span className="text-xs sm:text-sm font-medium text-slate-700">
            Chart:
          </span>
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onChartTypeChange?.("xbar-r")}
            className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition ${
              chartType === "xbar-r"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              X-bar R
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChartTypeChange?.("imr")}
            className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition ${
              chartType === "imr"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <LineChart className="h-3 w-3 sm:h-4 sm:w-4" />
              I-MR
            </div>
          </button>
        </div>

        <div className="hidden sm:block w-px h-6 bg-slate-200" />

        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" />
          <label
            htmlFor="spc-subgroup-filter"
            className="text-xs sm:text-sm font-medium text-slate-700"
          >
            Subgroup:
          </label>
        </div>

        <select
          id="spc-subgroup-filter"
          value={selectedSubgroup}
          onChange={(event) => onSelect?.(event.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-[160px] sm:max-w-none"
        >
          <option value="all">All Subgroups</option>
          {safeSubgroups.slice(0, 50).map((subgroup, index) => {
            const value = String(subgroup?.value ?? index);
            const label = getReadableText(subgroup?.label) || `SG-${index + 1}`;

            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
          {safeSubgroups.length > 50 && (
            <option value="all" disabled>
              + {safeSubgroups.length - 50} more available in chart navigation
            </option>
          )}
        </select>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500">
          <span className="bg-blue-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
            {safeSubgroups.length} Subgroups
          </span>
        </div>
      </div>
    </div>
  );
};

const CreateBaselineModal = ({
  isOpen,
  onClose,
  chart,
  checkpoint,
  onSubmit,
  isSubmitting,
}) => {
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [limitMode, setLimitMode] = useState("auto");
  const [mainCenter, setMainCenter] = useState("");
  const [mainUcl, setMainUcl] = useState("");
  const [mainLcl, setMainLcl] = useState("");
  const [variationCenter, setVariationCenter] = useState("");
  const [variationUcl, setVariationUcl] = useState("");
  const [variationLcl, setVariationLcl] = useState("0");
  const [minimumSubgroups, setMinimumSubgroups] = useState("20");

  const isIMR = chart?.type === "imr";
  const availableSubgroups = Number(
    chart?.subgroupCount ?? chart?.labels?.length ?? 0,
  );

  useEffect(() => {
    if (!isOpen) return;
    setReason("");
    setRemarks("");
    setLimitMode("auto");
    setMainCenter(
      String(
        isIMR ? (chart?.individualCenter ?? "") : (chart?.xbarCenterLine ?? ""),
      ),
    );
    setMainUcl(
      String(isIMR ? (chart?.individualUcl ?? "") : (chart?.xbarUcl ?? "")),
    );
    setMainLcl(
      String(isIMR ? (chart?.individualLcl ?? "") : (chart?.xbarLcl ?? "")),
    );
    setVariationCenter(
      String(
        isIMR
          ? (chart?.movingRangeCenter ?? "")
          : (chart?.rangeCenterLine ?? ""),
      ),
    );
    setVariationUcl(
      String(isIMR ? (chart?.movingRangeUcl ?? "") : (chart?.rangeUcl ?? "")),
    );
    setVariationLcl(
      String(isIMR ? (chart?.movingRangeLcl ?? 0) : (chart?.rangeLcl ?? 0)),
    );
    setMinimumSubgroups("20");
  }, [isOpen, chart, isIMR, availableSubgroups]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!reason) return toast.error("Reason is required");
    if (reason === "Other" && !remarks.trim()) {
      return toast.error("Remarks are required when reason is Other");
    }

    const minGroups = Number(minimumSubgroups);
    if (!Number.isInteger(minGroups) || minGroups < 2 || minGroups > 500) {
      return toast.error("Minimum subgroups must be an integer from 2 to 500");
    }
    let limits = null;
    if (limitMode === "manual") {
      const values = [
        mainCenter,
        mainUcl,
        mainLcl,
        variationCenter,
        variationUcl,
        variationLcl,
      ].map(Number);
      if (!values.every(Number.isFinite)) {
        return toast.error("Enter complete numeric limits for both charts");
      }
      if (!(values[1] > values[0] && values[0] > values[2])) {
        return toast.error("Main limits must satisfy UCL > CL > LCL");
      }
      if (values[3] < 0 || values[4] < values[3] || values[5] < 0) {
        return toast.error("Variation limits must satisfy UCL ≥ CL ≥ LCL ≥ 0");
      }
      limits = isIMR
        ? {
            individual: { center: values[0], ucl: values[1], lcl: values[2] },
            movingRange: { center: values[3], ucl: values[4], lcl: values[5] },
          }
        : {
            xBar: { center: values[0], ucl: values[1], lcl: values[2] },
            range: { center: values[3], ucl: values[4], lcl: values[5] },
          };
    }

    await onSubmit({
      reason,
      remarks: remarks.trim(),
      limitMode,
      limits,
      minimumSubgroups: minGroups,
    });
  };

  const limitInput = (label, value, setter) => (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(event) => setter(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
      <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Create New Baseline
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {checkpoint?.checkpointName || "Selected checkpoint"} •{" "}
              {isIMR ? "I-MR" : "X-bar R"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select reason</option>
              {BASELINE_REASONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {(reason === "Other" || remarks) && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Remarks{" "}
                {reason === "Other" && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                rows={3}
                placeholder="Describe the process change"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Control Limit Mode
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                [
                  "auto",
                  "Auto Calculate",
                  "Use every complete eligible subgroup in this exact SPC stream and calculate chart-specific trial limits.",
                ],
                [
                  "manual",
                  "Manual Limits",
                  "Enter complete limits for both chart panels.",
                ],
              ].map(([value, label, help]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-xl border p-3 ${limitMode === value ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}
                >
                  <input
                    type="radio"
                    name="limitMode"
                    value={value}
                    checked={limitMode === value}
                    onChange={() => setLimitMode(value)}
                    className="mr-2"
                  />
                  <span className="text-sm font-semibold">{label}</span>
                  <p className="mt-1 pl-5 text-xs text-slate-500">{help}</p>
                </label>
              ))}
            </div>
          </div>

          {limitMode === "auto" && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Minimum complete {isIMR ? "readings" : "subgroups"}
              </label>
              <input
                type="number"
                min="2"
                max="500"
                value={minimumSubgroups}
                onChange={(event) => setMinimumSubgroups(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-500">
                When enough complete data is collected, trial limits move to
                Review Required. Use Approve Baseline to freeze them after
                review.
              </p>
            </div>
          )}

          {limitMode === "manual" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-bold text-slate-800">
                  {isIMR ? "Individuals chart" : "X-bar chart"}
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {limitInput("Center line", mainCenter, setMainCenter)}
                  {limitInput("UCL", mainUcl, setMainUcl)}
                  {limitInput("LCL", mainLcl, setMainLcl)}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-bold text-slate-800">
                  {isIMR ? "Moving-range chart" : "Range chart"}
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {limitInput(
                    "Center line",
                    variationCenter,
                    setVariationCenter,
                  )}
                  {limitInput("UCL", variationUcl, setVariationUcl)}
                  {limitInput("LCL", variationLcl, setVariationLcl)}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <p className="font-semibold">Automatic Phase-I baseline source</p>
            <p className="mt-1 text-xs leading-5">
              The system uses every complete eligible subgroup currently
              available in the exact company, item, process, checkpoint,
              machine, line, cavity, tool and drawing-revision stream.
              Incomplete or wrong-size subgroups are excluded automatically.
            </p>
            <p className="mt-2 text-xs font-medium">
              Available complete chart points: {availableSubgroups}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Historical limits are preserved.</p>
            <p className="mt-1 text-xs leading-5">
              Approved limits are frozen and versioned. A later re-baseline
              creates a new version and retires the previous active version
              without rewriting its historical audit record.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              Create Baseline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SPCDashboard = ({ isOpen, onClose }) => {
  const { isConnected, lastSPCEvent, subscribeCompany, subscribeStream } =
    useSocket();
  const liveRefreshTimerRef = useRef(null);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const seenLiveEventsRef = useRef(new Set());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [chartType, setChartType] = useState("");
  const [chartTypeSelectedByUser, setChartTypeSelectedByUser] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedInspections, setSelectedInspections] = useState([]);
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [creatingBaseline, setCreatingBaseline] = useState(false);
  const [approvingBaseline, setApprovingBaseline] = useState(false);

  const [showBaselineHistory, setShowBaselineHistory] = useState(false);
  const [baselineHistory, setBaselineHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [checkpointSearchTerm, setCheckpointSearchTerm] = useState("");
  const [activeCompanyTab, setActiveCompanyTab] = useState("company");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [filters, setFilters] = useState(DEFAULT_DASHBOARD_FILTERS);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
  });

  const [chartFilters, setChartFilters] = useState(DEFAULT_CHART_FILTERS);
  const effectiveChartType = chartTypeSelectedByUser ? chartType : "";

  const activeChartDateRange = useMemo(() => {
    const responseRange =
      data?.config?.dateRange || data?.summary?.dateRange || {};
    const inspectionDates = (selectedCheckpoint?.inspections || [])
      .map((inspection) =>
        normalizeDateOnly(
          inspection.date || inspection.timestamp || inspection.createdAt,
        ),
      )
      .filter(Boolean)
      .sort();

    const from = normalizeDateOnly(
      responseRange.from ||
        (filters.timeRange === "custom" ? filters.fromDate : "") ||
        inspectionDates[0],
    );
    const to = normalizeDateOnly(
      responseRange.to ||
        (filters.timeRange === "custom" ? filters.toDate : "") ||
        inspectionDates[inspectionDates.length - 1],
    );

    return {
      from,
      to,
      startDate: toBoundaryDate(from, false),
      endDate: toBoundaryDate(to, true),
    };
  }, [
    data?.config?.dateRange?.from,
    data?.config?.dateRange?.to,
    data?.summary?.dateRange?.from,
    data?.summary?.dateRange?.to,
    filters.timeRange,
    filters.fromDate,
    filters.toDate,
    selectedCheckpoint,
  ]);

  const [showFilters, setShowFilters] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedSubgroup, setSelectedSubgroup] = useState("all");

  const dashboardCompanyIds = useMemo(() => {
    const companyIds = new Set();

    (data?.checkpoints || []).forEach((checkpoint) => {
      if (checkpoint.companyId) companyIds.add(String(checkpoint.companyId));
      (checkpoint.inspections || []).forEach((inspection) => {
        if (inspection.companyId) companyIds.add(String(inspection.companyId));
      });
    });

    // When a company filter is active, join it even before rows are loaded.
    if (filters.companyId) companyIds.add(String(filters.companyId));

    return Array.from(companyIds).filter(Boolean).sort();
  }, [data, filters.companyId]);

  const selectedSPCStreamKeys = useMemo(() => {
    const streamKeys = new Set();

    (selectedCheckpoint?.spcStreamKeys || []).forEach((spcStreamKey) => {
      if (spcStreamKey) streamKeys.add(String(spcStreamKey));
    });
    if (selectedCheckpoint?.spcStreamKey) {
      streamKeys.add(String(selectedCheckpoint.spcStreamKey));
    }
    if (chartData?.spcStreamKey) {
      streamKeys.add(String(chartData.spcStreamKey));
    }
    if (chartData?.chart?.spcStreamKey) {
      streamKeys.add(String(chartData.chart.spcStreamKey));
    }
    (selectedCheckpoint?.inspections || []).forEach((inspection) => {
      if (inspection.spcStreamKey) {
        streamKeys.add(String(inspection.spcStreamKey));
      }
    });

    return Array.from(streamKeys).filter(Boolean).sort();
  }, [selectedCheckpoint, chartData]);

  useEffect(() => {
    if (!isOpen || !isConnected || dashboardCompanyIds.length === 0) {
      return undefined;
    }

    const cleanups = dashboardCompanyIds.map((companyId) =>
      subscribeCompany(companyId),
    );

    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, [isOpen, isConnected, dashboardCompanyIds.join("|"), subscribeCompany]);

  useEffect(() => {
    if (!isOpen || !isConnected || selectedSPCStreamKeys.length === 0) {
      return undefined;
    }

    const cleanups = selectedSPCStreamKeys.map((spcStreamKey) =>
      subscribeStream(spcStreamKey),
    );

    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, [isOpen, isConnected, selectedSPCStreamKeys.join("|"), subscribeStream]);

  useEffect(() => {
    if (isOpen) {
      fetchAllSPCData(1);
    }
  }, [isOpen]);

  useEffect(() => {
    setChartType("");
    setChartTypeSelectedByUser(false);
    setCheckpointSearchTerm("");
    setSelectedCheckpoint(null);
    setSelectedInspections([]);
    setSelectedSubgroup("all");
    setChartData(null);
    setShowChartModal(false);
  }, [isOpen]);

  const fetchAllSPCData = async (page = 1, options = {}) => {
    if (!isOpen) return null;

    const effectiveFilters = options.filters || filters;
    const silent = options.silent === true;

    if (!silent) setLoading(true);

    try {
      const params = new URLSearchParams();

      Object.entries({
        ...effectiveFilters,
        page,
        limit: effectiveFilters.limit,
        includeHistorical: "true",
      }).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          params.set(key, String(value));
        }
      });

      const response = await axios.get(
        `${API_URL}/qc-inspection/spc-all-data?${params.toString()}`,
        {
          withCredentials: true,
          timeout: 100000,
        },
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to load SPC data");
      }

      const nextData = response.data?.data;

      if (
        !nextData ||
        Array.isArray(nextData) ||
        !Array.isArray(nextData.checkpoints) ||
        !nextData.pagination
      ) {
        console.error("Unexpected SPC dashboard response:", response.data);
        throw new Error(
          "Invalid SPC dashboard response: checkpoints and pagination are required",
        );
      }

      setData(nextData);
      setPagination(nextData.pagination);

      return nextData;
    } catch (error) {
      console.error("Failed to load SPC dashboard:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load SPC data",
      );
      return null;
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchControlChart = async (
    checkpoint,
    inspectionIdsOverride = null,
  ) => {
    if (!isOpen) return;

    const allInspectionIds = (checkpoint.inspections || [])
      .map((inspection) => String(inspection.inspectionId || ""))
      .filter(Boolean);

    const selectedIds = (
      Array.isArray(inspectionIdsOverride)
        ? inspectionIdsOverride
        : allInspectionIds
    )
      .map((inspectionId) => String(inspectionId || ""))
      .filter(Boolean);

    const responseDateRange =
      data?.config?.dateRange || data?.summary?.dateRange || {};
    const inspectionDateValues = (checkpoint.inspections || [])
      .map((inspection) =>
        normalizeDateOnly(
          inspection.date || inspection.timestamp || inspection.createdAt,
        ),
      )
      .filter(Boolean)
      .sort();
    const derivedFromDate = inspectionDateValues[0] || "";
    const derivedToDate =
      inspectionDateValues[inspectionDateValues.length - 1] || "";
    const effectiveFromDate = normalizeDateOnly(
      responseDateRange.from ||
        (filters.timeRange === "custom" ? filters.fromDate : "") ||
        derivedFromDate,
    );
    const effectiveToDate = normalizeDateOnly(
      responseDateRange.to ||
        (filters.timeRange === "custom" ? filters.toDate : "") ||
        derivedToDate,
    );

    setChartLoading(true);
    try {
      const anchorInspection = checkpoint.inspections?.[0] || {};
      const inspectionId = anchorInspection.inspectionId;
      const anchorCheckpointId =
        anchorInspection.checkpointId || checkpoint.checkpointId;

      if (!inspectionId || !anchorCheckpointId) {
        toast.error("No inspection data available for this checkpoint");
        setChartLoading(false);
        return;
      }

      const requestedHistoryLimit = Math.min(
        5000,
        Math.max(2, Number(filters.historyLimit) || 500),
      );

      const params = new URLSearchParams({
        historyLimit: String(requestedHistoryLimit),
      });

      // Keep the control-chart stream inside exactly the same period shown in
      // Selected Inspections. This avoids a dashboard count such as 360 while
      // the chart silently reloads 368 historical subgroups.
      if (effectiveFromDate) params.set("fromDate", effectiveFromDate);
      if (effectiveToDate) params.set("toDate", effectiveToDate);

      const isAllSelected =
        selectedIds.length === allInspectionIds.length &&
        allInspectionIds.every((inspectionId) =>
          selectedIds.includes(inspectionId),
        );

      // Avoid sending hundreds of IDs through the GET URL when the complete
      // filtered range is selected. The backend already resolves the stream.
      if (selectedIds.length > 0 && !isAllSelected) {
        params.set("inspectionIds", selectedIds.join(","));
      }
      if (checkpoint.logicalCharacteristicKey) {
        params.set(
          "logicalCharacteristicKey",
          checkpoint.logicalCharacteristicKey,
        );
      }

      const response = await axios.get(
        `${API_URL}/qc-inspection/${inspectionId}/${encodeURIComponent(anchorCheckpointId)}/control-chart?${params.toString()}`,
        { withCredentials: true, timeout: 100000 },
      );

      if (response.data?.success) {
        const payload = response.data.data;
        const resolvedCandidate = resolveBaselineCandidateState(payload);
        const normalizedCandidate = payload.candidateBaseline
          ? {
              ...payload.candidateBaseline,
              subgroupsCollected: resolvedCandidate.collected,
              minimumSubgroups: resolvedCandidate.minimum,
            }
          : payload.candidateBaseline;

        setChartData({
          ...payload,
          candidateBaseline: normalizedCandidate,
          chart: payload.chart
            ? {
                ...payload.chart,
                activeBaselineId:
                  payload.activeBaseline?.id ||
                  payload.chart.activeBaselineId ||
                  null,
                activeBaselineVersion:
                  payload.activeBaseline?.version ||
                  payload.chart.activeBaselineVersion ||
                  null,
                candidateBaselineStatus:
                  payload.candidateBaseline?.status ||
                  payload.chart.candidateBaselineStatus ||
                  null,
                candidateBaselineVersion:
                  payload.candidateBaseline?.version ||
                  payload.chart.candidateBaselineVersion ||
                  null,
                candidateBaselineId:
                  payload.candidateBaseline?.id ||
                  payload.chart.candidateBaselineId ||
                  null,
                candidateReviewReason:
                  payload.candidateBaseline?.reviewReason ||
                  payload.chart.candidateReviewReason ||
                  "",
                candidateTrialSignalCount:
                  payload.candidateBaseline?.trialSignalCount ??
                  payload.chart.candidateTrialSignalCount ??
                  0,
                canApproveBaseline:
                  Boolean(payload.chart.canApproveBaseline) ||
                  resolvedCandidate.canApprove,
                controlMode:
                  payload.candidateBaseline?.controlMode ||
                  payload.activeBaseline?.controlMode ||
                  payload.chart.controlMode ||
                  null,
                subgroupsCollected: resolvedCandidate.collected,
                minimumSubgroups: resolvedCandidate.minimum,
              }
            : null,
        });
        setShowChartModal(true);
      } else {
        throw new Error(response.data?.message || "Failed to load chart data");
      }
    } catch (error) {
      console.error("Failed to load control chart:", error);

      try {
        const itemId = checkpoint.inspections?.[0]?.itemId;
        if (itemId) {
          const reportResponse = await axios.get(
            `${API_URL}/qc-inspection/spc/report/${itemId}`,
            {
              params: {
                historyLimit: Math.min(
                  5000,
                  Math.max(2, Number(filters.historyLimit) || 500),
                ),
                ...(selectedIds.length > 0
                  ? { inspectionIds: selectedIds.join(",") }
                  : {}),
                ...(effectiveFromDate ? { fromDate: effectiveFromDate } : {}),
                ...(effectiveToDate ? { toDate: effectiveToDate } : {}),
              },
              withCredentials: true,
              timeout: 30000,
            },
          );

          if (reportResponse.data?.success) {
            const reportData = reportResponse.data.data;
            const checkpointData = reportData.checkpoints?.find(
              (c) => c.checkpointId === checkpoint.checkpointId,
            );

            if (checkpointData?.spc?.chart) {
              setChartData({ chart: checkpointData.spc.chart });
              setShowChartModal(true);
            } else {
              toast.error("No chart data available for this checkpoint");
            }
          } else {
            toast.error("Failed to load chart data");
          }
        } else {
          toast.error("No inspection data available");
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        toast.error("Unable to load control chart data");
      }
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !lastSPCEvent) return undefined;

    const eventKey =
      lastSPCEvent.eventId ||
      `${lastSPCEvent.eventName || "spc"}:${lastSPCEvent.receivedAt || ""}`;

    if (seenLiveEventsRef.current.has(eventKey)) return undefined;
    seenLiveEventsRef.current.add(eventKey);
    if (seenLiveEventsRef.current.size > 250) {
      const oldest = seenLiveEventsRef.current.values().next().value;
      seenLiveEventsRef.current.delete(oldest);
    }

    // Display socket-delivered failures immediately. The API refresh below is
    // still the source of truth and reconciles the complete dashboard state.
    const realtimeNotifications = extractRealtimeNotifications(lastSPCEvent);
    if (realtimeNotifications.length > 0) {
      setData((currentData) => {
        if (!currentData) return currentData;
        const mergedNotifications = mergeDashboardNotifications(
          currentData.notifications,
          realtimeNotifications,
        );
        return {
          ...currentData,
          notifications: mergedNotifications,
          notificationSummary:
            buildDashboardNotificationSummary(mergedNotifications),
        };
      });
    }

    if (liveRefreshTimerRef.current) {
      window.clearTimeout(liveRefreshTimerRef.current);
    }

    liveRefreshTimerRef.current = window.setTimeout(async () => {
      setRefreshing(true);
      const refreshedData = await fetchAllSPCData(filters.page, {
        silent: true,
      });

      if (!refreshedData || !selectedCheckpoint || !chartData?.chart) return;

      const eventCheckpointIds = new Set(
        (lastSPCEvent.checkpointIds || []).map(String),
      );
      const eventStreamKeys = new Set(
        [...(lastSPCEvent.spcStreamKeys || []), lastSPCEvent.spcStreamKey]
          .filter(Boolean)
          .map(String),
      );

      const currentCheckpointId = String(selectedCheckpoint.checkpointId || "");
      const currentStreamKey = String(
        selectedCheckpoint.spcStreamKey ||
          chartData?.spcStreamKey ||
          chartData?.chart?.spcStreamKey ||
          "",
      );

      const eventHasScope =
        eventCheckpointIds.size > 0 || eventStreamKeys.size > 0;
      const affectsOpenChart =
        !eventHasScope ||
        eventCheckpointIds.has(currentCheckpointId) ||
        (currentStreamKey && eventStreamKeys.has(currentStreamKey));

      if (!affectsOpenChart) return;

      const refreshedCheckpoint = (refreshedData.checkpoints || []).find(
        (checkpoint) => {
          if (
            currentStreamKey &&
            String(checkpoint.spcStreamKey || "") === currentStreamKey
          ) {
            return true;
          }

          return (
            String(checkpoint.checkpointId || "") === currentCheckpointId &&
            String(
              checkpoint.itemId || checkpoint.inspections?.[0]?.itemId || "",
            ) ===
              String(
                selectedCheckpoint.itemId ||
                  selectedCheckpoint.inspections?.[0]?.itemId ||
                  "",
              ) &&
            String(
              checkpoint.processId ||
                checkpoint.inspections?.[0]?.processId ||
                "",
            ) ===
              String(
                selectedCheckpoint.processId ||
                  selectedCheckpoint.inspections?.[0]?.processId ||
                  "",
              )
          );
        },
      );

      if (!refreshedCheckpoint) return;

      const previousIds = (selectedCheckpoint.inspections || [])
        .map((inspection) => inspection.inspectionId)
        .filter(Boolean);
      const wasFollowingAllInspections =
        selectedInspections.length === previousIds.length &&
        previousIds.every((inspectionId) =>
          selectedInspections.includes(inspectionId),
        );

      const nextSelectedIds = wasFollowingAllInspections
        ? (refreshedCheckpoint.inspections || [])
            .map((inspection) => inspection.inspectionId)
            .filter(Boolean)
        : selectedInspections;

      setSelectedCheckpoint(refreshedCheckpoint);
      setSelectedInspections(nextSelectedIds);
      await fetchControlChart(refreshedCheckpoint, nextSelectedIds);
    }, 75);

    return () => {
      if (liveRefreshTimerRef.current) {
        window.clearTimeout(liveRefreshTimerRef.current);
      }
    };
  }, [isOpen, lastSPCEvent?.eventId, lastSPCEvent?.receivedAt]);

  const fetchBaselineHistory = async (checkpoint) => {
    const inspectionId = checkpoint?.inspections?.[0]?.inspectionId;
    if (!checkpoint?.checkpointId || !inspectionId) {
      toast.error("Inspection context is required for baseline history");
      return;
    }

    setLoadingHistory(true);
    try {
      const response = await axios.get(
        `${API_URL}/qc-inspection/spc/checkpoint/${checkpoint.checkpointId}/baselines`,
        {
          params: { inspectionId },
          withCredentials: true,
        },
      );
      if (response.data?.success) {
        setBaselineHistory(response.data.data || []);
        setShowBaselineHistory(true);
      } else {
        toast.error("Failed to fetch baseline history");
      }
    } catch (error) {
      console.error("Failed to fetch baseline history:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch baseline history",
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateBaseline = async (payload) => {
    const inspectionId = selectedCheckpoint?.inspections?.[0]?.inspectionId;
    const checkpointId = selectedCheckpoint?.checkpointId;

    if (!inspectionId || !checkpointId) {
      toast.error("Inspection or checkpoint is missing");
      return;
    }

    setCreatingBaseline(true);
    try {
      const response = await axios.post(
        `${API_URL}/qc-inspection/${inspectionId}/spc/checkpoint/${checkpointId}/baseline/create`,
        payload,
        {
          withCredentials: true,
          timeout: 100000,
        },
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to create baseline");
      }

      const baselineData = response.data.data;

      // Show detailed success message
      toast.success(
        `Baseline v${baselineData.version} ${baselineData.status?.toLowerCase() || "created"} for "${selectedCheckpoint.checkpointName}"`,
        { duration: 5000 },
      );

      setShowBaselineModal(false);
      setSelectedSubgroup("all");

      // Refresh the chart and dashboard
      await fetchControlChart(selectedCheckpoint, selectedInspections);
      await fetchAllSPCData(filters.page);
    } catch (error) {
      console.error("Failed to create SPC baseline:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create SPC baseline",
      );
    } finally {
      setCreatingBaseline(false);
    }
  };

  const handleApproveBaseline = async ({
    force = false,
    approvalReason = null,
  } = {}) => {
    const inspectionId = selectedCheckpoint?.inspections?.[0]?.inspectionId;
    const checkpointId = selectedCheckpoint?.checkpointId;

    if (!inspectionId || !checkpointId) {
      toast.error("Inspection or checkpoint is missing");
      return;
    }

    const {
      candidate,
      chart,
      candidateId,
      hasPersistedCandidate,
      trialReadyWithoutCandidate,
      status: candidateStatus,
      collected,
      minimum,
      controlMode,
    } = resolveBaselineCandidateState(chartData || {});

    if (!hasPersistedCandidate) {
      if (trialReadyWithoutCandidate) {
        toast.error(
          "Trial limits are ready, but no baseline candidate exists in the database. Create the baseline candidate first.",
        );
        setShowBaselineModal(true);
      } else {
        toast.error("No baseline candidate is waiting for approval");
      }
      return;
    }

    if (!["COLLECTING", "REVIEW_REQUIRED"].includes(candidateStatus)) {
      console.error("Baseline candidate status could not be resolved", {
        candidateBaseline: chartData?.candidateBaseline || null,
        candidateBaselineStatus:
          chartData?.chart?.candidateBaselineStatus || null,
        baselineStatus: chartData?.chart?.baselineStatus || null,
        resolvedStatus: candidateStatus,
        chartData,
      });
      toast.error(
        `No baseline candidate is waiting for approval${
          candidateStatus
            ? ` (status: ${candidateStatus.replaceAll("_", " ")})`
            : ""
        }`,
      );
      return;
    }

    /*
     * Only block an actively COLLECTING candidate in the browser. A candidate
     * that is already REVIEW_REQUIRED has trial limits ready and must be sent
     * to the backend, where the complete subgroup count and limits are
     * recalculated and validated authoritatively before approval.
     */
    if (
      controlMode === "auto" &&
      candidateStatus === "COLLECTING" &&
      collected < minimum
    ) {
      toast.error(
        `Baseline is not ready: ${collected}/${minimum} complete ${
          chart.type === "imr" ? "readings" : "subgroups"
        }.`,
      );
      return;
    }

    let reason = approvalReason;
    if (reason === null) {
      reason = window.prompt(
        "Enter the documented baseline review/approval reason. This will be saved in the audit log:",
        force
          ? "Special causes reviewed; authorized approval documented"
          : "Trial limits reviewed and approved",
      );
      if (reason === null) return;
      if (!reason.trim()) {
        toast.error("An approval reason is required");
        return;
      }
    }

    const trialSignalCount = Math.max(
      0,
      Number(
        candidate?.trialSignalCount ??
          chart.candidateTrialSignalCount ??
          chart.signalIndexes?.length ??
          0,
      ) || 0,
    );

    const confirmed = window.confirm(
      `Approve baseline v${
        candidate?.version || chart.candidateBaselineVersion || "-"
      } and freeze its control limits?

Complete ${chart.type === "imr" ? "readings" : "subgroups"}: ${collected}/${minimum}
Trial control-chart signals: ${trialSignalCount}

This affects future SPC decisions for this process stream.`,
    );
    if (!confirmed) return;

    setApprovingBaseline(true);
    try {
      const response = await axios.post(
        `${API_URL}/qc-inspection/${inspectionId}/spc/checkpoint/${encodeURIComponent(
          checkpointId,
        )}/baseline/approve`,
        {
          baselineId: candidateId,
          force,
          reason: reason.trim(),
        },
        {
          withCredentials: true,
          timeout: 100000,
        },
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Baseline approval failed");
      }

      toast.success(
        `Baseline v${response.data.data?.version || ""} approved; control limits are frozen`,
        { duration: 5000 },
      );

      await fetchControlChart(selectedCheckpoint, selectedInspections);
      await fetchAllSPCData(filters.page);
      if (showBaselineHistory) {
        await fetchBaselineHistory(selectedCheckpoint);
      }
    } catch (error) {
      const statusCode = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to approve SPC baseline";

      if (statusCode === 409 && !force) {
        const proceed = window.confirm(
          `${message}

Authorized override is only permitted after special causes or zero variation have been reviewed and documented. Continue?`,
        );
        if (proceed) {
          setApprovingBaseline(false);
          await handleApproveBaseline({
            force: true,
            approvalReason: reason,
          });
          return;
        }
      } else {
        toast.error(message);
      }
    } finally {
      setApprovingBaseline(false);
    }
  };

  const clearChartSelection = () => {
    setSelectedCheckpoint(null);
    setSelectedInspections([]);
    setSelectedSubgroup("all");
    setChartData(null);
    setShowChartModal(false);
  };

  const selectChartType = async (nextType) => {
    if (nextType === chartType && chartTypeSelectedByUser) return;
    setChartType(nextType);
    setChartTypeSelectedByUser(true);
    setCheckpointSearchTerm("");
    clearChartSelection();

    const spcMethod = getSPCMethodFilterForChartType(
      nextType,
      data?.filterOptions?.spcMethods || [],
    );
    await applyChartFilters({
      checkpointId: "",
      spcMethod,
      resultType: "",
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
      page: 1,
      ...(key === "timeRange"
        ? { historyLimit: getHistoryLimitForRange(value) }
        : {}),
    }));
  };

  const applyDashboardFilters = async (updates = {}) => {
    const nextTimeRange = updates.timeRange ?? filters.timeRange ?? "all";
    const nextFilters = {
      ...filters,
      ...updates,
      page: 1,
      timeRange: nextTimeRange,
      historyLimit:
        updates.historyLimit ?? getHistoryLimitForRange(nextTimeRange),
    };

    if (nextTimeRange !== "custom") {
      nextFilters.fromDate = "";
      nextFilters.toDate = "";
    }

    setFilters(nextFilters);
    setChartFilters((previous) => ({
      ...previous,
      dateRange: nextTimeRange,
      fromDate: nextTimeRange === "custom" ? nextFilters.fromDate : "",
      toDate: nextTimeRange === "custom" ? nextFilters.toDate : "",
    }));
    clearChartSelection();

    return fetchAllSPCData(1, { filters: nextFilters });
  };

  const applyFilters = () => applyDashboardFilters();

  const resetFilters = async () => {
    const nextFilters = { ...DEFAULT_DASHBOARD_FILTERS };
    setShowDatePicker(false);
    setFilters(nextFilters);
    setChartFilters({ ...DEFAULT_CHART_FILTERS });
    setChartType("");
    setChartTypeSelectedByUser(false);
    clearChartSelection();
    await fetchAllSPCData(1, { filters: nextFilters });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setFilters((prev) => ({ ...prev, page: newPage }));
    if (isOpen) fetchAllSPCData(newPage);
  };

  const viewCheckpointChart = (checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setChartData(null);

    const selectedIds =
      checkpoint.inspections?.map((ins) => ins.inspectionId) || [];
    setSelectedInspections(selectedIds);

    fetchControlChart(checkpoint, selectedIds);
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pass: "bg-green-100 text-green-800 border-green-200",
      OK: "bg-green-100 text-green-800 border-green-200",
      Fail: "bg-red-100 text-red-800 border-red-200",
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      "N/A": "bg-gray-100 text-gray-800 border-gray-200",
    };
    const defaultStyle = "bg-gray-100 text-gray-800 border-gray-200";
    return styles[status] || defaultStyle;
  };

  const subgroupOptions = useMemo(() => {
    if (!chartData?.chart) return [];
    const chart = chartData.chart;
    const labels = chart.labels || [];
    const isIMR = chart.type === "imr";

    return labels.map((label, index) => ({
      value: String(index),
      label: isIMR ? `Reading ${index + 1}` : `SG-${index + 1}`,
      sourceLabel: label,
    }));
  }, [chartData]);

  const chartCheckpoints = useMemo(() => {
    if (!data?.checkpoints) return [];
    return mergeCheckpointChartOptions(
      data.checkpoints.filter((checkpoint) =>
        isCheckpointCompatibleWithChart(checkpoint, effectiveChartType),
      ),
    );
  }, [data, effectiveChartType]);

  const filteredChartCheckpoints = useMemo(() => {
    if (!chartCheckpoints.length) return [];
    if (!checkpointSearchTerm.trim()) return chartCheckpoints;

    const searchLower = checkpointSearchTerm.toLowerCase().trim();
    return chartCheckpoints.filter((cp) => {
      const latestInspection = cp.inspections?.[0] || {};

      const searchableFields = [
        cp.checkpointName,
        cp.checkpointId,
        cp.itemName,
        cp.itemDescription,
        cp.processName,
        cp.spcMethod,
        cp.resultType,
        cp.date,
        latestInspection.itemName,
        latestInspection.itemDescription,
        latestInspection.processName,
        latestInspection.batchNumber,
        latestInspection.date,
        latestInspection.timeSlot,
      ]
        .filter(Boolean)
        .map((field) => String(field).toLowerCase());

      return searchableFields.some((field) => field.includes(searchLower));
    });
  }, [chartCheckpoints, checkpointSearchTerm]);

  const applyChartFilters = async (updates = {}) => {
    const nextChartFilters = {
      ...chartFilters,
      ...updates,
    };

    const range = nextChartFilters.dateRange || "all";
    const nextFilters = {
      ...filters,
      companyId: nextChartFilters.companyId || "",
      itemId: nextChartFilters.itemId || "",
      processId: nextChartFilters.processId || "",
      status: nextChartFilters.status || "",
      resultType: nextChartFilters.resultType || "",
      spcMethod: nextChartFilters.spcMethod || "",
      stability: nextChartFilters.stability || "",
      capability: nextChartFilters.capability || "",
      hasOutOfControl: nextChartFilters.hasOOC || "",
      timeRange: range,
      fromDate: range === "custom" ? nextChartFilters.fromDate : "",
      toDate: range === "custom" ? nextChartFilters.toDate : "",
      historyLimit: getHistoryLimitForRange(range),
      page: 1,
    };

    if (
      range === "custom" &&
      (!nextChartFilters.fromDate || !nextChartFilters.toDate)
    ) {
      setChartFilters(nextChartFilters);
      toast.error("Select both From and To dates");
      return null;
    }

    if (
      range === "custom" &&
      nextChartFilters.fromDate > nextChartFilters.toDate
    ) {
      setChartFilters(nextChartFilters);
      toast.error("From date cannot be after To date");
      return null;
    }

    setChartFilters(nextChartFilters);
    setFilters(nextFilters);
    clearChartSelection();

    return fetchAllSPCData(1, { filters: nextFilters });
  };
  if (!isOpen) return null;

  const getCompanyItems = (companyName) => {
    const companyItemsMap = {};
    if (data?.checkpoints) {
      data.checkpoints.forEach((cp) => {
        // Match company name if available in checkpoint or inspections
        const matchesCompany =
          cp.companyName === companyName || cp.company === companyName;

        if (matchesCompany || !companyName) {
          const inspections = cp.inspections || [cp];
          inspections.forEach((ins) => {
            const itemName =
              ins.itemName ||
              cp.itemName ||
              ins.itemCode ||
              cp.itemCode ||
              "Unknown Item";
            companyItemsMap[itemName] = (companyItemsMap[itemName] || 0) + 1;
          });
        }
      });
    }
    return Object.entries(companyItemsMap);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <DashboardNavbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onRefresh={() => fetchAllSPCData(filters.page)}
          isRefreshing={refreshing}
          summary={data?.summary}
          notifications={data?.notifications || []}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
            {loading && !data ? (
              <div className="flex min-h-[300px] sm:min-h-[420px] items-center justify-center">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mr-3" />
                <span className="text-sm sm:text-base text-slate-600">
                  Loading SPC data...
                </span>
              </div>
            ) : !data ? (
              <div className="flex min-h-[300px] sm:min-h-[420px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 sm:p-8 text-center">
                <div>
                  <BarChart3 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">
                    No SPC data available for the selected time range
                  </p>
                  <p className="text-xs text-slate-400">
                    Try adjusting the time range or create inspections with SPC
                    checkpoints
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* ONLY SHOW ON SUMMARY TAB */}
                {activeTab === "summary" && (
                  <>
                    {/* TIME RANGE FILTER - Only on Summary Tab */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 mb-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">
                            Time Range:
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: "today", label: "Today" },
                            { value: "week", label: "Week" },
                            { value: "month", label: "Month" },
                            { value: "quarter", label: "Quarter" },
                            { value: "year", label: "Year" },
                            { value: "all", label: "All Data" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setShowDatePicker(false);
                                applyDashboardFilters({
                                  timeRange: option.value,
                                  fromDate: "",
                                  toDate: "",
                                });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                                filters.timeRange === option.value
                                  ? "bg-blue-600 text-white shadow-md"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              setShowDatePicker((current) => !current);
                              setFilters((previous) => ({
                                ...previous,
                                timeRange: "custom",
                                page: 1,
                                historyLimit: getHistoryLimitForRange("custom"),
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                              filters.timeRange === "custom"
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            Custom
                          </button>
                        </div>

                        {showDatePicker && (
                          <div className="flex items-center gap-2 ml-2 flex-wrap">
                            <input
                              type="date"
                              value={filters.fromDate}
                              onChange={(e) =>
                                setFilters((previous) => ({
                                  ...previous,
                                  fromDate: e.target.value,
                                  timeRange: "custom",
                                  page: 1,
                                }))
                              }
                              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                            />
                            <span className="text-slate-400">to</span>
                            <input
                              type="date"
                              value={filters.toDate}
                              onChange={(e) =>
                                setFilters((previous) => ({
                                  ...previous,
                                  toDate: e.target.value,
                                  timeRange: "custom",
                                  page: 1,
                                }))
                              }
                              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                            />
                            <button
                              onClick={async () => {
                                if (!filters.fromDate || !filters.toDate) {
                                  toast.error("Select both From and To dates");
                                  return;
                                }
                                if (filters.fromDate > filters.toDate) {
                                  toast.error(
                                    "From date cannot be after To date",
                                  );
                                  return;
                                }
                                setShowDatePicker(false);
                                await applyDashboardFilters({
                                  timeRange: "custom",
                                  fromDate: filters.fromDate,
                                  toDate: filters.toDate,
                                });
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                            >
                              Apply
                            </button>
                          </div>
                        )}

                        <div className="flex-1"></div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="bg-blue-50 px-2 py-1 rounded whitespace-nowrap">
                            History: {filters.historyLimit} records
                          </span>
                          <select
                            value={filters.historyLimit}
                            onChange={(e) =>
                              applyDashboardFilters({
                                historyLimit: Number(e.target.value),
                              })
                            }
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white"
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                            <option value={2000}>2000</option>
                            <option value={5000}>5000</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* ADDITIONAL FILTERS - Company, Item, Date Quick Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 mb-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">
                            Filters:
                          </span>
                        </div>

                        {/* Company Filter */}
                        <select
                          value={filters.companyId}
                          onChange={(e) =>
                            applyDashboardFilters({ companyId: e.target.value })
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
                        >
                          <option value="">All Companies</option>
                          {data.filterOptions.companies
                            ?.slice(0, 50)
                            .map((company) => (
                              <option key={company} value={company}>
                                {company}
                              </option>
                            ))}
                        </select>

                        {/* Item Filter */}
                        <select
                          value={filters.itemId}
                          onChange={(e) =>
                            applyDashboardFilters({ itemId: e.target.value })
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
                        >
                          <option value="">All Items</option>
                          {data.filterOptions.items
                            ?.slice(0, 50)
                            .map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                          value={filters.status}
                          onChange={(e) =>
                            applyDashboardFilters({ status: e.target.value })
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[100px]"
                        >
                          <option value="">All Status</option>
                          {data.filterOptions.statuses?.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        <div className="flex-1"></div>

                        <button
                          onClick={resetFilters}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-6">
                      {/* Total Inspections */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 p-3 sm:p-4 hover:shadow-md transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] sm:text-xs font-medium text-blue-600/70 uppercase tracking-wider">
                              Total Inspections
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-blue-700 mt-1">
                              {data.summary.totalInspections}
                            </p>
                            <p className="text-[8px] sm:text-[10px] text-blue-500/60 truncate">
                              {filters.timeRange === "today"
                                ? "Today"
                                : filters.timeRange === "week"
                                  ? "Last 7 days"
                                  : filters.timeRange === "month"
                                    ? "Last 30 days"
                                    : filters.timeRange === "quarter"
                                      ? "Last 90 days"
                                      : filters.timeRange === "year"
                                        ? "Last 365 days"
                                        : filters.timeRange === "custom"
                                          ? "Custom range"
                                          : "All time"}
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Checkpoints */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200/50 p-3 sm:p-4 hover:shadow-md transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] sm:text-xs font-medium text-purple-600/70 uppercase tracking-wider">
                              Checkpoints
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-purple-700 mt-1">
                              {data.summary.uniqueCheckpoints}
                            </p>
                            <p className="text-[8px] sm:text-[10px] text-purple-500/60">
                              Unique
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                            <svg
                              className="w-5 h-5 text-purple-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Passed */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200/50 p-3 sm:p-4 hover:shadow-md transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] sm:text-xs font-medium text-emerald-600/70 uppercase tracking-wider">
                              Passed
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
                              {data.summary.totalPassed}
                            </p>
                            <p className="text-[8px] sm:text-[10px] text-emerald-500/60">
                              ✓ Accepted
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                            <svg
                              className="w-5 h-5 text-emerald-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Failed */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border border-red-200/50 p-3 sm:p-4 hover:shadow-md transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] sm:text-xs font-medium text-red-600/70 uppercase tracking-wider">
                              Failed
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-red-700 mt-1">
                              {data.summary.totalFailed}
                            </p>
                            <p className="text-[8px] sm:text-[10px] text-red-500/60">
                              ✗ Rejected
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                            <svg
                              className="w-5 h-5 text-red-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Out of Control */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl border border-orange-200/50 p-3 sm:p-4 hover:shadow-md transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] sm:text-xs font-medium text-orange-600/70 uppercase tracking-wider">
                              Out of Control
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-orange-700 mt-1">
                              {data.summary.outOfControlCount}
                            </p>
                            <p className="text-[8px] sm:text-[10px] text-orange-500/60">
                              ⚠ OOC Points
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                            <svg
                              className="w-5 h-5 text-orange-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary Overview Section */}
                    {/* Summary Overview Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 mb-6 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
                        <div>
                          <h3 className="text-base font-bold text-slate-800">
                            Summary Overview
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {selectedCompany
                              ? `Showing items for: ${selectedCompany}`
                              : "Manage and review distributions cleanly"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          {selectedCompany && (
                            <>
                              {/* Search Bar for items */}
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Search items..."
                                  value={itemSearchTerm}
                                  onChange={(e) =>
                                    setItemSearchTerm(e.target.value)
                                  }
                                  className="w-48 sm:w-64 rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {itemSearchTerm && (
                                  <button
                                    onClick={() => setItemSearchTerm("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedCompany(null);
                                  setItemSearchTerm("");
                                }}
                                className="text-xs font-semibold px-3 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-lg transition-all"
                              >
                                ← Back to Companies
                              </button>
                            </>
                          )}
                          {!selectedCompany && (
                            <div className="flex items-center bg-slate-200/60 p-1 rounded-xl">
                              <button
                                onClick={() => setActiveCompanyTab("company")}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                  activeCompanyTab === "company"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                By Company (
                                {
                                  Object.keys(data?.summary?.byCompany || {})
                                    .length
                                }
                                )
                              </button>
                              <button
                                onClick={() => setActiveCompanyTab("item")}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                  activeCompanyTab === "item"
                                    ? "bg-white text-purple-600 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                By Item (
                                {
                                  Object.keys(data?.summary?.byItem || {})
                                    .length
                                }
                                )
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-5 sm:p-6">
                        {selectedCompany ? (
                          /* Company Drill-down Table View */
                          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                  <tr>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap w-[50px]">
                                      #
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-left whitespace-nowrap min-w-[150px]">
                                      Item Name
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-left whitespace-nowrap min-w-[120px] hidden md:table-cell">
                                      Description
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-left whitespace-nowrap min-w-[120px] hidden lg:table-cell">
                                      Checkpoint Name
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-left whitespace-nowrap min-w-[120px] hidden xl:table-cell">
                                      Process Name
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap w-[100px]">
                                      Checkpoints
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap w-[120px] hidden sm:table-cell">
                                      Total Inspections
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap w-[100px]">
                                      Pass / Fail
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {(() => {
                                    // Get all company items
                                    const companyItems =
                                      getCompanyItems(selectedCompany);

                                    // Filter items based on search term
                                    const filteredItems = itemSearchTerm.trim()
                                      ? companyItems.filter(([itemName]) =>
                                          itemName
                                            .toLowerCase()
                                            .includes(
                                              itemSearchTerm
                                                .toLowerCase()
                                                .trim(),
                                            ),
                                        )
                                      : companyItems;

                                    if (filteredItems.length === 0) {
                                      return (
                                        <tr>
                                          <td
                                            colSpan="8"
                                            className="border border-gray-300 px-4 py-8 text-center"
                                          >
                                            <div className="flex flex-col items-center justify-center py-4">
                                              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                                <Package className="h-8 w-8 text-slate-400" />
                                              </div>
                                              <p className="text-sm font-medium text-slate-600">
                                                {companyItems.length === 0
                                                  ? "No Items Found"
                                                  : "No Matching Items"}
                                              </p>
                                              <p className="text-xs text-slate-400 mt-1">
                                                {companyItems.length === 0
                                                  ? `No items are associated with ${selectedCompany}`
                                                  : `No items match "${itemSearchTerm}"`}
                                              </p>
                                              {itemSearchTerm && (
                                                <button
                                                  onClick={() =>
                                                    setItemSearchTerm("")
                                                  }
                                                  className="mt-4 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                                                >
                                                  Clear Search
                                                </button>
                                              )}
                                              {companyItems.length === 0 && (
                                                <button
                                                  onClick={() =>
                                                    setSelectedCompany(null)
                                                  }
                                                  className="mt-4 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                                                >
                                                  ← Back to Companies
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    }

                                    return filteredItems.map(
                                      ([itemName, count], index) => {
                                        // Find checkpoint details for this item
                                        const itemCheckpoints =
                                          data.checkpoints?.filter((cp) => {
                                            const inspection =
                                              cp.inspections?.[0] || {};
                                            const cpItemName =
                                              inspection.itemName ||
                                              cp.itemName ||
                                              cp.itemDescription ||
                                              "";
                                            return (
                                              cpItemName === itemName ||
                                              cp.checkpointName === itemName
                                            );
                                          }) || [];

                                        const totalInspections =
                                          itemCheckpoints.reduce(
                                            (sum, cp) =>
                                              sum +
                                              (cp.inspections?.length || 0),
                                            0,
                                          );

                                        const totalPassed =
                                          itemCheckpoints.reduce(
                                            (sum, cp) =>
                                              sum + (cp.totalPassed || 0),
                                            0,
                                          );

                                        const totalFailed =
                                          itemCheckpoints.reduce(
                                            (sum, cp) =>
                                              sum + (cp.totalFailed || 0),
                                            0,
                                          );

                                        const description =
                                          itemCheckpoints[0]?.inspections?.[0]
                                            ?.itemDescription ||
                                          itemCheckpoints[0]?.itemDescription ||
                                          "-";

                                        // Get unique checkpoint names and process names
                                        const checkpointNames = [
                                          ...new Set(
                                            itemCheckpoints
                                              .map((cp) => cp.checkpointName)
                                              .filter(Boolean),
                                          ),
                                        ];
                                        const processNames = [
                                          ...new Set(
                                            itemCheckpoints
                                              .map((cp) => cp.processName)
                                              .filter(Boolean),
                                          ),
                                        ];

                                        const checkpointNameDisplay =
                                          checkpointNames.length > 0
                                            ? checkpointNames
                                                .slice(0, 3)
                                                .join(", ") +
                                              (checkpointNames.length > 3
                                                ? ` +${checkpointNames.length - 3} more`
                                                : "")
                                            : "-";

                                        const processNameDisplay =
                                          processNames.length > 0
                                            ? processNames
                                                .slice(0, 2)
                                                .join(", ") +
                                              (processNames.length > 2
                                                ? ` +${processNames.length - 2} more`
                                                : "")
                                            : "-";

                                        return (
                                          <tr
                                            key={index}
                                            className="hover:bg-blue-50/50 transition-colors duration-150"
                                          >
                                            <td className="border border-gray-300 px-3 py-2.5 text-center text-xs font-medium text-slate-400">
                                              {index + 1}
                                            </td>
                                            <td
                                              className="border border-gray-300 px-3 py-2.5 text-left text-sm font-medium text-slate-700 truncate max-w-[200px]"
                                              title={itemName}
                                            >
                                              {itemName}
                                            </td>
                                            <td
                                              className="border border-gray-300 px-3 py-2.5 text-left text-xs text-slate-500 truncate max-w-[200px] hidden md:table-cell"
                                              title={description}
                                            >
                                              {description}
                                            </td>
                                            <td
                                              className="border border-gray-300 px-3 py-2.5 text-left text-xs text-slate-600 truncate max-w-[200px] hidden lg:table-cell"
                                              title={checkpointNameDisplay}
                                            >
                                              {checkpointNameDisplay}
                                            </td>
                                            <td
                                              className="border border-gray-300 px-3 py-2.5 text-left text-xs text-slate-600 truncate max-w-[200px] hidden xl:table-cell"
                                              title={processNameDisplay}
                                            >
                                              {processNameDisplay}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2.5 text-center">
                                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {itemCheckpoints.length}
                                              </span>
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 hidden sm:table-cell">
                                              {totalInspections}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2.5 text-center">
                                              <div className="flex items-center justify-center gap-1">
                                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                                  {totalPassed}
                                                </span>
                                                <span className="text-xs text-slate-300">
                                                  /
                                                </span>
                                                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                                  {totalFailed}
                                                </span>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      },
                                    );
                                  })()}
                                </tbody>
                                {/* Table Footer */}
                                {(() => {
                                  const companyItems =
                                    getCompanyItems(selectedCompany);
                                  const filteredItems = itemSearchTerm.trim()
                                    ? companyItems.filter(([itemName]) =>
                                        itemName
                                          .toLowerCase()
                                          .includes(
                                            itemSearchTerm.toLowerCase().trim(),
                                          ),
                                      )
                                    : companyItems;

                                  if (companyItems.length === 0) return null;

                                  const totalItems = filteredItems.length;
                                  const totalCheckpoints = filteredItems.reduce(
                                    (sum, [_, count]) => sum + count,
                                    0,
                                  );
                                  const totalOriginalItems =
                                    companyItems.length;
                                  const totalPassedAll = filteredItems.reduce(
                                    (sum, [itemName]) => {
                                      const itemCheckpoints =
                                        data.checkpoints?.filter((cp) => {
                                          const inspection =
                                            cp.inspections?.[0] || {};
                                          const cpItemName =
                                            inspection.itemName ||
                                            cp.itemName ||
                                            cp.itemDescription ||
                                            "";
                                          return (
                                            cpItemName === itemName ||
                                            cp.checkpointName === itemName
                                          );
                                        }) || [];
                                      return (
                                        sum +
                                        itemCheckpoints.reduce(
                                          (s, cp) => s + (cp.totalPassed || 0),
                                          0,
                                        )
                                      );
                                    },
                                    0,
                                  );
                                  const totalFailedAll = filteredItems.reduce(
                                    (sum, [itemName]) => {
                                      const itemCheckpoints =
                                        data.checkpoints?.filter((cp) => {
                                          const inspection =
                                            cp.inspections?.[0] || {};
                                          const cpItemName =
                                            inspection.itemName ||
                                            cp.itemName ||
                                            cp.itemDescription ||
                                            "";
                                          return (
                                            cpItemName === itemName ||
                                            cp.checkpointName === itemName
                                          );
                                        }) || [];
                                      return (
                                        sum +
                                        itemCheckpoints.reduce(
                                          (s, cp) => s + (cp.totalFailed || 0),
                                          0,
                                        )
                                      );
                                    },
                                    0,
                                  );

                                  return (
                                    <tfoot className="bg-slate-50/80 border-t border-gray-300">
                                      <tr>
                                        <td
                                          colSpan="8"
                                          className="border border-gray-300 px-3 py-2.5"
                                        >
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-xs text-slate-500">
                                              Showing{" "}
                                              <span className="font-semibold text-slate-700">
                                                {totalItems}
                                              </span>{" "}
                                              of{" "}
                                              <span className="font-semibold text-slate-700">
                                                {totalOriginalItems}
                                              </span>{" "}
                                              items
                                              {itemSearchTerm && (
                                                <span className="ml-1 text-blue-600">
                                                  (filtered by "{itemSearchTerm}
                                                  ")
                                                </span>
                                              )}
                                            </span>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                              <span>
                                                Total Checkpoints:{" "}
                                                <span className="font-semibold text-slate-700">
                                                  {totalCheckpoints}
                                                </span>
                                              </span>
                                              <span>
                                                Total Passed:{" "}
                                                <span className="font-semibold text-emerald-600">
                                                  {totalPassedAll}
                                                </span>
                                              </span>
                                              <span>
                                                Total Failed:{" "}
                                                <span className="font-semibold text-red-600">
                                                  {totalFailedAll}
                                                </span>
                                              </span>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    </tfoot>
                                  );
                                })()}
                              </table>
                            </div>
                          </div>
                        ) : activeCompanyTab === "company" ? (
                          /* Company List View with Click Event */
                          <div className="bg-white border border-gray-300 overflow-auto">
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-sm text-center">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                  <tr>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                      #
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                      Company Name (Click to view items)
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                      Total Count
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {Object.entries(data.summary.byCompany)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([name, count], index) => (
                                      <tr
                                        key={name}
                                        onClick={() => setSelectedCompany(name)}
                                        className="hover:bg-blue-50/60 cursor-pointer transition-colors duration-150 group"
                                      >
                                        <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                          {index + 1}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">
                                              {name || "Unknown Company"}
                                            </span>
                                            <span className="text-[10px] text-slate-400 group-hover:text-blue-400 transition-colors">
                                              click to view items →
                                            </span>
                                          </div>
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {count}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50/80 border-t border-gray-300">
                                  <tr>
                                    <td
                                      colSpan="3"
                                      className="border border-gray-300 px-3 py-2.5"
                                    >
                                      <span className="text-xs text-slate-500">
                                        Total Companies:{" "}
                                        <span className="font-semibold text-slate-700">
                                          {
                                            Object.keys(data.summary.byCompany)
                                              .length
                                          }
                                        </span>
                                      </span>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        ) : (
                          /* Item List View */
                          <div className="bg-white border border-gray-300 overflow-auto">
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-sm text-center">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                  <tr>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                      #
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                      Item Details
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                      Total Count
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {Object.entries(data.summary.byItem)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([itemKey, count], index) => {
                                      let displayName = itemKey;
                                      let description = "";

                                      if (data?.checkpoints) {
                                        for (const cp of data.checkpoints) {
                                          if (cp.inspections) {
                                            for (const ins of cp.inspections) {
                                              if (
                                                ins.itemCode === itemKey ||
                                                ins.itemId === itemKey ||
                                                ins.itemName === itemKey
                                              ) {
                                                if (
                                                  ins.itemName &&
                                                  ins.itemName !== itemKey
                                                )
                                                  displayName = ins.itemName;
                                                if (ins.itemDescription)
                                                  description =
                                                    ins.itemDescription;
                                                break;
                                              }
                                            }
                                            if (description) break;
                                          }
                                          if (
                                            cp.itemCode === itemKey ||
                                            cp.itemId === itemKey ||
                                            cp.itemName === itemKey ||
                                            cp.checkpointId === itemKey
                                          ) {
                                            if (
                                              cp.itemName &&
                                              cp.itemName !== itemKey
                                            )
                                              displayName = cp.itemName;
                                            if (cp.itemDescription)
                                              description = cp.itemDescription;
                                            break;
                                          }
                                        }
                                      }

                                      return (
                                        <tr
                                          key={itemKey}
                                          className="hover:bg-purple-50/40 transition-colors duration-150"
                                        >
                                          <td className="border border-gray-300 px-3 py-2.5 text-center text-xs font-medium text-slate-400">
                                            {index + 1}
                                          </td>
                                          <td className="border border-gray-300 px-3 py-2.5 text-left">
                                            <div className="min-w-0">
                                              <span
                                                className="text-sm font-medium text-slate-700 truncate block"
                                                title={displayName}
                                              >
                                                {displayName}
                                              </span>
                                              {description && (
                                                <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                                                  {description}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="border border-gray-300 px-3 py-2.5 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                              {count}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                                <tfoot className="bg-slate-50/80 border-t border-gray-300">
                                  <tr>
                                    <td
                                      colSpan="3"
                                      className="border border-gray-300 px-3 py-2.5"
                                    >
                                      <span className="text-xs text-slate-500">
                                        Total Items:{" "}
                                        <span className="font-semibold text-slate-700">
                                          {
                                            Object.keys(data.summary.byItem)
                                              .length
                                          }
                                        </span>
                                      </span>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>

                {/* ============================================================
        CHECKPOINTS TAB
        ============================================================ */}
                {activeTab === "checkpoints" && (
                  <div className="space-y-3 sm:space-y-4">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {showFilters ? "Hide Filters" : "Show Filters"}
                      {showFilters ? (
                        <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </button>

                    {showFilters && (
                      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                          <select
                            value={filters.companyId}
                            onChange={(e) =>
                              handleFilterChange("companyId", e.target.value)
                            }
                            className="rounded-lg border border-slate-300 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Companies</option>
                            {data.filterOptions.companies
                              ?.slice(0, 50)
                              .map((company) => (
                                <option key={company} value={company}>
                                  {company}
                                </option>
                              ))}
                            {data.filterOptions.companies?.length > 50 && (
                              <option value="">+ more...</option>
                            )}
                          </select>

                          <select
                            value={filters.itemId}
                            onChange={(e) =>
                              handleFilterChange("itemId", e.target.value)
                            }
                            className="rounded-lg border border-slate-300 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Items</option>
                            {data.filterOptions.items
                              ?.slice(0, 50)
                              .map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            {data.filterOptions.items?.length > 50 && (
                              <option value="">+ more...</option>
                            )}
                          </select>

                          {/* <select
                            value={filters.status}
                            onChange={(e) =>
                              handleFilterChange("status", e.target.value)
                            }
                            className="rounded-lg border border-slate-300 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Status</option>
                            {data.filterOptions.statuses?.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>

                          <select
                            value={filters.hasOutOfControl}
                            onChange={(e) =>
                              handleFilterChange(
                                "hasOutOfControl",
                                e.target.value,
                              )
                            }
                            className="rounded-lg border border-slate-300 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">OOC (All)</option>
                            <option value="true">Has OOC</option>
                            <option value="false">No OOC</option>
                          </select> */}

                          {/* <input
                            type="text"
                            placeholder="Search..."
                            value={filters.search}
                            onChange={(e) =>
                              handleFilterChange("search", e.target.value)
                            }
                            className="rounded-lg border border-slate-300 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          /> */}

                          <div className="flex gap-1.5 sm:gap-2">
                            <button
                              onClick={applyFilters}
                              className="flex-1 rounded-lg bg-blue-600 px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-blue-700 transition"
                            >
                              Apply
                            </button>
                            <button
                              onClick={resetFilters}
                              className="rounded-lg bg-slate-200 px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-300 transition"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Checkpoints Table */}
                    <div className="bg-white border border-gray-300 overflow-auto">
                      <table className="w-full border-collapse text-sm text-cente">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                              Date
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                              Time Slot
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                              Process name
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                              Checkpoint
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                              Item name
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                              Spc method
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                              Type
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                              Inspections
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                              Pass/Fail
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.checkpoints?.slice(0, 100).map((checkpoint) => (
                            <React.Fragment key={checkpoint.checkpointId}>
                              <tr className="hover:bg-blue-50">
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <div className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[150px]">
                                    {checkpoint.date}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <div className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[150px]">
                                    {checkpoint.timeSlot}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <div className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[150px]">
                                    {checkpoint.processName}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[8px] sm:text-xs font-medium bg-slate-100 text-slate-700">
                                    {checkpoint.checkpointName}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[8px] sm:text-xs font-medium bg-slate-100 text-slate-700">
                                    {checkpoint.itemDescription}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[8px] sm:text-xs font-medium bg-slate-100 text-slate-700">
                                    {checkpoint.spcMethod}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[8px] sm:text-xs font-medium bg-slate-100 text-slate-700">
                                    {checkpoint.resultType}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  {checkpoint.inspections?.length || 0}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <div className="flex items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                                    <span className="text-green-600 font-medium">
                                      {checkpoint.totalPassed || 0}
                                    </span>
                                    <span className="text-slate-300">/</span>
                                    <span className="text-red-600 font-medium">
                                      {checkpoint.totalFailed || 0}
                                    </span>
                                    <span className="text-slate-300 hidden sm:inline">
                                      /
                                    </span>
                                    <span className="text-yellow-600 font-medium hidden sm:inline">
                                      {checkpoint.totalPending || 0}
                                    </span>
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                  <div className="flex items-center justify-center gap-2 sm:gap-1">
                                    <button
                                      onClick={() =>
                                        viewCheckpointChart(checkpoint)
                                      }
                                      className="p-1 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                                      title="View Control Chart"
                                    >
                                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      Details
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {expandedRows.has(checkpoint.checkpointId) && (
                                <tr>
                                  <td
                                    colSpan="10"
                                    className="border border-gray-300 px-3 py-2 align-middle text-center"
                                  >
                                    <div className="space-y-2">
                                      <div className="text-[10px] sm:text-xs font-semibold text-slate-700">
                                        Recent Inspections:
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {checkpoint.inspections
                                          ?.slice(0, 6)
                                          .map((ins, idx) => (
                                            <div
                                              key={idx}
                                              className="bg-white rounded-lg border border-slate-200 p-2 sm:p-3 text-[10px] sm:text-xs"
                                            >
                                              <div className="flex justify-between items-center">
                                                <span className="font-medium text-slate-800 truncate">
                                                  {ins.itemName ||
                                                    ins.itemId ||
                                                    "Unknown"}
                                                </span>
                                                <span
                                                  className={`px-1.5 py-0.5 rounded text-[8px] sm:text-xs font-medium border ${getStatusBadge(ins.status)}`}
                                                >
                                                  {ins.status}
                                                </span>
                                              </div>
                                              <div className="text-slate-500 mt-1 grid grid-cols-2 gap-0.5 sm:gap-1">
                                                <span>
                                                  📅{" "}
                                                  {ins.inspectionDate ||
                                                    ins.date ||
                                                    "N/A"}
                                                </span>
                                                <span>
                                                  📦 {ins.batchNumber || "N/A"}
                                                </span>
                                                <span>
                                                  📊 Cpk:{" "}
                                                  {ins.cpk?.toFixed(3) || "-"}
                                                </span>
                                                <span>
                                                  📈 {ins.stability || "N/A"}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>

                      {pagination.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 border-t border-slate-200 bg-slate-50">
                          <div className="text-[10px] sm:text-sm text-slate-600">
                            Showing{" "}
                            {(pagination.page - 1) * pagination.limit + 1} to{" "}
                            {Math.min(
                              pagination.page * pagination.limit,
                              pagination.totalItems,
                            )}{" "}
                            of {pagination.totalItems}
                          </div>
                          <div className="flex gap-1.5 sm:gap-2">
                            <button
                              onClick={() =>
                                handlePageChange(pagination.page - 1)
                              }
                              disabled={pagination.page === 1}
                              className="px-2 py-1 sm:px-3 sm:py-1 rounded-lg border border-slate-300 bg-white text-[10px] sm:text-sm disabled:opacity-50 hover:bg-slate-50 transition"
                            >
                              Previous
                            </button>
                            <span className="px-2 py-1 sm:px-3 sm:py-1 rounded-lg border border-slate-300 bg-blue-50 text-[10px] sm:text-sm font-medium">
                              {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                              onClick={() =>
                                handlePageChange(pagination.page + 1)
                              }
                              disabled={
                                pagination.page === pagination.totalPages
                              }
                              className="px-2 py-1 sm:px-3 sm:py-1 rounded-lg border border-slate-300 bg-white text-[10px] sm:text-sm disabled:opacity-50 hover:bg-slate-50 transition"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ============================================================
CHARTS TAB - Enhanced with Full SPC Filters
============================================================ */}
                {activeTab === "charts" && (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Chart Selection Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl border border-blue-100/50 p-3 sm:p-4">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          <span className="text-xs sm:text-sm font-semibold text-slate-700">
                            Control Charts
                          </span>
                        </div>
                        <div className="flex-1"></div>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500">
                          <span className="bg-blue-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-blue-700 font-medium">
                            {effectiveChartType
                              ? `${chartCheckpoints.length} ${getSPCChartTypeLabel(effectiveChartType)} checkpoints`
                              : "Select a chart type"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 1: Advanced Filters - By Date, Company, Item, Process, Checkpoint, Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Filter className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700">
                          Advanced Filters
                        </span>
                        <button
                          onClick={() =>
                            applyChartFilters({ ...DEFAULT_CHART_FILTERS })
                          }
                          className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Reset Filters
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
                        {/* Date Range Filter */}
                        <div className="col-span-2 sm:col-span-1">
                          <label className="text-[10px] font-medium text-slate-500 block mb-1">
                            Date Range
                          </label>
                          <select
                            value={chartFilters.dateRange || filters.timeRange}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "custom") {
                                setShowDatePicker(true);
                                setChartFilters((previous) => ({
                                  ...previous,
                                  dateRange: value,
                                }));
                              } else {
                                setShowDatePicker(false);
                                applyChartFilters({
                                  dateRange: value,
                                  fromDate: "",
                                  toDate: "",
                                });
                              }
                            }}
                            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="quarter">Last 90 Days</option>
                            <option value="year">Last 365 Days</option>
                            <option value="custom">Custom Range</option>
                            <option value="all">All Time</option>
                          </select>
                        </div>

                        {/* Custom Date Range */}
                        {showDatePicker && (
                          <div className="col-span-2 sm:col-span-2 flex items-center gap-2">
                            <input
                              type="date"
                              value={chartFilters.fromDate}
                              onChange={(e) =>
                                setChartFilters((prev) => ({
                                  ...prev,
                                  fromDate: e.target.value,
                                }))
                              }
                              className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs flex-1"
                            />
                            <span className="text-slate-400 text-xs">to</span>
                            <input
                              type="date"
                              value={chartFilters.toDate}
                              onChange={(e) =>
                                setChartFilters((prev) => ({
                                  ...prev,
                                  toDate: e.target.value,
                                }))
                              }
                              className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs flex-1"
                            />
                            <button
                              onClick={() =>
                                applyChartFilters({
                                  dateRange: "custom",
                                  fromDate: chartFilters.fromDate,
                                  toDate: chartFilters.toDate,
                                })
                              }
                              className="px-2 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                            >
                              Apply
                            </button>
                          </div>
                        )}

                        {/* Company Filter */}
                        <div>
                          <label className="text-[10px] font-medium text-slate-500 block mb-1">
                            Company
                          </label>
                          <select
                            value={chartFilters.companyId}
                            onChange={(e) =>
                              applyChartFilters({ companyId: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Companies</option>
                            {data.filterOptions.companies
                              ?.slice(0, 30)
                              .map((company) => (
                                <option key={company} value={company}>
                                  {company}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Item Filter */}
                        <div>
                          <label className="text-[10px] font-medium text-slate-500 block mb-1">
                            Item
                          </label>
                          <select
                            value={chartFilters.itemId}
                            onChange={(e) =>
                              applyChartFilters({ itemId: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Items</option>
                            {data.filterOptions.items
                              ?.slice(0, 30)
                              .map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Process Filter */}
                        <div>
                          <label className="text-[10px] font-medium text-slate-500 block mb-1">
                            Process
                          </label>
                          <select
                            value={chartFilters.processId}
                            onChange={(e) =>
                              applyChartFilters({ processId: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Processes</option>
                            {data.filterOptions.processes
                              ?.slice(0, 30)
                              .map((process) => (
                                <option key={process} value={process}>
                                  {process}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* SPC Method Filter */}
                        <div>
                          <label className="text-[10px] font-medium text-slate-500 block mb-1">
                            SPC Method
                          </label>
                          <select
                            value={chartFilters.spcMethod}
                            onChange={(e) =>
                              applyChartFilters({ spcMethod: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Methods</option>
                            {(data?.filterOptions?.spcMethods?.length
                              ? data.filterOptions.spcMethods
                              : ["X-bar R", "I-MR", "X-bar S", "P", "NP"]
                            ).map((method) => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Result Type Filter */}
                        {/* <div>
                          <label className="text-[10px] font-medium text-slate-500 block mb-1">
                            Result Type
                          </label>
                          <select
                            value={chartFilters.resultType}
                            onChange={(e) =>
                              applyChartFilters({ resultType: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Types</option>
                            {(data?.filterOptions?.resultTypes?.length
                              ? data.filterOptions.resultTypes
                              : [
                                  "numeric",
                                  "binary",
                                  "defective_count",
                                  "defect_count",
                                ]
                            ).map((resultType) => (
                              <option key={resultType} value={resultType}>
                                {formatResultTypeLabel(resultType)}
                              </option>
                            ))}
                          </select>
                        </div> */}

                        {/* Status Filter */}
                        <div>
                          <label className="text-[10px] font-medium text-slate-500 block mb-1">
                            Status
                          </label>
                          <select
                            value={chartFilters.status}
                            onChange={(e) =>
                              applyChartFilters({ status: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Status</option>
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                            <option value="Pending">Pending</option>
                          </select>
                        </div>

                        {/* Stability Filter */}
                        {/* <div>
                          <label className="text-[10px] font-medium text-slate-500 block mb-1">
                            Stability
                          </label>
                          <select
                            value={chartFilters.stability}
                            onChange={(e) =>
                              applyChartFilters({ stability: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All</option>
                            <option value="Stable">Stable</option>
                            <option value="Unstable">Unstable</option>
                            <option value="Not Evaluated">Not Evaluated</option>
                          </select>
                        </div> */}

                        {/* Out of Control Filter */}
                        <div>
                          <label className="text-[10px] font-medium text-slate-500 block mb-1">
                            Out of Control
                          </label>
                          <select
                            value={chartFilters.hasOOC}
                            onChange={(e) =>
                              applyChartFilters({ hasOOC: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All</option>
                            <option value="true">Has OOC Points</option>
                            <option value="false">No OOC Points</option>
                          </select>
                        </div>
                      </div>

                      {/* Filter Summary Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                        {Object.entries(chartFilters)
                          .filter(
                            ([key, value]) =>
                              value &&
                              key !== "fromDate" &&
                              key !== "toDate" &&
                              key !== "dateRange",
                          )
                          .map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] border border-blue-200"
                            >
                              {key}: {value}
                              <button
                                onClick={() => applyChartFilters({ [key]: "" })}
                                className="hover:text-blue-900"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        {Object.entries(chartFilters).filter(
                          ([key, value]) =>
                            value && (key === "fromDate" || key === "toDate"),
                        ).length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] border border-green-200">
                            Date: {chartFilters.fromDate || "..."} to{" "}
                            {chartFilters.toDate || "..."}
                            <button
                              onClick={() =>
                                applyChartFilters({
                                  dateRange: "all",
                                  fromDate: "",
                                  toDate: "",
                                })
                              }
                              className="hover:text-green-900"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {Object.values(chartFilters).every(
                          (v) => !v || v === "month",
                        ) && (
                          <span className="text-[10px] text-slate-400">
                            No filters applied
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step 2: Chart Type Selection */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-1.5">
                          <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" />
                          <span className="text-xs sm:text-sm font-medium text-slate-700">
                            Chart Type:
                          </span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() => selectChartType("xbar-r")}
                            className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition ${
                              effectiveChartType === "xbar-r"
                                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 12l3-3m0 0l3 3m-3-3v12"
                                />
                              </svg>
                              X-bar R
                            </div>
                          </button>
                          <button
                            onClick={() => selectChartType("imr")}
                            className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition ${
                              effectiveChartType === "imr"
                                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                              </svg>
                              I-MR
                            </div>
                          </button>
                          <button
                            onClick={() => selectChartType("xbar-s")}
                            className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition ${
                              effectiveChartType === "xbar-s"
                                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v16h16"
                                />
                              </svg>
                              X-bar S
                            </div>
                          </button>
                          <button
                            onClick={() => selectChartType("p")}
                            className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition ${
                              effectiveChartType === "p"
                                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                              P-Chart
                            </div>
                          </button>
                          <button
                            onClick={() => selectChartType("np")}
                            className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition ${
                              effectiveChartType === "np"
                                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-xs">
                              {/* <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg> */}
                              <ChartColumnIncreasing className="text-xs" />
                              NP-Chart
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Checkpoint Selection with Filtered Results Count */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Filter className="h-3.5 w-3.5 text-slate-500" />
                            <span className="text-xs font-medium text-slate-700">
                              Select Checkpoint:
                            </span>
                            {selectedCheckpoint && (
                              <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full ml-1">
                                {selectedCheckpoint.inspections?.length || 0}{" "}
                                inspections
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 ml-auto">
                              {filteredChartCheckpoints.length} checkpoints
                              available
                            </span>
                          </div>

                          <div className="relative">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Search by checkpoint, item, process, batch..."
                                  value={checkpointSearchTerm}
                                  disabled={!effectiveChartType}
                                  onChange={(e) =>
                                    setCheckpointSearchTerm(e.target.value)
                                  }
                                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:bg-slate-100"
                                />
                              </div>
                              {checkpointSearchTerm && (
                                <button
                                  onClick={() => setCheckpointSearchTerm("")}
                                  className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            <select
                              value={
                                selectedCheckpoint?._chartOptionKey ||
                                (selectedCheckpoint
                                  ? getCheckpointChartOptionKey(
                                      selectedCheckpoint,
                                    )
                                  : "")
                              }
                              disabled={!effectiveChartType}
                              onChange={(e) => {
                                const cp = filteredChartCheckpoints.find(
                                  (checkpoint) =>
                                    checkpoint._chartOptionKey === e.target.value,
                                );
                                if (cp) {
                                  setSelectedCheckpoint(cp);
                                  setSelectedInspections([]);
                                  setChartData(null);
                                }
                              }}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer hover:border-blue-400 transition mt-2 disabled:cursor-not-allowed disabled:bg-slate-100"
                            >
                              <option value="">
                                {effectiveChartType
                                  ? "— Select a checkpoint —"
                                  : "— Select a chart type first —"}
                              </option>
                              {filteredChartCheckpoints
                                .slice(0, 50)
                                .map((cp) => {
                                  const latestInspection =
                                    cp.inspections?.[0] || {};
                                  const inspectionCount =
                                    cp.inspections?.length || 0;
                                  const checkpointName =
                                    cp.checkpointName || "Unnamed";
                                  const itemName =
                                    latestInspection.itemName ||
                                    cp.itemName ||
                                    "N/A";
                                  const itemDesc =
                                    latestInspection.itemDescription ||
                                    cp.itemDescription ||
                                    "";
                                  const processName =
                                    latestInspection.processName ||
                                    cp.processName ||
                                    "N/A";
                                  const batches = [
                                    ...new Set(
                                      (cp.inspections || [])
                                        .map((inspection) =>
                                          String(inspection.batchNumber || "").trim(),
                                        )
                                        .filter(Boolean),
                                    ),
                                  ];
                                  const dates = (cp.inspections || [])
                                    .map((inspection) =>
                                      normalizeDateOnly(inspection.date),
                                    )
                                    .filter(Boolean)
                                    .sort();
                                  const dateLabel =
                                    dates.length > 1
                                      ? `${dates[0]}–${dates[dates.length - 1]}`
                                      : dates[0] || "N/A";
                                  const batchLabel =
                                    batches.length > 1
                                      ? `${batches.length} batches`
                                      : batches.length === 1
                                        ? `Batch: ${batches[0]}`
                                        : "Batch: N/A";
                                  const status = cp.latestStatus || "Pending";

                                  return (
                                    <option
                                      key={cp._chartOptionKey}
                                      value={cp._chartOptionKey}
                                    >
                                      {checkpointName} — {itemName}{" "}
                                      {itemDesc ? `(${itemDesc})` : ""} | {batchLabel}{" "}
                                      | {dateLabel} | Process: {processName}{" "}
                                      | {inspectionCount} insp | {status}
                                    </option>
                                  );
                                })}
                              {filteredChartCheckpoints.length > 50 && (
                                <option value="">
                                  + {filteredChartCheckpoints.length - 50} more
                                </option>
                              )}
                              {filteredChartCheckpoints.length === 0 &&
                                checkpointSearchTerm && (
                                  <option value="" disabled>
                                    No checkpoints match your filters
                                  </option>
                                )}
                            </select>

                            <div className="absolute right-3 bottom-3 pointer-events-none">
                              <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>

                          {checkpointSearchTerm && (
                            <div className="mt-1 text-[10px] text-slate-400">
                              Found {filteredChartCheckpoints.length}{" "}
                              checkpoints matching "{checkpointSearchTerm}"
                            </div>
                          )}

                          {selectedCheckpoint && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                              <span className="font-medium text-slate-700">
                                Selected:
                              </span>
                              <span className="text-blue-600 font-medium">
                                {selectedCheckpoint.checkpointName}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span>
                                {selectedCheckpoint.inspections?.[0]
                                  ?.itemName || "N/A"}
                              </span>
                              {selectedCheckpoint.inspections?.[0]
                                ?.itemDescription && (
                                <>
                                  <span className="text-slate-300">|</span>
                                  <span className="text-slate-500">
                                    {
                                      selectedCheckpoint.inspections[0]
                                        .itemDescription
                                    }
                                  </span>
                                </>
                              )}
                              <span className="text-slate-300">|</span>
                              <span>
                                Batch:{" "}
                                {selectedCheckpoint.inspections?.[0]
                                  ?.batchNumber || "N/A"}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span>
                                {selectedCheckpoint.inspections?.[0]?.date ||
                                  "N/A"}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span>
                                Process:{" "}
                                {selectedCheckpoint.inspections?.[0]
                                  ?.processName || "N/A"}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-600">
                                {selectedCheckpoint.inspections?.length || 0}{" "}
                                inspections
                              </span>
                              <span className="text-slate-300">|</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[8px] font-medium border ${getStatusBadge(selectedCheckpoint.latestStatus)}`}
                              >
                                {selectedCheckpoint.latestStatus || "Pending"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Step 4: Inspection Selection with Grouping Options */}
                    {selectedCheckpoint && (
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4">
                        <div className="flex flex-wrap items-start gap-3">
                          <div className="flex items-center gap-1.5 mt-1">
                            <svg
                              className="h-3.5 w-3.5 text-slate-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              />
                            </svg>
                            <span className="text-xs font-medium text-slate-700">
                              Select Inspections:
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({selectedCheckpoint.inspections?.length || 0}{" "}
                              available)
                            </span>
                            {selectedInspections.length > 0 && (
                              <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full ml-1">
                                {selectedInspections.length} selected
                              </span>
                            )}
                          </div>

                          <div className="flex-1"></div>

                          {/* Batch Selection Options */}
                          <div className="flex gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                const allIds = (
                                  selectedCheckpoint.inspections || []
                                ).map((ins) => ins.inspectionId);
                                setSelectedInspections(allIds);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition border border-blue-200"
                            >
                              Select All
                            </button>
                            <button
                              onClick={() => {
                                const passedIds = (
                                  selectedCheckpoint.inspections || []
                                )
                                  .filter(
                                    (ins) =>
                                      ins.status === "Pass" ||
                                      ins.status === "OK",
                                  )
                                  .map((ins) => ins.inspectionId);
                                setSelectedInspections(passedIds);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-green-50 text-green-600 hover:bg-green-100 transition border border-green-200"
                            >
                              Passed Only
                            </button>
                            <button
                              onClick={() => {
                                const failedIds = (
                                  selectedCheckpoint.inspections || []
                                )
                                  .filter((ins) => ins.status === "Fail")
                                  .map((ins) => ins.inspectionId);
                                setSelectedInspections(failedIds);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition border border-red-200"
                            >
                              Failed Only
                            </button>
                            <button
                              onClick={() => {
                                const latestIds = (
                                  selectedCheckpoint.inspections || []
                                )
                                  .slice(0, 20)
                                  .map((ins) => ins.inspectionId);
                                setSelectedInspections(latestIds);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition border border-purple-200"
                            >
                              Latest 20
                            </button>
                            <button
                              onClick={() => setSelectedInspections([])}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 transition border border-slate-200"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  selectedInspections.length > 0 &&
                                  selectedCheckpoint
                                ) {
                                  setChartData(null);
                                  fetchControlChart(
                                    selectedCheckpoint,
                                    selectedInspections,
                                  );
                                } else {
                                  toast.error(
                                    "Please select at least one inspection",
                                  );
                                }
                              }}
                              className="px-3 py-1 rounded-lg text-[10px] sm:text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition shadow-sm"
                            >
                              <div className="flex items-center gap-1.5">
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0-5V5a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                  />
                                </svg>
                                Generate Chart
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Inspection List with Summary Stats */}
                        <div className="mt-3 max-h-[150px] overflow-y-auto border border-slate-100 rounded-lg p-2 custom-scrollbar">
                          <div className="space-y-1">
                            {(selectedCheckpoint.inspections || []).map(
                              (ins, index) => {
                                const isSelected = selectedInspections.includes(
                                  ins.inspectionId,
                                );
                                const date = ins.date || "N/A";
                                const batch = ins.batchNumber || "N/A";
                                const itemName = ins.itemName || "N/A";
                                const itemDesc = ins.itemDescription || "";
                                const processName = ins.processName || "N/A";
                                const status = ins.status || "Pending";
                                const isPass =
                                  status === "Pass" || status === "OK";
                                const cpk = ins.cpk;

                                return (
                                  <label
                                    key={ins.inspectionId || index}
                                    className={`flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition hover:bg-slate-50 ${
                                      isSelected
                                        ? "bg-blue-50/50 border border-blue-200"
                                        : "border border-transparent"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedInspections([
                                            ...selectedInspections,
                                            ins.inspectionId,
                                          ]);
                                        } else {
                                          setSelectedInspections(
                                            selectedInspections.filter(
                                              (id) => id !== ins.inspectionId,
                                            ),
                                          );
                                        }
                                      }}
                                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1 text-[10px] sm:text-xs">
                                      <span className="font-medium text-slate-700">
                                        #{index + 1}
                                      </span>
                                      <span className="text-slate-300">|</span>
                                      <span className="text-slate-600">
                                        {date}
                                      </span>
                                      <span className="text-slate-300">|</span>
                                      <span className="text-slate-600">
                                        Batch: {batch}
                                      </span>
                                      <span className="text-slate-300">|</span>
                                      <span className="text-slate-600 truncate">
                                        {itemName}
                                      </span>
                                      {itemDesc && (
                                        <>
                                          <span className="text-slate-300">
                                            |
                                          </span>
                                          <span className="text-slate-400 text-[9px] truncate">
                                            {itemDesc}
                                          </span>
                                        </>
                                      )}
                                      <span className="text-slate-300">|</span>
                                      <span className="text-slate-600">
                                        {processName}
                                      </span>
                                      {cpk && (
                                        <>
                                          <span className="text-slate-300">
                                            |
                                          </span>
                                          <span
                                            className={`font-medium ${cpk >= 1.33 ? "text-green-600" : cpk >= 1.0 ? "text-yellow-600" : "text-red-600"}`}
                                          >
                                            Cpk: {cpk.toFixed(3)}
                                          </span>
                                        </>
                                      )}
                                      <span className="text-slate-300">|</span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${
                                          isPass
                                            ? "bg-green-100 text-green-700"
                                            : status === "Fail"
                                              ? "bg-red-100 text-red-700"
                                              : "bg-yellow-100 text-yellow-700"
                                        }`}
                                      >
                                        {status}
                                      </span>
                                    </div>
                                  </label>
                                );
                              },
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                          <span>
                            Selected: {selectedInspections.length} of{" "}
                            {(selectedCheckpoint.inspections || []).length}
                          </span>
                          <span>
                            Passed:{" "}
                            {
                              (selectedCheckpoint.inspections || []).filter(
                                (ins) =>
                                  ins.status === "Pass" || ins.status === "OK",
                              ).length
                            }
                          </span>
                          <span className="text-red-500">
                            Failed:{" "}
                            {
                              (selectedCheckpoint.inspections || []).filter(
                                (ins) => ins.status === "Fail",
                              ).length
                            }
                          </span>
                          {selectedInspections.length > 0 && (
                            <button
                              onClick={() => {
                                setChartData(null);
                                fetchControlChart(
                                  selectedCheckpoint,
                                  selectedInspections,
                                );
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Generate Chart →
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 5: Subgroup Filter */}
                    {selectedCheckpoint &&
                      chartData?.chart &&
                      effectiveChartType === "xbar-r" && (
                        <SubgroupFilter
                          subgroups={subgroupOptions}
                          selectedSubgroup={selectedSubgroup}
                          onSelect={setSelectedSubgroup}
                          chartType={effectiveChartType}
                          onChartTypeChange={(type) => {
                            setChartType(type);
                            setChartTypeSelectedByUser(true);
                            if (selectedCheckpoint) {
                              setChartData(null);
                              fetchControlChart(
                                selectedCheckpoint,
                                selectedInspections,
                              );
                            }
                          }}
                        />
                      )}

                    {/* Step 6: Chart Display */}
                    {chartLoading ? (
                      <div className="flex min-h-[250px] sm:min-h-[400px] items-center justify-center bg-white rounded-xl border border-slate-200">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mr-3" />
                        <span className="text-sm sm:text-base text-slate-600">
                          Loading chart data...
                        </span>
                      </div>
                    ) : selectedCheckpoint && chartData?.chart ? (
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-6">
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                          <span className="font-medium text-slate-700">
                            Chart Generated For:
                          </span>
                          <span className="text-blue-600 font-medium">
                            {selectedInspections.length || 0} inspections
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-600">
                            Chart Type: {getSPCChartTypeLabel(effectiveChartType)}
                          </span>
                          {effectiveChartType === "xbar-r" && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="text-slate-600">
                                Subgroups: {subgroupOptions.length}
                              </span>
                            </>
                          )}
                          {chartData?.chart?.subgroupSize && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="text-slate-600">
                                n={chartData.chart.subgroupSize}
                              </span>
                            </>
                          )}

                          {/* Baseline Status Badge */}
                          {chartData?.chart?.baselineStatus && (
                            <>
                              <span className="text-slate-300">|</span>
                              <div
                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                                  chartData.chart.baselineStatus ===
                                    "APPROVED" ||
                                  chartData.chart.baselineStatus === "Approved"
                                    ? "bg-green-50 border-green-200"
                                    : chartData.chart.baselineStatus ===
                                          "BUILDING_BASELINE" ||
                                        chartData.chart.baselineStatus ===
                                          "Awaiting Baseline"
                                      ? "bg-yellow-50 border-yellow-200"
                                      : "bg-blue-50 border-blue-200"
                                }`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    chartData.chart.baselineStatus ===
                                      "APPROVED" ||
                                    chartData.chart.baselineStatus ===
                                      "Approved"
                                      ? "bg-green-500"
                                      : chartData.chart.baselineStatus ===
                                            "BUILDING_BASELINE" ||
                                          chartData.chart.baselineStatus ===
                                            "Awaiting Baseline"
                                        ? "bg-yellow-500"
                                        : "bg-blue-500"
                                  }`}
                                />
                                <span className="text-[10px] font-medium">
                                  Baseline:{" "}
                                  {chartData.chart.baselineStatus?.replace(
                                    "_",
                                    " ",
                                  )}
                                  {chartData.chart.activeBaselineVersion &&
                                    ` v${chartData.chart.activeBaselineVersion}`}
                                </span>
                              </div>
                            </>
                          )}

                          {chartData?.chart?.controlMode === "auto" &&
                            !chartData?.chart?.isFrozen && (
                              <>
                                <span className="text-slate-300">|</span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-200">
                                  <Loader2 className="h-3 w-3 animate-spin text-yellow-600" />
                                  <span className="text-[10px] font-medium text-yellow-700">
                                    Auto-calc:{" "}
                                    {chartData?.chart?.subgroupsCollected || 0}/
                                    {chartData?.chart?.minimumSubgroups || 20}
                                  </span>
                                </div>
                              </>
                            )}

                          {chartData?.chart?.isFrozen && (
                            <>
                              <span className="text-slate-300">|</span>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                                <CheckCircle className="h-3 w-3 text-blue-600" />
                                <span className="text-[10px] font-medium text-blue-700">
                                  Limits Frozen
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        <CheckpointDetailsCard
                          checkpoint={selectedCheckpoint}
                          inspection={getLatestInspection(selectedCheckpoint)}
                        />
                        <div className="mt-4 sm:mt-6">
                          <ControlChart
                            chart={chartData.chart}
                            selectedSubgroup={selectedSubgroup}
                            startDate={activeChartDateRange.startDate}
                            endDate={activeChartDateRange.endDate}
                            initialVisiblePoints={getInitialVisiblePointsForRange(
                              filters.timeRange,
                            )}
                            title={`${selectedCheckpoint.checkpointName} - Control Chart`}
                            height={550}
                            chartType={effectiveChartType}
                            onCreateBaseline={() => setShowBaselineModal(true)}
                            onApproveBaseline={() => handleApproveBaseline()}
                            approvingBaseline={approvingBaseline}
                            onViewBaselineHistory={() => {
                              if (selectedCheckpoint) {
                                fetchBaselineHistory(selectedCheckpoint);
                              }
                            }}
                          />
                        </div>
                      </div>
                    ) : selectedCheckpoint ? (
                      <div className="flex min-h-[200px] sm:min-h-[400px] items-center justify-center bg-white rounded-xl border border-slate-200">
                        <div className="text-center px-4">
                          <AlertCircle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-300" />
                          <p className="mt-2 text-xs sm:text-sm text-slate-500">
                            {selectedInspections.length > 0
                              ? "Click 'Generate Chart' to view the control chart"
                              : "Select at least one inspection and click 'Generate Chart'"}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-400">
                            {selectedInspections.length > 0
                              ? `${selectedInspections.length} inspection(s) selected`
                              : "Use the checkboxes above to select inspections"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[200px] sm:min-h-[400px] items-center justify-center bg-white rounded-xl border border-dashed border-slate-300">
                        <div className="text-center px-4">
                          <LineChart className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-300" />
                          <p className="mt-2 text-xs sm:text-sm text-slate-500">
                            Select a checkpoint to get started
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-400">
                            Choose a checkpoint from the dropdown above
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Close
          </button>
         
        </div>

        {/* Chart Modal */}
        {showChartModal && selectedCheckpoint && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-[98vw] max-w-[1600px] max-h-[96vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2 z-10">
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-bold text-slate-800 truncate">
                    Control Chart: {selectedCheckpoint.checkpointName}
                  </h3>
                  <p className="text-[10px] sm:text-sm text-slate-500 truncate">
                    {getReadableText(
                      selectedCheckpoint.inspections?.[0]?.itemCode,
                      selectedCheckpoint.inspections?.[0]?.itemName,
                      selectedCheckpoint.itemName,
                    ) || "Checkpoint"}{" "}
                    • {selectedCheckpoint.resultType || "Result"} •{" "}
                    {selectedCheckpoint.spcMethod || effectiveChartType || "SPC"} •{" "}
                    {selectedInspections.length ||
                      selectedCheckpoint.inspections?.length ||
                      0}{" "}
                    inspections
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowChartModal(false);
                    setSelectedCheckpoint(null);
                    setChartData(null);
                  }}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition flex-shrink-0"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>

              <div className="p-3 sm:p-6">
                <CheckpointDetailsCard
                  checkpoint={selectedCheckpoint}
                  inspection={getLatestInspection(selectedCheckpoint)}
                />

                <div className="mt-4 sm:mt-6">
                  {chartLoading ? (
                    <div className="flex min-h-[250px] sm:min-h-[400px] items-center justify-center">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mr-3" />
                      <span className="text-sm sm:text-base text-slate-600">
                        Loading chart data...
                      </span>
                    </div>
                  ) : chartData?.chart ? (
                    <ControlChart
                      chart={chartData.chart}
                      selectedSubgroup={selectedSubgroup}
                      startDate={activeChartDateRange.startDate}
                      endDate={activeChartDateRange.endDate}
                      initialVisiblePoints={getInitialVisiblePointsForRange(
                        filters.timeRange,
                      )}
                      title={`${selectedCheckpoint.checkpointName} - Control Chart`}
                      height={600}
                      chartType={effectiveChartType}
                      onCreateBaseline={() => setShowBaselineModal(true)}
                      onApproveBaseline={() => handleApproveBaseline()}
                      approvingBaseline={approvingBaseline}
                      onViewBaselineHistory={() => {
                        if (selectedCheckpoint) {
                          fetchBaselineHistory(selectedCheckpoint);
                        }
                      }}
                    />

                  ) : (
                    <div className="flex min-h-[200px] sm:min-h-[400px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
                      <div className="text-center px-4">
                        <TrendingUp className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-300" />
                        <p className="mt-2 text-xs sm:text-sm text-slate-500">
                          No chart data available
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-400">
                          Try selecting a different checkpoint
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <CreateBaselineModal
          isOpen={showBaselineModal}
          onClose={() => setShowBaselineModal(false)}
          chart={chartData?.chart}
          checkpoint={selectedCheckpoint}
          onSubmit={handleCreateBaseline}
          isSubmitting={creatingBaseline}
        />

        <BaselineHistoryModal
          isOpen={showBaselineHistory}
          onClose={() => {
            setShowBaselineHistory(false);
            setBaselineHistory([]);
          }}
          baselines={baselineHistory}
          loading={loadingHistory}
        />
      </div>
    </div>
  );
};

export default SPCDashboard;
