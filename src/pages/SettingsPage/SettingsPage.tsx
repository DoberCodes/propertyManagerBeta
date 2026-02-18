import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from 'Redux/store/store';
import {
	getSubscriptionPlanDetails,
	isTrialActive,
	getTrialDaysRemaining,
	isTrialExpired,
} from 'utils/subscriptionUtils';
import {
	GenericModal,
	FormGroup,
	FormLabel,
	FormInput,
} from 'Components/Library';
import { FeedbackForm } from 'Components/FeedbackForm';
import { ExpiredTrialBanner } from 'Components/ExpiredTrialBanner/ExpiredTrialBanner';
import { cancelSubscription } from 'services/stripeService';
import {
	updatePassword,
	reauthenticateWithCredential,
	EmailAuthProvider,
	signOut,
} from 'firebase/auth';
import { auth } from 'config/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from 'config/firebase';
import { useUpdateUserMutation } from 'Redux/API/userSlice';
import { setCurrentUser } from 'Redux/Slices/userSlice';
import {
	addFamilyMember,
	removeFamilyMember,
	getFamilyMembers,
} from 'services/authService';
import { NotificationPreferences } from 'Components/NotificationPreferences';

const Container = styled.div`
	max-width: 100%;
	margin: 40px auto;
	padding: 32px;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
`;

const Title = styled.h2`
	font-size: 2rem;
	margin-bottom: 24px;
`;

const SubscriptionSection = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 24px;
	margin-bottom: 24px;
	background: #f9fafb;
`;

const SubscriptionHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
`;

const PlanName = styled.h3`
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0;
	color: #1f2937;
`;

const PlanStatus = styled.span<{ status: string }>`
	padding: 4px 12px;
	border-radius: 20px;
	font-size: 0.875rem;
	font-weight: 500;
	text-transform: uppercase;
	${({ status }) => {
		switch (status) {
			case 'trial':
				return `
						background: #fef3c7;
						color: #d97706;
					`;
			case 'active':
				return `
						background: #d1fae5;
						color: #065f46;
					`;
			case 'cancelled':
				return `
						background: #fee2e2;
						color: #dc2626;
					`;
			default:
				return `
						background: #e5e7eb;
						color: #6b7280;
					`;
		}
	}}
`;

const PlanDetails = styled.div`
	margin-bottom: 16px;
`;

const PlanPrice = styled.p`
	font-size: 1.125rem;
	font-weight: 600;
	color: #059669;
	margin: 8px 0;
`;

const PlanFeatures = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
`;

const PlanFeature = styled.li`
	font-size: 0.875rem;
	color: #6b7280;
	margin-bottom: 4px;
	&::before {
		content: '✓';
		color: #059669;
		margin-right: 8px;
	}
`;

const TrialInfo = styled.div`
	background: #fef3c7;
	border: 1px solid #f59e0b;
	border-radius: 6px;
	padding: 12px;
	margin-bottom: 16px;
`;

const TrialText = styled.p`
	margin: 0;
	color: #92400e;
	font-size: 0.875rem;
`;

const LinkButton = styled.button`
	display: inline-block;
	margin: 16px 0;
	padding: 12px 24px;
	background: #6366f1;
	color: #fff;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	transition: background 0.2s;
	border: none;
	cursor: pointer;
	&:hover {
		background: #4f46e5;
	}
`;

const UpgradeButton = styled(LinkButton)`
	background: #059669;
	&:hover {
		background: #047857;
	}
`;

const ButtonContainer = styled.div`
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
	margin-top: 16px;
`;

const CancelButton = styled(LinkButton)`
	background: #dc2626;
	&:hover {
		background: #b91c1c;
	}
`;

const AccountSection = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 24px;
	margin-bottom: 24px;
	background: #f9fafb;
`;

const SectionTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 16px 0;
	color: #1f2937;
`;

const AccountActions = styled.div`
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
`;

const AccountButton = styled.button<{ disabled?: boolean }>`
	padding: 12px 24px;
	background: #6366f1;
	color: #fff;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	transition: background 0.2s;
	border: none;
	cursor: pointer;

	&:hover {
		background: #4f46e5;
	}

	&:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		opacity: 0.6;

		&:hover {
			background: #9ca3af;
		}
	}
`;

const DeleteAccountButton = styled(AccountButton)`
	background: #dc2626;
	&:hover:not(:disabled) {
		background: #b91c1c;
	}
	&:disabled {
		background: #9ca3af;
	}
`;

const ErrorMessage = styled.div`
	background-color: #fee2e2;
	color: #dc2626;
	padding: 12px 16px;
	border-radius: 6px;
	margin-bottom: 16px;
	font-size: 14px;
	border-left: 4px solid #dc2626;
`;

const SuccessMessage = styled.div`
	background-color: #d1fae5;
	color: #065f46;
	padding: 12px 16px;
	border-radius: 6px;
	margin-bottom: 16px;
	font-size: 14px;
	border-left: 4px solid #065f46;
`;

const PasswordHelp = styled.div`
	font-size: 12px;
	color: #6b7280;
	margin-top: 8px;
	font-style: italic;
`;

export const SettingsPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [showFeedbackModal, setShowFeedbackModal] = useState(false);
	const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
	const [isRestartingOnboarding, setIsRestartingOnboarding] = useState(false);
	const [updateUser] = useUpdateUserMutation();
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [passwordError, setPasswordError] = useState('');
	const [passwordSuccess, setPasswordSuccess] = useState('');
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [isDeletingAccount, setIsDeletingAccount] = useState(false);
	const [deleteAccountError, setDeleteAccountError] = useState('');
	const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] =
		useState(false);
	const [isCancellingSubscription, setIsCancellingSubscription] =
		useState(false);
	const [cancelSubscriptionError, setCancelSubscriptionError] = useState('');
	const [subscriptionError, setSubscriptionError] = useState(false);
	const [familyMembers, setFamilyMembers] = useState<any[]>([]);
	const [showAddFamilyMemberModal, setShowAddFamilyMemberModal] =
		useState(false);
	const [isLoadingFamilyMembers, setIsLoadingFamilyMembers] = useState(false);
	const [familyMemberForm, setFamilyMemberForm] = useState({
		firstName: '',
		lastName: '',
		email: '',
	});
	const [isAddingFamilyMember, setIsAddingFamilyMember] = useState(false);
	const [addFamilyMemberError, setAddFamilyMemberError] = useState('');

	// Load family members
	useEffect(() => {
		const loadFamilyMembers = async () => {
			if (currentUser?.accountId) {
				setIsLoadingFamilyMembers(true);
				try {
					const members = await getFamilyMembers(currentUser.accountId);
					setFamilyMembers(members);
				} catch (error) {
					console.error('Failed to load family members:', error);
				} finally {
					setIsLoadingFamilyMembers(false);
				}
			}
		};

		loadFamilyMembers();
	}, [currentUser?.accountId]);

	if (!currentUser?.subscription) {
		return (
			<Container>
				<Title>Settings</Title>
				<p>Loading subscription information...</p>
			</Container>
		);
	}

	const subscription = currentUser.subscription;
	const planDetails = getSubscriptionPlanDetails(subscription.plan);
	const isOnTrial = isTrialActive(subscription);
	const trialDaysRemaining = getTrialDaysRemaining(subscription);

	const handleAddFamilyMember = async () => {
		if (
			!currentUser?.accountId ||
			(!currentUser?.isAccountOwner &&
				currentUser?.accountId !== currentUser?.id)
		) {
			setAddFamilyMemberError('Only account owners can add family members');
			return;
		}

		if (
			!familyMemberForm.firstName.trim() ||
			!familyMemberForm.lastName.trim() ||
			!familyMemberForm.email.trim()
		) {
			setAddFamilyMemberError('Please fill in all fields');
			return;
		}

		setIsAddingFamilyMember(true);
		setAddFamilyMemberError('');

		try {
			await addFamilyMember(
				currentUser.accountId,
				familyMemberForm.email.trim(),
				familyMemberForm.firstName.trim(),
				familyMemberForm.lastName.trim(),
			);

			// Reload family members
			const members = await getFamilyMembers(currentUser.accountId);
			setFamilyMembers(members);

			// Reset form and close modal
			setFamilyMemberForm({ firstName: '', lastName: '', email: '' });
			setShowAddFamilyMemberModal(false);
		} catch (error: any) {
			setAddFamilyMemberError(error.message || 'Failed to add family member');
		} finally {
			setIsAddingFamilyMember(false);
		}
	};

	const handleRemoveFamilyMember = async (memberId: string) => {
		if (
			!currentUser?.accountId ||
			(!currentUser?.isAccountOwner &&
				currentUser?.accountId !== currentUser?.id)
		) {
			return;
		}

		// Find the member being removed to get their name
		const memberToRemove = familyMembers.find((m) => m.id === memberId);
		const memberName =
			memberToRemove?.displayName || memberToRemove?.email || 'Family Member';

		if (
			!window.confirm(
				`⚠️ WARNING: You are about to remove "${memberName}" from the family account.\n\nThis will:\n• Delete their account\n• Remove their access to the shared subscription\n\nTheir name will be preserved on all tasks and history.\n\nAre you sure you want to proceed?`,
			)
		) {
			return;
		}

		try {
			await removeFamilyMember(currentUser.accountId, memberId, currentUser.id);

			// Reload family members
			const members = await getFamilyMembers(currentUser.accountId);
			setFamilyMembers(members);
		} catch (error: any) {
			console.error('Failed to remove family member:', error);
			alert('Failed to remove family member. Please try again.');
		}
	};

	const handleRestartOnboarding = async () => {
		if (!currentUser) return;

		setIsRestartingOnboarding(true);
		try {
			// Reset onboarding completion flag in Firestore
			await updateUser({
				id: currentUser.id,
				updates: { onboardingCompleted: false },
			}).unwrap();

			// Update local Redux state immediately
			dispatch(
				setCurrentUser({
					...currentUser,
					onboardingCompleted: false,
				}),
			);

			// Navigate back to dashboard so the onboarding modal shows
			navigate('/dashboard');
		} catch (error) {
			console.error('Failed to restart onboarding:', error);
		} finally {
			setIsRestartingOnboarding(false);
		}
	};

	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault();
		setPasswordError('');
		setPasswordSuccess('');

		// Validation
		if (!passwordForm.currentPassword) {
			setPasswordError('Current password is required');
			return;
		}
		if (!passwordForm.newPassword) {
			setPasswordError('New password is required');
			return;
		}
		if (passwordForm.newPassword.length < 6) {
			setPasswordError('New password must be at least 6 characters');
			return;
		}
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			setPasswordError('New passwords do not match');
			return;
		}

		setIsChangingPassword(true);

		try {
			const user = auth.currentUser;
			if (!user || !user.email) {
				setPasswordError('User not authenticated');
				return;
			}

			// Reauthenticate user with current password
			const credential = EmailAuthProvider.credential(
				user.email,
				passwordForm.currentPassword,
			);
			await reauthenticateWithCredential(user, credential);

			// Update password
			await updatePassword(user, passwordForm.newPassword);

			setPasswordSuccess('Password updated successfully!');
			setPasswordForm({
				currentPassword: '',
				newPassword: '',
				confirmPassword: '',
			});
			setTimeout(() => {
				setShowPasswordModal(false);
				setPasswordSuccess('');
			}, 2000);
		} catch (error: any) {
			console.error('Password change error:', error);
			if (error.code === 'auth/wrong-password') {
				setPasswordError('Current password is incorrect');
			} else if (error.code === 'auth/weak-password') {
				setPasswordError('New password is too weak');
			} else if (error.code === 'auth/requires-recent-login') {
				setPasswordError(
					'Please log out and log back in before changing your password',
				);
			} else {
				setPasswordError('Failed to update password. Please try again.');
			}
		} finally {
			setIsChangingPassword(false);
		}
	};

	const handleCancelSubscription = async () => {
		if (!currentUser?.subscription?.stripeSubscriptionId) return;
		if (subscriptionError) {
			setSubscriptionError(false);
		}

		setIsCancellingSubscription(true);
		setCancelSubscriptionError('');

		try {
			await cancelSubscription(currentUser.subscription.stripeSubscriptionId);
			setShowCancelSubscriptionModal(false);
			// The webhook will update the user's subscription status
			window.location.reload(); // Refresh to show updated status
		} catch (error: any) {
			console.error('Cancel subscription error:', error);
			setCancelSubscriptionError(
				'Failed to cancel subscription. Please try again.',
			);
		} finally {
			setIsCancellingSubscription(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (!currentUser) return;

		setDeleteAccountError('');
		setIsDeletingAccount(true);

		try {
			const deleteUserAccount = httpsCallable(functions, 'deleteUserAccount');
			const result = await deleteUserAccount({ userId: currentUser.id });

			// Sign out the user
			await signOut(auth);

			// Redirect to login page
			navigate('/login');
		} catch (error: any) {
			console.error('Delete account error:', error);
			if (error.code === 'functions/permission-denied') {
				setDeleteAccountError('You can only delete your own account.');
			} else if (error.code === 'functions/failed-precondition') {
				setDeleteAccountError(
					'You cannot delete your account while you have an active subscription. Please cancel your subscription first.',
				);
			} else if (error.code === 'functions/internal') {
				setDeleteAccountError(
					'Failed to delete account. Please contact support.',
				);
			} else {
				setDeleteAccountError('An error occurred while deleting your account.');
			}
		} finally {
			setIsDeletingAccount(false);
		}
	};

	return (
		<Container>
			<Title>Settings</Title>
			{isTrialExpired(subscription) && (
				<ExpiredTrialBanner onUpgradeClick={() => navigate('/paywall')} />
			)}
			{subscriptionError && (
				<ErrorMessage style={{ marginBottom: '16px' }}>
					You must cancel your active subscription before deleting your account.
				</ErrorMessage>
			)}

			<SubscriptionSection>
				<SubscriptionHeader>
					<PlanName>{planDetails?.name || 'Unknown Plan'}</PlanName>
					<PlanStatus status={subscription.status}>
						{subscription.status}
					</PlanStatus>
				</SubscriptionHeader>

				{isOnTrial && (
					<TrialInfo>
						<TrialText>
							{trialDaysRemaining === -1
								? '🎉 You have unlimited access with your promo code'
								: `🎉 You have ${trialDaysRemaining} days left in your free trial`}
						</TrialText>
					</TrialInfo>
				)}

				<PlanDetails>
					<PlanPrice>${planDetails?.priceMonthly || 0}/month</PlanPrice>
					<PlanFeatures>
						{planDetails?.features.map((feature, index) => (
							<PlanFeature key={index}>{feature}</PlanFeature>
						))}
					</PlanFeatures>
				</PlanDetails>

				<ButtonContainer>
					<UpgradeButton onClick={() => navigate('/paywall')}>
						{subscription.plan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
					</UpgradeButton>
					{subscription.status === 'active' &&
						subscription.stripeSubscriptionId && (
							<CancelButton
								onClick={() => setShowCancelSubscriptionModal(true)}>
								Cancel Subscription
							</CancelButton>
						)}
				</ButtonContainer>
			</SubscriptionSection>

			{/* Family Members Section */}
			{(currentUser?.isAccountOwner ||
				currentUser?.accountId === currentUser?.id) && (
				<>
					<AccountSection>
						<SectionTitle>Family Members</SectionTitle>
						<p style={{ marginBottom: '16px', color: '#6b7280' }}>
							Add family members to share your subscription. They get full
							access to all features without additional cost.
						</p>

						{familyMembers.length > 0 && (
							<div style={{ marginBottom: '16px' }}>
								<h4
									style={{
										marginBottom: '8px',
										fontSize: '14px',
										fontWeight: '600',
										color: '#374151',
									}}>
									Current Family Members:
								</h4>
								{familyMembers
									.filter((member) => member.id !== currentUser.id)
									.map((member) => (
										<div
											key={member.id}
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												padding: '8px 12px',
												background: '#f9fafb',
												borderRadius: '6px',
												marginBottom: '8px',
											}}>
											<div>
												<span style={{ fontWeight: '500' }}>
													{member.firstName} {member.lastName}
												</span>
												<span style={{ color: '#6b7280', marginLeft: '8px' }}>
													{member.email}
												</span>
											</div>
											<button
												onClick={() => handleRemoveFamilyMember(member.id)}
												style={{
													background: '#ef4444',
													color: 'white',
													border: 'none',
													borderRadius: '4px',
													padding: '4px 8px',
													fontSize: '12px',
													cursor: 'pointer',
												}}>
												Remove
											</button>
										</div>
									))}
							</div>
						)}

						{familyMembers.length < 2 && (
							<AccountButton onClick={() => setShowAddFamilyMemberModal(true)}>
								Add Family Member
							</AccountButton>
						)}

						{familyMembers.length >= 2 && (
							<p
								style={{
									color: '#6b7280',
									fontSize: '14px',
									marginTop: '8px',
								}}>
								Family accounts are limited to 2 family members (plus the
								account owner).
							</p>
						)}
					</AccountSection>
				</>
			)}

			<AccountSection>
				<SectionTitle>Account Settings</SectionTitle>
				<AccountActions>
					<AccountButton onClick={() => navigate('/profile')}>
						Edit Profile
					</AccountButton>
					<AccountButton onClick={() => setShowPasswordModal(true)}>
						Change Password
					</AccountButton>
					<DeleteAccountButton
						disabled={
							subscription.status === 'active' ||
							subscription.status === 'past_due'
						}
						onClick={() => {
							// Allow deletion for trial and expired users
							// Require cancellation for active and past_due subscriptions
							if (
								subscription.status === 'active' ||
								subscription.status === 'past_due'
							) {
								setSubscriptionError(true);
							} else if (
								subscription.status === 'trial' ||
								subscription.status === 'expired'
							) {
								setShowDeleteAccountModal(true);
							} else {
								// For other statuses (like cancelled), allow deletion
								setShowDeleteAccountModal(true);
							}
						}}>
						Delete Account
					</DeleteAccountButton>
				</AccountActions>
			</AccountSection>

			<NotificationPreferences currentUser={currentUser} />

			<AccountSection>
				<SectionTitle>Getting Started</SectionTitle>
				<p style={{ marginBottom: '16px', color: '#6b7280' }}>
					Need a refresher on Maintley? Restart the guided tour to learn about
					key features and get the most out of the app.
				</p>
				<AccountButton
					disabled={isRestartingOnboarding}
					onClick={handleRestartOnboarding}>
					{isRestartingOnboarding ? 'Starting Tour...' : 'Start Guided Tour'}
				</AccountButton>
			</AccountSection>

			<AccountSection>
				<SectionTitle>Feedback & Support</SectionTitle>
				<p style={{ marginBottom: '16px', color: '#6b7280' }}>
					Help us improve Maintley by sharing your feedback, reporting bugs, or
					requesting new features.
				</p>
				<AccountButton onClick={() => setShowFeedbackModal(true)}>
					Submit Feedback
				</AccountButton>
			</AccountSection>

			<AccountSection>
				<SectionTitle>Help & Resources</SectionTitle>
				<p style={{ marginBottom: '16px', color: '#6b7280' }}>
					Learn about all the features available in Maintley and get help when
					you need it.
				</p>
				<AccountButton onClick={() => navigate('/features')}>
					View All Features
				</AccountButton>
			</AccountSection>

			<AccountSection>
				<SectionTitle>Legal</SectionTitle>
				<p style={{ marginBottom: '16px', color: '#6b7280' }}>
					Review our legal documents and terms of service.
				</p>
				<AccountButton onClick={() => navigate('/legal')}>
					View Legal Documents
				</AccountButton>
			</AccountSection>

			{/* Password Change Modal */}
			<GenericModal
				isOpen={showPasswordModal}
				title='Change Password'
				onClose={() => {
					setShowPasswordModal(false);
					setPasswordError('');
					setPasswordSuccess('');
					setPasswordForm({
						currentPassword: '',
						newPassword: '',
						confirmPassword: '',
					});
				}}
				primaryButtonLabel='Update Password'
				secondaryButtonLabel='Cancel'
				isLoading={isChangingPassword}
				onSubmit={handlePasswordChange}>
				{passwordError && <ErrorMessage>{passwordError}</ErrorMessage>}
				{passwordSuccess && <SuccessMessage>{passwordSuccess}</SuccessMessage>}

				<FormGroup>
					<FormLabel>Current Password</FormLabel>
					<FormInput
						type='password'
						value={passwordForm.currentPassword}
						onChange={(e) =>
							setPasswordForm({
								...passwordForm,
								currentPassword: e.target.value,
							})
						}
						placeholder='Enter your current password'
						required
					/>
				</FormGroup>

				<FormGroup>
					<FormLabel>New Password</FormLabel>
					<FormInput
						type='password'
						value={passwordForm.newPassword}
						onChange={(e) =>
							setPasswordForm({
								...passwordForm,
								newPassword: e.target.value,
							})
						}
						placeholder='Enter your new password'
						required
					/>
				</FormGroup>

				<FormGroup>
					<FormLabel>Confirm New Password</FormLabel>
					<FormInput
						type='password'
						value={passwordForm.confirmPassword}
						onChange={(e) =>
							setPasswordForm({
								...passwordForm,
								confirmPassword: e.target.value,
							})
						}
						placeholder='Confirm your new password'
						required
					/>
				</FormGroup>

				<PasswordHelp>
					Password must be at least 6 characters long.
				</PasswordHelp>
			</GenericModal>

			<GenericModal
				isOpen={showFeedbackModal}
				title='Submit Feedback'
				showActions={false}
				onClose={() => setShowFeedbackModal(false)}>
				<FeedbackForm onClose={() => setShowFeedbackModal(false)} />
			</GenericModal>

			{/* Delete Account Modal */}

			<GenericModal
				isOpen={showDeleteAccountModal}
				title='Delete Account'
				onClose={() => {
					setShowDeleteAccountModal(false);
					setDeleteAccountError('');
				}}
				primaryButtonLabel={
					deleteAccountError?.includes('active subscription')
						? 'Close'
						: 'Delete Account'
				}
				secondaryButtonLabel={
					deleteAccountError?.includes('active subscription')
						? undefined
						: 'Cancel'
				}
				isLoading={isDeletingAccount}
				showActions={true}
				onSubmit={
					deleteAccountError?.includes('active subscription')
						? () => setShowDeleteAccountModal(false)
						: handleDeleteAccount
				}>
				{deleteAccountError && (
					<ErrorMessage>{deleteAccountError}</ErrorMessage>
				)}

				{deleteAccountError?.includes('active subscription') ? (
					<div>
						<p style={{ marginBottom: '16px', color: '#6b7280' }}>
							To delete your account, you must first cancel your active
							subscription. This ensures proper billing closure and prevents any
							unexpected charges.
						</p>
						<p style={{ marginBottom: '16px', color: '#6b7280' }}>
							You can cancel your subscription in the{' '}
							<strong>Subscription Management</strong> section above.
						</p>
					</div>
				) : (
					<div>
						<p style={{ marginBottom: '16px', color: '#6b7280' }}>
							<strong>Warning:</strong> This action cannot be undone. If you are
							the original owner of any properties, all your properties and
							associated data will be permanently deleted. If you are a co-owner
							or shared user, you will lose access to shared properties but the
							properties themselves will remain.
						</p>
						<p style={{ marginBottom: '16px', color: '#6b7280' }}>
							Are you sure you want to delete your account?
						</p>
					</div>
				)}
			</GenericModal>

			{/* Cancel Subscription Modal */}
			<GenericModal
				isOpen={showCancelSubscriptionModal}
				title='Cancel Subscription'
				onClose={() => {
					setShowCancelSubscriptionModal(false);
					setCancelSubscriptionError('');
				}}
				primaryButtonLabel='Cancel Subscription'
				secondaryButtonLabel='Keep Subscription'
				isLoading={isCancellingSubscription}
				showActions={true}
				onSubmit={handleCancelSubscription}>
				{cancelSubscriptionError && (
					<ErrorMessage>{cancelSubscriptionError}</ErrorMessage>
				)}

				<p style={{ marginBottom: '16px', color: '#6b7280' }}>
					<strong>Important:</strong> Your subscription will remain active until
					the end of your current billing period. You will continue to have
					access to all features until then.
				</p>

				<p style={{ marginBottom: '16px', color: '#6b7280' }}>
					After cancellation, you can reactivate your subscription at any time
					from the paywall page.
				</p>

				<p style={{ marginBottom: '16px', color: '#dc2626' }}>
					Are you sure you want to cancel your subscription?
				</p>
			</GenericModal>

			{/* Add Family Member Modal */}
			<GenericModal
				isOpen={showAddFamilyMemberModal}
				onClose={() => {
					setShowAddFamilyMemberModal(false);
					setFamilyMemberForm({ firstName: '', lastName: '', email: '' });
					setAddFamilyMemberError('');
				}}
				title='Add Family Member'
				primaryButtonLabel={isAddingFamilyMember ? 'Adding...' : 'Add Member'}
				primaryButtonAction={handleAddFamilyMember}
				secondaryButtonLabel='Cancel'
				showActions={true}
				primaryButtonDisabled={isAddingFamilyMember}>
				<FormGroup>
					<FormLabel>First Name</FormLabel>
					<FormInput
						type='text'
						value={familyMemberForm.firstName}
						onChange={(e) =>
							setFamilyMemberForm((prev) => ({
								...prev,
								firstName: e.target.value,
							}))
						}
						placeholder='Enter first name'
					/>
				</FormGroup>

				<FormGroup>
					<FormLabel>Last Name</FormLabel>
					<FormInput
						type='text'
						value={familyMemberForm.lastName}
						onChange={(e) =>
							setFamilyMemberForm((prev) => ({
								...prev,
								lastName: e.target.value,
							}))
						}
						placeholder='Enter last name'
					/>
				</FormGroup>

				<FormGroup>
					<FormLabel>Email Address</FormLabel>
					<FormInput
						type='email'
						value={familyMemberForm.email}
						onChange={(e) =>
							setFamilyMemberForm((prev) => ({
								...prev,
								email: e.target.value,
							}))
						}
						placeholder='Enter email address'
					/>
				</FormGroup>

				{addFamilyMemberError && (
					<ErrorMessage style={{ marginTop: '16px' }}>
						{addFamilyMemberError}
					</ErrorMessage>
				)}

				<p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
					The family member will receive an email with instructions to set up
					their account and access the shared subscription.
				</p>
			</GenericModal>
		</Container>
	);
};
