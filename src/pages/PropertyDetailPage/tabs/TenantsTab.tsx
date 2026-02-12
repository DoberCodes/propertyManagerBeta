import React, { useMemo } from 'react';
import styled from 'styled-components';
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
	ToolbarButton,
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
	onEditTenant,
	onDeleteTenant,
	onViewTenantPromo,
}) => {
	const [filters, setFilters] = useState<FilterValues>({});
	const [showFilters, setShowFilters] = useState(false);

	// Filter configuration for tenants
	const tenantFilters: FilterConfig[] = [
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
	const canManageTenants =
		currentUser && !isTenant(currentUser.role as UserRole);

	return (
		<SectionContainer>
			<SectionHeader>
				Property Tenants
				{canManageTenants && (
					<AddButton onClick={() => setShowAddTenantModal(true)}>
						+ Add Tenant
					</AddButton>
				)}
			</SectionHeader>

			{/* Collapsable Filter Section */}
			<div style={{ marginBottom: '16px' }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						marginBottom: showFilters ? '12px' : '0',
					}}>
					<input
						type='text'
						placeholder='Search tenants...'
						value={(filters.search as string) || ''}
						onChange={(e) =>
							setFilters((prev) => ({
								...prev,
								search: e.target.value,
							}))
						}
						style={{
							flex: 1,
							padding: '8px 12px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							fontSize: '14px',
						}}
					/>
					<button
						onClick={() => setShowFilters(!showFilters)}
						style={{
							padding: '8px 10px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							background: '#f9fafb',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							whiteSpace: 'nowrap',
						}}
						title={showFilters ? 'Hide filters' : 'Show filters'}>
						{showFilters ? '▲ Hide Filters' : '▼ Filters'}
					</button>
				</div>
				{showFilters && (
					<FilterBar filters={tenantFilters} onFiltersChange={setFilters} />
				)}
			</div>

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
								{canManageTenants && <th>Actions</th>}
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
									{canManageTenants && (
										<td>
											<ActionRow>
												<ToolbarButton onClick={() => onEditTenant(tenant)}>
													Edit
												</ToolbarButton>
												<ToolbarButton
													onClick={() => onViewTenantPromo(tenant)}>
													View Promo
												</ToolbarButton>
												<ToolbarButton
													className='delete'
													onClick={() => onDeleteTenant(tenant)}>
													Delete
												</ToolbarButton>
											</ActionRow>
										</td>
									)}
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

const ActionRow = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
`;
