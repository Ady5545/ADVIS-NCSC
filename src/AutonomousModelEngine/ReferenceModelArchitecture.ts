// src/AutonomousModelEngine/ReferenceModelArchitecture.ts
// Reference Model Architecture & Real-World Engineering Component Catalog
// Explicit separation between Visual Mesh, Engineering CAD, and Digital Twin Metadata

import { DataProvenance, DiagnosticConfidence, DigitalTwin, DigitalTwinComponent, Connection, SafetyState } from '../DigitalTwin';
import { ModelQualityTier, ModelProvenanceSource, FidelityClassification } from './ModelTypes';

export type ReferenceSourceType = 
  | 'STEP' 
  | 'IGES' 
  | 'STL' 
  | 'OBJ' 
  | 'GLTF_GLB' 
  | 'MANUFACTURER_DATASHEET' 
  | 'TECHNICAL_DRAWING' 
  | 'STANDARDIZED_SPECIFICATION'
  | 'SCAN_PHOTOMETRY';

export type ReferenceModelFidelity = 
  | 'EXACT_BREP_CAD' 
  | 'TESSALATED_MESH' 
  | 'PARAMETRIC_SCHEMATIC' 
  | 'AUTHORITATIVE_SPECIFICATION'
  | 'ILLUSTRATIVE_APPROXIMATION';

export type EngineeringFormatCategory = 
  | 'VISUAL_MESH'       // Triangulated vertices/indices for WebGL rendering (STL, OBJ, glTF)
  | 'ENGINEERING_CAD'   // Topological B-Rep solids, exact surfaces, assembly constraints (STEP, IGES)
  | 'DIGITAL_TWIN_META'; // Semantic component tree, causal connection graph, failure modes, safety limits

export interface CADCapabilityMatrix {
  format: string;
  category: EngineeringFormatCategory;
  supportsVisualization: boolean;
  supportsComponentHierarchy: boolean;
  supportsEngineeringMetadata: boolean;
  supportsEditableGeometry: boolean;
  supportsDigitalTwinConstruction: boolean;
  notes: string;
}

export const CAD_CAPABILITY_REGISTRY: Record<string, CADCapabilityMatrix> = {
  STEP: {
    format: 'STEP (ISO 10303-21 / AP203/AP214/AP242)',
    category: 'ENGINEERING_CAD',
    supportsVisualization: true,
    supportsComponentHierarchy: true,
    supportsEngineeringMetadata: true,
    supportsEditableGeometry: true,
    supportsDigitalTwinConstruction: true,
    notes: 'Exact boundary representation (B-Rep). Primary standard for mechanical digital twin reconstruction.'
  },
  IGES: {
    format: 'IGES (.igs / Initial Graphics Exchange)',
    category: 'ENGINEERING_CAD',
    supportsVisualization: true,
    supportsComponentHierarchy: false,
    supportsEngineeringMetadata: false,
    supportsEditableGeometry: true,
    supportsDigitalTwinConstruction: false,
    notes: 'Legacy surface geometry format. Lacks explicit solid topology and semantic metadata.'
  },
  GLTF_GLB: {
    format: 'glTF 2.0 / GLB (Khronos Group)',
    category: 'VISUAL_MESH',
    supportsVisualization: true,
    supportsComponentHierarchy: true,
    supportsEngineeringMetadata: false,
    supportsEditableGeometry: false,
    supportsDigitalTwinConstruction: true,
    notes: 'Optimal for GPU rendering & node hierarchy. Not editable CAD; mesh tessellations are baked.'
  },
  STL: {
    format: 'STL (Stereolithography)',
    category: 'VISUAL_MESH',
    supportsVisualization: true,
    supportsComponentHierarchy: false,
    supportsEngineeringMetadata: false,
    supportsEditableGeometry: false,
    supportsDigitalTwinConstruction: false,
    notes: 'Unindexed triangulated surface mesh. No color, no hierarchy, no semantic parameters.'
  },
  OBJ: {
    format: 'Wavefront OBJ',
    category: 'VISUAL_MESH',
    supportsVisualization: true,
    supportsComponentHierarchy: false,
    supportsEngineeringMetadata: false,
    supportsEditableGeometry: false,
    supportsDigitalTwinConstruction: false,
    notes: 'Standard polygon geometry with UVs. Suitable for static visual rendering only.'
  },
  DATASHEET: {
    format: 'Manufacturer Engineering Datasheet / Standard',
    category: 'DIGITAL_TWIN_META',
    supportsVisualization: false,
    supportsComponentHierarchy: true,
    supportsEngineeringMetadata: true,
    supportsEditableGeometry: false,
    supportsDigitalTwinConstruction: true,
    notes: 'Authoritative parametric values (LIT/DATA), tolerances, pinouts, and thermal ratings.'
  }
};

export interface ReferenceComponentEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  material: string;
  position?: [number, number, number];
  dimensions?: {
    length?: number | string;
    width?: number | string;
    height?: number | string;
    diameter?: number | string;
    unit?: string;
  };
  specifications: Record<string, any>;
  provenance: DataProvenance;
  failureModes?: string[];
  safetyState?: SafetyState;
}

export interface ReferenceConnectionEntry {
  id: string;
  sourceComponentId: string;
  targetComponentId: string;
  type: 'mechanical' | 'electrical' | 'thermal' | 'fluid' | 'signal' | 'power';
  description: string;
  nominalRating?: string;
}

export interface ReferenceModel {
  id: string;
  name: string;
  domain: string;
  source: string;
  sourceType: ReferenceSourceType;
  referenceStandard?: string;
  fidelity: ReferenceModelFidelity;
  fidelityClassification: FidelityClassification;
  manufacturer?: string;
  partNumber?: string;
  qualityTier: ModelQualityTier;
  provenance: ModelProvenanceSource;
  description: string;
  components: ReferenceComponentEntry[];
  connections: ReferenceConnectionEntry[];
  metadata: Record<string, any>;
  assumptions: string[];
  limitations: string[];
  createdAt: number;
}

/**
 * Real-World Engineering Reference Catalog
 * Trusted references with explicitly tagged provenance (LIT/DATA).
 * Unknown dimensions and ratings are strictly labeled as UNKNOWN.
 */
export const ENGINEERING_REFERENCE_CATALOG: Record<string, ReferenceModel> = {
  'ref_subrack_3u_eurocard': {
    id: 'ref_subrack_3u_eurocard',
    name: '19-Inch 3U Eurocard Subrack Chassis',
    domain: 'ELECTRICAL_ENCLOSURES',
    source: 'DIN 41494 / IEC 60297-3-100 Standard Specification',
    sourceType: 'STANDARDIZED_SPECIFICATION',
    referenceStandard: 'IEC 60297-3-100 / IEEE 1101.1',
    fidelity: 'AUTHORITATIVE_SPECIFICATION',
    fidelityClassification: 'ENGINEERING_SPECIFICATION',
    manufacturer: 'Standard 19" Rack Systems',
    partNumber: '19-3U-84HP-160',
    qualityTier: 'LIT',
    provenance: 'LIT',
    description: 'Standard 19-inch 3U modular subrack for 160mm Eurocards with 84 HP horizontal usable width.',
    components: [
      {
        id: 'comp_subrack_side_plates',
        name: 'Side Plates (Left & Right)',
        category: 'Structural Enclosure',
        description: 'Extruded aluminum side plates with 19" mounting flanges.',
        material: 'Aluminum Alloy 6063-T6',
        position: [0, 0, 0],
        dimensions: { height: 132.5, width: 235, length: 2, unit: 'mm' },
        specifications: {
          'Height': '132.5 mm (3U nominal: 133.35 mm - 0.8 mm clearance)',
          'Depth': '235.0 mm',
          'Material': 'AlMgSi 0.5 (EN AW-6063)',
          'Finish': 'Clear passivated chromate (RoHS compliant)',
          'Mounting Holes': 'Standard EIA-310 spacing (46.5 mm / 44.45 mm)'
        },
        provenance: 'LIT'
      },
      {
        id: 'comp_subrack_horizontal_rails',
        name: 'Horizontal Extruded Rails (Front & Rear)',
        category: 'Structural Rail',
        description: 'Profiled aluminum rails with M2.5 threaded inserts on 1 HP (5.08 mm) pitch.',
        material: 'Anodized Aluminum',
        dimensions: { length: 426.72, unit: 'mm' },
        specifications: {
          'Usable Width': '84 HP (426.72 mm)',
          'Total Width': '482.6 mm (19 inches)',
          'Pitch': '1 HP = 5.08 mm',
          'Thread': 'M2.5 tapped hole strip'
        },
        provenance: 'LIT'
      },
      {
        id: 'comp_subrack_card_guides',
        name: 'Eurocard Guide Rails (160mm)',
        category: 'Guide Rail',
        description: 'Snap-in polycarbonate guide rails for 1.6mm PCB insertion.',
        material: 'Polycarbonate (UL 94 V-0)',
        specifications: {
          'Card Depth': '160 mm',
          'PCB Thickness': '1.6 mm ± 0.1 mm',
          'Insertion Force': 'Max 1.5 N per guide',
          'Color': 'Red / Black (Standard)'
        },
        provenance: 'LIT'
      }
    ],
    connections: [
      {
        id: 'conn_rail_to_side',
        sourceComponentId: 'comp_subrack_side_plates',
        targetComponentId: 'comp_subrack_horizontal_rails',
        type: 'mechanical',
        description: 'M4 Torx countersunk fasteners clamping rails to side panels with 2.8 N·m torque.'
      },
      {
        id: 'conn_guide_to_rail',
        sourceComponentId: 'comp_subrack_horizontal_rails',
        targetComponentId: 'comp_subrack_card_guides',
        type: 'mechanical',
        description: 'Snap-in retention clips engaging rail keyholes.'
      }
    ],
    metadata: {
      standard: 'IEC 60297-3-100',
      rackUnits: 3,
      hpWidth: 84,
      maxCardDepthMm: 160
    },
    assumptions: ['Assembly conforms to standard EIA-310-D / IEC 60297 mounting pitch.'],
    limitations: ['Thermal dissipation capacity depends on installed forced-air fan tray.'],
    createdAt: Date.now()
  },

  'ref_nema23_stepper': {
    id: 'ref_nema23_stepper',
    name: 'NEMA 23 Bipolar Hybrid Stepper Motor',
    domain: 'ELECTROMECHANICAL',
    source: 'NEMA ICS 16-2001 Standard & Manufacturer Test Curves',
    sourceType: 'STANDARDIZED_SPECIFICATION',
    referenceStandard: 'NEMA ICS 16-2001',
    fidelity: 'AUTHORITATIVE_SPECIFICATION',
    fidelityClassification: 'ENGINEERING_SPECIFICATION',
    manufacturer: 'Standard Industrial NEMA 23',
    partNumber: '23HS2430B',
    qualityTier: 'LIT',
    provenance: 'LIT',
    description: '2-phase hybrid bipolar stepper motor with 57mm square faceplate, 1.8° step angle (200 steps/rev).',
    components: [
      {
        id: 'comp_nema23_stator',
        name: 'Stator Stack & 8-Pole Windings',
        category: 'Stator Core',
        description: 'Laminated silicon steel stator stack with 2-phase 4-wire copper windings.',
        material: 'M19 Silicon Steel / Copper Wire',
        specifications: {
          'Frame Size': '57.0 mm × 57.0 mm (NEMA 23)',
          'Rated Current': '3.0 A / Phase',
          'Phase Resistance': '1.1 Ω ± 10%',
          'Phase Inductance': '2.6 mH ± 20%',
          'Insulation Class': 'Class B (130°C)'
        },
        provenance: 'LIT',
        safetyState: {
          hazardous: true,
          hazardType: 'HIGH_TEMPERATURE',
          isolationRequired: false,
          warning: 'Motor surface temperature can exceed 80°C under continuous high-torque holding current.'
        }
      },
      {
        id: 'comp_nema23_rotor',
        name: 'Hybrid Magnetic Rotor & Shaft',
        category: 'Rotor Assembly',
        description: 'Rare-earth NdFeB permanent magnet sandwiched between toothed soft-iron pole pieces on 6.35mm ground shaft.',
        material: 'NdFeB Magnet / AISI 4140 Ground Steel Shaft',
        dimensions: { diameter: 6.35, length: 20.6, unit: 'mm' },
        specifications: {
          'Shaft Diameter': '6.35 mm (1/4 inch) D-cut flat',
          'Step Angle': '1.8° ± 5% (Full Step)',
          'Holding Torque': '1.9 N·m (269 oz·in)',
          'Detent Torque': '68 mN·m',
          'Rotor Inertia': '460 g·cm²'
        },
        provenance: 'LIT'
      }
    ],
    connections: [
      {
        id: 'conn_stator_rotor_airgap',
        sourceComponentId: 'comp_nema23_stator',
        targetComponentId: 'comp_nema23_rotor',
        type: 'mechanical',
        description: '0.05 mm radial electromagnetic air gap transmitting reluctance and Lorentz torque.'
      }
    ],
    metadata: {
      stepAngleDeg: 1.8,
      ratedCurrentA: 3.0,
      holdingTorqueNm: 1.9,
      leadWires: 4
    },
    assumptions: ['Driven with constant-current bipolar chopper drive (e.g. 24V-48V DC bus).'],
    limitations: ['Torque rolls off at speeds > 1200 RPM due to back-EMF and coil inductance.'],
    createdAt: Date.now()
  },

  'ref_din_rail_psu_24v': {
    id: 'ref_din_rail_psu_24v',
    name: 'Industrial DIN-Rail Power Supply 24V DC / 5A (120W)',
    domain: 'POWER_ELECTRONICS',
    source: 'UL 508 / EN 62368-1 Industrial Power Supply Datasheet',
    sourceType: 'STANDARDIZED_SPECIFICATION',
    referenceStandard: 'EN 62368-1 / UL 508 / EN 55032 Class B',
    fidelity: 'AUTHORITATIVE_SPECIFICATION',
    fidelityClassification: 'ENGINEERING_SPECIFICATION',
    manufacturer: 'Industrial Standard Power (e.g. NDR-120-24 class)',
    partNumber: 'NDR-120-24',
    qualityTier: 'LIT',
    provenance: 'LIT',
    description: 'Slimline DIN-rail mount switched-mode AC/DC power supply delivering 24V DC at 5A continuous.',
    components: [
      {
        id: 'comp_psu_input_stage',
        name: 'AC Input Filter & Bridge Rectifier',
        category: 'Input Conditioning',
        description: 'Universal AC input stage with integrated fuse, varistor surge protection, and common-mode choke.',
        material: 'FR-4 PCB / SMT Components',
        specifications: {
          'Input Voltage Range': '90 – 264 VAC (127 – 370 VDC)',
          'Frequency Range': '47 – 63 Hz',
          'Inrush Current': '35A @ 230VAC (Cold Start)',
          'Efficiency': '88% typical at full load'
        },
        provenance: 'LIT',
        safetyState: {
          hazardous: true,
          hazardType: 'HIGH_VOLTAGE',
          isolationRequired: true,
          lockoutTagoutProcedure: [
            '1. Disconnect upstream branch circuit breaker (LOTO)',
            '2. Measure AC input terminal L/N with CAT III 600V DMM to verify 0.0V',
            '3. Wait 3 minutes for bulk electrolytic capacitors to discharge below 10V DC'
          ],
          warning: 'Mains potential (>120V/230V AC) present on primary terminal block and bulk capacitor.'
        }
      },
      {
        id: 'comp_psu_transformer_isolation',
        name: 'High-Frequency Flyback Isolation Transformer',
        category: 'Galvanic Isolation',
        description: 'Ferrite core transformer with reinforced insulation providing 3kV AC safety isolation.',
        material: 'Ferrite Core / Triple-Insulated Copper Wire',
        specifications: {
          'Isolation Voltage': '3000 VAC (Primary to Secondary)',
          'Switching Frequency': '65 kHz nominal',
          'Leakage Current': '< 1 mA @ 240VAC'
        },
        provenance: 'LIT'
      },
      {
        id: 'comp_psu_output_stage',
        name: 'Synchronous Rectifier & Output Filter',
        category: 'DC Output',
        description: 'Low-ESR secondary electrolytic filter and voltage adjustment potentiometer with DC OK dry relay contact.',
        material: 'PCB Assembly / Solid Aluminum Casing',
        specifications: {
          'Nominal Output Voltage': '24.0 VDC (Adjustable 24 – 28 VDC)',
          'Rated Output Current': '5.0 A (0 – 5A continuous)',
          'Rated Power': '120 W continuous',
          'Ripple & Noise': 'Max 100 mVp-p',
          'Overload Protection': '105 – 130% Constant Current Limiting'
        },
        provenance: 'LIT'
      }
    ],
    connections: [
      {
        id: 'conn_psu_in_to_trans',
        sourceComponentId: 'comp_psu_input_stage',
        targetComponentId: 'comp_psu_transformer_isolation',
        type: 'power',
        description: 'High-voltage rectified DC switched across primary transformer winding.'
      },
      {
        id: 'conn_psu_trans_to_out',
        sourceComponentId: 'comp_psu_transformer_isolation',
        targetComponentId: 'comp_psu_output_stage',
        type: 'power',
        description: 'Secondary induced AC rectified and filtered into regulated 24V DC output.'
      }
    ],
    metadata: {
      inputVoltage: '90-264 VAC',
      outputVoltage: '24 VDC',
      outputCurrentA: 5.0,
      mounting: 'TS-35/7.5 or TS-35/15 DIN Rail'
    },
    assumptions: ['Mounted vertically with 20mm top/bottom clearance for natural convection cooling.'],
    limitations: ['De-rates output linearly above 50°C ambient temperature.'],
    createdAt: Date.now()
  }
};

export class ReferenceModelEngine {
  /**
   * Retrieves an engineering reference model by ID.
   */
  public static getReferenceModel(id: string): ReferenceModel | null {
    return ENGINEERING_REFERENCE_CATALOG[id] || null;
  }

  /**
   * Converts a ReferenceModel into a fully qualified DigitalTwin.
   */
  public static convertToDigitalTwin(ref: ReferenceModel): DigitalTwin {
    const components: DigitalTwinComponent[] = ref.components.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      description: c.description,
      material: c.material,
      position: c.position,
      dimensions: c.dimensions,
      specifications: c.specifications,
      diagnosticState: {
        componentId: c.id,
        status: 'NORMAL',
        source: c.provenance,
        explanation: 'Reference baseline derived from verified engineering standard'
      },
      safetyState: c.safetyState
    }));

    const connections: Connection[] = ref.connections.map(c => ({
      id: c.id,
      sourceComponentId: c.sourceComponentId,
      targetComponentId: c.targetComponentId,
      type: c.type,
      description: c.description,
      nominalRating: c.nominalRating
    }));

    return {
      id: ref.id,
      name: ref.name,
      domain: ref.domain,
      description: ref.description,
      manufacturer: ref.manufacturer,
      modelNumber: ref.partNumber,
      components,
      connections,
      functions: [
        {
          id: `func_${ref.id}_primary`,
          name: `${ref.name} Core Operation`,
          category: ref.domain.includes('POWER') ? 'POWER_DELIVERY' : 'STRUCTURAL_SUPPORT',
          description: ref.description
        }
      ],
      specifications: ref.metadata,
      dataProvenance: ref.provenance === 'LIT' ? 'LIT' : 'STATIC_CAD',
      cadMetadata: {
        format: ref.sourceType === 'STEP' ? 'STEP' : 'PROCEDURAL',
        hasHierarchy: true,
        authoritativeSource: ref.source
      }
    };
  }
}
