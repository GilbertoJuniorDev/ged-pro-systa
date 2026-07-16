'use client';

import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartPalette } from './chart-colors';

interface DashboardDocumentosPorMes {
  readonly mes: string; // 'YYYY-MM'
  readonly total: number;
}

interface DocumentosPorMesChartProps {
  readonly data: readonly DashboardDocumentosPorMes[];
}

const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

function formatMes(mes: string): string {
  const [ano, mesNumero] = mes.split('-');
  const indice = Number(mesNumero) - 1;
  const abrev = MESES_ABREV[indice] ?? mes;
  return `${abrev}/${(ano ?? '').slice(2)}`;
}

/**
 * Trend over time, single series → line/area with the sequential hue; no
 * legend needed (one color, the title already says what it is).
 */
export function DocumentosPorMesChart({ data }: DocumentosPorMesChartProps) {
  const { sequential, chrome } = useChartPalette();

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-4 font-bold text-slate-950 dark:text-slate-100">Documentos Criados por Mês</h3>

      {data.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-slate-500 dark:text-slate-500">
          <TrendingUp className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm">Nenhum dado no período.</p>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[...data]} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid stroke={chrome.grid} vertical={false} />
              <XAxis
                dataKey="mes"
                tickFormatter={formatMes}
                tickLine={false}
                axisLine={false}
                tick={{ fill: chrome.axis, fontSize: 13 }}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: chrome.axis, fontSize: 13 }} />
              <Tooltip
                cursor={{ stroke: chrome.grid, strokeWidth: 1 }}
                contentStyle={{ background: chrome.tooltipBg, border: `1px solid ${chrome.tooltipBorder}`, borderRadius: 8 }}
                labelStyle={{ color: chrome.tooltipText }}
                itemStyle={{ color: chrome.tooltipText }}
                labelFormatter={(label) => formatMes(String(label))}
                formatter={(value) => [value, 'Documentos']}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke={sequential}
                strokeWidth={2}
                fill={sequential}
                fillOpacity={0.1}
                dot={{ r: 4, fill: sequential, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: chrome.tooltipBg, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
