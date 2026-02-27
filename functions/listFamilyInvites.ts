import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const serializeFirestoreValue = (value: unknown): unknown => {
	if (value === null || value === undefined) return value;
	if (Array.isArray(value))
		return value.map((item) => serializeFirestoreValue(item));
	if (typeof value === 'object') {
		if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
			return ((value as { toDate: () => Date }).toDate() as Date).toISOString();
		}
		const output: Record<string, unknown> = {};
		for (const [key, nestedValue] of Object.entries(
			value as Record<string, unknown>,
		)) {
			output[key] = serializeFirestoreValue(nestedValue);
		}
		return output;
	}
	return value;
};

export const listFamilyInvites = functions.https.onCall(
	async (data, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const accountId = String(data?.accountId || '').trim();
		if (!accountId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'accountId is required',
			);
		}

		const accountDoc = await db
			.collection('familyAccounts')
			.doc(accountId)
			.get();
		if (!accountDoc.exists) {
			return { invites: [] };
		}

		const accountData = accountDoc.data() || {};
		const memberIds = Array.isArray(accountData.memberIds)
			? (accountData.memberIds as string[])
			: [];
		const callerUid = context.auth.uid;

		if (accountData.ownerId !== callerUid && !memberIds.includes(callerUid)) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Not authorized to view invites for this account',
			);
		}

		const snapshot = await db
			.collection('familyInvites')
			.where('accountId', '==', accountId)
			.orderBy('createdAt', 'desc')
			.get();

		const invites = snapshot.docs.map((docSnap) => ({
			id: docSnap.id,
			...((serializeFirestoreValue(docSnap.data()) || {}) as Record<
				string,
				unknown
			>),
		}));

		return { invites };
	},
);
