import { 
  DigitalTwin, 
  DigitalTwinComponent, 
  Connection, 
  ConnectionType, 
  DiagnosticHypothesis, 
  DiagnosticStatus, 
  DiagnosticConfidence, 
  SafetyState 
} from './DigitalTwin';
import { getFailureProfilesForComponent } from './FailureModes';

export interface TracePathResult {
  connectionType: ConnectionType | 'ALL';
  startComponentId: string;
  visitedComponentIds: string[];
  connectionsTraversed: Connection[];
  subsystemNames: string[];
}

export interface DependencyTree {
  componentId: string;
  componentName: string;
  upstreamProviders: { componentId: string; componentName: string; type: ConnectionType }[];
  downstreamDependents: { componentId: string; componentName: string; type: ConnectionType }[];
  associatedFunctions: string[];
}

/**
 * Traces functional paths across the Digital Twin connection graph
 */
export function traceConnectionPath(
  twin: DigitalTwin,
  startComponentId: string,
  targetType?: ConnectionType
): TracePathResult {
  const visited = new Set<string>([startComponentId]);
  const traversedConnections: Connection[] = [];
  const queue = [startComponentId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const matchingConns = twin.connections.filter(c => {
      const isConnected = c.sourceComponentId === currentId || (c.bidirectional && c.targetComponentId === currentId);
      if (!isConnected) return false;
      if (targetType && c.type !== targetType) return false;
      return true;
    });

    for (const conn of matchingConns) {
      const nextId = conn.sourceComponentId === currentId ? conn.targetComponentId : conn.sourceComponentId;
      if (!visited.has(nextId)) {
        visited.add(nextId);
        traversedConnections.push(conn);
        queue.push(nextId);
      }
    }
  }

  const visitedComponents = Array.from(visited);
  const subsystemNames = Array.from(
    new Set(
      visitedComponents
        .map(id => twin.components.find(c => c.id === id)?.category)
        .filter((cat): cat is string => Boolean(cat))
    )
  );

  return {
    connectionType: targetType || 'ALL',
    startComponentId,
    visitedComponentIds: visitedComponents,
    connectionsTraversed: traversedConnections,
    subsystemNames
  };
}

/**
 * Evaluates upstream dependencies (providers) and downstream dependents for a component
 */
export function getComponentDependencies(twin: DigitalTwin, componentId: string): DependencyTree {
  const comp = twin.components.find(c => c.id === componentId);
  const name = comp?.name || componentId;

  const upstream: DependencyTree['upstreamProviders'] = [];
  const downstream: DependencyTree['downstreamDependents'] = [];

  for (const conn of twin.connections) {
    if (conn.targetComponentId === componentId) {
      const srcComp = twin.components.find(c => c.id === conn.sourceComponentId);
      upstream.push({
        componentId: conn.sourceComponentId,
        componentName: srcComp?.name || conn.sourceComponentId,
        type: conn.type
      });
    }
    if (conn.sourceComponentId === componentId) {
      const tgtComp = twin.components.find(c => c.id === conn.targetComponentId);
      downstream.push({
        componentId: conn.targetComponentId,
        componentName: tgtComp?.name || conn.targetComponentId,
        type: conn.type
      });
    }
  }

  const associatedFunctions = twin.functions
    .filter(f => f.inputComponents?.includes(componentId) || f.outputComponents?.includes(componentId))
    .map(f => f.name);

  return {
    componentId,
    componentName: name,
    upstreamProviders: upstream,
    downstreamDependents: downstream,
    associatedFunctions
  };
}

/**
 * Deterministically evaluates diagnostic hypotheses for an active twin and target component
 */
export function evaluateDiagnosticHypotheses(
  twin: DigitalTwin,
  selectedComponentId?: string | null,
  reportedSymptom?: string | null,
  observedEvidence: string[] = []
): DiagnosticHypothesis[] {
  const hypotheses: DiagnosticHypothesis[] = [];

  // 1. Identify primary candidates
  const targetComponents: DigitalTwinComponent[] = selectedComponentId
    ? twin.components.filter(c => c.id === selectedComponentId)
    : twin.components;

  for (const comp of targetComponents) {
    const failureProfiles = getFailureProfilesForComponent(comp.id, comp.name, String(twin.domain));
    const dependencies = getComponentDependencies(twin, comp.id);

    for (const profile of failureProfiles) {
      // Determine evidence and confidence
      const evidenceList: string[] = [...observedEvidence];
      let confidence: DiagnosticConfidence = 'INSUFFICIENT_DATA';
      let status: DiagnosticStatus = 'SUSPECTED';

      // Check if diagnostic record exists for this component
      if (comp.diagnosticState && comp.diagnosticState.status === 'FAULT') {
        confidence = 'CONFIRMED';
        status = 'FAULT';
        evidenceList.push(`Direct Diagnostic Record: ${comp.diagnosticState.explanation || 'Anomaly reported'}`);
      } else if (reportedSymptom) {
        const matchesSymptom = profile.symptoms.some(s => 
          s.toLowerCase().includes(reportedSymptom.toLowerCase()) || 
          reportedSymptom.toLowerCase().includes(s.toLowerCase())
        );
        if (matchesSymptom) {
          confidence = 'LIKELY';
          evidenceList.push(`Reported symptom correlates with profile '${profile.name}'`);
        } else {
          confidence = 'POSSIBLE';
          evidenceList.push(`Topological failure mode in active subsystem`);
        }
      } else if (selectedComponentId === comp.id) {
        confidence = 'POSSIBLE';
        evidenceList.push(`Component selected for targeted inspection; topology analyzed`);
      } else {
        confidence = 'INSUFFICIENT_DATA';
        evidenceList.push(`Baseline failure mode hypothesis (no live sensor telemetry connected)`);
      }

      // Collect affected downstream subsystems
      const affectedSubsystems = Array.from(
        new Set([
          comp.category || 'Primary Subsystem',
          ...dependencies.downstreamDependents.map(d => d.componentName)
        ])
      );

      const recommendedChecks = profile.diagnosticTests.map(
        t => `${t.testName} via ${t.instrument}: Expected '${t.expectedNormal}'`
      );

      const requiredSensors = profile.diagnosticTests.map(t => t.instrument);

      hypotheses.push({
        id: `hyp_${comp.id}_${profile.id}`,
        componentId: comp.id,
        componentName: comp.name,
        failureMode: profile.name,
        status,
        confidence,
        evidence: evidenceList,
        possibleCauses: profile.possibleCauses,
        affectedSubsystems,
        recommendedChecks,
        requiredSensors,
        safetyState: profile.safetyState,
        provenance: comp.diagnosticState?.source || 'DERIVED',
        distinguishingMeasurement: profile.distinguishingMeasurement,
        repairProcedure: profile.repairProcedure
      });
    }
  }

  return hypotheses;
}

/**
 * Explains the scientific reasoning behind a hypothesis, distinguishing CAD structure from required physical test
 */
export function explainHypothesisReasoning(hypothesis: DiagnosticHypothesis): {
  cadInference: string;
  realWorldRequirement: string;
  safetySummary: string;
} {
  return {
    cadInference: `Digital Twin structural analysis confirms component '${hypothesis.componentName}' connects to [${hypothesis.affectedSubsystems.join(', ')}] with failure mode '${hypothesis.failureMode}'.`,
    realWorldRequirement: `Confirmation requires physical measurement: ${hypothesis.distinguishingMeasurement || 'Direct electrical/thermal sensor probing'}. A static 3D model cannot verify this fault alone.`,
    safetySummary: hypothesis.safetyState.hazardous
      ? `SAFETY HAZARD: ${hypothesis.safetyState.warning} Requires Lockout/Tagout (${hypothesis.safetyState.isolationRequired ? 'REQUIRED' : 'RECOMMENDED'}). Required PPE: ${(hypothesis.safetyState.ppeRequired || ['Safety Glasses']).join(', ')}.`
      : `LOW HAZARD: System operating at safe low energy levels. Follow standard electronic assembly handling.`
  };
}
