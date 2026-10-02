import type {
  CadImportOptions,
  CadImportProgress,
  CadModelData,
  CadSourceFormat,
} from './CadTypes';

type OcctKernel = import('occt-wasm').OcctKernel;

let kernelPromise: Promise<OcctKernel> | null = null;

async function getKernel(
  onProgress?: (progress: CadImportProgress) => void,
): Promise<OcctKernel> {
  if (!kernelPromise) {
    onProgress?.({
      phase: 'LOADING_KERNEL',
      progress: 0.15,
      detail: 'Loading OpenCascade WebAssembly kernel…',
    });

    kernelPromise = import('occt-wasm').then(async ({ OcctKernel }) => {
      const kernel = await OcctKernel.init();
      onProgress?.({
        phase: 'LOADING_KERNEL',
        progress: 0.35,
        detail: 'CAD kernel ready.',
      });
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
  if (extension === 'iges') return 'IGES';
  if (extension === 'igs') return 'IGS';

  throw new Error('Unsupported CAD file. Use STEP, STP, or BREP.');
}

export async function importCadFile(
  file: File,
  onProgress?: (progress: CadImportProgress) => void,
  options: CadImportOptions = {},
): Promise<CadModelData> {
  const format = formatFromName(file.name);

  if (format === 'IGES' || format === 'IGS') {
    throw new Error(
      'IGES import is intentionally disabled in the current OCCT WASM TypeScript facade. Export the source as STEP for CAD interchange.',
    );
  }

  const kernel = await getKernel(onProgress);

  onProgress?.({
    phase: 'READING_FILE',
    progress: 0.48,
    detail: `Reading ${format} geometry…`,
  });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const textData = new TextDecoder().decode(bytes);

  const shape =
    format === 'BREP'
      ? kernel.fromBREP(textData)
      : kernel.importStep(textData);

  if (!shape) {
    throw new Error('The CAD kernel did not produce a valid shape from this file.');
  }

  onProgress?.({
    phase: 'TESSELLATING',
    progress: 0.68,
    detail: 'Generating a high-fidelity display mesh from exact CAD topology…',
  });

  const tessellated = kernel.tessellate(shape, {
    linearDeflection: options.linearDeflection ?? 0.05,
    angularDeflection: options.angularDeflection ?? 0.30,
    relative: false,
  });

  const bbox = kernel.getBoundingBox(shape, false);

  const data: CadModelData = {
    name: file.name,
    format,
    mesh: {
      positions: tessellated.positions,
      normals: tessellated.normals,
      indices: tessellated.indices,
      vertexCount: tessellated.vertexCount,
      triangleCount: tessellated.triangleCount,
    },
    volume: safeMetric(() => kernel.getVolume(shape)),
    surfaceArea: safeMetric(() => kernel.getSurfaceArea(shape)),
    bounds: bbox
      ? {
          min: [bbox.xmin, bbox.ymin, bbox.zmin],
          max: [bbox.xmax, bbox.ymax, bbox.zmax],
          size: [
            bbox.xmax - bbox.xmin,
            bbox.ymax - bbox.ymin,
            bbox.zmax - bbox.zmin,
          ],
        }
      : null,
  };

  onProgress?.({
    phase: 'COMPLETE',
    progress: 1,
    detail: 'CAD geometry imported and tessellated for display.',
  });

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
