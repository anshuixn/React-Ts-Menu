import { test, expect } from '@playwright/test';

test.describe('AuraSpice Order Flow', () => {
  test('Add to cart and checkout', async ({ page }) => {
    // Navigate to order page with table 01
    await page.goto('/order?table=01');

    // Wait for menu items to load (checking for Add to Cart buttons)
    await page.waitForSelector('button:has-text("Add to Cart")');

    // Add first item to cart
    const addButtons = page.locator('button:has-text("Add to Cart")');
    await addButtons.first().click();

    // Verify cart orb badge updates to 1
    const cartBadge = page.locator('#cart-badge');
    await expect(cartBadge).toHaveText('1');

    // Open cart
    await page.locator('#cart-orb').click();

    // Wait for cart drawer to open
    const cartDrawer = page.locator('.cart-drawer');
    await expect(cartDrawer).toBeVisible();

    // Click Place Order
    const placeOrderBtn = page.locator('button:has-text("Place Order")');
    await placeOrderBtn.click();

    // Wait for success overlay (it has a checkmark or success message)
    const successOverlay = page.locator('.success-overlay');
    await expect(successOverlay).toBeVisible();

    // Cart should be closed and badge should be 0 or hidden
    await expect(cartDrawer).toBeHidden();
  });
});
