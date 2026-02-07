import React from 'react';
import {
	FeaturesSection,
	FeaturesTitle,
	FeatureGrid,
	FeatureCard,
	FeatureIcon,
	FeatureTitle,
	FeatureDescription,
} from '../LandingPage.styles';

const FeaturesSectionComponent = () => {
	return (
		<FeaturesSection id='Features'>
			<FeaturesTitle>Powerful Property Management Tools</FeaturesTitle>
			<FeatureGrid>
				<FeatureCard>
					<FeatureIcon>📋</FeatureIcon>
					<FeatureTitle>Task Management & Tracking</FeatureTitle>
					<FeatureDescription>
						Create, assign, and track maintenance tasks with priority levels,
						due dates, and status updates. Automated overdue notifications.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon>🏢</FeatureIcon>
					<FeatureTitle>Multi-Property Support</FeatureTitle>
					<FeatureDescription>
						Manage multiple properties and units from one dashboard. Assign team
						members to specific properties with role-based permissions.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon>�</FeatureIcon>
					<FeatureTitle>Contractor Management</FeatureTitle>
					<FeatureDescription>
						Track and assign contractors and service providers to tasks for
						organized property maintenance. Keep all your service contacts in
						one place.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon>📊</FeatureIcon>
					<FeatureTitle>Efficiency Dashboard</FeatureTitle>
					<FeatureDescription>
						Visual analytics showing task completion rates, team performance,
						and property maintenance trends.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon>📸</FeatureIcon>
					<FeatureTitle>Photo Documentation</FeatureTitle>
					<FeatureDescription>
						Attach photos to maintenance requests and task completions. Build a
						visual history of property repairs and updates.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon>🔔</FeatureIcon>
					<FeatureTitle>Push Notifications</FeatureTitle>
					<FeatureDescription>
						Real-time notifications for new tasks, updates, and deadlines. Stay
						connected with your properties from anywhere.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon>💬</FeatureIcon>
					<FeatureTitle>Tenant Access & Maintenance Requests</FeatureTitle>
					<FeatureDescription>
						Give tenants secure access to submit maintenance requests directly
						through the app. Include notes, photos, and priority levels for
						efficient handling.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon>📱</FeatureIcon>
					<FeatureTitle>Native Mobile App</FeatureTitle>
					<FeatureDescription>
						Download our Android APK for the full mobile experience with push
						notifications and offline capabilities.
					</FeatureDescription>
				</FeatureCard>
			</FeatureGrid>
		</FeaturesSection>
	);
};

export default FeaturesSectionComponent;
