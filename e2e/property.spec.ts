import { test, expect } from '@playwright/test';
import { registerNewAccount, generateTestEmail } from './auth.helper';

/**
 * Property management tests
 * Tests property CRUD operations (Create, Read, Update, Delete)
 */

test.describe('Property Management', () => {
	test.beforeEach(async ({ page }) => {
		// Register a new account before each test
		const testEmail = generateTestEmail();
		const testPassword = 'TestPassword123!';
		await registerNewAccount(page, testEmail, testPassword);
	});

	test('user can create a new property', async ({ page }) => {
		// Navigate to properties page
		await page.goto('/properties');
		await page.waitForLoadState('networkidle');

		// Click "Add Property" or "Create Property" button
		const createButton = page.getByRole('button', {
			name: /add property|new property|create property/i,
		});
		await createButton.click();

		// Fill in property details
		await page.fill(
			'input[placeholder*="address" i], input[name*="address" i]',
			'123 Main St, Springfield, IL 62701',
		);

		// Fill in property name if separate field
		const nameInput = page.locator(
			'input[name*="name" i], input[placeholder*="property name" i]',
		);
		if (await nameInput.isVisible()) {
			await nameInput.fill('My Test Property');
		}

		// Fill in property type if available
		const typeSelect = page.locator(
			'select[name*="type" i], select[name*="propertyType" i]',
		);
		if (await typeSelect.isVisible()) {
			const options = await typeSelect.locator('option').allTextContents();
			const typeOption = options.find((opt) =>
				/House|Apartment|Condo/i.test(opt),
			);
			if (typeOption) {
				await typeSelect.selectOption({ label: typeOption });
			}
		}

		// Submit the form
		const submitButton = page
			.getByRole('button', { name: /create|save|add/i })
			.last();
		await submitButton.click();

		// Verify property was created
		await page.waitForTimeout(1000);
		const successMessage = page.getByText(/success|created|added/i);
		await expect(successMessage).toBeVisible({ timeout: 5000 });

		// Verify property appears in list
		const propertyAddress = page.getByText(/123 Main St|My Test Property/);
		await expect(propertyAddress).toBeVisible({ timeout: 5000 });
	});

	test('user can view property details', async ({ page }) => {
		// Navigate to properties page
		await page.goto('/properties');
		await page.waitForLoadState('networkidle');

		// Click on first property
		const propertyCard = page
			.locator('[data-testid*="property"], .property-card')
			.first();
		await propertyCard.click();

		// Verify property details page loaded
		await page.waitForTimeout(500);

		// Check for property details
		const detailsHeader = page.getByRole('heading');
		await expect(detailsHeader.first()).toBeVisible();
	});

	test('user can update property details', async ({ page }) => {
		// Navigate to properties page
		await page.goto('/properties');
		await page.waitForLoadState('networkidle');

		// Click edit button on first property
		const editButton = page
			.getByRole('button', { name: /edit|modify/i })
			.first();
		await editButton.click();

		// Update property name
		const nameInput = page.locator(
			'input[name*="name" i], input[placeholder*="name" i]',
		);
		await nameInput.clear();
		await nameInput.fill('Updated Property Name');

		// Save changes
		const saveButton = page
			.getByRole('button', { name: /save|update/i })
			.last();
		await saveButton.click();

		// Verify update was successful
		await page.waitForTimeout(1000);
		const successMessage = page.getByText(/success|updated|saved/i);
		await expect(successMessage).toBeVisible({ timeout: 5000 });

		// Verify updated name appears
		const updatedName = page.getByText(/Updated Property Name/);
		await expect(updatedName).toBeVisible({ timeout: 5000 });
	});

	test('user can delete a property', async ({ page }) => {
		// Navigate to properties page
		await page.goto('/properties');
		await page.waitForLoadState('networkidle');

		// Get property count before deletion
		const propertyItems = page.locator(
			'[data-testid*="property"], .property-card',
		);
		const countBefore = await propertyItems.count();

		// Click delete button on first property
		const deleteButton = page
			.getByRole('button', { name: /delete|remove/i })
			.first();
		await deleteButton.click();

		// Confirm deletion if prompted
		const confirmButton = page.getByRole('button', {
			name: /confirm|yes|delete|ok/i,
		});
		if (await confirmButton.isVisible()) {
			await confirmButton.click();
		}

		// Verify deletion was successful
		await page.waitForTimeout(1000);
		const successMessage = page.getByText(/success|deleted|removed/i);
		await expect(successMessage).toBeVisible({ timeout: 5000 });

		// Verify property count decreased
		const propertyItemsAfter = page.locator(
			'[data-testid*="property"], .property-card',
		);
		const countAfter = await propertyItemsAfter.count();
		expect(countAfter).toBeLessThan(countBefore);
	});
});
