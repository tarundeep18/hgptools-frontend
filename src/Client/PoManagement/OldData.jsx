import React, { useState, useCallback } from "react";
import {
  Upload,
  Database,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  X,
  Eye,
  TrendingUp,
  Package,
  Calendar,
  DollarSign,
  Clock,
  Users,
  FileText,
  BarChart3,
  Zap,
  Shield,
  Sparkles,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Printer,
  Copy,
  ExternalLink,
  Layers,
  ListChecks,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import axios from "axios";
import { BsFileExcel } from "react-icons/bs";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

const OldData = ({ onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedRow, setExpandedRow] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // New state for upload progress indicator
  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    progress: 0,
    status: "idle",
    message: "",
    details: {
      rowsRead: 0,
      rowsValid: 0,
      rowsInvalid: 0,
      rowsPending: 0,
      totalRows: 0,
      fileSize: 0,
      fileName: "",
    },
  });

  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(
      () => setNotification({ show: false, type: "", message: "" }),
      4000,
    );
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.match(/\.(xlsx|xls)$/)) {
        setFile(file);
        setError(null);
        setCurrentPage(1); // Reset to first page
        setUploadProgress({
          isUploading: true,
          progress: 0,
          status: "uploading",
          message: "Uploading file...",
          details: {
            ...uploadProgress.details,
            fileSize: file.size,
            fileName: file.name,
          },
        });

        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setUploadProgress((prev) => ({
              ...prev,
              progress: 100,
              status: "processing",
              message: "Processing file...",
            }));
          }
          setUploadProgress((prev) => ({
            ...prev,
            progress: Math.min(progress, 100),
          }));
        }, 200);

        showNotification("success", "File uploaded successfully!");
        previewFile(file, () => {
          clearInterval(interval);
          setUploadProgress((prev) => ({
            ...prev,
            progress: 100,
            status: "complete",
            message: "File processed successfully!",
          }));
        });
      } else {
        showNotification(
          "error",
          "Please upload an Excel file (.xlsx or .xls)",
        );
        setUploadProgress({
          isUploading: false,
          progress: 0,
          status: "error",
          message: "Invalid file format. Please upload .xlsx or .xls",
          details: uploadProgress.details,
        });
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.match(/\.(xlsx|xls)$/)) {
        setFile(file);
        setError(null);
        setCurrentPage(1); // Reset to first page
        setUploadProgress({
          isUploading: true,
          progress: 0,
          status: "uploading",
          message: "Uploading file...",
          details: {
            ...uploadProgress.details,
            fileSize: file.size,
            fileName: file.name,
          },
        });

        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setUploadProgress((prev) => ({
              ...prev,
              progress: 100,
              status: "processing",
              message: "Processing file...",
            }));
          }
          setUploadProgress((prev) => ({
            ...prev,
            progress: Math.min(progress, 100),
          }));
        }, 200);

        showNotification("success", `File "${file.name}" selected`);
        previewFile(file, () => {
          clearInterval(interval);
          setUploadProgress((prev) => ({
            ...prev,
            progress: 100,
            status: "complete",
            message: "File processed successfully!",
          }));
        });
      } else {
        showNotification(
          "error",
          "Please upload an Excel file (.xlsx or .xls)",
        );
        setUploadProgress({
          isUploading: false,
          progress: 0,
          status: "error",
          message: "Invalid file format. Please upload .xlsx or .xls",
          details: uploadProgress.details,
        });
      }
    }
  };

  const parseDate = (dateValue) => {
    if (!dateValue) return null;

    if (typeof dateValue === "number") {
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + dateValue * 86400000);
    }

    if (typeof dateValue === "string") {
      const dateStr = dateValue.trim();
      const dateMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
      if (dateMatch) {
        const months = {
          Jan: 0,
          Feb: 1,
          Mar: 2,
          Apr: 3,
          May: 4,
          Jun: 5,
          Jul: 6,
          Aug: 7,
          Sep: 8,
          Oct: 9,
          Nov: 10,
          Dec: 11,
        };
        return new Date(
          parseInt(dateMatch[3]),
          months[dateMatch[2]] || 0,
          parseInt(dateMatch[1]),
        );
      }

      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        let year, month, day;
        if (parts[0].length === 4) {
          year = parseInt(parts[0]);
          month = parseInt(parts[1]) - 1;
          day = parseInt(parts[2]);
        } else {
          day = parseInt(parts[0]);
          month = parseInt(parts[1]) - 1;
          year = parseInt(parts[2]);
        }
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month, day);
        }
      }
    }

    return new Date(dateValue);
  };

  // Helper to find column with case-insensitive matching
  const findColumnFlexible = (row, mappings) => {
    for (const key of mappings) {
      const matchedKey = Object.keys(row).find(
        (k) => k.toLowerCase().trim() === key.toLowerCase().trim(),
      );
      if (
        matchedKey &&
        row[matchedKey] !== undefined &&
        row[matchedKey] !== null &&
        row[matchedKey] !== ""
      ) {
        return row[matchedKey];
      }
    }
    return null;
  };

  const previewFile = async (file, onComplete) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          if (!jsonData || jsonData.length === 0) {
            showNotification("error", "No data found in Excel file");
            setUploadProgress((prev) => ({
              ...prev,
              status: "error",
              message: "No data found in Excel file",
            }));
            return;
          }

          const headers = Object.keys(jsonData[0]);
          console.log("📊 Headers found:", headers);

          const columnMapping = {
            order: ["Order", "Order No", "PO Number", "PO No", "PO"],
            dwgNo: [
              "DWG NO",
              "DWG NO.",
              "Item Code",
              "Part No",
              "DWG",
              "Drawing No",
            ],
            description: [
              "Description",
              "Item Description",
              "Part Description",
              "Desc",
            ],
            orderQuantity: [
              "Order Quantity",
              "order quantity",
              "Order Qty",
              "Qty",
              "Quantity",
              "QTY",
            ],
            price: ["Price", "Rate", "Unit Price", "Rate Per Unit"],
            total: ["TOTAL", "Total Value", "Amount", "Total"],
            totalDisp: [
              "TOTAL DISP",
              "TOTAl DISP",
              "Total Dispatched",
              "Dispatch",
              "Dispatched",
            ],
            netPending: ["net pending", "Pending Qty", "Balance", "Pending"],
            delDate: ["Del Date", "Delivery Date", "Due Date", "Delivery"],
            orderDate: ["Order Date", "PO Date", "Date"],
          };

          setUploadProgress((prev) => ({
            ...prev,
            progress: 60,
            message: "Processing data...",
          }));

          const processed = jsonData.map((row, index) => {
            const order = findColumnFlexible(row, columnMapping.order);
            const dwgNo = findColumnFlexible(row, columnMapping.dwgNo);
            const description = findColumnFlexible(
              row,
              columnMapping.description,
            );
            const orderQuantity =
              parseFloat(
                findColumnFlexible(row, columnMapping.orderQuantity),
              ) || 0;
            const price =
              parseFloat(findColumnFlexible(row, columnMapping.price)) || 0;
            const total =
              parseFloat(findColumnFlexible(row, columnMapping.total)) || 0;

            const totalDispRaw = findColumnFlexible(
              row,
              columnMapping.totalDisp,
            );
            const totalDisp = parseFloat(totalDispRaw) || 0;

            const netPending =
              parseFloat(findColumnFlexible(row, columnMapping.netPending)) ||
              0;
            const delDate = parseDate(
              findColumnFlexible(row, columnMapping.delDate),
            );
            const orderDate = parseDate(
              findColumnFlexible(row, columnMapping.orderDate),
            );

            const hasRequiredFields = order && dwgNo;
            const hasDispatch = totalDisp > 0;
            const dispatchQty = totalDisp;
            const dispatchValue = dispatchQty * price;

            const isConsistent = hasDispatch
              ? Math.abs(totalDisp + netPending - orderQuantity) < 0.01
              : Math.abs(netPending - orderQuantity) < 0.01;

            const batches = [];
            if (hasDispatch && dispatchQty > 0) {
              batches.push({
                batchNo: 1,
                totalDisp: totalDisp,
                qty: dispatchQty,
                date: delDate ? delDate.toISOString().split("T")[0] : null,
                rate: price,
                hasDispatch: true,
              });
            }

            let isValidForImport = false;
            let status = "";
            let statusType = "";

            if (!hasRequiredFields) {
              isValidForImport = false;
              status = "❌ Invalid - Missing Order or DWG NO";
              statusType = "error";
            } else if (hasDispatch && dispatchQty > 0) {
              isValidForImport = true;
              status = `✅ ${dispatchQty} units dispatched`;
              if (!isConsistent) {
                status += ` ⚠️ (Qty mismatch: ${orderQuantity} - ${totalDisp} ≠ ${netPending})`;
              }
              statusType = "success";
            } else if (hasRequiredFields && !hasDispatch) {
              isValidForImport = false;
              status = `⏳ Pending Order - No Dispatch Yet (${orderQuantity} units pending)`;
              statusType = "warning";
            } else {
              isValidForImport = false;
              status = "❌ Invalid Data";
              statusType = "error";
            }
            return {
              rowNumber: index + 1,
              order: String(order || `HIST-${Date.now()}-${index}`).trim(),
              dwgNo: String(dwgNo || `ITEM-${index}`).trim(),
              description: String(description || "").trim(),
              orderQuantity: Number(orderQuantity) || 0,
              price: Number(price) || 0,
              total: Number(total) || 0,
              totalDisp: Number(totalDisp) || 0,
              netPending: Number(netPending) || 0,
              delDate: delDate ? delDate.toISOString().split("T")[0] : null,
              orderDate: orderDate
                ? orderDate.toISOString().split("T")[0]
                : null,
              batches: batches,
              totalDispatchQty: dispatchQty,
              totalDispatchValue: dispatchValue,
              hasMultipleBatches: batches.length > 1,
              hasDispatch: hasDispatch,
              hasRequiredFields: hasRequiredFields,
              isValidForImport: isValidForImport,
              isConsistent: isConsistent,
              status: status,
              statusType: statusType,
            };
          });

          const readyForImport = processed.filter(
            (row) => row.isValidForImport,
          );
          const pendingOrders = processed.filter(
            (row) => row.hasRequiredFields && !row.hasDispatch,
          );
          const invalidRows = processed.filter((row) => !row.hasRequiredFields);

          setPreviewData({
            totalRows: jsonData.length,
            readyForImport: readyForImport.length,
            pendingOrders: pendingOrders.length,
            invalidRows: invalidRows.length,
            data: processed,
            readyData: readyForImport,
            pendingData: pendingOrders,
            totalBatches: readyForImport.reduce(
              (sum, d) => sum + d.batches.length,
              0,
            ),
            summary: {
              totalOrders: new Set(processed.map((d) => d.order)).size,
              totalItems: processed.length,
              totalValue: processed.reduce((sum, d) => sum + d.total, 0),
              totalDispatchQty: readyForImport.reduce(
                (sum, d) => sum + d.totalDispatchQty,
                0,
              ),
              totalDispatchValue: readyForImport.reduce(
                (sum, d) => sum + d.totalDispatchValue,
                0,
              ),
              totalBatches: readyForImport.reduce(
                (sum, d) => sum + d.batches.length,
                0,
              ),
              pendingCount: pendingOrders.length,
              dispatchCount: readyForImport.length,
              invalidCount: invalidRows.length,
              totalPendingQty: pendingOrders.reduce(
                (sum, d) => sum + d.orderQuantity,
                0,
              ),
            },
          });

          setUploadProgress((prev) => ({
            ...prev,
            progress: 100,
            status: "complete",
            message: `✅ ${readyForImport.length} rows ready for import`,
            details: {
              ...prev.details,
              rowsRead: jsonData.length,
              rowsValid: readyForImport.length,
              rowsInvalid: invalidRows.length,
              rowsPending: pendingOrders.length,
              totalRows: jsonData.length,
            },
          }));

          setShowPreview(true);

          let message = `✅ Found ${readyForImport.length} rows with dispatch data`;
          if (pendingOrders.length > 0) {
            message += `\n⏳ ${pendingOrders.length} pending orders (${pendingOrders.reduce((sum, d) => sum + d.orderQuantity, 0)} units pending)`;
          }
          if (invalidRows.length > 0) {
            message += `\n❌ ${invalidRows.length} invalid rows (missing required fields)`;
          }
          showNotification("info", message);

          if (onComplete) onComplete();
        } catch (error) {
          console.error("Error parsing Excel:", error);
          showNotification(
            "error",
            "Failed to parse Excel file: " + error.message,
          );
          setUploadProgress((prev) => ({
            ...prev,
            status: "error",
            message: "Failed to parse Excel file: " + error.message,
          }));
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading file:", error);
      showNotification("error", "Failed to read file");
      setUploadProgress((prev) => ({
        ...prev,
        status: "error",
        message: "Failed to read file",
      }));
    }
  };

  // Verify POs before import
  const verifyPOs = async () => {
    if (!previewData || previewData.readyForImport === 0) {
      showNotification("error", "No data ready for import to verify");
      return;
    }

    setLoading(true);
    try {
      const verifyData = previewData.readyData.map((row) => ({
        orderNumber: row.order,
        itemCode: row.dwgNo,
        description: row.description,
      }));

      const response = await axios.post(
        `${API_URL}/old-dispatch/purchase-orders/verify`,
        { data: verifyData },
        { withCredentials: true },
      );

      if (response.data.success) {
        setVerificationResult(response.data.data);
        setShowVerification(true);

        const { found, notFound, itemsNotFound } = response.data.data;
        let message = `✅ ${found.length} POs found`;
        if (notFound.length > 0) {
          message += `, ⚠️ ${notFound.length} POs not found`;
        }
        if (itemsNotFound.length > 0) {
          message += `, ❌ ${itemsNotFound.length} items missing`;
        }
        showNotification("info", message);
      }
    } catch (error) {
      console.error("Verification error:", error);
      showNotification("error", "Failed to verify POs");
    } finally {
      setLoading(false);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!previewData || previewData.readyForImport === 0) {
      showNotification("error", "No data ready for import");
      return;
    }

    setLoading(true);
    setProcessing(true);
    setImportProgress(0);

    try {
      const importData = [];

      previewData.readyData.forEach((row) => {
        row.batches.forEach((batch) => {
          importData.push({
            orderNumber: String(row.order).trim(),
            itemCode: String(row.dwgNo).trim(),
            description: String(row.description || "").trim(),
            orderQuantity: Number(row.orderQuantity) || 0,
            price: Number(batch.rate || row.price) || 0,
            total: Number(row.total) || 0,
            totalDispatched: Number(batch.totalDisp) || 0,
            netPending: Number(row.netPending) || 0,
            dispatchQuantity: Number(batch.qty) || 0,
            dispatchDate:
              batch.date ||
              row.delDate ||
              row.orderDate ||
              new Date().toISOString().split("T")[0],
            calculationMethod: `TOTAL DISP: ${batch.totalDisp} units`,
            originalData: row,
          });
        });
      });

      if (importData.length === 0) {
        showNotification("error", "No dispatch data found to import");
        setLoading(false);
        setProcessing(false);
        return;
      }

      console.log(
        `📦 Preparing to import ${importData.length} dispatch records from ${previewData.readyForImport} items`,
      );

      const progressInterval = setInterval(() => {
        setImportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await axios.post(
        `${API_URL}/old-dispatch/purchase-orders/import-historical`,
        { data: importData },
        { withCredentials: true },
      );

      clearInterval(progressInterval);
      setImportProgress(100);

      if (response.data.success) {
        setImportStats(response.data.data);

        const {
          importedCount,
          processedPOs,
          errors,
          poNotFound,
          stats,
          skippedCount,
        } = response.data.data;

        let message = `✅ Successfully imported ${importedCount} historical dispatches`;
        if (processedPOs) {
          message += ` across ${processedPOs} POs`;
        }

        if (stats) {
          const withDispatch = stats.withDispatch || 0;
          const pendingOrders = stats.pendingOrders || 0;
          message += `\n📊 ${withDispatch} with dispatch, ${pendingOrders} pending orders skipped`;
        }

        if (previewData.pendingOrders > 0) {
          message += `\n⏳ ${previewData.pendingOrders} pending orders (${previewData.summary.totalPendingQty} units) were skipped`;
        }

        if (skippedCount > 0) {
          message += `\n⏭️ ${skippedCount} additional rows skipped`;
        }

        if (poNotFound && poNotFound.length > 0) {
          message += `\n⚠️ ${poNotFound.length} POs not found.`;
        }

        if (errors && errors.length > 0) {
          message += `\n❌ ${errors.length} errors occurred.`;
        }

        showNotification("success", message);

        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        showNotification("error", response.data.message || "Import failed");
      }
    } catch (error) {
      console.error("Import error:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to import historical data",
      );
    } finally {
      setLoading(false);
      setProcessing(false);
      setTimeout(() => setImportProgress(0), 2000);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        Order: "PO-2024-001",
        "DWG NO": "PART-001",
        Description: "Sample Part Description",
        "Order Quantity": 100,
        Price: 50,
        TOTAL: 5000,
        "TOTAL DISP": 30,
        "net pending": 70,
        "Del Date": "2024-01-15",
        "Order Date": "2024-01-01",
      },
      {
        Order: "PO-2024-001",
        "DWG NO": "PART-002",
        Description: "Another Part",
        "Order Quantity": 50,
        Price: 100,
        TOTAL: 5000,
        "TOTAL DISP": "",
        "net pending": 50,
        "Del Date": "2024-02-15",
        "Order Date": "2024-02-01",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historical Data");

    ws["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    XLSX.writeFile(wb, "historical-dispatch-template.xlsx");
    showNotification("success", "Template downloaded successfully!");
  };

  const templatePreview = [
    {
      Order: "PO-2024-001",
      dwgNo: "PART-001",
      description: "Sample Part Description",
      orderQty: 100,
      price: 50,
      total: 5000,
      totalDisp: 30,
      pending: 70,
      delDate: "2024-01-15",
      orderDate: "2024-01-01",
      status: "Dispatched",
    },
    {
      Order: "PO-2024-001",
      dwgNo: "PART-002",
      description: "Another Part",
      orderQty: 50,
      price: 100,
      total: 5000,
      totalDisp: 0,
      pending: 50,
      delDate: "2024-02-15",
      orderDate: "2024-02-01",
      status: "Pending Order",
    },
  ];

  const getFilteredData = () => {
    if (!previewData) return [];

    let data = previewData.data;

    if (searchTerm) {
      data = data.filter(
        (row) =>
          row.order.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.dwgNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterStatus === "ready") {
      data = data.filter((row) => row.isValidForImport);
    } else if (filterStatus === "pending") {
      data = data.filter((row) => row.hasRequiredFields && !row.hasDispatch);
    } else if (filterStatus === "invalid") {
      data = data.filter((row) => !row.hasRequiredFields);
    }

    return data;
  };

  const renderBatches = (batches) => {
    return (
      <div className="space-y-1">
        {batches.map((batch, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
              B{batch.batchNo}
            </span>
            <span className="font-medium">{batch.qty}</span>
            <span className="text-gray-500">units</span>
            <span className="text-gray-500">|</span>
            <span className="text-green-600 font-medium">
              ₹{batch.totalDisp * batch.rate}
            </span>
            {batch.date && (
              <>
                <span className="text-gray-500">|</span>
                <span className="text-gray-400">{batch.date}</span>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  const filteredData = getFilteredData();

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setExpandedRow(null); // Close expanded row when changing page
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "idle":
        return "bg-gray-100 text-gray-600";
      case "uploading":
        return "bg-blue-100 text-blue-600";
      case "processing":
        return "bg-purple-100 text-purple-600";
      case "complete":
        return "bg-green-100 text-green-600";
      case "error":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "idle":
        return <Upload size={16} />;
      case "uploading":
        return <Loader2 size={16} className="animate-spin" />;
      case "processing":
        return <RefreshCw size={16} className="animate-spin" />;
      case "complete":
        return <CheckCircle size={16} />;
      case "error":
        return <AlertCircle size={16} />;
      default:
        return <Upload size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-sm animate-slide-in ${
            notification.type === "success"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              : notification.type === "error"
                ? "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle size={20} />
          ) : notification.type === "error" ? (
            <AlertCircle size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
          <span className="font-medium whitespace-pre-line">
            {notification.message}
          </span>
          <button
            onClick={() => setNotification({ show: false })}
            className="ml-2 hover:opacity-80"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Database size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Historical Dispatch Import
                  </h1>
                  <p className="text-blue-100 mt-1 flex items-center gap-2">
                    <Package size={16} />
                    Import historical dispatch quantity data from Excel
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadTemplate}
                className="px-5 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
              >
                <Download size={18} />
                Download Template
              </button>
            </div>
          </div>
        </div>

        {/* Upload Progress Indicator */}
        {uploadProgress.status !== "idle" && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl ${getStatusColor(uploadProgress.status)}`}
              >
                {getStatusIcon(uploadProgress.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {uploadProgress.status === "idle" && "Ready to upload"}
                    {uploadProgress.status === "uploading" &&
                      "Uploading Excel file..."}
                    {uploadProgress.status === "processing" &&
                      "Processing data..."}
                    {uploadProgress.status === "complete" &&
                      "✅ Upload complete!"}
                    {uploadProgress.status === "error" && "❌ Upload failed"}
                  </h3>
                  <span className="text-sm font-medium text-gray-600">
                    {uploadProgress.progress > 0 &&
                      `${Math.round(uploadProgress.progress)}%`}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      uploadProgress.status === "error"
                        ? "bg-red-500"
                        : uploadProgress.status === "complete"
                          ? "bg-green-500"
                          : "bg-gradient-to-r from-blue-500 to-purple-500"
                    }`}
                    style={{
                      width: `${Math.min(uploadProgress.progress, 100)}%`,
                    }}
                  ></div>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  {uploadProgress.message || "Processing your file..."}
                </p>

                {uploadProgress.details.totalRows > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <span className="text-gray-500">Total Rows:</span>
                      <span className="font-bold text-blue-700 ml-1">
                        {uploadProgress.details.totalRows}
                      </span>
                    </div>
                    <div className="bg-green-50 rounded-lg px-3 py-2">
                      <span className="text-gray-500">Valid:</span>
                      <span className="font-bold text-green-700 ml-1">
                        {uploadProgress.details.rowsValid || 0}
                      </span>
                    </div>
                    <div className="bg-yellow-50 rounded-lg px-3 py-2">
                      <span className="text-gray-500">Pending:</span>
                      <span className="font-bold text-yellow-700 ml-1">
                        {uploadProgress.details.rowsPending || 0}
                      </span>
                    </div>
                    <div className="bg-red-50 rounded-lg px-3 py-2">
                      <span className="text-gray-500">Invalid:</span>
                      <span className="font-bold text-red-700 ml-1">
                        {uploadProgress.details.rowsInvalid || 0}
                      </span>
                    </div>
                    {uploadProgress.details.fileName && (
                      <div className="bg-gray-50 rounded-lg px-3 py-2 col-span-2 md:col-span-1">
                        <span className="text-gray-500">File:</span>
                        <span className="font-medium text-gray-700 ml-1 truncate block">
                          {uploadProgress.details.fileName}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(uploadProgress.status)}`}
                  >
                    {uploadProgress.status === "idle" && "⏸️ Idle"}
                    {uploadProgress.status === "uploading" && "📤 Uploading"}
                    {uploadProgress.status === "processing" && "⚙️ Processing"}
                    {uploadProgress.status === "complete" && "✅ Complete"}
                    {uploadProgress.status === "error" && "❌ Error"}
                  </span>
                  {uploadProgress.status === "complete" && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ All data processed successfully
                    </span>
                  )}
                  {uploadProgress.status === "error" && (
                    <span className="text-xs text-red-600 font-medium">
                      ⚠️ Please check the file and try again
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              dragActive
                ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]"
                : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
            }`}
          >
            <div className="mb-6">
              <div className="inline-flex p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl">
                <BsFileExcel className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {dragActive ? "Drop your Excel file here" : "Upload Excel File"}
            </h3>
            <p className="text-gray-500 mb-4">
              Upload your historical dispatch data in Excel format
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                <CheckCircle size={12} />
                Auto Detection
              </span>
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                <Shield size={12} />
                Data Validation
              </span>
              <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                <Sparkles size={12} />
                Smart Mapping
              </span>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="inline-flex px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Upload size={18} className="mr-2" />
                Choose Excel File
              </div>
            </label>
            {file && (
              <div className="mt-4 p-3 bg-green-50 rounded-xl inline-flex items-center gap-2 border border-green-200">
                <BsFileExcel className="text-green-600" size={20} />
                <span className="text-sm text-green-700 font-medium">
                  {file.name}
                </span>
                <span className="text-xs text-green-500">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewData(null);
                    setShowPreview(false);
                    setVerificationResult(null);
                    setShowVerification(false);
                    setUploadProgress({
                      isUploading: false,
                      progress: 0,
                      status: "idle",
                      message: "",
                      details: {
                        rowsRead: 0,
                        rowsValid: 0,
                        rowsInvalid: 0,
                        rowsPending: 0,
                        totalRows: 0,
                        fileSize: 0,
                        fileName: "",
                      },
                    });
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {processing && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Importing data...
              </span>
              <span className="text-sm font-medium text-indigo-600">
                {Math.round(importProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {importProgress < 100
                ? "Processing your data..."
                : "Import complete!"}
            </p>
          </div>
        )}

        {/* Preview Section */}
        {showPreview && previewData && !processing && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Eye className="text-indigo-600" size={24} />
                    Data Preview
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Review the extracted data before importing
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={verifyPOs}
                    disabled={loading || previewData.readyForImport === 0}
                    className="px-4 py-2 border border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Shield size={18} />
                    Verify POs
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                  >
                    <X size={18} />
                    Close Preview
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={loading || previewData.readyForImport === 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <Database size={18} />
                    )}
                    Import {previewData.readyForImport} Items
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4 p-6 bg-gray-50">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <FileText size={16} />
                  Total Rows
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {previewData.totalRows}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
                  <CheckCircle size={16} />
                  Ready for Import
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {previewData.readyForImport}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-yellow-600 text-sm mb-1">
                  <Clock size={16} />
                  Pending Orders
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {previewData.pendingOrders}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-orange-500 text-sm mb-1">
                  <Package size={16} />
                  Pending Units
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {previewData.summary.totalPendingQty || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
                  <Layers size={16} />
                  Total Batches
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {previewData.totalBatches || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
                  <DollarSign size={16} />
                  Total Value
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{previewData.summary.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-600 text-sm mb-1">
                  <TrendingUp size={16} />
                  Dispatch Qty
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  {previewData.summary.totalDispatchQty.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-red-500 text-sm mb-1">
                  <AlertCircle size={16} />
                  Invalid Rows
                </div>
                <p className="text-2xl font-bold text-red-500">
                  {previewData.invalidRows}
                </p>
              </div>
            </div>

            {/* Verification Results */}
            {showVerification && verificationResult && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Shield size={16} className="text-blue-600" />
                    PO Verification Results
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✅ Found:</span>
                      <span className="font-bold text-green-700">
                        {verificationResult.found?.length || 0} POs
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600">❌ Not Found:</span>
                      <span className="font-bold text-red-700">
                        {verificationResult.notFound?.length || 0} POs
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600">⚠️ Missing Items:</span>
                      <span className="font-bold text-orange-700">
                        {verificationResult.itemsNotFound?.length || 0}
                      </span>
                    </div>
                  </div>
                  {verificationResult.notFound?.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-xs font-medium text-red-700 mb-1">
                        POs not found:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {verificationResult.notFound
                          .slice(0, 10)
                          .map((po, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-mono"
                            >
                              {po}
                            </span>
                          ))}
                        {verificationResult.notFound.length > 10 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            +{verificationResult.notFound.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Search by Order, Item Code, or Description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">All Rows</option>
                  <option value="ready">Ready for Import</option>
                  <option value="pending">Pending Orders</option>
                  <option value="invalid">Invalid Rows</option>
                </select>
                <span className="text-sm text-gray-500">
                  Showing {startIndex + 1} - {endIndex} of {filteredData.length}{" "}
                  rows
                </span>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      DWG NO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Order Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      TOTAL DISP
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        row.isValidForImport
                          ? "bg-green-50/30"
                          : row.hasRequiredFields && !row.hasDispatch
                            ? "bg-yellow-50/30"
                            : "bg-gray-50 opacity-60"
                      }`}
                      onClick={() =>
                        setExpandedRow(expandedRow === idx ? null : idx)
                      }
                    >
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {row.rowNumber}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-indigo-600">
                        {row.order}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-700">
                        {row.dwgNo}
                      </td>
                      <td
                        className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate"
                        title={row.description}
                      >
                        {row.description}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-medium">
                        {row.orderQuantity}
                      </td>
                      <td className="px-4 py-3 text-xs text-right">
                        ₹{row.price}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-medium">
                        ₹{row.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-bold text-emerald-600">
                        {row.totalDisp > 0 ? row.totalDisp : "0"}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-bold text-orange-600">
                        {row.netPending}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.isValidForImport ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={12} className="mr-1" />
                            Ready
                          </span>
                        ) : row.hasRequiredFields && !row.hasDispatch ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock size={12} className="mr-1" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle size={12} className="mr-1" />
                            Invalid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredData.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="px-4 py-1 text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages || 1}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Last
                  </button>
                </div>

                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} - {endIndex} of {filteredData.length}{" "}
                  rows
                </div>
              </div>
            )}
            {/* Import Stats */}
            {importStats && (
              <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CheckCircle className="text-emerald-600" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Import Complete!
                    </h3>
                    <p className="text-gray-600">
                      Historical data has been successfully imported
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                    <p className="text-2xl font-bold text-green-600">
                      {importStats.importedCount}
                    </p>
                    <p className="text-xs text-gray-600">Dispatches Imported</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                    <p className="text-2xl font-bold text-blue-600">
                      {importStats.processedPOs}
                    </p>
                    <p className="text-xs text-gray-600">POs Processed</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                    <p className="text-2xl font-bold text-orange-600">
                      {importStats.skippedCount}
                    </p>
                    <p className="text-xs text-gray-600">Rows Skipped</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                    <p className="text-2xl font-bold text-red-600">
                      {importStats.errors?.length || 0}
                    </p>
                    <p className="text-xs text-gray-600">Errors</p>
                  </div>
                </div>
                {importStats.stats && (
                  <div className="mt-4 p-4 bg-white rounded-xl shadow-sm grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">With Dispatch</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {importStats.stats.withDispatch}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pending Orders</p>
                      <p className="text-lg font-bold text-orange-600">
                        {importStats.stats.pendingOrders}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Positive Dispatch</p>
                      <p className="text-lg font-bold text-blue-600">
                        {importStats.stats.positiveDispatch}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        Total Rows Processed
                      </p>
                      <p className="text-lg font-bold text-purple-600">
                        {importStats.totalRowsProcessed}
                      </p>
                    </div>
                  </div>
                )}
                {importStats.poNotFound &&
                  importStats.poNotFound.length > 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-800 mb-2">
                        ⚠️ The following POs were not found and need to be added
                        first:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {importStats.poNotFound.slice(0, 10).map((po, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-mono"
                          >
                            {po}
                          </span>
                        ))}
                        {importStats.poNotFound.length > 10 && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs">
                            +{importStats.poNotFound.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                {importStats.itemNotFound &&
                  importStats.itemNotFound.length > 0 && (
                    <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <p className="text-sm font-medium text-orange-800 mb-2">
                        ⚠️ The following items were not found in their POs:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {importStats.itemNotFound
                          .slice(0, 10)
                          .map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-mono"
                            >
                              {item.itemCode} ({item.order})
                            </span>
                          ))}
                        {importStats.itemNotFound.length > 10 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs">
                            +{importStats.itemNotFound.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Excel Template Preview
                  </h2>
                  <p className="text-sm text-gray-500">
                    Use this format when preparing historical dispatch data.
                  </p>
                </div>

                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-auto max-h-[60vh]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                        DWG NO
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase">
                        Order Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase">
                        TOTAL
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase text-green-600">
                        TOTAL DISP
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase text-orange-600">
                        NET PENDING
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                        Del Date
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                        Order Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {templatePreview.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{row.Order}</td>
                        <td className="px-4 py-3 font-mono">{row.dwgNo}</td>
                        <td className="px-4 py-3">{row.description}</td>
                        <td className="px-4 py-3 text-right">{row.orderQty}</td>
                        <td className="px-4 py-3 text-right">₹{row.price}</td>
                        <td className="px-4 py-3 text-right">₹{row.total}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-bold">
                          {row.totalDisp}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-600 font-bold">
                          {row.pending}
                        </td>
                        <td className="px-4 py-3 text-center">{row.delDate}</td>
                        <td className="px-4 py-3 text-center">
                          {row.orderDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t bg-gray-50">
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>TOTAL DISP</strong> = Dispatched Quantity
                  </p>
                  <p>
                    <strong>NET PENDING</strong> = Remaining Quantity
                  </p>
                  <p>
                    <strong>Order Quantity</strong> = TOTAL DISP + NET PENDING
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OldData;
