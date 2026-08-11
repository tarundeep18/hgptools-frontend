import {
  Trash,
  Eye,
  Download,
  FileText,
  Phone,
  Mail,
  Building,
  User,
  Upload,
  X,
  File,
  FileImage,
  FileArchive,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  MapPin,
  Settings,
  Briefcase,
  Globe,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { MdDelete } from "react-icons/md";
import { IoMdEye } from "react-icons/io";

const QuoteData = () => {
  const { darkMode } = useOutletContext();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [currentQuote, setCurrentQuote] = useState({});
  const [viewQuote, setViewQuote] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // State for conversion
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertData, setConvertData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // GST Verification states
  const [gstLoading, setGstLoading] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [gstError, setGstError] = useState("");

  // Fetch all quotes
  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/quote`,
        { withCredentials: true },
      );

      if (response.data.success) {
        setQuotes(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch quotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  // Delete quote
  const deleteQuote = async (id) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/quote/${id}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Quote deleted successfully!");
        fetchQuotes();
        closeModal();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete quote");
    }
  };

  // View single quote details
  const fetchSingleQuote = async (id) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/quote/${id}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        setViewQuote(response.data.data);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch quote details",
      );
    }
  };

  // Upload document to existing quote
  const uploadDocument = async (quoteId, file) => {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/quote/${quoteId}/documents`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.success) {
        toast.success("Document uploaded successfully!");
        fetchSingleQuote(quoteId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingFile(false);
    }
  };

  // delete documents from quote
  const deleteDocument = async (quoteId, docId) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/quote/${quoteId}/documents/${docId}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Document deleted successfully!");
        fetchSingleQuote(quoteId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete document");
    }
  };

  // Update quote status
  const updateQuoteStatus = async (quoteId, status, notes = "") => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/quote/${quoteId}/status`,
        { status, notes },
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Status updated successfully!");
        fetchSingleQuote(quoteId);
        fetchQuotes();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const openModal = (mode, quote = {}) => {
    setModalMode(mode);
    setCurrentQuote(quote);
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentQuote({});
    setViewQuote(null);
    setSelectedFiles([]);
    setShowConvertModal(false);
    setConvertData(null);
    setValidationErrors([]);
    setGstVerified(false);
    setGstError("");
  };

  const handleDelete = () => {
    if (currentQuote._id) {
      deleteQuote(currentQuote._id);
    }
  };

  const handleView = (quote) => {
    fetchSingleQuote(quote._id);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    for (const file of selectedFiles) {
      await uploadDocument(viewQuote._id, file);
    }
    setSelectedFiles([]);
  };

  const handleStatusChange = async (newStatus) => {
    if (viewQuote) {
      await updateQuoteStatus(viewQuote._id, newStatus);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType?.includes("image")) return <FileImage className="w-5 h-5" />;
    if (fileType?.includes("pdf")) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "yellow", icon: AlertCircle, text: "Pending" },
      contacted: { color: "blue", icon: Phone, text: "Contacted" },
      completed: { color: "green", icon: CheckCircle, text: "Completed" },
      archived: { color: "gray", icon: XCircle, text: "Archived" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}
      >
        <Icon size={12} />
        {config.text}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenFile = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  const getFileName = (doc, index) => {
    if (!doc) return `Document ${index + 1}`;
    if (typeof doc === "string") {
      try {
        const urlParts = doc.split("/");
        const fileName = urlParts[urlParts.length - 1];
        return fileName?.split("?")[0] || `Document ${index + 1}`;
      } catch (error) {
        return `Document ${index + 1}`;
      }
    }
    if (typeof doc === "object") {
      return doc.fileName || doc.name || `Document ${index + 1}`;
    }
    return `Document ${index + 1}`;
  };

  const getFileUrl = (doc) => {
    if (!doc) return "#";
    if (typeof doc === "string") return doc;
    if (typeof doc === "object") return doc.fileUrl || doc.url || "#";
    return "#";
  };

  // GST Verification Function (same as User component)
  const verifyGST = async () => {
    if (!convertData.gstNumber) {
      toast.error("Please enter GST Number");
      return;
    }

    try {
      setGstLoading(true);
      setGstError("");
      setGstVerified(false);

      const apiKey = import.meta.env.VITE_REACT_APP_GST_API_KEY;

      if (!apiKey) {
        setGstError("GST API key is not configured");
        toast.error("GST API key not found");
        setGstLoading(false);
        return;
      }

      const { data } = await axios.get(
        `https://sheet.gstincheck.co.in/check/${apiKey}/${convertData.gstNumber}`,
        {
          withCredentials: false,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Full GST Response:", data);

      const gstData = data.data || data;

      // Auto-fill company details from GST
      setConvertData((prev) => ({
        ...prev,
        companyName: gstData.tradeNam || gstData.lgnm || prev.companyName || "",
        gstNumber: gstData.gstin || prev.gstNumber,
        address: gstData.pradr?.adr || prev.address || "",
        city:
          gstData.pradr?.addr?.city || gstData.pradr?.city || prev.city || "",
        state:
          gstData.pradr?.addr?.state ||
          gstData.pradr?.state ||
          prev.state ||
          "",
        country: prev.country || "India",
        industry: gstData.ctb || prev.industry || "",
      }));

      setGstVerified(true);
      toast.success(
        `✅ GST Verified Successfully! Company details auto-filled.`,
      );
    } catch (error) {
      console.error("GST Verification Error:", error);
      setGstError(error.response?.data?.message || "Invalid GST Number");
      toast.error("Invalid GST Number. Please check and try again.");
      setGstVerified(false);
    } finally {
      setGstLoading(false);
    }
  };

  // Validate required fields
  const validateRequiredFields = (data) => {
    const errors = [];

    const requiredFields = [
      { field: "fname", label: "First Name" },
      { field: "lname", label: "Last Name" },
      { field: "email", label: "Email Address" },
      { field: "phone", label: "Phone Number" },
      { field: "companyName", label: "Company Name" },
      { field: "contactPerson", label: "Contact Person" },
    ];

    requiredFields.forEach(({ field, label }) => {
      if (!data[field] || data[field].trim() === "") {
        errors.push(`${label} is required`);
      }
    });

    // Validate email format
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Invalid email format");
    }

    return errors;
  };

  // Handle convert to client with preview
  const handleConvertToClient = async (quote) => {
    if (!quote) {
      toast.error("No quote data to convert");
      return;
    }

    const nameParts = quote.fName?.trim().split(" ") || [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const clientData = {
      // Personal Information
      fname: firstName,
      lname: lastName,
      email: quote.email || "",
      phone: quote.phnNumber || quote.phone || "",

      // Company Information
      companyName: quote.companyName || "",
      contactPerson: quote.contactPerson || quote.fName || "",
      gstNumber: quote.gstNumber || "",
      website: quote.website || "",
      industry: quote.industry || "",

      // Address Information
      address: quote.address || "",
      city: quote.city || "",
      state: quote.state || "",
      country: quote.country || "India",
      zipCode: quote.zipCode || "",

      // Default Values
      role: "client",
      status: "active",
      currency: quote.currency || "INR",
      paymentTerms: quote.paymentTerms || "Net 30",
      communication: quote.communication || "Email",
      notes:
        quote.notes ||
        `Converted from Quote #${quote._id || "N/A"} on ${new Date().toLocaleString()}`,

      // Metadata
      quoteId: quote._id,
      source: "quote_conversion",
    };

    setConvertData(clientData);
    setValidationErrors([]);
    setGstVerified(false);
    setGstError("");
    setShowConvertModal(true);
  };

  // Confirm conversion
  const confirmConversion = async () => {
    // Validate required fields
    const errors = validateRequiredFields(convertData);

    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/register`,
        convertData,
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        toast.success(`Client ${convertData.fname} created successfully!`);

        // Update quote with client reference
        await updateQuoteWithClient(
          convertData.quoteId,
          response.data.data._id,
        );

        setShowConvertModal(false);
        closeModal();
        fetchQuotes();
      }
    } catch (error) {
      console.error("Error converting to client:", error);
      toast.error(
        error.response?.data?.message || "Failed to convert to client",
      );
    } finally {
      setLoading(false);
    }
  };

  // Update quote with client reference
  const updateQuoteWithClient = async (quoteId, clientId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/quote/${quoteId}/convert-client`,
        {
          clientId: clientId,
          status: "completed",
          notes: `Converted to client on ${new Date().toLocaleDateString()}`,
        },
        { withCredentials: true },
      );
    } catch (error) {
      console.error("Error updating quote with client:", error);
    }
  };

  return (
    <div className="mx-auto my-10 px-5 font-sans">
      <div
        className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} rounded-2xl shadow-sm border border-slate-100 overflow-hidden`}
      >
        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } rounded-xl shadow-sm border border-gray-100 p-6 mb-4`}
        >
          <header className="flex justify-between items-center">
            <div>
              <h1
                className={`text-3xl font-extrabold m-0 ${
                  darkMode ? "text-blue-500" : "text-blue-800"
                }`}
              >
                Quote Details
              </h1>
              <p
                className={`${darkMode ? "text-gray-400" : "text-slate-500"} mt-1`}
              >
                Manage and view all quote requests
              </p>
            </div>
            <div className="text-sm">
              <span
                className={`${darkMode ? "text-gray-400" : "text-slate-500"}`}
              >
                Total Quotes: {quotes.length}
              </span>
            </div>
          </header>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`${darkMode ? "bg-gray-800" : "bg-gray-50"} border-b border-slate-100`}
                >
                  <th
                    className={`px-6 py-4 text-xs font-semibold uppercase ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      Name
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-xs font-semibold uppercase ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building size={14} />
                      Company
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-xs font-semibold uppercase ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      Phone
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-xs font-semibold uppercase ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      Email
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-xs font-semibold uppercase ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-6 py-4 text-xs font-semibold uppercase ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    } text-right`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotes.length > 0 ? (
                  quotes.map((quote) => (
                    <tr
                      key={quote._id}
                      className={`transition-colors ${
                        darkMode ? "hover:bg-gray-800/50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td
                        className={`px-6 py-5 font-medium ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {quote.fName}
                      </td>
                      <td
                        className={`px-6 py-5 text-sm ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {quote.companyName || "—"}
                      </td>
                      <td
                        className={`px-6 py-5 text-sm ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {quote.phnNumber}
                      </td>
                      <td
                        className={`px-6 py-5 text-sm ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        <a
                          href={`mailto:${quote.email}`}
                          className="hover:text-blue-500"
                        >
                          {quote.email}
                        </a>
                      </td>
                      <td className="px-6 py-5">
                        {getStatusBadge(quote.status)}
                      </td>
                      <td className="px-6 py-5 text-right space-x-3">
                        <button
                          onClick={() => handleView(quote)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode
                              ? "text-blue-400 hover:bg-gray-700"
                              : "text-blue-600 hover:bg-blue-50"
                          }`}
                          title="View Details"
                        >
                          <IoMdEye className="text-2xl" />
                        </button>
                        <button
                          onClick={() => openModal("delete", quote)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode
                              ? "text-red-400 hover:bg-gray-700"
                              : "text-red-500 hover:bg-red-50"
                          }`}
                          title="Delete"
                        >
                          <MdDelete className="text-2xl" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                            darkMode
                              ? "bg-gray-800 text-gray-600"
                              : "bg-slate-50 text-slate-300"
                          }`}
                        >
                          📋
                        </div>
                        <div>
                          <p
                            className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
                          >
                            No quotes found
                          </p>
                          <p
                            className={`text-sm ${darkMode ? "text-gray-400" : "text-slate-500"}`}
                          >
                            There are currently no quote requests in the system.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">{quotes.length}</span> of{" "}
                <span className="font-medium">{quotes.length}</span> quote
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50 disabled:opacity-50">
                  Previous
                </button>
                <button className="px-3 py-1 bg-blue-700 text-white rounded text-sm hover:bg-blue-800">
                  1
                </button>
                <button className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50">
                  2
                </button>
                <button className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50">
                  3
                </button>
                <button className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Quote Modal */}
      {viewQuote && (
        <div className="fixed inset-0  bg-black/50 flex justify-center items-center z-50 p-4 transition-all">
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl`}
          >
            <div
              className={`sticky top-0 ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } border-b px-8 py-6 flex justify-between items-center`}
            >
              <div>
                <h2
                  className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  Quote Details
                </h2>
                <p
                  className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`}
                >
                  Submitted on {formatDate(viewQuote.createdAt)}
                </p>
              </div>
              <button
                onClick={closeModal}
                className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  darkMode
                    ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } transition-all text-2xl`}
              >
                &times;
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Status Bar */}
              <div
                className={`p-4 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"} flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Current Status:
                  </span>
                  {getStatusBadge(viewQuote.status)}
                </div>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`px-3 py-2 rounded-lg text-sm border ${
                      darkMode
                        ? "bg-gray-600 border-gray-500 text-white"
                        : "bg-white border-gray-200 text-gray-700"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    value={viewQuote.status}
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Convert Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleConvertToClient(viewQuote)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  Convert & Create User
                </button>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3
                  className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} flex items-center gap-2`}
                >
                  <User size={20} className="text-blue-500" />
                  Contact Information
                </h3>
                <div
                  className={`grid grid-cols-2 gap-6 p-6 rounded-xl ${
                    darkMode ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Full Name
                    </label>
                    <p
                      className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {viewQuote.fName}
                    </p>
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Company Name
                    </label>
                    <p
                      className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {viewQuote.companyName || "—"}
                    </p>
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Email Address
                    </label>
                    <a
                      href={`mailto:${viewQuote.email}`}
                      className={`text-lg font-medium text-blue-500 hover:underline`}
                    >
                      {viewQuote.email}
                    </a>
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Phone Number
                    </label>
                    <a
                      href={`tel:${viewQuote.phnNumber}`}
                      className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-900"} hover:text-blue-500`}
                    >
                      {viewQuote.phnNumber}
                    </a>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
                  Documents (
                  {viewQuote?.documents
                    ? Array.isArray(viewQuote.documents)
                      ? viewQuote.documents.length
                      : 1
                    : 0}
                  )
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewQuote?.documents ? (
                    (Array.isArray(viewQuote.documents)
                      ? viewQuote.documents
                      : [viewQuote.documents]
                    ).map((doc, index) => {
                      const fileUrl = getFileUrl(doc);

                      return (
                        <div
                          key={index}
                          className={`group p-6 rounded-2xl border transition-all duration-300
            ${
              darkMode
                ? "bg-gray-800 border-gray-700 hover:border-green-500 hover:bg-gray-800/80"
                : "bg-white border-gray-200 hover:border-green-400 hover:shadow-lg"
            }`}
                        >
                          <div className="flex items-center gap-4 mb-5">
                            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/40">
                              {getFileIcon(doc)}
                            </div>
                            <div>
                              <h3
                                className={`text-lg font-semibold ${
                                  darkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                Document {index + 1}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Preview or download file
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={() => handleOpenFile(fileUrl)}
                              disabled={fileUrl === "#"}
                              className="flex-1 py-2.5 rounded-lg bg-green-500 text-white font-medium
                hover:bg-green-600 transition-all duration-200 group-hover:scale-[1.02]"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-gray-400 italic">
                      No documents uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3
                  className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} flex items-center gap-2`}
                >
                  <Calendar size={20} className="text-purple-500" />
                  Additional Details
                </h3>
                <div
                  className={`p-6 rounded-xl ${
                    darkMode ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label
                        className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                      >
                        Quote ID
                      </label>
                      <p
                        className={`font-mono text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {viewQuote._id}
                      </p>
                    </div>
                    <div>
                      <label
                        className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                      >
                        Last Updated
                      </label>
                      <p
                        className={`text-sm flex items-center gap-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        <Clock size={14} />
                        {formatDate(viewQuote.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {viewQuote.notes && (
                <div className="space-y-2">
                  <h3
                    className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Notes
                  </h3>
                  <p
                    className={`p-4 rounded-xl ${darkMode ? "bg-gray-700/30 text-gray-300" : "bg-gray-50 text-gray-700"}`}
                  >
                    {viewQuote.notes}
                  </p>
                </div>
              )}
            </div>

            <div
              className={`sticky bottom-0 ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-gray-50 border-gray-200"
              } border-t px-8 py-4 flex justify-end`}
            >
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Client Modal - Full Form with All Fields */}
      {showConvertModal && convertData && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div
            className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl`}
          >
            <div
              className={`sticky top-0 z-10 border-b px-8 py-6 flex justify-between items-center ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div>
                <h2
                  className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  Convert Quote to Client
                </h2>
                <p
                  className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Fill in all required fields to create a new client
                </p>
              </div>
              <button
                onClick={() => setShowConvertModal(false)}
                className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  darkMode
                    ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } transition-all text-2xl`}
              >
                &times;
              </button>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 font-semibold">
                  Please fix the following errors:
                </p>
                <ul className="list-disc list-inside text-red-600 text-sm mt-2">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-8 space-y-6">
              {/* Personal Information */}
              <div>
                <h3
                  className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} flex items-center gap-2 mb-4`}
                >
                  <User size={20} className="text-blue-500" />
                  Personal Information{" "}
                  <span className="text-red-500 text-sm">*Required</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={convertData.fname}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          fname: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        !convertData.fname
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={convertData.lname}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          lname: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        !convertData.lname
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={convertData.email}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          email: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        !convertData.email
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={convertData.phone}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          phone: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        !convertData.phone
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div>
                <h3
                  className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} flex items-center gap-2 mb-4`}
                >
                  <Building size={20} className="text-purple-500" />
                  Company Information{" "}
                  <span className="text-red-500 text-sm">*Required</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={convertData.companyName}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          companyName: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        !convertData.companyName
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={convertData.contactPerson}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          contactPerson: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        !convertData.contactPerson
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                      placeholder="Enter contact person"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      GST Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={15}
                        value={convertData.gstNumber || ""}
                        onChange={(e) => {
                          setConvertData({
                            ...convertData,
                            gstNumber: e.target.value.toUpperCase(),
                          });
                          setGstVerified(false);
                          setGstError("");
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-lg border uppercase ${
                          gstVerified
                            ? "border-green-500 bg-green-50"
                            : gstError
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                        placeholder="22AAAAA0000A1Z5"
                      />
                      <button
                        type="button"
                        onClick={verifyGST}
                        disabled={gstLoading || !convertData.gstNumber}
                        className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      >
                        {gstLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            Verify
                          </span>
                        ) : (
                          "Verify"
                        )}
                      </button>
                    </div>
                    {gstVerified && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-600 text-sm flex items-center gap-1">
                          <span>✅</span> GST Verified Successfully!
                        </p>
                      </div>
                    )}
                    {gstError && (
                      <p className="mt-2 text-red-600 text-sm flex items-center gap-1">
                        <span>❌</span> {gstError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Website
                    </label>
                    <input
                      type="url"
                      value={convertData.website || ""}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          website: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                      placeholder="https://company.com"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Industry
                    </label>
                    <select
                      value={convertData.industry || ""}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          industry: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                    >
                      <option value="">Select Industry</option>
                      <option value="Automotive">Automotive</option>
                      <option value="Aerospace">Aerospace</option>
                      <option value="Medical">Medical</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Energy">Energy</option>
                      <option value="Defense">Defense</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3
                  className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} flex items-center gap-2 mb-4`}
                >
                  <MapPin size={20} className="text-orange-500" />
                  Address Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Address
                    </label>
                    <textarea
                      rows={2}
                      value={convertData.address || ""}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          address: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${darkMode ? "bg-gray-700 text-white" : ""}`}
                      placeholder="Enter full address"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      City
                    </label>
                    <input
                      type="text"
                      value={convertData.city || ""}
                      onChange={(e) =>
                        setConvertData({ ...convertData, city: e.target.value })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      State
                    </label>
                    <input
                      type="text"
                      value={convertData.state || ""}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          state: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Country
                    </label>
                    <input
                      type="text"
                      value={convertData.country || "India"}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          country: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                      placeholder="Enter country"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={convertData.zipCode || ""}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          zipCode: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                      placeholder="Enter zip code"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div>
                <h3
                  className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} flex items-center gap-2 mb-4`}
                >
                  <Settings size={20} className="text-gray-500" />
                  Additional Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Currency
                    </label>
                    <select
                      value={convertData.currency || "INR"}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          currency: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Payment Terms
                    </label>
                    <select
                      value={convertData.paymentTerms || "Net 30"}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          paymentTerms: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                    >
                      <option value="Advance">Advance</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Preferred Communication
                    </label>
                    <select
                      value={convertData.communication || "Email"}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          communication: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : ""}`}
                    >
                      <option value="Email">Email</option>
                      <option value="Phone">Phone</option>
                      <option value="WhatsApp">WhatsApp</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label
                      className={`block text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      value={convertData.notes || ""}
                      onChange={(e) =>
                        setConvertData({
                          ...convertData,
                          notes: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${darkMode ? "bg-gray-700 text-white" : ""}`}
                      placeholder="Any additional notes..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className={`sticky bottom-0 border-t px-8 py-4 flex justify-end gap-3 ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <button
                onClick={() => setShowConvertModal(false)}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-colors ${
                  darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmConversion}
                disabled={loading}
                className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Client...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Create Client
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalMode === "delete" && (
        <div className="fixed inset-0  bg-black/50 flex justify-center items-center z-50 p-4 transition-all">
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-2xl w-full max-w-md shadow-2xl overflow-hidden`}
          >
            <div className="p-8 text-center">
              <div
                className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                  darkMode ? "bg-red-900/20" : "bg-red-50"
                }`}
              >
                <Trash
                  className={`w-10 h-10 ${darkMode ? "text-red-400" : "text-red-500"}`}
                />
              </div>
              <h2
                className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Delete Quote
              </h2>
              <p
                className={`mb-8 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Are you sure you want to delete the quote from{" "}
                <span className="font-semibold">{currentQuote.fName}</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={closeModal}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                    darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteData;
