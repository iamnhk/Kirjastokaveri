import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Use desktop viewport to ensure sidebar navigation is visible
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('load');
  });

  test('should display the home page', async ({ page }) => {
    // Check that page loaded and has main content
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });

  test('should have navigation links', async ({ page }) => {
    // Check for browse link in sidebar (exact match to avoid multiple elements)
    const browseLink = page.getByRole('link', { name: 'Browse', exact: true });
    await expect(browseLink).toBeVisible();
  });

  test('should navigate to browse page', async ({ page }) => {
    const browseLink = page.getByRole('link', { name: 'Browse', exact: true });
    await browseLink.click();
    
    await expect(page).toHaveURL(/#\/browse/);
  });

  test('should display popular books or discovery section', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for popular/trending/discover/library section
    const popularSection = page.getByText(/popular|trending|recommended|discover|library|books/i).first();
    await expect(popularSection).toBeVisible({ timeout: 10000 });
  });

  test('should have working layout', async ({ page }) => {
    // Verify main content area exists
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });
});
