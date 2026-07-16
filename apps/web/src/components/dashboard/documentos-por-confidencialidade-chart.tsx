'use client';

import { ShieldAlert } from 'lucide-react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartPalette } from './chart-colors';

interface DashboardConfidencialidadeCounts {
  readonly publico: number;
  readonly restrito: number;
  readonly confidencial: number;
}

interface DocumentosPorConfidencialidadeChartProps {
  readonly data: DashboardConfidencialidadeCounts;
}

/**
 * Público < Restrito < Confidencial is an ascending sensitivity SCALE, not
 * three unrelated identities — ordinal job, one-hue ramp (light → dark),
 * rendered as a horizontal bar so the category names read in full. No
 * legend: the axis already carries identity, color only reinforces order.
 */
export function DocumentosPorConfidencialidadeChart({ data }: DocumentosPorConfidencialidadeChartProps) {
  const { confidencialidade: ramp, chrome } = useChartPalette();
  const total = data.publico + data.restrito + data.confidencial;

  const rows = [
    { label: 'Público', value: data.publico, color: ramp[0] },
    { label: 'Restrito', value: data.restrito, color: ramp[1] },
    { label: 'Confidencial', value: data.confidencial, color: ramp[2] },
  ];

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-4 font-bold text-slate-950 dark:text-slate-100">Documentos por Confidencialidade</h3>

      {total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-slate-500 dark:text-slate-500">
          <ShieldAlert className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
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
                width={100}
                tick={{ fill: chrome.axis, fontSize: 13 }}
              />
              <Tooltip
                cursor={{ fill: chrome.grid, opacity: 0.4 }}
                contentStyle={{ background: chrome.tooltipBg, border: `1px solid ${chrome.tooltipBorder}`, borderRadius: 8 }}
                labelStyle={{ color: chrome.tooltipText }}
                itemStyle={{ color: chrome.tooltipText }}
                formatter={(value) => [value, 'Documentos']}
              />
              <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {rows.map((row) => (
                  <Cell key={row.label} fill={row.color} />
                ))}
                <LabelList dataKey="value" position="right" fill={chrome.axis} fontSize={13} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
