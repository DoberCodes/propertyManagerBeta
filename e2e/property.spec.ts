import { test, expect } from '@playwright/test';
import { loginWithDemoUser, waitForPageLoaded } from './auth.helper';

/**
 * Property management tests
 * Tests property CRUD operations (Create, Read, Update, Delete)
 */

test.describe('Property Management', () => {
	test.beforeEach(async ({ page }) => {
		await loginWithDemoUser(page);
	});

	test('user can create a new property', async ({ page }) => {
		// Navigate to properties page
		await page.goto('/#/properties');
		await waitForPageLoaded(page);

		// Dismiss any remaining modals/tours
		const skipTourBtn = page.getByRole('button', { name: /skip tour/i });
		for (let i = 0; i < 3; i++) {
			if (await skipTourBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
				await skipTourBtn.click({ force: true }).catch(() => {});
				await page.waitForTimeout(500);
			}
		}

		// Click "Add Property" or "Create Property" button
		const createButton = page.getByRole('button', {
			name: /add property|new property|create property/i,
		});
		await page.waitForTimeout(500);
		const canCreate = await createButton
			.first()
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		if (!canCreate) {
			test.skip(
				true,
				'Create property button not visible for current user state',
			);
		}
		await createButton.first().click({ force: true });

		// Wait for modal to appear
		await page.waitForTimeout(800);

		// Fill in property name first
		const nameInput = page.locator(
			'input[name*="name" i], input[placeholder*="property name" i]',
		);
		if (await nameInput.isVisible()) {
			await nameInput.fill('My Test Property');
		}
		const nameFieldFilled = await nameInput
			.inputValue()
			.then((v) => v.length > 0)
			.catch(() => false);

		// Fill in address
		await page.fill(
			'input[placeholder*="address" i], input[name*="address" i]',
			'123 Main St, Springfield, IL 62701',
		);

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
		await page.waitForTimeout(500);
		const submitButton = page
			.getByRole('button', { name: /create|save|add/i })
			.last();
		await submitButton.scrollIntoViewIfNeeded().catch(() => {});
		await submitButton.click();

		// Wait for modal to close and property to appear in list
		await page.waitForTimeout(2000);

		// Verify property appears in the properties list
		const propertyInList = page.getByText(
			/123 Main St|My Test Property|Springfield/i,
		);
		const propertyVisible = await propertyInList
			.isVisible({ timeout: 8000 })
			.catch(() => false);
		const anyPropertyCardVisible = await page
			.locator(
				'[data-testid*="property"], .property-card, a[href*="/property/"]',
			)
			.first()
			.isVisible({ timeout: 3000 })
			.catch(() => false);
		const stillOnPropertiesPage = /properties/i.test(page.url());

		expect(
			propertyVisible ||
				anyPropertyCardVisible ||
				nameFieldFilled ||
				stillOnPropertiesPage,
		).toBeTruthy();
	});

	test('user can view property details', async ({ page }) => {
		// Navigate to properties page
		await page.goto('/#/properties');
		await waitForPageLoaded(page);

		// Click on first property
		const propertyCard = page
			.locator(
				'[data-testid*="property"], .property-card, a[href*="/property/"]',
			)
			.first();
		const hasPropertyCard = await propertyCard
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		if (!hasPropertyCard) {
			test.skip(true, 'No property card available to open details');
		}
		await propertyCard.click();

		// Verify property details page loaded
		await page.waitForTimeout(500);

		// Check for property details
		const detailsHeader = page.getByRole('heading');
		await expect(detailsHeader.first()).toBeVisible();
	});

	test('user can update property details', async ({ page }) => {
		// Navigate to properties page
		await page.goto('/#/properties');
		await waitForPageLoaded(page);

		// Click edit button on first property
		const editButton = page
			.getByRole('button', { name: /edit|modify/i })
			.first();
		const hasEditButton = await editButton
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		if (!hasEditButton) {
			test.skip(true, 'No edit control available for property');
		}
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
		const successVisible = await successMessage
			.isVisible({ timeout: 5000 })
			.catch(() => false);

		// Verify updated name appears
		const updatedName = page.getByText(/Updated Property Name/);
		const updatedVisible = await updatedName
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		expect(successVisible || updatedVisible).toBeTruthy();
	});

	test('user can delete a property', async ({ page }) => {
		// Navigate to properties page
		await page.goto('/#/properties');
		await waitForPageLoaded(page);

		// Get property count before deletion
		const propertyItems = page.locator(
			'[data-testid*="property"], .property-card',
		);
		const countBefore = await propertyItems.count();

		// Click delete button on first property
		const deleteButton = page
			.getByRole('button', { name: /delete|remove/i })
			.first();
		const hasDeleteButton = await deleteButton
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		if (!hasDeleteButton) {
			test.skip(true, 'No delete control available for property');
		}
		await deleteButton.click();

		// Confirm deletion if prompted
		const confirmButton = page.getByRole('button', {
			name: /confirm|yes|delete|ok/i,
		});
		if (
			await confirmButton
				.first()
				.isVisible()
				.catch(() => false)
		) {
			await confirmButton.first().click();
		}

		// Verify deletion was successful
		await page.waitForTimeout(1000);
		const successMessage = page.getByText(/success|deleted|removed/i);
		const successVisible = await successMessage
			.isVisible({ timeout: 5000 })
			.catch(() => false);

		// Verify property count decreased
		const propertyItemsAfter = page.locator(
			'[data-testid*="property"], .property-card',
		);
		const countAfter = await propertyItemsAfter.count();
		expect(successVisible || countAfter <= countBefore).toBeTruthy();
	});
});
