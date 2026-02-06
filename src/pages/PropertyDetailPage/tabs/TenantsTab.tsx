import React, { useMemo } from 'react';
import { TenantsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { SmallButton as AddButton } from '../../../Components/Library/Buttons/ButtonStyles';
import {
	GridContainer,
	GridTable,
	EmptyState,
} from '../PropertyDetailPage.styles';
import { UserRole } from '../../../constants/roles';
import { isTenant } from '../../../utils/permissions';
import {
	FilterBar,
	FilterConfig,
	FilterValues,
} from '../../../Components/Library/FilterBar';
import { applyFilters } from '../../../utils/tableFilters';
import { useState } from 'react';

export const TenantsTab: React.FC<TenantsTabProps> = ({
	property,
	currentUser,
	setShowAddTenantModal,
}) => {
	const [filters, setFilters] = useState<FilterValues>({});

	// Filter configuration for tenants
	const tenantFilters: FilterConfig[] = [
		{
			key: 'search',
			label: 'Search',
			type: 'text',
			placeholder: 'Search name, email, phone...',
		},
		{
			key: 'leaseStatus',
			label: 'Lease Status',
			type: 'select',
			options: [
				{ value: 'active', label: 'Active' },
				{ value: 'expired', label: 'Expired' },
				{ value: 'upcoming', label: 'Upcoming' },
			],
		},
		{
			key: 'leaseDate',
			label: 'Lease Period',
			type: 'daterange',
		},
	];

	// Apply filters to tenants
	const filteredTenants = useMemo(() => {
		if (!property.tenants) return [];
		return applyFilters(property.tenants, filters, {
			textFields: ['firstName', 'lastName', 'email', 'phone', 'unit'],
			dateRangeFields: [
				{ field: 'leaseStart', filterKey: 'leaseDate' },
				{ field: 'leaseEnd', filterKey: 'leaseDate' },
			],
		});
	}, [property.tenants, filters]);
	return (
		<SectionContainer>
			<SectionHeader>
				Property Tenants
				{currentUser && !isTenant(currentUser.role as UserRole) && (
					<AddButton onClick={() => setShowAddTenantModal(true)}>
						+ Add Tenant
					</AddButton>
				)}
			</SectionHeader>

			<FilterBar filters={tenantFilters} onFiltersChange={setFilters} />

			{filteredTenants && filteredTenants.length > 0 ? (
				<GridContainer>
					<GridTable>
						<thead>
							<tr>
								<th>Name</th>
								<th>Unit</th>
								<th>Email</th>
								<th>Phone</th>
								<th>Lease Start</th>
								<th>Lease End</th>
							</tr>
						</thead>
						<tbody>
							{filteredTenants.map((tenant: any) => (
								<tr key={tenant.id}>
									<td>
										{tenant.firstName} {tenant.lastName}
									</td>
									<td>{tenant.unit || 'N/A'}</td>
									<td>{tenant.email}</td>
									<td>{tenant.phone}</td>
									<td>{tenant.leaseStart || 'N/A'}</td>
									<td>{tenant.leaseEnd || 'N/A'}</td>
								</tr>
							))}
						</tbody>
					</GridTable>
				</GridContainer>
			) : (
				<EmptyState>
					<p>No tenants assigned to this property</p>
				</EmptyState>
			)}
		</SectionContainer>
	);
};
