import { defineVisualSuite } from './support/visual-check';
import { parseScreens } from './support/visual-screens';

/**
 * Harness de verificação visual — rotas vêm do ambiente (ver `test/e2e/VISUAL.md`):
 *   VISUAL_PUBLIC_ROUTES  rotas sem login      (default: /login)
 *   VISUAL_ROUTES         rotas como admin     (default: /)
 */
defineVisualSuite(
  parseScreens(
    process.env['VISUAL_PUBLIC_ROUTES'] ?? '/login',
    process.env['VISUAL_ROUTES'] ?? '/',
  ),
);
