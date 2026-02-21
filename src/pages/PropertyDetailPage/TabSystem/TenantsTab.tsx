import React, { useMemo, useState } from 'react';
import { faEdit, faEye, faTrash } from '@fortawesome/free-solid-svg-icons';
import { TenantsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { FormSelect } from '../../../Components/Library/Modal/ModalStyles';
import { ReusableTable } from '../../../Components/Library/ReusableTable';
import { UserRole } from '../../../constants/roles';
import { useSelector } from 'react-redux';
import { selectIsTenant } from '../../../Redux/selectors/permissionSelectors';
import {
	FilterBar,
	FilterConfig,
	FilterValues,
} from '../../../Components/Library/FilterBar';
import { applyFilters } from '../../../utils/tableFilters';
import {
	EmptyState,
	GridContainer,
	Toolbar,
	ToolbarButton,
} from './index.styles';

export const TenantsTab: React.FC<TenantsTabProps> = ({
	property,
	currentUser,
	unitOptions = [],
	selectedUnitId,
	onSelectUnit,
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
		let tenants = property.tenants;
		if (selectedUnitId) {
			tenants = tenants.filter(
				(t: any) => t.unit === selectedUnitId || t.unitId === selectedUnitId,
			);
		}
		return applyFilters(tenants, filters, {
			textFields: ['firstName', 'lastName', 'email', 'phone', 'unit'],
			dateRangeFields: [
				{ field: 'leaseStart', filterKey: 'leaseDate' },
				{ field: 'leaseEnd', filterKey: 'leaseDate' },
			],
		});
	}, [property.tenants, filters, selectedUnitId]);
	const isUserTenant = useSelector(selectIsTenant);

	const canManageTenants = currentUser && !isUserTenant;

	// Table configuration
	const columns = [
		{
			header: 'Name',
			key: 'fullName',
		},
		{
			header: 'Unit',
			key: 'unitDisplay',
		},
		{
			header: 'Email',
			key: 'email',
		},
		{
			header: 'Phone',
			key: 'phone',
		},
		{
			header: 'Lease Start',
			key: 'leaseStartDisplay',
		},
		{
			header: 'Lease End',
			key: 'leaseEndDisplay',
		},
	];

	const actions = canManageTenants
		? [
				{
					label: 'Edit',
					icon: faEdit,
					onClick: (tenant: any) => onEditTenant(tenant),
				},
				{
					label: 'View Promo',
					icon: faEye,
					onClick: (tenant: any) => onViewTenantPromo(tenant),
				},
				{
					label: 'Delete',
					icon: faTrash,
					onClick: (tenant: any) => onDeleteTenant(tenant),
					className: 'delete',
				},
		  ]
		: [];

	// Transform tenant data for the table
	const tableData = useMemo(() => {
		return filteredTenants.map((tenant: any) => ({
			...tenant,
			fullName: `${tenant.firstName} ${tenant.lastName}`,
			unitDisplay: tenant.unit || 'N/A',
			leaseStartDisplay: tenant.leaseStart || 'N/A',
			leaseEndDisplay: tenant.leaseEnd || 'N/A',
		}));
	}, [filteredTenants]);

	return (
		<SectionContainer>
			<SectionHeader>Property Tenants</SectionHeader>
			{canManageTenants && (
				<Toolbar>
					<ToolbarButton onClick={() => setShowAddTenantModal(true)}>
						+ Add Tenant
					</ToolbarButton>
				</Toolbar>
			)}

			{unitOptions.length > 0 && (
				<FormSelect
					name='unitFilter'
					value={selectedUnitId || ''}
					onChange={(e) => onSelectUnit && onSelectUnit(e.target.value)}
					style={{ marginLeft: '12px' }}>
					<option value=''>All units</option>
					{unitOptions.map((u) => (
						<option key={u.value} value={u.value}>
							{u.label}
						</option>
					))}
				</FormSelect>
			)}
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

			{filteredTenants && filteredTenants.length > 0 ? (
				<GridContainer>
					<ReusableTable
						columns={columns}
						rowData={tableData}
						actions={actions}
						showCheckbox={false}
					/>
				</GridContainer>
			) : (
				<EmptyState>
					<p>No tenants assigned to this property</p>
				</EmptyState>
			)}
		</SectionContainer>
	);
};
