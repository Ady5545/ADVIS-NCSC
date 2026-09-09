import { ScientificSystemModel, ScientificDomain } from './ScientificSchema';
import { FourStrokeEngineModel } from './FourStrokeEngineModel';
import { HumanAnatomyModel } from './HumanAnatomyModel';

class ScientificModelRegistryClass {
  private models: Map<string, ScientificSystemModel> = new Map();
  private aliases: Map<string, string> = new Map();

  constructor() {
    this.registerModel(FourStrokeEngineModel);
    this.registerAlias('v8_engine_scientific', FourStrokeEngineModel.id);
    this.registerAlias('four_stroke_engine', FourStrokeEngineModel.id);

    this.registerModel(HumanAnatomyModel);
    this.registerAlias('human_anatomy_scientific', HumanAnatomyModel.id);
    this.registerAlias('cardiovascular_atlas', HumanAnatomyModel.id);
  }

  public registerModel(model: ScientificSystemModel) {
    this.models.set(model.id, model);
  }

  public registerAlias(alias: string, targetModelId: string) {
    this.aliases.set(alias.toLowerCase().trim(), targetModelId);
  }

  public getModel(id: string): ScientificSystemModel | undefined {
    if (!id) return undefined;
    
    // Exact match on ID
    if (this.models.has(id)) return this.models.get(id);

    // Exact alias match
    const normalized = id.toLowerCase().trim();
    const targetId = this.aliases.get(normalized);
    if (targetId && this.models.has(targetId)) {
      return this.models.get(targetId);
    }

    return undefined;
  }

  public getAllModels(): ScientificSystemModel[] {
    return Array.from(this.models.values());
  }

  public getModelsByDomain(domain: ScientificDomain): ScientificSystemModel[] {
    return this.getAllModels().filter(m => m.domain === domain);
  }

  public searchComponents(query: string): Array<{ model: ScientificSystemModel; componentId: string; name: string; scientificName: string }> {
    const results: Array<{ model: ScientificSystemModel; componentId: string; name: string; scientificName: string }> = [];
    const q = query.toLowerCase().trim();
    if (!q) return results;

    for (const model of this.models.values()) {
      for (const [cId, comp] of Object.entries(model.components)) {
        if (
          comp.id.toLowerCase().includes(q) ||
          comp.name.toLowerCase().includes(q) ||
          comp.scientificName.toLowerCase().includes(q) ||
          comp.category.toLowerCase().includes(q) ||
          comp.education.function.toLowerCase().includes(q)
        ) {
          results.push({
            model,
            componentId: cId,
            name: comp.name,
            scientificName: comp.scientificName
          });
        }
      }
    }
    return results;
  }
}

export const ScientificModelRegistry = new ScientificModelRegistryClass();
