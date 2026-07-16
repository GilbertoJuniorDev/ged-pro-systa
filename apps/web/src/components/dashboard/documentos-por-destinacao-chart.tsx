'use client';

import { Archive } from 'lucide-react';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartPalette } from './chart-colors';

interface DashboardDestinacaoFinalCounts {
  readonly guardaPermanente: number;
  readonly eliminacao: number;
}

interface DocumentosPorDestinacaoChartProps {
  readonly data: DashboardDestinacaoFinalCounts;
}

/**
 * Guarda Permanente vs Eliminação is one metric (contagem de documentos)
 * sliced by disposition — a magnitude comparison, not distinct series, so it
 * takes the sequential default (one hue) rather than categorical colors.
 */
export function DocumentosPorDestinacaoChart({ data }: DocumentosPorDestinacaoChartProps) {
  const { sequential, chrome } = useChartPalette();
  const total = data.guardaPermanente + data.eliminacao;

  const rows = [
    { label: 'Guarda Permanente', value: data.guardaPermanente },
    { label: 'Eliminação', value: data.eliminacao },
  ];

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-4 font-bold text-slate-950 dark:text-slate-100">Documentos por Destinação Final</h3>

      {total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-slate-500 dark:text-slate-500">
          <Archive className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm">Nenhum documento cadastrado.</p>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                width={120}
                tick={{ fill: chrome.axis, fontSize: 13 }}
              />
              <Tooltip
                cursor={{ fill: chrome.grid, opacity: 0.4 }}
                contentStyle={{ background: chrome.tooltipBg, border: `1px solid ${chrome.tooltipBorder}`, borderRadius: 8 }}
                labelStyle={{ color: chrome.tooltipText }}
                itemStyle={{ color: chrome.tooltipText }}
                formatter={(value) => [value, 'Documentos']}
              />
              <Bar dataKey="value" fill={sequential} barSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList dataKey="value" position="right" fill={chrome.axis} fontSize={13} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
