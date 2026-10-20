import re

content = """import React, { useState } from 'react';
import { getDigitalTwin } from './DigitalTwinAdapter';
import { ShieldCheck, Activity, Zap, Layers, ChevronRight, ChevronDown, Sliders } from 'lucide-react';

interface Props {
  objectId: string;
  selectedComponentId: string | null;
  onSelectComponent?: (id: string | null) => void;
}

export const DigitalTwinInspector: React.FC<Props> = ({ objectId, selectedComponentId, onSelectComponent }) => {
  const twin = getDigitalTwin(objectId);
  
  if (!twin) return <div className="text-xs text-cyan-400">Loading Digital Twin...</div>;
  const selectedComp = selectedComponentId ? twin.components.find(c => c.id === selectedComponentId) : null;
  
  // A helper for collapsible sections
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

  const ProvenanceBadge = ({ source }: { source: string }) => {
    let color = 'bg-slate-900 text-slate-300 border-slate-500';
    if (source === 'LIT') color = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
    if (source === 'DERIVED') color = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
    if (source === 'SENSOR') color = 'bg-purple-950/60 text-purple-300 border-purple-500/40';
    if (source === 'USER') color = 'bg-blue-950/60 text-blue-300 border-blue-500/40';
    return <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${color} ml-2 uppercase tracking-widest`} title="Data Provenance">{source}</span>;
  };

  if (selectedComp) {
    const connectedTo = twin.connections.filter(c => c.sourceComponentId === selectedComp.id || c.targetComponentId === selectedComp.id);
    const relatedFunctions = twin.functions.filter(f => f.inputComponents?.includes(selectedComp.id) || f.outputComponents?.includes(selectedComp.id));

    return (
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between bg-cyan-950/30 p-2 rounded border border-cyan-500/20 mb-2">
          <span className="font-bold text-white truncate">{selectedComp.name}</span>
          <button onClick={() => onSelectComponent?.(null)} className="text-[9px] bg-cyan-900/50 hover:bg-cyan-800 px-2 py-1 rounded border border-cyan-500/40 uppercase transition-colors cursor-pointer">Clear</button>
        </div>

        <Section title="IDENTITY" icon={Layers} defaultOpen={true}>
          <p className="text-[10px] text-cyan-300/80 leading-relaxed font-sans">{selectedComp.description}</p>
        </Section>

        <Section title="FUNCTION" icon={Activity} defaultOpen={true}>
          {relatedFunctions.length > 0 ? (
            <div className="space-y-1">
              {relatedFunctions.map(f => (
                <div key={f.id} className="text-[10px] bg-slate-950/50 p-1.5 rounded border border-cyan-500/10">
                  <div className="text-cyan-200 font-bold">{f.name}</div>
                  <div className="text-cyan-400/70 font-sans italic">{f.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-cyan-400/50 italic">No specific functions documented</div>
          )}
        </Section>

        <Section title="CONNECTIONS" icon={Zap} defaultOpen={true}>
          {connectedTo.length > 0 ? (
            <div className="space-y-1">
              {connectedTo.map(c => {
                const otherId = c.sourceComponentId === selectedComp.id ? c.targetComponentId : c.sourceComponentId;
                const otherComp = twin.components.find(comp => comp.id === otherId);
                const isSource = c.sourceComponentId === selectedComp.id;
                return (
                  <div key={c.id} className="text-[10px] bg-slate-950/50 p-1.5 rounded border border-cyan-500/10 flex justify-between items-center">
                    <span className="text-cyan-400/80">{c.type}</span>
                    <span className="text-cyan-200 font-bold flex items-center gap-1">
                      {isSource ? '→ ' : '← '} {otherComp?.name || otherId}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="text-[10px] text-cyan-400/50 italic">No verified connections</div>
          )}
        </Section>

        {selectedComp.specifications && Object.keys(selectedComp.specifications).length > 0 && (
          <Section title="SPECIFICATIONS" icon={Sliders} defaultOpen={false}>
             <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
               {Object.entries(selectedComp.specifications).map(([k,v]) => (
                 <React.Fragment key={k}>
                   <span className="text-cyan-400/70 truncate">{k}:</span>
                   <span className="text-cyan-200 font-bold text-right truncate" title={v as string}>{v as string}</span>
                 </React.Fragment>
               ))}
             </div>
          </Section>
        )}

        <Section title="DIAGNOSTICS" icon={ShieldCheck} defaultOpen={false}>
           <div className="text-[10px] flex items-center justify-between p-1.5 bg-slate-950/50 rounded border border-cyan-500/10">
              <span className="text-cyan-400/70">Status:</span>
              <div className="flex items-center">
                <span className="text-cyan-200 font-bold">{selectedComp.diagnosticState?.status || 'UNKNOWN'}</span>
                <ProvenanceBadge source={selectedComp.diagnosticState?.source || 'UNKNOWN'} />
              </div>
           </div>
           <p className="text-[9px] text-cyan-400/60 mt-1 italic font-sans">{selectedComp.diagnosticState?.explanation || 'No verified diagnostic data available'}</p>
        </Section>
        
        <div className="mt-2 text-right">
            <span className="text-[9px] text-cyan-500/50">Component Data Provenance:</span>
            <ProvenanceBadge source={twin.dataProvenance} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center justify-between bg-cyan-950/30 p-2 rounded border border-cyan-500/20 mb-2">
        <span className="font-bold text-white truncate">{twin.name}</span>
        <ProvenanceBadge source={twin.dataProvenance} />
      </div>
      <Section title="IDENTITY" icon={Layers} defaultOpen={true}>
        <p className="text-[10px] text-cyan-300/80 leading-relaxed font-sans">{twin.description || 'System overview not available'}</p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] mt-2 border-t border-cyan-500/20 pt-2">
           <span className="text-cyan-400/70">Domain:</span>
           <span className="text-cyan-200 font-bold text-right">{twin.domain}</span>
           <span className="text-cyan-400/70">Subsystems:</span>
           <span className="text-cyan-200 font-bold text-right">{twin.components.length}</span>
        </div>
      </Section>

      <Section title="FUNCTION" icon={Activity} defaultOpen={true}>
        {twin.functions.length > 0 ? (
          <div className="space-y-2">
            {twin.functions.map(f => (
              <div key={f.id} className="text-[10px] bg-slate-950/50 p-2 rounded border border-cyan-500/10">
                <div className="font-bold text-cyan-200 mb-1">{f.name}</div>
                <div className="text-cyan-300/70 font-sans">{f.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[10px] text-cyan-400/50 italic">No verified functions documented</div>
        )}
      </Section>
    </div>
  );
};
"""

with open('src/DigitalTwinInspector.tsx', 'w') as f:
    f.write(content)

