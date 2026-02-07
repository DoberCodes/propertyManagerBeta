import React from 'react';
import { PropertyDetailSectionProps } from '../../types/PropertyDetailPage.types';
import { FormSelect } from '../../Components/Library';
import {
	EditableFieldInput,
	InfoCard,
	InfoGrid,
	InfoLabel,
	InfoValue,
	SectionContainer,
} from './PropertyDetailPage.styles';

export const PropertyDetailSection = (props: PropertyDetailSectionProps) => {
	// Helper function to get user name from ID
	const getUserName = (userId: string) => {
		const user = props.teamMembers.find((member) => member.id === userId);
		return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
	};

	// Get all owners (main owner + co-owners)
	const getAllOwners = () => {
		const owners: string[] = [];
		const mainOwner = props.property?.owner;
		if (mainOwner) owners.push(mainOwner);

		const coOwners = props.property?.coOwners || [];
		coOwners.forEach((coOwnerId) => {
			const coOwnerName = getUserName(coOwnerId);
			if (coOwnerName !== 'Unknown User') owners.push(coOwnerName);
		});

		return owners;
	};

	return (
		<SectionContainer>
			<InfoGrid>
				<InfoCard>
					<InfoLabel>Property Type</InfoLabel>
					{props.isEditMode ? (
						<FormSelect
							value={
								props.getPropertyFieldValue('propertyType') || 'Single Family'
							}
							onChange={(e) =>
								props.handlePropertyFieldChange('propertyType', e.target.value)
							}>
							<option value='Single Family'>Single Family</option>
							<option value='Multi-Family'>Multi-Family</option>
							<option value='Commercial'>Commercial</option>
						</FormSelect>
					) : (
						<InfoValue>
							{props.property?.propertyType || 'Single Family'}
						</InfoValue>
					)}
				</InfoCard>
				<InfoCard>
					<InfoLabel>Owner{getAllOwners().length > 1 ? 's' : ''}</InfoLabel>
					{props.isEditMode ? (
						<EditableFieldInput
							type='text'
							value={props.getPropertyFieldValue('owner')}
							onChange={(e) =>
								props.handlePropertyFieldChange('owner', e.target.value)
							}
						/>
					) : (
						<InfoValue>
							{getAllOwners().length > 0
								? getAllOwners().join(', ')
								: 'No owner specified'}
						</InfoValue>
					)}
				</InfoCard>
				<InfoCard>
					<InfoLabel>Address</InfoLabel>
					{props.isEditMode ? (
						<EditableFieldInput
							type='text'
							value={props.getPropertyFieldValue('address')}
							onChange={(e) =>
								props.handlePropertyFieldChange('address', e.target.value)
							}
						/>
					) : (
						<InfoValue>{props.getPropertyFieldValue('address')}</InfoValue>
					)}
				</InfoCard>
				{props.property?.propertyType === 'Multi-Family' && (
					<InfoCard>
						<InfoLabel>Units</InfoLabel>
						{props.isEditMode ? (
							<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
								{(props.property?.units || []).map((unit: any) => (
									<span
										key={unit.name}
										style={{
											backgroundColor: '#dcfce7',
											color: '#16a34a',
											padding: '6px 12px',
											borderRadius: '6px',
											fontSize: '14px',
											border: '1px solid #bbf7d0',
										}}>
										{unit.name}
									</span>
								))}
							</div>
						) : (
							<InfoValue>
								{(props.property?.units || [])
									.map((u: any) => u.name)
									.join(', ')}
							</InfoValue>
						)}
					</InfoCard>
				)}
				{props.property?.propertyType === 'Commercial' &&
					props.property?.hasSuites && (
						<InfoCard>
							<InfoLabel>Suites</InfoLabel>
							<InfoValue>
								{(props.property?.suites || [])
									.map((s: any) => s.name)
									.join(', ')}
							</InfoValue>
						</InfoCard>
					)}
				{props.property?.propertyType !== 'Commercial' &&
					props.property?.propertyType !== 'Multi-Family' && (
						<>
							<InfoCard>
								<InfoLabel>Bedrooms</InfoLabel>
								{props.isEditMode ? (
									<EditableFieldInput
										type='number'
										value={props.getPropertyFieldValue('bedrooms')}
										onChange={(e) =>
											props.handlePropertyFieldChange(
												'bedrooms',
												e.target.value,
											)
										}
									/>
								) : (
									<InfoValue>
										{props.getPropertyFieldValue('bedrooms')}
									</InfoValue>
								)}
							</InfoCard>
							<InfoCard>
								<InfoLabel>Bathrooms</InfoLabel>
								{props.isEditMode ? (
									<EditableFieldInput
										type='number'
										value={props.getPropertyFieldValue('bathrooms')}
										onChange={(e) =>
											props.handlePropertyFieldChange(
												'bathrooms',
												e.target.value,
											)
										}
									/>
								) : (
									<InfoValue>
										{props.getPropertyFieldValue('bathrooms')}
									</InfoValue>
								)}
							</InfoCard>
						</>
					)}
				<InfoCard>
					<InfoLabel>Administrators</InfoLabel>
					{props.isEditMode ? (
						<EditableFieldInput
							type='text'
							value={props.getPropertyFieldValue('administrators')}
							onChange={(e) =>
								props.handlePropertyFieldChange(
									'administrators',
									e.target.value,
								)
							}
							placeholder='Comma-separated emails'
						/>
					) : (
						<InfoValue>
							{(props.property?.administrators?.length || 0) > 0
								? props.property?.administrators?.join(', ')
								: 'None'}
						</InfoValue>
					)}
				</InfoCard>
				<InfoCard>
					<InfoLabel>Viewers</InfoLabel>
					{props.isEditMode ? (
						<EditableFieldInput
							type='text'
							value={props.getPropertyFieldValue('viewers')}
							onChange={(e) =>
								props.handlePropertyFieldChange('viewers', e.target.value)
							}
							placeholder='Comma-separated emails'
						/>
					) : (
						<InfoValue>
							{(props.property?.viewers?.length || 0) > 0
								? props.property?.viewers?.join(', ')
								: 'None'}
						</InfoValue>
					)}
				</InfoCard>
				<InfoCard>
					<InfoLabel>Rental Property</InfoLabel>
					<InfoValue>{props.property?.isRental ? 'Yes' : 'No'}</InfoValue>
				</InfoCard>
				<InfoCard>
					<InfoLabel>Notes</InfoLabel>
					{props.isEditMode ? (
						<EditableFieldInput
							type='text'
							value={props.getPropertyFieldValue('notes') || ''}
							onChange={(e) =>
								props.handlePropertyFieldChange('notes', e.target.value)
							}
							placeholder='Add any notes about this property'
						/>
					) : (
						<InfoValue>
							{props.getPropertyFieldValue('notes') || 'No notes'}
						</InfoValue>
					)}
				</InfoCard>
				<InfoCard>
					<InfoLabel>Created</InfoLabel>
					<InfoValue>
						{props.property?.createdAt
							? new Date(props.property.createdAt).toLocaleDateString()
							: 'N/A'}
					</InfoValue>
				</InfoCard>
				<InfoCard>
					<InfoLabel>Last Updated</InfoLabel>
					<InfoValue>
						{props.property?.updatedAt
							? new Date(props.property.updatedAt).toLocaleDateString()
							: 'N/A'}
					</InfoValue>
				</InfoCard>
			</InfoGrid>
		</SectionContainer>
	);
};
