import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

/**
 * Delete Family Member Account
 * This function deletes a family member's account while preserving their tasks and history.
 * Used when removing a family member from the family account.
 */
export const deleteFamilyMemberAccount = functions.https.onCall(
	async (data, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const { memberId, accountId } = data;

		if (!memberId || !accountId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Missing memberId or accountId parameter',
			);
		}

		try {
			// Verify the current user is the account owner
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
					'Only account owners can delete family members',
				);
			}

			if (memberId === context.auth.uid) {
				throw new functions.https.HttpsError(
					'invalid-argument',
					'Cannot delete yourself from the account',
				);
			}

			console.log(
				`Deleting family member account: ${memberId} from account: ${accountId}`,
			);

			const batch = db.batch();

			// Delete from Auth
			try {
				await auth.deleteUser(memberId);
				console.log(`Deleted auth user: ${memberId}`);
			} catch (authError: any) {
				console.error('Error deleting auth user:', authError);
				if (authError.code !== 'auth/user-not-found') {
					throw authError;
				}
			}

			// Delete user document
			batch.delete(db.collection('users').doc(memberId));
			console.log(`Deleting user document: ${memberId}`);

			// Delete user preferences
			const prefsSnapshot = await db
				.collection('userPreferences')
				.where('userId', '==', memberId)
				.get();
			prefsSnapshot.forEach((doc) => {
				batch.delete(doc.ref);
				console.log(`Deleting user preference: ${doc.id}`);
			});

			// Delete notifications for this user
			const notificationsSnapshot = await db
				.collection('notifications')
				.where('userId', '==', memberId)
				.get();
			notificationsSnapshot.forEach((doc) => {
				batch.delete(doc.ref);
				console.log(`Deleting notification: ${doc.id}`);
			});

			// Delete activity logs for this user
			const activitySnapshot = await db
				.collection('activityLogs')
				.where('userId', '==', memberId)
				.get();
			activitySnapshot.forEach((doc) => {
				batch.delete(doc.ref);
				console.log(`Deleting activity log: ${doc.id}`);
			});

			// Delete favorite entries
			const favoritesSnapshot = await db
				.collection('favorites')
				.where('userId', '==', memberId)
				.get();
			favoritesSnapshot.forEach((doc) => {
				batch.delete(doc.ref);
				console.log(`Deleting favorite: ${doc.id}`);
			});

			// Delete recently viewed entries
			const recentlyViewedSnapshot = await db
				.collection('recentlyViewed')
				.where('userId', '==', memberId)
				.get();
			recentlyViewedSnapshot.forEach((doc) => {
				batch.delete(doc.ref);
				console.log(`Deleting recently viewed: ${doc.id}`);
			});

			// Delete device subscriptions
			const deviceSubsSnapshot = await db
				.collection('deviceSubscriptions')
				.where('userId', '==', memberId)
				.get();
			deviceSubsSnapshot.forEach((doc) => {
				batch.delete(doc.ref);
				console.log(`Deleting device subscription: ${doc.id}`);
			});

			// NOTE: We do NOT delete tasks, maintenance history, or comments
			// These are preserved with the member's name

			await batch.commit();
			console.log(`Successfully deleted family member account: ${memberId}`);

			return { success: true, message: 'Family member account deleted' };
		} catch (error: any) {
			console.error('Error in deleteFamilyMemberAccount:', error);
			throw error;
		}
	},
);
