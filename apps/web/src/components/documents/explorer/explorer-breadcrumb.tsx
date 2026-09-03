'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb';
import type { ArquivoDto, DossieDto } from '@/types';

interface Props {
  arquivo?: ArquivoDto;
  dossie?: DossieDto;
}

export function ExplorerBreadcrumb({ arquivo, dossie }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(patch: Record<string, string | undefined>): string {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    next.delete('page');
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const items: BreadcrumbItem[] = [
    { label: 'Documentos', href: hrefFor({ arquivo: undefined, dossie: undefined }) },
  ];
  if (arquivo) {
    items.push({
      label: `${arquivo.codigo} — ${arquivo.nome}`,
      href: dossie ? hrefFor({ dossie: undefined }) : undefined,
    });
  }
  if (dossie) {
    items.push({ label: dossie.nome });
  }

  return <Breadcrumb items={items} />;
}
