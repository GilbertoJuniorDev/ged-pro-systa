'use client';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

interface ColorFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string;
  readonly disabled?: boolean;
}

export function ColorField({ label, value, onChange, error, disabled }: ColorFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={HEX_PATTERN.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-background p-1 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`${label} (seletor visual)`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          placeholder="#4f46e5"
          disabled={disabled}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}
