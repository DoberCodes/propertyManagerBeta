import React, { useState, useEffect } from 'react';
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
	formData: TaskFormData;
	onClose: () => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onChange: (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => void;
	statusOptions?: string[];
	priorityOptions?: string[];
	assigneeOptions?: { label: string; value: string }[];
	deviceOptions?: { label: string; value: string }[];
	maintenanceHistoryOptions?: { label: string; value: string }[];
	onDevicesChange?: (devices: string[]) => void;
	taskTitlePlaceholder?: string;
	currentUser?: { id: string; firstName?: string; lastName?: string } | null;
}

/**
 * Reusable Edit Task Modal Component
 * Handles both creating new tasks and editing existing ones
 * Features tabbed interface for recurring task scheduling
 *
 * @example
 * <EditTaskModal
 *   isOpen={showTaskDialog}
 *   isEditing={Boolean(editingTaskId)}
 *   formData={taskFormData}
 *   onClose={() => setShowTaskDialog(false)}
 *   onSubmit={handleTaskFormSubmit}
 *   onChange={handleTaskFormChange}
 *   statusOptions={['Pending', 'In Progress', 'Completed']}
 * />
 */
export const EditTaskModal: React.FC<EditTaskModalProps> = ({
	isOpen,
	isEditing,
	formData,
	onClose,
	onSubmit,
	onChange,
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
	onDevicesChange,
	taskTitlePlaceholder = 'Enter task name',
	currentUser = null,
}) => {
	const [activeTab, setActiveTab] = useState<
		'details' | 'schedule' | 'notifications'
	>('details');
	const [showLinkHistoryModal, setShowLinkHistoryModal] = useState(false);
	const [pendingLinkedHistoryIds, setPendingLinkedHistoryIds] = useState<
		string[]
	>(formData.linkedMaintenanceHistoryIds || []);
	const wantsRecurrence = Boolean(
		formData.recurrenceFrequency ||
			formData.recurrenceInterval ||
			formData.recurrenceCustomUnit,
	);
	const hasSchedule = Boolean(
		formData.recurrenceFrequency &&
			(formData.recurrenceFrequency === 'custom'
				? formData.recurrenceInterval && formData.recurrenceCustomUnit
				: true), // For non-custom frequencies, just need the frequency
	);

	useEffect(() => {
		if (hasSchedule && !formData.isRecurring) {
			onChange({
				target: {
					name: 'isRecurring',
					value: 'true',
					checked: true,
					type: 'checkbox',
				},
			} as React.ChangeEvent<HTMLInputElement>);
		}

		if (!hasSchedule && formData.isRecurring) {
			onChange({
				target: {
					name: 'isRecurring',
					value: 'false',
					checked: false,
					type: 'checkbox',
				},
			} as React.ChangeEvent<HTMLInputElement>);
		}
	}, [hasSchedule, formData.isRecurring, onChange]);

	useEffect(() => {
		if (!showLinkHistoryModal) return;
		setPendingLinkedHistoryIds(formData.linkedMaintenanceHistoryIds || []);
	}, [showLinkHistoryModal, formData.linkedMaintenanceHistoryIds]);

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

	return (
		<>
			<GenericModal
				isOpen={isOpen}
				title={isEditing ? 'Edit Task' : 'Create New Task'}
				onClose={onClose}
				onSubmit={onSubmit}
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
								value={formData.title}
								onChange={onChange}
								placeholder={taskTitlePlaceholder}
								required
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Due Date *</FormLabel>
							<FormInput
								type='date'
								name='dueDate'
								value={formData.dueDate}
								onChange={onChange}
								required
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Status *</FormLabel>
							<FormSelect
								name='status'
								value={formData.status}
								onChange={onChange}>
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
								value={formData.priority}
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
									value={formData.assignedTo || ''}
									onChange={onChange}>
									<option value=''>Unassigned</option>
									{currentUser && formData.assignedTo === currentUser.id && (
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
									value={formData.devices || []}
									onChange={onDevicesChange || (() => {})}
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
										{formData.linkedMaintenanceHistoryIds?.length || 0})
									</button>
									{(formData.linkedMaintenanceHistoryIds?.length || 0) > 0 && (
										<span style={{ fontSize: '12px', color: '#6b7280' }}>
											{formData.linkedMaintenanceHistoryIds?.length} linked
										</span>
									)}
								</div>
							</FormGroup>
						)}

						<FormGroupFull>
							<FormLabel>Notes</FormLabel>
							<FormTextarea
								name='notes'
								value={formData.notes}
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
								value={formData.recurrenceFrequency || ''}
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

						{formData.recurrenceFrequency === 'custom' && (
							<FormGroup>
								<FormLabel>Interval *</FormLabel>
								<FormInput
									type='number'
									name='recurrenceInterval'
									value={formData.recurrenceInterval || 1}
									onChange={onChange}
									min='1'
									max='365'
									required={
										formData.recurrenceFrequency === 'custom' && wantsRecurrence
									}
									placeholder='e.g., 3 for every 3 days'
								/>
							</FormGroup>
						)}

						{formData.recurrenceFrequency === 'custom' && (
							<FormGroup>
								<FormLabel>Time Unit *</FormLabel>
								<FormSelect
									name='recurrenceCustomUnit'
									value={formData.recurrenceCustomUnit || ''}
									onChange={onChange}
									required={
										formData.recurrenceFrequency === 'custom' && wantsRecurrence
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
									checked={formData.enableNotifications || false}
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
											(!formData.notifications ||
												formData.notifications.length === 0)
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

						{formData.enableNotifications && (
							<>
								<FormGroupFull>
									<FormLabel>Notification Schedule</FormLabel>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '12px',
										}}>
										{(formData.notifications || []).map(
											(notification, index) => (
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
																...(formData.notifications || []),
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
														<div
															style={{ fontWeight: '500', color: '#374151' }}>
															{notification.type === 'reminder'
																? notification.daysBeforeDue === 1
																	? '1 day before due'
																	: `${notification.daysBeforeDue} days before due`
																: `Week ${
																		Math.abs(notification.daysBeforeDue || 0) /
																		7
																  } overdue`}
														</div>
														<div style={{ fontSize: '14px', color: '#6b7280' }}>
															{getDefaultNotificationMessage(
																notification,
																formData.title || 'Task',
															)}
														</div>
													</div>
												</div>
											),
										)}
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
