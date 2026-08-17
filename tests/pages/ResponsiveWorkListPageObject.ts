import type { Page } from '@playwright/test';

/** Stable responsive WorkList surface for layout assertions. */
export class ResponsiveWorkListPageObject {
  constructor(private readonly page: Page) {}

  get table() {
    return this.page.locator('[data-cy="study-list-table"], table').first();
  }
}
