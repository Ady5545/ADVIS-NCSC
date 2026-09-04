import React, { useState } from 'react';
import { 
  GitCompare, 
  Atom, 
  Cpu, 
  ArrowRight, 
  Check, 
  ChevronRight, 
  Eye, 
  Zap, 
  ShieldCheck, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { CHEMISTRY_DATABASE, ChemicalEntity } from './LearnEngine/ChemistryDatabase';
import { SPATIAL_LIBRARY, ObjectMetadata } from './SpatialLibrary';

interface ScientificComparatorProps {
  onSelectMolecule: (id: string) => void;
  onSelectSpatialObject: (id: string | string[]) => void;
  onClose?: () => void;
}

export const ScientificComparator: React.FC<ScientificComparatorProps> = ({
  onSelectMolecule,
  onSelectSpatialObject,
  onClose
}) => {
  const [domain, setDomain] = useState<'chemistry' | 'engineering'>('chemistry');
  
  // Chemistry presets & custom selections
  const [molA, setMolA] = useState<string>('H2O');
  const [molB, setMolB] = useState<string>('H2S');

  // Engineering presets & custom selections
  const [engA, setEngA] = useState<string>('v12_engine');
  const [engB, setEngB] = useState<string>('rotary_engine');

  const chemEntries = Object.entries(CHEMISTRY_DATABASE);
  const engEntries = Object.entries(SPATIAL_LIBRARY);

  const entityA_chem = CHEMISTRY_DATABASE[molA];
  const entityB_chem = CHEMISTRY_DATABASE[molB];

  const entityA_eng = SPATIAL_LIBRARY[engA];
  const entityB_eng = SPATIAL_LIBRARY[engB];

  return (
    <div className="flex flex-col gap-4 font-mono text-cyan-300">
      
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-cyan-500/20 pb-3">
        <div>
          <h3 className="text-cyan-400 font-bold tracking-wider text-base flex items-center gap-2">
            <GitCompare size={20} className="text-cyan-400" />
            SCIENTIFIC COMPARATOR ENGINE
          </h3>
          <p className="text-xs text-cyan-400/60">
            Side-by-side comparative analysis of orbital geometries, VSEPR domains, and mechanical kinematics.
          </p>
        </div>

        <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg border border-cyan-500/30 text-xs font-bold">
          <button
            onClick={() => setDomain('chemistry')}
            className={`px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              domain === 'chemistry'
                ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400'
                : 'text-cyan-400/60 hover:text-cyan-200'
            }`}
          >
            <Atom size={14} />
            Chemistry (Molecules)
          </button>
          <button
            onClick={() => setDomain('engineering')}
            className={`px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              domain === 'engineering'
                ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400'
                : 'text-cyan-400/60 hover:text-cyan-200'
            }`}
          >
            <Cpu size={14} />
            Engineering (Assemblies)
          </button>
        </div>
      </div>

      {/* QUICK PRESETS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] text-cyan-400/60 font-bold uppercase whitespace-nowrap">Presets:</span>
        {domain === 'chemistry' ? (
          <>
            <button
              onClick={() => { setMolA('H2O'); setMolB('H2S'); }}
              className="px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 text-[11px] whitespace-nowrap cursor-pointer"
            >
              H₂O vs H₂S (Bent Hydrides)
            </button>
            <button
              onClick={() => { setMolA('CH4'); setMolB('NH3'); }}
              className="px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 text-[11px] whitespace-nowrap cursor-pointer"
            >
              CH₄ vs NH₃ (Lone Pair Steric Effect)
            </button>
            <button
              onClick={() => { setMolA('CO2'); setMolB('BF3'); }}
              className="px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 text-[11px] whitespace-nowrap cursor-pointer"
            >
              CO₂ vs BF₃ (Linear vs Trigonal Planar)
            </button>
            <button
              onClick={() => { setMolA('PCl5'); setMolB('SF6'); }}
              className="px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 text-[11px] whitespace-nowrap cursor-pointer"
            >
              PCl₅ vs SF₆ (Expanded Octets)
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => { setEngA('v12_engine'); setEngB('rotary_engine'); }}
              className="px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 text-[11px] whitespace-nowrap cursor-pointer"
            >
              V12 vs Wankel Rotary Engine
            </button>
            <button
              onClick={() => { setEngA('servo_motor'); setEngB('stepper_motor'); }}
              className="px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 text-[11px] whitespace-nowrap cursor-pointer"
            >
              SG90 Servo vs NEMA 17 Stepper
            </button>
            <button
              onClick={() => { setEngA('arduino_uno'); setEngB('esp32'); }}
              className="px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 text-[11px] whitespace-nowrap cursor-pointer"
            >
              Arduino UNO vs ESP32 MCU
            </button>
          </>
        )}
      </div>

      {/* SELECTORS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Specimen A */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-cyan-500/30">
          <label className="text-[10px] font-bold text-cyan-400 uppercase mb-1.5 block">
            Select Specimen A:
          </label>
          {domain === 'chemistry' ? (
            <select
              value={molA}
              onChange={(e) => setMolA(e.target.value)}
              className="w-full bg-black/80 border border-cyan-500/40 rounded px-2.5 py-1.5 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-400"
            >
              {chemEntries.map(([k, item]) => (
                <option key={k} value={item.formula || k}>
                  {item.name} ({item.formula})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={engA}
              onChange={(e) => setEngA(e.target.value)}
              className="w-full bg-black/80 border border-cyan-500/40 rounded px-2.5 py-1.5 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-400"
            >
              {engEntries.map(([k, item]) => (
                <option key={k} value={k}>
                  {item.name} ({item.category})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Specimen B */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-cyan-500/30">
          <label className="text-[10px] font-bold text-cyan-400 uppercase mb-1.5 block">
            Select Specimen B:
          </label>
          {domain === 'chemistry' ? (
            <select
              value={molB}
              onChange={(e) => setMolB(e.target.value)}
              className="w-full bg-black/80 border border-cyan-500/40 rounded px-2.5 py-1.5 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-400"
            >
              {chemEntries.map(([k, item]) => (
                <option key={k} value={item.formula || k}>
                  {item.name} ({item.formula})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={engB}
              onChange={(e) => setEngB(e.target.value)}
              className="w-full bg-black/80 border border-cyan-500/40 rounded px-2.5 py-1.5 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-400"
            >
              {engEntries.map(([k, item]) => (
                <option key={k} value={k}>
                  {item.name} ({item.category})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* SIDE-BY-SIDE COMPARISON MATRIX */}
      {domain === 'chemistry' && entityA_chem && entityB_chem && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card A */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/40 flex flex-col justify-between shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div>
              <div className="flex justify-between items-start border-b border-cyan-500/20 pb-2 mb-3">
                <div>
                  <div className="text-base font-bold text-white">{entityA_chem.name}</div>
                  <div className="text-xs text-cyan-400 font-bold">{entityA_chem.formula}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-900/40 border border-cyan-500/40 text-cyan-200">
                  {entityA_chem.hybridization || 'sp³'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-400/70">Molecular Geometry:</span>
                  <span className="text-cyan-100 font-bold">{entityA_chem.geometry}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-400/70">Bond Angle:</span>
                  <span className="text-cyan-100 font-bold">{entityA_chem.bondAngles?.[0] || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-400/70">Valence Electrons:</span>
                  <span className="text-cyan-100 font-bold">{entityA_chem.valenceElectrons} e⁻</span>
                </div>
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-400/70">Lone Pairs:</span>
                  <span className="text-cyan-100 font-bold">{entityA_chem.lonePairs ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-400/70">Net Polarity:</span>
                  <span className="text-cyan-100 font-bold">
                    {entityA_chem.dipoleMoment !== undefined && parseFloat(entityA_chem.dipoleMoment as any) > 0 ? `Polar (${entityA_chem.dipoleMoment} D)` : 'Non-Polar'}
                  </span>
                </div>
                {entityA_chem.lewisStructure && (
                  <div className="py-1 border-b border-cyan-500/10">
                    <span className="text-cyan-400/70 block mb-0.5">Lewis Representation:</span>
                    <span className="text-cyan-200 text-[11px] font-mono bg-cyan-950/40 px-2 py-1 rounded block whitespace-pre-wrap">
                      {typeof entityA_chem.lewisStructure === 'string' ? entityA_chem.lewisStructure : (entityA_chem.lewisStructure?.diagram || entityA_chem.lewisStructure?.description || "Available")}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-cyan-300/80 font-sans mt-3 leading-relaxed">
                {entityA_chem.description}
              </p>
            </div>

            <button
              onClick={() => onSelectMolecule(entityA_chem.formula || molA)}
              className="mt-4 w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-100 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye size={14} />
              <span>Project {entityA_chem.formula} in 3D</span>
            </button>
          </div>

          {/* Card B */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/40 flex flex-col justify-between shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div>
              <div className="flex justify-between items-start border-b border-cyan-500/20 pb-2 mb-3">
                <div>
                  <div className="text-base font-bold text-white">{entityB_chem.name}</div>
                  <div className="text-xs text-cyan-400 font-bold">{entityB_chem.formula}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-900/40 border border-cyan-500/40 text-cyan-200">
                  {entityB_chem.hybridization || 'sp³'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-400/70">Molecular Geometry:</span>
                  <span className="text-cyan-100 font-bold">{entityB_chem.geometry}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-400/70">Bond Angle:</span>
                  <span className="text-cyan-100 font-bold">{entityB_chem.bondAngles?.[0] || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-400/70">Valence Electrons:</span>
                  <span className="text-cyan-100 font-bold">{entityB_chem.valenceElectrons} e⁻</span>
                </div>
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-400/70">Lone Pairs:</span>
                  <span className="text-cyan-100 font-bold">{entityB_chem.lonePairs ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-cyan-500/10">
                  <span className="text-cyan-400/70">Net Polarity:</span>
                  <span className="text-cyan-100 font-bold">
                    {entityB_chem.dipoleMoment !== undefined && parseFloat(entityB_chem.dipoleMoment as any) > 0 ? `Polar (${entityB_chem.dipoleMoment} D)` : 'Non-Polar'}
                  </span>
                </div>
                {entityB_chem.lewisStructure && (
                  <div className="py-1 border-b border-cyan-500/10">
                    <span className="text-cyan-400/70 block mb-0.5">Lewis Representation:</span>
                    <span className="text-cyan-200 text-[11px] font-mono bg-cyan-950/40 px-2 py-1 rounded block whitespace-pre-wrap">
                      {typeof entityB_chem.lewisStructure === 'string' ? entityB_chem.lewisStructure : (entityB_chem.lewisStructure?.diagram || entityB_chem.lewisStructure?.description || "Available")}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-cyan-300/80 font-sans mt-3 leading-relaxed">
                {entityB_chem.description}
              </p>
            </div>

            <button
              onClick={() => onSelectMolecule(entityB_chem.formula || molB)}
              className="mt-4 w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-100 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye size={14} />
              <span>Project {entityB_chem.formula} in 3D</span>
            </button>
          </div>

        </div>
      )}

      {/* ENGINEERING COMPARISON MATRIX */}
      {domain === 'engineering' && entityA_eng && entityB_eng && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          
          {/* Card A */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/40 flex flex-col justify-between shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div>
              <div className="flex justify-between items-start border-b border-cyan-500/20 pb-2 mb-3">
                <div>
                  <div className="text-base font-bold text-white">{entityA_eng.name}</div>
                  <div className="text-[10px] text-cyan-400 font-bold uppercase">{entityA_eng.category}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-900/40 border border-cyan-500/40 text-cyan-200">
                  {entityA_eng.components.length} Subsystems
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {entityA_eng.educationalInformation?.specifications && (
                  Object.entries(entityA_eng.educationalInformation.specifications).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 border-b border-cyan-500/10">
                      <span className="text-cyan-400/70">{k}:</span>
                      <span className="text-cyan-100 font-bold">{v}</span>
                    </div>
                  ))
                )}
              </div>

              <p className="text-[11px] text-cyan-300/80 font-sans mt-3 leading-relaxed">
                {entityA_eng.educationalInformation?.workingPrinciple || entityA_eng.description}
              </p>
            </div>

            
          </div>

          {/* Card B */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/40 flex flex-col justify-between shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div>
              <div className="flex justify-between items-start border-b border-cyan-500/20 pb-2 mb-3">
                <div>
                  <div className="text-base font-bold text-white">{entityB_eng.name}</div>
                  <div className="text-[10px] text-cyan-400 font-bold uppercase">{entityB_eng.category}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-900/40 border border-cyan-500/40 text-cyan-200">
                  {entityB_eng.components.length} Subsystems
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {entityB_eng.educationalInformation?.specifications && (
                  Object.entries(entityB_eng.educationalInformation.specifications).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 border-b border-cyan-500/10">
                      <span className="text-cyan-400/70">{k}:</span>
                      <span className="text-cyan-100 font-bold">{v}</span>
                    </div>
                  ))
                )}
              </div>

              <p className="text-[11px] text-cyan-300/80 font-sans mt-3 leading-relaxed">
                {entityB_eng.educationalInformation?.workingPrinciple || entityB_eng.description}
              </p>
            </div>

            
          </div>

        </div>

        <div className="md:col-span-2 mt-4">
          <button
            onClick={() => onSelectSpatialObject([engA, engB])}
            className="w-full py-3 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-100 text-sm font-bold rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          >
            <Eye size={16} />
            <span>Project {entityA_eng.name} vs {entityB_eng.name} in 3D</span>
          </button>
        </div>
        </>
      )}

    </div>
  );
};
