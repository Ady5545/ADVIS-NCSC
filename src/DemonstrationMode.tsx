import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  PauseCircle, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  Atom, 
  Cpu, 
  Eye, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface DemonstrationModeProps {
  onSelectMolecule: (id: string) => void;
  onSelectSpatialObject: (id: string) => void;
  onClose?: () => void;
}

interface DemoStep {
  title: string;
  subtitle: string;
  description: string;
  parameters: Record<string, string>;
  modelTarget?: { type: 'mol' | 'eng'; id: string };
}

interface DemoScript {
  id: string;
  title: string;
  category: string;
  overview: string;
  steps: DemoStep[];
}

const DEMO_SCRIPTS: DemoScript[] = [
  {
    id: 'v12_cycle',
    title: 'V12 Engine 4-Stroke Thermodynamic Cycle',
    category: 'Mechanical Kinematics',
    overview: 'High-precision mechanical sequence illustrating Intake, Compression, Power, and Exhaust strokes across 12 synchronized cylinders.',
    steps: [
      {
        title: 'Stroke 1: Intake Phase',
        subtitle: 'Induction of Stoichiometric Air-Fuel Charge',
        description: 'Intake poppet valves open as the piston descends from Top Dead Center (TDC) to Bottom Dead Center (BDC), generating a pressure depression that draws in the air-fuel mixture.',
        parameters: { 'Crankshaft Angle': '0° - 180°', 'Intake Valve': 'OPEN', 'Exhaust Valve': 'CLOSED', 'Piston Vector': 'Descending (TDC → BDC)' },
        modelTarget: { type: 'eng', id: 'v12_engine' }
      },
      {
        title: 'Stroke 2: Compression Phase',
        subtitle: 'Isentropic Pressure & Temperature Elevation',
        description: 'Both intake and exhaust valves seal tightly. The rotating crankshaft drives the connecting rod upwards, compressing the trapped gaseous volume to optimal compression ratio (approx 11:1).',
        parameters: { 'Crankshaft Angle': '180° - 360°', 'Intake Valve': 'CLOSED', 'Exhaust Valve': 'CLOSED', 'Peak Pressure': '~18-22 Bar' },
        modelTarget: { type: 'eng', id: 'v12_engine' }
      },
      {
        title: 'Stroke 3: Combustion & Power Phase',
        subtitle: 'Spark Ignition & Work Extraction',
        description: 'High-voltage spark fires near TDC. Rapid exothermic flame propagation creates immense thermal pressure (>60 Bar), driving the piston downwards with maximum kinematic torque.',
        parameters: { 'Crankshaft Angle': '360° - 540°', 'Spark Timing': '12° BTDC', 'Effective Work': 'Positive Torque Delivery', 'Piston Vector': 'Descending with Force' },
        modelTarget: { type: 'eng', id: 'v12_engine' }
      },
      {
        title: 'Stroke 4: Exhaust Phase',
        subtitle: 'Scavenging Spent Combustion Gases',
        description: 'Exhaust valves open near BDC. The ascending piston sweeps spent combustion products out through the exhaust manifold into catalytic converters.',
        parameters: { 'Crankshaft Angle': '540° - 720°', 'Intake Valve': 'CLOSED', 'Exhaust Valve': 'OPEN', 'Piston Vector': 'Ascending (BDC → TDC)' },
        modelTarget: { type: 'eng', id: 'v12_engine' }
      }
    ]
  },
  {
    id: 'heliomotion_tracking',
    title: 'HelioMotion Autonomous Dual-Axis Solar Tracking',
    category: 'Mechatronics & Photovoltaics',
    overview: 'Demonstrates active closed-loop light tracking from morning acquisition to sunset stowage.',
    steps: [
      {
        title: 'Phase 1: Sunrise Phototropic Acquisition',
        subtitle: 'East Horizon Light Gradient Detection',
        description: 'Dual LDR sensor pairs on the eastern azimuth quadrant detect higher solar irradiance. Microcontroller ADC registers differential voltage above the tracking threshold.',
        parameters: { 'Azimuth Angle': '85° (East)', 'Elevation Angle': '15°', 'Active Actuator': 'SG90 Azimuth Servo', 'Irradiance': '350 W/m²' },
        modelTarget: { type: 'eng', id: 'heliomotion' }
      },
      {
        title: 'Phase 2: Closed-Loop Solar Noon Alignment',
        subtitle: 'Zenith Peak Angle of Incidence Tracking',
        description: 'PID control loop dynamically minimizes LDR differential error. Panel achieves 90.0° perpendicular alignment to incident solar rays, maximizing power generation.',
        parameters: { 'Azimuth Angle': '180° (South)', 'Elevation Angle': '62° (Zenith)', 'Tracking Accuracy': '±1.2°', 'Efficiency Boost': '+38% vs Fixed' },
        modelTarget: { type: 'eng', id: 'heliomotion' }
      },
      {
        title: 'Phase 3: Sunset & Night Stowage Routine',
        subtitle: 'Aerodynamic Safety Repositioning',
        description: 'When total ambient irradiance drops below 50 lux, the microcontroller initiates a low-power return sweep, parking the panel at 0° flat elevation to withstand nighttime wind shears.',
        parameters: { 'Azimuth Angle': 'Reset to 90° East', 'Elevation Angle': '0° Horizontal', 'Power State': 'Sleep Standby (12mA)', 'Safety Mode': 'Wind-Stow Active' },
        modelTarget: { type: 'eng', id: 'heliomotion' }
      }
    ]
  },
  {
    id: 'vsepr_progression',
    title: 'VSEPR Electron Domain Repulsion Series',
    category: 'Theoretical Chemistry',
    overview: 'Step through molecular geometries governed by steric repulsion between bonding pairs and lone pairs.',
    steps: [
      {
        title: '2 Domains: Linear (180.0°)',
        subtitle: 'sp Hybridization — AX₂ Configuration',
        description: 'Two electron domains around a central atom repel each other to diametrically opposite positions (180° apart) to minimize Pauli steric repulsion. E.g., Carbon Dioxide (CO₂).',
        parameters: { 'Formula': 'CO₂', 'Steric Number': '2', 'Bond Angle': '180.0°', 'Geometry': 'Linear (AX₂)' },
        modelTarget: { type: 'mol', id: 'CO2' }
      },
      {
        title: '3 Domains: Trigonal Planar (120.0°)',
        subtitle: 'sp² Hybridization — AX₃ Configuration',
        description: 'Three electron domains lie in a single plane separated by 120° angles. Boron trifluoride represents a planar Lewis acid with an empty p-orbital.',
        parameters: { 'Formula': 'BF₃', 'Steric Number': '3', 'Bond Angle': '120.0°', 'Geometry': 'Trigonal Planar (AX₃)' },
        modelTarget: { type: 'mol', id: 'BF3' }
      },
      {
        title: '4 Domains: Tetrahedral (109.5°)',
        subtitle: 'sp³ Hybridization — AX₄ Configuration',
        description: 'Four equivalent bonding pairs arrange in three-dimensional space pointing toward the vertices of a regular tetrahedron at 109.5° bond angles. E.g., Methane (CH₄).',
        parameters: { 'Formula': 'CH₄', 'Steric Number': '4', 'Bond Angle': '109.5°', 'Geometry': 'Tetrahedral (AX₄)' },
        modelTarget: { type: 'mol', id: 'CH4' }
      },
      {
        title: '4 Domains with Lone Pairs: Bent (104.5°)',
        subtitle: 'sp³ Hybridization — AX₂E₂ (Lone Pair Repulsion)',
        description: 'Non-bonding lone pair electron clouds exert greater repulsive force than bonding pairs, compressing the H-O-H bond angle from 109.5° down to 104.5° in Water.',
        parameters: { 'Formula': 'H₂O', 'Steric Number': '4 (2 Bonds + 2 Lone Pairs)', 'Bond Angle': '104.5°', 'Geometry': 'Bent (AX₂E₂)' },
        modelTarget: { type: 'mol', id: 'H2O' }
      },
      {
        title: '5 Domains: Trigonal Bipyramidal (90° & 120°)',
        subtitle: 'sp³d Hybridization — AX₅ Configuration',
        description: 'Phosphorus pentachloride features 3 equatorial bonds at 120° and 2 longer axial bonds at 90° to the equatorial plane.',
        parameters: { 'Formula': 'PCl₅', 'Steric Number': '5', 'Bond Angles': '90.0° (Axial) / 120.0° (Equatorial)', 'Geometry': 'Trigonal Bipyramidal (AX₅)' },
        modelTarget: { type: 'mol', id: 'PCl5' }
      },
      {
        title: '6 Domains: Octahedral (90.0°)',
        subtitle: 'sp³d² Hybridization — AX₆ Configuration',
        description: 'Sulfur hexafluoride features 6 identical S-F bonds arranged at 90° angles pointing to the vertices of a regular octahedron, demonstrating extreme chemical stability.',
        parameters: { 'Formula': 'SF₆', 'Steric Number': '6', 'Bond Angle': '90.0°', 'Geometry': 'Octahedral (AX₆)' },
        modelTarget: { type: 'mol', id: 'SF6' }
      }
    ]
  }
];

export const DemonstrationMode: React.FC<DemonstrationModeProps> = ({
  onSelectMolecule,
  onSelectSpatialObject,
  onClose
}) => {
  const [activeScriptId, setActiveScriptId] = useState<string>('v12_cycle');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const activeScript = DEMO_SCRIPTS.find(s => s.id === activeScriptId) || DEMO_SCRIPTS[0];
  const currentStep = activeScript.steps[currentStepIndex] || activeScript.steps[0];

  // Auto-advance when playing
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev < activeScript.steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 5000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, activeScript.steps.length]);

  // When step changes, optionally project model
  
  useEffect(() => {
    handleApplyStep(currentStep);
  }, [activeScriptId, currentStepIndex]);

  const handleApplyStep = (step: DemoStep) => {
    if (step.modelTarget) {
      if (step.modelTarget.type === 'mol') {
        onSelectMolecule(step.modelTarget.id);
      } else {
        onSelectSpatialObject(step.modelTarget.id);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 font-mono text-cyan-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-cyan-500/20 pb-3">
        <div>
          <h3 className="text-cyan-400 font-bold tracking-wider text-base flex items-center gap-2">
            <PlayCircle size={20} className="text-cyan-400" />
            INTERACTIVE SCIENTIFIC DEMONSTRATION SUITE
          </h3>
          <p className="text-xs text-cyan-400/60">
            Step-by-step physical and orbital thermodynamic simulations with synchronized stage parameters.
          </p>
        </div>

        {/* Script Switcher */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1 rounded-lg border border-cyan-500/30 text-xs font-bold">
          {DEMO_SCRIPTS.map(script => (
            <button
              key={script.id}
              onClick={() => {
                setActiveScriptId(script.id);
                setCurrentStepIndex(0);
                setIsPlaying(false);
              }}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                activeScriptId === script.id
                  ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400'
                  : 'text-cyan-400/60 hover:text-cyan-200'
              }`}
            >
              {script.title.split(' ')[0]} {script.title.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Script Summary */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-cyan-500/20 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-white">{activeScript.title}</div>
          <div className="text-xs text-cyan-400/70 font-sans mt-0.5">{activeScript.overview}</div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 uppercase whitespace-nowrap">
          {activeScript.category}
        </span>
      </div>

      {/* STEP PROGRESSION BAR */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {activeScript.steps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentStepIndex(idx);
              setIsPlaying(false);
              handleApplyStep(step);
            }}
            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
              currentStepIndex === idx
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-950/60 border-cyan-500/20 text-cyan-400/60 hover:text-cyan-300'
            }`}
          >
            <div className="text-[9px] font-bold uppercase mb-0.5">Step {idx + 1}</div>
            <div className="text-[11px] font-bold truncate">{step.title.split(':')[1] || step.title}</div>
          </button>
        ))}
      </div>

      {/* ACTIVE STEP DETAILS CARD */}
      <div className="bg-slate-950/90 p-4 rounded-xl border border-cyan-500/40 space-y-4 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-cyan-500/20 pb-3">
          <div>
            <div className="text-xs font-bold text-cyan-400 tracking-widest uppercase">
              PHASE {currentStepIndex + 1} OF {activeScript.steps.length}
            </div>
            <div className="text-base font-bold text-white mt-0.5">{currentStep.title}</div>
            <div className="text-xs text-cyan-300/80 font-sans">{currentStep.subtitle}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApplyStep(currentStep)}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye size={14} />
              <span>Project into 3D Workspace</span>
            </button>
          </div>
        </div>

        {/* Step Description */}
        <p className="text-xs text-cyan-200/90 font-sans font-light leading-relaxed bg-cyan-950/20 p-3 rounded-lg border border-cyan-500/15">
          {currentStep.description}
        </p>

        {/* Realtime Parameters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {Object.entries(currentStep.parameters).map(([k, v]) => (
            <div key={k} className="bg-slate-900/80 p-2.5 rounded-lg border border-cyan-500/20">
              <div className="text-[10px] text-cyan-400/70 truncate">{k}</div>
              <div className="text-xs font-bold text-cyan-100 truncate mt-0.5">{v}</div>
            </div>
          ))}
        </div>

        {/* Interactive Playback Transport Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-cyan-500/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentStepIndex > 0) {
                  const prev = currentStepIndex - 1;
                  setCurrentStepIndex(prev);
                  handleApplyStep(activeScript.steps[prev]);
                }
              }}
              disabled={currentStepIndex === 0}
              className="p-1.5 rounded bg-slate-900 hover:bg-cyan-950 border border-cyan-500/30 disabled:opacity-30 cursor-pointer text-cyan-300"
              title="Previous Step"
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/60 text-cyan-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {isPlaying ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
              <span>{isPlaying ? 'Pause Sequence' : 'Auto Play (5s)'}</span>
            </button>
            <button
              onClick={() => {
                if (currentStepIndex < activeScript.steps.length - 1) {
                  const next = currentStepIndex + 1;
                  setCurrentStepIndex(next);
                  handleApplyStep(activeScript.steps[next]);
                }
              }}
              disabled={currentStepIndex === activeScript.steps.length - 1}
              className="p-1.5 rounded bg-slate-900 hover:bg-cyan-950 border border-cyan-500/30 disabled:opacity-30 cursor-pointer text-cyan-300"
              title="Next Step"
            >
              <SkipForward size={16} />
            </button>
          </div>

          <div className="text-xs text-cyan-400/60 font-mono">
            {currentStepIndex + 1} / {activeScript.steps.length} Steps
          </div>
        </div>

      </div>

    </div>
  );
};
