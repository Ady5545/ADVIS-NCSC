import React, { useState, useEffect } from 'react';
import { X, BrainCircuit, History, FolderOpen, MonitorSmartphone, Settings2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './App';

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
  setCvEnabled
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
  setCvEnabled?: (val: boolean) => void
}) {
  const [deviceMemory, setDeviceMemory] = useState<number | string>('UNKNOWN');
  const [cores, setCores] = useState<number | string>('UNKNOWN');
  const [userAgent, setUserAgent] = useState('');
  const [onLine, setOnLine] = useState(true);
  const [perfTime, setPerfTime] = useState(0);
  const [latency, setLatency] = useState<number | string>('...');
  const [batteryLevel, setBatteryLevel] = useState<string>('AC POWER');

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setDeviceMemory((navigator as any).deviceMemory || 'UNKNOWN');
      setCores(navigator.hardwareConcurrency || 'UNKNOWN');
      setUserAgent(navigator.userAgent);
      setOnLine(navigator.onLine);
      
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        setLatency(conn.rtt !== undefined ? conn.rtt : '...');
      }

      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          setBatteryLevel(`${Math.round(battery.level * 100)}%`);
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(`${Math.round(battery.level * 100)}%`);
          });
        });
      }
    }
    
    const interval = setInterval(() => {
      setPerfTime(performance.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (currentView === 'home') return null;

  const renderContent = () => {
    switch (currentView) {
      case 'memory':
        return (
          <div className="flex flex-col gap-4">
            <h3 className="text-cyan-400 font-bold mb-2">MEMORY CORE DIAGNOSTICS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/50 p-4 rounded border border-cyan-500/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all">
                <div className="text-cyan-500/50 text-xs mb-1">ALLOCATED RAM</div>
                <div className="text-xl text-cyan-300">{deviceMemory} GB / 64 GB</div>
                <div className="w-full h-1 bg-cyan-950 mt-2 rounded overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: typeof deviceMemory === 'number' ? `${(deviceMemory / 64) * 100}%` : '50%' }} />
                </div>
              </div>
              <div className="bg-black/50 p-4 rounded border border-cyan-500/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all">
                <div className="text-cyan-500/50 text-xs mb-1">LOGICAL CORES</div>
                <div className="text-xl text-cyan-300">{cores} THREADS</div>
                <div className="w-full h-1 bg-cyan-950 mt-2 rounded overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: typeof cores === 'number' ? `${(cores / 32) * 100}%` : '50%' }} />
                </div>
              </div>
            </div>
            <div className="bg-black/50 p-4 rounded border border-cyan-500/20 mt-4 flex-1">
              <div className="text-cyan-500/50 text-xs mb-2">RECENT MEMORY ENGRAMS</div>
              <ul className="space-y-2 text-sm text-cyan-100/80">
                {messages.slice(-5).reverse().map((msg, idx) => (
                  <li key={idx} className="flex justify-between border-b border-cyan-500/10 pb-1 hover:text-cyan-300 transition-colors">
                    <span className="truncate max-w-[70%]">{msg.content.substring(0, 50)}...</span>
                    <span className="text-cyan-500/50 shrink-0">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </li>
                ))}
                {messages.length === 0 && <li className="text-cyan-500/50">NO ENGRAMS FOUND</li>}
              </ul>
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="flex flex-col gap-4 h-full">
            <h3 className="text-cyan-400 font-bold mb-2">SYSTEM AUDIT LOGS</h3>
            <div className="bg-black/50 p-4 rounded border border-cyan-500/20 font-mono text-xs text-cyan-300/80 overflow-y-auto h-full flex-1 space-y-2">
              <div>[{new Date(Date.now() - perfTime).toLocaleTimeString()}] SYSTEM BOOT INITIATED</div>
              <div>[{new Date(Date.now() - perfTime + 5000).toLocaleTimeString()}] NEURAL PLEXUS ONLINE</div>
              {messages.map((msg, idx) => (
                <div key={idx} className="hover:text-cyan-100 transition-colors">
                  [{new Date(msg.timestamp).toLocaleTimeString()}] {msg.role === 'user' ? 'USER INPUT' : 'SYSTEM RESPONSE'} : {msg.content.substring(0, 40)}...
                </div>
              ))}
            </div>
          </div>
        );
      case 'projects':
        return (
          <div className="flex flex-col gap-4">
            <h3 className="text-cyan-400 font-bold mb-2">ACTIVE DIRECTORIES</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/50 p-4 rounded border border-cyan-500/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all cursor-pointer">
                <div className="text-cyan-400 text-lg mb-1">APP.TSX</div>
                <div className="text-cyan-500/50 text-xs mb-2">MAIN RENDER THREAD</div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-400">STATUS: ACTIVE</span>
                  <span className="text-cyan-300">100%</span>
                </div>
              </div>
              <div className="bg-black/50 p-4 rounded border border-cyan-500/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all cursor-pointer">
                <div className="text-cyan-400 text-lg mb-1">HOLOGRAM_CORE.TSX</div>
                <div className="text-cyan-500/50 text-xs mb-2">WEBGL RENDERER</div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-400">STATUS: ACTIVE</span>
                  <span className="text-cyan-300">100%</span>
                </div>
              </div>
              <div className="bg-black/50 p-4 rounded border border-cyan-500/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all cursor-pointer">
                <div className="text-cyan-400 text-lg mb-1">SERVER.JS</div>
                <div className="text-cyan-500/50 text-xs mb-2">EXPRESS PROXY & LLM INTERFACE</div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-400">STATUS: LISTENING (PORT 3000)</span>
                  <span className="text-cyan-300">100%</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'devices':
        return (
          <div className="flex flex-col gap-4">
            <h3 className="text-cyan-400 font-bold mb-2">CONNECTED DEVICES</h3>
            <div className="space-y-3">
              <div className="bg-black/50 p-3 rounded border border-cyan-500/20 flex justify-between items-center hover:bg-cyan-900/30 transition-colors">
                <div className="flex items-center gap-3">
                  <MonitorSmartphone size={20} className="text-cyan-400" />
                  <div>
                    <div className="text-cyan-100 truncate max-w-[200px]" title={userAgent}>{userAgent.split(' ')[0]} {userAgent.split(' ')[1]}</div>
                    <div className="text-cyan-500/50 text-xs">CURRENT UPLINK</div>
                  </div>
                </div>
                <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-400/10 rounded">CONNECTED</span>
              </div>
              <div className="bg-black/50 p-3 rounded border border-cyan-500/20 flex justify-between items-center hover:bg-cyan-900/30 transition-colors">
                <div className="flex items-center gap-3">
                  <MonitorSmartphone size={20} className="text-cyan-400" />
                  <div>
                    <div className="text-cyan-100">GLOBAL SAT-NET</div>
                    <div className="text-cyan-500/50 text-xs">AERIAL COMMAND</div>
                  </div>
                </div>
                <span className={onLine ? "text-green-400 text-xs font-bold px-2 py-1 bg-green-400/10 rounded" : "text-red-400 text-xs font-bold px-2 py-1 bg-red-400/10 rounded"}>
                  {onLine ? "CONNECTED" : "OFFLINE"}
                </span>
              </div>
            </div>
          </div>
        );
      case 'status':
        return (
          <div className="flex flex-col gap-4">
            <h3 className="text-cyan-400 font-bold mb-2">FULL SYSTEM DIAGNOSTICS</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-black/50 p-4 rounded border border-cyan-500/20 text-center hover:scale-[1.05] hover:border-cyan-400 transition-all">
                <div className="text-cyan-500/50 text-xs mb-1">UPTIME</div>
                <div className="text-2xl text-cyan-300">{(perfTime / 1000).toFixed(0)}s</div>
              </div>
              <div className="bg-black/50 p-4 rounded border border-cyan-500/20 text-center hover:scale-[1.05] hover:border-cyan-400 transition-all">
                <div className="text-cyan-500/50 text-xs mb-1">NETWORK</div>
                <div className={onLine ? "text-2xl text-green-400" : "text-2xl text-red-400"}>{onLine ? 'NOMINAL' : 'OFFLINE'}</div>
              </div>
              <div className="bg-black/50 p-4 rounded border border-cyan-500/20 text-center hover:scale-[1.05] hover:border-cyan-400 transition-all">
                <div className="text-cyan-500/50 text-xs mb-1">LATENCY</div>
                <div className="text-2xl text-cyan-300">{latency}ms</div>
              </div>
              <div className="bg-black/50 p-4 rounded border border-cyan-500/20 text-center hover:scale-[1.05] hover:border-cyan-400 transition-all">
                <div className="text-cyan-500/50 text-xs mb-1">POWER CORE</div>
                <div className="text-2xl text-green-400">{batteryLevel}</div>
              </div>
            </div>
            <div className="bg-black/50 p-4 rounded border border-cyan-500/20">
              <div className="text-cyan-500/50 text-xs mb-2">SUBSYSTEMS OVERVIEW</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm hover:bg-cyan-900/30 px-2 py-1 rounded transition-colors"><span className="text-cyan-100">LLM INFERENCE</span><span className="text-green-400">NOMINAL</span></div>
                <div className="flex justify-between items-center text-sm hover:bg-cyan-900/30 px-2 py-1 rounded transition-colors"><span className="text-cyan-100">WEBGL CANVAS</span><span className="text-green-400">NOMINAL</span></div>
                <div className="flex justify-between items-center text-sm hover:bg-cyan-900/30 px-2 py-1 rounded transition-colors"><span className="text-cyan-100">SPEECH SYNTHESIS</span><span className="text-green-400">NOMINAL</span></div>
                <div className="flex justify-between items-center text-sm hover:bg-cyan-900/30 px-2 py-1 rounded transition-colors"><span className="text-cyan-100">AUDIO ANALYSIS</span><span className="text-green-400">NOMINAL</span></div>
              </div>
            </div>
          </div>
        );
            case 'settings':
        return (
          <div className="flex flex-col gap-4">
            <h3 className="text-cyan-400 font-bold mb-2">SYSTEM PREFERENCES</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-4 hover:bg-cyan-900/20 p-2 rounded transition-colors">
                <div>
                  <div className="text-cyan-100 text-sm">Hologram Color</div>
                  <div className="text-cyan-500/50 text-xs">Select ambient projection color.</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setThemeColor && setThemeColor('#22d3ee')} className={`w-6 h-6 rounded-full bg-[#22d3ee] ${themeColor === '#22d3ee' ? 'ring-2 ring-white scale-110' : 'opacity-50'} transition-all`} title="Stark Blue" />
                  <button onClick={() => setThemeColor && setThemeColor('#fb923c')} className={`w-6 h-6 rounded-full bg-[#fb923c] ${themeColor === '#fb923c' ? 'ring-2 ring-white scale-110' : 'opacity-50'} transition-all`} title="Arc Reactor Orange" />
                  <button onClick={() => setThemeColor && setThemeColor('#ef4444')} className={`w-6 h-6 rounded-full bg-[#ef4444] ${themeColor === '#ef4444' ? 'ring-2 ring-white scale-110' : 'opacity-50'} transition-all`} title="Stealth Red" />
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-4 hover:bg-cyan-900/20 p-2 rounded transition-colors">
                <div>
                  <div className="text-cyan-100 text-sm">Holographic Projection Density</div>
                  <div className="text-cyan-500/50 text-xs">Adjust the opacity of the 3D core interface.</div>
                </div>
                <input type="range" min="0" max="100" defaultValue="80" className="accent-cyan-400 cursor-pointer hover:scale-110 transition-transform" />
              </div>
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-4 hover:bg-cyan-900/20 p-2 rounded transition-colors">
                <div>
                  <div className="text-cyan-100 text-sm">Hologram Intensity</div>
                  <div className="text-cyan-500/50 text-xs">Scales the bloom effect and emission color brightness.</div>
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
                  <div className="text-cyan-100 text-sm">Voice Feedback</div>
                  <div className="text-cyan-500/50 text-xs">Toggle auditory responses from A.D.V.I.S.</div>
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
                  <div className="text-cyan-500/50 text-xs">Adjust the speed of A.D.V.I.S. voice output ({speechRate?.toFixed(2)}x).</div>
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
                  <div className="text-cyan-500/50 text-xs">Enable camera to track hand movements and gestures.</div>
                </div>
                <div 
                  onClick={() => setCvEnabled && setCvEnabled(!cvEnabled)}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${cvEnabled ? 'bg-cyan-600/50 shadow-[0_0_10px_rgba(0,255,255,0.3)]' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${cvEnabled ? 'right-1 bg-cyan-400' : 'left-1 bg-slate-500'}`} />
                </div>
              </div>

              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-4 hover:bg-cyan-900/20 p-2 rounded transition-colors">
                <div>
                  <div className="text-cyan-100 text-sm">Strict Security Mode</div>
                  <div className="text-cyan-500/50 text-xs">Require biometric verification for sensitive commands.</div>
                </div>
                <div 
                  onClick={() => setStrictSecurity && setStrictSecurity(!strictSecurity)}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${strictSecurity ? 'bg-cyan-600/50 shadow-[0_0_10px_rgba(0,255,255,0.3)]' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${strictSecurity ? 'right-1 bg-cyan-400' : 'left-1 bg-slate-500'}`} />
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-6">
                <h4 className="text-red-400 font-bold text-sm tracking-widest border-b border-red-500/20 pb-2">CRITICAL PROTOCOLS</h4>
                
                <div className="flex justify-between items-center bg-red-950/20 border border-red-500/20 p-4 rounded hover:bg-red-900/30 transition-colors">
                  <div>
                    <div className="text-red-400 text-sm font-bold tracking-wider">CLEAN SLATE PROTOCOL</div>
                    <div className="text-red-500/60 text-xs">Purges all local and remote conversational records immediately.</div>
                  </div>
                  <button 
                    onClick={triggerCleanSlate}
                    className="px-4 py-2 bg-red-900/50 hover:bg-red-500 text-red-200 hover:text-black text-xs font-bold tracking-widest transition-colors rounded border border-red-500/50"
                  >
                    INITIATE
                  </button>
                </div>
                
                <div className="flex justify-between items-center bg-red-950/20 border border-red-500/20 p-4 rounded hover:bg-red-900/30 transition-colors">
                  <div>
                    <div className="text-red-400 text-sm font-bold tracking-wider">BARN DOOR PROTOCOL</div>
                    <div className="text-red-500/60 text-xs">Engages global lockdown and restricts all interface access.</div>
                  </div>
                  <button 
                    onClick={triggerBarnDoor}
                    className="px-4 py-2 bg-red-900/50 hover:bg-red-500 text-red-200 hover:text-black text-xs font-bold tracking-widest transition-colors rounded border border-red-500/50"
                  >
                    LOCKDOWN
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

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 pointer-events-auto"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-4xl max-h-full bg-black/80 border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,255,255,0.15)] flex flex-col overflow-hidden"
        >
          <div className="flex justify-between items-center p-4 border-b border-cyan-500/30 bg-cyan-950/20">
            <h2 className="text-xl font-mono tracking-widest text-cyan-400 uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">
              {currentView} MODULE
            </h2>
            <button onClick={() => setView('home')} className="text-cyan-500/50 hover:text-cyan-400 transition-colors bg-cyan-500/10 hover:bg-cyan-500/20 p-2 rounded-lg">
              <X size={20} />
            </button>
          </div>
          <div className="p-8 overflow-y-auto flex-1 font-mono custom-scrollbar">
            {renderContent()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
