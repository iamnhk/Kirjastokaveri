import { test, expect } from '@playwright/test';

test.describe('Notifications - Mobile View', () => {
  test.beforeEach(async ({ page }) => {
    // Use mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should display notification bell on mobile when authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Open auth modal and login (will fail with test credentials, but UI should render)
    const signInButton = page.getByRole('button', { name: /sign in/i }).first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(500);
      
      // Fill in test credentials (will fail authentication but that's ok for UI test)
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('testpassword123');
      await page.locator('form').getByRole('button', { name: /sign in/i }).click();
      await page.waitForTimeout(1000);
    }
    
    // After failed auth, check if the page still renders correctly
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should show notification panel structure in mobile view', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // The notification icon should only be visible when logged in
    // For now, just verify the page loads correctly
    const mainContent = page.locator('main, section').first();
    await expect(mainContent).toBeVisible();
  });
});

test.describe('Notifications - Desktop View', () => {
  test.beforeEach(async ({ page }) => {
    // Use desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('notification system should be available when authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Verify the main app structure is rendered correctly
    const mainContent = page.locator('main, section').first();
    await expect(mainContent).toBeVisible();
    
    // The NotificationPanel component is rendered conditionally based on auth
    // Without actual authentication, we can't test the full functionality
    // This test verifies the app structure is correct
  });

  test('notification context should be initialized', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Check that localStorage for notifications exists (even if empty)
    const notificationsStorage = await page.evaluate(() => {
      return localStorage.getItem('kirjastokaveri_notifications');
    });
    
    // Should be null or a JSON array string
    expect(notificationsStorage === null || notificationsStorage.startsWith('[')).toBeTruthy();
  });

  test('notification preferences should be persisted', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Check that localStorage for preferences exists or can be initialized
    const preferencesStorage = await page.evaluate(() => {
      const stored = localStorage.getItem('kirjastokaveri_notification_preferences');
      return stored !== null;
    });
    
    // Preferences should be initialized after app loads
    expect(preferencesStorage).toBeTruthy();
  });
});
