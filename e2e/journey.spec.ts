import { test, expect } from '@playwright/test';
import { registerNewAccount, generateTestEmail } from './auth.helper';
import { waitForPageLoaded } from './auth.helper';

/**
 * Complete user journey test
 * Tests the full workflow: Login → Create Property → Create Task → Complete Task
 */

test.describe('Complete User Journey', () => {
	test('user can complete full workflow: register > create property > create task > mark complete', async ({
		page,
	}) => {
		// Step 1: Register new account
		const testEmail = generateTestEmail();
		const testPassword = 'TestPassword123!';

		await registerNewAccount(page, testEmail, testPassword);

		// Verify logged in
		const logoutButton = page.getByRole('button', { name: /sign out|logout/i });
		await expect(logoutButton).toBeVisible();

		// Step 2: Navigate to properties
		await page.goto('/#/properties', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);

		// Step 3: Create a property
		const createPropertyButton = page.getByRole('button', {
			name: /add property|new property|create property/i,
		});
		await createPropertyButton.click();
		await page.waitForLoadState('networkidle');

		// Fill property details
		const addressInput = page.locator(
			'input[placeholder*="address" i], input[name*="address" i]',
		);
		if (await addressInput.isVisible()) {
			await addressInput.fill('456 Oak Ave, Springfield, IL 62701');
		}

		const nameInput = page.locator(
			'input[name*="name" i], input[placeholder*="property name" i]',
		);
		if (await nameInput.isVisible()) {
			await nameInput.fill('Journey Test Property');
		}

		// Save property
		let submitButton = page
			.getByRole('button', { name: /create|save|add/i })
			.last();
		await submitButton.click();
		await page.waitForLoadState('networkidle');

		// Step 4: Navigate to tasks
		await page.goto('/#/tasks', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);

		// Step 5: Create a task
		const createTaskButton = page.getByRole('button', {
			name: /create task|new task|add task/i,
		});
		await createTaskButton.click();
		await page.waitForLoadState('networkidle');

		// Fill task details
		const taskTitleInput = page.locator(
			'input[name*="title" i], input[placeholder*="task title" i]',
		);
		await taskTitleInput.fill('Journey Test Task - Paint Walls');

		const taskDescInput = page.locator(
			'textarea[name*="desc" i], textarea[placeholder*="description" i]',
		);
		if (await taskDescInput.isVisible()) {
			await taskDescInput.fill('Paint all walls in the living room');
		}

		// Assign to the property we just created (if property selector exists)
		const propertySelect = page.locator(
			'select[name*="property" i], [role="combobox"]',
		);
		if (await propertySelect.isVisible()) {
			await propertySelect.click();
			const propertyOption = page.locator('[role="option"]').first();
			await propertyOption.click();
		}

		// Save task
		submitButton = page
			.getByRole('button', { name: /create|save|add/i })
			.last();
		await submitButton.click();
		await page.waitForLoadState('networkidle');

		// Step 6: Verify task appears in list
		const taskTitle = page.getByText(/Paint Walls/);
		await expect(taskTitle).toBeVisible({ timeout: 5000 });

		// Step 7: Mark task as complete
		const completeButton = page
			.locator(
				'button[name*="complete" i], input[type="checkbox"][name*="complete" i]',
			)
			.first();
		await expect(completeButton).toBeVisible();
		await completeButton.click();
		await page.waitForLoadState('networkidle');

		console.log('✅ Complete user journey test passed!');
	});
});
