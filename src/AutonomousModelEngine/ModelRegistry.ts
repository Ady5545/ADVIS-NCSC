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
  private static lazyBuilders: Map<string, () => Record<string, THREE.BufferGeometry>> = new Map();
  private static lazyBuilt: Set<string> = new Set();

  /**
   * Registers a geometry builder for a canonical model id without running it yet. The build
   * runs once, on first access from getGeometry/getGeometries/ensureBuilt — so heavy precision
   * models (dense organic meshes, spline tubes) cost nothing at app startup and only pay their
   * build time the first time a user actually opens that model.
   */
  public static registerLazyGeometries(modelId: string, builder: () => Record<string, THREE.BufferGeometry>): void {
    this.lazyBuilders.set(modelId, builder);
  }

  private static ensureBuilt(modelId: string): void {
    if (this.lazyBuilt.has(modelId)) return;
    const builder = this.lazyBuilders.get(modelId);
    if (!builder) return;
    this.lazyBuilt.add(modelId);
    this.registerGeometries(modelId, builder());
  }

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
   * Registers precision-built BufferGeometries for a canonical SPATIAL_LIBRARY id, independent
   * of the AI-construction pipeline, so the render path finds them the instant an object is
   * selected — whether that selection came from the assistant, the sidebar, or a comparator.
   * Safe to call multiple times (e.g. module hot-reload); later calls simply overwrite.
   */
  public static registerGeometries(modelId: string, geometries: Record<string, THREE.BufferGeometry>): void {
    for (const [compId, geom] of Object.entries(geometries)) {
      this.geometries.set(`${modelId}:${compId}`, geom);
      this.geometries.set(compId, geom);
    }
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
    this.ensureBuilt(modelId);
    return this.geometries.get(`${modelId}:${compId}`) || this.geometries.get(compId);
  }

  /**
   * Retrieves all cached BufferGeometries for a model.
   */
  public static getGeometries(modelId: string): Record<string, THREE.BufferGeometry> {
    this.ensureBuilt(modelId);
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
