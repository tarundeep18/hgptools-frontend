import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import EmailModal from "./EmailModal";
import { MdDelete, MdEmail, MdModeEdit } from "react-icons/md";
import toast from "react-hot-toast";

const User = () => {
  const { darkMode } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    fname: "",
    lname: "",
    email: "",
    role: "user",
    status: "active",
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkEmailMode, setBulkEmailMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [emailSentIds, setEmailSentIds] = useState([]);

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/loggedin-user`,
        {
          withCredentials: true,
        },
      );
      setUsers(response.data.users);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Modal Handlers
  const openModal = (mode, user = null) => {
    if (user) {
      setCurrentUser({
        id: user._id,
        fname: user.fname || "",
        lname: user.lname || "",
        email: user.email || "",
        role: user.role || "user",
        status: user.status || "active",
      });
    } else {
      setCurrentUser({
        fname: "",
        lname: "",
        email: "",
        role: "user",
        status: "active",

        // Client fields
        companyName: "",
        contactPerson: "",
        phone: "",
        website: "",
        gstNumber: "",
        industry: "",
        address: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
        currency: "INR",
        paymentTerms: "",
        communication: "Email",
        notes: "",
      });
    }
    setModalMode(mode);
    setError("");
    setSuccess("");
  };

  const closeModal = () => {
    setModalMode(null);
    setBulkEmailMode(false);
    setSelectedUsers([]);
    setCurrentUser({
      fname: "",
      lname: "",
      email: "",
      role: "user",
      status: "active",

      // Client fields
      companyName: "",
      contactPerson: "",
      phone: "",
      website: "",
      gstNumber: "",
      industry: "",
      address: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
      currency: "INR",
      paymentTerms: "",
      communication: "Email",
      notes: "",
    });
    setError("");
    setSuccess("");
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (modalMode === "add") {
        const response = await axios.post(
          `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/register`,
          currentUser,
          {
            withCredentials: true,
          },
        );
        setSuccess("User created successfully!");
        toast.success("User created successful!");
        await fetchUsers();
        closeModal();
      } else if (modalMode === "edit") {
        const response = await axios.put(
          `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/${currentUser.id}`,
          currentUser,
          { withCredentials: true },
        );
        setSuccess("User updated successfully!");
        toast.success("User details edit successful!");
        await fetchUsers();
        closeModal();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "User does not register");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/${currentUser.id}`,
        {
          withCredentials: true,
        },
        
      );
      setSuccess("User deleted successfully!");
      toast.success("User deleted successful!");
      await fetchUsers();
      closeModal();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete user");
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (emailData) => {
    setLoading(true);
    setError("");
    try {
      if (bulkEmailMode && selectedUsers.length > 0) {
        await axios.post(
          "/api/users/send-bulk-email",
          {
            userIds: selectedUsers,
            subject: emailData.subject,
            message: emailData.message,
          },
          { withCredentials: true },
        );
        setSuccess(
          `Emails sent to ${selectedUsers.length} users successfully!`,
        );
      } else {
        await axios.post(
          "/api/users/send-email",
          {
            userId: currentUser.id,
            subject: emailData.subject,
            message: emailData.message,
          },
          { withCredentials: true },
        );
        setSuccess(`Email sent to ${currentUser.email} successfully!`);
      }
      closeModal();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user._id));
    }
  };

  const handleSendWelcome = async (id) => {
    if (!id) return toast.error("User ID is missing");

    try {
      setSendingEmailId(id);

      await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/send-welcome/${id}`,
        {},
        { withCredentials: true },
      );

      toast.success("Welcome email sent successfully!");

      // Mark as sent
      setEmailSentIds((prev) => [...prev, id]);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send email";
      toast.error(message);
    } finally {
      setSendingEmailId(null);
    }
  };

  const [gstLoading, setGstLoading] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [gstError, setGstError] = useState("");

  const verifyGST = async () => {
    if (!currentUser.gstNumber) {
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
        `https://sheet.gstincheck.co.in/check/${apiKey}/${currentUser.gstNumber}`,
        {
          withCredentials: false,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Full GST Response:", data);

      // Extract the data object
      const gstData = data.data || data;

      // Log specific fields for debugging
      console.log("=== GST Data Fields ===");
      console.log("Trade Name (company):", gstData.tradeNam);
      console.log("Legal Name:", gstData.lgnm);
      console.log("GSTIN:", gstData.gstin);
      console.log("Business Type:", gstData.ctb);
      console.log("Registration Date:", gstData.rgdt);
      console.log("Status:", gstData.sts);
      console.log("Address:", gstData.pradr?.adr);
      console.log("City:", gstData.pradr?.addr?.city);
      console.log("State:", gstData.pradr?.addr?.state);

      // Helper function to safely get nested values
      const getSafeValue = (obj, path, defaultValue = "") => {
        return path.split(".").reduce((current, key) => {
          return current && current[key] !== undefined
            ? current[key]
            : defaultValue;
        }, obj);
      };

      // AUTO-FILL all available fields with correct field mappings
      setCurrentUser((prev) => ({
        ...prev,
        // Company Information
        companyName: gstData.tradeNam || gstData.lgnm || prev.companyName || "",
        gstNumber: gstData.gstin || prev.gstNumber,

        // Address Information - using the correct structure from your response
        address:
          gstData.pradr?.adr ||
          getSafeValue(gstData, "pradr.addr.fullAddress") ||
          getSafeValue(gstData, "pradr.addr.addressLine1") ||
          prev.address ||
          "",

        city:
          getSafeValue(gstData, "pradr.addr.city") ||
          getSafeValue(gstData, "pradr.city") ||
          prev.city ||
          "",

        state:
          getSafeValue(gstData, "pradr.addr.state") ||
          getSafeValue(gstData, "pradr.state") ||
          prev.state ||
          "",

        country: prev.country || "India",

        // Contact Information (if available in your response)
        phone:
          gstData.contactNumber ||
          gstData.mobile ||
          gstData.phone ||
          prev.phone ||
          "",

        // Business Information
        industry: gstData.ctb || prev.industry || "",

        // GST specific fields you might want to store
        registrationDate: gstData.rgdt || "",
        gstStatus: gstData.sts || "",
        businessType: gstData.ctb || "",
        natureOfBusiness: gstData.nba ? gstData.nba.join(", ") : "",
      }));

      setGstVerified(true);

      // Show success message with company name
      const companyName = gstData.tradeNam || gstData.lgnm || "GST";
      const status = gstData.sts || "";
      toast.success(
        `✅ ${companyName} verified successfully! ${status ? `Status: ${status}` : ""}`,
      );
    } catch (error) {
      console.error("GST Verification Error:", error);

      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        setGstError(error.response.data?.message || "Invalid GST Number");
        toast.error("Invalid GST Number. Please check and try again.");
      } else if (error.request) {
        console.error("No response received:", error.request);
        setGstError("Network error - Please try again");
        toast.error("Network error. Please check your connection.");
      } else {
        console.error("Error setting up request:", error.message);
        setGstError("Error verifying GST");
        toast.error("Error verifying GST. Please try again.");
      }

      setGstVerified(false);
    } finally {
      setGstLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} py-8`}
    >
      <div className="mx-auto px-4 ">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } rounded-xl shadow-sm border border-gray-100 overflow-hidden`}
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center font-extrabold">
            <h2
              className={`text-2xl md:text-3xl font-bold tracking-tight ${darkMode ? "text-blue-500" : "text-blue-800"}`}
            >
              User Management
            </h2>
            <div className="flex gap-3">
              {selectedUsers.length > 0 && (
                <button
                  onClick={() => {
                    setBulkEmailMode(true);
                    setModalMode("email");
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
                >
                  Email Selected ({selectedUsers.length})
                </button>
              )}
              <button
                onClick={() => openModal("add")}
                className="bg-blue-800 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
              >
                Add New User
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-300 overflow-auto">
            <table className="w-full border-collapse text-sm text-center">
              <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <tr>
                  {/* S.No Column */}
                  <th
                    className={`border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap ${
                      darkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    S.No
                  </th>

                  {["Name", "Email", "Role", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {/* Loading State */}
                {loading && users?.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : users?.length === 0 ? (
                  /* Empty State */
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  /* Data Rows */
                  users?.map((user, index) => (
                    <tr
                      key={user._id}
                      className={`hover:bg-blue-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      {/* Serial Number */}
                      <td
                        className={`border border-gray-300 px-3 py-2 align-middle text-center ${
                          darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        {index + 1}
                      </td>

                      {/* Name */}
                      <td
                        className={`border border-gray-300 px-3 py-2 align-middle text-center${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {user.fname} {user.lname}
                      </td>

                      {/* Email */}
                      <td
                        className={`border border-gray-300 px-3 py-2 align-middle text-center${
                          darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        {user.email}
                      </td>

                      {/* Role */}
                      <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                        <span className="text-xs font-bold bg-indigo-100 px-3 py-1 rounded-full text-indigo-700">
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.status === "active"
                              ? "bg-green-100 text-green-700"
                              : user.status === "inactive"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="border border-gray-300 px-3 py-2 align-middle text-center">
                        <button
                          onClick={() => openModal("edit", user)}
                          className="text-indigo-600 hover:text-indigo-900 transition"
                        >
                          <MdModeEdit className="text-xl" />
                        </button>

                        <button
                          onClick={() => handleSendWelcome(user._id)}
                          disabled={sendingEmailId === user._id}
                          className={`transition relative ${
                            emailSentIds.includes(user._id)
                              ? "text-green-600"
                              : "text-blue-600 hover:text-blue-800"
                          }`}
                        >
                          {sendingEmailId === user._id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                          ) : emailSentIds.includes(user._id) ? (
                            <span className="text-green-600 text-xl">✔</span>
                          ) : (
                            <MdEmail className="text-xl" />
                          )}
                        </button>

                        <button
                          onClick={() => openModal("delete", user)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <MdDelete className="text-xl" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{users.length}</span> of{" "}
              <span className="font-medium">{users.length}</span> users
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
      </div>

      {/* Email Modal */}
      {modalMode === "email" && (
        <EmailModal
          darkMode={darkMode}
          currentUser={currentUser}
          bulkMode={bulkEmailMode}
          selectedCount={selectedUsers.length}
          onClose={closeModal}
          onSend={handleSendEmail}
          loading={loading}
          error={error}
        />
      )}

      {/* Add/Edit Modal */}
      {(modalMode === "add" || modalMode === "edit") && (
        <div className="fixed inset-0 z-50 bg-black/50 transition-all flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="" onClick={closeModal} />

          <div className="relative bg-white rounded-2xl shadow-2xl max-w-7xl overflow-hidden border border-slate-200 transform transition-all">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 tracking-tight">
                  {modalMode === "add" ? "Add New User" : "Edit User"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fill in the details below
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>

            {error && (
              <div className="px-6 pt-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex flex-col w-full max-w-7xl  bg-white rounded-xl shadow-sm overflow-hidden max-h-[90vh] md:max-h-[85vh]"
            >
              {/* Sticky Header (Optional, but great if you want to add a form title later) */}
              {/* <div className="p-6 pb-4 border-b border-slate-100">
    <h3 className="text-lg font-bold text-slate-900">User Profile</h3>
  </div> */}

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Primary User Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={currentUser.fname}
                        onChange={(e) =>
                          setCurrentUser({
                            ...currentUser,
                            fname: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 placeholder-slate-400 text-sm"
                        placeholder="John"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={currentUser.lname}
                        onChange={(e) =>
                          setCurrentUser({
                            ...currentUser,
                            lname: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 placeholder-slate-400 text-sm"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={currentUser.email}
                      onChange={(e) =>
                        setCurrentUser({
                          ...currentUser,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 placeholder-slate-400 text-sm"
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Role
                      </label>
                      <select
                        value={currentUser.role}
                        onChange={(e) =>
                          setCurrentUser({
                            ...currentUser,
                            role: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 text-sm cursor-pointer"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="guest">Guest</option>
                        <option value="client">Client</option>
                        <option value="client">QC</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Status
                      </label>
                      <select
                        value={currentUser.status}
                        onChange={(e) =>
                          setCurrentUser({
                            ...currentUser,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 text-sm cursor-pointer"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Client Information Section */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-slate-900">
                      Client Information
                    </h4>
                    {currentUser.role !== "client" && (
                      <span className="text-xs text-slate-400 font-normal italic">
                        Optional (Required for Client role)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Company Name{" "}
                        {currentUser.role === "client" && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={currentUser.companyName || ""}
                        onChange={(e) =>
                          setCurrentUser({
                            ...currentUser,
                            companyName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 placeholder-slate-400 text-sm"
                        placeholder="ABC Precision Pvt Ltd"
                        required={currentUser.role === "client"}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Contact Person{" "}
                        {currentUser.role === "client" && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={currentUser.contactPerson || ""}
                        onChange={(e) =>
                          setCurrentUser({
                            ...currentUser,
                            contactPerson: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 placeholder-slate-400 text-sm"
                        placeholder="John Smith"
                        required={currentUser.role === "client"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Phone Number{" "}
                        {currentUser.role === "client" && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <input
                        type="tel"
                        value={currentUser.phone || ""}
                        onChange={(e) =>
                          setCurrentUser({
                            ...currentUser,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 placeholder-slate-400 text-sm"
                        placeholder="+91 9876543210"
                        required={currentUser.role === "client"}
                      />
                    </div>

                    {/* GST Number input with verification */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        GST Number
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={15}
                          value={currentUser.gstNumber || ""}
                          onChange={(e) => {
                            setCurrentUser({
                              ...currentUser,
                              gstNumber: e.target.value.toUpperCase(),
                            });
                            // Reset verification status when user changes GST
                            setGstVerified(false);
                            setGstError("");
                          }}
                          className={`flex-1 px-4 py-2.5 border rounded-lg uppercase ${
                            gstVerified
                              ? "border-green-500 bg-green-50"
                              : gstError
                                ? "border-red-500 bg-red-50"
                                : "border-slate-200"
                          }`}
                          placeholder="22AAAAA0000A1Z5"
                        />
                        <button
                          type="button"
                          onClick={verifyGST}
                          disabled={gstLoading || !currentUser.gstNumber}
                          className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {gstLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                              Verifying...
                            </span>
                          ) : (
                            "Verify & Auto-fill"
                          )}
                        </button>
                      </div>

                      {gstVerified && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-600 text-sm flex items-center gap-1">
                            <span>✅</span> GST Verified Successfully! Company
                            details auto-filled.
                          </p>
                          {currentUser.companyName && (
                            <p className="text-xs text-green-700 mt-1">
                              Company:{" "}
                              <strong>{currentUser.companyName}</strong>
                            </p>
                          )}
                        </div>
                      )}

                      {gstError && (
                        <p className="mt-2 text-red-600 text-sm flex items-center gap-1">
                          <span>❌</span> {gstError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Company Website
                    </label>
                    <input
                      type="url"
                      value={currentUser.website || ""}
                      onChange={(e) =>
                        setCurrentUser({
                          ...currentUser,
                          website: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 placeholder-slate-400 text-sm"
                      placeholder="https://company.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Industry
                      </label>
                      <select
                        value={currentUser.industry || ""}
                        onChange={(e) =>
                          setCurrentUser({
                            ...currentUser,
                            industry: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 text-sm cursor-pointer"
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

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Address
                    </label>
                    <textarea
                      rows={3}
                      value={currentUser.address || ""}
                      onChange={(e) =>
                        setCurrentUser({
                          ...currentUser,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 placeholder-slate-400 text-sm resize-none"
                      placeholder="Complete company address"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Country
                      </label>
                      <input
                        type="text"
                        value={currentUser.country || ""}
                        onChange={(e) =>
                          setCurrentUser({
                            ...currentUser,
                            country: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 text-sm"
                        placeholder="United States"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        State
                      </label>
                      <input
                        type="text"
                        value={currentUser.state || ""}
                        onChange={(e) =>
                          setCurrentUser({
                            ...currentUser,
                            state: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 text-sm"
                        placeholder="California"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        value={currentUser.city || ""}
                        onChange={(e) =>
                          setCurrentUser({
                            ...currentUser,
                            city: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 text-sm"
                        placeholder="Los Angeles"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Payment Terms
                      </label>
                      <select
                        value={currentUser.paymentTerms || ""}
                        onChange={(e) =>
                          setCurrentUser({
                            ...currentUser,
                            paymentTerms: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 text-sm cursor-pointer"
                      >
                        <option value="">Select Terms</option>
                        <option value="Advance">Advance</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 45">Net 45</option>
                        <option value="Net 60">Net 60</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Preferred Communication
                      </label>
                      <select
                        value={currentUser.communication || "Email"}
                        onChange={(e) =>
                          setCurrentUser({
                            ...currentUser,
                            communication: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 text-sm cursor-pointer"
                      >
                        <option>Email</option>
                        <option>Phone</option>
                        <option>WhatsApp</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      value={currentUser.notes || ""}
                      onChange={(e) =>
                        setCurrentUser({
                          ...currentUser,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 transition-all text-slate-800 placeholder-slate-400 text-sm resize-none"
                      placeholder="Special requirements, materials, tolerances, certifications..."
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Actions Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-800 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow-sm hover:shadow active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center min-w-[120px]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : modalMode === "add" ? (
                    "Create User"
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalMode === "delete" && (
        <div className="fixed inset-0  bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-opacity"
            onClick={closeModal}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-semibold text-slate-800">
                Confirm Deletion
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>

            {error && (
              <div className="px-6 pt-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              </div>
            )}

            <div className="p-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4 mx-auto">
                <span className="text-red-600 text-xl font-bold">!</span>
              </div>
              <div className="text-center space-y-2 mb-8">
                <p className="text-slate-600">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-900">
                    {currentUser.fname} {currentUser.lname}
                  </span>
                  ?
                </p>
                <p className="text-sm text-slate-500">
                  All data associated with this account will be permanently
                  removed.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;
