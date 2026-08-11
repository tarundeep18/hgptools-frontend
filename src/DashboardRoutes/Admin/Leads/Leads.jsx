import React, { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  MessageSquare,
  Globe,
  Search,
  Filter,
  Plus,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Users,
  Package,
  TrendingUp,
  Calendar,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowUpDown,
  Tag,
  Building2,
  CalendarClock,
  FileInput,
} from "lucide-react";
import { BsFillPeopleFill } from "react-icons/bs";
import axios from "axios";
import toast from "react-hot-toast";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoMdEye } from "react-icons/io";

// ==================== MODAL COMPONENTS ====================

// Lead Form Modal Component
const LeadFormModal = ({
  modalMode,
  formData,
  handleInputChange,
  onSubmit,
  onClose,
  loading,
  handleFileChange,
}) => (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {modalMode === "edit" ? "Edit Lead" : "Create New Lead"}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Information */}
          <div className="col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-blue-600" />
              Company Information
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Company Name *
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter company name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Contact Person
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter contact person name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone *</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Alternate Phone
            </label>
            <input
              type="text"
              name="alternatePhone"
              value={formData.alternatePhone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter alternate phone"
            />
          </div>

          {/* Lead Details */}
          <div className="col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <FileInput className="w-5 h-5 mr-2 text-blue-600" />
              Lead Details
            </h3>
          </div>

          {/* File Upload */}

          <div className="col-span-2 space-y-3">
            <label className="text-sm font-semibold text-gray-800">
              Upload drawing
            </label>

            <label
              htmlFor="dropzone-file"
              className="group flex flex-col items-center justify-center w-full h-64 px-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500"
            >
              <div className="flex flex-col items-center justify-center text-center">
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-blue-100 text-blue-600 group-hover:scale-105 transition-transform">
                  <svg
                    className="w-6 h-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h3a3 3 0 0 0 0-6h-.025a5.5 5.5 0 0 0-10.793-.979A4 4 0 1 0 7 17h2m5 2V10m0 0-2 2m2-2 2 2"
                    />
                  </svg>
                </div>

                {/* Text */}
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-blue-600">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>

                {formData.drawing && (
                  <p className="text-sm text-green-600 mt-2">
                    {formData.drawing.name}
                  </p>
                )}

                <p className="mt-1 text-xs text-gray-500">
                  PDF, CAD, JPG (max 800×400px)
                </p>
              </div>

              <input
                id="dropzone-file"
                type="file"
                name="drawing"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Lead Source
            </label>
            <select
              name="leadSource"
              value={formData.leadSource}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="website">Website</option>
              <option value="call">Call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="reference">Reference</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Inquiry Type
            </label>
            <input
              type="text"
              name="inquiryType"
              value={formData.inquiryType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., CNC Job Work"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Material Type
            </label>
            <input
              type="text"
              name="materialType"
              value={formData.materialType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Stainless Steel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter quantity"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="m">Meters</option>
                <option value="ft">Feet</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Required Date
            </label>
            <input
              type="date"
              name="requiredDate"
              value={formData.requiredDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status and Priority */}
          <div className="col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-blue-600" />
              Status & Priority
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="new">New</option>
              <option value="under-review">Under Review</option>
              <option value="quotation-sent">Quotation Sent</option>
              <option value="negotiation">Negotiation</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter lead description..."
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., urgent, bulk-order, repeat-customer"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 mt-8 -mx-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {modalMode === "edit" ? "Update Lead" : "Create Lead"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

// Delete Confirmation Modal Component
const DeleteModal = ({ currentLead, onDelete, onClose, loading }) => (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
      <div className="p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Trash2 className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete Lead</h2>
        <p className="text-gray-500 mb-8">
          Are you sure you want to delete "{currentLead?.companyName}"? This
          action cannot be undone.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            disabled={loading}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Lead Details Modal Component
const LeadDetailsModal = ({
  inquiry,
  onClose,
  onEdit,
  addNote,
  getStatusBadge,
  getPriorityBadge,
}) => {
  if (!inquiry) return null;

  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative mx-auto p-6 border w-full max-w-4xl shadow-2xl rounded-3xl bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Lead Details: {inquiry.leadId || inquiry._id?.slice(-6)}
            </h2>
            <p className="text-sm text-gray-500">
              Created on {new Date(inquiry.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <section className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
              <h3 className="text-blue-800 font-bold flex items-center mb-4">
                <Users className="w-5 h-5 mr-2" /> Company Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Company:</span>
                  <span className="font-medium">{inquiry.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contact:</span>
                  <span className="font-medium">{inquiry.contactPerson}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-blue-600">{inquiry.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{inquiry.phone}</span>
                </div>
                {inquiry.alternatePhone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Alt Phone:</span>
                    <span className="font-medium">
                      {inquiry.alternatePhone}
                    </span>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <h3 className="text-gray-800 font-bold flex items-center mb-4">
                <FileText className="w-5 h-5 mr-2" /> Project Requirements
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{inquiry.inquiryType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Material:</span>
                  <span className="font-medium">{inquiry.materialType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">
                    {inquiry.quantity} {inquiry.unit}
                  </span>
                </div>
                <div className="pt-3">
                  <p className="text-sm text-gray-700 italic">
                    "{inquiry.description}"
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <section className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <h3 className="text-gray-800 font-bold mb-4 flex items-center">
                <CalendarClock className="w-5 h-5 mr-2" /> Status & Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  {getStatusBadge(inquiry.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Priority:</span>
                  {getPriorityBadge(inquiry.priority)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Required By:</span>
                  <span className="font-medium">
                    {new Date(inquiry.requiredDate).toLocaleDateString()}
                  </span>
                </div>
                {inquiry.quotationSentAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quotation Sent:</span>
                    <span className="font-medium">
                      {new Date(inquiry.quotationSentAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Notes Section */}
            <section className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <h3 className="text-gray-800 font-bold mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" /> Notes & Activity
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {inquiry.notes?.map((note, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded-xl border border-gray-100"
                  >
                    <p className="text-sm text-gray-700">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(note.createdAt).toLocaleString()} -{" "}
                      {note.createdBy?.name}
                    </p>
                  </div>
                ))}
                {(!inquiry.notes || inquiry.notes.length === 0) && (
                  <p className="text-sm text-gray-400 italic">No notes yet</p>
                )}
              </div>

              {/* Add Note Form */}
              <div className="mt-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const content = formData.get("note");
                    if (content.trim()) {
                      addNote(inquiry._id, content);
                      e.target.reset();
                    }
                  }}
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="note"
                      placeholder="Add a note..."
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/* Status Timeline */}
            {inquiry.statusTimeline && inquiry.statusTimeline.length > 0 && (
              <section className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h3 className="text-gray-800 font-bold mb-4">
                  Status Timeline
                </h3>
                <div className="space-y-3">
                  {inquiry.statusTimeline.map((timeline, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-blue-600"></div>
                      <div>
                        <p className="text-sm">
                          Changed to{" "}
                          <span className="font-medium">{timeline.status}</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(timeline.changedAt).toLocaleString()} -{" "}
                          {timeline.changedBy?.name}
                        </p>
                        {timeline.notes && (
                          <p className="text-xs text-gray-500 mt-1">
                            {timeline.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t mt-6 pt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              onEdit(inquiry);
            }}
            className="px-6 py-2 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <MdEdit className="w-4 h-4" />
            Edit Lead
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN LEADS COMPONENT ====================

const Leads = () => {
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState([]);
  const [modalMode, setModalMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [currentLead, setCurrentLead] = useState(null);
  const [drawing, setDrawing] = useState(null);

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    alternatePhone: "",
    leadSource: "website",
    inquiryType: "",
    materialType: "",
    quantity: "",
    unit: "pcs",
    requiredDate: "",
    status: "new",
    priority: "medium",
    description: "",
    tags: "",
    drawing: null,
  });

  // Fetch leads with filters
  const fetchLeads = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...(filterStatus !== "all" && { status: filterStatus }),
        ...(filterPriority !== "all" && { priority: filterPriority }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/leads?${params}`,
        { withCredentials: true },
      );

      setLeads(response.data.data || []);
      setPagination(
        response.data.pagination || {
          page: 1,
          limit: 10,
          total: response.data.data?.length || 0,
          pages: 1,
        },
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/leads/stats/overview`,
        { withCredentials: true },
      );
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchLeads(1);
    fetchStats();
  }, [filterStatus, filterPriority, searchTerm]);

  // Create lead
  const createLead = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();

      // append all form fields
      Object.keys(formData).forEach((key) => {
        if (key === "drawing" && formData.drawing) {
          payload.append("drawing", formData.drawing);
        } else {
          payload.append(key, formData[key]);
        }
      });

      console.log("FormData entries:");
      for (let pair of payload.entries()) {
        console.log(pair[0], pair[1]);
      }

      await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/leads`,
        payload,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.success("Lead created successfully");
      closeModal();
      fetchLeads(1);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  // Update lead
  const updateLead = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tagsArray = formData.tags
        ? formData.tags.split(",").map((tag) => tag.trim())
        : [];
      const dataToSend = { ...formData, tags: tagsArray };

      await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/leads/${currentLead._id}`,
        dataToSend,
        { withCredentials: true },
      );

      toast.success("Lead updated successfully");
      closeModal();
      fetchLeads(pagination.page);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update lead");
    } finally {
      setLoading(false);
    }
  };

  // Delete lead
  const deleteLead = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/leads/${currentLead._id}`,
        { withCredentials: true },
      );

      toast.success("Lead deleted successfully");
      closeModal();
      fetchLeads(pagination.page);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete lead");
    } finally {
      setLoading(false);
    }
  };

  // Fetch single lead
  const fetchLeadById = async (id) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/leads/${id}`,
        { withCredentials: true },
      );
      setSelectedInquiry(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch lead details");
    }
  };

  // Add note
  const addNote = async (leadId, content) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/leads/${leadId}/notes`,
        { content },
        { withCredentials: true },
      );

      toast.success("Note added successfully");
      fetchLeadById(leadId);
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  const openModal = (mode, lead = null) => {
    setModalMode(mode);
    setCurrentLead(lead);
    if (lead && (mode === "edit" || mode === "view" || mode === "delete")) {
      setFormData({
        companyName: lead.companyName || "",
        contactPerson: lead.contactPerson || "",
        email: lead.email || "",
        phone: lead.phone || "",
        alternatePhone: lead.alternatePhone || "",
        leadSource: lead.leadSource || "website",
        inquiryType: lead.inquiryType || "",
        materialType: lead.materialType || "",
        quantity: lead.quantity || "",
        unit: lead.unit || "pcs",
        requiredDate: lead.requiredDate
          ? new Date(lead.requiredDate).toISOString().split("T")[0]
          : "",
        status: lead.status || "new",
        priority: lead.priority || "medium",
        description: lead.description || "",
        tags: lead.tags?.join(", ") || "",
      });
    } else {
      setFormData({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        alternatePhone: "",
        leadSource: "website",
        inquiryType: "",
        materialType: "",
        quantity: "",
        unit: "pcs",
        requiredDate: "",
        status: "new",
        priority: "medium",
        description: "",
        tags: "",
      });
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentLead(null);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        drawing: file,
      }));
    }
  };
  const handleView = async (lead) => {
    await fetchLeadById(lead._id);
  };

  const handleEdit = (lead) => {
    openModal("edit", lead);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: AlertCircle,
        label: "New",
      },
      "under-review": {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        label: "Under Review",
      },
      "quotation-sent": {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: FileText,
        label: "Quotation Sent",
      },
      negotiation: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: TrendingUp,
        label: "Negotiation",
      },
      confirmed: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        label: "Confirmed",
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        label: "Rejected",
      },
    };
    const config = statusConfig[status] || statusConfig.new;
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-green-100 text-green-800 border-green-200",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${priorityConfig[priority]}`}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getLeadSourceIcon = (source) => {
    const icons = {
      website: <Globe className="w-4 h-4" />,
      call: <Phone className="w-4 h-4" />,
      whatsapp: <MessageSquare className="w-4 h-4" />,
      email: <Mail className="w-4 h-4" />,
      reference: <BsFillPeopleFill className="w-4 h-4" />,
    };
    return icons[source] || <Globe className="w-4 h-4" />;
  };

  // Stats Cards Component
  const StatsCards = () => {
    if (!stats) return null;

    const cards = [
      {
        label: "Total Leads",
        value: stats.total,
        icon: Users,
        color: "bg-blue-500",
        change: "+12%",
      },
      {
        label: "New Leads",
        value: stats.byStatus?.new || 0,
        icon: AlertCircle,
        color: "bg-yellow-500",
        change: "+5%",
      },
      {
        label: "Confirmed",
        value: stats.byStatus?.confirmed || 0,
        icon: CheckCircle,
        color: "bg-green-500",
        change: "+8%",
      },
      {
        label: "Conversion Rate",
        value: `${Math.round((stats.byStatus?.confirmed / stats.total) * 100) || 0}%`,
        icon: TrendingUp,
        color: "bg-purple-500",
        change: "+2%",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                <p className="text-xs text-green-600 mt-2">
                  {card.change} from last month
                </p>
              </div>
              <div className={`${card.color} p-4 rounded-2xl text-white`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Leads Table Component
  const LeadsTable = () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* Table Header with Filters */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                className="text-sm bg-transparent focus:outline-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="under-review">Under Review</option>
                <option value="quotation-sent">Quotation Sent</option>
                <option value="negotiation">Negotiation</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <select
                className="text-sm bg-transparent focus:outline-none"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-80">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => openModal("create")}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </button>
            <button
              onClick={() => fetchLeads(1)}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead Info
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Required Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-gray-500">Loading leads...</span>
                  </div>
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-12 h-12 text-gray-300" />
                    <span className="text-gray-500">No leads found</span>
                    <button
                      onClick={() => openModal("create")}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create your first lead
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead._id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {lead.leadId || lead._id?.slice(-6)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {lead.contactPerson || "N/A"}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        {getLeadSourceIcon(lead.leadSource)}
                        <span className="capitalize">{lead.leadSource}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {lead.companyName}
                    </div>
                    <div className="text-sm text-gray-500">{lead.email}</div>
                    <div className="text-xs text-gray-400">{lead.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {lead.inquiryType || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {lead.materialType || "N/A"}
                    </div>
                    <div className="text-xs font-medium text-gray-700 mt-1">
                      Qty: {lead.quantity} {lead.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {getStatusBadge(lead.status)}
                      {getPriorityBadge(lead.priority)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(lead.requiredDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleView(lead)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="View Details"
                      >
                        <IoMdEye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openModal("edit", lead)}
                        className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-600"
                        title="Edit"
                      >
                        <MdEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openModal("delete", lead)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                        title="Delete"
                      >
                        <MdDelete className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-medium">
            {(pagination.page - 1) * pagination.limit + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{" "}
          of <span className="font-medium">{pagination.total}</span> leads
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => fetchLeads(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          {[...Array(pagination.pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => fetchLeads(i + 1)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                pagination.page === i + 1
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 hover:bg-white"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => fetchLeads(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Leads Management</h1>
          <p className="text-gray-500 mt-1">
            Track and manage your sales leads efficiently
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Leads Table */}
        <LeadsTable />
      </main>

      {/* Modals */}
      {modalMode === "create" && (
        <LeadFormModal
          modalMode={modalMode}
          formData={formData}
          handleInputChange={handleInputChange}
          onSubmit={createLead}
          onClose={closeModal}
          loading={loading}
        />
      )}

      {modalMode === "edit" && (
        <LeadFormModal
          modalMode={modalMode}
          formData={formData}
          handleInputChange={handleInputChange}
          onSubmit={updateLead}
          onClose={closeModal}
          loading={loading}
        />
      )}

      {modalMode === "delete" && (
        <DeleteModal
          currentLead={currentLead}
          onDelete={deleteLead}
          onClose={closeModal}
          loading={loading}
        />
      )}

      {/* Inquiry Details Modal */}
      {selectedInquiry && (
        <LeadDetailsModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onEdit={handleEdit}
          addNote={addNote}
          getStatusBadge={getStatusBadge}
          getPriorityBadge={getPriorityBadge}
        />
      )}
    </div>
  );
};

export default Leads;
