'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const;

const MONTHS_LONG = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

type ViewMode = 'days' | 'months' | 'years';

/** Gera lista de anos centrada em torno de um ano base */
function buildYearRange(center: number): number[] {
  const start = center - 8;
  const years: number[] = [];
  for (let y = start; y < start + 20; y++) years.push(y);
  return years;
}

/** Parse YYYY-MM-DD → Date (local, sem fuso) */
function parseYMD(ymd: string): Date | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Date → YYYY-MM-DD */
function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Date → DD/MM/AAAA */
function formatDisplay(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

/** Gera todos os dias da grade 6×7 para um mês/ano */
function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const days: Date[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(year, month + 1, d));
  }

  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface DatePickerProps {
  readonly value?: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly error?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Selecionar data',
  disabled = false,
  className,
  error = false,
}: DatePickerProps) {
  const today = new Date();
  const selected = parseYMD(value ?? '');

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());
  const [yearRangeCenter, setYearRangeCenter] = useState(
    selected?.getFullYear() ?? today.getFullYear(),
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync view when value changes externally
  useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
      setYearRangeCenter(selected.getFullYear());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Reset to days view on close
  useEffect(() => {
    if (!open) setViewMode('days');
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function selectDay(day: Date) {
    onChange(toYMD(day));
    setOpen(false);
  }

  function selectMonth(monthIndex: number) {
    setViewMonth(monthIndex);
    setViewMode('days');
  }

  function selectYear(year: number) {
    setViewYear(year);
    setYearRangeCenter(year);
    setViewMode('months');
  }

  function toggleViewMode() {
    setViewMode((m) => {
      if (m === 'days') return 'months';
      if (m === 'months') return 'years';
      return 'days';
    });
  }

  const grid = buildGrid(viewYear, viewMonth);
  const yearRange = buildYearRange(yearRangeCenter);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm transition-colors',
          'bg-slate-800 border text-left',
          error
            ? 'border-rose-500 focus:ring-rose-500'
            : 'border-slate-700 focus:ring-indigo-500',
          'focus:outline-none focus:ring-2 focus:border-transparent',
          selected ? 'text-slate-100' : 'text-slate-500',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <CalendarIcon className="w-4 h-4 shrink-0 text-slate-400" />
        <span className="flex-1">
          {selected ? formatDisplay(selected) : placeholder}
        </span>
      </button>

      {/* Popover */}
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-72 rounded-xl border border-slate-700',
            'bg-slate-900 shadow-2xl shadow-black/40 p-3 animate-scale-in',
          )}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-3">
            {/* Prev */}
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'days') prevMonth();
                else if (viewMode === 'years') setYearRangeCenter((c) => c - 20);
              }}
              className={cn(
                'p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors',
                viewMode === 'months' && 'invisible',
              )}
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Title — clicável para alternar modos */}
            <button
              type="button"
              onClick={toggleViewMode}
              className="flex items-center gap-1 text-sm font-semibold text-slate-100 hover:text-indigo-300 transition-colors rounded-lg px-2 py-1 hover:bg-slate-800 select-none"
            >
              {viewMode === 'days' && (
                <>
                  <span>{MONTHS_LONG[viewMonth]}</span>
                  <span className="text-indigo-400">{viewYear}</span>
                </>
              )}
              {viewMode === 'months' && (
                <span className="text-indigo-400">{viewYear}</span>
              )}
              {viewMode === 'years' && (
                <span>{yearRange[0]} – {yearRange[yearRange.length - 1]}</span>
              )}
              <ChevronUp
                className={cn(
                  'w-3.5 h-3.5 text-slate-500 transition-transform duration-200',
                  viewMode === 'days' && 'rotate-180',
                  viewMode === 'months' && 'rotate-0',
                  viewMode === 'years' && 'rotate-0',
                )}
              />
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'days') nextMonth();
                else if (viewMode === 'years') setYearRangeCenter((c) => c + 20);
              }}
              className={cn(
                'p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors',
                viewMode === 'months' && 'invisible',
              )}
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* ── Vista: Anos ── */}
          {viewMode === 'years' && (
            <div className="grid grid-cols-4 gap-1">
              {yearRange.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => selectYear(y)}
                  className={cn(
                    'rounded-lg py-2 text-xs font-medium transition-colors',
                    y === viewYear
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700',
                    y === today.getFullYear() && y !== viewYear &&
                      'ring-1 ring-indigo-500/50 text-indigo-300',
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* ── Vista: Meses ── */}
          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS_SHORT.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => selectMonth(i)}
                  className={cn(
                    'rounded-lg py-2.5 text-sm font-medium transition-colors',
                    i === viewMonth
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700',
                    i === today.getMonth() &&
                      viewYear === today.getFullYear() &&
                      i !== viewMonth &&
                      'ring-1 ring-indigo-500/50 text-indigo-300',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ── Vista: Dias ── */}
          {viewMode === 'days' && (
            <>
              {/* Dias da semana */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((wd) => (
                  <span
                    key={wd}
                    className="text-center text-xs font-medium text-slate-500 py-1 select-none"
                  >
                    {wd}
                  </span>
                ))}
              </div>

              {/* Grade de dias */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {grid.map((day, i) => {
                  const isCurrentMonth = day.getMonth() === viewMonth;
                  const isSelected = selected ? isSameDay(day, selected) : false;
                  const isToday = isSameDay(day, today);

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={cn(
                        'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors',
                        !isCurrentMonth && 'text-slate-600',
                        isCurrentMonth && !isSelected && 'text-slate-300 hover:bg-slate-700',
                        isToday && !isSelected && 'ring-1 ring-indigo-400 text-indigo-300',
                        isSelected && 'bg-indigo-600 text-white font-semibold hover:bg-indigo-500',
                      )}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Rodapé — botão Hoje */}
              <div className="mt-3 pt-3 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => selectDay(today)}
                  className="w-full text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-1 rounded-lg hover:bg-slate-800"
                >
                  Hoje
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
