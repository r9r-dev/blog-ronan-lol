import { describe, expect, it } from 'vitest';
import { stageLabel, stageClass } from './growthStage';

describe('stageLabel', () => {
  it('returns capitalized french label', () => {
    expect(stageLabel('seedling')).toBe('Graine');
    expect(stageLabel('budding')).toBe('Bourgeon');
    expect(stageLabel('evergreen')).toBe('Pérenne');
  });
});

describe('stageClass', () => {
  it('returns BEM-style class name', () => {
    expect(stageClass('seedling')).toBe('stage-seedling');
    expect(stageClass('budding')).toBe('stage-budding');
    expect(stageClass('evergreen')).toBe('stage-evergreen');
  });
});
