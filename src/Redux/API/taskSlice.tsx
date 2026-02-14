import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	updateDoc,
	where,
} from '@firebase/firestore';
import { CompletionFile, Task } from '../../types/Task.types';
import { apiSlice, docToData } from './apiSlice';
import { auth, db } from '../../config/firebase';
import { PropertyShare } from '../../types/Property.types';

export const taskSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Task endpoints
		getTasks: builder.query<Task[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					// Get user data to check for family account
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userData = userDoc.data();
					const accountId = userData?.accountId;
					const isAccountOwner = userData?.isAccountOwner;

					// Determine which user's data to fetch
					// For family members, use the account owner's ID
					const targetUserId =
						!isAccountOwner && accountId ? accountId : userId;

					// Get all properties for this user's groups
					const groupsQuery = query(
						collection(db, 'propertyGroups'),
						where('userId', '==', targetUserId),
					);
					const groupsSnapshot = await getDocs(groupsQuery);
					const groupIds = groupsSnapshot.docs.map((doc) => doc.id);

					let ownedPropertyIds: string[] = [];
					if (groupIds.length > 0) {
						// Get all property IDs for these groups
						for (let i = 0; i < groupIds.length; i += 10) {
							const batch = groupIds.slice(i, i + 10);
							const propertiesQuery = query(
								collection(db, 'properties'),
								where('groupId', 'in', batch),
							);
							const propertiesSnapshot = await getDocs(propertiesQuery);
							propertiesSnapshot.docs.forEach((doc) => {
								ownedPropertyIds.push(doc.id);
							});
						}
					}

					// Also get shared properties for this user
					let sharedPropertyIds: string[] = [];
					try {
						// Get user's email first
						const userDocRef = doc(db, 'users', userId);
						const userDoc = await getDoc(userDocRef);
						const userEmail = userDoc.data()?.email;

						if (userEmail) {
							// Find all shares where this user has access
							const sharesQuery = query(
								collection(db, 'propertyShares'),
								where('sharedWithEmail', '==', userEmail),
							);
							const sharesSnapshot = await getDocs(sharesQuery);
							sharedPropertyIds = sharesSnapshot.docs
								.map((doc) => doc.data() as PropertyShare)
								.filter(Boolean)
								.map((share) => share.propertyId);
						}
					} catch (shareError) {
						// If getting shared properties fails, continue with owned properties only
						console.warn('Could not fetch shared properties:', shareError);
					}

					// Combine and deduplicate property IDs
					const allPropertyIds = [
						...new Set([...ownedPropertyIds, ...sharedPropertyIds]),
					];

					if (allPropertyIds.length === 0) {
						return { data: [] };
					}

					if (allPropertyIds.length === 0) {
						return { data: [] };
					}

					// Fetch all tasks for these properties
					const allTasks: Task[] = [];
					for (let i = 0; i < allPropertyIds.length; i += 10) {
						const batch = allPropertyIds.slice(i, i + 10);
						const tasksQuery = query(
							collection(db, 'tasks'),
							where('propertyId', 'in', batch),
						);
						const tasksSnapshot = await getDocs(tasksQuery);
						const tasks = tasksSnapshot.docs
							.map((doc) => docToData(doc) as Task)
							.filter(Boolean) as Task[];
						allTasks.push(...tasks);
					}

					return { data: allTasks };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Tasks'],
		}),

		createTask: builder.mutation<Task, Omit<Task, 'id'>>({
			async queryFn(newTask) {
				try {
					const docRef = await addDoc(collection(db, 'tasks'), {
						...newTask,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return { data: { id: docRef.id, ...newTask } as Task };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks'],
		}),

		updateTask: builder.mutation<Task, { id: string; updates: Partial<Task> }>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'tasks', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as Task };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks'],
		}),

		deleteTask: builder.mutation<void, string>({
			async queryFn(taskId: string) {
				try {
					await deleteDoc(doc(db, 'tasks', taskId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks'],
		}),

		// Task completion workflow endpoints
		// Note: File upload now uses base64 encoding on the client side
		// See TaskCompletionModal.tsx for implementation

		submitTaskCompletion: builder.mutation<
			Partial<Task>,
			{
				taskId: string;
				completionDate: string;
				completionNotes?: string;
				completionFile: CompletionFile;
				completedBy: string;
				userType?: string;
			}
		>({
			async queryFn({
				taskId,
				completionDate,
				completionNotes,
				completionFile,
				completedBy,
				userType,
			}) {
				try {
					const docRef = doc(db, 'tasks', taskId);
					const taskSnapshot = await getDoc(docRef);
					if (!taskSnapshot.exists()) {
						return { error: 'Task not found' };
					}
					const taskData = taskSnapshot.data() as Task;
					const historyData = {
						...taskData,
						status: 'Completed',
						completionDate,
						completionFile,
						completedBy,
						completionNotes: completionNotes || taskData.completionNotes || '',
						originalTaskId: taskId,
						completedByUserType: userType,
						userId: taskData.userId,
						ownerId: taskData.userId,
						propertyId: taskData.propertyId,
						propertyTitle: taskData.propertyTitle || taskData.property,
						// Link recurring tasks together
						recurringTaskId: taskData.isRecurring
							? taskData.parentTaskId || taskId
							: undefined,
						updatedAt: new Date().toISOString(),
					};

					// Remove any undefined fields (Firebase doesn't allow them)
					Object.keys(historyData).forEach((key) => {
						if (historyData[key] === undefined) {
							delete historyData[key];
						}
					});

					await addDoc(collection(db, 'maintenanceHistory'), historyData);
					await deleteDoc(docRef);

					return {
						data: {
							id: taskId,
							status: 'Completed',
							completionDate,
							completionFile,
							completedBy,
							completionNotes,
						},
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks', 'MaintenanceHistory'],
		}),

		approveTask: builder.mutation<
			Partial<Task>,
			{ taskId: string; approvedBy: string }
		>({
			async queryFn({ taskId, approvedBy }) {
				try {
					const docRef = doc(db, 'tasks', taskId);
					const taskSnapshot = await getDoc(docRef);
					if (!taskSnapshot.exists()) {
						return { error: 'Task not found' };
					}
					const taskData = taskSnapshot.data() as Task;
					const approvedAt = new Date().toISOString();
					const updates = {
						status: 'Completed' as const,
						approvedBy,
						approvedAt,
						updatedAt: approvedAt,
					};

					const historyData = {
						...taskData,
						...updates,
						originalTaskId: taskId,
						// Link recurring tasks together
						recurringTaskId: taskData.isRecurring
							? taskData.parentTaskId || taskId
							: undefined,
					};

					// Remove any undefined fields (Firebase doesn't allow them)
					Object.keys(historyData).forEach((key) => {
						if (historyData[key] === undefined) {
							delete historyData[key];
						}
					});

					await addDoc(collection(db, 'maintenanceHistory'), historyData);
					await deleteDoc(docRef);

					// TODO: Send notification to the user who completed the task

					return { data: { id: taskId, ...updates } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks', 'MaintenanceHistory'],
		}),

		rejectTask: builder.mutation<
			Partial<Task>,
			{ taskId: string; rejectionReason: string }
		>({
			async queryFn({ taskId, rejectionReason }) {
				try {
					const docRef = doc(db, 'tasks', taskId);
					const updates = {
						status: 'Rejected' as const,
						rejectionReason,
						updatedAt: new Date().toISOString(),
					};

					await updateDoc(docRef, updates);

					// TODO: Send notification to the user with rejection reason

					return { data: { id: taskId, ...updates } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks'],
		}),
	}),
});

export const {
	useGetTasksQuery,
	useCreateTaskMutation,
	useUpdateTaskMutation,
	useDeleteTaskMutation,
	useSubmitTaskCompletionMutation,
	useApproveTaskMutation,
	useRejectTaskMutation,
} = taskSlice;
