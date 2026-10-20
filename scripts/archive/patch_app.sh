sed -i '/else if (action.type === '"'KINEMATICS'"') {/i \
        } else if (action.type === '"'COMPARE'"') {\n          setActiveModal('"compare"');\n        } else if (action.type === '"'DIAGNOSE'"') {\n          // In future, open diagnostic panel\n          console.log("DIAGNOSE action triggered");\n' src/App.tsx
