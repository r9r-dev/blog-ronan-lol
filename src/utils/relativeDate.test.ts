import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { formatPlantedTended, formatRelativeDate, formatAbsoluteDate, readTimeMinutes } from './relativeDate';

describe('formatPlantedTended', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-04T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns just planted when no lastTended', () => {
    const planted = new Date('2026-04-04');
    const result = formatPlantedTended(planted, undefined);
    expect(result).toMatch(/^Planté /);
    expect(result).not.toMatch(/arrosé/);
  });

  it('joins planted and tended when both provided', () => {
    const planted = new Date('2025-11-01');
    const tended = new Date('2026-05-01');
    const result = formatPlantedTended(planted, tended);
    expect(result).toMatch(/^Planté /);
    expect(result).toMatch(/ · arrosé /);
  });

  it('skips tended when same as planted', () => {
    const date = new Date('2026-04-04');
    const result = formatPlantedTended(date, date);
    expect(result).not.toMatch(/arrosé/);
  });
});

describe('readTimeMinutes', () => {
  it('returns at least 1 for empty string', () => {
    expect(readTimeMinutes('')).toBe(1);
  });
  it('rounds reasonable text to integer minutes', () => {
    const text = 'lorem '.repeat(1100);
    expect(readTimeMinutes(text, 220)).toBe(5);
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-04T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns relative french string for past day', () => {
    const result = formatRelativeDate(new Date('2026-05-03T12:00:00Z'));
    expect(result).toMatch(/hier/);
  });
});

describe('formatAbsoluteDate', () => {
  it('returns french long date', () => {
    expect(formatAbsoluteDate(new Date('2026-05-04T12:00:00Z'))).toMatch(/4 mai 2026/);
  });
});
