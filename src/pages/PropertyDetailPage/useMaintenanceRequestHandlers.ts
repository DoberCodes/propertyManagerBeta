import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
	addMaintenanceRequest,
	convertRequestToTask,
	MaintenanceRequestItem,
} from '../../Redux/Slices/maintenanceRequestsSlice';
import { AppDispatch } from '../../Redux/store/store';
import {
	MaintenanceRequestHandlers,
	MaintenanceRequest,
} from '../../types/MaintenanceRequest.types';
import { TaskData } from '../../types/Task.types';
import { createMaintenanceRequestUtil } from './PropertyDetailPage.utils';
import { uploadMaintenanceRequestFiles } from '../../utils/maintenanceRequestUpload';
import { useCreateNotificationMutation } from '../../Redux/API/notificationSlice';

export const useMaintenanceRequestHandlers = (
	property: any,
	currentUser: any,
): MaintenanceRequestHandlers => {
	const dispatch = useDispatch<AppDispatch>();
	const [showMaintenanceRequestModal, setShowMaintenanceRequestModal] =
		useState(false);
	const [showConvertModal, setShowConvertModal] = useState(false);
	const [convertingRequest, setConvertingRequest] =
		useState<MaintenanceRequestItem | null>(null);
	const [createNotification] = useCreateNotificationMutation();

	const handleMaintenanceRequestSubmit = async (
		request: MaintenanceRequest,
	) => {
		if (!property || !currentUser) return;
		let newRequest: MaintenanceRequestItem | null = null;

		try {
			const rawFiles = (request.files || []).filter(
				(file): file is File => file instanceof File,
			);
			const uploadedFiles = await uploadMaintenanceRequestFiles(
				rawFiles,
				property.id,
			);
			newRequest = createMaintenanceRequestUtil(
				{
					...request,
					files: uploadedFiles,
				},
				property,
				currentUser,
			);
			dispatch(addMaintenanceRequest(newRequest));
		} catch (error) {
			console.error('Failed to upload maintenance request files:', error);
			alert('Failed to upload files. Please try again.');
			return;
		}

		if (!newRequest) {
			return;
		}

		// Create notification for maintenance request submission
		try {
			dispatch({
				type: 'maintenance_request_created',
				data: {
					requestId: newRequest.id,
					requestTitle: request.title,
					propertyId: property.id,
					propertyTitle: property.title,
					priority: request.priority,
				},
				status: 'unread',
				actionUrl: `/properties/${property.id}`,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
		} catch (error) {
			console.error('Error creating notification:', error);
		}

		setShowMaintenanceRequestModal(false);
		alert('Maintenance request submitted successfully!');
	};

	const handleConvertRequestToTask = (requestId: string) => {
		const request = (property as any).maintenanceRequests?.find(
			(r: any) => r.id === requestId,
		);
		if (request) {
			setConvertingRequest(request);
			setShowConvertModal(true);
		}
	};

	const handleConvertToTask = async (taskData: TaskData) => {
		if (!convertingRequest || !property || !currentUser) return;

		const newTask = {
			id: `task-${Date.now()}`,
			title: taskData.title,
			description: convertingRequest.description,
			priority: convertingRequest.priority,
			dueDate: taskData.dueDate,
			status: 'Pending' as const,
			propertyId: property.id,
			property: property.title,
			assignee: taskData.assignee,
			notes: taskData.notes,
			devices: taskData.devices || [],
			createdBy: currentUser.id,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		try {
			dispatch(convertRequestToTask(convertingRequest.id));

			setShowConvertModal(false);
			setConvertingRequest(null);
			alert('Maintenance request converted to task successfully!');
		} catch (error) {
			console.error('Error converting request:', error);
			alert('Failed to convert maintenance request to task');
		}
	};

	return {
		showMaintenanceRequestModal,
		setShowMaintenanceRequestModal,
		showConvertModal,
		setShowConvertModal,
		convertingRequest,
		setConvertingRequest,
		handleMaintenanceRequestSubmit,
		handleConvertRequestToTask,
		handleConvertToTask,
	};
};
