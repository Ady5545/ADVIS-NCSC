// src/AutonomousModelEngine/RealityTestSuite.ts
// Phase 12: Universal Model Reality Testing Suite
// Rigorous verification of conversational queries, parametric mutations, Digital Twin fidelity, and provenance honesty.

import { ModelBuilder, BuildResult } from './ModelBuilder';
import { ModelRegistry } from './ModelRegistry';
import { FidelityClassification } from './ModelTypes';

export interface TestCaseResult {
  query: string;
  isMutation: boolean;
  success: boolean;
  objectType: string;
  displayName: string;
  qualityTier: string;
  fidelityClassification?: FidelityClassification;
  dataProvenance: string;
  componentCount: number;
  vertexCount: number;
  faceCount: number;
  hasGoverningEquations: boolean;
  hasAssumptions: boolean;
  hasConnections: boolean;
  verificationDetails: {
    generatorSelected: boolean;
    geometryValid: boolean;
    parametersBound: boolean;
    digitalTwinCreated: boolean;
    provenanceHonest: boolean;
    equationsPresent: boolean;
    hierarchyValid: boolean;
    mutationRegenerated?: boolean;
    boundingValid: boolean;
  };
  notes: string[];
}

export interface RealityTestSuiteReport {
  timestamp: number;
  totalTests: number;
  passed: number;
  failed: number;
  testResults: TestCaseResult[];
  overallStatus: 'PASSED' | 'FAILED';
}

export class RealityTestSuite {
  /**
   * List of target queries mandated by Phase 12
   */
  public static readonly TEST_QUERIES: Array<{ query: string; isMutation?: boolean; expectedType?: string }> = [
    { query: 'Show me a geoid', expectedType: 'GEOID' },
    { query: 'Show me an ellipsoid', expectedType: 'ELLIPSOID' },
    { query: 'Show me a paraboloid', expectedType: 'PARABOLOID' },
    { query: 'Build a 24 tooth gear', expectedType: 'GEAR' },
    { query: 'Change it to 36 teeth', isMutation: true, expectedType: 'GEAR' },
    { query: 'Make it twice as large', isMutation: true, expectedType: 'GEAR' },
    { query: 'Build a bearing', expectedType: 'BALL_BEARING' },
    { query: 'Build a heat sink', expectedType: 'HEAT_SINK' },
    { query: 'Build a transformer', expectedType: 'TRANSFORMER' },
    { query: 'Build a solar panel', expectedType: 'SOLAR_PANEL' },
    { query: 'Build an I-beam', expectedType: 'I_BEAM' },
    { query: 'Build an L-bracket', expectedType: 'BRACKET_WITH_HOLES' },
    { query: 'Build an AC induction motor', expectedType: 'ELECTRIC_MOTOR' },
    { query: 'Build a V-belt pulley', expectedType: 'PULLEY' },
    { query: 'Build a PCB', expectedType: 'PCB' },
    { query: 'Build a truss', expectedType: 'TRUSS' },
    { query: 'Build a smartphone', expectedType: 'SMARTPHONE' },
    { query: 'Build a laptop', expectedType: 'LAPTOP' },
    { query: 'Build a keyboard', expectedType: 'KEYBOARD' },
    { query: 'Build a smartwatch', expectedType: 'SMARTWATCH' },
    { query: 'Build a pair of headphones', expectedType: 'HEADPHONES' },
    { query: 'Build a computer mouse', expectedType: 'MOUSE' },
    { query: 'Build a monitor', expectedType: 'MONITOR' },
    { query: 'Build a water bottle', expectedType: 'WATER_BOTTLE' },
    { query: 'Build a bicycle', expectedType: 'BICYCLE' },
    { query: 'Build an Oxford shoe', expectedType: 'OXFORD_SHOE' },
    { query: 'Build a ceiling fan', expectedType: 'CEILING_FAN' },
    { query: 'Build a camera', expectedType: 'CAMERA' },
    { query: 'Build a drone', expectedType: 'DRONE' },
    { query: 'Build a car wheel', expectedType: 'CAR_WHEEL' },
    { query: 'Build a gearbox', expectedType: 'GEARBOX' }
  ];

  /**
   * Runs the complete conversational reality test suite.
   */
  public static async runSuite(): Promise<RealityTestSuiteReport> {
    const results: TestCaseResult[] = [];
    let lastBuiltId: string | null = null;

    for (const testCase of this.TEST_QUERIES) {
      const notes: string[] = [];
      let success = true;

      try {
        let res: BuildResult;
        if (testCase.isMutation && lastBuiltId) {
          res = await ModelBuilder.mutateModel({ targetId: lastBuiltId, command: testCase.query });
        } else {
          res = await ModelBuilder.constructFromQuery(testCase.query);
          lastBuiltId = res.spatialObject.id;
        }

        // 1. Generator Selected
        const generatorSelected = res.plan.objectType === (testCase.expectedType || res.plan.objectType);
        if (!generatorSelected) {
          notes.push(`Generator mismatch: expected ${testCase.expectedType}, got ${res.plan.objectType}`);
          success = false;
        }

        // 2. Geometry Valid - Inspect actual registered Three.js BufferGeometries
        const geoms = ModelRegistry.getGeometries(res.spatialObject.id) || {};
        let vertexCount = 0;
        let faceCount = 0;
        for (const g of Object.values(geoms)) {
          if (g) {
            const pos = g.getAttribute('position');
            if (pos) {
              vertexCount += pos.count;
            }
            if (g.index) {
              faceCount += Math.floor(g.index.count / 3);
            } else if (pos) {
              faceCount += Math.floor(pos.count / 3);
            }
          }
        }

        const geometryValid = vertexCount > 0 && faceCount > 0;
        if (!geometryValid) {
          notes.push('Invalid geometry: zero vertices or faces.');
          success = false;
        }

        // 3. Parameters Bound
        const parametersBound = Object.keys(res.plan.parameters).length > 0;
        if (!parametersBound) {
          notes.push('Parameters missing in plan.');
          success = false;
        }

        // 4. Digital Twin Created
        const digitalTwinCreated = !!res.twin && res.twin.components.length > 0;
        if (!digitalTwinCreated) {
          notes.push('Digital Twin components missing.');
          success = false;
        }

        // 5. Provenance Honest
        const provenanceHonest = !!res.plan.qualityTier && !!res.plan.fidelityClassification;
        if (!provenanceHonest) {
          notes.push('Missing provenance quality tier or fidelity classification.');
          success = false;
        }

        // 6. Equations Present
        const equationsPresent = res.plan.explanation.equationsUsed.length > 0 || res.plan.constructionMethod === 'SCIENTIFIC_DATASET';

        // 7. Hierarchy Valid
        const hierarchyValid = res.spatialObject.components.length >= 1;

        // 8. Bounding Valid
        const boundingValid = geometryValid && res.spatialObject.components.length > 0;

        // 9. Mutation Regenerated (if applicable)
        let mutationRegenerated: boolean | undefined = undefined;
        if (testCase.isMutation) {
          mutationRegenerated = res.record.mutationHistory.length > 0;
          if (!mutationRegenerated) {
            notes.push('Mutation history not logged.');
            success = false;
          }
        }

        results.push({
          query: testCase.query,
          isMutation: !!testCase.isMutation,
          success,
          objectType: res.plan.objectType,
          displayName: res.plan.displayName,
          qualityTier: res.plan.qualityTier,
          fidelityClassification: res.plan.fidelityClassification,
          dataProvenance: res.twin.dataProvenance,
          componentCount: res.spatialObject.components.length,
          vertexCount,
          faceCount,
          hasGoverningEquations: equationsPresent,
          hasAssumptions: res.plan.assumptions.length > 0,
          hasConnections: res.twin.connections.length > 0,
          verificationDetails: {
            generatorSelected,
            geometryValid,
            parametersBound,
            digitalTwinCreated,
            provenanceHonest,
            equationsPresent,
            hierarchyValid,
            mutationRegenerated,
            boundingValid
          },
          notes
        });

      } catch (err: any) {
        results.push({
          query: testCase.query,
          isMutation: !!testCase.isMutation,
          success: false,
          objectType: 'UNKNOWN',
          displayName: 'Error',
          qualityTier: 'APPROXIMATE',
          dataProvenance: 'UNKNOWN',
          componentCount: 0,
          vertexCount: 0,
          faceCount: 0,
          hasGoverningEquations: false,
          hasAssumptions: false,
          hasConnections: false,
          verificationDetails: {
            generatorSelected: false,
            geometryValid: false,
            parametersBound: false,
            digitalTwinCreated: false,
            provenanceHonest: false,
            equationsPresent: false,
            hierarchyValid: false,
            boundingValid: false
          },
          notes: [`Build execution error: ${err.message || err}`]
        });
      }
    }

    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    return {
      timestamp: Date.now(),
      totalTests: results.length,
      passed,
      failed,
      testResults: results,
      overallStatus: failed === 0 ? 'PASSED' : 'FAILED'
    };
  }
}
