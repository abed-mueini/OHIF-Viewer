import { test, expect, visitStudy } from '../utils';
import {
  RESPONSIVE_LANGUAGES,
  RESPONSIVE_VIEWPORTS,
  expectNoHorizontalOverflow,
  setTestLanguage,
  waitForStableLayout,
} from '../utils/responsive';

/**
 * Phase 3 Viewer adaptations (US-RSP-201..205).
 *
 * Runs in the dedicated responsive Playwright projects:
 * - responsive-mobile  (390x844): header wrap, panel overlays, single grid
 * - responsive-tablet  (1024x768): overlay panels, tablet grid limits
 * - responsive-desktop (1440x900): desktop baseline unchanged
 */

const STUDY_UID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';

async function visitResponsiveViewer(page, responsiveViewerPageObject, language = 'en-US') {
  await visitStudy(page, STUDY_UID, 'viewer', 2000);
  await setTestLanguage(page, language);
  await waitForStableLayout(page);
  await responsiveViewerPageObject.viewport.grid.waitFor({ state: 'visible', timeout: 60_000 });
}

test.describe('Viewer Header (US-RSP-201)', () => {
  for (const language of RESPONSIVE_LANGUAGES) {
    test(`header renders without overlap or overflow (${language})`, async ({
      page,
      responsiveViewerPageObject,
    }) => {
      await visitResponsiveViewer(page, responsiveViewerPageObject, language);

      // Return-to-work-list, patient info and settings must all be present.
      await expect(responsiveViewerPageObject.header.returnToWorkList).toBeVisible();
      await expect(responsiveViewerPageObject.header.patientInfo).toBeVisible();
      await expect(responsiveViewerPageObject.viewport.panes.first()).toBeVisible();

      if ((page.viewportSize()?.width ?? 0) < 1280) {
        await responsiveViewerPageObject.header.patientInfo.click();
        await expect(responsiveViewerPageObject.header.patientDetails).toBeVisible();
      }

      await expectNoHorizontalOverflow(page, `viewer header ${language}`);
    });
  }
});

test.describe('Viewer Toolbar (US-RSP-202)', () => {
  test.beforeEach(async ({ page, responsiveViewerPageObject }) => {
    await visitResponsiveViewer(page, responsiveViewerPageObject);
  });

  test('primary toolbar never creates horizontal overflow', async ({ page }) => {
    // The toolbar wraps below lg instead of scrolling; verify at any width.
    await expectNoHorizontalOverflow(page, 'viewer toolbar');
  });

  test('toolbar buttons keep their hit targets', async ({ page, responsiveViewerPageObject }) => {
    // The primary toolbar container must exist; each rendered tool button is
    // an icon-sized control. We assert at least one is interactive.
    const toolbarButtons = responsiveViewerPageObject.header.primaryToolButtons.first();
    await expect(toolbarButtons).toBeVisible();
    const box = await toolbarButtons.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Viewer Side Panels (US-RSP-203)', () => {
  test.beforeEach(async ({ page, responsiveViewerPageObject }) => {
    await visitResponsiveViewer(page, responsiveViewerPageObject);
  });

  test('below xl: panels open as overlay sheets; viewport grid keeps full width', async ({
    page,
    responsiveViewerPageObject,
  }) => {
    const width = page.viewportSize()?.width ?? 0;
    const isMobileLayout = width < 1280;

    if (!isMobileLayout) {
      test.skip(true, 'overlay panels only exist below the Viewer desktop breakpoint');
    }

    // The mobile panel open buttons exist instead of the desktop tab strip.
    const rightPanelButton = responsiveViewerPageObject.panels.openRight;
    await expect(rightPanelButton).toBeVisible();

    // Opening the panel must not shrink the viewport grid (overlay, not side-by-side).
    const grid = responsiveViewerPageObject.viewport.grid;
    const gridWidthBefore = (await grid.boundingBox())?.width ?? 0;

    await rightPanelButton.click();
    const sheet = responsiveViewerPageObject.panels.sheet;
    await expect(sheet).toBeVisible();

    const gridWidthAfter = (await grid.boundingBox())?.width ?? 0;
    expect(Math.abs(gridWidthAfter - gridWidthBefore)).toBeLessThan(2);

    // Escape closes the overlay.
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });

  test('Viewer desktop: resizable panel layout is preserved', async ({
    page,
    responsiveViewerPageObject,
  }) => {
    const width = page.viewportSize()?.width ?? 0;
    if (width < 1280) {
      test.skip(true, 'desktop resizable layout only exists from the xl breakpoint');
    }

    // The mobile overlay buttons must NOT exist on the desktop layout.
    await expect(responsiveViewerPageObject.panels.openRight).toHaveCount(0);
    await expect(responsiveViewerPageObject.panels.openLeft).toHaveCount(0);
  });
});

test.describe('Viewport Grid (US-RSP-204)', () => {
  test('below xl: layout selector disables oversized presets', async ({
    page,
    responsiveViewerPageObject,
  }) => {
    const width = page.viewportSize()?.width ?? 0;
    if (width >= 1280) {
      test.skip(true, 'layout caps only apply below the Viewer desktop breakpoint');
    }

    await visitResponsiveViewer(page, responsiveViewerPageObject);

    // Open the layout selector.
    const layoutTrigger = responsiveViewerPageObject.layout.trigger;
    await layoutTrigger.click();

    // Oversized grid cells render disabled instead of silently changing layout.
    const disabledCount = await responsiveViewerPageObject.layout.disabledOptions.count();
    expect(disabledCount).toBeGreaterThan(0);
  });
});

test.describe('Viewer final responsive audit (US-RSP-401/402)', () => {
  test('keeps medical content in view across every required width', async ({
    page,
    responsiveViewerPageObject,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'responsive-desktop', 'full width audit runs once');

    await visitResponsiveViewer(page, responsiveViewerPageObject, 'fa');

    for (const [name, viewport] of Object.entries(RESPONSIVE_VIEWPORTS)) {
      await page.setViewportSize(viewport);
      await page.waitForFunction(width => window.innerWidth === width, viewport.width);
      await waitForStableLayout(page);

      await expect(responsiveViewerPageObject.header.patientInfo).toBeVisible();
      await expect(responsiveViewerPageObject.viewport.grid).toBeVisible();
      if (viewport.width < 1280) {
        await expect(responsiveViewerPageObject.panels.openRight).toBeVisible();
      } else {
        await expect(responsiveViewerPageObject.panels.openRight).toHaveCount(0);
      }
      await expectNoHorizontalOverflow(page, `Viewer RTL at ${name}`);
    }
  });

  test('opens compact patient details through the keyboard', async ({
    page,
    responsiveViewerPageObject,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'responsive-mobile', 'compact header contract');

    await visitResponsiveViewer(page, responsiveViewerPageObject, 'fa');
    await responsiveViewerPageObject.header.patientInfo.focus();
    await expect(responsiveViewerPageObject.header.patientInfo).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(responsiveViewerPageObject.header.patientDetails).toBeVisible();
  });

  test('opens a desktop side panel through the keyboard', async ({
    page,
    responsiveViewerPageObject,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'responsive-desktop', 'desktop panel keyboard contract');

    await visitResponsiveViewer(page, responsiveViewerPageObject);
    const panelToggle = responsiveViewerPageObject.panels.desktopRightToggle;
    await panelToggle.focus();
    await expect(panelToggle).toBeFocused();
    const initialState = await panelToggle.getAttribute('aria-expanded');
    await page.keyboard.press('Enter');
    await expect.poll(() => panelToggle.getAttribute('aria-expanded')).not.toBe(initialState);
  });

  test('removes nonessential motion when requested', async ({
    page,
    responsiveViewerPageObject,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'responsive-mobile', 'reduced-motion mobile contract');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await visitResponsiveViewer(page, responsiveViewerPageObject);
    await responsiveViewerPageObject.panels.openRight.click();
    await expect(responsiveViewerPageObject.panels.sheet).toBeVisible();

    const transitionDuration = await responsiveViewerPageObject.panels.sheet.evaluate(element => {
      const value = window.getComputedStyle(element).transitionDuration.split(',')[0].trim();
      return value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;
    });
    expect(transitionDuration).toBeLessThanOrEqual(1);
  });
});

test.describe('Viewport Overlays (US-RSP-205)', () => {
  test.beforeEach(async ({ page, responsiveViewerPageObject }) => {
    await visitResponsiveViewer(page, responsiveViewerPageObject);
  });

  test('overlay corners stay inside the viewport pane', async ({ responsiveViewerPageObject }) => {
    const pane = responsiveViewerPageObject.viewport.panes.first();
    await expect(pane).toBeVisible();

    const paneBox = await pane.boundingBox();
    expect(paneBox).not.toBeNull();

    for (const corner of responsiveViewerPageObject.viewport.overlayCorners) {
      const cornerElement = corner.first();
      const visible = await cornerElement.isVisible().catch(() => false);
      if (!visible) {
        continue;
      }
      const box = await cornerElement.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(paneBox!.x - 1);
      expect(box!.y).toBeGreaterThanOrEqual(paneBox!.y - 1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(paneBox!.x + paneBox!.width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(paneBox!.y + paneBox!.height + 1);
    }
  });
});
