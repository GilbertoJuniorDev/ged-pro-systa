import { NavLinkButton } from '@/components/ui/nav-link-button';

export function ModulesCard() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm hover:shadow-lg hover:border-slate-600 transition-all p-6 flex flex-col">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-violet-900/40 text-violet-400 rounded-xl flex items-center justify-center mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-100">Permissões de Módulos</h3>
          <span className="text-xs font-medium text-violet-400 bg-violet-900/30 px-2 py-0.5 rounded-full">Controle de Acesso</span>
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-6">Defina quais módulos do sistema estão ativos e configure o nível de acesso por perfil.</p>
      <div className="mt-auto">
        <NavLinkButton
          href="/admin/modulos"
          className="block w-full text-left px-4 py-2 text-sm font-medium text-violet-400 bg-violet-900/30 hover:bg-violet-900/50 rounded-lg transition-colors"
        >
          Gerenciar Módulos
        </NavLinkButton>
      </div>
    </div>
  );
}
