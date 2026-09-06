// audioEffects.ts
// Synthesize subtle UI tones using Web Audio API

let audioContext: AudioContext | null = null;

function getContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

export function playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
  try {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gainNode.gain.setValueAtTime(vol, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
}

export function playStateTransitionSound(state: string) {
  switch (state) {
    case 'ONLINE':
      // Ready: High ping, short
      playTone(880, 'sine', 0.15, 0.05);
      setTimeout(() => playTone(1760, 'sine', 0.2, 0.05), 100);
      break;
    case 'LISTENING':
      // Listening: Rising tone
      playTone(440, 'triangle', 0.1, 0.05);
      setTimeout(() => playTone(660, 'triangle', 0.15, 0.05), 80);
      break;
    case 'THINKING':
      // Thinking: Low muffled pulse
      playTone(220, 'sine', 0.3, 0.08);
      break;
    case 'SPEAKING':
      // Speaking: Gentle soft chime
      playTone(660, 'sine', 0.2, 0.05);
      setTimeout(() => playTone(554, 'sine', 0.3, 0.05), 120);
      break;
  }
}
