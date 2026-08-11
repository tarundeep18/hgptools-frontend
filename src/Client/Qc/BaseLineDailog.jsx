
const BaselineCreationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  checkpoint,
  currentCL,
  currentUCL,
  currentLCL,
  loading,
}) => {
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [centerLine, setCenterLine] = useState(currentCL || "");
  const [ucl, setUcl] = useState(currentUCL || "");
  const [lcl, setLcl] = useState(currentLCL || "");
  const [controlMode, setControlMode] = useState("auto");
  const [effectiveFrom, setEffectiveFrom] = useState("current");
  const [selectedSubgroup, setSelectedSubgroup] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const reasonOptions = [
    "Machine Change",
    "Tool Change",
    "Material Change",
    "Process Improvement",
    "Operator Change",
    "Fixture Change",
    "Customer Requirement",
    "Other",
  ];

  const handleConfirm = () => {
    if (!reason || (reason === "Other" && !otherReason)) {
      toast.error("Please select or enter a reason");
      return;
    }
    if (!centerLine) {
      toast.error("Center Line is required");
      return;
    }
    if (controlMode === "manual") {
      if (!ucl || !lcl) {
        toast.error("UCL and LCL are required in manual mode");
        return;
      }
      if (parseFloat(ucl) <= parseFloat(centerLine)) {
        toast.error("UCL must be greater than CL");
        return;
      }
      if (parseFloat(centerLine) <= parseFloat(lcl)) {
        toast.error("CL must be greater than LCL");
        return;
      }
    }

    setShowConfirmation(true);
  };

  const handleFinalConfirm = () => {
    const payload = {
      reason: reason === "Other" ? otherReason : reason,
      centerLine: parseFloat(centerLine),
      controlMode,
      ucl: controlMode === "manual" ? parseFloat(ucl) : null,
      lcl: controlMode === "manual" ? parseFloat(lcl) : null,
      effectiveFrom:
        effectiveFrom === "current"
          ? "current"
          : effectiveFrom === "next"
          ? "next"
          : selectedSubgroup,
    };
    onConfirm(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Create New Baseline
              </h3>
              <p className="text-xs text-slate-500">
                {checkpoint?.checkpointName || "SPC Chart"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Current baseline info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-2">Current Baseline</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-slate-500">CL:</span>
                <span className="ml-1 font-medium text-slate-700">
                  {currentCL !== null ? currentCL.toFixed(4) : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">UCL:</span>
                <span className="ml-1 font-medium text-amber-700">
                  {currentUCL !== null ? currentUCL.toFixed(4) : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">LCL:</span>
                <span className="ml-1 font-medium text-amber-700">
                  {currentLCL !== null ? currentLCL.toFixed(4) : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason for New Baseline <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              {reasonOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {reason === "Other" && (
              <input
                type="text"
                placeholder="Please specify..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
              />
            )}
          </div>

          {/* Center Line */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Center Line (CL) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              value={centerLine}
              onChange={(e) => setCenterLine(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter center line value"
            />
            <p className="text-xs text-slate-400 mt-1">
              Default: Current X-bar average ({currentCL?.toFixed(4) || "-"})
            </p>
          </div>

          {/* Control Limit Mode */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Control Limit Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="auto"
                  checked={controlMode === "auto"}
                  onChange={(e) => setControlMode(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Auto Calculate</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="manual"
                  checked={controlMode === "manual"}
                  onChange={(e) => setControlMode(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Manual Limits</span>
              </label>
            </div>
            {controlMode === "auto" && (
              <p className="text-xs text-blue-600 mt-1">
                System will calculate limits after sufficient new subgroup data
                is collected
              </p>
            )}
          </div>

          {/* Manual Limits */}
          {controlMode === "manual" && (
            <div className="grid grid-cols-2 gap-4 bg-blue-50/50 rounded-lg p-4 border border-blue-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Upper Control Limit (UCL)
                </label>
                <input
                  type="number"
                  step="any"
                  value={ucl}
                  onChange={(e) => setUcl(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter UCL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lower Control Limit (LCL)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lcl}
                  onChange={(e) => setLcl(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter LCL"
                />
              </div>
            </div>
          )}

          {/* Effective From */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Effective From
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="current"
                  checked={effectiveFrom === "current"}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Current subgroup</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="next"
                  checked={effectiveFrom === "next"}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Next subgroup</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="specific"
                  checked={effectiveFrom === "specific"}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Specific subgroup</span>
              </label>
              {effectiveFrom === "specific" && (
                <input
                  type="text"
                  placeholder="Enter subgroup index or ID..."
                  value={selectedSubgroup}
                  onChange={(e) => setSelectedSubgroup(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                />
              )}
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">You are creating a new SPC baseline.</p>
                <p className="text-amber-600 text-xs mt-1">
                  Historical data and previous baselines will remain unchanged.
                  Only future subgroups will use the new limits.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Create Baseline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add this confirmation dialog
const BaselineConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  payload,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[301] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Confirm Baseline Creation
          </h3>
          <p className="text-sm text-slate-600">
            Are you sure you want to create a new SPC baseline?
          </p>

          {payload && (
            <div className="mt-4 bg-slate-50 rounded-lg p-4 text-left text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500">Reason:</span>
                <span className="font-medium text-slate-700">
                  {payload.reason}
                </span>
                <span className="text-slate-500">CL:</span>
                <span className="font-medium text-slate-700">
                  {payload.centerLine.toFixed(4)}
                </span>
                {payload.controlMode === "manual" && (
                  <>
                    <span className="text-slate-500">UCL:</span>
                    <span className="font-medium text-amber-700">
                      {payload.ucl.toFixed(4)}
                    </span>
                    <span className="text-slate-500">LCL:</span>
                    <span className="font-medium text-amber-700">
                      {payload.lcl.toFixed(4)}
                    </span>
                  </>
                )}
                <span className="text-slate-500">Effective:</span>
                <span className="font-medium text-slate-700">
                  {payload.effectiveFrom}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-sm font-medium text-white hover:bg-green-700 transition flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add this to the ControlChart component or where the chart is rendered
// Add state variables:
const [showBaselineDialog, setShowBaselineDialog] = useState(false);
const [showBaselineConfirm, setShowBaselineConfirm] = useState(false);
const [baselinePayload, setBaselinePayload] = useState(null);
const [creatingBaseline, setCreatingBaseline] = useState(false);

// Add the "Create New Baseline" button in the chart header
// Inside the ControlChart component, after the title and chart type selector
<div className="flex flex-wrap items-center justify-between gap-2">
  <div className="min-w-0">
    <h4 className="text-base font-bold text-slate-800 truncate">
      {title}
    </h4>
    <p className="text-xs text-slate-500">
      {isIMR ? "I-MR Chart (X-MR)" : "X-bar R Chart"} • n={subgroupSize} •
      Status:{" "}
      <span
        className={`font-semibold ${
          statusText === "Stable"
            ? "text-green-600"
            : statusText === "Unstable"
              ? "text-red-600"
              : "text-yellow-600"
        }`}
      >
        {statusText}
      </span>
    </p>
  </div>
  <div className="flex items-center gap-3">
    {/* Add the Create New Baseline button */}
    <button
      onClick={() => {
        setShowBaselineDialog(true);
      }}
      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
      title="Create new SPC baseline"
    >
      <TrendingUp className="h-3.5 w-3.5" />
      New Baseline
    </button>
    
    <div className="flex gap-3 text-xs">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
        {isIMR ? "Individual" : "X-bar"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span>
        {isIMR ? "Moving Range" : "Range"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
        OOC
      </span>
    </div>
    <button
      onClick={() => setShowFullScreen(!showFullScreen)}
      className="p-1.5 rounded-lg hover:bg-slate-100 transition"
      title={showFullScreen ? "Exit Full Screen" : "Full Screen"}
    >
      {showFullScreen ? (
        <Minimize2 className="h-4 w-4 text-slate-500" />
      ) : (
        <Maximize2 className="h-4 w-4 text-slate-500" />
      )}
    </button>
  </div>
</div>

// Add the baseline dialog and confirmation dialog at the end of the component
{/* Baseline Creation Dialog */}
<BaselineCreationDialog
  isOpen={showBaselineDialog}
  onClose={() => {
    setShowBaselineDialog(false);
    setBaselinePayload(null);
  }}
  onConfirm={(payload) => {
    setBaselinePayload(payload);
    setShowBaselineDialog(false);
    setShowBaselineConfirm(true);
  }}
  checkpoint={selectedCheckpoint}
  currentCL={chart?.xbarCenterLine || chart?.individualCenter}
  currentUCL={chart?.xbarUcl || chart?.individualUcl}
  currentLCL={chart?.xbarLcl || chart?.individualLcl}
  loading={creatingBaseline}
/>

{/* Baseline Confirmation Dialog */}
<BaselineConfirmationDialog
  isOpen={showBaselineConfirm}
  onClose={() => {
    setShowBaselineConfirm(false);
    setBaselinePayload(null);
  }}
  onConfirm={async () => {
    if (!baselinePayload || !selectedCheckpoint) return;
    
    setCreatingBaseline(true);
    try {
      const response = await axios.post(
        `${API_URL}/qc-inspection/spc/baseline`,
        {
          checkpointId: selectedCheckpoint.checkpointId,
          inspectionId: selectedCheckpoint.inspections?.[0]?.inspectionId,
          ...baselinePayload,
        },
        { withCredentials: true }
      );
      
      if (response.data?.success) {
        toast.success("New SPC baseline created successfully");
        setShowBaselineConfirm(false);
        setBaselinePayload(null);
        
        // Refresh the chart data
        if (selectedCheckpoint) {
          fetchControlChart(selectedCheckpoint);
        }
      } else {
        throw new Error(response.data?.message || "Failed to create baseline");
      }
    } catch (error) {
      console.error("Failed to create baseline:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to create baseline");
    } finally {
      setCreatingBaseline(false);
    }
  }}
  payload={baselinePayload}
  loading={creatingBaseline}
/>