import React, { useState } from 'react';
import { getDigitalTwin } from './DigitalTwinAdapter';
import { 
  ShieldCheck, 
  Activity, 
  Zap, 
  Layers, 
  ChevronRight, 
  ChevronDown, 
  Sliders, 
  AlertTriangle, 
  Thermometer, 
  Wrench, 
  Search, 
  CheckCircle2, 
  HelpCircle,
  Eye
} from 'lucide-react';
import { evaluateDiagnosticHypotheses, explainHypothesisReasoning, getComponentDependencies } from './DiagnosticEngine';
import { DiagnosticHypothesis, DiagnosticConfidence, DataProvenance } from './DigitalTwin';

interface Props {
  objectId: string;
  selectedComponentId: string | null;
  onSelectComponent?: (id: string | null) => void;
  onTraceConnection?: (type: any, startId: string) => void;
}

export const DigitalTwinInspector: React.FC<Props> = ({ 
  objectId, 
  selectedComponentId, 
  onSelectComponent,
  onTraceConnection
}) => {
  const twin = getDigitalTwin(objectId);
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'safety'>('overview');
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string | null>(null);
  
  if (!twin) return <div className="text-xs text-cyan-400">Loading Digital Twin...</div>;
  const selectedComp = selectedComponentId ? twin.components.find(c => c.id === selectedComponentId) : null;
  
  const hypotheses: DiagnosticHypothesis[] = evaluateDiagnosticHypotheses(twin, selectedComponentId);
  const activeHypothesis = selectedHypothesisId 
    ? hypotheses.find(h => h.id === selectedHypothesisId) || hypotheses[0]
    : hypotheses[0];

  // Helper for collapsible sections
  const Section = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
      <div className="border border-cyan-500/20 rounded bg-slate-900/40 mb-2 overflow-hidden">
        <button 
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between p-2 hover:bg-cyan-900/30 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Icon size={14} className="text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest">{title}</span>
          </div>
          {open ? <ChevronDown size={14} className="text-cyan-400/60" /> : <ChevronRight size={14} className="text-cyan-400/60" />}
        </button>
        {open && <div className="p-2 pt-0 border-t border-cyan-500/10">{children}</div>}
      </div>
    );
  };

  const ProvenanceBadge = ({ source }: { source: DataProvenance | string }) => {
    let color = 'bg-slate-900 text-slate-300 border-slate-500';
    if (source === 'LIT' || source === 'LITERATURE') color = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
    if (source === 'DERIVED') color = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
    if (source === 'SENSOR' || source === 'LIVE') color = 'bg-purple-950/60 text-purple-300 border-purple-500/40';
    if (source === 'USER' || source === 'USER_INPUT') color = 'bg-blue-950/60 text-blue-300 border-blue-500/40';
    return (
      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${color} uppercase tracking-widest`} title={`Data Provenance: ${source}`}>
        {source}
      </span>
    );
  };

  const ConfidenceBadge = ({ confidence }: { confidence: DiagnosticConfidence }) => {
    let color = 'bg-slate-800 text-slate-300 border-slate-600';
    if (confidence === 'CONFIRMED') color = 'bg-emerald-950 text-emerald-300 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
    if (confidence === 'LIKELY') color = 'bg-amber-950 text-amber-300 border-amber-400';
    if (confidence === 'POSSIBLE') color = 'bg-cyan-950 text-cyan-300 border-cyan-500/60';
    if (confidence === 'INSUFFICIENT_DATA') color = 'bg-slate-900 text-amber-200/70 border-amber-500/30';
    return (
      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${color} uppercase tracking-wider`}>
        {confidence}
      </span>
    );
  };

  return (
    <div className="space-y-2 text-xs font-mono">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-cyan-950/40 p-2 rounded border border-cyan-500/30">
        <div className="truncate">
          <div className="font-bold text-white text-[11px] truncate">{selectedComp ? selectedComp.name : twin.name}</div>
          <div className="text-[9px] text-cyan-400/80">{selectedComp ? `Component of ${twin.name}` : `${twin.domain} Digital Twin`}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <ProvenanceBadge source={selectedComp?.diagnosticState?.source || twin.dataProvenance} />
          {selectedComp && (
            <button 
              onClick={() => onSelectComponent?.(null)} 
              className="text-[9px] bg-cyan-900/50 hover:bg-cyan-800 px-1.5 py-0.5 rounded border border-cyan-500/40 text-cyan-200 uppercase transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-950/80 rounded border border-cyan-500/20 text-[10px]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-1 rounded font-bold transition-all ${activeTab === 'overview' ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40' : 'text-cyan-400/60 hover:text-cyan-300'}`}
        >
          TOPOLOGY
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`py-1 rounded font-bold transition-all flex items-center justify-center gap-1 ${activeTab === 'diagnostics' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40' : 'text-cyan-400/60 hover:text-cyan-300'}`}
        >
          <Search size={10} />
          DIAGNOSE
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`py-1 rounded font-bold transition-all flex items-center justify-center gap-1 ${activeTab === 'safety' ? 'bg-red-500/20 text-red-200 border border-red-400/40' : 'text-cyan-400/60 hover:text-cyan-300'}`}
        >
          <ShieldCheck size={10} />
          SAFETY
        </button>
      </div>

      {/* TAB 1: TOPOLOGY & SPECS */}
      {activeTab === 'overview' && (
        <div className="space-y-1.5 animate-fade-in">
          <Section title="IDENTITY & DESCRIPTION" icon={Layers} defaultOpen={true}>
            <p className="text-[10px] text-cyan-200/90 leading-relaxed font-sans pt-1">
              {selectedComp ? selectedComp.description : (twin.description || 'Verified engineering model.')}
            </p>
            {selectedComp?.material && (
              <div className="mt-2 text-[9px] text-cyan-400/80">
                <span className="text-cyan-500/60">Material:</span> <span className="text-cyan-200 font-bold">{selectedComp.material}</span>
              </div>
            )}
          </Section>

          {selectedComp ? (
            <>
              {/* Connected Subsystems */}
              <Section title="CONNECTIONS & BUSES" icon={Zap} defaultOpen={true}>
                {(() => {
                  const deps = getComponentDependencies(twin, selectedComp.id);
                  const allConns = [...deps.upstreamProviders, ...deps.downstreamDependents];
                  if (allConns.length === 0) {
                    return <div className="text-[10px] text-cyan-400/50 italic py-1">No direct bus connections registered</div>;
                  }
                  return (
                    <div className="space-y-1 pt-1">
                      {deps.upstreamProviders.map((u, i) => (
                        <div key={`u_${i}`} className="text-[9px] bg-slate-950/60 p-1.5 rounded border border-cyan-500/15 flex items-center justify-between">
                          <span className="text-cyan-400 flex items-center gap-1 font-bold">
                            ← Inflow ({u.type})
                          </span>
                          <span className="text-cyan-200 font-bold truncate max-w-[140px]">{u.componentName}</span>
                        </div>
                      ))}
                      {deps.downstreamDependents.map((d, i) => (
                        <div key={`d_${i}`} className="text-[9px] bg-slate-950/60 p-1.5 rounded border border-cyan-500/15 flex items-center justify-between">
                          <span className="text-amber-400 flex items-center gap-1 font-bold">
                            → Drives ({d.type})
                          </span>
                          <span className="text-cyan-200 font-bold truncate max-w-[140px]">{d.componentName}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </Section>

              {/* Specifications */}
              {selectedComp.specifications && Object.keys(selectedComp.specifications).length > 0 && (
                <Section title="SPECIFICATIONS" icon={Sliders} defaultOpen={false}>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] pt-1">
                    {Object.entries(selectedComp.specifications).map(([k, v]) => (
                      <React.Fragment key={k}>
                        <span className="text-cyan-400/70 truncate">{k}:</span>
                        <span className="text-cyan-200 font-bold text-right truncate" title={String(v)}>{String(v)}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </Section>
              )}
            </>
          ) : (
            /* System Level Overview */
            <Section title="SYSTEM FUNCTIONS" icon={Activity} defaultOpen={true}>
              <div className="space-y-1.5 pt-1">
                {twin.functions.map(f => (
                  <div key={f.id} className="text-[10px] bg-slate-950/60 p-2 rounded border border-cyan-500/15">
                    <div className="font-bold text-cyan-200">{f.name}</div>
                    <div className="text-[9px] text-cyan-300/80 font-sans mt-0.5">{f.description}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* TAB 2: NON-CONTACT FAULT DIAGNOSTICS */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-2 animate-fade-in">
          <div className="bg-slate-900/60 p-2 rounded border border-cyan-500/20 text-[10px]">
            <div className="text-cyan-300 font-bold flex items-center justify-between">
              <span>FAULT HYPOTHESIS ENGINE</span>
              <span className="text-[8px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                {hypotheses.length} {hypotheses.length === 1 ? 'HYPOTHESIS' : 'HYPOTHESES'}
              </span>
            </div>
            <p className="text-[9px] text-cyan-400/70 font-sans mt-0.5">
              Deterministic inference over Digital Twin component relationships.
            </p>
          </div>

          {hypotheses.length > 0 ? (
            <div className="space-y-2">
              {/* Hypothesis Selector */}
              {hypotheses.map(hyp => {
                const isSelected = activeHypothesis?.id === hyp.id;
                const reasoning = explainHypothesisReasoning(hyp);

                return (
                  <div 
                    key={hyp.id} 
                    onClick={() => setSelectedHypothesisId(hyp.id)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-cyan-950/60 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                        : 'bg-slate-950/40 border-cyan-500/20 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-white">{hyp.failureMode}</div>
                        <div className="text-[9px] text-cyan-400/80">Target: {hyp.componentName}</div>
                      </div>
                      <ConfidenceBadge confidence={hyp.confidence} />
                    </div>

                    {isSelected && (
                      <div className="mt-2 space-y-2 border-t border-cyan-500/20 pt-2">
                        {/* Evidence & CAD inference */}
                        <div>
                          <div className="text-[9px] text-cyan-400/60 font-bold uppercase tracking-wider">Topological Evidence:</div>
                          <ul className="text-[9px] text-cyan-200/90 font-sans space-y-0.5 mt-0.5">
                            {hyp.evidence.map((e, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-cyan-400">•</span>
                                <span>{e}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Distinguishing Physical Measurement Required */}
                        <div className="bg-amber-950/30 p-2 rounded border border-amber-500/30">
                          <div className="text-[9px] text-amber-300 font-bold flex items-center gap-1">
                            <Eye size={10} className="text-amber-400" />
                            <span>DISTINGUISHING TEST (PHYSICAL):</span>
                          </div>
                          <p className="text-[9px] text-amber-100/90 font-sans mt-0.5 leading-snug">
                            {reasoning.realWorldRequirement}
                          </p>
                        </div>

                        {/* Recommended Checks */}
                        {hyp.recommendedChecks.length > 0 && (
                          <div>
                            <div className="text-[9px] text-cyan-400/60 font-bold uppercase tracking-wider">Inspection Procedures:</div>
                            <div className="space-y-1 mt-1">
                              {hyp.recommendedChecks.map((check, idx) => (
                                <div key={idx} className="text-[9px] bg-slate-900/80 p-1.5 rounded border border-cyan-500/10 text-cyan-300 flex items-start gap-1.5 font-sans">
                                  <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{check}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[10px] text-cyan-400/60 italic p-3 text-center bg-slate-950/40 rounded border border-cyan-500/10">
              No failure mode profiles registered for this component archetype.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAFETY & LOCKOUT/TAGOUT */}
      {activeTab === 'safety' && (
        <div className="space-y-2 animate-fade-in">
          {activeHypothesis ? (
            <div className="space-y-2">
              <div className={`p-2.5 rounded-lg border ${
                activeHypothesis.safetyState.hazardous
                  ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  : 'bg-emerald-950/30 border-emerald-500/40'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className={activeHypothesis.safetyState.hazardous ? 'text-red-400 animate-pulse' : 'text-emerald-400'} />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {activeHypothesis.safetyState.hazardous ? 'HAZARD ISOLATION MANDATE' : 'LOW RISK ASSESSMENT'}
                  </span>
                </div>
                <p className="text-[10px] text-cyan-100/90 font-sans mt-1 leading-relaxed">
                  {activeHypothesis.safetyState.warning}
                </p>
              </div>

              {/* LOTO Checklist */}
              {activeHypothesis.safetyState.lockoutTagoutProcedure && activeHypothesis.safetyState.lockoutTagoutProcedure.length > 0 && (
                <div className="bg-slate-950/60 p-2 rounded border border-cyan-500/20">
                  <div className="text-[9px] font-bold text-cyan-200 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Wrench size={10} className="text-cyan-400" />
                    <span>Lockout / Tagout (LOTO) Protocol:</span>
                  </div>
                  <div className="space-y-1">
                    {activeHypothesis.safetyState.lockoutTagoutProcedure.map((step, idx) => (
                      <div key={idx} className="text-[9px] text-cyan-300/90 font-sans flex items-start gap-1.5">
                        <span className="text-amber-400 font-mono font-bold">{idx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PPE Requirements */}
              {activeHypothesis.safetyState.ppeRequired && (
                <div className="bg-slate-950/60 p-2 rounded border border-cyan-500/20">
                  <div className="text-[9px] font-bold text-cyan-200 uppercase tracking-widest mb-1">
                    Required Personal Protective Equipment (PPE):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {activeHypothesis.safetyState.ppeRequired.map((ppe, idx) => (
                      <span key={idx} className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        {ppe}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[10px] text-cyan-400/60 italic p-3 text-center">
              Select a component to inspect safety state and de-energization guidelines.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

