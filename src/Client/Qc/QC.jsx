import {
  ClipboardMinus,
  FileCheck,
  Pencil,
  Trash2,
  X,
  Plus,
  Copy,
  Eye,
  Trash,
  FileText,
  Building2,
  Clock,
  User,
  BarChart3,
  TrendingUp,
  ImageIcon,
  Download,
  Printer,
  RotateCw,
  CircleHelp,
  ClipboardList,
} from "lucide-react";
import { Wifi, WifiOff, Signal, SignalZero } from "lucide-react";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import * as XLSX from "xlsx";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

import { Bar, Pie, Line } from "react-chartjs-2";
import axios from "axios";
import toast from "react-hot-toast";
import CheckpointModal from "./CheckPointModal";
import SPCDashboardModal from "./SpcDashboard";
import { useSocket } from "../../context/SocketContext";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
);

const toFiniteNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toPositiveInteger = (value, fallback = 1) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const toNonNegativeInteger = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

const getGaugeIdentity = (gauge = {}, index = 0) =>
  String(
    gauge.id ||
      gauge._id ||
      gauge.serialNumber ||
      gauge.certificateNumber ||
      gauge.name ||
      `gauge-${index + 1}`,
  );

const isGaugeCalibrationExpired = (calibrationDue) => {
  if (!calibrationDue) return false;
  const dueDate = new Date(calibrationDue);
  return !Number.isNaN(dueDate.getTime()) && dueDate < new Date();
};

const getCheckpointKey = (checkpoint, index = 0) => {
  // The immutable characteristic ID is the canonical key on both sides.
  const key =
    checkpoint?.characteristicId ??
    checkpoint?.checkpointId ??
    checkpoint?.id ??
    checkpoint?._id ??
    checkpoint?.name ??
    `checkpoint-${index + 1}`;

  return String(key);
};

const getConfiguredGaugeMode = (checkpoint = {}) => {
  const rawMode =
    checkpoint.gaugeMode ||
    checkpoint.goNoGoMode ||
    checkpoint.gaugeResultMode ||
    checkpoint.selectedGaugeType ||
    checkpoint.configuredGauge?.mode ||
    checkpoint.selectedGauge?.mode ||
    checkpoint.configuredGauge?.type ||
    checkpoint.selectedGauge?.type ||
    checkpoint.instrumentRequirements?.configuredGauge?.mode ||
    checkpoint.instrumentRequirements?.selectedGauge?.mode ||
    checkpoint.instrumentRequirements?.configuredGauge?.type ||
    checkpoint.instrumentRequirements?.selectedGauge?.type ||
    checkpoint.gaugeType ||
    "";
  const normalized = String(rawMode)
    .trim()
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

  if (
    normalized.includes("both") ||
    normalized.includes("combined") ||
    normalized.includes("double ended") ||
    /go\s*\/\s*no\s*-?\s*go/.test(normalized) ||
    /go\s*-\s*no\s*-?\s*go/.test(normalized) ||
    normalized === "go no go" ||
    normalized === "gonogo"
  ) {
    return "both";
  }
  if (/^no\s*-?\s*go\b/.test(normalized)) return "no_go";
  if (/^go\b/.test(normalized) && !/no\s*-?\s*go/.test(normalized)) {
    return "go";
  }

  const hasGoCondition = Boolean(String(checkpoint.goCondition || "").trim());
  const hasNoGoCondition = Boolean(
    String(checkpoint.noGoCondition || "").trim(),
  );
  if (hasGoCondition && !hasNoGoCondition) return "go";
  if (hasNoGoCondition && !hasGoCondition) return "no_go";
  return "both";
};

const getConfiguredGaugeModeLabel = (mode) =>
  mode === "go"
    ? "GO gauge"
    : mode === "no_go"
      ? "NO-GO gauge"
      : "GO/NO-GO gauge";

const getConfiguredGaugeSource = (checkpoint = {}) => {
  const candidates = [
    checkpoint.configuredGauge,
    checkpoint.selectedGauge,
    checkpoint.gauge,
    checkpoint.instrument,
    checkpoint.gaugeDetails,
    checkpoint.instrumentDetails,
    checkpoint.instrumentRequirements?.configuredGauge,
    checkpoint.instrumentRequirements?.selectedGauge,
  ];
  return (
    candidates.find(
      (candidate) => candidate && typeof candidate === "object",
    ) || {}
  );
};

const getExplicitConfiguredGaugeIdentity = (checkpoint = {}) => {
  const source = getConfiguredGaugeSource(checkpoint);
  const identity =
    checkpoint.configuredGaugeId ||
    checkpoint.selectedGaugeId ||
    checkpoint.registeredGaugeId ||
    checkpoint.gaugeAssetId ||
    checkpoint.gaugeId ||
    checkpoint.selectedInstrumentId ||
    checkpoint.instrumentAssetId ||
    checkpoint.instrumentId ||
    checkpoint.instrumentRequirements?.configuredGaugeId ||
    checkpoint.instrumentRequirements?.selectedGaugeId ||
    checkpoint.instrumentRequirements?.gaugeId ||
    source.id ||
    source._id ||
    source.serialNumber ||
    source.certificateNumber;
  if (identity !== null && identity !== undefined && String(identity).trim()) {
    return String(identity).trim();
  }
  return "";
};

const getConfiguredGaugeIdentity = (checkpoint = {}, index = 0) => {
  const explicitIdentity = getExplicitConfiguredGaugeIdentity(checkpoint);
  if (explicitIdentity) return explicitIdentity;

  const source = getConfiguredGaugeSource(checkpoint);

  const hasConfiguredGauge = Boolean(
    checkpoint.inspectionMethod === "go_nogo" ||
    checkpoint.gaugeType ||
    checkpoint.gaugeSpecification ||
    checkpoint.instrumentType ||
    checkpoint.instrumentRequirements?.instrumentType ||
    source.name ||
    source.type,
  );
  return hasConfiguredGauge
    ? `checkpoint-gauge:${getCheckpointKey(checkpoint, index)}`
    : "";
};

const getConfiguredGaugeSnapshot = (checkpoint = {}, index = 0) => {
  const id = getConfiguredGaugeIdentity(checkpoint, index);
  if (!id) return null;

  const source = getConfiguredGaugeSource(checkpoint);
  const mode = getConfiguredGaugeMode(checkpoint);
  const type =
    source.type ||
    checkpoint.gaugeType ||
    checkpoint.instrumentType ||
    checkpoint.instrumentRequirements?.instrumentType ||
    getConfiguredGaugeModeLabel(mode);

  return {
    id,
    name:
      source.name ||
      checkpoint.gaugeName ||
      checkpoint.selectedGaugeName ||
      checkpoint.configuredGaugeName ||
      checkpoint.instrumentName ||
      type,
    type,
    mode,
    specification: source.specification || checkpoint.gaugeSpecification || "",
    serialNumber:
      source.serialNumber ||
      checkpoint.gaugeSerialNumber ||
      checkpoint.configuredGaugeSerialNumber ||
      checkpoint.serialNumber ||
      "",
    calibrationDate:
      source.calibrationDate || checkpoint.gaugeCalibrationDate || "",
    calibrationDue:
      source.calibrationDue || checkpoint.gaugeCalibrationDue || "",
    certificateNumber:
      source.certificateNumber ||
      checkpoint.calibrationCertificateNumber ||
      checkpoint.certificateNumber ||
      "",
    manufacturer: source.manufacturer || checkpoint.gaugeManufacturer || "",
    resolution:
      source.resolution ||
      checkpoint.minimumResolution ||
      checkpoint.instrumentRequirements?.minimumResolution ||
      "",
  };
};

const getGoNoGoPiecePass = (piece = {}, mode = "both") => {
  if (typeof piece.gaugePassed === "boolean") return piece.gaugePassed;
  if (mode === "go") {
    return typeof piece.goAccepted === "boolean" ? piece.goAccepted : null;
  }
  if (mode === "no_go") {
    return typeof piece.noGoPrevented === "boolean"
      ? piece.noGoPrevented
      : null;
  }
  return typeof piece.goAccepted === "boolean" &&
    typeof piece.noGoPrevented === "boolean"
    ? piece.goAccepted && piece.noGoPrevented
    : null;
};

const getCheckpointResultType = (checkpoint = {}) => {
  if (checkpoint.resultType) return checkpoint.resultType;
  const legacyType = String(checkpoint.type || "").toLowerCase();
  if (legacyType === "measurement" || legacyType === "dimension") {
    return "numeric";
  }
  if (legacyType === "approval") return "approval";
  return "binary";
};

const isNumericCheckpoint = (checkpoint) =>
  getCheckpointResultType(checkpoint) === "numeric";

const deriveLegacyLimits = (nominal, tolerance) => {
  const center = toFiniteNumberOrNull(nominal);
  const text = String(tolerance || "")
    .trim()
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, "");

  let lsl = null;
  let usl = null;

  if (center !== null) {
    const bilateral = text.match(/±([+-]?\d+(?:\.\d+)?)/);
    if (bilateral) {
      const amount = Math.abs(Number(bilateral[1]));
      return { lsl: center - amount, usl: center + amount };
    }

    // Supports +0.2/-0.1, +0.2/0 and 0/-0.2.
    const unilateral = text.match(/([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)/);
    if (unilateral) {
      const first = Number(unilateral[1]);
      const second = Number(unilateral[2]);
      if (Number.isFinite(first) && Number.isFinite(second)) {
        lsl = center + Math.min(first, second);
        usl = center + Math.max(first, second);
        return { lsl, usl };
      }
    }
  }

  const range = text.match(/(-?\d+(?:\.\d+)?)(?:-|to)(-?\d+(?:\.\d+)?)/i);
  if (range) {
    const first = Number(range[1]);
    const second = Number(range[2]);
    return { lsl: Math.min(first, second), usl: Math.max(first, second) };
  }

  const minimum = text.match(/(?:min(?:imum)?|>=|≥)(-?\d+(?:\.\d+)?)/i);
  if (minimum) lsl = Number(minimum[1]);

  const maximum = text.match(/(?:max(?:imum)?|<=|≤)(-?\d+(?:\.\d+)?)/i);
  if (maximum) usl = Number(maximum[1]);

  return { lsl, usl };
};

const getCheckpointSpecification = (checkpoint = {}) => {
  const nested = checkpoint.specification || {};
  const nominal = toFiniteNumberOrNull(
    nested.nominal ?? checkpoint.nominalValue ?? checkpoint.expectedValue,
  );

  let lsl = toFiniteNumberOrNull(
    nested.lsl ?? checkpoint.lsl ?? checkpoint.lowerSpecLimit,
  );
  let usl = toFiniteNumberOrNull(
    nested.usl ?? checkpoint.usl ?? checkpoint.upperSpecLimit,
  );

  if (lsl === null && usl === null) {
    const legacy = deriveLegacyLimits(nominal, checkpoint.tolerance);
    lsl = legacy.lsl;
    usl = legacy.usl;
  }

  return {
    nominal,
    lsl,
    usl,
    unit: nested.unit || checkpoint.unit || "",
    decimalPrecision: toNonNegativeInteger(
      nested.decimalPrecision ?? checkpoint.decimalPrecision,
      3,
    ),
    toleranceType:
      nested.toleranceType || checkpoint.toleranceType || "informational",
    display: checkpoint.specificationDisplay || checkpoint.tolerance || "",
  };
};

const getCheckpointSampling = (checkpoint = {}) => {
  const piecesPerInspection = toPositiveInteger(
    checkpoint.sampling?.piecesPerInspection ??
      checkpoint.piecesPerInspection ??
      checkpoint.sampleSize,
    1,
  );
  const readingsPerPiece = toPositiveInteger(
    checkpoint.sampling?.readingsPerPiece ?? checkpoint.readingsPerPiece,
    1,
  );
  const subgroupSize = toPositiveInteger(
    checkpoint.sampling?.subgroupSize ??
      checkpoint.subgroupSize ??
      piecesPerInspection,
    piecesPerInspection,
  );

  return {
    piecesPerInspection,
    readingsPerPiece,
    subgroupSize,
  };
};

const normalizeSPCMethod = (
  value,
  plannedSubgroupSize = 1,
  resultType = "numeric",
  sampleSizeMode = "constant",
) => {
  if (resultType !== "numeric") {
    const token = String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
    if (["nospc", "none", "disabled", "off"].includes(token)) {
      return "No SPC";
    }
    if (token.startsWith("np")) return "NP Chart";
    if (token.startsWith("p")) return "P Chart";
    if (token.startsWith("u")) return "U Chart";
    if (token.startsWith("c")) return "C Chart";
    if (["binary", "defective_count"].includes(resultType)) {
      return String(sampleSizeMode).toLowerCase() === "variable"
        ? "P Chart"
        : "NP Chart";
    }
    if (resultType === "defect_count") {
      return String(sampleSizeMode).toLowerCase() === "variable"
        ? "U Chart"
        : "C Chart";
    }
    return "No SPC";
  }

  const raw = String(value || "").trim();
  const compact = raw
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/[^a-z0-9]/g, "");

  if (!compact || ["auto", "recommended"].includes(compact)) {
    return Number(plannedSubgroupSize) === 1 ? "I-MR" : "X-bar R";
  }

  if (["nospc", "none", "disabled", "off"].includes(compact)) {
    return "No SPC";
  }

  if (
    compact === "imr" ||
    compact === "xmr" ||
    compact.includes("individualmovingrange") ||
    compact.includes("individualmr")
  ) {
    return "I-MR";
  }

  if (
    compact === "xbars" ||
    compact.includes("xbarstandarddeviation") ||
    (compact.includes("xbar") && compact.endsWith("s"))
  ) {
    return "X-bar S";
  }

  if (
    compact === "xbarr" ||
    compact.includes("xbarrange") ||
    (compact.includes("xbar") && compact.endsWith("r"))
  ) {
    return "X-bar R";
  }

  return raw;
};

const getControlChartDisplayName = (chart) => {
  const type = String(chart?.type || "")
    .trim()
    .toLowerCase();
  if (type === "imr" || type === "i-mr" || type === "x-mr") {
    return "I-MR Control Chart";
  }
  if (["xbar-r", "x-bar-r", "xbar r", "x-bar r"].includes(type)) {
    return "X-bar R Control Chart";
  }
  if (type === "p") return "P Control Chart — Fraction Defective";
  if (type === "np") return "NP Control Chart — Number Defective";
  if (type === "c") return "C Control Chart — Defect Count";
  if (type === "u") return "U Control Chart — Defects per Opportunity";
  return "SPC Control Chart";
};

const getControlChartSampleSizeLabel = (chart = {}) => {
  const type = String(chart.type || "")
    .trim()
    .toLowerCase();
  const metadata = Array.isArray(chart.subgroupMetadata)
    ? chart.subgroupMetadata
    : [];
  const sampleSizes = metadata
    .map((entry) => Number(entry?.sampleSize))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (type === "p") {
    const uniqueSizes = [...new Set(sampleSizes)];
    if (uniqueSizes.length > 1) {
      return `Variable n (${Math.min(...uniqueSizes)}–${Math.max(...uniqueSizes)})`;
    }
    if (uniqueSizes.length === 1) return `n=${uniqueSizes[0]}`;
    return "Variable n";
  }

  if (["np", "c", "u"].includes(type)) {
    const constantSize =
      toFiniteNumberOrNull(chart.subgroupSize) ?? sampleSizes[0] ?? null;
    return constantSize === null ? "n=—" : `n=${constantSize}`;
  }

  return `n=${toFiniteNumberOrNull(chart.subgroupSize) ?? 1}`;
};

const isAcceptedRecommendation = (recommendation, status = "") =>
  ["PASS", "PASS_BASED_ON_PDI"].includes(
    String(recommendation || "")
      .trim()
      .toUpperCase(),
  ) ||
  String(status || "")
    .trim()
    .toUpperCase() === "LOT ACCEPTED";

const formatRecommendation = (recommendation) => {
  const value = String(recommendation || "HOLD")
    .trim()
    .toUpperCase();
  if (value === "PASS_BASED_ON_PDI") return "PASS (PDI)";
  return value.replaceAll("_", " ");
};

const getCheckpointRequirement = (checkpoint = {}) => {
  const resultType = getCheckpointResultType(checkpoint);
  const specification = getCheckpointSpecification(checkpoint);

  if (resultType === "numeric") {
    const { nominal, lsl, usl, unit, display } = specification;
    if (display && display !== "Informational") {
      return nominal !== null
        ? `${nominal} ${display} ${unit}`.trim()
        : `${display} ${unit}`.trim();
    }
    if (lsl !== null && usl !== null) return `${lsl}–${usl} ${unit}`.trim();
    if (lsl !== null) return `≥ ${lsl} ${unit}`.trim();
    if (usl !== null) return `≤ ${usl} ${unit}`.trim();
    return nominal !== null ? `${nominal} ${unit}`.trim() : "Informational";
  }

  if (checkpoint.inspectionMethod === "go_nogo") {
    const mode = getConfiguredGaugeMode(checkpoint);
    if (mode === "go") {
      return checkpoint.goCondition || "GO gauge: part must enter";
    }
    if (mode === "no_go") {
      return checkpoint.noGoCondition || "NO-GO gauge: part must not enter";
    }
    return `${checkpoint.goCondition || "GO gauge: part must enter"}; ${
      checkpoint.noGoCondition || "NO-GO gauge: part must not enter"
    }`;
  }

  if (resultType === "defective_count") {
    return `Maximum ${Number(checkpoint.allowedDefectivePieces || 0)} rejected piece(s)`;
  }

  if (resultType === "defect_count") {
    return `Maximum ${Number(checkpoint.allowedDefectCount || 0)} defect(s)`;
  }

  return (
    checkpoint.acceptanceStandard ||
    checkpoint.gaugeSpecification ||
    checkpoint.severityRules ||
    "As per approved inspection plan"
  );
};

const evaluateNumericResultAgainstCheckpoint = (value, checkpoint) => {
  const numericValue = toFiniteNumberOrNull(value);
  const { lsl, usl } = getCheckpointSpecification(checkpoint);

  if (numericValue === null) {
    return {
      status: "Pending",
      pass: null,
      deviation: null,
      reason: "",
    };
  }

  if (lsl !== null && numericValue < lsl) {
    return {
      status: "Fail",
      pass: false,
      deviation: numericValue - lsl,
      reason: `Below LSL by ${(lsl - numericValue).toFixed(4)}`,
    };
  }

  if (usl !== null && numericValue > usl) {
    return {
      status: "Fail",
      pass: false,
      deviation: numericValue - usl,
      reason: `Above USL by ${(numericValue - usl).toFixed(4)}`,
    };
  }

  const nominal = getCheckpointSpecification(checkpoint).nominal;
  return {
    status: "OK",
    pass: true,
    deviation: nominal === null ? 0 : numericValue - nominal,
    reason:
      lsl === null && usl === null
        ? "Recorded — no specification limit"
        : "Within specification",
  };
};

const buildCheckpointEntryState = (checkpoint = {}, index = 0) => {
  const resultType = getCheckpointResultType(checkpoint);
  const specification = getCheckpointSpecification(checkpoint);
  const sampling = getCheckpointSampling(checkpoint);
  const gaugeMode = getConfiguredGaugeMode(checkpoint);

  return {
    checkpointId: getCheckpointKey(checkpoint, index),
    resultType,
    expected: specification.nominal ?? "",
    measured: "",
    unit: specification.unit,
    tolerance: specification.display,
    lsl: specification.lsl,
    usl: specification.usl,
    pass: null,
    deviation: null,
    resultReason: "",
    rejectedCount: "",
    defectCount: "",
    inspectedCount: sampling.piecesPerInspection,
    attributeSampleSize: sampling.piecesPerInspection,
    opportunityCount:
      Number(checkpoint.opportunitiesPerUnit || 1) *
      sampling.piecesPerInspection,
    category: "",
    binaryResult: "",
    pieceResults:
      resultType === "binary" && sampling.piecesPerInspection > 1
        ? Array.from({ length: sampling.piecesPerInspection }, () => "")
        : [],
    approved: false,
    gaugeMode,
    gaugePassed: null,
    goAccepted: null,
    noGoPrevented: null,
    goNoGoResults:
      checkpoint.inspectionMethod === "go_nogo" &&
      sampling.piecesPerInspection > 1
        ? Array.from({ length: sampling.piecesPerInspection }, (_, index) => ({
            pieceNumber: index + 1,
            gaugeMode,
            gaugePassed: null,
            goAccepted: null,
            noGoPrevented: null,
          }))
        : [],
    instrumentId: getConfiguredGaugeIdentity(checkpoint, index),
    pieceMeasurements: [],
    rawReadings: [],
  };
};

const deriveCheckpointStatus = (checkpoint = {}, entry = {}) => {
  const resultType = getCheckpointResultType(checkpoint);

  if (resultType === "numeric") {
    if (Array.isArray(entry.rawReadings) && entry.rawReadings.length > 0) {
      if (entry.rawReadings.some((reading) => reading.pass === false)) {
        return {
          status: "Fail",
          pass: false,
          reason: "One or more readings failed",
        };
      }
      if (entry.rawReadings.every((reading) => reading.pass === true)) {
        return { status: "OK", pass: true, reason: "All readings passed" };
      }
    }
    return evaluateNumericResultAgainstCheckpoint(entry.measured, checkpoint);
  }

  if (checkpoint.inspectionMethod === "go_nogo") {
    const gaugeMode = getConfiguredGaugeMode(checkpoint);
    if (Array.isArray(entry.goNoGoResults) && entry.goNoGoResults.length > 0) {
      const outcomes = entry.goNoGoResults.map((piece) =>
        getGoNoGoPiecePass(piece, gaugeMode),
      );
      const complete = outcomes.every(
        (outcome) => typeof outcome === "boolean",
      );
      if (!complete) return { status: "Pending", pass: null };
      const defectiveCount = outcomes.filter(
        (outcome) => outcome !== true,
      ).length;
      const allowed = Math.max(
        0,
        Number(checkpoint.allowedDefectivePieces) || 0,
      );
      const pass = defectiveCount <= allowed;
      return { status: pass ? "OK" : "Fail", pass };
    }

    const outcome = getGoNoGoPiecePass(entry, gaugeMode);
    if (typeof outcome !== "boolean") {
      return { status: "Pending", pass: null };
    }
    const pass = outcome;
    return { status: pass ? "OK" : "Fail", pass };
  }

  if (resultType === "binary") {
    if (Array.isArray(entry.pieceResults) && entry.pieceResults.length > 0) {
      const complete = entry.pieceResults.every(
        (result) => result === "OK" || result === "Fail",
      );
      if (!complete) return { status: "Pending", pass: null };
      const defectiveCount = entry.pieceResults.filter(
        (result) => result === "Fail",
      ).length;
      const allowed = Math.max(
        0,
        Number(checkpoint.allowedDefectivePieces) || 0,
      );
      const pass = defectiveCount <= allowed;
      return { status: pass ? "OK" : "Fail", pass };
    }

    if (entry.binaryResult !== "OK" && entry.binaryResult !== "Fail") {
      return { status: "Pending", pass: null };
    }
    return {
      status: entry.binaryResult,
      pass: entry.binaryResult === "OK",
    };
  }

  if (resultType === "defective_count") {
    const count = toFiniteNumberOrNull(entry.rejectedCount);
    if (count === null) return { status: "Pending", pass: null };
    const allowed = Number(checkpoint.allowedDefectivePieces || 0);
    const pass = Number.isInteger(count) && count >= 0 && count <= allowed;
    return { status: pass ? "OK" : "Fail", pass };
  }

  if (resultType === "defect_count") {
    const count = toFiniteNumberOrNull(entry.defectCount);
    if (count === null) return { status: "Pending", pass: null };
    const allowed = Number(checkpoint.allowedDefectCount || 0);
    const pass = Number.isInteger(count) && count >= 0 && count <= allowed;
    return { status: pass ? "OK" : "Fail", pass };
  }

  if (resultType === "categorical") {
    if (!entry.category) return { status: "Pending", pass: null };
    const rejectCategories = checkpoint.rejectCategories || [
      "Major",
      "Critical",
    ];
    const pass = !rejectCategories.includes(entry.category);
    return { status: pass ? "OK" : "Fail", pass };
  }

  if (resultType === "approval") {
    return entry.approved
      ? { status: "OK", pass: true }
      : { status: "Pending", pass: null };
  }

  return { status: "Pending", pass: null };
};

const getCheckpointProgress = (
  checkpoint,
  checkpointId,
  measurementResults,
  checkpointMeasurements,
) => {
  const resultType = getCheckpointResultType(checkpoint);
  const entry = measurementResults[checkpointId] || {};

  if (resultType === "numeric") {
    const sampling = getCheckpointSampling(checkpoint);
    const required = sampling.piecesPerInspection * sampling.readingsPerPiece;
    if (required > 1) {
      const checkpointMeasurement = checkpointMeasurements[checkpointId] || {};
      const completed =
        checkpointMeasurement.rawReadings?.length ||
        entry.rawReadings?.length ||
        (checkpointMeasurement.pieceValues || []).reduce(
          (count, piece) =>
            count +
            (Array.isArray(piece.readings) && piece.readings.length > 0
              ? piece.readings.length
              : 1),
          0,
        ) ||
        0;
      return { completed, required };
    }
    return {
      completed: toFiniteNumberOrNull(entry.measured) === null ? 0 : 1,
      required: 1,
    };
  }

  if (
    checkpoint.inspectionMethod === "go_nogo" &&
    Array.isArray(entry.goNoGoResults) &&
    entry.goNoGoResults.length > 0
  ) {
    const gaugeMode = getConfiguredGaugeMode(checkpoint);
    return {
      completed: entry.goNoGoResults.filter(
        (piece) => typeof getGoNoGoPiecePass(piece, gaugeMode) === "boolean",
      ).length,
      required: entry.goNoGoResults.length,
    };
  }

  if (
    resultType === "binary" &&
    Array.isArray(entry.pieceResults) &&
    entry.pieceResults.length > 0
  ) {
    return {
      completed: entry.pieceResults.filter(
        (result) => result === "OK" || result === "Fail",
      ).length,
      required: entry.pieceResults.length,
    };
  }

  const decision = deriveCheckpointStatus(checkpoint, entry);
  return { completed: decision.status === "Pending" ? 0 : 1, required: 1 };
};

const normalizeFrontendRawReading = (
  reading,
  fallbackPieceNumber = 1,
  fallbackReadingNumber = 1,
) => {
  const value = toFiniteNumberOrNull(
    reading?.value ?? reading?.measured ?? reading,
  );
  if (value === null) return null;

  return {
    pieceNumber: Math.max(
      1,
      Number(reading?.pieceNumber ?? fallbackPieceNumber) || 1,
    ),
    readingNumber: Math.max(
      1,
      Number(reading?.readingNumber ?? fallbackReadingNumber) || 1,
    ),
    value,
    pass: typeof reading?.pass === "boolean" ? reading.pass : null,
    deviation: reading?.deviation === undefined ? null : reading.deviation,
    resultReason: reading?.resultReason || reading?.reason || "",
    instrumentId: reading?.instrumentId || "",
    measuredAt: reading?.measuredAt || new Date().toISOString(),
  };
};

const collectFrontendRawReadings = ({
  checkpointId,
  entry = {},
  checkpointMeasurement = {},
  pieces = [],
}) => {
  const readingsByPosition = new Map();

  const append = (
    reading,
    fallbackPieceNumber = 1,
    fallbackReadingNumber = 1,
  ) => {
    const normalized = normalizeFrontendRawReading(
      reading,
      fallbackPieceNumber,
      fallbackReadingNumber,
    );
    if (!normalized) return;

    // The most recent source wins for the same piece/reading position.
    const key = `${normalized.pieceNumber}:${normalized.readingNumber}`;
    readingsByPosition.set(key, normalized);
  };

  (checkpointMeasurement?.rawReadings || []).forEach((reading, index) =>
    append(
      reading,
      reading?.pieceNumber || index + 1,
      reading?.readingNumber || 1,
    ),
  );

  (entry?.rawReadings || []).forEach((reading, index) =>
    append(
      reading,
      reading?.pieceNumber || index + 1,
      reading?.readingNumber || 1,
    ),
  );

  (checkpointMeasurement?.pieceValues || []).forEach(
    (pieceValue, pieceIndex) => {
      if (
        Array.isArray(pieceValue?.readings) &&
        pieceValue.readings.length > 0
      ) {
        pieceValue.readings.forEach((reading, readingIndex) =>
          append(
            reading,
            pieceValue.pieceNumber || pieceIndex + 1,
            reading.readingNumber || readingIndex + 1,
          ),
        );
      } else {
        append(pieceValue, pieceValue?.pieceNumber || pieceIndex + 1, 1);
      }
    },
  );

  (entry?.pieceMeasurements || []).forEach((pieceValue, pieceIndex) => {
    if (Array.isArray(pieceValue?.readings) && pieceValue.readings.length > 0) {
      pieceValue.readings.forEach((reading, readingIndex) =>
        append(
          reading,
          pieceValue.pieceNumber || pieceValue.piece || pieceIndex + 1,
          reading.readingNumber || readingIndex + 1,
        ),
      );
    } else {
      append(
        pieceValue,
        pieceValue?.pieceNumber || pieceValue?.piece || pieceIndex + 1,
        1,
      );
    }
  });

  (Array.isArray(pieces) ? pieces : []).forEach((piece, pieceIndex) => {
    const pieceMeasurement = piece?.measurements?.[checkpointId];
    if (!pieceMeasurement) return;

    if (
      Array.isArray(pieceMeasurement.readings) &&
      pieceMeasurement.readings.length > 0
    ) {
      pieceMeasurement.readings.forEach((reading, readingIndex) =>
        append(
          reading,
          piece.pieceNumber || pieceIndex + 1,
          reading.readingNumber || readingIndex + 1,
        ),
      );
    } else {
      append(pieceMeasurement, piece.pieceNumber || pieceIndex + 1, 1);
    }
  });

  if (readingsByPosition.size === 0) {
    append(entry?.measured, 1, 1);
  }

  return Array.from(readingsByPosition.values()).sort(
    (a, b) =>
      a.pieceNumber - b.pieceNumber || a.readingNumber - b.readingNumber,
  );
};

const buildNumericCheckpointPayload = (
  checkpoint,
  checkpointId,
  suppliedReadings,
) => {
  const specification = getCheckpointSpecification(checkpoint || {});
  const sampling = getCheckpointSampling(checkpoint || {});
  const grouped = new Map();

  (Array.isArray(suppliedReadings) ? suppliedReadings : []).forEach(
    (reading) => {
      const normalized = normalizeFrontendRawReading(
        reading,
        reading?.pieceNumber,
        reading?.readingNumber,
      );
      if (!normalized) return;

      const decision = evaluateNumericResultAgainstCheckpoint(
        normalized.value,
        checkpoint || {},
      );
      const evaluated = {
        ...normalized,
        pass: decision.pass,
        deviation: decision.deviation,
        resultReason: decision.reason || "",
      };

      if (!grouped.has(evaluated.pieceNumber)) {
        grouped.set(evaluated.pieceNumber, []);
      }
      grouped.get(evaluated.pieceNumber).push(evaluated);
    },
  );

  const pieceValues = Array.from(grouped.entries())
    .map(([pieceNumber, readings]) => {
      const orderedReadings = [...readings].sort(
        (a, b) => a.readingNumber - b.readingNumber,
      );
      const value =
        orderedReadings.reduce((sum, reading) => sum + reading.value, 0) /
        orderedReadings.length;
      const decision = evaluateNumericResultAgainstCheckpoint(
        value,
        checkpoint || {},
      );

      return {
        pieceNumber,
        value,
        pass: orderedReadings.every((reading) => reading.pass === true),
        deviation: decision.deviation,
        readings: orderedReadings,
      };
    })
    .sort((a, b) => a.pieceNumber - b.pieceNumber);

  const rawReadings = pieceValues.flatMap((piece) => piece.readings);
  const numericValues = pieceValues.map((piece) => piece.value);
  const mean =
    numericValues.length > 0
      ? numericValues.reduce((sum, value) => sum + value, 0) /
        numericValues.length
      : null;
  const min = numericValues.length > 0 ? Math.min(...numericValues) : null;
  const max = numericValues.length > 0 ? Math.max(...numericValues) : null;
  const variance =
    numericValues.length > 1 && mean !== null
      ? numericValues.reduce(
          (sum, value) => sum + Math.pow(value - mean, 2),
          0,
        ) /
        (numericValues.length - 1)
      : numericValues.length === 1
        ? 0
        : null;
  const allPass =
    rawReadings.length > 0 &&
    rawReadings.every((reading) => reading.pass === true);

  return {
    checkpointId,
    checkpointName: checkpoint?.name || checkpointId,
    resultType: "numeric",
    inspectionMethod: checkpoint?.inspectionMethod || "dimensional",
    expected: specification.nominal,
    lsl: specification.lsl,
    usl: specification.usl,
    unit: specification.unit,
    subgroupId: `SG-${Date.now()}-${checkpointId}`,
    selectedSPCMethod: normalizeSPCMethod(
      checkpoint?.overrideSPCMethod ||
        checkpoint?.selectedSPCMethod ||
        checkpoint?.recommendedSPCMethod ||
        checkpoint?.controlChartType,
      sampling.subgroupSize,
      "numeric",
    ),
    chartType: normalizeSPCMethod(
      checkpoint?.overrideSPCMethod ||
        checkpoint?.selectedSPCMethod ||
        checkpoint?.recommendedSPCMethod ||
        checkpoint?.controlChartType,
      sampling.subgroupSize,
      "numeric",
    ),
    subgroupSizePlanned: sampling.subgroupSize,
    subgroupSizeActual: pieceValues.length,
    readingsPerPiece: sampling.readingsPerPiece,
    pieceValues,
    rawReadings,
    statistics: {
      sampleSize: pieceValues.length,
      rawReadingCount: rawReadings.length,
      mean,
      min,
      max,
      range: max === null || min === null ? null : max - min,
      stdDev: variance === null ? null : Math.sqrt(variance),
    },
    specificationStatus:
      rawReadings.length === 0 ? "Pending" : allPass ? "Pass" : "Fail",
  };
};

const sanitizeInspectionRunPart = (value, fallback = "NA") => {
  const normalized = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return normalized || fallback;
};

/*
 * PDI/run identity intentionally excludes inspector/operator and lot quantity.
 * Changing either value must keep the same run when PO, item, batch and date
 * are unchanged. They are stored only as inspection metadata below.
 */
const buildClientInspectionRunId = ({
  purchaseOrderId,
  itemId,
  batchNumber,
  date,
}) => {
  const dateText = String(
    date || new Date().toISOString().split("T")[0],
  ).replace(/-/g, "");
  const poPart = sanitizeInspectionRunPart(purchaseOrderId).slice(-10);
  const itemPart = sanitizeInspectionRunPart(itemId).slice(-16);
  const batchPart = sanitizeInspectionRunPart(batchNumber, "UNASSIGNED");
  return `RUN-${dateText}-${poPart}-${itemPart}-${batchPart}`;
};

const formatCustomerReportValue = (value, precision = 3) => {
  if (value === "" || value === null || value === undefined) return "-";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric.toFixed(Math.max(0, Number(precision) || 0));
};

const buildConstantReportSeries = (length, value) =>
  Array.from({ length }, () => toFiniteNumberOrNull(value));

const getReportSeriesValue = (chart, seriesField, scalarField, sourceIndex) => {
  const series = chart?.[seriesField];
  if (Array.isArray(series)) {
    const historicalValue = toFiniteNumberOrNull(series[sourceIndex]);
    if (historicalValue !== null || chart?.limitsFrozen === true) {
      return historicalValue;
    }
    // No approved baseline applies at this point. Fall back to the current
    // trial limit rather than drawing a false frozen segment.
    return toFiniteNumberOrNull(chart?.[scalarField]);
  }
  return toFiniteNumberOrNull(chart?.[scalarField]);
};

const getReportAxisLabel = (metadata, fallback) => {
  const rawDate = metadata?.date || metadata?.collectedAt;
  if (!rawDate) return fallback;
  const parsed = new Date(rawDate);
  if (!Number.isFinite(parsed.getTime())) return fallback;
  return parsed.toISOString().slice(0, 10);
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
});

const buildReportChartOptions = ({
  filteredPoints,
  yTitle,
  beginAtZero = false,
  legendFilter = null,
}) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  normalized: true,
  interaction: { mode: "index", intersect: false },
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
      callbacks: {
        title: (contexts) => {
          const point = filteredPoints[contexts?.[0]?.dataIndex];
          if (!point) return "";
          const dateText = point.collectedAt
            ? new Date(point.collectedAt).toLocaleString()
            : "";
          const baselineText = point.baselineVersion
            ? ` | Baseline v${point.baselineVersion}`
            : "";
          return `${point.sourceLabel}${dateText ? ` | ${dateText}` : ""}${baselineText}`;
        },
        label: (context) =>
          `${context.dataset.label}: ${formatCustomerReportValue(
            context.parsed.y,
            4,
          )}`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: "rgba(148, 163, 184, 0.18)" },
      ticks: { maxTicksLimit: 12, font: { size: 8 } },
    },
    y: {
      beginAtZero,
      grid: { color: "rgba(148, 163, 184, 0.22)" },
      ticks: { font: { size: 8 } },
      title: {
        display: true,
        text: yTitle,
        font: { size: 9 },
      },
    },
  },
});

const CombinedXbarRReportChart = ({
  chart,
  selectedSubgroup = "all",
  startDate = null,
  endDate = null,
}) => {
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
            sourceLabels[index] || meta.label || `Subgroup ${index + 1}`,
          collectedAt,
          timestamp: Number.isFinite(timestamp) ? timestamp : null,
          baselineVersion:
            meta.baselineVersion ?? chart.baselineVersions?.[index] ?? null,
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
        backgroundColor: "rgba(3, 105, 161, 0.10)",
        pointBackgroundColor: filteredPoints.map((point) =>
          xbarOocIndexes.has(point.originalIndex) ? "#dc2626" : "#0369a1",
        ),
        pointBorderColor: filteredPoints.map((point) =>
          xbarOocIndexes.has(point.originalIndex) ? "#991b1b" : "#0369a1",
        ),
        pointRadius: filteredPoints.map((point) =>
          xbarOocIndexes.has(point.originalIndex) ? 4 : 2,
        ),
        pointHoverRadius: 5,
        fill: true,
        tension: 0,
        borderWidth: 1.5,
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
        backgroundColor: "rgba(124, 58, 237, 0.08)",
        pointBackgroundColor: filteredPoints.map((point) =>
          rangeOocIndexes.has(point.originalIndex) ? "#dc2626" : "#7c3aed",
        ),
        pointBorderColor: filteredPoints.map((point) =>
          rangeOocIndexes.has(point.originalIndex) ? "#991b1b" : "#7c3aed",
        ),
        pointRadius: filteredPoints.map((point) =>
          rangeOocIndexes.has(point.originalIndex) ? 4 : 2,
        ),
        pointHoverRadius: 5,
        fill: true,
        tension: 0,
        borderWidth: 1.5,
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

  const latestPointIndex = filteredPoints.length - 1;

  return (
    <div className="border border-slate-300 bg-white px-2 pb-2 pt-1">
      <div className="text-center text-sm font-bold text-slate-950">
        X-bar–R Control Chart | {chart.checkpointName} | n ={" "}
        {chart.subgroupSize || "-"}
      </div>

      <div className="border-b border-slate-300">
        <div className="text-center text-[10px] text-slate-600">
          X-bar panel — subgroup averages
        </div>
        <div className="h-[185px]">
          <Line
            data={xbarData}
            options={buildReportChartOptions({
              filteredPoints,
              yTitle: `X-bar (${chart.unit || "value"})`,
            })}
          />
        </div>
      </div>

      <div>
        <div className="text-center text-[10px] text-slate-600">
          R panel — within-subgroup variation
        </div>
        <div className="h-[130px]">
          <Line
            data={rangeData}
            options={buildReportChartOptions({
              filteredPoints,
              yTitle: `R (${chart.unit || "value"})`,
              beginAtZero: true,
              legendFilter: (legendItem) =>
                ["Subgroup range", "R-bar", "R UCL", "R LCL"].includes(
                  legendItem.text,
                ),
            })}
          />
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-700">
        Showing {filteredPoints.length} of {chart.subgroupCount || 0}{" "}
        subgroup(s)
        {" | "}Current center ={" "}
        {formatCustomerReportValue(xbarCenterData[latestPointIndex], 4)}
        {" | "}Current R-bar ={" "}
        {formatCustomerReportValue(rangeCenterData[latestPointIndex], 4)}
        {" | "}Limits: {chart.limitsSource || "Not available"}
        {" | "}Status: {chart.status || "Insufficient data"}
      </div>
    </div>
  );
};

const CombinedIMRReportChart = ({
  chart,
  selectedSubgroup = "all",
  startDate = null,
  endDate = null,
}) => {
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
            sourceLabels[index] || meta.label || `Reading ${index + 1}`,
          collectedAt,
          timestamp: Number.isFinite(timestamp) ? timestamp : null,
          baselineVersion:
            meta.baselineVersion ?? chart.baselineVersions?.[index] ?? null,
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
        backgroundColor: "rgba(3, 105, 161, 0.10)",
        pointBackgroundColor: filteredPoints.map((point) =>
          individualOocIndexes.has(point.originalIndex) ? "#dc2626" : "#0369a1",
        ),
        pointBorderColor: filteredPoints.map((point) =>
          individualOocIndexes.has(point.originalIndex) ? "#991b1b" : "#0369a1",
        ),
        pointRadius: filteredPoints.map((point) =>
          individualOocIndexes.has(point.originalIndex) ? 4 : 2,
        ),
        pointHoverRadius: 5,
        fill: true,
        tension: 0,
        borderWidth: 1.5,
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
        backgroundColor: "rgba(124, 58, 237, 0.08)",
        pointBackgroundColor: filteredPoints.map((point) =>
          movingRangeOocIndexes.has(point.movingRangeIndex)
            ? "#dc2626"
            : "#7c3aed",
        ),
        pointBorderColor: filteredPoints.map((point) =>
          movingRangeOocIndexes.has(point.movingRangeIndex)
            ? "#991b1b"
            : "#7c3aed",
        ),
        pointRadius: filteredPoints.map((point) =>
          movingRangeOocIndexes.has(point.movingRangeIndex) ? 4 : 2,
        ),
        pointHoverRadius: 5,
        fill: true,
        tension: 0,
        borderWidth: 1.5,
        spanGaps: false,
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

  const latestPointIndex = filteredPoints.length - 1;

  return (
    <div className="border border-slate-300 bg-white px-2 pb-2 pt-1">
      <div className="text-center text-sm font-bold text-slate-950">
        I–MR Control Chart | {chart.checkpointName}
      </div>

      <div className="border-b border-slate-300">
        <div className="text-center text-[10px] text-slate-600">
          Individuals panel — sequential process values
        </div>
        <div className="h-[185px]">
          <Line
            data={individualData}
            options={buildReportChartOptions({
              filteredPoints,
              yTitle: `Individual (${chart.unit || "value"})`,
            })}
          />
        </div>
      </div>

      <div>
        <div className="text-center text-[10px] text-slate-600">
          Moving-range panel — change between consecutive readings
        </div>
        <div className="h-[130px]">
          <Line
            data={movingRangeData}
            options={buildReportChartOptions({
              filteredPoints,
              yTitle: `MR (${chart.unit || "value"})`,
              beginAtZero: true,
              legendFilter: (legendItem) =>
                ["Moving range", "MR-bar", "MR UCL", "MR LCL"].includes(
                  legendItem.text,
                ),
            })}
          />
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-700">
        Showing {filteredPoints.length} of {chart.readingCount || 0} reading(s)
        {" | "}Current center ={" "}
        {formatCustomerReportValue(individualCenterData[latestPointIndex], 4)}
        {" | "}Current MR-bar ={" "}
        {formatCustomerReportValue(movingRangeCenterData[latestPointIndex], 4)}
        {" | "}Limits: {chart.limitsSource || "Not available"}
        {" | "}Status: {chart.status || "Insufficient data"}
      </div>
    </div>
  );
};

const CombinedAttributeReportChart = ({
  chart,
  selectedSubgroup = "all",
  startDate = null,
  endDate = null,
}) => {
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
            sourceLabels[index] || meta.label || `Subgroup ${index + 1}`,
          collectedAt,
          timestamp: Number.isFinite(timestamp) ? timestamp : null,
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
  const values = filteredPoints.map((point) => point.value);
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
        data: values,
        borderColor: "#0369a1",
        backgroundColor: "rgba(3, 105, 161, 0.10)",
        pointBackgroundColor: filteredPoints.map((point) =>
          oocIndexes.has(point.originalIndex) ? "#dc2626" : "#0369a1",
        ),
        pointBorderColor: filteredPoints.map((point) =>
          oocIndexes.has(point.originalIndex) ? "#991b1b" : "#0369a1",
        ),
        pointRadius: filteredPoints.map((point) =>
          oocIndexes.has(point.originalIndex) ? 4 : 2,
        ),
        pointHoverRadius: 5,
        fill: true,
        tension: 0,
        borderWidth: 1.5,
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
    <div className="border border-slate-300 bg-white px-2 pb-2 pt-1">
      <div className="text-center text-sm font-bold text-slate-950">
        {String(chart.type || "").toUpperCase()} Control Chart |{" "}
        {chart.checkpointName} | {getControlChartSampleSizeLabel(chart)}
      </div>
      <div className="h-[260px]">
        <Line
          data={data}
          options={buildReportChartOptions({
            filteredPoints,
            yTitle: chart.unit || "value",
            beginAtZero: true,
          })}
        />
      </div>
      <div className="text-center text-[10px] text-slate-700">
        Showing {filteredPoints.length} of {chart.subgroupCount || 0}{" "}
        subgroup(s)
        {" | "}Limits: {chart.limitsSource || "Calculated attribute limits"}
        {" | "}Status: {chart.status || "Insufficient data"}
      </div>
    </div>
  );
};

const CombinedSPCReportChart = (props) => {
  const type = String(props.chart?.type || "")
    .trim()
    .toLowerCase();

  if (["imr", "i-mr", "x-mr"].includes(type)) {
    return <CombinedIMRReportChart {...props} />;
  }

  if (["xbar-r", "x-bar-r", "xbar r", "x-bar r"].includes(type)) {
    return <CombinedXbarRReportChart {...props} />;
  }

  if (["p", "np", "c", "u"].includes(type)) {
    return <CombinedAttributeReportChart {...props} />;
  }

  return (
    <div className="flex min-h-[220px] items-center justify-center border border-dashed border-amber-300 bg-amber-50 px-4 text-center text-sm text-amber-800">
      No supported SPC chart is available for this checkpoint.
    </div>
  );
};

const QC_GUIDE_STEPS = [
  {
    selector: '[data-guide="qc-overview"]',
    title: "QC dashboard overview",
    desc: "These cards show total, passed, failed, and pass-rate results. Review them before starting so you understand the current quality position.",
    tip: "A falling pass rate or rising failure count should be investigated before the next batch.",
    example: [
      ["Total inspections", "128"],
      ["Passed", "119"],
      ["Failed", "9"],
      ["Pass rate", "92.97%"],
    ],
    practice: [
      {
        key: "dashboardAction",
        label: "Failures increased from 3 to 9. What should you do?",
        type: "select",
        placeholder: "Select the correct action",
        options: [
          "Investigate the failed batch and process",
          "Ignore it and start the next batch",
          "Change all failed results to Pass",
        ],
        expected: "Investigate the failed batch and process",
      },
    ],
  },
  {
    selector: '[data-guide="qc-selection"]',
    title: "Select inspection parameters",
    desc: "Always work from left to right: Company → Part → Drawing → Process. Each choice filters the next field and loads the approved inspection plan.",
    tip: "Confirm the customer, part number, drawing revision, and process before recording any reading.",
    example: [
      ["Company", "Autometers Alliance Ltd"],
      ["Part", "2223222311-1 — Cross Bar"],
      ["Drawing", "DRG-2223222311-1 Rev 03"],
      ["Process", "Final Inspection"],
    ],
    practice: [
      {
        key: "company",
        label: "Company",
        placeholder: "e.g. Autometers Alliance Ltd",
      },
      {
        key: "part",
        label: "Part / item code",
        placeholder: "e.g. 2223222311-1",
      },
      {
        key: "drawing",
        label: "Drawing and revision",
        placeholder: "e.g. DRG-101 Rev 03",
      },
      {
        key: "process",
        label: "Process",
        placeholder: "e.g. Final Inspection",
      },
    ],
  },
  {
    selector: '[data-guide="qc-tabs"]',
    title: "New inspection or history",
    desc: "Use New Inspection to record fresh results. Use History & Reports only to review completed records or generate reports.",
    tip: "Do not edit a previous inspection when you intend to record a new subgroup.",
    example: [
      ["Task", "Record the 10:00 AM subgroup"],
      ["Correct tab", "New Inspection"],
    ],
    practice: [
      {
        key: "inspectionTab",
        label: "You are recording fresh readings. Which tab do you use?",
        type: "select",
        placeholder: "Choose a tab",
        options: ["New Inspection", "History & Reports"],
        expected: "New Inspection",
      },
    ],
  },
  {
    selector: '[data-guide="qc-identification"]',
    title: "Identify this inspection",
    desc: "Select the correct shift/operator and enter machine, batch number, lot quantity, and tool or mould number. These fields provide traceability when a defect is found later.",
    tip: "Use the numbers printed on the job card, batch label, and machine—not values from memory.",
    example: [
      ["Shift / operator", "Shift A — Harinder"],
      ["Machine", "VMC-04"],
      ["Batch / lot", "B-070826-02 / 500 pcs"],
      ["Tool", "FIX-21"],
    ],
    practice: [
      {
        key: "operator",
        label: "Operator",
        placeholder: "Enter operator name",
      },
      { key: "machine", label: "Machine number", placeholder: "e.g. VMC-04" },
      { key: "batch", label: "Batch number", placeholder: "e.g. B-070826-02" },
      {
        key: "lot",
        label: "Lot quantity",
        type: "number",
        placeholder: "e.g. 500",
      },
    ],
  },
  {
    selector: '[data-guide="qc-evidence"]',
    title: "Attach evidence",
    desc: "Upload clear photos when the inspection plan requires evidence or when a checkpoint fails. Images should show the part, defect, and measuring setup where possible.",
    tip: "Never use an unrelated or unclear image just to satisfy a mandatory-photo field.",
    example: [
      ["Overview photo", "Part and batch label visible"],
      ["Measurement photo", "Vernier jaws and display visible"],
      ["Failure photo", "Defect location clearly marked"],
    ],
    practice: [
      {
        key: "photoChoice",
        label: "Which photo is acceptable evidence?",
        type: "select",
        placeholder: "Choose an answer",
        options: [
          "Clear part, defect, and measuring setup",
          "A blurred photo of another component",
          "An unrelated machine photo",
        ],
        expected: "Clear part, defect, and measuring setup",
      },
    ],
  },
  {
    selector: '[data-guide="qc-checkpoints"]',
    title: "Inspect every checkpoint",
    desc: "Read the characteristic, requirement, instrument, and required sample count before entry. Record actual readings; the system determines Pass/Fail from the specification limits.",
    tip: "Complete all required samples. For a failed result, enter the failure reason and required photo evidence.",
    example: [
      ["Characteristic", "Overall width"],
      ["Requirement", "35.600 to 35.800 mm"],
      ["Instrument", "Digital Vernier VC-014"],
      ["5 readings", "35.612, 35.624, 35.618, 35.631, 35.620"],
      ["Result", "PASS — all readings within specification"],
    ],
    practice: Array.from({ length: 5 }, (_, index) => ({
      key: `reading${index + 1}`,
      label: `Sample ${index + 1} reading (mm)`,
      type: "number",
      step: "0.001",
      placeholder: "Allowed: 35.600–35.800",
      min: 35.6,
      max: 35.8,
    })),
  },
  {
    selector: '[data-guide="qc-final-review"]',
    title: "Final observation and status",
    desc: "Add a short factual observation, then verify the overall status. A failed checkpoint must not be hidden by manually choosing Pass.",
    tip: "Describe what you observed, where it occurred, and any immediate containment action taken.",
    example: [
      [
        "Observation",
        "All five width readings are within specification; no burr or visible damage found.",
      ],
      ["Overall status", "Pass"],
    ],
    practice: [
      {
        key: "observation",
        label: "Write a factual observation",
        placeholder: "State what you checked and observed",
      },
      {
        key: "overallStatus",
        label: "Overall status",
        type: "select",
        placeholder: "Select status",
        options: ["Pass", "Fail", "Pending"],
      },
    ],
  },
  {
    selector: '[data-guide="qc-submit"]',
    title: "Review and submit",
    desc: "Before submission, recheck identification, sample completion, instrument selection, readings, remarks, evidence, and overall status. Submit only when the record is complete.",
    tip: "Reset clears the current form. Use it carefully because unsaved entries may be lost.",
    example: [
      ["Identification", "Complete"],
      ["Samples", "5 of 5"],
      ["Instrument", "Selected and calibration valid"],
      ["Remarks / evidence", "Complete"],
      ["Ready", "Submit Inspection"],
    ],
    practice: [
      {
        key: "submitAction",
        label: "One mandatory photo is missing. What should you do?",
        type: "select",
        placeholder: "Choose an action",
        options: [
          "Attach the required photo before submitting",
          "Submit the incomplete inspection",
          "Reset the entire form",
        ],
        expected: "Attach the required photo before submitting",
      },
    ],
  },
];

const QCGuideLegacy = ({ onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [mode, setMode] = useState("example");
  const [practiceValues, setPracticeValues] = useState({});
  const [practiceMessage, setPracticeMessage] = useState("");
  const step = QC_GUIDE_STEPS[stepIndex];
  const isLast = stepIndex === QC_GUIDE_STEPS.length - 1;

  const stepValues = practiceValues[stepIndex] || {};

  const updatePracticeValue = (key, value) => {
    setPracticeValues((current) => ({
      ...current,
      [stepIndex]: { ...(current[stepIndex] || {}), [key]: value },
    }));
    setPracticeMessage("");
  };

  const checkPractice = () => {
    const fields = step.practice || [];
    const missing = fields.some(
      (field) => String(stepValues[field.key] ?? "").trim() === "",
    );
    const incorrect = fields.some((field) => {
      const value = stepValues[field.key];
      if (field.expected && value !== field.expected) return true;
      if (field.type === "number") {
        const number = Number(value);
        if (!Number.isFinite(number)) return true;
        if (field.min !== undefined && number < field.min) return true;
        if (field.max !== undefined && number > field.max) return true;
      }
      return false;
    });

    if (missing) {
      setPracticeMessage("Complete every practice field before checking.");
      return false;
    }
    if (incorrect) {
      setPracticeMessage(
        "Review the example and try again. One or more answers are not correct.",
      );
      return false;
    }
    setPracticeMessage("Correct — this practice step is complete.");
    return true;
  };

  const goToStep = (nextIndex) => {
    setStepIndex(nextIndex);
    setMode("example");
    setPracticeMessage("");
  };

  const updateTarget = useCallback(() => {
    const element = document.querySelector(step.selector);
    if (!element) {
      setTargetRect(null);
      return;
    }
    const rect = element.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [step.selector]);

  useEffect(() => {
    const element = document.querySelector(step.selector);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = window.setTimeout(updateTarget, 350);
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [step.selector, updateTarget]);

  useEffect(() => {
    const handleKey = (event) => {
      const tagName = event.target?.tagName?.toLowerCase();
      if (["input", "select", "textarea"].includes(tagName)) return;
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight")
        goToStep(Math.min(stepIndex + 1, QC_GUIDE_STEPS.length - 1));
      if (event.key === "ArrowLeft") goToStep(Math.max(stepIndex - 1, 0));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, stepIndex]);

  return (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-label="QC inspection guided tour"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px]"
      />

      <AnimatePresence mode="wait">
        {targetRect && (
          <motion.div
            key={step.selector}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed rounded-2xl border-2 border-amber-300 shadow-[0_0_0_4px_rgba(251,191,36,0.2),0_0_35px_rgba(251,191,36,0.45)] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-x-4 bottom-5 sm:inset-x-auto sm:right-8 sm:bottom-8 sm:w-[430px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ duration: 0.24 }}
            className="overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl"
          >
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                    Junior QC learning tour
                  </p>
                  <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-blue-100 hover:bg-white/15 hover:text-white"
                  aria-label="Close guide"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  className="h-full rounded-full bg-amber-300"
                  animate={{
                    width: `${((stepIndex + 1) / QC_GUIDE_STEPS.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 flex items-center justify-between text-xs font-medium text-slate-500">
                <span>
                  Step {stepIndex + 1} of {QC_GUIDE_STEPS.length}
                </span>
                <span>Use ← → keys</span>
              </div>
              <p className="text-sm leading-6 text-slate-700">{step.desc}</p>
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900">
                <span className="font-bold">QC tip: </span>
                {step.tip}
              </div>

              <div className="mt-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("example");
                    setPracticeMessage("");
                  }}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                    mode === "example"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  1. See example
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("practice");
                    setPracticeMessage("");
                  }}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                    mode === "practice"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  2. Practice yourself
                </button>
              </div>

              <AnimatePresence mode="wait">
                {mode === "example" ? (
                  <motion.div
                    key={`example-${stepIndex}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="mt-3 max-h-52 overflow-auto rounded-xl border border-blue-200 bg-blue-50/70 p-3"
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700">
                      <Eye className="h-4 w-4" /> Training example — not real
                      data
                    </div>
                    <dl className="space-y-2">
                      {(step.example || []).map(([label, value]) => (
                        <div
                          key={label}
                          className="grid grid-cols-[120px_1fr] gap-2 text-xs"
                        >
                          <dt className="font-semibold text-slate-500">
                            {label}
                          </dt>
                          <dd className="font-medium text-slate-800">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <button
                      type="button"
                      onClick={() => setMode("practice")}
                      className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      I understand — let me practice
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`practice-${stepIndex}`}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="mt-3 max-h-64 overflow-auto rounded-xl border border-emerald-200 bg-emerald-50/60 p-3"
                  >
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                      <Pencil className="h-4 w-4" /> Safe practice — nothing
                      will be saved
                    </div>
                    <div className="space-y-3">
                      {(step.practice || []).map((field) => (
                        <label key={field.key} className="block">
                          <span className="mb-1 block text-xs font-semibold text-slate-700">
                            {field.label}
                          </span>
                          {field.type === "select" ? (
                            <select
                              value={stepValues[field.key] || ""}
                              onChange={(event) =>
                                updatePracticeValue(
                                  field.key,
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                            >
                              <option value="">{field.placeholder}</option>
                              {field.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type || "text"}
                              step={field.step}
                              value={stepValues[field.key] || ""}
                              onChange={(event) =>
                                updatePracticeValue(
                                  field.key,
                                  event.target.value,
                                )
                              }
                              placeholder={field.placeholder}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                            />
                          )}
                        </label>
                      ))}
                    </div>
                    {practiceMessage && (
                      <p
                        className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${
                          practiceMessage.startsWith("Correct")
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {practiceMessage}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={checkPractice}
                      className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      Check my practice
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              {!targetRect && (
                <p className="mt-3 rounded-lg bg-blue-50 p-2.5 text-xs text-blue-700">
                  This section appears after you select the required Company,
                  Part, Drawing, and Process. Continue the tour now, then follow
                  those selections in order.
                </p>
              )}
              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  Skip tour
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={stepIndex === 0}
                    onClick={() => goToStep(stepIndex - 1)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      isLast ? onClose() : goToStep(stepIndex + 1)
                    }
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200"
                  >
                    {isLast ? "Finish guide" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const QCPracticeSurface = ({ stepIndex, values, setValue }) => {
  const fieldClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

  if (stepIndex === 0) {
    return (
      <div className="grid h-full grid-cols-2 gap-3 p-4 md:grid-cols-4">
        {[
          ["Total Inspections", "128", "text-blue-600"],
          ["Passed", "119", "text-emerald-600"],
          ["Failed", "9", "text-red-600"],
          ["Pass Rate", "92.97%", "text-indigo-600"],
        ].map(([label, value, colorClass]) => (
          <button
            key={label}
            type="button"
            onClick={() => setValue("selectedCard", label)}
            className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              values.selectedCard === label
                ? "border-amber-400 ring-4 ring-amber-100"
                : "border-slate-200"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className={`mt-2 text-3xl font-black ${colorClass}`}>{value}</p>
            <p className="mt-2 text-xs text-slate-500">
              Click a card to inspect it
            </p>
          </button>
        ))}
      </div>
    );
  }

  if (stepIndex === 1) {
    const companySelected = Boolean(values.company);
    const partSelected = Boolean(values.part);
    const drawingSelected = Boolean(values.drawing);
    return (
      <div className="grid h-full grid-cols-1 gap-4 overflow-auto p-5 md:grid-cols-4">
        <label className="space-y-1.5 text-xs font-bold text-slate-700">
          <span className="flex items-center gap-2">
            <b className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
              1
            </b>
            Select Company
          </span>
          <select
            className={fieldClass}
            value={values.company || ""}
            onChange={(e) => setValue("company", e.target.value)}
          >
            <option value="">— Select Company —</option>
            <option>Autometers Alliance Ltd</option>
            <option>River Engineering</option>
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-bold text-slate-700">
          <span className="flex items-center gap-2">
            <b className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
              2
            </b>
            Select Part
          </span>
          <select
            disabled={!companySelected}
            className={fieldClass}
            value={values.part || ""}
            onChange={(e) => setValue("part", e.target.value)}
          >
            <option value="">— Select Part —</option>
            <option>2223222311-1 — Cross Bar</option>
            <option>3501323777 — Coding Plate</option>
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-bold text-slate-700">
          <span className="flex items-center gap-2">
            <b className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
              3
            </b>
            Select Drawing
          </span>
          <select
            disabled={!partSelected}
            className={fieldClass}
            value={values.drawing || ""}
            onChange={(e) => setValue("drawing", e.target.value)}
          >
            <option value="">— Select Drawing —</option>
            <option>DRG-2223222311-1 Rev 03</option>
            <option>DRG-2223222311-1 Rev 02</option>
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-bold text-slate-700">
          <span className="flex items-center gap-2">
            <b className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
              4
            </b>
            Select Process
          </span>
          <select
            disabled={!drawingSelected}
            className={fieldClass}
            value={values.process || ""}
            onChange={(e) => setValue("process", e.target.value)}
          >
            <option value="">— Select Process —</option>
            <option>Final Inspection (4 checkpoints)</option>
            <option>In-Process Inspection (3 checkpoints)</option>
          </select>
        </label>
      </div>
    );
  }

  if (stepIndex === 2) {
    return (
      <div className="flex h-full items-center gap-2 p-4">
        {["New Inspection", "History & Reports"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setValue("tab", tab)}
            className={`rounded-xl px-6 py-3 text-sm font-bold transition ${values.tab === tab ? "bg-blue-600 text-white shadow-lg" : "border border-slate-300 bg-white text-slate-600"}`}
          >
            {tab}
          </button>
        ))}
        <span className="ml-3 text-xs text-slate-500">
          Practice task: choose where to record a fresh subgroup.
        </span>
      </div>
    );
  }

  if (stepIndex === 3) {
    return (
      <div className="grid h-full grid-cols-1 gap-4 overflow-auto p-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-bold text-slate-600">
          Shift / Operator
          <select
            className={`${fieldClass} mt-1.5`}
            value={values.operator || ""}
            onChange={(e) => setValue("operator", e.target.value)}
          >
            <option value="">Select operator</option>
            <option>Shift A — Harinder</option>
            <option>Shift B — Vijay</option>
          </select>
        </label>
        <label className="text-xs font-bold text-slate-600">
          Machine Number
          <select
            className={`${fieldClass} mt-1.5`}
            value={values.machine || ""}
            onChange={(e) => setValue("machine", e.target.value)}
          >
            <option value="">Select machine</option>
            <option>VMC-04</option>
            <option>VMC-06</option>
          </select>
        </label>
        <label className="text-xs font-bold text-slate-600">
          Batch Number
          <input
            className={`${fieldClass} mt-1.5`}
            value={values.batch || ""}
            onChange={(e) => setValue("batch", e.target.value)}
            placeholder="B-070826-02"
          />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Lot Quantity
          <input
            type="number"
            className={`${fieldClass} mt-1.5`}
            value={values.lot || ""}
            onChange={(e) => setValue("lot", e.target.value)}
            placeholder="500"
          />
        </label>
      </div>
    );
  }

  if (stepIndex === 4) {
    return (
      <div className="grid h-full grid-cols-1 gap-4 overflow-auto p-5 md:grid-cols-3">
        {["Part overview", "Measuring setup", "Defect close-up"].map(
          (photo) => (
            <button
              key={photo}
              type="button"
              onClick={() => setValue(photo, !values[photo])}
              className={`flex min-h-28 flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition ${values[photo] ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-slate-50 text-slate-500 hover:border-blue-400"}`}
            >
              <ImageIcon className="mb-2 h-7 w-7" />
              <span className="text-sm font-bold">
                {values[photo] ? `${photo} added` : `Add ${photo}`}
              </span>
              <span className="mt-1 text-[11px]">
                Training placeholder—no file is uploaded
              </span>
            </button>
          ),
        )}
      </div>
    );
  }

  if (stepIndex === 5) {
    const readings = Array.from(
      { length: 5 },
      (_, index) => values[`reading${index + 1}`] || "",
    );
    return (
      <div className="h-full overflow-auto p-4">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-slate-100 text-xs text-slate-600">
            <tr>
              {[
                "#",
                "Characteristic",
                "Requirement",
                "Instrument",
                "Sample 1",
                "Sample 2",
                "Sample 3",
                "Sample 4",
                "Sample 5",
                "Result",
              ].map((h) => (
                <th key={h} className="border border-slate-300 px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 p-2 text-center">1</td>
              <td className="border border-slate-300 p-2">
                <b>Overall width</b>
                <div className="text-[10px] text-slate-500">Balloon B-12</div>
              </td>
              <td className="border border-slate-300 p-2 text-center">
                35.600–35.800 mm
              </td>
              <td className="border border-slate-300 p-2">
                <select
                  className={fieldClass}
                  value={values.instrument || ""}
                  onChange={(e) => setValue("instrument", e.target.value)}
                >
                  <option value="">Select</option>
                  <option>Digital Vernier VC-014</option>
                  <option>Micrometer MC-008</option>
                </select>
              </td>
              {readings.map((reading, index) => (
                <td key={index} className="border border-slate-300 p-2">
                  <input
                    type="number"
                    step="0.001"
                    className={`${fieldClass} min-w-24`}
                    value={reading}
                    onChange={(e) =>
                      setValue(`reading${index + 1}`, e.target.value)
                    }
                    placeholder="35.600"
                  />
                </td>
              ))}
              <td className="border border-slate-300 p-2 text-center font-bold">
                {readings.every((v) => v !== "") ? (
                  readings.every(
                    (v) => Number(v) >= 35.6 && Number(v) <= 35.8,
                  ) ? (
                    <span className="text-emerald-600">PASS</span>
                  ) : (
                    <span className="text-red-600">FAIL</span>
                  )
                ) : (
                  <span className="text-amber-600">PENDING</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (stepIndex === 6) {
    return (
      <div className="grid h-full grid-cols-1 gap-5 overflow-auto p-5 md:grid-cols-2">
        <label className="text-xs font-bold text-slate-600">
          Notes / Observations
          <textarea
            rows="4"
            className={`${fieldClass} mt-1.5`}
            value={values.notes || ""}
            onChange={(e) => setValue("notes", e.target.value)}
            placeholder="Describe what was checked and observed..."
          />
        </label>
        <div>
          <p className="mb-2 text-xs font-bold text-slate-600">
            Overall Status
          </p>
          <div className="flex gap-2">
            {["Pass", "Fail", "Pending"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setValue("status", status)}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold ${values.status === status ? (status === "Pass" ? "bg-emerald-600 text-white" : status === "Fail" ? "bg-red-600 text-white" : "bg-amber-500 text-white") : "border border-slate-300 bg-white text-slate-600"}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-5 sm:flex-row">
      <button
        type="button"
        onClick={() => setValue("resetClicked", true)}
        className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-600"
      >
        Reset
      </button>
      <button
        type="button"
        onClick={() => setValue("submitted", true)}
        className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg"
      >
        Submit Inspection
      </button>
      {values.submitted && (
        <span className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-700">
          Practice inspection submitted successfully
        </span>
      )}
    </div>
  );
};

const VIEWPORT_GUTTER = 12;
const MOBILE_BREAKPOINT = 768;
const COMPACT_HEIGHT = 620;

const clamp = (value, minimum, maximum) =>
  Math.min(Math.max(value, minimum), maximum);

const getViewportBox = () => {
  if (typeof window === "undefined") {
    return {
      left: 0,
      top: 0,
      width: 1280,
      height: 720,
    };
  }

  const viewport = window.visualViewport;

  return {
    left: viewport?.offsetLeft ?? 0,
    top: viewport?.offsetTop ?? 0,
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  };
};

const QCGuide = ({ onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [practiceValues, setPracticeValues] = useState({});

  const guideRef = useRef(null);
  const practicePanelRef = useRef(null);
  const animationFrameRef = useRef(null);

  const step = QC_GUIDE_STEPS[stepIndex];
  const isLast = stepIndex === QC_GUIDE_STEPS.length - 1;
  const values = practiceValues[stepIndex] || {};
  const selectedDemoPlan = practiceValues[1] || {};

  const setValue = useCallback(
    (key, value) => {
      setPracticeValues((current) => ({
        ...current,
        [stepIndex]: {
          ...(current[stepIndex] || {}),
          [key]: value,
        },
      }));
    },
    [stepIndex],
  );

  const goToStep = useCallback((nextStep) => {
    setStepIndex(Math.max(0, Math.min(nextStep, QC_GUIDE_STEPS.length - 1)));
  }, []);

  const updateTarget = useCallback(() => {
    if (typeof window === "undefined" || !step) return;

    const viewport = getViewportBox();

    const viewportRight = viewport.left + viewport.width;
    const viewportBottom = viewport.top + viewport.height;

    const guideBottom =
      guideRef.current?.getBoundingClientRect().bottom ?? viewport.top + 100;

    const minimumTop = guideBottom + 8;

    const isCompact =
      viewport.width < MOBILE_BREAKPOINT || viewport.height < COMPACT_HEIGHT;

    /*
     * Mobile and small landscape screens:
     * use all remaining space below the guide header.
     */
    if (isCompact) {
      const left = viewport.left + 8;
      const top = minimumTop;
      const width = Math.max(1, viewport.width - 16);
      const height = Math.max(1, viewportBottom - top - VIEWPORT_GUTTER);

      setTargetRect({
        top,
        left,
        width,
        height,
      });

      return;
    }

    /*
     * Tablet and desktop:
     * position the practice panel near the real UI target.
     */
    const element = document.querySelector(step.selector);
    const elementRect = element?.getBoundingClientRect();

    const availableWidth = Math.max(1, viewport.width - VIEWPORT_GUTTER * 2);

    const width = elementRect
      ? Math.min(Math.max(elementRect.width, 480), availableWidth)
      : Math.min(1500, availableWidth);

    const maximumHeight = Math.max(
      1,
      viewportBottom - minimumTop - VIEWPORT_GUTTER,
    );

    const desiredHeight = elementRect
      ? Math.max(elementRect.height, 320)
      : maximumHeight;

    const height = Math.min(desiredHeight, maximumHeight);

    const desiredTop = elementRect?.top ?? minimumTop;

    const top = clamp(
      desiredTop,
      minimumTop,
      Math.max(minimumTop, viewportBottom - height - VIEWPORT_GUTTER),
    );

    const desiredLeft =
      elementRect?.left ?? viewport.left + (viewport.width - width) / 2;

    const left = clamp(
      desiredLeft,
      viewport.left + VIEWPORT_GUTTER,
      Math.max(
        viewport.left + VIEWPORT_GUTTER,
        viewportRight - width - VIEWPORT_GUTTER,
      ),
    );

    setTargetRect({
      top,
      left,
      width,
      height,
    });
  }, [step]);

  useEffect(() => {
    if (!step) return undefined;

    const requestTargetUpdate = () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = window.requestAnimationFrame(updateTarget);
    };

    const targetElement = document.querySelector(step.selector);
    const viewport = getViewportBox();

    const isCompact =
      viewport.width < MOBILE_BREAKPOINT || viewport.height < COMPACT_HEIGHT;

    // Desktop needs the real section to be visible before positioning.
    if (targetElement && !isCompact) {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      targetElement.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
        inline: "nearest",
      });
    }

    const timer = window.setTimeout(requestTargetUpdate, 350);

    const handlePageScroll = (event) => {
      // Ignore scrolling inside the practice panel itself.
      if (
        practicePanelRef.current &&
        event.target instanceof Node &&
        practicePanelRef.current.contains(event.target)
      ) {
        return;
      }

      requestTargetUpdate();
    };

    window.addEventListener("resize", requestTargetUpdate);
    window.addEventListener("orientationchange", requestTargetUpdate);
    window.addEventListener("scroll", handlePageScroll, true);

    window.visualViewport?.addEventListener("resize", requestTargetUpdate);
    window.visualViewport?.addEventListener("scroll", requestTargetUpdate);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(requestTargetUpdate)
        : null;

    if (guideRef.current) {
      resizeObserver?.observe(guideRef.current);
    }

    if (targetElement) {
      resizeObserver?.observe(targetElement);
    }

    return () => {
      window.clearTimeout(timer);

      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      window.removeEventListener("resize", requestTargetUpdate);
      window.removeEventListener("orientationchange", requestTargetUpdate);
      window.removeEventListener("scroll", handlePageScroll, true);

      window.visualViewport?.removeEventListener("resize", requestTargetUpdate);
      window.visualViewport?.removeEventListener("scroll", requestTargetUpdate);

      resizeObserver?.disconnect();
    };
  }, [step, updateTarget]);

  useEffect(() => {
    const handleKeyboard = (event) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (
        event.key === "ArrowRight" &&
        !event.target.closest("input, textarea, select, button")
      ) {
        if (isLast) {
          onClose();
        } else {
          goToStep(stepIndex + 1);
        }
      }

      if (
        event.key === "ArrowLeft" &&
        stepIndex > 0 &&
        !event.target.closest("input, textarea, select, button")
      ) {
        goToStep(stepIndex - 1);
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [goToStep, isLast, onClose, stepIndex]);

  if (!step) return null;

  return (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qc-guide-title"
    >
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
        aria-hidden="true"
      />

      {/* Responsive guide navigation */}
      <div
        ref={guideRef}
        className="
          fixed left-1/2 top-[max(0.5rem,env(safe-area-inset-top))]
          z-[70] flex w-[calc(100%-1rem)] max-w-[960px]
          -translate-x-1/2 flex-col gap-3 rounded-xl
          border border-white/20 bg-slate-900/95 p-3 text-white
          shadow-2xl sm:w-[calc(100%-1.5rem)] sm:flex-row
          sm:items-center sm:gap-4 sm:rounded-2xl sm:px-4 sm:py-3
        "
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 pr-8 text-[9px] font-bold uppercase tracking-widest text-amber-300 sm:pr-0 sm:text-[10px]">
            <CircleHelp className="h-4 w-4 shrink-0" />

            <span className="truncate">
              Hands-on QC Guide • Step {stepIndex + 1}/{QC_GUIDE_STEPS.length}
            </span>
          </div>

          <p
            id="qc-guide-title"
            className="mt-0.5 line-clamp-2 text-sm font-bold leading-5 sm:line-clamp-1"
          >
            {step.title}
          </p>

          <p className="mt-0.5 hidden line-clamp-1 text-xs text-slate-300 sm:block">
            {step.desc}
          </p>
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => goToStep(stepIndex - 1)}
            className="
              min-h-10 flex-1 rounded-lg border border-white/20
              px-3 py-2 text-xs font-bold transition
              hover:bg-white/10 disabled:cursor-not-allowed
              disabled:opacity-30 sm:flex-none
            "
          >
            Back
          </button>

          <button
            type="button"
            onClick={() => (isLast ? onClose() : goToStep(stepIndex + 1))}
            className="
              min-h-10 flex-[1.4] rounded-lg bg-blue-600 px-4
              py-2 text-xs font-bold transition hover:bg-blue-500
              focus:outline-none focus:ring-2 focus:ring-blue-300
              sm:flex-none
            "
          >
            {isLast ? "Finish" : "Next"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="
              absolute right-3 top-3 rounded-lg p-2 transition
              hover:bg-white/10 focus:outline-none focus:ring-2
              focus:ring-white/40 sm:static
            "
            aria-label="Close QC guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {targetRect ? (
          <motion.div
            ref={practicePanelRef}
            key={`${stepIndex}-${step.selector}`}
            initial={{
              opacity: 0,
              scale: 0.985,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              ...targetRect,
            }}
            exit={{
              opacity: 0,
              scale: 0.985,
            }}
            transition={{
              type: "spring",
              stiffness: 240,
              damping: 26,
            }}
            className="
              fixed z-[60] flex min-h-0 min-w-0 flex-col
              overflow-hidden rounded-xl border-2 border-amber-300
              bg-white shadow-[0_0_0_4px_rgba(251,191,36,0.20),0_0_40px_rgba(251,191,36,0.40)]
              sm:rounded-2xl
            "
            style={{
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {/* Practice panel heading */}
            <div className="flex shrink-0 flex-col gap-1 border-b border-amber-200 bg-amber-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-black uppercase text-slate-900 sm:text-[10px]">
                  Practice UI
                </span>

                <span className="line-clamp-1 text-[10px] font-semibold text-amber-900 sm:text-xs">
                  Use these fields like the real module
                </span>
              </div>

              <span className="text-[9px] font-bold text-emerald-700 sm:text-[10px]">
                DEMO DATA • NOT SAVED
              </span>
            </div>

            {/* Selected inspection information */}
            {stepIndex >= 3 && (
              <div
                className="
                  flex shrink-0 items-center gap-2 overflow-x-auto
                  whitespace-nowrap border-b border-blue-100
                  bg-blue-50 px-3 py-2 text-[10px] text-slate-600
                  sm:px-4 sm:text-[11px]
                  [scrollbar-width:none]
                  [&::-webkit-scrollbar]:hidden
                "
              >
                <span className="font-bold text-blue-700">
                  Demo inspection:
                </span>

                <span>
                  {selectedDemoPlan.company || "Autometers Alliance Ltd"}
                </span>

                <span aria-hidden="true">→</span>

                <span>
                  {selectedDemoPlan.part || "2223222311-1 — Cross Bar"}
                </span>

                <span aria-hidden="true">→</span>

                <span>
                  {selectedDemoPlan.drawing || "DRG-2223222311-1 Rev 03"}
                </span>

                <span aria-hidden="true">→</span>

                <span className="font-semibold">
                  {selectedDemoPlan.process ||
                    "Final Inspection (4 checkpoints)"}
                </span>
              </div>
            )}

            {/* Scrollable responsive practice content */}
            <div
              className="
                min-h-0 min-w-0 flex-1 overflow-auto
                overscroll-contain bg-gradient-to-br
                from-white to-slate-50
              "
            >
              <div className="min-h-full w-full min-w-0">
                <QCPracticeSurface
                  stepIndex={stepIndex}
                  values={values}
                  setValue={setValue}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 text-center shadow-2xl sm:p-6">
            <p className="font-bold text-slate-800">
              Preparing the QC practice area…
            </p>

            <p className="mt-2 text-sm text-slate-500">
              The guide will appear in the correct inspection area.
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const checkpointReferenceString = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if (value.$oid) return String(value.$oid).trim();
    if (value._id && value._id !== value) {
      return checkpointReferenceString(value._id);
    }
  }
  return String(value).trim();
};

const checkpointReferenceToken = (value) =>
  checkpointReferenceString(value).toLowerCase();

const isPlainRecord = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getEditableFieldText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;

    if (typeof value === "object") {
      const nestedValue = getEditableFieldText(
        value.name,
        value.label,
        value.title,
        value.firstName,
        value.fullName,
        value.companyName,
        value.itemName,
        value.processName,
      );
      if (nestedValue) return nestedValue;
      continue;
    }

    const text = String(value).trim();
    if (text) return text;
  }

  return "";
};

const normalizeInspectionEditDate = (...values) => {
  const rawValue = getEditableFieldText(...values);
  if (!rawValue) return "";

  const dateOnlyMatch = rawValue.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateOnlyMatch) return dateOnlyMatch[1];

  const parsedDate = new Date(rawValue);
  return Number.isNaN(parsedDate.getTime())
    ? ""
    : parsedDate.toISOString().slice(0, 10);
};

const normalizeInspectionEditStatus = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  if (
    ["pass", "passed", "ok", "accepted", "complete", "completed"].includes(
      normalized,
    )
  ) {
    return "Pass";
  }
  if (
    ["fail", "failed", "reject", "rejected", "not ok", "ng"].includes(
      normalized,
    )
  ) {
    return "Fail";
  }
  if (["in progress", "progress", "open"].includes(normalized)) {
    return "In Progress";
  }
  return "Pending";
};

const normalizeCheckpointEditStatus = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  if (["pass", "passed", "ok", "accepted", "true"].includes(normalized)) {
    return "OK";
  }
  if (
    ["fail", "failed", "reject", "rejected", "not ok", "ng", "false"].includes(
      normalized,
    )
  ) {
    return "Fail";
  }
  if (["n/a", "na", "not applicable", "skip", "skipped"].includes(normalized)) {
    return "N/A";
  }
  return "Pending";
};

const getEditableRecordCheckpointRows = (record) => {
  const checkpoints = isPlainRecord(record?.checkpoints)
    ? record.checkpoints
    : {};
  const measurements = isPlainRecord(record?.measurements)
    ? record.measurements
    : {};
  const plans = Array.isArray(record?.checkpointPlanSnapshot)
    ? record.checkpointPlanSnapshot.filter(Boolean)
    : [];
  const measurementEntries = Object.entries(measurements).filter(([, value]) =>
    isPlainRecord(value),
  );

  const matchesReference = (candidate, token) =>
    Boolean(token) && checkpointReferenceToken(candidate) === token;

  const findMeasurement = (checkpointKey) => {
    const direct = measurements[checkpointKey];
    if (isPlainRecord(direct)) {
      return { measurementKey: checkpointKey, measurement: direct };
    }

    const token = checkpointReferenceToken(checkpointKey);
    const match = measurementEntries.find(([measurementKey, measurement]) =>
      [
        measurementKey,
        measurement?.checkpointId,
        measurement?.characteristicId,
        measurement?.id,
        measurement?._id,
        measurement?.checkpointName,
        measurement?.name,
      ].some((candidate) => matchesReference(candidate, token)),
    );

    return match
      ? { measurementKey: match[0], measurement: match[1] }
      : { measurementKey: "", measurement: null };
  };

  const findPlan = (checkpointKey, measurement) => {
    const tokens = new Set(
      [
        checkpointKey,
        measurement?.checkpointId,
        measurement?.characteristicId,
        measurement?.id,
        measurement?._id,
        measurement?.checkpointName,
        measurement?.name,
      ]
        .map(checkpointReferenceToken)
        .filter(Boolean),
    );

    return (
      plans.find((plan) =>
        [
          plan?.characteristicId,
          plan?.checkpointId,
          plan?.id,
          plan?._id,
          plan?.name,
          plan?.checkpointName,
        ]
          .map(checkpointReferenceToken)
          .some((token) => token && tokens.has(token)),
      ) || null
    );
  };

  const rowsByCanonicalKey = new Map();

  Object.entries(checkpoints).forEach(([sourceKey, sourceStatus]) => {
    const { measurementKey, measurement } = findMeasurement(sourceKey);
    const plan = findPlan(sourceKey, measurement);
    const canonicalKey =
      checkpointReferenceString(
        measurement?.characteristicId ||
          measurement?.checkpointId ||
          measurement?.id ||
          measurement?._id ||
          plan?.characteristicId ||
          plan?.checkpointId ||
          plan?.id ||
          plan?._id ||
          measurementKey ||
          sourceKey,
      ) || sourceKey;
    const canonicalToken = checkpointReferenceToken(canonicalKey);
    const checkpointName =
      measurement?.checkpointName ||
      measurement?.name ||
      plan?.name ||
      plan?.checkpointName ||
      sourceKey ||
      "Unnamed checkpoint";
    const resultType = String(
      measurement?.resultType || plan?.resultType || "",
    ).toLowerCase();
    const isMeasurement =
      resultType === "numeric" ||
      String(plan?.type || "").toLowerCase() === "measurement";
    const typeLabel = isMeasurement
      ? "Measurement"
      : plan?.type || measurement?.inspectionMethod || "Visual / Attribute";

    const existing = rowsByCanonicalKey.get(canonicalToken);
    if (existing) {
      existing.sourceKeys.push(sourceKey);
      if (checkpointReferenceToken(sourceKey) === canonicalToken) {
        existing.status = normalizeCheckpointEditStatus(sourceStatus);
      }
      if (!existing.measurement && measurement) {
        existing.measurement = measurement;
        existing.measurementKey = measurementKey;
      }
      return;
    }

    rowsByCanonicalKey.set(canonicalToken, {
      key: canonicalKey,
      sourceKeys: [sourceKey],
      status: normalizeCheckpointEditStatus(sourceStatus),
      checkpointName,
      measurement,
      measurementKey,
      plan,
      isMeasurement,
      typeLabel,
    });
  });

  return Array.from(rowsByCanonicalKey.values());
};

const prepareInspectionRecordForEdit = (record) => {
  const copy = JSON.parse(JSON.stringify(record || {}));
  copy.companyName = getEditableFieldText(
    copy.companyName,
    copy.company,
    copy.client,
    copy.submittedBy?.companyName,
  );
  copy.companyId = checkpointReferenceString(
    copy.companyId || copy.company?._id || copy.client?._id,
  );
  copy.itemName = getEditableFieldText(
    copy.itemName,
    copy.itemCode,
    copy.item,
    copy.partName,
    copy.productName,
  );
  copy.itemId = checkpointReferenceString(
    copy.itemId || copy.item?._id || copy.part?._id,
  );
  copy.processName = getEditableFieldText(
    copy.processName,
    copy.process,
    copy.inspectionProcess,
  );
  copy.processId = checkpointReferenceString(
    copy.processId || copy.process?._id || copy.inspectionProcess?._id,
  );
  copy.timeSlot = getEditableFieldText(
    copy.timeSlot,
    copy.shiftTiming,
    copy.shift,
  );
  copy.inspector = getEditableFieldText(
    copy.inspector,
    copy.inspectorName,
    copy.operator,
    copy.inspectedBy,
  );
  copy.status = normalizeInspectionEditStatus(copy.status);
  copy.date = normalizeInspectionEditDate(
    copy.date,
    copy.inspectionDate,
    copy.timestamp,
    copy.createdAt,
  );
  copy.checkpoints = isPlainRecord(copy.checkpoints) ? copy.checkpoints : {};
  copy.measurements = isPlainRecord(copy.measurements) ? copy.measurements : {};
  copy.checklistRemarks = isPlainRecord(copy.checklistRemarks)
    ? copy.checklistRemarks
    : {};
  copy.gaugeResults = isPlainRecord(copy.gaugeResults) ? copy.gaugeResults : {};
  copy.images = Array.isArray(copy.images) ? copy.images : [];

  const rows = getEditableRecordCheckpointRows(copy);
  const normalizedCheckpoints = {};
  const normalizedMeasurements = { ...copy.measurements };
  const normalizedRemarks = {};
  const normalizedGaugeResults = { ...copy.gaugeResults };

  rows.forEach((row) => {
    normalizedCheckpoints[row.key] = row.status;

    if (row.measurement) {
      if (row.measurementKey && row.measurementKey !== row.key) {
        delete normalizedMeasurements[row.measurementKey];
      }
      normalizedMeasurements[row.key] = {
        ...row.measurement,
        checkpointId: row.key,
        checkpointName: row.checkpointName,
      };
    }

    const remarkKey = row.sourceKeys.find(
      (key) => copy.checklistRemarks[key] !== undefined,
    );
    if (remarkKey)
      normalizedRemarks[row.key] = copy.checklistRemarks[remarkKey];

    const gaugeKey = row.sourceKeys.find(
      (key) => copy.gaugeResults[key] !== undefined,
    );
    if (gaugeKey && gaugeKey !== row.key) {
      normalizedGaugeResults[row.key] = copy.gaugeResults[gaugeKey];
      delete normalizedGaugeResults[gaugeKey];
    }
  });

  copy.checkpoints = normalizedCheckpoints;
  copy.measurements = normalizedMeasurements;
  copy.checklistRemarks = normalizedRemarks;
  copy.gaugeResults = normalizedGaugeResults;
  return copy;
};

const QC = () => {
  // Selection states
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [timeSlot, setTimeSlot] = useState("06:00 AM - 02:00 PM");
  const [inspectionSource, setInspectionSource] = useState(null); // 'drawing' | 'process'
  const [isInCreateProcessModal, setIsInCreateProcessModal] = useState(false);
  // Records
  const [records, setRecords] = useState([]);
  const [showSPCDashboardModal, setShowSPCDashboardModal] = useState(false);
  const [showQCGuide, setShowQCGuide] = useState(false);

  // Checklist states
  const [checklistResults, setChecklistResults] = useState({});
  const [measurementResults, setMeasurementResults] = useState({});
  const [checklistRemarks, setChecklistRemarks] = useState({});
  const [itemSearch, setItemSearch] = useState("");
  // Add these to your existing state declarations
  const [checkpointMeasurements, setCheckpointMeasurements] = useState({});
  const [selectedInspectionForSPC, setSelectedInspectionForSPC] =
    useState(null);
  const [spcCheckpointData, setSpcCheckpointData] = useState(null);
  const [showSPCModal, setShowSPCModal] = useState(false);
  const [spcHistoryData, setSpcHistoryData] = useState([]);
  const [selectedCheckpointForSPC, setSelectedCheckpointForSPC] =
    useState(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    inspector: "",
    batchNumber: "",
    machine: "",
    line: "",
    toolNumber: "",
    cavity: "",
    materialLot: "",
    heatNumber: "",
    toolGauge: "",
    quantity: "",
    notes: "",
    status: "Pass",
  });

  const viewRecord = (record) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };
  // Multi-piece inspection states
  const [pieceCount, setPieceCount] = useState(1);
  const [pieceMeasurements, setPieceMeasurements] = useState([]);
  const [showMultiPieceModal, setShowMultiPieceModal] = useState(false);
  const [activeMultiPieceCheckpointId, setActiveMultiPieceCheckpointId] =
    useState(null);

  // Keep only these gauge states
  const [enhancedGauges, setEnhancedGauges] = useState([]);
  const [editingGaugeIndex, setEditingGaugeIndex] = useState(null);
  const [pendingInstrumentCheckpointId, setPendingInstrumentCheckpointId] =
    useState(null);
  const [showGaugeModal, setShowGaugeModal] = useState(false);
  const [showGaugeDetailModal, setShowGaugeDetailModal] = useState(false);
  const [selectedGaugeDetail, setSelectedGaugeDetail] = useState(null);
  const [showEditProcessModal, setShowEditProcessModal] = useState(false);
  const [editingProcessData, setEditingProcessData] = useState({
    id: null,
    name: "",
    isDrawing: false,
    drawingId: null,
  });
  const [isRenamingProcess, setIsRenamingProcess] = useState(false);

  // Drawing Process State
  const [selectedDrawingProcesses, setSelectedDrawingProcesses] = useState([]);
  const [showCreateProcessModal, setShowCreateProcessModal] = useState(false);
  const [newProcessName, setNewProcessName] = useState("");
  const [newProcessCheckpoints, setNewProcessCheckpoints] = useState([]);
  const [showAddCheckpointModal, setShowAddCheckpointModal] = useState(false);
  const [newCheckpointData, setNewCheckpointData] = useState({
    name: "",
    type: "Measurement",
    expectedValue: "",
    unit: "mm",
    tolerance: "",
  });
  // SPC Dashboard
  const [showSPCDashboard, setShowSPCDashboard] = useState(false);
  // Folder navigation states
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderDrawings, setFolderDrawings] = useState([]);
  const [showFolderDrawings, setShowFolderDrawings] = useState(false);
  const [folderSearch, setFolderSearch] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("All Data");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedSubgroup, setSelectedSubgroup] = useState("all");
  const [filteredSPCData, setFilteredSPCData] = useState({});

  // Image upload states
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileInputRef = useRef(null);

  // Data states
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processes, setProcesses] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [shiftTimings, setShiftTimings] = useState([
    "09:00 AM - 11:00 AM",
    "1:00 PM - 3:00 PM",
    "5:00 PM - 07:00 PM",
    "9:00 PM - 11:00 PM",
  ]);

  // Custom Process States
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  const [customProcessName, setCustomProcessName] = useState("");
  const [customCheckpoints, setCustomCheckpoints] = useState([]);
  const [newCheckpoint, setNewCheckpoint] = useState({
    name: "",
    type: "Visual",
    unit: "mm",
    tolerance: "±0.1",
  });

  // Filter states
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("All");
  const [activeTab, setActiveTab] = useState("inspection");
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedRecordForReport, setSelectedRecordForReport] = useState(null);
  const [showReportSetupModal, setShowReportSetupModal] = useState(false);
  const [reportSourceRecord, setReportSourceRecord] = useState(null);
  const [reportCheckpointOptions, setReportCheckpointOptions] = useState([]);
  const [selectedCriticalCheckpointId, setSelectedCriticalCheckpointId] =
    useState("");
  const [isGeneratingCustomerReport, setIsGeneratingCustomerReport] =
    useState(false);
  const [isUpdatingBaseline, setIsUpdatingBaseline] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingRecordCheckpointKey, setEditingRecordCheckpointKey] =
    useState(null);
  const editingRecordCheckpointRows = useMemo(
    () => getEditableRecordCheckpointRows(editingRecord),
    [editingRecord],
  );
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [checkpointName, setCheckpointName] = useState("");
  const [checkpointType, setCheckpointType] = useState("Visual");
  const [unit, setUnit] = useState("mm");
  const [tolerance, setTolerance] = useState("±0.1");
  const [editingCheckpointId, setEditingCheckpointId] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [drawingSearch, setDrawingSearch] = useState("");
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [showDrawingSuggestions, setShowDrawingSuggestions] = useState(false);
  const [showEnhancedCheckpointModal, setShowEnhancedCheckpointModal] =
    useState(false);
  const [editingEnhancedCheckpoint, setEditingEnhancedCheckpoint] =
    useState(null);
  const [isEditingCheckpoint, setIsEditingCheckpoint] = useState(false);
  const [showDrawingCheckpointModal, setShowDrawingCheckpointModal] =
    useState(false);
  const [drawingCheckpointName, setDrawingCheckpointName] = useState("");
  const [drawingCheckpointType, setDrawingCheckpointType] = useState("Visual");
  const [drawingCheckpointUnit, setDrawingCheckpointUnit] = useState("mm");
  const [drawingCheckpointTolerance, setDrawingCheckpointTolerance] =
    useState("±0.1");
  // Modal view state
  const [modalActiveTab, setModalActiveTab] = useState("overview");

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socketStatus, setSocketStatus] = useState({
    isConnected: false,
    transport: "disconnected",
    socketId: null,
  });

  // Replace all three with one:
  const {
    isConnected,
    socketId,
    lastSPCEvent,
    subscribeCompany,
    subscribeStream,
    socket,
  } = useSocket();
  useEffect(() => {
    // Internet connection monitoring
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (socket) {
      const handleConnect = () => {
        setSocketStatus({
          isConnected: true,
          transport: socket.io.engine?.transport?.name || "connected",
          socketId: socket.id,
        });
      };

      const handleDisconnect = () => {
        setSocketStatus({
          isConnected: false,
          transport: "disconnected",
          socketId: null,
        });
      };

      const handleError = (error) => {
        console.error("Socket error:", error);
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleError);

      // Check initial connection state
      if (socket.connected) {
        handleConnect();
      }

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("connect_error", handleError);
      };
    }
  }, [socket]);

  const currentProcessStreamKey = useMemo(() => {
    if (!selectedProcess) return null;

    // The process should have a spcStreamKey or we need to construct one
    // Based on your backend, it might be something like:
    return (
      selectedProcess.spcStreamKey ||
      (selectedProcess.id ? `process-${selectedProcess.id}` : null)
    );
  }, [selectedProcess]);

  // Subscribe to the process stream for real-time updates
  useEffect(() => {
    if (!isConnected || !currentProcessStreamKey) return undefined;

    console.log(`🔄 Subscribing to process stream: ${currentProcessStreamKey}`);
    return subscribeStream(currentProcessStreamKey);
  }, [isConnected, currentProcessStreamKey, subscribeStream]);

  // Enhanced Gauge States
  const [gaugeFormData, setGaugeFormData] = useState({
    // Basic fields
    name: "",
    type: "Go",
    size: "",
    unit: "mm",
    toleranceMin: "",
    toleranceMax: "",
    material: "",
    serialNumber: "",
    calibrationDate: "",
    calibrationDue: "",
    certificateNumber: "",
    condition: "Good",
    status: "Pass",
    measuredValue: "",
    remarks: "",
    manufacturer: "",
    minRange: "",
    maxRange: "",
    threadPitch: "",
    threadClass: "",
    boreRange: "",
    indicatorType: "",
    depthRange: "",
    baseType: "",
    heightRange: "",
    resolution: "",
    plugDiameter: "",
    plugType: "",
    snapRange: "",
    anvilType: "",
  });

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL =
    import.meta.env.VITE_REACT_APP_BACKEND_BASEURL ||
    "http://localhost:5000/api";

  useEffect(() => {
    fetchOrders();
    fetchInspectors();
    fetchInspectionRecords();
    fetchDrawings();
  }, []);

  // Fetch Purchase Orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/purchase-orders`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        console.warn("No orders data received");
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Processes
  const fetchProcesses = async () => {
    try {
      const companyId = selectedCompany?._id || selectedCompany;

      if (!companyId) {
        console.warn("No company selected, skipping process fetch");
        setProcesses([]);
        return;
      }

      const response = await axios.get(`${API_URL}/qc-inspection/process`, {
        params: {
          companyId: companyId,
          ...(selectedItem && { itemId: selectedItem.id }),
        },
        withCredentials: true,
      });

      if (response.data.success) {
        setProcesses(response.data.data || []);
      } else {
        setProcesses([]);
      }
    } catch (error) {
      console.error("Error fetching processes:", error);
      setProcesses([]);
    }
  };

  // Fetch Drawings - UPDATED to handle processes
  const fetchDrawings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/folder/all`,
        { withCredentials: true },
      );

      if (response.data.success) {
        // Transform drawings to include folderName
        const drawingsWithFolderName = response.data.drawings.map(
          (drawing) => ({
            ...drawing,
            folderName: drawing.folderId?.name || "Uncategorized",
          }),
        );

        setDrawings(drawingsWithFolderName);
        // console.log("Drawings loaded:", drawingsWithFolderName.length);

        // Debug: log first drawing to verify folder data
        if (drawingsWithFolderName.length > 0) {
          // console.log("Sample drawing:", drawingsWithFolderName[0]);
          // console.log("Folder name:", drawingsWithFolderName[0].folderName);
        }
      } else {
        toast.error(response.data.message || "Failed to fetch drawings");
      }
    } catch (error) {
      console.error("Error fetching drawings:", error);
      toast.error(error.response?.data?.message || "Failed to fetch drawings");
    } finally {
      setLoading(false);
    }
  };

  // Fetch processes when company or item changes
  useEffect(() => {
    if (selectedCompany) {
      fetchProcesses();
    }
  }, [selectedCompany, selectedItem]);

  // Fetch Inspectors
  const fetchInspectors = async () => {
    try {
      const response = await axios.get(`${API_URL}/employee`, {
        withCredentials: true,
      });
      if (response.data.success) {
        const inspectorList = response.data.data || [];
        setInspectors(inspectorList);

        if (inspectorList.length > 0) {
          setFormData((prev) => ({
            ...prev,
            inspector:
              inspectorList[0].firstName ||
              inspectorList[0].role ||
              "Inspector",
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching inspectors:", error);
      setInspectors([
        { _id: "1", name: "John Smith" },
        { _id: "2", name: "Sarah Johnson" },
        { _id: "3", name: "Mike Brown" },
      ]);
      setFormData((prev) => ({
        ...prev,
        inspector: "John Smith",
      }));
    }
  };

  // Fetch inspection records
  const fetchInspectionRecords = async () => {
    try {
      const response = await axios.get(`${API_URL}/qc-inspection`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setRecords(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching inspections:", error);
      try {
        const altResponse = await axios.get(`${API_URL}/inspections`, {
          withCredentials: true,
        });
        if (altResponse.data.success) {
          setRecords(altResponse.data.data || []);
        }
      } catch (altError) {
        console.error("Alternative inspection fetch failed:", altError);
        setRecords([]);
      }
    }
  };

  const selectedCompanySocketId = useMemo(() => {
    if (!selectedCompany || !Array.isArray(orders)) return "";

    const matchingOrder = orders.find((order) => {
      const companyName =
        order.submittedBy?.companyName ||
        order.companyName ||
        order.client?.name;
      return companyName === selectedCompany;
    });

    return String(
      matchingOrder?.clientId ||
        matchingOrder?.companyId ||
        matchingOrder?._id ||
        "",
    );
  }, [orders, selectedCompany]);

  // Join the selected company's room so records submitted from another
  // browser/operator appear in the history table without a page refresh.
  useEffect(() => {
    if (!isConnected || !selectedCompanySocketId) return undefined;
    return subscribeCompany(selectedCompanySocketId);
  }, [isConnected, selectedCompanySocketId, subscribeCompany]);

  // The submitting browser already inserts its saved record into local state.
  // Other inspection changes are reloaded from the API to keep this table
  // consistent with MongoDB.
  useEffect(() => {
    if (!lastSPCEvent) return;

    const action = String(lastSPCEvent.action || "");
    if (!action.startsWith("inspection-")) return;
    if (
      lastSPCEvent.originSocketId &&
      lastSPCEvent.originSocketId === socketId
    ) {
      return;
    }

    fetchInspectionRecords();
  }, [lastSPCEvent?.eventId, lastSPCEvent?.receivedAt, socketId]);

  const uniqueCompanies = useMemo(() => {
    const companyMap = new Map();
    if (!orders || orders.length === 0) return [];

    orders.forEach((order) => {
      const company =
        order.submittedBy?.companyName ||
        order.companyName ||
        order.client?.name;
      if (company) {
        const key = company.trim().toLowerCase();
        if (!companyMap.has(key)) {
          companyMap.set(key, company);
        }
      }
    });

    return Array.from(companyMap.values()).sort();
  }, [orders]);

  const items = useMemo(() => {
    if (!selectedCompany || !orders || orders.length === 0) return [];

    const companyOrders = orders.filter((po) => {
      const companyName =
        po.submittedBy?.companyName || po.companyName || po.client?.name;
      return companyName === selectedCompany;
    });

    const itemMap = new Map();
    companyOrders.forEach((po) => {
      if (po.items && Array.isArray(po.items)) {
        po.items.forEach((item) => {
          const key = item._id || item.itemCode || item.name;
          if (!itemMap.has(key)) {
            itemMap.set(key, {
              id: item._id || item.itemCode || key,
              name:
                item.itemCode ||
                item.name ||
                item.productName ||
                "Unknown Item",
              description: item.description || item.material || "",
              material: item.material || item.description || "",
              poNumber: item.orderNumber || po.poNumber || "N/A",
              quantity: item.quantity || 0,
              poId: po._id,
              unitPrice: item.unitPrice || 0,
            });
          }
        });
      }
    });

    return Array.from(itemMap.values());
  }, [selectedCompany, orders]);

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      `${item.name} ${item.description || ""}`
        .toLowerCase()
        .includes(itemSearch.toLowerCase()),
    );
  }, [items, itemSearch]);

  const filteredDrawings = useMemo(() => {
    return drawings.filter((drawing) => {
      const search = drawingSearch.toLowerCase();
      return (
        drawing.title?.toLowerCase().includes(search) ||
        drawing.drawingNumber?.toLowerCase().includes(search) ||
        drawing._id?.toLowerCase().includes(search)
      );
    });
  }, [drawings, drawingSearch]);

  const filteredRecords = useMemo(() => {
    if (!records || records.length === 0) return [];

    return records.filter((record) => {
      const matchesCompany =
        filterCompany === "All" || record.companyName === filterCompany;
      const matchesStatus =
        filterStatus === "All" || record.status === filterStatus;
      const matchesSearch =
        (record.itemName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (record.processName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (record.inspector || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (record.batchNumber || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      return matchesCompany && matchesStatus && matchesSearch;
    });
  }, [records, filterCompany, filterStatus, searchTerm]);

  const processOptions = useMemo(() => {
    if (!selectedItem) return [];
    return processes.filter(
      (p) => p.itemId === selectedItem.id || p.itemName === selectedItem.name,
    );
  }, [processes, selectedItem]);

  const editCompanyOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [editingRecord?.companyName, ...uniqueCompanies]
            .map((value) => String(value || "").trim())
            .filter(Boolean),
        ),
      ),
    [editingRecord?.companyName, uniqueCompanies],
  );

  const editItemOptions = useMemo(() => {
    const options = new Map();
    const currentName = String(editingRecord?.itemName || "").trim();
    if (currentName) {
      options.set(currentName.toLowerCase(), {
        id: checkpointReferenceString(editingRecord?.itemId),
        name: currentName,
      });
    }

    (orders || []).forEach((order) => {
      const companyName = getEditableFieldText(
        order.submittedBy?.companyName,
        order.companyName,
        order.client?.name,
      );
      if (
        editingRecord?.companyName &&
        companyName.toLowerCase() !==
          String(editingRecord.companyName).trim().toLowerCase()
      ) {
        return;
      }

      (order.items || []).forEach((item) => {
        const name = getEditableFieldText(
          item.itemCode,
          item.name,
          item.productName,
        );
        if (!name) return;
        options.set(name.toLowerCase(), {
          id: checkpointReferenceString(
            item._id || item.itemId || item.itemCode,
          ),
          name,
          description: item.description || item.material || "",
        });
      });
    });

    return Array.from(options.values());
  }, [
    editingRecord?.companyName,
    editingRecord?.itemId,
    editingRecord?.itemName,
    orders,
  ]);

  const editProcessOptions = useMemo(() => {
    const names = [
      editingRecord?.processName,
      ...(processes || [])
        .filter(
          (process) =>
            !editingRecord?.itemName ||
            !process.itemName ||
            String(process.itemName).trim().toLowerCase() ===
              String(editingRecord.itemName).trim().toLowerCase(),
        )
        .map((process) => process.name || process.processName),
      ...(records || [])
        .filter(
          (record) =>
            (!editingRecord?.companyName ||
              record.companyName === editingRecord.companyName) &&
            (!editingRecord?.itemName ||
              record.itemName === editingRecord.itemName),
        )
        .map((record) => record.processName),
    ];

    return Array.from(
      new Set(names.map((value) => String(value || "").trim()).filter(Boolean)),
    );
  }, [
    editingRecord?.companyName,
    editingRecord?.itemName,
    editingRecord?.processName,
    processes,
    records,
  ]);

  const editTimeSlotOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [editingRecord?.timeSlot, ...shiftTimings]
            .map((value) => String(value || "").trim())
            .filter(Boolean),
        ),
      ),
    [editingRecord?.timeSlot, shiftTimings],
  );

  const editInspectorOptions = useMemo(() => {
    const names = [
      editingRecord?.inspector,
      ...(inspectors || []).map((inspector) =>
        getEditableFieldText(
          inspector.firstName,
          inspector.name,
          inspector.fullName,
          inspector.role,
        ),
      ),
    ];

    return Array.from(
      new Set(names.map((value) => String(value || "").trim()).filter(Boolean)),
    );
  }, [editingRecord?.inspector, inspectors]);

  const inspectionPlanStatus = String(
    selectedProcess?.planStatus || selectedProcess?.status || "draft",
  ).toLowerCase();
  const isInspectionPlanLocked = ["approved", "effective"].includes(
    inspectionPlanStatus,
  );

  const inspectionFrequencyLabel = useMemo(() => {
    const frequencies = (selectedProcess?.checkpoints || [])
      .map((checkpoint) => checkpoint.sampling?.frequency)
      .filter(Boolean);
    if (frequencies.length === 0) return "Per approved sampling plan";
    const first = frequencies[0];
    if (first.triggerType === "time") {
      return `Every ${first.intervalValue || 1} ${first.intervalUnit || "hour"}${Number(first.intervalValue || 1) === 1 ? "" : "s"}`;
    }
    if (first.triggerType === "pieces") {
      return `Every ${first.intervalValue || 1} pieces`;
    }
    return String(first.triggerType || "Per approved sampling plan")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }, [selectedProcess]);

  // Statistics
  const totalInspections = records.length || 0;
  const passedInspections =
    records.filter((r) => r.status === "Pass").length || 0;
  const failedInspections =
    records.filter((r) => r.status === "Fail").length || 0;
  const passRate =
    totalInspections > 0
      ? Math.round((passedInspections / totalInspections) * 100)
      : 0;

  // Handle company selection
  const handleCompanySelect = (companyName) => {
    setSelectedCompany(companyName);
    setSelectedItem(null);
    setSelectedProcess(null);
    setSelectedDrawing(null);
    setInspectionSource(null);
    setChecklistResults({});
    setMeasurementResults({});
    setChecklistRemarks({});
    setUploadedImages([]);
    setFilterCompany(companyName);
    setPieceMeasurements([]);
    setPieceCount(1);
    // setGaugeResults({});
  };

  // Handle item selection
  const handleItemSelect = async (itemId) => {
    const item = items.find((i) => i.id === itemId);
    setSelectedItem(item);
    setSelectedProcess(null);
    setSelectedDrawing(null);
    setInspectionSource(null);
    setChecklistResults({});
    setMeasurementResults({});
    setChecklistRemarks({});
    setUploadedImages([]);
    // setGaugeResults({});
  };

  const handleDrawingSelect = (drawingId) => {
    const drawing = drawings.find((d) => d._id === drawingId);
    setSelectedDrawing(drawing);
    setSelectedDrawingProcesses([]);
    setSelectedProcess(null);
    setChecklistResults({});
    setMeasurementResults({});
    setChecklistRemarks({});

    if (drawing) {
      // Check if drawing has processes
      if (drawing.processes && drawing.processes.length > 0) {
        setSelectedDrawingProcesses(drawing.processes);
        // Auto-select first process
        const firstProcess = drawing.processes[0];
        if (firstProcess) {
          // CORRECTED: Properly structure the process object for the form
          const processObj = {
            id: `drawing-${drawing._id}-${firstProcess.processName}`,
            name: firstProcess.processName,
            checkpoints: firstProcess.checkpoints || [],
            isDrawing: true,
            isCustom: true,
            _id: `drawing-${drawing._id}`,
            description: `Process from drawing: ${drawing.title}`,
          };
          setSelectedProcess(processObj);
          // CRITICAL: Set inspectionSource to 'drawing' to enable the form
          setInspectionSource("drawing");

          // CORRECTED: Initialize checkpoints directly without using undefined function
          const initialChecklist = {};
          const initialMeasurements = {};
          const initialRemarks = {};

          (firstProcess.checkpoints || []).forEach((cp, index) => {
            const cpId = getCheckpointKey(cp, index);
            initialChecklist[cpId] = "Pending";
            initialRemarks[cpId] = "";
            initialMeasurements[cpId] = buildCheckpointEntryState(
              { ...cp, id: cpId },
              index,
            );
          });

          setChecklistResults(initialChecklist);
          setMeasurementResults(initialMeasurements);
          setChecklistRemarks(initialRemarks);

          toast.success(
            `Loaded ${firstProcess.checkpoints?.length || 0} checkpoints from "${firstProcess.processName}"`,
          );
        }
      } else {
        // No processes found - show option to create
        toast.success(
          "This drawing has no processes. Click 'Create Process' to add one.",
        );
        setShowCreateProcessModal(true);
      }
    }
  };

  // Clear drawing selection
  const clearDrawingSelection = () => {
    setSelectedDrawing(null);
    setSelectedProcess(null);
    setInspectionSource(null);
    setChecklistResults({});
    setMeasurementResults({});
    setChecklistRemarks({});
    // setGaugeResults({});
    toast.success("Drawing selection cleared");
  };

  const handleDrawingProcessSelect = (processName) => {
    const process = selectedDrawingProcesses.find(
      (p) => p.processName === processName,
    );
    if (process) {
      const processObj = {
        id: `drawing-${selectedDrawing?._id}-${process.processName}`,
        name: process.processName,
        checkpoints: process.checkpoints || [],
        isDrawing: true,
        isCustom: true,
        _id: `drawing-${selectedDrawing?._id}`,
        description: `Process from drawing: ${selectedDrawing?.title || ""}`,
      };
      setSelectedProcess(processObj);
      // CRITICAL: Set inspectionSource to 'drawing'
      setInspectionSource("drawing");

      // Initialize checkpoints
      const initialChecklist = {};
      const initialMeasurements = {};
      const initialRemarks = {};

      (process.checkpoints || []).forEach((cp, index) => {
        const cpId = getCheckpointKey(cp, index);
        initialChecklist[cpId] = "Pending";
        initialRemarks[cpId] = "";
        initialMeasurements[cpId] = buildCheckpointEntryState(
          { ...cp, id: cpId },
          index,
        );
      });

      setChecklistResults(initialChecklist);
      setMeasurementResults(initialMeasurements);
      setChecklistRemarks(initialRemarks);

      toast.success(
        `Switched to "${process.processName}" with ${process.checkpoints?.length || 0} checkpoints`,
      );
    }
  };
  const handleProcessSelect = (processId) => {
    if (inspectionSource === "drawing") {
      toast.info(
        "Drawing checkpoints are being used. To select a process, clear the drawing selection.",
      );
      return;
    }

    const process = processes.find(
      (p) => p.id === processId || p._id === processId,
    );

    if (!process) {
      toast.error("Process not found");
      return;
    }

    if (!process.checkpoints || process.checkpoints.length === 0) {
      toast.warning("No checkpoints in this process");
      return;
    }

    setSelectedProcess(process);
    setInspectionSource("process");

    const initialChecklist = {};
    const initialMeasurements = {};
    const initialRemarks = {};
    process.checkpoints.forEach((cp, index) => {
      const cpId = getCheckpointKey(cp, index);
      initialChecklist[cpId] = "Pending";
      initialRemarks[cpId] = "";
      initialMeasurements[cpId] = buildCheckpointEntryState(
        { ...cp, id: cpId },
        index,
      );
    });
    setChecklistResults(initialChecklist);
    setMeasurementResults(initialMeasurements);
    setChecklistRemarks(initialRemarks);
    toast.success(
      `Loaded ${process.checkpoints.length} checkpoints from ${process.name}`,
    );
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            id: `IMG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            data: reader.result,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((newImages) => {
      setUploadedImages((prev) => [...prev, ...newImages]);
      toast.success(`${newImages.length} images uploaded`);
    });
  };

  const removeImage = (imageId) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const openEditModal = (process) => {
    if (!process) {
      toast.error("No process selected to edit");
      return;
    }

    if (process.isDrawing) {
      toast.error(
        "Drawing-based processes cannot be edited. Create a custom process instead.",
      );
      return;
    }

    if (!process.isCustom) {
      toast.error(
        "Default processes cannot be edited. Please create a custom process.",
      );
      return;
    }

    setEditingProcess(process);
    setCustomProcessName(process.name);
    setCustomCheckpoints(JSON.parse(JSON.stringify(process.checkpoints || [])));
    setShowEditModal(true);
  };

  const deleteCurrentProcess = async () => {
    if (!editingProcess) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${editingProcess.name}"?`,
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);

      const { data } = await axios.delete(
        `${API_URL}/qc-inspection/process/${editingProcess.id}`,
      );

      if (data.success) {
        setProcesses((prev) =>
          prev.filter((process) => process.id !== editingProcess.id),
        );
        setShowEditModal(false);
        setEditingProcess(null);
        setCustomProcessName("");
        setCustomCheckpoints([]);
        toast.success(data.message);
      }
    } catch (error) {
      console.error("Delete process error:", error);
      toast.error(error.response?.data?.message || "Failed to delete process");
    } finally {
      setLoading(false);
    }
  };

  const updateProcess = async () => {
    if (!editingProcess) {
      toast.error("No process being edited");
      return;
    }

    if (editingProcess.isDrawing) {
      toast.error(
        "Cannot edit drawing-based processes. Please create a custom process.",
      );
      setShowEditModal(false);
      setEditingProcess(null);
      return;
    }

    if (!customProcessName.trim()) {
      toast.error("Please enter a process name.");
      return;
    }

    if (customCheckpoints.length === 0) {
      toast.error("Please add at least one checkpoint.");
      return;
    }

    const updatedProcess = {
      name: customProcessName.trim(),
      checkpoints: customCheckpoints,
      description: `Custom inspection process for ${editingProcess.itemName || selectedItem?.name || "item"}`,
    };

    try {
      setLoading(true);
      const processId = editingProcess.id || editingProcess._id;

      if (processId.toString().startsWith("drawing-")) {
        toast.error(
          "Cannot update drawing-based processes. Please create a custom process.",
        );
        setShowEditModal(false);
        setEditingProcess(null);
        return;
      }

      const response = await axios.put(
        `${API_URL}/qc-inspection/process/${processId}`,
        updatedProcess,
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        toast.success(
          `Process updated with ${customCheckpoints.length} checkpoints!`,
        );

        const updatedProcesses = processes.map((p) => {
          if (p.id === processId || p._id === processId) {
            return { ...p, ...updatedProcess, checkpoints: customCheckpoints };
          }
          return p;
        });
        setProcesses(updatedProcesses);

        if (
          selectedProcess &&
          (selectedProcess.id === processId ||
            selectedProcess._id === processId)
        ) {
          setSelectedProcess({
            ...selectedProcess,
            ...updatedProcess,
            checkpoints: customCheckpoints,
          });

          const initialChecklist = {};
          const initialMeasurements = {};
          const initialRemarks = {};
          customCheckpoints.forEach((cp, index) => {
            const cpId = getCheckpointKey(cp, index);
            initialChecklist[cpId] = "Pending";
            initialRemarks[cpId] = "";
            initialMeasurements[cpId] = buildCheckpointEntryState(
              { ...cp, id: cpId },
              index,
            );
          });
          setChecklistResults(initialChecklist);
          setMeasurementResults(initialMeasurements);
          setChecklistRemarks(initialRemarks);
        }

        setShowEditModal(false);
        setEditingProcess(null);
        setCustomProcessName("");
        setCustomCheckpoints([]);
        fetchProcesses();
      }
    } catch (error) {
      console.error("Error updating process:", error);
      toast.error(error.response?.data?.message || "Failed to update process");
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistChange = (checkpointId, value) => {
    setChecklistResults((prev) => ({
      ...prev,
      [checkpointId]: value,
    }));
  };

  const handleRemarkChange = (checkpointId, value) => {
    setChecklistRemarks((prev) => ({
      ...prev,
      [checkpointId]: value,
    }));
  };

  const handleMeasurementChange = (checkpointId, field, value) => {
    const checkpoint = selectedProcess?.checkpoints?.find(
      (item, index) =>
        getCheckpointKey(item, index) === checkpointId ||
        item.name === checkpointId,
    );

    setMeasurementResults((previous) => {
      const current =
        previous[checkpointId] || buildCheckpointEntryState(checkpoint || {});
      const next = { ...current, [field]: value };
      const decision = deriveCheckpointStatus(checkpoint || {}, next);

      next.pass = decision.pass;
      next.deviation = decision.deviation ?? next.deviation ?? null;
      next.resultReason = decision.reason || "";

      setChecklistResults((statuses) => ({
        ...statuses,
        [checkpointId]: decision.status,
      }));

      return { ...previous, [checkpointId]: next };
    });
  };

  const initializeMultiPiece = (count, checkpointId = null) => {
    const numericCheckpointEntries = (selectedProcess?.checkpoints || [])
      .map((checkpoint, index) => ({ checkpoint, index }))
      .filter(({ checkpoint }) => isNumericCheckpoint(checkpoint));

    const targetCheckpointEntries = checkpointId
      ? numericCheckpointEntries.filter(
          ({ checkpoint, index }) =>
            getCheckpointKey(checkpoint, index) === checkpointId ||
            checkpoint.name === checkpointId,
        )
      : numericCheckpointEntries;

    if (targetCheckpointEntries.length === 0) {
      toast.error("No numeric checkpoint is available for multi-piece entry");
      return;
    }

    const cachedReadings = new Map();

    targetCheckpointEntries.forEach(({ checkpoint, index }) => {
      const key = getCheckpointKey(checkpoint, index);
      const readings = collectFrontendRawReadings({
        checkpointId: key,
        entry: measurementResults[key] || {},
        checkpointMeasurement: checkpointMeasurements[key] || {},
        pieces: pieceMeasurements,
      });
      cachedReadings.set(
        key,
        new Map(
          readings.map((reading) => [
            `${reading.pieceNumber}:${reading.readingNumber}`,
            reading,
          ]),
        ),
      );
    });

    const pieces = Array.from({ length: count }, (_, pieceIndex) => {
      const measurements = {};

      targetCheckpointEntries.forEach(({ checkpoint, index }) => {
        const key = getCheckpointKey(checkpoint, index);
        const specification = getCheckpointSpecification(checkpoint);
        const sampling = getCheckpointSampling(checkpoint);
        const checkpointReadingMap = cachedReadings.get(key) || new Map();

        const readings = Array.from(
          { length: sampling.readingsPerPiece },
          (_, readingIndex) => {
            const existing = checkpointReadingMap.get(
              `${pieceIndex + 1}:${readingIndex + 1}`,
            );

            return {
              readingNumber: readingIndex + 1,
              value: existing?.value ?? "",
              pass: typeof existing?.pass === "boolean" ? existing.pass : null,
              deviation: existing?.deviation ?? null,
              resultReason: existing?.resultReason || "",
              instrumentId: existing?.instrumentId || "",
              measuredAt: existing?.measuredAt || new Date().toISOString(),
            };
          },
        );

        const enteredValues = readings
          .map((reading) => toFiniteNumberOrNull(reading.value))
          .filter((value) => value !== null);
        const measured =
          enteredValues.length > 0
            ? enteredValues.reduce((sum, value) => sum + value, 0) /
              enteredValues.length
            : "";

        measurements[key] = {
          ...buildCheckpointEntryState(checkpoint, index),
          ...(measurementResults[key] || {}),
          checkpointId: key,
          checkpointName: checkpoint.name,
          pieceNumber: pieceIndex + 1,
          expected: specification.nominal ?? "",
          unit: specification.unit,
          lsl: specification.lsl,
          usl: specification.usl,
          measured,
          readings,
          pass:
            readings.length > 0 &&
            readings.every((reading) => reading.pass === true)
              ? true
              : readings.some((reading) => reading.pass === false)
                ? false
                : null,
        };
      });

      const entries = Object.values(measurements);
      const status = entries.some((entry) => entry.pass === false)
        ? "Fail"
        : entries.length > 0 && entries.every((entry) => entry.pass === true)
          ? "Pass"
          : "Pending";

      return {
        pieceNumber: pieceIndex + 1,
        measurements,
        status,
      };
    });

    setActiveMultiPieceCheckpointId(checkpointId);
    setPieceMeasurements(pieces);
    setPieceCount(count);
    setShowMultiPieceModal(true);
  };

  const updatePieceMeasurement = (
    pieceIndex,
    checkpointKey,
    readingIndex,
    value,
  ) => {
    setPieceMeasurements((previous) => {
      const updated = previous.map((piece) => ({
        ...piece,
        measurements: { ...piece.measurements },
      }));
      const piece = updated[pieceIndex];
      const measurement = {
        ...piece.measurements[checkpointKey],
        readings: [...(piece.measurements[checkpointKey]?.readings || [])],
      };

      const checkpoint = selectedProcess?.checkpoints?.find(
        (item, index) =>
          getCheckpointKey(item, index) === checkpointKey ||
          item.name === checkpointKey,
      );
      const decision = evaluateNumericResultAgainstCheckpoint(
        value,
        checkpoint || {},
      );

      measurement.readings[readingIndex] = {
        ...measurement.readings[readingIndex],
        value,
        pass: decision.pass,
        deviation: decision.deviation,
        resultReason: decision.reason,
      };

      const enteredValues = measurement.readings
        .map((reading) => toFiniteNumberOrNull(reading.value))
        .filter((reading) => reading !== null);
      measurement.measured =
        enteredValues.length > 0
          ? enteredValues.reduce((sum, reading) => sum + reading, 0) /
            enteredValues.length
          : "";
      measurement.pass = measurement.readings.every(
        (reading) => reading.pass === true,
      )
        ? true
        : measurement.readings.some((reading) => reading.pass === false)
          ? false
          : null;

      piece.measurements[checkpointKey] = measurement;
      const pieceEntries = Object.values(piece.measurements);
      piece.status = pieceEntries.some((entry) => entry.pass === false)
        ? "Fail"
        : pieceEntries.length > 0 &&
            pieceEntries.every((entry) => entry.pass === true)
          ? "Pass"
          : "Pending";

      return updated;
    });
  };

  const applyMultiPieceMeasurements = () => {
    if (pieceMeasurements.length === 0) {
      toast.error("No piece measurements to apply");
      return;
    }

    const firstPiece = pieceMeasurements[0];
    const measurementKeys = Object.keys(firstPiece.measurements || {});
    const checkpointMeasurementsMap = {};
    const averagedMeasurements = {};
    const nextStatuses = {};

    for (const key of measurementKeys) {
      const checkpoint = selectedProcess?.checkpoints?.find(
        (item, index) =>
          getCheckpointKey(item, index) === key || item.name === key,
      );
      const sampling = getCheckpointSampling(checkpoint || {});
      const expectedReadingCount =
        sampling.piecesPerInspection * sampling.readingsPerPiece;
      const rawReadings = [];
      const pieceValues = [];

      pieceMeasurements.forEach((piece) => {
        const measurement = piece.measurements?.[key];
        const pieceReadings = [];

        (measurement?.readings || []).forEach((reading) => {
          const numericValue = toFiniteNumberOrNull(reading.value);
          if (numericValue !== null) {
            const normalizedReading = {
              pieceNumber: piece.pieceNumber,
              readingNumber: reading.readingNumber,
              value: numericValue,
              pass: reading.pass,
              deviation: reading.deviation,
              resultReason: reading.resultReason,
            };
            pieceReadings.push(normalizedReading);
            rawReadings.push(normalizedReading);
          }
        });

        if (pieceReadings.length === sampling.readingsPerPiece) {
          const pieceAverage =
            pieceReadings.reduce((sum, reading) => sum + reading.value, 0) /
            pieceReadings.length;
          pieceValues.push({
            pieceNumber: piece.pieceNumber,
            value: pieceAverage,
            pass: pieceReadings.every((reading) => reading.pass === true),
            readings: pieceReadings,
          });
        }
      });

      if (rawReadings.length !== expectedReadingCount) {
        toast.error(
          `${checkpoint?.name || key}: ${rawReadings.length}/${expectedReadingCount} readings entered`,
        );
        return;
      }

      if (pieceValues.length !== sampling.piecesPerInspection) {
        toast.error(
          `${checkpoint?.name || key}: readings are not complete for every piece`,
        );
        return;
      }

      const numericValues = pieceValues.map((piece) => piece.value);
      const mean =
        numericValues.reduce((sum, reading) => sum + reading, 0) /
        numericValues.length;
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const variance =
        numericValues.length > 1
          ? numericValues.reduce(
              (sum, reading) => sum + Math.pow(reading - mean, 2),
              0,
            ) /
            (numericValues.length - 1)
          : 0;
      const specification = getCheckpointSpecification(checkpoint || {});
      const allPass = rawReadings.every((reading) => reading.pass === true);

      checkpointMeasurementsMap[key] = {
        checkpointId: key,
        checkpointName: checkpoint?.name || key,
        resultType: "numeric",
        inspectionMethod: checkpoint?.inspectionMethod || "dimensional",
        expected: specification.nominal,
        lsl: specification.lsl,
        usl: specification.usl,
        unit: specification.unit,
        subgroupId: `SG-${Date.now()}-${key}`,
        subgroupSizePlanned: sampling.subgroupSize,
        subgroupSizeActual: pieceValues.length,
        readingsPerPiece: sampling.readingsPerPiece,
        pieceValues,
        rawReadings,
        statistics: {
          sampleSize: pieceValues.length,
          rawReadingCount: rawReadings.length,
          mean,
          min,
          max,
          range: max - min,
          stdDev: Math.sqrt(variance),
        },
        specificationStatus: allPass ? "Pass" : "Fail",
      };

      averagedMeasurements[key] = {
        ...(measurementResults[key] ||
          buildCheckpointEntryState(checkpoint || {})),
        measured: mean,
        sampleSize: pieceValues.length,
        allPieceValues: numericValues,
        pieceMeasurements: pieceValues,
        rawReadings,
        pass: allPass,
        resultReason: allPass
          ? "All individual readings are within specification"
          : "One or more individual readings are outside specification",
      };
      nextStatuses[key] = allPass ? "OK" : "Fail";
    }

    setCheckpointMeasurements((previous) => ({
      ...previous,
      ...checkpointMeasurementsMap,
    }));
    setMeasurementResults((previous) => ({
      ...previous,
      ...averagedMeasurements,
    }));
    setChecklistResults((previous) => ({
      ...previous,
      ...nextStatuses,
    }));
    setShowMultiPieceModal(false);
    setActiveMultiPieceCheckpointId(null);

    toast.success(
      `Applied ${pieceMeasurements.length} pieces across ${measurementKeys.length} numeric checkpoint(s)`,
    );
  };

  // Fetch SPC data for a specific checkpoint in an inspection
  const fetchCheckpointSPCData = async (inspectionId, checkpointId) => {
    try {
      setLoading(true);

      // Use the new modal endpoint
      const response = await axios.get(
        `${API_URL}/qc-inspection/${inspectionId}/spc/modal/${encodeURIComponent(checkpointId)}`,
        { withCredentials: true },
      );

      console.log("SPC Data Repsonse", response.data);

      if (response.data.success) {
        // The data is already in the correct format for the modal
        const modalData = response.data.data;

        console.log("Modal Data:", modalData);
        console.log("Piece Values:", modalData.pieceValues);
        console.log("Statistics:", modalData.statistics);
        console.log("Chart Data:", modalData.chartData);

        setSpcCheckpointData(modalData);
        setSelectedInspectionForSPC(inspectionId);
        setSelectedCheckpointForSPC(checkpointId);
        setShowSPCModal(true);
        toast.success(`Loaded SPC data for checkpoint: ${checkpointId}`);
      } else {
        toast.error(response.data.message || "Failed to load SPC data");
      }
    } catch (error) {
      console.error("Error loading SPC data:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to load SPC data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch checkpoint SPC history across multiple inspections
  const fetchCheckpointSPCHistory = async (
    itemId,
    checkpointName,
    processId = null,
  ) => {
    try {
      setLoading(true);
      const url = processId
        ? `${API_URL}/qc-inspection/spc/checkpoint/${itemId}/${encodeURIComponent(checkpointName)}?processId=${processId}&limit=500`
        : `${API_URL}/qc-inspection/spc/checkpoint/${itemId}/${encodeURIComponent(checkpointName)}?limit=500`;

      const response = await axios.get(url, { withCredentials: true });

      if (response.data.success) {
        setSpcHistoryData(response.data.data);
        toast.success(
          `Loaded ${response.data.data.length} inspection records for ${checkpointName}`,
        );
        return response.data.data;
      } else {
        toast.error(response.data.message || "Failed to load SPC history");
        return [];
      }
    } catch (error) {
      console.error("Error loading SPC history:", error);
      toast.error(
        error.response?.data?.message || "Failed to load SPC history",
      );
      return [];
    } finally {
      setLoading(false);
    }
  };

  const viewSPCFromRecord = async (record) => {
    if (!record?._id || String(record._id).startsWith("local-")) {
      toast.error("Please sync this inspection with the server first");
      return;
    }

    try {
      setIsGeneratingCustomerReport(true);

      const optionsResponse = await axios.get(
        `${API_URL}/qc-inspection/${record._id}/report-options`,
        { withCredentials: true, timeout: 30000 },
      );

      if (!optionsResponse.data.success) {
        throw new Error(
          optionsResponse.data.message || "Unable to load report options",
        );
      }

      const options =
        optionsResponse.data.data?.criticalCheckpointOptions || [];
      const checkpointId =
        optionsResponse.data.data?.selectedCriticalCheckpointId ||
        options[0]?.checkpointId ||
        undefined;

      const response = await axios.get(
        `${API_URL}/qc-inspection/${record._id}/report`,
        {
          params: {
            criticalCheckpointId: checkpointId,
            pdiSampleLimit: 5,
            historyLimit: 500,
          },
          withCredentials: true,
          timeout: 30000,
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to load SPC data");
      }

      const reportData = response.data.data;

      setSelectedRecord((previous) => ({
        ...(previous || record),
        ...reportData,
        spcDataLoaded: true,
        pdiDataLoaded: true,
      }));
      setModalActiveTab("spc");
      toast.success("SPC and PDI data loaded successfully");
    } catch (error) {
      console.error("Error loading SPC/PDI report:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load SPC/PDI data",
      );
    } finally {
      setIsGeneratingCustomerReport(false);
    }
  };
  const refreshSelectedSPCReport = async (checkpointId) => {
    const inspectionId =
      selectedRecord?._id || selectedRecord?.sourceInspectionIds?.[0];
    if (!inspectionId) return;

    const response = await axios.get(
      `${API_URL}/qc-inspection/${inspectionId}/report`,
      {
        params: {
          criticalCheckpointId:
            checkpointId || selectedRecord?.selectedControlChart?.checkpointId,
          pdiSampleLimit: 5,
          historyLimit: 500,
        },
        withCredentials: true,
        timeout: 30000,
      },
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Unable to refresh SPC report");
    }

    setSelectedRecord((previous) => ({
      ...(previous || {}),
      ...response.data.data,
      spcDataLoaded: true,
      pdiDataLoaded: true,
    }));
  };

  const prepareSelectedSPCBaselineFromExisting = async () => {
    const inspectionId =
      selectedRecord?._id || selectedRecord?.sourceInspectionIds?.[0];
    const chart = selectedRecord?.selectedControlChart || {};
    const checkpointId = chart.checkpointId;

    if (!inspectionId || !checkpointId) {
      toast.error("Load an SPC chart before preparing its baseline");
      return;
    }

    try {
      setIsUpdatingBaseline(true);
      const response = await axios.post(
        `${API_URL}/qc-inspection/${inspectionId}/spc/checkpoint/${encodeURIComponent(
          checkpointId,
        )}/baseline/prepare`,
        { useExistingSubgroups: true },
        { withCredentials: true, timeout: 30000 },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Baseline preparation failed");
      }

      toast.success(
        "Existing complete subgroups were used to calculate trial limits. Review and approve the baseline.",
      );
      await refreshSelectedSPCReport(checkpointId);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to prepare baseline from existing data",
      );
    } finally {
      setIsUpdatingBaseline(false);
    }
  };

  const approveSelectedSPCBaseline = async (
    force = false,
    approvalReason = null,
  ) => {
    const inspectionId =
      selectedRecord?._id || selectedRecord?.sourceInspectionIds?.[0];
    const chart = selectedRecord?.selectedControlChart || {};
    const checkpointId = chart.checkpointId;

    if (!inspectionId || !checkpointId) {
      toast.error("Load an SPC chart before approving its baseline");
      return;
    }

    const collected = Number(
      chart.subgroupsCollected ?? chart.subgroupCount ?? 0,
    );
    const minimum = Number(chart.minimumSubgroups ?? 20);
    const controlMode = chart.controlMode || "auto";

    if (controlMode === "auto" && collected < minimum) {
      toast.error(
        `Baseline is not ready: ${collected}/${minimum} complete ${
          String(chart.type || "").toLowerCase() === "imr"
            ? "readings"
            : "subgroups"
        }.`,
      );
      return;
    }

    let reason = approvalReason;
    if (reason === null) {
      reason = window.prompt(
        "Enter the baseline review/approval reason. It will be saved in the audit log:",
        force
          ? "Special causes reviewed and force approval authorized"
          : "Trial limits reviewed and approved",
      );
      if (reason === null) return;
      if (!reason.trim()) {
        toast.error("An approval reason is required");
        return;
      }
    }

    try {
      setIsUpdatingBaseline(true);
      const response = await axios.post(
        `${API_URL}/qc-inspection/${inspectionId}/spc/checkpoint/${encodeURIComponent(
          checkpointId,
        )}/baseline/approve`,
        {
          force,
          reason: reason.trim(),
        },
        { withCredentials: true, timeout: 30000 },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Baseline approval failed");
      }

      toast.success("SPC baseline approved and control limits frozen");
      await refreshSelectedSPCReport(checkpointId);
    } catch (error) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to approve SPC baseline";

      if (status === 409 && !force) {
        const proceed = window.confirm(
          `${message}\n\nForce approval should only be used after the signals or zero variation have been reviewed and documented. Continue?`,
        );
        if (proceed) {
          setIsUpdatingBaseline(false);
          await approveSelectedSPCBaseline(true, reason);
          return;
        }
      } else {
        toast.error(message);
      }
    } finally {
      setIsUpdatingBaseline(false);
    }
  };

  const retireSelectedSPCBaseline = async () => {
    const inspectionId =
      selectedRecord?._id || selectedRecord?.sourceInspectionIds?.[0];
    const checkpointId = selectedRecord?.selectedControlChart?.checkpointId;

    if (!inspectionId || !checkpointId) {
      toast.error("No approved baseline is selected");
      return;
    }

    const reason = window.prompt(
      "Enter the reason for retiring this baseline (for example: tool, machine, material, method, or setup change):",
    );
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error("A baseline retirement reason is required");
      return;
    }

    try {
      setIsUpdatingBaseline(true);
      const response = await axios.patch(
        `${API_URL}/qc-inspection/${inspectionId}/spc/checkpoint/${encodeURIComponent(
          checkpointId,
        )}/baseline/retire`,
        { reason: reason.trim() },
        { withCredentials: true, timeout: 30000 },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Baseline retirement failed");
      }

      toast.success("SPC baseline retired");
      await refreshSelectedSPCReport(checkpointId);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to retire SPC baseline",
      );
    } finally {
      setIsUpdatingBaseline(false);
    }
  };

  // Helper function to calculate standard deviation
  const calculateStdDev = (values) => {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance =
      squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
    return Math.sqrt(variance);
  };

  const handleMultiPieceClick = () => {
    const numericCheckpoints = (selectedProcess?.checkpoints || []).filter(
      (checkpoint) => getCheckpointResultType(checkpoint) === "numeric",
    );

    if (numericCheckpoints.length === 0) {
      toast.info("No numeric checkpoints are available for sample recording");
      return;
    }

    const configuredPieceCounts = [
      ...new Set(
        numericCheckpoints.map(
          (checkpoint) => getCheckpointSampling(checkpoint).piecesPerInspection,
        ),
      ),
    ];

    if (configuredPieceCounts.length > 1) {
      toast.info(
        "Numeric checkpoints use different sample sizes. Open Record Readings from each checkpoint row.",
      );
      return;
    }

    initializeMultiPiece(configuredPieceCounts[0] || 1, null);
  };

  const addCustomCheckpoint = () => {
    if (!newCheckpoint.name.trim()) return;

    if (editingCheckpointId) {
      setCustomCheckpoints((prev) =>
        prev.map((cp) =>
          cp.id === editingCheckpointId
            ? {
                ...cp,
                name: newCheckpoint.name,
                type: newCheckpoint.type,
                unit: newCheckpoint.unit,
                tolerance: newCheckpoint.tolerance,
              }
            : cp,
        ),
      );
      setEditingCheckpointId(null);
    } else {
      setCustomCheckpoints((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...newCheckpoint,
        },
      ]);
    }

    setNewCheckpoint({
      name: "",
      type: "Visual",
      unit: "mm",
      tolerance: "±0.1",
    });
  };

  const removeCustomCheckpoint = (id) => {
    const removed = customCheckpoints.find((cp) => cp.id === id);
    setCustomCheckpoints(customCheckpoints.filter((cp) => cp.id !== id));
    toast.success(`Checkpoint "${removed?.name}" removed`);
  };

  const editCustomCheckpoint = (checkpoint) => {
    setEditingCheckpointId(checkpoint.id);
    setNewCheckpoint({
      name: checkpoint.name,
      type: checkpoint.type,
      unit: checkpoint.unit || "mm",
      tolerance: checkpoint.tolerance || "±0.1",
    });
  };

  const clearAllCheckpoints = () => {
    if (customCheckpoints.length === 0) return;
    if (window.confirm(`Remove all ${customCheckpoints.length} checkpoints?`)) {
      setCustomCheckpoints([]);
      toast.info("All checkpoints cleared");
    }
  };

  const createCustomProcess = async () => {
    if (!selectedCompany) {
      toast.error("Please select a company first.");
      return;
    }

    if (!selectedItem) {
      toast.error("Please select an item first.");
      return;
    }

    if (!customProcessName.trim()) {
      toast.error("Please enter a process name.");
      return;
    }

    if (customCheckpoints.length === 0) {
      toast.error("Please add at least one checkpoint.");
      return;
    }

    const newProcess = {
      id: `CUSTOM-PROC-${Date.now()}`,
      name: customProcessName.trim(),
      icon: "fa-cog",
      description: `Custom inspection process for ${selectedItem.name}`,
      checkpoints: customCheckpoints,
      isCustom: true,
      companyId: selectedCompany._id || selectedCompany,
      companyName: selectedCompany,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
    };

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/qc-inspection/process`,
        newProcess,
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        // ✅ MOVE this INSIDE the if block BEFORE using it
        const createdProcess = response.data.data;

        toast.success(
          `Custom process created with ${customCheckpoints.length} checkpoints!`,
        );

        // ✅ Now createdProcess is defined
        if (socket && socket.connected) {
          socket.emit("spc:data-changed", {
            action: "process-created",
            companyId: selectedCompany?._id || selectedCompany,
            processId: createdProcess.id || createdProcess._id,
            processName: createdProcess.name,
            spcStreamKey:
              createdProcess.spcStreamKey || `process-${createdProcess.id}`,
            timestamp: new Date().toISOString(),
          });
        }

        setProcesses([...processes, createdProcess]);
        setSelectedProcess(createdProcess);
        setInspectionSource("process");

        const initialChecklist = {};
        const initialMeasurements = {};
        const initialRemarks = {};
        createdProcess.checkpoints.forEach((cp, index) => {
          const cpId = getCheckpointKey(cp, index);
          initialChecklist[cpId] = "Pending";
          initialRemarks[cpId] = "";
          initialMeasurements[cpId] = buildCheckpointEntryState(
            { ...cp, id: cpId },
            index,
          );
        });
        setChecklistResults(initialChecklist);
        setMeasurementResults(initialMeasurements);
        setChecklistRemarks(initialRemarks);

        setCustomProcessName("");
        setCustomCheckpoints([]);
        setShowCustomModal(false);
        fetchProcesses();
      }
    } catch (error) {
      console.error("Error creating process:", error);
      toast.error(error.response?.data?.message || "Failed to create process");
    } finally {
      setLoading(false);
    }
  };

  const addCheckpointToDrawing = () => {
    if (!drawingCheckpointName.trim()) {
      toast.error("Please enter a checkpoint name");
      return;
    }

    const cpId = `cp-${Date.now()}`;
    const newCheckpoint = {
      id: cpId,
      name: drawingCheckpointName.trim(),
      type: drawingCheckpointType,
      unit: drawingCheckpointUnit || "mm",
      tolerance: drawingCheckpointTolerance || "±0.1",
    };

    setChecklistResults((prev) => ({
      ...prev,
      [cpId]: "Pending",
    }));

    setChecklistRemarks((prev) => ({
      ...prev,
      [cpId]: "",
    }));

    if (drawingCheckpointType === "Measurement") {
      setMeasurementResults((prev) => ({
        ...prev,
        [cpId]: {
          expected: "",
          measured: "",
          unit: drawingCheckpointUnit || "mm",
          tolerance: drawingCheckpointTolerance || "±0.1",
        },
      }));
    }

    if (selectedProcess) {
      const updatedProcess = {
        ...selectedProcess,
        checkpoints: [...(selectedProcess.checkpoints || []), newCheckpoint],
      };
      setSelectedProcess(updatedProcess);
    }

    toast.success(
      `Checkpoint "${drawingCheckpointName.trim()}" added successfully!`,
    );

    setDrawingCheckpointName("");
    setDrawingCheckpointType("Visual");
    setDrawingCheckpointUnit("mm");
    setDrawingCheckpointTolerance("±0.1");
    setShowDrawingCheckpointModal(false);
  };

  const getCheckpointModalInspectionMethod = (checkpoint = {}) => {
    const rawMethod = String(
      checkpoint.inspectionMethod || checkpoint.method || checkpoint.type || "",
    )
      .trim()
      .toLowerCase()
      .replace(/[–—−]/g, "-")
      .replace(/[\s-]+/g, "_");

    if (
      rawMethod.includes("go_no_go") ||
      rawMethod.includes("gonogo") ||
      rawMethod.includes("gauge") ||
      checkpoint.gaugeMode ||
      checkpoint.goNoGoMode ||
      checkpoint.goCondition ||
      checkpoint.noGoCondition
    ) {
      return "go_nogo";
    }
    if (rawMethod.includes("hardness")) return "hardness";
    if (rawMethod.includes("coating") || rawMethod.includes("plating")) {
      return "coating";
    }
    if (rawMethod.includes("roughness") || rawMethod.includes("surface")) {
      return "surface_roughness";
    }
    if (rawMethod.includes("certificate") || rawMethod.includes("document")) {
      return "certificate";
    }
    if (rawMethod.includes("approval") || rawMethod.includes("sign_off")) {
      return "approval";
    }
    if (rawMethod.includes("functional") || rawMethod === "test") {
      return "functional";
    }
    if (rawMethod.includes("visual")) return "visual";
    if (
      rawMethod.includes("dimension") ||
      rawMethod.includes("measurement") ||
      getCheckpointResultType(checkpoint) === "numeric"
    ) {
      return "dimensional";
    }

    return rawMethod || "visual";
  };

  const openCheckpointEditModal = (
    key,
    index,
    checkpointOverride = null,
    { recordEdit = false } = {},
  ) => {
    if (!recordEdit) setEditingRecordCheckpointKey(null);
    const checkpoint =
      checkpointOverride ||
      selectedProcess?.checkpoints?.find(
        (item, checkpointIndex) =>
          getCheckpointKey(item, checkpointIndex) === key,
      ) ||
      selectedProcess?.checkpoints?.[index];

    if (!checkpoint) {
      toast.error("Checkpoint not found");
      return;
    }

    // Get the current data
    const spec = getCheckpointSpecification(checkpoint);
    const sampling = getCheckpointSampling(checkpoint);
    // Prepare the data in the format the modal expects
    const checkpointData = {
      // Basic info - use the actual checkpoint data
      id:
        checkpoint.id ||
        checkpoint.characteristicId ||
        checkpoint.checkpointId ||
        checkpoint._id ||
        key,
      name: checkpoint.name || key,
      description: checkpoint.description || "",

      // Inspection method - use the actual value
      inspectionMethod: getCheckpointModalInspectionMethod(checkpoint),
      resultType: checkpoint.resultType || getCheckpointResultType(checkpoint),

      // Numeric fields - use spec values
      nominalValue:
        spec.nominal ??
        checkpoint.nominalValue ??
        checkpoint.expectedValue ??
        "",
      unit: spec.unit || checkpoint.unit || "mm",
      decimalPrecision:
        spec.decimalPrecision ?? checkpoint.decimalPrecision ?? 3,
      toleranceType:
        spec.toleranceType || checkpoint.toleranceType || "bilateral",
      lowerTolerance:
        checkpoint.specification?.lowerTolerance ??
        checkpoint.lowerTolerance ??
        "",
      upperTolerance:
        checkpoint.specification?.upperTolerance ??
        checkpoint.upperTolerance ??
        "",
      lsl: spec.lsl ?? checkpoint.lsl ?? checkpoint.lowerSpecLimit ?? "",
      usl: spec.usl ?? checkpoint.usl ?? checkpoint.upperSpecLimit ?? "",
      specificationDisplay:
        checkpoint.specificationDisplay || checkpoint.tolerance || "",

      // Sampling
      piecesPerInspection: sampling.piecesPerInspection,
      readingsPerPiece: sampling.readingsPerPiece,
      subgroupSize: sampling.subgroupSize,
      sampleSize: sampling.piecesPerInspection,

      // Frequency
      frequencyType:
        checkpoint.frequencyType ||
        checkpoint.sampling?.frequency?.triggerType ||
        "time",
      frequencyValue:
        checkpoint.frequencyValue ||
        checkpoint.sampling?.frequency?.intervalValue ||
        1,
      frequencyUnit:
        checkpoint.frequencyUnit ||
        checkpoint.sampling?.frequency?.intervalUnit ||
        "hour",

      // Instrument requirements
      instrumentType:
        checkpoint.instrumentType ||
        checkpoint.instrumentRequirements?.instrumentType ||
        "",
      minimumResolution:
        checkpoint.minimumResolution ||
        checkpoint.instrumentRequirements?.minimumResolution ||
        "",
      calibrationRequired:
        checkpoint.calibrationRequired ||
        checkpoint.instrumentRequirements?.calibrationRequired ||
        false,
      gaugeIdRequired:
        checkpoint.gaugeIdRequired ||
        checkpoint.instrumentRequirements?.gaugeIdRequired ||
        false,
      instrumentEntryMandatory:
        checkpoint.instrumentEntryMandatory ||
        checkpoint.instrumentRequirements?.instrumentEntryMandatory ||
        false,
      msaStatus:
        checkpoint.msaStatus ||
        checkpoint.instrumentRequirements?.msaStatus ||
        "",

      // SPC
      recommendedSPCMethod:
        checkpoint.recommendedSPCMethod ||
        checkpoint.controlChartType ||
        "No SPC",
      overrideSPCMethod:
        checkpoint.overrideSPCMethod || checkpoint.selectedSPCMethod || "",
      selectedSPCMethod:
        checkpoint.selectedSPCMethod ||
        checkpoint.overrideSPCMethod ||
        checkpoint.recommendedSPCMethod ||
        "No SPC",
      controlChartType: checkpoint.controlChartType || "",

      // Visual specific
      inspectionArea: checkpoint.inspectionArea || "",
      acceptanceStandard: checkpoint.acceptanceStandard || "",
      referenceImages: checkpoint.referenceImages || [],
      defectCatalogue: checkpoint.defectCatalogue || "",
      severityRules: checkpoint.severityRules || "",
      allowedDefectivePieces: checkpoint.allowedDefectivePieces || 0,
      allowedDefectCount: checkpoint.allowedDefectCount || 0,
      categoricalOptions: checkpoint.categoricalOptions || [],
      rejectCategories: checkpoint.rejectCategories || ["Major", "Critical"],

      // Go/No-Go specific
      gaugeType: checkpoint.gaugeType || "",
      gaugeMode:
        checkpoint.gaugeMode ||
        checkpoint.goNoGoMode ||
        getConfiguredGaugeMode(checkpoint),
      gaugeSpecification: checkpoint.gaugeSpecification || "",
      threadFeatureSpec: checkpoint.threadFeatureSpec || "",
      goCondition: checkpoint.goCondition || "",
      noGoCondition: checkpoint.noGoCondition || "",
      configuredGaugeId:
        checkpoint.configuredGaugeId ||
        checkpoint.instrumentRequirements?.configuredGaugeId ||
        "",
      selectedGaugeId:
        checkpoint.selectedGaugeId ||
        checkpoint.instrumentRequirements?.selectedGaugeId ||
        "",
      registeredGaugeId: checkpoint.registeredGaugeId || "",
      gaugeAssetId: checkpoint.gaugeAssetId || "",
      gaugeId:
        checkpoint.gaugeId || checkpoint.instrumentRequirements?.gaugeId || "",
      configuredGauge: checkpoint.configuredGauge || null,
      selectedGauge: checkpoint.selectedGauge || null,
      gaugeName: checkpoint.gaugeName || checkpoint.configuredGaugeName || "",
      gaugeSerialNumber:
        checkpoint.gaugeSerialNumber ||
        checkpoint.configuredGaugeSerialNumber ||
        "",
      mandatoryPhotoOnFailure: checkpoint.mandatoryPhotoOnFailure || false,

      // Hardness specific
      hardnessScale: checkpoint.hardnessScale || "",
      minimumHardness: checkpoint.minimumHardness || "",
      maximumHardness: checkpoint.maximumHardness || "",
      testLoad: checkpoint.testLoad || "",
      testMethod: checkpoint.testMethod || "",
      testLocation: checkpoint.testLocation || "",
      testerType: checkpoint.testerType || "",
      indentationsPerPiece: checkpoint.indentationsPerPiece || 1,

      // Other fields
      measurementPosition: checkpoint.measurementPosition || "",
      measurementMethod: checkpoint.measurementMethod || "",
      calibrationInterval: checkpoint.calibrationInterval || "",
      drawingBalloonNumber: checkpoint.drawingBalloonNumber || "",
      allowNA: checkpoint.allowNA || false,
      naApprovalRequired: checkpoint.naApprovalRequired || false,
      mandatoryPhoto: checkpoint.mandatoryPhoto || false,
      criticality: checkpoint.criticality || "standard",
      reactionPlan: checkpoint.reactionPlan || "",
      sampleSizeMode: checkpoint.sampleSizeMode || "constant",
      opportunityMode: checkpoint.opportunityMode || "constant",
      opportunityUnit: checkpoint.opportunityUnit || "piece",
      opportunitiesPerUnit: checkpoint.opportunitiesPerUnit || 1,

      // Store the original key and index for update
      _editKey: key,
      _editIndex: index,
      _recordEdit: recordEdit,
      _recordMeasurement: checkpoint._recordMeasurement || null,
      _recordPlan: checkpoint._recordPlan || null,
      _recordStatus: checkpoint._recordStatus || "Pending",
      _recordRemark: checkpoint._recordRemark || "",
    };

    setEditingEnhancedCheckpoint(checkpointData);
    setIsEditingCheckpoint(true);
    setIsInCreateProcessModal(false);
    setShowEnhancedCheckpointModal(true);
  };

  const openRecordCheckpointEditModal = (row, index) => {
    if (!row?.key || !editingRecord) {
      toast.error("Checkpoint data is unavailable");
      return;
    }

    const measurement = row.measurement || {};
    const plan = row.plan || {};
    const remarkKey = [row.key, ...(row.sourceKeys || [])].find(
      (key) => editingRecord.checklistRemarks?.[key] !== undefined,
    );

    setEditingRecordCheckpointKey(row.key);
    openCheckpointEditModal(
      row.key,
      index,
      {
        ...measurement,
        ...plan,
        id:
          plan.id ||
          plan.characteristicId ||
          plan.checkpointId ||
          measurement.characteristicId ||
          measurement.checkpointId ||
          row.key,
        characteristicId:
          plan.characteristicId ||
          measurement.characteristicId ||
          measurement.checkpointId ||
          row.key,
        name: row.checkpointName || plan.name || row.key,
        nominalValue:
          plan.nominalValue ??
          plan.specification?.nominal ??
          measurement.nominalValue ??
          measurement.expected ??
          "",
        lsl:
          plan.lsl ??
          plan.lowerSpecLimit ??
          plan.specification?.lsl ??
          measurement.lsl ??
          measurement.lowerSpecLimit ??
          "",
        usl:
          plan.usl ??
          plan.upperSpecLimit ??
          plan.specification?.usl ??
          measurement.usl ??
          measurement.upperSpecLimit ??
          "",
        unit: plan.unit || plan.specification?.unit || measurement.unit || "mm",
        tolerance:
          plan.tolerance ||
          plan.specificationDisplay ||
          measurement.tolerance ||
          "",
        specification: {
          ...(measurement.specification || {}),
          ...(plan.specification || {}),
          nominal:
            plan.specification?.nominal ??
            plan.nominalValue ??
            measurement.expected ??
            null,
          lsl:
            plan.specification?.lsl ??
            plan.lsl ??
            plan.lowerSpecLimit ??
            measurement.lsl ??
            null,
          usl:
            plan.specification?.usl ??
            plan.usl ??
            plan.upperSpecLimit ??
            measurement.usl ??
            null,
          unit:
            plan.specification?.unit || plan.unit || measurement.unit || "mm",
        },
        _recordMeasurement: measurement,
        _recordPlan: plan,
        _recordStatus: row.status || "Pending",
        _recordRemark: remarkKey
          ? editingRecord.checklistRemarks?.[remarkKey] || ""
          : "",
      },
      { recordEdit: true },
    );
  };

  const deleteRecordCheckpoint = (row) => {
    if (!row?.key || !editingRecord) return;
    if (
      !window.confirm(
        `Delete checkpoint "${row.checkpointName || row.key}" from this inspection record?`,
      )
    ) {
      return;
    }

    const keysToDelete = new Set(
      [row.key, row.measurementKey, ...(row.sourceKeys || [])]
        .map(checkpointReferenceString)
        .filter(Boolean),
    );
    const tokensToDelete = new Set(
      Array.from(keysToDelete).map(checkpointReferenceToken).filter(Boolean),
    );

    const withoutCheckpointKeys = (container) => {
      if (!isPlainRecord(container)) return container || {};
      return Object.fromEntries(
        Object.entries(container).filter(
          ([key]) => !tokensToDelete.has(checkpointReferenceToken(key)),
        ),
      );
    };

    const updatedPlanSnapshot = Array.isArray(
      editingRecord.checkpointPlanSnapshot,
    )
      ? editingRecord.checkpointPlanSnapshot.filter((plan) =>
          [
            plan?.characteristicId,
            plan?.checkpointId,
            plan?.id,
            plan?._id,
            plan?.name,
            plan?.checkpointName,
          ]
            .map(checkpointReferenceToken)
            .filter(Boolean)
            .every((token) => !tokensToDelete.has(token)),
        )
      : editingRecord.checkpointPlanSnapshot;

    const updatedPieceMeasurements = Array.isArray(
      editingRecord.pieceMeasurements,
    )
      ? editingRecord.pieceMeasurements.map((piece) => ({
          ...piece,
          measurements: withoutCheckpointKeys(piece?.measurements),
        }))
      : editingRecord.pieceMeasurements;

    setEditingRecord((previous) => ({
      ...previous,
      checkpoints: withoutCheckpointKeys(previous.checkpoints),
      measurements: withoutCheckpointKeys(previous.measurements),
      checkpointMeasurements: withoutCheckpointKeys(
        previous.checkpointMeasurements,
      ),
      checklistRemarks: withoutCheckpointKeys(previous.checklistRemarks),
      gaugeResults: withoutCheckpointKeys(previous.gaugeResults),
      spcStatistics: withoutCheckpointKeys(previous.spcStatistics),
      controlChartData: withoutCheckpointKeys(previous.controlChartData),
      checkpointPlanSnapshot: updatedPlanSnapshot,
      pieceMeasurements: updatedPieceMeasurements,
    }));
    toast.success("Checkpoint removed from the edited record");
  };

  const deleteCheckpoint = (checkpointKey) => {
    if (isInspectionPlanLocked) {
      toast.error("Approved or effective inspection plans cannot be edited");
      return;
    }
    if (!window.confirm(`Delete checkpoint "${checkpointKey}"?`)) return;

    const updatedChecklist = { ...checklistResults };
    const updatedMeasurements = { ...measurementResults };
    const updatedRemarks = { ...checklistRemarks };

    delete updatedChecklist[checkpointKey];
    delete updatedRemarks[checkpointKey];
    if (updatedMeasurements[checkpointKey]) {
      delete updatedMeasurements[checkpointKey];
    }

    setChecklistResults(updatedChecklist);
    setMeasurementResults(updatedMeasurements);
    setChecklistRemarks(updatedRemarks);

    if (selectedProcess) {
      const updatedProcess = {
        ...selectedProcess,
        checkpoints: selectedProcess.checkpoints.filter(
          (cp) => (cp.id || cp.name) !== checkpointKey,
        ),
      };
      setSelectedProcess(updatedProcess);
    }

    toast.success(`Checkpoint "${checkpointKey}" deleted`);
  };

  const saveEditedRecord = async () => {
    try {
      const updateData = {
        companyId: editingRecord.companyId,
        companyName: editingRecord.companyName,
        itemId: editingRecord.itemId,
        itemName: editingRecord.itemName,
        itemCode: editingRecord.itemCode || editingRecord.itemName,
        itemDescription: editingRecord.itemDescription || "",
        processId: editingRecord.processId,
        processName: editingRecord.processName,
        timeSlot: editingRecord.timeSlot,
        status: editingRecord.status,
        inspector: editingRecord.inspector,
        machine: editingRecord.machine || "",
        toolGauge: editingRecord.toolGauge || "",
        batchNumber: editingRecord.batchNumber || "",
        quantity: parseInt(editingRecord.quantity) || 0,
        date: editingRecord.date || new Date().toISOString().split("T")[0],
        notes: editingRecord.notes || "",
        checkpoints: editingRecord.checkpoints || {},
        measurements: editingRecord.measurements || {},
        checkpointPlanSnapshot: Array.isArray(
          editingRecord.checkpointPlanSnapshot,
        )
          ? editingRecord.checkpointPlanSnapshot
          : [],
        checklistRemarks: editingRecord.checklistRemarks || {},
        gaugeResults: editingRecord.gaugeResults || {},
        images: editingRecord.images || [],
      };

      Object.entries(updateData.measurements || {}).forEach(([key, value]) => {
        if (!value.unit) value.unit = "mm";
        if (!value.tolerance) value.tolerance = "±0.1";
        const checkpointStatus = updateData.checkpoints[key] || value.status;
        value.status = checkpointStatus;
        value.pass = checkpointStatus === "OK" || checkpointStatus === "Pass";
      });

      const response = await axios.put(
        `${API_URL}/qc-inspection/${editingRecord._id}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );

      const updated = response.data?.data || response.data;

      setRecords((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r)),
      );
      setShowEditModal(false);
      setEditingRecord(null);
      setEditingRecordCheckpointKey(null);
      toast.success("Record updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update record");
    }
  };

  const editRecord = (record) => {
    const recordCopy = prepareInspectionRecordForEdit(record);
    setEditingRecordCheckpointKey(null);
    setEditingRecord(recordCopy);
    setShowEditModal(true);
  };

  const deleteRecord = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await axios.delete(
        `${API_URL}/qc-inspection/${recordId}`,
        {
          withCredentials: true,
        },
      );

      // Axios throws for non-2xx responses, so no need for response.ok

      setRecords((prev) => prev.filter((r) => r._id !== recordId));
      toast.success("Record deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete record");
    }
  };

  const validateInspection = useCallback(() => {
    const errors = [];
    const warnings = [];

    if (!selectedCompany) errors.push("Please select a company");
    if (!selectedItem) errors.push("Please select an item");
    if (!selectedProcess && !selectedDrawing) {
      errors.push("Please select a process or drawing");
    }

    const checkpoints = selectedProcess?.checkpoints || [];
    if (checkpoints.length === 0) errors.push("No checkpoints loaded");

    checkpoints.forEach((checkpoint, index) => {
      const checkpointId = getCheckpointKey(checkpoint, index);
      const entry = measurementResults[checkpointId] || {};
      const recordedStatus = checklistResults[checkpointId];

      if (recordedStatus === "N/A") {
        if (!checkpoint.allowNA) {
          errors.push(`${checkpoint.name}: N/A is not permitted`);
        }
        if (!String(checklistRemarks[checkpointId] || "").trim()) {
          errors.push(`${checkpoint.name}: an N/A reason is required`);
        }
        return;
      }

      const collectedRawReadings = isNumericCheckpoint(checkpoint)
        ? collectFrontendRawReadings({
            checkpointId,
            entry,
            checkpointMeasurement: checkpointMeasurements[checkpointId] || {},
            pieces: pieceMeasurements,
          })
        : [];

      const validationEntry = isNumericCheckpoint(checkpoint)
        ? { ...entry, rawReadings: collectedRawReadings }
        : entry;

      const decision = deriveCheckpointStatus(checkpoint, validationEntry);
      if (decision.status === "Pending") {
        errors.push(`${checkpoint.name}: result is incomplete`);
      }
      // if (
      //   decision.status === "Fail" &&
      //   !String(checklistRemarks[checkpointId] || "").trim()
      // ) {
      //   errors.push(`${checkpoint.name}: failure remark is required`);
      // }
      // if (decision.status === "Fail") {
      //   warnings.push(`${checkpoint.name}: inspection result failed`);
      // }

      if (isNumericCheckpoint(checkpoint)) {
        const sampling = getCheckpointSampling(checkpoint);
        const spcMethod = normalizeSPCMethod(
          checkpoint.overrideSPCMethod ||
            checkpoint.selectedSPCMethod ||
            checkpoint.recommendedSPCMethod ||
            checkpoint.controlChartType,
          sampling.subgroupSize,
          "numeric",
        );

        if (
          spcMethod === "I-MR" &&
          (sampling.subgroupSize !== 1 || sampling.piecesPerInspection !== 1)
        ) {
          errors.push(
            `${checkpoint.name}: I-MR requires one piece/value per inspection subgroup`,
          );
        }

        if (spcMethod === "X-bar R") {
          if (sampling.subgroupSize < 2 || sampling.subgroupSize > 25) {
            errors.push(
              `${checkpoint.name}: X-bar R subgroup size must be between 2 and 25`,
            );
          }
          if (sampling.piecesPerInspection !== sampling.subgroupSize) {
            errors.push(
              `${checkpoint.name}: X-bar R pieces per inspection must equal subgroup size (${sampling.subgroupSize})`,
            );
          }
        }

        const requiredReadings =
          sampling.piecesPerInspection * sampling.readingsPerPiece;
        if (requiredReadings > 1) {
          const actualReadings = collectedRawReadings.length;
          if (actualReadings !== requiredReadings) {
            errors.push(
              `${checkpoint.name}: ${actualReadings}/${requiredReadings} raw readings recorded`,
            );
          }
        } else if (
          collectedRawReadings.length === 0 &&
          toFiniteNumberOrNull(entry.measured) === null
        ) {
          errors.push(`${checkpoint.name}: numeric reading is missing`);
        }
      }

      if (getCheckpointResultType(checkpoint) === "defective_count") {
        const rejected = toFiniteNumberOrNull(entry.rejectedCount);
        const inspected = Number(entry.inspectedCount || 0);
        if (
          rejected === null ||
          !Number.isInteger(rejected) ||
          rejected < 0 ||
          rejected > inspected
        ) {
          errors.push(
            `${checkpoint.name}: rejected-piece count must be an integer between 0 and ${inspected}`,
          );
        }
      }

      if (getCheckpointResultType(checkpoint) === "defect_count") {
        const defects = toFiniteNumberOrNull(entry.defectCount);
        if (defects === null || !Number.isInteger(defects) || defects < 0) {
          errors.push(
            `${checkpoint.name}: defect count must be a non-negative integer`,
          );
        }
        if (
          checkpoint.opportunityMode === "variable" &&
          Number(entry.opportunityCount || 0) <= 0
        ) {
          errors.push(`${checkpoint.name}: inspection opportunity is required`);
        }
      }

      if (
        checkpoint.gaugeIdRequired ||
        checkpoint.instrumentRequirements?.gaugeIdRequired ||
        checkpoint.calibrationRequired ||
        checkpoint.instrumentRequirements?.calibrationRequired ||
        checkpoint.instrumentEntryMandatory ||
        checkpoint.instrumentRequirements?.instrumentEntryMandatory
      ) {
        const configuredGauge = getConfiguredGaugeSnapshot(checkpoint, index);
        if (!configuredGauge) {
          errors.push(
            `${checkpoint.name}: configure a gauge in the checkpoint`,
          );
        } else if (isGaugeCalibrationExpired(configuredGauge.calibrationDue)) {
          errors.push(
            `${checkpoint.name}: configured gauge calibration expired`,
          );
        }
      }

      if (
        checkpoint.mandatoryPhotoOnFailure &&
        decision.status === "Fail" &&
        uploadedImages.length === 0
      ) {
        errors.push(`${checkpoint.name}: a failure photo is required`);
      }

      if (checkpoint.mandatoryPhoto && uploadedImages.length === 0) {
        errors.push(`${checkpoint.name}: photo evidence is required`);
      }
    });

    if (!formData.batchNumber) warnings.push("Batch number is empty");
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      warnings.push("Lot quantity should be greater than 0");
    }

    return { errors, warnings };
  }, [
    selectedCompany,
    selectedItem,
    selectedProcess,
    selectedDrawing,
    checklistResults,
    measurementResults,
    checklistRemarks,
    checkpointMeasurements,
    pieceMeasurements,
    uploadedImages,
    formData,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      toast.warning("Submission in progress");
      return;
    }

    const { errors, warnings } = validateInspection();

    if (errors.length > 0) {
      toast.error(`Cannot submit: ${errors.join(", ")}`);
      return;
    }

    if (warnings.length > 0) {
      const proceed = window.confirm(
        `Warnings found:\n${warnings.join("\n")}\n\nProceed anyway?`,
      );
      if (!proceed) return;
    }

    if (!selectedCompany || !selectedItem) {
      toast.error("Please select a company and item before submitting.");
      return;
    }

    if (!selectedProcess || Object.keys(checklistResults).length === 0) {
      toast.error("Please select a drawing or process with checkpoints.");
      return;
    }

    const purchaseOrder = orders.find((po) => {
      const companyName =
        po.submittedBy?.companyName || po.companyName || po.client?.name;
      if (companyName !== selectedCompany) return false;
      return (
        po.items &&
        po.items.some(
          (item) =>
            item._id === selectedItem.id || item.itemCode === selectedItem.name,
        )
      );
    });

    /*
     * Build a canonical submission snapshot from every available source:
     * applied checkpoint data, typed entries, and the current readings modal.
     * This prevents completed readings from being dropped when the operator
     * closes the modal or submits immediately after entering the last value.
     */
    const preparedCheckpointMeasurements = {
      ...checkpointMeasurements,
    };
    const preparedMeasurementResults = {
      ...measurementResults,
    };
    const preparedChecklistResults = {
      ...checklistResults,
    };

    (selectedProcess.checkpoints || []).forEach((checkpoint, index) => {
      if (!isNumericCheckpoint(checkpoint)) return;

      const checkpointId = getCheckpointKey(checkpoint, index);
      const rawReadings = collectFrontendRawReadings({
        checkpointId,
        entry: preparedMeasurementResults[checkpointId] || {},
        checkpointMeasurement:
          preparedCheckpointMeasurements[checkpointId] || {},
        pieces: pieceMeasurements,
      });

      if (rawReadings.length === 0) return;

      const checkpointPayload = buildNumericCheckpointPayload(
        checkpoint,
        checkpointId,
        rawReadings,
      );
      preparedCheckpointMeasurements[checkpointId] = checkpointPayload;

      const existingEntry =
        preparedMeasurementResults[checkpointId] ||
        buildCheckpointEntryState(checkpoint, index);
      const status = checkpointPayload.specificationStatus;
      const pass = status === "Pass" ? true : status === "Fail" ? false : null;

      preparedMeasurementResults[checkpointId] = {
        ...existingEntry,
        checkpointId,
        checkpointName: checkpoint.name || checkpointId,
        measured:
          checkpointPayload.statistics.rawReadingCount > 0
            ? checkpointPayload.statistics.mean
            : "",
        sampleSize: checkpointPayload.statistics.sampleSize,
        allPieceValues: checkpointPayload.pieceValues.map(
          (piece) => piece.value,
        ),
        pieceMeasurements: checkpointPayload.pieceValues,
        rawReadings: checkpointPayload.rawReadings,
        pass,
        resultReason:
          status === "Pass"
            ? "All individual readings are within specification"
            : status === "Fail"
              ? "One or more individual readings are outside specification"
              : "",
      };

      preparedChecklistResults[checkpointId] =
        status === "Pass" ? "OK" : status === "Fail" ? "Fail" : "Pending";
    });

    const failedCheckpointNames = [];
    (selectedProcess.checkpoints || []).forEach((checkpoint, index) => {
      const checkpointId = getCheckpointKey(checkpoint, index);
      const recordedStatus = preparedChecklistResults[checkpointId];
      if (recordedStatus === "N/A" && checkpoint.allowNA) return;

      const decision = deriveCheckpointStatus(
        checkpoint,
        preparedMeasurementResults[checkpointId] || {},
      );
      if (decision.status === "Fail") {
        failedCheckpointNames.push(checkpoint.name || checkpointId);
      }
    });

    const allMeasurementsPass = failedCheckpointNames.length === 0;

    const transformedMeasurements = {};
    Object.entries(preparedMeasurementResults).forEach(
      ([checkpointId, measurement]) => {
        const checkpoint = selectedProcess?.checkpoints?.find(
          (item, index) =>
            getCheckpointKey(item, index) === checkpointId ||
            item.name === checkpointId,
        );
        const decision = deriveCheckpointStatus(checkpoint || {}, measurement);

        const recordedStatus = preparedChecklistResults[checkpointId];
        const resultType = getCheckpointResultType(checkpoint || measurement);
        const sampling = getCheckpointSampling(checkpoint || {});
        const goNoGoResults = Array.isArray(measurement.goNoGoResults)
          ? measurement.goNoGoResults
          : [];
        const gaugeMode = getConfiguredGaugeMode(checkpoint || measurement);
        const normalizedGoNoGoResults = goNoGoResults.map((row) => ({
          ...row,
          gaugeMode,
          gaugePassed: getGoNoGoPiecePass(row, gaugeMode),
        }));
        const pieceResults = Array.isArray(measurement.pieceResults)
          ? measurement.pieceResults
          : [];
        const enteredAttributeSampleSize = toPositiveInteger(
          measurement.attributeSampleSize ?? measurement.inspectedCount,
          sampling.piecesPerInspection,
        );
        const actualAttributeSampleSize =
          normalizedGoNoGoResults.length ||
          pieceResults.length ||
          enteredAttributeSampleSize;
        const defectiveCount =
          resultType === "binary" && normalizedGoNoGoResults.length > 0
            ? normalizedGoNoGoResults.filter((row) => row.gaugePassed !== true)
                .length
            : resultType === "binary" && pieceResults.length > 0
              ? pieceResults.filter((result) =>
                  ["Fail", "Rejected", "NG"].includes(String(result)),
                ).length
              : resultType === "defective_count"
                ? Number(measurement.rejectedCount || 0)
                : null;

        transformedMeasurements[checkpointId] = {
          ...measurement,
          checkpointId,
          checkpointName: checkpoint?.name || checkpointId,
          inspectionMethod: checkpoint?.inspectionMethod || "",
          resultType,
          gaugeMode,
          attributeData: {
            sampleSize: actualAttributeSampleSize,
            sampleSizeMode: checkpoint?.sampleSizeMode || "constant",
            defectiveCount,
            fractionDefective:
              Number.isInteger(defectiveCount) && actualAttributeSampleSize > 0
                ? defectiveCount / actualAttributeSampleSize
                : null,
            defectCount:
              resultType === "defect_count"
                ? Number(measurement.defectCount || 0)
                : null,
            opportunityCount:
              resultType === "defect_count"
                ? Number(measurement.opportunityCount || 0)
                : null,
            opportunityMode: checkpoint?.opportunityMode || "constant",
            pieceResults,
            gaugeMode,
            goNoGoResults: normalizedGoNoGoResults,
          },
          requirementSnapshot: {
            ...getCheckpointSpecification(checkpoint || {}),
            requirement: getCheckpointRequirement(checkpoint || {}),
            drawingRevision:
              selectedDrawing?.revision ||
              selectedDrawing?.drawingRevision ||
              "",
          },
          selectedInstrumentId:
            measurement.instrumentId ||
            getConfiguredGaugeIdentity(checkpoint || measurement) ||
            null,
          pass: recordedStatus === "N/A" ? null : decision.pass,
          status: recordedStatus === "N/A" ? "N/A" : decision.status,
          naReason:
            recordedStatus === "N/A"
              ? checklistRemarks[checkpointId] || ""
              : null,
          deviation: decision.deviation ?? measurement.deviation ?? null,
          pieceMeasurements: measurement.pieceMeasurements || [],
          rawReadings: measurement.rawReadings || [],
        };
      },
    );

    // Save only the gauge configured on the checkpoint. Inspection entry does
    // not maintain a separate gauge registry or permit operator substitution.
    const formattedGaugeResults = {};
    (selectedProcess?.checkpoints || []).forEach((checkpoint, index) => {
      const configuredGauge = getConfiguredGaugeSnapshot(checkpoint, index);
      if (!configuredGauge) return;

      const checkpointId = getCheckpointKey(checkpoint, index);
      const measurement = transformedMeasurements[checkpointId] || {};
      const existing = formattedGaugeResults[configuredGauge.id];
      const checkpointIds = Array.from(
        new Set([...(existing?.checkpointIds || []), checkpointId]),
      );
      const checkpointNames = Array.from(
        new Set([
          ...(existing?.checkpointNames || []),
          checkpoint.name || checkpointId,
        ]),
      );

      formattedGaugeResults[configuredGauge.id] = {
        ...existing,
        ...configuredGauge,
        checkpointIds,
        checkpointNames,
        value:
          measurement.pass === true
            ? "Pass"
            : measurement.pass === false
              ? "Fail"
              : measurement.status || "Pending",
        remarks: checklistRemarks[checkpointId] || "",
        timestamp: new Date().toISOString(),
      };
    });

    // Raw readings are retained by checkpoint and by piece.
    const finalCheckpointMeasurements = {
      ...preparedCheckpointMeasurements,
    };
    const pieceMap = new Map();

    Object.entries(finalCheckpointMeasurements).forEach(
      ([checkpointId, checkpointData]) => {
        (checkpointData.pieceValues || []).forEach((pieceValue) => {
          if (!pieceMap.has(pieceValue.pieceNumber)) {
            pieceMap.set(pieceValue.pieceNumber, {
              pieceNumber: pieceValue.pieceNumber,
              measurements: {},
              status: "Pass",
            });
          }
          const piece = pieceMap.get(pieceValue.pieceNumber);
          piece.measurements[checkpointId] = {
            checkpointId,
            value: pieceValue.value,
            measured: pieceValue.value,
            readings: pieceValue.readings || [],
            pass: pieceValue.pass,
          };
          if (pieceValue.pass === false) piece.status = "Fail";
        });
      },
    );

    const finalPieceMeasurements = Array.from(pieceMap.values()).sort(
      (a, b) => a.pieceNumber - b.pieceNumber,
    );

    // Determine if this is a multi-piece inspection
    const attributePieceCount = Object.values(transformedMeasurements).reduce(
      (maximum, measurement) =>
        Math.max(maximum, Number(measurement?.attributeData?.sampleSize || 0)),
      0,
    );
    const isMultiPiece =
      Object.values(finalCheckpointMeasurements).some(
        (checkpoint) => Number(checkpoint?.statistics?.sampleSize || 0) > 1,
      ) || attributePieceCount > 1;

    // Every checkpoint submitted for the same PO + item + batch + date gets
    // the same run ID. The report endpoint uses this ID to merge checkpoint
    // documents into one customer report.
    const inspectionDate = new Date().toISOString().split("T")[0];
    const resolvedBatchNumber =
      formData.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`;
    const inspectionRunId = buildClientInspectionRunId({
      purchaseOrderId: purchaseOrder?._id || "unknown",
      itemId: selectedItem.id || selectedItem.name,
      batchNumber: resolvedBatchNumber,
      date: inspectionDate,
    });

    // NORMALIZE ALL KEYS to use checkpointId consistently
    const normalizeAllKeys = (data, checkpoints) => {
      const normalized = {};
      Object.entries(data).forEach(([key, value]) => {
        // Find the checkpoint in the plan
        const checkpoint = checkpoints?.find(
          (cp, idx) =>
            getCheckpointKey(cp, idx) === key ||
            cp.name === key ||
            cp.checkpointId === key,
        );
        if (checkpoint) {
          // Use checkpointId as the primary key (matches backend)
          const newKey =
            checkpoint.checkpointId || checkpoint.id || checkpoint.name || key;
          normalized[newKey] = value;
        } else {
          // Try to find by checkpointId in the data itself
          const dataCheckpointId =
            value?.checkpointId || value?.id || value?.name;
          if (dataCheckpointId) {
            normalized[dataCheckpointId] = value;
          } else {
            normalized[key] = value;
          }
        }
      });
      return normalized;
    };

    // Normalize all checkpoint data
    const normalizedCheckpoints = normalizeAllKeys(
      preparedChecklistResults,
      selectedProcess?.checkpoints,
    );

    const normalizedMeasurements = normalizeAllKeys(
      transformedMeasurements,
      selectedProcess?.checkpoints,
    );

    const normalizedCheckpointMeasurements = normalizeAllKeys(
      finalCheckpointMeasurements,
      selectedProcess?.checkpoints,
    );
    // Prepare inspection data
    const inspectionData = {
      purchaseOrderId: purchaseOrder?._id || "unknown",
      companyId: purchaseOrder?.clientId || purchaseOrder?._id || "unknown",
      companyName: selectedCompany,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemDescription: selectedItem.description || "",
      itemCode: selectedItem.name || "",
      inspectionRunId,
      inspectionStage: "final_pdi",
      processId: selectedProcess.id || selectedProcess._id,
      processName: selectedProcess.name,
      checkpoints: normalizedCheckpoints,
      measurements: normalizedMeasurements,
      checkpointMeasurements: normalizedCheckpointMeasurements,
      checkpointPlanSnapshot: (selectedProcess?.checkpoints || []).map(
        (checkpoint, index) => ({
          ...checkpoint,
          checkpointId: getCheckpointKey(checkpoint, index),
        }),
      ),
      pieceMeasurements: finalPieceMeasurements,
      inspectionPlanVersion:
        selectedProcess?.version || selectedProcess?.revision || 1,
      drawingRevision:
        selectedDrawing?.revision || selectedDrawing?.drawingRevision || null,
      processDescription: selectedProcess.description || "Inspection process",
      drawingId: selectedDrawing?._id || null,
      drawingTitle: selectedDrawing?.title || null,
      timeSlot: timeSlot,
      timestamp: new Date().toISOString(),
      date: inspectionDate,
      status:
        allMeasurementsPass && formData.status === "Pass" ? "Pass" : "Fail",
      checklistRemarks: { ...checklistRemarks },
      gaugeResults: formattedGaugeResults,
      notes: formData.notes || "All parameters within specification",
      // Metadata only: never used to create a collection/run/SPC stream.
      inspector: formData.inspector,
      batchNumber: resolvedBatchNumber,
      // Metadata only: never used in the SPC stream identity.
      quantity: parseInt(formData.quantity) || 0,
      images: uploadedImages,
      isMultiPiece,
      pieceCount: Math.max(
        finalPieceMeasurements.length,
        attributePieceCount,
        1,
      ),
      machine: formData.machine || "",
      line: formData.line || "",
      toolNumber: formData.toolNumber || "",
      cavity: formData.cavity || "",
      materialLot: formData.materialLot || "",
      heatNumber: formData.heatNumber || "",
      toolGauge: formData.toolGauge || "",
    };

    console.log("Submitting inspection data:", {
      pieceCount: inspectionData.pieceCount,
      hasPieceMeasurements: inspectionData.pieceMeasurements?.length > 0,
      hasCheckpointMeasurements:
        Object.keys(inspectionData.checkpointMeasurements || {}).length > 0,
      checkpointKeys: Object.keys(inspectionData.checkpointMeasurements || {}),
      planCheckpointKeys: inspectionData.checkpointPlanSnapshot.map(
        (checkpoint) => checkpoint.checkpointId,
      ),
      rawReadingCounts: Object.fromEntries(
        Object.entries(inspectionData.checkpointMeasurements || {}).map(
          ([key, value]) => [key, value?.rawReadings?.length || 0],
        ),
      ),
    });

    try {
      setIsSubmitting(true);
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/qc-inspection`,
        inspectionData,
        {
          withCredentials: true,
          timeout: 30000,
          headers: socketId ? { "X-Socket-Id": socketId } : undefined,
        },
      );

      if (response.data.success) {
        toast.success("Inspection record submitted successfully!");
        setRecords((prev) => [response.data.data || inspectionData, ...prev]);
        resetForm();
      }
    } catch (error) {
      console.error("Error submitting inspection:", error);
      console.error("Server validation response:", error.response?.data);

      const serverErrors = Array.isArray(error.response?.data?.errors)
        ? error.response.data.errors
        : [];
      const errorMessage =
        serverErrors.length > 0
          ? serverErrors.join(" | ")
          : error.response?.data?.message ||
            error.message ||
            "Failed to submit inspection";

      toast.error(errorMessage);

      /*
       * A 4xx response means the server received the record but rejected
       * its validation. Keep every reading on screen so the operator can
       * correct it. Do not create a misleading local inspection record.
       */
      if (error.response && error.response.status >= 400) {
        return;
      }

      // Use local fallback only when the server could not be reached.
      setRecords((prev) => [
        {
          ...inspectionData,
          _id: `local-${Date.now()}`,
          savedLocally: true,
        },
        ...prev,
      ]);
      toast.success("Server unavailable. Record saved locally.");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedItem(null);
    setSelectedProcess(null);
    setSelectedDrawing(null);
    setInspectionSource(null);
    setChecklistResults({});
    setMeasurementResults({});
    setChecklistRemarks({});
    setUploadedImages([]);
    setPieceMeasurements([]);
    setPieceCount(1);
    setCheckpointMeasurements({});
    setActiveMultiPieceCheckpointId(null);
    setFormData({
      inspector: formData.inspector || "",
      batchNumber: "",
      machine: "",
      line: "",
      toolNumber: "",
      cavity: "",
      materialLot: "",
      heatNumber: "",
      toolGauge: "",
      quantity: "",
      notes: "",
      status: "Pass",
    });
  };

  const openReportSetup = async (record) => {
    if (!record?._id || String(record._id).startsWith("local-")) {
      toast.error("Please sync this inspection with the server first");
      return;
    }

    try {
      setIsGeneratingCustomerReport(true);
      const response = await axios.get(
        `${API_URL}/qc-inspection/${record._id}/report-options`,
        { withCredentials: true },
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to load report options",
        );
      }

      const options = response.data.data?.criticalCheckpointOptions || [];
      setReportSourceRecord(record);
      setReportCheckpointOptions(options);
      setSelectedCriticalCheckpointId(
        response.data.data?.selectedCriticalCheckpointId ||
          options[0]?.checkpointId ||
          "",
      );
      setShowReportSetupModal(true);
    } catch (error) {
      console.error("Error loading report options:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load report options",
      );
    } finally {
      setIsGeneratingCustomerReport(false);
    }
  };

  const generateQCReport = async () => {
    if (!reportSourceRecord?._id) {
      toast.error("Select an inspection record first");
      return;
    }

    if (reportCheckpointOptions.length > 0 && !selectedCriticalCheckpointId) {
      toast.error("Select the critical checkpoint to display in the graph");
      return;
    }

    try {
      setIsGeneratingCustomerReport(true);
      const response = await axios.get(
        `${API_URL}/qc-inspection/${reportSourceRecord._id}/report`,
        {
          params: {
            criticalCheckpointId: selectedCriticalCheckpointId || undefined,
            pdiSampleLimit: 5,
            historyLimit: 500,
          },
          withCredentials: true,
          timeout: 30000,
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to generate report");
      }

      setSelectedRecordForReport(response.data.data);
      setShowReportSetupModal(false);
      setShowReportModal(true);
    } catch (error) {
      console.error("Error generating customer report:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to generate customer report",
      );
    } finally {
      setIsGeneratingCustomerReport(false);
    }
  };

  const closeCustomerReport = () => {
    setShowReportModal(false);
    setSelectedRecordForReport(null);
  };

  const exportToCSV = () => {
    const dataToExport = filteredRecords.length > 0 ? filteredRecords : records;
    if (dataToExport.length === 0) {
      toast.error("No data to export");
      return;
    }

    const flattenedData = dataToExport.map((record) => ({
      ID: record._id || record.id || "N/A",
      Company: record.companyName || "N/A",
      Item: record.itemName || "N/A",
      Process: record.processName || "N/A",
      Batch: record.batchNumber || "N/A",
      Quantity: record.quantity || 0,
      Status: record.status || "N/A",
      Inspector: record.inspector || "N/A",
      "Time Slot": record.timeSlot || "N/A",
      Date: record.date || "N/A",
      Notes: record.notes || "",
      "Checkpoints Passed": Object.values(record.checkpoints || {}).filter(
        (v) => v === "OK",
      ).length,
      "Total Checkpoints": Object.keys(record.checkpoints || {}).length,
      "Gauge Passed": Object.values(record.gaugeResults || {}).filter(
        (g) => g.value === "Pass",
      ).length,
      "Total Gauges": Object.keys(record.gaugeResults || {}).length,
    }));

    const ws = XLSX.utils.json_to_sheet(flattenedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inspections");
    XLSX.writeFile(
      wb,
      `QC_Inspections_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast.success("CSV exported successfully!");
  };

  useEffect(() => {
    if (!selectedCompany && !selectedItem) return;

    const saveInterval = setInterval(() => {
      const draft = {
        selectedCompany,
        selectedItem,
        selectedProcess,
        selectedDrawing,
        inspectionSource,
        timeSlot,
        checklistResults,
        measurementResults,
        checklistRemarks,
        enhancedGauges,
        uploadedImages,
        formData,
        pieceCount,
        pieceMeasurements,
        gaugeFormData,
        timestamp: new Date().toISOString(),
      };
      try {
        localStorage.setItem("qc_inspection_draft", JSON.stringify(draft));
      } catch (e) {
        // Ignore
      }
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [
    selectedCompany,
    selectedItem,
    selectedProcess,
    selectedDrawing,
    inspectionSource,
    timeSlot,
    checklistResults,
    measurementResults,
    checklistRemarks,
    enhancedGauges,
    uploadedImages,
    formData,
    pieceCount,
    pieceMeasurements,
    gaugeFormData,
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("qc_inspection_draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.selectedCompany && draft.selectedItem) {
          const restore = window.confirm(
            `Restore saved draft for ${draft.selectedItem.name}?`,
          );
          if (restore) {
            setSelectedCompany(draft.selectedCompany);
            setSelectedItem(draft.selectedItem);
            setSelectedProcess(draft.selectedProcess);
            setSelectedDrawing(draft.selectedDrawing);
            setInspectionSource(draft.inspectionSource);
            setTimeSlot(draft.timeSlot || "06:00 AM - 02:00 PM");
            setChecklistResults(draft.checklistResults || {});
            setMeasurementResults(draft.measurementResults || {});
            setChecklistRemarks(draft.checklistRemarks || {});
            setEnhancedGauges(
              draft.enhancedGauges || Object.values(draft.gaugeResults || {}),
            );
            setUploadedImages(draft.uploadedImages || []);
            setPieceCount(draft.pieceCount || 1);
            setPieceMeasurements(draft.pieceMeasurements || []);
            if (draft.formData) {
              setFormData(draft.formData);
            }
            toast.info("Draft restored");
          }
        }
        localStorage.removeItem("qc_inspection_draft");
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const createDrawingProcess = async () => {
    if (!selectedDrawing) {
      toast.error("Please select a drawing first");
      return;
    }

    if (!newProcessName.trim()) {
      toast.error("Please enter a process name");
      return;
    }

    if (newProcessCheckpoints.length === 0) {
      toast.error("Please add at least one checkpoint");
      return;
    }

    try {
      setLoading(true);

      const newProcess = {
        processName: newProcessName.trim(),
        version: 1,
        status: "draft",
        // Preserve the complete advanced checkpoint contract. Do not reduce it
        // back to name/type/expectedValue/tolerance.
        checkpoints: newProcessCheckpoints.map((checkpoint, index) => ({
          ...checkpoint,
          id: checkpoint.id || `CP-${Date.now()}-${index + 1}`,
          measuredValue: "",
        })),
      };

      // Add to drawing's processes
      const updatedProcesses = [...selectedDrawingProcesses, newProcess];
      setSelectedDrawingProcesses(updatedProcesses);

      // CORRECTED: Use the folder endpoint with /process
      const response = await axios.put(
        `${API_URL}/qc-inspection/${selectedDrawing._id}/process`,
        { processes: updatedProcesses },
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success(
          `Process "${newProcessName}" created with ${newProcessCheckpoints.length} checkpoints!`,
        );

        // Select the new process
        const processObj = {
          id: newProcessName,
          name: newProcessName,
          checkpoints: newProcessCheckpoints,
          isDrawing: true,
          isCustom: true,
        };
        setSelectedProcess(processObj);
        initializeCheckpoints(newProcessCheckpoints);

        // Reset and close modal
        setShowCreateProcessModal(false);
        setNewProcessName("");
        setNewProcessCheckpoints([]);
        setNewCheckpointData({
          name: "",
          type: "Measurement",
          expectedValue: "",
          unit: "mm",
          tolerance: "",
        });

        // Refresh drawings
        fetchDrawings();

        if (socket && socket.connected) {
          socket.emit("spc:data-changed", {
            action: "process-created",
            companyId: selectedCompany?._id || selectedCompany,
            processId: response.data.data?._id || newProcessName,
            spcStreamKey:
              response.data.data?.spcStreamKey || `process-${newProcessName}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error creating process:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create process";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  // Add checkpoint to new process
  const addCheckpointToNewProcess = () => {
    if (!newCheckpointData.name.trim()) {
      toast.error("Please enter checkpoint name");
      return;
    }

    const newCheckpoint = {
      name: newCheckpointData.name.trim(),
      type: newCheckpointData.type,
      expectedValue:
        newCheckpointData.type === "Measurement"
          ? newCheckpointData.expectedValue
          : "",
      unit:
        newCheckpointData.type === "Measurement" ? newCheckpointData.unit : "",
      tolerance:
        newCheckpointData.type === "Measurement"
          ? newCheckpointData.tolerance
          : "",
    };

    setNewProcessCheckpoints([...newProcessCheckpoints, newCheckpoint]);
    setNewCheckpointData({
      name: "",
      type: "Measurement",
      expectedValue: "",
      unit: "mm",
      tolerance: "",
    });
    setShowAddCheckpointModal(false);
    toast.success(`Checkpoint "${newCheckpoint.name}" added successfully!`);
  };

  // Initialize checkpoints from a process
  const initializeCheckpoints = useCallback((checkpoints) => {
    const initialChecklist = {};
    const initialMeasurements = {};
    const initialRemarks = {};

    (checkpoints || []).forEach((cp, index) => {
      const cpId = getCheckpointKey(cp, index);
      initialChecklist[cpId] = "Pending";
      initialRemarks[cpId] = "";
      initialMeasurements[cpId] = buildCheckpointEntryState(
        { ...cp, id: cpId },
        index,
      );
    });

    setChecklistResults(initialChecklist);
    setMeasurementResults(initialMeasurements);
    setChecklistRemarks(initialRemarks);
  }, []);

  // Handle enhanced checkpoint save from CheckpointModal
  const handleEnhancedCheckpointSave = async (checkpointData) => {
    const isRecordCheckpointEdit = Boolean(
      editingRecord &&
      editingRecordCheckpointKey &&
      editingEnhancedCheckpoint?._recordEdit,
    );

    if (
      !isRecordCheckpointEdit &&
      selectedProcess &&
      isInspectionPlanLocked &&
      !isInCreateProcessModal
    ) {
      toast.error(
        "Create a new inspection-plan revision before changing checkpoints",
      );
      return;
    }

    const checkpointId =
      checkpointData.id || editingEnhancedCheckpoint?.id || `CP-${Date.now()}`;
    const isExisting = Boolean(
      editingEnhancedCheckpoint &&
      (editingEnhancedCheckpoint._editKey !== undefined ||
        editingEnhancedCheckpoint._editIndex !== undefined),
    );
    const editKey = editingEnhancedCheckpoint?._editKey;
    const suppliedEditIndex = editingEnhancedCheckpoint?._editIndex;

    const specification = {
      nominal: toFiniteNumberOrNull(checkpointData.nominalValue),
      toleranceType: checkpointData.toleranceType || "informational",
      lowerTolerance: toFiniteNumberOrNull(checkpointData.lowerTolerance),
      upperTolerance: toFiniteNumberOrNull(checkpointData.upperTolerance),
      lsl: toFiniteNumberOrNull(
        checkpointData.lsl ?? checkpointData.lowerSpecLimit,
      ),
      usl: toFiniteNumberOrNull(
        checkpointData.usl ?? checkpointData.upperSpecLimit,
      ),
      unit: checkpointData.unit || "",
      decimalPrecision: toNonNegativeInteger(
        checkpointData.decimalPrecision,
        3,
      ),
    };

    const resultType =
      checkpointData.resultType || getCheckpointResultType(checkpointData);

    const parseSamplingInteger = (value, fallback, label) => {
      const candidate = value ?? fallback;
      const parsed = Number(candidate);
      if (!Number.isInteger(parsed) || parsed < 1) {
        toast.error(`${label} must be a positive integer`);
        return null;
      }
      return parsed;
    };

    const submittedPiecesPerInspection = parseSamplingInteger(
      checkpointData.piecesPerInspection ?? checkpointData.sampleSize,
      1,
      "Pieces per inspection",
    );
    const submittedReadingsPerPiece = parseSamplingInteger(
      checkpointData.readingsPerPiece,
      1,
      "Readings per piece",
    );
    const submittedSubgroupSize = parseSamplingInteger(
      checkpointData.subgroupSize ??
        checkpointData.piecesPerInspection ??
        checkpointData.sampleSize,
      1,
      "Subgroup size",
    );

    if (
      submittedPiecesPerInspection === null ||
      submittedReadingsPerPiece === null ||
      submittedSubgroupSize === null
    ) {
      return;
    }

    const configuredSPCMethod = normalizeSPCMethod(
      checkpointData.overrideSPCMethod ||
        checkpointData.selectedSPCMethod ||
        checkpointData.recommendedSPCMethod ||
        checkpointData.controlChartType,
      submittedSubgroupSize,
      resultType,
      checkpointData.sampleSizeMode || "constant",
    );

    if (["binary", "defective_count"].includes(resultType)) {
      if (!["P Chart", "NP Chart"].includes(configuredSPCMethod)) {
        toast.error(
          "Pass/Fail and defective-count checkpoints require a P or NP chart",
        );
        return;
      }
      if (
        configuredSPCMethod === "NP Chart" &&
        String(checkpointData.sampleSizeMode || "constant").toLowerCase() ===
          "variable"
      ) {
        toast.error(
          "NP chart requires the same inspected quantity in every subgroup. Use P Chart for a variable sample size.",
        );
        return;
      }
      if (submittedReadingsPerPiece !== 1) {
        toast.error(
          "P/NP checkpoints require one Pass/Fail decision per piece",
        );
        return;
      }
      if (submittedPiecesPerInspection < 2) {
        toast.error(
          "P/NP checkpoints require at least 2 inspected pieces per subgroup",
        );
        return;
      }
    }

    if (
      checkpointData.inspectionMethod === "go_nogo" &&
      !["binary", "defective_count"].includes(resultType)
    ) {
      toast.error(
        "Go/No-Go gauge inspection must use Pass/Fail or defective count",
      );
      return;
    }

    if (resultType === "numeric" && configuredSPCMethod === "X-bar S") {
      toast.error(
        "X-bar S is not supported by the current backend. Select I-MR or X-bar R.",
      );
      return;
    }

    if (resultType === "numeric" && configuredSPCMethod === "I-MR") {
      if (submittedPiecesPerInspection !== 1 || submittedSubgroupSize !== 1) {
        toast.error(
          "I-MR requires exactly one piece and subgroup size 1 per inspection event",
        );
        return;
      }
    }

    if (resultType === "numeric" && configuredSPCMethod === "X-bar R") {
      if (
        submittedPiecesPerInspection < 2 ||
        submittedPiecesPerInspection > 25
      ) {
        toast.error("X-bar R requires 2 to 25 pieces per subgroup");
        return;
      }
      if (submittedSubgroupSize !== submittedPiecesPerInspection) {
        toast.error("X-bar R subgroup size must equal pieces per inspection");
        return;
      }
    }

    const sampling = {
      piecesPerInspection:
        configuredSPCMethod === "I-MR" ? 1 : submittedPiecesPerInspection,
      readingsPerPiece: submittedReadingsPerPiece,
      subgroupSize:
        configuredSPCMethod === "I-MR"
          ? 1
          : configuredSPCMethod === "X-bar R"
            ? submittedPiecesPerInspection
            : submittedSubgroupSize,
      frequency: {
        triggerType: checkpointData.frequencyType || "time",
        intervalValue: Number(checkpointData.frequencyValue) || 1,
        intervalUnit: checkpointData.frequencyUnit || "hour",
      },
    };

    if (
      resultType === "numeric" &&
      configuredSPCMethod === "I-MR" &&
      (sampling.subgroupSize !== 1 || sampling.piecesPerInspection !== 1)
    ) {
      toast.error("I-MR requires one piece/value per inspection subgroup");
      return;
    }

    if (resultType === "numeric" && configuredSPCMethod === "X-bar R") {
      if (sampling.subgroupSize < 2 || sampling.subgroupSize > 25) {
        toast.error("X-bar R subgroup size must be between 2 and 25");
        return;
      }
      if (sampling.piecesPerInspection !== sampling.subgroupSize) {
        toast.error(
          `X-bar R requires pieces per inspection to equal subgroup size (${sampling.subgroupSize})`,
        );
        return;
      }
    }

    const normalizedCheckpoint = {
      ...checkpointData,
      id: checkpointId,
      name: checkpointData.name.trim(),
      inspectionMethod: checkpointData.inspectionMethod || "visual",
      resultType,
      specification,
      sampling,
      nominalValue: specification.nominal,
      lsl: specification.lsl,
      usl: specification.usl,
      lowerSpecLimit: specification.lsl,
      upperSpecLimit: specification.usl,
      unit: specification.unit,
      piecesPerInspection: sampling.piecesPerInspection,
      readingsPerPiece: sampling.readingsPerPiece,
      subgroupSize: sampling.subgroupSize,
      sampleSize: sampling.piecesPerInspection,
      sampleSizeMode: checkpointData.sampleSizeMode || "constant",
      recommendedSPCMethod:
        checkpointData.recommendedSPCMethod ||
        checkpointData.controlChartType ||
        configuredSPCMethod,
      selectedSPCMethod: configuredSPCMethod,
      overrideSPCMethod: checkpointData.overrideSPCMethod
        ? configuredSPCMethod
        : checkpointData.overrideSPCMethod || "",
      controlChartType: configuredSPCMethod,
      type:
        resultType === "numeric"
          ? "Measurement"
          : checkpointData.inspectionMethod === "visual"
            ? "Visual"
            : checkpointData.inspectionMethod === "approval"
              ? "Approval"
              : "Test",
      expectedValue: specification.nominal ?? "",
      tolerance:
        checkpointData.specificationDisplay || checkpointData.tolerance || "",
      instrumentRequirements: {
        instrumentType: checkpointData.instrumentType || "",
        minimumResolution: checkpointData.minimumResolution || "",
        calibrationRequired: Boolean(checkpointData.calibrationRequired),
        gaugeIdRequired: Boolean(checkpointData.gaugeIdRequired),
        msaStatus: checkpointData.msaStatus || "",
        instrumentEntryMandatory: Boolean(
          checkpointData.instrumentEntryMandatory,
        ),
        configuredGaugeId: checkpointData.configuredGaugeId || "",
        selectedGaugeId: checkpointData.selectedGaugeId || "",
        gaugeId: checkpointData.gaugeId || "",
        configuredGauge: checkpointData.configuredGauge || null,
        selectedGauge: checkpointData.selectedGauge || null,
      },
    };

    if (isRecordCheckpointEdit) {
      const checkpointKey = editingRecordCheckpointKey;
      const previousMeasurement =
        editingRecord.measurements?.[checkpointKey] ||
        editingEnhancedCheckpoint?._recordMeasurement ||
        null;
      const previousPlan = editingEnhancedCheckpoint?._recordPlan || {};
      const status = normalizeCheckpointEditStatus(
        editingRecord.checkpoints?.[checkpointKey] ||
          editingEnhancedCheckpoint?._recordStatus,
      );
      const isPassing = status === "OK";
      const checkpointName = normalizedCheckpoint.name;
      const stableCharacteristicId = checkpointReferenceString(
        previousPlan.characteristicId ||
          previousMeasurement?.characteristicId ||
          previousMeasurement?.checkpointId ||
          checkpointKey,
      );

      const {
        _editKey,
        _editIndex,
        _recordEdit,
        _recordMeasurement,
        _recordPlan,
        _recordStatus,
        _recordRemark,
        ...checkpointDefinition
      } = normalizedCheckpoint;

      const snapshotCheckpoint = {
        ...previousPlan,
        ...checkpointDefinition,
        id:
          previousPlan.id ||
          previousPlan._id ||
          checkpointDefinition.id ||
          stableCharacteristicId,
        characteristicId: stableCharacteristicId,
        checkpointId:
          previousPlan.checkpointId ||
          previousMeasurement?.checkpointId ||
          stableCharacteristicId,
        name: checkpointName,
        checkpointName,
      };

      const updatedMeasurement = previousMeasurement
        ? {
            ...previousMeasurement,
            checkpointId: checkpointKey,
            characteristicId:
              previousMeasurement.characteristicId || stableCharacteristicId,
            checkpointName,
            name: previousMeasurement.name || checkpointName,
            inspectionMethod: checkpointDefinition.inspectionMethod,
            resultType: checkpointDefinition.resultType,
            expected:
              checkpointDefinition.expectedValue ??
              previousMeasurement.expected ??
              "",
            nominalValue: checkpointDefinition.nominalValue,
            lsl: checkpointDefinition.lsl,
            usl: checkpointDefinition.usl,
            lowerSpecLimit: checkpointDefinition.lowerSpecLimit,
            upperSpecLimit: checkpointDefinition.upperSpecLimit,
            unit: checkpointDefinition.unit || previousMeasurement.unit || "",
            tolerance:
              checkpointDefinition.tolerance ||
              previousMeasurement.tolerance ||
              "",
            specification: checkpointDefinition.specification,
            sampling: checkpointDefinition.sampling,
            selectedSPCMethod: checkpointDefinition.selectedSPCMethod,
            controlChartType: checkpointDefinition.controlChartType,
            status,
            pass: isPassing,
          }
        : null;

      const currentPlanSnapshot = Array.isArray(
        editingRecord.checkpointPlanSnapshot,
      )
        ? editingRecord.checkpointPlanSnapshot
        : [];
      const matchingTokens = new Set(
        [
          checkpointKey,
          previousPlan.characteristicId,
          previousPlan.checkpointId,
          previousPlan.id,
          previousPlan._id,
          previousPlan.name,
          previousPlan.checkpointName,
          previousMeasurement?.checkpointId,
          previousMeasurement?.characteristicId,
          previousMeasurement?.checkpointName,
        ]
          .map(checkpointReferenceToken)
          .filter(Boolean),
      );
      let planWasUpdated = false;
      const updatedPlanSnapshot = currentPlanSnapshot.map((plan) => {
        const matches = [
          plan?.characteristicId,
          plan?.checkpointId,
          plan?.id,
          plan?._id,
          plan?.name,
          plan?.checkpointName,
        ]
          .map(checkpointReferenceToken)
          .some((token) => token && matchingTokens.has(token));

        if (!matches) return plan;
        planWasUpdated = true;
        return snapshotCheckpoint;
      });

      if (!planWasUpdated) updatedPlanSnapshot.push(snapshotCheckpoint);

      setEditingRecord((previous) => ({
        ...previous,
        checkpoints: {
          ...(previous.checkpoints || {}),
          [checkpointKey]: status,
        },
        measurements: updatedMeasurement
          ? {
              ...(previous.measurements || {}),
              [checkpointKey]: updatedMeasurement,
            }
          : previous.measurements || {},
        checklistRemarks: {
          ...(previous.checklistRemarks || {}),
          [checkpointKey]:
            previous.checklistRemarks?.[checkpointKey] ??
            editingEnhancedCheckpoint?._recordRemark ??
            "",
        },
        checkpointPlanSnapshot: updatedPlanSnapshot,
      }));

      setShowEnhancedCheckpointModal(false);
      setEditingEnhancedCheckpoint(null);
      setIsEditingCheckpoint(false);
      setIsInCreateProcessModal(false);
      setEditingRecordCheckpointKey(null);
      toast.success(`Checkpoint "${checkpointName}" updated in this record`);
      return;
    }

    const isCreatingProcess = isInCreateProcessModal || showCreateProcessModal;

    // ----- UPDATE LOCAL STATE -----
    if (isCreatingProcess) {
      setNewProcessCheckpoints((previous) => {
        const editIndex = previous.findIndex(
          (item) =>
            item.id === checkpointId ||
            (isEditingCheckpoint &&
              item.name === editingEnhancedCheckpoint?.name),
        );
        return editIndex === -1
          ? [...previous, normalizedCheckpoint]
          : previous.map((item, index) =>
              index === editIndex ? normalizedCheckpoint : item,
            );
      });
      toast.success(`Checkpoint "${normalizedCheckpoint.name}" saved`);
    } else if (selectedProcess) {
      const existing = selectedProcess.checkpoints || [];

      // Find the checkpoint to edit.
      let resolvedEditIndex = -1;
      if (isExisting && editKey) {
        resolvedEditIndex = existing.findIndex(
          (item, index) => getCheckpointKey(item, index) === editKey,
        );
      } else if (
        isExisting &&
        Number.isInteger(Number(suppliedEditIndex)) &&
        Number(suppliedEditIndex) >= 0 &&
        Number(suppliedEditIndex) < existing.length
      ) {
        resolvedEditIndex = Number(suppliedEditIndex);
      } else {
        resolvedEditIndex = existing.findIndex(
          (item) =>
            item.id === checkpointId || item.name === checkpointData.name,
        );
      }

      const updatedCheckpoints =
        resolvedEditIndex === -1
          ? [...existing, normalizedCheckpoint]
          : existing.map((item, index) =>
              index === resolvedEditIndex ? normalizedCheckpoint : item,
            );

      // Update local state immediately
      setSelectedProcess((previous) => ({
        ...previous,
        checkpoints: updatedCheckpoints,
      }));

      // Re-initialize checkpoints to update the UI
      initializeCheckpoints(updatedCheckpoints);

      if (selectedDrawing) {
        setSelectedDrawingProcesses((previous) =>
          previous.map((process) =>
            process.processName === selectedProcess.name
              ? { ...process, checkpoints: updatedCheckpoints }
              : process,
          ),
        );
      }

      // ----- SAVE TO SERVER -----
      try {
        const processId = selectedProcess.id || selectedProcess._id;

        // For custom processes (not drawing-based)
        if (processId && !String(processId).startsWith("drawing-")) {
          setLoading(true);
          const response = await axios.put(
            `${API_URL}/qc-inspection/process/${processId}`,
            {
              checkpoints: updatedCheckpoints,
              name: selectedProcess.name,
              description:
                selectedProcess.description || `Custom inspection process`,
            },
            { withCredentials: true },
          );

          if (response.data.success) {
            toast.success(
              `Checkpoint "${normalizedCheckpoint.name}" ${resolvedEditIndex === -1 ? "added" : "updated"} and saved to server`,
            );
            // Refresh processes to get the latest data
            await fetchProcesses();

            // After successfully saving the checkpoint
            if (response?.data?.success) {
              // EMIT SOCKET EVENT for checkpoint change
              if (socket && socket.connected) {
                socket.emit("spc:data-changed", {
                  action: isExisting
                    ? "checkpoint-updated"
                    : "checkpoint-added",
                  companyId: selectedCompany?._id || selectedCompany,
                  processId: selectedProcess.id || selectedProcess._id,
                  spcStreamKey:
                    selectedProcess.spcStreamKey ||
                    `process-${selectedProcess.id}`,
                  checkpointId: checkpointId,
                  checkpointName: normalizedCheckpoint.name,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          } else {
            toast.error(
              response.data.message || "Failed to save checkpoint to server",
            );
            // Revert local state if server save fails
            setSelectedProcess((previous) => ({
              ...previous,
              checkpoints: existing,
            }));
            initializeCheckpoints(existing);
          }
        }
        // For drawing processes
        else if (selectedDrawing && selectedDrawingProcesses.length > 0) {
          // Find the drawing process
          const drawingProcess = selectedDrawingProcesses.find(
            (p) => p.processName === selectedProcess.name,
          );

          if (drawingProcess) {
            setLoading(true);
            // Update the drawing's processes
            const updatedDrawingProcesses = selectedDrawingProcesses.map((p) =>
              p.processName === selectedProcess.name
                ? { ...p, checkpoints: updatedCheckpoints }
                : p,
            );

            const response = await axios.put(
              `${API_URL}/qc-inspection/${selectedDrawing._id}/process`,
              { processes: updatedDrawingProcesses },
              { withCredentials: true },
            );

            if (response.data.success) {
              toast.success(
                `Checkpoint "${normalizedCheckpoint.name}" ${resolvedEditIndex === -1 ? "added" : "updated"} in drawing process`,
              );
              // Refresh drawings to get the latest data
              await fetchDrawings();
            } else {
              toast.error(
                response.data.message || "Failed to save checkpoint to server",
              );
              // Revert local state
              setSelectedProcess((previous) => ({
                ...previous,
                checkpoints: existing,
              }));
              initializeCheckpoints(existing);
            }
          }
        } else {
          toast.success(
            `Checkpoint "${normalizedCheckpoint.name}" ${resolvedEditIndex === -1 ? "added" : "updated"} locally (no server connection)`,
          );
        }
      } catch (error) {
        console.error("Error saving checkpoint:", error);
        toast.error(
          error.response?.data?.message ||
            "Failed to save checkpoint to server",
        );
        // Revert local state on error
        setSelectedProcess((previous) => ({
          ...previous,
          checkpoints: existing,
        }));
        initializeCheckpoints(existing);
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("Select or create a process before adding a checkpoint");
      return;
    }

    setShowEnhancedCheckpointModal(false);
    setEditingEnhancedCheckpoint(null);
    setIsEditingCheckpoint(false);
    setIsInCreateProcessModal(false);
  };

  // Update the openEnhancedCheckpointModal function
  const openEnhancedCheckpointModal = (
    checkpointToEdit = null,
    isFromCreateProcess = false,
  ) => {
    if (checkpointToEdit) {
      setEditingEnhancedCheckpoint(checkpointToEdit);
      setIsEditingCheckpoint(true);
    } else {
      setEditingEnhancedCheckpoint(null);
      setIsEditingCheckpoint(false);
    }
    setIsInCreateProcessModal(isFromCreateProcess);
    setShowEnhancedCheckpointModal(true);
  };

  // Remove checkpoint from new process
  const removeNewProcessCheckpoint = (index) => {
    const removed = newProcessCheckpoints[index];
    const updated = [...newProcessCheckpoints];
    updated.splice(index, 1);
    setNewProcessCheckpoints(updated);
    toast.success(`Removed "${removed.name}"`);
  };

  // Delete process from drawing
  const deleteDrawingProcess = async (processName) => {
    if (!window.confirm(`Delete process "${processName}"?`)) return;

    try {
      const response = await axios.delete(
        `${API_URL}/qc-inspection/${selectedDrawing._id}/process/${encodeURIComponent(processName)}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        const updatedProcesses = selectedDrawingProcesses.filter(
          (process) => process.processName !== processName,
        );
        setSelectedDrawingProcesses(updatedProcesses);

        if (selectedProcess?.name === processName) {
          setSelectedProcess(null);
          setChecklistResults({});
          setMeasurementResults({});
          setChecklistRemarks({});
        }

        toast.success(`Process "${processName}" deleted`);

        fetchDrawings();

        if (response.data.success) {
          // EMIT SOCKET EVENT for process deletion
          if (socket && socket.connected) {
            socket.emit("spc:data-changed", {
              action: "process-deleted",
              companyId: selectedCompany?._id || selectedCompany,
              processName: processName,
              drawingId: selectedDrawing?._id,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    } catch (error) {
      console.error("Error deleting drawing process:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete drawing process",
      );
    }
  };

  // Reset gauge form
  const resetGaugeForm = () => {
    setGaugeFormData({
      name: "",
      type: "Go",
      size: "",
      unit: "mm",
      toleranceMin: "",
      toleranceMax: "",
      material: "",
      serialNumber: "",
      calibrationDate: "",
      calibrationDue: "",
      certificateNumber: "",
      condition: "Good",
      status: "Pass",
      measuredValue: "",
      remarks: "",
      manufacturer: "",
      minRange: "",
      maxRange: "",
      threadPitch: "",
      threadClass: "",
      boreRange: "",
      indicatorType: "",
      depthRange: "",
      baseType: "",
      heightRange: "",
      resolution: "",
      plugDiameter: "",
      plugType: "",
      snapRange: "",
      anvilType: "",
    });
  };

  // Add enhanced gauge
  const addEnhancedGauge = () => {
    if (!gaugeFormData.name.trim()) {
      toast.error("Please enter a gauge name");
      return;
    }

    // Validate based on type
    if (gaugeFormData.type === "Go" || gaugeFormData.type === "No-Go") {
      if (!gaugeFormData.size) {
        toast.error("Please enter the gauge size/limit");
        return;
      }
    } else {
      // For measuring instruments
      if (!gaugeFormData.size) {
        toast.error("Please enter the gauge size/range");
        return;
      }
    }

    const now = new Date().toISOString();
    const existingGauge =
      editingGaugeIndex !== null ? enhancedGauges[editingGaugeIndex] : null;
    const gaugeData = {
      ...(existingGauge || {}),
      ...gaugeFormData,
      id: existingGauge
        ? getGaugeIdentity(existingGauge, editingGaugeIndex)
        : `GAUGE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: existingGauge?.createdAt || now,
      updatedAt: now,
      inspectionHistory: existingGauge?.inspectionHistory || [],
    };

    if (editingGaugeIndex !== null) {
      setEnhancedGauges((currentGauges) =>
        currentGauges.map((gauge, index) =>
          index === editingGaugeIndex ? gaugeData : gauge,
        ),
      );
      toast.success(`Gauge "${gaugeData.name}" updated successfully!`);
    } else {
      setEnhancedGauges((currentGauges) => [...currentGauges, gaugeData]);
      if (pendingInstrumentCheckpointId) {
        updateTypedEntry(
          pendingInstrumentCheckpointId,
          "instrumentId",
          getGaugeIdentity(gaugeData),
        );
      }
      toast.success(`Gauge "${gaugeData.name}" added successfully!`);
    }

    setShowGaugeModal(false);
    setEditingGaugeIndex(null);
    setPendingInstrumentCheckpointId(null);
    resetGaugeForm();
  };

  // Delete enhanced gauge
  const deleteEnhancedGauge = (index) => {
    const gauge = enhancedGauges[index];
    if (!window.confirm(`Delete gauge "${gauge.name}"?`)) return;

    const updatedGauges = [...enhancedGauges];
    updatedGauges.splice(index, 1);
    setEnhancedGauges(updatedGauges);
    toast.success(`Gauge "${gauge.name}" deleted`);
  };

  // View gauge details
  const viewGaugeDetails = (gauge) => {
    setSelectedGaugeDetail(gauge);
    setShowGaugeDetailModal(true);
  };

  // Edit enhanced gauge
  const editEnhancedGauge = (index) => {
    const gauge = enhancedGauges[index];
    setGaugeFormData({
      name: gauge.name || "",
      type: gauge.type || "Go",
      size: gauge.size || "",
      unit: gauge.unit || "mm",
      toleranceMin: gauge.toleranceMin || "",
      toleranceMax: gauge.toleranceMax || "",
      material: gauge.material || "",
      serialNumber: gauge.serialNumber || "",
      calibrationDate: gauge.calibrationDate || "",
      calibrationDue: gauge.calibrationDue || "",
      certificateNumber: gauge.certificateNumber || "",
      condition: gauge.condition || "Good",
      status: gauge.status || "Pass",
      measuredValue: gauge.measuredValue || "",
      remarks: gauge.remarks || "",
      manufacturer: gauge.manufacturer || "",
      minRange: gauge.minRange || "",
      maxRange: gauge.maxRange || "",
      // Type-specific fields
      threadPitch: gauge.threadPitch || "",
      threadClass: gauge.threadClass || "",
      boreRange: gauge.boreRange || "",
      indicatorType: gauge.indicatorType || "",
      depthRange: gauge.depthRange || "",
      baseType: gauge.baseType || "",
      heightRange: gauge.heightRange || "",
      resolution: gauge.resolution || "",
      plugDiameter: gauge.plugDiameter || "",
      plugType: gauge.plugType || "",
      snapRange: gauge.snapRange || "",
      anvilType: gauge.anvilType || "",
    });
    setEditingGaugeIndex(index);
    setShowGaugeModal(true);
  };

  // Check if gauge is out of calibration
  const isGaugeOutOfCalibration = (calibrationDue) => {
    if (!calibrationDue) return false;
    const dueDate = new Date(calibrationDue);
    const today = new Date();
    return dueDate < today;
  };

  // Group drawings by folder
  const getFolderDrawings = useCallback(() => {
    const folders = {};
    drawings.forEach((drawing) => {
      const folder = drawing.folderName || "Uncategorized";
      if (!folders[folder]) {
        folders[folder] = [];
      }
      folders[folder].push(drawing);
    });
    return folders;
  }, [drawings]);

  const updateTypedEntry = (checkpointId, field, value) => {
    handleMeasurementChange(checkpointId, field, value);
  };

  const renderInstrumentSelector = (checkpoint, checkpointId) => {
    const requiresInstrument =
      checkpoint.inspectionMethod === "go_nogo" ||
      checkpoint.instrumentType ||
      checkpoint.instrumentRequirements?.instrumentType ||
      checkpoint.gaugeIdRequired ||
      checkpoint.instrumentRequirements?.gaugeIdRequired ||
      checkpoint.calibrationRequired ||
      checkpoint.instrumentRequirements?.calibrationRequired ||
      checkpoint.instrumentEntryMandatory ||
      checkpoint.instrumentRequirements?.instrumentEntryMandatory;
    if (!requiresInstrument) return null;

    const configuredGauge = getConfiguredGaugeSnapshot(checkpoint);
    if (!configuredGauge) {
      return (
        <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] text-amber-800">
          Configure the gauge in checkpoint creation before inspection.
        </p>
      );
    }

    const expired = isGaugeCalibrationExpired(configuredGauge.calibrationDue);
    return (
      <div
        className={`mt-2 rounded border px-2 py-1 text-[10px] ${
          expired
            ? "border-red-200 bg-red-50 text-red-800"
            : "border-slate-200 bg-slate-50 text-slate-700"
        }`}
      >
        <span className="font-semibold">Configured gauge:</span>{" "}
        {configuredGauge.name}
        {configuredGauge.serialNumber
          ? ` • S/N ${configuredGauge.serialNumber}`
          : ""}
        {configuredGauge.specification
          ? ` • ${configuredGauge.specification}`
          : ""}
        {expired ? " • Calibration expired" : ""}
      </div>
    );
  };

  const renderCheckpointEntry = (checkpoint, checkpointId) => {
    const entry =
      measurementResults[checkpointId] || buildCheckpointEntryState(checkpoint);
    const resultType = getCheckpointResultType(checkpoint);

    if (checkpoint.inspectionMethod === "go_nogo") {
      const gaugeMode = getConfiguredGaugeMode(checkpoint);
      const gaugeLabel = getConfiguredGaugeModeLabel(gaugeMode);
      const requirement = getCheckpointRequirement(checkpoint);
      const sampling = getCheckpointSampling(checkpoint);
      const variableSampleSize =
        String(checkpoint.sampleSizeMode || "constant").toLowerCase() ===
        "variable";
      const actualSampleSize = variableSampleSize
        ? toPositiveInteger(
            entry.attributeSampleSize ?? entry.inspectedCount,
            sampling.piecesPerInspection,
          )
        : sampling.piecesPerInspection;
      const optionButton = (currentValue, value, label, onClick) => (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={currentValue === value}
          className={`whitespace-nowrap px-2 py-1 rounded text-[10px] font-medium border ${
            currentValue === value
              ? value
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-red-600 text-white border-red-600"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {label}
        </button>
      );

      if (actualSampleSize > 1) {
        const results =
          entry.goNoGoResults?.length === actualSampleSize
            ? entry.goNoGoResults
            : Array.from({ length: actualSampleSize }, (_, index) => ({
                ...(entry.goNoGoResults?.[index] || {}),
                pieceNumber: index + 1,
                gaugeMode,
                gaugePassed: getGoNoGoPiecePass(
                  entry.goNoGoResults?.[index] || {},
                  gaugeMode,
                ),
                goAccepted: entry.goNoGoResults?.[index]?.goAccepted ?? null,
                noGoPrevented:
                  entry.goNoGoResults?.[index]?.noGoPrevented ?? null,
              }));
        const updatePiece = (pieceIndex, passed) => {
          const next = results.map((piece, index) =>
            index === pieceIndex
              ? {
                  ...piece,
                  gaugeMode,
                  gaugePassed: passed,
                  ...(gaugeMode === "go" ? { goAccepted: passed } : {}),
                  ...(gaugeMode === "no_go" ? { noGoPrevented: passed } : {}),
                  ...(gaugeMode === "both"
                    ? { goAccepted: passed, noGoPrevented: passed }
                    : {}),
                }
              : piece,
          );
          updateTypedEntry(checkpointId, "goNoGoResults", next);
        };

        return (
          <div className="space-y-2 min-w-[250px] text-left">
            <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1">
              <div className="text-[10px] font-semibold text-slate-700">
                {gaugeLabel}
              </div>
              <div className="text-[10px] text-slate-500">{requirement}</div>
            </div>
            {variableSampleSize && (
              <label className="block rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
                Actual pieces inspected for this subgroup
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={actualSampleSize}
                  onChange={(event) => {
                    const nextSize = Math.max(
                      2,
                      toPositiveInteger(
                        event.target.value,
                        sampling.piecesPerInspection,
                      ),
                    );
                    const resized = Array.from(
                      { length: nextSize },
                      (_, index) => ({
                        ...(results[index] || {}),
                        pieceNumber: index + 1,
                        gaugeMode,
                        gaugePassed: getGoNoGoPiecePass(
                          results[index] || {},
                          gaugeMode,
                        ),
                        goAccepted: results[index]?.goAccepted ?? null,
                        noGoPrevented: results[index]?.noGoPrevented ?? null,
                      }),
                    );
                    updateTypedEntry(
                      checkpointId,
                      "attributeSampleSize",
                      nextSize,
                    );
                    updateTypedEntry(checkpointId, "inspectedCount", nextSize);
                    updateTypedEntry(checkpointId, "goNoGoResults", resized);
                  }}
                  className="mt-1 w-full rounded border border-blue-300 bg-white px-2 py-1"
                />
              </label>
            )}
            {results.map((piece, pieceIndex) => (
              <div
                key={piece.pieceNumber}
                className="grid grid-cols-[32px_minmax(88px,1fr)_50px_50px_50px] gap-2 items-center border-b border-slate-100 pb-1"
              >
                <span className="text-[10px] font-semibold text-slate-500">
                  P{piece.pieceNumber}
                </span>
                <span className="text-[10px] font-semibold text-slate-600">
                  {gaugeLabel}
                </span>
                {optionButton(
                  getGoNoGoPiecePass(piece, gaugeMode),
                  true,
                  "Pass",
                  () => updatePiece(pieceIndex, true),
                )}
                {optionButton(
                  getGoNoGoPiecePass(piece, gaugeMode),
                  false,
                  "Fail",
                  () => updatePiece(pieceIndex, false),
                )}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-center text-[9px] font-semibold ${
                    typeof getGoNoGoPiecePass(piece, gaugeMode) !== "boolean"
                      ? "bg-slate-100 text-slate-500"
                      : getGoNoGoPiecePass(piece, gaugeMode)
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {typeof getGoNoGoPiecePass(piece, gaugeMode) !== "boolean"
                    ? "—"
                    : getGoNoGoPiecePass(piece, gaugeMode)
                      ? "PASS"
                      : "FAIL"}
                </span>
              </div>
            ))}
            {renderInstrumentSelector(checkpoint, checkpointId)}
          </div>
        );
      }

      const currentPass = getGoNoGoPiecePass(entry, gaugeMode);
      const updateSinglePiece = (passed) => {
        updateTypedEntry(checkpointId, "gaugeMode", gaugeMode);
        updateTypedEntry(checkpointId, "gaugePassed", passed);
        if (gaugeMode === "go" || gaugeMode === "both") {
          updateTypedEntry(checkpointId, "goAccepted", passed);
        }
        if (gaugeMode === "no_go" || gaugeMode === "both") {
          updateTypedEntry(checkpointId, "noGoPrevented", passed);
        }
      };

      return (
        <div className="space-y-2 text-left min-w-[280px]">
          <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1">
            <div className="text-xs font-semibold text-slate-700">
              {gaugeLabel}
            </div>
            <div className="text-[10px] text-slate-500">{requirement}</div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium">Inspection outcome</span>
            <div className="flex gap-1">
              {optionButton(currentPass, true, "Pass", () =>
                updateSinglePiece(true),
              )}
              {optionButton(currentPass, false, "Fail", () =>
                updateSinglePiece(false),
              )}
            </div>
          </div>
          {renderInstrumentSelector(checkpoint, checkpointId)}
        </div>
      );
    }

    if (resultType === "numeric") {
      const sampling = getCheckpointSampling(checkpoint);
      const requiredReadings =
        sampling.piecesPerInspection * sampling.readingsPerPiece;
      const recordedReadings = collectFrontendRawReadings({
        checkpointId,
        entry,
        checkpointMeasurement: checkpointMeasurements[checkpointId] || {},
        pieces: pieceMeasurements,
      }).length;
      const input =
        requiredReadings > 1 ? (
          <button
            type="button"
            onClick={() =>
              initializeMultiPiece(sampling.piecesPerInspection, checkpointId)
            }
            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100"
          >
            {recordedReadings > 0 ? "Edit Readings" : "Record Readings"}{" "}
            {recordedReadings}/{requiredReadings}
          </button>
        ) : (
          <div>
            <input
              type="number"
              step="any"
              value={entry.measured ?? ""}
              onChange={(event) =>
                updateTypedEntry(checkpointId, "measured", event.target.value)
              }
              className="w-28 px-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
              placeholder="Measured"
            />
            {entry.resultReason && (
              <div className="text-[10px] text-slate-500 mt-1">
                {entry.resultReason}
              </div>
            )}
          </div>
        );

      return (
        <div>
          {input}
          {renderInstrumentSelector(checkpoint, checkpointId)}
        </div>
      );
    }

    if (resultType === "binary") {
      const sampling = getCheckpointSampling(checkpoint);
      const variableSampleSize =
        String(checkpoint.sampleSizeMode || "constant").toLowerCase() ===
        "variable";
      const actualSampleSize = variableSampleSize
        ? toPositiveInteger(
            entry.attributeSampleSize ?? entry.inspectedCount,
            sampling.piecesPerInspection,
          )
        : sampling.piecesPerInspection;

      if (actualSampleSize > 1) {
        const pieceResults =
          entry.pieceResults?.length === actualSampleSize
            ? entry.pieceResults
            : Array.from(
                { length: actualSampleSize },
                (_, index) => entry.pieceResults?.[index] || "",
              );
        const updatePiece = (pieceIndex, status) => {
          const next = pieceResults.map((result, index) =>
            index === pieceIndex ? status : result,
          );
          updateTypedEntry(checkpointId, "pieceResults", next);
        };
        return (
          <div className="space-y-1 min-w-[210px]">
            {variableSampleSize && (
              <label className="block rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
                Actual pieces inspected for this subgroup
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={actualSampleSize}
                  onChange={(event) => {
                    const nextSize = Math.max(
                      2,
                      toPositiveInteger(
                        event.target.value,
                        sampling.piecesPerInspection,
                      ),
                    );
                    const resized = Array.from(
                      { length: nextSize },
                      (_, index) => pieceResults[index] || "",
                    );
                    updateTypedEntry(
                      checkpointId,
                      "attributeSampleSize",
                      nextSize,
                    );
                    updateTypedEntry(checkpointId, "inspectedCount", nextSize);
                    updateTypedEntry(checkpointId, "pieceResults", resized);
                  }}
                  className="mt-1 w-full rounded border border-blue-300 bg-white px-2 py-1"
                />
              </label>
            )}
            <div className="grid grid-cols-2 gap-1">
              {pieceResults.map((result, pieceIndex) => (
                <div
                  key={pieceIndex}
                  className="flex items-center justify-between gap-1 border border-slate-100 rounded px-1 py-1"
                >
                  <span className="text-[10px] text-slate-500">
                    P{pieceIndex + 1}
                  </span>
                  {["OK", "Fail"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updatePiece(pieceIndex, status)}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        result === status
                          ? status === "OK"
                            ? "bg-emerald-600 text-white"
                            : "bg-red-600 text-white"
                          : "border border-slate-300"
                      }`}
                    >
                      {status === "OK" ? "P" : "F"}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="text-[10px] text-slate-500">
              Rejected:{" "}
              {pieceResults.filter((result) => result === "Fail").length}/
              {actualSampleSize}
            </div>
            {renderInstrumentSelector(checkpoint, checkpointId)}
          </div>
        );
      }

      return (
        <div>
          <div className="flex justify-center gap-1">
            {["OK", "Fail"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() =>
                  updateTypedEntry(checkpointId, "binaryResult", status)
                }
                className={`px-3 py-1 rounded-md text-xs ${
                  entry.binaryResult === status
                    ? status === "OK"
                      ? "bg-emerald-600 text-white"
                      : "bg-red-600 text-white"
                    : "border border-slate-300"
                }`}
              >
                {status === "OK" ? "Pass" : "Fail"}
              </button>
            ))}
          </div>
          {renderInstrumentSelector(checkpoint, checkpointId)}
        </div>
      );
    }

    if (resultType === "defective_count") {
      const sampling = getCheckpointSampling(checkpoint);
      const variableSampleSize =
        String(checkpoint.sampleSizeMode || "constant").toLowerCase() ===
        "variable";
      const actualSampleSize = variableSampleSize
        ? toPositiveInteger(
            entry.attributeSampleSize ?? entry.inspectedCount,
            sampling.piecesPerInspection,
          )
        : sampling.piecesPerInspection;

      return (
        <div className="space-y-2 min-w-[210px]">
          {variableSampleSize && (
            <label className="block rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
              Actual pieces inspected for this subgroup
              <input
                type="number"
                min="2"
                step="1"
                value={actualSampleSize}
                onChange={(event) => {
                  const nextSize = Math.max(
                    2,
                    toPositiveInteger(
                      event.target.value,
                      sampling.piecesPerInspection,
                    ),
                  );
                  updateTypedEntry(
                    checkpointId,
                    "attributeSampleSize",
                    nextSize,
                  );
                  updateTypedEntry(checkpointId, "inspectedCount", nextSize);
                  if (Number(entry.rejectedCount || 0) > nextSize) {
                    updateTypedEntry(checkpointId, "rejectedCount", nextSize);
                  }
                }}
                className="mt-1 w-full rounded border border-blue-300 bg-white px-2 py-1"
              />
            </label>
          )}
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              min="0"
              max={actualSampleSize}
              step="1"
              value={entry.rejectedCount ?? ""}
              onChange={(event) =>
                updateTypedEntry(
                  checkpointId,
                  "rejectedCount",
                  event.target.value,
                )
              }
              className="w-20 px-2 py-1 border border-slate-300 rounded-md"
              placeholder="Rejected"
            />
            <span className="text-xs text-slate-500">
              of {actualSampleSize}
            </span>
          </div>
        </div>
      );
    }

    if (resultType === "defect_count") {
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              min="0"
              value={entry.defectCount ?? ""}
              onChange={(event) =>
                updateTypedEntry(
                  checkpointId,
                  "defectCount",
                  event.target.value,
                )
              }
              className="w-20 px-2 py-1 border border-slate-300 rounded-md"
              placeholder="Defects"
            />
            <span className="text-xs text-slate-500">defects</span>
          </div>
          {checkpoint.opportunityMode === "variable" && (
            <input
              type="number"
              min="1"
              value={entry.opportunityCount ?? ""}
              onChange={(event) =>
                updateTypedEntry(
                  checkpointId,
                  "opportunityCount",
                  event.target.value,
                )
              }
              className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs"
              placeholder="Inspection opportunities"
            />
          )}
        </div>
      );
    }

    if (resultType === "categorical") {
      const options = checkpoint.categoricalOptions?.length
        ? checkpoint.categoricalOptions
        : ["Acceptable", "Minor", "Major", "Critical"];
      return (
        <select
          value={entry.category || ""}
          onChange={(event) =>
            updateTypedEntry(checkpointId, "category", event.target.value)
          }
          className="w-full min-w-[140px] px-2 py-1 border border-slate-300 rounded-md"
        >
          <option value="">Select condition</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (resultType === "approval") {
      return (
        <label className="inline-flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={Boolean(entry.approved)}
            onChange={(event) =>
              updateTypedEntry(checkpointId, "approved", event.target.checked)
            }
          />
          Approved / verified
        </label>
      );
    }

    return <span className="text-slate-400">—</span>;
  };

  const renderCheckpointResult = (checkpoint, checkpointId) => {
    const entry = measurementResults[checkpointId] || {};
    const status =
      checklistResults[checkpointId] ||
      deriveCheckpointStatus(checkpoint, entry).status;
    const classes =
      status === "OK"
        ? "bg-emerald-100 text-emerald-700"
        : status === "Fail"
          ? "bg-red-100 text-red-700"
          : status === "N/A"
            ? "bg-slate-200 text-slate-700"
            : "bg-amber-100 text-amber-700";

    return (
      <div className="space-y-1">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}
        >
          {status === "OK" ? "PASS" : status.toUpperCase()}
        </span>
        {checkpoint.allowNA && status === "Pending" && (
          <button
            type="button"
            onClick={() => handleChecklistChange(checkpointId, "N/A")}
            className="block mx-auto text-[10px] text-slate-500 underline"
          >
            Mark N/A
          </button>
        )}
      </div>
    );
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-700";
    const s = status.toLowerCase();
    if (s.includes("pass") || s === "ok")
      return "bg-emerald-100 text-emerald-700";
    if (s.includes("fail") || s === "hold") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  // Add this helper function at the top of your component or in the helpers section
  const formatMeasureValue = (
    value,
    unit = "",
    deviation = null,
    decimals = 3,
  ) => {
    // Format the main value
    let formattedValue = "-";
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      value !== "-"
    ) {
      const num = typeof value === "number" ? value : parseFloat(value);
      if (!isNaN(num) && isFinite(num)) {
        formattedValue = num.toFixed(decimals);
      } else {
        formattedValue = String(value);
      }
    }

    // Format deviation if provided
    let formattedDeviation = null;
    if (deviation !== null && deviation !== undefined && deviation !== "-") {
      const devNum =
        typeof deviation === "number" ? deviation : parseFloat(deviation);
      if (!isNaN(devNum) && isFinite(devNum)) {
        formattedDeviation = devNum.toFixed(decimals);
      }
    }

    // Build the final string
    let result = formattedValue;
    if (unit && formattedValue !== "-") {
      result += ` ${unit}`;
    }
    if (formattedDeviation !== null) {
      const sign = parseFloat(formattedDeviation) >= 0 ? "+" : "";
      result += ` (${sign}${formattedDeviation})`;
    }

    return result;
  };

  // Generate subgroup options from the actual control-chart series.
  const subgroupOptions = useMemo(() => {
    const chart = selectedRecord?.selectedControlChart;
    const labels = chart?.labels;
    if (!Array.isArray(labels)) return [];

    const isIMR = String(chart?.type || "").toLowerCase() === "imr";
    return labels.map((label, index) => {
      const fallback = isIMR ? `Reading ${index + 1}` : `SG-${index + 1}`;
      return {
        value: String(index),
        label: fallback,
        sourceLabel: label || fallback,
      };
    });
  }, [selectedRecord?.selectedControlChart]);

  // Date filtering applies to subgroup metadata returned by the report API.
  const handleDateRangeFilter = (range) => {
    setSelectedDateRange(range);
    if (range !== "Custom") {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  const applyCustomDateFilter = () => {
    if (!customStartDate || !customEndDate) {
      toast.error("Select both start and end dates");
      return;
    }

    if (new Date(customStartDate) > new Date(customEndDate)) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setSelectedDateRange("Custom");
  };

  const spcDateBounds = useMemo(() => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    switch (selectedDateRange) {
      case "Current Day":
      case "Daily View":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Last Week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Custom":
        startDate = customStartDate ? new Date(customStartDate) : null;
        endDate = customEndDate ? new Date(customEndDate) : null;
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);
        break;
      default:
        break;
    }

    return { startDate, endDate };
  }, [selectedDateRange, customStartDate, customEndDate]);

  const getDateRangeLabel = () => {
    if (selectedDateRange === "Custom") {
      return `${customStartDate || "-"} to ${customEndDate || "-"}`;
    }
    return selectedDateRange;
  };

  const selectedSubgroupLabel =
    subgroupOptions.find((subgroup) => subgroup.value === selectedSubgroup)
      ?.label || selectedSubgroup;

  useEffect(() => {
    setFilteredSPCData(selectedRecord?.spc || {});
    setSelectedDateRange("All Data");
    setSelectedSubgroup("all");
    setCustomStartDate("");
    setCustomEndDate("");
  }, [selectedRecord?.spc]);

  const editCheckpointInProcess = (checkpointId, index) => {
    openCheckpointEditModal(checkpointId, index);
  };

  // Delete checkpoint with confirmation and cleanup
  const deleteCheckpointFromProcess = (checkpointId, index) => {
    if (isInspectionPlanLocked) {
      toast.error("Approved or effective inspection plans cannot be edited");
      return;
    }

    const checkpoint = selectedProcess?.checkpoints?.find(
      (item, idx) =>
        getCheckpointKey(item, idx) === checkpointId || idx === index,
    );

    if (!checkpoint) {
      toast.error("Checkpoint not found");
      return;
    }

    if (
      !window.confirm(
        `Delete checkpoint "${checkpoint.name || checkpointId}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    // Remove from all state
    const updatedChecklist = { ...checklistResults };
    const updatedMeasurements = { ...measurementResults };
    const updatedRemarks = { ...checklistRemarks };
    const updatedCheckpointMeasurements = { ...checkpointMeasurements };

    delete updatedChecklist[checkpointId];
    delete updatedRemarks[checkpointId];
    delete updatedMeasurements[checkpointId];
    delete updatedCheckpointMeasurements[checkpointId];

    // Update process checkpoints
    if (selectedProcess) {
      const updatedCheckpoints = selectedProcess.checkpoints.filter(
        (cp, idx) =>
          getCheckpointKey(cp, idx) !== checkpointId && idx !== index,
      );
      setSelectedProcess({
        ...selectedProcess,
        checkpoints: updatedCheckpoints,
      });
    }

    setChecklistResults(updatedChecklist);
    setMeasurementResults(updatedMeasurements);
    setChecklistRemarks(updatedRemarks);
    setCheckpointMeasurements(updatedCheckpointMeasurements);

    toast.success(
      `Checkpoint "${checkpoint.name || checkpointId}" deleted successfully`,
    );

    if (socket && socket.connected) {
      socket.emit("spc:data-changed", {
        action: "checkpoint-deleted",
        companyId: selectedCompany?._id || selectedCompany,
        processId: selectedProcess.id || selectedProcess._id,
        spcStreamKey:
          selectedProcess.spcStreamKey || `process-${selectedProcess.id}`,
        checkpointId: checkpointId,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Add this useEffect to refresh data when socket events are received
  useEffect(() => {
    if (!lastSPCEvent) return;

    const action = String(lastSPCEvent.action || "");

    // Check if the event affects processes or checkpoints
    const isProcessOrCheckpointEvent = [
      "process-created",
      "process-deleted",
      "process-renamed",
      "checkpoint-added",
      "checkpoint-updated",
      "checkpoint-deleted",
    ].includes(action);

    if (isProcessOrCheckpointEvent) {
      console.log(`🔄 Refreshing due to ${action} event`);

      // Refresh processes
      if (selectedCompany) {
        fetchProcesses();
      }

      // Refresh inspection records
      fetchInspectionRecords();

      // If the event is from another socket, refresh the selected process data
      if (
        lastSPCEvent.originSocketId &&
        lastSPCEvent.originSocketId !== socketId
      ) {
        if (selectedProcess && lastSPCEvent.processId === selectedProcess.id) {
          // Reload the current process
          handleProcessSelect(selectedProcess.id);
        }
      }
    }

    // Also handle the existing inspection events
    if (action.startsWith("inspection-")) {
      if (
        lastSPCEvent.originSocketId &&
        lastSPCEvent.originSocketId === socketId
      ) {
        return;
      }
      fetchInspectionRecords();
    }
  }, [
    lastSPCEvent?.eventId,
    lastSPCEvent?.receivedAt,
    socketId,
    selectedCompany,
  ]);
  // ============================================
  // 2. EDIT & DELETE FOR CUSTOM PROCESSES
  // ============================================

  // Edit custom process with full support
  const editCustomProcess = (process) => {
    if (!process) {
      toast.error("No process selected to edit");
      return;
    }

    if (process.isDrawing) {
      toast.error(
        "Drawing-based processes cannot be edited. Create a custom process instead.",
      );
      return;
    }

    if (!process.isCustom) {
      toast.error(
        "Default processes cannot be edited. Please create a custom process.",
      );
      return;
    }

    setEditingProcess(process);
    setCustomProcessName(process.name);
    setCustomCheckpoints(JSON.parse(JSON.stringify(process.checkpoints || [])));
    setShowEditModal(true);
  };

  // Delete custom process with confirmation
  const deleteCustomProcess = async (processId, processName) => {
    if (!processId) {
      toast.error("Invalid process ID");
      return;
    }

    if (
      !window.confirm(
        `Delete process "${processName}"? This will remove all associated checkpoints and data.`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(
        `${API_URL}/qc-inspection/process/${processId}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        // Remove from state
        setProcesses((prev) =>
          prev.filter((p) => (p.id || p._id) !== processId),
        );

        // If this was the selected process, clear it
        if (
          selectedProcess &&
          (selectedProcess.id === processId ||
            selectedProcess._id === processId)
        ) {
          setSelectedProcess(null);
          setChecklistResults({});
          setMeasurementResults({});
          setChecklistRemarks({});
          setCheckpointMeasurements({});
        }

        if (socket && socket.connected) {
          socket.emit("spc:data-changed", {
            action: "process-deleted",
            companyId: selectedCompany?._id || selectedCompany,
            processId: processId,
            processName: processName,
            timestamp: new Date().toISOString(),
          });
        }

        toast.success(`Process "${processName}" deleted successfully`);
        fetchProcesses(); // Refresh list
      } else {
        toast.error(response.data.message || "Failed to delete process");
      }
    } catch (error) {
      console.error("Error deleting process:", error);
      toast.error(error.response?.data?.message || "Failed to delete process");
    } finally {
      setLoading(false);
      setShowEditModal(false);
      setEditingProcess(null);
    }
  };

  // ============================================
  // 3. EDIT & DELETE FOR DRAWING PROCESSES
  // ============================================

  // Edit drawing process
  const editDrawingProcess = (processName) => {
    const process = selectedDrawingProcesses.find(
      (p) => p.processName === processName,
    );
    if (!process) {
      toast.error("Process not found");
      return;
    }

    // Set up for editing - reuse the edit modal with drawing context
    setEditingProcess({
      id: `drawing-${selectedDrawing?._id}-${processName}`,
      name: processName,
      checkpoints: process.checkpoints || [],
      isDrawing: true,
      isCustom: true,
      _id: `drawing-${selectedDrawing?._id}`,
      description: `Process from drawing: ${selectedDrawing?.title || ""}`,
      drawingId: selectedDrawing?._id,
    });
    setCustomProcessName(processName);
    setCustomCheckpoints(JSON.parse(JSON.stringify(process.checkpoints || [])));
    setShowEditModal(true);
  };
  // Direct delete for drawing process (without opening modal)
  const deleteDrawingProcessDirect = async (drawingId, processName) => {
    if (!drawingId || !processName) {
      toast.error("Invalid process data");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(
        `${API_URL}/qc-inspection/${drawingId}/process/${encodeURIComponent(processName)}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        // Update local state
        const updatedProcesses = selectedDrawingProcesses.filter(
          (p) => p.processName !== processName,
        );
        setSelectedDrawingProcesses(updatedProcesses);

        // If this was the selected process, clear it
        if (selectedProcess?.name === processName) {
          setSelectedProcess(null);
          setChecklistResults({});
          setMeasurementResults({});
          setChecklistRemarks({});
          setCheckpointMeasurements({});
        }

        toast.success(`Process "${processName}" deleted successfully`);
        fetchDrawings(); // Refresh drawings
        if (socket && socket.connected) {
          socket.emit("spc:data-changed", {
            action: "process-deleted",
            companyId: selectedCompany?._id || selectedCompany,
            processName: processName,
            drawingId: drawingId,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        toast.error(response.data.message || "Failed to delete process");
      }
    } catch (error) {
      console.error("Error deleting drawing process:", error);
      toast.error(error.response?.data?.message || "Failed to delete process");
    } finally {
      setLoading(false);
    }
  };

  // Direct delete for custom process (without opening modal)
  const deleteCustomProcessDirect = async (processId, processName) => {
    if (!processId) {
      toast.error("Invalid process ID");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(
        `${API_URL}/qc-inspection/process/${processId}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        // Remove from state
        setProcesses((prev) =>
          prev.filter((p) => (p.id || p._id) !== processId),
        );

        // If this was the selected process, clear it
        if (
          selectedProcess &&
          (selectedProcess.id === processId ||
            selectedProcess._id === processId)
        ) {
          setSelectedProcess(null);
          setChecklistResults({});
          setMeasurementResults({});
          setChecklistRemarks({});
          setCheckpointMeasurements({});
        }

        toast.success(`Process "${processName}" deleted successfully`);
        fetchProcesses(); // Refresh list
        if (socket && socket.connected) {
          socket.emit("spc:data-changed", {
            action: "process-deleted",
            companyId: selectedCompany?._id || selectedCompany,
            processId: processId,
            processName: processName,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        toast.error(response.data.message || "Failed to delete process");
      }
    } catch (error) {
      console.error("Error deleting process:", error);
      toast.error(error.response?.data?.message || "Failed to delete process");
    } finally {
      setLoading(false);
    }
  };
  // Delete drawing process
  const deleteDrawingProcessHandler = async (processName) => {
    if (!selectedDrawing) {
      toast.error("No drawing selected");
      return;
    }

    if (
      !window.confirm(
        `Delete process "${processName}" from drawing "${selectedDrawing.title}"?`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(
        `${API_URL}/qc-inspection/${selectedDrawing._id}/process/${encodeURIComponent(processName)}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        // Update local state
        const updatedProcesses = selectedDrawingProcesses.filter(
          (p) => p.processName !== processName,
        );
        setSelectedDrawingProcesses(updatedProcesses);

        // If this was the selected process, clear it
        if (selectedProcess?.name === processName) {
          setSelectedProcess(null);
          setChecklistResults({});
          setMeasurementResults({});
          setChecklistRemarks({});
          setCheckpointMeasurements({});
        }

        toast.success(`Process "${processName}" deleted from drawing`);
        if (socket && socket.connected) {
          socket.emit("spc:data-changed", {
            action: "process-deleted",
            companyId: selectedCompany?._id || selectedCompany,
            processName: processName,
            drawingId: selectedDrawing?._id,
            timestamp: new Date().toISOString(),
          });
        }
      }
      fetchDrawings(); // Refresh drawings
    } catch (error) {
      console.error("Error deleting drawing process:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete drawing process",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 4. EDIT & DELETE FOR GAUGES/INSTRUMENTS
  // ============================================

  // Edit gauge
  const editGauge = (index) => {
    const gauge = enhancedGauges[index];
    if (!gauge) {
      toast.error("Gauge not found");
      return;
    }

    setGaugeFormData({
      name: gauge.name || "",
      type: gauge.type || "Go",
      size: gauge.size || "",
      unit: gauge.unit || "mm",
      toleranceMin: gauge.toleranceMin || "",
      toleranceMax: gauge.toleranceMax || "",
      material: gauge.material || "",
      serialNumber: gauge.serialNumber || "",
      calibrationDate: gauge.calibrationDate || "",
      calibrationDue: gauge.calibrationDue || "",
      certificateNumber: gauge.certificateNumber || "",
      condition: gauge.condition || "Good",
      status: gauge.status || "Pass",
      measuredValue: gauge.measuredValue || "",
      remarks: gauge.remarks || "",
      manufacturer: gauge.manufacturer || "",
      minRange: gauge.minRange || "",
      maxRange: gauge.maxRange || "",
      threadPitch: gauge.threadPitch || "",
      threadClass: gauge.threadClass || "",
      boreRange: gauge.boreRange || "",
      indicatorType: gauge.indicatorType || "",
      depthRange: gauge.depthRange || "",
      baseType: gauge.baseType || "",
      heightRange: gauge.heightRange || "",
      resolution: gauge.resolution || "",
      plugDiameter: gauge.plugDiameter || "",
      plugType: gauge.plugType || "",
      snapRange: gauge.snapRange || "",
      anvilType: gauge.anvilType || "",
    });
    setEditingGaugeIndex(index);
    setShowGaugeModal(true);
  };

  // Delete gauge
  const deleteGauge = (index) => {
    const gauge = enhancedGauges[index];
    if (!gauge) {
      toast.error("Gauge not found");
      return;
    }

    if (!window.confirm(`Delete gauge "${gauge.name}"?`)) {
      return;
    }

    const updatedGauges = [...enhancedGauges];
    updatedGauges.splice(index, 1);
    setEnhancedGauges(updatedGauges);
    toast.success(`Gauge "${gauge.name}" deleted`);
  };

  // ============================================
  // 5. EDIT & DELETE FOR INSPECTION RECORDS
  // ============================================

  // Edit record - enhanced version
  const editRecordEnhanced = (record) => {
    if (!record) {
      toast.error("No record selected");
      return;
    }

    const recordCopy = prepareInspectionRecordForEdit(record);
    setEditingRecordCheckpointKey(null);
    setEditingRecord(recordCopy);
    setShowEditModal(true);
  };

  // Delete record
  const deleteRecordEnhanced = async (recordId, recordName = "Record") => {
    if (!recordId) {
      toast.error("Invalid record ID");
      return;
    }

    if (
      !window.confirm(`Delete ${recordName}? This action cannot be undone.`)
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/qc-inspection/${recordId}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        setRecords((prev) => prev.filter((r) => (r._id || r.id) !== recordId));
        toast.success(`Record deleted successfully`);

        // Close modal if open
        if (isViewModalOpen) {
          setIsViewModalOpen(false);
          setSelectedRecord(null);
        }
        if (showEditModal && editingRecord) {
          setShowEditModal(false);
          setEditingRecord(null);
        }
      } else {
        toast.error(response.data.message || "Failed to delete record");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error(error.response?.data?.message || "Failed to delete record");
    }
  };

  const viewRecordEnhanced = (record) => {
    // Load the record with all data
    setSelectedRecord({
      ...record,
      spcDataLoaded: false,
      pdiDataLoaded: false,
    });
    setIsViewModalOpen(true);
    setModalActiveTab("overview");
  };

  // Render action buttons for checkpoints in the table
  const renderCheckpointActions = (checkpointKey, index) => {
    return (
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => editCheckpointInProcess(checkpointKey, index)}
          className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          title="Edit checkpoint"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => deleteCheckpointFromProcess(checkpointKey, index)}
          className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition"
          title="Delete checkpoint"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // Render action buttons for processes in dropdown
  const renderProcessActions = (process) => {
    const processId = process.id || process._id;
    const isDrawingProcess = process.isDrawing || process.drawingId;

    return (
      <div className="flex items-center gap-1 ml-2">
        {isDrawingProcess ? (
          <>
            <button
              onClick={() =>
                editDrawingProcess(process.processName || process.name)
              }
              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition"
              title="Edit drawing process"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() =>
                deleteDrawingProcessHandler(process.processName || process.name)
              }
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition"
              title="Delete drawing process"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        ) : process.isCustom ? (
          <>
            <button
              onClick={() => editCustomProcess(process)}
              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition"
              title="Edit custom process"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => deleteCustomProcess(processId, process.name)}
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition"
              title="Delete custom process"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        ) : null}
      </div>
    );
  };

  // Rename drawing process via API
  const renameDrawingProcess = async (drawingId, oldName, newName) => {
    try {
      // First, get the current drawing's processes
      // We need to fetch the drawing first to get all processes
      const drawingResponse = await axios.get(
        `${API_URL}/folder/${drawingId}`,
        { withCredentials: true },
      );

      if (!drawingResponse.data.success) {
        throw new Error("Failed to fetch drawing");
      }

      const drawing = drawingResponse.data.drawing || drawingResponse.data.data;
      const processes = drawing.processes || [];

      // Update the process name in the processes array
      const updatedProcesses = processes.map((p) =>
        p.processName === oldName ? { ...p, processName: newName } : p,
      );

      // Send the updated processes array back to the server using the correct endpoint
      const response = await axios.put(
        `${API_URL}/qc-inspection/${drawingId}/process`,
        { processes: updatedProcesses },
        { withCredentials: true },
      );

      return response.data;
    } catch (error) {
      console.error("Error renaming drawing process:", error);
      throw error;
    }
  };

  // Delete drawing process via API
  const deleteDrawingProcessApi = async (drawingId, processName) => {
    try {
      const response = await axios.delete(
        `${API_URL}/qc-inspection/${drawingId}/process/${encodeURIComponent(processName)}`,
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting drawing process:", error);
      throw error;
    }
  };

  // Rename custom process via API
  const renameCustomProcess = async (processId, newName) => {
    try {
      const response = await axios.put(
        `${API_URL}/qc-inspection/process/${processId}`,
        { name: newName },
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      console.error("Error renaming custom process:", error);
      throw error;
    }
  };

  // Delete custom process via API
  const deleteCustomProcessApi = async (processId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/qc-inspection/process/${processId}`,
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting custom process:", error);
      throw error;
    }
  };
  // Handle editing process name - opens the modal
  const handleEditProcessClick = (process) => {
    setEditingProcessData({
      id: process.id || process._id || process.processName,
      name: process.name || process.processName,
      isDrawing: !!process.isDrawing || !!process.drawingId,
      drawingId: process.drawingId || selectedDrawing?._id,
      fullProcess: process,
    });
    setShowEditProcessModal(true);
  };

  // Save the renamed process - calls API
  // Save the renamed process - calls API - UPDATED
  const saveProcessName = async () => {
    if (!editingProcessData.name.trim()) {
      toast.error("Process name is required");
      return;
    }

    setIsRenamingProcess(true);

    try {
      if (editingProcessData.isDrawing) {
        // Update drawing process using the /:id/process endpoint
        const response = await renameDrawingProcess(
          editingProcessData.drawingId,
          editingProcessData.fullProcess.processName ||
            editingProcessData.fullProcess.name,
          editingProcessData.name.trim(),
        );

        if (response.success) {
          // Update local state for drawing processes
          const updatedProcesses = selectedDrawingProcesses.map((p) =>
            p.processName === editingProcessData.fullProcess.processName ||
            p.processName === editingProcessData.fullProcess.name
              ? { ...p, processName: editingProcessData.name.trim() }
              : p,
          );
          setSelectedDrawingProcesses(updatedProcesses);

          // Update selected process if it's the one being edited
          if (
            selectedProcess &&
            (selectedProcess.name ===
              editingProcessData.fullProcess.processName ||
              selectedProcess.name === editingProcessData.fullProcess.name)
          ) {
            setSelectedProcess({
              ...selectedProcess,
              name: editingProcessData.name.trim(),
            });
          }

          toast.success(
            `Process renamed to "${editingProcessData.name.trim()}"`,
          );
          setShowEditProcessModal(false);
          if (socket && socket.connected) {
            socket.emit("spc:data-changed", {
              action: "process-renamed",
              companyId: selectedCompany?._id || selectedCompany,
              processId: editingProcessData.id,
              oldName:
                editingProcessData.fullProcess.processName ||
                editingProcessData.fullProcess.name,
              newName: editingProcessData.name.trim(),
              timestamp: new Date().toISOString(),
            });
          }
          fetchDrawings(); // Refresh to get updated data
        } else {
          toast.error(response.message || "Failed to rename process");
        }
      } else {
        // Update custom process using /process/:id endpoint
        const response = await renameCustomProcess(
          editingProcessData.id,
          editingProcessData.name.trim(),
        );

        if (response.success) {
          // Update local state for custom processes
          const updatedProcesses = processes.map((p) =>
            p.id === editingProcessData.id || p._id === editingProcessData.id
              ? { ...p, name: editingProcessData.name.trim() }
              : p,
          );
          setProcesses(updatedProcesses);

          // Update selected process if it's the one being edited
          if (
            selectedProcess &&
            (selectedProcess.id === editingProcessData.id ||
              selectedProcess._id === editingProcessData.id)
          ) {
            setSelectedProcess({
              ...selectedProcess,
              name: editingProcessData.name.trim(),
            });
          }

          toast.success(
            `Process renamed to "${editingProcessData.name.trim()}"`,
          );
          setShowEditProcessModal(false);
          fetchProcesses(); // Refresh to get updated data
        } else {
          toast.error(response.message || "Failed to rename process");
        }
      }
    } catch (error) {
      console.error("Error renaming process:", error);
      toast.error(error.response?.data?.message || "Failed to rename process");
    } finally {
      setIsRenamingProcess(false);
    }
  };

  // Delete process with API call
  const deleteProcessWithApi = async () => {
    if (!editingProcessData.id) {
      toast.error("No process selected");
      return;
    }

    if (
      !window.confirm(
        `Delete process "${editingProcessData.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setIsRenamingProcess(true);

    try {
      if (editingProcessData.isDrawing) {
        // Delete drawing process using /:id/process/:processName endpoint
        const response = await deleteDrawingProcessApi(
          editingProcessData.drawingId,
          editingProcessData.fullProcess.processName ||
            editingProcessData.fullProcess.name,
        );

        if (response.success) {
          // Update local state
          const updatedProcesses = selectedDrawingProcesses.filter(
            (p) =>
              p.processName !== editingProcessData.fullProcess.processName &&
              p.processName !== editingProcessData.fullProcess.name,
          );
          setSelectedDrawingProcesses(updatedProcesses);

          if (
            selectedProcess &&
            (selectedProcess.name ===
              editingProcessData.fullProcess.processName ||
              selectedProcess.name === editingProcessData.fullProcess.name)
          ) {
            setSelectedProcess(null);
            setChecklistResults({});
            setMeasurementResults({});
            setChecklistRemarks({});
          }

          if (socket && socket.connected) {
            socket.emit("spc:data-changed", {
              action: "process-deleted",
              companyId: selectedCompany?._id || selectedCompany,
              processId: editingProcessData.id,
              processName: editingProcessData.name,
              drawingId: editingProcessData.drawingId,
              timestamp: new Date().toISOString(),
            });
          }
          toast.success(`Process "${editingProcessData.name}" deleted`);
          setShowEditProcessModal(false);
          fetchDrawings();
        } else {
          toast.error(response.message || "Failed to delete process");
        }
      } else {
        // Delete custom process using /process/:id endpoint
        const response = await deleteCustomProcessApi(editingProcessData.id);

        if (response.success) {
          // Update local state
          setProcesses((prev) =>
            prev.filter(
              (p) =>
                p.id !== editingProcessData.id &&
                p._id !== editingProcessData.id,
            ),
          );

          if (
            selectedProcess &&
            (selectedProcess.id === editingProcessData.id ||
              selectedProcess._id === editingProcessData.id)
          ) {
            setSelectedProcess(null);
            setChecklistResults({});
            setMeasurementResults({});
            setChecklistRemarks({});
          }

          toast.success(`Process "${editingProcessData.name}" deleted`);
          setShowEditProcessModal(false);
          fetchProcesses();
        } else {
          toast.error(response.message || "Failed to delete process");
        }
      }
    } catch (error) {
      console.error("Error deleting process:", error);
      toast.error(error.response?.data?.message || "Failed to delete process");
    } finally {
      setIsRenamingProcess(false);
    }
  };

  const buildProcessStreamKey = (process) => {
    return [
      normalizeRoomPart(process.companyId),
      normalizeRoomPart(process.itemId),
      normalizeRoomPart(process.id || process._id),
      normalizeRoomPart(process.name),
    ].join("::");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden   bg-blue-700 border-b border-blue-700/50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 shadow-xl">
          {/* Subtle ambient light effects for depth */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-3.5">
                <div className="bg-white/10 border border-white/20 rounded-2xl p-2.5 backdrop-blur-md shadow-inner shrink-0">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                    QC/MTC Report Management
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-blue-200 font-medium">
                    Quality inspection - Full access to create and manage
                    reports
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Status & Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Internet Connection Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-950/40 border border-blue-700/40 rounded-full backdrop-blur-md shadow-sm">
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-xs text-blue-100 font-medium">
                      Online
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-rose-300" />
                    <span className="text-xs text-blue-100 font-medium">
                      Offline
                    </span>
                  </>
                )}
              </div>

              {/* Socket Connection Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-950/40 border border-blue-700/40 rounded-full backdrop-blur-md shadow-sm">
                {socketStatus.isConnected ? (
                  <>
                    <div className="relative flex items-center">
                      <Signal className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    </div>
                    <span className="text-xs text-blue-100 font-medium">
                      Live
                      {socketStatus.transport && (
                        <span className="hidden sm:inline ml-1 text-blue-300 font-normal">
                          ({socketStatus.transport})
                        </span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <SignalZero className="w-3.5 h-3.5 text-rose-300" />
                    <span className="text-xs text-blue-100 font-medium">
                      Disconnected
                    </span>
                  </>
                )}
              </div>

              {/* Action Buttons Group */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* QC Guide Button */}
                <button
                  type="button"
                  onClick={() => setShowQCGuide(true)}
                  className="px-3.5 py-2 bg-blue-900/60 hover:bg-blue-900 text-white border border-blue-700/60 rounded-xl text-xs sm:text-sm font-semibold hover:border-blue-500/80 hover:shadow-md transition-all duration-200 flex items-center gap-2"
                >
                  <CircleHelp className="h-4 w-4 text-blue-300" />
                  QC Guide
                </button>

                {/* Q/A Button */}
                <Link
                  to="/qa/history"
                  className="px-3.5 py-2 bg-blue-900/60 hover:bg-blue-900 text-white border border-blue-700/60 rounded-xl text-xs sm:text-sm font-medium hover:border-blue-500/80 hover:shadow-md transition-all duration-200 flex items-center gap-2"
                >
                  <RotateCw className="h-4 w-4 text-blue-300" />
                  Q/A
                </Link>

                {/* SPC Dashboard Button */}
                <button
                  onClick={() => setShowSPCDashboardModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs sm:text-sm font-medium shadow-md shadow-emerald-900/20 hover:shadow-emerald-500/20 transition-all duration-200 flex items-center gap-2"
                >
                  <i className="fas fa-chart-line"></i>
                  SPC Dashboard
                </button>

                {/* Generate Report Button (Primary Accent) */}
                <Link
                  to="/generate/pdi-reports"
                  className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-900 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-950/30 hover:shadow-blue-950/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2"
                >
                  <i className="fas fa-file-invoice"></i>
                  Generate Report
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Stats Row */}
        <div
          data-guide="qc-overview"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Total Inspections
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {totalInspections}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <i className="fas fa-clipboard-list text-blue-600"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Passed
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {passedInspections}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <i className="fas fa-check-circle text-emerald-600"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Failed
                </p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {failedInspections}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <i className="fas fa-times-circle text-red-600"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Pass Rate
                </p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {passRate}%
                </p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <i className="fas fa-chart-line text-indigo-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Section */}
        <div
          data-guide="qc-selection"
          className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 mb-6"
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-slate-700">
              Select Inspection Parameters
            </h3>
            <div className="flex gap-2 flex-wrap">
              {/* Add Checkpoint Button using Enhanced Modal */}
              {selectedProcess && (
                <button
                  onClick={() => openEnhancedCheckpointModal()}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Checkpoint
                </button>
              )}

              {selectedDrawing && selectedDrawingProcesses.length === 0 && (
                <button
                  onClick={() => setShowCreateProcessModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Process
                </button>
              )}

              {selectedDrawing && selectedDrawingProcesses.length > 0 && (
                <button
                  onClick={() => setShowCreateProcessModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Process
                </button>
              )}

              {selectedDrawing && (
                <button
                  onClick={clearDrawingSelection}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Drawing
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            {/* Step 1: Company Dropdown */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  1
                </span>
                <i className="fas fa-building text-slate-400"></i>
                Company / Client
              </label>
              <select
                value={selectedCompany || ""}
                onChange={(e) => handleCompanySelect(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
              >
                <option value="">— Choose a Company —</option>
                {uniqueCompanies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Select the customer/client you're inspecting for
              </p>
            </div>

            {/* Step 2: Item Dropdown (Dependent on Step 1) */}
            <div className="space-y-1.5 opacity-90">
              <label
                className={`flex items-center gap-1.5 text-xs font-semibold ${!selectedCompany ? "text-slate-400" : "text-slate-700"}`}
              >
                <span
                  className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${!selectedCompany ? "bg-slate-200 text-slate-400" : "bg-blue-100 text-blue-700"}`}
                >
                  2
                </span>
                <i className="fas fa-cube text-slate-400"></i>
                Part / Product Name
              </label>

              <div className="relative">
                <div className="relative w-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${!selectedCompany ? "text-slate-300" : "text-slate-400"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                    />
                  </svg>

                  <input
                    type="text"
                    placeholder={
                      selectedCompany
                        ? "Search parts..."
                        : "Select a company first"
                    }
                    value={itemSearch}
                    onChange={(e) => {
                      setItemSearch(e.target.value);
                      setShowItemSuggestions(true);
                    }}
                    onFocus={() => setShowItemSuggestions(true)}
                    disabled={!selectedCompany}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 shadow-sm transition outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100/70 disabled:text-slate-400 disabled:border-slate-200"
                  />
                </div>

                {showItemSuggestions &&
                  itemSearch &&
                  filteredItems.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                      {filteredItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setItemSearch(item.name);
                            handleItemSelect(item.id);
                            setShowItemSuggestions(false);
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition"
                        >
                          <div className="font-medium text-sm text-slate-800">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-xs text-slate-500">
                              {item.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                {itemSearch && filteredItems.length === 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl p-3 text-sm text-slate-500">
                    No parts found
                  </div>
                )}
              </div>

              <select
                value={selectedItem?.id || ""}
                onChange={(e) => handleItemSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100/70 disabled:text-slate-400 disabled:border-slate-200"
                disabled={!selectedCompany}
              >
                <option value="">
                  {selectedCompany
                    ? "— Select a Part —"
                    : "— Select Company First —"}
                </option>
                {filteredItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}{" "}
                    {item.description ? ` - ${item.description}` : ""}
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-slate-500">
                Choose the part/component to inspect
              </p>
            </div>

            {/* Step 3: Drawing Selection (Dependent on Step 2) */}
            <div className="space-y-1.5 opacity-90">
              <label
                className={`flex items-center gap-1.5 text-xs font-semibold ${!selectedItem ? "text-slate-400" : "text-slate-700"}`}
              >
                <span
                  className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${!selectedItem ? "bg-slate-200 text-slate-400" : "bg-blue-100 text-blue-700"}`}
                >
                  3
                </span>
                <i className="fas fa-folder text-slate-400"></i>
                Drawing / Document
              </label>

              <div className="relative">
                {selectedDrawing ? (
                  <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center flex-shrink-0 border border-red-100">
                          <i className="fas fa-file-pdf text-red-600 text-base"></i>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {selectedDrawing.title}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 flex-wrap mt-0.5">
                            <span className="truncate max-w-[80px]">
                              {selectedDrawing.folderId?.name ||
                                "Uncategorized"}
                            </span>
                            <span>•</span>
                            <span>
                              {selectedDrawing.processes?.length || 0} proc
                            </span>
                            {selectedDrawing.drawingNumber && (
                              <>
                                <span>•</span>
                                <span className="font-mono bg-slate-100 px-1 rounded text-[10px]">
                                  #{selectedDrawing.drawingNumber}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDrawing(null);
                          setSelectedFolder(null);
                          setFolderDrawings([]);
                          setShowFolderDrawings(false);
                          setSelectedProcess(null);
                          setInspectionSource(null);
                          setChecklistResults({});
                          setMeasurementResults({});
                          setChecklistRemarks({});
                          setFolderSearch("");
                        }}
                        className="text-[11px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-1.5 py-0.5 rounded transition flex-shrink-0"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm ${!selectedItem ? "pointer-events-none select-none bg-slate-100/70 border-slate-200" : ""}`}
                  >
                    {/* Search Bar */}
                    <div className="relative border-b border-slate-200">
                      <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                      <input
                        type="text"
                        placeholder={
                          !selectedItem
                            ? "Select a part first..."
                            : showFolderDrawings
                              ? "Search drawings..."
                              : "Search folders..."
                        }
                        value={folderSearch}
                        onChange={(e) => {
                          setFolderSearch(e.target.value);
                          if (showFolderDrawings && e.target.value === "") {
                            const drawingsInFolder = drawings.filter(
                              (d) =>
                                (d.folderId?.name || "Uncategorized") ===
                                selectedFolder,
                            );
                            setFolderDrawings(drawingsInFolder);
                          }
                        }}
                        disabled={!selectedItem}
                        className="w-full pl-8 pr-7 py-1.5 text-xs text-slate-800 outline-none focus:ring-0 disabled:bg-transparent"
                      />
                      {folderSearch && (
                        <button
                          onClick={() => {
                            setFolderSearch("");
                            if (showFolderDrawings && selectedFolder) {
                              const drawingsInFolder = drawings.filter(
                                (d) =>
                                  (d.folderId?.name || "Uncategorized") ===
                                  selectedFolder,
                              );
                              setFolderDrawings(drawingsInFolder);
                            }
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                      {!selectedItem ? (
                        <div className="p-4 text-center text-slate-400 text-xs">
                          Please complete step 2 first
                        </div>
                      ) : !showFolderDrawings ? (
                        <div>
                          {drawings.length === 0 ? (
                            <div className="p-4 text-center text-slate-400">
                              <p className="text-xs">No drawings available</p>
                            </div>
                          ) : (
                            (() => {
                              const searchTerm = folderSearch.toLowerCase();
                              let filteredFolders = drawings
                                .filter((d) => {
                                  const folderName =
                                    d.folderId?.name || "Uncategorized";
                                  return (
                                    folderName
                                      .toLowerCase()
                                      .includes(searchTerm) ||
                                    d.title
                                      ?.toLowerCase()
                                      .includes(searchTerm) ||
                                    d.drawingNumber
                                      ?.toLowerCase()
                                      .includes(searchTerm)
                                  );
                                })
                                .reduce((acc, drawing) => {
                                  const folder =
                                    drawing.folderId?.name || "Uncategorized";
                                  if (!acc.find((f) => f.name === folder)) {
                                    acc.push({
                                      name: folder,
                                      count: drawings.filter(
                                        (d) =>
                                          (d.folderId?.name ||
                                            "Uncategorized") === folder,
                                      ).length,
                                    });
                                  }
                                  return acc;
                                }, []);

                              if (
                                filteredFolders.length === 0 &&
                                folderSearch
                              ) {
                                return (
                                  <div className="p-4 text-center text-slate-400 text-xs">
                                    No folders match "{folderSearch}"
                                  </div>
                                );
                              }

                              return filteredFolders.map((folder, index) => (
                                <div
                                  key={index}
                                  onClick={() => {
                                    setSelectedFolder(folder.name);
                                    setFolderDrawings(
                                      drawings.filter(
                                        (d) =>
                                          (d.folderId?.name ||
                                            "Uncategorized") === folder.name,
                                      ),
                                    );
                                    setShowFolderDrawings(true);
                                    setFolderSearch("");
                                  }}
                                  className="px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center justify-between transition group text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <i className="fas fa-folder text-amber-500 flex-shrink-0"></i>
                                    <div className="truncate font-medium text-slate-700">
                                      {folder.name}
                                      <span className="ml-1.5 text-[10px] text-slate-400 font-normal">
                                        ({folder.count})
                                      </span>
                                    </div>
                                  </div>
                                  <i className="fas fa-chevron-right text-[10px] text-slate-300 group-hover:text-blue-500 transition"></i>
                                </div>
                              ));
                            })()
                          )}
                        </div>
                      ) : (
                        <div>
                          {/* Folder Header */}
                          <div className="px-2 py-1 bg-slate-50 flex items-center justify-between sticky top-0 border-b border-slate-200 z-10 text-[11px]">
                            <button
                              onClick={() => {
                                setShowFolderDrawings(false);
                                setSelectedFolder(null);
                                setFolderDrawings([]);
                                setFolderSearch("");
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                            >
                              <i className="fas fa-arrow-left text-[9px]"></i>{" "}
                              Back
                            </button>
                            <span className="text-slate-600 font-medium truncate max-w-[120px]">
                              {selectedFolder}
                            </span>
                          </div>

                          {/* Drawing List */}
                          {(() => {
                            const searchTerm = folderSearch.toLowerCase();
                            let filteredDrawings = folderDrawings;

                            if (searchTerm) {
                              filteredDrawings = folderDrawings.filter(
                                (d) =>
                                  d.title?.toLowerCase().includes(searchTerm) ||
                                  d.drawingNumber
                                    ?.toLowerCase()
                                    .includes(searchTerm) ||
                                  d.description
                                    ?.toLowerCase()
                                    .includes(searchTerm),
                              );
                            }

                            if (filteredDrawings.length === 0) {
                              return (
                                <div className="p-4 text-center text-slate-400 text-xs">
                                  No drawings found
                                </div>
                              );
                            }

                            return filteredDrawings.map((drawing) => (
                              <div
                                key={drawing._id}
                                onClick={() => handleDrawingSelect(drawing._id)}
                                className="px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center justify-between transition group text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <i className="fas fa-file-pdf text-red-500 flex-shrink-0"></i>
                                  <div className="truncate text-slate-700 font-medium">
                                    {drawing.title || "Untitled"}
                                    {drawing.drawingNumber && (
                                      <span className="ml-1 text-[10px] text-slate-400 font-mono">
                                        (#{drawing.drawingNumber})
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <i className="fas fa-chevron-right text-[10px] text-slate-300 group-hover:text-blue-500 transition"></i>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Footer with counts */}
                    {!selectedDrawing &&
                      !showFolderDrawings &&
                      drawings.length > 0 && (
                        <div className="px-3 py-1 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between">
                          <span>{drawings.length} items</span>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Create Process Button */}
              {selectedDrawing && selectedDrawingProcesses.length === 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowCreateProcessModal(true)}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create First Process
                  </button>
                </div>
              )}
            </div>

            {/* Step 4: Process Dropdown WITH Edit/Delete buttons - FIXED */}
            <div className="space-y-1.5 opacity-90">
              <label
                className={`flex items-center gap-1.5 text-xs font-semibold ${!selectedDrawing ? "text-slate-400" : "text-slate-700"}`}
              >
                <span
                  className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${!selectedDrawing ? "bg-slate-200 text-slate-400" : "bg-blue-100 text-blue-700"}`}
                >
                  4
                </span>
                <i className="fas fa-tasks text-slate-400"></i>
                {selectedDrawing ? "Select Process" : "Inspection Method"}
              </label>

              {selectedDrawing ? (
                <div>
                  <select
                    value={selectedProcess?.name || ""}
                    onChange={(e) => handleDrawingProcessSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100/70 disabled:text-slate-400 disabled:border-slate-200"
                    disabled={selectedDrawingProcesses.length === 0}
                  >
                    <option value="">
                      {selectedDrawingProcesses.length === 0
                        ? "No processes available"
                        : "— Select a Process —"}
                    </option>
                    {selectedDrawingProcesses.map((process, index) => (
                      <option key={index} value={process.processName}>
                        {process.processName} (
                        {process.checkpoints?.length || 0} checkpoints)
                      </option>
                    ))}
                  </select>

                  {/* Process actions - Edit and Delete buttons for drawing processes */}
                  {selectedProcess && selectedDrawingProcesses.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          const process = selectedDrawingProcesses.find(
                            (p) => p.processName === selectedProcess.name,
                          );
                          if (process) {
                            handleEditProcessClick({
                              id: selectedProcess.name,
                              name: selectedProcess.name,
                              isDrawing: true,
                              drawingId: selectedDrawing?._id,
                              fullProcess: process,
                            });
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit Name
                      </button>
                      <button
                        onClick={() => {
                          const process = selectedDrawingProcesses.find(
                            (p) => p.processName === selectedProcess.name,
                          );
                          if (process) {
                            // Show confirmation alert first
                            if (
                              window.confirm(
                                `Are you sure you want to delete process "${selectedProcess.name}"? This action cannot be undone.`,
                              )
                            ) {
                              // Direct delete without opening modal
                              deleteDrawingProcessDirect(
                                selectedDrawing?._id,
                                process.processName,
                              );
                            }
                          }
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete Process
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <select
                    value={selectedProcess?.id || selectedProcess?._id || ""}
                    onChange={(e) => handleProcessSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100/70 disabled:text-slate-400 disabled:border-slate-200"
                    disabled={!selectedDrawing}
                  >
                    <option value="">
                      {selectedDrawing
                        ? "— Select Method —"
                        : "— Select Drawing First —"}
                    </option>
                    {processOptions.map((process) => (
                      <option
                        key={process.id || process._id}
                        value={process.id || process._id}
                      >
                        {process.name} ({process.checkpoints?.length || 0}{" "}
                        checkpoints)
                        {process.isCustom && " (Custom)"}
                      </option>
                    ))}
                  </select>

                  {/* Process actions - only for custom processes */}
                  {selectedProcess && selectedProcess.isCustom && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          handleEditProcessClick({
                            id: selectedProcess.id || selectedProcess._id,
                            name: selectedProcess.name,
                            isDrawing: false,
                            fullProcess: selectedProcess,
                          });
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit Name
                      </button>
                      <button
                        onClick={() => {
                          const processId =
                            selectedProcess.id || selectedProcess._id;
                          // Show confirmation alert first
                          if (
                            window.confirm(
                              `Are you sure you want to delete process "${selectedProcess.name}"? This action cannot be undone.`,
                            )
                          ) {
                            // Direct delete without opening modal
                            deleteCustomProcessDirect(
                              processId,
                              selectedProcess.name,
                            );
                          }
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete Process
                      </button>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[11px] text-slate-500">
                Select your specific inspection routing layout
              </p>
            </div>
          </div>

          {/* Current selection info */}
          {selectedCompany && selectedItem && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg flex-wrap">
              <i className="fas fa-info-circle text-blue-500"></i>
              <span>
                <strong>{selectedCompany}</strong> →{" "}
                <strong>{selectedItem.name}</strong>
                {selectedDrawing && (
                  <>
                    {" "}
                    →{" "}
                    <strong className="text-blue-600">
                      {selectedDrawing.title}
                    </strong>
                  </>
                )}
                {selectedProcess && (
                  <>
                    {" "}
                    →{" "}
                    <strong className="text-purple-600">
                      {selectedProcess.name}
                    </strong>
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px]">
                      {selectedProcess.checkpoints?.length || 0} Checkpoints
                    </span>
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Create Process Modal */}
        {showCreateProcessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-purple-600" />
                    {selectedDrawingProcesses.length === 0
                      ? "Create First Process"
                      : "Add Process"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedDrawing?.title} • Create an inspection process with
                    checkpoints
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateProcessModal(false);
                    setNewProcessName("");
                    setNewProcessCheckpoints([]);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Process Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Process Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProcessName}
                    onChange={(e) => setNewProcessName(e.target.value)}
                    placeholder="e.g., Laser Cutting Inspection"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>

                {/* Checkpoints */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Checkpoints <span className="text-red-500">*</span>
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        ({newProcessCheckpoints.length} added)
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEnhancedCheckpointModal(null, true)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm hover:bg-indigo-100 transition flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                  </div>

                  {newProcessCheckpoints.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                      <i className="fas fa-plus-circle text-3xl text-slate-300 mb-2"></i>
                      <p className="text-sm text-slate-500">
                        No checkpoints added yet
                      </p>
                      <p className="text-xs text-slate-400">
                        Click "Add Advanced" or "Quick Add" to create one
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                              #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                              Checkpoint
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                              Expected
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                              Unit
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                              Tolerance
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {newProcessCheckpoints.map((cp, index) => (
                            <tr
                              key={index}
                              className="hover:bg-slate-50 transition"
                            >
                              <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                                #{index + 1}
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-700">
                                {cp.name}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                    cp.type === "Measurement" ||
                                    cp.type === "measurement"
                                      ? "bg-blue-100 text-blue-700"
                                      : cp.type === "Visual" ||
                                          cp.type === "visual"
                                        ? "bg-purple-100 text-purple-700"
                                        : cp.type === "Approval" ||
                                            cp.type === "approval"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-orange-100 text-orange-700"
                                  }`}
                                >
                                  {cp.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {cp.expectedValue || "-"}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {cp.unit || "-"}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {cp.tolerance || "-"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setNewCheckpointData({
                                        name: cp.name,
                                        type: cp.type || "Measurement",
                                        expectedValue: cp.expectedValue || "",
                                        unit: cp.unit || "mm",
                                        tolerance: cp.tolerance || "",
                                      });
                                      setShowAddCheckpointModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                                    title="Edit checkpoint"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      removeNewProcessCheckpoint(index)
                                    }
                                    className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition"
                                    title="Remove checkpoint"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Process Summary */}
                {newProcessCheckpoints.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-info-circle text-purple-600"></i>
                      <div className="text-sm text-purple-700">
                        <strong>Process Summary:</strong> "
                        {newProcessName || "Unnamed"}" will have
                        <strong> {newProcessCheckpoints.length}</strong>{" "}
                        checkpoint
                        {newProcessCheckpoints.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateProcessModal(false);
                      setNewProcessName("");
                      setNewProcessCheckpoints([]);
                    }}
                    className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createDrawingProcess}
                    disabled={
                      !newProcessName.trim() ||
                      newProcessCheckpoints.length === 0 ||
                      loading
                    }
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-check"></i>
                    )}
                    {selectedDrawingProcesses.length === 0
                      ? "Create Process"
                      : "Add Process"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div
          data-guide="qc-tabs"
          className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-1 mb-6"
        >
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("inspection")}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "inspection"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200/50"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <i className="fas fa-pen mr-2"></i>
              New Inspection
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "history"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200/50"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <i className="fas fa-history mr-2"></i>
              History & Reports
            </button>
          </div>
        </div>

        {activeTab === "inspection" &&
          selectedProcess &&
          Object.keys(checklistResults).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="min-w-0 w-full">
                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-8 h-8 shrink-0 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-pen text-blue-600 text-sm"></i>
                    </span>

                    <span className="truncate">New Inspection Record</span>
                  </h3>

                  {/* Breadcrumbs */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 text-xs text-slate-500">
                    {/* Company */}
                    <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md max-w-full sm:max-w-xs">
                      <i className="fas fa-building text-slate-400 shrink-0"></i>
                      <span className="truncate">{selectedCompany}</span>
                    </span>

                    <span className="text-slate-300 hidden xs:inline">→</span>

                    {/* Item */}
                    <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md max-w-full sm:max-w-xs">
                      <i className="fas fa-cube text-slate-400 shrink-0"></i>
                      <span className="truncate">{selectedItem?.name}</span>
                    </span>

                    {/* Drawing */}
                    {selectedDrawing && (
                      <>
                        <span className="text-slate-300 hidden sm:inline">
                          →
                        </span>

                        <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md max-w-full sm:max-w-xs">
                          <i className="fas fa-file-pdf text-slate-400 shrink-0"></i>
                          <span className="truncate">
                            {selectedDrawing.title}
                          </span>
                        </span>
                      </>
                    )}

                    <span className="text-slate-300 hidden sm:inline">→</span>

                    {/* Process */}
                    <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md max-w-full sm:max-w-xs">
                      <i className="fas fa-tasks text-slate-400 shrink-0"></i>
                      <span className="truncate">{selectedProcess?.name}</span>
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div
                  data-guide="qc-identification"
                  className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      <i className="fas fa-clock text-slate-400 mr-1"></i>
                      Time Slot
                    </label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    >
                      {shiftTimings.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      <i className="fas fa-user text-slate-400 mr-1"></i>
                      Operator
                    </label>
                    <select
                      value={formData.inspector}
                      onChange={(e) =>
                        setFormData({ ...formData, inspector: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    >
                      {inspectors.map((inspector) => (
                        <option
                          key={inspector._id || inspector.id}
                          value={inspector.firstName || inspector.role}
                        >
                          {inspector.firstName} ({inspector.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      <i className="fas fa-microchip text-slate-400 mr-1"></i>
                      Machine
                    </label>
                    <input
                      type="text"
                      value={formData.machine}
                      onChange={(e) =>
                        setFormData({ ...formData, machine: e.target.value })
                      }
                      placeholder="Machine name/number"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      <i className="fas fa-ruler text-slate-400 mr-1"></i>
                      Batch Number
                    </label>
                    <input
                      type="text"
                      value={formData.batchNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          batchNumber: e.target.value,
                        })
                      }
                      placeholder="e.g., BATCH-0001"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      <i className="fas fa-hashtag text-slate-400 mr-1"></i>
                      Lot Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      placeholder="e.g., 100"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Tool / Mould
                    </label>
                    <input
                      type="text"
                      value={formData.toolNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, toolNumber: e.target.value })
                      }
                      placeholder="Tool or mould number"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Image Upload Section - ORIGINAL */}
                <div
                  data-guide="qc-evidence"
                  className="border-t border-slate-200 pt-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                      <i className="fas fa-image text-purple-600"></i>
                      Attachments & Images
                      <span className="text-xs font-normal text-slate-500 ml-2">
                        ({uploadedImages.length} uploaded)
                      </span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition flex items-center gap-1"
                    >
                      <i className="fas fa-upload"></i>
                      Upload Images
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                      {uploadedImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                            <img
                              src={image.data}
                              alt={image.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition shadow-sm opacity-0 group-hover:opacity-100"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                          <div className="text-[10px] text-slate-500 truncate mt-1 text-center">
                            {image.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadedImages.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                      <i className="fas fa-image text-3xl text-slate-300 mb-2"></i>
                      <p className="text-sm text-slate-500">
                        Click "Upload Images" to add photos or drawings
                      </p>
                      <p className="text-xs text-slate-400">
                        Supported formats: JPG, PNG, GIF, SVG
                      </p>
                    </div>
                  )}
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-slate-700 flex items-center gap-2">
                    <i className="fas fa-info-circle text-blue-600"></i>
                    {selectedProcess?.description || "Inspection process"}
                  </p>
                </div>

                {/* Checklist Table - ORIGINAL */}
                <div
                  data-guide="qc-checkpoints"
                  className="border-t border-slate-200 pt-5"
                >
                  <div className="w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* Left / Action */}
                      <div className="w-full sm:w-auto">
                        {selectedProcess && !isInspectionPlanLocked && (
                          <button
                            type="button"
                            onClick={() =>
                              openEnhancedCheckpointModal(null, false)
                            }
                            className="
            w-full sm:w-auto
            px-3 py-2 sm:py-1.5
            bg-blue-50 text-blue-700
            rounded-lg
            text-xs font-medium
            hover:bg-blue-100
            transition
            flex items-center justify-center sm:justify-start
            gap-1
          "
                          >
                            <Plus className="w-3.5 h-3.5 shrink-0" />
                            <span>Add Checkpoint</span>
                          </button>
                        )}
                      </div>

                      {/* Right / Status + Legend */}
                      <div className="flex flex-col xs:flex-row sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                        {/* Locked Plan Status */}
                        {isInspectionPlanLocked && (
                          <span
                            className="
            inline-flex items-center justify-center
            px-2.5 py-1.5
            rounded-lg
            bg-emerald-50 text-emerald-700
            border border-emerald-200
            text-[10px] font-medium
            text-center
            leading-tight
          "
                          >
                            <i className="fas fa-lock mr-1 shrink-0"></i>

                            <span>
                              {inspectionPlanStatus.toUpperCase()} PLAN
                              <span className="hidden sm:inline">
                                {" "}
                                — REQUIREMENTS LOCKED
                              </span>
                              <span className="sm:hidden"> — LOCKED</span>
                            </span>
                          </span>
                        )}

                        {/* Status Legend */}
                        <div
                          className="
          flex flex-wrap
          items-center
          justify-start sm:justify-end
          gap-x-3 gap-y-2
          text-[10px]
          px-1
        "
                        >
                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="text-slate-500">OK</span>
                          </span>

                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                            <span className="text-slate-500">Fail</span>
                          </span>

                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                            <span className="text-slate-500">N/A</span>
                          </span>

                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0"></span>
                            <span className="text-slate-500">Pending</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-300 overflow-auto">
                    <table className="w-full border-collapse text-sm text-center">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {[
                            "#",
                            "Characteristic",
                            "Requirement",
                            "Instrument",
                            "Sample Progress",
                            "Entry",
                            "Result",
                            "Evidence / Remarks",
                            "Actions",
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {(selectedProcess?.checkpoints || []).map(
                          (checkpoint, index) => {
                            const checkpointKey = getCheckpointKey(
                              checkpoint,
                              index,
                            );
                            const specification =
                              getCheckpointSpecification(checkpoint);
                            const progress = getCheckpointProgress(
                              checkpoint,
                              checkpointKey,
                              measurementResults,
                              checkpointMeasurements,
                            );
                            const configuredInstrument =
                              getConfiguredGaugeSnapshot(checkpoint, index);

                            return (
                              <tr
                                key={checkpointKey}
                                className={
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="border border-gray-300 px-3 py-2">
                                  #{index + 1}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-left min-w-[220px]">
                                  <div className="font-medium text-slate-800">
                                    {checkpoint.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-1">
                                    {checkpoint.drawingBalloonNumber
                                      ? `Balloon ${checkpoint.drawingBalloonNumber} • `
                                      : ""}
                                    {checkpoint.inspectionMethod ||
                                      checkpoint.type}
                                    {` • ${getCheckpointResultType(
                                      checkpoint,
                                    ).replaceAll("_", " ")}`}
                                  </div>
                                  {checkpoint.selectedSPCMethod &&
                                    checkpoint.selectedSPCMethod !==
                                      "No SPC" && (
                                      <div className="text-[10px] text-blue-600 mt-1">
                                        SPC: {checkpoint.selectedSPCMethod}
                                      </div>
                                    )}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 min-w-[190px]">
                                  <div className="font-medium text-slate-700">
                                    {getCheckpointRequirement(checkpoint)}
                                  </div>
                                  {isNumericCheckpoint(checkpoint) && (
                                    <div className="text-[10px] text-slate-500 mt-1">
                                      Allowed range: {specification.lsl ?? "—"}
                                      {" to "}
                                      {specification.usl ?? "—"}{" "}
                                      {specification.unit}
                                    </div>
                                  )}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 min-w-[150px]">
                                  <div className="text-xs font-medium text-slate-700">
                                    {checkpoint.instrumentType ||
                                      checkpoint.instrumentRequirements
                                        ?.instrumentType ||
                                      checkpoint.gaugeType ||
                                      "Not specified"}
                                  </div>
                                  {(checkpoint.minimumResolution ||
                                    checkpoint.instrumentRequirements
                                      ?.minimumResolution) && (
                                    <div className="text-[10px] text-slate-500">
                                      Resolution ≥{" "}
                                      {checkpoint.minimumResolution ||
                                        checkpoint.instrumentRequirements
                                          ?.minimumResolution}
                                    </div>
                                  )}
                                  {configuredInstrument && (
                                    <div className="text-[10px] text-emerald-600 mt-1">
                                      Configured: {configuredInstrument.name}
                                      {configuredInstrument.serialNumber
                                        ? ` • S/N ${configuredInstrument.serialNumber}`
                                        : ""}
                                    </div>
                                  )}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <div className="font-semibold text-slate-700">
                                    {progress.completed}/{progress.required}
                                  </div>
                                  <div className="w-24 h-1.5 bg-slate-100 rounded-full mx-auto mt-1 overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500"
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          (progress.completed /
                                            progress.required) *
                                            100,
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 min-w-[190px]">
                                  {renderCheckpointEntry(
                                    checkpoint,
                                    checkpointKey,
                                  )}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  {renderCheckpointResult(
                                    checkpoint,
                                    checkpointKey,
                                  )}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 min-w-[190px]">
                                  <input
                                    type="text"
                                    value={
                                      checklistRemarks[checkpointKey] || ""
                                    }
                                    onChange={(event) =>
                                      handleRemarkChange(
                                        checkpointKey,
                                        event.target.value,
                                      )
                                    }
                                    placeholder={
                                      checklistResults[checkpointKey] === "Fail"
                                        ? "Failure reason required"
                                        : "Add remarks..."
                                    }
                                    className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm"
                                  />
                                  {(checkpoint.mandatoryPhoto ||
                                    (checkpoint.mandatoryPhotoOnFailure &&
                                      checklistResults[checkpointKey] ===
                                        "Fail")) && (
                                    <div className="text-[10px] text-violet-600 mt-1">
                                      Photo evidence required
                                    </div>
                                  )}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openCheckpointEditModal(
                                          checkpointKey,
                                          index,
                                        )
                                      }
                                      className="text-blue-600 p-1.5 bg-blue-50 rounded-lg hover:bg-blue-100"
                                      title="Edit checkpoint"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteCheckpoint(checkpointKey)
                                      }
                                      className="text-red-600 p-1.5 bg-red-50 rounded-lg hover:bg-red-100"
                                      title="Delete checkpoint"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div
                  data-guide="qc-final-review"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-5"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      <i className="fas fa-sticky-note text-slate-400 mr-1"></i>
                      Notes / Observations
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows="2"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Additional observations..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      <i className="fas fa-flag text-slate-400 mr-1"></i>
                      Overall Status
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: "Pass", icon: "fa-check", color: "emerald" },
                        { value: "Fail", icon: "fa-times", color: "red" },
                        { value: "Pending", icon: "fa-clock", color: "yellow" },
                      ].map((status) => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, status: status.value })
                          }
                          className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all text-sm ${
                            formData.status === status.value
                              ? `bg-${status.color}-600 text-white shadow-md shadow-${status.color}-200/50`
                              : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <i className={`fas ${status.icon} mr-1`}></i>{" "}
                          {status.value}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  data-guide="qc-submit"
                  className="flex justify-end gap-3 border-t border-slate-200 pt-5"
                >
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all text-sm"
                  >
                    <i className="fas fa-undo mr-1"></i> Reset
                  </button>
                  <button
                    type="submit"
                    disabled={loading || isSubmitting}
                    className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all text-sm disabled:opacity-50"
                  >
                    {loading || isSubmitting ? (
                      <i className="fas fa-spinner fa-spin mr-1"></i>
                    ) : (
                      <i className="fas fa-save mr-1"></i>
                    )}
                    Submit Inspection
                  </button>
                </div>
              </form>
            </div>
          )}

        {activeTab === "inspection" && !selectedProcess && selectedItem && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
            <i className="fas fa-file-pdf text-5xl text-blue-500 mb-4"></i>
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Select a Drawing or Process to Start Inspection
            </h3>
            <p className="text-sm text-slate-400">
              Please select a drawing from the dropdown above or create a custom
              process to load inspection checkpoints.
            </p>
          </div>
        )}

        {activeTab === "inspection" && !selectedItem && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
            <i className="fas fa-clipboard-list text-5xl text-slate-300 mb-4"></i>
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              No Item Selected
            </h3>
            <p className="text-sm text-slate-400">
              Please select a Company and Item from the dropdowns above to start
              an inspection.
            </p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                  <span className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-history text-indigo-600 text-xs"></i>
                  </span>
                  Inspection History
                  <span className="text-xs font-normal text-slate-500 ml-2">
                    ({filteredRecords.length} records)
                  </span>
                </h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-44"
                    />
                  </div>
                  <select
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All">All Companies</option>
                    {uniqueCompanies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All">All Status</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 overflow-auto">
              <table className="w-full border-collapse text-sm text-center">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                      Date & Time
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                      Company
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                      Item
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                      Description
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                      Process
                    </th>

                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                      Status
                    </th>

                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                      Checkpoints
                    </th>

                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        <i className="fas fa-inbox text-3xl block mb-2 text-slate-300"></i>
                        <span className="text-sm">
                          {loading
                            ? "Loading..."
                            : "No inspection records found"}
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record, index) => {
                      const checkpointValues = Object.values(
                        record.checkpoints || {},
                      );
                      const passedCheckpoints = checkpointValues.filter(
                        (v) => v === "OK",
                      ).length;
                      const totalCheckpoints = checkpointValues.length;
                      const allPass =
                        passedCheckpoints === totalCheckpoints &&
                        totalCheckpoints > 0;
                      const hasImages =
                        record.images && record.images.length > 0;
                      const gaugeValues = Object.values(
                        record.gaugeResults || {},
                      );
                      const passedGauges = gaugeValues.filter(
                        (g) => g.value === "Pass",
                      ).length;
                      const totalGauges = gaugeValues.length;

                      return (
                        <tr
                          key={record._id || record.id || index}
                          className={`hover:bg-blue-50 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            {record.timestamp
                              ? new Date(record.timestamp).toLocaleString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: true,
                                  },
                                )
                              : "N/A"}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            {record.companyName || "N/A"}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            {record.itemName || "N/A"}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            {record.itemDescription || "N/A"}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            {record.processName || "N/A"}
                          </td>

                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                record.status === "Pass"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : record.status === "Fail"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {record.status || "Pending"}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                allPass
                                  ? "bg-emerald-100 text-emerald-700"
                                  : totalCheckpoints === 0
                                    ? "bg-slate-100 text-slate-500"
                                    : passedCheckpoints === 0
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {passedCheckpoints}/{totalCheckpoints || 0}
                            </span>
                          </td>

                          <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              {/* View Button */}
                              <button
                                onClick={() => viewRecord(record)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                              >
                                <Eye size={14} className="text-slate-500" />
                                View
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => editRecord(record)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors"
                              >
                                <Pencil size={14} className="text-blue-500" />
                                Edit
                              </button>

                              {/* Report Button */}
                              {/* <button
                                onClick={() => openReportSetup(record)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100 transition-colors"
                              >
                                <ClipboardMinus
                                  size={14}
                                  className="text-amber-500"
                                />
                                Spc report
                              </button> */}

                              <button
                                onClick={() => deleteRecord(record._id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors"
                              >
                                <Trash size={14} className="text-blue-500" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View Record Modal */}
        {isViewModalOpen && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden">
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-7xl w-full  overflow-y-auto">
                {/* Header with Gradient */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between z-20 flex-shrink-0">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <FileText size={24} className="text-blue-200" />
                      Inspection Record Details
                    </h2>
                    <p className="text-sm text-blue-100 mt-1">
                      {selectedRecord.reportNumber &&
                        ` • Report: ${selectedRecord.reportNumber}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Tabs Navigation */}
                <div className="sticky top-[73px] bg-white border-b border-slate-200 px-6 z-10">
                  <div className="flex gap-1 overflow-x-auto py-2">
                    {[
                      { id: "overview", label: "📋 Overview", icon: "📋" },
                      {
                        id: "checkpoints",
                        label: "✅ Checkpoints",
                        icon: "✅",
                      },

                      { id: "images", label: "🖼️ Images", icon: "🖼️" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setModalActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                          modalActiveTab === tab.id
                            ? "bg-blue-50 text-blue-700 shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* OVERVIEW TAB */}

                  {modalActiveTab === "overview" && (
                    <div className="w-full space-y-4 sm:space-y-6">
                      {/* Status Card */}
                      <div className="w-full rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                        <div className="flex flex-col gap-2 xs:flex-row xs:items-center xs:justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Status
                            </span>
                          </div>

                          <span
                            className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs sm:text-sm font-semibold
            ${
              selectedRecord.status?.toLowerCase() === "completed"
                ? "bg-emerald-100 text-emerald-700"
                : selectedRecord.status?.toLowerCase() === "failed"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
            }`}
                          >
                            {selectedRecord.status || "Pending"}
                          </span>
                        </div>
                      </div>

                      {/* Main Info Grid */}
                      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
                        {/* Company & Item */}
                        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                          <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Building2
                              size={16}
                              className="shrink-0 text-slate-400"
                            />
                            <span>Company & Item</span>
                          </h4>

                          <div className="space-y-3">
                            {/* Company Name */}
                            <div className="flex flex-col gap-1 border-b border-slate-100 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <span className="shrink-0 text-xs text-slate-500">
                                Company Name
                              </span>

                              <span className="min-w-0 break-words text-left text-sm font-medium text-slate-900 sm:text-right">
                                {selectedRecord.companyName || "N/A"}
                              </span>
                            </div>

                            {/* Item Name */}
                            <div className="flex flex-col gap-1 border-b border-slate-100 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <span className="shrink-0 text-xs text-slate-500">
                                Item Name
                              </span>

                              <span className="min-w-0 break-words text-left text-sm font-medium text-slate-900 sm:text-right">
                                {selectedRecord.itemName || "N/A"}
                              </span>
                            </div>

                            {/* Item Description */}
                            <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <span className="shrink-0 text-xs text-slate-500">
                                Item Description
                              </span>

                              <span className="min-w-0 break-words text-left text-sm font-medium leading-5 text-slate-900 sm:max-w-[65%] sm:text-right">
                                {selectedRecord.itemDescription || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Process & Timing */}
                        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                          <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Clock
                              size={16}
                              className="shrink-0 text-slate-400"
                            />
                            <span>Process & Timing</span>
                          </h4>

                          <div className="space-y-3">
                            {/* Process Name */}
                            <div className="flex flex-col gap-1 border-b border-slate-100 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <span className="shrink-0 text-xs text-slate-500">
                                Process Name
                              </span>

                              <span className="min-w-0 break-words text-left text-sm font-medium text-slate-900 sm:text-right">
                                {selectedRecord.processName || "N/A"}
                              </span>
                            </div>

                            {/* Time Slot */}
                            <div className="flex flex-col gap-1 border-b border-slate-100 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <span className="shrink-0 text-xs text-slate-500">
                                Time Slot
                              </span>

                              <span className="min-w-0 break-words text-left text-sm font-medium text-slate-900 sm:text-right">
                                {selectedRecord.timeSlot || "N/A"}
                              </span>
                            </div>

                            {/* Timestamp */}
                            <div className="flex flex-col gap-1 border-b border-slate-100 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <span className="shrink-0 text-xs text-slate-500">
                                Timestamp
                              </span>

                              <span className="min-w-0 break-words text-left text-sm font-medium text-slate-900 sm:text-right">
                                {selectedRecord.timestamp
                                  ? formatDate(selectedRecord.timestamp)
                                  : "N/A"}
                              </span>
                            </div>

                            {/* Batch Number */}
                            <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <span className="shrink-0 text-xs text-slate-500">
                                Batch Number
                              </span>

                              <span className="min-w-0 break-all text-left text-sm font-medium text-slate-900 sm:text-right">
                                {selectedRecord.batchNumber || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* CHECKPOINTS TAB */}
                  {modalActiveTab === "checkpoints" && (
                    <div className="space-y-6">
                      {selectedRecord.checkpoints &&
                      Object.keys(selectedRecord.checkpoints).length > 0 ? (
                        <>
                          {/* Summary Statistics Cards */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-2xl p-5 border border-emerald-200 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                    Passed
                                  </p>
                                  <p className="text-3xl font-bold text-emerald-700 mt-1">
                                    {
                                      Object.values(
                                        selectedRecord.checkpoints,
                                      ).filter(
                                        (v) => v === "OK" || v === "Pass",
                                      ).length
                                    }
                                  </p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-200/50 rounded-2xl flex items-center justify-center">
                                  <svg
                                    className="w-6 h-6 text-emerald-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <div className="mt-2 w-full bg-emerald-200 rounded-full h-1.5">
                                <div
                                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${(Object.values(selectedRecord.checkpoints).filter((v) => v === "OK" || v === "Pass").length / Object.keys(selectedRecord.checkpoints).length) * 100 || 0}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-red-50 to-red-100/70 rounded-2xl p-5 border border-red-200 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                                    Failed
                                  </p>
                                  <p className="text-3xl font-bold text-red-700 mt-1">
                                    {
                                      Object.values(
                                        selectedRecord.checkpoints,
                                      ).filter(
                                        (v) =>
                                          v !== "OK" &&
                                          v !== "Pass" &&
                                          v !== "N/A",
                                      ).length
                                    }
                                  </p>
                                </div>
                                <div className="w-12 h-12 bg-red-200/50 rounded-2xl flex items-center justify-center">
                                  <svg
                                    className="w-6 h-6 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 to-gray-100/70 rounded-2xl p-5 border border-gray-200 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    N/A
                                  </p>
                                  <p className="text-3xl font-bold text-gray-700 mt-1">
                                    {
                                      Object.values(
                                        selectedRecord.checkpoints,
                                      ).filter((v) => v === "N/A").length
                                    }
                                  </p>
                                </div>
                                <div className="w-12 h-12 bg-gray-200/50 rounded-2xl flex items-center justify-center">
                                  <svg
                                    className="w-6 h-6 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/70 rounded-2xl p-5 border border-blue-200 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                    Total
                                  </p>
                                  <p className="text-3xl font-bold text-blue-700 mt-1">
                                    {
                                      Object.keys(selectedRecord.checkpoints)
                                        .length
                                    }
                                  </p>
                                </div>
                                <div className="w-12 h-12 bg-blue-200/50 rounded-2xl flex items-center justify-center">
                                  <svg
                                    className="w-6 h-6 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Main Table */}
                          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                  <svg
                                    className="w-5 h-5 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                  </svg>
                                  Inspection Checkpoints
                                  <span className="ml-2 text-xs font-normal text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                                    {
                                      Object.keys(selectedRecord.checkpoints)
                                        .length
                                    }{" "}
                                    items
                                  </span>
                                </h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Pass
                                  </span>
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    Fail
                                  </span>
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                    N/A
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white border border-gray-300 overflow-auto">
                              <table className="w-full border-collapse text-sm text-center">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                  <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                      #
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                      Checkpoint
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                      Method
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                      Specification
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                      Result
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                      Status
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {(() => {
                                    // Build checkpoint data map
                                    const checkpointDataMap = new Map();

                                    // Helper to get checkpoint data
                                    const getCheckpointData = (
                                      checkpointId,
                                    ) => {
                                      const plan =
                                        selectedRecord.checkpointPlanSnapshot?.find(
                                          (p) =>
                                            (p._id ||
                                              p.id ||
                                              p.checkpointId) === checkpointId,
                                        );
                                      const measurement =
                                        selectedRecord.measurements?.[
                                          checkpointId
                                        ];
                                      const checkpointMeasurement =
                                        selectedRecord.checkpointMeasurements?.[
                                          checkpointId
                                        ];

                                      return {
                                        name:
                                          checkpointMeasurement?.checkpointName ||
                                          measurement?.name ||
                                          plan?.name ||
                                          checkpointId,
                                        method:
                                          checkpointMeasurement?.inspectionMethod ||
                                          measurement?.method ||
                                          plan?.inspectionMethod ||
                                          "visual",
                                        expected:
                                          checkpointMeasurement?.expected ??
                                          measurement?.expected ??
                                          plan?.nominalValue ??
                                          plan?.expected ??
                                          "-",
                                        measured:
                                          checkpointMeasurement?.measured ??
                                          measurement?.measured ??
                                          "-",
                                        lsl:
                                          checkpointMeasurement?.lsl ??
                                          measurement?.lsl ??
                                          plan?.lowerSpecLimit ??
                                          plan?.lsl ??
                                          "-",
                                        usl:
                                          checkpointMeasurement?.usl ??
                                          measurement?.usl ??
                                          plan?.upperSpecLimit ??
                                          plan?.usl ??
                                          "-",
                                        unit:
                                          checkpointMeasurement?.unit ||
                                          measurement?.unit ||
                                          plan?.unit ||
                                          "",
                                        status:
                                          checkpointMeasurement?.specificationStatus ||
                                          measurement?.status ||
                                          "-",
                                        deviation:
                                          checkpointMeasurement?.deviation ??
                                          measurement?.deviation ??
                                          null,
                                        resultReason:
                                          checkpointMeasurement?.resultReason ||
                                          measurement?.resultReason ||
                                          "",
                                        statistics:
                                          checkpointMeasurement?.statistics ||
                                          {},
                                        pieceValues:
                                          checkpointMeasurement?.pieceValues ||
                                          [],
                                        rawReadings:
                                          checkpointMeasurement?.rawReadings ||
                                          [],
                                        criticality:
                                          plan?.criticality || "standard",
                                        resultType:
                                          checkpointMeasurement?.resultType ||
                                          plan?.resultType ||
                                          "numeric",
                                        sampleSize:
                                          checkpointMeasurement?.statistics
                                            ?.sampleSize ||
                                          plan?.piecesPerInspection ||
                                          1,
                                      };
                                    };

                                    let index = 0;
                                    return Object.entries(
                                      selectedRecord.checkpoints,
                                    ).map(([checkpointId, status]) => {
                                      index++;
                                      const data =
                                        getCheckpointData(checkpointId);
                                      const isPass =
                                        status === "OK" || status === "Pass";
                                      const isNA = status === "N/A";
                                      const detailId = `cp-detail-${index}`;

                                      // Format specification display
                                      let specDisplay = data.expected;
                                      if (data.expected !== "-" && data.unit)
                                        specDisplay += ` ${data.unit}`;
                                      if (
                                        data.lsl !== "-" &&
                                        data.usl !== "-"
                                      ) {
                                        specDisplay = `${data.lsl} – ${data.usl} ${data.unit}`;
                                      } else if (data.lsl !== "-") {
                                        specDisplay = `≥ ${data.lsl} ${data.unit}`;
                                      } else if (data.usl !== "-") {
                                        specDisplay = `≤ ${data.usl} ${data.unit}`;
                                      }

                                      // Format result display
                                      let resultDisplay = data.measured;
                                      if (data.measured !== "-" && data.unit)
                                        resultDisplay += ` ${data.unit}`;
                                      if (
                                        data.deviation !== null &&
                                        data.deviation !== undefined &&
                                        data.deviation !== "-"
                                      ) {
                                        const devValue =
                                          typeof data.deviation === "number"
                                            ? data.deviation.toFixed(3)
                                            : data.deviation;
                                        resultDisplay += ` (${devValue})`;
                                      }

                                      return (
                                        <React.Fragment key={checkpointId}>
                                          {/* Main Row */}
                                          <tr className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                              #{String(index).padStart(2, "0")}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-800">
                                                  {data.name}
                                                </span>
                                                {data.criticality &&
                                                  data.criticality !==
                                                    "standard" && (
                                                    <span
                                                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                                        data.criticality ===
                                                          "critical" ||
                                                        data.criticality ===
                                                          "safety"
                                                          ? "bg-red-100 text-red-700"
                                                          : "bg-orange-100 text-orange-700"
                                                      }`}
                                                    >
                                                      {data.criticality}
                                                    </span>
                                                  )}
                                                {data.sampleSize > 1 && (
                                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                                    n={data.sampleSize}
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                              <span className="text-sm text-slate-600 capitalize">
                                                {data.method.replace(/_/g, " ")}
                                              </span>
                                              <span className="block text-[10px] text-slate-400 mt-0.5">
                                                {data.resultType.replace(
                                                  /_/g,
                                                  " ",
                                                )}
                                              </span>
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                              <span className="text-sm text-slate-600 font-mono">
                                                {specDisplay}
                                              </span>
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                              <span
                                                className={`text-sm font-mono ${
                                                  isPass
                                                    ? "text-emerald-700"
                                                    : isNA
                                                      ? "text-slate-400"
                                                      : "text-red-700"
                                                }`}
                                              >
                                                {formatMeasureValue(
                                                  data.measured,
                                                  data.unit,
                                                  data.deviation,
                                                )}
                                              </span>
                                              {data.resultReason && (
                                                <span className="block text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                                                  {data.resultReason}
                                                </span>
                                              )}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                              <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                                                  isPass
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : isNA
                                                      ? "bg-gray-100 text-gray-600"
                                                      : "bg-red-100 text-red-700"
                                                }`}
                                              >
                                                <span
                                                  className={`w-1.5 h-1.5 rounded-full ${
                                                    isPass
                                                      ? "bg-emerald-500"
                                                      : isNA
                                                        ? "bg-gray-400"
                                                        : "bg-red-500"
                                                  }`}
                                                />
                                                {status}
                                              </span>
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                                              <button
                                                onClick={() => {
                                                  const element =
                                                    document.getElementById(
                                                      detailId,
                                                    );
                                                  if (element) {
                                                    element.style.display =
                                                      element.style.display ===
                                                      "none"
                                                        ? ""
                                                        : "none";
                                                  }
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                              >
                                                <svg
                                                  className="w-3.5 h-3.5"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                  />
                                                </svg>
                                                Details
                                              </button>
                                            </td>
                                          </tr>

                                          {/* Expanded Details Row */}
                                          <tr
                                            id={detailId}
                                            style={{ display: "none" }}
                                          >
                                            <td
                                              colSpan="7"
                                              className="border border-gray-300 px-3 py-2 align-middle text-center"
                                            >
                                              <div className="mx-4 mb-4 mt-1 p-5 bg-gradient-to-br from-slate-50/90 to-slate-100/50 rounded-xl border border-slate-200">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                  {/* Basic Info */}
                                                  <div>
                                                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                      Basic Information
                                                    </h5>
                                                    <dl className="space-y-1.5 text-sm">
                                                      <div className="flex justify-between">
                                                        <dt className="text-slate-500">
                                                          Type
                                                        </dt>
                                                        <dd className="capitalize text-slate-700">
                                                          {data.resultType ||
                                                            "N/A"}
                                                        </dd>
                                                      </div>
                                                      <div className="flex justify-between">
                                                        <dt className="text-slate-500">
                                                          Criticality
                                                        </dt>
                                                        <dd
                                                          className={`capitalize font-medium ${
                                                            data.criticality ===
                                                              "critical" ||
                                                            data.criticality ===
                                                              "safety"
                                                              ? "text-red-600"
                                                              : data.criticality ===
                                                                  "major"
                                                                ? "text-orange-600"
                                                                : "text-slate-600"
                                                          }`}
                                                        >
                                                          {data.criticality ||
                                                            "standard"}
                                                        </dd>
                                                      </div>
                                                    </dl>
                                                  </div>

                                                  {/* Specification */}
                                                  <div>
                                                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                      Specification
                                                    </h5>
                                                    <dl className="space-y-1.5 text-sm">
                                                      <div className="flex justify-between">
                                                        <dt className="text-slate-500">
                                                          Nominal
                                                        </dt>
                                                        <dd className="font-mono text-slate-700">
                                                          {data.expected}
                                                        </dd>
                                                      </div>
                                                      <div className="flex justify-between">
                                                        <dt className="text-slate-500">
                                                          LSL / USL
                                                        </dt>
                                                        <dd className="font-mono text-slate-700">
                                                          {data.lsl !== "-" &&
                                                          data.usl !== "-"
                                                            ? `${data.lsl} / ${data.usl}`
                                                            : "N/A"}
                                                        </dd>
                                                      </div>
                                                      <div className="flex justify-between">
                                                        <dt className="text-slate-500">
                                                          Unit
                                                        </dt>
                                                        <dd className="text-slate-700">
                                                          {data.unit || "N/A"}
                                                        </dd>
                                                      </div>
                                                    </dl>
                                                  </div>

                                                  {/* Statistics */}
                                                  {data.statistics &&
                                                    Object.keys(data.statistics)
                                                      .length > 0 && (
                                                      <div>
                                                        <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                          Statistics
                                                        </h5>
                                                        <dl className="space-y-1.5 text-sm">
                                                          <div className="flex justify-between">
                                                            <dt className="text-slate-500">
                                                              Sample Size
                                                            </dt>
                                                            <dd className="text-slate-700">
                                                              {data.statistics
                                                                .sampleSize ||
                                                                "N/A"}
                                                            </dd>
                                                          </div>
                                                          <div className="flex justify-between">
                                                            <dt className="text-slate-500">
                                                              Mean
                                                            </dt>
                                                            <dd className="font-mono text-slate-700">
                                                              {data.statistics.mean?.toFixed(
                                                                3,
                                                              ) || "N/A"}
                                                            </dd>
                                                          </div>
                                                          <div className="flex justify-between">
                                                            <dt className="text-slate-500">
                                                              Std Dev
                                                            </dt>
                                                            <dd className="font-mono text-slate-700">
                                                              {data.statistics.stdDev?.toFixed(
                                                                3,
                                                              ) || "N/A"}
                                                            </dd>
                                                          </div>
                                                        </dl>
                                                      </div>
                                                    )}

                                                  {/* Status */}
                                                  <div>
                                                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                      Status
                                                    </h5>
                                                    <dl className="space-y-1.5 text-sm">
                                                      <div className="flex justify-between">
                                                        <dt className="text-slate-500">
                                                          Result
                                                        </dt>
                                                        <dd
                                                          className={`font-medium ${
                                                            isPass
                                                              ? "text-emerald-600"
                                                              : isNA
                                                                ? "text-slate-500"
                                                                : "text-red-600"
                                                          }`}
                                                        >
                                                          {status}
                                                        </dd>
                                                      </div>
                                                      <div className="flex justify-between">
                                                        <dt className="text-slate-500">
                                                          Deviation
                                                        </dt>
                                                        <dd className="font-mono text-slate-700">
                                                          {data.deviation !==
                                                            null &&
                                                          data.deviation !==
                                                            undefined &&
                                                          data.deviation !== "-"
                                                            ? data.deviation.toFixed?.(
                                                                3,
                                                              ) ||
                                                              data.deviation
                                                            : "N/A"}
                                                        </dd>
                                                      </div>
                                                      {data.resultReason && (
                                                        <div className="flex flex-col gap-0.5">
                                                          <dt className="text-slate-500">
                                                            Reason
                                                          </dt>
                                                          <dd className="text-xs text-slate-600 bg-white/50 rounded px-2 py-1">
                                                            {data.resultReason}
                                                          </dd>
                                                        </div>
                                                      )}
                                                    </dl>
                                                  </div>
                                                </div>

                                                {/* Piece Values */}
                                                {(data.pieceValues?.length >
                                                  0 ||
                                                  data.rawReadings?.length >
                                                    0) && (
                                                  <div className="mt-4 pt-4 border-t border-slate-200">
                                                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                      Piece Values
                                                    </h5>
                                                    <div className="flex flex-wrap gap-1.5">
                                                      {(
                                                        data.pieceValues || []
                                                      ).map((piece, idx) => (
                                                        <span
                                                          key={idx}
                                                          className={`px-2.5 py-1 rounded-lg text-xs font-mono ${
                                                            piece.pass
                                                              ? "bg-emerald-100 text-emerald-700"
                                                              : "bg-red-100 text-red-700"
                                                          }`}
                                                        >
                                                          P
                                                          {piece.pieceNumber ||
                                                            idx + 1}
                                                          :{" "}
                                                          {piece.value?.toFixed?.(
                                                            3,
                                                          ) ||
                                                            piece.value ||
                                                            "N/A"}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        </React.Fragment>
                                      );
                                    });
                                  })()}
                                </tbody>
                              </table>
                            </div>

                            {/* Table Footer */}
                            <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between">
                              <span className="text-xs text-slate-500">
                                Showing{" "}
                                {Object.keys(selectedRecord.checkpoints).length}{" "}
                                checkpoints
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  {
                                    Object.values(
                                      selectedRecord.checkpoints,
                                    ).filter((v) => v === "OK" || v === "Pass")
                                      .length
                                  }{" "}
                                  Pass
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  {
                                    Object.values(
                                      selectedRecord.checkpoints,
                                    ).filter(
                                      (v) =>
                                        v !== "OK" &&
                                        v !== "Pass" &&
                                        v !== "N/A",
                                    ).length
                                  }{" "}
                                  Fail
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-16 bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200">
                          <svg
                            className="w-16 h-16 mx-auto text-slate-300 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          <p className="text-sm font-medium text-slate-500">
                            No checkpoint data available
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            This inspection record has no associated checkpoints
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* IMAGES TAB */}
                  {modalActiveTab === "images" && (
                    <div className="space-y-4">
                      {selectedRecord.images &&
                      selectedRecord.images.length > 0 ? (
                        <>
                          <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-sm text-slate-600">
                              Total Images:{" "}
                              <span className="font-bold text-slate-900">
                                {selectedRecord.images.length}
                              </span>
                            </p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {selectedRecord.images.map((img, idx) => (
                              <div
                                key={idx}
                                className="group relative bg-slate-50 rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow"
                              >
                                <img
                                  src={img.data || img.url || img}
                                  alt={img.name || `Image ${idx + 1}`}
                                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                                  <p className="text-xs text-white font-medium truncate">
                                    {img.name || `Image ${idx + 1}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12 text-slate-500">
                          <ImageIcon
                            size={48}
                            className="mx-auto mb-3 text-slate-300"
                          />
                          <p>No images attached</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsViewModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QC Report Modal */}
        {showReportSetupModal && reportSourceRecord && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Generate Customer PDI & SPC Report
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    All checkpoint documents from the same inspection run will
                    be combined. Select the one critical numeric checkpoint to
                    display in the combined I-MR or X-bar R graph.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportSetupModal(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-400">
                      Item
                    </div>
                    <div className="font-semibold text-slate-800">
                      {reportSourceRecord.itemCode ||
                        reportSourceRecord.itemName ||
                        "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-400">
                      Batch / Lot
                    </div>
                    <div className="font-semibold text-slate-800">
                      {reportSourceRecord.batchNumber || "-"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Critical checkpoint for Section C graph
                </label>
                {reportCheckpointOptions.length > 0 ? (
                  <select
                    value={selectedCriticalCheckpointId}
                    onChange={(event) =>
                      setSelectedCriticalCheckpointId(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {reportCheckpointOptions.map((option) => (
                      <option
                        key={option.checkpointId}
                        value={option.checkpointId}
                      >
                        {option.label} — {option.spcMethod}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    No numeric checkpoint is available for a control chart. The
                    report can still be generated without Section C data.
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportSetupModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={generateQCReport}
                  disabled={isGeneratingCustomerReport}
                  className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeneratingCustomerReport
                    ? "Generating..."
                    : "Generate Report"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* One-page customer-facing PDI + SPC assurance report. */}
        {showReportModal &&
          selectedRecordForReport &&
          (() => {
            const report = selectedRecordForReport;
            const header = report.header || {};
            const pdiRows = report.pdi?.rows || [];
            const spcRows = report.spc?.rows || [];
            const isReleased = isAcceptedRecommendation(
              report.finalDisposition?.recommendation,
              report.finalDisposition?.status,
            );

            return (
              <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm print:bg-white print:p-0">
                <style>{`
                  @page { size: A4 portrait; margin: 7mm; }
                  @media print {
                    body * { visibility: hidden !important; }
                    #customer-pdi-spc-report,
                    #customer-pdi-spc-report * { visibility: visible !important; }
                    #customer-pdi-spc-report {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      min-height: auto !important;
                      box-shadow: none !important;
                      margin: 0 !important;
                    }
                    .customer-report-print-hidden { display: none !important; }
                  }
                `}</style>

                <div className="customer-report-print-hidden sticky top-0 z-10 mx-auto mb-3 flex max-w-[210mm] items-center justify-between rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {report.reportNumber}
                    </div>
                    <div className="text-xs text-slate-500">
                      Critical graph:{" "}
                      {report.selectedControlChart?.checkpointName ||
                        "No graph data"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        closeCustomerReport();
                        setShowReportSetupModal(true);
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Change Critical Checkpoint
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                    >
                      Print / Save PDF
                    </button>
                    <button
                      type="button"
                      onClick={closeCustomerReport}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div
                  id="customer-pdi-spc-report"
                  className="mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-[7mm] py-[6mm] text-[9px] leading-tight text-slate-800 shadow-2xl print:min-h-0 print:max-w-none print:px-0 print:py-0 print:shadow-none"
                >
                  <div className="relative border-b border-slate-300 pb-2 text-center">
                    <div className="pr-[32mm] text-[22px] font-black leading-[1.05] tracking-wide text-[#173f68]">
                      FINAL PDI & SPC PROCESS ASSURANCE REPORT
                    </div>
                    <div className="mt-1 pr-[32mm] text-[10px] text-slate-500">
                      Customer-facing release certificate supported by
                      continuous SPC monitoring
                    </div>
                    <div
                      className={`absolute right-0 top-0 flex h-[22mm] w-[30mm] items-center justify-center border-2 text-[14px] font-black ${
                        isReleased
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-red-600 bg-red-50 text-red-700"
                      }`}
                    >
                      {formatRecommendation(
                        report.finalDisposition?.recommendation,
                      )}
                    </div>
                  </div>

                  <table className="mt-2 w-full table-fixed border-collapse">
                    <tbody>
                      <tr>
                        <td className="w-[11%] border border-slate-300 bg-slate-100 p-1 font-semibold">
                          Report No.
                        </td>
                        <td className="w-[25%] border border-slate-300 p-1">
                          {report.reportNumber || "-"}
                        </td>
                        <td className="w-[12%] border border-slate-300 bg-slate-100 p-1 font-semibold">
                          Inspection Date
                        </td>
                        <td className="w-[15%] border border-slate-300 p-1">
                          {header.inspectionDate || "-"}
                        </td>
                        <td className="w-[11%] border border-slate-300 bg-slate-100 p-1 font-semibold">
                          Inspector
                        </td>
                        <td className="border border-slate-300 p-1">
                          {header.inspector || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 bg-slate-100 p-1 font-semibold">
                          Customer
                        </td>
                        <td className="border border-slate-300 p-1">
                          {header.customer || "-"}
                        </td>
                        <td className="border border-slate-300 bg-slate-100 p-1 font-semibold">
                          Batch / Lot
                        </td>
                        <td className="border border-slate-300 p-1">
                          {header.batchNumber || "-"}
                        </td>
                        <td className="border border-slate-300 bg-slate-100 p-1 font-semibold">
                          Lot Quantity
                        </td>
                        <td className="border border-slate-300 p-1">
                          {header.lotQuantity ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 bg-slate-100 p-1 font-semibold">
                          Item Code
                        </td>
                        <td className="border border-slate-300 p-1">
                          {header.itemCode || "-"}
                        </td>
                        <td className="border border-slate-300 bg-slate-100 p-1 font-semibold">
                          Description
                        </td>
                        <td className="border border-slate-300 p-1">
                          {header.description || header.itemName || "-"}
                        </td>
                        <td className="border border-slate-300 bg-slate-100 p-1 font-semibold">
                          Time Slot
                        </td>
                        <td className="border border-slate-300 p-1">
                          {header.timeSlot || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 bg-slate-100 p-1 font-semibold">
                          Drawing
                        </td>
                        <td className="border border-slate-300 p-1">
                          {header.drawing || "-"}
                        </td>
                        <td className="border border-slate-300 bg-slate-100 p-1 font-semibold">
                          Revision
                        </td>
                        <td className="border border-slate-300 p-1">
                          {header.revision || "-"}
                        </td>
                        <td className="border border-slate-300 bg-slate-100 p-1 font-semibold">
                          Frequency
                        </td>
                        <td className="border border-slate-300 p-1">
                          {header.frequency || "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-2 text-[13px] font-black tracking-wide text-[#173f68]">
                    A. FINAL PDI RESULTS - CURRENT LOT
                  </div>
                  <table className="mt-1 w-full table-fixed border-collapse">
                    <thead>
                      <tr className="bg-[#e8f0f7] font-bold">
                        {/* <th className="w-[8%] border border-slate-300 p-1">
                          Balloon
                        </th> */}
                        <th className="w-[17%] border border-slate-300 p-1 text-left">
                          Characteristic
                        </th>
                        <th className="w-[23%] border border-slate-300 p-1 text-left">
                          Specification
                        </th>
                        <th className="w-[34%] border border-slate-300 p-1 text-left">
                          Five PDI sample results
                        </th>
                        <th className="w-[10%] border border-slate-300 p-1">
                          Average
                        </th>
                        <th className="w-[8%] border border-slate-300 p-1">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pdiRows.map((row) => (
                        <tr key={row.checkpointId}>
                          {/* <td className="border border-slate-300 p-1 text-center">
                            {row.balloon}
                          </td> */}
                          <td className="border border-slate-300 p-1">
                            {row.characteristic}
                          </td>
                          <td className="border border-slate-300 p-1">
                            {row.specification}
                          </td>
                          <td className="border border-slate-300 p-1">
                            {(row.sampleResults || []).length > 0
                              ? row.sampleResults
                                  .map((value) =>
                                    row.resultType === "numeric"
                                      ? formatCustomerReportValue(
                                          value,
                                          row.precision ?? 3,
                                        )
                                      : String(value),
                                  )
                                  .join(", ")
                              : "-"}
                          </td>
                          <td className="border border-slate-300 p-1 text-center">
                            {row.resultType === "numeric"
                              ? formatCustomerReportValue(
                                  row.average,
                                  row.precision ?? 3,
                                )
                              : "-"}
                          </td>
                          <td
                            className={`border border-slate-300 p-1 text-center font-black ${
                              row.result === "Pass"
                                ? "text-emerald-700"
                                : row.result === "N/A"
                                  ? "text-slate-500"
                                  : "text-red-700"
                            }`}
                          >
                            {String(row.result || "Pending").toUpperCase()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-2 text-[13px] font-black tracking-wide text-[#173f68]">
                    B. SPC PROCESS ASSURANCE - HISTORICAL PRODUCTION EVIDENCE
                  </div>
                  <div className="mt-1 border border-slate-500 p-1.5 text-[9px]">
                    <span className="font-semibold">
                      SPC assurance statement:{" "}
                    </span>
                    {report.spc?.assuranceStatement}
                  </div>

                  <div className="mt-1 grid grid-cols-5 border border-slate-300 bg-[#e8f0f7] text-center">
                    {[
                      [
                        report.spc?.monitoredCharacteristics ?? 0,
                        "Monitored characteristics",
                      ],
                      [
                        report.spc?.readingsAnalyzed ?? 0,
                        "Readings / pieces analysed",
                      ],
                      [
                        report.spc?.rationalSubgroups ?? 0,
                        "Rational subgroups",
                      ],
                      [
                        report.spc?.unresolvedEvents ?? 0,
                        "Unresolved SPC events",
                      ],
                      [
                        report.spc?.releaseRecommendation || "HOLD",
                        "Release recommendation",
                      ],
                    ].map(([value, label], index) => (
                      <div
                        key={label}
                        className={`p-1.5 ${index < 4 ? "border-r border-slate-300" : ""}`}
                      >
                        <div
                          className={`text-[12px] font-black ${
                            index === 4
                              ? value === "PASS"
                                ? "text-emerald-700"
                                : "text-red-700"
                              : "text-slate-800"
                          }`}
                        >
                          {value}
                        </div>
                        <div>{label}</div>
                      </div>
                    ))}
                  </div>

                  <table className="mt-1 w-full table-fixed border-collapse">
                    <thead>
                      <tr className="bg-[#e8f0f7] font-bold">
                        {/* <th className="w-[8%] border border-slate-300 p-1">
                          Balloon
                        </th> */}
                        <th className="w-[19%] border border-slate-300 p-1 text-left">
                          Characteristic
                        </th>
                        <th className="w-[15%] border border-slate-300 p-1">
                          SPC method
                        </th>
                        <th className="w-[17%] border border-slate-300 p-1">
                          Subgroups / data
                        </th>
                        <th className="w-[14%] border border-slate-300 p-1">
                          Stability
                        </th>
                        <th className="w-[8%] border border-slate-300 p-1">
                          Cpk
                        </th>
                        <th className="w-[7%] border border-slate-300 p-1">
                          OOC
                        </th>
                        <th className="border border-slate-300 p-1">
                          Assessment
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {spcRows.map((row) => (
                        <tr key={row.checkpointId}>
                          {/* <td className="border border-slate-300 p-1 text-center">
                            {row.balloon}
                          </td> */}
                          <td className="border border-slate-300 p-1">
                            {row.characteristic}
                          </td>
                          <td className="border border-slate-300 p-1 text-center">
                            {row.spcMethod}
                          </td>
                          <td className="border border-slate-300 p-1 text-center">
                            {row.subgroupCount} / {row.readingCount}
                          </td>
                          <td
                            className={`border border-slate-300 p-1 text-center font-bold ${
                              row.stability === "Stable"
                                ? "text-emerald-700"
                                : row.stability === "Unstable"
                                  ? "text-red-700"
                                  : "text-amber-700"
                            }`}
                          >
                            {row.stability}
                          </td>
                          <td className="border border-slate-300 p-1 text-center">
                            {row.cpk === null || row.cpk === undefined
                              ? "N/A"
                              : Number(row.cpk).toFixed(2)}
                          </td>
                          <td className="border border-slate-300 p-1 text-center">
                            {row.oocCount || 0}
                          </td>
                          <td
                            className={`border border-slate-300 p-1 text-center font-bold ${
                              ["Capable", "Acceptable"].includes(row.assessment)
                                ? "text-emerald-700"
                                : row.assessment === "Investigate" ||
                                    row.assessment === "Not capable"
                                  ? "text-red-700"
                                  : "text-amber-700"
                            }`}
                          >
                            {row.assessment}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-2 text-[13px] font-black tracking-wide text-[#173f68]">
                    C. SELECTED CRITICAL CHARACTERISTIC -{" "}
                    {getControlChartDisplayName(
                      report.selectedControlChart,
                    ).toUpperCase()}
                  </div>
                  <div className="mt-1">
                    {report.selectedControlChart ? (
                      <CombinedSPCReportChart
                        chart={report.selectedControlChart}
                      />
                    ) : (
                      <div className="border border-amber-300 bg-amber-50 p-3 text-center text-[10px] text-amber-800">
                        No supported control chart is available for the selected
                        checkpoint. Review its SPC method and subgroup
                        configuration.
                      </div>
                    )}
                  </div>

                  <div className="mt-2 border border-slate-500">
                    <div className="flex border-b border-slate-300 font-black">
                      <div className="flex-1 bg-slate-100 p-1.5">
                        FINAL DISPOSITION
                      </div>
                      <div
                        className={`w-[28%] p-1.5 text-center ${
                          isReleased
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {report.finalDisposition?.status || "LOT ON HOLD"}
                      </div>
                    </div>
                    <div className="p-1.5 text-[9px]">
                      {report.finalDisposition?.statement}
                    </div>
                    <div className="border-t border-slate-300 p-1.5 text-[8px]">
                      Digital traceability reference:{" "}
                      {report.traceability?.reference}.{" "}
                      {report.traceability?.statement}
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-3 border border-slate-300 text-center text-[9px]">
                    <div className="border-r border-slate-300 p-2">
                      <div>Prepared By</div>
                      <div className="font-semibold">
                        {report.approvals?.preparedBy || "-"}
                      </div>
                      <div className="mt-3">Signature: __________________</div>
                    </div>
                    <div className="border-r border-slate-300 p-2">
                      <div>Reviewed By</div>
                      <div className="font-semibold">
                        {report.approvals?.reviewedBy || ""}
                      </div>
                      <div className="mt-3">Signature: __________________</div>
                    </div>
                    <div className="p-2">
                      <div>Customer Approval</div>
                      <div className="font-semibold">
                        {report.approvals?.customerApproval || ""}
                      </div>
                      <div className="mt-3">Signature: __________________</div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between border-t border-slate-200 pt-1 text-[7px] text-slate-500">
                    <span>System-generated customer quality report</span>
                    <span>Page 1 of 1</span>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Edit Record Modal */}
        {showEditModal && editingRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <i className="fas fa-edit text-amber-600"></i>
                  Edit Inspection Record
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRecord(null);
                    setEditingRecordCheckpointKey(null);
                  }}
                  className="text-gray-500 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-building text-slate-400 mr-1"></i>
                    Company
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={editingRecord.companyName || ""}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        companyName: e.target.value,
                      })
                    }
                  >
                    <option value="">Select company</option>
                    {editCompanyOptions.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Item */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-cube text-slate-400 mr-1"></i>
                    Item
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={editingRecord.itemName || ""}
                    onChange={(e) => {
                      const selectedEditItem = editItemOptions.find(
                        (item) => item.name === e.target.value,
                      );
                      setEditingRecord({
                        ...editingRecord,
                        itemName: e.target.value,
                        itemId:
                          selectedEditItem?.id || editingRecord.itemId || "",
                        itemDescription:
                          selectedEditItem?.description ||
                          editingRecord.itemDescription ||
                          "",
                      });
                    }}
                  >
                    <option value="">Select item</option>
                    {editItemOptions.map((item) => (
                      <option key={`${item.id}-${item.name}`} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Process */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-tasks text-slate-400 mr-1"></i>
                    Process
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={editingRecord.processName || ""}
                    onChange={(e) => {
                      const selectedEditProcess = (processes || []).find(
                        (process) =>
                          (process.name || process.processName) ===
                          e.target.value,
                      );
                      setEditingRecord({
                        ...editingRecord,
                        processName: e.target.value,
                        processId:
                          selectedEditProcess?.id ||
                          selectedEditProcess?._id ||
                          editingRecord.processId ||
                          "",
                      });
                    }}
                  >
                    <option value="">Select process</option>
                    {editProcessOptions.map((processName) => (
                      <option key={processName} value={processName}>
                        {processName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Slot */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-clock text-slate-400 mr-1"></i>
                    Time Slot
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={editingRecord.timeSlot || ""}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        timeSlot: e.target.value,
                      })
                    }
                  >
                    <option value="">Select time slot</option>
                    {editTimeSlotOptions.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Inspector/Operator */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-user text-slate-400 mr-1"></i>
                    Inspector / Operator
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={editingRecord.inspector || ""}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        inspector: e.target.value,
                      })
                    }
                  >
                    <option value="">Select inspector / operator</option>
                    {editInspectorOptions.map((inspectorName) => (
                      <option key={inspectorName} value={inspectorName}>
                        {inspectorName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-flag text-slate-400 mr-1"></i>
                    Status
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={editingRecord.status || "Pending"}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>

                {/* Batch Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-barcode text-slate-400 mr-1"></i>
                    Batch Number
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={editingRecord.batchNumber || ""}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        batchNumber: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Machine */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-microchip text-slate-400 mr-1"></i>
                    Machine
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={editingRecord.machine || ""}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        machine: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-hashtag text-slate-400 mr-1"></i>
                    Quantity
                  </label>
                  <input
                    type="number"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={editingRecord.quantity || 0}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-calendar text-slate-400 mr-1"></i>
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={
                      editingRecord.date ||
                      new Date().toISOString().split("T")[0]
                    }
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <i className="fas fa-sticky-note text-slate-400 mr-1"></i>
                  Notes / Observations
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={editingRecord.notes || ""}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      notes: e.target.value,
                    })
                  }
                />
              </div>

              {/* Images */}
              {editingRecord.images && editingRecord.images.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-image text-purple-600 mr-1"></i>
                    Attached Images ({editingRecord.images.length})
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {editingRecord.images.map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={img.data || img}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-slate-200"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checkpoints Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <i className="fas fa-check-double text-emerald-600"></i>
                    Checkpoints
                    <span className="text-xs font-normal text-slate-500 ml-2">
                      ({editingRecordCheckpointRows.length} checkpoints)
                    </span>
                  </h3>
                </div>

                {editingRecordCheckpointRows.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-8 border-2 border-dashed border-slate-200 rounded-xl">
                    <i className="fas fa-clipboard-list text-2xl block mb-2"></i>
                    No checkpoints available
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                            Checkpoint Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                            Details
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                            Status
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {editingRecordCheckpointRows.map((row, index) => {
                          const {
                            key,
                            status: value,
                            checkpointName,
                            measurement,
                            isMeasurement,
                            typeLabel,
                          } = row;
                          return (
                            <tr
                              key={key}
                              className="hover:bg-slate-50 transition"
                            >
                              <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                                #{index + 1}
                              </td>

                              <td className="px-4 py-3">
                                <div className="font-medium text-slate-700">
                                  {checkpointName ||
                                    key ||
                                    "Unnamed checkpoint"}
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                    isMeasurement
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-purple-100 text-purple-700"
                                  }`}
                                >
                                  {typeLabel}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                {measurement ? (
                                  <div className="space-y-1 text-xs">
                                    <div className="text-slate-600">
                                      <span className="font-medium">
                                        Expected:
                                      </span>{" "}
                                      {measurement.expected ?? "-"}{" "}
                                      {measurement.unit || ""}
                                    </div>
                                    <div className="text-slate-600">
                                      <span className="font-medium">
                                        Measured:
                                      </span>{" "}
                                      {measurement.measured ?? "-"}{" "}
                                      {measurement.unit || ""}
                                    </div>
                                    <div className="text-slate-500">
                                      <span className="font-medium">
                                        Tolerance:
                                      </span>{" "}
                                      {measurement.tolerance || "±0.1"}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    No measurement object stored
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <select
                                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-28"
                                  value={value || "N/A"}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value;
                                    const isPassing =
                                      nextStatus === "OK" ||
                                      nextStatus === "Pass";
                                    setEditingRecord((previous) => ({
                                      ...previous,
                                      checkpoints: {
                                        ...(previous.checkpoints || {}),
                                        [key]: nextStatus,
                                      },
                                      measurements: measurement
                                        ? {
                                            ...(previous.measurements || {}),
                                            [key]: {
                                              ...measurement,
                                              status: nextStatus,
                                              pass: isPassing,
                                            },
                                          }
                                        : previous.measurements || {},
                                    }));
                                  }}
                                >
                                  <option value="OK">✅ OK</option>
                                  <option value="Fail">❌ Fail</option>
                                  <option value="N/A">➖ N/A</option>
                                  <option value="Pending">⏳ Pending</option>
                                </select>
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() =>
                                      openRecordCheckpointEditModal(row, index)
                                    }
                                    className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                                    title="Edit Checkpoint Details"
                                  >
                                    <Pencil />
                                  </button>
                                  <button
                                    onClick={() => deleteRecordCheckpoint(row)}
                                    className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition"
                                    title="Delete Checkpoint"
                                  >
                                    <Trash2 />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRecord(null);
                    setEditingRecordCheckpointKey(null);
                  }}
                  className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedRecord}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition text-sm font-medium flex items-center gap-2"
                >
                  <i className="fas fa-save"></i>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shared checkpoint editor for new inspections and history records */}
        <CheckpointModal
          key={
            showEnhancedCheckpointModal
              ? `checkpoint-edit-${editingEnhancedCheckpoint?._recordEdit ? "record" : "plan"}-${editingEnhancedCheckpoint?._editKey || editingEnhancedCheckpoint?.id || "new"}-${editingEnhancedCheckpoint?._editIndex ?? "new"}`
              : "checkpoint-editor-closed"
          }
          isOpen={showEnhancedCheckpointModal}
          onClose={() => {
            setShowEnhancedCheckpointModal(false);
            setEditingEnhancedCheckpoint(null);
            setIsEditingCheckpoint(false);
            setIsInCreateProcessModal(false);
            setEditingRecordCheckpointKey(null);
          }}
          onSave={handleEnhancedCheckpointSave}
          initialData={editingEnhancedCheckpoint}
          isEditing={isEditingCheckpoint}
        />

        {/* Drawing Checkpoint Modal */}
        {showDrawingCheckpointModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  <i className="fas fa-plus-circle text-blue-600 mr-2"></i>
                  Add Checkpoint to Inspection
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add a new checkpoint to the current inspection checklist
                </p>
                {selectedDrawing && (
                  <p className="text-xs text-blue-600 mt-1">
                    Drawing: {selectedDrawing.title}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Checkpoint Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Surface Finish, Hardness Test"
                  value={drawingCheckpointName}
                  onChange={(e) => setDrawingCheckpointName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Checkpoint Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDrawingCheckpointType("Visual")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      drawingCheckpointType === "Visual"
                        ? "bg-purple-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    👁️ Visual
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawingCheckpointType("Measurement")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      drawingCheckpointType === "Measurement"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    📏 Measurement
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawingCheckpointType("Test")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      drawingCheckpointType === "Test"
                        ? "bg-orange-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    🔬 Test
                  </button>
                </div>
              </div>

              {drawingCheckpointType === "Measurement" && (
                <div className="mb-4 rounded-xl bg-blue-50 p-4 border border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measurement Details
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., mm, kg, cm"
                        value={drawingCheckpointUnit}
                        onChange={(e) =>
                          setDrawingCheckpointUnit(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Tolerance
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., ±0.5"
                        value={drawingCheckpointTolerance}
                        onChange={(e) =>
                          setDrawingCheckpointTolerance(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDrawingCheckpointModal(false);
                    setDrawingCheckpointName("");
                    setDrawingCheckpointType("Visual");
                    setDrawingCheckpointUnit("mm");
                    setDrawingCheckpointTolerance("±0.1");
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={addCheckpointToDrawing}
                  className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Checkpoint
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Process Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <i className="fas fa-plus-circle text-purple-600"></i>
                  Create Custom Inspection Process
                  {customCheckpoints.length > 0 && (
                    <span className="ml-2 text-sm font-normal bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {customCheckpoints.length} checkpoints
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setShowCustomModal(false);
                    setCustomProcessName("");
                    setCustomCheckpoints([]);
                    setNewCheckpoint({
                      name: "",
                      type: "Visual",
                      unit: "mm",
                      tolerance: "±0.1",
                    });
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition"
                >
                  <i className="fas fa-times text-slate-400"></i>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Auto-fetched Company */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-building text-slate-400 mr-1"></i>
                    Selected Company{" "}
                    <span className="text-green-500 text-xs">
                      (Auto-detected)
                    </span>
                  </label>
                  <div className="w-full px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-slate-700 flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-500"></i>
                    {selectedCompany || "No company selected"}
                  </div>
                </div>

                {/* Auto-fetched Item */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-cube text-slate-400 mr-1"></i>
                    Selected Part / Item{" "}
                    <span className="text-green-500 text-xs">
                      (Auto-detected)
                    </span>
                  </label>
                  <div className="w-full px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-slate-700 flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-500"></i>
                    {selectedItem?.name || "No item selected"}
                  </div>
                </div>

                {/* Process Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-tasks text-slate-400 mr-1"></i>
                    Inspection Process Name{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customProcessName}
                    onChange={(e) => setCustomProcessName(e.target.value)}
                    placeholder="e.g., CNC Milling Inspection"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>

                {/* Checkpoints Section */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-700">
                      <i className="fas fa-check-double text-slate-400 mr-1"></i>
                      Inspection Checkpoints{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    {customCheckpoints.length > 0 && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove all ${customCheckpoints.length} checkpoints?`,
                            )
                          ) {
                            setCustomCheckpoints([]);
                            toast.info("All checkpoints cleared");
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 transition"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Clear All ({customCheckpoints.length})
                      </button>
                    )}
                  </div>

                  {/* Add Checkpoint Form */}
                  <div className="bg-slate-50 rounded-xl p-3 mb-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCheckpoint.name}
                        onChange={(e) =>
                          setNewCheckpoint({
                            ...newCheckpoint,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter checkpoint name"
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomCheckpoint();
                          }
                        }}
                      />
                      <select
                        value={newCheckpoint.type}
                        onChange={(e) =>
                          setNewCheckpoint({
                            ...newCheckpoint,
                            type: e.target.value,
                          })
                        }
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      >
                        <option value="Visual">Visual Inspection</option>
                        <option value="Measurement">
                          Dimensional Measurement
                        </option>
                        <option value="Test">Functional Test</option>
                      </select>
                      <button
                        onClick={addCustomCheckpoint}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>

                    {newCheckpoint.type === "Measurement" && (
                      <div className="flex gap-3 mt-2">
                        <input
                          type="text"
                          value={newCheckpoint.unit}
                          onChange={(e) =>
                            setNewCheckpoint({
                              ...newCheckpoint,
                              unit: e.target.value,
                            })
                          }
                          placeholder="Unit (e.g., mm)"
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        />
                        <input
                          type="text"
                          value={newCheckpoint.tolerance}
                          onChange={(e) =>
                            setNewCheckpoint({
                              ...newCheckpoint,
                              tolerance: e.target.value,
                            })
                          }
                          placeholder="Tolerance (e.g., ±0.1)"
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        />
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5">
                      <i className="fas fa-info-circle mr-1"></i>
                      Press Enter or click Add to add checkpoint
                    </p>
                  </div>

                  {/* Checkpoints List */}
                  {customCheckpoints.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3 max-h-48 overflow-y-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500">
                          Inspection Checklist ({customCheckpoints.length})
                        </span>
                      </div>
                      {customCheckpoints.map((cp, index) => (
                        <div
                          key={cp.id}
                          className="flex items-center justify-between py-2 px-3 bg-white rounded-lg mb-1 hover:shadow-sm transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 font-mono w-8">
                              #{index + 1}
                            </span>
                            <span className="text-sm text-slate-700 font-medium">
                              {cp.name}
                            </span>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              {cp.type}
                            </span>
                            {cp.type === "Measurement" && (
                              <span className="text-xs text-slate-400">
                                {cp.unit} {cp.tolerance}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => editCustomCheckpoint(cp)}
                              className="text-blue-400 hover:text-blue-600 text-sm p-1 hover:bg-blue-50 rounded transition"
                              title="Edit checkpoint"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeCustomCheckpoint(cp.id)}
                              className="text-red-400 hover:text-red-600 text-sm p-1 hover:bg-red-50 rounded transition"
                              title="Remove checkpoint"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {customCheckpoints.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                      <i className="fas fa-plus-circle text-2xl text-slate-300 mb-1"></i>
                      <p className="text-sm text-slate-500">
                        No checkpoints added yet
                      </p>
                      <p className="text-xs text-slate-400">
                        Add at least one checkpoint to create the process
                      </p>
                    </div>
                  )}
                </div>

                {/* Process Summary */}
                {customCheckpoints.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                    <p className="text-xs text-purple-700 flex items-center gap-2">
                      <i className="fas fa-info-circle"></i>
                      <span>
                        <strong>Inspection Process Summary:</strong>{" "}
                        {customProcessName || "Unnamed"} will have{" "}
                        <strong>{customCheckpoints.length}</strong> checkpoint
                        {customCheckpoints.length > 1 ? "s" : ""}
                      </span>
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    onClick={() => {
                      setShowCustomModal(false);
                      setCustomProcessName("");
                      setCustomCheckpoints([]);
                      setNewCheckpoint({
                        name: "",
                        type: "Visual",
                        unit: "mm",
                        tolerance: "±0.1",
                      });
                    }}
                    className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createCustomProcess}
                    disabled={
                      !selectedCompany ||
                      !selectedItem ||
                      customCheckpoints.length === 0 ||
                      !customProcessName.trim() ||
                      loading
                    }
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-check"></i>
                    )}
                    Create Inspection Process with {customCheckpoints.length}{" "}
                    Checkpoint
                    {customCheckpoints.length > 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Process Modal */}
        {showEditModal && editingProcess && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <i className="fas fa-edit text-amber-600"></i>
                  Edit Process: {editingProcess.name}
                  {customCheckpoints.length > 0 && (
                    <span className="ml-2 text-sm font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {customCheckpoints.length} checkpoints
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProcess(null);
                    setCustomProcessName("");
                    setCustomCheckpoints([]);
                    setNewCheckpoint({
                      name: "",
                      type: "Visual",
                      unit: "mm",
                      tolerance: "±0.1",
                    });
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition"
                >
                  <i className="fas fa-times text-slate-400"></i>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Company Info - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-building text-slate-400 mr-1"></i>
                    Company
                  </label>
                  <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700">
                    {editingProcess.companyName || selectedCompany || "N/A"}
                  </div>
                </div>

                {/* Item Info - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-cube text-slate-400 mr-1"></i>
                    Item Name
                  </label>
                  <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700">
                    {editingProcess.itemName || selectedItem?.name || "N/A"}
                  </div>
                </div>

                {/* Process Name (Editable) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <i className="fas fa-tasks text-slate-400 mr-1"></i>
                    Process Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customProcessName}
                    onChange={(e) => setCustomProcessName(e.target.value)}
                    placeholder="e.g., Updated CNC Milling Inspection"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  />
                </div>

                {/* Checkpoints Section */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-700">
                      <i className="fas fa-check-double text-slate-400 mr-1"></i>
                      Checkpoints <span className="text-red-500">*</span>
                    </label>
                    {customCheckpoints.length > 0 && (
                      <button
                        onClick={clearAllCheckpoints}
                        className="text-xs text-red-500 hover:text-red-700 transition"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Clear All ({customCheckpoints.length})
                      </button>
                    )}
                  </div>

                  {/* Add Checkpoint Form */}
                  <div className="bg-slate-50 rounded-xl p-3 mb-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCheckpoint.name}
                        onChange={(e) =>
                          setNewCheckpoint({
                            ...newCheckpoint,
                            name: e.target.value,
                          })
                        }
                        placeholder="Add new checkpoint"
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomCheckpoint();
                          }
                        }}
                      />
                      <select
                        value={newCheckpoint.type}
                        onChange={(e) =>
                          setNewCheckpoint({
                            ...newCheckpoint,
                            type: e.target.value,
                          })
                        }
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                      >
                        <option value="Visual">Visual</option>
                        <option value="Measurement">Measurement</option>
                        <option value="Test">Test</option>
                      </select>
                      <button
                        onClick={addCustomCheckpoint}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition flex items-center gap-1"
                      >
                        <i className="fas fa-plus"></i>
                        Add
                      </button>
                    </div>

                    {newCheckpoint.type === "Measurement" && (
                      <div className="flex gap-3 mt-2">
                        <input
                          type="text"
                          value={newCheckpoint.unit}
                          onChange={(e) =>
                            setNewCheckpoint({
                              ...newCheckpoint,
                              unit: e.target.value,
                            })
                          }
                          placeholder="Unit (e.g., mm)"
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                        />
                        <input
                          type="text"
                          value={newCheckpoint.tolerance}
                          onChange={(e) =>
                            setNewCheckpoint({
                              ...newCheckpoint,
                              tolerance: e.target.value,
                            })
                          }
                          placeholder="Tolerance (e.g., ±0.1)"
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                        />
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5">
                      <i className="fas fa-info-circle mr-1"></i>
                      Press Enter or click Add to add checkpoint
                    </p>
                  </div>

                  {/* Checkpoints List */}
                  {customCheckpoints.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3 max-h-48 overflow-y-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500">
                          Current Checkpoints ({customCheckpoints.length})
                        </span>
                      </div>
                      {customCheckpoints.map((cp, index) => (
                        <div
                          key={cp.id}
                          className="flex items-center justify-between py-2 px-3 bg-white rounded-lg mb-1 hover:shadow-sm transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 font-mono w-8">
                              #{index + 1}
                            </span>
                            <span className="text-sm text-slate-700 font-medium">
                              {cp.name}
                            </span>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              {cp.type}
                            </span>
                            {cp.type === "Measurement" && (
                              <span className="text-xs text-slate-400">
                                {cp.unit} {cp.tolerance}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => editCustomCheckpoint(cp)}
                              className="text-blue-400 hover:text-blue-600 text-sm p-1 hover:bg-blue-50 rounded transition"
                              title="Edit checkpoint"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeCustomCheckpoint(cp.id)}
                              className="text-red-400 hover:text-red-600 text-sm p-1 hover:bg-red-50 rounded transition"
                              title="Remove checkpoint"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {customCheckpoints.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                      <i className="fas fa-plus-circle text-2xl text-slate-300 mb-1"></i>
                      <p className="text-sm text-slate-500">
                        No checkpoints added yet
                      </p>
                      <p className="text-xs text-slate-400">
                        Add at least one checkpoint to update the process
                      </p>
                    </div>
                  )}
                </div>

                {/* Process Summary */}
                {customCheckpoints.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs text-amber-700 flex items-center gap-2">
                      <i className="fas fa-info-circle"></i>
                      <span>
                        <strong>Process Summary:</strong>{" "}
                        {customProcessName || "Unnamed"} will have{" "}
                        <strong>{customCheckpoints.length}</strong> checkpoint
                        {customCheckpoints.length > 1 ? "s" : ""}
                      </span>
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                  {editingProcess.isCustom && (
                    <button
                      onClick={deleteCurrentProcess}
                      disabled={loading}
                      className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-trash"></i>
                      )}
                      Delete Process
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProcess(null);
                      setCustomProcessName("");
                      setCustomCheckpoints([]);
                      setNewCheckpoint({
                        name: "",
                        type: "Visual",
                        unit: "mm",
                        tolerance: "±0.1",
                      });
                    }}
                    className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateProcess}
                    disabled={
                      customCheckpoints.length === 0 ||
                      !customProcessName.trim() ||
                      loading
                    }
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-save"></i>
                    )}
                    Update Process with {customCheckpoints.length} Checkpoint
                    {customCheckpoints.length > 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Process Name Modal */}
        {showEditProcessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Pencil className="w-5 h-5" />
                      {editingProcessData.isDrawing
                        ? "Rename Drawing Process"
                        : "Rename Custom Process"}
                    </h3>
                    <p className="text-sm text-blue-100 mt-0.5">
                      Update the process name
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowEditProcessModal(false);
                      setEditingProcessData({
                        id: null,
                        name: "",
                        isDrawing: false,
                        drawingId: null,
                        fullProcess: null,
                      });
                    }}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-red-500 transition flex items-center justify-center text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Current Name Display */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">
                    Current Process Name
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {editingProcessData.fullProcess?.processName ||
                      editingProcessData.fullProcess?.name ||
                      editingProcessData.name}
                  </p>
                </div>

                {/* New Name Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    New Process Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingProcessData.name}
                    onChange={(e) =>
                      setEditingProcessData({
                        ...editingProcessData,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter new process name"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        saveProcessName();
                      }
                    }}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {editingProcessData.isDrawing
                      ? "This will update the process name in the drawing"
                      : "This will update the custom process name"}
                  </p>
                </div>

                {/* Warning if process has checkpoints */}
                {editingProcessData.fullProcess?.checkpoints?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div>
                        <p className="text-xs font-medium text-amber-700">
                          This process has{" "}
                          {editingProcessData.fullProcess.checkpoints.length}{" "}
                          checkpoint(s)
                        </p>
                        <p className="text-[10px] text-amber-600">
                          Renaming will update the process name but keep all
                          checkpoints intact
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditProcessModal(false);
                    setEditingProcessData({
                      id: null,
                      name: "",
                      isDrawing: false,
                      drawingId: null,
                      fullProcess: null,
                    });
                  }}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProcessName}
                  disabled={
                    !editingProcessData.name.trim() || isRenamingProcess
                  }
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                >
                  {isRenamingProcess ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Pencil className="w-4 h-4" />
                      Update Name
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Piece Inspection Modal */}
        {showMultiPieceModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <i className="fas fa-cubes text-teal-600"></i>
                    {activeMultiPieceCheckpointId
                      ? "Record Checkpoint Readings"
                      : "Multi-Piece Inspection"}
                    <span className="text-sm font-normal text-slate-500 ml-2">
                      ({pieceMeasurements.length} pieces)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {pieceCount > 0
                      ? `Inspecting ${pieceCount} pieces`
                      : "Set number of pieces below"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowMultiPieceModal(false);
                    setPieceMeasurements([]);
                    setActiveMultiPieceCheckpointId(null);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition"
                >
                  <i className="fas fa-times text-slate-400"></i>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Piece Count Input */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {activeMultiPieceCheckpointId
                        ? "Configured Pieces per Inspection"
                        : "Number of Pieces"}
                    </label>
                    <input
                      type="number"
                      disabled={Boolean(activeMultiPieceCheckpointId)}
                      min="1"
                      max="100"
                      value={pieceCount}
                      onChange={(e) => {
                        const count = parseInt(e.target.value) || 1;
                        setPieceCount(count);
                        if (count > 0 && count !== pieceMeasurements.length) {
                          initializeMultiPiece(
                            count,
                            activeMultiPieceCheckpointId,
                          );
                        }
                      }}
                      className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div className="text-sm text-slate-500">
                    {pieceMeasurements.length > 0 && (
                      <span className="flex items-center gap-1">
                        <i className="fas fa-check-circle text-green-500"></i>
                        {pieceMeasurements.length} pieces ready
                      </span>
                    )}
                  </div>
                </div>
                {/* Measurements Table */}
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-sm mb-3">
                    <i className="fas fa- rulers text-teal-600"></i>
                    Piece Measurements
                    <span className="text-xs font-normal text-slate-500 ml-2">
                      Enter measurements for each piece
                    </span>
                  </h4>

                  {pieceMeasurements.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 border border-slate-200">
                              Piece #
                            </th>
                            {Object.keys(
                              pieceMeasurements[0]?.measurements || {},
                            ).map((key) => {
                              const checkpoint =
                                selectedProcess?.checkpoints?.find(
                                  (item, index) =>
                                    getCheckpointKey(item, index) === key,
                                );
                              const sampling = getCheckpointSampling(
                                checkpoint || {},
                              );
                              return (
                                <th
                                  key={key}
                                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 border border-slate-200 min-w-[210px]"
                                >
                                  {checkpoint?.name || key}
                                  <span className="block text-[10px] font-normal text-slate-400">
                                    {sampling.readingsPerPiece} reading(s) per
                                    piece •{" "}
                                    {getCheckpointSpecification(
                                      checkpoint || {},
                                    ).unit || "unit"}
                                  </span>
                                </th>
                              );
                            })}
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 border border-slate-200">
                              Piece Result
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pieceMeasurements.map((piece, pieceIndex) => (
                            <tr key={piece.pieceNumber}>
                              <td className="px-4 py-3 border border-slate-200 font-semibold">
                                #{piece.pieceNumber}
                              </td>
                              {Object.entries(piece.measurements || {}).map(
                                ([key, measurement]) => (
                                  <td
                                    key={key}
                                    className="px-4 py-3 border border-slate-200"
                                  >
                                    <div className="space-y-2">
                                      {(measurement.readings || []).map(
                                        (reading, readingIndex) => (
                                          <div
                                            key={reading.readingNumber}
                                            className="flex items-center gap-2"
                                          >
                                            <span className="text-[10px] text-slate-500 w-8">
                                              R{reading.readingNumber}
                                            </span>
                                            <input
                                              type="number"
                                              step="any"
                                              value={reading.value}
                                              onChange={(event) =>
                                                updatePieceMeasurement(
                                                  pieceIndex,
                                                  key,
                                                  readingIndex,
                                                  event.target.value,
                                                )
                                              }
                                              className={`w-28 px-2 py-1 border rounded-md text-sm ${
                                                reading.pass === true
                                                  ? "border-emerald-400 bg-emerald-50"
                                                  : reading.pass === false
                                                    ? "border-red-400 bg-red-50"
                                                    : "border-slate-300"
                                              }`}
                                              placeholder="Value"
                                            />
                                            {reading.pass !== null && (
                                              <span
                                                className={`text-[10px] font-semibold ${
                                                  reading.pass
                                                    ? "text-emerald-600"
                                                    : "text-red-600"
                                                }`}
                                              >
                                                {reading.pass ? "PASS" : "FAIL"}
                                              </span>
                                            )}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </td>
                                ),
                              )}
                              <td className="px-4 py-3 border border-slate-200">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    piece.status === "Pass"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : piece.status === "Fail"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {piece.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                      <i className="fas fa-cubes text-3xl text-slate-300 mb-2"></i>
                      <p>
                        Enter the number of pieces and click "Initialize Pieces"
                      </p>
                    </div>
                  )}
                </div>

                {/* ============================================================ */}
                {/* ACTIONS - Updated with SPC Analysis Button */}
                {/* ============================================================ */}
                <div className="flex justify-between gap-3 border-t border-slate-200 pt-4">
                  {/* Left side - SPC Analysis Button */}
                  <div className="flex gap-2">
                    {/* {pieceMeasurements.length > 0 &&
                      Object.keys(measurementResults).length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            // Build checkpoint measurements from current piece data
                            const checkpointMeasurementsMap = {};
                            const firstPiece = pieceMeasurements[0];
                            const checkpointKeys = Object.keys(
                              firstPiece.measurements || {},
                            );

                            checkpointKeys.forEach((key) => {
                              const values = [];
                              const numericValues = [];
                              let expectedValue = "";
                              let unitValue = "mm";
                              let toleranceValue = "±0.1";

                              pieceMeasurements.forEach((piece) => {
                                const meas = piece.measurements?.[key];
                                if (
                                  meas &&
                                  meas.measured !== undefined &&
                                  meas.measured !== ""
                                ) {
                                  const value = parseFloat(meas.measured);
                                  if (!isNaN(value)) {
                                    expectedValue = meas.expected || "";
                                    unitValue = meas.unit || "mm";
                                    toleranceValue = meas.tolerance || "±0.1";
                                    numericValues.push(value);
                                    values.push({
                                      pieceNumber: piece.pieceNumber,
                                      value: meas.measured,
                                      pass:
                                        Math.abs(
                                          value -
                                            parseFloat(meas.expected || 0),
                                        ) <=
                                        parseFloat(
                                          meas.tolerance?.replace(
                                            /[^0-9.]/g,
                                            "",
                                          ) || 0.1,
                                        ),
                                      deviation: (
                                        value - parseFloat(meas.expected || 0)
                                      ).toFixed(3),
                                    });
                                  }
                                }
                              });

                              if (values.length > 0) {
                                const avg =
                                  numericValues.reduce((a, b) => a + b, 0) /
                                  numericValues.length;
                                const min = Math.min(...numericValues);
                                const max = Math.max(...numericValues);
                                const squaredDiffs = numericValues.map((v) =>
                                  Math.pow(v - avg, 2),
                                );
                                const variance =
                                  squaredDiffs.reduce((a, b) => a + b, 0) /
                                  (values.length - 1);
                                const stdDev = Math.sqrt(variance);

                                checkpointMeasurementsMap[key] = {
                                  checkpointId: key,
                                  checkpointName: key,
                                  expected: expectedValue,
                                  unit: unitValue,
                                  tolerance: toleranceValue,
                                  pieceValues: values,
                                  statistics: {
                                    sampleSize: values.length,
                                    mean: avg,
                                    min: min,
                                    max: max,
                                    range: max - min,
                                    stdDev: stdDev,
                                  },
                                };
                              }
                            });

                            if (
                              Object.keys(checkpointMeasurementsMap).length > 0
                            ) {
                              // Show SPC modal with the checkpoint data
                              const firstCheckpoint = Object.keys(
                                checkpointMeasurementsMap,
                              )[0];
                              setSpcCheckpointData({
                                checkpointName: firstCheckpoint,
                                ...checkpointMeasurementsMap[firstCheckpoint],
                              });
                              setSelectedCheckpointForSPC(firstCheckpoint);
                              setShowSPCModal(true);
                              toast.success(
                                `SPC analysis loaded for ${firstCheckpoint}`,
                              );
                            } else {
                              toast.error(
                                "No valid measurements found for SPC analysis",
                              );
                            }
                          }}
                          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2"
                        >
                          <i className="fas fa-chart-line"></i>
                          View SPC Analysis
                        </button>
                      )} */}
                  </div>

                  {/* Right side - Cancel and Apply buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowMultiPieceModal(false);
                        setPieceMeasurements([]);
                      }}
                      className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={applyMultiPieceMeasurements}
                      disabled={pieceMeasurements.length === 0}
                      className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-check"></i>
                      Apply Measurements ({pieceMeasurements.length} pieces)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Gauge Modal */}
        {showGaugeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {editingGaugeIndex !== null
                        ? "Edit Gauge"
                        : "Add New Gauge"}
                    </h2>
                    <p className="text-sm text-amber-100 mt-1">
                      {editingGaugeIndex !== null
                        ? "Update gauge specifications"
                        : "Register a new inspection gauge"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowGaugeModal(false);
                      setEditingGaugeIndex(null);
                      setPendingInstrumentCheckpointId(null);
                      resetGaugeForm();
                    }}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-red-500 transition flex items-center justify-center text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Gauge Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={gaugeFormData.name}
                      onChange={(e) =>
                        setGaugeFormData({
                          ...gaugeFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g., Thread Gauge M12x1.75"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Gauge Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={gaugeFormData.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setGaugeFormData({
                          ...gaugeFormData,
                          type: newType,
                          size: "",
                          unit:
                            newType === "Go" || newType === "No-Go" ? "" : "mm",
                          toleranceMin: "",
                          toleranceMax: "",
                          material: "",
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      {/* Go/No-Go Gauges - First */}
                      <optgroup label="Go/No-Go Gauges (Pass/Fail Testing)">
                        <option value="Go">Go Gauge</option>
                        <option value="No-Go">No-Go Gauge</option>
                      </optgroup>

                      {/* Measuring Instruments - Second */}
                      <optgroup label="Measuring Instruments">
                        <option value="Thread">Thread Gauge</option>
                        <option value="Plug">Plug Gauge</option>
                        <option value="Snap">Snap Gauge</option>
                        <option value="Bore">Bore Gauge</option>
                        <option value="Depth">Depth Gauge</option>
                        <option value="Height">Height Gauge</option>
                      </optgroup>

                      {/* Universal - Last */}
                      <optgroup label="Other">
                        <option value="Universal">Universal Gauge</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={gaugeFormData.serialNumber}
                      onChange={(e) =>
                        setGaugeFormData({
                          ...gaugeFormData,
                          serialNumber: e.target.value,
                        })
                      }
                      placeholder="e.g., GAUGE-2024-001"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Dynamic Fields Based on Gauge Type */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <i className="fas fa-ruler text-amber-600"></i>
                    {gaugeFormData.type === "Go"
                      ? "Go Gauge Specifications"
                      : gaugeFormData.type === "No-Go"
                        ? "No-Go Gauge Specifications"
                        : `${gaugeFormData.type} Gauge Specifications`}
                  </h4>

                  {/* Go/No-Go Gauges - Simple fields */}
                  {(gaugeFormData.type === "Go" ||
                    gaugeFormData.type === "No-Go") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Gauge Size / Limit
                        </label>
                        <input
                          type="text"
                          value={gaugeFormData.size}
                          onChange={(e) =>
                            setGaugeFormData({
                              ...gaugeFormData,
                              size: e.target.value,
                            })
                          }
                          placeholder={
                            gaugeFormData.type === "Go"
                              ? "e.g., 12.5mm (Min Limit)"
                              : "e.g., 12.7mm (Max Limit)"
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          {gaugeFormData.type === "Go"
                            ? "Part should fit into the Go gauge to pass"
                            : "Part should NOT fit into the No-Go gauge to pass"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Unit
                        </label>
                        <select
                          value={gaugeFormData.unit}
                          onChange={(e) =>
                            setGaugeFormData({
                              ...gaugeFormData,
                              unit: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                          <option value="mm">mm</option>
                          <option value="cm">cm</option>
                          <option value="inch">inch</option>
                          <option value="µm">µm</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Measuring Instruments - Full fields */}
                  {gaugeFormData.type !== "Go" &&
                    gaugeFormData.type !== "No-Go" && (
                      <>
                        {/* Common fields for all measuring instruments */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Size / Range
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={gaugeFormData.size}
                              onChange={(e) =>
                                setGaugeFormData({
                                  ...gaugeFormData,
                                  size: e.target.value,
                                })
                              }
                              placeholder={
                                gaugeFormData.type === "Thread"
                                  ? "e.g., 12.5"
                                  : gaugeFormData.type === "Depth"
                                    ? "e.g., 150"
                                    : gaugeFormData.type === "Height"
                                      ? "e.g., 300"
                                      : "e.g., 12.5"
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Unit
                            </label>
                            <select
                              value={gaugeFormData.unit}
                              onChange={(e) =>
                                setGaugeFormData({
                                  ...gaugeFormData,
                                  unit: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            >
                              <option value="mm">mm</option>
                              <option value="cm">cm</option>
                              <option value="inch">inch</option>
                              <option value="µm">µm</option>
                              {gaugeFormData.type === "Thread" && (
                                <option value="thread">Thread Pitch</option>
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Material
                            </label>
                            <input
                              type="text"
                              value={gaugeFormData.material}
                              onChange={(e) =>
                                setGaugeFormData({
                                  ...gaugeFormData,
                                  material: e.target.value,
                                })
                              }
                              placeholder={
                                gaugeFormData.type === "Thread"
                                  ? "e.g., HSS, Carbide"
                                  : "e.g., Steel, Carbide, Ceramic"
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Type-specific fields for measuring instruments */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Thread Gauge specific fields */}
                          {gaugeFormData.type === "Thread" && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Thread Pitch
                                </label>
                                <input
                                  type="text"
                                  value={gaugeFormData.threadPitch || ""}
                                  onChange={(e) =>
                                    setGaugeFormData({
                                      ...gaugeFormData,
                                      threadPitch: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., 1.75, 1.0"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Thread Class
                                </label>
                                <select
                                  value={gaugeFormData.threadClass || ""}
                                  onChange={(e) =>
                                    setGaugeFormData({
                                      ...gaugeFormData,
                                      threadClass: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                  <option value="">Select Class</option>
                                  <option value="6H">6H</option>
                                  <option value="6G">6G</option>
                                  <option value="2A">2A</option>
                                  <option value="3A">3A</option>
                                  <option value="2B">2B</option>
                                  <option value="3B">3B</option>
                                </select>
                              </div>
                            </>
                          )}

                          {/* Bore Gauge specific fields */}
                          {gaugeFormData.type === "Bore" && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Bore Diameter Range
                                </label>
                                <input
                                  type="text"
                                  value={gaugeFormData.boreRange || ""}
                                  onChange={(e) =>
                                    setGaugeFormData({
                                      ...gaugeFormData,
                                      boreRange: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., 10-20mm"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Indicator Type
                                </label>
                                <select
                                  value={gaugeFormData.indicatorType || ""}
                                  onChange={(e) =>
                                    setGaugeFormData({
                                      ...gaugeFormData,
                                      indicatorType: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                  <option value="">Select Type</option>
                                  <option value="Dial">Dial Indicator</option>
                                  <option value="Digital">
                                    Digital Indicator
                                  </option>
                                  <option value="Electronic">Electronic</option>
                                </select>
                              </div>
                            </>
                          )}

                          {/* Depth Gauge specific fields */}
                          {gaugeFormData.type === "Depth" && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Depth Range
                                </label>
                                <input
                                  type="text"
                                  value={gaugeFormData.depthRange || ""}
                                  onChange={(e) =>
                                    setGaugeFormData({
                                      ...gaugeFormData,
                                      depthRange: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., 0-150mm"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Base Type
                                </label>
                                <select
                                  value={gaugeFormData.baseType || ""}
                                  onChange={(e) =>
                                    setGaugeFormData({
                                      ...gaugeFormData,
                                      baseType: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                  <option value="">Select Base</option>
                                  <option value="Flat">Flat Base</option>
                                  <option value="V">V-Base</option>
                                  <option value="Magnetic">
                                    Magnetic Base
                                  </option>
                                </select>
                              </div>
                            </>
                          )}

                          {/* Height Gauge specific fields */}
                          {gaugeFormData.type === "Height" && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Height Range
                                </label>
                                <input
                                  type="text"
                                  value={gaugeFormData.heightRange || ""}
                                  onChange={(e) =>
                                    setGaugeFormData({
                                      ...gaugeFormData,
                                      heightRange: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., 0-300mm"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Resolution
                                </label>
                                <select
                                  value={gaugeFormData.resolution || ""}
                                  onChange={(e) =>
                                    setGaugeFormData({
                                      ...gaugeFormData,
                                      resolution: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                  <option value="">Select Resolution</option>
                                  <option value="0.01mm">0.01mm</option>
                                  <option value="0.001mm">0.001mm</option>
                                  <option value="0.0005mm">0.0005mm</option>
                                </select>
                              </div>
                            </>
                          )}

                          {/* Plug Gauge specific fields */}
                          {gaugeFormData.type === "Plug" && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Plug Diameter
                                </label>
                                <input
                                  type="text"
                                  value={gaugeFormData.plugDiameter || ""}
                                  onChange={(e) =>
                                    setGaugeFormData({
                                      ...gaugeFormData,
                                      plugDiameter: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., 10.0mm"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Plug Type
                                </label>
                                <select
                                  value={gaugeFormData.plugType || ""}
                                  onChange={(e) =>
                                    setGaugeFormData({
                                      ...gaugeFormData,
                                      plugType: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                  <option value="">Select Type</option>
                                  <option value="Go">Go Plug</option>
                                  <option value="NoGo">No-Go Plug</option>
                                  <option value="Taper">Taper Plug</option>
                                </select>
                              </div>
                            </>
                          )}

                          {/* Snap Gauge specific fields */}
                          {gaugeFormData.type === "Snap" && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Snap Range
                                </label>
                                <input
                                  type="text"
                                  value={gaugeFormData.snapRange || ""}
                                  onChange={(e) =>
                                    setGaugeFormData({
                                      ...gaugeFormData,
                                      snapRange: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., 0-25mm"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Anvil Type
                                </label>
                                <select
                                  value={gaugeFormData.anvilType || ""}
                                  onChange={(e) =>
                                    setGaugeFormData({
                                      ...gaugeFormData,
                                      anvilType: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                  <option value="">Select Anvil</option>
                                  <option value="Flat">Flat Anvil</option>
                                  <option value="Spherical">
                                    Spherical Anvil
                                  </option>
                                  <option value="Knife">Knife Edge</option>
                                </select>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Tolerance Section - For measuring instruments only */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Min Tolerance
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={gaugeFormData.toleranceMin}
                              onChange={(e) =>
                                setGaugeFormData({
                                  ...gaugeFormData,
                                  toleranceMin: e.target.value,
                                })
                              }
                              placeholder={
                                gaugeFormData.type === "Thread"
                                  ? "e.g., -0.02"
                                  : "e.g., -0.1"
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Max Tolerance
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={gaugeFormData.toleranceMax}
                              onChange={(e) =>
                                setGaugeFormData({
                                  ...gaugeFormData,
                                  toleranceMax: e.target.value,
                                })
                              }
                              placeholder={
                                gaugeFormData.type === "Thread"
                                  ? "e.g., +0.02"
                                  : "e.g., +0.1"
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </>
                    )}
                </div>

                {/* Calibration & Condition */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Calibration Date
                    </label>
                    <input
                      type="date"
                      value={gaugeFormData.calibrationDate}
                      onChange={(e) =>
                        setGaugeFormData({
                          ...gaugeFormData,
                          calibrationDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Calibration Due Date
                    </label>
                    <input
                      type="date"
                      value={gaugeFormData.calibrationDue}
                      onChange={(e) =>
                        setGaugeFormData({
                          ...gaugeFormData,
                          calibrationDue: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Certificate Number
                    </label>
                    <input
                      type="text"
                      value={gaugeFormData.certificateNumber}
                      onChange={(e) =>
                        setGaugeFormData({
                          ...gaugeFormData,
                          certificateNumber: e.target.value,
                        })
                      }
                      placeholder="e.g., CAL-2024-789"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Gauge Condition
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["New", "Good", "Worn", "Damaged"].map((condition) => (
                        <button
                          key={condition}
                          type="button"
                          onClick={() =>
                            setGaugeFormData({
                              ...gaugeFormData,
                              condition,
                            })
                          }
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            gaugeFormData.condition === condition
                              ? condition === "New"
                                ? "bg-emerald-600 text-white shadow-md"
                                : condition === "Good"
                                  ? "bg-blue-600 text-white shadow-md"
                                  : condition === "Worn"
                                    ? "bg-amber-600 text-white shadow-md"
                                    : "bg-red-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {condition}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Gauge Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Pass", "Fail", "Under Maintenance"].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            setGaugeFormData({
                              ...gaugeFormData,
                              status,
                            })
                          }
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            gaugeFormData.status === status
                              ? status === "Pass"
                                ? "bg-emerald-600 text-white shadow-md"
                                : status === "Fail"
                                  ? "bg-red-600 text-white shadow-md"
                                  : "bg-amber-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Measured Value
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={gaugeFormData.measuredValue}
                    onChange={(e) =>
                      setGaugeFormData({
                        ...gaugeFormData,
                        measuredValue: e.target.value,
                      })
                    }
                    placeholder="Enter measured value"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Remarks / Notes
                  </label>
                  <textarea
                    value={gaugeFormData.remarks}
                    onChange={(e) =>
                      setGaugeFormData({
                        ...gaugeFormData,
                        remarks: e.target.value,
                      })
                    }
                    rows="2"
                    placeholder="Additional observations, wear notes, etc."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {/* Type-specific info box */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <i className="fas fa-info-circle"></i>
                    <span>
                      {gaugeFormData.type === "Go" &&
                        "🔧 Go Gauge: Verifies the minimum size limit. The part MUST fit into the Go gauge to pass inspection."}
                      {gaugeFormData.type === "No-Go" &&
                        "🔧 No-Go Gauge: Verifies the maximum size limit. The part MUST NOT fit into the No-Go gauge to pass inspection."}
                      {gaugeFormData.type === "Thread" &&
                        "Thread gauges verify internal and external thread dimensions. Ensure thread pitch and class match the specification."}
                      {gaugeFormData.type === "Bore" &&
                        "Bore gauges measure internal diameters. Ensure the bore range covers your measurement requirements."}
                      {gaugeFormData.type === "Depth" &&
                        "Depth gauges measure the depth of holes, slots, and recesses. Ensure the depth range covers your requirements."}
                      {gaugeFormData.type === "Height" &&
                        "Height gauges measure vertical dimensions. Ensure the height range and resolution meet your requirements."}
                      {gaugeFormData.type === "Plug" &&
                        "Plug gauges verify hole sizes. Go plugs check minimum size, No-Go plugs check maximum size."}
                      {gaugeFormData.type === "Snap" &&
                        "Snap gauges check external diameters. The anvil type affects measurement accuracy."}
                      {gaugeFormData.type === "Universal" &&
                        "Universal gauges can be adapted for multiple measurement applications. Ensure proper setup."}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    onClick={() => {
                      setShowGaugeModal(false);
                      setEditingGaugeIndex(null);
                      setPendingInstrumentCheckpointId(null);
                      resetGaugeForm();
                    }}
                    className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addEnhancedGauge}
                    disabled={!gaugeFormData.name.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    {editingGaugeIndex !== null ? "Update Gauge" : "Add Gauge"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* SPC Dashboard Modal */}
        <SPCDashboardModal
          isOpen={showSPCDashboardModal}
          onClose={() => setShowSPCDashboardModal(false)}
        />
        <AnimatePresence>
          {showQCGuide && <QCGuide onClose={() => setShowQCGuide(false)} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QC;
