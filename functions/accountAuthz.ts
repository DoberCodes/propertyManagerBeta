import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

export type AccountMembership = {
	accountId: string;
	userId: string;
	roles: string[];
	status?: 'active' | 'disabled';
};

export const resolveAccountIdForUser = async (uid: string): Promise<string> => {
	const userDoc = await db.collection('users').doc(uid).get();
	const userData = userDoc.data() || {};
	const directAccountId = String(userData.accountId || '').trim();
	if (directAccountId) return directAccountId;

	const familySnapshot = await db
		.collection('familyAccounts')
		.where('memberIds', 'array-contains', uid)
		.limit(1)
		.get();

	if (!familySnapshot.empty) {
		return familySnapshot.docs[0].id;
	}

	return uid;
};

export const getMembership = async (
	accountId: string,
	uid: string,
): Promise<AccountMembership | null> => {
	const membershipId = `${accountId}_${uid}`;
	const membershipDoc = await db
		.collection('accountMemberships')
		.doc(membershipId)
		.get();

	if (!membershipDoc.exists) {
		return null;
	}

	const data = membershipDoc.data() || {};
	return {
		accountId: String(data.accountId || accountId),
		userId: String(data.userId || uid),
		roles: Array.isArray(data.roles) ? (data.roles as string[]) : [],
		status: (data.status as 'active' | 'disabled') || 'active',
	};
};

export const hasAnyRole = (
	membership: AccountMembership | null,
	roles: string[],
): boolean => {
	if (!membership) return false;
	if (membership.status === 'disabled') return false;
	return roles.some((role) => membership.roles.includes(role));
};

export const assertAccountRole = async (
	uid: string,
	accountId: string,
	roles: string[],
): Promise<void> => {
	const membership = await getMembership(accountId, uid);
	if (!hasAnyRole(membership, roles)) {
		throw new Error('permission-denied');
	}
};
