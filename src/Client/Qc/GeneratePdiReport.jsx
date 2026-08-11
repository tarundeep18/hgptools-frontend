import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FilterX,
  Hash,
  Layers3,
  Loader2,
  Printer,
  RefreshCw,
  Ruler,
  Search,
  ShieldCheck,
  Square,
  X,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from "chart.js";
import { Line } from "react-chartjs-2";
import axios from "axios";
import toast from "react-hot-toast";

import logo from "../../assets/logo34-removebg-preview.png";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
);

const API_URL =
  import.meta.env.VITE_REACT_APP_BACKEND_BASEURL || "http://localhost:5000/api";

const RUNS_PER_PAGE = 20;
const REPORT_REQUEST_CONCURRENCY = 4;

const asArray = (value) => (Array.isArray(value) ? value : []);

const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const toFiniteNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const getIdValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || value.value || "");
  }
  return String(value);
};

const getStringValue = (...values) => {
  const value = firstDefined(...values);
  if (value === undefined || value === null) return "";
  if (typeof value === "object") {
    return String(value.name || value.title || value.label || value.code || "");
  }
  return String(value);
};

const extractCollection = (payload) => {
  const root = payload?.data ?? payload;
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.data)) return root.data;

  for (const key of [
    "records",
    "inspections",
    "items",
    "docs",
    "results",
    "rows",
  ]) {
    if (Array.isArray(root?.[key])) return root[key];
  }

  return [];
};

const normalizeResult = (value) => {
  const normalized = String(value || "Pending")
    .trim()
    .toUpperCase();

  if (
    ["OK", "ACCEPTED", "PASS", "PASSED"].includes(normalized) ||
    normalized.startsWith("PASS_") ||
    normalized.includes("ACCEPTED")
  ) {
    return "PASS";
  }

  if (
    ["NG", "REJECTED", "FAIL", "FAILED"].includes(normalized) ||
    normalized.startsWith("FAIL_") ||
    normalized.includes("REJECT")
  ) {
    return "FAIL";
  }

  if (["NA", "N/A", "NOT APPLICABLE"].includes(normalized)) return "N/A";
  return normalized || "PENDING";
};

const normalizeCheckpointOption = (checkpoint = {}, fallbackId = "") => {
  if (typeof checkpoint === "string") {
    return {
      id: checkpoint,
      name: checkpoint,
      balloon: "",
      label: checkpoint,
    };
  }

  const id = getStringValue(
    checkpoint.checkpointId,
    checkpoint.characteristicId,
    checkpoint._id,
    checkpoint.id,
    fallbackId,
  );
  const name = getStringValue(
    checkpoint.name,
    checkpoint.characteristic,
    checkpoint.checkpointName,
    checkpoint.label,
    id,
  );
  const balloon = getStringValue(
    checkpoint.balloon,
    checkpoint.balloonNumber,
    checkpoint.drawingBalloonNumber,
  );

  return {
    id: id || name,
    name: name || id,
    balloon,
    label: [balloon, name || id].filter(Boolean).join(" "),
  };
};

const extractRecordCheckpointOptions = (record = {}) => {
  const candidates = [];

  const pushArray = (value) => {
    if (Array.isArray(value)) candidates.push(...value);
  };

  pushArray(record.checkpointPlanSnapshot);
  pushArray(record.checkpoints);
  pushArray(record.processSnapshot?.checkpoints);
  pushArray(record.drawingSnapshot?.checkpoints);
  pushArray(record.process?.checkpoints);
  pushArray(record.drawing?.checkpoints);

  if (record.checkpoint) candidates.push(record.checkpoint);
  if (record.checkpointId || record.characteristicId) {
    candidates.push({
      checkpointId: firstDefined(record.checkpointId, record.characteristicId),
      name: firstDefined(
        record.checkpointName,
        record.characteristic,
        record.parameterName,
      ),
      balloonNumber: firstDefined(
        record.balloonNumber,
        record.drawingBalloonNumber,
      ),
    });
  }

  const measurementContainers = [
    record.measurements,
    record.checkpointMeasurements,
    record.measurementResults,
  ];

  measurementContainers.forEach((container) => {
    if (!container || typeof container !== "object") return;
    Object.keys(container).forEach((key) =>
      candidates.push({ checkpointId: key }),
    );
  });

  const map = new Map();
  candidates.forEach((candidate, index) => {
    const normalized = normalizeCheckpointOption(
      candidate,
      `checkpoint-${index}`,
    );
    if (!normalized.id || map.has(normalized.id)) return;
    map.set(normalized.id, normalized);
  });

  return Array.from(map.values());
};

const normalizeInspectionRecord = (record = {}, index = 0) => {
  const inspectionId = getIdValue(
    record._id ||
      record.id ||
      record.inspectionId ||
      record.sourceInspectionIds?.[0],
  );
  const companyName = getStringValue(
    record.companyName,
    record.customerName,
    record.company,
    record.customer,
    record.client?.name,
  );
  const companyId =
    getIdValue(record.companyId || record.clientId || record.customerId) ||
    companyName;
  const itemCode = getStringValue(
    record.itemCode,
    record.partNumber,
    record.customerPartNumber,
    record.item?.code,
  );
  const itemName = getStringValue(
    record.itemName,
    record.partName,
    record.item,
  );
  const itemId =
    getIdValue(record.itemId || record.partId || record.item?._id) ||
    itemCode ||
    itemName;
  const processName = getStringValue(record.processName, record.process);
  const processId =
    getIdValue(record.processId || record.process?._id) || processName;
  const drawingTitle = getStringValue(
    record.drawingTitle,
    record.drawingNumber,
    record.drawingName,
    record.drawing?.title,
    record.drawing,
  );
  const drawingRevision = getStringValue(
    record.drawingRevision,
    record.revision,
    record.drawing?.revision,
  );
  const drawingId =
    getIdValue(record.drawingId || record.drawing?._id) || drawingTitle;
  const inspectionRunId = getStringValue(
    record.inspectionRunId,
    record.runId,
    record.reportRunId,
  );
  const reportNumber = getStringValue(record.reportNumber, record.reportNo);
  const inspectionDate = firstDefined(
    record.inspectionDate,
    record.date,
    record.createdAt,
    record.updatedAt,
  );
  const runKey = inspectionRunId || inspectionId || `record-${index}`;
  const checkpointOptions = extractRecordCheckpointOptions(record);

  return {
    raw: record,
    inspectionId: inspectionId || `record-${index}`,
    representativeInspectionId: inspectionId || `record-${index}`,
    inspectionRunId: runKey,
    runKey,
    reportNumber,
    companyId,
    companyName,
    companyKey: companyId || companyName,
    itemId,
    itemCode,
    itemName,
    itemDescription: getStringValue(
      record.itemDescription,
      record.description,
      record.item?.description,
    ),
    itemKey: itemId || itemCode || itemName,
    drawingId,
    drawingTitle,
    drawingRevision,
    drawingKey: `${drawingId || drawingTitle || "no-drawing"}::${
      drawingRevision || ""
    }`,
    processId,
    processName,
    processKey: processId || processName,
    inspectionDate,
    inspector: getStringValue(record.inspector, record.inspectorName),
    batchNumber: getStringValue(
      record.batchNumber,
      record.batch,
      record.lotNumber,
    ),
    lotQuantity: firstDefined(
      record.quantity,
      record.lotQuantity,
      record.totalQuantity,
    ),
    sampleQuantity: firstDefined(
      record.sampleQuantity,
      record.sampleSize,
      record.totalSamples,
    ),
    shift: getStringValue(record.shift),
    timeSlot: getStringValue(record.timeSlot),
    machine: getStringValue(record.machine),
    line: getStringValue(record.line),
    status: normalizeResult(record.status || record.result),
    checkpointOptions,
    checkpointIds: checkpointOptions.map((checkpoint) => checkpoint.id),
  };
};

const mergeRunStatus = (statuses = []) => {
  const normalized = statuses.map(normalizeResult);
  if (normalized.includes("FAIL")) return "FAIL";
  if (normalized.includes("PENDING")) return "PENDING";
  if (normalized.includes("PASS")) return "PASS";
  return normalized[0] || "PENDING";
};

const groupInspectionRuns = (records = []) => {
  const runMap = new Map();

  records.forEach((record) => {
    const runKey =
      record.runKey || record.inspectionRunId || record.inspectionId;
    if (!runKey) return;

    const existing = runMap.get(runKey);
    if (!existing) {
      runMap.set(runKey, {
        ...record,
        runKey,
        representativeInspectionId: record.inspectionId,
        inspectionIds: [record.inspectionId],
        statuses: [record.status],
        checkpointMap: new Map(
          record.checkpointOptions.map((checkpoint) => [
            checkpoint.id,
            checkpoint,
          ]),
        ),
      });
      return;
    }

    const existingTime = new Date(existing.inspectionDate || 0).getTime();
    const currentTime = new Date(record.inspectionDate || 0).getTime();
    const useCurrentAsRepresentative = currentTime > existingTime;

    record.checkpointOptions.forEach((checkpoint) => {
      if (!existing.checkpointMap.has(checkpoint.id)) {
        existing.checkpointMap.set(checkpoint.id, checkpoint);
      }
    });

    runMap.set(runKey, {
      ...(useCurrentAsRepresentative ? record : existing),
      runKey,
      inspectionRunId: runKey,
      representativeInspectionId: useCurrentAsRepresentative
        ? record.inspectionId
        : existing.representativeInspectionId,
      inspectionIds: Array.from(
        new Set([...(existing.inspectionIds || []), record.inspectionId]),
      ),
      statuses: [...(existing.statuses || []), record.status],
      checkpointMap: existing.checkpointMap,
    });
  });

  return Array.from(runMap.values())
    .map((run) => {
      const checkpointOptions = Array.from(run.checkpointMap.values()).sort(
        (a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }),
      );
      return {
        ...run,
        checkpointOptions,
        checkpointIds: checkpointOptions.map((checkpoint) => checkpoint.id),
        checkpointCount: checkpointOptions.length || run.inspectionIds.length,
        status: mergeRunStatus(run.statuses),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.inspectionDate || 0).getTime() -
        new Date(a.inspectionDate || 0).getTime(),
    );
};

const uniqueOptions = (records, valueGetter, labelGetter) => {
  const map = new Map();
  records.forEach((record) => {
    const value = String(valueGetter(record) || "");
    if (!value || map.has(value)) return;
    map.set(value, {
      value,
      label: String(labelGetter(record) || value),
      record,
    });
  });

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true }),
  );
};

const normalizeReadingValue = (reading) => {
  if (reading && typeof reading === "object") {
    return firstDefined(
      reading.value,
      reading.measured,
      reading.result,
      reading.status,
      reading.binaryResult,
    );
  }
  return reading;
};

const normalizePdiRow = (row = {}, index = 0) => {
  const specification =
    row.specification && typeof row.specification === "object"
      ? row.specification
      : {};
  const checkpointId = getStringValue(
    row.checkpointId,
    row.characteristicId,
    row.id,
    row._id,
  );
  const readings = asArray(
    firstDefined(row.sampleResults, row.readings, row.observations, row.values),
  ).map(normalizeReadingValue);
  const resultType = getStringValue(row.resultType, row.type).toLowerCase();
  const numericResult =
    resultType === "numeric" ||
    resultType === "measurement" ||
    readings.some((value) => toFiniteNumberOrNull(value) !== null);

  const nominal = toFiniteNumberOrNull(
    firstDefined(row.nominal, row.expectedValue, specification.nominal),
  );
  const lsl = toFiniteNumberOrNull(
    firstDefined(row.lsl, row.lowerSpecLimit, specification.lsl),
  );
  const usl = toFiniteNumberOrNull(
    firstDefined(row.usl, row.upperSpecLimit, specification.usl),
  );
  const unit = getStringValue(row.unit, specification.unit);
  const precision = Number(
    firstDefined(
      row.precision,
      row.decimalPrecision,
      specification.decimalPrecision,
      3,
    ),
  );
  const specificationText = getStringValue(
    row.specificationDisplay,
    specification.display,
    specification.tolerance,
    typeof row.specification === "string" ? row.specification : "",
    row.tolerance,
    row.requirement,
  );

  return {
    id: checkpointId || `checkpoint-${index + 1}`,
    checkpointId: checkpointId || `checkpoint-${index + 1}`,
    balloon: getStringValue(
      row.balloon,
      row.balloonNumber,
      row.drawingBalloonNumber,
    ),
    name: getStringValue(row.characteristic, row.name, row.checkpointName),
    resultType: numericResult ? "numeric" : resultType || "binary",
    inspectionMethod: getStringValue(
      row.inspectionMethod,
      row.method,
      row.measurementMethod,
    ),
    nominal,
    tolerance: specificationText,
    specificationText,
    requirement: getStringValue(row.requirement, specificationText),
    lsl,
    usl,
    unit,
    precision: Number.isFinite(precision) ? precision : 3,
    readings,
    instrumentId: getStringValue(
      row.instrumentId,
      row.instrument,
      row.gaugeId,
      row.gauge,
    ),
    critical: Boolean(row.critical || row.isCritical || row.ctq),
    result: normalizeResult(row.result || row.status),
  };
};

const lastFiniteValue = (array, fallback = null) => {
  if (!Array.isArray(array)) return toFiniteNumberOrNull(fallback);
  for (let index = array.length - 1; index >= 0; index -= 1) {
    const numeric = toFiniteNumberOrNull(array[index]);
    if (numeric !== null) return numeric;
  }
  return toFiniteNumberOrNull(fallback);
};

const normalizeRules = (value) =>
  asArray(value)
    .map((rule) =>
      typeof rule === "string"
        ? rule
        : getStringValue(rule.message, rule.ruleName, rule.reason, rule.name),
    )
    .filter(Boolean);

const normalizeControlChart = (chart = {}, spcRow = {}, option = {}) => {
  const checkpointId = getStringValue(
    chart.checkpointId,
    spcRow.checkpointId,
    option.checkpointId,
  );
  if (!checkpointId) return null;

  const type = getStringValue(
    chart.type,
    chart.chartType,
    spcRow.spcMethod,
    option.spcMethod,
  );
  const compactType = type.toLowerCase().replace(/[^a-z0-9]/g, "");
  const isImr = compactType === "imr" || compactType === "xmr";
  const means = asArray(
    firstDefined(
      chart.xbarValues,
      chart.means,
      isImr ? chart.individualValues : undefined,
      chart.values,
    ),
  ).map(toFiniteNumberOrNull);
  const ranges = asArray(
    firstDefined(
      chart.rangeValues,
      chart.ranges,
      isImr ? chart.movingRangeValues : undefined,
    ),
  ).map(toFiniteNumberOrNull);
  const metadata = asArray(
    firstDefined(chart.subgroupMetadata, chart.metadata, chart.points),
  );
  const sourceLabels = asArray(chart.labels);
  const labels = means.map((_, index) => {
    const meta = metadata[index] || {};
    return getStringValue(
      sourceLabels[index],
      meta.axisLabel,
      meta.label,
      meta.subgroupId,
      meta.pointLabel,
      isImr ? `Reading ${index + 1}` : `SG-${index + 1}`,
    );
  });

  const subgroups = means.map((mean, index) => {
    const meta = metadata[index] || {};
    const rawReadings = asArray(
      firstDefined(meta.rawReadings, meta.readings, meta.allPieceValues),
    );
    return {
      id: getStringValue(meta.subgroupId, meta.id, labels[index]),
      label: labels[index],
      date: firstDefined(meta.collectedAt, meta.date, meta.measuredAt),
      readings: rawReadings.map(normalizeReadingValue),
      mean,
      range: ranges[index] ?? null,
      baselineVersion: firstDefined(
        meta.baselineVersion,
        chart.baselineVersions?.[index],
      ),
      batchNumber: getStringValue(meta.batchNumber, meta.batch, meta.lotNumber),
      inspectionRunId: getStringValue(
        meta.inspectionRunId,
        meta.runId,
        meta.reportRunId,
      ),
      inspector: getStringValue(meta.inspector, meta.inspectorName),
    };
  });

  const meanSignalIndexes = Array.from(
    new Set([
      ...asArray(chart.xbarOocIndexes),
      ...asArray(chart.oocIndexes),
      ...asArray(chart.meanSignalIndexes),
      ...asArray(chart.xbarPatternIndexes),
    ]),
  ).map(Number);
  const rangeSignalIndexes = Array.from(
    new Set([
      ...asArray(chart.rangeOocIndexes),
      ...asArray(chart.mrOocIndexes),
      ...asArray(chart.rangeSignalIndexes),
    ]),
  ).map(Number);

  return {
    id: checkpointId,
    checkpointId,
    name: getStringValue(
      chart.checkpointName,
      spcRow.characteristic,
      spcRow.checkpointName,
      option.label,
      checkpointId,
    ),
    unit: getStringValue(chart.unit, spcRow.unit),
    method:
      getStringValue(spcRow.spcMethod, option.spcMethod) ||
      (compactType.includes("xbarr") ? "X-bar R" : type || "SPC"),
    subgroupSize: firstDefined(chart.subgroupSize, spcRow.subgroupSize),
    subgroupCount: firstDefined(chart.subgroupCount, means.length),
    readingCount: firstDefined(
      spcRow.readingsAnalyzed,
      chart.readingCount,
      subgroups.reduce(
        (total, subgroup) => total + subgroup.readings.length,
        0,
      ),
    ),
    baselineStatus: getStringValue(chart.baselineStatus, spcRow.baselineStatus),
    baselineVersion: getStringValue(
      chart.baselineVersion,
      chart.activeBaselineVersion,
      spcRow.baselineVersion,
    ),
    limitsSource: getStringValue(chart.limitsSource, spcRow.limitsSource),
    center: lastFiniteValue(
      chart.xbarCenterSeries,
      firstDefined(chart.xbarCenterLine, chart.center, chart.centerLine),
    ),
    ucl: lastFiniteValue(
      chart.xbarUclSeries,
      firstDefined(chart.xbarUcl, chart.ucl),
    ),
    lcl: lastFiniteValue(
      chart.xbarLclSeries,
      firstDefined(chart.xbarLcl, chart.lcl),
    ),
    usl: toFiniteNumberOrNull(firstDefined(chart.usl, spcRow.usl)),
    lsl: toFiniteNumberOrNull(firstDefined(chart.lsl, spcRow.lsl)),
    rangeCenter: lastFiniteValue(
      firstDefined(chart.rangeCenterSeries, chart.mrCenterSeries),
      firstDefined(
        chart.rangeCenterLine,
        chart.rangeCenter,
        chart.rBar,
        chart.mrCenter,
      ),
    ),
    rangeUcl: lastFiniteValue(
      firstDefined(chart.rangeUclSeries, chart.mrUclSeries),
      firstDefined(chart.rangeUcl, chart.mrUcl),
    ),
    rangeLcl: lastFiniteValue(
      firstDefined(chart.rangeLclSeries, chart.mrLclSeries),
      firstDefined(chart.rangeLcl, chart.mrLcl, 0),
    ),
    cp: toFiniteNumberOrNull(firstDefined(spcRow.cp, chart.cp)),
    cpk: toFiniteNumberOrNull(firstDefined(spcRow.cpk, chart.cpk)),
    pp: toFiniteNumberOrNull(firstDefined(spcRow.pp, chart.pp)),
    ppk: toFiniteNumberOrNull(firstDefined(spcRow.ppk, chart.ppk)),
    stability: getStringValue(
      spcRow.stability,
      chart.status,
      chart.stability,
      "Insufficient data",
    ),
    capability: getStringValue(spcRow.capability, chart.capability),
    assessment: getStringValue(
      spcRow.assessment,
      chart.assessment,
      chart.statusMessage,
      chart.message,
    ),
    labels,
    means,
    ranges,
    meanSignalIndexes,
    rangeSignalIndexes,
    rules: normalizeRules(
      firstDefined(chart.rules, chart.violations, chart.signals),
    ),
    subgroups,
  };
};

const normalizeAlert = (alert = {}, index = 0) => ({
  id: getStringValue(alert.id, alert.alertId, alert._id, `alert-${index + 1}`),
  title: getStringValue(alert.title, alert.ruleName, alert.reason, "SPC alert"),
  description: getStringValue(alert.description, alert.message, alert.reason),
  severity: getStringValue(alert.severity, alert.type, "Information"),
  status: getStringValue(alert.status, alert.resolutionStatus, "OPEN"),
  checkpointName: getStringValue(alert.checkpointName, alert.characteristic),
  detectedAt: firstDefined(alert.detectedAt, alert.createdAt, alert.date),
  subgroup: getStringValue(alert.subgroupId, alert.pointLabel, alert.subgroup),
  value: toFiniteNumberOrNull(alert.value),
});

const normalizeReportData = ({
  apiReport = {},
  sourceRecord = {},
  reportOptions = {},
  additionalReports = [],
}) => {
  const header = apiReport.header || {};
  const pdiRows = asArray(apiReport.pdi?.rows || apiReport.pdiRows);
  const spcRows = asArray(apiReport.spc?.rows || apiReport.spcRows);
  const options = asArray(reportOptions.criticalCheckpointOptions);
  const reports = [apiReport, ...asArray(additionalReports)];
  const chartsByCheckpoint = new Map();

  reports.forEach((report) => {
    const chart = report?.selectedControlChart;
    if (!chart) return;
    const checkpointId = getStringValue(chart.checkpointId);
    const spcRow = spcRows.find(
      (row) => getStringValue(row.checkpointId) === checkpointId,
    );
    const option = options.find(
      (entry) => getStringValue(entry.checkpointId) === checkpointId,
    );
    const normalized = normalizeControlChart(chart, spcRow, option);
    if (normalized) chartsByCheckpoint.set(normalized.checkpointId, normalized);
  });

  options.forEach((option) => {
    const checkpointId = getStringValue(option.checkpointId);
    if (!checkpointId || chartsByCheckpoint.has(checkpointId)) return;
    const spcRow = spcRows.find(
      (row) => getStringValue(row.checkpointId) === checkpointId,
    );
    const normalized = normalizeControlChart(
      {
        checkpointId,
        checkpointName: option.label,
        type: option.spcMethod,
      },
      spcRow,
      option,
    );
    if (normalized) chartsByCheckpoint.set(checkpointId, normalized);
  });

  spcRows.forEach((row) => {
    const checkpointId = getStringValue(row.checkpointId);
    if (!checkpointId || chartsByCheckpoint.has(checkpointId)) return;
    const normalized = normalizeControlChart(
      {
        checkpointId,
        checkpointName: row.characteristic || row.checkpointName,
        type: row.spcMethod,
      },
      row,
      {},
    );
    if (normalized) chartsByCheckpoint.set(checkpointId, normalized);
  });

  const checkpoints = pdiRows.map(normalizePdiRow);
  chartsByCheckpoint.forEach((chart, checkpointId) => {
    const checkpoint = checkpoints.find((item) => item.id === checkpointId);
    if (!checkpoint) return;
    chart.name = chart.name || checkpoint.name;
    chart.unit = chart.unit || checkpoint.unit;
    chart.usl = chart.usl ?? checkpoint.usl;
    chart.lsl = chart.lsl ?? checkpoint.lsl;
  });

  const rawAlerts = asArray(
    firstDefined(
      apiReport.notifications,
      apiReport.alerts,
      apiReport.spcSignals,
      apiReport.spc?.alerts,
      apiReport.spc?.signals,
    ),
  );
  const alerts = rawAlerts.map(normalizeAlert);
  const finalDisposition =
    apiReport.finalDisposition || apiReport.disposition || {};
  const recommendation = getStringValue(
    finalDisposition.recommendation,
    finalDisposition.status,
    apiReport.pdi?.result,
  );
  const pdiResult = normalizeResult(recommendation);
  const rejectedQuantity = Number(
    firstDefined(
      finalDisposition.rejectedQuantity,
      finalDisposition.rejected,
      0,
    ),
  );
  const lotQuantity = firstDefined(
    header.lotQuantity,
    header.quantity,
    sourceRecord.lotQuantity,
  );
  const acceptedQuantity = firstDefined(
    finalDisposition.acceptedQuantity,
    finalDisposition.accepted,
    Number.isFinite(Number(lotQuantity))
      ? Math.max(Number(lotQuantity) - rejectedQuantity, 0)
      : null,
  );
  const inspectionDate = firstDefined(
    header.inspectionDate,
    apiReport.inspectionDate,
    sourceRecord.inspectionDate,
  );
  const chartDates = Array.from(chartsByCheckpoint.values())
    .flatMap((chart) => chart.subgroups || [])
    .map((subgroup) => subgroup.date)
    .filter(Boolean)
    .sort();
  const dateFrom = chartDates[0] || inspectionDate || "";
  const dateTo = chartDates.at(-1) || inspectionDate || "";

  return {
    document: {
      reportNumber: getStringValue(
        apiReport.reportNumber,
        header.reportNumber,
        sourceRecord.reportNumber,
      ),
      reportTitle: getStringValue(
        apiReport.reportTitle,
        "PDI & SPC INSPECTION REPORT",
      ),
      reportType: getStringValue(
        apiReport.reportType,
        "Final Inspection + Process Assurance",
      ),
      revision: getStringValue(apiReport.revision, header.reportRevision, "00"),
      templateCode: getStringValue(apiReport.templateCode, header.templateCode),
    },
    customer: {
      name: getStringValue(
        header.customer,
        header.customerName,
        sourceRecord.companyName,
      ),
      location: getStringValue(header.customerLocation, header.location),
      purchaseOrder: getStringValue(header.purchaseOrder, header.poNumber),
    },
    product: {
      itemCode: getStringValue(header.itemCode, sourceRecord.itemCode),
      itemName: getStringValue(header.itemName, sourceRecord.itemName),
      description: getStringValue(
        header.description,
        header.itemDescription,
        sourceRecord.itemDescription,
      ),
      drawingNumber: getStringValue(
        header.drawing,
        header.drawingNumber,
        sourceRecord.drawingTitle,
      ),
      drawingRevision: getStringValue(
        header.revision,
        header.drawingRevision,
        sourceRecord.drawingRevision,
      ),
      processName: getStringValue(
        header.process,
        header.processName,
        sourceRecord.processName,
      ),
    },
    inspection: {
      inspectionRunId: getStringValue(
        apiReport.inspectionRunId,
        header.inspectionRunId,
        sourceRecord.inspectionRunId,
      ),
      inspectionDate,
      inspector: getStringValue(header.inspector, sourceRecord.inspector),
      shift: getStringValue(header.shift, sourceRecord.shift),
      timeSlot: getStringValue(header.timeSlot, sourceRecord.timeSlot),
      batchNumber: getStringValue(
        header.batchNumber,
        header.batch,
        sourceRecord.batchNumber,
      ),
      lotQuantity,
      sampleQuantity: firstDefined(
        header.sampleQuantity,
        apiReport.pdi?.sampleQuantity,
        checkpoints.reduce(
          (maximum, checkpoint) =>
            Math.max(maximum, checkpoint.readings.length),
          0,
        ),
      ),
      machine: getStringValue(header.machine, sourceRecord.machine),
      line: getStringValue(header.line, sourceRecord.line),
      inspectionStage: getStringValue(header.inspectionStage, header.stage),
    },
    checkpoints,
    spcCharacteristics: Array.from(chartsByCheckpoint.values()),
    spcSignals: alerts,
    disposition: {
      pdiResult,
      processStatus: getStringValue(
        finalDisposition.processStatus,
        apiReport.spc?.status,
        apiReport.spc?.releaseRecommendation,
      ),
      lotDisposition: getStringValue(
        finalDisposition.status,
        finalDisposition.lotDisposition,
        finalDisposition.recommendation,
      ),
      acceptedQuantity,
      rejectedQuantity,
    },
    approvals: {
      preparedBy: getStringValue(
        apiReport.approvals?.preparedBy,
        header.inspector,
        sourceRecord.inspector,
      ),
      preparedRole: getStringValue(
        apiReport.approvals?.preparedRole,
        "QC Inspector",
      ),
      reviewedBy: getStringValue(apiReport.approvals?.reviewedBy),
      approvedBy: getStringValue(apiReport.approvals?.approvedBy),
    },
    spcDashboard: {
      summary: {
        totalSamples: checkpoints.reduce(
          (total, checkpoint) => total + checkpoint.readings.length,
          0,
        ),
        dateRange: {
          from: dateFrom ? String(dateFrom).slice(0, 10) : "",
          to: dateTo ? String(dateTo).slice(0, 10) : "",
        },
      },
      notifications: alerts,
    },
  };
};

const uniqueStrings = (values = []) =>
  Array.from(
    new Set(
      asArray(values)
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );

const sumFiniteNumbers = (values = []) => {
  const numbers = asArray(values).map(Number).filter(Number.isFinite);
  return numbers.length > 0
    ? numbers.reduce((total, value) => total + value, 0)
    : null;
};

const compactList = (values = [], limit = 3) => {
  const unique = uniqueStrings(values);
  if (unique.length <= limit) return unique.join(", ");
  return `${unique.slice(0, limit).join(", ")} +${unique.length - limit} more`;
};

const mergeReportOptions = (optionsList = []) => {
  const validOptions = asArray(optionsList).filter(Boolean);
  const first = validOptions[0] || {};
  const checkpointMap = new Map();

  validOptions.forEach((options) => {
    asArray(options.criticalCheckpointOptions).forEach((option) => {
      const checkpointId = getStringValue(option.checkpointId, option.id);
      if (!checkpointId || checkpointMap.has(checkpointId)) return;
      checkpointMap.set(checkpointId, option);
    });
  });

  return {
    ...first,
    criticalCheckpointOptions: Array.from(checkpointMap.values()),
    selectedCriticalCheckpointId: getStringValue(
      first.selectedCriticalCheckpointId,
      Array.from(checkpointMap.values())[0]?.checkpointId,
    ),
  };
};

const mergeSpcCharacteristics = (entries = []) => {
  const characteristicMap = new Map();
  const chronologicalEntries = [...asArray(entries)].sort(
    (a, b) =>
      new Date(a.run?.inspectionDate || 0).getTime() -
      new Date(b.run?.inspectionDate || 0).getTime(),
  );

  chronologicalEntries.forEach(({ data, run }) => {
    asArray(data?.spcCharacteristics).forEach((characteristic) => {
      const checkpointId = getStringValue(
        characteristic.checkpointId,
        characteristic.id,
      );
      if (!checkpointId) return;

      const existing = characteristicMap.get(checkpointId) || {
        latest: characteristic,
        points: new Map(),
        rules: new Set(),
        warningCount: 0,
      };

      existing.latest = characteristic;
      existing.warningCount += Number(characteristic.warningCount || 0);
      asArray(characteristic.rules).forEach((rule) => existing.rules.add(rule));

      asArray(characteristic.subgroups).forEach((subgroup, index) => {
        const originalId = String(
          subgroup?.id ||
            subgroup?.label ||
            characteristic.labels?.[index] ||
            `SG-${index + 1}`,
        );
        const date = subgroup?.date || "";
        const readings = asArray(subgroup?.readings);
        const mean = characteristic.means?.[index] ?? subgroup?.mean ?? null;
        const range = characteristic.ranges?.[index] ?? subgroup?.range ?? null;
        const subgroupBatch =
          subgroup?.batchNumber ||
          run?.batchNumber ||
          data?.inspection?.batchNumber ||
          "";
        const subgroupRunId =
          subgroup?.inspectionRunId ||
          run?.runKey ||
          data?.inspection?.inspectionRunId ||
          "";
        const signature = [
          originalId,
          date,
          readings.join(","),
          mean ?? "",
          range ?? "",
        ].join("::");

        if (existing.points.has(signature)) {
          const existingPoint = existing.points.get(signature);
          existingPoint.meanSignal =
            existingPoint.meanSignal ||
            asArray(characteristic.meanSignalIndexes).includes(index);
          existingPoint.rangeSignal =
            existingPoint.rangeSignal ||
            asArray(characteristic.rangeSignalIndexes).includes(index);
          return;
        }

        existing.points.set(signature, {
          sequence: existing.points.size,
          label:
            characteristic.labels?.[index] || subgroup?.label || originalId,
          subgroup: {
            ...subgroup,
            id: `${subgroupRunId || subgroupBatch || "run"}::${originalId}::${date || index}`,
            sourceSubgroupId: originalId,
            batchNumber: subgroupBatch,
            inspectionRunId: subgroupRunId,
            inspector: subgroup?.inspector || run?.inspector || "",
            mean,
            range,
          },
          mean,
          range,
          meanSignal: asArray(characteristic.meanSignalIndexes).includes(index),
          rangeSignal: asArray(characteristic.rangeSignalIndexes).includes(
            index,
          ),
        });
      });

      characteristicMap.set(checkpointId, existing);
    });
  });

  return Array.from(characteristicMap.entries()).map(
    ([checkpointId, container]) => {
      const points = Array.from(container.points.values()).sort((a, b) => {
        const aTime = new Date(a.subgroup.date || 0).getTime();
        const bTime = new Date(b.subgroup.date || 0).getTime();
        if (
          Number.isFinite(aTime) &&
          Number.isFinite(bTime) &&
          aTime !== bTime
        ) {
          return aTime - bTime;
        }
        return a.sequence - b.sequence;
      });

      const labels = points.map((point) => point.label);
      const means = points.map((point) => point.mean);
      const ranges = points.map((point) => point.range);
      const subgroups = points.map((point) => point.subgroup);
      const meanSignalIndexes = points.reduce((indexes, point, index) => {
        if (point.meanSignal) indexes.push(index);
        return indexes;
      }, []);
      const rangeSignalIndexes = points.reduce((indexes, point, index) => {
        if (point.rangeSignal) indexes.push(index);
        return indexes;
      }, []);

      return {
        ...container.latest,
        id: checkpointId,
        checkpointId,
        labels,
        means,
        ranges,
        subgroups,
        subgroupCount: subgroups.length,
        readingCount: subgroups.reduce(
          (total, subgroup) => total + asArray(subgroup.readings).length,
          0,
        ),
        latestSubgroupMean: lastFiniteValue(means),
        latestSubgroupRange: lastFiniteValue(ranges),
        meanSignalIndexes,
        rangeSignalIndexes,
        oocCount: meanSignalIndexes.length + rangeSignalIndexes.length,
        warningCount: container.warningCount,
        rules: Array.from(container.rules),
      };
    },
  );
};

const mergeNormalizedReports = (entries = []) => {
  const validEntries = asArray(entries).filter(
    (entry) => entry?.data && entry?.run,
  );
  if (validEntries.length === 0) return null;

  const chronologicalEntries = [...validEntries].sort(
    (a, b) =>
      new Date(a.run.inspectionDate || 0).getTime() -
      new Date(b.run.inspectionDate || 0).getTime(),
  );
  const latestEntry = chronologicalEntries.at(-1);
  const base = latestEntry.data;
  const checkpointMap = new Map();
  const batchCheckpoints = [];
  const selectedRuns = [];

  chronologicalEntries.forEach(({ data, run }) => {
    selectedRuns.push({
      runKey: run.runKey,
      inspectionRunId: run.inspectionRunId || run.runKey,
      representativeInspectionId: run.representativeInspectionId,
      batchNumber: run.batchNumber || data.inspection?.batchNumber || "",
      inspectionDate:
        run.inspectionDate || data.inspection?.inspectionDate || "",
      inspector: run.inspector || data.inspection?.inspector || "",
      shift: run.shift || data.inspection?.shift || "",
      timeSlot: run.timeSlot || data.inspection?.timeSlot || "",
      status: run.status || data.disposition?.pdiResult || "PENDING",
      reportNumber: run.reportNumber || data.document?.reportNumber || "",
      lotQuantity: firstDefined(run.lotQuantity, data.inspection?.lotQuantity),
      sampleQuantity: firstDefined(
        run.sampleQuantity,
        data.inspection?.sampleQuantity,
      ),
      checkpointCount: run.checkpointCount || data.checkpoints?.length || 0,
    });

    asArray(data.checkpoints).forEach((checkpoint) => {
      const sourceCheckpointId = checkpoint.sourceCheckpointId || checkpoint.id;
      if (!sourceCheckpointId) return;

      const existing = checkpointMap.get(sourceCheckpointId);
      if (!existing) {
        checkpointMap.set(sourceCheckpointId, {
          ...checkpoint,
          id: sourceCheckpointId,
          sourceCheckpointId,
          results: [checkpoint.result],
        });
      } else {
        existing.results.push(checkpoint.result);
        existing.critical = existing.critical || checkpoint.critical;
      }

      batchCheckpoints.push({
        ...checkpoint,
        id: `${run.runKey}::${sourceCheckpointId}`,
        sourceCheckpointId,
        batchNumber: run.batchNumber || data.inspection?.batchNumber || "",
        inspectionRunId: run.runKey,
        inspectionDate:
          run.inspectionDate || data.inspection?.inspectionDate || "",
        inspector: run.inspector || data.inspection?.inspector || "",
        shift: run.shift || data.inspection?.shift || "",
        reportNumber: run.reportNumber || data.document?.reportNumber || "",
      });
    });
  });

  const checkpoints = Array.from(checkpointMap.values()).map((checkpoint) => ({
    ...checkpoint,
    result: mergeRunStatus(checkpoint.results),
  }));

  const spcCharacteristics = mergeSpcCharacteristics(chronologicalEntries);
  const alertsMap = new Map();
  chronologicalEntries.forEach(({ data, run }) => {
    asArray(data.spcSignals).forEach((alert, index) => {
      const key = [alert.id, alert.detectedAt, run.runKey, index].join("::");
      if (!alertsMap.has(key)) {
        alertsMap.set(key, {
          ...alert,
          id: key,
          batchNumber: alert.batchNumber || run.batchNumber || "",
          inspectionRunId: alert.inspectionRunId || run.runKey,
        });
      }
    });
  });

  const batchNumbers = uniqueStrings(
    selectedRuns.map((run) => run.batchNumber),
  );
  const runIds = uniqueStrings(selectedRuns.map((run) => run.inspectionRunId));
  const inspectors = uniqueStrings(selectedRuns.map((run) => run.inspector));
  const shifts = uniqueStrings(selectedRuns.map((run) => run.shift));
  const timeSlots = uniqueStrings(selectedRuns.map((run) => run.timeSlot));
  const reportNumbers = uniqueStrings(
    selectedRuns.map((run) => run.reportNumber),
  );
  const dates = selectedRuns
    .map((run) => run.inspectionDate)
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const dateFrom = dates[0] || base.inspection?.inspectionDate || "";
  const dateTo = dates.at(-1) || base.inspection?.inspectionDate || "";
  const dispositions = chronologicalEntries.map(
    (entry) => entry.data.disposition || {},
  );
  const pdiResult = mergeRunStatus(dispositions.map((item) => item.pdiResult));
  const processStatuses = uniqueStrings(
    dispositions.map((item) => item.processStatus),
  );
  const lotDispositions = uniqueStrings(
    dispositions.map((item) => item.lotDisposition),
  );
  const totalSamples = batchCheckpoints.reduce(
    (total, checkpoint) => total + asArray(checkpoint.readings).length,
    0,
  );

  return {
    ...base,
    document: {
      ...base.document,
      reportTitle:
        selectedRuns.length > 1
          ? "MULTI-BATCH PDI & SPC INSPECTION REPORT"
          : base.document?.reportTitle,
      reportNumber:
        selectedRuns.length > 1
          ? `Combined report (${selectedRuns.length} runs)`
          : base.document?.reportNumber,
      reportNumbers,
    },
    inspection: {
      ...base.inspection,
      inspectionRunId: compactList(runIds),
      inspectionRunIds: runIds,
      inspectionDate: dateTo,
      inspectionDateFrom: dateFrom,
      inspectionDateTo: dateTo,
      inspector: compactList(inspectors),
      inspectors,
      shift: compactList(shifts),
      shifts,
      timeSlot: compactList(timeSlots),
      timeSlots,
      batchNumber: compactList(batchNumbers),
      batchNumbers,
      lotQuantity: sumFiniteNumbers(selectedRuns.map((run) => run.lotQuantity)),
      sampleQuantity:
        sumFiniteNumbers(selectedRuns.map((run) => run.sampleQuantity)) ??
        totalSamples,
      selectedRunCount: selectedRuns.length,
      selectedBatchCount: batchNumbers.length,
    },
    checkpoints,
    batchCheckpoints: batchCheckpoints.sort(
      (a, b) =>
        new Date(b.inspectionDate || 0).getTime() -
        new Date(a.inspectionDate || 0).getTime(),
    ),
    spcCharacteristics,
    spcSignals: Array.from(alertsMap.values()),
    selectedRuns: [...selectedRuns].sort(
      (a, b) =>
        new Date(b.inspectionDate || 0).getTime() -
        new Date(a.inspectionDate || 0).getTime(),
    ),
    disposition: {
      ...base.disposition,
      pdiResult,
      processStatus:
        processStatuses.length === 1
          ? processStatuses[0]
          : processStatuses.length > 1
            ? "Mixed see batch summary"
            : "",
      lotDisposition:
        lotDispositions.length === 1
          ? lotDispositions[0]
          : lotDispositions.length > 1
            ? "Multiple dispositions"
            : "",
      acceptedQuantity: sumFiniteNumbers(
        dispositions.map((item) => item.acceptedQuantity),
      ),
      rejectedQuantity: sumFiniteNumbers(
        dispositions.map((item) => item.rejectedQuantity),
      ),
    },
    spcDashboard: {
      ...base.spcDashboard,
      summary: {
        ...(base.spcDashboard?.summary || {}),
        totalInspections: selectedRuns.length,
        totalCheckpoints: checkpoints.length,
        totalSamples,
        dateRange: {
          from: dateFrom ? String(dateFrom).slice(0, 10) : "",
          to: dateTo ? String(dateTo).slice(0, 10) : "",
        },
      },
      notifications: Array.from(alertsMap.values()),
    },
  };
};

const mapWithConcurrency = async (items, concurrency, mapper) => {
  const source = asArray(items);
  const results = new Array(source.length);
  let nextIndex = 0;

  const workers = Array.from(
    { length: Math.min(Math.max(1, concurrency), source.length || 1) },
    async () => {
      while (nextIndex < source.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(
          source[currentIndex],
          currentIndex,
        );
      }
    },
  );

  await Promise.all(workers);
  return results;
};

const filterControlChartData = (
  characteristic,
  { selectedSubgroupIds = [], dateRange = {} } = {},
) => {
  if (!characteristic) return null;

  const selectedIds = new Set(
    asArray(selectedSubgroupIds).map((value) => String(value)),
  );
  const startTime = dateRange.start
    ? new Date(`${dateRange.start}T00:00:00`).getTime()
    : null;
  const endTime = dateRange.end
    ? new Date(`${dateRange.end}T23:59:59.999`).getTime()
    : null;

  const includedIndexes = asArray(characteristic.subgroups).reduce(
    (indexes, subgroup, originalIndex) => {
      const subgroupId = String(subgroup?.id || subgroup?.label || "");
      const label = String(characteristic.labels?.[originalIndex] || "");

      if (
        selectedIds.size > 0 &&
        !selectedIds.has(subgroupId) &&
        !selectedIds.has(label)
      ) {
        return indexes;
      }

      if (startTime || endTime) {
        if (!subgroup?.date) return indexes;
        const timestamp = new Date(subgroup.date).getTime();
        if (!Number.isFinite(timestamp)) return indexes;
        if (startTime && timestamp < startTime) return indexes;
        if (endTime && timestamp > endTime) return indexes;
      }

      indexes.push(originalIndex);
      return indexes;
    },
    [],
  );

  const originalToFiltered = new Map(
    includedIndexes.map((originalIndex, filteredIndex) => [
      originalIndex,
      filteredIndex,
    ]),
  );

  const remapIndexes = (indexes) =>
    asArray(indexes)
      .map(Number)
      .filter((index) => originalToFiltered.has(index))
      .map((index) => originalToFiltered.get(index));

  const subgroups = includedIndexes.map(
    (index) => characteristic.subgroups[index],
  );
  const labels = includedIndexes.map(
    (index) => characteristic.labels?.[index] || subgroups[index]?.label || "",
  );
  const means = includedIndexes.map((index) => characteristic.means?.[index]);
  const ranges = includedIndexes.map(
    (index) => characteristic.ranges?.[index] ?? null,
  );

  return {
    ...characteristic,
    labels,
    means,
    ranges,
    subgroups,
    subgroupCount: subgroups.length,
    readingCount: subgroups.reduce(
      (total, subgroup) => total + asArray(subgroup?.readings).length,
      0,
    ),
    meanSignalIndexes: remapIndexes(characteristic.meanSignalIndexes),
    rangeSignalIndexes: remapIndexes(characteristic.rangeSignalIndexes),
  };
};

const formatDate = (value, withTime = false) => {
  if (!value) return " ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  });
};

const formatNumber = (value, precision = 3) => {
  if (value === "" || value === null || value === undefined) return "”";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(precision) : "";
};

const getNumericSummary = (checkpoint) => {
  const values = asArray(checkpoint.readings)
    .map(Number)
    .filter(Number.isFinite);
  if (values.length === 0) return { average: null };
  return {
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
  };
};

const getPillClasses = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (
    ["PASS", "VALID", "STABLE", "CAPABLE", "CLOSED", "APPROVED"].includes(
      normalized,
    )
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (
    normalized.includes("FAIL") ||
    normalized.includes("REJECT") ||
    normalized.includes("CRITICAL") ||
    normalized.includes("OUT OF CONTROL") ||
    normalized.includes("UNSTABLE")
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
};

const StatusPill = ({ children, status = children }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${getPillClasses(
      status,
    )}`}
  >
    {children}
  </span>
);

const InformationCell = ({ label, value, wide = false }) => (
  <div className={`report-info-cell ${wide ? "report-info-cell-wide" : ""}`}>
    <span>{label}</span>
    <strong>
      {value !== null && value !== undefined && value !== "" ? value : ""}
    </strong>
  </div>
);

const SectionTitle = ({ code, title, icon: Icon }) => (
  <div className="report-section-title">
    <span className="report-section-icon">
      <Icon size={15} />
    </span>
    <span>
      {code}. {title}
    </span>
  </div>
);

const ReportHeader = ({ data }) => {
  const dateFrom = data?.inspection?.inspectionDateFrom;
  const dateTo = data?.inspection?.inspectionDateTo;
  const dateDisplay =
    dateFrom &&
    dateTo &&
    String(dateFrom).slice(0, 10) !== String(dateTo).slice(0, 10)
      ? `${formatDate(dateFrom)} “ ${formatDate(dateTo)}`
      : formatDate(dateTo || data?.inspection?.inspectionDate);
  const selectedRunCount = Number(data?.inspection?.selectedRunCount || 1);

  return (
    <>
      <div className="report-brand-row">
        <div className="flex items-center justify-center">
          <img
            src={logo}
            alt="HGP Tools Logo"
            className="max-h-14 max-w-48 object-contain"
          />
        </div>
        <div className="text-center">
          <h1>{data?.document?.reportTitle || "Inspection Report"}</h1>
          <p>{data?.document?.reportType || "Report"}</p>
        </div>
        <div className="report-result-box">
          <CheckCircle2 size={18} />
          <strong>{data?.disposition?.pdiResult || ""} (PDI)</strong>
          <span>{data?.disposition?.processStatus || "Status"}</span>
        </div>
      </div>

      <div className="report-info-grid">
        <InformationCell
          label="Report No."
          value={data?.document?.reportNumber}
        />
        <InformationCell label="Inspection Date(s)" value={dateDisplay} />
        <InformationCell
          label="Inspector(s)"
          value={data?.inspection?.inspector}
        />
        <InformationCell label="Customer" value={data?.customer?.name} />
        <InformationCell
          label="Part / Item Code"
          value={data?.product?.itemCode}
        />
        <InformationCell
          label="Total Lot Quantity"
          value={data?.inspection?.lotQuantity}
        />
        <InformationCell
          label="Description"
          value={data?.product?.description}
        />
        <InformationCell
          label="Total Sample Quantity"
          value={data?.inspection?.sampleQuantity}
        />
        <InformationCell label="Drawing" value={data?.product?.drawingNumber} />
        <InformationCell
          label="Revision"
          value={data?.product?.drawingRevision}
        />
        <InformationCell label="Process" value={data?.product?.processName} />
        <InformationCell
          label={selectedRunCount > 1 ? "Selected Batches" : "Batch / Lot"}
          value={data?.inspection?.batchNumber}
        />
        <InformationCell
          label="Machine / Line"
          value={[data?.inspection?.machine, data?.inspection?.line]
            .filter(Boolean)
            .join(" / ")}
        />
        <InformationCell
          label="Shift / Time Slot"
          value={[data?.inspection?.shift, data?.inspection?.timeSlot]
            .filter(Boolean)
            .join(" / ")}
        />
        <InformationCell
          label={selectedRunCount > 1 ? "Inspection Runs" : "Inspection Run"}
          value={data?.inspection?.inspectionRunId}
        />
      </div>
    </>
  );
};

const PdiResultsTable = ({ checkpoints }) => {
  if (!checkpoints?.length) {
    return <p className="text-sm text-slate-500">No checkpoints selected</p>;
  }

  const maxReadings = Math.max(
    1,
    ...checkpoints.map((checkpoint) => checkpoint.readings?.length || 0),
  );
  const showBatchColumns = checkpoints.some(
    (checkpoint) => checkpoint.batchNumber || checkpoint.inspectionRunId,
  );

  return (
    <div className="report-table-scroll overflow-hidden rounded-sm border border-slate-400">
      <table className="report-table pdi-table">
        <thead>
          <tr>
            <th rowSpan={2}>Sr.</th>
            {showBatchColumns && <th rowSpan={2}>Batch</th>}
            {showBatchColumns && <th rowSpan={2}>Inspection Date</th>}
            <th rowSpan={2} className="text-left">
              Characteristic
            </th>
            <th rowSpan={2}>Method</th>
            <th rowSpan={2}>Nominal / Requirement</th>
            <th rowSpan={2}>Tolerance / Limits</th>
            <th colSpan={maxReadings}>Selected Batch Observations</th>
            <th rowSpan={2}>Average</th>
            <th rowSpan={2}>Result</th>
          </tr>
          <tr>
            {Array.from({ length: maxReadings }, (_, index) => (
              <th key={`reading-${index}`}>R{index + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {checkpoints.map((checkpoint, index) => {
            const summary = getNumericSummary(checkpoint);
            const nominalText =
              checkpoint.resultType === "numeric"
                ? checkpoint.nominal !== null
                  ? `${formatNumber(checkpoint.nominal, checkpoint.precision)} ${
                      checkpoint.unit || ""
                    }`.trim()
                  : checkpoint.specificationText || ""
                : checkpoint.requirement || "";
            const limitText =
              checkpoint.resultType === "numeric"
                ? [
                    checkpoint.tolerance,
                    checkpoint.lsl !== null
                      ? `LSL ${formatNumber(checkpoint.lsl, checkpoint.precision)}`
                      : "",
                    checkpoint.usl !== null
                      ? `USL ${formatNumber(checkpoint.usl, checkpoint.precision)}`
                      : "",
                    checkpoint.unit,
                  ]
                    .filter(Boolean)
                    .join(" / ") || " "
                : checkpoint.requirement || "As specified";

            return (
              <tr key={checkpoint.id}>
                <td>{index + 1}</td>
                {showBatchColumns && (
                  <td className="font-semibold">
                    {checkpoint.batchNumber || ""}
                  </td>
                )}
                {showBatchColumns && (
                  <td>{formatDate(checkpoint.inspectionDate)}</td>
                )}
                <td className="text-left font-semibold">
                  <div className="flex items-center gap-1">
                    {checkpoint.balloon ? `${checkpoint.balloon}. ` : ""}
                    {checkpoint.name}
                    {checkpoint.critical && (
                      <span className="rounded bg-rose-100 px-1 py-0.5 text-[7px] font-bold text-rose-700">
                        CTQ
                      </span>
                    )}
                  </div>
                </td>
                <td>{checkpoint.inspectionMethod || ""}</td>
                <td>{nominalText}</td>
                <td>{limitText}</td>
                {Array.from({ length: maxReadings }, (_, readingIndex) => {
                  const reading = checkpoint.readings?.[readingIndex];
                  return (
                    <td key={`${checkpoint.id}-${readingIndex}`}>
                      {reading === undefined
                        ? ""
                        : checkpoint.resultType === "numeric"
                          ? formatNumber(reading, checkpoint.precision)
                          : String(reading)}
                    </td>
                  );
                })}
                <td>
                  {checkpoint.resultType === "numeric"
                    ? formatNumber(summary.average, checkpoint.precision)
                    : ""}
                </td>
                <td>
                  <StatusPill status={checkpoint.result}>
                    {checkpoint.result}
                  </StatusPill>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const CombinedXbarRChart = ({ characteristic, config }) => {
  if (!characteristic) return null;

  const methodKey = String(characteristic.method || "").toLowerCase();
  const isImr = methodKey.includes("i-mr") || methodKey.includes("imr");
  const showSignals = config.showSignals !== false;
  const hasRangeData = asArray(characteristic.ranges).some(
    (value) => toFiniteNumberOrNull(value) !== null,
  );

  const meanPointColors = asArray(characteristic.means).map((_, index) =>
    showSignals && characteristic.meanSignalIndexes?.includes(index)
      ? "#dc2626"
      : "#0284c7",
  );
  const rangePointColors = asArray(characteristic.ranges).map((_, index) =>
    showSignals && characteristic.rangeSignalIndexes?.includes(index)
      ? "#dc2626"
      : "#7c3aed",
  );

  const buildConstantSeries = (value) =>
    asArray(characteristic.labels).map(() => value ?? null);

  const meanData = {
    labels: characteristic.labels,
    datasets: [
      {
        label: isImr ? "Individual value" : "Subgroup mean",
        data: characteristic.means,
        borderColor: "#0284c7",
        pointBackgroundColor: meanPointColors,
        pointBorderColor: meanPointColors,
        pointRadius: meanPointColors.map((color) =>
          color === "#dc2626" ? 3.5 : 2,
        ),
        borderWidth: 1.5,
        tension: 0.18,
      },
      config.showUCL !== false && {
        label: "UCL",
        data: buildConstantSeries(characteristic.ucl),
        borderColor: "#dc2626",
        borderDash: [6, 4],
        borderWidth: 1.2,
        pointRadius: 0,
      },
      config.showCenterLine !== false && {
        label: "Center line",
        data: buildConstantSeries(characteristic.center),
        borderColor: "#f59e0b",
        borderDash: [4, 3],
        borderWidth: 1.2,
        pointRadius: 0,
      },
      config.showLCL !== false && {
        label: "LCL",
        data: buildConstantSeries(characteristic.lcl),
        borderColor: "#dc2626",
        borderDash: [6, 4],
        borderWidth: 1.2,
        pointRadius: 0,
      },
      config.showUSL !== false && {
        label: "USL",
        data: buildConstantSeries(characteristic.usl),
        borderColor: "#be123c",
        borderDash: [2, 4],
        borderWidth: 0.9,
        pointRadius: 0,
      },
      config.showLSL !== false && {
        label: "LSL",
        data: buildConstantSeries(characteristic.lsl),
        borderColor: "#be123c",
        borderDash: [2, 4],
        borderWidth: 0.9,
        pointRadius: 0,
      },
    ].filter(Boolean),
  };

  const rangeData = {
    labels: characteristic.labels,
    datasets: [
      {
        label: isImr ? "Moving range" : "Subgroup range",
        data: characteristic.ranges,
        borderColor: "#7c3aed",
        pointBackgroundColor: rangePointColors,
        pointBorderColor: rangePointColors,
        pointRadius: rangePointColors.map((color) =>
          color === "#dc2626" ? 3.5 : 2,
        ),
        borderWidth: 1.5,
        tension: 0.18,
      },
      config.showUCL !== false && {
        label: "R-UCL",
        data: buildConstantSeries(characteristic.rangeUcl),
        borderColor: "#dc2626",
        borderDash: [6, 4],
        borderWidth: 1.2,
        pointRadius: 0,
      },
      config.showCenterLine !== false && {
        label: "R center",
        data: buildConstantSeries(characteristic.rangeCenter),
        borderColor: "#10b981",
        borderDash: [4, 3],
        borderWidth: 1.2,
        pointRadius: 0,
      },
      config.showLCL !== false && {
        label: "R-LCL",
        data: buildConstantSeries(characteristic.rangeLcl),
        borderColor: "#dc2626",
        borderDash: [6, 4],
        borderWidth: 1.2,
        pointRadius: 0,
      },
    ].filter(Boolean),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { boxWidth: 10, boxHeight: 2, padding: 8, font: { size: 8 } },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 12,
          maxRotation: 0,
          font: { size: 8 },
        },
      },
      y: {
        grid: { color: "rgba(148, 163, 184, 0.16)" },
        ticks: { font: { size: 8 } },
      },
    },
  };

  return (
    <div className="combined-chart-shell">
      <div className="combined-chart-header">
        <div>
          <h3>
            {characteristic.method} Control Chart {characteristic.name}
          </h3>
          <p>
            {characteristic.subgroups.length} subgroup(s) n ={" "}
            {characteristic.subgroupSize || ""}
          </p>
        </div>
        <div className="text-right text-[9px] leading-4 text-slate-600">
          <div>Limits: {characteristic.limitsSource || ""}</div>
          <div>Current subgroup: {characteristic.labels?.at(-1) || ""}</div>
        </div>
      </div>

      <div className="chart-panel">
        <div className="chart-axis-label">{isImr ? "I" : "X-bar"}</div>
        <div className="h-[215px] flex-1">
          <Line data={meanData} options={options} />
        </div>
      </div>

      {hasRangeData && (
        <>
          <div className="chart-divider" />
          <div className="chart-panel">
            <div className="chart-axis-label">{isImr ? "MR" : "R"}</div>
            <div className="h-[170px] flex-1">
              <Line data={rangeData} options={options} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Footer = ({ data, page }) => (
  <div className="report-footer">
    <span>
      {data?.document?.templateCode || "TEMPLATE"} / Rev.{" "}
      {data?.document?.revision || "00"}
    </span>
    <span>
      {Number(data?.inspection?.selectedRunCount || 1) > 1
        ? `${data.inspection.selectedRunCount} selected inspection runs`
        : `Inspection Run: ${data?.inspection?.inspectionRunId || ""}`}
    </span>
    <span>Page {page}</span>
  </div>
);

const SignatureBlock = ({ label, name, role }) => (
  <div className="signature-block">
    <div className="signature-line" />
    <strong>{name || ""}</strong>
    <span>{role || ""}</span>
    <span>{label}</span>
  </div>
);

const RunCard = ({ run, selected, latest, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left transition last:border-b-0 sm:items-center sm:gap-4 sm:p-4 ${
      selected
        ? "bg-blue-50 ring-2 ring-inset ring-blue-500"
        : "bg-white hover:bg-slate-50"
    }`}
  >
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${
        selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
      }`}
    >
      {selected ? (
        <CheckSquare className="h-5 w-5" />
      ) : (
        <Square className="h-5 w-5" />
      )}
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="break-words font-bold text-slate-800">
          Batch {run.batchNumber || "Not recorded"}
        </span>
        {latest && (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
            LATEST
          </span>
        )}
        <StatusPill status={run.status}>{run.status}</StatusPill>
      </div>

      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-600 sm:text-sm">
        <span>{formatDate(run.inspectionDate, true)}</span>
        {run.shift && <span>Shift {run.shift}</span>}
        {run.inspector && <span>{run.inspector}</span>}
      </div>

      <div className="mt-1 break-all text-[11px] text-slate-400 sm:text-xs">
        {run.reportNumber || run.inspectionRunId || run.runKey}
      </div>
    </div>

    <div className="hidden min-w-28 text-right md:block">
      <div className="text-xs font-semibold text-slate-600">
        {run.checkpointCount || 0} checkpoint(s)
      </div>
      <div className="mt-1 text-xs text-slate-400">
        {run.timeSlot || "No time slot"}
      </div>
    </div>
  </button>
);

const GeneratePdiReport = ({
  apiBaseUrl = API_URL,
  pdiSampleLimit = 5,
  historyLimit = 500,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showGeneratedReport, setShowGeneratedReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [inspectionRecords, setInspectionRecords] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [reportOptions, setReportOptions] = useState({});
  const reportPrintAreaRef = useRef(null);
  const reportRequestIdRef = useRef(0);

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedDrawing, setSelectedDrawing] = useState("");
  const [selectedProcess, setSelectedProcess] = useState("");
  const [selectedRunIds, setSelectedRunIds] = useState([]);
  const [loadedRunIds, setLoadedRunIds] = useState([]);
  const [selectedRunCheckpointIds, setSelectedRunCheckpointIds] = useState([]);
  const [selectedCheckpoints, setSelectedCheckpoints] = useState([]);
  const [selectedCharacteristics, setSelectedCharacteristics] = useState([]);
  const [selectedSubgroups, setSelectedSubgroups] = useState([]);
  const [selectedAlerts, setSelectedAlerts] = useState([]);

  const [runSearch, setRunSearch] = useState("");
  const [runBatchFilter, setRunBatchFilter] = useState("");
  const [runStatusFilter, setRunStatusFilter] = useState("");
  const [runDateFilter, setRunDateFilter] = useState({ start: "", end: "" });
  const [runPage, setRunPage] = useState(1);

  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [viewingCheckpoint, setViewingCheckpoint] = useState(null);

  const [chartConfig, setChartConfig] = useState({
    showUCL: true,
    showLCL: true,
    showUSL: true,
    showLSL: true,
    showCenterLine: true,
    showSignals: true,
  });

  const [reportConfig, setReportConfig] = useState({
    includePDI: true,
    includeSPC: true,
    includeAlerts: true,
    includeChart: true,
  });

  const inspectionRequestControllerRef = useRef(null);
  const steps = [
    { id: 1, label: "Inspection Run" },
    { id: 2, label: "Checkpoints" },
    { id: 3, label: "Data & Filters" },
    { id: 4, label: "Configure Chart" },
    { id: 5, label: "Generate Report" },
  ];

  const fetchInspectionRecords = useCallback(async () => {
    inspectionRequestControllerRef.current?.abort();

    const controller = new AbortController();
    inspectionRequestControllerRef.current = controller;

    setLoading(true);
    setLoadError("");

    try {
      const PAGE_LIMIT = 200;
      const allInspectionDocuments = [];

      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(`${apiBaseUrl}/qc-inspection`, {
          params: {
            sortBy: "inspectionDate",
            sortOrder: "desc",
            page: currentPage,
            limit: PAGE_LIMIT,
          },
          withCredentials: true,
          signal: controller.signal,
          timeout: 30000,
        });

        if (response.data?.success === false) {
          throw new Error(
            response.data?.message || "Unable to load inspections",
          );
        }

        const pageRecords = extractCollection(response.data);

        allInspectionDocuments.push(...pageRecords);

        const pagination = response.data?.pagination;

        /*
         * Use backend pagination information when available.
         */
        if (pagination) {
          hasMore = Boolean(pagination.hasMore);

          if (hasMore) {
            const nextPage = Number(pagination.nextPage);

            currentPage =
              Number.isFinite(nextPage) && nextPage > currentPage
                ? nextPage
                : currentPage + 1;
          }
        } else {
          /*
           * Fallback for the old API response that does not return pagination.
           */
          hasMore = pageRecords.length === PAGE_LIMIT;
          currentPage += 1;
        }

        /*
         * Prevent an infinite loop if an API incorrectly says that
         * more records exist but returns an empty page.
         */
        if (pageRecords.length === 0) {
          hasMore = false;
        }
      }

      /*
       * Remove duplicate inspection documents.
       */
      const uniqueDocumentMap = new Map();

      allInspectionDocuments.forEach((record, index) => {
        const recordId = getIdValue(
          record?._id ||
            record?.id ||
            record?.inspectionId ||
            record?.sourceInspectionIds?.[0],
        );

        const uniqueKey =
          recordId ||
          `${record?.inspectionRunId || "run"}-${record?.batchNumber || "batch"}-${index}`;

        if (!uniqueDocumentMap.has(uniqueKey)) {
          uniqueDocumentMap.set(uniqueKey, record);
        }
      });

      const records = Array.from(uniqueDocumentMap.values())
        .filter((record) => !String(record?._id || "").startsWith("local-"))
        .map(normalizeInspectionRecord)
        .filter(
          (record) =>
            record.inspectionId && record.companyKey && record.itemKey,
        );

      setInspectionRecords(records);

      if (records.length === 0) {
        setLoadError(
          "No saved QC inspections are available for PDI reporting.",
        );
      }

      console.log("All inspection batches loaded", {
        documentsLoaded: allInspectionDocuments.length,
        uniqueDocuments: records.length,
        pagesLoaded: currentPage,
      });
    } catch (error) {
      if (error.code === "ERR_CANCELED" || error.name === "CanceledError") {
        return;
      }

      console.error("Error loading PDI inspection options:", error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to load QC inspection batches";

      setLoadError(message);
      setInspectionRecords([]);
      toast.error(message);
    } finally {
      if (inspectionRequestControllerRef.current === controller) {
        setLoading(false);
        inspectionRequestControllerRef.current = null;
      }
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchInspectionRecords();
  }, [fetchInspectionRecords]);

  const companies = useMemo(
    () =>
      uniqueOptions(
        inspectionRecords,
        (record) => record.companyKey,
        (record) => record.companyName,
      ),
    [inspectionRecords],
  );

  const companyRecords = useMemo(
    () =>
      inspectionRecords.filter(
        (record) => !selectedCompany || record.companyKey === selectedCompany,
      ),
    [inspectionRecords, selectedCompany],
  );

  const items = useMemo(
    () =>
      uniqueOptions(
        companyRecords,
        (record) => record.itemKey,
        (record) =>
          [record.itemCode, record.itemName, record.itemDescription]
            .filter(Boolean)
            .filter((value, index, values) => values.indexOf(value) === index)
            .join(""),
      ),
    [companyRecords],
  );

  const itemRecords = useMemo(
    () =>
      companyRecords.filter(
        (record) => !selectedItem || record.itemKey === selectedItem,
      ),
    [companyRecords, selectedItem],
  );

  const drawings = useMemo(
    () =>
      uniqueOptions(
        itemRecords,
        (record) => record.drawingKey,
        (record) => {
          const title = record.drawingTitle || "No drawing recorded";
          return record.drawingRevision
            ? `${title} Rev ${record.drawingRevision}`
            : title;
        },
      ),
    [itemRecords],
  );

  const drawingRecords = useMemo(
    () =>
      itemRecords.filter(
        (record) => !selectedDrawing || record.drawingKey === selectedDrawing,
      ),
    [itemRecords, selectedDrawing],
  );

  const processes = useMemo(
    () =>
      uniqueOptions(
        drawingRecords,
        (record) => record.processKey,
        (record) => record.processName || "No process recorded",
      ),
    [drawingRecords],
  );

  const processRecords = useMemo(
    () =>
      drawingRecords.filter(
        (record) => !selectedProcess || record.processKey === selectedProcess,
      ),
    [drawingRecords, selectedProcess],
  );

  const inspectionRuns = useMemo(
    () => groupInspectionRuns(processRecords),
    [processRecords],
  );

  const availableRunCheckpoints = useMemo(() => {
    const map = new Map();
    inspectionRuns.forEach((run) => {
      run.checkpointOptions.forEach((checkpoint) => {
        if (!map.has(checkpoint.id)) map.set(checkpoint.id, checkpoint);
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { numeric: true }),
    );
  }, [inspectionRuns]);

  const filteredInspectionRuns = useMemo(() => {
    const search = runSearch.trim().toLowerCase();
    const batchSearch = runBatchFilter.trim().toLowerCase();
    const startTime = runDateFilter.start
      ? new Date(`${runDateFilter.start}T00:00:00`).getTime()
      : null;
    const endTime = runDateFilter.end
      ? new Date(`${runDateFilter.end}T23:59:59.999`).getTime()
      : null;

    return inspectionRuns.filter((run) => {
      const runTime = new Date(run.inspectionDate || 0).getTime();

      if (startTime && (!Number.isFinite(runTime) || runTime < startTime)) {
        return false;
      }
      if (endTime && (!Number.isFinite(runTime) || runTime > endTime)) {
        return false;
      }
      if (runStatusFilter && run.status !== runStatusFilter) return false;
      if (
        batchSearch &&
        !String(run.batchNumber || "")
          .toLowerCase()
          .includes(batchSearch)
      ) {
        return false;
      }

      if (selectedRunCheckpointIds.length > 0 && run.checkpointIds.length > 0) {
        const runCheckpointSet = new Set(run.checkpointIds);
        const containsAllSelected = selectedRunCheckpointIds.every((id) =>
          runCheckpointSet.has(id),
        );
        if (!containsAllSelected) return false;
      }

      if (search) {
        const searchable = [
          run.batchNumber,
          run.reportNumber,
          run.inspectionRunId,
          run.inspector,
          run.shift,
          run.timeSlot,
          ...run.checkpointOptions.map((checkpoint) => checkpoint.label),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(search)) return false;
      }

      return true;
    });
  }, [
    inspectionRuns,
    runSearch,
    runBatchFilter,
    runStatusFilter,
    runDateFilter.start,
    runDateFilter.end,
    selectedRunCheckpointIds,
  ]);

  const totalRunPages = Math.max(
    1,
    Math.ceil(filteredInspectionRuns.length / RUNS_PER_PAGE),
  );

  const visibleInspectionRuns = useMemo(() => {
    const startIndex = (runPage - 1) * RUNS_PER_PAGE;
    return filteredInspectionRuns.slice(startIndex, startIndex + RUNS_PER_PAGE);
  }, [filteredInspectionRuns, runPage]);

  useEffect(() => {
    setRunPage(1);
  }, [
    runSearch,
    runBatchFilter,
    runStatusFilter,
    runDateFilter.start,
    runDateFilter.end,
    selectedRunCheckpointIds,
  ]);

  useEffect(() => {
    if (runPage > totalRunPages) setRunPage(totalRunPages);
  }, [runPage, totalRunPages]);

  const selectedInspectionRecords = useMemo(() => {
    const selectedSet = new Set(selectedRunIds);
    return inspectionRuns.filter((run) => selectedSet.has(run.runKey));
  }, [inspectionRuns, selectedRunIds]);

  const selectedBatchCount = useMemo(
    () =>
      uniqueStrings(
        selectedInspectionRecords.map((run) => run.batchNumber || run.runKey),
      ).length,
    [selectedInspectionRecords],
  );

  const selectedRunSelectionIsLoaded = useMemo(() => {
    if (
      selectedRunIds.length === 0 ||
      loadedRunIds.length !== selectedRunIds.length
    ) {
      return false;
    }
    const loadedSet = new Set(loadedRunIds);
    return selectedRunIds.every((runId) => loadedSet.has(runId));
  }, [loadedRunIds, selectedRunIds]);

  const clearLoadedReport = useCallback(({ keepStep = true } = {}) => {
    reportRequestIdRef.current += 1;
    setLoading(false);
    setLoadError("");
    setReportData(null);
    setReportOptions({});
    setLoadedRunIds([]);
    setSelectedCheckpoints([]);
    setSelectedCharacteristics([]);
    setSelectedSubgroups([]);
    setSelectedAlerts([]);
    setViewingCheckpoint(null);
    setDateRange({ start: "", end: "" });
    setShowGeneratedReport(false);
    if (!keepStep) setCurrentStep(1);
  }, []);

  const resetRunFilters = useCallback(() => {
    setRunSearch("");
    setRunBatchFilter("");
    setRunStatusFilter("");
    setRunDateFilter({ start: "", end: "" });
    setSelectedRunCheckpointIds([]);
  }, []);

  const resetBelowCompany = () => {
    setSelectedItem("");
    setSelectedDrawing("");
    setSelectedProcess("");
    setSelectedRunIds([]);
    resetRunFilters();
    clearLoadedReport({ keepStep: false });
  };

  const resetBelowItem = () => {
    setSelectedDrawing("");
    setSelectedProcess("");
    setSelectedRunIds([]);
    resetRunFilters();
    clearLoadedReport({ keepStep: false });
  };

  const resetBelowDrawing = () => {
    setSelectedProcess("");
    setSelectedRunIds([]);
    resetRunFilters();
    clearLoadedReport({ keepStep: false });
  };

  const resetBelowProcess = () => {
    setSelectedRunIds([]);
    resetRunFilters();
    clearLoadedReport({ keepStep: false });
  };

  const requestWithFallback = useCallback(async (requests) => {
    let lastError;
    for (const request of requests) {
      try {
        return await request();
      } catch (error) {
        lastError = error;
        if (![404, 405].includes(error.response?.status)) throw error;
      }
    }
    throw lastError;
  }, []);

  const fetchRunOptions = useCallback(
    async (run) => {
      const encodedRunId = encodeURIComponent(run.runKey);
      const encodedInspectionId = encodeURIComponent(
        run.representativeInspectionId,
      );

      const response = await requestWithFallback([
        () =>
          axios.get(
            `${apiBaseUrl}/qc-inspection/run/${encodedRunId}/report-options`,
            { withCredentials: true, timeout: 30000 },
          ),
        () =>
          axios.get(
            `${apiBaseUrl}/qc-inspection/${encodedInspectionId}/report-options`,
            { withCredentials: true, timeout: 30000 },
          ),
      ]);

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Unable to load report options",
        );
      }

      return response.data?.data || {};
    },
    [apiBaseUrl, requestWithFallback],
  );

  const fetchRunReport = useCallback(
    async (run, criticalCheckpointId) => {
      const encodedRunId = encodeURIComponent(run.runKey);
      const encodedInspectionId = encodeURIComponent(
        run.representativeInspectionId,
      );
      const requestConfig = {
        params: {
          criticalCheckpointId: criticalCheckpointId || undefined,
          pdiSampleLimit,
          historyLimit,
        },
        withCredentials: true,
        timeout: 30000,
      };

      const response = await requestWithFallback([
        () =>
          axios.get(
            `${apiBaseUrl}/qc-inspection/run/${encodedRunId}/report`,
            requestConfig,
          ),
        () =>
          axios.get(
            `${apiBaseUrl}/qc-inspection/${encodedInspectionId}/report`,
            requestConfig,
          ),
      ]);

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Unable to generate PDI report",
        );
      }

      return response.data?.data || {};
    },
    [apiBaseUrl, historyLimit, pdiSampleLimit, requestWithFallback],
  );

  const loadSelectedRunReports = useCallback(
    async ({ advanceToStep = false } = {}) => {
      if (selectedInspectionRecords.length === 0) {
        toast.error("Select at least one inspection batch");
        return false;
      }

      const requestId = reportRequestIdRef.current + 1;
      reportRequestIdRef.current = requestId;
      setLoading(true);
      setLoadError("");

      try {
        const loadedEntries = await mapWithConcurrency(
          selectedInspectionRecords,
          REPORT_REQUEST_CONCURRENCY,
          async (run) => {
            try {
              const options = await fetchRunOptions(run);
              const criticalOptions = asArray(
                options.criticalCheckpointOptions,
              );
              const defaultCheckpointId = getStringValue(
                options.selectedCriticalCheckpointId,
                criticalOptions[0]?.checkpointId,
              );
              const apiReport = await fetchRunReport(run, defaultCheckpointId);
              const normalized = normalizeReportData({
                apiReport,
                sourceRecord: run,
                reportOptions: options,
              });

              return { run, options, data: normalized };
            } catch (error) {
              const batchLabel = run.batchNumber || run.runKey;
              throw new Error(
                `Unable to load batch ${batchLabel}: ${
                  error.response?.data?.message || error.message
                }`,
              );
            }
          },
        );

        if (requestId !== reportRequestIdRef.current) return false;

        const mergedOptions = mergeReportOptions(
          loadedEntries.map((entry) => entry.options),
        );
        const mergedReport = mergeNormalizedReports(loadedEntries);
        if (!mergedReport) {
          throw new Error(
            "No report data was returned for the selected batches",
          );
        }

        const preferredCharacteristicId = getStringValue(
          mergedOptions.selectedCriticalCheckpointId,
        );
        const firstCharacteristicWithData = asArray(
          mergedReport.spcCharacteristics,
        ).find((characteristic) => characteristic.subgroups?.length > 0);
        const initialCharacteristicId = asArray(
          mergedReport.spcCharacteristics,
        ).some(
          (characteristic) => characteristic.id === preferredCharacteristicId,
        )
          ? preferredCharacteristicId
          : firstCharacteristicWithData?.id ||
            mergedReport.spcCharacteristics?.[0]?.id ||
            "";

        setReportOptions(mergedOptions);
        setReportData(mergedReport);
        setLoadedRunIds(selectedInspectionRecords.map((run) => run.runKey));
        setSelectedCheckpoints(
          mergedReport.checkpoints.map((checkpoint) => checkpoint.id),
        );
        setSelectedCharacteristics(
          initialCharacteristicId ? [initialCharacteristicId] : [],
        );
        setSelectedSubgroups([]);
        setSelectedAlerts([]);
        setDateRange({
          start: mergedReport.spcDashboard?.summary?.dateRange?.from || "",
          end: mergedReport.spcDashboard?.summary?.dateRange?.to || "",
        });

        if (advanceToStep) setCurrentStep(2);
        return true;
      } catch (error) {
        if (requestId !== reportRequestIdRef.current) return false;
        console.error("Error loading selected inspection batches:", error);
        const message =
          error.response?.data?.message ||
          error.message ||
          "Failed to load the selected inspection batches";
        setLoadError(message);
        setReportData(null);
        setLoadedRunIds([]);
        toast.error(message);
        return false;
      } finally {
        if (requestId === reportRequestIdRef.current) setLoading(false);
      }
    },
    [fetchRunOptions, fetchRunReport, selectedInspectionRecords],
  );

  const availableCheckpoints = useMemo(
    () => reportData?.checkpoints || [],
    [reportData],
  );

  const availableCharacteristics = useMemo(() => {
    if (selectedCheckpoints.length === 0) return [];
    return asArray(reportData?.spcCharacteristics).filter((characteristic) =>
      selectedCheckpoints.includes(characteristic.checkpointId),
    );
  }, [reportData, selectedCheckpoints]);

  const notifications = reportData?.spcDashboard?.notifications || [];

  const summary = useMemo(() => {
    const passed = filteredInspectionRuns.filter(
      (record) => record.status === "PASS",
    ).length;
    const failed = filteredInspectionRuns.filter(
      (record) => record.status === "FAIL",
    ).length;
    return {
      totalInspections: filteredInspectionRuns.length,
      totalPassed: passed,
      totalFailed: failed,
    };
  }, [filteredInspectionRuns]);

  const getSubgroupData = useCallback(
    (checkpointId) => {
      const characteristic = asArray(reportData?.spcCharacteristics).find(
        (item) =>
          item.checkpointId === checkpointId || item.id === checkpointId,
      );
      if (!characteristic) return [];

      const startTime = dateRange.start
        ? new Date(`${dateRange.start}T00:00:00`).getTime()
        : null;
      const endTime = dateRange.end
        ? new Date(`${dateRange.end}T23:59:59.999`).getTime()
        : null;

      return asArray(characteristic.subgroups).filter((subgroup) => {
        if (!startTime && !endTime) return true;
        if (!subgroup.date) return false;
        const timestamp = new Date(subgroup.date).getTime();
        if (!Number.isFinite(timestamp)) return false;
        if (startTime && timestamp < startTime) return false;
        if (endTime && timestamp > endTime) return false;
        return true;
      });
    },
    [dateRange.end, dateRange.start, reportData],
  );

  const toggleRunCheckpoint = (checkpointId) => {
    setSelectedRunCheckpointIds((previous) =>
      previous.includes(checkpointId)
        ? previous.filter((id) => id !== checkpointId)
        : [...previous, checkpointId],
    );
    setSelectedRunIds([]);
    clearLoadedReport({ keepStep: false });
  };

  const toggleRunSelection = (runKey) => {
    setSelectedRunIds((previous) =>
      previous.includes(runKey)
        ? previous.filter((id) => id !== runKey)
        : [...previous, runKey],
    );
    clearLoadedReport({ keepStep: false });
  };

  const selectVisibleRuns = () => {
    const visibleIds = visibleInspectionRuns.map((run) => run.runKey);
    setSelectedRunIds((previous) =>
      Array.from(new Set([...previous, ...visibleIds])),
    );
    clearLoadedReport({ keepStep: false });
  };

  const clearSelectedRuns = () => {
    setSelectedRunIds([]);
    clearLoadedReport({ keepStep: false });
  };

  const toggleCheckpoint = (checkpointId) => {
    setSelectedCheckpoints((previous) =>
      previous.includes(checkpointId)
        ? previous.filter((id) => id !== checkpointId)
        : [...previous, checkpointId],
    );
    setSelectedCharacteristics((previous) =>
      previous.filter((id) => id !== checkpointId),
    );
  };

  const toggleCharacteristic = (characteristicId) => {
    setSelectedCharacteristics((previous) =>
      previous.includes(characteristicId)
        ? previous.filter((id) => id !== characteristicId)
        : [...previous, characteristicId],
    );
  };

  const toggleSubgroup = (subgroupId) => {
    setSelectedSubgroups((previous) =>
      previous.includes(subgroupId)
        ? previous.filter((id) => id !== subgroupId)
        : [...previous, subgroupId],
    );
  };

  const toggleAlert = (alertId) => {
    setSelectedAlerts((previous) =>
      previous.includes(alertId)
        ? previous.filter((id) => id !== alertId)
        : [...previous, alertId],
    );
  };

  const generateReport = async () => {
    if (selectedInspectionRecords.length === 0 || !reportData) {
      toast.error("Select and load at least one inspection batch first");
      return;
    }
    if (!selectedRunSelectionIsLoaded) {
      toast.error(
        "The selected batches changed. Load them again before generating the report",
      );
      return;
    }
    if (selectedCheckpoints.length === 0) {
      toast.error("Select at least one PDI checkpoint");
      return;
    }

    const requestId = reportRequestIdRef.current + 1;
    reportRequestIdRef.current = requestId;
    setLoading(true);

    try {
      const characteristicIds = selectedCharacteristics.filter(Boolean);

      if (characteristicIds.length > 0) {
        const normalizedEntries = await mapWithConcurrency(
          selectedInspectionRecords,
          REPORT_REQUEST_CONCURRENCY,
          async (run) => {
            const reports = await mapWithConcurrency(
              characteristicIds,
              2,
              (checkpointId) => fetchRunReport(run, checkpointId),
            );

            if (reports.length === 0) {
              throw new Error(
                `No SPC report data was returned for batch ${
                  run.batchNumber || run.runKey
                }`,
              );
            }

            return {
              run,
              data: normalizeReportData({
                apiReport: reports[0],
                sourceRecord: run,
                reportOptions,
                additionalReports: reports.slice(1),
              }),
            };
          },
        );

        if (requestId !== reportRequestIdRef.current) return;
        const mergedReport = mergeNormalizedReports(normalizedEntries);
        if (!mergedReport) {
          throw new Error("No combined report data was returned");
        }
        setReportData(mergedReport);
      }

      if (requestId !== reportRequestIdRef.current) return;
      setShowGeneratedReport(true);
      setCurrentStep(5);
    } catch (error) {
      if (requestId !== reportRequestIdRef.current) return;
      console.error("Error generating multi-batch PDI report:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to generate the multi-batch report",
      );
    } finally {
      if (requestId === reportRequestIdRef.current) setLoading(false);
    }
  };

  const resetToStart = () => {
    setCurrentStep(1);
    setShowGeneratedReport(false);
    setSelectedCompany("");
    setSelectedItem("");
    setSelectedDrawing("");
    setSelectedProcess("");
    setSelectedRunIds([]);
    resetRunFilters();
    clearLoadedReport({ keepStep: false });
  };

  const handlePrint = () => {
    const printArea = reportPrintAreaRef.current;
    if (!printArea) return;

    const cleanup = () => {
      document.body.classList.remove("spc-print-all-pages");
      setIsPrinting(false);
    };

    cleanup();
    setIsPrinting(true);
    document.body.classList.add("spc-print-all-pages");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => window.print()),
    );
  };

  const Step1InspectionRun = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white sm:rounded-2xl sm:p-5 lg:p-6">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <div className="shrink-0 rounded-xl bg-white/20 p-2.5 sm:p-3">
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold leading-tight sm:text-2xl">
                Select Saved Inspection Batches
              </h3>
              <p className="mt-1 text-xs leading-5 text-blue-100 sm:text-sm">
                Select company, part, drawing, process and checkpoint. Then
                choose one or more inspection runs or batches for the combined
                report.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchInspectionRecords}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/25 disabled:opacity-50 sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Company <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCompany}
            onChange={(event) => {
              setSelectedCompany(event.target.value);
              resetBelowCompany();
            }}
            disabled={loading || companies.length === 0}
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:bg-slate-50"
          >
            <option value="">Select Company</option>
            {companies.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Item / Part <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedItem}
            onChange={(event) => {
              setSelectedItem(event.target.value);
              resetBelowItem();
            }}
            disabled={!selectedCompany || items.length === 0}
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:bg-slate-50"
          >
            <option value="">Select Item</option>
            {items.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Drawing / Revision <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedDrawing}
            onChange={(event) => {
              setSelectedDrawing(event.target.value);
              resetBelowDrawing();
            }}
            disabled={!selectedItem || drawings.length === 0}
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:bg-slate-50"
          >
            <option value="">Select Drawing</option>
            {drawings.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Process <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProcess}
            onChange={(event) => {
              setSelectedProcess(event.target.value);
              resetBelowProcess();
            }}
            disabled={!selectedDrawing || processes.length === 0}
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:bg-slate-50"
          >
            <option value="">Select Process</option>
            {processes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProcess && availableRunCheckpoints.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Ruler className="h-4 w-4 text-blue-600" />
                Checkpoint filter
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Select one or more checkpoints. Only runs containing all
                selected checkpoints are shown.
              </p>
            </div>
            {selectedRunCheckpointIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRunCheckpointIds([]);
                  setSelectedRunIds([]);
                  clearLoadedReport({ keepStep: false });
                }}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                Clear checkpoint filter
              </button>
            )}
          </div>

          <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
            {availableRunCheckpoints.map((checkpoint) => {
              const selected = selectedRunCheckpointIds.includes(checkpoint.id);
              return (
                <button
                  key={checkpoint.id}
                  type="button"
                  onClick={() => toggleRunCheckpoint(checkpoint.id)}
                  className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-left text-xs font-semibold transition ${
                    selected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-blue-300"
                  }`}
                >
                  {selected ? (
                    <CheckSquare className="h-3.5 w-3.5" />
                  ) : (
                    <Square className="h-3.5 w-3.5" />
                  )}
                  <span className="min-w-0 break-words">
                    {checkpoint.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedProcess && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-slate-800">
                Inspection runs
              </h4>
              <p className="text-xs text-slate-500">
                The newest runs appear first. Only 20 runs are displayed per
                page.
              </p>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {filteredInspectionRuns.length} matching run(s)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={runSearch}
                  onChange={(event) => setRunSearch(event.target.value)}
                  placeholder="Batch, run, report, inspector or checkpoint"
                  className="w-full rounded-xl border-2 border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Batch
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={runBatchFilter}
                  onChange={(event) => setRunBatchFilter(event.target.value)}
                  placeholder="Batch number"
                  className="w-full rounded-xl border-2 border-slate-200 py-2.5 pl-10 pr-4 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Status
              </label>
              <select
                value={runStatusFilter}
                onChange={(event) => setRunStatusFilter(event.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm"
              >
                <option value="">All statuses</option>
                <option value="PASS">Passed</option>
                <option value="FAIL">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetRunFilters}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <FilterX className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                From date
              </label>
              <input
                type="date"
                value={runDateFilter.start}
                onChange={(event) =>
                  setRunDateFilter((previous) => ({
                    ...previous,
                    start: event.target.value,
                  }))
                }
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                To date
              </label>
              <input
                type="date"
                value={runDateFilter.end}
                onChange={(event) =>
                  setRunDateFilter((previous) => ({
                    ...previous,
                    end: event.target.value,
                  }))
                }
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0 sm:flex-1">
              <span className="text-sm font-semibold text-slate-700">
                {selectedInspectionRecords.length} run(s) from{" "}
                {selectedBatchCount} batch(es) selected
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Select multiple rows to combine several batches in one report.
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={selectVisibleRuns}
                disabled={visibleInspectionRuns.length === 0}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-40"
              >
                Select this page
              </button>
              <button
                type="button"
                onClick={clearSelectedRuns}
                disabled={selectedRunIds.length === 0}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
              >
                Clear selected
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="max-h-[430px] overflow-y-auto">
              {visibleInspectionRuns.length > 0 ? (
                visibleInspectionRuns.map((run, index) => (
                  <RunCard
                    key={run.runKey}
                    run={run}
                    selected={selectedRunIds.includes(run.runKey)}
                    latest={runPage === 1 && index === 0 && !runSearch}
                    onSelect={() => toggleRunSelection(run.runKey)}
                  />
                ))
              ) : (
                <div className="p-10 text-center">
                  <ClipboardCheck className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    No matching inspection runs
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Change the checkpoint, date, batch, status or search filter.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-slate-500">
              Page {runPage} of {totalRunPages}
            </span>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                disabled={runPage <= 1}
                onClick={() => setRunPage((page) => Math.max(1, page - 1))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40 sm:w-auto"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={runPage >= totalRunPages}
                onClick={() =>
                  setRunPage((page) => Math.min(totalRunPages, page + 1))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40 sm:w-auto"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedInspectionRecords.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50 sm:rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 px-4 py-3">
            <div>
              <h4 className="text-sm font-bold text-blue-900">
                Selected batches / inspection runs
              </h4>
              <p className="text-xs text-blue-700">
                These {selectedInspectionRecords.length} runs will be combined
                into one PDI and SPC report.
              </p>
            </div>
            <StatusPill
              status={mergeRunStatus(
                selectedInspectionRecords.map((run) => run.status),
              )}
            >
              {mergeRunStatus(
                selectedInspectionRecords.map((run) => run.status),
              )}
            </StatusPill>
          </div>
          <div className="max-h-64 overflow-auto">
            <table className="min-w-[720px] text-sm">
              <thead className="sticky top-0 bg-blue-100 text-xs uppercase text-blue-800">
                <tr>
                  <th className="px-3 py-2 text-left">Batch</th>
                  <th className="px-3 py-2 text-left">Inspection date</th>
                  <th className="px-3 py-2 text-left">Run / report</th>
                  <th className="px-3 py-2 text-left">Inspector</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-center">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100 bg-white/70">
                {selectedInspectionRecords.map((run) => (
                  <tr key={run.runKey}>
                    <td className="px-3 py-2 font-semibold text-slate-800">
                      {run.batchNumber || ""}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {formatDate(run.inspectionDate, true)}
                    </td>
                    <td className="max-w-56 truncate px-3 py-2 text-slate-600">
                      {run.reportNumber || run.inspectionRunId || run.runKey}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {run.inspector || ""}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusPill status={run.status}>{run.status}</StatusPill>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleRunSelection(run.runKey)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                        aria-label={`Remove batch ${run.batchNumber || run.runKey}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5">
          <p className="text-xs font-medium uppercase text-slate-400">
            Matching Runs
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {summary.totalInspections}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 shadow-sm sm:rounded-2xl sm:p-5">
          <p className="text-xs font-medium uppercase text-blue-500">
            Selected Batches
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-800">
            {selectedBatchCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5">
          <p className="text-xs font-medium uppercase text-slate-400">Passed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {summary.totalPassed}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5">
          <p className="text-xs font-medium uppercase text-slate-400">Failed</p>
          <p className="mt-1 text-2xl font-bold text-rose-700">
            {summary.totalFailed}
          </p>
        </div>
        <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:col-span-1 sm:rounded-2xl sm:p-5">
          <p className="text-xs font-medium uppercase text-slate-400">
            Loaded Checkpoints
          </p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">
            {availableCheckpoints.length}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            selectedRunSelectionIsLoaded
              ? setCurrentStep(2)
              : loadSelectedRunReports({ advanceToStep: true })
          }
          disabled={loading || selectedInspectionRecords.length === 0}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8 sm:text-base"
        >
          {loading
            ? "Loading Selected Batches..."
            : selectedRunSelectionIsLoaded
              ? "Next: Select Checkpoints"
              : `Load ${selectedBatchCount} Batch${
                  selectedBatchCount === 1 ? "" : "es"
                } (${selectedInspectionRecords.length} run${
                  selectedInspectionRecords.length === 1 ? "" : "s"
                }) & Select Checkpoints`}
          <ChevronRight className="h-5 w-5 shrink-0" />
        </button>
      </div>
    </div>
  );

  const Step2CheckpointSelection = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white sm:rounded-2xl sm:p-5 lg:p-6">
        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
          <div className="shrink-0 rounded-xl bg-white/20 p-2.5 sm:p-3">
            <Ruler className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-bold leading-tight sm:text-2xl">
              Select Report Checkpoints
            </h3>
            <p className="mt-1 text-xs leading-5 text-indigo-100 sm:text-base">
              Choose PDI rows and SPC characteristics to include in the final
              report.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span className="self-start rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
          {selectedCheckpoints.length} of {availableCheckpoints.length}{" "}
          checkpoints selected
        </span>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <button
            type="button"
            onClick={() =>
              setSelectedCheckpoints(availableCheckpoints.map((cp) => cp.id))
            }
            className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 sm:px-4"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCheckpoints([]);
              setSelectedCharacteristics([]);
            }}
            className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:px-4"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ClipboardCheck className="h-4 w-4 text-blue-600" />
            PDI Checkpoints
          </h4>
          <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1 sm:pr-2">
            {availableCheckpoints.map((checkpoint) => {
              const selected = selectedCheckpoints.includes(checkpoint.id);
              return (
                <div
                  key={checkpoint.id}
                  className={`rounded-xl border-2 p-3 transition sm:p-4 ${
                    selected
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCheckpoint(checkpoint.id)}
                    >
                      {selected ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="break-words font-medium text-slate-800">
                          {checkpoint.balloon ? `${checkpoint.balloon}. ` : ""}
                          {checkpoint.name}
                        </span>
                        {checkpoint.critical && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            CTQ
                          </span>
                        )}
                        <StatusPill status={checkpoint.result}>
                          {checkpoint.result}
                        </StatusPill>
                      </div>
                      <div className="mt-1 break-words text-xs text-slate-500">
                        {[
                          checkpoint.inspectionMethod,
                          checkpoint.tolerance,
                          checkpoint.unit,
                        ]
                          .filter(Boolean)
                          .join("")}
                      </div>
                      {asArray(reportData?.spcCharacteristics).some(
                        (characteristic) =>
                          characteristic.checkpointId === checkpoint.id &&
                          characteristic.subgroups.length > 0,
                      ) && (
                        <button
                          type="button"
                          onClick={() => setViewingCheckpoint(checkpoint.id)}
                          className="mt-2 text-xs font-medium text-blue-600"
                        >
                          View subgroup data â†’
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            SPC Characteristics
          </h4>
          <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1 sm:pr-2">
            {availableCharacteristics.length > 0 ? (
              availableCharacteristics.map((characteristic) => {
                const selected = selectedCharacteristics.includes(
                  characteristic.id,
                );
                return (
                  <div
                    key={characteristic.id}
                    className={`rounded-xl border-2 p-3 transition sm:p-4 ${
                      selected
                        ? "border-purple-500 bg-purple-50"
                        : "border-slate-200 hover:border-purple-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleCharacteristic(characteristic.id)}
                      >
                        {selected ? (
                          <CheckSquare className="h-5 w-5 text-purple-600" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="break-words font-medium text-slate-800">
                            {characteristic.name}
                          </span>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                            {characteristic.method}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-500">
                          <span>
                            Cpk: <b>{formatNumber(characteristic.cpk, 2)}</b>
                          </span>
                          <span>
                            Cp: <b>{formatNumber(characteristic.cp, 2)}</b>
                          </span>
                          <span>
                            Subgroups: <b>{characteristic.subgroupCount}</b>
                          </span>
                          <span>
                            Stability: <b>{characteristic.stability}</b>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                Select a numeric checkpoint to see its SPC characteristic.
              </div>
            )}
          </div>
        </div>
      </div>

      {viewingCheckpoint && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 sm:rounded-2xl sm:p-5">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-blue-900">
              Subgroup Readings Preview
            </h4>
            <button
              type="button"
              onClick={() => setViewingCheckpoint(null)}
              className="rounded-lg bg-white p-2 text-blue-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-blue-200 bg-white">
            <table className="min-w-[540px] text-sm">
              <thead className="sticky top-0 bg-blue-100">
                <tr>
                  <th className="px-3 py-2 text-left">Subgroup</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Mean</th>
                  <th className="px-3 py-2">Range</th>
                </tr>
              </thead>
              <tbody>
                {getSubgroupData(viewingCheckpoint).map((subgroup) => (
                  <tr key={subgroup.id} className="border-t border-blue-100">
                    <td className="px-3 py-2 font-medium">{subgroup.id}</td>
                    <td className="px-3 py-2 text-center">
                      {formatDate(subgroup.date, true)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatNumber(subgroup.mean, 3)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatNumber(subgroup.range, 3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto sm:px-6"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedCheckpoints.length === 0) {
              toast.error("Please select at least one checkpoint");
              return;
            }
            setCurrentStep(3);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 sm:w-auto sm:px-6 md:px-8"
        >
          Next: Data & Filters
          <ChevronRight className="h-5 w-5 shrink-0" />
        </button>
      </div>
    </div>
  );

  const Step3DataFilters = () => {
    const subgroupCheckpointId =
      selectedCharacteristics[0] ||
      selectedCheckpoints.find((checkpointId) =>
        asArray(reportData?.spcCharacteristics).some(
          (characteristic) =>
            characteristic.checkpointId === checkpointId &&
            characteristic.subgroups.length > 0,
        ),
      ) ||
      "";
    const checkpointData = getSubgroupData(subgroupCheckpointId);

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white sm:rounded-2xl sm:p-5 lg:p-6">
          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
            <div className="shrink-0 rounded-xl bg-white/20 p-2.5 sm:p-3">
              <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold leading-tight sm:text-2xl">
                Data & Filters
              </h3>
              <p className="mt-1 text-xs leading-5 text-blue-100 sm:text-base">
                Limit the chart by historical date range and explicit subgroup
                selection.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(event) =>
                setDateRange((previous) => ({
                  ...previous,
                  start: event.target.value,
                }))
              }
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(event) =>
                setDateRange((previous) => ({
                  ...previous,
                  end: event.target.value,
                }))
              }
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm"
            />
          </div>
        </div>

        {checkpointData.length > 0 && (
          <div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-semibold text-slate-700">
                Subgroups ({checkpointData.length} available)
              </label>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedSubgroups(checkpointData.map((sg) => sg.id))
                  }
                  className="text-blue-600"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubgroups([])}
                  className="text-slate-500"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="max-h-[260px] divide-y divide-slate-100 overflow-y-auto rounded-xl border-2 border-slate-200">
              {checkpointData.map((subgroup) => {
                const selected = selectedSubgroups.includes(subgroup.id);
                return (
                  <button
                    type="button"
                    key={subgroup.id}
                    onClick={() => toggleSubgroup(subgroup.id)}
                    className={`flex w-full items-start gap-3 p-3 text-left sm:items-center ${
                      selected ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  >
                    {selected ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-1 text-xs sm:grid-cols-2 sm:gap-2 sm:text-sm lg:grid-cols-5">
                      <span className="break-all font-medium">
                        {subgroup.id}
                      </span>
                      <span>{formatDate(subgroup.date, true)}</span>
                      <span>Mean: {formatNumber(subgroup.mean, 3)}</span>
                      <span>Range: {formatNumber(subgroup.range, 3)}</span>
                      <span>n: {subgroup.readings.length}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {notifications.length > 0 && (
          <div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                SPC Alerts ({notifications.length})
              </label>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedAlerts(notifications.map((alert) => alert.id))
                  }
                  className="text-blue-600"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAlerts([])}
                  className="text-slate-500"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="max-h-[220px] space-y-2 overflow-y-auto">
              {notifications.map((alert) => {
                const selected = selectedAlerts.includes(alert.id);
                return (
                  <button
                    type="button"
                    key={alert.id}
                    onClick={() => toggleAlert(alert.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left ${
                      selected
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200"
                    }`}
                  >
                    {selected ? (
                      <CheckSquare className="mt-1 h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="mt-1 h-4 w-4 text-slate-400" />
                    )}
                    <div className="min-w-0">
                      <div className="break-words font-medium">
                        {alert.checkpointName || alert.title}
                      </div>
                      <div className="mt-1 break-words text-xs text-slate-500">
                        {alert.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold text-slate-700 sm:w-auto sm:px-6"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white sm:w-auto sm:px-8"
          >
            Next: Configure Chart
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  const Step4ConfigureChart = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white sm:rounded-2xl sm:p-5 lg:p-6">
        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
          <div className="shrink-0 rounded-xl bg-white/20 p-2.5 sm:p-3">
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-bold leading-tight sm:text-2xl">
              Configure Chart & Report
            </h3>
            <p className="mt-1 text-xs leading-5 text-blue-100 sm:text-base">
              Choose the lines and report sections to print.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <div className="rounded-xl border-2 border-slate-200 p-4 sm:rounded-2xl sm:p-6">
          <h4 className="mb-4 font-semibold text-slate-700">
            Chart Configuration
          </h4>
          <div className="space-y-3">
            {[
              ["showUCL", "Show UCL"],
              ["showLCL", "Show LCL"],
              ["showUSL", "Show USL"],
              ["showLSL", "Show LSL"],
              ["showCenterLine", "Show Center Line"],
              ["showSignals", "Highlight Signals"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={chartConfig[key]}
                  onChange={(event) =>
                    setChartConfig((previous) => ({
                      ...previous,
                      [key]: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border-2 border-slate-200 p-4 sm:rounded-2xl sm:p-6">
          <h4 className="mb-4 font-semibold text-slate-700">Report Sections</h4>
          <div className="space-y-3">
            {[
              ["includePDI", "Include PDI Results"],
              ["includeSPC", "Include SPC Summary"],
              ["includeChart", "Include Control Chart"],
              ["includeAlerts", "Include Alerts Summary"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={reportConfig[key]}
                  onChange={(event) =>
                    setReportConfig((previous) => ({
                      ...previous,
                      [key]: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>

        <button
          type="button"
          onClick={generateReport}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-purple-700 sm:w-auto"
        >
          <Eye className="h-5 w-5" />
          Generate Report
        </button>
      </div>
    </div>
  );

  const Step5GeneratedReport = () => {
    if (!reportData) return null;

    const pdiRows =
      asArray(reportData.batchCheckpoints).length > 0
        ? asArray(reportData.batchCheckpoints)
        : asArray(reportData.checkpoints).map((checkpoint) => ({
            ...checkpoint,
            sourceCheckpointId: checkpoint.id,
            batchNumber: reportData.inspection?.batchNumber || "",
            inspectionRunId: reportData.inspection?.inspectionRunId || "",
            inspectionDate: reportData.inspection?.inspectionDate || "",
          }));

    const filteredData = {
      ...reportData,
      checkpointDefinitions: asArray(reportData.checkpoints).filter(
        (checkpoint) => selectedCheckpoints.includes(checkpoint.id),
      ),
      checkpoints: pdiRows.filter((checkpoint) =>
        selectedCheckpoints.includes(
          checkpoint.sourceCheckpointId || checkpoint.id,
        ),
      ),
      spcCharacteristics: asArray(reportData.spcCharacteristics).filter(
        (characteristic) => selectedCharacteristics.includes(characteristic.id),
      ),
      spcSignals: asArray(reportData.spcSignals).filter(
        (signal) =>
          selectedAlerts.length === 0 || selectedAlerts.includes(signal.id),
      ),
    };

    const selectedChartCharacteristic = filterControlChartData(
      filteredData.spcCharacteristics[0],
      { selectedSubgroupIds: selectedSubgroups, dateRange },
    );

    const pdiSummary = {
      total: filteredData.checkpoints.length,
      passed: filteredData.checkpoints.filter((cp) => cp.result === "PASS")
        .length,
      failed: filteredData.checkpoints.filter((cp) => cp.result === "FAIL")
        .length,
    };
    const selectedRuns = asArray(filteredData.selectedRuns);
    const batchCount = Number(
      filteredData.inspection?.selectedBatchCount ||
        uniqueStrings(selectedRuns.map((run) => run.batchNumber)).length ||
        1,
    );

    return (
      <div
        ref={reportPrintAreaRef}
        id="spc-report-print-area"
        className="space-y-4 sm:space-y-6"
      >
        <div className="no-print rounded-xl border border-blue-200 bg-blue-50 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0 sm:flex-1">
              <h3 className="flex items-start gap-2 text-base font-bold text-blue-900 sm:items-center sm:text-lg">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 sm:mt-0" />{" "}
                Generated Multi-Batch Report
              </h3>
              <p className="mt-1 text-xs leading-5 text-blue-700 sm:text-sm">
                {selectedRuns.length || 1} inspection run(s), {batchCount}{" "}
                batch(es), {filteredData.checkpoints.length} PDI row(s) and{" "}
                {filteredData.spcCharacteristics.length} SPC characteristic(s)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={resetToStart}
                className="rounded-lg bg-slate-600 px-4 py-2.5 text-sm font-bold text-white"
              >
                Start New
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white"
              >
                <Printer className="h-4 w-4" /> Print All
              </button>
            </div>
          </div>
        </div>

        <div className="report-page" data-page="1">
          <ReportHeader data={filteredData} />

          {reportConfig.includePDI && (
            <>
              <SectionTitle
                code="A"
                title="Selected Batch PDI Results"
                icon={ClipboardCheck}
              />
              <PdiResultsTable checkpoints={filteredData.checkpoints} />
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  ["PDI Rows", pdiSummary.total],
                  ["Passed", pdiSummary.passed],
                  ["Failed", pdiSummary.failed],
                ].map(([label, value]) => (
                  <div key={label} className="report-summary-card">
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <SectionTitle
            code="B"
            title="Batch & Run Traceability"
            icon={FileCheck2}
          />
          {selectedRuns.length > 1 ? (
            <div className="report-table-scroll">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Sr.</th>
                    <th>Batch</th>
                    <th>Inspection Date</th>
                    <th className="text-left">Inspection Run / Report</th>
                    <th>Inspector</th>
                    <th>Shift</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRuns.map((run, index) => (
                    <tr key={run.runKey || run.inspectionRunId || index}>
                      <td>{index + 1}</td>
                      <td className="font-semibold">
                        {run.batchNumber || ""}
                      </td>
                      <td>{formatDate(run.inspectionDate, true)}</td>
                      <td className="text-left">
                        {run.reportNumber ||
                          run.inspectionRunId ||
                          run.runKey ||
                          ""}
                      </td>
                      <td>{run.inspector || ""}</td>
                      <td>{run.shift || run.timeSlot || ""}</td>
                      <td>
                        <StatusPill status={run.status}>
                          {run.status}
                        </StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="report-info-grid compact-info-grid">
              <InformationCell
                label="Inspection Run"
                value={filteredData.inspection.inspectionRunId}
                wide
              />
              <InformationCell
                label="PO Number"
                value={filteredData.customer.purchaseOrder}
              />
              <InformationCell
                label="Batch"
                value={filteredData.inspection.batchNumber}
              />
              <InformationCell
                label="Inspector"
                value={filteredData.inspection.inspector}
              />
              <InformationCell
                label="Shift"
                value={filteredData.inspection.shift}
              />
            </div>
          )}

          <SectionTitle
            code="C"
            title="Combined Lot Disposition"
            icon={ShieldCheck}
          />
          <div className="disposition-panel">
            <div>
              <span>PDI Result</span>
              <strong>{filteredData.disposition.pdiResult || ""}</strong>
            </div>
            <div>
              <span>Process Status</span>
              <strong>{filteredData.disposition.processStatus || ""}</strong>
            </div>
            <div>
              <span>Lot Disposition</span>
              <strong>
                {filteredData.disposition.lotDisposition || ""}
              </strong>
            </div>
            <div>
              <span>Total Accepted / Rejected</span>
              <strong>
                {filteredData.disposition.acceptedQuantity ?? 0} /{" "}
                {filteredData.disposition.rejectedQuantity ?? 0}
              </strong>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-3 sm:gap-5">
            <SignatureBlock
              label="Prepared By"
              name={filteredData.approvals.preparedBy}
              role={filteredData.approvals.preparedRole}
            />
            <SignatureBlock
              label="Checked By"
              name="Sanjay Arya"
              role="Production Supervisor"
            />
            <SignatureBlock
              label="Approved By"
              name="Tarundeep Singh"
              role="Quality Manager"
            />
          </div>
          <Footer data={filteredData} page={1} />
        </div>

        {reportConfig.includeSPC &&
          filteredData.spcCharacteristics.length > 0 && (
            <div className="report-page print-page-break" data-page="2">
              <ReportHeader data={filteredData} />
              <SectionTitle
                code="D"
                title="SPC Process Assurance Summary"
                icon={Activity}
              />
              <div className="report-table-scroll">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th className="text-left">Characteristic</th>
                      <th>SPC Method</th>
                      <th>Subgroup Size</th>
                      <th>Selected Points</th>
                      <th>Stability</th>
                      <th className="text-left">Assessment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.spcCharacteristics.map((characteristic) => (
                      <tr key={characteristic.id}>
                        <td className="text-left font-semibold">
                          {characteristic.name}
                        </td>
                        <td>{characteristic.method}</td>
                        <td>{characteristic.subgroupSize || ""}</td>
                        <td>{characteristic.subgroupCount || 0}</td>
                        <td>
                          <StatusPill status={characteristic.stability}>
                            {characteristic.stability}
                          </StatusPill>
                        </td>
                        <td className="text-left">
                          {characteristic.assessment || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {reportConfig.includeChart && selectedChartCharacteristic && (
                <>
                  <SectionTitle
                    code="E"
                    title="Selected Multi-Batch Control Chart"
                    icon={BarChart3}
                  />
                  {selectedChartCharacteristic.subgroups.length > 0 ? (
                    <CombinedXbarRChart
                      characteristic={selectedChartCharacteristic}
                      config={chartConfig}
                    />
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      No chart points match the selected subgroup(s) and date
                      range.
                    </div>
                  )}
                </>
              )}

              {reportConfig.includeAlerts &&
                filteredData.spcSignals.length > 0 && (
                  <>
                    <SectionTitle
                      code="F"
                      title="SPC Alerts"
                      icon={AlertTriangle}
                    />
                    <div className="report-table-scroll">
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>Batch</th>
                            <th>Checkpoint</th>
                            <th>Alert</th>
                            <th>Status</th>
                            <th>Detected</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.spcSignals.map((alert) => (
                            <tr key={alert.id}>
                              <td>{alert.batchNumber || ""}</td>
                              <td>{alert.checkpointName || ""}</td>
                              <td className="text-left">
                                {alert.description || alert.title}
                              </td>
                              <td>{alert.status}</td>
                              <td>{formatDate(alert.detectedAt, true)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

              <Footer data={filteredData} page={2} />
            </div>
          )}

        {selectedSubgroups.length > 0 && selectedChartCharacteristic && (
          <div className="report-page print-page-break" data-page="3">
            <ReportHeader data={filteredData} />
            <SectionTitle
              code="G"
              title="Selected Subgroup Details"
              icon={Layers3}
            />
            <div className="report-table-scroll">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Subgroup</th>
                    <th>Date</th>
                    <th>Readings</th>
                    <th>Mean</th>
                    <th>Range</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedChartCharacteristic.subgroups.map((subgroup) => (
                    <tr key={subgroup.id}>
                      <td>{subgroup.batchNumber || ""}</td>
                      <td className="font-semibold">
                        {subgroup.sourceSubgroupId ||
                          subgroup.label ||
                          subgroup.id}
                      </td>
                      <td>{formatDate(subgroup.date, true)}</td>
                      <td>
                        {subgroup.readings
                          .map((value) => formatNumber(value, 3))
                          .join(", ") || ""}
                      </td>
                      <td>{formatNumber(subgroup.mean, 3)}</td>
                      <td>{formatNumber(subgroup.range, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Footer data={filteredData} page={3} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`responsive-shell min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 text-slate-900 ${
        isPrinting ? "print-mode" : ""
      }`}
    >
      {loading && (
        <div className="no-print fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/25 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-sm rounded-2xl bg-white px-5 py-4 shadow-2xl sm:w-auto sm:px-6 sm:py-5">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Loading inspection data...
            </div>
          </div>
        </div>
      )}

      <div className="no-print sticky top-0 z-5 mb-4 border-b border-slate-200 bg-white/95 shadow-md backdrop-blur sm:mb-6">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2 shadow-lg">
              <FileText className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-blue-700 sm:text-lg">
                PDI & SPC Report Generator
              </h2>
              <p className="truncate text-[11px] text-slate-500 sm:text-xs">
                Searchable, batch-friendly inspection run selection
              </p>
            </div>
          </div>

          <div className="responsive-stepper flex w-full items-center justify-center gap-1 overflow-x-auto pb-1 sm:gap-2 lg:w-auto lg:justify-end lg:pb-0">
            {steps.map((step, index) => {
              const active = index + 1 === currentStep;
              const completed = index + 1 < currentStep;

              return (
                <React.Fragment key={step.id}>
                  <div
                    title={step.label}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9 ${
                      active
                        ? "bg-blue-600 text-white ring-4 ring-blue-500/20"
                        : completed
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {completed ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-4 shrink-0 sm:w-6 ${completed ? "bg-emerald-500" : "bg-slate-200"}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1500px] p-3 sm:p-4 lg:p-6 print:max-w-none print:p-0">
        {!showGeneratedReport ? (
          <div className="rounded-xl bg-white/90 p-3 shadow-xl sm:rounded-2xl sm:p-5 lg:p-6">
            <div className="mb-4 flex items-center gap-3 sm:mb-6">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white sm:h-10 sm:w-10">
                {currentStep}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 sm:text-lg">
                  {steps[currentStep - 1]?.label}
                </h3>
                <p className="text-xs text-slate-500">
                  Step {currentStep} of {steps.length}
                </p>
              </div>
            </div>


            {currentStep === 1 && <Step1InspectionRun />}
            {currentStep === 2 && <Step2CheckpointSelection />}
            {currentStep === 3 && <Step3DataFilters />}
            {currentStep === 4 && <Step4ConfigureChart />}
          </div>
        ) : (
          <Step5GeneratedReport />
        )}
      </main>

      <style>{`
        .responsive-shell,
        .responsive-shell * { box-sizing: border-box; }
        .responsive-stepper { scrollbar-width: none; }
        .responsive-stepper::-webkit-scrollbar { display: none; }
        .report-page {
          position: relative;
          width: 100%;
          min-height: 297mm;
          background: white;
          padding: 10mm 9mm 14mm;
          border: 1px solid #cbd5e1;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          font-family: Arial, Helvetica, sans-serif;
        }
        .report-brand-row {
          display: grid;
          grid-template-columns: 1fr 1.55fr 0.72fr;
          align-items: stretch;
          border: 1px solid #334155;
        }
        .report-brand-row > div { padding: 8px 10px; }
        .report-brand-row > div + div { border-left: 1px solid #334155; }
        .report-brand-row h1 { margin: 0; color: #0f3d7a; font-size: 17px; font-weight: 900; }
        .report-brand-row p { margin: 4px 0 0; font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .report-result-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; background: #ecfdf5; color: #047857; text-align: center; }
        .report-result-box strong { font-size: 11px; }
        .report-result-box span { font-size: 7px; color: #92400e; font-weight: 800; }
        .report-info-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-left: 1px solid #94a3b8; border-top: 1px solid #94a3b8; margin-top: 7px; }
        .compact-info-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .report-info-cell-wide { grid-column: span 2; }
        .report-info-cell { display: grid; grid-template-columns: 43% 57%; min-height: 25px; border-right: 1px solid #94a3b8; border-bottom: 1px solid #94a3b8; font-size: 8px; }
        .report-info-cell span, .report-info-cell strong { display: flex; align-items: center; padding: 4px 5px; }
        .report-info-cell span { background: #f1f5f9; color: #334155; font-weight: 700; border-right: 1px solid #cbd5e1; }
        .report-info-cell strong { min-width: 0; overflow-wrap: anywhere; font-weight: 600; color: #0f172a; }
        .report-section-title { display: flex; align-items: center; gap: 6px; margin: 11px 0 5px; border-bottom: 2px solid #164e86; padding-bottom: 4px; color: #0f3d7a; font-size: 10px; font-weight: 900; text-transform: uppercase; }
        .report-section-icon { display: inline-flex; }
        .report-table { width: 100%; border-collapse: collapse; color: #0f172a; font-size: 7.5px; }
        .report-table-scroll { width: 100%; max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch; }
        .report-table th, .report-table td { border: 1px solid #94a3b8; padding: 3px; text-align: center; vertical-align: middle; line-height: 1.25; }
        .report-table thead th { background: #eaf2fb; color: #0f3d7a; font-weight: 900; }
        .report-table tbody tr:nth-child(even) { background: #f8fafc; }
        .pdi-table { font-size: 7px; }
        .report-summary-card { min-height: 49px; border: 1px solid #cbd5e1; background: #f8fafc; padding: 6px; text-align: center; }
        .report-summary-card strong { display: block; color: #0f3d7a; font-size: 15px; }
        .report-summary-card span { display: block; margin-top: 4px; color: #475569; font-size: 7px; font-weight: 800; text-transform: uppercase; }
        .disposition-panel { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid #0f766e; background: #f0fdfa; }
        .disposition-panel > div { padding: 8px; border-right: 1px solid #99f6e4; }
        .disposition-panel > div:last-child { border-right: 0; }
        .disposition-panel span { display: block; color: #475569; font-size: 7px; font-weight: 800; text-transform: uppercase; }
        .disposition-panel strong { display: block; margin-top: 3px; font-size: 9px; }
        .signature-block { text-align: center; color: #334155; }
        .signature-line { height: 22px; border-bottom: 1px solid #64748b; margin-bottom: 5px; }
        .signature-block strong, .signature-block span { display: block; }
        .signature-block strong { font-size: 9px; color: #0f172a; }
        .signature-block span { margin-top: 2px; font-size: 7px; }
        .combined-chart-shell { border: 1px solid #64748b; background: white; padding: 6px; }
        .combined-chart-header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid #cbd5e1; padding: 2px 3px 6px; }
        .combined-chart-header h3 { margin: 0; color: #0f172a; font-size: 10px; font-weight: 900; }
        .combined-chart-header p { margin: 2px 0 0; color: #64748b; font-size: 7px; }
        .chart-panel { display: flex; align-items: stretch; gap: 3px; padding: 5px 0; }
        .chart-axis-label { display: flex; width: 18px; align-items: center; justify-content: center; color: #475569; font-size: 7px; font-weight: 700; writing-mode: vertical-rl; transform: rotate(180deg); }
        .chart-divider { border-top: 1px solid #cbd5e1; }
        .report-footer { position: absolute; left: 9mm; right: 9mm; bottom: 5mm; display: flex; justify-content: space-between; border-top: 1px solid #94a3b8; padding-top: 3px; color: #64748b; font-size: 6.5px; }
        @media screen and (max-width: 1023px) {
          .report-page { min-height: auto; padding: 24px 20px 56px; }
          .report-info-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .compact-info-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media screen and (max-width: 767px) {
          .report-page { padding: 16px 12px 20px; border-radius: 12px; }
          .report-brand-row { grid-template-columns: 1fr; }
          .report-brand-row > div { min-height: 58px; padding: 9px 10px; }
          .report-brand-row > div + div { border-left: 0; border-top: 1px solid #334155; }
          .report-brand-row img { max-width: min(12rem, 75vw); }
          .report-info-grid,
          .compact-info-grid { grid-template-columns: minmax(0, 1fr); }
          .report-info-cell-wide { grid-column: span 1; }
          .report-info-cell { min-height: 34px; font-size: 9px; }
          .report-section-title { margin-top: 16px; font-size: 9px; }
          .report-table-scroll .report-table { min-width: 680px; }
          .report-table-scroll .pdi-table { min-width: 980px; }
          .report-table th,
          .report-table td { padding: 5px 4px; }
          .disposition-panel { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .disposition-panel > div { border-bottom: 1px solid #99f6e4; }
          .disposition-panel > div:nth-child(2n) { border-right: 0; }
          .signature-line { height: 34px; }
          .combined-chart-header { flex-direction: column; gap: 6px; }
          .combined-chart-header > div:last-child { text-align: left; }
          .chart-axis-label { width: 14px; }
          .report-footer { position: static; flex-direction: column; gap: 3px; margin-top: 24px; font-size: 7px; }
        }
        @media screen and (max-width: 420px) {
          .report-info-cell { grid-template-columns: minmax(0, 1fr); }
          .report-info-cell span { border-right: 0; border-bottom: 1px solid #cbd5e1; }
          .report-brand-row h1 { font-size: 14px; }
          .disposition-panel { grid-template-columns: minmax(0, 1fr); }
          .disposition-panel > div { border-right: 0; }
        }
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body { width: 210mm !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          body.spc-print-all-pages * { visibility: hidden !important; }
          body.spc-print-all-pages #spc-report-print-area,
          body.spc-print-all-pages #spc-report-print-area * { visibility: visible !important; }
          #spc-report-print-area { position: absolute !important; top: 0 !important; left: 0 !important; width: 210mm !important; margin: 0 !important; padding: 0 !important; }
          #spc-report-print-area .no-print { display: none !important; }
          #spc-report-print-area .report-table-scroll { overflow: visible !important; }
          #spc-report-print-area > .report-page { width: 210mm !important; min-height: 297mm !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; break-after: page !important; page-break-after: always !important; }
          #spc-report-print-area > .report-page:last-child { break-after: auto !important; page-break-after: auto !important; }
        }
      `}</style>
    </div>
  );
};

export default GeneratePdiReport;
