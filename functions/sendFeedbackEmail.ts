import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as https from 'https';

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

export const sendFeedbackEmail = functions.firestore
	.document('feedback/{feedbackId}')
	.onCreate(async (snap, context) => {
		const feedback = snap.data() as FeedbackData;

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

		const subject = `[Property Manager] ${feedbackTypeLabels[feedback.type]}: ${
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
          This feedback was submitted through the Property Manager app.
        </p>
      </div>
    `;

		// Send feedback via webhook (you can use services like Zapier, Make.com, or IFTTT)
		const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;

		if (webhookUrl) {
			try {
				const postData = JSON.stringify({
					subject: subject,
					html: html,
					to: 'doberfamilyventures@gmail.com',
					from: 'feedback@maintleyapp.com',
					feedback: feedback,
				});

				const url = new URL(webhookUrl);
				const options = {
					hostname: url.hostname,
					port: url.port || (url.protocol === 'https:' ? 443 : 80),
					path: url.pathname + url.search,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(postData),
					},
				};

				const req = https.request(options, (res) => {
					console.log(`Webhook response status: ${res.statusCode}`);
					res.on('data', (chunk) => {
						console.log(`Webhook response: ${chunk}`);
					});
				});

				req.on('error', (error) => {
					console.error('Webhook error:', error);
				});

				req.write(postData);
				req.end();

				// Update the feedback document to mark it as sent
				await snap.ref.update({
					status: 'sent_via_webhook',
					sentAt: admin.firestore.FieldValue.serverTimestamp(),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});

			} catch (webhookError) {
				console.error('Error sending via webhook:', webhookError);

				// Update the feedback document to mark the failure
				await snap.ref.update({
					status: 'webhook_failed',
					webhookError: webhookError instanceof Error ? webhookError.message : String(webhookError),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			}
		} else {
			console.log('No webhook URL configured. Feedback saved but not sent.');

			// Update the feedback document to mark it as saved only
			await snap.ref.update({
				status: 'saved_no_webhook',
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
		}
	});
