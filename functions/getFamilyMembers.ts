import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const serializeFirestoreValue = (value: unknown): unknown => {
	if (value === null || value === undefined) return value;
	if (Array.isArray(value)) {
		return value.map((item) => serializeFirestoreValue(item));
	}
	if (typeof value === 'object') {
		if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
			return ((value as { toDate: () => Date }).toDate() as Date).toISOString();
		}
		const serializedObject: Record<string, unknown> = {};
		for (const [key, nestedValue] of Object.entries(
			value as Record<string, unknown>,
		)) {
			serializedObject[key] = serializeFirestoreValue(nestedValue);
		}
		return serializedObject;
	}
	return value;
};

export const getFamilyMembers = functions.https.onCall(
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
			return { members: [] };
		}

		const accountData = accountDoc.data() || {};
		const memberIds = Array.isArray(accountData.memberIds)
			? (accountData.memberIds as string[])
			: [];

		const callerUid = context.auth.uid;
		const canAccess =
			accountData.ownerId === callerUid || memberIds.includes(callerUid);

		if (!canAccess) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Not authorized to view this family account',
			);
		}

		const uniqueMemberIds = Array.from(new Set(memberIds.filter(Boolean)));
		if (uniqueMemberIds.length === 0) {
			return { members: [] };
		}

		const memberDocs = await Promise.all(
			uniqueMemberIds.map((memberId) =>
				db.collection('users').doc(memberId).get(),
			),
		);

		const members = memberDocs
			.filter((docSnapshot) => docSnapshot.exists)
			.map((docSnapshot) => ({
				id: docSnapshot.id,
				...((serializeFirestoreValue(docSnapshot.data()) || {}) as Record<
					string,
					unknown
				>),
			}));

		return { members };
	},
);
