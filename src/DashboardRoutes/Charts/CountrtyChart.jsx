import React, { useEffect, useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  MousePointer2,
  Eye,
  Globe2,
  BarChart3,
  ArrowUpRight,
  ChevronRight,
  Search,
  Download,
  Calendar,
  Filter,
  Smartphone,
  Laptop,
  Tablet,
  TrendingUp,
  Award,
  Activity,
  Copy,
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  SearchCheck,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

// Full country name mapping
const countryNameMap = {
  ind: "India",
  usa: "United States",
  gbr: "United Kingdom",
  can: "Canada",
  phl: "Philippines",
  ita: "Italy",
  are: "UAE",
  aus: "Australia",
  bgd: "Bangladesh",
  brb: "Barbados",
  che: "Switzerland",
  chn: "China",
  hkg: "Hong Kong",
  irn: "Iran",
  khm: "Cambodia",
  mex: "Mexico",
  pak: "Pakistan",
  sau: "Saudi Arabia",
  zaf: "South Africa",
};

const deviceIcons = {
  desktop: <Laptop size={14} />,
  mobile: <Smartphone size={14} />,
  tablet: <Tablet size={14} />,
};

// Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  const pageNumbers = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">Rows per page:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-indigo-400"
        >
          {[5, 10, 25, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronsLeft size={16} className="text-slate-600" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={16} className="text-slate-600" />
        </button>

        <div className="flex gap-1">
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === number
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {number}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={16} className="text-slate-600" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronsRight size={16} className="text-slate-600" />
        </button>
      </div>

      <div className="text-xs text-slate-500">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, totalPages * itemsPerPage)} of{" "}
        {totalPages * itemsPerPage} entries
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [devicesData, setDevicesData] = useState(null);
  const [pagesData, setPagesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("countries");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSearchTerm, setPageSearchTerm] = useState("");
  const [copiedPath, setCopiedPath] = useState(null);

  // Pagination states
  const [countriesCurrentPage, setCountriesCurrentPage] = useState(1);
  const [countriesItemsPerPage, setCountriesItemsPerPage] = useState(10);
  const [pagesCurrentPage, setPagesCurrentPage] = useState(1);
  const [pagesItemsPerPage, setPagesItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countriesRes, devicesRes, pagesRes] = await Promise.all([
          fetch(
            `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/analytics/countries`,
          ),
          fetch(
            `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/analytics/devices`,
          ),
          fetch(
            `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/analytics/pages`,
          ),
        ]);

        const countriesData = await countriesRes.json();
        const devicesDataRaw = await devicesRes.json();
        const pagesDataRaw = await pagesRes.json();

        const sortedCountries = [...countriesData].sort(
          (a, b) => b.clicks - a.clicks,
        );
        setRawData(sortedCountries);

        if (devicesDataRaw && devicesDataRaw.length > 0) {
          const labels = devicesDataRaw.map((r) => r.keys[0]);
          const clicks = devicesDataRaw.map((r) => r.clicks);
          const impressions = devicesDataRaw.map((r) => r.impressions);
          setDevicesData({ labels, clicks, impressions });
        }

        const sortedPages = [...pagesDataRaw].sort(
          (a, b) => b.clicks - a.clicks,
        );
        setPagesData(sortedPages);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset pagination when search changes
  useEffect(() => {
    setCountriesCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setPagesCurrentPage(1);
  }, [pageSearchTerm]);

  const chartData = useMemo(() => {
    return rawData.filter((item) => item.clicks > 0 || item.impressions > 0);
  }, [rawData]);

  const filteredCountries = useMemo(() => {
    if (!searchTerm) return rawData;
    return rawData.filter((country) =>
      (countryNameMap[country.keys[0]] || country.keys[0].toUpperCase())
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  }, [rawData, searchTerm]);

  const paginatedCountries = useMemo(() => {
    const start = (countriesCurrentPage - 1) * countriesItemsPerPage;
    const end = start + countriesItemsPerPage;
    return filteredCountries.slice(start, end);
  }, [filteredCountries, countriesCurrentPage, countriesItemsPerPage]);

  const totalCountriesPages = Math.ceil(
    filteredCountries.length / countriesItemsPerPage,
  );

  const filteredPages = useMemo(() => {
    if (!pageSearchTerm) return pagesData;
    return pagesData.filter((page) => {
      const path = new URL(page.keys[0]).pathname;
      const displayName =
        path === "/" ? "Home" : path.replace("/", "").replace(/-/g, " ");
      return (
        displayName.toLowerCase().includes(pageSearchTerm.toLowerCase()) ||
        page.keys[0].toLowerCase().includes(pageSearchTerm.toLowerCase())
      );
    });
  }, [pagesData, pageSearchTerm]);

  const paginatedPages = useMemo(() => {
    const start = (pagesCurrentPage - 1) * pagesItemsPerPage;
    const end = start + pagesItemsPerPage;
    return filteredPages.slice(start, end);
  }, [filteredPages, pagesCurrentPage, pagesItemsPerPage]);

  const totalPagesPages = Math.ceil(filteredPages.length / pagesItemsPerPage);

  const stats = useMemo(() => {
    const totalClicks = rawData.reduce((acc, curr) => acc + curr.clicks, 0);
    const totalImps = rawData.reduce((acc, curr) => acc + curr.impressions, 0);
    const avgPos = (
      rawData.reduce((acc, curr) => acc + curr.position, 0) /
      (rawData.filter((d) => d.position > 0).length || 1)
    ).toFixed(1);
    const ctr =
      totalImps > 0 ? ((totalClicks / totalImps) * 100).toFixed(2) : "0.00";
    return { totalClicks, totalImps, avgPos, ctr };
  }, [rawData]);

  const pagesStats = useMemo(() => {
    const totalClicks = pagesData.reduce((acc, curr) => acc + curr.clicks, 0);
    const totalImps = pagesData.reduce(
      (acc, curr) => acc + curr.impressions,
      0,
    );
    const avgCtr =
      pagesData.length > 0
        ? (
            (pagesData.reduce((acc, curr) => acc + curr.ctr, 0) /
              pagesData.length) *
            100
          ).toFixed(2)
        : "0.00";
    const avgPos =
      pagesData.length > 0
        ? (
            pagesData.reduce((acc, curr) => acc + curr.position, 0) /
            pagesData.length
          ).toFixed(1)
        : "0.0";
    return { totalClicks, totalImps, avgCtr, avgPos };
  }, [pagesData]);

  const chartConfig = useMemo(
    () => ({
      labels: chartData.map(
        (d) => countryNameMap[d.keys[0]] || d.keys[0].toUpperCase(),
      ),
      datasets: [
        {
          label: "Clicks",
          data: chartData.map((d) => d.clicks),
          backgroundColor: "rgba(99, 102, 241, 0.85)",
          borderRadius: 8,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
          hoverBackgroundColor: "rgba(99, 102, 241, 1)",
        },
        {
          label: "Impressions",
          data: chartData.map((d) => d.impressions),
          backgroundColor: "rgba(203, 213, 225, 0.7)",
          borderRadius: 8,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
          hoverBackgroundColor: "rgba(203, 213, 225, 0.9)",
        },
      ],
    }),
    [chartData],
  );

  const doughnutConfig = devicesData
    ? {
        labels: devicesData.labels.map(
          (l) => l.charAt(0).toUpperCase() + l.slice(1),
        ),
        datasets: [
          {
            data: devicesData.clicks,
            backgroundColor: ["#6366f1", "#8b5cf6", "#a855f7"],
            borderWidth: 0,
            hoverOffset: 15,
          },
        ],
      }
    : null;

  const barConfig = devicesData
    ? {
        labels: devicesData.labels.map(
          (l) => l.charAt(0).toUpperCase() + l.slice(1),
        ),
        datasets: [
          {
            label: "Clicks",
            data: devicesData.clicks,
            backgroundColor: "rgba(99, 102, 241, 0.85)",
            borderRadius: 8,
            barPercentage: 0.6,
          },
          {
            label: "Impressions",
            data: devicesData.impressions,
            backgroundColor: "rgba(203, 213, 225, 0.7)",
            borderRadius: 8,
            barPercentage: 0.6,
          },
        ],
      }
    : null;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 12, weight: "500" },
          boxWidth: 12,
          color: "#64748b",
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
        titleFont: { size: 13, weight: "600" },
        bodyFont: { size: 12 },
        cornerRadius: 12,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: { color: "#e2e8f0", drawBorder: false },
        ticks: { color: "#64748b", font: { size: 11, weight: "500" } },
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: { color: "#64748b", font: { size: 11 } },
      },
    },
  };

  const copyToClipboard = (path) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Premium Header */}
        <div className="relative mb-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl -z-10" />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full">
                  <span className="text-xs font-semibold text-white tracking-wide">
                    LIVE ANALYTICS
                  </span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  <Activity size={12} />
                  <span className="text-xs font-medium">Real-time</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Performance Dashboard
              </h1>
              <p className="text-slate-500 mt-1">
                Search traffic insights & analytics overview
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:shadow-md transition-all duration-200">
                <Calendar size={16} className="text-indigo-500" />
                Last 28 days
              </button>
              {/* <button className="p-2 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all duration-200">
                <Download size={16} className="text-slate-500" />
              </button> */}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {activeTab === "pages" ? (
            <>
              <StatCard
                icon={<FileText />}
                label="Total Page Clicks"
                value={pagesStats.totalClicks.toLocaleString()}
                trend="+8.2%"
                trendUp={true}
                gradient="from-blue-500 to-indigo-600"
              />
              <StatCard
                icon={<Eye />}
                label="Page Impressions"
                value={pagesStats.totalImps.toLocaleString()}
                trend="+3.1%"
                trendUp={true}
                gradient="from-emerald-500 to-teal-600"
              />
              <StatCard
                icon={<TrendingUp />}
                label="Avg. Page CTR"
                value={`${pagesStats.avgCtr}%`}
                trend="+0.8%"
                trendUp={true}
                gradient="from-purple-500 to-pink-600"
              />
              <StatCard
                icon={<Award />}
                label="Avg. Page Position"
                value={pagesStats.avgPos}
                trend="-0.5"
                trendUp={true}
                gradient="from-orange-500 to-red-600"
              />
            </>
          ) : (
            <>
              <StatCard
                icon={<MousePointer2 />}
                label="Total Clicks"
                value={stats.totalClicks.toLocaleString()}
                trend="+12.3%"
                trendUp={true}
                gradient="from-blue-500 to-indigo-600"
              />
              <StatCard
                icon={<Eye />}
                label="Impressions"
                value={stats.totalImps.toLocaleString()}
                trend="+5.4%"
                trendUp={true}
                gradient="from-emerald-500 to-teal-600"
              />
              <StatCard
                icon={<TrendingUp />}
                label="Avg.CTR"
                value={`${stats.ctr}%`}
                trend="+1.2%"
                trendUp={true}
                gradient="from-purple-500 to-pink-600"
              />
              <StatCard
                icon={<Award />}
                label="Avg. Position"
                value={stats.avgPos}
                trend="-0.2"
                trendUp={true}
                gradient="from-orange-500 to-red-600"
              />
            </>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1 mb-8 inline-flex">
          {[
            { id: "countries", label: " Countries", icon: Globe2 },
            { id: "devices", label: " Devices", icon: Smartphone },
            { id: "pages", label: " Pages", icon: FileText },
            { id: "keywords", label: "Keywords", icon: SearchCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Countries Tab */}
        {activeTab === "countries" && (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">
                        Traffic Distribution
                      </h2>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Clicks vs impressions by region
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        Clicks
                      </span>
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        Impressions
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[450px] w-full">
                    <Bar data={chartConfig} options={options} />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-5 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Top Performers
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ranked by total clicks
                      </p>
                    </div>
                    <Award className="text-yellow-500" size={20} />
                  </div>
                </div>

                <div className="divide-y divide-slate-700/50">
                  {rawData.slice(0, 5).map((country, idx) => {
                    const maxClicks = rawData[0]?.clicks || 1;
                    const barWidth = (country.clicks / maxClicks) * 100;

                    return (
                      <div
                        key={country.keys[0]}
                        className="p-4 hover:bg-slate-800/50 transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-white group-hover:text-indigo-400 transition">
                              {countryNameMap[country.keys[0]] ||
                                country.keys[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-white">
                              {country.clicks.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400 ml-1">
                              clicks
                            </span>
                          </div>
                        </div>

                        <div className="ml-8 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>

                        <div className="flex gap-4 mt-2 ml-8 text-xs text-slate-400">
                          <span>👁️ {country.impressions.toLocaleString()}</span>
                          <span>📊 {(country.ctr * 100).toFixed(1)}% CTR</span>
                          <span>📍 Pos {country.position.toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Countries Table with Pagination */}
            <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    All Countries
                  </h3>
                  <p className="text-sm text-slate-500">
                    Complete performance metrics by region
                  </p>
                </div>
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl w-72 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-4 px-6">Country</th>
                      <th className="text-right py-4 px-4">Clicks</th>
                      <th className="text-right py-4 px-4">Impressions</th>
                      <th className="text-right py-4 px-4">CTR</th>
                      <th className="text-right py-4 px-6">Avg. Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedCountries.map((country) => (
                      <tr
                        key={country.keys[0]}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="py-3 px-6 font-medium text-slate-700">
                          {countryNameMap[country.keys[0]] ||
                            country.keys[0].toUpperCase()}
                        </td>
                        <td className="text-right py-3 px-4 font-mono font-semibold text-slate-800">
                          {country.clicks.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 font-mono text-slate-500">
                          {country.impressions.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 font-mono">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              country.ctr > 0.1
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {(country.ctr * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-6 font-mono text-slate-500">
                          {country.position.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={countriesCurrentPage}
                totalPages={totalCountriesPages}
                onPageChange={setCountriesCurrentPage}
                itemsPerPage={countriesItemsPerPage}
                onItemsPerPageChange={setCountriesItemsPerPage}
              />
            </div>
          </>
        )}

        {/* Devices Tab */}
        {activeTab === "devices" && devicesData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Smartphone size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Device Distribution
                    </h3>
                    <p className="text-sm text-slate-500">
                      Click share by device type
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="h-[320px]">
                  <Doughnut
                    data={doughnutConfig}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            font: { size: 12, weight: "500" },
                            color: "#334155",
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: "circle",
                          },
                        },
                        tooltip: {
                          backgroundColor: "#1e293b",
                          padding: 12,
                          cornerRadius: 12,
                          callbacks: {
                            label: (context) => {
                              const label = context.label || "";
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce(
                                (a, b) => a + b,
                                0,
                              );
                              const percentage = (
                                (value / total) *
                                100
                              ).toFixed(1);
                              return `${label}: ${value.toLocaleString()} clicks (${percentage}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <BarChart3 size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Performance Metrics
                    </h3>
                    <p className="text-sm text-slate-500">
                      Clicks vs impressions breakdown
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="h-[320px]">
                  <Bar data={barConfig} options={options} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Device Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {devicesData.labels.map((device, idx) => {
                  const clicks = devicesData.clicks[idx];
                  const impressions = devicesData.impressions[idx];
                  const ctr =
                    impressions > 0
                      ? ((clicks / impressions) * 100).toFixed(1)
                      : 0;
                  const icon = deviceIcons[device] || <Smartphone size={20} />;

                  return (
                    <div
                      key={device}
                      className="bg-white rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center text-indigo-600">
                          {icon}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 capitalize">
                            {device}
                          </p>
                          <p className="text-xs text-slate-500">Device type</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Clicks:</span>
                          <span className="font-semibold text-slate-800">
                            {clicks.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Impressions:</span>
                          <span className="font-semibold text-slate-800">
                            {impressions.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">CTR:</span>
                          <span className="font-semibold text-emerald-600">
                            {ctr}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Pages Tab with Pagination */}
        {activeTab === "pages" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Page Performance
                </h3>
                <p className="text-sm text-slate-500">
                  Detailed analytics for all pages
                </p>
              </div>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search pages..."
                  value={pageSearchTerm}
                  onChange={(e) => setPageSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl w-80 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Page Path
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Clicks
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Impressions
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      CTR
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Avg. Position
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedPages.map((page, index) => {
                    const url = page.keys[0];
                    const path = new URL(url).pathname;
                    const displayName =
                      path === "/"
                        ? "Home"
                        : path.replace("/", "").replace(/-/g, " ");
                    const maxImpressions = Math.max(
                      ...pagesData.map((p) => p.impressions),
                    );
                    const impressionWidth =
                      (page.impressions / maxImpressions) * 100;

                    return (
                      <tr
                        key={index}
                        className="group hover:bg-indigo-50/30 transition-all duration-200"
                      >
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">
                              {displayName}
                            </span>
                            <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
                              {path}
                              <button
                                onClick={() => copyToClipboard(url)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded-lg border border-slate-200"
                              >
                                {copiedPath === url ? (
                                  <span className="text-emerald-600 text-[10px]">
                                    Copied!
                                  </span>
                                ) : (
                                  <Copy size={12} className="text-slate-400" />
                                )}
                              </button>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ExternalLink
                                  size={12}
                                  className="text-slate-400 hover:text-indigo-600"
                                />
                              </a>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="text-sm font-semibold text-slate-900">
                            {page.clicks.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm text-slate-600">
                              {page.impressions.toLocaleString()}
                            </span>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all"
                                style={{ width: `${impressionWidth}%` }}
                              />
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
                        <td className="px-6 py-5 text-right">
                          <button className="text-indigo-600 hover:text-indigo-700 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Details →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={pagesCurrentPage}
              totalPages={totalPagesPages}
              onPageChange={setPagesCurrentPage}
              itemsPerPage={pagesItemsPerPage}
              onItemsPerPageChange={setPagesItemsPerPage}
            />
          </div>
        )}

        {/*---------Keyword tab-----------------------*/}
        {activeTab === "keywords" && (
          <div>
            <h1>Keyword search</h1>
          </div>
        )}
      </div>
    </div>
  );
};

/* --- Premium Stat Card Component --- */
const StatCard = ({ icon, label, value, trend, trendUp, gradient }) => {
  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}
          >
            {React.cloneElement(icon, { size: 20 })}
          </div>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-lg ${
              trendUp
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};

/* --- Loading Skeleton --- */
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-8">
    <div className="max-w-[1440px] mx-auto">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-[500px] bg-slate-200 rounded-2xl"></div>
          <div className="h-[500px] bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
