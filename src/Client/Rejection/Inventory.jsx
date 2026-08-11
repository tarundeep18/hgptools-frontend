import React, { useState } from "react";
import axios from "axios";
import {
  Package,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Clipboard,
  Zap, // New icon for direct addition
} from "lucide-react";
import toast from "react-hot-toast";

const Inventory = ({ rejection, onClose, onSuccess, directOnly = false }) => {
  const [formData, setFormData] = useState({
    storageLocation: "",
    rackNumber: "",
    shelfNumber: "",
    quantity: rejection?.rejectedQuantity || 0,
    condition: "good",
    expiryDate: "",
    manufactureDate: "",
    notes: "",
    // For approval flow
    approvalAction: "add_to_inventory", // 'add_to_inventory' or 'approve_and_add'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let endpoint;
      let payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
      };

      if (directOnly) {
        // Direct inventory addition without approval
        endpoint = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/inventory/rejection/${rejection._id}/add-to-inventory-direct`;
      } else if (formData.approvalAction === "approve_and_add") {
        // Approve and add to inventory
        endpoint = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/inventory/rejection/${rejection._id}/add-to-inventory`;
        // Need to also handle approval
        await axios.put(
          `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rejection/${rejection._id}/review`,
          {
            status: "approved",
            adminRemarks: "Approved and added to inventory",
          },
          { withCredentials: true },
        );
      } else {
        // Just add to inventory (assuming already approved)
        endpoint = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/inventory/rejection/${rejection._id}/add-to-inventory`;
      }

      const response = await axios.post(endpoint, payload, {
        withCredentials: true,
      });

      if (response.data.success) {
        const message = directOnly
          ? "✅ Items added directly to inventory!"
          : "✅ Items added to inventory successfully!";
        toast.success(message);
        if (onSuccess) onSuccess(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error("Error adding to inventory:", error);
      setError(error.response?.data?.message || "Failed to add to inventory");
      toast.error(
        error.response?.data?.message || "Failed to add to inventory",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!rejection) return null;

  const isAlreadyAdded = rejection.inventoryAdded;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${directOnly ? "from-purple-600 to-indigo-600" : "from-green-600 to-emerald-600"} px-6 py-5`}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-2">
                  {directOnly ? (
                    <Zap className="w-6 h-6 text-white" />
                  ) : (
                    <Package className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {isAlreadyAdded
                      ? "Already Added"
                      : directOnly
                        ? "Add to Inventory (Direct)"
                        : "Add to Inventory"}
                  </h2>
                  <p
                    className={`${directOnly ? "text-purple-100" : "text-green-100"} text-sm`}
                  >
                    {rejection.poNumber} - {rejection.itemCode}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Rejection Summary */}
          <div
            className={`${directOnly ? "bg-purple-50" : "bg-blue-50"} rounded-xl p-4 mb-6 border ${directOnly ? "border-purple-200" : "border-blue-200"}`}
          >
            <h4
              className={`font-semibold ${directOnly ? "text-purple-800" : "text-blue-800"} mb-2 flex items-center gap-2`}
            >
              <Clipboard className="w-4 h-4" />
              Rejection Summary
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">PO Number:</span>
                <span className="font-medium ml-2">{rejection.poNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Item Code:</span>
                <span className="font-medium ml-2">{rejection.itemCode}</span>
              </div>
              <div>
                <span className="text-gray-600">Rejected Qty:</span>
                <span className="font-medium text-red-600 ml-2">
                  {rejection.rejectedQuantity} {rejection.unit || "pcs"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Batch No:</span>
                <span className="font-medium ml-2">#{rejection.batchNo}</span>
              </div>
            </div>
            {isAlreadyAdded && (
              <div className="mt-2 text-green-600 text-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Already added to inventory
              </div>
            )}
          </div>

          {!isAlreadyAdded && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Direct Addition Info */}
              {directOnly && (
                <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200 mb-4">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <strong>Direct Addition:</strong> Items will be added to
                    inventory immediately without approval.
                  </p>
                </div>
              )}

              

              {/* Storage Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  Storage Location
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Storage Location *
                    </label>
                    <input
                      type="text"
                      name="storageLocation"
                      value={formData.storageLocation}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none"
                      placeholder="e.g., Warehouse A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rack Number *
                    </label>
                    <input
                      type="text"
                      name="rackNumber"
                      value={formData.rackNumber}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none"
                      placeholder="e.g., R-12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shelf Number *
                    </label>
                    <input
                      type="text"
                      name="shelfNumber"
                      value={formData.shelfNumber}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none"
                      placeholder="e.g., S-03"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity & Condition */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-500" />
                  Quantity & Condition
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity to Add *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                      min="0.01"
                      max={rejection.rejectedQuantity}
                      step="0.01"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max: {rejection.rejectedQuantity}{" "}
                      {rejection.unit || "pcs"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition
                    </label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  Dates (Optional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacture Date
                    </label>
                    <input
                      type="date"
                      name="manufactureDate"
                      value={formData.manufactureDate}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none"
                  placeholder="Any additional information about these items..."
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl transition flex items-center justify-center gap-2 font-medium disabled:opacity-50 ${
                    directOnly
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                  {directOnly ? "Add Directly" : "Add to Inventory"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;


