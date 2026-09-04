// src/AutonomousModelEngine/ModelRegistry.ts
// In-Memory Model & Geometry Registry for Autonomous Digital Twins

import * as THREE from 'three';
import { DigitalTwin } from '../DigitalTwin';
import { ObjectMetadata, SPATIAL_LIBRARY } from '../SpatialLibrary';
import { AutonomousModelRecord } from './ModelTypes';

export class ModelRegistry {
  private static records: Map<string, AutonomousModelRecord> = new Map();
  private static geometries: Map<string, THREE.BufferGeometry> = new Map();
  private static lastModelId: string | null = null;

  /**
   * Registers a newly constructed autonomous model record.
   */
  public static registerModel(
    record: AutonomousModelRecord,
    geometries?: Record<string, THREE.BufferGeometry>
  ): void {
    this.records.set(record.id, record);
    this.lastModelId = record.id;

    // Cache geometries
    if (geometries) {
      for (const [compId, geom] of Object.entries(geometries)) {
        this.geometries.set(`${record.id}:${compId}`, geom);
        this.geometries.set(compId, geom); // fallback key
      }
    }

    // Register into SPATIAL_LIBRARY in-memory so spatial views, inspectors, and HUD can resolve it seamlessly
    SPATIAL_LIBRARY[record.id] = record.spatialObject;
  }

  /**
   * Retrieves a model record by ID.
   */
  public static getModel(id: string): AutonomousModelRecord | undefined {
    return this.records.get(id);
  }

  /**
   * Retrieves the Digital Twin corresponding to an ID.
   */
  public static getGeneratedTwin(id: string): DigitalTwin | undefined {
    return this.records.get(id)?.twin;
  }

  /**
   * Retrieves the spatial object metadata for 3D rendering.
   */
  public static getSpatialObject(id: string): ObjectMetadata | undefined {
    return this.records.get(id)?.spatialObject || SPATIAL_LIBRARY[id];
  }

  /**
   * Retrieves a cached BufferGeometry for a component.
   */
  public static getGeometry(modelId: string, compId: string): THREE.BufferGeometry | undefined {
    return this.geometries.get(`${modelId}:${compId}`) || this.geometries.get(compId);
  }

  /**
   * Retrieves all cached BufferGeometries for a model.
   */
  public static getGeometries(modelId: string): Record<string, THREE.BufferGeometry> {
    const rec = this.records.get(modelId);
    const result: Record<string, THREE.BufferGeometry> = {};
    if (!rec) return result;

    for (const comp of rec.spatialObject.components) {
      const g = this.geometries.get(`${modelId}:${comp.id}`) || this.geometries.get(comp.id);
      if (g) {
        result[comp.id] = g;
      }
    }
    return result;
  }

  /**
   * Gets the most recently generated or inspected model ID.
   */
  public static getLastModelId(): string | null {
    return this.lastModelId;
  }

  /**
   * Gets the most recently generated model record.
   */
  public static getLastModel(): AutonomousModelRecord | undefined {
    return this.lastModelId ? this.records.get(this.lastModelId) : undefined;
  }

  /**
   * Lists all session-generated and custom models.
   */
  public static listModels(): AutonomousModelRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Marks a model as permanently saved.
   */
  public static saveModel(id: string): boolean {
    const rec = this.records.get(id);
    if (rec) {
      rec.category = 'VERIFIED_CUSTOM';
      rec.updatedAt = Date.now();
      return true;
    }
    return false;
  }
}
