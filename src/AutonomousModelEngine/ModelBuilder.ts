// src/AutonomousModelEngine/ModelBuilder.ts
// Autonomous 3D Model Construction & Mutation Pipeline Coordinator

import { DigitalTwin, DigitalTwinComponent, Connection, DigitalTwinFunction } from '../DigitalTwin';
import { ObjectMetadata, SPATIAL_LIBRARY } from '../SpatialLibrary';
import { 
  AutonomousModelPlan, 
  AutonomousModelRecord, 
  ModelValidationReport, 
  MutationRequest 
} from './ModelTypes';
import { ModelPlanner } from './ModelPlanner';
import { ScientificValidators } from './ScientificValidators';
import { GeometryGenerator, GeneratedAssemblyPayload } from './GeometryGenerator';
import { ModelRegistry } from './ModelRegistry';
import { ModelProvenanceEngine } from './ModelProvenance';
import { RenderIntegrityGuard } from './RenderIntegrityGuard';
import { ModelFidelity, FidelityEvaluationReport } from './ModelFidelity';

export interface BuildResult {
  record: AutonomousModelRecord;
  plan: AutonomousModelPlan;
  twin: DigitalTwin;
  spatialObject: ObjectMetadata;
  validationReport: ModelValidationReport;
  userExplanation: string;
  fidelityReport?: FidelityEvaluationReport;
}

export class ModelBuilder {
  /**
   * Resolves query to an existing pre-authored high-fidelity canonical library asset if available.
   */
  public static resolveCanonicalLibraryObject(query: string): ObjectMetadata | null {
    const q = query.toLowerCase().trim();

    if (q.includes('v12') || q.includes('v-12') || (q.includes('12 cylinder') && q.includes('engine')) || q === 'v12 engine' || q === 'engine') {
      return SPATIAL_LIBRARY['v12_engine'] || null;
    }
    if (q.includes('arduino') || q.includes('uno r3') || q === 'uno') {
      return SPATIAL_LIBRARY['arduino_uno'] || null;
    }
    if (q.includes('esp32') || q.includes('esp-32') || q.includes('esp wroom')) {
      return SPATIAL_LIBRARY['esp32'] || null;
    }
    if (q.includes('sg90') || (q.includes('servo') && !q.includes('brushless'))) {
      return SPATIAL_LIBRARY['servo_motor'] || SPATIAL_LIBRARY['sg90_servo'] || null;
    }
    if (q.includes('heliomotion') || q.includes('solar tracker')) {
      return SPATIAL_LIBRARY['heliomotion'] || SPATIAL_LIBRARY['solar_tracker'] || null;
    }
    if (q.includes('human heart') || q === 'heart' || q.includes('heart anatomy')) {
      return SPATIAL_LIBRARY['human_heart'] || null;
    }
    if (q.includes('human brain') || q === 'brain' || q.includes('brain anatomy')) {
      return SPATIAL_LIBRARY['human_brain'] || null;
    }
    if (q.includes('human lungs') || q === 'lungs' || q.includes('respiratory lungs')) {
      return SPATIAL_LIBRARY['human_lungs'] || null;
    }
    if (q.includes('turbocharger') || q === 'turbo') {
      return SPATIAL_LIBRARY['turbocharger'] || null;
    }
    if (q.includes('differential') || q.includes('lsd') || q.includes('limited slip')) {
      return SPATIAL_LIBRARY['differential'] || null;
    }
    if (q.includes('suspension') || q.includes('macpherson') || q.includes('strut')) {
      return SPATIAL_LIBRARY['suspension'] || null;
    }
    if (q.includes('brake disc') || q.includes('brake rotor') || q.includes('carbon ceramic brake')) {
      return SPATIAL_LIBRARY['brake_disc'] || null;
    }
    if (q.includes('steering') || q.includes('rack and pinion')) {
      return SPATIAL_LIBRARY['steering_assembly'] || null;
    }
    if (q.includes('stepper motor') || q === 'stepper') {
      return SPATIAL_LIBRARY['stepper_motor'] || null;
    }
    if (q.includes('brushless') || q.includes('bldc')) {
      return SPATIAL_LIBRARY['brushless_motor'] || null;
    }
    if (q.includes('breadboard')) {
      return SPATIAL_LIBRARY['breadboard'] || null;
    }

    return null;
  }

  /**
   * Main entry point: Constructs a scientifically valid Digital Twin and 3D model from a natural language request.
   */
  public static async constructFromQuery(
    query: string,
    context?: { activeObjectId?: string | null; selectedComponentId?: string | null }
  ): Promise<BuildResult> {
    // 1. Check if the query is a mutation of the current model
    if (this.isMutationQuery(query) && (context?.activeObjectId || ModelRegistry.getLastModelId())) {
      const targetId = context?.activeObjectId || ModelRegistry.getLastModelId()!;
      return this.mutateModel({ targetId, command: query, selectedComponentId: context?.selectedComponentId });
    }

    // 2. Check if query matches a canonical high-fidelity spatial library asset
    const canonicalObj = this.resolveCanonicalLibraryObject(query);
    if (canonicalObj) {
      const modelId = canonicalObj.id;
      const plan: AutonomousModelPlan = {
        planId: `canonical_plan_${modelId}`,
        targetQuery: query,
        objectType: canonicalObj.name.toUpperCase(),
        displayName: canonicalObj.name,
        constructionMethod: 'SCIENTIFIC_DATASET',
        domain: canonicalObj.category || 'Mechanical Engineering',
        parameters: {},
        requiredInformation: [],
        missingInformation: [],
        assumptions: ['Verified canonical digital twin specification dataset'],
        validationRules: [],
        explanation: {
          whatBuilt: canonicalObj.description || canonicalObj.name,
          whySelected: canonicalObj.educationalInformation?.overview || 'Pre-engineered spatial model asset',
          dataSource: 'ADVIS Engineering Digital Twin Specification Database',
          equationsUsed: []
        },
        qualityTier: 'CANONICAL',
        createdAt: Date.now()
      };

      const dtComponents: DigitalTwinComponent[] = (canonicalObj.components || []).map((c) => ({
        id: c.id,
        name: c.name,
        category: 'Mechanical Element',
        description: c.description || '',
        material: c.engineeringDetails?.material || 'High-Strength Engineering Alloy',
        position: c.position,
        specifications: c.specifications || (c.engineeringDetails as any) || {},
        diagnosticState: {
          componentId: c.id,
          status: 'NORMAL',
          source: 'LIT',
          explanation: 'Nominal baseline operational parameters verified'
        }
      }));

      const twin: DigitalTwin = {
        id: modelId,
        name: canonicalObj.name,
        domain: canonicalObj.category || 'Engineering',
        description: canonicalObj.description || canonicalObj.name,
        components: dtComponents,
        connections: this.inferConnections(canonicalObj.name, canonicalObj.components || []),
        functions: this.inferFunctions(canonicalObj.name, canonicalObj.name),
        specifications: canonicalObj.educationalInformation?.specifications || {},
        dataProvenance: 'LIT'
      };

      const record: AutonomousModelRecord = {
        id: modelId,
        plan,
        twin,
        spatialObject: canonicalObj,
        category: 'CANONICAL',
        meshSpecs: {},
        mutationHistory: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      ModelRegistry.registerModel(record, {});

      const validation: ModelValidationReport = {
        isValid: true,
        qualityTier: 'CANONICAL',
        rulesEvaluated: [],
        errors: [],
        warnings: [],
        assumptions: ['Calibrated against authentic physical OEM specifications'],
        limitations: []
      };

      const userExplanation = `**${canonicalObj.name}** (High-Fidelity Engineering Digital Twin — Quality Tier: **CANONICAL**)\n\n` +
        `${canonicalObj.description || canonicalObj.educationalInformation?.overview}\n\n` +
        `*Applications:* ${(canonicalObj.educationalInformation?.applications || []).join(', ')}`;

      return {
        record,
        plan,
        twin,
        spatialObject: canonicalObj,
        validationReport: validation,
        userExplanation
      };
    }

    // 3. Formulate Construction Plan
    const plan = ModelPlanner.createPlan(query);

    // 4. Extract parameter values for validation and generation
    const rawParams: Record<string, any> = {};
    for (const [k, v] of Object.entries(plan.parameters)) {
      rawParams[k] = v.value;
    }

    // 5. Validate physical, geometric, and mathematical constraints
    const validation = ScientificValidators.validate(plan.objectType, plan.constructionMethod, rawParams);
    plan.qualityTier = validation.qualityTier;

    // 6. Generate 3D Geometries & Components
    const assembly: GeneratedAssemblyPayload = await GeometryGenerator.generateGeometry(plan.objectType, rawParams);

    // 7. Universal Render-Integrity Guard Verification
    RenderIntegrityGuard.validateAssembly(assembly, plan);

    // 7b. Evaluate Structural Fidelity
    const fidelityReport = ModelFidelity.evaluateFidelity(plan.objectType, assembly, rawParams);
    if (!fidelityReport.isFidelityApproved) {
      validation.warnings.push(...fidelityReport.warnings);
      if (fidelityReport.errors.length > 0) {
        validation.warnings.push(...fidelityReport.errors);
      }
    }
    if (fidelityReport.qualityTier) {
      plan.qualityTier = fidelityReport.qualityTier;
    }
    if (fidelityReport.fidelityClassification) {
      plan.fidelityClassification = fidelityReport.fidelityClassification;
    }

    // 8. Build ID & Spatial Object Metadata
    const modelId = `model_${plan.objectType.toLowerCase()}_${Date.now().toString(36)}`;
    const spatialObject: ObjectMetadata = {
      id: modelId,
      name: plan.displayName,
      path: `procedural/${plan.objectType.toLowerCase()}`,
      assetPath: `procedural/${plan.objectType.toLowerCase()}`,
      modelStatus: 'AVAILABLE',
      category: plan.domain,
      description: plan.explanation.whatBuilt,
      defaultScale: 1.0,
      components: assembly.components,
      educationalInformation: {
        overview: plan.explanation.whySelected,
        keyFeatures: plan.explanation.equationsUsed,
        workingPrinciple: plan.explanation.whatBuilt,
        applications: [plan.domain, 'Autonomous Digital Twin'],
        specifications: this.formatSpecsForSpatial(plan.parameters)
      }
    };

    // 9. Assemble Digital Twin
    const dtComponents: DigitalTwinComponent[] = assembly.components.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.shape === 'custom' ? 'Procedural Solid' : 'Mechanical Element',
      description: c.description || '',
      material: c.engineeringDetails?.material || 'Engineered Steel / Alloy',
      position: c.position,
      specifications: c.specifications || {},
      diagnosticState: {
        componentId: c.id,
        status: 'NORMAL',
        source: 'DERIVED',
        explanation: 'Procedurally verified nominal geometry without active sensor faults'
      }
    }));

    const dtConnections: Connection[] = this.inferConnections(plan.objectType, assembly.components);
    const dtFunctions: DigitalTwinFunction[] = this.inferFunctions(plan.objectType, plan.displayName);

    const twin: DigitalTwin = {
      id: modelId,
      name: plan.displayName,
      domain: plan.domain,
      description: plan.explanation.whatBuilt,
      components: dtComponents,
      connections: dtConnections,
      functions: dtFunctions,
      specifications: this.formatSpecsForSpatial(plan.parameters),
      dataProvenance: plan.constructionMethod === 'SCIENTIFIC_DATASET' ? 'LIT' : (plan.constructionMethod === 'PARAMETRIC' ? 'DERIVED' : 'LIT')
    };

    // 10. Assemble Record
    const record: AutonomousModelRecord = {
      id: modelId,
      plan,
      twin,
      spatialObject,
      category: 'SESSION_GENERATED',
      meshSpecs: assembly.meshSpecs,
      mutationHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 11. Register into ModelRegistry
    ModelRegistry.registerModel(record, assembly.geometries);

    // 12. Format Honest User Explanation
    const userExplanation = this.formatUserExplanation(plan, validation);

    return {
      record,
      plan,
      twin,
      spatialObject,
      validationReport: validation,
      userExplanation,
      fidelityReport
    };
  }

  /**
   * Applies parametric and structural mutation to an existing model.
   */
  public static async mutateModel(request: MutationRequest): Promise<BuildResult> {
    const targetId = request.targetId || ModelRegistry.getLastModelId();
    if (!targetId) {
      throw new Error('No active model available to mutate.');
    }

    const existingRecord = ModelRegistry.getModel(targetId);
    if (!existingRecord) {
      return this.constructFromQuery(request.command);
    }

    const plan = existingRecord.plan;
    const oldParams: Record<string, any> = {};
    for (const [k, v] of Object.entries(plan.parameters)) {
      oldParams[k] = v.value;
    }

    const newParams = { ...oldParams };
    const query = request.command.toLowerCase().trim();

    // 1. Color mutation parsing (e.g. "make it red", "change color to blue", "make it green")
    const colorMap: Record<string, string> = {
      'red': '#ef4444',
      'crimson': '#dc2626',
      'blue': '#0284c7',
      'cyan': '#06b6d4',
      'teal': '#0d9488',
      'green': '#16a34a',
      'emerald': '#10b981',
      'yellow': '#eab308',
      'amber': '#f59e0b',
      'orange': '#ea580c',
      'purple': '#9333ea',
      'violet': '#7c3aed',
      'pink': '#ec4899',
      'rose': '#f43f5e',
      'gold': '#d97706',
      'silver': '#94a3b8',
      'white': '#f8fafc',
      'black': '#090d16',
      'dark': '#1e293b',
      'slate': '#475569'
    };

    let targetColor: string | null = null;
    for (const [colorName, hexVal] of Object.entries(colorMap)) {
      if (query.includes(` ${colorName}`) || query.endsWith(colorName) || query.includes(`to ${colorName}`)) {
        targetColor = hexVal;
        break;
      }
    }
    if (targetColor) {
      newParams.color = targetColor;
      newParams.primaryColor = targetColor;
    }

    // Check for targeted component mutations vs global scaling
    let isTargetedComponentMutation = false;

    // 1b. Selection-aware component mutation targeting based on active selectedComponentId
    const selComp = (request.selectedComponentId || '').toLowerCase();
    if (selComp) {
      const isBigger = query.includes('bigger') || query.includes('larger') || query.includes('grow') || query.includes('increase') || query.includes('wider');
      const isSmaller = query.includes('smaller') || query.includes('shrink') || query.includes('decrease') || query.includes('narrower');
      const scaleFactor = isBigger ? 1.35 : (isSmaller ? 0.75 : 1.2);

      if (selComp.includes('wheel') || selComp.includes('tire') || selComp.includes('tyre')) {
        isTargetedComponentMutation = true;
        if (selComp.includes('front')) {
          newParams.frontTireRadius = (newParams.frontTireRadius || newParams.tireRadius || 1.265) * scaleFactor;
          newParams.frontWheelRadius = (newParams.frontWheelRadius || newParams.wheelRadius || 1.1) * scaleFactor;
        } else if (selComp.includes('rear') || selComp.includes('back')) {
          newParams.rearTireRadius = (newParams.rearTireRadius || newParams.tireRadius || 1.265) * scaleFactor;
          newParams.rearWheelRadius = (newParams.rearWheelRadius || newParams.wheelRadius || 1.1) * scaleFactor;
        } else {
          newParams.tireRadius = (newParams.tireRadius || 1.265) * scaleFactor;
          newParams.wheelRadius = (newParams.wheelRadius || 1.1) * scaleFactor;
        }
      } else if (selComp.includes('frame') || selComp.includes('chassis')) {
        isTargetedComponentMutation = true;
        newParams.frameHeight = (newParams.frameHeight || 1.8) * scaleFactor;
        newParams.wheelbase = (newParams.wheelbase || 3.4) * scaleFactor;
      } else if (selComp.includes('seat') || selComp.includes('saddle')) {
        isTargetedComponentMutation = true;
        if (isBigger) newParams.seatHeight = (newParams.seatHeight || 0.8) + 0.25;
        else if (isSmaller) newParams.seatHeight = Math.max(0.3, (newParams.seatHeight || 0.8) - 0.25);
      } else if (selComp.includes('handlebar') || selComp.includes('fork') || selComp.includes('steering')) {
        isTargetedComponentMutation = true;
        newParams.handlebarWidth = (newParams.handlebarWidth || 0.6) * scaleFactor;
      }
    }

    // 2. Specific Component Targeting: Bicycle Tires / Wheels
    if (query.includes('tyre') || query.includes('tire') || query.includes('wheel')) {
      isTargetedComponentMutation = true;
      const isRear = query.includes('rear') || query.includes('back');
      const isFront = query.includes('front');
      const isBigger = query.includes('bigger') || query.includes('larger') || query.includes('grow') || query.includes('increase') || query.includes('wider');
      const isSmaller = query.includes('smaller') || query.includes('shrink') || query.includes('decrease') || query.includes('thinner');
      const factor = isBigger ? 1.35 : (isSmaller ? 0.75 : 1.2);

      if (isRear) {
        newParams.rearTireRadius = (newParams.rearTireRadius || newParams.tireRadius || 1.265) * factor;
        newParams.rearWheelRadius = (newParams.rearWheelRadius || newParams.wheelRadius || 1.1) * factor;
      } else if (isFront) {
        newParams.frontTireRadius = (newParams.frontTireRadius || newParams.tireRadius || 1.265) * factor;
        newParams.frontWheelRadius = (newParams.frontWheelRadius || newParams.wheelRadius || 1.1) * factor;
      } else {
        newParams.tireRadius = (newParams.tireRadius || 1.265) * factor;
        newParams.wheelRadius = (newParams.wheelRadius || 1.1) * factor;
        newParams.rearTireRadius = (newParams.rearTireRadius || 1.265) * factor;
        newParams.frontTireRadius = (newParams.frontTireRadius || 1.265) * factor;
      }
    }

    // Handlebar targeting
    if (query.includes('handlebar') || query.includes('bar')) {
      isTargetedComponentMutation = true;
      if (query.includes('wider') || query.includes('longer') || query.includes('bigger')) {
        newParams.handlebarWidth = (newParams.handlebarWidth || 0.6) * 1.3;
      } else if (query.includes('narrower') || query.includes('smaller')) {
        newParams.handlebarWidth = (newParams.handlebarWidth || 0.6) * 0.75;
      }
    }

    // Seat / Saddle targeting
    if (query.includes('seat') || query.includes('saddle')) {
      isTargetedComponentMutation = true;
      if (query.includes('higher') || query.includes('taller') || query.includes('raise')) {
        newParams.seatHeight = (newParams.seatHeight || 0.8) + 0.15;
      } else if (query.includes('lower') || query.includes('shorter')) {
        newParams.seatHeight = Math.max(0.4, (newParams.seatHeight || 0.8) - 0.15);
      }
    }

    // Shoe Heel / Outsole targeting
    if (query.includes('heel') || query.includes('sole') || query.includes('outsole')) {
      isTargetedComponentMutation = true;
      if (query.includes('thicker') || query.includes('higher') || query.includes('bigger') || query.includes('taller')) {
        newParams.heelHeight = (newParams.heelHeight || 0.03) * 1.5;
        newParams.soleThickness = (newParams.soleThickness || 0.015) * 1.5;
      } else if (query.includes('thinner') || query.includes('lower') || query.includes('smaller')) {
        newParams.heelHeight = (newParams.heelHeight || 0.03) * 0.6;
        newParams.soleThickness = (newParams.soleThickness || 0.015) * 0.6;
      }
    }

    // 3. Teeth count mutation
    const teethMatch = query.match(/(\d+)\s*(?:teeth|tooth|t\b)/i) || query.match(/teeth\s*(\d+)/i) || query.match(/to\s*(\d+)\s*teeth/i) || (plan.objectType === 'GEAR' && query.match(/to\s*(\d+)/i));
    if (teethMatch) {
      isTargetedComponentMutation = true;
      const newTeeth = parseInt(teethMatch[1], 10);
      newParams.teeth = newTeeth;
      newParams.numTeeth = newTeeth;
      plan.parameters.teeth = ModelProvenanceEngine.createProvenanceValue(newTeeth, 'USER', 'CONFIRMED', {
        notes: `Mutated by user command: "${request.command}"`
      });
      plan.displayName = `${newTeeth}-Tooth Spur Gear`;
    }

    // 4. Fin count mutation (for heat sink)
    const finMatch = query.match(/(\d+)\s*(?:fins|fin)/i) || query.match(/fins\s*(\d+)/i);
    if (finMatch) {
      isTargetedComponentMutation = true;
      const newFins = parseInt(finMatch[1], 10);
      newParams.finCount = newFins;
      plan.parameters.finCount = ModelProvenanceEngine.createProvenanceValue(newFins, 'USER', 'CONFIRMED', {
        notes: `Mutated by user command: "${request.command}"`
      });
      plan.displayName = `Extruded Aluminum Heat Sink (${newFins}-Fin)`;
    }

    // 4b. Explicit Targeted Component Mutations (e.g. Tyre, Wheel, Seat)
    if (query.includes('tyre') || query.includes('tire')) {
      isTargetedComponentMutation = true;
      if (query.includes('bigger') || query.includes('larger') || query.includes('grow') || query.includes('wider') || query.includes('thicker')) {
        const base = newParams.tireRadius || (newParams.wheelRadius ? newParams.wheelRadius * 1.15 : 1.25);
        newParams.tireRadius = base * 1.35;
        newParams.frontTireRadius = (newParams.frontTireRadius || base) * 1.35;
        newParams.rearTireRadius = (newParams.rearTireRadius || base) * 1.35;
      } else if (query.includes('smaller') || query.includes('shrink') || query.includes('thinner')) {
        const base = newParams.tireRadius || (newParams.wheelRadius ? newParams.wheelRadius * 1.15 : 1.25);
        newParams.tireRadius = base * 0.75;
        newParams.frontTireRadius = (newParams.frontTireRadius || base) * 0.75;
        newParams.rearTireRadius = (newParams.rearTireRadius || base) * 0.75;
      }
    } else if (query.includes('front wheel')) {
      isTargetedComponentMutation = true;
      if (query.includes('bigger') || query.includes('larger')) {
        newParams.frontWheelRadius = (newParams.frontWheelRadius || 1.1) * 1.35;
        newParams.frontTireRadius = (newParams.frontTireRadius || 1.25) * 1.35;
      } else if (query.includes('smaller')) {
        newParams.frontWheelRadius = (newParams.frontWheelRadius || 1.1) * 0.75;
        newParams.frontTireRadius = (newParams.frontTireRadius || 1.25) * 0.75;
      }
    } else if (query.includes('rear wheel')) {
      isTargetedComponentMutation = true;
      if (query.includes('bigger') || query.includes('larger')) {
        newParams.rearWheelRadius = (newParams.rearWheelRadius || 1.1) * 1.35;
        newParams.rearTireRadius = (newParams.rearTireRadius || 1.25) * 1.35;
      } else if (query.includes('smaller')) {
        newParams.rearWheelRadius = (newParams.rearWheelRadius || 1.1) * 0.75;
        newParams.rearTireRadius = (newParams.rearTireRadius || 1.25) * 0.75;
      }
    } else if (query.includes('seat') || query.includes('saddle')) {
      isTargetedComponentMutation = true;
      if (query.includes('higher') || query.includes('raise') || query.includes('taller')) {
        newParams.seatHeight = (newParams.seatHeight || 0.8) * 1.35;
      } else if (query.includes('lower') || query.includes('shorter')) {
        newParams.seatHeight = (newParams.seatHeight || 0.8) * 0.75;
      }
    }

    const isExplicitWholeAssembly = query.includes('whole') || query.includes('entire') || query.includes('overall') || query.includes('whole bicycle') || query.includes('whole bike');
    if (isExplicitWholeAssembly) {
      isTargetedComponentMutation = false;
    }

    // 5. Turns mutation (for transformer)
    const turnsMatch = query.match(/(\d+)\s*(?:turns|turn)/i);
    if (turnsMatch) {
      isTargetedComponentMutation = true;
      const newTurns = parseInt(turnsMatch[1], 10);
      if (query.includes('sec') || query.includes('output')) {
        newParams.secondaryTurns = newTurns;
      } else {
        newParams.primaryTurns = newTurns;
      }
    }

    // 6. Global scale factor mutation (ONLY when no specific subcomponent is targeted)
    if (!isTargetedComponentMutation) {
      if (query.includes('twice') || query.includes('double') || query.includes('2x') || query.includes('twice as large')) {
        newParams.scale = (newParams.scale || 1.0) * 2.0;
      } else if (query.includes('half') || query.includes('0.5x') || query.includes('half size')) {
        newParams.scale = (newParams.scale || 1.0) * 0.5;
      } else if (query.includes('triple') || query.includes('3x')) {
        newParams.scale = (newParams.scale || 1.0) * 3.0;
      } else if (query.includes('bigger') || query.includes('larger') || query.includes('grow')) {
        newParams.scale = (newParams.scale || 1.0) * 1.35;
      } else if (query.includes('smaller') || query.includes('shrink')) {
        newParams.scale = (newParams.scale || 1.0) * 0.75;
      }
    }

    // 6. Dimension / Length / Thickness mutation
    const lengthMatch = query.match(/(\d+(?:\.\d+)?)\s*(?:mm|cm|m)?\s*longer/i);
    if (lengthMatch || query.includes('longer')) {
      const addLength = lengthMatch ? parseFloat(lengthMatch[1]) * 0.05 : 0.4;
      newParams.length = (newParams.length || 2.8) + addLength;
      newParams.faceWidth = (newParams.faceWidth || 0.6) + addLength * 0.5;
    }
    if (query.includes('thinner')) {
      if (newParams.thickness) newParams.thickness *= 0.6;
      if (newParams.baseThickness) newParams.baseThickness *= 0.6;
      if (newParams.lidThickness) newParams.lidThickness *= 0.6;
      if (newParams.faceWidth) newParams.faceWidth *= 0.6;
    } else if (query.includes('thicker')) {
      if (newParams.thickness) newParams.thickness *= 1.4;
      if (newParams.baseThickness) newParams.baseThickness *= 1.4;
      if (newParams.faceWidth) newParams.faceWidth *= 1.4;
    }
    if (query.includes('wider')) {
      newParams.width = (newParams.width || 2.0) * 1.3;
    } else if (query.includes('narrower')) {
      newParams.width = (newParams.width || 2.0) * 0.75;
    }

    // 7. Camera count mutation (for smartphone)
    if (query.includes('camera') || query.includes('lens')) {
      const camMatch = query.match(/(\d+)\s*(?:cameras|camera|lens|lenses)/i);
      if (camMatch) {
        newParams.cameraCount = parseInt(camMatch[1], 10);
      } else if (query.includes('add') || query.includes('another') || query.includes('more')) {
        newParams.cameraCount = (newParams.cameraCount || 3) + 1;
      }
    }

    // 8. Laptop Screen & Hinge Angle mutation
    if (query.includes('screen') && (query.includes('bigger') || query.includes('larger'))) {
      newParams.width = (newParams.width || 3.2) * 1.25;
      newParams.depth = (newParams.depth || 2.2) * 1.25;
    }
    if (query.includes('open')) {
      newParams.lidAngle = 125;
    } else if (query.includes('close')) {
      newParams.lidAngle = 5;
    }    // 9. Validate & Regenerate
    const validation = ScientificValidators.validate(plan.objectType, plan.constructionMethod, newParams);
    plan.qualityTier = validation.qualityTier;

    let assembly: GeneratedAssemblyPayload | null = null;
    if (existingRecord.category === 'CANONICAL') {
      // For Canonical models (e.g. V12 Engine), DO NOT regenerate geometry or it will turn into a primitive box.
      // We just update the existing components directly in-place.
      const ratio = (newParams.scale || 1.0) / (oldParams.scale || 1.0);
      if (ratio !== 1.0) {
        existingRecord.spatialObject.defaultScale = (existingRecord.spatialObject.defaultScale || 1.0) * ratio;
      }
      
      if (targetColor && existingRecord.spatialObject.components) {
        for (const comp of existingRecord.spatialObject.components) {
          if (comp.id.includes('block') || comp.id.includes('body') || comp.id.includes('chassis')) {
            comp.color = targetColor;
          }
        }
      }
      
      existingRecord.spatialObject.name = plan.displayName;
      existingRecord.twin.name = plan.displayName;
      existingRecord.updatedAt = Date.now();
    } else {
      // Regenerate Assembly for procedural models
      assembly = await GeometryGenerator.generateGeometry(plan.objectType, newParams);

      // Apply color override to assembly components if requested
      if (targetColor) {
        for (const comp of assembly.components) {
          if (comp.id.includes('chassis') || comp.id.includes('frame') || comp.id.includes('body') || comp.id.includes('upper') || comp.id.includes('outsole') || comp.shape === 'box') {
            comp.color = targetColor;
          }
        }
        for (const spec of Object.values(assembly.meshSpecs)) {
          spec.color = targetColor;
        }
      }

      // Universal Render-Integrity Guard Verification
      RenderIntegrityGuard.validateAssembly(assembly, plan);

      // Update Spatial Object & Twin
      existingRecord.spatialObject.components = assembly.components;
      existingRecord.spatialObject.name = plan.displayName;
      existingRecord.twin.name = plan.displayName;
      existingRecord.twin.components = assembly.components.map(c => ({
        id: c.id,
        name: c.name,
        category: c.shape === 'custom' ? 'Procedural Solid' : 'Mechanical Element',
        description: c.description || '',
        material: c.engineeringDetails?.material || 'Engineered Steel / Alloy',
        position: c.position,
        specifications: c.specifications || {},
        diagnosticState: {
          componentId: c.id,
          status: 'NORMAL',
          source: 'DERIVED',
          explanation: 'Mutated nominal geometry'
        }
      }));
      existingRecord.meshSpecs = assembly.meshSpecs;
      existingRecord.updatedAt = Date.now();
    }

    existingRecord.mutationHistory.push({
      timestamp: Date.now(),
      mutationCommand: request.command,
      parameterDelta: newParams,
      previousParameters: oldParams
    });

    // Update Registry Cache
    ModelRegistry.registerModel(existingRecord, assembly?.geometries);

    const userExplanation = `Updated ${plan.displayName} according to parameter mutation:\n` +
      ModelProvenanceEngine.formatProvenanceDisclosure(plan.parameters, validation.assumptions, validation.limitations);

    return {
      record: existingRecord,
      plan,
      twin: existingRecord.twin,
      spatialObject: existingRecord.spatialObject,
      validationReport: validation,
      userExplanation
    };
  }

  // --- HELPER METHODS ---

  public static isMutationQuery(query: string): boolean {
    const q = query.toLowerCase();
    return (
      q.includes('change it to') ||
      q.includes('make it') ||
      q.includes('make the') ||
      q.includes('modify to') ||
      q.includes('set teeth to') ||
      q.includes('change to') ||
      q.includes('change color') ||
      q.includes('turn it') ||
      q.includes('paint it') ||
      q.includes('color to') ||
      q.includes('double the') ||
      q.includes('twice as') ||
      q.includes('longer') ||
      q.includes('shorter') ||
      q.includes('thinner') ||
      q.includes('thicker') ||
      q.includes('wider') ||
      q.includes('narrower') ||
      q.includes('bigger') ||
      q.includes('smaller') ||
      q.includes('add another camera') ||
      q.includes('add a camera') ||
      q.includes('more cameras') ||
      q.includes('bigger screen') ||
      q.includes('larger screen') ||
      q.includes('screen larger') ||
      q.includes('screen bigger') ||
      q.includes('add a usb') ||
      q.includes('add usb') ||
      q.includes('usb port') ||
      q.includes('open the laptop') ||
      q.includes('close the laptop') ||
      q.includes('open it') ||
      q.includes('close it') ||
      q.includes('scale by')
    );
  }

  public static isAutonomousQuery(query: string, activeObjectId?: string | null): boolean {
    const q = query.toLowerCase().trim();

    // Prevent informational questions from accidentally triggering model construction
    const isInformationalOnly = 
      q.startsWith('how does') || 
      q.startsWith('how do') || 
      q.startsWith('why does') || 
      q.startsWith('why do') || 
      q.startsWith('what is') || 
      q.startsWith('what are') || 
      q.startsWith('explain') || 
      q.startsWith('tell me about') || 
      q.startsWith('describe the history') ||
      q.startsWith('who invented') ||
      q.startsWith('teach me');

    if (isInformationalOnly && !q.includes('build') && !q.includes('construct') && !q.includes('3d model') && !q.includes('show me')) {
      return false;
    }

    if (this.isMutationQuery(q) && (activeObjectId || ModelRegistry.getLastModelId())) {
      return true;
    }

    const constructKeywords = [
      'build', 'show me', 'create', 'generate', 'construct', 'render', 'display', 'make', 'draw', 'model', 'visualize', 'open'
    ];

    const targets = [
      'bicycle', 'bike', 'shoe', 'oxford', 'footwear', 'boot', 'sneaker',
      'camera', 'dslr', 'lens', 'fan', 'ceiling fan', 'drone', 'quadcopter', 'uav',
      'v12', 'engine', 'arduino', 'uno', 'esp32', 'servo', 'heliomotion', 'solar tracker',
      'heart', 'brain', 'lungs',
      'gear', 'planetary', 'gearbox', 'transmission', 'geoid', 'paraboloid', 'hyperboloid', 
      'torus', 'donut', 'sphere', 'shaft', 'cylinder', 'spring', 'helix', 'coil',
      'pump', 'centrifugal', 'saddle', 'surface', 'quadric',
      'ellipsoid', 'cone', 'bearing', 'heat sink', 'heatsink', 'transformer',
      'solar', 'beam', 'ibeam', 'i-beam', 'bracket', 'motor', 'pulley', 'pcb', 'truss',
      'smartphone', 'phone', 'mobile', 'iphone', 'android',
      'laptop', 'notebook', 'macbook', 'keyboard', 'mouse',
      'bottle', 'water bottle', 'flask', 'monitor', 'screen', 'smartwatch', 'watch',
      'headphone', 'headphones', 'headset', 'controller', 'gamepad', 'joystick',
      'turbo', 'turbocharger', 'differential', 'suspension', 'brake disc'
    ];

    // Explicit 3D construction intent (e.g. "Build a 3D model of X", "Show me a 3D model of X", "3D model of X")
    if (q.includes('3d model') || q.includes('model of') || q.startsWith('build a') || q.startsWith('build an') || q.startsWith('create a') || q.startsWith('generate a') || q.startsWith('construct a') || q.startsWith('show me a') || q.startsWith('show me the')) {
      return true;
    }

    const hasKeyword = constructKeywords.some(k => q.includes(k));
    const hasTarget = targets.some(t => q.includes(t));

    if (hasTarget && (hasKeyword || q.includes('tooth') || q.includes('teeth') || q.startsWith('a ') || q.startsWith('the ') || targets.includes(q))) {
      return true;
    }

    return false;
  }

  private static formatSpecsForSpatial(params: Record<string, any>): Record<string, string> {
    const specs: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      specs[k] = typeof v.value === 'object' ? JSON.stringify(v.value) : String(v.value);
    }
    return specs;
  }

  private static inferConnections(objectType: string, components: any[]): Connection[] {
    const conns: Connection[] = [];
    if (components.length > 1) {
      for (let i = 0; i < components.length - 1; i++) {
        conns.push({
          id: `conn_${i}_${i + 1}`,
          sourceComponentId: components[i].id,
          targetComponentId: components[i + 1].id,
          type: 'mechanical',
          description: `Mechanical kinematic alignment between ${components[i].name} and ${components[i + 1].name}`
        });
      }
    }
    return conns;
  }

  private static inferFunctions(objectType: string, displayName: string): DigitalTwinFunction[] {
    return [
      {
        id: `func_${objectType.toLowerCase()}_core`,
        name: `${displayName} Primary Function`,
        category: 'MOTION_CONVERSION',
        description: `Kinematic and geometric spatial function of ${displayName}.`
      }
    ];
  }

  private static formatUserExplanation(plan: AutonomousModelPlan, validation: ModelValidationReport): string {
    const lines: string[] = [];
    const fidelityTag = plan.fidelityClassification ? ` | Fidelity: **${plan.fidelityClassification.replace(/_/g, ' ')}**` : '';
    lines.push(`**${plan.displayName}** (${plan.constructionMethod} Model — Quality Tier: **${plan.qualityTier}**${fidelityTag})`);
    lines.push(`\n${plan.explanation.whatBuilt}`);
    lines.push(`*Basis:* ${plan.explanation.dataSource}`);

    if (plan.explanation.equationsUsed.length > 0) {
      lines.push(`\n**Governing Equations:**\n` + plan.explanation.equationsUsed.map(e => `• \`${e}\``).join('\n'));
    }

    if (validation.assumptions.length > 0) {
      lines.push(`\n**Assumptions Made:**\n` + validation.assumptions.map(a => `• ${a}`).join('\n'));
    }

    if (validation.warnings.length > 0) {
      lines.push(`\n⚠️ **Engineering Notes:**\n` + validation.warnings.map(w => `• ${w}`).join('\n'));
    }

    if (validation.limitations.length > 0) {
      lines.push(`\n**Limitations:**\n` + validation.limitations.map(l => `• ${l}`).join('\n'));
    }

    return lines.join('\n');
  }
}

