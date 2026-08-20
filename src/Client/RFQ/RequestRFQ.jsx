import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Send,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  History,
  XCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Download,
  Eye,
  Filter,
  Search,
  Plus,
  Trash2,
  TrendingUp,
  Package,
  Settings,
  Users,
  FileCheck,
  Truck,
  Wrench,
  Microscope,
  Zap,
  Shield,
  Award,
  DollarSign,
  MessageCircle,
  X,
  ChevronRight,
  Activity,
  Globe,
  Target,
  Layers,
  Trash,
  Edit,
  LifeBuoy,
  FileMinus,
  Reply,
  ShieldCheck,
  UserCog,
  Check,
  AlertTriangle,
  Paperclip,
  SendHorizontal,
  MoreVertical,
  ReplyAll,
  ChevronLeft,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const HGPToolsRFQ = () => {
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [rfqList, setRfqList] = useState([]);
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRfqId, setSelectedRfqId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [counterValidUntil, setCounterValidUntil] = useState("");
  const [counterOffers, setCounterOffers] = useState([]);
  const [showCounterHistory, setShowCounterHistory] = useState(false);
  const [processingCounter, setProcessingCounter] = useState(false);
  const [showAcceptCounterModal, setShowAcceptCounterModal] = useState(false);
  const [showRejectCounterModal, setShowRejectCounterModal] = useState(false);
  const [rejectCounterReason, setRejectCounterReason] = useState("");

  // Conversation/Reply States
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [replies, setReplies] = useState([]);
  const [newReplyMessage, setNewReplyMessage] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyStatus, setReplyStatus] = useState("");
  const [replyQuoteAmount, setReplyQuoteAmount] = useState("");
  const [replyValidUntil, setReplyValidUntil] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(true);
  const [replyingToRFQ, setReplyingToRFQ] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const messagesEndRef = useRef(null);
  const endIndex = startIndex + rowsPerPage;

  // Quote Acceptance Modal States
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [processingQuote, setProcessingQuote] = useState(false);

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRFQ, setEditingRFQ] = useState(null);
  const [editFormData, setEditFormData] = useState({
    componentType: "",
    material: "",
    quantity: "",
    drawingNumber: "",
    specifications: "",
    deadline: "",
    additionalNotes: "",
  });

  const { user } = useAuth();


  // Check if user is admin
  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const isClient = user?.role === "client" || !isAdmin;

  // Get client data from login context
  const [clientProfile] = useState({
    id: user?._id || "CLT-001",
    companyName: user?.companyName || "",
    contactPerson: user?.name || "",
    email: user?.email || "",
    phone: user?.phoneNumber ? `+91 ${user.phoneNumber}` : "",
    address: user?.address || "Sector 62, Noida, Uttar Pradesh - 201301",
  });

  // RFQ Form State
  const [formData, setFormData] = useState({
    companyName: clientProfile.companyName,
    contactPerson: clientProfile.contactPerson,
    email: clientProfile.email,
    phone: clientProfile.phone,
    address: clientProfile.address,
    componentType: "",
    material: "",
    quantity: "",
    drawingNumber: "",
    specifications: "",
    deadline: "",
    additionalNotes: "",
    files: [],
  });

  // Fetch RFQ data with pagination
  const fetchRFQDetails = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq`,
        {
          params: {
            status: filterStatus !== "all" ? filterStatus : undefined,
            page,
            limit: 10,
          },
          withCredentials: true,
        },
      );

      if (response.data.success) {
        const rfqs = response.data.data || [];
        setRfqList(rfqs);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.totalCount || rfqs.length);
        setCurrentPage(response.data.currentPage || 1);

       
      } else {
        toast.error(response.data.message || "Failed to fetch rfq data");
      }
    } catch (error) {
      console.error("Full error object:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.response?.data?.message);
      toast.error(error.response?.data?.message || "Failed to fetch rfq");
    } finally {
      setLoading(false);
    }
  };

  // Submit Counter Offer
  const handleSubmitCounterOffer = async () => {
    if (!counterAmount || counterAmount <= 0) {
      toast.error("Please enter a valid counter offer amount");
      return;
    }

    setProcessingCounter(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/${selectedRFQ?._id}/counter-offer`,
        {
          counterAmount: Number(counterAmount),
          counterMessage: counterMessage,
          validUntil: counterValidUntil || null,
        },
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Counter offer submitted successfully");
        setShowCounterModal(false);
        setCounterAmount("");
        setCounterMessage("");
        setCounterValidUntil("");
        await fetchRFQDetails(currentPage);
        await fetchReplies(selectedRFQ?._id);

        // Refresh the selected RFQ
        if (selectedRFQ) {
          const updatedRFQ = await axios.get(
            `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/${selectedRFQ._id}`,
            { withCredentials: true },
          );
          if (updatedRFQ.data.success) {
            setSelectedRFQ(updatedRFQ.data.data);
          }
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit counter offer",
      );
    } finally {
      setProcessingCounter(false);
    }
  };

  // Accept Counter Offer
  const handleAcceptCounterOffer = async () => {
    setProcessingCounter(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/${selectedRFQ?._id}/accept-counter`,
        {},
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Counter offer accepted! Order confirmed.");
        setShowAcceptCounterModal(false);
        setShowDetailModal(false);
        setShowConversationModal(false);
        await fetchRFQDetails(currentPage);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to accept counter offer",
      );
    } finally {
      setProcessingCounter(false);
    }
  };

  // Reject Counter Offer
  const handleRejectCounterOffer = async () => {
    if (!rejectCounterReason.trim()) {
      toast.error("Please provide a reason for rejecting the counter offer");
      return;
    }

    setProcessingCounter(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/${selectedRFQ?._id}/reject-counter`,
        { rejectReason: rejectCounterReason },
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Counter offer rejected");
        setShowRejectCounterModal(false);
        setRejectCounterReason("");
        await fetchRFQDetails(currentPage);
        await fetchReplies(selectedRFQ?._id);

        // Refresh selected RFQ
        if (selectedRFQ) {
          const updatedRFQ = await axios.get(
            `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/${selectedRFQ._id}`,
            { withCredentials: true },
          );
          if (updatedRFQ.data.success) {
            setSelectedRFQ(updatedRFQ.data.data);
          }
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to reject counter offer",
      );
    } finally {
      setProcessingCounter(false);
    }
  };

  // Fetch Counter Offer History
  const fetchCounterHistory = async (rfqId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/${rfqId}/counter-history`,
        { withCredentials: true },
      );

      if (response.data.success) {
        setCounterOffers(response.data.data.counterOffers);
        setShowCounterHistory(true);
      }
    } catch (error) {
      toast.error("Failed to fetch counter offer history");
    }
  };
  // Calculate stats based on rfqList
  const getStats = () => {
    return {
      total: rfqList.length,
      pending: rfqList.filter((r) => r.status === "pending").length,
      reviewing: rfqList.filter((r) => r.status === "reviewing").length,
      quoted: rfqList.filter((r) => r.status === "quoted").length,
      approved: rfqList.filter((r) => r.status === "approved").length,
    };
  };

  // Fetch replies - use the correct endpoint
  const fetchReplies = async (rfqId, page = 1) => {
    setLoadingReplies(true);
    try {
      // Try both possible endpoint patterns
      let response;
      try {
        // First try: /rfq/:id/replies
        response = await axios.get(
          `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/${rfqId}/replies`,
          {
            params: { page, limit: 50 },
            withCredentials: true,
          },
        );
      } catch (error) {
        if (error.response?.status === 404) {
          // Try alternative: /rfq/replies/:id
          response = await axios.get(
            `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/replies/${rfqId}`,
            {
              params: { page, limit: 50 },
              withCredentials: true,
            },
          );
        } else {
          throw error;
        }
      }

      if (response.data.success) {
        setReplies(response.data.data.replies || []);
        await fetchRFQDetails(currentPage);
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
      toast.error("Failed to load conversation");
    } finally {
      setLoadingReplies(false);
    }
  };

  // Send reply
  const sendReply = async () => {
    if (!newReplyMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const formData = new FormData();
    formData.append("message", newReplyMessage);

    if (isAdmin) {
      if (replyStatus) formData.append("status", replyStatus);
      if (replyQuoteAmount) formData.append("quoteAmount", replyQuoteAmount);
      if (replyValidUntil) formData.append("validUntil", replyValidUntil);
    }

    replyFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      let response;
      try {
        // Try first pattern: /rfq/:id/reply
        response = await axios.post(
          `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/${replyingToRFQ?._id}/reply`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
      } catch (error) {
        if (error.response?.status === 404) {
          // Try alternative: /rfq/reply/:id
          response = await axios.post(
            `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/reply/${replyingToRFQ?._id}`,
            formData,
            {
              withCredentials: true,
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
        } else {
          throw error;
        }
      }

      if (response.data.success) {
        toast.success("Reply sent successfully");
        setNewReplyMessage("");
        setReplyFiles([]);
        setReplyStatus("");
        setReplyQuoteAmount("");
        setReplyValidUntil("");
        await fetchReplies(replyingToRFQ?._id);
        await fetchRFQDetails(currentPage);

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error(error.response?.data?.message || "Failed to send reply");
    }
  };

  // Open conversation modal
  const openConversation = async (rfq) => {
    setSelectedRFQ(rfq);
    setReplyingToRFQ(rfq);
    await fetchReplies(rfq._id);
    setShowConversationModal(true);
    setShowReplyForm(true);
    setNewReplyMessage("");
    setReplyFiles([]);
    setReplyStatus("");
    setReplyQuoteAmount("");
    setReplyValidUntil("");
  };

  const openDeleteModal = (id) => {
    setSelectedRfqId(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedRfqId(null);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!isAdmin) {
      toast.error("Only admin can delete RFQs");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/${selectedRfqId}`,
        { withCredentials: true },
      );

      toast.success("RFQ deleted successfully!");
      await fetchRFQDetails(currentPage);
      closeDeleteModal();
    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "Failed to delete RFQ");
      toast.error(error.response?.data?.message || "Failed to delete RFQ");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const openEditModal = (rfq) => {
    if (!isClient) {
      toast.error("Only clients can edit their RFQs");
      return;
    }

    if (rfq.status !== "pending" && rfq.status !== "reviewing") {
      toast.error("Cannot edit RFQ that has already been quoted or processed");
      return;
    }

    setEditingRFQ(rfq);
    setEditFormData({
      componentType: rfq.componentType || "",
      material: rfq.material || "",
      quantity: rfq.quantity || "",
      drawingNumber: rfq.drawingNumber || "",
      specifications: rfq.specifications || "",
      deadline: rfq.deadline ? rfq.deadline.split("T")[0] : "",
      additionalNotes: rfq.additionalNotes || "",
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateRFQ = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/${editingRFQ._id}`,
        editFormData,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.data.success) {
        toast.success("RFQ updated successfully!");
        setShowEditModal(false);
        setEditingRFQ(null);
        await fetchRFQDetails(currentPage);
      } else {
        toast.error(response.data.message || "Failed to update RFQ");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update RFQ");
    } finally {
      setLoading(false);
    }
  };

  // Accept Quote
  const handleAcceptQuote = async (rfq) => {
    setProcessingQuote(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/${rfq._id}/accept-quote`,
        {},
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Quote accepted successfully! Order confirmed.");
        await fetchRFQDetails(currentPage);
        setShowAcceptModal(false);
        setShowDetailModal(false);
        setShowConversationModal(false);
      } else {
        toast.error(response.data.message || "Failed to accept quote");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept quote");
    } finally {
      setProcessingQuote(false);
    }
  };

  // Decline Quote
  const handleDeclineQuote = async (rfq) => {
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining the quote");
      return;
    }
    setProcessingQuote(true);

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/${rfq._id}/decline-quote`,
        { declineReason },
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Quote declined");
        await fetchRFQDetails(currentPage);
        setShowDeclineModal(false);
        setShowDetailModal(false);
        setShowConversationModal(false);
        setDeclineReason("");
      } else {
        toast.error(response.data.message || "Failed to decline quote");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to decline quote");
    } finally {
      setProcessingQuote(false);
    }
  };

  // Admin status update
  const handleStatusUpdate = async (rfqId, newStatus) => {
    if (!isAdmin) {
      toast.error("Only admin can update status");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/${rfqId}/status`,
        { status: newStatus },
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success(`Status updated to ${newStatus}`);
        await fetchRFQDetails(currentPage);
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQDetails(1);
  }, [filterStatus]);

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: "Pending Review",
        color: "yellow",
        icon: <Clock className="w-4 h-4" />,
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
      },
      reviewing: {
        label: "Under Review",
        color: "blue",
        icon: <Eye className="w-4 h-4" />,
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      },
      quoted: {
        label: "Quote Received",
        color: "purple",
        icon: <FileText className="w-4 h-4" />,
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
      },
      // ===== ADD THIS NEW STATUS FOR COUNTER OFFER =====
      countered: {
        label: "Counter Offer Stage",
        color: "orange",
        icon: <TrendingUp className="w-4 h-4" />,
        bg: "bg-orange-50",
        text: "text-orange-700",
        border: "border-orange-200",
      },
      approved: {
        label: "Order Confirmed",
        color: "green",
        icon: <CheckCircle className="w-4 h-4" />,
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
      },
      rejected: {
        label: "Not Accepted",
        color: "red",
        icon: <XCircle className="w-4 h-4" />,
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      },
    };

    // Return the config or a default one if status not found
    return (
      configs[status] || {
        label: status || "Unknown",
        color: "gray",
        icon: <AlertCircle className="w-4 h-4" />,
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      }
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({ ...prev, files: [...prev.files, ...files] }));
  };

  const removeFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleReplyFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setReplyFiles((prev) => [...prev, ...files]);
  };

  const removeReplyFile = (index) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitRFQ = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData();
      form.append("componentType", formData.componentType);
      form.append("material", formData.material);
      form.append("quantity", formData.quantity);
      form.append("drawingNumber", formData.drawingNumber);
      form.append("specifications", formData.specifications);
      form.append("deadline", formData.deadline);
      form.append("additionalNotes", formData.additionalNotes);
      form.append("companyName", formData.companyName);
      form.append("contactPerson", formData.contactPerson);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("address", formData.address);

      formData.files.forEach((file) => {
        form.append("files", file);
      });

      const res = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq/create`,
        form,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (res.data.success) {
        toast.success("RFQ submitted successfully!");
        setShowRFQModal(false);
        setFormData({
          ...formData,
          componentType: "",
          material: "",
          quantity: "",
          drawingNumber: "",
          specifications: "",
          deadline: "",
          additionalNotes: "",
          files: [],
        });
        fetchRFQDetails(1);
      } else {
        toast.error(res.data.message || "Failed to submit RFQ");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const stats = getStats();
  const hasData = rfqList.length > 0;

  // console.log("Render state:", {
  //   hasData,
  //   rfqListLength: rfqList.length,
  //   totalCount,
  // });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div>
       {/* Welcome Banner */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex gap-3 items-center">
                  <div className="bg-white/20 rounded-xl p-1.5 backdrop-blur-sm">
                    <FileMinus className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Request for Quote

                  </h2>
                </div>
                <p className="text-blue-100">
                  {isAdmin
                    ? "Manage and respond to client RFQs"
                    : "Submit your manufacturing requirements and get competitive quotes"}
                </p>
              </div>
              {!isAdmin && (
                <button
                  onClick={() => setShowRFQModal(true)}
                  className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>New RFQ</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="px-8 py-4 bg-gray-50  ">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {clientProfile.companyName || "Not set"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{clientProfile.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {clientProfile.phone || "Not set"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Show if has data OR is admin */}
        {(hasData || stats.total > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-8">
            <div className="bg-white rounded-xl p-5 shadow-sm ">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">
                    {isAdmin ? "Total RFQs" : "My RFQs"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="bg-blue-100 rounded-lg p-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </p>
                </div>
                <div className="bg-yellow-100 rounded-lg p-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm ">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Under Review</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.reviewing}
                  </p>
                </div>
                <div className="bg-blue-100 rounded-lg p-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm ">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Quotes Received</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.quoted}
                  </p>
                </div>
                <div className="bg-purple-100 rounded-lg p-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm ">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Orders Confirmed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.approved}
                  </p>
                </div>
                <div className="bg-green-100 rounded-lg p-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* No RFQs Message */}
        {!isAdmin && !hasData && !loading && (
          <div className="bg-white rounded-xl shadow-sm  p-12 text-center mb-8">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No RFQs Yet
            </h3>
            <p className="text-gray-500 mb-6">
              You haven't submitted any Request for Quotes yet.
            </p>
            <button
              onClick={() => setShowRFQModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First RFQ</span>
            </button>
          </div>
        )}

        {/* Admin No RFQs Message */}
        {isAdmin && !hasData && !loading && (
          <div className="bg-white rounded-xl shadow-sm  p-12 text-center mb-8">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No RFQs Found
            </h3>
            <p className="text-gray-500">No RFQs have been submitted yet.</p>
          </div>
        )}

        {/* Search and Filter - Only show if has data */}
        {hasData && (
          <div className="bg-white rounded-xl shadow-sm  p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by RFQ number or component type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Review</option>
                <option value="reviewing">Under Review</option>
                <option value="quoted">Quote Received</option>
                <option value="approved">Order Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        )}

        {/* RFQ Table - Only show if has data */}
        {hasData && (
          <div className="bg-white border border-gray-300 overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      S.no
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      RFQ #
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Component
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Qty
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Material
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Submitted By
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Status
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Quote
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {rfqList
                    .filter((rfq) => {
                      const matchesSearch =
                        !searchTerm ||
                        rfq.rfqId
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        rfq.componentType
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase());
                      return matchesSearch;
                    })
                    .map((rfq, index) => {
                      const statusConfig = getStatusConfig(rfq.status);
                      return (
                        <tr
                          key={rfq._id}
                          className={`hover:bg-blue-50 text-center ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            {startIndex + index + 1}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {rfq.rfqId}
                              </p>
                              <p className="text-xs text-gray-500">
                                Deadline:{" "}
                                {rfq.deadline
                                  ? new Date(rfq.deadline).toLocaleDateString()
                                  : "N/A"}
                              </p>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            <p className="text-sm font-medium text-gray-900">
                              {rfq.componentType}
                            </p>
                            <p className="text-xs text-gray-500">
                              {rfq.drawingNumber || "No drawing"}
                            </p>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            <p className="text-sm text-gray-900">
                              {rfq.quantity?.toLocaleString()}
                            </p>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            <p className="text-sm text-gray-900">
                              {rfq.material}
                            </p>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {rfq.companyName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {rfq.contactPerson}
                              </p>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            <div
                              className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                            >
                              {statusConfig.icon}
                              <span>{statusConfig.label}</span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            {rfq.quoteAmount ? (
                              <div>
                                <p className="text-sm font-bold text-green-600">
                                  ₹{rfq.quoteAmount.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Valid till:{" "}
                                  {rfq.validUntil
                                    ? new Date(
                                        rfq.validUntil,
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">Pending</p>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-middle">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openConversation(rfq)}
                                className="relative p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="View Conversation"
                              >
                                <MessageCircle className="w-4 h-4" />
                                {rfq.unreadCount > 0 && (
                                  <span className="absolute -top-1  bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {rfq.unreadCount}
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRFQ(rfq);
                                  setShowDetailModal(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {!isAdmin &&
                                (rfq.status === "pending" ||
                                  rfq.status === "reviewing") && (
                                  <button
                                    onClick={() => openEditModal(rfq)}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Edit RFQ"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                              {isAdmin && (
                                <select
                                  value={rfq.status}
                                  onChange={(e) =>
                                    handleStatusUpdate(rfq._id, e.target.value)
                                  }
                                  className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="reviewing">
                                    Under Review
                                  </option>
                                  <option value="quoted">Quote Received</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => openDeleteModal(rfq._id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {/* {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <button
                  onClick={() => fetchRFQDetails(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => fetchRFQDetails(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )} */}

            {/* pagination */}
            {rfqList.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <span>Rows per page:</span>
                  <select
                    className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1); // Reset to first page when changing rows per page
                    }}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="500">500</option>
                  </select>
                  <span className="text-gray-500">
                    {rfqList.length > 0 ? startIndex + 1 : 0} to{" "}
                    {Math.min(endIndex, rfqList.length)} of {rfqList.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <span className="text-sm font-medium">«</span>
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                      if (pageNum > totalPages) return null;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white shadow-sm"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <span className="text-sm font-medium">»</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading RFQs...</p>
          </div>
        )}
      </div>

      {/* RFQ Submission Modal */}
      {showRFQModal && !isAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Submit New RFQ</h2>
                <p className="text-sm text-gray-500">
                  Fill in your manufacturing requirements
                </p>
              </div>
              <button
                onClick={() => setShowRFQModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitRFQ} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Settings className="w-4 h-4 mr-2 text-blue-600" />
                    Component Specifications
                  </h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Component Type *
                  </label>
                  <select
                    name="componentType"
                    value={formData.componentType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select component type</option>
                    <option>Precision Sheet Metal Components</option>
                    <option>Press Tools & Dies</option>
                    <option>CNC Machined Parts</option>
                    <option>VMC Machined Components</option>
                    <option>Custom Industrial Components</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material Required *
                  </label>
                  <input
                    type="text"
                    name="material"
                    value={formData.material}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Stainless Steel, Aluminum, Brass"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drawing/Part Number
                  </label>
                  <input
                    type="text"
                    name="drawingNumber"
                    value={formData.drawingNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technical Specifications
                  </label>
                  <textarea
                    name="specifications"
                    value={formData.specifications}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Delivery Date *
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Drawings
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.dwg,.dxf,.step,.stp"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF, DWG, DXF, STEP files (max 10MB each)
                      </p>
                    </label>
                  </div>
                  {formData.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {formData.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-8 pt-6 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span>{loading ? "Submitting..." : "Submit RFQ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conversation Modal */}
      {showConversationModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Conversation
                </h2>
                <p className="text-sm text-gray-500">
                  RFQ: {selectedRFQ.rfqId} - {selectedRFQ.componentType}
                </p>
              </div>
              <button
                onClick={() => setShowConversationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {loadingReplies ? (
                <div className="text-center py-8">Loading conversation...</div>
              ) : replies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                replies.map((reply, index) => (
                  <div
                    key={index}
                    className={`flex ${reply.sender === "admin" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        reply.sender === "admin"
                          ? "bg-white border border-gray-200"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold flex items-center gap-2">
                          {reply.sender === "admin" ? (
                            <>
                              <Shield className="w-3 h-3" />
                              {reply.senderName}
                            </>
                          ) : (
                            <>
                              <UserCog className="w-3 h-3" />
                              {reply.senderName}
                            </>
                          )}
                        </span>
                        <span
                          className={`text-xs ${reply.sender === "admin" ? "text-gray-400" : "text-blue-200"}`}
                        >
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {reply.message}
                      </p>
                      {reply.files && reply.files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {reply.files.map((file, idx) => (
                            <a
                              key={idx}
                              href={file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-xs underline flex items-center gap-1 ${
                                reply.sender === "admin"
                                  ? "text-blue-600"
                                  : "text-blue-200"
                              }`}
                            >
                              <Paperclip className="w-3 h-3" />
                              Attachment {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                      {reply.quoteAmount && (
                        <div className="mt-2 p-2 bg-green-100 rounded text-green-800">
                          <p className="text-sm font-bold">
                            Quote: ₹{reply.quoteAmount.toLocaleString()}
                          </p>
                          {reply.validUntil && (
                            <p className="text-xs">
                              Valid until:{" "}
                              {new Date(reply.validUntil).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      {reply.status && reply.status !== selectedRFQ.status && (
                        <div className="mt-2 text-xs font-semibold">
                          Status updated to: {reply.status}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Form */}
            <div className="border-t p-4 bg-white">
              {isAdmin && (
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <select
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">No status change</option>
                    <option value="pending">Pending Review</option>
                    <option value="reviewing">Under Review</option>
                    <option value="quoted">Quote Received</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Quote Amount (₹)"
                    value={replyQuoteAmount}
                    onChange={(e) => setReplyQuoteAmount(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="date"
                    placeholder="Valid Until"
                    value={replyValidUntil}
                    onChange={(e) => setReplyValidUntil(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}
              <textarea
                value={newReplyMessage}
                onChange={(e) => setNewReplyMessage(e.target.value)}
                placeholder="Type your message here..."
                rows="3"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-between items-center mt-2">
                <label className="cursor-pointer text-gray-600 hover:text-gray-800">
                  <input
                    type="file"
                    multiple
                    onChange={handleReplyFileUpload}
                    className="hidden"
                  />
                  <Paperclip className="w-5 h-5" />
                </label>
                {replyFiles.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {replyFiles.length} file(s) selected
                  </span>
                )}
                <button
                  onClick={sendReply}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <SendHorizontal className="w-4 h-4" />
                  Send
                </button>
              </div>
              {replyFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {replyFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-xs"
                    >
                      <span>{file.name}</span>
                      <button
                        onClick={() => removeReplyFile(index)}
                        className="text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RFQ Detail Modal */}
      {showDetailModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">RFQ Details</h2>
                <p className="text-sm text-gray-500">{selectedRFQ.rfqId}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Submitted By Section */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-xs text-blue-600 uppercase mb-2 flex items-center gap-2">
                  <UserCog className="w-3 h-3" />
                  Submitted By
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Company Name</p>
                    <p className="font-medium">{selectedRFQ.companyName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Contact Person</p>
                    <p className="font-medium">{selectedRFQ.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{selectedRFQ.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">{selectedRFQ.phone}</p>
                  </div>
                </div>
              </div>

              {/* Component Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">
                    Component Details
                  </p>
                  <p className="font-semibold">{selectedRFQ.componentType}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Material: {selectedRFQ.material}
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantity: {selectedRFQ.quantity?.toLocaleString()} units
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">
                    Timeline
                  </p>
                  <p className="text-sm">
                    Submitted:{" "}
                    {new Date(selectedRFQ.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm">
                    Required by:{" "}
                    {new Date(selectedRFQ.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>

              
              {/* Action Buttons - Enhanced with Counter Offer */}
              {(selectedRFQ.status === "quoted" ||
                selectedRFQ.status === "countered") &&
                !isAdmin && (
                  <div className="space-y-3 pt-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowAcceptModal(true)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept Quote
                      </button>
                      <button
                        onClick={() => setShowDeclineModal(true)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Decline Quote
                      </button>
                    </div>
                    <button
                      onClick={() => setShowCounterModal(true)}
                      className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Submit Counter Offer
                    </button>
                  </div>
                )}

              {/* For Admin - Action buttons when in counter offer stage */}
              {selectedRFQ.status === "countered" && isAdmin && (
                <div className="space-y-3 pt-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAcceptCounterModal(true)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept Counter Offer
                    </button>
                    <button
                      onClick={() => setShowRejectCounterModal(true)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Counter Offer
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCounterModal(true)}
                    className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Submit Counter Offer
                  </button>
                </div>
              )}

              {/* View Counter History Button */}
              {selectedRFQ.counterOffers?.length > 0 && (
                <button
                  onClick={() => fetchCounterHistory(selectedRFQ._id)}
                  className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <History className="w-4 h-4" />
                  View Counter Offer History (
                  {selectedRFQ.counterOffers?.length} rounds)
                </button>
              )}

              {selectedRFQ.specifications && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">
                    Technical Specifications
                  </p>
                  <p className="text-sm">{selectedRFQ.specifications}</p>
                </div>
              )}

              {selectedRFQ.additionalNotes && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">
                    Additional Notes
                  </p>
                  <p className="text-sm">{selectedRFQ.additionalNotes}</p>
                </div>
              )}

              {selectedRFQ.files && selectedRFQ.files.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">
                    Attached Documents
                  </p>
                  <div className="space-y-2">
                    {selectedRFQ.files.map((file, index) => (
                      <a
                        key={index}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        Document {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes - Show if exists */}
              {selectedRFQ.adminNotes && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <p className="text-xs text-purple-600 uppercase mb-2 flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" />
                    Admin Notes
                  </p>
                  <p className="text-sm text-purple-800">
                    {selectedRFQ.adminNotes}
                  </p>
                </div>
              )}

              {/* Action Buttons - Only show for quoted status and not admin */}
              {selectedRFQ.status === "quoted" && !isAdmin && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAcceptModal(true)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept Quote
                  </button>
                  <button
                    onClick={() => setShowDeclineModal(true)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline Quote
                  </button>
                </div>
              )}

              {/* View Conversation Button */}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openConversation(selectedRFQ);
                }}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                View Full Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Quote Modal */}
      {showAcceptModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold">Accept Quote</h3>
            </div>
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold mb-2">
                  Confirm Quote Acceptance
                </h4>
                <p className="text-gray-600 text-sm">
                  Are you sure you want to accept this quote?
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Quote Amount:</span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{selectedRFQ.quoteAmount?.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAcceptModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAcceptQuote(selectedRFQ)}
                  disabled={processingQuote}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  {processingQuote ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Quote Modal */}
      {showDeclineModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold">Decline Quote</h3>
            </div>
            <div className="p-6">
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason for declining..."
                rows="3"
                className="w-full px-3 py-2 border rounded-lg mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeclineModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeclineQuote(selectedRFQ)}
                  disabled={processingQuote || !declineReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                >
                  {processingQuote ? "Processing..." : "Confirm Decline"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit RFQ Modal */}
      {showEditModal && editingRFQ && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Edit RFQ</h2>
              <button onClick={() => setShowEditModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateRFQ} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Component Type *
                  </label>
                  <select
                    name="componentType"
                    value={editFormData.componentType}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select component type</option>
                    <option>Precision Sheet Metal Components</option>
                    <option>Press Tools & Dies</option>
                    <option>CNC Machined Parts</option>
                    <option>VMC Machined Components</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Material *
                  </label>
                  <input
                    type="text"
                    name="material"
                    value={editFormData.material}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={editFormData.quantity}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Drawing Number
                  </label>
                  <input
                    type="text"
                    name="drawingNumber"
                    value={editFormData.drawingNumber}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Specifications
                  </label>
                  <textarea
                    name="specifications"
                    value={editFormData.specifications}
                    onChange={handleEditInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={editFormData.deadline}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-6 pt-6 border-t flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  {loading ? "Updating..." : "Update RFQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold">Confirm Deletion</h3>
            </div>
            <div className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">
                Are you sure you want to delete this RFQ?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Counter Offer Modal */}
      {showCounterModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Submit Counter Offer
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Current offer: ₹{selectedRFQ.quoteAmount?.toLocaleString()}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Counter Amount (₹) *
                </label>
                <input
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="Enter your counter offer amount"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Explain your counter offer..."
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Valid Until (Optional)
                </label>
                <input
                  type="date"
                  value={counterValidUntil}
                  onChange={(e) => setCounterValidUntil(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <p className="text-blue-800">
                  <strong>Note:</strong>
                  Current round: {selectedRFQ.counterOffers?.length || 0}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCounterModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitCounterOffer}
                  // disabled={processingCounter || !counterAmount}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {processingCounter ? "Submitting..." : "Submit Counter Offer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accept Counter Offer Modal */}
      {showAcceptCounterModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold">Accept Counter Offer</h3>
            </div>
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold mb-2">
                  Confirm Counter Offer Acceptance
                </h4>
                <p className="text-gray-600 text-sm">
                  Are you sure you want to accept this counter offer?
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Counter Offer Amount:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{selectedRFQ.quoteAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valid Until:</span>
                  <span className="text-sm">
                    {selectedRFQ.validUntil
                      ? new Date(selectedRFQ.validUntil).toLocaleDateString()
                      : "Not specified"}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAcceptCounterModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptCounterOffer}
                  disabled={processingCounter}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  {processingCounter ? "Processing..." : "Confirm Acceptance"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Counter Offer Modal */}
      {showRejectCounterModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold">Reject Counter Offer</h3>
            </div>
            <div className="p-6">
              <textarea
                value={rejectCounterReason}
                onChange={(e) => setRejectCounterReason(e.target.value)}
                placeholder="Reason for rejecting this counter offer..."
                rows="3"
                className="w-full px-3 py-2 border rounded-lg mb-4"
              />
              <div className="bg-yellow-50 rounded-lg p-3 mb-4 text-sm">
                <p className="text-yellow-800">
                  <strong>Note:</strong> You'll have{" "}
                  {3 - (selectedRFQ.counterOffers?.length || 0)} more counter
                  offer round(s) remaining.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectCounterModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectCounterOffer}
                  disabled={processingCounter || !rejectCounterReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                >
                  {processingCounter ? "Processing..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Counter Offer History Modal */}
      {showCounterHistory && selectedRFQ && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  Counter Offer History
                </h3>
                <p className="text-sm text-gray-500">
                  RFQ: {selectedRFQ.rfqId}
                </p>
              </div>
              <button
                onClick={() => setShowCounterHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {counterOffers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No counter offers yet
                </div>
              ) : (
                counterOffers.map((offer, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-semibold text-gray-500">
                          Round {offer.round}
                        </span>
                        <p className="font-semibold text-lg text-blue-600">
                          ₹{offer.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            offer.offeredBy === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {offer.offeredBy === "admin" ? "Admin" : "Client"}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(offer.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {offer.message && (
                      <p className="text-sm text-gray-600 mt-2">
                        {offer.message}
                      </p>
                    )}
                    {offer.validUntil && (
                      <p className="text-xs text-gray-500 mt-2">
                        Valid until:{" "}
                        {new Date(offer.validUntil).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HGPToolsRFQ;
