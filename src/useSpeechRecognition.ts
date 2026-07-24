import { useEffect, useRef } from 'react';
import { SystemState } from './App';

export function useSpeechRecognition(
  systemState: SystemState,
  setSystemState: (state: SystemState) => void,
  handleSendMessage: (text: string) => void,
  sessionActiveRef: React.MutableRefObject<boolean>,
  setWakeWordEnergy: (val: number) => void
) {
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const stateRef = useRef(systemState);
  const listeningTimeoutRef = useRef<any>(null);
  const lastProcessedTranscriptRef = useRef('');
  const voiceActivationDisabledRef = useRef(false);
  const handleSendMessageRef = useRef(handleSendMessage);

  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  useEffect(() => {
    stateRef.current = systemState;
    if (systemState === 'LISTENING') {
      if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = setTimeout(() => {
        if (stateRef.current === 'LISTENING') {
          setSystemState('ONLINE');
        }
      }, 7000);
    } else {
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
        listeningTimeoutRef.current = null;
      }
    }
  }, [systemState, setSystemState]);

  const prevSystemStateRef = useRef(systemState);

  useEffect(() => {
    if (prevSystemStateRef.current === 'LISTENING' && systemState === 'ONLINE') {
       sessionActiveRef.current = false;
       if (listeningTimeoutRef.current) {
         clearTimeout(listeningTimeoutRef.current);
         listeningTimeoutRef.current = null;
       }
       const recognition = recognitionRef.current;
       if (recognition && isListeningRef.current) {
          isListeningRef.current = false;
          try { recognition.stop(); } catch(e) {}
       }
    }
    prevSystemStateRef.current = systemState;
  }, [systemState, sessionActiveRef]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const transcript = (finalTranscript || interimTranscript).toLowerCase().trim();
        const currentState = stateRef.current;
        
        const wakeWords = [
          'hey advis', 'hey advice', 'hey advise', 'hey a.d.v.i.s', 'hey a d v i s', 'hey adis',
          'advis', 'advice', 'advise', 'advises', 'a.d.v.i.s', 'a d v i s', 'adis', 'adys'
        ];
        
        if (transcript.length > 0 && currentState === 'ONLINE') {
           setWakeWordEnergy(Math.random() * 50 + 50);
        }
        
        if (currentState === 'ONLINE') {
          if (sessionActiveRef.current) {
             if (transcript.length > 0) {
                setSystemState('LISTENING');
             }
          } else {
             const hasWakeWord = wakeWords.some(w => transcript.includes(w));
             if (hasWakeWord) {
                setSystemState('LISTENING');
                
                if (finalTranscript) {
                   let command = finalTranscript.toLowerCase().trim();
                   for (const w of wakeWords) {
                     if (command.startsWith(w)) {
                       command = command.substring(w.length).replace(/^[.,;:!?]\s*/, '').trim();
                       break;
                     }
                   }
                   if (command.length > 0 && command !== lastProcessedTranscriptRef.current) {
                      lastProcessedTranscriptRef.current = command;
                      handleSendMessageRef.current(command);
                   }
                }
                return;
             }
          }
        }
        
        if (currentState === 'LISTENING') {
           if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current);
           listeningTimeoutRef.current = setTimeout(() => {
             if (stateRef.current === 'LISTENING') {
               setSystemState('ONLINE');
             }
           }, 7000);

           if (finalTranscript) {
             let command = finalTranscript.toLowerCase().trim();
             
             for (const w of wakeWords) {
               if (command.startsWith(w)) {
                 command = command.substring(w.length).replace(/^[.,;:!?]\s*/, '').trim();
                 break;
               }
             }
             
             if (command.length > 0 && command !== lastProcessedTranscriptRef.current) {
                lastProcessedTranscriptRef.current = command;
                handleSendMessageRef.current(command);
             }
           }
        }
      };
      
      recognition.onstart = () => {
        voiceActivationDisabledRef.current = false;
      };

      recognition.onerror = (e: any) => {
        const currentState = stateRef.current;
        const isFatal = e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture';
        
        if (isFatal) {
          console.warn("Speech recognition access denied/disabled:", e.error);
          voiceActivationDisabledRef.current = true; // prevent automatic restart/wake-word in ONLINE state
          isListeningRef.current = false;
          try { recognition.stop(); } catch (err) {}
          
          if (currentState === 'LISTENING' || currentState === 'ONLINE') {
            setSystemState('ERROR');
            setTimeout(() => {
              if (stateRef.current === 'ERROR') {
                setSystemState('ONLINE');
              }
            }, 3000);
          }
        } else {
          if (e.error !== 'no-speech' && e.error !== 'aborted') {
            console.warn("Speech recognition non-fatal issue:", e.error);
          }
          // For transient errors like 'no-speech' in LISTENING state, revert to ONLINE so the UI doesn't hang
          if (currentState === 'LISTENING' && e.error !== 'aborted') {
            setSystemState('ONLINE');
          }
        }
      };

      recognition.onend = () => {
         lastProcessedTranscriptRef.current = '';
         if (isListeningRef.current) {
            setTimeout(() => {
              if (isListeningRef.current) {
                try { 
                  recognition.start(); 
                } catch(e) {
                  // If we fail to restart, mark as not listening
                  isListeningRef.current = false;
                }
              }
            }, 300);
         }
      };

      recognitionRef.current = recognition;
    }

    return () => {
       isListeningRef.current = false;
       try { recognitionRef.current?.stop(); } catch(e) {}
    };
  }, [setSystemState, sessionActiveRef, setWakeWordEnergy]);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    const shouldListen = systemState === 'LISTENING' || (systemState === 'ONLINE' && !voiceActivationDisabledRef.current);
    
    if (shouldListen) {
       if (!isListeningRef.current) {
          isListeningRef.current = true;
          try { recognition.start(); } catch(e) {}
       }
    } else {
       if (isListeningRef.current) {
          isListeningRef.current = false;
          try { recognition.stop(); } catch(e) {}
       }
    }
  }, [systemState]);
}
