import type { Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';

/**
 * Canonical responsive test matrix for OHIF (US-RSP-002).
 *
 * These viewports mirror `BREAKPOINTS` in
 * `platform/ui-next/src/hooks/useResponsiveLayout.ts` and the `screens` config
 * in `platform/ui/tailwind.config.js`. Keep all three in sync.
 */
export const RESPONSIVE_VIEWPORTS = {
  mobileSmall: { width: 360, height: 640 },
  mobile: { width: 390, height: 844 },
  tabletPortrait: { width: 768, height: 1024 },
  tabletLandscape: { width: 1024, height: 768 },
  laptop: { width: 1280, height: 800 },
  desktop: { width: 1440, height: 900 },
  desktopLarge: { width: 1920, height: 1080 },
} as const;

export type ResponsiveViewportName = keyof typeof RESPONSIVE_VIEWPORTS;

export const RESPONSIVE_LANGUAGES = ['en-US', 'fa'] as const;
export type ResponsiveLanguage = (typeof RESPONSIVE_LANGUAGES)[number];

/** Asserts that no element creates unintended horizontal overflow at the current viewport. */
export async function expectNoHorizontalOverflow(page: Page, description = 'page'): Promise<void> {
  const overflow = await page.evaluate(() => {
    const documentWidth = document.documentElement.scrollWidth;
    const viewportWidth = window.innerWidth;

    const offenders: Array<{
      tag: string;
      id: string;
      className: string;
      scrollWidth: number;
      clientWidth: number;
    }> = [];

    for (const el of document.body.querySelectorAll<HTMLElement>('*')) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') {
        continue;
      }

      const rect = el.getBoundingClientRect();
      const isOffscreen = rect.width > 0 && (rect.right > viewportWidth + 1 || rect.left < -1);
      const isScrolling = el.scrollWidth > el.clientWidth + 1;

      if (isOffscreen || isScrolling) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          id: el.id,
          className: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        });
      }
    }

    return {
      documentWidth,
      viewportWidth,
      hasDocumentOverflow: documentWidth > viewportWidth + 1,
      offenders: offenders.slice(0, 10),
    };
  });

  const failureDetails =
    `Horizontal overflow detected for ${description} ` +
    `(document ${overflow.documentWidth}px > viewport ${overflow.viewportWidth}px). ` +
    `Offenders: ${JSON.stringify(overflow.offenders, null, 2)}`;

  expect(overflow.hasDocumentOverflow, failureDetails).toBe(false);
}

/** Sets the language via the i18n `lng` query parameter and waits for the direction attribute. */
export async function setTestLanguage(page: Page, language: ResponsiveLanguage): Promise<void> {
  const url = new URL(page.url());
  url.searchParams.set('lng', language);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });

  await expect
    .poll(async () => page.evaluate(() => document.documentElement.getAttribute('dir')), {
      timeout: 20_000,
    })
    .toBe(language === 'fa' ? 'rtl' : 'ltr');
}

/** Waits until the app root reports a stable, fully rendered layout. */
export async function waitForStableLayout(page: Page, timeout = 60_000): Promise<void> {
  await page
    .waitForFunction(
      () => {
        const root = document.querySelector('#root');
        return !!root && root.children.length > 0;
      },
      { timeout }
    )
    .catch(() => {
      // The dev bundle can take a while on first compile; fall back to the
      // load state so the caller's own assertions report the real problem.
    });
  // Allow one animation frame so resize observers settle before measuring.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
}
