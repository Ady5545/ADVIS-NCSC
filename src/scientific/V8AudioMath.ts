export interface V8AudioSynthesisProfile {
  rpm: number;
  speed: number;
  volumeLevel: number;
  rpmNormalized: number;
  crankFrequencyHz: number;
  primaryFiringHz: number;
  lowOrderHz: number;
  secondFiringHarmonicHz: number;
  upperFiringHarmonicHz: number;
  mechanicalHz: number;
  primaryGain: number;
  lowOrderGain: number;
  secondHarmonicGain: number;
  upperHarmonicGain: number;
  mechanicalGain: number;
  exhaustFilterHz: number;
  intakeResonatorHz: number;
  intakeResonatorGainDb: number;
  mechanicalFilterHz: number;
  masterGain: number;
}

export interface V8AudioPlaybackRequest {
  rpm: number;
  isPlaying: boolean;
  soundEnabled: boolean;
}

const MIN_SPEED = 0.1;
const MAX_SPEED = 2;
const MIN_RPM_FOR_NORMALIZATION = 600;
const MAX_RPM_FOR_NORMALIZATION = 7000;
const DEFAULT_VOLUME = 0.28;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

/** Preserve the last safe volume when a non-finite update arrives. */
export function normalizeV8AudioVolume(value: number, fallback = DEFAULT_VOLUME): number {
  const safeFallback = Number.isFinite(fallback) ? clamp(fallback, 0, 1) : DEFAULT_VOLUME;
  return Number.isFinite(value) ? clamp(value, 0, 1) : safeFallback;
}

/**
 * Converts control inputs into finite Web Audio parameters.
 *
 * The frequency bands are educational harmonic textures, not a sample-accurate
 * combustion model or a recording of a particular engine.
 */
export function resolveV8AudioSynthesisProfile(
  rpmInput: number,
  speedInput = 1,
  volumeInput = DEFAULT_VOLUME,
): V8AudioSynthesisProfile {
  const rpm = Number.isFinite(rpmInput) ? clamp(rpmInput, 0, MAX_RPM_FOR_NORMALIZATION) : 0;
  const speed = Number.isFinite(speedInput) ? clamp(speedInput, MIN_SPEED, MAX_SPEED) : 1;
  const volumeLevel = normalizeV8AudioVolume(volumeInput);
  const rpmNormalized = clamp(
    (rpm - MIN_RPM_FOR_NORMALIZATION) / (MAX_RPM_FOR_NORMALIZATION - MIN_RPM_FOR_NORMALIZATION),
    0,
    1,
  );
  const crankFrequencyHz = Math.max(1, (rpm / 60) * speed);

  return {
    rpm,
    speed,
    volumeLevel,
    rpmNormalized,
    crankFrequencyHz,
    primaryFiringHz: crankFrequencyHz * 4,
    lowOrderHz: crankFrequencyHz * 2,
    secondFiringHarmonicHz: crankFrequencyHz * 8,
    upperFiringHarmonicHz: crankFrequencyHz * 12,
    mechanicalHz: crankFrequencyHz * 16,
    primaryGain: 0.50 - 0.14 * rpmNormalized,
    lowOrderGain: 0.42 - 0.20 * rpmNormalized,
    secondHarmonicGain: 0.06 + 0.30 * Math.pow(rpmNormalized, 1.35),
    upperHarmonicGain: 0.015 + 0.25 * Math.pow(rpmNormalized, 1.8),
    mechanicalGain: 0.04 + 0.10 * rpmNormalized,
    exhaustFilterHz: 240 + Math.pow(rpmNormalized, 1.25) * 3000,
    intakeResonatorHz: 320 + rpmNormalized * 1250,
    intakeResonatorGainDb: 4 + rpmNormalized * 6,
    mechanicalFilterHz: Math.min(4500, crankFrequencyHz * 16),
    masterGain: (0.16 + 0.22 * Math.pow(rpmNormalized, 1.2)) * volumeLevel,
  };
}

/** A muted, paused, zero-RPM, or invalid-RPM request must never start sound. */
export function shouldRunV8Audio(request: V8AudioPlaybackRequest): boolean {
  return request.soundEnabled &&
    request.isPlaying &&
    Number.isFinite(request.rpm) &&
    request.rpm > 0;
}
