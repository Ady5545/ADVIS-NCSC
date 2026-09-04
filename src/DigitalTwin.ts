export type DiagnosticStatus = 'NORMAL' | 'SUSPECTED' | 'AFFECTED' | 'ISOLATED' | 'ATTENTION' | 'FAULT' | 'UNKNOWN';
export type DiagnosticConfidence = 'CONFIRMED' | 'LIKELY' | 'POSSIBLE' | 'INSUFFICIENT_DATA' | 'UNKNOWN';
export type DataProvenance = 'LIT' | 'DERIVED' | 'USER' | 'USER_INPUT' | 'SENSOR' | 'SIMULATION' | 'STATIC_CAD' | 'LITERATURE' | 'LIVE' | 'UNKNOWN';
export type ConnectionType = 
  | 'mechanical' 
  | 'electrical' 
  | 'thermal' 
  | 'fluid' 
  | 'logical' 
  | 'structural'
  | 'power'
  | 'signal'
  | 'data'
  | 'control'
  | 'chemical';

export type DigitalTwinDomain =
  | 'MECHANICAL'
  | 'ELECTRICAL'
  | 'AUTOMOTIVE'
  | 'ROBOTICS'
  | 'INDUSTRIAL_EQUIPMENT'
  | 'THERMAL_MANAGEMENT'
  | 'AEROSPACE'
  | 'CHEMISTRY'
  | 'INSTRUMENTATION'
  | 'CONSUMER_ELECTRONICS'
  | 'CUSTOM_CAD';

export interface DiagnosticRecord {
  componentId: string;
  status: DiagnosticStatus;
  confidence?: DiagnosticConfidence;
  parameter?: string;
  observedValue?: string | number;
  expectedRange?: string;
  timestamp?: number;
  source: DataProvenance;
  explanation?: string;
}

export interface Connection {
  id: string;
  sourceComponentId: string;
  targetComponentId: string;
  type: ConnectionType;
  description?: string;
  bidirectional?: boolean;
  nominalRating?: string;
  metadata?: Record<string, any>;
}

export interface DigitalTwinFunction {
  id: string;
  name: string;
  inputComponents?: string[];
  outputComponents?: string[];
  description?: string;
  mechanism?: string;
  category?: 'POWER_DELIVERY' | 'SIGNAL_ROUTING' | 'THERMAL_DISSIPATION' | 'MOTION_CONVERSION' | 'STRUCTURAL_SUPPORT' | 'CONTROL_LOGIC' | 'CHEMICAL_REACTION' | 'GENERIC';
}

export interface SafetyState {
  hazardous: boolean;
  hazardType?: 'HIGH_VOLTAGE' | 'PRESSURIZED_FLUID' | 'HIGH_TEMPERATURE' | 'ROTATING_MASS' | 'CHEMICAL_TOXICITY' | 'STORED_MECHANICAL_ENERGY' | 'NONE';
  isolationRequired: boolean;
  lockoutTagoutProcedure?: string[];
  ppeRequired?: string[];
  warning: string;
}

export interface InspectionStep {
  stepNumber: number;
  title: string;
  action: string;
  safetyCheck: string;
  expectedObservation: string;
  distinguishingMeasurement: string;
  requiredInstrument: string; // e.g. "Digital Multimeter (CAT III 600V)", "Infrared Thermometer", "Calibrated Torque Wrench"
  canDetermineFromCAD: boolean; // Explicitly distinguishes CAD inference vs real test
}

export interface DiagnosticHypothesis {
  id: string;
  componentId: string;
  componentName: string;
  failureMode: string;
  status: DiagnosticStatus;
  confidence: DiagnosticConfidence;
  evidence: string[];
  possibleCauses: string[];
  affectedSubsystems: string[];
  recommendedChecks: string[];
  requiredSensors: string[];
  safetyState: SafetyState;
  provenance: DataProvenance;
  distinguishingMeasurement?: string;
  repairProcedure?: string[];
}

export interface DigitalTwinComponent {
  id: string;
  name: string;
  parentId?: string;
  category?: string;
  description?: string;
  function?: string;
  material?: string;
  specifications?: Record<string, any>;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  dimensions?: {
    length?: number | string;
    width?: number | string;
    height?: number | string;
    diameter?: number | string;
    unit?: string;
  };
  connections?: string[]; // IDs of connections
  operatingParameters?: Record<string, any>;
  nominalLimits?: {
    minVoltage?: number;
    maxVoltage?: number;
    maxCurrent?: number;
    maxTemperatureC?: number;
    maxRpm?: number;
    maxPressureBar?: number;
  };
  failureModes?: string[];
  diagnosticState?: DiagnosticRecord;
  safetyState?: SafetyState;
}

export interface CADSourceMetadata {
  format: 'STEP' | 'STP' | 'STL' | 'OBJ' | 'GLTF' | 'GLB' | 'PROCEDURAL';
  filePath?: string;
  importDate?: string;
  unitScale?: number;
  hasHierarchy: boolean;
  unclassifiedComponentCount?: number;
  authoritativeSource?: string;
}

export interface DigitalTwin {
  id: string;
  name: string;
  domain: string | DigitalTwinDomain;
  description?: string;
  manufacturer?: string;
  modelNumber?: string;
  components: DigitalTwinComponent[];
  connections: Connection[];
  functions: DigitalTwinFunction[];
  specifications?: Record<string, any>;
  materials?: string[];
  operatingParameters?: Record<string, any>;
  kinematics?: Record<string, any>;
  thermalProperties?: Record<string, any>;
  electricalProperties?: Record<string, any>;
  failureModes?: string[];
  diagnosticInputs?: DiagnosticRecord[];
  activeHypotheses?: DiagnosticHypothesis[];
  cadMetadata?: CADSourceMetadata;
  safetyOverview?: SafetyState;
  dataProvenance: DataProvenance;
}

export type IndustrialSystemType = 
  | 'electronic_enclosure' 
  | 'subrack' 
  | 'chassis' 
  | 'backplane' 
  | 'power_supply' 
  | 'cooling_system' 
  | 'pcb_assembly' 
  | 'connector' 
  | 'cabinet' 
  | 'thermal_management_system'
  | 'generic';

// Extend DigitalTwin to support Industrial / nVent / Schroff specific properties
export interface IndustrialDigitalTwin extends DigitalTwin {
  systemType: IndustrialSystemType;
  ipRating?: string; // e.g. IP20, IP65
  rackUnits?: number; // e.g. 3U, 6U
  emiShielding?: boolean;
  backplaneBusType?: string; // e.g. VME, VPX, CompactPCI, PCIe
  airflowDirection?: 'FRONT_TO_REAR' | 'BOTTOM_TO_TOP' | 'SIDE_TO_SIDE';
  nominalPowerWatts?: number;
}

