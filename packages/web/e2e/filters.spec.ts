import { test, expect } from '@playwright/test';

test.describe('Filter interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('sport type filter is visible', async ({ page }) => {
    await expect(page.getByText(/sport type/i)).toBeVisible();
  });

  test('date range filter is visible', async ({ page }) => {
    await expect(page.getByText(/date range/i)).toBeVisible();
  });

  test('can toggle sport type checkboxes', async ({ page }) => {
    // Find the Run checkbox
    const runCheckbox = page.getByLabel(/run/i);
    await expect(runCheckbox).toBeVisible();

    // Should be checked by default (all selected)
    await expect(runCheckbox).toBeChecked();

    // Click to uncheck
    await runCheckbox.click();
    await expect(runCheckbox).not.toBeChecked();

    // Click to check again
    await runCheckbox.click();
    await expect(runCheckbox).toBeChecked();
  });

  test('Select All button selects all sport types', async ({ page }) => {
    // First uncheck one
    const runCheckbox = page.getByLabel(/run/i);
    await runCheckbox.click();
    await expect(runCheckbox).not.toBeChecked();

    // Click Select All
    await page.getByRole('button', { name: /select all/i }).click();

    // Run should now be checked
    await expect(runCheckbox).toBeChecked();
  });

  test('Clear All button clears all sport types', async ({ page }) => {
    // Click Clear All
    await page.getByRole('button', { name: /clear all/i }).click();

    // All checkboxes should be unchecked
    const runCheckbox = page.getByLabel(/run/i);
    await expect(runCheckbox).not.toBeChecked();
  });

  test('date inputs accept values', async ({ page }) => {
    const fromInput = page.getByLabel(/from/i);
    const toInput = page.getByLabel(/to/i);

    await expect(fromInput).toBeVisible();
    await expect(toInput).toBeVisible();

    // Fill in dates
    await fromInput.fill('2024-01-01');
    await toInput.fill('2024-12-31');

    await expect(fromInput).toHaveValue('2024-01-01');
    await expect(toInput).toHaveValue('2024-12-31');
  });
});
