import { Page } from '@playwright/test';

export class ReportDialogPageObject {
  constructor(private readonly page: Page) {}

  get locator() {
    return this.page.getByTestId('report-dialog-form');
  }

  get body() {
    return this.page.getByTestId('report-dialog-body');
  }

  get footer() {
    return this.page.getByTestId('report-dialog-footer');
  }

  get series() {
    return this.page.getByTestId('report-series');
  }

  get reportName() {
    return this.page.getByTestId('report-name');
  }

  get reportNameError() {
    return this.page.getByTestId('report-name-error');
  }

  get saveButton() {
    return this.page.getByTestId('report-save');
  }

  get cancelButton() {
    return this.page.getByTestId('report-cancel');
  }

  async save() {
    await this.saveButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
