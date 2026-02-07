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
			<MissionTitle>
				Peace of Mind Through Reliable Maintenance History
			</MissionTitle>
			<MissionContent>
				<MissionCard>
					<MissionCardIcon>📚</MissionCardIcon>
					<MissionCardTitle>Complete Maintenance History</MissionCardTitle>
					<MissionCardDescription>
						Build a comprehensive record of every repair, service, and update.
						From individual unit devices to property-wide maintenance, keep your
						history organized and accessible.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon>🏠</MissionCardIcon>
					<MissionCardTitle>Individual Unit Tracking</MissionCardTitle>
					<MissionCardDescription>
						Track maintenance for each unit, device, and component separately.
						Know exactly what was done, when, and by whom for every part of your
						property.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon>🛡️</MissionCardIcon>
					<MissionCardTitle>Your Records, Your Responsibility</MissionCardTitle>
					<MissionCardDescription>
						You maintain the logging discipline—we provide the tools. Build the
						maintenance history that gives you confidence and peace of mind.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon>📱</MissionCardIcon>
					<MissionCardTitle>Always Available History</MissionCardTitle>
					<MissionCardDescription>
						Access your complete maintenance history anywhere, anytime. Whether
						on desktop or mobile, your records are always at your fingertips.
					</MissionCardDescription>
				</MissionCard>
			</MissionContent>
		</MissionSection>
	);
};

export default MissionSectionComponent;
