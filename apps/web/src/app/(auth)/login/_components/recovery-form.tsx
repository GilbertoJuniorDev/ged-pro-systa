'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { apiClient, ApiError } from '@/lib/api-client';

interface RecoveryFormProps {
  readonly onBack: () => void;
}

export function RecoveryForm({ onBack }: RecoveryFormProps) {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await apiClient.post('/auth/forgot-password', { email });
        toast.success(`Link de recuperação enviado para ${email}. Verifique sua caixa de entrada.`);
        onBack();
      } catch (err) {
        if (err instanceof ApiError) {
          toast.error(err.message);
        } else {
          toast.error('Erro ao enviar o e-mail. Tente novamente.');
        }
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar para o login
      </button>

      <h2 className="text-3xl font-bold text-foreground mb-2">Recuperar Senha</h2>
      <p className="text-muted-foreground mb-8">
        Digite seu e-mail abaixo. Enviaremos as instruções para você redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="recoveryEmail"
              className="block text-sm font-medium text-foreground mb-1"
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
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed"
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
    </div>
  );
}
