import React, { useState, useMemo, useEffect } from 'react';
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import { ZeroState } from '../../Components/Library/ZeroState';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import {
	useGetSharedPropertiesForUserQuery,
	useGetAllPropertySharesForUserQuery,
	useGetAllMaintenanceHistoryForUserQuery,
} from '../../Redux/API/userSlice';
import { UserRole } from '../../constants/roles';
import { isTenant, getTenantPropertySlug } from '../../utils/permissions';
import { filterTasksByRole } from '../../utils/dataFilters';
import { getDefaultTempUnit } from '../../utils/geolocationUtils';
import { getCurrentLocation } from '../../utils/geolocation';
import { TaskCompletionModal } from '../../Components/TaskCompletionModal';
import { TrialWarningBanner } from '../../Components/TrialWarningBanner/TrialWarningBanner';
import { ExpiredTrialBanner } from '../../Components/ExpiredTrialBanner/ExpiredTrialBanner';
import {
	getTrialDaysRemaining,
	isTrialExpired,
} from '../../utils/subscriptionUtils';
import { handleCheckoutSuccess } from '../../services/stripeService';
import { logout } from '../../Redux/Slices/userSlice';
import {
	Wrapper,
	TaskGridSection,
	BottomSectionsWrapper,
	TopChartsContainer,
	CarouselSection,
	Section,
	SectionTitle,
	SectionContent,
	TempToggle,
	FilterSection,
} from './DashboardTab.styles';
import { SeasonalMaintenance } from '../../Components/SeasonalMaintenance';
import { ReusableTable } from '../../Components/Library/ReusableTable';
import { MobileTaskCarousel } from '../../Components/Library/MobileTaskCarousel/MobileTaskCarousel';
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

export const DashboardTab = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
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
	const { data: allMaintenanceHistory = [] } =
		useGetAllMaintenanceHistoryForUserQuery(); // Combine owned and shared properties for task assignment
	const allProperties = useMemo(() => {
		const combined = [...ownedProperties, ...sharedProperties];
		// Filter out properties hidden from dashboard
		const hiddenIds = currentUser?.hiddenPropertyIds || [];
		return combined.filter((property) => !hiddenIds.includes(property.id));
	}, [ownedProperties, sharedProperties, currentUser?.hiddenPropertyIds]);

	// Firebase mutations
	const [updateTaskMutation] = useUpdateTaskMutation();

	// Local task handlers for dashboard (used by MobileTaskCarousel)
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

	// Pie chart data for efficiency
	const efficiencyData = useMemo(() => {
		const now = new Date();
		let completed = allMaintenanceHistory.length, // Count completed tasks from maintenance history
			inProgress = 0,
			overdue = 0;

		// Count in-progress and overdue from active tasks (excluding completed)
		allTasks.forEach((task) => {
			if (task.status !== 'Completed') {
				// Skip completed tasks since they're in maintenance history
				if (
					task.dueDate &&
					new Date(task.dueDate) < now &&
					(task.status === 'Pending' ||
						task.status === 'In Progress' ||
						task.status === 'Awaiting Approval' ||
						task.status === 'Rejected')
				) {
					overdue++;
				} else {
					inProgress++;
				}
			}
		});

		return [
			{ name: 'Completed', value: completed },
			{ name: 'In Progress', value: inProgress },
			{ name: 'Overdue', value: overdue },
		];
	}, [allTasks, allMaintenanceHistory]);

	const COLORS = ['#34d399', '#60a5fa', '#f87171'];

	// Redirect tenants to their assigned property
	useEffect(() => {
		if (currentUser && isTenant(currentUser.role as UserRole)) {
			const propertySlug = getTenantPropertySlug(
				currentUser.assignedPropertyId,
			);
			if (propertySlug) {
				navigate(`/property/${propertySlug}`, { replace: true });
			}
		}
	}, [currentUser, navigate]);

	// Get user geolocation once on mount (with permission request on mobile)
	useEffect(() => {
		const getLocation = async () => {
			const location = await getCurrentLocation();
			if (location) {
				setUserLocation(location);
				// Set default temp unit based on location
				const defaultUnit = getDefaultTempUnit(
					location.latitude,
					location.longitude,
				);
				setTempUnit(defaultUnit);
			}
		};
		getLocation();
	}, []);

	// Handle Stripe checkout success
	useEffect(() => {
		const urlParams = new URLSearchParams(location.search);
		const sessionId = urlParams.get('session_id');

		if (sessionId && currentUser) {
			// Remove session_id from URL
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete('session_id');
			window.history.replaceState({}, '', newUrl.toString());

			// Verify checkout session
			handleCheckoutSuccess(sessionId)
				.then((result) => {
					console.log('Checkout success verified:', result);
					// Force a logout/login to refresh user data with new subscription
					dispatch(logout());
					setTimeout(() => {
						window.location.reload();
					}, 1000);
				})
				.catch((error) => {
					console.error('Checkout verification failed:', error);
					// Could show an error toast here
				});
		}
	}, [location.search, currentUser, dispatch]);

	const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
	const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
	const [userLocation, setUserLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const [taskDaysFilter, setTaskDaysFilter] = useState<number>(30);

	// Task modal states (now managed by taskHandlers)
	// const [showTaskDialog, setShowTaskDialog] = useState(false); // Now from taskHandlers
	// const [isEditMode, setIsEditMode] = useState(false);
	// const [editingTask, setEditingTask] = useState<any>(null);
	// const [showTaskAssignDialog, setShowTaskAssignDialog] = useState(false); // Now from taskHandlers
	// const [assigningTask, setAssigningTask] = useState<any>(null);

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

	const handleTempUnit = (unit: 'C' | 'F') => {
		setTempUnit(unit);
	};

	// Get active tasks for carousel (without enrichment)
	const carouselTasks = useMemo(() => {
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

		console.log('Carousel tasks count:', sorted.length);
		return sorted;
	}, [
		allTasks,
		currentUser,
		teamMembers,
		allProperties,
		taskDaysFilter,
		propertyShares,
	]);

	const filteredTasks = useMemo(() => {
		// Enrich carousel tasks with propertyTitle for display in table
		return carouselTasks.map((task) => {
			const property = allProperties.find((p) => p.id === task.propertyId);
			return {
				...task,
				propertyTitle: property?.title || task.property || 'Unknown Property',
				assignedToNames: task.assignedTo?.name || '',
			};
		});
	}, [carouselTasks, allProperties]);

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
			{/* Trial/Expired Warning Banner */}
			{currentUser?.subscription?.status === 'trial' && (
				<TrialWarningBanner
					daysRemaining={getTrialDaysRemaining(currentUser.subscription as any)}
					onUpgradeClick={() => navigate('/paywall')}
				/>
			)}
			{currentUser?.subscription &&
				isTrialExpired(currentUser.subscription) && (
					<ExpiredTrialBanner onUpgradeClick={() => navigate('/paywall')} />
				)}

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
								console.log(
									'✅ Status changed to Completed, calling handleTaskCompletion',
								);
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

			{/* Bottom Sections - Charts and Carousel */}
			<BottomSectionsWrapper>
				{/* Top Row: Efficiency Chart */}
				<TopChartsContainer>
					<Section>
						<SectionTitle>Efficiency Chart</SectionTitle>
						<SectionContent>
							{efficiencyData.every((item) => item.value === 0) ? (
								<ZeroState
									title='No tasks yet'
									description='No data available'
									icon='📊'></ZeroState>
							) : (
								<ResponsiveContainer width='100%' height={200}>
									<PieChart>
										<Pie
											data={efficiencyData}
											dataKey='value'
											nameKey='name'
											cx='50%'
											cy='50%'
											outerRadius={60}
											label>
											{efficiencyData.map((_, index) => (
												<Cell
													key={`cell-${index}`}
													fill={COLORS[index % COLORS.length]}
												/>
											))}
										</Pie>
										<Tooltip />
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							)}
						</SectionContent>
					</Section>
					<Section>
						<SectionTitle>
							<h3>Seasonal Maintenance Tips</h3>
							<TempToggle>
								<button
									className={tempUnit === 'C' ? 'active' : ''}
									onClick={() => handleTempUnit('C')}>
									°C
								</button>
								<button
									className={tempUnit === 'F' ? 'active' : ''}
									onClick={() => handleTempUnit('F')}>
									°F
								</button>
							</TempToggle>
						</SectionTitle>

						<SectionContent>
							<SeasonalMaintenance
								tempUnit={tempUnit}
								location={userLocation}
							/>
						</SectionContent>
					</Section>
				</TopChartsContainer>

				{/* Task Carousel Section - Mobile Only */}
				<CarouselSection>
					<MobileTaskCarousel
						tasks={carouselTasks}
						onTaskComplete={handleTaskCompletion}
						onTaskUpdate={async (taskId, updates) => {
							try {
								await updateTaskMutation({ id: taskId, updates }).unwrap();
							} catch (error) {
								console.error('Failed to update task from carousel', error);
							}
						}}
						taskHandlers={taskHandlers}
					/>
				</CarouselSection>

				{/* Seasonal Maintenance - Mobile Only (Below Carousel) */}
				<Section className='mobile-seasonal'>
					<SectionTitle>
						<h3>Seasonal Maintenance Tips</h3>
						<TempToggle>
							<button
								className={tempUnit === 'C' ? 'active' : ''}
								onClick={() => handleTempUnit('C')}>
								°C
							</button>
							<button
								className={tempUnit === 'F' ? 'active' : ''}
								onClick={() => handleTempUnit('F')}>
								°F
							</button>
						</TempToggle>
					</SectionTitle>

					<SectionContent>
						<SeasonalMaintenance tempUnit={tempUnit} location={userLocation} />
					</SectionContent>
				</Section>
			</BottomSectionsWrapper>

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

			<TaskModal
				isOpen={showTaskDialog}
				onClose={() => {
					setShowTaskDialog(false);
				}}
				editingTask={
					editingTaskId ? allTasks.find((t) => t.id === editingTaskId) : null
				}
				isEditing={!!editingTaskId}
				assigneeOptions={assigneeOptions}
				currentUser={currentUser}
			/>

			<TaskAssignModal
				isOpen={showTaskAssignDialog}
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
				onClose={() => setShowTaskAssignDialog(false)}
				selectedAssignee={
					assigningTaskId
						? allTasks.find((t) => t.id === assigningTaskId)?.assignedTo
						: null
				}
				assigneeOptions={assigneeOptions}
			/>
		</Wrapper>
	);
};
