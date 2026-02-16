import { Middleware } from '@reduxjs/toolkit';
import { addDoc, collection } from '@firebase/firestore';
import { db } from '../../config/firebase';
import { Notification } from '../../types/Notification.types';
import { apiSlice } from '../API/apiSlice';

const notificationMiddleware: Middleware =
	(store) => (next) => async (action) => {
		// Log all fulfilled actions for debugging
		if (action.type?.endsWith('/fulfilled')) {
			console.log('Fulfilled action:', action.type, action);
		}

		// Pass the action to the next middleware/reducer
		const result = next(action);

		// Check if this is a fulfilled RTK Query mutation
		if (action.type?.endsWith('/fulfilled')) {
			const state = store.getState();
			const currentUser = state.user.currentUser;

			// Define which mutations should trigger notifications
			const notificationTriggers = {
				createTask: {
					type: 'task_created',
					title: 'Task Created',
					message: 'A new task has been created',
				},
				createProperty: {
					type: 'property_created',
					title: 'Property Added',
					message: 'A new property has been added',
				},
				updateProperty: {
					type: 'property_updated',
					title: 'Property Updated',
					message: 'A property has been updated',
				},
				deleteProperty: {
					type: 'property_deleted',
					title: 'Property Deleted',
					message: 'A property has been deleted',
				},
			};

			const endpointName = action.meta.arg.endpointName;
			const trigger = notificationTriggers[endpointName];
			if (trigger && currentUser) {
				// Check if notifications are enabled (default to true if not set)
				const notificationsEnabled =
					currentUser.notificationPreferences?.enabled ?? true;
				const isNotificationEnabled =
					currentUser.notificationPreferences?.types?.[trigger.type] ?? true;

				console.log('Notification check:', {
					endpoint: endpointName,
					trigger: trigger.type,
					notificationsEnabled,
					isNotificationEnabled,
					userPrefs: currentUser.notificationPreferences,
				});

				if (notificationsEnabled && isNotificationEnabled) {
					// Create notification directly in Firestore
					try {
						const notificationData: Omit<Notification, 'id'> = {
							userId: currentUser.id,
							type: trigger.type,
							title: trigger.title,
							message: trigger.message,
							data: action.payload,
							status: 'unread',
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						};

						await addDoc(collection(db, 'notifications'), notificationData);
						console.log('Notification created:', notificationData);

						// Invalidate the notifications cache to trigger a refetch
						store.dispatch(apiSlice.util.invalidateTags(['Notifications']));
					} catch (error) {
						console.error('Failed to create notification:', error);
					}
				}
			}
		}

		return result;
	};

export default notificationMiddleware;
