// CheckpointTypes.js
export const CHECKPOINT_TYPES = {
  // Measurement Types
  DIMENSIONAL: {
    id: 'dimensional',
    label: 'Dimensional Measurement',
    icon: '📏',
    category: 'measurement',
    fields: ['expectedValue', 'unit', 'tolerance', 'upperSpecLimit', 'lowerSpecLimit', 'nominalValue']
  },
  GEOMETRIC: {
    id: 'geometric',
    label: 'Geometric Tolerance',
    icon: '🔲',
    category: 'measurement',
    fields: ['expectedValue', 'unit', 'tolerance', 'datum', 'featureControlFrame']
  },
  SURFACE_FINISH: {
    id: 'surfaceFinish',
    label: 'Surface Finish',
    icon: '🔍',
    category: 'measurement',
    fields: ['expectedValue', 'unit', 'roughnessRa', 'roughnessRz', 'process']
  },
  HARDNESS: {
    id: 'hardness',
    label: 'Hardness Test',
    icon: '🔨',
    category: 'measurement',
    fields: ['expectedValue', 'unit', 'scale', 'indentation', 'load']
  },
  TENSILE: {
    id: 'tensile',
    label: 'Tensile Strength',
    icon: '💪',
    category: 'measurement',
    fields: ['expectedValue', 'unit', 'yieldStrength', 'ultimateTensile', 'elongation']
  },
  WEIGHT: {
    id: 'weight',
    label: 'Weight/Mass',
    icon: '⚖️',
    category: 'measurement',
    fields: ['expectedValue', 'unit', 'tolerance', 'sampleSize']
  },
  TEMPERATURE: {
    id: 'temperature',
    label: 'Temperature',
    icon: '🌡️',
    category: 'measurement',
    fields: ['expectedValue', 'unit', 'tolerance', 'time', 'environment']
  },
  PRESSURE: {
    id: 'pressure',
    label: 'Pressure',
    icon: '💨',
    category: 'measurement',
    fields: ['expectedValue', 'unit', 'tolerance', 'duration']
  },
  ELECTRICAL: {
    id: 'electrical',
    label: 'Electrical Testing',
    icon: '⚡',
    category: 'measurement',
    fields: ['expectedValue', 'unit', 'tolerance', 'voltage', 'current', 'resistance']
  },
  OPTICAL: {
    id: 'optical',
    label: 'Optical Inspection',
    icon: '🔬',
    category: 'measurement',
    fields: ['expectedValue', 'unit', 'magnification', 'wavelength', 'resolution']
  },

  // Visual Types
  VISUAL: {
    id: 'visual',
    label: 'Visual Inspection',
    icon: '👁️',
    category: 'visual',
    fields: ['criteria', 'standard', 'defectsAccepted']
  },
  SURFACE_DEFECT: {
    id: 'surfaceDefect',
    label: 'Surface Defect Inspection',
    icon: '🔎',
    category: 'visual',
    fields: ['defectType', 'maxSize', 'defectsAllowed', 'inspectionMethod']
  },
  COLOR: {
    id: 'color',
    label: 'Color Match',
    icon: '🎨',
    category: 'visual',
    fields: ['expectedColor', 'tolerance', 'lightingCondition', 'colorSpace']
  },
  CLEANLINESS: {
    id: 'cleanliness',
    label: 'Cleanliness Inspection',
    icon: '🧹',
    category: 'visual',
    fields: ['standard', 'particlesAllowed', 'inspectionMethod']
  },
  COATING: {
    id: 'coating',
    label: 'Coating/Plating Inspection',
    icon: '🎯',
    category: 'visual',
    fields: ['coatingType', 'thicknessMin', 'thicknessMax', 'adhesionTest']
  },

  // Approval Types
  APPROVAL: {
    id: 'approval',
    label: 'Approval/Verification',
    icon: '✅',
    category: 'approval',
    fields: ['approver', 'criteria', 'documentation']
  },
  CERTIFICATION: {
    id: 'certification',
    label: 'Certification Check',
    icon: '📜',
    category: 'approval',
    fields: ['certificateType', 'validityDate', 'issuingAuthority']
  },
  COMPLIANCE: {
    id: 'compliance',
    label: 'Compliance Verification',
    icon: '🏛️',
    category: 'approval',
    fields: ['standard', 'requirement', 'evidence']
  },

  // Test Types
  FUNCTIONAL_TEST: {
    id: 'functionalTest',
    label: 'Functional Test',
    icon: '🔧',
    category: 'test',
    fields: ['testCondition', 'expectedResult', 'duration', 'environment']
  },
  PRESSURE_TEST: {
    id: 'pressureTest',
    label: 'Pressure/Leak Test',
    icon: '💧',
    category: 'test',
    fields: ['testPressure', 'duration', 'leakRate', 'medium']
  },
  BURST_TEST: {
    id: 'burstTest',
    label: 'Burst Test',
    icon: '💥',
    category: 'test',
    fields: ['pressure', 'duration', 'failureMode']
  },
  TORQUE_TEST: {
    id: 'torqueTest',
    label: 'Torque Test',
    icon: '🔩',
    category: 'test',
    fields: ['expectedTorque', 'unit', 'tolerance', 'rotation']
  },
  VIBRATION_TEST: {
    id: 'vibrationTest',
    label: 'Vibration Test',
    icon: '📳',
    category: 'test',
    fields: ['frequency', 'amplitude', 'duration', 'axis']
  },
  SHOCK_TEST: {
    id: 'shockTest',
    label: 'Shock Test',
    icon: '💫',
    category: 'test',
    fields: ['acceleration', 'duration', 'pulseShape']
  },
  THERMAL_CYCLE: {
    id: 'thermalCycle',
    label: 'Thermal Cycle Test',
    icon: '🔥❄️',
    category: 'test',
    fields: ['minTemp', 'maxTemp', 'cycles', 'rampRate', 'soakTime']
  },
  HUMIDITY_TEST: {
    id: 'humidityTest',
    label: 'Humidity Test',
    icon: '💦',
    category: 'test',
    fields: ['humidityLevel', 'temperature', 'duration']
  },
  SALT_SPRAY: {
    id: 'saltSpray',
    label: 'Salt Spray Test',
    icon: '🧂',
    category: 'test',
    fields: ['concentration', 'temperature', 'duration', 'ph']
  },
  EMC_TEST: {
    id: 'emcTest',
    label: 'EMC/EMI Test',
    icon: '📡',
    category: 'test',
    fields: ['frequencyRange', 'fieldStrength', 'testStandard']
  }
};

// Helper function to get type definition by ID
export const getTypeDefinition = (typeId) => {
  return Object.values(CHECKPOINT_TYPES).find(t => t.id === typeId);
};

// Helper function to get types by category
export const getTypesByCategory = (category) => {
  return Object.values(CHECKPOINT_TYPES).filter(t => t.category === category);
};

// Helper function to get all categories
export const getCategories = () => {
  const categories = new Set();
  Object.values(CHECKPOINT_TYPES).forEach(type => {
    categories.add(type.category);
  });
  return Array.from(categories);
};

// Helper function to get all types as array
export const getAllTypes = () => {
  return Object.values(CHECKPOINT_TYPES);
};

// Default checkpoint data structure
export const getDefaultCheckpointData = () => ({
  name: '',
  type: 'dimensional',
  category: 'measurement',
  expectedValue: '',
  measuredValue: '',
  unit: 'mm',
  tolerance: '±0.1',
  upperSpecLimit: '',
  lowerSpecLimit: '',
  nominalValue: '',
  sampleSize: 5,
  frequency: 'hourly',
  controlChartType: 'X-bar-R',
  cp: '',
  cpk: '',
  pp: '',
  ppk: '',
  criteria: '',
  standard: '',
  defectsAccepted: '',
  defectType: '',
  maxSize: '',
  expectedColor: '#000000',
  colorSpace: '',
  testCondition: '',
  duration: '',
  environment: '',
  pressure: '',
  leakRate: '',
  medium: '',
  datum: '',
  featureControlFrame: '',
  roughnessRa: '',
  roughnessRz: '',
  process: '',
  scale: '',
  indentation: '',
  load: '',
  yieldStrength: '',
  ultimateTensile: '',
  elongation: '',
  voltage: '',
  current: '',
  resistance: '',
  magnification: '',
  wavelength: '',
  resolution: '',
  coatingType: '',
  thicknessMin: '',
  thicknessMax: '',
  adhesionTest: '',
  particlesAllowed: '',
  inspectionMethod: '',
  approver: '',
  documentation: '',
  certificateType: '',
  validityDate: '',
  issuingAuthority: '',
  requirement: '',
  evidence: '',
  testStandard: '',
  frequencyRange: '',
  fieldStrength: '',
  minTemp: '',
  maxTemp: '',
  cycles: '',
  rampRate: '',
  soakTime: '',
  humidityLevel: '',
  concentration: '',
  ph: '',
  defectsAllowed: '',
  lightingCondition: '',
  expectedResult: '',
  testPressure: '',
  failureMode: '',
  expectedTorque: '',
  rotation: '',
  amplitude: '',
  axis: '',
  acceleration: '',
  pulseShape: '',
});