import type { CadImportProgress, CadModelData, CadSourceFormat } from './CadTypes';

type OcctKernel = {
  importStep(data: Uint8Array): unknown;
  importBrep(data: Uint8Array): unknown;
  tessellate(shape: unknown, linearDeflection?: number, angularDeflection?: number): {
    positions: Float32Array;
    normals?: Float32Array;
    indices: Uint32Array | Uint16Array;
  };
  getVolume(shape: unknown): number;
  getSurfaceArea(shape: unknown): number;
  getBoundingBox(shape: unknown): {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  dispose?(): void;
};

let kernelPromise: Promise<OcctKernel> | null = null;

async function getKernel(onProgress?: (progress: CadImportProgress) => void): Promise<OcctKernel> {
  if (!kernelPromise) {
    onProgress?.({ phase: 'LOADING_KERNEL', progress: 0.15, detail: 'Loading OpenCascade WebAssembly kernel…' });
    kernelPromise = import('occt-wasm').then(async ({ OcctKernel }) => {
      const kernel = await OcctKernel.init() as OcctKernel;
      onProgress?.({ phase: 'LOADING_KERNEL', progress: 0.35, detail: 'CAD kernel ready.' });
      return kernel;
    });
  }
  return kernelPromise;
}

function formatFromName(name: string): CadSourceFormat {
  const extension = name.toLowerCase().split('.').pop() || '';
  if (extension === 'step') return 'STEP';
  if (extension === 'stp') return 'STP';
  if (extension === 'brep' || extension === 'brp') return 'BREP';
  if (extension === 'iges' || extension === 'igs') return extension.toUpperCase() as CadSourceFormat;
  throw new Error('Unsupported CAD file. Use STEP, STP, or BREP.');
}

export async function importCadFile(
  file: File,
  onProgress?: (progress: CadImportProgress) => void,
): Promise<CadModelData> {
  const format = formatFromName(file.name);
  const kernel = await getKernel(onProgress);

  onProgress?.({ phase: 'READING_FILE', progress: 0.48, detail: `Reading ${format} geometry…` });
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (format === 'IGES' || format === 'IGS') {
    throw new Error('IGES import is intentionally disabled in the current OCCT WASM kernel build. Export the source as STEP for CAD interchange.');
  }

  const shape =
    format === 'BREP'
      ? kernel.importBrep(bytes)
      : kernel.importStep(bytes);

  if (!shape) {
    throw new Error('The CAD kernel did not produce a valid shape from this file.');
  }

  onProgress?.({ phase: 'TESSELLATING', progress: 0.68, detail: 'Generating high-fidelity display mesh from exact CAD topology…' });
  const tessellated = kernel.tessellate(shape, 0.05, 0.30);
  const bbox = kernel.getBoundingBox(shape);

  const data: CadModelData = {
    name: file.name,
    format,
    mesh: {
      positions: tessellated.positions,
      normals: tessellated.normals,
      indices: tessellated.indices,
    },
    volume: safeMetric(() => kernel.getVolume(shape)),
    surfaceArea: safeMetric(() => kernel.getSurfaceArea(shape)),
    bounds: bbox ? {
      min: [bbox.min.x, bbox.min.y, bbox.min.z],
      max: [bbox.max.x, bbox.max.y, bbox.max.z],
      size: [
        bbox.max.x - bbox.min.x,
        bbox.max.y - bbox.min.y,
        bbox.max.z - bbox.min.z
      ]
    } : null
  };

  onProgress?.({ phase: 'COMPLETE', progress: 1, detail: 'CAD geometry imported and tessellated for display.' });
  return data;
}

function safeMetric(fn: () => number): number | null {
  try {
    const value = fn();
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
