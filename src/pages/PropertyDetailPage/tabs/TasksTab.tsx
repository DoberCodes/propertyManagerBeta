import React, { useState, useEffect, useMemo } from 'react';
import { TasksTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	Toolbar,
	ToolbarButton,
	GridContainer,
	GridTable,
	TaskCheckbox,
	TaskStatus,
	EmptyState,
} from '../PropertyDetailPage.styles';
import { GenericModal } from '../../../Components/Library/Modal/GenericModal';
import { getDeviceNames } from '../../../utils/detailPageUtils';
import {
	FilterBar,
	FilterConfig,
	FilterValues,
} from '../../../Components/Library/FilterBar';
import { applyFilters } from '../../../utils/tableFilters';
import { updateOverdueTasks } from '../../../utils/taskUtils';
import { isTrialExpired } from '../../../utils/subscriptionUtils';
import { ReusableTable } from '../../../Components/Library';
import { Column } from '../../../Components/Library/ReusableTable';
import {
	MobileTaskCard,
	MobileTaskHeader,
	MobileTaskTitle,
	MobileTaskCheckbox,
	MobileTaskMeta,
	MobileTaskRow,
	MobileTaskLabel,
	MobileTaskValue,
	MobileTaskActions,
	MobileActionButton,
	TaskDetailRow,
	TaskDetailLabel,
	TaskDetailValue,
	ModalActions,
} from './index.styles';

export const TasksTab: React.FC<TasksTabProps> = ({
	propertyTasks,
	selectedTasks,
	setSelectedTasks,
	handleTaskCheckbox,
	handleCreateTask,
	handleEditTask,
	handleAssignTask,
	handleCompleteTask,
	handleDeleteTask,
	propertyDevices = [],
	teamMembers = [],
	contractors = [],
	sharedUsers = [],
	currentUser,
}) => {
	const [selectedTaskForModal, setSelectedTaskForModal] = useState<any>(null);
	const [filters, setFilters] = useState<FilterValues>({});
	const [showFilters, setShowFilters] = useState(false);
	const [processedTasks, setProcessedTasks] = useState<any[]>([]);

	const columns: Column[] = [
		{ header: 'Title', accessor: 'title' },
		{ header: 'Status', accessor: 'status' },
		{ header: 'Priority', accessor: 'priority' },
		{ header: 'Assigned To', accessor: 'assignedTo' },
		{ header: 'Due Date', accessor: 'dueDate' },
	];

	// Utility function to resolve assignee name from task data
	const getAssigneeName = (task: any): string => {
		// Case 1: assignedTo is an object (new format)
		if (task.assignedTo && typeof task.assignedTo === 'object') {
			return task.assignedTo.name || task.assignedTo.email || 'Unknown User';
		}

		// Case 2: assignee is a string ID that needs resolution
		if (task.assignee) {
			// Check if assignee is the current user
			if (currentUser && currentUser.id === task.assignee) {
				return `${currentUser.firstName} ${currentUser.lastName}`.trim();
			}

			// Check team members
			const teamMember = teamMembers.find(
				(member) => member.id === task.assignee,
			);
			if (teamMember) {
				return `${teamMember.firstName} ${teamMember.lastName}`.trim();
			}

			// Check contractors
			const contractor = contractors.find(
				(contractor) => contractor.id === task.assignee,
			);
			if (contractor) {
				return `${contractor.name} (${contractor.category})`;
			}

			// Check shared users
			const sharedUser = sharedUsers.find(
				(user) =>
					(user.sharedWithUserId || user.sharedWithEmail) === task.assignee,
			);
			if (sharedUser) {
				const fullName =
					sharedUser.sharedWithFirstName && sharedUser.sharedWithLastName
						? `${sharedUser.sharedWithFirstName} ${sharedUser.sharedWithLastName}`
						: sharedUser.sharedWithEmail?.split('@')[0] || 'Shared User';
				return fullName;
			}

			// Fallback: use assigneeFirstName/assigneeLastName if available
			if (task.assigneeFirstName && task.assigneeLastName) {
				return `${task.assigneeFirstName} ${task.assigneeLastName}`.trim();
			}

			// Last resort: return the assignee ID or email
			return task.assigneeEmail || task.assignee || 'Unknown User';
		}

		// Case 3: No assignee
		return 'Unassigned';
	};

	// Process tasks to mark overdue ones
	useEffect(() => {
		const processTasks = async () => {
			const updatedTasks = await updateOverdueTasks(propertyTasks);
			setProcessedTasks(updatedTasks);
		};

		processTasks();
	}, [propertyTasks]);

	const handleViewMore = (task: any) => {
		setSelectedTaskForModal(task);
	};

	const handleCloseModal = () => {
		setSelectedTaskForModal(null);
	};

	// Filter configuration for tasks
	const taskFilters: FilterConfig[] = [
		{
			key: 'status',
			label: 'Status',
			type: 'select',
			options: [
				{ value: 'Pending', label: 'Pending' },
				{ value: 'In Progress', label: 'In Progress' },
				{ value: 'Awaiting Approval', label: 'Awaiting Approval' },
				{ value: 'Completed', label: 'Completed' },
				{ value: 'Rejected', label: 'Rejected' },
				{ value: 'Overdue', label: 'Overdue' },
				{ value: 'Hold', label: 'Hold' },
			],
		},
		{
			key: 'priority',
			label: 'Priority',
			type: 'select',
			options: [
				{ value: 'Low', label: 'Low' },
				{ value: 'Medium', label: 'Medium' },
				{ value: 'High', label: 'High' },
				{ value: 'Urgent', label: 'Urgent' },
			],
		},
		{
			key: 'assignedTo',
			label: 'Assigned To',
			type: 'select',
			options: [
				{ value: 'unassigned', label: 'Unassigned' },
				// Dynamically populate with users from existing tasks
				...Array.from(
					processedTasks
						.filter((task) => task.assignedTo || task.assignee)
						.reduce((uniqueUsers, task) => {
							let userId: string;
							let userName: string;

							if (task.assignedTo && typeof task.assignedTo === 'object') {
								userId = task.assignedTo.id;
								userName =
									task.assignedTo.name ||
									task.assignedTo.email ||
									'Unknown User';
							} else if (task.assignee) {
								userId = task.assignee;
								userName =
									task.assigneeFirstName && task.assigneeLastName
										? `${task.assigneeFirstName} ${task.assigneeLastName}`
										: task.assigneeEmail || task.assignee || 'Unknown User';
							} else {
								return uniqueUsers; // Skip if no assignee info
							}

							// Only add if we haven't seen this user name before
							if (!uniqueUsers.has(userName)) {
								uniqueUsers.set(userName, {
									id: userId,
									name: userName,
								});
							}

							return uniqueUsers;
						}, new Map<string, { id: string; name: string }>())
						.values(),
				).map((user) => ({
					value: (user as { id: string; name: string }).id,
					label: (user as { id: string; name: string }).name,
				})),
			],
		},
		{
			key: 'dueDate',
			label: 'Due Date',
			type: 'daterange',
		},
	];

	// Apply filters to tasks
	const filteredTasks = useMemo(() => {
		const filtered = applyFilters(processedTasks, filters, {
			textFields: ['title', 'notes'],
			selectFields: [
				{ field: 'status', filterKey: 'status' },
				{ field: 'priority', filterKey: 'priority' },
				{
					field: 'assignedTo',
					filterKey: 'assignedTo',
					valueGetter: (task) =>
						task.assignedTo && typeof task.assignedTo === 'object'
							? task.assignedTo.id
							: task.assignee,
				},
			],
			dateRangeFields: [{ field: 'dueDate', filterKey: 'dueDate' }],
		});

		// Sort by due date, closest to today first (earliest dates first)
		return filtered.sort((a, b) => {
			const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
			const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
			return dateA - dateB;
		});
	}, [processedTasks, filters]);

	return (
		<SectionContainer>
			<SectionHeader>Associated Tasks</SectionHeader>
			<Toolbar>
				<ToolbarButton
					onClick={handleCreateTask}
					disabled={
						currentUser?.subscription &&
						isTrialExpired(currentUser.subscription)
					}
					title={
						currentUser?.subscription &&
						isTrialExpired(currentUser.subscription)
							? 'Upgrade your subscription to add new tasks'
							: undefined
					}>
					+ Create Task
				</ToolbarButton>
				<ToolbarButton
					disabled={selectedTasks.length === 0}
					onClick={handleCompleteTask}
					style={{ backgroundColor: '#22c55e' }}>
					Mark as Complete
				</ToolbarButton>
			</Toolbar>

			{/* Collapsable Filter Section */}
			<div style={{ marginBottom: '16px' }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						marginBottom: showFilters ? '12px' : '0',
					}}>
					<input
						type='text'
						placeholder='Search tasks...'
						value={(filters.search as string) || ''}
						onChange={(e) =>
							setFilters((prev) => ({
								...prev,
								search: e.target.value,
							}))
						}
						style={{
							flex: 1,
							padding: '8px 12px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							fontSize: '14px',
						}}
					/>
					<button
						onClick={() => setShowFilters(!showFilters)}
						style={{
							padding: '8px 10px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							background: '#f9fafb',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							whiteSpace: 'nowrap',
						}}
						title={showFilters ? 'Hide filters' : 'Show filters'}>
						{showFilters ? '▲ Hide Filters' : '▼ Filters'}
					</button>
				</div>
				{showFilters && (
					<FilterBar filters={taskFilters} onFiltersChange={setFilters} />
				)}
			</div>

			{filteredTasks.length > 0 ? (
				<GridContainer>
					<ReusableTable columns={columns} rowData={filteredTasks} />

					{/* Mobile Task Cards */}
					<div className='mobile-only'>
						{filteredTasks.map((task) => (
							<MobileTaskCard
								key={task.id}
								$isSelected={selectedTasks.includes(task.id)}
								onClick={() => handleTaskCheckbox(task.id)}>
								<MobileTaskHeader>
									<MobileTaskTitle>{task.title}</MobileTaskTitle>
									<MobileTaskCheckbox
										checked={selectedTasks.includes(task.id)}
										onChange={(e) => {
											e.stopPropagation();
											handleTaskCheckbox(task.id);
										}}
									/>
								</MobileTaskHeader>

								<MobileTaskMeta>
									<MobileTaskRow>
										<MobileTaskLabel>Status</MobileTaskLabel>
										<TaskStatus status={task.status}>{task.status}</TaskStatus>
									</MobileTaskRow>

									<MobileTaskRow>
										<MobileTaskLabel>Assigned To</MobileTaskLabel>
										<MobileTaskValue>{getAssigneeName(task)}</MobileTaskValue>
									</MobileTaskRow>

									{task.dueDate && (
										<MobileTaskRow>
											<MobileTaskLabel>Due Date</MobileTaskLabel>
											<MobileTaskValue>{task.dueDate}</MobileTaskValue>
										</MobileTaskRow>
									)}

									{task.priority && (
										<MobileTaskRow>
											<MobileTaskLabel>Priority</MobileTaskLabel>
											<MobileTaskValue>{task.priority}</MobileTaskValue>
										</MobileTaskRow>
									)}
								</MobileTaskMeta>

								<MobileTaskActions>
									<MobileActionButton
										onClick={(e) => {
											e.stopPropagation();
											setSelectedTasks([task.id]);
											handleEditTask();
										}}>
										Edit
									</MobileActionButton>
									<MobileActionButton
										onClick={(e) => {
											e.stopPropagation();
											setSelectedTasks([task.id]);
											handleAssignTask();
										}}>
										Assign
									</MobileActionButton>
									<MobileActionButton
										variant='danger'
										onClick={(e) => {
											e.stopPropagation();
											setSelectedTasks([task.id]);
											handleDeleteTask();
										}}>
										Delete
									</MobileActionButton>
								</MobileTaskActions>
							</MobileTaskCard>
						))}
					</div>
				</GridContainer>
			) : (
				<EmptyState>
					<p>No tasks associated with this property</p>
				</EmptyState>
			)}

			{selectedTaskForModal && (
				<GenericModal
					isOpen={!!selectedTaskForModal}
					title='Task Details'
					onClose={handleCloseModal}
					showActions={true}>
					<div>
						<TaskDetailRow>
							<TaskDetailLabel>Task Name:</TaskDetailLabel>
							<TaskDetailValue>{selectedTaskForModal.title}</TaskDetailValue>
						</TaskDetailRow>
						<TaskDetailRow>
							<TaskDetailLabel>Assigned To:</TaskDetailLabel>
							<TaskDetailValue>
								{getAssigneeName(selectedTaskForModal)}
							</TaskDetailValue>
						</TaskDetailRow>
						<TaskDetailRow>
							<TaskDetailLabel>Due Date:</TaskDetailLabel>
							<TaskDetailValue>{selectedTaskForModal.dueDate}</TaskDetailValue>
						</TaskDetailRow>
						<TaskDetailRow>
							<TaskDetailLabel>Priority:</TaskDetailLabel>
							<TaskDetailValue>
								{selectedTaskForModal.priority || '-'}
							</TaskDetailValue>
						</TaskDetailRow>
						<TaskDetailRow>
							<TaskDetailLabel>Status:</TaskDetailLabel>
							<TaskDetailValue>
								<TaskStatus status={selectedTaskForModal.status}>
									{selectedTaskForModal.status}
								</TaskStatus>
							</TaskDetailValue>
						</TaskDetailRow>
						<TaskDetailRow>
							<TaskDetailLabel>Devices:</TaskDetailLabel>
							<TaskDetailValue>
								{getDeviceNames(selectedTaskForModal.devices, {
									devices: propertyDevices,
								})}
							</TaskDetailValue>
						</TaskDetailRow>
						<TaskDetailRow>
							<TaskDetailLabel>Notes:</TaskDetailLabel>
							<TaskDetailValue>
								{selectedTaskForModal.notes || '-'}
							</TaskDetailValue>
						</TaskDetailRow>

						<ModalActions>
							<ToolbarButton
								onClick={() => {
									handleEditTask();
									handleCloseModal();
								}}
								disabled={
									selectedTasks.length !== 1 ||
									selectedTasks[0] !== selectedTaskForModal.id
								}>
								Edit Task
							</ToolbarButton>
							<ToolbarButton
								onClick={() => {
									handleAssignTask();
									handleCloseModal();
								}}
								disabled={
									selectedTasks.length !== 1 ||
									selectedTasks[0] !== selectedTaskForModal.id
								}>
								Assign To
							</ToolbarButton>
							<ToolbarButton
								className='delete'
								onClick={() => {
									handleDeleteTask();
									handleCloseModal();
								}}
								disabled={
									selectedTasks.length === 0 ||
									!selectedTasks.includes(selectedTaskForModal.id)
								}>
								Delete Task
							</ToolbarButton>
						</ModalActions>
					</div>
				</GenericModal>
			)}
		</SectionContainer>
	);
};
