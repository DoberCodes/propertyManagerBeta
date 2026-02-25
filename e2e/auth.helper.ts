import { Page } from '@playwright/test';

/**
 * Helper functions to handle Firebase authentication in tests
 */

/**
 * Generate a unique email for testing to avoid conflicts
 */
export function generateTestEmail(): string {
	const timestamp = Date.now();
	const random = Math.floor(Math.random() * 10000);
	return `test.user.${timestamp}.${random}@maintley-test.com`;
}

/**
 * Register a new user account
 */
export async function registerNewAccount(
	page: Page,
	email: string,
	password: string,
) {
	await page.goto('/', { waitUntil: 'domcontentloaded' });

	// Wait for page to be ready
	await page.waitForTimeout(1000);

	// Click the login button to open auth modal/page
	const loginButton = page
		.getByRole('button', { name: /sign in|login|get started/i })
		.first();
	if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
		await loginButton.click();
		await page.waitForTimeout(500);
	}

	// Look for sign up link/button at the bottom of login form
	const signupButton = page.getByRole('button', {
		name: /sign up|create account|register/i,
	});
	const signupLink = page.getByText(
		/sign up|create account|register|don't have|no account/i,
	);

	if (await signupButton.isVisible({ timeout: 5000 }).catch(() => false)) {
		await signupButton.click();
	} else if (await signupLink.isVisible({ timeout: 5000 }).catch(() => false)) {
		await signupLink.click();
	}

	// Wait for registration form to appear
	await page.waitForTimeout(500);

	// Fill in email
	try {
		const emailInput = page.locator('input[type="email"]').first();
		await emailInput.fill(email);
	} catch {
		const emailInput = page
			.locator(
				'input[name="email"], input[placeholder*="email" i], input[id*="email" i]',
			)
			.first();
		await emailInput.fill(email);
	}

	// Fill in password - use first password field (might be password field, not confirm)
	try {
		const passwordInputs = page.locator('input[type="password"]');
		const count = await passwordInputs.count();
		if (count > 0) {
			await passwordInputs.first().fill(password);
			// If there's a confirm password field, fill that too
			if (count > 1) {
				await passwordInputs.nth(1).fill(password);
			}
		}
	} catch {
		const passwordInput = page
			.locator(
				'input[name="password"], input[placeholder*="password" i], input[id*="password" i]',
			)
			.first();
		await passwordInput.fill(password);
	}

	// Submit the registration form
	const submitButton = page
		.getByRole('button', { name: /sign up|create|register|submit/i })
		.last();
	await submitButton.click();

	// Wait for account creation and navigation
	try {
		await page.waitForURL(
			(url) =>
				!url.pathname.includes('login') &&
				!url.pathname.includes('signin') &&
				!url.pathname.includes('register') &&
				!url.pathname.includes('signup'),
			{
				timeout: 20000,
			},
		);
	} catch {
		// If URL doesn't change, just wait for page stability
		await page.waitForTimeout(2000);
	}
}

/**
 * Login with existing credentials (fallback)
 */
export async function login(page: Page, email: string, password: string) {
	await page.goto('/', { waitUntil: 'domcontentloaded' });

	// Wait for form to be interactive
	await page.waitForTimeout(1000);

	// Look for login button or form
	const loginButton = page.getByRole('button', { name: /sign in|login/i });
	if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
		await loginButton.click();
	}

	// Wait for email input to be visible
	try {
		await page.waitForSelector('input[type="email"]', { timeout: 10000 });
	} catch {
		// If email input not found, try alternative selectors
		await page.waitForSelector(
			'input[name="email"], input[placeholder*="email" i], input[id*="email" i]',
			{ timeout: 10000 },
		);
	}

	// Fill in credentials
	try {
		await page.fill('input[type="email"]', email);
		await page.fill('input[type="password"]', password);
	} catch {
		// Try alternative selectors
		const emailInput = page
			.locator(
				'input[name="email"], input[placeholder*="email" i], input[id*="email" i]',
			)
			.first();
		const passwordInput = page
			.locator(
				'input[name="password"], input[placeholder*="password" i], input[id*="password" i]',
			)
			.first();
		await emailInput.fill(email);
		await passwordInput.fill(password);
	}

	// Submit the form
	const submitButton = page
		.getByRole('button', { name: /sign in|login|submit/i })
		.last();
	await submitButton.click();

	// Wait for navigation or dashboard to load - more lenient
	try {
		await page.waitForURL(
			(url) =>
				!url.pathname.includes('login') && !url.pathname.includes('signin'),
			{
				timeout: 15000,
			},
		);
	} catch {
		// Even if URL doesn't change, wait for page to stabilize
		await page.waitForTimeout(2000);
	}
}

export async function logout(page: Page) {
	// Find and click the logout/sign out button
	const logoutButton = page.getByRole('button', { name: /sign out|logout/i });
	if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
		await logoutButton.click();
		// Wait for logout to complete
		await page.waitForTimeout(2000);
	}
}

export async function isLoggedIn(page: Page): Promise<boolean> {
	try {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check if logout button exists (indicator of logged in state)
		const logoutButton = page.getByRole('button', { name: /sign out|logout/i });
		return await logoutButton.isVisible({ timeout: 2000 });
	} catch {
		return false;
	}
}
