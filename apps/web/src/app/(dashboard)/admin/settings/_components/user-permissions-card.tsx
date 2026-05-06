import { NavLinkButton } from '@/components/ui/nav-link-button';

export function UserPermissionsCard() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm hover:shadow-lg hover:border-slate-600 transition-all p-6 flex flex-col">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-teal-900/40 text-teal-400 rounded-xl flex items-center justify-center mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-100">Permissões de Usuários</h3>
          <span className="text-xs font-medium text-teal-400 bg-teal-900/30 px-2 py-0.5 rounded-full">Gestão de Perfis</span>
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-6">Atribua funções, restrinja acessos e gerencie os privilégios individuais de cada usuário.</p>
      <div className="mt-auto">
        <NavLinkButton
          href="/admin/users"
          className="block w-full text-left px-4 py-2 text-sm font-medium text-teal-400 bg-teal-900/30 hover:bg-teal-900/50 rounded-lg transition-colors"
        >
          Gerenciar Usuários
        </NavLinkButton>
      </div>
    </div>
  );
}
