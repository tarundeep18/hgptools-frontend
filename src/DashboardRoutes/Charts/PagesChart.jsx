import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Globe,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  ChevronRight,
} from "lucide-react";

const PageAnalyticsDashboard = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/analytics/pages`,
        );
        setPages(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load page data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchPages();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-indigo-100 rounded-full"></div>
          <Loader2
            className="animate-spin absolute top-0 left-0 text-indigo-600"
            size={48}
          />
        </div>
        <p className="text-slate-400 font-medium animate-pulse">
          Refining analytics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 flex items-center gap-4 p-4 bg-red-50/50 border border-red-100 rounded-2xl text-red-600">
        <div className="p-2 bg-red-100 rounded-full">
          <AlertCircle size={20} />
        </div>
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-8xl mx-auto p-6 bg-slate-50/30 min-h-screen">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-[0.2em] mb-2">
            <span className="p-1 bg-indigo-100 rounded-md">
              <Globe size={14} />
            </span>
            SEO (Search Engine Optimization)
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Page Performance{" "}
            <span className="text-slate-400 font-light">Overview</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-600">
            Last 30 Days
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Page Path
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Clicks
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Impressions
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  CTR
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Avg. Position
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pages.map((page, index) => {
                const path = new URL(page.keys[0]).pathname;
                return (
                  <tr
                    key={index}
                    className="group hover:bg-indigo-50/30 transition-all duration-200"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">
                            {path === "/"
                              ? "Home"
                              : path.replace("/", "").replace(/-/g, " ")}
                          </span>
                          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                            {path}
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded border border-slate-200">
                              <Copy size={10} />
                            </button>
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-sm font-semibold text-slate-900">
                        {page.clicks.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm text-slate-600">
                          {page.impressions.toLocaleString()}
                        </span>
                        {/* Visual bar for impressions scale */}
                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-300 rounded-full"
                            style={{
                              width: `${Math.min((page.impressions / 1000) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          page.ctr > 0.05
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-slate-50 text-slate-500 border border-slate-100"
                        }`}
                      >
                        {(page.ctr * 100).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={`text-sm font-bold ${
                            page.position <= 10
                              ? "text-indigo-600"
                              : "text-slate-400"
                          }`}
                        >
                          {page.position.toFixed(1)}
                        </span>
                        <ChevronRight
                          size={14}
                          className="text-slate-300 group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between items-center">
          <span>Showing {pages.length} active routes</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>{" "}
            Live Data Sync
          </span>
        </div>
      </div>
    </div>
  );
};

export default PageAnalyticsDashboard;
