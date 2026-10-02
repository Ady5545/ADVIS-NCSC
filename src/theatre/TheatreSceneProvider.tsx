import React from 'react';

export function TheatreSceneProvider({ children }: { children: React.ReactNode }) {
  // Theatre's runtime project/sequence controllers operate independently from the
  // optional R3F provider. Keeping this wrapper as a pass-through also lets the
  // production build avoid the obsolete @theatre/r3f peer dependency on Fiber 8.
  return <>{children}</>;
}
