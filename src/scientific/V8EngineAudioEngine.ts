// V8EngineAudioEngine.ts
// Real-time procedural Web Audio API synthesizer for a representative 90° cross-plane V8.
// Uses the correct four-stroke mean firing order (4 combustion events per crank revolution),
// a lower-order rumble layer, RPM-swept exhaust/intake filters, and a restrained mechanical layer.
// This is a parameterized educational synthesis, not a recording of a particular OEM engine.

import { useEffect } from 'react';
import { normalizeV8AudioVolume, resolveV8AudioSynthesisProfile, shouldRunV8Audio } from './V8AudioMath';

export interface V8AudioParams {
  rpm: number;
  isPlaying: boolean;
  speed?: number;
  soundEnabled: boolean;
  masterVolume?: number;
}

class V8EngineAudioEngineClass {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private isRunning = false;

  // Master Gain & Dynamics
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Primary Firing Pulse Oscillators (4E Fundamental & Harmonics)
  // In a four-stroke V8: 8 firing events over 720 crank degrees = 4 firing pulses per crank revolution (4E order)
  private oscPrimary: OscillatorNode | null = null;      // 4E firing fundamental
  private oscSub: OscillatorNode | null = null;          // 2E low-order exhaust / bank-pulse texture
  private oscHarmonic: OscillatorNode | null = null;     // 8E second firing harmonic
  private oscScream: OscillatorNode | null = null;       // 12E upper firing harmonic

  // Gain Stages for Individual Acoustic Layers
  private gainPrimary: GainNode | null = null;
  private gainSub: GainNode | null = null;
  private gainHarmonic: GainNode | null = null;
  private gainScream: GainNode | null = null;
  private gainMechanical: GainNode | null = null;

  // Mechanical Whine / Valvetrain DOHC Chain Noise
  private oscMechanical: OscillatorNode | null = null;
  private filterMechanical: BiquadFilterNode | null = null;

  // Acoustic Waveshaper & Resonator Filters
  private waveshaper: WaveShaperNode | null = null;
  private exhaustFilter: BiquadFilterNode | null = null;
  private intakeResonator: BiquadFilterNode | null = null;

  // Low Frequency Jitter LFO (mimics subtle micro-variation between combustion cycles at idle)
  private lfoJitter: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  // Current target values
  private currentRpm = 600;
  private currentSpeed = 1.0;
  private isPlaying = true;
  private isMuted = false;
  private volumeLevel = 0.28;

  // Generate hyperbolic tangent waveshaping curve for exhaust pulse non-linearity
  private makeDistortionCurve(amount = 20, n_samples = 2048): Float32Array {
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Soft saturation curve modeling cylinder blowdown pressure waves
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  private initAudio() {
    if (this.isInitialized && this.ctx) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        console.warn('[V8Audio] Web Audio API is not supported in this browser.');
        return;
      }

      this.ctx = new AudioCtx();
      const ctx = this.ctx;

      // 1. Dynamics Compressor for broadcast punch & anti-clipping
      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, ctx.currentTime);
      this.compressor.knee.setValueAtTime(8, ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      this.compressor.release.setValueAtTime(0.08, ctx.currentTime);
      this.compressor.connect(ctx.destination);

      // 2. Master Gain Node
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, ctx.currentTime); // Start muted
      this.masterGain.connect(this.compressor);

      // 3. Dual Exhaust & Intake Filter Network
      // Exhaust Resonator: Lowpass with subtle acoustic resonance
      this.exhaustFilter = ctx.createBiquadFilter();
      this.exhaustFilter.type = 'lowpass';
      this.exhaustFilter.frequency.setValueAtTime(320, ctx.currentTime);
      this.exhaustFilter.Q.setValueAtTime(2.2, ctx.currentTime);

      // Intake Helmholtz Resonator: Peaking filter that sweeps with RPM
      this.intakeResonator = ctx.createBiquadFilter();
      this.intakeResonator.type = 'peaking';
      this.intakeResonator.frequency.setValueAtTime(450, ctx.currentTime);
      this.intakeResonator.Q.setValueAtTime(3.0, ctx.currentTime);
      this.intakeResonator.gain.setValueAtTime(6.0, ctx.currentTime);

      this.exhaustFilter.connect(this.intakeResonator);
      this.intakeResonator.connect(this.masterGain);

      // 4. Exhaust Blowdown Waveshaper
      this.waveshaper = ctx.createWaveShaper();
      this.waveshaper.curve = this.makeDistortionCurve(16) as any;
      this.waveshaper.oversample = '2x';
      this.waveshaper.connect(this.exhaustFilter);

      // 5. Individual Acoustic Layer Gains
      this.gainPrimary = ctx.createGain();
      this.gainSub = ctx.createGain();
      this.gainHarmonic = ctx.createGain();
      this.gainScream = ctx.createGain();
      this.gainMechanical = ctx.createGain();

      this.gainPrimary.connect(this.waveshaper);
      this.gainSub.connect(this.waveshaper);
      this.gainHarmonic.connect(this.waveshaper);
      this.gainScream.connect(this.waveshaper);

      // Mechanical Whine feeds directly to intake resonator (bypasses heavy distortion)
      this.filterMechanical = ctx.createBiquadFilter();
      this.filterMechanical.type = 'bandpass';
      this.filterMechanical.frequency.setValueAtTime(1400, ctx.currentTime);
      this.filterMechanical.Q.setValueAtTime(3.5, ctx.currentTime);
      this.gainMechanical.connect(this.filterMechanical);
      this.filterMechanical.connect(this.masterGain);

      // 6. Oscillators for V8 Engine Orders
      // A. Primary 4E firing-order oscillator (sawtooth exhaust pulse texture)
      this.oscPrimary = ctx.createOscillator();
      this.oscPrimary.type = 'sawtooth';
      this.oscPrimary.frequency.setValueAtTime(40, ctx.currentTime);
      this.oscPrimary.connect(this.gainPrimary);

      // B. Low-order 2E component for a heavier cross-plane V8 rumble
      this.oscSub = ctx.createOscillator();
      this.oscSub.type = 'triangle';
      this.oscSub.frequency.setValueAtTime(20, ctx.currentTime);
      this.oscSub.connect(this.gainSub);

      // C. 8E second firing harmonic for exhaust rasp
      this.oscHarmonic = ctx.createOscillator();
      this.oscHarmonic.type = 'sawtooth';
      this.oscHarmonic.frequency.setValueAtTime(80, ctx.currentTime);
      this.oscHarmonic.connect(this.gainHarmonic);

      // D. 12E upper firing harmonic (illustrative upper-order tone)
      this.oscScream = ctx.createOscillator();
      this.oscScream.type = 'sine';
      this.oscScream.frequency.setValueAtTime(120, ctx.currentTime);
      this.oscScream.connect(this.gainScream);

      // E. Mechanical accessory / valvetrain overtone
      this.oscMechanical = ctx.createOscillator();
      this.oscMechanical.type = 'sine';
      this.oscMechanical.frequency.setValueAtTime(160, ctx.currentTime);
      this.oscMechanical.connect(this.gainMechanical);

      // 7. Subtle Combustion Cycle Jitter LFO (mimics realistic idle flutter)
      this.lfoJitter = ctx.createOscillator();
      this.lfoJitter.type = 'sine';
      this.lfoJitter.frequency.setValueAtTime(7.2, ctx.currentTime);
      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.setValueAtTime(1.4, ctx.currentTime);
      this.lfoJitter.connect(this.lfoGain);
      this.lfoGain.connect(this.oscPrimary.frequency);

      // Start all sound generator nodes
      this.oscPrimary.start();
      this.oscSub.start();
      this.oscHarmonic.start();
      this.oscScream.start();
      this.oscMechanical.start();
      this.lfoJitter.start();

      this.isInitialized = true;
      this.isRunning = true;
    } catch (err) {
      console.warn('[V8Audio] Web Audio engine initialization deferred or unavailable:', err);
    }
  }

  // Ensure AudioContext is active (handles browser autoplay security policy)
  private async ensureContextActive(): Promise<boolean> {
    if (!this.ctx) {
      this.initAudio();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // Attach user interaction fallback
        if (typeof window !== 'undefined') {
          const unlock = () => {
            if (this.ctx && this.ctx.state === 'suspended') {
              this.ctx.resume().then(() => {
                if (this.isPlaying && !this.isMuted && this.currentRpm > 0) {
                  this.applySynthesisParameters();
                }
              }).catch(() => {});
            }
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
          };
          window.addEventListener('pointerdown', unlock, { passive: true });
          window.addEventListener('keydown', unlock, { passive: true });
          window.addEventListener('touchstart', unlock, { passive: true });
        }
        return false;
      }
    }
    return Boolean(this.ctx && this.ctx.state === 'running');
  }

  /**
   * Main synthesis update loop.
   * Dynamically modulates frequencies, filter cutoffs, and harmonic balances based on RPM.
   */
  public update(params: V8AudioParams) {
    const { rpm, isPlaying, speed = 1.0, soundEnabled, masterVolume } = params;
    this.currentRpm = Number.isFinite(rpm) ? Math.max(0, Math.min(7000, rpm)) : 0;
    this.currentSpeed = Number.isFinite(speed) ? Math.max(0.1, Math.min(2, speed)) : 1;
    this.isPlaying = isPlaying;
    this.isMuted = !soundEnabled;
    if (typeof masterVolume === 'number' && Number.isFinite(masterVolume)) {
      this.volumeLevel = normalizeV8AudioVolume(masterVolume, this.volumeLevel);
    }

    // Paused, muted, zero-RPM, or invalid requests must ramp down without initializing audio.
    if (!shouldRunV8Audio({ rpm: this.currentRpm, isPlaying, soundEnabled })) {
      this.rampDownMaster();
      return;
    }

    // Lazy initialize on first active play request
    if (!this.isInitialized) {
      this.initAudio();
    }

    this.ensureContextActive().then(isActive => {
      if (!isActive || !this.ctx || !this.masterGain) return;
      this.applySynthesisParameters();
    });
  }

  private rampDownMaster() {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.0001, now, 0.05); // Smooth 50ms fadeout
    } catch (e) {
      // Audio param error prevention
    }
  }

  private applySynthesisParameters() {
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const profile = resolveV8AudioSynthesisProfile(
        this.currentRpm,
        this.currentSpeed,
        this.volumeLevel,
      );

      // These are harmonic textures for an educational sound effect, not measured engine acoustics.
      if (this.oscPrimary) this.oscPrimary.frequency.setTargetAtTime(profile.primaryFiringHz, now, 0.035);
      if (this.oscSub) this.oscSub.frequency.setTargetAtTime(profile.lowOrderHz, now, 0.035);
      if (this.oscHarmonic) this.oscHarmonic.frequency.setTargetAtTime(profile.secondFiringHarmonicHz, now, 0.035);
      if (this.oscScream) this.oscScream.frequency.setTargetAtTime(profile.upperFiringHarmonicHz, now, 0.035);
      if (this.oscMechanical) this.oscMechanical.frequency.setTargetAtTime(profile.mechanicalHz, now, 0.035);

      if (this.gainPrimary) this.gainPrimary.gain.setTargetAtTime(profile.primaryGain, now, 0.04);
      if (this.gainSub) this.gainSub.gain.setTargetAtTime(profile.lowOrderGain, now, 0.04);
      if (this.gainHarmonic) this.gainHarmonic.gain.setTargetAtTime(profile.secondHarmonicGain, now, 0.04);
      if (this.gainScream) this.gainScream.gain.setTargetAtTime(profile.upperHarmonicGain, now, 0.04);
      if (this.gainMechanical) this.gainMechanical.gain.setTargetAtTime(profile.mechanicalGain, now, 0.04);

      // Actual endpoints for this illustrative tuning: 240–3,240 Hz exhaust and 320–1,570 Hz intake.
      if (this.exhaustFilter) {
        this.exhaustFilter.frequency.setTargetAtTime(profile.exhaustFilterHz, now, 0.04);
      }
      if (this.intakeResonator) {
        this.intakeResonator.frequency.setTargetAtTime(profile.intakeResonatorHz, now, 0.04);
        this.intakeResonator.gain.setTargetAtTime(profile.intakeResonatorGainDb, now, 0.04);
      }
      if (this.filterMechanical) {
        this.filterMechanical.frequency.setTargetAtTime(profile.mechanicalFilterHz, now, 0.04);
      }

      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(profile.masterGain, now, 0.04);
    } catch (e) {
      console.warn('[V8Audio] Error applying synthesis parameters:', e);
    }
  }
  public stop() {
    this.isPlaying = false;
    this.rampDownMaster();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.update({
      rpm: this.currentRpm,
      isPlaying: this.isPlaying,
      speed: this.currentSpeed,
      soundEnabled: !muted,
      masterVolume: this.volumeLevel
    });
  }

  public setVolume(vol: number) {
    this.volumeLevel = normalizeV8AudioVolume(vol, this.volumeLevel);
    this.update({
      rpm: this.currentRpm,
      isPlaying: this.isPlaying,
      speed: this.currentSpeed,
      soundEnabled: !this.isMuted,
      masterVolume: this.volumeLevel
    });
  }

  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying && !this.isMuted && this.currentRpm > 0 && this.ctx?.state === 'running',
      rpm: this.currentRpm,
      speed: this.currentSpeed,
      volume: this.volumeLevel,
      audioContextState: this.ctx?.state || 'uninitialized'
    };
  }
}

// Global Singleton Instance
export const V8EngineAudioEngine = new V8EngineAudioEngineClass();

/**
 * Declarative React Hook to synchronize V8 engine audio with visual animation state.
 * Automatically ramps down audio on unmount or when engine is paused/muted.
 */
export function useV8EngineAudio(params: V8AudioParams & { active?: boolean }) {
  const { active = true, rpm, isPlaying, speed = 1.0, soundEnabled, masterVolume } = params;

  useEffect(() => {
    if (!active) {
      V8EngineAudioEngine.stop();
      return;
    }

    V8EngineAudioEngine.update({
      rpm,
      isPlaying,
      speed,
      soundEnabled,
      masterVolume
    });
  }, [active, rpm, isPlaying, speed, soundEnabled, masterVolume]);

  useEffect(() => {
    return () => {
      // Clean ramp-down only on complete unmount
      V8EngineAudioEngine.stop();
    };
  }, []);
}

