// src/AutonomousModelEngine/ModelTypes.ts
// Core Type Definitions for ADVIS Autonomous Scientific Model Construction Engine

import { DiagnosticConfidence, DataProvenance, DigitalTwin, SafetyState } from '../DigitalTwin';
import { ComponentMetadata, ObjectMetadata } from '../SpatialLibrary';

export type ModelConstructionStrategy = 
  | 'PARAMETRIC'
  | 'MATHEMATICAL'
  | 'SCIENTIFIC_DATASET'
  | 'MOLECULAR'
  | 'ENGINEERING_ASSEMBLY'
  | 'IMPORTED_CAD'
  | 'PROCEDURALLY_APPROXIMATED';

export type ModelQualityTier = 
  | 'CANONICAL'
  | 'LIT'
  | 'DATA'
  | 'DERIVED'
  | 'ILLUSTRATIVE'
  | 'UNKNOWN'
  | 'VERIFIED'
  | 'APPROXIMATE'
  | 'INCOMPLETE';

export type FidelityClassification = 
  | 'MATHEMATICALLY_EXACT'
  | 'MATHEMATICAL_DERIVATION'
  | 'ENGINEERING_SPECIFICATION'
  | 'SIMPLIFIED_ASSEMBLY'
  | 'ILLUSTRATIVE_VISUALIZATION'
  | 'REFERENCE_CAD_DATA'
  | 'APPROXIMATE_ANALOG';

export type ModelSessionCategory = 
  | 'CANONICAL'
  | 'SESSION_GENERATED'
  | 'USER_IMPORTED'
  | 'VERIFIED_CUSTOM';

export type ModelProvenanceSource = 
  | 'LIT'
  | 'DATA'
  | 'DERIVED'
  | 'GENERATED'
  | 'USER'
  | 'ESTIMATED'
  | 'UNKNOWN';

export interface ProvenanceValue<T = any> {
  value: T;
  source: ModelProvenanceSource;
  confidence: DiagnosticConfidence;
  notes?: string;
  equation?: string;
  referenceStandard?: string;
}

export interface ModelValidationRule {
  id: string;
  description: string;
  ruleType: 'GEOMETRIC' | 'PHYSICAL' | 'MATHEMATICAL' | 'SAFETY' | 'TOPOLOGICAL';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  passed: boolean;
  message: string;
}

export interface ModelValidationReport {
  isValid: boolean;
  qualityTier: ModelQualityTier;
  rulesEvaluated: ModelValidationRule[];
  errors: string[];
  warnings: string[];
  assumptions: string[];
  limitations: string[];
}

export interface AutonomousModelPlan {
  planId: string;
  targetQuery: string;
  objectType: string;
  displayName: string;
  domain: string;
  constructionMethod: ModelConstructionStrategy;
  parameters: Record<string, ProvenanceValue<any>>;
  requiredInformation: string[];
  missingInformation: string[];
  assumptions: string[];
  validationRules: string[];
  qualityTier: ModelQualityTier;
  fidelityClassification?: FidelityClassification;
  explanation: {
    whatBuilt: string;
    whySelected: string;
    dataSource: string;
    equationsUsed: string[];
    assumedParameters?: string[];
    unknownParameters?: string[];
    accuracyDisclosure?: string;
  };
  createdAt: number;
}

export interface ProceduralMeshSpecification {
  id: string;
  name: string;
  meshType: 'BUFFER_GEOMETRY' | 'PARAMETRIC_SURFACE' | 'INVOLUTE_GEAR' | 'GEOID_SPHERICAL_HARMONIC' | 'CUSTOM_PRIMITIVE';
  parameters: Record<string, any>;
  color?: string;
  materialType?: string;
  equationFormula?: string;
  wireframe?: boolean;
  customData?: any;
}

export interface AutonomousModelRecord {
  id: string;
  plan: AutonomousModelPlan;
  twin: DigitalTwin;
  spatialObject: ObjectMetadata;
  category: ModelSessionCategory;
  meshSpecs: Record<string, ProceduralMeshSpecification>;
  mutationHistory: Array<{
    timestamp: number;
    mutationCommand: string;
    parameterDelta: Record<string, any>;
    previousParameters: Record<string, any>;
  }>;
  createdAt: number;
  updatedAt: number;
}

export interface MutationRequest {
  targetId?: string;
  command: string;
  selectedComponentId?: string | null;
  parameterOverrides?: Record<string, any>;
  scaleFactor?: number;
  action?: 'REGENERATE' | 'SCALE' | 'PARAMETRIC_CHANGE' | 'REPLACE_COMPONENT' | 'ADD_COMPONENT' | 'REMOVE_COMPONENT';
}
