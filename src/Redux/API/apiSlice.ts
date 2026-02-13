import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { collection, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Types
export type SharePermission = 'co-owner' | 'admin' | 'viewer';

export interface CompletionFile {
	name: string;
	url: string;
	size: number;
	type: string;
	uploadedAt: string;
}

// Helper to recursively sanitize Firestore data, converting Timestamp objects to ISO strings
const sanitizeFirestoreData = (data: any): any => {
	if (data === undefined || data === null) return data;
	if (Array.isArray(data)) return data.map(sanitizeFirestoreData);
	if (typeof data === 'object') {
		// Firestore Timestamp object has a toDate() method
		if (typeof (data as any).toDate === 'function') {
			return (data as any).toDate().toISOString();
		}
		const out: any = {};
		for (const [k, v] of Object.entries(data)) {
			out[k] = sanitizeFirestoreData(v as any);
		}
		return out;
	}
	return data;
};

// Helper function to convert Firestore docs to data with IDs and sanitized fields
export const docToData = (docSnapshot: any) => {
	if (!docSnapshot.exists()) return null;
	return { id: docSnapshot.id, ...sanitizeFirestoreData(docSnapshot.data()) };
};

export const apiSlice = createApi({
	reducerPath: 'api',
	baseQuery: fakeBaseQuery(),
	tagTypes: [
		'PropertyGroups',
		'Properties',
		'TeamGroups',
		'TeamMembers',
		'Tasks',
		'Devices',
		'Suites',
		'Units',
		'Favorites',
		'PropertyShares',
		'UserInvitations',
		'Notifications',
		'TenantProfiles',
		'TenantInvitationCodes',
		'TeamMemberInvitationCodes',
		'MaintenanceHistory',
		'Contractors',
	],
	endpoints: (builder) => ({
		// App Version
		getAppVersion: builder.query<
			{ version: string; releaseDate?: string; releaseNotes?: string },
			void
		>({
			async queryFn() {
				try {
					const versionDoc = await getDoc(doc(db, 'appConfig', 'version'));

					if (!versionDoc.exists()) {
						// Return default version if not configured yet
						return {
							data: {
								version: '1.0.0',
								releaseDate: new Date().toISOString(),
								releaseNotes: 'Initial release',
							},
						};
					}

					const data = versionDoc.data();
					return {
						data: {
							version: data.version || '1.0.0',
							releaseDate: data.releaseDate,
							releaseNotes: data.releaseNotes,
						},
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		// Feedback
		submitFeedback: builder.mutation<
			{ id: string; message: string },
			{
				type: 'feedback' | 'feature_request' | 'bug_report';
				subject: string;
				message: string;
				userId?: string;
				userEmail?: string;
				userName?: string;
			}
		>({
			async queryFn(feedbackData) {
				try {
					const feedbackRef = collection(db, 'feedback');
					const docRef = await addDoc(feedbackRef, {
						...feedbackData,
						status: 'pending',
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});

					return {
						data: {
							id: docRef.id,
							message: 'Feedback submitted successfully',
						},
					};
				} catch (error: any) {
					return { error: error.message || 'Failed to submit feedback' };
				}
			},
		}),
	}),
});

export const {
	// App Version
	useGetAppVersionQuery,
	// Feedback
	useSubmitFeedbackMutation,
} = apiSlice;
