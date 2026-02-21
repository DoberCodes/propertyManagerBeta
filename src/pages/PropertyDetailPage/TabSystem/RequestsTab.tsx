import React from 'react';
import { RequestsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { FormSelect } from '../../../Components/Library/Modal/ModalStyles';
import {
	ReusableTable,
	Column,
	Action,
} from '../../../Components/Library/ReusableTable';
import { StatusBadge, EmptyState } from './index.styles';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import {
	getRequestStatusUtil,
	getPriorityColorUtil,
	formatDateUtil,
} from '../PropertyDetailPage.utils';
import { UserRole } from '../../../constants/roles';

export const RequestsTab: React.FC<RequestsTabProps> = ({
	propertyMaintenanceRequests,
	currentUser,
	unitOptions = [],
	selectedUnitId,
	onSelectUnit,
	canApproveMaintenanceRequest,
	handleConvertRequestToTask,
}) => {
	const columns: Column[] = [
		{
			header: 'Status',
			key: 'status',
			render: (status: string, request: any) => (
				<StatusBadge status={getRequestStatusUtil(request.status)}>
					{status}
				</StatusBadge>
			),
		},
		{
			header: 'Title',
			key: 'title',
			render: (title: string, request: any) => (
				<div>
					<strong>{title}</strong>
					<br />
					<small style={{ color: '#666', fontSize: '12px' }}>
						{request.description.substring(0, 80)}
						{request.description.length > 80 && '...'}
					</small>
				</div>
			),
		},
		{ header: 'Category', key: 'category' },
		{
			header: 'Priority',
			key: 'priority',
			render: (priority: string) => (
				<span
					style={{
						color: getPriorityColorUtil(priority),
						fontWeight: 'bold',
					}}>
					{priority}
				</span>
			),
		},
		{ header: 'Submitted By', key: 'submittedByName' },
		{
			header: 'Unit',
			key: 'unit',
			render: (unit: string) =>
				unit ? (
					<span
						style={{
							backgroundColor: '#e8f5e9',
							padding: '4px 8px',
							borderRadius: '4px',
							fontSize: '12px',
							fontWeight: '500',
							color: '#2e7d32',
						}}>
						{unit}
					</span>
				) : (
					<span style={{ color: '#999', fontSize: '12px' }}>N/A</span>
				),
		},
		{
			header: 'Date',
			key: 'submittedAt',
			render: (date: any) => formatDateUtil(date),
		},
	];

	const actions: Action[] = [
		{
			label: 'Convert to Task',
			icon: faExchangeAlt,
			onClick: (request: any) => handleConvertRequestToTask(request.id),
			disabled: (request: any) =>
				!(
					request.status === 'Pending' &&
					currentUser &&
					canApproveMaintenanceRequest(currentUser.role as UserRole)
				),
		},
	];

	// optionally filter by selected unit
	const filteredRequests = React.useMemo(() => {
		if (!selectedUnitId) return propertyMaintenanceRequests;
		return propertyMaintenanceRequests.filter(
			(req) => req.unit === selectedUnitId || req.unitId === selectedUnitId,
		);
	}, [propertyMaintenanceRequests, selectedUnitId]);

	return (
		<SectionContainer>
			<SectionHeader>Maintenance Requests</SectionHeader>
			{unitOptions.length > 0 && (
				<FormSelect
					name='unitFilter'
					value={selectedUnitId || ''}
					onChange={(e) => onSelectUnit && onSelectUnit(e.target.value)}
					style={{ marginBottom: '12px' }}>
					<option value=''>All units</option>
					{unitOptions.map((u) => (
						<option key={u.value} value={u.value}>
							{u.label}
						</option>
					))}
				</FormSelect>
			)}

			{filteredRequests.length > 0 ? (
				<ReusableTable
					columns={columns}
					rowData={filteredRequests}
					actions={actions}
					emptyMessage='No maintenance requests'
				/>
			) : (
				<EmptyState>
					<p>No maintenance requests for this property</p>
				</EmptyState>
			)}
		</SectionContainer>
	);
};
