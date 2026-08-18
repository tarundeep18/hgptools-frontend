import axios from "axios";

const API_BASE =
  import.meta.env.VITE_REACT_APP_BACKEND_BASEURL ||
  "http://localhost:5000/api/v1";

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 30000,
});

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

export const rejectionApi = {
  async list(params = {}) {
    const response = await client.get("/pending-po/rejections", { params });
    return unwrap(response);
  },

  async getSummary({ signal } = {}) {
    const response = await client.get("/pending-po/rejections/summary", {
      signal,
    });
    return unwrap(response);
  },

  async create(payload) {
    if (!payload?.poId) throw new Error("poId is required");
    const response = await client.post(
      `/pending-po/${encodeURIComponent(payload.poId)}/rejections`,
      payload,
    );
    return unwrap(response);
  },

  async review(rejectionId, payload) {
    if (!rejectionId) throw new Error("rejectionId is required");
    const response = await client.put(
      `/pending-po/rejections/${encodeURIComponent(rejectionId)}/review`,
      payload,
    );
    return unwrap(response);
  },

  async importExcelRows(rows, { fileName = "" } = {}) {
    const payloadRows = (rows || [])
      .map((row) => ({
        poNumber: String(row?.po ?? row?.poNumber ?? "").trim(),
        companyName: String(row?.company ?? row?.companyName ?? "").trim(),
        itemCode: String(row?.itemCode ?? "").trim(),
        drawing: String(row?.drawing ?? "").trim(),
        description: String(row?.item ?? row?.description ?? "").trim(),
        rejectedQuantity: Number(row?.rejectedQty ?? row?.rejectedQuantity ?? 0),
        rejectionReason: String(
          row?.rejectionReason ?? row?.reason ?? "Excel import",
        ).trim(),
        rejectionDate: row?.rejectionDate || null,
        sourceRowNumber: row?._sourceRowNumber ?? null,
      }))
      .filter((row) => Number.isFinite(row.rejectedQuantity) && row.rejectedQuantity > 0);

    if (payloadRows.length === 0) {
      return { imported: 0, updated: 0, skipped: 0, rows: [] };
    }

    const response = await client.post("/pending-po/rejections/import", {
      fileName,
      rows: payloadRows,
    });
    return unwrap(response);
  },
};

export const getApiErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export default rejectionApi;
