'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type ExplorerView = 'arquivos' | 'dossies' | 'documentos' | 'avulsos';
export type AvulsosView = 'documentos' | 'dossies';

export interface ExplorerParams {
  readonly view: ExplorerView;
  readonly q: string;
  readonly arquivo?: string;
  readonly dossie?: string;
  readonly page: number;
  readonly depto: string;
  readonly status: string;
  readonly fase: string;
  readonly conf: string;
  readonly avulsos: AvulsosView;
}

export type ExplorerMode = 'arquivo-drill' | 'dossie-drill' | 'view';

type ParamPatch = Partial<Record<keyof ExplorerParams, string | number | undefined>>;

const VALID_VIEWS: readonly ExplorerView[] = ['arquivos', 'dossies', 'documentos', 'avulsos'];

function isDefault(key: keyof ExplorerParams, value: string | number | undefined): boolean {
  if (value === undefined || value === '') return true;
  if (key === 'view' && value === 'arquivos') return true;
  if (key === 'avulsos' && value === 'documentos') return true;
  if (key === 'page' && value === 1) return true;
  return false;
}

export function useExplorerParams(): {
  params: ExplorerParams;
  mode: ExplorerMode;
  setParams: (patch: ParamPatch, opts?: { mode: 'push' | 'replace' }) => void;
  setTab: (view: ExplorerView) => void;
  drillArquivo: (arquivoId: string) => void;
  drillDossie: (arquivoId: string | undefined, dossieId: string) => void;
  goToRoot: (view?: ExplorerView) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawView = searchParams.get('view');
  const view: ExplorerView = VALID_VIEWS.includes(rawView as ExplorerView)
    ? (rawView as ExplorerView)
    : 'arquivos';
  const rawAvulsos = searchParams.get('avulsos');
  const avulsos: AvulsosView = rawAvulsos === 'dossies' ? 'dossies' : 'documentos';
  const rawPage = Number(searchParams.get('page'));

  const params: ExplorerParams = {
    view,
    q: searchParams.get('q') ?? '',
    arquivo: searchParams.get('arquivo') ?? undefined,
    dossie: searchParams.get('dossie') ?? undefined,
    page: Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1,
    depto: searchParams.get('depto') ?? '',
    status: searchParams.get('status') ?? '',
    fase: searchParams.get('fase') ?? '',
    conf: searchParams.get('conf') ?? '',
    avulsos,
  };

  const mode: ExplorerMode = params.dossie ? 'dossie-drill' : params.arquivo ? 'arquivo-drill' : 'view';

  function setParams(patch: ParamPatch, opts: { mode: 'push' | 'replace' } = { mode: 'replace' }): void {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of Object.keys(patch) as (keyof ExplorerParams)[]) {
      const value = patch[key];
      if (isDefault(key, value)) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    const qs = next.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (opts.mode === 'push') {
      router.push(url);
    } else {
      router.replace(url, { scroll: false });
    }
  }

  function setTab(nextView: ExplorerView): void {
    setParams(
      {
        view: nextView,
        arquivo: undefined,
        dossie: undefined,
        page: undefined,
        status: undefined,
        fase: undefined,
        conf: undefined,
        avulsos: undefined,
      },
      { mode: 'push' },
    );
  }

  function drillArquivo(arquivoId: string): void {
    setParams({ arquivo: arquivoId, dossie: undefined, page: undefined }, { mode: 'push' });
  }

  function drillDossie(arquivoId: string | undefined, dossieId: string): void {
    setParams({ arquivo: arquivoId, dossie: dossieId, page: undefined }, { mode: 'push' });
  }

  function goToRoot(nextView?: ExplorerView): void {
    setParams(
      { view: nextView ?? params.view, arquivo: undefined, dossie: undefined, page: undefined },
      { mode: 'push' },
    );
  }

  return { params, mode, setParams, setTab, drillArquivo, drillDossie, goToRoot };
}
