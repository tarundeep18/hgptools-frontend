import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  AlertTriangle,
  FileText,
  Upload,
  Trash2,
  Camera,
  Package,
  Truck,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  MessageCircle,
  Send,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const REJECTION_REASONS = [
  { id: "damaged", label: "Physical Damage", icon: "⚠️" },
  { id: "defective", label: "Manufacturing Defect", icon: "🔧" },
  { id: "wrong_item", label: "Wrong Item/Specification", icon: "❌" },
  { id: "quality_issue", label: "Quality Standard Not Met", icon: "📊" },
  { id: "packaging", label: "Poor Packaging", icon: "📦" },
  { id: "expired", label: "Expired/Short Shelf Life", icon: "⏰" },
  { id: "quantity_mismatch", label: "Quantity Mismatch", icon: "🔢" },
  { id: "other", label: "Other", icon: "📝" },
];

// Configure axios defaults
axios.defaults.withCredentials = true;

const ItemRejection = ({
  selectedItems = [],
  onClose,
  onSubmit,
  isDemo = false,
}) => {
  const { user } = useAuth();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [rejectionsData, setRejectionsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [authError, setAuthError] = useState(null);

  // Initialize rejection data for each selected item
  useEffect(() => {
    if (selectedItems && selectedItems.length > 0) {
      const initialData = selectedItems.map((item) => ({
        dispatchId: item.dispatchId,
        poNumber: item.poNumber,
        companyName: item.companyName,
        itemCode: item.itemCode,
        description: item.description,
        batchNo: item.batchNumber,
        dispatchDate: item.date,
        dispatchedQuantity: item.quantity,
        unit: item.unit || "pcs",
        billNumber: item.billNumber,
        billFile: item.billFile,
        dispatchedBy: item.dispatchedBy,
        rejectedQuantity: "",
        reason: "",
        subReason: "",
        resolution: "",
        notes: "",
        inspectionDate: new Date().toISOString().split("T")[0],
        inspectorName: user?.name || user?.username || "Quality Inspector",
        severity: "medium",
        requiresReturn: true,
        isPartialRejection: false,
        evidenceFiles: [],
      }));
      setRejectionsData(initialData);
      setAuthError(null);
    }
  }, [selectedItems, user]);

  const currentItem = rejectionsData[currentItemIndex];
  const maxRejectionQty = currentItem?.dispatchedQuantity || 0;
  const isPartialRejection =
    currentItem?.rejectedQuantity &&
    parseFloat(currentItem.rejectedQuantity) < maxRejectionQty;

  const handleFieldChange = (field, value) => {
    setRejectionsData((prev) => {
      const updated = [...prev];
      updated[currentItemIndex] = {
        ...updated[currentItemIndex],
        [field]: value,
      };
      return updated;
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      const isValidType = validTypes.includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    setUploadedFiles([...uploadedFiles, ...validFiles]);

    validFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImages((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      }
    });

    handleFieldChange("evidenceFiles", [
      ...currentItem.evidenceFiles,
      ...validFiles,
    ]);
  };

  const removeFile = (index) => {
    const newFiles = currentItem.evidenceFiles.filter((_, i) => i !== index);
    handleFieldChange("evidenceFiles", newFiles);
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    setPreviewImages(previewImages.filter((_, i) => i !== index));
  };

  const validateStep = () => {
    const errors = {};
    if (
      !currentItem.rejectedQuantity ||
      parseFloat(currentItem.rejectedQuantity) <= 0
    ) {
      errors.rejectedQuantity = "Please enter valid quantity";
    } else if (parseFloat(currentItem.rejectedQuantity) > maxRejectionQty) {
      errors.rejectedQuantity = `Cannot reject more than ${maxRejectionQty} ${currentItem.unit}`;
    }
    if (!currentItem.reason) errors.reason = "Please select rejection reason";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitSingleRejection = async (rejectionData) => {
    const formData = new FormData();
    formData.append("rejectedQuantity", rejectionData.rejectedQuantity);
    formData.append("reason", rejectionData.reason);
    formData.append("subReason", rejectionData.subReason || "");
    formData.append("resolution", rejectionData.resolution);
    formData.append("notes", rejectionData.notes || "");
    formData.append("inspectionDate", rejectionData.inspectionDate);
    formData.append("inspectorName", rejectionData.inspectorName);
    formData.append("severity", rejectionData.severity);
    formData.append("requiresReturn", String(rejectionData.requiresReturn));
    formData.append("isPartialRejection", String(isPartialRejection));
    formData.append("companyName", rejectionData.companyName);

    if (rejectionData.evidenceFiles && rejectionData.evidenceFiles.length > 0) {
      rejectionData.evidenceFiles.forEach((file) => {
        formData.append("evidence", file);
      });
    }

    const url = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rejection/${rejectionData.dispatchId}/reject`;

    const response = await axios.post(url, formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  };

  const handleSubmitAll = async () => {
    if (!validateStep()) {
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    const results = [];
    const errors = [];

    try {
      for (let i = 0; i < rejectionsData.length; i++) {
        const rejection = rejectionsData[i];
        try {
          const result = await submitSingleRejection(rejection);
          results.push(result);
        } catch (error) {
          console.error(
            `Failed to submit rejection for ${rejection.poNumber}:`,
            error,
          );
          errors.push({
            poNumber: rejection.poNumber,
            error: error.response?.data?.message || error.message,
          });
        }
      }

      if (errors.length > 0) {
        toast.error(
          `Submitted ${results.length} rejections. Failed: ${errors.length}\n${errors
            .map((e) => `${e.poNumber}: ${e.error}`)
            .join("\n")}`,
          {
            duration: 6000,
          },
        );
      } else {
        toast.success(`Successfully submitted ${results.length} rejection(s)`);
      }

      if (onSubmit && results.length > 0) {
        onSubmit({
          success: true,
          message: `${results.length} rejection(s) submitted successfully`,
          results,
        });
      }

      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit rejections. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: "bg-blue-100 text-blue-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700",
    };
    return colors[severity] || colors.medium;
  };

  if (!selectedItems || selectedItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-2">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Item Rejection{" "}
                    {selectedItems.length > 1 &&
                      `(${currentItemIndex + 1}/${selectedItems.length})`}
                  </h2>
                  <p className="text-red-100 text-sm">
                    Record quality rejection for dispatched items
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Progress for multiple items */}
        {selectedItems.length > 1 && (
          <div className="px-6 pt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>
                {Math.round(
                  ((currentItemIndex + 1) / selectedItems.length) * 100,
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentItemIndex + 1) / selectedItems.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Stepper */}
        <div className="px-6 border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            {[
              { step: 1, label: "Rejection Details", icon: "📋" },
              { step: 2, label: "Evidence", icon: "📸" },
              { step: 3, label: "Review & Submit", icon: "✅" },
            ].map((step) => (
              <div key={step.step} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.step)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    currentStep >= step.step
                      ? "bg-red-100 text-red-700 font-semibold"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <span>{step.icon}</span>
                  <span className="text-sm hidden sm:inline">{step.label}</span>
                </button>
                {step.step < 3 && (
                  <div className="w-12 h-px bg-gray-300 mx-2 hidden sm:block"></div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentItem && (
            <>
              {/* Step 1: Rejection Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* Dispatch Info Card */}
                  <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-red-500" />
                      Dispatch Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">PO Number:</span>{" "}
                        <span className="font-medium ml-2">
                          {currentItem.poNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Company:</span>{" "}
                        <span className="font-medium ml-2">
                          {currentItem.companyName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Item Code:</span>{" "}
                        <span className="font-medium ml-2">
                          {currentItem.itemCode}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Description:</span>{" "}
                        <span className="font-medium ml-2 truncate">
                          {currentItem.description}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Batch No:</span>{" "}
                        <span className="font-medium ml-2">
                          #{currentItem.batchNo}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Dispatch Date:</span>{" "}
                        <span className="font-medium ml-2">
                          {new Date(
                            currentItem.dispatchDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Dispatched Qty:</span>{" "}
                        <span className="font-medium text-emerald-600 ml-2">
                          {currentItem.dispatchedQuantity} {currentItem.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Bill No:</span>{" "}
                        <span className="font-medium ml-2">
                          {currentItem.billNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Form */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rejection Quantity{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="1"
                            max={maxRejectionQty}
                            value={currentItem.rejectedQuantity}
                            onChange={(e) =>
                              handleFieldChange(
                                "rejectedQuantity",
                                e.target.value,
                              )
                            }
                            className={`w-full border ${validationErrors.rejectedQuantity ? "border-red-300" : "border-gray-200"} rounded-xl px-4 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none pr-16`}
                            placeholder="Enter quantity"
                          />
                          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
                            {currentItem.unit}
                          </span>
                        </div>
                        {validationErrors.rejectedQuantity && (
                          <p className="text-xs text-red-500 mt-1">
                            {validationErrors.rejectedQuantity}
                          </p>
                        )}
                      </div>

                      {/* Severity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Severity Level
                        </label>
                        <select
                          value={currentItem.severity}
                          onChange={(e) =>
                            handleFieldChange("severity", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none"
                        >
                          <option value="low">Low - Minor issues</option>
                          <option value="medium">
                            Medium - Significant issues
                          </option>
                          <option value="high">High - Major defects</option>
                          <option value="critical">
                            Critical - Safety concerns
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {REJECTION_REASONS.map((reason) => (
                          <button
                            key={reason.id}
                            type="button"
                            onClick={() =>
                              handleFieldChange("reason", reason.id)
                            }
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              currentItem.reason === reason.id
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="text-xl mb-1">{reason.icon}</div>
                            <div className="text-xs font-medium">
                              {reason.label}
                            </div>
                          </button>
                        ))}
                      </div>
                      {validationErrors.reason && (
                        <p className="text-xs text-red-500 mt-1">
                          {validationErrors.reason}
                        </p>
                      )}
                    </div>

                    {/* Sub Reason */}
                    {currentItem.reason && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Detailed Reason (Optional)
                        </label>
                        <textarea
                          value={currentItem.subReason}
                          onChange={(e) =>
                            handleFieldChange("subReason", e.target.value)
                          }
                          rows="2"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none"
                          placeholder="Provide specific details about the rejection..."
                        />
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Comments
                      </label>
                      <textarea
                        value={currentItem.notes}
                        onChange={(e) =>
                          handleFieldChange("notes", e.target.value)
                        }
                        rows="3"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none"
                        placeholder="Add any additional information about the rejection..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Evidence Upload */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Upload Evidence
                    </h3>
                    <p className="text-sm text-blue-600">
                      Upload photos, videos, or documents as evidence. Supported
                      formats: JPG, PNG, PDF (Max 5MB each)
                    </p>
                  </div>

                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, PDF up to 5MB
                      </p>
                    </label>
                  </div>

                  {/* Uploaded Files Preview */}
                  {currentItem.evidenceFiles &&
                    currentItem.evidenceFiles.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">
                          Uploaded Files ({currentItem.evidenceFiles.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {currentItem.evidenceFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              {file.type?.startsWith("image/") &&
                              previewImages[index] ? (
                                <img
                                  src={previewImages[index]}
                                  alt={`Evidence ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                              ) : (
                                <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                                  <FileText className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <button
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {file.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-xl p-4">
                    <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Review Rejection Details
                    </h3>
                    <p className="text-sm text-green-600">
                      Please review all information before submitting
                    </p>
                  </div>

                  {/* Review Cards */}
                  <div className="space-y-3">
                    {/* Rejection Summary */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Rejection Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Quantity:</span>{" "}
                          <span className="font-medium ml-2 text-red-600">
                            {currentItem.rejectedQuantity} {currentItem.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span>{" "}
                          <span className="font-medium ml-2">
                            {isPartialRejection ? "Partial" : "Full"} Rejection
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Reason:</span>{" "}
                          <span className="font-medium ml-2">
                            {
                              REJECTION_REASONS.find(
                                (r) => r.id === currentItem.reason,
                              )?.label
                            }
                          </span>
                        </div>

                        <div>
                          <span className="text-gray-500">Severity:</span>{" "}
                          <span
                            className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getSeverityColor(currentItem.severity)}`}
                          >
                            {currentItem.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notes Review */}
                    {currentItem.notes && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Additional Comments
                        </h4>
                        <p className="text-sm text-gray-600">
                          {currentItem.notes}
                        </p>
                      </div>
                    )}

                    {/* Evidence Review */}
                    {currentItem.evidenceFiles &&
                      currentItem.evidenceFiles.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Evidence ({currentItem.evidenceFiles.length} files)
                          </h4>
                          <div className="flex gap-2 flex-wrap">
                            {currentItem.evidenceFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded"
                              >
                                <FileText className="w-3 h-3" />
                                {file.name?.substring(0, 20)}...
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (currentItemIndex > 0) {
                  setCurrentItemIndex(currentItemIndex - 1);
                  setCurrentStep(1);
                  setValidationErrors({});
                } else {
                  onClose();
                }
              }}
              className="px-5 py-2 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
            >
              {currentItemIndex > 0 ? "Previous Item" : "Cancel"}
            </button>
            {selectedItems.length > 1 &&
              currentItemIndex < selectedItems.length - 1 &&
              currentStep === 3 && (
                <button
                  onClick={() => {
                    if (validateStep()) {
                      setCurrentItemIndex(currentItemIndex + 1);
                      setCurrentStep(1);
                      setValidationErrors({});
                      setUploadedFiles([]);
                      setPreviewImages([]);
                    }
                  }}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  Save & Next Item
                </button>
              )}
          </div>

          <div className="flex gap-3">
            {currentStep < 3 ? (
              <button
                onClick={() => {
                  if (currentStep === 1 && !validateStep()) return;
                  setCurrentStep(currentStep + 1);
                }}
                className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmitAll}
                disabled={submitting}
                className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-red-400 transition-all flex items-center gap-2"
              >
                {submitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <Send className="w-4 h-4" />
                {selectedItems.length > 1
                  ? `Submit All (${selectedItems.length})`
                  : "Submit Rejection"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemRejection;
