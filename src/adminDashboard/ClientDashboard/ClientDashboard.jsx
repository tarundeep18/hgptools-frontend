import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Factory,
  TrendingUp,
  CheckCircle,
  Clock,
  Truck,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Shield,
  BarChart3,
  PieChart,
  ChevronRight,
  Phone,
  Mail,
  PenTool,
  FileMinus,
  Tickets,
  DollarSign,
  Boxes,
  Award,
  Target,
  ClipboardList,
  Eye,
  Grid3x3,
  ListChecks,
  History,
  X,
  FileText,
  Search,
  Filter,
  Building2,
  Users,
  Calendar,
  Download,
  TrendingDown,
  Activity,
  Zap,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import { useAuth } from "../../context/AuthContext";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import MonthlyReport from "./MonthlyReports";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const ClientDashboard = () => {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [rfqList, setRfqList] = useState(0);
  const [tickets, setTickets] = useState(0);
  const [orders, setOrders] = useState(0);
  const [activeItems, setActiveItems] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);

  const userRole = user?.role || "client";
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProgress, setFilterProgress] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [rfqCount, setRfqCount] = useState(0);
  const [drawings, setDrawings] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);

  const [itemsWithDispatch, setItemsWithDispatch] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [dispatchHistoryModal, setDispatchHistoryModal] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);
  const [dispatchSearchTerm, setDispatchSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Enhanced filter states
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartType, setChartType] = useState("bar");
  const [viewMode, setViewMode] = useState("dispatches");

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalItems: 0,
    totalValue: 0,
    averageValue: 0,
    highestValuePO: null,
    highestItemsPO: null,
  });

  const [companyStats, setCompanyStats] = useState([]);
  const [currentItemPage, setCurrentItemPage] = useState(1);

  // State for dispatch filter
  const [dispatchCompanyFilter, setDispatchCompanyFilter] = useState("all");

  const kpiData = {
    activeOrders: { value: 24, change: 8, trend: "up" },
    totalactiveItems: { value: 94.5, change: 2.5, trend: "up" },
    qualityRate: { value: 98.2, change: 0.8, trend: "up" },
    totalDrawings: { value: 320, change: 15, trend: "up" },
    requestRFQ: { value: 45, change: -3, trend: "down" },
    supportTicket: { value: 12, change: -1, trend: "down" },
  };

  // Available months for filtering
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = [2023, 2024, 2025, 2026];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const extractCompaniesFromOrders = (orders) => {
    const companyMap = new Map();
    orders.forEach((order) => {
      const companyName = order.submittedBy?.companyName || "Unknown Company";
      const companyId =
        order.submittedBy?._id || order.submittedBy || "unknown";
      if (!companyMap.has(companyId)) {
        companyMap.set(companyId, {
          _id: companyId,
          name: companyName,
        });
      }
    });
    return Array.from(companyMap.values());
  };

  // Enhanced filter by date range and month
  const filterByDateRange = (data, dateField = "dispatchDate") => {
    if (!dateRange.startDate && !dateRange.endDate && !selectedMonth)
      return data;

    return data.filter((item) => {
      const itemDate = new Date(item[dateField]);

      // Month filter
      if (selectedMonth) {
        const monthIndex = months.indexOf(selectedMonth);
        if (itemDate.getMonth() !== monthIndex) return false;
        if (itemDate.getFullYear() !== selectedYear) return false;
      }

      // Date range filter
      if (dateRange.startDate) {
        const start = new Date(dateRange.startDate);
        if (itemDate < start) return false;
      }
      if (dateRange.endDate) {
        const end = new Date(dateRange.endDate);
        end.setHours(23, 59, 59);
        if (itemDate > end) return false;
      }

      return true;
    });
  };

  const applyFilters = () => {
    let filtered = [...itemsWithDispatch];
    if (userRole === "admin" && selectedCompany !== "all") {
      filtered = filtered.filter((item) => item.companyId === selectedCompany);
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) => {
        if (searchType === "all") {
          return (
            item.orderNumber?.toLowerCase().includes(term) ||
            item.itemCode?.toLowerCase().includes(term) ||
            item.description?.toLowerCase().includes(term)
          );
        } else if (searchType === "po") {
          return item.orderNumber?.toLowerCase().includes(term);
        } else if (searchType === "item") {
          return item.itemCode?.toLowerCase().includes(term);
        } else if (searchType === "description") {
          return item.description?.toLowerCase().includes(term);
        }
        return false;
      });
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }
    if (filterProgress !== "all") {
      if (filterProgress === "completed") {
        filtered = filtered.filter((item) => item.dispatchProgress === 100);
      } else if (filterProgress === "partial") {
        filtered = filtered.filter(
          (item) => item.dispatchProgress > 0 && item.dispatchProgress < 100,
        );
      } else if (filterProgress === "pending") {
        filtered = filtered.filter((item) => item.dispatchProgress === 0);
      }
    }
    setFilteredItems(filtered);
  };

  // Enhanced get recent dispatches with date filtering
  const getFilteredRecentDispatches = () => {
    let filteredDispatches = [...dispatches];

    // Apply company filter
    if (dispatchCompanyFilter !== "all") {
      filteredDispatches = filteredDispatches.filter((dispatch) => {
        const order = purchaseOrders.find((o) => o._id === dispatch.poId);
        const companyId = order?.submittedBy?._id || order?.submittedBy;
        return companyId === dispatchCompanyFilter;
      });
    }

    // Apply date range filter
    filteredDispatches = filterByDateRange(filteredDispatches, "dispatchDate");

    // Map and sort
    const recentDispatches = filteredDispatches
      .map((dispatch) => {
        const order = purchaseOrders.find((o) => o._id === dispatch.poId);
        let itemDetails = null;
        if (order && order.items) {
          itemDetails = order.items.find(
            (item) => item._id === dispatch.itemId,
          );
        }

        return {
          id: dispatch._id,
          poNumber: dispatch.poNumber || order?.orderNumber || "N/A",
          poId: dispatch.poId,
          itemCode: itemDetails?.itemCode || dispatch.itemCode || "N/A",
          description:
            itemDetails?.description || dispatch.description || "N/A",
          quantity: dispatch.dispatchQuantity || 0,
          unit: itemDetails?.unit || dispatch.unit || "pcs",
          batchNumber: dispatch.batchNumber || "N/A",
          dispatchDate: dispatch.dispatchDate,
          billNumber: dispatch.billNumber || "N/A",
          companyName: order?.submittedBy?.companyName || "Unknown Company",
          companyId: order?.submittedBy?._id || order?.submittedBy,
          status: dispatch.status || "dispatched",
          dispatchedBy: dispatch.dispatchedBy || "N/A",
          qcReport: dispatch.qcReport,
          mtcReport: dispatch.mtcReport,
        };
      })
      .sort((a, b) => new Date(b.dispatchDate) - new Date(a.dispatchDate));

    return recentDispatches;
  };

  // Enhanced dispatch chart by company with trend line
  const getEnhancedDispatchChartData = () => {
    const filteredDispatches = getFilteredRecentDispatches();
    const companyMap = new Map();

    filteredDispatches.forEach((dispatch) => {
      const companyName = dispatch.companyName;
      if (!companyMap.has(companyName)) {
        companyMap.set(companyName, {
          count: 0,
          totalQuantity: 0,
          totalValue: 0,
        });
      }
      const data = companyMap.get(companyName);
      data.count++;
      data.totalQuantity += dispatch.quantity;
      // Find order value
      const order = purchaseOrders.find(
        (o) => o.orderNumber === dispatch.poNumber,
      );
      if (order) {
        data.totalValue += (order.totalValue || 0) / (order.items?.length || 1);
      }
    });

    if (companyMap.size === 0) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            label: "Number of Dispatches",
            data: [0],
            backgroundColor: "rgba(59, 130, 246, 0.7)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
            borderRadius: 8,
          },
          {
            label: "Total Quantity",
            data: [0],
            backgroundColor: "rgba(16, 185, 129, 0.7)",
            borderColor: "rgba(16, 185, 129, 1)",
            borderWidth: 1,
            borderRadius: 8,
          },
        ],
      };
    }

    return {
      labels: Array.from(companyMap.keys()),
      datasets: [
        {
          label: "Number of Dispatches",
          data: Array.from(companyMap.values()).map((v) => v.count),
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 1,
          borderRadius: 8,
        },
        {
          label: "Total Quantity Dispatched",
          data: Array.from(companyMap.values()).map((v) => v.totalQuantity),
          backgroundColor: "rgba(16, 185, 129, 0.7)",
          borderColor: "rgba(16, 185, 129, 1)",
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };
  };

  // Monthly dispatch trend chart
  const getMonthlyDispatchTrendData = () => {
    const filteredDispatches = getFilteredRecentDispatches();
    const monthlyData = new Map();

    filteredDispatches.forEach((dispatch) => {
      const date = new Date(dispatch.dispatchDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthLabel = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { label: monthLabel, count: 0, quantity: 0 });
      }
      const data = monthlyData.get(monthKey);
      data.count++;
      data.quantity += dispatch.quantity;
    });

    const sortedMonths = Array.from(monthlyData.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    return {
      labels: sortedMonths.map(([, data]) => data.label),
      datasets: [
        {
          label: "Number of Dispatches",
          data: sortedMonths.map(([, data]) => data.count),
          borderColor: "rgba(59, 130, 246, 1)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Total Quantity",
          data: sortedMonths.map(([, data]) => data.quantity),
          borderColor: "rgba(16, 185, 129, 1)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  // Order value by company pie chart
  const getCompanyOrderValuePieData = () => {
    const filteredOrders = purchaseOrders
      .filter((order) => {
        if (selectedCompany !== "all") {
          const companyId = order.submittedBy?._id || order.submittedBy;
          return companyId === selectedCompany;
        }
        return true;
      })
      .filter((order) => filterByDateRange([order], "createdAt").length > 0);

    const companyValueMap = new Map();
    filteredOrders.forEach((order) => {
      const companyName = order.submittedBy?.companyName || "Unknown";
      if (!companyValueMap.has(companyName)) {
        companyValueMap.set(companyName, 0);
      }
      companyValueMap.set(
        companyName,
        companyValueMap.get(companyName) + (order.totalValue || 0),
      );
    });

    const colors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
      "#FF6384",
      "#C9CBCF",
      "#7C8B9E",
      "#2C3E50",
    ];

    return {
      labels: Array.from(companyValueMap.keys()),
      datasets: [
        {
          data: Array.from(companyValueMap.values()),
          backgroundColor: colors.slice(0, companyValueMap.size),
          borderWidth: 0,
        },
      ],
    };
  };

  // Item category distribution
  const getItemCategoryDistribution = () => {
    const categoryMap = new Map();

    purchaseOrders.forEach((order) => {
      if (order.items) {
        order.items.forEach((item) => {
          const category = item.category || item.itemType || "General";
          if (!categoryMap.has(category)) {
            categoryMap.set(category, 0);
          }
          categoryMap.set(
            category,
            categoryMap.get(category) + (item.quantity || 0),
          );
        });
      }
    });

    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
    ];

    return {
      labels: Array.from(categoryMap.keys()),
      datasets: [
        {
          data: Array.from(categoryMap.values()),
          backgroundColor: colors.slice(0, categoryMap.size),
          borderWidth: 0,
        },
      ],
    };
  };

  // Advanced radar chart for company performance metrics
  const getCompanyPerformanceRadarData = () => {
    const metrics = [
      "Order Volume",
      "Dispatch Rate",
      "Order Value",
      "Items Variety",
      "Timeliness",
    ];
    const companyData = [];

    companyStats.slice(0, 5).forEach((company) => {
      const totalDispatched = dispatches
        .filter((d) => {
          const order = purchaseOrders.find((o) => o._id === d.poId);
          return order?.submittedBy?._id === company.companyId;
        })
        .reduce((sum, d) => sum + (d.dispatchQuantity || 0), 0);

      const totalOrdered = company.totalItems;
      const dispatchRate =
        totalOrdered > 0 ? (totalDispatched / totalOrdered) * 100 : 0;

      companyData.push({
        label: company.companyName,
        data: [
          company.totalOrders * 10,
          dispatchRate,
          company.totalValue / 100000,
          company.totalItems,
          Math.random() * 100, // Placeholder for timeliness
        ],
      });
    });

    return {
      labels: metrics,
      datasets: companyData.map((company, idx) => ({
        label: company.label,
        data: company.data,
        backgroundColor: `rgba(${59 + idx * 50}, ${130 + idx * 30}, ${246 - idx * 40}, 0.2)`,
        borderColor: `rgba(${59 + idx * 50}, ${130 + idx * 30}, ${246 - idx * 40}, 1)`,
        borderWidth: 2,
      })),
    };
  };

  // Export to CSV function
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header] || "";
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Export successful!");
  };

  useEffect(() => {
    applyFilters();
  }, [
    searchTerm,
    searchType,
    filterStatus,
    filterProgress,
    itemsWithDispatch,
    selectedCompany,
    dispatchCompanyFilter,
    dateRange,
    selectedMonth,
    selectedYear,
  ]);

  const processItemsWithDispatch = async (dispatchData, ordersData = null) => {
    try {
      let orders = ordersData;
      if (!orders) {
        const endpoint =
          userRole === "admin"
            ? `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/purchase-orders`
            : `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/purchase-orders/my-orders`;

        const response = await axios.get(endpoint, {
          withCredentials: true,
        });

        if (response.data.success) {
          orders = response.data.data;
        } else {
          return;
        }
      }

      const orderMap = new Map();
      orders.forEach((order) => {
        orderMap.set(order._id, order);
      });

      const dispatchMap = new Map();
      dispatchData.forEach((dispatch) => {
        const itemId = dispatch.itemId;
        if (!dispatchMap.has(itemId)) {
          dispatchMap.set(itemId, []);
        }
        dispatchMap.get(itemId).push({
          ...dispatch,
          quantity: dispatch.dispatchQuantity,
          batchNumber: dispatch.batchNumber,
          dispatchDate: dispatch.dispatchDate,
          billNumber: dispatch.billNumber,
          qcReport: dispatch.qcReport,
          mtcReport: dispatch.mtcReport,
          poNumber: dispatch.poNumber,
          orderId: dispatch.poId,
        });
      });

      const allItems = [];
      orders.forEach((order) => {
        if (order.items && order.items.length > 0) {
          order.items.forEach((item) => {
            const itemId = item._id;
            const dispatchRecords = dispatchMap.get(itemId) || [];
            const totalDispatched = dispatchRecords.reduce(
              (sum, d) => sum + (d.quantity || 0),
              0,
            );
            const remainingQuantity = (item.quantity || 0) - totalDispatched;
            const dispatchProgress =
              item.quantity > 0 ? (totalDispatched / item.quantity) * 100 : 0;

            allItems.push({
              ...item,
              orderNumber: order.orderNumber,
              orderId: order._id,
              orderStatus: order.status,
              companyId: order.submittedBy?._id || order.submittedBy,
              companyName: order.submittedBy?.companyName || "Unknown Company",
              submittedBy: order.submittedBy,
              dispatchRecords,
              totalDispatched,
              remainingQuantity,
              dispatchProgress,
              batchCount: dispatchRecords.length,
              status: order.status,
            });
          });
        }
      });

      setItemsWithDispatch(allItems);
      setFilteredItems(allItems);

      if (userRole === "admin" && orders.length > 0) {
        const extractedCompanies = extractCompaniesFromOrders(orders);
        setCompanies(extractedCompanies);
      }
    } catch (error) {
      console.error("Error processing items with dispatch:", error);
    }
  };

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      let endpoint;
      if (userRole === "admin") {
        endpoint = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/purchase-orders`;
      } else {
        endpoint = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/purchase-orders/my-orders`;
      }

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });

      if (response.data.success) {
        let orders = response.data.data;

        if (userRole === "admin" && selectedCompany !== "all") {
          orders = orders.filter((order) => {
            const companyId = order.submittedBy?._id || order.submittedBy;
            return companyId === selectedCompany;
          });
        }

        setPurchaseOrders(orders);

        const totalOrdersCount = orders.length;
        const totalItemsCount = orders.reduce(
          (sum, order) => sum + (order.totalItems || 0),
          0,
        );
        const totalValueSum = orders.reduce(
          (sum, order) => sum + (order.totalValue || 0),
          0,
        );

        let highestValuePO = orders[0];
        let highestItemsPO = orders[0];

        orders.forEach((order) => {
          if ((order.totalValue || 0) > (highestValuePO?.totalValue || 0)) {
            highestValuePO = order;
          }
          if ((order.totalItems || 0) > (highestItemsPO?.totalItems || 0)) {
            highestItemsPO = order;
          }
        });

        setStats({
          totalOrders: totalOrdersCount,
          totalItems: totalItemsCount,
          totalValue: totalValueSum,
          averageValue:
            totalOrdersCount > 0 ? totalValueSum / totalOrdersCount : 0,
          highestValuePO: highestValuePO,
          highestItemsPO: highestItemsPO,
        });

        if (userRole === "admin") {
          calculateCompanyStats(orders);
          const extractedCompanies = extractCompaniesFromOrders(orders);
          setCompanies(extractedCompanies);
        }
      } else {
        toast.error(response.data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(error.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const calculateCompanyStats = (orders) => {
    const companyMap = new Map();
    orders.forEach((order) => {
      const companyId = order.submittedBy?._id || order.submittedBy;
      const companyName = order.submittedBy?.companyName || "Unknown Company";
      if (!companyMap.has(companyId)) {
        companyMap.set(companyId, {
          companyId,
          companyName,
          totalOrders: 0,
          totalValue: 0,
          totalItems: 0,
          orders: [],
        });
      }
      const companyStat = companyMap.get(companyId);
      companyStat.totalOrders++;
      companyStat.totalValue += order.totalValue || 0;
      companyStat.totalItems += order.totalItems || 0;
      companyStat.orders.push(order);
    });
    setCompanyStats(Array.from(companyMap.values()));
  };

  const fetchDispatches = async () => {
    try {
      const endpoint =
        userRole === "admin"
          ? `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch-orders`
          : `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch-orders/my-dispatches`;

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });

      if (response.data.success) {
        let dispatchData = response.data.data;

        if (
          userRole === "admin" &&
          selectedCompany !== "all" &&
          purchaseOrders.length > 0
        ) {
          const companyOrderIds = new Set(
            purchaseOrders
              .filter((order) => {
                const companyId = order.submittedBy?._id || order.submittedBy;
                return companyId === selectedCompany;
              })
              .map((order) => order._id),
          );
          dispatchData = dispatchData.filter((dispatch) =>
            companyOrderIds.has(dispatch.poId),
          );
        }

        setDispatches(dispatchData);
        await processItemsWithDispatch(dispatchData);
      }
    } catch (error) {
      console.error("Error fetching dispatches:", error);
    }
  };

  const fetchRFQDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq`,
        { withCredentials: true },
      );

      if (response.data.success) {
        let rfqData = [];

        if (response.data.data) {
          rfqData = response.data.data;
        } else if (response.data.rfqs) {
          rfqData = response.data.rfqs;
        } else if (Array.isArray(response.data)) {
          rfqData = response.data;
        }

        if (
          userRole === "admin" &&
          selectedCompany !== "all" &&
          purchaseOrders.length > 0
        ) {
          const companyUserIds = new Set(
            purchaseOrders
              .filter((order) => {
                const companyId = order.submittedBy?._id || order.submittedBy;
                return companyId === selectedCompany;
              })
              .map((order) => order.submittedBy?._id || order.submittedBy),
          );
          const filteredRfqs = rfqData.filter((rfq) =>
            companyUserIds.has(rfq.submittedBy || rfq.createdBy),
          );
          setRfqList(filteredRfqs.length);
          setRfqCount(filteredRfqs.length);
        } else {
          const count =
            response.data.count || response.data.totalRfqs || rfqData.length;
          setRfqList(count);
          setRfqCount(count);
        }
      } else {
        toast.error(response.data.message || "Failed to fetch rfq data");
      }
    } catch (error) {
      console.error("Error fetching RFQ:", error);
      toast.error(error.response?.data?.message || "Failed to fetch rfq");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrawings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/folder`,
        { withCredentials: true },
      );

      if (response.data.success) {
        let drawingsData = [];

        if (response.data.data) {
          drawingsData = response.data.data;
        } else if (response.data.folders) {
          drawingsData = response.data.folders;
        } else if (response.data.drawings) {
          drawingsData = response.data.drawings;
        } else if (Array.isArray(response.data)) {
          drawingsData = response.data;
        }

        if (
          userRole === "admin" &&
          selectedCompany !== "all" &&
          purchaseOrders.length > 0
        ) {
          const companyUserIds = new Set(
            purchaseOrders
              .filter((order) => {
                const companyId = order.submittedBy?._id || order.submittedBy;
                return companyId === selectedCompany;
              })
              .map((order) => order.submittedBy?._id || order.submittedBy),
          );
          const filteredDrawings = drawingsData.filter((drawing) =>
            companyUserIds.has(drawing.uploadedBy || drawing.createdBy),
          );
          setDrawings(filteredDrawings.length);
        } else {
          const totalDrawings =
            response.data.pagination?.totalDrawings ||
            response.data.totalDrawings ||
            drawingsData.length;
          setDrawings(totalDrawings);
        }
      } else {
        toast.error(response.data.message || "Failed to fetch drawings");
      }
    } catch (error) {
      console.error("Error fetching drawings:", error);
      toast.error(error.response?.data?.message || "Failed to fetch drawings");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const endpoint =
        userRole === "admin"
          ? `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/tickets`
          : `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/tickets/my`;

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });

      if (response.data.success) {
        let ticketsData = [];
        let totalTicketsCount = 0;

        if (userRole === "admin") {
          if (response.data.tickets) {
            ticketsData = response.data.tickets;
            totalTicketsCount =
              response.data.totalTickets || ticketsData.length;
          } else if (response.data.data) {
            ticketsData = response.data.data;
            totalTicketsCount = ticketsData.length;
          }
        } else {
          ticketsData = response.data.tickets || response.data.data || [];
          totalTicketsCount = ticketsData.length;
        }

        if (
          userRole === "admin" &&
          selectedCompany !== "all" &&
          purchaseOrders.length > 0
        ) {
          const companyUserIds = new Set(
            purchaseOrders
              .filter((order) => {
                const companyId = order.submittedBy?._id || order.submittedBy;
                return companyId === selectedCompany;
              })
              .map((order) => order.submittedBy?._id || order.submittedBy),
          );

          const filteredTickets = ticketsData.filter((ticket) => {
            const ticketUserId = ticket.createdBy?._id || ticket.createdBy;
            return companyUserIds.has(ticketUserId);
          });

          setTickets(filteredTickets.length);
          setTicketCount(filteredTickets.length);
        } else {
          setTickets(totalTicketsCount);
          setTicketCount(totalTicketsCount);
        }
      } else {
        toast.error(response.data.message || "Failed to fetch tickets");
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error(error.response?.data?.message || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      setLoading(true);
      const endpoint = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/purchase-orders/stats/summary`;

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });

      let data = response.data;

      if (
        userRole === "admin" &&
        selectedCompany !== "all" &&
        purchaseOrders.length > 0
      ) {
        const filteredOrders = purchaseOrders.filter((order) => {
          const companyId = order.submittedBy?._id || order.submittedBy;
          return companyId === selectedCompany;
        });
        setOrders(filteredOrders.length);
        setActiveItems(
          filteredOrders.reduce(
            (sum, order) => sum + (order.totalItems || 0),
            0,
          ),
        );
      } else {
        setOrders(data.data.totalOrders);
        setActiveItems(data.data.totalItems);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const endpoint =
        userRole === "admin"
          ? `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/purchase-orders`
          : `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/purchase-orders/my-orders`;

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });

      let data = response.data.data;

      if (
        userRole === "admin" &&
        selectedCompany !== "all" &&
        purchaseOrders.length > 0
      ) {
        data = data.filter((order) => {
          const companyId = order.submittedBy?._id || order.submittedBy;
          return companyId === selectedCompany;
        });
      }

      const latestPO = Array.isArray(data) ? data[0] : data;

      if (latestPO && latestPO.items) {
        const latestItems = latestPO.items.slice(0, 5);
        setRecentOrders(
          latestItems.map((item) => ({
            orderNumber: latestPO.orderNumber,
            description: item.description,
            itemCode: item.itemCode,
            quantity: item.quantity,
            progress: item.progress,
            currentStage: item.currentStage,
            deliveryDate: item.deliveryDate,
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchPurchaseOrders();
      await fetchDispatches();
      await fetchRFQDetails();
      await fetchDrawings();
      await fetchTickets();
      await fetchOrderStats();
      await fetchOrder();
    };
    initializeData();
  }, [userRole, selectedCompany, dispatchCompanyFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([
      fetchPurchaseOrders(),
      fetchDispatches(),
      fetchRFQDetails(),
      fetchDrawings(),
      fetchTickets(),
      fetchOrderStats(),
      fetchOrder(),
    ]).finally(() => setTimeout(() => setIsRefreshing(false), 1500));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSearchType("all");
    setFilterStatus("all");
    setFilterProgress("all");
    setDateRange({ startDate: "", endDate: "" });
    setSelectedMonth("");
    setSelectedYear(new Date().getFullYear());
  };

  const getUniquePOCount = () => {
    const uniquePOs = new Set(
      itemsWithDispatch.map((item) => item.orderNumber),
    );
    return uniquePOs.size;
  };

  const getPOValueComparisonData = () => {
    const sortedOrders = [...purchaseOrders].sort(
      (a, b) => (b.totalValue || 0) - (a.totalValue || 0),
    );
    return {
      labels: sortedOrders.map((order) => order.orderNumber),
      datasets: [
        {
          label: "Order Value (₹)",
          data: sortedOrders.map((order) => order.totalValue || 0),
          backgroundColor: sortedOrders.map((_, idx) =>
            idx === 0 ? "#10B981" : "#3B82F6",
          ),
          borderRadius: 8,
        },
      ],
    };
  };

  const getPOItemsComparisonData = () => {
    const sortedOrders = [...purchaseOrders].sort(
      (a, b) => (b.totalItems || 0) - (a.totalItems || 0),
    );
    return {
      labels: sortedOrders.map((order) => order.orderNumber),
      datasets: [
        {
          label: "Number of Items",
          data: sortedOrders.map((order) => order.totalItems || 0),
          backgroundColor: sortedOrders.map((_, idx) =>
            idx === 0 ? "#F59E0B" : "#8B5CF6",
          ),
          borderRadius: 8,
        },
      ],
    };
  };

  const getItemsBreakdownData = () => {
    return {
      labels: purchaseOrders.map((order) => order.orderNumber),
      datasets: [
        {
          label: "Items Ordered",
          data: purchaseOrders.map((order) => order.totalItems || 0),
          backgroundColor: "#3B82F6",
          borderRadius: 8,
        },
      ],
    };
  };

  const getDispatchProgressData = () => {
    const poDispatchMap = new Map();
    dispatches.forEach((dispatch) => {
      const current = poDispatchMap.get(dispatch.poNumber) || 0;
      poDispatchMap.set(
        dispatch.poNumber,
        current + (dispatch.dispatchQuantity || 0),
      );
    });
    const poOrderedMap = new Map();
    purchaseOrders.forEach((order) => {
      const totalQty =
        order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      poOrderedMap.set(order.orderNumber, totalQty);
    });
    const labels = [];
    const dispatchedData = [];
    const orderedData = [];
    purchaseOrders.forEach((order) => {
      labels.push(order.orderNumber);
      const ordered = poOrderedMap.get(order.orderNumber) || 0;
      const dispatched = poDispatchMap.get(order.orderNumber) || 0;
      orderedData.push(ordered);
      dispatchedData.push(dispatched);
    });
    return {
      labels: labels,
      datasets: [
        {
          label: "Total Ordered Quantity",
          data: orderedData,
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderRadius: 8,
        },
        {
          label: "Total Dispatched Quantity",
          data: dispatchedData,
          backgroundColor: "rgba(16, 185, 129, 0.8)",
          borderRadius: 8,
        },
      ],
    };
  };

  const getTopDispatchedItemsData = () => {
    const filteredDispatches = getFilteredRecentDispatches();
    const itemMap = new Map();

    filteredDispatches.forEach((dispatch) => {
      const itemKey = `${dispatch.itemCode} - ${dispatch.description}`;
      if (!itemMap.has(itemKey)) {
        itemMap.set(itemKey, {
          code: dispatch.itemCode,
          description: dispatch.description,
          quantity: 0,
        });
      }
      itemMap.get(itemKey).quantity += dispatch.quantity;
    });

    const sortedItems = Array.from(itemMap.entries())
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 10);

    return {
      labels: sortedItems.map(([key]) => {
        const item = key.split(" - ")[0];
        return item.length > 20 ? item.substring(0, 20) + "..." : item;
      }),
      datasets: [
        {
          label: "Quantity Dispatched",
          data: sortedItems.map(([, data]) => data.quantity),
          backgroundColor: "rgba(16, 185, 129, 0.7)",
          borderRadius: 8,
        },
      ],
    };
  };

  const getMonthlyTrendsData = () => {
    const monthlyMap = new Map();

    purchaseOrders.forEach((order) => {
      const date = new Date(order.createdAt);
      const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;

      if (!monthlyMap.has(monthYear)) {
        monthlyMap.set(monthYear, { count: 0, value: 0 });
      }
      const data = monthlyMap.get(monthYear);
      data.count++;
      data.value += order.totalValue || 0;
    });

    const sortedMonths = Array.from(monthlyMap.keys()).slice(-6);

    return {
      labels: sortedMonths,
      datasets: [
        {
          label: "Number of Orders",
          data: sortedMonths.map((m) => monthlyMap.get(m).count),
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderRadius: 8,
          yAxisID: "y",
        },
        {
          label: "Order Value (₹)",
          data: sortedMonths.map((m) => monthlyMap.get(m).value),
          backgroundColor: "rgba(16, 185, 129, 0.7)",
          borderRadius: 8,
          yAxisID: "y1",
        },
      ],
    };
  };

  const getStatusBreakdown = () => {
    const statusCounts = {
      submitted: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    purchaseOrders.forEach((order) => {
      const status = order.status || "submitted";
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      } else {
        statusCounts.submitted++;
      }
    });

    const colors = {
      submitted: "#F59E0B",
      in_progress: "#3B82F6",
      completed: "#10B981",
      cancelled: "#EF4444",
    };

    return Object.entries(statusCounts).map(([key, value]) => ({
      label: key.replace("_", " ").toUpperCase(),
      count: value,
      color: colors[key] || "#6B7280",
    }));
  };

  const getStatusDistributionData = () => {
    const statusCounts = {
      submitted: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    purchaseOrders.forEach((order) => {
      const status = order.status || "submitted";
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      } else {
        statusCounts.submitted++;
      }
    });

    return {
      labels: ["Submitted", "In Progress", "Completed", "Cancelled"],
      datasets: [
        {
          data: [
            statusCounts.submitted,
            statusCounts.in_progress,
            statusCounts.completed,
            statusCounts.cancelled,
          ],
          backgroundColor: ["#F59E0B", "#3B82F6", "#10B981", "#EF4444"],
          borderWidth: 0,
        },
      ],
    };
  };

  const getCompanyValueData = () => {
    return {
      labels: companyStats.map((c) => c.companyName),
      datasets: [
        {
          label: "Total Order Value (₹)",
          data: companyStats.map((c) => c.totalValue),
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderRadius: 8,
        },
      ],
    };
  };

  const getTopItemsData = () => {
    const itemMap = new Map();

    purchaseOrders.forEach((order) => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const itemKey = `${item.itemCode} - ${item.description}`;
          if (!itemMap.has(itemKey)) {
            itemMap.set(itemKey, 0);
          }
          itemMap.set(itemKey, itemMap.get(itemKey) + (item.quantity || 0));
        });
      }
    });

    const sortedItems = Array.from(itemMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: sortedItems.map(([name]) =>
        name.length > 20 ? name.substring(0, 20) + "..." : name,
      ),
      datasets: [
        {
          label: "Quantity Ordered",
          data: sortedItems.map(([, qty]) => qty),
          backgroundColor: "rgba(16, 185, 129, 0.7)",
          borderRadius: 8,
        },
      ],
    };
  };

  const getDispatchCompletionData = () => {
    const companyDispatchMap = new Map();

    companyStats.forEach((company) => {
      let totalOrdered = 0;
      let totalDispatched = 0;

      company.orders.forEach((order) => {
        if (order.items) {
          order.items.forEach((item) => {
            totalOrdered += item.quantity || 0;
          });
        }
      });

      const companyDispatches = dispatches.filter((d) => {
        const order = purchaseOrders.find((o) => o._id === d.poId);
        return order && order.submittedBy?._id === company.companyId;
      });

      companyDispatches.forEach((dispatch) => {
        totalDispatched += dispatch.dispatchQuantity || 0;
      });

      const completionRate =
        totalOrdered > 0 ? (totalDispatched / totalOrdered) * 100 : 0;
      companyDispatchMap.set(company.companyName, completionRate);
    });

    return {
      labels: Array.from(companyDispatchMap.keys()),
      datasets: [
        {
          label: "Dispatch Completion Rate (%)",
          data: Array.from(companyDispatchMap.values()),
          backgroundColor: "rgba(16, 185, 129, 0.7)",
          borderRadius: 8,
        },
      ],
    };
  };

  const getValueDistributionData = () => {
    const ranges = [
      { min: 0, max: 10000, label: "< ₹10K" },
      { min: 10000, max: 50000, label: "₹10K - ₹50K" },
      { min: 50000, max: 100000, label: "₹50K - ₹1L" },
      { min: 100000, max: 500000, label: "₹1L - ₹5L" },
      { min: 500000, max: 1000000, label: "₹5L - ₹10L" },
      { min: 1000000, max: Infinity, label: "> ₹10L" },
    ];

    const distribution = ranges.map(() => 0);

    purchaseOrders.forEach((order) => {
      const value = order.totalValue || 0;
      const index = ranges.findIndex((r) => value >= r.min && value < r.max);
      if (index !== -1) distribution[index]++;
    });
    return {
      labels: ranges.map((r) => r.label),
      datasets: [
        {
          label: "Number of Orders",
          data: distribution,
          backgroundColor: "rgba(139, 92, 246, 0.7)",
          borderRadius: 8,
        },
      ],
    };
  };

  const getTopCompaniesByRevenue = () => {
    return companyStats
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)
      .map((c) => ({ name: c.companyName, value: c.totalValue }));
  };

  const getOverallDispatchRate = () => {
    let totalOrdered = 0;
    let totalDispatched = 0;

    purchaseOrders.forEach((order) => {
      if (order.items) {
        order.items.forEach((item) => {
          totalOrdered += item.quantity || 0;
        });
      }
    });

    dispatches.forEach((dispatch) => {
      totalDispatched += dispatch.dispatchQuantity || 0;
    });

    return totalOrdered > 0
      ? ((totalDispatched / totalOrdered) * 100).toFixed(1)
      : 0;
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            if (
              this.chart?.config?.data?.datasets?.[0]?.label?.includes("Value")
            ) {
              return "₹" + value.toLocaleString();
            }
            return value;
          },
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Count / Quantity" },
      },
    },
  };

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Quantity" },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { usePointStyle: true, padding: 15, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || "";
            const value = ctx.raw || 0;
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };
  const recentDispatches = useMemo(() => {
    let filteredDispatches = [...dispatches];

    // Apply company filter
    if (dispatchCompanyFilter !== "all") {
      filteredDispatches = filteredDispatches.filter((dispatch) => {
        const order = purchaseOrders.find((o) => o._id === dispatch.poId);
        const companyId = order?.submittedBy?._id || order?.submittedBy;
        return companyId === dispatchCompanyFilter;
      });
    }

    // Apply date range filter
    if (dateRange.startDate || dateRange.endDate || selectedMonth) {
      filteredDispatches = filteredDispatches.filter((dispatch) => {
        const itemDate = new Date(dispatch.dispatchDate);

        // Month filter
        if (selectedMonth) {
          const monthIndex = months.indexOf(selectedMonth);
          if (itemDate.getMonth() !== monthIndex) return false;
          if (itemDate.getFullYear() !== selectedYear) return false;
        }

        // Date range filter
        if (dateRange.startDate) {
          const start = new Date(dateRange.startDate);
          if (itemDate < start) return false;
        }
        if (dateRange.endDate) {
          const end = new Date(dateRange.endDate);
          end.setHours(23, 59, 59);
          if (itemDate > end) return false;
        }

        return true;
      });
    }

    // Map and sort
    return filteredDispatches
      .map((dispatch) => {
        const order = purchaseOrders.find((o) => o._id === dispatch.poId);
        let itemDetails = null;
        if (order && order.items) {
          itemDetails = order.items.find(
            (item) => item._id === dispatch.itemId,
          );
        }

        return {
          id: dispatch._id,
          poNumber: dispatch.poNumber || order?.orderNumber || "N/A",
          poId: dispatch.poId,
          itemCode: itemDetails?.itemCode || dispatch.itemCode || "N/A",
          description:
            itemDetails?.description || dispatch.description || "N/A",
          quantity: dispatch.dispatchQuantity || 0,
          unit: itemDetails?.unit || dispatch.unit || "pcs",
          batchNumber: dispatch.batchNumber || "N/A",
          dispatchDate: dispatch.dispatchDate,
          billNumber: dispatch.billNumber || "N/A",
          billFile: dispatch.billFile || "N/A",
          companyName: order?.submittedBy?.companyName || "Unknown Company",
          companyId: order?.submittedBy?._id || order?.submittedBy,
          status: dispatch.status || "dispatched",
          dispatchedBy: dispatch.dispatchedBy || "N/A",
          qcReport: dispatch.qcReport,
          mtcReport: dispatch.mtcReport,
        };
      })
      .sort((a, b) => new Date(b.dispatchDate) - new Date(a.dispatchDate));
  }, [
    dispatches,
    purchaseOrders,
    dispatchCompanyFilter,
    dateRange,
    selectedMonth,
    selectedYear,
  ]);

  // Filtered dispatches based on search
  // Filtered dispatches based on search
  const filteredDispatchData = useMemo(() => {
    let data = recentDispatches;

    if (dispatchSearchTerm) {
      const searchLower = dispatchSearchTerm.toLowerCase();
      data = data.filter((dispatch) => {
        // Safely convert values to strings before calling toLowerCase
        const poNumber = dispatch.poNumber?.toString().toLowerCase() || "";
        const itemCode = dispatch.itemCode?.toString().toLowerCase() || "";
        const description =
          dispatch.description?.toString().toLowerCase() || "";
        const companyName =
          dispatch.companyName?.toString().toLowerCase() || "";
        const batchNumber =
          dispatch.batchNumber?.toString().toLowerCase() || "";

        return (
          poNumber.includes(searchLower) ||
          itemCode.includes(searchLower) ||
          description.includes(searchLower) ||
          companyName.includes(searchLower) ||
          batchNumber.includes(searchLower)
        );
      });
    }

    return data;
  }, [recentDispatches, dispatchSearchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredDispatchData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    return filteredDispatchData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [filteredDispatchData, currentPage, itemsPerPage]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    dispatchSearchTerm,
    dispatchCompanyFilter,
    selectedMonth,
    dateRange,
    selectedYear,
  ]);

  // Add this pagination logic after filteredItems is defined
  const totalItemPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedFilteredItems = useMemo(() => {
    return filteredItems.slice(
      (currentItemPage - 1) * itemsPerPage,
      currentItemPage * itemsPerPage,
    );
  }, [filteredItems, currentItemPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentItemPage(1);
  }, [searchTerm, filterStatus, filterProgress, selectedCompany]);
  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [dispatchSearchTerm]);
  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
    badge,
    trend,
    change,
  }) => (
    <div
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onMouseEnter={() => setHoveredCard(title)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${color} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${trend === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
          >
            {trend === "up" ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
        {badge && (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {value?.toLocaleString()}
        </p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  const DateRangeFilter = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Start Date
        </label>
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) =>
            setDateRange({ ...dateRange, startDate: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          End Date
        </label>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) =>
            setDateRange({ ...dateRange, endDate: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Month
        </label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        >
          <option value="">All Months</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Year
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const AdminCompanyFilter = () => (
    <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-blue-600" />
        <label className="text-sm font-semibold text-gray-700">
          Filter by Company:
        </label>
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="flex-1 max-w-xs px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        >
          <option value="all">All Companies</option>
          {companies.map((company) => (
            <option key={company._id} value={company._id}>
              {company.name}
            </option>
          ))}
        </select>
        {selectedCompany !== "all" && (
          <button
            onClick={() => setSelectedCompany("all")}
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-all"
          >
            Clear Filter
          </button>
        )}
      </div>
    </div>
  );

  const AdminCompanyStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {companyStats.map((company) => (
        <div
          key={company.companyId}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-800">{company.companyName}</h3>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
              {company.totalOrders} Orders
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Value:</span>
              <span className="font-semibold text-gray-900">
                ₹{company.totalValue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-semibold text-gray-900">
                {company.totalItems.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="px-8 py-8 relative">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <div className="flex items-center space-x-4 mb-3">
                  <h2 className="text-3xl font-bold animate-slideInLeft">
                    Welcome back,{" "}
                    {userRole === "admin"
                      ? "Administrator"
                      : "Manufacturing Partner"}
                    !
                  </h2>
                  <button
                    onClick={handleRefresh}
                    className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-full"
                    title="Refresh Data"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                  </button>
                  {userRole === "admin" && (
                    <>
                      <button
                        onClick={() => {
                          console.log("Monthly Report button clicked");
                          setShowMonthlyReport(true);
                        }}
                        className="ml-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Monthly Report
                      </button>
                      <button
                        onClick={() =>
                          exportToCSV(
                            getFilteredRecentDispatches(),
                            "dispatches_report.csv",
                          )
                        }
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Data
                      </button>
                    </>
                  )}
                </div>
                <p className="text-blue-100 mb-6 max-w-2xl animate-slideInLeft animation-delay-200">
                  {userRole === "admin"
                    ? "Manage and monitor all manufacturing partners, track orders across companies, and gain insights from company-wise analytics."
                    : "Track your production orders, quality reports, and manufacturing insights in real-time with our analytics dashboard."}
                </p>
                <div className="flex flex-wrap items-center gap-4 animate-slideInLeft animation-delay-400">
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      98% Quality Rate
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      94% On-Time Delivery
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      ISO 9001:2015 Certified
                    </span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse"></div>
                  <Factory className="w-32 h-32 text-white/20 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Company Filter - Only for Admin */}
        {userRole === "admin" && companies.length > 0 && <AdminCompanyFilter />}

        {/* Date Range Filter for Admin */}
        {userRole === "admin" && <DateRangeFilter />}

        {/* Admin Company Stats Overview - Only for Admin */}
        {userRole === "admin" && companyStats.length > 0 && (
          <AdminCompanyStats />
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {userRole === "admin" ? (
            // Admin KPI Cards
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    Total Companies
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {companies.length}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    Total Orders
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{orders}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    Active Clients
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      new Set(
                        purchaseOrders.map(
                          (o) => o.submittedBy?._id || o.submittedBy,
                        ),
                      ).size
                    }
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600">
                    <FileMinus className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    Total RFQs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{rfqList}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                    <Tickets className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    Support Tickets
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{tickets}</p>
                </div>
              </div>
            </>
          ) : (
            // Client KPI Cards - Only showing their own data
            <>
              <Link to="/order-tracking">
                <StatCard
                  title="Active Orders"
                  value={orders}
                  change={kpiData.activeOrders.change}
                  trend={kpiData.activeOrders.trend}
                  icon={Package}
                  color="from-blue-500 to-blue-600"
                />
              </Link>
              <Link to="/order-tracking">
                <StatCard
                  title="Total Active Items"
                  value={activeItems}
                  icon={Truck}
                  color="from-green-500 to-green-600"
                />
              </Link>
              <Link to="/client-drawings">
                <StatCard
                  title="Total Drawings"
                  value={drawings}
                  trend={kpiData.totalDrawings.trend}
                  icon={PenTool}
                  color="from-pink-500 to-pink-600"
                />
              </Link>
              <Link to="/request-rfq">
                <StatCard
                  title="Request RFQ"
                  value={rfqList}
                  trend={kpiData.requestRFQ.trend}
                  icon={FileMinus}
                  color="from-yellow-500 to-yellow-600"
                />
              </Link>
              <Link to="/support-ticket">
                <StatCard
                  title="Support Tickets"
                  value={tickets}
                  trend={kpiData.supportTicket.trend}
                  icon={Tickets}
                  color="from-red-500 to-red-600"
                />
              </Link>
            </>
          )}
        </div>

        {/* Advanced Analytics Dashboard - ONLY FOR ADMIN */}
        {userRole === "admin" && purchaseOrders.length > 0 && (
          <>
            {/* Row 1: Advanced Charts - Pie Charts and Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
              {/* Order Value Distribution by Company - Pie Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Order Value Distribution by Company
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Revenue share across manufacturing partners
                      </p>
                    </div>
                    <PieChart className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[350px]">
                    <Pie
                      data={getCompanyOrderValuePieData()}
                      options={doughnutOptions}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Dispatches by Company and Top Items */}
            {/* Dispatches Analytics Dashboard - Enhanced with Month Filter */}
            {/* Premium Dispatches Analytics Dashboard */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
              {/* Header with Gradient */}
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Dispatches Analytics
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      Track and analyze all dispatch activities
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                      <span className="text-white text-sm font-medium">
                        Total: {getFilteredRecentDispatches().length} dispatches
                      </span>
                    </div>
                    <Truck className="w-6 h-6 text-white/80" />
                  </div>
                </div>
              </div>

              {/* Premium Filter Bar */}
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Company
                    </label>
                    <select
                      value={dispatchCompanyFilter}
                      onChange={(e) => setDispatchCompanyFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="all">🏢 All Companies</option>
                      {companies.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-[180px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Month
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                      <option value="">📅 All Months</option>
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-[140px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) =>
                        setSelectedYear(parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Date Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) =>
                          setDateRange({
                            ...dateRange,
                            startDate: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        placeholder="Start"
                      />
                      <span className="text-gray-400 self-center">-</span>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) =>
                          setDateRange({
                            ...dateRange,
                            endDate: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        placeholder="End"
                      />
                    </div>
                  </div>

                  {(dispatchCompanyFilter !== "all" ||
                    selectedMonth ||
                    dateRange.startDate ||
                    dateRange.endDate) && (
                    <button
                      onClick={() => {
                        setDispatchCompanyFilter("all");
                        setSelectedMonth("");
                        setDateRange({ startDate: "", endDate: "" });
                      }}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
                    >
                      <X size={14} />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5 bg-white">
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl">
                  <p className="text-xs text-gray-500">Total Dispatches</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {getFilteredRecentDispatches().length}
                  </p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl">
                  <p className="text-xs text-gray-500">Total Quantity</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {getFilteredRecentDispatches()
                      .reduce((sum, d) => sum + d.quantity, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl">
                  <p className="text-xs text-gray-500">Companies</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {
                      new Set(
                        getFilteredRecentDispatches().map((d) => d.companyName),
                      ).size
                    }
                  </p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl">
                  <p className="text-xs text-gray-500">Unique POs</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {
                      new Set(
                        getFilteredRecentDispatches().map((d) => d.poNumber),
                      ).size
                    }
                  </p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl">
                  <p className="text-xs text-gray-500">Unique Items</p>
                  <p className="text-2xl font-bold text-rose-600">
                    {
                      new Set(
                        getFilteredRecentDispatches().map((d) => d.itemCode),
                      ).size
                    }
                  </p>
                </div>
              </div>

              {/* Charts Section - 4 Charts Grid */}
              <div className="p-5 border-t border-gray-100 bg-gray-50/30">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-blue-500" />
                  Dispatch Analytics Overview
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Dispatches by Date (Timeline) */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800">
                          Dispatches by Date
                        </h5>
                        <p className="text-xs text-gray-400">
                          Number of dispatches per day
                        </p>
                      </div>
                      <Calendar size={14} className="text-gray-400" />
                    </div>
                    <div className="h-[250px]">
                      <Bar
                        data={(() => {
                          const dateMap = new Map();
                          getFilteredRecentDispatches().forEach((dispatch) => {
                            const date = formatDate(dispatch.dispatchDate);
                            dateMap.set(date, (dateMap.get(date) || 0) + 1);
                          });
                          const sortedDates = Array.from(dateMap.keys()).sort(
                            (a, b) => new Date(a) - new Date(b),
                          );
                          return {
                            labels: sortedDates,
                            datasets: [
                              {
                                label: "Number of Dispatches",
                                data: sortedDates.map((d) => dateMap.get(d)),
                                backgroundColor: "rgba(59, 130, 246, 0.6)",
                                borderRadius: 6,
                              },
                            ],
                          };
                        })()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "top",
                              labels: { font: { size: 10 } },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: { stepSize: 1, font: { size: 10 } },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* Chart 2: Quantity by Date */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800">
                          Quantity Dispatched by Date
                        </h5>
                        <p className="text-xs text-gray-400">
                          Total units dispatched per day
                        </p>
                      </div>
                      <Package size={14} className="text-gray-400" />
                    </div>
                    <div className="h-[250px]">
                      <Line
                        data={(() => {
                          const dateMap = new Map();
                          getFilteredRecentDispatches().forEach((dispatch) => {
                            const date = formatDate(dispatch.dispatchDate);
                            dateMap.set(
                              date,
                              (dateMap.get(date) || 0) + dispatch.quantity,
                            );
                          });
                          const sortedDates = Array.from(dateMap.keys()).sort(
                            (a, b) => new Date(a) - new Date(b),
                          );
                          return {
                            labels: sortedDates,
                            datasets: [
                              {
                                label: "Total Quantity",
                                data: sortedDates.map((d) => dateMap.get(d)),
                                borderColor: "rgb(16, 185, 129)",
                                backgroundColor: "rgba(16, 185, 129, 0.1)",
                                fill: true,
                                tension: 0.4,
                              },
                            ],
                          };
                        })()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "top",
                              labels: { font: { size: 10 } },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: { font: { size: 10 } },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* Chart 3: Dispatches by Item Code/Description */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800">
                          Dispatches by Item
                        </h5>
                        <p className="text-xs text-gray-400">
                          Most dispatched items (by code & description)
                        </p>
                      </div>
                      <Boxes size={14} className="text-gray-400" />
                    </div>
                    <div className="h-[280px]">
                      <Bar
                        data={(() => {
                          const itemMap = new Map();
                          getFilteredRecentDispatches().forEach((dispatch) => {
                            const itemKey = `${dispatch.itemCode} - ${dispatch.description?.substring(0, 30) || "N/A"}`;
                            itemMap.set(
                              itemKey,
                              (itemMap.get(itemKey) || 0) + dispatch.quantity,
                            );
                          });
                          const sortedItems = Array.from(itemMap.entries())
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 10);
                          return {
                            labels: sortedItems.map(([key]) => {
                              const parts = key.split(" - ");
                              return parts[0].length > 15
                                ? parts[0].substring(0, 15) + "..."
                                : parts[0];
                            }),
                            datasets: [
                              {
                                label: "Quantity Dispatched",
                                data: sortedItems.map(([, qty]) => qty),
                                backgroundColor: "rgba(139, 92, 246, 0.7)",
                                borderRadius: 6,
                              },
                            ],
                          };
                        })()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: "y",
                          plugins: {
                            legend: {
                              position: "top",
                              labels: { font: { size: 10 } },
                            },
                            tooltip: {
                              callbacks: {
                                label: (ctx) =>
                                  `${ctx.raw.toLocaleString()} units`,
                                title: (tooltipItems) => {
                                  const index = tooltipItems[0].dataIndex;
                                  const itemKey = Array.from(
                                    (() => {
                                      const itemMap = new Map();
                                      getFilteredRecentDispatches().forEach(
                                        (dispatch) => {
                                          const key = `${dispatch.itemCode} - ${dispatch.description?.substring(0, 30) || "N/A"}`;
                                          itemMap.set(key, 0);
                                        },
                                      );
                                      return itemMap.keys();
                                    })(),
                                  )[index];
                                  return itemKey?.substring(0, 50) || "";
                                },
                              },
                            },
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: "Quantity",
                                font: { size: 10 },
                              },
                            },
                            y: { ticks: { font: { size: 9 } } },
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* Chart 4: Company Distribution - Pie Chart */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800">
                          Dispatch Distribution by Company
                        </h5>
                        <p className="text-xs text-gray-400">
                          Percentage share across companies
                        </p>
                      </div>
                      <PieChart size={14} className="text-gray-400" />
                    </div>
                    <div className="h-[280px] flex items-center justify-center">
                      <Pie
                        data={(() => {
                          const companyMap = new Map();
                          getFilteredRecentDispatches().forEach((dispatch) => {
                            companyMap.set(
                              dispatch.companyName,
                              (companyMap.get(dispatch.companyName) || 0) + 1,
                            );
                          });
                          const colors = [
                            "#3B82F6",
                            "#10B981",
                            "#F59E0B",
                            "#EF4444",
                            "#8B5CF6",
                            "#EC4899",
                            "#06B6D4",
                          ];
                          return {
                            labels: Array.from(companyMap.keys()),
                            datasets: [
                              {
                                data: Array.from(companyMap.values()),
                                backgroundColor: colors.slice(
                                  0,
                                  companyMap.size,
                                ),
                                borderWidth: 0,
                              },
                            ],
                          };
                        })()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "right",
                              labels: {
                                font: { size: 11 },
                                usePointStyle: true,
                              },
                            },
                            tooltip: {
                              callbacks: {
                                label: (ctx) =>
                                  `${ctx.label}: ${ctx.raw} dispatches (${((ctx.raw / getFilteredRecentDispatches().length) * 100).toFixed(1)}%)`,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* All Dispatches Table with Dispatch Date Highlight */}
              <div className="p-5 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <ListChecks size={16} className="text-blue-500" />
                    All Dispatches ({filteredDispatchData.length} records)
                  </h4>
                  <div className="flex items-center gap-3">
                    {/* Search Box */}
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Search by PO #, Item Code, Description..."
                        value={dispatchSearchTerm}
                        onChange={(e) => setDispatchSearchTerm(e.target.value)}
                        className="pl-9 pr-3 py-1.5 w-64 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                      {dispatchSearchTerm && (
                        <button
                          onClick={() => setDispatchSearchTerm("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        exportToCSV(
                          filteredDispatchData,
                          `all_dispatches_${Date.now()}.csv`,
                        )
                      }
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-all flex items-center gap-1"
                    >
                      <Download size={12} />
                      Export {filteredDispatchData.length} records
                    </button>
                  </div>
                </div>

                {/* Search Results Summary */}
                {dispatchSearchTerm && (
                  <div className="mb-3 px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700 flex items-center justify-between">
                    <span>
                      🔍 Found <strong>{filteredDispatchData.length}</strong>{" "}
                      results for "{dispatchSearchTerm}"
                    </span>
                    <button
                      onClick={() => setDispatchSearchTerm("")}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear Search
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          PO Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          Item Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          Description
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          Batch
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          Dispatch Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          Day
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          Bill No
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">
                          Bill
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedData.length > 0 ? (
                        paginatedData.map((dispatch, idx) => {
                          const dispatchDate = new Date(dispatch.dispatchDate);
                          const dayName = dispatchDate.toLocaleDateString(
                            "en-US",
                            { weekday: "short" },
                          );
                          const isWeekend =
                            dayName === "Sat" || dayName === "Sun";

                          // Highlight matching text in search results
                          const highlightText = (text, searchTerm) => {
                            if (!searchTerm || !text) return text;
                            const regex = new RegExp(
                              `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
                              "gi",
                            );
                            return text
                              .toString()
                              .replace(
                                regex,
                                '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>',
                              );
                          };

                          return (
                            <tr
                              key={dispatch.id || idx}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3 text-xs text-gray-400">
                                {(currentPage - 1) * itemsPerPage + idx + 1}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {dispatch.companyName?.length > 20
                                    ? dispatch.companyName.substring(0, 20) +
                                      "..."
                                    : dispatch.companyName}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className="text-xs font-mono font-semibold text-gray-900"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(
                                      dispatch.poNumber,
                                      dispatchSearchTerm,
                                    ),
                                  }}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className="text-xs font-mono text-blue-600"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(
                                      dispatch.itemCode,
                                      dispatchSearchTerm,
                                    ),
                                  }}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div
                                  className="text-xs text-gray-600 max-w-[200px] truncate"
                                  title={dispatch.description}
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(
                                      dispatch.description?.substring(0, 40) ||
                                        "N/A",
                                      dispatchSearchTerm,
                                    ),
                                  }}
                                />
                              </td>
                              <td className="px-4 py-3 text-xs font-semibold text-gray-900 text-right">
                                {dispatch.quantity?.toLocaleString()}{" "}
                                {dispatch.unit}
                              </td>
                              <td className="px-4 py-3 text-xs font-mono text-gray-500">
                                {dispatch.batchNumber}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-900">
                                    {formatDate(dispatch.dispatchDate)}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {dispatchDate.toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isWeekend ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}
                                >
                                  {dayName}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs font-mono text-gray-500">
                                {dispatch.billNumber || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-xs font-mono">
                                {dispatch.billFile ? (
                                  <a
                                    href={dispatch.billFile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    View Bill
                                  </a>
                                ) : (
                                  <span className="text-gray-500">N/A</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="11" className="text-center py-12">
                            <Package
                              className="mx-auto text-gray-300 mb-3"
                              size={48}
                            />
                            <p className="text-gray-500 text-sm">
                              {dispatchSearchTerm
                                ? `No results found for "${dispatchSearchTerm}"`
                                : "No dispatch records found"}
                            </p>
                            {dispatchSearchTerm && (
                              <button
                                onClick={() => setDispatchSearchTerm("")}
                                className="mt-3 px-4 py-2 text-blue-600 text-sm hover:bg-blue-50 rounded-lg transition-all"
                              >
                                Clear Search
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredDispatchData.length > itemsPerPage && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(
                        currentPage * itemsPerPage,
                        filteredDispatchData.length,
                      )}{" "}
                      of {filteredDispatchData.length} records
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex gap-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-1 text-xs border rounded-lg transition-colors ${
                                  currentPage === pageNum
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "border-gray-200 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Footer with Date Range Info */}
              {getFilteredRecentDispatches().length > 0 && (
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>
                        📊 Showing{" "}
                        <strong className="text-gray-700">
                          {getFilteredRecentDispatches().length}
                        </strong>{" "}
                        dispatches
                      </span>
                      <span>
                        📦 Total quantity:{" "}
                        <strong className="text-gray-700">
                          {getFilteredRecentDispatches()
                            .reduce((s, d) => s + d.quantity, 0)
                            .toLocaleString()}
                        </strong>{" "}
                        units
                      </span>
                      <span>
                        🏢 Companies:{" "}
                        <strong className="text-gray-700">
                          {
                            new Set(
                              getFilteredRecentDispatches().map(
                                (d) => d.companyName,
                              ),
                            ).size
                          }
                        </strong>
                      </span>
                      <span>
                        📅 Date range:{" "}
                        <strong className="text-gray-700">
                          {getFilteredRecentDispatches().length > 0 &&
                            `${formatDate(Math.min(...getFilteredRecentDispatches().map((d) => new Date(d.dispatchDate))))} - ${formatDate(Math.max(...getFilteredRecentDispatches().map((d) => new Date(d.dispatchDate))))}`}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Weekday Dispatch
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Weekend Dispatch
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Top Item
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Dispatch Performance and Delivery Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Dispatch Completion Rate by Company */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Dispatch Completion Rate by Company
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Percentage of items dispatched vs ordered
                      </p>
                    </div>
                    <Truck className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[350px]">
                    <Bar
                      data={getDispatchCompletionData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: "top" },
                          tooltip: {
                            callbacks: {
                              label: (ctx) =>
                                `${ctx.raw.toFixed(1)}% completion`,
                            },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                              display: true,
                              text: "Completion Rate (%)",
                            },
                            ticks: {
                              callback: (value) => `${value}%`,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Order Value Distribution */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Order Value Distribution
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Number of orders by value range
                      </p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[350px]">
                    <Bar
                      data={getValueDistributionData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: "top" },
                          tooltip: {
                            callbacks: {
                              label: (ctx) => `${ctx.raw} orders`,
                            },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: { display: true, text: "Number of Orders" },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* PO Comparison Charts - ONLY FOR CLIENT, NOT FOR ADMIN */}
        {/* {userRole !== "admin" && purchaseOrders.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        PO Value Comparison
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Which PO has higher value? (High to Low)
                      </p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[320px]">
                    <Bar
                      data={getPOValueComparisonData()}
                      options={barOptions}
                    />
                  </div>
                  {stats.highestValuePO && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        🏆 Highest Value: {stats.highestValuePO.orderNumber} - ₹
                        {stats.highestValuePO.totalValue?.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        PO Items Comparison
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Which PO has more items? (High to Low)
                      </p>
                    </div>
                    <ListChecks className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[320px]">
                    <Bar
                      data={getPOItemsComparisonData()}
                      options={barOptions}
                    />
                  </div>
                  {stats.highestItemsPO && (
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-orange-800">
                        🏆 Most Items: {stats.highestItemsPO.orderNumber} -{" "}
                        {stats.highestItemsPO.totalItems} items
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Items Breakdown by PO
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Total items ordered per purchase order
                      </p>
                    </div>
                    <Grid3x3 className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[300px]">
                    <Bar data={getItemsBreakdownData()} options={barOptions} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Dispatch Progress by PO
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Ordered vs Dispatched quantity comparison
                      </p>
                    </div>
                    <Truck className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[320px]">
                    <Bar
                      data={getDispatchProgressData()}
                      options={stackedBarOptions}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )} */}

        {/* Dispatch Tracking Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Items Dispatch Tracking
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Track dispatch progress for each item with batch history
                </p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <Filter size={16} />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by PO Number, Item Code, or Description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="all">All Fields</option>
                  <option value="po">PO Number</option>
                  <option value="item">Item Code</option>
                  <option value="description">Description</option>
                </select>
                {(searchTerm ||
                  filterStatus !== "all" ||
                  filterProgress !== "all") && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-all"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                {/* <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Filter by Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div> */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Filter by Dispatch Progress
                  </label>
                  <select
                    value={filterProgress}
                    onChange={(e) => setFilterProgress(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="all">All Items</option>
                    <option value="completed">Fully Dispatched (100%)</option>
                    <option value="partial">
                      Partially Dispatched (1-99%)
                    </option>
                    <option value="pending">Not Dispatched (0%)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {userRole === "admin" && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Item Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total Qty
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Dispatched
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Batches
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedFilteredItems.length > 0 ? (
                  paginatedFilteredItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {userRole === "admin" && (
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                            {item.companyName || "N/A"}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {item.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-600 font-mono">
                        {item.itemCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                        {item.description?.length > 50
                          ? `${item.description.substring(0, 50)}...`
                          : item.description}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.quantity?.toLocaleString()} {item.unit || "pcs"}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600 font-medium">
                        {item.totalDispatched?.toLocaleString()}{" "}
                        {item.unit || "pcs"}
                      </td>
                      <td className="px-6 py-4 text-sm text-orange-600 font-medium">
                        {item.remainingQuantity?.toLocaleString()}{" "}
                        {item.unit || "pcs"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-24">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  item.dispatchProgress === 100
                                    ? "bg-green-500"
                                    : item.dispatchProgress >= 70
                                      ? "bg-blue-500"
                                      : item.dispatchProgress >= 30
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                }`}
                                style={{ width: `${item.dispatchProgress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {item.dispatchProgress.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.batchCount > 0 ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                            {item.batchCount} batch
                            {item.batchCount !== 1 ? "es" : ""}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs">
                            No batches
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedItemForHistory(item);
                            setDispatchHistoryModal(true);
                          }}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-50 flex items-center gap-1 transition-all"
                          disabled={item.batchCount === 0}
                        >
                          <History size={12} />
                          View History
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={userRole === "admin" ? 10 : 9}
                      className="text-center py-12"
                    >
                      <Package
                        className="mx-auto text-gray-300 mb-3"
                        size={48}
                      />
                      <p className="text-gray-500">
                        No items match your search criteria
                      </p>
                      <button
                        onClick={clearFilters}
                        className="mt-3 px-4 py-2 text-blue-600 text-sm hover:bg-blue-50 rounded-lg transition-all"
                      >
                        Clear all filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Section */}
          {filteredItems.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Records info */}
                <div className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {(currentItemPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-700">
                    {Math.min(
                      currentItemPage * itemsPerPage,
                      filteredItems.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">
                    {filteredItems.length}
                  </span>{" "}
                  records
                </div>

                {/* Page buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentItemPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentItemPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors flex items-center gap-1"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {/* First page */}
                    {totalItemPages > 0 && currentItemPage > 3 && (
                      <>
                        <button
                          onClick={() => setCurrentItemPage(1)}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white transition-colors"
                        >
                          1
                        </button>
                        {currentItemPage > 4 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                      </>
                    )}

                    {/* Page numbers */}
                    {Array.from(
                      { length: Math.min(5, totalItemPages) },
                      (_, i) => {
                        let pageNum;
                        if (totalItemPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentItemPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentItemPage >= totalItemPages - 2) {
                          pageNum = totalItemPages - 4 + i;
                        } else {
                          pageNum = currentItemPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentItemPage(pageNum)}
                            className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                              currentItemPage === pageNum
                                ? "bg-blue-600 text-white border-blue-600"
                                : "border-gray-300 hover:bg-white"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      },
                    )}

                    {/* Last page */}
                    {totalItemPages > 0 &&
                      currentItemPage < totalItemPages - 2 && (
                        <>
                          {currentItemPage < totalItemPages - 3 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentItemPage(totalItemPages)}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white transition-colors"
                          >
                            {totalItemPages}
                          </button>
                        </>
                      )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentItemPage((p) => Math.min(totalItemPages, p + 1))
                    }
                    disabled={currentItemPage === totalItemPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors flex items-center gap-1"
                  >
                    Next
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentItemPage(1);
                    }}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-500">per page</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Support Section */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="text-lg font-bold mb-4">🏆 PO Rankings</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-emerald-100">Highest Value PO</p>
                <p className="text-xl font-bold">
                  {stats.highestValuePO?.orderNumber}
                </p>
                <p className="text-2xl font-bold mt-1">
                  ₹{stats.highestValuePO?.totalValue?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-emerald-100">Most Items PO</p>
                <p className="text-xl font-bold">
                  {stats.highestItemsPO?.orderNumber}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {stats.highestItemsPO?.totalItems} items
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Need Support?
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 text-gray-700">
                <Phone className="w-4 h-4" />
                <span>Call Support</span>
              </button>
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 text-gray-700">
                <Mail className="w-4 h-4" />
                <span>Email Support</span>
              </button>
              <Link to="/support-ticket">
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200">
                  <Tickets className="w-4 h-4" />
                  <span>Create Ticket</span>
                </button>
              </Link>
            </div>
          </div>
        </div> */}
      </div>

      {/* Dispatch History Modal */}
      {dispatchHistoryModal && selectedItemForHistory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Dispatch History
                  </h3>
                  <p className="text-purple-100 text-sm mt-1">
                    PO:{" "}
                    <span className="font-mono">
                      {selectedItemForHistory.orderNumber}
                    </span>{" "}
                    | Item:{" "}
                    <span className="font-mono">
                      {selectedItemForHistory.itemCode}
                    </span>
                  </p>
                  <p className="text-purple-200 text-xs mt-0.5">
                    {selectedItemForHistory.description?.substring(0, 80)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDispatchHistoryModal(false);
                    setSelectedItemForHistory(null);
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
                  <p className="text-xs text-gray-500">Total Quantity</p>
                  <p className="text-xl font-bold text-blue-600">
                    {selectedItemForHistory.quantity?.toLocaleString()}{" "}
                    {selectedItemForHistory.unit || "pcs"}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
                  <p className="text-xs text-gray-500">Total Dispatched</p>
                  <p className="text-xl font-bold text-green-600">
                    {selectedItemForHistory.totalDispatched?.toLocaleString()}{" "}
                    {selectedItemForHistory.unit || "pcs"}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-100">
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="text-xl font-bold text-orange-600">
                    {selectedItemForHistory.remainingQuantity?.toLocaleString()}{" "}
                    {selectedItemForHistory.unit || "pcs"}
                  </p>
                </div>
              </div>

              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <History size={18} />
                Dispatch Batches (
                {selectedItemForHistory.dispatchRecords?.length || 0})
              </h4>

              {selectedItemForHistory.dispatchRecords &&
              selectedItemForHistory.dispatchRecords.length > 0 ? (
                <div className="space-y-3">
                  {selectedItemForHistory.dispatchRecords.map((record, idx) => (
                    <div
                      key={record._id || idx}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-mono flex items-center gap-1">
                              <Package size={10} />
                              Batch #{record.batchNumber || idx + 1}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-mono flex items-center gap-1">
                              <Truck size={10} />
                              PO:{" "}
                              {record.poNumber ||
                                selectedItemForHistory.orderNumber}
                            </span>
                            {record.billNumber && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                Bill: {record.billNumber}
                              </span>
                            )}
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                record.status === "confirmed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {record.status || "Confirmed"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">Quantity</p>
                              <p className="font-semibold text-gray-900">
                                {record.quantity?.toLocaleString()}{" "}
                                {record.unit ||
                                  selectedItemForHistory.unit ||
                                  "pcs"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">
                                Dispatch Date
                              </p>
                              <p className="font-semibold text-gray-900">
                                {formatDate(record.dispatchDate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">
                                Dispatched By
                              </p>
                              <p className="font-semibold text-gray-900">
                                {record.dispatchedBy || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">
                                Batch Number
                              </p>
                              <p className="font-semibold text-gray-900 font-mono">
                                {record.batchNumber || idx + 1}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {record.qcReport && (
                            <button
                              onClick={() =>
                                window.open(record.qcReport.url, "_blank")
                              }
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 flex items-center gap-1 transition-colors"
                            >
                              <FileText size={12} />
                              QC Report
                            </button>
                          )}
                          {record.mtcReport && (
                            <button
                              onClick={() =>
                                window.open(record.mtcReport.url, "_blank")
                              }
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700 flex items-center gap-1 transition-colors"
                            >
                              <Shield size={12} />
                              MTC
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <History size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">
                    No dispatch records found for this item
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t rounded-b-xl flex justify-end">
              <button
                onClick={() => {
                  setDispatchHistoryModal(false);
                  setSelectedItemForHistory(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Report Modal */}
      {showMonthlyReport && (
        <MonthlyReport onClose={() => setShowMonthlyReport(false)} />
      )}

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out;
        }
        .bg-grid-white/10 {
          background-image:
            linear-gradient(
              to right,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            );
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
};

export default ClientDashboard;
