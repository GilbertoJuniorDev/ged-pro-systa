'use client';

import { useState } from 'react';
import { Logo } from '@/components/branding/logo';
import { LoginForm } from './login-form';
import { RecoveryForm } from './recovery-form';

export function LoginPageClient() {
  const [view, setView] = useState<'login' | 'recovery'>('login');

  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — formulário */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col justify-center px-8 sm:px-16 py-12 relative z-10 bg-surface animate-fade-in">
        {/* Logo */}
        <div className="absolute top-8 left-8 sm:left-16">
          <Logo scope="system" />
        </div>

        {/* Formulário */}
        <div key={view} className="w-full max-w-sm mx-auto mt-12 animate-slide-up">
          {view === 'login' ? (
            <LoginForm onForgotPassword={() => setView('recovery')} />
          ) : (
            <RecoveryForm onBack={() => setView('login')} />
          )}
        </div>

        {/* Rodapé */}
        <div className="absolute bottom-8 left-8 sm:left-16 text-xs text-muted-foreground">
          &copy; 2026 GED Pro. Todos os direitos reservados.
        </div>
      </div>

      {/* Painel direito — marketing. `dark` fixa o Tema escuro neste painel de marca
          nos dois Temas (tokens resolvem pelo ancestral .light/.dark mais próximo). */}
      <div className="dark hidden md:flex flex-1 bg-background relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-soft via-background to-background opacity-90" />

        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute bottom-10 -left-10 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob delay-150" />

        <div className="relative z-10 max-w-lg px-12 text-center">
          <div className="mb-8 flex justify-center">
            <svg className="w-20 h-20 text-primary opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-6 leading-tight">
            Gestão Inteligente de Documentos
          </h2>
          <p className="text-lg text-muted-foreground font-light">
            Centralize, organize e acesse todos os arquivos da sua empresa com segurança de ponta a ponta e alta disponibilidade.
          </p>
          <div className="mt-10 inline-flex items-center px-4 py-2 rounded-full bg-surface border border-border text-sm font-medium text-muted-foreground">
            <span className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
            Gestor de Documentos Ativo
          </div>
        </div>
      </div>
    </div>
  );
}
