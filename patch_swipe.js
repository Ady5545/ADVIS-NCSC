const fs = require('fs');
let content = fs.readFileSync('src/useHandTracking.ts', 'utf8');

const refInjection = `
  // Swipe State Machine
  const swipeRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startTime: number;
    lastSwipeTime: number;
  }>({ active: false, startX: 0, startY: 0, startTime: 0, lastSwipeTime: 0 });
`;

content = content.replace(
  "  // Pinch State Machine",
  refInjection + "\n  // Pinch State Machine"
);

const swipeLogic = `
          // Swipe Detection
          const swipe = swipeRef.current;
          if (activeGesture === 'OPEN PALM' || activeGesture === 'INDEX POINTER') {
            if (!swipe.active && cursorPosition) {
              swipe.active = true;
              swipe.startX = cursorPosition.x;
              swipe.startY = cursorPosition.y;
              swipe.startTime = now;
            } else if (swipe.active && cursorPosition) {
              const dx = cursorPosition.x - swipe.startX;
              const dy = cursorPosition.y - swipe.startY;
              const dt = now - swipe.startTime;
              
              if (dt < 400 && dt > 50) {
                const velocityX = dx / dt;
                const velocityY = dy / dt;
                
                if (now - swipe.lastSwipeTime > 1000) { // Cooldown
                  if (Math.abs(dx) > 0.15 && Math.abs(velocityX) > 0.0005 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                    window.dispatchEvent(new CustomEvent('advis-swipe', { detail: { direction: dx > 0 ? 'RIGHT' : 'LEFT' } }));
                    swipe.lastSwipeTime = now;
                    swipe.active = false;
                  } else if (Math.abs(dy) > 0.15 && Math.abs(velocityY) > 0.0005 && Math.abs(dy) > Math.abs(dx) * 1.5) {
                    window.dispatchEvent(new CustomEvent('advis-swipe', { detail: { direction: dy > 0 ? 'DOWN' : 'UP' } }));
                    swipe.lastSwipeTime = now;
                    swipe.active = false;
                  }
                }
              } else if (dt >= 400) {
                // Reset swipe if took too long
                swipe.active = false;
              }
            }
          } else {
            swipe.active = false;
          }
`;

content = content.replace(
  "          // Process JARVIS-style Pinch State Machine",
  swipeLogic + "\n          // Process JARVIS-style Pinch State Machine"
);

fs.writeFileSync('src/useHandTracking.ts', content, 'utf8');
console.log("Patched swipe");
