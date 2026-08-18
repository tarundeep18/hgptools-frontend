export const toQty = (value) => {
  const number = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

export const calculatePOBalance = ({
  poQty = 0,
  dispatched = 0,
  rejected = 0,
} = {}) => {
  const ordered = toQty(poQty);
  const grossDispatched = toQty(dispatched);
  const effectiveRejected = Math.min(toQty(rejected), grossDispatched);
  const netAccepted = Math.max(0, grossDispatched - effectiveRejected);
  const fulfilled = Math.min(ordered, netAccepted);
  const pending = Math.max(0, ordered - fulfilled);

  return {
    poQty: ordered,
    dispatched: grossDispatched,
    rejected: effectiveRejected,
    accepted: netAccepted,
    fulfilled,
    pending,
  };
};

export const buildRejectionSummaryMap = (summary = []) => {
  const map = new Map();
  (summary || []).forEach((entry) => {
    const poId = String(entry?.poId || entry?._id || "").trim();
    if (!poId) return;
    map.set(poId, {
      rejected: toQty(entry?.rejectedQuantity ?? entry?.rejectedQty),
      rejectionCount: toQty(entry?.rejectionCount),
    });
  });
  return map;
};

export const attachRejectionSummary = (record, summaryMap) => {
  const id = String(record?._id || record?.id || "").trim();
  const summary = summaryMap?.get(id) || { rejected: 0, rejectionCount: 0 };
  return {
    ...record,
    rejected: summary.rejected,
    rejectedQty: summary.rejected,
    rejectionCount: summary.rejectionCount,
  };
};
