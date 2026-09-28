# ADVIS-NCSC Theatre.js layer

Theatre.js is the presentation and choreography layer. It does not own scientific truth or user interaction.

## Ownership

- MolecularEngine owns molecule structure, VSEPR placement, bond lengths/orders, and measurements.
- EngineKinematicsBus owns V12 kinematics, pressure, piston/valve motion, torque and telemetry.
- MediaPipe / GestureContext owns gesture recognition and interaction intent.
- React state owns application/workspace state.
- Framer Motion owns HTML/UI motion.
- Theatre.js owns authored 3D presentation timing, cinematic camera motion, visual emphasis, and presentation-only parameters.

## Projects / sheets

- ADVIS Orb: ambient authored choreography for the central orb.
- V12 Presentation: cinematic camera and presentation parameters for the V12 demo.
- Molecule Presentation: cinematic camera and presentation parameters for molecular lessons.

The production state is seeded in theatreState.ts. During development, Theatre Studio can be opened and the sequences can be refined. The editor itself is loaded only in development.

## Performance rule

Do not stream Theatre values into React state on every frame. Render-time systems use mutable refs or direct Three.js objects. Theatre remains outside scientific calculations and high-frequency interaction state.
