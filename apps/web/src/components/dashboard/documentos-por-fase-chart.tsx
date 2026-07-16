'use client';

import { FileStack } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useChartPalette } from './chart-colors';

interface DashboardFaseCounts {
  readonly corrente: number;
  readonly intermediario: number;
}

interface DocumentosPorFaseChartProps {
  readonly data: DashboardFaseCounts;
}

/**
 * Part-to-whole with only 2 slices → donut, categorical color job (a pie has
 * no axis, so color IS the identity channel — hence the mandatory legend).
 */
export function DocumentosPorFaseChart({ data }: DocumentosPorFaseChartProps) {
  const { categorical, chrome } = useChartPalette();
  const total = data.corrente + data.intermediario;

  const slices = [
    { key: 'corrente', name: 'Corrente', value: data.corrente, color: categorical.indigo },
    { key: 'intermediario', name: 'Intermediário', value: data.intermediario, color: categorical.cyan },
  ];

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-4 font-bold text-slate-950 dark:text-slate-100">Documentos por Fase</h3>

      {total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-slate-500 dark:text-slate-500">
          <FileStack className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm">Nenhum documento cadastrado.</p>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
                stroke={chrome.tooltipBg}
                strokeWidth={2}
                isAnimationActive={false}
              >
                {slices.map((slice) => (
                  <Cell key={slice.key} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: chrome.tooltipBg, border: `1px solid ${chrome.tooltipBorder}`, borderRadius: 8 }}
                labelStyle={{ color: chrome.tooltipText }}
                itemStyle={{ color: chrome.tooltipText }}
                formatter={(value) => [value, 'Documentos']}
              />
              <Legend iconType="circle" wrapperStyle={{ color: chrome.axis, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
