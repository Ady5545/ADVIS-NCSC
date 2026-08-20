export const AssetCategory = {
  MECHANICAL: 'MECHANICAL',
  BIOLOGICAL: 'BIOLOGICAL',
  ELECTRONIC: 'ELECTRONIC',
  ROBOTIC: 'ROBOTIC',
  AEROSPACE: 'AEROSPACE',
  ARCHITECTURAL: 'ARCHITECTURAL'
} as const;

export type AssetCategoryType = typeof AssetCategory[keyof typeof AssetCategory];

export const DetailLevel = {
  L1_BASIC: 1,
  L2_ENGINEERING: 2,
  L3_DIGITAL_TWIN: 3,
  L4_SIMULATION: 4
} as const;

export type DetailLevelType = typeof DetailLevel[keyof typeof DetailLevel];

export interface AssetIntelligenceMetadata {
  category: AssetCategoryType;
  targetDetailLevel: DetailLevelType;
  functionalTraits: string[];
  generationRules: Record<string, string>;
}
