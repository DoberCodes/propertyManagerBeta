import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { GenericModal } from './GenericModal';
import {
	FormGroup,
	FormGrid,
	FormLabel,
	FormInput,
	FormSelect,
	FormTextarea,
	FormGroupFull,
	ModalTabContainer,
	ModalTab,
	ModalTabContent,
} from './ModalStyles';
import { MultiSelect } from '../index';
import { TaskNotification } from '../../../types/Task.types';
import {
	getDefaultTaskNotifications,
	getDefaultNotificationMessage,
} from '../../../utils/taskNotificationUtils';
import {
	useCreateTaskMutation,
	useUpdateTaskMutation,
	useGetTasksQuery,
} from '../../../Redux/API/taskSlice';
import { addTask, updateTask } from '../../../Redux/Slices/propertyDataSlice';

interface TaskFormData {
	title: string;
	dueDate: string;
	status: string;
	priority?: string;
	notes: string;
	assignedTo?: string;
	devices?: string[];
	isRecurring?: boolean;
	recurrenceFrequency?: string;
	recurrenceInterval?: number;
	recurrenceCustomUnit?: string;
	enableNotifications?: boolean;
	notifications?: TaskNotification[];
	linkedMaintenanceHistoryIds?: string[];
}

interface EditTaskModalProps {
	isOpen: boolean;
	isEditing: boolean;
	// optional: when editing inside a page you can pass the task id or the whole task
	editingTaskId?: string | null;
	initialTask?: Partial<TaskFormData> | null;
	propertyId?: string | null;
	onClose: () => void;
	onSaved?: (updatedTask?: any) => void; // called after successful create/update
	statusOptions?: string[];
	priorityOptions?: string[];
	assigneeOptions?: { label: string; value: string }[];
	deviceOptions?: { label: string; value: string }[];
	maintenanceHistoryOptions?: { label: string; value: string }[];
	currentUser?: { id: string; firstName?: string; lastName?: string } | null;
	// new/optional callbacks and placeholders
	taskTitlePlaceholder?: string;
	onDevicesChange?: (devices: string[]) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
	isOpen,
	isEditing,
	editingTaskId = null,
	initialTask = null,
	propertyId = null,
	onClose,
	onSaved,
	statusOptions = [
		'Pending',
		'In Progress',
		'Awaiting Approval',
		'Completed',
		'Rejected',
	],
	priorityOptions = ['Low', 'Medium', 'High', 'Urgent'],
	assigneeOptions = [],
	deviceOptions = [],
	maintenanceHistoryOptions = [],
	currentUser = null,
	taskTitlePlaceholder = 'Task title',
	onDevicesChange,
}) => {
	// modal-owned form state (defaults)
	const defaultForm: TaskFormData = {
		title: '',
		dueDate: '',
		status: 'Pending',
		notes: '',
		devices: [],
		isRecurring: false,
		recurrenceFrequency: undefined,
		recurrenceInterval: undefined,
		recurrenceCustomUnit: undefined,
		enableNotifications: false,
		notifications: [],
		linkedMaintenanceHistoryIds: [],
	};

	const dispatch = useDispatch();
	const { data: allTasks = [] } = useGetTasksQuery();
	const [createTask] = useCreateTaskMutation();
	const [updateTaskApi] = useUpdateTaskMutation();

	const [formState, setFormState] = useState<TaskFormData>(defaultForm);

	// initialize form when modal opens or when editingTaskId/initialTask changes
	useEffect(() => {
		if (!isOpen) return;

		if (editingTaskId) {
			const task = allTasks.find((t: any) => t.id === editingTaskId);
			if (task) {
				setFormState({
					title: task.title || '',
					dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
					status: task.status || 'Pending',
					notes: task.notes || '',
					priority: task.priority,
					assignedTo: task.assignedTo?.id || task.assignee || '',
					devices: task.devices || [],
					isRecurring: task.isRecurring || false,
					recurrenceFrequency: task.recurrenceFrequency,
					recurrenceInterval: task.recurrenceInterval,
					recurrenceCustomUnit: task.recurrenceCustomUnit,
					enableNotifications: (task as any).enableNotifications || false,
					notifications: (task as any).notifications || [],
					linkedMaintenanceHistoryIds:
						(task as any).linkedMaintenanceHistoryIds || [],
				});
				return;
			}
		}

		setFormState(defaultForm);
	}, [isOpen, editingTaskId, initialTask, allTasks]);

	const handleChange = (e: React.ChangeEvent<any>) => {
		const { name, value, type, checked } = e.target as any;
		setFormState((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
	};

	// keep legacy `onChange` variable name for backward-compatible internal usage
	const onChange = handleChange;
	// keep legacy `fd` variable name for backwards-compatibility inside this component
	const fd = formState;

	const [activeTab, setActiveTab] = useState<
		'details' | 'schedule' | 'notifications'
	>('details');
	const [showLinkHistoryModal, setShowLinkHistoryModal] = useState(false);
	const [pendingLinkedHistoryIds, setPendingLinkedHistoryIds] = useState<
		string[]
	>(fd.linkedMaintenanceHistoryIds || []);
	const wantsRecurrence = Boolean(
		formState.recurrenceFrequency ||
			formState.recurrenceInterval ||
			formState.recurrenceCustomUnit,
	);
	const hasSchedule = Boolean(
		formState.recurrenceFrequency &&
			(formState.recurrenceFrequency === 'custom'
				? formState.recurrenceInterval && formState.recurrenceCustomUnit
				: true), // For non-custom frequencies, just need the frequency
	);

	useEffect(() => {
		if (hasSchedule && !formState.isRecurring) {
			setFormState((prev) => ({ ...prev, isRecurring: true }));
		}

		if (!hasSchedule && formState.isRecurring) {
			setFormState((prev) => ({ ...prev, isRecurring: false }));
		}
	}, [hasSchedule, formState.isRecurring]);

	useEffect(() => {
		if (!showLinkHistoryModal) return;
		setPendingLinkedHistoryIds(formState.linkedMaintenanceHistoryIds || []);
	}, [showLinkHistoryModal, formState.linkedMaintenanceHistoryIds]);

	const handleToggleHistory = (historyId: string) => {
		setPendingLinkedHistoryIds((prev) =>
			prev.includes(historyId)
				? prev.filter((id) => id !== historyId)
				: [...prev, historyId],
		);
	};

	const handleSaveLinkedHistory = (e: React.FormEvent) => {
		e.preventDefault();
		onChange({
			target: {
				name: 'linkedMaintenanceHistoryIds',
				value: pendingLinkedHistoryIds,
				type: 'custom',
			},
		} as any);
		setShowLinkHistoryModal(false);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formState.title || !formState.dueDate) {
			alert('Please fill in all required fields');
			return;
		}

		try {
			if (isEditing && editingTaskId) {
				const updatesRaw: any = { ...formState };
				const updates = Object.fromEntries(
					Object.entries(updatesRaw).filter(([, value]) => value !== undefined),
				);

				const updated = await updateTaskApi({
					id: editingTaskId,
					updates,
				}).unwrap();
				dispatch(updateTask(updated));
				onSaved?.(updated);
				onClose();
			} else {
				const newTask: any = {
					id: `task-${Date.now()}`,
					propertyId: propertyId || undefined,
					...formState,
					userId: '',
					property: '',
				};

				const created = await createTask(newTask).unwrap();
				dispatch(addTask(created));
				onSaved?.(created);
				onClose();
			}
		} catch (error) {
			console.error('Error saving task:', error);
			alert('Failed to save task. Please try again.');
		}
	};

	return (
		<>
			<GenericModal
				isOpen={isOpen}
				title={isEditing ? 'Edit Task' : 'Create New Task'}
				onClose={onClose}
				onSubmit={handleSubmit}
				showActions={true}
				primaryButtonLabel={isEditing ? 'Update Task' : 'Create Task'}
				secondaryButtonLabel='Cancel'>
				<ModalTabContainer>
					<ModalTab
						type='button'
						active={activeTab === 'details'}
						onClick={() => setActiveTab('details')}>
						Task Details
					</ModalTab>
					<ModalTab
						type='button'
						active={activeTab === 'schedule'}
						onClick={() => setActiveTab('schedule')}>
						📅 Recurrence Schedule
					</ModalTab>
					<ModalTab
						type='button'
						active={activeTab === 'notifications'}
						onClick={() => setActiveTab('notifications')}>
						🔔 Notifications
					</ModalTab>
				</ModalTabContainer>

				<ModalTabContent active={activeTab === 'details'}>
					<FormGrid>
						<FormGroup>
							<FormLabel>Task Name *</FormLabel>
							<FormInput
								type='text'
								name='title'
								value={formState.title}
								onChange={handleChange}
								placeholder={taskTitlePlaceholder}
								required
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Due Date *</FormLabel>
							<FormInput
								type='date'
								name='dueDate'
								value={formState.dueDate}
								onChange={onChange}
								required
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Status *</FormLabel>
							<FormSelect
								name='status'
								value={formState.status}
								onChange={handleChange}>
								<option value=''>Select a status...</option>
								{statusOptions.map((status) => (
									<option key={status} value={status}>
										{status}
									</option>
								))}
							</FormSelect>
						</FormGroup>

						<FormGroup>
							<FormLabel>Priority *</FormLabel>
							<FormSelect
								name='priority'
								value={formState.priority}
								onChange={onChange}>
								<option value=''>Select a priority...</option>
								{priorityOptions.map((priority) => (
									<option key={priority} value={priority}>
										{priority}
									</option>
								))}
							</FormSelect>
						</FormGroup>

						{assigneeOptions.length > 0 && (
							<FormGroup>
								<FormLabel>Assigned To</FormLabel>
								<FormSelect
									name='assignedTo'
									value={formState.assignedTo || ''}
									onChange={onChange}>
									<option value=''>Unassigned</option>
									{currentUser && formState.assignedTo === currentUser.id && (
										<option value=''>Unassign me</option>
									)}
									{assigneeOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</FormSelect>
							</FormGroup>
						)}

						{deviceOptions.length > 0 && (
							<FormGroup>
								<FormLabel>Connected Devices</FormLabel>
								<MultiSelect
									options={deviceOptions}
									value={formState.devices || []}
									onChange={(devices: string[]) => {
										setFormState((prev) => ({ ...prev, devices }));
										onDevicesChange?.(devices);
									}}
									placeholder='Select devices for this task...'
								/>
							</FormGroup>
						)}

						{maintenanceHistoryOptions.length > 0 && (
							<FormGroup>
								<FormLabel>Maintenance History</FormLabel>
								<div
									style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<button
										type='button'
										onClick={() => setShowLinkHistoryModal(true)}
										style={{
											padding: '8px 12px',
											background: '#3b82f6',
											color: 'white',
											border: 'none',
											borderRadius: '4px',
											cursor: 'pointer',
											fontSize: '14px',
										}}>
										🔗 Link Maintenance History (
										{formState.linkedMaintenanceHistoryIds?.length || 0})
									</button>
									{(formState.linkedMaintenanceHistoryIds?.length || 0) > 0 && (
										<span style={{ fontSize: '12px', color: '#6b7280' }}>
											{fd.linkedMaintenanceHistoryIds?.length} linked
										</span>
									)}
								</div>
							</FormGroup>
						)}

						<FormGroupFull>
							<FormLabel>Notes</FormLabel>
							<FormTextarea
								name='notes'
								value={formState.notes}
								onChange={onChange}
								placeholder='Add any notes about this task...'
							/>
						</FormGroupFull>
					</FormGrid>
				</ModalTabContent>

				<ModalTabContent active={activeTab === 'schedule'}>
					<FormGrid>
						<FormGroup>
							<FormLabel>Recurrence Frequency *</FormLabel>
							<FormSelect
								name='recurrenceFrequency'
								value={formState.recurrenceFrequency || ''}
								onChange={onChange}
								required={wantsRecurrence}>
								<option value=''>Select frequency...</option>
								<option value='daily'>Daily</option>
								<option value='weekly'>Weekly</option>
								<option value='biweekly'>Every 2 Weeks</option>
								<option value='monthly'>Monthly</option>
								<option value='quarterly'>Every 3 Months</option>
								<option value='yearly'>Yearly</option>
								<option value='custom'>Custom</option>
							</FormSelect>
						</FormGroup>

						{formState.recurrenceFrequency === 'custom' && (
							<FormGroup>
								<FormLabel>Interval *</FormLabel>
								<FormInput
									type='number'
									name='recurrenceInterval'
									value={formState.recurrenceInterval || 1}
									onChange={onChange}
									min='1'
									max='365'
									required={
										fd.recurrenceFrequency === 'custom' && wantsRecurrence
									}
									placeholder='e.g., 3 for every 3 days'
								/>
							</FormGroup>
						)}

						{fd.recurrenceFrequency === 'custom' && (
							<FormGroup>
								<FormLabel>Time Unit *</FormLabel>
								<FormSelect
									name='recurrenceCustomUnit'
									value={formState.recurrenceCustomUnit || ''}
									onChange={onChange}
									required={
										fd.recurrenceFrequency === 'custom' && wantsRecurrence
									}>
									<option value=''>Select unit...</option>
									<option value='days'>Days</option>
									<option value='weeks'>Weeks</option>
									<option value='months'>Months</option>
									<option value='years'>Years</option>
								</FormSelect>
							</FormGroup>
						)}

						<FormGroupFull>
							<small style={{ color: '#6b7280' }}>
								📋 This task will automatically create a new copy with an
								updated due date each time it is marked as completed.
							</small>
						</FormGroupFull>
					</FormGrid>
				</ModalTabContent>

				<ModalTabContent active={activeTab === 'notifications'}>
					<FormGrid>
						<FormGroupFull>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<input
									type='checkbox'
									id='enableNotifications'
									name='enableNotifications'
									checked={fd.enableNotifications || false}
									onChange={(e) => {
										const isChecked = e.target.checked;
										onChange({
											target: {
												name: 'enableNotifications',
												value: isChecked,
												checked: isChecked,
												type: 'checkbox',
											},
										} as any);

										// If enabling notifications and no notifications exist, set defaults
										if (
											isChecked &&
											(!fd.notifications || fd.notifications.length === 0)
										) {
											const defaultNotifications =
												getDefaultTaskNotifications();
											onChange({
												target: {
													name: 'notifications',
													value: defaultNotifications,
													type: 'custom',
												},
											} as any);
										}
									}}
								/>
								<FormLabel htmlFor='enableNotifications' style={{ margin: 0 }}>
									Enable task notifications
								</FormLabel>
							</div>
							<small style={{ color: '#6b7280', marginTop: '4px' }}>
								Get reminded about upcoming and overdue tasks
							</small>
						</FormGroupFull>

						{fd.enableNotifications && (
							<>
								<FormGroupFull>
									<FormLabel>Notification Schedule</FormLabel>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '12px',
										}}>
										{(fd.notifications || []).map((notification, index) => (
											<div
												key={notification.id}
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '12px',
													padding: '12px',
													border: '1px solid #e5e7eb',
													borderRadius: '6px',
													backgroundColor: '#f9fafb',
												}}>
												<input
													type='checkbox'
													id={`notification-${index}`}
													checked={notification.enabled}
													onChange={(e) => {
														const updatedNotifications = [
															...(fd.notifications || []),
														];
														updatedNotifications[index] = {
															...updatedNotifications[index],
															enabled: e.target.checked,
														};
														onChange({
															target: {
																name: 'notifications',
																value: updatedNotifications,
																type: 'custom',
															},
														} as any);
													}}
												/>
												<div style={{ flex: 1 }}>
													<div style={{ fontWeight: '500', color: '#374151' }}>
														{notification.type === 'reminder'
															? notification.daysBeforeDue === 1
																? '1 day before due'
																: `${notification.daysBeforeDue} days before due`
															: `Week ${
																	Math.abs(notification.daysBeforeDue || 0) / 7
															  } overdue`}
													</div>
													<div style={{ fontSize: '14px', color: '#6b7280' }}>
														{getDefaultNotificationMessage(
															notification,
															fd.title || 'Task',
														)}
													</div>
												</div>
											</div>
										))}
									</div>
								</FormGroupFull>

								<FormGroupFull>
									<small style={{ color: '#6b7280' }}>
										💡 Default schedule: 30 days, 7 days, and 1 day before due
										date, plus weekly reminders for 4 weeks when overdue. You
										can customize these settings after creating the task.
									</small>
								</FormGroupFull>
							</>
						)}
					</FormGrid>
				</ModalTabContent>
			</GenericModal>

			{showLinkHistoryModal && (
				<GenericModal
					isOpen={showLinkHistoryModal}
					title='Link Maintenance History'
					onClose={() => setShowLinkHistoryModal(false)}
					onSubmit={handleSaveLinkedHistory}
					showActions={true}
					primaryButtonLabel='Link History'
					secondaryButtonLabel='Cancel'>
					<div style={{ maxHeight: '300px', overflowY: 'auto' }}>
						{maintenanceHistoryOptions.length > 0 ? (
							maintenanceHistoryOptions.map((option) => (
								<label
									key={option.value}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '6px 0',
									}}>
									<input
										type='checkbox'
										checked={pendingLinkedHistoryIds.includes(option.value)}
										onChange={() => handleToggleHistory(option.value)}
									/>
									<span>{option.label}</span>
								</label>
							))
						) : (
							<p style={{ margin: 0, color: '#6b7280' }}>
								No maintenance history available for this task.
							</p>
						)}
					</div>
				</GenericModal>
			)}
		</>
	);
};

export default EditTaskModal;
