import {
  assertValidStructureResult,
  buildStructureResult,
  normalizeCompoundInput,
  type ChemistryStructureResult
} from '../../shared/chemistry-contract.mjs';
import { CHEMISTRY_DATABASE } from './ChemistryDatabase';
import { MOLECULE_REGISTRY } from './MolecularEngine';

export class ChemistryResolutionError extends Error {
  status?: number;
  candidates?: Array<{ cid: number; name: string; formula: string; canonicalSmiles?: string; isomericSmiles?: string; inchiKey?: string }>;
  compound?: { cid?: number; name?: string; formula?: string };

  constructor(message: string, options: {
    status?: number;
    candidates?: ChemistryResolutionError['candidates'];
    compound?: ChemistryResolutionError['compound'];
  } = {}) {
    super(message);
    this.name = 'ChemistryResolutionError';
    this.status = options.status;
    this.candidates = options.candidates;
    this.compound = options.compound;
  }
}

interface StructureProvider {
  id: string;
  resolve(input: ReturnType<typeof normalizeCompoundInput>): Promise<ChemistryStructureResult | null>;
}

const localRegistryProvider: StructureProvider = {
  id: 'advis-local-registry',
  async resolve(input) {
    // Formula-only input never selects from a hand-built catalogue. A formula can
    // denote several isomers; only an exact, human-readable compound identity is eligible.
    if (input.kind !== 'name') return null;

    const searchName = input.identifier.trim().toLocaleLowerCase();
    const entity = Object.values(CHEMISTRY_DATABASE).find(item =>
      item.name.toLocaleLowerCase() === searchName ||
      (item.iupacName || '').toLocaleLowerCase() === searchName
    );
    if (!entity) return null;

    const generator = MOLECULE_REGISTRY[entity.formula.toUpperCase()] || MOLECULE_REGISTRY[entity.formula];
    if (!generator) return null;

    const molecule = generator();
    const result = buildStructureResult({
      identity: {
        query: input.original,
        name: entity.name,
        formula: entity.formula
      },
      graph: {
        atoms: molecule.atoms.map(atom => ({
          id: atom.id,
          element: atom.element,
          position: atom.position,
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
        units: 'angstrom',
        method: 'ADVIS local chemistry-library coordinates'
      },
      provenance: {
        provider: 'advis-local-registry',
        providerLabel: 'ADVIS local chemistry library',
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

const pubChemProvider: StructureProvider = {
  id: 'pubchem',
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
          compound: payload?.compound
        }
      );
    }

    try {
      return assertValidStructureResult(payload as ChemistryStructureResult);
    } catch (error) {
      throw new ChemistryResolutionError(
        'The source response failed molecular graph validation: ' + (error instanceof Error ? error.message : 'unknown validation error'),
        { status: 422 }
      );
    }
  }
};

const STRUCTURE_PROVIDERS: StructureProvider[] = [
  localRegistryProvider,
  pubChemProvider
];

export async function resolveChemistryStructure(query: string): Promise<ChemistryStructureResult> {
  const input = normalizeCompoundInput(query);
  const failures: string[] = [];

  for (const provider of STRUCTURE_PROVIDERS) {
    try {
      const result = await provider.resolve(input);
      if (result) return result;
    } catch (error) {
      if (error instanceof ChemistryResolutionError) throw error;
      failures.push(provider.id + ': ' + (error instanceof Error ? error.message : 'provider failed'));
    }
  }

  throw new ChemistryResolutionError(
    failures.length
      ? failures.join('; ')
      : 'No configured chemistry provider could resolve this compound.'
  );
}
