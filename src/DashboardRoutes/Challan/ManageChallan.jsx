// import React, { useState } from 'react';
// import { 
//   FileText, 
//   Calendar, 
//   Truck, 
//   Package, 
//   User, 
//   Building2, 
//   Scale, 
//   Camera,
//   AlertCircle,
//   Search,
//   Filter,
//   Download,
//   BarChart3,
//   TrendingUp,
//   Clock,
//   CheckCircle2,
//   XCircle,
//   ArrowLeft,
//   ArrowRight,
//   Plus,
//   Edit,
//   Trash2,
//   Eye,
//   MoreVertical,
//   Bell,
//   ChevronDown,
//   ChevronUp,
//   FileSpreadsheet,
//   PieChart,
//   TrendingDown,
//   AlertTriangle,
//   CheckCheck,
//   Send,
//   RefreshCw,
//   Printer,
//   Upload,
//   Save,
//   X
// } from 'lucide-react';

// const ChallanSystem = () => {
//   const [activeTab, setActiveTab] = useState('dashboard');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [dateRange, setDateRange] = useState({ start: '', end: '' });
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [showEntryForm, setShowEntryForm] = useState(false);

//   return (
//     <div className="bg-gray-50 min-h-screen p-6">
//       {/* Header with Tabs */}
//       <div className="mb-6">
//         <div className="flex items-center justify-between mb-4">
//           <h1 className="text-2xl font-bold text-gray-800">Challan Management System</h1>
//           <button
//             onClick={() => setShowEntryForm(!showEntryForm)}
//             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
//           >
//             <Plus className="h-4 w-4 mr-2" />
//             New Challan Entry
//           </button>
//         </div>
        
//         {/* Tab Navigation */}
//         <div className="flex space-x-2 bg-white p-1 rounded-lg inline-block border border-gray-200">
//           {['dashboard', 'reports', 'search', 'alerts', 'analytics'].map((tab) => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
//                 activeTab === tab 
//                   ? 'bg-blue-600 text-white' 
//                   : 'text-gray-600 hover:bg-gray-100'
//               }`}
//             >
//               {tab === 'dashboard' && 'Dashboard'}
//               {tab === 'reports' && 'Reports'}
//               {tab === 'search' && 'Search & Filter'}
//               {tab === 'alerts' && 'Smart Alerts'}
//               {tab === 'analytics' && 'Analytics'}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Conditional Rendering of Tabs */}
//       {showEntryForm ? (
//         <ChallanEntry onClose={() => setShowEntryForm(false)} />
//       ) : (
//         <>
//           {activeTab === 'dashboard' && <Dashboard />}
//           {activeTab === 'reports' && <Reports />}
//           {activeTab === 'search' && (
//             <SearchFilter 
//               searchTerm={searchTerm} 
//               setSearchTerm={setSearchTerm} 
//               dateRange={dateRange} 
//               setDateRange={setDateRange} 
//               statusFilter={statusFilter} 
//               setStatusFilter={setStatusFilter} 
//             />
//           )}
//           {activeTab === 'alerts' && <SmartAlerts />}
//           {activeTab === 'analytics' && <AnalyticsCharts />}
//         </>
//       )}
//     </div>
//   );
// };

// // Dashboard Component with Cards
// const Dashboard = () => {
//   const stats = [
//     { label: 'Total Challans Today', value: '12', icon: FileText, color: 'bg-blue-500', trend: '+15%' },
//     { label: 'Pending Deliveries', value: '5', icon: Truck, color: 'bg-yellow-500', trend: '-2%' },
//     { label: 'Returnable Challans', value: '3', icon: RefreshCw, color: 'bg-purple-500', trend: '0%' },
//     { label: 'Overdue Returns', value: '1', icon: AlertCircle, color: 'bg-red-500', trend: '+1' },
//   ];

//   const recentChallans = [
//     { id: 'CH101', customer: 'ABC Tools', item: 'Punch', qty: 50, status: 'Delivered', date: '2024-01-15' },
//     { id: 'CH102', customer: 'XYZ Engineering', item: 'Die', qty: 25, status: 'In Transit', date: '2024-01-15' },
//     { id: 'CH103', customer: 'Ram Industries', item: 'Shaft', qty: 10, status: 'Pending', date: '2024-01-15' },
//     { id: 'CH104', customer: 'ABC Tools', item: 'Die Set', qty: 5, status: 'Returned', date: '2024-01-14' },
//   ];

//   return (
//     <div>
//       <h2 className="text-xl font-semibold text-gray-800 mb-4">Dashboard Overview</h2>
      
//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         {stats.map((stat, index) => (
//           <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
//                 <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
//                 <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
//               </div>
//               <div className={`${stat.color} p-3 rounded-lg`}>
//                 <stat.icon className="h-6 w-6 text-white" />
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Recent Challans */}
//       <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold text-gray-800">Recent Challans</h3>
//           <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
//             View All
//             <ArrowRight className="h-4 w-4 ml-1" />
//           </button>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-gray-200">
//                 <th className="text-left py-3 text-sm font-semibold text-gray-600">Challan No</th>
//                 <th className="text-left py-3 text-sm font-semibold text-gray-600">Customer</th>
//                 <th className="text-left py-3 text-sm font-semibold text-gray-600">Item</th>
//                 <th className="text-left py-3 text-sm font-semibold text-gray-600">Qty</th>
//                 <th className="text-left py-3 text-sm font-semibold text-gray-600">Status</th>
//                 <th className="text-left py-3 text-sm font-semibold text-gray-600">Date</th>
//                 <th className="text-left py-3 text-sm font-semibold text-gray-600">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {recentChallans.map((challan) => (
//                 <tr key={challan.id} className="border-b border-gray-100 hover:bg-gray-50">
//                   <td className="py-3 text-sm font-medium text-gray-800">{challan.id}</td>
//                   <td className="py-3 text-sm text-gray-600">{challan.customer}</td>
//                   <td className="py-3 text-sm text-gray-600">{challan.item}</td>
//                   <td className="py-3 text-sm text-gray-600">{challan.qty}</td>
//                   <td className="py-3">
//                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                       challan.status === 'Delivered' ? 'bg-green-100 text-green-800' :
//                       challan.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
//                       challan.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
//                       'bg-gray-100 text-gray-800'
//                     }`}>
//                       {challan.status}
//                     </span>
//                   </td>
//                   <td className="py-3 text-sm text-gray-600">{challan.date}</td>
//                   <td className="py-3">
//                     <button className="text-gray-600 hover:text-gray-800 mr-2">
//                       <Eye className="h-4 w-4" />
//                     </button>
//                     <button className="text-blue-600 hover:text-blue-800">
//                       <Edit className="h-4 w-4" />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Challan Entry Form Component
// const ChallanEntry = ({ onClose }) => {
//   const [challanType, setChallanType] = useState('delivery');
//   const [isReturnable, setIsReturnable] = useState(false);
//   const [showVendor, setShowVendor] = useState(false);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     // Handle form submission
//     console.log('Form submitted');
//     onClose();
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-200">
//       {/* Form Header */}
//       <div className="flex items-center justify-between p-6 border-b border-gray-200">
//         <h2 className="text-xl font-semibold text-gray-800">New Challan Entry</h2>
//         <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//           <X className="h-5 w-5" />
//         </button>
//       </div>

//       <form onSubmit={handleSubmit} className="p-6 space-y-6">
//         {/* Basic Details Section */}
//         <div className="border-b border-gray-200 pb-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
//             <FileText className="h-5 w-5 mr-2 text-blue-600" />
//             Basic Details
//           </h3>
          
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Challan Number</label>
//               <input 
//                 type="text" 
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
//                 placeholder="CH-2024-001" 
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Challan Date</label>
//               <input 
//                 type="date" 
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
//                 defaultValue={new Date().toISOString().split('T')[0]}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Challan Type</label>
//               <select 
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={challanType}
//                 onChange={(e) => setChallanType(e.target.value)}
//               >
//                 <option value="delivery">Delivery</option>
//                 <option value="returnable">Returnable</option>
//                 <option value="vendor">Vendor Job Work</option>
//                 <option value="material">Material Issue</option>
//               </select>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
//               <input 
//                 type="text" 
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
//                 placeholder="Enter customer name" 
//               />
//             </div>
//             <div>
//               <div className="flex items-center mb-2">
//                 <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
//                 <button 
//                   type="button"
//                   onClick={() => setShowVendor(!showVendor)}
//                   className="ml-2 text-xs text-blue-600 hover:text-blue-800"
//                 >
//                   {showVendor ? 'Hide' : 'Show (Optional)'}
//                 </button>
//               </div>
//               {showVendor && (
//                 <input 
//                   type="text" 
//                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
//                   placeholder="Enter vendor name" 
//                 />
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Item Details Section */}
//         <div className="border-b border-gray-200 pb-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
//             <Package className="h-5 w-5 mr-2 text-blue-600" />
//             Item Details
//           </h3>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
//               <input 
//                 type="text" 
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
//                 placeholder="Enter item name" 
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
//               <input 
//                 type="text" 
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
//                 placeholder="Enter material" 
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
//               <input 
//                 type="number" 
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
//                 placeholder="Qty" 
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Weight (optional)</label>
//               <input 
//                 type="text" 
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
//                 placeholder="Enter weight" 
//               />
//             </div>
//           </div>
//         </div>

//         {/* Dispatch Details Section */}
//         <div className="border-b border-gray-200 pb-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
//             <Truck className="h-5 w-5 mr-2 text-blue-600" />
//             Dispatch Details
//           </h3>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
//               <input 
//                 type="text" 
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
//                 placeholder="Enter vehicle number" 
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Driver Name</label>
//               <input 
//                 type="text" 
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
//                 placeholder="Enter driver name" 
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Transport Name</label>
//               <input 
//                 type="text" 
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
//                 placeholder="Enter transport name" 
//               />
//             </div>
//           </div>
//         </div>

//         {/* Tracking Details Section */}
//         <div className="border-b border-gray-200 pb-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
//             <Clock className="h-5 w-5 mr-2 text-blue-600" />
//             Tracking Details
//           </h3>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Returnable</label>
//               <select 
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={isReturnable ? 'yes' : 'no'}
//                 onChange={(e) => setIsReturnable(e.target.value === 'yes')}
//               >
//                 <option value="no">No</option>
//                 <option value="yes">Yes</option>
//               </select>
//             </div>
//             {isReturnable && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Return Due Date</label>
//                 <input 
//                   type="date" 
//                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
//                 />
//               </div>
//             )}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
//               <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
//                 <option value="dispatched">Dispatched</option>
//                 <option value="transit">In Transit</option>
//                 <option value="delivered">Delivered</option>
//                 <option value="returned">Returned</option>
//                 <option value="pending">Pending</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Extra Section */}
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
//             <Camera className="h-5 w-5 mr-2 text-blue-600" />
//             Extra Information
//           </h3>

//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Upload Challan Image (optional)</label>
//               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
//                 <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
//                 <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
//                 <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
//               </div>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Notes / Remarks</label>
//               <textarea 
//                 rows="3" 
//                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
//                 placeholder="Enter any additional notes..."
//               ></textarea>
//             </div>
//           </div>
//         </div>

//         {/* Form Actions */}
//         <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
//           <button
//             type="button"
//             onClick={onClose}
//             className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
//           >
//             <Save className="h-4 w-4 mr-2" />
//             Save Challan
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// // Reports Component
// const Reports = () => {
//   const [reportType, setReportType] = useState('daily');

//   const dailyChallans = [
//     { no: 'CH101', customer: 'ABC Tools', item: 'Punch', qty: 50, status: 'Delivered' },
//     { no: 'CH102', customer: 'XYZ Engineering', item: 'Die', qty: 25, status: 'In Transit' },
//     { no: 'CH103', customer: 'Ram Industries', item: 'Shaft', qty: 10, status: 'Pending' },
//   ];

//   const pendingDeliveries = [
//     { no: 'CH102', customer: 'XYZ Engineering', item: 'Die', status: 'In Transit' },
//     { no: 'CH103', customer: 'Ram Industries', item: 'Shaft', status: 'Pending' },
//     { no: 'CH104', customer: 'ABC Tools', item: 'Die Set', status: 'Dispatched' },
//   ];

//   const returnableChallans = [
//     { no: 'CH120', customer: 'ABC Tools', item: 'Die Set', dueDate: '2024-03-25', status: 'Pending', overdue: true },
//     { no: 'CH121', customer: 'XYZ Engineering', item: 'Punch Set', dueDate: '2024-03-28', status: 'In Transit', overdue: false },
//   ];

//   return (
//     <div>
//       <h2 className="text-xl font-semibold text-gray-800 mb-4">Reports</h2>

//       {/* Report Type Tabs */}
//       <div className="flex space-x-2 mb-6 bg-white p-1 rounded-lg inline-block border border-gray-200">
//         {['daily', 'pending', 'returnable', 'customer', 'vendor'].map((type) => (
//           <button
//             key={type}
//             onClick={() => setReportType(type)}
//             className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
//               reportType === type 
//                 ? 'bg-blue-600 text-white' 
//                 : 'text-gray-600 hover:bg-gray-100'
//             }`}
//           >
//             {type === 'daily' ? 'Daily Challan' :
//              type === 'pending' ? 'Pending Deliveries' :
//              type === 'returnable' ? 'Returnable Tracking' :
//              type === 'customer' ? 'Customer History' : 'Vendor Tracking'}
//           </button>
//         ))}
//       </div>

//       {/* Report Content */}
//       <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//         {reportType === 'daily' && (
//           <div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Challans</h3>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-gray-200">
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Challan No</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Customer</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Item</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Qty</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {dailyChallans.map((challan, index) => (
//                     <tr key={index} className="border-b border-gray-100">
//                       <td className="py-3 text-sm font-medium text-gray-800">{challan.no}</td>
//                       <td className="py-3 text-sm text-gray-600">{challan.customer}</td>
//                       <td className="py-3 text-sm text-gray-600">{challan.item}</td>
//                       <td className="py-3 text-sm text-gray-600">{challan.qty}</td>
//                       <td className="py-3">
//                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                           challan.status === 'Delivered' ? 'bg-green-100 text-green-800' :
//                           challan.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
//                           'bg-yellow-100 text-yellow-800'
//                         }`}>
//                           {challan.status}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {reportType === 'pending' && (
//           <div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Deliveries</h3>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-gray-200">
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Challan No</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Customer</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Item</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {pendingDeliveries.map((challan, index) => (
//                     <tr key={index} className="border-b border-gray-100">
//                       <td className="py-3 text-sm font-medium text-gray-800">{challan.no}</td>
//                       <td className="py-3 text-sm text-gray-600">{challan.customer}</td>
//                       <td className="py-3 text-sm text-gray-600">{challan.item}</td>
//                       <td className="py-3">
//                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                           challan.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
//                           'bg-yellow-100 text-yellow-800'
//                         }`}>
//                           {challan.status}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {reportType === 'returnable' && (
//           <div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-4">Returnable Challans Tracking</h3>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-gray-200">
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Challan No</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Customer</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Item</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Due Date</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {returnableChallans.map((challan, index) => (
//                     <tr key={index} className={`border-b border-gray-100 ${challan.overdue ? 'bg-red-50' : ''}`}>
//                       <td className="py-3 text-sm font-medium text-gray-800">{challan.no}</td>
//                       <td className="py-3 text-sm text-gray-600">{challan.customer}</td>
//                       <td className="py-3 text-sm text-gray-600">{challan.item}</td>
//                       <td className={`py-3 text-sm ${challan.overdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
//                         {challan.dueDate}
//                         {challan.overdue && (
//                           <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
//                             Overdue
//                           </span>
//                         )}
//                       </td>
//                       <td className="py-3">
//                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                           challan.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
//                           'bg-yellow-100 text-yellow-800'
//                         }`}>
//                           {challan.status}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {reportType === 'customer' && (
//           <div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer: ABC Engineering</h3>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-gray-200">
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Challan No</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Date</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Item</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Qty</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr className="border-b border-gray-100">
//                     <td className="py-3 text-sm font-medium text-gray-800">CH102</td>
//                     <td className="py-3 text-sm text-gray-600">2024-03-10</td>
//                     <td className="py-3 text-sm text-gray-600">Punch</td>
//                     <td className="py-3 text-sm text-gray-600">20</td>
//                   </tr>
//                   <tr className="border-b border-gray-100">
//                     <td className="py-3 text-sm font-medium text-gray-800">CH105</td>
//                     <td className="py-3 text-sm text-gray-600">2024-03-12</td>
//                     <td className="py-3 text-sm text-gray-600">Die</td>
//                     <td className="py-3 text-sm text-gray-600">15</td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {reportType === 'vendor' && (
//           <div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendor Challan Tracking</h3>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-gray-200">
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Vendor</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Material</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Qty</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Sent Date</th>
//                     <th className="text-left py-3 text-sm font-semibold text-gray-600">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr className="border-b border-gray-100">
//                     <td className="py-3 text-sm font-medium text-gray-800">Ram Heat</td>
//                     <td className="py-3 text-sm text-gray-600">Punch</td>
//                     <td className="py-3 text-sm text-gray-600">50</td>
//                     <td className="py-3 text-sm text-gray-600">2024-03-05</td>
//                     <td className="py-3">
//                       <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
//                         Pending
//                       </span>
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // Search & Filter Component
// const SearchFilter = ({ searchTerm, setSearchTerm, dateRange, setDateRange, statusFilter, setStatusFilter }) => {
//   return (
//     <div>
//       <h2 className="text-xl font-semibold text-gray-800 mb-4">Search & Filter Challans</h2>

//       {/* Search Bar */}
//       <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
//         <div className="flex items-center space-x-4">
//           <div className="flex-1 relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search by challan number, customer, or item..."
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//           <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
//             <Search className="h-4 w-4 mr-2" />
//             Search
//           </button>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//         <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
//           <Filter className="h-5 w-5 mr-2 text-blue-600" />
//           Filters
//         </h3>

//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Date Range From</label>
//             <input
//               type="date"
//               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               value={dateRange.start}
//               onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Date Range To</label>
//             <input
//               type="date"
//               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               value={dateRange.end}
//               onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
//             <select
//               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//             >
//               <option value="all">All Status</option>
//               <option value="dispatched">Dispatched</option>
//               <option value="transit">In Transit</option>
//               <option value="delivered">Delivered</option>
//               <option value="returned">Returned</option>
//               <option value="pending">Pending</option>
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Returnable</label>
//             <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
//               <option value="all">All</option>
//               <option value="yes">Yes</option>
//               <option value="no">No</option>
//             </select>
//           </div>
//         </div>

//         <div className="mt-4 flex items-center justify-end space-x-2">
//           <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
//             Reset Filters
//           </button>
//           <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
//             Apply Filters
//           </button>
//         </div>
//       </div>

//       {/* Search Results */}
//       <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//         <h3 className="text-lg font-semibold text-gray-800 mb-4">Search Results</h3>
//         <div className="text-center text-gray-500 py-8">
//           <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
//           <p>Enter search criteria to find challans</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Smart Alerts Component
// const SmartAlerts = () => {
//   const alerts = [
//     {
//       type: 'return',
//       title: 'Return Due Alert',
//       message: 'Returnable Challan CH120 due tomorrow',
//       details: 'Customer: ABC Tools • Item: Die Set',
//       severity: 'warning',
//       time: '2 hours ago'
//     },
//     {
//       type: 'overdue',
//       title: 'Overdue Alert',
//       message: 'Challan CH115 not returned for 5 days',
//       details: 'Customer: XYZ Engineering • Item: Shaft',
//       severity: 'danger',
//       time: '5 hours ago'
//     },
//     {
//       type: 'dispatch',
//       title: 'Dispatch Reminder',
//       message: 'Dispatch scheduled today',
//       details: 'Customer: XYZ Engineering • Item: Shaft',
//       severity: 'info',
//       time: '1 day ago'
//     }
//   ];

//   return (
//     <div>
//       <h2 className="text-xl font-semibold text-gray-800 mb-4">Smart Alerts</h2>

//       <div className="space-y-4">
//         {alerts.map((alert, index) => (
//           <div
//             key={index}
//             className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
//               alert.severity === 'danger' ? 'border-red-500' :
//               alert.severity === 'warning' ? 'border-yellow-500' :
//               'border-blue-500'
//             }`}
//           >
//             <div className="flex items-start justify-between">
//               <div className="flex items-start space-x-3">
//                 {alert.severity === 'danger' && <AlertCircle className="h-6 w-6 text-red-500" />}
//                 {alert.severity === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-500" />}
//                 {alert.severity === 'info' && <Bell className="h-6 w-6 text-blue-500" />}
//                 <div>
//                   <h3 className="font-semibold text-gray-800">{alert.title}</h3>
//                   <p className="text-gray-600 mt-1">{alert.message}</p>
//                   <p className="text-sm text-gray-500 mt-2">{alert.details}</p>
//                 </div>
//               </div>
//               <span className="text-xs text-gray-500">{alert.time}</span>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// // Analytics Charts Component
// const AnalyticsCharts = () => {
//   const monthlyData = [
//     { month: 'Jan', count: 120 },
//     { month: 'Feb', count: 145 },
//     { month: 'Mar', count: 110 },
//     { month: 'Apr', count: 135 },
//     { month: 'May', count: 160 },
//     { month: 'Jun', count: 148 },
//   ];

//   const customerData = [
//     { name: 'ABC Engineering', count: 40 },
//     { name: 'XYZ Tools', count: 30 },
//     { name: 'Ram Industries', count: 25 },
//     { name: 'Tech Solutions', count: 20 },
//     { name: 'Precision Tools', count: 15 },
//   ];

//   return (
//     <div>
//       <h2 className="text-xl font-semibold text-gray-800 mb-4">Analytics Dashboard</h2>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Monthly Dispatch Chart */}
//         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
//             <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
//             Monthly Dispatch Trend
//           </h3>
//           <div className="space-y-3">
//             {monthlyData.map((item, index) => (
//               <div key={index}>
//                 <div className="flex items-center justify-between text-sm mb-1">
//                   <span className="text-gray-600">{item.month}</span>
//                   <span className="font-medium text-gray-800">{item.count} challans</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div
//                     className="bg-blue-600 h-2 rounded-full"
//                     style={{ width: `${(item.count / 160) * 100}%` }}
//                   ></div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Customer-wise Distribution */}
//         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
//             <PieChart className="h-5 w-5 mr-2 text-blue-600" />
//             Customer-wise Dispatch
//           </h3>
//           <div className="space-y-4">
//             {customerData.map((item, index) => (
//               <div key={index}>
//                 <div className="flex items-center justify-between text-sm mb-1">
//                   <span className="text-gray-600">{item.name}</span>
//                   <span className="font-medium text-gray-800">{item.count} challans</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div
//                     className="bg-green-500 h-2 rounded-full"
//                     style={{ width: `${(item.count / 40) * 100}%` }}
//                   ></div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Status Distribution */}
//         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-2">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Status Distribution</h3>
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//             <div className="text-center p-4 bg-green-50 rounded-lg">
//               <div className="text-2xl font-bold text-green-600">45</div>
//               <div className="text-sm text-gray-600">Delivered</div>
//             </div>
//             <div className="text-center p-4 bg-blue-50 rounded-lg">
//               <div className="text-2xl font-bold text-blue-600">23</div>
//               <div className="text-sm text-gray-600">In Transit</div>
//             </div>
//             <div className="text-center p-4 bg-yellow-50 rounded-lg">
//               <div className="text-2xl font-bold text-yellow-600">12</div>
//               <div className="text-sm text-gray-600">Pending</div>
//             </div>
//             <div className="text-center p-4 bg-purple-50 rounded-lg">
//               <div className="text-2xl font-bold text-purple-600">8</div>
//               <div className="text-sm text-gray-600">Returned</div>
//             </div>
//             <div className="text-center p-4 bg-red-50 rounded-lg">
//               <div className="text-2xl font-bold text-red-600">5</div>
//               <div className="text-sm text-gray-600">Overdue</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChallanSystem;