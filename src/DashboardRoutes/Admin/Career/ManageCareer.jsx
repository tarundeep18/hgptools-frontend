import React, { useEffect, useState } from "react";
import { Search, Filter, Download, ChevronDown, X } from "lucide-react"; // Added X icon
import { IoMdEye } from "react-icons/io";
import axios from "axios";
import toast from "react-hot-toast";
import { MdDelete } from "react-icons/md";

const API = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}`;

const ManageCareer = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- MODAL STATE ---
  const [selectedApp, setSelectedApp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/career`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setApplications(res.data.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await axios.patch(
        `${API}/career/status/${id}`,
        { status: newStatus }, // 2nd arg: Data/Body
        { withCredentials: true }, // 3rd arg: Config
      );

      if (res.data.success) {
        toast.success("Candidate status changed successfully!");
        setApplications((prev) =>
          prev.map((app) =>
            app._id === id ? { ...app, status: newStatus } : app,
          ),
        );
      }
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  // --- OPEN MODAL FUNCTION ---
  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Shortlisted":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "Pending":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "Rejected":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "Reviewed":
        return "bg-blue-50 text-blue-600 border-blue-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen relative">
      <div className="mx-auto">
        {/* HEADER SECTION (Keep your existing code) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Job application details
            </h1>
            <p className="text-slate-500">
              View and manage candidate submissions
            </p>
          </div>
          {/* Search/Filter UI... */}
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs uppercase font-bold text-gray-500">
                    S.No
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    Candidate
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    Position
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app, index) => (
                  <tr key={app._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-semibold text-sm  text-gray-700 ">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 text-blue-700 flex items-center justify-center rounded-full font-bold">
                          {app.fullName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {app.fullName}
                          </p>
                          <p className="text-xs text-slate-500">{app.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{app.position}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block w-36">
                        <select
                          value={app.status}
                          onChange={(e) =>
                            handleStatusChange(app._id, e.target.value)
                          }
                          className={`appearance-none w-full px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${getStatusStyle(app.status)}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Reviewed">Reviewed</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* UPDATE: View Button Trigger */}
                        <button
                          onClick={() => handleViewDetails(app)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <IoMdEye className="text-xl" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                          <MdDelete className="text-2xl" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">{applications.length}</span> of{" "}
                <span className="font-medium">{applications.length}</span>{" "}
                products
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
      </div>

      {/* career openViewModal */}
      {isModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            {/* Header: More refined with a subtitle */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 leading-none">
                  Application Profile
                </h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  Review candidate details and documents
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Content: Improved grouping and spacing */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                {/* Section: Personal Info */}
                <div className="space-y-6">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Full Name
                    </label>
                    <p className="text-[15px] text-slate-900 font-semibold mt-0.5">
                      {selectedApp.fullName}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Email Address
                    </label>
                    <p className="text-[15px] text-slate-600 font-medium mt-0.5">
                      {selectedApp.email}
                    </p>
                  </div>
                </div>

                {/* Section: Job Info */}
                <div className="space-y-6">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Role Applied For
                    </label>
                    <p className="text-[15px] text-slate-900 font-semibold mt-0.5">
                      {selectedApp.position}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <p className="text-[15px] text-slate-600 font-medium mt-0.5">
                      {selectedApp.phone}
                    </p>
                  </div>
                </div>

                {/* Section: Status & Resume - Integrated Horizontal Row */}
                <div className="col-span-full flex flex-wrap gap-8 py-4 border-y border-slate-50">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Application Status
                    </label>
                    <span
                      className={`px-3 py-1 rounded-lg text-[12px] font-bold ring-1 ring-inset ${getStatusStyle(selectedApp.status)}`}
                    >
                      {selectedApp.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Attachments
                    </label>
                    <a
                      href={selectedApp.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold"
                    >
                      <Download size={14} strokeWidth={2.5} />
                      RESUME_CV.PDF
                    </a>
                  </div>
                </div>

                {/* Section: Cover Letter */}
                <div className="col-span-full">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Cover Letter / Statement
                  </label>
                  <div className="mt-2 text-slate-600 bg-slate-50/50 border border-slate-100 p-4 rounded-xl text-sm leading-relaxed max-h-40 overflow-y-auto">
                    {selectedApp.about || "No details provided."}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer: Simpler, focuses on secondary action */}
            <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCareer;
