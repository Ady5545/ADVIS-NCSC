export type ScientificDomain = 
  | 'MECHANICAL_ENGINEERING'
  | 'ANATOMY'
  | 'CHEMISTRY'
  | 'PHYSICS'
  | 'ASTRONOMY'
  | 'ELECTRICAL_ENGINEERING'
  | 'ROBOTICS'
  | 'THERMODYNAMICS'
  | 'FLUID_MECHANICS';

export type RelationshipType =
  | 'DRIVES'
  | 'DRIVEN_BY'
  | 'CONNECTED_TO'
  | 'CONTAINED_IN'
  | 'TRANSFERS_FORCE_TO'
  | 'TRANSFERS_ENERGY_TO'
  | 'DEPENDS_ON'
  | 'REACTS_WITH'
  | 'ADJACENT_TO'
  | 'PART_OF'
  | 'SUPPLIED_BY'
  | 'CONTROLS'
  | 'PRODUCES'
  | 'CONSUMES'
  | 'TRANSFORMS'
  | 'CONDUCTS'
  | 'SURROUNDS'
  | 'ATTACHES_TO'
  | 'PUMPS'
  | 'SEALS'
  | 'LUBRICATES'
  | 'IGNITES';

export interface ScientificRelationship {
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  description: string;
  bidirectional?: boolean;
  transferType?: 'MECHANICAL' | 'FLUID' | 'ELECTRICAL' | 'THERMAL' | 'CHEMICAL' | 'BIOLOGICAL';
  strength?: number; // 0 to 1
}

export interface ComponentEducationalMetadata {
  name: string;
  scientificName: string;
  definition: string;
  function: string;
  importance?: string;
  realWorldRelevance?: string;
  commonMisconceptions?: string[];
  curriculumLevel?: 'MIDDLE_SCHOOL' | 'HIGH_SCHOOL' | 'UNDERGRADUATE' | 'ADVANCED_RESEARCH';
  governingEquations?: Array<{
    name: string;
    formula: string;
    description: string;
  }>;
  failureModes?: string[];
  operationalRole?: string;
}

export interface ComponentGeometry {
  type: 'box' | 'cylinder' | 'sphere' | 'torus' | 'cone' | 'piston_assembly' | 'crank_segment' | 'valve' | 'cam' | 'spark_plug' | 'anatomical_organ' | 'custom' | 'composite' | 'vascular_vessel';
  params: Record<string, any>;
  material: {
    pbrPreset?: string;
    color?: string;
    metalness?: number;
    roughness?: number;
    opacity?: number;
    transparent?: boolean;
    wireframe?: boolean;
    emissive?: string;
    emissiveIntensity?: number;
  };
  transform: {
    position: [number, number, number];
    rotation: [number, number, number]; // in radians
    scale: [number, number, number];
  };
  explodedOffset: [number, number, number];
  explosionDirection?: [number, number, number];
  subassemblyId?: string;
}

export interface KinematicBinding {
  driverVariable: string;
  type: 'ROTATION_X' | 'ROTATION_Y' | 'ROTATION_Z' | 'TRANSLATION_X' | 'TRANSLATION_Y' | 'TRANSLATION_Z' | 'CONROD_ANGLE_Z' | 'VALVE_LIFT' | 'CUSTOM_EXPRESSION';
  multiplier?: number;
  phaseOffset?: number; // radians or units
  baseValue?: number;
  customCompute?: (variableVal: number, allVariables: Record<string, number>) => number;
}

export interface ScientificComponent {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  subsystemId: string;
  parentId: string | null;
  childrenIds: string[];
  geometry: ComponentGeometry;
  kinematicBinding?: KinematicBinding;
  education: ComponentEducationalMetadata;
  scientificProperties: Record<string, {
    value: number | string;
    unit?: string;
    description: string;
  }>;
}

export interface Subsystem {
  id: string;
  name: string;
  description: string;
  color: string;
  rootComponentIds: string[];
}

export interface SimulationStateVariable {
  id: string;
  name: string;
  unit: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  isDynamic: boolean;
  description: string;
}

export interface CyclePhase {
  id: string;
  name: string;
  startVal: number; // e.g. crank angle in degrees 0-180
  endVal: number;   // 180-360
  description: string;
  color: string;
  activeValves?: string[];
  thermoState?: string;
}

export interface ScientificDiagramDefinition {
  id: string;
  title: string;
  type: 'PV_DIAGRAM' | 'VALVE_TIMING' | 'FOUR_STROKE_CYCLE' | 'FLOW_PATH' | 'ANATOMY_NETWORK';
  description: string;
  parametersTracked: string[];
}

export interface ScientificSystemModel {
  id: string;
  name: string;
  scientificTitle: string;
  domain: ScientificDomain;
  description: string;
  subsystems: Subsystem[];
  components: Record<string, ScientificComponent>;
  relationships: ScientificRelationship[];
  simulation: {
    variables: Record<string, SimulationStateVariable>;
    parameters: Record<string, number>;
    cyclePhases?: CyclePhase[];
    stepFunction: (
      currentState: Record<string, number>,
      dt: number,
      parameters: Record<string, number>
    ) => Record<string, number>;
  };
  diagrams: ScientificDiagramDefinition[];
}
