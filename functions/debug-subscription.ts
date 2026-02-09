/**
 * Debug script to check user's subscription data
 * Run with: npx ts-node debug-subscription.ts
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

async function checkUserSubscription(userId?: string) {
	try {
		if (userId) {
			console.log(`Checking subscription data for user: ${userId}`);

			const userDoc = await db.collection('users').doc(userId).get();

			if (!userDoc.exists) {
				console.log('❌ User not found');
				return;
			}

			const userData = userDoc.data();
			console.log('User data:', JSON.stringify(userData, null, 2));

			if (userData?.subscription) {
				console.log('📊 Subscription data:');
				console.log('  Status:', userData.subscription.status);
				console.log('  Plan:', userData.subscription.plan);
				console.log(
					'  Stripe Customer ID:',
					userData.subscription.stripeCustomerId,
				);
				console.log(
					'  Stripe Subscription ID:',
					userData.subscription.stripeSubscriptionId,
				);
				console.log(
					'  Current Period Start:',
					userData.subscription.currentPeriodStart,
				);
				console.log(
					'  Current Period End:',
					userData.subscription.currentPeriodEnd,
				);
			} else {
				console.log('❌ No subscription data found');
			}
		}

		// Check if there are any users with stripeCustomerId
		console.log('\n🔍 Checking all users with Stripe Customer IDs...');
		const usersWithCustomerId = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '!=', null)
			.get();

		console.log(
			`📋 Users with Stripe Customer IDs: ${usersWithCustomerId.size}`,
		);
		usersWithCustomerId.forEach((doc) => {
			const data = doc.data();
			console.log(
				`  ${doc.id}: ${data.subscription?.stripeCustomerId} (${data.email})`,
			);
			console.log(
				`    Status: ${data.subscription?.status}, Plan: ${data.subscription?.plan}`,
			);
		});

		// Check all users
		console.log('\n👥 Checking all users...');
		const allUsers = await db.collection('users').get();
		console.log(`Total users: ${allUsers.size}`);
		allUsers.forEach((doc) => {
			const data = doc.data();
			const sub = data.subscription;
			if (sub) {
				console.log(
					`  ${doc.id}: ${data.email} - Status: ${sub.status}, Plan: ${
						sub.plan
					}, CustomerID: ${sub.stripeCustomerId || 'none'}`,
				);
			}
		});
	} catch (error) {
		console.error('Error checking user subscription:', error);
	}
}

// Get user ID from command line or use a default
const userId = process.argv[2]; // Optional user ID

checkUserSubscription(userId)
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	});
