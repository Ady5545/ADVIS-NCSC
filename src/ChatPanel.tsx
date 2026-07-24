import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, SystemState } from './App';

function TypewriterMessage({ text, isLatest, audioLevel = 0 }: { text: string, isLatest: boolean, audioLevel?: number }) {
  const [displayedLength, setDisplayedLength] = useState(isLatest ? 0 : text.length);
  const [isTyping, setIsTyping] = useState(isLatest);

  useEffect(() => {
    if (!isLatest) {
      setDisplayedLength(text.length);
      setIsTyping(false);
      return;
    }
    
    setDisplayedLength(0);
    setIsTyping(true);
    
    let started = false;
    const onStart = () => { started = true; };
    const onBoundary = (e: any) => {
      started = true;
      const progress = e.detail.textLength > 0 ? (e.detail.charIndex + (e.detail.length || 0)) / e.detail.textLength : 1;
      const targetLength = Math.ceil(progress * text.length);
      setDisplayedLength(prev => Math.max(prev, targetLength));
    };
    const onEnd = () => {
      setDisplayedLength(text.length);
      setIsTyping(false);
    };

    window.addEventListener('advis-speech-start', onStart);
    window.addEventListener('advis-speech-boundary', onBoundary);
    window.addEventListener('advis-speech-end', onEnd);
    
    const intervalId = setInterval(() => {
      if (!started) return;
      setDisplayedLength(prev => Math.min(text.length, prev + 1));
    }, 50);

    const failsafeId = setTimeout(() => {
      started = true;
    }, 1500);

    return () => {
      window.removeEventListener('advis-speech-start', onStart);
      window.removeEventListener('advis-speech-boundary', onBoundary);
      window.removeEventListener('advis-speech-end', onEnd);
      clearInterval(intervalId);
      clearTimeout(failsafeId);
    };
  }, [text, isLatest]);

  useEffect(() => {
    if (isTyping && displayedLength >= text.length) {
      setIsTyping(false);
    }
  }, [displayedLength, text.length, isTyping]);

  return (
    <span 
      style={isTyping && audioLevel > 0 ? {
        textShadow: `0 0 ${audioLevel * 15}px rgba(34,211,238,${audioLevel * 0.8}), 0 0 ${audioLevel * 30}px rgba(34,211,238,${audioLevel * 0.4})`,
        color: `rgba(200, 255, 255, ${1 + audioLevel * 0.5})`, // Make text slightly brighter
        transition: 'text-shadow 0.1s ease-out, color 0.1s ease-out'
      } : {
        transition: 'text-shadow 0.3s ease-out, color 0.3s ease-out'
      }}
    >
      {text.slice(0, displayedLength)}
      {isTyping && <span 
        className="inline-block w-2 h-4 ml-1 bg-cyan-400 align-middle" 
        style={{
          opacity: 0.4 + audioLevel * 0.6,
          boxShadow: `0 0 ${audioLevel * 20}px rgba(34,211,238,${audioLevel})`
        }} 
      />}
    </span>
  );
}

export function ChatPanel({ messages, systemState, audioLevel }: { messages: ChatMessage[], systemState: SystemState, audioLevel?: number }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, systemState]);

  // We only want the typing effect on the very last message in the list, and only if it's from ADVIS
  // and the system is currently SPEAKING. Once it finishes speaking (ONLINE), the text should fully reveal.
  const lastMessageIndex = messages.length - 1;

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-4 pb-32 pt-10 custom-scrollbar pointer-events-auto mask-image-both">
      <AnimatePresence initial={false}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
          >
            <div className={`text-[10px] mb-1 font-mono tracking-widest ${msg.role === 'user' ? 'text-cyan-400/50' : 'text-cyan-400/50'}`}>
              {msg.role === 'user' ? 'USER_DIRECTIVE' : 'A.D.V.I.S.'} // {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false })}
            </div>
            <div className={`p-3 rounded-lg backdrop-blur-md border ${
              msg.role === 'user' 
                ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-50 rounded-tr-none shadow-[0_0_15px_rgba(0,255,255,0.1)]' 
                : 'bg-black/40 border-cyan-500/20 text-cyan-100 rounded-tl-none border-l-2 border-l-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.05)]'
            }`}>
              {msg.image && (
                <img src={msg.image.content} alt="User Upload" className="max-w-full rounded-md mb-2 max-h-48 object-contain" />
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <TypewriterMessage text={msg.content} isLatest={i === lastMessageIndex && systemState === 'SPEAKING'} audioLevel={audioLevel} />
                )}
              </p>
            </div>
          </motion.div>
        ))}
        
        {systemState === 'LISTENING' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="self-start max-w-[85%]"
          >
            <div className="text-[10px] mb-1 font-mono tracking-widest text-cyan-400/50">A.D.V.I.S. // AUDIO INPUT</div>
            <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/20 text-cyan-400 border-l-2 border-l-cyan-400 rounded-tl-none flex items-center gap-2">
              <span className="text-sm font-mono tracking-widest animate-pulse">Listening...</span>
              <div className="flex gap-1 items-center h-4 ml-2">
                <div className="w-1 bg-cyan-400 animate-[pulse_1s_ease-in-out_infinite] h-2"></div>
                <div className="w-1 bg-cyan-400 animate-[pulse_1.2s_ease-in-out_infinite_0.2s] h-4"></div>
                <div className="w-1 bg-cyan-400 animate-[pulse_1s_ease-in-out_infinite_0.4s] h-3"></div>
              </div>
            </div>
          </motion.div>
        )}

        {systemState === 'THINKING' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="self-start max-w-[85%]"
          >
            <div className="text-[10px] mb-1 font-mono tracking-widest text-orange-400/50">A.D.V.I.S. // PROCESSING</div>
            <div className="p-3 rounded-lg bg-black/40 border border-orange-500/20 text-orange-400 border-l-2 border-l-orange-400 rounded-tl-none flex items-center gap-2">
              <span className="text-sm font-mono tracking-widest animate-pulse">Analyzing...</span>
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={endRef} className="h-4 shrink-0" />
    </div>
  );
}
