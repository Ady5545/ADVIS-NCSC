import { ConnectionType, SafetyState } from './DigitalTwin';

export interface ComponentFailureProfile {
  id: string;
  componentType: string;
  name: string;
  symptoms: string[];
  possibleCauses: string[];
  affectedConnectionTypes: ConnectionType[];
  diagnosticTests: {
    testName: string;
    method: 'NON_CONTACT_OPTICAL' | 'THERMAL_IMAGING' | 'ACOUSTIC_VIBRATION' | 'MULTIMETER_ELECTRICAL' | 'MANUAL_INSPECTION' | 'OSCILLOSCOPE';
    instrument: string;
    expectedNormal: string;
    expectedFault: string;
    canDetermineFromCAD: boolean; // strictly false for live faults
  }[];
  distinguishingMeasurement: string;
  safetyState: SafetyState;
  repairProcedure: string[];
}

export const FAILURE_MODE_DATABASE: Record<string, ComponentFailureProfile[]> = {
  // Motor / Actuator
  motor: [
    {
      id: 'motor_winding_open_short',
      componentType: 'electric_motor',
      name: 'Winding Open / Inter-Turn Short Circuit',
      symptoms: ['No rotation on PWM command', 'Excessive localized heat', 'Audible high-frequency whine without torque', 'High current draw / power supply trip'],
      possibleCauses: ['Insulation breakdown due to overtemperature', 'Voltage transient spike', 'Rotor stall under excessive mechanical load'],
      affectedConnectionTypes: ['electrical', 'power', 'mechanical'],
      diagnosticTests: [
        {
          testName: 'Coil Resistance Measurement',
          method: 'MULTIMETER_ELECTRICAL',
          instrument: 'Digital Multimeter (Low-Resistance Ohms scale)',
          expectedNormal: 'Balanced winding resistance matching nominal spec (e.g. 5-30 Ω)',
          expectedFault: '0.0 Ω (dead short) or infinite > 10MΩ (open coil)',
          canDetermineFromCAD: false
        },
        {
          testName: 'Infrared Thermal Signature',
          method: 'THERMAL_IMAGING',
          instrument: 'FLIR / Calibrated IR Thermometer',
          expectedNormal: 'Uniform body temp < 55°C',
          expectedFault: 'Localized stator hotspot > 95°C',
          canDetermineFromCAD: false
        }
      ],
      distinguishingMeasurement: 'Phase-to-phase milliohm resistance and inductance balance.',
      safetyState: {
        hazardous: true,
        hazardType: 'HIGH_TEMPERATURE',
        isolationRequired: true,
        lockoutTagoutProcedure: ['Disconnect power source before touching motor casing', 'Verify zero energy with DMM'],
        ppeRequired: ['Thermal insulated gloves', 'Safety glasses'],
        warning: 'High casing temperatures (>90°C) and potential electrical short hazard.'
      },
      repairProcedure: [
        '1. Isolate motor drive power connector.',
        '2. Inspect stator windings for burnt enamel or discoloration.',
        '3. Replace motor core assembly if resistance is out of tolerance.',
        '4. Verify current-limiting fuse or H-bridge driver before re-energizing.'
      ]
    },
    {
      id: 'motor_bearing_seizure',
      componentType: 'electric_motor',
      name: 'Mechanical Bearing Seizure / Friction Overload',
      symptoms: ['Shaft locked or stiff to turn manually', 'Motor hums but does not spin', 'Driver overheating'],
      possibleCauses: ['Lubricant degradation / contamination', 'Excessive radial/axial shaft load', 'Debris ingress'],
      affectedConnectionTypes: ['mechanical', 'structural'],
      diagnosticTests: [
        {
          testName: 'Manual Shaft Free-Spin Test',
          method: 'MANUAL_INSPECTION',
          instrument: 'Manual de-energized rotation check',
          expectedNormal: 'Smooth rotation with minimal detent torque',
          expectedFault: 'Gritty resistance, notched rotation, or fully locked shaft',
          canDetermineFromCAD: false
        }
      ],
      distinguishingMeasurement: 'Breakaway starting torque required to rotate shaft.',
      safetyState: {
        hazardous: false,
        hazardType: 'ROTATING_MASS',
        isolationRequired: true,
        warning: 'Ensure power is isolated before manual rotation to avoid sudden pinch injury.'
      },
      repairProcedure: [
        '1. De-energize system.',
        '2. Disconnect output coupling/horn.',
        '3. Inspect bearing races and clean debris.',
        '4. Lubricate with synthetic bearing grease or replace bearing cartridge.'
      ]
    }
  ],

  // Potentiometer / Feedback
  potentiometer: [
    {
      id: 'pot_wiper_wear_dropout',
      componentType: 'sensor_potentiometer',
      name: 'Resistive Track Wear / Wiper Contact Dropout',
      symptoms: ['Jittery or sporadic servo positioning', 'Servo runaway to mechanical stops', 'Unstable ADC feedback voltage'],
      possibleCauses: ['Carbon resistive track wear from continuous dither', 'Wiper spring fatigue', 'Dust contamination'],
      affectedConnectionTypes: ['electrical', 'signal', 'control'],
      diagnosticTests: [
        {
          testName: 'Wiper Sweep Voltage Linearity Test',
          method: 'OSCILLOSCOPE',
          instrument: 'Oscilloscope / High-Speed Data Logger',
          expectedNormal: 'Monotonic, noise-free 0-5V linear ramp during rotation',
          expectedFault: 'Voltage dropouts to 0V or high spikes at specific rotation angles',
          canDetermineFromCAD: false
        }
      ],
      distinguishingMeasurement: 'Signal noise amplitude (>50mV spikes) during smooth continuous sweep.',
      safetyState: {
        hazardous: false,
        hazardType: 'NONE',
        isolationRequired: false,
        warning: 'Low voltage signal circuit (0-5V); safe for probing with standard oscilloscope probes.'
      },
      repairProcedure: [
        '1. Inspect potentiometer wiper contacts.',
        '2. Clean resistive track with non-residue contact cleaner.',
        '3. If carbon track is physically grooved or worn through, replace potentiometer.'
      ]
    }
  ],

  // Microcontroller & Logic
  microcontroller: [
    {
      id: 'mcu_brownout_power_fault',
      componentType: 'integrated_circuit',
      name: 'Brownout Reset / Supply Voltage Instability',
      symptoms: ['Intermittent MCU reboots', 'Unresponsive USB serial communications', 'LED flicker under load'],
      possibleCauses: ['Inadequate power supply capacitance', 'Overloaded 5V/3.3V LDO regulator', 'Excessive inrush current from external actuators'],
      affectedConnectionTypes: ['electrical', 'power', 'data'],
      diagnosticTests: [
        {
          testName: 'VCC Rail Voltage Ripple Check',
          method: 'OSCILLOSCOPE',
          instrument: 'Oscilloscope (AC-Coupled 20MHz BW)',
          expectedNormal: 'Stable 5.0V ± 5% with < 50mV peak-to-peak ripple',
          expectedFault: 'Voltage sags below 4.3V (Brownout threshold) or > 300mV ripple',
          canDetermineFromCAD: false
        }
      ],
      distinguishingMeasurement: 'Minimum instantaneous voltage dip during motor actuation.',
      safetyState: {
        hazardous: false,
        hazardType: 'NONE',
        isolationRequired: false,
        warning: 'Low voltage digital logic circuit.'
      },
      repairProcedure: [
        '1. Verify input DC supply capacity (Amperes).',
        '2. Add 100uF low-ESR bulk electrolytic capacitor across 5V and GND rail.',
        '3. Isolate high-current motor power ground from sensitive digital ground.'
      ]
    }
  ],

  // Mechanical Reciprocating / Engine (Pistons, Rods, Crankshaft)
  mechanical_assembly: [
    {
      id: 'piston_ring_blowby_loss',
      componentType: 'combustion_piston',
      name: 'Piston Compression Loss / Ring Blow-By',
      symptoms: ['Reduced engine power output', 'Excessive crankcase pressure / oil mist', 'Misfire on affected cylinder bank'],
      possibleCauses: ['Worn piston compression rings', 'Cylinder wall micro-scuffing', 'Thermal overheating / carbon buildup'],
      affectedConnectionTypes: ['mechanical', 'fluid', 'thermal'],
      diagnosticTests: [
        {
          testName: 'Cylinder Compression & Leak-Down Test',
          method: 'MANUAL_INSPECTION',
          instrument: 'Pneumatic Leakdown Gauge & Compression Tester',
          expectedNormal: '150-180 PSI with < 10% cylinder-to-cylinder variance and < 8% leakdown',
          expectedFault: '< 100 PSI compression or > 25% leakdown through crankcase breather',
          canDetermineFromCAD: false
        }
      ],
      distinguishingMeasurement: 'Differential pressure leak-down percentage and acoustic escape path.',
      safetyState: {
        hazardous: true,
        hazardType: 'PRESSURIZED_FLUID',
        isolationRequired: true,
        ppeRequired: ['Safety glasses', 'Mechanic gloves'],
        warning: 'High mechanical compression and hot engine oil hazard.'
      },
      repairProcedure: [
        '1. Allow engine to cool completely.',
        '2. Remove cylinder head / valvetrain assembly.',
        '3. Inspect cylinder bores for vertical scoring or taper.',
        '4. Replace piston ring pack and hone cylinder bore to specification.'
      ]
    },
    {
      id: 'crankshaft_journal_bearing_wear',
      componentType: 'crankshaft_assembly',
      name: 'Journal Bearing Hydrodynamic Lubrication Failure',
      symptoms: ['Deep metallic knocking noise synchronized with RPM', 'Drop in oil pressure at idle', 'Excessive copper/lead particles in oil analysis'],
      possibleCauses: ['Low oil level or degraded viscosity', 'Oil pump cavitation / relief valve stuck open', 'Excessive rod journal clearance'],
      affectedConnectionTypes: ['mechanical', 'fluid'],
      diagnosticTests: [
        {
          testName: 'Acoustic Vibration FFT Signature',
          method: 'ACOUSTIC_VIBRATION',
          instrument: 'Piezoelectric Accelerometer / Acoustic FFT Analyzer',
          expectedNormal: 'Harmonic peak at fundamental rotational frequency (1x RPM)',
          expectedFault: 'High amplitude transient shock pulses at rod strike frequency (2x/4x RPM)',
          canDetermineFromCAD: false
        }
      ],
      distinguishingMeasurement: 'Main / connecting rod oil clearance measured with Plastigauge (nominal: 0.025 - 0.050 mm).',
      safetyState: {
        hazardous: true,
        hazardType: 'ROTATING_MASS',
        isolationRequired: true,
        ppeRequired: ['Safety glasses', 'Gloves'],
        warning: 'Severe mechanical failure risk if operated with spun bearing.'
      },
      repairProcedure: [
        '1. Drain lubrication system and drop oil pan.',
        '2. Remove rod caps and inspect tri-metal bearing shells for copper backing exposure.',
        '3. Micrometer check journal diameters for out-of-round wear.',
        '4. Polish or regrind crankshaft journals and install matched undersize bearing shells.'
      ]
    }
  ],

  // Industrial Subrack / Enclosure (Schroff / nVent Systems)
  industrial_subrack: [
    {
      id: 'subrack_fan_tray_airflow_blockage',
      componentType: 'cooling_fan_tray',
      name: 'Fan Tray Degradation / Thermal Management Throttling',
      symptoms: ['Chassis high-temperature alarm', 'Fan tachometer error alert', 'PCB slot temperature gradient > 20°C'],
      possibleCauses: ['Air filter dust occlusion', 'Fan motor bearing dust ingress', 'Blocked exhaust perforations in 19-inch subrack'],
      affectedConnectionTypes: ['thermal', 'electrical'],
      diagnosticTests: [
        {
          testName: 'Airflow Velocity & Pressure Differential',
          method: 'NON_CONTACT_OPTICAL',
          instrument: 'Hot-Wire Anemometer & Differential Manometer',
          expectedNormal: 'Airflow velocity > 2.5 m/s across card guides; pressure drop < 15 Pa',
          expectedFault: 'Airflow velocity < 0.8 m/s with static pressure spike at intake',
          canDetermineFromCAD: false
        },
        {
          testName: 'Infrared Card Slot Temperature Scan',
          method: 'THERMAL_IMAGING',
          instrument: 'Calibrated Infrared Camera',
          expectedNormal: 'Uniform slot thermal profile < 45°C under nominal load',
          expectedFault: 'Localized thermal trapping in upper card guide slots > 70°C',
          canDetermineFromCAD: false
        }
      ],
      distinguishingMeasurement: 'Differential static pressure across subrack air filter.',
      safetyState: {
        hazardous: false,
        hazardType: 'HIGH_TEMPERATURE',
        isolationRequired: false,
        warning: 'Hot air exhaust and spinning fan blades; disconnect fan power before filter replacement.'
      },
      repairProcedure: [
        '1. Slide out hot-swappable fan tray module.',
        '2. Clean or replace reusable air filter element.',
        '3. Inspect fan tachometer pulse signal on backplane connector.',
        '4. Re-insert fan tray and verify IPMI / telemetry fan speed status.'
      ]
    },
    {
      id: 'backplane_connector_pin_oxidation',
      componentType: 'subrack_backplane',
      name: 'High-Speed Backplane Connector Contact Degradation',
      symptoms: ['Bit errors on high-speed serial bus (PCIe/VPX)', 'Intermittent card recognition on specific slot', 'Power rail voltage drop across backplane'],
      possibleCauses: ['Fretting corrosion / oxidation on gold-plated contacts', 'Misaligned guide pins during card insertion', 'Thermal cycling mechanical fatigue'],
      affectedConnectionTypes: ['electrical', 'data', 'power'],
      diagnosticTests: [
        {
          testName: 'Contact Resistance Milliohm Probing',
          method: 'MULTIMETER_ELECTRICAL',
          instrument: '4-Wire Kelvin Milliohm Meter',
          expectedNormal: 'Pin contact resistance < 20 mΩ',
          expectedFault: 'Contact resistance > 500 mΩ or intermittent open circuit under vibration',
          canDetermineFromCAD: false
        }
      ],
      distinguishingMeasurement: '4-wire Kelvin contact resistance across backplane daughtercard interface.',
      safetyState: {
        hazardous: true,
        hazardType: 'HIGH_VOLTAGE',
        isolationRequired: true,
        lockoutTagoutProcedure: ['Power down subrack mains power supply', 'Discharge power bus capacitors before inspecting backplane pins'],
        ppeRequired: ['ESD grounding wrist strap', 'Safety glasses'],
        warning: 'Risk of electrostatic discharge (ESD) and power bus short circuit.'
      },
      repairProcedure: [
        '1. De-energize subrack chassis completely and attach ESD grounding strap.',
        '2. Eject card from problematic slot.',
        '3. Inspect backplane connector pins with 10x optical loupe for bent or oxidized pins.',
        '4. Clean contacts with isopropyl alcohol (99.9%) and gold contact treatment.',
        '5. Re-seat card using ergonomic injector/ejector handles ensuring full engagement.'
      ]
    }
  ]
};

/**
 * Finds matching generic failure modes for any component based on its name, id, and archetype
 */
export function getFailureProfilesForComponent(componentId: string, componentName: string, domain?: string): ComponentFailureProfile[] {
  const cId = componentId.toLowerCase();
  const cName = componentName.toLowerCase();
  const profiles: ComponentFailureProfile[] = [];

  if (cId.includes('motor') || cId.includes('servo') || cName.includes('motor') || cName.includes('servo') || cId.includes('stepper')) {
    profiles.push(...(FAILURE_MODE_DATABASE.motor || []));
  }
  if (cId.includes('pot') || cId.includes('sensor') || cName.includes('potentiometer') || cName.includes('feedback')) {
    profiles.push(...(FAILURE_MODE_DATABASE.potentiometer || []));
  }
  if (cId.includes('mcu') || cId.includes('atmega') || cId.includes('esp32') || cId.includes('processor') || cId.includes('board') || cName.includes('board')) {
    profiles.push(...(FAILURE_MODE_DATABASE.microcontroller || []));
  }
  if (cId.includes('piston') || cId.includes('crank') || cId.includes('rod') || cId.includes('valve') || cName.includes('piston') || cName.includes('crank')) {
    profiles.push(...(FAILURE_MODE_DATABASE.mechanical_assembly || []));
  }
  if (cId.includes('subrack') || cId.includes('chassis') || cId.includes('fan') || cId.includes('backplane') || cId.includes('enclosure') || cName.includes('rack')) {
    profiles.push(...(FAILURE_MODE_DATABASE.industrial_subrack || []));
  }

  // Fallback to motor / mechanical if empty
  if (profiles.length === 0) {
    if (domain?.toUpperCase().includes('ELECTRICAL') || domain?.toUpperCase().includes('ELECTRONIC')) {
      profiles.push(...(FAILURE_MODE_DATABASE.microcontroller || []));
    } else {
      profiles.push(...(FAILURE_MODE_DATABASE.motor || []));
    }
  }

  return profiles;
}
