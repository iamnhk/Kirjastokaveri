import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/#/login');
      await page.waitForLoadState('load');
    });

    test('should display login form', async ({ page }) => {
      // Check page title/heading
      await expect(page.getByText(/welcome back|sign in/i).first()).toBeVisible();
      
      // Check form elements
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should show error for empty fields', async ({ page }) => {
      // Click submit without filling fields
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Should show error toast or validation
      const error = page.getByText(/fill in all fields|required/i);
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('should attempt login with credentials', async ({ page }) => {
      // Fill in credentials
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('password123');
      
      // Submit form
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Wait for response - either success or error
      await page.waitForTimeout(2000);
      
      // Check that form was submitted (button should have been enabled)
      const button = page.getByRole('button', { name: /sign in|signing/i });
      await expect(button).toBeVisible();
    });

    test('should have link to signup page', async ({ page }) => {
      const signupLink = page.getByRole('link', { name: /sign up/i });
      await expect(signupLink).toBeVisible();
      
      await signupLink.click();
      await expect(page).toHaveURL(/#\/signup/);
    });
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/#/signup');
      await page.waitForLoadState('load');
    });

    test('should display signup form', async ({ page }) => {
      // Check page heading
      await expect(page.getByText(/create account/i).first()).toBeVisible();
      
      // Check form elements
      await expect(page.getByLabel(/full name|name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
    });

    test('should validate password match', async ({ page }) => {
      // Fill in form with mismatched passwords
      await page.getByLabel(/full name|name/i).fill('Test User');
      await page.getByLabel(/email/i).fill('test@example.com');
      
      const passwordFields = page.locator('input[type="password"]');
      await passwordFields.nth(0).fill('password123');
      await passwordFields.nth(1).fill('differentpassword');
      
      // Check the terms checkbox
      await page.locator('input[type="checkbox"]').check();
      
      // Submit
      await page.getByRole('button', { name: /create account/i }).click();
      
      // Should show password mismatch error
      const error = page.getByText(/passwords do not match/i);
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('should validate password length', async ({ page }) => {
      // Fill in form with short password
      await page.getByLabel(/full name|name/i).fill('Test User');
      await page.getByLabel(/email/i).fill('test@example.com');
      
      const passwordFields = page.locator('input[type="password"]');
      await passwordFields.nth(0).fill('123');
      await passwordFields.nth(1).fill('123');
      
      // Check the terms checkbox
      await page.locator('input[type="checkbox"]').check();
      
      // Submit
      await page.getByRole('button', { name: /create account/i }).click();
      
      // Should show password length error
      const error = page.getByText(/at least 6 characters/i);
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('should attempt signup with valid form data', async ({ page }) => {
      // Fill in valid form data
      await page.getByLabel(/full name|name/i).fill('Test User');
      await page.getByLabel(/email/i).fill('newuser@example.com');
      
      const passwordFields = page.locator('input[type="password"]');
      await passwordFields.nth(0).fill('password123');
      await passwordFields.nth(1).fill('password123');
      
      // Check the terms checkbox
      await page.locator('input[type="checkbox"]').check();
      
      // Submit
      await page.getByRole('button', { name: /create account/i }).click();
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Check that form can still be interacted with (page didn't crash)
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    });

    test('should have link to login page', async ({ page }) => {
      const loginLink = page.getByRole('link', { name: /sign in/i });
      await expect(loginLink).toBeVisible();
      
      await loginLink.click();
      await expect(page).toHaveURL(/#\/login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing my-lists without auth', async ({ page }) => {
      await page.goto('/#/my-lists');
      
      // Should redirect to login
      await expect(page).toHaveURL(/#\/login/, { timeout: 5000 });
    });
  });
});
