export type GrowthStage = 'seedling' | 'budding' | 'evergreen';

const GLYPH: Record<GrowthStage, string> = {
  seedling: '🌱',
  budding: '🌿',
  evergreen: '🌲',
};

const LABEL: Record<GrowthStage, string> = {
  seedling: 'Graine',
  budding: 'Bourgeon',
  evergreen: 'Pérenne',
};

export function stageGlyph(stage: GrowthStage | string): string {
  return GLYPH[stage as GrowthStage] ?? GLYPH.seedling;
}

export function stageLabel(stage: GrowthStage): string {
  return LABEL[stage] ?? 'Graine';
}

export function stageClass(stage: GrowthStage): string {
  return `stage-${stage}`;
}
