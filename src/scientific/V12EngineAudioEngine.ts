// V12EngineAudioEngine.ts
// Real-time Procedural Web Audio API Engine Sound Synthesizer for 60° V12 Powertrain
// Accurately models combustion orders (6E, 3E, 12E, 18E), intake Helmholtz resonance,
// exhaust pulse waveshaping, and valvetrain mechanical whine.

import { useEffect } from 'react';

export interface V12AudioParams {
  rpm: number;
  isPlaying: boolean;
  speed?: number;
  soundEnabled: boolean;
  masterVolume?: number;
}

class V12EngineAudioEngineClass {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private isRunning = false;

  // Master Gain & Dynamics
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Primary Firing Pulse Oscillators (6E Fundamental & Harmonics)
  // In a 4-stroke V12: 6 firing pulses per crank revolution (6E order)
  private oscPrimary: OscillatorNode | null = null;      // 6E fundamental
  private oscSub: OscillatorNode | null = null;          // 3E sub-harmonic (bank collector resonance)
  private oscHarmonic: OscillatorNode | null = null;     // 12E second harmonic
  private oscScream: OscillatorNode | null = null;       // 18E high-RPM operatic howl

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
        console.warn('[V12Audio] Web Audio API is not supported in this browser.');
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

      // 6. Oscillators for V12 Engine Orders
      // A. Primary 6E Firing Order Oscillator (Sawtooth for sharp exhaust valve cracks)
      this.oscPrimary = ctx.createOscillator();
      this.oscPrimary.type = 'sawtooth';
      this.oscPrimary.frequency.setValueAtTime(60, ctx.currentTime);
      this.oscPrimary.connect(this.gainPrimary);

      // B. Sub-harmonic 3E Bank Interleave Oscillator (Triangle for visceral low-end rumble)
      this.oscSub = ctx.createOscillator();
      this.oscSub.type = 'triangle';
      this.oscSub.frequency.setValueAtTime(30, ctx.currentTime);
      this.oscSub.connect(this.gainSub);

      // C. 12E Second Order Firing Harmonic (Sawtooth for high RPM rasp)
      this.oscHarmonic = ctx.createOscillator();
      this.oscHarmonic.type = 'sawtooth';
      this.oscHarmonic.frequency.setValueAtTime(120, ctx.currentTime);
      this.oscHarmonic.connect(this.gainHarmonic);

      // D. 18E Third Order Firing Harmonic (Sine/Saw for the Ferrari/Lambo V12 scream)
      this.oscScream = ctx.createOscillator();
      this.oscScream.type = 'sine';
      this.oscScream.frequency.setValueAtTime(180, ctx.currentTime);
      this.oscScream.connect(this.gainScream);

      // E. High-frequency Mechanical Valvetrain Whine Oscillator
      this.oscMechanical = ctx.createOscillator();
      this.oscMechanical.type = 'sine';
      this.oscMechanical.frequency.setValueAtTime(720, ctx.currentTime);
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
      console.warn('[V12Audio] Web Audio engine initialization deferred or unavailable:', err);
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
  public update(params: V12AudioParams) {
    const { rpm, isPlaying, speed = 1.0, soundEnabled, masterVolume } = params;
    this.currentRpm = Math.max(0, rpm);
    this.currentSpeed = Math.max(0.1, speed);
    this.isPlaying = isPlaying;
    this.isMuted = !soundEnabled;
    if (typeof masterVolume === 'number') {
      this.volumeLevel = Math.max(0, Math.min(1.0, masterVolume));
    }

    // If sound is disabled or engine is fully stopped, ramp down gain
    const shouldSound = soundEnabled && isPlaying && this.currentRpm > 0;

    if (!shouldSound) {
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
      const rpm = this.currentRpm;
      const speed = this.currentSpeed;

      // In a 4-stroke V12:
      // Crankshaft rotational frequency f0 = (RPM / 60) * speed (Hz)
      // At 600 RPM idle: f0 = 10 Hz
      // At 3000 RPM: f0 = 50 Hz
      // At 8500 RPM: f0 = 141.67 Hz
      const f0 = Math.max(1, (rpm / 60) * speed);

      // Primary 6E Firing Order frequency (12 cylinders / 2 revolutions = 6 pulses per rev):
      // At 600 RPM: 60 Hz (deep visceral rumble)
      // At 3000 RPM: 300 Hz (throaty Italian V12 baritone)
      // At 8500 RPM: 850 Hz (high-pitched operatic redline shriek)
      const fPrimary = f0 * 6;
      const fSub = f0 * 3;          // 3E exhaust collector pulse
      const fHarmonic = f0 * 12;     // 12E second firing harmonic
      const fScream = f0 * 18;       // 18E third harmonic overtone
      const fMechanical = f0 * 24;   // High-speed camshaft/timing chain friction whine

      // Smoothly update oscillator frequencies using setTargetAtTime
      if (this.oscPrimary) this.oscPrimary.frequency.setTargetAtTime(fPrimary, now, 0.035);
      if (this.oscSub) this.oscSub.frequency.setTargetAtTime(fSub, now, 0.035);
      if (this.oscHarmonic) this.oscHarmonic.frequency.setTargetAtTime(fHarmonic, now, 0.035);
      if (this.oscScream) this.oscScream.frequency.setTargetAtTime(fScream, now, 0.035);
      if (this.oscMechanical) this.oscMechanical.frequency.setTargetAtTime(fMechanical, now, 0.035);

      // Calculate RPM ratio: 0.0 at idle (600), 1.0 at redline (9000)
      const rpmNormalized = Math.max(0, Math.min(1.0, (rpm - 600) / (9000 - 600)));

      // Dynamic Harmonic Balancing:
      // At idle: Sub and Primary dominate; High overtones are nearly silent
      // At high revs: High overtones and intake roar swell dramatically
      const primaryGainVal = 0.45 - 0.12 * rpmNormalized;
      const subGainVal = 0.38 - 0.18 * rpmNormalized;
      const harmonicGainVal = 0.08 + 0.32 * Math.pow(rpmNormalized, 1.4);
      const screamGainVal = 0.02 + 0.42 * Math.pow(rpmNormalized, 2.0);
      const mechanicalGainVal = 0.03 + 0.12 * rpmNormalized;

      if (this.gainPrimary) this.gainPrimary.gain.setTargetAtTime(primaryGainVal, now, 0.04);
      if (this.gainSub) this.gainSub.gain.setTargetAtTime(subGainVal, now, 0.04);
      if (this.gainHarmonic) this.gainHarmonic.gain.setTargetAtTime(harmonicGainVal, now, 0.04);
      if (this.gainScream) this.gainScream.gain.setTargetAtTime(screamGainVal, now, 0.04);
      if (this.gainMechanical) this.gainMechanical.gain.setTargetAtTime(mechanicalGainVal, now, 0.04);

      // Exhaust Resonator Cutoff Filter sweeps with RPM:
      // At idle: 280 Hz (muffled, bass-heavy chamber)
      // At redline: 3,800 Hz (unrestricted open-header brass scream)
      const exhaustCutoff = 260 + Math.pow(rpmNormalized, 1.3) * 3600;
      if (this.exhaustFilter) {
        this.exhaustFilter.frequency.setTargetAtTime(exhaustCutoff, now, 0.04);
      }

      // Intake Helmholtz Resonator sweeps with intake airflow:
      // Centers between 350 Hz and 1,800 Hz
      const intakeFreq = 350 + rpmNormalized * 1450;
      const intakeGain = 4.0 + rpmNormalized * 6.0;
      if (this.intakeResonator) {
        this.intakeResonator.frequency.setTargetAtTime(intakeFreq, now, 0.04);
        this.intakeResonator.gain.setTargetAtTime(intakeGain, now, 0.04);
      }

      // Mechanical Whine Filter tracks timing chain meshing
      if (this.filterMechanical) {
        this.filterMechanical.frequency.setTargetAtTime(Math.min(4500, fMechanical), now, 0.04);
      }

      // Master Volume Curve:
      // Naturally quieter at idle, increasing in intensity and acoustic pressure as RPM climbs
      const baseVol = 0.16 + 0.22 * Math.pow(rpmNormalized, 1.2);
      const finalMasterGain = baseVol * this.volumeLevel;

      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(finalMasterGain, now, 0.04);
    } catch (e) {
      console.warn('[V12Audio] Error applying synthesis parameters:', e);
    }
  }

  public stop() {
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
    this.volumeLevel = Math.max(0, Math.min(1.0, vol));
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
      isPlaying: this.isPlaying && !this.isMuted && this.currentRpm > 0,
      rpm: this.currentRpm,
      speed: this.currentSpeed,
      volume: this.volumeLevel,
      audioContextState: this.ctx?.state || 'uninitialized'
    };
  }
}

// Global Singleton Instance
export const V12EngineAudioEngine = new V12EngineAudioEngineClass();

/**
 * Declarative React Hook to synchronize V12 engine audio with visual animation state.
 * Automatically ramps down audio on unmount or when engine is paused/muted.
 */
export function useV12EngineAudio(params: V12AudioParams & { active?: boolean }) {
  const { active = true, rpm, isPlaying, speed = 1.0, soundEnabled, masterVolume } = params;

  useEffect(() => {
    if (!active) {
      V12EngineAudioEngine.stop();
      return;
    }

    V12EngineAudioEngine.update({
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
      V12EngineAudioEngine.stop();
    };
  }, []);
}

