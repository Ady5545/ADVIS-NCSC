import React, { useState, useEffect } from 'react';
import { 
  X, 
  Atom, 
  Cpu, 
  GraduationCap, 
  Hand, 
  Activity, 
  Settings2, 
  Play, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  Layers, 
  Sliders,
  GitCompare,
  PlayCircle,
  Wrench,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './App';
import { CHEMISTRY_DATABASE, ChemicalEntity } from './LearnEngine/ChemistryDatabase';
import { SPATIAL_LIBRARY, ObjectMetadata } from './SpatialLibrary';
import { HandTrackingData } from './useHandTracking';
import { LearningSession } from './LearnEngine/LearnTypes';
import { ScientificComparator } from './ScientificComparator';
import { DemonstrationMode } from './DemonstrationMode';

export function ViewModal({ 
  currentView, 
  setView, 
  messages, 
  hologramIntensity = 1, 
  setHologramIntensity, 
  soundEnabled = true, 
  setSoundEnabled, 
  themeColor, 
  setThemeColor, 
  speechRate = 1.05, 
  setSpeechRate,
  strictSecurity = false,
  setStrictSecurity,
  triggerBarnDoor,
  triggerCleanSlate,
  cvEnabled,
  setCvEnabled,
  onSelectMolecule,
  onLoadMoleculeBuilder,
  onSelectSpatialObject,
  onStartLesson,
  handTracking,
  activeSpatialObject,
  activeLearningSession,
  spatialMode = 'INSPECTION',
  isExploded = false,
  selectedComponentId = null
}: { 
  currentView: string, 
  setView: (id: string) => void, 
  messages: ChatMessage[], 
  hologramIntensity?: number, 
  setHologramIntensity?: (val: number) => void, 
  soundEnabled?: boolean, 
  setSoundEnabled?: (val: boolean) => void, 
  themeColor?: string, 
  setThemeColor?: (val: string) => void, 
  speechRate?: number, 
  setSpeechRate?: (val: number) => void,
  strictSecurity?: boolean,
  setStrictSecurity?: (val: boolean) => void,
  triggerBarnDoor?: () => void,
  triggerCleanSlate?: () => void,
  cvEnabled?: boolean,
  setCvEnabled?: (val: boolean) => void,
  onSelectMolecule?: (formulaOrKey: string) => void,
  onLoadMoleculeBuilder?: (formulaOrKey: string) => void,
  onSelectSpatialObject?: (objectId: string, mode?: 'INSPECTION' | 'EXPLODED') => void,
  onStartLesson?: (subject: string, intent?: string) => void,
  handTracking?: HandTrackingData,
  activeSpatialObject?: string | string[] | null,
  activeLearningSession?: LearningSession | null,
  spatialMode?: string,
  isExploded?: boolean,
  selectedComponentId?: string | null
}) {
  const [perfTime, setPerfTime] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedGeometry, setSelectedGeometry] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTabPerCard, setActiveTabPerCard] = useState<Record<string, 'structure' | 'operation' | 'analysis'>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setPerfTime(performance.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (currentView === 'home') return null;

  const renderContent = () => {
    switch (currentView) {
      case 'molecules': {
        const categories = [
          'ALL', 
          'VSEPR Reference', 
          'Inorganic Hydrides', 
          'Organic / Aliphatic', 
          'Aromatic', 
          'Biomolecules', 
          'Polyatomic Ions', 
          'Expanded Octet', 
          'Diatomic Elements'
        ];
        
        const molecules = Object.entries(CHEMISTRY_DATABASE).filter(([key, item]) => {
          if (selectedCategory !== 'ALL') {
            if (selectedCategory === 'VSEPR Reference' && !['H2O', 'CO2', 'CH4', 'BF3', 'NH3', 'SF6', 'PCl5'].includes(key)) return false;
            if (selectedCategory === 'Inorganic Hydrides' && !['H2O', 'NH3', 'H2S'].includes(key)) return false;
            if (selectedCategory === 'Organic / Aliphatic' && !['CH4', 'C2H4', 'C2H2', 'C2H5OH'].includes(key)) return false;
            if (selectedCategory === 'Aromatic' && key !== 'C6H6') return false;
            if (selectedCategory === 'Biomolecules' && key !== 'C6H12O6') return false;
            if (selectedCategory === 'Polyatomic Ions' && !['NH4+', 'H3O+'].includes(key)) return false;
            if (selectedCategory === 'Expanded Octet' && !['SF6', 'PCl5'].includes(key)) return false;
            if (selectedCategory === 'Diatomic Elements' && !['O2', 'N2'].includes(key)) return false;
          }
          if (selectedGeometry !== 'ALL' && item.geometry !== selectedGeometry) return false;
          const matchQuery = searchQuery === '' || 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.geometry.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.hybridization && item.hybridization.toLowerCase().includes(searchQuery.toLowerCase()));
          return matchQuery;
        });

        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-cyan-500/20 pb-3">
              <div>
                <h3 className="text-cyan-400 font-bold tracking-wider text-base flex items-center gap-2">
                  <Atom size={20} className="text-cyan-400" />
                  INTERACTIVE MOLECULAR REFERENCE SYSTEM
                </h3>
                <p className="text-xs text-cyan-400/60 font-mono">
                  Verified chemical specifications, 3D VSEPR configurations, Lewis structures, and hybridization.
                </p>
              </div>
              <input
                type="text"
                placeholder="Search formula or name (e.g. H2O, SF6, Benzene)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 bg-black/60 border border-cyan-500/30 rounded text-xs font-mono text-cyan-200 placeholder:text-cyan-600 focus:outline-none focus:border-cyan-400 w-full md:w-72"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded text-xs font-mono whitespace-nowrap transition-all border cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold' 
                      : 'bg-black/40 text-cyan-500/60 border-cyan-500/20 hover:text-cyan-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 overflow-y-auto max-h-[60vh] pr-1 custom-scrollbar">
              {molecules.map(([key, item]) => {
                return (
                  <div 
                    key={key} 
                    className="bg-black/60 p-4 rounded-xl border border-cyan-500/30 hover:border-cyan-400/80 transition-all flex flex-col justify-between group hover:bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.05)]"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex justify-between items-start mb-2.5">
                        <div>
                          <div className="text-cyan-100 font-bold font-mono text-sm group-hover:text-cyan-200 transition-colors">
                            {item.name}
                          </div>
                          <div className="text-xs font-mono text-cyan-400 font-bold tracking-wider">
                            {item.formula}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                          {item.hybridization || 'sp³'}
                        </span>
                      </div>
                      
                      {/* Scientific Metrics Table */}
                      <div className="space-y-1 my-2.5 text-[11px] font-mono bg-slate-950/80 p-2.5 rounded-lg border border-cyan-500/15">
                        <div className="flex justify-between text-cyan-400/70">
                          <span>VSEPR Geometry:</span>
                          <span className="text-cyan-200 font-bold">{item.geometry}</span>
                        </div>
                        <div className="flex justify-between text-cyan-400/70">
                          <span>Bond Angle:</span>
                          <span className="text-cyan-200 font-bold">{item.bondAngles?.[0] || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-cyan-400/70">
                          <span>Valence Electrons:</span>
                          <span className="text-cyan-200 font-bold">{item.valenceElectrons} e⁻</span>
                        </div>
                        <div className="flex justify-between text-cyan-400/70">
                          <span>Lone Pairs:</span>
                          <span className="text-cyan-200 font-bold">{item.lonePairs ?? 0}</span>
                        </div>
                        <div className="flex justify-between text-cyan-400/70">
                          <span>Net Polarity:</span>
                          <span className="text-cyan-200 font-bold">
                            {item.dipoleMoment !== undefined && parseFloat(item.dipoleMoment as any) > 0 ? `Polar (${item.dipoleMoment} D)` : 'Non-Polar'}
                          </span>
                        </div>
                      </div>

                      {/* Lewis Structure Preview */}
                      {item.lewisStructure && (
                        <div className="my-2 p-2 rounded bg-cyan-950/30 border border-cyan-500/20 text-[10px] font-mono">
                          <span className="text-cyan-400/60 block mb-0.5">Lewis Representation:</span>
                          <span className="text-cyan-200 font-bold block truncate">{typeof item.lewisStructure === 'string' ? item.lewisStructure : (item.lewisStructure?.diagram || item.lewisStructure?.description || "Available")}</span>
                        </div>
                      )}
                      
                      <p className="text-[11px] text-cyan-300/80 font-sans leading-relaxed line-clamp-3 mb-3">
                        {item.description}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-cyan-500/20">
                      <button
                        onClick={() => {
                          if (onSelectMolecule) onSelectMolecule(item.formula || key);
                          setView('home');
                        }}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-100 text-xs font-mono rounded border border-cyan-400/50 hover:border-cyan-300 transition-all font-bold cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Inspect 3D</span>
                      </button>
                      <button
                        onClick={() => {
                          if (onLoadMoleculeBuilder) onLoadMoleculeBuilder(item.formula || key);
                          setView('home');
                        }}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 hover:bg-cyan-950 text-cyan-300 text-xs font-mono rounded border border-cyan-500/30 hover:border-cyan-400 transition-all font-medium cursor-pointer"
                      >
                        <Wrench size={13} />
                        <span>In Builder</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'engineering': {
        const models = Object.entries(SPATIAL_LIBRARY).filter(([id, model]) => {
          if (selectedCategory !== 'ALL' && model.category !== selectedCategory) return false;
          if (searchQuery && !model.name.toLowerCase().includes(searchQuery.toLowerCase()) && !model.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          return true;
        });

        const categories = ['ALL', 'Robotics & Control', 'Mechanical Engineering', 'Electronics & IoT', 'Sensors & Automation', 'Aeronautics', 'Biological Systems'];

        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-cyan-500/20 pb-3">
              <div>
                <h3 className="text-cyan-400 font-bold tracking-wider text-base flex items-center gap-2">
                  <Cpu size={20} className="text-cyan-400" />
                  ENGINEERING INSPECTION SYSTEM
                </h3>
                <p className="text-xs text-cyan-400/60 font-mono">
                  Kinematic mechanical assemblies, robotics, and embedded systems with exploded structural hierarchy.
                </p>
              </div>
              <input
                type="text"
                placeholder="Search models (e.g. V12 Engine, Arduino, Servo)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 bg-black/60 border border-cyan-500/30 rounded text-xs font-mono text-cyan-200 placeholder:text-cyan-600 focus:outline-none focus:border-cyan-400 w-full md:w-72"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded text-xs font-mono whitespace-nowrap transition-all border cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold' 
                      : 'bg-black/40 text-cyan-500/60 border-cyan-500/20 hover:text-cyan-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 overflow-y-auto max-h-[60vh] pr-1 custom-scrollbar">
              {models.map(([id, model]) => {
                const cardTab = activeTabPerCard[id] || 'structure';
                const specs = model.educationalInformation?.specifications || {};
                const specEntries = Object.entries(specs);

                return (
                  <div 
                    key={id} 
                    className="bg-black/60 p-4 rounded-xl border border-cyan-500/30 hover:border-cyan-400/80 transition-all flex flex-col justify-between group hover:bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.05)]"
                  >
                    <div>
                      {/* Title Header */}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-cyan-100 font-bold font-mono text-sm group-hover:text-cyan-200 transition-colors">
                            {model.name}
                          </div>
                          <div className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-wider font-bold">
                            {model.category}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                          {model.components?.length || 1} Parts
                        </span>
                      </div>

                      {/* Subsystem mini tabs */}
                      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-cyan-500/20 text-[9px] font-bold mb-2.5">
                        <button
                          onClick={() => setActiveTabPerCard(prev => ({ ...prev, [id]: 'structure' }))}
                          className={`py-0.5 rounded text-center cursor-pointer transition-all ${
                            cardTab === 'structure' ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/60' : 'text-cyan-400/60'
                          }`}
                        >
                          Hierarchy
                        </button>
                        <button
                          onClick={() => setActiveTabPerCard(prev => ({ ...prev, [id]: 'operation' }))}
                          className={`py-0.5 rounded text-center cursor-pointer transition-all ${
                            cardTab === 'operation' ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/60' : 'text-cyan-400/60'
                          }`}
                        >
                          Operation
                        </button>
                        <button
                          onClick={() => setActiveTabPerCard(prev => ({ ...prev, [id]: 'analysis' }))}
                          className={`py-0.5 rounded text-center cursor-pointer transition-all ${
                            cardTab === 'analysis' ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/60' : 'text-cyan-400/60'
                          }`}
                        >
                          Specs
                        </button>
                      </div>

                      {/* Tab Content */}
                      {cardTab === 'structure' && (
                        <div className="space-y-1 my-2 text-[10px] font-mono bg-slate-950/80 p-2 rounded border border-cyan-500/10 min-h-[90px]">
                          <div className="text-[9px] text-cyan-400/60 uppercase font-bold mb-1">Assembly Hierarchy:</div>
                          {model.components?.slice(0, 3).map((c, i) => (
                            <div key={i} className="truncate flex items-center justify-between text-cyan-200">
                              <span>• {c.name}</span>
                              <span className="text-cyan-400/60 text-[9px]">[{c.shape}]</span>
                            </div>
                          ))}
                          {(model.components?.length || 0) > 3 && (
                            <div className="text-cyan-400/50 text-[9px] pt-0.5">
                              +{(model.components?.length || 0) - 3} additional sub-elements
                            </div>
                          )}
                        </div>
                      )}

                      {cardTab === 'operation' && (
                        <div className="my-2 p-2 rounded bg-slate-950/80 border border-cyan-500/10 min-h-[90px]">
                          <p className="text-[11px] text-cyan-300/80 font-sans leading-relaxed line-clamp-4">
                            {model.educationalInformation?.workingPrinciple || model.description}
                          </p>
                        </div>
                      )}

                      {cardTab === 'analysis' && (
                        <div className="space-y-1 my-2 text-[10px] font-mono bg-slate-950/80 p-2 rounded border border-cyan-500/10 min-h-[90px]">
                          {specEntries.length > 0 ? (
                            specEntries.slice(0, 3).map(([k, v]) => (
                              <div key={k} className="flex justify-between text-cyan-400/70">
                                <span className="truncate max-w-[100px]">{k}:</span>
                                <span className="text-cyan-200 font-bold truncate max-w-[120px]">{v}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-cyan-400/60 text-[10px] py-4 text-center">Nominal CAD spec</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-cyan-500/20">
                      <button
                        onClick={() => {
                          if (onSelectSpatialObject) onSelectSpatialObject(id, 'INSPECTION');
                          setView('home');
                        }}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-100 text-xs font-mono rounded border border-cyan-400/50 hover:border-cyan-300 transition-all font-bold cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Inspect 3D</span>
                      </button>
                      <button
                        onClick={() => {
                          if (onSelectSpatialObject) onSelectSpatialObject(id, 'EXPLODED');
                          setView('home');
                        }}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 hover:bg-cyan-950 text-cyan-300 text-xs font-mono rounded border border-cyan-500/30 hover:border-cyan-400 transition-all font-medium cursor-pointer"
                      >
                        <Layers size={13} />
                        <span>Explode</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'compare':
        return (
          <ScientificComparator
            onSelectMolecule={(id) => {
              if (onSelectMolecule) onSelectMolecule(id);
            }}
            onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id as any, 'INSPECTION');
            }}
            onClose={() => setView('home')}
          />
        );

      case 'demonstration':
        return (
          <DemonstrationMode
            onSelectMolecule={(id) => {
              if (onSelectMolecule) onSelectMolecule(id);
            }}
            onSelectSpatialObject={(id) => {
              if (onSelectSpatialObject) onSelectSpatialObject(id as any, 'INSPECTION');
            }}
            onClose={() => setView('home')}
          />
        );

      case 'lessons': {
        const curatedLessons = [
          {
            id: 'bf3_hybridization',
            subject: 'BF3',
            title: 'Trigonal Planar & sp² Hybridization (Boron Trifluoride)',
            discipline: 'Chemistry / Molecular Orbitals',
            duration: '5 Mins',
            objectives: 'Explore 120° bond angles, empty 2p unhybridized orbital, and Lewis acidity of BF₃.',
            intent: 'HYBRIDIZATION'
          },
          {
            id: 'water_vsepr',
            subject: 'H2O',
            title: 'Bent Molecular Geometry & Lone Pair Repulsion (H₂O)',
            discipline: 'Inorganic Chemistry / VSEPR',
            duration: '4 Mins',
            objectives: 'Understand why two lone pairs compress the H-O-H bond angle to 104.5°.',
            intent: 'VSEPR'
          },
          {
            id: 'glucose_chair',
            subject: 'C6H12O6',
            title: 'Carbohydrate Conformations & Chair Inversion (α-D-Glucose)',
            discipline: 'Organic Chemistry / Biochemistry',
            duration: '7 Mins',
            objectives: 'Inspect pyranose chair geometry, equatorial vs axial OH groups, and steric minimization.',
            intent: 'CHAIR_CONFORMATION'
          },
          {
            id: 'v12_cycle',
            subject: 'v12_engine',
            title: 'V12 Engine 4-Stroke Mechanical Cycle',
            discipline: 'Mechanical Engineering / Thermodynamics',
            duration: '6 Mins',
            objectives: 'Disassemble cylinder banks, observe synchronized intake/exhaust valve timing and crankshaft rotation.',
            intent: 'ENGINEERING_LESSON',
            isEngineering: true
          }
        ];

        return (
          <div className="flex flex-col gap-4">
            <div className="border-b border-cyan-500/20 pb-3">
              <h3 className="text-cyan-400 font-bold tracking-wider text-base flex items-center gap-2">
                <GraduationCap size={20} className="text-cyan-400" />
                INTERACTIVE LESSONS & GUIDED SESSIONS
              </h3>
              <p className="text-xs text-cyan-400/60 font-mono">
                Structured pedagogical modules synchronizing 3D camera sweeps, orbital overlays, and voice explanations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[60vh] pr-1 custom-scrollbar">
              {curatedLessons.map((lesson) => (
                <div 
                  key={lesson.id} 
                  className="bg-black/50 p-4 rounded-xl border border-cyan-500/20 hover:border-cyan-400/60 transition-all flex flex-col justify-between group hover:bg-cyan-950/20 shadow-[0_0_15px_rgba(0,255,255,0.03)]"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-500/30">
                        {lesson.discipline}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400/60">
                        {lesson.duration}
                      </span>
                    </div>

                    <h4 className="text-cyan-200 font-bold font-mono text-sm group-hover:text-cyan-100 transition-colors mb-2">
                      {lesson.title}
                    </h4>

                    <p className="text-xs text-cyan-400/70 font-mono leading-relaxed mb-4">
                      {lesson.objectives}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (lesson.isEngineering) {
                        setView('demonstration');
                      } else {
                        if (onStartLesson) onStartLesson(lesson.subject, lesson.intent);
                      }
                      setView('home');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-100 text-xs font-mono font-semibold rounded border border-cyan-400/40 hover:border-cyan-300 transition-all cursor-pointer"
                  >
                    <Play size={14} />
                    <span>LAUNCH INTERACTIVE LESSON</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'gestures': {
        const detected = (handTracking?.handsDetected ?? 0) > 0;
        const gesture = handTracking?.gesture || 'NONE';
        const pinchDist = handTracking?.pinchDistance;

        return (
          <div className="flex flex-col gap-5">
            <div className="border-b border-cyan-500/20 pb-3">
              <h3 className="text-cyan-400 font-bold tracking-wider text-base flex items-center gap-2">
                <Hand size={20} className="text-cyan-400" />
                GESTURE CONTROL & CALIBRATION
              </h3>
              <p className="text-xs text-cyan-400/60 font-mono">
                Real-time optical computer vision tracking for spatial 3D model rotation, zooming, component isolation, and workspace reset.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telemetry Panel */}
              <div className="bg-black/50 p-4 rounded-lg border border-cyan-500/20 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-cyan-500/10">
                  <span className="text-xs font-mono text-cyan-400/70">VISION TRACKING:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold ${cvEnabled ? 'text-green-400' : 'text-red-400'}`}>
                      {cvEnabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                    <button
                      onClick={() => setCvEnabled && setCvEnabled(!cvEnabled)}
                      className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 text-[10px] font-mono rounded border border-cyan-500/30 cursor-pointer"
                    >
                      {cvEnabled ? 'TURN OFF' : 'ENABLE'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-cyan-400/70">HAND STATUS:</span>
                  <span className={detected ? 'text-green-400 font-semibold' : 'text-yellow-400'}>
                    {detected ? 'DETECTED & LOCKED' : 'AWAITING HAND IN FRAME'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-cyan-400/70">ACTIVE GESTURE:</span>
                  <span className="text-cyan-200 font-bold px-2 py-0.5 bg-cyan-900/40 rounded border border-cyan-500/30">
                    {gesture}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-cyan-400/70">PINCH PROXIMITY:</span>
                  <span className="text-cyan-300">
                    {pinchDist !== undefined ? `${(pinchDist * 100).toFixed(0)}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Quick Calibration Guide */}
              <div className="bg-black/50 p-4 rounded-lg border border-cyan-500/20 space-y-2">
                <div className="text-xs font-mono text-cyan-300 font-bold uppercase tracking-wider mb-2">
                  SPATIAL GESTURE REFERENCE
                </div>
                                <div className="space-y-1.5 text-[11px] font-mono text-cyan-400/80">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">🤏 PINCH (1 Hand):</span>
                    <span>Component Selection / Manipulation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">🖐️ OPEN PALM (1 Hand):</span>
                    <span>Rotate / Orbit Spatial Model</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">👐 PINCH (2 Hands):</span>
                    <span>Scale / Zoom Spatial Model</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">☝️ INDEX POINTER:</span>
                    <span>Raycast Hover / Inspect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold w-36">✊ FIST:</span>
                    <span>Isolate Focused Component (Coming Soon)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'telemetry': {
        const objName = Array.isArray(activeSpatialObject)
          ? activeSpatialObject.map(id => SPATIAL_LIBRARY[id]?.name || id).join(', ')
          : (activeSpatialObject ? SPATIAL_LIBRARY[activeSpatialObject]?.name || activeSpatialObject : 'Hologram Core (Idle)');

        return (
          <div className="flex flex-col gap-5">
            <div className="border-b border-cyan-500/20 pb-3">
              <h3 className="text-cyan-400 font-bold tracking-wider text-base flex items-center gap-2">
                <Activity size={20} className="text-cyan-400" />
                SCIENTIFIC TELEMETRY & SYSTEM DIAGNOSTICS
              </h3>
              <p className="text-xs text-cyan-400/60 font-mono">
                Real-time execution status of 3D spatial rendering, chemistry engines, and computer vision pipelines.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-black/50 p-3.5 rounded border border-cyan-500/20 text-center">
                <div className="text-cyan-500/60 text-[10px] font-mono mb-1">WORKSPACE UPTIME</div>
                <div className="text-xl font-bold text-cyan-300 font-mono">{(perfTime / 1000).toFixed(0)}s</div>
              </div>
              <div className="bg-black/50 p-3.5 rounded border border-cyan-500/20 text-center">
                <div className="text-cyan-500/60 text-[10px] font-mono mb-1">WEBGL RENDER ENGINE</div>
                <div className="text-xl font-bold text-green-400 font-mono">ACTIVE (60 FPS)</div>
              </div>
              <div className="bg-black/50 p-3.5 rounded border border-cyan-500/20 text-center">
                <div className="text-cyan-500/60 text-[10px] font-mono mb-1">SPATIAL MODE</div>
                <div className="text-xl font-bold text-cyan-300 font-mono">{spatialMode}</div>
              </div>
              <div className="bg-black/50 p-3.5 rounded border border-cyan-500/20 text-center">
                <div className="text-cyan-500/60 text-[10px] font-mono mb-1">AUDIO FEEDBACK</div>
                <div className={`text-xl font-bold font-mono ${soundEnabled ? 'text-green-400' : 'text-yellow-400'}`}>
                  {soundEnabled ? 'ONLINE' : 'MUTED'}
                </div>
              </div>
            </div>

            <div className="bg-black/50 p-4 rounded border border-cyan-500/20 space-y-3 font-mono text-xs">
              <div className="text-cyan-300 font-bold border-b border-cyan-500/20 pb-2">
                ACTIVE WORKSPACE TARGETS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-500/70">3D SPATIAL OBJECT:</span>
                  <span className="text-cyan-200 font-semibold">{objName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-500/70">ACTIVE LESSON:</span>
                  <span className="text-cyan-200">{activeLearningSession ? activeLearningSession.context?.entity || activeLearningSession.context?.topic : 'NONE'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-500/70">EXPLODED VIEW STATE:</span>
                  <span className="text-cyan-200">{isExploded ? 'EXPLODED ASSEMBLY' : 'NOMINAL ASSEMBLY'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-500/70">SELECTED COMPONENT:</span>
                  <span className="text-cyan-200">{selectedComponentId || 'NONE'}</span>
                </div>
              </div>
            </div>

            <div className="bg-black/50 p-4 rounded border border-cyan-500/20 space-y-2 font-mono text-xs">
              <div className="text-cyan-300 font-bold border-b border-cyan-500/20 pb-2">
                SUBSYSTEM VERIFICATION
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex justify-between items-center py-1 px-2 rounded bg-cyan-950/30">
                  <span className="text-cyan-400/80">Molecular Visualizer</span>
                  <span className="text-green-400">READY</span>
                </div>
                <div className="flex justify-between items-center py-1 px-2 rounded bg-cyan-950/30">
                  <span className="text-cyan-400/80">Engineering Inspector</span>
                  <span className="text-green-400">READY</span>
                </div>
                <div className="flex justify-between items-center py-1 px-2 rounded bg-cyan-950/30">
                  <span className="text-cyan-400/80">MediaPipe CV Adapter</span>
                  <span className={cvEnabled ? "text-green-400" : "text-cyan-600"}>{cvEnabled ? "ACTIVE" : "STANDBY"}</span>
                </div>
                <div className="flex justify-between items-center py-1 px-2 rounded bg-cyan-950/30">
                  <span className="text-cyan-400/80">Scientific AI Assistant</span>
                  <span className="text-green-400">ONLINE</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'settings':
        return (
          <div className="flex flex-col gap-4">
            <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
              <Settings2 size={20} className="text-cyan-400" />
              SYSTEM & DISPLAY PREFERENCES
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-4 hover:bg-cyan-900/20 p-2 rounded transition-colors">
                <div>
                  <div className="text-cyan-100 text-sm">Hologram Spectral Theme</div>
                  <div className="text-cyan-500/50 text-xs">Select ambient scientific projection palette.</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setThemeColor && setThemeColor('#22d3ee')} className={`w-6 h-6 rounded-full bg-[#22d3ee] ${themeColor === '#22d3ee' ? 'ring-2 ring-white scale-110' : 'opacity-50'} transition-all cursor-pointer`} title="Cyan Spectral" />
                  <button onClick={() => setThemeColor && setThemeColor('#fb923c')} className={`w-6 h-6 rounded-full bg-[#fb923c] ${themeColor === '#fb923c' ? 'ring-2 ring-white scale-110' : 'opacity-50'} transition-all cursor-pointer`} title="Amber Resonance" />
                  <button onClick={() => setThemeColor && setThemeColor('#ef4444')} className={`w-6 h-6 rounded-full bg-[#ef4444] ${themeColor === '#ef4444' ? 'ring-2 ring-white scale-110' : 'opacity-50'} transition-all cursor-pointer`} title="Crimson Vector" />
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-4 hover:bg-cyan-900/20 p-2 rounded transition-colors">
                <div>
                  <div className="text-cyan-100 text-sm">Hologram Bloom & Emission Intensity</div>
                  <div className="text-cyan-500/50 text-xs">Scales the bloom effect and emission brightness.</div>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="200" 
                  value={hologramIntensity * 100} 
                  onChange={(e) => setHologramIntensity && setHologramIntensity(parseInt(e.target.value) / 100)} 
                  className="accent-cyan-400 cursor-pointer hover:scale-110 transition-transform" 
                />
              </div>
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-4 hover:bg-cyan-900/20 p-2 rounded transition-colors">
                <div>
                  <div className="text-cyan-100 text-sm">Voice & Auditory Feedback</div>
                  <div className="text-cyan-500/50 text-xs">Toggle verbal scientific explanations and auditory feedback.</div>
                </div>
                <div 
                  onClick={() => setSoundEnabled && setSoundEnabled(!soundEnabled)}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${soundEnabled ? 'bg-cyan-600/50 shadow-[0_0_10px_rgba(0,255,255,0.3)]' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${soundEnabled ? 'right-1 bg-cyan-400' : 'left-1 bg-slate-500'}`} />
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-4 hover:bg-cyan-900/20 p-2 rounded transition-colors">
                <div>
                  <div className="text-cyan-100 text-sm">Speech Rate</div>
                  <div className="text-cyan-500/50 text-xs">Adjust the speed of voice synthesis ({speechRate?.toFixed(2)}x).</div>
                </div>
                <input 
                  type="range" 
                  min="0.8" 
                  max="1.2" 
                  step="0.05"
                  value={speechRate} 
                  onChange={(e) => setSpeechRate && setSpeechRate(parseFloat(e.target.value))} 
                  className="accent-cyan-400 cursor-pointer hover:scale-110 transition-transform" 
                />
              </div>
              
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-4 hover:bg-cyan-900/20 p-2 rounded transition-colors">
                <div>
                  <div className="text-cyan-100 text-sm">Computer Vision Hand Tracking</div>
                  <div className="text-cyan-500/50 text-xs">Enable camera feed for spatial gesture interaction.</div>
                </div>
                <div 
                  onClick={() => setCvEnabled && setCvEnabled(!cvEnabled)}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${cvEnabled ? 'bg-cyan-600/50 shadow-[0_0_10px_rgba(0,255,255,0.3)]' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${cvEnabled ? 'right-1 bg-cyan-400' : 'left-1 bg-slate-500'}`} />
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-6">
                <h4 className="text-cyan-400 font-bold text-sm tracking-widest border-b border-cyan-500/20 pb-2">WORKSPACE CONTROLS</h4>
                
                <div className="flex justify-between items-center bg-cyan-950/20 border border-cyan-500/20 p-4 rounded hover:bg-cyan-900/30 transition-colors">
                  <div>
                    <div className="text-cyan-300 text-sm font-bold tracking-wider">RESET WORKSPACE</div>
                    <div className="text-cyan-500/60 text-xs">Resets active chat session, clears visual targets, and restores default workspace.</div>
                  </div>
                  <button 
                    onClick={triggerCleanSlate}
                    className="px-4 py-2 bg-cyan-900/50 hover:bg-cyan-500 text-cyan-200 hover:text-black text-xs font-bold tracking-widest transition-colors rounded border border-cyan-500/50 cursor-pointer"
                  >
                    RESET
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div>MODULE NOT FOUND</div>;
    }
  };

  const getModuleTitle = () => {
    switch (currentView) {
      case 'molecules': return 'MOLECULAR LIBRARY';
      case 'engineering': return 'ENGINEERING CATALOG';
      case 'compare': return 'SCIENTIFIC COMPARATOR';
      case 'demonstration': return 'SCIENTIFIC DEMONSTRATIONS';
      case 'lessons': return 'INTERACTIVE LESSONS';
      case 'gestures': return 'GESTURE CONTROL';
      case 'telemetry': return 'SCIENTIFIC TELEMETRY';
      case 'settings': return 'SYSTEM PREFERENCES';
      default: return `${currentView} MODULE`;
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`absolute inset-0 z-40 flex p-4 md:p-8 ${currentView === 'demonstration' || currentView === 'compare' ? 'items-end justify-center pointer-events-none' : 'items-center justify-center bg-black/70 backdrop-blur-md pointer-events-auto'}`}
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className={`w-full max-w-5xl pointer-events-auto bg-black/90 border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,255,255,0.15)] flex flex-col overflow-hidden ${currentView === 'demonstration' || currentView === 'compare' ? 'max-h-[50vh]' : 'max-h-[90vh]'}`}
        >
          <div className="flex justify-between items-center p-4 border-b border-cyan-500/30 bg-cyan-950/30">
            <h2 className="text-lg md:text-xl font-mono tracking-widest text-cyan-400 uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.5)] font-bold">
              {getModuleTitle()}
            </h2>
            <button onClick={() => setView('home')} className="text-cyan-500/70 hover:text-cyan-300 transition-colors bg-cyan-500/10 hover:bg-cyan-500/20 p-2 rounded-lg cursor-pointer">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 font-mono custom-scrollbar">
            {renderContent()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
