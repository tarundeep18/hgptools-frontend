import React, { useState, useEffect } from "react";
import { ChevronRight, Camera, User, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Setting = () => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  // Autofill when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
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
  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Updated Data:", formData);

    // 🔥 Here you can call your update API
    // await axios.put("/api/v1/user/update", formData)

    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
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

            {/* Edit Button */}
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
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg  bg-gray-100   cursor-not-allowed"
                    />
                  </div>
                </div>

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

export default Setting;
