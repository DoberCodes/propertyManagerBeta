import React from 'react';
import { RequestsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { ReusableTable, Column, Action } from '../../../Components/Library/ReusableTable';
import { TaskStatus, EmptyState } from './index.styles';
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
	canApproveMaintenanceRequest,
	handleConvertRequestToTask,
}) => {
	const columns: Column[] = [
		{
			header: 'Status',
			key: 'status',
			render: (status: string, request: any) => (
				<TaskStatus status={getRequestStatusUtil(request.status)}>
					{status}
				</TaskStatus>
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

	return (
		<SectionContainer>
			<SectionHeader>Maintenance Requests</SectionHeader>

			{propertyMaintenanceRequests.length > 0 ? (
				<ReusableTable
					columns={columns}
					rowData={propertyMaintenanceRequests}
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
