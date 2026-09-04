const fs = require('fs');
let code = fs.readFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', 'utf8');

// The fallback needs to be inserted back into `generateGeometry`.
// The end of `generateGeometry` is around line 140, just before `// 1. PARAMETRIC INVOLUTE GEAR`.
code = code.replace(
  "    // Common manufactured / physical object query composition fallback\n  }",
  "    // Common manufactured / physical object query composition fallback\n    return UniversalSemanticAssembler.assemble(objectType, parameters);\n  }"
);

// I also need to make sure the import is there.
if (!code.includes("import { UniversalSemanticAssembler }")) {
  code = code.replace(
    "import { UniversalDecomposition } from './UniversalDecomposition';",
    "import { UniversalDecomposition } from './UniversalDecomposition';\nimport { UniversalSemanticAssembler } from './UniversalSemanticAssembler';"
  );
}

fs.writeFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', code);
