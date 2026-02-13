import React from 'react';
import { SuitesTabProps } from '../../../types/PropertyDetailPage.types';
import { useNavigate } from 'react-router-dom';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	ReusableTable,
	Column,
	Action,
} from '../../../Components/Library/ReusableTable';
import { EmptyState } from './index.styles';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

export const SuitesTab: React.FC<SuitesTabProps> = ({ property }) => {
	const navigate = useNavigate();

	if (!property?.hasSuites || property?.propertyType !== 'Commercial') {
		return null;
	}

	const columns: Column[] = [
		{
			header: 'Suite Name',
			key: 'name',
			render: (value: string) => <strong>{value}</strong>,
		},
		{
			header: 'Tenants',
			key: 'tenants',
			render: (value: any[]) => (value || []).length,
		},
		{
			header: 'Devices',
			key: 'deviceIds',
			render: (value: any[]) => (value || []).length || 0,
		},
	];

	const actions: Action[] = [
		{
			label: 'View',
			icon: faExternalLinkAlt,
			onClick: (suite: any) =>
				navigate(
					`/property/${property.slug}/suite/${suite.name
						.replace(/\s+/g, '-')
						.toLowerCase()}`,
				),
		},
	];

	return (
		<SectionContainer>
			<SectionHeader>Commercial Suites</SectionHeader>
			{property?.suites && property.suites.length > 0 ? (
				<ReusableTable
					columns={columns}
					rowData={property.suites}
					actions={actions}
					emptyMessage='No suites added to this property'
				/>
			) : (
				<EmptyState>
					<p>No suites added to this property</p>
				</EmptyState>
			)}
		</SectionContainer>
	);
};
