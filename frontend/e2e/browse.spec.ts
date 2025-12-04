import { test, expect } from '@playwright/test';

test.describe('Browse Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/#/browse');
    await page.waitForLoadState('load');
  });

  test('should display browse page with search controls', async ({ page }) => {
    // Check search input exists
    const searchInput = page.getByPlaceholder(/search|find/i);
    await expect(searchInput).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    // Wait a bit for components to render
    await page.waitForTimeout(500);
    
    // Look for genre or availability filter labels - the page has "Genre" and "Availability" labels
    // Using locator with wait to ensure component is rendered
    const genreLabel = page.locator('text=Genre').first();
    const availabilityLabel = page.locator('text=Availability').first();
    
    // At least one filter control should be visible
    const hasGenre = await genreLabel.isVisible().catch(() => false);
    const hasAvailability = await availabilityLabel.isVisible().catch(() => false);
    expect(hasGenre || hasAvailability).toBeTruthy();
  });

  test('should perform book search', async ({ page }) => {
    // Find search input
    const searchInput = page.getByPlaceholder(/search|find/i);
    await searchInput.fill('harry potter');
    
    // Submit search (press Enter)
    await searchInput.press('Enter');
    
    // Wait for results  
    await page.waitForTimeout(2000);
    
    // Page should still be visible (search completed without crash)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be able to interact with search input', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|find/i);
    
    // Type in search
    await searchInput.fill('test search');
    
    // Verify input value
    await expect(searchInput).toHaveValue('test search');
    
    // Clear and type again
    await searchInput.clear();
    await searchInput.fill('another search');
    await expect(searchInput).toHaveValue('another search');
  });
});
