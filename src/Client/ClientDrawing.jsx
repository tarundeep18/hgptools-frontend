import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  Eye,
  Search,
  Filter,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  FolderOpen,
  Database,
  TrendingUp,
  Shield,
  Zap,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  Building2,
  Mail,
  Phone,
  Tag,
  File,
  Archive,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FolderPlus,
  Share2,
  Copy,
  MoreVertical,
  Edit2,
  Save,
  Star,
  StarOff,
  Heart,
  Award,
  BarChart3,
  Cloud,
  HardDrive,
  Layers,
  Sparkles,
  Check,
  AlertTriangle,
  Users,
  ChevronDown,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const ClientDrawing = () => {
  const [drawings, setDrawings] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [editingDrawing, setEditingDrawing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("uploadedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [selectedReportForView, setSelectedReportForView] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDrawings: 0,
    limit: 12,
  });

  // Upload form data
  const [uploadFormData, setUploadFormData] = useState({
    title: "",
    description: "",
    drawingNumber: "",
    revision: "00",
    material: "",
    dimensions: "",
    tags: "",
    folderId: "",
    files: [],
  });

  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");

  const { user } = useAuth();

  const isAdmin =
    user?.role === "admin" ||
    user?.role === "Administrator" ||
    user?.isAdmin === true;
  const isClient =
    user?.role === "client" || user?.role === "Client" || !isAdmin;

  // Client profile from auth context
  const clientProfile = {
    id: user?._id || user?.id || "CLT-001",
    companyName: user?.companyName || user?.company || "Your Company",
    name: user?.name || user?.fullName || "Client User",
    email: user?.email || "client@example.com",
    phone: user?.phone || "",
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Client User")}&background=0D8FED&color=fff`,
  };

  // Group folders by company for admin view
  const groupFoldersByCompany = () => {
    const grouped = {};
    folders.forEach((folder) => {
      const companyId = folder.clientId?._id || folder.clientId;
      const companyName =
        folder.clientId?.companyName ||
        folder.clientId?.email ||
        "Unknown Company";
      const companyEmail = folder.clientId?.email || "";

      if (!grouped[companyId]) {
        grouped[companyId] = {
          id: companyId,
          name: companyName,
          email: companyEmail,
          folders: [],
          totalDrawings: 0,
        };
      }
      grouped[companyId].folders.push(folder);
      grouped[companyId].totalDrawings += folder.drawingCount || 0;
    });
    return Object.values(grouped);
  };

  const companies = isAdmin ? groupFoldersByCompany() : [];

  // Fetch drawings with RBAC
  const fetchDrawings = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        sortBy,
        sortOrder,
        page: pagination.currentPage,
        limit: pagination.limit,
        favourite: showFavouritesOnly ? true : undefined,
      };

      if (selectedFolder?._id) {
        params.folderId = selectedFolder._id;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/folder`,
        { params, withCredentials: true },
      );

      if (response.data.success) {
        setDrawings(response.data.drawings);
        setPagination({
          currentPage: response.data.pagination?.currentPage || 1,
          totalPages: response.data.pagination?.totalPages || 1,
          totalDrawings: response.data.pagination?.totalDrawings || 0,
          limit: response.data.pagination?.limit || 12,
        });
      } else {
        toast.error(response.data.message || "Failed to fetch drawings");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch drawings");
    } finally {
      setLoading(false);
    }
  };

  const openImageInNewTab = (fileUrl) => {
    window.open(fileUrl, "_blank");
  };

  // Fetch folders
  const fetchFolders = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/folder/folders`,
        { withCredentials: true },
      );

      if (response.data.success) {
        setFolders(response.data.folders);
      }
    } catch (error) {
      console.error("Failed to fetch folders", error);
    }
  };

  // Toggle company expansion
  const toggleCompany = (companyId) => {
    setExpandedCompanies((prev) => ({
      ...prev,
      [companyId]: !prev[companyId],
    }));
  };

  // Select all folders from a company
  const selectCompanyFolders = (companyId) => {
    const company = companies.find((c) => c.id === companyId);
    if (company && company.folders.length > 0) {
      // Implement bulk selection logic here
      toast.success(
        `Selected ${company.folders.length} folders from ${company.name}`,
      );
    }
  };

  // Toggle favourite
  const toggleFavourite = async (drawingId, e) => {
    if (e) e.stopPropagation();

    if (!isClient && !isAdmin) {
      toast.error("You don't have permission to perform this action");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/folder/${drawingId}/favourite`,
        {},
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success(response.data.message || "Favourite status updated");
        await fetchDrawings();
        if (selectedDrawing?._id === drawingId) {
          setSelectedDrawing(response.data.drawing);
        }
      } else {
        toast.error(response.data.message || "Failed to update favourite");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update favourite",
      );
    } finally {
      setLoading(false);
    }
  };

  // Create folder
  const handleCreateFolder = async (e) => {
    e.preventDefault();

    // if (!isAdmin) {
    //   toast.error("Only administrators can create folders");
    //   return;
    // }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/folder/folders`,
        {
          name: newFolderName,
          description: newFolderDescription,
        },
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Folder created successfully!");
        setShowCreateFolderModal(false);
        setNewFolderName("");
        setNewFolderDescription("");
        await fetchFolders();
      } else {
        toast.error(response.data.message || "Failed to create folder");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create folder");
    } finally {
      setLoading(false);
    }
  };

  // Upload drawings
  const handleUploadDrawings = async (e) => {
    e.preventDefault();

    if (uploadFormData.files.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("title", uploadFormData.title);
    formData.append("description", uploadFormData.description);
    formData.append("drawingNumber", uploadFormData.drawingNumber);
    formData.append("revision", uploadFormData.revision);
    formData.append("material", uploadFormData.material);
    formData.append("dimensions", uploadFormData.dimensions);
    formData.append("tags", uploadFormData.tags);

    if (uploadFormData.folderId) {
      formData.append("folderId", uploadFormData.folderId);
    }

    uploadFormData.files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/folder/upload`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percentCompleted);
          },
        },
      );

      if (response.data.success) {
        toast.success("Drawings uploaded successfully!");
        setShowUploadModal(false);
        setUploadFormData({
          title: "",
          description: "",
          drawingNumber: "",
          revision: "00",
          material: "",
          dimensions: "",
          tags: "",
          folderId: "",
          files: [],
        });
        await fetchDrawings();
        await fetchFolders();
      } else {
        toast.error(response.data.message || "Failed to upload drawings");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload drawings");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Update drawing
  const handleUpdateDrawing = async (e) => {
    e.preventDefault();

    if (!isAdmin && editingDrawing?.clientId?._id !== user?._id) {
      toast.error("You don't have permission to edit this drawing");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/folder/${editingDrawing._id}`,
        {
          title: editingDrawing.title,
          description: editingDrawing.description,
          drawingNumber: editingDrawing.drawingNumber,
          revision: editingDrawing.revision,
          material: editingDrawing.material,
          dimensions: editingDrawing.dimensions,
          tags: editingDrawing.tags,
          folderId: editingDrawing.folderId,
        },
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Drawing updated successfully!");
        setShowEditModal(false);
        setEditingDrawing(null);
        await fetchDrawings();
        if (selectedDrawing?._id === editingDrawing._id) {
          setSelectedDrawing(response.data.drawing);
        }
      } else {
        toast.error(response.data.message || "Failed to update drawing");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update drawing");
    } finally {
      setLoading(false);
    }
  };

  // Delete drawing
  const handleDeleteDrawing = async (drawingId) => {
    const drawingToDelete = drawings.find((d) => d._id === drawingId);

    if (!isAdmin && drawingToDelete?.clientId?._id !== user?._id) {
      toast.error("You don't have permission to delete this drawing");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this drawing?"))
      return;

    setLoading(true);
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/folder/${drawingId}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Drawing deleted successfully!");
        await fetchDrawings();
        if (selectedDrawing?._id === drawingId) {
          setShowDrawingModal(false);
        }
      } else {
        toast.error(response.data.message || "Failed to delete drawing");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete drawing");
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg" ||
        file.name.endsWith(".dwg") ||
        file.name.endsWith(".dxf") ||
        file.name.endsWith(".step") ||
        file.name.endsWith(".stp"),
    );

    if (validFiles.length !== files.length) {
      toast.error(
        "Some files were skipped. Only PDF, images, DWG, DXF, STEP files are allowed.",
      );
    }

    setUploadFormData((prev) => ({
      ...prev,
      files: [...prev.files, ...validFiles],
    }));
  };

  const removeFile = (index) => {
    setUploadFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Calculate stats
  const totalSize = drawings.reduce((acc, d) => acc + (d.fileSize || 0), 0);
  const recentUploads = drawings.filter((d) => {
    const daysAgo =
      (new Date() - new Date(d.uploadedAt)) / (1000 * 60 * 60 * 24);
    return daysAgo <= 7;
  }).length;
  const favouriteCount = drawings.filter((d) => d.isFavourite).length;

  useEffect(() => {
    if (user) {
      fetchDrawings();
      fetchFolders();
    }
  }, [
    selectedFolder,
    sortBy,
    sortOrder,
    searchTerm,
    pagination.currentPage,
    showFavouritesOnly,
    user,
  ]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes("pdf"))
      return <FileText className="w-12 h-12 text-red-500" />;
    if (fileType?.includes("image"))
      return <ImageIcon className="w-12 h-12 text-green-500" />;
    if (fileType?.includes("dwg"))
      return <File className="w-12 h-12 text-orange-500" />;
    return <FileText className="w-12 h-12 text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8">
            {/* Left Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-xl p-2 sm:p-3 backdrop-blur-sm shrink-0">
                  <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                    Drawing Management
                  </h1>

                  <p className="mt-2 flex items-start sm:items-center gap-2 text-sm sm:text-base text-blue-100">
                    <Sparkles className="w-4 h-4 mt-0.5 sm:mt-0 shrink-0" />
                    <span>
                      {isAdmin
                        ? "Manage all drawings across companies"
                        : "Upload, organize, and manage your technical drawings"}
                    </span>
                  </p>
                </div>
              </div>

              {/* User Info */}
              <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs sm:text-sm text-blue-100 max-w-full">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{clientProfile.companyName}</span>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs sm:text-sm text-blue-100 max-w-full">
                  <User className="w-4 h-4 shrink-0" />
                  <span className="truncate">{clientProfile.name}</span>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs sm:text-sm text-blue-100 max-w-full">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{clientProfile.email}</span>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 rounded-full bg-yellow-500/30 px-3 py-2 text-xs sm:text-sm text-white">
                    <Shield className="w-4 h-4" />
                    <span>Administrator</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-col sm:flex-col lg:flex-col xl:flex-col gap-3 w-full mt-4 lg:w-auto">
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="group flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/20 px-5 py-3 text-sm sm:text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30 w-full sm:w-auto"
              >
                <FolderPlus className="w-5 h-5 transition-transform group-hover:rotate-12" />
                New Folder
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="group flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm sm:text-base font-semibold text-blue-600 transition-all hover:scale-105 hover:shadow-xl w-full sm:w-auto"
              >
                <Upload className="w-5 h-5 transition-transform group-hover:-translate-y-1" />
                Upload Drawings
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Drawings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {pagination.totalDrawings}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Layers className="w-3 h-3" />
              <span>Across {folders.length} folders</span>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Favourites</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {favouriteCount}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Star className="w-5 h-5 text-amber-600 fill-current" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
              <Heart className="w-3 h-3" />
              <span>Starred drawings</span>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Recent Uploads</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {recentUploads}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Last 7 days</span>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Companies</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {companies.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Database className="w-3 h-3" />
              <span>Active clients</span>
            </div>
          </div>
        </div>

        {/* Folders Section - Company-wise for Admin */}
        {(folders.length > 0 || isAdmin) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 border border-white/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                {isAdmin ? "Company Folders" : "Folders"}
              </h3>

              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all"
              >
                <Plus className="w-4 h-4" />
                New Folder
              </button>
            </div>

            {/* Admin View - Grouped by Company */}
            {isAdmin ? (
              <div className="space-y-4">
                {/* All Drawings Button */}
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setSelectedFolder(null);
                      setSelectedCompany(null);
                    }}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                      !selectedFolder && !selectedCompany
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <FolderOpen className="w-4 h-4" />
                    All Drawings (All Companies)
                    <span className="ml-1 text-xs opacity-75">
                      ({pagination.totalDrawings})
                    </span>
                  </button>
                </div>

                {/* Companies Accordion */}
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCompany(company.id)}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900">
                            {company.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {company.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {company.folders.length} folders
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {company.totalDrawings} drawings
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectCompanyFolders(company.id);
                          }}
                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                        >
                          Select All
                        </button>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                            expandedCompanies[company.id] ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {expandedCompanies[company.id] && (
                      <div className="p-4 bg-white border-t border-gray-200">
                        <div className="flex flex-wrap gap-3">
                          {company.folders.map((folder) => (
                            <button
                              key={folder._id}
                              onClick={() => {
                                setSelectedFolder(folder);
                                setSelectedCompany(company);
                              }}
                              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                                selectedFolder?._id === folder._id
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              <FolderOpen className="w-4 h-4" />
                              {folder.name}
                              <span className="ml-1 text-xs opacity-75">
                                ({folder.drawingCount || 0})
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Client View - Simple folder list */
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    !selectedFolder
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  All Drawings
                  <span className="ml-1 text-xs opacity-75">
                    ({pagination.totalDrawings})
                  </span>
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder._id}
                    onClick={() => setSelectedFolder(folder)}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                      selectedFolder?._id === folder._id
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <FolderOpen className="w-4 h-4" />
                    {folder.name}
                    <span className="ml-1 text-xs opacity-75">
                      ({folder.drawingCount || 0})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 border border-white/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by title, drawing number, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 h-12 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="uploadedAt">Date Uploaded</option>
                <option value="title">Title</option>
                <option value="drawingNumber">Drawing Number</option>
                <option value="revision">Revision</option>
              </select>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                }
                className="px-4 h-12 rounded-xl border border-gray-200 bg-gray-50 flex items-center gap-2 text-sm hover:bg-gray-100 transition-all"
              >
                {sortOrder === "desc" ? (
                  <SortDesc className="w-4 h-4" />
                ) : (
                  <SortAsc className="w-4 h-4" />
                )}
                {sortOrder === "desc" ? "Newest First" : "Oldest First"}
              </button>

              <button
                onClick={() => setShowFavouritesOnly(!showFavouritesOnly)}
                className={`px-4 h-12 rounded-xl border flex items-center gap-2 text-sm transition-all ${
                  showFavouritesOnly
                    ? "bg-amber-500 border-amber-500 text-white shadow-md"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Star
                  className={`w-4 h-4 ${showFavouritesOnly ? "fill-current" : ""}`}
                />
                Favourites
              </button>

              <select
                value={pagination.limit}
                onChange={(e) => {
                  setPagination((prev) => ({
                    ...prev,
                    limit: Number(e.target.value),
                    currentPage: 1,
                  }));
                }}
                className="px-4 h-12 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
                <option value={48}>48 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drawings Grid/List View - Same as before */}
        {loading && drawings.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading drawings...</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {drawings.map((drawing) => (
              <div
                key={drawing._id}
                className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                onClick={() => {
                  setSelectedDrawing(drawing);
                  setShowDrawingModal(true);
                }}
              >
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {drawing.fileType?.startsWith("image/") ? (
                    <img
                      src={drawing.fileUrl}
                      alt={drawing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center transform group-hover:scale-110 transition-transform duration-300">
                      {getFileIcon(drawing.fileType)}
                      <p className="text-sm text-gray-500 mt-2 font-medium">
                        {drawing.fileType?.split("/")[1]?.toUpperCase() ||
                          "DOCUMENT"}
                      </p>
                    </div>
                  )}

                  {drawing.isFavourite && (
                    <div className="absolute top-2 left-2">
                      <div className="px-2 py-1 bg-amber-500 text-white text-xs rounded-full flex items-center gap-1 shadow-lg">
                        <Star className="w-3 h-3 fill-current" />
                        Favourite
                      </div>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => toggleFavourite(drawing._id, e)}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-amber-50 transition-all"
                      title={
                        drawing.isFavourite
                          ? "Remove from favourites"
                          : "Add to favourites"
                      }
                    >
                      {drawing.isFavourite ? (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      ) : (
                        <StarOff className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(drawing.fileUrl, "_blank");
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-green-50 transition-all"
                      title="Open"
                    >
                      <Download className="w-3.5 h-3.5 text-green-600" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                    {drawing.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    #{drawing.drawingNumber || "N/A"} | Rev {drawing.revision}
                  </p>
                  {isAdmin && drawing.clientId && (
                    <p className="text-xs text-blue-600 mb-2 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {drawing.clientId.companyName || drawing.clientId.email}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(drawing.uploadedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {formatFileSize(drawing.fileSize)}
                    </span>
                  </div>
                  {drawing.tags && (
                    <div className="flex flex-wrap gap-1">
                      {drawing.tags
                        .split(",")
                        .slice(0, 2)
                        .map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-300 overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                      S.No
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Drawing
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Drawing #
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Revision
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Folder
                    </th>
                    {isAdmin && (
                      <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                        Company
                      </th>
                    )}
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Uploaded
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Size
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Favourite
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drawings.map((drawing, index) => (
                    <tr
                      key={drawing._id}
                      className={`hover:bg-blue-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                      onClick={() => {
                        setSelectedDrawing(drawing);
                        setShowDrawingModal(true);
                      }}
                    >
                      {/* S.No */}
                      <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            {getFileIcon(drawing.fileType)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {drawing.title}
                            </div>
                            {drawing.tags && (
                              <div className="flex gap-1 mt-1">
                                {drawing.tags
                                  .split(",")
                                  .slice(0, 2)
                                  .map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                                    >
                                      {tag.trim()}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                        {drawing.drawingNumber || "-"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                          Rev {drawing.revision}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                        {drawing.folderId?.name || "Uncategorized"}
                      </td>
                      {isAdmin && (
                        <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-500" />
                            {drawing.clientId?.companyName ||
                              drawing.clientId?.email ||
                              "N/A"}
                          </div>
                        </td>
                      )}
                      <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                        {new Date(drawing.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                        {formatFileSize(drawing.fileSize)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                        <button
                          onClick={(e) => toggleFavourite(drawing._id, e)}
                          className="transition-all"
                        >
                          {drawing.isFavourite ? (
                            <Star className="w-5 h-5 text-amber-500 fill-current hover:scale-110 transition-transform" />
                          ) : (
                            <StarOff className="w-5 h-5 text-gray-400 hover:text-amber-500 hover:scale-110 transition-all" />
                          )}
                        </button>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(isAdmin || drawing.clientId?._id === user?._id) && (
                            <button
                              onClick={() => {
                                setEditingDrawing(drawing);
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(drawing.fileUrl, "_blank");
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Open"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {(isAdmin || drawing.clientId?._id === user?._id) && (
                            <button
                              onClick={() => handleDeleteDrawing(drawing._id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Empty State */}
        {!loading && drawings.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300 p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {showFavouritesOnly
                ? "No favourite drawings yet"
                : "No drawings found"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedFolder
                ? "Try adjusting your search criteria"
                : showFavouritesOnly
                  ? "Star your favourite drawings to see them here"
                  : "Upload your first drawing to get started"}
            </p>
            {!searchTerm && !selectedFolder && !showFavouritesOnly && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Drawing
              </button>
            )}
            {showFavouritesOnly && (
              <button
                onClick={() => setShowFavouritesOnly(false)}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                View All Drawings
              </button>
            )}
          </div>
        )}
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-2">
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (
                  pagination.currentPage >=
                  pagination.totalPages - 2
                ) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      pagination.currentPage === pageNum
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {/* Upload Modal - Same as before */}
      {showUploadModal && (
        <div
  className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-black/60 sm:items-center sm:p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby="upload-drawings-title"
  aria-describedby="upload-drawings-description"
>
  <div className="flex max-h-screen max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-gray-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out sm:max-h-[calc(100vh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:max-w-2xl sm:rounded-2xl">
    {/* Responsive Header */}
    <div className="z-10 flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 bg-white/95 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:px-6 sm:py-5">
      <div className="min-w-0 flex-1">
        <h2
          id="upload-drawings-title"
          className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl"
        >
          Upload Drawings
        </h2>
        <p
          id="upload-drawings-description"
          className="mt-1 max-w-xl text-xs leading-5 text-gray-500 sm:mt-0.5"
        >
          Upload technical blueprints, designs, and supporting documentation
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShowUploadModal(false)}
        className="-mr-1 shrink-0 rounded-lg p-2 text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:mr-0"
        aria-label="Close modal"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>

    {/* Form Content */}
    <form
      onSubmit={handleUploadDrawings}
      className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6"
    >
      {/* Responsive Grid Inputs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={uploadFormData.title}
            onChange={(e) =>
              setUploadFormData({
                ...uploadFormData,
                title: e.target.value,
              })
            }
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
            placeholder="e.g., Main Assembly View"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Drawing Number
          </label>
          <input
            type="text"
            value={uploadFormData.drawingNumber}
            onChange={(e) =>
              setUploadFormData({
                ...uploadFormData,
                drawingNumber: e.target.value,
              })
            }
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
            placeholder="e.g., DWG-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Revision
          </label>
          <input
            type="text"
            value={uploadFormData.revision}
            onChange={(e) =>
              setUploadFormData({
                ...uploadFormData,
                revision: e.target.value,
              })
            }
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
            placeholder="00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Folder
          </label>
          <div className="relative">
            <select
              value={uploadFormData.folderId}
              onChange={(e) =>
                setUploadFormData({
                  ...uploadFormData,
                  folderId: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none"
            >
              <option value="">Select folder (optional)</option>
              {folders.map((folder) => (
                <option key={folder._id} value={folder._id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Material
          </label>
          <input
            type="text"
            value={uploadFormData.material}
            onChange={(e) =>
              setUploadFormData({
                ...uploadFormData,
                material: e.target.value,
              })
            }
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
            placeholder="e.g., Stainless Steel"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Dimensions
          </label>
          <input
            type="text"
            value={uploadFormData.dimensions}
            onChange={(e) =>
              setUploadFormData({
                ...uploadFormData,
                dimensions: e.target.value,
              })
            }
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
            placeholder="e.g., 100x50x20 mm"
          />
        </div>
      </div>

      {/* Description Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
          value={uploadFormData.description}
          onChange={(e) =>
            setUploadFormData({
              ...uploadFormData,
              description: e.target.value,
            })
          }
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
          placeholder="Provide engineering notes or specifications..."
        />
      </div>

      {/* Enhanced Drag and Drop Zone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Files <span className="text-rose-500">*</span>
        </label>
        <div className="group rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/30 p-5 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/10 sm:p-8">
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf,.step,.stp"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center justify-center text-center"
          >
            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 mb-3 group-hover:scale-110 group-hover:text-blue-600 transition-transform duration-200 text-gray-400">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
              PDF, DWG, DXF, STEP, STP, Images up to 20MB each
            </p>
          </label>
        </div>
        {/* Uploaded Files Queue List */}
        {uploadFormData.files.length > 0 && (
          <div className="mt-4 border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-48 overflow-y-auto shadow-inner bg-gray-50/30">
            {uploadFormData.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refined Progress Bar */}
      {uploadProgress > 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-gray-600">
              Uploading documents...
            </span>
            <span className="font-bold text-blue-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200/70 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 rounded-full h-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="sticky bottom-0 z-10 -mx-4 -mb-4 flex flex-col-reverse gap-2 border-t border-gray-100 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm sm:static sm:mx-0 sm:mb-0 sm:flex-row sm:gap-3 sm:border-gray-50 sm:bg-white sm:px-0 sm:pb-0 sm:pt-3 sm:backdrop-blur-none">
        <button
          type="button"
          onClick={() => setShowUploadModal(false)}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 sm:flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploadFormData.files.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Uploading...</span>
            </>
          ) : (
            "Upload Drawings"
          )}
        </button>
      </div>
    </form>
  </div>
</div>
      )}

      {/* Create Folder Modal - Admin Only or client both */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 ">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 transform transition-all duration-300 scale-100 ease-out">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  Create New Folder
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Organize your files efficiently
                </p>
              </div>
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateFolder} className="p-6 space-y-5">
              {/* Folder Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Folder Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                  placeholder="e.g., Press Tools, Sheet Metal Parts"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description{" "}
                  <span className="text-xs text-gray-400 font-normal">
                    (Optional)
                  </span>
                </label>
                <textarea
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
                  placeholder="Describe the contents of this folder..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    "Create Folder"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Drawing Modal */}
      {showEditModal &&
        editingDrawing &&
        (isAdmin || editingDrawing.clientId?._id === user?._id) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Edit Drawing</h2>
                  <p className="text-sm text-gray-500">
                    Update drawing information
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleUpdateDrawing} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editingDrawing.title}
                      onChange={(e) =>
                        setEditingDrawing({
                          ...editingDrawing,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Drawing Number
                    </label>
                    <input
                      type="text"
                      value={editingDrawing.drawingNumber}
                      onChange={(e) =>
                        setEditingDrawing({
                          ...editingDrawing,
                          drawingNumber: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Revision
                    </label>
                    <input
                      type="text"
                      value={editingDrawing.revision}
                      onChange={(e) =>
                        setEditingDrawing({
                          ...editingDrawing,
                          revision: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Material
                    </label>
                    <input
                      type="text"
                      value={editingDrawing.material}
                      onChange={(e) =>
                        setEditingDrawing({
                          ...editingDrawing,
                          material: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dimensions
                    </label>
                    <input
                      type="text"
                      value={editingDrawing.dimensions}
                      onChange={(e) =>
                        setEditingDrawing({
                          ...editingDrawing,
                          dimensions: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Folder
                    </label>
                    <select
                      value={
                        editingDrawing.folderId?._id || editingDrawing.folderId
                      }
                      onChange={(e) =>
                        setEditingDrawing({
                          ...editingDrawing,
                          folderId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border rounded-xl"
                    >
                      <option value="">Select folder</option>
                      {folders.map((folder) => (
                        <option key={folder._id} value={folder._id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingDrawing.description}
                    onChange={(e) =>
                      setEditingDrawing({
                        ...editingDrawing,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={editingDrawing.tags}
                    onChange={(e) =>
                      setEditingDrawing({
                        ...editingDrawing,
                        tags: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border rounded-xl"
                    placeholder="Comma-separated tags"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2.5 border rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Drawing Details Modal */}
      {showDrawingModal &&
        selectedDrawing &&
        (isAdmin || selectedDrawing.clientId?._id === user?._id) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedDrawing.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    #{selectedDrawing.drawingNumber || "No number"} | Rev{" "}
                    {selectedDrawing.revision}
                  </p>
                </div>
                <div className="flex gap-2">
                  {(isAdmin || selectedDrawing.clientId?._id === user?._id) && (
                    <>
                      <button
                        onClick={() => {
                          setEditingDrawing(selectedDrawing);
                          setShowEditModal(true);
                          setShowDrawingModal(false);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDrawing(selectedDrawing._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openImageInNewTab(selectedDrawing.fileUrl)}
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-blue-50 transition-all"
                    title="View Image"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                  <button
                    onClick={() => {
                      setShowDrawingModal(false);
                      setSelectedReportForView(null);
                    }}
                    aria-label="Close modal"
                    className=" rounded-lg p-2  bg-gray-100 shadow-2xs1 text-gray-900 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center min-h-[400px]">
                    {selectedDrawing.fileType?.startsWith("image/") ? (
                      <img
                        src={selectedDrawing.fileUrl}
                        alt={selectedDrawing.title}
                        className="max-w-full max-h-[400px] rounded-lg object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        {getFileIcon(selectedDrawing.fileType)}

                        <button
                          onClick={() =>
                            openImageInNewTab(selectedDrawing.fileUrl)
                          }
                          className="flex flex-col items-center justify-center p-2 pt-8 rounded-lg hover:bg-blue-50 transition-all"
                          title="View Image"
                        >
                          <p className="text-gray-500">View Drawing</p>
                          <Eye className="w-4.5 h-4.5 text-blue-600" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Drawing Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Drawing Number:</span>
                          <span className="font-medium">
                            {selectedDrawing.drawingNumber || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Revision:</span>
                          <span className="font-medium">
                            {selectedDrawing.revision}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Material:</span>
                          <span className="font-medium">
                            {selectedDrawing.material || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Dimensions:</span>
                          <span className="font-medium">
                            {selectedDrawing.dimensions || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">File Size:</span>
                          <span className="font-medium">
                            {formatFileSize(selectedDrawing.fileSize)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Uploaded:</span>
                          <span className="font-medium">
                            {new Date(
                              selectedDrawing.uploadedAt,
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Folder:</span>
                          <span className="font-medium">
                            {selectedDrawing.folderId?.name || "Uncategorized"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Company:</span>
                          <span className="font-medium">
                            {selectedDrawing.clientId?.companyName ||
                              selectedDrawing.clientId?.email ||
                              "Unknown"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Uploaded By:</span>
                          <span className="font-medium">
                            {selectedDrawing.clientId?.name || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedDrawing.description && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Description
                        </h4>
                        <p className="text-sm text-gray-600">
                          {selectedDrawing.description}
                        </p>
                      </div>
                    )}

                    {selectedDrawing.tags && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedDrawing.tags.split(",").map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Secure Document
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            End-to-end encrypted
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ClientDrawing;
