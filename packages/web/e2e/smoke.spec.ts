import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // App title should be visible
    await expect(page.getByRole('heading', { name: /drift/i })).toBeVisible();
  });

  test('has header with navigation', async ({ page }) => {
    await page.goto('/');

    // Header should be present
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();
  });

  test('has sidebar', async ({ page }) => {
    await page.goto('/');

    // Sidebar should be present
    const sidebar = page.getByRole('complementary');
    await expect(sidebar).toBeVisible();
  });

  test('has main content area', async ({ page }) => {
    await page.goto('/');

    // Main area should be present
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });
});
