import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  CheckCircle,
  User,
  Mail,
  Phone,
  Building2,
  Upload,
  Loader2,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

const EnquiryPopup = ({ onClose }) => {
  const [formData, setFormData] = useState({
    fName: "",
    email: "",
    phnNumber: "",
    companyName: "",
  });
  const [files, setFiles] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Trigger the enter animation
    const timer = requestAnimationFrame(() => {
      setAnimateIn(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const handleClose = () => {
    setAnimateIn(false); // Start exit animation
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Match this with your transition duration
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    // Limit to 5 files as per backend
    if (selectedFiles.length > 5) {
      setError("You can only upload up to 5 files");
      return;
    }
    setFiles(selectedFiles);
    setError(""); // Clear any previous errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Create FormData object for file upload
      const formDataToSend = new FormData();

      // Append form fields
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Append files
      files.forEach((file) => {
        formDataToSend.append("documents", file);
      });

      // Make API call
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/quote`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        setIsSubmitted(true);
        console.log("form submitted successfully");
        setTimeout(handleClose, 3000);
      }
    } catch (err) {
      console.error("Error submitting quote:", err);
      setError(
        err.response?.data?.message ||
          "Failed to submit quote. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        animateIn
          ? "bg-black/40 backdrop-blur-sm"
          : "bg-black/0 backdrop-blur-none"
      }`}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0" onClick={handleClose} />

      <div
        className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${
          animateIn
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 translate-y-12"
        }`}
      >
        {/* Header */}
        <div className="bg-blue-800 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Request a quote
            </h2>
            <p className="text-blue-100/80 text-xs font-medium tracking-widest mt-1 ">
              Need something manufactured?
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-8">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={18} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-800 uppercase">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-800"
                      size={16}
                    />
                    <input
                      required
                      type="text"
                      name="fName"
                      value={formData.fName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-800/10 focus:border-blue-800 outline-none transition-all"
                      placeholder="John Doe"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-900 uppercase">
                    Work Email
                  </label>
                  <div className="relative group">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-800"
                      size={16}
                    />
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-800/10 focus:border-blue-800 outline-none transition-all"
                      placeholder="name@company.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-900 uppercase">
                    Phone
                  </label>
                  <div className="relative group">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-800"
                      size={16}
                    />
                    <input
                      required
                      type="tel"
                      name="phnNumber"
                      value={formData.phnNumber}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-800/10 focus:border-blue-800 outline-none transition-all"
                      placeholder="+91 1234567890"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-900 uppercase">
                    Company
                  </label>
                  <div className="relative group">
                    <Building2
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-800"
                      size={16}
                    />
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-800/10 focus:border-blue-800 outline-none transition-all"
                      placeholder="Acme Corp"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-blue-900 uppercase">
                  Documentation (Max 5 files)
                </label>
                <label
                  className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl bg-slate-50 transition-all cursor-pointer group ${
                    files.length > 0
                      ? "border-blue-800/50 bg-blue-50/50"
                      : "border-slate-200 hover:border-blue-800/50 hover:bg-blue-50/50"
                  }`}
                >
                  <Upload
                    className={`w-5 h-5 mb-1 transition-colors ${
                      files.length > 0
                        ? "text-blue-800"
                        : "text-slate-400 group-hover:text-blue-800"
                    }`}
                  />
                  <p className="text-xs text-slate-500">
                    {files.length > 0
                      ? `${files.length} file(s) selected`
                      : "Drop files or "}
                    <span className="text-blue-800 font-bold">
                      {files.length > 0 ? "change" : "browse"}
                    </span>
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    disabled={isLoading}
                  />
                </label>

                {/* File list preview */}
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {Array.from(files).map((file, index) => (
                      <div
                        key={index}
                        className="text-xs text-slate-600 flex items-center gap-1"
                      >
                        <div className="w-1 h-1 bg-blue-800 rounded-full"></div>
                        <span className="truncate">{file.name}</span>
                        <span className="text-slate-400">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-800/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Proposal Request
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-10 animate-in fade-in zoom-in duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Application Received
              </h3>
              <p className="text-slate-500 mt-2 text-sm">
                We'll get back to you within 24 hours.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnquiryPopup;
