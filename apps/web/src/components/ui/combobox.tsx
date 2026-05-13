'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComboboxOption {
  readonly label: string;
  readonly value: string;
}

interface ComboboxProps {
  readonly value?: string;
  readonly onValueChange: (value: string) => void;
  readonly options: readonly ComboboxOption[];
  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly error?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = 'Selecionar…',
  searchPlaceholder = 'Buscar…',
  disabled = false,
  className,
  error = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()),
      )
    : options;

  // Focus search on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
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

  // Scroll active item into view
  useEffect(() => {
    const item = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function select(option: ComboboxOption) {
    onValueChange(option.value);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[activeIndex]) select(filtered[activeIndex]);
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  }

  // Reset active index when filter changes
  useEffect(() => { setActiveIndex(0); }, [query]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 rounded-lg px-3.5 py-2.5 text-sm transition-colors',
          'border bg-white text-left dark:bg-slate-800',
          error
            ? 'border-rose-500 focus:ring-rose-500'
            : 'border-slate-300 focus:ring-indigo-500 dark:border-slate-700',
          'focus:outline-none focus:ring-2 focus:border-transparent',
          selectedOption ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className="flex-1 truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Popover */}
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-max min-w-full overflow-hidden rounded-xl border border-slate-200',
            'animate-dropdown-in bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:shadow-2xl dark:shadow-black/40',
          )}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2.5 dark:border-slate-700/60">
            <Search className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className={cn(
                'flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-500 dark:text-slate-100',
                'focus:outline-none',
              )}
            />
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
            className="max-h-52 overflow-y-auto py-1"
            role="listbox"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500">
                Nenhuma opção encontrada
              </li>
            ) : (
              filtered.map((option, i) => {
                const isSelected = option.value === value;
                const isActive = i === activeIndex;

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => select(option)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors select-none',
                      isActive ? 'bg-slate-100 dark:bg-slate-700/80' : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                      isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200',
                    )}
                  >
                    <Check
                      className={cn(
                        'w-3.5 h-3.5 shrink-0',
                        isSelected ? 'opacity-100 text-indigo-400' : 'opacity-0',
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
