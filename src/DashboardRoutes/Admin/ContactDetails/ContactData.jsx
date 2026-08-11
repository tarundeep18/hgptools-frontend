import React, { useState, useEffect } from "react";
import {
  Eye,
  Trash,
  Download,
  FileText,
  Phone,
  Mail,
  User,
  Calendar,
  Clock,
  X,
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { LiaEyeSolid } from "react-icons/lia";
import { RiContactsBookFill } from "react-icons/ri";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { IoMdEye } from "react-icons/io";

const ContactData = () => {
  const { darkMode } = useOutletContext();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [currentContact, setCurrentContact] = useState({});
  const [viewContact, setViewContact] = useState(null);

  // Fetch all contacts
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/contact`,
        {
          withCredentials: true,
        },
      );

      setContacts(response.data);
      console.log("Contacts Data:", response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch contacts");
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Create contact
  const createContact = async (contactData) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/contact`,
        contactData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        toast.success("Contact created successfully!");
        fetchContacts();
        closeModal();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create contact");
      console.error("Error creating contact:", error);
    }
  };

  // Delete contact
  const deleteContact = async (id) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/contact/${id}`,
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        toast.success("Contact deleted successfully!");
        fetchContacts();
        closeModal();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete contact");
      console.error("Error deleting contact:", error);
    }
  };

  const openModal = (
    mode,
    contact = {
      name: "",
      email: "",
      phnNumber: "",
      description: "",
    },
  ) => {
    setModalMode(mode);
    setCurrentContact(contact);
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentContact({});
    setViewContact(null);
  };

  const handleDelete = () => {
    if (currentContact._id) {
      deleteContact(currentContact._id);
    }
  };

  const handleView = (contact) => {
    setViewContact(contact);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === "add") {
      createContact(currentContact);
    }
    // Note: Edit functionality would need a PUT endpoint
  };

  // handle download

  const handleOpenFile = () => {
    if (viewContact?.drawing) {
      window.open(viewContact.drawing, "_blank");
    }
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

  // Validate phone number (10 digits)
  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  // Validate name (no numbers or special characters)
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z ]+$/;
    return nameRegex.test(name);
  };

  return (
    <div className="mx-auto my-10 px-5 font-sans text-slate-800">
      <div
        className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} rounded-2xl shadow-sm border border-slate-100 overflow-hidden`}
      >
        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } rounded-xl shadow-sm border border-gray-100 p-6 mb-4`}
        >
          <header className="flex justify-between items-center border-b border-slate-50 pb-4">
            <div>
              <h1
                className={`text-3xl font-extrabold m-0 ${darkMode ? "text-blue-500" : "text-blue-800"}`}
              >
                Contact Directory
              </h1>
              <p
                className={`${darkMode ? "text-gray-400" : "text-slate-500"} mt-1`}
              >
                Manage profiles and contact information.
              </p>
            </div>
            <button
              onClick={() => openModal("add")}
              className="bg-blue-800 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Add Contact
            </button>
          </header>
        </div>

        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } rounded-xl shadow-sm border border-gray-100 overflow-hidden`}
        >
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <tr>
                    <th
                      className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        S.no
                      </div>
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        Name
                      </div>
                    </th>

                    <th
                      className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Email
                    </th>

                    <th
                      className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Phone size={14} />
                        Phone
                      </div>
                    </th>

                    <th
                      className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Description
                    </th>

                    <th
                      className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-right ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {contacts.length > 0 ? (
                    contacts.map((contact,index) => (
                      <tr
                        key={contact._id}
                        className={`transition-colors ${
                          darkMode
                            ? "hover:bg-gray-700/40"
                            : "hover:bg-indigo-50/30"
                        }`}
                      >
                        {/* Name */}
                        <td
                          className={`px-6 py-5 font-semibold ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {index+1}
                        </td>
                        <td
                          className={`px-6 py-5 font-semibold ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {contact.name}
                        </td>

                        {/* Email */}
                        <td
                          className={`px-6 py-5 text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          <a
                            href={`mailto:${contact.email}`}
                            className="hover:text-blue-500"
                          >
                            {contact.email}
                          </a>
                        </td>

                        {/* Phone */}
                        <td
                          className={`px-6 py-5 text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          <a
                            href={`tel:${contact.phnNumber}`}
                            className="hover:text-blue-500"
                          >
                            {contact.phnNumber}
                          </a>
                        </td>

                        {/* Description */}
                        <td
                          className={`px-6 py-5 text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          } max-w-xs truncate`}
                        >
                          {contact.description || "—"}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5 text-right flex justify-end gap-4">
                          <button
                            onClick={() => handleView(contact)}
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
                            onClick={() => openModal("delete", contact)}
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
                    /* Premium Empty State */
                    <tr>
                      <td colSpan="5" className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center space-y-4">
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                              darkMode
                                ? "bg-gray-700 text-gray-400"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <RiContactsBookFill />
                          </div>

                          <div>
                            <p
                              className={`text-lg font-semibold ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              No contacts found
                            </p>

                            <p
                              className={`text-sm mt-1 ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Click "Add Contact" to create your first contact.
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
                  <span className="font-medium">{contacts.length}</span> of {" "}
              <span className="font-medium">{contacts.length}</span> contact
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
      </div>

      {/* View Contact Modal */}
      {viewContact && (
        <div className="fixed inset-0  bg-black/50  flex justify-center items-center z-50 p-4 transition-all">
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`}
          >
            {/* Header */}
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
                  Contact Details
                </h2>
                <p
                  className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`}
                >
                  Created on {formatDate(viewContact.createdAt)}
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
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Contact Information */}
              <div
                className={`p-6 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  <User size={20} className="text-blue-500" />
                  Contact Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p
                      className={`text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Full Name
                    </p>
                    <p
                      className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {viewContact.name}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Phone Number
                    </p>
                    <a
                      href={`tel:${viewContact.phnNumber}`}
                      className={`font-medium hover:text-blue-500 ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {viewContact.phnNumber}
                    </a>
                  </div>

                  <div className="col-span-2">
                    <p
                      className={`text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Email Address
                    </p>
                    <a
                      href={`mailto:${viewContact.email}`}
                      className="text-blue-500 hover:underline font-medium"
                    >
                      {viewContact.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewContact.description && (
                <div
                  className={`p-6 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
                >
                  <h3
                    className={`text-lg font-semibold mb-3 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}
                  >
                    <FileText size={20} className="text-green-500" />
                    Description
                  </h3>
                  <p
                    className={`leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {viewContact.description}
                  </p>
                </div>
              )}
              {/* Drawing */}
              <div
                className={`group p-6 rounded-2xl border transition-all duration-300 cursor-pointer
  ${
    darkMode
      ? "bg-gray-800 border-gray-700 hover:border-green-500 hover:bg-gray-800/80"
      : "bg-white border-gray-200 hover:border-green-400 hover:shadow-lg"
  }`}
                onClick={handleOpenFile}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/40">
                      <FileText
                        size={22}
                        className="text-green-600 dark:text-green-400"
                      />
                    </div>

                    <div>
                      <h3
                        className={`text-lg font-semibold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Drawing File
                      </h3>
                      <p className="text-sm text-gray-500">
                        Click to preview document
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4">
                  <button
                    className="w-full py-2.5 rounded-lg bg-green-500 text-white font-medium
      hover:bg-green-600 transition-all duration-200 group-hover:scale-[1.02]"
                  >
                    View Drawing
                  </button>
                </div>
              </div>

              {/* Additional Information */}
              <div
                className={`p-6 rounded-xl ${darkMode ? "bg-gray-700/30" : "bg-gray-50"}`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  <Calendar size={20} className="text-purple-500" />
                  Additional Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p
                      className={`text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Contact ID
                    </p>
                    <p
                      className={`font-mono text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {viewContact._id}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                    >
                      Last Updated
                    </p>
                    <p
                      className={`text-sm flex items-center gap-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      <Clock size={14} />
                      {formatDate(viewContact.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
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

      {/* Add Contact Modal */}
      {modalMode === "add" && (
        <div className="fixed inset-0  bg-black/50 flex justify-center items-center z-50 p-4 transition-all">
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl`}
          >
            {/* Header */}
            <div
              className={`sticky top-0 ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } border-b px-8 py-6 flex justify-between items-center`}
            >
              <h2
                className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Add New Contact
              </h2>
              <button
                onClick={closeModal}
                className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  darkMode
                    ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } transition-all text-2xl`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Name */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={currentContact.name || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCurrentContact({ ...currentContact, name: value });

                    // Real-time validation
                    if (value && !validateName(value)) {
                      toast.error(
                        "Name cannot contain numbers or special characters",
                        { id: "name-error" },
                      );
                    }
                  }}
                  className={`w-full p-3 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter full name"
                  pattern="[a-zA-Z ]+"
                  title="Name cannot contain numbers or special characters"
                />
                <p
                  className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Only letters and spaces allowed
                </p>
              </div>

              {/* Email */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={currentContact.email || ""}
                  onChange={(e) =>
                    setCurrentContact({
                      ...currentContact,
                      email: e.target.value,
                    })
                  }
                  className={`w-full p-3 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter email address"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Phone Number * (10 digits)
                </label>
                <input
                  type="tel"
                  required
                  value={currentContact.phnNumber || ""}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setCurrentContact({ ...currentContact, phnNumber: value });
                  }}
                  className={`w-full p-3 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter 10-digit phone number"
                  pattern="[0-9]{10}"
                  maxLength="10"
                  title="Phone number must be exactly 10 digits"
                />
                <p
                  className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Exactly 10 digits, no spaces or special characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Description
                </label>
                <textarea
                  rows="4"
                  value={currentContact.description || ""}
                  onChange={(e) =>
                    setCurrentContact({
                      ...currentContact,
                      description: e.target.value,
                    })
                  }
                  className={`w-full p-3 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                  placeholder="Enter description (optional)"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
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
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl font-semibold bg-blue-800 text-white hover:bg-blue-700 transition-colors"
                >
                  Create Contact
                </button>
              </div>
            </form>
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
                Delete Contact
              </h2>

              <p
                className={`mb-8 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Are you sure you want to delete{" "}
                <span className="font-semibold">{currentContact.name}</span>?
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

export default ContactData;
