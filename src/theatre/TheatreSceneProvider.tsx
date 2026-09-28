import React from 'react';
import { SheetProvider } from '@theatre/r3f';
import { advisOrbSheet } from './TheatreRuntime';

export function TheatreSceneProvider({ children }: { children: React.ReactNode }) {
  return <SheetProvider sheet={advisOrbSheet}>{children}</SheetProvider>;
}
