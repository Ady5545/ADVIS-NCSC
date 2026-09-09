import { MoleculeData } from '../LearnEngine/MolecularEngine';
import {
  ScientificSystemModel,
  ScientificComponent,
  ScientificRelationship,
  Subsystem
} from './ScientificSchema';

const ELEMENT_METADATA: Record<
  string,
  {
    name: string;
    atomicNumber: number;
    valenceElectrons: number;
    electronegativity: number;
    color: string;
    size: number;
    metalness: number;
    roughness: number;
  }
> = {
  H: { name: 'Hydrogen', atomicNumber: 1, valenceElectrons: 1, electronegativity: 2.20, color: '#ccffff', size: 0.35, metalness: 0.1, roughness: 0.2 },
  B: { name: 'Boron', atomicNumber: 5, valenceElectrons: 3, electronegativity: 2.04, color: '#008b8b', size: 0.65, metalness: 0.4, roughness: 0.3 },
  C: { name: 'Carbon', atomicNumber: 6, valenceElectrons: 4, electronegativity: 2.55, color: '#475569', size: 0.70, metalness: 0.2, roughness: 0.6 },
  N: { name: 'Nitrogen', atomicNumber: 7, valenceElectrons: 5, electronegativity: 3.04, color: '#3b82f6', size: 0.65, metalness: 0.2, roughness: 0.4 },
  O: { name: 'Oxygen', atomicNumber: 8, valenceElectrons: 6, electronegativity: 3.44, color: '#ef4444', size: 0.62, metalness: 0.1, roughness: 0.3 },
  F: { name: 'Fluorine', atomicNumber: 9, valenceElectrons: 7, electronegativity: 3.98, color: '#86efac', size: 0.58, metalness: 0.1, roughness: 0.3 },
  Na: { name: 'Sodium', atomicNumber: 11, valenceElectrons: 1, electronegativity: 0.93, color: '#cbd5e1', size: 0.85, metalness: 0.8, roughness: 0.2 },
  Cl: { name: 'Chlorine', atomicNumber: 17, valenceElectrons: 7, electronegativity: 3.16, color: '#22c55e', size: 0.78, metalness: 0.1, roughness: 0.4 },
  default: { name: 'Element', atomicNumber: 0, valenceElectrons: 0, electronegativity: 2.0, color: '#94a3b8', size: 0.65, metalness: 0.3, roughness: 0.3 }
};

export function getElementProps(el: string) {
  return ELEMENT_METADATA[el] || ELEMENT_METADATA['default'];
}

/**
 * MolecularScientificAdapter
 * Converts any chemistry MoleculeData instance into a domain-agnostic ScientificSystemModel.
 * This unifies Chemistry with Mechanical, Biological, and Physical systems under ADVIS's
 * authoritative entity graph and state lifecycle.
 */
export function moleculeToScientificModel(
  molecule: MoleculeData,
  customId?: string,
  customName?: string
): ScientificSystemModel {
  const modelId = customId || molecule.metadata?.formula?.toLowerCase() || 'molecule_system';
  const modelName = customName || molecule.metadata?.name || molecule.metadata?.formula || 'Chemical Molecule';

  // 1. Build Subsystems from Functional Groups or Backbone
  const subsystems: Subsystem[] = [];
  const assignedAtomIds = new Set<string>();

  if (molecule.functionalGroups && molecule.functionalGroups.length > 0) {
    for (const fg of molecule.functionalGroups) {
      subsystems.push({
        id: fg.id,
        name: fg.type.replace(/_/g, ' ').toUpperCase(),
        description: `Functional group (${fg.type}) determining reactive chemical properties`,
        color: '#38bdf8',
        rootComponentIds: fg.atomIds
      });
      for (const aId of fg.atomIds) assignedAtomIds.add(aId);
    }
  }

  // Backbone subsystem for remaining atoms
  const backboneAtomIds = molecule.atoms
    .map(a => a.id)
    .filter(aId => !assignedAtomIds.has(aId));

  if (backboneAtomIds.length > 0 || subsystems.length === 0) {
    subsystems.push({
      id: 'molecular_backbone',
      name: 'Molecular Framework',
      description: 'Primary structural atomic skeleton maintaining molecular stability',
      color: '#a855f7',
      rootComponentIds: backboneAtomIds.length > 0 ? backboneAtomIds : molecule.atoms.map(a => a.id)
    });
  }

  // 2. Build Scientific Components from Atoms
  const components: Record<string, ScientificComponent> = {};

  for (const atom of molecule.atoms) {
    const elProps = getElementProps(atom.element);
    const subId =
      molecule.functionalGroups?.find(fg => fg.atomIds.includes(atom.id))?.id ||
      'molecular_backbone';

    components[atom.id] = {
      id: atom.id,
      name: `${elProps.name} Atom`,
      scientificName: `${elProps.name} (${atom.element})`,
      category: 'Chemical Atom',
      subsystemId: subId,
      parentId: null,
      childrenIds: [],
      geometry: {
        type: 'sphere',
        params: {
          radius: elProps.size * 0.45,
          widthSegments: 24,
          heightSegments: 16
        },
        material: {
          color: elProps.color,
          metalness: elProps.metalness,
          roughness: elProps.roughness,
          emissive: elProps.color,
          emissiveIntensity: 0.15
        },
        transform: {
          position: [atom.position.x, atom.position.y, atom.position.z],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [atom.position.x * 0.65, atom.position.y * 0.65, atom.position.z * 0.65]
      },
      education: {
        name: `${elProps.name} Atom`,
        scientificName: `${elProps.name} (Z = ${elProps.atomicNumber})`,
        definition: `Constituent atom in the ${modelName} lattice with atomic number ${elProps.atomicNumber}.`,
        function: `Forms covalent bonds to stabilize valence electron shell (Valence: ${elProps.valenceElectrons}).`,
        importance: `Electronegativity of ${elProps.electronegativity} determines bond polarity and dipole moment.`,
        realWorldRelevance: `Directly influences intermolecular bonding, reactivity, and thermodynamic state.`,
        curriculumLevel: 'HIGH_SCHOOL',
        governingEquations: [
          {
            name: 'Electronegativity Difference',
            formula: 'ΔEN = |EN_A - EN_B|',
            description: 'Quantifies polar covalent vs ionic character of chemical bonds'
          }
        ]
      },
      scientificProperties: {
        element: { value: atom.element, description: 'Chemical symbol' },
        atomicNumber: { value: elProps.atomicNumber, description: 'Protons in nucleus' },
        valenceElectrons: { value: elProps.valenceElectrons, description: 'Outer shell electrons' },
        electronegativity: { value: elProps.electronegativity, unit: 'Pauling', description: 'Electron affinity' },
        hybridization: { value: atom.hybridization || 'sp3', description: 'Orbital hybridization' }
      }
    };
  }

  // 3. Build Scientific Relationships from Bonds
  const relationships: ScientificRelationship[] = [];

  for (const bond of molecule.bonds) {
    const orderLabel = bond.order === 1 ? 'Single' : bond.order === 2 ? 'Double' : 'Triple';
    relationships.push({
      sourceId: bond.atomA,
      targetId: bond.atomB,
      type: 'CONNECTED_TO',
      transferType: 'CHEMICAL',
      description: `${orderLabel} ${bond.type || 'covalent'} bond sharing ${bond.order * 2} electrons (length: ${bond.length.toFixed(2)} Å)`,
      bidirectional: true,
      strength: bond.order / 3
    });

    // Populate children hierarchy
    if (components[bond.atomA] && components[bond.atomB]) {
      if (!components[bond.atomA].childrenIds.includes(bond.atomB)) {
        components[bond.atomA].childrenIds.push(bond.atomB);
      }
    }
  }

  // 4. Thermodynamic & Vibrational Simulation Model
  return {
    id: modelId,
    name: modelName,
    scientificTitle: `${modelName} (${molecule.geometry || 'Molecular Geometry'})`,
    domain: 'CHEMISTRY',
    description: `A 3D chemical entity containing ${molecule.atoms.length} atoms and ${molecule.bonds.length} chemical bonds organized in ${molecule.geometry || 'conformation'}.`,
    subsystems,
    components,
    relationships,
    simulation: {
      variables: {
        thermalVibration: {
          id: 'thermalVibration',
          name: 'Thermal Oscillation Amplitude',
          unit: 'Å',
          defaultValue: 0.05,
          isDynamic: true,
          description: 'Harmonic zero-point thermal displacement amplitude'
        },
        internalEnergy: {
          id: 'internalEnergy',
          name: 'Vibrational Internal Energy',
          unit: 'kJ/mol',
          defaultValue: 142.5,
          isDynamic: true,
          description: 'Internal bond vibrational energy'
        }
      },
      parameters: {
        temperature: 298.15,
        vibrationFrequency: 1.0
      },
      stepFunction: (state, dt, params) => {
        const temp = params.temperature ?? 298.15;
        const freq = params.vibrationFrequency ?? 1.0;
        const time = (state['simTime'] ?? 0) + dt;
        const amp = 0.03 * Math.sqrt(temp / 298.15) * Math.sin(time * freq * Math.PI * 2);

        return {
          ...state,
          simTime: time,
          thermalVibration: amp,
          internalEnergy: 142.5 + (temp - 298.15) * 0.045
        };
      }
    },
    diagrams: [
      {
        id: 'molecular_telemetry',
        title: 'Molecular Energy & Conformation',
        type: 'FLOW_PATH',
        description: 'Real-time vibrational and thermodynamic parameters of the chemical system',
        parametersTracked: ['temperature', 'thermalVibration', 'internalEnergy']
      }
    ]
  };
}
