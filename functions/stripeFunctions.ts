import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { defineSecret } from 'firebase-functions/params';
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');

if (!admin.apps.length) {
	admin.initializeApp();
}

// Initialize Stripe lazily to avoid accessing secrets at deployment time
let stripe: Stripe | null = null;
const getStripe = () => {
	if (!stripe) {
		stripe = new Stripe(STRIPE_SECRET_KEY.value() || '', {
			apiVersion: '2023-10-16',
		});
		console.log('Stripe key loaded:', STRIPE_SECRET_KEY.value() ? 'YES' : 'NO');
		console.log(
			'Stripe key starts with sk_live_:',
			STRIPE_SECRET_KEY.value()?.startsWith('sk_live_'),
		);
	}
	return stripe;
};

const db = admin.firestore();

/**
 * Create Stripe Checkout Session
 * POST /api/create-checkout-session
 * Body: { priceId, userId, email, successUrl, cancelUrl }
 */
export const createCheckoutSession = functions.https.onCall(
	async (data, context) => {
		// Verify user is authenticated
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const { priceId, userId, email, successUrl, cancelUrl } = data;

		if (!priceId || !userId || !email) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Missing required parameters',
			);
		}

		try {
			console.log('Creating checkout session with:', {
				priceId,
				userId,
				email,
				successUrl,
				cancelUrl,
			});

			// Get user data to check current subscription
			const userDoc = await db.collection('users').doc(userId).get();
			const userData = userDoc.data();
			console.log('User data retrieved:', userData);

			let customerId = userData?.subscription?.stripeCustomerId;

			// Create or retrieve Stripe customer
			if (!customerId) {
				const customer = await getStripe().customers.create({
					email: email,
					metadata: {
						firebaseUID: userId,
					},
				});
				customerId = customer.id;

				// Update user with customer ID
				await db.collection('users').doc(userId).update({
					'subscription.stripeCustomerId': customerId,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			}

			// Create checkout session
			const session = await getStripe().checkout.sessions.create({
				customer: customerId,
				payment_method_types: ['card'],
				line_items: [
					{
						price: priceId,
						quantity: 1,
					},
				],
				mode: 'subscription',
				success_url: successUrl,
				cancel_url: cancelUrl,
				metadata: {
					firebaseUID: userId,
				},
			});

			return { sessionId: session.id, url: session.url };
		} catch (error) {
			console.error('Error creating checkout session:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to create checkout session',
			);
		}
	},
);

/**
 * Create Trial Subscription in Stripe
 * POST /api/create-trial-subscription
 * Body: { priceId, userId, email, trialDays }
 */
export const createTrialSubscription = functions.https.onCall(
	async (data, context) => {
		// Verify user is authenticated
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const { priceId, userId, email, trialDays = 30 } = data;

		if (!priceId || !userId || !email) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Missing required parameters',
			);
		}

		try {
			console.log('Creating trial subscription with:', {
				priceId,
				userId,
				email,
				trialDays,
			});

			// Get user data to check current subscription
			const userDoc = await db.collection('users').doc(userId).get();
			const userData = userDoc.data();
			console.log('User data retrieved:', userData);

			let customerId = userData?.subscription?.stripeCustomerId;

			// Create or retrieve Stripe customer
			if (!customerId) {
				const customer = await getStripe().customers.create({
					email: email,
					metadata: {
						firebaseUID: userId,
					},
				});
				customerId = customer.id;

				// Update user with customer ID
				await db.collection('users').doc(userId).update({
					'subscription.stripeCustomerId': customerId,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			}

			// Create subscription with trial period
			const subscription = await getStripe().subscriptions.create({
				customer: customerId,
				items: [
					{
						price: priceId,
					},
				],
				trial_period_days: trialDays,
				metadata: {
					firebaseUID: userId,
				},
			});

			console.log('Trial subscription created:', subscription.id);

			return {
				subscriptionId: subscription.id,
				customerId: customerId,
				status: subscription.status,
				trialEnd: subscription.trial_end,
			};
		} catch (error) {
			console.error('Error creating trial subscription:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to create trial subscription',
			);
		}
	},
);

/**
 * Verify Checkout Session Success
 * POST /api/verify-checkout-session
 * Body: { sessionId }
 */
export const verifyCheckoutSession = functions.https.onCall(
	async (data, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const { sessionId } = data;

		if (!sessionId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Session ID is required',
			);
		}

		try {
			// Retrieve session from Stripe
			const session = await getStripe().checkout.sessions.retrieve(sessionId);

			if (session.payment_status !== 'paid') {
				throw new functions.https.HttpsError(
					'failed-precondition',
					'Payment not completed',
				);
			}

			const firebaseUID = session.metadata?.firebaseUID;
			if (!firebaseUID) {
				throw new functions.https.HttpsError(
					'invalid-argument',
					'Invalid session metadata',
				);
			}

			// Get subscription details
			const subscription = await getStripe().subscriptions.retrieve(
				session.subscription as string,
			);

			// Update user subscription in Firestore
			const subscriptionData = {
				status: 'active',
				plan: getPlanFromPriceId(subscription.items.data[0].price.id),
				currentPeriodStart: subscription.current_period_start,
				currentPeriodEnd: subscription.current_period_end,
				stripeCustomerId: session.customer as string,
				stripeSubscriptionId: subscription.id,
			};

			await db.collection('users').doc(firebaseUID).update({
				subscription: subscriptionData,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			return { success: true, subscription: subscriptionData };
		} catch (error) {
			console.error('Error verifying checkout session:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to verify checkout session',
			);
		}
	},
);

/**
 * Cancel Subscription
 * POST /api/cancel-subscription
 * Body: { subscriptionId }
 */
export const cancelSubscription = functions.https.onCall(
	async (data, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const { subscriptionId } = data;

		if (!subscriptionId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Subscription ID is required',
			);
		}

		try {
			// Cancel subscription in Stripe
			const subscription = await getStripe().subscriptions.update(
				subscriptionId,
				{
					cancel_at_period_end: true,
				},
			);

			// Update user subscription status
			const userQuery = await db
				.collection('users')
				.where('subscription.stripeSubscriptionId', '==', subscriptionId)
				.get();

			if (!userQuery.empty) {
				const userDoc = userQuery.docs[0];
				await userDoc.ref.update({
					'subscription.status': 'cancelled',
					'subscription.canceledAt': subscription.cancel_at,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			}

			return { success: true, cancelAt: subscription.cancel_at };
		} catch (error) {
			console.error('Error canceling subscription:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to cancel subscription',
			);
		}
	},
);

/**
 * Get Subscription Details
 * GET /api/subscription-details/:subscriptionId
 */
export const getSubscriptionDetails = functions.https.onCall(
	async (data, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const { subscriptionId } = data;

		if (!subscriptionId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Subscription ID is required',
			);
		}

		try {
			const subscription = await getStripe().subscriptions.retrieve(
				subscriptionId,
			);
			return subscription;
		} catch (error) {
			console.error('Error getting subscription details:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to get subscription details',
			);
		}
	},
);

/**
 * Handle Stripe Webhook Events
 * POST /stripe/webhook
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
	const sig = req.headers['stripe-signature'] as string;

	try {
		// Handle raw body for webhook signature verification
		let rawBody: Buffer;
		if (req.rawBody) {
			rawBody = req.rawBody;
		} else {
			// For newer Firebase Functions versions, reconstruct raw body
			rawBody = Buffer.from(JSON.stringify(req.body));
		}

		const event = getStripe().webhooks.constructEvent(
			rawBody,
			sig,
			process.env.STRIPE_WEBHOOK_SECRET!,
		);

		console.log('Received Stripe webhook event:', event.type);

		switch (event.type) {
			case 'customer.subscription.created':
				await handleSubscriptionCreated(event.data.object);
				break;
			case 'customer.subscription.updated':
				await handleSubscriptionUpdate(event.data.object);
				break;
			case 'customer.subscription.deleted':
				await handleSubscriptionCancellation(event.data.object);
				break;
			case 'customer.subscription.paused':
				await handleSubscriptionPaused(event.data.object);
				break;
			case 'customer.subscription.resumed':
				await handleSubscriptionResumed(event.data.object);
				break;
			case 'invoice.created':
				await handleInvoiceCreated(event.data.object);
				break;
			case 'invoice.finalized':
				await handleInvoiceFinalized(event.data.object);
				break;
			case 'invoice.upcoming':
				await handleInvoiceUpcoming(event.data.object);
				break;
			case 'invoice.payment_succeeded':
				await handlePaymentSuccess(event.data.object);
				break;
			case 'invoice.payment_failed':
				await handlePaymentFailure(event.data.object);
				break;
			case 'invoice.payment_action_required':
				await handlePaymentActionRequired(event.data.object);
				break;
			case 'payment_method.attached':
				await handlePaymentMethodAttached(event.data.object);
				break;
			case 'payment_method.detached':
				await handlePaymentMethodDetached(event.data.object);
				break;
			case 'customer.discount.created':
				await handleDiscountCreated(event.data.object);
				break;
			case 'customer.discount.deleted':
				await handleDiscountDeleted(event.data.object);
				break;
			default:
				console.log('Unhandled Stripe event type:', event.type);
		}

		res.json({ received: true });
	} catch (error) {
		console.error('Webhook error:', error);
		res.status(400).send(`Webhook Error: ${error}`);
	}
});

/**
 * Handle subscription updates from Stripe webhooks
 */
const handleSubscriptionUpdate = async (subscription: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', subscription.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();

			// Update subscription data
			const subscriptionData: any = {
				status:
					subscription.status === 'active'
						? 'active'
						: subscription.status === 'trialing'
						? 'trial'
						: subscription.status,
				plan: getPlanFromPriceId(subscription.items.data[0].price.id),
				currentPeriodStart: subscription.current_period_start,
				currentPeriodEnd: subscription.current_period_end,
				trialEndsAt: subscription.trial_end,
				stripeSubscriptionId: subscription.id,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			};

			// Check if this is a pre-scheduled subscription
			if (
				subscription.metadata?.preScheduled === 'true' &&
				subscription.status === 'trialing'
			) {
				subscriptionData.scheduledPlan = subscriptionData.plan;
				subscriptionData.hasScheduledSubscription = true;
				console.log('Pre-scheduled subscription detected:', {
					plan: subscriptionData.plan,
					trialEnd: subscription.trial_end,
				});
			}

			await userDoc.ref.update({
				subscription: { ...userData.subscription, ...subscriptionData },
			});

			console.log('Subscription updated for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling subscription update:', error);
	}
};

/**
 * Handle subscription cancellations from Stripe webhooks
 */
const handleSubscriptionCancellation = async (subscription: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', subscription.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];

			await userDoc.ref.update({
				'subscription.status': 'cancelled',
				'subscription.canceledAt': subscription.canceled_at,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			console.log('Subscription cancelled for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling subscription cancellation:', error);
	}
};

/**
 * Handle successful payments from Stripe webhooks
 */
const handlePaymentSuccess = async (invoice: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', invoice.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();

			// Update subscription period dates
			const subscriptionData = {
				currentPeriodStart: invoice.period_start,
				currentPeriodEnd: invoice.period_end,
				status: 'active', // Ensure status is active after successful payment
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			};

			await userDoc.ref.update({
				subscription: { ...userData.subscription, ...subscriptionData },
			});

			console.log('Payment succeeded for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling payment success:', error);
	}
};

/**
 * Handle failed payments from Stripe webhooks
 */
const handlePaymentFailure = async (invoice: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', invoice.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];

			// Mark subscription as past due or cancelled based on retry attempts
			const newStatus = invoice.attempt_count >= 3 ? 'cancelled' : 'past_due';

			await userDoc.ref.update({
				'subscription.status': newStatus,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			console.log(
				`Payment failed for user: ${userDoc.id}, status: ${newStatus}`,
			);
		}
	} catch (error) {
		console.error('Error handling payment failure:', error);
	}
};

/**
 * Handle subscription creation from Stripe webhooks
 */
const handleSubscriptionCreated = async (subscription: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', subscription.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();

			// Update subscription data
			const subscriptionData: any = {
				status:
					subscription.status === 'active'
						? 'active'
						: subscription.status === 'trialing'
						? 'trial'
						: subscription.status,
				plan: getPlanFromPriceId(subscription.items.data[0].price.id),
				currentPeriodStart: subscription.current_period_start,
				currentPeriodEnd: subscription.current_period_end,
				trialEndsAt: subscription.trial_end,
				stripeSubscriptionId: subscription.id,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			};

			// Check if this is a pre-scheduled subscription
			if (
				subscription.metadata?.preScheduled === 'true' &&
				subscription.status === 'trialing'
			) {
				subscriptionData.scheduledPlan = subscriptionData.plan;
				subscriptionData.hasScheduledSubscription = true;
				console.log('Pre-scheduled subscription created:', {
					plan: subscriptionData.plan,
					trialEnd: subscription.trial_end,
				});
			}

			await userDoc.ref.update({
				subscription: { ...userData.subscription, ...subscriptionData },
			});

			console.log(
				'New subscription created for user:',
				userDoc.id,
				'Plan:',
				subscriptionData.plan,
				'Status:',
				subscriptionData.status,
			);
		} else {
			console.error('No user found with customer ID:', subscription.customer);
		}
	} catch (error) {
		console.error('Error handling subscription creation:', error);
	}
};

/**
 * Handle subscription pausing from Stripe webhooks
 */
const handleSubscriptionPaused = async (subscription: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', subscription.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			await userDoc.ref.update({
				'subscription.status': 'paused',
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			console.log('Subscription paused for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling subscription pause:', error);
	}
};

/**
 * Handle subscription resumption from Stripe webhooks
 */
const handleSubscriptionResumed = async (subscription: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', subscription.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			await userDoc.ref.update({
				'subscription.status': 'active',
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			console.log('Subscription resumed for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling subscription resume:', error);
	}
};

/**
 * Handle invoice creation from Stripe webhooks
 */
const handleInvoiceCreated = async (invoice: any) => {
	try {
		// Could send invoice preview emails or log for analytics
		console.log('Invoice created:', invoice.id, 'Amount:', invoice.amount_due);
	} catch (error) {
		console.error('Error handling invoice creation:', error);
	}
};

/**
 * Handle invoice finalization from Stripe webhooks
 */
const handleInvoiceFinalized = async (invoice: any) => {
	try {
		// Invoice is finalized and ready for payment
		console.log(
			'Invoice finalized:',
			invoice.id,
			'Amount:',
			invoice.amount_due,
		);
	} catch (error) {
		console.error('Error handling invoice finalization:', error);
	}
};

/**
 * Handle upcoming invoice notifications from Stripe webhooks
 */
const handleInvoiceUpcoming = async (invoice: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', invoice.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();

			// Could send advance billing notification email here
			console.log(
				'Upcoming invoice for user:',
				userDoc.id,
				'Amount:',
				invoice.amount_due,
				'Due:',
				invoice.due_date,
			);
		}
	} catch (error) {
		console.error('Error handling upcoming invoice:', error);
	}
};

/**
 * Handle payment action required from Stripe webhooks
 */
const handlePaymentActionRequired = async (invoice: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', invoice.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];

			// Mark subscription as requiring payment action
			await userDoc.ref.update({
				'subscription.status': 'incomplete',
				'subscription.paymentActionRequired': true,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			console.log('Payment action required for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling payment action required:', error);
	}
};

/**
 * Handle payment method attachment from Stripe webhooks
 */
const handlePaymentMethodAttached = async (paymentMethod: any) => {
	try {
		// Find user by customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', paymentMethod.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			console.log(
				'Payment method attached for user:',
				userDoc.id,
				'Type:',
				paymentMethod.type,
			);
		}
	} catch (error) {
		console.error('Error handling payment method attachment:', error);
	}
};

/**
 * Handle payment method detachment from Stripe webhooks
 */
const handlePaymentMethodDetached = async (paymentMethod: any) => {
	try {
		// Find user by customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', paymentMethod.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			console.log(
				'Payment method detached for user:',
				userDoc.id,
				'Type:',
				paymentMethod.type,
			);
		}
	} catch (error) {
		console.error('Error handling payment method detachment:', error);
	}
};

/**
 * Handle discount creation from Stripe webhooks
 */
const handleDiscountCreated = async (discount: any) => {
	try {
		// Find user by customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', discount.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			console.log(
				'Discount applied for user:',
				userDoc.id,
				'Coupon:',
				discount.coupon?.id,
			);
		}
	} catch (error) {
		console.error('Error handling discount creation:', error);
	}
};

/**
 * Handle discount deletion from Stripe webhooks
 */
const handleDiscountDeleted = async (discount: any) => {
	try {
		// Find user by customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', discount.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			console.log('Discount removed for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling discount deletion:', error);
	}
};

/**
 * Helper function to map Stripe price ID to plan name
 */
function getPlanFromPriceId(priceId: string): string {
	const priceMap: Record<string, string> = {
		[process.env.STRIPE_HOMEOWNER_PRICE_ID || 'price_homeowner']: 'homeowner',
		[process.env.STRIPE_BASIC_PRICE_ID || 'price_basic']: 'basic',
		[process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional']:
			'professional',
	};

	return priceMap[priceId] || 'free';
}

/**
 * Helper function to map plan name to Stripe price ID
 */
function getPriceIdFromPlan(plan: string): string {
	const planMap: Record<string, string> = {
		homeowner: process.env.STRIPE_HOMEOWNER_PRICE_ID || 'price_homeowner',
		basic: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
		professional:
			process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
	};

	return planMap[plan] || 'price_homeowner'; // Default to homeowner
}
