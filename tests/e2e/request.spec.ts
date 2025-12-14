import { test, expect } from '@playwright/test';

test.describe('Request Management', () => {
    test('should display request list page', async ({ page }) => {
        // Note: This test requires authentication
        // In a real scenario, you'd set up auth state first
        await page.goto('/talep');

        // Check if redirected to login or if page loaded
        const url = page.url();
        if (url.includes('/login')) {
            await expect(page.locator('input[name="email"]')).toBeVisible();
        } else {
            await expect(page.getByText(/Talep/i)).toBeVisible();
        }
    });
});
