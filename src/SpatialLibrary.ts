import { AssetCategory, DetailLevel, AssetIntelligenceMetadata } from './AssetIntelligence';
export interface ComponentMetadata {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  size: [number, number, number];
  explodedOffset: [number, number, number];
  shape: 'box' | 'sphere' | 'cylinder' | 'torus' | 'custom';
  color?: string;
  assetPath?: string;
  assetScale?: number;
  rotation?: [number, number, number];
  category?: string;
  interactionEnabled?: boolean;
  specifications?: Record<string, string>;
  engineeringDetails?: {
    material?: string;
    weight?: string;
    tolerances?: string;
    stressThreshold?: string;
    pinout?: Record<string, string>;
    specifications?: Record<string, string>;
    [key: string]: any;
  };
}

export interface EducationalInfo {
  overview: string;
  keyFeatures: string[];
  workingPrinciple: string;
  functionalPaths?: Record<string, string[]>;
  applications: string[];
  specifications: Record<string, string>;
}

export interface ObjectMetadata {
  id: string;
  name: string;
  path: string;
  assetPath?: string;
  modelStatus: 'AVAILABLE' | 'AWAITING_ASSET' | 'FALLBACK' | 'UNAVAILABLE';
  category: string;
  description: string;
  metadata?: Record<string, any>;
  components: ComponentMetadata[];
  defaultScale: number;
  animations?: string[];
  explodedParts?: string[];
  educationalInformation?: EducationalInfo;
  intelligence?: AssetIntelligenceMetadata;
  engineeringMetadata?: {
    assemblyType?: string;
    totalWeight?: string;
    designStandard?: string;
    operationalLimits?: Record<string, string>;
    maintenanceNotes?: string[];
    [key: string]: any;
  };
}

export const SPATIAL_LIBRARY: Record<string, ObjectMetadata> = {

  arduino_uno: {
    id: 'arduino_uno',
    name: 'Arduino UNO R3',
    path: '/models/arduino_uno.glb',
    assetPath: '/models/arduino_uno.glb',
    modelStatus: 'AVAILABLE',
    category: 'Engineering',
    description: 'ATmega328P based microcontroller board.',
    defaultScale: 3.0,
    intelligence: {
      category: AssetCategory.ELECTRONIC,
      targetDetailLevel: DetailLevel.L3_DIGITAL_TWIN,
      functionalTraits: ['microcontroller', 'usb_port', 'power_jack', 'pin_headers', 'pcb_traces'],
      generationRules: {
        'geometry': 'Must feature recognizable UNO board shape, exact connector locations, and surface-mount components',
        'materials': 'Silkscreen overlays, glowing copper traces, distinct chip packaging',
        'hierarchy': 'PCB_Base > (Connectors, ICs, Headers, Power_Components)'
      }
    },
    educationalInformation: {
      overview: 'Open-source electronics platform.',
      keyFeatures: ['ATmega328P IC', 'Digital/Analog I/O', 'USB Interface'],
      workingPrinciple: 'Executes instructions.',
      applications: ['Prototyping', 'Robotics', 'Automation'],
      specifications: { 'Microcontroller': 'ATmega328P', 'Operating Voltage': '5V', 'Clock Speed': '16 MHz' }
    },
    components: [
      { id: 'uno_board', name: 'Arduino UNO R3', description: 'Complete High-Fidelity Board.', position: [0, 0, 0], size: [1.0, 0.2, 1.4], explodedOffset: [0, 0, 0], shape: 'box', assetPath: '/models/arduino_uno.glb', assetScale: 1.0 }
    ]
  },

  esp32: {
    id: 'esp32',
    name: 'ESP32 Development Board',
    path: '/models/esp32.glb',
    assetPath: '/models/esp32.glb',
    modelStatus: 'AVAILABLE',
    category: 'Engineering',
    description: 'Dual-core MCU with WiFi and Bluetooth.',
    defaultScale: 3.0,
    educationalInformation: {
      overview: 'Low-cost, low-power system on a chip.',
      keyFeatures: ['ESP-WROOM-32', 'WiFi', 'Bluetooth'],
      workingPrinciple: 'Executes instructions and handles wireless comms.',
      applications: ['IoT', 'Smart Home', 'Wearables'],
      specifications: { 'Microcontroller': 'ESP32', 'Operating Voltage': '3.3V', 'Clock Speed': '240 MHz' }
    },
    components: [
      { id: 'esp32_board', name: 'ESP32 Board', description: 'Complete High-Fidelity Board.', position: [0, 0, 0], size: [0.6, 0.1, 1.2], explodedOffset: [0, 0, 0], shape: 'box', assetPath: '/models/esp32.glb', assetScale: 1.0 }
    ]
  },

  sg90_servo: {
    id: 'sg90_servo',
    name: 'SG90 Micro Servo',
    path: '/models/sg90_servo.glb',
    assetPath: '/models/sg90_servo.glb',
    modelStatus: 'AVAILABLE',
    category: 'Engineering',
    description: 'TowerPro SG90 9g Micro Servo Motor.',
    defaultScale: 4.0,
    educationalInformation: {
      overview: 'Small, lightweight servo motor.',
      keyFeatures: ['DC Motor', 'Gear Reduction', 'Control Board'],
      workingPrinciple: 'Uses PWM signals to determine desired angle.',
      functionalPaths: {
        'Control Path': ['pwm_command', 'control_board', 'dc_motor', 'gear_reduction', 'output_shaft', 'potentiometer']
      },
      applications: ['RC Vehicles', 'Small Robotics', 'Sensor Mounts'],
      specifications: { 'Torque': '1.8 kg-cm', 'Speed': '0.12 sec/60°', 'Weight': '9g' }
    },
    components: [
      { id: 'sg90_model', name: 'SG90 Servo', description: 'TowerPro SG90 Asset.', position: [0, 0, 0], size: [0.4, 0.5, 0.4], explodedOffset: [0, 0, 0], shape: 'box', assetPath: '/models/sg90_servo.glb', assetScale: 1.0 }
    ]
  },
  
  solar_panel: {
    id: 'solar_panel',
    name: 'Solar Panel 70x70mm',
    path: '/models/solar_panel.glb',
    assetPath: '/models/solar_panel.glb',
    modelStatus: 'AVAILABLE',
    category: 'Engineering',
    description: 'Monocrystalline photovoltaic panel.',
    defaultScale: 3.0,
    educationalInformation: {
      overview: 'Converts light energy directly into electricity.',
      keyFeatures: ['Monocrystalline Silicon', 'Aluminum Frame', 'Junction Box'],
      workingPrinciple: 'Photons knock electrons loose generating electricity.',
      applications: ['Solar Tracking', 'Power Generation'],
      specifications: { 'Voltage': '6V', 'Size': '70x70mm' }
    },
    components: [
      { id: 'sp_model', name: 'Photovoltaic Panel', description: 'High-Fidelity Solar Panel.', position: [0, 0, 0], size: [1.4, 0.05, 1.4], explodedOffset: [0, 0, 0], shape: 'box', assetPath: '/models/solar_panel.glb', assetScale: 1.0 }
    ]
  },

  ldr_sensor: {
    id: 'ldr_sensor',
    name: 'LDR Photoresistor',
    path: '/models/ldr.glb',
    assetPath: '/models/ldr.glb',
    modelStatus: 'AVAILABLE',
    category: 'Engineering',
    description: 'Light Dependent Resistor sensor.',
    defaultScale: 8.0,
    educationalInformation: {
      overview: 'A passive electronic component whose resistance decreases with increasing light.',
      keyFeatures: ['Cadmium Sulfide Track', 'Ceramic Base', 'Epoxy Dome'],
      workingPrinciple: 'Incident photons give bound electrons energy to jump to conduction band.',
      applications: ['Light Meters', 'Solar Trackers'],
      specifications: { 'Dark Resistance': '1 MΩ', 'Light Resistance': '10-20 kΩ' }
    },
    components: [
      { id: 'ldr_model', name: 'LDR Sensor', description: 'High-Fidelity LDR.', position: [0, 0, 0], size: [0.2, 0.4, 0.2], explodedOffset: [0, 0, 0], shape: 'box', assetPath: '/models/ldr.glb', assetScale: 1.0 }
    ]
  },

  resistor_10k: {
    id: 'resistor_10k',
    name: '10K Ohm Resistor',
    path: '/models/resistor_10k.glb',
    assetPath: '/models/resistor_10k.glb',
    modelStatus: 'AVAILABLE',
    category: 'Engineering',
    description: '1/4W 10K ohm through-hole resistor.',
    defaultScale: 10.0,
    educationalInformation: {
      overview: 'A passive electrical component that implements electrical resistance.',
      keyFeatures: ['Carbon Film', 'Color Bands', 'Axial Leads'],
      workingPrinciple: 'Opposes the flow of electric current.',
      applications: ['Voltage Dividers', 'Current Limiting'],
      specifications: { 'Resistance': '10kΩ', 'Tolerance': '5%', 'Power Rating': '1/4 W' }
    },
    components: [
      { id: 'res_model', name: '10K Resistor', description: 'High-Fidelity Resistor.', position: [0, 0, 0], size: [0.6, 0.1, 0.1], explodedOffset: [0, 0, 0], shape: 'box', assetPath: '/models/resistor_10k.glb', assetScale: 1.0 }
    ]
  },

  heliomotion: {
    id: 'heliomotion',
    name: 'HELIOMOTION Dual-Axis Solar Tracker',
    path: '/models/heliomotion.glb',
    assetPath: '/models/heliomotion.glb',
    modelStatus: 'AVAILABLE',
    category: 'Engineering',
    description: 'Complete dual-axis solar tracking prototype assembly featuring base frame, dual SG90 servo motors, solar panel assembly, and Arduino microcontroller.',
    defaultScale: 3.0,
    engineeringMetadata: {
      assemblyType: 'Dual-Axis Mechatronic System',
      totalWeight: '480g',
      designStandard: 'ISO 9001 / IEEE Solar Mechatronics Spec',
      designPurpose: 'Autonomous solar radiation optimization via active dual-axis tracking',
      operationalLimits: {
        'Max Wind Speed': '15 m/s',
        'Operating Temp': '-10°C to +65°C',
        'Input Voltage': '4.8V - 6.0V DC',
        'Max Tilt Angle': '±60 degrees'
      },
      maintenanceNotes: [
        'Inspect nylon gear mesh on SG90 servos every 500 operational hours.',
        'Clean photovoltaic glass surface monthly with deionized water.',
        'Check LDR sensor calibration quarterly under standard test conditions.'
      ]
    },
    educationalInformation: {
      overview: 'An automated mechanism orienting a solar panel payload towards the Sun to maximize energy capture.',
      keyFeatures: ['Dual-Axis Tracking', 'LDR Sensor Array', 'SG90 Micro Servos', 'Arduino Microcontroller', 'Complete Assembled Unit'],
      workingPrinciple: 'LDR sensors detect light intensity differences. The Arduino calculates the optimal angle and drives the servos to align the panel perpendicularly to the light source.',
      functionalPaths: {
        'Tracking Loop': ['light_direction', 'ldr_sensor', 'arduino_controller', 'servo_movement', 'panel_orientation']
      },
      applications: ['Solar Power Plants', 'Spacecraft Solar Arrays', 'Educational Robotics'],
      specifications: { 'Degrees of Freedom': '2 (Pan & Tilt)', 'Sensors': 'LDR', 'Actuators': 'SG90 Servo', 'Controller': 'Arduino UNO' }
    },
    components: [
      { 
        id: 'heliomotion_assembly', 
        name: 'HelioMotion Complete Assembly', 
        description: 'Complete dual-axis solar tracker engineering assembly.', 
        position: [0, 0, 0], 
        size: [2.0, 1.5, 2.0], 
        explodedOffset: [0, 0, 0], 
        shape: 'box', 
        assetPath: '/models/heliomotion.glb', 
        assetScale: 1.0,
        engineeringDetails: {
          material: 'ABS Polycarbonate & Anodized Aluminum',
          weight: '480g',
          tolerances: '±0.15mm',
          stressThreshold: '12.4 MPa',
          pinout: {
            'VCC': '5V DC Supply',
            'GND': 'System Ground',
            'PAN_SERVO': 'Digital Pin 9 (PWM)',
            'TILT_SERVO': 'Digital Pin 10 (PWM)',
            'LDR_AZIMUTH': 'Analog A0',
            'LDR_ELEVATION': 'Analog A1'
          },
          specifications: {
            'Tracking Accuracy': '±1.5 Degrees',
            'Power Consumption': '1.2W Peak'
          }
        }
      }
    ]
  },


  
  
    
  
  
  
  
  silicon_pv_cell: {
    id: 'silicon_pv_cell',
    name: 'Silicon Photovoltaic Cell',
    path: '/models/procedural/silicon_pv_cell',
    modelStatus: 'AVAILABLE',
    category: 'Educational',
    description: 'Microscopic educational visualization of a silicon crystal structure in a photovoltaic cell.',
    defaultScale: 10.0,
    educationalInformation: {
      overview: 'Atomic-scale visualization showing how photons interact with silicon atoms to generate electric current.',
      keyFeatures: ['Silicon Crystal Lattice', 'Photon Interaction', 'Electron-Hole Pairs'],
      workingPrinciple: 'Photons hit the silicon lattice and transfer energy to electrons, knocking them loose and creating electron-hole pairs.',
      applications: ['Solar Energy', 'Semiconductor Physics'],
      specifications: { 'Material': 'Monocrystalline Silicon', 'Process': 'Photovoltaic Effect' }
    },
    components: [
      { id: 'pv_cell_crystal', name: 'Silicon Crystal Lattice', description: 'Crystal structure of silicon atoms.', position: [0, 0, 0], size: [0.8, 0.4, 0.8], explodedOffset: [0, 0.5, 0], shape: 'box', color: '#38bdf8' }
    ]
  },

  solar_semiconductor: {
    id: 'solar_semiconductor',
    name: 'Solar Semiconductor Structure',
    path: '/models/procedural/solar_semiconductor',
    modelStatus: 'AVAILABLE',
    category: 'Educational',
    description: 'Educational cross-section of a P-N junction solar cell.',
    defaultScale: 4.0,
    educationalInformation: {
      overview: 'Shows the layered structure of a solar cell including N-type and P-type doped silicon forming a P-N junction.',
      keyFeatures: ['N-Type Layer (Phosphorus Doped)', 'P-Type Layer (Boron Doped)', 'Depletion Zone'],
      workingPrinciple: 'The built-in electric field at the P-N junction separates the electron-hole pairs created by light, forcing electrons to flow through an external circuit.',
      applications: ['Photovoltaic Cell Manufacturing', 'Solid State Physics'],
      specifications: { 'Junction Type': 'P-N Junction', 'Dopants': 'Phosphorus (N), Boron (P)' }
    },
    components: [
      { id: 'pn_junction', name: 'P-N Junction', description: 'Semiconductor layers.', position: [0, 0, 0], size: [1.0, 0.2, 1.0], explodedOffset: [0, 0.5, 0], shape: 'box', color: '#0f172a' }
    ]
  },

  
  
  rotary_engine: {
    id: 'rotary_engine',
    name: 'Wankel Rotary Engine',
    path: '/models/procedural/rotary',
    modelStatus: 'AVAILABLE',
    category: 'Automotive',
    description: 'A type of internal combustion engine using an eccentric rotary design to convert pressure into rotating motion.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'The Wankel engine uses a triangular rotor revolving inside an oval-like epitrochoidal housing.',
      keyFeatures: ['Triangular Rotor', 'Epitrochoidal Housing', 'No Valvetrain Required', 'High RPM Capability'],
      workingPrinciple: 'The three rotor apices seal against the housing, creating three expanding and contracting combustion chambers per revolution.',
      applications: ['Sports Cars', 'Light Aircraft', 'Racing Go-Karts'],
      specifications: { 'Displacement': '1.3L (equivalent)', 'Max RPM': '9000+', 'Moving Parts': '3 (Rotor, Eccentric Shaft)' }
    },
    components: [
      { id: 'rotor_housing', name: 'Epitrochoidal Housing', description: 'Figure-8 shaped combustion chamber casing.', position: [0, 0, 0], size: [1.2, 1.2, 0.4], explodedOffset: [0, 0, -0.6], shape: 'torus', color: '#94a3b8' },
      { id: 'tri_rotor', name: 'Triangular Rotor', description: 'Reuleaux triangle shaped rotor compressing fuel and air.', position: [0, 0, 0], size: [0.8, 0.8, 0.3], explodedOffset: [0, 0.8, 0], shape: 'cylinder', color: '#475569' },
      { id: 'eccentric_shaft', name: 'Eccentric Output Shaft', description: 'Central shaft translating orbital motion into pure rotation.', position: [0, 0, 0], size: [0.15, 0.15, 1.4], explodedOffset: [0, 0, 0.8], shape: 'cylinder', color: '#cbd5e1' }
    ]
  },

  tesla_motor: {
    id: 'tesla_motor',
    name: 'AC Induction Motor Assembly',
    path: '/models/procedural/tesla',
    modelStatus: 'AVAILABLE',
    category: 'Automotive',
    description: 'A high-performance liquid-cooled AC induction electric motor integrated with a single-speed reduction gear.',
    defaultScale: 1.2,
    educationalInformation: {
      overview: 'Modern electric vehicle drivetrain integrating motor, inverter, and differential into a single drive unit.',
      keyFeatures: ['3-Phase AC Induction', 'Liquid Cooling Jacket', 'Copper Bar Rotor', 'Silicon-Carbide Inverter'],
      workingPrinciple: 'Inverter converts DC battery power to 3-phase AC, creating a rotating magnetic field in the stator that induces opposing current in the copper rotor.',
      applications: ['Electric Vehicles', 'High-Speed Trains'],
      specifications: { 'Peak Power': '350 kW', 'Max Speed': '18,000 RPM', 'Cooling': 'Glycol/Water mixture' }
    },
    components: [
      { id: 'tm_inverter', name: 'SiC Power Inverter', description: 'Converts 400V DC to 3-Phase AC at variable frequencies.', position: [0, 0.6, 0], size: [0.8, 0.3, 0.8], explodedOffset: [0, 0.8, 0], shape: 'box', color: '#334155' },
      { id: 'tm_stator', name: 'Copper Wound Stator', description: 'Stationary electromagnetic coils generating rotating magnetic fields.', position: [0, 0, 0], size: [1.0, 1.0, 1.2], explodedOffset: [0, 0, -0.8], shape: 'cylinder', color: '#d97706' },
      { id: 'tm_rotor', name: 'Copper-Cage Rotor', description: 'Solid copper bars embedded in a steel core reacting to stator fields.', position: [0, 0, 0], size: [0.75, 0.75, 1.2], explodedOffset: [0, 0, 0.8], shape: 'cylinder', color: '#cbd5e1' },
      { id: 'tm_gearbox', name: 'Single-Speed Gearbox', description: '9:1 reduction gear integrating an open differential.', position: [0, 0, 0.8], size: [0.9, 0.9, 0.4], explodedOffset: [0, -0.6, 1.0], shape: 'box', color: '#94a3b8' }
    ]
  },

  li_ion_battery: {
    id: 'li_ion_battery',
    name: '18650 Li-Ion Cell Pack',
    path: '/models/procedural/battery',
    modelStatus: 'AVAILABLE',
    category: 'Electronics',
    description: 'An array of cylindrical lithium-ion 18650 cells wired in series and parallel with an active BMS.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'Rechargeable energy storage module combining multiple high-density lithium cells.',
      keyFeatures: ['18650 Cylindrical Form Factor', 'Nickel Strip Spot-Welded Connections', 'Active Battery Management System (BMS)'],
      workingPrinciple: 'Lithium ions move from the negative carbon anode to the positive metal oxide cathode during discharge.',
      applications: ['Electric Vehicles', 'Laptops', 'Power Banks'],
      specifications: { 'Nominal Voltage': '3.7V per cell', 'Capacity': '3500 mAh per cell', 'Chemistry': 'NCA / NMC' }
    },
    components: [
      { id: 'bat_bms', name: 'Battery Management System PCB', description: 'Monitors individual cell voltages, temperature, and balances charge.', position: [0, 0.4, 0], size: [1.2, 0.05, 0.8], explodedOffset: [0, 0.6, 0], shape: 'box', color: '#16a34a' },
      { id: 'bat_cells', name: '18650 Cell Array (4x4)', description: 'Matrix of 16 cylindrical lithium-ion cells.', position: [0, 0, 0], size: [1.0, 0.65, 0.6], explodedOffset: [0, -0.4, 0], shape: 'box', color: '#0284c7' },
      { id: 'bat_nickel', name: 'Nickel Busbars', description: 'Conductive spot-welded strips joining cells in series/parallel.', position: [0, 0.35, 0], size: [1.0, 0.02, 0.6], explodedOffset: [0, 0.4, 0], shape: 'box', color: '#cbd5e1' }
    ]
  },


  dna_helix: {
    id: 'dna_helix',
    name: 'DNA Double Helix',
    path: '/models/procedural/dna',
    modelStatus: 'AVAILABLE',
    category: 'Science',
    description: 'Deoxyribonucleic acid molecular structure carrying genetic instructions for all known living organisms.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'Two polynucleotide chains coiling around each other to form a right-handed double helix.',
      keyFeatures: ['Sugar-Phosphate Backbone', 'Nitrogenous Base Pairs (A-T, C-G)', 'Right-Handed Twist'],
      workingPrinciple: 'Sequence of bases encodes genetic information, while hydrogen bonds allow the helix to unzip for replication.',
      applications: ['Genomics', 'Biomedical Research', 'Forensics'],
      specifications: { 'Diameter': '2 nm', 'Turn Length': '3.4 nm (10 base pairs)' }
    },
    components: [
      { id: 'dna_backbone1', name: 'Sugar-Phosphate Backbone (Strand A)', description: 'Structural framework of nucleic acids.', position: [-0.2, 0, 0], size: [0.1, 2.0, 0.1], explodedOffset: [-0.5, 0, 0], shape: 'cylinder', color: '#0ea5e9' },
      { id: 'dna_backbone2', name: 'Sugar-Phosphate Backbone (Strand B)', description: 'Anti-parallel structural framework.', position: [0.2, 0, 0], size: [0.1, 2.0, 0.1], explodedOffset: [0.5, 0, 0], shape: 'cylinder', color: '#0ea5e9' },
      { id: 'dna_bases', name: 'Nucleobase Pairs (A-T / C-G)', description: 'Hydrogen-bonded rungs connecting the two backbones.', position: [0, 0, 0], size: [0.4, 1.8, 0.05], explodedOffset: [0, 0, 0.5], shape: 'box', color: '#f43f5e' }
    ]
  },

  quantum_particle: {
    id: 'quantum_particle',
    name: 'Quantum Probability Cloud',
    path: '/models/procedural/quantum',
    modelStatus: 'AVAILABLE',
    category: 'Science',
    description: 'Visualization of a quantum particle existing in a superposition of states defined by a wave function.',
    defaultScale: 2.0,
    educationalInformation: {
      overview: 'In quantum mechanics, particles do not have exact positions until measured; they exist as clouds of probability.',
      keyFeatures: ['Superposition', 'Wave-Particle Duality', 'Heisenberg Uncertainty'],
      workingPrinciple: 'The Schrödinger equation dictates the evolution of the wave function over time.',
      applications: ['Quantum Computing', 'Electron Microscopy', 'Cryptography'],
      specifications: { 'State': 'Superposition', 'Math': 'Schrödinger Equation' }
    },
    components: [
      { id: 'qp_core', name: 'Highest Probability Node', description: 'Region where particle observation is most likely.', position: [0, 0, 0], size: [0.4, 0.4, 0.4], explodedOffset: [0, 0, 0], shape: 'sphere', color: '#a855f7' },
      { id: 'qp_cloud', name: 'Wave Function Interference Pattern', description: 'Rippling shells of decreasing probability density.', position: [0, 0, 0], size: [1.5, 1.5, 1.5], explodedOffset: [0, 0.6, 0], shape: 'torus', color: '#d946ef' }
    ]
  },

  iron_man_suit: {
    id: 'iron_man_suit',
    name: 'Mark LXXXV Armor System',
    path: '/models/procedural/stark_suit',
    modelStatus: 'AVAILABLE',
    category: 'Special',
    description: 'Advanced nanotech integration armor featuring autonomous repulsor systems and localized force field generation.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'The pinnacle of Stark engineering, utilizing nano-particulate structures for real-time armor reconfiguration.',
      keyFeatures: ['Palladium-Core Arc Reactor', 'Vibranium-Alloy Nano Plating', 'Repulsor Flight Stabilizers', 'Heads-Up Targeting Display'],
      workingPrinciple: 'Neuro-kinetic interface reads operator intent, dynamically assembling nano-structures into weapons, shields, or thrusters.',
      applications: ['Global Security', 'Deep Space Combat', 'Heavy Rescue'],
      specifications: { 'Power Source': 'New Element Arc Reactor', 'Material': 'Gold-Titanium / Nanoparticles', 'Flight Speed': 'Mach 8+' }
    },
    components: [
      { id: 'im_helmet', name: 'Tactical HUD Helmet', description: 'Neuro-reactive visor providing 360-degree situational awareness.', position: [0, 1.2, 0], size: [0.4, 0.5, 0.45], explodedOffset: [0, 1.8, 0], shape: 'sphere', color: '#dc2626' },
      { id: 'im_reactor', name: 'Chest Arc Reactor', description: 'High-yield clean energy fusion generator powering all suit systems.', position: [0, 0.5, 0.25], size: [0.2, 0.2, 0.1], explodedOffset: [0, 0.5, 0.8], shape: 'cylinder', color: '#22d3ee' },
      { id: 'im_chest', name: 'Nano-Plated Chest Armor', description: 'Interlocking armor plates defending vital organs.', position: [0, 0.4, 0], size: [0.9, 0.8, 0.4], explodedOffset: [0, 0.8, -0.4], shape: 'box', color: '#dc2626' },
      { id: 'im_arms', name: 'Repulsor Arm Mechanisms', description: 'Articulated limb segments housing plasma projection arrays.', position: [0.7, 0.2, 0], size: [0.25, 0.9, 0.25], explodedOffset: [1.2, 0.2, 0], shape: 'cylinder', color: '#f59e0b' },
      { id: 'im_legs', name: 'Flight Stabilizer Legs', description: 'Lower mobility units containing primary thrust nozzles.', position: [0, -0.6, 0], size: [0.4, 1.0, 0.3], explodedOffset: [0, -1.2, 0], shape: 'box', color: '#dc2626' }
    ]
  },

  // Electronics Engineering Library


  raspberry_pi: {
    id: 'raspberry_pi',
    name: 'Raspberry Pi 4 Model B',
    path: '/models/electronics/raspberry_pi.glb',
    assetPath: '/models/electronics/raspberry_pi.glb',
    modelStatus: 'AVAILABLE',
    category: 'Electronics',
    description: 'A powerful single-board computer with a quad-core 64-bit ARM processor, dual 4K display support, and full Linux OS capabilities.',
    defaultScale: 1.0,
    metadata: { architecture: 'ARM Cortex-A72 64-bit', clockSpeed: '1.5 GHz', ram: '4GB LPDDR4' },
    educationalInformation: {
      overview: 'The Raspberry Pi 4 Model B offers ground-breaking increases in processor speed, multimedia performance, memory, and connectivity compared to prior generations.',
      keyFeatures: [
        'Broadcom BCM2711, Quad-core Cortex-A72 (ARM v8) 64-bit SoC @ 1.5GHz',
        '4GB LPDDR4-3200 SDRAM',
        'Dual micro-HDMI ports supporting up to 4kp60',
        'Gigabit Ethernet, 2.4/5.0 GHz Wi-Fi, Bluetooth 5.0',
        '2x USB 3.0 ports & 2x USB 2.0 ports'
      ],
      workingPrinciple: 'Boots a full Linux distribution (Raspberry Pi OS) from an SD card, executing multi-threaded software desktop workloads, media decoding, and direct hardware GPIO bit-banging.',
      applications: ['Personal Desktop Computer', 'Home Media Server', 'Computer Vision Edge Nodes', 'Robotics Master Controller'],
      specifications: {
        'Processor': 'Broadcom BCM2711 Quad-Core @ 1.5GHz',
        'RAM': '4GB LPDDR4',
        'Connectivity': 'Gigabit Ethernet, Wi-Fi 5, BT 5.0',
        'Video Output': '2x Micro-HDMI (4K60)',
        'Power': '5V DC via USB-C'
      }
    },
    components: [
      { id: 'rpi_pcb', name: 'Green FR4 Base PCB', description: '6-layer high-density PCB with embedded ground planes and thermal vias.', position: [0, -0.05, 0], size: [2.5, 0.08, 1.8], explodedOffset: [0, -0.6, 0], shape: 'box', color: '#15803d' },
      { id: 'rpi_cpu', name: 'BCM2711 Quad-Core CPU', description: 'Broadcom 64-bit ARM Cortex-A72 CPU with aluminum heat spreader lid.', position: [-0.3, 0.1, 0.1], size: [0.6, 0.12, 0.6], explodedOffset: [0, 0.8, 0], shape: 'box', color: '#cbd5e1' },
      { id: 'rpi_ram', name: '4GB LPDDR4 RAM Chip', description: 'High-speed system memory chip providing 3200 MT/s bandwidth.', position: [0.3, 0.1, 0.1], size: [0.5, 0.08, 0.5], explodedOffset: [0.3, 0.7, 0.3], shape: 'box', color: '#1e293b' },
      { id: 'rpi_usb3', name: 'Dual USB 3.0 Ports (Blue)', description: 'SuperSpeed USB ports providing up to 5 Gbps data throughput.', position: [1.1, 0.3, -0.4], size: [0.6, 0.45, 0.5], explodedOffset: [0.8, 0.4, -0.4], shape: 'box', color: '#0284c7' },
      { id: 'rpi_eth', name: 'Gigabit Ethernet Jack', description: 'RJ-45 Ethernet port supporting 10/100/1000 Mbps networking with PoE support.', position: [1.1, 0.35, 0.4], size: [0.7, 0.5, 0.5], explodedOffset: [0.8, 0.4, 0.4], shape: 'box', color: '#94a3b8' },
      { id: 'rpi_gpio', name: '40-Pin GPIO Header', description: '40-pin male expansion header providing I2C, SPI, UART, and 3.3V/5V power.', position: [-0.2, 0.2, -0.75], size: [2.0, 0.25, 0.18], explodedOffset: [0, 0.7, -0.6], shape: 'box', color: '#0f172a' }
    ]
  },

  servo_motor: {
    id: 'servo_motor',
    name: 'Servo Motor SG90',
    path: '/models/electronics/servo.glb',
    assetPath: '/models/electronics/servo.glb',
    modelStatus: 'AVAILABLE',
    category: 'Electronics',
    description: 'A tiny and lightweight servo motor providing controlled angular rotation (0 to 180 degrees) via PWM signals.',
    defaultScale: 2.0,
    educationalInformation: {
      overview: 'The SG90 is a micro servo motor with high output power relative to its compact footprint. It rotates 180 degrees based on pulse-width modulated control signals.',
      keyFeatures: [
        '3-Pole Ferrite Brushed DC Motor',
        'Nylon Gear Reduction Assembly',
        'Integrated Control Circuitry & Potentiometer',
        'Standard 3-Pin Connector (PWM, VCC, GND)'
      ],
      workingPrinciple: 'The internal circuit compares the width of incoming PWM pulses (1ms to 2ms) to the voltage feedback from an internal potentiometer, driving the motor until position error reaches zero.',
      applications: ['Robotic Arm Joints', 'RC Aircraft Controls', 'Camera Pan/Tilt Mounts', 'Automated Lock Mechanisms'],
      specifications: {
        'Weight': '9g',
        'Operating Voltage': '4.8V - 6.0V',
        'Stall Torque': '1.8 kgf·cm',
        'Operating Speed': '0.12 s/60 degrees'
      }
    },
    components: [
      { id: 'servo_case', name: 'Blue ABS Outer Shell', description: 'Lightweight translucent plastic enclosure protecting gear train.', position: [0, 0, 0], size: [0.8, 0.9, 0.4], explodedOffset: [0, 0, -0.6], shape: 'box', color: '#0284c7' },
      { id: 'servo_motor_core', name: 'Internal Coreless DC Motor', description: 'High-RPM micro DC motor converting electrical power into torque.', position: [-0.2, -0.1, 0], size: [0.35, 0.6, 0.35], explodedOffset: [-0.5, -0.3, 0], shape: 'cylinder', color: '#94a3b8' },
      { id: 'servo_gears', name: 'Nylon Reduction Gear Set', description: 'Multi-stage gear train stepping down motor speed while multiplying torque output.', position: [0.15, 0.35, 0], size: [0.4, 0.3, 0.35], explodedOffset: [0, 0.7, 0], shape: 'cylinder', color: '#f8fafc' },
      { id: 'servo_pot', name: 'Position Potentiometer', description: 'Rotary potentiometer providing direct voltage position feedback to controller.', position: [0.15, -0.2, 0], size: [0.25, 0.25, 0.25], explodedOffset: [0.5, -0.4, 0], shape: 'box', color: '#d97706' },
      { id: 'servo_arm', name: 'Output Servo Horn Arm', description: 'External horn attachment transferring angular motion to mechanical links.', position: [0.15, 0.6, 0], size: [0.6, 0.1, 0.15], explodedOffset: [0, 0.9, 0], shape: 'box', color: '#ffffff' }
    ]
  },

  stepper_motor: {
    id: 'stepper_motor',
    name: 'NEMA 17 Stepper Motor',
    path: '/models/electronics/stepper.glb',
    assetPath: '/models/electronics/stepper.glb',
    modelStatus: 'AVAILABLE',
    category: 'Electronics',
    description: 'A high-precision brushless DC motor that divides a 360-degree rotation into 200 discrete steps (1.8 deg per step).',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'NEMA 17 stepper motors are widely used in 3D printers, CNC machines, and robotics due to their precise open-loop position control and high holding torque.',
      keyFeatures: [
        '1.8 Degree Step Angle (200 steps per revolution)',
        'High Holding Torque (40 N·cm)',
        'Bipolar 4-Wire Configuration',
        'Precision Stainless Steel D-Shaft'
      ],
      workingPrinciple: 'Electromagnet coils in the stator are energized sequentially in phases. The permanent magnet rotor aligns with the magnetic poles step by step.',
      applications: ['3D Printers (X/Y/Z Axes)', 'CNC Milling Machines', 'Automated Camera Sliders', 'Robotic Manipulators'],
      specifications: {
        'Step Angle': '1.8°',
        'Holding Torque': '40 N·cm',
        'Rated Current': '1.2A per phase',
        'Resistance': '1.7 ohms per phase'
      }
    },
    components: [
      { id: 'stepper_casing', name: 'Black Anodized Aluminum Frame', description: 'NEMA 17 square flange body structure housing stator stack.', position: [0, 0, 0], size: [1.1, 1.1, 1.1], explodedOffset: [0, 0, -0.8], shape: 'box', color: '#1e293b' },
      { id: 'stepper_rotor', name: 'Permanent Magnet Rotor Core', description: 'Toothed multi-pole permanent magnet assembly mounted on drive shaft.', position: [0, 0, 0], size: [0.6, 1.2, 0.6], explodedOffset: [0, 0.8, 0], shape: 'cylinder', color: '#94a3b8' },
      { id: 'stepper_stator', name: 'Copper Stator Windings', description: '8 electromagnetic pole pieces wound with heavy-gauge copper magnet wire.', position: [0, 0, 0], size: [0.95, 0.9, 0.95], explodedOffset: [0.7, 0, 0], shape: 'cylinder', color: '#b45309' },
      { id: 'stepper_shaft', name: '5mm Stainless D-Shaft', description: 'Precision ground output shaft with flat profile for set-screw pulley attachment.', position: [0, 0.7, 0], size: [0.15, 0.8, 0.15], explodedOffset: [0, 1.2, 0], shape: 'cylinder', color: '#e2e8f0' }
    ]
  },

  dc_motor: {
    id: 'dc_motor',
    name: 'Brushed DC Motor 130',
    path: '/models/electronics/dc_motor.glb',
    assetPath: '/models/electronics/dc_motor.glb',
    modelStatus: 'AVAILABLE',
    category: 'Electronics',
    description: 'A simple direct-current motor that converts electrical energy into high-speed rotational mechanical energy.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'Standard 130-size brushed DC motor operating from 3V to 6V, producing high rotational speeds up to 10,000 RPM.',
      keyFeatures: [
        'Permanent Magnet Stator Field',
        '3-Pole Armature Winding',
        'Mechanical Commutator & Carbon Brushes',
        'Bi-directional Rotation via Polarity Reversal'
      ],
      workingPrinciple: 'Lorentz force pushes current-carrying armature coils inside the stationary magnetic field, rotating the shaft and automatically switching polarities via brushes.',
      applications: ['Toy Vehicles', 'Small Cooling Fans', 'Vibration Feedback Motors', 'Battery Power Tools'],
      specifications: {
        'Operating Voltage': '3V - 6V DC',
        'No-Load Speed': '12,000 RPM @ 3V',
        'Shaft Diameter': '2.0 mm'
      }
    },
    components: [
      { id: 'dc_can', name: 'Nickel-Plated Steel Casing', description: 'Cylindrical housing enclosing stator magnets and providing magnetic flux return path.', position: [0, 0, 0], size: [0.7, 0.9, 0.7], explodedOffset: [0, 0, -0.8], shape: 'cylinder', color: '#cbd5e1' },
      { id: 'dc_armature', name: '3-Pole Armature Winding', description: 'Laminated iron core wrapped with copper coils that rotate when energized.', position: [0, 0, 0], size: [0.5, 0.7, 0.5], explodedOffset: [0, 0.7, 0], shape: 'cylinder', color: '#b45309' },
      { id: 'dc_commutator', name: 'Copper Commutator & Brushes', description: 'Segmented copper ring transferring current from stationary spring brushes to rotating coils.', position: [0, -0.4, 0], size: [0.3, 0.2, 0.3], explodedOffset: [0, -0.6, 0], shape: 'cylinder', color: '#d97706' }
    ]
  },

  brushless_motor: {
    id: 'brushless_motor',
    name: 'Outrunner BLDC Motor',
    path: '/models/electronics/bldc.glb',
    assetPath: '/models/electronics/bldc.glb',
    modelStatus: 'AVAILABLE',
    category: 'Electronics',
    description: 'A high-efficiency 3-phase brushless motor with an external rotating bell housing, providing extreme power-to-weight ratio.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'Brushless DC Outrunner motors feature stationary internal stator coils and an outer rotating bell containing high-grade neodymium magnets.',
      keyFeatures: [
        'Outrunner Design (Outer Bell Rotates)',
        'High KV Rating (1000 - 2300 RPM/Volt)',
        '3-Phase AC Drive via Electronic Speed Controller (ESC)',
        'High Power Density for Aerial Drones'
      ],
      workingPrinciple: 'An external ESC sequences 3-phase sinusoidal current into stator coils, creating a rotating magnetic field that pulls the outer magnet bell synchronously.',
      applications: ['FPV Racing Drones', 'RC Model Aircraft', 'Electric Skateboards & Scooters', 'Gimbal Stabilization Systems'],
      specifications: {
        'KV Rating': '2300 KV',
        'Max Current': '30A',
        'Input Voltage': '2S - 4S LiPo (7.4V - 14.8V)'
      }
    },
    components: [
      { id: 'bldc_stator', name: 'Stationary Stator Stack', description: 'Silicon steel stator teeth wound with high-purity copper magnet wire.', position: [0, -0.1, 0], size: [0.8, 0.4, 0.8], explodedOffset: [0, -0.6, 0], shape: 'cylinder', color: '#b45309' },
      { id: 'bldc_rotor', name: 'CNC Aluminum Rotor Bell', description: 'Outer rotating bell lined with curved neodymium permanent arc magnets.', position: [0, 0.2, 0], size: [0.95, 0.5, 0.95], explodedOffset: [0, 0.7, 0], shape: 'cylinder', color: '#0284c7' },
      { id: 'bldc_shaft', name: 'Hardened Steel Central Shaft', description: 'Precision shaft supported by dual NMB ball bearings.', position: [0, 0.3, 0], size: [0.12, 0.9, 0.12], explodedOffset: [0, 1.1, 0], shape: 'cylinder', color: '#e2e8f0' }
    ]
  },

  breadboard: {
    id: 'breadboard',
    name: 'Solderless Breadboard',
    path: '/models/electronics/breadboard.glb',
    assetPath: '/models/electronics/breadboard.glb',
    modelStatus: 'AVAILABLE',
    category: 'Electronics',
    description: 'A reusable construction grid with 830 tie-points for rapid electronic circuit assembly without soldering.',
    defaultScale: 1.0,
    educationalInformation: {
      overview: 'Standard 830 tie-point solderless breadboard featuring dual power rails on each side and central IC DIP channel.',
      keyFeatures: [
        '630 Terminal Strip Tie-Points',
        '200 Power Distribution Rail Tie-Points',
        'Standard 0.1 inch (2.54mm) Pin Pitch',
        'Nickel-Plated Phosphor Bronze Spring Clips'
      ],
      workingPrinciple: 'Internal metallic spring clips bridge 5 vertical holes in main terminal rows and horizontal power rail lines.',
      applications: ['Rapid Circuit Prototyping', 'Educational Electronics Labs', 'Sensor Testing Bench'],
      specifications: { 'Tie-Points': '830', 'Pin Pitch': '2.54 mm (0.1 in)', 'Max Voltage': '36V', 'Max Current': '2A' }
    },
    components: [
      { id: 'bb_housing', name: 'White ABS Plastic Body', description: 'Insulating plastic shell with molded tie-point grid coordinates.', position: [0, 0, 0], size: [2.8, 0.15, 1.2], explodedOffset: [0, -0.4, 0], shape: 'box', color: '#f8fafc' },
      { id: 'bb_rails', name: 'Dual Power Distribution Rails', description: 'Red(+) and Blue(-) horizontal power bus conductors.', position: [0, 0.08, 0.5], size: [2.6, 0.02, 0.15], explodedOffset: [0, 0.5, 0.4], shape: 'box', color: '#ef4444' }
    ]
  },

  relay_module: {
    id: 'relay_module',
    name: '5V Optocoupled Relay Module',
    path: '/models/electronics/relay.glb',
    assetPath: '/models/electronics/relay.glb',
    modelStatus: 'AVAILABLE',
    category: 'Electronics',
    description: 'An electrically operated electromagnetic switch allowing low-voltage microcontrollers to control high-voltage AC mains appliances.',
    defaultScale: 2.0,
    educationalInformation: {
      overview: 'Single-channel 5V relay module with optocoupler galvanic isolation, protecting microcontrollers from high-voltage spikes.',
      keyFeatures: [
        '5V DC Coil Trigger Voltage',
        'Mains Load Capacity: 250V AC / 10A',
        'Optocoupler Phototransistor Isolation',
        'NO (Normally Open) and NC (Normally Closed) Contacts'
      ],
      workingPrinciple: 'Microcontroller signal triggers the opto-LED, turning on a transistor that energizes the electromagnetic coil, magnetically pulling the high-voltage armature contact switch.',
      applications: ['Home Automation Relays', 'Smart Power Outlets', 'Industrial Motor Switching'],
      specifications: { 'Coil Voltage': '5V DC', 'AC Switch Capacity': '10A 250V AC', 'DC Switch Capacity': '10A 30V DC' }
    },
    components: [
      { id: 'relay_cube', name: 'Blue Mechanical Relay Cube', description: 'Sealed plastic housing enclosing coil, spring, and contacts.', position: [0.2, 0.2, 0], size: [0.7, 0.5, 0.6], explodedOffset: [0.2, 0.7, 0], shape: 'box', color: '#0284c7' },
      { id: 'relay_terminals', name: 'High-Voltage Screw Terminal Block', description: '3-position screw terminal for connecting NO, COM, and NC mains wires.', position: [-0.6, 0.2, 0], size: [0.4, 0.4, 0.5], explodedOffset: [-0.6, 0.5, 0], shape: 'box', color: '#16a34a' }
    ]
  },

  ultrasonic_sensor: {
    id: 'ultrasonic_sensor',
    name: 'HC-SR04 Ultrasonic Distance Sensor',
    path: '/models/electronics/ultrasonic.glb',
    assetPath: '/models/electronics/ultrasonic.glb',
    modelStatus: 'AVAILABLE',
    category: 'Electronics',
    description: 'Emits 40 kHz ultrasonic sound bursts and calculates precise distance by measuring the echo time-of-flight.',
    defaultScale: 2.5,
    educationalInformation: {
      overview: 'Non-contact ultrasonic range measuring module providing 2cm to 400cm measurement range with 3mm accuracy.',
      keyFeatures: [
        '40 kHz Ultrasonic Acoustic Burst',
        'Range: 2 cm to 400 cm',
        'Trigger and Echo Digital Pins',
        'Operating Voltage: 5V DC'
      ],
      workingPrinciple: 'Trigger pin receives a 10us high pulse, sending 8 ultrasonic cycles. Echo pin goes HIGH for the exact duration until sound reflects back.',
      applications: ['Obstacle Avoidance Robots', 'Liquid Level Gauge', 'Parking Distance Sensors'],
      specifications: { 'Frequency': '40 kHz', 'Range': '2cm - 400cm', 'Measuring Angle': '15 degrees' }
    },
    components: [
      { id: 'us_trans', name: 'Ultrasonic Transmitter Horn (T)', description: 'Piezoelectric transducer converting electrical pulses into 40 kHz acoustic sound waves.', position: [-0.4, 0.1, 0.2], size: [0.45, 0.4, 0.45], explodedOffset: [-0.4, 0.6, 0.4], shape: 'cylinder', color: '#cbd5e1' },
      { id: 'us_recv', name: 'Ultrasonic Receiver Horn (R)', description: 'Piezoelectric sensor detecting reflected ultrasonic echo bursts.', position: [0.4, 0.1, 0.2], size: [0.45, 0.4, 0.45], explodedOffset: [0.4, 0.6, 0.4], shape: 'cylinder', color: '#cbd5e1' }
    ]
  },


  lcd_display: {
    id: 'lcd_display',
    name: '16x2 Character LCD Module',
    path: '/models/electronics/lcd.glb',
    assetPath: '/models/electronics/lcd.glb',
    modelStatus: 'AVAILABLE',
    category: 'Electronics',
    description: 'Displays 32 ASCII alphanumeric characters across two rows of 16 dot-matrix blocks with LED backlighting.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'Industry standard HD44780-compatible liquid crystal display module for displaying status text.',
      keyFeatures: [
        '16 Characters x 2 Lines Grid',
        'HD44780 Parallel Controller IC',
        'High-Contrast LED Backlight',
        '5x8 Dot Matrix Character Resolution'
      ],
      workingPrinciple: 'Electric fields twist liquid crystal molecules inside matrix cells, controlling polarized light transmission from the backlight through glass layers.',
      applications: ['System Status Monitors', 'Digital Thermometers', 'User Interface Displays'],
      specifications: { 'Display Format': '16 x 2', 'Character Size': '2.95 x 5.55 mm', 'Operating Voltage': '5V' }
    },
    components: [
      { id: 'lcd_glass', name: '16x2 Glass LCD Panel', description: 'Dual glass substrate sandwich containing liquid crystal matrix and polarizers.', position: [0, 0.1, 0], size: [1.8, 0.1, 0.8], explodedOffset: [0, 0.6, 0], shape: 'box', color: '#06b6d4' }
    ]
  },

  // Automotive Engineering Library
  v12_engine: {
    id: 'v12_engine',
    name: 'V12 Combustion Engine',
    path: 'procedural/automotive/v12',
    assetPath: 'procedural/automotive/v12',
    modelStatus: 'AVAILABLE',
    category: 'Automotive',
    description: 'A high-performance twelve-cylinder engine arranged in two banks of six cylinders with a 60-degree V angle.',
    defaultScale: 0.8,
    intelligence: {
      category: AssetCategory.MECHANICAL,
      targetDetailLevel: DetailLevel.L3_DIGITAL_TWIN,
      functionalTraits: ['crankshaft', 'pistons', 'connecting_rods', 'valvetrain', 'exhaust', 'cooling', 'lubrication'],
      generationRules: {
        'geometry': 'Must feature distinct cylinder banks, realistic forged shapes, and interconnected moving parts',
        'manufacturing': 'Include casting marks on engine block, machined surfaces on mating flanges, and fasteners',
        'hierarchy': 'Engine_Block > Cylinder_Bank > (Pistons, Rods, Valves)'
      }
    },
    metadata: { displacement: '6.5 Liters', cylinderBank: '60 deg V12', valvetrain: 'DOHC 48-Valve' },
    animations: ['reciprocatingPistons', 'crankshaftSpin', 'explodedView'],
    explodedParts: ['piston_left_bank', 'piston_right_bank', 'crankshaft', 'cylinder_head', 'intake_plenum', 'exhaust_manifold'],
    educationalInformation: {
      overview: 'A V12 engine is a twelve-cylinder piston engine where two banks of six cylinders are arranged in a V configuration around a common crankshaft. Known for naturally perfect primary and secondary balance.',
      keyFeatures: [
        'Naturally Balanced Secondary Frequencies (No Balance Shaft Needed)',
        '60-Degree Bank Angle for Even Firing Order every 60 degrees',
        'Dual Overhead Camshafts (DOHC) with 48 Valves',
        'High Specific Power Output & Smooth Torque Curve'
      ],
      workingPrinciple: 'Four-stroke cycle (Intake, Compression, Power, Exhaust) occurring sequentially across 12 cylinders, driving pistons connected to a forged alloy 7-bearing crankshaft.',
      functionalPaths: {
        'Power Path': ['combustion', 'piston', 'connecting_rod', 'crankshaft', 'rotational_output']
      },
      applications: ['Supercars & Luxury Gran Turismos', 'High-Speed Marine Propulsion', 'Aviation Engines'],
      specifications: {
        'Configuration': '60° V12',
        'Displacement': '6.5L (6,498 cc)',
        'Max Power': '770 HP @ 8,500 RPM',
        'Firing Order': '1-12-4-9-2-11-6-7-3-10-5-8'
      }
    },
    components: [
      { id: 'engine_block', name: '60° V12 Cast Aluminum Block', description: 'Rigid deep-skirt engine block with high-strength casting geometry and main bearing bulkheads.', position: [0, 0, 0], size: [1.1, 0.9, 3.0], explodedOffset: [0, 0, 0], shape: 'box', color: '#475569',
        engineeringDetails: { material: 'A356-T6 Cast Aluminum', weight: '62.4 kg', tolerances: '±0.01 mm', stressThreshold: '240 MPa', specifications: { 'Cylinder Bores': '12', 'V-Angle': '60 degrees' } }
      },
      { id: 'piston_left_bank', name: 'Bank 1 Forged Pistons (6x)', description: 'High-compression lightweight aluminum alloy pistons with low-friction PVD coated rings.', position: [-0.4, 0.6, 0], size: [0.35, 0.8, 2.4], explodedOffset: [-1.1, 0.8, 0], shape: 'cylinder', color: '#94a3b8',
        engineeringDetails: { material: 'Forged 4032 Aluminum Alloy', weight: '340g each', tolerances: '±0.005 mm', specifications: { 'Skirt Coating': 'Moly Disulfide', 'Compression Ratio': '11.8:1 [DATA]' } }
      },
      { id: 'piston_right_bank', name: 'Bank 2 Forged Pistons (6x)', description: 'Opposing bank aluminum pistons driving shared crank pins with full-floating wrist pins.', position: [0.4, 0.6, 0], size: [0.35, 0.8, 2.4], explodedOffset: [1.1, 0.8, 0], shape: 'cylinder', color: '#94a3b8',
        engineeringDetails: { material: 'Forged 4032 Aluminum Alloy', weight: '340g each', tolerances: '±0.005 mm', specifications: { 'Skirt Coating': 'Moly Disulfide', 'Compression Ratio': '11.8:1 [DATA]' } }
      },
      { id: 'connecting_rods', name: 'H-Beam Titanium Connecting Rods', description: 'Forged Ti-6Al-4V titanium rods engineered for ultra-high RPM reciprocating loads.', position: [0, 0.3, 0], size: [0.5, 0.6, 2.6], explodedOffset: [0, 0.5, 0], shape: 'box', color: '#64748b',
        engineeringDetails: { material: 'Ti-6Al-4V Titanium', weight: '450g each', tensileStrength: '950 MPa' }
      },
      { id: 'crankshaft', name: '7-Bearing Forged Steel Crankshaft', description: 'Nitrided alloy steel crankshaft with micro-polished journals and dynamic counterweights.', position: [0, -0.2, 0], size: [0.4, 0.4, 3.2], explodedOffset: [0, -1.0, 0], shape: 'cylinder', color: '#cbd5e1',
        engineeringDetails: { material: '4340 Chromoly Steel', weight: '28.5 kg', surfaceTreatment: 'Plasma Nitrided (HRC 58)' }
      },
      { id: 'valvetrain', name: 'DOHC 48-Valve Valvetrain & Camshafts', description: 'Dual overhead camshafts with hollow lightweight valves and dual valve springs.', position: [0, 1.0, 0], size: [0.9, 0.3, 2.8], explodedOffset: [0, 1.4, 0], shape: 'box', color: '#334155',
        engineeringDetails: { material: 'Billet Steel Camshafts & Titanium Valves', weight: '14.2 kg total' }
      },
      { id: 'intake_plenum', name: 'Dual Plenum Intake Manifold', description: 'Red powder-coated cast aluminum intake plenum with variable-length runners and twin throttle bodies.', position: [0, 1.4, 0], size: [0.7, 0.3, 2.8], explodedOffset: [0, 1.9, 0], shape: 'box', color: '#dc2626',
        engineeringDetails: { material: 'Magnesium-Aluminum Alloy', weight: '8.4 kg', airflow: '1,200 CFM @ 25 inH2O' }
      },
      { id: 'exhaust_manifold', name: 'Equal-Length Exhaust Headers', description: 'TIG-welded stainless steel 6-into-1 tuned exhaust headers for scavenging optimization.', position: [0, -0.4, 0], size: [1.3, 0.7, 2.6], explodedOffset: [0, -1.6, 0], shape: 'box', color: '#78350f',
        engineeringDetails: { material: '321 Stainless Steel', weight: '11.2 kg', maxTemp: '950°C' }
      },
      { id: 'cooling_system', name: 'Integrated Water Jackets & Coolant Pump', description: 'High-flow centrifugal water pump and crossflow cooling channels.', position: [0, 0.2, 1.5], size: [0.6, 0.5, 0.4], explodedOffset: [0, 0, 1.8], shape: 'box', color: '#0284c7',
        engineeringDetails: { flowRate: '140 L/min', pressureRating: '1.4 bar' }
      },
      { id: 'lubrication_system', name: 'Dry-Sump Oil Pan & Scavenge Pump', description: 'Multi-stage dry sump oil pan maintaining continuous oil pressure under high cornering G-forces.', position: [0, -0.7, 0], size: [0.9, 0.3, 2.8], explodedOffset: [0, -2.1, 0], shape: 'box', color: '#b45309',
        engineeringDetails: { capacity: '10.5 Liters Mobil 1 Racing 0W-40', pumpStages: '1 Pressure, 4 Scavenge' }
      },
      { id: 'electronics_sensors', name: 'Engine Management Harness & Sensors', description: 'Knock sensors, camshaft position sensors, dual ECU connectors, and direct-fire ignition coils.', position: [0, 0.8, -1.4], size: [0.8, 0.4, 0.3], explodedOffset: [0, 0.8, -1.8], shape: 'box', color: '#16a34a',
        engineeringDetails: { processor: 'Dual Tri-Core Automotive ECU', communication: 'CAN Bus 2.0B / FlexRay' }
      }
    ]
  },

  inline4_engine: {
    id: 'inline4_engine',
    name: 'Inline-4 DOHC Engine',
    path: '/models/automotive/inline4.glb',
    assetPath: '/models/automotive/inline4.glb',
    modelStatus: 'AVAILABLE',
    category: 'Automotive',
    description: 'An internal combustion engine with four cylinders mounted in a straight line along a shared crankcase.',
    defaultScale: 1.0,
    educationalInformation: {
      overview: 'The inline-four engine is the most ubiquitous automotive power plant, offering compact packaging and high thermal efficiency.',
      keyFeatures: [
        'Straight-4 Cylinder Block Layout',
        '180-Degree Flat-Plane Crankshaft',
        'Dual Overhead Camshafts (DOHC)',
        'Compact Footprint for Transverse Front-Wheel Drive'
      ],
      workingPrinciple: 'Pistons 1 and 4 move in unison opposite pistons 2 and 3, completing two power strokes per crankshaft revolution.',
      applications: ['Compact Passenger Cars', 'Sport Motorcycles', 'Hybrid Electric Vehicles'],
      specifications: { 'Displacement': '2.0L', 'Cylinders': '4 In-line', 'Valves': '16 Valves (4 per cylinder)' }
    },
    components: [
      { id: 'i4_block', name: 'Cast Aluminum Cylinder Block', description: 'Rigid engine block housing cylinder bores and cooling jackets.', position: [0, 0, 0], size: [0.7, 0.8, 1.6], explodedOffset: [0, -0.5, 0], shape: 'box', color: '#475569' }
    ]
  },

  v8_engine: {
    id: 'v8_engine',
    name: 'V8 Performance Engine',
    path: '/models/automotive/v8.glb',
    assetPath: '/models/automotive/v8.glb',
    modelStatus: 'AVAILABLE',
    category: 'Automotive',
    description: 'An eight-cylinder engine arranged in two banks of four cylinders, generating immense low-end torque.',
    defaultScale: 0.9,
    educationalInformation: {
      overview: 'Cross-plane V8 engine delivering iconic rumble acoustics and linear torque output.',
      keyFeatures: ['90-Degree Bank Angle', 'Cross-Plane Crankshaft with Counterweights', 'High Torque Density'],
      workingPrinciple: 'Cylinders fire every 90 degrees of crankshaft rotation, delivering smooth power pulses.',
      applications: ['Muscle Cars & Trucks', 'Performance SUVs', 'Motorsport Endurance Racing'],
      specifications: { 'Displacement': '5.0L', 'Configuration': '90° V8', 'Power': '480 HP' }
    },
    components: [
      { id: 'v8_block', name: '90° V8 Cylinder Block', description: 'Heavy-duty engine block housing 8 cylinders in a 90-degree V.', position: [0, 0, 0], size: [1.0, 0.8, 1.8], explodedOffset: [0, -0.6, 0], shape: 'box', color: '#334155' }
    ]
  },

  turbocharger: {
    id: 'turbocharger',
    name: 'Twin-Scroll Turbocharger',
    path: '/models/automotive/turbo.glb',
    assetPath: '/models/automotive/turbo.glb',
    modelStatus: 'AVAILABLE',
    category: 'Automotive',
    description: 'A forced-induction turbine device that compresses intake air using waste exhaust gas kinetic energy.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'Turbochargers harvest thermal and kinetic energy from engine exhaust to force dense compressed air into cylinders.',
      keyFeatures: [
        'Exhaust Gas Turbine Wheel',
        'Centrifugal Compressor Impeller',
        'Water-Cooled Center Hub Bearing',
        'Internal Pneumatic Wastegate'
      ],
      workingPrinciple: 'High-velocity exhaust gas spins the turbine up to 150,000 RPM, driving the intake compressor to increase charge air pressure.',
      applications: ['Downsized Efficient Engines', 'High-Performance Sports Cars', 'Diesel Heavy Trucks'],
      specifications: { 'Max Spin Speed': '180,000 RPM', 'Boost Pressure': '1.5 bar (21.7 psi)' }
    },
    components: [
      { id: 'turbo_comp', name: 'Aluminum Compressor Housing', description: 'Snailshell volute housing compressing incoming ambient air.', position: [-0.3, 0, 0], size: [0.6, 0.6, 0.5], explodedOffset: [-0.6, 0, 0], shape: 'sphere', color: '#e2e8f0' },
      { id: 'turbo_turb', name: 'Cast-Iron Turbine Housing', description: 'High-temperature housing directing hot exhaust gas onto turbine wheel.', position: [0.3, 0, 0], size: [0.6, 0.6, 0.5], explodedOffset: [0.6, 0, 0], shape: 'sphere', color: '#78350f' }
    ]
  },

  differential: {
    id: 'differential',
    name: 'Limited-Slip Differential',
    path: '/models/automotive/differential.glb',
    assetPath: '/models/automotive/differential.glb',
    modelStatus: 'AVAILABLE',
    category: 'Automotive',
    description: 'Allows drive wheels to rotate at different speeds while cornering while locking torque transfer if one wheel slips.',
    defaultScale: 1.2,
    educationalInformation: {
      overview: 'Epicyclic gear assembly transferring driveshaft torque to axle shafts during cornering.',
      keyFeatures: ['Hypoid Crown Ring & Pinion Gears', 'Spider Planetary Bevel Gears', 'Clutch Pack Friction Limiter'],
      workingPrinciple: 'Pinion spins ring gear carrier. Bevel spider gears rotate freely during turns, allowing outer wheel to spin faster than inner wheel.',
      applications: ['Rear-Wheel Drive Sports Cars', '4WD Off-Road Vehicles'],
      specifications: { 'Gear Ratio': '3.73:1', 'Type': 'Clutch-Type LSD' }
    },
    components: [
      { id: 'diff_ring', name: 'Hypoid Crown Ring Gear', description: 'Large spiral bevel gear bolted to differential carrier.', position: [0, 0, 0], size: [0.8, 0.8, 0.15], explodedOffset: [0, 0.6, 0], shape: 'torus', color: '#cbd5e1' }
    ]
  },

  gearbox: {
    id: 'gearbox',
    name: '6-Speed Manual Transmission',
    path: '/models/automotive/gearbox.glb',
    assetPath: '/models/automotive/gearbox.glb',
    modelStatus: 'AVAILABLE',
    category: 'Automotive',
    description: 'A multi-speed transmission using meshing gear sets and synchromesh rings to select drive ratios.',
    defaultScale: 1.0,
    educationalInformation: {
      overview: 'Manual gearbox allowing driver selection of 6 forward ratios and reverse via selector shift forks.',
      keyFeatures: ['Input, Counter, and Main Gear Shafts', 'Brass Synchromesh Cone Rings', 'Helical Low-Noise Gear Teeth'],
      workingPrinciple: 'Driver moves shift fork, pressing synchromesh cone to match gear speeds before dog teeth lock selected gear ratio to output shaft.',
      applications: ['Manual Sports Cars', 'Commercial Delivery Trucks'],
      specifications: { 'Ratios': '6 Forward + 1 Reverse', 'Max Input Torque': '450 N·cm' }
    },
    components: [
      { id: 'gear_shaft', name: 'Main Gear Assembly', description: 'Helical gears mounted on main shaft with needle roller bearings.', position: [0, 0, 0], size: [0.5, 0.5, 1.4], explodedOffset: [0, 0.6, 0], shape: 'cylinder', color: '#94a3b8' }
    ]
  },

  suspension: {
    id: 'suspension',
    name: 'MacPherson Strut Assembly',
    path: '/models/automotive/suspension.glb',
    assetPath: '/models/automotive/suspension.glb',
    modelStatus: 'AVAILABLE',
    category: 'Automotive',
    description: 'Combines a coil spring and telescopic shock absorber into a single structural steering pivot strut.',
    defaultScale: 1.2,
    educationalInformation: {
      overview: 'Independent front suspension system incorporating coil spring, hydraulic damper, and lower A-arm control link.',
      keyFeatures: ['Progressive Rate Coil Spring', 'Twin-Tube Gas Hydraulic Shock Absorber', 'Forged Steel Lower Control Arm'],
      workingPrinciple: 'Road bumps compress coil spring, while fluid damper dissipates kinetic energy into heat, maintaining tire contact patch.',
      applications: ['Front Suspension on 80%+ of Passenger Cars'],
      specifications: { 'Spring Rate': '35 N/mm', 'Damping Coefficient': '1200 N·s/m' }
    },
    components: [
      { id: 'susp_spring', name: 'Helical Steel Coil Spring', description: 'High-tensile spring steel absorbing road impact forces.', position: [0, 0.2, 0], size: [0.5, 0.8, 0.5], explodedOffset: [0, 0.6, 0], shape: 'cylinder', color: '#dc2626' }
    ]
  },

  brake_disc: {
    id: 'brake_disc',
    name: 'Carbon-Ceramic Ventilated Brake Disc',
    path: '/models/automotive/brake.glb',
    assetPath: '/models/automotive/brake.glb',
    modelStatus: 'AVAILABLE',
    category: 'Automotive',
    description: 'A lightweight carbon-fiber reinforced ceramic brake rotor squeezed by multi-piston hydraulic calipers.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'High-performance brake rotor capable of withstanding temperatures exceeding 1,000°C without thermal fade.',
      keyFeatures: ['Carbon-Silicon Carbide (CSiC) Matrix', 'Internal Radial Vane Cooling Channels', '6-Piston Fixed Aluminum Caliper'],
      workingPrinciple: 'Hydraulic pressure clamps brake pads against spinning rotor, converting kinetic energy into heat via friction.',
      applications: ['Formula 1 Racing Cars', 'Supercars', 'High-Speed Trains'],
      specifications: { 'Rotor Diameter': '390 mm', 'Operating Temp': 'Up to 1,000°C', 'Weight': '5.5 kg' }
    },
    components: [
      { id: 'brake_rotor', name: 'Ventilated Carbon Rotor', description: 'Cross-drilled carbon-ceramic disc rotor with cooling channels.', position: [0, 0, 0], size: [1.0, 1.0, 0.12], explodedOffset: [0, 0, -0.5], shape: 'torus', color: '#334155' },
      { id: 'brake_caliper', name: '6-Piston Fixed Caliper', description: 'Aluminum monobloc caliper housing hydraulic brake pistons.', position: [0.4, 0.3, 0], size: [0.35, 0.45, 0.25], explodedOffset: [0.6, 0.4, 0], shape: 'box', color: '#ef4444' }
    ]
  },

  steering_assembly: {
    id: 'steering_assembly',
    name: 'Rack and Pinion Steering Gear',
    path: '/models/automotive/steering.glb',
    assetPath: '/models/automotive/steering.glb',
    modelStatus: 'AVAILABLE',
    category: 'Automotive',
    description: 'Converts rotational steering wheel motion into linear horizontal tie-rod motion to turn front wheels.',
    defaultScale: 1.0,
    educationalInformation: {
      overview: 'Direct mechanical steering gear providing crisp tactile road feedback.',
      keyFeatures: ['Helical Pinion Gear Shaft', 'Toothed Rack Bar', 'Hydraulic / Electric Power Assist Unit'],
      workingPrinciple: 'Pinion rotates against linear rack, pushing tie rods left or right.',
      applications: ['Passenger Automobiles', 'Light Commercial Vehicles'],
      specifications: { 'Steering Ratio': '14.5:1', 'Turns Lock-to-Lock': '2.6' }
    },
    components: [
      { id: 'steering_rack', name: 'Linear Toothed Rack Bar', description: 'Hardened steel bar with cut gear teeth connected to tie-rod ends.', position: [0, 0, 0], size: [2.2, 0.2, 0.2], explodedOffset: [0, -0.5, 0], shape: 'box', color: '#94a3b8' }
    ]
  },

  // Human Anatomy Library
  human_heart: {
    id: 'human_heart',
    name: 'Human Heart Anatomy',
    path: 'procedural/anatomy/heart',
    assetPath: 'procedural/anatomy/heart',
    modelStatus: 'AVAILABLE',
    category: 'Anatomy',
    description: 'A four-chambered muscular organ that pumps deoxygenated blood to the lungs and oxygenated blood to the body.',
    defaultScale: 2.0,
    intelligence: {
      category: AssetCategory.BIOLOGICAL,
      targetDetailLevel: DetailLevel.L3_DIGITAL_TWIN,
      functionalTraits: ['atria', 'ventricles', 'valves', 'aorta', 'pulmonary_veins', 'coronary_arteries'],
      generationRules: {
        'geometry': 'Must feature realistic surface folds, major vessels, four internal chambers, and organic curvature',
        'materials': 'Soft subsurface scattering for tissue, distinct colored flow overlays for oxygenated vs deoxygenated',
        'hierarchy': 'Heart_Tissue > (Atria, Ventricles, Vessels, Valves)'
      }
    },
    metadata: { heartRate: '72 BPM', cardiacOutput: '5.0 L/min', chambers: '4 Chambers' },
    animations: ['cardiacPulsation', 'valveCycle', 'explodedView'],
    explodedParts: ['left_ventricle', 'right_ventricle', 'aorta', 'pulmonary_artery', 'vena_cava'],
    educationalInformation: {
      overview: 'The human heart is a hollow muscular organ located in the middle mediastinum. It continuously pumps blood through the circulatory system via rhythmic contractions.',
      keyFeatures: [
        'Four Chambers: Right/Left Atria and Right/Left Ventricles',
        'Atrioventricular & Semilunar Valves preventing backflow',
        'Sinoatrial (SA) Node - Natural Cardiac Pacemaker',
        'Dual Coronary Artery System providing myocardial oxygen'
      ],
      workingPrinciple: 'Rhythmic electrical impulses originate at the SA node, spreading across atrial muscle to contract atria (Diastole), then through the AV node down bundle branches to trigger ventricular pumping (Systole).',
      applications: ['Medical Student Cardiology Training', 'Patient Surgical Counseling', 'Biomedical Engineering'],
      specifications: {
        'Average Weight': '300 grams',
        'Pumping Rate': '60-100 Beats Per Minute',
        'Daily Blood Volume': '7,200 Liters (1,900 gallons)',
        'Systolic Pressure': '120 mmHg'
      }
    },
    components: [
      { id: 'left_ventricle', name: 'Left Ventricle Chamber', description: 'Thick muscular wall pumping oxygenated blood into high-pressure systemic circulation.', position: [0, -0.2, 0.1], size: [0.7, 0.8, 0.7], explodedOffset: [-0.6, -0.4, 0.3], shape: 'sphere', color: '#be123c' },
      { id: 'right_ventricle', name: 'Right Ventricle Chamber', description: 'Pumps deoxygenated return blood through pulmonary valve into lungs.', position: [0.3, -0.1, 0.2], size: [0.6, 0.7, 0.6], explodedOffset: [0.6, -0.4, 0.3], shape: 'sphere', color: '#9f1239' },
      { id: 'aorta', name: 'Ascending Aortic Arch', description: 'Main arterial trunk distributing oxygen-rich blood throughout entire body.', position: [0.1, 0.7, -0.1], size: [0.35, 0.8, 0.35], explodedOffset: [0, 0.9, -0.3], shape: 'cylinder', color: '#f43f5e' },
      { id: 'pulmonary_artery', name: 'Pulmonary Trunk Artery', description: 'Carries deoxygenated blood from right ventricle to left and right lungs.', position: [-0.2, 0.6, 0.2], size: [0.3, 0.7, 0.3], explodedOffset: [-0.5, 0.8, 0.4], shape: 'cylinder', color: '#1d4ed8' },
      { id: 'vena_cava', name: 'Superior Vena Cava', description: 'Large vein delivering deoxygenated blood from upper body into right atrium.', position: [0.4, 0.6, -0.2], size: [0.25, 0.7, 0.25], explodedOffset: [0.6, 0.7, -0.4], shape: 'cylinder', color: '#2563eb' }
    ]
  },

  human_brain: {
    id: 'human_brain',
    name: 'Human Brain Anatomy',
    path: '/models/anatomy/brain.glb',
    assetPath: '/models/anatomy/brain.glb',
    modelStatus: 'AVAILABLE',
    category: 'Anatomy',
    description: 'The central control organ of the nervous system, containing 86 billion neurons responsible for cognition, memory, emotion, and motor control.',
    defaultScale: 1.8,
    metadata: { neurons: '86 Billion', powerConsumption: '20 Watts', weight: '1.4 kg' },
    educationalInformation: {
      overview: 'The human brain is protected inside the cranium and divided into cerebrum, cerebellum, and brainstem.',
      keyFeatures: [
        'Cerebral Cortex (Frontal, Parietal, Occipital, Temporal Lobes)',
        'Cerebellum (Motor Control & Balance)',
        'Brainstem (Pons & Medulla Oblongata - Autonomic Control)',
        'Corpus Callosum bridging left and right hemispheres'
      ],
      workingPrinciple: 'Neurons transmit electro-chemical action potentials across synaptic gaps via neurotransmitters, forming complex neural circuits.',
      applications: ['Neuroscience Research', 'Medical Neurology Diagnostics', 'Cognitive Science'],
      specifications: { 'Neurons': '86 Billion', 'Synapses': '100 Trillion', 'Weight': '1.4 kg (3 lbs)' }
    },
    components: [
      { id: 'frontal_lobe', name: 'Frontal Lobe (Cerebrum)', description: 'Controls executive function, decision making, motor planning, and speech production.', position: [0, 0.3, 0.4], size: [0.8, 0.6, 0.7], explodedOffset: [0, 0.6, 0.6], shape: 'sphere', color: '#0284c7' },
      { id: 'parietal_lobe', name: 'Parietal Lobe', description: 'Processes sensory information including touch, spatial orientation, and navigation.', position: [0, 0.4, -0.3], size: [0.8, 0.5, 0.6], explodedOffset: [0, 0.7, -0.5], shape: 'sphere', color: '#0d9488' },
      { id: 'temporal_lobe', name: 'Temporal Lobe', description: 'Houses auditory cortex, memory processing (hippocampus), and language comprehension.', position: [0.4, -0.1, 0], size: [0.5, 0.4, 0.6], explodedOffset: [0.7, -0.2, 0], shape: 'sphere', color: '#d97706' },
      { id: 'cerebellum', name: 'Cerebellum ("Little Brain")', description: 'Coordinates voluntary motor movements, posture, balance, and fine motor learning.', position: [0, -0.4, -0.5], size: [0.7, 0.4, 0.5], explodedOffset: [0, -0.6, -0.7], shape: 'sphere', color: '#7c3aed' },
      { id: 'brainstem', name: 'Brainstem (Pons & Medulla)', description: 'Regulates critical cardiac, respiratory, and autonomic survival reflexes.', position: [0, -0.6, -0.1], size: [0.25, 0.6, 0.25], explodedOffset: [0, -0.9, 0], shape: 'cylinder', color: '#dc2626' }
    ]
  },

  human_lungs: {
    id: 'human_lungs',
    name: 'Human Respiratory Lungs',
    path: '/models/anatomy/lungs.glb',
    assetPath: '/models/anatomy/lungs.glb',
    modelStatus: 'AVAILABLE',
    category: 'Anatomy',
    description: 'Primary respiratory organs facilitating gas exchange between inhaled atmospheric air and the circulatory bloodstream.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'Spongy, air-filled organs on either side of the chest containing 300 million alveoli for gas diffusion.',
      keyFeatures: [
        'Right Lung (3 Lobes: Superior, Middle, Inferior)',
        'Left Lung (2 Lobes with Cardiac Notch)',
        'Trachea Airway branching into Primary Bronchi',
        'Microscopic Alveolar Gas Exchange Network'
      ],
      workingPrinciple: 'Diaphragm contracts downward, expanding thoracic cavity and pulling air into alveoli where oxygen diffuses into capillaries while carbon dioxide escapes.',
      applications: ['Pulmonology Training', 'Respiratory Therapy Education'],
      specifications: { 'Alveoli Count': '300 Million', 'Surface Area': '70 sq meters', 'Vital Capacity': '4.8 Liters' }
    },
    components: [
      { id: 'right_lung', name: 'Right Lung (3 Lobes)', description: 'Larger lung divided into Superior, Middle, and Inferior lobes.', position: [0.4, 0, 0], size: [0.6, 1.2, 0.6], explodedOffset: [0.7, 0, 0], shape: 'sphere', color: '#f43f5e' },
      { id: 'left_lung', name: 'Left Lung (2 Lobes)', description: 'Features cardiac notch accommodating the heart apex.', position: [-0.4, 0, 0], size: [0.55, 1.15, 0.55], explodedOffset: [-0.7, 0, 0], shape: 'sphere', color: '#f43f5e' },
      { id: 'trachea', name: 'Trachea & Bronchial Tree', description: 'Cartilaginous windpipe dividing into left and right primary bronchi.', position: [0, 0.4, 0], size: [0.2, 0.8, 0.2], explodedOffset: [0, 0.8, 0], shape: 'cylinder', color: '#38bdf8' }
    ]
  },

  human_eye: {
    id: 'human_eye',
    name: 'Human Eye Anatomy',
    path: '/models/anatomy/eye.glb',
    assetPath: '/models/anatomy/eye.glb',
    modelStatus: 'AVAILABLE',
    category: 'Anatomy',
    description: 'A sensory organ that focuses incoming light rays onto photosensitive retinal cells to produce vision.',
    defaultScale: 3.0,
    educationalInformation: {
      overview: 'Complex optical organ capturing light patterns and transducing them into optic nerve nerve impulses.',
      keyFeatures: ['Transparent Cornea & Iris Aperture', 'Flexible Crystalline Lens', 'Light-Sensitive Retina (Rods & Cones)', 'Optic Nerve Cable'],
      workingPrinciple: 'Cornea and lens refract light onto the retina, where 120 million rod and cone photoreceptors generate nerve signals.',
      applications: ['Ophthalmology & Optometry Education'],
      specifications: { 'Photoreceptors': '126 Million', 'Focal Length': '17 mm', 'Resolution Equivalent': '576 Megapixels' }
    },
    components: [
      { id: 'eye_cornea', name: 'Cornea & Clear Lens', description: 'Transparent front dome providing 2/3 of eye optical refractive power.', position: [0, 0, 0.4], size: [0.4, 0.4, 0.2], explodedOffset: [0, 0, 0.8], shape: 'sphere', color: '#38bdf8' },
      { id: 'eye_retina', name: 'Retinal Layer Shell', description: 'Inner sensory lining containing rods (brightness) and cones (color).', position: [0, 0, -0.2], size: [0.85, 0.85, 0.85], explodedOffset: [0, 0, -0.6], shape: 'sphere', color: '#d97706' },
      { id: 'optic_nerve', name: 'Optic Nerve Cable', description: 'Bundle of 1 million ganglion nerve fibers carrying visual signals to brain.', position: [0, 0, -0.8], size: [0.15, 0.15, 0.6], explodedOffset: [0, 0, -1.2], shape: 'cylinder', color: '#f8fafc' }
    ]
  },

  human_skeleton: {
    id: 'human_skeleton',
    name: 'Human Skeletal System',
    path: '/models/anatomy/skeleton.glb',
    assetPath: '/models/anatomy/skeleton.glb',
    modelStatus: 'AVAILABLE',
    category: 'Anatomy',
    description: 'The internal rigid bone framework protecting organs and anchoring skeletal muscles for movement.',
    defaultScale: 0.5,
    educationalInformation: {
      overview: 'Adult human skeleton consisting of 206 bones divided into axial and appendicular divisions.',
      keyFeatures: ['Cranium Skull Dome', 'Vertebral Spine Column (33 Vertebrae)', 'Thoracic Ribcage Shield', 'Pelvic Girdle & Limb Bones'],
      workingPrinciple: 'Bones act as rigid levers pivoted at joints, pulled by skeletal muscles to produce biomechanical locomotion.',
      applications: ['Orthopedics', 'Anatomical Education', 'Physical Therapy'],
      specifications: { 'Total Bones': '206', 'Main Composition': 'Calcium Phosphate Matrix' }
    },
    components: [
      { id: 'skel_skull', name: 'Cranium & Facial Skeleton', description: 'Protective skull dome enclosing brain and sensory organs.', position: [0, 1.6, 0], size: [0.4, 0.45, 0.4], explodedOffset: [0, 0.8, 0], shape: 'sphere', color: '#f8fafc' },
      { id: 'skel_spine', name: 'Vertebral Spine Column', description: 'Flexible axial support column with intervertebral shock discs.', position: [0, 0.6, 0], size: [0.2, 1.4, 0.2], explodedOffset: [-0.5, 0, 0], shape: 'cylinder', color: '#e2e8f0' },
      { id: 'skel_ribs', name: 'Thoracic Ribcage', description: '12 pairs of curved ribs shielding heart and lungs.', position: [0, 0.8, 0], size: [0.6, 0.7, 0.5], explodedOffset: [0, 0, 0.6], shape: 'box', color: '#cbd5e1' }
    ]
  },

  // Quantum Mechanics & Physics
  electron: {
    id: 'electron',
    name: 'Quantum Electron Particle',
    path: '/models/procedural/electron',
    modelStatus: 'AVAILABLE',
    category: 'Science',
    description: 'A fundamental subatomic particle representing a quantum superposition of states.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'What appears as a particle is described by quantum mechanics as a probability distribution.',
      keyFeatures: ['Superposition', 'Wave-Particle Duality', 'Heisenberg Uncertainty'],
      workingPrinciple: 'The Schrödinger equation dictates the evolution of the wave function over time.',
      applications: ['Quantum Computing', 'Electron Microscopy', 'Cryptography'],
      specifications: { 'Charge': '-1.602 × 10⁻¹⁹ C', 'Mass': '9.109 × 10⁻³¹ kg', 'Type': 'Lepton', 'Spin': '1/2' }
    },
    components: [
      { id: 'q_cloud', name: 'Probability Cloud', description: 'Volumetric 3D probability density cloud.', position: [0, 0, 0], size: [2.0, 2.0, 2.0], explodedOffset: [0, 1.2, 0], shape: 'sphere', color: '#a855f7' },
      { id: 'q_field', name: 'Energy Interference', description: 'Energy wave interference patterns.', position: [0, 0, 0], size: [1.6, 1.6, 1.6], explodedOffset: [0, 0.6, 0], shape: 'sphere', color: '#d946ef' },
      { id: 'q_core', name: 'Particle Core', description: 'Extremely small bright energy nucleus point.', position: [0, 0, 0], size: [0.1, 0.1, 0.1], explodedOffset: [0, 0, 0], shape: 'sphere', color: '#ffffff' },
      { id: 'q_lines', name: 'EM Field Lines', description: 'Field lines showing electromagnetic interaction.', position: [0, 0, 0], size: [2.2, 2.2, 2.2], explodedOffset: [0, -0.6, 0], shape: 'sphere', color: '#22d3ee' },
      { id: 'q_grid', name: 'Quantum Grid', description: 'Holographic wireframe quantum grid.', position: [0, -0.4, 0], size: [2.5, 0.05, 2.5], explodedOffset: [0, -1.2, 0], shape: 'box', color: '#0ea5e9' }
    ]
  },
  hydrogen_atom: {
    id: 'hydrogen_atom',
    name: 'Hydrogen Atom (Bohr & Quantum)',
    path: 'procedural/atomic/hydrogen',
    assetPath: 'procedural/atomic/hydrogen',
    modelStatus: 'AVAILABLE',
    category: 'Quantum Mechanics',
    description: 'The simplest atomic system consisting of a single proton nucleus bound to one electron in a 1s orbital.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'Fundamental atomic reference system for quantum mechanical spectral line emissions (Lyman, Balmer series).',
      keyFeatures: ['Central Single Proton Nucleus', 'Spherical 1s Ground State Orbital', 'Bohr Radius Constant (52.9 pm)'],
      workingPrinciple: 'Electron transitions between discrete energy levels release photons with precise wavelengths.',
      applications: ['Astrophysics Spectroscopy', 'Atomic Clocks'],
      specifications: { 'Atomic Number': '1', 'Bohr Radius': '52.9 pm', 'Ground Energy': '-13.6 eV' }
    },
    components: [
      { id: 'proton_nucleus', name: 'Central Proton Nucleus', description: 'Single positively charged proton core with rest mass 1.67 x 10^-27 kg.', position: [0, 0, 0], size: [0.35, 0.35, 0.35], explodedOffset: [0, 0, 0], shape: 'sphere', color: '#ef4444' }
    ]
  },

  atomic_nucleus: {
    id: 'atomic_nucleus',
    name: 'Atomic Nucleus (Carbon-12)',
    path: 'procedural/atomic/nucleus',
    assetPath: 'procedural/atomic/nucleus',
    modelStatus: 'AVAILABLE',
    category: 'Quantum Mechanics',
    description: 'Dense nuclear cluster composed of 6 protons and 6 neutrons bound by the strong nuclear force.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'Carbon-12 atomic nucleus serving as the reference standard for atomic mass units.',
      keyFeatures: ['6 Positive Protons + 6 Neutral Neutrons', 'Residual Strong Force Binding Field', 'Nuclear Shell Structure'],
      workingPrinciple: 'Quark-gluon strong nuclear interactions overcome electrostatic Coulomb repulsion between positively charged protons.',
      applications: ['Nuclear Physics', 'Carbon-14 Dating', 'Stellar Nucleosynthesis'],
      specifications: { 'Protons': '6', 'Neutrons': '6', 'Mass Defect': '92.16 MeV' }
    },
    components: [
      { id: 'nuc_protons', name: '6 Positive Protons (Red)', description: 'Positively charged nucleons providing nuclear charge Z=6.', position: [0.1, 0, 0], size: [0.6, 0.6, 0.6], explodedOffset: [0.5, 0.5, 0], shape: 'sphere', color: '#dc2626' },
      { id: 'nuc_neutrons', name: '6 Neutral Neutrons (Silver)', description: 'Uncharged nucleons adding strong force attraction without electrostatic repulsion.', position: [-0.1, 0, 0], size: [0.6, 0.6, 0.6], explodedOffset: [-0.5, -0.5, 0], shape: 'sphere', color: '#94a3b8' }
    ]
  },

  magnetic_field: {
    id: 'magnetic_field',
    name: 'Dipole Magnetic Field Lines',
    path: 'procedural/physics/magnetic_field',
    assetPath: 'procedural/physics/magnetic_field',
    modelStatus: 'AVAILABLE',
    category: 'Physics',
    description: 'Interactive visualization of 3D magnetic flux lines around a dipole magnet, illustrating vector intensity fields.',
    defaultScale: 1.0,
    educationalInformation: {
      overview: 'Visualizes Maxwell magnetic vector field lines looping from North magnetic pole to South pole.',
      keyFeatures: ['North and South Dipole Poles', 'Continuous Toroidal Vector Flux Rings', 'Field Intensity Density Gradient'],
      workingPrinciple: 'Magnetic fields exert Lorentz forces on moving electric charges perpendicular to both velocity and field vectors.',
      applications: ['Electromagnetism', 'Geomagnetism & Aurora Protection', 'MRI Medical Scanners'],
      specifications: { 'Field Type': 'Dipolar Vector Field B(r)', 'SI Unit': 'Tesla (T)' }
    },
    components: [
      { id: 'magnet_bar', name: 'Permanent Ferromagnetic Bar', description: 'Central magnet core with North (Red) and South (Blue) magnetic poles.', position: [0, 0, 0], size: [0.4, 1.2, 0.4], explodedOffset: [0, -0.7, 0], shape: 'box', color: '#ef4444' }
    ]
  },

  // Astronomy Library
  earth: {
    id: 'earth',
    name: 'Planet Earth Hologram',
    path: '/models/astronomy/earth.glb',
    assetPath: '/models/astronomy/earth.glb',
    modelStatus: 'AVAILABLE',
    category: 'Astronomy',
    description: 'A multi-layered holographic representation of Earth featuring planetary crust, atmosphere, and cloud layers.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'Third planet from the Sun, featuring liquid water oceans, nitrogen-oxygen atmosphere, and dynamic climate.',
      keyFeatures: ['Layered Crust & Liquid Water Oceans', 'Atmospheric Scattering Shell', 'Night Side City Lights Illumination Grid'],
      workingPrinciple: 'Rotates on a 23.5-degree axial tilt every 24 hours while orbiting the Sun every 365.25 days.',
      applications: ['Geospatial Earth Observation', 'Climate Science', 'Orbital Navigation'],
      specifications: { 'Radius': '6,371 km', 'Mass': '5.972 x 10^24 kg', 'Axial Tilt': '23.44°' }
    },
    components: [
      { id: 'earth_crust', name: 'Surface Crust & Oceans', description: 'Continental landmasses and deep ocean basins.', position: [0, 0, 0], size: [1.2, 1.2, 1.2], explodedOffset: [0, 0, 0], shape: 'sphere', color: '#0284c7' },
      { id: 'earth_atmos', name: 'Atmospheric Layer Shell', description: 'Protective fluid atmosphere layer scattering blue light.', position: [0, 0, 0], size: [1.4, 1.4, 1.4], explodedOffset: [0, 0.6, 0], shape: 'sphere', color: '#38bdf8' }
    ]
  },

  moon: {
    id: 'moon',
    name: 'The Moon (Earth Satellite)',
    path: '/models/astronomy/moon.glb',
    assetPath: '/models/astronomy/moon.glb',
    modelStatus: 'AVAILABLE',
    category: 'Astronomy',
    description: 'Earth\'s natural satellite featuring heavily cratered highlands and dark basaltic mare plains.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'Tidally locked natural satellite orbiting Earth at an average distance of 384,400 km.',
      keyFeatures: ['Tidally Locked Synchronous Orbit', 'Impact Crater Highlands', 'Basaltic Volcanic Mare Basins'],
      workingPrinciple: 'Gravitational tidal coupling locks lunar rotation rate to its orbital period around Earth.',
      applications: ['Planetary Science', 'Lunar Exploration Bases'],
      specifications: { 'Radius': '1,737 km', 'Orbital Period': '27.3 Days', 'Surface Gravity': '1.62 m/s²' }
    },
    components: [
      { id: 'moon_crust', name: 'Lunar Regolith Crust', description: 'Impact-cratered silicate rock crust covered in fine dust regolith.', position: [0, 0, 0], size: [1.1, 1.1, 1.1], explodedOffset: [0, 0, 0], shape: 'sphere', color: '#cbd5e1' }
    ]
  },

  solar_system: {
    id: 'solar_system',
    name: 'Solar System Planetary Orbits',
    path: '/models/astronomy/solar_system.glb',
    assetPath: '/models/astronomy/solar_system.glb',
    modelStatus: 'AVAILABLE',
    category: 'Astronomy',
    description: 'Interactive scale model of the central Sun and orbital paths of the terrestrial and gas giant planets.',
    defaultScale: 0.3,
    educationalInformation: {
      overview: 'Gravitationally bound system consisting of the Sun and objects orbiting it according to Kepler\'s Laws.',
      keyFeatures: ['Central G2V Yellow Dwarf Star (Sun)', '4 Terrestrial Inner Planets', '4 Gas & Ice Giant Outer Planets'],
      workingPrinciple: 'Planetary orbits follow elliptical paths governed by Newton\'s universal law of gravitation.',
      applications: ['Astrodynamics', 'Interplanetary Space Mission Planning'],
      specifications: { 'Star Type': 'G2V Main Sequence', 'Age': '4.6 Billion Years', 'Planets': '8' }
    },
    components: [
      { id: 'sun_core', name: 'Central Solar Core', description: 'Nuclear fusion core producing 3.8 x 10^26 Watts of radiant energy.', position: [0, 0, 0], size: [0.8, 0.8, 0.8], explodedOffset: [0, 0, 0], shape: 'sphere', color: '#f59e0b' }
    ]
  },

  iss: {
    id: 'iss',
    name: 'International Space Station',
    path: '/models/astronomy/iss.glb',
    assetPath: '/models/astronomy/iss.glb',
    modelStatus: 'AVAILABLE',
    category: 'Astronomy',
    description: 'Modular habitable space laboratory orbiting Earth in Low Earth Orbit at 28,000 km/h.',
    defaultScale: 1.0,
    intelligence: {
      category: AssetCategory.AEROSPACE,
      targetDetailLevel: DetailLevel.L3_DIGITAL_TWIN,
      functionalTraits: ['truss_structure', 'solar_arrays', 'pressurized_modules', 'radiators', 'robotic_arms'],
      generationRules: {
        'geometry': 'Must feature extensive truss framework, multiple cylindrical modules with docking ports, and large solar wings',
        'materials': 'High-reflectivity gold foil, white composite panels, metallic truss structures, and glowing solar cells',
        'hierarchy': 'ISS_Core > (Truss_Assembly, Modules, Solar_Arrays, Radiators)'
      }
    },
    educationalInformation: {
      overview: 'Largest artificial body in space, hosting microgravity scientific research experiments since 2000.',
      keyFeatures: ['Integrated Truss Structure (109 meters)', '8 Tracking Solar Array Wings (240 kW)', 'Pressurized European/US/Japanese/Russian Modules'],
      workingPrinciple: 'Orbits in continuous free-fall around Earth at 400 km altitude, completing 15.5 orbits per day.',
      applications: ['Microgravity Biological Research', 'Deep Space Human Survival Testing'],
      specifications: { 'Altitude': '410 km', 'Speed': '27,600 km/h', 'Mass': '450,000 kg', 'Length': '109 meters' }
    },
    components: [
      { id: 'iss_truss', name: 'Main Integrated Truss Structure', description: 'Central structural backbone supporting solar wings and radiators.', position: [0, 0, 0], size: [2.8, 0.15, 0.15], explodedOffset: [0, -0.5, 0], shape: 'box', color: '#94a3b8' },
      { id: 'iss_solar', name: 'Photovoltaic Solar Wings', description: 'Tracking photovoltaic arrays generating 240 kW of electrical power.', position: [0, 0.5, 0], size: [2.6, 0.05, 0.8], explodedOffset: [0, 0.8, 0], shape: 'box', color: '#b45309' }
    ]
  },

  satellite: {
    id: 'satellite',
    name: 'Geostationary Communication Satellite',
    path: '/models/astronomy/satellite.glb',
    assetPath: '/models/astronomy/satellite.glb',
    modelStatus: 'AVAILABLE',
    category: 'Astronomy',
    description: 'High-capacity telecommunications satellite stationed in geostationary orbit 35,786 km above Earth.',
    defaultScale: 1.5,
    educationalInformation: {
      overview: 'Communications spacecraft maintaining fixed position relative to Earth\'s surface for global satellite relays.',
      keyFeatures: ['Dual High-Gain Parabolic Reflectors', 'Deployable Solar Panel Wings', 'Hydrazine Station-Keeping Thrusters'],
      workingPrinciple: 'Orbital period matches Earth\'s 24-hour rotation rate, allowing stationary ground dish pointing.',
      applications: ['Global Satellite Internet', 'Direct-to-Home TV Relay', 'Weather Telemetry'],
      specifications: { 'Orbit Altitude': '35,786 km', 'Operational Lifetime': '15 Years', 'Transponders': '48 Ku/Ka Band' }
    },
    components: [
      { id: 'sat_bus', name: 'Cube Satellite Bus Box', description: 'Honeycombed aluminum body enclosing transponders and batteries.', position: [0, 0, 0], size: [0.6, 0.8, 0.6], explodedOffset: [0, -0.5, 0], shape: 'box', color: '#e2e8f0' },
      { id: 'sat_dish', name: 'Parabolic Dish Antenna', description: 'High-gain reflector dish focusing Ku/Ka band radio frequencies.', position: [0, 0, 0.4], size: [0.6, 0.6, 0.1], explodedOffset: [0, 0, 0.8], shape: 'sphere', color: '#cbd5e1' }
    ]
  }
};
