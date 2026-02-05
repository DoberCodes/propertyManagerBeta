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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFeedbackEmail = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
if (!admin.apps.length) {
    admin.initializeApp();
}
// Configure nodemailer with your email service
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
exports.sendFeedbackEmail = functions.firestore
    .document('feedback/{feedbackId}')
    .onCreate(async (snap, context) => {
    var _a, _b;
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
    const mailOptions = {
        from: ((_a = functions.config().email) === null || _a === void 0 ? void 0 : _a.user) || 'noreply@propertymanager.com',
        to: ((_b = functions.config().email) === null || _b === void 0 ? void 0 : _b.feedback_recipient) ||
            'feedback@propertymanager.com',
        subject: subject,
        html: html,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log('Feedback email sent successfully');
        // Update the feedback document to mark it as emailed
        await snap.ref.update({
            status: 'emailed',
            emailedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        console.error('Error sending feedback email:', error);
        // Update the feedback document to mark the failure
        await snap.ref.update({
            status: 'email_failed',
            emailError: error instanceof Error ? error.message : String(error),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});
