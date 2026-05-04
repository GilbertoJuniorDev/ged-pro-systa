'use client';

import { useState, useTransition } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';

interface RecoveryFormProps {
  readonly onBack: () => void;
}

export function RecoveryForm({ onBack }: RecoveryFormProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await apiClient.post('/auth/forgot-password', { email });
        setSent(true);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Erro ao enviar o e-mail. Tente novamente.');
        }
      }
    });
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
              disabled={isPending}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Enviar link de recuperação
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
