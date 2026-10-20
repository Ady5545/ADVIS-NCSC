/**
 * @deprecated
 * DECOMMISSIONED: ScientificSimulationViewer introduced a duplicate Three.js <Canvas>
 * and rogue <OrbitControls>, conflicting with ADVIS's single authoritative Canvas,
 * camera controls, and gesture pipeline.
 *
 * All scientific models are rendered directly through `ScientificSystemScene.tsx`
 * in the primary ADVIS workspace (Canvas inside App.tsx).
 */
import React from 'react';

export interface ScientificSimulationViewerProps {
  initialModelId?: string;
  onSendMessageToAI?: (message: string) => void;
  lastAICommand?: string | null;
}

export function ScientificSimulationViewer(_props: ScientificSimulationViewerProps) {
  // Decommissioned: primary ADVIS workspace owns Canvas, camera, and gestures
  return null;
}
