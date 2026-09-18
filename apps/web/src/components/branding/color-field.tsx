'use client';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

interface ColorFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string;
}

export function ColorField({ label, value, onChange, error }: ColorFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={HEX_PATTERN.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-950"
          aria-label={`${label} (seletor visual)`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          placeholder="#4f46e5"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </label>
  );
}
