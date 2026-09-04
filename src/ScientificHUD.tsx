import React, { useState } from 'react';
import { CHEMISTRY_DATABASE } from './LearnEngine/ChemistryDatabase';
import { 
  Atom, 
  Cpu, 
  Layers, 
  Eye, 
  Sparkles, 
  RotateCw, 
  Play, 
  Maximize2, 
  Compass, 
  Video, 
  VideoOff, 
  Hand, 
  HelpCircle, 
  GraduationCap, 
  BookOpen, 
  ChevronRight, 
  X, 
  Box, 
  ShieldCheck, 
  Radio, 
  Sliders,
  Send,
  Terminal,
  CornerDownLeft
} from 'lucide-react';
import { SPATIAL_LIBRARY, ObjectMetadata, ComponentMetadata } from './SpatialLibrary';
import { HandTrackingData } from './useHandTracking';
import { SpatialMode } from './SpatialObjectEngine';
import { LearningSession } from './LearnEngine/LearnTypes';

// Scientific Educational Insights Database
const SCIENTIFIC_INSIGHTS: Record<string, { title: string; principle: string; keyPoints: string[] }> = {
  "H2O": {
    title: "WHY IS WATER BENT?",
    principle: "Oxygen has four electron domains: two bonding pairs (O-H) and two non-bonding lone pairs in an sp³ arrangement. The lone pairs exert greater electrostatic repulsion than bonding pairs, compressing the H–O–H bond angle from the ideal tetrahedral 109.5° down to 104.5°.",
    keyPoints: ["AX₂E₂ VSEPR classification", "Permanent dipole moment (1.85 D)", "Extensive hydrogen bonding capability"]
  },
  "CO2": {
    title: "WHY IS CO₂ LINEAR?",
    principle: "Carbon forms two double bonds (one σ and one π bond each) with oxygen atoms. The central carbon is sp-hybridized with two electron domains that orient 180.0° apart to minimize steric repulsion.",
    keyPoints: ["AX₂ VSEPR classification", "Zero net dipole moment (non-polar)", "180.0° bond angle with sp hybridization"]
  },
  "CH4": {
    title: "WHY IS METHANE TETRAHEDRAL?",
    principle: "Carbon promotes a 2s electron and hybridizes its one 2s and three 2p orbitals into four equivalent sp³ hybrid orbitals. Four equivalent C-H σ-bonds point toward the vertices of a regular tetrahedron at 109.5°.",
    keyPoints: ["AX₄ VSEPR classification", "Perfect 109.5° tetrahedral angle", "Symmetric non-polar covalent structure"]
  },
  "BF3": {
    title: "TRIGONAL PLANAR LEWIS ACID",
    principle: "Boron has three valence electrons forming three equivalent B-F single bonds with sp² hybridization in a flat plane (120.0° angles). Boron retains an empty unhybridized 2p orbital perpendicular to the plane, making it a strong Lewis acid.",
    keyPoints: ["AX₃ VSEPR classification", "120.0° planar bond angle", "Electron-deficient octet (6 valence electrons)"]
  },
  "NH3": {
    title: "TRIGONAL PYRAMIDAL (AX₃E)",
    principle: "Nitrogen has four electron domains (three N-H single bonds and one localized lone pair) in an sp³ geometry. The lone pair's steric repulsion compresses the N-H bond angle slightly from 109.5° down to 107.3°.",
    keyPoints: ["AX₃E VSEPR classification", "107.3° compressed bond angle", "High polarity and Lewis base reactivity"]
  },
  "C6H6": {
    title: "AROMATIC PI-RING DELOCALIZATION",
    principle: "Six sp²-hybridized carbon atoms form a planar hexagonal ring with 120° bond angles. The six remaining 2p orbitals overlap continuously above and below the ring, creating a delocalized π-electron cloud obeying Hückel's 4n+2 rule.",
    keyPoints: ["Planar 120.0° hexagonal geometry", "Equal C-C bond lengths (1.40 Å)", "Exceptional resonance stabilization energy"]
  },
  "NaCl": {
    title: "IONIC ROCK-SALT LATTICE",
    principle: "Alternating Na⁺ cations and Cl⁻ anions organize into a face-centered cubic (FCC) crystal lattice. Each ion is octahedrally coordinated by six oppositely charged neighbors (6:6 coordination), held by non-directional Coulombic attraction.",
    keyPoints: ["FCC Crystal Lattice (rock-salt)", "6:6 Octahedral coordination number", "High lattice energy and ionic melting point"]
  },
  "C2H5OH": {
    title: "PRIMARY ALIPHATIC ALCOHOL",
    principle: "Ethanol combines a non-polar ethyl hydrophobic hydrocarbon tail (sp³ carbons) with a polar, hydrophilic hydroxyl (-OH) functional group capable of donating and accepting intermolecular hydrogen bonds.",
    keyPoints: ["sp³ Carbon-Carbon backbone", "Polar -OH hydrogen bonding group", "Miscible in polar and organic solvents"]
  },
  "C6H12O6": {
    title: "PYRANOSE RING (CHAIR CONFORMATION)",
    principle: "Glucose forms a stable six-membered pyranose ring. It adopts the thermodynamically favored chair conformation, which places all bulky hydroxyl (-OH) groups in equatorial positions to minimize 1,3-diaxial steric strain.",
    keyPoints: ["Thermodynamically favored chair form", "All equatorial -OH groups in β-D-glucopyranose", "Primary metabolic energy source"]
  },
  "O2": {
    title: "PARAMAGNETIC HOMONUCLEAR DIATOMIC",
    principle: "Molecular orbital theory demonstrates that oxygen has two unpaired electrons with parallel spins in degenerate π* antibonding orbitals, accounting for its paramagnetic ground state and covalent double bond.",
    keyPoints: ["Paramagnetic triplet ground state", "Covalent double bond (O=O)", "Bond dissociation energy: 498 kJ/mol"]
  },
  "N2": {
    title: "INERT HOMONUCLEAR TRIPLE BOND",
    principle: "Two nitrogen atoms share three pairs of electrons (one σ and two π bonds) with an extremely short bond length (1.10 Å) and bond energy of 945 kJ/mol, rendering molecular nitrogen chemically inert at standard conditions.",
    keyPoints: ["Covalent triple bond (N≡N)", "Very high bond energy (945 kJ/mol)", "180.0° linear geometry"]
  },
  // Engineering Insights
  "v12_engine": {
    title: "WHY DOES THE CRANKSHAFT ROTATE?",
    principle: "Internal combustion in each cylinder generates high-pressure gas expansion, driving the piston downward. The connecting rod converts this linear reciprocating motion into continuous rotational torque through crankpins on the 60° V-bank crankshaft.",
    keyPoints: ["60° V-angle balances primary & secondary harmonics", "Firing order: 1-7-5-11-3-9-6-12-2-8-4-10", "4-stroke cycle: Intake, Compression, Power, Exhaust"]
  },
  "servo_motor": {
    title: "CLOSED-LOOP FEEDBACK CONTROL",
    principle: "A pulse-width modulated (PWM) signal sets the target angle. An internal potentiometer measures the actual output shaft position, and an error amplifier drives the DC coreless motor and gear reduction train until the error reaches zero.",
    keyPoints: ["Closed-loop potentiometer feedback", "1.0ms–2.0ms PWM pulse width mapping", "High torque multi-stage gear reduction"]
  },
  "arduino_uno": {
    title: "MICROCONTROLLER EMBEDDED SYSTEM",
    principle: "The ATmega328P microcontroller executes programmed machine instructions synchronized by a 16 MHz crystal oscillator, reading analog inputs via ADC, monitoring digital GPIO pins, and generating hardware PWM control signals.",
    keyPoints: ["16 MHz AVR 8-bit architecture", "14 Digital I/O (6 PWM) & 6 Analog Inputs", "5V TTL Logic operating voltage"]
  },
  "esp32": {
    title: "DUAL-CORE SOC & WIRELESS SYSTEM",
    principle: "Powered by dual Xtensa 32-bit LX6 cores running at up to 240 MHz, the ESP32 integrates Wi-Fi (802.11 b/g/n) and Bluetooth 4.2/BLE with dedicated hardware cryptographic acceleration and ultra-low-power co-processors.",
    keyPoints: ["Dual 32-bit Xtensa cores @ 240 MHz", "Integrated 2.4 GHz Wi-Fi & BLE 4.2", "Capacitive touch & Hall effect sensors"]
  },
  "solar_tracker": {
    title: "DUAL-AXIS SOLAR ORIENTATION",
    principle: "Dual orthogonal servo actuators continuously adjust the azimuth (horizontal) and elevation (vertical) angles of the photovoltaic panel to maintain a 90° normal angle with the solar vector, maximizing irradiance efficiency.",
    keyPoints: ["Dual-axis independent tracking", "Perpendicular solar irradiance optimization", "+35% energy generation efficiency over fixed arrays"]
  },
  "human_heart": {
    title: "ELECTROMECHANICAL CARDIAC CYCLE",
    principle: "Electrical action potentials generated by the sinoatrial (SA) node propagate through the atria and AV node to the Purkinje fibers, coordinating atrial filling followed by powerful ventricular systolic contraction.",
    keyPoints: ["4-Chamber double-circuit pump", "SA node intrinsic electrical pacemaker", "Systemic & pulmonary arterial circulation"]
  }
};

const MOLECULE_SPECS: Record<string, {
  bondAngle: string;
  vsepr: string;
  classification: string;
  hybridization: string;
}> = {
  "H2O": { bondAngle: "104.5°", vsepr: "AX₂E₂ (Bent)", classification: "Polar Covalent", hybridization: "sp³" },
  "CO2": { bondAngle: "180.0°", vsepr: "AX₂ (Linear)", classification: "Non-Polar Covalent", hybridization: "sp" },
  "CH4": { bondAngle: "109.5°", vsepr: "AX₄ (Tetrahedral)", classification: "Non-Polar Covalent", hybridization: "sp³" },
  "BF3": { bondAngle: "120.0°", vsepr: "AX₃ (Trigonal Planar)", classification: "Covalent Lewis Acid", hybridization: "sp²" },
  "NH3": { bondAngle: "107.3°", vsepr: "AX₃E (Trigonal Pyramidal)", classification: "Polar Covalent", hybridization: "sp³" },
  "C6H6": { bondAngle: "120.0°", vsepr: "Planar Ring (Aromatic)", classification: "Aromatic Covalent", hybridization: "sp²" },
  "NaCl": { bondAngle: "90.0° (Cubic)", vsepr: "FCC Lattice (Octahedral)", classification: "Ionic Lattice", hybridization: "Ionic" },
  "C2H5OH": { bondAngle: "109.5° (sp³)", vsepr: "Aliphatic Chain", classification: "Polar Organic Alcohol", hybridization: "sp³" },
  "C6H12O6": { bondAngle: "109.5° (sp³)", vsepr: "Pyranose Ring (Chair)", classification: "Hexose Carbohydrate", hybridization: "sp³" },
  "O2": { bondAngle: "180.0°", vsepr: "Diatomic (Linear)", classification: "Covalent Double Bond", hybridization: "Molecular Orbital" },
  "N2": { bondAngle: "180.0°", vsepr: "Diatomic (Linear)", classification: "Covalent Triple Bond", hybridization: "Molecular Orbital" }
};

interface ScientificHUDProps {
  activeSpatialObject: string | string[] | null;
  activeLearningSession: LearningSession | null;
  spatialMode: SpatialMode;
  onChangeSpatialMode: (mode: SpatialMode) => void;
  isExploded: boolean;
  onToggleExploded: () => void;
  xrayEnabled?: boolean;
  onToggleXray?: () => void;
  blueprintEnabled?: boolean;
  onToggleBlueprint?: () => void;
  onOpenEngineeringMode?: () => void;
  onExitSpatial: () => void;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  handTracking: HandTrackingData;
  cvEnabled: boolean;
  onToggleCv: () => void;
  onSelectMolecule: (formulaOrKey: string) => void;
  onSelectSpatialObject: (objectId: string, mode?: SpatialMode) => void;
  onStartLesson: (subject: string, intent?: string) => void;
  onOpenView: (view: 'molecules' | 'engineering' | 'learning') => void;
  presentationStep?: number;
  isolatedComponentId?: string | null;
  onToggleIsolate?: (id: string | null) => void;
  tracedFunctionKey?: string | null;
  onTraceFunction?: (key: string | null) => void;
  isKinematicPlaying?: boolean;
  onToggleKinematicPlaying?: () => void;
  kinematicSpeed?: number;
  onChangeKinematicSpeed?: (speed: number) => void;
  kinematicTimeOffset?: number;
  onChangeKinematicTimeOffset?: (offset: number) => void;
  onSendMessage?: (text: string) => void;
}

export function ScientificHUD({
  activeSpatialObject,
  activeLearningSession,
  spatialMode,
  onChangeSpatialMode,
  isExploded,
  onToggleExploded,
  xrayEnabled = false,
  onToggleXray,
  blueprintEnabled = false,
  onToggleBlueprint,
  onOpenEngineeringMode,
  onExitSpatial,
  selectedComponentId,
  onSelectComponent,
  handTracking,
  cvEnabled,
  onToggleCv,
  onSelectMolecule,
  onSelectSpatialObject,
  onStartLesson,
  onOpenView,
  presentationStep = 0,
  isolatedComponentId = null,
  onToggleIsolate,
  tracedFunctionKey = null,
  onTraceFunction,
  isKinematicPlaying = true,
  onToggleKinematicPlaying,
  kinematicSpeed = 1.0,
  onChangeKinematicSpeed,
  kinematicTimeOffset = 0,
  onChangeKinematicTimeOffset,
  onSendMessage
}: ScientificHUDProps) {

  // Derive active model details
  const isMoleculeActive = !!activeLearningSession;
  const moleculeKey = activeLearningSession?.context?.entity || null;
  const isEngineeringActive = !!activeSpatialObject && !activeLearningSession;
  const activeSpatialObjectsArray = Array.isArray(activeSpatialObject) ? activeSpatialObject : (activeSpatialObject ? [activeSpatialObject] : []);
  const engineeringDatas: ObjectMetadata[] = activeSpatialObjectsArray.map(id => SPATIAL_LIBRARY[id]).filter(Boolean);
  const activeKey = moleculeKey || activeSpatialObjectsArray[0] || null;
  const educationalInsight = activeKey ? SCIENTIFIC_INSIGHTS[activeKey] : null;
  const moleculeSpec = moleculeKey ? MOLECULE_SPECS[moleculeKey] : null;
  const moleculeData = moleculeKey ? CHEMISTRY_DATABASE[moleculeKey] : null;

  const [showControlsOnMobile, setShowControlsOnMobile] = useState(false);
  const [commandInput, setCommandInput] = useState('');

  const handleCommandSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = commandInput.trim();
    if (trimmed && onSendMessage) {
      onSendMessage(trimmed);
      setCommandInput('');
    }
  };

  const handleQuickAction = (actionText: string) => {
    if (onSendMessage) {
      onSendMessage(actionText);
    }
  };

  // Selected component metadata
  let selectedComp: ComponentMetadata | null = null;
  if (selectedComponentId) {
    for (const ed of engineeringDatas) {
      const comp = ed.components?.find(c => c.id === selectedComponentId);
      if (comp) { selectedComp = comp; break; }
    }
  }

  const hasActiveModel = isMoleculeActive || isEngineeringActive;

  if (!hasActiveModel) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-30 font-mono text-cyan-400 select-none">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP-LEFT WIDGET: ACTIVE MODEL INFORMATION PANEL
         ───────────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 pointer-events-auto flex flex-col gap-2 max-w-[320px] md:max-w-[360px] max-h-[40vh] md:max-h-[80vh] overflow-y-auto overflow-x-hidden custom-scrollbar animate-fade-in z-40">
        <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3.5 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasActiveModel ? 'bg-cyan-400 animate-ping' : 'bg-cyan-500/50'}`} />
              <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-300 uppercase">
                {isMoleculeActive ? 'MOLECULAR STRUCTURE' : isEngineeringActive ? 'ENGINEERING ASSET' : 'SPATIAL WORKSPACE'}
              </span>
            </div>
            {hasActiveModel && (
              <button
                onClick={onExitSpatial}
                className="px-2 py-0.5 rounded text-[9px] font-bold text-red-400 bg-red-950/40 border border-red-500/40 hover:bg-red-900/60 hover:text-red-200 transition-all cursor-pointer"
                title="Reset workspace"
              >
                RESET
              </button>
            )}
          </div>

          {/* ACTIVE MOLECULE INFO */}
          {isMoleculeActive && moleculeData && (
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-base md:text-lg font-bold text-white tracking-wide">{moleculeData.name}</span>
                <span className="text-xs font-bold text-cyan-300 bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-500/40">{moleculeData.formula}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-500/15">
                <div className="text-cyan-400/70">Geometry:</div>
                <div className="text-cyan-200 font-semibold text-right">{moleculeData.geometry}</div>
                
                <div className="text-cyan-400/70">Hybridization:</div>
                <div className="text-cyan-200 font-semibold text-right">{moleculeData.hybridization || moleculeSpec?.hybridization || 'sp³'}</div>
                
                <div className="text-cyan-400/70">Bond Angle:</div>
                <div className="text-amber-300 font-bold text-right" title="Literature Database Value">
                  {moleculeSpec?.bondAngle || 'N/A'} <span className="text-[8px] text-amber-500/80 uppercase ml-1 border border-amber-500/30 rounded px-0.5">LIT</span>
                </div>
                
                <div className="text-cyan-400/70">Bond Type:</div>
                <div className="text-cyan-200 font-semibold text-right">{moleculeSpec?.classification || moleculeData.bondType}</div>

                <div className="text-cyan-400/70">Valence e⁻:</div>
                <div className="text-cyan-200 font-semibold text-right">{moleculeData.valenceElectrons} e⁻</div>
              </div>
            </div>
          )}

          {/* ACTIVE ENGINEERING MODEL INFO */}
          {isEngineeringActive && engineeringDatas.length > 0 && (
            <div className="space-y-4">
              {engineeringDatas.map((engineeringData, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-base md:text-lg font-bold text-white tracking-wide truncate max-w-[220px]">{engineeringDatas[0]?.name || ''}</span>
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-500/40 uppercase">
                  {spatialMode}
                </span>
              </div>
              <div className="text-[10px] text-cyan-400/70 uppercase tracking-wider">{engineeringData.category}</div>
              
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-500/15">
                <div className="text-cyan-400/70">Subsystems:</div>
                <div className="text-cyan-200 font-semibold text-right">{engineeringData.components?.length || 0} Modules</div>

                {engineeringData.educationalInformation?.specifications && (
                  Object.entries(engineeringData.educationalInformation.specifications).slice(0, 3).map(([k, v]) => (
                    <React.Fragment key={k}>
                      <div className="text-cyan-400/70 truncate">{k}:</div>
                      <div className="text-cyan-200 font-semibold text-right truncate">{v}</div>
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>
            ))}
            </div>
          )}
          {/* IDLE / NO ACTIVE MODEL STATE */}
          {!hasActiveModel && (
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-white tracking-wide">SPATIAL WORKSPACE</span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/40">READY</span>
              </div>
              <p className="text-[10px] text-cyan-400/70 font-sans leading-relaxed">
                Holographic 3D visualization and engineering inspection system active. Select an entity from the launchpad or library.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TOP-RIGHT WIDGET: VISUALIZATION CONTROLS
         ───────────────────────────────────────────────────────────── */}
      
      {/* Mobile Menu Toggle */}
      <div className="absolute top-4 right-4 md:hidden pointer-events-auto z-50">
        <button onClick={() => setShowControlsOnMobile(!showControlsOnMobile)} className="bg-slate-900/80 p-2 rounded border border-cyan-500/40 text-cyan-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>
      <div className={`absolute top-16 right-4 md:top-6 md:right-6 pointer-events-auto flex flex-col gap-2 max-w-[280px] md:max-w-[320px] max-h-[40vh] md:max-h-[80vh] overflow-y-auto overflow-x-hidden custom-scrollbar animate-fade-in transition-all z-40 ${showControlsOnMobile ? 'flex' : 'hidden md:flex'}`}>
        <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3.5 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Sliders size={12} className="text-cyan-400" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-300 uppercase">
                {isEngineeringActive ? 'KINEMATICS MODE' : isMoleculeActive ? 'LESSON PHASES' : 'QUICK LAUNCH'}
              </span>
            </div>
          </div>

          {/* ENGINEERING CONTROLS */}
          {isEngineeringActive && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold uppercase">
                <button
                  onClick={() => onChangeSpatialMode('INSPECTION')}
                  className={`px-2.5 py-1.5 rounded border transition-all text-left flex items-center justify-between cursor-pointer ${
                    spatialMode === 'INSPECTION'
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'border-cyan-500/20 bg-slate-900/50 hover:bg-cyan-950/40 text-cyan-400/80'
                  }`}
                >
                  <span>Inspect Part</span>
                  {spatialMode === 'INSPECTION' && <span className="text-[8px] text-cyan-300">✓</span>}
                </button>

                <button
                  onClick={() => onChangeSpatialMode('SHOWCASE')}
                  className={`px-2.5 py-1.5 rounded border transition-all text-left flex items-center justify-between cursor-pointer ${
                    spatialMode === 'SHOWCASE'
                      ? 'bg-emerald-500/30 border-emerald-400 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'border-cyan-500/20 bg-slate-900/50 hover:bg-cyan-950/40 text-cyan-400/80'
                  }`}
                >
                  <span>3D Showcase</span>
                  {spatialMode === 'SHOWCASE' && <span className="text-[8px] text-emerald-300">Auto</span>}
                </button>

                <button
                  onClick={() => onChangeSpatialMode('EXPLODED')}
                  className={`px-2.5 py-1.5 rounded border transition-all text-left flex items-center justify-between cursor-pointer ${
                    spatialMode === 'EXPLODED'
                      ? 'bg-purple-500/30 border-purple-400 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                      : 'border-cyan-500/20 bg-slate-900/50 hover:bg-cyan-950/40 text-cyan-400/80'
                  }`}
                >
                  <span>Exploded View</span>
                  {spatialMode === 'EXPLODED' && <span className="text-[8px] text-purple-300">Parts</span>}
                </button>

                <button
                  onClick={() => onChangeSpatialMode('DEMO')}
                  className={`px-2.5 py-1.5 rounded border transition-all text-left flex items-center justify-between cursor-pointer ${
                    spatialMode === 'DEMO'
                      ? 'bg-amber-500/30 border-amber-400 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : 'border-cyan-500/20 bg-slate-900/50 hover:bg-cyan-950/40 text-cyan-400/80'
                  }`}
                >
                  <span>Guided Demo</span>
                  {spatialMode === 'DEMO' && <span className="text-[8px] text-amber-300">Demo</span>}
                </button>
              </div>

              {onOpenEngineeringMode && (
                <button
                  onClick={onOpenEngineeringMode}
                  className="w-full py-1.5 px-3 rounded border border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-200 text-[10px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                >
                  <Cpu size={12} />
                  <span>Open CAD Workstation</span>
                </button>
              )}
            </div>
          )}

          {/* MOLECULE CONTROLS */}
          {isMoleculeActive && activeLearningSession && (
            <div className="space-y-2">
              <div className="text-[9px] text-cyan-400/70 font-semibold uppercase">
                Step {activeLearningSession.currentStepIndex + 1} of {activeLearningSession.steps.length}
              </div>
              <div className="text-xs font-bold text-cyan-200 truncate">
                {activeLearningSession.steps[activeLearningSession.currentStepIndex]?.title}
              </div>
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={() => {
                    const e = new CustomEvent('ADVIS_LEARN_REPLAY_STEP');
                    window.dispatchEvent(e);
                  }}
                  className="flex-1 py-1 px-2 rounded border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/50 text-[10px] text-cyan-300 font-bold uppercase transition-all cursor-pointer text-center"
                >
                  Replay
                </button>
                <button
                  onClick={onExitSpatial}
                  className="flex-1 py-1 px-2 rounded border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/50 text-[10px] text-cyan-300 font-bold uppercase transition-all cursor-pointer text-center"
                >
                  Exit Lesson
                </button>
              </div>
            </div>
          )}

          {/* IDLE QUICK LAUNCH BUTTONS */}
          {!hasActiveModel && (
            <div className="space-y-1.5">
              <div className="text-[9px] text-cyan-400/60 uppercase font-semibold">Immediate Projections:</div>
              <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold">
                <button
                  onClick={() => onSelectMolecule('H2O')}
                  className="py-1 px-2 rounded border border-cyan-500/30 bg-slate-900/60 hover:bg-cyan-950/60 hover:border-cyan-400 text-cyan-200 transition-all cursor-pointer text-left truncate"
                >
                  ⚡ Water (H₂O)
                </button>
                <button
                  onClick={() => onSelectMolecule('CO2')}
                  className="py-1 px-2 rounded border border-cyan-500/30 bg-slate-900/60 hover:bg-cyan-950/60 hover:border-cyan-400 text-cyan-200 transition-all cursor-pointer text-left truncate"
                >
                  ⚡ Carbon (CO₂)
                </button>
                <button
                  onClick={() => onSelectSpatialObject('v12_engine', 'INSPECTION')}
                  className="py-1 px-2 rounded border border-cyan-500/30 bg-slate-900/60 hover:bg-cyan-950/60 hover:border-cyan-400 text-cyan-200 transition-all cursor-pointer text-left truncate"
                >
                  ⚡ V12 Engine
                </button>
                <button
                  onClick={() => onSelectSpatialObject('servo_motor', 'INSPECTION')}
                  className="py-1 px-2 rounded border border-cyan-500/30 bg-slate-900/60 hover:bg-cyan-950/60 hover:border-cyan-400 text-cyan-200 transition-all cursor-pointer text-left truncate"
                >
                  ⚡ Servo Motor
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. BOTTOM-LEFT WIDGET: CONTEXTUAL EDUCATIONAL INSIGHT
         ───────────────────────────────────────────────────────────── */}
      <div className={`absolute bottom-24 left-4 md:bottom-28 md:left-6 pointer-events-auto flex flex-col gap-2 max-w-[320px] md:max-w-[380px] max-h-[35vh] overflow-y-auto overflow-x-hidden custom-scrollbar animate-fade-in z-40 ${showControlsOnMobile ? 'flex' : 'hidden md:flex'}`}>
        <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3.5 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-2 mb-2">
            <BookOpen size={13} className="text-amber-400" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-amber-300 uppercase">
              {'SCIENTIFIC PRINCIPLES'}
            </span>
          </div>

          {educationalInsight ? (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-white">{educationalInsight.title}</div>
              <p className="text-[11px] text-cyan-200/90 font-sans font-light leading-relaxed">
                {educationalInsight.principle}
              </p>
              {educationalInsight.keyPoints && educationalInsight.keyPoints.length > 0 && (
                <div className="space-y-0.5 pt-1">
                  {educationalInsight.keyPoints.map((pt: string, idx: number) => (
                    <div key={idx} className="text-[10px] text-cyan-300 flex items-start gap-1">
                      <span className="text-amber-400">•</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[11px] text-cyan-200/80 font-sans font-light leading-relaxed">
                ADVIS renders real 3D molecular orbital geometries, VSEPR angles, and multi-component mechanical assemblies.
              </p>
              <p className="text-[10px] text-cyan-400/60 font-mono">
                Select any entity from the libraries or use voice commands to begin.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. BOTTOM-RIGHT WIDGET: INTERACTION / GESTURE STATUS OR COMPONENT INSPECTION
         ───────────────────────────────────────────────────────────── */}
      <div className={`absolute bottom-24 right-4 md:bottom-28 md:right-6 pointer-events-auto flex flex-col gap-2 max-w-[300px] md:max-w-[340px] max-h-[35vh] overflow-y-auto overflow-x-hidden custom-scrollbar animate-fade-in z-40 ${showControlsOnMobile ? 'flex' : 'hidden md:flex'}`}>
        
        {/* COMPONENT INSPECTION CARD (When a component is selected) */}
        {selectedComp ? (
          <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-400/40 rounded-xl p-3.5 shadow-[0_0_30px_rgba(6,182,212,0.25)]">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-300 uppercase">COMPONENT INSPECTION</span>
              </div>
              <button
                onClick={() => onSelectComponent(null)}
                className="text-cyan-400/60 hover:text-cyan-200 text-xs px-1.5 py-0.5 rounded border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer"
                title="Deselect"
              >
                ✕
              </button>
            </div>

            <div className="text-white font-bold text-sm tracking-wide mb-1">
              {selectedComp?.name}
            </div>
            <div className="text-[10px] text-cyan-300/80 font-sans font-light leading-relaxed mb-2 line-clamp-3">
              {selectedComp?.description}
            </div>

            <div className="bg-cyan-950/30 rounded-lg p-2 border border-cyan-500/20 text-[9px] space-y-1 mb-2">
              <div className="flex justify-between">
                <span className="text-cyan-400/70">Shape:</span>
                <span className="text-cyan-200 font-bold uppercase">{selectedComp?.shape}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400/70">Position:</span>
                <span className="text-cyan-200 font-bold">[{selectedComp?.position.map(n => n.toFixed(1)).join(', ')}]</span>
              </div>
            </div>

            <div className="flex gap-1.5 mb-2">
              {onToggleIsolate && (
                <button
                  onClick={() => onToggleIsolate(isolatedComponentId === selectedComp?.id ? null : (selectedComp?.id || null))}
                  className={`flex-1 py-1 px-2 border rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isolatedComponentId === selectedComp?.id
                      ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      : 'bg-cyan-950/50 hover:bg-cyan-900/60 border-cyan-500/40 text-cyan-200'
                  }`}
                >
                  {isolatedComponentId === selectedComp?.id ? 'Exit Isolation' : '🔍 Isolate Part'}
                </button>
              )}
              <button
                onClick={() => onSelectComponent(null)}
                className="py-1 px-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
              >
                Deselect
              </button>
            </div>

            {/* Function Flow Trace Triggers */}
            {onTraceFunction && (
              <div className="border-t border-cyan-500/20 pt-2">
                <div className="text-[8px] text-cyan-400/70 uppercase font-bold mb-1">Trace Function (See how energy/motion flows):</div>
                <div className="flex flex-wrap gap-1">
                  {['combustion', 'fuel', 'cooling', 'crankshaft', 'gears', 'feedback', 'power', 'mcu'].map((funcKey) => (
                    <button
                      key={funcKey}
                      onClick={() => onTraceFunction(tracedFunctionKey === funcKey ? null : funcKey)}
                      className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                        tracedFunctionKey === funcKey
                          ? 'bg-amber-500/40 border-amber-400 text-amber-100 font-bold'
                          : 'bg-slate-900/60 border-cyan-500/20 text-cyan-400/70 hover:text-cyan-200'
                      }`}
                    >
                      {funcKey}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* GESTURE CONTROL & TRACKING STATUS (When no component is selected) */
          <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3.5 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Hand size={13} className="text-cyan-400" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-300 uppercase">GESTURE CONTROL</span>
              </div>
              <button
                onClick={onToggleCv}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                  cvEnabled 
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' 
                    : 'bg-slate-900/50 border-cyan-500/20 text-cyan-500/60 hover:text-cyan-300'
                }`}
                title="Toggle camera tracking"
              >
                {cvEnabled ? <Video size={10} className="text-cyan-300" /> : <VideoOff size={10} />}
                <span>{cvEnabled ? 'CAMERA ON' : 'CAMERA OFF'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/15 mb-2">
              <div className="text-cyan-400/70">Tracking:</div>
              <div className={`font-semibold text-right ${cvEnabled && handTracking.state === 'TRACKING' ? 'text-emerald-400' : 'text-cyan-400/60'}`}>
                {cvEnabled ? (handTracking.state === 'TRACKING' ? 'LOCKED' : 'SEARCHING') : 'STANDBY'}
              </div>

              <div className="text-cyan-400/70">Gesture:</div>
              <div className="text-cyan-200 font-bold text-right truncate">
                {cvEnabled ? (handTracking.gesture || 'NONE') : 'N/A'}
              </div>
            </div>

                        <div className="text-[9px] text-cyan-400/60 space-y-0.5 border-t border-cyan-500/10 pt-1.5">
              <div className="flex justify-between">
                <span>1-Hand Pinch:</span>
                <span className="text-cyan-300">Manipulate</span>
              </div>
              <div className="flex justify-between">
                <span>2-Hand Pinch:</span>
                <span className="text-cyan-300">Zoom / Scale</span>
              </div>
              <div className="flex justify-between">
                <span>Open Palm:</span>
                <span className="text-cyan-300">Rotate / Orbit</span>
              </div>
              <div className="flex justify-between">
                <span>Clap:</span>
                <span className="text-cyan-300">Reset Workspace</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. BOTTOM-CENTER: WORKSTATION COMMAND BAR & KINEMATIC TIMELINE
         ───────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto z-30 flex flex-col gap-2 items-center w-full max-w-xl px-4">
        {/* Contextual Command Bar */}
        {onSendMessage && (
          <div className="w-full bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-2 shadow-[0_0_30px_rgba(6,182,212,0.25)] flex flex-col gap-1.5 transition-all">
            {/* Quick Contextual Action Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[9px] font-mono">
              <span className="text-cyan-400/60 font-bold uppercase tracking-wider pl-1 flex items-center gap-1">
                <Sparkles size={10} className="text-cyan-400 animate-pulse" />
                <span>Actions:</span>
              </span>
              {selectedComp ? (
                <>
                  <button
                    onClick={() => handleQuickAction(`Isolate ${selectedComp.name}`)}
                    className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-full whitespace-nowrap transition-all cursor-pointer font-semibold"
                  >
                    🔍 Isolate {selectedComp.name.split(' ')[0]}
                  </button>
                  <button
                    onClick={() => handleQuickAction(`What does ${selectedComp.name} do?`)}
                    className="px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-500/30 rounded-full whitespace-nowrap transition-all cursor-pointer"
                  >
                    ℹ️ Explain Part
                  </button>
                  <button
                    onClick={() => handleQuickAction(`Make ${selectedComp.name} larger`)}
                    className="px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-500/30 rounded-full whitespace-nowrap transition-all cursor-pointer"
                  >
                    ⚡ Scale Part
                  </button>
                </>
              ) : hasActiveModel ? (
                <>
                  <button
                    onClick={() => handleQuickAction(isExploded ? "Assemble model" : "Explode model")}
                    className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 rounded-full whitespace-nowrap transition-all cursor-pointer font-semibold"
                  >
                    {isExploded ? "🧩 Assemble" : "💥 Explode View"}
                  </button>
                  <button
                    onClick={() => handleQuickAction("Explain overall architecture")}
                    className="px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 rounded-full whitespace-nowrap transition-all cursor-pointer"
                  >
                    🔬 Overview
                  </button>
                  <button
                    onClick={() => handleQuickAction("Build a bicycle")}
                    className="px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400/80 border border-cyan-500/20 rounded-full whitespace-nowrap transition-all cursor-pointer"
                  >
                    🚲 Build Bicycle
                  </button>
                  <button
                    onClick={() => handleQuickAction("Build an Oxford shoe")}
                    className="px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400/80 border border-cyan-500/20 rounded-full whitespace-nowrap transition-all cursor-pointer"
                  >
                    👞 Build Oxford Shoe
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleQuickAction("Build a smartphone")}
                    className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 rounded-full whitespace-nowrap transition-all cursor-pointer"
                  >
                    📱 Smartphone
                  </button>
                  <button
                    onClick={() => handleQuickAction("Build a laptop")}
                    className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 rounded-full whitespace-nowrap transition-all cursor-pointer"
                  >
                    💻 Laptop
                  </button>
                  <button
                    onClick={() => handleQuickAction("Build a bicycle")}
                    className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 rounded-full whitespace-nowrap transition-all cursor-pointer"
                  >
                    🚲 Bicycle
                  </button>
                  <button
                    onClick={() => handleQuickAction("Build a transformer")}
                    className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 rounded-full whitespace-nowrap transition-all cursor-pointer"
                  >
                    ⚡ Transformer
                  </button>
                </>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 bg-slate-900/80 border border-cyan-500/30 rounded-xl px-3 py-1.5 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
              <Terminal size={14} className="text-cyan-400/70 shrink-0" />
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder={
                  selectedComp
                    ? `Command for ${selectedComp.name} (e.g. "Isolate part", "Make larger")...`
                    : hasActiveModel
                    ? `Command (e.g. "Build a drone", "Explode", "Explain structure")...`
                    : `Enter command (e.g. "Build a laptop", "Build a bicycle", "Teach water")...`
                }
                className="flex-1 bg-transparent text-cyan-200 placeholder-cyan-500/50 text-xs font-mono outline-none border-none"
              />
              <button
                type="submit"
                disabled={!commandInput.trim()}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                  commandInput.trim()
                    ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : 'bg-cyan-950/40 text-cyan-500/40 cursor-not-allowed'
                }`}
                title="Send Command (Enter)"
              >
                <Send size={12} />
              </button>
            </form>
          </div>
        )}

        {/* Center Bottom: Toolbar & Timeline */}
        {hasActiveModel && (
          <div className="flex flex-col gap-1.5 items-center">
            {engineeringDatas[0]?.animations && engineeringDatas[0].animations.length > 0 && (
              <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.15)] font-mono text-[9px] flex items-center gap-3 min-w-[280px]">
                <span className="text-cyan-400/80 font-bold w-12 text-right">0°</span>
                <input 
                  type="range" 
                  min="0" 
                  max="720" 
                  step="1"
                  value={kinematicTimeOffset}
                  onChange={(e) => {
                    if (isKinematicPlaying && onToggleKinematicPlaying) {
                      onToggleKinematicPlaying();
                    }
                    if (onChangeKinematicTimeOffset) {
                      onChangeKinematicTimeOffset(parseFloat(e.target.value));
                    }
                  }}
                  className="flex-1 accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded-full appearance-none outline-none"
                  style={{ WebkitAppearance: 'none' }}
                />
                <span className="text-cyan-400/80 font-bold w-12">720°</span>
                <button 
                  onClick={() => onChangeKinematicTimeOffset && onChangeKinematicTimeOffset(0)}
                  className="ml-1 text-[8px] bg-cyan-900/50 hover:bg-cyan-800 text-cyan-200 px-1.5 py-0.5 rounded border border-cyan-500/30"
                  title="Reset to Reference"
                >
                  RST
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 px-3.5 py-1.5 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.2)] font-mono text-xs">
              {onToggleKinematicPlaying && (
                <button
                  onClick={onToggleKinematicPlaying}
                  className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-100 text-[9px] font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>{isKinematicPlaying ? '⏸ PAUSE' : '▶ PLAY'}</span>
                </button>
              )}

              {onChangeKinematicSpeed && (
                <div className="flex items-center gap-1 border-l border-cyan-500/30 pl-2">
                  <span className="text-[9px] text-cyan-400/60 font-bold uppercase">Speed:</span>
                  {[0.25, 0.5, 1.0, 2.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => onChangeKinematicSpeed(s)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                        kinematicSpeed === s
                          ? 'bg-cyan-400 text-black border-cyan-300 font-extrabold shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                          : 'bg-slate-900/60 border-cyan-500/20 text-cyan-400/70 hover:text-cyan-200'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}

              {onToggleBlueprint && (
                <button
                  onClick={onToggleBlueprint}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ml-1 ${
                    blueprintEnabled
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100'
                      : 'bg-slate-900/50 border-cyan-500/20 text-cyan-400/60 hover:text-cyan-200'
                  }`}
                >
                  📐 Blueprint
                </button>
              )}

              {onToggleXray && (
                <button
                  onClick={onToggleXray}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                    xrayEnabled
                      ? 'bg-purple-500/30 border-purple-400 text-purple-100'
                      : 'bg-slate-900/50 border-cyan-500/20 text-cyan-400/60 hover:text-cyan-200'
                  }`}
                >
                  ☢ X-Ray
                </button>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
