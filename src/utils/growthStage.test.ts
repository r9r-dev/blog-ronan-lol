import { describe, expect, it } from 'vitest';
import { stageGlyph, stageLabel, stageClass } from './growthStage';

describe('stageGlyph', () => {
  it('returns plant emoji per stage', () => {
    expect(stageGlyph('seedling')).toBe('🌱');
    expect(stageGlyph('budding')).toBe('🌿');
    expect(stageGlyph('evergreen')).toBe('🌲');
  });

  it('falls back to seedling glyph for unknown', () => {
    // @ts-expect-error testing fallback
    expect(stageGlyph('unknown')).toBe('🌱');
  });
});

describe('stageLabel', () => {
  it('returns capitalized english label', () => {
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
