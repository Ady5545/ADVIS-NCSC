export interface CameraPreset {
  id: 'HERO' | 'FRONT' | 'SIDE' | 'VALLEY' | 'CYL';
  name: string;
  subtitle: string;
  description: string;
  theta: number; // Azimuthal angle (rad)
  phi: number;   // Polar angle (rad)
  radius: number; // Distance
  target: [number, number, number]; // Center lookAt
}

export type CutawayMode = 'SOLID' | 'GLASS' | 'SECTION';

export interface FiringTrackConfig {
  sequence: number[];
  banks: Record<number, 'L' | 'R'>;
  intervalDeg: number;
  firingOffsets: Record<number, number>;
}

export interface OverlayOption {
  id: 'callouts' | 'charge' | 'arrows' | 'isolate' | 'charts';
  label: string;
  description: string;
  shortcut?: string;
}

export interface ModelInspectionConfig {
  modelId: string;
  name: string;
  subtitle: string;
  cameraPresets: CameraPreset[];
  firingTrack?: FiringTrackConfig;
  availableCutawayModes: CutawayMode[];
  overlays: OverlayOption[];
  specifications: Record<string, string>;
}

export const V12_CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'HERO',
    name: 'Hero 3/4',
    subtitle: 'Isometric Overview',
    description: '3/4 isometric perspective showcasing cylinder banks, carbon intake, and exhaust geometry.',
    theta: 0.68,
    phi: 1.12,
    radius: 13.5,
    target: [0, -0.2, 0]
  },
  {
    id: 'FRONT',
    name: 'Front Drive',
    subtitle: 'Timing & Accessories',
    description: 'Direct head-on view of the front accessory drive, serpentine belt, dampers, and water pump.',
    theta: 0.0,
    phi: Math.PI / 2,
    radius: 11.2,
    target: [0, 0, 0]
  },
  {
    id: 'SIDE',
    name: 'Side Flank',
    subtitle: 'Exhaust & Block Skirt',
    description: 'Profile view of the deep-skirt aluminum block and equal-length stainless exhaust headers.',
    theta: Math.PI / 2,
    phi: Math.PI / 2,
    radius: 12.0,
    target: [0, 0, 0]
  },
  {
    id: 'VALLEY',
    name: '60° Valley',
    subtitle: 'Intake & Plenums',
    description: 'Overhead view looking into the 60° V-valley between cylinder heads at the dual carbon intake plenums.',
    theta: 0.05,
    phi: 0.38,
    radius: 9.2,
    target: [0, 0.4, 0]
  },
  {
    id: 'CYL',
    name: 'Cylinder Focus',
    subtitle: 'Reciprocating Cluster',
    description: 'Close-up macro inspection of the reciprocating forged piston assembly, wrist pins, and titanium connecting rods.',
    theta: 0.88,
    phi: 0.94,
    radius: 6.6,
    target: [-0.3, 0.2, 0.2]
  }
];

export const V12_OVERLAYS: OverlayOption[] = [
  { id: 'callouts', label: 'Callouts', description: 'Holographic 3D component identification pins', shortcut: 'L' },
  { id: 'charge', label: 'Charge Flow', description: 'Combustion flame and intake charge flow visualization', shortcut: 'C' },
  { id: 'arrows', label: 'Kinematic Vectors', description: 'Piston thrust and crankshaft torque force arrows', shortcut: 'V' },
  { id: 'isolate', label: 'Isolate', description: 'Dim surrounding assembly to highlight active component', shortcut: 'I' },
  { id: 'charts', label: 'Telemetry Charts', description: 'Real-time thermodynamic & kinematic diagram panel', shortcut: 'T' }
];

export const V12_INSPECTION_CONFIG: ModelInspectionConfig = {
  modelId: 'v12_engine',
  name: '60° V12 Naturally Aspirated Engine',
  subtitle: '6.5L DOHC 48-Valve High-Performance Powertrain',
  cameraPresets: V12_CAMERA_PRESETS,
  firingTrack: {
    sequence: [1, 12, 4, 9, 2, 11, 6, 7, 3, 10, 5, 8],
    banks: {
      1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'L',
      7: 'R', 8: 'R', 9: 'R', 10: 'R', 11: 'R', 12: 'R'
    },
    intervalDeg: 60,
    firingOffsets: {
      1: 0, 12: 60, 4: 120, 9: 180, 2: 240, 11: 300,
      6: 360, 7: 420, 3: 480, 10: 540, 5: 600, 8: 660
    }
  },
  availableCutawayModes: ['SOLID', 'GLASS', 'SECTION'],
  overlays: V12_OVERLAYS,
  specifications: {
    'Configuration': '60° V12 Naturally Aspirated',
    'Displacement': '6,498 cc (6.5 Liters)',
    'Bore x Stroke': '95.0 mm x 76.4 mm',
    'Valvetrain': 'DOHC 48-Valve with Variable Timing',
    'Compression Ratio': '11.8:1',
    'Firing Order': '1-12-4-9-2-11-6-7-3-10-5-8',
    'Max Power': '770 HP @ 8,500 RPM',
    'Max Torque': '720 Nm @ 6,750 RPM',
    'Redline': '9,000 RPM'
  }
};
