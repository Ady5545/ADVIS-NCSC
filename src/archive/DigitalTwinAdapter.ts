import { SPATIAL_LIBRARY } from './SpatialLibrary';
import { ModelRegistry, ReferenceModelEngine } from './AutonomousModelEngine';
import { 
  DigitalTwin, 
  DigitalTwinComponent, 
  Connection, 
  DigitalTwinFunction, 
  DiagnosticRecord, 
  DataProvenance,
  IndustrialDigitalTwin,
  IndustrialSystemType 
} from './DigitalTwin';
import { CHEMISTRY_DATABASE, ChemicalEntity } from './LearnEngine/ChemistryDatabase';

function createDiagnosticState(compId: string): DiagnosticRecord {
  return {
    componentId: compId,
    status: 'UNKNOWN',
    source: 'UNKNOWN',
    explanation: 'No verified live sensor telemetry connected'
  };
}

export function getDigitalTwin(objectId: string): DigitalTwin | null {
  // 0. Check if it's an autonomously constructed Digital Twin in ModelRegistry
  const generatedTwin = ModelRegistry.getGeneratedTwin(objectId);
  if (generatedTwin) {
    return generatedTwin;
  }

  // 0.1 Check if it's an authoritative ReferenceModel
  const refModel = ReferenceModelEngine.getReferenceModel(objectId);
  if (refModel) {
    return ReferenceModelEngine.convertToDigitalTwin(refModel);
  }

  // 1. Check if it's a Chemistry entity
  if (CHEMISTRY_DATABASE[objectId]) {
    const chem: any = CHEMISTRY_DATABASE[objectId];
    const chemComponents: DigitalTwinComponent[] = (chem.atoms || []).map((atom: any, index: number) => {
      const atomId = `atom_${atom.element}_${index}`;
      return {
        id: atomId,
        name: `${atom.element} (${atom.orbitalHybridization || 'Atom'})`,
        category: 'Atom',
        description: `Element ${atom.element} with formal charge ${atom.formalCharge ?? 0}, ${atom.lonePairs ?? 0} lone pairs`,
        material: 'Atomic Element',
        position: [atom.x, atom.y, atom.z],
        specifications: {
          'Element': atom.element,
          'Electronegativity': atom.electronegativity ? String(atom.electronegativity) : 'N/A',
          'Formal Charge': String(atom.formalCharge ?? 0),
          'Hybridization': atom.orbitalHybridization || 'sp3',
          'Valence Count': String(atom.valenceCount ?? 0)
        },
        diagnosticState: createDiagnosticState(atomId)
      };
    });

    const chemConnections: Connection[] = (chem.bonds || []).map((bond: any, idx: number) => {
      return {
        id: `bond_${idx}`,
        sourceComponentId: `atom_${chem.atoms[bond.atomAIndex]?.element}_${bond.atomAIndex}`,
        targetComponentId: `atom_${chem.atoms[bond.atomBIndex]?.element}_${bond.atomBIndex}`,
        type: 'chemical',
        description: `${bond.type || 'Covalent'} bond (Order: ${bond.order || 1}, Length: ${bond.lengthAngstroms || 1.0} Å)`,
        nominalRating: `${bond.lengthAngstroms || 1.0} Å`
      };
    });

    const chemFunctions: DigitalTwinFunction[] = [
      {
        id: 'func_molecular_geometry',
        name: `${chem.vseprGeometry} VSEPR Geometry`,
        category: 'CHEMICAL_REACTION',
        description: `Electronic dipole moment: ${chem.netDipoleMomentDebye} D. Bond angle: ${chem.bondAnglesDegrees?.[0] || '109.5'}°`
      }
    ];

    return {
      id: objectId,
      name: chem.commonName || chem.formula,
      domain: 'CHEMISTRY',
      description: chem.description,
      components: chemComponents,
      connections: chemConnections,
      functions: chemFunctions,
      specifications: {
        'Formula': chem.formula,
        'Molar Mass': `${chem.molarMassGPerMol} g/mol`,
        'Geometry': chem.vseprGeometry,
        'Net Dipole': `${chem.netDipoleMomentDebye} D`
      },
      dataProvenance: 'LIT'
    };
  }

  // 2. Check Industrial Subrack / nVent / Schroff Domain
  if (objectId === 'industrial_subrack' || objectId === 'schroff_subrack') {
    const industrialComponents: DigitalTwinComponent[] = [
      {
        id: 'schroff_19in_chassis',
        name: '19" EuropacPRO 3U Subrack Chassis',
        category: 'Structural Enclosure',
        description: 'Extruded aluminum side panels, horizontal cross-rails, and card guides adhering to IEC 60297-3-101.',
        material: 'Anodized Aluminum (AlMgSi0.5)',
        specifications: { 'Standard': 'IEC 60297-3-101 / IEEE 1101.10', 'Height': '3U (132.5 mm)', 'Width': '84 HP (426.7 mm)', 'Depth': '235 mm' },
        diagnosticState: createDiagnosticState('schroff_19in_chassis')
      },
      {
        id: 'schroff_backplane',
        name: 'Monolithic High-Speed Backplane (CompactPCI / VPX)',
        category: 'Power & High-Speed Data Bus',
        description: '10-layer PCB backplane distributing +3.3V, +5V, +12V DC power and differential PCIe Gen3 signals.',
        material: 'FR4 High-TG Laminate, Gold-Plated Hard Gold Pins',
        specifications: { 'Slots': '8 Slot VPX / cPCI', 'Impedance': '100 Ω Differential', 'Max Current/Slot': '15 A' },
        diagnosticState: createDiagnosticState('schroff_backplane')
      },
      {
        id: 'schroff_fan_tray',
        name: 'Hot-Swappable 1U 3-Fan Tray Module',
        category: 'Thermal Management',
        description: 'Front-extractable fan tray with speed-tachometer feedback and automatic airflow guide baffles.',
        material: 'Galvanized Sheet Steel & Ball-Bearing DC Fans',
        specifications: { 'Airflow': '240 CFM (407 m³/h)', 'Input Voltage': '12V DC', 'Operating Temp': '-20°C to +70°C' },
        diagnosticState: createDiagnosticState('schroff_fan_tray')
      },
      {
        id: 'schroff_psu',
        name: '19" Plug-in Redundant Power Supply (MaxPower 250W)',
        category: 'Power Generation & Conditioning',
        description: 'Pluggable 3U 8HP AC/DC switch-mode power supply with current sharing and N+1 redundancy.',
        material: 'Shielded Enclosure, Industrial SMPS',
        specifications: { 'Input Voltage': '90-264 V AC', 'Output Power': '250 W', 'Efficiency': '> 88%', 'Hold-up Time': '20 ms' },
        diagnosticState: createDiagnosticState('schroff_psu')
      }
    ];

    const industrialConnections: Connection[] = [
      { id: 'conn_psu_backplane', sourceComponentId: 'schroff_psu', targetComponentId: 'schroff_backplane', type: 'power', description: 'Heavy-duty DIN 41612 connector feeds 12V/5V DC bus' },
      { id: 'conn_backplane_fan', sourceComponentId: 'schroff_backplane', targetComponentId: 'schroff_fan_tray', type: 'power', description: 'Auxiliary 12V power rail and PWM speed tachometer signal' },
      { id: 'conn_fan_chassis', sourceComponentId: 'schroff_fan_tray', targetComponentId: 'schroff_19in_chassis', type: 'thermal', description: 'Forced bottom-to-top convection cooling through perforated floor' }
    ];

    const industrialFunctions: DigitalTwinFunction[] = [
      { id: 'func_power_dist', name: 'Redundant Power Distribution', category: 'POWER_DELIVERY', inputComponents: ['schroff_psu'], outputComponents: ['schroff_backplane'], description: 'Converts AC mains to conditioned low-noise DC rails.' },
      { id: 'func_cooling_mgmt', name: 'Active Forced Convection', category: 'THERMAL_DISSIPATION', inputComponents: ['schroff_fan_tray'], outputComponents: ['schroff_19in_chassis'], description: 'Maintains card slot temperatures < 50°C under maximum payload.' }
    ];

    const industrialTwin: IndustrialDigitalTwin = {
      id: objectId,
      name: 'nVent Schroff EuropacPRO 19" 3U Modular Subrack',
      domain: 'INDUSTRIAL_EQUIPMENT',
      manufacturer: 'nVent Schroff',
      modelNumber: '24563-131 / EuropacPRO',
      systemType: 'subrack',
      rackUnits: 3,
      ipRating: 'IP20 (with EMC Shielding upgradeable to IP65)',
      emiShielding: true,
      airflowDirection: 'BOTTOM_TO_TOP',
      nominalPowerWatts: 250,
      description: 'Standardized 19" subrack packaging system for high-reliability modular electronic assemblies.',
      components: industrialComponents,
      connections: industrialConnections,
      functions: industrialFunctions,
      dataProvenance: 'LIT'
    };

    return industrialTwin;
  }

  // 3. Spatial Library Engineering Catalog
  const obj = SPATIAL_LIBRARY[objectId];
  if (!obj) return null;

  // We map the existing components to DigitalTwinComponents
  const dtComponents: DigitalTwinComponent[] = obj.components.map(comp => {
    return {
      id: comp.id,
      name: comp.name,
      category: comp.category || 'Component',
      description: comp.description || 'Engineering component assembly.',
      material: comp.engineeringDetails?.material || 'Engineered Alloy',
      position: comp.position,
      rotation: comp.rotation,
      specifications: {
        ...comp.engineeringDetails?.specifications,
        weight: comp.engineeringDetails?.weight
      },
      diagnosticState: createDiagnosticState(comp.id)
    };
  });

  const dtConnections: Connection[] = [];
  const dtFunctions: DigitalTwinFunction[] = [];
  let dataProvenance: DataProvenance = 'LIT';

  // --- V12 ENGINE ---
  if (objectId === 'v12_engine') {
    dtConnections.push(
      { id: 'conn_crank_rods', sourceComponentId: 'crankshaft', targetComponentId: 'connecting_rods', type: 'mechanical', description: 'Crankshaft journals transfer rotational torque to connecting rods' },
      { id: 'conn_rods_pistons', sourceComponentId: 'connecting_rods', targetComponentId: 'piston_left_bank', type: 'mechanical', description: 'Connecting rods push pistons' },
      { id: 'conn_valvetrain_block', sourceComponentId: 'valvetrain', targetComponentId: 'engine_block', type: 'mechanical', description: 'Valvetrain mounts to cylinder heads on the block' },
      { id: 'conn_intake_valves', sourceComponentId: 'intake_plenum', targetComponentId: 'valvetrain', type: 'fluid', description: 'Air enters combustion chamber via intake valves' },
      { id: 'conn_exhaust_valves', sourceComponentId: 'valvetrain', targetComponentId: 'exhaust_manifold', type: 'fluid', description: 'Exhaust gas exits via exhaust valves' }
    );
    dtFunctions.push(
      { id: 'func_combustion', name: 'Combustion Cycle', category: 'POWER_DELIVERY', inputComponents: ['intake_plenum'], outputComponents: ['piston_left_bank', 'piston_right_bank', 'exhaust_manifold'], description: 'Ignition of air-fuel mixture produces thermal expansion' },
      { id: 'func_power', name: 'Power Delivery', category: 'MOTION_CONVERSION', inputComponents: ['piston_left_bank', 'piston_right_bank'], outputComponents: ['connecting_rods', 'crankshaft'], description: 'Linear reciprocation converted to rotational torque' },
      { id: 'func_cooling', name: 'Cooling', category: 'THERMAL_DISSIPATION', inputComponents: ['cooling_system'], outputComponents: ['engine_block'], description: 'Water jacket absorbs combustion heat' }
    );
  }

  // --- ROTARY / WANKEL ENGINE ---
  if (objectId === 'rotary_engine') {
    dtConnections.push(
      { id: 'conn_rotor_shaft', sourceComponentId: 'triangular_rotor', targetComponentId: 'eccentric_shaft', type: 'mechanical', description: 'Internal rotor gear meshes with stationary gear to orbit eccentric shaft' },
      { id: 'conn_housing_rotor', sourceComponentId: 'epitrochoid_housing', targetComponentId: 'triangular_rotor', type: 'mechanical', description: 'Housing guides apex seals' }
    );
    dtFunctions.push(
      { id: 'func_rotary_cycle', name: '4-Phase Rotary Thermodynamics', category: 'MOTION_CONVERSION', inputComponents: ['epitrochoid_housing'], outputComponents: ['triangular_rotor', 'eccentric_shaft'], description: '3 chambers simultaneously execute intake, compression, combustion, exhaust.' }
    );
  }

  // --- SERVO (SG90) ---
  if (objectId === 'servo_motor' || objectId === 'sg90_servo') {
    dtConnections.push(
      { id: 'conn_motor_gear', sourceComponentId: 'servo_motor_core', targetComponentId: 'servo_gears', type: 'mechanical', description: 'DC motor pinion drives the reduction geartrain' },
      { id: 'conn_gear_horn', sourceComponentId: 'servo_gears', targetComponentId: 'servo_arm', type: 'mechanical', description: 'Final output spline drives the external horn' },
      { id: 'conn_pot_gear', sourceComponentId: 'servo_gears', targetComponentId: 'servo_pot', type: 'mechanical', description: 'Output shaft rotation is measured by potentiometer' },
      { id: 'conn_board_motor', sourceComponentId: 'servo_board', targetComponentId: 'servo_motor_core', type: 'power', description: 'H-Bridge drives the coreless motor' },
      { id: 'conn_board_pot', sourceComponentId: 'servo_pot', targetComponentId: 'servo_board', type: 'signal', description: 'Potentiometer provides analog voltage feedback to controller' }
    );
    dtFunctions.push(
      { id: 'func_closed_loop', name: 'Closed-Loop PID Control', category: 'CONTROL_LOGIC', inputComponents: ['servo_pot', 'servo_board'], outputComponents: ['servo_motor_core'], description: 'Controller compares PWM setpoint to potentiometer feedback to actuate motor' }
    );
  }

  // --- STEPPER MOTOR ---
  if (objectId === 'stepper_motor') {
    dtConnections.push(
      { id: 'conn_stator_rotor', sourceComponentId: 'stepper_stator', targetComponentId: 'stepper_rotor', type: 'mechanical', description: 'Electromagnetic stator coils exert stepping reluctance torque on toothed rotor' },
      { id: 'conn_rotor_shaft', sourceComponentId: 'stepper_rotor', targetComponentId: 'stepper_shaft', type: 'mechanical', description: 'Rotor drives output shaft' }
    );
    dtFunctions.push(
      { id: 'func_microstepping', name: 'Discrete Step Indexing', category: 'MOTION_CONVERSION', inputComponents: ['stepper_stator'], outputComponents: ['stepper_rotor'], description: 'Sequential phase energization rotates shaft in precise 1.8° step increments.' }
    );
  }

  // --- ARDUINO UNO ---
  if (objectId === 'arduino_uno') {
    dtConnections.push(
      { id: 'conn_usb_mega', sourceComponentId: 'usb_port', targetComponentId: 'atmega16u2', type: 'data', description: 'USB data to Serial bridge' },
      { id: 'conn_mega_mcu', sourceComponentId: 'atmega16u2', targetComponentId: 'atmega328p', type: 'data', description: 'Serial TX/RX to main MCU' },
      { id: 'conn_power_reg', sourceComponentId: 'barrel_jack', targetComponentId: 'voltage_regulator', type: 'power', description: '7-12V input to 5V regulator' },
      { id: 'conn_reg_mcu', sourceComponentId: 'voltage_regulator', targetComponentId: 'atmega328p', type: 'power', description: 'Regulated 5.0V VCC rail' }
    );
    dtFunctions.push(
      { id: 'func_logic', name: 'Instruction Execution', category: 'CONTROL_LOGIC', inputComponents: ['atmega328p'], outputComponents: ['gpio_headers'], description: 'Executes AVR machine code and drives logic pins' }
    );
  }

  // --- ESP32 ---
  if (objectId === 'esp32') {
    dtConnections.push(
      { id: 'conn_antenna_mcu', sourceComponentId: 'pcb_antenna', targetComponentId: 'esp32_wroom', type: 'signal', description: '2.4GHz RF transceiver path' }
    );
    dtFunctions.push(
      { id: 'func_wifi', name: 'Wireless Comms', category: 'SIGNAL_ROUTING', inputComponents: ['esp32_wroom'], outputComponents: ['pcb_antenna'], description: '802.11 b/g/n and BLE transmission' }
    );
  }

  // --- HELIOMOTION / SOLAR TRACKER ---
  if (objectId === 'solar_tracker' || objectId === 'heliomotion') {
    dtConnections.push(
      { id: 'conn_base_yaw', sourceComponentId: 'tracker_base', targetComponentId: 'tracker_yaw_servo', type: 'structural', description: 'Base supports the yaw rotation servo' },
      { id: 'conn_yaw_pitch', sourceComponentId: 'tracker_yaw_servo', targetComponentId: 'tracker_pitch_servo', type: 'structural', description: 'Yaw servo bracket holds the pitch servo' },
      { id: 'conn_pitch_panel', sourceComponentId: 'tracker_pitch_servo', targetComponentId: 'tracker_panel', type: 'structural', description: 'Pitch servo drives the solar panel tilt' },
      { id: 'conn_ldr_panel', sourceComponentId: 'tracker_ldr_array', targetComponentId: 'tracker_panel', type: 'structural', description: 'LDR cross array is mounted normal to the panel face' }
    );
    dtFunctions.push(
      { id: 'func_tracking', name: 'Sun Tracking', category: 'CONTROL_LOGIC', inputComponents: ['tracker_ldr_array'], outputComponents: ['tracker_yaw_servo', 'tracker_pitch_servo'], description: 'Calculates light vector from LDRs to actuate servos' },
      { id: 'func_generation', name: 'Power Generation', category: 'POWER_DELIVERY', inputComponents: ['tracker_panel'], outputComponents: [], description: 'Photovoltaic conversion of perpendicular solar irradiance' }
    );
  }

  return {
    id: objectId,
    name: obj.name,
    domain: obj.category || 'MECHANICAL',
    description: obj.description,
    components: dtComponents,
    connections: dtConnections,
    functions: dtFunctions,
    specifications: obj.educationalInformation?.specifications || {},
    dataProvenance: dataProvenance
  };
}

