const fs = require('fs');
let content = fs.readFileSync('src/useHandTracking.ts', 'utf8');

// 1. Ensure new states in InteractionState
content = content.replace(
  "export type InteractionState = \n  | 'IDLE'\n  | 'TRACKING'\n  | 'HOVERING'\n  | 'PINCH READY'\n  | 'PINCH_DRAG'\n  | 'TWO_HAND_INTERACTION'\n  | 'PAUSED'\n  | 'SCROLL'\n  | 'IDLE';",
  "export type InteractionState = \n  | 'IDLE'\n  | 'TRACKING'\n  | 'HOVERING'\n  | 'PINCH_START'\n  | 'PINCH_HOLD'\n  | 'PINCH_DRAG'\n  | 'PINCH_RELEASE'\n  | 'TWO_HAND_INTERACTION'\n  | 'PAUSED'\n  | 'SCROLL';"
);

// We need to inject state machine refs
const refInjection = `
  // Pinch State Machine
  const pinchStateMachineRef = useRef<{
    state: 'IDLE' | 'PINCH_START' | 'PINCH_HOLD' | 'PINCH_DRAG' | 'PINCH_RELEASE';
    startTime: number;
    startPos: {x: number, y: number} | null;
  }>({ state: 'IDLE', startTime: 0, startPos: null });
`;

content = content.replace(
  "  const hoverStartTimeRef = useRef<number>(0);",
  "  const hoverStartTimeRef = useRef<number>(0);\n" + refInjection
);

// Re-write the interaction state assignment logic
const stateLogicOld = `        // User requested clear states: NO HAND, HAND DETECTED, POINTING, PINCH READY, GRABBING OBJECT, TWO HAND CONTROL, PAUSED
        // I will map these carefully to the existing states for internal logic, but also add a display state.
        
        if (numHands === 0) {
          interactionState = 'IDLE' as any;
        } else if (numHands === 2) {
          interactionState = 'TWO_HAND_INTERACTION' as any;
        } else if (numHands === 1) {
          if (activeGesture === 'PINCH') {
            interactionState = 'PINCH_DRAG' as any;
          } else if (activeGesture === 'INDEX POINTER') {
            interactionState = 'HOVERING' as any;
          } else {
            interactionState = 'TRACKING' as any;
          }
        }`;

const stateLogicNew = `        
        if (numHands === 0) {
          interactionState = 'IDLE';
          pinchStateMachineRef.current.state = 'IDLE';
        } else if (numHands === 2) {
          interactionState = 'TWO_HAND_INTERACTION';
          pinchStateMachineRef.current.state = 'IDLE';
        } else if (numHands === 1) {
          // Process JARVIS-style Pinch State Machine
          const isPinchDetected = activeGesture === 'PINCH';
          const psm = pinchStateMachineRef.current;
          
          if (isPinchDetected) {
            if (psm.state === 'IDLE' || psm.state === 'PINCH_RELEASE') {
              psm.state = 'PINCH_START';
              psm.startTime = now;
              psm.startPos = cursorPosition ? { x: cursorPosition.x, y: cursorPosition.y } : null;
            } else if (psm.state === 'PINCH_START') {
              if (now - psm.startTime > 100) {
                psm.state = 'PINCH_HOLD';
              }
              // Check movement to transition early to drag
              if (psm.startPos && cursorPosition) {
                const dist = Math.sqrt(Math.pow(cursorPosition.x - psm.startPos.x, 2) + Math.pow(cursorPosition.y - psm.startPos.y, 2));
                if (dist > 0.01) psm.state = 'PINCH_DRAG';
              }
            } else if (psm.state === 'PINCH_HOLD') {
              if (psm.startPos && cursorPosition) {
                const dist = Math.sqrt(Math.pow(cursorPosition.x - psm.startPos.x, 2) + Math.pow(cursorPosition.y - psm.startPos.y, 2));
                if (dist > 0.015) psm.state = 'PINCH_DRAG';
              }
            }
          } else {
            if (psm.state === 'PINCH_START' || psm.state === 'PINCH_HOLD' || psm.state === 'PINCH_DRAG') {
              psm.state = 'PINCH_RELEASE';
              psm.startTime = now;
            } else if (psm.state === 'PINCH_RELEASE') {
              if (now - psm.startTime > 150) {
                psm.state = 'IDLE';
              }
            }
          }

          if (psm.state !== 'IDLE') {
            interactionState = psm.state;
          } else if (activeGesture === 'INDEX POINTER') {
            interactionState = 'HOVERING';
          } else if (activeGesture === 'OPEN PALM') {
            interactionState = 'TRACKING';
          } else {
            interactionState = 'TRACKING';
          }
        }`;

content = content.replace(stateLogicOld, stateLogicNew);

// Adjust hover logic: `if (interactionState === 'PINCH_DRAG'` -> `if (interactionState.startsWith('PINCH_'))`
content = content.replace(
  "} else if (interactionState === 'PINCH_DRAG' && lastHoveredElementRef.current) {",
  "} else if (interactionState.startsWith('PINCH_') && interactionState !== 'PINCH_RELEASE' && lastHoveredElementRef.current) {"
);

fs.writeFileSync('src/useHandTracking.ts', content, 'utf8');
console.log("Patched pinch state machine");
