'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import type { ExplorerView } from '@/hooks/use-explorer-params';

export const EXPLORER_VIEW_LABELS: Readonly<Record<ExplorerView, string>> = {
  arquivos: 'Arquivos',
  dossies: 'Dossiês',
  documentos: 'Documentos',
  avulsos: 'Avulsos',
};

const VIEWS: readonly { value: ExplorerView; label: string }[] = (
  Object.keys(EXPLORER_VIEW_LABELS) as ExplorerView[]
).map((value) => ({ value, label: EXPLORER_VIEW_LABELS[value] }));

export function ExplorerTabs({ active }: { active: ExplorerView }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get('q');
  const depto = searchParams.get('depto');

  const items: TabItem[] = VIEWS.map(({ value, label }) => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (depto) next.set('depto', depto);
    if (value !== 'arquivos') next.set('view', value);
    const qs = next.toString();
    return { value, label, href: qs ? `${pathname}?${qs}` : pathname };
  });

  return <Tabs items={items} active={active} />;
}
