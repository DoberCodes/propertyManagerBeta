import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { SUBSCRIPTION_PLANS } from '../../constants/subscriptions';
import {
	useGetPropertiesQuery,
	useGetTasksQuery,
} from '../../Redux/API/apiSlice';
import { on } from 'events';
import TermsAcceptanceStep from './TermsAcceptanceStep';

const OnboardingOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.8);
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
`;

const OnboardingModal = styled.div`
	background: white;
	border-radius: 16px;
	padding: 40px;
	max-width: 600px;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const OnboardingHeader = styled.div`
	text-align: center;
	margin-bottom: 32px;

	h1 {
		font-size: 28px;
		font-weight: 700;
		color: ${COLORS.primary};
		margin: 0 0 8px 0;
	}

	p {
		font-size: 16px;
		color: #64748b;
		margin: 0;
	}
`;

const StepIndicator = styled.div`
	display: flex;
	justify-content: center;
	margin-bottom: 32px;
	gap: 8px;
`;

const StepDotBase = styled.div<{ $active: boolean; $completed: boolean }>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: ${({ $active, $completed }) => {
		if ($completed) return COLORS.success;
		if ($active) return COLORS.primary;
		return '#e2e8f0';
	}};
	transition: all 0.3s ease;
`;

const StepDot: React.FC<{ active: boolean; completed: boolean }> = ({
	active,
	completed,
}) => {
	return <StepDotBase $active={active} $completed={completed} />;
};

const StepContent = styled.div`
	text-align: center;
	margin-bottom: 32px;

	h2 {
		font-size: 24px;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 16px 0;
	}

	p {
		font-size: 16px;
		color: #64748b;
		line-height: 1.6;
		margin: 0 0 24px 0;
	}

	.feature-list {
		text-align: left;
		max-width: 400px;
		margin: 0 auto;

		ul {
			list-style: none;
			padding: 0;
			margin: 0;

			li {
				display: flex;
				align-items: center;
				margin-bottom: 12px;
				font-size: 16px;
				color: #475569;

				&:before {
					content: '✓';
					color: ${COLORS.success};
					font-weight: bold;
					margin-right: 12px;
					font-size: 18px;
				}
			}
		}
	}
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 16px;
	justify-content: center;

	@media (max-width: 480px) {
		flex-direction: column;
		align-items: center;
	}
`;

const PrimaryButton = styled.button`
	background: ${COLORS.primary};
	color: white;
	border: none;
	padding: 12px 24px;
	border-radius: 8px;
	font-size: 16px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
	}
`;

const SkipButton = styled.button`
	background: transparent;
	color: #64748b;
	border: none;
	padding: 8px 16px;
	border-radius: 6px;
	font-size: 14px;
	cursor: pointer;
	text-decoration: underline;
	transition: color 0.2s ease;

	&:hover {
		color: #475569;
	}
`;

// Celebration Modal
const CelebrationModal = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.9);
	z-index: 1001;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	animation: fadeIn 0.5s ease;
`;

const CelebrationContent = styled.div`
	background: white;
	border-radius: 20px;
	padding: 60px 40px;
	max-width: 500px;
	width: 100%;
	text-align: center;
	box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
	animation: bounceIn 0.6s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes bounceIn {
		0% {
			transform: scale(0.3);
			opacity: 0;
		}
		50% {
			transform: scale(1.05);
		}
		70% {
			transform: scale(0.9);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
`;

const CelebrationIcon = styled.div`
	font-size: 80px;
	margin-bottom: 24px;
	animation: celebrate 1s ease infinite alternate;
	color: ${COLORS.success};

	@keyframes celebrate {
		from {
			transform: scale(1);
		}
		to {
			transform: scale(1.1);
		}
	}
`;

const CelebrationTitle = styled.h1`
	font-size: 32px;
	font-weight: 700;
	color: ${COLORS.primary};
	margin: 0 0 16px 0;
`;

const CelebrationMessage = styled.p`
	font-size: 18px;
	color: #64748b;
	line-height: 1.6;
	margin: 0 0 32px 0;
`;

const CelebrationActions = styled.div`
	display: flex;
	justify-content: center;
	gap: 16px;
`;

// Page Guide Modal (for explaining specific pages)
const PageGuideModal = styled.div`
	position: fixed;
	top: 20px;
	right: 20px;
	background: white;
	border-radius: 16px;
	padding: 24px;
	max-width: 350px;
	width: 100%;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	z-index: 1001;
	animation: slideIn 0.4s ease;

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		position: fixed;
		top: auto;
		bottom: 20px;
		right: 20px;
		left: 20px;
		max-width: none;
	}
`;

const PageGuideHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: 16px;
`;

const PageGuideTitle = styled.h3`
	font-size: 20px;
	font-weight: 600;
	color: ${COLORS.primary};
	margin: 0;
`;

const PageGuideClose = styled.button`
	background: none;
	border: none;
	color: #64748b;
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	transition: color 0.2s ease;

	&:hover {
		color: #475569;
	}
`;

const PageGuideContent = styled.div`
	font-size: 16px;
	color: #475569;
	line-height: 1.6;
	margin-bottom: 20px;
`;

const PageGuideActions = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
`;

// Minimized Waiting Modal (non-blocking)
const MinimizedWaitingModal = styled.div<{ $visible: boolean }>`
	position: fixed;
	top: 20px;
	right: 20px;
	background: #f8fafc;
	border: 2px solid ${COLORS.primary};
	border-radius: 12px;
	padding: 16px 20px;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	z-index: 999;
	max-width: 300px;
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	transform: ${({ $visible }) =>
		$visible ? 'translateY(0)' : 'translateY(-20px)'};
	transition: all 0.3s ease;
	pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};

	@media (max-width: 768px) {
		top: 20px;
		right: 20px;
		left: 20px;
		max-width: none;
	}
`;

const MinimizedWaitingContent = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
`;

const MinimizedWaitingText = styled.div`
	flex: 1;
	font-size: 14px;
	color: #475569;
	line-height: 1.4;
`;

const MinimizedWaitingActions = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
`;

const HelpButton = styled.button`
	background: ${COLORS.primary};
	color: white;
	border: none;
	padding: 6px 12px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}
`;

// Enhanced interfaces
interface OnboardingStep {
	id: string;
	type: 'instruction' | 'celebration' | 'page_guide' | 'waiting';
	title: string;
	description: string;
	content?: React.ReactNode;
	actionLabel?: string;
	action?: () => void;
	waitCondition?: () => boolean;
	autoAdvance?: boolean;
	skipLabel?: string;
}

interface OnboardingFlowProps {
	onComplete: () => void;
	onSkip: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
	onComplete,
	onSkip,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	// Fetch data for real-time validation
	const { data: properties = [] } = useGetPropertiesQuery();
	const { data: tasks = [] } = useGetTasksQuery();

	console.info(tasks);

	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [showCelebration, setShowCelebration] = useState(false);
	const [showPageGuide, setShowPageGuide] = useState(false);
	const [pageGuideContent, setPageGuideContent] = useState<{
		title: string;
		content: string;
		actionLabel?: string;
		onAction?: () => void;
	} | null>(null);
	const [waitingModalMinimized, setWaitingModalMinimized] = useState(false);

	// Functions to control modal visibility
	const restoreWaitingModal = () => {
		setWaitingModalMinimized(false);
	};

	const minimizeWaitingModal = () => {
		setWaitingModalMinimized(true);
	};

	// Determine user type and permissions
	const isPropertyManager = currentUser?.subscription?.plan
		? ['BASIC', 'PROFESSIONAL'].includes(
				currentUser.subscription.plan.toUpperCase(),
		  )
		: false;
	const canManageTeam = currentUser?.subscription?.plan
		? SUBSCRIPTION_PLANS[currentUser.subscription.plan.toUpperCase()]
				?.permissions?.canManageTeam || false
		: false;

	// Enhanced step definitions with validation and celebration logic
	const getSteps = (): OnboardingStep[] => {
		const steps: OnboardingStep[] = [
			// Step 1: Welcome
			{
				id: 'welcome',
				type: 'instruction',
				title: 'Welcome to Maintley! 🎉',
				description: `Your property management journey starts here. Let's get you set up with a personalized guided tour.`,
				content: (
					<div className='feature-list'>
						<ul>
							<li>🏠 Manage all your properties in one place</li>
							<li>🔧 Track maintenance tasks and schedules</li>
							{canManageTeam && <li>👥 Invite team members and tenants</li>}
							<li>📊 Get insights with reports and analytics</li>
							<li>🎯 Never miss important maintenance deadlines</li>
						</ul>
					</div>
				),
				actionLabel: 'Start My Guided Tour',
				action: () => advanceToNextStep(),
				skipLabel: 'Skip Tour',
			},

			// Step 2: Create Property (with waiting)
			{
				id: 'create_property_instruction',
				type: 'instruction',
				title: 'Add Your First Property',
				description:
					'Start by adding your property details. This will be the foundation for managing everything else.',
				content: (
					<div style={{ textAlign: 'left', marginTop: '20px' }}>
						<p style={{ marginBottom: '16px', fontWeight: '500' }}>
							Click the "Add Property" button to get started. You'll need to
							provide:
						</p>
						<ul style={{ paddingLeft: '20px', margin: '0' }}>
							<li>Property address and details</li>
							<li>Property type and size</li>
							<li>Key contact information</li>
						</ul>
					</div>
				),
				actionLabel: 'Add Property',
				action: () => {
					navigate('/properties');
					setCurrentStepIndex(currentStepIndex + 1); // Move to waiting step
				},
				skipLabel: 'Skip This Step',
			},

			// Step 3: Wait for Property Creation
			{
				id: 'wait_property_creation',
				type: 'waiting',
				title: 'Go Ahead and Add Your First Property!',
				description:
					"Take your time to fill in the details. I'll be here in the background watching for your progress and will celebrate with you when it's done!",
				waitCondition: () => properties.length > 0,
				autoAdvance: true,
			},

			// Step 4: Property Created Celebration
			{
				id: 'property_celebration',
				type: 'celebration',
				title: 'Amazing! Property Added! 🎉',
				description:
					"Congratulations on adding your first property! You're already making great progress.",
			},
		];

		// Add property navigation and detail page guidance for all users
		steps.push(
			// Step 5: Click Property Tile Instruction (Waiting)
			{
				id: 'click_property_instruction',
				type: 'waiting',
				title: 'Explore Your Property Details',
				description:
					"Now let's take a look at your property details page where you can manage everything. Click on your property tile when you're ready to explore!",
				waitCondition: () => location.pathname.includes('/property/'), // Auto-advance when user navigates to property page
				autoAdvance: true,
			},

			// Step 6: Property Detail Page Guide
			{
				id: 'property_detail_page_guide',
				type: 'page_guide',
				title: 'Property Details Page',
				description:
					'This is your property command center! Here you can manage everything related to this property.',
				content: (
					<div style={{ textAlign: 'left', marginTop: '20px' }}>
						<p style={{ marginBottom: '16px', fontWeight: '500' }}>
							Key features to explore:
						</p>
						<ul style={{ paddingLeft: '20px', margin: '0' }}>
							<li>View and edit property information</li>
							<li>Manage maintenance tasks and schedules</li>
							<li>Share property access with other users</li>
							<li>View maintenance history</li>
							<li>Manage contractors and vendors</li>
						</ul>
					</div>
				),
				actionLabel: 'Sounds Great!',
				action: () => {
					setCurrentStepIndex(currentStepIndex + 1); // Move to waiting step
				},
			},
		);

		// Add task creation steps
		steps.push(
			// Step 7: Create Task Instruction
			{
				id: 'create_task_instruction',
				type: 'instruction',
				title: 'Create Your First Task',
				description:
					'Tasks help you stay organized and never miss important maintenance work. Plus they add to your maintenance history which is super helpful for tracking and resale value.',
				content: (
					<div style={{ textAlign: 'left', marginTop: '20px' }}>
						<p style={{ marginBottom: '16px', fontWeight: '500' }}>
							With a maintenance task, you'll be able to:
						</p>
						<ul style={{ paddingLeft: '20px', margin: '0' }}>
							<li>
								Set task specifics, including uploading documents or valuable
								notes
							</li>
							<li>Schedule due dates, reminders and recurrence schedules</li>
							<li>
								Assign tasks to the responsible party (ie: yourself, a family
								member, or a service provider)
							</li>
						</ul>
					</div>
				),
				actionLabel: 'Understood',
				action: () => {
					setCurrentStepIndex(currentStepIndex + 1);
				},
				skipLabel: 'Skip Task Creation',
			},

			// Step 8: Wait for Task Creation
			{
				id: 'wait_task_creation',
				type: 'waiting',
				title: "Let's Create Your First Maintenance Task!",
				description:
					"Feel free to explore all the property page has to offer. I'll stay out of your way when you minimize me and I'll pop back in to celebrate when you've created your first task!",
				waitCondition: () => tasks.length > 0,
				autoAdvance: true,
			},

			// Step 9: Task Created Celebration
			{
				id: 'task_celebration',
				type: 'celebration',
				title: 'Task Created Successfully! 🎉',
				description:
					"Excellent! You've created your first maintenance task. You're now ready to manage your properties like a pro.",
			},
		);

		// Add advanced features explanation for property managers
		steps.push({
			id: 'advanced_features',
			type: 'instruction',
			title: 'Advanced Features',
			description:
				'Here are some powerful features to help you manage your properties more effectively.',
			content: (
				<div style={{ textAlign: 'left', marginTop: '20px' }}>
					<div style={{ marginBottom: '20px' }}>
						<h4
							style={{
								color: COLORS.primary,
								margin: '0 0 8px 0',
								display: 'flex',
								alignItems: 'center',
							}}>
							<span style={{ marginRight: '8px' }}>🔧</span>
							Contractor Management
						</h4>
						<p
							style={{
								margin: '0 0 8px 28px',
								fontSize: '14px',
								color: '#64748b',
							}}>
							Add trusted contractors to your network. Assign them tasks and
							track their work for your records and future reference.
						</p>
					</div>

					<div style={{ marginBottom: '20px' }}>
						<h4
							style={{
								color: COLORS.primary,
								margin: '0 0 8px 0',
								display: 'flex',
								alignItems: 'center',
							}}>
							<span style={{ marginRight: '8px' }}>📤</span>
							Property Sharing
						</h4>
						<p
							style={{
								margin: '0 0 8px 28px',
								fontSize: '14px',
								color: '#64748b',
							}}>
							Share property access with co-owners, property managers, family
							members, or other users who are helping you with your properties.
						</p>
					</div>
					<div>
						<h4
							style={{
								color: COLORS.primary,
								margin: '0 0 8px 0',
								display: 'flex',
								alignItems: 'center',
							}}>
							<span style={{ marginRight: '8px' }}>📊</span>
							Reports & Analytics
						</h4>
						<p
							style={{
								margin: '0 0 8px 28px',
								fontSize: '14px',
								color: '#64748b',
							}}>
							Run reports to get insights on your maintenance history, property
							details, and more. Use this information to make informed decisions
							and keep your properties in top shape, or share it with potential
							buyers to demonstrate the value of your well-maintained property!
						</p>
					</div>
				</div>
			),
			actionLabel: 'Good to know!',
			action: () => {
				setCurrentStepIndex(currentStepIndex + 1);
			},
		});
		if (isPropertyManager) {
			steps.push({
				id: 'advanced_features',
				type: 'instruction',
				title: 'Advanced Features',
				description:
					'Here are some powerful features to help you manage your properties more effectively.',
				content: (
					<div>
						<div style={{ marginBottom: '20px' }}>
							<h4
								style={{
									color: COLORS.primary,
									margin: '0 0 8px 0',
									display: 'flex',
									alignItems: 'center',
								}}>
								Team management
							</h4>
							<p
								style={{
									margin: '0 0 8px 28px',
									fontSize: '14px',
									color: '#64748b',
								}}>
								Invite your team members to collaborate on property management.
								Assign tasks, share property access, and keep detailed
								maintenance history.
							</p>
						</div>
						<div style={{ marginBottom: '20px' }}>
							<h4
								style={{
									color: COLORS.primary,
									margin: '0 0 8px 0',
									display: 'flex',
									alignItems: 'center',
								}}>
								<span style={{ marginRight: '8px' }}>👥</span>
								Tenant Access
							</h4>
							<p
								style={{
									margin: '0 0 8px 28px',
									fontSize: '14px',
									color: '#64748b',
								}}>
								Invite tenants limited access to submit maintenance requests and
								view some basic property information. This keeps everyone in the
								loop and makes communication easier.
							</p>
						</div>
						<div>
							<h4
								style={{
									color: COLORS.primary,
									margin: '0 0 8px 0',
									display: 'flex',
									alignItems: 'center',
								}}>
								Unit Specific Management
							</h4>
							<p
								style={{
									margin: '0 0 8px 28px',
									fontSize: '14px',
									color: '#64748b',
								}}>
								For multi-family properties, manage each unit separately. Assign
								tasks, track maintenance, add unit specific devices, and store
								information specific to each unit for better organization.
							</p>
						</div>
					</div>
				),
			});
		} else {
			// For homeowners, add terms acceptance step before completion
			steps.push({
				id: 'terms_acceptance',
				type: 'instruction',
				title: 'Terms & Agreements',
				description:
					'Before you start using Maintley, please review and accept our terms of service, privacy policy, and maintenance disclaimer.',
				content: <TermsAcceptanceStep onAccept={advanceToNextStep} />,
			});

			steps.push({
				id: 'homeowner_complete',
				type: 'instruction',
				title: "You're All Set! 🎉",
				description:
					'You now have the foundation to manage your property effectively. Continue exploring the app to discover more features.',
				actionLabel: 'Start Using Maintley',
				action: () => {
					navigate('/dashboard');
					onComplete();
				},
				skipLabel: 'Finish Setup',
			});
		}

		return steps;
	};

	const steps = getSteps();
	const currentStep = steps[currentStepIndex];

	// Handle step advancement
	const advanceToNextStep = useCallback(() => {
		if (currentStepIndex < steps.length - 1) {
			setCurrentStepIndex(currentStepIndex + 1);
		} else {
			onComplete();
		}
	}, [currentStepIndex, steps.length, onComplete]);

	// Handle step skipping
	const skipOnboarding = () => {
		onSkip();
	};

	// Check for auto-advancement conditions
	useEffect(() => {
		if (currentStep?.autoAdvance && currentStep?.waitCondition) {
			if (currentStep.waitCondition()) {
				advanceToNextStep();
			}
		}
	}, [properties, tasks, location.pathname, currentStep, advanceToNextStep]);

	// Handle celebration steps
	useEffect(() => {
		if (currentStep?.type === 'celebration') {
			setShowCelebration(true);
		} else {
			setShowCelebration(false);
		}
	}, [currentStep]);

	// Handle page-specific guides
	useEffect(() => {
		if (
			currentStep?.type === 'page_guide' &&
			location.pathname.includes('/properties/')
		) {
			setPageGuideContent({
				title: 'Property Details Page',
				content:
					'This is your property command center! Here you can manage units, tenants, tasks, and all property-related information. Click "Add Task" to create your first maintenance task.',
				actionLabel: 'Create Task',
				onAction: () => {
					setShowPageGuide(false);
					setCurrentStepIndex(currentStepIndex + 1);
				},
			});
			setShowPageGuide(true);
		}
	}, [location.pathname, currentStep, currentStepIndex]);

	// Handle waiting modal minimization
	useEffect(() => {
		let minimizeTimer: NodeJS.Timeout | null = null;

		if (currentStep?.type === 'waiting') {
			// Reset minimized state when entering a waiting step
			setWaitingModalMinimized(false);

			// // Minimize the modal after 3 seconds
			// minimizeTimer = setTimeout(() => {
			// 	setWaitingModalMinimized(true);
			// }, 3000);
		} else {
			// Reset when not in waiting state
			setWaitingModalMinimized(false);
		}

		return () => {
			if (minimizeTimer) {
				clearTimeout(minimizeTimer);
			}
		};
	}, [currentStepIndex]);

	// Render different modal types
	if (showCelebration) {
		return (
			<CelebrationModal>
				<CelebrationContent>
					<CelebrationIcon>✅</CelebrationIcon>
					<CelebrationTitle>{currentStep.title}</CelebrationTitle>
					<CelebrationMessage>{currentStep.description}</CelebrationMessage>
					<CelebrationActions>
						<PrimaryButton onClick={advanceToNextStep}>Continue</PrimaryButton>
					</CelebrationActions>
				</CelebrationContent>
			</CelebrationModal>
		);
	}

	if (showPageGuide && pageGuideContent) {
		return (
			<PageGuideModal>
				<PageGuideHeader>
					<PageGuideTitle>{pageGuideContent.title}</PageGuideTitle>
					<PageGuideClose onClick={() => setShowPageGuide(false)}>
						✕
					</PageGuideClose>
				</PageGuideHeader>
				<PageGuideContent>{pageGuideContent.content}</PageGuideContent>
				{pageGuideContent.actionLabel && (
					<PageGuideActions>
						<PrimaryButton onClick={pageGuideContent.onAction}>
							{pageGuideContent.actionLabel}
						</PrimaryButton>
					</PageGuideActions>
				)}
			</PageGuideModal>
		);
	}

	// Handle waiting steps with minimization
	if (currentStep?.type === 'waiting') {
		if (waitingModalMinimized) {
			return (
				<MinimizedWaitingModal $visible={true}>
					<MinimizedWaitingContent>
						<MinimizedWaitingText>
							<strong>
								Waiting for you to{' '}
								{currentStep.title
									.toLowerCase()
									.replace('go ahead and ', '')
									.replace('!', '')}
								...
							</strong>
						</MinimizedWaitingText>
						<MinimizedWaitingActions>
							<HelpButton onClick={restoreWaitingModal}>Help</HelpButton>
							<SkipButton
								onClick={skipOnboarding}
								style={{ padding: '4px 8px', fontSize: '12px' }}>
								Skip
							</SkipButton>
						</MinimizedWaitingActions>
					</MinimizedWaitingContent>
				</MinimizedWaitingModal>
			);
		} else {
			// Full waiting modal with minimize option
			return (
				<OnboardingOverlay>
					<OnboardingModal>
						<OnboardingHeader>
							<h1>Guided Setup</h1>
							<p>
								Step {currentStepIndex + 1} of {steps.length}
							</p>
						</OnboardingHeader>

						<StepIndicator>
							{steps.map((_, index) => (
								<StepDot
									key={index}
									active={index === currentStepIndex}
									completed={index < currentStepIndex}
								/>
							))}
						</StepIndicator>

						<StepContent>
							<h2>{currentStep.title}</h2>
							<p>{currentStep.description}</p>
							{currentStep.content}
						</StepContent>

						<ActionButtons>
							{currentStep.id === 'wait_task_creation' && tasks.length > 0 ? (
								<PrimaryButton onClick={advanceToNextStep}>
									Continue
								</PrimaryButton>
							) : currentStep.id === 'click_property_instruction' ? (
								<>
									<PrimaryButton onClick={minimizeWaitingModal}>
										Okay meet you there!
									</PrimaryButton>
									<SkipButton onClick={skipOnboarding}>Skip Tour</SkipButton>
								</>
							) : (
								<>
									<SkipButton onClick={minimizeWaitingModal}>
										Let me work - minimize this
									</SkipButton>
									<SkipButton onClick={skipOnboarding}>
										{currentStep.skipLabel || 'Skip Tour'}
									</SkipButton>
								</>
							)}
						</ActionButtons>
					</OnboardingModal>
				</OnboardingOverlay>
			);
		}
	}

	// Main instruction modal
	return (
		<OnboardingOverlay>
			<OnboardingModal>
				<OnboardingHeader>
					<h1>Guided Setup</h1>
					<p>
						Step {currentStepIndex + 1} of {steps.length}
					</p>
				</OnboardingHeader>

				<StepIndicator>
					{steps.map((_, index) => (
						<StepDot
							key={index}
							active={index === currentStepIndex}
							completed={index < currentStepIndex}
						/>
					))}
				</StepIndicator>

				<StepContent>
					<h2>{currentStep.title}</h2>
					<p>{currentStep.description}</p>
					{currentStep.content}
				</StepContent>

				<ActionButtons>
					{currentStep.actionLabel && (
						<PrimaryButton onClick={currentStep.action}>
							{currentStep.actionLabel}
							<span style={{ marginLeft: '8px' }}>→</span>
						</PrimaryButton>
					)}
					<SkipButton onClick={skipOnboarding}>
						{currentStep.skipLabel || 'Skip Tour'}
					</SkipButton>
				</ActionButtons>
			</OnboardingModal>
		</OnboardingOverlay>
	);
};
