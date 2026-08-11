// Client/QrCode.js
import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import toast from "react-hot-toast";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// ============ PDF VIEWER COMPONENT ============
export const PDFViewerPage = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get bills from localStorage
    const storedBills = localStorage.getItem("bills");
    console.log("Stored bills:", storedBills);

    if (storedBills) {
      try {
        const bills = JSON.parse(storedBills);
        console.log("Parsed bills:", bills);
        console.log("Looking for bill ID:", billId);

        const foundBill = bills.find((b) => b.id === billId);
        console.log("Found bill:", foundBill);

        if (foundBill) {
          setBill(foundBill);
        } else {
          setError(
            "Bill not found. Please check the QR code or contact support.",
          );
        }
      } catch (err) {
        console.error("Error parsing bills:", err);
        setError("Error loading bill data.");
      }
    } else {
      setError("No bills found. Please generate a bill first.");
    }
    setLoading(false);
  }, [billId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bill...</p>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <i className="fas fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800">Bill Not Found</h2>
          <p className="text-gray-600 mt-2">
            {error || "The bill you are looking for does not exist."}
          </p>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => navigate("/QR")}
              className="inline-block w-full px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to QR Generator
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-block w-full px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "$0.00";
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                📄 {bill.fileName || "Bill PDF"}
              </h1>
              <p className="text-indigo-200 text-sm mt-1">Bill ID: {bill.id}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/QR")}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition text-sm flex items-center gap-2"
              >
                <i className="fas fa-arrow-left"></i> Back to Generator
              </button>
              <button
                onClick={() => window.print()}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition text-sm flex items-center gap-2"
              >
                <i className="fas fa-print"></i> Print
              </button>
            </div>
          </div>
        </div>

        {/* Bill Details - Manual Fields Display */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-2">
              <i className="fas fa-building text-indigo-500"></i>
              Vendor
            </p>
            <p className="text-lg font-semibold text-gray-800 mt-1">
              {bill.vendor || "N/A"}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-2">
              <i className="fas fa-dollar-sign text-emerald-500"></i>
              Amount
            </p>
            <p className="text-lg font-semibold text-emerald-600 mt-1">
              {formatCurrency(bill.amount)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-2">
              <i className="fas fa-calendar-alt text-blue-500"></i>
              Date
            </p>
            <p className="text-lg font-semibold text-gray-800 mt-1">
              {bill.date || "N/A"}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-2">
              <i className="fas fa-file-pdf text-red-500"></i>
              File Size
            </p>
            <p className="text-lg font-semibold text-gray-800 mt-1">
              {bill.fileSize || "N/A"}
            </p>
          </div>
        </div>

        {/* Extended Bill Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {bill.invoiceNumber && (
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-2">
                <i className="fas fa-hashtag text-purple-500"></i>
                Invoice Number
              </p>
              <p className="text-lg font-semibold text-gray-800 mt-1 font-mono">
                {bill.invoiceNumber}
              </p>
            </div>
          )}
          {bill.tax !== undefined && bill.tax !== null && (
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-2">
                <i className="fas fa-percent text-orange-500"></i>
                Tax
              </p>
              <p className="text-lg font-semibold text-gray-800 mt-1">
                {bill.tax}%
              </p>
            </div>
          )}
          {bill.location && (
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-red-500"></i>
                Location
              </p>
              <p className="text-lg font-semibold text-gray-800 mt-1">
                {bill.location}
              </p>
            </div>
          )}
        </div>

        {/* Notes Section */}
        {bill.notes && (
          <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-2">
              <i className="fas fa-sticky-note text-yellow-500"></i>
              Notes
            </p>
            <p className="text-gray-700 mt-1">{bill.notes}</p>
          </div>
        )}

        {/* Location if available (for backward compatibility) */}
        {bill.location && typeof bill.location === "object" && (
          <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-2">
              <i className="fas fa-map-marker-alt"></i> Physical Location
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(bill.location).map(([key, value]) => (
                <span
                  key={key}
                  className="bg-indigo-50 px-3 py-1 rounded-full text-sm font-medium text-gray-700"
                >
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* OCR Data if available */}
        {bill.ocrData && (
          <div className="bg-blue-50 p-4 rounded-xl shadow-sm mb-6 border border-blue-100">
            <p className="text-xs text-blue-800 uppercase tracking-wider font-semibold flex items-center gap-2">
              <i className="fas fa-robot"></i> OCR Data
            </p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs text-gray-500">Invoice Number</p>
                <p className="font-mono font-semibold text-gray-800">
                  {bill.ocrData.invoiceNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tax</p>
                <p className="font-semibold text-gray-800">
                  {bill.ocrData.tax}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bill Summary Card */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl shadow-sm mb-6 border border-indigo-100">
          <p className="text-xs text-blue-700 uppercase tracking-wider font-semibold flex items-center gap-2">
            <i className="fas fa-info-circle"></i> Bill Summary
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(bill.amount)}
              </p>
            </div>
            {bill.tax !== undefined && bill.tax !== null && (
              <div>
                <p className="text-xs text-gray-500">Tax Amount</p>
                <p className="text-xl font-bold text-orange-600">
                  ${((bill.amount || 0) * (bill.tax / 100)).toFixed(2)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Bill ID</p>
              <p className="text-sm font-mono font-bold text-gray-800">
                {bill.id}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Generated</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(bill.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        {bill.fileUrl && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">
                <i className="fas fa-file-pdf text-red-500 mr-2"></i>
                {bill.fileName}
              </span>
              <div className="flex gap-2">
                <a
                  href={bill.fileUrl}
                  download={bill.fileName}
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2"
                >
                  <i className="fas fa-download"></i> Download PDF
                </a>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm flex items-center gap-2"
                >
                  <i className="fas fa-print"></i> Print
                </button>
              </div>
            </div>
            <div className="h-[500px] md:h-[600px]">
              <embed
                src={bill.fileUrl}
                type="application/pdf"
                width="100%"
                height="100%"
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          Scanned from QR Code • Generated on{" "}
          {new Date(bill.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// ============ MAIN QR CODE GENERATOR COMPONENT ============
export const QrCode = () => {
  const navigate = useNavigate();

  // ============ STATE MANAGEMENT ============
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [billData, setBillData] = useState(null);
  const [allBills, setAllBills] = useState([]);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [scanHistory, setScanHistory] = useState([]);
  const [currentViewUrl, setCurrentViewUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [manualFields, setManualFields] = useState({
    vendor: "",
    amount: "",
    date: "",
    invoiceNumber: "",
    tax: "",
    location: "",
    notes: "",
  });

  const qrRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  // ============ LOAD BILLS FROM LOCALSTORAGE ============
  useEffect(() => {
    const stored = localStorage.getItem("bills");
    if (stored) {
      try {
        setAllBills(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading bills:", e);
      }
    }
  }, []);

  // ============ SAVE BILLS TO LOCALSTORAGE ============
  useEffect(() => {
    if (allBills.length > 0) {
      localStorage.setItem("bills", JSON.stringify(allBills));
    }
  }, [allBills]);

  // ============ GENERATE VIEW URL ============
  const generateViewUrl = (billId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/view/${billId}`;
  };

  // ============ QR CODE GENERATION ============
  const generateQRCodeImage = (data) => {
    if (window.QRCode) {
      const tempDiv = document.createElement("div");
      new window.QRCode(tempDiv, {
        text: data,
        width: 300,
        height: 300,
        colorDark: "#1e293b",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.H,
      });
      const canvas = tempDiv.querySelector("canvas");
      if (canvas) {
        return canvas.toDataURL("image/png");
      }
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
  };

  // ============ EXTRACT TEXT FROM PDF ============
  const extractTextFromPDF = async (file) => {
    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      console.log("Extracted text:", fullText);

      // Parse the extracted text
      const parsedData = parseExtractedText(fullText, file);
      setExtractedData(parsedData);

      // Auto-fill manual fields with extracted data
      setManualFields({
        vendor: parsedData.vendor || "",
        amount: parsedData.amount || "",
        date: parsedData.date || "",
        invoiceNumber: parsedData.invoiceNumber || "",
        tax: parsedData.tax || "",
        location: parsedData.location || "",
        notes: parsedData.notes || "",
      });

      return parsedData;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      // Fallback to filename extraction
      const fallbackData = extractFromFilename(file);
      setExtractedData(fallbackData);
      setManualFields({
        vendor: fallbackData.vendor || "",
        amount: "",
        date: fallbackData.date || "",
        invoiceNumber: "",
        tax: "",
        location: "",
        notes: "",
      });
      return fallbackData;
    } finally {
      setIsExtracting(false);
    }
  };

  // ============ PARSE EXTRACTED TEXT ============
  const parseExtractedText = (text, file) => {
    const data = {
      vendor: "",
      amount: "",
      date: "",
      invoiceNumber: "",
      tax: "",
      location: "",
      notes: "",
    };

    // Common patterns for invoice data
    const patterns = {
      // Vendor/Company names - look for common patterns
      vendor: [
        /(?:vendor|company|from|supplier|billed to|issued by)[:\s]+([^\n,]+)/i,
        /^([A-Z][A-Za-z\s]+)(?:\n|,|$)/m,
      ],
      // Amount patterns
      amount: [
        /(?:total|amount|grand total|balance due|invoice total)[:\s$]*([\d,]+\.?\d*)/i,
        /(?:total)[:\s]*\$?([\d,]+\.?\d*)/i,
        /\$([\d,]+\.?\d{2})/,
      ],
      // Date patterns
      date: [
        /(?:date|invoice date|bill date|issued)[:\s]+([\d/]{8,10}|[\d-]{8,10})/i,
        /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
        /(\d{4}-\d{2}-\d{2})/,
      ],
      // Invoice number patterns
      invoiceNumber: [
        /(?:invoice|inv|order|po)[\s#:]+([A-Z0-9-]+)/i,
        /(?:invoice number|inv no)[:\s]+([A-Z0-9-]+)/i,
        /(?:#|no\.?)[:\s]*([A-Z0-9-]{5,})/i,
      ],
      // Tax patterns
      tax: [
        /(?:tax|vat|gst)[:\s]*([\d.]+)%?/i,
        /(?:tax rate|tax percentage)[:\s]*([\d.]+)/i,
      ],
      // Location patterns
      location: [
        /(?:location|address|city|state)[:\s]+([^,\n]+)/i,
        /([A-Z][a-z]+,\s*[A-Z]{2})/,
        /(\d{5}(?:-\d{4})?)/, // ZIP code
      ],
    };

    // Try each pattern
    for (const [key, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        const match = text.match(regex);
        if (match && match[1]) {
          data[key] = match[1].trim();
          break;
        }
      }
    }

    // Clean up extracted data
    if (data.amount) {
      data.amount = data.amount.replace(/,/g, "");
    }

    // If vendor not found, try to get from filename
    if (!data.vendor) {
      data.vendor = extractFromFilename(file).vendor;
    }

    // If date not found, use file modified date or today
    if (!data.date) {
      data.date = new Date().toISOString().slice(0, 10);
    }

    return data;
  };

  // ============ EXTRACT FROM FILENAME ============
  const extractFromFilename = (file) => {
    const fileName = file.name.replace(".pdf", "");
    const parts = fileName.split(/[_\s-]+/);

    return {
      vendor: parts[0] || "Unknown Vendor",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      invoiceNumber: "",
      tax: "",
      location: "",
      notes: "",
    };
  };

  // ============ PDF UPLOAD HANDLER ============
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setUploadedFile(file);
      setFileUrl(url);

      // Extract text from PDF
      const extracted = await extractTextFromPDF(file);

      setBillData({
        vendor: extracted.vendor || "Unknown Vendor",
        amount: extracted.amount || 0,
        date: extracted.date || new Date().toISOString().slice(0, 10),
        items: file.name.replace(".pdf", ""),
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(2) + " KB",
        invoiceNumber: extracted.invoiceNumber || "",
        tax: extracted.tax || "",
        location: extracted.location || "",
        notes: extracted.notes || "",
      });
    } else {
      toast.error("Please upload a PDF file");
    }
  };

  // ============ HANDLE MANUAL FIELD CHANGES ============
  const handleManualFieldChange = (e) => {
    const { name, value } = e.target;
    setManualFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============ GENERATE QR WITH URL ============
  const generateQR = () => {
    if (!uploadedFile) {
      alert("Please upload a PDF first");
      return;
    }

    const billId = "PB-" + Date.now().toString().slice(-6);
    const viewUrl = generateViewUrl(billId);

    const qrData = {
      id: billId,
      vendor: manualFields.vendor || billData?.vendor || "Unknown Vendor",
      amount: parseFloat(manualFields.amount) || 0,
      date:
        manualFields.date ||
        billData?.date ||
        new Date().toISOString().slice(0, 10),
      items: billData?.items || "",
      fileName: billData?.fileName || uploadedFile.name,
      fileSize: billData?.fileSize || "",
      viewUrl: viewUrl,
      fileUrl: fileUrl,
      createdAt: new Date().toISOString(),
      invoiceNumber:
        manualFields.invoiceNumber || billData?.invoiceNumber || "",
      tax: parseFloat(manualFields.tax) || parseFloat(billData?.tax) || 0,
      location: manualFields.location || billData?.location || "",
      notes: manualFields.notes || billData?.notes || "",
      extractedData: extractedData,
      manualFields: { ...manualFields },
    };

    setQrCodeData(qrData);
    setCurrentViewUrl(viewUrl);

    const qrImage = generateQRCodeImage(viewUrl);
    setQrImageUrl(qrImage);
    setQrGenerated(true);

    setTimeout(() => {
      if (qrRef.current && window.QRCode) {
        qrRef.current.innerHTML = "";
        new window.QRCode(qrRef.current, {
          text: viewUrl,
          width: 300,
          height: 300,
          colorDark: "#1e293b",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.H,
        });
      }
    }, 100);
  };

  // ============ SAVE BILL ============
  const saveBill = () => {
    if (qrGenerated && qrCodeData) {
      const newBill = { ...qrCodeData };
      const updatedBills = [newBill, ...allBills];
      setAllBills(updatedBills);
      localStorage.setItem("bills", JSON.stringify(updatedBills));
      setCurrentStep(2);

      toast.success(
        `Bill saved! Share this URL or QR code to allow others to view the PDF.`,
      );
    }
  };

  // ============ TOGGLE PREVIEW ============
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // ============ QR SCAN HANDLERS ============
  const handleScanQR = () => {
    try {
      let data;
      try {
        data = JSON.parse(scanInput);
      } catch {
        data = { id: scanInput };
      }

      const foundBill = allBills.find((b) => b.id === data.id);
      if (foundBill) {
        navigate(`/view/${foundBill.id}`);
        setScanHistory((prev) => [
          {
            id: Date.now(),
            data: foundBill,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else if (scanInput.startsWith("http")) {
        window.open(scanInput, "_blank");
      } else {
        toast.error("Bill not found. Please scan a valid QR code.");
      }
      setScanInput("");
    } catch {
      toast.error("Invalid QR code data. Please paste the correct QR data.");
    }
  };

  const simulateScan = () => {
    if (allBills.length > 0) {
      const latestBill = allBills[0];
      navigate(`/view/${latestBill.id}`);
      setScanHistory((prev) => [
        {
          id: Date.now(),
          data: latestBill,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  const copyUrl = () => {
    if (currentViewUrl) {
      navigator.clipboard.writeText(currentViewUrl);
      toast.error("✅ URL copied to clipboard!");
    }
  };

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-800 to-blue-700 bg-clip-text text-transparent">
            <i className="fas fa-qrcode mr-3"></i>PDF QR Code Generator
          </h1>
          <p className="text-gray-600 mt-1">
            Upload PDF, auto-extract fields, generate QR, scan to view
          </p>
        </header>

        {/* Step 1: Upload & Generate */}
        <div className="bg-white rounded-2xl shadow-xl p-6 fade-in">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="bg-indigo-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              1
            </span>
            Upload PDF & Auto-Extract Fields
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">
                📤 Upload PDF
              </h3>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
                  isExtracting
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-gray-300 hover:border-indigo-400"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {isExtracting ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-3"></div>
                    <p className="text-gray-600">Extracting data from PDF...</p>
                  </div>
                ) : (
                  <>
                    <i className="fas fa-file-pdf text-4xl text-red-400 mb-3"></i>
                    <p className="text-gray-600">Click to upload PDF</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Only PDF files supported (Auto-extraction enabled)
                    </p>
                  </>
                )}
              </div>

              {uploadedFile && !isExtracting && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-file-pdf text-2xl text-red-500"></i>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                      {extractedData && (
                        <p className="text-xs text-green-600 mt-1">
                          <i className="fas fa-check-circle"></i> Data extracted
                          successfully!
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setFileUrl(null);
                        setBillData(null);
                        setExtractedData(null);
                        setQrGenerated(false);
                        setManualFields({
                          vendor: "",
                          amount: "",
                          date: "",
                          invoiceNumber: "",
                          tax: "",
                          location: "",
                          notes: "",
                        });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Extracted Data Preview */}
              {extractedData && !isExtracting && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-2">
                    <i className="fas fa-robot mr-1"></i> Auto-Extracted Data
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {extractedData.vendor && (
                      <div>
                        <span className="text-gray-500">Vendor:</span>
                        <span className="ml-1 font-medium text-gray-800">
                          {extractedData.vendor}
                        </span>
                      </div>
                    )}
                    {extractedData.amount && (
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <span className="ml-1 font-medium text-emerald-600">
                          ${extractedData.amount}
                        </span>
                      </div>
                    )}
                    {extractedData.date && (
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-1 font-medium text-gray-800">
                          {extractedData.date}
                        </span>
                      </div>
                    )}
                    {extractedData.invoiceNumber && (
                      <div>
                        <span className="text-gray-500">Invoice #:</span>
                        <span className="ml-1 font-medium text-gray-800">
                          {extractedData.invoiceNumber}
                        </span>
                      </div>
                    )}
                    {extractedData.tax && (
                      <div>
                        <span className="text-gray-500">Tax:</span>
                        <span className="ml-1 font-medium text-gray-800">
                          {extractedData.tax}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    <i className="fas fa-info-circle"></i> Fields auto-filled
                    below. Edit if needed.
                  </p>
                </div>
              )}
            </div>

            {/* Manual Fields Section */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">
                ✏️ Bill Details{" "}
                {isExtracting && (
                  <span className="text-xs text-yellow-600">
                    (Extracting...)
                  </span>
                )}
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Vendor Name *
                    </label>
                    <input
                      type="text"
                      name="vendor"
                      value={manualFields.vendor}
                      onChange={handleManualFieldChange}
                      placeholder="Enter vendor name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-sm"
                      disabled={isExtracting}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={manualFields.amount}
                      onChange={handleManualFieldChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-sm"
                      disabled={isExtracting}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={manualFields.date}
                      onChange={handleManualFieldChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-sm"
                      disabled={isExtracting}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      name="invoiceNumber"
                      value={manualFields.invoiceNumber}
                      onChange={handleManualFieldChange}
                      placeholder="INV-001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-sm"
                      disabled={isExtracting}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Tax (%)
                    </label>
                    <input
                      type="number"
                      name="tax"
                      value={manualFields.tax}
                      onChange={handleManualFieldChange}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-sm"
                      disabled={isExtracting}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={manualFields.location}
                      onChange={handleManualFieldChange}
                      placeholder="City, State"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-sm"
                      disabled={isExtracting}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={manualFields.notes}
                    onChange={handleManualFieldChange}
                    placeholder="Additional notes..."
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-sm resize-none"
                    disabled={isExtracting}
                  />
                </div>
                <button
                  onClick={generateQR}
                  disabled={!uploadedFile || isExtracting}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-qrcode mr-2"></i>Generate QR Code
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Preview Section */}
        {qrGenerated && qrCodeData && (
          <div className="mt-6 bg-white rounded-2xl shadow-xl p-6 fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <span className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  ✓
                </span>
                QR Code Generated
              </h2>
              <button
                onClick={togglePreview}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition text-sm flex items-center gap-2"
              >
                <i
                  className={`fas ${showPreview ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* QR Code */}
              <div className="text-center">
                <div
                  ref={qrRef}
                  className="flex justify-center bg-white p-4 rounded-lg shadow-inner"
                ></div>
                {qrImageUrl && !qrRef.current?.querySelector("canvas") && (
                  <img
                    src={qrImageUrl}
                    alt="QR Code"
                    className="mx-auto"
                    style={{ width: "300px", height: "300px" }}
                  />
                )}
                <p className="text-xs text-gray-500 mt-3">
                  Bill ID:{" "}
                  <span className="font-mono font-semibold">
                    {qrCodeData?.id}
                  </span>
                </p>

                {/* View URL Display */}
                {currentViewUrl && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 text-left">
                    <p className="text-xs text-blue-700 font-medium">
                      🔗 View URL
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={currentViewUrl}
                        readOnly
                        className="flex-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                      />
                      <button
                        onClick={copyUrl}
                        className="px-2 py-1 bg-blue-800 text-white rounded hover:bg-blue-700 transition text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <button
                    onClick={() => {
                      const canvas = qrRef.current?.querySelector("canvas");
                      if (canvas) {
                        const link = document.createElement("a");
                        link.download = `QR-${qrCodeData.id}.png`;
                        link.href = canvas.toDataURL("image/png");
                        link.click();
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm flex items-center gap-2"
                  >
                    <i className="fas fa-download"></i> Download QR
                  </button>
                  <button
                    onClick={saveBill}
                    className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-indigo-700 transition text-sm flex items-center gap-2"
                  >
                    <i className="fas fa-save"></i> Save Bill
                  </button>
                  <button
                    onClick={() => navigate(`/view/${qrCodeData.id}`)}
                    className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition text-sm flex items-center gap-2"
                  >
                    <i className="fas fa-eye"></i> Preview
                  </button>
                </div>
              </div>

              {/* Manual Fields Display */}
              <div className="md:col-span-2">
                <h3 className="font-semibold text-gray-700 mb-3">
                  📋 Bill Information
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Vendor</p>
                      <p className="font-medium text-gray-800">
                        {manualFields.vendor || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="font-medium text-emerald-600">
                        ${manualFields.amount || "0.00"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium text-gray-800">
                        {manualFields.date || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Invoice Number</p>
                      <p className="font-medium text-gray-800">
                        {manualFields.invoiceNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tax</p>
                      <p className="font-medium text-gray-800">
                        {manualFields.tax || "0"}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-medium text-gray-800">
                        {manualFields.location || "N/A"}
                      </p>
                    </div>
                  </div>
                  {manualFields.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Notes</p>
                      <p className="text-sm text-gray-700">
                        {manualFields.notes}
                      </p>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">File</p>
                    <p className="text-sm text-gray-700">
                      {billData?.fileName || "N/A"} (
                      {billData?.fileSize || "N/A"})
                    </p>
                  </div>
                  {extractedData && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-700 font-semibold">
                        <i className="fas fa-robot mr-1"></i> Auto-Extracted
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Data was automatically extracted from the PDF content
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PDF Preview Section */}
            {showPreview && fileUrl && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-file-pdf text-red-500"></i>
                  PDF Preview
                </h3>
                <div className="bg-gray-100 rounded-xl overflow-hidden">
                  <div className="h-[400px] md:h-[500px]">
                    <embed
                      src={fileUrl}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Scan QR */}
        {currentStep === 2 && (
          <div className="mt-6 bg-white rounded-2xl shadow-xl p-6 fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="bg-indigo-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              Scan QR to View PDF
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* QR Display for scanning */}
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <h3 className="font-semibold text-gray-700 mb-3">
                  📱 QR Code to Scan
                </h3>
                <div className="bg-white p-4 rounded-lg shadow-inner flex justify-center">
                  {qrCodeData && (
                    <img
                      src={
                        qrImageUrl || generateQRCodeImage(qrCodeData.viewUrl)
                      }
                      alt="QR Code"
                      style={{ width: "200px", height: "200px" }}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Scan this QR code with any QR scanner app
                </p>
                <p className="text-xs text-blue-700 mt-1 break-all">
                  It will redirect to: {currentViewUrl}
                </p>
                <button
                  onClick={simulateScan}
                  className="mt-4 text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 mx-auto"
                >
                  <i className="fas fa-mobile-alt"></i> Simulate Scan
                </button>
              </div>

              {/* Manual scan input */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  ⌨️ Manual QR Scan
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste QR data or URL here"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-sm"
                    onKeyPress={(e) => e.key === "Enter" && handleScanQR()}
                  />
                  <button
                    onClick={handleScanQR}
                    className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition text-sm"
                  >
                    <i className="fas fa-search mr-2"></i>Scan
                  </button>
                </div>

                {/* Saved Bills */}
                {allBills.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">
                      Saved Bills ({allBills.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {allBills.slice(0, 10).map((bill) => (
                        <div
                          key={bill.id}
                          className="bg-gray-50 p-3 rounded-lg flex justify-between items-center hover:shadow-md transition"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {bill.id}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {bill.vendor} - ${bill.amount?.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => navigate(`/view/${bill.id}`)}
                            className="text-xs bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800 transition ml-2 flex-shrink-0"
                          >
                            View PDF
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scan History */}
                {scanHistory.length > 0 && (
                  <div className="mt-4 border-t border-gray-200 pt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">
                      Scan History
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {scanHistory.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="text-xs bg-gray-50 p-2 rounded flex justify-between items-center"
                        >
                          <span className="font-mono truncate">
                            {item.data?.id || "Unknown"}
                          </span>
                          <span className="text-gray-400 flex-shrink-0 ml-2">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="font-semibold text-gray-700 mb-4">📖 How It Works</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-indigo-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-file-pdf text-xl"></i>
              </div>
              <p className="font-medium text-gray-800 text-sm">1. Upload PDF</p>
              <p className="text-xs text-gray-500 mt-1">
                Upload your bill as PDF
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-robot text-xl"></i>
              </div>
              <p className="font-medium text-gray-800 text-sm">
                2. Auto-Extract
              </p>
              <p className="text-xs text-gray-500 mt-1">
                AI extracts fields from PDF
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-qrcode text-xl"></i>
              </div>
              <p className="font-medium text-gray-800 text-sm">
                3. Generate QR
              </p>
              <p className="text-xs text-gray-500 mt-1">QR contains the URL</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-eye text-xl"></i>
              </div>
              <p className="font-medium text-gray-800 text-sm">
                4. Preview & View
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Preview PDF with fields
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Font Awesome */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
      />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    </div>
  );
};

export default QrCode;
