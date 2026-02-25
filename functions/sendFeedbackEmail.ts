import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';
import { defineSecret } from 'firebase-functions/params';

const SENDGRID_API_KEY = defineSecret(
	process.env.SENDGRID_API_KEY_SECRET_NAME || 'SENDGRID_API_KEY',
);

if (!admin.apps.length) {
	admin.initializeApp();
}

type FeedbackType = 'feedback' | 'feature_request' | 'bug_report';

interface FeedbackData {
	type: FeedbackType;
	subject: string;
	message: string;
	userEmail?: string;
	userId?: string;
	userName?: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export const sendFeedbackEmail = onDocumentCreated(
	{
		document: 'feedback/{feedbackId}',
		secrets: ['SENDGRID_API_KEY'],
	},
	async (event) => {
		// Initialize SendGrid with secret
		const apiKey = SENDGRID_API_KEY.value();
		if (apiKey) {
			sgMail.setApiKey(apiKey);
		}

		const feedback = event.data?.data() as FeedbackData | undefined;

		if (!feedback) {
			console.error('No feedback data found');
			return;
		}

		// Type guard to ensure feedback.type is a valid FeedbackType
		const isValidFeedbackType = (type: any): type is FeedbackType => {
			return ['feedback', 'feature_request', 'bug_report'].includes(type);
		};

		if (!isValidFeedbackType(feedback.type)) {
			console.error('Invalid feedback type:', feedback.type);
			return;
		}

		const feedbackTypeLabels: Record<FeedbackType, string> = {
			feedback: 'General Feedback',
			feature_request: 'Feature Request',
			bug_report: 'Bug Report',
		};

		const subject = `[Maintley] ${feedbackTypeLabels[feedback.type]}: ${
			feedback.subject
		}`;
		const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">New Feedback Received</h2>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Feedback Details</h3>
          <p><strong>Type:</strong> ${feedbackTypeLabels[feedback.type]}</p>
          <p><strong>Subject:</strong> ${feedback.subject}</p>
          <p><strong>From:</strong> ${feedback.userName || 'Anonymous'} ${
			feedback.userEmail ? `(${feedback.userEmail})` : ''
		}</p>
          <p><strong>User ID:</strong> ${feedback.userId || 'N/A'}</p>
          <p><strong>Submitted:</strong> ${new Date(
						feedback.createdAt,
					).toLocaleString()}</p>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Message</h3>
          <div style="white-space: pre-wrap; line-height: 1.6;">${
						feedback.message
					}</div>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #6b7280; font-size: 14px;">
          This feedback was submitted through the Maintley app.
        </p>
      </div>
    `;

		const feedbackRef = event.data?.ref;
		if (!feedbackRef) {
			console.error('No feedback document reference found');
			return;
		}

		// Send feedback via SendGrid
		if (apiKey) {
			try {
				const msg = {
					to: 'maintleyapp@gmail.com',
					from: {
						email: 'feedback@maintleyapp.com',
						name: 'Maintley Feedback',
					},
					subject: subject,
					html: html,
					replyTo: feedback.userEmail || 'noreply@maintleyapp.com',
				};

				await sgMail.send(msg);
				console.log('Feedback email sent successfully via SendGrid');

				// Update the feedback document to mark it as sent
				await feedbackRef.update({
					status: 'sent_via_sendgrid',
					sentAt: admin.firestore.FieldValue.serverTimestamp(),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			} catch (sendgridError) {
				console.error('Error sending via SendGrid:', sendgridError);

				// Update the feedback document to mark the failure
				await feedbackRef.update({
					status: 'sendgrid_failed',
					sendgridError:
						sendgridError instanceof Error
							? sendgridError.message
							: String(sendgridError),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			}
		} else {
			console.log(
				'No SendGrid API key configured. Feedback saved but not sent.',
			);

			// Update the feedback document to mark it as saved only
			await feedbackRef.update({
				status: 'saved_no_sendgrid_key',
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
		}
	},
);
