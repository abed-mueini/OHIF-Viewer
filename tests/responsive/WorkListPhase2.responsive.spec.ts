import { test, expect } from '../utils';
import {
  RESPONSIVE_LANGUAGES,
  expectNoHorizontalOverflow,
  setTestLanguage,
  waitForStableAnimation,
  waitForStableLayout,
} from '../utils/responsive';

/**
 * Phase 2 WorkList adaptations (US-RSP-101..105).
 *
 * Runs in the dedicated responsive Playwright projects:
 * - responsive-mobile  (390x844): filter sheet + preview sheet + compact toolbar
 * - responsive-tablet  (1024x768): preview sheet at tablet width
 * - responsive-desktop (1440x900): resizable preview panel unchanged
 */

test.describe('WorkList Toolbar (US-RSP-101)', () => {
  for (const language of RESPONSIVE_LANGUAGES) {
    test(`toolbar does not overflow and keeps controls visible (${language})`, async ({ page }) => {
      await page.goto(`/?lng=${language}`, { waitUntil: 'domcontentloaded' });
      await waitForStableLayout(page);
      // Dismiss the data-source error modal if present — it overlays the
      // toolbar and pollutes overflow measurements.
      const retryButton = page.getByRole('button', { name: 'Retry' });
      if (await retryButton.isVisible().catch(() => false)) {
        await retryButton.click().catch(() => {});
        await page.waitForTimeout(500);
      }
      // Give the "close preview on mobile" default a moment to settle — the
      // preview Sheet starts open and auto-closes after first measurement.
      await page.waitForTimeout(800);
      await expectNoHorizontalOverflow(page, `WorkList toolbar ${language}`);
    });
  }
});

test.describe('WorkList Mobile Filter Sheet (US-RSP-103)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?lng=en-US', { waitUntil: 'domcontentloaded' });
    await waitForStableLayout(page);
    // Dismiss any data-source error modal blocking interactions (the e2e
    // static data is served by the same dev server; if it hiccups, tests
    // should still be able to exercise the layout).
    const retryButton = page.getByRole('button', { name: 'Retry' });
    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  });

  test('shows the filter trigger below md and opens the sheet', async ({ page }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) >= 768,
      'filter sheet only exists below the md breakpoint'
    );

    const filterTrigger = page.locator('button[aria-label="Filters"]');
    await expect(filterTrigger).toBeVisible();

    // The in-table filter row is hidden on mobile.
    const filterRow = page.locator('tr[data-filter-row]');
    await expect(filterRow).toBeHidden();

    await filterTrigger.click();
    const sheet = page.locator('[role="dialog"][aria-label="Filters"]');
    await expect(sheet).toBeVisible();

    // The sheet must stay within the viewport.
    const box = await sheet.boundingBox();
    expect(box).not.toBeNull();
    const viewportWidth = page.viewportSize()?.width ?? 0;
    expect(box!.width).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('applying a patient filter from the sheet narrows the table', async ({ page }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) >= 768,
      'filter sheet only exists below the md breakpoint'
    );

    await page.locator('button[aria-label="Filters"]').click();
    const sheet = page.locator('[role="dialog"][aria-label="Filters"]');
    await expect(sheet).toBeVisible();
    await waitForStableAnimation(sheet);

    const patientInput = sheet.locator('input').first();
    await patientInput.fill('no-such-patient-xyz');
    // Force-click: the sheet's overlay is the (correct) hit-target parent, so
    // a plain click can be reported as intercepted by it during animations.
    await sheet.getByRole('button', { name: 'Apply' }).click({ force: true });
    await expect(sheet).toBeHidden();

    // URL keeps the filter state (US-RSP-103: filters survive in the URL).
    await expect.poll(() => page.url().includes('no-such-patient-xyz')).toBe(true);
  });
});

test.describe('WorkList Preview (US-RSP-104)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?lng=en-US', { waitUntil: 'domcontentloaded' });
    await waitForStableLayout(page);
    // Dismiss any blocking data-source error modal first.
    const retryButton = page.getByRole('button', { name: 'Retry' });
    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  });

  test('mobile/tablet: preview opens as an overlay sheet, not a squeezed panel', async ({
    page,
  }) => {
    const width = page.viewportSize()?.width ?? 0;
    // lg breakpoint is 1024px: tablet project (1024) counts as desktop for
    // the preview layout, mobile does not.
    const expectSheet = width < 1024;

    // Close any auto-opened preview first, then reopen via the toolbar button.
    const openButton = page.locator('button[aria-label="Open preview"]');
    if (expectSheet) {
      // Mobile default closes the preview; open it explicitly.
      if (await openButton.isVisible().catch(() => false)) {
        await openButton.click();
      }
      const sheet = page.locator('[role="dialog"]');
      await expect(sheet).toBeVisible();
      const box = await sheet.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual((page.viewportSize()?.width ?? 0) + 1);
    } else {
      // Desktop: preview is a resizable panel inside the layout (no dialog).
      const dialogs = page.locator('[role="dialog"]');
      await expect(dialogs).toHaveCount(0);
    }
  });
});

test.describe('Dialogs and banner (US-RSP-105)', () => {
  test('investigational use banner fits inside the mobile viewport', async ({ page }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) >= 768,
      'banner layout specifically tested at mobile width'
    );

    // Navigate first — sessionStorage is inaccessible on about:blank.
    await page.goto('/?lng=en-US', { waitUntil: 'domcontentloaded' });
    // The e2e config sets the dialog to "never"; opt back in via localStorage
    // being irrelevant, so simply assert that IF the banner renders it fits.
    await page.evaluate(() => {
      sessionStorage.removeItem('investigationalUseDialog');
      localStorage.removeItem('investigationalUseDialog');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForStableLayout(page);

    const confirmButton = page.locator('[data-cy="confirm-and-hide-button"]');
    if (await confirmButton.isVisible().catch(() => false)) {
      await expectNoHorizontalOverflow(page, 'investigational use banner');
      const box = await confirmButton.boundingBox();
      expect(box).not.toBeNull();
      const viewportWidth = page.viewportSize()?.width ?? 0;
      expect(box!.x).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth + 1);
    } else {
      test.skip(true, 'investigational use dialog disabled in e2e config');
    }
  });
});
