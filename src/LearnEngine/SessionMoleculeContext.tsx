import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  MoleculeData,
  AtomData,
  BondData,
  MOLECULE_REGISTRY,
  createSingleAtomMolecule,
  addAtomToMolecule,
  removeAtomFromMolecule,
  setBondOrderInMolecule,
  cloneMoleculeData
} from './MolecularEngine';
import { validateMolecularGraph, MolecularAnalysisResult } from './ValenceValidator';
import { CHEMISTRY_DATABASE, resolveChemicalEntity } from './ChemistryDatabase';

export type MolecularSourceType = 'EMPTY' | 'CUSTOM_BUILDER' | 'LIBRARY_DERIVATIVE';

export interface StructuredMolecularAction {
  type: 
    | 'INITIALIZE_BUILDER'
    | 'ADD_ATOM'
    | 'REMOVE_ATOM'
    | 'ADD_BOND'
    | 'REMOVE_BOND'
    | 'CHANGE_BOND_ORDER'
    | 'SET_FORMAL_CHARGE'
    | 'SELECT_ELEMENT'
    | 'RESTORE_LAST'
    | 'CLEAR_BUILDER'
    | 'LOAD_CANONICAL'
    | 'ANALYZE_STRUCTURE'
    | 'CLOSE';
  targetElement?: string;
  targetAtomId?: string;
  targetAtomIds?: string[];
  targetBondId?: string;
  bondOrder?: number;
  bondType?: 'covalent' | 'ionic' | 'hydrogen' | 'aromatic';
  parentAtomId?: string;
  canonicalFormula?: string;
  elementPair?: [string, string];
  allBonds?: boolean;
  ordinal?: number;
  explanationContext?: string;
}

export interface SessionMoleculeState {
  molecule: MoleculeData | null;
  selectedAtomId: string | null;
  selectedBondId: string | null;
  lastAddedAtomId: string | null;
  lastRemovedAtom: { atom: AtomData; bonds: BondData[] } | null;
  source: MolecularSourceType;
  canonicalOriginFormula: string | null;
  analysis: MolecularAnalysisResult | null;
  isSessionActive: boolean;
  actionHistory: Array<{ action: string; snapshot: MoleculeData; timestamp: number }>;
}

export interface SessionMoleculeContextType extends SessionMoleculeState {
  initializeBuilder: (element?: string) => void;
  loadCanonical: (formula: string) => void;
  addAtom: (element: string, parentAtomId?: string, bondOrder?: number) => string;
  removeAtom: (atomId?: string) => void;
  changeBondOrder: (target: { bondId?: string; atomA?: string; atomB?: string; allBonds?: boolean; elementPair?: [string, string] }, newOrder: number) => void;
  restoreLastRemoved: () => boolean;
  selectAtom: (atomId: string | null) => void;
  selectBond: (bondId: string | null) => void;
  clearBuilder: () => void;
  closeSession: () => void;
  executeStructuredAction: (action: StructuredMolecularAction) => { success: boolean; message?: string; analysis?: MolecularAnalysisResult };
  getMolecularContextForAI: () => any;
}

const SessionMoleculeContext = createContext<SessionMoleculeContextType | null>(null);

export const SessionMoleculeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [molecule, setMolecule] = useState<MoleculeData | null>(null);
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null);
  const [selectedBondId, setSelectedBondId] = useState<string | null>(null);
  const [lastAddedAtomId, setLastAddedAtomId] = useState<string | null>(null);
  const [lastRemovedAtom, setLastRemovedAtom] = useState<{ atom: AtomData; bonds: BondData[] } | null>(null);
  const [source, setSource] = useState<MolecularSourceType>('EMPTY');
  const [canonicalOriginFormula, setCanonicalOriginFormula] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [actionHistory, setActionHistory] = useState<Array<{ action: string; snapshot: MoleculeData; timestamp: number }>>([]);

  // Compute live real-time analysis whenever molecule changes
  const analysis = useMemo<MolecularAnalysisResult | null>(() => {
    if (!molecule) return null;
    return validateMolecularGraph(molecule);
  }, [molecule]);

  const pushHistory = (actionName: string, state: MoleculeData) => {
    setActionHistory(prev => [...prev.slice(-10), { action: actionName, snapshot: cloneMoleculeData(state), timestamp: Date.now() }]);
  };

  /**
   * Initializes a single-atom custom builder session.
   */
  const initializeBuilder = useCallback((element: string = 'C') => {
    const initial = createSingleAtomMolecule(element);
    setMolecule(initial);
    setSelectedAtomId('atom_0');
    setSelectedBondId(null);
    setLastAddedAtomId('atom_0');
    setLastRemovedAtom(null);
    setSource('CUSTOM_BUILDER');
    setCanonicalOriginFormula(null);
    setIsSessionActive(true);
    setActionHistory([{ action: `INITIALIZE_${element}`, snapshot: cloneMoleculeData(initial), timestamp: Date.now() }]);
  }, []);

  /**
   * Loads a canonical molecule from the registry as a starting point.
   */
  const loadCanonical = useCallback((formula: string) => {
    const canonicalKey = formula.toUpperCase();
    const resolved = resolveChemicalEntity(formula);
    const resolvedFormula = resolved ? resolved.formula : canonicalKey;

    const generator = MOLECULE_REGISTRY[resolvedFormula.toUpperCase()] || MOLECULE_REGISTRY[resolvedFormula];
    if (generator) {
      const data = generator();
      setMolecule(data);
      setSelectedAtomId(null);
      setSelectedBondId(null);
      setLastAddedAtomId(null);
      setLastRemovedAtom(null);
      setSource('LIBRARY_DERIVATIVE');
      setCanonicalOriginFormula(resolvedFormula);
      setIsSessionActive(true);
      setActionHistory([{ action: `LOAD_${resolvedFormula}`, snapshot: cloneMoleculeData(data), timestamp: Date.now() }]);
    }
  }, []);

  /**
   * Adds an atom to the active graph.
   */
  const addAtom = useCallback((element: string, parentAtomId?: string, bondOrder: number = 1): string => {
    let currentMolecule = molecule;
    if (!currentMolecule || currentMolecule.atoms.length === 0) {
      const newMol = createSingleAtomMolecule(element);
      setMolecule(newMol);
      setSelectedAtomId('atom_0');
      setLastAddedAtomId('atom_0');
      setSource('CUSTOM_BUILDER');
      setIsSessionActive(true);
      pushHistory(`ADD_${element}`, newMol);
      return 'atom_0';
    }

    // Determine target parent if not explicitly provided
    let target = parentAtomId || selectedAtomId;
    if (target) {
      const matched = currentMolecule.atoms.find(a => a.id === target || a.element.toUpperCase() === target!.toUpperCase());
      if (matched) target = matched.id;
    }
    if (!target) {
      // Find highest priority non-H atom, else first atom
      const nonH = currentMolecule.atoms.find(a => a.element !== 'H');
      target = nonH ? nonH.id : currentMolecule.atoms[0].id;
    }

    const { updatedMolecule, addedAtomId, addedBondId } = addAtomToMolecule(currentMolecule, element, target, bondOrder);
    setMolecule(updatedMolecule);
    setSelectedAtomId(addedAtomId);
    if (addedBondId) setSelectedBondId(addedBondId);
    setLastAddedAtomId(addedAtomId);
    setSource(prev => (prev === 'LIBRARY_DERIVATIVE' ? 'LIBRARY_DERIVATIVE' : 'CUSTOM_BUILDER'));
    setIsSessionActive(true);
    pushHistory(`ADD_${element}`, updatedMolecule);
    return addedAtomId;
  }, [molecule, selectedAtomId]);

  /**
   * Removes an atom from the active graph.
   */
  const removeAtom = useCallback((atomId?: string) => {
    if (!molecule || molecule.atoms.length === 0) return;

    let targetId = atomId || selectedAtomId || lastAddedAtomId;
    if (!targetId && molecule.atoms.length > 0) {
      // Default to the last atom in the array
      targetId = molecule.atoms[molecule.atoms.length - 1].id;
    }

    if (!targetId) return;

    const { updatedMolecule, removedAtom: removed, removedBonds } = removeAtomFromMolecule(molecule, targetId);
    
    if (removed) {
      setLastRemovedAtom({ atom: removed, bonds: removedBonds });
    }

    setMolecule(updatedMolecule);
    setSelectedAtomId(null);
    setSelectedBondId(null);
    setSource(prev => (prev === 'LIBRARY_DERIVATIVE' ? 'LIBRARY_DERIVATIVE' : 'CUSTOM_BUILDER'));
    pushHistory(`REMOVE_${targetId}`, updatedMolecule);
  }, [molecule, selectedAtomId, lastAddedAtomId]);

  /**
   * Changes bond order between atoms.
   */
  const changeBondOrder = useCallback((
    target: { bondId?: string; atomA?: string; atomB?: string; allBonds?: boolean; elementPair?: [string, string] },
    newOrder: number
  ) => {
    if (!molecule) return;
    const updated = setBondOrderInMolecule(molecule, target, newOrder);
    setMolecule(updated);
    pushHistory(`CHANGE_BOND_ORDER_${newOrder}`, updated);
  }, [molecule]);

  /**
   * Restores the most recently removed atom and its bonds.
   */
  const restoreLastRemoved = useCallback((): boolean => {
    if (!lastRemovedAtom || !molecule) return false;

    const updated = cloneMoleculeData(molecule);
    // Add atom back
    updated.atoms.push({
      ...lastRemovedAtom.atom,
      position: lastRemovedAtom.atom.position.clone()
    });

    // Add back bonds where both atoms exist in the updated graph
    lastRemovedAtom.bonds.forEach(b => {
      const existsA = updated.atoms.some(a => a.id === b.atomA);
      const existsB = updated.atoms.some(a => a.id === b.atomB);
      if (existsA && existsB && !updated.bonds.some(ob => ob.id === b.id)) {
        updated.bonds.push({ ...b });
      }
    });

    setMolecule(updated);
    setSelectedAtomId(lastRemovedAtom.atom.id);
    setLastAddedAtomId(lastRemovedAtom.atom.id);
    setLastRemovedAtom(null);
    pushHistory(`RESTORE_${lastRemovedAtom.atom.element}`, updated);
    return true;
  }, [lastRemovedAtom, molecule]);

  /**
   * Clear the active builder.
   */
  const clearBuilder = useCallback(() => {
    setMolecule(null);
    setSelectedAtomId(null);
    setSelectedBondId(null);
    setLastAddedAtomId(null);
    setLastRemovedAtom(null);
    setSource('EMPTY');
    setCanonicalOriginFormula(null);
    setIsSessionActive(false);
    setActionHistory([]);
  }, []);

  /**
   * Closes the session completely.
   */
  const closeSession = useCallback(() => {
    clearBuilder();
  }, [clearBuilder]);

  /**
   * Selects an atom by ID.
   */
  const selectAtom = useCallback((atomId: string | null) => {
    setSelectedAtomId(atomId);
    if (atomId) setSelectedBondId(null);
  }, []);

  /**
   * Selects a bond by ID.
   */
  const selectBond = useCallback((bondId: string | null) => {
    setSelectedBondId(bondId);
    if (bondId) setSelectedAtomId(null);
  }, []);

  /**
   * Executes a structured molecular action from conversational AI.
   */
  const executeStructuredAction = useCallback((action: StructuredMolecularAction): { success: boolean; message?: string; analysis?: MolecularAnalysisResult } => {
    switch (action.type) {
      case 'INITIALIZE_BUILDER': {
        const el = action.targetElement || 'C';
        initializeBuilder(el);
        return { success: true, message: `Displaying ${el.toUpperCase()} atom.` };
      }

      case 'LOAD_CANONICAL': {
        if (action.canonicalFormula) {
          loadCanonical(action.canonicalFormula);
          return { success: true, message: `Loaded canonical ${action.canonicalFormula}.` };
        }
        return { success: false, message: 'No formula specified.' };
      }

      case 'ADD_ATOM': {
        const el = action.targetElement || 'O';
        const parent = action.parentAtomId || selectedAtomId;
        const bondOrder = action.bondOrder || 1;
        const addedId = addAtom(el, parent || undefined, bondOrder);
        return { success: true, message: `Added ${el.toUpperCase()} atom (${addedId}).` };
      }

      case 'REMOVE_ATOM': {
        let targetId = action.targetAtomId;
        
        // Handle contextual targets
        if (!targetId && action.targetElement && molecule) {
          // Find matching atoms by element
          const matching = molecule.atoms.filter(a => a.element.toUpperCase() === action.targetElement!.toUpperCase());
          if (matching.length > 0) {
            if (action.ordinal && action.ordinal <= matching.length) {
              targetId = matching[action.ordinal - 1].id;
            } else {
              targetId = matching[matching.length - 1].id;
            }
          }
        }

        removeAtom(targetId);
        return { success: true, message: `Removed atom.` };
      }

      case 'CHANGE_BOND_ORDER': {
        const newOrder = action.bondOrder || 2;
        if (action.ordinal && molecule && molecule.bonds.length >= action.ordinal) {
          const targetBond = molecule.bonds[action.ordinal - 1];
          changeBondOrder({ bondId: targetBond.id }, newOrder);
          return { success: true, message: `Changed bond ${action.ordinal} order to ${newOrder}.` };
        } else if (action.allBonds) {
          changeBondOrder({ allBonds: true }, newOrder);
          return { success: true, message: `Changed all bonds to order ${newOrder}.` };
        } else if (action.elementPair) {
          changeBondOrder({ elementPair: action.elementPair }, newOrder);
          return { success: true, message: `Changed ${action.elementPair.join('-')} bonds to order ${newOrder}.` };
        } else if (action.targetBondId) {
          changeBondOrder({ bondId: action.targetBondId }, newOrder);
          return { success: true, message: `Changed bond order to ${newOrder}.` };
        } else if (molecule && molecule.bonds.length > 0) {
          changeBondOrder({ bondId: molecule.bonds[0].id }, newOrder);
          return { success: true, message: `Changed bond order to ${newOrder}.` };
        } else {
          changeBondOrder({ allBonds: true }, newOrder);
          return { success: true, message: `Changed bonds to double bonds.` };
        }
      }

      case 'RESTORE_LAST': {
        const ok = restoreLastRemoved();
        return { success: ok, message: ok ? 'Restored previously removed atom.' : 'No recently removed atom to restore.' };
      }

      case 'SELECT_ELEMENT': {
        if (action.targetAtomId) {
          selectAtom(action.targetAtomId);
          return { success: true, message: `Selected atom ${action.targetAtomId}.` };
        } else if (action.targetElement && molecule) {
          const matching = molecule.atoms.filter(a => a.element.toUpperCase() === action.targetElement!.toUpperCase());
          if (matching.length > 0) {
            const idx = (action.ordinal && action.ordinal <= matching.length) ? action.ordinal - 1 : 0;
            selectAtom(matching[idx].id);
            return { success: true, message: `Selected ${matching[idx].element} atom (${matching[idx].id}).` };
          }
        }
        return { success: false, message: 'Target atom not found.' };
      }

      case 'CLEAR_BUILDER':
      case 'CLOSE': {
        clearBuilder();
        return { success: true, message: 'Molecular workspace closed.' };
      }

      case 'ANALYZE_STRUCTURE': {
        if (molecule) {
          const res = validateMolecularGraph(molecule);
          return { success: true, message: res.educationalSummary, analysis: res };
        }
        return { success: false, message: 'No active molecule to analyze.' };
      }

      default:
        return { success: false, message: `Unknown action: ${(action as any).type}` };
    }
  }, [initializeBuilder, loadCanonical, addAtom, removeAtom, changeBondOrder, restoreLastRemoved, selectAtom, clearBuilder, molecule, selectedAtomId]);

  /**
   * Produces a rich, concise molecular context object to send to the server/Gemini.
   */
  const getMolecularContextForAI = useCallback(() => {
    if (!molecule || molecule.atoms.length === 0) return null;

    const currentAnalysis = analysis || validateMolecularGraph(molecule);

    return {
      isActive: true,
      source,
      canonicalOriginFormula,
      formula: currentAnalysis.formula,
      totalAtoms: molecule.atoms.length,
      totalBonds: molecule.bonds.length,
      estimatedGeometry: currentAnalysis.estimatedGeometry,
      estimatedHybridization: currentAnalysis.estimatedHybridization,
      warnings: currentAnalysis.warnings,
      atoms: molecule.atoms.map((a, idx) => ({
        id: a.id,
        element: a.element,
        orderIndex: idx + 1,
        bondsCount: molecule.bonds.filter(b => b.atomA === a.id || b.atomB === a.id).length
      })),
      bonds: molecule.bonds.map(b => ({
        id: b.id,
        atomA: b.atomA,
        atomB: b.atomB,
        order: b.order
      })),
      selectedAtomId,
      selectedBondId,
      lastAddedAtomId,
      lastRemovedAtom: lastRemovedAtom ? { element: lastRemovedAtom.atom.element, id: lastRemovedAtom.atom.id } : null
    };
  }, [molecule, analysis, source, canonicalOriginFormula, selectedAtomId, selectedBondId, lastAddedAtomId, lastRemovedAtom]);

  return (
    <SessionMoleculeContext.Provider
      value={{
        molecule,
        selectedAtomId,
        selectedBondId,
        lastAddedAtomId,
        lastRemovedAtom,
        source,
        canonicalOriginFormula,
        analysis,
        isSessionActive,
        actionHistory,
        initializeBuilder,
        loadCanonical,
        addAtom,
        removeAtom,
        changeBondOrder,
        restoreLastRemoved,
        selectAtom,
        selectBond,
        clearBuilder,
        closeSession,
        executeStructuredAction,
        getMolecularContextForAI
      }}
    >
      {children}
    </SessionMoleculeContext.Provider>
  );
};

export function useSessionMolecule(): SessionMoleculeContextType {
  const ctx = useContext(SessionMoleculeContext);
  if (!ctx) {
    throw new Error('useSessionMolecule must be used within a SessionMoleculeProvider');
  }
  return ctx;
}
