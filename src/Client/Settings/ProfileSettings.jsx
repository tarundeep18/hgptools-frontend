import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Camera,
  User,
  Mail,
  Building2,
  Phone,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

const ProfileSettings = () => {
  const { user } = useAuth();
  const { singleUser, updateSingleUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    companyName: "",
    phoneNumber: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  // Autofill form when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
        companyName: user.companyName || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  // Handle input change
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle Save
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?._id) {
      toast.error("User ID is missing!");
      return;
    }

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/update/${user._id}`,
        formData,
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);

        // Update context with latest data
        updateSingleUser({
          ...singleUser,
          name: response.data.updatedUser.fname,
          lname: response.data.updatedUser.lname,
          companyName: response.data.updatedUser.companyName,
          phoneNumber: response.data.updatedUser.phoneNumber,
          email: response.data.updatedUser.email,
          role: response.data.updatedUser.role,
          status: response.data.updatedUser.status,
        });
      } else {
        toast.error(response.data.message || "Failed to update profile.");
      }
    } catch (error) {
      // console.error("Error updating profile:", error);
      // const message =
      //   error.response?.data?.message || "Failed to update profile. Try again.";
      // toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
          <span className="hover:text-slate-800 cursor-pointer">Dashboard</span>
          <ChevronRight size={16} />
          <span className="font-medium text-slate-900">Settings</span>
        </nav>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Account Settings
              </h2>
              <p className="text-slate-500 text-sm">
                Update your personal details and manage your account
                preferences.
              </p>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-800 text-white rounded-lg text-sm font-medium hover:bg-blue-900"
              >
                Edit
              </button>
            )}
          </div>

          <div className="p-6 space-y-8">
            {/* Profile Picture Section */}
            <section>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Personal Information
              </h3>

              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                    <User size={40} className="text-slate-400" />
                  </div>

                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer">
                      <Camera size={20} className="text-white" />
                      <input type="file" className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </section>

            {/* Form Section */}
            <section>
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 outline-none"
                  />
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Role
                  </label>

                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Company Name
                  </label>

                  <div className="relative">
                    <Building2
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 outline-none"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 outline-none"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Buttons */}
                {isEditing && (
                  <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 bg-gray-200 rounded-lg"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-900"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
