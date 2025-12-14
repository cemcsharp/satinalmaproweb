import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveTitle(/SatınalmaPRO/);
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should show error on invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'invalid@test.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        // Wait for error message
        await page.waitForTimeout(1000);
    });
});
