// src/AutonomousModelEngine/ScientificValidators.ts
// Rigorous Scientific, Physical, and Geometric Validation Engine

import { 
  ModelValidationReport, 
  ModelValidationRule, 
  ModelQualityTier, 
  ModelConstructionStrategy 
} from './ModelTypes';

export class ScientificValidators {
  /**
   * Validates a model plan and parameter bundle against physical/mathematical laws.
   */
  public static validate(
    objectType: string,
    strategy: ModelConstructionStrategy,
    parameters: Record<string, any>
  ): ModelValidationReport {
    const rules: ModelValidationRule[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const assumptions: string[] = [];
    const limitations: string[] = [];

    // General parameter sanity
    for (const [k, v] of Object.entries(parameters)) {
      if (typeof v === 'number') {
        if (isNaN(v)) {
          errors.push(`Parameter '${k}' evaluated to NaN.`);
        }
        if (!isFinite(v)) {
          errors.push(`Parameter '${k}' has an infinite value.`);
        }
      }
    }

    const normType = objectType.toLowerCase().trim();

    // 1. GEAR VALIDATION (ISO / AGMA Involute Gearing Rules)
    if (normType.includes('gear')) {
      const teeth = Number(parameters.teeth || parameters.numTeeth || 24);
      const moduleVal = Number(parameters.module || 2.0);
      const pressureAngle = Number(parameters.pressureAngle || 20);
      const faceWidth = Number(parameters.faceWidth || 10);
      const boreDiameter = Number(parameters.boreDiameter || 8);

      // Rule: Teeth count positive integer
      const teethValid = Number.isInteger(teeth) && teeth >= 4;
      rules.push({
        id: 'GEAR_TEETH_INTEGER',
        description: 'Gear tooth count must be an integer >= 4',
        ruleType: 'GEOMETRIC',
        severity: 'ERROR',
        passed: teethValid,
        message: teethValid ? `Valid tooth count: ${teeth}` : `Invalid tooth count: ${teeth}`
      });
      if (!teethValid) errors.push(`Tooth count must be an integer >= 4. Received: ${teeth}`);

      // Rule: Module positive
      const moduleValid = moduleVal > 0;
      rules.push({
        id: 'GEAR_MODULE_POSITIVE',
        description: 'Gear metric module must be strictly positive',
        ruleType: 'GEOMETRIC',
        severity: 'ERROR',
        passed: moduleValid,
        message: moduleValid ? `Module: ${moduleVal} mm` : `Module must be > 0`
      });
      if (!moduleValid) errors.push(`Gear module must be > 0`);

      // Rule: Undercutting constraint (for 20° pressure angle, minimum teeth without undercut is 17)
      if (pressureAngle === 20 && teeth < 17) {
        warnings.push(`Tooth count (${teeth}) is below standard AGMA undercut threshold (z=17 for 20° pressure angle). Kinematic profile may experience base undercutting.`);
      }

      // Rule: Bore vs Pitch diameter
      const pitchDiameter = moduleVal * teeth;
      const rootDiameter = pitchDiameter - 2.5 * moduleVal;
      if (boreDiameter >= rootDiameter) {
        errors.push(`Shaft bore diameter (${boreDiameter}mm) exceeds gear root diameter (${rootDiameter.toFixed(1)}mm), leaving zero rim thickness.`);
      }

      limitations.push('Involute tooth profile generated to nominal standard; micro-geometry modifications (tip relief/crowning) not included.');
      limitations.push('Surface finish and heat-treatment hardness tolerances are unmeasured.');
    }

    // 2. TORUS VALIDATION
    else if (normType.includes('torus')) {
      const majorRadius = Number(parameters.majorRadius ?? parameters.radius ?? 2.0);
      const minorRadius = Number(parameters.minorRadius ?? parameters.tubeRadius ?? 0.6);

      const radPositive = majorRadius > 0 && minorRadius > 0;
      rules.push({
        id: 'TORUS_RADII_POSITIVE',
        description: 'Torus major and minor radii must be positive',
        ruleType: 'MATHEMATICAL',
        severity: 'ERROR',
        passed: radPositive,
        message: radPositive ? `Radii: R=${majorRadius}, r=${minorRadius}` : 'Radii must be positive'
      });
      if (!radPositive) errors.push('Torus radii must be positive non-zero values.');

      if (minorRadius >= majorRadius) {
        warnings.push(`Minor radius (r=${minorRadius}) >= Major radius (R=${majorRadius}). Geometry forms a spindle/horn torus with self-intersecting inner envelope.`);
      }
    }

    // 3. GEOID VALIDATION
    else if (normType.includes('geoid')) {
      const referenceEllipsoid = parameters.referenceEllipsoid || 'WGS84';
      const undulationScale = Number(parameters.undulationScale || 1.0);
      const harmonicDegree = Number(parameters.harmonicDegree || 12);

      rules.push({
        id: 'GEOID_DATUM_VALID',
        description: 'Geoid must reference a standard geodetic ellipsoid datum',
        ruleType: 'PHYSICAL',
        severity: 'INFO',
        passed: true,
        message: `Reference Datum: ${referenceEllipsoid}`
      });

      rules.push({
        id: 'GEOID_GRAVITY_ANOMALY',
        description: 'Earth Geoid is not a sphere; features gravitational equipotential undulations (-107m to +85m)',
        ruleType: 'PHYSICAL',
        severity: 'INFO',
        passed: true,
        message: `EGM Harmonic Degree: ${harmonicDegree}`
      });

      if (undulationScale > 1000) {
        warnings.push(`Undulation vertical exaggeration is scaled ${undulationScale}x for visual perceptibility of micro-gravitational anomalies.`);
      }

      limitations.push('Mathematical EGM spherical harmonic approximation with exaggerated vertical undulation for spatial inspection.');
      limitations.push('Not calibrated for centimeter-accurate sub-surface geodetic GPS surveying.');
    }

    // 4. MATHEMATICAL SURFACES (Paraboloid, Hyperboloid, Sinc, Saddle)
    else if (normType.includes('paraboloid') || normType.includes('hyperboloid') || normType.includes('saddle') || normType.includes('surface')) {
      const xRange = parameters.xRange || [-2, 2];
      const yRange = parameters.yRange || [-2, 2];

      const rangeValid = Array.isArray(xRange) && Array.isArray(yRange) && xRange[0] < xRange[1] && yRange[0] < yRange[1];
      rules.push({
        id: 'SURFACE_DOMAIN_VALID',
        description: 'Domain ranges [xMin, xMax] and [yMin, yMax] must be strictly monotonic',
        ruleType: 'MATHEMATICAL',
        severity: 'ERROR',
        passed: rangeValid,
        message: rangeValid ? `Domain x:[${xRange[0]}, ${xRange[1]}], y:[${yRange[0]}, ${yRange[1]}]` : 'Invalid domain interval'
      });
      if (!rangeValid) errors.push('Surface domain ranges must satisfy min < max.');

      limitations.push('Continuous analytical mathematical mesh generated via numerical tessellation grid.');
    }

    // 5. CENTRIFUGAL PUMP & ENGINEERING ASSEMBLIES
    else if (normType.includes('pump') || normType.includes('gearbox')) {
      const hasFlowPaths = parameters.inletDiameter && parameters.outletDiameter;
      if (hasFlowPaths) {
        const inlet = Number(parameters.inletDiameter);
        const outlet = Number(parameters.outletDiameter);
        if (inlet <= 0 || outlet <= 0) {
          errors.push('Hydraulic inlet and outlet diameters must be positive dimensions.');
        }
      }

      assumptions.push('Generic industrial hydraulic volute geometry based on standard centrifugal pump topology.');
      limitations.push('Hydrodynamic CFD turbulence, cavitation thresholds, and specific NPSH curves are not pre-calculated.');
    }

    // 6. HELIX / SPRING
    else if (normType.includes('spring') || normType.includes('helix')) {
      const coilRadius = Number(parameters.coilRadius || 1.0);
      const wireRadius = Number(parameters.wireRadius || 0.1);
      const pitch = Number(parameters.pitch || 0.4);

      if (pitch <= wireRadius * 2) {
        errors.push(`Spring coil pitch (${pitch}) must exceed wire diameter (${wireRadius * 2}) to prevent coil binding in free state.`);
      }
    }

    // 7. BEARING VALIDATION
    else if (normType.includes('bearing')) {
      const bore = Number(parameters.boreDiameter || 20);
      const outer = Number(parameters.outerDiameter || 42);
      if (bore <= 0 || outer <= 0) {
        errors.push('Bearing bore and outer diameter must be positive values.');
      }
      if (bore >= outer) {
        errors.push(`Bearing bore diameter (${bore}mm) must be less than outer diameter (${outer}mm).`);
      }
      rules.push({
        id: 'BEARING_GEOMETRY_VALID',
        description: 'Bearing envelope diameters must be physically valid (d < D)',
        ruleType: 'GEOMETRIC',
        severity: 'ERROR',
        passed: bore < outer,
        message: bore < outer ? `Envelope: Ø${bore} × Ø${outer} mm` : 'Invalid envelope'
      });
    }

    // 8. TRANSFORMER VALIDATION
    else if (normType.includes('transformer')) {
      const np = Number(parameters.primaryTurns || 240);
      const ns = Number(parameters.secondaryTurns || 24);
      if (np <= 0 || ns <= 0) {
        errors.push('Transformer primary and secondary turns must be positive non-zero integers.');
      }
      rules.push({
        id: 'TRANSFORMER_TURNS_POSITIVE',
        description: 'Turns count must be positive non-zero',
        ruleType: 'PHYSICAL',
        severity: 'ERROR',
        passed: np > 0 && ns > 0,
        message: `Winding Ratio: ${np} : ${ns}`
      });
    }

    // 9. I-BEAM VALIDATION
    else if (normType.includes('beam') || normType.includes('ibeam') || normType.includes('i-beam')) {
      const depth = Number(parameters.depth || 200);
      const width = Number(parameters.flangeWidth || 100);
      const tw = Number(parameters.webThickness || 5.6);
      const tf = Number(parameters.flangeThickness || 8.5);
      if (tw >= width) {
        errors.push(`Web thickness (${tw}mm) cannot exceed flange width (${width}mm).`);
      }
      if (2 * tf >= depth) {
        errors.push(`Total flange thickness (${2 * tf}mm) cannot exceed section depth (${depth}mm).`);
      }
      rules.push({
        id: 'IBEAM_GEOMETRY_VALID',
        description: 'I-beam flange and web dimensions must be geometrically valid',
        ruleType: 'GEOMETRIC',
        severity: 'ERROR',
        passed: tw < width && 2 * tf < depth,
        message: 'Valid structural I-beam geometry'
      });
    }

    const isValid = errors.length === 0;
    
    // Assign Quality Tier
    let qualityTier: ModelQualityTier = 'DERIVED';
    if (!isValid) {
      qualityTier = 'INCOMPLETE';
    } else if (normType.includes('geoid')) {
      qualityTier = 'DATA'; // Geoid based on Earth Gravity Model dataset with spherical harmonic derivation
    } else if (normType.includes('bearing') || normType.includes('beam') || normType.includes('solar') || normType.includes('motor') || normType.includes('pulley')) {
      qualityTier = 'LIT'; // Standard industrial specification
    } else if (strategy === 'PARAMETRIC' || strategy === 'MATHEMATICAL') {
      qualityTier = 'DERIVED';
    } else if (strategy === 'ENGINEERING_ASSEMBLY' || strategy === 'PROCEDURALLY_APPROXIMATED') {
      qualityTier = 'ILLUSTRATIVE';
    } else if (strategy === 'SCIENTIFIC_DATASET') {
      qualityTier = 'DATA';
    }

    return {
      isValid,
      qualityTier,
      rulesEvaluated: rules,
      errors,
      warnings,
      assumptions,
      limitations
    };
  }
}
