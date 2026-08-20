const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/currentSpatialObject \? 'opacity-0 pointer-events-none -translate-y-full' : 'opacity-100 translate-y-0'/g, "(currentSpatialObject || activeLearningSession) ? 'opacity-0 pointer-events-none -translate-y-full' : 'opacity-100 translate-y-0'");
code = code.replace(/currentSpatialObject \? 'opacity-0 pointer-events-none -translate-x-full' : 'opacity-100 translate-x-0'/g, "(currentSpatialObject || activeLearningSession) ? 'opacity-0 pointer-events-none -translate-x-full' : 'opacity-100 translate-x-0'");
code = code.replace(/currentSpatialObject \? 'transform -translate-x-16 opacity-0 scale-90 pointer-events-none' : 'transform translate-x-0 opacity-100 scale-100 pointer-events-auto'/g, "(currentSpatialObject || activeLearningSession) ? 'transform -translate-x-16 opacity-0 scale-90 pointer-events-none' : 'transform translate-x-0 opacity-100 scale-100 pointer-events-auto'");
code = code.replace(/currentSpatialObject \? 'transform translate-y-16 opacity-0 scale-95 pointer-events-none' : 'transform translate-y-0 opacity-100 scale-100 pointer-events-auto'/g, "(currentSpatialObject || activeLearningSession) ? 'transform translate-y-16 opacity-0 scale-95 pointer-events-none' : 'transform translate-y-0 opacity-100 scale-100 pointer-events-auto'");
code = code.replace(/currentSpatialObject \? 'transform translate-x-16 opacity-0 scale-90 pointer-events-none' : 'transform translate-x-0 opacity-100 scale-100 pointer-events-auto'/g, "(currentSpatialObject || activeLearningSession) ? 'transform translate-x-16 opacity-0 scale-90 pointer-events-none' : 'transform translate-x-0 opacity-100 scale-100 pointer-events-auto'");
code = code.replace(/currentSpatialObject \? 'transform translate-y-full opacity-0 pointer-events-none' : 'transform translate-y-0 opacity-100 pointer-events-auto'/g, "(currentSpatialObject || activeLearningSession) ? 'transform translate-y-full opacity-0 pointer-events-none' : 'transform translate-y-0 opacity-100 pointer-events-auto'");

fs.writeFileSync('src/App.tsx', code, 'utf8');
