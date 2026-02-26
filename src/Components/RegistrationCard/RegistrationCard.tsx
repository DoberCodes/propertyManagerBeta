import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
	Input,
	Wrapper,
	Submit,
	Title,
	BackButton,
	RegisterWrapper,
	ErrorMessage,
	LoadingSpinner,
	PasswordInputWrapper,
	PasswordToggleButton,
	SectionLabel,
	QuestionLabel,
	RadioGrid,
	RadioOption,
	ButtonGroup,
	PasswordMatchText,
	TenantPlanCard,
	TenantPlanTitle,
	TenantPlanPrice,
	TenantPlanNote,
	EmailStatusText,
	TrialNotice,
} from './RegistrationCard.styles';
import { faArrowCircleLeft } from '@fortawesome/free-solid-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { signUpWithEmail, checkEmailExists } from '../../services/authService';
import { USER_ROLES } from '../../constants/roles';
import { useNavigate } from 'react-router-dom';
import { setCurrentUser } from '../../Redux/Slices/userSlice';
import { PaywallPage } from '../../pages/PaywallPage/PaywallPage';
import DocumentViewer from '../DocumentViewer';
import { TRIAL_DURATION_DAYS } from '../../constants/subscriptions';
import { LEGAL_AGREEMENT_VERSION } from '../../constants/legal';

// Map user type selection to appropriate role
const getRoleFromUserType = (userType: string): string => {
	const roleMapping: { [key: string]: string } = {
		homeowner: USER_ROLES.ADMIN, // Homeowners are admins of their properties
		propertyManager: USER_ROLES.PROPERTY_MANAGER,
		tenant: USER_ROLES.TENANT,
		propertyGuest: USER_ROLES.PROPERTY_GUEST,
	};
	return roleMapping[userType] || USER_ROLES.ADMIN; // Default to admin
};

export const RegistrationCard = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const [step, setStep] = useState<number>(1);
	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [emailChecking, setEmailChecking] = useState<boolean>(false);
	const [emailExists, setEmailExists] = useState<boolean>(false);
	const [password, setPassword] = useState<string>('');
	const [passwordConfirm, setPasswordConfirm] = useState<string>('');
	const [phoneNumber, setPhoneNumber] = useState<string>('');
	const [address, setAddress] = useState<string>('');
	const [confirmed, setConfirmed] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [showPasswordConfirm, setShowPasswordConfirm] =
		useState<boolean>(false);
	const [userType, setUserType] = useState<string>('');
	const [selectedPlan, setSelectedPlan] = useState<string>('');
	const [promoCode, setPromoCode] = useState<string>('');
	const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
	const [selectedDocument, setSelectedDocument] = useState<{
		name: string;
		title: string;
	} | null>(null);

	const handleViewDocument = (filename: string, title: string) => {
		setSelectedDocument({ name: filename, title });
	};

	const handleCloseDocumentViewer = () => {
		setSelectedDocument(null);
	};

	const handleEmailBlur = async () => {
		if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return;
		}
		setEmailChecking(true);
		setEmailExists(false);
		try {
			const exists = await checkEmailExists(email.trim());
			setEmailExists(exists);
		} catch (error) {
			console.error('Error checking email existence:', error);
		} finally {
			setEmailChecking(false);
		}
	};

	const validateStep1 = () => {
		if (!firstName.trim()) {
			setError('Please enter your first name');
			return false;
		}
		if (!lastName.trim()) {
			setError('Please enter your last name');
			return false;
		}
		if (!userType) {
			setError(
				'Please select if you are registering as a homeowner or property manager',
			);
			return false;
		}
		if (!['homeowner', 'propertyManager'].includes(userType)) {
			setError('Invalid user type selected');
			return false;
		}
		return true;
	};

	const validateStep2 = () => {
		if (!email.trim()) {
			setError('Please enter your email address');
			return false;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError('Please enter a valid email address');
			return false;
		}
		if (emailExists) {
			setError(
				'This email is already registered. Please use a different email or sign in instead.',
			);
			return false;
		}
		if (password.length < 8) {
			setError('Password must be at least 8 characters long');
			return false;
		}
		if (!confirmed) {
			setError('Passwords do not match');
			return false;
		}
		if (!agreedToTerms) {
			setError(
				'You must agree to the Terms of Service, Privacy Policy, and Maintenance Disclaimer to continue',
			);
			return false;
		}
		return true;
	};

	const validateStep3 = () => {
		console.log(
			`[VAL-STEP3] userType="${userType}", selectedPlan="${selectedPlan}", promoCode="${promoCode}"`,
		);
		if (userType === 'tenant') {
			if (!promoCode.trim()) {
				console.log('[VAL-STEP3] Tenant needs promo code');
				setError('Tenant promo code is required');
				return false;
			}
			return true;
		}
		// Plan selection is handled by the embedded paywall
		// User must select a plan to proceed
		if (!selectedPlan) {
			console.log('[VAL-STEP3] No plan selected, setting error');
			setError('Please select a subscription plan');
			return false;
		}
		console.log('[VAL-STEP3] Validation passed');
		return true;
	};

	const handleNext = () => {
		setError('');
		console.log(
			`[RegistrationCard] handleNext called, step=${step}, selectedPlan="${selectedPlan}"`,
		);
		if (step === 1 && validateStep1()) {
			console.log('[RegistrationCard] Step 1 validated, moving to step 2');
			setStep(2);
		} else if (step === 2 && validateStep2()) {
			console.log('[RegistrationCard] Step 2 validated, moving to step 3');
			setStep(3);
		} else if (step === 3 && validateStep3()) {
			console.log('[RegistrationCard] Step 3 validated, moving to step 4');
			setStep(4);
		} else {
			console.log(
				`[RegistrationCard] Validation failed or wrong step. step=${step}`,
			);
		}
	};

	const handleBack = () => {
		setError('');
		if (step > 1) {
			setStep(step - 1);
		}
	};

	const signup = async () => {
		setError('');
		setLoading(true);

		try {
			// Map userType to appropriate role
			const userRole = getRoleFromUserType(userType);

			// Register with Firebase - use mapped role, trim values
			const user = await signUpWithEmail(
				email.trim(),
				password.trim(),
				firstName.trim(),
				lastName.trim(),
				userRole,
				selectedPlan,
				promoCode.trim() || undefined,
				{
					agreedToTerms: true,
					agreedVersion: LEGAL_AGREEMENT_VERSION,
				},
			);

			// Store session in localStorage
			localStorage.setItem(
				'loggedUser',
				JSON.stringify({
					token: `firebase-token-${user.id}`,
					user,
				}),
			);

			// Update Redux store to mark user as logged in
			dispatch(setCurrentUser(user));

			setLoading(false);
			navigate('/dashboard');
		} catch (error: any) {
			console.error('RegistrationCard: Registration error', error);
			setError(error.message || 'Registration failed. Please try again.');
			setLoading(false);
		}
	};

	useEffect(() => {
		if (password === passwordConfirm) {
			setConfirmed(true);
		} else {
			setConfirmed(false);
		}
	}, [password, passwordConfirm]);

	return (
		<Wrapper
			$wide={step === 3 && userType !== 'tenant'}
			onSubmit={(e) => e.preventDefault()}>
			<BackButton href='#/login'>
				<FontAwesomeIcon icon={faArrowCircleLeft} />
			</BackButton>
			<Title>
				{step === 1 && 'Create Account - Step 1 of 4'}
				{step === 2 && 'Create Account - Step 2 of 4'}
				{step === 3 && 'Create Account - Step 3 of 4'}
				{step === 4 && 'Create Account - Step 4 of 4'}
			</Title>
			<TrialNotice>
				Start with a {TRIAL_DURATION_DAYS}-day free trial on any paid plan.
			</TrialNotice>
			{error && <ErrorMessage>{error}</ErrorMessage>}

			{/* Step 1: Basic Information */}
			{step === 1 && (
				<>
					<SectionLabel>Let's start with your name</SectionLabel>
					<Input
						placeholder='First Name *'
						type='text'
						autoComplete='given-name'
						value={firstName}
						onChange={(event) => {
							setFirstName(event.target.value);
							setError('');
						}}
						required
					/>
					<Input
						placeholder='Last Name *'
						type='text'
						autoComplete='family-name'
						value={lastName}
						onChange={(event) => {
							setLastName(event.target.value);
							setError('');
						}}
						required
					/>
					<QuestionLabel>
						Are you registering as a homeowner or property manager?
					</QuestionLabel>
					<RadioGrid>
						<RadioOption>
							<input
								type='radio'
								name='userType'
								value='homeowner'
								checked={userType === 'homeowner'}
								onChange={() => {
									setUserType('homeowner');
									setError('');
								}}
								required
							/>
							Homeowner
						</RadioOption>
						<RadioOption>
							<input
								type='radio'
								name='userType'
								value='propertyManager'
								checked={userType === 'propertyManager'}
								onChange={() => {
									setUserType('propertyManager');
									setError('');
								}}
								required
							/>
							Property Manager
						</RadioOption>
						{/* <RadioOption>
							<input
								type='radio'
								name='userType'
								value='tenant'
								checked={userType === 'tenant'}
								onChange={() => {
									setUserType('tenant');
									setPromoCode('');
									setError('');
								}}
								required
							/>
							Tenant
						</RadioOption>
						<RadioOption>
							<input
								type='radio'
								name='userType'
								value='propertyGuest'
								checked={userType === 'propertyGuest'}
								onChange={() => {
									setUserType('propertyGuest');
									setPromoCode('');
									setError('');
								}}
								required
							/>
							Property Guest
						</RadioOption> */}
					</RadioGrid>
					<Submit type='button' onClick={handleNext}>
						Next
					</Submit>
				</>
			)}

			{/* Step 2: Account Credentials & Legal Agreement */}
			{step === 2 && (
				<>
					<SectionLabel>Create your login credentials</SectionLabel>
					<Input
						placeholder='Email Address *'
						type='email'
						autoComplete='email'
						value={email}
						onChange={(event) => {
							setEmail(event.target.value);
							setError('');
							setEmailExists(false);
						}}
						onBlur={handleEmailBlur}
						required
					/>
					{emailChecking && (
						<EmailStatusText>Checking email availability...</EmailStatusText>
					)}
					{!emailChecking && emailExists && email.trim() && (
						<EmailStatusText error>
							This email is already registered. Please use a different email or
							sign in instead.
						</EmailStatusText>
					)}
					<PasswordInputWrapper>
						<Input
							placeholder='Password (min 8 characters) *'
							type={showPassword ? 'text' : 'password'}
							autoComplete='new-password'
							value={password}
							onChange={(event) => {
								setPassword(event.target.value);
								setError('');
							}}
							required
						/>
						<PasswordToggleButton
							type='button'
							tabIndex={-1}
							onClick={(e) => {
								e.preventDefault();
								setShowPassword(!showPassword);
							}}
							title={showPassword ? 'Hide password' : 'Show password'}>
							<FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
						</PasswordToggleButton>
					</PasswordInputWrapper>
					<PasswordInputWrapper>
						<Input
							placeholder='Confirm Password *'
							type={showPasswordConfirm ? 'text' : 'password'}
							autoComplete='new-password'
							value={passwordConfirm}
							onChange={(event) => {
								setPasswordConfirm(event.target.value);
								setError('');
							}}
							required
						/>
						<PasswordToggleButton
							type='button'
							tabIndex={-1}
							onClick={(e) => {
								e.preventDefault();
								setShowPasswordConfirm(!showPasswordConfirm);
							}}
							title={showPasswordConfirm ? 'Hide password' : 'Show password'}>
							<FontAwesomeIcon
								icon={showPasswordConfirm ? faEyeSlash : faEye}
							/>
						</PasswordToggleButton>
					</PasswordInputWrapper>
					{password && passwordConfirm && (
						<PasswordMatchText matched={confirmed}>
							{confirmed ? '✓ Passwords match' : '✗ Passwords do not match'}
						</PasswordMatchText>
					)}
					<div style={{ marginTop: '16px', marginBottom: '16px' }}>
						<label
							style={{
								display: 'flex',
								alignItems: 'flex-start',
								gap: '8px',
								fontSize: '14px',
								lineHeight: '1.4',
							}}>
							<input
								type='checkbox'
								checked={agreedToTerms}
								onChange={(e) => {
									setAgreedToTerms(e.target.checked);
									setError('');
								}}
								style={{ marginTop: '2px', flexShrink: 0 }}
								required
							/>
							<span>
								I agree to the{' '}
								<button
									type='button'
									style={{
										color: '#10b981',
										textDecoration: 'none',
										cursor: 'pointer',
										background: 'none',
										border: 'none',
										padding: 0,
										font: 'inherit',
									}}
									onClick={() =>
										handleViewDocument('terms-of-service', 'Terms of Service')
									}>
									Terms of Service
								</button>
								,{' '}
								<button
									type='button'
									style={{
										color: '#10b981',
										textDecoration: 'none',
										cursor: 'pointer',
										background: 'none',
										border: 'none',
										padding: 0,
										font: 'inherit',
									}}
									onClick={() =>
										handleViewDocument('privacy-policy', 'Privacy Policy')
									}>
									Privacy Policy
								</button>
								, and{' '}
								<button
									type='button'
									style={{
										color: '#10b981',
										textDecoration: 'none',
										cursor: 'pointer',
										background: 'none',
										border: 'none',
										padding: 0,
										font: 'inherit',
									}}
									onClick={() =>
										handleViewDocument(
											'maintenance-disclaimer',
											'Maintenance Disclaimer',
										)
									}>
									Maintenance Disclaimer
								</button>
								*
							</span>
						</label>
					</div>
					<ButtonGroup>
						<Submit type='button' onClick={handleBack}>
							Back
						</Submit>
						<Submit type='button' onClick={handleNext}>
							Next
						</Submit>
					</ButtonGroup>
				</>
			)}

			{/* Step 3: Plan Selection with Paywall */}
			{step === 3 && userType !== 'tenant' && (
				<>
					<PaywallPage
						subscription={{
							status: 'trial',
							plan: '',
							currentPeriodStart: Math.floor(Date.now() / 1000),
							currentPeriodEnd:
								Math.floor(Date.now() / 1000) +
								TRIAL_DURATION_DAYS * 24 * 60 * 60,
							trialEndsAt:
								Math.floor(Date.now() / 1000) +
								TRIAL_DURATION_DAYS * 24 * 60 * 60,
						}}
						currentPlan={selectedPlan}
						variant='embedded'
						selectionOnly={true}
						wide={true}
						onPlanSelect={(planId) => {
							setSelectedPlan(planId);
							setError('');
						}}
						onPromoCodeApplied={(appliedPromoCode) => {
							setPromoCode(appliedPromoCode);
							setError('');
						}}
					/>
					<ButtonGroup>
						<Submit type='button' onClick={handleBack}>
							Back
						</Submit>
						<Submit type='button' onClick={handleNext}>
							Continue
						</Submit>
					</ButtonGroup>
				</>
			)}

			{/* Step 3: Tenant Plan + Promo Code */}
			{step === 3 && userType === 'tenant' && (
				<>
					<SectionLabel>Tenant plan</SectionLabel>
					<TenantPlanCard>
						<TenantPlanTitle>Tenant Free</TenantPlanTitle>
						<TenantPlanPrice>$0</TenantPlanPrice>
						<TenantPlanNote>
							Free tenant access with a one-time promo code from your property
							manager.
						</TenantPlanNote>
					</TenantPlanCard>
					<SectionLabel>Promo code</SectionLabel>
					<Input
						placeholder='Enter your promo code *'
						type='text'
						autoComplete='off'
						value={promoCode}
						onChange={(event) => {
							setPromoCode(event.target.value);
							setError('');
						}}
						required
					/>
					<ButtonGroup>
						<Submit type='button' onClick={handleBack}>
							Back
						</Submit>
						<Submit type='button' onClick={handleNext}>
							Next
						</Submit>
					</ButtonGroup>
				</>
			)}

			{/* Step 4: Additional Information (Optional) */}
			{step === 4 && (
				<>
					<SectionLabel>Additional information (optional)</SectionLabel>
					<Input
						placeholder='Phone Number (optional)'
						type='tel'
						autoComplete='tel'
						value={phoneNumber}
						onChange={(event) => setPhoneNumber(event.target.value)}
					/>
					<Input
						placeholder='Address (optional)'
						type='text'
						autoComplete='street-address'
						value={address}
						onChange={(event) => setAddress(event.target.value)}
					/>
					<ButtonGroup>
						<Submit type='button' onClick={handleBack} disabled={loading}>
							Back
						</Submit>
						<Submit
							type='button'
							onClick={signup}
							disabled={loading}
							style={{ backgroundColor: '#22c55e', color: 'white' }}>
							{loading && <LoadingSpinner />}
							{loading ? 'Creating account...' : 'Create Account'}
						</Submit>
					</ButtonGroup>
				</>
			)}

			<RegisterWrapper>
				<p>
					Already have an account? <a href='#/login'>Login here</a>
				</p>
			</RegisterWrapper>

			<DocumentViewer
				documentName={selectedDocument?.name || ''}
				title={selectedDocument?.title || ''}
				isOpen={!!selectedDocument}
				onClose={handleCloseDocumentViewer}
			/>
		</Wrapper>
	);
};
