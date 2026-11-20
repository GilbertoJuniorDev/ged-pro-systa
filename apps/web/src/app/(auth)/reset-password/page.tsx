import { Suspense } from 'react';
import { ResetPasswordForm } from './_components/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — formulário */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col justify-center px-8 sm:px-16 py-12 relative z-10 bg-surface animate-fade-in">
        {/* Logo */}
        <div className="absolute top-8 left-8 sm:left-16 flex items-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3 shadow-md">
            <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">GED Pro</span>
        </div>

        {/* Formulário */}
        <div className="w-full max-w-sm mx-auto mt-12 animate-slide-up">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-background" />}>
            <ResetPasswordForm />
          </Suspense>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-6 leading-tight">
            Redefinição de Senha Segura
          </h2>
          <p className="text-lg text-muted-foreground font-light">
            Crie uma nova senha forte para proteger o acesso aos documentos da sua empresa.
          </p>
          <div className="mt-10 inline-flex items-center px-4 py-2 rounded-full bg-surface border border-border text-sm font-medium text-muted-foreground">
            <span className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
            Conexão criptografada
          </div>
        </div>
      </div>
    </div>
  );
}
