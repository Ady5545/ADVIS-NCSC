import re

content = """import { SPATIAL_LIBRARY } from './SpatialLibrary';
import { DigitalTwin, DigitalTwinComponent, Connection, DigitalTwinFunction, DiagnosticState, ProvenanceLevel } from './DigitalTwin';
import { IndustrialDigitalTwin, IndustrialSystemType } from './DigitalTwin'; // Assuming this was appended earlier

function createDiagnosticState(compId: string): DiagnosticState {
  return {
    componentId: compId,
    status: 'UNKNOWN',
    source: 'UNKNOWN',
    explanation: 'No verified diagnostic data available'
  };
}

export function getDigitalTwin(objectId: string): DigitalTwin | null {
  const obj = SPATIAL_LIBRARY[objectId];
  if (!obj) return null;

  // We map the existing components to DigitalTwinComponents
  const dtComponents: DigitalTwinComponent[] = obj.components.map(comp => {
    return {
      id: comp.id,
      name: comp.name,
      description: comp.description || 'No description available',
      material: comp.engineeringDetails?.material,
      specifications: {
        ...comp.engineeringDetails?.specifications,
        weight: comp.engineeringDetails?.weight
      },
      diagnosticState: createDiagnosticState(comp.id)
    };
  });

  const dtConnections: Connection[] = [];
  const dtFunctions: DigitalTwinFunction[] = [];
  let dataProvenance: ProvenanceLevel = 'LIT';

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
      { id: 'func_combustion', name: 'Combustion Cycle', inputComponents: ['intake_plenum'], outputComponents: ['piston_left_bank', 'piston_right_bank', 'exhaust_manifold'], description: 'Ignition of air-fuel mixture produces thermal expansion' },
      { id: 'func_power', name: 'Power Delivery', inputComponents: ['piston_left_bank', 'piston_right_bank'], outputComponents: ['connecting_rods', 'crankshaft'], description: 'Linear reciprocation converted to rotational torque' },
      { id: 'func_cooling', name: 'Cooling', inputComponents: ['cooling_system'], outputComponents: ['engine_block'], description: 'Water jacket absorbs combustion heat' }
    );
  }

  // --- SERVO (SG90) ---
  if (objectId === 'servo_motor') {
    dtConnections.push(
      { id: 'conn_motor_gear', sourceComponentId: 'servo_motor_core', targetComponentId: 'servo_gears', type: 'mechanical', description: 'DC motor pinion drives the reduction geartrain' },
      { id: 'conn_gear_horn', sourceComponentId: 'servo_gears', targetComponentId: 'servo_arm', type: 'mechanical', description: 'Final output spline drives the external horn' },
      { id: 'conn_pot_gear', sourceComponentId: 'servo_gears', targetComponentId: 'servo_pot', type: 'mechanical', description: 'Output shaft rotation is measured by potentiometer' },
      { id: 'conn_board_motor', sourceComponentId: 'servo_board', targetComponentId: 'servo_motor_core', type: 'electrical', description: 'H-Bridge drives the coreless motor' },
      { id: 'conn_board_pot', sourceComponentId: 'servo_pot', targetComponentId: 'servo_board', type: 'electrical', description: 'Potentiometer provides analog voltage feedback to controller' }
    );
    dtFunctions.push(
      { id: 'func_closed_loop', name: 'Closed-Loop Control', inputComponents: ['servo_pot', 'servo_board'], outputComponents: ['servo_motor_core'], description: 'Controller compares PWM setpoint to potentiometer feedback to actuate motor' }
    );
  }

  // --- ARDUINO UNO ---
  if (objectId === 'arduino_uno') {
    dtConnections.push(
      { id: 'conn_usb_mega', sourceComponentId: 'usb_port', targetComponentId: 'atmega16u2', type: 'electrical', description: 'USB data to Serial bridge' },
      { id: 'conn_mega_mcu', sourceComponentId: 'atmega16u2', targetComponentId: 'atmega328p', type: 'electrical', description: 'Serial TX/RX to main MCU' },
      { id: 'conn_power_reg', sourceComponentId: 'barrel_jack', targetComponentId: 'voltage_regulator', type: 'electrical', description: '7-12V input to 5V regulator' }
    );
    dtFunctions.push(
      { id: 'func_logic', name: 'Instruction Execution', inputComponents: ['atmega328p'], outputComponents: ['gpio_headers'], description: 'Executes AVR machine code and drives logic pins' }
    );
  }

  // --- ESP32 ---
  if (objectId === 'esp32') {
    dtConnections.push(
      { id: 'conn_antenna_mcu', sourceComponentId: 'pcb_antenna', targetComponentId: 'esp32_wroom', type: 'electrical', description: '2.4GHz RF transceiver path' }
    );
    dtFunctions.push(
      { id: 'func_wifi', name: 'Wireless Comms', inputComponents: ['esp32_wroom'], outputComponents: ['pcb_antenna'], description: '802.11 b/g/n and BLE transmission' }
    );
  }

  // --- HELIOMOTION ---
  if (objectId === 'solar_tracker') {
    dtConnections.push(
      { id: 'conn_base_yaw', sourceComponentId: 'tracker_base', targetComponentId: 'tracker_yaw_servo', type: 'structural', description: 'Base supports the yaw rotation servo' },
      { id: 'conn_yaw_pitch', sourceComponentId: 'tracker_yaw_servo', targetComponentId: 'tracker_pitch_servo', type: 'structural', description: 'Yaw servo bracket holds the pitch servo' },
      { id: 'conn_pitch_panel', sourceComponentId: 'tracker_pitch_servo', targetComponentId: 'tracker_panel', type: 'structural', description: 'Pitch servo drives the solar panel tilt' },
      { id: 'conn_ldr_panel', sourceComponentId: 'tracker_ldr_array', targetComponentId: 'tracker_panel', type: 'structural', description: 'LDR cross array is mounted normal to the panel face' }
    );
    dtFunctions.push(
      { id: 'func_tracking', name: 'Sun Tracking', inputComponents: ['tracker_ldr_array'], outputComponents: ['tracker_yaw_servo', 'tracker_pitch_servo'], description: 'Calculates light vector from LDRs to actuate servos' },
      { id: 'func_generation', name: 'Power Generation', inputComponents: ['tracker_panel'], outputComponents: [], description: 'Photovoltaic conversion of perpendicular solar irradiance' }
    );
  }

  return {
    id: objectId,
    name: obj.name,
    domain: obj.category || 'Engineering',
    description: obj.description,
    components: dtComponents,
    connections: dtConnections,
    functions: dtFunctions,
    dataProvenance: dataProvenance
  };
}
"""

with open('src/DigitalTwinAdapter.ts', 'w') as f:
    f.write(content)

