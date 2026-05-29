import { test, expect, Route } from '@playwright/test';

// ─── Shared mock responses ────────────────────────────────────────────────────
const ORDER_SUCCESS = {
  success: true,
  order: { id: 'test-order-123', tracking_token: 'test-token-abc' },
};

const ORDER_ERROR = {
  success: false,
  message: 'Kitchen is closed for testing.',
};

/**
 * Intercept every POST to /api/orders/create and reply with a given payload.
 * Using page.route keeps tests hermetic — no real Supabase or network needed.
 */
async function mockOrderCreate(route: Route, body: object, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────
test.describe('AuraSpice Order Flow', () => {
  // Navigate to order page with table pre-selected so the table modal is skipped
  test.beforeEach(async ({ page }) => {
    await page.goto('/order?table=01');
    // Wait for at least one "Add to Cart" button to confirm menu has loaded
    await page.getByRole('button', { name: /add .* to cart/i }).first().waitFor();
  });

  // ── Happy path ─────────────────────────────────────────────────────────────
  test('adds item to cart and places order successfully', async ({ page }) => {
    // Intercept API before placing order
    await page.route('**/api/orders/create', (route) =>
      mockOrderCreate(route, ORDER_SUCCESS),
    );

    // Add first menu item
    await page.getByRole('button', { name: /add .* to cart/i }).first().click();

    // Cart badge should now show "1"
    const cartBadge = page.locator('#cart-badge');
    await expect(cartBadge).toHaveText('1');

    // Open cart via the orb button (accessible label)
    await page.getByRole('button', { name: /open cart/i }).click();

    // Cart drawer should be visible and announced as a dialog
    const cartDrawer = page.getByRole('dialog', { name: /your order/i });
    await expect(cartDrawer).toBeVisible();

    // Place the order
    await cartDrawer.getByRole('button', { name: /place order/i }).click();

    // Success overlay appears
    const successOverlay = page.locator('#success-overlay');
    await expect(successOverlay).toBeVisible({ timeout: 5000 });

    // Cart drawer closes automatically after success
    await expect(cartDrawer).toBeHidden({ timeout: 5000 });

    // Badge disappears (cart cleared)
    await expect(cartBadge).toBeHidden();
  });

  // ── Error path ─────────────────────────────────────────────────────────────
  test('shows inline error when order API returns a failure', async ({ page }) => {
    // Intercept API with a non-ok response
    await page.route('**/api/orders/create', (route) =>
      mockOrderCreate(route, ORDER_ERROR, 500),
    );

    // Add an item and open cart
    await page.getByRole('button', { name: /add .* to cart/i }).first().click();
    await page.getByRole('button', { name: /open cart/i }).click();

    const cartDrawer = page.getByRole('dialog', { name: /your order/i });
    await expect(cartDrawer).toBeVisible();

    // Attempt checkout
    await cartDrawer.getByRole('button', { name: /place order/i }).click();

    // Inline error message should appear inside the cart drawer (no browser alert)
    const errorMsg = cartDrawer.locator('[role="alert"]');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
    await expect(errorMsg).toContainText('Kitchen is closed for testing.');

    // Drawer stays open; success overlay must NOT appear
    await expect(cartDrawer).toBeVisible();
    await expect(page.locator('#success-overlay')).not.toBeVisible();
  });

  // ── Status orb ─────────────────────────────────────────────────────────────
  test('opens status drawer via status orb', async ({ page }) => {
    await page.getByRole('button', { name: /view order status/i }).click();

    // Status drawer is a dialog with an accessible name
    const statusDrawer = page.getByRole('dialog', { name: /order status/i });
    await expect(statusDrawer).toBeVisible();

    // Close with the close button
    await statusDrawer.getByRole('button', { name: /close/i }).click();
    await expect(statusDrawer).toBeHidden();
  });
});
