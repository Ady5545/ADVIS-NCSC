// src/AutonomousModelEngine/ModelProvenance.ts
// Rigorous Data & Engineering Provenance System for Autonomous Models

import { DiagnosticConfidence } from '../DigitalTwin';
import { ModelProvenanceSource, ProvenanceValue } from './ModelTypes';

export class ModelProvenanceEngine {
  /**
   * Constructs a strictly classified provenance field.
   */
  public static createProvenanceValue<T>(
    value: T,
    source: ModelProvenanceSource,
    confidence: DiagnosticConfidence = 'CONFIRMED',
    options?: {
      notes?: string;
      equation?: string;
      referenceStandard?: string;
    }
  ): ProvenanceValue<T> {
    return {
      value,
      source,
      confidence,
      notes: options?.notes,
      equation: options?.equation,
      referenceStandard: options?.referenceStandard
    };
  }

  /**
   * Categorizes a property's provenance based on input context
   */
  public static resolveSource(
    isUserSpecified: boolean,
    isLiteratureStandard: boolean,
    isCalculated: boolean
  ): ModelProvenanceSource {
    if (isUserSpecified) return 'USER';
    if (isLiteratureStandard) return 'LIT';
    if (isCalculated) return 'DERIVED';
    return 'ESTIMATED';
  }

  /**
   * Generates a transparent, non-fabricated disclosure summary for the operator.
   */
  public static formatProvenanceDisclosure(
    parameters: Record<string, ProvenanceValue<any>>,
    assumptions: string[],
    limitations: string[]
  ): string {
    const lines: string[] = [];

    const userParams = Object.entries(parameters).filter(([_, p]) => p.source === 'USER');
    const derivedParams = Object.entries(parameters).filter(([_, p]) => p.source === 'DERIVED');
    const litParams = Object.entries(parameters).filter(([_, p]) => p.source === 'LIT' || p.source === 'DATA');
    const estimatedParams = Object.entries(parameters).filter(([_, p]) => p.source === 'ESTIMATED');

    if (userParams.length > 0) {
      lines.push(`• Explicit User Inputs: ${userParams.map(([k, v]) => `${k}=${v.value}`).join(', ')}`);
    }
    if (derivedParams.length > 0) {
      lines.push(`• Mathematically Derived: ${derivedParams.map(([k, v]) => `${k}=${v.value}${v.equation ? ` (${v.equation})` : ''}`).join(', ')}`);
    }
    if (litParams.length > 0) {
      lines.push(`• Standard Reference Data: ${litParams.map(([k, v]) => `${k}=${v.value}${v.referenceStandard ? ` [${v.referenceStandard}]` : ''}`).join(', ')}`);
    }
    if (estimatedParams.length > 0) {
      lines.push(`• Illustrative Assumptions: ${estimatedParams.map(([k, v]) => `${k}=${v.value}`).join(', ')}`);
    }

    if (assumptions.length > 0) {
      lines.push(`\nEngineering Assumptions:\n${assumptions.map(a => `  - ${a}`).join('\n')}`);
    }

    if (limitations.length > 0) {
      lines.push(`\nKnown Scope Limitations:\n${limitations.map(l => `  - ${l}`).join('\n')}`);
    }

    return lines.join('\n');
  }
}
