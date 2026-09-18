'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import type { ExplorerView } from '@/hooks/use-explorer-params';

const VIEWS: readonly { value: ExplorerView; label: string }[] = [
  { value: 'arquivos', label: 'Arquivos' },
  { value: 'dossies', label: 'Dossiês' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'avulsos', label: 'Avulsos' },
];

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
