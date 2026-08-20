import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WeatherWidget } from './WeatherWidget';

function Panel({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="relative bg-black/30 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-5 pointer-events-auto shadow-[0_0_30px_rgba(0,255,255,0.08)] w-64 overflow-hidden group">
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400 group-hover:border-cyan-300 transition-colors" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400 group-hover:border-cyan-300 transition-colors" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400 group-hover:border-cyan-300 transition-colors" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400 group-hover:border-cyan-300 transition-colors" />
      
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,1)]" />
        <div className="text-[11px] text-cyan-300 font-mono tracking-[0.2em] uppercase font-semibold">{title}</div>
      </div>
      
      <div className="relative z-10">
        {children}
      </div>
      
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
    </div>
  );
}

import { HandTrackingData } from './useHandTracking';

export function SystemPanels({ side, handTracking }: { side: 'left' | 'right', handTracking?: HandTrackingData }) {
  const [time, setTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [downlink, setDownlink] = useState(0);
  const [rtt, setRtt] = useState(0);
  const [memUsage, setMemUsage] = useState(50);
  const [cpuFake, setCpuFake] = useState(20);
  const [quantumState, setQuantumState] = useState(0.999);

  const [browserInfo, setBrowserInfo] = useState('');
  const [micStatus, setMicStatus] = useState<'INACTIVE' | 'ACTIVE' | 'DENIED'>('INACTIVE');
  const [isCharging, setIsCharging] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [temp, setTemp] = useState<number | null>(null);

  useEffect(() => {
    // Get browser info
    const ua = navigator.userAgent;
    let browser = "UNKNOWN";
    if(ua.includes("Firefox")) browser = "FIREFOX";
    else if(ua.includes("Chrome")) browser = "CHROME";
    else if(ua.includes("Safari")) browser = "SAFARI";
    else if(ua.includes("Edge")) browser = "EDGE";
    setBrowserInfo(browser);

    const timer = setInterval(() => {
      setTime(new Date());
      
      const p = performance as any;
      if (p && p.memory) {
        setMemUsage(Math.round((p.memory.usedJSHeapSize / p.memory.jsHeapSizeLimit) * 100));
      }
    }, 1000);

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      setDownlink(conn.downlink || 0);
      setRtt(conn.rtt || 0);
      conn.addEventListener('change', () => {
        setDownlink(conn.downlink || 0);
        setRtt(conn.rtt || 0);
      });
    }

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level * 100);
        setIsCharging(battery.charging);
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level * 100);
        });
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      });
    }
    
    // check mic permissions
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
        if(permissionStatus.state === 'granted') setMicStatus('ACTIVE');
        else if (permissionStatus.state === 'denied') setMicStatus('DENIED');
        else setMicStatus('INACTIVE');
        
        permissionStatus.onchange = () => {
           if(permissionStatus.state === 'granted') setMicStatus('ACTIVE');
           else if (permissionStatus.state === 'denied') setMicStatus('DENIED');
           else setMicStatus('INACTIVE');
        };
      }).catch(() => {
         setMicStatus('INACTIVE');
      });
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });
          try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const data = await res.json();
            if (data.current_weather) {
              setTemp(data.current_weather.temperature);
            }
          } catch (err) {
            console.warn("fetch warn:", (err as Error).message);
          }
        },
        (err) => console.warn("geo warn:", err.message)
      );
    }

    return () => clearInterval(timer);
  }, []);

  if (side === 'left') {
    return (
      <div className="flex flex-col gap-6 z-10 shrink-0">
        <Panel title="Core Processing">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-[10px] text-cyan-200 font-mono mb-1.5 tracking-wider">
                <span>AI CONNECTION</span>
                <span className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]">ESTABLISHED</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-[10px] text-cyan-200 font-mono mb-1.5 tracking-wider">
                <span>MEMORY ALLOCATION</span>
                <span className="text-cyan-400">{memUsage}%</span>
              </div>
              <div className="h-1.5 bg-cyan-950/50 rounded-full overflow-hidden border border-cyan-500/20">
                <motion.div className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" animate={{ width: `${memUsage}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
              </div>
            </div>
            
            <div className="pt-2 border-t border-cyan-500/20">
               <div className="flex justify-between text-[10px] text-cyan-200 font-mono tracking-wider">
                 <span>MICROPHONE</span>
                 <span className={micStatus === 'ACTIVE' ? "text-green-400" : micStatus === 'DENIED' ? "text-red-400" : "text-yellow-400"}>
                   {micStatus}
                 </span>
               </div>
            </div>
          </div>
        </Panel>

        <Panel title="Atmospherics">
          <WeatherWidget />
        </Panel>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 z-10 shrink-0">
      <Panel title="Chronos Sync">
        <div className="flex flex-col items-center py-2">
          <div className="text-4xl text-white font-mono tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm text-cyan-400 font-mono tracking-[0.3em] mt-1">
            {time.getSeconds().toString().padStart(2, '0')}
          </div>
          <div className="text-[10px] text-cyan-500/70 font-mono tracking-widest mt-3 uppercase border-t border-cyan-500/20 pt-2 w-full text-center">
            {time.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </Panel>

      <Panel title="System Status">
        <div className="flex flex-col gap-3 py-1">
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider">
            <span className="text-cyan-500/80">FRAMEWORK</span>
            <span className="text-cyan-200 truncate max-w-[100px] text-right" title={navigator.platform}>
              {/* @ts-ignore */}
              {navigator.userAgentData?.platform || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 0 ? 'iPad' : navigator.platform === 'MacIntel' ? 'macOS (ARM/x86)' : navigator.platform)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider">
            <span className="text-cyan-500/80">BROWSER</span>
            <span className="text-cyan-200 truncate max-w-[100px] text-right">{browserInfo}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider">
            <span className="text-cyan-500/80">COORDINATES</span>
            <span className="text-cyan-200">
              {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'LOCATING...'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider">
            <span className="text-cyan-500/80">LOCAL TEMP</span>
            <span className="text-cyan-200">
              {temp !== null ? `${Math.round(temp)}°C` : 'SENSING...'}
            </span>
          </div>
        </div>
      </Panel>
      
      <Panel title="Energy Matrix">
        <div className="relative w-32 h-32 mx-auto my-2">
          {/* Decorative outer ring */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border border-cyan-500/20 border-dashed animate-[spin_15s_linear_infinite_reverse]" />
          
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="50" fill="none" stroke="rgba(0,255,255,0.05)" strokeWidth="6" />
            <circle 
              cx="64" 
              cy="64" 
              r="50" 
              fill="none" 
              stroke="url(#gradient)" 
              strokeWidth="6" 
              strokeDasharray="314.15" 
              strokeDashoffset={314.15 - (314.15 * batteryLevel) / 100} 
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] transition-all duration-1000" 
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isCharging ? "#4ade80" : "#00ffff"} />
                <stop offset="100%" stopColor={isCharging ? "#22c55e" : "#0066ff"} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl text-white font-mono drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
              {Math.round(batteryLevel)}<span className="text-sm text-cyan-400">%</span>
            </span>
            <span className="text-[8px] text-cyan-500 font-mono tracking-widest mt-1">
              {isCharging ? 'CHARGING' : 'CAPACITY'}
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

