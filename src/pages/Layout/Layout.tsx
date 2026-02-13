import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../Redux/store/store';
import { SideNav, MobileNav, TopNav } from '../../Components/Library/Navbar';
import { DataLoader } from '../../Components/DataLoader';
import { OnboardingFlow } from '../../Components/OnboardingFlow';
import LegalAgreementNotification from '../../Components/Library/LegalAgreementNotification';
import { Wrapper, Main, Sidebar, Content } from './Layout.styles';
import { Outlet } from 'react-router-dom';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import { useUpdateUserMutation } from '../../Redux/API/userSlice';
import { setCurrentUser } from '../../Redux/Slices/userSlice';

export const Layout = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const dispatch = useDispatch<AppDispatch>();
	const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
	const [updateUser] = useUpdateUserMutation();

	// Fetch properties to check if user has any
	const { data: ownedProperties = [] } = useGetPropertiesQuery();

	useEffect(() => {
		if (currentUser) {
			const userDocumentCompleted = currentUser.onboardingCompleted;

			// User has completed onboarding if either localStorage or user document indicates completion
			const hasCompletedOnboarding = userDocumentCompleted === true;

			// For testing, also show if user has no onboarding completed flag at all
			const shouldShowOnboarding = !hasCompletedOnboarding; // Temporarily always show if not completed

			if (shouldShowOnboarding) {
				setShowOnboarding(true);
			}
		}
	}, [currentUser, ownedProperties.length]);

	const handleOnboardingComplete = async () => {
		if (currentUser) {
			// Update user document in Firestore
			try {
				await updateUser({
					id: currentUser.id,
					updates: { onboardingCompleted: true },
				}).unwrap();

				// Update local Redux state immediately
				dispatch(
					setCurrentUser({
						...currentUser,
						onboardingCompleted: true,
					}),
				);
			} catch (error) {
				console.error('Failed to update onboarding status in database:', error);
			}
		}
		setShowOnboarding(false);
	};

	const handleOnboardingSkip = async () => {
		if (currentUser) {
			// Update user document in Firestore
			try {
				await updateUser({
					id: currentUser.id,
					updates: { onboardingCompleted: true },
				}).unwrap();

				// Update local Redux state immediately
				dispatch(
					setCurrentUser({
						...currentUser,
						onboardingCompleted: true,
					}),
				);
			} catch (error) {
				console.error('Failed to update onboarding status in database:', error);
			}
		}
		setShowOnboarding(false);
	};

	return (
		<>
			<LegalAgreementNotification />
			{showOnboarding && (
				<OnboardingFlow
					onComplete={handleOnboardingComplete}
					onSkip={handleOnboardingSkip}
				/>
			)}
			<Wrapper>
				<DataLoader />
				<TopNav />
				<Main>
					<Sidebar>
						<SideNav />
					</Sidebar>
					<Content>
						<Outlet />
					</Content>
				</Main>
				<MobileNav />
			</Wrapper>
		</>
	);
};
