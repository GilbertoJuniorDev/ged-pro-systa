import { mkdirSync } from 'node:fs';
import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator } from '@playwright/test';

import { VISUAL_OUT_DIR } from './support/visual-check';

/**
 * O portal público é sempre claro (ADR 0002). A Combobox compartilhada do filtro de série
 * pinta-se com os tokens semânticos, e o wrapper `.light` a torna um trecho de Tema claro —
 * então ela continua clara mesmo com o usuário em Tema escuro.
 */

/** Luminância relativa (WCAG) de um `rgb(...)`/`rgba(...)` computado. */
function luminanceOf(rgb: string): number {
  const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map((c) => {
    const s = Number(c) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

async function colorsOf(locator: Locator): Promise<{ background: string; color: string }> {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return { background: style.backgroundColor, color: style.color };
  });
}

test('a Combobox do portal continua clara com o usuário em Tema escuro', async ({ page }) => {
  await page.goto('/portal');
  await page.evaluate(() => window.localStorage.setItem('theme', 'dark'));
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
    .toBe(true);

  const trigger = page.getByRole('button', { name: /Todas as séries/ });
  const triggerColors = await colorsOf(trigger);
  expect(luminanceOf(triggerColors.background)).toBeGreaterThan(0.8);
  expect(luminanceOf(triggerColors.color)).toBeLessThan(0.1);

  await trigger.click();
  const popover = page.getByRole('listbox').locator('..');
  await expect(popover).toBeVisible();
  expect(luminanceOf((await colorsOf(popover)).background)).toBeGreaterThan(0.8);

  mkdirSync(VISUAL_OUT_DIR, { recursive: true });
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.screenshot({
    path: path.join(VISUAL_OUT_DIR, 'portal-combobox--dark.png'),
    animations: 'disabled',
  });

  const axe = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .include('.ged-portal .light')
    .analyze();
  expect(axe.violations).toEqual([]);
});
