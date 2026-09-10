import { ScientificSystemModel } from './ScientificSchema';

export const FourStrokeEngineModel: ScientificSystemModel = {
  id: 'v8_engine_scientific',
  name: 'Internal Combustion Engine',
  scientificTitle: 'Four-Stroke Otto Cycle Internal Combustion Powertrain',
  domain: 'MECHANICAL_ENGINEERING',
  description: 'A component-level scientific simulation of a four-stroke internal combustion engine featuring synchronized crank kinematics, cam-driven valvetrain timing, and thermodynamic indicator cycle telemetry.',
  
  subsystems: [
    {
      id: 'crank_assembly',
      name: 'Cranktrain & Reciprocating Assembly',
      description: 'Converts reciprocating linear piston motion into rotational torque through the crankshaft journals and connecting rods.',
      color: '#38bdf8', // sky-400
      rootComponentIds: ['crankshaft_main', 'flywheel']
    },
    {
      id: 'combustion_cylinder',
      name: 'Cylinder Block & Piston Assemblies',
      description: 'Houses the combustion chambers, cooling jackets, and reciprocating piston crowns where chemical fuel energy converts to mechanical work.',
      color: '#f59e0b', // amber-500
      rootComponentIds: ['cylinder_block', 'piston_cyl1', 'piston_cyl2']
    },
    {
      id: 'valvetrain_assembly',
      name: 'Valvetrain & Gas Exchange System',
      description: 'Controls precision timing of air-fuel charge induction and high-temperature exhaust gas scavenging synchronized at 1:2 crankshaft ratio.',
      color: '#10b981', // emerald-500
      rootComponentIds: ['cylinder_head', 'intake_camshaft', 'exhaust_camshaft', 'intake_valve_cyl1', 'exhaust_valve_cyl1']
    },
    {
      id: 'ignition_system',
      name: 'Ignition & Timing System',
      description: 'Supplies synchronized high-voltage electrical discharge to ignite the compressed fuel-air charge at optimal crank advance.',
      color: '#ef4444', // red-500
      rootComponentIds: ['spark_plug_cyl1', 'timing_chain']
    },
    {
      id: 'manifold_system',
      name: 'Air Intake & Exhaust Manifolds',
      description: 'Tuned flow runners designed to deliver laminar atmospheric charge and evacuate high-velocity combustion gases.',
      color: '#a855f7', // purple-500
      rootComponentIds: ['intake_manifold', 'exhaust_header']
    }
  ],

  components: {
    // 1. CRANKSHAFT
    'crankshaft_main': {
      id: 'crankshaft_main',
      name: 'Crankshaft',
      scientificName: 'Rotary Forged-Steel Crankshaft with Counterweights',
      category: 'Rotary Kinematics',
      subsystemId: 'crank_assembly',
      parentId: null,
      childrenIds: ['conrod_cyl1', 'conrod_cyl2', 'flywheel'],
      geometry: {
        type: 'crank_segment',
        params: { length: 3.2, radius: 0.42, stroke: 0.44 },
        material: {
          pbrPreset: 'forged_steel',
          color: '#cbd5e1',
          metalness: 0.9,
          roughness: 0.25
        },
        transform: {
          position: [0, -1.2, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [0, -1.5, 0],
        explosionDirection: [0, -1, 0]
      },
      kinematicBinding: {
        driverVariable: 'crankAngle',
        type: 'ROTATION_Z',
        multiplier: 1.0
      },
      education: {
        name: 'Crankshaft',
        scientificName: 'Crankshaft Assembly',
        definition: 'The primary mechanical shaft of an internal combustion engine that converts reciprocating linear motion of the pistons into rotational torque.',
        function: 'Translates high-pressure linear downward force on the connecting rods into continuous rotational kinetic energy to drive the vehicle powertrain and auxiliary systems.',
        importance: 'Without the crankshaft offset crankpins, reciprocating combustion energy cannot be transformed into useful rotary mechanical work.',
        realWorldRelevance: 'Forged from high-tensile 4340 chromoly steel or nodular iron, balanced with counterweights to eliminate 1st and 2nd-order harmonic vibrations.',
        governingEquations: [
          {
            name: 'Engine Torque',
            formula: 'τ = F_gas · r_crank · sin(θ + β)',
            description: 'Torque delivered is the product of net gas force, crank throw radius, and the sine of combined crank and conrod angles.'
          },
          {
            name: 'Piston Position',
            formula: 'x(θ) = r(1 - cos θ) + L(1 - √(1 - (r/L)² sin² θ))',
            description: 'Exact kinematic displacement of piston from top dead center as a function of crank throw r and rod length L.'
          }
        ],
        failureModes: ['Fatigue fracture across crankpins', 'Bearing surface scoring due to oil starvation', 'Harmonic torsional resonance failure'],
        operationalRole: 'Primary Rotary Power Takeoff'
      },
      scientificProperties: {
        'Material': { value: 'Forged 4340 Alloy Steel (Quenched & Tempered)', description: 'Yield strength > 900 MPa' },
        'Crank Throw (Radius)': { value: 44.0, unit: 'mm', description: 'Half the engine stroke length (88mm total stroke)' },
        'Max Rotational Velocity': { value: 7500, unit: 'RPM', description: 'Peak rotational redline' },
        'Main Journal Diameter': { value: 65.0, unit: 'mm', description: 'Hydrodynamic Babbitt bearing journal' }
      }
    },

    // 2. FLYWHEEL
    'flywheel': {
      id: 'flywheel',
      name: 'Flywheel',
      scientificName: 'High-Inertia Rotational Damper & Ring Gear',
      category: 'Inertial Dynamics',
      subsystemId: 'crank_assembly',
      parentId: 'crankshaft_main',
      childrenIds: [],
      geometry: {
        type: 'cylinder',
        params: { radiusTop: 0.95, radiusBottom: 0.95, height: 0.18, radialSegments: 36 },
        material: {
          color: '#64748b',
          metalness: 0.85,
          roughness: 0.35
        },
        transform: {
          position: [0, -1.2, -1.6],
          rotation: [Math.PI / 2, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [0, -1.2, -2.8],
        explosionDirection: [0, 0, -1]
      },
      kinematicBinding: {
        driverVariable: 'crankAngle',
        type: 'ROTATION_Y', // Cylinder local axis
        multiplier: 1.0
      },
      education: {
        name: 'Flywheel',
        scientificName: 'Flywheel & Torsional Damper',
        definition: 'A massive rotating disc coupled directly to the crankshaft that utilizes its mass moment of inertia to resist sudden angular velocity variations.',
        function: 'Stores rotational kinetic energy during the power stroke and releases energy during intake, compression, and exhaust strokes to maintain steady rotation.',
        importance: 'Without a flywheel, multi-cylinder engines would suffer severe torque pulsations and stall at low idle speeds.',
        realWorldRelevance: 'Contains an outer ring gear engaged by the electric starter motor during engine ignition.',
        governingEquations: [
          {
            name: 'Rotational Kinetic Energy',
            formula: 'E_k = (1/2) · I · ω²',
            description: 'Kinetic energy stored is proportional to mass moment of inertia I and angular velocity squared ω.'
          }
        ],
        failureModes: ['Ring gear tooth wear', 'Surface clutch friction heat cracking']
      },
      scientificProperties: {
        'Moment of Inertia': { value: 0.142, unit: 'kg·m²', description: 'Dampens torsional torque peaks' },
        'Ring Gear Teeth': { value: 168, unit: 'teeth', description: 'Engages starter pinion gear' }
      }
    },

    // 3. CONNECTING ROD - CYLINDER 1
    'conrod_cyl1': {
      id: 'conrod_cyl1',
      name: 'Connecting Rod (Cyl 1)',
      scientificName: 'Forged H-Beam Connecting Rod',
      category: 'Reciprocating Kinematics',
      subsystemId: 'crank_assembly',
      parentId: 'crankshaft_main',
      childrenIds: ['piston_cyl1'],
      geometry: {
        type: 'composite',
        params: { length: 1.45, rodWidth: 0.12 },
        material: {
          color: '#94a3b8',
          metalness: 0.88,
          roughness: 0.3
        },
        transform: {
          position: [-0.45, -0.6, 0.6],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [-1.2, -0.8, 0.6],
        explosionDirection: [-1, 0, 0]
      },
      kinematicBinding: {
        driverVariable: 'conrodAngle_cyl1',
        type: 'CONROD_ANGLE_Z',
        multiplier: 1.0
      },
      education: {
        name: 'Connecting Rod',
        scientificName: 'Forged Steel Connecting Rod',
        definition: 'The mechanical linkage connecting the reciprocating piston wrist-pin to the rotating crankshaft journal.',
        function: 'Converts reciprocating translation into rotation while oscillating through an angular swing angle beta.',
        importance: 'Undergoes extreme alternating tensile stress (exhaust TDC) and compressive stress (combustion power stroke).',
        realWorldRelevance: 'Features precision fracture-split big-end caps that ensure microscopic mechanical re-alignment of bearing shells.',
        governingEquations: [
          {
            name: 'Rod Oscillation Angle',
            formula: 'sin(β) = (r / L) · sin(θ)',
            description: 'Angular tilt β determined by crank radius r, rod length L, and crank angle θ.'
          }
        ],
        failureModes: ['Buckling under hydraulic lock (water ingestion)', 'Fatigue at rod bolt threads', 'Wrist pin galling']
      },
      scientificProperties: {
        'Center-to-Center Length': { value: 142.5, unit: 'mm', description: 'Rod-to-stroke ratio = 1.62' },
        'Peak Tensile Load': { value: 45.2, unit: 'kN', description: 'At 7500 RPM TDC exhaust' },
        'Peak Compressive Load': { value: 78.4, unit: 'kN', description: 'At peak combustion pressure' }
      }
    },

    // 4. PISTON - CYLINDER 1
    'piston_cyl1': {
      id: 'piston_cyl1',
      name: 'Piston (Cyl 1)',
      scientificName: 'Hypereutectic Cast Aluminum Piston Crown & Skirt',
      category: 'Reciprocating Dynamics',
      subsystemId: 'combustion_cylinder',
      parentId: 'conrod_cyl1',
      childrenIds: [],
      geometry: {
        type: 'piston_assembly',
        params: { radius: 0.44, height: 0.62, pinRadius: 0.1 },
        material: {
          color: '#e2e8f0',
          metalness: 0.75,
          roughness: 0.25
        },
        transform: {
          position: [-0.45, 0.35, 0.6],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [-1.4, 1.2, 0.6],
        explosionDirection: [-1, 1, 0]
      },
      kinematicBinding: {
        driverVariable: 'pistonHeight_cyl1',
        type: 'TRANSLATION_Y',
        multiplier: 1.0
      },
      education: {
        name: 'Piston Assembly',
        scientificName: 'Piston Crown, Compression Rings & Skirt',
        definition: 'A cylindrical component fitted inside the engine cylinder that seals the combustion chamber and receives direct gas pressure.',
        function: 'Receives the high-temperature expanding gas force generated by the combustion of fuel-air mixture and transmits it downward via the wrist pin into the connecting rod.',
        importance: 'The piston is the boundary where thermodynamics transforms into mechanical motion.',
        realWorldRelevance: 'Equipped with three precision rings: Top Compression Ring, Second Scraper Ring, and Bottom Oil Control Ring to maintain gas-tight seal and lubricate cylinder wall.',
        governingEquations: [
          {
            name: 'Gas Force',
            formula: 'F_gas = P_combustion(θ) · A_piston = P · (π · D² / 4)',
            description: 'Downward thrust equals instantaneous combustion chamber pressure multiplied by crown surface area.'
          }
        ],
        failureModes: ['Thermal detonation crown melt', 'Piston ring land collapse', 'Skirt scuffing against cylinder bore']
      },
      scientificProperties: {
        'Bore Diameter': { value: 88.0, unit: 'mm', description: 'Cylinder cross-sectional bore' },
        'Compression Height': { value: 31.5, unit: 'mm', description: 'Wrist pin center to crown' },
        'Operating Crown Temp': { value: 320, unit: '°C', description: 'Under continuous peak power' },
        'Material Composition': { value: 'Al-Si12CuMgNi Alloy', description: 'Low thermal expansion hypereutectic aluminum' }
      }
    },

    // 5. PISTON - CYLINDER 2 (Bank 2)
    'piston_cyl2': {
      id: 'piston_cyl2',
      name: 'Piston (Cyl 2)',
      scientificName: 'Right Bank Reciprocating Piston Crown',
      category: 'Reciprocating Dynamics',
      subsystemId: 'combustion_cylinder',
      parentId: 'crankshaft_main',
      childrenIds: [],
      geometry: {
        type: 'piston_assembly',
        params: { radius: 0.44, height: 0.62, pinRadius: 0.1 },
        material: {
          color: '#e2e8f0',
          metalness: 0.75,
          roughness: 0.25
        },
        transform: {
          position: [0.45, 0.35, 0.6],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [1.4, 1.2, 0.6],
        explosionDirection: [1, 1, 0]
      },
      kinematicBinding: {
        driverVariable: 'pistonHeight_cyl2',
        type: 'TRANSLATION_Y',
        multiplier: 1.0
      },
      education: {
        name: 'Piston (Cylinder 2)',
        scientificName: 'V-Bank Piston Assembly',
        definition: 'Opposed bank reciprocating piston operating in counter-phase to balance secondary engine vibration orders.',
        function: 'Executes 4-stroke cycle staggered by 90 degrees of crank rotation to deliver continuous overlapping power strokes.',
        importance: 'Multi-cylinder staggering guarantees continuous torque delivery and eliminates dead spots in cycle rotation.'
      },
      scientificProperties: {
        'Bore Diameter': { value: 88.0, unit: 'mm', description: 'Matched cylinder bore' },
        'Stroke Length': { value: 88.0, unit: 'mm', description: 'Square bore/stroke geometry' }
      }
    },

    // 6. CYLINDER BLOCK
    'cylinder_block': {
      id: 'cylinder_block',
      name: 'Cylinder Block',
      scientificName: 'Monobloc Cast Aluminum Crankcase with Sintered Iron Liners',
      category: 'Structural Assembly',
      subsystemId: 'combustion_cylinder',
      parentId: null,
      childrenIds: ['cylinder_head'],
      geometry: {
        type: 'box',
        params: { width: 1.8, height: 1.4, depth: 2.8 },
        material: {
          color: '#475569',
          metalness: 0.7,
          roughness: 0.4,
          opacity: 0.35,
          transparent: true,
          wireframe: false
        },
        transform: {
          position: [0, -0.4, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [0, -0.4, 0],
        explosionDirection: [0, 0, 0]
      },
      education: {
        name: 'Engine Cylinder Block',
        scientificName: 'Engine Block & Crankcase',
        definition: 'The fundamental structural foundation of the engine housing the cylinder bores, water cooling jackets, and crankshaft main bearing saddles.',
        function: 'Absorbs extreme combustion reaction forces, guides the reciprocating pistons, and routes cooling fluid and pressurized engine oil throughout the powertrain.',
        importance: 'Provides the mechanical rigid datum for all rotating and reciprocating engine assemblies.',
        realWorldRelevance: 'Cast with integrated cross-bolted main bearing caps to withstand over 150 bar internal cylinder pressures.',
        failureModes: ['Block distortion due to severe overheating', 'Cracking between cylinder bores', 'Cylinder bore glazing']
      },
      scientificProperties: {
        'Cooling Capacity': { value: 12.5, unit: 'kW / cylinder', description: 'Rejected heat through coolant jackets' },
        'Total Mass': { value: 48.5, unit: 'kg', description: 'High-rigidity A356-T6 aluminum' }
      }
    },

    // 7. CYLINDER HEAD
    'cylinder_head': {
      id: 'cylinder_head',
      name: 'Cylinder Head',
      scientificName: 'DOHC Multi-Valve Crossflow Cylinder Head',
      category: 'Structural Assembly',
      subsystemId: 'valvetrain_assembly',
      parentId: 'cylinder_block',
      childrenIds: ['intake_camshaft', 'exhaust_camshaft', 'spark_plug_cyl1', 'intake_valve_cyl1', 'exhaust_valve_cyl1'],
      geometry: {
        type: 'box',
        params: { width: 1.7, height: 0.55, depth: 2.7 },
        material: {
          color: '#64748b',
          metalness: 0.8,
          roughness: 0.3
        },
        transform: {
          position: [0, 0.75, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [0, 2.2, 0],
        explosionDirection: [0, 1, 0]
      },
      education: {
        name: 'Cylinder Head',
        scientificName: 'Crossflow Cylinder Head',
        definition: 'The upper sealing casting bolted atop the cylinder block that encloses the combustion chambers and houses the valvetrain.',
        function: 'Encloses the top of the cylinders to form the combustion chambers and supports the intake ports, exhaust ports, spark plugs, and dual overhead camshafts.',
        importance: 'Defines volumetric efficiency through combustion chamber flow port aerodynamics.',
        realWorldRelevance: 'Sealed against the block using a multi-layer steel (MLS) head gasket engineered to prevent high-pressure gas blow-by and oil/coolant cross-contamination.'
      },
      scientificProperties: {
        'Valve Angle': { value: 24, unit: 'degrees', description: 'Included pent-roof angle' },
        'Combustion Volume': { value: 45.2, unit: 'cc', description: 'Clearance volume per cylinder' }
      }
    },

    // 8. INTAKE VALVES
    'intake_valve_cyl1': {
      id: 'intake_valve_cyl1',
      name: 'Intake Valve (Cyl 1)',
      scientificName: 'Poppet Intake Valve with Heat-Treated Chrome-Silicon Spring',
      category: 'Valvetrain Gas Exchange',
      subsystemId: 'valvetrain_assembly',
      parentId: 'cylinder_head',
      childrenIds: [],
      geometry: {
        type: 'valve',
        params: { headRadius: 0.18, stemRadius: 0.035, stemLength: 0.65 },
        material: {
          color: '#38bdf8', // Blue indicator for cold intake air
          metalness: 0.85,
          roughness: 0.25
        },
        transform: {
          position: [-0.35, 0.85, 0.6],
          rotation: [0, 0, 0.15],
          scale: [1, 1, 1]
        },
        explodedOffset: [-0.9, 2.6, 0.6],
        explosionDirection: [-1, 1, 0]
      },
      kinematicBinding: {
        driverVariable: 'intakeValveLift',
        type: 'TRANSLATION_Y',
        multiplier: -0.25 // Opens downward into cylinder
      },
      education: {
        name: 'Intake Valve',
        scientificName: 'Poppet Air Induction Valve',
        definition: 'A precision-ground mushroom valve that opens into the cylinder during the intake stroke to admit atmospheric air and fuel.',
        function: 'Opens during the downward intake stroke to allow fresh oxygen-rich fuel-air mixture into the cylinder, then seals tightly during compression and combustion.',
        importance: 'Valve lift and duration dictate the engine breathing capacity and peak torque RPM band.',
        realWorldRelevance: 'Constructed from lightweight titanium alloy or SUH11 martensitic steel to permit high-RPM operation without valve float.',
        governingEquations: [
          {
            name: 'Effective Flow Area',
            formula: 'A_flow = π · d_valve · L_lift · cos(θ_seat)',
            description: 'Volumetric flow rate directly proportional to instantaneous valve lift height.'
          }
        ],
        failureModes: ['Valve float (spring harmonics at redline)', 'Carbon deposition on valve seat', 'Stem seizure in guide']
      },
      scientificProperties: {
        'Head Diameter': { value: 34.5, unit: 'mm', description: 'High-flow induction area' },
        'Max Valve Lift': { value: 11.2, unit: 'mm', description: 'Peak mechanical cam lift' },
        'Seat Angle': { value: 45, unit: 'degrees', description: 'Gas-tight interference seat' }
      }
    },

    // 9. EXHAUST VALVES
    'exhaust_valve_cyl1': {
      id: 'exhaust_valve_cyl1',
      name: 'Exhaust Valve (Cyl 1)',
      scientificName: 'Sodium-Cooled Austenitic Stainless Exhaust Valve',
      category: 'Valvetrain Gas Exchange',
      subsystemId: 'valvetrain_assembly',
      parentId: 'cylinder_head',
      childrenIds: [],
      geometry: {
        type: 'valve',
        params: { headRadius: 0.16, stemRadius: 0.038, stemLength: 0.65 },
        material: {
          color: '#f97316', // Orange indicator for hot exhaust gas
          metalness: 0.85,
          roughness: 0.3
        },
        transform: {
          position: [-0.55, 0.85, 0.6],
          rotation: [0, 0, -0.15],
          scale: [1, 1, 1]
        },
        explodedOffset: [-1.4, 2.6, 0.6],
        explosionDirection: [-1, 1, 0]
      },
      kinematicBinding: {
        driverVariable: 'exhaustValveLift',
        type: 'TRANSLATION_Y',
        multiplier: -0.25 // Opens downward into cylinder
      },
      education: {
        name: 'Exhaust Valve',
        scientificName: 'Sodium-Cooled Exhaust Poppet Valve',
        definition: 'A heat-resistant valve that opens during the exhaust stroke to evacuate post-combustion exhaust gases into the exhaust header.',
        function: 'Releases high-temperature burned gases at speeds exceeding Mach 0.8 out of the cylinder during the scavenging cycle.',
        importance: 'Must endure direct exposure to 850°C flame fronts while retaining tensile strength and seat sealing integrity.',
        realWorldRelevance: 'Hollow valve stem filled with metallic sodium that melts at 98°C and splashes upward to conduct heat away from the valve head into the water-jacketed guide.'
      },
      scientificProperties: {
        'Head Diameter': { value: 29.5, unit: 'mm', description: 'High-velocity scavenging area' },
        'Operating Temperature': { value: 850, unit: '°C', description: 'Direct combustion flame contact' }
      }
    },

    // 10. INTAKE CAMSHAFT
    'intake_camshaft': {
      id: 'intake_camshaft',
      name: 'Intake Camshaft',
      scientificName: 'Chilled Cast-Iron Dual Overhead Intake Camshaft',
      category: 'Valvetrain Actuation',
      subsystemId: 'valvetrain_assembly',
      parentId: 'cylinder_head',
      childrenIds: [],
      geometry: {
        type: 'cylinder',
        params: { radiusTop: 0.06, radiusBottom: 0.06, height: 2.6, radialSegments: 16 },
        material: {
          color: '#94a3b8',
          metalness: 0.9,
          roughness: 0.2
        },
        transform: {
          position: [-0.35, 1.25, 0],
          rotation: [Math.PI / 2, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [-0.8, 3.2, 0],
        explosionDirection: [-1, 1, 0]
      },
      kinematicBinding: {
        driverVariable: 'camAngle',
        type: 'ROTATION_Y',
        multiplier: 1.0 // Half-crankshaft speed
      },
      education: {
        name: 'Intake Camshaft',
        scientificName: 'Double Overhead Camshaft (DOHC)',
        definition: 'A rotating shaft with precision-ground eccentric lobes that mechanically push open the intake valves against valve spring return force.',
        function: 'Synchronizes the exact opening and closing timing, duration, and maximum lift of the intake valves in phase with cylinder piston position.',
        importance: 'Operates at exactly half the rotational speed of the crankshaft (1:2 ratio) in all 4-stroke cycle engines.'
      },
      scientificProperties: {
        'Cam Duration': { value: 248, unit: 'degrees', description: 'Crankshaft degrees valve stays open' },
        'Gear Reduction Ratio': { value: '1:2', description: 'Spins once for every two crankshaft rotations' }
      }
    },

    // 11. EXHAUST CAMSHAFT
    'exhaust_camshaft': {
      id: 'exhaust_camshaft',
      name: 'Exhaust Camshaft',
      scientificName: 'Overhead Exhaust Camshaft with Phased Lobes',
      category: 'Valvetrain Actuation',
      subsystemId: 'valvetrain_assembly',
      parentId: 'cylinder_head',
      childrenIds: [],
      geometry: {
        type: 'cylinder',
        params: { radiusTop: 0.06, radiusBottom: 0.06, height: 2.6, radialSegments: 16 },
        material: {
          color: '#94a3b8',
          metalness: 0.9,
          roughness: 0.2
        },
        transform: {
          position: [-0.55, 1.25, 0],
          rotation: [Math.PI / 2, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [-1.4, 3.2, 0],
        explosionDirection: [-1, 1, 0]
      },
      kinematicBinding: {
        driverVariable: 'camAngle',
        type: 'ROTATION_Y',
        multiplier: 1.0
      },
      education: {
        name: 'Exhaust Camshaft',
        scientificName: 'Exhaust DOHC Camshaft',
        definition: 'Camshaft dedicated to actuating exhaust valves with cam lobe profile optimized for high-pressure blowdown and scavenging.',
        function: 'Opens exhaust valves before bottom dead center (BBDC) to initiate sonic pressure blowdown of combustion gases.'
      },
      scientificProperties: {
        'Cam Duration': { value: 252, unit: 'degrees', description: 'Exhaust opening duration' }
      }
    },

    // 12. SPARK PLUG
    'spark_plug_cyl1': {
      id: 'spark_plug_cyl1',
      name: 'Spark Plug (Cyl 1)',
      scientificName: 'Iridium-Tip High-Voltage Spark Plug with Alumina Insulator',
      category: 'Combustion Ignition',
      subsystemId: 'ignition_system',
      parentId: 'cylinder_head',
      childrenIds: [],
      geometry: {
        type: 'spark_plug',
        params: { height: 0.55, hexRadius: 0.08, threadRadius: 0.06 },
        material: {
          color: '#ffffff',
          metalness: 0.3,
          roughness: 0.1
        },
        transform: {
          position: [-0.45, 1.1, 0.6],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [-0.45, 3.4, 0.6],
        explosionDirection: [0, 1, 0]
      },
      education: {
        name: 'Spark Plug',
        scientificName: 'High-Voltage Iridium Spark Igniter',
        definition: 'An electrical discharge device fitted into the cylinder head that delivers an intense electric spark into the combustion chamber to ignite the fuel-air charge.',
        function: 'Generates a 30,000-volt plasma arc across a 0.8mm electrode gap just before piston reaches Top Dead Center during the compression stroke.',
        importance: 'The timing of the spark (ignition advance) governs peak combustion pressure, thermal efficiency, and engine knock prevention.',
        realWorldRelevance: 'Features a 0.6mm ultra-fine laser-welded iridium center electrode with a melting point above 2466°C for resistance to spark erosion.',
        governingEquations: [
          {
            name: 'Breakdown Voltage (Paschen Law)',
            formula: 'V_breakdown = B · p · d / (ln(A · p · d) - ln(ln(1 + 1/γ)))',
            description: 'Arc discharge voltage is a function of combustion chamber gas pressure p and electrode gap distance d.'
          }
        ],
        failureModes: ['Electrode bridging by conductive carbon', 'Ceramic insulator thermal crack', 'Electrode gap erosion']
      },
      scientificProperties: {
        'Discharge Voltage': { value: 32.0, unit: 'kV', description: 'Secondary coil firing pulse' },
        'Electrode Gap': { value: 0.8, unit: 'mm', description: 'Precision spark gap' },
        'Operating Heat Range': { value: 7, unit: 'index', description: 'Cold heat range for high boost' }
      }
    },

    // 13. TIMING CHAIN
    'timing_chain': {
      id: 'timing_chain',
      name: 'Timing Chain Assembly',
      scientificName: 'Inverted-Tooth Silent Roller Chain Drive',
      category: 'Synchronous Drive',
      subsystemId: 'ignition_system',
      parentId: 'crankshaft_main',
      childrenIds: ['intake_camshaft', 'exhaust_camshaft'],
      geometry: {
        type: 'torus',
        params: { radius: 0.85, tube: 0.04, radialSegments: 12, tubularSegments: 36 },
        material: {
          color: '#cbd5e1',
          metalness: 0.9,
          roughness: 0.3
        },
        transform: {
          position: [0, 0.0, 1.42],
          rotation: [0, 0, 0],
          scale: [0.65, 1.45, 1]
        },
        explodedOffset: [0, 0.0, 2.6],
        explosionDirection: [0, 0, 1]
      },
      education: {
        name: 'Timing Chain',
        scientificName: 'Synchronous Valvetrain Timing Drive',
        definition: 'A continuous metal link chain driving the camshafts directly from the crankshaft with exact 2:1 rotational gear synchronization.',
        function: 'Guarantees that camshaft lobes actuate the intake and exhaust valves at the exact millisecond required relative to piston stroke position.',
        importance: 'In interference engines, a skipped or broken timing chain results in catastrophic collision between pistons and open valves.'
      },
      scientificProperties: {
        'Drive Ratio': { value: '2:1', description: '2 crankshaft turns = 1 camshaft turn' },
        'Tensile Breaking Strength': { value: 18.5, unit: 'kN', description: 'Case-hardened alloy steel links' }
      }
    },

    // 14. INTAKE MANIFOLD
    'intake_manifold': {
      id: 'intake_manifold',
      name: 'Intake Manifold',
      scientificName: 'Tuned-Length Composite Induction Plenum',
      category: 'Fluid Induction',
      subsystemId: 'manifold_system',
      parentId: 'cylinder_head',
      childrenIds: [],
      geometry: {
        type: 'composite',
        params: { plenumLength: 2.2, runnerRadius: 0.12 },
        material: {
          color: '#0284c7', // Dark blue
          metalness: 0.4,
          roughness: 0.6
        },
        transform: {
          position: [-0.95, 0.9, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [-2.6, 0.9, 0],
        explosionDirection: [-1, 0, 0]
      },
      education: {
        name: 'Intake Manifold',
        scientificName: 'Harmonic Induction Manifold',
        definition: 'A network of passages that distributes filtered atmospheric air and fuel vapor evenly into each cylinder intake port.',
        function: 'Utilizes Helmholtz resonance acoustic wave tuning to ram higher air mass into cylinders just before intake valve closure.',
        importance: 'Optimizes engine volumetric efficiency across specific RPM bands.'
      },
      scientificProperties: {
        'Runner Length': { value: 240, unit: 'mm', description: 'Tuned for torque peak at 4200 RPM' },
        'Plenum Volume': { value: 4.8, unit: 'L', description: 'Sized to prevent pressure pulsing starvation' }
      }
    },

    // 15. EXHAUST HEADER
    'exhaust_header': {
      id: 'exhaust_header',
      name: 'Exhaust Header',
      scientificName: 'Equal-Length 4-into-1 Tubular Stainless Steel Exhaust Header',
      category: 'Fluid Scavenging',
      subsystemId: 'manifold_system',
      parentId: 'cylinder_head',
      childrenIds: [],
      geometry: {
        type: 'composite',
        params: { runnerCount: 4, pipeRadius: 0.1 },
        material: {
          color: '#ea580c', // Dark orange / heat treated
          metalness: 0.85,
          roughness: 0.35
        },
        transform: {
          position: [-0.95, 0.3, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [-2.6, -0.4, 0],
        explosionDirection: [-1, 0, 0]
      },
      education: {
        name: 'Exhaust Header',
        scientificName: 'Tuned Equal-Length Exhaust Manifold',
        definition: 'Tuned stainless steel primary pipes routing hot combustion exhaust gases away from the cylinders toward the catalytic converter and turbocharger.',
        function: 'Uses acoustic scavenging pulses: negative pressure reflection waves arrive at the exhaust valve just as it closes to pull residual exhaust out of the combustion chamber.',
        importance: 'Increases engine power and reduces cylinder charge dilution.'
      },
      scientificProperties: {
        'Primary Pipe Diameter': { value: 44.5, unit: 'mm', description: 'High-flow stainless steel tubing' },
        'Peak Gas Velocity': { value: 110, unit: 'm/s', description: 'At 7500 RPM full throttle' }
      }
    }
  },

  relationships: [
    {
      sourceId: 'crankshaft_main',
      targetId: 'conrod_cyl1',
      type: 'DRIVES',
      description: 'Crankshaft journal rotates conrod big-end bearing, converting rotary torque into reciprocating thrust.',
      transferType: 'MECHANICAL'
    },
    {
      sourceId: 'conrod_cyl1',
      targetId: 'piston_cyl1',
      type: 'DRIVES',
      description: 'Connecting rod pushes piston crown linearly upward during compression and exhaust strokes.',
      transferType: 'MECHANICAL'
    },
    {
      sourceId: 'piston_cyl1',
      targetId: 'conrod_cyl1',
      type: 'TRANSFERS_FORCE_TO',
      description: 'High-pressure burning combustion gas pushes downward on the piston crown, driving the connecting rod.',
      transferType: 'MECHANICAL'
    },
    {
      sourceId: 'crankshaft_main',
      targetId: 'flywheel',
      type: 'DRIVES',
      description: 'Crankshaft delivers kinetic energy to flywheel mass to smooth torque delivery across cycle dead centers.',
      transferType: 'MECHANICAL'
    },
    {
      sourceId: 'crankshaft_main',
      targetId: 'timing_chain',
      type: 'DRIVES',
      description: 'Crankshaft sprocket drives timing chain with fixed 2:1 reduction ratio.',
      transferType: 'MECHANICAL'
    },
    {
      sourceId: 'timing_chain',
      targetId: 'intake_camshaft',
      type: 'DRIVES',
      description: 'Timing chain turns intake camshaft at half engine speed.',
      transferType: 'MECHANICAL'
    },
    {
      sourceId: 'timing_chain',
      targetId: 'exhaust_camshaft',
      type: 'DRIVES',
      description: 'Timing chain turns exhaust camshaft at half engine speed.',
      transferType: 'MECHANICAL'
    },
    {
      sourceId: 'intake_camshaft',
      targetId: 'intake_valve_cyl1',
      type: 'CONTROLS',
      description: 'Intake cam lobe pushes valve open during intake stroke against return spring force.',
      transferType: 'MECHANICAL'
    },
    {
      sourceId: 'exhaust_camshaft',
      targetId: 'exhaust_valve_cyl1',
      type: 'CONTROLS',
      description: 'Exhaust cam lobe opens valve during exhaust stroke to evacuate combustion gases.',
      transferType: 'MECHANICAL'
    },
    {
      sourceId: 'spark_plug_cyl1',
      targetId: 'piston_cyl1',
      type: 'IGNITES',
      description: 'High voltage electrical spark ignites compressed fuel-air charge, releasing rapid thermal expansion pressure above piston.',
      transferType: 'THERMAL'
    },
    {
      sourceId: 'cylinder_block',
      targetId: 'piston_cyl1',
      type: 'SURROUNDS',
      description: 'Cylinder bore guides piston linear stroke and absorbs side thrust loads.',
      transferType: 'MECHANICAL'
    },
    {
      sourceId: 'cylinder_head',
      targetId: 'cylinder_block',
      type: 'SEALS',
      description: 'Cylinder head bolts to block over multi-layer steel head gasket to seal high-pressure combustion chamber.',
      transferType: 'MECHANICAL'
    },
    {
      sourceId: 'intake_manifold',
      targetId: 'intake_valve_cyl1',
      type: 'SUPPLIED_BY',
      description: 'Supplies laminar atmospheric air charge into cylinder intake port.',
      transferType: 'FLUID'
    },
    {
      sourceId: 'exhaust_valve_cyl1',
      targetId: 'exhaust_header',
      type: 'TRANSFORMS',
      description: 'Discharges sonic burned exhaust pulses into tuned equal-length header pipes.',
      transferType: 'FLUID'
    }
  ],

  simulation: {
    variables: {
      'crankAngle': {
        id: 'crankAngle',
        name: 'Crank Angle',
        unit: 'deg',
        defaultValue: 0,
        min: 0,
        max: 720,
        isDynamic: true,
        description: 'Instantaneous rotational angle of crankshaft through 720-degree 4-stroke cycle'
      },
      'camAngle': {
        id: 'camAngle',
        name: 'Camshaft Angle',
        unit: 'deg',
        defaultValue: 0,
        min: 0,
        max: 360,
        isDynamic: true,
        description: 'Angle of camshafts (spins at 1:2 ratio of crank)'
      },
      'pistonHeight_cyl1': {
        id: 'pistonHeight_cyl1',
        name: 'Piston Position (Cyl 1)',
        unit: 'mm',
        defaultValue: 0.35,
        min: -0.44,
        max: 0.44,
        isDynamic: true,
        description: 'Linear stroke displacement of Cylinder 1 piston from TDC'
      },
      'pistonHeight_cyl2': {
        id: 'pistonHeight_cyl2',
        name: 'Piston Position (Cyl 2)',
        unit: 'mm',
        defaultValue: -0.35,
        min: -0.44,
        max: 0.44,
        isDynamic: true,
        description: 'Linear stroke displacement of Cylinder 2 piston (staggered phase)'
      },
      'conrodAngle_cyl1': {
        id: 'conrodAngle_cyl1',
        name: 'Conrod Angular Tilt (Cyl 1)',
        unit: 'rad',
        defaultValue: 0,
        isDynamic: true,
        description: 'Oscillating swing angle beta of Cylinder 1 connecting rod'
      },
      'intakeValveLift': {
        id: 'intakeValveLift',
        name: 'Intake Valve Lift',
        unit: 'mm',
        defaultValue: 0,
        min: 0,
        max: 11.2,
        isDynamic: true,
        description: 'Instantaneous opening lift of intake valve'
      },
      'exhaustValveLift': {
        id: 'exhaustValveLift',
        name: 'Exhaust Valve Lift',
        unit: 'mm',
        defaultValue: 0,
        min: 0,
        max: 11.2,
        isDynamic: true,
        description: 'Instantaneous opening lift of exhaust valve'
      },
      'cylinderPressure': {
        id: 'cylinderPressure',
        name: 'Cylinder Pressure',
        unit: 'bar',
        defaultValue: 1.0,
        min: 0.8,
        max: 75.0,
        isDynamic: true,
        description: 'Instantaneous thermodynamic gas pressure inside combustion chamber'
      },
      'combustionFlame': {
        id: 'combustionFlame',
        name: 'Combustion Flame Intensity',
        unit: '%',
        defaultValue: 0,
        min: 0,
        max: 100,
        isDynamic: true,
        description: 'Visual plasma flame intensity inside chamber during power stroke'
      },
      'sparkFiring': {
        id: 'sparkFiring',
        name: 'Spark Ignition Firing',
        unit: 'bool',
        defaultValue: 0,
        min: 0,
        max: 1,
        isDynamic: true,
        description: 'Active ignition pulse at spark plug electrodes'
      }
    },

    parameters: {
      'rpm': 1800,           // Rotations Per Minute
      'compressionRatio': 10.5, // 10.5:1 Otto cycle compression ratio
      'throttle': 65,        // 65% throttle plate position
      'sparkAdvance': 14.0   // 14 deg Before TDC ignition timing
    },

    cyclePhases: [
      {
        id: 'INTAKE',
        name: 'Intake Stroke (Induction)',
        startVal: 0,
        endVal: 180,
        description: 'Piston moves downward from Top Dead Center (TDC) to Bottom Dead Center (BDC). Intake valve opens. Atmospheric air-fuel mixture is drawn into the low-pressure chamber.',
        color: '#38bdf8', // Blue
        activeValves: ['intake_valve_cyl1'],
        thermoState: 'Isobaric / Polytropic Expansion (P ≈ 1.0 bar)'
      },
      {
        id: 'COMPRESSION',
        name: 'Compression Stroke',
        startVal: 180,
        endVal: 360,
        description: 'Both valves are closed. Piston ascends from BDC to TDC, compressing the trapped fuel-air charge into the clearance volume. Temperature and pressure spike.',
        color: '#eab308', // Yellow
        activeValves: [],
        thermoState: 'Isentropic Compression: P_final = P_initial · r^γ ≈ 24 bar'
      },
      {
        id: 'POWER',
        name: 'Power Stroke (Combustion Expansion)',
        startVal: 360,
        endVal: 540,
        description: 'Spark plug ignites the compressed mixture near TDC. Rapid exothermic deflagration causes explosive pressure rise to 65 bar, forcing the piston down and delivering rotational torque.',
        color: '#ef4444', // Red
        activeValves: [],
        thermoState: 'Isochoric Heat Addition + Polytropic Expansion (Work Output)'
      },
      {
        id: 'EXHAUST',
        name: 'Exhaust Stroke (Scavenging)',
        startVal: 540,
        endVal: 720,
        description: 'Exhaust valve opens. Piston ascends from BDC back to TDC, pushing hot burned exhaust gases out through the exhaust port and into the header.',
        color: '#f97316', // Orange
        activeValves: ['exhaust_valve_cyl1'],
        thermoState: 'Isobaric Exhaust Evacuation (P ≈ 1.2 bar)'
      }
    ],

    stepFunction: (state, dt, params) => {
      const rpm = params['rpm'] !== undefined ? params['rpm'] : 1800;
      const compressionRatio = params['compressionRatio'] || 10.5;
      const sparkAdvance = params['sparkAdvance'] || 14.0;

      // Angular velocity in degrees per second:
      // (RPM / 60) * 360 deg/sec
      const degPerSec = (rpm / 60) * 360;
      let newCrankAngle = (state['crankAngle'] + degPerSec * dt) % 720;
      if (newCrankAngle < 0) newCrankAngle += 720;

      const newCamAngle = (newCrankAngle / 2) % 360;

      // Kinematic geometry constants (normalized scale)
      const r = 0.44; // crank throw radius
      const L = 1.45; // rod length
      const thetaRad = (newCrankAngle * Math.PI) / 180;
      const thetaRad2 = ((newCrankAngle + 90) * Math.PI) / 180; // Cyl 2 90-degree V stagger

      // Piston height calculation: y = r*cos(θ) + sqrt(L^2 - (r*sin(θ))^2)
      const sinTheta1 = Math.sin(thetaRad);
      const cosTheta1 = Math.cos(thetaRad);
      const conrodAngle1 = Math.asin((r / L) * sinTheta1);
      const pistonHeight1 = (r * cosTheta1 + Math.sqrt(Math.max(0.01, L * L - r * r * sinTheta1 * sinTheta1)) - L);

      const sinTheta2 = Math.sin(thetaRad2);
      const cosTheta2 = Math.cos(thetaRad2);
      const pistonHeight2 = (r * cosTheta2 + Math.sqrt(Math.max(0.01, L * L - r * r * sinTheta2 * sinTheta2)) - L);

      // Valvetrain Timing (Degrees within 720-degree cycle)
      // Intake Stroke: 0° to 180°. Cam lobe profiles shaped by sin wave.
      let intakeLift = 0;
      if (newCrankAngle >= 5 && newCrankAngle <= 190) {
        const intakeProgress = (newCrankAngle - 5) / 185; // 0 to 1
        intakeLift = Math.sin(intakeProgress * Math.PI) * 11.2;
      }

      // Exhaust Stroke: 520° to 710°
      let exhaustLift = 0;
      if (newCrankAngle >= 520 && newCrankAngle <= 715) {
        const exhaustProgress = (newCrankAngle - 520) / 195;
        exhaustLift = Math.sin(exhaustProgress * Math.PI) * 11.2;
      }

      // Spark timing: Fires right before TDC compression (360° - sparkAdvance)
      const sparkWindow = 360 - sparkAdvance;
      const isSparkFiring = (newCrankAngle >= sparkWindow - 4 && newCrankAngle <= sparkWindow + 8) ? 1 : 0;

      // Thermodynamic indicator pressure:
      let pressure = 1.0;
      let flame = 0;

      if (newCrankAngle < 180) {
        // Intake stroke: near atmospheric (manifold depression)
        pressure = 0.95 + 0.05 * Math.sin((newCrankAngle / 180) * Math.PI);
        flame = 0;
      } else if (newCrankAngle >= 180 && newCrankAngle < 360) {
        // Compression stroke: adiabatic pressure increase P = P0 * (Vmax / V)^gamma
        const compProgress = (newCrankAngle - 180) / 180; // 0 to 1
        const effectiveRatio = 1 + (compressionRatio - 1) * Math.pow(compProgress, 1.4);
        pressure = Math.min(26.0, 1.0 * Math.pow(effectiveRatio, 1.35));
        flame = isSparkFiring ? 50 : 0;
      } else if (newCrankAngle >= 360 && newCrankAngle < 540) {
        // Power stroke: explosive deflagration peak then polytropic expansion
        const powerProgress = (newCrankAngle - 360) / 180; // 0 to 1
        if (powerProgress < 0.15) {
          // Rapid combustion pressure rise to peak 68 bar
          const peakRise = powerProgress / 0.15;
          pressure = 24.0 + (68.0 - 24.0) * Math.sin(peakRise * (Math.PI / 2));
          flame = 100;
        } else {
          // Expansion cooling
          const expPhase = (powerProgress - 0.15) / 0.85;
          pressure = 68.0 * Math.pow(1 - expPhase * 0.85, 2.5);
          flame = Math.max(0, 100 * (1 - expPhase * 1.5));
        }
      } else {
        // Exhaust stroke: scavenging pressure blowdown
        const exhProgress = (newCrankAngle - 540) / 180;
        pressure = 3.5 * Math.exp(-exhProgress * 3) + 1.1;
        flame = 0;
      }

      return {
        ...state,
        crankAngle: newCrankAngle,
        camAngle: newCamAngle,
        pistonHeight_cyl1: pistonHeight1,
        pistonHeight_cyl2: pistonHeight2,
        conrodAngle_cyl1: conrodAngle1,
        intakeValveLift: intakeLift,
        exhaustValveLift: exhaustLift,
        cylinderPressure: Math.max(0.8, pressure),
        combustionFlame: flame,
        sparkFiring: isSparkFiring
      };
    }
  },

  diagrams: [
    {
      id: 'pv_indicator_diagram',
      title: 'Thermodynamic P-V Indicator Diagram',
      type: 'PV_DIAGRAM',
      description: 'Real-time trace of in-cylinder pressure versus chamber displacement volume over the 4-stroke thermodynamic cycle.',
      parametersTracked: ['cylinderPressure', 'pistonHeight_cyl1', 'crankAngle']
    },
    {
      id: 'four_stroke_timing_chart',
      title: 'Four-Stroke Cycle Phase Indicator',
      type: 'FOUR_STROKE_CYCLE',
      description: 'Dynamic dial displaying instantaneous cycle stroke: Intake (0-180°), Compression (180-360°), Power (360-540°), and Exhaust (540-720°).',
      parametersTracked: ['crankAngle', 'intakeValveLift', 'exhaustValveLift', 'sparkFiring']
    },
    {
      id: 'valve_lift_profile',
      title: 'Camshaft Valve Lift Profiles',
      type: 'VALVE_TIMING',
      description: 'Displays intake and exhaust valve lift curves with overlap and timing advance angles.',
      parametersTracked: ['intakeValveLift', 'exhaustValveLift', 'crankAngle']
    }
  ]
};
