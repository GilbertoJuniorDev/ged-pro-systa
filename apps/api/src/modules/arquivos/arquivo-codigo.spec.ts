import { formatArquivoCodigo } from './arquivo-codigo';

describe('formatArquivoCodigo', () => {
  it('should pad sequencia to 3 digits when below 100', () => {
    expect(formatArquivoCodigo(2026, 1)).toBe('2026-001');
    expect(formatArquivoCodigo(2026, 42)).toBe('2026-042');
  });

  it('should not pad sequencia when it already has 3 or more digits', () => {
    expect(formatArquivoCodigo(2026, 100)).toBe('2026-100');
    expect(formatArquivoCodigo(2026, 999)).toBe('2026-999');
  });

  it('should degrade gracefully past 999 without truncating the number', () => {
    expect(formatArquivoCodigo(2026, 1000)).toBe('2026-1000');
  });

  it('should reflect a different ano across a year turnover', () => {
    expect(formatArquivoCodigo(2027, 1)).toBe('2027-001');
  });
});
