import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Paperclip, Settings, X } from 'lucide-react';
import { SystemState } from './App';
import { AudioSpectrumBar } from './AudioSpectrumBar';

import { HandTrackingData } from './useHandTracking';

export function InputArea({ onSend, systemState, setSystemState, setView, currentView, audioLevel = 0, wakeWordEnergy = 0, handTracking }: { 
  onSend: (text: string, file?: {name: string, content: string, isImage?: boolean, mimeType?: string} | null) => void, 
  systemState: SystemState,
  setSystemState: (state: SystemState) => void,
  setView: (v: string) => void,
  currentView?: string,
  audioLevel?: number,
  wakeWordEnergy?: number,
  handTracking?: HandTrackingData
}) {
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<{name: string, content: string, isImage?: boolean, mimeType?: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((systemState === 'ONLINE' || systemState === 'SPEAKING' || systemState === 'LISTENING') && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 10);
    }
  }, [systemState]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.target !== textInputRef.current) {
          return;
        }
      }

      if (e.key === '/' || (e.key === 'Enter' && e.target !== textInputRef.current)) {
        if (e.key === '/') {
          e.preventDefault();
        }
        textInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSend = () => {
    let finalMessage = input.trim();
    if (finalMessage || attachedFile) {
      try {
        if (window.speechSynthesis) {
          const unlockUtterance = new SpeechSynthesisUtterance('');
          unlockUtterance.volume = 0;
          window.speechSynthesis.speak(unlockUtterance);
        }
      } catch(e) {
        // Ignore unlock errors
      }
      onSend(finalMessage, attachedFile);
      setInput('');
      setAttachedFile(null);
    }
  };

  const toggleMic = () => {
    if (systemState === 'LISTENING') setSystemState('ONLINE');
    else setSystemState('LISTENING');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      if (file.type.startsWith('image/')) {
        reader.onload = (event) => {
          setAttachedFile({
            name: file.name,
            content: event.target?.result as string,
            isImage: true,
            mimeType: file.type
          });
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          setAttachedFile({
            name: file.name,
            content: event.target?.result as string || '',
            isImage: false,
            mimeType: file.type
          });
        };
        reader.readAsText(file);
      }
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="absolute bottom-2 sm:bottom-4 lg:bottom-7 left-1/2 -translate-x-1/2 w-full max-w-3xl px-3 sm:px-4 pointer-events-auto flex flex-col gap-2 z-20">
      {attachedFile && (
        <div className="self-start flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-800 shadow-sm">
          <Paperclip size={12} />
          <span>{attachedFile.name}</span>
          <button onClick={() => setAttachedFile(null)} className="hover:text-red-400 ml-2">
            <X size={14} />
          </button>
        </div>
      )}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-cyan-400/10 to-cyan-500/20 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-500"></div>
        <div className="relative flex items-center gap-2 bg-slate-950/80 backdrop-blur-xl border border-sky-200/20 rounded-2xl p-2 shadow-[0_18px_55px_rgba(0,0,0,0.22)]">
          
          <button type="button" aria-label="Attach a file" title="Attach a file"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-cyan-100/70 transition-colors hover:bg-white/[0.06] hover:text-cyan-100"
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept=".txt,.md,.json,.csv,.js,.ts,.html,.css,image/*"
          />
          
          <input
            type="text"
            ref={textInputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            aria-label="Ask ADVIS" placeholder="Ask ADVIS to explore, explain, or investigate…"
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 tracking-wider text-sm font-mono"
            disabled={systemState === 'THINKING' || systemState === 'SEARCHING' || systemState === 'ANALYZING'}
          />
          
          <div className="relative flex items-center justify-center">
            {systemState === 'ONLINE' && wakeWordEnergy > 5 && (
              <div 
                className="absolute inset-0 bg-cyan-400 rounded-lg blur-md transition-opacity duration-75 pointer-events-none"
                style={{ opacity: Math.min(wakeWordEnergy / 100, 0.8) }}
              />
            )}
            <button type="button" aria-label={systemState === 'LISTENING' ? 'Stop voice input' : 'Start voice input'} title={systemState === 'LISTENING' ? 'Stop voice input' : 'Start voice input'} aria-pressed={systemState === 'LISTENING'}
              onClick={toggleMic}
              className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
                systemState === 'LISTENING' 
                  ? 'bg-blue-100 text-blue-800 shadow-[0_0_15px_rgba(40,100,232,0.18)] animate-pulse' 
                  : 'text-slate-400 hover:text-blue-700 hover:bg-cyan-500/10'
              }`}
            >
              <Mic size={20} />
            </button>
          </div>

          <button type="button" aria-label="Send command" title="Send command"
            onClick={handleSend}
            disabled={(!input.trim() && !attachedFile) || systemState === 'THINKING' || systemState === 'SEARCHING' || systemState === 'ANALYZING'}
            className="flex h-10 w-10 shrink-0 items-center justify-center bg-blue-600/10 text-blue-700 rounded-xl hover:bg-blue-600/15 hover:shadow-[0_6px_18px_rgba(40,100,232,0.16)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
          
        </div>
      </div>
      
      <AudioSpectrumBar audioLevel={audioLevel} systemState={systemState} />
            <div className="flex justify-between items-center mt-2 px-2">
        <div className="flex gap-4 text-[10px] font-mono tracking-widest items-center">
          <div className="flex items-center gap-2 border border-blue-100 px-2.5 py-1.5 rounded-full bg-white/85">
             {systemState === 'ONLINE' && <><div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-pulse"></div><span className="text-slate-600">READY</span></>}
             {systemState === 'LISTENING' && <><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.8)] animate-pulse"></div><span className="text-blue-700 font-bold">LISTENING...</span></>}
             {systemState === 'THINKING' && <><div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"></div><span className="text-orange-400">PROCESSING...</span></>}
             {systemState === 'SEARCHING' && <><div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse"></div><span className="text-blue-400 font-bold">SEARCHING...</span></>}
             {systemState === 'ANALYZING' && <><div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)] animate-pulse"></div><span className="text-purple-400 font-bold">ANALYZING VISUAL DATA...</span></>}
             {systemState === 'SPEAKING' && <><div className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse"></div><span className="text-blue-700">SPEAKING...</span></>}
             {systemState === 'ERROR' && <><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div><span className="text-red-500">ERROR</span></>}
             {systemState === 'BOOTING' && <><div className="w-1.5 h-1.5 rounded-full bg-cyan-800"></div><span className="text-cyan-800">BOOTING...</span></>}
             {systemState === 'CONNECTING' && <><div className="w-1.5 h-1.5 rounded-full bg-cyan-800"></div><span className="text-cyan-800">CONNECTING...</span></>}
          </div>
          {handTracking && handTracking.state !== 'OFF' && (
            <div className="flex items-center gap-2 border border-blue-100 px-2.5 py-1.5 rounded-full bg-white/85">
              {handTracking.state === 'SEARCHING' && <><div className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse"></div><span className="text-cyan-600">VISION: SEARCHING</span></>}
              {handTracking.state === 'TRACKING' && (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
                  <span className="text-blue-700 font-bold">
                    {handTracking.gesture === 'FIST' ? 'CONTROL LOCKED' : (handTracking.gesture === 'NONE' ? 'VISION ACTIVE' : 'INTERACTION ACTIVE')}
                  </span>
                </>
              )}
              {handTracking.state === 'LOST' && <><div className="w-1.5 h-1.5 rounded-full bg-red-900"></div><span className="text-red-900">VISION: LOST</span></>}
            </div>
          )}
        </div>

        <button type="button" aria-label="Open settings" title="Open settings"
          onClick={() => setView('settings')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-cyan-100"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}
