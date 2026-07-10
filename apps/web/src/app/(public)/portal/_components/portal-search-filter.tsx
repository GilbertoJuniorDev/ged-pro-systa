'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';

interface PortalSearchFilterProps {
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly serieId: string;
  readonly onSerieChange: (value: string) => void;
  readonly serieOptions: readonly ComboboxOption[];
}

const DEBOUNCE_MS = 400;

// Busca com debounce local (nice-to-have): mantém um rascunho controlado e só propaga
// para o pai (que dispara a query) depois que o usuário para de digitar.
export function PortalSearchFilter({
  search,
  onSearchChange,
  serieId,
  onSerieChange,
  serieOptions,
}: PortalSearchFilterProps) {
  const [draft, setDraft] = useState(search);

  useEffect(() => setDraft(search), [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== search) onSearchChange(draft);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Buscar por nome do documento…"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="w-full sm:w-64">
        {/* `light` força a Combobox (que usa `dark:` internamente) a ignorar o `.dark`
            ambiente do <html> — o portal público é sempre claro. Overrides correspondentes
            em app/globals.css (`.light .dark\:*`). */}
        <Combobox
          value={serieId}
          onValueChange={onSerieChange}
          options={serieOptions}
          placeholder="Todas as séries"
          className="light"
        />
      </div>
    </div>
  );
}
