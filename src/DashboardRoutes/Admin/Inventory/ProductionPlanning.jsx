// import React, { useState, useEffect } from "react";
// import {
//   Calendar,
//   Package,
//   TrendingUp,
//   AlertCircle,
//   CheckCircle,
//   Clock,
//   Settings,
//   Download,
//   Filter,
//   Search,
//   Plus,
//   MoreVertical,
//   ArrowUpRight,
//   ArrowDownRight,
//   Truck,
//   Users,
//   BarChart3,
//   X,
//   Save,
//   Printer,
//   FileText,
//   Bell,
//   UserCircle,
//   ChevronDown,
//   Grid,
//   List,
//   RefreshCw,
//   AlertTriangle,
//   Check,
//   Eye,
//   Edit,
//   Copy,
//   Archive,
//   Play,
//   Pause,
//   StopCircle,
//   MessageSquare,
//   Camera,
//   QrCode,
//   Upload,
//   FileSpreadsheet,
// } from "lucide-react";

// const ProductionDashboard = () => {
//   const [activeTab, setActiveTab] = useState("overview");
//   const [selectedDate, setSelectedDate] = useState("2024-01-15");
//   const [showCreateOrder, setShowCreateOrder] = useState(false);
//   const [showNotification, setShowNotification] = useState(true);
//   const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'
//   const [selectedDepartment, setSelectedDepartment] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [refreshData, setRefreshData] = useState(false);
//   const [selectedOrder, setSelectedOrder] = useState(null);

//   // Form state for new production order
//   const [newOrder, setNewOrder] = useState({
//     productName: "",
//     productCode: "",
//     quantity: "",
//     priority: "medium",
//     dueDate: "",
//     customer: "",
//     customerPO: "",
//     specialInstructions: "",
//     assignedMachines: [],
//     requiredMaterials: [],
//     qualityChecks: ["dimensional", "visual", "performance"],
//     estimatedTime: "",
//     shift: "day",
//     supervisor: "",
//     notes: "",
//   });

//   // Dummy users for assignment
//   const supervisors = [
//     { id: 1, name: "John Smith", department: "Machining", avatar: "JS" },
//     { id: 2, name: "Sarah Johnson", department: "Assembly", avatar: "SJ" },
//     { id: 3, name: "Mike Wilson", department: "Quality Control", avatar: "MW" },
//     { id: 4, name: "Emily Brown", department: "Packaging", avatar: "EB" },
//   ];

//   // Available machines
//   const availableMachines = [
//     {
//       id: "MC-101",
//       name: "CNC Machine MC-101",
//       type: "CNC",
//       status: "available",
//       efficiency: 94,
//     },
//     {
//       id: "MC-102",
//       name: "CNC Machine MC-102",
//       type: "CNC",
//       status: "maintenance",
//       efficiency: 0,
//     },
//     {
//       id: "MC-103",
//       name: "CNC Machine MC-103",
//       type: "CNC",
//       status: "available",
//       efficiency: 91,
//     },
//     {
//       id: "IM-201",
//       name: "Injection Molder IM-201",
//       type: "Injection",
//       status: "available",
//       efficiency: 88,
//     },
//     {
//       id: "IM-202",
//       name: "Injection Molder IM-202",
//       type: "Injection",
//       status: "running",
//       efficiency: 76,
//     },
//     {
//       id: "AL-301",
//       name: "Assembly Line AL-301",
//       type: "Assembly",
//       status: "available",
//       efficiency: 95,
//     },
//     {
//       id: "PM-401",
//       name: "Press Machine PM-401",
//       type: "Press",
//       status: "available",
//       efficiency: 82,
//     },
//     {
//       id: "WR-501",
//       name: "Welding Robot WR-501",
//       type: "Welding",
//       status: "available",
//       efficiency: 79,
//     },
//   ];

//   // Required materials with units
//   const materialsList = [
//     {
//       id: "SS-001",
//       name: "Stainless Steel Sheet 2mm",
//       unit: "sheets",
//       available: 1500,
//       reorderPoint: 500,
//     },
//     {
//       id: "CW-018",
//       name: "Copper Wire 18 AWG",
//       unit: "kg",
//       available: 350,
//       reorderPoint: 200,
//     },
//     {
//       id: "AL-025",
//       name: "Aluminum Rods 25mm",
//       unit: "pieces",
//       available: 120,
//       reorderPoint: 150,
//     },
//     {
//       id: "FB-008",
//       name: "Steel Bolts M8x20",
//       unit: "pieces",
//       available: 2500,
//       reorderPoint: 1000,
//     },
//     {
//       id: "PG-ABS",
//       name: "Plastic Granules ABS",
//       unit: "kg",
//       available: 450,
//       reorderPoint: 300,
//     },
//   ];

//   // Enhanced production data with more realistic details
//   const [productionSchedule, setProductionSchedule] = useState([
//     {
//       id: "PO-2024-001",
//       productName: "Precision Bearing A-200",
//       productCode: "BRG-A200",
//       orderNo: "PO-2024-001",
//       customer: "AutoParts Inc.",
//       customerPO: "AP-2024-156",
//       quantity: 500,
//       completed: 350,
//       rejected: 5,
//       status: "in-progress",
//       dueDate: "2024-01-20",
//       startDate: "2024-01-10",
//       priority: "high",
//       assignedMachine: "MC-101",
//       operator: "John Smith",
//       supervisor: "Mike Wilson",
//       shift: "day",
//       qualityChecks: 8,
//       qualityPassed: 7,
//       estimatedTime: "40 hours",
//       elapsedTime: "28 hours",
//       materials: [
//         {
//           id: "SS-001",
//           name: "Stainless Steel Sheet 2mm",
//           required: 200,
//           consumed: 140,
//           unit: "sheets",
//         },
//         {
//           id: "FB-008",
//           name: "Steel Bolts M8x20",
//           required: 1000,
//           consumed: 700,
//           unit: "pieces",
//         },
//       ],
//       notes: "Rush order for critical client",
//       lastUpdated: "2024-01-15 14:30",
//     },
//     {
//       id: "PO-2024-002",
//       productName: "Industrial Gearbox G-45",
//       productCode: "GBX-G45",
//       orderNo: "PO-2024-002",
//       customer: "Industrial Solutions Ltd.",
//       customerPO: "IS-2024-089",
//       quantity: 250,
//       completed: 250,
//       rejected: 2,
//       status: "completed",
//       dueDate: "2024-01-15",
//       startDate: "2024-01-05",
//       priority: "medium",
//       assignedMachine: "MC-102",
//       operator: "Sarah Johnson",
//       supervisor: "Emily Brown",
//       shift: "day",
//       qualityChecks: 6,
//       qualityPassed: 6,
//       estimatedTime: "35 hours",
//       elapsedTime: "34 hours",
//       materials: [
//         {
//           id: "AL-025",
//           name: "Aluminum Rods 25mm",
//           required: 500,
//           consumed: 500,
//           unit: "pieces",
//         },
//         {
//           id: "FB-008",
//           name: "Steel Bolts M8x20",
//           required: 750,
//           consumed: 750,
//           unit: "pieces",
//         },
//       ],
//       notes: "Completed ahead of schedule",
//       lastUpdated: "2024-01-15 09:15",
//     },
//     {
//       id: "PO-2024-003",
//       productName: "Motor Housing M-300",
//       productCode: "MTR-M300",
//       orderNo: "PO-2024-003",
//       customer: "ElectroMotors Corp.",
//       customerPO: "EM-2024-234",
//       quantity: 1000,
//       completed: 400,
//       rejected: 8,
//       status: "in-progress",
//       dueDate: "2024-01-25",
//       startDate: "2024-01-12",
//       priority: "high",
//       assignedMachine: "MC-103",
//       operator: "Mike Wilson",
//       supervisor: "John Smith",
//       shift: "night",
//       qualityChecks: 10,
//       qualityPassed: 8,
//       estimatedTime: "60 hours",
//       elapsedTime: "24 hours",
//       materials: [
//         {
//           id: "SS-001",
//           name: "Stainless Steel Sheet 2mm",
//           required: 400,
//           consumed: 160,
//           unit: "sheets",
//         },
//         {
//           id: "PG-ABS",
//           name: "Plastic Granules ABS",
//           required: 200,
//           consumed: 80,
//           unit: "kg",
//         },
//       ],
//       notes: "Quality issues resolved - proceeding as planned",
//       lastUpdated: "2024-01-15 11:45",
//     },
//     {
//       id: "PO-2024-004",
//       productName: "Shaft Assembly S-150",
//       productCode: "SFT-S150",
//       orderNo: "PO-2024-004",
//       customer: "DriveSystems Inc.",
//       customerPO: "DS-2024-067",
//       quantity: 750,
//       completed: 150,
//       rejected: 3,
//       status: "pending",
//       dueDate: "2024-01-18",
//       startDate: "2024-01-16",
//       priority: "low",
//       assignedMachine: "MC-104",
//       operator: "Emily Brown",
//       supervisor: "Sarah Johnson",
//       shift: "day",
//       qualityChecks: 5,
//       qualityPassed: 5,
//       estimatedTime: "45 hours",
//       elapsedTime: "8 hours",
//       materials: [
//         {
//           id: "CW-018",
//           name: "Copper Wire 18 AWG",
//           required: 150,
//           consumed: 30,
//           unit: "kg",
//         },
//         {
//           id: "FB-008",
//           name: "Steel Bolts M8x20",
//           required: 2250,
//           consumed: 450,
//           unit: "pieces",
//         },
//       ],
//       notes: "Material shortage - waiting for copper wire",
//       lastUpdated: "2024-01-15 08:20",
//     },
//   ]);

//   // Enhanced material inventory with more details
//   const [materialInventory, setMaterialInventory] = useState([
//     {
//       id: 1,
//       name: "Stainless Steel Sheet 2mm",
//       sku: "SS-001",
//       category: "Metals",
//       location: "Warehouse A - Rack 12",
//       stock: 1500,
//       unit: "sheets",
//       minStock: 500,
//       maxStock: 3000,
//       reorderPoint: 600,
//       status: "adequate",
//       supplier: "MetalCorp Inc.",
//       supplierContact: "supplier@metalcorp.com",
//       leadTime: "5 days",
//       lastOrderDate: "2024-01-10",
//       nextDelivery: "2024-01-17",
//       unitCost: 45.5,
//       totalValue: 68250,
//       quality: "A-grade",
//     },
//     {
//       id: 2,
//       name: "Copper Wire 18 AWG",
//       sku: "CW-018",
//       category: "Electrical",
//       location: "Warehouse B - Rack 5",
//       stock: 350,
//       unit: "kg",
//       minStock: 200,
//       maxStock: 1000,
//       reorderPoint: 250,
//       status: "adequate",
//       supplier: "WireMasters Ltd.",
//       supplierContact: "orders@wiremasters.com",
//       leadTime: "3 days",
//       lastOrderDate: "2024-01-12",
//       nextDelivery: "2024-01-16",
//       unitCost: 12.75,
//       totalValue: 4462.5,
//       quality: "A-grade",
//     },
//     {
//       id: 3,
//       name: "Aluminum Rods 25mm",
//       sku: "AL-025",
//       category: "Metals",
//       location: "Warehouse A - Rack 8",
//       stock: 120,
//       unit: "pieces",
//       minStock: 150,
//       maxStock: 500,
//       reorderPoint: 180,
//       status: "critical",
//       supplier: "AluTech Industries",
//       supplierContact: "sales@alutech.com",
//       leadTime: "7 days",
//       lastOrderDate: "2024-01-05",
//       nextDelivery: "2024-01-20",
//       unitCost: 28.0,
//       totalValue: 3360,
//       quality: "B-grade",
//     },
//     {
//       id: 4,
//       name: "Steel Bolts M8x20",
//       sku: "FB-008",
//       category: "Fasteners",
//       location: "Warehouse C - Rack 3",
//       stock: 2500,
//       unit: "pieces",
//       minStock: 1000,
//       maxStock: 5000,
//       reorderPoint: 1200,
//       status: "adequate",
//       supplier: "FastenerPro",
//       supplierContact: "orders@fastenerpro.com",
//       leadTime: "2 days",
//       lastOrderDate: "2024-01-14",
//       nextDelivery: "2024-01-16",
//       unitCost: 0.45,
//       totalValue: 1125,
//       quality: "A-grade",
//     },
//     {
//       id: 5,
//       name: "Plastic Granules ABS",
//       sku: "PG-ABS",
//       category: "Raw Materials",
//       location: "Warehouse D - Silo 2",
//       stock: 450,
//       unit: "kg",
//       minStock: 300,
//       maxStock: 800,
//       reorderPoint: 350,
//       status: "warning",
//       supplier: "PolyPlast Corp",
//       supplierContact: "supply@polyplast.com",
//       leadTime: "4 days",
//       lastOrderDate: "2024-01-08",
//       nextDelivery: "2024-01-18",
//       unitCost: 3.2,
//       totalValue: 1440,
//       quality: "A-grade",
//     },
//   ]);

//   // Machine status with more details
//   const [machineStatus, setMachineStatus] = useState([
//     {
//       id: 1,
//       name: "CNC Machine MC-101",
//       type: "CNC",
//       status: "running",
//       utilization: 85,
//       efficiency: 92,
//       currentJob: "Bearing A-200",
//       operator: "John Smith",
//       maintenanceDue: "2024-02-15",
//       temperature: "45°C",
//       vibration: "0.2 mm/s",
//       productionRate: "24 units/hr",
//     },
//     {
//       id: 2,
//       name: "Injection Molder IM-202",
//       type: "Injection Molding",
//       status: "running",
//       utilization: 92,
//       efficiency: 88,
//       currentJob: "Motor Housing M-300",
//       operator: "Mike Wilson",
//       maintenanceDue: "2024-02-10",
//       temperature: "180°C",
//       pressure: "120 bar",
//       productionRate: "18 units/hr",
//     },
//     {
//       id: 3,
//       name: "Assembly Line AL-301",
//       type: "Assembly",
//       status: "idle",
//       utilization: 0,
//       efficiency: 95,
//       currentJob: "None",
//       operator: "Not Assigned",
//       maintenanceDue: "2024-01-25",
//       temperature: "23°C",
//       lastRun: "2024-01-14",
//       productionRate: "0 units/hr",
//     },
//     {
//       id: 4,
//       name: "Press Machine PM-401",
//       type: "Hydraulic Press",
//       status: "maintenance",
//       utilization: 0,
//       efficiency: 0,
//       currentJob: "Scheduled Maintenance",
//       operator: "Maintenance Team",
//       maintenanceDue: "2024-01-16",
//       maintenanceType: "Preventive",
//       estimatedCompletion: "2024-01-16 14:00",
//     },
//     {
//       id: 5,
//       name: "Welding Robot WR-501",
//       type: "Robotic Welder",
//       status: "running",
//       utilization: 78,
//       efficiency: 89,
//       currentJob: "Shaft Assembly S-150",
//       operator: "Emily Brown",
//       maintenanceDue: "2024-02-20",
//       temperature: "35°C",
//       wireSpeed: "8 m/min",
//       productionRate: "12 units/hr",
//     },
//   ]);

//   // Quality alerts
//   const qualityAlerts = [
//     {
//       id: 1,
//       type: "warning",
//       message: "Bearing A-200: Dimensional tolerance exceeded on 5 units",
//       time: "10 min ago",
//     },
//     {
//       id: 2,
//       type: "critical",
//       message: "Motor Housing: Surface finish below specification",
//       time: "25 min ago",
//     },
//     {
//       id: 3,
//       type: "info",
//       message: "Shaft Assembly: QC check completed - all passed",
//       time: "1 hour ago",
//     },
//   ];

//   // Handle form input changes
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setNewOrder((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   // Handle machine selection
//   const handleMachineSelect = (machineId) => {
//     setNewOrder((prev) => ({
//       ...prev,
//       assignedMachines: prev.assignedMachines.includes(machineId)
//         ? prev.assignedMachines.filter((id) => id !== machineId)
//         : [...prev.assignedMachines, machineId],
//     }));
//   };

//   // Handle material requirement
//   const handleMaterialRequirement = (materialId, required) => {
//     setNewOrder((prev) => ({
//       ...prev,
//       requiredMaterials: [
//         ...prev.requiredMaterials.filter((m) => m.id !== materialId),
//         { id: materialId, required: parseInt(required) || 0 },
//       ],
//     }));
//   };

//   // Submit new order
//   const handleSubmitOrder = (e) => {
//     e.preventDefault();
//     // Generate new order ID
//     const newOrderId = `PO-2024-${String(productionSchedule.length + 1).padStart(3, "0")}`;

//     // Create order object
//     const orderToAdd = {
//       id: newOrderId,
//       productName: newOrder.productName,
//       productCode: newOrder.productCode,
//       orderNo: newOrderId,
//       customer: newOrder.customer,
//       customerPO: newOrder.customerPO,
//       quantity: parseInt(newOrder.quantity),
//       completed: 0,
//       rejected: 0,
//       status: "pending",
//       dueDate: newOrder.dueDate,
//       startDate: new Date().toISOString().split("T")[0],
//       priority: newOrder.priority,
//       assignedMachine: newOrder.assignedMachines[0] || "TBD",
//       operator: "To be assigned",
//       supervisor: newOrder.supervisor,
//       shift: newOrder.shift,
//       qualityChecks: newOrder.qualityChecks.length,
//       qualityPassed: 0,
//       estimatedTime: newOrder.estimatedTime,
//       elapsedTime: "0 hours",
//       materials: newOrder.requiredMaterials.map((m) => ({
//         id: m.id,
//         name: materialsList.find((mat) => mat.id === m.id)?.name || m.id,
//         required: m.required,
//         consumed: 0,
//         unit: materialsList.find((mat) => mat.id === m.id)?.unit || "units",
//       })),
//       notes: newOrder.notes,
//       lastUpdated: new Date().toLocaleString(),
//     };

//     // Add to production schedule
//     setProductionSchedule((prev) => [orderToAdd, ...prev]);
//     setShowCreateOrder(false);

//     // Reset form
//     setNewOrder({
//       productName: "",
//       productCode: "",
//       quantity: "",
//       priority: "medium",
//       dueDate: "",
//       customer: "",
//       customerPO: "",
//       specialInstructions: "",
//       assignedMachines: [],
//       requiredMaterials: [],
//       qualityChecks: ["dimensional", "visual", "performance"],
//       estimatedTime: "",
//       shift: "day",
//       supervisor: "",
//       notes: "",
//     });

//     // Show success notification
//     setShowNotification(true);
//     setTimeout(() => setShowNotification(false), 5000);
//   };

//   // Helper function for status colors
//   const getStatusColor = (status) => {
//     const colors = {
//       "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
//       completed: "bg-green-100 text-green-800 border-green-200",
//       pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
//       running: "bg-green-100 text-green-800 border-green-200",
//       idle: "bg-gray-100 text-gray-800 border-gray-200",
//       maintenance: "bg-orange-100 text-orange-800 border-orange-200",
//       adequate: "bg-green-100 text-green-800 border-green-200",
//       warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
//       critical: "bg-red-100 text-red-800 border-red-200",
//     };
//     return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
//   };

//   const getPriorityIcon = (priority) => {
//     const icons = {
//       high: <ArrowUpRight className="w-4 h-4 text-red-500" />,
//       medium: <ArrowUpRight className="w-4 h-4 text-yellow-500" />,
//       low: <ArrowDownRight className="w-4 h-4 text-green-500" />,
//     };
//     return icons[priority] || null;
//   };

//   // Filter production schedule based on search and department
//   const filteredSchedule = productionSchedule.filter(
//     (job) =>
//       job.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       job.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       job.customer.toLowerCase().includes(searchTerm.toLowerCase()),
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//       {/* Notification Banner */}
//       {showNotification && (
//         <div className="fixed top-4 right-4 z-50 animate-slideIn">
//           <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-md">
//             <div className="flex items-start gap-3">
//               <div className="bg-green-100 rounded-full p-1">
//                 <Check className="w-5 h-5 text-green-600" />
//               </div>
//               <div className="flex-1">
//                 <h4 className="text-sm font-semibold text-green-800">
//                   Order Created Successfully
//                 </h4>
//                 <p className="text-xs text-green-600 mt-1">
//                   New production order has been added to the schedule.
//                 </p>
//               </div>
//               <button
//                 onClick={() => setShowNotification(false)}
//                 className="text-green-600 hover:text-green-800"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Create Order Modal */}
//       {showCreateOrder && (
//         <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
//               <h2 className="text-xl font-bold text-gray-900">
//                 Create New Production Order
//               </h2>
//               <button
//                 onClick={() => setShowCreateOrder(false)}
//                 className="p-2 hover:bg-gray-100 rounded-lg"
//               >
//                 <X className="w-5 h-5 text-gray-600" />
//               </button>
//             </div>

//             <form onSubmit={handleSubmitOrder} className="p-6 space-y-6">
//               {/* Basic Information */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
//                   <FileText className="w-5 h-5 text-blue-600" />
//                   Basic Information
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Product Name *
//                     </label>
//                     <input
//                       type="text"
//                       name="productName"
//                       value={newOrder.productName}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Product Code *
//                     </label>
//                     <input
//                       type="text"
//                       name="productCode"
//                       value={newOrder.productCode}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Quantity *
//                     </label>
//                     <input
//                       type="number"
//                       name="quantity"
//                       value={newOrder.quantity}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       required
//                       min="1"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Priority
//                     </label>
//                     <select
//                       name="priority"
//                       value={newOrder.priority}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="low">Low</option>
//                       <option value="medium">Medium</option>
//                       <option value="high">High</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Due Date *
//                     </label>
//                     <input
//                       type="date"
//                       name="dueDate"
//                       value={newOrder.dueDate}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       required
//                       min={new Date().toISOString().split("T")[0]}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Estimated Time (hours)
//                     </label>
//                     <input
//                       type="text"
//                       name="estimatedTime"
//                       value={newOrder.estimatedTime}
//                       onChange={handleInputChange}
//                       placeholder="e.g., 40 hours"
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Customer Information */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
//                   <Users className="w-5 h-5 text-green-600" />
//                   Customer Information
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Customer Name *
//                     </label>
//                     <input
//                       type="text"
//                       name="customer"
//                       value={newOrder.customer}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Customer PO *
//                     </label>
//                     <input
//                       type="text"
//                       name="customerPO"
//                       value={newOrder.customerPO}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       required
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Machine Assignment */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
//                   <Settings className="w-5 h-5 text-purple-600" />
//                   Machine Assignment
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
//                   {availableMachines.map((machine) => (
//                     <label
//                       key={machine.id}
//                       className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
//                         newOrder.assignedMachines.includes(machine.id)
//                           ? "border-blue-500 bg-blue-50"
//                           : machine.status === "available"
//                             ? "border-gray-200 hover:border-blue-300"
//                             : "border-gray-200 opacity-50 cursor-not-allowed"
//                       }`}
//                     >
//                       <input
//                         type="checkbox"
//                         value={machine.id}
//                         checked={newOrder.assignedMachines.includes(machine.id)}
//                         onChange={() => handleMachineSelect(machine.id)}
//                         disabled={machine.status !== "available"}
//                         className="hidden"
//                       />
//                       <div className="flex-1">
//                         <div className="flex justify-between items-center">
//                           <span className="font-medium text-sm">
//                             {machine.name}
//                           </span>
//                           {newOrder.assignedMachines.includes(machine.id) && (
//                             <Check className="w-4 h-4 text-blue-600" />
//                           )}
//                         </div>
//                         <div className="flex items-center gap-2 mt-1">
//                           <span
//                             className={`text-xs px-2 py-0.5 rounded-full ${
//                               machine.status === "available"
//                                 ? "bg-green-100 text-green-700"
//                                 : machine.status === "running"
//                                   ? "bg-blue-100 text-blue-700"
//                                   : "bg-orange-100 text-orange-700"
//                             }`}
//                           >
//                             {machine.status}
//                           </span>
//                           <span className="text-xs text-gray-500">
//                             Efficiency: {machine.efficiency}%
//                           </span>
//                         </div>
//                       </div>
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               {/* Material Requirements */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
//                   <Package className="w-5 h-5 text-orange-600" />
//                   Material Requirements
//                 </h3>
//                 <div className="space-y-3">
//                   {materialsList.map((material) => {
//                     const requirement = newOrder.requiredMaterials.find(
//                       (m) => m.id === material.id,
//                     );
//                     return (
//                       <div
//                         key={material.id}
//                         className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
//                       >
//                         <div className="flex-1">
//                           <p className="font-medium text-sm">{material.name}</p>
//                           <p className="text-xs text-gray-500">
//                             Available: {material.available} {material.unit}
//                           </p>
//                         </div>
//                         <div className="w-32">
//                           <input
//                             type="number"
//                             placeholder="Required"
//                             value={requirement?.required || ""}
//                             onChange={(e) =>
//                               handleMaterialRequirement(
//                                 material.id,
//                                 e.target.value,
//                               )
//                             }
//                             className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
//                             min="0"
//                           />
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Assignment and Notes */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
//                   <UserCircle className="w-5 h-5 text-indigo-600" />
//                   Assignment & Notes
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Supervisor
//                     </label>
//                     <select
//                       name="supervisor"
//                       value={newOrder.supervisor}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Supervisor</option>
//                       {supervisors.map((s) => (
//                         <option key={s.id} value={s.name}>
//                           {s.name} - {s.department}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Shift
//                     </label>
//                     <select
//                       name="shift"
//                       value={newOrder.shift}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="day">Day Shift (6AM - 2PM)</option>
//                       <option value="afternoon">
//                         Afternoon Shift (2PM - 10PM)
//                       </option>
//                       <option value="night">Night Shift (10PM - 6AM)</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Special Instructions / Notes
//                   </label>
//                   <textarea
//                     name="notes"
//                     value={newOrder.notes}
//                     onChange={handleInputChange}
//                     rows="3"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="Any special requirements or instructions..."
//                   ></textarea>
//                 </div>
//               </div>

//               {/* Form Actions */}
//               <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
//                 <button
//                   type="button"
//                   onClick={() => setShowCreateOrder(false)}
//                   className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center gap-2"
//                 >
//                   <Save className="w-4 h-4" />
//                   Create Production Order
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Main Dashboard Content */}
//       <div className=" mx-auto p-6">
//         {/* Header Section */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">
//               Production Planning
//             </h1>

//             <p className="text-xs text-gray-500 mt-1">
//               Last updated: {new Date().toLocaleString()}
//             </p>
//           </div>
//           <div className="flex gap-3">
//             <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition-all">
//               <RefreshCw className="w-4 h-4" />
//               Refresh
//             </button>
//             <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition-all">
//               <Download className="w-4 h-4" />
//               Export Report
//             </button>
//             <button
//               onClick={() => setShowCreateOrder(true)}
//               className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-sm hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 transition-all"
//             >
//               <Plus className="w-4 h-4" />
//               New Production Order
//             </button>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
//           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-sm text-gray-600">Daily Production</p>
//                 <h3 className="text-2xl font-bold text-gray-900 mt-1">
//                   {productionSchedule.reduce(
//                     (acc, job) => acc + job.completed,
//                     0,
//                   )}
//                   /
//                   {productionSchedule.reduce(
//                     (acc, job) => acc + job.quantity,
//                     0,
//                   )}
//                 </h3>
//                 <p className="text-xs text-gray-500 mt-1">units completed</p>
//               </div>
//               <div className="bg-blue-50 p-3 rounded-lg">
//                 <Package className="w-6 h-6 text-blue-600" />
//               </div>
//             </div>
//             <div className="mt-4">
//               <div className="flex justify-between text-xs text-gray-600 mb-1">
//                 <span>Progress</span>
//                 <span>
//                   {Math.round(
//                     (productionSchedule.reduce(
//                       (acc, job) => acc + job.completed,
//                       0,
//                     ) /
//                       productionSchedule.reduce(
//                         (acc, job) => acc + job.quantity,
//                         0,
//                       )) *
//                       100,
//                   )}
//                   %
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2">
//                 <div
//                   className="bg-blue-600 h-2 rounded-full"
//                   style={{
//                     width: `${
//                       (productionSchedule.reduce(
//                         (acc, job) => acc + job.completed,
//                         0,
//                       ) /
//                         productionSchedule.reduce(
//                           (acc, job) => acc + job.quantity,
//                           0,
//                         )) *
//                       100
//                     }%`,
//                   }}
//                 ></div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-sm text-gray-600">Efficiency Rate</p>
//                 <h3 className="text-2xl font-bold text-gray-900 mt-1">94.5%</h3>
//                 <p className="text-xs text-green-600 mt-1">
//                   ↑ 2.5% from yesterday
//                 </p>
//               </div>
//               <div className="bg-green-50 p-3 rounded-lg">
//                 <TrendingUp className="w-6 h-6 text-green-600" />
//               </div>
//             </div>
//           </div>

//           {/* <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-sm text-gray-600">Quality Rate</p>
//                 <h3 className="text-2xl font-bold text-gray-900 mt-1">98.2%</h3>
//                 <p className="text-xs text-red-600 mt-1">↓ 0.5% from target</p>
//               </div>
//               <div className="bg-purple-50 p-3 rounded-lg">
//                 <CheckCircle className="w-6 h-6 text-purple-600" />
//               </div>
//             </div>
//           </div> */}

//           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-sm text-gray-600">Active Jobs</p>
//                 <h3 className="text-2xl font-bold text-gray-900 mt-1">
//                   {
//                     productionSchedule.filter((j) => j.status === "in-progress")
//                       .length
//                   }
//                 </h3>
//                 <p className="text-xs text-gray-500 mt-1">
//                   {
//                     productionSchedule.filter((j) => j.status === "pending")
//                       .length
//                   }{" "}
//                   pending
//                 </p>
//               </div>
//               <div className="bg-orange-50 p-3 rounded-lg">
//                 <Clock className="w-6 h-6 text-orange-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-sm text-gray-600">On-Time Delivery</p>
//                 <h3 className="text-2xl font-bold text-gray-900 mt-1">97.2%</h3>
//                 <p className="text-xs text-green-600 mt-1">↑ 1.2% this week</p>
//               </div>
//               <div className="bg-indigo-50 p-3 rounded-lg">
//                 <Truck className="w-6 h-6 text-indigo-600" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Quick Actions Bar */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <span className="text-sm font-medium text-gray-700">
//                 Quick Actions:
//               </span>
//               <button className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 flex items-center gap-1">
//                 <Play className="w-4 h-4" />
//                 Start Production
//               </button>
//               <button className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-sm hover:bg-yellow-100 flex items-center gap-1">
//                 <Pause className="w-4 h-4" />
//                 Pause Job
//               </button>
//               <button className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 flex items-center gap-1">
//                 <CheckCircle className="w-4 h-4" />
//                 Complete Job
//               </button>
//               <button className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100 flex items-center gap-1">
//                 <StopCircle className="w-4 h-4" />
//                 Stop Production
//               </button>
//             </div>
//             <div className="flex items-center gap-2">
//               <button className="p-2 hover:bg-gray-100 rounded-lg">
//                 <Camera className="w-4 h-4 text-gray-600" />
//               </button>
//               <button className="p-2 hover:bg-gray-100 rounded-lg">
//                 <QrCode className="w-4 h-4 text-gray-600" />
//               </button>
//               <button className="p-2 hover:bg-gray-100 rounded-lg">
//                 <MessageSquare className="w-4 h-4 text-gray-600" />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Tabs Navigation */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
//           <div className="flex border-b border-gray-200">
//             {["overview", "production", "materials", "machines"].map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveTab(tab)}
//                 className={`px-6 py-3 text-sm font-medium capitalize transition-colors relative ${
//                   activeTab === tab
//                     ? "text-blue-600 border-b-2 border-blue-600"
//                     : "text-gray-600 hover:text-gray-900"
//                 }`}
//               >
//                 {tab}
//                 {tab === "materials" && (
//                   <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
//                     {
//                       materialInventory.filter((m) => m.status === "critical")
//                         .length
//                     }
//                   </span>
//                 )}
//                 {/* {tab === "quality" && (
//                     <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
//                       {qualityAlerts.length}
//                     </span>
//                   )} */}
//               </button>
//             ))}
//           </div>

//           {/* Tab Content */}
//           <div className="p-6">
//             {/* Overview Tab */}
//             {activeTab === "overview" && (
//               <div className="space-y-6">
//                 {/* Quality Alerts */}
//                 {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//                   <div className="flex items-center gap-2 mb-3">
//                     <AlertTriangle className="w-5 h-5 text-yellow-600" />
//                     <h3 className="font-semibold text-yellow-800">
//                       Quality Alerts
//                     </h3>
//                   </div>
//                   <div className="space-y-2">
//                     {qualityAlerts.map((alert) => (
//                       <div
//                         key={alert.id}
//                         className={`flex items-center justify-between p-2 rounded ${
//                           alert.type === "critical"
//                             ? "bg-red-50"
//                             : alert.type === "warning"
//                               ? "bg-yellow-50"
//                               : "bg-blue-50"
//                         }`}
//                       >
//                         <span className="text-sm">{alert.message}</span>
//                         <span className="text-xs text-gray-500">
//                           {alert.time}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div> */}

//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                   <div className="bg-gray-50 rounded-lg p-4">
//                     <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                       <BarChart3 className="w-5 h-5 text-blue-600" />
//                       Production Progress
//                     </h3>
//                     <div className="space-y-3">
//                       {productionSchedule.slice(0, 3).map((job) => (
//                         <div
//                           key={job.id}
//                           className="bg-white p-3 rounded-lg border border-gray-100"
//                         >
//                           <div className="flex justify-between items-center mb-2">
//                             <div>
//                               <span className="font-medium text-gray-900">
//                                 {job.productName}
//                               </span>
//                               <p className="text-xs text-gray-500">
//                                 {job.customer}
//                               </p>
//                             </div>
//                             <span
//                               className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(job.status)}`}
//                             >
//                               {job.status}
//                             </span>
//                           </div>
//                           <div className="flex justify-between text-sm text-gray-600 mb-2">
//                             <span>
//                               Progress: {job.completed}/{job.quantity}
//                             </span>
//                             <span>
//                               {Math.round((job.completed / job.quantity) * 100)}
//                               %
//                             </span>
//                           </div>
//                           <div className="w-full bg-gray-200 rounded-full h-2">
//                             <div
//                               className="bg-blue-600 h-2 rounded-full"
//                               style={{
//                                 width: `${(job.completed / job.quantity) * 100}%`,
//                               }}
//                             ></div>
//                           </div>
//                           <div className="flex justify-between text-xs text-gray-500 mt-2">
//                             <span>Due: {job.dueDate}</span>
//                             <span>Machine: {job.assignedMachine}</span>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                   <div className="bg-gray-50 rounded-lg p-4">
//                     <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                       <AlertCircle className="w-5 h-5 text-orange-600" />
//                       Critical Alerts
//                     </h3>
//                     <div className="space-y-3">
//                       {materialInventory
//                         .filter(
//                           (m) =>
//                             m.status === "critical" || m.status === "warning",
//                         )
//                         .map((material) => (
//                           <div
//                             key={material.id}
//                             className="bg-white p-3 rounded-lg border border-gray-100"
//                           >
//                             <div className="flex justify-between items-center">
//                               <div>
//                                 <p className="font-medium text-gray-900">
//                                   {material.name}
//                                 </p>
//                                 <p className="text-xs text-gray-600">
//                                   SKU: {material.sku}
//                                 </p>
//                               </div>
//                               <span
//                                 className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(material.status)}`}
//                               >
//                                 {material.status}
//                               </span>
//                             </div>
//                             <p className="text-sm mt-2">
//                               Stock: {material.stock} {material.unit} | Min:{" "}
//                               {material.minStock} {material.unit}
//                             </p>
//                             <p className="text-xs text-gray-500 mt-1">
//                               Location: {material.location}
//                             </p>
//                           </div>
//                         ))}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Production Schedule Tab */}
//             {activeTab === "production" && (
//               <div>
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="font-semibold text-gray-900">
//                     Production Schedule
//                   </h3>
//                   <div className="flex gap-2">
//                     <button className="p-2 hover:bg-gray-100 rounded-lg">
//                       <Filter className="w-4 h-4 text-gray-600" />
//                     </button>
//                     <div className="relative">
//                       <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                       <input
//                         type="text"
//                         placeholder="Search orders..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       />
//                     </div>
//                     <div className="flex border border-gray-200 rounded-lg overflow-hidden">
//                       <button
//                         onClick={() => setViewMode("table")}
//                         className={`p-2 ${viewMode === "table" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"}`}
//                       >
//                         <List className="w-4 h-4" />
//                       </button>
//                       <button
//                         onClick={() => setViewMode("grid")}
//                         className={`p-2 ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"}`}
//                       >
//                         <Grid className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 {viewMode === "table" ? (
//                   <div className="overflow-x-auto">
//                     <table className="w-full">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                             Order Info
//                           </th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                             Customer
//                           </th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                             Quantity
//                           </th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                             Progress
//                           </th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                             Quality
//                           </th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                             Status
//                           </th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                             Due Date
//                           </th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                             Machine
//                           </th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                             Actions
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-gray-200">
//                         {filteredSchedule.map((job) => (
//                           <tr key={job.id} className="hover:bg-gray-50">
//                             <td className="px-4 py-3">
//                               <div>
//                                 <p className="font-medium text-gray-900">
//                                   {job.productName}
//                                 </p>
//                                 <p className="text-xs text-gray-500">
//                                   {job.orderNo}
//                                 </p>
//                               </div>
//                             </td>
//                             <td className="px-4 py-3">
//                               <div>
//                                 <p className="text-sm text-gray-900">
//                                   {job.customer}
//                                 </p>
//                                 <p className="text-xs text-gray-500">
//                                   PO: {job.customerPO}
//                                 </p>
//                               </div>
//                             </td>
//                             <td className="px-4 py-3 text-sm text-gray-600">
//                               {job.quantity}
//                             </td>
//                             <td className="px-4 py-3">
//                               <div className="flex items-center gap-2">
//                                 <div className="w-20 bg-gray-200 rounded-full h-2">
//                                   <div
//                                     className="bg-blue-600 h-2 rounded-full"
//                                     style={{
//                                       width: `${(job.completed / job.quantity) * 100}%`,
//                                     }}
//                                   ></div>
//                                 </div>
//                                 <span className="text-xs text-gray-600">
//                                   {Math.round(
//                                     (job.completed / job.quantity) * 100,
//                                   )}
//                                   %
//                                 </span>
//                               </div>
//                               <p className="text-xs text-gray-500 mt-1">
//                                 Rejected: {job.rejected}
//                               </p>
//                             </td>
//                             <td className="px-4 py-3">
//                               <span
//                                 className={`text-xs px-2 py-1 rounded-full ${
//                                   job.qualityPassed / job.qualityChecks >= 0.9
//                                     ? "bg-green-100 text-green-700"
//                                     : job.qualityPassed / job.qualityChecks >=
//                                         0.7
//                                       ? "bg-yellow-100 text-yellow-700"
//                                       : "bg-red-100 text-red-700"
//                                 }`}
//                               >
//                                 {job.qualityPassed}/{job.qualityChecks} passed
//                               </span>
//                             </td>
//                             <td className="px-4 py-3">
//                               <span
//                                 className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(job.status)} flex items-center gap-1 w-fit`}
//                               >
//                                 {getPriorityIcon(job.priority)}
//                                 {job.status}
//                               </span>
//                             </td>
//                             <td className="px-4 py-3 text-sm text-gray-600">
//                               {job.dueDate}
//                             </td>
//                             <td className="px-4 py-3 text-sm text-gray-600">
//                               {job.assignedMachine}
//                             </td>
//                             <td className="px-4 py-3">
//                               <div className="flex gap-1">
//                                 <button className="p-1 hover:bg-gray-100 rounded">
//                                   <Eye className="w-4 h-4 text-gray-600" />
//                                 </button>
//                                 <button className="p-1 hover:bg-gray-100 rounded">
//                                   <Edit className="w-4 h-4 text-gray-600" />
//                                 </button>
//                                 <button className="p-1 hover:bg-gray-100 rounded">
//                                   <MoreVertical className="w-4 h-4 text-gray-600" />
//                                 </button>
//                               </div>
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 ) : (
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {filteredSchedule.map((job) => (
//                       <div
//                         key={job.id}
//                         className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
//                       >
//                         <div className="flex justify-between items-start mb-3">
//                           <div>
//                             <h4 className="font-medium text-gray-900">
//                               {job.productName}
//                             </h4>
//                             <p className="text-xs text-gray-500">
//                               {job.orderNo}
//                             </p>
//                           </div>
//                           <span
//                             className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(job.status)}`}
//                           >
//                             {job.status}
//                           </span>
//                         </div>
//                         <div className="space-y-2">
//                           <p className="text-sm text-gray-600">
//                             Customer: {job.customer}
//                           </p>
//                           <p className="text-sm text-gray-600">
//                             Due: {job.dueDate}
//                           </p>
//                           <div>
//                             <div className="flex justify-between text-sm mb-1">
//                               <span>Progress</span>
//                               <span>
//                                 {Math.round(
//                                   (job.completed / job.quantity) * 100,
//                                 )}
//                                 %
//                               </span>
//                             </div>
//                             <div className="w-full bg-gray-200 rounded-full h-2">
//                               <div
//                                 className="bg-blue-600 h-2 rounded-full"
//                                 style={{
//                                   width: `${(job.completed / job.quantity) * 100}%`,
//                                 }}
//                               ></div>
//                             </div>
//                           </div>
//                           <div className="flex justify-between text-sm">
//                             <span>Machine: {job.assignedMachine}</span>
//                             <span className="flex items-center gap-1">
//                               {getPriorityIcon(job.priority)}
//                               {job.priority}
//                             </span>
//                           </div>
//                         </div>
//                         <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2">
//                           <button className="p-1 hover:bg-gray-100 rounded">
//                             <Eye className="w-4 h-4 text-gray-600" />
//                           </button>
//                           <button className="p-1 hover:bg-gray-100 rounded">
//                             <Edit className="w-4 h-4 text-gray-600" />
//                           </button>
//                           <button className="p-1 hover:bg-gray-100 rounded">
//                             <Copy className="w-4 h-4 text-gray-600" />
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Materials Tab */}
//             {activeTab === "materials" && (
//               <div>
//                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
//                   <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
//                     <h4 className="text-sm font-medium text-blue-800">
//                       Total SKUs
//                     </h4>
//                     <p className="text-2xl font-bold text-blue-900">
//                       {materialInventory.length}
//                     </p>
//                   </div>
//                   <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
//                     <h4 className="text-sm font-medium text-green-800">
//                       Adequate Stock
//                     </h4>
//                     <p className="text-2xl font-bold text-green-900">
//                       {
//                         materialInventory.filter((m) => m.status === "adequate")
//                           .length
//                       }
//                     </p>
//                   </div>
//                   <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
//                     <h4 className="text-sm font-medium text-yellow-800">
//                       Low Stock
//                     </h4>
//                     <p className="text-2xl font-bold text-yellow-900">
//                       {
//                         materialInventory.filter((m) => m.status === "warning")
//                           .length
//                       }
//                     </p>
//                   </div>
//                   <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
//                     <h4 className="text-sm font-medium text-red-800">
//                       Critical Stock
//                     </h4>
//                     <p className="text-2xl font-bold text-red-900">
//                       {
//                         materialInventory.filter((m) => m.status === "critical")
//                           .length
//                       }
//                     </p>
//                   </div>
//                 </div>
//                 <div className="overflow-x-auto">
//                   <table className="w-full">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Material
//                         </th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           SKU
//                         </th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Location
//                         </th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Stock
//                         </th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Status
//                         </th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Min/Max
//                         </th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Supplier
//                         </th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Lead Time
//                         </th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Value
//                         </th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Actions
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200">
//                       {materialInventory.map((material) => (
//                         <tr key={material.id} className="hover:bg-gray-50">
//                           <td className="px-4 py-3">
//                             <div>
//                               <p className="font-medium text-gray-900">
//                                 {material.name}
//                               </p>
//                               <p className="text-xs text-gray-500">
//                                 {material.category}
//                               </p>
//                             </div>
//                           </td>
//                           <td className="px-4 py-3 text-sm text-gray-600">
//                             {material.sku}
//                           </td>
//                           <td className="px-4 py-3 text-sm text-gray-600">
//                             {material.location}
//                           </td>
//                           <td className="px-4 py-3">
//                             <span className="font-medium">
//                               {material.stock}
//                             </span>
//                             <span className="text-xs text-gray-500 ml-1">
//                               {material.unit}
//                             </span>
//                           </td>
//                           <td className="px-4 py-3">
//                             <span
//                               className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(material.status)}`}
//                             >
//                               {material.status}
//                             </span>
//                           </td>
//                           <td className="px-4 py-3 text-sm text-gray-600">
//                             {material.minStock} / {material.maxStock}
//                           </td>
//                           <td className="px-4 py-3 text-sm text-gray-600">
//                             {material.supplier}
//                           </td>
//                           <td className="px-4 py-3 text-sm text-gray-600">
//                             {material.leadTime}
//                           </td>
//                           <td className="px-4 py-3 text-sm text-gray-600">
//                             ${material.totalValue.toLocaleString()}
//                           </td>
//                           <td className="px-4 py-3">
//                             <div className="flex gap-1">
//                               <button className="p-1 hover:bg-gray-100 rounded">
//                                 <Eye className="w-4 h-4 text-gray-600" />
//                               </button>
//                               <button className="p-1 hover:bg-gray-100 rounded">
//                                 <Edit className="w-4 h-4 text-gray-600" />
//                               </button>
//                               <button className="p-1 hover:bg-gray-100 rounded">
//                                 <Upload className="w-4 h-4 text-gray-600" />
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             {/* Machines Tab */}
//             {activeTab === "machines" && (
//               <div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {machineStatus.map((machine) => (
//                     <div
//                       key={machine.id}
//                       className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
//                     >
//                       <div className="flex justify-between items-start mb-3">
//                         <div>
//                           <h4 className="font-medium text-gray-900">
//                             {machine.name}
//                           </h4>
//                           <p className="text-xs text-gray-600">
//                             {machine.type}
//                           </p>
//                         </div>
//                         <span
//                           className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(machine.status)}`}
//                         >
//                           {machine.status}
//                         </span>
//                       </div>
//                       <div className="space-y-2 text-sm">
//                         <p>
//                           <span className="text-gray-600">Operator:</span>{" "}
//                           {machine.operator}
//                         </p>
//                         <p>
//                           <span className="text-gray-600">Current Job:</span>{" "}
//                           {machine.currentJob}
//                         </p>
//                         <div>
//                           <div className="flex justify-between text-xs mb-1">
//                             <span>Utilization</span>
//                             <span className="font-medium">
//                               {machine.utilization}%
//                             </span>
//                           </div>
//                           <div className="w-full bg-gray-200 rounded-full h-2">
//                             <div
//                               className={`h-2 rounded-full ${
//                                 machine.utilization > 80
//                                   ? "bg-green-600"
//                                   : machine.utilization > 50
//                                     ? "bg-yellow-600"
//                                     : "bg-gray-600"
//                               }`}
//                               style={{ width: `${machine.utilization}%` }}
//                             ></div>
//                           </div>
//                         </div>
//                         {machine.efficiency && (
//                           <p>
//                             <span className="text-gray-600">Efficiency:</span>{" "}
//                             {machine.efficiency}%
//                           </p>
//                         )}
//                         {machine.temperature && (
//                           <p>
//                             <span className="text-gray-600">Temperature:</span>{" "}
//                             {machine.temperature}
//                           </p>
//                         )}
//                         <p className="text-xs text-gray-500">
//                           Maintenance Due: {machine.maintenanceDue}
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Quality Tab */}
//             {activeTab === "quality" && (
//               <div>
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
//                   <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
//                     <h4 className="text-sm font-medium text-green-800">
//                       Overall Quality Rate
//                     </h4>
//                     <p className="text-2xl font-bold text-green-900">98.2%</p>
//                     <p className="text-xs text-green-600 mt-1">
//                       Above target by 0.2%
//                     </p>
//                   </div>
//                   <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
//                     <h4 className="text-sm font-medium text-blue-800">
//                       Total Inspections
//                     </h4>
//                     <p className="text-2xl font-bold text-blue-900">156</p>
//                     <p className="text-xs text-blue-600 mt-1">Today</p>
//                   </div>
//                   <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
//                     <h4 className="text-sm font-medium text-yellow-800">
//                       Defects Found
//                     </h4>
//                     <p className="text-2xl font-bold text-yellow-900">18</p>
//                     <p className="text-xs text-yellow-600 mt-1">
//                       1.8% defect rate
//                     </p>
//                   </div>
//                 </div>
//                 <div className="space-y-4">
//                   <h4 className="font-medium text-gray-900">
//                     Recent Quality Alerts
//                   </h4>
//                   {qualityAlerts.map((alert) => (
//                     <div
//                       key={alert.id}
//                       className={`p-4 rounded-lg border ${
//                         alert.type === "critical"
//                           ? "bg-red-50 border-red-200"
//                           : alert.type === "warning"
//                             ? "bg-yellow-50 border-yellow-200"
//                             : "bg-blue-50 border-blue-200"
//                       }`}
//                     >
//                       <div className="flex items-start gap-3">
//                         <AlertTriangle
//                           className={`w-5 h-5 ${
//                             alert.type === "critical"
//                               ? "text-red-600"
//                               : alert.type === "warning"
//                                 ? "text-yellow-600"
//                                 : "text-blue-600"
//                           }`}
//                         />
//                         <div className="flex-1">
//                           <p className="text-sm font-medium">{alert.message}</p>
//                           <p className="text-xs text-gray-500 mt-1">
//                             {alert.time}
//                           </p>
//                         </div>
//                         <button className="p-1 hover:bg-gray-200 rounded">
//                           <Eye className="w-4 h-4 text-gray-600" />
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Footer Summary */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
//           <div className="flex items-center justify-between text-sm text-gray-600">
//             <div className="flex items-center gap-6">
//               <div className="flex items-center gap-2">
//                 <span className="flex items-center gap-1">
//                   <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                   Running:{" "}
//                   {machineStatus.filter((m) => m.status === "running").length}
//                 </span>
//                 <span className="flex items-center gap-1">
//                   <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
//                   Idle:{" "}
//                   {machineStatus.filter((m) => m.status === "idle").length}
//                 </span>
//                 <span className="flex items-center gap-1">
//                   <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
//                   Maintenance:{" "}
//                   {
//                     machineStatus.filter((m) => m.status === "maintenance")
//                       .length
//                   }
//                 </span>
//               </div>
//               <div className="h-4 w-px bg-gray-300"></div>
//               <div className="flex items-center gap-2">
//                 <span className="flex items-center gap-1">
//                   <Package className="w-4 h-4 text-blue-600" />
//                   Active Orders:{" "}
//                   {
//                     productionSchedule.filter((j) => j.status === "in-progress")
//                       .length
//                   }
//                 </span>
//                 <span className="flex items-center gap-1">
//                   <Clock className="w-4 h-4 text-orange-600" />
//                   Pending:{" "}
//                   {
//                     productionSchedule.filter((j) => j.status === "pending")
//                       .length
//                   }
//                 </span>
//               </div>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
//                 <Printer className="w-4 h-4" />
//                 Print Summary
//               </button>
//               <div className="flex items-center gap-2">
//                 <Calendar className="w-4 h-4" />
//                 <span>
//                   {new Date().toLocaleDateString("en-US", {
//                     weekday: "long",
//                     year: "numeric",
//                     month: "long",
//                     day: "numeric",
//                   })}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Add custom CSS for animations */}
//       <style jsx>{`
//         @keyframes slideIn {
//           from {
//             transform: translateX(100%);
//             opacity: 0;
//           }
//           to {
//             transform: translateX(0);
//             opacity: 1;
//           }
//         }
//         .animate-slideIn {
//           animation: slideIn 0.3s ease-out;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default ProductionDashboard;

















import React from 'react'

const ProductionPlanning = () => {
  return (
    <div>ProductionPlanning</div>
  )
}

export default ProductionPlanning
