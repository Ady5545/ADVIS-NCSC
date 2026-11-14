export type CompoundInputKind = "name" | "formula" | "cid" | "smiles" | "inchi" | "inchikey";
export type CoordinateKind = "source_3d" | "generated_3d" | "local_library_3d" | "source_2d";
export type CoordinateOrigin = "source_supplied" | "generated" | "local_library" | "unknown";
export type StructureEvidence = "source_record" | "generated" | "local_library" | "not_verified";

export interface NormalizedCompoundInput {
  original: string;
  kind: CompoundInputKind;
  identifier: string;
  lookupKey?: string;
}

export interface StructureAtom {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
  charge?: number;
  isotope?: number;
  stereo?: string;
  sourceIndex?: number;
  metadata?: Record<string, unknown>;
}

export interface StructureBond {
  id: string;
  atomA: string;
  atomB: string;
  order: number;
  type: "covalent" | "ionic" | "hydrogen" | "aromatic";
  stereo?: string;
  sourceIndex?: number;
  metadata?: Record<string, unknown>;
  length?: number;
}

export interface MolecularGraph {
  atoms: StructureAtom[];
  bonds: StructureBond[];
  functionalGroups?: Array<{ id: string; type: string; atomIds: string[]; metadata?: Record<string, unknown> }>;
  metadata?: Record<string, unknown>;
}

export interface ChemistryStructureResult {
  schemaVersion: "1.1.0";
  status: "VALID" | "VALID_WITH_WARNINGS" | "INVALID";
  identity: {
    query: string;
    name: string;
    formula: string;
    cid?: number;
    canonicalSmiles?: string;
    isomericSmiles?: string;
    inchi?: string;
    inchiKey?: string;
    formalCharge?: number;
  };
  graph: MolecularGraph;
  coordinates: {
    dimension: 2 | 3;
    kind: CoordinateKind | "unknown";
    origin: CoordinateOrigin;
    units: "angstrom" | "";
    method?: string;
  };
  provenance: {
    provider: string;
    providerLabel: string;
    evidence: StructureEvidence;
    sourceId: string | null;
    sourceUrl?: string;
    retrievedAt: string;
    sourceAtomCount?: number;
    sourceBondCount?: number;
  };
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    atomCount: number;
    bondCount: number;
    connectedComponents: number;
    componentAtomCounts: number[];
    componentFormulas: string[];
    formulaFromGraph: string;
    formulaConsistent: boolean;
    formalChargeFromGraph: number;
    chargeConsistent: boolean;
  };
  geometry?: string;
}

export function normalizeElementSymbol(value: unknown): string | null;
export function normalizeCompoundName(value: string): string;
export function isMolecularFormula(value: string): boolean;
export function normalizeCompoundInput(value: string): NormalizedCompoundInput;
export function calculateMolecularFormula(atoms: Array<Partial<StructureAtom>>): string;
export function countConnectedComponents(atoms: StructureAtom[], bonds: StructureBond[]): number;
export function validateMolecularGraph(graph: MolecularGraph, identity?: Record<string, unknown>, provenance?: Record<string, unknown>): ChemistryStructureResult["validation"];
export function buildStructureResult(input: {
  identity: Partial<ChemistryStructureResult["identity"]>;
  graph: MolecularGraph;
  coordinates?: Partial<ChemistryStructureResult["coordinates"]>;
  provenance?: Partial<ChemistryStructureResult["provenance"]>;
  geometry?: string;
}): ChemistryStructureResult;
export function validateStructureResult(result: unknown, options?: { allowInvalidStatus?: boolean }): string[];
export function assertValidStructureResult(result: ChemistryStructureResult): ChemistryStructureResult;
export const CHEMISTRY_CONTRACT_LIMITS: Readonly<{ maxQueryLength: number; maxAtoms: number; maxBonds: number }>;
