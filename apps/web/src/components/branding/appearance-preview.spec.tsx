import { render, screen } from '@testing-library/react';
import { contrastRatio } from '@ged/utils';
import { DEFAULT_PORTAL_APPEARANCE } from '@ged/types';
import { AppearancePreview } from './appearance-preview';

/** jsdom devolve `rgb(r, g, b)`; o contraste é calculado em hex. */
function rgbToHex(rgb: string): string {
  const [r, g, b] = (rgb.match(/\d+/g) ?? []).map(Number);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

const PALETTES = [
  DEFAULT_PORTAL_APPEARANCE,
  { primaryColor: '#16a34a', secondaryColor: '#facc15', backgroundColor: '#450a0a' },
  { primaryColor: '#16a34a', secondaryColor: '#1e3a8a', backgroundColor: '#ffffff' },
];

describe('AppearancePreview', () => {
  it.each(['light', 'dark'] as const)('o destaque secundário atinge 4.5:1 no modo %s', (mode) => {
    for (const palette of PALETTES) {
      const { unmount } = render(
        <AppearancePreview
          primaryColor={palette.primaryColor}
          secondaryColor={palette.secondaryColor}
          backgroundColor={palette.backgroundColor}
          mode={mode}
        />,
      );
      const highlight = screen.getByText('Destaque secundário');
      const ratio = contrastRatio(
        rgbToHex(highlight.style.color),
        rgbToHex(highlight.style.backgroundColor),
      );
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      unmount();
    }
  });
});
