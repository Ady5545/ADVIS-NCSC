const fs = require('fs');
let content = fs.readFileSync('src/HolographicCursor.tsx', 'utf8');

const injection = `
      {/* 7. TWO-HAND INTERACTION FEEDBACK */}
      {handTracking.interactionState === 'TWO_HAND_INTERACTION' && handTracking.leftHandPosition && handTracking.rightHandPosition && (
        <svg className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
          {handTracking.gesture === 'TWO HAND SCALE' && (
            <line 
              x1={(1 - handTracking.leftHandPosition.x) * window.innerWidth} 
              y1={handTracking.leftHandPosition.y * window.innerHeight} 
              x2={(1 - handTracking.rightHandPosition.x) * window.innerWidth} 
              y2={handTracking.rightHandPosition.y * window.innerHeight} 
              stroke="rgba(6, 182, 212, 0.4)" 
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}
          {handTracking.gesture === 'TWO HAND ROTATE' && (
            <circle 
              cx={((1 - handTracking.leftHandPosition.x) * window.innerWidth + (1 - handTracking.rightHandPosition.x) * window.innerWidth) / 2} 
              cy={(handTracking.leftHandPosition.y * window.innerHeight + handTracking.rightHandPosition.y * window.innerHeight) / 2} 
              r={Math.sqrt(Math.pow((1 - handTracking.leftHandPosition.x) * window.innerWidth - (1 - handTracking.rightHandPosition.x) * window.innerWidth, 2) + Math.pow(handTracking.leftHandPosition.y * window.innerHeight - handTracking.rightHandPosition.y * window.innerHeight, 2)) / 2}
              fill="transparent" 
              stroke="rgba(6, 182, 212, 0.2)" 
              strokeWidth="1"
              strokeDasharray="10 10"
            />
          )}
        </svg>
      )}
`;

content = content.replace("        </>\n      )}\n    </div>", injection + "        </>\n      )}\n    </div>");

fs.writeFileSync('src/HolographicCursor.tsx', content, 'utf8');
console.log("Patched two hand visuals");
