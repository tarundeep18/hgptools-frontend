// CheckpointModal.jsx - Full Custom Tolerance Support
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Info } from "lucide-react";
import toast from "react-hot-toast";

const EMPTY_CHECKPOINT = {
  // A. Inspection Method
  inspectionMethod: "dimensional",

  // B. Result Recording Type
  resultType: "numeric",

  // Common fields
  name: "",
  drawingBalloonNumber: "",
  unit: "",
  decimalPrecision: 3,
  piecesPerInspection: 1,
  readingsPerPiece: 1,
  inspectionFrequency: "",
  frequencyType: "time",
  frequencyValue: 1,
  frequencyUnit: "hour",
  allowNA: false,
  naApprovalRequired: false,
  measurementPosition: "",
  mandatoryPhoto: false,
  criticality: "standard",
  reactionPlan: "",

  // Numeric measurement fields
  nominalValue: "",
  toleranceType: "bilateral",
  lowerTolerance: "",
  upperTolerance: "",
  lsl: "",
  usl: "",

  // Custom tolerance fields
  customToleranceEnabled: false,
  customToleranceType: "fixed", // "fixed", "percentage", "formula"
  customToleranceValue: "",
  customTolerancePercentage: 5,
  customToleranceFormula: "",
  customToleranceUnit: "",
  customToleranceCalculated: "",

  // Instrument requirements
  instrumentType: "",
  minimumResolution: "",
  calibrationRequired: false,
  measurementMethod: "",
  calibrationInterval: "",
  msaStatus: "",

  // Go/No-Go fields
  gaugeType: "",
  gaugeSpecification: "",
  threadFeatureSpec: "",
  goCondition: "",
  noGoCondition: "",
  gaugeIdRequired: false,
  mandatoryPhotoOnFailure: false,

  // Visual inspection fields
  inspectionArea: "",
  acceptanceStandard: "",
  referenceImages: [],
  defectCatalogue: "",
  allowedDefectCount: 0,
  allowedDefectivePieces: 0,
  severityRules: "",

  // Hardness inspection fields
  hardnessScale: "",
  minimumHardness: "",
  maximumHardness: "",
  testLoad: "",
  testMethod: "",
  testLocation: "",
  testerType: "",
  indentationsPerPiece: 1,

  // SPC fields
  recommendedSPCMethod: "",
  overrideSPCMethod: "",
  sampleSize: 1,
  subgroupSize: 1,
  sampleSizeMode: "constant",
  opportunityMode: "constant",
  opportunityUnit: "piece",
  opportunitiesPerUnit: 1,
  categoricalOptions: [],
  rejectCategories: ["Major", "Critical"],
  instrumentEntryMandatory: false,
};

const CheckpointModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isEditing,
}) => {
  const [formData, setFormData] = useState(() => ({ ...EMPTY_CHECKPOINT }));
  const [showAdvancedSPC, setShowAdvancedSPC] = useState(false);
  const [showCustomTolerance, setShowCustomTolerance] = useState(false);

  const allowedResultTypes = {
    dimensional: ["numeric"],
    roughness: ["numeric"],
    hardness: ["numeric"],
    go_nogo: ["binary"],
    visual: ["binary", "defective_count", "defect_count", "categorical"],
    functional: ["numeric", "binary", "categorical"],
    coating: ["numeric", "binary", "defect_count", "categorical"],
    certificate: ["binary", "approval"],
    approval: ["approval"],
  };

  const toFiniteNumberOrNull = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const normalizeSPCMethod = (
    value,
    piecesPerInspection = 1,
    resultType = "numeric",
  ) => {
    const token = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/x̄/g, "xbar")
      .replace(/[^a-z0-9]+/g, "");

    if (!token) {
      if (resultType === "numeric") {
        return Number(piecesPerInspection) === 1 ? "I-MR" : "X-bar R";
      }
      if (["binary", "defective_count"].includes(resultType)) return "NP";
      if (resultType === "defect_count") return "C";
      if (resultType === "categorical") return "Attribute Analysis";
      return "No SPC";
    }

    if (
      token.includes("imr") ||
      token.includes("xmr") ||
      token.includes("individualmovingrange")
    ) {
      return "I-MR";
    }
    if (token.includes("xbars") || token.includes("xbarstandarddeviation")) {
      return "X-bar S";
    }
    if (
      token.includes("xbarr") ||
      token.includes("xbarrange") ||
      (token.includes("xbar") && token.includes("r"))
    ) {
      return "X-bar R";
    }
    if (["p", "pchart"].includes(token)) return "P";
    if (["np", "npchart"].includes(token)) return "NP";
    if (["c", "cchart"].includes(token)) return "C";
    if (["u", "uchart"].includes(token)) return "U";
    if (["attributeanalysis", "attribute"].includes(token)) {
      return "Attribute Analysis";
    }
    if (["nospc", "none", "disabled", "off"].includes(token)) {
      return "No SPC";
    }

    return String(value || "").trim();
  };

  const getRecommendedSPCMethod = (data) => {
    const pieces = Number(data.piecesPerInspection);

    switch (data.resultType) {
      case "numeric":
        return Number.isInteger(pieces) && pieces > 1 ? "X-bar R" : "I-MR";
      case "binary":
      case "defective_count":
        return data.sampleSizeMode === "variable" ? "P" : "NP";
      case "defect_count":
        return data.opportunityMode === "variable" ? "U" : "C";
      case "categorical":
        return "Attribute Analysis";
      case "approval":
      default:
        return "No SPC";
    }
  };

  const getAllowedSPCMethods = (resultType) => {
    switch (resultType) {
      case "numeric":
        return ["I-MR", "X-bar R", "No SPC"];
      case "binary":
      case "defective_count":
        return ["P", "NP", "No SPC"];
      case "defect_count":
        return ["C", "U", "No SPC"];
      case "categorical":
        return ["Attribute Analysis", "No SPC"];
      case "approval":
      default:
        return ["No SPC"];
    }
  };

  const getSPCOverrideOptions = (resultType) => {
    const labels = {
      "I-MR": "I-MR (Individual–Moving Range)",
      "X-bar R": "X-bar R",
      P: "P Chart",
      NP: "NP Chart",
      C: "C Chart",
      U: "U Chart",
      "Attribute Analysis": "Attribute Analysis",
      "No SPC": "No SPC",
    };

    return getAllowedSPCMethods(resultType).map((value) => ({
      value,
      label: labels[value] || value,
    }));
  };

  // Calculate custom tolerance value
  const calculateCustomTolerance = (data) => {
    const nominal = toFiniteNumberOrNull(data.nominalValue);
    if (nominal === null) return null;

    if (!data.customToleranceEnabled) return null;

    switch (data.customToleranceType) {
      case "fixed": {
        const value = toFiniteNumberOrNull(data.customToleranceValue);
        return value !== null ? Math.abs(value) : null;
      }
      case "percentage": {
        const percentage = Number(data.customTolerancePercentage) || 0;
        return (nominal * percentage) / 100;
      }
      case "formula": {
        try {
          // Create a safe evaluation environment
          const formula = data.customToleranceFormula
            .replace(/nominal/g, `(${nominal})`)
            .replace(/π/g, Math.PI)
            .replace(/sqrt/g, "Math.sqrt")
            .replace(/pow/g, "Math.pow")
            .replace(/abs/g, "Math.abs")
            .replace(/floor/g, "Math.floor")
            .replace(/ceil/g, "Math.ceil")
            .replace(/round/g, "Math.round");

          // Validate formula contains only safe characters
          const safeFormula = formula.replace(/[^0-9+\-*/().Math\s]/g, "");
          const result = Function(`"use strict"; return (${safeFormula})`)();
          return Number.isFinite(result) ? Math.abs(result) : null;
        } catch (e) {
          return null;
        }
      }
      default:
        return null;
    }
  };

  const createToleranceDisplay = (data) => {
    const nominal = toFiniteNumberOrNull(data.nominalValue);
    const lower = toFiniteNumberOrNull(data.lowerTolerance);
    const upper = toFiniteNumberOrNull(data.upperTolerance);
    const lsl = toFiniteNumberOrNull(data.lsl);
    const usl = toFiniteNumberOrNull(data.usl);

    // If custom tolerance is enabled, display it
    if (data.customToleranceEnabled) {
      const tolerance = calculateCustomTolerance(data);
      if (tolerance !== null && nominal !== null) {
        const unit = data.customToleranceUnit || data.unit || "";
        return `±${tolerance}${unit ? " " + unit : ""}`;
      }
    }

    switch (data.toleranceType) {
      case "bilateral":
        return lower !== null &&
          upper !== null &&
          Math.abs(lower) === Math.abs(upper)
          ? `±${Math.abs(upper)}`
          : `${upper >= 0 ? "+" : ""}${upper ?? ""}/${lower ?? ""}`;
      case "unilateral_plus":
      case "unilateral_minus":
        return `${upper >= 0 ? "+" : ""}${upper ?? 0}/${lower ?? 0}`;
      case "limits":
        return lsl !== null && usl !== null ? `${lsl}–${usl}` : "";
      case "min_only":
        return lsl !== null ? `≥${lsl}` : "";
      case "max_only":
        return usl !== null ? `≤${usl}` : "";
      case "informational":
        return "Informational";
      default:
        return nominal !== null ? String(nominal) : "";
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!initialData) {
      setFormData({ ...EMPTY_CHECKPOINT });
      setShowAdvancedSPC(false);
      setShowCustomTolerance(false);
      return;
    }

    const specification = initialData.specification || {};
    const sampling = initialData.sampling || {};
    const frequency = sampling.frequency || initialData.frequency || {};
    const instrumentRequirements = initialData.instrumentRequirements || {};
    const customTolerance = initialData.customTolerance || {};

    const initialPieces = Math.max(
      1,
      Number(
        initialData.piecesPerInspection ??
          sampling.piecesPerInspection ??
          initialData.sampleSize ??
          1,
      ) || 1,
    );
    const initialResultType =
      initialData.resultType || EMPTY_CHECKPOINT.resultType;
    const initialRecommendedSPCMethod = getRecommendedSPCMethod({
      ...initialData,
      resultType: initialResultType,
      piecesPerInspection: initialPieces,
      sampleSizeMode: initialData.sampleSizeMode ?? "constant",
      opportunityMode: initialData.opportunityMode ?? "constant",
    });
    const storedSPCMethod = normalizeSPCMethod(
      initialData.overrideSPCMethod ??
        initialData.selectedSPCMethod ??
        initialData.controlChartType ??
        initialData.recommendedSPCMethod,
      initialPieces,
      initialResultType,
    );
    const initialOverrideSPCMethod =
      storedSPCMethod &&
      storedSPCMethod !== "X-bar S" &&
      storedSPCMethod !== initialRecommendedSPCMethod &&
      getAllowedSPCMethods(initialResultType).includes(storedSPCMethod)
        ? storedSPCMethod
        : "";

    const customToleranceEnabled =
      customTolerance.enabled ?? initialData.customToleranceEnabled ?? false;
    const customToleranceType =
      customTolerance.type ?? initialData.customToleranceType ?? "fixed";

    setFormData({
      ...EMPTY_CHECKPOINT,
      ...initialData,
      nominalValue:
        initialData.nominalValue ??
        specification.nominal ??
        initialData.expectedValue ??
        "",
      toleranceType:
        initialData.toleranceType ?? specification.toleranceType ?? "bilateral",
      lowerTolerance:
        initialData.lowerTolerance ?? specification.lowerTolerance ?? "",
      upperTolerance:
        initialData.upperTolerance ?? specification.upperTolerance ?? "",
      lsl:
        initialData.lsl ??
        specification.lsl ??
        initialData.lowerSpecLimit ??
        "",
      usl:
        initialData.usl ??
        specification.usl ??
        initialData.upperSpecLimit ??
        "",
      unit: initialData.unit ?? specification.unit ?? "",
      decimalPrecision:
        initialData.decimalPrecision ?? specification.decimalPrecision ?? 3,
      piecesPerInspection:
        initialData.piecesPerInspection ??
        sampling.piecesPerInspection ??
        initialData.sampleSize ??
        1,
      readingsPerPiece:
        initialData.readingsPerPiece ?? sampling.readingsPerPiece ?? 1,
      subgroupSize:
        initialData.subgroupSize ??
        sampling.subgroupSize ??
        initialData.piecesPerInspection ??
        initialData.sampleSize ??
        1,
      frequencyType:
        initialData.frequencyType ?? frequency.triggerType ?? "time",
      frequencyValue:
        initialData.frequencyValue ?? frequency.intervalValue ?? 1,
      frequencyUnit:
        initialData.frequencyUnit ?? frequency.intervalUnit ?? "hour",
      instrumentType:
        initialData.instrumentType ??
        instrumentRequirements.instrumentType ??
        "",
      minimumResolution:
        initialData.minimumResolution ??
        instrumentRequirements.minimumResolution ??
        "",
      calibrationRequired:
        initialData.calibrationRequired ??
        instrumentRequirements.calibrationRequired ??
        false,
      gaugeIdRequired:
        initialData.gaugeIdRequired ??
        instrumentRequirements.gaugeIdRequired ??
        false,
      msaStatus:
        initialData.msaStatus ?? instrumentRequirements.msaStatus ?? "",
      instrumentEntryMandatory:
        initialData.instrumentEntryMandatory ??
        instrumentRequirements.instrumentEntryMandatory ??
        false,
      inspectionArea: initialData.inspectionArea ?? "",
      acceptanceStandard: initialData.acceptanceStandard ?? "",
      allowedDefectivePieces: initialData.allowedDefectivePieces ?? 0,
      allowedDefectCount: initialData.allowedDefectCount ?? 0,
      severityRules: initialData.severityRules ?? "",
      categoricalOptions: initialData.categoricalOptions ?? [],
      rejectCategories: initialData.rejectCategories ?? ["Major", "Critical"],
      gaugeType: initialData.gaugeType ?? "",
      gaugeSpecification: initialData.gaugeSpecification ?? "",
      goCondition: initialData.goCondition ?? "",
      noGoCondition: initialData.noGoCondition ?? "",
      mandatoryPhotoOnFailure: initialData.mandatoryPhotoOnFailure ?? false,
      hardnessScale: initialData.hardnessScale ?? "",
      minimumHardness: initialData.minimumHardness ?? "",
      maximumHardness: initialData.maximumHardness ?? "",
      indentationsPerPiece: initialData.indentationsPerPiece ?? 1,
      recommendedSPCMethod: initialRecommendedSPCMethod,
      overrideSPCMethod: initialOverrideSPCMethod,
      sampleSizeMode: initialData.sampleSizeMode ?? "constant",
      opportunityMode: initialData.opportunityMode ?? "constant",
      opportunitiesPerUnit: initialData.opportunitiesPerUnit ?? 1,
      criticality: initialData.criticality ?? "standard",
      allowNA: initialData.allowNA ?? false,
      mandatoryPhoto: initialData.mandatoryPhoto ?? false,
      reactionPlan: initialData.reactionPlan ?? "",
      drawingBalloonNumber: initialData.drawingBalloonNumber ?? "",
      measurementPosition: initialData.measurementPosition ?? "",
      measurementMethod: initialData.measurementMethod ?? "",
      calibrationInterval: initialData.calibrationInterval ?? "",
      testerType: initialData.testerType ?? "",
      testLocation: initialData.testLocation ?? "",
      testMethod: initialData.testMethod ?? "",
      testLoad: initialData.testLoad ?? "",
      threadFeatureSpec: initialData.threadFeatureSpec ?? "",
      referenceImages: initialData.referenceImages ?? [],
      defectCatalogue: initialData.defectCatalogue ?? "",
      naApprovalRequired: initialData.naApprovalRequired ?? false,
      opportunityUnit: initialData.opportunityUnit ?? "piece",
      // Custom tolerance fields
      customToleranceEnabled: customToleranceEnabled,
      customToleranceType: customToleranceType,
      customToleranceValue:
        customTolerance.value ?? initialData.customToleranceValue ?? "",
      customTolerancePercentage:
        customTolerance.percentage ??
        initialData.customTolerancePercentage ??
        5,
      customToleranceFormula:
        customTolerance.formula ?? initialData.customToleranceFormula ?? "",
      customToleranceUnit:
        customTolerance.unit ?? initialData.customToleranceUnit ?? "",
      customToleranceCalculated: "",
    });

    setShowAdvancedSPC(Boolean(initialOverrideSPCMethod));
    setShowCustomTolerance(customToleranceEnabled);
  }, [initialData, isOpen]);

  // Keep the selected result type valid for the chosen inspection method.
  useEffect(() => {
    const allowed = allowedResultTypes[formData.inspectionMethod] || ["binary"];
    if (!allowed.includes(formData.resultType)) {
      setFormData((previous) => ({ ...previous, resultType: allowed[0] }));
    }
  }, [formData.inspectionMethod]);

  // A Go/No-Go gauge produces exactly one binary decision per sampled piece.
  // Keep numerical-only fields normalized internally even though they are not
  // shown in the Go/No-Go UI.
  useEffect(() => {
    if (formData.inspectionMethod !== "go_nogo") return;

    setFormData((previous) => {
      const pieces = Math.max(
        2,
        Number.isInteger(Number(previous.piecesPerInspection))
          ? Number(previous.piecesPerInspection)
          : 50,
      );
      const recommendedSPCMethod =
        previous.sampleSizeMode === "variable" ? "P" : "NP";

      if (
        previous.resultType === "binary" &&
        Number(previous.readingsPerPiece) === 1 &&
        Number(previous.piecesPerInspection) === pieces &&
        Number(previous.sampleSize) === pieces &&
        Number(previous.subgroupSize) === pieces &&
        previous.recommendedSPCMethod === recommendedSPCMethod &&
        previous.overrideSPCMethod === "" &&
        previous.measurementPosition === ""
      ) {
        return previous;
      }

      return {
        ...previous,
        resultType: "binary",
        readingsPerPiece: 1,
        piecesPerInspection: pieces,
        sampleSize: pieces,
        subgroupSize: pieces,
        recommendedSPCMethod,
        overrideSPCMethod: "",
        measurementPosition: "",
        customToleranceEnabled: false,
        lsl: "",
        usl: "",
      };
    });
  }, [formData.inspectionMethod, formData.sampleSizeMode]);

  // Auto-calculate specification limits with custom tolerance support
  useEffect(() => {
    if (formData.resultType !== "numeric") {
      if (formData.lsl !== "" || formData.usl !== "") {
        setFormData((previous) => ({ ...previous, lsl: "", usl: "" }));
      }
      return;
    }

    const nominal = toFiniteNumberOrNull(formData.nominalValue);
    const lower = toFiniteNumberOrNull(formData.lowerTolerance);
    const upper = toFiniteNumberOrNull(formData.upperTolerance);
    const precision = Number.isInteger(Number(formData.decimalPrecision))
      ? Number(formData.decimalPrecision)
      : 3;

    let nextLsl = "";
    let nextUsl = "";

    // Check if custom tolerance is enabled and calculate
    if (formData.customToleranceEnabled) {
      const customTolerance = calculateCustomTolerance(formData);
      if (customTolerance !== null && nominal !== null) {
        nextLsl = (nominal - customTolerance).toFixed(precision);
        nextUsl = (nominal + customTolerance).toFixed(precision);

        // Update the calculated tolerance display
        const unit = formData.customToleranceUnit || formData.unit || "";
        const displayValue = `±${customTolerance.toFixed(precision)}${unit ? " " + unit : ""}`;
        setFormData((prev) => ({
          ...prev,
          customToleranceCalculated: displayValue,
        }));

        setFormData((previous) => ({
          ...previous,
          lsl: nextLsl,
          usl: nextUsl,
        }));
        return;
      }
    }

    // Standard tolerance calculation
    switch (formData.toleranceType) {
      case "bilateral":
      case "unilateral_plus":
      case "unilateral_minus":
        if (nominal !== null && lower !== null)
          nextLsl = (nominal + lower).toFixed(precision);
        if (nominal !== null && upper !== null)
          nextUsl = (nominal + upper).toFixed(precision);
        break;
      case "limits":
        if (lower !== null) nextLsl = lower.toFixed(precision);
        if (upper !== null) nextUsl = upper.toFixed(precision);
        break;
      case "min_only":
        if (lower !== null) nextLsl = lower.toFixed(precision);
        break;
      case "max_only":
        if (upper !== null) nextUsl = upper.toFixed(precision);
        break;
      case "informational":
      default:
        break;
    }

    setFormData((previous) => ({
      ...previous,
      lsl: nextLsl,
      usl: nextUsl,
      customToleranceCalculated: "",
    }));
  }, [
    formData.resultType,
    formData.nominalValue,
    formData.lowerTolerance,
    formData.upperTolerance,
    formData.toleranceType,
    formData.decimalPrecision,
    formData.customToleranceEnabled,
    formData.customToleranceType,
    formData.customToleranceValue,
    formData.customTolerancePercentage,
    formData.customToleranceFormula,
    formData.customToleranceUnit,
  ]);

  // Hardness specifications use the selected scale as the unit and min/max as limits.
  useEffect(() => {
    if (formData.inspectionMethod !== "hardness") return;

    const minimum = toFiniteNumberOrNull(formData.minimumHardness);
    const maximum = toFiniteNumberOrNull(formData.maximumHardness);
    const midpoint =
      minimum !== null && maximum !== null
        ? (minimum + maximum) / 2
        : (minimum ?? maximum ?? "");

    setFormData((previous) => ({
      ...previous,
      resultType: "numeric",
      unit: previous.hardnessScale || previous.unit,
      toleranceType: "limits",
      lowerTolerance: minimum ?? "",
      upperTolerance: maximum ?? "",
      nominalValue: midpoint,
      readingsPerPiece: Math.max(1, Number(previous.indentationsPerPiece) || 1),
      customToleranceEnabled: false, // Disable custom tolerance for hardness
    }));
  }, [
    formData.inspectionMethod,
    formData.hardnessScale,
    formData.minimumHardness,
    formData.maximumHardness,
    formData.indentationsPerPiece,
  ]);

  // Keep chart recommendation and sampling fields synchronized.
  useEffect(() => {
    setFormData((previous) => {
      let pieces = Number(previous.piecesPerInspection);
      if (!Number.isInteger(pieces) || pieces < 1) pieces = 1;

      const normalizedOverride = previous.overrideSPCMethod
        ? normalizeSPCMethod(
            previous.overrideSPCMethod,
            pieces,
            previous.resultType,
          )
        : "";
      const allowedMethods = getAllowedSPCMethods(previous.resultType);
      const overrideSPCMethod =
        previous.inspectionMethod === "go_nogo"
          ? ""
          : allowedMethods.includes(normalizedOverride)
            ? normalizedOverride
            : "";

      if (previous.resultType === "numeric") {
        if (overrideSPCMethod === "I-MR") pieces = 1;
        if (overrideSPCMethod === "X-bar R") {
          pieces = Math.min(25, Math.max(2, pieces));
        } else {
          pieces = Math.min(25, pieces);
        }
      }
      if (previous.inspectionMethod === "go_nogo") {
        pieces = Math.max(2, pieces);
      }

      const recommendedSPCMethod = getRecommendedSPCMethod({
        ...previous,
        piecesPerInspection: pieces,
      });
      const selectedSPCMethod = normalizeSPCMethod(
        overrideSPCMethod || recommendedSPCMethod,
        pieces,
        previous.resultType,
      );
      const subgroupSize =
        previous.resultType === "numeric" && selectedSPCMethod === "I-MR"
          ? 1
          : pieces;

      if (
        Number(previous.piecesPerInspection) === pieces &&
        Number(previous.sampleSize) === pieces &&
        Number(previous.subgroupSize) === subgroupSize &&
        previous.recommendedSPCMethod === recommendedSPCMethod &&
        previous.overrideSPCMethod === overrideSPCMethod
      ) {
        return previous;
      }

      return {
        ...previous,
        piecesPerInspection: pieces,
        sampleSize: pieces,
        subgroupSize,
        recommendedSPCMethod,
        overrideSPCMethod,
      };
    });
  }, [
    formData.resultType,
    formData.overrideSPCMethod,
    formData.piecesPerInspection,
    formData.sampleSizeMode,
    formData.opportunityMode,
    formData.inspectionMethod,
  ]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInspectionMethodChange = (inspectionMethod) => {
    setFormData((previous) => {
      const next = { ...previous, inspectionMethod };
      if (inspectionMethod !== "go_nogo") return next;

      const pieces =
        previous.inspectionMethod === "go_nogo"
          ? Math.max(2, Number(previous.piecesPerInspection) || 2)
          : 50;
      return {
        ...next,
        resultType: "binary",
        piecesPerInspection: pieces,
        readingsPerPiece: 1,
        sampleSize: pieces,
        subgroupSize: pieces,
        sampleSizeMode: "constant",
        recommendedSPCMethod: "NP",
        overrideSPCMethod: "",
        allowedDefectivePieces: 0,
        calibrationRequired: true,
        gaugeIdRequired: true,
        instrumentEntryMandatory: true,
        measurementPosition: "",
        goCondition:
          previous.goCondition || "GO must enter without excessive force",
        noGoCondition: previous.noGoCondition || "NO-GO must not enter",
      };
    });
    setShowAdvancedSPC(false);
  };

  const getFrequencyDisplay = (data) => {
    switch (data.frequencyType) {
      case "time":
        return `Every ${data.frequencyValue || 1} ${data.frequencyUnit || "hour"}(s)`;
      case "pieces":
        return `Every ${data.frequencyValue || 1} piece(s)`;
      case "batch":
        return "Every batch";
      case "first_piece":
        return "First-off inspection";
      case "last_piece":
        return "Last-off inspection";
      case "setup_change":
        return "After setup change";
      case "tool_change":
        return "After tool change";
      default:
        return data.inspectionFrequency || "";
    }
  };

  const handleSubmit = () => {
    const allowed = allowedResultTypes[formData.inspectionMethod] || [];
    const lsl = toFiniteNumberOrNull(formData.lsl);
    const usl = toFiniteNumberOrNull(formData.usl);
    const nominal = toFiniteNumberOrNull(formData.nominalValue);

    const parsePositiveInteger = (value, label) => {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 1) {
        toast.error(`${label} must be a positive whole number`);
        return null;
      }
      return parsed;
    };

    if (!formData.name.trim()) {
      toast.error("Please enter a checkpoint name");
      return;
    }
    if (!allowed.includes(formData.resultType)) {
      toast.error(
        "The selected result type is not valid for this inspection method",
      );
      return;
    }

    const piecesPerInspection = parsePositiveInteger(
      formData.piecesPerInspection,
      "Pieces per inspection",
    );
    const readingsPerPiece =
      formData.inspectionMethod === "go_nogo"
        ? 1
        : parsePositiveInteger(formData.readingsPerPiece, "Readings per piece");
    if (piecesPerInspection === null || readingsPerPiece === null) return;
    if (formData.inspectionMethod === "go_nogo" && piecesPerInspection < 2) {
      toast.error(
        "Go/No-Go P/NP inspection requires at least 2 sampled pieces",
      );
      return;
    }

    const recommendedSPCMethod = getRecommendedSPCMethod({
      ...formData,
      piecesPerInspection,
    });
    const overrideSPCMethod =
      formData.inspectionMethod === "go_nogo"
        ? ""
        : formData.overrideSPCMethod
          ? normalizeSPCMethod(
              formData.overrideSPCMethod,
              piecesPerInspection,
              formData.resultType,
            )
          : "";
    const selectedSPCMethod = normalizeSPCMethod(
      overrideSPCMethod || recommendedSPCMethod,
      piecesPerInspection,
      formData.resultType,
    );
    const allowedSPCMethods = getAllowedSPCMethods(formData.resultType);

    if (selectedSPCMethod === "X-bar S") {
      toast.error(
        "X-bar S is not supported by the current backend. Select I-MR or X-bar R.",
      );
      return;
    }
    if (!allowedSPCMethods.includes(selectedSPCMethod)) {
      toast.error(
        `${selectedSPCMethod || "Selected SPC method"} is not valid for ${formData.resultType} data`,
      );
      return;
    }

    let effectiveSubgroupSize = piecesPerInspection;
    if (formData.resultType === "numeric") {
      // Validate custom tolerance if enabled
      if (formData.customToleranceEnabled) {
        const customTolerance = calculateCustomTolerance(formData);
        if (customTolerance === null) {
          toast.error(
            "Invalid custom tolerance configuration. Please check your inputs.",
          );
          return;
        }
        if (customTolerance < 0) {
          toast.error("Tolerance cannot be negative.");
          return;
        }
      }

      if (selectedSPCMethod === "I-MR") {
        if (piecesPerInspection !== 1) {
          toast.error(
            "I-MR requires exactly 1 piece per inspection and subgroup size 1",
          );
          return;
        }
        effectiveSubgroupSize = 1;
      }

      if (selectedSPCMethod === "X-bar R") {
        if (piecesPerInspection < 2 || piecesPerInspection > 25) {
          toast.error("X-bar R requires 2 to 25 pieces per subgroup");
          return;
        }
        effectiveSubgroupSize = piecesPerInspection;
      }

      if (!formData.unit.trim()) {
        toast.error("Please enter a unit for the numeric result");
        return;
      }

      // Only validate nominal if custom tolerance is not enabled or if standard tolerance is used
      if (!formData.customToleranceEnabled) {
        if (
          formData.toleranceType !== "informational" &&
          nominal === null &&
          !["limits", "min_only", "max_only"].includes(formData.toleranceType)
        ) {
          toast.error("Please enter a valid nominal value");
          return;
        }
        if (
          formData.toleranceType !== "informational" &&
          lsl === null &&
          usl === null
        ) {
          toast.error("Please define at least one numeric specification limit");
          return;
        }
        if (lsl !== null && usl !== null && lsl >= usl) {
          toast.error("LSL must be lower than USL");
          return;
        }
      } else {
        // With custom tolerance, nominal is required
        if (nominal === null) {
          toast.error(
            "Please enter a valid nominal value for custom tolerance",
          );
          return;
        }
      }
    }

    if (formData.inspectionMethod === "go_nogo") {
      if (!formData.gaugeType || !formData.gaugeSpecification) {
        toast.error("Please select the gauge type and enter its specification");
        return;
      }
      if (!formData.goCondition.trim() || !formData.noGoCondition.trim()) {
        toast.error("Please define both GO and NO-GO acceptance conditions");
        return;
      }
      if (
        String(formData.gaugeType).toLowerCase().includes("thread") &&
        !formData.threadFeatureSpec.trim()
      ) {
        toast.error("Please enter the thread class or feature specification");
        return;
      }
      const allowedDefectivePieces = Number(formData.allowedDefectivePieces);
      if (
        !Number.isInteger(allowedDefectivePieces) ||
        allowedDefectivePieces < 0 ||
        allowedDefectivePieces > piecesPerInspection
      ) {
        toast.error(
          `Allowed defective pieces must be a whole number from 0 to ${piecesPerInspection}`,
        );
        return;
      }
    }
    if (
      formData.inspectionMethod === "visual" &&
      (!formData.inspectionArea || !formData.acceptanceStandard)
    ) {
      toast.error("Please enter inspection area and acceptance standard");
      return;
    }
    if (
      formData.inspectionMethod === "hardness" &&
      (!formData.hardnessScale ||
        toFiniteNumberOrNull(formData.minimumHardness) === null ||
        toFiniteNumberOrNull(formData.maximumHardness) === null)
    ) {
      toast.error("Please enter hardness scale, minimum and maximum hardness");
      return;
    }
    if (
      ["functional", "certificate", "approval"].includes(
        formData.inspectionMethod,
      ) &&
      !formData.acceptanceStandard.trim()
    ) {
      toast.error("Please enter the acceptance or verification criteria");
      return;
    }

    const frequencyValue = parsePositiveInteger(
      formData.frequencyValue,
      "Frequency interval",
    );
    if (frequencyValue === null) return;

    const opportunitiesPerUnit = parsePositiveInteger(
      formData.opportunitiesPerUnit,
      "Opportunities per unit",
    );
    if (opportunitiesPerUnit === null) return;

    // Calculate custom tolerance for saving
    let customToleranceValue = null;
    let customToleranceDisplay = "";
    if (formData.customToleranceEnabled) {
      customToleranceValue = calculateCustomTolerance(formData);
      if (customToleranceValue !== null) {
        const unit = formData.customToleranceUnit || formData.unit || "";
        customToleranceDisplay = `±${customToleranceValue}${unit ? " " + unit : ""}`;
      }
    }

    const normalized = {
      ...formData,
      id: formData.id || initialData?.id || `CP-${Date.now()}`,
      name: formData.name.trim(),
      nominalValue: nominal,
      lowerTolerance: toFiniteNumberOrNull(formData.lowerTolerance),
      upperTolerance: toFiniteNumberOrNull(formData.upperTolerance),
      lsl,
      usl,
      piecesPerInspection,
      readingsPerPiece,
      subgroupSize: effectiveSubgroupSize,
      sampleSize: piecesPerInspection,
      opportunitiesPerUnit,
      recommendedSPCMethod,
      overrideSPCMethod,
      selectedSPCMethod,
      resultType:
        formData.inspectionMethod === "go_nogo"
          ? "binary"
          : formData.resultType,
      specificationDisplay: createToleranceDisplay({ ...formData, lsl, usl }),
      inspectionFrequency: getFrequencyDisplay({
        ...formData,
        frequencyValue,
      }),
      frequency: {
        triggerType: formData.frequencyType,
        intervalValue: frequencyValue,
        intervalUnit: formData.frequencyUnit,
      },
      specification: {
        nominal,
        toleranceType: formData.toleranceType,
        lowerTolerance: toFiniteNumberOrNull(formData.lowerTolerance),
        upperTolerance: toFiniteNumberOrNull(formData.upperTolerance),
        lsl,
        usl,
        unit: formData.unit,
        decimalPrecision: Number(formData.decimalPrecision) || 3,
      },
      sampling: {
        piecesPerInspection,
        readingsPerPiece,
        subgroupSize: effectiveSubgroupSize,
        frequency: {
          triggerType: formData.frequencyType,
          intervalValue: frequencyValue,
          intervalUnit: formData.frequencyUnit,
        },
      },
      instrumentRequirements: {
        instrumentType: formData.instrumentType,
        minimumResolution: formData.minimumResolution,
        calibrationRequired: Boolean(formData.calibrationRequired),
        gaugeIdRequired: Boolean(formData.gaugeIdRequired),
        msaStatus: formData.msaStatus,
        instrumentEntryMandatory: Boolean(
          formData.instrumentEntryMandatory || formData.gaugeIdRequired,
        ),
      },
      categoricalOptions: (formData.categoricalOptions || []).filter(Boolean),
      rejectCategories: (formData.rejectCategories || []).filter(Boolean),
      type:
        formData.resultType === "numeric"
          ? "Measurement"
          : formData.inspectionMethod === "visual"
            ? "Visual"
            : formData.inspectionMethod === "approval"
              ? "Approval"
              : "Test",
      expectedValue: nominal ?? "",
      tolerance: createToleranceDisplay({ ...formData, lsl, usl }),
      lowerSpecLimit: lsl,
      upperSpecLimit: usl,
      controlChartType: selectedSPCMethod,
      // Custom tolerance data
      customTolerance: {
        enabled: formData.customToleranceEnabled,
        type: formData.customToleranceType,
        value: formData.customToleranceValue,
        percentage: formData.customTolerancePercentage,
        formula: formData.customToleranceFormula,
        unit: formData.customToleranceUnit,
        calculatedValue: customToleranceValue,
        display: customToleranceDisplay,
      },
      customToleranceEnabled: formData.customToleranceEnabled,
      customToleranceType: formData.customToleranceType,
      customToleranceValue: formData.customToleranceValue,
      customTolerancePercentage: formData.customTolerancePercentage,
      customToleranceFormula: formData.customToleranceFormula,
      customToleranceUnit: formData.customToleranceUnit,
      customToleranceCalculated: customToleranceDisplay,
    };

    onSave(normalized);
    onClose();
  };

  if (!isOpen) return null;

  const inspectionMethods = [
    { value: "dimensional", label: "📏 Dimensional Measurement" },
    { value: "go_nogo", label: "🔧 Go/No-Go Gauge" },
    { value: "visual", label: "👁️ Visual Inspection" },
    { value: "hardness", label: "🔨 Hardness Test" },
    { value: "coating", label: "🎨 Coating/Plating Test" },
    { value: "roughness", label: "📐 Surface Roughness Test" },
    { value: "functional", label: "⚡ Functional Test" },
    { value: "certificate", label: "📄 Certificate/Document Verification" },
    { value: "approval", label: "✅ Approval/Sign-Off" },
  ];

  const resultTypes = [
    { value: "numeric", label: "🔢 Enter a number" },
    { value: "binary", label: "✅ Select Pass or Fail" },
    { value: "defective_count", label: "📊 Enter rejected-piece count" },
    { value: "defect_count", label: "📋 Enter number of defects" },
    { value: "categorical", label: "🏷️ Select condition or grade" },
    { value: "approval", label: "✍️ Approval only" },
  ];

  const toleranceTypes = [
    { value: "bilateral", label: "Bilateral (e.g., ±0.1)" },
    { value: "unilateral_plus", label: "Unilateral Plus (e.g., +0.1/-0)" },
    { value: "unilateral_minus", label: "Unilateral Minus (e.g., +0/-0.1)" },
    { value: "limits", label: "Limit Values (e.g., 11.9–12.1)" },
    { value: "min_only", label: "Minimum Only (e.g., ≥12)" },
    { value: "max_only", label: "Maximum Only (e.g., ≤12)" },
    { value: "informational", label: "Informational — No Specification Limit" },
  ];

  const renderNumericFields = () => {
  const precision = Math.max(0, Number(formData.decimalPrecision) || 0);
  const unit = String(formData.unit || "").trim();
  const toleranceType = formData.toleranceType || "bilateral";

  const magnitude = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.abs(parsed) : "";
  };

  const setToleranceMagnitude = (field, rawValue, sign = 1) => {
    if (rawValue === "") {
      handleChange(field, "");
      return;
    }

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    handleChange(field, String(Math.abs(parsed) * sign));
  };

  const changeToleranceType = (nextType) => {
    setFormData((previous) => ({
      ...previous,
      toleranceType: nextType,
      lowerTolerance:
        nextType === "unilateral_plus" || nextType === "informational"
          ? nextType === "unilateral_plus"
            ? "0"
            : ""
          : previous.lowerTolerance,
      upperTolerance:
        nextType === "unilateral_minus" || nextType === "informational"
          ? nextType === "unilateral_minus"
            ? "0"
            : ""
          : previous.upperTolerance,
    }));
  };

  const hasLimit = (value) =>
    value !== "" &&
    value !== null &&
    value !== undefined &&
    Number.isFinite(Number(value));

  const formatLimit = (value) => {
    if (!hasLimit(value)) return "Not set";
    return `${Number(value).toFixed(precision)}${unit ? ` ${unit}` : ""}`;
  };

  const calculatedTolerancePreview = (() => {
    if (!formData.customToleranceEnabled || !formData.nominalValue) return "";
    try {
      const tolerance = calculateCustomTolerance(formData);
      if (tolerance === null || !Number.isFinite(Number(tolerance))) {
        return "Invalid calculation";
      }
      return `±${Number(tolerance).toFixed(precision)}${unit ? ` ${unit}` : ""}`;
    } catch {
      return "Invalid calculation";
    }
  })();

  return (
    <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <div>
        <h4 className="flex items-center gap-2 font-semibold text-blue-800">
          <span>📐 Dimension &amp; Accepted Range</span>
        </h4>
        <p className="mt-1 text-xs text-blue-700">
          Enter the requirement exactly as it appears on the drawing. The system
          calculates the accepted limits automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Target value shown on drawing
            <span className="text-red-500"> *</span>
          </label>
          <input
            type="number"
            step="any"
            value={formData.nominalValue}
            onChange={(event) =>
              handleChange("nominalValue", event.target.value)
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 12.000"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Measurement unit <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.unit}
            onChange={(event) => handleChange("unit", event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., mm, µm, degree"
          />
        </div>
      </div>

      {!formData.customToleranceEnabled ? (
        <div className="space-y-3 rounded-lg border border-blue-200 bg-white p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              How is the tolerance shown on the drawing?
              <span className="text-red-500"> *</span>
            </label>
            <select
              value={toleranceType}
              onChange={(event) => changeToleranceType(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="bilateral">Plus and minus tolerance</option>
              <option value="unilateral_plus">Plus tolerance only</option>
              <option value="unilateral_minus">Minus tolerance only</option>
              <option value="limits">Minimum and maximum values</option>
              <option value="min_only">Minimum value only</option>
              <option value="max_only">Maximum value only</option>
              <option value="informational">
                Reference dimension — no acceptance limits
              </option>
            </select>
          </div>

          {toleranceType === "bilateral" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Minus tolerance (−)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={magnitude(formData.lowerTolerance)}
                  onChange={(event) =>
                    setToleranceMagnitude(
                      "lowerTolerance",
                      event.target.value,
                      -1,
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 0.100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Plus tolerance (+)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={magnitude(formData.upperTolerance)}
                  onChange={(event) =>
                    setToleranceMagnitude(
                      "upperTolerance",
                      event.target.value,
                      1,
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 0.100"
                />
              </div>
            </div>
          )}

          {toleranceType === "unilateral_plus" && (
            <div className="max-w-md">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Allowed plus tolerance (+)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={magnitude(formData.upperTolerance)}
                onChange={(event) =>
                  setToleranceMagnitude("upperTolerance", event.target.value, 1)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 0.200"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                The minus tolerance is automatically set to zero.
              </p>
            </div>
          )}

          {toleranceType === "unilateral_minus" && (
            <div className="max-w-md">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Allowed minus tolerance (−)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={magnitude(formData.lowerTolerance)}
                onChange={(event) =>
                  setToleranceMagnitude(
                    "lowerTolerance",
                    event.target.value,
                    -1,
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 0.200"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                The plus tolerance is automatically set to zero.
              </p>
            </div>
          )}

          {["limits", "min_only", "max_only"].includes(toleranceType) && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {toleranceType !== "max_only" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Lowest accepted value
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lowerTolerance}
                    onChange={(event) =>
                      handleChange("lowerTolerance", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 11.900"
                  />
                </div>
              )}
              {toleranceType !== "min_only" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Highest accepted value
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.upperTolerance}
                    onChange={(event) =>
                      handleChange("upperTolerance", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 12.100"
                  />
                </div>
              )}
            </div>
          )}

          {toleranceType === "informational" && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              This checkpoint records a measurement for information only. It
              will not pass or fail against specification limits.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">
            Engineer-calculated tolerance is active
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Open Quality engineer settings below to review or disable the
            percentage/formula calculation.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          Accepted measurement range
        </p>
        {toleranceType === "informational" &&
        !formData.customToleranceEnabled ? (
          <p className="mt-1 text-sm font-semibold text-emerald-900">
            Reference only — no pass/fail range
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-md bg-white/80 p-2">
              <span className="block text-[10px] text-emerald-700">
                Lowest accepted value
              </span>
              <span className="font-mono text-sm font-semibold text-emerald-900">
                {formatLimit(formData.lsl)}
              </span>
            </div>
            <div className="rounded-md bg-white/80 p-2">
              <span className="block text-[10px] text-emerald-700">
                Highest accepted value
              </span>
              <span className="font-mono text-sm font-semibold text-emerald-900">
                {formatLimit(formData.usl)}
              </span>
            </div>
          </div>
        )}
        <p className="mt-2 text-[10px] text-emerald-700">
          These are specification limits from the drawing, not SPC control
          limits.
        </p>
      </div>

      <details
        className="rounded-lg border border-slate-200 bg-white p-3"
        defaultOpen={Boolean(formData.customToleranceEnabled)}
      >
        <summary className="cursor-pointer text-xs font-semibold text-slate-700">
          Quality engineer settings
        </summary>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Displayed decimal places
              </label>
              <select
                value={formData.decimalPrecision}
                onChange={(event) =>
                  handleChange(
                    "decimalPrecision",
                    Number.parseInt(event.target.value, 10),
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {[0, 1, 2, 3, 4].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Instrument type
              </label>
              <input
                type="text"
                value={formData.instrumentType}
                onChange={(event) =>
                  handleChange("instrumentType", event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Outside micrometer"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Required instrument resolution
              </label>
              <input
                type="text"
                value={formData.minimumResolution}
                onChange={(event) =>
                  handleChange("minimumResolution", event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 0.01 mm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Measurement instruction
              </label>
              <input
                type="text"
                value={formData.measurementMethod}
                onChange={(event) =>
                  handleChange("measurementMethod", event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Measure across the centre"
              />
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-amber-900">
              <input
                type="checkbox"
                checked={Boolean(formData.customToleranceEnabled)}
                onChange={(event) => {
                  const checked = event.target.checked;
                  handleChange("customToleranceEnabled", checked);
                  setShowCustomTolerance(checked);
                }}
                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              Use an engineer-calculated tolerance
            </label>
            <p className="mt-1 text-[10px] text-amber-700">
              Use this only when the tolerance is defined by a percentage or a
              controlled formula instead of directly on the drawing.
            </p>

            {formData.customToleranceEnabled && (
              <div className="mt-3 space-y-3 rounded-lg bg-white p-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Calculation method
                  </label>
                  <select
                    value={formData.customToleranceType}
                    onChange={(event) =>
                      handleChange("customToleranceType", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="fixed">Fixed ± value</option>
                    <option value="percentage">
                      Percentage of the target value
                    </option>
                    <option value="formula">Controlled formula</option>
                  </select>
                </div>

                {formData.customToleranceType === "fixed" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Fixed tolerance (±)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.customToleranceValue}
                      onChange={(event) =>
                        handleChange("customToleranceValue", event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g., 0.100"
                    />
                  </div>
                )}

                {formData.customToleranceType === "percentage" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Percentage of target value
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.customTolerancePercentage}
                      onChange={(event) =>
                        handleChange(
                          "customTolerancePercentage",
                          Number(event.target.value) || 0,
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g., 2"
                    />
                  </div>
                )}

                {formData.customToleranceType === "formula" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Controlled formula
                    </label>
                    <input
                      type="text"
                      value={formData.customToleranceFormula}
                      onChange={(event) =>
                        handleChange(
                          "customToleranceFormula",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g., nominal * 0.02 + 0.1"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      Only approved formulas should be accepted by the backend.
                    </p>
                  </div>
                )}

                {calculatedTolerancePreview && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                    <span className="text-xs text-blue-700">
                      Calculated tolerance:{" "}
                    </span>
                    <span className="font-mono text-sm font-semibold text-blue-900">
                      {calculatedTolerancePreview}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={formData.calibrationRequired}
                onChange={(event) =>
                  handleChange("calibrationRequired", event.target.checked)
                }
              />
              Calibrated instrument required
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={formData.instrumentEntryMandatory}
                onChange={(event) =>
                  handleChange("instrumentEntryMandatory", event.target.checked)
                }
              />
              Instrument ID required
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={formData.mandatoryPhoto}
                onChange={(event) =>
                  handleChange("mandatoryPhoto", event.target.checked)
                }
              />
              Inspection photo required
            </label>
          </div>
        </div>
      </details>
    </div>
  );
};


  const renderGoNoGoFields = () => (
    <div className="space-y-4 bg-amber-50 rounded-xl p-4 border border-amber-200">
      <h4 className="font-semibold text-amber-700 flex items-center gap-2">
        <span>🔧 Go/No-Go Gauge Details</span>
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Gauge Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.gaugeType}
            onChange={(e) => handleChange("gaugeType", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Select gauge type</option>
            {formData.gaugeType &&
              ![
                "Plug Gauge",
                "Snap Gauge",
                "Thread Plug Gauge",
                "Thread Ring Gauge",
                "Pin Gauge",
                "Ring Gauge",
                "Custom Gauge",
              ].includes(formData.gaugeType) && (
                <option value={formData.gaugeType}>{formData.gaugeType}</option>
              )}
            <option value="Plug Gauge">Plug Gauge</option>
            <option value="Snap Gauge">Snap Gauge</option>
            <option value="Thread Plug Gauge">Thread Plug Gauge</option>
            <option value="Thread Ring Gauge">Thread Ring Gauge</option>
            <option value="Pin Gauge">Pin Gauge</option>
            <option value="Ring Gauge">Ring Gauge</option>
            <option value="Custom Gauge">Custom Gauge</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Gauge Specification <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.gaugeSpecification}
            onChange={(e) => handleChange("gaugeSpecification", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
            placeholder="e.g., M12x1.75, 12.5mm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Drawing Balloon / Feature No.
          </label>
          <input
            type="text"
            value={formData.drawingBalloonNumber}
            onChange={(e) =>
              handleChange("drawingBalloonNumber", e.target.value)
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
            placeholder="e.g., B-12"
          />
        </div>
        {String(formData.gaugeType).toLowerCase().includes("thread") && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Thread Class / Feature Specification
              <span className="text-red-500"> *</span>
            </label>
            <input
              type="text"
              value={formData.threadFeatureSpec}
              onChange={(e) =>
                handleChange("threadFeatureSpec", e.target.value)
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
              placeholder="e.g., M12 × 1.75 – 6H"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            GO Condition <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.goCondition}
            onChange={(e) => handleChange("goCondition", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
            placeholder="e.g., Must fit freely"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            NO-GO Condition <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.noGoCondition}
            onChange={(e) => handleChange("noGoCondition", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
            placeholder="e.g., Must not fit"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={formData.calibrationRequired}
            onChange={(e) =>
              handleChange("calibrationRequired", e.target.checked)
            }
            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          Calibration Required
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={formData.gaugeIdRequired}
            onChange={(e) =>
              setFormData((previous) => ({
                ...previous,
                gaugeIdRequired: e.target.checked,
                instrumentEntryMandatory: e.target.checked,
              }))
            }
            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          Gauge ID Required
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={formData.mandatoryPhotoOnFailure}
            onChange={(e) =>
              handleChange("mandatoryPhotoOnFailure", e.target.checked)
            }
            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          Mandatory Photo on Failure
        </label>
      </div>

      <div className="bg-amber-100/50 rounded-lg p-3 text-sm text-amber-700">
        <p>At inspection time:</p>
        <ul className="list-disc list-inside mt-1 text-xs">
          <li>GO side enters correctly? Yes / No</li>
          <li>NO-GO side is prevented? Yes / No</li>
          <li>Final Result: Auto-calculated</li>
        </ul>
      </div>
    </div>
  );

  const renderVisualFields = () => (
    <div className="space-y-4 bg-purple-50 rounded-xl p-4 border border-purple-200">
      <h4 className="font-semibold text-purple-700 flex items-center gap-2">
        <span>👁️ Visual Inspection Details</span>
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Inspection Area <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.inspectionArea}
            onChange={(e) => handleChange("inspectionArea", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., Surface finish, Edge condition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Acceptance Standard <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.acceptanceStandard}
            onChange={(e) => handleChange("acceptanceStandard", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., No visible burrs, Smooth finish"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Reference Images
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={formData.referenceImages.join(", ")}
            onChange={(e) =>
              handleChange(
                "referenceImages",
                e.target.value.split(",").map((s) => s.trim()),
              )
            }
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., IMG-001, IMG-002"
          />
          <button className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition">
            Browse
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Defect Catalogue
        </label>
        <input
          type="text"
          value={formData.defectCatalogue}
          onChange={(e) => handleChange("defectCatalogue", e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., Scratches, Dents, Discoloration"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Result Recording Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleChange("resultType", "binary")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              formData.resultType === "binary"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-purple-50"
            }`}
          >
            Pass/Fail Only
          </button>
          <button
            type="button"
            onClick={() => handleChange("resultType", "defective_count")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              formData.resultType === "defective_count"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-purple-50"
            }`}
          >
            Count Rejected
          </button>
          <button
            type="button"
            onClick={() => handleChange("resultType", "defect_count")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              formData.resultType === "defect_count"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-purple-50"
            }`}
          >
            Count Defects
          </button>
          <button
            type="button"
            onClick={() => handleChange("resultType", "categorical")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              formData.resultType === "categorical"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-purple-50"
            }`}
          >
            Condition / Grade
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Allowed Defective Pieces
          </label>
          <input
            type="number"
            min="0"
            value={formData.allowedDefectivePieces}
            onChange={(e) =>
              handleChange(
                "allowedDefectivePieces",
                parseInt(e.target.value) || 0,
              )
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., 0"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Allowed Defect Count
          </label>
          <input
            type="number"
            min="0"
            value={formData.allowedDefectCount}
            onChange={(e) =>
              handleChange("allowedDefectCount", parseInt(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., 5"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Severity Rules
        </label>
        <textarea
          value={formData.severityRules}
          onChange={(e) => handleChange("severityRules", e.target.value)}
          rows="2"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., Critical defects: 0 allowed, Major defects: 2 allowed"
        />
      </div>

      {formData.resultType === "categorical" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Condition / Grade Options
            </label>
            <input
              type="text"
              value={(formData.categoricalOptions || []).join(", ")}
              onChange={(e) =>
                handleChange(
                  "categoricalOptions",
                  e.target.value
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean),
                )
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Acceptable, Minor, Major, Critical"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Failing Categories
            </label>
            <input
              type="text"
              value={(formData.rejectCategories || []).join(", ")}
              onChange={(e) =>
                handleChange(
                  "rejectCategories",
                  e.target.value
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean),
                )
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Major, Critical"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={formData.mandatoryPhoto}
            onChange={(e) => handleChange("mandatoryPhoto", e.target.checked)}
            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
          />
          Mandatory Photo
        </label>
      </div>
    </div>
  );

  const renderHardnessFields = () => (
    <div className="space-y-4 bg-green-50 rounded-xl p-4 border border-green-200">
      <h4 className="font-semibold text-green-700 flex items-center gap-2">
        <span>🔨 Hardness Test Details</span>
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Hardness Scale <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.hardnessScale}
            onChange={(e) => handleChange("hardnessScale", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select Scale</option>
            <option value="HRC">HRC (Rockwell C)</option>
            <option value="HRB">HRB (Rockwell B)</option>
            <option value="HRA">HRA (Rockwell A)</option>
            <option value="HB">HB (Brinell)</option>
            <option value="HV">HV (Vickers)</option>
            <option value="HS">HS (Shore)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Tester Type
          </label>
          <input
            type="text"
            value={formData.testerType}
            onChange={(e) => handleChange("testerType", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            placeholder="e.g., Digital, Analog"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Minimum Hardness <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            value={formData.minimumHardness}
            onChange={(e) => handleChange("minimumHardness", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 58"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Maximum Hardness <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            value={formData.maximumHardness}
            onChange={(e) => handleChange("maximumHardness", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 62"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Test Load
          </label>
          <input
            type="text"
            value={formData.testLoad}
            onChange={(e) => handleChange("testLoad", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 150 kg"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Test Method
          </label>
          <input
            type="text"
            value={formData.testMethod}
            onChange={(e) => handleChange("testMethod", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            placeholder="e.g., ASTM E18"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Test Location
          </label>
          <input
            type="text"
            value={formData.testLocation}
            onChange={(e) => handleChange("testLocation", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            placeholder="e.g., Position A, Center"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Indentations per Piece
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.indentationsPerPiece}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              handleChange("indentationsPerPiece", value);
              handleChange("readingsPerPiece", value);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 3"
          />
        </div>
      </div>
    </div>
  );

  const renderCoatingFields = () => (
    <div className="space-y-4 bg-cyan-50 rounded-xl p-4 border border-cyan-200">
      <h4 className="font-semibold text-cyan-700 flex items-center gap-2">
        <span>🎨 Coating/Plating Test Details</span>
      </h4>

      <div className="bg-cyan-100/50 rounded-lg p-3 text-sm text-cyan-700">
        <p className="font-medium mb-2">
          This process should contain separate checkpoints:
        </p>
        <ul className="list-disc list-inside text-xs space-y-1">
          <li>Coating Thickness — Numeric</li>
          <li>Adhesion Test — Pass/Fail</li>
          <li>Appearance — Visual Defect</li>
          <li>Surface Roughness — Numeric</li>
          <li>Certificate Verification — Approval</li>
          <li>Salt Spray Result — Numeric or Pass/Fail</li>
        </ul>
        <p className="mt-2 text-xs text-cyan-600">
          ⚠️ Do not create one generic "Plating Inspection" result field
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Coating Type
          </label>
          <input
            type="text"
            value={formData.gaugeType}
            onChange={(e) => handleChange("gaugeType", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
            placeholder="e.g., Zinc, Chrome, Paint"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Specification
          </label>
          <input
            type="text"
            value={formData.gaugeSpecification}
            onChange={(e) => handleChange("gaugeSpecification", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
            placeholder="e.g., ASTM B633, ISO 1456"
          />
        </div>
      </div>
    </div>
  );

  const renderAcceptanceFields = (title) => (
    <div className="space-y-4 bg-indigo-50 rounded-xl p-4 border border-indigo-200">
      <h4 className="font-semibold text-indigo-700">{title}</h4>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Acceptance / Verification Criteria{" "}
          <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.acceptanceStandard}
          onChange={(e) => handleChange("acceptanceStandard", e.target.value)}
          rows="3"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Describe the approved functional result, document requirement or sign-off criteria"
        />
      </div>
      {formData.resultType === "categorical" && (
        <input
          value={(formData.categoricalOptions || []).join(", ")}
          onChange={(e) =>
            handleChange(
              "categoricalOptions",
              e.target.value
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
            )
          }
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Allowed categories separated by commas"
        />
      )}
    </div>
  );

 const renderSamplingFields = () => {
  const pieces = Math.max(1, Number(formData.piecesPerInspection) || 1);
  const recommendedMethod = getRecommendedSPCMethod({
    ...formData,
    piecesPerInspection: pieces,
  });
  const explicitMethod = formData.overrideSPCMethod
    ? normalizeSPCMethod(
        formData.overrideSPCMethod,
        pieces,
        formData.resultType,
      )
    : "";
  const selectedMethod = normalizeSPCMethod(
    explicitMethod || recommendedMethod,
    pieces,
    formData.resultType,
  );
  const isNumeric = formData.resultType === "numeric";
  const isAttributeResult =
    formData.resultType === "binary" ||
    formData.resultType === "defective_count" ||
    formData.inspectionMethod === "go_nogo";
  const usesSinglePiece = isNumeric && selectedMethod === "I-MR";
  const readingsPerPiece = Math.max(1, Number(formData.readingsPerPiece) || 1);

  const selectNumericSamplingPlan = (mode) => {
    const nextPieces = mode === "single" ? 1 : pieces > 1 ? pieces : 5;
    setFormData((previous) => ({
      ...previous,
      piecesPerInspection: nextPieces,
      sampleSize: nextPieces,
      subgroupSize: nextPieces,
      // Let the sampling answer select the normal chart automatically.
      overrideSPCMethod: "",
    }));
  };

  const updatePiecesPerInspection = (value, minimum = 1) => {
    const maximum = isNumeric ? 25 : Infinity;
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      piecesPerInspection: value,
      sampleSize: value,
      subgroupSize: value,
    }));
  };

  return (
    <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
      <h4 className="font-semibold text-slate-700 flex items-center gap-2">
        <span>📊 Inspection Sampling</span>
      </h4>

      <p className="text-xs text-slate-500">
        Tell us how the inspection is performed. The system will configure the
        SPC chart automatically.
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {isNumeric && (
          <>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-medium text-slate-700">
                How do you measure this checkpoint?
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => selectNumericSamplingPlan("single")}
                  className={`rounded-lg border p-3 text-left transition ${
                    usesSinglePiece
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-slate-300 bg-white hover:border-blue-300"
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-800">
                    One piece each time
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    Record one result at every inspection event.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => selectNumericSamplingPlan("subgroup")}
                  className={`rounded-lg border p-3 text-left transition ${
                    !usesSinglePiece
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-slate-300 bg-white hover:border-blue-300"
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-800">
                    A small group each time
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    Measure several different pieces together.
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="text-[10px] font-medium uppercase tracking-wide text-blue-600">
                SPC chart selected
              </div>
              <div className="mt-1 text-lg font-bold text-blue-800">
                {usesSinglePiece ? "I-MR" : selectedMethod || "X-bar R"}
              </div>
              <p className="mt-1 text-[10px] text-blue-700">
                {usesSinglePiece
                  ? "Tracks one inspection result over time."
                  : "Tracks the group average and variation."}
              </p>
            </div>

            {!usesSinglePiece && (
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  How many different pieces are measured each time?
                  <span className="text-red-500"> *</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="2"
                  max="25"
                  value={pieces}
                  onChange={(event) =>
                    updatePiecesPerInspection(Number(event.target.value), 2)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Use separate physical pieces. A common choice is 5 pieces.
                </p>
              </div>
            )}

            <details className="md:col-span-3 rounded-lg border border-slate-200 bg-white p-3">
              <summary className="cursor-pointer text-xs font-medium text-slate-700">
                Advanced: repeat measurement on the same piece
                {readingsPerPiece > 1
                  ? ` (${readingsPerPiece} readings per piece)`
                  : ""}
              </summary>
              <div className="mt-3 max-w-md">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Measurements taken on each piece
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={readingsPerPiece}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isInteger(value) && value >= 1) {
                      handleChange("readingsPerPiece", value);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  {readingsPerPiece === 1
                    ? "One measurement becomes the result for that piece."
                    : `The ${readingsPerPiece} repeated measurements are averaged into one result for that piece.`}
                </p>
              </div>
            </details>
          </>
        )}

        {isAttributeResult && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                {formData.inspectionMethod === "go_nogo"
                  ? "How many pieces are checked with the gauge?"
                  : "How many pieces are inspected each time?"}
                <span className="text-red-500"> *</span>
              </label>
              <input
                type="number"
                step="1"
                min="2"
                value={pieces}
                onChange={(event) =>
                  updatePiecesPerInspection(Number(event.target.value), 2)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Enter the planned number of physical pieces in one inspection.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Will this quantity always stay the same?
              </label>
              <select
                value={formData.sampleSizeMode}
                onChange={(event) =>
                  handleChange("sampleSizeMode", event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="constant">Yes — same quantity every time</option>
                <option value="variable">No — quantity may change</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                Choose “No” only when the actual inspected quantity can vary.
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="text-[10px] font-medium uppercase tracking-wide text-blue-600">
                SPC chart selected
              </div>
              <div className="mt-1 text-lg font-bold text-blue-800">
                {formData.sampleSizeMode === "variable"
                  ? "P Chart"
                  : "NP Chart"}
              </div>
              <p className="mt-1 text-[10px] text-blue-700">
                {formData.sampleSizeMode === "variable"
                  ? "Shows the percentage of defective pieces."
                  : "Shows the number of defective pieces."}
              </p>
            </div>
          </>
        )}

        {!isNumeric && !isAttributeResult && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Units inspected each time
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={pieces}
              onChange={(event) =>
                updatePiecesPerInspection(Number(event.target.value), 1)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Frequency Trigger
          </label>
          <select
            value={formData.frequencyType}
            onChange={(e) => handleChange("frequencyType", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="time">Every time interval</option>
            <option value="pieces">Every N pieces</option>
            <option value="batch">Every batch</option>
            <option value="first_piece">First-off</option>
            <option value="last_piece">Last-off</option>
            <option value="setup_change">After setup change</option>
            <option value="tool_change">After tool change</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Interval
          </label>
          <input
            type="number"
            min="1"
            disabled={[
              "batch",
              "first_piece",
              "last_piece",
              "setup_change",
              "tool_change",
            ].includes(formData.frequencyType)}
            value={formData.frequencyValue}
            onChange={(e) =>
              handleChange("frequencyValue", Number(e.target.value) || 1)
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Unit
          </label>
          <select
            value={formData.frequencyUnit}
            disabled={formData.frequencyType !== "time"}
            onChange={(e) => handleChange("frequencyUnit", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
          >
            <option value="minute">Minute(s)</option>
            <option value="hour">Hour(s)</option>
            <option value="shift">Shift(s)</option>
            <option value="day">Day(s)</option>
          </select>
        </div>
      </div>

      {formData.inspectionMethod === "go_nogo" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-emerald-800 mb-1">
                Allowed Defective Pieces
                <span className="text-red-500"> *</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                max={Math.max(0, Number(formData.piecesPerInspection) || 0)}
                value={formData.allowedDefectivePieces}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isInteger(value) && value >= 0) {
                    handleChange("allowedDefectivePieces", value);
                  }
                }}
                className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <p className="mt-0.5 text-[10px] text-emerald-700">
                Product acceptance limit for this inspection—not an SPC control
                limit.
              </p>
            </div>
            <div className="rounded-lg bg-white/70 p-3 text-xs text-emerald-800">
              <p className="font-semibold">Acceptance rule</p>
              <p className="mt-1">
                Accept when defective pieces ≤{" "}
                {formData.allowedDefectivePieces || 0}. The P/NP chart
                independently checks process stability.
              </p>
            </div>
          </div>
        </div>
      )}

      {formData.resultType === "defect_count" && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Opportunity Behavior
            </label>
            <select
              value={formData.opportunityMode}
              onChange={(e) => handleChange("opportunityMode", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="constant">Constant — C chart</option>
              <option value="variable">Variable — U chart</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Opportunity Unit
            </label>
            <input
              value={formData.opportunityUnit}
              onChange={(e) => handleChange("opportunityUnit", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="piece, m², metre"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Opportunities per Unit
            </label>
            <input
              type="number"
              min="1"
              value={formData.opportunitiesPerUnit}
              onChange={(e) =>
                handleChange(
                  "opportunitiesPerUnit",
                  Number(e.target.value) || 1,
                )
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      )}

      <div
        className={`grid gap-3 ${
          formData.inspectionMethod === "go_nogo"
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        {formData.inspectionMethod !== "go_nogo" && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Measurement Position
            </label>
            <input
              type="text"
              value={formData.measurementPosition}
              onChange={(e) =>
                handleChange("measurementPosition", e.target.value)
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Position A, Top, Center"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Criticality
          </label>
          <select
            value={formData.criticality}
            onChange={(e) => handleChange("criticality", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="standard">Standard</option>
            <option value="critical">Critical</option>
            <option value="safety">Safety Critical</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={formData.allowNA}
            onChange={(e) => handleChange("allowNA", e.target.checked)}
          />
          Allow N/A with a mandatory reason
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            disabled={!formData.allowNA}
            checked={formData.naApprovalRequired}
            onChange={(e) =>
              handleChange("naApprovalRequired", e.target.checked)
            }
          />
          Supervisor approval required for N/A
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Reaction Plan
        </label>
        <textarea
          value={formData.reactionPlan}
          onChange={(e) => handleChange("reactionPlan", e.target.value)}
          rows="2"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Stop production, Isolate parts, Contact supervisor"
        />
      </div>

      {/* Inspector-facing sampling stays simple; overrides remain optional. */}
      {formData.inspectionMethod !== "go_nogo" && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-600">
                SPC chart configuration
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Automatically configured from the inspection answers above.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvancedSPC(!showAdvancedSPC)}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              {showAdvancedSPC
                ? "Hide engineer settings"
                : "Quality engineer settings"}
            </button>
          </div>

          {showAdvancedSPC && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Override SPC chart
              </label>
              <select
                value={formData.overrideSPCMethod}
                onChange={(event) => {
                  const method = event.target.value;
                  setFormData((previous) => {
                    const currentPieces = Math.max(
                      1,
                      Number(previous.piecesPerInspection) || 1,
                    );
                    const nextPieces =
                      method === "I-MR"
                        ? 1
                        : (method === "X-bar R" || method === "X-bar S") &&
                            currentPieces < 2
                          ? 5
                          : currentPieces;

                    return {
                      ...previous,
                      overrideSPCMethod: method,
                      piecesPerInspection: nextPieces,
                      sampleSize: nextPieces,
                      subgroupSize: nextPieces,
                    };
                  });
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Use automatic selection</option>
                {getSPCOverrideOptions(formData.resultType).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-amber-700">
                Only a quality engineer should change the automatically selected
                chart.
              </p>
            </div>
          )}
        </div>
      )}

      {formData.resultType === "numeric" ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium">Capability analysis enabled</p>
              <p className="mt-0.5 text-blue-600">
                Cp, Cpk, Pp and Ppk will become available after sufficient
                stable process data has been collected.
              </p>
              <p className="mt-0.5 text-blue-500 text-[10px]">
                Capability metrics appear only in: SPC Dashboard, Historical
                Analysis, Capability Report, Process Approval Screen
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
          Attribute SPC will use{" "}
          {selectedMethod || "the selected attribute chart"}. Capability indices
          Cp, Cpk, Pp and Ppk are not calculated for attribute checkpoints.
        </div>
      )}
    </div>
  );
};

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {isEditing ? "Edit Checkpoint" : "Add Advanced Checkpoint"}
              </h2>
              <p className="text-sm text-blue-100 mt-1">
                {isEditing
                  ? "Update inspection checkpoint details"
                  : "Create a new inspection checkpoint with SPC support"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-red-500 transition flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* A. Inspection Method Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              A. Inspection Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {inspectionMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => handleInspectionMethodChange(method.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition text-left ${
                    formData.inspectionMethod === method.value
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200/50"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* B. Result Recording Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              B. Result Recording Type <span className="text-red-500">*</span>
            </label>
            {formData.inspectionMethod === "go_nogo" ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <span>✅</span>
                  Pass / Fail per inspected piece
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    Automatically selected
                  </span>
                </div>
                <p className="mt-1 text-xs text-emerald-700">
                  A piece passes only when the GO side enters correctly and the
                  NO-GO side is prevented.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {resultTypes
                    .filter((type) =>
                      (
                        allowedResultTypes[formData.inspectionMethod] || []
                      ).includes(type.value),
                    )
                    .map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleChange("resultType", type.value)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium transition text-left ${
                          formData.resultType === type.value
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/50"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  This selection determines the SPC chart type and statistical
                  methods
                </p>
              </>
            )}
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Checkpoint Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Overall Width Measurement"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Dynamic Fields Based on Inspection Method */}
          {formData.inspectionMethod === "go_nogo" && renderGoNoGoFields()}
          {formData.inspectionMethod === "visual" && renderVisualFields()}
          {formData.inspectionMethod === "hardness" && renderHardnessFields()}
          {formData.inspectionMethod === "coating" && renderCoatingFields()}
          {["functional", "certificate", "approval"].includes(
            formData.inspectionMethod,
          ) &&
            renderAcceptanceFields(
              formData.inspectionMethod === "functional"
                ? "⚡ Functional Test Details"
                : formData.inspectionMethod === "certificate"
                  ? "📄 Certificate / Document Verification"
                  : "✅ Approval / Sign-Off Criteria",
            )}
          {formData.resultType === "numeric" &&
            formData.inspectionMethod !== "hardness" &&
            renderNumericFields()}

          {/* Sampling & SPC - Always shown */}
          {renderSamplingFields()}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isEditing ? "Update Checkpoint" : "Add Checkpoint"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckpointModal;
