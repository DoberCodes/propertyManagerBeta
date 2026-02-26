"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFamilyMember = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const params_1 = require("firebase-functions/params");
const SENDGRID_API_KEY = (0, params_1.defineSecret)(process.env.SENDGRID_API_KEY_SECRET_NAME || 'SENDGRID_API_KEY');
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const auth = admin.auth();
// Define USER_ROLES locally for the cloud function
const USER_ROLES = {
    ADMIN: 'admin',
    PROPERTY_MANAGER: 'property_manager',
    ASSISTANT_MANAGER: 'assistant_manager',
    MAINTENANCE_LEAD: 'maintenance_lead',
    MAINTENANCE: 'maintenance',
    CONTRACTOR: 'contractor',
    TENANT: 'tenant',
    PROPERTY_GUEST: 'property_guest',
};
/**
 * Cloud function to add a family member to an account
 * This runs on the backend to avoid authentication state issues
 */
exports.addFamilyMember = functions
    .runWith({ secrets: ['SENDGRID_API_KEY'] })
    .https.onCall(async (data, context) => {
    var _a, _b;
    // Initialize SendGrid with secret
    const apiKey = SENDGRID_API_KEY.value();
    if (apiKey) {
        mail_1.default.setApiKey(apiKey);
    }
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { accountId, email, firstName, lastName, role = USER_ROLES.ADMIN, } = data;
    // Validate input
    if (!accountId || !email || !firstName || !lastName) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: accountId, email, firstName, lastName');
    }
    try {
        // Check if user already exists
        try {
            await auth.getUserByEmail(email);
            throw new functions.https.HttpsError('already-exists', 'User with this email already exists');
        }
        catch (error) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
            // User doesn't exist, which is what we want
        }
        // Verify the account exists and current user is the owner
        const accountDoc = await db
            .collection('familyAccounts')
            .doc(accountId)
            .get();
        if (!accountDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Family account not found');
        }
        const accountData = accountDoc.data();
        if ((accountData === null || accountData === void 0 ? void 0 : accountData.ownerId) !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', 'Only account owners can add family members');
        }
        if (((_a = accountData === null || accountData === void 0 ? void 0 : accountData.memberIds) === null || _a === void 0 ? void 0 : _a.length) >= 3) {
            throw new functions.https.HttpsError('resource-exhausted', 'Family accounts are limited to 2 family members (plus the account owner)');
        }
        // Create Firebase Auth user
        const tempPassword = Math.random().toString(36) + Math.random().toString(36);
        const userRecord = await auth.createUser({
            email,
            password: tempPassword,
            displayName: `${firstName} ${lastName}`,
        });
        // Get role title
        const getRoleTitleFromRole = (userRole) => {
            switch (userRole) {
                case USER_ROLES.ADMIN:
                    return 'Administrator';
                case USER_ROLES.TENANT:
                    return 'Tenant';
                case USER_ROLES.PROPERTY_GUEST:
                    return 'Property Guest';
                default:
                    return 'User';
            }
        };
        // Create user profile in Firestore
        const userProfile = {
            id: userRecord.uid,
            firstName,
            lastName,
            email,
            role,
            title: getRoleTitleFromRole(role),
            image: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=22c55e&color=fff`,
            accountId,
            isAccountOwner: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('users').doc(userRecord.uid).set(userProfile);
        // Add user to family account
        await db
            .collection('familyAccounts')
            .doc(accountId)
            .update({
            memberIds: [...((accountData === null || accountData === void 0 ? void 0 : accountData.memberIds) || []), userRecord.uid],
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Send invitation email
        if (apiKey) {
            try {
                const accountOwnerDoc = await db
                    .collection('users')
                    .doc(context.auth.uid)
                    .get();
                const ownerName = ((_b = accountOwnerDoc.data()) === null || _b === void 0 ? void 0 : _b.firstName) || 'Account Owner';
                const inviteUrl = `${process.env.FRONTEND_URL || 'https://maintleyapp.com'}/dashboard`;
                const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Welcome to Maintley!</h2>
            <p>Hi ${firstName},</p>
              
            <p>${ownerName} has invited you to join their Maintley account to help manage properties, track maintenance, and keep records organized.</p>


            <p>
              <a href="${inviteUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                Get Started
              </a>
            </p>

            <p>If you didn't expect this invitation, you can safely ignore this email or contact ${ownerName} for more information.</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #6b7280; font-size: 14px;">
              Welcome aboard! You're now part of a better way to manage property maintenance and records.
            </p>
          </div>
        `;
                const msg = {
                    to: email,
                    from: {
                        email: 'maintleyapp@gmail.com',
                        name: 'Maintley',
                    },
                    subject: `${ownerName} invited you to join Maintley`,
                    html: html,
                };
                await mail_1.default.send(msg);
                console.log('Family member invitation email sent successfully');
            }
            catch (emailError) {
                console.error('Error sending family member invitation email:', emailError);
                if (emailError.response) {
                    console.error('SendGrid error details:', JSON.stringify(emailError.response.body));
                }
                // Don't throw - user creation was successful, just log the email error
            }
        }
        else {
            console.log('SendGrid API key not configured, skipping invitation email');
        }
        return {
            success: true,
            user: userProfile,
            message: 'Family member added successfully. They will receive an email to set up their account.',
        };
    }
    catch (error) {
        console.error('Failed to add family member:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to add family member');
    }
});
