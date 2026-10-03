// src/AutonomousModelEngine/precision/bootstrap.ts
// Registers hand-authored procedural geometry BUILDERS for canonical SPATIAL_LIBRARY models
// into ModelRegistry — independent of the AI-construction pipeline, so each model renders
// correctly whether it's opened via chat, the sidebar, or the comparator. Registration itself
// is free; the (comparatively expensive) geometry build runs lazily, once, the first time that
// model is actually requested — so this costs nothing at app startup. Side-effect only.

import { ModelRegistry } from '../ModelRegistry';
import { buildHeartGeometries } from './HeartModel';
import { buildBrainGeometries } from './BrainModel';
import { buildLungsGeometries } from './LungsModel';
import { buildEyeGeometries } from './EyeModel';

let registered = false;

export function registerPrecisionModels(): void {
  if (registered) return;
  registered = true;
  ModelRegistry.registerLazyGeometries('human_heart', buildHeartGeometries);
  ModelRegistry.registerLazyGeometries('human_brain', buildBrainGeometries);
  ModelRegistry.registerLazyGeometries('human_lungs', buildLungsGeometries);
  ModelRegistry.registerLazyGeometries('human_eye', buildEyeGeometries);
}

registerPrecisionModels();
