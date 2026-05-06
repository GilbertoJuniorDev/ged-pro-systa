import { fireEvent, render, screen } from '@testing-library/react';
import { useTheme } from 'next-themes';
import { ThemeToggle } from './theme-toggle';

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

function mockTheme(resolvedTheme: 'dark' | 'light', setTheme = jest.fn()) {
  mockUseTheme.mockReturnValue({
    theme: resolvedTheme,
    setTheme,
    forcedTheme: undefined,
    resolvedTheme,
    themes: ['light', 'dark'],
    systemTheme: undefined,
  });
  return setTheme;
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should switch to light theme when current theme is dark', () => {
    const setTheme = mockTheme('dark');

    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: 'Ativar tema claro' });
    fireEvent.click(button);

    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('should switch to dark theme when current theme is light', () => {
    const setTheme = mockTheme('light');

    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: 'Ativar tema escuro' });
    fireEvent.click(button);

    expect(setTheme).toHaveBeenCalledWith('dark');
  });
});
