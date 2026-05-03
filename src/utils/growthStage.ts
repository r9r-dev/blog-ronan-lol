export type GrowthStage = 'seedling' | 'budding' | 'evergreen';

const GLYPH: Record<GrowthStage, string> = {
  seedling: '🌱',
  budding: '🌿',
  evergreen: '🌲',
};

const LABEL: Record<GrowthStage, string> = {
  seedling: 'Seedling',
  budding: 'Budding',
  evergreen: 'Evergreen',
};

export function stageGlyph(stage: GrowthStage | string): string {
  return GLYPH[stage as GrowthStage] ?? GLYPH.seedling;
}

export function stageLabel(stage: GrowthStage): string {
  return LABEL[stage] ?? 'Seedling';
}

export function stageClass(stage: GrowthStage): string {
  return `stage-${stage}`;
}
