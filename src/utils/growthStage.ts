export type GrowthStage = 'seedling' | 'budding' | 'evergreen';

const LABEL: Record<GrowthStage, string> = {
  seedling: 'Graine',
  budding: 'Bourgeon',
  evergreen: 'Pérenne',
};

export function stageLabel(stage: GrowthStage): string {
  return LABEL[stage] ?? 'Graine';
}

export function stageClass(stage: GrowthStage): string {
  return `stage-${stage}`;
}
