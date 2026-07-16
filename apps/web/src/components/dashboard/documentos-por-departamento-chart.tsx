'use client';

import { Building2 } from 'lucide-react';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartPalette } from './chart-colors';

interface DashboardDepartamentoCount {
  readonly departamentoId: string;
  readonly departamentoNome: string;
  readonly totalDocumentos: number;
}

interface DocumentosPorDepartamentoChartProps {
  readonly data: readonly DashboardDepartamentoCount[];
}

const ROW_HEIGHT_PX = 40;
const MIN_CHART_HEIGHT_PX = 220;

/**
 * "Which department has more documents" is a magnitude comparison across a
 * nominal category (department names are not an inherent order), so every
 * bar takes the same sequential hue — never a generated color per department.
 */
export function DocumentosPorDepartamentoChart({ data }: DocumentosPorDepartamentoChartProps) {
  const { sequential, chrome } = useChartPalette();
  const rows = [...data].sort((a, b) => b.totalDocumentos - a.totalDocumentos);
  const chartHeight = Math.max(MIN_CHART_HEIGHT_PX, rows.length * ROW_HEIGHT_PX);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-4 font-bold text-slate-950 dark:text-slate-100">Documentos por Departamento</h3>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-slate-500 dark:text-slate-500">
          <Building2 className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm">Nenhum departamento com documentos.</p>
        </div>
      ) : (
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 32, bottom: 8, left: 8 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="departamentoNome"
                tickLine={false}
                axisLine={false}
                width={140}
                tick={{ fill: chrome.axis, fontSize: 13 }}
              />
              <Tooltip
                cursor={{ fill: chrome.grid, opacity: 0.4 }}
                contentStyle={{ background: chrome.tooltipBg, border: `1px solid ${chrome.tooltipBorder}`, borderRadius: 8 }}
                labelStyle={{ color: chrome.tooltipText }}
                itemStyle={{ color: chrome.tooltipText }}
                formatter={(value) => [value, 'Documentos']}
              />
              <Bar dataKey="totalDocumentos" fill={sequential} barSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList dataKey="totalDocumentos" position="right" fill={chrome.axis} fontSize={13} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
