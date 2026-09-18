import type { ReactNode } from 'react';
import { getPortalAppearance } from '@/lib/appearance';
import { PortalAppearanceProvider } from '@/providers/appearance-provider';
import { buildPortalThemeCss, PORTAL_THEME_CLASS } from '@/lib/theme-style';
import { PortalHeader } from './_components/portal-header';
import { PortalFooter } from './_components/portal-footer';

// Chrome próprio do portal público — NÃO usa DashboardShell nem checagem de auth (a rota é
// liberada em middleware.ts para visitantes anônimos e usuários logados). Tema claro
// explícito (bg-slate-50/bg-white, sem `dark:`) para não herdar o dark-first do resto do app.
export default async function PortalLayout({ children }: { children: ReactNode }) {
  const appearance = await getPortalAppearance();
  const themeCss = buildPortalThemeCss(appearance);

  return (
    <div className={`${PORTAL_THEME_CLASS} flex min-h-screen flex-col bg-slate-50 text-slate-900`}>
      {/* Renderizado no servidor, antes do primeiro paint — evita FOUC. Ver
          lib/appearance.ts (fetch) e lib/theme-style.ts (CSS).

          O portal NÃO tem documento próprio: `(public)` é route group, então ele divide
          o mesmo <html> e o mesmo :root do sistema. Por isso o CSS abaixo tem escopo em
          .ged-portal (no <div> acima) e não em :root — sem isso, as rampas do SISTEMA
          tingiriam o portal. Custom properties herdam, então redefini-las no wrapper
          sobrescreve só esta subárvore.

          Duas ressalvas: (1) não há `createPortal` no app hoje, mas um overlay futuro
          montado em document.body escaparia deste escopo; (2) o <ThemeAwareToaster /> é
          montado na raiz, então toasts disparados aqui usam a rampa do sistema. */}
      <style id="ged-portal-theme-vars" dangerouslySetInnerHTML={{ __html: themeCss }} />
      <PortalAppearanceProvider appearance={appearance}>
        <PortalHeader />
        <main className="flex-1">{children}</main>
        <PortalFooter footerMessage={appearance.footerMessage} />
      </PortalAppearanceProvider>
    </div>
  );
}
