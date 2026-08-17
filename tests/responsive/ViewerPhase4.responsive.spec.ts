import type { Locator, Page } from '@playwright/test';

import { addLengthMeasurement, expect, test, visitStudy } from '../utils';
import {
  expectNoHorizontalOverflow,
  setTestLanguage,
  waitForStableLayout,
  type ResponsiveLanguage,
} from '../utils/responsive';

const MEASUREMENT_STUDY_UID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
const SEGMENTATION_STUDY_UID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';

async function visitResponsiveViewer(
  page: Page,
  responsiveViewerPageObject,
  studyInstanceUID: string,
  mode: 'viewer' | 'segmentation',
  language: ResponsiveLanguage
) {
  await visitStudy(page, studyInstanceUID, mode, 2000);
  await setTestLanguage(page, language);
  await waitForStableLayout(page);
  await responsiveViewerPageObject.viewport.grid.waitFor({ state: 'visible', timeout: 60_000 });
}

async function expectTouchTarget(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

async function expectNoOverlap(locators: Locator[]) {
  const boxes = await Promise.all(locators.map(locator => locator.boundingBox()));
  boxes.forEach(box => expect(box).not.toBeNull());

  for (let leftIndex = 0; leftIndex < boxes.length; leftIndex++) {
    for (let rightIndex = leftIndex + 1; rightIndex < boxes.length; rightIndex++) {
      const left = boxes[leftIndex]!;
      const right = boxes[rightIndex]!;
      const horizontalIntersection =
        Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
      const verticalIntersection =
        Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);

      expect(horizontalIntersection > 0 && verticalIntersection > 0).toBe(false);
    }
  }
}

test.describe('Specialized panels (US-RSP-301)', () => {
  test('segmentation rows remain usable, mirrored, and internally scrollable on tablet', async ({
    page,
    rightPanelPageObject,
    responsiveViewerPageObject,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'responsive-mobile', 'touch tablet contract');
    await page.setViewportSize({ width: 1024, height: 768 });

    await visitResponsiveViewer(
      page,
      responsiveViewerPageObject,
      SEGMENTATION_STUDY_UID,
      'segmentation',
      'fa'
    );

    const segmentationPanel = rightPanelPageObject.labelMapSegmentationPanel;
    await rightPanelPageObject.openMobile();
    await segmentationPanel.select();
    await segmentationPanel.addSegmentationButton.click();
    await expect(segmentationPanel.panel.rows).toHaveCount(1);

    const firstSegment = segmentationPanel.panel.nthSegment(0);
    const actionsButton = firstSegment.actions.button;
    const primaryControls = [firstSegment.visibilityToggle, firstSegment.lockToggle, actionsButton];

    await expect(firstSegment.rowDataColorHex).toBeVisible();
    await expect(firstSegment.visibilityToggle).toBeVisible();
    await expect(firstSegment.lockToggle).toBeVisible();
    await expect(actionsButton).toBeVisible();
    await expect(firstSegment.title.locator('bdi')).toHaveAttribute('dir', 'auto');

    for (const control of primaryControls) {
      await expectTouchTarget(control);
    }
    await expectNoOverlap(primaryControls);

    const scrollViewport = segmentationPanel.panel.scrollViewport;
    await expect(scrollViewport).toHaveCSS('overscroll-behavior-y', 'contain');
    // Add inert test content to validate the actual ScrollArea behavior without
    // changing clinical segmentation data or requiring a drawing interaction.
    await scrollViewport.evaluate(viewport => {
      const content = viewport.firstElementChild;
      if (!content) {
        throw new Error('Segmentation ScrollArea has no content container');
      }
      const spacer = document.createElement('div');
      spacer.setAttribute('data-cy', 'responsive-scroll-spacer');
      spacer.style.height = '1000px';
      spacer.setAttribute('aria-hidden', 'true');
      content.appendChild(spacer);
    });
    await expect
      .poll(() => scrollViewport.evaluate(element => element.scrollHeight > element.clientHeight))
      .toBe(true);

    await scrollViewport.evaluate(element => element.scrollTo({ top: element.scrollHeight }));
    await expect
      .poll(() => scrollViewport.evaluate(element => element.scrollTop))
      .toBeGreaterThan(0);
    expect(await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBe(0);
    await scrollViewport.hover();
    await page.mouse.wheel(0, 400);
    expect(await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBe(0);
    await expectNoHorizontalOverflow(page, 'RTL segmentation panel');
  });

  test('measurement row keeps critical controls visible without overlap on tablet', async ({
    page,
    DOMOverlayPageObject,
    rightPanelPageObject,
    responsiveViewerPageObject,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'responsive-mobile', 'touch tablet contract');
    await page.setViewportSize({ width: 1024, height: 768 });

    await visitResponsiveViewer(
      page,
      responsiveViewerPageObject,
      MEASUREMENT_STUDY_UID,
      'viewer',
      'fa'
    );
    await addLengthMeasurement(page);
    await expect(DOMOverlayPageObject.viewport.measurementTracking.locator).toBeVisible();
    await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

    await rightPanelPageObject.openMobile();
    await rightPanelPageObject.measurementsPanel.select();
    await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(1);

    const measurement = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0);
    const controls = [
      measurement.visibilityToggle,
      measurement.lockToggle,
      measurement.actions.button,
    ];

    await expect(measurement.title.locator('bdi')).toHaveAttribute('dir', 'auto');
    for (const control of controls) {
      await expect(control).toBeVisible();
      await expectTouchTarget(control);
    }
    await expectNoOverlap(controls);
    await expectNoHorizontalOverflow(page, 'RTL measurement panel');
  });
});

test.describe('Report dialog forms (US-RSP-302)', () => {
  for (const language of ['en-US', 'fa'] as const) {
    test(`report form remains usable above a mobile keyboard (${language})`, async ({
      page,
      DOMOverlayPageObject,
      rightPanelPageObject,
      responsiveViewerPageObject,
    }, testInfo) => {
      test.skip(testInfo.project.name !== 'responsive-mobile', 'mobile-specific form contract');

      await visitResponsiveViewer(
        page,
        responsiveViewerPageObject,
        MEASUREMENT_STUDY_UID,
        'viewer',
        language
      );
      await addLengthMeasurement(page);
      await expect(DOMOverlayPageObject.viewport.measurementTracking.locator).toBeVisible();
      await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

      await rightPanelPageObject.openMobile();
      await rightPanelPageObject.measurementsPanel.select();
      await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(1);
      await rightPanelPageObject.measurementsPanel.panel.createReport();

      const report = DOMOverlayPageObject.dialog.report;
      await expect(report.locator).toBeVisible({ timeout: 60_000 });
      await expect(report.reportName).toHaveAttribute('aria-invalid', 'false');

      const seriesBox = await report.series.boundingBox();
      const nameBox = await report.reportName.boundingBox();
      expect(seriesBox).not.toBeNull();
      expect(nameBox).not.toBeNull();
      // The Select trigger and text input use different border widths, so a
      // sub-4px optical alignment tolerance avoids testing implementation detail.
      expect(Math.abs(seriesBox!.x - nameBox!.x)).toBeLessThanOrEqual(4);
      expect(nameBox!.y).toBeGreaterThan(seriesBox!.y + seriesBox!.height);

      await report.save();
      await expect(report.reportNameError).toBeVisible();
      await expect(report.reportName).toHaveAttribute('aria-invalid', 'true');
      await expect(report.locator).toBeVisible();

      // A shorter viewport approximates the space consumed by a software keyboard.
      await page.setViewportSize({ width: 390, height: 430 });
      await report.reportName.focus();
      const footerBox = await report.footer.boundingBox();
      expect(footerBox).not.toBeNull();
      expect(footerBox!.y + footerBox!.height).toBeLessThanOrEqual(431);
      await expect(report.footer).toHaveCSS('position', 'sticky');
      await expectNoHorizontalOverflow(page, `report dialog ${language}`);

      await report.cancel();
      await expect(report.locator).toBeHidden();
    });
  }
});
