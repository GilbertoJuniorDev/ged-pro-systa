import { FileSearch } from 'lucide-react';

export function PortalHero() {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
          <FileSearch className="h-7 w-7 text-white" strokeWidth={1.75} />
        </div>
        <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Portal de Documentos Públicos
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
          Consulte e baixe documentos disponibilizados publicamente. Busque por nome, filtre por
          série e acesse o conteúdo em poucos cliques.
        </p>
      </div>
    </section>
  );
}
