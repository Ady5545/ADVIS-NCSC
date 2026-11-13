import { useEffect, useRef } from 'react';
import { SystemState } from './App';

type SpeechRecognitionResult = {
  transcript: string;
};

const extractWakeCommand = (value: string): { activated: boolean; command: string } => {
  const normalized = value.toLowerCase().trim();
  const match = normalized.match(/^(?:hey\s+)?(?:a\s*\.\s*d\s*\.\s*v\s*\.\s*i\s*\.\s*s\.?|a\s+d\s+v\s+i\s+s|advis)\b[\s,.:;!?-]*(.*)$/i);
  return match
    ? { activated: true, command: (match[1] || '').trim() }
    : { activated: false, command: '' };
};

export function useSpeechRecognition(
  systemState: SystemState,
  setSystemState: (state: SystemState) => void,
  handleSendMessage: (text: string) => void,
  sessionActiveRef: React.MutableRefObject<boolean>,
  setWakeWordEnergy: (val: number) => void,
  micEnabled: boolean,
  setMicEnabled: (enabled: boolean) => void,
  setVoiceError: (message: string | null) => void
) {
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const shouldRunRef = useRef(false);
  const stateRef = useRef(systemState);
  const micEnabledRef = useRef(micEnabled);
  const listeningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommandRef = useRef('');
  const lastCommandAtRef = useRef(0);
  const handleSendMessageRef = useRef(handleSendMessage);
  const setSystemStateRef = useRef(setSystemState);
  const setMicEnabledRef = useRef(setMicEnabled);
  const setVoiceErrorRef = useRef(setVoiceError);
  const setWakeWordEnergyRef = useRef(setWakeWordEnergy);

  useEffect(() => { handleSendMessageRef.current = handleSendMessage; }, [handleSendMessage]);
  useEffect(() => { setSystemStateRef.current = setSystemState; }, [setSystemState]);
  useEffect(() => { setMicEnabledRef.current = setMicEnabled; }, [setMicEnabled]);
  useEffect(() => { setVoiceErrorRef.current = setVoiceError; }, [setVoiceError]);
  useEffect(() => { setWakeWordEnergyRef.current = setWakeWordEnergy; }, [setWakeWordEnergy]);

  useEffect(() => {
    stateRef.current = systemState;
    micEnabledRef.current = micEnabled;
    shouldRunRef.current = micEnabled && (systemState === 'ONLINE' || systemState === 'LISTENING');

    if (systemState !== 'LISTENING' && listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }

    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (shouldRunRef.current && !isListeningRef.current) {
      try {
        isListeningRef.current = true;
        recognition.start();
      } catch {
        isListeningRef.current = false;
        // Some browsers reject start() if a previous session is still winding down.
        if (micEnabledRef.current && !restartTimeoutRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            restartTimeoutRef.current = null;
            if (shouldRunRef.current && !isListeningRef.current) {
              try { isListeningRef.current = true; recognition.start(); }
              catch { isListeningRef.current = false; }
            }
          }, 450);
        }
      }
    } else if (!shouldRunRef.current && isListeningRef.current) {
      isListeningRef.current = false;
      try { recognition.stop(); } catch {}
    }
  }, [systemState, micEnabled]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceErrorRef.current('This browser does not support continuous speech recognition. Try a Chromium-based browser.');
      setMicEnabledRef.current(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    if (shouldRunRef.current) {
      try { isListeningRef.current = true; recognition.start(); }
      catch { isListeningRef.current = false; }
    }

    const openCommandWindow = () => {
      sessionActiveRef.current = true;
      setSystemStateRef.current('LISTENING');
      if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = setTimeout(() => {
        listeningTimeoutRef.current = null;
        sessionActiveRef.current = false;
        if (stateRef.current === 'LISTENING') setSystemStateRef.current('ONLINE');
      }, 8500);
    };

    const submitCommand = (command: string) => {
      const cleaned = command.trim().replace(/^[,.:;!?-]+\s*/, '');
      if (!cleaned) return;
      const now = Date.now();
      if (cleaned === lastCommandRef.current && now - lastCommandAtRef.current < 1800) return;
      lastCommandRef.current = cleaned;
      lastCommandAtRef.current = now;
      sessionActiveRef.current = false;
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
        listeningTimeoutRef.current = null;
      }
      handleSendMessageRef.current(cleaned);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const phrase = (event.results[i][0] as SpeechRecognitionResult).transcript || '';
        if (event.results[i].isFinal) finalTranscript += phrase;
        else interimTranscript += phrase;
      }

      const observed = (finalTranscript || interimTranscript).toLowerCase().trim();
      if (observed && stateRef.current === 'ONLINE') {
        setWakeWordEnergyRef.current(70 + Math.random() * 30);
      }

      if (!finalTranscript.trim()) return;
      const finalText = finalTranscript.toLowerCase().trim();
      const currentState = stateRef.current;

      if (currentState === 'ONLINE') {
        const wake = extractWakeCommand(finalText);
        if (!wake.activated) return;
        openCommandWindow();
        if (wake.command) submitCommand(wake.command);
        return;
      }

      if (currentState === 'LISTENING' && sessionActiveRef.current) {
        const possibleWake = extractWakeCommand(finalText);
        submitCommand(possibleWake.activated ? possibleWake.command : finalText);
      }
    };

    recognition.onstart = () => {
      isListeningRef.current = true;
      setVoiceErrorRef.current(null);
    };

    recognition.onerror = (event: any) => {
      const error = event?.error || 'unknown';
      if (error === 'not-allowed' || error === 'service-not-allowed' || error === 'audio-capture') {
        shouldRunRef.current = false;
        isListeningRef.current = false;
        sessionActiveRef.current = false;
        setMicEnabledRef.current(false);
        setVoiceErrorRef.current(
          error === 'audio-capture'
            ? 'No microphone input is available. Check the selected microphone.'
            : 'Microphone permission was denied. Allow microphone access in the browser, then enable Wake Word again.'
        );
        if (stateRef.current === 'LISTENING') setSystemStateRef.current('ONLINE');
      } else if (error !== 'no-speech' && error !== 'aborted' && error !== 'network') {
        console.warn('ADVIS speech recognition issue:', error);
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = setTimeout(() => {
        restartTimeoutRef.current = null;
        if (shouldRunRef.current && micEnabledRef.current &&
            (stateRef.current === 'ONLINE' || stateRef.current === 'LISTENING') &&
            !isListeningRef.current) {
          try {
            isListeningRef.current = true;
            recognition.start();
          } catch {
            isListeningRef.current = false;
          }
        }
      }, 350);
    };

    return () => {
      shouldRunRef.current = false;
      isListeningRef.current = false;
      if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      try { recognition.stop(); } catch {}
      recognitionRef.current = null;
    };
  }, [sessionActiveRef]);
}
