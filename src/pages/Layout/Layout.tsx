import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import { SideNav, MobileNav, TopNav } from '../../Components/Library/Navbar';
import { DataLoader } from '../../Components/DataLoader';
import { OnboardingFlow } from '../../Components/OnboardingFlow';
import { Wrapper, Main, Sidebar, Content } from './Layout.styles';
import { Outlet } from 'react-router-dom';
import {
	useGetPropertiesQuery,
	useUpdateUserMutation,
} from '../../Redux/API/apiSlice';

export const Layout = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
	const [updateUser] = useUpdateUserMutation();

	// Fetch properties to check if user has any
	const { data: ownedProperties = [] } = useGetPropertiesQuery();

	useEffect(() => {
		if (currentUser) {
			const userDocumentCompleted = currentUser.onboardingCompleted;

			// User has completed onboarding if either localStorage or user document indicates completion
			const hasCompletedOnboarding = userDocumentCompleted === true;
			console.info('Checking onboarding status for user', {
				userId: currentUser.id,
				userDocumentCompleted,
				hasCompletedOnboarding,
			});

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
			} catch (error) {
				console.error('Failed to update onboarding status in database:', error);
			}
		}
		setShowOnboarding(false);
	};

	return (
		<>
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
