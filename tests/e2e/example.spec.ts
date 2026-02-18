import { test, expect } from '../support/fixtures';
import { SessionWorkspacePage } from '../support/page-objects/session-workspace.page';

test.describe('Tabulara Verification Queue', () => {
  test('resolves a queued value with source-aware confirmation', async ({ page, domainFactories }) => {
    const queuedField = domainFactories.createDocumentRecord({
      fieldKey: 'total_amount',
      rawValue: '$42.00',
      normalizedValue: '42.00',
    });

    await page.route('**/api/review/**/resolve', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'resolved', id: queuedField.id }),
      });
    });

    await test.step('Given a queue item and visible provenance context', async () => {
      await page.setContent(`
        <section data-testid="queue-item" data-source-id="${queuedField.id}">
          <header>
            <span data-testid="field-key">${queuedField.fieldKey}</span>
            <span data-testid="provenance-link">Page 1 · Line 12</span>
          </header>
          <div>
            <span data-testid="field-value">${queuedField.rawValue}</span>
            <button data-testid="accept-button">Accept</button>
            <span data-testid="field-state">open</span>
          </div>
        </section>
        <script>
          const button = document.querySelector('[data-testid="accept-button"]');
          button.addEventListener('click', async () => {
            await fetch('https://tabulara.local/api/review/${queuedField.id}/resolve', { method: 'POST' });
            document.querySelector('[data-testid="field-state"]').textContent = 'resolved';
          });
        </script>
      `);
    });

    const workspace = new SessionWorkspacePage(page);

    await test.step('When the reviewer accepts the current value', async () => {
      await workspace.acceptCurrentItem();
    });

    await test.step('Then the queue item transitions to resolved', async () => {
      await expect(workspace.fieldState).toHaveText('resolved');
      await expect(page.getByTestId('provenance-link')).toContainText('Page 1');
    });
  });
});
