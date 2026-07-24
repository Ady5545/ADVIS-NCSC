import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { HologramCore } from './HologramCore';
import { ChatPanel } from './ChatPanel';
import { InputArea } from './InputArea';
import { Sidebar } from './Sidebar';
import { SystemPanels } from './SystemPanels';
import { Background } from './Background';
import { useSpeechRecognition } from './useSpeechRecognition';
import { playStateTransitionSound } from './audioEffects';
import { ViewModal } from './ViewModal';
import { MobileNav } from './MobileNav';
import { Fingerprint, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHandTracking, HandTrackingData } from './useHandTracking';
import { GestureProvider, useGestureEngine } from './GestureContext';
import { SpatialObjectEngine, SpatialMode } from './SpatialObjectEngine';
import { SPATIAL_LIBRARY } from './SpatialLibrary';

function CameraRig({ isSpatial }: { isSpatial?: boolean }) {
  const gestureState = useGestureEngine();
  useFrame((state) => {
    const lerpSpeed = isSpatial ? 0.35 : 0.05;
    state.camera.position.x += (gestureState.cameraTarget.x - state.camera.position.x) * lerpSpeed;
    state.camera.position.y += (gestureState.cameraTarget.y - state.camera.position.y) * lerpSpeed;
    state.camera.position.z += (gestureState.cameraTarget.z - state.camera.position.z) * lerpSpeed;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export type SystemState = 'BOOTING' | 'ONLINE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'OFFLINE' | 'ERROR' | 'CONNECTING' | 'ONLINE_ACTIVE' | 'SEARCHING' | 'ANALYZING';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: { content: string, mimeType: string };
}

import { HolographicCursor } from './HolographicCursor';

export default function App() {
  const [systemState, setSystemState] = useState<SystemState>('BOOTING');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [bass, setBass] = useState(0);
  const [treble, setTreble] = useState(0);
  const [wakeWordEnergy, setWakeWordEnergy] = useState(0);
  const [hologramIntensity, setHologramIntensity] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [themeColor, setThemeColor] = useState('#22d3ee');
  const [speechRate, setSpeechRate] = useState(1.05);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', themeColor);
  }, [themeColor]);

  useEffect(() => {
    if (soundEnabled) {
      playStateTransitionSound(systemState);
    }
  }, [systemState, soundEnabled]);

  useEffect(() => {
    if (wakeWordEnergy > 0) {
      const t = setTimeout(() => setWakeWordEnergy(prev => Math.max(0, prev - 5)), 50);
      return () => clearTimeout(t);
    }
  }, [wakeWordEnergy]);
  const [currentView, setCurrentView] = useState<string>('home');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [strictSecurity, setStrictSecurity] = useState<boolean>(false);
  const [cvEnabled, setCvEnabled] = useState<boolean>(false);
  const handTracking = useHandTracking(cvEnabled);
  
  // Spatial Object Engine State Management
  const [currentSpatialObject, setCurrentSpatialObject] = useState<string | string[] | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [presentationStep, setPresentationStep] = useState<number>(0);
  const [spatialMode, setSpatialMode] = useState<SpatialMode>('INSPECTION');
  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(false);

  const changeSpatialMode = (newMode: SpatialMode) => {
    setSpatialMode(newMode);
    if (newMode === 'INSPECTION') {
      setIsExploded(false);
      setIsPresentationMode(false);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } else if (newMode === 'SHOWCASE') {
      setIsExploded(false);
      setIsPresentationMode(false);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } else if (newMode === 'EXPLODED') {
      setIsExploded(true);
      setIsPresentationMode(false);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } else if (newMode === 'DEMO') {
      setIsExploded(false);
      setIsPresentationMode(true);
      setPresentationStep(0);
    }
  };
  
  const [barnDoorActive, setBarnDoorActive] = useState<boolean>(false);
  
  const [biometricActive, setBiometricActive] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireBiometric = (action: () => void) => {
    if (strictSecurity) {
      setPendingAction(() => action);
      setBiometricActive(true);
    } else {
      action();
    }
  };

  const handleCleanSlate = async () => {
    setMessages([]);
    try {
      await fetch('/api/advis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "clear chat", mode: "normal", deviceId: localStorage.getItem('advis_device_id') })
      });
      if (soundEnabled && window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance("Clean slate protocol engaged, sir. All records expunged.");
        u.rate = speechRate;
        u.pitch = 0.9;
        window.speechSynthesis.speak(u);
      }
    } catch (e: any) {
      console.warn("clean slate warn:", e.message);
    }
  };

  const sessionActiveRef = useRef(false);
  const sessionTimerRef = useRef<any>(null);
  const lastProcessedGestureRef = useRef<string>('NONE');

  useEffect(() => {
    const currentGesture = handTracking.gesture;
    if (currentGesture !== lastProcessedGestureRef.current) {
      if (currentGesture === 'OPEN PALM' && systemState !== 'ONLINE' && systemState !== 'BOOTING') {
        setSystemState('ONLINE');
        sessionActiveRef.current = false;
        if (sessionTimerRef.current) {
          clearTimeout(sessionTimerRef.current);
          sessionTimerRef.current = null;
        }
      } else if (currentGesture === 'CLAP') {
        // Primary reset gesture: CLAP - resets the spatial environment intentionally
        setSelectedComponentId(null);
        setHoveredComponentId(null);
        setIsExploded(false);
        setIsPresentationMode(false);
        setPresentationStep(0);
        
        if (soundEnabled && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance("Spatial environment reset initiated.");
          u.rate = speechRate;
          u.pitch = 1.0;
          window.speechSynthesis.speak(u);
        }
      }
      lastProcessedGestureRef.current = currentGesture;
    }
  }, [handTracking.gesture, systemState, soundEnabled, speechRate]);

  useEffect(() => {
    // Prime speech synthesis voices in Chrome
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
      
      // Unlock speech synthesis on first user interaction (fixes Chrome blocking async speech)
      const unlockSpeech = () => {
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        window.speechSynthesis.speak(u);
        window.removeEventListener('click', unlockSpeech);
        window.removeEventListener('touchstart', unlockSpeech);
        window.removeEventListener('keydown', unlockSpeech);
      };
      window.addEventListener('click', unlockSpeech);
      window.addEventListener('touchstart', unlockSpeech);
      window.addEventListener('keydown', unlockSpeech);
    }
  }, []);





  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) { containerRef.current.style.setProperty('--mouse-x', `${e.clientX}px`); containerRef.current.style.setProperty('--mouse-y', `${e.clientY}px`); }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let reqFrame: number;
    let time = 0;
    let targetLevel = 0;
    let currentLevel = 0;

    if (systemState === 'SPEAKING') {
      const updateSimulatedAudio = () => {
        time += 0.15;
        
        // Generate a jagged wavy level for visual flair, like a real voice waveform
        const noise = Math.random() * 0.8 + 0.2;
        // Combine multiple sine waves with different frequencies
        let wave = Math.sin(time) * 0.5 + Math.sin(time * 2.5) * 0.3 + Math.sin(time * 5) * 0.2;
        wave = Math.abs(wave); // Make it mostly positive spikes
        
        // Realistic speech pauses (groups of words)
        const isPause = Math.sin(time * 0.5) > 0.8 || Math.random() > 0.95; 
        
        targetLevel = isPause ? 0 : wave * noise;
        
        // Smoothly interpolate current level towards target level
        currentLevel += (targetLevel - currentLevel) * 0.3;

        setAudioLevel(currentLevel);

        if (isPause) {
          setBass(0);
          setTreble(0);
        } else {
          // Bass has slower cycles, treble has higher frequency and jitter
          const simBass = (Math.sin(time * 0.8) * 0.4 + 0.6) * currentLevel;
          const simTreble = (Math.sin(time * 3.5) * 0.3 + 0.5 + Math.random() * 0.3) * currentLevel;
          setBass(simBass);
          setTreble(simTreble);
        }

        reqFrame = requestAnimationFrame(updateSimulatedAudio);
      };
      updateSimulatedAudio();
    }

    return () => {
      if (reqFrame) cancelAnimationFrame(reqFrame);
      if (systemState !== 'LISTENING') {
        setAudioLevel(0);
        setBass(0);
        setTreble(0);
      }
    };
  }, [systemState]);

  useEffect(() => {
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let dataArray: any;
    let source: MediaStreamAudioSourceNode;
    let reqFrame: number;

    if (systemState === 'LISTENING') {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateAudio = () => {
            if (analyser && dataArray) {
              analyser.getByteFrequencyData(dataArray);
              const sum = dataArray.reduce((a: number, b: number) => a + b, 0);
              const avg = sum / dataArray.length;
              setAudioLevel(avg / 128); // Normalize slightly

              // Calculate bass specifically (low frequency bins e.g. 0 to 8)
              let bassSum = 0;
              const bassCount = Math.min(8, dataArray.length);
              for (let i = 0; i < bassCount; i++) {
                bassSum += dataArray[i] || 0;
              }
              setBass((bassSum / (bassCount || 1)) / 128);

              // Calculate treble specifically (high frequency bins e.g. 20 to 60)
              let trebleSum = 0;
              const trebleStart = Math.min(20, dataArray.length);
              const trebleEnd = Math.min(60, dataArray.length);
              const trebleCount = trebleEnd - trebleStart;
              for (let i = trebleStart; i < trebleEnd; i++) {
                trebleSum += dataArray[i] || 0;
              }
              setTreble((trebleSum / (trebleCount || 1)) / 128);

              reqFrame = requestAnimationFrame(updateAudio);
            }
          };
          updateAudio();
        }).catch(err => {
          console.warn("Mic access not available, falling back to simulated analysis:", err.message || err);
          // If mic is denied or not found, fall back to simulated visualization for safety
          let simFrame: number = 0;
          let simTime = 0;
          const updateSimulated = () => {
            simTime += 0.12;
            const level = Math.random() * 0.4 + 0.1;
            setAudioLevel(level);
            setBass((Math.sin(simTime * 0.7) * 0.4 + 0.6) * level);
            setTreble((Math.sin(simTime * 3.8) * 0.3 + 0.5 + Math.random() * 0.2) * level);
            simFrame = requestAnimationFrame(updateSimulated);
          };
          updateSimulated();
          reqFrame = simFrame;
        });
      } else {
        console.warn("navigator.mediaDevices.getUserMedia is not supported on this browser or context.");
        // Fallback to simulated visualizer level for safety
        let simFrame: number = 0;
        let simTime = 0;
        const updateSimulated = () => {
          simTime += 0.12;
          const level = Math.random() * 0.4 + 0.1;
          setAudioLevel(level);
          setBass((Math.sin(simTime * 0.7) * 0.4 + 0.6) * level);
          setTreble((Math.sin(simTime * 3.8) * 0.3 + 0.5 + Math.random() * 0.2) * level);
          simFrame = requestAnimationFrame(updateSimulated);
        };
        updateSimulated();
        reqFrame = simFrame;
      }
    }

    return () => {
      if (reqFrame) cancelAnimationFrame(reqFrame);
      if (audioContext && audioContext.state !== 'closed') {
        try {
          audioContext.close();
        } catch (e) {}
      }
      setAudioLevel(0);
      setBass(0);
      setTreble(0);
    };
  }, [systemState]);

  useEffect(() => {
    // Generate or retrieve device ID
    let id = localStorage.getItem('advis_device_id') || localStorage.getItem('jarvis_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substr(2, 9);
    }
    localStorage.setItem('advis_device_id', id);
    
    // Cinematic initial boot sequence
    setTimeout(() => {
      setSystemState('ONLINE');
      fetchHistory(id);
    }, 4000);
  }, []);

  const fetchHistory = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/history?deviceId=${deviceId}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setMessages(data.map((m: any) => ({
          ...m,
          timestamp: Date.now()
        })));
      } else {
        setMessages([{ role: 'assistant', content: 'Welcome online, Sir. Holographic interface fully restored and functional.', timestamp: Date.now() }]);
      }
    } catch (e) {
      console.warn("fetch history warn:", e.message);
      
      setMessages([{ role: 'assistant', content: 'Welcome online, Sir. (Offline Mode Active)', timestamp: Date.now() }]);
      setSystemState('ONLINE');

    }
  };



  const handleSendMessage = async (text: string, file?: {name: string, content: string, isImage?: boolean, mimeType?: string} | null) => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if ((!text.trim() && !file) || systemState === 'THINKING' || systemState === 'SEARCHING' || systemState === 'ANALYZING') return;
    
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch(e) {}
    
    let displayMessage = text;
    if (file && !file.isImage) {
      displayMessage += `\n\n[Attached File: ${file.name}]\n${file.content}`;
    }

    const newMessage: ChatMessage = { role: 'user', content: displayMessage, timestamp: Date.now() };
    if (file && file.isImage) {
      newMessage.image = { content: file.content, mimeType: file.mimeType || 'image/jpeg' };
    }

    setMessages(prev => [...prev, newMessage]);
    
    const isTimeSensitive = displayMessage.toLowerCase().match(/(weather|news|time|stock|score|latest|current|today)/);
    if (newMessage.image) {
      setSystemState('ANALYZING');
    } else if (isTimeSensitive) {
      setSystemState('SEARCHING');
    } else {
      setSystemState('THINKING');
    }
    
    const deviceId = localStorage.getItem('advis_device_id') || 'default';

    try {
      const startTime = Date.now();
      const res = await fetch('/api/advis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: displayMessage, 
          image: newMessage.image, 
          mode: 'normal', 
          deviceId,
          currentSpatialObject,
          selectedComponentId,
          hoveredComponentId
        })
      });
      const data = await res.json();
      
      const elapsed = Date.now() - startTime;
      const minThinkingTime = 1500;
      
      if (elapsed < minThinkingTime) {
        await new Promise(resolve => setTimeout(resolve, minThinkingTime - elapsed));
      }

      if (data.spatialAction) {
        const action = data.spatialAction;
        
        if (action.type === 'DISPLAY' || action.type === 'PRESENT') {
          const idsToCheck = action.objectIds || (action.objectId ? [action.objectId] : []);
          for (const oid of idsToCheck) {
            const modelInfo = SPATIAL_LIBRARY[oid as keyof typeof SPATIAL_LIBRARY];
            if (modelInfo && modelInfo.modelStatus === 'UNAVAILABLE') {
              setSystemState('ONLINE');
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Model ${modelInfo.name} currently unavailable. The high-fidelity asset is not present in the local repository.`,
                timestamp: Date.now()
              }]);
              return;
            }
          }
        }

        if (action.type === 'DISPLAY') {
          if (action.objectIds) {
            setCurrentSpatialObject(action.objectIds);
          } else if (action.objectId) {
            setCurrentSpatialObject(action.objectId);
          }
          setSelectedComponentId(null);
          setHoveredComponentId(null);
          if (action.mode) {
            changeSpatialMode(action.mode);
          } else {
            changeSpatialMode('INSPECTION');
          }
        } else if (action.type === 'SHOWCASE') {
          changeSpatialMode('SHOWCASE');
        } else if (action.type === 'INSPECTION') {
          changeSpatialMode('INSPECTION');
        } else if (action.type === 'DEMO') {
          changeSpatialMode('DEMO');
        } else if (action.type === 'EXPLODE') {
          changeSpatialMode(action.value ? 'EXPLODED' : 'INSPECTION');
        } else if (action.type === 'LABEL') {
          setShowLabels(action.value);
        } else if (action.type === 'PRESENT') {
          if (action.objectIds) {
            setCurrentSpatialObject(action.objectIds);
          } else if (action.objectId) {
            setCurrentSpatialObject(action.objectId);
          }
          setSelectedComponentId(null);
          setHoveredComponentId(null);
          changeSpatialMode('DEMO');
        } else if (action.type === 'CLOSE') {
          setCurrentSpatialObject(null);
          setSelectedComponentId(null);
          setHoveredComponentId(null);
          changeSpatialMode('INSPECTION');
        }
      }
      
      setSystemState('SPEAKING');
      
      const isHiddenReply = data.reply === '[LOADING_HOLOGRAM]';
      if (!isHiddenReply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: Date.now() }]);
      }
      
      // Simulate speaking duration based on text length
      const words = data.reply.split(' ').length;
      const durationMs = Math.max(2000, words * 300);
      
      if (window.speechSynthesis && soundEnabled) {
        // Clear queue
        window.speechSynthesis.cancel();
        
        let utteranceText = data.reply || "";
        // Remove markdown, emojis, and weird chars for speech which can crash Chrome TTS
        utteranceText = utteranceText.replace(/[*_~`#]/g, "");
        utteranceText = utteranceText.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

        if (!utteranceText.trim() || isHiddenReply) {
           setTimeout(() => setSystemState('ONLINE'), isHiddenReply ? 500 : durationMs);
           return;
        }

        const utterance = new SpeechSynthesisUtterance(utteranceText);
        utterance.rate = speechRate;
        utterance.pitch = 0.95;
        
        const voices = window.speechSynthesis.getVoices();
        const selectVoice = () => {
          let bestVoice = voices.find(v => v.name.includes("Daniel"));
          if (!bestVoice) bestVoice = voices.find(v => v.name.includes("UK English Male"));
          if (!bestVoice) bestVoice = voices.find(v => (v.name.includes("Natural") && v.lang.startsWith("en")));
          if (!bestVoice) bestVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Google UK English Male"));
          if (!bestVoice) {
            bestVoice = voices.find(v => v.lang.startsWith("en") && !v.lang.toLowerCase().includes("in") && !v.name.toLowerCase().includes("india"));
          }
          if (!bestVoice) bestVoice = voices.find(v => v.lang.startsWith("en"));
          return bestVoice;
        };
        const chosenVoice = selectVoice();
        if (chosenVoice) {
          utterance.voice = chosenVoice;
          utterance.lang = chosenVoice.lang;
        } else {
          utterance.lang = 'en-US';
        }
        
        // Prevent garbage collection bug in Chrome
        (window as any).__utterances = (window as any).__utterances || [];
        (window as any).__utterances.push(utterance);
        
        let hasEnded = false;
        
        // Watchdog for Chrome stuck speech bug
        let watchdog = setTimeout(() => {
           if (!hasEnded) {
              console.warn("Speech synthesis watchdog fired. Cancelling.");
              hasEnded = true;
              window.speechSynthesis.cancel();
              setSystemState('ONLINE');
           }
        }, 3000);

        utterance.onstart = () => {
          clearTimeout(watchdog);
          window.dispatchEvent(new CustomEvent('advis-speech-start'));
        };

        utterance.onboundary = (e) => {
          if (e.name === 'word') {
            window.dispatchEvent(new CustomEvent('advis-speech-boundary', { 
              detail: { charIndex: e.charIndex, length: e.charLength, textLength: utteranceText.length } 
            }));
          }
        };

        utterance.onend = () => {
          window.dispatchEvent(new CustomEvent('advis-speech-end'));
          if (hasEnded) return;
          hasEnded = true;
          setSystemState('ONLINE');
          sessionActiveRef.current = true;
          sessionTimerRef.current = setTimeout(() => { sessionActiveRef.current = false; }, 5000);
          (window as any).__utterances = (window as any).__utterances.filter((u: any) => u !== utterance);
        };
        
        utterance.onerror = (e) => {
          if (hasEnded) return;
          hasEnded = true;
          console.warn('Speech synthesis error', e);
          setSystemState('ONLINE');
          (window as any).__utterances = (window as any).__utterances.filter((u: any) => u !== utterance);
        };
        
        // Ensure synthesis isn't paused (Chrome bug)
        if (window.speechSynthesis.paused) {
           window.speechSynthesis.resume();
        }
        
        // Chrome sometimes needs a small delay after cancel
        setTimeout(() => {
           try {
             window.speechSynthesis.speak(utterance);
             // Kickstart Chrome speech if it's acting up
             if (window.speechSynthesis.paused) {
               window.speechSynthesis.resume();
             }
           } catch (e) {
             console.warn("Speech synthesis immediate error:", e);
             if (!hasEnded) {
                hasEnded = true;
                setSystemState('ONLINE');
                sessionActiveRef.current = true;
                sessionTimerRef.current = setTimeout(() => { sessionActiveRef.current = false; }, 5000);
             }
           }
           
           // Fallback timeout in case speech gets stuck
           setTimeout(() => {
              if (!hasEnded) {
                 try { window.speechSynthesis.cancel(); } catch(e) {}
                 if (!hasEnded) {
                    hasEnded = true;
                    setSystemState('ONLINE');
                    sessionActiveRef.current = true;
                    sessionTimerRef.current = setTimeout(() => { sessionActiveRef.current = false; }, 5000);
                    (window as any).__utterances = (window as any).__utterances.filter((u: any) => u !== utterance);
                 }
              }
           }, durationMs + 2000);
        }, 50);
      } else {
        setTimeout(() => { setSystemState('ONLINE'); sessionActiveRef.current = true; sessionTimerRef.current = setTimeout(() => { sessionActiveRef.current = false; }, 5000); }, durationMs);
      }
    } catch (e) {
      console.warn('handleSendMessage error:', e);
      
      setMessages([{ role: 'assistant', content: 'Welcome online, Sir. (Offline Mode Active)', timestamp: Date.now() }]);
      setSystemState('ONLINE');

      setTimeout(() => { setSystemState('ONLINE'); sessionActiveRef.current = false; }, 3000);
    }
  };

  useSpeechRecognition(systemState, setSystemState, handleSendMessage, sessionActiveRef, setWakeWordEnergy);

  return (
    <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans selection:bg-cyan-500/30">
      <div 
        className="pointer-events-none absolute inset-0 z-0 opacity-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), color-mix(in srgb, var(--primary) 10%, transparent), transparent 40%)`
        }}
      />
      
      <Background systemState={systemState} themeColor={themeColor} />
      
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 15], fov: 45 }} eventSource={containerRef as any} eventPrefix="client">
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#67e8f9" />
        <pointLight position={[0, 5, -5]} intensity={1.5} color="#0ea5e9" />
          <GestureProvider handTracking={handTracking} isSpatial={!!currentSpatialObject}>
            <CameraRig isSpatial={!!currentSpatialObject} />
          <HologramCore systemState={systemState} audioLevel={audioLevel} bass={bass} treble={treble} hologramIntensity={hologramIntensity} themeColor={themeColor} isSpatial={!!currentSpatialObject} />
          
          <SpatialObjectEngine 
            currentSpatialObject={currentSpatialObject}
            selectedComponentId={selectedComponentId}
            hoveredComponentId={hoveredComponentId}
            isExploded={isExploded}
            isPresentationMode={isPresentationMode}
            presentationStep={presentationStep}
            spatialMode={spatialMode}
            onInteractionStateChange={setIsUserInteracting}
            setSelectedComponentId={setSelectedComponentId}
            setHoveredComponentId={setHoveredComponentId}
            handTracking={handTracking}
            setPresentationStep={setPresentationStep}
            setMessages={setMessages}
            soundEnabled={soundEnabled}
            showLabels={showLabels}
          />
          
          <EffectComposer>
            <Bloom 
              luminanceThreshold={0.5} 
              mipmapBlur 
              intensity={0.1 * hologramIntensity} 
            />
            <ChromaticAberration 
              blendFunction={BlendFunction.NORMAL} 
              offset={new THREE.Vector2(0.0005, 0.0005)} 
              radialModulation={false}
              modulationOffset={0}
            />
            <Noise opacity={0.012} />
          </EffectComposer>
          </GestureProvider>
        </Canvas>
      </div>

      {/* UI Layer */}
      <div className={`absolute inset-0 z-10 flex flex-col pointer-events-none transition-opacity duration-1000 ${systemState === 'BOOTING' ? 'opacity-0' : 'opacity-100'}`}>
        <div className={`transition-all duration-1000 ${currentSpatialObject ? 'opacity-0 pointer-events-none -translate-y-full' : 'opacity-100 translate-y-0'}`}>
          <MobileNav currentView={currentView} setView={setCurrentView} />
        </div>
        <div className="flex-1 flex overflow-hidden p-2 md:p-6 gap-6 relative mt-16 lg:mt-0">
          <div className={`hidden lg:block transition-all duration-1000 ${currentSpatialObject ? 'opacity-0 pointer-events-none -translate-x-full' : 'opacity-100 translate-x-0'}`}>
            <Sidebar currentView={currentView} setView={setCurrentView} />
          </div>
          
          <div className="flex-1 flex justify-center lg:justify-between relative">
            <div className={`hidden xl:block transition-all duration-1000 ${currentSpatialObject ? 'transform -translate-x-16 opacity-0 scale-90 pointer-events-none' : 'transform translate-x-0 opacity-100 scale-100 pointer-events-auto'}`}>
              <SystemPanels side="left" handTracking={handTracking} />
            </div>
            <div className={`w-full max-w-[450px] flex flex-col h-full pt-16 lg:pt-0 pb-[140px] md:pb-[120px] transition-all duration-1000 ${currentSpatialObject ? 'transform translate-y-16 opacity-0 scale-95 pointer-events-none' : 'transform translate-y-0 opacity-100 scale-100 pointer-events-auto'}`}>
              <ChatPanel messages={messages} systemState={systemState} audioLevel={audioLevel} />
            </div>
            <div className={`hidden xl:block transition-all duration-1000 ${currentSpatialObject ? 'transform translate-x-16 opacity-0 scale-90 pointer-events-none' : 'transform translate-x-0 opacity-100 scale-100 pointer-events-auto'}`}>
              <SystemPanels side="right" handTracking={handTracking} />
            </div>
          </div>
        </div>
        
        <div className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ${currentSpatialObject ? 'transform translate-y-full opacity-0 pointer-events-none' : 'transform translate-y-0 opacity-100 pointer-events-auto'}`}>
          <InputArea 
            onSend={handleSendMessage} 
            systemState={systemState}
            setSystemState={setSystemState}
            setView={setCurrentView}
            currentView={currentView}
            audioLevel={audioLevel}
            wakeWordEnergy={wakeWordEnergy}
            handTracking={handTracking}
          />
        </div>
      </div>

      {/* Hand Loss State Notification */}
      {cvEnabled && handTracking.state === 'LOST' && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[45] font-mono text-xs text-amber-500 bg-black/90 border border-amber-500/30 px-5 py-3 rounded-xl flex items-center gap-3 backdrop-blur-md shadow-[0_0_25px_rgba(245,158,11,0.2)] animate-pulse pointer-events-none">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          <span className="font-bold tracking-widest uppercase">INTERACTION PAUSED — HAND POSITION LOST</span>
        </div>
      )}
      
      {currentSpatialObject && (
        <div className="fixed top-8 left-8 z-40 pointer-events-auto flex flex-col gap-3 max-w-[340px] font-mono text-cyan-400 animate-fade-in mix-blend-screen bg-slate-950/80 p-3.5 rounded-lg border border-cyan-500/30 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col border-l-2 border-cyan-400 pl-3 py-0.5">
            <div className="font-bold tracking-[0.2em] text-cyan-300 uppercase flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                SPATIAL WORKSPACE
              </div>
              <div className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase border transition-all ${
                isUserInteracting 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
                  : 'bg-cyan-500/10 text-cyan-400/80 border-cyan-500/30'
              }`}>
                {isUserInteracting ? '● INTERACTING' : '○ VIEWING'}
              </div>
            </div>
            <div className="text-white font-bold text-lg mt-1 tracking-wide shadow-cyan-500/50 drop-shadow-md">
              {Array.isArray(currentSpatialObject)
                ? currentSpatialObject.map(id => SPATIAL_LIBRARY[id]?.name || id).join(' + ')
                : (SPATIAL_LIBRARY[currentSpatialObject || '']?.name || currentSpatialObject)}
            </div>
            <div className="text-[10px] text-cyan-400/70 italic mt-0.5 uppercase tracking-widest">
              {Array.isArray(currentSpatialObject)
                ? 'Engineering Showcase'
                : (SPATIAL_LIBRARY[currentSpatialObject || '']?.category || 'Engineering')}
            </div>
          </div>

          {/* PRESENTATION MODE SELECTOR (4 STATES) */}
          <div className="flex flex-col gap-1.5 mt-0.5">
            <div className="text-[9px] uppercase tracking-wider text-cyan-400/60 font-bold">Presentation State</div>
            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold uppercase">
              {/* 1. INSPECTION MODE */}
              <button
                onClick={() => changeSpatialMode('INSPECTION')}
                className={`px-2.5 py-1.5 rounded border transition-all text-left flex items-center justify-between cursor-pointer ${
                  spatialMode === 'INSPECTION'
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'border-cyan-500/20 bg-slate-900/40 hover:bg-cyan-950/40 text-cyan-400/70'
                }`}
                title="1. Inspection Mode: Manual gesture inspection, zero auto-rotation, stable pointing"
              >
                <span>1. Inspection</span>
                {spatialMode === 'INSPECTION' && <span className="text-[8px] text-cyan-300 font-extrabold">✓</span>}
              </button>

              {/* 2. SHOWCASE MODE */}
              <button
                onClick={() => changeSpatialMode('SHOWCASE')}
                className={`px-2.5 py-1.5 rounded border transition-all text-left flex items-center justify-between cursor-pointer ${
                  spatialMode === 'SHOWCASE'
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'border-cyan-500/20 bg-slate-900/40 hover:bg-cyan-950/40 text-cyan-400/70'
                }`}
                title="2. Showcase Mode: Slow cinematic automatic rotation"
              >
                <span>2. Showcase</span>
                {spatialMode === 'SHOWCASE' && <span className="text-[8px] text-emerald-300 font-extrabold">Auto</span>}
              </button>

              {/* 3. EXPLODED ANALYSIS MODE */}
              <button
                onClick={() => changeSpatialMode('EXPLODED')}
                className={`px-2.5 py-1.5 rounded border transition-all text-left flex items-center justify-between cursor-pointer ${
                  spatialMode === 'EXPLODED'
                    ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'border-cyan-500/20 bg-slate-900/40 hover:bg-cyan-950/40 text-cyan-400/70'
                }`}
                title="3. Exploded Analysis Mode: Disassemble components into exploded offset view"
              >
                <span>3. Exploded</span>
                {spatialMode === 'EXPLODED' && <span className="text-[8px] text-purple-300 font-extrabold">Parts</span>}
              </button>

              {/* 4. DEMO MODE */}
              <button
                onClick={() => changeSpatialMode('DEMO')}
                className={`px-2.5 py-1.5 rounded border transition-all text-left flex items-center justify-between cursor-pointer ${
                  spatialMode === 'DEMO'
                    ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'border-cyan-500/20 bg-slate-900/40 hover:bg-cyan-950/40 text-cyan-400/70'
                }`}
                title="4. Demo Mode: Guided narrative component demonstration"
              >
                <span>4. Demo</span>
                {spatialMode === 'DEMO' && <span className="text-[8px] text-amber-300 font-extrabold">Guided</span>}
              </button>
            </div>
          </div>

          {/* EXIT BUTTON */}
          <div className="flex justify-between items-center pt-1 border-t border-cyan-500/20 mt-1">
            <span className="text-[9px] text-cyan-400/50 uppercase tracking-widest font-mono">ADVIS 3D V2</span>
            <button 
              onClick={() => {
                setCurrentSpatialObject(null);
                setSelectedComponentId(null);
                setHoveredComponentId(null);
                changeSpatialMode('INSPECTION');
              }}
              className="px-2.5 py-1 rounded border border-red-500/40 bg-red-950/30 hover:bg-red-900/50 hover:border-red-400 text-red-400 text-[9px] transition-all font-bold uppercase cursor-pointer backdrop-blur-sm"
              title="Close spatial projection"
            >
              Exit Spatial Mode
            </button>
          </div>

          {spatialMode === 'DEMO' && (() => {
            const primaryObjId = Array.isArray(currentSpatialObject) ? currentSpatialObject[0] : currentSpatialObject;
            const obj = primaryObjId ? SPATIAL_LIBRARY[primaryObjId] : null;
            const compCount = obj?.components.length || 1;
            return (
              <div className="mt-1">
                <div className="text-[9px] text-amber-400/80 uppercase tracking-widest font-bold mb-1 flex justify-between">
                  <span>Demonstration Active</span>
                  <span>Step {presentationStep + 1} / {compCount + 1}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden border border-amber-500/20">
                  <div 
                    className="bg-amber-400 h-full transition-all duration-1000 ease-in-out shadow-[0_0_8px_rgba(245,158,11,0.6)]" 
                    style={{ width: `${Math.max(5, ((presentationStep + 1) / (compCount + 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SELECTED COMPONENT DETAIL VIEW HUD CARD */}
      {currentSpatialObject && selectedComponentId && (() => {
        const primaryObjId = Array.isArray(currentSpatialObject) ? currentSpatialObject[0] : currentSpatialObject;
        const obj = primaryObjId ? SPATIAL_LIBRARY[primaryObjId] : null;
        const comp = obj?.components.find(c => c.id === selectedComponentId);
        if (!comp) return null;
        const specs = comp.specifications || obj?.educationalInformation?.specifications || {
          "Component ID": comp.id,
          "Shape": comp.shape.toUpperCase(),
          "Position": comp.position.join(', '),
          "Offset": comp.explodedOffset.join(', ')
        };
        return (
          <div className="fixed top-8 right-8 z-40 pointer-events-auto flex flex-col gap-3 w-80 font-mono text-cyan-400 animate-fade-in mix-blend-screen bg-slate-950/85 p-4 rounded-xl border border-cyan-400/40 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.25)]">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-300 uppercase">COMPONENT SPECIFICATION</span>
              </div>
              <button
                onClick={() => setSelectedComponentId(null)}
                className="text-cyan-400/60 hover:text-cyan-200 text-xs px-1.5 py-0.5 rounded border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer"
                title="Deselect Component"
              >
                ✕
              </button>
            </div>

            <div className="text-white font-bold text-base tracking-wide mt-1">
              {comp.name}
            </div>
            <div className="text-[10px] text-cyan-300/80 leading-relaxed font-sans font-light">
              {comp.description}
            </div>

            <div className="mt-1 flex flex-col gap-1.5">
              <div className="text-[9px] uppercase tracking-wider text-cyan-400/60 font-bold">Technical Specifications</div>
              <div className="bg-slate-900/60 rounded-lg p-2.5 border border-cyan-500/20 flex flex-col gap-1 text-[10px]">
                {Object.entries(specs).slice(0, 5).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center border-b border-cyan-500/10 last:border-0 py-0.5">
                    <span className="text-cyan-400/70 text-[9px]">{k}:</span>
                    <span className="text-cyan-200 font-bold text-[9px]">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedComponentId(null)}
              className="mt-1 w-full py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold uppercase tracking-widest rounded transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>CLEAR SELECTION</span>
            </button>
          </div>
        );
      })()}

      <HolographicCursor handTracking={handTracking} isSpatial={!!currentSpatialObject} />
      <ViewModal 
        currentView={currentView} 
        setView={setCurrentView} 
        messages={messages} 
        hologramIntensity={hologramIntensity} 
        setHologramIntensity={setHologramIntensity} 
        soundEnabled={soundEnabled} 
        setSoundEnabled={setSoundEnabled} 
        themeColor={themeColor} 
        setThemeColor={setThemeColor} 
        speechRate={speechRate} 
        setSpeechRate={setSpeechRate} 
        strictSecurity={strictSecurity}
        setStrictSecurity={setStrictSecurity}
        triggerBarnDoor={() => requireBiometric(() => setBarnDoorActive(true))}
        triggerCleanSlate={() => requireBiometric(handleCleanSlate)}
        cvEnabled={cvEnabled}
        setCvEnabled={setCvEnabled}
      />
      
      {/* Barn Door Protocol Overlay */}
      {barnDoorActive && (
        <div className="fixed inset-0 z-[100] bg-red-950/90 flex flex-col items-center justify-center pointer-events-auto overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 border-[20px] border-red-600/50 box-border pointer-events-none"
          />
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center z-10"
          >
            <div className="text-red-500 mb-6 flex justify-center">
              <svg className="w-32 h-32 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-10h2v8h-2V7z"/></svg>
            </div>
            <h1 className="text-4xl md:text-7xl font-mono font-bold tracking-[0.2em] text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] mb-4 uppercase">
              BARN DOOR PROTOCOL
            </h1>
            <p className="text-red-400 text-lg md:text-xl font-mono tracking-widest uppercase mb-12 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">
              System Locked. Unauthorized Access Restricted.
            </p>
            <button 
              onClick={() => setBarnDoorActive(false)}
              className="px-8 py-4 border-2 border-red-500/50 text-red-500 font-mono tracking-widest hover:bg-red-500 hover:text-black hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] transition-all uppercase rounded font-bold"
            >
              OVERRIDE PROTOCOL
            </button>
          </motion.div>
        </div>
      )}

      {/* Biometric Scanner Overlay */}
      {biometricActive && (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center font-mono">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center border border-cyan-500/30 bg-cyan-950/20 p-12 rounded-2xl shadow-[0_0_30px_rgba(0,255,255,0.15)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
            
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative mb-8 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]"
            >
              <Fingerprint size={120} strokeWidth={1} />
              
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,1)] z-10 opacity-70"
              />
            </motion.div>
            
            <div className="text-xl text-cyan-300 tracking-[0.2em] mb-2 z-10 font-bold uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
              BIOMETRIC VERIFICATION REQUIRED
            </div>
            
            <div className="text-cyan-500/70 text-sm tracking-widest mb-10 z-10">
              PLACE FINGER ON SCANNER TO AUTHORIZE
            </div>
            
            <div className="flex gap-4 z-10">
              <button 
                onClick={() => setBiometricActive(false)}
                className="px-6 py-2 border border-cyan-500/50 text-cyan-500 hover:bg-cyan-900/30 transition-colors rounded tracking-widest text-xs"
              >
                CANCEL
              </button>
              
              <button 
                onClick={() => {
                  setBiometricActive(false);
                  if (pendingAction) {
                    setTimeout(() => pendingAction(), 300);
                  }
                }}
                className="px-6 py-2 bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:text-black transition-colors rounded tracking-widest text-xs shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] font-bold flex items-center gap-2"
              >
                <Lock size={14} />
                AUTHORIZE OVERRIDE
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Connection Screen / Cinematic Boot Loader */}
      {(systemState === 'CONNECTING' || systemState === 'BOOTING') && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono">
          <div className="text-5xl font-bold tracking-[0.3em] text-cyan-400 mb-8 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            A.D.V.I.S.
          </div>
          <div className="w-64 h-1 bg-cyan-900/50 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 animate-pulse w-full"></div>
          </div>
          <div className="mt-4 text-cyan-400/80 text-sm tracking-widest animate-pulse">
            INITIALIZING CORE PLEXUS...
          </div>
        </div>
      )}
    </div>
  );
}
