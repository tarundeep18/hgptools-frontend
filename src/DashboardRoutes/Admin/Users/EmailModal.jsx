import React, { useState } from "react";

const EmailModal = ({
  darkMode,
  currentUser,
  bulkMode,
  selectedCount,
  onClose,
  onSend,
  loading,
  error,
}) => {
  const [emailData, setEmailData] = useState({
    subject: "",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(emailData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">
              {bulkMode ? "Send Bulk Email" : "Send Email"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {bulkMode
                ? `Sending to ${selectedCount} selected user${
                    selectedCount !== 1 ? "s" : ""
                  }`
                : `Sending to: ${currentUser.fname} ${currentUser.lname} (${currentUser.email})`}
            </p>
          </div>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) =>
                  setEmailData({ ...emailData, subject: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                placeholder="Enter email subject"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Message
              </label>
              <textarea
                value={emailData.message}
                onChange={(e) =>
                  setEmailData({ ...emailData, message: e.target.value })
                }
                rows="8"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                placeholder="Write your message here..."
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The message will be sent as HTML and
                will include a professional email template with the recipient's
                name.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                "Send Email"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailModal;