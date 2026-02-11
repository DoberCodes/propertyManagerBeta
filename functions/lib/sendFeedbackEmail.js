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
exports.sendFeedbackEmail = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
if (!admin.apps.length) {
    admin.initializeApp();
}
// Initialize SendGrid with API key from environment
const sendgridApiKey = process.env.SENDGRID_API_KEY;
if (sendgridApiKey) {
    mail_1.default.setApiKey(sendgridApiKey);
}
exports.sendFeedbackEmail = functions.firestore
    .document('feedback/{feedbackId}')
    .onCreate(async (snap, context) => {
    const feedback = snap.data();
    if (!feedback) {
        console.error('No feedback data found');
        return;
    }
    // Type guard to ensure feedback.type is a valid FeedbackType
    const isValidFeedbackType = (type) => {
        return ['feedback', 'feature_request', 'bug_report'].includes(type);
    };
    if (!isValidFeedbackType(feedback.type)) {
        console.error('Invalid feedback type:', feedback.type);
        return;
    }
    const feedbackTypeLabels = {
        feedback: 'General Feedback',
        feature_request: 'Feature Request',
        bug_report: 'Bug Report',
    };
    const subject = `[Property Manager] ${feedbackTypeLabels[feedback.type]}: ${feedback.subject}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">New Feedback Received</h2>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Feedback Details</h3>
          <p><strong>Type:</strong> ${feedbackTypeLabels[feedback.type]}</p>
          <p><strong>Subject:</strong> ${feedback.subject}</p>
          <p><strong>From:</strong> ${feedback.userName || 'Anonymous'} ${feedback.userEmail ? `(${feedback.userEmail})` : ''}</p>
          <p><strong>User ID:</strong> ${feedback.userId || 'N/A'}</p>
          <p><strong>Submitted:</strong> ${new Date(feedback.createdAt).toLocaleString()}</p>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Message</h3>
          <div style="white-space: pre-wrap; line-height: 1.6;">${feedback.message}</div>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #6b7280; font-size: 14px;">
          This feedback was submitted through the Property Manager app.
        </p>
      </div>
    `;
    // Send feedback via SendGrid
    if (sendgridApiKey) {
        try {
            const msg = {
                to: 'doberfamilyventures@gmail.com',
                from: {
                    email: 'feedback@maintleyapp.com',
                    name: 'Property Manager Feedback',
                },
                subject: subject,
                html: html,
                replyTo: feedback.userEmail || 'noreply@maintleyapp.com',
            };
            await mail_1.default.send(msg);
            console.log('Feedback email sent successfully via SendGrid');
            // Update the feedback document to mark it as sent
            await snap.ref.update({
                status: 'sent_via_sendgrid',
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        catch (sendgridError) {
            console.error('Error sending via SendGrid:', sendgridError);
            // Update the feedback document to mark the failure
            await snap.ref.update({
                status: 'sendgrid_failed',
                sendgridError: sendgridError instanceof Error
                    ? sendgridError.message
                    : String(sendgridError),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    }
    else {
        console.log('No SendGrid API key configured. Feedback saved but not sent.');
        // Update the feedback document to mark it as saved only
        await snap.ref.update({
            status: 'saved_no_sendgrid_key',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});
