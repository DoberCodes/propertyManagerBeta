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
	padding: 0.5rem 0;
	border-bottom: 1px solid #e5e7eb;

	&:last-child {
		border-bottom: none;
	}
`;

const TaskDetailLabel = styled.span`
	font-weight: 600;
	color: #374151;
	min-width: 100px;
`;

const TaskDetailValue = styled.span`
	color: #6b7280;
`;

const ModalActions = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 1rem;
	flex-wrap: wrap;
`;

const ResponsiveTable = styled(GridTable)`
	.desktop-only {
		@media (max-width: 768px) {
			display: none;
		}
	}

	.mobile-only {
		@media (min-width: 769px) {
			display: none;
		}
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
}) => {
	const [selectedTaskForModal, setSelectedTaskForModal] = useState<any>(null);
	const [filters, setFilters] = useState<FilterValues>({});
	const [processedTasks, setProcessedTasks] = useState<any[]>([]);

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
			key: 'search',
			label: 'Search',
			type: 'text',
			placeholder: 'Search task names, notes...',
		},
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
				<ToolbarButton onClick={handleCreateTask}>+ Create Task</ToolbarButton>
				<ToolbarButton
					disabled={selectedTasks.length === 0}
					onClick={handleCompleteTask}
					style={{ backgroundColor: '#22c55e' }}>
					Mark as Complete
				</ToolbarButton>
			</Toolbar>

			<FilterBar
				filters={taskFilters}
				onFiltersChange={setFilters}
				hideOnMobile={true}
			/>

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
									<td>
										{task.assignedTo && typeof task.assignedTo === 'object'
											? task.assignedTo.name ||
											  task.assignedTo.email ||
											  'Unknown User'
											: task.assignee
											? task.assigneeFirstName && task.assigneeLastName
												? `${task.assigneeFirstName} ${task.assigneeLastName}`
												: task.assigneeEmail || task.assignee
											: 'Unassigned'}
									</td>
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
					showActions={false}>
					<div>
						<TaskDetailRow>
							<TaskDetailLabel>Task Name:</TaskDetailLabel>
							<TaskDetailValue>{selectedTaskForModal.title}</TaskDetailValue>
						</TaskDetailRow>
						<TaskDetailRow>
							<TaskDetailLabel>Assigned To:</TaskDetailLabel>
							<TaskDetailValue>
								{selectedTaskForModal.assignee
									? selectedTaskForModal.assigneeFirstName &&
									  selectedTaskForModal.assigneeLastName
										? `${selectedTaskForModal.assigneeFirstName} ${selectedTaskForModal.assigneeLastName}`
										: selectedTaskForModal.assigneeEmail ||
										  selectedTaskForModal.assignee
									: 'Unassigned'}
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
