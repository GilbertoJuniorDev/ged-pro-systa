import { TriangleAlert } from 'lucide-react';
import type { ThemeMode } from '@ged/utils';

interface PrimaryAdjustmentWarningProps {
  /** Temas em que a derivação ajustou a cor primária para atingir contraste AA. */
  readonly adjustedModes: readonly ThemeMode[];
}

const MODE_LABEL: Readonly<Record<ThemeMode, string>> = { light: 'claro', dark: 'escuro' };

function describeModes(modes: readonly ThemeMode[]): string {
  if (modes.length === 1) return `no Tema ${MODE_LABEL[modes[0]]}`;
  return `nos Temas ${modes.map((mode) => MODE_LABEL[mode]).join(' e ')}`;
}

/**
 * Aviso — não bloqueante — de que a primária escolhida não tinha contraste suficiente em
 * algum Tema e foi ajustada pela derivação (ADR 0002). Salvar continua permitido.
 */
export function PrimaryAdjustmentWarning({ adjustedModes }: PrimaryAdjustmentWarningProps) {
  if (adjustedModes.length === 0) return null;

  return (
    <div
      role="status"
      className="flex gap-2 rounded-lg border border-warning/40 px-3 py-2 text-xs text-foreground"
    >
      <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <p>
        A cor primária não tinha contraste suficiente {describeModes(adjustedModes)} e foi ajustada
        automaticamente para ficar legível. Você pode salvar mesmo assim.
      </p>
    </div>
  );
}
