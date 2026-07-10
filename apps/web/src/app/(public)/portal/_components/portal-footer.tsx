export function PortalFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500 sm:px-6">
        <p>&copy; {new Date().getFullYear()} GED Pro. Todos os direitos reservados.</p>
        <p className="mt-1 text-xs text-slate-400">
          Portal público de consulta e download de documentos. Alguns arquivos exigem um cadastro
          rápido antes do download.
        </p>
      </div>
    </footer>
  );
}
