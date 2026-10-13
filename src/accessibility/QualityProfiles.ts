export type QualityPreset = 'LOW' | 'BALANCED' | 'HIGH' | 'ULTRA';

export interface QualityProfile {
  pixelRatio: number;
  shadows: boolean;
  postProcessing: boolean;
  bloom: boolean;
  textureAnisotropy: number;
  optionalParticles: boolean;
  detailLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';
  telemetryHz: number;
  note: string;
}

export const QUALITY_PROFILES: Record<QualityPreset, QualityProfile> = {
  LOW: {
    pixelRatio: 0.75, shadows: false, postProcessing: false, bloom: false,
    textureAnisotropy: 1, optionalParticles: false, detailLevel: 'LOW', telemetryHz: 10,
    note: 'Prioritizes responsiveness on lower-power devices; essential model geometry remains visible.',
  },
  BALANCED: {
    pixelRatio: 1, shadows: false, postProcessing: false, bloom: false,
    textureAnisotropy: 2, optionalParticles: false, detailLevel: 'MEDIUM', telemetryHz: 20,
    note: 'Balanced clarity and performance for everyday learning.',
  },
  HIGH: {
    pixelRatio: 1.5, shadows: true, postProcessing: true, bloom: true,
    textureAnisotropy: 4, optionalParticles: true, detailLevel: 'HIGH', telemetryHz: 30,
    note: 'Adds visual effects when the device can sustain them.',
  },
  ULTRA: {
    pixelRatio: 2, shadows: true, postProcessing: true, bloom: true,
    textureAnisotropy: 8, optionalParticles: true, detailLevel: 'ULTRA', telemetryHz: 30,
    note: 'Highest requested presentation quality; actual support remains GPU/browser dependent.',
  },
};

export interface AccessibilityPreferences {
  quality: QualityPreset;
  reducedMotion: boolean;
  captionsEnabled: boolean;
  cameraFeaturesEnabled: boolean;
  audioEnabled: boolean;
}

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  quality: 'BALANCED',
  reducedMotion: false,
  captionsEnabled: true,
  cameraFeaturesEnabled: false,
  audioEnabled: false,
};

export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const PREFERENCE_KEY = 'advis-ncsc.accessibility-preferences.v1';

export function resolveQualityPreset(value: unknown): QualityPreset {
  return value === 'LOW' || value === 'BALANCED' || value === 'HIGH' || value === 'ULTRA' ? value : 'BALANCED';
}

export function loadAccessibilityPreferences(storage: PreferenceStorage | null, prefersReducedMotion = false): AccessibilityPreferences {
  const fallback = { ...DEFAULT_ACCESSIBILITY_PREFERENCES, reducedMotion: Boolean(prefersReducedMotion) };
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(PREFERENCE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<AccessibilityPreferences>;
    return {
      quality: resolveQualityPreset(parsed.quality),
      reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : fallback.reducedMotion,
      captionsEnabled: typeof parsed.captionsEnabled === 'boolean' ? parsed.captionsEnabled : true,
      cameraFeaturesEnabled: typeof parsed.cameraFeaturesEnabled === 'boolean' ? parsed.cameraFeaturesEnabled : false,
      audioEnabled: typeof parsed.audioEnabled === 'boolean' ? parsed.audioEnabled : false,
    };
  } catch {
    return fallback;
  }
}

export function saveAccessibilityPreferences(storage: PreferenceStorage | null, preferences: AccessibilityPreferences): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PREFERENCE_KEY, JSON.stringify({
      quality: resolveQualityPreset(preferences.quality),
      reducedMotion: Boolean(preferences.reducedMotion),
      captionsEnabled: Boolean(preferences.captionsEnabled),
      cameraFeaturesEnabled: Boolean(preferences.cameraFeaturesEnabled),
      audioEnabled: Boolean(preferences.audioEnabled),
    }));
    return true;
  } catch {
    return false;
  }
}

export function createOfflineStatus(networkAvailable: boolean, packsAvailable: number) {
  return {
    networkAvailable,
    packsAvailable: Math.max(0, Math.floor(Number.isFinite(packsAvailable) ? packsAvailable : 0)),
    message: networkAvailable ? 'Interactive models and optional online services may be available.' : 'Saved lesson text can be read offline; interactive models/assets may still require network access.',
  };
}
