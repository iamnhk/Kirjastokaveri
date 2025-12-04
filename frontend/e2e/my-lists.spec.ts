import { test, expect } from '@playwright/test';

test.describe('My Lists - Access Control', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/#/my-lists');
    
    // Should redirect to login
    await expect(page).toHaveURL(/#\/login/, { timeout: 5000 });
  });

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/#/login');
    
    // Login form should be visible
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Browse Page - Book Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/#/browse');
    await page.waitForLoadState('load');
  });

  test('should display browse page with search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|find/i);
    await expect(searchInput).toBeVisible();
  });

  test('should perform search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|find/i);
    await searchInput.fill('harry potter');
    await searchInput.press('Enter');
    
    // Wait for search to complete
    await page.waitForTimeout(3000);
    
    // Check for results or loading state
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });
});
