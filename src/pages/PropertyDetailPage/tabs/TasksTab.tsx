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
import styled from 'styled-components';

const ViewMoreButton = styled.button`
	background-color: #6b7280;
	color: white;
	border: none;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.8rem;
	font-weight: 500;

	&:hover {
		background-color: #4b5563;
	}
`;

const TaskDetailRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 0.75rem 0;
	border-bottom: 1px solid #e5e7eb;
	flex-direction: column;
	gap: 0.25rem;

	&:last-child {
		border-bottom: none;
	}

	@media (min-width: 1025px) {
		flex-direction: row;
		align-items: center;
		gap: 1rem;
	}
`;

const TaskDetailLabel = styled.span`
	font-weight: 600;
	color: #374151;
	font-size: 14px;

	@media (min-width: 1025px) {
		min-width: 100px;
		font-size: 14px;
	}
`;

const TaskDetailValue = styled.span`
	color: #6b7280;
	font-size: 14px;
	word-break: break-word;

	@media (min-width: 1025px) {
		flex: 1;
		text-align: right;
	}
`;

const ModalActions = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 1.5rem;
	flex-direction: column;

	@media (min-width: 1025px) {
		flex-direction: row;
		flex-wrap: wrap;
	}

	& > * {
		flex: 1;
		min-width: fit-content;

		@media (min-width: 1025px) {
			flex: none;
		}
	}
`;

const ResponsiveTable = styled(GridTable)`
	@media (max-width: 1024px) {
		display: none;
	}

	.desktop-only {
		@media (max-width: 1024px) {
			display: none;
		}
	}

	.mobile-only {
		@media (min-width: 1025px) {
			display: none;
		}
	}
`;

const MobileTaskCard = styled.div<{ isSelected: boolean }>`
	display: none;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	transition: all 0.2s ease;
	cursor: pointer;

	${({ isSelected }) =>
		isSelected &&
		`
		background: #f0fdf4;
		border-color: #22c55e;
		box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15);
	`}

	&:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
	}

	@media (max-width: 1024px) {
		display: block;
	}

	@media (max-width: 480px) {
		padding: 14px;
		margin-bottom: 10px;
	}
`;

const MobileTaskHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 12px;
`;

const MobileTaskTitle = styled.h3`
	font-size: 16px;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	line-height: 1.3;
	flex: 1;
	margin-right: 12px;

	@media (max-width: 480px) {
		font-size: 15px;
	}
`;

const MobileTaskCheckbox = styled.input.attrs({ type: 'checkbox' })`
	width: 20px;
	height: 20px;
	cursor: pointer;
	accent-color: #22c55e;
	flex-shrink: 0;
	margin-top: 2px;
`;

const MobileTaskMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 12px;
`;

const MobileTaskRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const MobileTaskLabel = styled.span`
	font-size: 12px;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`;

const MobileTaskValue = styled.span`
	font-size: 14px;
	color: #374151;
	font-weight: 500;
`;

const MobileTaskActions = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	padding-top: 8px;
	border-top: 1px solid #f3f4f6;
`;

const MobileActionButton = styled.button<{
	variant?: 'primary' | 'secondary' | 'danger';
}>`
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 1px solid transparent;
	min-width: fit-content;

	${({ variant }) => {
		switch (variant) {
			case 'primary':
				return `
					background: #22c55e;
					color: white;
					&:hover {
						background: #16a34a;
					}
				`;
			case 'danger':
				return `
					background: #ef4444;
					color: white;
					&:hover {
						background: #dc2626;
					}
				`;
			default:
				return `
					background: #f3f4f6;
					color: #374151;
					border-color: #d1d5db;
					&:hover {
						background: #e5e7eb;
					}
				`;
		}
	}}

	@media (max-width: 480px) {
		padding: 6px 10px;
		font-size: 12px;
	}
`;

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
					<ResponsiveTable>
						<thead>
							<tr>
								<th style={{ width: '40px' }}>
									<TaskCheckbox
										onChange={() => {
											if (selectedTasks.length === filteredTasks.length) {
												setSelectedTasks([]);
											} else {
												setSelectedTasks(filteredTasks.map((t) => t.id));
											}
										}}
										checked={
											selectedTasks.length === filteredTasks.length &&
											filteredTasks.length > 0
										}
									/>
								</th>
								<th>Task Name</th>
								<th>Assigned To</th>
								<th className='desktop-only'>Due Date</th>
								<th className='desktop-only'>Priority</th>
								<th>Status</th>
								<th className='desktop-only'>Devices</th>
								<th className='desktop-only'>Notes</th>
								<th className='desktop-only' style={{ width: '200px' }}>
									Actions
								</th>
								<th className='mobile-only' style={{ width: '80px' }}>
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredTasks.map((task) => (
								<tr
									key={task.id}
									style={{
										backgroundColor: selectedTasks.includes(task.id)
											? '#f0fdf4'
											: 'transparent',
									}}>
									<td>
										<TaskCheckbox
											checked={selectedTasks.includes(task.id)}
											onChange={() => handleTaskCheckbox(task.id)}
										/>
									</td>
									<td>
										<strong>{task.title}</strong>
									</td>
									<td>{getAssigneeName(task)}</td>
									<td className='desktop-only'>{task.dueDate}</td>
									<td className='desktop-only'>{task.priority || '-'}</td>
									<td>
										<TaskStatus status={task.status}>{task.status}</TaskStatus>
									</td>
									<td className='desktop-only'>
										{getDeviceNames(task.devices, { devices: propertyDevices })}
									</td>
									<td className='desktop-only'>{task.notes || '-'}</td>
									<td className='desktop-only'>
										<div
											style={{
												display: 'flex',
												gap: '0.5rem',
												flexWrap: 'wrap',
											}}>
											<ToolbarButton
												onClick={() => {
													setSelectedTasks([task.id]);
													handleEditTask();
												}}
												style={{
													padding: '0.25rem 0.5rem',
													fontSize: '0.8rem',
												}}>
												Edit
											</ToolbarButton>
											<ToolbarButton
												onClick={() => {
													setSelectedTasks([task.id]);
													handleAssignTask();
												}}
												style={{
													padding: '0.25rem 0.5rem',
													fontSize: '0.8rem',
												}}>
												Assign
											</ToolbarButton>
											<ToolbarButton
												className='delete'
												onClick={() => {
													setSelectedTasks([task.id]);
													handleDeleteTask();
												}}
												style={{
													padding: '0.25rem 0.5rem',
													fontSize: '0.8rem',
												}}>
												Delete
											</ToolbarButton>
										</div>
									</td>
									<td className='mobile-only'>
										<ViewMoreButton onClick={() => handleViewMore(task)}>
											View More
										</ViewMoreButton>
									</td>
								</tr>
							))}
						</tbody>
					</ResponsiveTable>

					{/* Mobile Task Cards */}
					<div className='mobile-only'>
						{filteredTasks.map((task) => (
							<MobileTaskCard
								key={task.id}
								isSelected={selectedTasks.includes(task.id)}
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
