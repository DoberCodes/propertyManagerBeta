import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

export const revokeFamilyInvite = functions.https.onCall(
	async (data, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const inviteId = String(data?.inviteId || '').trim();
		const accountId = String(data?.accountId || '').trim();
		if (!inviteId || !accountId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'inviteId and accountId are required',
			);
		}

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

		const accountData = accountDoc.data() || {};
		if (accountData.ownerId !== context.auth.uid) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Only account owners can revoke invites',
			);
		}

		const inviteRef = db.collection('familyInvites').doc(inviteId);
		const inviteDoc = await inviteRef.get();
		if (!inviteDoc.exists) {
			throw new functions.https.HttpsError('not-found', 'Invite not found');
		}

		const inviteData = inviteDoc.data() || {};
		if (inviteData.accountId !== accountId) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Invite does not belong to this family account',
			);
		}

		if (inviteData.status !== 'pending') {
			return { success: true, message: 'Invite already closed' };
		}

		await inviteRef.update({
			status: 'revoked',
			updatedAt: Date.now(),
			revokedAt: Date.now(),
			revokedBy: context.auth.uid,
		});

		return { success: true, message: 'Invite revoked' };
	},
);
