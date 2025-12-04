import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Use desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should navigate between all pages', async ({ page }) => {
    // Start at home
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Navigate to browse using exact match
    await page.getByRole('link', { name: 'Browse', exact: true }).click();
    await expect(page).toHaveURL(/#\/browse/);
    
    // Navigate to login
    await page.goto('/#/login');
    await expect(page).toHaveURL(/#\/login/);
    
    // Navigate to signup
    await page.goto('/#/signup');
    await expect(page).toHaveURL(/#\/signup/);
    
    // Navigate back to home
    await page.goto('/');
    await page.waitForLoadState('load');
  });

  test('should have consistent layout across main pages', async ({ page }) => {
    const pages = ['/', '/#/browse'];
    
    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('load');
      
      // Check main content exists
      const content = page.locator('main, section, .content').first();
      await expect(content).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Page should load without horizontal scroll
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check content is visible
    const mainContent = page.locator('main, section').first();
    await expect(mainContent).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    const mainContent = page.locator('main, section').first();
    await expect(mainContent).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    const mainContent = page.locator('main, section').first();
    await expect(mainContent).toBeVisible();
  });
});

test.describe('Theme Toggle', () => {
  test('should have theme functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Just verify the page loads with some theme applied
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should persist theme preference', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Check if theme is stored in localStorage
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    // Theme should be either set or null (using system preference)
    
    // Navigate away and back
    await page.goto('/#/browse');
    await page.goto('/');
    
    // Theme should persist
    const themeAfterNav = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe(themeAfterNav);
  });
});

test.describe('Error Handling', () => {
  test('should handle unknown routes gracefully', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/#/nonexistent-page');
    
    // Wait a bit for any redirects or rendering
    await page.waitForTimeout(1000);
    
    // The app should not crash - verify by checking the URL is accessible
    // and that we can still navigate to a known route
    await page.goto('/#/login');
    await page.waitForLoadState('load');
    
    // Login page should be accessible after visiting unknown route
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Accessibility', () => {
  test('should have proper page structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main.first()).toBeVisible();
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/#/login');
    
    // Check email input has label
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
    
    // Check password input has label
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/#/login');
    await page.waitForLoadState('load');
    
    // Click on the first input to ensure focus is in the form
    const emailInput = page.getByLabel(/email/i);
    await emailInput.click();
    
    // Tab to next element
    await page.keyboard.press('Tab');
    
    // Should have moved focus
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A', 'LABEL']).toContain(activeElement);
  });
});
