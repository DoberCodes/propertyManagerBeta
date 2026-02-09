/**
 * Manual subscription update script
 * Use this to manually update a user's subscription data if webhook failed
 * Run with: npx ts-node manual-update.ts <userId> <subscriptionId> <customerId>
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(require('../serviceAccountKey.json')),
		projectId: 'mypropertymanager-cda42',
	});
}

const db = admin.firestore();

async function manualUpdateSubscription(
	userId: string,
	subscriptionId: string,
	customerId: string,
) {
	try {
		console.log(`Manually updating subscription for user: ${userId}`);
		console.log(`Subscription ID: ${subscriptionId}`);
		console.log(`Customer ID: ${customerId}`);

		// Get current user data
		const userDoc = await db.collection('users').doc(userId).get();
		if (!userDoc.exists) {
			console.log('❌ User not found');
			return;
		}

		const userData = userDoc.data();
		console.log('Current subscription data:', userData?.subscription);

		// Update subscription data
		const subscriptionData = {
			status: 'active',
			plan: 'homeowner', // Assuming homeowner plan based on previous data
			stripeSubscriptionId: subscriptionId,
			stripeCustomerId: customerId,
			currentPeriodStart: Math.floor(Date.now() / 1000),
			currentPeriodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		};

		await userDoc.ref.update({
			subscription: { ...userData?.subscription, ...subscriptionData },
		});

		console.log('✅ Subscription updated successfully');
		console.log('New subscription data:', subscriptionData);
	} catch (error) {
		console.error('❌ Error updating subscription:', error);
	}
}

// Get parameters from command line
const [, , userId, subscriptionId, customerId] = process.argv;

if (!userId || !subscriptionId || !customerId) {
	console.log(
		'Usage: npx ts-node manual-update.ts <userId> <subscriptionId> <customerId>',
	);
	console.log(
		'Example: npx ts-node manual-update.ts eHR80EIAaih2xhwVSYS9oWu7hOL2 sub_123 cus_456',
	);
	process.exit(1);
}

manualUpdateSubscription(userId, subscriptionId, customerId)
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	});
