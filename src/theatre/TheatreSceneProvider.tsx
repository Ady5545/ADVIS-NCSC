import React from 'react';

export function TheatreSceneProvider({ children }: { children: React.ReactNode }) {
  // Theatre's runtime project/sequence controllers operate independently from the
  // optional R3F provider. Keeping this wrapper as a pass-through avoids the obsolete
  // @theatre/r3f peer dependency while preserving the existing presentation API.
  return <>{children}</>;
}
