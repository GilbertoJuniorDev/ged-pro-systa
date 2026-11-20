import {
  classifyPrimaryAdjustment,
  COLOR_SHADES,
  contrastRatio,
  LARGE_PRIMARY_ADJUSTMENT_CONTRAST,
  meetsContrast,
  deriveColorScale,
  deriveSemanticTokens,
  deriveThemeScales,
  hexToHsl,
  THEME_MODES,
  hslToHex,
  readableForeground,
  relativeLuminance,
  TAILWIND_INDIGO_SCALE,
  TAILWIND_SKY_SCALE,
  TAILWIND_SLATE_SCALE,
  WCAG_AA_CONTRAST,
} from './theme';
import type { ColorScale, Palette, SemanticTokens } from './theme';

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

// ─── Tokens semânticos (ADR 0002) ───────────────────────────────────────────

const DEFAULT_PALETTE = {
  primaryColor: '#4f46e5',
  secondaryColor: '#0ea5e9',
  backgroundColor: '#0f172a',
} as const;

const BACKGROUND_COLORS = ['#0f172a', '#ffffff', '#000000', '#fef08a', '#7f1d1d', '#22c55e', '#f8fafc'];

describe('deriveSemanticTokens — luminosidade fixa por Tema', () => {
  it.each(BACKGROUND_COLORS)('o fundo do Tema claro é sempre claro (fundo da Paleta %s)', (backgroundColor) => {
    const { tokens } = deriveSemanticTokens({ ...DEFAULT_PALETTE, backgroundColor }, 'light');

    for (const canvas of [tokens.background, tokens.surface, tokens['surface-elevated']]) {
      expect(relativeLuminance(canvas)).toBeGreaterThan(0.8);
    }
  });

  it.each(BACKGROUND_COLORS)('o fundo do Tema escuro é sempre escuro (fundo da Paleta %s)', (backgroundColor) => {
    const { tokens } = deriveSemanticTokens({ ...DEFAULT_PALETTE, backgroundColor }, 'dark');

    for (const canvas of [tokens.background, tokens.surface, tokens['surface-elevated']]) {
      expect(relativeLuminance(canvas)).toBeLessThan(0.05);
    }
  });

  it('a cor de fundo da Paleta tinge os neutros com o seu matiz', () => {
    const red = deriveSemanticTokens({ ...DEFAULT_PALETTE, backgroundColor: '#7f1d1d' }, 'dark');
    const green = deriveSemanticTokens({ ...DEFAULT_PALETTE, backgroundColor: '#14532d' }, 'dark');

    expect(red.tokens.surface).not.toBe(green.tokens.surface);
    const hue = hexToHsl(red.tokens.surface).h;
    expect(Math.min(hue, 360 - hue)).toBeLessThan(30);
  });
});

// Casos-limite pedidos pelo ticket #20: primária amarela, fundo escuro, fundo branco — e
// primárias nos dois extremos de luminância.
const EDGE_PALETTES: readonly (readonly [string, Palette])[] = [
  ['padrão', DEFAULT_PALETTE],
  ['primária amarela', { ...DEFAULT_PALETTE, primaryColor: '#facc15' }],
  ['primária amarela + fundo branco', { ...DEFAULT_PALETTE, primaryColor: '#ffff00', backgroundColor: '#ffffff' }],
  ['fundo preto', { ...DEFAULT_PALETTE, backgroundColor: '#000000' }],
  ['fundo branco', { ...DEFAULT_PALETTE, backgroundColor: '#ffffff' }],
  ['primária quase preta', { ...DEFAULT_PALETTE, primaryColor: '#111111' }],
  ['primária branca', { ...DEFAULT_PALETTE, primaryColor: '#ffffff', secondaryColor: '#ffffff' }],
  ['secundária amarela', { ...DEFAULT_PALETTE, secondaryColor: '#fde047' }],
];

const CASES = THEME_MODES.flatMap((mode) =>
  EDGE_PALETTES.map(([label, palette]) => [mode, label, palette] as const),
);

function canvasesOf(tokens: SemanticTokens): string[] {
  return [tokens.background, tokens.surface, tokens['surface-elevated']];
}

describe('deriveSemanticTokens — contraste AA (4.5:1)', () => {
  it.each(CASES)('Tema %s, %s: texto sobre os fundos', (mode, _label, palette) => {
    const { tokens } = deriveSemanticTokens(palette, mode);

    for (const canvas of canvasesOf(tokens)) {
      expect(contrastRatio(tokens.foreground, canvas)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(tokens['muted-foreground'], canvas)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(CASES)('Tema %s, %s: primária e secundária sobre os fundos', (mode, _label, palette) => {
    const { tokens } = deriveSemanticTokens(palette, mode);

    for (const canvas of canvasesOf(tokens)) {
      expect(contrastRatio(tokens.primary, canvas)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(tokens.secondary, canvas)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(CASES)('Tema %s, %s: texto sobre a primária', (mode, _label, palette) => {
    const { tokens } = deriveSemanticTokens(palette, mode);

    expect(contrastRatio(tokens['primary-foreground'], tokens.primary)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('deriveSemanticTokens — status fixos', () => {
  it.each(THEME_MODES)('Tema %s: status idênticos para qualquer Paleta', (mode) => {
    const statusOf = (palette: Palette) => {
      const { tokens } = deriveSemanticTokens(palette, mode);
      return [tokens.success, tokens.warning, tokens.danger, tokens.info];
    };
    const reference = statusOf(DEFAULT_PALETTE);

    for (const [, palette] of EDGE_PALETTES) {
      expect(statusOf(palette)).toEqual(reference);
    }
  });

  it.each(CASES)('Tema %s, %s: status com contraste AA sobre os fundos', (mode, _label, palette) => {
    const { tokens } = deriveSemanticTokens(palette, mode);

    for (const canvas of canvasesOf(tokens)) {
      for (const status of [tokens.success, tokens.warning, tokens.danger, tokens.info]) {
        expect(contrastRatio(status, canvas)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('status mudam entre os Temas', () => {
    expect(deriveSemanticTokens(DEFAULT_PALETTE, 'light').tokens.danger).not.toBe(
      deriveSemanticTokens(DEFAULT_PALETTE, 'dark').tokens.danger,
    );
  });
});

describe('deriveSemanticTokens — ajuste da primária', () => {
  it('mantém a primária escolhida, sem ajuste, quando ela já atinge 4.5:1', () => {
    const derived = deriveSemanticTokens(DEFAULT_PALETTE, 'light');

    expect(derived.tokens.primary).toBe('#4f46e5');
    expect(derived.primaryAdjusted).toBe(false);
  });

  it('ajusta e informa quando a primária não atinge 4.5:1 (amarela no claro)', () => {
    const derived = deriveSemanticTokens({ ...DEFAULT_PALETTE, primaryColor: '#facc15' }, 'light');

    expect(derived.primaryAdjusted).toBe(true);
    expect(derived.tokens.primary).not.toBe('#facc15');
  });

  it('ajusta e informa quando a primária não atinge 4.5:1 (índigo padrão no escuro)', () => {
    const derived = deriveSemanticTokens(DEFAULT_PALETTE, 'dark');

    expect(derived.primaryAdjusted).toBe(true);
    expect(relativeLuminance(derived.tokens.primary)).toBeGreaterThan(relativeLuminance('#4f46e5'));
  });

  it('o ajuste preserva o matiz da primária', () => {
    const { tokens } = deriveSemanticTokens({ ...DEFAULT_PALETTE, primaryColor: '#facc15' }, 'light');
    const delta = Math.abs(hexToHsl(tokens.primary).h - hexToHsl('#facc15').h);

    expect(delta).toBeLessThan(3);
  });

  it('a amarela no escuro não precisa de ajuste', () => {
    expect(
      deriveSemanticTokens({ ...DEFAULT_PALETTE, primaryColor: '#facc15' }, 'dark').primaryAdjusted,
    ).toBe(false);
  });

  it('o ajuste da secundária não conta como ajuste da primária', () => {
    expect(
      deriveSemanticTokens({ ...DEFAULT_PALETTE, secondaryColor: '#fde047' }, 'light').primaryAdjusted,
    ).toBe(false);
  });

  it('lança erro para Paleta corrompida', () => {
    expect(() => deriveSemanticTokens({ ...DEFAULT_PALETTE, primaryColor: 'red' }, 'dark')).toThrow();
  });
});

describe('meetsContrast', () => {
  it('exporta o limiar AA do WCAG para texto normal', () => {
    expect(WCAG_AA_CONTRAST).toBe(4.5);
  });

  it('exige 4.5:1 contra TODOS os fundos', () => {
    expect(meetsContrast('#0f172a', ['#ffffff', '#f8fafc'])).toBe(true);
    expect(meetsContrast('#4f46e5', ['#ffffff', '#020617'])).toBe(false);
  });
});

describe('classifyPrimaryAdjustment', () => {
  it('é "none" quando a cor final é a escolhida', () => {
    expect(classifyPrimaryAdjustment('#4f46e5', '#4f46e5')).toBe('none');
  });

  // Limiar objetivo: 3:1 entre a escolhida e a final é o contraste mínimo do WCAG para
  // componentes distinguíveis (1.4.11) — a partir dele o tom aplicado já é "outra cor".
  it('usa 3:1 (WCAG 1.4.11) como limiar de ajuste grande', () => {
    expect(LARGE_PRIMARY_ADJUSTMENT_CONTRAST).toBe(3);
  });

  it('é "minor" quando a final difere da escolhida em menos de 3:1', () => {
    expect(contrastRatio('#4f46e5', '#8882ed')).toBeLessThan(3);
    expect(classifyPrimaryAdjustment('#4f46e5', '#8882ed')).toBe('minor');
  });

  it('é "large" quando a final difere da escolhida em 3:1 ou mais', () => {
    expect(classifyPrimaryAdjustment('#1e1b4b', '#8b87d4')).toBe('large');
  });
});

describe('deriveSemanticTokens — tamanho do ajuste da primária', () => {
  it('a Paleta padrão não tem ajuste no claro', () => {
    expect(deriveSemanticTokens(DEFAULT_PALETTE, 'light').primaryAdjustment).toBe('none');
  });

  it('a Paleta padrão tem ajuste pequeno no escuro (#4f46e5 → #8882ed)', () => {
    const derived = deriveSemanticTokens(DEFAULT_PALETTE, 'dark');

    expect(derived.tokens.primary).toBe('#8882ed');
    expect(derived.primaryAdjustment).toBe('minor');
  });

  it('uma primária quase preta tem ajuste grande no escuro', () => {
    const derived = deriveSemanticTokens({ ...DEFAULT_PALETTE, primaryColor: '#1e1b4b' }, 'dark');

    expect(derived.primaryAdjustment).toBe('large');
  });

  it('uma primária quase branca tem ajuste grande no claro', () => {
    const derived = deriveSemanticTokens({ ...DEFAULT_PALETTE, primaryColor: '#e0e7ff' }, 'light');

    expect(derived.primaryAdjustment).toBe('large');
  });

  it('primaryAdjusted continua coerente com primaryAdjustment', () => {
    for (const primaryColor of ['#4f46e5', '#1e1b4b', '#facc15', '#e0e7ff']) {
      for (const mode of THEME_MODES) {
        const derived = deriveSemanticTokens({ ...DEFAULT_PALETTE, primaryColor }, mode);
        expect(derived.primaryAdjusted).toBe(derived.primaryAdjustment !== 'none');
      }
    }
  });
});
