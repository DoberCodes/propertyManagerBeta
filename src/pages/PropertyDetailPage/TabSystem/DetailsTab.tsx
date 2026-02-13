import React from 'react';
import { DetailsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	InfoCard,
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { DetailsEditHeader } from '../PropertyDetailPage.styles';
import { PropertyDetailSection } from '../PropertyDetailSection';

export const DetailsTab: React.FC<DetailsTabProps> = ({
	property,
	teamMembers,
}) => {
	return (
		<>
			{/* Edit Mode Header */}
			<DetailsEditHeader>
				<SectionHeader>Property Information</SectionHeader>
			</DetailsEditHeader>

			<PropertyDetailSection property={property} teamMembers={teamMembers} />

			{/* Notes */}
			{property.notes && (
				<SectionContainer>
					<SectionHeader>Notes</SectionHeader>
					<InfoCard style={{ padding: '16px' }}>
						<p style={{ margin: 0, lineHeight: '1.6', color: '#333' }}>
							{property.notes}
						</p>
					</InfoCard>
				</SectionContainer>
			)}
		</>
	);
};
