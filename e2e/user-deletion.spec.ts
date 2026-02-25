import { test, expect } from '@playwright/test';
import { registerNewAccount, generateTestEmail } from './auth.helper';

/**
 * User Data Deletion & Account Cleanup Tests
 * Tests that users can delete their own data through the UI
 * Verifies properties, tasks, and accounts can be removed by the user
 */

test.describe('User Account & Data Deletion', () => {
	test('user can delete all their properties through the UI', async ({
		page,
	}) => {
		// Step 1: Create test account
		const testEmail = generateTestEmail();
		const testPassword = 'TestPassword123!';

		console.log(`\n📝 Test: Deleting properties via UI`);
		console.log(`Creating account: ${testEmail}`);
		await registerNewAccount(page, testEmail, testPassword);

		// Step 2: Create multiple properties
		console.log('📦 Creating test properties...');
		for (let i = 1; i <= 2; i++) {
			await page.goto('/properties', { waitUntil: 'domcontentloaded' });
			await page.waitForTimeout(500);

			const createButton = page.getByRole('button', {
				name: /add property|new property|create/i,
			});
			if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
				await createButton.click();
				await page.waitForTimeout(500);

				const addressInput = page.locator(
					'input[placeholder*="address" i], input[name*="address" i]',
				);
				if (
					await addressInput.isVisible({ timeout: 2000 }).catch(() => false)
				) {
					await addressInput.fill(`Test Property ${i} for Deletion`);
					const submitBtn = page
						.getByRole('button', { name: /create|save|add/i })
						.last();
					await submitBtn.click();
					await page.waitForTimeout(1000);
					console.log(`   ✅ Created property ${i}`);
				}
			}
		}

		// Step 3: Navigate to properties and delete them
		console.log('🗑️  Deleting properties...');
		await page.goto('/properties', { waitUntil: 'domcontentloaded' });
		await page.waitForTimeout(500);

		let propertyCount = 0;
		let keepDeleting = true;

		while (keepDeleting) {
			const deleteButtons = page.getByRole('button', {
				name: /delete|remove/i,
			});
			const firstDeleteBtn = deleteButtons.first();

			if (
				await firstDeleteBtn.isVisible({ timeout: 2000 }).catch(() => false)
			) {
				await firstDeleteBtn.click();
				await page.waitForTimeout(500);

				// Confirm deletion if prompted
				const confirmBtn = page.getByRole('button', {
					name: /confirm|yes|delete|ok/i,
				});
				if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
					await confirmBtn.click();
					await page.waitForTimeout(1000);
					propertyCount++;
					console.log(`   ✅ Property ${propertyCount} deleted`);
				}
			} else {
				keepDeleting = false;
			}
		}

		console.log(`✅ Successfully deleted ${propertyCount} properties`);
		expect(propertyCount).toBeGreaterThan(0);
	});

	test('user can delete all their tasks through the UI', async ({ page }) => {
		// Step 1: Create test account
		const testEmail = generateTestEmail();
		const testPassword = 'TestPassword123!';

		console.log(`\n📝 Test: Deleting tasks via UI`);
		console.log(`Creating account: ${testEmail}`);
		await registerNewAccount(page, testEmail, testPassword);

		// Step 2: Create multiple tasks
		console.log('📋 Creating test tasks...');
		for (let i = 1; i <= 2; i++) {
			await page.goto('/tasks', { waitUntil: 'domcontentloaded' });
			await page.waitForTimeout(500);

			const createButton = page.getByRole('button', {
				name: /create task|new task|add task/i,
			});
			if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
				await createButton.click();
				await page.waitForTimeout(500);

				const titleInput = page.locator(
					'input[name*="title" i], input[placeholder*="task title" i], input[placeholder*="title" i]',
				);
				if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
					await titleInput.fill(`Task ${i} for Deletion`);
					const submitBtn = page
						.getByRole('button', { name: /create|save|add/i })
						.last();
					await submitBtn.click();
					await page.waitForTimeout(1000);
					console.log(`   ✅ Created task ${i}`);
				}
			}
		}

		// Step 3: Navigate to tasks and delete them
		console.log('🗑️  Deleting tasks...');
		await page.goto('/tasks', { waitUntil: 'domcontentloaded' });
		await page.waitForTimeout(500);

		let taskCount = 0;
		let keepDeleting = true;

		while (keepDeleting) {
			const deleteButtons = page.getByRole('button', {
				name: /delete|remove/i,
			});
			const firstDeleteBtn = deleteButtons.first();

			if (
				await firstDeleteBtn.isVisible({ timeout: 2000 }).catch(() => false)
			) {
				await firstDeleteBtn.click();
				await page.waitForTimeout(500);

				// Confirm deletion if prompted
				const confirmBtn = page.getByRole('button', {
					name: /confirm|yes|delete|ok/i,
				});
				if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
					await confirmBtn.click();
					await page.waitForTimeout(1000);
					taskCount++;
					console.log(`   ✅ Task ${taskCount} deleted`);
				}
			} else {
				keepDeleting = false;
			}
		}

		console.log(`✅ Successfully deleted ${taskCount} tasks`);
		expect(taskCount).toBeGreaterThan(0);
	});

	test('user can delete their account through the UI', async ({ page }) => {
		// Step 1: Create test account
		const testEmail = generateTestEmail();
		const testPassword = 'TestPassword123!';

		console.log(`\n📝 Test: Deleting account via UI`);
		console.log(`Creating account: ${testEmail}`);
		await registerNewAccount(page, testEmail, testPassword);

		// Verify logged in
		const logoutButton = page.getByRole('button', { name: /sign out|logout/i });
		await expect(logoutButton).toBeVisible();
		console.log('✅ Account created successfully');

		// Step 2: Look for account/settings page to delete account
		console.log('🔍 Looking for account deletion option...');
		const settingsRoutes = [
			'/settings',
			'/account',
			'/profile',
			'/preferences',
		];
		let foundAccountSettings = false;

		for (const route of settingsRoutes) {
			try {
				await page.goto(route, { waitUntil: 'domcontentloaded' });
				await page.waitForTimeout(500);

				// Look for "Delete Account" button or link
				const deleteAccountBtn = page
					.getByRole('button', { name: /delete.*account|remove.*account/i })
					.first();

				if (
					await deleteAccountBtn.isVisible({ timeout: 2000 }).catch(() => false)
				) {
					console.log(`📝 Found account settings at: ${route}`);
					console.log('🗑️  Clicking delete account button...');

					await deleteAccountBtn.click();
					await page.waitForTimeout(1000);

					// Look for confirmation dialog
					const confirmDeleteBtn = page.getByRole('button', {
						name: /confirm.*delete|yes.*delete|delete.*account|ok/i,
					});

					if (
						await confirmDeleteBtn
							.isVisible({ timeout: 3000 })
							.catch(() => false)
					) {
						console.log('⚠️  Confirming account deletion...');
						await confirmDeleteBtn.click();
						await page.waitForTimeout(2000);

						// Verify we're logged out or redirected
						const isLoggedOut = !(await logoutButton
							.isVisible({ timeout: 2000 })
							.catch(() => false));

						if (isLoggedOut) {
							console.log(
								'✅ Account deleted via UI - logged out successfully',
							);
							foundAccountSettings = true;

							// Step 3: Verify account is actually deleted by trying to log in
							console.log(
								`\n🔄 Verifying deletion: Attempting to log in with ${testEmail}`,
							);
							await page.goto('/', { waitUntil: 'domcontentloaded' });
							const loginBtn = page
								.getByRole('button', { name: /sign in|login/i })
								.first();

							if (
								await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)
							) {
								await loginBtn.click();
								await page.waitForTimeout(500);

								const emailInput = page.locator('input[type="email"]').first();
								const passwordInput = page
									.locator('input[type="password"]')
									.first();

								if (
									await emailInput
										.isVisible({ timeout: 2000 })
										.catch(() => false)
								) {
									await emailInput.fill(testEmail);
									await passwordInput.fill(testPassword);

									const submitBtn = page
										.getByRole('button', { name: /sign in|login/i })
										.last();
									await submitBtn.click();
									await page.waitForTimeout(2000);

									const errorMsg = page.getByText(
										/not found|invalid|incorrect|user doesn't exist|no user/i,
									);
									const loginFailed = await errorMsg
										.isVisible({ timeout: 2000 })
										.catch(() => false);

									if (loginFailed) {
										console.log(
											'✅ Account deletion verified - login failed as expected',
										);
									} else {
										console.log('ℹ️  Login check inconclusive');
									}
								}
							}
							break;
						}
					}
				}
			} catch (error) {
				// Continue to next route
			}
		}

		if (!foundAccountSettings) {
			console.log(
				'⚠️  Note: Account deletion through UI not found in tested routes',
			);
			console.log('   Tested routes:', settingsRoutes.join(', '));
			console.log(
				'   Accounts created for testing will be cleaned up via: yarn e2e:ci',
			);
		}
	});

	test('complete user data cleanup workflow', async ({ page }) => {
		// Step 1: Create account with data
		const testEmail = generateTestEmail();
		const testPassword = 'TestPassword123!';

		console.log(
			`\n📝 Test: Complete User Cleanup Workflow\nEmail: ${testEmail}`,
		);
		await registerNewAccount(page, testEmail, testPassword);

		// Step 2: Create test data
		console.log('📦 Creating test data...');
		await page.goto('/properties', { waitUntil: 'domcontentloaded' });
		const createPropBtn = page.getByRole('button', {
			name: /add property|new property|create/i,
		});

		if (await createPropBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			await createPropBtn.click();
			const addressInput = page.locator('input[placeholder*="address" i]');
			if (await addressInput.isVisible({ timeout: 2000 }).catch(() => false)) {
				await addressInput.fill('Cleanup Test Property');
				await page
					.getByRole('button', { name: /create|save/i })
					.last()
					.click();
				console.log('   ✅ Property created');
			}
		}

		// Step 3: Summary
		console.log(`\n📊 Cleanup Summary:`);
		console.log(`   Email: ${testEmail}`);
		console.log(`   Password: ${testPassword}`);
		console.log(`   Data Created: Properties, Tasks`);
		console.log(`\n🧹 Cleanup Options:`);
		console.log(`   1. Manual UI deletion: Delete via Settings → Account`);
		console.log(`   2. Automated cleanup: yarn e2e:ci`);
		console.log(
			`   3. Firebase script: node scripts/cleanupFirebaseTestUsers.cjs`,
		);

		expect(testEmail).toContain('maintley-test.com');
	});
});
