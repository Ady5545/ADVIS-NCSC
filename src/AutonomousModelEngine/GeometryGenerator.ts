// src/AutonomousModelEngine/GeometryGenerator.ts
// Procedural, Parametric, and Mathematical 3D Geometry Generator

import * as THREE from 'three';
import { ComponentMetadata } from '../SpatialLibrary';
import { ProceduralMeshSpecification } from './ModelTypes';
import { ManufacturedObjectGenerators } from './ManufacturedObjectGenerators';
import { UniversalDecomposition } from './UniversalDecomposition';
import { HighFidelityGenerators } from './HighFidelityGenerators';
import { UniversalSemanticAssembler } from './UniversalSemanticAssembler';

export interface GeneratedAssemblyPayload {
  components: ComponentMetadata[];
  meshSpecs: Record<string, ProceduralMeshSpecification>;
  geometries: Record<string, THREE.BufferGeometry>;
}

export class GeometryGenerator {
  /**
   * Generates a complete mathematical, parametric, or engineering 3D geometry bundle.
   */
  public static async generateGeometry(
    objectType: string,
    parameters: Record<string, any>
  ): Promise<GeneratedAssemblyPayload> {
    const normType = objectType.toLowerCase().trim();

    // High-Fidelity Universal Semantic Decomposition Assemblies
    if (normType.includes('bicycle') || normType.includes('bike') || normType.includes('cycling')) {
      return HighFidelityGenerators.generateBicycle(parameters);
    }
    if (normType.includes('shoe') || normType.includes('oxford') || normType.includes('footwear') || normType.includes('boot') || normType.includes('sneaker')) {
      return HighFidelityGenerators.generateOxfordShoe(parameters);
    }
    if (normType.includes('drill') || normType.includes('power_drill') || normType.includes('driver')) {
      return HighFidelityGenerators.generatePowerDrill(parameters);
    }
    if (normType.includes('coffee') || normType.includes('espresso') || normType.includes('coffee_machine')) {
      return HighFidelityGenerators.generateCoffeeMachine(parameters);
    }
    if (normType.includes('desktop') || normType.includes('tower') || normType.includes('workstation') || (normType.includes('pc') && !normType.includes('pcb'))) {
      return HighFidelityGenerators.generateDesktopPC(parameters);
    }
    if (normType.includes('microscope') || normType.includes('optics')) {
      return HighFidelityGenerators.generateMicroscope(parameters);
    }
    if (normType.includes('camera') || normType.includes('dslr')) {
      return UniversalDecomposition.generateCamera(parameters);
    }
    if (normType.includes('drone') || normType.includes('quadcopter') || normType.includes('uav')) {
      return UniversalDecomposition.generateDrone(parameters);
    }
    if (normType.includes('car_wheel') || (normType.includes('wheel') && !normType.includes('gear') && !normType.includes('flywheel'))) {
      return UniversalDecomposition.generateCarWheel(parameters);
    }
    if (normType.includes('gearbox') || normType.includes('transmission')) {
      return UniversalDecomposition.generateGearbox(parameters);
    }
    if (normType.includes('helmet')) {
      return UniversalDecomposition.generateHelmet(parameters);
    }
    if (normType.includes('ceiling_fan') || (normType.includes('fan') && !normType.includes('turbofan'))) {
      return UniversalDecomposition.generateCeilingFan(parameters);
    }
    if (normType.includes('transformer')) {
      return UniversalDecomposition.generateTransformer(parameters);
    }

    if (normType.includes('gear') && !normType.includes('planetary') && !normType.includes('box')) {
      return this.generateParametricGear(parameters);
    }
    if (normType.includes('planetary')) {
      return this.generatePlanetaryGearbox(parameters);
    }
    if (normType.includes('geoid')) {
      return this.generateGeoidApproximation(parameters);
    }
    if (normType.includes('paraboloid')) {
      return this.generateParaboloid(parameters);
    }
    if (normType.includes('hyperboloid')) {
      return this.generateHyperboloid(parameters);
    }
    if (normType.includes('torus')) {
      return this.generateParametricTorus(parameters);
    }
    if (normType.includes('sphere')) {
      return this.generateSphere(parameters);
    }
    if (normType.includes('cylinder') || normType.includes('shaft')) {
      return this.generateShaft(parameters);
    }
    if (normType.includes('spring') || normType.includes('helix')) {
      return this.generateSpring(parameters);
    }
    if (normType.includes('pump') || normType.includes('centrifugal')) {
      return this.generateCentrifugalPump(parameters);
    }
    

    if (normType.includes('ellipsoid')) {
      return this.generateEllipsoid(parameters);
    }
    if (normType.includes('cone')) {
      return this.generateCone(parameters);
    }
    if (normType.includes('bearing')) {
      return this.generateBallBearing(parameters);
    }
    if (normType.includes('heat sink') || normType.includes('heatsink') || normType.includes('heat exchanger')) {
      return this.generateHeatSink(parameters);
    }
    if (normType.includes('transformer')) {
      return this.generateTransformer(parameters);
    }
    if (normType.includes('solar') || normType.includes('photovoltaic')) {
      return this.generateSolarPanel(parameters);
    }
    if (normType.includes('beam') || normType.includes('i-beam') || normType.includes('ibeam')) {
      return this.generateIBeam(parameters);
    }
    if (normType.includes('bracket')) {
      return this.generateBracketWithHoles(parameters);
    }
    if (normType.includes('motor')) {
      return this.generateElectricMotor(parameters);
    }
    if (normType.includes('pulley')) {
      return this.generatePulley(parameters);
    }
    if (normType.includes('pcb') || normType.includes('circuit')) {
      return this.generatePCB(parameters);
    }
    if (normType.includes('truss')) {
      return this.generateTruss(parameters);
    }
    if (normType.includes('saddle') || normType.includes('surface')) {
      return this.generateSaddleSurface(parameters);
    }
    if (normType.includes('phone') || normType.includes('smartphone') || normType.includes('mobile') || normType.includes('cell')) {
      return ManufacturedObjectGenerators.generateSmartphone(parameters);
    }
    if (normType.includes('laptop') || normType.includes('notebook') || normType.includes('macbook')) {
      return ManufacturedObjectGenerators.generateLaptop(parameters);
    }
    if (normType.includes('keyboard')) {
      return ManufacturedObjectGenerators.generateKeyboard(parameters);
    }
    if (normType.includes('mouse')) {
      return ManufacturedObjectGenerators.generateMouse(parameters);
    }
    if (normType.includes('bottle') || normType.includes('flask')) {
      return ManufacturedObjectGenerators.generateWaterBottle(parameters);
    }
    if (normType.includes('monitor') || normType.includes('screen') || normType.includes('display')) {
      return ManufacturedObjectGenerators.generateMonitor(parameters);
    }
    if (normType.includes('smartwatch') || normType.includes('watch')) {
      return ManufacturedObjectGenerators.generateSmartwatch(parameters);
    }
    if (normType.includes('headphone') || normType.includes('headset')) {
      return ManufacturedObjectGenerators.generateHeadphones(parameters);
    }
    if (normType.includes('controller') || normType.includes('gamepad') || normType.includes('joystick')) {
      return ManufacturedObjectGenerators.generateGameController(parameters);
    }

    // Common manufactured / physical object query composition fallback
    return await UniversalSemanticAssembler.assemble(objectType, parameters);
  }

  // =========================================================================
  // 1. PARAMETRIC INVOLUTE GEAR
  // =========================================================================
  public static generateParametricGear(params: Record<string, any>): GeneratedAssemblyPayload {
    const teeth = Number(params.teeth || params.numTeeth || 24);
    const moduleVal = Number(params.module || 2.0);
    const pressureAngle = Number(params.pressureAngle || 20); // degrees
    const faceWidth = Number(params.faceWidth || 0.6); // thickness along z
    const boreDiameter = Number(params.boreDiameter || 0.4);

    // Standard Gear Kinematic Dimensions (scaled for 3D viewport)
    const pitchRadius = (teeth * moduleVal) * 0.05;
    const addendum = moduleVal * 0.05;
    const dedendum = 1.25 * moduleVal * 0.05;
    const outerRadius = pitchRadius + addendum;
    const rootRadius = Math.max(0.2, pitchRadius - dedendum);
    const boreRadius = boreDiameter * 0.5;

    // Create 2D Gear Cross-Section Shape with Involute-Like Teeth Profiles
    const shape = new THREE.Shape();
    const numPoints = teeth * 4;
    const angleStep = (Math.PI * 2) / teeth;

    for (let i = 0; i < teeth; i++) {
      const a0 = i * angleStep;
      const a1 = a0 + angleStep * 0.25;
      const a2 = a0 + angleStep * 0.45;
      const a3 = a0 + angleStep * 0.70;
      const a4 = a0 + angleStep * 0.90;

      // Root to Pitch flank
      const x0 = Math.cos(a0) * rootRadius;
      const y0 = Math.sin(a0) * rootRadius;
      const x1 = Math.cos(a1) * pitchRadius;
      const y1 = Math.sin(a1) * pitchRadius;
      // Tooth Crest
      const x2 = Math.cos(a2) * outerRadius;
      const y2 = Math.sin(a2) * outerRadius;
      const x3 = Math.cos(a3) * outerRadius;
      const y3 = Math.sin(a3) * outerRadius;
      // Flank down to root
      const x4 = Math.cos(a4) * rootRadius;
      const y4 = Math.sin(a4) * rootRadius;

      if (i === 0) {
        shape.moveTo(x0, y0);
      } else {
        shape.lineTo(x0, y0);
      }
      shape.lineTo(x1, y1);
      shape.lineTo(x2, y2);
      shape.lineTo(x3, y3);
      shape.lineTo(x4, y4);
    }
    shape.closePath();

    // Center shaft bore hole
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    // Extrude into 3D solid mesh geometry
    const extrudeSettings = {
      steps: 2,
      depth: faceWidth,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 3
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    geometry.computeVertexNormals();

    const gearId = `gear_${teeth}t_m${moduleVal}`;
    const comp: ComponentMetadata = {
      id: gearId,
      name: `${teeth}-Tooth Spur Gear (m=${moduleVal})`,
      description: `Involute metric spur gear with ${teeth} teeth, ${pressureAngle}° pressure angle, and ${pitchRadius.toFixed(2)}m pitch radius.`,
      position: [0, 0, 0],
      size: [outerRadius * 2, outerRadius * 2, faceWidth],
      explodedOffset: [0, 0, 0],
      shape: 'custom',
      color: '#06b6d4',
      specifications: {
        'Teeth Count (z)': String(teeth),
        'Module (m)': `${moduleVal} mm`,
        'Pressure Angle (α)': `${pressureAngle}°`,
        'Pitch Diameter (d)': `${(moduleVal * teeth).toFixed(1)} mm`,
        'Tip Diameter (da)': `${(moduleVal * (teeth + 2)).toFixed(1)} mm`,
        'Root Diameter (df)': `${(moduleVal * (teeth - 2.5)).toFixed(1)} mm`,
        'Face Width (b)': `${(faceWidth * 20).toFixed(1)} mm`
      },
      engineeringDetails: {
        material: 'AISI 4140 Chromoly Steel (Case Hardened 58-62 HRC)',
        tolerances: 'ISO 1328 Grade 6 DIN 3962',
        stressThreshold: 'Bending: 430 MPa | Contact: 1450 MPa'
      }
    };

    // Add Shaft Component
    const shaftComp: ComponentMetadata = {
      id: `${gearId}_shaft`,
      name: 'Keyed Drive Shaft',
      description: 'Precision ground steel drive shaft with parallel DIN 6885 keyway.',
      position: [0, 0, 0],
      size: [boreRadius * 2, boreRadius * 2, faceWidth * 2.2],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#94a3b8',
      rotation: [Math.PI / 2, 0, 0],
      specifications: {
        'Diameter': `${(boreDiameter * 20).toFixed(1)} mm`,
        'Length': `${(faceWidth * 44).toFixed(1)} mm`,
        'Fit Class': 'ISO h6 Transition Fit'
      }
    };

    const shaftGeom = new THREE.CylinderGeometry(boreRadius * 0.98, boreRadius * 0.98, faceWidth * 2.2, 32);
    shaftGeom.rotateX(Math.PI / 2);

    return {
      components: [comp, shaftComp],
      meshSpecs: {
        [gearId]: {
          id: gearId,
          name: comp.name,
          meshType: 'INVOLUTE_GEAR',
          parameters: { teeth, moduleVal, pressureAngle, faceWidth, pitchRadius, outerRadius },
          color: '#06b6d4',
          materialType: 'PBR_METALLIC'
        },
        [`${gearId}_shaft`]: {
          id: `${gearId}_shaft`,
          name: shaftComp.name,
          meshType: 'CUSTOM_PRIMITIVE',
          parameters: { diameter: boreDiameter, length: faceWidth * 2.2 },
          color: '#94a3b8',
          materialType: 'PBR_METALLIC'
        }
      },
      geometries: {
        [gearId]: geometry,
        [`${gearId}_shaft`]: shaftGeom
      }
    };
  }

  // =========================================================================
  // 2. SCIENTIFIC GEOID APPROXIMATION (Earth Gravitational Equipotential)
  // =========================================================================
  public static generateGeoidApproximation(params: Record<string, any>): GeneratedAssemblyPayload {
    const radius = Number(params.radius || 1.8);
    const harmonicDegree = Number(params.harmonicDegree || 12);
    const undulationExaggeration = Number(params.undulationScale || 0.25); // Exaggeration factor for 3D visibility

    const segments = 64;
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    // Perturb vertices using spherical harmonic approximation of Earth's Geoid (EGM96 / WGS84)
    // Low undulations (-107m Indian Ocean Geoid Low) -> Cyan / Deep Blue
    // High undulations (+85m North Atlantic / Iceland High) -> Amber / Bright Orange
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const r = Math.sqrt(x * x + y * y + z * z);
      const theta = Math.acos(Math.max(-1, Math.min(1, y / r))); // colatitude
      const phi = Math.atan2(z, x); // longitude

      // Gravitational anomaly harmonic synthesis:
      // J2 zonal flattening + dynamic tesseral harmonics approximating geoid highs and lows
      const j2 = -0.00108263 * (3 * Math.cos(theta) ** 2 - 1) * 0.5;
      const c22 = 0.00045 * Math.sin(theta) ** 2 * Math.cos(2 * phi);
      const c30 = -0.00025 * (5 * Math.cos(theta) ** 3 - 3 * Math.cos(theta)) * 0.5;
      const c40 = 0.00030 * (35 * Math.cos(theta) ** 4 - 30 * Math.cos(theta) ** 2 + 3) / 8;
      const regionalAnomalies = (
        0.0008 * Math.sin(3 * theta) * Math.sin(3 * phi) +
        0.0006 * Math.cos(4 * theta) * Math.cos(2 * phi) +
        0.0005 * Math.sin(2 * theta) * Math.cos(phi + 1.2)
      );

      const undulation = (j2 + c22 + c30 + c40 + regionalAnomalies) * undulationExaggeration;
      const perturbedRadius = r * (1.0 + undulation);

      const nx = (x / r) * perturbedRadius;
      const ny = (y / r) * perturbedRadius;
      const nz = (z / r) * perturbedRadius;

      pos.setXYZ(i, nx, ny, nz);

      // Color mapping based on geoid height anomaly:
      // -100m to +80m normalized
      const normUndulation = (undulation / (0.002 * undulationExaggeration) + 1.0) * 0.5;
      const colorVal = Math.max(0, Math.min(1, normUndulation));

      // Color gradient: Deep Cyan/Blue (Low) -> Green/Yellow (Mean) -> Crimson/Amber (High)
      const c = new THREE.Color();
      if (colorVal < 0.5) {
        c.setRGB(0.05 + colorVal * 0.4, 0.4 + colorVal * 0.8, 0.8 + colorVal * 0.2);
      } else {
        c.setRGB(0.2 + colorVal * 0.8, 0.8 - (colorVal - 0.5) * 0.6, 0.2);
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const compId = 'earth_geoid_model';
    const comp: ComponentMetadata = {
      id: compId,
      name: 'Earth Geoid (EGM96 Equipotential Surface)',
      description: 'Gravitational equipotential surface (WGS84 Reference Ellipsoid perturbed by Earth Gravitational Model EGM96 spherical harmonics).',
      position: [0, 0, 0],
      size: [radius * 2, radius * 2, radius * 2],
      explodedOffset: [0, 0, 0],
      shape: 'custom',
      color: '#06b6d4',
      specifications: {
        'Reference Datum': 'WGS84 Reference Spheroid (a=6378.137 km)',
        'Gravitational Model': 'EGM96 Spherical Harmonics',
        'Max Geoid High': '+85.4 m (North Atlantic Geoid High)',
        'Min Geoid Low': '-106.8 m (Indian Ocean Geoid Low)',
        'Harmonic Degree': String(harmonicDegree),
        'Vertical Exaggeration': `${(undulationExaggeration * 1000).toFixed(0)}x (visual contrast)`
      },
      engineeringDetails: {
        verticalDatum: 'Mean Sea Level (Equipotential Gravitational Potential W0 = 62,636,856.0 m²/s²)',
        accuracy: 'Mathematical approximation over spherical harmonics. Non-contact satellite altimetry approximation.'
      }
    };

    return {
      components: [comp],
      meshSpecs: {
        [compId]: {
          id: compId,
          name: comp.name,
          meshType: 'GEOID_SPHERICAL_HARMONIC',
          parameters: { radius, harmonicDegree, undulationExaggeration },
          color: '#06b6d4',
          materialType: 'ELEVATION_MAP',
          equationFormula: 'W(r,θ,λ) = (GM/r) * [1 + Σ Σ (a/r)^n (C_nm cos mλ + S_nm sin mλ) P_nm(cos θ)]'
        }
      },
      geometries: {
        [compId]: geometry
      }
    };
  }

  // =========================================================================
  // 3. MATHEMATICAL SURFACES (Paraboloid, Torus, Saddle, Hyperboloid)
  // =========================================================================
  public static generateParaboloid(params: Record<string, any>): GeneratedAssemblyPayload {
    const a = Number(params.a || 0.6); // curvature factor
    const height = Number(params.height || 2.0);
    const radius = Math.sqrt(height / a);

    const segmentsR = 32;
    const segmentsTheta = 64;
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Parametric surface: x = r cos(θ), y = a*r², z = r sin(θ)
    for (let i = 0; i <= segmentsR; i++) {
      const rNorm = i / segmentsR;
      const r = rNorm * radius;
      const y = a * r * r - height * 0.5;

      for (let j = 0; j <= segmentsTheta; j++) {
        const theta = (j / segmentsTheta) * Math.PI * 2;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        positions.push(x, y, z);
        uvs.push(rNorm, j / segmentsTheta);
      }
    }

    for (let i = 0; i < segmentsR; i++) {
      for (let j = 0; j < segmentsTheta; j++) {
        const p1 = i * (segmentsTheta + 1) + j;
        const p2 = p1 + (segmentsTheta + 1);
        const p3 = p1 + 1;
        const p4 = p2 + 1;

        indices.push(p1, p2, p3);
        indices.push(p3, p2, p4);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const compId = 'elliptic_paraboloid';
    const comp: ComponentMetadata = {
      id: compId,
      name: 'Elliptic Paraboloid Surface',
      description: `Mathematical quadric surface defined by z = a(x² + y²) with focal parameter a=${a}.`,
      position: [0, 0, 0],
      size: [radius * 2, height, radius * 2],
      explodedOffset: [0, 0, 0],
      shape: 'custom',
      color: '#38bdf8',
      specifications: {
        'Equation': `y = ${a} * (x² + z²)`,
        'Focal Length (f)': `${(1 / (4 * a)).toFixed(3)} m`,
        'Aperture Diameter': `${(radius * 2).toFixed(2)} m`,
        'Total Depth': `${height.toFixed(2)} m`,
        'Surface Class': 'Quadric Revolution Surface'
      }
    };

    return {
      components: [comp],
      meshSpecs: {
        [compId]: {
          id: compId,
          name: comp.name,
          meshType: 'PARAMETRIC_SURFACE',
          parameters: { a, height, radius },
          color: '#38bdf8',
          materialType: 'HOLOGRAPHIC',
          equationFormula: `z = ${a}(x² + y²)`
        }
      },
      geometries: {
        [compId]: geometry
      }
    };
  }

  public static generateHyperboloid(params: Record<string, any>): GeneratedAssemblyPayload {
    const a = Number(params.a || 0.8);
    const b = Number(params.b || 0.8);
    const c = Number(params.c || 1.0);
    const height = Number(params.height || 2.4);

    const segmentsU = 32;
    const segmentsV = 64;
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];

    // Parametric hyperboloid of one sheet:
    // x = a * cosh(u) * cos(v), y = c * sinh(u), z = b * cosh(u) * sin(v)
    const uMax = 1.2;
    for (let i = 0; i <= segmentsU; i++) {
      const u = -uMax + (i / segmentsU) * 2 * uMax;
      const coshU = Math.cosh(u);
      const sinhU = Math.sinh(u);
      const y = sinhU * c;

      for (let j = 0; j <= segmentsV; j++) {
        const v = (j / segmentsV) * Math.PI * 2;
        const x = a * coshU * Math.cos(v);
        const z = b * coshU * Math.sin(v);
        positions.push(x, y, z);
      }
    }

    for (let i = 0; i < segmentsU; i++) {
      for (let j = 0; j < segmentsV; j++) {
        const p1 = i * (segmentsV + 1) + j;
        const p2 = p1 + (segmentsV + 1);
        const p3 = p1 + 1;
        const p4 = p2 + 1;

        indices.push(p1, p2, p3);
        indices.push(p3, p2, p4);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const compId = 'hyperboloid_one_sheet';
    const comp: ComponentMetadata = {
      id: compId,
      name: 'Hyperboloid of One Sheet',
      description: `Doubly ruled quadric surface defined by x²/a² + z²/b² - y²/c² = 1.`,
      position: [0, 0, 0],
      size: [a * Math.cosh(uMax) * 2, height, b * Math.cosh(uMax) * 2],
      explodedOffset: [0, 0, 0],
      shape: 'custom',
      color: '#f59e0b',
      specifications: {
        'Equation': `x²/${a}² + z²/${b}² - y²/${c}² = 1`,
        'Waist Radius (Throat)': `${a.toFixed(2)} m`,
        'Ruling Type': 'Doubly Ruled (Linear Generators)',
        'Height': `${height.toFixed(2)} m`
      }
    };

    return {
      components: [comp],
      meshSpecs: {
        [compId]: {
          id: compId,
          name: comp.name,
          meshType: 'PARAMETRIC_SURFACE',
          parameters: { a, b, c, height },
          color: '#f59e0b',
          materialType: 'HOLOGRAPHIC',
          equationFormula: 'x²/a² + y²/b² - z²/c² = 1'
        }
      },
      geometries: {
        [compId]: geometry
      }
    };
  }

  public static generateParametricTorus(params: Record<string, any>): GeneratedAssemblyPayload {
    const majorRadius = Number(params.majorRadius || params.radius || 1.8);
    const minorRadius = Number(params.minorRadius || params.tubeRadius || 0.55);
    const geometry = new THREE.TorusGeometry(majorRadius, minorRadius, 32, 64);

    const compId = 'parametric_torus';
    const comp: ComponentMetadata = {
      id: compId,
      name: `Parametric Torus (R=${majorRadius}, r=${minorRadius})`,
      description: `Surface of revolution generated by revolving a circle in three-dimensional space about an axis coplanar with the circle.`,
      position: [0, 0, 0],
      size: [(majorRadius + minorRadius) * 2, (majorRadius + minorRadius) * 2, minorRadius * 2],
      explodedOffset: [0, 0, 0],
      shape: 'torus',
      color: '#22d3ee',
      specifications: {
        'Major Radius (R)': `${majorRadius} m`,
        'Minor Radius (r)': `${minorRadius} m`,
        'Surface Area': `${(4 * Math.PI ** 2 * majorRadius * minorRadius).toFixed(2)} m²`,
        'Volume': `${(2 * Math.PI ** 2 * majorRadius * minorRadius ** 2).toFixed(2)} m³`,
        'Aspect Ratio (R/r)': `${(majorRadius / minorRadius).toFixed(2)}`
      }
    };

    return {
      components: [comp],
      meshSpecs: {
        [compId]: {
          id: compId,
          name: comp.name,
          meshType: 'CUSTOM_PRIMITIVE',
          parameters: { majorRadius, minorRadius },
          color: '#22d3ee',
          materialType: 'PBR_METALLIC',
          equationFormula: '(√(x² + y²) - R)² + z² = r²'
        }
      },
      geometries: {
        [compId]: geometry
      }
    };
  }

  public static generateSphere(params: Record<string, any>): GeneratedAssemblyPayload {
    const radius = Number(params.radius || 1.5);
    const geometry = new THREE.SphereGeometry(radius, 48, 48);

    const compId = 'parametric_sphere';
    const comp: ComponentMetadata = {
      id: compId,
      name: `Parametric 3D Sphere (r=${radius})`,
      description: `Geometrical object consisting of the set of points that are all at a distance r from a given point.`,
      position: [0, 0, 0],
      size: [radius * 2, radius * 2, radius * 2],
      explodedOffset: [0, 0, 0],
      shape: 'sphere',
      color: '#06b6d4',
      specifications: {
        'Radius (r)': `${radius} m`,
        'Diameter': `${(radius * 2).toFixed(2)} m`,
        'Surface Area (4πr²)': `${(4 * Math.PI * radius ** 2).toFixed(2)} m²`,
        'Volume (4/3 πr³)': `${((4 / 3) * Math.PI * radius ** 3).toFixed(2)} m³`
      }
    };

    return {
      components: [comp],
      meshSpecs: {
        [compId]: {
          id: compId,
          name: comp.name,
          meshType: 'CUSTOM_PRIMITIVE',
          parameters: { radius },
          color: '#06b6d4',
          materialType: 'PBR_METALLIC',
          equationFormula: 'x² + y² + z² = r²'
        }
      },
      geometries: {
        [compId]: geometry
      }
    };
  }

  public static generateShaft(params: Record<string, any>): GeneratedAssemblyPayload {
    const diameter = Number(params.diameter || 0.6);
    const length = Number(params.length || 2.8);
    const radius = diameter * 0.5;

    const geometry = new THREE.CylinderGeometry(radius, radius, length, 36);
    geometry.rotateZ(Math.PI / 2);

    const compId = 'transmission_shaft';
    const comp: ComponentMetadata = {
      id: compId,
      name: 'Precision Transmission Shaft',
      description: `Cylindrical machine element for transmitting mechanical power and rotational torque.`,
      position: [0, 0, 0],
      size: [length, diameter, diameter],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#94a3b8',
      specifications: {
        'Diameter': `${(diameter * 20).toFixed(1)} mm`,
        'Total Length': `${(length * 100).toFixed(0)} mm`,
        'Section Modulus (Zp)': `${((Math.PI * (diameter * 20) ** 3) / 16).toFixed(0)} mm³`,
        'Polar Moment of Inertia': `${((Math.PI * (diameter * 20) ** 4) / 32).toFixed(0)} mm⁴`
      }
    };

    return {
      components: [comp],
      meshSpecs: {
        [compId]: {
          id: compId,
          name: comp.name,
          meshType: 'CUSTOM_PRIMITIVE',
          parameters: { diameter, length },
          color: '#94a3b8',
          materialType: 'PBR_METALLIC'
        }
      },
      geometries: {
        [compId]: geometry
      }
    };
  }

  public static generateSpring(params: Record<string, any>): GeneratedAssemblyPayload {
    const coilRadius = Number(params.coilRadius || 0.8);
    const wireRadius = Number(params.wireRadius || 0.08);
    const turns = Number(params.turns || 6);
    const height = Number(params.height || 2.4);

    // Create 3D Spring Curve
    const helixPoints: THREE.Vector3[] = [];
    const segments = 120;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * turns;
      const x = Math.cos(angle) * coilRadius;
      const y = (t - 0.5) * height;
      const z = Math.sin(angle) * coilRadius;
      helixPoints.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(helixPoints);
    const geometry = new THREE.TubeGeometry(curve, 120, wireRadius, 16, false);

    const compId = 'helical_compression_spring';
    const comp: ComponentMetadata = {
      id: compId,
      name: 'Helical Compression Spring',
      description: `Mechanical helical spring designed to resist axially applied compression forces.`,
      position: [0, 0, 0],
      size: [coilRadius * 2, height, coilRadius * 2],
      explodedOffset: [0, 0, 0],
      shape: 'custom',
      color: '#f59e0b',
      specifications: {
        'Mean Coil Diameter (D)': `${(coilRadius * 2 * 20).toFixed(1)} mm`,
        'Wire Diameter (d)': `${(wireRadius * 2 * 20).toFixed(1)} mm`,
        'Active Coils (n)': String(turns),
        'Free Length (L0)': `${(height * 50).toFixed(0)} mm`,
        'Spring Index (C=D/d)': `${(coilRadius / wireRadius).toFixed(1)}`
      }
    };

    return {
      components: [comp],
      meshSpecs: {
        [compId]: {
          id: compId,
          name: comp.name,
          meshType: 'PARAMETRIC_SURFACE',
          parameters: { coilRadius, wireRadius, turns, height },
          color: '#f59e0b',
          materialType: 'PBR_METALLIC'
        }
      },
      geometries: {
        [compId]: geometry
      }
    };
  }

  public static generateSaddleSurface(params: Record<string, any>): GeneratedAssemblyPayload {
    const a = Number(params.a || 1.0);
    const b = Number(params.b || 1.0);
    const size = Number(params.size || 2.0);

    const segments = 48;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geometry.attributes.position;

    // Hyperbolic paraboloid: z = (x²/a² - y²/b²) * 0.4
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = ((x * x) / (a * a) - (y * y) / (b * b)) * 0.35;
      pos.setZ(i, z);
    }
    geometry.computeVertexNormals();

    const compId = 'saddle_surface';
    const comp: ComponentMetadata = {
      id: compId,
      name: 'Hyperbolic Paraboloid (Saddle Surface)',
      description: 'Doubly ruled smooth quadric surface with negative Gaussian curvature everywhere.',
      position: [0, 0, 0],
      size: [size, size, size * 0.7],
      explodedOffset: [0, 0, 0],
      shape: 'custom',
      color: '#10b981',
      specifications: {
        'Equation': `z = x²/${a}² - y²/${b}²`,
        'Gaussian Curvature': 'K < 0 (Hyperbolic everywhere)',
        'Inflection Point': 'Saddle point at origin (0, 0, 0)'
      }
    };

    return {
      components: [comp],
      meshSpecs: {
        [compId]: {
          id: compId,
          name: comp.name,
          meshType: 'PARAMETRIC_SURFACE',
          parameters: { a, b, size },
          color: '#10b981',
          materialType: 'HOLOGRAPHIC',
          equationFormula: 'z = x²/a² - y²/b²'
        }
      },
      geometries: {
        [compId]: geometry
      }
    };
  }

  // =========================================================================
  // 4. COMPLEX ENGINEERING ASSEMBLIES (Centrifugal Pump & Planetary Gearbox)
  // =========================================================================
  public static generateCentrifugalPump(params: Record<string, any>): GeneratedAssemblyPayload {
    const scale = Number(params.scale || 1.0);

    // 1. Volute Housing
    const voluteComp: ComponentMetadata = {
      id: 'pump_volute_casing',
      name: 'Cast Iron Volute Casing',
      description: 'Spiral casing with expanding cross-sectional area that decelerates fluid and converts kinetic dynamic pressure into static pressure head.',
      position: [0, 0, 0],
      size: [1.8 * scale, 1.8 * scale, 0.9 * scale],
      explodedOffset: [0, 0, 0],
      shape: 'custom',
      color: '#0284c7',
      specifications: {
        'Material': 'ASTM A48 Class 30 Grey Cast Iron',
        'Max Design Pressure': '16.0 bar',
        'Volute Type': 'Single Spiral with Cutwater Tongue'
      }
    };

    // 2. Closed Impeller
    const impellerComp: ComponentMetadata = {
      id: 'pump_impeller',
      name: 'Enclosed Backward-Curved Impeller',
      description: 'Dynamic rotating component with 6 backward-curved vanes transferring rotational energy directly to the hydraulic working fluid.',
      position: [0, 0, 0],
      size: [1.2 * scale, 1.2 * scale, 0.4 * scale],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#f59e0b',
      specifications: {
        'Vane Geometry': '6 Backward-Curved Radial Vanes (β2 = 28°)',
        'Nominal Diameter': `${(240 * scale).toFixed(0)} mm`,
        'Specific Speed (Ns)': '1850 US gpm'
      }
    };

    // 3. Drive Shaft
    const shaftComp: ComponentMetadata = {
      id: 'pump_shaft',
      name: 'Stainless Steel Drive Shaft',
      description: 'Heavy-duty 316L stainless steel shaft with hardened bearing journals and impeller keyway.',
      position: [0, 0, -0.6 * scale],
      size: [0.25 * scale, 0.25 * scale, 1.6 * scale],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#94a3b8',
      rotation: [Math.PI / 2, 0, 0],
      specifications: {
        'Material': 'AISI 316L Stainless Steel',
        'Shaft Deflection Limit': '< 0.05 mm at seal faces'
      }
    };

    // 4. Dual Ball Bearings
    const bearingComp: ComponentMetadata = {
      id: 'pump_bearings',
      name: 'Deep Groove Radial & Thrust Bearings',
      description: 'Oil-lubricated matched rolling element bearings absorbing combined radial and axial hydraulic thrust loads.',
      position: [0, 0, -0.8 * scale],
      size: [0.6 * scale, 0.6 * scale, 0.4 * scale],
      explodedOffset: [0, 0, 0],
      shape: 'torus',
      color: '#38bdf8',
      specifications: {
        'Bearing Type': 'ISO 6308 C3 Deep Groove + 7308 Angular Contact',
        'L10h Bearing Life': '50,000 Operating Hours'
      }
    };

    // 5. Suction Flange
    const suctionComp: ComponentMetadata = {
      id: 'pump_suction_flange',
      name: 'Axial Suction Inlet Nozzle',
      description: 'DN80 PN16 suction port guiding low-pressure fluid axially toward the impeller eye.',
      position: [0, 0, 0.6 * scale],
      size: [0.7 * scale, 0.7 * scale, 0.4 * scale],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#0369a1',
      rotation: [Math.PI / 2, 0, 0],
      specifications: {
        'Nominal Bore': 'DN80 (3 inch)',
        'Flange Standard': 'EN 1092-2 / ANSI Class 150'
      }
    };

    // 6. Discharge Flange
    const dischargeComp: ComponentMetadata = {
      id: 'pump_discharge_flange',
      name: 'Radial Discharge Outlet Nozzle',
      description: 'DN50 PN16 tangential discharge nozzle outputting high-pressure fluid.',
      position: [0.8 * scale, 0.4 * scale, 0],
      size: [0.5 * scale, 0.6 * scale, 0.5 * scale],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#0369a1',
      specifications: {
        'Nominal Bore': 'DN50 (2 inch)',
        'Operating Flow': '60 m³/h @ 2900 RPM'
      }
    };

    const components = [voluteComp, impellerComp, shaftComp, bearingComp, suctionComp, dischargeComp];

    // Build geometries
    const voluteGeom = new THREE.TorusGeometry(0.7 * scale, 0.35 * scale, 24, 48);
    const impellerGeom = new THREE.CylinderGeometry(0.55 * scale, 0.55 * scale, 0.2 * scale, 32);
    const shaftGeom = new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, 1.6 * scale, 24);
    shaftGeom.rotateX(Math.PI / 2);
    const bearingGeom = new THREE.TorusGeometry(0.25 * scale, 0.1 * scale, 16, 32);
    const suctionGeom = new THREE.CylinderGeometry(0.3 * scale, 0.3 * scale, 0.35 * scale, 24);
    suctionGeom.rotateX(Math.PI / 2);
    const dischargeGeom = new THREE.CylinderGeometry(0.22 * scale, 0.22 * scale, 0.45 * scale, 24);

    return {
      components,
      meshSpecs: {
        pump_volute_casing: { id: 'pump_volute_casing', name: voluteComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { scale }, color: '#0284c7', materialType: 'PBR_METALLIC' },
        pump_impeller: { id: 'pump_impeller', name: impellerComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { scale }, color: '#f59e0b', materialType: 'PBR_METALLIC' },
        pump_shaft: { id: 'pump_shaft', name: shaftComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { scale }, color: '#94a3b8', materialType: 'PBR_METALLIC' },
        pump_bearings: { id: 'pump_bearings', name: bearingComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { scale }, color: '#38bdf8', materialType: 'PBR_METALLIC' },
        pump_suction_flange: { id: 'pump_suction_flange', name: suctionComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { scale }, color: '#0369a1', materialType: 'PBR_METALLIC' },
        pump_discharge_flange: { id: 'pump_discharge_flange', name: dischargeComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { scale }, color: '#0369a1', materialType: 'PBR_METALLIC' }
      },
      geometries: {
        pump_volute_casing: voluteGeom,
        pump_impeller: impellerGeom,
        pump_shaft: shaftGeom,
        pump_bearings: bearingGeom,
        pump_suction_flange: suctionGeom,
        pump_discharge_flange: dischargeGeom
      }
    };
  }

  public static generatePlanetaryGearbox(params: Record<string, any>): GeneratedAssemblyPayload {
    const sunTeeth = Number(params.sunTeeth || 16);
    const planetTeeth = Number(params.planetTeeth || 20);
    const ringTeeth = sunTeeth + 2 * planetTeeth; // Kinematic constraint: zR = zS + 2*zP
    const moduleVal = Number(params.module || 2.0);

    const sunRadius = (sunTeeth * moduleVal) * 0.035;
    const planetRadius = (planetTeeth * moduleVal) * 0.035;
    const carrierDist = sunRadius + planetRadius;
    const ringRadius = (ringTeeth * moduleVal) * 0.035;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Sun Gear
    const sunComp: ComponentMetadata = {
      id: 'sun_gear',
      name: `Sun Gear (${sunTeeth}T)`,
      description: 'High-speed central input spur gear driving 3 orbiting planetary gears.',
      position: [0, 0, 0],
      size: [sunRadius * 2, sunRadius * 2, 0.4],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#f59e0b',
      specifications: { 'Teeth': String(sunTeeth), 'Pitch Radius': `${(sunRadius * 20).toFixed(1)} mm` }
    };
    components.push(sunComp);
    geometries['sun_gear'] = new THREE.CylinderGeometry(sunRadius, sunRadius, 0.4, 32);
    meshSpecs['sun_gear'] = { id: 'sun_gear', name: sunComp.name, meshType: 'INVOLUTE_GEAR', parameters: { teeth: sunTeeth }, color: '#f59e0b' };

    // 2. Three Planet Gears
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const px = Math.cos(angle) * carrierDist;
      const py = Math.sin(angle) * carrierDist;
      const pid = `planet_gear_${i + 1}`;

      const pComp: ComponentMetadata = {
        id: pid,
        name: `Planet Gear #${i + 1} (${planetTeeth}T)`,
        description: `Orbiting planet gear distributing load across ring and sun gear interfaces.`,
        position: [px, py, 0],
        size: [planetRadius * 2, planetRadius * 2, 0.4],
        explodedOffset: [0, 0, 0],
        shape: 'cylinder',
        color: '#06b6d4',
        specifications: { 'Teeth': String(planetTeeth), 'Orbit Angle': `${(i * 120)}°` }
      };
      components.push(pComp);
      geometries[pid] = new THREE.CylinderGeometry(planetRadius, planetRadius, 0.4, 24);
      meshSpecs[pid] = { id: pid, name: pComp.name, meshType: 'INVOLUTE_GEAR', parameters: { teeth: planetTeeth }, color: '#06b6d4' };
    }

    // 3. Ring Gear (Annulus)
    const ringComp: ComponentMetadata = {
      id: 'ring_gear',
      name: `Ring Gear Annulus (${ringTeeth}T)`,
      description: 'Stationary outer ring gear with internal teeth enclosing the epicyclic gear set.',
      position: [0, 0, 0],
      size: [ringRadius * 2.3, ringRadius * 2.3, 0.45],
      explodedOffset: [0, 0, 0],
      shape: 'torus',
      color: '#334155',
      specifications: { 'Internal Teeth': String(ringTeeth), 'Ratio (Carrier Output)': `1 : ${((ringTeeth / sunTeeth) + 1).toFixed(2)}` }
    };
    components.push(ringComp);
    geometries['ring_gear'] = new THREE.TorusGeometry(ringRadius * 1.05, 0.2, 16, 48);
    meshSpecs['ring_gear'] = { id: 'ring_gear', name: ringComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { teeth: ringTeeth }, color: '#334155' };

    return { components, meshSpecs, geometries };
  }

  public static generateEllipsoid(params: Record<string, any>): GeneratedAssemblyPayload {
    const a = Number(params.semiAxisX || params.a || 1.8);
    const b = Number(params.semiAxisY || params.b || 1.2);
    const c = Number(params.semiAxisZ || params.c || 0.9);

    const geom = new THREE.SphereGeometry(1.0, 48, 36);
    geom.scale(a, b, c);
    geom.computeVertexNormals();

    const compId = 'ellipsoid_main';
    const comp: ComponentMetadata = {
      id: compId,
      name: `Triaxial Ellipsoid (${a}×${b}×${c})`,
      description: 'Quadric closed surface with three orthogonal axes of symmetry governed by (x/a)² + (y/b)² + (z/c)² = 1.',
      position: [0, 0, 0],
      size: [a * 2, b * 2, c * 2],
      explodedOffset: [0, 0, 0],
      shape: 'sphere',
      color: '#38bdf8',
      specifications: {
        'Semi-axis a (X)': `${a} m`,
        'Semi-axis b (Y)': `${b} m`,
        'Semi-axis c (Z)': `${c} m`,
        'Volume': `${((4 / 3) * Math.PI * a * b * c).toFixed(3)} m³`
      }
    };

    return {
      components: [comp],
      meshSpecs: {
        [compId]: { id: compId, name: comp.name, meshType: 'PARAMETRIC_SURFACE', parameters: { a, b, c }, color: '#38bdf8', equationFormula: '(x/a)² + (y/b)² + (z/c)² = 1' }
      },
      geometries: { [compId]: geom }
    };
  }

  public static generateCone(params: Record<string, any>): GeneratedAssemblyPayload {
    const rBase = Number(params.baseRadius || params.radius || 1.2);
    const rTop = Number(params.topRadius || 0.0);
    const height = Number(params.height || 2.4);

    const geom = new THREE.CylinderGeometry(rTop, rBase, height, 48);
    geom.computeVertexNormals();

    const compId = 'cone_main';
    const comp: ComponentMetadata = {
      id: compId,
      name: rTop > 0 ? `Truncated Cone / Frustum (r₁=${rBase}, r₂=${rTop})` : `Right Circular Cone (r=${rBase}, h=${height})`,
      description: 'Mathematical conical solid formed by straight line generatrix passing through vertex and base perimeter.',
      position: [0, 0, 0],
      size: [rBase * 2, height, rBase * 2],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#0ea5e9',
      specifications: {
        'Base Radius': `${rBase} m`,
        'Top Radius': `${rTop} m`,
        'Height': `${height} m`,
        'Slant Height': `${Math.sqrt(Math.pow(rBase - rTop, 2) + Math.pow(height, 2)).toFixed(3)} m`
      }
    };

    return {
      components: [comp],
      meshSpecs: {
        [compId]: { id: compId, name: comp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { rBase, rTop, height }, color: '#0ea5e9' }
      },
      geometries: { [compId]: geom }
    };
  }

  public static generateBallBearing(params: Record<string, any>): GeneratedAssemblyPayload {
    const bore = Number(params.boreDiameter || params.innerDiameter || 20); // mm
    const outer = Number(params.outerDiameter || 47); // mm
    const width = Number(params.width || 14); // mm
    const ballCount = Number(params.ballCount || 8);

    const s = 0.05; // scale to 3D units
    const rInner = (bore / 2) * s;
    const rOuter = (outer / 2) * s;
    const rPitch = (rInner + rOuter) / 2;
    const ballRadius = ((rOuter - rInner) * 0.35);
    const depth = width * s;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const addComp = (
      id: string, name: string, description: string,
      pos: [number, number, number], size: [number, number, number],
      offset: [number, number, number], color: string,
      geom: THREE.BufferGeometry, specs: Record<string, string>, materialType = 'PBR_MATTE'
    ) => {
      components.push({ id, name, description, position: pos, size, explodedOffset: offset, shape: 'box', color, specifications: specs });
      geometries[id] = geom;
      meshSpecs[id] = { id, name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color, materialType: materialType as any };
    };

    // Helper to make a hollow cylinder using ExtrudeGeometry
    const createRing = (innerRad: number, outerRad: number, thickness: number) => {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, outerRad, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, innerRad, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      const extrudeSettings = { depth: thickness, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02, curveSegments: 32 };
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.translate(0, 0, -thickness / 2);
      return geom;
    };

    // 1. Outer Ring
    addComp(
      'bearing_outer_ring', `Outer Raceway Ring (Ø${outer}mm)`, 'Precision ground solid outer raceway.',
      [0, 0, 0], [rOuter * 2, rOuter * 2, depth], [0, 0, 1.0], '#475569',
      createRing(rOuter - (rOuter - rInner) * 0.25, rOuter, depth),
      { 'Outer Diameter': `${outer} mm`, 'Material': '52100 Chrome Steel' }, 'PBR_METALLIC'
    );

    // 2. Inner Ring
    addComp(
      'bearing_inner_ring', `Inner Raceway Ring (Ø${bore}mm)`, 'Shaft-mounting solid inner raceway.',
      [0, 0, 0], [rInner * 2, rInner * 2, depth], [0, 0, -1.0], '#64748b',
      createRing(rInner, rInner + (rOuter - rInner) * 0.25, depth),
      { 'Bore Diameter': `${bore} mm`, 'Tolerance Class': 'ABEC-5 / ISO Normal' }, 'PBR_METALLIC'
    );

    // 3. Rolling Balls
    const ballGeoms: THREE.BufferGeometry[] = [];
    for (let i = 0; i < ballCount; i++) {
      const angle = (i * Math.PI * 2) / ballCount;
      const bx = Math.cos(angle) * rPitch;
      const by = Math.sin(angle) * rPitch;
      const ball = new THREE.SphereGeometry(ballRadius, 24, 18);
      ball.translate(bx, by, 0);
      ballGeoms.push(ball);
    }
    
    // We can merge the balls into one component for performance if we don't need them individually,
    // but the original code had them individually. Let's merge them into a single "Rolling Elements" component to be cleaner.
    // Wait, the original code generated individual balls. Let's just create one component for the balls and cage.

    
    // To handle lack of BufferGeometryUtils safely without imports, I will manually create balls or just use the original loop.
    // Let's use the original loop for the balls so they can explode properly radially.
    for (let i = 0; i < ballCount; i++) {
      const angle = (i * Math.PI * 2) / ballCount;
      const bx = Math.cos(angle) * rPitch;
      const by = Math.sin(angle) * rPitch;
      const ballId = `bearing_ball_${i + 1}`;
      const ball = new THREE.SphereGeometry(ballRadius, 24, 18);
      ball.translate(bx, by, 0);
      
      addComp(
        ballId, `Bearing Ball #${i + 1} (Grade 10)`, `Precision spherical rolling element.`,
        [0, 0, 0], [ballRadius * 2, ballRadius * 2, ballRadius * 2], [bx * 1.5, by * 1.5, 0], '#e2e8f0',
        ball, { 'Ball Diameter': `${(ballRadius * 2 / s).toFixed(1)} mm`, 'Sphericity': '< 0.13 µm' }, 'PBR_METALLIC'
      );
    }

    // 4. Retainer Cage
    const cageGeom = createRing(rPitch - ballRadius * 0.4, rPitch + ballRadius * 0.4, depth * 0.5);
    addComp(
      'bearing_cage', 'Steel Ribbon Cage', 'Pressed steel cage guiding the rolling elements.',
      [0, 0, 0], [rPitch * 2, rPitch * 2, depth * 0.5], [0, 0, 0.4], '#cbd5e1',
      cageGeom, { 'Material': 'Pressed Sheet Steel' }, 'PBR_METALLIC'
    );
    
    // 5. Rubber Seals
    const sealZ = depth / 2 - 0.05;
    const sealFront = createRing(rInner + 0.1, rOuter - 0.1, 0.04);
    sealFront.translate(0, 0, sealZ);
    const sealBack = createRing(rInner + 0.1, rOuter - 0.1, 0.04);
    sealBack.translate(0, 0, -sealZ);
    addComp(
      'bearing_seals', 'Nitrile Rubber Seals (2RS)', 'Contact seals retaining lubricant and excluding contaminants.',
      [0, 0, 0], [rOuter * 2, rOuter * 2, depth], [0, 0, 0.6], '#1e293b',
      sealFront, { 'Seal Type': 'Double Lip Nitrile Rubber (NBR)' }, 'PBR_MATTE'
    );
    addComp(
      'bearing_seals_rear', 'Rear Seal', 'Rear nitrile rubber seal.',
      [0, 0, 0], [rOuter * 2, rOuter * 2, depth], [0, 0, -0.6], '#1e293b',
      sealBack, { 'Seal Type': 'Double Lip Nitrile Rubber (NBR)' }, 'PBR_MATTE'
    );

    return { components, meshSpecs, geometries };
  }

  public static generateHeatSink(params: Record<string, any>): GeneratedAssemblyPayload {
    const length = Number(params.length || 100); // mm
    const width = Number(params.width || 80); // mm
    const baseHeight = Number(params.baseThickness || 8); // mm
    const finHeight = Number(params.finHeight || 30); // mm
    const finCount = Number(params.finCount || 8);
    const finThickness = Number(params.finThickness || 2.5); // mm

    const s = 0.025;
    const l3d = length * s;
    const w3d = width * s;
    const baseH3d = baseHeight * s;
    const finH3d = finHeight * s;
    const finT3d = Math.max(0.04, finThickness * s);

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Base Plate
    const baseComp: ComponentMetadata = {
      id: 'heatsink_base',
      name: `Spreader Baseplate (${length}×${width}mm)`,
      description: 'High-conductivity 6063-T5 aluminum base spreading heat from hot semiconductor die to fins.',
      position: [0, -baseH3d / 2, 0],
      size: [w3d, baseH3d, l3d],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#0284c7',
      specifications: { 'Dimensions': `${length} × ${width} × ${baseHeight} mm`, 'Thermal Conductivity': '201 W/(m·K)' }
    };
    components.push(baseComp);
    geometries['heatsink_base'] = new THREE.BoxGeometry(w3d, baseH3d, l3d);
    meshSpecs['heatsink_base'] = { id: 'heatsink_base', name: baseComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { length, width, baseHeight }, color: '#0284c7', materialType: 'PBR_METALLIC' };

    // 2. Extruded Fins
    const finSpacing = (w3d - finCount * finT3d) / (finCount - 1);
    for (let i = 0; i < finCount; i++) {
      const fx = -w3d / 2 + finT3d / 2 + i * (finT3d + finSpacing);
      const finId = `heatsink_fin_${i + 1}`;

      const finComp: ComponentMetadata = {
        id: finId,
        name: `Convection Fin #${i + 1}`,
        description: `Vertical extruded fin providing convective surface area governed by q = h·A·ΔT.`,
        position: [fx, finH3d / 2, 0],
        size: [finT3d, finH3d, l3d],
        explodedOffset: [0, 0, 0],
        shape: 'box',
        color: '#38bdf8',
        specifications: { 'Fin Height': `${finHeight} mm`, 'Fin Thickness': `${finThickness} mm` }
      };
      components.push(finComp);
      geometries[finId] = new THREE.BoxGeometry(finT3d, finH3d, l3d);
      meshSpecs[finId] = { id: finId, name: finComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { finHeight, finThickness }, color: '#38bdf8', materialType: 'PBR_METALLIC' };
    }

    return { components, meshSpecs, geometries };
  }

  public static generateTransformer(params: Record<string, any>): GeneratedAssemblyPayload {
    const nPrimary = Number(params.primaryTurns || 240);
    const nSecondary = Number(params.secondaryTurns || 24);
    const vPrimary = Number(params.primaryVoltage || 120);
    const vSecondary = Number(params.secondaryVoltage || 12);

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Laminated E-I Core
    const coreComp: ComponentMetadata = {
      id: 'transformer_core',
      name: 'Laminated E-I Silicon Steel Core',
      description: 'Grain-oriented silicon steel laminations minimizing hysteresis and eddy-current losses.',
      position: [0, 0, 0],
      size: [2.2, 2.0, 0.8],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#334155',
      specifications: { 'Lamination Thickness': '0.35 mm (M4 grade)', 'Saturation Flux Density Bmax': '1.7 Tesla' }
    };
    components.push(coreComp);
    geometries['transformer_core'] = new THREE.BoxGeometry(2.2, 2.0, 0.8);
    meshSpecs['transformer_core'] = { id: 'transformer_core', name: coreComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { nPrimary, nSecondary }, color: '#334155', materialType: 'PBR_METALLIC' };

    // 2. Primary Winding (Copper)
    const priComp: ComponentMetadata = {
      id: 'transformer_primary_coil',
      name: `Primary Winding (${nPrimary} Turns, ${vPrimary}V)`,
      description: 'High-voltage copper magnet wire coil insulated with class H polyimide varnish.',
      position: [-0.45, 0, 0],
      size: [0.7, 1.4, 1.1],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#f59e0b',
      specifications: { 'Turns N₁': String(nPrimary), 'Rated Voltage V₁': `${vPrimary} V AC`, 'Wire Gauge': '22 AWG Copper' }
    };
    components.push(priComp);
    geometries['transformer_primary_coil'] = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 24);
    meshSpecs['transformer_primary_coil'] = { id: 'transformer_primary_coil', name: priComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { nPrimary }, color: '#f59e0b', materialType: 'PBR_METALLIC' };

    // 3. Secondary Winding (Copper)
    const secComp: ComponentMetadata = {
      id: 'transformer_secondary_coil',
      name: `Secondary Winding (${nSecondary} Turns, ${vSecondary}V)`,
      description: 'Low-voltage heavy gauge copper winding stepped down according to V₂/V₁ = N₂/N₁.',
      position: [0.45, 0, 0],
      size: [0.7, 1.4, 1.1],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#eab308',
      specifications: { 'Turns N₂': String(nSecondary), 'Rated Voltage V₂': `${vSecondary} V AC`, 'Step Ratio': `1 : ${(nPrimary / nSecondary).toFixed(1)}` }
    };
    components.push(secComp);
    geometries['transformer_secondary_coil'] = new THREE.CylinderGeometry(0.52, 0.52, 1.4, 24);
    meshSpecs['transformer_secondary_coil'] = { id: 'transformer_secondary_coil', name: secComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { nSecondary }, color: '#eab308', materialType: 'PBR_METALLIC' };

    return { components, meshSpecs, geometries };
  }

  public static generateSolarPanel(params: Record<string, any>): GeneratedAssemblyPayload {
    const cells = Number(params.cellCount || 60);
    const pMax = Number(params.peakPower || 320); // Watts

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Aluminum Frame
    const frameComp: ComponentMetadata = {
      id: 'solar_frame',
      name: 'Anodized Aluminum Perimeter Frame',
      description: 'Torsion-resistant marine grade extruded aluminum frame rated for 5400 Pa snow load.',
      position: [0, 0, -0.05],
      size: [2.2, 3.4, 0.15],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#475569',
      specifications: { 'Alloy': '6005-T6 Anodized Aluminum', 'Static Load Rating': '5400 Pa front / 2400 Pa rear' }
    };
    components.push(frameComp);
    geometries['solar_frame'] = new THREE.BoxGeometry(2.2, 3.4, 0.1);
    meshSpecs['solar_frame'] = { id: 'solar_frame', name: frameComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { cells }, color: '#475569', materialType: 'PBR_METALLIC' };

    // 2. Photovoltaic Wafer Matrix
    const pvComp: ComponentMetadata = {
      id: 'solar_wafer_matrix',
      name: `Monocrystalline PV Matrix (${cells} Cells)`,
      description: 'Anti-reflective coated silicon wafers interconnected in series strings under tempered glass.',
      position: [0, 0, 0.03],
      size: [2.0, 3.2, 0.04],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#1e3a8a',
      specifications: { 'Cell Architecture': 'P-Type Monocrystalline PERC', 'STC Peak Power': `${pMax} W`, 'Module Efficiency': '20.4%' }
    };
    components.push(pvComp);
    geometries['solar_wafer_matrix'] = new THREE.BoxGeometry(2.0, 3.2, 0.04);
    meshSpecs['solar_wafer_matrix'] = { id: 'solar_wafer_matrix', name: pvComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { cells, pMax }, color: '#1e3a8a', materialType: 'PBR_METALLIC' };

    return { components, meshSpecs, geometries };
  }

  public static generateIBeam(params: Record<string, any>): GeneratedAssemblyPayload {
    const depth = Number(params.depth || params.height || 200); // mm
    const width = Number(params.flangeWidth || 100); // mm
    const webThick = Number(params.webThickness || 6); // mm
    const flangeThick = Number(params.flangeThickness || 9); // mm
    const length = Number(params.length || 1000); // mm

    const s = 0.015;
    const d3d = depth * s;
    const w3d = width * s;
    const l3d = length * s;
    const tf3d = Math.max(0.04, flangeThick * s);
    const tw3d = Math.max(0.04, webThick * s);

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Central Web
    const webHeight = d3d - 2 * tf3d;
    const webComp: ComponentMetadata = {
      id: 'ibeam_web',
      name: `Structural Web (tw=${webThick}mm)`,
      description: 'Shear-carrying central vertical plate resisting transverse vertical shear loads V.',
      position: [0, 0, 0],
      size: [tw3d, webHeight, l3d],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#0284c7',
      specifications: { 'Web Thickness': `${webThick} mm`, 'Shear Area': `${(webThick * (depth - 2 * flangeThick)).toFixed(0)} mm²` }
    };
    components.push(webComp);
    geometries['ibeam_web'] = new THREE.BoxGeometry(tw3d, webHeight, l3d);
    meshSpecs['ibeam_web'] = { id: 'ibeam_web', name: webComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { depth, webThick }, color: '#0284c7', materialType: 'PBR_METALLIC' };

    // 2. Top Flange
    const topComp: ComponentMetadata = {
      id: 'ibeam_top_flange',
      name: `Top Compression Flange (${width}×${flangeThick}mm)`,
      description: 'Extruded horizontal top flange resisting bending moments and compressive normal stresses.',
      position: [0, (d3d - tf3d) / 2, 0],
      size: [w3d, tf3d, l3d],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#38bdf8',
      specifications: { 'Flange Width': `${width} mm`, 'Flange Thickness': `${flangeThick} mm` }
    };
    components.push(topComp);
    geometries['ibeam_top_flange'] = new THREE.BoxGeometry(w3d, tf3d, l3d);
    meshSpecs['ibeam_top_flange'] = { id: 'ibeam_top_flange', name: topComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { width, flangeThick }, color: '#38bdf8', materialType: 'PBR_METALLIC' };

    // 3. Bottom Flange
    const botComp: ComponentMetadata = {
      id: 'ibeam_bottom_flange',
      name: `Bottom Tension Flange (${width}×${flangeThick}mm)`,
      description: 'Horizontal bottom flange resisting positive bending moment tensile stresses.',
      position: [0, -(d3d - tf3d) / 2, 0],
      size: [w3d, tf3d, l3d],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#38bdf8',
      specifications: { 'Flange Width': `${width} mm`, 'Flange Thickness': `${flangeThick} mm` }
    };
    components.push(botComp);
    geometries['ibeam_bottom_flange'] = new THREE.BoxGeometry(w3d, tf3d, l3d);
    meshSpecs['ibeam_bottom_flange'] = { id: 'ibeam_bottom_flange', name: botComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { width, flangeThick }, color: '#38bdf8', materialType: 'PBR_METALLIC' };

    return { components, meshSpecs, geometries };
  }

  public static generateBracketWithHoles(params: Record<string, any>): GeneratedAssemblyPayload {
    const holeCount = 4;
    const holeDia = Number(params.holeDiameter || 8); // mm
    const plateThick = Number(params.thickness || 6); // mm

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Horizontal Base Plate
    const baseComp: ComponentMetadata = {
      id: 'bracket_baseplate',
      name: 'Mounting Baseplate with 4 Bolt Clearances',
      description: 'Heavy duty steel mounting plate with 4 precision drilled bolt holes conforming to ISO 273.',
      position: [0, -0.5, 0.4],
      size: [2.0, 0.2, 1.4],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#0284c7',
      specifications: { 'Bolt Clearances': `${holeCount} × Ø${holeDia}mm`, 'Plate Thickness': `${plateThick} mm`, 'Material': 'ASTM A36 Carbon Steel' }
    };
    components.push(baseComp);
    geometries['bracket_baseplate'] = new THREE.BoxGeometry(2.0, 0.2, 1.4);
    meshSpecs['bracket_baseplate'] = { id: 'bracket_baseplate', name: baseComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { holeDia, plateThick }, color: '#0284c7', materialType: 'PBR_METALLIC' };

    // 2. Upright Vertical Flange
    const uprightComp: ComponentMetadata = {
      id: 'bracket_upright',
      name: 'Vertical Load-Bearing Flange',
      description: 'Orthogonal vertical plate transferring structural cantilever loads to base fasteners.',
      position: [0, 0.3, -0.2],
      size: [2.0, 1.4, 0.2],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#0369a1',
      specifications: { 'Fillet Radius': '8 mm weld fillet', 'Yield Strength': '250 MPa' }
    };
    components.push(uprightComp);
    geometries['bracket_upright'] = new THREE.BoxGeometry(2.0, 1.4, 0.2);
    meshSpecs['bracket_upright'] = { id: 'bracket_upright', name: uprightComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { plateThick }, color: '#0369a1', materialType: 'PBR_METALLIC' };

    // 3. Fastener Bushing Guides (4 Holes)
    const offsets = [[-0.6, 0.1], [0.6, 0.1], [-0.6, 0.7], [0.6, 0.7]];
    offsets.forEach(([hx, hz], idx) => {
      const hid = `bracket_fastener_hole_${idx + 1}`;
      const hComp: ComponentMetadata = {
        id: hid,
        name: `Fastener Clearance Hole #${idx + 1} (Ø${holeDia}mm)`,
        description: 'Through-hole clearance with spot-faced seating surface for M8 hex bolt.',
        position: [hx, -0.5, hz],
        size: [0.25, 0.25, 0.25],
        explodedOffset: [0, 0, 0],
        shape: 'cylinder',
        color: '#38bdf8',
        specifications: { 'Hole Diameter': `${holeDia} mm`, 'Fastener Spec': 'ISO 4014 M8 Class 8.8' }
      };
      components.push(hComp);
      geometries[hid] = new THREE.CylinderGeometry(0.12, 0.12, 0.24, 16);
      meshSpecs[hid] = { id: hid, name: hComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { holeDia }, color: '#38bdf8' };
    });

    return { components, meshSpecs, geometries };
  }

  public static generateElectricMotor(params: Record<string, any>): GeneratedAssemblyPayload {
    const power = Number(params.power || 3.0); // kW
    const poles = Number(params.poles || 4);

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. Stator Casing with Cooling Ribs
    const statorComp: ComponentMetadata = {
      id: 'motor_stator_housing',
      name: 'Cast Iron Stator Housing with Axial Fins',
      description: 'TEFC (Totally Enclosed Fan Cooled) stator housing containing insulated stator copper coils.',
      position: [0, 0, 0],
      size: [1.8, 1.8, 2.2],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#0284c7',
      specifications: { 'Frame Size': 'IEC 100L', 'Protection Class': 'IP55', 'Rated Power': `${power} kW` }
    };
    components.push(statorComp);
    geometries['motor_stator_housing'] = new THREE.CylinderGeometry(0.9, 0.9, 2.2, 32);
    meshSpecs['motor_stator_housing'] = { id: 'motor_stator_housing', name: statorComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { power }, color: '#0284c7', materialType: 'PBR_METALLIC' };

    // 2. Rotor Drive Shaft
    const shaftComp: ComponentMetadata = {
      id: 'motor_rotor_shaft',
      name: 'Rotor Assembly & Precision Shaft',
      description: 'Squirrel-cage aluminum rotor pressed onto 40Cr ground steel output shaft.',
      position: [0, 0, 0],
      size: [0.35, 0.35, 3.2],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#94a3b8',
      specifications: { 'Shaft Diameter': 'Ø28 mm', 'Sync Speed (50Hz)': `${(120 * 50 / poles).toFixed(0)} RPM` }
    };
    components.push(shaftComp);
    geometries['motor_rotor_shaft'] = new THREE.CylinderGeometry(0.18, 0.18, 3.2, 24);
    meshSpecs['motor_rotor_shaft'] = { id: 'motor_rotor_shaft', name: shaftComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { poles }, color: '#94a3b8', materialType: 'PBR_METALLIC' };

    // 3. Terminal Box
    const termComp: ComponentMetadata = {
      id: 'motor_terminal_box',
      name: 'Top Conduit Terminal Box (Star/Delta)',
      description: 'Weatherproof terminal enclosure housing 6-pin brass connection block for 3-phase wiring.',
      position: [0, 1.05, 0],
      size: [0.6, 0.4, 0.6],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#0369a1',
      specifications: { 'Connection': 'Star (400V) / Delta (230V)', 'Gland Entry': 'M25 × 1.5' }
    };
    components.push(termComp);
    geometries['motor_terminal_box'] = new THREE.BoxGeometry(0.6, 0.4, 0.6);
    meshSpecs['motor_terminal_box'] = { id: 'motor_terminal_box', name: termComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#0369a1' };

    return { components, meshSpecs, geometries };
  }

  public static generatePulley(params: Record<string, any>): GeneratedAssemblyPayload {
    const pitchDia = Number(params.pitchDiameter || params.diameter || 120); // mm
    const s = 0.015;
    const r3d = (pitchDia / 2) * s;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    const rimComp: ComponentMetadata = {
      id: 'pulley_grooved_rim',
      name: `V-Belt Pulley Sheave (Ø${pitchDia}mm)`,
      description: 'Machined cast iron pulley sheave with 38° V-groove for high-friction torque transmission.',
      position: [0, 0, 0],
      size: [r3d * 2, r3d * 2, 0.5],
      explodedOffset: [0, 0, 0],
      shape: 'cylinder',
      color: '#0284c7',
      specifications: { 'Pitch Diameter': `${pitchDia} mm`, 'Groove Profile': 'SPA / ISO 4183', 'Belt Wrap Angle': '180° nominal' }
    };
    components.push(rimComp);
    geometries['pulley_grooved_rim'] = new THREE.CylinderGeometry(r3d, r3d, 0.5, 36);
    meshSpecs['pulley_grooved_rim'] = { id: 'pulley_grooved_rim', name: rimComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { pitchDia }, color: '#0284c7', materialType: 'PBR_METALLIC' };

    return { components, meshSpecs, geometries };
  }

  public static generatePCB(params: Record<string, any>): GeneratedAssemblyPayload {
    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // 1. FR-4 Substrate
    const subComp: ComponentMetadata = {
      id: 'pcb_substrate',
      name: '4-Layer FR-4 Epoxy Substrate',
      description: 'Glass-reinforced epoxy dielectric PCB laminate with internal power and ground planes.',
      position: [0, 0, 0],
      size: [2.4, 0.08, 1.8],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#065f46',
      specifications: { 'Board Thickness': '1.6 mm', 'Copper Weight': '1 oz (35 µm)', 'Dielectric Constant εr': '4.4' }
    };
    components.push(subComp);
    geometries['pcb_substrate'] = new THREE.BoxGeometry(2.4, 0.08, 1.8);
    meshSpecs['pcb_substrate'] = { id: 'pcb_substrate', name: subComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#065f46' };

    // 2. Microcontroller IC
    const icComp: ComponentMetadata = {
      id: 'pcb_microcontroller_ic',
      name: 'QFP-64 Microcontroller System IC',
      description: 'Surface-mount 32-bit ARM Cortex-M4 microprocessor with quad-flat package leads.',
      position: [0, 0.08, 0],
      size: [0.6, 0.08, 0.6],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#1e293b',
      specifications: { 'Package': 'LQFP-64 (10×10mm)', 'Clock Frequency': '168 MHz' }
    };
    components.push(icComp);
    geometries['pcb_microcontroller_ic'] = new THREE.BoxGeometry(0.6, 0.08, 0.6);
    meshSpecs['pcb_microcontroller_ic'] = { id: 'pcb_microcontroller_ic', name: icComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: {}, color: '#1e293b' };

    return { components, meshSpecs, geometries };
  }

  public static generateTruss(params: Record<string, any>): GeneratedAssemblyPayload {
    const span = Number(params.span || 2400); // mm
    const s = 0.001;
    const span3d = span * s;

    const components: ComponentMetadata[] = [];
    const geometries: Record<string, THREE.BufferGeometry> = {};
    const meshSpecs: Record<string, ProceduralMeshSpecification> = {};

    // Top Chord
    const topComp: ComponentMetadata = {
      id: 'truss_top_chord',
      name: 'Top Compression Chord Member',
      description: 'Hollow structural section resisting axial compression in Warren truss configuration.',
      position: [0, 0.6, 0],
      size: [span3d, 0.1, 0.1],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#0284c7',
      specifications: { 'Span': `${span} mm`, 'Section': 'HSS 80×80×5 mm Steel' }
    };
    components.push(topComp);
    geometries['truss_top_chord'] = new THREE.BoxGeometry(span3d, 0.1, 0.1);
    meshSpecs['truss_top_chord'] = { id: 'truss_top_chord', name: topComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { span }, color: '#0284c7', materialType: 'PBR_METALLIC' };

    // Bottom Chord
    const botComp: ComponentMetadata = {
      id: 'truss_bottom_chord',
      name: 'Bottom Tension Chord Member',
      description: 'Continuous bottom tension chord carrying principal bending-induced tensile loads.',
      position: [0, -0.6, 0],
      size: [span3d, 0.1, 0.1],
      explodedOffset: [0, 0, 0],
      shape: 'box',
      color: '#38bdf8',
      specifications: { 'Span': `${span} mm`, 'Section': 'HSS 80×80×5 mm Steel' }
    };
    components.push(botComp);
    geometries['truss_bottom_chord'] = new THREE.BoxGeometry(span3d, 0.1, 0.1);
    meshSpecs['truss_bottom_chord'] = { id: 'truss_bottom_chord', name: botComp.name, meshType: 'CUSTOM_PRIMITIVE', parameters: { span }, color: '#38bdf8', materialType: 'PBR_METALLIC' };

    return { components, meshSpecs, geometries };
  }

  public static generateGenericMathematicalObject(objectType: string, params: Record<string, any>): GeneratedAssemblyPayload {
    const radius = Number(params.radius || 1.4);
    const geometry = new THREE.IcosahedronGeometry(radius, 3);
    const compId = `math_obj_${objectType.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const comp: ComponentMetadata = {
      id: compId,
      name: `Parametric ${objectType}`,
      description: `Mathematically constructed 3D scientific solid.`,
      position: [0, 0, 0],
      size: [radius * 2, radius * 2, radius * 2],
      explodedOffset: [0, 0, 0],
      shape: 'sphere',
      color: '#06b6d4',
      specifications: { 'Primitive Class': 'Procedural 3D Mesh', 'Radius': `${radius} m` }
    };

    return {
      components: [comp],
      meshSpecs: {
        [compId]: {
          id: compId,
          name: comp.name,
          meshType: 'CUSTOM_PRIMITIVE',
          parameters: { radius },
          color: '#06b6d4'
        }
      },
      geometries: {
        [compId]: geometry
      }
    };
  }
}
