import React from "react";
import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useTransition,
} from "react";
import * as XLSX from "xlsx";
import toast, { Toaster } from "react-hot-toast";
import { createPortal } from "react-dom";
import {
  createDispatchRequestId,
  getApiErrorMessage,
  pendingPoApi,
} from "./pendingPoApi.js";
import rejectionApi from "../Rejection/rejectionApi.js";
import {
  attachRejectionSummary,
  buildRejectionSummaryMap,
  calculatePOBalance,
} from "../Rejection/rejection.math.js";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  CircleAlert,
  CircleCheckBig,
  Clock3,
  Download,
  Eye,
  EyeOff,
  FileDown,
  FileSpreadsheet,
  FileText,
  Gauge,
  History,
  IndianRupee,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  Package,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Truck,
  Upload,
  X,
  AlertCircle,
  Layers,
  ShoppingCart,
  ListChecks,
  HelpCircle,
  BookOpen,
  ArrowRight,
  MoreHorizontal,
  Info,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const MAX_IMPORT_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_BILL_NUMBER_LENGTH = 100;
const MAX_SHORT_TEXT_LENGTH = 200;
const MAX_REMARKS_LENGTH = 1000;

const MAX_BILL_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_BILL_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const validateBillFile = (file) => {
  if (!file) return "";
  if (!ACCEPTED_BILL_FILE_TYPES.includes(file.type)) {
    return "Bill file must be PDF, JPG, JPEG, or PNG";
  }
  if (file.size > MAX_BILL_FILE_SIZE_BYTES) {
    return "Bill file must be 5 MB or smaller";
  }
  return "";
};

const normalizeText = (value) => String(value ?? "").trim();

const getUserCompanyName = (user) =>
  normalizeText(
    user?.companyName ||
      user?.company?.name ||
      user?.company ||
      user?.customerName ||
      user?.clientCompany ||
      user?.organization?.name,
  );

const isSameCompany = (left, right) =>
  normalizeMergeKeyPart(left) === normalizeMergeKeyPart(right);

const normalizeMergeKeyPart = (value) =>
  normalizeText(value).toLocaleLowerCase("en-IN").replace(/\s+/g, " ");

const getItemIdentity = (item) => {
  const itemCode = normalizeMergeKeyPart(item?.itemCode);
  if (itemCode) return `code:${itemCode}`;
  return [
    `drawing:${normalizeMergeKeyPart(item?.drawing)}`,
    `item:${normalizeMergeKeyPart(item?.item)}`,
  ].join("::");
};

const getRecordTimestamp = (item) => {
  const timestamp = Date.parse(item?.updatedAt || item?.createdAt || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const deduplicatePOItems = (items = []) => {
  const uniqueItems = new Map();

  items.forEach((item, index) => {
    const companyKey = normalizeMergeKeyPart(item?.company);
    const poKey =
      normalizeMergeKeyPart(item?.po) ||
      `record:${normalizeText(item?._id) || index}`;

    // One calculation entry for each PO + item.
    const uniqueKey = [companyKey, poKey, getItemIdentity(item)].join("::");

    const existing = uniqueItems.get(uniqueKey);

    // If duplicate documents exist, use the latest document only.
    if (!existing || getRecordTimestamp(item) > getRecordTimestamp(existing)) {
      uniqueItems.set(uniqueKey, item);
    }
  });

  return [...uniqueItems.values()];
};

const toFiniteNumber = (value, fallback = 0) => {
  if (typeof value === "string" && value.trim() === "") return fallback;
  const normalized =
    typeof value === "string" ? value.replace(/,/g, "").trim() : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : fallback;
};

const toNonNegativeNumber = (value, fallback = 0) =>
  Math.max(0, toFiniteNumber(value, fallback));

const getLocalDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const stringValue = String(value);
  const dateOnlyMatch = stringValue.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateOnlyMatch) return dateOnlyMatch[1];
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : getLocalDateInputValue(date);
};

const getDateTimestamp = (value) => {
  if (!value) return null;
  const dateOnly = toDateInputValue(value);
  if (!dateOnly) return null;
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const formatDateValue = (value) => {
  const timestamp = getDateTimestamp(value);
  if (timestamp === null) return value ? String(value) : "-";
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isCancelledRecord = (item) =>
  normalizeText(item?.status).toLowerCase() === "cancelled";

const getItemCategory = (description = "") => {
  const value = normalizeText(description).toLowerCase();
  if (value.includes("bus bar")) return "Bus Bars";
  if (value.includes("heat sink")) return "Heat Sinks";
  if (value.includes("accessory") || value.includes("assembly")) {
    return "Accessories";
  }
  if (value.includes("hardware")) return "Hardware";
  if (value.includes("plate")) return "Plates";
  return "Others";
};

const normalizeDispatchEntry = (entry = {}, parent = {}) => ({
  ...entry,
  _id: normalizeText(entry._id || entry.id),
  id: normalizeText(entry.id || entry._id),
  poId: normalizeText(entry.poId || parent._id),
  itemKey: normalizeText(entry.itemKey || parent.itemKey),
  po: normalizeText(entry.po || parent.po),
  company: normalizeText(entry.company || parent.company),
  item: normalizeText(entry.item || parent.item),
  itemCode: normalizeText(entry.itemCode || parent.itemCode),
  drawing: normalizeText(entry.drawing || parent.drawing),
  dispatchQty: toNonNegativeNumber(entry.dispatchQty),
  newPending:
    entry.newPending === undefined || entry.newPending === null
      ? undefined
      : toNonNegativeNumber(entry.newPending),
});

const normalizePurchaseOrder = (record = {}, index = 0) => {
  const issues = [];
  const warnings = [];
  const id = normalizeText(record._id || record.id);
  const po = normalizeText(record.po);
  const rawCompany = normalizeText(record.company);
  const company = rawCompany || "Unknown Company";
  const item = normalizeText(record.item);
  const poQty = toNonNegativeNumber(record.poQty ?? record.quantity);
  const hasDispatched =
    record.dispatched !== undefined &&
    record.dispatched !== null &&
    record.dispatched !== "";
  const rawDispatched = hasDispatched
    ? toNonNegativeNumber(record.dispatched)
    : Math.max(0, poQty - toNonNegativeNumber(record.pending, poQty));
  // Gross dispatch is historical and may exceed PO quantity because replacement
  // dispatches are valid after a rejection. Never cap it at poQty.
  const dispatched = rawDispatched;
  const rejected = toNonNegativeNumber(record.rejected ?? record.rejectedQty);
  const balance = calculatePOBalance({ poQty, dispatched, rejected });
  const accepted = balance.accepted;
  const pending = balance.pending;
  const suppliedPending = toFiniteNumber(record.pending, pending);
  const rate = toNonNegativeNumber(record.rate);

  if (!id)
    warnings.push("Missing database id; edit and dispatch are unavailable");
  if (!po) issues.push("Missing PO number");
  if (!rawCompany) issues.push("Missing company");
  if (!item) issues.push("Missing item description");
  if (poQty <= 0) issues.push("PO quantity must be greater than zero");
  if (rate <= 0) warnings.push("Unit rate is missing or zero");
  if (rawDispatched > poQty && rejected <= 0)
    warnings.push(
      "Gross dispatched quantity exceeds PO quantity; verify whether replacement dispatches exist",
    );
  if (Math.abs(suppliedPending - pending) > 0.000001) {
    warnings.push(
      "Pending quantity was recalculated as PO quantity minus net accepted quantity",
    );
  }
  const poDateTimestamp = getDateTimestamp(record.poDate);
  const deliveryDateTimestamp = getDateTimestamp(record.deliveryDate);
  if (!record.poDate) warnings.push("PO date is missing");
  if (!record.deliveryDate) warnings.push("Delivery date is missing");
  if (record.poDate && poDateTimestamp === null) issues.push("Invalid PO date");
  if (record.deliveryDate && deliveryDateTimestamp === null) {
    issues.push("Invalid delivery date");
  }
  if (
    poDateTimestamp !== null &&
    deliveryDateTimestamp !== null &&
    deliveryDateTimestamp < poDateTimestamp
  ) {
    issues.push("Delivery date is before PO date");
  }

  const rawStatus = normalizeText(record.status);
  const protectedStatus = ["on hold", "cancelled"].includes(
    rawStatus.toLowerCase(),
  );
  const status = protectedStatus
    ? rawStatus.toLowerCase() === "on hold"
      ? "On Hold"
      : "Cancelled"
    : pending <= 0
      ? "Completed"
      : dispatched > 0
        ? "In Progress"
        : "Pending";
  const itemKey = id || `record-${index}-${po}-${company}`;
  const normalized = {
    ...record,
    _id: id,
    itemKey,
    po,
    company,
    item,
    itemCode: normalizeText(record.itemCode),
    drawing: normalizeText(record.drawing),
    poQty,
    dispatched,
    rejected,
    rejectedQty: rejected,
    accepted,
    netAccepted: accepted,
    pending,
    rate,
    total: pending * rate,
    status,
    _dataIssues: issues,
    _dataWarnings: warnings,
    dispatchHistory: [],
  };

  normalized.dispatchHistory = Array.isArray(record.dispatchHistory)
    ? record.dispatchHistory.map((entry) =>
        normalizeDispatchEntry(entry, normalized),
      )
    : [];

  return normalized;
};

const extractPurchaseOrderRecords = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.records)) return result.records;
  if (Array.isArray(result?.data?.records)) return result.data.records;
  if (Array.isArray(result?.data)) return result.data;
  throw new Error("The server returned an invalid purchase-order response");
};

const getDispatchGroupKey = (entry, itemKey = "") => {
  const billNumber = normalizeText(entry?.billNumber) || "Unknown Bill";
  const date = toDateInputValue(entry?.dispatchDate) || "unknown-date";
  const fallback = normalizeText(entry?._id || entry?.id || itemKey);
  return `${billNumber}::${date}::${billNumber === "Unknown Bill" ? fallback : ""}`;
};

const getPurchaseOrderKey = (item) => {
  const directKey = normalizeText(item?._id || item?.itemKey);
  if (directKey) return directKey;
  const composite = [
    item?.company,
    item?.po,
    item?.itemCode,
    item?.drawing,
    item?.item,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join("::");
  return composite || "unidentified-purchase-order";
};

const getMergedItemKey = (item) =>
  [normalizeMergeKeyPart(item?.company), getItemIdentity(item)].join("::");

const getSourcePurchaseOrders = (row) =>
  row?._isMerged && Array.isArray(row._sourceItems)
    ? row._sourceItems
    : row
      ? [row]
      : [];

const getEarliestDateValue = (items, field, { pendingOnly = false } = {}) => {
  const candidates = items
    .filter(
      (item) =>
        !pendingOnly ||
        (!isCancelledRecord(item) && toNonNegativeNumber(item.pending) > 0),
    )
    .map((item) => ({
      value: item?.[field],
      timestamp: getDateTimestamp(item?.[field]),
    }))
    .filter((entry) => entry.timestamp !== null)
    .sort((left, right) => left.timestamp - right.timestamp);
  return candidates[0]?.value || "";
};

const getMergedStatus = (items, pending, dispatched) => {
  if (items.length === 0) return "Pending";
  if (items.every(isCancelledRecord)) return "Cancelled";
  if (pending <= 0) return "Completed";

  const activeItems = items.filter((item) => !isCancelledRecord(item));
  if (
    activeItems.length > 0 &&
    activeItems.every(
      (item) => normalizeText(item.status).toLowerCase() === "on hold",
    )
  ) {
    return "On Hold";
  }

  const hasBlockedItems = items.some((item) =>
    ["on hold", "cancelled"].includes(normalizeText(item.status).toLowerCase()),
  );
  if (hasBlockedItems) return "Mixed";
  return dispatched > 0 ? "In Progress" : "Pending";
};

const mergePurchaseOrderRows = (items = []) => {
  const groups = new Map();
  const uniquePOItems = deduplicatePOItems(items);

  uniquePOItems.forEach((item) => {
    const mergeKey = getMergedItemKey(item);
    if (!groups.has(mergeKey)) groups.set(mergeKey, []);
    groups.get(mergeKey).push(item);
  });

  return Array.from(groups.entries()).map(([mergeKey, sourceItems]) => {
    const firstItem = sourceItems[0];
    const activeItems = sourceItems.filter((item) => !isCancelledRecord(item));
    const calculationItems = activeItems;

    const poBreakdown = sourceItems
      .map((item) => ({
        poId: item._id,
        po: normalizeText(item.po),
        pending: isCancelledRecord(item)
          ? 0
          : toNonNegativeNumber(item.pending),
        poQty: isCancelledRecord(item) ? 0 : toNonNegativeNumber(item.poQty),
        dispatched: isCancelledRecord(item)
          ? 0
          : toNonNegativeNumber(item.dispatched),
        rejected: isCancelledRecord(item)
          ? 0
          : toNonNegativeNumber(item.rejected),
        accepted: isCancelledRecord(item)
          ? 0
          : toNonNegativeNumber(item.accepted),
        status: item.status,
        cancelled: isCancelledRecord(item),
      }))
      .sort((a, b) =>
        a.po.localeCompare(b.po, "en", {
          numeric: true,
          sensitivity: "base",
        }),
      );

    const pending = poBreakdown.reduce((sum, entry) => sum + entry.pending, 0);
    const poQty = poBreakdown.reduce((sum, entry) => sum + entry.poQty, 0);
    const dispatched = poBreakdown.reduce(
      (sum, entry) => sum + entry.dispatched,
      0,
    );
    const rejected = poBreakdown.reduce(
      (sum, entry) => sum + entry.rejected,
      0,
    );
    const accepted = poBreakdown.reduce(
      (sum, entry) => sum + entry.accepted,
      0,
    );
    const total = calculationItems.reduce(
      (sum, item) =>
        sum +
        toNonNegativeNumber(item.pending) * toNonNegativeNumber(item.rate),
      0,
    );

    const rates = Array.from(
      new Set(
        calculationItems
          .map((item) => toNonNegativeNumber(item.rate))
          .filter((rate) => rate > 0),
      ),
    );
    const weightedRate =
      pending > 0
        ? total / pending
        : rates.length > 0
          ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length
          : 0;

    const poNumbers = poBreakdown.map((entry) => entry.po).filter(Boolean);
    const poDates = Array.from(
      new Set(
        sourceItems
          .map((item) => toDateInputValue(item.poDate))
          .filter(Boolean),
      ),
    );
    const deliveryDates = Array.from(
      new Set(
        sourceItems
          .map((item) => toDateInputValue(item.deliveryDate))
          .filter(Boolean),
      ),
    );
    const itemCodes = Array.from(
      new Set(
        sourceItems.map((item) => normalizeText(item.itemCode)).filter(Boolean),
      ),
    );
    const drawings = Array.from(
      new Set(
        sourceItems.map((item) => normalizeText(item.drawing)).filter(Boolean),
      ),
    );

    const dispatchableItems = sourceItems.filter((item) => {
      const status = normalizeText(item.status).toLowerCase();
      return (
        Boolean(item._id) &&
        toNonNegativeNumber(item.pending) > 0 &&
        status !== "cancelled" &&
        status !== "on hold"
      );
    });

    const dataIssues = Array.from(
      new Set(sourceItems.flatMap((item) => item._dataIssues || [])),
    );
    const dataWarnings = Array.from(
      new Set(sourceItems.flatMap((item) => item._dataWarnings || [])),
    );

    return {
      ...firstItem,
      _isMerged: sourceItems.length > 1,
      _mergeKey: `merged::${mergeKey}`,
      itemKey: `merged::${mergeKey}`,
      _sourceItems: sourceItems,
      _dispatchableItems: dispatchableItems,
      _cancelledCount: sourceItems.filter(isCancelledRecord).length,
      _hasMixedRates: rates.length > 1,
      _dataIssues: dataIssues,
      _dataWarnings: dataWarnings,

      itemCode: itemCodes.join(", ") || firstItem.itemCode,
      itemCodes,
      item: firstItem.item,
      drawing: drawings.join(", ") || firstItem.drawing,
      drawings,

      po: poNumbers.join(", "),
      poNumbers,
      poCount: poBreakdown.length,
      poBreakdown,
      poDates,
      deliveryDates,
      poDate: getEarliestDateValue(sourceItems, "poDate"),
      deliveryDate: getEarliestDateValue(sourceItems, "deliveryDate", {
        pendingOnly: true,
      }),

      poQty,
      dispatched,
      rejected,
      rejectedQty: rejected,
      accepted,
      netAccepted: accepted,
      pending,
      rates,
      rate: weightedRate,
      total,
      status: getMergedStatus(sourceItems, pending, dispatched),
    };
  });
};

const EXCEL_IMPORT_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const normalizeExcelHeader = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const EXCEL_COLUMN_DEFINITIONS = {
  po: {
    header: "PO Number",
    aliases: [
      "po",
      "pono",
      "ponumber",
      "purchaseorder",
      "purchaseorderno",
      "purchaseordernumber",
    ],
  },
  poDate: {
    header: "PO Date",
    aliases: ["podate", "purchaseorderdate", "orderdate"],
  },
  company: {
    header: "Company",
    aliases: [
      "company",
      "companyname",
      "customer",
      "customername",
      "party",
      "partyname",
      "vendor",
      "vendorname",
    ],
  },
  item: {
    header: "Item Description",
    aliases: [
      "item",
      "itemname",
      "itemdescription",
      "description",
      "descriptionofgoods",
      "part",
      "partname",
      "product",
      "productname",
    ],
  },
  itemCode: {
    header: "Item Code",
    aliases: [
      "itemcode",
      "itemno",
      "itemnumber",
      "partcode",
      "partnumber",
      "materialcode",
      "materialno",
      "productcode",
      "sku",
    ],
  },
  drawing: {
    header: "Drawing",
    aliases: [
      "drawing",
      "drawingno",
      "drawingnumber",
      "drg",
      "drgno",
      "drgnumber",
    ],
  },
  poQty: {
    header: "PO Quantity",
    aliases: [
      "poqty",
      "poquantity",
      "quantity",
      "qty",
      "orderqty",
      "orderquantity",
      "orderedquantity",
      "quantityordered",
    ],
  },
  dispatched: {
    header: "Dispatched",
    aliases: [
      "dispatched",
      "dispatchedqty",
      "dispatchedquantity",
      "dispatchqty",
      "supplied",
      "suppliedqty",
    ],
  },
  rejectedQty: {
    header: "Rejected Qty",
    aliases: [
      "rejected",
      "rejectedqty",
      "rejectedquantity",
      "rejection",
      "rejectionqty",
      "rejectqty",
      "rejqty",
      "customerrejection",
    ],
  },
  rejectionReason: {
    header: "Rejection Reason",
    aliases: [
      "rejectionreason",
      "rejectreason",
      "reasonforrejection",
      "rejectionremarks",
    ],
  },
  rejectionDate: {
    header: "Rejection Date",
    aliases: ["rejectiondate", "rejectdate"],
  },
  pending: {
    header: "Pending",
    aliases: ["pending", "pendingqty", "pendingquantity", "balanceqty"],
  },
  rate: {
    header: "Rate",
    aliases: ["rate", "unitrate", "price", "unitprice", "porate"],
  },
  deliveryDate: {
    header: "Delivery Date",
    aliases: [
      "deliverydate",
      "duedate",
      "requireddate",
      "expecteddeliverydate",
      "scheduledate",
      "deliveryschedule",
    ],
  },
  status: {
    header: "Status",
    aliases: ["status", "postatus", "orderstatus"],
  },
};

const getExcelFieldForHeader = (header) => {
  const normalizedHeader = normalizeExcelHeader(header);
  return Object.entries(EXCEL_COLUMN_DEFINITIONS).find(([, definition]) =>
    definition.aliases.includes(normalizedHeader),
  )?.[0];
};

const createUniqueExcelHeaders = (values = []) => {
  const seen = new Map();
  return values.map((value, index) => {
    const base = normalizeText(value) || `Column ${index + 1}`;
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base} (${count})`;
  });
};

const createDateInputFromParts = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const parseExcelDateValue = (value) => {
  if (value === undefined || value === null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return getLocalDateInputValue(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    return parsed ? createDateInputFromParts(parsed.y, parsed.m, parsed.d) : "";
  }

  const textValue = normalizeText(value);
  const indianDateMatch = textValue.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/,
  );
  if (indianDateMatch) {
    return createDateInputFromParts(
      Number(indianDateMatch[3]),
      Number(indianDateMatch[2]),
      Number(indianDateMatch[1]),
    );
  }

  const yearFirstMatch = textValue.match(
    /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/,
  );
  if (yearFirstMatch) {
    return createDateInputFromParts(
      Number(yearFirstMatch[1]),
      Number(yearFirstMatch[2]),
      Number(yearFirstMatch[3]),
    );
  }
  return toDateInputValue(textValue);
};

const getPreviewRowValidation = (row = {}) => {
  const issues = [];
  const warnings = [];
  const poQty = toFiniteNumber(row.poQty);
  const dispatched = toFiniteNumber(row.dispatched);
  const rejectedQty = toFiniteNumber(row.rejectedQty);
  const rate = toFiniteNumber(row.rate);

  if (!normalizeText(row.po)) issues.push("PO number is required");
  if (!normalizeText(row.company)) issues.push("Company is required");
  if (!normalizeText(row.item)) issues.push("Item description is required");
  if (!Number.isFinite(poQty) || poQty <= 0) {
    issues.push("PO quantity must be greater than zero");
  }
  if (!Number.isFinite(dispatched) || dispatched < 0) {
    issues.push("Dispatched quantity cannot be negative");
  }
  if (!Number.isFinite(rejectedQty) || rejectedQty < 0) {
    issues.push("Rejected quantity cannot be negative");
  } else if (rejectedQty > dispatched) {
    issues.push("Rejected quantity cannot exceed gross dispatched quantity");
  }
  if (row._invalidPODate) issues.push("PO date is invalid");
  if (row._invalidDeliveryDate) issues.push("Delivery date is invalid");
  if (row._invalidRejectionDate) issues.push("Rejection date is invalid");

  const poDateTimestamp = getDateTimestamp(row.poDate);
  const deliveryDateTimestamp = getDateTimestamp(row.deliveryDate);
  if (
    poDateTimestamp !== null &&
    deliveryDateTimestamp !== null &&
    deliveryDateTimestamp < poDateTimestamp
  ) {
    issues.push("Delivery date is before PO date");
  }

  if (!row.poDate) warnings.push("PO date is blank");
  if (!row.deliveryDate) warnings.push("Delivery date is blank");
  if (!Number.isFinite(rate) || rate <= 0) {
    warnings.push("Unit rate is blank or zero");
  }
  if (!normalizeText(row.itemCode)) warnings.push("Item code is blank");
  if (!normalizeText(row.drawing)) warnings.push("Drawing is blank");

  return { issues, warnings };
};

const recalculateExcelPreviewRow = (row = {}) => {
  const poQty = Math.max(0, toFiniteNumber(row.poQty));
  const dispatched = Math.max(0, toFiniteNumber(row.dispatched));
  const rejectedQty = Math.max(0, toFiniteNumber(row.rejectedQty));
  const balance = calculatePOBalance({
    poQty,
    dispatched,
    rejected: rejectedQty,
  });
  const pending = balance.pending;
  const rawStatus = normalizeText(row.status).toLowerCase();
  const status = ["on hold", "cancelled"].includes(rawStatus)
    ? rawStatus === "on hold"
      ? "On Hold"
      : "Cancelled"
    : pending <= 0
      ? "Completed"
      : dispatched > 0
        ? "In Progress"
        : "Pending";
  const calculated = {
    ...row,
    rejectedQty,
    accepted: balance.accepted,
    pending,
    status,
  };
  const validation = getPreviewRowValidation(calculated);
  return {
    ...calculated,
    _previewIssues: validation.issues,
    _previewWarnings: validation.warnings,
  };
};

const createExcelPreviewRow = (
  rawRow,
  index,
  headers,
  sourceRowNumber = index + 2,
) => {
  const fieldHeaders = {};
  const fieldValues = {};

  headers.forEach((header) => {
    const field = getExcelFieldForHeader(header);
    if (field && !fieldHeaders[field]) {
      fieldHeaders[field] = header;
      fieldValues[field] = rawRow[header];
    }
  });

  const poDate = parseExcelDateValue(fieldValues.poDate);
  const deliveryDate = parseExcelDateValue(fieldValues.deliveryDate);
  const rejectionDate = parseExcelDateValue(fieldValues.rejectionDate);
  const row = {
    _previewId: `excel-row-${sourceRowNumber}-${index}`,
    _sourceRowNumber: sourceRowNumber,
    _originalRow: rawRow,
    _fieldHeaders: fieldHeaders,
    _invalidPODate: Boolean(fieldValues.poDate) && !poDate,
    _invalidDeliveryDate: Boolean(fieldValues.deliveryDate) && !deliveryDate,
    _invalidRejectionDate: Boolean(fieldValues.rejectionDate) && !rejectionDate,
    po: normalizeText(fieldValues.po),
    poDate,
    company: normalizeText(fieldValues.company),
    item: normalizeText(fieldValues.item),
    itemCode: normalizeText(fieldValues.itemCode),
    drawing: normalizeText(fieldValues.drawing),
    poQty:
      fieldValues.poQty === "" || fieldValues.poQty === undefined
        ? ""
        : toFiniteNumber(fieldValues.poQty),
    dispatched:
      fieldValues.dispatched === "" || fieldValues.dispatched === undefined
        ? 0
        : toFiniteNumber(fieldValues.dispatched),
    rejectedQty:
      fieldValues.rejectedQty === "" || fieldValues.rejectedQty === undefined
        ? 0
        : toFiniteNumber(fieldValues.rejectedQty),
    rejectionReason: normalizeText(fieldValues.rejectionReason),
    rejectionDate,
    pending: toFiniteNumber(fieldValues.pending),
    rate:
      fieldValues.rate === "" || fieldValues.rate === undefined
        ? ""
        : toFiniteNumber(fieldValues.rate),
    deliveryDate,
    status: normalizeText(fieldValues.status),
  };

  return recalculateExcelPreviewRow(row);
};

const parseExcelFileForPreview = async (file) => {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("The workbook does not contain a worksheet");

  const worksheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: true,
    blankrows: false,
  });
  if (matrix.length === 0) throw new Error("The worksheet is empty");

  let headerRowIndex = -1;
  let bestHeaderScore = 0;
  matrix.slice(0, 20).forEach((row, index) => {
    const score = row.filter((cell) => getExcelFieldForHeader(cell)).length;
    if (score > bestHeaderScore) {
      bestHeaderScore = score;
      headerRowIndex = index;
    }
  });
  if (headerRowIndex < 0 || bestHeaderScore < 2) {
    throw new Error(
      "Could not identify the Excel header row. Include columns such as PO Number, Company, Item Description, and PO Quantity.",
    );
  }

  const headers = createUniqueExcelHeaders(matrix[headerRowIndex]);
  const rawRows = matrix
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => normalizeText(cell) !== ""))
    .map((row) =>
      headers.reduce((record, header, columnIndex) => {
        record[header] = row[columnIndex] ?? "";
        return record;
      }, {}),
    );
  if (rawRows.length === 0) {
    throw new Error("No purchase-order rows were found below the header row");
  }

  return {
    sheetName,
    rows: rawRows.map((row, index) =>
      createExcelPreviewRow(row, index, headers, headerRowIndex + index + 2),
    ),
  };
};

const updateExcelPreviewRow = (row, field, value) => {
  const next = { ...row, [field]: value };
  if (field === "poDate") next._invalidPODate = false;
  if (field === "deliveryDate") next._invalidDeliveryDate = false;
  if (field === "rejectionDate") next._invalidRejectionDate = false;
  return recalculateExcelPreviewRow(next);
};

const toReviewedExcelRow = (row) => {
  const reviewed = { ...row._originalRow };
  const values = {
    po: normalizeText(row.po),
    poDate: row.poDate || "",
    company: normalizeText(row.company),
    item: normalizeText(row.item),
    itemCode: normalizeText(row.itemCode),
    drawing: normalizeText(row.drawing),
    poQty: toNonNegativeNumber(row.poQty),
    dispatched: toNonNegativeNumber(row.dispatched),
    rejectedQty: toNonNegativeNumber(row.rejectedQty),
    rejectionReason: normalizeText(row.rejectionReason),
    rejectionDate: row.rejectionDate || "",
    pending: toNonNegativeNumber(row.pending),
    rate: toNonNegativeNumber(row.rate),
    deliveryDate: row.deliveryDate || "",
    status: row.status,
  };

  Object.entries(values).forEach(([field, value]) => {
    const header =
      row._fieldHeaders?.[field] || EXCEL_COLUMN_DEFINITIONS[field].header;
    reviewed[header] = value;
  });
  return reviewed;
};

const buildReviewedExcelFile = (rows, sourceFile, sheetName) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows.map(toReviewedExcelRow));
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    normalizeText(sheetName).slice(0, 31) || "Pending PO",
  );
  const fileBytes = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
  const baseName = normalizeText(sourceFile?.name).replace(
    /\.(xlsx|xls)$/i,
    "",
  );
  return new File([fileBytes], `${baseName || "pending-po"}-reviewed.xlsx`, {
    type: EXCEL_IMPORT_MIME_TYPE,
  });
};

// ============================================
// EXCEL IMPORT PREVIEW COMPONENT
// ============================================
const ExcelImportPreviewModal = React.memo(function ExcelImportPreviewModal({
  isOpen,
  file,
  sheetName,
  rows = [],
  isSubmitting,
  error,
  onUpdateRow,
  onDeleteRow,
  onCancel,
  onConfirm,
}) {
  const invalidRowCount = useMemo(
    () => rows.filter((row) => row._previewIssues?.length > 0).length,
    [rows],
  );
  const warningRowCount = useMemo(
    () => rows.filter((row) => row._previewWarnings?.length > 0).length,
    [rows],
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) return null;

  const inputClass =
    "w-full min-w-[120px] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-100";
  const update = (row, field) => (event) =>
    onUpdateRow(row._previewId, field, event.target.value);

  return (
    <div
      className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-950/65 p-2 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="excel-preview-title"
    >
      <div className="flex min-h-full items-center justify-center py-2">
        <div className="relative flex max-h-[calc(100vh-1rem)] w-full max-w-[1600px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/20 sm:max-h-[calc(100vh-2rem)]">
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-700 px-5 py-4 text-white sm:px-6">
            <div className="pointer-events-none absolute -right-14 -top-20 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/15">
                  <FileSpreadsheet className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2
                    id="excel-preview-title"
                    className="text-lg font-bold tracking-tight sm:text-xl"
                  >
                    Preview Excel data before upload
                  </h2>
                  <p className="mt-1 truncate text-xs text-blue-100 sm:text-sm">
                    {file?.name || "Selected workbook"} · Sheet:{" "}
                    {sheetName || "-"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white transition hover:bg-white/15 disabled:opacity-50"
                aria-label="Close Excel preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 font-semibold text-blue-700">
                <Package className="h-3.5 w-3.5" /> {rows.length} row
                {rows.length === 1 ? "" : "s"}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold ${
                  invalidRowCount
                    ? "bg-rose-100 text-rose-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {invalidRowCount ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {invalidRowCount
                  ? `${invalidRowCount} row${invalidRowCount === 1 ? "" : "s"} must be fixed`
                  : "All required data is ready"}
              </span>
              {warningRowCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 font-semibold text-amber-700">
                  <AlertCircle className="h-3.5 w-3.5" /> {warningRowCount}{" "}
                  optional warning{warningRowCount === 1 ? "" : "s"}
                </span>
              )}
              <span className="ml-auto text-slate-500">
                Edit any cell or delete unwanted rows before uploading.
              </span>
            </div>
            {error && (
              <div
                className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="thin-scrollbar min-h-0 flex-1 overflow-auto bg-slate-100/70 p-3 sm:p-4">
            {rows.length === 0 ? (
              <div className="grid min-h-[300px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
                <div>
                  <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 font-semibold text-slate-700">
                    No rows remain in the preview
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Cancel and select the workbook again to restore deleted
                    rows.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-[2180px] border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-800 text-white">
                    <tr>
                      <th className="px-3 py-3 text-center">Excel row</th>
                      <th className="px-3 py-3">PO number *</th>
                      <th className="px-3 py-3">Company *</th>
                      <th className="px-3 py-3">Item description *</th>
                      <th className="px-3 py-3">Item code</th>
                      <th className="px-3 py-3">Drawing</th>
                      <th className="px-3 py-3">PO date</th>
                      <th className="px-3 py-3">Delivery date</th>
                      <th className="px-3 py-3">PO quantity *</th>
                      <th className="px-3 py-3">Dispatched</th>
                      <th className="px-3 py-3 text-red-200">Rejected Qty</th>
                      <th className="px-3 py-3 text-emerald-200">
                        Net Accepted
                      </th>
                      <th className="px-3 py-3">Rejection Reason</th>
                      <th className="px-3 py-3">Rejection Date</th>
                      <th className="px-3 py-3">Pending</th>
                      <th className="px-3 py-3">Rate</th>
                      <th className="min-w-[240px] px-3 py-3">Validation</th>
                      <th className="px-3 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rows.map((row, index) => {
                      const hasIssues = row._previewIssues?.length > 0;
                      const hasWarnings = row._previewWarnings?.length > 0;
                      return (
                        <tr
                          key={row._previewId}
                          className={`${
                            hasIssues
                              ? "bg-rose-50/70"
                              : index % 2
                                ? "bg-slate-50/70"
                                : "bg-white"
                          } align-top`}
                        >
                          <td className="px-3 py-3 text-center font-mono font-semibold text-slate-500">
                            {row._sourceRowNumber}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={row.po}
                              onChange={update(row, "po")}
                              disabled={isSubmitting}
                              className={inputClass}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={row.company}
                              onChange={update(row, "company")}
                              disabled={isSubmitting}
                              className={`${inputClass} min-w-[180px]`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={row.item}
                              onChange={update(row, "item")}
                              disabled={isSubmitting}
                              className={`${inputClass} min-w-[230px]`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={row.itemCode}
                              onChange={update(row, "itemCode")}
                              disabled={isSubmitting}
                              className={inputClass}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={row.drawing}
                              onChange={update(row, "drawing")}
                              disabled={isSubmitting}
                              className={inputClass}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="date"
                              value={row.poDate}
                              onChange={update(row, "poDate")}
                              disabled={isSubmitting}
                              className={inputClass}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="date"
                              value={row.deliveryDate}
                              min={row.poDate || undefined}
                              onChange={update(row, "deliveryDate")}
                              disabled={isSubmitting}
                              className={inputClass}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={row.poQty}
                              onChange={update(row, "poQty")}
                              disabled={isSubmitting}
                              className={`${inputClass} min-w-[100px]`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={row.dispatched}
                              onChange={update(row, "dispatched")}
                              disabled={isSubmitting}
                              className={`${inputClass} min-w-[100px]`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              max={toNonNegativeNumber(row.dispatched)}
                              value={row.rejectedQty}
                              onChange={update(row, "rejectedQty")}
                              disabled={isSubmitting}
                              className={`${inputClass} min-w-[100px] text-red-700`}
                            />
                          </td>
                          <td className="px-3 py-3 text-center font-semibold text-emerald-700">
                            {toNonNegativeNumber(row.accepted).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={row.rejectionReason || ""}
                              onChange={update(row, "rejectionReason")}
                              disabled={isSubmitting}
                              className={`${inputClass} min-w-[180px]`}
                              placeholder="Optional reason"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="date"
                              value={row.rejectionDate || ""}
                              onChange={update(row, "rejectionDate")}
                              disabled={isSubmitting}
                              className={`${inputClass} min-w-[140px]`}
                            />
                          </td>
                          <td className="px-3 py-3 text-center font-semibold text-rose-600">
                            {toNonNegativeNumber(row.pending).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.rate}
                              onChange={update(row, "rate")}
                              disabled={isSubmitting}
                              className={`${inputClass} min-w-[100px]`}
                            />
                          </td>
                          <td className="px-3 py-3">
                            {hasIssues ? (
                              <ul className="space-y-1 text-[11px] font-medium text-rose-700">
                                {row._previewIssues.map((issue) => (
                                  <li key={issue} className="flex gap-1.5">
                                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                                    <span>{issue}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : hasWarnings ? (
                              <div>
                                <p className="flex items-center gap-1.5 font-semibold text-amber-700">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  Import allowed
                                </p>
                                <p
                                  className="mt-1 max-w-[230px] text-[10px] leading-4 text-amber-600"
                                  title={row._previewWarnings.join("; ")}
                                >
                                  {row._previewWarnings.join("; ")}
                                </p>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => onDeleteRow(row._previewId)}
                              disabled={isSubmitting}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-2 font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                              title={`Delete Excel row ${row._sourceRowNumber} from this import`}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                Required fields are marked with *. Pending quantity is
                recalculated automatically. Optional warnings do not block the
                upload.
              </p>
              <div className="flex shrink-0 items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={
                    isSubmitting || rows.length === 0 || invalidRowCount > 0
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  title={
                    invalidRowCount > 0
                      ? "Fix or delete rows with red validation errors"
                      : "Upload the reviewed rows"
                  }
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isSubmitting
                    ? "Uploading reviewed data..."
                    : `Upload ${rows.length} reviewed row${rows.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// REUSABLE CONFIRMATION DIALOG
// ============================================
const ConfirmActionDialog = React.memo(function ConfirmActionDialog({
  confirmation,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!confirmation) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmation, onCancel]);

  if (!confirmation) return null;

  const tone = confirmation.tone || "danger";
  const toneStyles = {
    danger: {
      iconWrap: "bg-rose-100 text-rose-600 ring-rose-200",
      confirm:
        "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/20",
    },
    warning: {
      iconWrap: "bg-amber-100 text-amber-700 ring-amber-200",
      confirm:
        "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20",
    },
    primary: {
      iconWrap: "bg-blue-100 text-blue-700 ring-blue-200",
      confirm:
        "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/20",
    },
  };
  const palette = toneStyles[tone] || toneStyles.danger;

  return (
    <div
      className="fixed inset-0 z-[12000] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-action-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onCancel}
        aria-label="Cancel confirmation"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl ring-1 ring-slate-900/5">
        <div className="px-6 pb-5 pt-6">
          <div className="flex items-start gap-4">
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${palette.iconWrap}`}
            >
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                id="confirm-action-title"
                className="text-lg font-bold tracking-tight text-slate-900"
              >
                {confirmation.title || "Confirm action"}
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                {confirmation.message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            {confirmation.cancelLabel || "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition ${palette.confirm}`}
          >
            {confirmation.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
});

const useConfirmDialog = () => {
  const [confirmation, setConfirmation] = useState(null);
  const resolverRef = useRef(null);

  const askForConfirmation = useCallback((options) => {
    if (resolverRef.current) resolverRef.current(false);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setConfirmation(options);
    });
  }, []);

  const resolveConfirmation = useCallback((confirmed) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setConfirmation(null);
    resolver?.(confirmed);
  }, []);

  useEffect(
    () => () => {
      resolverRef.current?.(false);
      resolverRef.current = null;
    },
    [],
  );

  return {
    confirmation,
    askForConfirmation,
    confirmAction: () => resolveConfirmation(true),
    cancelAction: () => resolveConfirmation(false),
  };
};

// ============================================
// DISPATCH HISTORY BILL DETAILS COMPONENT
// ============================================
const DispatchBillDetails = React.memo(function DispatchBillDetails({
  billNumber,
  entries,
  onClose,
  onEditDispatch,
  onDeleteDispatch,
}) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const totalItems = safeEntries.length;
  const totalQuantity = safeEntries.reduce(
    (sum, entry) => sum + toNonNegativeNumber(entry.dispatchQty),
    0,
  );
  const dispatchDate = safeEntries[0]?.dispatchDate;
  const transportMode = safeEntries[0]?.transportMode;
  const trackingNumber = safeEntries[0]?.trackingNumber;
  const remarks = safeEntries[0]?.remarks;
  const receivedBy = safeEntries[0]?.receivedBy;
  const canManage = Boolean(onEditDispatch || onDeleteDispatch);
  const { confirmation, askForConfirmation, confirmAction, cancelAction } =
    useConfirmDialog();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleEdit = useCallback(
    (entry) => {
      onEditDispatch?.(entry, billNumber);
    },
    [onEditDispatch, billNumber],
  );

  const handleDelete = useCallback(
    async (dispatchId, poId) => {
      if (!dispatchId) return;

      const confirmed = await askForConfirmation({
        title: "Delete dispatch entry?",
        message:
          "This dispatch entry will be permanently removed. This action cannot be undone.",
        confirmLabel: "Delete",
        cancelLabel: "Keep Entry",
        tone: "danger",
      });

      if (confirmed) onDeleteDispatch?.(dispatchId, poId);
    },
    [askForConfirmation, onDeleteDispatch],
  );

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative w-full max-w-4xl overflow-hidden bg-white rounded-2xl shadow-2xl animate-fadeIn">
          <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Bill Details</h3>
                <p className="text-sm text-blue-100">Bill #: {billNumber}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg text-white hover:bg-white/15 transition"
                aria-label="Close bill details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Dispatch Date</p>
                <p className="text-sm font-semibold text-gray-800">
                  {formatDateValue(dispatchDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Items</p>
                <p className="text-sm font-semibold text-gray-800">
                  {totalItems}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Quantity</p>
                <p className="text-sm font-semibold text-gray-800">
                  {totalQuantity}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Transport</p>
                <p className="text-sm font-semibold text-gray-800">
                  {transportMode || "-"}
                </p>
              </div>
            </div>
            {receivedBy && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Received By</p>
                <p className="text-sm font-semibold text-gray-800">
                  {receivedBy}
                </p>
              </div>
            )}
            {trackingNumber && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Tracking Number</p>
                <p className="text-sm font-semibold text-gray-800">
                  {trackingNumber}
                </p>
              </div>
            )}
            {remarks && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Remarks</p>
                <p className="text-sm text-gray-700">{remarks}</p>
              </div>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto p-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                    #
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                    PO Number
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                    Company
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                    Item
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">
                    Qty Dispatched
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">
                    Pending
                  </th>
                  {canManage && (
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {safeEntries.map((entry, idx) => (
                  <tr
                    key={entry._id || entry.id || `${entry.po}-${idx}`}
                    className="hover:bg-blue-50 transition"
                  >
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-mono text-sm font-semibold text-gray-800">
                      {entry.po || "-"}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {entry.company || "-"}
                    </td>
                    <td
                      className="px-3 py-2 text-sm text-gray-700 max-w-[200px] truncate"
                      title={entry.item}
                    >
                      {entry.item || "-"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-green-600">
                      {entry.dispatchQty || 0}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {entry.newPending ?? entry.pending ?? 0}
                    </td>
                    {canManage && (
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onEditDispatch && (
                            <button
                              type="button"
                              onClick={() => handleEdit(entry)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Edit dispatch"
                              aria-label={`Edit dispatch ${entry._id || entry.id || idx + 1}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteDispatch &&
                            entry.poId &&
                            (entry._id || entry.id) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    entry._id || entry.id,
                                    entry.poId,
                                  )
                                }
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                                title="Delete dispatch"
                                aria-label={`Delete dispatch ${entry._id || entry.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 px-6 py-3 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      <ConfirmActionDialog
        confirmation={confirmation}
        onConfirm={confirmAction}
        onCancel={cancelAction}
      />
    </div>
  );
});

// ============================================
// GLOBAL DISPATCH HISTORY MODAL
// ============================================
const GlobalDispatchHistoryModal = React.memo(
  function GlobalDispatchHistoryModal({
    isOpen,
    onClose,
    dispatchHistory = {},
    formatDate,
    onDispatchEdit,
    onDispatchDelete,
  }) {
    const [selectedBill, setSelectedBill] = useState(null);
    const [showBillDetails, setShowBillDetails] = useState(false);

    const allBills = useMemo(() => {
      const bills = {};
      Object.entries(dispatchHistory).forEach(([itemKey, history]) => {
        if (!Array.isArray(history)) return;
        history.forEach((entry) => {
          const bill = entry.billNumber || "Unknown Bill";
          const groupKey = getDispatchGroupKey(entry, itemKey);
          if (!bills[groupKey]) {
            bills[groupKey] = {
              groupKey,
              billNumber: bill,
              entries: [],
              dispatchDate: entry.dispatchDate,
              transportMode: entry.transportMode,
              trackingNumber: entry.trackingNumber,
              remarks: entry.remarks,
              receivedBy: entry.receivedBy,
              totalItems: 0,
              totalQuantity: 0,
            };
          }
          bills[groupKey].entries.push({
            ...entry,
            itemKey,
            po: entry.po || "Unknown PO",
            company: entry.company || "Unknown Company",
            item: entry.item || "Unknown Item",
            poId: entry.poId,
          });
          bills[groupKey].totalItems += 1;
          bills[groupKey].totalQuantity += toNonNegativeNumber(
            entry.dispatchQty,
          );
        });
      });
      return Object.values(bills).sort(
        (a, b) =>
          (getDateTimestamp(b.dispatchDate) || 0) -
          (getDateTimestamp(a.dispatchDate) || 0),
      );
    }, [dispatchHistory]);

    useEffect(() => {
      if (!isOpen) return undefined;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (event) => {
        if (event.key === "Escape" && !showBillDetails) onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen, onClose, showBillDetails]);

    const totalBills = allBills.length;
    const totalItemsDispatched = allBills.reduce(
      (sum, bill) => sum + bill.totalItems,
      0,
    );
    const totalQuantityDispatched = allBills.reduce(
      (sum, bill) => sum + bill.totalQuantity,
      0,
    );

    const handleEditDispatch = useCallback(
      (entry, billNumber) => {
        setShowBillDetails(false);
        setSelectedBill(null);
        onDispatchEdit?.(entry, billNumber);
      },
      [onDispatchEdit],
    );

    const handleDeleteDispatch = useCallback(
      async (dispatchId, poId) => {
        if (!dispatchId) return;
        try {
          await onDispatchDelete?.({ dispatchId, poId });
          setShowBillDetails(false);
          setSelectedBill(null);
        } catch (error) {
          console.error("Failed to delete dispatch:", error);
        }
      },
      [onDispatchDelete],
    );

    if (!isOpen) return null;

    return (
      <>
        {showBillDetails && selectedBill && (
          <DispatchBillDetails
            billNumber={selectedBill.billNumber}
            entries={selectedBill.entries}
            onClose={() => {
              setShowBillDetails(false);
              setSelectedBill(null);
            }}
            onEditDispatch={handleEditDispatch}
            onDeleteDispatch={handleDeleteDispatch}
          />
        )}

        <div
          className="fixed inset-0 z-[70] overflow-y-auto p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="global-history-modal-title"
        >
          <div className="flex min-h-screen items-center justify-center">
            <div
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm transition-all duration-300"
              onClick={onClose}
              aria-hidden="true"
            />

            <div className="relative w-full max-w-6xl overflow-hidden bg-white rounded-3xl shadow-2xl shadow-slate-950/25 ring-1 ring-white/20 transition-all duration-300 animate-fadeIn">
              <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-purple-600 to-blue-700 px-5 py-4 sm:px-6">
                <div className="absolute inset-0 opacity-10">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/15">
                      <History className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3
                        id="global-history-modal-title"
                        className="text-lg font-bold tracking-tight text-white"
                      >
                        Dispatch History
                      </h3>
                      <p className="text-sm text-blue-100">
                        {totalBills} bills · {totalItemsDispatched} items ·{" "}
                        {totalQuantityDispatched} units
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="grid h-9 w-9 place-items-center rounded-xl text-white transition hover:bg-white/15"
                    aria-label="Close history dialog"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="thin-scrollbar bg-slate-50 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="px-4 py-5 sm:px-6">
                  {allBills.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">
                        No dispatch history available
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Dispatch some items to see history here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allBills.map((bill) => (
                        <div
                          key={bill.groupKey}
                          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => {
                            setSelectedBill(bill);
                            setShowBillDetails(true);
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-mono font-bold text-indigo-600 text-sm">
                                  #{bill.billNumber}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="text-xs text-gray-500">
                                  {bill.dispatchDate
                                    ? formatDate(bill.dispatchDate)
                                    : "-"}
                                </span>
                                {bill.transportMode && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-xs text-gray-500">
                                      🚚 {bill.transportMode}
                                    </span>
                                  </>
                                )}
                                {bill.receivedBy && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-xs text-gray-500">
                                      👤 {bill.receivedBy}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  📦{" "}
                                  <strong className="text-gray-700">
                                    {bill.totalItems}
                                  </strong>{" "}
                                  item{bill.totalItems > 1 ? "s" : ""}
                                </span>
                                <span className="flex items-center gap-1">
                                  📊{" "}
                                  <strong className="text-gray-700">
                                    {bill.totalQuantity}
                                  </strong>{" "}
                                  units
                                </span>
                                {bill.remarks && (
                                  <span className="text-gray-400">
                                    💬{" "}
                                    {bill.remarks.length > 30
                                      ? bill.remarks.substring(0, 30) + "..."
                                      : bill.remarks}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBill(bill);
                                  setShowBillDetails(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                              >
                                View Details
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white rounded-lg hover:bg-gray-100 transition border border-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  },
);

// ============================================
// MULTIPLE DISPATCH MODAL COMPONENT
// ============================================
const MultipleDispatchModal = React.memo(function MultipleDispatchModal({
  isOpen,
  onClose,
  selectedItems: selectedItemsInput = [],
  onDispatchUpdate,
  dispatchHistory = {},
  mergedGroup = null,
}) {
  const [individualQuantities, setIndividualQuantities] = useState({});
  const [mergedDispatchQty, setMergedDispatchQty] = useState("");
  const [dispatchDate, setDispatchDate] = useState(getLocalDateInputValue());
  const [billNumber, setBillNumber] = useState("");
  const [billFile, setBillFile] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [transportMode, setTransportMode] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedBillForDetails, setSelectedBillForDetails] = useState(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const requestIdRef = useRef(createDispatchRequestId());
  const submitLockRef = useRef(false);
  const nestedModalOpenRef = useRef(false);

  // The parent uses one state value for both the single-dispatch modal
  // (an object) and this multiple-dispatch modal (an array). Normalize that
  // boundary so this component can never call map/reduce on a PO object.
  const selectedItems = useMemo(() => {
    if (Array.isArray(selectedItemsInput)) return selectedItemsInput;
    return selectedItemsInput ? [selectedItemsInput] : [];
  }, [selectedItemsInput]);

  useEffect(() => {
    nestedModalOpenRef.current = showBillDetails;
  }, [showBillDetails]);

  useEffect(() => {
    if (!isOpen) return undefined;

    setIndividualQuantities({});
    setMergedDispatchQty("");
    setDispatchDate(getLocalDateInputValue());
    setBillNumber("");
    setBillFile(null);
    setRemarks("");
    setTransportMode("");
    setTrackingNumber("");
    setReceivedBy("");
    setErrors({});
    setSelectedBillForDetails(null);
    setShowBillDetails(false);
    requestIdRef.current = createDispatchRequestId();
    submitLockRef.current = false;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !nestedModalOpenRef.current) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const getItemKey = useCallback((item) => getPurchaseOrderKey(item), []);

  const selectedItemKeys = useMemo(
    () => new Set(selectedItems.map(getItemKey)),
    [selectedItems, getItemKey],
  );

  const groupedHistory = useMemo(() => {
    const groups = {};
    Object.entries(dispatchHistory).forEach(([itemKey, history]) => {
      if (!selectedItemKeys.has(itemKey) || !Array.isArray(history)) return;
      history.forEach((entry) => {
        const bill = entry.billNumber || "Unknown Bill";
        const groupKey = getDispatchGroupKey(entry, itemKey);
        if (!groups[groupKey]) {
          groups[groupKey] = {
            groupKey,
            billNumber: bill,
            entries: [],
            dispatchDate: entry.dispatchDate,
            transportMode: entry.transportMode,
            trackingNumber: entry.trackingNumber,
            remarks: entry.remarks,
            receivedBy: entry.receivedBy,
            totalItems: 0,
            totalQuantity: 0,
          };
        }
        groups[groupKey].entries.push({
          ...entry,
          itemKey,
          po: entry.po || "Unknown PO",
          company: entry.company || "Unknown Company",
          item: entry.item || "Unknown Item",
        });
        groups[groupKey].totalItems += 1;
        groups[groupKey].totalQuantity += toNonNegativeNumber(
          entry.dispatchQty,
        );
      });
    });
    return groups;
  }, [dispatchHistory, selectedItemKeys]);

  const getTotalPending = useCallback(() => {
    return selectedItems.reduce(
      (sum, item) => sum + toNonNegativeNumber(item.pending),
      0,
    );
  }, [selectedItems]);

  const getTotalPendingValue = useCallback(() => {
    return selectedItems.reduce(
      (sum, item) => sum + toNonNegativeNumber(item.total),
      0,
    );
  }, [selectedItems]);

  const mergedAllocationOrder = useMemo(() => {
    if (!mergedGroup) return selectedItems;
    return [...selectedItems].sort((left, right) => {
      const leftDelivery =
        getDateTimestamp(left.deliveryDate) ?? Number.POSITIVE_INFINITY;
      const rightDelivery =
        getDateTimestamp(right.deliveryDate) ?? Number.POSITIVE_INFINITY;
      if (leftDelivery !== rightDelivery) return leftDelivery - rightDelivery;

      const leftPODate =
        getDateTimestamp(left.poDate) ?? Number.POSITIVE_INFINITY;
      const rightPODate =
        getDateTimestamp(right.poDate) ?? Number.POSITIVE_INFINITY;
      if (leftPODate !== rightPODate) return leftPODate - rightPODate;

      return normalizeText(left.po).localeCompare(
        normalizeText(right.po),
        "en",
        {
          numeric: true,
          sensitivity: "base",
        },
      );
    });
  }, [mergedGroup, selectedItems]);

  const handleMergedQuantityChange = useCallback(
    (value) => {
      setMergedDispatchQty(value);

      if (value === "") {
        setIndividualQuantities({});
        return;
      }

      const quantity = Number(value);
      if (
        !Number.isFinite(quantity) ||
        !Number.isInteger(quantity) ||
        quantity < 0
      ) {
        return;
      }

      let remaining = quantity;
      const allocations = {};
      mergedAllocationOrder.forEach((item) => {
        const itemKey = getItemKey(item);
        const available = toNonNegativeNumber(item.pending);
        const allocated = Math.min(available, Math.max(0, remaining));
        allocations[itemKey] = allocated > 0 ? String(allocated) : "";
        remaining -= allocated;
      });
      setIndividualQuantities(allocations);
      setErrors((current) => ({ ...current, dispatchQty: "" }));
    },
    [getItemKey, mergedAllocationOrder],
  );

  const validate = useCallback(() => {
    const newErrors = {};
    let hasValidQuantity = false;
    const invalidItems = [];

    selectedItems.forEach((item) => {
      const itemKey = getItemKey(item);
      const rawQuantity = individualQuantities[itemKey];
      const qty = Number(rawQuantity);
      const pending = toNonNegativeNumber(item.pending);

      if (rawQuantity === undefined || rawQuantity === "" || qty === 0) {
        return;
      }
      if (!item._id) {
        invalidItems.push(
          `${item.po || item.item || "Unknown item"} (missing id)`,
        );
      } else if (
        Number.isFinite(qty) &&
        Number.isInteger(qty) &&
        qty > 0 &&
        qty <= pending
      ) {
        hasValidQuantity = true;
      } else {
        invalidItems.push(
          `${item.po || item.item || "Unknown item"} (max: ${pending})`,
        );
      }
    });

    if (!hasValidQuantity) {
      newErrors.dispatchQty =
        "Please enter valid quantities for at least one item";
    }
    if (invalidItems.length > 0) {
      newErrors.dispatchQty = `Invalid quantities for: ${invalidItems.join(", ")}`;
    }
    if (mergedGroup) {
      const mergedQuantity = Number(mergedDispatchQty);
      const totalPending = getTotalPending();
      if (
        mergedDispatchQty !== "" &&
        (!Number.isFinite(mergedQuantity) ||
          !Number.isInteger(mergedQuantity) ||
          mergedQuantity <= 0 ||
          mergedQuantity > totalPending)
      ) {
        newErrors.dispatchQty = `Merged dispatch quantity must be a whole number between 1 and ${totalPending.toLocaleString("en-IN")}`;
      }
    }

    if (!dispatchDate) {
      newErrors.dispatchDate = "Please select a dispatch date";
    } else if (dispatchDate > getLocalDateInputValue()) {
      newErrors.dispatchDate = "Dispatch date cannot be in the future";
    }
    if (!billNumber.trim()) {
      newErrors.billNumber = "Please enter a bill number";
    } else if (billNumber.trim().length > MAX_BILL_NUMBER_LENGTH) {
      newErrors.billNumber = `Bill number cannot exceed ${MAX_BILL_NUMBER_LENGTH} characters`;
    }
    const billFileError = validateBillFile(billFile);
    if (billFileError) newErrors.billFile = billFileError;
    if (remarks.trim().length > MAX_REMARKS_LENGTH) {
      newErrors.remarks = `Remarks cannot exceed ${MAX_REMARKS_LENGTH} characters`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    selectedItems,
    individualQuantities,
    dispatchDate,
    billNumber,
    billFile,
    remarks,
    getItemKey,
    mergedGroup,
    mergedDispatchQty,
    getTotalPending,
  ]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (submitLockRef.current || !validate()) return;

      submitLockRef.current = true;
      setIsSubmitting(true);
      setErrors((current) => ({ ...current, form: "" }));

      try {
        const items = selectedItems
          .map((item) => ({
            poId: item._id,
            dispatchQty: Number(individualQuantities[getItemKey(item)]) || 0,
          }))
          .filter((item) => item.dispatchQty > 0);

        await onDispatchUpdate({
          isBulk: true,
          requestId: requestIdRef.current,
          items,
          dispatchDate,
          billNumber: billNumber.trim(),
          billFile: billFile || null,
          remarks: remarks.trim(),
          transportMode: transportMode.trim(),
          trackingNumber: trackingNumber.trim(),
          receivedBy: receivedBy.trim(),
        });
        onClose();
      } catch (error) {
        setErrors((current) => ({
          ...current,
          form: getApiErrorMessage(error, "Bulk dispatch could not be saved"),
        }));
      } finally {
        submitLockRef.current = false;
        setIsSubmitting(false);
      }
    },
    [
      validate,
      selectedItems,
      individualQuantities,
      getItemKey,
      onDispatchUpdate,
      dispatchDate,
      billNumber,
      billFile,
      remarks,
      transportMode,
      trackingNumber,
      receivedBy,
      onClose,
    ],
  );

  const handleIndividualQuantityChange = useCallback(
    (itemKey, value) => {
      setIndividualQuantities((prev) => ({
        ...prev,
        [itemKey]: value,
      }));
      if (mergedGroup) setMergedDispatchQty("");
      if (errors.dispatchQty) {
        setErrors((current) => ({ ...current, dispatchQty: "" }));
      }
    },
    [errors.dispatchQty, mergedGroup],
  );

  const truncateText = useCallback((text, maxLength = 60) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }, []);

  if (!isOpen || selectedItems.length === 0) return null;

  return (
    <>
      {showBillDetails && selectedBillForDetails && (
        <DispatchBillDetails
          billNumber={selectedBillForDetails.billNumber}
          entries={selectedBillForDetails.entries}
          onClose={() => {
            setShowBillDetails(false);
            setSelectedBillForDetails(null);
          }}
        />
      )}

      <div
        className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="multiple-dispatch-modal-title"
      >
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
            @keyframes slideIn {
              from { opacity: 0; transform: translateX(-20px); }
              to { opacity: 1; transform: translateX(0); }
            }
            .animate-slideIn {
              animation: slideIn 0.3s ease-out;
            }
          `}
        </style>

        <div className="flex min-h-screen items-center justify-center">
          <div
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm transition-all duration-300"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-5xl overflow-hidden bg-white rounded-3xl shadow-2xl shadow-slate-950/25 ring-1 ring-white/20 transition-all duration-300 animate-fadeIn">
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-purple-600 to-blue-700 px-5 py-4 sm:px-6">
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/15">
                    <Layers className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3
                      id="multiple-dispatch-modal-title"
                      className="text-lg font-bold tracking-tight text-white"
                    >
                      {mergedGroup
                        ? "Merged Item Dispatch"
                        : "Multiple Dispatch"}
                    </h3>
                    <p className="text-sm text-blue-100">
                      {mergedGroup
                        ? `${selectedItems.length} eligible PO${selectedItems.length === 1 ? "" : "s"} · ${mergedGroup.item || "Merged item"}`
                        : `${selectedItems.length} items selected for dispatch`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="grid h-9 w-9 place-items-center rounded-xl text-white transition hover:bg-white/15"
                  aria-label="Close dispatch dialog"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="thin-scrollbar bg-slate-50 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <div className="px-4 py-5 sm:px-6">
                <div className="mb-5 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <Package className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Items</p>
                        <p className="font-medium text-gray-800">
                          {selectedItems.length} line items
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-rose-100 rounded-lg">
                        <Clock3 className="w-4 h-4 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Pending</p>
                        <p className="font-medium text-gray-800">
                          {getTotalPending().toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 rounded-lg">
                        <IndianRupee className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Value</p>
                        <p className="font-medium text-gray-800">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(getTotalPendingValue())}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {mergedGroup && (
                  <div className="mb-5 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 shadow-sm">
                    <div className="grid gap-4 lg:grid-cols-[1fr_220px] lg:items-end">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                            Merged allocation
                          </span>
                          <span className="text-xs text-slate-500">
                            {mergedGroup.company} ·{" "}
                            {mergedGroup.drawing || "No drawing"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          Enter one total quantity for all related POs
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          The quantity is allocated automatically to the
                          earliest delivery date first. You can still adjust
                          each PO below before submitting.
                        </p>
                        <p className="mt-2 text-xs text-indigo-700">
                          Related POs:{" "}
                          {mergedGroup.poNumbers?.join(", ") || "-"}
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="merged-dispatch-quantity"
                          className="mb-1.5 block text-xs font-semibold text-slate-700"
                        >
                          Total dispatch quantity
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="merged-dispatch-quantity"
                            type="number"
                            min="1"
                            max={getTotalPending()}
                            step="1"
                            inputMode="numeric"
                            value={mergedDispatchQty}
                            onChange={(event) =>
                              handleMergedQuantityChange(event.target.value)
                            }
                            placeholder="Enter total"
                            className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                          />
                          <span className="whitespace-nowrap text-xs text-slate-500">
                            / {getTotalPending().toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {Object.keys(groupedHistory).length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Dispatch History (Bill-wise)
                      </label>
                      <span className="text-xs text-gray-500">
                        {Object.keys(groupedHistory).length} bills
                      </span>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <div className="space-y-2">
                        {Object.values(groupedHistory).map((group) => (
                          <div
                            key={group.groupKey}
                            className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedBillForDetails(group);
                              setShowBillDetails(true);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-semibold text-indigo-600 text-sm">
                                    #{group.billNumber}
                                  </span>
                                  <span className="text-gray-300">|</span>
                                  <span className="text-xs text-gray-500">
                                    {formatDateValue(group.dispatchDate)}
                                  </span>
                                  {group.transportMode && (
                                    <>
                                      <span className="text-gray-300">|</span>
                                      <span className="text-xs text-gray-500">
                                        🚚 {group.transportMode}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span>
                                    📦 {group.totalItems} item
                                    {group.totalItems > 1 ? "s" : ""}
                                  </span>
                                  <span>📊 {group.totalQuantity} units</span>
                                  {group.receivedBy && (
                                    <span>👤 {group.receivedBy}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-indigo-600 font-medium">
                                  View Details
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {mergedGroup
                        ? "PO-wise Allocation"
                        : "Set Quantity Per Item"}
                    </label>
                    <span className="text-xs text-gray-500">
                      {mergedGroup
                        ? "Review or adjust the automatic allocation"
                        : "Enter quantity for each item below"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="space-y-3">
                      {selectedItems.map((item) => {
                        const itemKey = getItemKey(item);
                        const historyCount =
                          dispatchHistory[itemKey]?.length || 0;
                        const individualQty =
                          individualQuantities[itemKey] || "";
                        const maxQty = toNonNegativeNumber(item.pending);

                        return (
                          <div
                            key={itemKey}
                            className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:border-purple-200 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="font-mono font-semibold text-gray-600 text-sm">
                                    {item.po}
                                  </span>
                                  <span className="text-gray-300">|</span>
                                  <span className="text-gray-700 text-sm font-medium">
                                    {item.company}
                                  </span>
                                  {historyCount > 0 && (
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                      {historyCount} dispatches
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                  <span
                                    className="text-gray-500 truncate max-w-[200px] sm:max-w-[300px]"
                                    title={item.item}
                                  >
                                    📦 {truncateText(item.item, 50)}
                                  </span>
                                  {item.drawing && (
                                    <>
                                      <span className="text-gray-300">|</span>
                                      <span
                                        className="text-gray-500 font-mono"
                                        title={item.drawing}
                                      >
                                        📐 {item.drawing}
                                      </span>
                                    </>
                                  )}
                                  {item.itemCode && (
                                    <>
                                      <span className="text-gray-300">|</span>
                                      <span className="text-gray-400 font-mono text-[10px]">
                                        Code: {item.itemCode}
                                      </span>
                                    </>
                                  )}
                                </div>

                                <div className="mt-1">
                                  <span className="text-xs text-gray-500">
                                    Pending:{" "}
                                    <span className="font-semibold text-rose-600">
                                      {maxQty}
                                    </span>
                                    {item.poQty && (
                                      <span className="text-gray-400">
                                        {" "}
                                        (Total: {item.poQty})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 sm:ml-4">
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  Qty:
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max={maxQty}
                                  step="1"
                                  inputMode="numeric"
                                  value={individualQty}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    handleIndividualQuantityChange(
                                      itemKey,
                                      val,
                                    );
                                  }}
                                  className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Enter qty"
                                />
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                  / {maxQty}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {errors.dispatchQty && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.dispatchQty}
                    </p>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {errors.form && (
                    <div
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                      role="alert"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errors.form}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <span className="text-red-500">*</span>
                        Dispatch Date
                      </label>
                      <input
                        type="date"
                        value={dispatchDate}
                        max={getLocalDateInputValue()}
                        onChange={(e) => {
                          setDispatchDate(e.target.value);
                          if (errors.dispatchDate)
                            setErrors((current) => ({
                              ...current,
                              dispatchDate: "",
                            }));
                        }}
                        className={`w-full px-3 py-2 border ${errors.dispatchDate ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      />
                      {errors.dispatchDate && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.dispatchDate}
                        </p>
                      )}
                    </div>

                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <span className="text-red-500">*</span>
                        Bill Number
                      </label>
                      <input
                        type="text"
                        value={billNumber}
                        maxLength={MAX_BILL_NUMBER_LENGTH}
                        onChange={(e) => {
                          setBillNumber(e.target.value);
                          if (errors.billNumber)
                            setErrors((current) => ({
                              ...current,
                              billNumber: "",
                            }));
                        }}
                        placeholder="Enter bill number"
                        className={`w-full px-3 py-2 border ${errors.billNumber ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      />
                      {errors.billNumber && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.billNumber}
                        </p>
                      )}
                    </div>

                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Upload className="h-4 w-4 text-blue-600" />
                        Bill Upload
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                          Optional
                        </span>
                      </label>

                      <label
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2.5 transition ${
                          errors.billFile
                            ? "border-red-300 bg-red-50"
                            : billFile
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText
                            className={`h-4 w-4 shrink-0 ${
                              billFile ? "text-emerald-600" : "text-gray-500"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-gray-700">
                              {billFile ? billFile.name : "Choose bill file"}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              PDF, JPG or PNG • Max 5 MB • Not required
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-blue-600 shadow-sm">
                          Browse
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            const error = validateBillFile(file);
                            if (error) {
                              setBillFile(null);
                              setErrors((current) => ({
                                ...current,
                                billFile: error,
                              }));
                              e.target.value = "";
                              return;
                            }
                            setBillFile(file);
                            setErrors((current) => ({
                              ...current,
                              billFile: "",
                            }));
                          }}
                        />
                      </label>

                      {billFile && (
                        <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
                          <span className="truncate pr-2">
                            {billFile.name} •{" "}
                            {(billFile.size / 1024).toFixed(1)} KB
                          </span>
                          <button
                            type="button"
                            onClick={() => setBillFile(null)}
                            className="shrink-0 rounded-md p-1 hover:bg-emerald-100"
                            title="Remove bill file"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      {errors.billFile && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          {errors.billFile}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      maxLength={MAX_REMARKS_LENGTH}
                      placeholder="Additional notes, special instructions, etc."
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                    />
                    {errors.remarks && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.remarks}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transport Mode
                      </label>
                      <input
                        type="text"
                        value={transportMode}
                        onChange={(e) => setTransportMode(e.target.value)}
                        maxLength={MAX_SHORT_TEXT_LENGTH}
                        placeholder="Road, courier, pickup..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tracking / LR Number
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        maxLength={MAX_SHORT_TEXT_LENGTH}
                        placeholder="Optional reference"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Received By
                      </label>
                      <input
                        type="text"
                        value={receivedBy}
                        onChange={(e) => setReceivedBy(e.target.value)}
                        maxLength={MAX_SHORT_TEXT_LENGTH}
                        placeholder="Receiver name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Bulk Dispatch Summary</p>
                        <p className="text-xs text-blue-600">
                          This will dispatch specified quantities across{" "}
                          {selectedItems.length} items.
                          {Object.values(individualQuantities).some(
                            (qty) => Number(qty) > 0,
                          )
                            ? ` Total items with quantity: ${Object.values(individualQuantities).filter((qty) => Number(qty) > 0).length}`
                            : " Please enter quantities for items you want to dispatch."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all transform hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || selectedItems.length === 0}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Dispatch All
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

// ============================================
// DISPATCH HISTORY ITEM COMPONENT
// ============================================
const DispatchHistoryItem = React.memo(function DispatchHistoryItem({
  entry,
  index,
  onEdit,
  onDelete,
  isEditable = false,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!showDeleteConfirm) {
        setShowDeleteConfirm(true);
        return;
      }
      onDelete?.(entry._id || entry.id);
      setShowDeleteConfirm(false);
    },
    [showDeleteConfirm, onDelete, entry],
  );

  const handleEditClick = useCallback(
    (e) => {
      e.stopPropagation();
      onEdit?.(entry);
    },
    [onEdit, entry],
  );

  return (
    <div className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-sm border border-gray-100 animate-slideIn">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-sm font-semibold text-gray-800">
            {entry.dispatchQty} units
          </span>
          <span className="text-xs text-gray-500">
            {formatDateValue(entry.dispatchDate)}
          </span>
          {entry.billNumber && (
            <span className="text-xs text-gray-500">
              Bill: {entry.billNumber}
            </span>
          )}
          {entry.transportMode && (
            <span className="text-xs text-gray-500">
              Mode: {entry.transportMode}
            </span>
          )}
          {entry.isBulkDispatch && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              <Layers className="w-3 h-3" />
              Bulk ({entry.totalItemsDispatched} items)
            </span>
          )}
          {entry.trackingNumber && (
            <span className="text-xs text-gray-500">
              Tracking: {entry.trackingNumber}
            </span>
          )}
        </div>
        {entry.remarks && (
          <p className="mt-1 text-xs text-gray-500">{entry.remarks}</p>
        )}
        {entry.receivedBy && (
          <p className="mt-0.5 text-xs text-gray-400">
            Received by: {entry.receivedBy}
          </p>
        )}
      </div>
      {isEditable && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleEditClick}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Edit dispatch"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            className={`p-1.5 rounded-lg transition ${
              showDeleteConfirm
                ? "text-white bg-red-600 hover:bg-red-700"
                : "text-red-500 hover:bg-red-50"
            }`}
            title={showDeleteConfirm ? "Confirm delete" : "Delete dispatch"}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {showDeleteConfirm && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(false);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition text-xs"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================
// DISPATCH MODAL COMPONENT (with Edit/Delete)
// ============================================
const DispatchModal = React.memo(function DispatchModal({
  isOpen,
  onClose,
  item,
  onDispatchUpdate,
  onDispatchEdit,
  onDispatchDelete,
  dispatchHistory = [],
  initialDispatchEntry = null,
}) {
  const [dispatchQty, setDispatchQty] = useState("");
  const [dispatchDate, setDispatchDate] = useState(getLocalDateInputValue());
  const [billNumber, setBillNumber] = useState("");
  const [billFile, setBillFile] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [transportMode, setTransportMode] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("dispatch");
  const [isEditingDispatch, setIsEditingDispatch] = useState(false);
  const [editingDispatchEntry, setEditingDispatchEntry] = useState(null);
  const requestIdRef = useRef(createDispatchRequestId());
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const initialEntryId =
      initialDispatchEntry?._id || initialDispatchEntry?.id;
    const shouldEdit = Boolean(initialEntryId);
    setDispatchQty(
      shouldEdit ? String(initialDispatchEntry.dispatchQty || 0) : "",
    );
    setDispatchDate(
      shouldEdit
        ? toDateInputValue(initialDispatchEntry.dispatchDate) ||
            getLocalDateInputValue()
        : getLocalDateInputValue(),
    );
    setBillNumber(shouldEdit ? initialDispatchEntry.billNumber || "" : "");
    setBillFile(null);
    setRemarks(shouldEdit ? initialDispatchEntry.remarks || "" : "");
    setTransportMode(
      shouldEdit ? initialDispatchEntry.transportMode || "" : "",
    );
    setTrackingNumber(
      shouldEdit ? initialDispatchEntry.trackingNumber || "" : "",
    );
    setReceivedBy(shouldEdit ? initialDispatchEntry.receivedBy || "" : "");
    setErrors({});
    setIsFullscreen(false);
    const itemStatus = normalizeText(item?.status).toLowerCase();
    const dispatchBlocked = ["on hold", "cancelled"].includes(itemStatus);
    setActiveTab(
      shouldEdit ||
        ((Number(item?.pending) || 0) > 0 && !dispatchBlocked && item?._id)
        ? "dispatch"
        : "history",
    );
    setIsEditingDispatch(shouldEdit);
    setEditingDispatchEntry(shouldEdit ? initialDispatchEntry : null);
    requestIdRef.current = createDispatchRequestId();
    submitLockRef.current = false;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, item, initialDispatchEntry, onClose]);

  const getMaxDispatch = useCallback(() => {
    const pending = toNonNegativeNumber(item?.pending);
    const originalQuantity = isEditingDispatch
      ? toNonNegativeNumber(editingDispatchEntry?.dispatchQty)
      : 0;
    return pending + originalQuantity;
  }, [item, isEditingDispatch, editingDispatchEntry]);

  const validate = useCallback(() => {
    const newErrors = {};
    const quantity = Number(dispatchQty);
    const maximum = getMaxDispatch();

    if (
      !Number.isFinite(quantity) ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      newErrors.dispatchQty =
        "Dispatch quantity must be a positive whole number";
    }
    if (quantity > maximum) {
      newErrors.dispatchQty = `Cannot dispatch more than the available quantity (${maximum.toLocaleString("en-IN")})`;
    }
    if (!item?._id) {
      newErrors.form =
        "This record has no database id. Refresh or re-import it before dispatching.";
    }
    const status = normalizeText(item?.status).toLowerCase();
    if (!isEditingDispatch && ["on hold", "cancelled"].includes(status)) {
      newErrors.form = `${item.status} purchase orders cannot be dispatched`;
    }
    if (!dispatchDate) {
      newErrors.dispatchDate = "Please select a dispatch date";
    } else if (dispatchDate > getLocalDateInputValue()) {
      newErrors.dispatchDate = "Dispatch date cannot be in the future";
    }
    if (!billNumber.trim()) {
      newErrors.billNumber = "Please enter a bill number";
    } else if (billNumber.trim().length > MAX_BILL_NUMBER_LENGTH) {
      newErrors.billNumber = `Bill number cannot exceed ${MAX_BILL_NUMBER_LENGTH} characters`;
    }
    const billFileError = validateBillFile(billFile);
    if (billFileError) newErrors.billFile = billFileError;
    if (remarks.trim().length > MAX_REMARKS_LENGTH) {
      newErrors.remarks = `Remarks cannot exceed ${MAX_REMARKS_LENGTH} characters`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    dispatchQty,
    item,
    dispatchDate,
    billNumber,
    billFile,
    remarks,
    getMaxDispatch,
    isEditingDispatch,
  ]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (submitLockRef.current || !validate()) return;

      submitLockRef.current = true;
      setIsSubmitting(true);
      const quantity = Number(dispatchQty);
      setErrors((current) => ({ ...current, form: "" }));

      try {
        await onDispatchUpdate({
          isBulk: false,
          requestId: requestIdRef.current,
          poId: item._id,
          dispatchQty: quantity,
          dispatchDate,
          billNumber: billNumber.trim(),
          billFile: billFile || null,
          remarks: remarks.trim(),
          transportMode: transportMode.trim(),
          trackingNumber: trackingNumber.trim(),
          receivedBy: receivedBy.trim(),
        });
        onClose();
      } catch (error) {
        setErrors((current) => ({
          ...current,
          form: getApiErrorMessage(error, "Dispatch could not be saved"),
        }));
      } finally {
        submitLockRef.current = false;
        setIsSubmitting(false);
      }
    },
    [
      validate,
      dispatchQty,
      dispatchDate,
      billNumber,
      billFile,
      remarks,
      transportMode,
      trackingNumber,
      receivedBy,
      onDispatchUpdate,
      item,
      onClose,
    ],
  );

  const applyQuickQuantity = useCallback(
    (fraction) => {
      const maximum = Number(getMaxDispatch()) || 0;
      const quantity =
        fraction === 1
          ? maximum
          : Math.min(maximum, Math.max(1, Math.ceil(maximum * fraction)));
      setDispatchQty(String(quantity));
      if (errors.dispatchQty) {
        setErrors((current) => ({ ...current, dispatchQty: "" }));
      }
    },
    [getMaxDispatch, errors.dispatchQty],
  );

  const getPendingPercentage = useCallback(() => {
    if (!item) return 0;
    const total = Number(item.poQty) || 0;
    if (total <= 0) return 0;
    return Math.min(
      100,
      Math.max(0, ((Number(item.pending) || 0) / total) * 100),
    );
  }, [item]);

  const getProgressColor = useCallback(() => {
    const percentage = getPendingPercentage();
    if (percentage > 50) return "bg-rose-500";
    if (percentage > 25) return "bg-amber-500";
    return "bg-emerald-500";
  }, [getPendingPercentage]);

  const handleEditDispatch = useCallback((entry) => {
    setEditingDispatchEntry(entry);
    setIsEditingDispatch(true);
    setDispatchQty(String(entry.dispatchQty || 0));
    setDispatchDate(
      entry.dispatchDate
        ? toDateInputValue(entry.dispatchDate)
        : getLocalDateInputValue(),
    );
    setBillNumber(entry.billNumber || "");
    setRemarks(entry.remarks || "");
    setTransportMode(entry.transportMode || "");
    setTrackingNumber(entry.trackingNumber || "");
    setReceivedBy(entry.receivedBy || "");
    setActiveTab("dispatch");
  }, []);

  const handleUpdateDispatch = useCallback(
    async (e) => {
      e.preventDefault();
      if (submitLockRef.current || !validate()) return;

      submitLockRef.current = true;
      setIsSubmitting(true);
      setErrors((current) => ({ ...current, form: "" }));

      try {
        const dispatchId =
          editingDispatchEntry?._id || editingDispatchEntry?.id;
        if (!dispatchId) {
          throw new Error("The selected dispatch entry has no id");
        }
        await onDispatchEdit?.({
          dispatchId,
          poId: item._id,
          dispatchQty: Number(dispatchQty),
          dispatchDate,
          billNumber: billNumber.trim(),
          billFile: billFile || null,
          remarks: remarks.trim(),
          transportMode: transportMode.trim(),
          trackingNumber: trackingNumber.trim(),
          receivedBy: receivedBy.trim(),
        });
        setIsEditingDispatch(false);
        setEditingDispatchEntry(null);
        onClose();
      } catch (error) {
        setErrors((current) => ({
          ...current,
          form: getApiErrorMessage(error, "Dispatch update failed"),
        }));
      } finally {
        submitLockRef.current = false;
        setIsSubmitting(false);
      }
    },
    [
      validate,
      dispatchQty,
      dispatchDate,
      billNumber,
      billFile,
      remarks,
      transportMode,
      trackingNumber,
      receivedBy,
      onDispatchEdit,
      item,
      editingDispatchEntry,
      onClose,
    ],
  );

  const handleDeleteDispatch = useCallback(
    async (dispatchId) => {
      try {
        await onDispatchDelete?.({
          dispatchId,
          poId: item._id,
        });
        onClose();
      } catch (error) {
        setErrors((current) => ({
          ...current,
          form: getApiErrorMessage(error, "Delete failed"),
        }));
      }
    },
    [onDispatchDelete, item, onClose],
  );

  if (!isOpen || !item) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto ${isFullscreen ? "p-0" : "p-2 sm:p-4"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispatch-modal-title"
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .animate-slideIn { animation: slideIn 0.3s ease-out; }
          .animate-pulse-slow { animation: pulse 2s infinite; }
        `}
      </style>

      <div className="flex min-h-screen items-center justify-center">
        <div
          className={`fixed inset-0 transition-all duration-300 ${isOpen ? "bg-slate-950/65 backdrop-blur-sm" : "bg-slate-950/0"}`}
          onClick={onClose}
          aria-hidden="true"
        />

        <div
          className={`relative overflow-hidden bg-white shadow-2xl shadow-slate-950/25 ring-1 ring-white/20 transition-all duration-300 ${
            isFullscreen
              ? "h-full w-full rounded-none"
              : "w-full max-w-5xl rounded-3xl"
          } ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-5 py-4 sm:px-6">
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/15">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3
                    id="dispatch-modal-title"
                    className="text-lg font-bold tracking-tight text-white"
                  >
                    {isEditingDispatch
                      ? "Edit Dispatch"
                      : "Dispatch Management"}
                  </h3>
                  <p className="text-sm text-blue-100">
                    {isEditingDispatch
                      ? `Editing dispatch for ${item?.po || "PO"}`
                      : `Update dispatch details for ${item?.po || "PO"}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFullscreen((current) => !current)}
                  className="grid h-9 w-9 place-items-center rounded-xl text-white transition hover:bg-white/15"
                  aria-label={
                    isFullscreen ? "Exit fullscreen" : "Open fullscreen"
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="grid h-9 w-9 place-items-center rounded-xl text-white transition hover:bg-white/15"
                  aria-label="Close dispatch dialog"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div
            className={`thin-scrollbar bg-slate-50 ${isFullscreen ? "h-[calc(100vh-72px)] overflow-y-auto" : "max-h-[calc(100vh-7rem)] overflow-y-auto"}`}
          >
            <div className="px-4 py-5 sm:px-6">
              <div className="mb-5 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">PO Number</p>
                      <p className="font-medium text-gray-800">{item?.po}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <Building2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="font-medium text-gray-800">
                        {item?.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          item?.pending === 0
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item?.pending === 0 ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock3 className="h-3 w-3" />
                        )}
                        {item?.pending === 0 ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-100 rounded-lg">
                      <Clock3 className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pending %</p>
                      <p className="font-medium text-gray-800">
                        {getPendingPercentage().toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{getPendingPercentage().toFixed(1)}% remaining</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
                      style={{
                        width: `${100 - getPendingPercentage()}%`,
                        transition: "width 1s ease-in-out",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4 inline-flex rounded-xl bg-slate-200/70 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("dispatch");
                    if (isEditingDispatch) return;
                    setIsEditingDispatch(false);
                    setEditingDispatchEntry(null);
                    setDispatchQty("");
                    setDispatchDate(getLocalDateInputValue());
                    setBillNumber("");
                    setRemarks("");
                    setTransportMode("");
                    setTrackingNumber("");
                    setReceivedBy("");
                  }}
                  disabled={
                    (Number(item?.pending) || 0) <= 0 && !isEditingDispatch
                  }
                  className={`relative inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    activeTab === "dispatch"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Truck className="w-4 h-4 inline mr-2" />
                  {isEditingDispatch ? "Edit Dispatch" : "New Dispatch"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`relative inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "history"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <History className="w-4 h-4 inline mr-2" />
                  History ({dispatchHistory.length})
                  {dispatchHistory.length > 0 && (
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              </div>

              {activeTab === "history" && (
                <div className="thin-scrollbar mb-6 max-h-[440px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-100/70 p-4">
                  {dispatchHistory && dispatchHistory.length > 0 ? (
                    <div className="space-y-3">
                      {dispatchHistory.map((entry, index) => (
                        <DispatchHistoryItem
                          key={entry._id || index}
                          entry={entry}
                          index={index}
                          isEditable={true}
                          onEdit={handleEditDispatch}
                          onDelete={handleDeleteDispatch}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No dispatch history available</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "dispatch" && (
                <form
                  onSubmit={
                    isEditingDispatch ? handleUpdateDispatch : handleSubmit
                  }
                  className="space-y-4"
                >
                  {errors.form && (
                    <div
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                      role="alert"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errors.form}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <span className="text-red-500">*</span>
                        Dispatch Quantity
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={dispatchQty}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDispatchQty(val);
                            if (errors.dispatchQty)
                              setErrors((current) => ({
                                ...current,
                                dispatchQty: "",
                              }));
                          }}
                          placeholder={`Max: ${getMaxDispatch()}`}
                          className={`w-full px-3 py-2 border ${errors.dispatchQty ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                          min="1"
                          max={getMaxDispatch()}
                          step="1"
                          inputMode="numeric"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                          / {getMaxDispatch()}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        {[0.25, 0.5, 1].map((fraction) => (
                          <button
                            key={fraction}
                            type="button"
                            onClick={() => applyQuickQuantity(fraction)}
                            className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-100 transition hover:bg-blue-100"
                          >
                            {fraction === 1 ? "Max" : `${fraction * 100}%`}
                          </button>
                        ))}
                      </div>
                      {errors.dispatchQty && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.dispatchQty}
                        </p>
                      )}
                    </div>

                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <span className="text-red-500">*</span>
                        Dispatch Date
                      </label>
                      <input
                        type="date"
                        value={dispatchDate}
                        max={getLocalDateInputValue()}
                        onChange={(e) => {
                          setDispatchDate(e.target.value);
                          if (errors.dispatchDate)
                            setErrors((current) => ({
                              ...current,
                              dispatchDate: "",
                            }));
                        }}
                        className={`w-full px-3 py-2 border ${errors.dispatchDate ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      />
                      {errors.dispatchDate && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.dispatchDate}
                        </p>
                      )}
                    </div>

                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <span className="text-red-500">*</span>
                        Bill Number
                      </label>
                      <input
                        type="text"
                        value={billNumber}
                        maxLength={MAX_BILL_NUMBER_LENGTH}
                        onChange={(e) => {
                          setBillNumber(e.target.value);
                          if (errors.billNumber)
                            setErrors((current) => ({
                              ...current,
                              billNumber: "",
                            }));
                        }}
                        placeholder="Enter bill number"
                        className={`w-full px-3 py-2 border ${errors.billNumber ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      />
                      {errors.billNumber && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.billNumber}
                        </p>
                      )}
                    </div>

                    <div className="transform transition-all hover:scale-[1.01]">
                      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Upload className="h-4 w-4 text-blue-600" />
                        Bill Upload
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                          Optional
                        </span>
                      </label>

                      <label
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2.5 transition ${
                          errors.billFile
                            ? "border-red-300 bg-red-50"
                            : billFile
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText
                            className={`h-4 w-4 shrink-0 ${
                              billFile ? "text-emerald-600" : "text-gray-500"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-gray-700">
                              {billFile ? billFile.name : "Choose bill file"}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              PDF, JPG or PNG • Max 5 MB • Not required
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-blue-600 shadow-sm">
                          Browse
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            const error = validateBillFile(file);
                            if (error) {
                              setBillFile(null);
                              setErrors((current) => ({
                                ...current,
                                billFile: error,
                              }));
                              e.target.value = "";
                              return;
                            }
                            setBillFile(file);
                            setErrors((current) => ({
                              ...current,
                              billFile: "",
                            }));
                          }}
                        />
                      </label>

                      {billFile && (
                        <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
                          <span className="truncate pr-2">
                            {billFile.name} •{" "}
                            {(billFile.size / 1024).toFixed(1)} KB
                          </span>
                          <button
                            type="button"
                            onClick={() => setBillFile(null)}
                            className="shrink-0 rounded-md p-1 hover:bg-emerald-100"
                            title="Remove bill file"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      {errors.billFile && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          {errors.billFile}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2 transform transition-all hover:scale-[1.01]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        maxLength={MAX_REMARKS_LENGTH}
                        placeholder="Additional notes, special instructions, etc."
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                      />
                      {errors.remarks && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.remarks}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transport Mode
                      </label>
                      <input
                        type="text"
                        value={transportMode}
                        onChange={(e) => setTransportMode(e.target.value)}
                        maxLength={MAX_SHORT_TEXT_LENGTH}
                        placeholder="Road, courier, pickup..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tracking / LR Number
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        maxLength={MAX_SHORT_TEXT_LENGTH}
                        placeholder="Optional reference"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Received By
                      </label>
                      <input
                        type="text"
                        value={receivedBy}
                        onChange={(e) => setReceivedBy(e.target.value)}
                        maxLength={MAX_SHORT_TEXT_LENGTH}
                        placeholder="Receiver name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    {isEditingDispatch && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingDispatch(false);
                          setEditingDispatchEntry(null);
                          setDispatchQty("");
                          setDispatchDate(getLocalDateInputValue());
                          setBillNumber("");
                          setRemarks("");
                          setTransportMode("");
                          setTrackingNumber("");
                          setReceivedBy("");
                          setActiveTab("history");
                        }}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all transform hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {isEditingDispatch
                            ? "Update Dispatch"
                            : "Confirm Dispatch"}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// READ-ONLY PO VIEW MODAL (CLIENT SAFE)
// ============================================
const PurchaseOrderViewModal = React.memo(function PurchaseOrderViewModal({
  isOpen,
  onClose,
  item,
  formatCurrency,
  formatDate,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const sourceItems = getSourcePurchaseOrders(item);
  const fields = [
    ["Company", item.company || "—"],
    ["PO Number", item.po || "—"],
    ["Item", item.item || "—"],
    ["Item Code", item.itemCode || "—"],
    ["Drawing", item.drawing || "—"],
    ["PO Date", formatDate(item.poDate)],
    ["Delivery Date", formatDate(item.deliveryDate)],
    ["PO Quantity", toNonNegativeNumber(item.poQty).toLocaleString("en-IN")],
    [
      "Dispatched",
      toNonNegativeNumber(item.dispatched).toLocaleString("en-IN"),
    ],
    ["Rejected", toNonNegativeNumber(item.rejected).toLocaleString("en-IN")],
    [
      "Net Accepted",
      toNonNegativeNumber(item.accepted).toLocaleString("en-IN"),
    ],
    ["Pending", toNonNegativeNumber(item.pending).toLocaleString("en-IN")],
    ["Unit Rate", formatCurrency(item.rate)],
    ["Status", item.status || "Pending"],
  ];

  return (
    <div
      className="fixed inset-0 z-[15000] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="po-view-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close purchase order view"
      />
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-100">
              Read only
            </p>
            <h3 id="po-view-title" className="mt-1 text-xl font-bold">
              Purchase Order Details
            </h3>
            <p className="mt-1 text-sm text-blue-100">
              {item.company || "Unknown company"} ·{" "}
              {item.item || "Unnamed item"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-white transition hover:bg-white/15"
            aria-label="Close purchase order view"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {label}
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {sourceItems.length > 1 && (
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-bold text-slate-800">
                  Related Purchase Orders
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  This merged item contains {sourceItems.length} source PO
                  lines.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-slate-800 text-xs text-white">
                    <tr>
                      <th className="px-3 py-2 text-left">PO</th>
                      <th className="px-3 py-2 text-left">PO Date</th>
                      <th className="px-3 py-2 text-left">Due Date</th>
                      <th className="px-3 py-2 text-right">PO Qty</th>
                      <th className="px-3 py-2 text-right">Dispatched</th>
                      <th className="px-3 py-2 text-right">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sourceItems.map((sourceItem) => (
                      <tr key={getPurchaseOrderKey(sourceItem)}>
                        <td className="px-3 py-2 font-mono font-semibold text-slate-700">
                          {sourceItem.po || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {formatDate(sourceItem.poDate)}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {formatDate(sourceItem.deliveryDate)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {toNonNegativeNumber(sourceItem.poQty).toLocaleString(
                            "en-IN",
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {toNonNegativeNumber(
                            sourceItem.dispatched,
                          ).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-rose-600">
                          {toNonNegativeNumber(
                            sourceItem.pending,
                          ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================
// EDIT/DELETE PO MODAL COMPONENT
// ============================================
const EditDeleteModal = React.memo(function EditDeleteModal({
  isOpen,
  onClose,
  item,
  onUpdate,
  onDelete,
  initialDeleteConfirmation = false,
}) {
  const [formData, setFormData] = useState({
    po: "",
    poDate: "",
    deliveryDate: "",
    company: "",
    item: "",
    itemCode: "",
    drawing: "",
    poQty: "",
    rate: "",
    status: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (!item || !isOpen) return undefined;
    setFormData({
      po: item.po || "",
      poDate: toDateInputValue(item.poDate),
      deliveryDate: toDateInputValue(item.deliveryDate),
      company: item.company || "",
      item: item.item || "",
      itemCode: item.itemCode || "",
      drawing: item.drawing || "",
      poQty: item.poQty ?? "",
      rate: item.rate ?? "",
      status: item.status || "Pending",
    });
    setErrors({});
    setShowDeleteConfirm(initialDeleteConfirmation);
    setIsSubmitting(false);
    submitLockRef.current = false;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, isOpen, onClose, initialDeleteConfirmation]);

  const handleChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors],
  );

  const validate = useCallback(() => {
    const newErrors = {};
    const poQty = Number(formData.poQty);
    const rate = Number(formData.rate);
    const dispatched = toNonNegativeNumber(item?.dispatched);
    if (!normalizeText(formData.po)) newErrors.po = "PO number is required";
    if (!normalizeText(formData.company))
      newErrors.company = "Company is required";
    if (!normalizeText(formData.item))
      newErrors.item = "Item description is required";
    if (!formData.poDate) newErrors.poDate = "PO date is required";
    if (!formData.deliveryDate)
      newErrors.deliveryDate = "Delivery date is required";
    if (!Number.isFinite(poQty) || !Number.isInteger(poQty) || poQty <= 0) {
      newErrors.poQty = "PO quantity must be a positive whole number";
    } else if (poQty < dispatched) {
      newErrors.poQty = `PO quantity cannot be lower than the already dispatched quantity (${dispatched.toLocaleString("en-IN")})`;
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      newErrors.rate = "Rate must be greater than 0";
    }
    if (
      formData.poDate &&
      formData.deliveryDate &&
      formData.deliveryDate < formData.poDate
    ) {
      newErrors.deliveryDate = "Delivery date cannot be before the PO date";
    }
    if (
      normalizeText(formData.status).toLowerCase() === "completed" &&
      Number.isFinite(poQty) &&
      poQty > dispatched
    ) {
      newErrors.status =
        "A PO can be completed only when its full quantity is dispatched";
    }
    if (!item?._id) {
      newErrors.form = "This purchase order has no database id";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, item]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (submitLockRef.current || !validate()) return;

      submitLockRef.current = true;
      setIsSubmitting(true);
      try {
        const poQty = Number(formData.poQty);
        const rate = Number(formData.rate);
        const dispatched = toNonNegativeNumber(item.dispatched);
        const pending = Math.max(0, poQty - dispatched);
        const requestedStatus = normalizeText(formData.status).toLowerCase();
        const status = ["on hold", "cancelled"].includes(requestedStatus)
          ? requestedStatus === "on hold"
            ? "On Hold"
            : "Cancelled"
          : pending <= 0
            ? "Completed"
            : dispatched > 0
              ? "In Progress"
              : "Pending";
        const updateData = {
          ...formData,
          po: normalizeText(formData.po),
          company: normalizeText(formData.company),
          item: normalizeText(formData.item),
          itemCode: normalizeText(formData.itemCode),
          drawing: normalizeText(formData.drawing),
          poQty,
          rate,
          pending,
          total: pending * rate,
          status,
        };
        await onUpdate(item._id, updateData);
        onClose();
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          form: getApiErrorMessage(error, "Update failed"),
        }));
      } finally {
        submitLockRef.current = false;
        setIsSubmitting(false);
      }
    },
    [formData, validate, onUpdate, item, onClose],
  );

  const handleDelete = useCallback(async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    if (submitLockRef.current || !item?._id) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    try {
      await onDelete(item._id);
      onClose();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: getApiErrorMessage(error, "Delete failed"),
      }));
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  }, [showDeleteConfirm, onDelete, item, onClose]);

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-fadeIn">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {showDeleteConfirm
                    ? "Delete Purchase Order"
                    : "Edit Purchase Order"}
                </h3>
                <p className="text-sm text-blue-100">
                  #{item.po} · {item.company}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg text-white hover:bg-white/15 transition"
                aria-label="Close purchase-order editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-5 sm:p-6"
          >
            {errors.form && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 mb-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> PO Number
                </label>
                <input
                  type="text"
                  value={formData.po}
                  maxLength={MAX_SHORT_TEXT_LENGTH}
                  onChange={(e) => handleChange("po", e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.po ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.po && (
                  <p className="text-xs text-red-600 mt-1">{errors.po}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  maxLength={MAX_SHORT_TEXT_LENGTH}
                  onChange={(e) => handleChange("company", e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.company ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.company && (
                  <p className="text-xs text-red-600 mt-1">{errors.company}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> PO Date
                </label>
                <input
                  type="date"
                  value={formData.poDate}
                  onChange={(e) => handleChange("poDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.poDate && (
                  <p className="text-xs text-red-600 mt-1">{errors.poDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  min={formData.poDate || undefined}
                  onChange={(e) => handleChange("deliveryDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.deliveryDate && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.deliveryDate}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> Item Description
                </label>
                <input
                  type="text"
                  value={formData.item}
                  maxLength={MAX_SHORT_TEXT_LENGTH}
                  onChange={(e) => handleChange("item", e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.item ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.item && (
                  <p className="text-xs text-red-600 mt-1">{errors.item}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Code
                </label>
                <input
                  type="text"
                  value={formData.itemCode}
                  maxLength={MAX_SHORT_TEXT_LENGTH}
                  onChange={(e) => handleChange("itemCode", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drawing Number
                </label>
                <input
                  type="text"
                  value={formData.drawing}
                  maxLength={MAX_SHORT_TEXT_LENGTH}
                  onChange={(e) => handleChange("drawing", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> PO Quantity
                </label>
                <input
                  type="number"
                  min={Math.max(1, toNonNegativeNumber(item.dispatched))}
                  step="1"
                  value={formData.poQty}
                  onChange={(e) => handleChange("poQty", e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.poQty ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.poQty && (
                  <p className="text-xs text-red-600 mt-1">{errors.poQty}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> Rate (₹)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => handleChange("rate", e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.rate ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.rate && (
                  <p className="text-xs text-red-600 mt-1">{errors.rate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                {errors.status && (
                  <p className="text-xs text-red-600 mt-1">{errors.status}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projected Pending Value (₹)
                </label>
                <input
                  type="text"
                  value={
                    Math.max(
                      0,
                      Number(formData.poQty || 0) -
                        toNonNegativeNumber(item.dispatched),
                    ) * Number(formData.rate || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  disabled
                />
              </div>
            </div>

            <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 flex items-center justify-between gap-3 border-t border-gray-200 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6">
              <div>
                {showDeleteConfirm &&
                  (item.dispatchHistory?.length || 0) > 0 && (
                    <p className="mb-2 max-w-xs text-xs text-red-600">
                      This PO has {item.dispatchHistory.length} dispatch record
                      {item.dispatchHistory.length === 1 ? "" : "s"}. Deletion
                      may be rejected if your audit policy protects history.
                    </p>
                  )}
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete PO
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    Confirm Delete
                  </button>
                )}
                {showDeleteConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                {!showDeleteConfirm && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Pencil className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

// ============================================
// MERGED PO RECORD PICKER
// ============================================
const PurchaseOrderGroupModal = React.memo(function PurchaseOrderGroupModal({
  isOpen,
  onClose,
  group,
  onEdit,
  onDelete,
  formatCurrency,
  formatDate,
}) {
  const sourceItems = useMemo(() => getSourcePurchaseOrders(group), [group]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !group) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="po-group-modal-title"
    >
      <div className="flex min-h-screen items-center justify-center">
        <button
          type="button"
          className="fixed inset-0 cursor-default bg-slate-950/65 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Close purchase-order list"
        />

        <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 px-6 py-4">
            <div className="min-w-0">
              <h3
                id="po-group-modal-title"
                className="text-lg font-bold text-white"
              >
                Manage Related Purchase Orders
              </h3>
              <p className="mt-1 truncate text-sm text-blue-100">
                {group.company} · {group.item} · {sourceItems.length} PO records
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white transition hover:bg-white/15"
              aria-label="Close purchase-order list"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[65vh] overflow-auto p-4 sm:p-6">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">PO</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3 text-right">PO qty</th>
                    <th className="px-4 py-3 text-right">Dispatched</th>
                    <th className="px-4 py-3 text-right">Pending</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sourceItems.map((sourceItem) => (
                    <tr
                      key={getPurchaseOrderKey(sourceItem)}
                      className="hover:bg-blue-50/60"
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold text-slate-800">
                          {sourceItem.po || "—"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {sourceItem.itemCode || "No item code"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <p>PO: {formatDate(sourceItem.poDate)}</p>
                        <p className="mt-0.5">
                          Due: {formatDate(sourceItem.deliveryDate)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {toNonNegativeNumber(sourceItem.poQty).toLocaleString(
                          "en-IN",
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {toNonNegativeNumber(
                          sourceItem.dispatched,
                        ).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-rose-600">
                        {toNonNegativeNumber(sourceItem.pending).toLocaleString(
                          "en-IN",
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(sourceItem.rate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {sourceItem.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(sourceItem)}
                            disabled={!sourceItem._id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                              sourceItem._id
                                ? "Edit this PO"
                                : "Missing database id"
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(sourceItem)}
                            disabled={!sourceItem._id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                              sourceItem._id
                                ? "Delete this PO"
                                : "Missing database id"
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// REJECTION MANAGER MODAL
// Add manual rejection + review/accept pending rejection
// ============================================
const REJECTION_REASON_OPTIONS = [
  ["dimensional", "Dimensional out of tolerance"],
  ["visual", "Visual defect / damage"],
  ["wrong_item", "Wrong item / specification"],
  ["material", "Material issue"],
  ["surface", "Surface / finish issue"],
  ["quantity", "Quantity mismatch"],
  ["functional", "Functional failure"],
  ["other", "Other"],
];

const RejectionManagerModal = React.memo(function RejectionManagerModal({
  isOpen,
  item,
  dispatchHistory,
  getItemKey,
  onClose,
  onChanged,
  isAdmin = false,
  clientCompany = "",
}) {
  const [activeTab, setActiveTab] = useState("add");
  const [selectedDispatchKey, setSelectedDispatchKey] = useState("");
  const [records, setRecords] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    rejectedQuantity: "",
    reason: "",
    subReason: "",
    rejectionDate: getLocalDateInputValue(),
    severity: "medium",
    requiresReplacement: true,
    inspectorName: "",
    notes: "",
  });
  const { confirmation, askForConfirmation, confirmAction, cancelAction } =
    useConfirmDialog();

  const sourceItems = useMemo(
    () => (item ? getSourcePurchaseOrders(item) : []),
    [item],
  );

  const rawDispatchOptions = useMemo(() => {
    return sourceItems.flatMap((sourceItem) => {
      const itemKey = getItemKey(sourceItem);
      const history =
        dispatchHistory[itemKey] || sourceItem.dispatchHistory || [];
      return history
        .map((entry, index) => {
          const dispatchId = normalizeText(entry?._id || entry?.id);
          const poId = normalizeText(entry?.poId || sourceItem?._id);
          const quantity = toNonNegativeNumber(
            entry?.dispatchQty ?? entry?.quantity,
          );
          if (!dispatchId || !poId || quantity <= 0) return null;

          return {
            key: `${poId}::${dispatchId}`,
            poId,
            dispatchId,
            poNumber: normalizeText(entry?.po || sourceItem?.po),
            companyName: normalizeText(entry?.company || sourceItem?.company),
            itemCode: normalizeText(entry?.itemCode || sourceItem?.itemCode),
            description: normalizeText(entry?.item || sourceItem?.item),
            drawing: normalizeText(entry?.drawing || sourceItem?.drawing),
            quantity,
            dispatchDate: entry?.dispatchDate || "",
            billNumber: normalizeText(entry?.billNumber),
            sourceItem,
            index,
          };
        })
        .filter(Boolean);
    });
  }, [sourceItems, dispatchHistory, getItemKey]);

  const committedByDispatch = useMemo(() => {
    const map = new Map();
    records.forEach((record) => {
      if (
        normalizeText(record?.source).toLowerCase() !== "manual" ||
        normalizeText(record?.status).toLowerCase() === "denied"
      ) {
        return;
      }
      const dispatchId = normalizeText(record?.dispatchId);
      if (!dispatchId) return;
      map.set(
        dispatchId,
        (map.get(dispatchId) || 0) +
          toNonNegativeNumber(record?.rejectedQuantity),
      );
    });
    return map;
  }, [records]);

  const dispatchOptions = useMemo(
    () =>
      rawDispatchOptions.map((option) => {
        const alreadyCommitted =
          committedByDispatch.get(option.dispatchId) || 0;
        return {
          ...option,
          alreadyCommitted,
          availableForRejection: Math.max(
            0,
            option.quantity - alreadyCommitted,
          ),
        };
      }),
    [rawDispatchOptions, committedByDispatch],
  );

  const selectedDispatch = useMemo(
    () =>
      dispatchOptions.find((option) => option.key === selectedDispatchKey) ||
      null,
    [dispatchOptions, selectedDispatchKey],
  );

  const loadHistory = useCallback(async () => {
    if (!isOpen || sourceItems.length === 0) {
      setRecords([]);
      return;
    }

    const poIds = Array.from(
      new Set(
        sourceItems
          .map((sourceItem) => normalizeText(sourceItem?._id))
          .filter(Boolean),
      ),
    );

    if (poIds.length === 0) {
      setRecords([]);
      return;
    }

    setIsLoadingHistory(true);
    setError("");
    try {
      const results = await Promise.all(
        poIds.map((poId) => rejectionApi.list({ poId, limit: 1000 })),
      );
      const allRecords = results.flatMap((result) =>
        Array.isArray(result)
          ? result
          : Array.isArray(result?.records)
            ? result.records
            : [],
      );
      const visibleRecords = isAdmin
        ? allRecords
        : allRecords.filter((record) => {
            const recordCompany = normalizeText(
              record?.companyName || record?.company || record?.po?.company,
            );
            // The API should enforce this too. On the client, keep only the
            // authenticated client's company whenever the record carries it.
            return (
              !recordCompany || isSameCompany(recordCompany, clientCompany)
            );
          });

      visibleRecords.sort((left, right) => {
        const leftDate = Date.parse(
          left?.rejectionDate || left?.createdAt || "",
        );
        const rightDate = Date.parse(
          right?.rejectionDate || right?.createdAt || "",
        );
        return (
          (Number.isFinite(rightDate) ? rightDate : 0) -
          (Number.isFinite(leftDate) ? leftDate : 0)
        );
      });
      setRecords(visibleRecords);
    } catch (historyError) {
      console.error("Could not load rejection history:", historyError);
      setError(
        historyError?.response?.data?.message ||
          historyError?.message ||
          "Could not load rejection history",
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isOpen, sourceItems, isAdmin, clientCompany]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("add");
    setError("");
    setForm({
      rejectedQuantity: "",
      reason: "",
      subReason: "",
      rejectionDate: getLocalDateInputValue(),
      severity: "medium",
      requiresReplacement: true,
      inspectorName: "",
      notes: "",
    });
    void loadHistory();
  }, [isOpen, item]);

  useEffect(() => {
    if (!isOpen) return;
    const currentIsUsable = dispatchOptions.some(
      (option) =>
        option.key === selectedDispatchKey && option.availableForRejection > 0,
    );
    if (currentIsUsable) return;
    const firstAvailable = dispatchOptions.find(
      (option) => option.availableForRejection > 0,
    );
    setSelectedDispatchKey(
      firstAvailable?.key || dispatchOptions[0]?.key || "",
    );
  }, [isOpen, dispatchOptions, selectedDispatchKey]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting && !reviewingId) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, reviewingId, onClose]);

  const resetAddForm = useCallback(() => {
    setForm((current) => ({
      ...current,
      rejectedQuantity: "",
      reason: "",
      subReason: "",
      rejectionDate: getLocalDateInputValue(),
      severity: "medium",
      requiresReplacement: true,
      notes: "",
    }));
  }, []);

  const submitRejection = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");

      if (!selectedDispatch) {
        setError("Select a dispatch before adding a rejection.");
        return;
      }

      const rejectedQuantity = toNonNegativeNumber(form.rejectedQuantity);
      if (rejectedQuantity <= 0) {
        setError("Rejected quantity must be greater than zero.");
        return;
      }
      if (rejectedQuantity > selectedDispatch.availableForRejection) {
        setError(
          `Only ${selectedDispatch.availableForRejection.toLocaleString("en-IN")} can still be rejected from this dispatch.`,
        );
        return;
      }
      if (!normalizeText(form.reason)) {
        setError("Select a rejection reason.");
        return;
      }
      if (!form.rejectionDate) {
        setError("Select the rejection date.");
        return;
      }

      setIsSubmitting(true);
      try {
        await rejectionApi.create({
          poId: selectedDispatch.poId,
          dispatchId: selectedDispatch.dispatchId,
          rejectedQuantity,
          reason: form.reason,
          subReason: normalizeText(form.subReason),
          severity: form.severity,
          requiresReplacement: Boolean(form.requiresReplacement),
          rejectionDate: form.rejectionDate,
          inspectorName: normalizeText(form.inspectorName),
          notes: normalizeText(form.notes),
        });

        resetAddForm();
        await loadHistory();
        await onChanged?.(
          "Rejection submitted for review. Pending quantity will change after it is accepted.",
          "success",
        );
        setActiveTab("history");
      } catch (submitError) {
        console.error("Could not create rejection:", submitError);
        setError(
          submitError?.response?.data?.message ||
            submitError?.message ||
            "Could not create rejection",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedDispatch, form, resetAddForm, loadHistory, onChanged],
  );

  const reviewRejection = useCallback(
    async (record, action, pendingImpactMode = "") => {
      if (!record?._id || reviewingId) return;

      const isApprove = action === "approve";
      const allowedModes = new Set([
        "same_po_replacement",
        "no_current_po_adjustment",
      ]);

      if (isApprove && !allowedModes.has(pendingImpactMode)) {
        setError(
          "Choose whether this accepted rejection should be added back to this PO pending or accepted with no current PO change.",
        );
        return;
      }

      const affectsCurrentPo = pendingImpactMode === "same_po_replacement";
      const rejectedQty = toNonNegativeNumber(
        record.rejectedQuantity,
      ).toLocaleString("en-IN");

      const promptText = isApprove
        ? affectsCurrentPo
          ? `Accept ${rejectedQty} rejected piece(s) and ADD them back to this PO pending quantity?`
          : `Accept ${rejectedQty} rejected piece(s) WITHOUT changing this PO pending quantity? The rejection will remain available for Inventory & Disposition.`
        : "Deny this rejection? It will not affect pending quantity.";

      const confirmed = await askForConfirmation({
        title: isApprove ? "Accept rejection?" : "Deny rejection?",
        message: promptText,
        confirmLabel: isApprove ? "Accept" : "Deny",
        cancelLabel: "Cancel",
        tone: isApprove ? "primary" : "danger",
      });
      if (!confirmed) return;

      setReviewingId(record._id);
      setError("");
      try {
        const payload = {
          action,
          adminRemarks: isApprove
            ? affectsCurrentPo
              ? "Accepted for replacement against the same PO"
              : "Accepted with no current PO adjustment; replacement may be handled on a future/new PO"
            : "Denied from Pending PO rejection manager",
        };

        if (isApprove) {
          payload.pendingImpactMode = pendingImpactMode;
          payload.replacementPlan = affectsCurrentPo
            ? "same_po"
            : record.requiresReplacement === false
              ? "no_replacement"
              : "future_po";
        }

        const result = await rejectionApi.review(record._id, payload);
        await loadHistory();
        await onChanged?.(
          result?.message ||
            (isApprove
              ? affectsCurrentPo
                ? "Rejection accepted. Rejected quantity was added back to this PO pending."
                : "Rejection accepted. Current PO pending was not changed; the rejection can go to Inventory & Disposition."
              : "Rejection denied. Pending quantity was not changed."),
          "success",
        );
      } catch (reviewError) {
        console.error("Could not review rejection:", reviewError);
        setError(
          reviewError?.response?.data?.message ||
            reviewError?.message ||
            "Could not review rejection",
        );
      } finally {
        setReviewingId("");
      }
    },
    [reviewingId, askForConfirmation, loadHistory, onChanged],
  );

  if (!isOpen || !item) return null;

  const totalRejected = records
    .filter((record) => record?.affectsPending)
    .reduce(
      (sum, record) => sum + toNonNegativeNumber(record?.rejectedQuantity),
      0,
    );
  const pendingReviewCount = records.filter(
    (record) =>
      normalizeText(record?.status).toLowerCase() === "pending_review",
  ).length;

  return (
    <div
      className="fixed inset-0 z-[10020] overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rejection-manager-title"
    >
      <div className="flex min-h-full items-center justify-center py-2">
        <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/20">
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-rose-700 via-red-600 to-orange-600 px-5 py-4 text-white sm:px-6">
            <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2
                    id="rejection-manager-title"
                    className="text-lg font-bold sm:text-xl"
                  >
                    {isAdmin ? "Rejection Manager" : "Rejection"}
                  </h2>
                  <p className="mt-1 truncate text-xs text-red-100 sm:text-sm">
                    {item.company} · {item.itemCode || item.item || "Item"} ·{" "}
                    {item._isMerged
                      ? `${sourceItems.length} related POs`
                      : `PO ${item.po || "-"}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || Boolean(reviewingId)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white transition hover:bg-white/15 disabled:opacity-50"
                aria-label="Close rejection manager"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="shrink-0 border-b border-slate-200 bg-white px-4 pt-3 sm:px-6">
            {isAdmin ? (
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Gross dispatch
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {toNonNegativeNumber(item.dispatched).toLocaleString(
                      "en-IN",
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">
                    Applied rejection
                  </p>
                  <p className="mt-1 font-bold text-rose-700">
                    {toNonNegativeNumber(item.rejected).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                    Net accepted
                  </p>
                  <p className="mt-1 font-bold text-emerald-700">
                    {toNonNegativeNumber(item.accepted).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                    Pending review
                  </p>
                  <p className="mt-1 font-bold text-amber-700">
                    {pendingReviewCount}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                You can submit a rejection and view your company's rejection
                history. Inventory, disposition and approval controls are
                hidden.
              </div>
            )}

            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("add")}
                className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === "add"
                    ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                Add Rejection
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === "history"
                    ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                History ({records.length})
                {pendingReviewCount > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                    {pendingReviewCount} review
                  </span>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-4 mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 sm:mx-6">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
            {activeTab === "add" ? (
              <form onSubmit={submitRejection} className="space-y-5">
                {dispatchOptions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-rose-200 bg-white p-8 text-center">
                    <Truck className="mx-auto h-9 w-9 text-rose-300" />
                    <p className="mt-3 font-semibold text-slate-700">
                      No dispatch is available for rejection
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Record a dispatch first. A rejection must be linked to the
                      exact dispatch that supplied the parts.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Select dispatch *
                      </label>
                      <select
                        value={selectedDispatchKey}
                        onChange={(event) =>
                          setSelectedDispatchKey(event.target.value)
                        }
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:bg-slate-100"
                      >
                        {dispatchOptions.map((option) => (
                          <option
                            key={option.key}
                            value={option.key}
                            disabled={option.availableForRejection <= 0}
                          >
                            PO {option.poNumber || "-"} ·{" "}
                            {formatDateValue(option.dispatchDate)} · Bill{" "}
                            {option.billNumber || "-"} · Dispatch{" "}
                            {option.quantity.toLocaleString("en-IN")} ·
                            Available{" "}
                            {option.availableForRejection.toLocaleString(
                              "en-IN",
                            )}
                          </option>
                        ))}
                      </select>

                      {selectedDispatch && (
                        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-4">
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <span className="text-slate-400">PO</span>
                            <p className="mt-0.5 font-semibold text-slate-700">
                              {selectedDispatch.poNumber || "-"}
                            </p>
                          </div>
                          <div className="rounded-lg bg-blue-50 px-3 py-2">
                            <span className="text-blue-400">Dispatch</span>
                            <p className="mt-0.5 font-semibold text-blue-700">
                              {selectedDispatch.quantity.toLocaleString(
                                "en-IN",
                              )}
                            </p>
                          </div>
                          <div className="rounded-lg bg-amber-50 px-3 py-2">
                            <span className="text-amber-500">
                              Already submitted
                            </span>
                            <p className="mt-0.5 font-semibold text-amber-700">
                              {selectedDispatch.alreadyCommitted.toLocaleString(
                                "en-IN",
                              )}
                            </p>
                          </div>
                          <div className="rounded-lg bg-rose-50 px-3 py-2">
                            <span className="text-rose-400">Can reject</span>
                            <p className="mt-0.5 font-semibold text-rose-700">
                              {selectedDispatch.availableForRejection.toLocaleString(
                                "en-IN",
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          Rejected Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          max={
                            selectedDispatch?.availableForRejection || undefined
                          }
                          value={form.rejectedQuantity}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              rejectedQuantity: event.target.value,
                            }))
                          }
                          disabled={
                            isSubmitting ||
                            !selectedDispatch ||
                            selectedDispatch.availableForRejection <= 0
                          }
                          placeholder="e.g. 50"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:bg-slate-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          Rejection Date *
                        </label>
                        <input
                          type="date"
                          value={form.rejectionDate}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              rejectionDate: event.target.value,
                            }))
                          }
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Rejection Reason *
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {REJECTION_REASON_OPTIONS.map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  reason: value,
                                }))
                              }
                              disabled={isSubmitting}
                              className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                                form.reason === value
                                  ? "border-rose-500 bg-rose-50 text-rose-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50/40"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          Severity
                        </label>
                        <select
                          value={form.severity}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              severity: event.target.value,
                            }))
                          }
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          Inspector
                        </label>
                        <input
                          value={form.inspectorName}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              inspectorName: event.target.value,
                            }))
                          }
                          disabled={isSubmitting}
                          placeholder="Inspector name"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          Detailed Reason
                        </label>
                        <textarea
                          rows={2}
                          value={form.subReason}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              subReason: event.target.value,
                            }))
                          }
                          disabled={isSubmitting}
                          placeholder="Optional defect details..."
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          Notes
                        </label>
                        <textarea
                          rows={2}
                          value={form.notes}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              notes: event.target.value,
                            }))
                          }
                          disabled={isSubmitting}
                          placeholder="Optional comments..."
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500"
                        />
                      </div>

                      <label className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                        <input
                          type="checkbox"
                          checked={form.requiresReplacement}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              requiresReplacement: event.target.checked,
                            }))
                          }
                          disabled={isSubmitting}
                          className="mt-0.5 h-4 w-4 accent-rose-600"
                        />
                        <span>
                          <strong>Replacement required.</strong> After this
                          rejection is accepted, the rejected quantity is added
                          back to Pending so replacement parts can be
                          dispatched.
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">
                      Rejection History
                    </p>
                    <p className="text-xs text-slate-500">
                      {isAdmin ? (
                        <>
                          Applied rejection total:{" "}
                          <strong className="text-rose-700">
                            {totalRejected.toLocaleString("en-IN")}
                          </strong>
                        </>
                      ) : (
                        <>Your company's submitted rejection records only</>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadHistory()}
                    disabled={isLoadingHistory}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        isLoadingHistory ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </button>
                </div>

                {isLoadingHistory ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-rose-500" />
                    <p className="mt-2 text-sm text-slate-500">
                      Loading rejection history...
                    </p>
                  </div>
                ) : records.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-700">
                      No rejection records
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("add")}
                      className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Add first rejection
                    </button>
                  </div>
                ) : (
                  records.map((record) => {
                    const status = normalizeText(record?.status).toLowerCase();
                    const source = normalizeText(record?.source).toLowerCase();
                    const statusMeta =
                      status === "approved" || status === "recorded"
                        ? {
                            label:
                              status === "recorded" ? "Recorded" : "Accepted",
                            className:
                              "bg-emerald-100 text-emerald-700 ring-emerald-200",
                          }
                        : status === "denied"
                          ? {
                              label: "Denied",
                              className:
                                "bg-slate-100 text-slate-600 ring-slate-200",
                            }
                          : {
                              label: "Pending Review",
                              className:
                                "bg-amber-100 text-amber-700 ring-amber-200",
                            };

                    return (
                      <article
                        key={record._id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${statusMeta.className}`}
                              >
                                {statusMeta.label}
                              </span>
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                                {source === "excel_import"
                                  ? "Excel Import"
                                  : "Manual"}
                              </span>
                              <span className="font-mono text-xs font-semibold text-slate-700">
                                PO {record.poNumber || "-"}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                  Rejected
                                </p>
                                <p className="mt-0.5 font-bold text-rose-700">
                                  {toNonNegativeNumber(
                                    record.rejectedQuantity,
                                  ).toLocaleString("en-IN")}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                  Date
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                  {formatDateValue(record.rejectionDate)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                  Reason
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                  {record.reason ||
                                    record.rejectionReason ||
                                    "-"}
                                </p>
                              </div>
                              {isAdmin && (
                                <>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                      Dispatch
                                    </p>
                                    <p className="mt-0.5 max-w-[190px] truncate font-mono text-xs font-semibold text-slate-700">
                                      {record.dispatchId ||
                                        "Historical Excel total"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                      Pending effect
                                    </p>
                                    <p
                                      className={`mt-0.5 text-sm font-semibold ${record.affectsPending ? "text-rose-700" : "text-slate-500"}`}
                                    >
                                      {record.affectsPending
                                        ? "Applied"
                                        : "Not applied"}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>

                            {(record.subReason || record.notes) && (
                              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                {record.subReason && (
                                  <p>
                                    <strong>Detail:</strong> {record.subReason}
                                  </p>
                                )}
                                {record.notes && (
                                  <p className={record.subReason ? "mt-1" : ""}>
                                    <strong>Notes:</strong> {record.notes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {isAdmin &&
                            status === "pending_review" &&
                            source !== "excel_import" && (
                              <div className="flex shrink-0 flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void reviewRejection(
                                      record,
                                      "approve",
                                      "same_po_replacement",
                                    )
                                  }
                                  disabled={Boolean(reviewingId)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                                  title="Accept this rejection and add the rejected quantity back to this PO pending"
                                >
                                  {reviewingId === record._id ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  )}
                                  Accept + Add to This PO Pending
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void reviewRejection(
                                      record,
                                      "approve",
                                      "no_current_po_adjustment",
                                    )
                                  }
                                  disabled={Boolean(reviewingId)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                                  title="Accept this rejection but keep the current PO pending unchanged"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Accept + No Current PO Change
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void reviewRejection(record, "deny")
                                  }
                                  disabled={Boolean(reviewingId)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                                >
                                  Deny
                                </button>
                              </div>
                            )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? "Accepted rejection changes Pending only when you choose ‘Add to This PO Pending’. ‘No Current PO Change’ keeps the rejection accepted for Inventory & Disposition without changing this PO pending."
                  : "Your rejection will be submitted for admin review. You can track its status here after submission."}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting || Boolean(reviewingId)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Close
                </button>
                {activeTab === "add" && dispatchOptions.length > 0 && (
                  <button
                    type="submit"
                    onClick={submitRejection}
                    disabled={
                      isSubmitting ||
                      !selectedDispatch ||
                      selectedDispatch.availableForRejection <= 0
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:from-rose-700 hover:to-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isSubmitting ? "Submitting..." : "Submit Rejection"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmActionDialog
        confirmation={confirmation}
        onConfirm={confirmAction}
        onCancel={cancelAction}
      />
    </div>
  );
});

// ============================================
// USER GUIDE / ONBOARDING MODULE
// ============================================
const UserGuideModal = React.memo(function UserGuideModal({ isOpen, onClose }) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = useMemo(
    () => [
      {
        title: "Find the work you need",
        icon: Search,
        summary:
          "Use search, company, status, category, pending quantity, or PO-date filters to narrow the pending list.",
        bullets: [
          "Companies are shown as collapsible sections.",
          "The same item across related POs is merged for easier planning.",
          "Expand a company only when you need to work on its pending items.",
        ],
      },
      {
        title: "Choose Single Dispatch or Queue",
        icon: Truck,
        summary:
          "Use Dispatch for one item now, or Queue when you want to prepare several PO items before submitting.",
        bullets: [
          "Dispatch opens the single/merged dispatch form immediately.",
          "Queue adds eligible PO lines to the Dispatch Queue without saving anything yet.",
          "Queued items can be removed or cleared before you continue.",
        ],
      },
      {
        title: "Review quantities and dispatch details",
        icon: ListChecks,
        summary:
          "For multiple items, open Dispatch Queue, enter each quantity, then complete the common dispatch details.",
        bullets: [
          "Dispatch Date and Bill Number are required.",
          "Bill Upload is optional (PDF/JPG/PNG up to 5 MB).",
          "Remarks, transport mode, LR/tracking number, and received-by are optional.",
        ],
      },
      {
        title: "Track history and exceptions",
        icon: History,
        summary:
          "After dispatch, use history for audit details and More actions for rejection or PO maintenance.",
        bullets: [
          "View History shows bill-wise dispatch records.",
          "Rejection is available only after a dispatch exists.",
          "More contains rejection, edit/manage, and delete actions so the table stays clean.",
        ],
      },
      {
        title: "Import and maintain PO data",
        icon: FileSpreadsheet,
        summary:
          "Excel import is reviewed before saving, so new users can fix rows before they reach the database.",
        bullets: [
          "Upload Excel → preview rows → fix validation issues → confirm upload.",
          "Download the template when creating a new source file.",
          "Refresh reloads the latest pending, rejection, and dispatch balances.",
        ],
      },
    ],
    [],
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    setActiveStep(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setActiveStep((current) => Math.min(steps.length - 1, current + 1));
      }
      if (event.key === "ArrowLeft") {
        setActiveStep((current) => Math.max(0, current - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, steps.length]);

  if (!isOpen) return null;

  const current = steps[activeStep];
  const StepIcon = current.icon;

  return (
    <div
      className="fixed inset-0 z-[13000] overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pending-po-guide-title"
    >
      <div className="flex min-h-full items-center justify-center py-2">
        <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/20">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-5 py-5 text-white sm:px-6">
            <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/15">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
                    New user guide
                  </p>
                  <h2
                    id="pending-po-guide-title"
                    className="mt-1 text-xl font-bold sm:text-2xl"
                  >
                    How Pending PO & Dispatch works
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-blue-100">
                    Follow the workflow once and you will know where every
                    action lives.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white transition hover:bg-white/15"
                aria-label="Close user guide"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr]">
            <aside className="border-b border-slate-200 bg-slate-50 p-3 lg:border-b-0 lg:border-r lg:p-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const active = index === activeStep;
                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                        active
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                          active ? "bg-white/15" : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70">
                          Step {index + 1}
                        </span>
                        <span className="block truncate text-sm font-semibold">
                          {step.title}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <StepIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                    Step {activeStep + 1} of {steps.length}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {current.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {current.summary}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {current.bullets.map((bullet, index) => (
                  <div
                    key={bullet}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-700">{bullet}</p>
                  </div>
                ))}
              </div>

              {activeStep === 1 && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center gap-2 font-semibold text-blue-800">
                      <Truck className="h-4 w-4" />
                      Single Dispatch
                    </div>
                    <p className="mt-2 text-xs leading-5 text-blue-700">
                      Best when you want to dispatch one PO/item immediately.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 font-semibold text-emerald-800">
                      <ShoppingCart className="h-4 w-4" />
                      Queue Dispatch
                    </div>
                    <p className="mt-2 text-xs leading-5 text-emerald-700">
                      Best when one bill or vehicle contains several PO items.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-7 flex items-center justify-between border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setActiveStep((current) => Math.max(0, current - 1))
                  }
                  disabled={activeStep === 0}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                {activeStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveStep((current) =>
                        Math.min(steps.length - 1, current + 1),
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Got it
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// COMPANY ACCORDION ROW COMPONENT
// ============================================
const CompanyAccordion = React.memo(function CompanyAccordion({
  company,
  items,
  isExpanded,
  onToggle,
  selectedItems,
  onToggleSelection,
  onSetSelection,
  onDispatchClick,
  onQueueToggle,
  queueItemKeys,
  onRejectionClick,
  onEditClick,
  onDeleteClick,
  onViewClick,
  isAdmin,
  dispatchHistory,
  getCompletionPercentage,
  getRiskMeta,
  formatCurrency,
  formatDate,
  getItemKey,
  pageSize = 15,
}) {
  const sourceLineItems = useMemo(
    () => items.flatMap(getSourcePurchaseOrders),
    [items],
  );

  // Keep every company header visible. Row limiting happens inside
  // an expanded company instead of on the global company list.
  const [visibleItemCount, setVisibleItemCount] = useState(pageSize);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    setVisibleItemCount(pageSize);
  }, [company, items.length, pageSize]);

  useEffect(() => {
    setOpenActionMenu(null);
  }, [company, isExpanded]);

  const visibleItems = useMemo(
    () => items.slice(0, visibleItemCount),
    [items, visibleItemCount],
  );

  const historyCount = useMemo(() => {
    return sourceLineItems.reduce((sum, item) => {
      const key = getItemKey(item);
      return sum + (dispatchHistory[key]?.length || 0);
    }, 0);
  }, [sourceLineItems, dispatchHistory, getItemKey]);

  const totalPending = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + (isCancelledRecord(item) ? 0 : toNonNegativeNumber(item.pending)),
      0,
    );
  }, [items]);

  const totalPOQty = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + (isCancelledRecord(item) ? 0 : toNonNegativeNumber(item.poQty)),
      0,
    );
  }, [items]);

  const completionPercentage = useMemo(() => {
    if (totalPOQty === 0) return 0;
    const dispatched = totalPOQty - totalPending;
    return Math.round((dispatched / totalPOQty) * 100);
  }, [totalPOQty, totalPending]);

  const allSelected = useMemo(() => {
    return (
      sourceLineItems.length > 0 &&
      sourceLineItems.every((item) => selectedItems.has(getItemKey(item)))
    );
  }, [sourceLineItems, selectedItems, getItemKey]);

  const someSelected = useMemo(
    () =>
      !allSelected &&
      sourceLineItems.some((item) => selectedItems.has(getItemKey(item))),
    [allSelected, sourceLineItems, selectedItems, getItemKey],
  );

  const handleSelectAll = useCallback(
    (e) => {
      e.stopPropagation();
      onSetSelection(items, !allSelected);
    },
    [items, onSetSelection, allSelected],
  );

  return (
    <div className="border border-gray-200 rounded-lg mb-2 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
      {/* Company Header - Clickable to expand/collapse */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
              {(company || "?").charAt(0).toUpperCase()}
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-[300px]">
                {company || "Unknown Company"}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>
                  {`${items.length} merged item${items.length === 1 ? "" : "s"} · ${sourceLineItems.length} PO line${sourceLineItems.length === 1 ? "" : "s"}`}
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />
                  {totalPending.toLocaleString()} pending
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {completionPercentage}% complete
                </span>
                {historyCount > 0 && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1 text-blue-600">
                      <History className="w-3 h-3" />
                      {historyCount} dispatch{historyCount > 1 ? "es" : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isAdmin && (
            <input
              type="checkbox"
              checked={allSelected}
              ref={(node) => {
                if (node) node.indeterminate = someSelected;
              }}
              onChange={handleSelectAll}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 cursor-pointer"
              aria-label={`${allSelected ? "Deselect" : "Select"} all visible items for ${company}`}
            />
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Table */}
      {isExpanded && (
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full border-collapse text-sm text-center">
            <thead className="bg-gray-50">
              <tr>
                {isAdmin && (
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(node) => {
                        if (node) node.indeterminate = someSelected;
                      }}
                      onChange={handleSelectAll}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                      aria-label={`Select all items for ${company}`}
                    />
                  </th>
                )}
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Related PO numbers
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Item / drawing
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Progress
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  PO qty
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Dispatched
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-red-700 text-center whitespace-nowrap">
                  Rejected
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-emerald-700 text-center whitespace-nowrap">
                  Net Accepted
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Pending
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Unit rate
                </th>
                {/* <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Pending value
                </th>
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Priority
                </th> */}
                <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleItems.map((item, index) => {
                const sourceItems = getSourcePurchaseOrders(item);
                const itemKey = item._mergeKey || getItemKey(item);
                const selectedSourceCount = sourceItems.filter((sourceItem) =>
                  selectedItems.has(getItemKey(sourceItem)),
                ).length;
                const isSelected =
                  sourceItems.length > 0 &&
                  selectedSourceCount === sourceItems.length;
                const isPartiallySelected =
                  selectedSourceCount > 0 && !isSelected;
                const itemHistoryCount = sourceItems.reduce(
                  (sum, sourceItem) =>
                    sum +
                    (dispatchHistory[getItemKey(sourceItem)]?.length || 0),
                  0,
                );
                const completion = getCompletionPercentage(item);
                const risk = getRiskMeta(item);
                const status = normalizeText(item.status).toLowerCase();
                const dispatchableItems = item._isMerged
                  ? item._dispatchableItems || []
                  : sourceItems.filter(
                      (sourceItem) =>
                        sourceItem.pending > 0 &&
                        !["cancelled", "on hold"].includes(
                          normalizeText(sourceItem.status).toLowerCase(),
                        ) &&
                        Boolean(sourceItem._id),
                    );
                const canDispatch = dispatchableItems.length > 0;

                return (
                  <tr
                    key={itemKey}
                    className={`hover:bg-blue-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    {isAdmin && (
                      <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          ref={(node) => {
                            if (node) node.indeterminate = isPartiallySelected;
                          }}
                          onChange={() => onToggleSelection(item)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                          aria-label={
                            item._isMerged
                              ? `Select all ${item.poCount} related POs for ${item.item}`
                              : `Select ${item.po} ${item.item}`
                          }
                        />
                      </td>
                    )}
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      {item._isMerged ? (
                        <div className="min-w-[220px]">
                          <div
                            className="flex max-w-[320px] flex-wrap justify-center gap-1"
                            title={item.poNumbers.join(", ")}
                          >
                            {item.poNumbers.map((poNumber) => (
                              <span
                                key={poNumber}
                                className="rounded-md bg-blue-50 px-2 py-1 font-mono text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-100"
                              >
                                {poNumber}
                              </span>
                            ))}
                          </div>
                          <p className="mt-1.5 text-[11px] font-semibold text-indigo-600">
                            {item.poCount} PO{item.poCount === 1 ? "" : "s"}{" "}
                            merged
                            {item._cancelledCount > 0
                              ? ` · ${item._cancelledCount} cancelled`
                              : ""}
                          </p>
                          <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-slate-400">
                            <CalendarDays className="h-3 w-3" />
                            Earliest PO {formatDate(item.poDate)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Next due {formatDate(item.deliveryDate)}
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="font-mono text-sm font-semibold text-slate-800">
                            {item.po || "—"}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 justify-center">
                            <CalendarDays className="h-3 w-3" />
                            PO {formatDate(item.poDate)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Due {formatDate(item.deliveryDate)}
                          </p>
                        </>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      <p
                        className="max-w-[200px] truncate text-sm font-medium text-slate-800"
                        title={item.item}
                      >
                        {item.item || "Unnamed item"}
                      </p>
                      <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                        <span>{item.itemCode || "No code"}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{item.drawing || "No drawing"}</span>
                      </div>
                      {(item._dataIssues?.length || 0) > 0 && (
                        <span
                          className="mt-1 inline-flex max-w-[210px] items-center gap-1 text-[10px] font-semibold text-amber-700"
                          title={item._dataIssues.join("; ")}
                        >
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            Review: {item._dataIssues[0]}
                            {item._dataIssues.length > 1
                              ? ` (+${item._dataIssues.length - 1})`
                              : ""}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      <div className="mb-1.5 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-600">
                          {completion.toFixed(0)}%
                        </span>
                        <span className="text-slate-400">fulfilled</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      {Number(item.poQty || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      {Number(item.dispatched || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center font-semibold text-red-600">
                      {Number(item.rejected || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center font-semibold text-emerald-700">
                      {Number(item.accepted || 0).toLocaleString("en-IN")}
                    </td>
                    <td
                      className={`border border-gray-300 px-3 py-2 align-middle text-center ${item.pending > 0 ? "text-rose-600" : "text-emerald-600"}`}
                    >
                      {Number(item.pending || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      {item._isMerged && item._hasMixedRates ? (
                        <div title={item.rates.map(formatCurrency).join(", ")}>
                          <p className="text-xs font-semibold text-amber-700">
                            Mixed rates
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Avg. {formatCurrency(item.rate)}
                          </p>
                        </div>
                      ) : (
                        formatCurrency(item.rate)
                      )}
                    </td>
                    {/* <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${risk.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${risk.dot}`}
                        />
                        {risk.label}
                      </span>
                    </td> */}
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onDispatchClick(item)}
                            disabled={
                              item._isMerged
                                ? !canDispatch
                                : !canDispatch && itemHistoryCount === 0
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            title={
                              canDispatch
                                ? item._isMerged
                                  ? `Dispatch across ${dispatchableItems.length} eligible PO${dispatchableItems.length === 1 ? "" : "s"}`
                                  : "Record dispatch"
                                : itemHistoryCount > 0
                                  ? "View dispatch history"
                                  : "No dispatch is currently available"
                            }
                          >
                            {canDispatch ? (
                              <Truck className="h-3.5 w-3.5" />
                            ) : (
                              <History className="h-3.5 w-3.5" />
                            )}
                            <span>{canDispatch ? "Dispatch" : "History"}</span>
                            {itemHistoryCount > 0 && (
                              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px]">
                                {itemHistoryCount}
                              </span>
                            )}
                          </button>

                          {canDispatch && (
                            <button
                              type="button"
                              onClick={() => onQueueToggle(item)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                dispatchableItems.every((sourceItem) =>
                                  queueItemKeys.has(getItemKey(sourceItem)),
                                )
                                  ? "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-200"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                              }`}
                              title={
                                dispatchableItems.every((sourceItem) =>
                                  queueItemKeys.has(getItemKey(sourceItem)),
                                )
                                  ? "Remove from dispatch queue"
                                  : "Add to dispatch queue"
                              }
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              <span className="hidden 2xl:inline">
                                {dispatchableItems.every((sourceItem) =>
                                  queueItemKeys.has(getItemKey(sourceItem)),
                                )
                                  ? "Queued"
                                  : "Queue"}
                              </span>
                            </button>
                          )}

                          <div>
                            <button
                              type="button"
                              onClick={(event) => {
                                const rect =
                                  event.currentTarget.getBoundingClientRect();
                                const menuWidth = 208;
                                const menuHeight = item._isMerged ? 132 : 174;
                                const viewportPadding = 12;

                                const preferredLeft = rect.right - menuWidth;
                                const left = Math.max(
                                  viewportPadding,
                                  Math.min(
                                    window.innerWidth -
                                      menuWidth -
                                      viewportPadding,
                                    preferredLeft,
                                  ),
                                );

                                const roomBelow =
                                  window.innerHeight -
                                  rect.bottom -
                                  viewportPadding;
                                const top =
                                  roomBelow >= menuHeight
                                    ? rect.bottom + 8
                                    : Math.max(
                                        viewportPadding,
                                        rect.top - menuHeight - 8,
                                      );

                                setActionMenuPosition({ top, left });
                                setOpenActionMenu((current) =>
                                  current === itemKey ? null : itemKey,
                                );
                              }}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                              title="More actions"
                              aria-label="More actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {openActionMenu === itemKey &&
                              createPortal(
                                <>
                                  <button
                                    type="button"
                                    className="fixed inset-0 z-[14000] cursor-default bg-transparent"
                                    onClick={() => setOpenActionMenu(null)}
                                    aria-label="Close action menu"
                                  />
                                  <div
                                    className="fixed z-[14010] w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl shadow-slate-900/15"
                                    style={{
                                      top: actionMenuPosition.top,
                                      left: actionMenuPosition.left,
                                    }}
                                  >
                                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      More actions
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenu(null);
                                        onRejectionClick(item);
                                      }}
                                      disabled={itemHistoryCount === 0}
                                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                                      title={
                                        itemHistoryCount > 0
                                          ? "Add or review rejection"
                                          : "A dispatch is required before rejection"
                                      }
                                    >
                                      <AlertCircle className="h-3.5 w-3.5" />
                                      Rejection
                                      {Number(item.rejected || 0) > 0 && (
                                        <span className="ml-auto rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px]">
                                          {Number(
                                            item.rejected || 0,
                                          ).toLocaleString("en-IN")}
                                        </span>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenu(null);
                                        onEditClick(item);
                                      }}
                                      disabled={!item._isMerged && !item._id}
                                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      {item._isMerged ? (
                                        <SlidersHorizontal className="h-3.5 w-3.5" />
                                      ) : (
                                        <Pencil className="h-3.5 w-3.5" />
                                      )}
                                      {item._isMerged
                                        ? "Manage related POs"
                                        : "Edit PO"}
                                    </button>

                                    {!item._isMerged && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenu(null);
                                          onDeleteClick(item);
                                        }}
                                        disabled={!item._id}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete PO
                                      </button>
                                    )}
                                  </div>
                                </>,
                                document.body,
                              )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onViewClick(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100 transition hover:bg-blue-100"
                            title="View purchase order details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => onRejectionClick(item)}
                            disabled={itemHistoryCount === 0}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-100 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                              itemHistoryCount > 0
                                ? "Add rejection or view rejection history"
                                : "A dispatch is required before rejection"
                            }
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            Rejection
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {items.length > pageSize && (
            <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-slate-500">
                Showing{" "}
                <strong className="text-slate-700">
                  {Math.min(visibleItems.length, items.length)}
                </strong>{" "}
                of <strong className="text-slate-700">{items.length}</strong>{" "}
                merged items for {company}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {visibleItemCount > pageSize && (
                  <button
                    type="button"
                    onClick={() => setVisibleItemCount(pageSize)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Show first {pageSize}
                  </button>
                )}

                {visibleItemCount < items.length && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleItemCount((count) =>
                        Math.min(items.length, count + pageSize),
                      )
                    }
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    Show next{" "}
                    {Math.min(pageSize, items.length - visibleItemCount)}
                  </button>
                )}

                {visibleItemCount < items.length && (
                  <button
                    type="button"
                    onClick={() => setVisibleItemCount(items.length)}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    Show all
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================
// PENDING PO MANAGER CLASS
// ============================================
class PendingPOManager {
  constructor(data = []) {
    this.data = Array.isArray(data) ? data : [];
    this.summary = this.calculateSummary();
    this.companyStats = this.calculateCompanyStats();
    this.itemCategories = this.extractCategories();
  }

  calculateSummary() {
    const activeData = this.data.filter((item) => !isCancelledRecord(item));
    const totalPending = activeData.reduce(
      (sum, item) => sum + toNonNegativeNumber(item.pending),
      0,
    );
    const totalDispatched = activeData.reduce(
      (sum, item) => sum + toNonNegativeNumber(item.dispatched),
      0,
    );
    const totalRejected = activeData.reduce(
      (sum, item) => sum + toNonNegativeNumber(item.rejected),
      0,
    );
    const totalAccepted = activeData.reduce(
      (sum, item) => sum + toNonNegativeNumber(item.accepted),
      0,
    );
    const totalPOQty = activeData.reduce(
      (sum, item) => sum + toNonNegativeNumber(item.poQty),
      0,
    );
    const totalValue = activeData.reduce(
      (sum, item) => sum + toNonNegativeNumber(item.total),
      0,
    );
    const uniquePOs = new Set(
      activeData.map((item) => item.po).filter(Boolean),
    );
    const uniqueCompanies = new Set(
      activeData.map((item) => item.company).filter(Boolean),
    );
    const uniqueDrawings = new Set(
      activeData.map((item) => item.drawing).filter(Boolean),
    );
    const completedItems = activeData.filter(
      (item) => item.pending <= 0,
    ).length;
    const partialItems = activeData.filter(
      (item) => item.pending > 0 && item.dispatched > 0,
    ).length;
    const untouchedItems = activeData.filter(
      (item) => item.pending > 0 && item.dispatched <= 0,
    ).length;
    const onHoldItems = activeData.filter(
      (item) => normalizeText(item.status).toLowerCase() === "on hold",
    ).length;
    const cancelledItems = this.data.length - activeData.length;

    return {
      totalPending,
      totalDispatched,
      totalRejected,
      totalAccepted,
      totalPOQty,
      totalValue,
      totalPOs: uniquePOs.size,
      totalCompanies: uniqueCompanies.size,
      totalDrawings: uniqueDrawings.size,
      totalItems: this.data.length,
      activeItems: activeData.length,
      completedItems,
      partialItems,
      untouchedItems,
      onHoldItems,
      cancelledItems,
      pendingPercentage: totalPOQty > 0 ? (totalPending / totalPOQty) * 100 : 0,
      dispatchedPercentage:
        totalPOQty > 0 ? (totalDispatched / totalPOQty) * 100 : 0,
      acceptedPercentage:
        totalPOQty > 0
          ? (Math.min(totalAccepted, totalPOQty) / totalPOQty) * 100
          : 0,
    };
  }

  calculateCompanyStats() {
    const stats = {};
    this.data.forEach((item) => {
      if (!stats[item.company]) {
        stats[item.company] = {
          totalPending: 0,
          totalDispatched: 0,
          totalPOQty: 0,
          totalValue: 0,
          poCount: new Set(),
          itemCount: 0,
          pendingItems: 0,
          completedItems: 0,
          cancelledItems: 0,
        };
      }
      if (isCancelledRecord(item)) {
        stats[item.company].cancelledItems += 1;
        return;
      }
      stats[item.company].totalPending += toNonNegativeNumber(item.pending);
      stats[item.company].totalDispatched += toNonNegativeNumber(
        item.dispatched,
      );
      stats[item.company].totalPOQty += toNonNegativeNumber(item.poQty);
      stats[item.company].totalValue += toNonNegativeNumber(item.total);
      if (item.po) stats[item.company].poCount.add(item.po);
      stats[item.company].itemCount += 1;
      if (item.pending === 0) {
        stats[item.company].completedItems += 1;
      } else {
        stats[item.company].pendingItems += 1;
      }
    });

    Object.keys(stats).forEach((company) => {
      const s = stats[company];
      s.totalPOs = s.poCount.size;
      s.completionRate =
        s.itemCount > 0 ? (s.completedItems / s.itemCount) * 100 : 0;
      s.pendingRate =
        s.itemCount > 0 ? (s.pendingItems / s.itemCount) * 100 : 0;
      s.avgPendingPerPO = s.totalPOs > 0 ? s.totalPending / s.totalPOs : 0;
      delete s.poCount;
    });

    return stats;
  }

  extractCategories() {
    const categories = new Set();
    this.data.forEach((item) => {
      categories.add(getItemCategory(item.item));
    });
    return [...categories].sort((a, b) => a.localeCompare(b));
  }

  filterData(filters) {
    let filtered = [...this.data];

    if (filters.company && filters.company !== "all") {
      filtered = filtered.filter((item) => item.company === filters.company);
    }

    if (filters.searchTerm) {
      const term = normalizeText(filters.searchTerm).toLowerCase();
      filtered = filtered.filter(
        (item) =>
          normalizeText(item.po).toLowerCase().includes(term) ||
          normalizeText(item.company).toLowerCase().includes(term) ||
          normalizeText(item.drawing).toLowerCase().includes(term) ||
          normalizeText(item.item).toLowerCase().includes(term) ||
          normalizeText(item.itemCode).toLowerCase().includes(term) ||
          normalizeText(item.deliveryDate).toLowerCase().includes(term),
      );
    }

    if (filters.status && filters.status !== "all") {
      if (filters.status === "pending") {
        filtered = filtered.filter(
          (item) => item.pending > 0 && !isCancelledRecord(item),
        );
      } else if (filters.status === "not_started") {
        filtered = filtered.filter(
          (item) =>
            item.pending > 0 &&
            item.dispatched <= 0 &&
            !isCancelledRecord(item),
        );
      } else if (filters.status === "completed") {
        filtered = filtered.filter(
          (item) => item.pending <= 0 && !isCancelledRecord(item),
        );
      } else if (filters.status === "partial") {
        filtered = filtered.filter(
          (item) =>
            item.pending > 0 && item.dispatched > 0 && !isCancelledRecord(item),
        );
      } else if (filters.status === "on_hold") {
        filtered = filtered.filter(
          (item) => normalizeText(item.status).toLowerCase() === "on hold",
        );
      } else if (filters.status === "cancelled") {
        filtered = filtered.filter(isCancelledRecord);
      }
    }

    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter(
        (item) => getItemCategory(item.item) === filters.category,
      );
    }

    if (filters.minPending !== undefined && filters.minPending !== "") {
      const minimum = toNonNegativeNumber(filters.minPending);
      filtered = filtered.filter((item) => item.pending >= minimum);
    }

    if (filters.maxPending !== undefined && filters.maxPending !== "") {
      const maximum = toNonNegativeNumber(filters.maxPending);
      filtered = filtered.filter((item) => item.pending <= maximum);
    }

    if (
      filters.dateRange &&
      (filters.dateRange.start || filters.dateRange.end)
    ) {
      const start = filters.dateRange.start
        ? getDateTimestamp(filters.dateRange.start)
        : -Infinity;
      const end = filters.dateRange.end
        ? getDateTimestamp(filters.dateRange.end)
        : Infinity;
      filtered = filtered.filter((item) => {
        const date = getDateTimestamp(item.poDate);
        return date !== null && date >= start && date <= end;
      });
    }

    return filtered;
  }
}

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = React.memo(function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "blue",
  progress,
}) {
  const tones = {
    blue: {
      icon: "bg-blue-50 text-blue-600 ring-blue-100",
      bar: "bg-gradient-to-r from-blue-500 to-indigo-500",
      glow: "from-blue-500/10",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      bar: "bg-gradient-to-r from-emerald-500 to-teal-500",
      glow: "from-emerald-500/10",
    },
    rose: {
      icon: "bg-rose-50 text-rose-600 ring-rose-100",
      bar: "bg-gradient-to-r from-rose-500 to-orange-400",
      glow: "from-rose-500/10",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600 ring-violet-100",
      bar: "bg-gradient-to-r from-violet-500 to-indigo-500",
      glow: "from-violet-500/10",
    },
  };
  const palette = tones[tone] || tones.blue;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white p-4 shadow-[0_12px_35px_-20px_rgba(30,64,175,0.35)] ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-22px_rgba(30,64,175,0.4)] sm:p-5">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${palette.glow} to-transparent blur-2xl`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${palette.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="relative mt-3">
        <p className="truncate text-xs text-slate-500">{helper}</p>
        {Number.isFinite(progress) && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ${palette.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </article>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================
const GeneratePendingList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const isClient = !isAdmin;
  const clientCompany = useMemo(() => getUserCompanyName(user), [user]);

  const [data, setData] = useState([]);
  const [manager, setManager] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minPending, setMinPending] = useState("");
  const [maxPending, setMaxPending] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [dataQualityIssueCount, setDataQualityIssueCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  // Import history for this browser session.
  // A new company upload is appended here instead of replacing the previous file.
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [lastImportSummary, setLastImportSummary] = useState(null);
  const [importPreviewFile, setImportPreviewFile] = useState(null);
  const [importPreviewSheet, setImportPreviewSheet] = useState("");
  const [importPreviewRows, setImportPreviewRows] = useState([]);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [isPreparingImport, setIsPreparingImport] = useState(false);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  const [importPreviewError, setImportPreviewError] = useState("");
  const [selectedItems, setSelectedItems] = useState(new Set());
  // Dispatch Queue uses the same Pending List records/APIs; it only changes the workflow/UI.
  const [dispatchQueue, setDispatchQueue] = useState(new Set());
  const [isQueuePanelOpen, setIsQueuePanelOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "deliveryDate",
    direction: "asc",
  });
  const [selectedItemForDispatch, setSelectedItemForDispatch] = useState(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isMultipleDispatchModalOpen, setIsMultipleDispatchModalOpen] =
    useState(false);
  const [dispatchHistory, setDispatchHistory] = useState({});
  const [initialDispatchEntry, setInitialDispatchEntry] = useState(null);
  const [selectedMergedDispatchGroup, setSelectedMergedDispatchGroup] =
    useState(null);
  const [isRejectionManagerOpen, setIsRejectionManagerOpen] = useState(false);
  const [selectedItemForRejection, setSelectedItemForRejection] =
    useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [isGlobalHistoryOpen, setIsGlobalHistoryOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);
  const [selectedPOAction, setSelectedPOAction] = useState("edit");
  const [isPOGroupModalOpen, setIsPOGroupModalOpen] = useState(false);
  const [selectedPOGroup, setSelectedPOGroup] = useState(null);
  const [selectedItemForView, setSelectedItemForView] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [expandedCompanies, setExpandedCompanies] = useState(new Set());
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const loadSequenceRef = useRef(0);

  // Pending PO must never create a second document/browser scrollbar.
  // DashboardLayout's <main className="overflow-y-auto"> remains the ONLY
  // vertical scroll container for the normal page.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");

    const previous = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      htmlOverscrollBehavior: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      bodyOverscrollBehavior: body.style.overscrollBehavior,
      rootOverflow: root?.style.overflow ?? "",
      rootHeight: root?.style.height ?? "",
    };

    html.style.overflow = "hidden";
    html.style.height = "100%";
    html.style.overscrollBehavior = "none";

    body.style.overflow = "hidden";
    body.style.height = "100%";
    body.style.overscrollBehavior = "none";

    if (root) {
      root.style.overflow = "hidden";
      root.style.height = "100%";
    }

    return () => {
      html.style.overflow = previous.htmlOverflow;
      html.style.height = previous.htmlHeight;
      html.style.overscrollBehavior = previous.htmlOverscrollBehavior;

      body.style.overflow = previous.bodyOverflow;
      body.style.height = previous.bodyHeight;
      body.style.overscrollBehavior = previous.bodyOverscrollBehavior;

      if (root) {
        root.style.overflow = previous.rootOverflow;
        root.style.height = previous.rootHeight;
      }
    };
  }, []);

  const getItemKey = useCallback((item) => getPurchaseOrderKey(item), []);

  const showNotification = useCallback((message, type = "info") => {
    const toastMessage = normalizeText(message);
    if (!toastMessage) return;

    switch (type) {
      case "success":
        toast.success(toastMessage);
        break;
      case "error":
        toast.error(toastMessage);
        break;
      case "warning":
        toast(toastMessage, { icon: "⚠️" });
        break;
      default:
        toast(toastMessage);
    }
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCompany(isAdmin ? "all" : clientCompany || "__client_company__");
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedStatus(isAdmin ? "all" : "pending");
    setSelectedCategory("all");
    setMinPending("");
    setMaxPending("");
    setDateRange({ start: "", end: "" });
    setCurrentPage(1);
  }, [clientCompany, isAdmin]);

  const filteredData = useMemo(() => {
    if (!manager) return [];
    const filters = {
      company: isAdmin ? selectedCompany : "all",
      searchTerm: debouncedSearchTerm,
      status: isAdmin ? selectedStatus : "pending",
      category: selectedCategory,
      minPending: minPending,
      maxPending: maxPending,
      dateRange: dateRange,
    };

    const result = manager.filterData(filters);

    if (isAdmin) return result;
    if (!clientCompany) return [];

    return result.filter(
      (item) =>
        isSameCompany(item.company, clientCompany) &&
        !isCancelledRecord(item) &&
        toNonNegativeNumber(item.pending) > 0,
    );
  }, [
    manager,
    isAdmin,
    clientCompany,
    selectedCompany,
    debouncedSearchTerm,
    selectedStatus,
    selectedCategory,
    minPending,
    maxPending,
    dateRange,
  ]);

  useEffect(() => {
    const visibleKeys = new Set(filteredData.map(getItemKey));
    setSelectedItems((current) => {
      const next = new Set(
        [...current].filter((itemKey) => visibleKeys.has(itemKey)),
      );
      return next.size === current.size ? current : next;
    });
  }, [filteredData, getItemKey]);

  const displayData = useMemo(
    () => mergePurchaseOrderRows(filteredData),
    [filteredData],
  );

  const sortedData = useMemo(() => {
    const rows = [...displayData];
    const { key, direction } = sortConfig;
    if (!key) return rows;
    const multiplier = direction === "desc" ? -1 : 1;
    const numericKeys = new Set([
      "poQty",
      "dispatched",
      "rejected",
      "accepted",
      "pending",
      "rate",
      "total",
    ]);
    const dateKeys = new Set(["poDate", "deliveryDate"]);

    rows.sort((left, right) => {
      let comparison = 0;
      if (numericKeys.has(key)) {
        comparison = toFiniteNumber(left?.[key]) - toFiniteNumber(right?.[key]);
      } else if (dateKeys.has(key)) {
        const leftDate = getDateTimestamp(left?.[key]);
        const rightDate = getDateTimestamp(right?.[key]);
        if (leftDate === null && rightDate !== null) return 1;
        if (leftDate !== null && rightDate === null) return -1;
        comparison = (leftDate || 0) - (rightDate || 0);
      } else {
        comparison = normalizeText(left?.[key]).localeCompare(
          normalizeText(right?.[key]),
          "en",
          { numeric: true, sensitivity: "base" },
        );
      }

      if (comparison !== 0) return comparison * multiplier;
      return `${left.company} ${left.po} ${left.item}`.localeCompare(
        `${right.company} ${right.po} ${right.item}`,
        "en",
        { numeric: true, sensitivity: "base" },
      );
    });
    return rows;
  }, [displayData, sortConfig]);

  // Group the COMPLETE filtered/sorted list by company first.
  // The old code sliced 15 global rows before grouping; if those rows all
  // belonged to River Engineering, the Sahasra accordion disappeared.
  const groupedByCompany = useMemo(() => {
    const groups = {};

    sortedData.forEach((item) => {
      const company = item.company || "Unknown Company";

      if (!groups[company]) {
        groups[company] = [];
      }

      groups[company].push(item);
    });

    return groups;
  }, [sortedData]);

  const companyList = useMemo(() => {
    return Object.keys(groupedByCompany).sort();
  }, [groupedByCompany]);

  const filteredCompanyCount = useMemo(
    () =>
      new Set(filteredData.map((item) => item.company || "Unknown Company"))
        .size,
    [filteredData],
  );

  const filteredManager = useMemo(
    () => (filteredData.length > 0 ? new PendingPOManager(filteredData) : null),
    [filteredData],
  );

  const selectedRows = useMemo(
    () => data.filter((item) => selectedItems.has(getItemKey(item))),
    [data, selectedItems, getItemKey],
  );

  const selectedExportRows = useMemo(
    () => mergePurchaseOrderRows(selectedRows),
    [selectedRows],
  );

  const dispatchableSelectedRows = useMemo(
    () =>
      selectedRows.filter((item) => {
        const status = normalizeText(item.status).toLowerCase();
        return (
          item.pending > 0 &&
          Boolean(item._id) &&
          status !== "cancelled" &&
          status !== "on hold"
        );
      }),
    [selectedRows],
  );

  const dataByKey = useMemo(() => {
    const index = new Map();
    data.forEach((item) => {
      index.set(getItemKey(item), item);
      if (item._id) index.set(String(item._id), item);
    });
    return index;
  }, [data, getItemKey]);

  const companyRanking = useMemo(() => {
    if (!manager) return [];
    return Object.entries(manager.companyStats)
      .map(([company, stats]) => ({ company, ...stats }))
      .filter((entry) => entry.totalPOQty > 0)
      .sort((a, b) => b.totalPending - a.totalPending)
      .slice(0, 5);
  }, [manager]);

  const activeFilterCount = useMemo(
    () =>
      [
        searchTerm,
        selectedCompany !== "all",
        selectedStatus !== "all",
        selectedCategory !== "all",
        minPending,
        maxPending,
        dateRange.start,
        dateRange.end,
      ].filter(Boolean).length,
    [
      searchTerm,
      selectedCompany,
      selectedStatus,
      selectedCategory,
      minPending,
      maxPending,
      dateRange,
    ],
  );

  const loadPurchaseOrders = useCallback(
    async (
      { quiet = false, signal = undefined } = {
        quiet: false,
        signal: undefined,
      },
    ) => {
      const requestSequence = ++loadSequenceRef.current;

      if (!quiet) setIsLoading(true);
      if (!quiet) setLoadError("");

      try {
        // Always reload ALL companies after every import.
        // Never filter this request by the most recently uploaded company.
        const allRecords = [];
        const limit = 500;

        const firstResult = await pendingPoApi.listAll({
          all: isAdmin,
          includeHistory: true,
          company: isAdmin ? undefined : clientCompany || undefined,
          status: isAdmin ? undefined : "pending",
          page: 1,
          limit,
          signal,
        });

        if (signal?.aborted || requestSequence !== loadSequenceRef.current) {
          return false;
        }

        const firstPageRecords = extractPurchaseOrderRecords(firstResult);
        allRecords.push(...firstPageRecords);

        const firstPagination =
          firstResult?.pagination ||
          firstResult?.data?.pagination ||
          firstResult?.meta?.pagination ||
          null;

        const totalFromServer = Number(
          firstPagination?.total ??
            firstPagination?.totalItems ??
            firstPageRecords.length,
        );

        const serverConfirmedAll =
          firstPagination?.all === true ||
          firstPagination?.all === "true" ||
          (Number.isFinite(totalFromServer) &&
            totalFromServer >= 0 &&
            firstPageRecords.length >= totalFromServer);

        // Fallback for an older backend/API wrapper that does not honor all=true.
        if (!serverConfirmedAll) {
          const totalPages = Math.max(
            1,
            Number(
              firstPagination?.pages ||
                firstPagination?.totalPages ||
                Math.ceil(Math.max(0, totalFromServer) / limit) ||
                1,
            ),
          );

          for (let page = 2; page <= totalPages; page += 1) {
            const result = await pendingPoApi.listAll({
              all: false,
              includeHistory: true,
              company: isAdmin ? undefined : clientCompany || undefined,
              status: isAdmin ? undefined : "pending",
              page,
              limit,
              signal,
            });

            if (
              signal?.aborted ||
              requestSequence !== loadSequenceRef.current
            ) {
              return false;
            }

            allRecords.push(...extractPurchaseOrderRecords(result));
          }
        }

        const rejectionSummaryRows = await rejectionApi.getSummary({ signal });
        if (signal?.aborted || requestSequence !== loadSequenceRef.current) {
          return false;
        }
        const rejectionSummaryMap =
          buildRejectionSummaryMap(rejectionSummaryRows);
        const records = allRecords.map((record, index) =>
          normalizePurchaseOrder(
            attachRejectionSummary(record, rejectionSummaryMap),
            index,
          ),
        );

        // Remove ONLY a true duplicate:
        // same Company + same PO + same item identity.
        // Different PO or different Company must remain.
        const uniqueRecords = deduplicatePOItems(records);
        const accessibleRecords = isAdmin
          ? uniqueRecords
          : clientCompany
            ? uniqueRecords.filter(
                (item) =>
                  isSameCompany(item.company, clientCompany) &&
                  !isCancelledRecord(item) &&
                  toNonNegativeNumber(item.pending) > 0,
              )
            : [];

        const nextManager = new PendingPOManager(accessibleRecords);
        const nextHistory = {};

        accessibleRecords.forEach((item) => {
          const itemKey = getItemKey(item);
          nextHistory[itemKey] = Array.isArray(item.dispatchHistory)
            ? item.dispatchHistory.map((entry) =>
                normalizeDispatchEntry(entry, {
                  ...item,
                  itemKey,
                }),
              )
            : [];
        });

        const nextCompanies = Object.keys(nextManager.companyStats).sort(
          (a, b) => a.localeCompare(b),
        );
        const nextCategories = nextManager.itemCategories;

        startTransition(() => {
          setData(accessibleRecords);
          setManager(nextManager);
          setDispatchHistory(nextHistory);
          setCompanies(
            isAdmin
              ? ["all", ...nextCompanies]
              : clientCompany
                ? [clientCompany]
                : [],
          );
          setCategories(["all", ...nextCategories]);

          setSelectedCompany((current) =>
            isAdmin
              ? current === "all" || nextCompanies.includes(current)
                ? current
                : "all"
              : clientCompany || "__client_company__",
          );
          if (!isAdmin) setSelectedStatus("pending");
          setSelectedCategory((current) =>
            current === "all" || nextCategories.includes(current)
              ? current
              : "all",
          );

          setSelectedItems(new Set());
          setIsDataReady(true);
          setDataQualityIssueCount(
            accessibleRecords.filter(
              (item) =>
                Array.isArray(item._dataIssues) && item._dataIssues.length > 0,
            ).length,
          );
          setLoadError("");
          setLastSyncedAt(new Date());
        });

        return true;
      } catch (error) {
        const wasCancelled =
          signal?.aborted ||
          error?.name === "AbortError" ||
          error?.code === "ERR_CANCELED" ||
          error?.code === "CanceledError";

        if (wasCancelled || requestSequence !== loadSequenceRef.current) {
          return false;
        }

        console.error("Error loading purchase orders:", error);
        const message = getApiErrorMessage(
          error,
          "Could not load purchase orders",
        );
        setLoadError(message);

        if (!quiet) {
          showNotification(message, "error");
        }

        return false;
      } finally {
        if (!signal?.aborted && requestSequence === loadSequenceRef.current) {
          setIsLoading(false);
        }
      }
    },
    [clientCompany, getItemKey, isAdmin, showNotification, startTransition],
  );
  const resetImportPreview = useCallback(() => {
    setIsImportPreviewOpen(false);
    setImportPreviewFile(null);
    setImportPreviewSheet("");
    setImportPreviewRows([]);
    setImportPreviewError("");
  }, []);

  const handleFileUpload = useCallback(
    async (event) => {
      if (!isAdmin) {
        showNotification("Admin access required", "error");
        event.target.value = "";
        return;
      }
      const file = event.target.files?.[0];
      if (!file) return;

      if (!/\.(xlsx|xls)$/i.test(file.name)) {
        showNotification("Please upload an .xlsx or .xls file", "error");
        event.target.value = "";
        return;
      }
      if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
        showNotification("Excel file must be 20 MB or smaller", "error");
        event.target.value = "";
        return;
      }

      setIsPreparingImport(true);
      setImportPreviewError("");
      try {
        const preview = await parseExcelFileForPreview(file);
        setImportPreviewFile(file);
        setImportPreviewSheet(preview.sheetName);
        setImportPreviewRows(preview.rows);
        setIsImportPreviewOpen(true);
      } catch (error) {
        console.error("Error reading Excel preview:", error);
        showNotification(
          getApiErrorMessage(
            error,
            "Could not preview the Excel file. Check its header row and data.",
          ),
          "error",
        );
      } finally {
        setIsPreparingImport(false);
        event.target.value = "";
      }
    },
    [isAdmin, showNotification],
  );

  const handlePreviewRowUpdate = useCallback((rowId, field, value) => {
    setImportPreviewRows((current) =>
      current.map((row) =>
        row._previewId === rowId
          ? updateExcelPreviewRow(row, field, value)
          : row,
      ),
    );
    setImportPreviewError("");
  }, []);

  const handlePreviewRowDelete = useCallback((rowId) => {
    setImportPreviewRows((current) =>
      current.filter((row) => row._previewId !== rowId),
    );
    setImportPreviewError("");
  }, []);

  const confirmReviewedImport = useCallback(async () => {
    if (!isAdmin) {
      showNotification("Admin access required", "error");
      return;
    }
    if (!importPreviewFile || importPreviewRows.length === 0) {
      setImportPreviewError("Keep at least one row before uploading");
      return;
    }
    const invalidRowCount = importPreviewRows.filter(
      (row) => row._previewIssues?.length > 0,
    ).length;
    if (invalidRowCount > 0) {
      setImportPreviewError(
        `Fix or delete the ${invalidRowCount} row${invalidRowCount === 1 ? "" : "s"} with red validation errors before uploading.`,
      );
      return;
    }

    setIsConfirmingImport(true);
    setImportPreviewError("");
    try {
      const reviewedFile = buildReviewedExcelFile(
        importPreviewRows,
        importPreviewFile,
        importPreviewSheet,
      );
      const result = await pendingPoApi.importFile(reviewedFile);

      // Import only rejection-bearing rows into the new rejection collection.
      // The backend upserts by PO line, so re-importing the same Excel file
      // updates the historical rejection instead of double-counting it.
      const rejectionImport = await rejectionApi.importExcelRows(
        importPreviewRows,
        { fileName: reviewedFile.name },
      );

      const insertedCount = Number(result?.inserted || 0);
      const updatedCount = Number(result?.updated || 0);
      const skippedCount = Number(result?.skipped || 0);

      const companiesInUpload = Array.isArray(result?.companiesInUpload)
        ? result.companiesInUpload.filter(Boolean)
        : [];

      const companiesAfterImport = Array.isArray(result?.companiesAfterImport)
        ? result.companiesAfterImport.filter(Boolean)
        : [];

      const importRecord = {
        id: `${Date.now()}-${reviewedFile.name}`,
        name: reviewedFile.name,
        size: reviewedFile.size,
        uploadedAt: new Date().toISOString(),
        companies: companiesInUpload,
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skippedCount,
      };

      // Append the new workbook to session history.
      setUploadedFiles((current) => [importRecord, ...current].slice(0, 20));

      setLastImportSummary({
        ...importRecord,
        companiesAfterImport,
        databaseTotalAfterImport: Number(result?.databaseTotalAfterImport || 0),
      });

      setSelectedItems(new Set());
      setSortConfig({ key: "deliveryDate", direction: "asc" });
      setCurrentPage(1);
      clearFilters();

      // Always reload the COMPLETE portfolio after import.
      const refreshed = await loadPurchaseOrders({ quiet: true });

      const refreshSuffix = refreshed
        ? ""
        : ". Import succeeded, but the complete list could not refresh";

      const companySuffix =
        companiesAfterImport.length > 0
          ? ` · ${companiesAfterImport.length} compan${
              companiesAfterImport.length === 1 ? "y" : "ies"
            } now saved`
          : "";

      showNotification(
        `${insertedCount} inserted, ${updatedCount} updated${
          skippedCount ? `, ${skippedCount} skipped` : ""
        }${companySuffix}${refreshSuffix}`,
        skippedCount || !refreshed ? "warning" : "success",
      );

      console.log("Pending PO import result:", {
        file: reviewedFile.name,
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skippedCount,
        companiesInUpload,
        companiesAfterImport,
        databaseTotalAfterImport: result?.databaseTotalAfterImport,
        rejectionImport,
      });

      resetImportPreview();
    } catch (error) {
      console.error("Error importing reviewed Excel data:", error);
      setImportPreviewError(
        getApiErrorMessage(
          error,
          "Could not upload the reviewed data. Check the highlighted rows and try again.",
        ),
      );
    } finally {
      setIsConfirmingImport(false);
    }
  }, [
    importPreviewFile,
    importPreviewRows,
    importPreviewSheet,
    clearFilters,
    loadPurchaseOrders,
    resetImportPreview,
    showNotification,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    void loadPurchaseOrders({ signal: controller.signal });

    return () => controller.abort();
  }, [loadPurchaseOrders]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearchTerm(searchTerm.trim()),
      220,
    );
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    selectedCompany,
    selectedStatus,
    selectedCategory,
    minPending,
    maxPending,
    dateRange,
    sortConfig,
    pageSize,
  ]);

  const handleDispatchUpdate = useCallback(
    async (payload) => {
      if (!isAdmin) throw new Error("Admin access required");
      const result = payload.isBulk
        ? await pendingPoApi.createBulkDispatch(payload)
        : await pendingPoApi.createDispatch(payload);

      const refreshed = await loadPurchaseOrders({ quiet: true });

      if (payload.isBulk) {
        const successCount = Number(
          result?.totalProcessed ?? result?.successful?.length ?? 0,
        );
        const failCount = Number(
          result?.totalFailed ?? result?.failed?.length ?? 0,
        );
        showNotification(
          `${successCount} item(s) dispatched${failCount ? `, ${failCount} skipped` : ""}${refreshed ? "" : ". Refresh the list to see the latest balances"}`,
          failCount || !refreshed ? "warning" : "success",
        );
      } else {
        showNotification(
          `Dispatch saved. New pending quantity: ${result?.updatedPO?.pending ?? "-"}${refreshed ? "" : ". Refresh the list to see the latest balance"}`,
          refreshed ? "success" : "warning",
        );
      }

      // Remove successfully dispatched rows from the queue when they no longer
      // have pending quantity after the list refresh. Any still-pending rows
      // stay available for another dispatch batch.
      if (payload.isBulk) {
        const dispatchedIds = new Set(
          (payload.items || []).map((entry) => normalizeText(entry.poId)),
        );
        if (dispatchedIds.size > 0) {
          setDispatchQueue((current) => {
            const next = new Set(current);
            data.forEach((item) => {
              if (dispatchedIds.has(normalizeText(item?._id))) {
                next.delete(getItemKey(item));
              }
            });
            return next;
          });
        }
      } else if (payload.poId) {
        setDispatchQueue((current) => {
          const next = new Set(current);
          const matched = data.find(
            (item) => normalizeText(item?._id) === normalizeText(payload.poId),
          );
          if (matched) next.delete(getItemKey(matched));
          return next;
        });
      }

      return result;
    },
    [data, getItemKey, isAdmin, loadPurchaseOrders, showNotification],
  );

  const handleDispatchEdit = useCallback(
    async (payload) => {
      if (!isAdmin) throw new Error("Admin access required");
      try {
        const result = await pendingPoApi.updateDispatch(payload);
        const refreshed = await loadPurchaseOrders({ quiet: true });
        showNotification(
          refreshed
            ? "Dispatch updated successfully"
            : "Dispatch updated; refresh the list to see the latest balance",
          refreshed ? "success" : "warning",
        );
        return result;
      } catch (error) {
        showNotification(getApiErrorMessage(error, "Update failed"), "error");
        throw error;
      }
    },
    [isAdmin, loadPurchaseOrders, showNotification],
  );

  const handleDispatchDelete = useCallback(
    async (payload) => {
      if (!isAdmin) throw new Error("Admin access required");
      try {
        await pendingPoApi.deleteDispatch(payload);
        const refreshed = await loadPurchaseOrders({ quiet: true });
        showNotification(
          refreshed
            ? "Dispatch deleted successfully"
            : "Dispatch deleted; refresh the list to see the latest balance",
          refreshed ? "success" : "warning",
        );
      } catch (error) {
        showNotification(getApiErrorMessage(error, "Delete failed"), "error");
        throw error;
      }
    },
    [isAdmin, loadPurchaseOrders, showNotification],
  );

  const openMultipleDispatchModal = useCallback(() => {
    if (!isAdmin) return;
    const itemsToDispatch = dispatchableSelectedRows;

    if (itemsToDispatch.length === 0) {
      showNotification(
        "No selected items are eligible for dispatch. Check pending quantity, hold/cancel status, and database ids.",
        "warning",
      );
      return;
    }

    const itemsWithHistory = itemsToDispatch.map((item) => ({
      ...item,
      dispatchHistory: dispatchHistory[getItemKey(item)] || [],
    }));

    setSelectedItemForDispatch(itemsWithHistory);
    setSelectedMergedDispatchGroup(null);
    setInitialDispatchEntry(null);
    setIsQueuePanelOpen(false);
    setIsMultipleDispatchModalOpen(true);
  }, [dispatchableSelectedRows, getItemKey, dispatchHistory, showNotification]);

  const closeDispatchModal = useCallback(() => {
    setIsDispatchModalOpen(false);
    setIsMultipleDispatchModalOpen(false);
    setSelectedItemForDispatch(null);
    setSelectedMergedDispatchGroup(null);
    setInitialDispatchEntry(null);
  }, []);

  const openGlobalHistory = useCallback(() => {
    setIsGlobalHistoryOpen(true);
  }, []);

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(toFiniteNumber(value));
  }, []);

  const formatDate = useCallback((dateStr) => formatDateValue(dateStr), []);

  const getCompletionPercentage = useCallback((item) => {
    const total = Number(item?.poQty) || 0;
    if (total <= 0) return 0;
    return Math.min(
      100,
      Math.max(0, ((Number(item?.accepted) || 0) / total) * 100),
    );
  }, []);

  const getRiskMeta = useCallback(
    (item) => {
      const status = normalizeText(item?.status).toLowerCase();
      if (status === "cancelled") {
        return {
          label: "Cancelled",
          dot: "bg-slate-400",
          badge: "bg-slate-100 text-slate-600 ring-slate-200",
        };
      }
      if (status === "on hold") {
        return {
          label: "On hold",
          dot: "bg-violet-500",
          badge: "bg-violet-50 text-violet-700 ring-violet-200",
        };
      }
      if ((Number(item?.pending) || 0) <= 0) {
        return {
          label: "Completed",
          dot: "bg-emerald-500",
          badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        };
      }

      const deliveryTimestamp = getDateTimestamp(item?.deliveryDate);
      const todayTimestamp = getDateTimestamp(getLocalDateInputValue());
      if (deliveryTimestamp !== null && todayTimestamp !== null) {
        const daysUntilDue = Math.ceil(
          (deliveryTimestamp - todayTimestamp) / 86400000,
        );
        if (daysUntilDue < 0) {
          return {
            label: `Overdue ${Math.abs(daysUntilDue)}d`,
            dot: "bg-rose-600",
            badge: "bg-rose-50 text-rose-700 ring-rose-200",
          };
        }
        if (daysUntilDue === 0) {
          return {
            label: "Due today",
            dot: "bg-rose-500",
            badge: "bg-rose-50 text-rose-700 ring-rose-200",
          };
        }
        if (daysUntilDue <= 7) {
          return {
            label: `Due in ${daysUntilDue}d`,
            dot: "bg-amber-500",
            badge: "bg-amber-50 text-amber-700 ring-amber-200",
          };
        }
      }

      const remaining = 100 - getCompletionPercentage(item);
      if (remaining >= 75) {
        return {
          label: "High pending",
          dot: "bg-rose-500",
          badge: "bg-rose-50 text-rose-700 ring-rose-200",
        };
      }
      if (remaining >= 35) {
        return {
          label: "Needs attention",
          dot: "bg-amber-500",
          badge: "bg-amber-50 text-amber-700 ring-amber-200",
        };
      }
      return {
        label: "Near completion",
        dot: "bg-blue-500",
        badge: "bg-blue-50 text-blue-700 ring-blue-200",
      };
    },
    [getCompletionPercentage],
  );

  const handleSort = useCallback((key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const getSortIcon = useCallback(
    (key) => {
      if (sortConfig.key !== key) return ArrowUpDown;
      return sortConfig.direction === "asc" ? ArrowUp : ArrowDown;
    },
    [sortConfig],
  );

  const toggleItemSelection = useCallback(
    (item) => {
      const sourceItems = getSourcePurchaseOrders(item);
      setSelectedItems((current) => {
        const next = new Set(current);
        const allSourceItemsSelected = sourceItems.every((sourceItem) =>
          next.has(getItemKey(sourceItem)),
        );
        sourceItems.forEach((sourceItem) => {
          const itemKey = getItemKey(sourceItem);
          if (allSourceItemsSelected) next.delete(itemKey);
          else next.add(itemKey);
        });
        return next;
      });
    },
    [getItemKey],
  );

  const setItemsSelection = useCallback(
    (items, shouldSelect) => {
      setSelectedItems((current) => {
        const next = new Set(current);
        items.flatMap(getSourcePurchaseOrders).forEach((item) => {
          const itemKey = getItemKey(item);
          if (shouldSelect) next.add(itemKey);
          else next.delete(itemKey);
        });
        return next;
      });
    },
    [getItemKey],
  );

  const queueItems = useMemo(() => {
    if (dispatchQueue.size === 0) return [];
    return data.filter((item) => dispatchQueue.has(getItemKey(item)));
  }, [data, dispatchQueue, getItemKey]);

  const toggleDispatchQueue = useCallback(
    (item) => {
      if (!isAdmin) return;
      const eligibleItems = getSourcePurchaseOrders(item).filter(
        (sourceItem) => {
          const status = normalizeText(sourceItem?.status).toLowerCase();
          return (
            Boolean(sourceItem?._id) &&
            toNonNegativeNumber(sourceItem?.pending) > 0 &&
            status !== "cancelled" &&
            status !== "on hold"
          );
        },
      );

      if (eligibleItems.length === 0) {
        showNotification(
          "This item has no eligible pending PO available for the dispatch queue.",
          "warning",
        );
        return;
      }

      setDispatchQueue((current) => {
        const next = new Set(current);
        const eligibleKeys = eligibleItems.map(getItemKey);
        const allAlreadyQueued = eligibleKeys.every((key) => next.has(key));

        eligibleKeys.forEach((key) => {
          if (allAlreadyQueued) next.delete(key);
          else next.add(key);
        });

        return next;
      });
    },
    [getItemKey, showNotification],
  );

  const removeQueueItem = useCallback((itemKey) => {
    setDispatchQueue((current) => {
      const next = new Set(current);
      next.delete(itemKey);
      if (next.size === 0) {
        setIsQueuePanelOpen(false);
      }
      return next;
    });
  }, []);

  const clearDispatchQueue = useCallback(() => {
    setDispatchQueue(new Set());
    setIsQueuePanelOpen(false);
  }, []);

  const openDispatchQueue = useCallback(() => {
    const eligibleQueueItems = queueItems.filter((item) => {
      const status = normalizeText(item?.status).toLowerCase();
      return (
        Boolean(item?._id) &&
        toNonNegativeNumber(item?.pending) > 0 &&
        status !== "cancelled" &&
        status !== "on hold"
      );
    });

    if (eligibleQueueItems.length === 0) {
      showNotification("Your dispatch queue is empty.", "warning");
      return;
    }

    const itemsWithHistory = eligibleQueueItems.map((item) => ({
      ...item,
      dispatchHistory: dispatchHistory[getItemKey(item)] || [],
    }));

    setSelectedItemForDispatch(itemsWithHistory);
    setSelectedMergedDispatchGroup(null);
    setInitialDispatchEntry(null);
    setIsMultipleDispatchModalOpen(true);
  }, [queueItems, dispatchHistory, getItemKey, showNotification]);

  const handleDispatchClick = useCallback(
    (item) => {
      if (!isAdmin) return;
      if (item._isMerged) {
        const eligibleItems = item._dispatchableItems || [];
        if (eligibleItems.length === 0) {
          showNotification(
            "No related PO is eligible for dispatch. Check pending quantity, hold/cancel status, and database ids.",
            "warning",
          );
          return;
        }

        const itemsWithHistory = eligibleItems.map((sourceItem) => ({
          ...sourceItem,
          dispatchHistory: dispatchHistory[getItemKey(sourceItem)] || [],
        }));
        setSelectedItemForDispatch(itemsWithHistory);
        setSelectedMergedDispatchGroup(item);
        setInitialDispatchEntry(null);
        setIsMultipleDispatchModalOpen(true);
        return;
      }

      const itemKey = getItemKey(item);
      setSelectedMergedDispatchGroup(null);
      setInitialDispatchEntry(null);
      setSelectedItemForDispatch({
        ...item,
        dispatchHistory: dispatchHistory[itemKey] || [],
      });
      setIsDispatchModalOpen(true);
    },
    [dispatchHistory, getItemKey, isClient, clientCompany, showNotification],
  );

  const handleRejectionClick = useCallback(
    (item) => {
      if (
        isClient &&
        clientCompany &&
        !isSameCompany(item?.company, clientCompany)
      ) {
        showNotification(
          "You can only add rejection for your assigned company.",
          "error",
        );
        return;
      }
      const sourceItems = getSourcePurchaseOrders(item);
      const hasDispatch = sourceItems.some((sourceItem) => {
        const history = dispatchHistory[getItemKey(sourceItem)] || [];
        return history.some(
          (entry) =>
            normalizeText(entry?._id || entry?.id) &&
            toNonNegativeNumber(entry?.dispatchQty ?? entry?.quantity) > 0,
        );
      });

      if (!hasDispatch) {
        showNotification(
          "Record a dispatch before adding a rejection. Rejection must be linked to the exact dispatch.",
          "warning",
        );
        return;
      }

      setSelectedItemForRejection(item);
      setIsRejectionManagerOpen(true);
    },
    [dispatchHistory, getItemKey, isAdmin, showNotification],
  );

  const closeRejectionManager = useCallback(() => {
    setIsRejectionManagerOpen(false);
    setSelectedItemForRejection(null);
  }, []);

  const handleRejectionChanged = useCallback(
    async (message, type = "success") => {
      const refreshed = await loadPurchaseOrders({ quiet: true });
      showNotification(
        `${message}${refreshed ? "" : " Refresh the page to see the latest balance."}`,
        refreshed ? type : "warning",
      );
      return refreshed;
    },
    [loadPurchaseOrders, showNotification],
  );

  const openSinglePOEditor = useCallback((item, action = "edit") => {
    if (!item) return;
    setSelectedItemForEdit(item);
    setSelectedPOAction(action);
    setIsEditModalOpen(true);
  }, []);

  const closeSinglePOEditor = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedItemForEdit(null);
    setSelectedPOAction("edit");
  }, []);

  const openPOGroupManager = useCallback((item) => {
    setSelectedPOGroup(item);
    setIsPOGroupModalOpen(true);
  }, []);

  const closePOGroupManager = useCallback(() => {
    setIsPOGroupModalOpen(false);
    setSelectedPOGroup(null);
  }, []);

  const handleGroupPOEdit = useCallback(
    (sourceItem) => {
      closePOGroupManager();
      openSinglePOEditor(sourceItem, "edit");
    },
    [closePOGroupManager, openSinglePOEditor],
  );

  const handleGroupPODelete = useCallback(
    (sourceItem) => {
      closePOGroupManager();
      openSinglePOEditor(sourceItem, "delete");
    },
    [closePOGroupManager, openSinglePOEditor],
  );

  const handleViewClick = useCallback((item) => {
    if (!item) return;
    setSelectedItemForView(item);
    setIsViewModalOpen(true);
  }, []);

  const closeViewModal = useCallback(() => {
    setIsViewModalOpen(false);
    setSelectedItemForView(null);
  }, []);

  const handleEditClick = useCallback(
    (item) => {
      if (!isAdmin) return;
      const sourceItems = getSourcePurchaseOrders(item);
      if (sourceItems.length > 1) {
        openPOGroupManager(item);
        return;
      }
      openSinglePOEditor(sourceItems[0] || item, "edit");
    },
    [isAdmin, openPOGroupManager, openSinglePOEditor],
  );

  const handleDeleteClick = useCallback(
    (item) => {
      if (!isAdmin) return;
      const sourceItems = getSourcePurchaseOrders(item);
      if (sourceItems.length > 1) {
        openPOGroupManager(item);
        return;
      }
      openSinglePOEditor(sourceItems[0] || item, "delete");
    },
    [isAdmin, openPOGroupManager, openSinglePOEditor],
  );

  const handleUpdatePO = useCallback(
    async (id, updateData) => {
      if (!isAdmin) throw new Error("Admin access required");
      try {
        const result = await pendingPoApi.updatePO(id, updateData);
        const refreshed = await loadPurchaseOrders({ quiet: true });
        showNotification(
          refreshed
            ? "Purchase order updated successfully"
            : "Purchase order updated; refresh the list to see the latest values",
          refreshed ? "success" : "warning",
        );
        return result;
      } catch (error) {
        showNotification(getApiErrorMessage(error, "Update failed"), "error");
        throw error;
      }
    },
    [loadPurchaseOrders, showNotification],
  );

  const handleDeletePO = useCallback(
    async (id) => {
      if (!isAdmin) throw new Error("Admin access required");
      try {
        await pendingPoApi.deletePO(id);
        const refreshed = await loadPurchaseOrders({ quiet: true });
        showNotification(
          refreshed
            ? "Purchase order deleted successfully"
            : "Purchase order deleted; refresh the list to update the view",
          refreshed ? "success" : "warning",
        );
      } catch (error) {
        showNotification(getApiErrorMessage(error, "Delete failed"), "error");
        throw error;
      }
    },
    [isAdmin, loadPurchaseOrders, showNotification],
  );

  const toggleCompany = useCallback((company) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(company)) {
        next.delete(company);
      } else {
        next.add(company);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allCompanies = new Set(companyList);
    setExpandedCompanies(allCompanies);
  }, [companyList]);

  const collapseAll = useCallback(() => {
    setExpandedCompanies(new Set());
  }, []);

  const exportRows = useCallback(
    (rows, label = "filtered") => {
      if (!rows.length) {
        showNotification("No records available to export", "warning");
        return;
      }
      try {
        const toDetailedExportRow = (item) => ({
          Company: item.company,
          "PO Number": item.po,
          "PO Date": toDateInputValue(item.poDate),
          "Delivery Date": toDateInputValue(item.deliveryDate),
          Drawing: item.drawing,
          "Item Code": item.itemCode,
          "Item Description": item.item,
          "PO Quantity": item.poQty,
          Dispatched: item.dispatched,
          Rejected: item.rejected || 0,
          "Net Accepted": item.accepted || 0,
          Pending: item.pending,
          "Completion %": Number(getCompletionPercentage(item).toFixed(1)),
          Status: item.status,
          "Unit Rate": item.rate,
          "Pending Value": item.total,
          "Data Issues": item._dataIssues?.join("; ") || "",
        });
        const hasMergedRows = rows.some((item) => item._isMerged);
        const exportData = hasMergedRows
          ? rows.map((item) => ({
              Company: item.company,
              "Related PO Numbers": item.poNumbers?.join(", ") || item.po,
              "PO Count": item.poCount || getSourcePurchaseOrders(item).length,
              "PO Dates":
                item.poDates?.join(", ") || toDateInputValue(item.poDate),
              "Delivery Dates":
                item.deliveryDates?.join(", ") ||
                toDateInputValue(item.deliveryDate),
              Drawing: item.drawing,
              "Item Code(s)": item.itemCodes?.join(", ") || item.itemCode,
              "Item Description": item.item,
              "PO Quantity (Sum)": item.poQty,
              "Dispatched (Sum)": item.dispatched,
              "Rejected (Sum)": item.rejected || 0,
              "Net Accepted (Sum)": item.accepted || 0,
              "Pending (Sum)": item.pending,
              "Completion %": Number(getCompletionPercentage(item).toFixed(1)),
              Status: item.status,
              "Rate Type": item._hasMixedRates ? "Mixed" : "Single",
              "Source Unit Rates": item.rates?.join(", ") || item.rate,
              "Weighted Average Rate": Number(
                toFiniteNumber(item.rate).toFixed(2),
              ),
              "Pending Value (Sum)": item.total,
              "Cancelled PO Lines": item._cancelledCount || 0,
              "Data Issues": item._dataIssues?.join("; ") || "",
            }))
          : rows.map(toDetailedExportRow);
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        worksheet["!cols"] = hasMergedRows
          ? [
              { wch: 24 },
              { wch: 42 },
              { wch: 10 },
              { wch: 28 },
              { wch: 32 },
              { wch: 18 },
              { wch: 22 },
              { wch: 36 },
              { wch: 16 },
              { wch: 16 },
              { wch: 15 },
              { wch: 14 },
              { wch: 16 },
              { wch: 12 },
              { wch: 24 },
              { wch: 22 },
              { wch: 20 },
              { wch: 18 },
              { wch: 42 },
            ]
          : [
              { wch: 24 },
              { wch: 16 },
              { wch: 13 },
              { wch: 13 },
              { wch: 18 },
              { wch: 16 },
              { wch: 36 },
              { wch: 12 },
              { wch: 12 },
              { wch: 12 },
              { wch: 14 },
              { wch: 16 },
              { wch: 12 },
              { wch: 16 },
              { wch: 42 },
            ];
        worksheet["!autofilter"] = { ref: worksheet["!ref"] };
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          hasMergedRows ? "Merged Pending PO" : "Pending PO",
        );

        if (hasMergedRows) {
          const breakdownData = rows
            .flatMap(getSourcePurchaseOrders)
            .map(toDetailedExportRow);
          const breakdownSheet = XLSX.utils.json_to_sheet(breakdownData);
          breakdownSheet["!cols"] = [
            { wch: 24 },
            { wch: 16 },
            { wch: 13 },
            { wch: 13 },
            { wch: 18 },
            { wch: 16 },
            { wch: 36 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 },
            { wch: 14 },
            { wch: 16 },
            { wch: 12 },
            { wch: 16 },
            { wch: 42 },
          ];
          breakdownSheet["!autofilter"] = { ref: breakdownSheet["!ref"] };
          XLSX.utils.book_append_sheet(
            workbook,
            breakdownSheet,
            "PO Breakdown",
          );
        }

        const stamp = getLocalDateInputValue();
        XLSX.writeFile(
          workbook,
          `pending-po-${hasMergedRows ? "merged-" : ""}${label}-${stamp}.xlsx`,
        );
        const sourceCount = rows.flatMap(getSourcePurchaseOrders).length;
        showNotification(
          hasMergedRows
            ? `${rows.length} merged item(s) exported with ${sourceCount} PO line(s) in the breakdown sheet`
            : `${rows.length} records exported`,
          "success",
        );
      } catch (error) {
        showNotification(
          getApiErrorMessage(error, "The Excel export could not be created"),
          "error",
        );
      }
    },
    [getCompletionPercentage, showNotification],
  );

  const downloadTemplate = useCallback(async () => {
    try {
      await pendingPoApi.downloadTemplate();
      showNotification("Import template downloaded", "success");
    } catch (error) {
      showNotification(
        getApiErrorMessage(error, "Template could not be downloaded"),
        "error",
      );
    }
  }, [showNotification]);

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(100px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slideIn { animation: slideIn 0.3s ease-out; }
          .animate-fadeInUp { animation: fadeInUp 0.5s ease-out; }
          .thin-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
          .thin-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
          .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
          @media (prefers-reduced-motion: reduce) {
            .animate-slideIn, .animate-fadeInUp, .animate-pulse-slow {
              animation: none !important;
            }
          }
        `}
      </style>

      <Toaster
        position="top-right"
        containerStyle={{
          zIndex: 99999,
        }}
        toastOptions={{
          duration: 5000,
        }}
      />

      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
      />

      {/* Excel preview is staged locally; no API import happens until confirm. */}
      <ExcelImportPreviewModal
        isOpen={isImportPreviewOpen}
        file={importPreviewFile}
        sheetName={importPreviewSheet}
        rows={importPreviewRows}
        isSubmitting={isConfirmingImport}
        error={importPreviewError}
        onUpdateRow={handlePreviewRowUpdate}
        onDeleteRow={handlePreviewRowDelete}
        onCancel={resetImportPreview}
        onConfirm={confirmReviewedImport}
      />

      <RejectionManagerModal
        isOpen={isRejectionManagerOpen}
        item={selectedItemForRejection}
        dispatchHistory={dispatchHistory}
        getItemKey={getItemKey}
        onClose={closeRejectionManager}
        onChanged={handleRejectionChanged}
        isAdmin={isAdmin}
        clientCompany={clientCompany}
      />

      <PurchaseOrderViewModal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        item={selectedItemForView}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

      {/* Edit/Delete PO Modal */}
      {isAdmin && (
        <EditDeleteModal
          isOpen={isEditModalOpen}
          onClose={closeSinglePOEditor}
          item={selectedItemForEdit}
          onUpdate={handleUpdatePO}
          onDelete={handleDeletePO}
          initialDeleteConfirmation={selectedPOAction === "delete"}
        />
      )}

      {isAdmin && (
        <>
          {/* Merged rows retain their source records so the user can safely choose
          exactly which database PO to edit or delete. */}
          <PurchaseOrderGroupModal
            isOpen={isPOGroupModalOpen}
            onClose={closePOGroupManager}
            group={selectedPOGroup}
            onEdit={handleGroupPOEdit}
            onDelete={handleGroupPODelete}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />

          {/* Dispatch Modal */}
          <DispatchModal
            isOpen={isDispatchModalOpen}
            onClose={closeDispatchModal}
            item={selectedItemForDispatch}
            onDispatchUpdate={handleDispatchUpdate}
            onDispatchEdit={handleDispatchEdit}
            onDispatchDelete={handleDispatchDelete}
            dispatchHistory={selectedItemForDispatch?.dispatchHistory || []}
            initialDispatchEntry={initialDispatchEntry}
          />

          {/* Multiple Dispatch Modal */}

          <MultipleDispatchModal
            isOpen={isMultipleDispatchModalOpen}
            onClose={closeDispatchModal}
            selectedItems={
              Array.isArray(selectedItemForDispatch)
                ? selectedItemForDispatch
                : []
            }
            onDispatchUpdate={handleDispatchUpdate}
            dispatchHistory={dispatchHistory}
            mergedGroup={selectedMergedDispatchGroup}
          />

          {/* Global History Modal */}
          <GlobalDispatchHistoryModal
            isOpen={isGlobalHistoryOpen}
            onClose={() => setIsGlobalHistoryOpen(false)}
            dispatchHistory={dispatchHistory}
            formatDate={formatDate}
            onDispatchEdit={(entry, billNumber) => {
              setIsGlobalHistoryOpen(false);
              const parentItem =
                dataByKey.get(String(entry.poId || "")) ||
                dataByKey.get(entry.itemKey);
              if (!parentItem) {
                showNotification(
                  `Could not find the purchase order for bill ${billNumber}`,
                  "error",
                );
                return;
              }
              setSelectedItemForDispatch({
                ...parentItem,
                dispatchHistory: dispatchHistory[entry.itemKey] || [],
              });
              setInitialDispatchEntry(entry);
              setIsDispatchModalOpen(true);
            }}
            onDispatchDelete={handleDispatchDelete}
          />
        </>
      )}

      <div className="mx-auto w-full min-w-0 max-w-[1600px] bg-gradient-to-br from-slate-50 via-blue-50/70 to-indigo-50 p-3 text-slate-900 sm:p-5 lg:p-6">
        {/* Header */}
        <header className="relative rounded-2xl shadow-lg mb-8 overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 animate-fadeInUp sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/15 shadow-inner backdrop-blur-sm sm:h-14 sm:w-14">
                <LayoutDashboard className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                    <Sparkles className="h-3 w-3" /> Operations workspace
                  </span>
                </div>
                <h1 className="truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Pending PO
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-white">
                  Track commitments, prioritize pending quantities, and record
                  every dispatch from one responsive workspace.
                </p>
              </div>
            </div>

            <div className="no-print flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsUserGuideOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <HelpCircle className="h-4 w-4" />
                How to Use
              </button>

              {isAdmin && (
                <>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={
                      isLoading || isPreparingImport || isConfirmingImport
                    }
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50 ${isLoading || isPreparingImport || isConfirmingImport ? "pointer-events-none cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    {isPreparingImport ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isPreparingImport
                      ? "Preparing preview..."
                      : data.length > 0
                        ? "Preview Excel update"
                        : "Preview Excel upload"}
                  </label>
                </>
              )}

              {isDataReady && (
                <button
                  type="button"
                  onClick={() => void loadPurchaseOrders()}
                  disabled={isLoading || isPending}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading || isPending ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              )}

              {isAdmin && data.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={openGlobalHistory}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <History className="h-4 w-4" />
                    View History
                  </button>

                  <button
                    type="button"
                    onClick={() => exportRows(sortedData, "filtered")}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <Download className="h-4 w-4" />
                    Export merged
                  </button>
                </>
              )}
            </div>
          </div>

          {isDataReady && (
            <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-white/15 bg-slate-950/10 px-4 py-3 text-xs text-blue-50 backdrop-blur-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                <span>Saved purchase-order records</span>
              </span>

              <span>{manager?.summary.totalPOs || 0} purchase orders</span>
              <span>{manager?.summary.totalCompanies || 0} companies</span>

              {uploadedFiles.length > 0 ? (
                <span>
                  {uploadedFiles.length} Excel file
                  {uploadedFiles.length === 1 ? "" : "s"} imported this session
                </span>
              ) : null}

              {lastImportSummary?.name ? (
                <span
                  className="max-w-[360px] truncate"
                  title={lastImportSummary.name}
                >
                  Last import: {lastImportSummary.name}
                </span>
              ) : null}
              {dataQualityIssueCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-300/20 px-2.5 py-1 text-amber-50">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {dataQualityIssueCount} record
                  {dataQualityIssueCount === 1 ? "" : "s"} need review
                </span>
              )}
              {uploadedFiles.length > 0 && (
                <div className="order-last flex basis-full flex-wrap items-center gap-2 border-t border-white/10 pt-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-100">
                    Recent imports:
                  </span>

                  {uploadedFiles.slice(0, 6).map((file) => (
                    <span
                      key={file.id}
                      title={[
                        file.name,
                        file.companies?.length
                          ? `Company: ${file.companies.join(", ")}`
                          : "",
                        `${file.inserted} inserted`,
                        `${file.updated} updated`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      className="max-w-[260px] truncate rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] text-blue-50"
                    >
                      {file.name}
                    </span>
                  ))}

                  {uploadedFiles.length > 6 ? (
                    <span className="text-[11px] text-blue-100">
                      +{uploadedFiles.length - 6} more
                    </span>
                  ) : null}
                </div>
              )}

              <span className="ml-auto flex items-center gap-1.5 text-blue-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                {lastSyncedAt
                  ? `Synced ${lastSyncedAt.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Synced with database"}
              </span>
            </div>
          )}
        </header>

        {isAdmin && data.length > 0 && (
          <section className="no-print mb-5 rounded-2xl border border-blue-100 bg-white px-4 py-4 shadow-sm sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <Info className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Working flow
                    </p>
                    <p className="text-xs text-slate-500">
                      Follow these steps from left to right.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["1", "Find", "Search or filter pending items", Search],
                  ["2", "Choose", "Dispatch now or add to Queue", Truck],
                  [
                    "3",
                    "Review",
                    "Enter qty, bill and transport details",
                    ListChecks,
                  ],
                  ["4", "Track", "Use History, Rejection or Manage", History],
                ].map(([number, title, description, Icon], index) => (
                  <div
                    key={title}
                    className="relative flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-600 text-[11px] font-bold text-white">
                      {number}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">
                        {title}
                      </p>
                      <p
                        className="truncate text-[10px] text-slate-500"
                        title={description}
                      >
                        {description}
                      </p>
                    </div>
                    {index < 3 && (
                      <ArrowRight className="ml-auto hidden h-3.5 w-3.5 shrink-0 text-slate-300 xl:block" />
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsUserGuideOpen(true)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-100 transition hover:bg-blue-100"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Open Guide
              </button>
            </div>
          </section>
        )}

        {isClient && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-bold">Client read-only access</p>
              <p className="mt-0.5 text-xs text-blue-700">
                {clientCompany
                  ? `Showing only pending purchase orders for ${clientCompany}.`
                  : "No company is assigned to this account, so purchase-order data is hidden."}
              </p>
            </div>
          </div>
        )}

        {loadError && data.length > 0 && (
          <div
            className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <span className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              The displayed data may be stale: {loadError}
            </span>
            <button
              type="button"
              onClick={() => void loadPurchaseOrders()}
              className="shrink-0 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-200"
            >
              Retry refresh
            </button>
          </div>
        )}

        {/* Executive summary */}
        {data.length > 0 && manager && (
          <section className="mb-5 animate-fadeInUp">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                  Portfolio snapshot
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                  Dispatch performance
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAnalytics((current) => !current)}
                className="no-print inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
              >
                {showAnalytics ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {showAnalytics ? "Hide insights" : "Show insights"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Pending quantity"
                value={manager.summary.totalPending.toLocaleString("en-IN")}
                helper={`${manager.summary.pendingPercentage.toFixed(1)}% of ordered quantity remains`}
                icon={Clock3}
                tone="rose"
                progress={manager.summary.pendingPercentage}
              />
              <StatCard
                label="Gross dispatched"
                value={manager.summary.totalDispatched.toLocaleString("en-IN")}
                helper="Historical dispatch quantity before rejection adjustment"
                icon={Truck}
                tone="blue"
                progress={Math.min(100, manager.summary.dispatchedPercentage)}
              />
              <StatCard
                label="Rejected quantity"
                value={manager.summary.totalRejected.toLocaleString("en-IN")}
                helper="Approved + Excel-recorded rejection affecting pending"
                icon={AlertCircle}
                tone="rose"
                progress={
                  manager.summary.totalPOQty > 0
                    ? Math.min(
                        100,
                        (manager.summary.totalRejected /
                          manager.summary.totalPOQty) *
                          100,
                      )
                    : 0
                }
              />
              <StatCard
                label="Net accepted"
                value={manager.summary.totalAccepted.toLocaleString("en-IN")}
                helper={`${manager.summary.acceptedPercentage.toFixed(1)}% accepted fulfilment across all POs`}
                icon={CircleCheckBig}
                tone="emerald"
                progress={manager.summary.acceptedPercentage}
              />
              <StatCard
                label="Active portfolio"
                value={`${manager.summary.totalCompanies} companies`}
                helper={`${manager.summary.totalDrawings} drawings · ${manager.summary.activeItems} active line items${manager.summary.cancelledItems ? ` · ${manager.summary.cancelledItems} cancelled` : ""}`}
                icon={Building2}
                tone="blue"
              />
            </div>

            {showAnalytics && (
              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
                <article className="print-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_-25px_rgba(15,23,42,0.35)] xl:col-span-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Fulfilment overview
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Quantity-weighted progress
                      </p>
                    </div>
                    <Gauge className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="mt-5 flex items-center gap-6">
                    <div
                      className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full"
                      style={{
                        background: `conic-gradient(#2563eb ${manager.summary.dispatchedPercentage}%, #e2e8f0 0)`,
                      }}
                    >
                      <div className="grid h-[82px] w-[82px] place-items-center rounded-full bg-white shadow-inner">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-slate-900">
                            {manager.summary.dispatchedPercentage.toFixed(0)}%
                          </p>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            complete
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      {[
                        [
                          "Completed",
                          manager.summary.completedItems,
                          "bg-emerald-500",
                        ],
                        [
                          "In progress",
                          manager.summary.partialItems,
                          "bg-blue-500",
                        ],
                        [
                          "Not started",
                          manager.summary.untouchedItems,
                          "bg-rose-500",
                        ],
                      ].map(([label, value, color]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="flex items-center gap-2 text-slate-500">
                            <span className={`h-2 w-2 rounded-full ${color}`} />
                            {label}
                          </span>
                          <span className="font-bold text-slate-800">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>

                <article className="print-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_-25px_rgba(15,23,42,0.35)] xl:col-span-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Company workload
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Highest pending quantity first
                      </p>
                    </div>
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="mt-4 space-y-3.5">
                    {companyRanking.map((company) => {
                      const maxPending = Math.max(
                        1,
                        ...companyRanking.map((entry) => entry.totalPending),
                      );
                      return (
                        <div key={company.company}>
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                            <span className="truncate font-medium text-slate-700">
                              {company.company}
                            </span>
                            <span className="shrink-0 font-bold text-slate-900">
                              {company.totalPending.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                              style={{
                                width: `${(company.totalPending / maxPending) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              </div>
            )}
          </section>
        )}

        {/* Filters Section */}
        {data.length > 0 && (
          <section className="no-print mb-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_40px_-25px_rgba(15,23,42,0.35)] animate-fadeInUp">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Filters
                    </h3>
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {activeFilterCount} active
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    Clear filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFilters((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {showFilters ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  {showFilters ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                  <div className="sm:col-span-2 xl:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Search records
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        placeholder="PO, drawing, code, description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 pl-9 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  <div className="xl:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Company
                    </label>
                    {isAdmin ? (
                      <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      >
                        {companies.map((company) => (
                          <option key={company} value={company}>
                            {company === "all" ? "All companies" : company}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-800">
                        {clientCompany || "No company assigned"}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category === "all" ? "All categories" : category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </label>
                    {isAdmin ? (
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      >
                        <option value="all">All statuses</option>
                        <option value="pending">Open (all)</option>
                        <option value="not_started">Not started</option>
                        <option value="partial">Partially dispatched</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On hold</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <div className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-800">
                        Pending only
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Min pending
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={maxPending || undefined}
                      value={minPending}
                      onChange={(e) => setMinPending(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Max pending
                    </label>
                    <input
                      type="number"
                      min={minPending || "0"}
                      value={maxPending}
                      onChange={(e) => setMaxPending(e.target.value)}
                      placeholder="Any"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div className="sm:col-span-1 xl:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      PO date from
                    </label>
                    <input
                      type="date"
                      value={dateRange.start}
                      max={dateRange.end || undefined}
                      onChange={(e) =>
                        setDateRange((current) => ({
                          ...current,
                          start: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div className="sm:col-span-1 xl:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      PO date to
                    </label>
                    <input
                      type="date"
                      value={dateRange.end}
                      min={dateRange.start || undefined}
                      onChange={(e) =>
                        setDateRange((current) => ({
                          ...current,
                          end: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Main Data Table - Accordion View */}
        {isLoading ? (
          <div className="rounded-3xl border border-blue-100 bg-white p-12 text-center shadow-xl shadow-blue-900/5">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50">
              <RefreshCw className="h-7 w-7 animate-spin text-blue-600" />
            </div>
            <p className="mt-5 font-semibold text-slate-800">
              Loading your PO workspace
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Reading saved purchase orders and dispatch history...
            </p>
          </div>
        ) : loadError && !isDataReady ? (
          <section
            className="rounded-3xl border border-rose-200 bg-white px-5 py-14 text-center shadow-xl shadow-rose-900/5"
            role="alert"
          >
            <CircleAlert className="mx-auto h-12 w-12 text-rose-500" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Purchase orders could not be loaded
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => void loadPurchaseOrders()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </section>
        ) : data.length > 0 ? (
          <section className="print-card overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] animate-fadeInUp">
            {/* Always-merged list header */}
            <div className="no-print flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Pending items by company
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {filteredCompanyCount} companies · {sortedData.length}{" "}
                    merged items · {filteredData.length} source PO lines
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {isAdmin
                    ? "Expand a company to work on its items. Use Dispatch for one item, Queue for multiple items, and More for rejection or PO maintenance."
                    : "Expand your company to review pending purchase orders. Client access is read-only."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isAdmin && (
                  <>
                    <div className="hidden xl:flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500 ring-1 ring-inset ring-slate-200">
                      <Info className="h-3.5 w-3.5 text-blue-600" />
                      Use <strong className="text-blue-700">
                        Dispatch
                      </strong>{" "}
                      for one item or{" "}
                      <strong className="text-emerald-700">Queue</strong> for
                      multiple items.
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setIsQueuePanelOpen((current) => !current)
                        }
                        disabled={queueItems.length === 0}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        title={
                          queueItems.length > 0
                            ? `${isQueuePanelOpen ? "Hide" : "Review"} ${queueItems.length} queued dispatch item(s)`
                            : "Add items to the dispatch queue from the Action column"
                        }
                      >
                        <ListChecks className="h-3.5 w-3.5" />
                        {isQueuePanelOpen ? "Hide Queue" : "Review Queue"} (
                        {queueItems.length})
                      </button>
                      {queueItems.length > 0 && (
                        <button
                          type="button"
                          onClick={clearDispatchQueue}
                          className="rounded-lg px-2.5 py-2 text-[11px] font-semibold text-emerald-700 transition hover:bg-white"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {selectedRows.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                          <Check className="h-3.5 w-3.5" />
                          {`${selectedExportRows.length} merged item${selectedExportRows.length === 1 ? "" : "s"} (${selectedRows.length} PO lines)`}
                          <button
                            type="button"
                            onClick={() =>
                              exportRows(selectedExportRows, "selected")
                            }
                            className="ml-1 inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] shadow-sm transition hover:text-blue-900"
                          >
                            <FileDown className="h-3 w-3" /> Export
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedItems(new Set())}
                            className="rounded-md p-1 transition hover:bg-white"
                            aria-label="Clear selected records"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={openMultipleDispatchModal}
                          disabled={dispatchableSelectedRows.length === 0}
                          title={
                            dispatchableSelectedRows.length === 0
                              ? "Selected rows are completed, on hold, cancelled, or missing an id"
                              : `Dispatch ${dispatchableSelectedRows.length} eligible item(s)`
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                          <Layers className="h-3.5 w-3.5" />
                          Dispatch Selected ({dispatchableSelectedRows.length})
                        </button>
                      </>
                    )}
                  </>
                )}
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:bg-white hover:text-blue-700"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    Expand page
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:bg-white hover:text-blue-700"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                    Collapse all
                  </button>
                </div>

                <div className="flex items-center rounded-xl bg-slate-100 p-1">
                  <label htmlFor="pending-list-sort" className="sr-only">
                    Sort purchase orders
                  </label>
                  <select
                    id="pending-list-sort"
                    value={sortConfig.key}
                    onChange={(event) =>
                      setSortConfig((current) => ({
                        ...current,
                        key: event.target.value,
                      }))
                    }
                    className="rounded-lg border-0 bg-transparent px-2 py-1.5 text-xs font-semibold text-slate-600 outline-none"
                  >
                    <option value="deliveryDate">Delivery date</option>
                    <option value="poDate">PO date</option>
                    <option value="company">Company</option>
                    <option value="po">PO number</option>
                    <option value="pending">Pending quantity</option>
                    <option value="total">Pending value</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSort(sortConfig.key)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
                    aria-label={`Sort ${sortConfig.direction === "asc" ? "Newest first" : "Oldest first"}`}
                  >
                    {React.createElement(getSortIcon(sortConfig.key), {
                      className: "h-3.5 w-3.5",
                    })}
                    {sortConfig.direction === "asc"
                      ? "Oldest first"
                      : "Newest first"}
                  </button>
                </div>
              </div>
            </div>

            {isAdmin && isQueuePanelOpen && queueItems.length > 0 && (
              <div className="no-print border-b border-emerald-100 bg-emerald-50/60 px-4 py-4 sm:px-5">
                <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-emerald-100 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
                        <ShoppingCart className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">
                            Dispatch Queue
                          </p>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            {queueItems.length} item
                            {queueItems.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600">
                          Keep browsing below and add more items. Nothing is
                          dispatched until you click{" "}
                          <strong>Dispatch Multiple</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsQueuePanelOpen(false)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Continue adding items
                      </button>
                      <button
                        type="button"
                        onClick={clearDispatchQueue}
                        className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Clear Queue
                      </button>
                      <button
                        type="button"
                        onClick={openDispatchQueue}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Dispatch Multiple
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
                    {queueItems.map((item) => {
                      const key = getItemKey(item);
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700">
                                PO {item.po || "—"}
                              </span>
                              <span className="truncate text-xs font-bold text-slate-800">
                                {item.itemCode || item.item || "Unnamed item"}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-[10px] text-slate-500">
                              {item.company || "Unknown company"} · Pending{" "}
                              <strong className="text-rose-600">
                                {Number(item.pending || 0).toLocaleString(
                                  "en-IN",
                                )}
                              </strong>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeQueueItem(key)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Remove from queue"
                            aria-label={`Remove ${item.po || "item"} from queue`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Accordion View */}
            <div className="p-4 bg-gray-50">
              {companyList.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No companies found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {companyList.map((company) => (
                    <CompanyAccordion
                      key={company}
                      company={company}
                      items={groupedByCompany[company]}
                      isExpanded={expandedCompanies.has(company)}
                      onToggle={() => toggleCompany(company)}
                      selectedItems={selectedItems}
                      onToggleSelection={toggleItemSelection}
                      onSetSelection={setItemsSelection}
                      onDispatchClick={handleDispatchClick}
                      onQueueToggle={toggleDispatchQueue}
                      queueItemKeys={dispatchQueue}
                      onRejectionClick={handleRejectionClick}
                      onEditClick={handleEditClick}
                      onDeleteClick={handleDeleteClick}
                      onViewClick={handleViewClick}
                      isAdmin={isAdmin}
                      dispatchHistory={dispatchHistory}
                      getCompletionPercentage={getCompletionPercentage}
                      getRiskMeta={getRiskMeta}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      getItemKey={getItemKey}
                      pageSize={pageSize}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span>
                  Showing{" "}
                  <strong className="text-slate-800">
                    all {sortedData.length}
                  </strong>{" "}
                  merged items across{" "}
                  <strong className="text-slate-800">
                    {filteredCompanyCount}
                  </strong>{" "}
                  companies ({filteredData.length} source PO lines)
                </span>
                {filteredManager && (
                  <>
                    <span>
                      Pending{" "}
                      <strong className="text-rose-600">
                        {filteredManager.summary.totalPending.toLocaleString(
                          "en-IN",
                        )}
                      </strong>
                    </span>
                    <span>
                      Outstanding{" "}
                      <strong className="text-slate-800">
                        {formatCurrency(filteredManager.summary.totalValue)}
                      </strong>
                    </span>
                  </>
                )}
                <span>
                  {
                    companyList.filter((company) =>
                      expandedCompanies.has(company),
                    ).length
                  }{" "}
                  visible companies expanded
                </span>
              </div>

              <div className="no-print flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  Rows per expanded company
                  <select
                    value={pageSize}
                    onChange={(event) =>
                      setPageSize(Number(event.target.value))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                  >
                    {[10, 15, 25, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>

                <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  {filteredCompanyCount} compan
                  {filteredCompanyCount === 1 ? "y" : "ies"} visible
                </span>
              </div>
            </div>
          </section>
        ) : (
          <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white px-5 py-14 text-center shadow-[0_24px_70px_-40px_rgba(30,64,175,0.5)] animate-fadeInUp sm:py-20">
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-blue-100/80 blur-3xl" />
            <div className="relative mx-auto max-w-xl">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/25">
                <FileSpreadsheet className="h-9 w-9" />
              </div>

              <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Start with your source file
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {isAdmin
                  ? "Turn your pending PO sheet into an operating dashboard"
                  : "No pending purchase orders to display"}
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                {isAdmin
                  ? "Select an Excel file, review every row, edit or delete unwanted data, and confirm only when it is ready."
                  : "Client accounts can only view pending purchase orders assigned to their own company."}
              </p>

              {isAdmin ? (
                <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
                  <label
                    htmlFor="file-upload"
                    className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 ${isPreparingImport || isConfirmingImport ? "pointer-events-none cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    {isPreparingImport ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isPreparingImport
                      ? "Preparing preview..."
                      : "Choose Excel file"}
                  </label>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                  >
                    <FileDown className="h-4 w-4" />
                    Download template
                  </button>
                </div>
              ) : (
                <p className="mt-6 text-sm font-semibold text-slate-600">
                  {clientCompany
                    ? `No pending purchase orders are available for ${clientCompany}.`
                    : "Your account does not have a company assigned."}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> .xlsx and
                  .xls
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Saved to
                  your database
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Instant
                  analytics
                </span>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
};
export default GeneratePendingList;
