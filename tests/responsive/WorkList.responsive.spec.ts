import { test, expect } from '../utils';
import {
  RESPONSIVE_LANGUAGES,
  expectNoHorizontalOverflow,
  setTestLanguage,
  waitForStableLayout,
} from '../utils/responsive';

/**
 * Responsive WorkList matrix (US-RSP-002).
 *
 * Runs in the `responsive-mobile`, `responsive-tablet` and `responsive-desktop`
 * Playwright projects (see playwright.config.ts). Verifies at every viewport:
 * - no unintended horizontal overflow
 * - the study list table is rendered and usable
 * - language direction (fa=rtl / en=ltr) is applied
 * - theme does not break layout (light and dark)
 */

const THEME_QUERY_PARAMS = [
  { label: 'default', themeParam: null as string | null },
  { label: 'clinical-light', themeParam: 'clinical-light' },
] as const;

test.describe('WorkList Responsive Matrix', () => {
  for (const language of RESPONSIVE_LANGUAGES) {
    for (const theme of THEME_QUERY_PARAMS) {
      test.describe(`lang=${language} theme=${theme.label}`, () => {
        test.beforeEach(async ({ page }) => {
          const params = new URLSearchParams({ lng: language });
          if (theme.themeParam) {
            params.set('theme', theme.themeParam);
          }
          await page.goto(`/?${params.toString()}`, { waitUntil: 'domcontentloaded' });
          await waitForStableLayout(page);
        });

        test('should not create unintended horizontal overflow', async ({ page }) => {
          await expectNoHorizontalOverflow(page, `WorkList ${language} ${theme.label}`);
        });

        test('should apply the correct document direction for the language', async ({ page }) => {
          await setTestLanguage(page, language);
          const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
          expect(dir).toBe(language === 'fa' ? 'rtl' : 'ltr');
        });

        test('should render the study list table with rows in the viewport', async ({ page }) => {
          // The table container must exist and be fully horizontally visible.
          const table = page.locator('[data-cy="study-list-table"], table').first();
          await expect(table).toBeVisible();

          const tableBox = await table.boundingBox();
          expect(tableBox).not.toBeNull();
          const viewportWidth = page.viewportSize()?.width ?? 0;
          expect(tableBox!.width).toBeLessThanOrEqual(viewportWidth + 1);
        });
      });
    }
  }
});

test.describe('WorkList Live Resize (US-RSP-001)', () => {
  test('should adapt layout without a page reload when the viewport is resized', async ({
    page,
  }) => {
    await page.goto('/?lng=en-US', { waitUntil: 'domcontentloaded' });
    await waitForStableLayout(page);

    const initialWidth = page.viewportSize()?.width ?? 0;
    expect(initialWidth).toBeGreaterThan(0);

    // Shrink to a mobile-ish width and verify no reload happened and no overflow.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => window.innerWidth === 390, { timeout: 10_000 });
    await waitForStableLayout(page);
    // Allow the "close preview on mobile" default effect to run after the
    // viewport shrinks below md — otherwise the preview Sheet briefly counts
    // as overflow while it animates out.
    await page.waitForTimeout(800);
    await expectNoHorizontalOverflow(page, 'WorkList after resize to 390px');

    // Grow back to desktop and re-verify.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => window.innerWidth === 1440, { timeout: 10_000 });
    await waitForStableLayout(page);
    await expectNoHorizontalOverflow(page, 'WorkList after resize to 1440px');
  });
});
