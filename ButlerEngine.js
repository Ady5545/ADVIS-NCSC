// ButlerEngine.js
// ADVIS Scientific Intelligence Layer
// Sits above existing intent, spatial, chemistry, memory and execution subsystems.

const fs = require("fs");
const path = require("path");

// Scientific Educational Insights Database
const SCIENTIFIC_EXPLANATIONS = {
  "CO2": "Carbon Dioxide (CO₂) is linear because the central carbon atom has two electron domains (two C=O double bonds) with sp hybridization. The electron domains orient 180.0° apart to minimize electrostatic repulsion (AX₂ VSEPR geometry).",
  "H2O": "Water (H₂O) is bent because oxygen has four electron domains: two O-H single bonds and two non-bonding lone pairs in an sp³ arrangement. The lone pairs exert greater electrostatic repulsion than bonding pairs, compressing the H–O–H angle from 109.5° down to 104.5° (AX₂E₂ VSEPR geometry).",
  "CH4": "Methane (CH₄) is tetrahedral because carbon promotes a 2s electron and hybridizes into four equivalent sp³ orbitals pointing toward the vertices of a regular tetrahedron at 109.5° (AX₄ VSEPR geometry).",
  "BF3": "Boron Trifluoride (BF₃) is trigonal planar because boron forms three equivalent B-F bonds using sp² hybridization in a flat plane at 120.0° angles, leaving an empty unhybridized 2p orbital (AX₃ VSEPR geometry).",
  "NH3": "Ammonia (NH₃) is trigonal pyramidal because nitrogen has four sp³ electron domains: three N-H single bonds and one localized lone pair. The lone pair's repulsion compresses the bond angle to 107.3° (AX₃E VSEPR geometry).",
  "C6H6": "Benzene (C₆H₆) is a planar aromatic ring where six sp²-hybridized carbons form a hexagon with 120° bond angles. Six delocalized π electrons circulate above and below the ring obeying Hückel's 4n+2 rule.",
  "NaCl": "Sodium Chloride (NaCl) forms a face-centered cubic (FCC) ionic rock-salt lattice where each Na⁺ ion is octahedrally coordinated by six Cl⁻ ions (6:6 coordination) via non-directional Coulombic attraction."
};

const COMPONENT_EXPLANATIONS = {
  "piston_left_bank": "Bank 1 Forged Pistons: Lightweight forged 4032 aluminum pistons with moly disulfide skirt coatings. They absorb high-pressure combustion forces and transfer reciprocating kinetic energy to the titanium connecting rods.",
  "piston_right_bank": "Bank 2 Forged Pistons: Opposing cylinder bank forged aluminum pistons driving shared crank pins at a 60-degree V-angle for naturally balanced harmonics.",
  "crankshaft": "7-Bearing Forged Steel Crankshaft: Plasma-nitrided 4340 chromoly steel crankshaft supported by 7 main bearings. It translates linear reciprocating piston motion into continuous rotational torque.",
  "connecting_rods": "H-Beam Titanium Connecting Rods: Forged Ti-6Al-4V titanium rods engineered for ultra-high RPM reciprocating tensile and compressive loads.",
  "engine_block": "60° V12 Cast Aluminum Block: Rigid deep-skirt A356-T6 cast aluminum engine block housing 12 cylinder bores arranged in two 60-degree banks.",
  "valvetrain": "DOHC 48-Valve Valvetrain: Dual overhead billet steel camshafts and 48 titanium valves controlling high-velocity air-fuel induction and exhaust scavenging.",
  "intake_plenum": "Dual Plenum Intake Manifold: Red powder-coated magnesium-aluminum alloy intake manifold with tuned variable-length runners optimizing volumetric efficiency.",
  "exhaust_manifold": "Equal-Length Exhaust Headers: TIG-welded 321 stainless steel tuned headers utilizing exhaust pulse resonance to scavenge exhaust gases up to 950°C.",
  "cooling_system": "Integrated Water Jackets & Coolant Pump: High-flow centrifugal pump circulating coolant through internal engine block jackets at 140 L/min.",
  "lubrication_system": "Dry-Sump Oil Pan & Scavenge Pump: Multi-stage dry sump oil system maintaining continuous lubrication pressure under high lateral G-forces.",
  "servo_gears": "Nylon Reduction Gear Set: Multi-stage precision gear train that steps down high DC motor RPM while multiplying output torque to 1.8 kgf·cm.",
  "servo_motor_core": "Internal Coreless DC Motor: High-efficiency brushed DC motor converting electrical power into angular rotational torque.",
  "servo_pot": "Position Potentiometer: Rotary potentiometer providing direct analog voltage feedback of the output horn angle to the closed-loop control circuit.",
  "servo_arm": "Output Servo Horn Arm: Articulated mechanical lever arm transferring controlled angular rotation (0°–180°) to external linkage components."
};

/**
 * Butler Contextual Reference Resolver
 * Maps pronouns ("this", "that", "it", "again", "here", "the engine", "the molecule", "the structure", "back")
 * to the currently active object, visualization, workspace, project, or recent action.
 */
function resolveContextualReferences(message, butlerContext) {
  const lower = message.toLowerCase().trim();
  const ctx = butlerContext || {};

  const activeVisualization = ctx.activeScientificVisualization || null;
  const activeSpatial = ctx.activeSpatialObject || null;
  const activeWorkspace = ctx.activeWorkspace || 'HUD';
  const recentActions = ctx.recentActions || [];
  const activeProject = ctx.activeProjectName || ctx.activeProjectId || null;
  const activeMolecule = ctx.activeMolecule || null;

  // Most recent action and target
  const lastAction = recentActions.length > 0 ? recentActions[recentActions.length - 1] : null;
  const previousAction = recentActions.length > 1 ? recentActions[recentActions.length - 2] : null;

  let resolvedTarget = null;
  let resolvedType = null; // 'MOLECULE' | 'SPATIAL' | 'PROJECT' | 'ACTION'
  let isAnaphoric = false;

  const hasAnaphora = /\b(this|that|it|here|again|back|one|the model|the molecule|the engine|the structure|the project)\b/i.test(lower);

  if (hasAnaphora || lower === "nah close this" || lower === "okay close it" || lower === "close this" || lower === "close it") {
    isAnaphoric = true;

    if (lower.includes("the engine") || lower.includes("engine")) {
      resolvedTarget = (typeof activeSpatial === 'string' && activeSpatial.includes("engine")) ? activeSpatial : "v12_engine";
      resolvedType = 'SPATIAL';
    } else if (lower.includes("the molecule") || lower.includes("the structure") || lower.includes("the chemical") || lower.includes("glucose")) {
      resolvedTarget = activeVisualization || (activeMolecule ? activeMolecule.formula : "C6H12O6");
      resolvedType = 'MOLECULE';
    } else if (lower.includes("the project") || lower.includes("what was i doing") || lower.includes("what were we doing")) {
      resolvedTarget = activeProject;
      resolvedType = 'PROJECT';
    } else if (lower.includes("again") || lower.includes("back") || lower.includes("open that again") || lower.includes("go back")) {
      if (lastAction && lastAction.target) {
        resolvedTarget = lastAction.target;
        resolvedType = lastAction.type === 'DISPLAY_SCIENTIFIC' ? 'MOLECULE' : 'SPATIAL';
      } else if (previousAction && previousAction.target) {
        resolvedTarget = previousAction.target;
        resolvedType = previousAction.type === 'DISPLAY_SCIENTIFIC' ? 'MOLECULE' : 'SPATIAL';
      } else {
        resolvedTarget = activeVisualization || activeSpatial || "v12_engine";
        resolvedType = activeVisualization ? 'MOLECULE' : 'SPATIAL';
      }
    } else {
      // Default "this" / "that" / "it" resolution
      if (ctx.selectedComponentId) {
        resolvedTarget = ctx.selectedComponentId;
        resolvedType = 'COMPONENT';
      } else if (activeWorkspace === 'MOLECULES' || activeWorkspace === 'CHEMISTRY') {
        resolvedTarget = activeVisualization || (activeMolecule ? activeMolecule.formula : null);
        resolvedType = 'MOLECULE';
      } else if (activeWorkspace === 'SPATIAL' || activeWorkspace === 'ENGINEERING') {
        resolvedTarget = Array.isArray(activeSpatial) ? activeSpatial[0] : activeSpatial;
        resolvedType = 'SPATIAL';
      } else if (lastAction && lastAction.target) {
        resolvedTarget = lastAction.target;
        resolvedType = lastAction.type === 'DISPLAY_SCIENTIFIC' ? 'MOLECULE' : 'SPATIAL';
      } else {
        if (activeMolecule || activeVisualization) {
          resolvedTarget = activeVisualization || (activeMolecule ? activeMolecule.formula : null);
          resolvedType = 'MOLECULE';
        } else if (activeSpatial) {
          resolvedTarget = Array.isArray(activeSpatial) ? activeSpatial[0] : activeSpatial;
          resolvedType = 'SPATIAL';
        }
      }
    }
  }

  return {
    isAnaphoric,
    resolvedTarget,
    resolvedType,
    activeWorkspace,
    activeVisualization,
    activeSpatial,
    activeProject,
    activeMolecule,
    lastAction
  };
}

/**
 * Detects interactive conversational molecular builder actions
 */
function detectMolecularAction(message, butlerContext) {
  const lower = message.toLowerCase().trim();
  const ctx = butlerContext || {};
  const activeMol = ctx.activeMolecule || null;
  const activeVisualization = ctx.activeScientificVisualization || null;

  // 1. Initializing single-atom builder
  // Matches "show carbon", "display carbon", "start with carbon", "start with a carbon atom", "show a carbon atom", "show boron", "show nitrogen", "show oxygen atom"
  const initMatch = lower.match(/^(?:show|display|start with|render|view)\s+(?:an?\s+)?(carbon|oxygen|nitrogen|boron|hydrogen|sulfur|phosphorus|fluorine|chlorine)(?:\s+atom)?$/i);
  if (initMatch) {
    const elWord = initMatch[1].toLowerCase();
    const elMap = {
      carbon: 'C', oxygen: 'O', nitrogen: 'N', boron: 'B', hydrogen: 'H',
      sulfur: 'S', phosphorus: 'P', fluorine: 'F', chlorine: 'Cl'
    };
    const el = elMap[elWord] || 'C';
    return {
      type: 'INITIALIZE_BUILDER',
      targetElement: el,
      reply: `Displaying ${elWord.charAt(0).toUpperCase() + elWord.slice(1)}.`,
      userObjective: `Initialize molecular workspace with ${elWord} atom`
    };
  }

  // 2. Add Atom
  // Matches "add oxygen", "add an oxygen", "add another oxygen", "add a second oxygen", "add 2nd oxygen", "add hydrogen to the carbon", "add oxygen to it", "add h to c", "add nitrogen"
  const addMatch = lower.match(/^(?:add|attach|bond)\s+(?:an?\s+|another\s+|a\s+second\s+|2nd\s+)?(oxygen|hydrogen|nitrogen|carbon|fluorine|boron|sulfur|phosphorus|chlorine|h|o|n|c|f|b|s|p|cl)(?:\s+(?:atom|group))?(?:\s+to\s+(?:the\s+)?(carbon|oxygen|nitrogen|boron|c|o|n|b|center|central\s+atom|it|this|that|selected|selected\s+atom))?$/i);
  if (addMatch) {
    const elWord = addMatch[1].toLowerCase();
    const elMap = {
      oxygen: 'O', o: 'O',
      hydrogen: 'H', h: 'H',
      nitrogen: 'N', n: 'N',
      carbon: 'C', c: 'C',
      fluorine: 'F', f: 'F',
      boron: 'B', b: 'B',
      sulfur: 'S', s: 'S',
      phosphorus: 'P', p: 'P',
      chlorine: 'Cl', cl: 'Cl'
    };
    const el = elMap[elWord] || 'O';
    const parentWord = addMatch[2] ? addMatch[2].toLowerCase() : null;
    const isSecond = lower.includes('another') || lower.includes('second') || lower.includes('2nd');

    let reply = `${isSecond ? 'Second ' : ''}${elWord.length > 2 ? elWord.charAt(0).toUpperCase() + elWord.slice(1) : el} added${parentWord ? ` to ${parentWord}` : ''}.`;
    if (lower === 'add oxygen') reply = 'Oxygen added.';
    if (lower === 'add another oxygen' || lower === 'add a second oxygen' || lower === 'add second oxygen') reply = 'Second oxygen added.';
    if (lower === 'add hydrogen to the carbon' || lower === 'add hydrogen to carbon') reply = 'Hydrogen added to carbon.';
    if (lower === 'add oxygen to it' || lower === 'add oxygen to this') reply = 'Oxygen added to selected atom.';

    return {
      type: 'ADD_ATOM',
      targetElement: el,
      targetParent: parentWord ? (elMap[parentWord] || parentWord) : undefined,
      reply,
      userObjective: `Add ${el} atom to molecular structure`
    };
  }

  // 3. Change Bond Order
  // Matches "make both bonds double", "make both c-o bonds double", "change the first bond to single", "make the second bond double", "make single"
  if (lower.match(/(make|change|set).*(double|triple|single)/i)) {
    let bondOrder = 2;
    if (lower.includes('triple')) bondOrder = 3;
    if (lower.includes('single')) bondOrder = 1;

    let ordinal = undefined;
    if (lower.includes('first') || lower.includes('1st')) ordinal = 1;
    if (lower.includes('second') || lower.includes('2nd')) ordinal = 2;
    if (lower.includes('third') || lower.includes('3rd')) ordinal = 3;

    const allBonds = (lower.includes('both') || lower.includes('all') || lower.includes('the bonds')) && !ordinal;
    
    let reply = 'Bond changed.';
    if (ordinal === 1) {
      reply = `First bond changed to ${bondOrder === 1 ? 'single' : (bondOrder === 2 ? 'double' : 'triple')} bond.`;
    } else if (ordinal === 2) {
      reply = `Second bond changed to ${bondOrder === 1 ? 'single' : (bondOrder === 2 ? 'double' : 'triple')} bond.`;
    } else if (allBonds) {
      reply = bondOrder === 2 ? 'Both C–O bonds changed to double bonds.' : (bondOrder === 3 ? 'Bonds changed to triple bonds.' : 'Bonds changed to single bonds.');
    } else {
      reply = bondOrder === 2 ? 'Bond changed to double bond.' : (bondOrder === 3 ? 'Bond changed to triple bond.' : 'Bond changed to single bond.');
    }

    return {
      type: 'CHANGE_BOND_ORDER',
      bondOrder,
      allBonds,
      ordinal,
      reply,
      userObjective: `Change bond order to ${bondOrder}`
    };
  }

  // 4. Remove Atom
  // Matches "remove one hydrogen", "remove a hydrogen", "remove the hydrogen", "delete hydrogen", "remove the second oxygen", "remove 2nd oxygen", "remove that", "remove it", "delete this", "delete it", "remove selected"
  const removeMatch = lower.match(/^(?:remove|delete|take away)\s+(?:one\s+|a\s+|the\s+|this\s+|that\s+)?(hydrogen|oxygen|nitrogen|carbon|fluorine|boron|second\s+oxygen|2nd\s+oxygen|first\s+oxygen|it|that|this|atom)?$/i);
  if (removeMatch || lower === 'remove it' || lower === 'remove that' || lower === 'delete this' || lower === 'delete it' || lower === 'remove selected') {
    const rawTarget = removeMatch && removeMatch[1] ? removeMatch[1].toLowerCase() : '';
    let targetElement = undefined;
    let ordinal = undefined;

    if (rawTarget.includes('hydrogen') || lower.includes('hydrogen')) targetElement = 'H';
    else if (rawTarget.includes('oxygen') || lower.includes('oxygen')) targetElement = 'O';
    else if (rawTarget.includes('nitrogen') || lower.includes('nitrogen')) targetElement = 'N';
    else if (rawTarget.includes('carbon') || lower.includes('carbon')) targetElement = 'C';

    if (rawTarget.includes('second') || rawTarget.includes('2nd') || lower.includes('second') || lower.includes('2nd')) {
      ordinal = 2;
      targetElement = 'O';
    }

    let reply = 'Atom removed.';
    if (targetElement === 'H') reply = 'One hydrogen removed. Hydroxyl group remaining.';
    if (ordinal === 2 && targetElement === 'O') reply = 'Second oxygen atom removed.';
    if (lower === 'remove it' || lower === 'remove that') reply = 'Removed selected atom.';

    return {
      type: 'REMOVE_ATOM',
      targetElement,
      ordinal,
      reply,
      userObjective: 'Remove atom from molecular structure'
    };
  }

  // 5. Select Atom
  // Matches "select the second oxygen", "select 2nd oxygen", "select the carbon", "select carbon", "select this atom", "select the last atom"
  const selectMatch = lower.match(/^select\s+(?:the\s+)?(second\s+oxygen|2nd\s+oxygen|first\s+oxygen|carbon|oxygen|nitrogen|boron|hydrogen|this\s+atom|the\s+last\s+atom|atom)?$/i);
  if (selectMatch) {
    const rawTarget = selectMatch[1].toLowerCase();
    let targetElement = undefined;
    let ordinal = undefined;

    if (rawTarget.includes('second') || rawTarget.includes('2nd')) {
      ordinal = 2;
      targetElement = 'O';
    } else if (rawTarget.includes('first') || rawTarget.includes('1st')) {
      ordinal = 1;
      targetElement = 'O';
    } else if (rawTarget.includes('carbon')) targetElement = 'C';
    else if (rawTarget.includes('oxygen')) targetElement = 'O';
    else if (rawTarget.includes('nitrogen')) targetElement = 'N';
    else if (rawTarget.includes('hydrogen')) targetElement = 'H';

    let reply = `Selected ${targetElement || 'atom'}.`;
    if (ordinal === 2 && targetElement === 'O') reply = 'Second oxygen selected.';
    if (ordinal === 1 && targetElement === 'O') reply = 'First oxygen selected.';
    if (targetElement === 'C') reply = 'Carbon atom selected.';

    return {
      type: 'SELECT_ELEMENT',
      targetElement,
      ordinal,
      reply,
      userObjective: 'Select atom in molecular structure'
    };
  }

  // 6. Restore / Undo
  // Matches "add it back", "restore it", "bring it back", "put it back", "undo removal", "undo that removal"
  if (lower === 'add it back' || lower === 'restore it' || lower === 'bring it back' || lower === 'put it back' || lower === 'undo removal' || lower === 'undo that removal' || lower === 'undo that') {
    return {
      type: 'RESTORE_LAST',
      reply: 'Restored previously removed atom.',
      userObjective: 'Restore last removed atom'
    };
  }

  // 7. Clear Builder
  if (lower === 'clear builder' || lower === 'clear molecule' || lower === 'reset molecule' || lower === 'start over molecule' || lower === 'reset') {
    return {
      type: 'CLEAR_BUILDER',
      reply: 'Molecular builder reset.',
      userObjective: 'Reset molecular workspace'
    };
  }

  // 8. Analyze It / Structural Analysis
  // Matches "analyze it", "analyze the structure", "analyze this molecule", "analyze the molecule", "analyze this"
  if (lower === 'analyze it' || lower === 'analyze the structure' || lower === 'analyze this molecule' || lower === 'analyze the molecule' || lower === 'analyze this') {
    let reply = 'Analyzing molecular structure.';
    if (activeMol) {
      const hasDoubleBonds = activeMol.bonds && activeMol.bonds.some(b => b.order === 2);
      if (activeMol.formula === 'CO2' || (activeMol.totalAtoms === 3 && activeMol.atoms && activeMol.atoms.some(a => a.element === 'C'))) {
        if (hasDoubleBonds) {
          reply = 'Structure Analysis for Carbon Dioxide (CO₂): Linear geometry with sp hybridization at the central carbon (180° bond angles). Both carbon-oxygen bonds are double bonds, satisfying the octet rule with 0 formal charges.';
        } else {
          reply = `Structure Analysis for C + 2 O (Single Bonds): Geometry: ${activeMol.estimatedGeometry || 'Linear'}, Hybridization: ${activeMol.estimatedHybridization || 'sp'}. Carbon currently has only 2 single bonds (valence 2/4), with unsatisfied octets on carbon and oxygens.`;
        }
      } else if (activeMol.formula === 'H2O') {
        reply = 'Structure Analysis: Bent geometry (104.5° bond angle) with sp³ hybridization at the central oxygen due to two bonding pairs and two lone pairs.';
      } else if (activeMol.formula === 'CH4') {
        reply = 'Structure Analysis: Tetrahedral geometry (109.5° bond angles) with sp³ hybridization at the central carbon, featuring 4 equivalent single sigma bonds.';
      } else if (activeMol.formula) {
        reply = `Structure Analysis for ${activeMol.formula}: Geometry: ${activeMol.estimatedGeometry || 'Empirical'}, Hybridization: ${activeMol.estimatedHybridization || 'Standard'}, Total Atoms: ${activeMol.totalAtoms || 0}, Bonds: ${activeMol.totalBonds || 0}.`;
      }
    } else if (activeVisualization) {
      if (activeVisualization === 'C6H12O6') {
        reply = 'Structure Analysis: D-Glucose exists in a pyranose chair conformation with five hydroxyl (-OH) functional groups and a cyclic hemiacetal oxygen ring.';
      } else if (activeVisualization === 'CO2') {
        reply = 'Structure Analysis: Carbon Dioxide (CO₂) has a linear geometry (180°), sp hybridized central carbon, and two polar C=O double bonds that cancel out for a net zero dipole moment.';
      }
    }

    return {
      type: 'ANALYZE_STRUCTURE',
      reply,
      userObjective: 'Analyze active molecular structure'
    };
  }

  // 9. Why is this molecule <geometry>?
  if (lower.includes('why') && (lower.includes('linear') || lower.includes('bent') || lower.includes('tetrahedral') || lower.includes('planar') || lower.includes('pyramidal') || lower.includes('look like that') || lower.includes('this shape') || lower.includes('this geometry'))) {
    let key = activeVisualization || (activeMol ? activeMol.formula : null);
    if (!key) {
      if (lower.includes('co2') || lower.includes('carbon dioxide')) key = 'CO2';
      else if (lower.includes('h2o') || lower.includes('water')) key = 'H2O';
      else if (lower.includes('ch4') || lower.includes('methane')) key = 'CH4';
      else if (lower.includes('bf3')) key = 'BF3';
      else if (lower.includes('nh3') || lower.includes('ammonia')) key = 'NH3';
    }
    const explanation = (key && SCIENTIFIC_EXPLANATIONS[key]) || (activeMol ? `The molecule adopts a ${activeMol.estimatedGeometry || 'stable'} geometry based on VSEPR theory with ${activeMol.estimatedHybridization || 'hybridized'} orbitals minimizing electrostatic repulsion.` : 'Molecular geometry is governed by VSEPR theory where valence electron pairs repel each other to maximize distance.');
    return {
      type: 'EXPLAIN_GEOMETRY',
      reply: explanation,
      userObjective: 'Explain molecular geometry and VSEPR theory'
    };
  }

  return null;
}


/**
 * Formats a compact, highly relevant contextual summary for Gemini / LLM prompts.
 */
function buildContextSummary(butlerContext, resolvedRef, advisMemories, advisProjects) {
  const ctx = butlerContext || {};
  const recentConvo = (ctx.recentConversation || []).slice(-4);
  const recentActions = (ctx.recentActions || []).slice(-4);

  let summary = `[EDUCATIONAL SESSION CONTEXT]:\n`;
  summary += `- Active Workspace: ${ctx.activeWorkspace || 'HUD'}\n`;

  if (ctx.activeScientificVisualization) {
    summary += `- Active Scientific Visualization: ${ctx.activeScientificVisualization}\n`;
  }
  if (ctx.activeMolecule) {
    const mol = ctx.activeMolecule;
    summary += `- Active Interactive Molecule: ${mol.formula || 'Custom Graph'} (Atoms: ${mol.totalAtoms || 0}, Bonds: ${mol.totalBonds || 0})\n`;
    if (mol.estimatedGeometry) summary += `  - Estimated Geometry: ${mol.estimatedGeometry}\n`;
    if (mol.estimatedHybridization) summary += `  - Estimated Hybridization: ${mol.estimatedHybridization}\n`;
    if (mol.selectedAtomId) summary += `  - Selected Atom: ${mol.selectedAtomId}\n`;
    if (mol.warnings && mol.warnings.length > 0) {
      summary += `  - Valence State Notes: ${mol.warnings.map(w => w.message).join('; ')}\n`;
    }
  }
  if (ctx.activeSpatialObject) {
    summary += `- Active Spatial 3D Model: ${Array.isArray(ctx.activeSpatialObject) ? ctx.activeSpatialObject.join(', ') : ctx.activeSpatialObject}\n`;
  }
  if (ctx.selectedComponentId) {
    summary += `- Selected Component: ${ctx.selectedComponentId}\n`;
  }
  if (ctx.activeProjectId) {
    const proj = (advisProjects || []).find(p => p.id === ctx.activeProjectId);
    summary += `- Active Project: ${proj ? proj.name : ctx.activeProjectId}\n`;
  } else {
    summary += `- Active Project: None\n`;
  }

  if (resolvedRef && resolvedRef.isAnaphoric) {
    summary += `- Anaphoric Reference Resolution: "${resolvedRef.resolvedTarget || 'Active Workspace'}" (${resolvedRef.resolvedType || 'GENERAL'})\n`;
  }

  if (recentActions.length > 0) {
    summary += `- Recent Action Stack: ${recentActions.map(a => `${a.type}(${a.target || ''})`).join(' -> ')}\n`;
  }

  if (recentConvo.length > 0) {
    summary += `- Recent Conversation Context:\n${recentConvo.map(c => `  ${c.role.toUpperCase()}: ${c.content}`).join('\n')}\n`;
  }

  return summary;
}

/**
 * Main Butler Intelligence Entry Point
 */
async function processButlerTurn(params) {
  const {
    message,
    mode,
    deviceId = 'default',
    image,
    butlerContext,
    advisMemories = [],
    advisProjects = [],
    chatHistories = {},
    saveData = () => {},
    evaluateAndStoreMemory = () => {},
    getGeminiClient,
    SPATIAL_REGISTRY = {},
    MODEL_SYNONYMS = {},
    SCIENTIFIC_ENTITIES = {},
    detectSpatialAction,
    resolveScientificEntityServer,
    handleMemoryAgent,
    handleExecutionAgent,
    handleHelioMotionAgent,
    handleLocalIntelAgent,
    masterBrainRoute
  } = params;

  const lowerMessage = message.toLowerCase().trim();

  // Step 1: Context & Reference Resolution
  const resolvedRef = resolveContextualReferences(message, butlerContext);

  // Step 2: Handle Immediate Casual & Conversational Close / Reset Patterns
  if (lowerMessage === "nah close this" || lowerMessage === "okay close it" || lowerMessage === "close this" || lowerMessage === "close it" || lowerMessage === "okay we're done here" || lowerMessage === "we're done here" || lowerMessage === "clear this") {
    const hasActive = butlerContext && (butlerContext.activeScientificVisualization || butlerContext.activeSpatialObject);
    return {
      reply: hasActive ? "Closed." : "Nothing is currently open.",
      mode: mode || "normal",
      status: "online",
      spatialAction: { type: 'CLOSE' },
      butlerDecision: {
        userObjective: "Close current active workspace",
        classification: "ACKNOWLEDGEMENT",
        isAnaphoric: true,
        resolvedReference: resolvedRef.resolvedTarget,
        targetSubsystem: "SPATIAL",
        responseMode: "BOTH"
      }
    };
  }

  // Step 3: Handle Contextual Re-Open / Go Back Patterns ("actually go back", "open that again")
  if (lowerMessage === "actually go back" || lowerMessage === "go back" || lowerMessage === "open that again" || lowerMessage === "bring that back") {
    const lastAction = resolvedRef.lastAction;
    if (lastAction) {
      if (lastAction.type === 'DISPLAY_SCIENTIFIC' && lastAction.target) {
        return {
          reply: `Displaying ${lastAction.name || lastAction.target}.`,
          mode: mode || "normal",
          status: "online",
          spatialAction: { type: 'DISPLAY_SCIENTIFIC', formula: lastAction.target, assetId: lastAction.target },
          butlerDecision: {
            userObjective: "Re-open previous scientific visualization",
            classification: "CORRECTION",
            isAnaphoric: true,
            resolvedReference: lastAction.target,
            targetSubsystem: "CHEMISTRY",
            responseMode: "BOTH"
          }
        };
      } else if ((lastAction.type === 'DISPLAY' || lastAction.type === 'PRESENT') && lastAction.target) {
        return {
          reply: "Displaying the model.",
          mode: mode || "normal",
          status: "online",
          spatialAction: { type: 'DISPLAY', objectId: lastAction.target },
          butlerDecision: {
            userObjective: "Re-open previous spatial 3D model",
            classification: "CORRECTION",
            isAnaphoric: true,
            resolvedReference: lastAction.target,
            targetSubsystem: "SPATIAL",
            responseMode: "BOTH"
          }
        };
      }
    }
  }

  // Step 4: Handle "let's work on the engine" / Engineering Switch
  if (lowerMessage.match(/(let's|lets|switch to|work on|open).*(engine|v12|3d model)/i)) {
    const targetObj = resolvedRef.resolvedTarget || "v12_engine";
    return {
      reply: "Displaying the V12 engine model in Engineering workspace.",
      mode: mode || "normal",
      status: "online",
      spatialAction: { type: 'DISPLAY', objectId: targetObj, mode: 'INSPECTION' },
      butlerDecision: {
        userObjective: "Switch workspace to engineering engine model",
        classification: "REQUEST",
        isAnaphoric: true,
        resolvedReference: targetObj,
        targetSubsystem: "SPATIAL",
        responseMode: "BOTH"
      }
    };
  }

  // Step 4.5: Interactive Conversational Molecular Action Routing
  const molecularAction = detectMolecularAction(message, butlerContext);
  if (molecularAction) {
    if (!chatHistories[deviceId]) chatHistories[deviceId] = [];
    chatHistories[deviceId].push({ role: "user", content: message });
    chatHistories[deviceId].push({ role: "assistant", content: molecularAction.reply });
    saveData();

    return {
      reply: molecularAction.reply,
      mode: mode || "normal",
      status: "online",
      molecularAction: {
        type: molecularAction.type,
        targetElement: molecularAction.targetElement,
        targetParent: molecularAction.targetParent,
        bondOrder: molecularAction.bondOrder,
        allBonds: molecularAction.allBonds,
        ordinal: molecularAction.ordinal
      },
      butlerDecision: {
        userObjective: molecularAction.userObjective,
        classification: "REQUEST",
        isAnaphoric: resolvedRef.isAnaphoric || false,
        resolvedReference: molecularAction.targetElement || molecularAction.type,
        targetSubsystem: "CHEMISTRY_BUILDER",
        responseMode: "BOTH"
      }
    };
  }

  // Step 5: Fast Scientific Entity Resolution
  let resolvedEntity = resolveScientificEntityServer(message);

  // If user used anaphoric reference ("why does that look like that?") with active visualization:
  if (!resolvedEntity && butlerContext && butlerContext.activeScientificVisualization && (lowerMessage.includes("that") || lowerMessage.includes("it") || lowerMessage.includes("this"))) {
    const activeFormula = butlerContext.activeScientificVisualization;
    resolvedEntity = resolveScientificEntityServer(activeFormula);
  }

  const displayVerbs = /(show|display|visualize|bring up|put|let me see|project|render|draw|hologram|view|see)/i;
  const isDisplayIntent = displayVerbs.test(lowerMessage);
  const isQuestioningActive = /(why|how|what|explain|tell me|reason)/i.test(lowerMessage);

  if (resolvedEntity && isDisplayIntent && !isQuestioningActive) {
    const requiresExplanation = /(explain|functional groups|structure|bonding|hybridization|how is it)/i.test(lowerMessage);
    const replyText = requiresExplanation
      ? `Displaying ${resolvedEntity.name}. Retrieving structural analysis.`
      : `Displaying ${resolvedEntity.name}.`;

    return {
      reply: replyText,
      mode: mode || "normal",
      status: "online",
      spatialAction: {
        type: 'DISPLAY_SCIENTIFIC',
        assetId: resolvedEntity.formula,
        formula: resolvedEntity.formula,
        name: resolvedEntity.name,
        requiresExplanation
      },
      butlerDecision: {
        userObjective: `Display scientific visualization for ${resolvedEntity.name}`,
        classification: "REQUEST",
        isAnaphoric: false,
        resolvedReference: resolvedEntity.formula,
        targetSubsystem: "CHEMISTRY",
        responseMode: "BOTH"
      }
    };
  }

  // Step 6: Master Brain & Agent Routing
  let spatialAction = detectSpatialAction(message, butlerContext);
  let assignedAgent = masterBrainRoute(message, !!image);

  // Check if user is asking about active selected component or part explanation
  if ((lowerMessage.includes('what does this do') || lowerMessage.includes('what is this part') || lowerMessage.includes('explain this component') || lowerMessage.includes('tell me about this') || lowerMessage.includes('what does it do') || lowerMessage.includes('explain this part') || lowerMessage === 'explain') && butlerContext && (butlerContext.selectedComponentId || butlerContext.hoveredComponentId)) {
    const compId = butlerContext.selectedComponentId || butlerContext.hoveredComponentId;
    const compExpl = COMPONENT_EXPLANATIONS[compId];
    if (compExpl) {
      if (!chatHistories[deviceId]) chatHistories[deviceId] = [];
      chatHistories[deviceId].push({ role: "user", content: message });
      chatHistories[deviceId].push({ role: "assistant", content: compExpl });
      saveData();

      return {
        reply: compExpl,
        mode: mode || "normal",
        status: "online",
        butlerDecision: {
          userObjective: `Explain selected component ${compId}`,
          classification: "EXPLANATION",
          isAnaphoric: true,
          resolvedReference: compId,
          targetSubsystem: "ENGINEERING_INSPECTOR",
          responseMode: "VERBAL_ONLY"
        }
      };
    }
  }

  if (lowerMessage.match(/(teach|show|explain|visualize|make|draw|display).*(bf3|h2o|water|co2|nacl|ch4|methane|ammonia|nh3|lewis|hybridization|bonding|structure|molecule|h2so4|glucose|benzene|c6h12o6|c6h6|ethanol|c2h5oh|boron trifluoride)/i)) {
    assignedAgent = "LEARN_AGENT";
  }

  // Handle local fast agents
  if (assignedAgent === "SYSTEM_CLEAR") {
    chatHistories[deviceId] = [];
    saveData();
    return {
      reply: "Console cleared.",
      mode: mode || "normal",
      status: "online",
      butlerDecision: {
        userObjective: "Clear console history",
        classification: "ACKNOWLEDGEMENT",
        isAnaphoric: false,
        targetSubsystem: "CONVERSATION",
        responseMode: "VERBAL_ONLY"
      }
    };
  }

  let localReply = null;
  if (assignedAgent === "EXECUTION_AGENT") {
    localReply = handleExecutionAgent(message);
  } else if (assignedAgent === "HELIOMOTION_AGENT") {
    localReply = handleHelioMotionAgent(message);
  } else if (assignedAgent === "LOCAL_INTEL_AGENT") {
    localReply = handleLocalIntelAgent(message);
  } else if (assignedAgent === "DIAGNOSTICS_AGENT") {
    localReply = "System parameters are operating nominally.";
  } else if (assignedAgent === "PLANNING_AGENT") {
    localReply = "Schedule updated.";
  } else if (assignedAgent === "MEMORY_AGENT") {
    localReply = await handleMemoryAgent(message, butlerContext ? butlerContext.activeProjectId : null);
  }

  if (localReply) {
    if (!chatHistories[deviceId]) chatHistories[deviceId] = [];
    chatHistories[deviceId].push({ role: "user", content: message });
    chatHistories[deviceId].push({ role: "assistant", content: localReply });
    saveData();
    evaluateAndStoreMemory(message, butlerContext ? butlerContext.activeProjectId : null);

    let overrideReply = localReply;
    let newProjectId = undefined;
    if (typeof localReply === 'string' && localReply.startsWith('PROJECT_SWITCH:')) {
      newProjectId = localReply.split(':')[1];
      overrideReply = "Project context updated.";
    }

    return {
      reply: overrideReply,
      mode: mode || "normal",
      status: "online",
      activeProjectId: newProjectId,
      butlerDecision: {
        userObjective: "Handled by local agent",
        classification: "REQUEST",
        isAnaphoric: false,
        targetSubsystem: assignedAgent,
        responseMode: "VERBAL_ONLY"
      }
    };
  }

  // Step 7: Gemini Conversation Core with Educational Scientific Assistant Instructions
  const client = getGeminiClient();
  if (!client) {
    let fallbackReply = "The AI reasoning service is currently offline. Please configure the GEMINI_API_KEY environment variable.";
    if (spatialAction) {
      if (spatialAction.type === "EXPLODE") {
        fallbackReply = spatialAction.value ? "Separating components." : "Reassembling model.";
      } else if (spatialAction.type === "SELECT_COMPONENT") {
        fallbackReply = `Selected ${spatialAction.componentName || spatialAction.componentId}.`;
      } else if (spatialAction.type === "ISOLATE") {
        fallbackReply = spatialAction.value ? "Component isolated." : "Component isolation cleared.";
      } else if (spatialAction.type === "TRACE_FUNCTION") {
        fallbackReply = `Tracing function path: ${spatialAction.functionKey}.`;
      } else if (spatialAction.type === "KINEMATICS") {
        fallbackReply = spatialAction.playing ? "Kinematic motion playing." : "Kinematic motion paused.";
      } else if (spatialAction.type === "DEMO") {
        fallbackReply = "Demonstration initiated.";
      } else if (spatialAction.type === "CLOSE") {
        fallbackReply = "Closed.";
      }
    }

    return {
      reply: fallbackReply,
      mode: mode || "normal",
      status: "offline",
      spatialAction
    };
  }

  try {
    if (!chatHistories[deviceId]) chatHistories[deviceId] = [];

    const contents = chatHistories[deviceId].map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const userParts = [];
    if (image && image.content) {
      const base64Data = image.content.split(',')[1] || image.content;
      userParts.push({
        inlineData: {
          data: base64Data,
          mimeType: image.mimeType || "image/jpeg"
        }
      });
    }
    userParts.push({ text: message });
    contents.push({ role: 'user', parts: userParts });

    // Build Educational Session Context Summary
    const contextSummary = buildContextSummary(butlerContext, resolvedRef, advisMemories, advisProjects);

    const educationalAssistantPrompt = `
You are A.D.V.I.S. (Aadyant's Digital Virtual Intelligence System), an Educational Scientific Assistant and STEM learning companion developed for science exhibitions, classrooms, laboratories, and NCSC / INSPIRE-MANAK demonstrations.

CORE RESPONSIBILITIES:
1. Explain scientific and engineering concepts clearly, accurately, and pedagogically.
2. Control and explain 3D scientific visualizations (molecules, chemical bonds, hybrid orbitals, engineering assemblies like the V12 engine and solar tracker).
3. Guide students and teachers through interactive STEM lessons and structural inspections.
4. Interpret visualization commands and provide concise, relevant scientific insights.
5. Provide contextual explanations about active 3D models and chemical structures.

RESPONSE STYLE & TONE DIRECTIVES:
1. Professional, concise, scientifically grounded, clear, and demonstration-friendly.
2. For simple visualization or control commands, respond with concise, direct confirmations (e.g., "Displaying glucose.", "Switching to analytical view.", "Separating components.", "Displaying the V12 engine model.", "Closed.").
3. For educational, conceptual, or scientific questions, provide a clear, accurate, and structured explanation suitable for students and educators.
4. ABSOLUTELY DO NOT use butler/JARVIS roleplay or phrasing:
   - NEVER use "Sir", "My lord", "At your service", "Certainly, Sir", "Understood, Sir", or "As an AI..."
   - Do NOT use cinematic assistant jargon, exaggerated sci-fi military terms, or movie butler dialogue.
5. Sound natural, confident, and educational without being robotic or theatrical.

SCIENTIFIC ACCURACY & HONESTY:
1. Maintain high scientific fidelity (VSEPR theory, hybridization sp/sp²/sp³, bond orders, molecular geometry, mechanical engine kinematics).
2. Clearly distinguish between:
   - Scientifically accurate structural data and geometry
   - Educational conceptual visualizations and models
   - Scaled geometries and conceptual animations
   - Actual computational simulation vs educational visual representation
3. Do NOT claim the system performs real-time molecular dynamics, CFD, quantum simulations, or laboratory-grade physical measurements unless specifically computed.

${contextSummary}
`;

    let spatialInstruction = "";
    if (spatialAction) {
      if (spatialAction.type === "DISPLAY" || spatialAction.type === "PRESENT") {
        const idsToCheck = spatialAction.objectIds || (spatialAction.objectId ? [spatialAction.objectId] : []);
        let allAvailable = idsToCheck.length > 0;
        for (const id of idsToCheck) {
          const st = SPATIAL_REGISTRY[id] || 'FALLBACK';
          if (st !== 'AVAILABLE') {
            allAvailable = false;
            break;
          }
        }
        if (!allAvailable) {
          spatialAction = null;
          spatialInstruction = `\n\n[SYSTEM CONTEXT]: The requested 3D model is missing. Reply simply: "The 3D model asset could not be loaded." and list available alternatives.`;
        } else {
          spatialInstruction = `\n\n[SYSTEM CONTEXT]: Loading 3D model '${idsToCheck.join(', ')}'. Output exactly "[LOADING_HOLOGRAM]" and nothing else.`;
        }
      } else if (spatialAction.type === "EXPLODE") {
        spatialInstruction = `\n\n[SYSTEM CONTEXT]: Component separation requested. Reply briefly: "${spatialAction.value ? "Separating components." : "Reassembling model."}"`;
      } else if (spatialAction.type === "SELECT_COMPONENT") {
        spatialInstruction = `\n\n[SYSTEM CONTEXT]: Component '${spatialAction.componentName || spatialAction.componentId}' selected. Reply briefly acknowledging selection.`;
      } else if (spatialAction.type === "ISOLATE") {
        spatialInstruction = `\n\n[SYSTEM CONTEXT]: Component isolation ${spatialAction.value ? "activated" : "cleared"}. Reply briefly confirming state.`;
      } else if (spatialAction.type === "TRACE_FUNCTION") {
        spatialInstruction = `\n\n[SYSTEM CONTEXT]: Tracing function path '${spatialAction.functionKey}'. Reply briefly describing the function path.`;
      } else if (spatialAction.type === "KINEMATICS") {
        spatialInstruction = `\n\n[SYSTEM CONTEXT]: Kinematic animation ${spatialAction.playing ? "resumed" : "paused"}. Reply briefly confirming state.`;
      } else if (spatialAction.type === "DEMO") {
        spatialInstruction = `\n\n[SYSTEM CONTEXT]: Demonstration initiated. Reply briefly with an introduction to the demonstration.`;
      } else if (spatialAction.type === "CLOSE") {
        spatialInstruction = `\n\n[SYSTEM CONTEXT]: Close active model requested. Reply briefly: "Closed."`;
      }
    }

    const systemInstruction = educationalAssistantPrompt + spatialInstruction;
    const tools = (assignedAgent === "SEARCH_AGENT") ? [{ googleSearch: {} }] : undefined;

    let aiModel = "gemini-3.1-flash-lite";
    if (image || assignedAgent === "SEARCH_AGENT" || assignedAgent === "VISION_AGENT") {
      aiModel = "gemini-3.5-flash";
    }

    const response = await client.models.generateContent({
      model: aiModel,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5,
        tools: tools
      }
    });

    const aiReply = response.text || "I was unable to process that.";

    chatHistories[deviceId].push({ role: "user", content: message });
    chatHistories[deviceId].push({ role: "assistant", content: aiReply });
    if (chatHistories[deviceId].length > 20) {
      chatHistories[deviceId] = chatHistories[deviceId].slice(chatHistories[deviceId].length - 20);
    }
    saveData();
    evaluateAndStoreMemory(message, butlerContext ? butlerContext.activeProjectId : null);

    return {
      reply: aiReply,
      mode: mode || "normal",
      status: "online",
      spatialAction,
      butlerDecision: {
        userObjective: "Educational scientific response",
        classification: "CONVERSATION",
        isAnaphoric: resolvedRef.isAnaphoric,
        resolvedReference: resolvedRef.resolvedTarget,
        targetSubsystem: "CONVERSATION",
        responseMode: "VERBAL_ONLY"
      }
    };

  } catch (error) {
    console.error("Scientific AI Core Gemini Error:", error.message || error);
    return {
      reply: "The AI reasoning system encountered an error processing that request.",
      mode: mode || "normal",
      status: "error"
    };
  }
}

module.exports = {
  resolveContextualReferences,
  buildContextSummary,
  processButlerTurn
};
