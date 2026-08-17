import type { Locator, Page } from '@playwright/test';

/**
 * Responsive Viewer controls shared by the Viewer responsive specs.
 * Keeping these locators here prevents responsive tests from duplicating
 * locale-sensitive selectors as the Viewer layout evolves.
 */
export class ResponsiveViewerPageObject {
  constructor(private readonly page: Page) {}

  get header() {
    return {
      returnToWorkList: this.page.getByTestId('return-to-work-list'),
      patientInfo: this.page.getByTestId('patient-info'),
      patientDetails: this.page.getByTestId('patient-info-details'),
      options: this.page.getByTestId('header-options'),
      secondaryTools: this.page.getByTestId('viewer-secondary-tools'),
      primaryToolbar: this.page.getByTestId('viewer-primary-toolbar'),
      primaryToolButtons: this.page.locator(
        '[data-cy="viewer-primary-toolbar"] [data-tool] button'
      ),
    };
  }

  get viewport() {
    return {
      grid: this.page.getByTestId('viewport-grid'),
      panes: this.page.getByTestId('viewport-pane'),
      overlayCorners: [
        this.page.getByTestId('viewport-overlay-top-left'),
        this.page.getByTestId('viewport-overlay-top-right'),
        this.page.getByTestId('viewport-overlay-bottom-left'),
        this.page.getByTestId('viewport-overlay-bottom-right'),
      ] as Locator[],
    };
  }

  get panels() {
    return {
      openLeft: this.page.getByTestId('mobile-left-panel-open'),
      openRight: this.page.getByTestId('mobile-right-panel-open'),
      desktopLeftToggle: this.page.getByTestId('side-panel-header-left').first(),
      desktopRightToggle: this.page.getByTestId('side-panel-header-right').first(),
      sheet: this.page.getByRole('dialog'),
    };
  }

  get layout() {
    const container = this.page.getByTestId('Layout');
    return {
      container,
      trigger: container.getByRole('button'),
      disabledOptions: this.page.locator('[data-layout-disabled="true"]'),
    };
  }
}
