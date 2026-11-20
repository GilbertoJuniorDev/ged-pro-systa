import { Info, TriangleAlert } from 'lucide-react';
import { THEME_MODES, type PrimaryAdjustment, type ThemeMode } from '@ged/utils';
import { THEME_MODE_LABEL } from './theme-mode-label';

type Adjustments = Readonly<Record<ThemeMode, PrimaryAdjustment>>;

interface PrimaryAdjustmentNoticeProps {
  /** Tamanho do ajuste que a derivação fez na primária em cada Tema (ADR 0002). */
  readonly adjustments: Adjustments;
}

/** O ajuste vai na direção do contraste: mais claro no Tema escuro, mais escuro no claro. */
const ADJUSTED_TONE: Readonly<Record<ThemeMode, string>> = { light: 'mais escuro', dark: 'mais claro' };

function modesWith(adjustments: Adjustments, wanted: PrimaryAdjustment[]): ThemeMode[] {
  return THEME_MODES.filter((mode) => wanted.includes(adjustments[mode]));
}

/** "No Tema escuro usamos um tom mais claro [e no Tema … um tom …] da primária…" */
function describeNote(modes: readonly ThemeMode[]): string {
  const parts = modes.map((mode, index) => {
    const tone = `um tom ${ADJUSTED_TONE[mode]}`;
    const tema = `Tema ${THEME_MODE_LABEL[mode]}`;
    return index === 0 ? `No ${tema} usamos ${tone}` : `no ${tema} ${tone}`;
  });
  return `${parts.join(' e ')} da primária para manter a legibilidade.`;
}

function describeModes(modes: readonly ThemeMode[]): string {
  if (modes.length === 1) return `no Tema ${THEME_MODE_LABEL[modes[0]]}`;
  return `nos Temas ${modes.map((mode) => THEME_MODE_LABEL[mode]).join(' e ')}`;
}

/**
 * Explica — sem bloquear o salvamento — que a derivação ajustou a primária para manter
 * contraste AA. Como nenhuma primária atinge 4.5:1 nos dois Temas, o ajuste existe para
 * toda Paleta: por isso o padrão é uma nota neutra. Só vira alerta quando o ajuste é
 * grande (`large`, ver `LARGE_PRIMARY_ADJUSTMENT_CONTRAST` em @ged/utils), isto é, quando o
 * app vai mostrar uma cor visivelmente diferente da escolhida.
 */
export function PrimaryAdjustmentNotice({ adjustments }: PrimaryAdjustmentNoticeProps) {
  const adjusted = modesWith(adjustments, ['minor', 'large']);
  if (adjusted.length === 0) return null;

  const large = modesWith(adjustments, ['large']);

  if (large.length > 0) {
    return (
      <div
        role="status"
        data-tone="warning"
        className="flex gap-2 rounded-lg border border-warning/40 px-3 py-2 text-xs text-foreground"
      >
        <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <p>
          A cor primária ficou bem diferente da escolhida {describeModes(large)}: ela não tinha
          contraste suficiente e foi ajustada para ficar legível. Você pode salvar mesmo assim.
        </p>
      </div>
    );
  }

  return (
    <div role="status" data-tone="info" className="flex gap-2 text-xs text-muted-foreground">
      <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{describeNote(adjusted)}</p>
    </div>
  );
}
