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

const listPage = async ({
  page = 1,
  limit = 500,
  all = false,
  includeHistory = true,
  signal,
} = {}) => {
  const response = await request({
    method: "get",
    url: "/po",
    params: {
      page,
      limit,
      all: all ? "true" : "false",
      includeHistory: includeHistory ? "true" : "false",
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    signal,
  });

  return response.data;
};

export const createDispatchRequestId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `dispatch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const getApiErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

export const pendingPoApi = {
  async listAll({
    signal,
    all = true,
    page = 1,
    limit = 500,
    includeHistory = true,
  } = {}) {
    const first = await listPage({
      page,
      limit,
      all,
      includeHistory,
      signal,
    });

    const firstRecords = Array.isArray(first?.data) ? first.data : [];
    const pagination = first?.pagination || null;

    const backendConfirmedAll =
      pagination?.all === true || pagination?.all === "true";

    if (all && backendConfirmedAll) {
      return {
        records: firstRecords,
        summary: first?.summary || null,
        pagination: {
          ...pagination,
          returned: firstRecords.length,
          all: true,
        },
      };
    }

    if (!all) {
      return {
        records: firstRecords,
        summary: first?.summary || null,
        pagination:
          pagination || {
            page,
            limit,
            total: firstRecords.length,
            pages: 1,
            returned: firstRecords.length,
            all: false,
          },
      };
    }

    // Older-backend fallback: never assume the first page is the whole DB.
    if (!pagination) {
      throw new Error(
        "Pending PO API did not return pagination metadata. " +
          "Cannot safely confirm that all companies were loaded.",
      );
    }

    const total = Math.max(
      0,
      Number(pagination.total ?? pagination.totalItems ?? firstRecords.length) ||
        0,
    );

    const pageSize = Math.max(1, Number(pagination.limit || limit) || limit);

    const totalPages = Math.max(
      1,
      Number(
        pagination.pages ||
          pagination.totalPages ||
          Math.ceil(total / pageSize),
      ) || 1,
    );

    const records = [...firstRecords];

    for (let start = 2; start <= totalPages; start += 4) {
      const pageNumbers = Array.from(
        { length: Math.min(4, totalPages - start + 1) },
        (_, index) => start + index,
      );

      const responses = await Promise.all(
        pageNumbers.map((pageNumber) =>
          listPage({
            page: pageNumber,
            limit: pageSize,
            all: false,
            includeHistory,
            signal,
          }),
        ),
      );

      responses.forEach((result) => {
        if (Array.isArray(result?.data)) {
          records.push(...result.data);
        }
      });
    }

    return {
      records,
      summary: first?.summary || null,
      pagination: {
        ...pagination,
        page: 1,
        limit: pageSize,
        total: total || records.length,
        pages: totalPages,
        returned: records.length,
        all: records.length >= total,
      },
    };
  },

  async importFile(file, { signal } = {}) {
    const form = new FormData();
    form.append("file", file);

    const response = await request({
      method: "post",
      url: "/po/import",
      data: form,
      signal,
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
