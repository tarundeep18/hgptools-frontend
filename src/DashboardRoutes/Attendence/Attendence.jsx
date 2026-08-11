import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusCircleIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  EyeIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  UserIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { IoMdEye } from "react-icons/io";

const EmployeeTimeTracking = () => {
  // Enhanced Dummy Data with more fields
  const dummyEmployees = [
    {
      id: 2,
      name: "Priya Patel",
      employeeId: "EMP002",
      department: "Assembly",
      position: "Assembly Lead",
      hourlyRate: 22,
      joinDate: "2023-03-20",
      status: "active",
      avatar: "PP",
      email: "priya.patel@company.in",
      phone: "+91 98765-43211",
    },
    {
      id: 3,
      name: "Rohan Verma",
      employeeId: "EMP003",
      department: "Quality Control",
      position: "QC Inspector",
      hourlyRate: 28,
      joinDate: "2022-11-10",
      status: "active",
      avatar: "RV",
      email: "rohan.verma@company.in",
      phone: "+91 98765-43212",
    },

    {
      id: 5,
      name: "Vikram Singh",
      employeeId: "EMP005",
      department: "Maintenance",
      position: "Maintenance Tech",
      hourlyRate: 26,
      joinDate: "2023-02-18",
      status: "active",
      avatar: "VS",
      email: "vikram.singh@company.in",
      phone: "+91 98765-43214",
    },
    {
      id: 6,
      name: "Meera Reddy",
      employeeId: "EMP006",
      department: "Production",
      position: "Senior Operator",
      hourlyRate: 27,
      joinDate: "2022-09-12",
      status: "active",
      avatar: "MR",
      email: "meera.reddy@company.in",
      phone: "+91 98765-43215",
    },
    {
      id: 7,
      name: "Siddharth Malhotra",
      employeeId: "EMP007",
      department: "Logistics",
      position: "Warehouse Manager",
      hourlyRate: 32,
      joinDate: "2023-04-22",
      status: "active",
      avatar: "SM",
      email: "siddharth.malhotra@company.in",
      phone: "+91 98765-43216",
    },
  ];

  const generateDummyEntries = () => {
    const entries = [];
    const startDate = new Date(2026, 2, 1);
    const endDate = new Date(2026, 2, 31);

    dummyEmployees.forEach((emp) => {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          const checkIn = "08:00";
          const randomOvertime =
            Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 0.5 : 0;
          const checkOutHour = 17 + Math.floor(randomOvertime);
          const checkOutMinute = randomOvertime % 1 === 0.5 ? 30 : 0;
          const checkOut = `${checkOutHour.toString().padStart(2, "0")}:${checkOutMinute.toString().padStart(2, "0")}`;

          const regularHours = 8;
          const overtimeHours = randomOvertime;

          entries.push({
            id: entries.length + 1,
            employeeId: emp.employeeId,
            date: currentDate.toISOString().split("T")[0],
            checkIn,
            checkOut,
            regularHours,
            overtimeHours,
            status: overtimeHours > 0 ? "overtime" : "regular",
            notes: overtimeHours > 0 ? "Overtime approved" : "",
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    return entries;
  };

  const [employees, setEmployees] = useState(dummyEmployees);
  const [timeEntries, setTimeEntries] = useState(generateDummyEntries());
  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "employeeName",
    direction: "asc",
  });
  
  const [viewMode, setViewMode] = useState("summary");
  const [selectedEntries, setSelectedEntries] = useState([]);

  const [newEntry, setNewEntry] = useState({
    employeeId: "",
    date: "",
    checkIn: "09:00",
    checkOut: "17:00",
    notes: "",
  });

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    employeeId: "",
    department: "",
    position: "",
    hourlyRate: "",
    joinDate: "",
    status: "active",
  });

  // Calculate hours with more precision and shift handling
  const calculateHours = (checkIn, checkOut) => {
    const [inHour, inMinute] = checkIn.split(":").map(Number);
    const [outHour, outMinute] = checkOut.split(":").map(Number);

    let totalMinutes = outHour * 60 + outMinute - (inHour * 60 + inMinute);
    if (totalMinutes < 0) totalMinutes += 24 * 60;

    const lunchDeduction = totalMinutes > 300 ? 30 : 0;
    totalMinutes -= lunchDeduction;

    const totalHours = totalMinutes / 60;
    const regularHours = Math.min(totalHours, 8);
    const overtimeHours = Math.max(totalHours - 8, 0);

    return {
      regularHours: parseFloat(regularHours.toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(2)),
      totalHours: parseFloat(totalHours.toFixed(2)),
      lunchDeducted: lunchDeduction > 0,
    };
  };

  const saveTimeEntry = () => {
    if (!newEntry.employeeId || !newEntry.date) {
      alert("Please select employee and date");
      return;
    }

    const { regularHours, overtimeHours, totalHours, lunchDeducted } =
      calculateHours(newEntry.checkIn, newEntry.checkOut);

    const entry = {
      id: editingEntry?.id || Date.now(),
      employeeId: newEntry.employeeId,
      date: newEntry.date,
      checkIn: newEntry.checkIn,
      checkOut: newEntry.checkOut,
      regularHours,
      overtimeHours,
      totalHours,
      status: overtimeHours > 0 ? "overtime" : "regular",
      notes: newEntry.notes,
      lunchDeducted,
    };

    if (editingEntry) {
      setTimeEntries(
        timeEntries.map((e) => (e.id === editingEntry.id ? entry : e)),
      );
    } else {
      setTimeEntries([...timeEntries, entry]);
    }

    setShowEntryForm(false);
    setEditingEntry(null);
    setNewEntry({
      employeeId: "",
      date: "",
      checkIn: "09:00",
      checkOut: "17:00",
      notes: "",
    });
  };

  const addEmployee = () => {
    if (
      !newEmployee.name ||
      !newEmployee.employeeId ||
      !newEmployee.hourlyRate
    ) {
      alert("Please fill required fields");
      return;
    }

    const employee = {
      id: Date.now(),
      ...newEmployee,
      hourlyRate: parseFloat(newEmployee.hourlyRate),
      avatar: newEmployee.name
        .split(" ")
        .map((n) => n[0])
        .join(""),
    };

    setEmployees([...employees, employee]);
    setShowEmployeeForm(false);
    setNewEmployee({
      name: "",
      employeeId: "",
      department: "",
      position: "",
      hourlyRate: "",
      joinDate: "",
      status: "active",
    });
  };

  const deleteTimeEntry = (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setTimeEntries(timeEntries.filter((entry) => entry.id !== id));
    }
  };

  const editTimeEntry = (entry) => {
    setEditingEntry(entry);
    setNewEntry({
      employeeId: entry.employeeId,
      date: entry.date,
      checkIn: entry.checkIn,
      checkOut: entry.checkOut,
      notes: entry.notes || "",
    });
    setShowEntryForm(true);
  };

  // Get monthly data for an employee with enhanced metrics
  const getEmployeeMonthlyData = (employeeId) => {
    const entries = timeEntries.filter(
      (entry) =>
        entry.employeeId === employeeId && entry.date.startsWith(selectedMonth),
    );

    const totalRegular = entries.reduce(
      (sum, entry) => sum + entry.regularHours,
      0,
    );
    const totalOvertime = entries.reduce(
      (sum, entry) => sum + entry.overtimeHours,
      0,
    );
    const totalHours = totalRegular + totalOvertime;
    const daysPresent = entries.length;
    const overtimeDays = entries.filter((e) => e.overtimeHours > 0).length;

    const employee = employees.find((emp) => emp.employeeId === employeeId);
    const regularPay = totalRegular * (employee?.hourlyRate || 0);
    const overtimePay = totalOvertime * (employee?.hourlyRate || 0) * 1.5;
    const totalPay = regularPay + overtimePay;

    const attendanceRate = (daysPresent / 22) * 100;

    return {
      employeeName: employee?.name || "Unknown",
      employeeId,
      department: employee?.department || "Unknown",
      position: employee?.position || "Unknown",
      totalRegular,
      totalOvertime,
      totalHours,
      totalPay: totalPay.toFixed(2),
      daysPresent,
      overtimeDays,
      attendanceRate: attendanceRate.toFixed(1),
      entries: entries.sort((a, b) => new Date(b.date) - new Date(a.date)),
      employeeDetails: employee,
    };
  };

  // Get all employees monthly summary with sorting and filtering
  const getAllMonthlySummary = () => {
    let summary = employees
      .filter((emp) => {
        const matchesSearch =
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept =
          departmentFilter === "all" || emp.department === departmentFilter;
        return matchesSearch && matchesDept;
      })
      .map((emp) => getEmployeeMonthlyData(emp.employeeId));

    if (sortConfig.key) {
      summary.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (typeof aVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        } else {
          return sortConfig.direction === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        }
      });
    }

    return summary;
  };

  // Get monthly totals
  const getMonthlyTotals = () => {
    const summary = getAllMonthlySummary();
    const totalRegular = summary.reduce(
      (sum, emp) => sum + emp.totalRegular,
      0,
    );
    const totalOvertime = summary.reduce(
      (sum, emp) => sum + emp.totalOvertime,
      0,
    );
    const totalPayroll = summary.reduce(
      (sum, emp) => sum + parseFloat(emp.totalPay),
      0,
    );
    const totalEmployees = summary.length;
    const totalDaysPresent = summary.reduce(
      (sum, emp) => sum + emp.daysPresent,
      0,
    );

    return {
      totalRegular,
      totalOvertime,
      totalPayroll: totalPayroll.toFixed(2),
      totalEmployees,
      totalDaysPresent,
    };
  };

  const monthlyTotals = getMonthlyTotals();
  const monthlySummary = getAllMonthlySummary();
  const departments = [
    "all",
    ...new Set(employees.map((emp) => emp.department)),
  ];

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const exportToCSV = () => {
    const headers = [
      "Employee Name",
      "Employee ID",
      "Department",
      "Regular Hours",
      "Overtime Hours",
      "Total Hours",
      "Total Pay",
    ];
    const csvData = monthlySummary.map((emp) => [
      emp.employeeName,
      emp.employeeId,
      emp.department,
      emp.totalRegular.toFixed(2),
      emp.totalOvertime.toFixed(2),
      emp.totalHours.toFixed(2),
      emp.totalPay,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${selectedMonth}.csv`;
    a.click();
  };

  // Open detail modal for employee
  const openDetailModal = (employee) => {
    setSelectedEmployeeDetails(employee);
    setShowDetailModal(true);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Employee Attendence
              </h1>
              <p className="text-gray-500 mt-2">
                Advanced Employee Attendece Time Tracking
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Export CSV
              </button>
              <button
                onClick={() => setShowEmployeeForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
              >
                <UserGroupIcon className="w-5 h-5" />
                Add Employee
              </button>
              <button
                onClick={() => setShowEntryForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Add Entry
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Total Regular Hours
                  </p>
                  <p className="text-3xl font-bold text-gray-800">
                    {monthlyTotals.totalRegular.toFixed(1)}
                  </p>
                  <p className="text-xs text-green-600 mt-2">This month</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <ClockIcon className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Total Overtime Hours
                  </p>
                  <p className="text-3xl font-bold text-gray-800">
                    {monthlyTotals.totalOvertime.toFixed(1)}
                  </p>
                  <p className="text-xs text-orange-600 mt-2">
                    +
                    {(
                      (monthlyTotals.totalOvertime /
                        monthlyTotals.totalRegular) *
                      100
                    ).toFixed(1)}
                    % of regular
                  </p>
                </div>
                <div className="bg-orange-100 rounded-full p-3">
                  <ClockIcon className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Avg Attendance Rate
                  </p>
                  <p className="text-3xl font-bold text-gray-800">
                    {(
                      (monthlyTotals.totalDaysPresent /
                        (monthlyTotals.totalEmployees * 22)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Based on 22 working days
                  </p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <DocumentChartBarIcon className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept === "all" ? "All Departments" : dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("summary")}
                className={`px-4 py-2 rounded-lg transition ${viewMode === "summary" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                Summary View
              </button>
              <button
                onClick={() => setViewMode("detailed")}
                className={`px-4 py-2 rounded-lg transition ${viewMode === "detailed" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                Detailed View
              </button>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  {viewMode === "detailed" && (
                    <th className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEntries(
                              monthlySummary.flatMap((emp) =>
                                emp.entries.map((e) => e.id),
                              ),
                            );
                          } else {
                            setSelectedEntries([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                  )}
                  <th
                    className="px-6 py-4 text-left cursor-pointer hover:bg-gray-700"
                    onClick={() => requestSort("employeeName")}
                  >
                    <div className="flex items-center gap-1">
                      Employee
                      {sortConfig.key === "employeeName" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">ID</th>
                  <th className="px-6 py-4 text-left">Department</th>
                  <th
                    className="px-6 py-4 text-right cursor-pointer hover:bg-gray-700"
                    onClick={() => requestSort("totalRegular")}
                  >
                    Regular Hours
                  </th>
                  <th
                    className="px-6 py-4 text-right cursor-pointer hover:bg-gray-700"
                    onClick={() => requestSort("totalOvertime")}
                  >
                    Overtime
                  </th>
                  <th
                    className="px-6 py-4 text-right cursor-pointer hover:bg-gray-700"
                    onClick={() => requestSort("totalHours")}
                  >
                    Total Hours
                  </th>
                  <th
                    className="px-6 py-4 text-right cursor-pointer hover:bg-gray-700"
                    onClick={() => requestSort("totalPay")}
                  >
                    Total Pay
                  </th>
                  <th className="px-6 py-4 text-center">Attendance</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlySummary.map((emp, index) => (
                  <React.Fragment key={emp.employeeId}>
                    <tr className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {emp.employeeName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {emp.employeeName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {emp.position}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {emp.employeeId}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {emp.department}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600 font-medium">
                        {emp.totalRegular.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-right text-orange-600 font-medium">
                        {emp.totalOvertime.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {emp.totalHours.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-right text-blue-600 font-bold">
                        Rs.{emp.totalPay}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                            <div
                              className="bg-green-500 rounded-full h-2"
                              style={{ width: `${emp.attendanceRate}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {emp.attendanceRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openDetailModal(emp)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="View Details"
                        >
                          <IoMdEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employee Detail Modal */}
        {showDetailModal && selectedEmployeeDetails && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {selectedEmployeeDetails.employeeName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedEmployeeDetails.employeeName}
                    </h2>
                    <p className="text-gray-500">
                      {selectedEmployeeDetails.employeeId} •{" "}
                      {selectedEmployeeDetails.position}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Employee Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600">Department</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedEmployeeDetails.department}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BriefcaseIcon className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-600">Position</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedEmployeeDetails.position}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BanknotesIcon className="w-5 h-5 text-orange-600" />
                      <span className="text-sm text-gray-600">Hourly Rate</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      ${selectedEmployeeDetails.employeeDetails?.hourlyRate}/hr
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDaysIcon className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-gray-600">Join Date</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(
                        selectedEmployeeDetails.employeeDetails?.joinDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Monthly Stats */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-blue-600" />
                    Monthly Performance -{" "}
                    {new Date(selectedMonth).toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Regular Hours
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedEmployeeDetails.totalRegular.toFixed(1)} hrs
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Overtime Hours
                      </p>
                      <p className="text-2xl font-bold text-orange-600">
                        {selectedEmployeeDetails.totalOvertime.toFixed(1)} hrs
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">Total Hours</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedEmployeeDetails.totalHours.toFixed(1)} hrs
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">Total Pay</p>
                      <p className="text-2xl font-bold text-purple-600">
                        ${selectedEmployeeDetails.totalPay}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">Days Present</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {selectedEmployeeDetails.daysPresent} / 22
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Overtime Days
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {selectedEmployeeDetails.overtimeDays}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Attendance Rate
                      </p>
                      <p className="text-2xl font-bold text-teal-600">
                        {selectedEmployeeDetails.attendanceRate}%
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <p className="text-2xl font-bold">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedEmployeeDetails.employeeDetails?.status)}`}
                        >
                          {selectedEmployeeDetails.employeeDetails?.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Daily Attendance Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    Daily Attendance Details
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Day
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Check In
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Check Out
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                            Regular
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                            Overtime
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                            Total
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedEmployeeDetails.entries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {new Date(entry.date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(entry.date).toLocaleDateString(
                                "en-US",
                                { weekday: "short" },
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {entry.checkIn}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {entry.checkOut}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                              {entry.regularHours} hrs
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-orange-600 font-medium">
                              {entry.overtimeHours} hrs
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {(
                                entry.regularHours + entry.overtimeHours
                              ).toFixed(2)}{" "}
                              hrs
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${entry.overtimeHours > 0 ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}
                              >
                                {entry.overtimeHours > 0
                                  ? "Overtime"
                                  : "Regular"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {entry.notes || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        // You can add edit functionality here
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Edit Employee
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Time Entry Modal */}
        {showEntryForm && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {editingEntry ? "Edit Time Entry" : "Add Time Entry"}
                </h2>
                <button
                  onClick={() => {
                    setShowEntryForm(false);
                    setEditingEntry(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee *
                  </label>
                  <select
                    value={newEntry.employeeId}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, employeeId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.employeeId}>
                        {emp.name} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check In
                    </label>
                    <input
                      type="time"
                      value={newEntry.checkIn}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, checkIn: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check Out
                    </label>
                    <input
                      type="time"
                      value={newEntry.checkOut}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, checkOut: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newEntry.notes}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, notes: e.target.value })
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveTimeEntry}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition duration-200"
                >
                  {editingEntry ? "Update Entry" : "Add Entry"}
                </button>
                <button
                  onClick={() => {
                    setShowEntryForm(false);
                    setEditingEntry(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Employee Modal */}
        {showEmployeeForm && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Add New Employee</h2>
                <button
                  onClick={() => setShowEmployeeForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={newEmployee.employeeId}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        employeeId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={newEmployee.department}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          department: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={newEmployee.position}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          position: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hourly Rate ($) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={newEmployee.hourlyRate}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          hourlyRate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Join Date
                    </label>
                    <input
                      type="date"
                      value={newEmployee.joinDate}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          joinDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={newEmployee.status}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={addEmployee}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition duration-200"
                >
                  Add Employee
                </button>
                <button
                  onClick={() => setShowEmployeeForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeTimeTracking;
