import { Suspense } from 'react';
import { ResetPasswordForm } from './_components/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — formulário */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col justify-center px-8 sm:px-16 py-12 relative z-10 bg-white dark:bg-slate-900">
        {/* Logo */}
        <div className="absolute top-8 left-8 sm:left-16 flex items-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">GED Systa</span>
        </div>

        {/* Formulário */}
        <div className="w-full max-w-sm mx-auto mt-12">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        {/* Rodapé */}
        <div className="absolute bottom-8 left-8 sm:left-16 text-xs text-slate-400 dark:text-slate-600">
          &copy; 2026 GED Systa. Todos os direitos reservados.
        </div>
      </div>

      {/* Painel direito — marketing */}
      <div className="hidden md:flex flex-1 bg-slate-900 dark:bg-slate-950 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 opacity-90 dark:from-indigo-950 dark:via-slate-950 dark:to-slate-950 dark:opacity-95" />

        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:bg-indigo-700 dark:opacity-20" />
        <div className="absolute bottom-10 -left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:bg-blue-700 dark:opacity-15" />

        <div className="relative z-10 max-w-lg px-12 text-center">
          <div className="mb-8 flex justify-center">
            <svg className="w-20 h-20 text-indigo-400 dark:text-indigo-500 opacity-80 dark:opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Redefinição de Senha Segura
          </h2>
          <p className="text-lg text-slate-300 dark:text-slate-400 font-light">
            Crie uma nova senha forte para proteger o acesso aos documentos da sua empresa.
          </p>
          <div className="mt-10 inline-flex items-center px-4 py-2 rounded-full bg-slate-800 dark:bg-slate-900 border border-slate-700 text-sm font-medium text-slate-300">
            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
            Conexão criptografada
          </div>
        </div>
      </div>
    </div>
  );
}
