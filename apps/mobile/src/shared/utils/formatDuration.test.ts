import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
  it('formats zero and sub-minute durations as 0m', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(30_000)).toBe('0m');
    expect(formatDuration(59_999)).toBe('0m');
  });

  it('formats exact minutes and hours', () => {
    expect(formatDuration(5 * 60_000)).toBe('5m');
    expect(formatDuration(60 * 60_000)).toBe('1h');
    expect(formatDuration(65 * 60_000)).toBe('1h 5m');
    expect(formatDuration((2 * 60 + 41) * 60_000)).toBe('2h 41m');
  });

  it('floors partial minutes', () => {
    expect(formatDuration(90_000)).toBe('1m');
  });

  it('treats negative values as 0m', () => {
    expect(formatDuration(-1)).toBe('0m');
    expect(formatDuration(-60_000)).toBe('0m');
  });
});
