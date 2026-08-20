const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Add imports
const imports = `import { LearningSession } from './LearnEngine/LearnTypes';
import { createBF3Session } from './LearnEngine/Lessons/BF3Lesson';
import { LearnWorkspace } from './LearnEngine/LearnWorkspace';
import { ChemistryVisuals } from './LearnEngine/ChemistryVisuals';
`;

app = app.replace(/import \{ HolographicCursor \} from '\.\/HolographicCursor';/, imports + "\nimport { HolographicCursor } from './HolographicCursor';");

// Add activeLearningSession state
const stateHook = `  const [activeLearningSession, setActiveLearningSession] = useState<LearningSession | null>(null);
`;
app = app.replace(/const \[activeProjectId, setActiveProjectId\] = useState<string \| null>\(null\);/, `const [activeProjectId, setActiveProjectId] = useState<string | null>(null);\n` + stateHook);

// Add learnAction handling in handleSendMessage
const handleSendMessageReplacement = `
      if (data.learnAction) {
        if (data.learnAction.subject === 'BF3') {
           setActiveLearningSession(createBF3Session(data.learnAction.learnMode));
        }
      }
      
      if (data.spatialAction) {`;

app = app.replace(/if \(data\.spatialAction\) \{/, handleSendMessageReplacement);

// Render LearnWorkspace
const renderLearnWorkspace = `
      {/* Learn Engine Layer */}
      {activeLearningSession && (
        <LearnWorkspace 
           session={activeLearningSession} 
           onClose={() => setActiveLearningSession(null)} 
           onUpdateSession={setActiveLearningSession} 
        />
      )}
      
      {/* 3D Canvas Layer */}`;

app = app.replace(/\{\/\* 3D Canvas Layer \*\/\}/, renderLearnWorkspace);

// Render ChemistryVisuals inside Canvas
const renderChemistryVisuals = `
          {activeLearningSession && (
             <ChemistryVisuals visualStateId={activeLearningSession.steps[activeLearningSession.currentStepIndex].visualStateId} />
          )}
          
          <SpatialObjectEngine`;
app = app.replace(/<SpatialObjectEngine/, renderChemistryVisuals);

fs.writeFileSync('src/App.tsx', app, 'utf8');
console.log("Patched App.tsx with Learn Engine.");
