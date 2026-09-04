import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HandTrackingData } from './useHandTracking';
import { SPATIAL_LIBRARY } from './SpatialLibrary';
import { LearningSession } from './LearnEngine/LearnTypes';

function Panel({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-5 pointer-events-auto shadow-[0_0_30px_rgba(0,255,255,0.08)] w-64 overflow-hidden group">
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400 group-hover:border-cyan-300 transition-colors" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400 group-hover:border-cyan-300 transition-colors" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400 group-hover:border-cyan-300 transition-colors" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400 group-hover:border-cyan-300 transition-colors" />
      
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,1)]" />
        <div className="text-[11px] text-cyan-300 font-mono tracking-[0.2em] uppercase font-semibold">{title}</div>
      </div>
      
      <div className="relative z-10 font-mono">
        {children}
      </div>
      
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
    </div>
  );
}

export function SystemPanels({ 
  side, 
  handTracking,
  activeSpatialObject,
  activeLearningSession,
  spatialMode = 'INSPECTION',
  isExploded = false,
  selectedComponentId = null,
  cvEnabled = false
}: { 
  side: 'left' | 'right', 
  handTracking?: HandTrackingData,
  activeSpatialObject?: string | string[] | null,
  activeLearningSession?: LearningSession | null,
  spatialMode?: string,
  isExploded?: boolean,
  selectedComponentId?: string | null,
  cvEnabled?: boolean
}) {
  const [time, setTime] = useState(new Date());
  const [micStatus, setMicStatus] = useState<'INACTIVE' | 'ACTIVE' | 'DENIED'>('INACTIVE');
  const [sessionUptime, setSessionUptime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setSessionUptime(prev => prev + 1);
    }, 1000);

    // Check mic permissions
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
        if (permissionStatus.state === 'granted') setMicStatus('ACTIVE');
        else if (permissionStatus.state === 'denied') setMicStatus('DENIED');
        else setMicStatus('INACTIVE');
        
        permissionStatus.onchange = () => {
          if (permissionStatus.state === 'granted') setMicStatus('ACTIVE');
          else if (permissionStatus.state === 'denied') setMicStatus('DENIED');
          else setMicStatus('INACTIVE');
        };
      }).catch(() => {
        setMicStatus('INACTIVE');
      });
    }

    return () => clearInterval(timer);
  }, []);

  const activeTargetName = activeLearningSession 
    ? `Lesson: ${activeLearningSession.context?.entity || activeLearningSession.context?.topic}` 
    : (Array.isArray(activeSpatialObject)
        ? activeSpatialObject.map(id => SPATIAL_LIBRARY[id]?.name || id).join(', ')
        : (activeSpatialObject ? SPATIAL_LIBRARY[activeSpatialObject]?.name || activeSpatialObject : 'Hologram Core (Idle)'));

  if (side === 'left') {
    return (
      <div className="flex flex-col gap-6 z-10 shrink-0">
        <Panel title="Spatial Telemetry">
          <div className="flex flex-col gap-3 text-xs">
            <div>
              <div className="text-[10px] text-cyan-500/70 uppercase">ACTIVE TARGET</div>
              <div className="text-cyan-200 font-semibold truncate" title={activeTargetName}>
                {activeTargetName}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-cyan-500/70 uppercase">SPATIAL MODE</div>
              <div className="text-cyan-300">
                {spatialMode}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-cyan-500/70 uppercase">ASSEMBLY STATE</div>
              <div className={isExploded ? "text-amber-300 font-semibold" : "text-cyan-400"}>
                {isExploded ? 'EXPLODED VIEW' : 'NOMINAL (COLLAPSED)'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-cyan-500/70 uppercase">SELECTED NODE</div>
              <div className="text-cyan-200 truncate" title={selectedComponentId || 'None'}>
                {selectedComponentId || 'WHOLE ASSEMBLY'}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Vision & Gestures">
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-cyan-500/70 uppercase">CAMERA TRACKING</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cvEnabled ? 'text-green-400 bg-green-950/40 border border-green-500/30' : 'text-cyan-500/60 bg-black/40'}`}>
                {cvEnabled ? 'ACTIVE' : 'OFF'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-cyan-500/70 uppercase">HAND DETECTION</span>
              <span className={(handTracking?.handsDetected ?? 0) > 0 ? "text-green-400 font-semibold" : "text-yellow-400/80"}>
                {(handTracking?.handsDetected ?? 0) > 0 ? 'LOCKED' : (cvEnabled ? 'TRACKING...' : 'STANDBY')}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-cyan-500/70 uppercase">ACTIVE GESTURE</span>
              <span className="text-cyan-200 font-bold px-1.5 py-0.5 bg-cyan-950/40 rounded border border-cyan-500/30">
                {handTracking?.gesture || 'NONE'}
              </span>
            </div>

            <div className="pt-2 border-t border-cyan-500/20 flex justify-between items-center">
              <span className="text-[10px] text-cyan-500/70 uppercase">AUDIO INPUT</span>
              <span className={micStatus === 'ACTIVE' ? "text-green-400 font-semibold" : micStatus === 'DENIED' ? "text-red-400" : "text-yellow-400"}>
                {micStatus}
              </span>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  const formatUptime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="flex flex-col gap-6 z-10 shrink-0">
      <Panel title="Session Sync">
        <div className="flex flex-col items-center py-1">
          <div className="text-3xl text-white font-mono tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs text-cyan-400 font-mono tracking-[0.3em] mt-1">
            {time.getSeconds().toString().padStart(2, '0')}
          </div>
          <div className="text-[10px] text-cyan-500/70 font-mono tracking-widest mt-2 uppercase border-t border-cyan-500/20 pt-2 w-full text-center">
            {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div className="flex justify-between w-full text-[10px] text-cyan-400/80 mt-2 pt-1 border-t border-cyan-500/10">
            <span>UPTIME:</span>
            <span>{formatUptime(sessionUptime)}</span>
          </div>
        </div>
      </Panel>

      <Panel title="Subsystem Pipeline">
        <div className="flex flex-col gap-2 text-xs py-1">
          <div className="flex items-center justify-between">
            <span className="text-cyan-500/80 text-[10px]">3D WEBGL ENGINE</span>
            <span className="text-green-400 text-[11px] font-semibold">ACTIVE (60 FPS)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-cyan-500/80 text-[10px]">MOLECULAR SOLVER</span>
            <span className="text-green-400 text-[11px]">ONLINE</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-cyan-500/80 text-[10px]">KINEMATIC ASSEMBLY</span>
            <span className="text-green-400 text-[11px]">ONLINE</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-cyan-500/80 text-[10px]">AI SCIENTIFIC CORE</span>
            <span className="text-green-400 text-[11px]">READY</span>
          </div>
        </div>
      </Panel>
      
      <Panel title="Spatial Orientation">
        <div className="relative w-28 h-28 mx-auto my-1 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border border-cyan-500/30 border-dashed animate-[spin_12s_linear_infinite_reverse]" />
          <div className="absolute inset-5 rounded-full border border-cyan-400/40" />
          
          <div className="flex flex-col items-center justify-center z-10">
            <span className="text-cyan-300 font-bold text-xs">
              {(handTracking?.handsDetected ?? 0) > 0 ? 'TRACKING' : 'READY'}
            </span>
            <span className="text-[8px] text-cyan-500/80 tracking-widest mt-0.5 uppercase">
              3D WORKSPACE
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
