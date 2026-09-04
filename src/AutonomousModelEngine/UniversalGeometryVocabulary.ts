// src/AutonomousModelEngine/UniversalGeometryVocabulary.ts
// Composable Procedural & Parametric Engineering Geometry Vocabulary

import * as THREE from 'three';

export class UniversalGeometryVocabulary {
  /**
   * Creates a cylinder/tube directly between two 3D vector points.
   */
  public static createTubeBetweenPoints(
    p1: [number, number, number],
    p2: [number, number, number],
    radius: number,
    radialSegments = 16,
    openEnded = false
  ): THREE.BufferGeometry {
    const v1 = new THREE.Vector3(...p1);
    const v2 = new THREE.Vector3(...p2);
    const distance = v1.distanceTo(v2);

    if (distance < 0.0001) {
      return new THREE.CylinderGeometry(radius, radius, 0.01, radialSegments);
    }

    const cylinderGeom = new THREE.CylinderGeometry(radius, radius, distance, radialSegments, 1, openEnded);
    
    // Default Three.js cylinder is along Y axis, center at [0,0,0]
    // Move to center between p1 and p2 and orient along vector
    const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(v2, v1).normalize();

    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);

    cylinderGeom.applyQuaternion(quaternion);
    cylinderGeom.translate(mid.x, mid.y, mid.z);
    cylinderGeom.computeVertexNormals();
    return cylinderGeom;
  }

  /**
   * Creates a smooth curved tube geometry following a sequence of 3D points.
   */
  public static createCurvedTube(
    points: [number, number, number][],
    radius: number,
    tubularSegments = 32,
    radialSegments = 12,
    closed = false
  ): THREE.BufferGeometry {
    const vectors = points.map(p => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(vectors);
    const tubeGeom = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
    tubeGeom.computeVertexNormals();
    return tubeGeom;
  }

  /**
   * Creates a rounded box with smooth corner bevels.
   */
  public static createRoundedBox(
    width: number,
    height: number,
    depth: number,
    radius = 0.05,
    smoothness = 4
  ): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    const w = width - radius * 2;
    const h = height - radius * 2;
    const r = Math.min(radius, width / 4, height / 4);

    shape.moveTo(-w / 2, -h / 2 + r);
    shape.lineTo(-w / 2, h / 2 - r);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2 + r, h / 2);
    shape.lineTo(w / 2 - r, h / 2);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2, h / 2 - r);
    shape.lineTo(w / 2, -h / 2 + r);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2 - r, -h / 2);
    shape.lineTo(-w / 2 + r, -h / 2);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2, -h / 2 + r);

    const extrudeSettings = {
      depth: depth - r * 2,
      bevelEnabled: true,
      bevelSegments: smoothness,
      steps: 1,
      bevelSize: r,
      bevelThickness: r
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Creates a high-fidelity bicycle / motorcycle spoked wheel assembly geometry with rim cross section, hub flanges, nipples, and 32 cross-laced spokes.
   */
  public static createSpokeWheel(
    rimRadius: number,
    tireRadius: number,
    rimWidth: number,
    hubRadius: number,
    spokeCount = 28,
    spokeRadius = 0.008
  ): THREE.BufferGeometry {
    const geoms: THREE.BufferGeometry[] = [];

    // 1. Pneumatic Rubber Tire (Torus with sidewall section)
    const tireSection = Math.max(0.04, tireRadius - rimRadius);
    const tire = new THREE.TorusGeometry(rimRadius + tireSection * 0.45, tireSection * 0.65, 20, 48);
    geoms.push(tire);

    // 2. Double-Wall Aero Rim Profile
    const rimOuter = new THREE.TorusGeometry(rimRadius, rimWidth * 0.4, 16, 48);
    const rimInner = new THREE.TorusGeometry(rimRadius - 0.03, rimWidth * 0.25, 12, 48);
    geoms.push(rimOuter, rimInner);

    // 3. Center Hub Cylinder with Flanges & Axle
    const hubBody = new THREE.CylinderGeometry(hubRadius, hubRadius, rimWidth * 1.8, 20);
    hubBody.rotateX(Math.PI / 2);
    
    const flangeL = new THREE.CylinderGeometry(hubRadius * 1.4, hubRadius * 1.4, 0.02, 20);
    flangeL.rotateX(Math.PI / 2);
    flangeL.translate(0, 0, -rimWidth * 0.8);

    const flangeR = new THREE.CylinderGeometry(hubRadius * 1.4, hubRadius * 1.4, 0.02, 20);
    flangeR.rotateX(Math.PI / 2);
    flangeR.translate(0, 0, rimWidth * 0.8);

    const axle = new THREE.CylinderGeometry(hubRadius * 0.35, hubRadius * 0.35, rimWidth * 2.6, 12);
    axle.rotateX(Math.PI / 2);

    geoms.push(hubBody, flangeL, flangeR, axle);

    // 4. Tangential Cross-Laced Stainless Steel Spokes
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const isLeft = i % 2 === 0;
      const crossOffset = (i % 4 < 2 ? 1 : -1) * 0.25; // 3-cross lacing pattern angle offset
      const hubZ = isLeft ? -rimWidth * 0.8 : rimWidth * 0.8;

      const pHub: [number, number, number] = [
        Math.cos(angle) * hubRadius * 1.2,
        Math.sin(angle) * hubRadius * 1.2,
        hubZ
      ];
      const pRim: [number, number, number] = [
        Math.cos(angle + crossOffset) * rimRadius,
        Math.sin(angle + crossOffset) * rimRadius,
        isLeft ? -rimWidth * 0.15 : rimWidth * 0.15
      ];

      const spokeTube = this.createTubeBetweenPoints(pHub, pRim, spokeRadius, 6);
      geoms.push(spokeTube);

      // Nipple at rim junction
      const nipple = new THREE.CylinderGeometry(spokeRadius * 2.2, spokeRadius * 2.2, 0.025, 8);
      nipple.translate(pRim[0], pRim[1], pRim[2]);
      geoms.push(nipple);
    }

    return this.mergeGeometries(geoms);
  }

  /**
   * Creates a footwear / Oxford shoe sole geometry with heel stack and toe spring.
   */
  public static createShoeSole(
    length: number,
    width: number,
    soleThickness = 0.12,
    heelRise = 0.22,
    toeSpring = 0.08
  ): THREE.BufferGeometry {
    // We create the sole by taking a flattened sphere matching the upper's footprint
    const geom = new THREE.SphereGeometry(1, 64, 16);
    const pos = geom.getAttribute('position');
    const l = length;
    const w = width * 1.05; // Slightly wider than upper for the welt
    
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      
      // Flatten the top and bottom severely
      y = (y + 1) / 2; // 0 to 1
      y = (y * soleThickness) - (soleThickness / 2);
      
      z = z * (l / 2);
      
      let wFactor = w / 2;
      
      if (z < -l * 0.2) {
        wFactor *= 0.65;
      } else if (z >= -l * 0.2 && z < 0) {
        wFactor *= 0.6;
      } else if (z >= 0 && z < l * 0.25) {
        wFactor *= 0.95;
      }
      
      if (z > l * 0.25) {
        const toeTaper = (z - l * 0.25) / (l * 0.25);
        wFactor *= Math.max(0.15, 0.95 - toeTaper * 0.8);
      }
      
      x *= wFactor;
      
      // Apply toe spring and heel rise (camber)
      if (z > l * 0.25) {
        const spring = (z - l * 0.25) / (l * 0.25);
        y += spring * toeSpring;
      } else if (z < -l * 0.2) {
        const rise = (-z - l * 0.2) / (l * 0.3);
        y += rise * heelRise;
      }
      
      pos.setXYZ(i, x, y, z);
    }
    
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Creates an Oxford shoe leather upper shell geometry with lacing throat and collar opening.
   */
  public static createShoeUpper(
    length: number,
    width: number,
    height: number,
    openingRadius = 0.35
  ): THREE.BufferGeometry {
    // Start with a high-res sphere, and stretch it to be an anatomical shoe last.
    const geom = new THREE.SphereGeometry(1, 64, 64);
    const pos = geom.getAttribute('position');
    const l = length;
    const w = width;
    const h = height;
    
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      
      // Start in a normalized -1 to 1 unit sphere.
      
      // Flatten the bottom sharply
      if (y < 0) {
        y = y * 0.05;
      }
      
      // Map Z to length (-l/2 to l/2)
      z = z * (l / 2);
      
      // Asymmetric last: medial side (inside foot) is straighter, lateral side curves.
      // For simplicity, we create a generic elegant chiseled Oxford shape.
      let wFactor = w / 2;
      
      // Heel is narrow
      if (z < -l * 0.2) {
        wFactor *= 0.65;
      } 
      // Waist is narrowest
      else if (z >= -l * 0.2 && z < 0) {
        wFactor *= 0.6;
      }
      // Ball of foot is widest
      else if (z >= 0 && z < l * 0.25) {
        wFactor *= 0.95;
      }
      
      // Toe taper
      if (z > l * 0.25) {
        const toeTaper = (z - l * 0.25) / (l * 0.25);
        wFactor *= Math.max(0.15, 0.95 - toeTaper * 0.8);
      }
      
      x *= wFactor;
      
      // Height profile: low toe, shallow vamp, rising instep, cupped heel
      let hFactor = h;
      
      if (y >= 0) { // Top half of the sphere
        if (z > l * 0.2) {
          // Toe box is very low
          const toeDrop = (z - l * 0.2) / (l * 0.3);
          y *= (hFactor * Math.max(0.2, 0.45 - toeDrop * 0.3));
        } else if (z > 0 && z <= l * 0.2) {
          // Low vamp
          y *= (hFactor * 0.45);
        } else if (z <= 0 && z > -l * 0.25) {
          // Instep rises up to the ankle
          const instepRise = (0 - z) / (l * 0.25); // 0 to 1
          y *= (hFactor * (0.45 + instepRise * 0.55));
        } else {
          // Heel cup drops slightly from ankle
          y *= (hFactor * 0.7);
        }
      }
      
      // Oxford throat & ankle collar opening
      if (y > h * 0.3 && z < -l * 0.05 && z > -l * 0.35) {
        const cx = 0;
        const cz = -l * 0.2;
        // Elliptical opening
        const dist = Math.sqrt((x * 1.5) ** 2 + (z - cz) ** 2);
        if (dist < openingRadius) {
           // Hollow out the foot opening
           y = h * 0.3;
           x *= 0.8;
        }
      }
      
      pos.setXYZ(i, x, Math.max(0, y), z);
    }
    
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Creates an aerodynamic airfoil ceiling fan / drone blade.
   */
  public static createAirfoilBlade(
    length: number,
    rootChord: number,
    tipChord: number,
    thickness = 0.04,
    twistDeg = 12
  ): THREE.BufferGeometry {
    const segments = 16;
    const geoms: THREE.BufferGeometry[] = [];

    const curvePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = t * length;
      const chord = rootChord * (1 - t) + tipChord * t;
      const twist = (twistDeg * (1 - t * 0.7) * Math.PI) / 180;
      
      const bladeSection = new THREE.BoxGeometry(length / segments, thickness * (1 - t * 0.4), chord);
      bladeSection.rotateX(twist);
      bladeSection.translate(x - length / 2 + length / (2 * segments), 0, 0);
      geoms.push(bladeSection);
    }

    return this.mergeGeometries(geoms);
  }

  /**
   * Creates cooling fin array for electrical transformers, engines, or heat sinks.
   */
  public static createCoolingFinArray(
    width: number,
    height: number,
    depth: number,
    finCount = 8,
    finThickness = 0.03,
    finProtrusion = 0.4
  ): THREE.BufferGeometry {
    const geoms: THREE.BufferGeometry[] = [];
    const spacing = depth / (finCount + 1);

    for (let i = 1; i <= finCount; i++) {
      const z = -depth / 2 + i * spacing;
      // Left fin
      const leftFin = new THREE.BoxGeometry(finProtrusion, height * 0.9, finThickness);
      leftFin.translate(-width / 2 - finProtrusion / 2, 0, z);
      geoms.push(leftFin);

      // Right fin
      const rightFin = new THREE.BoxGeometry(finProtrusion, height * 0.9, finThickness);
      rightFin.translate(width / 2 + finProtrusion / 2, 0, z);
      geoms.push(rightFin);
    }

    return this.mergeGeometries(geoms);
  }

  /**
   * Creates high-voltage glazed ceramic shed bushing insulators.
   */
  public static createCeramicBushing(
    height: number,
    maxRadius = 0.18,
    minRadius = 0.08,
    shedCount = 4
  ): THREE.BufferGeometry {
    const geoms: THREE.BufferGeometry[] = [];

    // Central Rod
    const rod = new THREE.CylinderGeometry(minRadius * 0.7, minRadius * 0.7, height, 16);
    geoms.push(rod);

    // Shed Cones (Creepage skirts)
    const shedSpacing = height / (shedCount + 1);
    for (let i = 1; i <= shedCount; i++) {
      const y = -height / 2 + i * shedSpacing;
      const shed = new THREE.ConeGeometry(maxRadius, shedSpacing * 0.6, 16);
      shed.rotateX(Math.PI);
      shed.translate(0, y, 0);
      geoms.push(shed);
    }

    // Top Terminal Stud
    const stud = new THREE.CylinderGeometry(minRadius * 0.5, minRadius * 0.5, height * 0.2, 12);
    stud.translate(0, height / 2 + height * 0.1, 0);
    geoms.push(stud);

    return this.mergeGeometries(geoms);
  }

  /**
   * Creates an automotive cross-drilled and slotted disc brake rotor geometry.
   */
  public static createDiscBrakeRotor(
    outerRadius: number,
    innerRadius: number,
    thickness = 0.08,
    numVents = 12
  ): THREE.BufferGeometry {
    const geoms: THREE.BufferGeometry[] = [];

    // Outer Friction Ring (Rotor surface)
    const frictionRing = new THREE.CylinderGeometry(outerRadius, outerRadius, thickness, 32, 1, true);
    geoms.push(frictionRing);

    // Center Hat (Hub mounting bowl)
    const hat = new THREE.CylinderGeometry(innerRadius * 0.8, innerRadius, thickness * 2.0, 24);
    hat.translate(0, thickness * 0.5, 0);
    geoms.push(hat);

    // Cross-drilled aesthetic vent rings
    const ventRing = new THREE.RingGeometry(innerRadius * 1.05, outerRadius * 0.95, 32, 2);
    ventRing.rotateX(-Math.PI / 2);
    ventRing.translate(0, thickness / 2, 0);
    geoms.push(ventRing);

    return this.mergeGeometries(geoms);
  }

  /**
   * Helper to merge multiple buffer geometries cleanly without external dependencies.
   */
  public static mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (geometries.length === 0) {
      return new THREE.BoxGeometry(0.1, 0.1, 0.1);
    }
    if (geometries.length === 1) {
      return geometries[0];
    }

    let totalVertices = 0;
    let totalIndices = 0;

    for (const g of geometries) {
      const pos = g.getAttribute('position');
      if (pos) {
        totalVertices += pos.count;
      }
      if (g.index) {
        totalIndices += g.index.count;
      } else if (pos) {
        totalIndices += pos.count;
      }
    }

    const mergedPositions = new Float32Array(totalVertices * 3);
    const mergedNormals = new Float32Array(totalVertices * 3);
    const mergedIndices: number[] = [];

    let vertexOffset = 0;

    for (const g of geometries) {
      const pos = g.getAttribute('position');
      const norm = g.getAttribute('normal');
      if (!pos) continue;

      for (let i = 0; i < pos.count; i++) {
        mergedPositions[(vertexOffset + i) * 3] = pos.getX(i);
        mergedPositions[(vertexOffset + i) * 3 + 1] = pos.getY(i);
        mergedPositions[(vertexOffset + i) * 3 + 2] = pos.getZ(i);

        if (norm) {
          mergedNormals[(vertexOffset + i) * 3] = norm.getX(i);
          mergedNormals[(vertexOffset + i) * 3 + 1] = norm.getY(i);
          mergedNormals[(vertexOffset + i) * 3 + 2] = norm.getZ(i);
        } else {
          mergedNormals[(vertexOffset + i) * 3 + 1] = 1.0;
        }
      }

      if (g.index) {
        for (let i = 0; i < g.index.count; i++) {
          mergedIndices.push(g.index.getX(i) + vertexOffset);
        }
      } else {
        for (let i = 0; i < pos.count; i++) {
          mergedIndices.push(vertexOffset + i);
        }
      }

      vertexOffset += pos.count;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));
    if (mergedIndices.length > 0) {
      merged.setIndex(mergedIndices);
    }
    merged.computeVertexNormals();
    return merged;
  }

  /**
   * Creates a chamfered or beveled engineering cylinder.
   */
  public static createChamferedCylinder(
    radius: number,
    height: number,
    chamfer: number = 0.05,
    radialSegments: number = 32
  ): THREE.BufferGeometry {
    const r = Math.max(0.01, radius);
    const h = Math.max(0.01, height);
    const c = Math.min(chamfer, r * 0.4, h * 0.3);

    const pts = [
      new THREE.Vector2(0, -h / 2),
      new THREE.Vector2(r - c, -h / 2),
      new THREE.Vector2(r, -h / 2 + c),
      new THREE.Vector2(r, h / 2 - c),
      new THREE.Vector2(r - c, h / 2),
      new THREE.Vector2(0, h / 2)
    ];

    const geom = new THREE.LatheGeometry(pts, radialSegments);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Creates a knurled grip cylinder (e.g. for lens focus rings, tool chucks, knobs).
   */
  public static createKnurledCylinder(
    radius: number,
    height: number,
    ribCount: number = 48,
    ribDepth: number = 0.03
  ): THREE.BufferGeometry {
    const base = new THREE.CylinderGeometry(radius, radius, height, ribCount * 2);
    const pos = base.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const angle = Math.atan2(z, x);
      const dist = Math.sqrt(x * x + z * z);
      if (dist > radius * 0.8) {
        const mod = Math.sin(angle * ribCount);
        const newDist = radius + mod * ribDepth;
        pos.setX(i, Math.cos(angle) * newDist);
        pos.setZ(i, Math.sin(angle) * newDist);
      }
    }
    base.computeVertexNormals();
    return base;
  }

  /**
   * Creates an array of cooling heat-sink fins (for motor housings, PC radiators, engine components).
   */
  public static createCoolingFinArray(
    count: number,
    width: number,
    height: number,
    depth: number,
    finThickness: number = 0.02
  ): THREE.BufferGeometry {
    const geoms: THREE.BufferGeometry[] = [];
    const step = count > 1 ? (depth - finThickness) / (count - 1) : 0;
    for (let i = 0; i < count; i++) {
      const z = -depth / 2 + i * step + finThickness / 2;
      const fin = new THREE.BoxGeometry(width, height, finThickness);
      fin.translate(0, 0, z);
      geoms.push(fin);
    }
    return this.mergeGeometries(geoms);
  }

  /**
   * Creates an authentic bespoke Goodyear-welted dress shoe sole.
   */
  public static createGoodyearWeltSole(
    length: number,
    width: number,
    soleThickness: number = 0.09,
    heelHeight: number = 0.16
  ): THREE.BufferGeometry {
    const geoms: THREE.BufferGeometry[] = [];

    // Outsole profile shape
    const shape = new THREE.Shape();
    const l = length;
    const w = width;

    // Outer contour of classic shoe last bottom
    shape.moveTo(0, l * 0.5); // Toe tip
    shape.bezierCurveTo(w * 0.45, l * 0.48, w * 0.52, l * 0.3, w * 0.5, l * 0.15); // Lateral ball
    shape.bezierCurveTo(w * 0.48, 0, w * 0.32, -l * 0.12, w * 0.32, -l * 0.25); // Fiddled waist
    shape.bezierCurveTo(w * 0.35, -l * 0.38, w * 0.3, -l * 0.48, 0, -l * 0.5); // Heel back
    shape.bezierCurveTo(-w * 0.3, -l * 0.48, -w * 0.35, -l * 0.38, -w * 0.32, -l * 0.25); // Medial waist
    shape.bezierCurveTo(-w * 0.32, -l * 0.12, -w * 0.44, 0.05, -w * 0.48, l * 0.2); // Medial ball
    shape.bezierCurveTo(-w * 0.48, l * 0.35, -w * 0.35, l * 0.48, 0, l * 0.5); // Back to toe

    // Leather outsole slab
    const soleGeom = new THREE.ExtrudeGeometry(shape, {
      depth: soleThickness,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015
    });
    soleGeom.rotateX(Math.PI / 2);
    soleGeom.translate(0, -soleThickness / 2, 0);

    // Apply toe spring curvature
    const pos = soleGeom.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      let y = pos.getY(i);
      if (z > l * 0.15) {
        const factor = (z - l * 0.15) / (l * 0.35);
        y += factor * factor * 0.08; // Gentle upward toe spring
      }
      pos.setY(i, y);
    }
    soleGeom.computeVertexNormals();
    geoms.push(soleGeom);

    // Stacked leather heel block (positioned under the rear quarter)
    const heelShape = new THREE.Shape();
    heelShape.moveTo(0, -l * 0.22);
    heelShape.bezierCurveTo(w * 0.33, -l * 0.22, w * 0.34, -l * 0.36, w * 0.3, -l * 0.48);
    heelShape.bezierCurveTo(w * 0.15, -l * 0.5, -w * 0.15, -l * 0.5, -w * 0.3, -l * 0.48);
    heelShape.bezierCurveTo(-w * 0.34, -l * 0.36, -w * 0.33, -l * 0.22, 0, -l * 0.22);

    const heelGeom = new THREE.ExtrudeGeometry(heelShape, {
      depth: heelHeight,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.01,
      bevelThickness: 0.01
    });
    heelGeom.rotateX(Math.PI / 2);
    heelGeom.translate(0, -soleThickness - heelHeight / 2, 0);
    geoms.push(heelGeom);

    return this.mergeGeometries(geoms);
  }
}
