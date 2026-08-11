import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Eye,
  Phone,
  Mail,
  FileText,
  X,
  Flag,
  AlertTriangle,
  HelpCircle,
  Headphones,
  MessageSquare,
  CheckCircle2,
  Clock as ClockIcon,
  Star,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  Save,
  TrendingUp,
  Users,
  Award,
  Zap,
  LifeBuoy,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Filter,
  Calendar,
  User,
  Building2,
  Globe,
  Shield,
  Target,
  UserCog,
  ShieldCheck,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const ClientSupportSystem = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showEditTicketModal, setShowEditTicketModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [closingTicketId, setClosingTicketId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    subject: "",
    category: "",
    priority: "",
    description: "",
  });

  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Check if user is admin
  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const isClient = user?.role === "client" || !isAdmin;

  const [clientProfile] = useState({
    id: "HGP-CLIENT-001",
    companyName: user?.companyName || "Company Name",
    managerName: user?.name || "User Name",
    position: user?.role || "Client",
    email: user?.email || "user@example.com",
    phone: user?.phoneNumber ? `+91 ${user.phoneNumber}` : "Phone Number",
    joinedDate: "2023-01-15",
    totalTickets: 0,
    resolvedTickets: 0,
    satisfaction: 4.8,
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // For admin, fetch all tickets; for client, fetch only their tickets
      const endpoint = isAdmin
        ? `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/tickets`
        : `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/tickets/my`;

      const response = await axios.get(endpoint, { withCredentials: true });

      if (response.data.success) {
        const ticketsData = isAdmin
          ? response.data.tickets
          : response.data.tickets;
        setTickets(ticketsData);
        clientProfile.totalTickets = ticketsData.length;
        clientProfile.resolvedTickets = ticketsData.filter(
          (t) => t.status === "resolved" || t.status === "closed",
        ).length;
      } else {
        toast.error(response.data.message || "Failed to fetch tickets");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleNewTicket = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const ticketData = {
      subject: formData.get("subject"),
      category: formData.get("category"),
      priority: formData.get("priority"),
      description: formData.get("description"),
    };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/tickets`,
        ticketData,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.data.success) {
        toast.success("Support ticket created successfully!");
        setShowNewTicketModal(false);
        await fetchTickets();
        setCurrentPage(1);
        e.target.reset();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (ticket) => {
    // Only allow editing if client owns the ticket and status is open/pending
    if (!isClient) {
      toast.error("Only clients can edit tickets");

      return;
    }

    if (ticket.status !== "open" && ticket.status !== "pending") {
      toast.error(
        "Cannot edit tickets that are already in progress or resolved",
      );
      return;
    }

    setEditFormData({
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      description: ticket.description,
    });
    setSelectedTicket(ticket);
    setShowEditTicketModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/tickets/${selectedTicket._id}`,
        editFormData,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.data.success) {
        toast.success("Ticket updated successfully!");
        setShowEditTicketModal(false);
        await fetchTickets();
        if (selectedTicket && selectedTicket._id === response.data.ticket._id) {
          setSelectedTicket(response.data.ticket);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/tickets/${selectedTicket._id}/reply`,
        { message: replyText },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.data.success) {
        toast.success("Reply sent successfully!");
        setSelectedTicket(response.data.ticket);
        setReplyText("");
        await fetchTickets();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  // Admin function to update ticket status (but cannot close tickets directly)
  const handleAdminStatusUpdate = async (ticketId, newStatus) => {
    if (!isAdmin) {
      toast.error("Only admin can update ticket status");
      return;
    }

    // Admin cannot close tickets directly
    if (newStatus === "closed") {
      toast.error(
        "Only clients can close tickets. Please ask the client to close the ticket.",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/tickets/${ticketId}/status`,
        { status: newStatus },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.data.success) {
        toast.success(`Ticket status updated to ${newStatus}`);
        await fetchTickets();
        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket(response.data.ticket);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  // Admin function to delete any ticket
  const handleAdminDeleteTicket = async (ticketId) => {
    if (!isAdmin) {
      toast.error("Only admin can delete tickets");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this ticket?")) return;

    setLoading(true);
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/tickets/${ticketId}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Ticket deleted successfully!");
        setShowTicketModal(false);
        await fetchTickets();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete ticket");
    } finally {
      setLoading(false);
    }
  };

  // Client function to delete their own ticket
  const handleClientDeleteTicket = async (ticketId) => {
    if (!isClient) {
      toast.error("Only clients can delete their own tickets");
      return;
    }

    const ticket = tickets.find((t) => t._id === ticketId);
    if (ticket && ticket.status !== "open" && ticket.status !== "pending") {
      toast.error(
        "Cannot delete tickets that are already in progress or resolved",
      );
      return;
    }

    if (!window.confirm("Are you sure you want to delete this ticket?")) return;

    setLoading(true);
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/tickets/${ticketId}`,
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Ticket deleted successfully!");
        setShowTicketModal(false);
        await fetchTickets();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete ticket");
    } finally {
      setLoading(false);
    }
  };

  // Client function to close ticket with feedback popup
  const handleClientCloseTicket = async (ticket) => {
    if (!isClient) {
      toast.error("Only clients can close tickets");
      return;
    }

    setClosingTicketId(ticket._id);
    setSelectedTicket(ticket);
    setRating(null);
    setFeedback("");
    setShowFeedbackModal(true);
  };

  // Updated: Use combined endpoint for closing with rating
  const handleSubmitFeedbackAndClose = async () => {
    if (!closingTicketId) return;

    if (!rating) {
      toast.error("Please provide a rating before closing the ticket");
      return;
    }

    setLoading(true);
    try {
      // Use the combined endpoint that does both rating and closing in one call
      const response = await axios.patch(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/tickets/${closingTicketId}/close-with-rating`,
        {
          rating: Number(rating),
          feedback: feedback?.trim() || "",
        },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.data.success) {
        toast.success(
          "Ticket closed successfully! Thank you for your feedback!",
        );
        setShowFeedbackModal(false);
        setRating(null);
        setFeedback("");
        setClosingTicketId(null);
        await fetchTickets();
        if (selectedTicket && selectedTicket._id === closingTicketId) {
          setSelectedTicket(response.data.ticket);
        }
      }
    } catch (error) {
      console.error("Failed to close ticket with feedback:", error);
      toast.error(error.response?.data?.message || "Failed to close ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (ticketId, ratingValue) => {
    // Prevent admin from rating
    if (isAdmin) {
      toast.error(
        "Admin cannot rate tickets. Only clients can provide ratings.",
      );
      return;
    }

    console.log("ticketId:", ticketId);
    console.log("ratingValue:", ratingValue);

    if (!ticketId || !ratingValue) {
      toast.error("Invalid rating data");
      return;
    }

    // Don't allow rating if ticket is not closed/resolved
    const ticket = tickets.find((t) => t._id === ticketId);
    if (ticket && ticket.status !== "resolved" && ticket.status !== "closed") {
      toast.error("You can only rate tickets that are resolved or closed");
      return;
    }

    setLoading(true);

    const prevTickets = [...tickets];

    // optimistic update
    const updatedTickets = tickets.map((ticket) =>
      ticket._id === ticketId
        ? {
            ...ticket,
            rating: ratingValue,
            feedback: feedback?.trim() || "",
          }
        : ticket,
    );

    setTickets(updatedTickets);

    if (selectedTicket?._id === ticketId) {
      setSelectedTicket((prev) => ({
        ...prev,
        rating: ratingValue,
        feedback: feedback?.trim() || "",
      }));
    }

    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/tickets/${ticketId}/rating`,
        {
          rating: Number(ratingValue),
          feedback: feedback?.trim() || "",
        },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.data.success) {
        toast.success("Thank you for your feedback!");
        setRating(null);
        setFeedback("");
      }
    } catch (error) {
      console.error("Rating update failed:", error);

      // rollback
      setTickets(prevTickets);

      toast.error(error?.response?.data?.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [isAdmin]);

  const getPriorityConfig = (priority) => {
    const configs = {
      urgent: {
        label: "Urgent",
        icon: <AlertTriangle className="w-3 h-3" />,
        bg: "bg-red-500",
        text: "text-white",
        lightBg: "bg-red-50",
        lightText: "text-red-700",
      },
      high: {
        label: "High",
        icon: <Flag className="w-3 h-3" />,
        bg: "bg-orange-500",
        text: "text-white",
        lightBg: "bg-orange-50",
        lightText: "text-orange-700",
      },
      medium: {
        label: "Medium",
        icon: <ClockIcon className="w-3 h-3" />,
        bg: "bg-yellow-500",
        text: "text-white",
        lightBg: "bg-yellow-50",
        lightText: "text-yellow-700",
      },
      low: {
        label: "Low",
        icon: <CheckCircle className="w-3 h-3" />,
        bg: "bg-green-500",
        text: "text-white",
        lightBg: "bg-green-50",
        lightText: "text-green-700",
      },
    };
    return configs[priority] || configs.low;
  };

  const getStatusConfig = (status) => {
    const configs = {
      open: {
        label: "Open",
        icon: <MessageCircle className="w-3 h-3" />,
        bg: "bg-blue-500",
        text: "text-white",
        lightBg: "bg-blue-50",
        lightText: "text-blue-700",
      },
      pending: {
        label: "Pending",
        icon: <Clock className="w-3 h-3" />,
        bg: "bg-yellow-500",
        text: "text-white",
        lightBg: "bg-yellow-50",
        lightText: "text-yellow-700",
      },
      "in-progress": {
        label: "In Progress",
        icon: <Zap className="w-3 h-3" />,
        bg: "bg-purple-500",
        text: "text-white",
        lightBg: "bg-purple-50",
        lightText: "text-purple-700",
      },
      resolved: {
        label: "Resolved",
        icon: <CheckCircle2 className="w-3 h-3" />,
        bg: "bg-green-500",
        text: "text-white",
        lightBg: "bg-green-50",
        lightText: "text-green-700",
      },
      closed: {
        label: "Closed",
        icon: <XCircle className="w-3 h-3" />,
        bg: "bg-gray-500",
        text: "text-white",
        lightBg: "bg-gray-50",
        lightText: "text-gray-700",
      },
    };
    return configs[status] || configs.open;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket._id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || ticket.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter(
      (t) => t.status === "in-progress" || t.status === "pending",
    ).length,
    resolved: tickets.filter(
      (t) => t.status === "resolved" || t.status === "closed",
    ).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-xl p-2 backdrop-blur-sm">
                      <LifeBuoy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                        Support Center
                      </h1>
                      <p className="text-blue-100 mt-1">
                        {isAdmin
                          ? "Manage all client support tickets"
                          : "We're here to help you 24/7"}
                      </p>
                    </div>
                  </div>
                </div>
                {!isAdmin && (
                  <button
                    onClick={() => setShowNewTicketModal(true)}
                    className="group px-6 py-3 bg-white rounded-xl font-semibold text-blue-600 hover:shadow-2xl transition-all duration-300 flex items-center gap-2 transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Create New Ticket</span>
                  </button>
                )}
              </div>
            </div>

            {/* Client Info Bar - Only show for clients */}
            {!isAdmin && (
              <div className="px-8 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {clientProfile.companyName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {clientProfile.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {clientProfile.phone}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Tickets
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-gray-500">All time tickets</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Open Tickets
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.open + stats.inProgress}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Target className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-gray-500">Awaiting response</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Resolved</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.resolved}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-gray-500">
                  {stats.total > 0
                    ? Math.round((stats.resolved / stats.total) * 100)
                    : 0}
                  % resolution rate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-5 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

              <input
                type="text"
                placeholder={
                  isAdmin
                    ? "Search tickets by subject, ID, or company..."
                    : "Search tickets by subject or ID..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3 w-full lg:w-auto">
              {/* Status */}
              <div className="relative w-full lg:min-w-[170px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-9 pr-8 h-12 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Priority */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full lg:min-w-[150px] px-4 h-12 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Items Per Page */}
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full sm:col-span-2 lg:col-span-1 lg:min-w-[150px] px-4 h-12 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold">{indexOfFirstItem + 1}</span> to{" "}
            <span className="font-semibold">
              {Math.min(indexOfLastItem, filteredTickets.length)}
            </span>{" "}
            of <span className="font-semibold">{filteredTickets.length}</span>{" "}
            tickets
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Ticket List */}
        <div className="space-y-4">
          {loading && tickets.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 md:p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Loading tickets...</p>
            </div>
          ) : (
            currentItems.map((ticket) => {
              const priorityConfig = getPriorityConfig(ticket.priority);
              const statusConfig = getStatusConfig(ticket.status);
              const lastMessage = ticket.messages?.[ticket.messages.length - 1];
              const canEdit =
                (ticket.status === "open" || ticket.status === "pending") &&
                !isAdmin;
              const canRate =
                !isAdmin &&
                (ticket.status === "resolved" || ticket.status === "closed"); // Only clients can rate resolved/closed tickets
              const canClose =
                !isAdmin &&
                (ticket.status === "open" ||
                  ticket.status === "pending" ||
                  ticket.status === "in-progress" ||
                  ticket.status === "resolved");

              return (
                <div
                  key={ticket._id}
                  className="group bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-blue-200 cursor-pointer"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setShowTicketModal(true);
                  }}
                >
                  <div className="p-4 md:p-6">
                    {/* Changed to flex-col on mobile and flex-row on desktop */}
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap mb-3">
                          {/* Show company name for admin view */}
                          {isAdmin && ticket.companyName && (
                            <div className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {ticket.companyName}
                            </div>
                          )}
                          <div
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityConfig.lightBg} ${priorityConfig.lightText} flex items-center gap-1`}
                          >
                            {priorityConfig.icon}
                            {priorityConfig.label}
                          </div>
                          <div
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.lightBg} ${statusConfig.lightText} flex items-center gap-1`}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </div>
                          <div className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">
                            {ticket.category}
                          </div>
                          <div className="flex items-center gap-1 md:gap-2 px-2.5 py-1 rounded-full bg-gray-100 max-w-full overflow-x-auto">
                            {/* Rating stars - only clickable for clients on resolved/closed tickets */}
                            {canRate ? (
                              // Clients can click to rate
                              <>
                                {Array.from({ length: 5 }, (_, i) => (
                                  <span
                                    key={i}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRating(ticket._id, i + 1);
                                    }}
                                    className={`cursor-pointer text-xl md:text-2xl transition ${
                                      i < (ticket.rating || 0)
                                        ? "text-yellow-400"
                                        : "text-gray-300 hover:text-yellow-400"
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="text-xs text-gray-600 ml-1 whitespace-nowrap">
                                  {ticket.rating
                                    ? `${ticket.rating}/5`
                                    : "Not rated"}
                                </span>
                              </>
                            ) : (
                              // Admin can only view rating (stars not clickable)
                              <>
                                {Array.from({ length: 5 }, (_, i) => (
                                  <span
                                    key={i}
                                    className={`text-xl md:text-2xl ${
                                      i < (ticket.rating || 0)
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="text-xs text-gray-600 ml-1 whitespace-nowrap">
                                  {ticket.rating
                                    ? `${ticket.rating}/5`
                                    : "Not rated"}
                                </span>
                                {ticket.rating && (
                                  <span className="text-xs text-blue-600 ml-1 whitespace-nowrap hidden sm:inline">
                                    (View only)
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors break-words">
                          {ticket.subject}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 break-words">
                          {lastMessage?.message || ticket.description}
                        </p>
                        <div className="flex items-center gap-x-4 gap-y-2 text-xs text-gray-500 flex-wrap">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Created:{" "}
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <MessageCircle className="w-3 h-3" />
                            <span>{ticket.messages?.length || 0} messages</span>
                          </div>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            <span>Updated {formatDate(ticket.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right action block: full width & wrap friendly on mobile, borders added for mobile separation */}
                      <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t border-gray-100 md:border-0 flex-wrap">
                        {/* Admin Status Update Dropdown - Removed "Closed" option */}
                        {isAdmin && ticket.status !== "closed" && (
                          <select
                            value={ticket.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleAdminStatusUpdate(
                                ticket._id,
                                e.target.value,
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white cursor-pointer my-1"
                            title="Update Status"
                          >
                            <option value="open">Open</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        )}

                        {canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(ticket);
                            }}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                            title="Edit Ticket"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Client Close Ticket Button */}
                        {canClose && ticket.status !== "closed" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClientCloseTicket(ticket);
                            }}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                            title="Close Ticket"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button - Admin can delete any, Client can delete their own open/pending */}
                        {(isAdmin ||
                          (isClient &&
                            (ticket.status === "open" ||
                              ticket.status === "pending"))) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              isAdmin
                                ? handleAdminDeleteTicket(ticket._id)
                                : handleClientDeleteTicket(ticket._id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete Ticket"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(ticket);
                            setShowTicketModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors hidden md:block" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {!loading && filteredTickets.length === 0 && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 md:p-16 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                No tickets found
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Try adjusting your search or filter criteria
              </p>
              {!isAdmin && (
                <button
                  onClick={() => setShowNewTicketModal(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 inline-flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Ticket
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredTickets.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white shadow-md"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Support Links - Only show for clients */}
        {!isAdmin && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Headphones className="w-7 h-7 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                24/7 Phone Support
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Emergency assistance available
              </p>
              <p className="text-lg font-bold text-blue-600">+91-129-1234567</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Email Support
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Response within 4 hours
              </p>
              <p className="text-sm font-semibold text-green-600">
                support@hgptools.com
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal for Closing Ticket */}
      {showFeedbackModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">
                Rate Your Experience
              </h2>
              <p className="text-green-100 text-sm mt-1">
                Help us improve our support service
              </p>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-gray-700 mb-2">
                  How would you rate the support for ticket:
                </p>
                <p className="font-semibold text-gray-900">
                  {selectedTicket.subject}
                </p>
              </div>

              {/* Rating Stars */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                  Your Rating *
                </label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none transform transition-all duration-200 hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 hover:text-yellow-400"
                        } transition-colors duration-200`}
                      />
                    </button>
                  ))}
                </div>
                {rating && (
                  <p className="text-center text-sm text-gray-600 mt-2">
                    {rating === 5 && "Excellent! 🌟"}
                    {rating === 4 && "Good! 👍"}
                    {rating === 3 && "Average 🤔"}
                    {rating === 2 && "Below Average 😕"}
                    {rating === 1 && "Poor 😞"}
                  </p>
                )}
              </div>

              {/* Feedback Text */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Feedback (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Please share your experience with our support team..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setRating(null);
                    setFeedback("");
                    setClosingTicketId(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedbackAndClose}
                  disabled={!rating || loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Close & Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal - Only for clients */}
      {showNewTicketModal && !isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-300">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Create New Ticket
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  We'll respond within 24 hours
                </p>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleNewTicket} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder="Brief summary of your issue"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    <option>RFQ Status</option>
                    <option>Order Status</option>
                    <option>Quality Issue</option>
                    <option>Technical Support</option>
                    <option>Payment & Billing</option>
                    <option>Delivery & Logistics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    name="priority"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low - General inquiry</option>
                    <option value="medium">Medium - Non-urgent issue</option>
                    <option value="high">High - Important matter</option>
                    <option value="urgent">
                      Urgent - Production stopping issue
                    </option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={6}
                  placeholder="Please provide detailed information about your issue..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 shadow-lg"
              >
                {loading ? "Creating..." : "Create Support Ticket"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Ticket Modal - Only for clients */}
      {showEditTicketModal && selectedTicket && !isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Edit Ticket
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Update your ticket details
                </p>
              </div>
              <button
                onClick={() => setShowEditTicketModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateTicket} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={editFormData.subject}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={editFormData.category}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select category</option>
                    <option>RFQ Status</option>
                    <option>Order Status</option>
                    <option>Quality Issue</option>
                    <option>Technical Support</option>
                    <option>Payment & Billing</option>
                    <option>Delivery & Logistics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    name="priority"
                    value={editFormData.priority}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  >
                    <option value="low">Low - General inquiry</option>
                    <option value="medium">Medium - Non-urgent issue</option>
                    <option value="high">High - Important matter</option>
                    <option value="urgent">
                      Urgent - Production stopping issue
                    </option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition-all resize-none"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Note: Updating description will add a note to the conversation
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditTicketModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? (
                    "Updating..."
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Update Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedTicket.subject}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Ticket #{selectedTicket._id.slice(-8)}
                  {isAdmin && selectedTicket.companyName && (
                    <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {selectedTicket.companyName}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {(selectedTicket.status === "open" ||
                  selectedTicket.status === "pending") &&
                  !isAdmin && (
                    <button
                      onClick={() => {
                        setShowTicketModal(false);
                        openEditModal(selectedTicket);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title="Edit Ticket"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                {/* Delete button - Admin can delete any, Client can delete their own open/pending */}
                {(isAdmin ||
                  (!isAdmin &&
                    (selectedTicket.status === "open" ||
                      selectedTicket.status === "pending"))) && (
                  <button
                    onClick={() =>
                      isAdmin
                        ? handleAdminDeleteTicket(selectedTicket._id)
                        : handleClientDeleteTicket(selectedTicket._id)
                    }
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete Ticket"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Ticket Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusConfig(selectedTicket.status).lightBg} ${getStatusConfig(selectedTicket.status).lightText}`}
                  >
                    {getStatusConfig(selectedTicket.status).icon}
                    <span>{getStatusConfig(selectedTicket.status).label}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Priority</p>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${getPriorityConfig(selectedTicket.priority).lightBg} ${getPriorityConfig(selectedTicket.priority).lightText}`}
                  >
                    {getPriorityConfig(selectedTicket.priority).icon}
                    <span>
                      {getPriorityConfig(selectedTicket.priority).label}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedTicket.category}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(selectedTicket.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2">Rating</p>

                  {selectedTicket.rating ? (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={
                            i < selectedTicket.rating
                              ? "text-yellow-400 text-base"
                              : "text-gray-300 text-base"
                          }
                        >
                          ★
                        </span>
                      ))}

                      <span className="ml-2 text-sm font-semibold text-gray-700">
                        {selectedTicket.rating}/5
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 font-medium">
                      Not rated yet
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Feedback</p>
                  <p className="text-sm font-semibold text-blue-600">
                    {selectedTicket.feedback || "No feedback provided"}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto px-2">
                {selectedTicket.messages?.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${message.sender === "client" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[75%] ${message.sender === "client" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" : "bg-gray-100 text-gray-900"} rounded-2xl px-5 py-3 shadow-sm`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold">
                          {message.sender === "client"
                            ? selectedTicket.managerName ||
                              clientProfile.managerName
                            : "HGP Tools Support"}
                        </span>
                        <span className="text-xs opacity-70">•</span>
                        <span className="text-xs opacity-70">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box - Show for both admin and client, but only if not closed/resolved */}
              {selectedTicket.status !== "closed" &&
                selectedTicket.status !== "resolved" && (
                  <div className="border-t pt-6 mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Your Reply
                    </label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={
                        isAdmin
                          ? "Type your response to the client..."
                          : "Type your reply here..."
                      }
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                    <div className="flex justify-between items-center mt-4">
                      {/* Close ticket button - Only for clients, no longer for admin */}
                      {!isAdmin && selectedTicket.status !== "closed" && (
                        <button
                          onClick={() =>
                            handleClientCloseTicket(selectedTicket)
                          }
                          className="px-5 py-2 text-green-600 hover:text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-all flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Close Ticket
                        </button>
                      )}
                      <button
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || loading}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-md"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>Send Reply</span>
                      </button>
                    </div>
                  </div>
                )}

              {/* Admin Status Update Section - No close option */}
              {isAdmin &&
                selectedTicket.status !== "closed" &&
                selectedTicket.status !== "resolved" && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          Quick Status Update:
                        </span>
                        <select
                          value={selectedTicket.status}
                          onChange={(e) =>
                            handleAdminStatusUpdate(
                              selectedTicket._id,
                              e.target.value,
                            )
                          }
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
                        >
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSupportSystem;
