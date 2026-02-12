import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// Define USER_ROLES locally for the cloud function
const USER_ROLES = {
	ADMIN: 'admin',
	PROPERTY_MANAGER: 'property_manager',
	ASSISTANT_MANAGER: 'assistant_manager',
	MAINTENANCE_LEAD: 'maintenance_lead',
	MAINTENANCE: 'maintenance',
	CONTRACTOR: 'contractor',
	TENANT: 'tenant',
	PROPERTY_GUEST: 'property_guest',
} as const;

/**
 * Cloud function to add a family member to an account
 * This runs on the backend to avoid authentication state issues
 */
export const addFamilyMember = functions.https.onCall(async (data, context) => {
	// Verify authentication
	if (!context.auth) {
		throw new functions.https.HttpsError(
			'unauthenticated',
			'User must be authenticated',
		);
	}

	const {
		accountId,
		email,
		firstName,
		lastName,
		role = USER_ROLES.ADMIN,
	} = data;

	// Validate input
	if (!accountId || !email || !firstName || !lastName) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'Missing required fields: accountId, email, firstName, lastName',
		);
	}

	try {
		// Check if user already exists
		try {
			await auth.getUserByEmail(email);
			throw new functions.https.HttpsError(
				'already-exists',
				'User with this email already exists',
			);
		} catch (error: any) {
			if (error.code !== 'auth/user-not-found') {
				throw error;
			}
			// User doesn't exist, which is what we want
		}

		// Verify the account exists and current user is the owner
		const accountDoc = await db
			.collection('familyAccounts')
			.doc(accountId)
			.get();
		if (!accountDoc.exists) {
			throw new functions.https.HttpsError(
				'not-found',
				'Family account not found',
			);
		}

		const accountData = accountDoc.data();
		if (accountData?.ownerId !== context.auth.uid) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Only account owners can add family members',
			);
		}

		if (accountData?.memberIds?.length >= 3) {
			throw new functions.https.HttpsError(
				'resource-exhausted',
				'Family accounts are limited to 2 family members (plus the account owner)',
			);
		}

		// Create Firebase Auth user
		const tempPassword =
			Math.random().toString(36) + Math.random().toString(36);
		const userRecord = await auth.createUser({
			email,
			password: tempPassword,
			displayName: `${firstName} ${lastName}`,
		});

		// Get role title
		const getRoleTitleFromRole = (userRole: string) => {
			switch (userRole) {
				case USER_ROLES.ADMIN:
					return 'Administrator';
				case USER_ROLES.TENANT:
					return 'Tenant';
				case USER_ROLES.PROPERTY_GUEST:
					return 'Property Guest';
				default:
					return 'User';
			}
		};

		// Create user profile in Firestore
		const userProfile = {
			id: userRecord.uid,
			firstName,
			lastName,
			email,
			role,
			title: getRoleTitleFromRole(role),
			image: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=22c55e&color=fff`,
			accountId,
			isAccountOwner: false,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		};

		await db.collection('users').doc(userRecord.uid).set(userProfile);

		// Add user to family account
		await db
			.collection('familyAccounts')
			.doc(accountId)
			.update({
				memberIds: [...(accountData?.memberIds || []), userRecord.uid],
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

		return {
			success: true,
			user: userProfile,
			message:
				'Family member added successfully. They will receive an email to set up their account.',
		};
	} catch (error: any) {
		console.error('Failed to add family member:', error);
		if (error instanceof functions.https.HttpsError) {
			throw error;
		}
		throw new functions.https.HttpsError(
			'internal',
			'Failed to add family member',
		);
	}
});
