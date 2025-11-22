import { test, expect } from '@playwright/test';

test('user can log in with valid credentials and access dashboard', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.fill('input[name="email"]', 'validuser@example.com');
  await page.fill('input[name="password"]', 'validpassword123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('text=Dashboard')).toBeVisible();
});