// EditDispatchModal.jsx - Fixed version
import React, { useState, useEffect } from "react";
import {
  X,
  Truck,
  FileText,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle,
  File,
  Edit2,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const EditDispatchModal = ({ 
  dispatchId, 
  onClose, 
  onSuccess,
  poNumber,
  companyName,
  itemCode,
  itemDescription
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  const [formData, setFormData] = useState({
    batchNumber: "",
    dispatchQuantity: "",
    dispatchDate: "",
    dispatchedBy: "",
    notes: "",
    billNumber: "",
    billFile: null,
    status: "confirmed",
  });
  
  const [originalData, setOriginalData] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Log the dispatchId when modal opens
  useEffect(() => {
    console.log("EditDispatchModal opened with dispatchId:", dispatchId);
    if (dispatchId) {
      fetchDispatchDetails();
    } else {
      console.error("No dispatchId provided to EditDispatchModal");
      setFetchLoading(false);
      setError("No dispatch ID provided");
    }
  }, [dispatchId]);

  const fetchDispatchDetails = async () => {
    try {
      setFetchLoading(true);
      setError(null);
      
      const url = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch-orders/${dispatchId}`;
      console.log("Fetching dispatch from:", url);
      
      const response = await axios.get(url, { 
        withCredentials: true 
      });

      console.log("API Response:", response.data);

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        console.log("Dispatch data received:", data);
        
        setOriginalData(data);
        setFormData({
          batchNumber: data.batchNumber || "",
          dispatchQuantity: data.dispatchQuantity || "",
          dispatchDate: data.dispatchDate ? data.dispatchDate.split('T')[0] : "",
          dispatchedBy: data.dispatchedBy || "",
          notes: data.notes || "",
          billNumber: data.billNumber || "",
          billFile: null,
          status: data.status || "confirmed",
        });
        
        if (data.billFile) {
          setFilePreview(data.billFile);
        }
      } else {
        console.error("API returned unsuccessful:", response.data);
        setError(response.data?.message || "Failed to fetch dispatch details");
        showNotification("error", response.data?.message || "Failed to fetch dispatch details");
      }
    } catch (error) {
      console.error("Error fetching dispatch:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      let errorMessage = "Failed to fetch dispatch details";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = "Dispatch record not found";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to edit this dispatch";
      } else if (error.response?.status === 401) {
        errorMessage = "Please login to edit dispatch";
      }
      
      setError(errorMessage);
      showNotification("error", errorMessage);
    } finally {
      setFetchLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!validTypes.includes(file.type)) {
        showNotification("error", "Please upload PDF, JPEG, or PNG files only");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showNotification("error", "File size should be less than 5MB");
        return;
      }
      setFormData((prev) => ({ ...prev, billFile: file }));
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFormData((prev) => ({ ...prev, billFile: null }));
    setFilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.dispatchQuantity || parseFloat(formData.dispatchQuantity) <= 0) {
      showNotification("error", "Please enter a valid dispatch quantity");
      return;
    }

    if (!formData.billNumber?.trim()) {
      showNotification("error", "Please enter a bill number");
      return;
    }

    if (!formData.dispatchDate) {
      showNotification("error", "Please select a dispatch date");
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("dispatchQuantity", formData.dispatchQuantity);
      submitData.append("dispatchDate", formData.dispatchDate);
      submitData.append("batchNumber", formData.batchNumber);
      submitData.append("notes", formData.notes);
      submitData.append("dispatchedBy", formData.dispatchedBy || user?.user?.name || "Admin");
      submitData.append("billNumber", formData.billNumber);
      submitData.append("status", formData.status);

      if (formData.billFile) {
        submitData.append("billFile", formData.billFile);
      }

      const url = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch-orders/${dispatchId}`;
      console.log("Updating dispatch at:", url);
      
      const response = await axios.put(url, submitData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Update response:", response.data);

      if (response.data.success) {
        showNotification("success", "Dispatch updated successfully!");
        setTimeout(() => {
          if (onSuccess) onSuccess();
          if (onClose) onClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Error updating dispatch:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMessage = "Failed to update dispatch";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      showNotification("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (fetchLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Loading dispatch details...</p>
          <p className="text-xs text-slate-400 mt-2">Dispatch ID: {dispatchId}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Dispatch</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all"
            >
              Close
            </button>
            <button
              onClick={fetchDispatchDetails}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-auto">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl backdrop-blur-sm ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          } animate-slide-in max-w-md`}>
            <div className="flex items-center">
              {notification.type === "success" ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" />
              Edit Dispatch
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {poNumber || originalData?.poNumber} - {companyName || originalData?.companyName}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Dispatch ID: {dispatchId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Item Info */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Item Code:</span>
                <span className="font-medium text-slate-800">
                  {itemCode || originalData?.itemCode}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Description:</span>
                <span className="font-medium text-slate-800">
                  {itemDescription || originalData?.itemDescription}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Current Status:</span>
                <span className={`font-medium ${
                  formData.status === "confirmed" ? "text-emerald-600" : "text-amber-600"
                }`}>
                  {formData.status?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Rest of the form fields... */}
            {/* (Keep all the form fields from your original EditDispatchModal) */}
            
            {/* Bill Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bill Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="billNumber"
                value={formData.billNumber}
                onChange={handleInputChange}
                placeholder="Enter bill/invoice number"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                required
              />
            </div>

            {/* Dispatch Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dispatch Quantity <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="dispatchQuantity"
                  step="any"
                  min="1"
                  value={formData.dispatchQuantity}
                  onChange={handleInputChange}
                  placeholder="Enter quantity"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none pr-24"
                  required
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-slate-400">
                  {originalData?.unit || "pcs"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Original quantity: {originalData?.originalQuantity || "N/A"} {originalData?.unit || "pcs"}
              </p>
            </div>

            {/* Dispatch Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dispatch Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dispatchDate"
                value={formData.dispatchDate}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                required
              />
            </div>

            {/* Batch Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Batch Number
              </label>
              <input
                type="number"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleInputChange}
                min="1"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
              />
            </div>

            {/* Dispatched By */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dispatched By
              </label>
              <input
                type="text"
                name="dispatchedBy"
                value={formData.dispatchedBy}
                onChange={handleInputChange}
                placeholder="Name of person dispatching"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none bg-white"
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any additional notes..."
                rows="3"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
              />
            </div>

            {/* Bill File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bill File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-xl hover:border-blue-400 transition-colors">
                {!formData.billFile && !filePreview ? (
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600">
                      <label
                        htmlFor="bill-upload-edit"
                        className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="bill-upload-edit"
                          name="bill-upload-edit"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      PDF, PNG, JPG up to 5MB
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <File className="h-8 w-8 text-blue-500" />
                      <div className="text-sm">
                        <p className="font-medium text-slate-700">
                          {formData.billFile ? formData.billFile.name : filePreview?.split('/').pop() || "Current file"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formData.billFile 
                            ? `${(formData.billFile.size / 1024).toFixed(2)} KB`
                            : "Current file"
                          }
                        </p>
                      </div>
                      {filePreview && !formData.billFile && (
                        <a
                          href={filePreview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          View
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
              {(formData.billFile || filePreview) && (
                <p className="text-xs text-amber-600 mt-1">
                  {formData.billFile 
                    ? "New file will replace existing bill" 
                    : "Current file will be kept"
                  }
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <Truck className="w-4 h-4" />
              Update Dispatch
            </button>
          </div>
        </form>

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
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out;
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
    </div>
  );
};

export default EditDispatchModal;