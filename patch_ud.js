const fs = require('fs');

const BICYCLE_START = "  public static generateBicycle(params: Record<string, any>): GeneratedAssemblyPayload {";
const SHOE_START = "  public static generateOxfordShoe(params: Record<string, any>): GeneratedAssemblyPayload {";
const TRANSFORMER_START = "  public static generateTransformer(params: Record<string, any>): GeneratedAssemblyPayload {";

const content = fs.readFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', 'utf8');

const bStart = content.indexOf(BICYCLE_START);
const sStart = content.indexOf(SHOE_START);
const tStart = content.indexOf(TRANSFORMER_START);

const newContent = content.substring(0, bStart) +
  "  public static generateBicycle(params: Record<string, any>): GeneratedAssemblyPayload {\n" +
  "    const { HighFidelityGenerators } = require('./HighFidelityGenerators');\n" +
  "    return HighFidelityGenerators.generateBicycle(params);\n" +
  "  }\n\n" +
  "  public static generateOxfordShoe(params: Record<string, any>): GeneratedAssemblyPayload {\n" +
  "    const { HighFidelityGenerators } = require('./HighFidelityGenerators');\n" +
  "    return HighFidelityGenerators.generateOxfordShoe(params);\n" +
  "  }\n\n" +
  content.substring(tStart);

fs.writeFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', newContent);
