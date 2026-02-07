import React from 'react';
import {
	MissionSection,
	MissionTitle,
	MissionContent,
	MissionCard,
	MissionCardIcon,
	MissionCardTitle,
	MissionCardDescription,
} from '../LandingPage.styles';

const MissionSectionComponent = () => {
	return (
		<MissionSection id='Mission'>
			<MissionTitle>Property Management, Simplified</MissionTitle>
			<MissionContent>
				<MissionCard>
					<MissionCardIcon>🏠</MissionCardIcon>
					<MissionCardTitle>Complete Property Oversight</MissionCardTitle>
					<MissionCardDescription>
						Manage multiple properties, units, and tenants from one intuitive
						dashboard. Track everything from maintenance to tenant
						communications.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon>👥</MissionCardIcon>
					<MissionCardTitle>Team Collaboration</MissionCardTitle>
					<MissionCardDescription>
						Invite contractors, tenants, and team members. Assign roles and
						permissions. Keep everyone coordinated on property tasks.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon>📊</MissionCardIcon>
					<MissionCardTitle>Smart Task Management</MissionCardTitle>
					<MissionCardDescription>
						Automated task tracking with priority levels, due dates, and status
						updates. Never miss maintenance or follow-ups again.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon>📱</MissionCardIcon>
					<MissionCardTitle>Mobile-First Design</MissionCardTitle>
					<MissionCardDescription>
						Access your properties anywhere with our native mobile app. Get push
						notifications and manage tasks on the go.
					</MissionCardDescription>
				</MissionCard>
			</MissionContent>
		</MissionSection>
	);
};

export default MissionSectionComponent;
