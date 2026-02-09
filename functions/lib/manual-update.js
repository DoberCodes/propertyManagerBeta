"use strict";
/**
 * Manual subscription update script
 * Use this to manually update a user's subscription data if webhook failed
 * Run with: npx ts-node manual-update.ts <userId> <subscriptionId> <customerId>
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
async function manualUpdateSubscription(userId, subscriptionId, customerId) {
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
        console.log('Current subscription data:', userData === null || userData === void 0 ? void 0 : userData.subscription);
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
            subscription: { ...userData === null || userData === void 0 ? void 0 : userData.subscription, ...subscriptionData },
        });
        console.log('✅ Subscription updated successfully');
        console.log('New subscription data:', subscriptionData);
    }
    catch (error) {
        console.error('❌ Error updating subscription:', error);
    }
}
// Get parameters from command line
const [, , userId, subscriptionId, customerId] = process.argv;
if (!userId || !subscriptionId || !customerId) {
    console.log('Usage: npx ts-node manual-update.ts <userId> <subscriptionId> <customerId>');
    console.log('Example: npx ts-node manual-update.ts eHR80EIAaih2xhwVSYS9oWu7hOL2 sub_123 cus_456');
    process.exit(1);
}
manualUpdateSubscription(userId, subscriptionId, customerId)
    .then(() => process.exit(0))
    .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
