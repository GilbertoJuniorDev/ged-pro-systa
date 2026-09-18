import {
  COLOR_SHADES,
  contrastRatio,
  deriveColorScale,
  deriveThemeScales,
  hexToHsl,
  hslToHex,
  readableForeground,
  relativeLuminance,
  TAILWIND_INDIGO_SCALE,
  TAILWIND_SKY_SCALE,
  TAILWIND_SLATE_SCALE,
} from './theme';
import type { ColorScale } from './theme';

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

describe('hexToHsl / hslToHex (roundtrip)', () => {
  // Tolerância de ±1 por canal RGB absorve só o arredondamento final para inteiro
  // de canal de cor (Math.round em hslToHex), não perda de precisão de h/s/l.
  it.each(['#4f46e5', '#0ea5e9', '#0f172a', '#ffffff', '#000000', '#f8fafc'])(
    'converte %s para HSL e de volta para uma cor visualmente idêntica (±1 por canal)',
    (hex) => {
      const { h, s, l } = hexToHsl(hex);
      const roundtripped = hexToRgb(hslToHex(h, s, l));
      const original = hexToRgb(hex);
      roundtripped.forEach((channel, i) => {
        expect(Math.abs(channel - original[i])).toBeLessThanOrEqual(1);
      });
    },
  );

  it('lança erro para hex inválido', () => {
    expect(() => hexToHsl('not-a-color')).toThrow();
    expect(() => hexToHsl('#fff')).toThrow();
  });
});

describe('relativeLuminance / contrastRatio', () => {
  it('preto e branco têm a razão de contraste máxima (21:1)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('uma cor contra ela mesma tem contraste 1:1', () => {
    expect(contrastRatio('#4f46e5', '#4f46e5')).toBeCloseTo(1, 5);
  });

  it('branco é mais luminoso que preto', () => {
    expect(relativeLuminance('#ffffff')).toBeGreaterThan(relativeLuminance('#000000'));
  });
});

describe('readableForeground', () => {
  it.each(['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#0ea5e9', '#ffffff', '#000000'])(
    'devolve um foreground com contraste AA (>=4.5:1) sobre %s',
    (hex) => {
      expect(contrastRatio(hex, readableForeground(hex))).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe('deriveColorScale — identidade com a referência', () => {
  // Esta é a propriedade central do remapeamento de rampa: com os defaults do sistema,
  // a aparência renderizada precisa ser IDÊNTICA à de antes da feature existir. Se esta
  // asserção quebrar, trocar a cor para o default deixa de ser um no-op visual.
  it.each([
    ['indigo', '#4f46e5', 600, TAILWIND_INDIGO_SCALE, undefined],
    ['sky', '#0ea5e9', 500, TAILWIND_SKY_SCALE, undefined],
    ['slate', '#0f172a', 900, TAILWIND_SLATE_SCALE, 'preserve'],
  ] as const)(
    'devolve a rampa %s inalterada quando a cor escolhida é a própria âncora',
    (_familia, hex, anchor, reference, lightness) => {
      const scale = deriveColorScale(hex, anchor, {
        reference,
        lightness,
        maxSaturationRatio: lightness === 'preserve' ? 1 : undefined,
        matchReferenceLuminance: lightness === 'preserve',
      });
      expect(scale).toEqual(reference);
    },
  );
});

describe('deriveColorScale — rampa derivada', () => {
  it('lança erro para hex inválido', () => {
    expect(() => deriveColorScale('#12', 600)).toThrow();
    expect(() => deriveColorScale('rgb(0,0,0)', 600)).toThrow();
  });

  it('fixa a cor escolhida exatamente no shade de âncora', () => {
    expect(deriveColorScale('#16a34a', 600)[600]).toBe('#16a34a');
    expect(deriveColorScale('#db2777', 500, { reference: TAILWIND_SKY_SCALE })[500]).toBe('#db2777');
  });

  it.each(['#ff0000', '#fde047', '#808080', '#16a34a', '#4f46e5', '#db2777'])(
    'mantém a luminosidade estritamente decrescente de 50 a 950 para %s',
    (hex) => {
      const scale = deriveColorScale(hex, 600);
      const lightnesses = COLOR_SHADES.map((shade) => hexToHsl(scale[shade]).l);
      for (let i = 1; i < lightnesses.length; i += 1) {
        expect(lightnesses[i]).toBeLessThan(lightnesses[i - 1]);
      }
    },
  );

  // Preto e branco puros são os casos degenerados: a âncora fica colada no limite da
  // escala, então a metade correspondente da rampa comprime contra MAX/MIN_LIGHTNESS e
  // paradas vizinhas podem empatar. A rampa continua ordenada — só não estritamente.
  it.each(['#000000', '#ffffff'])(
    'mantém a rampa ordenada (sem inversões) mesmo para o extremo %s',
    (hex) => {
      const scale = deriveColorScale(hex, 600);
      const lightnesses = COLOR_SHADES.map((shade) => hexToHsl(scale[shade]).l);
      for (let i = 1; i < lightnesses.length; i += 1) {
        expect(lightnesses[i]).toBeLessThanOrEqual(lightnesses[i - 1]);
      }
    },
  );

  it('produz hexs válidos em todas as paradas', () => {
    const scale = deriveColorScale('#16a34a', 600);
    for (const shade of COLOR_SHADES) {
      expect(scale[shade]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it.each(['#fefce8', '#000000', '#ffffff'])(
    'mantém contraste AA entre a âncora e seu foreground mesmo para a cor extrema %s',
    (hex) => {
      const anchorColor = deriveColorScale(hex, 600)[600];
      expect(contrastRatio(anchorColor, readableForeground(anchorColor))).toBeGreaterThanOrEqual(
        4.5,
      );
    },
  );
});

describe('deriveThemeScales — preservação de contraste no neutro', () => {
  const NEUTRAL_OPTIONS = {
    reference: TAILWIND_SLATE_SCALE,
    lightness: 'preserve',
    maxSaturationRatio: 1,
    matchReferenceLuminance: true,
  } as const;

  // A rampa slate carrega texto, borda E superfície ao mesmo tempo — mover sua escada de
  // luminância moveria todos os pares texto/fundo do app de uma vez. Estes dois testes são
  // o que garante que "tingir o fundo" nunca vira "arruinar a legibilidade".
  it.each(['#0f172a', '#450a0a', '#082f49', '#000000', '#ffffff', '#ff0000'])(
    'mantém a luminância de cada parada praticamente igual à do slate para %s',
    (hex) => {
      const scale = deriveColorScale(hex, 900, NEUTRAL_OPTIONS);
      for (const shade of COLOR_SHADES) {
        const delta = Math.abs(
          relativeLuminance(scale[shade]) - relativeLuminance(TAILWIND_SLATE_SCALE[shade]),
        );
        expect(delta).toBeLessThan(0.02);
      }
    },
  );

  it.each(['#0f172a', '#450a0a', '#082f49', '#ff0000'])(
    'preserva AA no par de menor folga do app (text-slate-400 sobre bg-slate-950) para %s',
    (hex) => {
      const scale = deriveColorScale(hex, 900, NEUTRAL_OPTIONS);
      expect(contrastRatio(scale[400], scale[950])).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('devolve as três rampas do Tailwind para as cores default do sistema', () => {
    const scales = deriveThemeScales({
      primaryColor: '#4f46e5',
      secondaryColor: '#0ea5e9',
      backgroundColor: '#0f172a',
    });

    expect(scales.primary).toEqual<ColorScale>(TAILWIND_INDIGO_SCALE);
    expect(scales.secondary).toEqual<ColorScale>(TAILWIND_SKY_SCALE);
    expect(scales.neutral).toEqual<ColorScale>(TAILWIND_SLATE_SCALE);
  });
});
