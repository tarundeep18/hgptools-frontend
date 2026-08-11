import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Eye,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  Package,
  Building2,
  Calendar,
  User,
  FileCheck,
  Shield,
  Mail,
  Phone,
  Plus,
  X,
  UploadCloud,
  RefreshCw,
  Edit,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

const ProfessionalQCReports = () => {
  // Form visibility states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  // Selection states for form (Admin only)
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedPO, setSelectedPO] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedDispatch, setSelectedDispatch] = useState(null);

  // Data states
  const [companies, setCompanies] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [filteredDispatches, setFilteredDispatches] = useState([]);
  const [submittedReports, setSubmittedReports] = useState([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Upload form states (Admin only)
  const [currentBillNumber, setCurrentBillNumber] = useState("");
  const [singleReportName, setSingleReportName] = useState("");
  const [singleQcFile, setSingleQcFile] = useState(null);
  const [singleMtcFile, setSingleMtcFile] = useState(null);
  const [singleDescription, setSingleDescription] = useState("");
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [selectedReportForView, setSelectedReportForView] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // Stats
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalPOs: 0,
    totalItems: 0,
    totalDispatches: 0,
    totalReports: 0,
    pendingUploads: 0,
  });

  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const clientCompanyName = user?.companyName || user?.user?.companyName;

  // Helper function to extract filename
  const getFileName = (file) => {
    if (!file) return null;
    if (typeof file === "string") return file;
    if (typeof file === "object" && file.fileUrl) return file.fileUrl;
    if (typeof file === "object" && file.fileUrl) return file.fileUrl;
    return "File";
  };

  // Generate report name (Admin only)
  const generateReportName = (billNumber, itemDescription, poNumber) => {
    const cleanDescription =
      itemDescription?.substring(0, 50).replace(/[^a-zA-Z0-9]/g, "_") || "Item";
    const cleanBillNumber = billNumber?.replace(/[^a-zA-Z0-9]/g, "_") || "BILL";
    const date = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    return `${cleanBillNumber}_${cleanDescription}_${date}`;
  };

  // Fetch data based on role
  const fetchAllData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // ADMIN: Fetch all data from all APIs
        const [poResponse, dispatchResponse, qcResponse] = await Promise.all([
          axios.get(`${API_URL}/purchase-orders`, { withCredentials: true }),
          axios.get(`${API_URL}/dispatch-orders`, { withCredentials: true }),
          axios.get(`${API_URL}/qc-reports`, { withCredentials: true }),
        ]);

        if (poResponse.data.success && dispatchResponse.data.success) {
          const qcReportsMap = new Map();
          const reportsList = [];

          if (qcResponse.data.success) {
            qcResponse.data.data.forEach((report) => {
              const qcFileName = getFileName(report.qcFile);
              const mtcFileName = getFileName(report.mtcFile);
              const dispatchKey =
                report.dispatchId || `${report.itemId}_${report.billNumber}`;

              qcReportsMap.set(dispatchKey, {
                hasQC: !!report.qcFile,
                hasMTC: !!report.mtcFile,
                reportId: report._id,
                qcFile: qcFileName,
                mtcFile: mtcFileName,
                reportName: report.reportName,
                description: report.description,
                billNumber: report.billNumber,
                createdAt: report.createdAt,
                status: report.status || "Pending",
              });

              const relatedPo = poResponse.data.data.find(
                (po) => po._id === report.poId,
              );
              const companyName = relatedPo?.submittedBy?.companyName || "N/A";

              reportsList.push({
                id: report._id,
                billNumber: report.billNumber || "N/A",
                reportName: report.reportName,
                description: report.description,
                qcFile: qcFileName,
                mtcFile: mtcFileName,
                status: report.status || "Pending",
                createdAt: new Date(report.createdAt).toLocaleDateString(),
                itemId: report.itemId,
                poId: report.poId,
                dispatchId: report.dispatchId,
                companyName: companyName,
                poNumber: relatedPo?.orderNumber || "N/A",
                itemCode: report.itemCode,
                itemDescription: report.itemDescription,
                batchNumber: report.billNumber,
              });
            });
          }

          setSubmittedReports(reportsList);

          // Group companies
          const companiesMap = new Map();
          poResponse.data.data.forEach((po) => {
            const companyName =
              po.submittedBy?.companyName || "Unknown Company";
            if (!companiesMap.has(companyName)) {
              companiesMap.set(companyName, {
                name: companyName,
                poIds: [],
                totalPOs: 0,
                totalItems: 0,
              });
            }
            const company = companiesMap.get(companyName);
            company.poIds.push(po._id);
            company.totalPOs++;
            company.totalItems += po.items.length;
          });
          setCompanies(Array.from(companiesMap.values()));

          // Process dispatches
          const processedDispatches = dispatchResponse.data.data.map(
            (dispatch) => {
              const dispatchKey = dispatch._id;
              const qcStatus = qcReportsMap.get(dispatchKey);
              return {
                id: dispatch._id,
                poId: dispatch.poId,
                poNumber: dispatch.poNumber,
                itemId: dispatch.itemId,
                billNumber: dispatch.billNumber,
                itemCode: dispatch.itemCode,
                itemDescription: dispatch.itemDescription,
                unit: dispatch.unit,
                batchNumber: dispatch.batchNumber,
                dispatchQuantity: dispatch.dispatchQuantity,
                dispatchDate: new Date(
                  dispatch.dispatchDate,
                ).toLocaleDateString(),
                companyName: dispatch.companyName,
                hasQC: qcStatus?.hasQC || false,
                hasMTC: qcStatus?.hasMTC || false,
                reportId: qcStatus?.reportId,
                qcFile: qcStatus?.qcFile,
                mtcFile: qcStatus?.mtcFile,
                reportName: qcStatus?.reportName,
                reportDescription: qcStatus?.description,
              };
            },
          );
          setDispatches(processedDispatches);

          // Calculate stats
          setStats({
            totalCompanies: companiesMap.size,
            totalPOs: poResponse.data.data.length,
            totalItems: poResponse.data.data.reduce(
              (acc, po) => acc + po.items.length,
              0,
            ),
            totalDispatches: processedDispatches.length,
            totalReports: reportsList.length,
            pendingUploads: processedDispatches.filter(
              (d) => !d.hasQC || !d.hasMTC,
            ).length,
          });
        }
      } else {
        // CLIENT: Only fetch QC reports (backend filters by clientId)
        const qcResponse = await axios.get(`${API_URL}/qc-reports`, {
          withCredentials: true,
        });

        if (qcResponse.data.success) {
          const reportsList = [];
          const uniqueCompanies = new Set();
          const uniquePOs = new Set();
          const uniqueItems = new Set();

          qcResponse.data.data.forEach((report) => {
            const qcFileName = getFileName(report.qcFile);
            const mtcFileName = getFileName(report.mtcFile);
            const companyName =
              report.companyName ||
              report.uploadedBy?.companyName ||
              clientCompanyName ||
              "N/A";

            uniqueCompanies.add(companyName);
            if (report.poNumber) uniquePOs.add(report.poNumber);
            if (report.itemCode) uniqueItems.add(report.itemCode);

            reportsList.push({
              id: report._id,
              billNumber: report.billNumber || "N/A",
              reportName: report.reportName,
              description: report.description,
              qcFile: qcFileName,
              mtcFile: mtcFileName,
              status: report.status || "Pending",
              createdAt: new Date(report.createdAt).toLocaleDateString(),
              poNumber: report.poNumber || "N/A",
              itemCode: report.itemCode || "N/A",
              itemDescription:
                report.itemName || report.itemDescription || "N/A",
              companyName: companyName,
              hasQC: !!report.qcFile,
              hasMTC: !!report.mtcFile,
            });
          });

          setSubmittedReports(reportsList);
          console.log("Reports", reportsList);

          setStats({
            totalCompanies: uniqueCompanies.size,
            totalPOs: uniquePOs.size,
            totalItems: uniqueItems.size,
            totalDispatches: reportsList.length,
            totalReports: reportsList.length,
            pendingUploads: reportsList.filter((r) => !r.hasQC || !r.hasMTC)
              .length,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Admin: Load POs when company is selected
  const handleCompanySelect = async (companyName) => {
    if (!isAdmin) return;

    setSelectedCompany(companyName);
    setSelectedPO("");
    setSelectedItem("");
    setSelectedDispatch(null);
    setFilteredDispatches([]);

    setLoading(true);
    try {
      const poResponse = await axios.get(`${API_URL}/purchase-orders`, {
        withCredentials: true,
      });
      const companyPOs = poResponse.data.data.filter(
        (po) => po.submittedBy?.companyName === companyName,
      );
      setPurchaseOrders(companyPOs);
    } catch (error) {
      console.error("Error fetching POs:", error);
      showNotification("error", "Failed to fetch purchase orders");
    } finally {
      setLoading(false);
    }
  };

  // Admin: Load items when PO is selected
  const handlePOSelect = (poId) => {
    if (!isAdmin) return;

    setSelectedPO(poId);
    setSelectedItem("");
    setSelectedDispatch(null);
    setFilteredDispatches([]);

    const selectedPODetails = purchaseOrders.find((po) => po._id === poId);
    if (selectedPODetails) {
      setItems(selectedPODetails.items);
    }
  };

  // Admin: Load dispatches when item is selected
  const handleItemSelect = (itemId) => {
    if (!isAdmin) return;

    setSelectedItem(itemId);
    setSelectedDispatch(null);
    const itemDispatches = dispatches.filter((d) => d.itemId === itemId);
    setFilteredDispatches(itemDispatches);
  };

  // Admin: Open create form
  const openCreateForm = () => {
    if (!isAdmin) {
      showNotification("error", "Only administrators can create reports");
      return;
    }
    resetForm();
    setEditingReport(null);
    setShowCreateForm(true);
  };

  // Admin: Edit report
  const editReport = (report) => {
    if (!isAdmin) {
      showNotification("error", "Only administrators can edit reports");
      return;
    }
    setEditingReport(report);
    setCurrentBillNumber(report.billNumber);
    setSingleReportName(report.reportName);
    setSingleDescription(report.description || "");
    setShowCreateForm(true);
  };

  // Admin: Delete report
  const deleteReport = async (reportId) => {
    if (!isAdmin) {
      showNotification("error", "Only administrators can delete reports");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this report?")) return;

    try {
      const response = await axios.delete(`${API_URL}/qc-reports/${reportId}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        showNotification("success", "Report deleted successfully");
        await fetchAllData();
        if (selectedItem) handleItemSelect(selectedItem);
      }
    } catch (error) {
      console.error("Delete error:", error);
      showNotification("error", "Failed to delete report");
    }
  };

  // Admin: Handle file upload
  const handleSubmitReport = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      showNotification("error", "Only administrators can upload reports");
      return;
    }

    if (!selectedPO || !selectedItem || !selectedDispatch) {
      showNotification("error", "Please complete all selection steps");
      return;
    }

    if (!singleQcFile || !singleMtcFile) {
      showNotification("error", "Please select both QC and MTC files");
      return;
    }

    if (!currentBillNumber) {
      showNotification("error", "Please enter Bill Number");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("itemId", selectedItem);
      formData.append("poId", selectedPO);
      formData.append("reportName", singleReportName);
      formData.append("description", singleDescription);
      formData.append("qcFile", singleQcFile);
      formData.append("mtcFile", singleMtcFile);
      formData.append("billNumber", currentBillNumber);
      formData.append("dispatchId", selectedDispatch.id);
      formData.append("companyName", selectedCompany);

      const response = await axios.post(
        `${API_URL}/qc-reports/upload`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.success) {
        showNotification("success", "Report submitted successfully");
        await fetchAllData();
        if (selectedItem) handleItemSelect(selectedItem);
        resetForm();
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Upload error:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to submit report",
      );
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedCompany("");
    setSelectedPO("");
    setSelectedItem("");
    setSelectedDispatch(null);
    setCurrentBillNumber("");
    setSingleReportName("");
    setSingleQcFile(null);
    setSingleMtcFile(null);
    setSingleDescription("");
    setFilteredDispatches([]);
    setItems([]);
  };

  const downloadFile = async (reportId, fileName, type) => {
    if (!reportId) {
      showNotification("error", "No file available");
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/qc-reports/${reportId}/download?type=${type}`,
        {
          withCredentials: true,
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || `${type}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification("success", `Downloading ${type.toUpperCase()} report`);
    } catch (error) {
      console.error("Download error:", error);
      showNotification("error", "Failed to download file");
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const getFilteredReports = () => {
    let filtered = submittedReports;
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.reportName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    return filtered;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Approved: {
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      Pending: {
        color: "bg-yellow-100 text-yellow-700",
        icon: <Clock className="w-3 h-3" />,
      },
      Rejected: {
        color: "bg-red-100 text-red-700",
        icon: <XCircle className="w-3 h-3" />,
      },
    };
    const config = statusConfig[status] || statusConfig["Pending"];
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon}
        {status}
      </span>
    );
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">
            Please login to access this page.
          </p>
        </div>
      </div>
    );
  }

  const filteredReports = getFilteredReports();

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl backdrop-blur-sm ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-800"
          } animate-slide-in max-w-md`}
        >
          <div className="flex items-center">
            {notification.type === "success" && (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {notification.type === "error" && (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-2 backdrop-blur-sm shrink-0">
                  <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  QC/MTC Report Management
                </h2>
              </div>

              <p className="mt-2 text-sm sm:text-base text-blue-100">
                {isAdmin
                  ? "Administrator - Full access to create and manage reports"
                  : `Client - View only access for ${clientCompanyName}`}
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={openCreateForm}
                className="
            w-full sm:w-auto
            flex items-center justify-center gap-2
            px-5 py-3
            bg-white
            text-blue-600
            rounded-xl
            font-semibold
            hover:shadow-lg
            transition-all
          "
              >
                <Plus className="w-5 h-5" />
                Create New Report
              </button>
            )}
          </div>
        </div>

        {/* User Information */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3 md:gap-6 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-600 truncate">
                {user?.user?.fname || user?.fname}
              </span>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-600 truncate">
                {user?.user?.email || user?.email}
              </span>
            </div>

            {!isAdmin && (
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-600 font-medium truncate">
                  {clientCompanyName}
                </span>
              </div>
            )}

            {!isAdmin && (
              <div className="md:ml-auto">
                <span className="inline-flex items-center bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                  View Only
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Companies</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalCompanies}
                </p>
              </div>
              <div className="bg-blue-100 rounded-xl p-3">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total POs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalPOs}
                </p>
              </div>
              <div className="bg-purple-100 rounded-xl p-3">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Total Reports
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalReports}
                </p>
              </div>
              <div className="bg-indigo-100 rounded-xl p-3">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Pending Uploads
                </p>
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {stats.pendingUploads}
                </p>
              </div>
              <div className="bg-amber-100 rounded-xl p-3">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Report Form Modal - ADMIN ONLY */}
      {isAdmin && showCreateForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-8">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {editingReport ? "Edit Report" : "Create New Report"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select dispatch batch and upload QC/MTC documents
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Step 1: Select Company */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Step 1: Select Company <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {companies.map((company) => (
                    <button
                      key={company.name}
                      type="button"
                      onClick={() => handleCompanySelect(company.name)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${selectedCompany === company.name ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-blue-300"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800">
                            {company.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {company.totalPOs} POs • {company.totalItems} Items
                          </div>
                        </div>
                        {selectedCompany === company.name && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select PO */}
              {selectedCompany && purchaseOrders.length > 0 && (
                <div className="mb-6 animate-fade-in">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Step 2: Select PO Number{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {purchaseOrders.map((po) => (
                      <button
                        key={po._id}
                        type="button"
                        onClick={() => handlePOSelect(po._id)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${selectedPO === po._id ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-blue-300"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-800">
                              {po.orderNumber}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {po.items.length} Items
                            </div>
                          </div>
                          {selectedPO === po._id && (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Select Item */}
              {selectedPO && items.length > 0 && (
                <div className="mb-6 animate-fade-in">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Step 3: Select Item <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => handleItemSelect(item._id)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${selectedItem === item._id ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-blue-300"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">
                              {item.itemCode}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {item.description}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Qty: {item.quantity} {item.unit}
                            </div>
                          </div>
                          {selectedItem === item._id && (
                            <CheckCircle className="w-5 h-5 text-blue-600 ml-4" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Select Dispatch Batch */}
              {selectedItem && filteredDispatches.length > 0 && (
                <div className="mb-6 animate-fade-in">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Step 4: Select Dispatch Batch{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {filteredDispatches.map((dispatch) => {
                      const isComplete = dispatch.hasQC && dispatch.hasMTC;
                      return (
                        <button
                          key={dispatch.id}
                          type="button"
                          onClick={() => {
                            console.log("DISPATCH OBJECT:", dispatch);

                            setSelectedDispatch(dispatch);

                            // Fixes the auto-fetch by targeting .billNumber property
                            const billNumber = dispatch.billNumber || "BILL";

                            console.log("BILL NUMBER USED:", billNumber);

                            // Updates the states using your existing functions
                            setCurrentBillNumber(billNumber);
                            setSingleReportName(
                              generateReportName(
                                billNumber,
                                dispatch.itemDescription,
                                selectedPO,
                              ),
                            );
                          }}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${selectedDispatch?.id === dispatch.id ? "border-blue-500 bg-blue-50 shadow-md" : isComplete ? "border-green-200 bg-green-50/30 opacity-75" : "border-gray-200 hover:border-blue-300"}`}
                          disabled={isComplete}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 mb-2">
                                Batch #{dispatch.batchNumber}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                                <div>
                                  <span className="text-gray-500">
                                    Dispatch Date:
                                  </span>
                                  <span className="ml-2 text-gray-700">
                                    {dispatch.dispatchDate}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Quantity:
                                  </span>
                                  <span className="ml-2 text-gray-700">
                                    {dispatch.dispatchQuantity} {dispatch.unit}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-4">
                                {dispatch.hasQC ? (
                                  <span className="text-xs text-green-600">
                                    <CheckCircle className="w-3 h-3 inline mr-1" />{" "}
                                    QC Uploaded
                                  </span>
                                ) : (
                                  <span className="text-xs text-red-600">
                                    <XCircle className="w-3 h-3 inline mr-1" />{" "}
                                    QC Missing
                                  </span>
                                )}
                                {dispatch.hasMTC ? (
                                  <span className="text-xs text-green-600">
                                    <CheckCircle className="w-3 h-3 inline mr-1" />{" "}
                                    MTC Uploaded
                                  </span>
                                ) : (
                                  <span className="text-xs text-red-600">
                                    <XCircle className="w-3 h-3 inline mr-1" />{" "}
                                    MTC Missing
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedDispatch?.id === dispatch.id && (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload Form */}
              {selectedDispatch &&
                (!selectedDispatch.hasQC || !selectedDispatch.hasMTC) && (
                  <div className="animate-fade-in">
                    <div className="border-t border-gray-200 pt-6 mt-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Upload Documents
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bill No. <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={currentBillNumber}
                            onChange={(e) => {
                              setCurrentBillNumber(e.target.value);
                              if (selectedDispatch)
                                setSingleReportName(
                                  generateReportName(
                                    e.target.value || "BILL",
                                    selectedDispatch.itemDescription,
                                    selectedDispatch.poNumber,
                                  ),
                                );
                            }}
                            placeholder="Enter Bill Number"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Report Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={singleReportName}
                            onChange={(e) =>
                              setSingleReportName(e.target.value)
                            }
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 outline-none"
                            readOnly
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              QC File <span className="text-red-500">*</span>
                            </label>
                            <div className="border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer relative bg-gray-50/50">
                              <input
                                type="file"
                                accept=".pdf,.docx,.jpg,.png"
                                onChange={(e) =>
                                  setSingleQcFile(e.target.files[0])
                                }
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                required
                              />
                              <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                {singleQcFile
                                  ? singleQcFile.name
                                  : "Click to upload QC document"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              MTC File <span className="text-red-500">*</span>
                            </label>
                            <div className="border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer relative bg-gray-50/50">
                              <input
                                type="file"
                                accept=".pdf,.docx,.jpg,.png"
                                onChange={(e) =>
                                  setSingleMtcFile(e.target.files[0])
                                }
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                required
                              />
                              <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                {singleMtcFile
                                  ? singleMtcFile.name
                                  : "Click to upload MTC document"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description / Remarks
                          </label>
                          <textarea
                            value={singleDescription}
                            onChange={(e) =>
                              setSingleDescription(e.target.value)
                            }
                            rows="3"
                            placeholder="Add any additional notes..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-100 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              {selectedDispatch &&
                (!selectedDispatch.hasQC || !selectedDispatch.hasMTC) && (
                  <button
                    onClick={handleSubmitReport}
                    disabled={uploading || !currentBillNumber}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
                  >
                    {uploading && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {editingReport ? "Update Report" : "Submit Report"}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Reports List Table */}
      <div className="mx-auto px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Submitted
                  Reports
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filteredReports.length} of {submittedReports.length}{" "}
                  reports
                </p>
              </div>
              <button
                onClick={fetchAllData}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by company, item code, report name or bill number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-300 overflow-auto">
            <table className="w-full border-collapse text-sm text-center">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                    S.No
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                    Company Name
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                    Item Details
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                    PO Number
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                    Bill No.
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredReports.map((report, index) => (
                  <tr
                    key={report.id}
                    className={`hover:bg-blue-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    {/* S.No */}
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      {index + 1}
                    </td>
                    {/* Company Name */}
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-800">
                          {report.companyName}
                        </span>
                      </div>
                    </td>

                    {/* Item Details */}
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      <div className="font-mono text-sm font-semibold text-gray-800">
                        {report.itemCode}
                      </div>
                      <div className="text-sm text-gray-600">
                        {report.itemDescription}
                      </div>
                    </td>

                    {/* PO Number */}
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      <div className="flex justify-center">
                        <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {report.poNumber}
                        </span>
                      </div>
                    </td>

                    {/* Bill Number */}
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                          <FileText className="w-3 h-3" />
                          {report.billNumber}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* View */}
                        <button
                          onClick={() => {
                            setSelectedReportForView(report);
                            setShowViewDetailsModal(true);
                          }}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* QC */}
                        {report.qcFile && (
                          <button
                            onClick={() => window.open(report.qcFile, "_blank")}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View QC"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}

                        {/* MTC */}
                        {report.mtcFile && (
                          <button
                            onClick={() =>
                              window.open(report.mtcFile, "_blank")
                            }
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="View MTC"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Admin Actions */}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => editReport(report)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit Report"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => deleteReport(report.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete Report"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {paginatedReports.length > 0 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2 mb-2 px-4">
                {/* Showing Entries */}
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold">
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredReports.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    {filteredReports.length}
                  </span>{" "}
                  entries
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-2 py-2 rounded-lg border text-xs font-medium transition ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white hover:bg-blue-50 text-blue-600 border-blue-200"
                    }`}
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg font-medium transition ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-300 hover:bg-blue-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-2 py-2 rounded-lg border text-xs font-medium transition ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white hover:bg-blue-50 text-blue-600 border-blue-200"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {filteredReports.length === 0 && !loading && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700">
                  No reports found
                </h3>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {showViewDetailsModal && selectedReportForView && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Report Details
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Complete report information
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowViewDetailsModal(false);
                    setSelectedReportForView(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Company
                  </p>
                  <p className="font-medium text-gray-900">
                    {selectedReportForView.companyName}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    PO Number
                  </p>
                  <p className="font-medium text-gray-900">
                    {selectedReportForView.poNumber}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Bill Number
                  </p>
                  <p className="font-medium text-gray-900">
                    {selectedReportForView.billNumber}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Item Details
                  </p>
                  <p className="font-mono text-sm font-semibold text-gray-800">
                    {selectedReportForView.itemCode}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedReportForView.itemDescription}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Report Name
                  </p>
                  <p className="font-medium text-gray-900">
                    {selectedReportForView.reportName}
                  </p>
                  {selectedReportForView.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedReportForView.description}
                    </p>
                  )}
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    QC File
                  </p>
                  {selectedReportForView.qcFile ? (
                    <button
                      onClick={() =>
                        window.open(selectedReportForView.qcFile, "_blank")
                      }
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <FileText className="w-4 h-4" />
                      View
                    </button>
                  ) : (
                    <span className="text-gray-500">No file uploaded</span>
                  )}
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    MTC File
                  </p>
                  {selectedReportForView.mtcFile ? (
                    <button
                      onClick={() =>
                        window.open(selectedReportForView.mtcFile, "_blank")
                      }
                      className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                      <FileCheck className="w-4 h-4" />
                      View
                    </button>
                  ) : (
                    <span className="text-gray-500">No file uploaded</span>
                  )}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-100 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowViewDetailsModal(false);
                  setSelectedReportForView(null);
                }}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Close
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowViewDetailsModal(false);
                    editReport(selectedReportForView);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ProfessionalQCReports;
