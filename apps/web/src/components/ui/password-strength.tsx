'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Critérios ────────────────────────────────────────────────────────────────

interface Criterion {
  label: string;
  test: (v: string) => boolean;
}

const CRITERIA: readonly Criterion[] = [
  { label: 'Mínimo 8 caracteres',       test: (v) => v.length >= 8 },
  { label: 'Letra maiúscula (A–Z)',      test: (v) => /[A-Z]/.test(v) },
  { label: 'Letra minúscula (a–z)',      test: (v) => /[a-z]/.test(v) },
  { label: 'Número (0–9)',               test: (v) => /\d/.test(v) },
  { label: 'Caractere especial (!@#$…)', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

// ─── Nível de força ───────────────────────────────────────────────────────────

interface StrengthLevel {
  label: string;
  color: string;
  textColor: string;
  segments: number;
}

const LEVELS: readonly StrengthLevel[] = [
  { label: 'Muito fraca', color: 'bg-rose-500',    textColor: 'text-rose-400',    segments: 1 },
  { label: 'Fraca',       color: 'bg-orange-500',  textColor: 'text-orange-400',  segments: 1 },
  { label: 'Razoável',    color: 'bg-amber-400',   textColor: 'text-amber-400',   segments: 2 },
  { label: 'Boa',         color: 'bg-lime-500',    textColor: 'text-lime-400',    segments: 3 },
  { label: 'Forte',       color: 'bg-emerald-500', textColor: 'text-emerald-400', segments: 4 },
];

function getLevel(score: number): StrengthLevel {
  if (score <= 1) return LEVELS[0];
  if (score === 2) return LEVELS[1];
  if (score === 3) return LEVELS[2];
  if (score === 4) return LEVELS[3];
  return LEVELS[4];
}

function evaluate(password: string) {
  const results = CRITERIA.map((c) => c.test(password));
  const score = results.filter(Boolean).length;
  return { results, score, level: getLevel(score) };
}

interface PasswordStrengthProps {
  readonly password: string;
}

// ─── Barra de força (vai entre o label e o input) ────────────────────────────

export function PasswordStrengthBar({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { score, level } = evaluate(password);

  return (
    <div
      className="flex items-center gap-1 mb-1.5 animate-fade-in"
      role="progressbar"
      aria-valuenow={score}
      aria-valuemax={5}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1 flex-1 rounded-full transition-all duration-300',
            i < level.segments ? level.color : 'bg-slate-700',
          )}
        />
      ))}
      <span className={cn('text-xs font-medium ml-1 shrink-0 transition-colors', level.textColor)}>
        {level.label}
      </span>
    </div>
  );
}

// ─── Critérios em grade 2 colunas (vai abaixo do input) ──────────────────────

export function PasswordStrengthCriteria({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { results } = evaluate(password);

  return (
    <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 animate-fade-in">
      {CRITERIA.map((criterion, i) => (
        <li key={criterion.label} className="flex items-center gap-1.5">
          <span
            className={cn(
              'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full transition-colors',
              results[i] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/60 text-slate-600',
            )}
          >
            {results[i]
              ? <Check className="w-2 h-2" strokeWidth={3} />
              : <X className="w-2 h-2" strokeWidth={3} />
            }
          </span>
          <span className={cn('text-xs transition-colors', results[i] ? 'text-slate-400' : 'text-slate-600')}>
            {criterion.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
