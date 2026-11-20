import { renderHook } from '@testing-library/react';
import { useTheme } from 'next-themes';
import { useChartPalette } from './chart-colors';

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

function withTheme(resolvedTheme: 'light' | 'dark') {
  mockUseTheme.mockReturnValue({
    theme: resolvedTheme,
    setTheme: jest.fn(),
    forcedTheme: undefined,
    resolvedTheme,
    themes: ['light', 'dark'],
    systemTheme: undefined,
  });
}

describe('useChartPalette', () => {
  it.each(['light', 'dark'] as const)(
    'should paint chart chrome with the semantic tokens in the %s Tema',
    (theme) => {
      withTheme(theme);

      const { result } = renderHook(() => useChartPalette());

      expect(result.current.chrome).toEqual({
        surface: 'var(--ged-surface)',
        grid: 'var(--ged-border)',
        axis: 'var(--ged-muted-foreground)',
        tooltipBg: 'var(--ged-surface-elevated)',
        tooltipBorder: 'var(--ged-border)',
        tooltipText: 'var(--ged-foreground)',
      });
    },
  );

  it('should use the Paleta primary for single-hue magnitude series', () => {
    withTheme('light');

    const { result } = renderHook(() => useChartPalette());

    expect(result.current.sequential).toBe('var(--ged-primary)');
  });
});
