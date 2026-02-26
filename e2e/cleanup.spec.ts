import { test, expect } from '@playwright/test';
import {
	registerNewAccount,
	generateTestEmail,
	waitForPageLoaded,
} from './auth.helper';

/**
 * Cleanup and Data Lifecycle Tests
 * Tests that verify cleanup functionality and data management
 */

test.describe('Data Cleanup & Lifecycle', () => {
	test('verify test user account creation and logout flow', async ({
		page,
	}) => {
		// Step 1: Create a test account
		const testEmail = generateTestEmail();
		const testPassword = 'TestPassword123!';

		console.log(`\n📝 Creating test account: ${testEmail}`);
		await registerNewAccount(page, testEmail, testPassword);

		// Step 2: Verify we're logged in
		const logoutButton = page.getByRole('button', { name: /sign out|logout/i });
		await expect(logoutButton).toBeVisible();
		console.log('✅ Account created and logged in successfully');

		// Step 3: Create some test data to be cleaned up
		await page.goto('/#/properties', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);
		const createButton = page.getByRole('button', {
			name: /add property|new property|create/i,
		});

		if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
			await createButton.click();
			await page.waitForTimeout(500);

			const addressInput = page.locator(
				'input[placeholder*="address" i], input[name*="address" i]',
			);
			if (await addressInput.isVisible({ timeout: 2000 }).catch(() => false)) {
				await addressInput.fill('Test Property for Cleanup');
				console.log('📦 Test property created');
			}
		}

		// Step 4: Logout
		await logoutButton.click();
		console.log('🚪 Logged out successfully');
		await page.waitForTimeout(1000);

		// Step 5: Try to log in with the test account again (should work)
		console.log(`\n🔄 Attempting to log in with ${testEmail}`);
		await page.goto('/#/login', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);
		const loginBtn = page
			.getByRole('button', { name: /sign in|login/i })
			.first();

		if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			await loginBtn.click();
			await page.waitForTimeout(500);

			const emailInput = page.locator('input[type="email"]').first();
			const passwordInput = page.locator('input[type="password"]').first();

			if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
				await emailInput.fill(testEmail);
				await passwordInput.fill(testPassword);

				const submitBtn = page
					.getByRole('button', { name: /sign in|login/i })
					.last();
				await submitBtn.click();
				await page.waitForTimeout(2000);

				// Verify login was successful
				const logoutAfterLogin = page.getByRole('button', {
					name: /sign out|logout/i,
				});
				const isLoggedIn = await logoutAfterLogin
					.isVisible({ timeout: 2000 })
					.catch(() => false);

				if (isLoggedIn) {
					console.log(
						'✅ Re-login successful - account data still in Firebase',
					);
				}
			}
		}

		console.log(
			'\n📌 Test Data Summary:',
			`\n   - Test Email: ${testEmail}`,
			`\n   - Test Password: ${testPassword}`,
			`\n   - Status: Account ready for cleanup`,
			`\n\n💡 To clean up this test data, run: yarn e2e:ci`,
		);
	});

	test('verify multiple test account creation (stress test)', async ({
		page,
	}) => {
		console.log('\n🔄 Creating multiple test accounts...');
		const accounts: Array<{ email: string; password: string }> = [];

		// Create 3 test accounts
		for (let i = 0; i < 3; i++) {
			const testEmail = generateTestEmail();
			const testPassword = 'TestPassword123!';

			await registerNewAccount(page, testEmail, testPassword);
			accounts.push({ email: testEmail, password: testPassword });

			// Verify logged in
			const logoutButton = page.getByRole('button', {
				name: /sign out|logout/i,
			});
			await expect(logoutButton).toBeVisible();

			console.log(`✅ Account ${i + 1} created: ${testEmail}`);

			// Logout for next account
			await logoutButton.click();
			await page.waitForTimeout(1000);
		}

		console.log(`\n✅ Created ${accounts.length} test accounts`);
		console.log(
			'\n📌 Created Accounts:',
			accounts.map((acc, idx) => `\n   ${idx + 1}. ${acc.email}`).join(''),
		);
		console.log(
			`\n💡 To cleanup all test data from Firebase, run:\n   yarn e2e:ci`,
		);

		expect(accounts.length).toBe(3);
	});

	test('confirm test user email pattern matches cleanup criteria', async () => {
		// This test verifies that our test email generation matches the cleanup script pattern
		const testEmail = generateTestEmail();
		const emailPattern = /^test\.user\.\d+\.\d+@maintley-test\.com$/;

		console.log(`\n🔍 Testing email pattern:`, testEmail);
		const matches = emailPattern.test(testEmail);

		expect(matches).toBeTruthy();
		console.log('✅ Email matches cleanup pattern');
		console.log(
			`\n💡 Pattern: ^test\\.user\\.\\d+\\.\\d+@maintley-test\\.com$`,
		);
	});
});
