import type { Metadata } from 'next';
import Link from 'next/link';
import { NavLinkButton } from '@/components/ui/nav-link-button';

export const metadata: Metadata = {
  title: 'Configurações Admin — GED Pro',
};

export default function AdminSettingsPage() {
  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100">Configurações Administrativas</h2>
        <p className="text-slate-400">Gerencie a infraestrutura, integrações e segurança do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Google Drive */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm hover:shadow-lg hover:border-slate-600 transition-all p-6 flex flex-col">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-900/40 text-blue-400 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Google Drive</h3>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full">Sincronizado</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-6">Ajuste as credenciais do Client ID e o mapeamento das pastas de upload.</p>
          <div className="mt-auto">
            <button type="button" className="w-full text-left px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700">
              Configurar Integração
            </button>
          </div>
        </div>

        {/* Backup */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm hover:shadow-lg hover:border-slate-600 transition-all p-6 flex flex-col">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-amber-900/40 text-amber-400 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Serviço de Backup</h3>
              <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Automático Ativo</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-6">Gerencie rotinas de segurança e realize backups manuais instantâneos.</p>
          <div className="mt-auto">
            <button type="button" className="w-full text-left px-4 py-2 text-sm font-medium text-indigo-400 bg-indigo-900/30 hover:bg-indigo-900/50 rounded-lg transition-colors">
              Executar Backup Agora
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm hover:shadow-lg hover:border-slate-600 transition-all p-6 flex flex-col">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-100">Logs de Atividade</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="text-[11px] bg-slate-800 p-2 rounded font-mono text-slate-400">[10:12] Sincronização Google concluída</div>
            <div className="text-[11px] bg-slate-800 p-2 rounded font-mono text-slate-400">[09:45] Usuário &apos;Admin&apos; alterou permissões</div>
          </div>
          <div className="mt-auto">
            <button type="button" className="w-full text-center px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
              Ver Logs Completos
            </button>
          </div>
        </div>

        {/* Permissões de Módulos */}
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
            <button type="button" className="w-full text-left px-4 py-2 text-sm font-medium text-violet-400 bg-violet-900/30 hover:bg-violet-900/50 rounded-lg transition-colors">
              Gerenciar Módulos
            </button>
          </div>
        </div>

        {/* Permissões de Usuários — funcional */}
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

        {/* Monitor de Desempenho — span full width */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm p-6 md:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-rose-900/40 text-rose-400 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-100 text-lg">Monitores de Desempenho</h3>
            </div>
            <span className="animate-pulse text-xs font-bold text-emerald-400 flex items-center">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
              SISTEMA ONLINE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">CPU</span>
                <span className="font-bold text-indigo-400">12%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '12%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">RAM</span>
                <span className="font-bold text-emerald-400">35%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Disco</span>
                <span className="font-bold text-rose-400">82%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: '82%' }} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

