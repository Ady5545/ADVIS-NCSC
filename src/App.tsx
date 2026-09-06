import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { HologramCore } from './HologramCore';
import { ChatPanel } from './ChatPanel';
import { InputArea } from './InputArea';
import { Sidebar } from './Sidebar';
import { Background } from './Background';
import { useSpeechRecognition } from './useSpeechRecognition';
import { playStateTransitionSound, playTone } from './audioEffects';
import { ViewModal } from './ViewModal';
import { MobileNav } from './MobileNav';
import { Fingerprint, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHandTracking, HandTrackingData } from './useHandTracking';
import { MediaPipeAdapter } from './MediaPipeAdapter';
import { GestureProvider, GestureFrameUpdater, useGestureEngine } from './GestureContext';
import { SpatialObjectEngine, SpatialMode } from './SpatialObjectEngine';
import { SPATIAL_LIBRARY } from './SpatialLibrary';
import { EngineeringHUD } from './EngineeringHUD';
import { ScientificHUD } from './ScientificHUD';
import { ScientificLaunchpad } from './ScientificLaunchpad';

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

import { LearningSession } from './LearnEngine/LearnTypes';
import { buildChemistryLesson } from './LearnEngine/LessonBuilder';
import { LearnWorkspace } from './LearnEngine/LearnWorkspace';
import { ChemistryVisuals } from './LearnEngine/ChemistryVisuals';
import { MolecularVisuals } from './LearnEngine/MolecularVisuals';
import { SessionMoleculeProvider, useSessionMolecule } from './LearnEngine/SessionMoleculeContext';
import { MolecularBuilderHUD } from './LearnEngine/MolecularBuilderHUD';
import { ModelBuilder, ModelRegistry } from './AutonomousModelEngine';

import { HolographicCursor } from './HolographicCursor';
import { GestureLegend } from './components/GestureLegend';

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AppErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#110000', color: '#ff4444', padding: '30px', fontFamily: 'monospace', overflow: 'auto' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>⚠️ REACT RENDER ERROR CAUGHT</h1>
          <pre style={{ background: '#220000', padding: '15px', borderRadius: '8px', border: '1px solid #ff4444' }}>
            {this.state.error?.toString()}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

class EnvironmentErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn("HDR Environment loading deferred or offline, utilizing calibrated studio lighting rig:", error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function AppContent() {
  const [systemState, setSystemState] = useState<SystemState>('ONLINE');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [bass, setBass] = useState(0);
  const [treble, setTreble] = useState(0);
  const [wakeWordEnergy, setWakeWordEnergy] = useState(0);
  const [hologramIntensity, setHologramIntensity] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [themeColor, setThemeColor] = useState('#22d3ee');
  const [speechRate, setSpeechRate] = useState(1.05);

  const sessionMolecule = useSessionMolecule();

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
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeLearningSession, setActiveLearningSession] = useState<LearningSession | null>(null);
  const [recentActions, setRecentActions] = useState<Array<{ type: string; target?: string | null; name?: string | null; timestamp: number }>>([]);

  const pushRecentAction = (type: string, target?: string | null, name?: string | null) => {
    setRecentActions(prev => [...prev.slice(-9), { type, target, name, timestamp: Date.now() }]);
  };

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
  const [isEngineeringMode, setIsEngineeringMode] = useState<boolean>(false);
  const [componentTransforms, setComponentTransforms] = useState<Record<string, { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }>>({});
  const [explodedFactor, setExplodedFactor] = useState<number>(0);
  const [xrayEnabled, setXrayEnabled] = useState<boolean>(false);
  const [blueprintEnabled, setBlueprintEnabled] = useState<boolean>(false);
  const [highlightedComponentId, setHighlightedComponentId] = useState<string | null>(null);
  const [isolatedComponentId, setIsolatedComponentId] = useState<string | null>(null);
  const [tracedFunctionKey, setTracedFunctionKey] = useState<string | null>(null);
  const [isKinematicPlaying, setIsKinematicPlaying] = useState<boolean>(true);
  const [kinematicSpeed, setKinematicSpeed] = useState<number>(1.0);
  const [kinematicTimeOffset, setKinematicTimeOffset] = useState<number>(0);
  const [measurementMode, setMeasurementMode] = useState<boolean>(false);
  const [v12Rpm, setV12Rpm] = useState<number>(600);
  const [v12Direction, setV12Direction] = useState<number>(1);
  const [isMagnifierFocused, setIsMagnifierFocused] = useState<boolean>(false);
  const [lodTier, setLodTier] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA'>('HIGH');

  const [actionPreview, setActionPreview] = useState<string | null>(null);

  const handleUpdateComponentTransform = (id: string, transform: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }) => {
    setComponentTransforms(prev => ({
      ...prev,
      [id]: transform
    }));
  };

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
        const u = new SpeechSynthesisUtterance("Workspace reset. Active session cleared.");
        u.rate = speechRate;
        u.pitch = 1.0;
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
    const handleSwipe = (e: Event) => {
      const swipeEvent = e as CustomEvent;
      if (swipeEvent.detail && swipeEvent.detail.direction) {
         console.log('ADVIS SWIPE:', swipeEvent.detail.direction);
         // For now just log the swipe, but it could be used for pagination or switching workspaces.
      }
    };
    window.addEventListener('advis-swipe', handleSwipe);
    return () => window.removeEventListener('advis-swipe', handleSwipe);
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
    
    // Fetch history in background immediately
    fetchHistory(id);

    // Fast cinematic initial boot sequence (~1000ms)
    const bootTimer = setTimeout(() => {
      setSystemState('ONLINE');
    }, 1000);

    // Deterministic safety fallback: guarantee exit from BOOTING state within 1200ms
    const safetyTimer = setTimeout(() => {
      setSystemState((prev) => (prev === 'BOOTING' ? 'ONLINE' : prev));
    }, 1200);

    return () => {
      clearTimeout(bootTimer);
      clearTimeout(safetyTimer);
    };
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
        setMessages([{ role: 'assistant', content: 'Welcome to A.D.V.I.S. Scientific visualization workspace online.', timestamp: Date.now() }]);
      }
    } catch (e) {
      console.warn("fetch history warn:", (e as Error).message);
      setMessages([{ role: 'assistant', content: 'Scientific workspace online. (Offline Mode Active)', timestamp: Date.now() }]);
    }
  };



  const handleSendMessage = async (text: string, file?: {name: string, content: string, isImage?: boolean, mimeType?: string} | null) => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if ((!text.trim() && !file) || systemState === 'THINKING' || systemState === 'SEARCHING' || systemState === 'ANALYZING') return;
    
    const lowerText = text.toLowerCase().trim();
    if (lowerText === 'open engineering mode' || lowerText.includes('open engineering mode')) {
      setIsEngineeringMode(true);
      setSystemState('ONLINE');
      setMessages(prev => [
        ...prev,
        { role: 'user', content: text, timestamp: Date.now() },
        { role: 'assistant', content: 'Engineering Mode activated. Spatial telemetry and diagnostics HUD online.', timestamp: Date.now() }
      ]);
      return;
    }
    
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
    const lowerCmd = displayMessage.toLowerCase().trim();

    // Direct CAD & Kinematic Command Intercepts
    if (lowerCmd.includes('play the engine') || lowerCmd.includes('play engine') || lowerCmd.includes('start engine') || lowerCmd.includes('run engine')) {
      setIsKinematicPlaying(true);
      setSystemState('ONLINE');
      setMessages(prev => [...prev, { role: 'assistant', content: `Kinematic simulation active. Engine operating at ${v12Rpm} RPM.`, timestamp: Date.now() }]);
      return;
    }
    if (lowerCmd.includes('pause the engine') || lowerCmd.includes('pause engine') || lowerCmd.includes('stop engine')) {
      setIsKinematicPlaying(false);
      setSystemState('ONLINE');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Kinematic simulation paused.', timestamp: Date.now() }]);
      return;
    }
    if (lowerCmd.includes('rpm')) {
      const rpmMatch = lowerCmd.match(/(\d+)/);
      if (rpmMatch) {
        const rpmVal = parseInt(rpmMatch[1], 10);
        setV12Rpm(rpmVal);
        setSystemState('ONLINE');
        setMessages(prev => [...prev, { role: 'assistant', content: `Engine rotational velocity adjusted to ${rpmVal} RPM.`, timestamp: Date.now() }]);
        return;
      }
    }
    if (lowerCmd.includes('select the crankshaft') || lowerCmd.includes('select crankshaft')) {
      setSelectedComponentId('v12_crankshaft');
      setSystemState('ONLINE');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Selected crankshaft component.', timestamp: Date.now() }]);
      return;
    }
    if (lowerCmd.includes('magnify it') || lowerCmd === 'magnify' || lowerCmd.includes('focus component')) {
      setIsMagnifierFocused(true);
      setSystemState('ONLINE');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Magnifier Mode active. Camera locked onto target component.', timestamp: Date.now() }]);
      return;
    }
    if (lowerCmd.includes('exit magnify') || lowerCmd.includes('unmagnify') || lowerCmd.includes('close magnify')) {
      setIsMagnifierFocused(false);
      setSystemState('ONLINE');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Exited Magnifier Mode.', timestamp: Date.now() }]);
      return;
    }

    // Step 0: Check for Autonomous Scientific Model Construction / Mutation Intent
    const activeObjStr = typeof currentSpatialObject === 'string' ? currentSpatialObject : (Array.isArray(currentSpatialObject) ? currentSpatialObject[0] : null);
    if (!file && ModelBuilder.isAutonomousQuery(displayMessage, activeObjStr)) {
      try {
        const isMutation = ModelBuilder.isMutationQuery(displayMessage);
        
        if (!isMutation) {
          sessionMolecule.closeSession();
          setActiveLearningSession(null);
        }
        
        const buildRes = await ModelBuilder.constructFromQuery(displayMessage, {
          activeObjectId: activeObjStr,
          selectedComponentId: selectedComponentId
        });

        if (!isMutation) {
          setCurrentSpatialObject(buildRes.spatialObject.id);
          setSelectedComponentId(null);
          setHoveredComponentId(null);
          changeSpatialMode('INSPECTION');
        } else {
          setCurrentSpatialObject([buildRes.spatialObject.id, Date.now().toString()]);
        }

        pushRecentAction(isMutation ? 'AUTONOMOUS_MODEL_MUTATE' : 'AUTONOMOUS_MODEL_CONSTRUCT', buildRes.spatialObject.id, buildRes.plan.displayName);

        setSystemState('ONLINE');
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: buildRes.userExplanation,
            timestamp: Date.now()
          }
        ]);

        if (soundEnabled && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(isMutation ? `Updated ${buildRes.plan.displayName}.` : `Constructed ${buildRes.plan.displayName}. Mathematical validation complete.`);
          u.rate = speechRate;
          u.pitch = 1.0;
          window.speechSynthesis.speak(u);
        }
        return;
      } catch (err: any) {
        console.error('Autonomous Model Construction Error:', err);
      }
    }

    const activeWorkspace = sessionMolecule.isSessionActive
      ? 'CHEMISTRY'
      : (activeLearningSession 
        ? 'CHEMISTRY' 
        : (currentSpatialObject 
          ? (isEngineeringMode ? 'ENGINEERING' : 'SPATIAL') 
          : 'HUD'));

    const butlerContext = {
      activeProjectId,
      activeWorkspace,
      activeSpatialObject: currentSpatialObject,
      activeScientificVisualization: activeLearningSession?.context?.entity || activeLearningSession?.context?.topic || (sessionMolecule.isSessionActive && sessionMolecule.molecule ? sessionMolecule.molecule.metadata?.name : null),
      activeMolecule: sessionMolecule.getMolecularContextForAI(),
      selectedComponentId,
      hoveredComponentId,
      spatialMode,
      showLabels,
      isEngineeringMode,
      systemState,
      recentActions,
      recentConversation: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
    };

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
          hoveredComponentId,
          activeProjectId,
          butlerContext
        })
      });
      const data = await res.json();
      
      const elapsed = Date.now() - startTime;
      const minThinkingTime = 1500;
      
      if (elapsed < minThinkingTime) {
        await new Promise(resolve => setTimeout(resolve, minThinkingTime - elapsed));
      }

      if (data.activeProjectId) {
        setActiveProjectId(data.activeProjectId);
        pushRecentAction('PROJECT_SWITCH', data.activeProjectId, 'Project');
      }

      if (data.molecularAction) {
        if (!sessionMolecule.isSessionActive && activeLearningSession?.context?.entity) {
          sessionMolecule.loadCanonical(activeLearningSession.context.entity);
          setActiveLearningSession(null);
        }
        sessionMolecule.executeStructuredAction(data.molecularAction);
        if (data.molecularAction.type === 'INITIALIZE_BUILDER' || data.molecularAction.type === 'ADD_ATOM' || data.molecularAction.type === 'RESTORE_LAST' || data.molecularAction.type === 'REMOVE_ATOM' || data.molecularAction.type === 'CHANGE_BOND_ORDER') {
          setCurrentSpatialObject(null);
          setActiveLearningSession(null);
        }
      }

      if (data.learnAction) {
        const { subject, intent, learnMode } = data.learnAction;
        sessionMolecule.closeSession();
        pushRecentAction('START_LEARNING_SESSION', subject || 'CHEMISTRY', subject);
        setActiveLearningSession(buildChemistryLesson(subject || 'UNKNOWN', intent || 'UNKNOWN', learnMode || 'TEACH_ME'));
      }
      
      if (data.spatialAction) {
        const action = data.spatialAction;
        
        const actionDesc = data.butlerDecision?.userObjective || action.type;
        setActionPreview(`Action Confirmed: ${actionDesc}`);
        setTimeout(() => setActionPreview(null), 2500);
        
        if (action.type === 'DISPLAY_SCIENTIFIC') {
          const targetFormula = action.formula || action.assetId || 'UNKNOWN';
          sessionMolecule.closeSession();
          pushRecentAction('DISPLAY_SCIENTIFIC', targetFormula, action.name || targetFormula);
          setCurrentSpatialObject(null);
          setActiveLearningSession(buildChemistryLesson(targetFormula, 'SHOW_STRUCTURE', 'SHOW_ME'));
        } else if (action.type === 'DISPLAY' || action.type === 'PRESENT') {
          sessionMolecule.closeSession();
          const idsToCheck = action.objectIds || (action.objectId ? [action.objectId] : []);
          pushRecentAction('DISPLAY', idsToCheck[0] || 'MODEL', action.name || idsToCheck[0]);
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
          sessionMolecule.closeSession();
          const targetId = action.objectId || (action.objectIds ? action.objectIds[0] : null);
          if (targetId && !SPATIAL_LIBRARY[targetId] && !ModelRegistry.getModel(targetId)) {
            try {
              const buildRes = await ModelBuilder.constructFromQuery(action.name || targetId);
              setCurrentSpatialObject(buildRes.spatialObject.id);
            } catch {
              if (action.objectIds) {
                setCurrentSpatialObject(action.objectIds);
              } else if (action.objectId) {
                setCurrentSpatialObject(action.objectId);
              }
            }
          } else {
            if (action.objectIds) {
              setCurrentSpatialObject(action.objectIds);
            } else if (action.objectId) {
              setCurrentSpatialObject(action.objectId);
            }
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
          sessionMolecule.closeSession();
          if (action.objectIds) {
            setCurrentSpatialObject(action.objectIds);
          } else if (action.objectId) {
            setCurrentSpatialObject(action.objectId);
          }
          setSelectedComponentId(null);
          setHoveredComponentId(null);
          changeSpatialMode('DEMO');
        } else if (action.type === 'SELECT_COMPONENT') {
          if (action.componentId) {
            setSelectedComponentId(action.componentId);
            pushRecentAction('SELECT_COMPONENT', action.componentId, action.componentName || action.componentId);
          }
        } else if (action.type === 'TRACE_FUNCTION') {
          if (action.functionKey) {
            setTracedFunctionKey(action.functionKey);
            pushRecentAction('TRACE_FUNCTION', action.functionKey, action.functionKey);
          }
        } else if (action.type === 'ISOLATE' || action.type === 'ISOLATE_COMPONENT') {
          if (action.value === false) {
            setIsolatedComponentId(null);
          } else {
            const targetComp = action.componentId || selectedComponentId;
            if (targetComp) {
              setIsolatedComponentId(targetComp);
              setSelectedComponentId(targetComp);
            }
          }
        } else if (action.type === 'COMPARE') {
          setCurrentView('compare');
        } else if (action.type === 'DIAGNOSE') {
          // In future, open diagnostic panel
          console.log("DIAGNOSE action triggered");

        } else if (action.type === 'KINEMATICS') {
          if (action.playing !== undefined) {
            setIsKinematicPlaying(action.playing);
          }
          if (action.speed !== undefined) {
            setKinematicSpeed(action.speed);
          }
        } else if (action.type === 'CLOSE') {
          sessionMolecule.closeSession();
          pushRecentAction('CLOSE', null, null);
          setCurrentSpatialObject(null);
          setSelectedComponentId(null);
          setHoveredComponentId(null);
          setActiveLearningSession(null);
          changeSpatialMode('INSPECTION');
        } else if (action.type === 'ENGINEERING_TRANSFORM') {
          if (!selectedComponentId) {
            const primaryObjKey = Array.isArray(currentSpatialObject) ? currentSpatialObject[0] : currentSpatialObject;
            const objMeta = primaryObjKey ? SPATIAL_LIBRARY[primaryObjKey as keyof typeof SPATIAL_LIBRARY] : null;
            if (objMeta && objMeta.components && objMeta.components.length > 0) {
              setSelectedComponentId(objMeta.components[0].id);
            }
          }
          
          const targetCompId = selectedComponentId || (() => {
            const primaryObjKey = Array.isArray(currentSpatialObject) ? currentSpatialObject[0] : currentSpatialObject;
            const objMeta = primaryObjKey ? SPATIAL_LIBRARY[primaryObjKey as keyof typeof SPATIAL_LIBRARY] : null;
            return objMeta?.components?.[0]?.id;
          })();

          if (targetCompId) {
            const primaryObjKey = Array.isArray(currentSpatialObject) ? currentSpatialObject[0] : currentSpatialObject;
            const objMeta = primaryObjKey ? SPATIAL_LIBRARY[primaryObjKey as keyof typeof SPATIAL_LIBRARY] : null;
            const comp = objMeta?.components?.find(c => c.id === targetCompId);
            
            if (comp) {
              const currentTransform = componentTransforms[targetCompId] || {
                position: [...comp.position] as [number, number, number],
                rotation: [...(comp.rotation || [0, 0, 0])] as [number, number, number],
                scale: [1, 1, 1]
              };

              let nextTransform = { 
                position: [...currentTransform.position] as [number, number, number], 
                rotation: [...currentTransform.rotation] as [number, number, number], 
                scale: [...currentTransform.scale] as [number, number, number] 
              };

              if (action.actionType === 'MOVE') {
                const axisIdx = action.axis === 'x' ? 0 : action.axis === 'y' ? 1 : 2;
                nextTransform.position[axisIdx] += action.delta;
              } else if (action.actionType === 'ROTATE') {
                const axisIdx = action.axis === 'x' ? 0 : action.axis === 'y' ? 1 : 2;
                nextTransform.rotation[axisIdx] += action.angle;
              } else if (action.actionType === 'SCALE') {
                nextTransform.scale = [action.factor, action.factor, action.factor];
              } else if (action.actionType === 'RESET') {
                nextTransform = {
                  position: [...comp.position] as [number, number, number],
                  rotation: [...(comp.rotation || [0, 0, 0])] as [number, number, number],
                  scale: [1, 1, 1]
                };
              }

              setComponentTransforms(prev => ({
                ...prev,
                [targetCompId]: nextTransform
              }));
            }
          }
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
      
      setMessages([{ role: 'assistant', content: 'Scientific workspace online. (Offline Mode Active)', timestamp: Date.now() }]);
      setSystemState('ONLINE');

      setTimeout(() => { setSystemState('ONLINE'); sessionActiveRef.current = false; }, 3000);
    }
  };

  useSpeechRecognition(systemState, setSystemState, handleSendMessage, sessionActiveRef, setWakeWordEnergy);

  // Gesture-controlled spatial navigation & summon listeners
  useEffect(() => {
    const available = ['v12_engine', 'human_heart', 'drone_frame', 'microscope', 'solar_tracker'];

    const handleModelCycle = (e: Event) => {
      const customEvent = e as CustomEvent<{ direction: 'LEFT' | 'RIGHT' }>;
      const dir = customEvent.detail?.direction || 'RIGHT';
      setCurrentSpatialObject(prev => {
        const cur = typeof prev === 'string' ? prev : (Array.isArray(prev) ? prev[0] : 'v12_engine');
        const idx = available.indexOf(cur);
        const validIdx = idx >= 0 ? idx : 0;
        const nextIdx = dir === 'RIGHT' 
          ? (validIdx + 1) % available.length 
          : (validIdx - 1 + available.length) % available.length;
        return available[nextIdx];
      });
      setSelectedComponentId(null);
      setHoveredComponentId(null);
      if (soundEnabled) {
        playTone(900, 'sine', 0.1, 0.08);
        setTimeout(() => playTone(1200, 'sine', 0.15, 0.08), 80);
      }
    };

    window.addEventListener('advis-model-cycle', handleModelCycle);
    return () => {
      window.removeEventListener('advis-model-cycle', handleModelCycle);
    };
  }, [soundEnabled]);

  const isSpatial = !!currentSpatialObject || !!activeLearningSession || (sessionMolecule.isSessionActive && !!sessionMolecule.molecule);

  return (
    <GestureProvider handTracking={handTracking} isSpatial={isSpatial}>
      {/* TEMPORARY DIAGNOSTIC MARKER REQUIRED BY USER REQUEST */}
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 99999, background: '#00ff00', color: '#000000', padding: '8px 16px', fontWeight: 'bold', fontSize: '16px', fontFamily: 'monospace', borderBottomRightRadius: '8px', boxShadow: '0 0 10px rgba(0,255,0,0.8)' }}>
        ADVIS R3F DIAGNOSTIC - STATE: {systemState}
      </div>

      <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans selection:bg-cyan-500/30">
      
      {/* Action Preview Overlay */}
      {actionPreview && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none animate-fade-in-down">
          <div className="bg-emerald-950/90 border border-emerald-400 text-emerald-300 px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {actionPreview}
          </div>
        </div>
      )}

      <div 
        className="pointer-events-none absolute inset-0 z-0 opacity-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), color-mix(in srgb, var(--primary) 10%, transparent), transparent 40%)`
        }}
      />
      
      <Background systemState={systemState} themeColor={themeColor} />
      
      
      {/* Learn Engine Layer */}
      {activeLearningSession && (
        <LearnWorkspace 
           session={activeLearningSession} 
           onClose={() => setActiveLearningSession(null)} 
           onUpdateSession={setActiveLearningSession} 
        />
      )}
      
      {/* MediaPipe CV Tracking Adapter */}
      <MediaPipeAdapter enabled={cvEnabled} />

      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 15], fov: 45 }} eventSource={containerRef as any} eventPrefix="client">
          {/* Neutral Studio HDR Environment: Realistic PBR reflections, metal/roughness responses & ambient IBL */}
          <EnvironmentErrorBoundary>
            <React.Suspense fallback={null}>
              <Environment preset="studio" environmentIntensity={0.35} background={false} />
            </React.Suspense>
          </EnvironmentErrorBoundary>

          {/* Calibrated Studio 3-Point Engineering Lighting Rig */}
          {/* 1. Low neutral ambient light: Establishes depth and prevents washed-out cavities */}
          <ambientLight intensity={0.4} color="#f8fafc" />

          {/* 2. Key Light: High-angle front-right directional source establishing primary form and crisp shadow separation */}
          <directionalLight position={[12, 16, 12]} intensity={2.2} color="#ffffff" />

          {/* 3. Fill Light: Mid-angle front-left secondary source preventing completely black shadow regions */}
          <directionalLight position={[-12, 8, 10]} intensity={0.6} color="#f1f5f9" />

          {/* 4. Rim / Edge Light: Controlled rear-opposing source that cleanly separates model silhouette without washing edges */}
          <directionalLight position={[0, 14, -14]} intensity={0.75} color="#e2e8f0" />

          {/* 5. Underside Ground Bounce: Subtle lower illumination keeping oil pan and lower chassis details readable */}
          <directionalLight position={[0, -10, 4]} intensity={0.1} color="#94a3b8" />

          <GestureFrameUpdater handTracking={handTracking} isSpatial={isSpatial} />
          <CameraRig isSpatial={isSpatial} />
          <HologramCore systemState={systemState} audioLevel={audioLevel} bass={bass} treble={treble} hologramIntensity={hologramIntensity} themeColor={themeColor} isSpatial={isSpatial} />
        
          <React.Suspense fallback={null}>
            {activeLearningSession && activeLearningSession.steps && activeLearningSession.steps[activeLearningSession.currentStepIndex] && (
               <ChemistryVisuals visualStateId={activeLearningSession.steps[activeLearningSession.currentStepIndex].visualStateId} />
            )}

            {sessionMolecule.isSessionActive && sessionMolecule.molecule && !activeLearningSession && (
              <MolecularVisuals
                moleculeData={sessionMolecule.molecule}
                externalSelectedAtomId={sessionMolecule.selectedAtomId}
                externalSelectedBondId={sessionMolecule.selectedBondId}
                onAtomSelect={(atomId) => sessionMolecule.selectAtom(atomId)}
                onBondSelect={(bondId) => sessionMolecule.selectBond(bondId)}
                measurementMode={measurementMode}
              />
            )}
            
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
              componentTransforms={componentTransforms}
              explodedFactor={explodedFactor}
              xrayEnabled={xrayEnabled}
              blueprintEnabled={blueprintEnabled}
              highlightedComponentId={highlightedComponentId}
              isolatedComponentId={isolatedComponentId}
              tracedFunctionKey={tracedFunctionKey}
              isKinematicPlaying={isKinematicPlaying}
              kinematicSpeed={kinematicSpeed}
              kinematicTimeOffset={kinematicTimeOffset}
              v12Rpm={v12Rpm}
              v12Direction={v12Direction}
              isMagnifierFocused={isMagnifierFocused}
              lodTier={lodTier}
            />
          </React.Suspense>
          
          <EffectComposer>
            <Bloom 
              luminanceThreshold={0.85} 
              mipmapBlur 
              intensity={0.1 * hologramIntensity} 
            />
            <ChromaticAberration 
               
              offset={new THREE.Vector2(0.0005, 0.0005)} 
              
              
            />
            <Noise opacity={0.012} />
          </EffectComposer>
        </Canvas>
    </div>

    {/* Molecular Builder HUD Layer */}
    <MolecularBuilderHUD 
      measurementMode={measurementMode}
      onToggleMeasurement={() => setMeasurementMode(!measurementMode)}
    />

    {/* UI Layer */}
    <div className="absolute inset-0 z-10 flex flex-col pointer-events-none transition-opacity duration-1000 opacity-100">
      <div className={`transition-all duration-1000 ${isSpatial ? 'opacity-0 pointer-events-none -translate-y-full' : 'opacity-100 translate-y-0'}`}>
        <MobileNav currentView={currentView} setView={setCurrentView} />
      </div>
      <div className="flex-1 flex overflow-hidden p-2 md:p-6 gap-6 relative mt-16 lg:mt-0">
        <div className={`hidden lg:block transition-all duration-1000 ${isSpatial ? 'opacity-0 pointer-events-none -translate-x-full' : 'opacity-100 translate-x-0'}`}>
          <Sidebar currentView={currentView} setView={setCurrentView} />
        </div>
        
        <div className="flex-1 flex items-center justify-center relative">
          {(!currentSpatialObject && !activeLearningSession && !sessionMolecule.isSessionActive) && (
            <div className="w-full flex justify-center pb-24 md:pb-20">
              <ScientificLaunchpad
                onOpenView={(view) => setCurrentView(view)}
                onSelectMolecule={(formulaOrKey) => {
                  sessionMolecule.closeSession();
                  setCurrentSpatialObject(null);
                  setActiveLearningSession(buildChemistryLesson(formulaOrKey, 'SHOW_STRUCTURE', 'SHOW_ME'));
                }}
                onSelectSpatialObject={(objectId) => {
                  sessionMolecule.closeSession();
                  setActiveLearningSession(null);
                  setCurrentSpatialObject(objectId);
                  changeSpatialMode('INSPECTION');
                }}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ${isSpatial ? 'transform translate-y-full opacity-0 pointer-events-none' : 'transform translate-y-0 opacity-100 pointer-events-auto'}`}>
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
    
    {/* 4-CORNER HIGH-VALUE SCIENTIFIC HUD */}
    {!activeLearningSession && !sessionMolecule.isSessionActive && (
      <ScientificHUD
        activeSpatialObject={currentSpatialObject}
        activeLearningSession={activeLearningSession}
        spatialMode={spatialMode}
        onChangeSpatialMode={changeSpatialMode}
        isExploded={isExploded}
        onToggleExploded={() => setIsExploded(!isExploded)}
        xrayEnabled={xrayEnabled}
        onToggleXray={() => setXrayEnabled(!xrayEnabled)}
        blueprintEnabled={blueprintEnabled}
        onToggleBlueprint={() => setBlueprintEnabled(!blueprintEnabled)}
        onOpenEngineeringMode={() => setIsEngineeringMode(true)}
        onExitSpatial={() => {
          sessionMolecule.closeSession();
          setCurrentSpatialObject(null);
          setSelectedComponentId(null);
          setHoveredComponentId(null);
          changeSpatialMode('INSPECTION');
        }}
        selectedComponentId={selectedComponentId}
        onSelectComponent={setSelectedComponentId}
        handTracking={handTracking}
        cvEnabled={cvEnabled}
        onToggleCv={() => setCvEnabled(!cvEnabled)}
        onSelectMolecule={(formulaOrKey) => {
          sessionMolecule.closeSession();
          setCurrentSpatialObject(null);
          setActiveLearningSession(buildChemistryLesson(formulaOrKey, 'SHOW_STRUCTURE', 'SHOW_ME'));
        }}
        onSelectSpatialObject={(objectId, mode) => {
          sessionMolecule.closeSession();
          setActiveLearningSession(null);
          setCurrentSpatialObject(objectId);
          changeSpatialMode(mode || 'INSPECTION');
        }}
        onStartLesson={(subject, intent: any) => {
          sessionMolecule.closeSession();
          setCurrentSpatialObject(null);
          setActiveLearningSession(buildChemistryLesson(subject, intent || 'VSEPR', 'TEACH_ME'));
        }}
        onOpenView={(view) => setCurrentView(view)}
        presentationStep={presentationStep}
        isolatedComponentId={isolatedComponentId}
        onToggleIsolate={setIsolatedComponentId}
        tracedFunctionKey={tracedFunctionKey}
        onTraceFunction={setTracedFunctionKey}
        isKinematicPlaying={isKinematicPlaying}
        onToggleKinematicPlaying={() => setIsKinematicPlaying(!isKinematicPlaying)}
        kinematicSpeed={kinematicSpeed}
        onChangeKinematicSpeed={setKinematicSpeed}
        kinematicTimeOffset={kinematicTimeOffset}
        onChangeKinematicTimeOffset={setKinematicTimeOffset}
        onSendMessage={handleSendMessage}
      />
    )}

    <HolographicCursor handTracking={handTracking} isSpatial={isSpatial} />
    <GestureLegend handTracking={handTracking} isSpatial={isSpatial} />
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
      onSelectMolecule={(formulaOrKey) => {
        sessionMolecule.closeSession();
        setCurrentSpatialObject(null);
        setActiveLearningSession(buildChemistryLesson(formulaOrKey, 'SHOW_STRUCTURE', 'SHOW_ME'));
      }}
      onLoadMoleculeBuilder={(formulaOrKey) => {
        setActiveLearningSession(null);
        setCurrentSpatialObject(null);
        sessionMolecule.loadCanonical(formulaOrKey);
      }}
      onSelectSpatialObject={(objectId, mode) => {
        sessionMolecule.closeSession();
        setActiveLearningSession(null);
        setCurrentSpatialObject(objectId);
        changeSpatialMode(mode || 'INSPECTION');
      }}
      onStartLesson={(subject, intent: any) => {
        sessionMolecule.closeSession();
        setCurrentSpatialObject(null);
        setActiveLearningSession(buildChemistryLesson(subject, intent || 'VSEPR', 'TEACH_ME'));
      }}
      handTracking={handTracking}
      activeSpatialObject={currentSpatialObject}
      activeLearningSession={activeLearningSession}
      spatialMode={spatialMode}
      isExploded={isExploded}
      selectedComponentId={selectedComponentId}
    />
    
    {/* Workspace Lockdown Overlay */}
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
            WORKSPACE LOCKDOWN
          </h1>
          <p className="text-red-400 text-lg md:text-xl font-mono tracking-widest uppercase mb-12 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">
            Workspace Locked. Access Restricted.
          </p>
          <button 
            onClick={() => setBarnDoorActive(false)}
            className="px-8 py-4 border-2 border-red-500/50 text-red-500 font-mono tracking-widest hover:bg-red-500 hover:text-black hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] transition-all uppercase rounded font-bold"
          >
            UNLOCK WORKSPACE
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

    {/* Engineering Mode HUD Overlay (Phase 1A & 1D) */}
    {isEngineeringMode && (
      <EngineeringHUD 
        onClose={() => setIsEngineeringMode(false)} 
        activeObject={currentSpatialObject} 
        selectedComponentId={selectedComponentId}
        onSelectComponent={setSelectedComponentId}
        componentTransforms={componentTransforms}
        onUpdateComponentTransform={handleUpdateComponentTransform}
        explodedFactor={explodedFactor}
        onUpdateExplodedFactor={setExplodedFactor}
        xrayEnabled={xrayEnabled}
        onToggleXray={() => setXrayEnabled(!xrayEnabled)}
        blueprintEnabled={blueprintEnabled}
        onToggleBlueprint={() => setBlueprintEnabled(!blueprintEnabled)}
        highlightedComponentId={highlightedComponentId}
        onHighlightComponent={setHighlightedComponentId}
        measurementMode={measurementMode}
        onToggleMeasurement={() => setMeasurementMode(!measurementMode)}
        v12Rpm={v12Rpm}
        onUpdateV12Rpm={setV12Rpm}
        v12Direction={v12Direction}
        onToggleV12Direction={() => setV12Direction(prev => (prev === 1 ? -1 : 1))}
        isMagnifierFocused={isMagnifierFocused}
        onToggleMagnifier={() => setIsMagnifierFocused(prev => !prev)}
        lodTier={lodTier}
        onUpdateLodTier={setLodTier}
      />
    )}

    {/* Connection Screen / Cinematic Boot Loader */}
    {(systemState === 'CONNECTING') && (
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
  </GestureProvider>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <SessionMoleculeProvider>
        <AppContent />
      </SessionMoleculeProvider>
    </AppErrorBoundary>
  );
}
