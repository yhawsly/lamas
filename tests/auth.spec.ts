import { test, expect } from '@playwright/test';

test.describe('Role-based Redirection Verification', () => {
    test.setTimeout(120000);

    test('DEO login redirects to the DEO dashboard', async ({ page }) => {
        await page.goto('/login');
        await page.waitForTimeout(3000); // Allow hydration to complete
        await page.fill('input[type="email"]', 'deo@lamas.edu');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Check if the URL contains /deo
        await expect(page).toHaveURL(/\/deo/, { timeout: 90000 });
    });

    test('HOD login redirects to the HOD dashboard', async ({ page }) => {
        await page.goto('/login');
        await page.waitForTimeout(3000);
        await page.fill('input[type="email"]', 'ahmad@lamas.edu');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/\/hod/, { timeout: 90000 });
    });

    test('Lecturer login redirects to the Lecturer dashboard', async ({ page }) => {
        await page.goto('/login');
        await page.waitForTimeout(3000);
        await page.fill('input[type="email"]', 'slyyhaw@gmail.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/\/lecturer/, { timeout: 90000 });
    });
});
