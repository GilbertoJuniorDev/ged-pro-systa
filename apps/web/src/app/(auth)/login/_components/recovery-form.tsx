'use client';

import { useState } from 'react';

interface RecoveryFormProps {
  readonly onBack: () => void;
}

export function RecoveryForm({ onBack }: RecoveryFormProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-slate-500 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar para o login
      </button>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Recuperar Senha</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Digite seu e-mail abaixo. Enviaremos as instruções para você redefinir sua senha.
      </p>

      {sent ? (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-4 text-sm text-emerald-700 dark:text-emerald-400">
          Link de recuperação enviado para <strong>{email}</strong>. Verifique sua caixa de entrada.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="recoveryEmail"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              E-mail cadastrado
            </label>
            <input
              type="email"
              id="recoveryEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com.br"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 flex justify-center items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Enviar link de recuperação
          </button>
        </form>
      )}
    </div>
  );
}
