import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Package,
  Boxes,
  Factory,
  Plus,
  ArrowRightLeft,
  Truck,
  RotateCcw,
  Clock,
  Search,
  Edit,
  Trash2,
  Users,
  BarChart3,
  AlertCircle,
  Filter,
  Download,
  Upload,
  Calendar,
  Tag,
  User,
  Building,
  CheckCircle,
  XCircle,
  TrendingUp,
  PieChart,
  Activity,
  ShoppingCart,
  DollarSign,
  Archive,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  Mail,
  Phone,
  MapPin,
  Star,
} from "lucide-react";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";
import axios from "axios";
import toast from "react-hot-toast";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
);

// Static data
const STATIC_DATA = {
  categories: [
    "Electronics",
    "Raw Materials",
    "Semi-Finished",
    "Packaging",
    "Tools",
    "Consumables",
    "Wearables",
    "Audio",
  ],
  units: ["kg", "pcs", "m", "L", "box", "pallet", "roll"],
  actions: {
    IN: "Inbound",
    OUT: "Outbound",
    PRODUCTION: "Production",
    DELETE: "Deleted",
    ADJUSTMENT: "Adjustment",
    RETURN: "Return",
  },
};

// API Service Layer
class InventoryService {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.config = { withCredentials: true };
  }

  // Dashboard APIs
  async getDashboardStats() {
    return axios.get(`${this.baseURL}/dashboard/stats`, this.config);
  }

  async getInventoryValue() {
    return axios.get(`${this.baseURL}/dashboard/inventory-value`, this.config);
  }

  async getSupplierPerformance() {
    return axios.get(`${this.baseURL}/dashboard/supplier-performance`, this.config);
  }

  async getProductionEfficiency() {
    return axios.get(`${this.baseURL}/dashboard/production-efficiency`, this.config);
  }

  // Raw Material APIs
  async getRawMaterials(params) {
    return axios.get(`${this.baseURL}/raw-material`, { ...this.config, params });
  }

  async createRawMaterial(data) {
    return axios.post(`${this.baseURL}/raw-material/create`, data, this.config);
  }

  async updateRawMaterial(id, data) {
    return axios.put(`${this.baseURL}/raw-material/${id}`, data, this.config);
  }

  async updateRawMaterialQuantity(id, data) {
    return axios.patch(`${this.baseURL}/raw-material/${id}`, data, this.config);
  }

  async deleteRawMaterial(id) {
    return axios.delete(`${this.baseURL}/raw-material/${id}`, this.config);
  }

  async getLowStockAlerts() {
    return axios.get(`${this.baseURL}/raw-material/low-stock`, this.config);
  }

  async bulkImportRawMaterials(data) {
    return axios.post(`${this.baseURL}/raw-material/bulk`, data, this.config);
  }

  // Semi-Finished APIs
  async getSemiFinished(params) {
    return axios.get(`${this.baseURL}/semi-finished`, { ...this.config, params });
  }

  async createSemiFinished(data) {
    return axios.post(`${this.baseURL}/semi-finished`, data, this.config);
  }

  async updateSemiFinished(id, data) {
    return axios.put(`${this.baseURL}/semi-finished/${id}`, data, this.config);
  }

  async deleteSemiFinished(id) {
    return axios.delete(`${this.baseURL}/semi-finished/${id}`, this.config);
  }

  async startProduction(id) {
    return axios.post(`${this.baseURL}/semi-finished/start-production/${id}`, {}, this.config);
  }

  async completeProduction(id, data) {
    return axios.post(`${this.baseURL}/semi-finished/complete-production/${id}`, data, this.config);
  }

  // Finished Goods APIs
  async getFinishedGoods(params) {
    return axios.get(`${this.baseURL}/finished-goods`, { ...this.config, params });
  }

  async createFinishedGood(data) {
    return axios.post(`${this.baseURL}/finished-goods`, data, this.config);
  }

  async updateFinishedGood(id, data) {
    return axios.put(`${this.baseURL}/finished-goods/${id}`, data, this.config);
  }

  async updateFinishedGoodStock(id, data) {
    return axios.patch(`${this.baseURL}/finished-goods/${id}/stock`, data, this.config);
  }

  async deleteFinishedGood(id) {
    return axios.delete(`${this.baseURL}/finished-goods/${id}`, this.config);
  }

  async bulkUpdatePrices(data) {
    return axios.patch(`${this.baseURL}/finished-goods/bulk-price`, data, this.config);
  }

  // Supplier APIs
  async getSuppliers(params) {
    return axios.get(`${this.baseURL}/supplier`, { ...this.config, params });
  }

  async createSupplier(data) {
    return axios.post(`${this.baseURL}/supplier/create`, data, this.config);
  }

  async updateSupplier(id, data) {
    return axios.put(`${this.baseURL}/supplier/${id}`, data, this.config);
  }

  async deleteSupplier(id) {
    return axios.delete(`${this.baseURL}/supplier/${id}`, this.config);
  }

  async updateSupplierRating(id, data) {
    return axios.patch(`${this.baseURL}/supplier/${id}`, data, this.config);
  }

  // Inventory Log APIs
  async getInventoryLogs(params) {
    return axios.get(`${this.baseURL}/inventory-logs`, { ...this.config, params });
  }

  async getMovementSummary(params) {
    return axios.get(`${this.baseURL}/inventory-logs/summary/movement`, { ...this.config, params });
  }

  async getValueHistory(params) {
    return axios.get(`${this.baseURL}/inventory-logs/value-history`, { ...this.config, params });
  }
}

// Initialize service
const inventoryService = new InventoryService(import.meta.env.VITE_REACT_APP_BACKEND_BASEURL);

// Custom hooks
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const usePagination = (initialState = { page: 1, limit: 10 }) => {
  const [pagination, setPagination] = useState(initialState);

  const nextPage = useCallback(() => {
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  }, []);

  const prevPage = useCallback(() => {
    setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  }, []);

  const setPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  return { pagination, nextPage, prevPage, setPage, setLimit };
};

const Inventory = () => {
  // State management
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("30days");
  const [rawMaterials, setRawMaterials] = useState([]);
  const [semiFinished, setSemiFinished] = useState([]);
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState({
    dashboard: false,
    raw: false,
    semi: false,
    finished: false,
    suppliers: false,
    logs: false,
    action: false,
  });
  const [dashboardStats, setDashboardStats] = useState(null);
  const [inventoryValue, setInventoryValue] = useState(null);
  const [supplierPerformance, setSupplierPerformance] = useState(null);
  const [productionEfficiency, setProductionEfficiency] = useState(null);
  const [movementSummary, setMovementSummary] = useState(null);
  const [valueHistory, setValueHistory] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    supplier: "",
    location: "",
    dateRange: { start: "", end: "" },
  });

  // Pagination states
  const rawPagination = usePagination({ page: 1, limit: 10 });
  const semiPagination = usePagination({ page: 1, limit: 10 });
  const finishedPagination = usePagination({ page: 1, limit: 10 });
  const supplierPagination = usePagination({ page: 1, limit: 10 });
  const logPagination = usePagination({ page: 1, limit: 20 });

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    type: "raw",
    name: "",
    sku: "",
    quantity: 0,
    unit: "kg",
    minStock: 10,
    supplierId: "",
    batchNumber: "",
    location: "",
    price: 0,
    category: "",
    description: "",
    reorderPoint: 5,
    leadTime: 7,
    qualityScore: 100,
  });

  const [formErrors, setFormErrors] = useState({});
  const [bulkAction, setBulkAction] = useState(null);

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Loading setters
  const setLoadingState = (key, value) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  // API Calls with error handling
  const handleApiCall = async (apiCall, loadingKey, successMessage) => {
    setLoadingState(loadingKey, true);
    try {
      const response = await apiCall();
      if (response.data.success) {
        if (successMessage) toast.success(successMessage);
        return response.data;
      }
      throw new Error(response.data.error || "Operation failed");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Operation failed");
      throw error;
    } finally {
      setLoadingState(loadingKey, false);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    const [stats, value, supplierPerf, production, movement, valueHist] = await Promise.all([
      handleApiCall(() => inventoryService.getDashboardStats(), 'dashboard'),
      handleApiCall(() => inventoryService.getInventoryValue(), 'dashboard'),
      handleApiCall(() => inventoryService.getSupplierPerformance(), 'dashboard'),
      handleApiCall(() => inventoryService.getProductionEfficiency(), 'dashboard'),
      handleApiCall(() => inventoryService.getMovementSummary({ period: selectedTimeRange }), 'dashboard'),
      handleApiCall(() => inventoryService.getValueHistory({ days: selectedTimeRange === '7days' ? 7 : selectedTimeRange === '30days' ? 30 : selectedTimeRange === '90days' ? 90 : 365 }), 'dashboard'),
    ]);

    if (stats) setDashboardStats(stats.data);
    if (value) setInventoryValue(value.data);
    if (supplierPerf) setSupplierPerformance(supplierPerf.data);
    if (production) setProductionEfficiency(production.data);
    if (movement) setMovementSummary(movement.data);
    if (valueHist) setValueHistory(valueHist.data);

    // Fetch low stock alerts
    const alerts = await handleApiCall(() => inventoryService.getLowStockAlerts(), 'dashboard');
    if (alerts) setLowStockAlerts(alerts.data.items || []);
  }, [selectedTimeRange]);

  // Fetch raw materials
  const fetchRawMaterials = useCallback(async () => {
    const params = {
      page: rawPagination.pagination.page,
      limit: rawPagination.pagination.limit,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(selectedCategory !== 'all' && { category: selectedCategory }),
      ...(filters.status && { status: filters.status }),
      ...(filters.supplier && { supplier: filters.supplier }),
      ...(filters.location && { location: filters.location }),
    };

    const response = await handleApiCall(
      () => inventoryService.getRawMaterials(params),
      'raw'
    );

    if (response) {
      setRawMaterials(response.data);
      rawPagination.setPage(response.pagination.page);
    }
  }, [debouncedSearch, selectedCategory, filters, rawPagination.pagination.page, rawPagination.pagination.limit]);

  // Fetch semi-finished
  const fetchSemiFinished = useCallback(async () => {
    const params = {
      page: semiPagination.pagination.page,
      limit: semiPagination.pagination.limit,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(filters.status && { status: filters.status }),
    };

    const response = await handleApiCall(
      () => inventoryService.getSemiFinished(params),
      'semi'
    );

    if (response) {
      setSemiFinished(response.data);
      semiPagination.setPage(response.pagination.page);
    }
  }, [debouncedSearch, filters, semiPagination.pagination.page, semiPagination.pagination.limit]);

  // Fetch finished goods
  const fetchFinishedGoods = useCallback(async () => {
    const params = {
      page: finishedPagination.pagination.page,
      limit: finishedPagination.pagination.limit,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(selectedCategory !== 'all' && { category: selectedCategory }),
      ...(filters.status && { status: filters.status }),
      ...(filters.supplier && { supplier: filters.supplier }),
    };

    const response = await handleApiCall(
      () => inventoryService.getFinishedGoods(params),
      'finished'
    );

    if (response) {
      setFinishedGoods(response.data);
      finishedPagination.setPage(response.pagination.page);
    }
  }, [debouncedSearch, selectedCategory, filters, finishedPagination.pagination.page, finishedPagination.pagination.limit]);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    const params = {
      page: supplierPagination.pagination.page,
      limit: supplierPagination.pagination.limit,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(filters.status && { status: filters.status }),
    };

    const response = await handleApiCall(
      () => inventoryService.getSuppliers(params),
      'suppliers'
    );

    if (response) {
      setSuppliers(response.data);
      supplierPagination.setPage(response.pagination.page);
    }
  }, [debouncedSearch, filters, supplierPagination.pagination.page, supplierPagination.pagination.limit]);

  // Fetch inventory logs
  const fetchInventoryLogs = useCallback(async () => {
    const params = {
      page: logPagination.pagination.page,
      limit: logPagination.pagination.limit,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(filters.dateRange.start && { startDate: filters.dateRange.start }),
      ...(filters.dateRange.end && { endDate: filters.dateRange.end }),
    };

    const response = await handleApiCall(
      () => inventoryService.getInventoryLogs(params),
      'logs'
    );

    if (response) {
      setLogs(response.data);
      logPagination.setPage(response.pagination.page);
    }
  }, [debouncedSearch, filters, logPagination.pagination.page, logPagination.pagination.limit]);

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (formData.quantity < 0) errors.quantity = "Quantity must be non-negative";
    if (formData.minStock < 0) errors.minStock = "Minimum stock must be non-negative";
    if (formData.type === "finished" && formData.price < 0) errors.price = "Price must be non-negative";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Generate SKU based on type
  const generateSKU = (type) => {
    const prefix = {
      raw: "RAW",
      semi: "SEMI",
      finished: "FIN",
    }[type] || "INV";
    
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `${prefix}-${timestamp}${random}`;
  };

  // Create new item
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    setLoadingState('action', true);

    try {
      // Generate SKU if not provided
      const itemData = {
        ...formData,
        sku: formData.sku || generateSKU(formData.type),
        quantity: parseInt(formData.quantity),
        minStock: parseInt(formData.minStock),
        reorderPoint: parseInt(formData.reorderPoint),
        leadTime: parseInt(formData.leadTime),
        qualityScore: parseInt(formData.qualityScore),
        ...(formData.price && { price: parseFloat(formData.price) }),
      };

      // Remove empty fields
      Object.keys(itemData).forEach(key => {
        if (itemData[key] === "" || itemData[key] === null || itemData[key] === undefined) {
          delete itemData[key];
        }
      });

      let response;
      switch (formData.type) {
        case "raw":
          response = await inventoryService.createRawMaterial(itemData);
          break;
        case "semi":
          response = await inventoryService.createSemiFinished(itemData);
          break;
        case "finished":
          response = await inventoryService.createFinishedGood(itemData);
          break;
      }

      if (response.data.success) {
        toast.success(`${formData.type === 'raw' ? 'Raw material' : formData.type === 'semi' ? 'Semi-finished' : 'Finished good'} added successfully`);
        
        // Reset form
        setFormData({
          type: "raw",
          name: "",
          sku: "",
          quantity: 0,
          unit: "kg",
          minStock: 10,
          supplierId: "",
          batchNumber: "",
          location: "",
          price: 0,
          category: "",
          description: "",
          reorderPoint: 5,
          leadTime: 7,
          qualityScore: 100,
        });
        setFormErrors({});
        setShowAddForm(false);
        
        // Refresh data
        fetchDashboardData();
        switch (formData.type) {
          case "raw":
            fetchRawMaterials();
            break;
          case "semi":
            fetchSemiFinished();
            break;
          case "finished":
            fetchFinishedGoods();
            break;
        }
      }
    } catch (error) {
      console.error("Add item error:", error);
    } finally {
      setLoadingState('action', false);
    }
  };

  // Update item
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    
    if (!editingItem) return;
    
    setLoadingState('action', true);

    try {
      const itemData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        minStock: parseInt(formData.minStock),
        ...(formData.price && { price: parseFloat(formData.price) }),
      };

      let response;
      switch (editingItem.type) {
        case "raw":
          response = await inventoryService.updateRawMaterial(editingItem.id, itemData);
          break;
        case "semi":
          response = await inventoryService.updateSemiFinished(editingItem.id, itemData);
          break;
        case "finished":
          response = await inventoryService.updateFinishedGood(editingItem.id, itemData);
          break;
      }

      if (response.data.success) {
        toast.success("Item updated successfully");
        setShowEditForm(false);
        setEditingItem(null);
        
        // Refresh data
        fetchDashboardData();
        switch (editingItem.type) {
          case "raw":
            fetchRawMaterials();
            break;
          case "semi":
            fetchSemiFinished();
            break;
          case "finished":
            fetchFinishedGoods();
            break;
        }
      }
    } catch (error) {
      console.error("Update item error:", error);
    } finally {
      setLoadingState('action', false);
    }
  };

  // Update quantity
  const handleUpdateQuantity = async (type, id, newQuantity, reason = "") => {
    setLoadingState('action', true);
    
    try {
      const item = getItemById(type, id);
      const difference = newQuantity - item.quantity;
      
      const updateData = {
        quantity: newQuantity,
        reason: reason || `Manual adjustment from ${item.quantity} to ${newQuantity}`,
        reference: {
          type: "ADJ",
          number: `ADJ-${Date.now()}`,
          fullReference: `ADJ-${Date.now()}`,
        },
      };

      let response;
      switch (type) {
        case "raw":
          response = await inventoryService.updateRawMaterialQuantity(id, updateData);
          break;
        case "semi":
          response = await inventoryService.updateSemiFinished(id, { quantity: newQuantity, reason: updateData.reason });
          break;
        case "finished":
          response = await inventoryService.updateFinishedGoodStock(id, updateData);
          break;
      }

      if (response.data.success) {
        toast.success(`Quantity updated (${difference > 0 ? '+' : ''}${difference})`);
        
        // Refresh data
        fetchDashboardData();
        switch (type) {
          case "raw":
            fetchRawMaterials();
            break;
          case "semi":
            fetchSemiFinished();
            break;
          case "finished":
            fetchFinishedGoods();
            break;
        }
        fetchInventoryLogs();
      }
    } catch (error) {
      console.error("Update quantity error:", error);
    } finally {
      setLoadingState('action', false);
    }
  };

  // Delete item
  const handleDeleteItem = async (type, id) => {
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }

    setLoadingState('action', true);

    try {
      let response;
      switch (type) {
        case "raw":
          response = await inventoryService.deleteRawMaterial(id);
          break;
        case "semi":
          response = await inventoryService.deleteSemiFinished(id);
          break;
        case "finished":
          response = await inventoryService.deleteFinishedGood(id);
          break;
      }

      if (response.data.success) {
        toast.success("Item deleted successfully");
        
        // Refresh data
        fetchDashboardData();
        switch (type) {
          case "raw":
            fetchRawMaterials();
            break;
          case "semi":
            fetchSemiFinished();
            break;
          case "finished":
            fetchFinishedGoods();
            break;
        }
        fetchInventoryLogs();
      }
    } catch (error) {
      console.error("Delete item error:", error);
    } finally {
      setLoadingState('action', false);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.error("No items selected");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
      return;
    }

    setLoadingState('action', true);

    try {
      const results = await Promise.allSettled(
        selectedItems.map(item => {
          switch (item.type) {
            case "raw":
              return inventoryService.deleteRawMaterial(item.id);
            case "semi":
              return inventoryService.deleteSemiFinished(item.id);
            case "finished":
              return inventoryService.deleteFinishedGood(item.id);
          }
        })
      );

      const successful = results.filter(r => r.status === "fulfilled").length;
      toast.success(`${successful} items deleted successfully`);

      setSelectedItems([]);
      fetchDashboardData();
      fetchRawMaterials();
      fetchSemiFinished();
      fetchFinishedGoods();
      fetchInventoryLogs();
    } catch (error) {
      console.error("Bulk delete error:", error);
    } finally {
      setLoadingState('action', false);
    }
  };

  // Start production
  const handleStartProduction = async (id) => {
    setLoadingState('action', true);
    
    try {
      const response = await inventoryService.startProduction(id);
      if (response.data.success) {
        toast.success("Production started");
        fetchSemiFinished();
        fetchInventoryLogs();
      }
    } catch (error) {
      console.error("Start production error:", error);
    } finally {
      setLoadingState('action', false);
    }
  };

  // Complete production
  const handleCompleteProduction = async (id) => {
    const quantity = prompt("Enter completed quantity:");
    if (!quantity) return;
    
    const quality = prompt("Enter quality score (0-100):", "100");
    if (!quality) return;

    setLoadingState('action', true);

    try {
      const response = await inventoryService.completeProduction(id, {
        quantity: parseInt(quantity),
        qualityScore: parseInt(quality),
      });

      if (response.data.success) {
        toast.success("Production completed");
        fetchSemiFinished();
        fetchFinishedGoods();
        fetchInventoryLogs();
      }
    } catch (error) {
      console.error("Complete production error:", error);
    } finally {
      setLoadingState('action', false);
    }
  };

  // Export data
  const handleExport = async () => {
    setLoadingState('action', true);
    
    try {
      let data = [];
      let filename = "";
      
      switch (activeTab) {
        case "raw":
          data = rawMaterials;
          filename = "raw_materials.json";
          break;
        case "semi":
          data = semiFinished;
          filename = "semi_finished.json";
          break;
        case "finished":
          data = finishedGoods;
          filename = "finished_goods.json";
          break;
        case "suppliers":
          data = suppliers;
          filename = "suppliers.json";
          break;
        case "logs":
          data = logs;
          filename = "inventory_logs.json";
          break;
        default:
          data = {
            rawMaterials,
            semiFinished,
            finishedGoods,
            suppliers,
            stats: dashboardStats,
            exportedAt: new Date().toISOString(),
          };
          filename = "inventory_export.json";
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Export successful");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setLoadingState('action', false);
    }
  };

  // Import data
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoadingState('action', true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const items = JSON.parse(e.target.result);
        
        const response = await inventoryService.bulkImportRawMaterials({
          items: Array.isArray(items) ? items : [items],
        });

        if (response.data.success) {
          toast.success(`Successfully imported ${response.data.data.successful.length} items`);
          fetchRawMaterials();
          fetchDashboardData();
        }
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Failed to import data");
      } finally {
        setLoadingState('action', false);
      }
    };
    reader.readAsText(file);
  };

  // Helper functions
  const getItemById = (type, id) => {
    const items = {
      raw: rawMaterials,
      semi: semiFinished,
      finished: finishedGoods,
    }[type];
    return items.find(item => item._id === id || item.id === id);
  };

  const getStockStatus = (item) => {
    const minStock = item.minStock || 10;
    if (item.quantity === 0) return "Out of Stock";
    if (item.quantity <= minStock * 0.3) return "Critical";
    if (item.quantity <= minStock) return "Low";
    return "Good";
  };

  const getStockStatusColor = (status) => {
    const colors = {
      "Good": "bg-green-100 text-green-700",
      "Low": "bg-yellow-100 text-yellow-700",
      "Critical": "bg-red-100 text-red-700",
      "Out of Stock": "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getActionColor = (action) => {
    const colors = {
      IN: "bg-green-100 text-green-700",
      OUT: "bg-red-100 text-red-700",
      PRODUCTION: "bg-blue-100 text-blue-700",
      DELETE: "bg-gray-100 text-gray-700",
      ADJUSTMENT: "bg-purple-100 text-purple-700",
      RETURN: "bg-yellow-100 text-yellow-700",
    };
    return colors[action] || "bg-gray-100 text-gray-700";
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate metrics
  const inventoryMetrics = useMemo(() => {
    const totalItems = rawMaterials.length + semiFinished.length + finishedGoods.length;
    const totalValue = inventoryValue?.totalValue || 
      finishedGoods.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0) +
      rawMaterials.reduce((sum, item) => sum + (item.unitCost || 0) * (item.quantity || 0), 0);
    
    return {
      totalItems,
      totalValue,
      lowStockCount: lowStockAlerts.length,
      totalSuppliers: suppliers.length,
      itemGrowth: dashboardStats?.itemGrowth || 0,
      valueGrowth: dashboardStats?.valueGrowth || 0,
      profitMargin: dashboardStats?.profitMargin || 0,
      yoyGrowth: dashboardStats?.yoyGrowth || 0,
    };
  }, [rawMaterials, semiFinished, finishedGoods, inventoryValue, lowStockAlerts, suppliers, dashboardStats]);

  // Chart configurations
  const chartConfigs = useMemo(() => ({
    inventoryTrend: {
      labels: valueHistory?.map(item => item._id) || [],
      datasets: [{
        label: "Inventory Value",
        data: valueHistory?.map(item => item.raw + item.finished + item.semi) || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      }],
    },
    inventoryMovement: {
      labels: movementSummary?.byDay?.map(item => item._id.date).slice(-7) || [],
      datasets: [
        {
          label: "Inbound",
          data: movementSummary?.byDay
            ?.filter(item => item._id.action === "IN")
            .map(item => item.quantity)
            .slice(-7) || [],
          backgroundColor: "rgba(34, 197, 94, 0.6)",
          borderColor: "rgb(34, 197, 94)",
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: "Outbound",
          data: movementSummary?.byDay
            ?.filter(item => item._id.action === "OUT")
            .map(item => item.quantity)
            .slice(-7) || [],
          backgroundColor: "rgba(239, 68, 68, 0.6)",
          borderColor: "rgb(239, 68, 68)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    productionPerformance: {
      labels: productionEfficiency?.daily?.map(item => item._id.date) || [],
      datasets: [
        {
          label: "Target",
          data: productionEfficiency?.daily?.map(item => item.target || 0) || [],
          borderColor: "rgb(156, 163, 175)",
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 4,
          tension: 0,
        },
        {
          label: "Actual",
          data: productionEfficiency?.daily?.map(item => item.units || 0) || [],
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 2,
          pointRadius: 4,
          tension: 0.4,
          fill: false,
        },
      ],
    },
    categoryDistribution: {
      labels: finishedGoods.reduce((acc, item) => {
        if (item.category && !acc.includes(item.category)) acc.push(item.category);
        return acc;
      }, []),
      datasets: [{
        data: Object.values(finishedGoods.reduce((acc, item) => {
          if (item.category) acc[item.category] = (acc[item.category] || 0) + item.quantity;
          return acc;
        }, {})),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(249, 115, 22, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(234, 179, 8, 0.8)",
          "rgba(20, 184, 166, 0.8)",
        ],
        borderWidth: 0,
      }],
    },
    stockStatus: {
      labels: ["Good", "Low", "Critical", "Out of Stock"],
      datasets: [{
        data: [
          [...rawMaterials, ...semiFinished, ...finishedGoods].filter(
            item => getStockStatus(item) === "Good"
          ).length,
          [...rawMaterials, ...semiFinished, ...finishedGoods].filter(
            item => getStockStatus(item) === "Low"
          ).length,
          [...rawMaterials, ...semiFinished, ...finishedGoods].filter(
            item => getStockStatus(item) === "Critical"
          ).length,
          [...rawMaterials, ...semiFinished, ...finishedGoods].filter(
            item => item.quantity === 0
          ).length,
        ],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(234, 179, 8, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(107, 114, 128, 0.8)",
        ],
        borderWidth: 0,
      }],
    },
    revenueTrend: {
      labels: dashboardStats?.monthlyRevenue?.map(item => item.month) || [],
      datasets: [
        {
          label: "Revenue",
          data: dashboardStats?.monthlyRevenue?.map(item => item.revenue) || [],
          backgroundColor: "rgba(34, 197, 94, 0.6)",
          borderColor: "rgb(34, 197, 94)",
          borderWidth: 2,
          borderRadius: 6,
        },
        {
          label: "Cost",
          data: dashboardStats?.monthlyRevenue?.map(item => item.cost) || [],
          backgroundColor: "rgba(239, 68, 68, 0.6)",
          borderColor: "rgb(239, 68, 68)",
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    },
  }), [valueHistory, movementSummary, productionEfficiency, finishedGoods, rawMaterials, semiFinished, dashboardStats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { usePointStyle: true, boxWidth: 6 },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      x: { grid: { display: false } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: { usePointStyle: true, boxWidth: 8, padding: 20 },
      },
    },
    cutout: "70%",
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case "raw":
        fetchRawMaterials();
        break;
      case "semi":
        fetchSemiFinished();
        break;
      case "finished":
        fetchFinishedGoods();
        break;
      case "suppliers":
        fetchSuppliers();
        break;
      case "logs":
        fetchInventoryLogs();
        break;
    }
  }, [activeTab, fetchRawMaterials, fetchSemiFinished, fetchFinishedGoods, fetchSuppliers, fetchInventoryLogs]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {Object.values(loading).some(l => l) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading...</span>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <Package className="text-blue-600" />
              Manufacturing Inventory Management
            </h1>
            <p className="text-sm text-gray-500">
              Complete inventory tracking with real-time analytics
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={loading.action}
              className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download size={18} /> Export
            </button>
            <label className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50">
              <Upload size={18} /> Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                disabled={loading.action}
              />
            </label>
            <button
              onClick={fetchDashboardData}
              disabled={loading.dashboard}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading.dashboard ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-4 overflow-x-auto">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "raw", label: "Raw Materials", icon: Package },
              { id: "semi", label: "Semi-Finished", icon: Boxes },
              { id: "finished", label: "Finished Goods", icon: Factory },
              { id: "suppliers", label: "Suppliers", icon: Users },
              { id: "logs", label: "Activity Logs", icon: Clock },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors flex items-center gap-2 ${
                  activeTab === id
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {STATIC_DATA.categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedTimeRange}
              onChange={(e) => {
                setSelectedTimeRange(e.target.value);
                fetchDashboardData();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
                showFilters ? "bg-blue-50 border-blue-300 text-blue-600" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Filter size={18} /> Filters
            </button>

            <button
              onClick={() => setShowAddForm(true)}
              disabled={loading.action}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Plus size={18} /> Add Item
            </button>

            {selectedItems.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
              >
                <Trash2 size={18} /> Delete {selectedItems.length}
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Critical">Critical</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={filters.supplier}
                  onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Supplier name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Warehouse location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ status: "", supplier: "", location: "", dateRange: { start: "", end: "" } })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {activeTab === "dashboard" && (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Items"
                value={inventoryMetrics.totalItems}
                change={inventoryMetrics.itemGrowth}
                icon={Archive}
                color="blue"
              />
              <MetricCard
                title="Inventory Value"
                value={formatCurrency(inventoryMetrics.totalValue)}
                change={inventoryMetrics.valueGrowth}
                icon={DollarSign}
                color="green"
              />
              <MetricCard
                title="Low Stock Items"
                value={inventoryMetrics.lowStockCount}
                subtitle="Requires attention"
                icon={AlertTriangle}
                color="yellow"
              />
              <MetricCard
                title="Active Suppliers"
                value={inventoryMetrics.totalSuppliers}
                subtitle={`${supplierPerformance?.summary?.avgRating?.toFixed(1) || 0}★ avg rating`}
                icon={Users}
                color="purple"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartCard
                title="Inventory Trend"
                subtitle={`Last ${valueHistory?.length || 30} days`}
                icon={Activity}
                trend={dashboardStats?.trend}
              >
                {valueHistory ? (
                  <Line data={chartConfigs.inventoryTrend} options={chartOptions} />
                ) : (
                  <NoDataMessage />
                )}
              </ChartCard>

              <ChartCard
                title="Inventory Movement"
                subtitle="Last 7 days inbound/outbound"
                icon={ArrowRightLeft}
                legend={
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span> Inbound
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span> Outbound
                    </span>
                  </div>
                }
              >
                {movementSummary ? (
                  <Bar data={chartConfigs.inventoryMovement} options={chartOptions} />
                ) : (
                  <NoDataMessage />
                )}
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <ChartCard title="Inventory by Category" icon={PieChart}>
                {finishedGoods.length > 0 ? (
                  <Doughnut data={chartConfigs.categoryDistribution} options={doughnutOptions} />
                ) : (
                  <NoDataMessage />
                )}
              </ChartCard>

              <ChartCard title="Stock Status Distribution" icon={AlertCircle}>
                {rawMaterials.length + semiFinished.length + finishedGoods.length > 0 ? (
                  <Pie data={chartConfigs.stockStatus} options={doughnutOptions} />
                ) : (
                  <NoDataMessage />
                )}
              </ChartCard>

              <ChartCard
                title="Production Performance"
                icon={Factory}
                footer={
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-xs text-gray-500">Efficiency</p>
                      <p className="text-lg font-semibold text-green-600">
                        {productionEfficiency?.efficiency?.toFixed(1) || '0'}%
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-xs text-gray-500">On-Time</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {productionEfficiency?.onTime?.toFixed(1) || '0'}%
                      </p>
                    </div>
                  </div>
                }
              >
                {productionEfficiency ? (
                  <Line data={chartConfigs.productionPerformance} options={chartOptions} />
                ) : (
                  <NoDataMessage />
                )}
              </ChartCard>
            </div>

            {/* Revenue Chart */}
            <ChartCard
              title="Revenue vs Cost Analysis"
              subtitle="Monthly financial performance"
              icon={TrendingUp}
              className="mb-8"
              headerExtra={
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Profit Margin</p>
                    <p className="text-lg font-semibold text-green-600">
                      {inventoryMetrics.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">YoY Growth</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {inventoryMetrics.yoyGrowth.toFixed(1)}%
                    </p>
                  </div>
                </div>
              }
            >
              {dashboardStats?.monthlyRevenue ? (
                <Bar data={chartConfigs.revenueTrend} options={chartOptions} />
              ) : (
                <NoDataMessage />
              )}
            </ChartCard>

            {/* Low Stock Alerts */}
            {lowStockAlerts.length > 0 && (
              <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="text-yellow-600" />
                  <h3 className="font-semibold text-yellow-800">Low Stock Alerts</h3>
                  <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs">
                    {lowStockAlerts.length} items
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {lowStockAlerts.slice(0, 3).map((item) => (
                    <div
                      key={item._id}
                      className="bg-white p-3 rounded-lg border border-yellow-100 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.name}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            getStockStatusColor(getStockStatus(item))
                          }`}
                        >
                          {getStockStatus(item)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Current: {item.quantity} {item.unit} | Min: {item.minStock} {item.unit}
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab("raw");
                          setSearchTerm(item.sku);
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Reorder now →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <QuickStatsCard
                title="Raw Materials"
                items={rawMaterials.slice(0, 3)}
                total={rawMaterials.length}
                onViewAll={() => setActiveTab("raw")}
              />
              <QuickStatsCard
                title="Finished Goods"
                items={finishedGoods.slice(0, 3)}
                total={finishedGoods.length}
                onViewAll={() => setActiveTab("finished")}
              />
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-700">Recent Activity</h3>
                  <span className="text-sm text-gray-500">Last 3 entries</span>
                </div>
                <div className="space-y-3">
                  {logs.slice(0, 3).map((log) => (
                    <ActivityItem key={log._id} log={log} />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Raw Materials View */}
        {activeTab === "raw" && (
          <DataTable
            title="Raw Materials"
            items={rawMaterials}
            columns={[
              { key: "sku", label: "SKU" },
              { key: "name", label: "Name" },
              { key: "quantity", label: "Quantity", render: (item) => `${item.quantity} ${item.unit}` },
              { key: "supplier", label: "Supplier", render: (item) => item.supplier || item.supplierId?.name || 'N/A' },
              { key: "location", label: "Location" },
              { key: "status", label: "Status", render: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(getStockStatus(item))}`}>
                  {getStockStatus(item)}
                </span>
              )},
            ]}
            onEdit={(item) => {
              setEditingItem({ type: "raw", id: item._id, ...item });
              setFormData({
                type: "raw",
                name: item.name,
                sku: item.sku,
                quantity: item.quantity,
                unit: item.unit,
                minStock: item.minStock,
                supplierId: item.supplierId?._id || item.supplierId,
                batchNumber: item.batchNumber,
                location: item.location,
                price: item.price,
                category: item.category,
                description: item.description,
                reorderPoint: item.reorderPoint,
                leadTime: item.leadTime,
                qualityScore: item.qualityScore,
              });
              setShowEditForm(true);
            }}
            onDelete={(id) => handleDeleteItem("raw", id)}
            onUpdateQuantity={(id, newQty) => handleUpdateQuantity("raw", id, newQty)}
            onSelect={(selected) => setSelectedItems(selected.map(id => ({ type: "raw", id })))}
            pagination={rawPagination}
            loading={loading.raw}
          />
        )}

        {/* Semi-Finished View */}
        {activeTab === "semi" && (
          <SemiFinishedTable
            items={semiFinished}
            pagination={semiPagination}
            loading={loading.semi}
            onStartProduction={handleStartProduction}
            onCompleteProduction={handleCompleteProduction}
            onUpdateQuantity={(id, newQty) => handleUpdateQuantity("semi", id, newQty)}
            onDelete={(id) => handleDeleteItem("semi", id)}
            onEdit={(item) => {
              setEditingItem({ type: "semi", id: item._id, ...item });
              setFormData({
                type: "semi",
                name: item.name,
                sku: item.sku,
                quantity: item.quantity,
                unit: item.unit,
                minStock: item.minStock,
                batchNumber: item.batchNumber,
                description: item.description,
                qualityScore: item.qualityScore,
              });
              setShowEditForm(true);
            }}
          />
        )}

        {/* Finished Goods View */}
        {activeTab === "finished" && (
          <DataTable
            title="Finished Goods"
            items={finishedGoods}
            columns={[
              { key: "sku", label: "SKU" },
              { key: "name", label: "Name" },
              { key: "quantity", label: "Stock", render: (item) => `${item.quantity} ${item.unit}` },
              { key: "price", label: "Price", render: (item) => formatCurrency(item.price) },
              { key: "category", label: "Category" },
              { key: "status", label: "Status", render: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(getStockStatus(item))}`}>
                  {getStockStatus(item)}
                </span>
              )},
              { key: "lastStockCheck", label: "Last Check", render: (item) => formatDate(item.lastStockCheck) },
            ]}
            onEdit={(item) => {
              setEditingItem({ type: "finished", id: item._id, ...item });
              setFormData({
                type: "finished",
                name: item.name,
                sku: item.sku,
                quantity: item.quantity,
                unit: item.unit,
                minStock: item.minStock,
                supplierId: item.supplierId?._id || item.supplierId,
                price: item.price,
                category: item.category,
                description: item.description,
                reorderPoint: item.reorderPoint,
                leadTime: item.leadTime,
                qualityScore: item.qualityScore,
              });
              setShowEditForm(true);
            }}
            onDelete={(id) => handleDeleteItem("finished", id)}
            onUpdateQuantity={(id, newQty) => handleUpdateQuantity("finished", id, newQty)}
            onSelect={(selected) => setSelectedItems(selected.map(id => ({ type: "finished", id })))}
            pagination={finishedPagination}
            loading={loading.finished}
          />
        )}

        {/* Suppliers View */}
        {activeTab === "suppliers" && (
          <SuppliersTable
            suppliers={suppliers}
            pagination={supplierPagination}
            loading={loading.suppliers}
          />
        )}

        {/* Logs View */}
        {activeTab === "logs" && (
          <LogsTable
            logs={logs}
            pagination={logPagination}
            loading={loading.logs}
            formatDateTime={formatDateTime}
            getActionColor={getActionColor}
          />
        )}

        {/* Add Item Modal */}
        <ItemFormModal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddItem}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          suppliers={suppliers}
          loading={loading.action}
          title="Add New Item"
        />

        {/* Edit Item Modal */}
        <ItemFormModal
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setEditingItem(null);
            setFormErrors({});
          }}
          onSubmit={handleUpdateItem}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          suppliers={suppliers}
          loading={loading.action}
          title="Edit Item"
        />
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, subtitle, icon: Icon, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h2 className="text-2xl font-semibold text-gray-800">{value}</h2>
          {change !== undefined && (
            <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
            </p>
          )}
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 ${colors[color]} rounded-lg`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

// Chart Card Component
const ChartCard = ({ title, subtitle, icon: Icon, trend, legend, headerExtra, children, className = "", footer }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Icon size={18} className="text-blue-600" />
            {title}
          </h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {trend && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            {trend}
          </span>
        )}
        {legend}
        {headerExtra}
      </div>
      <div className="h-64">{children}</div>
      {footer}
    </div>
  );
};

// No Data Message Component
const NoDataMessage = () => (
  <div className="flex items-center justify-center h-full text-gray-400">
    No data available
  </div>
);

// Activity Item Component
const ActivityItem = ({ log }) => {
  const actionIcons = {
    IN: Plus,
    OUT: Truck,
    PRODUCTION: Factory,
    DELETE: Trash2,
    ADJUSTMENT: Edit,
    RETURN: RotateCcw,
  };

  const actionColors = {
    IN: "bg-green-100 text-green-600",
    OUT: "bg-red-100 text-red-600",
    PRODUCTION: "bg-blue-100 text-blue-600",
    DELETE: "bg-gray-100 text-gray-600",
    ADJUSTMENT: "bg-purple-100 text-purple-600",
    RETURN: "bg-yellow-100 text-yellow-600",
  };

  const Icon = actionIcons[log.action] || Clock;

  return (
    <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${actionColors[log.action] || "bg-gray-100"}`}>
        <Icon size={14} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{log.itemName}</p>
        <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
      </div>
      <span className="font-semibold text-sm">{log.quantity || '-'}</span>
    </div>
  );
};

// Quick Stats Card Component
const QuickStatsCard = ({ title, items, total, onViewAll }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-gray-700">{title}</h3>
      <span className="text-sm text-gray-500">{total} items</span>
    </div>
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item._id} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded-lg transition-colors">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-gray-500">{item.sku}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{item.quantity} {item.unit}</p>
            <p className="text-xs text-gray-500">{item.location || 'N/A'}</p>
          </div>
        </div>
      ))}
    </div>
    {total > 3 && (
      <button
        onClick={onViewAll}
        className="mt-3 text-sm text-blue-600 hover:text-blue-800"
      >
        View all {total} items →
      </button>
    )}
  </div>
);

// Data Table Component
const DataTable = ({
  title,
  items,
  columns,
  onEdit,
  onDelete,
  onUpdateQuantity,
  onSelect,
  pagination,
  loading,
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingQty, setEditingQty] = useState(null);
  const [tempQty, setTempQty] = useState("");

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
      onSelect?.([]);
    } else {
      const ids = items.map(item => item._id);
      setSelectedIds(ids);
      onSelect?.(ids);
    }
  };

  const handleSelect = (id) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelected);
    onSelect?.(newSelected);
  };

  const handleSaveQty = (id) => {
    const newQty = parseInt(tempQty);
    if (!isNaN(newQty) && newQty >= 0) {
      onUpdateQuantity(id, newQty);
    }
    setEditingQty(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-gray-700">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{items.length} items</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          {items.reduce((sum, item) => sum + (item.quantity || 0), 0)} total units
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-gray-500">
              {onSelect && (
                <th className="py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === items.length && items.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className="text-left py-3 text-xs font-medium uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
              <th className="text-left py-3 text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelect ? 2 : 1)} className="text-center py-8 text-gray-400">
                  No items found
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id} className="border-b hover:bg-gray-50 transition-colors">
                  {onSelect && (
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => handleSelect(item._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="py-3">
                      {col.key === "quantity" && onUpdateQuantity ? (
                        <div className="flex items-center gap-2">
                          {editingQty === item._id ? (
                            <>
                              <input
                                type="number"
                                value={tempQty}
                                onChange={(e) => setTempQty(e.target.value)}
                                className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                                autoFocus
                                min="0"
                              />
                              <button
                                onClick={() => handleSaveQty(item._id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => setEditingQty(null)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold">
                                {item.quantity} {item.unit}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingQty(item._id);
                                  setTempQty(item.quantity);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      ) : col.render ? (
                        col.render(item)
                      ) : (
                        <span className="text-sm">{item[col.key] || '-'}</span>
                      )}
                    </td>
                  ))}
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit?.(item)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      {onUpdateQuantity && (
                        <>
                          <button
                            onClick={() => onUpdateQuantity(item._id, (item.quantity || 0) + 10)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Add 10 units"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => onUpdateQuantity(item._id, Math.max(0, (item.quantity || 0) - 10))}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove 10 units"
                          >
                            <Truck size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => onDelete?.(item._id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pagination.pages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-4">
          <button
            onClick={pagination.prevPage}
            disabled={pagination.pagination.page === 1}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm">
            Page {pagination.pagination.page} of {pagination.pagination.pages}
          </span>
          <button
            onClick={pagination.nextPage}
            disabled={pagination.pagination.page === pagination.pagination.pages}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

// Semi-Finished Table Component
const SemiFinishedTable = ({
  items,
  pagination,
  loading,
  onStartProduction,
  onCompleteProduction,
  onUpdateQuantity,
  onDelete,
  onEdit,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">Semi-Finished Products</h3>
        <span className="text-sm text-gray-500">{items.length} items</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="text-left py-3">SKU</th>
              <th className="text-left py-3">Product Name</th>
              <th className="text-left py-3">Quantity</th>
              <th className="text-left py-3">Production Date</th>
              <th className="text-left py-3">Status</th>
              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-400">
                  No items found
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-mono text-sm">{item.sku}</td>
                  <td className="py-3 font-medium">{item.name}</td>
                  <td className="py-3">
                    <span className="font-semibold">{item.quantity}</span> {item.unit}
                  </td>
                  <td className="py-3 text-sm">
                    {new Date(item.productionDate).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : item.status === "Quality Check"
                            ? "bg-yellow-100 text-yellow-700"
                            : item.status === "In Production"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit?.(item)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      {item.status === "In Production" ? (
                        <button
                          onClick={() => onCompleteProduction(item._id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Complete production"
                        >
                          <CheckCircle size={16} />
                        </button>
                      ) : item.status !== "Completed" && (
                        <button
                          onClick={() => onStartProduction(item._id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Start production"
                        >
                          <Play size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => onUpdateQuantity?.(item._id, (item.quantity || 0) + 5)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Add 5 units"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => onUpdateQuantity?.(item._id, Math.max(0, (item.quantity || 0) - 5))}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove 5 units"
                      >
                        <Truck size={16} />
                      </button>
                      <button
                        onClick={() => onDelete?.(item._id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pagination.pages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-4">
          <button
            onClick={pagination.prevPage}
            disabled={pagination.pagination.page === 1}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm">
            Page {pagination.pagination.page} of {pagination.pagination.pages}
          </span>
          <button
            onClick={pagination.nextPage}
            disabled={pagination.pagination.page === pagination.pagination.pages}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

// Suppliers Table Component
const SuppliersTable = ({ suppliers, pagination, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">Suppliers</h3>
        <span className="text-sm text-gray-500">{suppliers.length} active suppliers</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="text-left py-3">Name</th>
              <th className="text-left py-3">Contact</th>
              <th className="text-left py-3">Email</th>
              <th className="text-left py-3">Phone</th>
              <th className="text-left py-3">Rating</th>
              <th className="text-left py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-400">
                  No suppliers found
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Building size={16} className="text-gray-400" />
                      {supplier.name}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      {supplier.contact?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="py-3 text-sm">{supplier.email}</td>
                  <td className="py-3 text-sm">{supplier.phone || 'N/A'}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < Math.floor(supplier.rating || 0)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {supplier.rating?.toFixed(1) || '0'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        supplier.status === 'Active'
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {supplier.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pagination.pages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-4">
          <button
            onClick={pagination.prevPage}
            disabled={pagination.pagination.page === 1}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm">
            Page {pagination.pagination.page} of {pagination.pagination.pages}
          </span>
          <button
            onClick={pagination.nextPage}
            disabled={pagination.pagination.page === pagination.pagination.pages}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

// Logs Table Component
const LogsTable = ({ logs, pagination, loading, formatDateTime, getActionColor }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-gray-700">Inventory Movement Log</h3>
          <p className="text-xs text-gray-500 mt-1">
            Track all inventory transactions in real-time
          </p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
          Total: {pagination.pagination.total}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="text-left py-3">Time</th>
              <th className="text-left py-3">Action</th>
              <th className="text-left py-3">Item</th>
              <th className="text-left py-3">User</th>
              <th className="text-left py-3">Reference</th>
              <th className="text-right py-3">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-400">
                  No logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDateTime(log.timestamp)}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 font-medium">{log.itemName}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      {log.user?.name || 'System'}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-gray-400" />
                      {log.reference?.fullReference || 'N/A'}
                    </div>
                  </td>
                  <td className="py-3 text-right font-semibold">
                    {log.quantity > 0 ? log.quantity : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pagination.pages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-4">
          <button
            onClick={pagination.prevPage}
            disabled={pagination.pagination.page === 1}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm">
            Page {pagination.pagination.page} of {pagination.pagination.pages}
          </span>
          <button
            onClick={pagination.nextPage}
            disabled={pagination.pagination.page === pagination.pagination.pages}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

// Item Form Modal Component
const ItemFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  formErrors,
  suppliers,
  loading,
  title,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Item Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="raw">Raw Material</option>
                  <option value="semi">Semi-Finished</option>
                  <option value="finished">Finished Goods</option>
                </select>
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU (Auto-generated if empty)
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Leave empty for auto-generation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter item name"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {formErrors.quantity && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.quantity}</p>
                )}
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {STATIC_DATA.units.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              {/* Minimum Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  name="minStock"
                  value={formData.minStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.minStock ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.minStock && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.minStock}</p>
                )}
              </div>

              {/* Price (for finished goods) */}
              {formData.type === "finished" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.price && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.price}</p>
                  )}
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {STATIC_DATA.categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Supplier */}
              {(formData.type === "raw" || formData.type === "finished") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  <select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((sup) => (
                      <option key={sup._id} value={sup._id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Batch Number */}
              {formData.type !== "finished" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                    placeholder="Enter batch number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Location */}
              {formData.type === "raw" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Warehouse location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Reorder Point */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reorder Point
                </label>
                <input
                  type="number"
                  name="reorderPoint"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData(prev => ({ ...prev, reorderPoint: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Lead Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Time (days)
                </label>
                <input
                  type="number"
                  name="leadTime"
                  value={formData.leadTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, leadTime: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quality Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Score (0-100)
                </label>
                <input
                  type="number"
                  name="qualityScore"
                  value={formData.qualityScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualityScore: parseInt(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  placeholder="Additional details about the item..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} /> Save
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Play icon component
const Play = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

// Styles
const styles = `
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
`;

export default Inventory;