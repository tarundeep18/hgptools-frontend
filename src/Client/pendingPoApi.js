import axios from "axios";

const API_ROOT = (
  import.meta.env.VITE_REACT_APP_BACKEND_BASEURL ||
  "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

const request = async (config) => {
  const response = await axios({
    ...config,
    url: `${API_ROOT}${config.url}`,
    withCredentials: true,
  });

  if (response.data?.success === false) {
    throw new Error(response.data.message || "The request failed");
  }
  return response;
};

const listPage = async (page, limit, signal) => {
  const response = await request({
    method: "get",
    url: "/po",
    params: {
      page,
      limit,
      includeHistory: true,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    signal,
  });
  return response.data;
};

export const createDispatchRequestId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `dispatch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const getApiErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export const pendingPoApi = {
  async listAll({ signal } = {}) {
    const pageSize = 500;
    const first = await listPage(1, pageSize, signal);
    const pages = Math.max(1, Number(first.pagination?.pages) || 1);
    const records = [...(first.data || [])];

    // Load the remaining pages in small batches to keep large portfolios fast
    // without opening an unbounded number of HTTP requests.
    for (let start = 2; start <= pages; start += 4) {
      const pageNumbers = Array.from(
        { length: Math.min(4, pages - start + 1) },
        (_, index) => start + index,
      );
      const responses = await Promise.all(
        pageNumbers.map((page) => listPage(page, pageSize, signal)),
      );
      responses.forEach((result) => records.push(...(result.data || [])));
    }

    return {
      records,
      summary: first.summary || null,
      pagination: first.pagination || {
        page: 1,
        limit: pageSize,
        total: records.length,
        pages,
      },
    };
  },

  async importFile(file) {
    const form = new FormData();
    form.append("file", file);
    const response = await request({
      method: "post",
      url: "/po/import",
      data: form,
    });
    return response.data.data;
  },

  async createDispatch(payload) {
    const response = await request({
      method: "post",
      url: "/dispatch",
      data: payload,
    });
    return response.data.data;
  },

  async createBulkDispatch(payload) {
    const response = await request({
      method: "post",
      url: "/dispatch/bulk",
      data: payload,
    });
    return response.data.data;
  },

  async getDispatchHistory(poId) {
    const response = await request({
      method: "get",
      url: `/dispatch/history/${encodeURIComponent(poId)}`,
    });
    return response.data.data || [];
  },

  async getBillDetails(billNumber) {
    const response = await request({
      method: "get",
      url: `/dispatch/bill/${encodeURIComponent(billNumber)}`,
    });
    return response.data.data;
  },

  async downloadTemplate() {
    const response = await request({
      method: "get",
      url: "/po/template",
      responseType: "blob",
    });
    const disposition = response.headers?.["content-disposition"] || "";
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = match?.[1] || "pending-po-template.xlsx";
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return filename;
  },
};
