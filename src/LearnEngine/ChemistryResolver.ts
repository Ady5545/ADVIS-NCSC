import {
  assertValidStructureResult,
  buildStructureResult,
  normalizeCompoundInput,
  normalizeCompoundName,
  type ChemistryStructureResult,
  type CoordinateKind
} from '../../shared/chemistry-contract.mjs';
import { CHEMISTRY_DATABASE } from './ChemistryDatabase';
import { MOLECULE_REGISTRY } from './MolecularEngine';

export interface ChemistryResolutionCandidate {
  cid?: number;
  identifier?: string;
  provider: string;
  name: string;
  formula: string;
  formalCharge?: number;
  canonicalSmiles?: string;
  isomericSmiles?: string;
  inchiKey?: string;
}

export class ChemistryResolutionError extends Error {
  status?: number;
  candidates?: ChemistryResolutionCandidate[];
  compound?: { cid?: number; name?: string; formula?: string };
  inputKind?: string;

  constructor(message: string, options: {
    status?: number;
    candidates?: ChemistryResolutionCandidate[];
    compound?: ChemistryResolutionError['compound'];
    inputKind?: string;
  } = {}) {
    super(message);
    this.name = 'ChemistryResolutionError';
    this.status = options.status;
    this.candidates = options.candidates;
    this.compound = options.compound;
    this.inputKind = options.inputKind;
  }
}

export interface ChemistryStructureProvider {
  readonly id: string;
  readonly priority: number;
  readonly coordinateKinds: readonly CoordinateKind[];
  supports(input: ReturnType<typeof normalizeCompoundInput>): boolean;
  resolve(input: ReturnType<typeof normalizeCompoundInput>): Promise<ChemistryStructureResult | null>;
}

/**
 * Provider contract:
 * - every provider returns the same versioned ChemistryStructureResult;
 * - resolve() must not silently select an ambiguous identity;
 * - coordinates and evidence must accurately describe their origin;
 * - the orchestrator validates the result again before opening the session.
 */
const localRegistryProvider: ChemistryStructureProvider = {
  id: 'advis-local-registry',
  priority: 10,
  coordinateKinds: ['local_library_3d'],
  supports: input => input.kind === 'name',
  async resolve(input) {
    // Exact normalized names only. Formula-only and fuzzy matches never select
    // a hand-built local entry because formulas and near-matches are ambiguous.
    if (input.kind !== 'name') return null;
    const searchName = input.lookupKey || normalizeCompoundName(input.identifier);
    const matches = Object.values(CHEMISTRY_DATABASE).filter(item =>
      normalizeCompoundName(item.name) === searchName ||
      normalizeCompoundName(item.iupacName || '') === searchName
    );
    const uniqueMatches = [...new Set(matches)];
    if (uniqueMatches.length > 1) {
      throw new ChemistryResolutionError(
        'This name matches multiple entries in the ADVIS local chemistry library. Choose a specific compound; ADVIS will not guess.',
        {
          status: 409,
          inputKind: input.kind,
          candidates: uniqueMatches.map(item => ({
            provider: 'advis-local-registry',
            identifier: item.formula,
            name: item.name,
            formula: item.formula
          }))
        }
      );
    }

    const entity = uniqueMatches[0];
    if (!entity) return null;
    const generator = MOLECULE_REGISTRY[entity.formula.toUpperCase()] || MOLECULE_REGISTRY[entity.formula];
    if (!generator) return null;

    const molecule = generator();
    const declaredChargedSpecies = /(?:\\^?\\d*[+-])$/.test(entity.formula);
    const localNetCharge = molecule.atoms.reduce((total, atom) => total + (Number.isInteger(atom.charge) ? atom.charge : 0), 0);
    if (declaredChargedSpecies && localNetCharge === 0) {
      throw new Error('This local library entry declares a charged species but has no atom-level formal-charge annotations. A source structure is required; ADVIS will not infer the charge placement.');
    }
    const result = buildStructureResult({
      identity: {
        query: input.original,
        name: entity.name,
        formula: entity.formula,
        ...(declaredChargedSpecies ? { formalCharge: localNetCharge } : {})
      },
      graph: {
        atoms: molecule.atoms.map(atom => ({
          id: atom.id,
          element: atom.element,
          x: atom.position.x,
          y: atom.position.y,
          z: atom.position.z,
          charge: atom.charge ?? 0,
          ...(atom.isotope !== undefined ? { isotope: atom.isotope } : {}),
          ...(atom.stereo ? { stereo: atom.stereo } : {}),
          ...(atom.metadata ? { metadata: atom.metadata } : {})
        })),
        bonds: molecule.bonds.map(bond => ({
          id: bond.id,
          atomA: bond.atomA,
          atomB: bond.atomB,
          order: bond.order,
          type: bond.type,
          ...(bond.stereo ? { stereo: bond.stereo } : {}),
          length: bond.length
        })),
        functionalGroups: molecule.functionalGroups
      },
      coordinates: {
        dimension: 3,
        kind: 'local_library_3d',
        origin: 'local_library',
        units: 'angstrom',
        method: 'ADVIS local chemistry-library coordinates; not a source-supplied or force-field-optimized conformer'
      },
      provenance: {
        provider: 'advis-local-registry',
        providerLabel: 'ADVIS local chemistry library',
        evidence: 'local_library',
        sourceId: entity.formula,
        retrievedAt: new Date().toISOString(),
        sourceAtomCount: molecule.atoms.length,
        sourceBondCount: molecule.bonds.length
      },
      geometry: molecule.geometry || entity.geometry
    });

    return assertValidStructureResult(result);
  }
};

const pubChemProvider: ChemistryStructureProvider = {
  id: 'pubchem',
  priority: 20,
  coordinateKinds: ['source_3d'],
  supports: () => true,
  async resolve(input) {
    const response = await fetch('/api/chemistry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: input.original })
    });

    let payload: any;
    try {
      payload = await response.json();
    } catch {
      throw new ChemistryResolutionError('The chemical reference returned an unreadable response.', { status: response.status });
    }

    if (!response.ok) {
      throw new ChemistryResolutionError(
        payload?.error || 'The requested compound could not be resolved.',
        {
          status: response.status,
          candidates: Array.isArray(payload?.candidates) ? payload.candidates : undefined,
          compound: payload?.compound,
          inputKind: payload?.inputKind || input.kind
        }
      );
    }

    try {
      const structure = assertValidStructureResult(payload as ChemistryStructureResult);
      if (structure.provenance.provider !== 'pubchem' || structure.coordinates.kind !== 'source_3d') {
        throw new Error('The PubChem provider returned an unexpected provider or coordinate origin.');
      }
      return structure;
    } catch (error) {
      throw new ChemistryResolutionError(
        'The source response failed molecular graph validation: ' + (error instanceof Error ? error.message : 'unknown validation error'),
        { status: 422 }
      );
    }
  }
};

const STRUCTURE_PROVIDERS: readonly ChemistryStructureProvider[] = [
  localRegistryProvider,
  pubChemProvider
].sort((a, b) => a.priority - b.priority);

export const CHEMISTRY_PROVIDER_IDS = Object.freeze(STRUCTURE_PROVIDERS.map(provider => provider.id));

export async function resolveChemistryStructure(query: string): Promise<ChemistryStructureResult> {
  const input = normalizeCompoundInput(query);
  const failures: string[] = [];

  for (const provider of STRUCTURE_PROVIDERS) {
    if (!provider.supports(input)) continue;
    try {
      const result = await provider.resolve(input);
      if (!result) continue;
      if (result.provenance.provider !== provider.id) {
        throw new ChemistryResolutionError('The provider identity does not match its returned provenance.', { status: 422 });
      }
      if (!provider.coordinateKinds.includes(result.coordinates.kind as CoordinateKind)) {
        throw new ChemistryResolutionError('The provider returned an unsupported coordinate provenance type.', { status: 422 });
      }
      return assertValidStructureResult(result);
    } catch (error) {
      if (error instanceof ChemistryResolutionError && error.status && error.status < 500) throw error;
      failures.push(provider.id + ': ' + (error instanceof Error ? error.message : 'provider failed'));
    }
  }

  throw new ChemistryResolutionError(
    failures.length
      ? failures.join('; ')
      : 'No configured chemistry provider could resolve this compound.'
  );
}
