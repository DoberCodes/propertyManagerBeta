"use strict";
/**
 * Debug script to check user's subscription data
 * Run with: npx ts-node debug-subscription.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
const dotenv = __importStar(require("dotenv"));
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
async function checkUserSubscription(userId) {
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
            if (userData === null || userData === void 0 ? void 0 : userData.subscription) {
                console.log('📊 Subscription data:');
                console.log('  Status:', userData.subscription.status);
                console.log('  Plan:', userData.subscription.plan);
                console.log('  Stripe Customer ID:', userData.subscription.stripeCustomerId);
                console.log('  Stripe Subscription ID:', userData.subscription.stripeSubscriptionId);
                console.log('  Current Period Start:', userData.subscription.currentPeriodStart);
                console.log('  Current Period End:', userData.subscription.currentPeriodEnd);
            }
            else {
                console.log('❌ No subscription data found');
            }
        }
        // Check if there are any users with stripeCustomerId
        console.log('\n🔍 Checking all users with Stripe Customer IDs...');
        const usersWithCustomerId = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '!=', null)
            .get();
        console.log(`📋 Users with Stripe Customer IDs: ${usersWithCustomerId.size}`);
        usersWithCustomerId.forEach((doc) => {
            var _a, _b, _c;
            const data = doc.data();
            console.log(`  ${doc.id}: ${(_a = data.subscription) === null || _a === void 0 ? void 0 : _a.stripeCustomerId} (${data.email})`);
            console.log(`    Status: ${(_b = data.subscription) === null || _b === void 0 ? void 0 : _b.status}, Plan: ${(_c = data.subscription) === null || _c === void 0 ? void 0 : _c.plan}`);
        });
        // Check all users
        console.log('\n👥 Checking all users...');
        const allUsers = await db.collection('users').get();
        console.log(`Total users: ${allUsers.size}`);
        allUsers.forEach((doc) => {
            const data = doc.data();
            const sub = data.subscription;
            if (sub) {
                console.log(`  ${doc.id}: ${data.email} - Status: ${sub.status}, Plan: ${sub.plan}, CustomerID: ${sub.stripeCustomerId || 'none'}`);
            }
        });
    }
    catch (error) {
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
