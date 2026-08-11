import React, { useEffect, useState } from "react";
import {
  X,
  Plus,
  Search,
  Filter,
  Upload,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  User,
  FileText,
  Award,
} from "lucide-react";
import { IoMdEye } from "react-icons/io";
import { MdDelete, MdEdit } from "react-icons/md";
import toast from "react-hot-toast";
import { useOutletContext } from "react-router-dom";
import axios from "axios";

// Function to generate random employee ID with HGP
const generateEmployeeId = () => {
  const randomDigits = Math.floor(100 + Math.random() * 900);
  return `HGP${randomDigits}`;
};

const AdminEmployees = () => {
  const { darkMode } = useOutletContext();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phnNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    role: "",
    department: "",
    employeeId: generateEmployeeId(),
    joiningDate: "",
    salary: "",
    employmentType: "Full-time",
    status: "Active",
    emergencyContact: "",
    emergencyPhone: "",
    gender: "",
  });

  const [editId, setEditId] = useState(null);

  // Departments and statuses for filters
  const departments = [
    "all",
    "Engineering",
    "Product",
    "Design",
    "Human Resources",
    "Marketing",
    "Sales",
    "Finance",
    "Operations",
    "IT",
    "Machining",
    "Production",
    "Fabrication",
    "General Labor",
  ];
  
  const statuses = ["all", "Active", "On Leave", "Terminated", "Probation"];

  const openDeleteModal = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteModalOpen(true);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch employees from API
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/employee`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setEmployees(response.data.data);
        setFilteredEmployees(response.data.data);
        console.log("Employee Data:", response.data.data);
      } else {
        toast.error(response.data.message || "Failed to fetch employees");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch employees");
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Search and filter functionality
  useEffect(() => {
    let filtered = employees.filter(
      (employee) =>
        employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedDepartment !== "all") {
      filtered = filtered.filter(
        (employee) => employee.department === selectedDepartment
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (employee) => employee.status === selectedStatus
      );
    }

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedStatus, employees]);

  // FORM INPUT HANDLER
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // CREATE / UPDATE EMPLOYEE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Prepare employee data for API
      const employeeData = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phnNumber: form.phnNumber,
        address: form.address,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        country: form.country,
        role: form.role,
        department: form.department,
        employeeId: form.employeeId,
        joiningDate: form.joiningDate,
        salary: parseFloat(form.salary),
        employmentType: form.employmentType,
        status: form.status,
        emergencyContact: form.emergencyContact,
        emergencyPhone: form.emergencyPhone,
        gender: form.gender,
      };

      let response;

      if (editId) {
        // Update existing employee
        response = await axios.put(
          `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/employee/${editId}`,
          employeeData,
          { withCredentials: true }
        );

        if (response.data.success) {
          toast.success("Employee updated successfully");
        }
      } else {
        // Create new employee
        response = await axios.post(
          `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/employee`,
          employeeData,
          { withCredentials: true }
        );

        if (response.data.success) {
          toast.success("Employee created successfully");
        }
      }

      // Refresh employee list
      await fetchEmployees();

      // Reset form and close modal
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phnNumber: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        role: "",
        department: "",
        employeeId: generateEmployeeId(),
        joiningDate: "",
        salary: "",
        employmentType: "Full-time",
        status: "Active",
        emergencyContact: "",
        emergencyPhone: "",
        gender: "",
      });
      setEditId(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  };

  // DELETE EMPLOYEE
  const deleteEmployee = async () => {
    if (!employeeToDelete?._id) return;

    const id = employeeToDelete._id;
    setDeleteLoading(id);

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/employee/${id}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        // Update UI after successful delete
        setEmployees((prev) => prev.filter((e) => e._id !== id));
        toast.success("Employee deleted successfully");

        // Cleanup UI state
        setDeleteModalOpen(false);
        setEmployeeToDelete(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
      console.error("Error deleting employee:", error);
    } finally {
      setDeleteLoading(null);
    }
  };

  // VIEW EMPLOYEE DETAILS
  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailsModalOpen(true);
    setActiveTab("personal");
  };

  // EDIT EMPLOYEE
  const handleEdit = (employee) => {
    setForm({
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      phnNumber: employee.phnNumber || "",
      address: employee.address || "",
      city: employee.city || "",
      state: employee.state || "",
      zipCode: employee.zipCode || "",
      country: employee.country || "",
      role: employee.role || "",
      department: employee.department || "",
      employeeId: employee.employeeId || "",
      joiningDate: employee.joiningDate
        ? new Date(employee.joiningDate).toISOString().split("T")[0]
        : "",
      salary: employee.salary || "",
      employmentType: employee.employmentType || "Full-time",
      status: employee.status || "Active",
      emergencyContact: employee.emergencyContact || "",
      emergencyPhone: employee.emergencyPhone || "",
      gender: employee.gender || "",
    });
    setEditId(employee._id);
    setIsFormOpen(true);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "On Leave":
        return "bg-yellow-100 text-yellow-800";
      case "Terminated":
        return "bg-red-100 text-red-800";
      case "Probation":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format salary
  const formatSalary = (salary) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(salary);
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className={`text-3xl font-bold ${darkMode ? "text-blue-500" : "text-blue-800"}`}
              >
                Employees
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage employee information and details
              </p>
            </div>

            <button
              onClick={() => {
                setEditId(null);
                setForm({
                  firstName: "",
                  lastName: "",
                  email: "",
                  phnNumber: "",
                  address: "",
                  city: "",
                  state: "",
                  zipCode: "",
                  country: "",
                  role: "",
                  department: "",
                  employeeId: generateEmployeeId(),
                  joiningDate: "",
                  salary: "",
                  employmentType: "Full-time",
                  status: "Active",
                  emergencyContact: "",
                  emergencyPhone: "",
                  gender: "",
                });
                setIsFormOpen(true);
              }}
              className="inline-flex items-center bg-blue-800 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={18} className="mr-2" />
              Add New Employee
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-6 space-y-4">
            {/* Search Input Area */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search
                  className={`h-5 w-5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                />
              </div>
              <input
                type="text"
                placeholder="Search employees by name, email, position, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`block w-full pl-10 pr-3 py-3 border rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none
                  ${
                    darkMode
                      ? "bg-gray-800/50 border-gray-700 text-white placeholder-gray-500"
                      : "bg-white/50 border-gray-200 text-gray-900 placeholder-gray-400"
                  }`}
              />
            </div>

            {/* Filter Toggle Button */}
            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-lg transition-colors font-medium
                  ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <Filter size={18} className="mr-2" />
                Filters
                {(selectedDepartment !== "all" || selectedStatus !== "all") && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs rounded-full 
                      ${darkMode ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-800"}`}
                  >
                    Active
                  </span>
                )}
              </button>
            </div>

            {/* Expanded Filters Panel */}
            {showFilters && (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border shadow-sm transition-all
                  ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                {/* Department Filter */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none
                      ${
                        darkMode
                          ? "bg-gray-900 border-gray-700 text-gray-300"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept === "all" ? "All Departments" : dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none
                      ${
                        darkMode
                          ? "bg-gray-900 border-gray-700 text-gray-300"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status === "all" ? "All Statuses" : status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* EMPLOYEE TABLE */}
        <div
          className={`${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} rounded-xl shadow-lg overflow-hidden border`}
        >
          <div className="overflow-x-auto">
            <table
              className={`min-w-full divide-y ${darkMode ? "divide-gray-800" : "divide-gray-200"}`}
            >
              <thead className={darkMode ? "bg-gray-800/50" : "bg-gray-50"}>
                <tr>
                  {[
                    "S.no",
                    "Employee ID",
                    "Name",
                    "Email",
                    "Phone",
                    "Department",
                    "Position",
                    "Status",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody
                className={`divide-y ${darkMode ? "bg-gray-900 divide-gray-800" : "bg-white divide-gray-200"}`}
              >
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-20 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span
                          className={`ml-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          Loading employees...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((employee, index) => (
                    <tr
                      key={employee._id}
                      className={`transition-colors ${darkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}
                        >
                          {indexOfFirstItem + index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}
                        >
                          {employee.employeeId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}
                        >
                          {employee.firstName} {employee.lastName}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? "text-gray-400" : "text-gray-900"}`}
                      >
                        {employee.email}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? "text-gray-400" : "text-gray-900"}`}
                      >
                        {employee.phnNumber}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? "text-gray-400" : "text-gray-900"}`}
                      >
                        {employee.department}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? "text-gray-400" : "text-gray-900"}`}
                      >
                        {employee.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(employee.status)}`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-4">
                          {/* View Button */}
                          <button
                            onClick={() => handleViewDetails(employee)}
                            className={`${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-900"} transition-colors`}
                            title="View Details"
                          >
                            <IoMdEye className="text-xl" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEdit(employee)}
                            className={`${darkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-900"} transition-colors`}
                            title="Edit"
                          >
                            <MdEdit className="text-xl" />
                          </button>

                          {/* Delete Button with Loading State */}
                          <button
                            onClick={() => openDeleteModal(employee)}
                            disabled={deleteLoading === employee._id}
                            className={`${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-900"} transition-colors disabled:opacity-50`}
                            title="Delete"
                          >
                            {deleteLoading === employee._id ? (
                              <Loader2 size={20} className="animate-spin" />
                            ) : (
                              <MdDelete className="text-xl" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-20 text-center">
                      <div
                        className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        <p className="text-lg font-medium">No employees found</p>
                        <p className="text-sm mt-1">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className={`px-6 py-4 flex items-center justify-between border-t ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-700"}`}
              >
                Showing{" "}
                <span className="font-medium text-blue-500">
                  {indexOfFirstItem + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-blue-500">
                  {Math.min(indexOfLastItem, filteredEmployees.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-blue-500">
                  {filteredEmployees.length}
                </span>{" "}
                employees
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      darkMode
                        ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <span
                  className={`px-3 py-1 rounded-lg ${darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"}`}
                >
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      darkMode
                        ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DETAILS MODAL */}
      {isDetailsModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen bg-black/50 px-4 py-8">
            <div
              className="fixed inset-0 transition-opacity"
              onClick={() => setIsDetailsModalOpen(false)}
            ></div>

            <div className="inline-block bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="pt-8 px-8 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </h2>
                    <p className="text-lg text-gray-600 mt-1">
                      {selectedEmployee.role}
                    </p>
                    <div className="flex gap-3 mt-2">
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                          selectedEmployee.status
                        )}`}
                      >
                        {selectedEmployee.status}
                      </span>
                      <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-full">
                        ID: {selectedEmployee.employeeId}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        handleEdit(selectedEmployee);
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <MdEdit className="text-lg" />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-8 border-b border-gray-200">
                <div className="flex gap-6">
                  {["personal", "employment", "documents"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-3 px-1 font-medium text-sm transition-colors relative ${
                        activeTab === tab
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-8 py-6">
                {activeTab === "personal" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          Personal Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p className="text-gray-900">
                              {selectedEmployee.firstName} {selectedEmployee.lastName}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Gender</p>
                            <p className="text-gray-900">
                              {selectedEmployee.gender || "Not specified"}
                            </p>
                          </div>
                          <div className="flex items-start">
                            <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="text-gray-900">
                                {selectedEmployee.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Phone</p>
                              <p className="text-gray-900">
                                {selectedEmployee.phnNumber}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Address</p>
                              <p className="text-gray-900">
                                {selectedEmployee.address}
                                {selectedEmployee.city && `, ${selectedEmployee.city}`}
                                {selectedEmployee.state && `, ${selectedEmployee.state}`}
                                {selectedEmployee.zipCode && ` ${selectedEmployee.zipCode}`}
                                {selectedEmployee.country && `, ${selectedEmployee.country}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-blue-600" />
                          Emergency Contact
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">
                              Contact Person
                            </p>
                            <p className="text-gray-900">
                              {selectedEmployee.emergencyContact ||
                                "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Emergency Phone
                            </p>
                            <p className="text-gray-900">
                              {selectedEmployee.emergencyPhone ||
                                "Not specified"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "employment" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                          Job Details
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Department</p>
                            <p className="text-gray-900 font-medium">
                              {selectedEmployee.department}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Position</p>
                            <p className="text-gray-900">
                              {selectedEmployee.role}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Employment Type
                            </p>
                            <p className="text-gray-900">
                              {selectedEmployee.employmentType}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          Employment Dates
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Joining Date</p>
                            <p className="text-gray-900">
                              {selectedEmployee.joiningDate
                                ? new Date(
                                    selectedEmployee.joiningDate
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Years of Service
                            </p>
                            <p className="text-gray-900">
                              {selectedEmployee.joiningDate
                                ? `${Math.floor(
                                    (new Date() -
                                      new Date(selectedEmployee.joiningDate)) /
                                      (1000 * 60 * 60 * 24 * 365)
                                  )} years`
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                          Compensation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Annual Salary</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {selectedEmployee.salary
                                ? formatSalary(selectedEmployee.salary)
                                : "Not specified"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "documents" && (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Documents Available
                    </h3>
                    <p className="text-gray-500">
                      Employee documents will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen bg-black/50 px-4 py-8">
            <div className="inline-block bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold text-gray-900">
                  {editId ? "Edit Employee" : "Add New Employee"}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={form.firstName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={form.lastName}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          name="phnNumber"
                          value={form.phnNumber}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={form.gender}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Address
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={form.address}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={form.city}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={form.state}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            name="zipCode"
                            value={form.zipCode}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={form.country}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      Employment Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Employee ID *
                        </label>
                        <input
                          type="text"
                          name="employeeId"
                          value={form.employeeId}
                          onChange={handleChange}
                          required
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position *
                        </label>
                        <input
                          type="text"
                          name="role"
                          value={form.role}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department *
                        </label>
                        <select
                          name="department"
                          value={form.department}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Department</option>
                          {departments
                            .filter((d) => d !== "all")
                            .map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Employment Type *
                        </label>
                        <select
                          name="employmentType"
                          value={form.employmentType}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option>Full-time</option>
                          <option>Part-time</option>
                          <option>Contract</option>
                          <option>Intern</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Joining Date *
                        </label>
                        <input
                          type="date"
                          name="joiningDate"
                          value={form.joiningDate}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Salary (Annual) *
                        </label>
                        <input
                          type="number"
                          name="salary"
                          value={form.salary}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status *
                        </label>
                        <select
                          name="status"
                          value={form.status}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option>Active</option>
                          <option>On Leave</option>
                          <option>Terminated</option>
                          <option>Probation</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      Emergency Contact
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          name="emergencyContact"
                          value={form.emergencyContact}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Emergency Phone
                        </label>
                        <input
                          type="tel"
                          name="emergencyPhone"
                          value={form.emergencyPhone}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex space-x-3 sticky bottom-0 bg-white py-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        {editId ? "Updating..." : "Creating..."}
                      </>
                    ) : editId ? (
                      "Update Employee"
                    ) : (
                      "Create Employee"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && employeeToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
            onClick={() => setDeleteModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-semibold text-slate-800">
                Confirm Deletion
              </h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4 mx-auto">
                <span className="text-red-600 text-xl font-bold">!</span>
              </div>

              <div className="text-center space-y-2 mb-8">
                <p className="text-slate-600">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-900">
                    {employeeToDelete.firstName} {employeeToDelete.lastName}
                  </span>
                  ?
                </p>
                <p className="text-sm text-slate-500">
                  This employee will be permanently removed from the system.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteEmployee}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Delete Employee"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployees;