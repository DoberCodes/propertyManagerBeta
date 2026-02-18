import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import { ZeroState } from '../../Components/Library/ZeroState';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import {
	useGetSharedPropertiesForUserQuery,
	useGetAllPropertySharesForUserQuery,
} from '../../Redux/API/userSlice';
import { filterTasksByRole } from '../../utils/dataFilters';
import { TaskCompletionModal } from '../../Components/TaskCompletionModal';
import { ReusableTable } from '../../Components/Library/ReusableTable';
import { useTaskHandlers } from '../PropertyDetailPage/useTaskHandlers';
import { faEdit, faTrash, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Column, Action } from '../../Components/Library/ReusableTable';
import { StatusBadge } from '../PropertyDetailPage/TabSystem/index.styles';
import { TaskModal } from '../../Components/Library';
import { TaskAssignModal } from '../../Components/Library/Modal/TaskAssignModal';
import {
	useGetTasksQuery,
	useUpdateTaskMutation,
} from '../../Redux/API/taskSlice';
import { Wrapper, TaskGridSection, FilterSection } from './TasksPage.styles';

export const TasksPage = () => {
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const teamMembers = useSelector((state: RootState) =>
		state.team.groups
			.flatMap((group) => group.members || [])
			.filter((member): member is typeof member => member !== undefined),
	);

	// Fetch tasks and properties from Firebase
	const { data: allTasks = [] } = useGetTasksQuery();
	const { data: ownedProperties = [] } = useGetPropertiesQuery();
	const { data: sharedProperties = [] } = useGetSharedPropertiesForUserQuery();

	// Combine owned and shared properties for task assignment
	const allProperties = useMemo(() => {
		const combined = [...ownedProperties, ...sharedProperties];
		// Filter out properties hidden from dashboard
		const hiddenIds = currentUser?.hiddenPropertyIds || [];
		return combined.filter((property) => !hiddenIds.includes(property.id));
	}, [ownedProperties, sharedProperties, currentUser?.hiddenPropertyIds]);

	// Firebase mutations
	const [updateTaskMutation] = useUpdateTaskMutation();

	// Local task handlers
	const taskHandlers = useTaskHandlers({ updateTaskMutation });

	// Destructure task handlers state
	const {
		showTaskDialog,
		setShowTaskDialog,
		editingTaskId,
		showTaskAssignDialog,
		setShowTaskAssignDialog,
		assigningTaskId,
	} = taskHandlers;

	const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
	const [taskDaysFilter, setTaskDaysFilter] = useState<number>(30);

	// Fetch all property shares for task filtering
	const { data: propertyShares = [] } = useGetAllPropertySharesForUserQuery();

	// Generate assignee options for task editing
	const assigneeOptions = useMemo(() => {
		const assignees: Array<{ label: string; value: string; email?: string }> =
			[];

		// Add team members
		teamMembers
			.filter((member): member is typeof member => member !== undefined)
			.forEach((member) => {
				assignees.push({
					label: `${member.firstName || ''} ${member.lastName || ''} (${
						member.title || ''
					})`.trim(),
					value: member.id,
					email: member.email,
				});
			});

		return assignees;
	}, [teamMembers]);

	// Get active tasks for display
	const filteredTasks = useMemo(() => {
		const filtered = filterTasksByRole(
			allTasks,
			currentUser,
			teamMembers,
			allProperties,
			propertyShares,
		);
		const activeTasks = filtered.filter((task) => task.status !== 'Completed');

		// Filter tasks within the specified days
		const now = new Date();
		const daysInMs = taskDaysFilter * 24 * 60 * 60 * 1000;
		const futureDate = new Date(now.getTime() + daysInMs);

		const tasksWithinRange = activeTasks.filter((task) => {
			if (!task.dueDate) return false;
			const dueDate = new Date(task.dueDate);
			return dueDate >= now && dueDate <= futureDate;
		});

		// Sort by due date (ascending), then by priority (descending)
		const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };

		const sorted = tasksWithinRange.sort((a, b) => {
			// Primary: Sort by due date (soonest first)
			const dateA = new Date(a.dueDate!).getTime();
			const dateB = new Date(b.dueDate!).getTime();
			if (dateA !== dateB) {
				return dateA - dateB;
			}

			// Secondary: Sort by priority (highest first)
			const priorityA =
				priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
			const priorityB =
				priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
			return priorityB - priorityA;
		});

		// Enrich tasks with propertyTitle for display in table
		return sorted.map((task) => {
			const property = allProperties.find((p) => p.id === task.propertyId);
			return {
				...task,
				propertyTitle: property?.title || task.property || 'Unknown Property',
				assignedToNames: task.assignedTo?.name || '',
			};
		});
	}, [
		allTasks,
		currentUser,
		teamMembers,
		allProperties,
		taskDaysFilter,
		propertyShares,
	]);

	// Count of active tasks (before timeframe filtering)
	const activeTasksCount = useMemo(() => {
		const filtered = filterTasksByRole(
			allTasks,
			currentUser,
			teamMembers,
			allProperties,
			propertyShares,
		);
		return filtered.filter((task) => task.status !== 'Completed').length;
	}, [allTasks, currentUser, teamMembers, allProperties, propertyShares]);

	// Table columns definition
	const columns: Column[] = [
		{ header: 'Title', key: 'title' },
		{
			header: 'Status',
			key: 'status',
			render: (status: string) => (
				<StatusBadge status={status}>{status}</StatusBadge>
			),
		},
		{ header: 'Priority', key: 'priority' },
		{
			header: 'Assigned To',
			key: 'assignedTo',
			render: (_unused: any, task: any) =>
				typeof task.assignedTo === 'object'
					? task.assignedTo.name
					: task.assignedTo || 'Unassigned',
		},
		{ header: 'Due Date', key: 'dueDate' },
		{ header: 'Property', key: 'propertyTitle' },
	];

	const taskActions: Action[] = [
		{
			label: 'Edit',
			icon: faEdit,
			onClick: (task: any) => {
				taskHandlers.setEditingTaskId(task.id);
				taskHandlers.setShowTaskDialog(true);
			},
		},
		{
			label: 'Assign',
			icon: faUserPlus,
			onClick: (task: any) => {
				taskHandlers.setAssigningTaskId(task.id);
				taskHandlers.setShowTaskAssignDialog(true);
			},
		},
		{
			label: 'Delete',
			icon: faTrash,
			onClick: (_task: any) => {
				if (window.confirm('Are you sure you want to delete this task?')) {
					// Handle delete logic here
				}
			},
			className: 'delete',
		},
	];

	const handleTaskCompletion = (taskId: string) => {
		setCompletingTaskId(taskId);
		setShowTaskCompletionModal(true);
	};

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setCompletingTaskId(null);
		setSelectedRows(new Set());
	};

	return (
		<Wrapper>
			{/* Task Filter Section */}
			<FilterSection>
				<label htmlFor='task-days-filter'>Show tasks due within:</label>
				<select
					id='task-days-filter'
					value={taskDaysFilter}
					onChange={(e) => setTaskDaysFilter(Number(e.target.value))}>
					<option value={7}>7 days</option>
					<option value={14}>14 days</option>
					<option value={30}>30 days</option>
					<option value={60}>60 days</option>
					<option value={90}>90 days</option>
				</select>
			</FilterSection>

			{/* Task Grid Section */}
			<TaskGridSection>
				{filteredTasks.length === 0 ? (
					<ZeroState
						title={
							allTasks.length === 0
								? 'No tasks yet'
								: activeTasksCount === 0
								? 'No active tasks'
								: 'No upcoming tasks in selected timeframe'
						}
						description={
							allTasks.length === 0
								? 'Create your first task to get started'
								: activeTasksCount === 0
								? 'All your tasks are completed'
								: `Try adjusting the time filter above or check tasks in other timeframes`
						}
						icon='📊'></ZeroState>
				) : (
					<ReusableTable
						rowData={filteredTasks}
						columns={columns}
						actions={taskActions}
						onRowDoubleClick={(taskId) => navigate(`/task/${taskId}`)}
						onRowSelect={(selectedRows) => {
							setSelectedRows(new Set(selectedRows));
						}}
						selectedRows={selectedRows}
						onSelectAll={(_, selectedRowIds) => {
							setSelectedRows(new Set(selectedRowIds));
						}}
						showCheckbox={false}
						onRowUpdate={(updatedRow) => {
							// Prepare updates for Firebase
							const updates: any = {};

							// Update status if changed
							if (updatedRow.status) {
								updates.status = updatedRow.status;
							}

							// Update priority if changed
							if (updatedRow.priority) {
								updates.priority = updatedRow.priority;
							}

							// Note: AssignedTo editing is disabled in table view

							// Handle logic for updated row, e.g., marking a task as completed
							if (updatedRow.status === 'Completed') {
								handleTaskCompletion(updatedRow.id);
								return;
							}

							// Submit to Firebase if there are updates
							if (Object.keys(updates).length > 0) {
								updateTaskMutation({
									id: updatedRow.id,
									updates,
								}).catch((error) => {
									console.error('Failed to update task:', error);
								});
							}
						}}
					/>
				)}
			</TaskGridSection>

			{/* Task Modals */}
			{showTaskDialog && (
				<TaskModal
					isOpen={showTaskDialog}
					onClose={() => setShowTaskDialog(false)}
					editingTaskId={editingTaskId}
					editingTask={
						editingTaskId ? allTasks.find((t) => t.id === editingTaskId) : null
					}
					isEditing={!!editingTaskId}
					assigneeOptions={assigneeOptions}
					currentUser={currentUser}
				/>
			)}

			{showTaskAssignDialog && (
				<TaskAssignModal
					isOpen={showTaskAssignDialog}
					onClose={() => setShowTaskAssignDialog(false)}
					task={
						assigningTaskId
							? allTasks.find((t) => t.id === assigningTaskId)
							: null
					}
					propertyId={
						assigningTaskId
							? allTasks.find((t) => t.id === assigningTaskId)?.propertyId || ''
							: ''
					}
					selectedAssignee={null}
				/>
			)}

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
		</Wrapper>
	);
};
