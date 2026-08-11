import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FiPackage,
  FiTruck,
  FiTrendingUp,
  FiDollarSign,
  FiClock,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2,
  FiGrid,
  FiSettings,
  FiRefreshCw,
  FiCalendar,
  FiDatabase,
  FiBriefcase,
  FiTool,
  FiBox,
  FiCpu,
  FiShield,
  FiAlertTriangle,
  FiFileText,
  FiMessageSquare,
  FiUserPlus,
} from "react-icons/fi";
import {
  MdOutlineRateReview,
  MdOutlinePublishedWithChanges,
} from "react-icons/md";
import { BiCategory } from "react-icons/bi";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import axios from "axios";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { darkMode } = useOutletContext();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("monthly");

  // App-specific data states
  const [appStats, setAppStats] = useState({
    blogs: { total: 0, published: 0, drafts: 0, categories: {} },
    quotes: { total: 0, pending: 0, contacted: 0, completed: 0 },
    contacts: { total: 0 },
    users: { total: 0, active: 0 },
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);

  // Manufacturing Statistics (existing)
  const stats = {
    productionRate: 92.5,
    equipmentUptime: 96.2,
    orderFulfillment: 88.7,
    qualityRate: 98.7,
    activeOrders: 45,
    pendingShipments: 12,
    inventoryValue: 4250000,
    onTimeDelivery: 94.3,
  };

  // Production Data
  const productionData = [
    { week: "W1", target: 4500, actual: 4200 },
    { week: "W2", target: 4500, actual: 4300 },
    { week: "W3", target: 4600, actual: 4550 },
    { week: "W4", target: 4600, actual: 4450 },
    { week: "W5", target: 4700, actual: 4650 },
    { week: "W6", target: 4700, actual: 4500 },
  ];

  // Revenue Data
  const revenueData = [
    { month: "Jan", revenue: 4500000 },
    { month: "Feb", revenue: 5200000 },
    { month: "Mar", revenue: 4800000 },
    { month: "Apr", revenue: 5600000 },
    { month: "May", revenue: 6100000 },
    { month: "Jun", revenue: 6800000 },
  ];

  // Inventory Distribution
  const inventoryData = [
    { name: "Raw Materials", value: 35, color: "#3B82F6" },
    { name: "Work in Progress", value: 25, color: "#10B981" },
    { name: "Finished Goods", value: 40, color: "#8B5CF6" },
  ];
  // Machine Performance
  const machineData = [
    { name: "CNC-001", efficiency: 92, status: "Running", color: "#10B981" },
    { name: "CNC-002", efficiency: 87, status: "Running", color: "#10B981" },
    { name: "Press-001", efficiency: 95, status: "Running", color: "#10B981" },
    {
      name: "Lathe-001",
      efficiency: 78,
      status: "Maintenance",
      color: "#F59E0B",
    },
    {
      name: "Milling-001",
      efficiency: 90,
      status: "Running",
      color: "#10B981",
    },
    {
      name: "Robotic Arm-01",
      efficiency: 85,
      status: "Idle",
      color: "#EF4444",
    },
  ];

  // Recent Orders
  const recentOrders = [
    {
      id: "ORD-001",
      customer: "AutoTech Corp",
      status: "Shipped",
      amount: 45200,
      priority: "High",
    },
    {
      id: "ORD-002",
      customer: "Industrial Solutions",
      status: "Processing",
      amount: 32800,
      priority: "Medium",
    },
    {
      id: "ORD-003",
      customer: "Global Manufacturing",
      status: "Pending",
      amount: 56700,
      priority: "High",
    },
    {
      id: "ORD-004",
      customer: "Precision Parts Ltd",
      status: "Shipped",
      amount: 23400,
      priority: "Low",
    },
    {
      id: "ORD-005",
      customer: "Heavy Equipment Inc",
      status: "Completed",
      amount: 89100,
      priority: "High",
    },
  ];

  // Quality Metrics
  const qualityData = [
    { name: "Jan", defectRate: 2.1, rework: 1.5 },
    { name: "Feb", defectRate: 1.8, rework: 1.2 },
    { name: "Mar", defectRate: 1.5, rework: 1.0 },
    { name: "Apr", defectRate: 1.2, rework: 0.8 },
    { name: "May", defectRate: 0.9, rework: 0.6 },
    { name: "Jun", defectRate: 0.7, rework: 0.4 },
  ];

  // Maintenance Schedule
  const maintenanceSchedule = [
    {
      machine: "CNC-001",
      type: "Preventive",
      dueDate: "2024-01-20",
      status: "Scheduled",
    },
    {
      machine: "Press-001",
      type: "Calibration",
      dueDate: "2024-01-22",
      status: "Pending",
    },
    {
      machine: "Lathe-001",
      type: "Repair",
      dueDate: "2024-01-18",
      status: "In Progress",
    },
    {
      machine: "Milling-001",
      type: "Preventive",
      dueDate: "2024-01-25",
      status: "Scheduled",
    },
  ];

  // Fetch app-specific data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch blogs
      const blogsRes = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/blogs`,
        { withCredentials: true },
      );

      // Fetch quotes
      const quotesRes = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/quote`,
        { withCredentials: true },
      );

      // Fetch contacts
      const contactsRes = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/contact`,
        { withCredentials: true },
      );
      const userRes = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/loggedin-user`,
        { withCredentials: true },
      );

      // Process blogs data
      const blogs = blogsRes.data;
      const publishedBlogs = blogs.filter(
        (blog) => blog.status === "published",
      ).length;
      const draftBlogs = blogs.filter((blog) => blog.status === "draft").length;

      // Process categories
      const categories = {};
      blogs.forEach((blog) => {
        const cat = blog.category || "Uncategorized";
        categories[cat] = (categories[cat] || 0) + 1;
      });

      // Process quotes data
      const quotes = quotesRes.data.success ? quotesRes.data.data : [];
      const pendingQuotes = quotes.filter((q) => q.status === "pending").length;
      const contactedQuotes = quotes.filter(
        (q) => q.status === "contacted",
      ).length;
      const completedQuotes = quotes.filter(
        (q) => q.status === "completed",
      ).length;

      // Process contacts
      const contacts = contactsRes.data;
      const users = userRes.data.count;

      setAppStats({
        blogs: {
          total: blogs.length,
          published: publishedBlogs,
          drafts: draftBlogs,
          categories,
        },
        quotes: {
          total: quotes.length,
          pending: pendingQuotes,
          contacted: contactedQuotes,
          completed: completedQuotes,
        },
        contacts: {
          total: contacts.length,
        },
        users: {
          total: users, // This would come from users API
        },
      });

      // Prepare category distribution for chart
      const catDist = Object.entries(categories).map(([name, count]) => ({
        name,
        count,
        percentage: (count / blogs.length) * 100,
      }));
      setCategoryDistribution(catDist);

      // Prepare recent activities
      const activities = [
        ...blogs.slice(0, 2).map((blog) => ({
          type: "blog",
          icon: <FiFileText size={16} />,
          title: `New blog: "${blog.title}"`,
          time: new Date(blog.createdAt).toLocaleDateString(),
        })),
        ...quotes.slice(0, 2).map((quote) => ({
          type: "quote",
          icon: <FiMessageSquare size={16} />,
          title: `New quote from ${quote.fName}`,
          time: new Date(quote.createdAt).toLocaleDateString(),
        })),
        ...contacts.slice(0, 2).map((contact) => ({
          type: "contact",
          icon: <FiUsers size={16} />,
          title: `New contact: ${contact.name}`,
          time: new Date(contact.createdAt).toLocaleDateString(),
        })),
      ]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5);

      setRecentActivities(activities);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return "$" + (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return "$" + (num / 1000).toFixed(1) + "K";
    }
    return "$" + num;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "shipped":
      case "completed":
      case "running":
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "processing":
      case "contacted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "pending":
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "maintenance":
      case "idle":
      case "archived":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#F59E0B",
    "#EF4444",
    "#06B6D4",
  ];

  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} p-6 flex items-center justify-center`}
      >
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} p-6`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1
                className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-2`}
              >
                Operations Dashboard
              </h1>
              <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Real-time monitoring of manufacturing operations and business
                metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                className={`px-4 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-300 text-gray-700"}`}
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="weekly">Weekly View</option>
                <option value="monthly">Monthly View</option>
                <option value="quarterly">Quarterly View</option>
              </select>
              <button
                className={`px-4 py-2 rounded-lg ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white font-medium`}
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* App-Specific Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Blogs"
            value={appStats.blogs.total}
            change={`${appStats.blogs.total} published`}
            icon={<FiFileText size={24} />}
            color="blue"
            trend="up"
            darkMode={darkMode}
          />
          <MetricCard
            title="Total Quotes"
            value={appStats.quotes.total}
            change={`${appStats.quotes.pending} pending, ${appStats.quotes.completed} completed`}
            icon={<FiMessageSquare size={24} />}
            color="green"
            trend={appStats.quotes.pending > 0 ? "up" : "neutral"}
            darkMode={darkMode}
          />
          <MetricCard
            title="Total Contacts"
            value={appStats.contacts.total}
            change="Contact directory entries"
            icon={<FiUsers size={24} />}
            color="purple"
            trend="neutral"
            darkMode={darkMode}
          />
          <MetricCard
            title="Active Users"
            value={`${appStats.users.total}`}
            change="Currently active users"
            icon={<FiUserPlus size={24} />}
            color="amber"
            trend="up"
            darkMode={darkMode}
          />
        </div>

        {/* Manufacturing Key Metrics Grid */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Production Rate"
            value={`${stats.productionRate}%`}
            change="+2.5% from last week"
            icon={<FiTrendingUp />}
            color="blue"
            trend="up"
            darkMode={darkMode}
          />
          <MetricCard
            title="Equipment Uptime"
            value={`${stats.equipmentUptime}%`}
            change="+1.2% from last month"
            icon={<FiCpu />}
            color="green"
            trend="up"
            darkMode={darkMode}
          />
          <MetricCard
            title="Inventory Value"
            value={formatNumber(stats.inventoryValue)}
            change="Current stock level"
            icon={<FiPackage />}
            color="purple"
            trend="neutral"
            darkMode={darkMode}
          />
          <MetricCard
            title="Quality Rate"
            value={`${stats.qualityRate}%`}
            change="+0.3% improvement"
            icon={<FiShield />}
            color="amber"
            trend="up"
            darkMode={darkMode}
          />
        </div> */}

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SmallMetricCard
            title="Active Orders"
            value={stats.activeOrders}
            icon={<FiBriefcase />}
            darkMode={darkMode}
          />
          <SmallMetricCard
            title="Pending Shipments"
            value={stats.pendingShipments}
            icon={<FiTruck />}
            darkMode={darkMode}
          />
          <SmallMetricCard
            title="On-Time Delivery"
            value={`${stats.onTimeDelivery}%`}
            icon={<FiClock />}
            darkMode={darkMode}
          />
          <SmallMetricCard
            title="Order Fulfillment"
            value={`${stats.orderFulfillment}%`}
            icon={<FiCheckCircle />}
            darkMode={darkMode}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Production vs Target */}
          <div
            className={`rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"} p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  Production vs Target
                </h3>
                <p
                  className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Weekly production performance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span
                    className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Target
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span
                    className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Actual
                  </span>
                </div>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={darkMode ? "#374151" : "#E5E7EB"}
                  />
                  <XAxis
                    dataKey="week"
                    stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                    fontSize={12}
                  />
                  <YAxis
                    stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                      borderColor: darkMode ? "#374151" : "#E5E7EB",
                      color: darkMode ? "#F3F4F6" : "#111827",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="target"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    name="Target"
                  />
                  <Bar
                    dataKey="actual"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    name="Actual Production"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Trend */}
          <div
            className={`rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"} p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  Revenue Trend
                </h3>
                <p
                  className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Monthly revenue in USD
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-600"}`}
              >
                +15.2% growth
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={darkMode ? "#374151" : "#E5E7EB"}
                  />
                  <XAxis
                    dataKey="month"
                    stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                    fontSize={12}
                  />
                  <YAxis
                    stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                      borderColor: darkMode ? "#374151" : "#E5E7EB",
                      color: darkMode ? "#F3F4F6" : "#111827",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [formatNumber(value), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Inventory Distribution */}
          <div
            className={`rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"} p-6`}
          >
            <h3
              className={`text-lg font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Inventory Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                      borderColor: darkMode ? "#374151" : "#E5E7EB",
                      color: darkMode ? "#F3F4F6" : "#111827",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [value + "%", "Share"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3">
              {inventoryData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span
                      className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Machine Performance */}
          <div
            className={`rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"} p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Machine Performance
              </h3>
              <span
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                4/6 Running
              </span>
            </div>
            <div className="space-y-4">
              {machineData.map((machine) => (
                <div
                  key={machine.name}
                  className={`p-4 rounded-lg ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FiCpu
                        className={darkMode ? "text-gray-400" : "text-gray-600"}
                      />
                      <span
                        className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                      >
                        {machine.name}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(machine.status)}`}
                    >
                      {machine.status}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span
                        className={darkMode ? "text-gray-400" : "text-gray-600"}
                      >
                        Efficiency
                      </span>
                      <span
                        className={`font-medium ${machine.efficiency > 85 ? "text-green-600" : "text-yellow-600"}`}
                      >
                        {machine.efficiency}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full ${machine.efficiency > 85 ? "bg-green-500" : "bg-yellow-500"}`}
                        style={{ width: `${machine.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div
            className={`rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"} p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Recent Orders
              </h3>
              <button
                className={`text-sm font-medium ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
              >
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className={`p-3 rounded-lg ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {order.id}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(order.priority)}`}
                    >
                      {order.priority}
                    </span>
                  </div>
                  <p
                    className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {order.customer}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                    <span
                      className={`font-medium ${darkMode ? "text-green-400" : "text-green-600"}`}
                    >
                      {formatNumber(order.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Metrics */}
          <div
            className={`rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"} p-6`}
          >
            <h3
              className={`text-lg font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Quality Metrics
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qualityData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={darkMode ? "#374151" : "#E5E7EB"}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                    fontSize={12}
                  />
                  <YAxis
                    stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                      borderColor: darkMode ? "#374151" : "#E5E7EB",
                      color: darkMode ? "#F3F4F6" : "#111827",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="defectRate"
                    stroke="#EF4444"
                    name="Defect Rate (%)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="rework"
                    stroke="#F59E0B"
                    name="Rework (%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Maintenance Schedule */}
          <div
            className={`rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"} p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Maintenance Schedule
              </h3>
              <button
                className={`text-sm font-medium ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
              >
                + Schedule New
              </button>
            </div>
            <div className="space-y-3">
              {maintenanceSchedule.map((item) => (
                <div
                  key={item.machine}
                  className={`p-4 rounded-lg border ${darkMode ? "border-gray-700 bg-gray-700/30" : "border-gray-200 bg-gray-50"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FiTool
                        className={darkMode ? "text-gray-400" : "text-gray-600"}
                      />
                      <span
                        className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                      >
                        {item.machine}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={darkMode ? "text-gray-400" : "text-gray-600"}
                    >
                      {item.type}
                    </span>
                    <span
                      className={darkMode ? "text-gray-300" : "text-gray-700"}
                    >
                      Due:{" "}
                      {new Date(item.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon, color, trend, darkMode }) => {
  const getColorClasses = () => {
    const colors = {
      blue: {
        bg: darkMode ? "bg-blue-500/10" : "bg-blue-50",
        text: darkMode ? "text-blue-400" : "text-blue-600",
        border: darkMode ? "border-blue-500/20" : "border-blue-100",
        iconBg: darkMode ? "bg-blue-500/20" : "bg-blue-100",
        gradient: "from-blue-500 to-blue-600",
      },
      green: {
        bg: darkMode ? "bg-green-500/10" : "bg-green-50",
        text: darkMode ? "text-green-400" : "text-green-600",
        border: darkMode ? "border-green-500/20" : "border-green-100",
        iconBg: darkMode ? "bg-green-500/20" : "bg-green-100",
        gradient: "from-green-500 to-green-600",
      },
      purple: {
        bg: darkMode ? "bg-purple-500/10" : "bg-purple-50",
        text: darkMode ? "text-purple-400" : "text-purple-600",
        border: darkMode ? "border-purple-500/20" : "border-purple-100",
        iconBg: darkMode ? "bg-purple-500/20" : "bg-purple-100",
        gradient: "from-purple-500 to-purple-600",
      },
      amber: {
        bg: darkMode ? "bg-amber-500/10" : "bg-amber-50",
        text: darkMode ? "text-amber-400" : "text-amber-600",
        border: darkMode ? "border-amber-500/20" : "border-amber-100",
        iconBg: darkMode ? "bg-amber-500/20" : "bg-amber-100",
        gradient: "from-amber-500 to-amber-600",
      },
      red: {
        bg: darkMode ? "bg-red-500/10" : "bg-red-50",
        text: darkMode ? "text-red-400" : "text-red-600",
        border: darkMode ? "border-red-500/20" : "border-red-100",
        iconBg: darkMode ? "bg-red-500/20" : "bg-red-100",
        gradient: "from-red-500 to-red-600",
      },
      indigo: {
        bg: darkMode ? "bg-indigo-500/10" : "bg-indigo-50",
        text: darkMode ? "text-indigo-400" : "text-indigo-600",
        border: darkMode ? "border-indigo-500/20" : "border-indigo-100",
        iconBg: darkMode ? "bg-indigo-500/20" : "bg-indigo-100",
        gradient: "from-indigo-500 to-indigo-600",
      },
    };
    return colors[color] || colors.blue;
  };

  const classes = getColorClasses();

  return (
    <div
      className={`relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl ${
        darkMode ? "bg-gray-800" : "bg-white"
      } border ${classes.border} p-6 group`}
    >
      {/* Background Gradient Effect */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${classes.gradient}`}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p
              className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              {title}
            </p>
            <h3
              className={`text-2xl font-bold mt-1 ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              {value}
            </h3>
          </div>
          <div className={`p-3 rounded-xl ${classes.iconBg} ${classes.text}`}>
            {icon}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {trend === "up" && <FiTrendingUp className="text-green-500" />}
          {trend === "down" && <FiTrendingDown className="text-red-500" />}
          <span
            className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
          >
            {change}
          </span>
        </div>
      </div>
    </div>
  );
};

// Small Metric Card Component
const SmallMetricCard = ({ title, value, icon, darkMode }) => {
  return (
    <div
      className={`rounded-lg p-4 border transition-all duration-200 hover:shadow-md ${
        darkMode
          ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
          : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            {value}
          </p>
          <p
            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            {title}
          </p>
        </div>
        <div
          className={`p-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
