import React from 'react';
import { DetailsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	InfoCard,
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	EditableFieldInput,
	DetailsEditHeader,
} from '../PropertyDetailPage.styles';
import { PropertyDetailSection } from '../PropertyDetailSection';

export const DetailsTab: React.FC<DetailsTabProps> = ({
	isEditMode,
	property,
	getPropertyFieldValue,
	handlePropertyFieldChange,
	teamMembers,
}) => {
	return (
		<>
			{/* Edit Mode Header */}
			<DetailsEditHeader>
				<SectionHeader>Property Information</SectionHeader>
			</DetailsEditHeader>

			<PropertyDetailSection
				isEditMode={isEditMode}
				property={property}
				getPropertyFieldValue={getPropertyFieldValue}
				handlePropertyFieldChange={handlePropertyFieldChange}
				teamMembers={teamMembers}
			/>

			{/* Notes */}
			{property.notes && (
				<SectionContainer>
					<SectionHeader>Notes</SectionHeader>
					<InfoCard style={{ padding: '16px' }}>
						{isEditMode ? (
							<EditableFieldInput
								type='text'
								value={getPropertyFieldValue('notes')}
								onChange={(e) =>
									handlePropertyFieldChange('notes', e.target.value)
								}
								placeholder='Edit property notes'
								style={{ minHeight: '80px', padding: '12px' }}
								as='textarea'
							/>
						) : (
							<p style={{ margin: 0, lineHeight: '1.6', color: '#333' }}>
								{getPropertyFieldValue('notes')}
							</p>
						)}
					</InfoCard>
				</SectionContainer>
			)}
		</>
	);
};
