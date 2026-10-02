export type CadSourceFormat = 'STEP' | 'STP' | 'BREP' | 'IGES' | 'IGS';

export interface CadMeshData {
  positions: Float32Array;
  normals?: Float32Array;
  indices: Uint32Array | Uint16Array;
}

export interface CadModelData {
  name: string;
  format: CadSourceFormat;
  mesh: CadMeshData;
  volume: number | null;
  surfaceArea: number | null;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
    size: [number, number, number];
  } | null;
}

export interface CadImportProgress {
  phase: 'LOADING_KERNEL' | 'READING_FILE' | 'TESSELLATING' | 'COMPLETE';
  progress: number;
  detail: string;
}

export interface ParametricPlanetaryState {
  sunTeeth: number;
  planetTeeth: number;
  moduleMm: number;
  inputRpm: number;
  inputTorqueNm: number;
}
