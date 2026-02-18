import type { Locator, Page } from '@playwright/test';

export class SessionWorkspacePage {
  readonly page: Page;
  readonly queueItem: Locator;
  readonly acceptButton: Locator;
  readonly fieldState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.queueItem = page.getByTestId('queue-item');
    this.acceptButton = page.getByTestId('accept-button');
    this.fieldState = page.getByTestId('field-state');
  }

  async acceptCurrentItem(): Promise<void> {
    await this.acceptButton.click();
  }
}
