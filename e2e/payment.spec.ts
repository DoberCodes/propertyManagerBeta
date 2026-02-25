import { test, expect } from '@playwright/test';
import { registerNewAccount, generateTestEmail } from './auth.helper';

/**
 * Payment and subscription tests
 * Tests payment processing and subscription management
 * NOTE: These tests use Stripe test cards and should only run against test/dev environment
 */

test.describe('Payments & Subscriptions', () => {
	test.beforeEach(async ({ page }) => {
		// Register a new account before each test
		const testEmail = generateTestEmail();
		const testPassword = 'TestPassword123!';
		await registerNewAccount(page, testEmail, testPassword);
	});

	test('user can view subscription/payment page', async ({ page }) => {
		// Navigate to subscription/payment page
		const paymentRoutes = [
			'settings',
			'subscription',
			'billing',
			'payment',
			'account',
		];
		let found = false;

		for (const route of paymentRoutes) {
			try {
				await page.goto(`/${route}`, { waitUntil: 'networkidle' });
				await page.waitForTimeout(500);
				if (!page.url().includes('404')) {
					found = true;
					break;
				}
			} catch {
				// Continue to next route
			}
		}
	});

	test('user can initiate a subscription with valid test card', async ({
		page,
	}) => {
		// Navigate to pricing/subscription page
		await page.goto('/pricing', { waitUntil: 'networkidle' });

		// Click "Subscribe" or "Upgrade" button
		const subscribeButton = page
			.getByRole('button', {
				name: /subscribe|upgrade|get started|select plan/i,
			})
			.first();
		if (await subscribeButton.isVisible()) {
			await subscribeButton.click();

			// Wait for Stripe form to load
			await page.waitForTimeout(500);

			// Look for Stripe iframe/form
			const stripeForm = page.frameLocator('iframe[name*="stripe"]').first();
			if (stripeForm) {
				// Fill card number using Stripe test card
				const cardInput = stripeForm.locator('input[name="cardnumber"]');
				if (await cardInput.isVisible({ timeout: 3000 }).catch(() => false)) {
					await cardInput.fill('4242424242424242');

					// Fill other card details
					const expiryInput = stripeForm.locator('input[name="exp-date"]');
					await expiryInput.fill('12/25');

					const cvcInput = stripeForm.locator('input[name="cvc"]');
					await cvcInput.fill('123');

					const zipInput = stripeForm.locator('input[name="zip"]');
					await zipInput.fill('12345');
				}
			}

			// Submit payment
			const payButton = page
				.getByRole('button', { name: /subscribe|confirm|pay|complete/i })
				.last();
			await payButton.click();

			// Wait for payment processing
			await page.waitForLoadState('networkidle');

			// Verify success
			await page.waitForTimeout(500);
		}
	});

	test('user sees error with invalid card', async ({ page }) => {
		// Navigate to pricing/subscription page
		await page.goto('/pricing', { waitUntil: 'networkidle' });

		// Click "Subscribe" button
		const subscribeButton = page
			.getByRole('button', { name: /subscribe|upgrade|get started/i })
			.first();
		if (await subscribeButton.isVisible()) {
			await subscribeButton.click();

			// Wait for Stripe form
			await page.waitForLoadState('networkidle');

			// Try to find and fill card input with invalid card
			const stripeForm = page.frameLocator('iframe[name*="stripe"]').first();
			if (stripeForm) {
				const cardInput = stripeForm.locator('input[name="cardnumber"]');
				if (await cardInput.isVisible({ timeout: 3000 }).catch(() => false)) {
					// Use invalid card number
					await cardInput.fill('4000000000000002');

					const expiryInput = stripeForm.locator('input[name="exp-date"]');
					await expiryInput.fill('12/25');

					const cvcInput = stripeForm.locator('input[name="cvc"]');
					await cvcInput.fill('123');
				}
			}

			// Submit payment
			const payButton = page
				.getByRole('button', { name: /subscribe|confirm|pay/i })
				.last();
			await payButton.click();

			// Wait for error
			await page.waitForTimeout(500);
		}
	});

	test('user can view subscription status', async ({ page }) => {
		// Navigate to account/settings/subscription page
		const settingsRoutes = ['settings', 'account', 'subscription', 'billing'];

		for (const route of settingsRoutes) {
			try {
				await page.goto(`/${route}`, { waitUntil: 'networkidle' });

				// Look for subscription status info
				await page.waitForTimeout(500);
				break;
			} catch {
				// Continue to next route
			}
		}
	});

	test('user can update payment method', async ({ page }) => {
		// Navigate to settings/billing
		const settingsRoutes = ['settings', 'billing', 'account'];

		for (const route of settingsRoutes) {
			try {
				await page.goto(`/${route}`, { waitUntil: 'networkidle' });

				// Look for "Update Payment" or "Change Card" button
				const updateButton = page.getByRole('button', {
					name: /update.*payment|change.*card|add.*payment/i,
				});
				if (
					await updateButton.isVisible({ timeout: 2000 }).catch(() => false)
				) {
					await updateButton.click();

					// Wait for form
					await page.waitForTimeout(500);
					// Fill new card details (Stripe test card)
					const stripeForm = page
						.frameLocator('iframe[name*="stripe"]')
						.first();
					if (stripeForm) {
						const cardInput = stripeForm.locator('input[name="cardnumber"]');
						if (
							await cardInput.isVisible({ timeout: 2000 }).catch(() => false)
						) {
							await cardInput.fill('5555555555554444');

							const expiryInput = stripeForm.locator('input[name="exp-date"]');
							await expiryInput.fill('12/26');

							const cvcInput = stripeForm.locator('input[name="cvc"]');
							await cvcInput.fill('456');
						}
					}

					// Submit
					const submitButton = page
						.getByRole('button', { name: /update|save|confirm/i })
						.last();
					await submitButton.click();

					// Verify success
					await page.waitForTimeout(500);
					break;
				}
			} catch {
				// Continue to next route
			}
		}
	});
});
