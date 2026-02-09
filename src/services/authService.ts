import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	User as FirebaseUser,
	updateProfile,
	sendPasswordResetEmail,
} from 'firebase/auth';
import {
	collection,
	query,
	where,
	getDocs,
	updateDoc,
	doc,
	getDoc,
	setDoc,
	serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../config/firebase';
import { clearUserLocalStorage } from '../utils/localStorageCleanup';
import { User } from '../Redux/Slices/userSlice';
import { USER_ROLES } from '../constants/roles';
import { createTrialSubscription } from '../utils/subscriptionUtils';
import {
	SUBSCRIPTION_STATUS,
	TRIAL_DURATION_DAYS,
} from '../constants/subscriptions';
import { STRIPE_PLANS } from '../constants/stripe';

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
	email: string,
	password: string,
): Promise<User> => {
	try {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			email,
			password,
		);
		const user = await getUserProfile(userCredential.user.uid);
		return user;
	} catch (error: any) {
		console.error('Sign in error:', error);
		throw new Error(getAuthErrorMessage(error.code));
	}
};

const findActiveTenantPromoCode = async (promoCode: string) => {
	const normalizedCode = promoCode.trim().toLowerCase();
	const q = query(
		collection(db, 'tenantInvitationCodes'),
		where('codeLower', '==', normalizedCode),
	);
	const snapshot = await getDocs(q);
	if (snapshot.empty) {
		return null;
	}
	const match = snapshot.docs.find(
		(docSnap) => docSnap.data()?.status === 'active',
	);
	return match || null;
};

/**
 * Create subscription for new user - local trial for all users
 */
const getPriceIdForPlan = (planId: string): string => {
	const priceMap: Record<string, string> = {
		free: STRIPE_PLANS.FREE,
		homeowner: STRIPE_PLANS.HOMEOWNER,
		basic: STRIPE_PLANS.BASIC,
		professional: STRIPE_PLANS.PROFESSIONAL,
	};
	return priceMap[planId] || '';
};

const createUserSubscription = async (
	selectedPlan: string,
	promoCode: string | undefined,
	userId: string,
	email: string,
) => {
	// Create Stripe trial subscription for all plans
	console.log('Creating Stripe trial subscription for plan:', selectedPlan);
	try {
		const priceId = getPriceIdForPlan(selectedPlan);
		if (!priceId) {
			throw new Error(`No price ID found for plan: ${selectedPlan}`);
		}

		const createTrial = httpsCallable(functions, 'createTrialSubscription');
		const result = await createTrial({
			priceId,
			userId,
			email,
			trialDays: TRIAL_DURATION_DAYS,
		});

		const data = result.data as {
			subscriptionId: string;
			customerId: string;
			status: string;
			trialEnd: number;
		};

		// Return subscription data that matches our local format
		const now = Math.floor(Date.now() / 1000);
		return {
			status: SUBSCRIPTION_STATUS.TRIAL,
			plan: selectedPlan,
			currentPeriodStart: now,
			currentPeriodEnd: data.trialEnd,
			trialEndsAt: data.trialEnd,
			stripeCustomerId: data.customerId,
			stripeSubscriptionId: data.subscriptionId,
		};
	} catch (error) {
		console.error('Failed to create Stripe trial subscription:', error);
		// Fallback to local subscription
		return createTrialSubscription(selectedPlan, promoCode);
	}
};

/**
 * Create new user account
 */
export const signUpWithEmail = async (
	email: string,
	password: string,
	firstName: string,
	lastName: string,
	role: string = USER_ROLES.ADMIN,
	selectedPlan: string = 'homeowner',
	promoCode?: string,
	legalAgreement?: {
		agreedToTerms: boolean;
		agreedVersion: string;
	},
): Promise<User> => {
	try {
		let promoDocRef: any = null;
		if (role === USER_ROLES.TENANT) {
			if (!promoCode?.trim()) {
				throw new Error('Tenant promo code is required');
			}
			const promoDoc = await findActiveTenantPromoCode(promoCode);
			if (!promoDoc) {
				throw new Error('Invalid or expired tenant promo code');
			}
			promoDocRef = promoDoc.ref;
		}

		// Create Firebase Auth user
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			email,
			password,
		);

		// Update display name in Firebase Auth
		await updateProfile(userCredential.user, {
			displayName: `${firstName} ${lastName}`,
		});

		// Create user profile in Firestore
		const userProfile: User = {
			id: userCredential.user.uid,
			firstName,
			lastName,
			email,
			role: role as any,
			title: getRoleTitleFromRole(role),
			image: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=22c55e&color=fff`,
		};

		const subscription = await createUserSubscription(
			selectedPlan,
			promoCode,
			userCredential.user.uid,
			email,
		);

		// Prepare legal agreement data
		const legalAgreementData = legalAgreement
			? {
					legalAgreement: {
						agreedToTerms: legalAgreement.agreedToTerms,
						agreedAt: new Date().toISOString(),
						agreedVersion: legalAgreement.agreedVersion,
					},
			  }
			: {};

		await setDoc(doc(db, 'users', userCredential.user.uid), {
			...userProfile,
			...legalAgreementData,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			subscription,
		});

		if (promoDocRef) {
			await updateDoc(promoDocRef, {
				status: 'redeemed',
				redeemedByUserId: userCredential.user.uid,
				redeemedByEmail: email.trim().toLowerCase(),
				redeemedAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			});
		}

		// Always create default groups for new users
		await setDoc(
			doc(db, 'propertyGroups', `${userCredential.user.uid}_my_properties`),
			{
				userId: userCredential.user.uid,
				name: 'My Properties',
				properties: [],
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			},
		);

		await setDoc(
			doc(db, 'propertyGroups', `${userCredential.user.uid}_shared_properties`),
			{
				userId: userCredential.user.uid,
				name: 'Shared Properties',
				properties: [],
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			},
		);

		const myTeamGroupId = `${userCredential.user.uid}_default`;
		const myTeamGroupRef = doc(db, 'teamGroups', myTeamGroupId);
		await setDoc(myTeamGroupRef, {
			userId: userCredential.user.uid,
			name: 'My Team',
			linkedProperties: [],
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});

		return {
			...userProfile,
			subscription,
		};
	} catch (error: any) {
		console.error('Sign up error:', error);
		throw new Error(getAuthErrorMessage(error.code));
	}
};

/**
 * Sign out current user
 */
export const signOutUser = async (): Promise<void> => {
	try {
		const userId = auth.currentUser?.uid;
		await signOut(auth);
		clearUserLocalStorage(userId);
	} catch (error: any) {
		console.error('Sign out error:', error);
		throw new Error('Failed to sign out');
	}
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<User> => {
	try {
		const userDoc = await getDoc(doc(db, 'users', uid));

		if (!userDoc.exists()) {
			throw new Error('User profile not found');
		}

		// Convert Firestore Timestamps to ISO strings for Redux serialization
		const rawData: any = userDoc.data();
		const serializedData: any = { ...rawData, id: uid };
		if (
			rawData.createdAt &&
			typeof rawData.createdAt === 'object' &&
			'toDate' in rawData.createdAt
		) {
			serializedData.createdAt = rawData.createdAt.toDate().toISOString();
		}
		if (
			rawData.updatedAt &&
			typeof rawData.updatedAt === 'object' &&
			'toDate' in rawData.updatedAt
		) {
			serializedData.updatedAt = rawData.updatedAt.toDate().toISOString();
		}

		// Convert legal agreement timestamp if it exists
		if (rawData.legalAgreement?.agreedAt) {
			if (
				typeof rawData.legalAgreement.agreedAt === 'object' &&
				'toDate' in rawData.legalAgreement.agreedAt
			) {
				serializedData.legalAgreement = {
					...rawData.legalAgreement,
					agreedAt: rawData.legalAgreement.agreedAt.toDate().toISOString(),
				};
			} else {
				serializedData.legalAgreement = rawData.legalAgreement;
			}
		}

		// Convert subscription timestamps to serializable format
		if (rawData.subscription) {
			serializedData.subscription = { ...rawData.subscription };

			// Convert subscription.updatedAt if it exists
			if (
				rawData.subscription.updatedAt &&
				typeof rawData.subscription.updatedAt === 'object' &&
				'toDate' in rawData.subscription.updatedAt
			) {
				serializedData.subscription.updatedAt = rawData.subscription.updatedAt
					.toDate()
					.toISOString();
			}

			// Convert other timestamp fields in subscription if they exist
			if (
				rawData.subscription.canceledAt &&
				typeof rawData.subscription.canceledAt === 'object' &&
				'toDate' in rawData.subscription.canceledAt
			) {
				serializedData.subscription.canceledAt = rawData.subscription.canceledAt
					.toDate()
					.toISOString();
			}
		} else {
			// Create default subscription for users who don't have one
			console.warn(
				`User ${uid} does not have a subscription - creating default free plan`,
			);
			const now = Math.floor(Date.now() / 1000);
			serializedData.subscription = {
				status: SUBSCRIPTION_STATUS.ACTIVE,
				plan: 'free',
				currentPeriodStart: now,
				currentPeriodEnd: now + 365 * 24 * 60 * 60, // 1 year
				trialEndsAt: null,
			};

			// Update the user document with the default subscription
			try {
				await updateDoc(doc(db, 'users', uid), {
					subscription: serializedData.subscription,
					updatedAt: serverTimestamp(),
				});
			} catch (updateError) {
				console.error(
					'Failed to update user with default subscription:',
					updateError,
				);
			}
		}

		return serializedData as User;
	} catch (error: any) {
		console.error('Get user profile error:', error);
		throw new Error('Failed to load user profile');
	}
};

/**
 * Listen to authentication state changes
 */
export const onAuthStateChange = (
	callback: (user: User | null) => void,
): (() => void) => {
	return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
		if (firebaseUser) {
			try {
				const userProfile = await getUserProfile(firebaseUser.uid);
				callback(userProfile);
			} catch (error) {
				console.error('Error loading user profile:', error);
				callback(null);
			}
		} else {
			callback(null);
		}
	});
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
	try {
		await sendPasswordResetEmail(auth, email);
	} catch (error: any) {
		console.error('Password reset error:', error);

		// Provide more specific error messages
		if (error.code === 'auth/user-not-found') {
			throw new Error(
				'No account found with this email address. Please check your email or sign up for a new account.',
			);
		} else if (error.code === 'auth/invalid-email') {
			throw new Error('Please enter a valid email address.');
		} else if (error.code === 'auth/too-many-requests') {
			throw new Error(
				'Too many password reset requests. Please wait a few minutes before trying again.',
			);
		}

		throw new Error(
			getAuthErrorMessage(error.code) ||
				'Failed to send password reset email. Please check your Firebase Console email template configuration.',
		);
	}
};

/**
 * Convert Firebase error codes to user-friendly messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
	switch (errorCode) {
		case 'auth/user-not-found':
			return 'No account found with this email address';
		case 'auth/wrong-password':
			return 'Incorrect password';
		case 'auth/invalid-email':
			return 'Invalid email address';
		case 'auth/user-disabled':
			return 'This account has been disabled';
		case 'auth/email-already-in-use':
			return 'An account already exists with this email';
		case 'auth/weak-password':
			return 'Password should be at least 6 characters';
		case 'auth/too-many-requests':
			return 'Too many failed attempts. Please try again later';
		case 'auth/network-request-failed':
			return 'Network error. Please check your connection';
		case 'auth/invalid-credential':
			return 'Invalid email or password';
		default:
			return 'Authentication failed. Please try again';
	}
};

/**
 * Get role title from role constant
 */
const getRoleTitleFromRole = (role: string): string => {
	const roleTitles: { [key: string]: string } = {
		[USER_ROLES.ADMIN]: 'Administrator',
		[USER_ROLES.PROPERTY_MANAGER]: 'Property Manager',
		[USER_ROLES.ASSISTANT_MANAGER]: 'Assistant Manager',
		[USER_ROLES.MAINTENANCE_LEAD]: 'Maintenance Lead',
		[USER_ROLES.MAINTENANCE]: 'Maintenance Technician',
		[USER_ROLES.CONTRACTOR]: 'Contractor',
		[USER_ROLES.TENANT]: 'Tenant',
	};
	return roleTitles[role] || 'User';
};
