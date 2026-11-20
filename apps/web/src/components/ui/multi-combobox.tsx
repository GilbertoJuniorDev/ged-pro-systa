'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MultiComboboxOption {
  readonly label: string;
  readonly value: string;
}

export interface MultiComboboxProps {
  readonly values: readonly string[];
  readonly onValuesChange: (values: string[]) => void;
  readonly options: readonly MultiComboboxOption[];
  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly error?: boolean;
}

// Acima desse número de itens selecionados, o gatilho troca os chips
// individuais por um resumo ("N selecionados") para manter altura fixa
// (single-line) e evitar layout shift conforme a seleção muda.
// Limitado a 2 (em vez de 3): rótulos PT-BR realistas (ex.: "Tecnologia da
// Informação") somados a 3 chips facilmente excedem a largura útil de campos
// estreitos (~200-320px neste app), então mantemos a distinção chip-vs-resumo
// significativa sem depender só do encolhimento flex para casos extremos.
const MAX_INLINE_CHIPS = 2;

// ─── Component ───────────────────────────────────────────────────────────────

export function MultiCombobox({
  values,
  onValuesChange,
  options,
  placeholder = 'Selecionar…',
  searchPlaceholder = 'Buscar…',
  disabled = false,
  className,
  error = false,
}: MultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedLabels = values
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter((label): label is string => Boolean(label));

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

  // Reset active index when filter changes
  useEffect(() => { setActiveIndex(0); }, [query]);

  function toggle(option: MultiComboboxOption) {
    if (values.includes(option.value)) {
      onValuesChange(values.filter((v) => v !== option.value));
    } else {
      onValuesChange([...values, option.value]);
    }
    // Popover permanece aberto — diferente do Combobox de seleção única,
    // aqui o usuário normalmente quer marcar mais de uma opção em sequência.
  }

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation();
    onValuesChange([]);
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
        if (filtered[activeIndex]) toggle(filtered[activeIndex]);
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 rounded-lg px-3.5 py-2.5 text-sm transition-colors',
          'border bg-surface text-left',
          error
            ? 'border-danger focus:ring-danger'
            : 'border-border focus:ring-ring',
          'focus:outline-none focus:ring-2 focus:border-transparent',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {selectedLabels.length === 0 ? (
          <span className="flex-1 truncate text-muted-foreground">{placeholder}</span>
        ) : selectedLabels.length > MAX_INLINE_CHIPS ? (
          <span className="flex-1 truncate">
            <span className="inline-flex items-center rounded-md bg-primary-soft px-1.5 py-0.5 text-xs font-medium text-primary">
              {selectedLabels.length} selecionados
            </span>
          </span>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            {selectedLabels.map((label) => (
              <span
                key={label}
                // min-w-0 + shrink (em vez de shrink-0): permite que o chip encolha
                // proporcionalmente quando a soma dos chips excede o espaço disponível,
                // deixando o próprio truncate/ellipsis do chip decidir onde cortar. Sem
                // isso, o item flex resiste a encolher abaixo do seu conteúdo e o
                // container pai (overflow-hidden) acaba cortando o chip no meio,
                // quebrando a forma arredondada em vez de reticências limpas.
                className="inline-flex min-w-0 max-w-[8rem] shrink items-center truncate rounded-md bg-primary-soft px-1.5 py-0.5 text-xs font-medium text-primary"
              >
                {label}
              </span>
            ))}
          </span>
        )}
        <ChevronDown
          className={cn(
            'w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Popover */}
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-max min-w-full overflow-hidden rounded-xl border border-border',
            'animate-dropdown-in bg-surface-elevated shadow-lg',
          )}
        >
          {/* Contagem + limpar seleção */}
          {values.length > 0 && (
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                {values.length} {values.length === 1 ? 'selecionado' : 'selecionados'}
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1 font-medium text-primary hover:text-primary-hover"
              >
                <X className="w-3 h-3" />
                Limpar seleção
              </button>
            </div>
          )}

          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className={cn(
                'flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground',
                'focus:outline-none',
              )}
            />
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
            className="max-h-52 overflow-y-auto py-1"
            role="listbox"
            aria-multiselectable="true"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nenhuma opção encontrada
              </li>
            ) : (
              filtered.map((option, i) => {
                const isSelected = values.includes(option.value);
                const isActive = i === activeIndex;

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => toggle(option)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors select-none',
                      isActive ? 'bg-foreground/10' : 'hover:bg-foreground/5',
                      isSelected ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    <Check
                      className={cn(
                        'w-3.5 h-3.5 shrink-0',
                        isSelected ? 'opacity-100 text-primary' : 'opacity-0',
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
