import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';
import { defineSecret } from 'firebase-functions/params';

const SENDGRID_API_KEY = defineSecret(
	process.env.SENDGRID_API_KEY_SECRET_NAME || 'SENDGRID_API_KEY',
);

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud function to resend family member invitation email
 * Allows account owners to resend invitations to family members
 */
export const resendFamilyMemberInvite = functions
	.runWith({ secrets: ['SENDGRID_API_KEY'] })
	.https.onCall(async (data: any, context: any) => {
		// Initialize SendGrid with secret
		const apiKey = SENDGRID_API_KEY.value();
		if (apiKey) {
			sgMail.setApiKey(apiKey);
		}

		// Verify authentication
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const { familyMemberId, accountId } = data;

		// Validate input
		if (!familyMemberId || !accountId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Missing required fields: familyMemberId, accountId',
			);
		}

		try {
			// Verify the account exists and current user is the owner
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
					'Only account owners can resend invitations',
				);
			}

			// Get family member data
			const familyMemberDoc = await db
				.collection('users')
				.doc(familyMemberId)
				.get();

			if (!familyMemberDoc.exists) {
				throw new functions.https.HttpsError(
					'not-found',
					'Family member not found',
				);
			}

			const familyMemberData = familyMemberDoc.data();
			if (familyMemberData?.accountId !== accountId) {
				throw new functions.https.HttpsError(
					'permission-denied',
					'Family member does not belong to this account',
				);
			}

			// Get account owner data
			const accountOwnerDoc = await db
				.collection('users')
				.doc(context.auth.uid)
				.get();
			const ownerName = accountOwnerDoc.data()?.firstName || 'Account Owner';

			// Send invitation email
			if (apiKey) {
				try {
					const inviteUrl = `${
						process.env.FRONTEND_URL || 'https://maintleyapp.com'
					}/dashboard`;

					const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Welcome to Maintley!</h2>
            <p>Hi ${familyMemberData?.firstName},</p>
              
            <p>${ownerName} has invited you to join their Maintley account to help manage properties, track maintenance, and keep records organized.</p>

            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin-top: 0; color: #10b981;">Your Account Details</h3>
              <p><strong>Email:</strong> ${familyMemberData?.email}</p>
              <p><strong>Temporary Password:</strong> You'll set your own password on first login</p>
            </div>

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
						to: familyMemberData?.email,
						from: {
							email: 'maintleyapp@gmail.com',
							name: 'Maintley',
						},
						subject: `${ownerName} invited you to join Maintley (Invitation Resent)`,
						html: html,
					};

					await sgMail.send(msg);
					console.log('Family member invitation email resent successfully');

					return {
						success: true,
						message: `Invitation resent to ${familyMemberData?.email}`,
					};
				} catch (emailError: any) {
					console.error(
						'Error resending family member invitation email:',
						emailError,
					);
					if (emailError.response) {
						console.error(
							'SendGrid error details:',
							JSON.stringify(emailError.response.body),
						);
					}
					throw new functions.https.HttpsError(
						'internal',
						'Failed to send invitation email. Please try again.',
					);
				}
			} else {
				throw new functions.https.HttpsError(
					'internal',
					'Email service is not configured. Please contact support.',
				);
			}
		} catch (error: any) {
			console.error('Failed to resend family member invitation:', error);
			if (error instanceof functions.https.HttpsError) {
				throw error;
			}
			throw new functions.https.HttpsError(
				'internal',
				'Failed to resend invitation',
			);
		}
	});
