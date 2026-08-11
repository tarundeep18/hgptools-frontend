import axios from "axios";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  FileText,
  X,
  Filter,
  Download,
  Share2,
  Archive,
  Trash2,
  ChevronDown,
  HardDrive,
  User,
  FileUp,
  RefreshCw,
  Eye,
  Edit,
  Image,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FaFilePdf, FaFileImage, FaFileAlt } from "react-icons/fa";
import { useOutletContext } from "react-router-dom";

// API Configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_BACKEND_BASEURL,
  withCredentials: true,
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      toast.error("Request timeout. Please try again.");
    } else if (!error.response) {
      toast.error("Network error. Please check your connection.");
    }
    return Promise.reject(error);
  },
);

const DrawingManagement = () => {
  const { darkMode } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [currentDrawing, setCurrentDrawing] = useState({});
  const [drawings, setDrawings] = useState([]);
  const [viewDrawing, setViewDrawing] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [search, setSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [activeTab, setActiveTab] = useState("All Docs");
  const [showFilters, setShowFilters] = useState(false);
  const [deleteType, setDeleteType] = useState("soft");
  const [totalArchieve, setTotalArchieve] = useState([]);

  const [filters, setFilters] = useState({
    status: "",
    access: "",
    jobOrder: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [stats, setStats] = useState({
    total: 0,
    archived: 0,
    active: 0,
  });

  const tabs = useMemo(
    () => [
      { id: "All Docs", label: "All Documents", count: stats.total },
      { id: "Active", label: "Active", count: stats.active },
      { id: "Archived", label: "Archived", count: stats.archived },
      { id: "My Docs", label: "My Documents", count: 0 },
    ],
    [stats],
  );

  // Fetch drawings with filters
  const fetchDrawings = useCallback(
    async (page = pagination.page) => {
      setLoading(true);

      try {
        const params = {
          page,
          limit: pagination.limit,
          ...(search && { search }),
          ...filters,
        };

        // Tab based filter
        if (activeTab === "Archived") {
          params.isDeleted = true;
        }

        if (activeTab === "Active") {
          params.isDeleted = false;
        }

        const response = await api.get("/drawings", { params });

        if (response.data.success) {
          setDrawings(response.data.data);
          setPagination(response.data.pagination);

          // use backend stats
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error("Error fetching drawings:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch drawings",
        );
      } finally {
        setLoading(false);
      }
    },
    [search, filters, activeTab, pagination.limit],
  );

  // Debounced search
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    setSearchTimeout(
      setTimeout(() => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        fetchDrawings(1);
      }, 500),
    );
  };

  // Create drawing
  const createDrawing = async (drawingData) => {
    setActionLoading(true);
    try {
      const formData = new FormData();
      Object.keys(drawingData).forEach((key) => {
        if (drawingData[key] && key !== "file") {
          formData.append(key, drawingData[key]);
        }
      });

      if (selectedFile) {
        formData.append("drawing", selectedFile);
      }

      const response = await api.post("/drawings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success("Drawing uploaded successfully!");
        await fetchDrawings(1);
        closeModal();
      }
    } catch (error) {
      console.error("Error creating drawing:", error);
      toast.error(error.response?.data?.message || "Failed to upload drawing");
    } finally {
      setActionLoading(false);
    }
  };

  // Update drawing
  const updateDrawing = async (drawingData) => {
    setActionLoading(true);
    try {
      const formData = new FormData();
      Object.keys(drawingData).forEach((key) => {
        if (drawingData[key] && key !== "_id" && key !== "file") {
          formData.append(key, drawingData[key]);
        }
      });

      if (selectedFile) {
        formData.append("drawing", selectedFile);
      }

      const response = await api.put(`/drawings/${drawingData._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success("Drawing updated successfully!");
        await fetchDrawings(pagination.page);
        closeModal();
      }
    } catch (error) {
      console.error("Error updating drawing:", error);
      toast.error(error.response?.data?.message || "Failed to update drawing");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete drawing (soft delete)
  const deleteDrawing = async (id) => {
    setActionLoading(true);
    try {
      const response = await api.delete(`/drawings/${id}`);

      if (response.data.success) {
        toast.success("Drawing moved to archive successfully!");
        await fetchDrawings(pagination.page);
        closeModal();
      }
    } catch (error) {
      console.error("Error deleting drawing:", error);
      toast.error(error.response?.data?.message || "Failed to delete drawing");
    } finally {
      setActionLoading(false);
    }
  };

  // Permanent delete drawing
  const permanentDeleteDrawing = async (id) => {
    setActionLoading(true);
    try {
      const response = await api.delete(`/drawings/${id}/permanent`);

      if (response.data.success) {
        toast.success("Drawing permanently deleted!");
        await fetchDrawings(pagination.page);
        closeModal();
      }
    } catch (error) {
      console.error("Error permanently deleting drawing:", error);
      toast.error(
        error.response?.data?.message || "Failed to permanently delete drawing",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Restore drawing from archive
  const restoreDrawing = async (id) => {
    setActionLoading(true);
    try {
      const response = await api.post(`/drawings/${id}/restore`);

      if (response.data.success) {
        toast.success("Drawing restored successfully!");
        await fetchDrawings(pagination.page);
      }
    } catch (error) {
      console.error("Error restoring drawing:", error);
      toast.error(error.response?.data?.message || "Failed to restore drawing");
    } finally {
      setActionLoading(false);
    }
  };

  // Download drawing
  const downloadDrawing = async (id, fileName) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/drawings/${id}/download`,
        {
          responseType: "blob",
          withCredentials: true,
        },
      );

      // Create blob with correct type
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      // ensure correct file name
      link.download = fileName || "drawing";

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading drawing:", error);
    }
  };

  // Get single drawing by ID
  const fetchDrawingById = async (id) => {
    setActionLoading(true);
    try {
      const response = await api.get(`/drawings/${id}`);

      if (response.data.success) {
        setViewDrawing(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching drawing details:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch drawing details",
      );
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchDrawings(1);
  }, [fetchDrawings]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/drawings/stats`,
        {
          withCredentials: true,
        },
      );

      setStats(res.data);
      console.log("stats data", res.data);
      setTotalArchieve(res.data.archived);
      console.log("archieve data", res.data.archived);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const openModal = (
    mode,
    drawing = {
      _id: "",
      name: "",
      version: "",
      access: "Production",
      jobOrder: "",
      description: "",
      tags: "",
    },
  ) => {
    setModalMode(mode);
    setCurrentDrawing(drawing);
    setSelectedFile(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentDrawing({});
    setViewDrawing(null);
    setSelectedFile(null);
    setDeleteType("soft");
  };

  const handleDelete = () => {
    if (currentDrawing._id) {
      if (deleteType === "soft") {
        deleteDrawing(currentDrawing._id);
      } else {
        permanentDeleteDrawing(currentDrawing._id);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }

      // Validate file type
      const allowedTypes = [".pdf", ".dwg", ".dxf", ".jpg", ".jpeg", ".png"];
      const fileExt = "." + file.name.split(".").pop().toLowerCase();
      if (!allowedTypes.includes(fileExt)) {
        toast.error("Invalid file type. Allowed: PDF, DWG, DXF, JPG, PNG");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === "add") {
      createDrawing(currentDrawing);
    } else if (modalMode === "edit") {
      updateDrawing(currentDrawing);
    }
  };

  const openViewModal = (drawing) => {
    fetchDrawingById(drawing._id);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDocs(drawings.map((doc) => doc._id));
    } else {
      setSelectedDocs([]);
    }
  };

  const handleSelectDoc = (id) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id],
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedDocs.length === 0) return;

    setActionLoading(true);
    try {
      if (action === "restore") {
        await Promise.all(selectedDocs.map((id) => restoreDrawing(id)));
        toast.success(`${selectedDocs.length} drawings restored successfully!`);
      } else if (action === "delete") {
        await Promise.all(selectedDocs.map((id) => deleteDrawing(id)));
        toast.success(`${selectedDocs.length} drawings archived successfully!`);
      }
      setSelectedDocs([]);
      await fetchDrawings(pagination.page);
    } catch (error) {
      toast.error(`Failed to ${action} drawings`);
    } finally {
      setActionLoading(false);
    }
  };

  const getFileIcon = (type) => {
    switch (type?.toUpperCase()) {
      case "PDF":
        return <FaFilePdf className="text-red-500" size={24} />;
      case "DWG":
      case "DXF":
        return <FaFileImage className="text-orange-500" size={24} />;
      case "JPG":
      case "JPEG":
      case "PNG":
        return <Image className="text-blue-500" size={24} />;
      default:
        return <FaFilePdf className="text-red-500" size={24} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div
      className={`${darkMode ? "bg-gray-800" : "bg-white"} p-4 rounded-lg border ${darkMode ? "border-gray-700" : "border-gray-200"} flex items-center gap-3`}
    >
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          {label}
        </p>
        <p
          className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
        >
          {value}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} p-6`}
    >
      {/* Loading Overlay */}
      {actionLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={24} />
            <span className="text-gray-900 dark:text-white">Processing...</span>
          </div>
        </div>
      )}

      <div
        className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"} overflow-hidden`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1
                className={`text-2xl md:text-3xl font-bold tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Drawing Management
              </h1>
              <p
                className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Manage and organize your technical drawings
              </p>
            </div>

            <button
              onClick={() => openModal("add")}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              Upload Drawing
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
          <StatCard
            icon={FileText}
            label="Total Drawings"
            value={pagination.total}
            color="bg-blue-600"
          />

          <StatCard
            icon={Archive}
            label="Archived"
            value={totalArchieve}
            color="bg-orange-600"
          />
        </div>

        {/* Tabs and Actions */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? darkMode
                        ? "text-blue-400 bg-gray-700"
                        : "text-blue-600 bg-blue-50"
                      : darkMode
                        ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id
                        ? darkMode
                          ? "bg-blue-900 text-blue-300"
                          : "bg-blue-100 text-blue-600"
                        : darkMode
                          ? "bg-gray-700 text-gray-400"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {selectedDocs.length > 0 && (
              <div
                className={`flex items-center gap-2 ${darkMode ? "bg-gray-700" : "bg-gray-50"} px-3 py-1.5 rounded-lg`}
              >
                <span
                  className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  {selectedDocs.length} selected
                </span>
                <button
                  onClick={() => setSelectedDocs([])}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  disabled={actionLoading}
                >
                  <X
                    size={16}
                    className={darkMode ? "text-gray-400" : "text-gray-600"}
                  />
                </button>
                <button
                  onClick={() =>
                    window.navigator.share?.({
                      title: "Share Drawings",
                      text: `Sharing ${selectedDocs.length} drawings`,
                    })
                  }
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  disabled={actionLoading}
                >
                  <Share2
                    size={16}
                    className={darkMode ? "text-gray-400" : "text-gray-600"}
                  />
                </button>
                {activeTab === "Archived" ? (
                  <button
                    onClick={() => handleBulkAction("restore")}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    disabled={actionLoading}
                  >
                    <RefreshCw size={16} className="text-green-600" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleBulkAction("delete")}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    disabled={actionLoading}
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                size={18}
                className={`absolute left-3 top-2.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}
              />
              <input
                type="text"
                placeholder="Search drawings by name, ID, or author..."
                value={search}
                onChange={handleSearchChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-200 text-gray-900"
                }`}
                disabled={actionLoading}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${
                darkMode ? "border-gray-600 text-gray-300" : "border-gray-200"
              }`}
              disabled={actionLoading}
            >
              <Filter size={16} />
              Filters
              <ChevronDown size={16} />
            </button>
          </div>

          {showFilters && (
            <div
              className={`mt-4 p-4 ${darkMode ? "bg-gray-700" : "bg-gray-50"} rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4`}
            >
              <div>
                <label
                  className={`block text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                >
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value });
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                    darkMode
                      ? "bg-gray-600 border-gray-500 text-white"
                      : "bg-white border-gray-200"
                  }`}
                  disabled={actionLoading}
                >
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div>
                <label
                  className={`block text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                >
                  Access Level
                </label>
                <select
                  value={filters.access}
                  onChange={(e) => {
                    setFilters({ ...filters, access: e.target.value });
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                    darkMode
                      ? "bg-gray-600 border-gray-500 text-white"
                      : "bg-white border-gray-200"
                  }`}
                  disabled={actionLoading}
                >
                  <option value="">All</option>
                  <option value="Production">Production</option>
                  <option value="Management">Management</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div>
                <label
                  className={`block text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                >
                  Job Order
                </label>
                <input
                  type="text"
                  placeholder="JOB-000"
                  value={filters.jobOrder}
                  onChange={(e) => {
                    setFilters({ ...filters, jobOrder: e.target.value });
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                    darkMode
                      ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                      : "bg-white border-gray-200"
                  }`}
                  disabled={actionLoading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin h-12 w-12 text-blue-800" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <tr>
                  <th className="py-3 px-6 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-gray-600"
                      checked={
                        selectedDocs.length === drawings.length &&
                        drawings.length > 0
                      }
                      onChange={handleSelectAll}
                      disabled={actionLoading || drawings.length === 0}
                    />
                  </th>
                  <th
                    className={`py-3 px-2 text-left text-xs uppercase font-bold ${darkMode ? "text-gray-300" : "text-gray-500"}`}
                  >
                    Drawing
                  </th>
                  <th
                    className={`py-3 px-2 text-left text-xs uppercase font-bold ${darkMode ? "text-gray-300" : "text-gray-500"}`}
                  >
                    ID
                  </th>
                  <th
                    className={`py-3 px-2 text-left text-xs uppercase font-bold ${darkMode ? "text-gray-300" : "text-gray-500"}`}
                  >
                    Version
                  </th>
                  <th
                    className={`py-3 px-2 text-left text-xs uppercase font-bold ${darkMode ? "text-gray-300" : "text-gray-500"}`}
                  >
                    Access
                  </th>
                  <th
                    className={`py-3 px-2 text-left text-xs uppercase font-bold ${darkMode ? "text-gray-300" : "text-gray-500"}`}
                  >
                    Job Order
                  </th>
                  <th
                    className={`py-3 px-2 text-left text-xs uppercase font-bold ${darkMode ? "text-gray-300" : "text-gray-500"}`}
                  >
                    Created
                  </th>

                  <th
                    className={`py-3 px-2 text-left text-xs uppercase font-bold ${darkMode ? "text-gray-300" : "text-gray-500"}`}
                  >
                    Status
                  </th>
                  <th
                    className={`py-3 px-2 text-left text-xs uppercase font-bold ${darkMode ? "text-gray-300" : "text-gray-500"}`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}
              >
                {drawings.length > 0 ? (
                  drawings.map((drawing) => (
                    <tr
                      key={drawing._id}
                      className={`transition-colors ${
                        selectedDocs.includes(drawing._id)
                          ? darkMode
                            ? "bg-blue-900/20"
                            : "bg-blue-50"
                          : darkMode
                            ? "hover:bg-gray-700/40"
                            : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-3 px-6">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 dark:border-gray-600"
                          checked={selectedDocs.includes(drawing._id)}
                          onChange={() => handleSelectDoc(drawing._id)}
                          disabled={actionLoading}
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg">
                            {getFileIcon(drawing.fileType)}
                          </div>
                          <div>
                            <span
                              className={`font-medium block ${darkMode ? "text-white" : "text-gray-900"}`}
                            >
                              {drawing.name}
                            </span>
                            <span
                              className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                            >
                              {drawing.fileType}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`py-3 px-2 font-mono text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {drawing.drawingId}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-1 text-xs ${
                            darkMode
                              ? "bg-blue-900 text-blue-300"
                              : "bg-blue-100 text-blue-700"
                          } rounded-full font-medium`}
                        >
                          {drawing.version}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            drawing.access === "Production"
                              ? darkMode
                                ? "bg-green-900 text-green-300"
                                : "bg-green-100 text-green-700"
                              : darkMode
                                ? "bg-purple-900 text-purple-300"
                                : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {drawing.access}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {drawing.jobOrder}
                      </td>
                      <td
                        className={`py-3 px-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {formatDate(drawing.createdAt)}
                      </td>

                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            drawing.status === "Active"
                              ? darkMode
                                ? "bg-green-900 text-green-300"
                                : "bg-green-100 text-green-700"
                              : darkMode
                                ? "bg-gray-600 text-gray-300"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {drawing.status || "Active"}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openViewModal(drawing)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              darkMode
                                ? "hover:bg-gray-600 text-gray-400"
                                : "hover:bg-gray-200 text-gray-600"
                            }`}
                            title="View Details"
                            disabled={actionLoading}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              const extension = drawing.drawing
                                ?.split(".")
                                .pop(); // pdf
                              downloadDrawing(
                                drawing._id,
                                `${drawing.drawingId}_${drawing.name}.${extension}`,
                              );
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              darkMode
                                ? "hover:bg-gray-600 text-gray-400"
                                : "hover:bg-gray-200 text-gray-600"
                            }`}
                            title="Download"
                            disabled={actionLoading}
                          >
                            <Download size={16} />
                          </button>
                          {drawing.status === "Archived" ? (
                            <button
                              onClick={() => restoreDrawing(drawing._id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                darkMode
                                  ? "hover:bg-gray-600 text-green-400"
                                  : "hover:bg-gray-200 text-green-600"
                              }`}
                              title="Restore"
                              disabled={actionLoading}
                            >
                              <RefreshCw size={16} />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openModal("edit", drawing)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  darkMode
                                    ? "hover:bg-gray-600 text-indigo-400"
                                    : "hover:bg-gray-200 text-indigo-600"
                                }`}
                                title="Edit"
                                disabled={actionLoading}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteType("soft");
                                  openModal("delete", drawing);
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  darkMode
                                    ? "hover:bg-gray-600 text-red-400"
                                    : "hover:bg-gray-200 text-red-600"
                                }`}
                                title="Archive"
                                disabled={actionLoading}
                              >
                                <Archive size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="10"
                      className={`py-20 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle size={48} className="text-gray-400" />
                        <p className="text-lg font-medium">No drawings found</p>
                        <p className="text-sm">
                          Upload your first drawing to get started
                        </p>
                        <button
                          onClick={() => openModal("add")}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          disabled={actionLoading}
                        >
                          Upload Drawing
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div
                className={`px-6 py-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"} flex flex-col sm:flex-row justify-between items-center gap-4`}
              >
                <p
                  className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Showing{" "}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span>{" "}
                  drawings
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }));
                      fetchDrawings(pagination.page - 1);
                    }}
                    disabled={pagination.page === 1 || actionLoading}
                    className={`px-3 py-1 border rounded text-sm disabled:opacity-50 flex items-center gap-1 ${
                      darkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setPagination((prev) => ({
                              ...prev,
                              page: pageNum,
                            }));
                            fetchDrawings(pageNum);
                          }}
                          disabled={actionLoading}
                          className={`px-3 py-1 rounded text-sm ${
                            pagination.page === pageNum
                              ? "bg-blue-600 text-white"
                              : darkMode
                                ? "border border-gray-600 text-gray-300 hover:bg-gray-700"
                                : "border border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }));
                      fetchDrawings(pagination.page + 1);
                    }}
                    disabled={
                      pagination.page === pagination.pages || actionLoading
                    }
                    className={`px-3 py-1 border rounded text-sm disabled:opacity-50 flex items-center gap-1 ${
                      darkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Drawing Modal */}
      {viewDrawing && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 transition-all">
          <div
            className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl`}
          >
            <div
              className={`sticky top-0 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b px-8 py-6 flex justify-between items-center`}
            >
              <h2
                className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Drawing Details
              </h2>
              <button
                onClick={closeModal}
                className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                } transition-all text-2xl`}
                disabled={actionLoading}
              >
                &times;
              </button>
            </div>

            <div className="p-8">
              {viewDrawing.drawing && (
                <div className="mb-8 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src={viewDrawing.drawing}
                    alt={viewDrawing.name}
                    className="w-full h-64 object-contain bg-gray-100 dark:bg-gray-900"
                    onError={(e) => {
                      e.target.src =
                        "https://nanitor.com/assets/photos/pdf-placeholder.png";
                    }}
                  />
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label
                    className={`block text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                  >
                    Drawing Name
                  </label>
                  <h1
                    className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {viewDrawing.name}
                  </h1>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`block text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Drawing ID
                    </label>
                    <p
                      className={`text-lg font-mono ${darkMode ? "text-gray-300" : "text-gray-900"}`}
                    >
                      {viewDrawing.drawingId}
                    </p>
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Version
                    </label>
                    <p
                      className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-900"}`}
                    >
                      {viewDrawing.version}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`block text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Access Level
                    </label>
                    <p
                      className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-900"}`}
                    >
                      {viewDrawing.access}
                    </p>
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Job Order
                    </label>
                    <p
                      className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-900"}`}
                    >
                      {viewDrawing.jobOrder}
                    </p>
                  </div>
                </div>

                {viewDrawing.author && (
                  <div>
                    <label
                      className={`block text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Author
                    </label>
                    <div>
                      <p
                        className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-900"}`}
                      >
                        {viewDrawing.author.fname ||
                          viewDrawing.author.name ||
                          "Unknown"}
                        {viewDrawing.author.lname &&
                          ` ${viewDrawing.author.lname}`}
                      </p>
                      {viewDrawing.author.email && (
                        <p
                          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {viewDrawing.author.email}
                        </p>
                      )}
                      {viewDrawing.author.role && (
                        <p
                          className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                        >
                          Role: {viewDrawing.author.role}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {viewDrawing.description && (
                  <div>
                    <label
                      className={`block text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Description
                    </label>
                    <p
                      className={`${darkMode ? "text-gray-300 bg-gray-700" : "text-gray-700 bg-gray-50"} p-4 rounded-lg`}
                    >
                      {viewDrawing.description}
                    </p>
                  </div>
                )}

                {viewDrawing.tags && viewDrawing.tags.length > 0 && (
                  <div>
                    <label
                      className={`block text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {viewDrawing.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 ${
                            darkMode
                              ? "bg-blue-900 text-blue-300"
                              : "bg-blue-100 text-blue-800"
                          } rounded-full text-sm`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`block text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      File Type
                    </label>
                    <p
                      className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-900"}`}
                    >
                      {viewDrawing.fileType}
                    </p>
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      File Size
                    </label>
                    <p
                      className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-900"}`}
                    >
                      {formatFileSize(viewDrawing.fileSize)}
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                  >
                    Status
                  </label>
                  <span
                    className={`px-3 py-1 text-sm rounded-full font-medium inline-block ${
                      viewDrawing.status === "Active"
                        ? darkMode
                          ? "bg-green-900 text-green-300"
                          : "bg-green-100 text-green-700"
                        : darkMode
                          ? "bg-gray-600 text-gray-300"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {viewDrawing.status || "Active"}
                  </span>
                </div>

                {viewDrawing.versionHistory &&
                  viewDrawing.versionHistory.length > 0 && (
                    <div>
                      <label
                        className={`block text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"} mb-3`}
                      >
                        Version History
                      </label>
                      <div
                        className={`space-y-2 max-h-48 overflow-y-auto ${darkMode ? "bg-gray-700" : "bg-gray-50"} p-4 rounded-lg`}
                      >
                        {viewDrawing.versionHistory.map((version, index) => (
                          <div
                            key={index}
                            className={`text-sm py-2 border-b last:border-0 ${darkMode ? "border-gray-600" : "border-gray-200"}`}
                          >
                            <span className="font-semibold">
                              {version.version}
                            </span>
                            <span
                              className={`ml-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                            >
                              - {formatDate(version.updatedAt)}
                            </span>
                            {version.changes && (
                              <p
                                className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                              >
                                {version.changes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {viewDrawing.createdAt && (
                  <div
                    className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Created: {formatDate(viewDrawing.createdAt)}
                    {viewDrawing.updatedAt &&
                      viewDrawing.updatedAt !== viewDrawing.createdAt && (
                        <span className="ml-4">
                          Updated: {formatDate(viewDrawing.updatedAt)}
                        </span>
                      )}
                    {viewDrawing.lastAccessed && (
                      <span className="ml-4">
                        Last Accessed: {formatDate(viewDrawing.lastAccessed)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              className={`sticky bottom-0 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"} border-t px-8 py-4 flex justify-end gap-3`}
            >
              <button
                onClick={() =>
                  downloadDrawing(
                    viewDrawing._id,
                    `${viewDrawing.drawingId}_${viewDrawing.name}.${viewDrawing.fileType?.toLowerCase()}`,
                  )
                }
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                disabled={actionLoading}
              >
                <Download size={16} />
                Download
              </button>
              <button
                onClick={closeModal}
                className={`px-6 py-2 font-semibold rounded-lg transition ${
                  darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={actionLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalMode === "delete" && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 transition-all">
          <div
            className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl w-full max-w-md shadow-2xl overflow-hidden`}
          >
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div
                  className={`w-16 h-16 ${darkMode ? "bg-red-900/30" : "bg-red-100"} rounded-full flex items-center justify-center`}
                >
                  <Trash2 size={32} className="text-red-600" />
                </div>
              </div>

              <h3
                className={`text-xl font-bold text-center mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                {deleteType === "soft"
                  ? "Archive Drawing?"
                  : "Delete Permanently?"}
              </h3>

              <p
                className={`text-center mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                {deleteType === "soft"
                  ? `Are you sure you want to archive "${currentDrawing.name}"?`
                  : `This will permanently delete "${currentDrawing.name}". This action cannot be undone.`}
              </p>

              {deleteType === "soft" && (
                <button
                  onClick={() => setDeleteType("permanent")}
                  className={`w-full text-sm mb-4 ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`}
                >
                  Switch to permanent delete
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={actionLoading}
                >
                  {actionLoading && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {deleteType === "soft" ? "Archive" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Drawing Modal */}
      {(modalMode === "add" || modalMode === "edit") && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 transition-all">
          <div
            className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`}
          >
            <form onSubmit={handleSubmit}>
              <div
                className={`sticky top-0 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b px-6 py-4 flex justify-between items-center`}
              >
                <h3
                  className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  {modalMode === "add" ? "Upload New Drawing" : "Edit Drawing"}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className={`p-2 rounded-lg transition ${
                    darkMode
                      ? "hover:bg-gray-700 text-gray-400"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                  disabled={actionLoading}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* File Upload */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Drawing File{" "}
                    {modalMode === "edit" && "(Leave empty to keep current)"}
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      darkMode
                        ? "border-gray-600 hover:border-blue-400"
                        : "border-gray-300 hover:border-blue-500"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      disabled={actionLoading}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {selectedFile ? (
                        <div>
                          <FileText
                            size={32}
                            className="mx-auto text-blue-500 mb-2"
                          />
                          <p
                            className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {selectedFile.name}
                          </p>
                          <p
                            className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                          >
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      ) : currentDrawing.fileUrl ? (
                        <div>
                          <FileText
                            size={32}
                            className="mx-auto text-green-500 mb-2"
                          />
                          <p
                            className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            Current file exists
                          </p>
                        </div>
                      ) : (
                        <div>
                          <FileUp
                            size={32}
                            className={`mx-auto mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                          />
                          <p
                            className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                          >
                            Click to upload or drag and drop
                          </p>
                          <p
                            className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                          >
                            PDF, DWG, DXF, JPG, PNG (Max 50MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Drawing Name */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Drawing Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={currentDrawing.name || ""}
                    onChange={(e) =>
                      setCurrentDrawing({
                        ...currentDrawing,
                        name: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Enter drawing name"
                    disabled={actionLoading}
                  />
                </div>

                {/* Version and Access */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Version *
                    </label>
                    <input
                      type="text"
                      required
                      value={currentDrawing.version || ""}
                      onChange={(e) =>
                        setCurrentDrawing({
                          ...currentDrawing,
                          version: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="v1.0"
                      disabled={actionLoading}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Access Level *
                    </label>
                    <select
                      required
                      value={currentDrawing.access || "Production"}
                      onChange={(e) =>
                        setCurrentDrawing({
                          ...currentDrawing,
                          access: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      disabled={actionLoading}
                    >
                      <option value="Production">Production</option>
                      <option value="Management">Management</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>

                {/* Job Order */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Job Order *
                  </label>
                  <input
                    type="text"
                    required
                    value={currentDrawing.jobOrder || ""}
                    onChange={(e) =>
                      setCurrentDrawing({
                        ...currentDrawing,
                        jobOrder: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="JOB-000"
                    disabled={actionLoading}
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={currentDrawing.description || ""}
                    onChange={(e) =>
                      setCurrentDrawing({
                        ...currentDrawing,
                        description: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Brief description of the drawing"
                    disabled={actionLoading}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={currentDrawing.tags || ""}
                    onChange={(e) =>
                      setCurrentDrawing({
                        ...currentDrawing,
                        tags: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="foundation, structural, steel"
                    disabled={actionLoading}
                  />
                </div>

                {/* Changes (for edit mode) */}
                {modalMode === "edit" && (
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Change Description (for version history)
                    </label>
                    <input
                      type="text"
                      value={currentDrawing.changes || ""}
                      onChange={(e) =>
                        setCurrentDrawing({
                          ...currentDrawing,
                          changes: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="What changed in this version?"
                      disabled={actionLoading}
                    />
                  </div>
                )}
              </div>

              <div
                className={`sticky bottom-0 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"} border-t px-6 py-4 flex justify-end gap-3`}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                  disabled={
                    actionLoading ||
                    (modalMode === "add" &&
                      !selectedFile &&
                      !currentDrawing.fileUrl)
                  }
                >
                  {actionLoading && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {modalMode === "add" ? "Upload" : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingManagement;
