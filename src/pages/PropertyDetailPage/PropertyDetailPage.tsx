import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowLeft,
	faEllipsisV,
	faCamera,
} from '@fortawesome/free-solid-svg-icons';
import { PropertyDetailPageProps } from '../../types/PropertyDetailPage.types';
import { RootState } from '../../Redux/store/store';
import { User } from '../../Redux/Slices/userSlice';
import { addTask } from '../../Redux/Slices/propertyDataSlice';
import { useTaskHandlers } from './useTaskHandlers';
import { useUnitHandlers } from './useUnitHandlers';
import { usePropertyEditHandlers } from './usePropertyEditHandlers';
import { useMaintenanceRequestHandlers } from './useMaintenanceRequestHandlers';
import { getPropertyFieldValueUtil } from './PropertyDetailPage.utils';
import {
	useGetTasksQuery,
	useGetTeamMembersQuery,
	useUpdateTaskMutation,
	useCreateTaskMutation,
	useDeleteTaskMutation,
	useGetPropertiesQuery,
	useGetUnitsQuery,
	useUpdatePropertyMutation,
	useCreateNotificationMutation,
	useGetPropertySharesQuery,
	useGetMaintenanceHistoryByPropertyQuery,
	useAddMaintenanceHistoryMutation,
	useUpdateMaintenanceHistoryMutation,
	useDeleteMaintenanceHistoryMutation,
	useGetDevicesQuery,
	useGetContractorsByPropertyQuery,
	useRemoveTenantMutation,
	useRevokeTenantInvitationCodeMutation,
	useLazyGetTenantInvitationCodeQuery,
	useLazyGetTenantInvitationCodesByEmailQuery,
	useCreateTenantInvitationCodeMutation,
	useUpdateTenantMutation,
} from '../../Redux/API/apiSlice';
import {
	canApproveMaintenanceRequest,
	isTenant,
} from '../../utils/permissions';
import { UserRole } from '../../constants/roles';
import { TeamMember } from '../../types/Team.types';
import { useFavorites } from '../../Hooks/useFavorites';
import {
	uploadPropertyImage,
	isValidPropertyImageFile,
} from '../../utils/propertyImageUpload';
import { getFamilyMembers } from '../../services/authService';
import { TaskCompletionModal } from '../../Components/TaskCompletionModal';
import { MaintenanceRequestModal } from '../../Components/MaintenanceRequestModal';
import { ConvertRequestToTaskModal } from '../../Components/ConvertRequestToTaskModal';
import { SharePropertyModal } from '../../Components/SharePropertyModal';
import { AddTenantModal } from '../../Components/AddTenantModal';
import { DeleteConfirmationModal } from '../../Components/Library/Modal/DeleteConfirmationModal';
import { Tabs, GenericModal } from '../../Components/Library';
import {
	EditTaskModal,
	CreateUnitModal,
	FormGroup,
	FormLabel,
	FormInput,
	FormSelect,
	FormTextarea,
} from '../../Components/Library';
import {
	Wrapper,
	Header,
	HeaderContent,
	PropertyTitle,
	FavoriteButton,
	BackButton,
	EmptyState,
	TitleContainer,
	EditableTitleInput,
	PencilIcon,
	TabControlsContainer,
	TabContentContainer,
} from './PropertyDetailPage.styles';
import {
	DetailsTab,
	TasksTab,
	DevicesTab,
	MaintenanceTab,
	TenantsTab,
	UnitsTab,
	SuitesTab,
	RequestsTab,
	ContractorsTab,
} from './tabs';

// Utility function to clean objects of undefined values for Firebase
const cleanObjectForFirebase = (obj: any): any => {
	if (obj === null || obj === undefined) return obj;
	if (typeof obj !== 'object') return obj;
	if (Array.isArray(obj)) {
		return obj.map(cleanObjectForFirebase).filter((item) => item !== undefined);
	}

	const cleaned: any = {};
	for (const [key, value] of Object.entries(obj)) {
		const cleanedValue = cleanObjectForFirebase(value);
		if (cleanedValue !== undefined) {
			cleaned[key] = cleanedValue;
		}
	}
	return cleaned;
};

export const PropertyDetailPage: React.FC<PropertyDetailPageProps> = (
	props,
) => {
	const navigate = useNavigate();
	const { slug } = useParams<{ slug: string }>();
	// Get current user
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	const { isFavorite, toggleFavorite } = useFavorites(currentUser!.id);

	// Fetch properties from Firebase
	const { data: firebaseProperties = [] } = useGetPropertiesQuery();

	// Get property groups from Redux (populated by DataLoader)
	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);

	// Fetch team members from Firebase
	const { data: firebaseTeamMembers = [] } = useGetTeamMembersQuery();

	// For backwards compatibility, also get from Redux - memoize to prevent rerenders
	const reduxTeamMembers = useSelector(
		(state: RootState) => {
			const members = state.team.groups.flatMap((group) => group.members);
			return members;
		},
		(a, b) => JSON.stringify(a) === JSON.stringify(b),
	);

	// Use Firebase team members if available, otherwise fallback to Redux
	const teamMembers =
		firebaseTeamMembers.length > 0 ? firebaseTeamMembers : reduxTeamMembers;

	// Family members state
	const [familyMembers, setFamilyMembers] = useState<User[]>([]);

	// Fetch tasks from Firebase
	const { data: allTasks = [] } = useGetTasksQuery();

	// Firebase mutations for updating tasks and properties
	const [updateTaskMutation] = useUpdateTaskMutation();
	const [createTaskMutation] = useCreateTaskMutation();
	const [deleteTaskMutation] = useDeleteTaskMutation();
	const [updatePropertyMutation] = useUpdatePropertyMutation();
	const [createNotification] = useCreateNotificationMutation();
	const [addMaintenanceHistory] = useAddMaintenanceHistoryMutation();
	const [updateMaintenanceHistory] = useUpdateMaintenanceHistoryMutation();
	const [deleteMaintenanceHistory] = useDeleteMaintenanceHistoryMutation();
	const [removeTenant] = useRemoveTenantMutation();
	const [revokeTenantInvitationCode] = useRevokeTenantInvitationCodeMutation();
	const [getTenantInvitationCode] = useLazyGetTenantInvitationCodeQuery();
	const [getTenantInvitationCodesByEmail] =
		useLazyGetTenantInvitationCodesByEmailQuery();
	const [createTenantInvitationCode] = useCreateTenantInvitationCodeMutation();
	const [updateTenant] = useUpdateTenantMutation();

	const dispatch = useDispatch();

	const [activeTab, setActiveTab] = useState<
		| 'details'
		| 'devices'
		| 'tasks'
		| 'maintenance'
		| 'tenants'
		| 'requests'
		| 'units'
		| 'suites'
		| 'contractors'
	>('details');
	const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
	const [showShareModal, setShowShareModal] = useState(false);
	const [showAddTenantModal, setShowAddTenantModal] = useState(false);
	const [showEditTenantModal, setShowEditTenantModal] = useState(false);
	const [editingTenant, setEditingTenant] = useState<any | null>(null);
	const [showDeleteTenantModal, setShowDeleteTenantModal] = useState(false);
	const [tenantToDelete, setTenantToDelete] = useState<any | null>(null);
	const [deleteTaskModalOpen, setDeleteTaskModalOpen] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<{
		id: string;
		title: string;
	} | null>(null);
	const propertyOverride = props.property;

	// Find the property based on slug from Firebase data - move up to use in hooks
	const property = useMemo(() => {
		return propertyOverride
			? propertyOverride
			: firebaseProperties.find((p: any) => p.slug === slug);
	}, [slug, firebaseProperties, propertyOverride]);

	const handleEditTenant = (tenant: any) => {
		setEditingTenant(tenant);
		setShowEditTenantModal(true);
	};

	const handleDeleteTenant = (tenant: any) => {
		setTenantToDelete(tenant);
		setShowDeleteTenantModal(true);
	};

	const handleConfirmDeleteTenant = async () => {
		if (!tenantToDelete || !property?.id) return;
		try {
			await removeTenant({
				propertyId: property.id,
				tenantId: tenantToDelete.id,
			}).unwrap();
		} catch (error) {
			console.error('Failed to delete tenant:', error);
		} finally {
			setShowDeleteTenantModal(false);
			setTenantToDelete(null);
		}
	};

	const handleRevokeTenantPromo = async (tenant: any) => {
		if (!property?.id || !tenant?.email) return;
		const confirmRevoke = window.confirm(
			`Revoke any active invitation code for ${tenant.email}?`,
		);
		if (!confirmRevoke) return;
		try {
			await revokeTenantInvitationCode({
				propertyId: property.id,
				tenantEmail: tenant.email,
			}).unwrap();
		} catch (error) {
			console.error('Failed to revoke promo code:', error);
		}
	};

	const handleViewTenantPromo = async (tenant: any) => {
		if (!tenant?.email) {
			alert('Tenant email is required to find promo code.');
			return;
		}

		let promoCode: any = null;

		// First try to get promo code by direct ID if available
		if (tenant.tenantInvitationCodeId) {
			try {
				promoCode = await getTenantInvitationCode(
					tenant.tenantInvitationCodeId,
				).unwrap();
			} catch (error) {
				console.error('Failed to fetch promo code by ID:', error);
			}
		}

		// If no promo code found by ID, search by email
		if (!promoCode) {
			try {
				const promoCodes = await getTenantInvitationCodesByEmail(
					tenant.email,
				).unwrap();
				if (promoCodes && promoCodes.length > 0) {
					// Get the most recent promo code
					promoCode = promoCodes[0];
				}
			} catch (error) {
				console.error('Failed to fetch promo codes by email:', error);
			}
		}

		if (promoCode) {
			let statusMessage = `Status: ${promoCode.status}`;
			if (promoCode.status === 'redeemed' && promoCode.redeemedAt) {
				statusMessage += ` (Redeemed on ${new Date(
					promoCode.redeemedAt,
				).toLocaleDateString()})`;
			} else if (promoCode.status === 'revoked' && promoCode.revokedAt) {
				statusMessage += ` (Revoked on ${new Date(
					promoCode.revokedAt,
				).toLocaleDateString()})`;
			}
			alert(`Promo Code: ${promoCode.code}\n${statusMessage}`);
		} else {
			alert('No promo code found for this tenant.');
		}
	};

	const handleRegenerateTenantPromo = async (tenant: any) => {
		if (!tenant?.email || !property?.id) {
			alert('Tenant email and property ID are required.');
			return;
		}

		const confirmRegenerate = window.confirm(
			`This will revoke any existing promo codes for ${tenant.email} and create a new one. Continue?`,
		);
		if (!confirmRegenerate) return;

		try {
			// First revoke any existing active invitation codes
			await revokeTenantInvitationCode({
				propertyId: property.id,
				tenantEmail: tenant.email,
			}).unwrap();

			// Create a new invitation code
			const promoCodeResult = await createTenantInvitationCode({
				propertyId: property.id,
				tenantEmail: tenant.email,
				code: `TENANT-${Math.random()
					.toString(36)
					.slice(2, 6)
					.toUpperCase()}-${Math.random()
					.toString(36)
					.slice(2, 6)
					.toUpperCase()}`,
			}).unwrap();

			// Update the tenant record with the new promo code ID
			if (tenant.id) {
				await updateTenant({
					propertyId: property.id,
					tenantId: tenant.id,
					updates: { tenantInvitationCodeId: promoCodeResult.id },
				}).unwrap();
			}

			alert(`New promo code created: ${promoCodeResult.code}`);
		} catch (error) {
			console.error('Failed to regenerate promo code:', error);
			alert('Failed to regenerate promo code. Please try again.');
		}
	};

	// Handle task deletion with confirmation
	const handleTaskDeleteClick = (taskIds: string[]) => {
		if (taskIds.length === 0) return;
		const task = allTasks.find((t) => t.id === taskIds[0]);
		if (task) {
			setTaskToDelete({ id: taskIds[0], title: task.title });
			setDeleteTaskModalOpen(true);
		}
	};

	// Import handlers from custom hooks
	const taskHandlers = useTaskHandlers({
		onDeleteClick: handleTaskDeleteClick,
		deleteTaskMutation,
	});
	const unitHandlers = useUnitHandlers(property?.id || '');
	const propertyHandlers = usePropertyEditHandlers();
	const maintenanceHandlers = useMaintenanceRequestHandlers(
		property,
		currentUser,
	);

	// Fetch contractors for this property
	const { data: propertyContractors = [] } = useGetContractorsByPropertyQuery(
		property?.id || '',
		{ skip: !property?.id },
	);

	// Fetch units for this property
	const { data: propertyUnits = [] } = useGetUnitsQuery(property?.id || '', {
		skip: !property?.id,
	});

	// Destructure task handlers
	const {
		selectedTasks,
		setSelectedTasks,
		showTaskDialog,
		setShowTaskDialog,
		editingTaskId,
		showTaskAssignDialog,
		setShowTaskAssignDialog,
		assigningTaskId,
		selectedAssignee,
		setSelectedAssignee,
		showTaskCompletionModal,
		setShowTaskCompletionModal,
		completingTaskId,
		taskFormData,
		setTaskFormData,
		handleTaskCheckbox,
		handleCreateTask,
		handleEditTask,
		handleDeleteTask,
		handleAssignTask,
		handleCompleteTask,
		handleTaskFormChange,
		handleTaskCompletionSuccess,
		confirmDeleteTask,
	} = taskHandlers;

	// Destructure unit handlers
	const {
		showUnitDialog,
		setShowUnitDialog,
		unitFormData,
		handleCreateUnit,
		handleUnitFormChange,
		handleUnitFormSubmit,
		handleDeleteUnit,
	} = unitHandlers;

	// Maintenance history handlers
	const handleAddMaintenanceHistory = async (data: {
		title: string;
		completionDate: string;
		completedBy?: string;
		completedByName?: string;
		completionNotes?: string;
		unitId?: string;
		completionFile?: File;
		recurringTaskId?: string;
		linkedTaskIds?: string[];
	}) => {
		if (!property?.id) return;

		try {
			await addMaintenanceHistory({
				propertyId: property.id,
				propertyTitle: property.title,
				...data,
			}).unwrap();
		} catch (error) {
			console.error('Failed to add maintenance history:', error);
			alert('Failed to add maintenance history. Please try again.');
		}
	};

	const handleUpdateMaintenanceHistory = async (
		id: string,
		updates: Partial<any>,
	) => {
		try {
			await updateMaintenanceHistory({ id, updates }).unwrap();
		} catch (error) {
			console.error('Failed to update maintenance history:', error);
			alert('Failed to update maintenance history. Please try again.');
		}
	};

	const handleDeleteMaintenanceHistory = async (historyId: string) => {
		if (
			!window.confirm(
				'Are you sure you want to delete this maintenance history record?',
			)
		) {
			return;
		}

		try {
			await deleteMaintenanceHistory(historyId).unwrap();
		} catch (error) {
			console.error('Failed to delete maintenance history:', error);
			alert('Failed to delete maintenance history. Please try again.');
		}
	};

	// Destructure property edit handlers
	const {
		isEditMode,
		setIsEditMode,
		editedProperty,
		isEditingTitle,
		setIsEditingTitle,
		editedTitle,
		setEditedTitle,
		isUploadingImage,
		setIsUploadingImage,
		imageError,
		setImageError,
		deviceFormData,
		showDeviceDialog,
		setShowDeviceDialog,
		handlePropertyFieldChange,
		handleDeviceFormChange,
		handleDeviceFormSubmit,
		handleTitleEdit,
		handleTitleSave,
	} = propertyHandlers;

	// Destructure maintenance request handlers
	const {
		showMaintenanceRequestModal,
		setShowMaintenanceRequestModal,
		showConvertModal,
		setShowConvertModal,
		convertingRequest,
		setConvertingRequest,
		handleMaintenanceRequestSubmit,
		handleConvertRequestToTask,
		handleConvertToTask,
	} = maintenanceHandlers;

	// Only fetch property shares for the property of the task being assigned
	const assigningTask = allTasks.find((t) => t.id === assigningTaskId);
	const { data: propertyShares = [] } = useGetPropertySharesQuery(
		assigningTask?.propertyId ?? '',
		{ skip: !assigningTask },
	);
	const sharedUsers = propertyShares.map((share) => ({
		id: share.sharedWithUserId || share.sharedWithEmail,
		firstName: share.sharedWithEmail?.split('@')[0] || 'Shared User',
		lastName: '',
		email: share.sharedWithEmail,
		isSharedUser: true,
	}));

	const hasCommercialSuites =
		property?.propertyType === 'Commercial' &&
		(((property as any)?.hasSuites ?? false) ||
			(Array.isArray((property as any)?.suites) &&
				(property as any).suites.length > 0));

	// Get maintenance requests for this property - memoize selector
	const allMaintenanceRequests = useSelector(
		(state: RootState) => state.maintenanceRequests.requests,
		(a, b) => a.length === b.length && a.every((item, idx) => item === b[idx]),
	);
	const propertyMaintenanceRequests = useMemo(() => {
		if (!property) return [];
		return allMaintenanceRequests.filter(
			(req) => req.propertyId === property.id,
		);
	}, [property, allMaintenanceRequests]);

	useEffect(() => {
		if (hasCommercialSuites && activeTab === 'tenants') {
			setActiveTab('suites');
		}
	}, [hasCommercialSuites, activeTab]);

	// Filter tasks for this property
	const propertyTasks = useMemo(() => {
		if (!property) return [];
		// Match by property ID if it exists, otherwise try matching by title
		const allPropertyTasks = allTasks.filter(
			(task) =>
				task.propertyId === property.id || task.property === property.title,
		);
		// Filter out completed tasks - they should show in Maintenance History instead
		return allPropertyTasks.filter((task) => task.status !== 'Completed');
	}, [property, allTasks]);

	const { data: maintenanceHistoryRecords = [] } =
		useGetMaintenanceHistoryByPropertyQuery(property?.id || '', {
			skip: !property?.id,
		});

	const maintenanceHistoryOptions = useMemo(() => {
		return maintenanceHistoryRecords.map((record) => {
			const dateLabel = record.completionDate
				? new Date(record.completionDate).toLocaleDateString()
				: 'No date';
			return {
				label: `${record.title || 'Maintenance'} - ${dateLabel}`,
				value: record.id,
			};
		});
	}, [maintenanceHistoryRecords]);

	useEffect(() => {
		if (!editingTaskId) return;
		const taskToEdit = allTasks.find((t) => t.id === editingTaskId);
		if (!taskToEdit) return;

		setTaskFormData({
			title: taskToEdit.title || '',
			dueDate: taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : '',
			status: taskToEdit.status || 'Pending',
			notes: taskToEdit.notes || '',
			priority: taskToEdit.priority,
			assignedTo: taskToEdit.assignedTo?.id || taskToEdit.assignee || '',
			devices: taskToEdit.devices || [],
			isRecurring: taskToEdit.isRecurring || false,
			recurrenceFrequency: taskToEdit.recurrenceFrequency,
			recurrenceInterval: taskToEdit.recurrenceInterval,
			recurrenceCustomUnit: taskToEdit.recurrenceCustomUnit,
			enableNotifications: (taskToEdit as any).enableNotifications || false,
			notifications: (taskToEdit as any).notifications || [],
			maintenanceGroupId: taskToEdit.maintenanceGroupId,
		});
	}, [editingTaskId, allTasks, maintenanceHistoryRecords, setTaskFormData]);

	// Get property shares for assignee options
	const { data: currentPropertyShares = [] } = useGetPropertySharesQuery(
		property?.id || '',
		{ skip: !property?.id },
	);

	// Load family members if user has an account
	useEffect(() => {
		const loadFamilyMembers = async () => {
			if (currentUser?.accountId) {
				try {
					const members = await getFamilyMembers(currentUser.accountId);
					setFamilyMembers(members);
				} catch (error) {
					console.error('Failed to load family members:', error);
				}
			}
		};
		loadFamilyMembers();
	}, [currentUser?.accountId]);

	// Generate assignee options for task editing
	const assigneeOptions = useMemo(() => {
		const assignees: Array<{ label: string; value: string }> = [];

		// Add shared users (only those with user accounts for notifications)
		currentPropertyShares
			.filter((share) => share.sharedWithUserId) // Only include users with accounts
			.forEach((share) => {
				const fullName =
					share.sharedWithFirstName && share.sharedWithLastName
						? `${share.sharedWithFirstName} ${share.sharedWithLastName}`
						: share.sharedWithEmail?.split('@')[0] || 'Shared User';
				assignees.push({
					label: fullName,
					value: share.sharedWithUserId,
				});
			});

		// Add team members
		teamMembers
			.filter((member): member is TeamMember => member !== undefined)
			.forEach((member) => {
				assignees.push({
					label: `${member.firstName || ''} ${member.lastName || ''} (${
						member.title || ''
					})`.trim(),
					value: member.id,
				});
			});

		// Add contractors
		propertyContractors.forEach((contractor) => {
			assignees.push({
				label: `${contractor.name} (${contractor.category})`,
				value: contractor.id,
			});
		});

		// Add family members
		familyMembers.forEach((member) => {
			assignees.push({
				label: `${member.firstName} ${member.lastName}`,
				value: member.id,
			});
		});

		// Remove duplicates based on value
		const uniqueAssignees = assignees.filter(
			(assignee, index, self) =>
				index === self.findIndex((a) => a.value === assignee.value),
		);

		return uniqueAssignees;
	}, [
		property,
		currentUser,
		currentPropertyShares,
		teamMembers,
		propertyContractors,
		familyMembers,
	]);

	// Generate device options for task connection
	const { data: propertyDevices = [] } = useGetDevicesQuery(
		property?.id || '',
		{
			skip: !property?.id,
		},
	);
	const deviceOptions = useMemo(() => {
		return propertyDevices.map((device: any) => ({
			label: `${device.type} - ${device.brand} ${device.model}`,
			value: device.id,
		}));
	}, [propertyDevices]);

	// Helper function for property field value - use util if not in edit mode
	const getPropertyFieldValue = (field: string) => {
		return getPropertyFieldValueUtil(
			field,
			property,
			editedProperty,
			isEditMode,
		);
	};

	// Photo upload handler
	const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && property) {
			if (!isValidPropertyImageFile(file)) {
				setImageError('Invalid file. Please upload an image under 8MB.');
				return;
			}

			setImageError(null);
			setIsUploadingImage(true);

			try {
				const imageUrl = await uploadPropertyImage(file, property.id);
				await updatePropertyMutation({
					id: property.id,
					updates: {
						image: imageUrl,
					},
				}).unwrap();

				// Create notification for property image update
				try {
					await createNotification({
						userId: currentUser!.id,
						type: 'property_updated',
						title: 'Property Updated',
						message: `Property image for "${property.title}" has been updated`,
						data: {
							propertyId: property.id,
							propertyTitle: property.title,
						},
						status: 'unread',
						actionUrl: `/properties/${property.id}`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				} catch (notifError) {
					console.error('Notification failed:', notifError);
				}

				setIsUploadingImage(false);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Failed to upload image';
				setImageError(errorMessage);
				setIsUploadingImage(false);
			}
			// Clear the file input
			e.target.value = '';
		}
	};

	const syncTaskMaintenanceLinks = async (
		taskId: string,
		selectedHistoryIds: string[],
	) => {
		if (!selectedHistoryIds.length && !maintenanceHistoryRecords.length) return;

		const currentLinkedIds = maintenanceHistoryRecords
			.filter((record) => record.linkedTaskIds?.includes(taskId))
			.map((record) => record.id);
		const toAdd = selectedHistoryIds.filter(
			(id) => !currentLinkedIds.includes(id),
		);
		const toRemove = currentLinkedIds.filter(
			(id) => !selectedHistoryIds.includes(id),
		);

		for (const historyId of toAdd) {
			const record = maintenanceHistoryRecords.find(
				(history) => history.id === historyId,
			);
			if (!record) continue;
			const linkedTaskIds = record.linkedTaskIds || [];
			const updatedLinkedTaskIds = Array.from(
				new Set([...linkedTaskIds, taskId]),
			);
			await updateMaintenanceHistory({
				id: historyId,
				updates: { linkedTaskIds: updatedLinkedTaskIds },
			}).unwrap();
		}

		for (const historyId of toRemove) {
			const record = maintenanceHistoryRecords.find(
				(history) => history.id === historyId,
			);
			if (!record) continue;
			const linkedTaskIds = (record.linkedTaskIds || []).filter(
				(id) => id !== taskId,
			);
			await updateMaintenanceHistory({
				id: historyId,
				updates: { linkedTaskIds },
			}).unwrap();
		}
	};

	// Task form submit handler
	const handleTaskFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!property || !taskFormData.title.trim()) return;

		try {
			if (editingTaskId !== null) {
				// Update existing task
				const taskToUpdate = allTasks.find((t) => t.id === editingTaskId);
				if (taskToUpdate) {
					const reduxStatus =
						taskFormData.status === 'Hold'
							? 'Pending'
							: taskFormData.status === 'Overdue'
							? 'Pending'
							: taskFormData.status;

					const safeTeamMembers = teamMembers.filter(
						(member): member is TeamMember => Boolean(member),
					);
					// Find assigned person from team members, contractors, or shared users
					let assignedTo: any = taskFormData.assignedTo
						? safeTeamMembers.find(
								(member) => member.id === taskFormData.assignedTo,
						  )
						: undefined;

					// If not found in team members, check contractors
					if (!assignedTo && taskFormData.assignedTo) {
						const contractor = propertyContractors.find(
							(c) => c.id === taskFormData.assignedTo,
						);
						if (contractor) {
							assignedTo = {
								id: contractor.id,
								firstName: contractor.name,
								lastName: '',
								email: contractor.email || '',
								title: contractor.category,
							};
						}
					}

					// If still not found, check shared users
					if (!assignedTo && taskFormData.assignedTo) {
						const sharedUser = currentPropertyShares.find(
							(share) =>
								(share.sharedWithUserId || share.sharedWithEmail) ===
								taskFormData.assignedTo,
						);
						if (sharedUser) {
							assignedTo = {
								id: sharedUser.sharedWithUserId || sharedUser.sharedWithEmail,
								firstName:
									sharedUser.sharedWithFirstName ||
									sharedUser.sharedWithEmail?.split('@')[0] ||
									'Shared User',
								lastName: sharedUser.sharedWithLastName || '',
								email: sharedUser.sharedWithEmail || '',
								title: 'Co-owner',
							};
						}
					}

					// Build updates object and filter out undefined values (Firebase doesn't support undefined)
					const updates: any = {
						title: taskFormData.title,
						dueDate: taskFormData.dueDate,
						status: reduxStatus,
						notes: taskFormData.notes,
						isRecurring: Boolean(taskFormData.isRecurring),
						devices: taskFormData.devices || [],
						enableNotifications: Boolean(taskFormData.enableNotifications),
					};

					// Only add priority if it has a value
					if (taskFormData.priority) {
						updates.priority = taskFormData.priority;
					}

					if (taskFormData.notifications) {
						updates.notifications = taskFormData.notifications;
					}

					if (assignedTo) {
						updates.assignedTo = {
							id: assignedTo.id,
							name: `${assignedTo.firstName || ''} ${
								assignedTo.lastName || ''
							}`.trim(),
							email: assignedTo.email,
						};
					}

					if (taskFormData.recurrenceFrequency) {
						updates.recurrenceFrequency = taskFormData.recurrenceFrequency;
					}
					if (taskFormData.recurrenceInterval) {
						updates.recurrenceInterval = taskFormData.recurrenceInterval;
					}
					if (taskFormData.recurrenceCustomUnit) {
						updates.recurrenceCustomUnit = taskFormData.recurrenceCustomUnit;
					}

					await updateTaskMutation({
						id: editingTaskId,
						updates: cleanObjectForFirebase(updates),
					}).unwrap();

					// Create notification for task update
					try {
						await createNotification({
							userId: currentUser!.id,
							type: 'task_updated',
							title: 'Task Updated',
							message: `Task "${taskFormData.title}" has been updated`,
							data: {
								taskId: editingTaskId,
								taskTitle: taskFormData.title,
								propertyId: property.id,
								propertyTitle: property.title,
							},
							status: 'unread',
							actionUrl: `/properties/${property.id}`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						}).unwrap();
					} catch (notifError) {
						console.error('Notification failed:', notifError);
					}

					// Create notification for task assignment change (to assignee if different from current user)
					if (assignedTo && assignedTo.id !== currentUser!.id) {
						// Check if assignment changed
						const previousAssignedTo = taskToUpdate.assignedTo;
						const assignmentChanged =
							!previousAssignedTo || previousAssignedTo.id !== assignedTo.id;

						if (assignmentChanged) {
							try {
								await createNotification({
									userId: assignedTo.id,
									type: 'task_assigned',
									title: 'Task Assigned',
									message: `You have been assigned to task "${taskFormData.title}"`,
									data: {
										taskId: editingTaskId,
										taskTitle: taskFormData.title,
										assignedTo: {
											id: assignedTo.id,
											name: `${assignedTo.firstName || ''} ${
												assignedTo.lastName || ''
											}`.trim(),
											email: assignedTo.email,
										},
										propertyId: property.id,
										propertyTitle: property.title,
									},
									status: 'unread',
									actionUrl: `/properties/${property.id}`,
									createdAt: new Date().toISOString(),
									updatedAt: new Date().toISOString(),
								}).unwrap();
							} catch (assignNotifError) {
								console.error(
									'Assignment notification failed:',
									assignNotifError,
								);
							}
						}
					}
				}
			} else {
				// Add new task
				const reduxStatus =
					taskFormData.status === 'Hold'
						? 'Pending'
						: taskFormData.status === 'Overdue'
						? 'Pending'
						: taskFormData.status;

				const safeTeamMembers = teamMembers.filter(
					(member): member is TeamMember => Boolean(member),
				);
				// Find assigned person from team members, contractors, or shared users
				let assignedTo: any = taskFormData.assignedTo
					? safeTeamMembers.find(
							(member) => member.id === taskFormData.assignedTo,
					  )
					: undefined;

				// If not found in team members, check contractors
				if (!assignedTo && taskFormData.assignedTo) {
					const contractor = propertyContractors.find(
						(c) => c.id === taskFormData.assignedTo,
					);
					if (contractor) {
						assignedTo = {
							id: contractor.id,
							firstName: contractor.name,
							lastName: '',
							email: contractor.email || '',
							title: contractor.category,
						};
					}
				}

				// If still not found, check shared users
				if (!assignedTo && taskFormData.assignedTo) {
					const sharedUser = currentPropertyShares.find(
						(share) =>
							(share.sharedWithUserId || share.sharedWithEmail) ===
							taskFormData.assignedTo,
					);
					if (sharedUser) {
						assignedTo = {
							id: sharedUser.sharedWithUserId || sharedUser.sharedWithEmail,
							firstName:
								sharedUser.sharedWithFirstName ||
								sharedUser.sharedWithEmail?.split('@')[0] ||
								'Shared User',
							lastName: sharedUser.sharedWithLastName || '',
							email: sharedUser.sharedWithEmail || '',
							title: 'Co-owner',
						};
					}
				}

				// Build new task object and filter out undefined values (Firebase doesn't support undefined)
				const newTask: any = {
					userId: currentUser!.id,
					title: taskFormData.title,
					dueDate: taskFormData.dueDate,
					status: reduxStatus,
					property: property.title,
					propertyId: property.id,
					notes: taskFormData.notes,
					isRecurring: Boolean(taskFormData.isRecurring),
					devices: taskFormData.devices || [],
					enableNotifications: Boolean(taskFormData.enableNotifications),
				};

				// Only add priority if it has a value
				if (taskFormData.priority) {
					newTask.priority = taskFormData.priority;
				}

				if (taskFormData.notifications) {
					newTask.notifications = taskFormData.notifications;
				}

				if (assignedTo) {
					newTask.assignedTo = {
						id: assignedTo.id,
						name: `${assignedTo.firstName || ''} ${
							assignedTo.lastName || ''
						}`.trim(),
						email: assignedTo.email,
					};
				}

				if (taskFormData.recurrenceFrequency) {
					newTask.recurrenceFrequency = taskFormData.recurrenceFrequency;
					// Set default interval of 1 for non-custom frequencies
					if (taskFormData.recurrenceFrequency !== 'custom') {
						newTask.recurrenceInterval = 1;
					}
				}
				if (taskFormData.recurrenceInterval) {
					newTask.recurrenceInterval = taskFormData.recurrenceInterval;
				}
				if (taskFormData.recurrenceCustomUnit) {
					newTask.recurrenceCustomUnit = taskFormData.recurrenceCustomUnit;
				}

				const createdTask = await createTaskMutation(
					cleanObjectForFirebase(newTask),
				).unwrap();

				// Add to Redux state immediately for UI update
				dispatch(addTask(createdTask));

				// Create notification for task creation (to creator)
				try {
					await createNotification({
						userId: currentUser!.id,
						type: 'task_created',
						title: 'Task Created',
						message: `New task "${taskFormData.title}" has been created`,
						data: {
							taskId: createdTask.id,
							taskTitle: taskFormData.title,
							propertyId: property.id,
							propertyTitle: property.title,
						},
						status: 'unread',
						actionUrl: `/properties/${property.id}`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				} catch (notifError) {
					console.error('Notification failed:', notifError);
				}

				// Create notification for task assignment (to assignee if different from creator)
				if (assignedTo && assignedTo.id !== currentUser!.id) {
					try {
						await createNotification({
							userId: assignedTo.id,
							type: 'task_assigned',
							title: 'Task Assigned',
							message: `You have been assigned to task "${taskFormData.title}"`,
							data: {
								taskId: createdTask.id, // Use the actual task ID from Firestore
								taskTitle: taskFormData.title,
								assignedTo: {
									id: assignedTo.id,
									name: `${assignedTo.firstName || ''} ${
										assignedTo.lastName || ''
									}`.trim(),
									email: assignedTo.email,
								},
								propertyId: property.id,
								propertyTitle: property.title,
							},
							status: 'unread',
							actionUrl: `/properties/${property.id}`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						}).unwrap();
					} catch (assignNotifError) {
						console.error('Assignment notification failed:', assignNotifError);
					}
				}

				// Create additional notification for recurring tasks
				if (taskFormData.isRecurring) {
					console.log(
						'Creating recurring task notification for:',
						taskFormData.title,
						'isRecurring:',
						taskFormData.isRecurring,
					);
					try {
						const recurrenceText =
							taskFormData.recurrenceFrequency === 'custom'
								? `every ${taskFormData.recurrenceInterval || 1} ${
										taskFormData.recurrenceCustomUnit
								  }`
								: `every ${taskFormData.recurrenceFrequency}`;

						console.log('Recurrence text:', recurrenceText);
						await createNotification({
							userId: currentUser!.id,
							type: 'task_created',
							title: 'Recurring Task Created',
							message: `Recurring task "${taskFormData.title}" has been created (${recurrenceText})`,
							data: {
								taskTitle: taskFormData.title,
								propertyId: property.id,
								propertyTitle: property.title,
								isRecurring: true,
								recurrenceFrequency: taskFormData.recurrenceFrequency,
								recurrenceInterval:
									taskFormData.recurrenceFrequency === 'custom'
										? taskFormData.recurrenceInterval
										: 1,
							},
							status: 'unread',
							actionUrl: `/properties/${property.id}`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						}).unwrap();
						console.log('Recurring task notification created successfully');
					} catch (recurringNotifError) {
						console.error(
							'Recurring task notification failed:',
							recurringNotifError,
						);
					}
				} else {
					console.log(
						'Task is not recurring, skipping recurring notification. isRecurring:',
						taskFormData.isRecurring,
					);
				}
			}
			setShowTaskDialog(false);
			setSelectedTasks([]);
			setTaskFormData({
				title: '',
				dueDate: '',
				status: 'Pending',
				notes: '',
				devices: [],
			});
		} catch (error) {
			console.error('Error saving task:', error);
			alert('Failed to save task. Please try again.');
		}
	};

	// Confirm assignment handler
	const handleConfirmAssignment = async () => {
		if (assigningTaskId && selectedAssignee) {
			try {
				const taskToAssign = allTasks.find((t) => t.id === assigningTaskId);
				// assignedTo should be an object: { id, name, email }
				await updateTaskMutation({
					id: assigningTaskId,
					updates: { assignedTo: selectedAssignee },
				}).unwrap();

				// Create notification for task assignment
				try {
					await createNotification({
						userId: selectedAssignee.id,
						type: 'task_assigned',
						title: 'Task Assigned',
						message: `You have been assigned to task "${taskToAssign?.title}"`,
						data: {
							taskId: assigningTaskId,
							taskTitle: taskToAssign?.title,
							assignedTo: selectedAssignee,
							propertyId: property?.id,
							propertyTitle: property?.title,
						},
						status: 'unread',
						actionUrl: `/properties/${property?.id}`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				} catch (notifError) {
					console.error('Notification failed:', notifError);
				}

				setShowTaskAssignDialog(false);
				setSelectedAssignee(null);
				setSelectedTasks([]);
			} catch (error) {
				console.error('Error assigning task:', error);
			}
		}
	};

	if (!property) {
		return (
			<Wrapper>
				<EmptyState>
					<h2>Property not found</h2>
					<p>The property you're looking for doesn't exist.</p>
					<BackButton onClick={() => navigate('/manage')}>
						← Back to Properties
					</BackButton>
				</EmptyState>
			</Wrapper>
		);
	}

	const isFav = isFavorite(property.id);

	return (
		<Wrapper>
			<Header style={{ backgroundImage: `url(${property.image})` }}>
				<BackButton onClick={() => navigate('/properties')} title='Go back'>
					<FontAwesomeIcon icon={faArrowLeft} />
				</BackButton>
				{/* 3-dot menu for mobile */}
				{currentUser && (
					<div
						style={{
							position: 'absolute',
							top: '20px',
							right: '20px',
							display: 'none',
							zIndex: 100,
						}}
						className='mobile-action-menu'>
						<button
							onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
							style={{
								background: 'none',
								border: 'none',
								padding: '8px 12px',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '20px',
								color: 'white',
								zIndex: 3,
							}}
							title='More options'>
							<FontAwesomeIcon icon={faEllipsisV} />
						</button>
						{isActionMenuOpen && (
							<div
								style={{
									position: 'absolute',
									top: '40px',
									right: '0',
									background: '#ffffff',
									border: '1px solid #e5e7eb',
									borderRadius: '6px',
									boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
									minWidth: '220px',
									zIndex: 1002,
									overflow: 'hidden',
								}}>
								{!isTenant(currentUser.role as UserRole) && (
									<button
										onClick={() => {
											toggleFavorite({
												id: property.id,
												title: property.title,
												slug: property.slug,
											});
											setIsActionMenuOpen(false);
										}}
										style={{
											width: '100%',
											padding: '12px 16px',
											border: 'none',
											background: 'none',
											textAlign: 'left',
											cursor: 'pointer',
											fontSize: '14px',
											color: '#1a1a1a',
											transition: 'background-color 0.2s ease',
											borderBottom: '1px solid #f0f0f0',
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.backgroundColor = '#f3f4f6')
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.backgroundColor = 'transparent')
										}>
										{isFav ? '★ Favorited' : '☆ Add to Favorites'}
									</button>
								)}
								{isTenant(currentUser.role as UserRole) && (
									<button
										onClick={() => {
											setShowMaintenanceRequestModal(true);
											setIsActionMenuOpen(false);
										}}
										style={{
											width: '100%',
											padding: '12px 16px',
											border: 'none',
											background: 'none',
											textAlign: 'left',
											cursor: 'pointer',
											fontSize: '14px',
											color: '#1a1a1a',
											transition: 'background-color 0.2s ease',
											borderBottom: '1px solid #f0f0f0',
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.backgroundColor = '#f3f4f6')
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.backgroundColor = 'transparent')
										}>
										🔧 Request Maintenance
									</button>
								)}
								{property &&
									(propertyGroups.some(
										(group) =>
											group.id === property.groupId &&
											group.userId === currentUser.id,
									) ||
										currentPropertyShares.some(
											(share) =>
												share.sharedWithUserId === currentUser.id &&
												share.permission === 'co-owner',
										)) && (
										<button
											onClick={() => {
												setShowShareModal(true);
												setIsActionMenuOpen(false);
											}}
											style={{
												width: '100%',
												padding: '12px 16px',
												border: 'none',
												background: 'none',
												textAlign: 'left',
												cursor: 'pointer',
												fontSize: '14px',
												color: '#1a1a1a',
												transition: 'background-color 0.2s ease',
											}}
											onMouseEnter={(e) =>
												(e.currentTarget.style.backgroundColor = '#f3f4f6')
											}
											onMouseLeave={(e) =>
												(e.currentTarget.style.backgroundColor = 'transparent')
											}>
											👥 Share Property
										</button>
									)}
								{!isUploadingImage && (
									<label
										htmlFor='header-photo-upload'
										style={{
											width: '100%',
											padding: '12px 16px',
											border: 'none',
											background: 'none',
											textAlign: 'left',
											cursor: 'pointer',
											fontSize: '14px',
											color: '#1a1a1a',
											transition: 'background-color 0.2s ease',
											display: 'block',
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.backgroundColor = '#f3f4f6')
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.backgroundColor = 'transparent')
										}
										title='Click to upload property image'>
										<FontAwesomeIcon
											icon={faCamera}
											style={{ marginRight: '8px' }}
										/>
										Change Photo
									</label>
								)}
							</div>
						)}
					</div>
				)}
				{imageError && (
					<div
						style={{
							position: 'relative',
							zIndex: 10,
							color: '#dc2626',
							fontSize: '14px',
							padding: '8px 12px',
							backgroundColor: '#fee2e2',
							borderRadius: '4px',
							margin: '0 20px',
						}}>
						{imageError}
					</div>
				)}
				{isUploadingImage ? (
					<div
						style={{
							position: 'relative',
							zIndex: 10,
							textAlign: 'center',
							color: 'white',
							fontSize: '14px',
						}}>
						Uploading image...
					</div>
				) : null}
				<input
					id='header-photo-upload'
					type='file'
					accept='image/*'
					onChange={handlePhotoUpload}
					style={{ display: 'none' }}
				/>
				<HeaderContent>
					<TitleContainer>
						{isEditingTitle ? (
							<EditableTitleInput
								value={editedTitle}
								onChange={(e) => setEditedTitle(e.target.value)}
								onBlur={handleTitleSave}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleTitleSave();
									if (e.key === 'Escape') setIsEditingTitle(false);
								}}
								autoFocus
							/>
						) : (
							<PropertyTitle>{property.title}</PropertyTitle>
						)}
					</TitleContainer>

					<div style={{ display: 'contents' }} className='desktop-actions'>
						<FavoriteButton
							onClick={() =>
								toggleFavorite({
									id: property.id,
									title: property.title,
									slug: property.slug,
								})
							}
							style={{
								display:
									currentUser && !isTenant(currentUser.role as UserRole)
										? 'block'
										: 'none',
							}}>
							{isFav ? '★ Favorited' : '☆ Add to Favorites'}
						</FavoriteButton>
						{currentUser && isTenant(currentUser.role as UserRole) && (
							<FavoriteButton
								onClick={() => setShowMaintenanceRequestModal(true)}>
								🔧 Request Maintenance
							</FavoriteButton>
						)}
						{currentUser &&
							property &&
							(propertyGroups.some(
								(group) =>
									group.id === property.groupId &&
									group.userId === currentUser.id,
							) ||
								currentPropertyShares.some(
									(share) =>
										share.sharedWithUserId === currentUser.id &&
										share.permission === 'co-owner',
								)) && (
								<FavoriteButton onClick={() => setShowShareModal(true)}>
									👥 Share Property
								</FavoriteButton>
							)}
					</div>
				</HeaderContent>
			</Header>

			{/* Tab Navigation */}
			<TabControlsContainer>
				<Tabs
					property={property}
					currentUser={currentUser}
					propertyMaintenanceRequests={propertyMaintenanceRequests}
					canApproveMaintenanceRequest={canApproveMaintenanceRequest}
					activeTab={activeTab}
					setActiveTab={setActiveTab as (tab: string) => void}
				/>
			</TabControlsContainer>

			{/* Tab Content Container */}
			<TabContentContainer>
				{/* Details Tab */}
				{activeTab === 'details' && (
					<DetailsTab
						isEditMode={isEditMode}
						setIsEditMode={setIsEditMode}
						property={property}
						getPropertyFieldValue={getPropertyFieldValue}
						handlePropertyFieldChange={handlePropertyFieldChange}
						teamMembers={[]}
					/>
				)}

				{/* Devices Tab */}
				{activeTab === 'devices' && <DevicesTab property={property} />}

				{/* Suites Tab */}
				{activeTab === 'suites' &&
					property?.propertyType !== 'Commercial' &&
					property?.hasSuites && <SuitesTab property={property} />}

				{/* Tasks Tab */}
				{activeTab === 'tasks' && (
					<TasksTab
						propertyTasks={propertyTasks}
						selectedTasks={selectedTasks}
						setSelectedTasks={setSelectedTasks}
						handleTaskCheckbox={handleTaskCheckbox}
						handleCreateTask={handleCreateTask}
						handleEditTask={handleEditTask}
						handleAssignTask={handleAssignTask}
						handleCompleteTask={handleCompleteTask}
						handleDeleteTask={handleDeleteTask}
						teamMembers={teamMembers}
						contractors={propertyContractors}
						sharedUsers={currentPropertyShares}
						currentUser={currentUser}
					/>
				)}

				{/* Maintenance History Tab */}
				{activeTab === 'maintenance' && (
					<MaintenanceTab
						property={property}
						maintenanceHistoryRecords={maintenanceHistoryRecords}
						units={propertyUnits}
						teamMembers={teamMembers}
						contractors={propertyContractors}
						familyMembers={familyMembers}
						tasks={allTasks}
						onAddMaintenanceHistory={handleAddMaintenanceHistory}
						onUpdateMaintenanceHistory={handleUpdateMaintenanceHistory}
						onDeleteMaintenanceHistory={handleDeleteMaintenanceHistory}
					/>
				)}

				{/* Tenants Tab */}
				{activeTab === 'tenants' &&
					property?.isRental &&
					!hasCommercialSuites && (
						<TenantsTab
							property={property}
							currentUser={currentUser}
							setShowAddTenantModal={setShowAddTenantModal}
							onEditTenant={handleEditTenant}
							onDeleteTenant={handleDeleteTenant}
							onViewTenantPromo={handleViewTenantPromo}
						/>
					)}
				{/* Units Tab */}
				{activeTab === 'units' && property?.propertyType === 'Multi-Family' && (
					<UnitsTab
						property={property}
						units={propertyUnits}
						handleCreateUnit={handleCreateUnit}
						handleDeleteUnit={handleDeleteUnit}
					/>
				)}

				{/* Maintenance Requests Tab */}
				{activeTab === 'requests' && property?.isRental && (
					<RequestsTab
						propertyMaintenanceRequests={propertyMaintenanceRequests}
						currentUser={currentUser}
						canApproveMaintenanceRequest={canApproveMaintenanceRequest}
						handleConvertRequestToTask={handleConvertRequestToTask}
					/>
				)}

				{/* Contractors Tab */}
				{activeTab === 'contractors' && (
					<ContractorsTab propertyId={property?.id || ''} />
				)}
			</TabContentContainer>

			{/* Add Device Dialog */}
			{showDeviceDialog && (
				<GenericModal
					isOpen={showDeviceDialog}
					onClose={() => setShowDeviceDialog(false)}
					title='Add New Household Device'
					onSubmit={handleDeviceFormSubmit}
					primaryButtonLabel='Add Device'
					secondaryButtonLabel='Cancel'>
					<FormGroup>
						<FormLabel>Device Type *</FormLabel>
						<FormInput
							type='text'
							name='type'
							value={deviceFormData.type}
							onChange={handleDeviceFormChange}
							placeholder='e.g., HVAC System, Water Heater'
							required
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Brand *</FormLabel>
						<FormInput
							type='text'
							name='brand'
							value={deviceFormData.brand}
							onChange={handleDeviceFormChange}
							placeholder='e.g., Carrier, Rheem'
							required
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Model *</FormLabel>
						<FormInput
							type='text'
							name='model'
							value={deviceFormData.model}
							onChange={handleDeviceFormChange}
							placeholder='e.g., AquaEdge, Prestige'
							required
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Installation Date *</FormLabel>
						<FormInput
							type='date'
							name='installationDate'
							value={deviceFormData.installationDate}
							onChange={handleDeviceFormChange}
							required
						/>
					</FormGroup>
				</GenericModal>
			)}

			{/* Task Create/Edit Dialog */}
			<EditTaskModal
				isOpen={showTaskDialog}
				isEditing={Boolean(editingTaskId)}
				formData={taskFormData}
				onClose={() => setShowTaskDialog(false)}
				onSubmit={handleTaskFormSubmit}
				onChange={handleTaskFormChange}
				statusOptions={[
					'Pending',
					'In Progress',
					'Awaiting Approval',
					'Completed',
					'Rejected',
				]}
				priorityOptions={['Low', 'Medium', 'High', 'Urgent']}
				assigneeOptions={assigneeOptions}
				maintenanceHistoryOptions={maintenanceHistoryOptions}
				currentUser={currentUser}
			/>

			{/* Unit Create Dialog */}
			<CreateUnitModal
				isOpen={showUnitDialog}
				formData={unitFormData}
				onClose={() => setShowUnitDialog(false)}
				onSubmit={handleUnitFormSubmit}
				onChange={handleUnitFormChange}
			/>

			{/* Task Assignment Dialog */}
			{showTaskAssignDialog && (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleConfirmAssignment();
					}}>
					<GenericModal
						isOpen={showTaskAssignDialog}
						onClose={() => setShowTaskAssignDialog(false)}
						title='Assign Task to Team Member'
						showActions={true}
						primaryButtonLabel='Assign'
						primaryButtonDisabled={!selectedAssignee}
						secondaryButtonLabel='Cancel'>
						<FormGroup>
							<FormLabel>Assign To</FormLabel>
							<FormSelect
								value={selectedAssignee ? selectedAssignee.id : ''}
								onChange={(e) => {
									const selectedId = e.target.value;
									const filteredTeamMembers = teamMembers.filter(
										(m): m is TeamMember => m !== undefined,
									);

									// Check team members
									let found:
										| TeamMember
										| User
										| {
												id: string;
												firstName: string;
												lastName: string;
												email: string;
										  }
										| null =
										filteredTeamMembers.find((m) => m.id === selectedId) ||
										null;

									// Check current user (property owner)
									if (!found && currentUser && currentUser.id === selectedId) {
										found = currentUser;
									}

									// Check shared users
									if (!found) {
										const sharedUser = currentPropertyShares.find(
											(share) =>
												(share.sharedWithUserId || share.sharedWithEmail) ===
												selectedId,
										);
										if (sharedUser) {
											const fullName =
												sharedUser.sharedWithFirstName &&
												sharedUser.sharedWithLastName
													? `${sharedUser.sharedWithFirstName} ${sharedUser.sharedWithLastName}`
													: sharedUser.sharedWithEmail?.split('@')[0] ||
													  'Shared User';
											const nameParts = fullName.split(' ');
											found = {
												id:
													sharedUser.sharedWithUserId ||
													sharedUser.sharedWithEmail,
												firstName: nameParts[0] || fullName,
												lastName: nameParts.slice(1).join(' ') || '',
												email: sharedUser.sharedWithEmail,
											};
										}
									}

									// Check contractors
									if (!found) {
										const contractor = propertyContractors.find(
											(c) => c.id === selectedId,
										);
										if (contractor) {
											found = {
												id: contractor.id,
												firstName: contractor.name,
												lastName: `(${contractor.category})`,
												email: contractor.email || '',
											};
										}
									}

									if (found) {
										// Safely construct the name property
										let name = '';
										if (
											'firstName' in found &&
											'lastName' in found &&
											found.firstName &&
											found.lastName
										) {
											name = `${found.firstName} ${found.lastName}`;
										} else if ('firstName' in found && found.firstName) {
											name = found.firstName;
										} else if (
											'name' in found &&
											typeof found.name === 'string' &&
											found.name
										) {
											name = found.name;
										} else if ('email' in found && found.email) {
											name = found.email;
										} else {
											name = found.id;
										}
										const assignedTo = {
											id: found.id,
											name,
											email: found.email || '',
										};
										setSelectedAssignee(assignedTo);
									} else {
										setSelectedAssignee(null);
									}
								}}>
								<option value=''>Select a user...</option>
								{/* Shared users */}
								{currentPropertyShares.map((share) => {
									const fullName =
										share.sharedWithFirstName && share.sharedWithLastName
											? `${share.sharedWithFirstName} ${share.sharedWithLastName}`
											: share.sharedWithEmail?.split('@')[0] || 'Shared User';
									return (
										<option
											key={share.sharedWithUserId || share.sharedWithEmail}
											value={share.sharedWithUserId || share.sharedWithEmail}>
											{fullName} (Shared User)
										</option>
									);
								})}
								{/* Team members */}
								{teamMembers
									.filter((m): m is TeamMember => m !== undefined)
									.map((member) => (
										<option key={member.id} value={member.id}>
											{member.firstName} {member.lastName} ({member.title})
										</option>
									))}
								{/* Contractors */}
								{propertyContractors.map((contractor) => (
									<option key={contractor.id} value={contractor.id}>
										{contractor.name} ({contractor.category})
									</option>
								))}
								{/* Family members */}
								{familyMembers.map((member) => (
									<option key={member.id} value={member.id}>
										{member.firstName} {member.lastName} (Family)
									</option>
								))}
							</FormSelect>
						</FormGroup>
					</GenericModal>
				</form>
			)}

			{/* Convert Request to Task Modal */}
			{convertingRequest && (
				<ConvertRequestToTaskModal
					isOpen={showConvertModal}
					onClose={() => {
						setShowConvertModal(false);
						setConvertingRequest(null);
					}}
					onConvert={handleConvertToTask}
					request={convertingRequest}
					teamMembers={teamMembers.filter(
						(m): m is TeamMember => m !== undefined,
					)}
				/>
			)}

			{/* Share Property Modal */}
			{property && (
				<SharePropertyModal
					open={showShareModal}
					onClose={() => setShowShareModal(false)}
					propertyId={property.id}
					propertyTitle={property.title}
					ownerId={currentUser!.id}
					ownerEmail={currentUser!.email}
				/>
			)}

			{/* Add Tenant Modal */}
			{property && (
				<AddTenantModal
					open={showAddTenantModal}
					onClose={() => setShowAddTenantModal(false)}
					propertyId={property.id}
				/>
			)}

			{/* Edit Tenant Modal */}
			{property && editingTenant && (
				<AddTenantModal
					open={showEditTenantModal}
					onClose={() => {
						setShowEditTenantModal(false);
						setEditingTenant(null);
					}}
					propertyId={property.id}
					mode='edit'
					tenant={editingTenant}
				/>
			)}

			{/* Delete Task Confirmation Modal */}
			<DeleteConfirmationModal
				isOpen={deleteTaskModalOpen}
				itemName={taskToDelete?.title || ''}
				itemType='task'
				onConfirm={() => {
					confirmDeleteTask();
					setDeleteTaskModalOpen(false);
					setTaskToDelete(null);
				}}
				onCancel={() => {
					setDeleteTaskModalOpen(false);
					setTaskToDelete(null);
				}}
			/>

			{/* Delete Tenant Confirmation Modal */}
			<DeleteConfirmationModal
				isOpen={showDeleteTenantModal}
				itemName={tenantToDelete?.email || ''}
				itemType='tenant'
				onConfirm={handleConfirmDeleteTenant}
				onCancel={() => {
					setShowDeleteTenantModal(false);
					setTenantToDelete(null);
				}}
			/>

			{/* Task Completion Modal */}
			{showTaskCompletionModal && completingTaskId && (
				<TaskCompletionModal
					taskId={completingTaskId}
					taskTitle={
						allTasks.find((t) => t.id === completingTaskId)?.title || ''
					}
					task={allTasks.find((t) => t.id === completingTaskId)}
					onClose={() => setShowTaskCompletionModal(false)}
					onSuccess={handleTaskCompletionSuccess}
				/>
			)}

			<style>{`
				.desktop-actions {
					display: flex;
					gap: 12px;
				}

				.mobile-action-menu {
					display: none !important;
				}

				@media (max-width: 480px) {
					.desktop-actions {
						display: none !important;
					}

					.mobile-action-menu {
						display: block !important;
					}
				}
			`}</style>
		</Wrapper>
	);
};
