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
import { getTenantPropertySlug } from '../../utils/permissions';
import { selectIsTenant } from '../../Redux/selectors/permissionSelectors';
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
	BottomSectionsWrapper,
	TopChartsContainer,
	Section,
	SectionTitle,
	SectionContent,
	TempToggle,
	TaskStatusBanners,
	TaskStatusBanner,
	TaskStatusCount,
	TaskStatusText,
	PropertyScoreSection,
	PropertyScoreTitle,
	ScoreGaugeContainer,
	ScoreValue,
} from './DashboardTab.styles';
import { SeasonalMaintenance } from '../../Components/SeasonalMaintenance';
import { useTaskHandlers } from '../PropertyDetailPage/useTaskHandlers';
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
	const isUserTenant = useSelector(selectIsTenant);

	useEffect(() => {
		if (currentUser && isUserTenant) {
			const propertySlug = getTenantPropertySlug(
				currentUser.assignedPropertyId,
			);
			if (propertySlug) {
				navigate(`/property/${propertySlug}`, { replace: true });
			}
		}
	}, [currentUser, isUserTenant, navigate]);

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
					console.info('Checkout verification result:', result);
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

	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
	const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
	const [userLocation, setUserLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

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

	// Task status counts for banner display
	const taskStatusCounts = useMemo(() => {
		const filteredTasks = filterTasksByRole(
			allTasks,
			currentUser,
			teamMembers,
			allProperties,
			propertyShares,
		);

		const now = new Date();
		let overdue = 0;
		let upcoming = 0;
		let completed = allMaintenanceHistory.length; // Completed tasks from maintenance history

		filteredTasks.forEach((task) => {
			if (task.status === 'Completed') {
				// Already counted in maintenance history
				return;
			}

			if (task.dueDate) {
				const dueDate = new Date(task.dueDate);
				if (dueDate < now) {
					// Overdue if past due and not completed
					if (
						task.status === 'Pending' ||
						task.status === 'In Progress' ||
						task.status === 'Awaiting Approval' ||
						task.status === 'Rejected'
					) {
						overdue++;
					}
				} else {
					// Upcoming if due in the future
					upcoming++;
				}
			}
		});

		return {
			overdue,
			upcoming,
			completed,
		};
	}, [
		allTasks,
		currentUser,
		teamMembers,
		allProperties,
		propertyShares,
		allMaintenanceHistory,
	]);

	// Property score calculation (100 - penalty for overdue tasks)
	const propertyScore = useMemo(() => {
		const baseScore = 100;
		const penaltyPerOverdueTask = 5; // 5 points deducted per overdue task
		const score = Math.max(
			0,
			baseScore - taskStatusCounts.overdue * penaltyPerOverdueTask,
		);
		return score;
	}, [taskStatusCounts.overdue]);

	const gaugeNeedle = useMemo(() => {
		const centerX = 100;
		const centerY = 100;
		const radius = 70;
		const theta = Math.PI * (1 - propertyScore / 100);
		const end = {
			x: centerX + radius * Math.cos(theta),
			y: centerY - radius * Math.sin(theta),
		};
		return {
			centerX,
			centerY,
			x: end.x,
			y: end.y,
		};
	}, [propertyScore]);

	const gaugeSegments = useMemo(
		() => [
			{ name: 'Low', value: 33, fill: '#ef4444' },
			{ name: 'Medium', value: 33, fill: '#f59e0b' },
			{ name: 'High', value: 34, fill: '#10b981' },
		],
		[],
	);

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setCompletingTaskId(null);
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

			{/* Task Status Banners */}
			<TaskStatusBanners>
				<TaskStatusBanner $type='overdue' onClick={() => navigate('/tasks')}>
					<TaskStatusCount $type='overdue'>
						{taskStatusCounts.overdue}
					</TaskStatusCount>
					<TaskStatusText>
						{taskStatusCounts.overdue === 1 ? 'Overdue Task' : 'Overdue Tasks'}
					</TaskStatusText>
				</TaskStatusBanner>

				<TaskStatusBanner $type='upcoming' onClick={() => navigate('/tasks')}>
					<TaskStatusCount $type='upcoming'>
						{taskStatusCounts.upcoming}
					</TaskStatusCount>
					<TaskStatusText>
						{taskStatusCounts.upcoming === 1
							? 'Upcoming Task'
							: 'Upcoming Tasks'}
					</TaskStatusText>
				</TaskStatusBanner>
			</TaskStatusBanners>

			{/* Property Score Section */}
			<PropertyScoreSection>
				<PropertyScoreTitle>Property Score</PropertyScoreTitle>
				<ScoreGaugeContainer>
					<PieChart width={200} height={110}>
						<Pie
							data={gaugeSegments}
							dataKey='value'
							cx={100}
							cy={100}
							startAngle={180}
							endAngle={0}
							innerRadius={60}
							outerRadius={80}
							stroke='none'
							isAnimationActive={false}>
							{gaugeSegments.map((segment, index) => (
								<Cell
									key={`gauge-${segment.name}-${index}`}
									fill={segment.fill}
								/>
							))}
						</Pie>
						<g>
							<line
								x1={gaugeNeedle.centerX}
								y1={gaugeNeedle.centerY}
								x2={gaugeNeedle.x}
								y2={gaugeNeedle.y}
								stroke='#1f2937'
								strokeWidth='2'
							/>
							<circle
								cx={gaugeNeedle.centerX}
								cy={gaugeNeedle.centerY}
								r='4'
								fill='#1f2937'
							/>
						</g>
					</PieChart>
					<ScoreValue>{propertyScore}</ScoreValue>
				</ScoreGaugeContainer>
			</PropertyScoreSection>

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
				editingTaskId={editingTaskId}
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
