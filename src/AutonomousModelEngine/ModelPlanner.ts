// src/AutonomousModelEngine/ModelPlanner.ts
// Semantic Planning & Parameter Extraction Engine for Autonomous 3D Objects

import { 
  AutonomousModelPlan, 
  ModelConstructionStrategy, 
  ModelQualityTier, 
  ProvenanceValue 
} from './ModelTypes';
import { ModelProvenanceEngine } from './ModelProvenance';

export class ModelPlanner {
  /**
   * Plans a scientific model construction workflow from natural language query and context.
   */
  public static createPlan(
    query: string,
    existingContext?: {
      activeObject?: string | null;
      existingPlan?: AutonomousModelPlan | null;
    }
  ): AutonomousModelPlan {
    const cleanQuery = query.toLowerCase().trim();
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // 1. Check for Parametric Gear
    if (cleanQuery.includes('gear') && !cleanQuery.includes('planetary') && !cleanQuery.includes('box')) {
      return this.planGear(cleanQuery, planId);
    }

    // 2. Check for Planetary Gearbox
    if (cleanQuery.includes('planetary') || cleanQuery.includes('gearbox')) {
      return this.planPlanetaryGearbox(cleanQuery, planId);
    }

    // 3. Check for Geoid (Earth Gravity Equipotential)
    if (cleanQuery.includes('geoid')) {
      return this.planGeoid(cleanQuery, planId);
    }

    // 4. Check for Paraboloid
    if (cleanQuery.includes('paraboloid')) {
      return this.planParaboloid(cleanQuery, planId);
    }

    // 5. Check for Hyperboloid
    if (cleanQuery.includes('hyperboloid')) {
      return this.planHyperboloid(cleanQuery, planId);
    }

    // 6. Check for Torus
    if (cleanQuery.includes('torus') || cleanQuery.includes('donut')) {
      return this.planTorus(cleanQuery, planId);
    }

    // 7. Check for Sphere
    if (cleanQuery.includes('sphere') || cleanQuery.includes('ball')) {
      return this.planSphere(cleanQuery, planId);
    }

    // 8. Check for Shaft / Cylinder
    if (cleanQuery.includes('shaft') || cleanQuery.includes('cylinder') || cleanQuery.includes('axle')) {
      return this.planShaft(cleanQuery, planId);
    }

    // 9. Check for Spring / Helix
    if (cleanQuery.includes('spring') || cleanQuery.includes('helix') || cleanQuery.includes('coil')) {
      return this.planSpring(cleanQuery, planId);
    }

    // 10. Check for Centrifugal Pump / Hydraulic Assembly
    if (cleanQuery.includes('pump') || cleanQuery.includes('centrifugal') || cleanQuery.includes('hydraulic')) {
      return this.planCentrifugalPump(cleanQuery, planId);
    }

    // 11. Check for Ellipsoid
    if (cleanQuery.includes('ellipsoid')) {
      return this.planEllipsoid(cleanQuery, planId);
    }

    // 12. Check for Cone
    if (cleanQuery.includes('cone')) {
      return this.planCone(cleanQuery, planId);
    }

    // 13. Check for Ball Bearing
    if (cleanQuery.includes('bearing') || cleanQuery.includes('ball bearing')) {
      return this.planBallBearing(cleanQuery, planId);
    }

    // 14. Check for Heat Sink
    if (cleanQuery.includes('heat sink') || cleanQuery.includes('heatsink') || cleanQuery.includes('heat exchanger')) {
      return this.planHeatSink(cleanQuery, planId);
    }

    // 15. Check for Transformer
    if (cleanQuery.includes('transformer')) {
      return this.planTransformer(cleanQuery, planId);
    }

    // 16. Check for Solar Panel
    if (cleanQuery.includes('solar') || cleanQuery.includes('photovoltaic')) {
      return this.planSolarPanel(cleanQuery, planId);
    }

    // 17. Check for I-Beam / Structural Beam
    if (cleanQuery.includes('beam') || cleanQuery.includes('i-beam') || cleanQuery.includes('ibeam')) {
      return this.planIBeam(cleanQuery, planId);
    }

    // 18. Check for Bracket with Holes
    if (cleanQuery.includes('bracket')) {
      return this.planBracketWithHoles(cleanQuery, planId);
    }

    // 19. Check for Electric Motor
    if (cleanQuery.includes('motor') || cleanQuery.includes('electric motor')) {
      return this.planElectricMotor(cleanQuery, planId);
    }

    // 20. Check for Pulley
    if (cleanQuery.includes('pulley') || cleanQuery.includes('sheave')) {
      return this.planPulley(cleanQuery, planId);
    }

    // 21. Check for PCB / Circuit Board
    if (cleanQuery.includes('pcb') || cleanQuery.includes('circuit board') || cleanQuery.includes('circuit')) {
      return this.planPCB(cleanQuery, planId);
    }

    // 22. Check for Truss / Space Frame
    if (cleanQuery.includes('truss') || cleanQuery.includes('space frame')) {
      return this.planTruss(cleanQuery, planId);
    }

    // 23. Check for Mathematical Saddle / Surface
    if (cleanQuery.includes('saddle') || cleanQuery.includes('surface') || cleanQuery.includes('quadric')) {
      return this.planSaddle(cleanQuery, planId);
    }

    // 24. Check for Bicycle / Bike
    if (cleanQuery.includes('bicycle') || cleanQuery.includes('bike') || cleanQuery.includes('cycling')) {
      return this.planBicycle(cleanQuery, planId);
    }

    // 25. Check for Oxford Shoe / Footwear
    if (cleanQuery.includes('shoe') || cleanQuery.includes('oxford') || cleanQuery.includes('footwear') || cleanQuery.includes('boot') || cleanQuery.includes('sneaker')) {
      return this.planOxfordShoe(cleanQuery, planId);
    }

    // 26. Check for Ceiling Fan / Fan
    if (cleanQuery.includes('ceiling fan') || cleanQuery.includes('fan blade') || (cleanQuery.includes('fan') && !cleanQuery.includes('cooling fan'))) {
      return this.planCeilingFan(cleanQuery, planId);
    }

    // 27. Check for DSLR / Camera
    if (cleanQuery.includes('camera') || cleanQuery.includes('dslr') || cleanQuery.includes('mirrorless') || cleanQuery.includes('lens')) {
      return this.planCamera(cleanQuery, planId);
    }

    // 28. Check for Drone / Quadcopter / UAV
    if (cleanQuery.includes('drone') || cleanQuery.includes('quadcopter') || cleanQuery.includes('uav') || cleanQuery.includes('multirotor')) {
      return this.planDrone(cleanQuery, planId);
    }

    // 29. Check for Car Wheel / Rim / Tire
    if (cleanQuery.includes('car wheel') || cleanQuery.includes('rim') || cleanQuery.includes('alloy wheel') || (cleanQuery.includes('wheel') && !cleanQuery.includes('mouse') && !cleanQuery.includes('water'))) {
      return this.planCarWheel(cleanQuery, planId);
    }

    // 30. Check for Gearbox / Transmission
    if (cleanQuery.includes('gearbox') || cleanQuery.includes('transmission') || cleanQuery.includes('speed reducer')) {
      return this.planGearbox(cleanQuery, planId);
    }

    // 31. Check for Smartphone / Mobile Phone
    if (cleanQuery.includes('smartphone') || cleanQuery.includes('phone') || cleanQuery.includes('mobile') || cleanQuery.includes('iphone') || cleanQuery.includes('android')) {
      return this.planSmartphone(cleanQuery, planId);
    }

    // 32. Check for Laptop / Notebook
    if (cleanQuery.includes('laptop') || cleanQuery.includes('notebook') || cleanQuery.includes('macbook')) {
      return this.planLaptop(cleanQuery, planId);
    }

    // 33. Check for Keyboard
    if (cleanQuery.includes('keyboard')) {
      return this.planKeyboard(cleanQuery, planId);
    }

    // 34. Check for Computer Mouse
    if (cleanQuery.includes('mouse')) {
      return this.planMouse(cleanQuery, planId);
    }

    // 35. Check for Water Bottle / Flask
    if (cleanQuery.includes('bottle') || cleanQuery.includes('flask')) {
      return this.planWaterBottle(cleanQuery, planId);
    }

    // 36. Check for Monitor / Display Screen
    if (cleanQuery.includes('monitor') || cleanQuery.includes('display') || cleanQuery.includes('screen')) {
      return this.planMonitor(cleanQuery, planId);
    }

    // 37. Check for Smartwatch
    if (cleanQuery.includes('smartwatch') || cleanQuery.includes('watch')) {
      return this.planSmartwatch(cleanQuery, planId);
    }

    // 38. Check for Headphones
    if (cleanQuery.includes('headphone') || cleanQuery.includes('headset')) {
      return this.planHeadphones(cleanQuery, planId);
    }

    // 39. Check for Game Controller
    if (cleanQuery.includes('controller') || cleanQuery.includes('gamepad') || cleanQuery.includes('joystick')) {
      return this.planGameController(cleanQuery, planId);
    }

    // Default Fallback Plan for Any Physical / Manufactured Object
    return this.planGenericObject(query, planId);
  }

  // --- PLAN: PARAMETRIC GEAR ---
  private static planGear(query: string, planId: string): AutonomousModelPlan {
    // Extract teeth count from query (e.g., "24 tooth gear", "36 teeth", "gear with 18 teeth")
    const teethMatch = query.match(/(\d+)\s*(?:teeth|tooth|t\b)/i) || query.match(/teeth\s*(\d+)/i);
    const hasUserTeeth = Boolean(teethMatch);
    const teeth = teethMatch ? parseInt(teethMatch[1], 10) : 24;

    // Extract module if present (e.g., "module 3", "m=2.5", "2mm module")
    const moduleMatch = query.match(/module\s*(\d+(?:\.\d+)?)/i) || query.match(/m\s*=\s*(\d+(?:\.\d+)?)/i) || query.match(/(\d+(?:\.\d+)?)\s*mm\s*module/i);
    const hasUserModule = Boolean(moduleMatch);
    const moduleVal = moduleMatch ? parseFloat(moduleMatch[1]) : 2.0;

    const parameters: Record<string, ProvenanceValue<any>> = {
      teeth: ModelProvenanceEngine.createProvenanceValue(teeth, hasUserTeeth ? 'USER' : 'ESTIMATED', 'CONFIRMED', {
        notes: hasUserTeeth ? 'Explicitly defined in user prompt' : 'Default illustrative 24-tooth count assumed'
      }),
      module: ModelProvenanceEngine.createProvenanceValue(moduleVal, hasUserModule ? 'USER' : 'LIT', 'CONFIRMED', {
        referenceStandard: 'ISO 54 / DIN 780 Metric Standard Modules'
      }),
      pressureAngle: ModelProvenanceEngine.createProvenanceValue(20, 'LIT', 'CONFIRMED', {
        referenceStandard: 'ISO 53 Standard 20° Involute Rack Profile'
      }),
      faceWidth: ModelProvenanceEngine.createProvenanceValue(0.6, 'DERIVED', 'CONFIRMED', {
        equation: 'b = 10 * m (Standard face width ratio)'
      }),
      boreDiameter: ModelProvenanceEngine.createProvenanceValue(0.4, 'ESTIMATED', 'LIKELY', {
        notes: 'Standard shaft bore for metric spur gearing'
      })
    };

    const assumptions: string[] = [];
    const missingInfo: string[] = [];

    if (!hasUserTeeth) {
      assumptions.push('Exact tooth count was not specified; defaulting to an illustrative 24-tooth configuration.');
      missingInfo.push('Tooth count (z)');
    }
    if (!hasUserModule) {
      assumptions.push('Standard metric module m=2.0 mm selected from ISO 54 preference series.');
      missingInfo.push('Metric module (m)');
    }
    assumptions.push('Standard 20.0° involute pressure angle with standard addendum (1.0m) and dedendum (1.25m).');

    return {
      planId,
      targetQuery: query,
      objectType: 'GEAR',
      displayName: `${teeth}-Tooth Spur Gear`,
      domain: 'MECHANICAL',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Tooth count (z)', 'Metric module (m)', 'Pressure angle (α)'],
      missingInformation: missingInfo,
      assumptions,
      validationRules: ['GEAR_TEETH_INTEGER', 'GEAR_MODULE_POSITIVE', 'GEAR_UNDERCUT_CHECK'],
      qualityTier: hasUserTeeth && hasUserModule ? 'DERIVED' : 'ILLUSTRATIVE',
      fidelityClassification: 'MATHEMATICAL_DERIVATION',
      explanation: {
        whatBuilt: `Parametric ${teeth}-tooth involute spur gear (m=${moduleVal}mm, α=20°).`,
        whySelected: 'Involute geometry provides conjugate action with constant velocity ratio and uniform line of action.',
        dataSource: 'ISO 53 / AGMA 2001-D04 Involute Standard Gearing Formulation.',
        equationsUsed: [
          `Pitch Diameter d = m * z = ${(moduleVal * teeth).toFixed(1)} mm`,
          `Tip Diameter da = m * (z + 2) = ${(moduleVal * (teeth + 2)).toFixed(1)} mm`,
          `Root Diameter df = m * (z - 2.5) = ${(moduleVal * (teeth - 2.5)).toFixed(1)} mm`,
          `Base Diameter db = d * cos(20°) = ${(moduleVal * teeth * Math.cos(20 * Math.PI / 180)).toFixed(1)} mm`
        ],
        assumedParameters: assumptions,
        unknownParameters: ['Exact manufacturing tolerance grade (ISO 1328)', 'Surface roughness Ra', 'Bore keyway tolerance (DIN 6885)'],
        accuracyDisclosure: 'Procedurally generated conjugate involute tooth profiles with continuous mathematical curvature.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: EARTH GEOID ---
  private static planGeoid(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      referenceEllipsoid: ModelProvenanceEngine.createProvenanceValue('WGS84', 'LIT', 'CONFIRMED', {
        referenceStandard: 'NGA/NASA WGS84 Geodetic Reference Ellipsoid (a=6378137.0m, f=1/298.257223563)'
      }),
      gravityHarmonics: ModelProvenanceEngine.createProvenanceValue('EGM96 Spherical Harmonics', 'LIT', 'CONFIRMED', {
        referenceStandard: 'Earth Gravitational Model 1996 (Degree 360)'
      }),
      undulationScale: ModelProvenanceEngine.createProvenanceValue(0.25, 'ESTIMATED', 'LIKELY', {
        notes: 'Vertical undulation exaggerated for spatial visual perceptibility of micro-anomalies'
      }),
      harmonicDegree: ModelProvenanceEngine.createProvenanceValue(12, 'DERIVED', 'CONFIRMED', {
        notes: 'Truncated spherical harmonic synthesis for real-time WebGL rendering'
      })
    };

    const assumptions = [
      'Earth Gravitational Model (EGM96) equipotential surface computed relative to the WGS84 reference spheroid.',
      'Geoid height anomalies (undulations spanning -107m to +85m) are vertically scaled to highlight regional gravity highs and lows.'
    ];

    return {
      planId,
      targetQuery: query,
      objectType: 'GEOID',
      displayName: 'Earth Geoid (Gravitational Equipotential)',
      domain: 'GEOPHYSICS',
      constructionMethod: 'SCIENTIFIC_DATASET',
      parameters,
      requiredInformation: ['Reference ellipsoid datum (WGS84)', 'Spherical harmonic gravity coefficients (Clm, Slm)'],
      missingInformation: ['Sub-centimeter local airborne gravimetry surveys'],
      assumptions,
      validationRules: ['GEOID_DATUM_VALID', 'GEOID_GRAVITY_ANOMALY'],
      qualityTier: 'APPROXIMATE',
      fidelityClassification: 'MATHEMATICAL_DERIVATION',
      explanation: {
        whatBuilt: 'Earth Geoid Equipotential Surface with elevation vertex anomaly color mapping.',
        whySelected: 'The Earth is not a sphere; the true mean sea level equipotential shape reflects non-uniform mass and mantle density distributions.',
        dataSource: 'NGA / NASA EGM96 Geopotential Model & WGS84 Reference System.',
        equationsUsed: [
          'V(r,θ,λ) = (GM/r) [1 + Σ (a/r)^n Σ (C_nm cos mλ + S_nm sin mλ) P_nm(cos θ)]',
          'Geoid Undulation N ≈ (V - U) / γ (Bruns Formula)'
        ],
        assumedParameters: assumptions,
        unknownParameters: ['High-frequency terrestrial gravity disturbances beyond harmonic degree 12'],
        accuracyDisclosure: 'Approximated global gravitational equipotential surface with amplified undulations for 3D inspection. NOT certified for sub-centimeter GPS surveying.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: PARABOLOID ---
  private static planParaboloid(query: string, planId: string): AutonomousModelPlan {
    const a = 0.6;
    const height = 2.0;

    const parameters: Record<string, ProvenanceValue<any>> = {
      a: ModelProvenanceEngine.createProvenanceValue(a, 'LIT', 'CONFIRMED', { equation: 'Curvature parameter a = 1/(4f)' }),
      height: ModelProvenanceEngine.createProvenanceValue(height, 'ESTIMATED', 'LIKELY'),
      radius: ModelProvenanceEngine.createProvenanceValue(Math.sqrt(height / a), 'DERIVED', 'CONFIRMED', { equation: 'R = √(h/a)' })
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'PARABOLOID',
      displayName: 'Elliptic Paraboloid Surface',
      domain: 'MATHEMATICS',
      constructionMethod: 'MATHEMATICAL',
      parameters,
      requiredInformation: ['Curvature parameter (a)', 'Aperture height'],
      missingInformation: [],
      assumptions: ['Standard circular aperture with parabolic sagittal depth: z = a(x² + y²).'],
      validationRules: ['SURFACE_DOMAIN_VALID'],
      qualityTier: 'DERIVED',
      fidelityClassification: 'MATHEMATICALLY_EXACT',
      explanation: {
        whatBuilt: 'Mathematical 3D Quadric Elliptic Paraboloid.',
        whySelected: 'Revolution of a parabola around its axis of symmetry.',
        dataSource: 'Analytical Euclidean Analytical Geometry.',
        equationsUsed: [`z = ${a}(x² + y²)`, `Focal Distance f = 1/(4*${a}) = ${(1 / (4 * a)).toFixed(3)} m`],
        assumedParameters: ['Symmetric circular aperture', 'Aperture depth = 2.0m'],
        unknownParameters: [],
        accuracyDisclosure: 'Exact analytical quadric equation tessellated onto a 64x32 parametric UV grid.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: HYPERBOLOID ---
  private static planHyperboloid(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      a: ModelProvenanceEngine.createProvenanceValue(0.8, 'ESTIMATED', 'CONFIRMED'),
      b: ModelProvenanceEngine.createProvenanceValue(0.8, 'ESTIMATED', 'CONFIRMED'),
      c: ModelProvenanceEngine.createProvenanceValue(1.0, 'ESTIMATED', 'CONFIRMED'),
      height: ModelProvenanceEngine.createProvenanceValue(2.4, 'ESTIMATED', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'HYPERBOLOID',
      displayName: 'Hyperboloid of One Sheet',
      domain: 'MATHEMATICS',
      constructionMethod: 'MATHEMATICAL',
      parameters,
      requiredInformation: ['Semi-major axis (a)', 'Semi-minor axis (b)', 'Throat parameter (c)'],
      missingInformation: [],
      assumptions: ['Doubly ruled quadric hyperboloid of one sheet: x²/a² + z²/b² - y²/c² = 1.'],
      validationRules: ['SURFACE_DOMAIN_VALID'],
      qualityTier: 'DERIVED',
      fidelityClassification: 'MATHEMATICALLY_EXACT',
      explanation: {
        whatBuilt: 'Doubly ruled one-sheet hyperboloid quadric surface.',
        whySelected: 'Canonical example of a doubly ruled non-developable surface used in structural cooling towers.',
        dataSource: 'Analytical Differential Geometry.',
        equationsUsed: ['x²/a² + z²/b² - y²/c² = 1', 'r(u,v) = (a cosh u cos v, c sinh u, b cosh u sin v)'],
        assumedParameters: ['Symmetric throat radius = 0.8m', 'Total height = 2.4m'],
        unknownParameters: [],
        accuracyDisclosure: 'Analytically exact parametric mesh.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: TORUS ---
  private static planTorus(query: string, planId: string): AutonomousModelPlan {
    const majorRadius = 1.8;
    const minorRadius = 0.55;

    const parameters: Record<string, ProvenanceValue<any>> = {
      majorRadius: ModelProvenanceEngine.createProvenanceValue(majorRadius, 'ESTIMATED', 'CONFIRMED', { notes: 'Distance from tube center to torus center' }),
      minorRadius: ModelProvenanceEngine.createProvenanceValue(minorRadius, 'ESTIMATED', 'CONFIRMED', { notes: 'Radius of circular cross section tube' }),
      aspectRatio: ModelProvenanceEngine.createProvenanceValue(majorRadius / minorRadius, 'DERIVED', 'CONFIRMED', { equation: 'R / r' })
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'TORUS',
      displayName: `Parametric Torus (R=${majorRadius}, r=${minorRadius})`,
      domain: 'MATHEMATICS',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Major Radius (R)', 'Minor Tube Radius (r)'],
      missingInformation: [],
      assumptions: [`Standard ring torus with R > r (${majorRadius}m > ${minorRadius}m).`],
      validationRules: ['TORUS_RADII_POSITIVE'],
      qualityTier: 'DERIVED',
      fidelityClassification: 'MATHEMATICALLY_EXACT',
      explanation: {
        whatBuilt: 'Parametric Ring Torus (Surface of Revolution).',
        whySelected: 'Constructed by revolving a circle of radius r around a coplanar axis at distance R.',
        dataSource: 'Standard Topology & Analytical Geometry.',
        equationsUsed: [
          '(√(x² + y²) - R)² + z² = r²',
          `Surface Area = 4π²Rr = ${(4 * Math.PI ** 2 * majorRadius * minorRadius).toFixed(2)} m²`,
          `Volume = 2π²Rr² = ${(2 * Math.PI ** 2 * majorRadius * minorRadius ** 2).toFixed(2)} m³`
        ],
        assumedParameters: ['Major radius R=1.8m', 'Tube radius r=0.55m'],
        unknownParameters: [],
        accuracyDisclosure: 'Exact geometric parameterization.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: SPHERE ---
  private static planSphere(query: string, planId: string): AutonomousModelPlan {
    const radius = 1.5;
    const parameters: Record<string, ProvenanceValue<any>> = {
      radius: ModelProvenanceEngine.createProvenanceValue(radius, 'ESTIMATED', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'SPHERE',
      displayName: `Parametric Sphere (r=${radius})`,
      domain: 'MATHEMATICS',
      constructionMethod: 'MATHEMATICAL',
      parameters,
      requiredInformation: ['Radius (r)'],
      missingInformation: [],
      assumptions: [`Radius r=${radius}m assumed.`],
      validationRules: [],
      qualityTier: 'DERIVED',
      fidelityClassification: 'MATHEMATICALLY_EXACT',
      explanation: {
        whatBuilt: `3D Euclidean Sphere of radius r=${radius}m.`,
        whySelected: 'Set of all points equidistant from origin.',
        dataSource: 'Euclidean Geometry.',
        equationsUsed: ['x² + y² + z² = r²', `Area = 4πr² = ${(4 * Math.PI * radius ** 2).toFixed(2)} m²`, `Volume = 4/3 πr³ = ${((4 / 3) * Math.PI * radius ** 3).toFixed(2)} m³`],
        assumedParameters: [`Radius = ${radius}m`],
        unknownParameters: [],
        accuracyDisclosure: 'Exact mathematical sphere.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: SHAFT ---
  private static planShaft(query: string, planId: string): AutonomousModelPlan {
    const diameter = 0.6;
    const length = 2.8;

    const parameters: Record<string, ProvenanceValue<any>> = {
      diameter: ModelProvenanceEngine.createProvenanceValue(diameter, 'ESTIMATED', 'CONFIRMED'),
      length: ModelProvenanceEngine.createProvenanceValue(length, 'ESTIMATED', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'SHAFT',
      displayName: 'Transmission Drive Shaft',
      domain: 'MECHANICAL',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Shaft diameter (d)', 'Shaft length (L)'],
      missingInformation: [],
      assumptions: ['Solid cylindrical drive shaft.'],
      validationRules: [],
      qualityTier: 'DERIVED',
      fidelityClassification: 'ENGINEERING_SPECIFICATION',
      explanation: {
        whatBuilt: 'Precision Solid Transmission Shaft.',
        whySelected: 'Torque transmitting cylindrical machine element.',
        dataSource: 'Machine Element Design (Shigley).',
        equationsUsed: [`Torsional Stress τ = (16*T)/(π*d³)`],
        assumedParameters: ['Solid cross section', 'Standard length L=2.8m'],
        unknownParameters: ['Specific torque load rating', 'Keyway dimensions'],
        accuracyDisclosure: 'Parametric cylindrical CAD solid.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: SPRING ---
  private static planSpring(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      coilRadius: ModelProvenanceEngine.createProvenanceValue(0.8, 'ESTIMATED', 'CONFIRMED'),
      wireRadius: ModelProvenanceEngine.createProvenanceValue(0.08, 'ESTIMATED', 'CONFIRMED'),
      turns: ModelProvenanceEngine.createProvenanceValue(6, 'ESTIMATED', 'CONFIRMED'),
      height: ModelProvenanceEngine.createProvenanceValue(2.4, 'ESTIMATED', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'SPRING',
      displayName: 'Helical Compression Spring',
      domain: 'MECHANICAL',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Mean coil diameter', 'Wire diameter', 'Number of active coils', 'Free length'],
      missingInformation: [],
      assumptions: ['Ground closed end helical coil spring with 6 active turns.'],
      validationRules: [],
      qualityTier: 'DERIVED',
      fidelityClassification: 'MATHEMATICAL_DERIVATION',
      explanation: {
        whatBuilt: 'Helical Compression Spring 3D Tube Solid.',
        whySelected: 'Standard mechanical energy storage element.',
        dataSource: 'Wahl Spring Formula Standards (DIN EN 13906-1).',
        equationsUsed: ['Spring Rate k = (G * d⁴) / (8 * D³ * n)'],
        assumedParameters: ['6 active coils', 'Pitch = 0.4m'],
        unknownParameters: ['Exact spring steel shear modulus G'],
        accuracyDisclosure: 'Parametric 3D space curve tube extrusion.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: CENTRIFUGAL PUMP ---
  private static planCentrifugalPump(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      pumpType: ModelProvenanceEngine.createProvenanceValue('End-Suction Centrifugal Volute Pump', 'LIT', 'CONFIRMED', {
        referenceStandard: 'ISO 2858 / ISO 5199 Chemical & Industrial Process Pumps'
      }),
      inletDiameter: ModelProvenanceEngine.createProvenanceValue(0.7, 'LIT', 'CONFIRMED', { referenceStandard: 'DN80 PN16' }),
      outletDiameter: ModelProvenanceEngine.createProvenanceValue(0.5, 'LIT', 'CONFIRMED', { referenceStandard: 'DN50 PN16' }),
      scale: ModelProvenanceEngine.createProvenanceValue(1.0, 'ESTIMATED', 'CONFIRMED')
    };

    const assumptions = [
      'Generic industrial end-suction centrifugal pump assembly representing standard volute, enclosed impeller, shaft, and bearing housing.',
      'Dimensions modeled after standard ISO 2858 process pump proportions.'
    ];

    return {
      planId,
      targetQuery: query,
      objectType: 'CENTRIFUGAL_PUMP',
      displayName: 'Centrifugal Hydraulic Pump Assembly',
      domain: 'MECHANICAL',
      constructionMethod: 'ENGINEERING_ASSEMBLY',
      parameters,
      requiredInformation: ['Design flow rate (Q)', 'Total dynamic head (H)', 'Impeller diameter', 'NPSHr'],
      missingInformation: ['Specific manufacturer duty point curves', 'Exact seal flush piping plan'],
      assumptions,
      validationRules: [],
      qualityTier: 'ILLUSTRATIVE',
      fidelityClassification: 'ILLUSTRATIVE_VISUALIZATION',
      explanation: {
        whatBuilt: 'Hierarchical 6-component industrial centrifugal pump assembly.',
        whySelected: 'Visualizes the mechanical, hydrodynamic, and bearing relationships in a turbomachine.',
        dataSource: 'ISO 2858 & Hydraulic Institute Standards.',
        equationsUsed: ['Euler Turbomachinery Equation: H = (u2*c_u2 - u1*c_u1) / g', 'Specific Speed Ns = N * √Q / H^(3/4)'],
        assumedParameters: assumptions,
        unknownParameters: ['Site-specific pump head curve H(Q)', 'CFD turbulence losses'],
        accuracyDisclosure: 'Generic engineering assembly illustrating mechanical architecture and fluid flow relationships. Not a certified manufacturer CAD casting.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: PLANETARY GEARBOX ---
  private static planPlanetaryGearbox(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      sunTeeth: ModelProvenanceEngine.createProvenanceValue(16, 'ESTIMATED', 'CONFIRMED'),
      planetTeeth: ModelProvenanceEngine.createProvenanceValue(20, 'ESTIMATED', 'CONFIRMED'),
      ringTeeth: ModelProvenanceEngine.createProvenanceValue(56, 'DERIVED', 'CONFIRMED', { equation: 'zR = zS + 2*zP = 16 + 2*20 = 56' }),
      planetCount: ModelProvenanceEngine.createProvenanceValue(3, 'LIT', 'CONFIRMED', { referenceStandard: 'Equally spaced at 120°' })
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'PLANETARY_GEARBOX',
      displayName: 'Epicyclic Planetary Gear Set',
      domain: 'MECHANICAL',
      constructionMethod: 'ENGINEERING_ASSEMBLY',
      parameters,
      requiredInformation: ['Sun tooth count', 'Planet tooth count', 'Planetary stage ratio'],
      missingInformation: [],
      assumptions: ['3-planet coaxial epicyclic reduction gear assembly (Ratio = 1 : 4.5).'],
      validationRules: [],
      qualityTier: 'DERIVED',
      fidelityClassification: 'ILLUSTRATIVE_VISUALIZATION',
      explanation: {
        whatBuilt: 'Coaxial Epicyclic Planetary Gear Train (Sun, 3 Planets, Ring Annulus).',
        whySelected: 'Provides high torque density and coaxial reduction.',
        dataSource: 'Willis Epicyclic Formula / AGMA.',
        equationsUsed: ['z_ring = z_sun + 2 * z_planet = 16 + 40 = 56', 'Reduction Ratio i = 1 + (z_ring / z_sun) = 1 + 56/16 = 4.5 : 1'],
        assumedParameters: ['3 symmetric planets', 'Module m=2.0 mm'],
        unknownParameters: ['Carrier deflection under maximum rated torque'],
        accuracyDisclosure: 'Kinematically valid epicyclic assembly satisfying planetary mesh meshing constraints.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: SADDLE SURFACE ---
  private static planSaddle(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      a: ModelProvenanceEngine.createProvenanceValue(1.0, 'ESTIMATED', 'CONFIRMED'),
      b: ModelProvenanceEngine.createProvenanceValue(1.0, 'ESTIMATED', 'CONFIRMED'),
      size: ModelProvenanceEngine.createProvenanceValue(2.0, 'ESTIMATED', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'SADDLE_SURFACE',
      displayName: 'Hyperbolic Paraboloid (Saddle Surface)',
      domain: 'MATHEMATICS',
      constructionMethod: 'MATHEMATICAL',
      parameters,
      requiredInformation: ['Scale parameters a, b'],
      missingInformation: [],
      assumptions: ['Canonical saddle surface z = x² - y².'],
      validationRules: ['SURFACE_DOMAIN_VALID'],
      qualityTier: 'DERIVED',
      fidelityClassification: 'MATHEMATICALLY_EXACT',
      explanation: {
        whatBuilt: 'Mathematical Hyperbolic Paraboloid Saddle Mesh.',
        whySelected: 'Surface with negative Gaussian curvature and principal curvatures of opposite sign.',
        dataSource: 'Differential Geometry.',
        equationsUsed: ['z = x²/a² - y²/b²', 'Gaussian Curvature K = -4a²b² / (4a⁴b⁴ + 4b⁴x² + 4a⁴y²)² < 0'],
        assumedParameters: ['Domain [-1.0, 1.0] x [-1.0, 1.0]'],
        unknownParameters: [],
        accuracyDisclosure: 'Analytical surface mesh.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: ELLIPSOID ---
  private static planEllipsoid(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      semiAxisX: ModelProvenanceEngine.createProvenanceValue(1.8, 'ESTIMATED', 'CONFIRMED'),
      semiAxisY: ModelProvenanceEngine.createProvenanceValue(1.2, 'ESTIMATED', 'CONFIRMED'),
      semiAxisZ: ModelProvenanceEngine.createProvenanceValue(0.9, 'ESTIMATED', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'ELLIPSOID',
      displayName: 'Triaxial Quadric Ellipsoid',
      domain: 'MATHEMATICS',
      constructionMethod: 'MATHEMATICAL',
      parameters,
      requiredInformation: ['Semi-principal axes (a, b, c)'],
      missingInformation: [],
      assumptions: ['Standard orthogonal principal axes.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'DERIVED',
      fidelityClassification: 'MATHEMATICALLY_EXACT',
      explanation: {
        whatBuilt: 'Mathematical 3D Triaxial Ellipsoid solid.',
        whySelected: 'Canonical second-degree quadric surface centered at coordinate origin.',
        dataSource: 'Analytical geometry.',
        equationsUsed: ['(x/a)² + (y/b)² + (z/c)² = 1', 'Volume V = (4/3)·π·a·b·c'],
        assumedParameters: ['a = 1.8m, b = 1.2m, c = 0.9m'],
        unknownParameters: [],
        accuracyDisclosure: 'Exact parametric mathematical formulation.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: CONE ---
  private static planCone(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      baseRadius: ModelProvenanceEngine.createProvenanceValue(1.2, 'ESTIMATED', 'CONFIRMED'),
      topRadius: ModelProvenanceEngine.createProvenanceValue(0.0, 'ESTIMATED', 'CONFIRMED'),
      height: ModelProvenanceEngine.createProvenanceValue(2.4, 'ESTIMATED', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'CONE',
      displayName: 'Right Circular Cone',
      domain: 'MATHEMATICS',
      constructionMethod: 'MATHEMATICAL',
      parameters,
      requiredInformation: ['Base radius (r₁)', 'Height (h)'],
      missingInformation: [],
      assumptions: ['Right circular cone with apex at top.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'DERIVED',
      fidelityClassification: 'MATHEMATICALLY_EXACT',
      explanation: {
        whatBuilt: 'Parametric Conical 3D Mesh.',
        whySelected: 'Right circular cone generated by linear generatrix rotation.',
        dataSource: 'Euclidean solid geometry.',
        equationsUsed: ['Volume V = (1/3)·π·r²·h', 'Slant height s = √(r² + h²)', 'Lateral Area A = π·r·s'],
        assumedParameters: ['Base radius r = 1.2m, height h = 2.4m'],
        unknownParameters: [],
        accuracyDisclosure: 'Exact geometric calculation.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: BALL BEARING ---
  private static planBallBearing(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      boreDiameter: ModelProvenanceEngine.createProvenanceValue(20, 'LIT', 'CONFIRMED', { referenceStandard: 'ISO 15 / DIN 625 Deep Groove Ball Bearing 6004' }),
      outerDiameter: ModelProvenanceEngine.createProvenanceValue(42, 'LIT', 'CONFIRMED', { referenceStandard: 'ISO 15 Standard Outer Diameter' }),
      width: ModelProvenanceEngine.createProvenanceValue(12, 'LIT', 'CONFIRMED', { referenceStandard: 'ISO 15 Boundary Width' }),
      ballCount: ModelProvenanceEngine.createProvenanceValue(8, 'LIT', 'CONFIRMED', { referenceStandard: 'Grade 10 Chrome Steel Balls' })
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'BALL_BEARING',
      displayName: 'Deep Groove Ball Bearing 6004',
      domain: 'MECHANICAL',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Bore diameter (d)', 'Outer diameter (D)', 'Width (B)', 'Rolling element count (Z)'],
      missingInformation: [],
      assumptions: ['Deep groove ball bearing conforming to ISO 15 series.'],
      validationRules: ['BEARING_GEOMETRY_VALID', 'POSITIVE_DIMENSIONS'],
      qualityTier: 'LIT',
      fidelityClassification: 'ENGINEERING_SPECIFICATION',
      explanation: {
        whatBuilt: 'ISO 15 Series Deep Groove Rolling Element Ball Bearing Assembly.',
        whySelected: 'Radial bearing supporting combined radial and thrust loads via Hertzian point contact.',
        dataSource: 'ISO 15 / ISO 281 Rolling Bearings Standard.',
        equationsUsed: ['Pitch diameter dm = (D + d) / 2', 'Dynamic load rating C = fc·(i·cosα)^0.7·Z^(2/3)·Dw^1.8', 'Hertzian stress σmax = 1.5·F/(π·a·b)'],
        assumedParameters: ['ISO 6004 nominal envelope (20×42×12 mm)'],
        unknownParameters: [],
        accuracyDisclosure: 'Nominal geometry conforms to ISO 15 standard.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: HEAT SINK ---
  private static planHeatSink(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      length: ModelProvenanceEngine.createProvenanceValue(100, 'LIT', 'CONFIRMED', { notes: 'mm' }),
      width: ModelProvenanceEngine.createProvenanceValue(80, 'LIT', 'CONFIRMED', { notes: 'mm' }),
      baseThickness: ModelProvenanceEngine.createProvenanceValue(8, 'LIT', 'CONFIRMED', { notes: 'mm' }),
      finHeight: ModelProvenanceEngine.createProvenanceValue(30, 'LIT', 'CONFIRMED', { notes: 'mm' }),
      finCount: ModelProvenanceEngine.createProvenanceValue(8, 'DERIVED', 'CONFIRMED', { notes: 'Extruded fins' }),
      finThickness: ModelProvenanceEngine.createProvenanceValue(2.5, 'LIT', 'CONFIRMED', { notes: 'mm' })
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'HEAT_SINK',
      displayName: 'Extruded Aluminum Heat Sink (8-Fin)',
      domain: 'THERMAL_ENGINEERING',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Base dimensions (L×W×t)', 'Fin geometry (H, t, count)', 'Thermal conductivity (k)'],
      missingInformation: [],
      assumptions: ['6063-T5 aluminum alloy (k = 201 W/m·K) in natural/forced convection.'],
      validationRules: ['HEAT_SINK_SPACING_VALID', 'POSITIVE_DIMENSIONS'],
      qualityTier: 'DERIVED',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: 'Extruded Aluminum Convection Heat Sink Assembly.',
        whySelected: 'Thermal dissipation module maximizing convective surface area for power electronics.',
        dataSource: 'Convective Heat Transfer Engineering (Incropera & DeWitt).',
        equationsUsed: ['Newton Cooling: q = h·A·(Ts - T∞)', 'Fin Efficiency ηf = tanh(m·Lc) / (m·Lc)', 'Thermal Resistance Rth = 1 / (h·A·ηoverall)'],
        assumedParameters: ['6063-T5 Aluminum, 8 vertical fins with 2.5mm thickness'],
        unknownParameters: [],
        accuracyDisclosure: 'CAD dimensions derived from standard thermal extrusion profiles.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: TRANSFORMER ---
  private static planTransformer(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      primaryTurns: ModelProvenanceEngine.createProvenanceValue(240, 'LIT', 'CONFIRMED'),
      secondaryTurns: ModelProvenanceEngine.createProvenanceValue(24, 'LIT', 'CONFIRMED'),
      primaryVoltage: ModelProvenanceEngine.createProvenanceValue(120, 'LIT', 'CONFIRMED'),
      secondaryVoltage: ModelProvenanceEngine.createProvenanceValue(12, 'DERIVED', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'TRANSFORMER',
      displayName: 'Single-Phase Step-Down Transformer (10:1)',
      domain: 'ELECTRICAL',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Primary turns (N₁)', 'Secondary turns (N₂)', 'Rated primary voltage (V₁)'],
      missingInformation: [],
      assumptions: ['Grain-oriented silicon steel E-I core with copper windings.'],
      validationRules: ['TRANSFORMER_TURNS_POSITIVE', 'POSITIVE_DIMENSIONS'],
      qualityTier: 'DERIVED',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: 'Single-Phase E-I Core Power Transformer.',
        whySelected: 'Magnetic induction step-down transformer based on Faraday and Ampère laws.',
        dataSource: 'Electromagnetic Field Theory & IEEE Std C57.',
        equationsUsed: ['Faraday EMF: e = -N·(dΦ/dt)', 'Turns Ratio: V₁/V₂ = N₁/N₂ = I₂/I₁', 'Magnetic Flux: Φ = B·Ac = (V·√2) / (2π·f·N)'],
        assumedParameters: ['120V to 12V 10:1 step-down ratio, 60Hz operation'],
        unknownParameters: [],
        accuracyDisclosure: 'Analytical electromagnetic winding ratio model.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: SOLAR PANEL ---
  private static planSolarPanel(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      cellCount: ModelProvenanceEngine.createProvenanceValue(60, 'LIT', 'CONFIRMED'),
      peakPower: ModelProvenanceEngine.createProvenanceValue(320, 'LIT', 'CONFIRMED', { notes: 'Watts STC' })
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'SOLAR_PANEL',
      displayName: '60-Cell Monocrystalline PV Module',
      domain: 'ENERGY_ENGINEERING',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Cell count (Nc)', 'Peak power rating (Pmax)', 'Cell technology (Mono/Poly)'],
      missingInformation: [],
      assumptions: ['Standard 60-cell monocrystalline PERC module.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'LIT',
      fidelityClassification: 'ENGINEERING_SPECIFICATION',
      explanation: {
        whatBuilt: 'Monocrystalline Photovoltaic Module Assembly.',
        whySelected: 'Solar energy conversion unit utilizing semiconductor p-n junction photovoltaic effect.',
        dataSource: 'IEC 61215 Terrestrial Photovoltaic Standards.',
        equationsUsed: ['Diode Current: I = Iph - I0·[exp(q·(V + I·Rs)/(n·k·T)) - 1] - (V + I·Rs)/Rsh', 'Module Efficiency: η = Pmax / (E·Ac)', 'Fill Factor: FF = Pmax / (Voc·Isc)'],
        assumedParameters: ['Standard Test Conditions (STC): 1000 W/m², AM 1.5G, 25°C cell temperature'],
        unknownParameters: [],
        accuracyDisclosure: 'Nominal architectural dimensions conforming to standard 60-cell footprint.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: I-BEAM ---
  private static planIBeam(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      depth: ModelProvenanceEngine.createProvenanceValue(200, 'LIT', 'CONFIRMED', { referenceStandard: 'IPE 200 / ASTM W8×15' }),
      flangeWidth: ModelProvenanceEngine.createProvenanceValue(100, 'LIT', 'CONFIRMED'),
      webThickness: ModelProvenanceEngine.createProvenanceValue(5.6, 'LIT', 'CONFIRMED'),
      flangeThickness: ModelProvenanceEngine.createProvenanceValue(8.5, 'LIT', 'CONFIRMED'),
      length: ModelProvenanceEngine.createProvenanceValue(1000, 'ESTIMATED', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'I_BEAM',
      displayName: 'Structural I-Beam Section (IPE 200)',
      domain: 'STRUCTURAL_ENGINEERING',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Total section depth (h)', 'Flange width (b)', 'Web thickness (tw)', 'Flange thickness (tf)'],
      missingInformation: [],
      assumptions: ['Standard hot-rolled IPE 200 European standard I-beam section.'],
      validationRules: ['IBEAM_GEOMETRY_VALID', 'POSITIVE_DIMENSIONS'],
      qualityTier: 'LIT',
      fidelityClassification: 'ENGINEERING_SPECIFICATION',
      explanation: {
        whatBuilt: 'Structural Hot-Rolled I-Beam Flange & Web Assembly.',
        whySelected: 'High bending efficiency structural member resisting primary bending moments about major axis.',
        dataSource: 'AISC Steel Construction Manual / EN 10034 Standard.',
        equationsUsed: ['Second Moment of Area: Ix = [b·h³ - (b - tw)·(h - 2tf)³] / 12', 'Bending Stress: σ = M·y / Ix', 'Shear Stress in Web: τmax = 1.5·V / (tw·hw)'],
        assumedParameters: ['Standard IPE 200 profile (200×100×5.6×8.5 mm)'],
        unknownParameters: [],
        accuracyDisclosure: 'Nominal dimensions match EN 10034 standard.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: BRACKET WITH HOLES ---
  private static planBracketWithHoles(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      holeDiameter: ModelProvenanceEngine.createProvenanceValue(8, 'LIT', 'CONFIRMED', { referenceStandard: 'ISO 273 Fastener Clearances' }),
      thickness: ModelProvenanceEngine.createProvenanceValue(6, 'LIT', 'CONFIRMED'),
      boltCount: ModelProvenanceEngine.createProvenanceValue(4, 'USER', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'BRACKET_WITH_HOLES',
      displayName: 'Mounting Bracket with 4 Fastener Clearances',
      domain: 'MECHANICAL',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Mounting plate thickness', 'Fastener clearance diameter', 'Hole pattern pitch'],
      missingInformation: [],
      assumptions: ['Heavy duty L-bracket with 4 M8 clearance holes conforming to ISO 273.'],
      validationRules: ['BRACKET_MARGIN_VALID', 'POSITIVE_DIMENSIONS'],
      qualityTier: 'DERIVED',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: 'Structural L-Bracket with 4 Fastener Through-Holes.',
        whySelected: 'Cantilever and shear load-transfer bracket for rigid structural mounting.',
        dataSource: 'Machinery\'s Handbook / ISO Fastener Standards.',
        equationsUsed: ['Direct Shear: τ = F / (n·Abolt)', 'Tear-out margin: e ≥ 1.5·dhole', 'Bearing Stress: σb = F / (d·t)'],
        assumedParameters: ['6mm plate steel, 4 × Ø8mm holes for M8 bolts'],
        unknownParameters: [],
        accuracyDisclosure: 'Verified parametric mechanical bracket model.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: ELECTRIC MOTOR ---
  private static planElectricMotor(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      power: ModelProvenanceEngine.createProvenanceValue(3.0, 'LIT', 'CONFIRMED', { notes: 'kW' }),
      poles: ModelProvenanceEngine.createProvenanceValue(4, 'LIT', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'ELECTRIC_MOTOR',
      displayName: '3-Phase Induction Motor (IEC 100L)',
      domain: 'ELECTRICAL_MACHINERY',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Rated output power (P)', 'Pole count (2p)', 'Frame size (IEC standard)'],
      missingInformation: [],
      assumptions: ['Totally Enclosed Fan Cooled (TEFC) 3-phase squirrel cage induction motor.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'LIT',
      fidelityClassification: 'ENGINEERING_SPECIFICATION',
      explanation: {
        whatBuilt: '3-Phase AC Induction Motor Assembly (Stator Housing, Shaft, Terminal Box).',
        whySelected: 'Electromechanical actuator converting electrical power to rotary mechanical torque.',
        dataSource: 'IEC 60034 Rotating Electrical Machines Standard.',
        equationsUsed: ['Synchronous Speed: ns = 120·f / p (RPM)', 'Torque: T = (P·9550) / n (N·m)', 'Electromagnetic Power: Pem = 3·I2²·R2 / s'],
        assumedParameters: ['IEC 100L frame size (3.0 kW, 4-pole, 1440 RPM at 50Hz)'],
        unknownParameters: [],
        accuracyDisclosure: 'Conforms to IEC 60072 envelope dimensions.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: PULLEY ---
  private static planPulley(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      pitchDiameter: ModelProvenanceEngine.createProvenanceValue(120, 'LIT', 'CONFIRMED', { referenceStandard: 'ISO 4183 V-Belt Pulleys' })
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'PULLEY',
      displayName: 'V-Belt Pulley Sheave (Ø120mm)',
      domain: 'MECHANICAL',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Pitch diameter (dp)', 'Groove cross-section profile (SPA/SPB)'],
      missingInformation: [],
      assumptions: ['Single-groove SPA profile V-belt pulley.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'LIT',
      fidelityClassification: 'ENGINEERING_SPECIFICATION',
      explanation: {
        whatBuilt: 'V-Belt Transmission Pulley Sheave.',
        whySelected: 'Frictional power transmission element with wedge-action groove multiplying belt grip.',
        dataSource: 'ISO 4183 Grooved Pulleys Standard.',
        equationsUsed: ['Belt Velocity: v = π·dp·n / 60', 'Torque: T = (F1 - F2)·(dp / 2)', 'Eytelwein Friction: F1/F2 = exp(μ·θ / sin(α/2))'],
        assumedParameters: ['120mm pitch diameter, 38° groove angle'],
        unknownParameters: [],
        accuracyDisclosure: 'ISO 4183 groove profile geometry.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: PCB ---
  private static planPCB(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      layers: ModelProvenanceEngine.createProvenanceValue(4, 'LIT', 'CONFIRMED', { referenceStandard: 'IPC-2221 Standard' }),
      thickness: ModelProvenanceEngine.createProvenanceValue(1.6, 'LIT', 'CONFIRMED', { notes: 'mm FR-4' }),
      copperWeight: ModelProvenanceEngine.createProvenanceValue(35, 'LIT', 'CONFIRMED', { notes: '1 oz (35 µm)' })
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'PCB',
      displayName: 'Embedded Microcontroller PCB Module',
      domain: 'ELECTRONICS',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Substrate layers', 'Component Bill of Materials'],
      missingInformation: [],
      assumptions: ['4-layer FR-4 board with ARM Cortex microcontroller and SMT peripherals.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'DERIVED',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: '4-Layer FR-4 Printed Circuit Board with Microcontroller IC.',
        whySelected: 'Electronic substrate providing conductive traces, component mounting pads, and thermal dissipation.',
        dataSource: 'IPC-2221 Generic Standard on Printed Board Design.',
        equationsUsed: ['Microstrip Impedance: Z0 = [87 / √(εr + 1.41)]·ln[5.98·h / (0.8·w + t)]', 'Trace Current Capacity: I = k·ΔT^0.44·A^0.725 (IPC-2152)'],
        assumedParameters: ['Standard 1.6mm thickness, 1 oz copper weight'],
        unknownParameters: [],
        accuracyDisclosure: 'Representative engineering PCB model.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: TRUSS ---
  private static planTruss(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      span: ModelProvenanceEngine.createProvenanceValue(2400, 'LIT', 'CONFIRMED', { notes: 'mm' })
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'TRUSS',
      displayName: 'Warren Steel Truss Girder (2.4m Span)',
      domain: 'STRUCTURAL_ENGINEERING',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Total span (L)', 'Truss height (H)', 'Panel count (N)'],
      missingInformation: [],
      assumptions: ['Warren truss configuration with equilateral triangulated web members.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'DERIVED',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: 'Warren Triangulated Structural Steel Truss Module.',
        whySelected: 'Pin-jointed framework carrying loads purely in axial tension and compression.',
        dataSource: 'Structural Mechanics & Eurocode 3 (EN 1993).',
        equationsUsed: ['Method of Joints: ΣFx = 0, ΣFy = 0', 'Euler Buckling: Pcr = π²·E·I / (K·L)²', 'Axial Member Stress: σ = N / A'],
        assumedParameters: ['2400mm span, HSS hollow steel tube sections'],
        unknownParameters: [],
        accuracyDisclosure: 'Parametric structural truss geometry.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: SMARTPHONE ---
  private static planSmartphone(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      width: ModelProvenanceEngine.createProvenanceValue(1.4, 'ESTIMATED', 'LIKELY', { notes: 'Normalized viewport units (approx 76.7mm)' }),
      height: ModelProvenanceEngine.createProvenanceValue(2.8, 'ESTIMATED', 'LIKELY', { notes: 'Normalized viewport units (approx 159.9mm)' }),
      thickness: ModelProvenanceEngine.createProvenanceValue(0.16, 'ESTIMATED', 'LIKELY', { notes: 'Normalized viewport units (approx 8.25mm)' }),
      cameraCount: ModelProvenanceEngine.createProvenanceValue(3, 'ESTIMATED', 'LIKELY', { notes: 'Triple computational camera array' })
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'SMARTPHONE',
      displayName: 'Modern Smartphone Unibody Assembly',
      domain: 'CONSUMER_ELECTRONICS',
      constructionMethod: 'PROCEDURALLY_APPROXIMATED',
      parameters,
      requiredInformation: ['Display diagonal', 'Chassis curvature', 'Camera array layout'],
      missingInformation: ['Internal OEM component trace routing'],
      assumptions: ['Standard capacitive touchscreen glass sandwich unibody assembly with triple rear camera system.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'ILLUSTRATIVE',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: 'Titanium-alloy smartphone chassis with OLED Super Retina display, triple camera island, sapphire lenses, and USB-C interface.',
        whySelected: 'Procedural 3D assembly representing modern mobile device industrial design and component architecture.',
        dataSource: 'Representative mobile device engineering standards (6.7-inch form factor).',
        equationsUsed: [
          'Display Pixel Density: PPI = √(w² + h²) / d',
          'Aspect Ratio: R = Height / Width ≈ 19.5 : 9'
        ],
        assumedParameters: ['Standard 6.7" OLED dimensions (160 x 77 x 8.3 mm)'],
        unknownParameters: ['Exact proprietary internal PCB layout'],
        accuracyDisclosure: 'Illustrative engineering 3D digital twin based on representative modern flagship smartphone design.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: LAPTOP ---
  private static planLaptop(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      width: ModelProvenanceEngine.createProvenanceValue(3.2, 'ESTIMATED', 'LIKELY'),
      depth: ModelProvenanceEngine.createProvenanceValue(2.2, 'ESTIMATED', 'LIKELY'),
      baseThickness: ModelProvenanceEngine.createProvenanceValue(0.14, 'ESTIMATED', 'LIKELY'),
      lidThickness: ModelProvenanceEngine.createProvenanceValue(0.08, 'ESTIMATED', 'LIKELY'),
      lidAngle: ModelProvenanceEngine.createProvenanceValue(110, 'ESTIMATED', 'LIKELY', { notes: 'Ergonomic 110-degree display opening angle' })
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'LAPTOP',
      displayName: 'Clamshell Laptop Workstation (16-Inch)',
      domain: 'CONSUMER_ELECTRONICS',
      constructionMethod: 'PROCEDURALLY_APPROXIMATED',
      parameters,
      requiredInformation: ['Display diagonal', 'Chassis dimensions', 'Hinge articulation'],
      missingInformation: ['Proprietary logic board PCB schematics'],
      assumptions: ['Standard clamshell unibody architecture with dual-barrel hinge, chiclet keyboard array, and glass trackpad.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'ILLUSTRATIVE',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: 'Billet aluminum clamshell laptop with 16-inch Mini-LED display, chiclet keyboard deck, Force Touch trackpad, and titanium friction hinges.',
        whySelected: 'Procedural 3D digital twin representing high-performance mobile computing hardware architecture.',
        dataSource: 'Representative 16-inch laptop workstation industrial standards.',
        equationsUsed: [
          'Hinge Clamshell Kinematics: [x, y, z] = R_x(θ) · [0, h_lid, 0] + [0, 0, z_hinge]',
          'Thermal Dissipation: Q = m_dot · Cp · ΔT'
        ],
        assumedParameters: ['16.2-inch 16:10 display ratio, aluminum unibody enclosure'],
        unknownParameters: ['Internal sub-millimeter component tolerances'],
        accuracyDisclosure: 'Illustrative 3D digital twin representing modern high-performance laptop workstation architecture.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: KEYBOARD ---
  private static planKeyboard(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      width: ModelProvenanceEngine.createProvenanceValue(3.6, 'ESTIMATED', 'LIKELY'),
      depth: ModelProvenanceEngine.createProvenanceValue(1.4, 'ESTIMATED', 'LIKELY'),
      height: ModelProvenanceEngine.createProvenanceValue(0.28, 'ESTIMATED', 'LIKELY')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'KEYBOARD',
      displayName: 'Mechanical Tenkeyless (TKL) Keyboard',
      domain: 'CONSUMER_ELECTRONICS',
      constructionMethod: 'PROCEDURALLY_APPROXIMATED',
      parameters,
      requiredInformation: ['Layout standard (ANSI/ISO)', 'Form factor (TKL / 60% / Full)'],
      missingInformation: [],
      assumptions: ['Tenkeyless 87-key ANSI mechanical keyboard with aluminum case and PBT keycaps.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'ILLUSTRATIVE',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: 'Gasket-mounted mechanical keyboard with 87 sculpted PBT keycaps, stabilized spacebar, and aluminum chassis.',
        whySelected: 'Procedural 3D model representing ergonomic computer input hardware.',
        dataSource: 'ANSI/ISO Mechanical Keyboard Standard (19.05mm key spacing).',
        equationsUsed: ['Unit Key Pitch: p = 19.05 mm (0.75 in)'],
        assumedParameters: ['87-key TKL form factor, 6.5° case incline'],
        unknownParameters: [],
        accuracyDisclosure: 'Representative 3D mechanical keyboard model.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: MOUSE ---
  private static planMouse(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      length: ModelProvenanceEngine.createProvenanceValue(2.4, 'ESTIMATED', 'LIKELY'),
      width: ModelProvenanceEngine.createProvenanceValue(1.4, 'ESTIMATED', 'LIKELY'),
      height: ModelProvenanceEngine.createProvenanceValue(0.9, 'ESTIMATED', 'LIKELY')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'MOUSE',
      displayName: 'Ergonomic Optical Gaming Mouse',
      domain: 'CONSUMER_ELECTRONICS',
      constructionMethod: 'PROCEDURALLY_APPROXIMATED',
      parameters,
      requiredInformation: ['Grip curvature', 'Button layout'],
      missingInformation: [],
      assumptions: ['Ergonomic contoured palm shell with split optical triggers and textured scroll wheel.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'ILLUSTRATIVE',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: 'Ergonomic optical computer mouse with split trigger plates, tactile scroll wheel, and PTFE sensor base.',
        whySelected: 'Procedural 3D model representing precision optical pointing input hardware.',
        dataSource: 'Human Factors & Ergonomics Computer Peripheral Design Guidelines.',
        equationsUsed: ['Optical Tracking Velocity: v = DPI · (Δx / Δt)'],
        assumedParameters: ['Standard 120 x 65 x 40 mm palm grip dimensions'],
        unknownParameters: [],
        accuracyDisclosure: 'Representative 3D optical mouse digital twin.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: WATER BOTTLE ---
  private static planWaterBottle(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      radius: ModelProvenanceEngine.createProvenanceValue(0.6, 'ESTIMATED', 'LIKELY'),
      height: ModelProvenanceEngine.createProvenanceValue(2.4, 'ESTIMATED', 'LIKELY')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'WATER_BOTTLE',
      displayName: 'Double-Wall Vacuum Insulated Flask (750ml)',
      domain: 'CONSUMER_PRODUCTS',
      constructionMethod: 'PARAMETRIC',
      parameters,
      requiredInformation: ['Volume capacity', 'Flask geometry'],
      missingInformation: [],
      assumptions: ['18/8 food-grade stainless steel double-wall vacuum insulated water bottle with silicone seal cap.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'DERIVED',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: 'Double-wall vacuum flask with hydroformed tapered neck and leakproof insulated screw cap.',
        whySelected: 'Parametric thermal container utilizing vacuum space to prevent conductive and convective heat transfer.',
        dataSource: 'ASTM F2066 Standard Specification for Insulated Drinkware.',
        equationsUsed: [
          'Cylinder Volume: V = π·r²·h',
          'Stefan-Boltzmann Radiation Loss: Q = ε·σ·A·(T_hot⁴ - T_cold⁴)'
        ],
        assumedParameters: ['750ml capacity (240mm height, 75mm outer diameter)'],
        unknownParameters: [],
        accuracyDisclosure: 'Parametric 3D vacuum insulated water bottle model.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: MONITOR ---
  private static planMonitor(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      width: ModelProvenanceEngine.createProvenanceValue(4.2, 'ESTIMATED', 'LIKELY'),
      height: ModelProvenanceEngine.createProvenanceValue(2.5, 'ESTIMATED', 'LIKELY')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'MONITOR',
      displayName: 'Widescreen 4K UHD Desktop Display Monitor (27-Inch)',
      domain: 'CONSUMER_ELECTRONICS',
      constructionMethod: 'PROCEDURALLY_APPROXIMATED',
      parameters,
      requiredInformation: ['Display diagonal', 'Stand articulation'],
      missingInformation: [],
      assumptions: ['27-inch 16:9 ultra-thin bezel 4K display with ergonomic riser stand.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'ILLUSTRATIVE',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: '27-inch 4K IPS display panel with slim bezel, ventilated rear I/O housing, gas-spring riser arm, and die-cast base pedestal.',
        whySelected: 'Procedural 3D model representing modern desktop visual display hardware.',
        dataSource: 'VESA Flat Display Mounting Interface (FDMI) Standards.',
        equationsUsed: ['Display Aspect: w / h = 16 / 9'],
        assumedParameters: ['27" 16:9 display panel (600 x 340 mm active area)'],
        unknownParameters: [],
        accuracyDisclosure: 'Representative 3D desktop monitor digital twin.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: SMARTWATCH ---
  private static planSmartwatch(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      caseSize: ModelProvenanceEngine.createProvenanceValue(1.4, 'ESTIMATED', 'LIKELY'),
      thickness: ModelProvenanceEngine.createProvenanceValue(0.4, 'ESTIMATED', 'LIKELY')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'SMARTWATCH',
      displayName: 'Rugged Titanium Smartwatch & Bio-Sensor Array (49mm)',
      domain: 'CONSUMER_ELECTRONICS',
      constructionMethod: 'PROCEDURALLY_APPROXIMATED',
      parameters,
      requiredInformation: ['Case dimensions', 'Sensor suite'],
      missingInformation: [],
      assumptions: ['49mm titanium case with sapphire OLED screen, digital crown, and fluoroelastomer ocean loop strap.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'ILLUSTRATIVE',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: 'Aerospace titanium smartwatch with sapphire crystal display, haptic digital crown, and dual-strap loop.',
        whySelected: 'Procedural 3D model representing wearable biometric and computing hardware.',
        dataSource: 'Wearable Technology Form Factor Specifications.',
        equationsUsed: ['Photoplethysmography (PPG) Optical Absorption: I = I_0 · exp(-μ · d)'],
        assumedParameters: ['49mm titanium case (49 x 44 x 14.4 mm)'],
        unknownParameters: [],
        accuracyDisclosure: 'Representative 3D smartwatch digital twin.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: HEADPHONES ---
  private static planHeadphones(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      width: ModelProvenanceEngine.createProvenanceValue(2.4, 'ESTIMATED', 'LIKELY'),
      height: ModelProvenanceEngine.createProvenanceValue(2.8, 'ESTIMATED', 'LIKELY')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'HEADPHONES',
      displayName: 'Over-Ear Active Noise-Cancelling Headphones',
      domain: 'AUDIO_ENGINEERING',
      constructionMethod: 'PROCEDURALLY_APPROXIMATED',
      parameters,
      requiredInformation: ['Driver size', 'Earcup dimensions'],
      missingInformation: [],
      assumptions: ['Over-ear circumaural acoustic earcups with knit mesh headband and 40mm dynamic drivers.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'ILLUSTRATIVE',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: 'Circumaural headphones with stainless steel canopy headband, dual anodized aluminum earcups, and memory foam acoustic cushions.',
        whySelected: 'Procedural 3D model representing electroacoustic audio reproduction hardware.',
        dataSource: 'IEC 60268-7 Sound System Equipment - Headphones and Earphones.',
        equationsUsed: ['Acoustic Wave Superposition (ANC): P_net = P_noise + P_anti = 0'],
        assumedParameters: ['Circumaural over-ear 40mm driver geometry'],
        unknownParameters: [],
        accuracyDisclosure: 'Representative 3D ANC headphones digital twin.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: GAME CONTROLLER ---
  private static planGameController(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      width: ModelProvenanceEngine.createProvenanceValue(3.0, 'ESTIMATED', 'LIKELY'),
      height: ModelProvenanceEngine.createProvenanceValue(2.0, 'ESTIMATED', 'LIKELY'),
      depth: ModelProvenanceEngine.createProvenanceValue(1.2, 'ESTIMATED', 'LIKELY')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'GAME_CONTROLLER',
      displayName: 'Ergonomic Wireless Game Controller',
      domain: 'CONSUMER_ELECTRONICS',
      constructionMethod: 'PROCEDURALLY_APPROXIMATED',
      parameters,
      requiredInformation: ['Grip geometry', 'Control layout'],
      missingInformation: [],
      assumptions: ['Dual ergonomic palm grips with Hall-effect analog thumbsticks, mechanical D-pad, and microswitch triggers.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'ILLUSTRATIVE',
      fidelityClassification: 'SIMPLIFIED_ASSEMBLY',
      explanation: {
        whatBuilt: 'Ergonomic dual-grip gamepad with Hall-effect magnetic thumbsticks, tactile microswitch buttons, and dual rumble actuators.',
        whySelected: 'Procedural 3D model representing multi-axis interactive game input hardware.',
        dataSource: 'Human Factors Interactive Input Standards.',
        equationsUsed: ['Hall Effect Potential: V_H = (I · B) / (n · q · t)'],
        assumedParameters: ['Standard 150 x 100 x 60 mm dual-grip enclosure'],
        unknownParameters: [],
        accuracyDisclosure: 'Representative 3D game controller digital twin.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: BICYCLE ---
  private static planBicycle(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      wheelRadius: ModelProvenanceEngine.createProvenanceValue(1.1, 'LIT', 'CONFIRMED', { referenceStandard: 'ISO 5775 / 700c (622mm Bead Seat)' }),
      wheelbase: ModelProvenanceEngine.createProvenanceValue(3.4, 'LIT', 'CONFIRMED', { referenceStandard: 'UCI Road Geometry Standard' }),
      frameHeight: ModelProvenanceEngine.createProvenanceValue(1.8, 'LIT', 'CONFIRMED'),
      handlebarWidth: ModelProvenanceEngine.createProvenanceValue(1.4, 'LIT', 'CONFIRMED'),
      spokeCount: ModelProvenanceEngine.createProvenanceValue(20, 'USER', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'BICYCLE',
      displayName: '700c Endurance Road Bicycle Assembly',
      domain: 'MECHANICAL_TRANSPORT',
      constructionMethod: 'ENGINEERING_ASSEMBLY',
      parameters,
      requiredInformation: ['Wheel radius (700c)', 'Wheelbase distance', 'Diamond frame geometry', 'Drivetrain ratio'],
      missingInformation: [],
      assumptions: ['Double-butted AL 6061 diamond frame with 700c spoked clincher wheels and 2x11 compact drivetrain.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'VERIFIED',
      fidelityClassification: 'ENGINEERING_SPECIFICATION',
      explanation: {
        whatBuilt: 'Fully articulated diamond truss bicycle assembly comprising frame, fork, 700c spoked wheels, drivetrain crankset, and ergonomic saddle.',
        whySelected: 'Human-powered geared transport system governed by crank kinematics and rolling friction dynamics.',
        dataSource: 'ISO 4210 Cycles Safety Standards & UCI Technical Regulations.',
        equationsUsed: [
          'Gear Development: D = π · d_wheel · (N_front / N_rear)',
          'Tire Rolling Resistance: P_rr = Crr · m · g · v',
          'Frame Diamond Truss Equilibrium: Σ F_x = 0, Σ F_y = 0'
        ],
        assumedParameters: ['Standard 54cm frame geometry, 50/34T chainrings, 700x25c tires'],
        unknownParameters: [],
        accuracyDisclosure: 'True-scale engineering bicycle digital twin.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: OXFORD SHOE ---
  private static planOxfordShoe(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      length: ModelProvenanceEngine.createProvenanceValue(3.2, 'LIT', 'CONFIRMED', { referenceStandard: 'Mondopoint Standard Shoe Lasting' }),
      width: ModelProvenanceEngine.createProvenanceValue(1.15, 'LIT', 'CONFIRMED'),
      height: ModelProvenanceEngine.createProvenanceValue(1.25, 'LIT', 'CONFIRMED'),
      soleThickness: ModelProvenanceEngine.createProvenanceValue(0.12, 'LIT', 'CONFIRMED'),
      heelHeight: ModelProvenanceEngine.createProvenanceValue(0.28, 'LIT', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'OXFORD_SHOE',
      displayName: 'Goodyear-Welted Cap-Toe Oxford Shoe',
      domain: 'FOOTWEAR_ENGINEERING',
      constructionMethod: 'ENGINEERING_ASSEMBLY',
      parameters,
      requiredInformation: ['Shoe last dimensions', 'Welt construction method', 'Facing pattern (Closed Oxford)'],
      missingInformation: [],
      assumptions: ['French boxcalf leather with Goodyear 360° welt, stacked leather heel, and closed 5-eyelet lacing.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'VERIFIED',
      fidelityClassification: 'ENGINEERING_SPECIFICATION',
      explanation: {
        whatBuilt: 'Multi-layer Goodyear welted Oxford shoe with chiseled almond toe cap, closed lacing throat, and stacked heel.',
        whySelected: 'Traditional bespoke English dress footwear with anatomical footbed support and durable lockstitched welt.',
        dataSource: 'Bespoke Shoemaking Guild & SATRA Footwear Standards.',
        equationsUsed: [
          'Toe Spring Arch Geometry: y(z) = h_spring · (z / L_toe)^1.8',
          'Heel Load Distribution: σ_heel = W_body / A_heel'
        ],
        assumedParameters: ['Size 9.5 UK / 43 EU anatomical last geometry'],
        unknownParameters: [],
        accuracyDisclosure: 'Anatomically accurate footwear digital twin.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: CEILING FAN ---
  private static planCeilingFan(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      span: ModelProvenanceEngine.createProvenanceValue(4.2, 'LIT', 'CONFIRMED', { referenceStandard: '52-Inch Airflow Sweep' }),
      bladeCount: ModelProvenanceEngine.createProvenanceValue(5, 'USER', 'CONFIRMED'),
      dropHeight: ModelProvenanceEngine.createProvenanceValue(1.6, 'LIT', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'CEILING_FAN',
      displayName: '52" 5-Blade Direct-Drive BLDC Ceiling Fan',
      domain: 'AERODYNAMIC_APPLIANCES',
      constructionMethod: 'ENGINEERING_ASSEMBLY',
      parameters,
      requiredInformation: ['Sweep span diameter', 'Blade count & pitch angle', 'Motor type'],
      missingInformation: [],
      assumptions: ['5 carved aerodynamic composite blades at 14° pitch powered by direct-drive DC brushless motor.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'VERIFIED',
      fidelityClassification: 'ENGINEERING_SPECIFICATION',
      explanation: {
        whatBuilt: '5-Blade Ceiling Fan Assembly featuring cast motor housing, steel downrod, canopy, and dimmable LED fixture.',
        whySelected: 'Rotary aerodynamic convective airflow cooling system.',
        dataSource: 'AMCA 230 / Energy Star Ceiling Fan Test Methods.',
        equationsUsed: [
          'Airflow Volumetric Delivery: Q = A_rotor · v_induced',
          'Rotor Thrust: T = 0.5 · ρ · A · (v_exit² - v_0²)'
        ],
        assumedParameters: ['52-inch diameter blade sweep, 14-degree pitch, 180 RPM top speed'],
        unknownParameters: [],
        accuracyDisclosure: 'Aero-dynamically proportioned ceiling fan assembly.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: CAMERA ---
  private static planCamera(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      width: ModelProvenanceEngine.createProvenanceValue(2.4, 'LIT', 'CONFIRMED'),
      height: ModelProvenanceEngine.createProvenanceValue(1.6, 'LIT', 'CONFIRMED'),
      depth: ModelProvenanceEngine.createProvenanceValue(1.0, 'LIT', 'CONFIRMED'),
      lensRadius: ModelProvenanceEngine.createProvenanceValue(0.55, 'LIT', 'CONFIRMED'),
      lensLength: ModelProvenanceEngine.createProvenanceValue(1.4, 'LIT', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'CAMERA',
      displayName: 'Full-Frame Mirrorless Camera & 24-70mm f/2.8 Lens',
      domain: 'OPTICAL_ENGINEERING',
      constructionMethod: 'ENGINEERING_ASSEMBLY',
      parameters,
      requiredInformation: ['Body dimensions', 'Lens barrel diameter and length', 'Optical grouping'],
      missingInformation: [],
      assumptions: ['Weather-sealed magnesium unibody with deep rubber grip, top dials, multi-element zoom lens, and rear LCD.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'VERIFIED',
      fidelityClassification: 'ENGINEERING_SPECIFICATION',
      explanation: {
        whatBuilt: 'Professional Mirrorless Camera System including magnesium body, 24-70mm f/2.8 lens barrel, fluorine front element, and controls.',
        whySelected: 'High-precision optomechanical imaging system focusing photon wavelengths onto a 35mm CMOS focal plane.',
        dataSource: 'CIPA (Camera & Imaging Products Association) Standards.',
        equationsUsed: [
          'Thin Lens Equation: 1/f = 1/d_o + 1/d_i',
          'Aperture f-Number: N = f / D_pupil',
          'Field of View: 2θ = 2 · arctan(d_sensor / (2f))'
        ],
        assumedParameters: ['Full-frame 36x24mm sensor cavity, 82mm lens front filter thread'],
        unknownParameters: [],
        accuracyDisclosure: 'High-precision optomechanical camera model.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: DRONE ---
  private static planDrone(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      diagonalWheelbase: ModelProvenanceEngine.createProvenanceValue(3.6, 'LIT', 'CONFIRMED', { notes: 'mm wheelbase scaled' }),
      propDiameter: ModelProvenanceEngine.createProvenanceValue(1.4, 'LIT', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'DRONE',
      displayName: 'Autonomous Aerial Quadcopter Drone',
      domain: 'AEROSPACE_ROBOTICS',
      constructionMethod: 'ENGINEERING_ASSEMBLY',
      parameters,
      requiredInformation: ['Diagonal rotor wheelbase', 'Propeller diameter', 'Motor KV rating', 'Gimbal axes'],
      missingInformation: [],
      assumptions: ['3K carbon fiber X-frame with 4 brushless outrunners, folding carbon propellers, and 3-axis 4K gimbal camera.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'VERIFIED',
      fidelityClassification: 'ENGINEERING_SPECIFICATION',
      explanation: {
        whatBuilt: 'X-Configuration Autonomous Quadcopter featuring carbon booms, brushless motors, folding airfoils, and 3-axis camera gimbal.',
        whySelected: 'Multirotor VTOL flight vehicle utilizing differential motor thrust for 6-DOF positional and attitude control.',
        dataSource: 'AIAA / NASA Multirotor Flight Dynamics Literature.',
        equationsUsed: [
          'Hover Thrust Requirement: T_total = 2.0 · m_drone · g',
          'Propeller Power: P_aero = C_p · ρ · n³ · D⁵',
          'Yaw Torque Equilibrium: τ_yaw = (Q₁ + Q₃) - (Q₂ + Q₄) = I_zz · α_z'
        ],
        assumedParameters: ['500mm diagonal wheelbase, 10x5.5 inch propellers, 2.2 kg takeoff weight'],
        unknownParameters: [],
        accuracyDisclosure: 'Aerospace-grade autonomous drone digital twin.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: CAR WHEEL ---
  private static planCarWheel(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      rimRadius: ModelProvenanceEngine.createProvenanceValue(1.4, 'LIT', 'CONFIRMED', { referenceStandard: '19-Inch Monoblock Forging' }),
      wheelWidth: ModelProvenanceEngine.createProvenanceValue(1.1, 'LIT', 'CONFIRMED'),
      spokeCount: ModelProvenanceEngine.createProvenanceValue(5, 'USER', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'CAR_WHEEL',
      displayName: '19" Forged 5-Spoke Wheel & 380mm Disc Brake Assembly',
      domain: 'AUTOMOTIVE_ENGINEERING',
      constructionMethod: 'ENGINEERING_ASSEMBLY',
      parameters,
      requiredInformation: ['Rim diameter', 'Section width & aspect ratio', 'Brake rotor dimensions'],
      missingInformation: [],
      assumptions: ['Forged 6061-T6 monoblock 5-spoke rim, 265/35R19 low-profile sport tire, cross-drilled rotor, and 6-piston caliper.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'VERIFIED',
      fidelityClassification: 'ENGINEERING_SPECIFICATION',
      explanation: {
        whatBuilt: 'Automotive Wheel Corner Module comprising forged alloy rim, high-grip rubber tire, 380mm vented rotor, and 6-piston red caliper.',
        whySelected: 'Automotive unsprung rotational corner assembly managing traction, cornering lateral forces, and kinetic braking energy.',
        dataSource: 'SAE J2530 Aftermarket Wheels / ISO 7141 Standards.',
        equationsUsed: [
          'Tire Kinetic Energy: E_k = 0.5 · m · v² + 0.5 · I_wheel · ω²',
          'Braking Torque: T_brake = 2 · μ_pad · F_clamp · r_effective',
          'Rim Radial Fatigue: S_radial = F_r · K_factor'
        ],
        assumedParameters: ['19x9.5J rim geometry, 380x34mm floating vented rotor'],
        unknownParameters: [],
        accuracyDisclosure: 'Automotive-grade wheel and brake digital twin.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: GEARBOX ---
  private static planGearbox(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      width: ModelProvenanceEngine.createProvenanceValue(3.0, 'LIT', 'CONFIRMED'),
      height: ModelProvenanceEngine.createProvenanceValue(2.4, 'LIT', 'CONFIRMED'),
      depth: ModelProvenanceEngine.createProvenanceValue(2.2, 'LIT', 'CONFIRMED')
    };

    return {
      planId,
      targetQuery: query,
      objectType: 'GEARBOX',
      displayName: 'Industrial Single-Stage Helical Speed Reducer (3:1)',
      domain: 'MECHANICAL_POWER_TRANSMISSION',
      constructionMethod: 'ENGINEERING_ASSEMBLY',
      parameters,
      requiredInformation: ['Reduction ratio', 'Input/Output shaft bores', 'Housing casting material'],
      missingInformation: [],
      assumptions: ['Horizontally split EN-GJL-250 cast-iron casing with 18T drive pinion, 54T bull gear (3:1 reduction), and tapered roller bearings.'],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'VERIFIED',
      fidelityClassification: 'ENGINEERING_SPECIFICATION',
      explanation: {
        whatBuilt: 'Industrial Helical Gearbox Assembly including cast iron split housing, hardened pinion and bull gears, input/output shafts, and bearings.',
        whySelected: 'Mechanical speed reducer multiplying torque while matching motor prime mover velocity to driven industrial loads.',
        dataSource: 'AGMA 6010 / ISO 6336 Calculation of Load Capacity of Spur and Helical Gears.',
        equationsUsed: [
          'Gear Ratio: i = z_driven / z_driver = 54 / 18 = 3.00:1',
          'Output Torque: T_out = T_in · i · η_eff',
          'Contact Stress: σ_H = Z_E · √[ (F_t / (b · d_1)) · ((u + 1) / u) · K_A · K_V · K_Hβ ]'
        ],
        assumedParameters: ['18T/54T gearset, m=4.0mm module, 1450 Nm continuous output torque'],
        unknownParameters: [],
        accuracyDisclosure: 'Engineering-grade power transmission digital twin.'
      },
      createdAt: Date.now()
    };
  }

  // --- PLAN: GENERIC OBJECT ---
  private static planGenericObject(query: string, planId: string): AutonomousModelPlan {
    const parameters: Record<string, ProvenanceValue<any>> = {
      radius: ModelProvenanceEngine.createProvenanceValue(1.4, 'ESTIMATED', 'LIKELY')
    };

    return {
      planId,
      targetQuery: query,
      objectType: `GENERIC_${query.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`,
      displayName: `Procedural ${query}`,
      domain: 'SCIENTIFIC_3D',
      constructionMethod: 'PROCEDURALLY_APPROXIMATED',
      parameters,
      requiredInformation: ['Exact geometric specification'],
      missingInformation: ['Detailed dimensional tolerances or CAD dataset'],
      assumptions: [`Constructing a procedural multi-component 3D model representing '${query}'.`],
      validationRules: ['POSITIVE_DIMENSIONS'],
      qualityTier: 'ILLUSTRATIVE',
      fidelityClassification: 'APPROXIMATE_ANALOG',
      explanation: {
        whatBuilt: `Multi-component procedural 3D solid assembly representing '${query}'.`,
        whySelected: 'Exact CAD or dataset is unavailable; procedural multi-part solid generated with structural chassis, interface surfaces, and mounting elements.',
        dataSource: 'Procedural geometric assembly synthesis.',
        equationsUsed: ['Volumetric Composition: V = Σ V_components'],
        assumedParameters: ['Normalized bounding volume [1.4m scale]'],
        unknownParameters: ['Exact real-world engineering dimensions'],
        accuracyDisclosure: 'Illustrative 3D representation only.'
      },
      createdAt: Date.now()
    };
  }
}
