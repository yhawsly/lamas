import { test, expect } from '@playwright/test';

test.describe('Lecturer Assignment Blocking Logic', () => {
  test('Prevents HOD from assigning observation if lecturer is not assigned to course', async ({ page }) => {
    test.setTimeout(120000);
    // 1. Log in by directly filling credentials after hydration
    await page.goto('/login');
    await page.waitForTimeout(3000);
    await page.fill('input[type="email"]', 'superadmin@lamas.edu');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load (giving Next.js dev server time to compile)
    await expect(page).toHaveURL(/\/admin/, { timeout: 90000 });

    // 2. Go to the observations page (HOD/Admin can assign observations from here or a specific DEO page)
    // Actually, we'll hit the API directly using Playwright's `request` context, authenticated by the browser cookie.
    
    const context = page.context();
    
    // Attempt to create an observation where lecturer (ID 5) is NOT assigned to course "ENG101"
    const response = await context.request.post('/api/observations', {
      data: {
        lecturerId: 5,
        observerId: 6,
        courseCode: 'ENG101'
      }
    });

    // 3. Verify the block
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Assignment blocked: The observed lecturer is not assigned to course');
  });
});
