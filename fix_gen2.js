const fs = require('fs');

let code = fs.readFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', 'utf8');
code = code.replace(
  "public static async generateGeometry(\n    objectType: string,\n    parameters: Record<string, any>\n  ): GeneratedAssemblyPayload {",
  "public static async generateGeometry(\n    objectType: string,\n    parameters: Record<string, any>\n  ): Promise<GeneratedAssemblyPayload> {"
);
fs.writeFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', code);
