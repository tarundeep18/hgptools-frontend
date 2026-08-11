import React, { useState, useEffect } from "react";
import {
  Calendar,
  Package,
  Truck,
  FileMinus,
  Tickets,
  PenTool,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Users,
  Layers,
  ClipboardList,
  FileText,
  Shield,
  TruckIcon,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { Bar, Line, Doughnut, Pie } from "react-chartjs-2";
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
} from "chart.js";

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
);

const MonthlyReport = ({ onClose }) => {
  const { user } = useAuth();
  const userRole = user?.role || "admin";
  console.log("MonthlyReport component rendered");

  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [companies, setCompanies] = useState([]);
  const [reportData, setReportData] = useState(null);

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

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );
  const fetchCompanies = async () => {
    if (userRole !== "admin") return;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/purchase-orders`,
        { withCredentials: true },
      );
      if (response.data.success) {
        const uniqueCompanies = new Map();
        response.data.data.forEach((order) => {
          const companyId = order.submittedBy?._id || order.submittedBy;
          const companyName =
            order.submittedBy?.companyName || "Unknown Company";
          if (!uniqueCompanies.has(companyId)) {
            uniqueCompanies.set(companyId, {
              _id: companyId,
              name: companyName,
            });
          }
        });
        setCompanies(Array.from(uniqueCompanies.values()));
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const [ordersRes, dispatchesRes, rfqsRes, ticketsRes, drawingsRes] =
        await Promise.all([
          axios.get(
            `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/purchase-orders`,
            { withCredentials: true },
          ),
          axios.get(
            `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/dispatch-orders`,
            { withCredentials: true },
          ),
          axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/rfq`, {
            withCredentials: true,
          }),
          axios.get(
            `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/tickets`,
            { withCredentials: true },
          ),
          axios.get(
            `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/folder`,
            { withCredentials: true },
          ),
        ]);

      let orders = ordersRes.data.data || [];
      let dispatches = dispatchesRes.data.data || [];
      let rfqs = rfqsRes.data.data || [];
      let tickets = ticketsRes.data.tickets || ticketsRes.data.data || [];
      let drawings = drawingsRes.data.data || [];

      if (selectedCompany !== "all") {
        orders = orders.filter((order) => {
          const companyId = order.submittedBy?._id || order.submittedBy;
          return companyId === selectedCompany;
        });

        const companyOrderIds = new Set(orders.map((o) => o._id));
        dispatches = dispatches.filter((d) => companyOrderIds.has(d.poId));

        const companyUserIds = new Set(
          orders.map((o) => o.submittedBy?._id || o.submittedBy),
        );
        rfqs = rfqs.filter((r) =>
          companyUserIds.has(r.submittedBy || r.createdBy),
        );
        tickets = tickets.filter((t) =>
          companyUserIds.has(t.createdBy?._id || t.createdBy),
        );
        drawings = drawings.filter((d) =>
          companyUserIds.has(d.uploadedBy || d.createdBy),
        );
      }

      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);

      const monthlyOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      const monthlyDispatches = dispatches.filter((dispatch) => {
        const dispatchDate = new Date(dispatch.dispatchDate);
        return dispatchDate >= startDate && dispatchDate <= endDate;
      });

      // Get complete dispatch details with batch information
      const dispatchDetails = monthlyDispatches.map((dispatch) => {
        const order = orders.find((o) => o._id === dispatch.poId);
        const item = order?.items?.find((i) => i._id === dispatch.itemId);
        return {
          id: dispatch._id,
          poNumber: dispatch.poNumber || order?.orderNumber,
          poId: dispatch.poId,
          itemCode: item?.itemCode || dispatch.itemCode,
          itemDescription: item?.description || dispatch.description,
          quantity: dispatch.dispatchQuantity || 0,
          unit: item?.unit || dispatch.unit || "pcs",
          batchNumber: dispatch.batchNumber,
          dispatchDate: dispatch.dispatchDate,
          billNumber: dispatch.billNumber,
          status: dispatch.status,
          qcReport: dispatch.qcReport,
          mtcReport: dispatch.mtcReport,
          companyName: order?.submittedBy?.companyName,
          companyId: order?.submittedBy?._id,
          orderDate: order?.createdAt,
        };
      });

      const monthlyRfqs = rfqs.filter((rfq) => {
        const rfqDate = new Date(rfq.createdAt);
        return rfqDate >= startDate && rfqDate <= endDate;
      });

      const monthlyTickets = tickets.filter((ticket) => {
        const ticketDate = new Date(ticket.createdAt);
        return ticketDate >= startDate && ticketDate <= endDate;
      });

      const monthlyDrawings = drawings.filter((drawing) => {
        const drawingDate = new Date(drawing.createdAt);
        return drawingDate >= startDate && drawingDate <= endDate;
      });

      // Calculate statistics
      const totalOrderValue = monthlyOrders.reduce(
        (sum, order) => sum + (order.totalValue || 0),
        0,
      );
      const totalItemsOrdered = monthlyOrders.reduce(
        (sum, order) => sum + (order.totalItems || 0),
        0,
      );
      const totalDispatchedQuantity = monthlyDispatches.reduce(
        (sum, d) => sum + (d.dispatchQuantity || 0),
        0,
      );

      // Dispatch batch analytics
      const batchSizeDistribution = {};
      const dispatchByDayOfWeek = Array(7).fill(0);
      const dispatchByHour = Array(24).fill(0);
      const itemsDispatchedMap = new Map();
      const companyDispatchMap = new Map();

      monthlyDispatches.forEach((dispatch) => {
        // Batch size distribution
        const batchQty = dispatch.dispatchQuantity || 0;
        let batchRange;
        if (batchQty <= 10) batchRange = "1-10";
        else if (batchQty <= 50) batchRange = "11-50";
        else if (batchQty <= 100) batchRange = "51-100";
        else if (batchQty <= 500) batchRange = "101-500";
        else batchRange = "500+";
        batchSizeDistribution[batchRange] =
          (batchSizeDistribution[batchRange] || 0) + 1;

        // Day of week
        const dispatchDate = new Date(dispatch.dispatchDate);
        const dayOfWeek = dispatchDate.getDay();
        dispatchByDayOfWeek[dayOfWeek]++;

        // Hour of day
        const hour = dispatchDate.getHours();
        dispatchByHour[hour]++;

        // Items dispatched
        const order = orders.find((o) => o._id === dispatch.poId);
        const item = order?.items?.find((i) => i._id === dispatch.itemId);
        const itemKey = `${item?.itemCode || dispatch.itemCode} - ${item?.description || dispatch.description}`;
        itemsDispatchedMap.set(
          itemKey,
          (itemsDispatchedMap.get(itemKey) || 0) +
            (dispatch.dispatchQuantity || 0),
        );

        // Company wise
        const companyName = order?.submittedBy?.companyName || "Unknown";
        companyDispatchMap.set(
          companyName,
          (companyDispatchMap.get(companyName) || 0) + 1,
        );
      });

      const topItemsDispatched = Array.from(itemsDispatchedMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const topCompaniesByDispatch = Array.from(companyDispatchMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // QC Report Analytics
      const qcReportCount = monthlyDispatches.filter((d) => d.qcReport).length;
      const mtcReportCount = monthlyDispatches.filter(
        (d) => d.mtcReport,
      ).length;
      const bothReportsCount = monthlyDispatches.filter(
        (d) => d.qcReport && d.mtcReport,
      ).length;

      // Daily trends
      const daysInMonth = endDate.getDate();
      const dailyOrders = Array(daysInMonth).fill(0);
      const dailyDispatches = Array(daysInMonth).fill(0);
      const dailyRevenue = Array(daysInMonth).fill(0);
      const dailyBatchCount = Array(daysInMonth).fill(0);

      monthlyOrders.forEach((order) => {
        const day = new Date(order.createdAt).getDate() - 1;
        dailyOrders[day]++;
        dailyRevenue[day] += order.totalValue || 0;
      });

      monthlyDispatches.forEach((dispatch) => {
        const day = new Date(dispatch.dispatchDate).getDate() - 1;
        dailyDispatches[day]++;
        dailyBatchCount[day] += dispatch.dispatchQuantity || 0;
      });

      // Order status distribution
      const orderStatus = {
        submitted: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      };

      monthlyOrders.forEach((order) => {
        const status = order.status || "submitted";
        orderStatus[status]++;
      });

      // Top products
      const productMap = new Map();
      monthlyOrders.forEach((order) => {
        if (order.items) {
          order.items.forEach((item) => {
            const key = `${item.itemCode} - ${item.description}`;
            productMap.set(
              key,
              (productMap.get(key) || 0) + (item.quantity || 0),
            );
          });
        }
      });

      const topProducts = Array.from(productMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      setReportData({
        month: months[selectedMonth],
        year: selectedYear,
        summary: {
          totalOrders: monthlyOrders.length,
          totalOrderValue,
          averageOrderValue:
            monthlyOrders.length > 0
              ? totalOrderValue / monthlyOrders.length
              : 0,
          totalItemsOrdered,
          totalDispatches: monthlyDispatches.length,
          totalDispatchedQuantity,
          dispatchRate:
            totalItemsOrdered > 0
              ? (totalDispatchedQuantity / totalItemsOrdered) * 100
              : 0,
          totalRfqs: monthlyRfqs.length,
          totalTickets: monthlyTickets.length,
          totalDrawings: monthlyDrawings.length,
          totalBatches: monthlyDispatches.length,
          averageBatchSize:
            monthlyDispatches.length > 0
              ? totalDispatchedQuantity / monthlyDispatches.length
              : 0,
        },
        trends: {
          dailyOrders,
          dailyDispatches,
          dailyRevenue,
          dailyBatchCount,
          daysInMonth,
        },
        dispatchAnalytics: {
          batchSizeDistribution,
          dispatchByDayOfWeek,
          dispatchByHour,
          topItemsDispatched,
          topCompaniesByDispatch,
          qcReportCount,
          mtcReportCount,
          bothReportsCount,
          totalDispatches: monthlyDispatches.length,
          totalQuantity: totalDispatchedQuantity,
        },
        dispatchDetails,
        status: orderStatus,
        topProducts,
        companies: new Set(monthlyOrders.map((o) => o.submittedBy?.companyName))
          .size,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedMonth !== undefined && selectedYear !== undefined) {
      generateReport();
    }
  }, [selectedMonth, selectedYear, selectedCompany]);

  const downloadReport = () => {
    if (!reportData) return;

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Monthly Report - ${reportData.month} ${reportData.year}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
          .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
          .card h3 { margin: 0 0 10px 0; color: #333; }
          .card p { font-size: 24px; font-weight: bold; margin: 0; color: #2563eb; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; }
          .section { margin-top: 30px; }
          .section h2 { color: #1f2937; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          .batch-card { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Monthly Performance Report</h1>
          <h2>${reportData.month} ${reportData.year}</h2>
          ${selectedCompany !== "all" ? `<p>Company: ${companies.find((c) => c._id === selectedCompany)?.name || "Selected Company"}</p>` : "<p>All Companies</p>"}
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
          <div class="card"><h3>Total Orders</h3><p>${reportData.summary.totalOrders}</p></div>
          <div class="card"><h3>Total Revenue</h3><p>₹${reportData.summary.totalOrderValue.toLocaleString()}</p></div>
          <div class="card"><h3>Total Dispatches</h3><p>${reportData.summary.totalDispatches}</p></div>
          <div class="card"><h3>Dispatch Rate</h3><p>${reportData.summary.dispatchRate.toFixed(1)}%</p></div>
          <div class="card"><h3>Total RFQs</h3><p>${reportData.summary.totalRfqs}</p></div>
          <div class="card"><h3>Support Tickets</h3><p>${reportData.summary.totalTickets}</p></div>
          <div class="card"><h3>Total Batches</h3><p>${reportData.summary.totalBatches}</p></div>
          <div class="card"><h3>Avg Batch Size</h3><p>${reportData.summary.averageBatchSize.toFixed(1)}</p></div>
        </div>
        
        <div class="section">
          <h2>Dispatch Batch Analytics</h2>
          <div class="batch-card">
            <h3>Batch Size Distribution</h3>
            <table>
              <thead><tr><th>Batch Size Range</th><th>Number of Batches</th><th>Percentage</th></tr></thead>
              <tbody>
                ${Object.entries(
                  reportData.dispatchAnalytics.batchSizeDistribution,
                )
                  .map(
                    ([range, count]) => `
                  <tr><td>${range}</td><td>${count}</td><td>${((count / reportData.dispatchAnalytics.totalDispatches) * 100).toFixed(1)}%</td></tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          
          <div class="batch-card">
            <h3>Report Compliance</h3>
            <table>
              <thead><tr><th>Report Type</th><th>Count</th><th>Percentage</th></tr></thead>
              <tbody>
                <tr><td>QC Reports</td><td>${reportData.dispatchAnalytics.qcReportCount}</td><td>${((reportData.dispatchAnalytics.qcReportCount / reportData.dispatchAnalytics.totalDispatches) * 100).toFixed(1)}%</td></tr>
                <tr><td>MTC Reports</td><td>${reportData.dispatchAnalytics.mtcReportCount}</td><td>${((reportData.dispatchAnalytics.mtcReportCount / reportData.dispatchAnalytics.totalDispatches) * 100).toFixed(1)}%</td></tr>
                <tr><td>Both Reports</td><td>${reportData.dispatchAnalytics.bothReportsCount}</td><td>${((reportData.dispatchAnalytics.bothReportsCount / reportData.dispatchAnalytics.totalDispatches) * 100).toFixed(1)}%</td></tr>
              </tbody>
            </table>
          </div>
          
          <div class="batch-card">
            <h3>Top 10 Items Dispatched</h3>
            <table>
              <thead><tr><th>Item</th><th>Quantity</th></tr></thead>
              <tbody>
                ${reportData.dispatchAnalytics.topItemsDispatched.map(([item, qty]) => `<tr><td>${item}</td><td>${qty.toLocaleString()}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
          
          <div class="batch-card">
            <h3>Top Companies by Dispatch Volume</h3>
            <table>
              <thead><tr><th>Company</th><th>Number of Dispatches</th></tr></thead>
              <tbody>
                ${reportData.dispatchAnalytics.topCompaniesByDispatch.map(([company, count]) => `<tr><td>${company}</td><td>${count}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="section">
          <h2>Detailed Dispatch Batches</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>PO Number</th>
                <th>Item Code</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Batch No</th>
                <th>Bill No</th>
                <th>QC Report</th>
                <th>MTC Report</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.dispatchDetails
                .slice(0, 20)
                .map(
                  (d) => `
                <tr>
                  <td>${new Date(d.dispatchDate).toLocaleDateString()}</td>
                  <td>${d.poNumber}</td>
                  <td>${d.itemCode}</td>
                  <td>${(d.itemDescription || "").substring(0, 50)}</td>
                  <td>${d.quantity} ${d.unit}</td>
                  <td>${d.batchNumber}</td>
                  <td>${d.billNumber}</td>
                  <td>${d.qcReport ? "✓" : "✗"}</td>
                  <td>${d.mtcReport ? "✓" : "✗"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          ${reportData.dispatchDetails.length > 20 ? `<p><em>Showing first 20 of ${reportData.dispatchDetails.length} batches</em></p>` : ""}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([reportHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Monthly_Report_${reportData.month}_${reportData.year}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully!");
  };
  // Chart data
  const dailyTrendsData = {
    labels: Array.from(
      { length: reportData?.trends?.daysInMonth || 30 },
      (_, i) => i + 1,
    ),
    datasets: [
      {
        label: "Orders",
        data: reportData?.trends?.dailyOrders || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Dispatches",
        data: reportData?.trends?.dailyDispatches || [],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const batchTrendData = {
    labels: Array.from(
      { length: reportData?.trends?.daysInMonth || 30 },
      (_, i) => i + 1,
    ),
    datasets: [
      {
        label: "Quantity Dispatched",
        data: reportData?.trends?.dailyBatchCount || [],
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const batchSizeChartData = {
    labels: Object.keys(
      reportData?.dispatchAnalytics?.batchSizeDistribution || {},
    ),
    datasets: [
      {
        label: "Number of Batches",
        data: Object.values(
          reportData?.dispatchAnalytics?.batchSizeDistribution || {},
        ),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderRadius: 8,
      },
    ],
  };

  const dispatchTimeData = {
    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "Dispatches by Day",
        data: reportData?.dispatchAnalytics?.dispatchByDayOfWeek || [
          0, 0, 0, 0, 0, 0, 0,
        ],
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderRadius: 8,
      },
    ],
  };

  const dispatchHourData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: "Dispatches by Hour",
        data:
          reportData?.dispatchAnalytics?.dispatchByHour || Array(24).fill(0),
        backgroundColor: "rgba(245, 158, 11, 0.7)",
        borderRadius: 8,
      },
    ],
  };

  const reportComplianceData = {
    labels: ["QC Reports", "MTC Reports", "Both Reports"],
    datasets: [
      {
        data: reportData
          ? [
              reportData.dispatchAnalytics.qcReportCount,
              reportData.dispatchAnalytics.mtcReportCount,
              reportData.dispatchAnalytics.bothReportsCount,
            ]
          : [0, 0, 0],
        backgroundColor: ["#3B82F6", "#10B981", "#8B5CF6"],
      },
    ],
  };

  const topItemsChartData = {
    labels: (reportData?.dispatchAnalytics?.topItemsDispatched || []).map(
      ([item]) => {
        const shortName = item.split(" - ")[0];
        return shortName.length > 15
          ? shortName.substring(0, 15) + "..."
          : shortName;
      },
    ),
    datasets: [
      {
        label: "Quantity Dispatched",
        data: (reportData?.dispatchAnalytics?.topItemsDispatched || []).map(
          ([, qty]) => qty,
        ),
        backgroundColor: "rgba(139, 92, 246, 0.7)",
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">
                Monthly Performance Report
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            {userRole === "admin" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">All Companies</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end">
              <button
                onClick={generateReport}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : reportData ? (
          <>
            {/* Summary Cards */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                  <Package className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">
                    {reportData.summary.totalOrders}
                  </p>
                  <p className="text-xs opacity-90">Total Orders</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                  <DollarSign className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">
                    ₹{reportData.summary.totalOrderValue.toLocaleString()}
                  </p>
                  <p className="text-xs opacity-90">Total Revenue</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
                  <Truck className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">
                    {reportData.summary.totalDispatches}
                  </p>
                  <p className="text-xs opacity-90">Dispatches</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                  <Layers className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">
                    {reportData.summary.totalBatches}
                  </p>
                  <p className="text-xs opacity-90">Total Batches</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
                  <FileMinus className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">
                    {reportData.summary.totalRfqs}
                  </p>
                  <p className="text-xs opacity-90">RFQs</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
                  <Tickets className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">
                    {reportData.summary.totalTickets}
                  </p>
                  <p className="text-xs opacity-90">Tickets</p>
                </div>
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white">
                  <PenTool className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">
                    {reportData.summary.totalDrawings}
                  </p>
                  <p className="text-xs opacity-90">Drawings</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
                  <TrendingUp className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">
                    {reportData.summary.dispatchRate.toFixed(1)}%
                  </p>
                  <p className="text-xs opacity-90">Dispatch Rate</p>
                </div>
              </div>

              {/* Daily Trends Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Daily Orders vs Dispatches
                  </h3>
                  <div className="h-[300px]">
                    <Line
                      data={dailyTrendsData}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Daily Dispatch Quantity Trend
                  </h3>
                  <div className="h-[300px]">
                    <Line
                      data={batchTrendData}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
              </div>

              {/* Dispatch Analytics Section */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TruckIcon className="w-5 h-5 text-emerald-600" />
                  Dispatch Batch Analytics
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Batch Size Distribution
                    </h4>
                    <div className="h-[250px]">
                      <Bar
                        data={batchSizeChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Report Compliance
                    </h4>
                    <div className="h-[250px]">
                      <Pie
                        data={reportComplianceData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Dispatches by Day of Week
                    </h4>
                    <div className="h-[250px]">
                      <Bar
                        data={dispatchTimeData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Dispatches by Hour
                    </h4>
                    <div className="h-[250px]">
                      <Bar
                        data={dispatchHourData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Top 10 Items Dispatched
                    </h4>
                    <div className="h-[300px]">
                      <Bar
                        data={topItemsChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: "y",
                          plugins: {
                            legend: { position: "top" },
                          },
                        }}
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Top Companies by Dispatch Volume
                    </h4>
                    <div className="space-y-3">
                      {reportData.dispatchAnalytics.topCompaniesByDispatch.map(
                        ([company, count], idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-gray-400">
                                #{idx + 1}
                              </span>
                              <span className="text-sm font-medium text-gray-800">
                                {company}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">
                                {count} dispatches
                              </span>
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-emerald-500 h-2 rounded-full"
                                  style={{
                                    width: `${(count / reportData.dispatchAnalytics.topCompaniesByDispatch[0][1]) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispatch Details Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    Detailed Dispatch Batches (
                    {reportData.dispatchDetails.length} batches)
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          Date
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
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          Batch No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          Bill No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          QC
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                          MTC
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.dispatchDetails
                        .slice(0, 20)
                        .map((dispatch, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(dispatch.dispatchDate)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {dispatch.poNumber}
                            </td>
                            <td className="px-4 py-3 text-sm text-blue-600 font-mono">
                              {dispatch.itemCode}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                              {dispatch.itemDescription}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {dispatch.quantity} {dispatch.unit}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-600">
                              {dispatch.batchNumber}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-600">
                              {dispatch.billNumber}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {dispatch.qcReport ? (
                                <CheckCircle className="w-5 h-5 text-green-500 inline" />
                              ) : (
                                <X className="w-5 h-5 text-red-400 inline" />
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {dispatch.mtcReport ? (
                                <CheckCircle className="w-5 h-5 text-green-500 inline" />
                              ) : (
                                <X className="w-5 h-5 text-red-400 inline" />
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {reportData.dispatchDetails.length > 20 && (
                    <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                      Showing first 20 of {reportData.dispatchDetails.length}{" "}
                      batches
                    </div>
                  )}
                </div>
              </div>

              {/* Status Distribution & Top Products */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Order Status Distribution
                  </h3>
                  <div className="h-[250px]">
                    <Doughnut
                      data={{
                        labels: [
                          "Submitted",
                          "In Progress",
                          "Completed",
                          "Cancelled",
                        ],
                        datasets: [
                          {
                            data: [
                              reportData.status.submitted,
                              reportData.status.in_progress,
                              reportData.status.completed,
                              reportData.status.cancelled,
                            ],
                            backgroundColor: [
                              "#F59E0B",
                              "#3B82F6",
                              "#10B981",
                              "#EF4444",
                            ],
                          },
                        ],
                      }}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Top 5 Products by Order Quantity
                  </h3>
                  <div className="space-y-3">
                    {reportData.topProducts.map(([product, qty], idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {product}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            {qty.toLocaleString()} units
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${(qty / reportData.topProducts[0][1]) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Stats Cards */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-gray-600">Average Batch Size</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {reportData.summary.averageBatchSize.toFixed(1)} units
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-sm text-gray-600">
                    Items per Order (Average)
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {(
                      reportData.summary.totalItemsOrdered /
                      reportData.summary.totalOrders
                    ).toFixed(1)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                  <p className="text-sm text-gray-600">
                    Report Compliance Rate
                  </p>
                  <p className="text-2xl font-bold text-purple-700">
                    {(
                      (reportData.dispatchAnalytics.bothReportsCount /
                        reportData.summary.totalDispatches) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={downloadReport}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Download Report
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">
              Select a month and year to generate report
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default MonthlyReport;
