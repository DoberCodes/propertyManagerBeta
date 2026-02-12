import React, { useState, useMemo } from 'react';
import { MaintenanceTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	GridContainer,
	GridTable,
	EmptyState,
} from '../PropertyDetailPage.styles';
import { getDeviceNameUtil } from '../PropertyDetailPage.utils';
import {
	FilterBar,
	FilterConfig,
	FilterValues,
} from '../../../Components/Library/FilterBar';
import { applyFilters } from '../../../utils/tableFilters';

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({
	property,
	maintenanceHistoryRecords = [],
	units = [],
}) => {
	const [filters, setFilters] = useState<FilterValues>({});

	// Filter configuration for maintenance history
	const maintenanceFilters: FilterConfig[] = [
		{
			key: 'search',
			label: 'Search',
			type: 'text' as const,
			placeholder: 'Search tasks, notes...',
		},
		// Only show unit filter for Multi-Family properties
		...(property?.propertyType === 'Multi-Family'
			? [
					{
						key: 'unit',
						label: 'Unit',
						type: 'select' as const,
						options: [
							{ value: 'all', label: 'All Units' },
							...units.map((unit) => ({
								value: unit.id,
								label: unit.unitNumber || unit.address || `Unit ${unit.id}`,
							})),
						],
					},
			  ]
			: []),
		{
			key: 'completedBy',
			label: 'Completed By',
			type: 'select' as const,
			options: [
				{ value: 'unassigned', label: 'Unassigned' },
				// Dynamically populate with users from existing records
				...Array.from(
					new Set(
						maintenanceHistoryRecords
							.filter(
								(record) =>
									record.completedBy || record.approvedBy || record.assignee,
							)
							.map((record) => ({
								id: record.completedBy || record.approvedBy || record.assignee,
								name: record.completedByName || 'Unknown User',
							}))
							.filter(
								(user, index, self) =>
									index === self.findIndex((u) => u.name === user.name),
							),
					),
				).map((user) => ({
					value: user.id,
					label: user.name,
				})),
			],
		},
		{
			key: 'completionDate',
			label: 'Completion Date',
			type: 'daterange' as const,
		},
	];

	// Combine all maintenance records for filtering
	const allMaintenanceRecords = useMemo(
		() => [
			...maintenanceHistoryRecords.map((record) => ({
				...record,
				completionDate:
					record.completionDate || record.approvedAt || record.dueDate,
				title: record.title || record.taskTitle || 'Task',
				completedBy: record.completedBy || record.approvedBy || record.assignee,
				completedByName: record.completedByName,
				notes: record.completionNotes || record.notes,
				isLegacy: false,
			})),
			...(property.maintenanceHistory || []).map(
				(record: any, index: number) => ({
					id: `legacy-${index}`,
					completionDate: record.date,
					title: record.description,
					completedBy: getDeviceNameUtil(record.deviceId, property),
					completedByName: getDeviceNameUtil(record.deviceId, property),
					notes: '-',
					isLegacy: true,
				}),
			),
		],
		[maintenanceHistoryRecords, property],
	);

	// Apply filters to maintenance records
	const filteredRecords = useMemo(() => {
		let records = applyFilters(allMaintenanceRecords, filters, {
			textFields: ['title', 'notes'],
			selectFields: [{ field: 'completedBy', filterKey: 'completedBy' }],
			dateRangeFields: [
				{ field: 'completionDate', filterKey: 'completionDate' },
			],
		});

		// Apply unit filter separately (only for Multi-Family properties)
		if (
			property?.propertyType === 'Multi-Family' &&
			filters.unit &&
			filters.unit !== 'all'
		) {
			records = records.filter((record: any) => {
				// For unit-level maintenance, check if the record's unitId matches
				if (record.unitId) {
					return record.unitId === filters.unit;
				}
				// For property-level maintenance, only show if no unit filter is applied
				return false;
			});
		}

		return records;
	}, [allMaintenanceRecords, filters, property?.propertyType]);

	return (
		<SectionContainer>
			<SectionHeader>Maintenance History</SectionHeader>

			<FilterBar filters={maintenanceFilters} onFiltersChange={setFilters} />

			{filteredRecords.length > 0 ? (
				<GridContainer>
					<GridTable>
						<thead>
							<tr>
								<th>Date</th>
								{property?.propertyType === 'Multi-Family' && <th>Unit</th>}
								<th>Task</th>
								<th>Completed By</th>
								<th>Notes</th>
								<th>Files</th>
							</tr>
						</thead>
						<tbody>
							{/* Display filtered maintenance records */}
							{filteredRecords.map((record: any) => {
								// Find the unit name for this record (only for Multi-Family properties)
								const unitForRecord =
									property?.propertyType === 'Multi-Family' && record.unitId
										? units.find((unit: any) => unit.id === record.unitId)
										: null;
								const unitDisplay = unitForRecord
									? unitForRecord.unitNumber || unitForRecord.address || 'Unit'
									: 'Property';

								return (
									<tr key={record.id || `record-${Math.random()}`}>
										<td>{record.completionDate || '-'}</td>
										{property?.propertyType === 'Multi-Family' && (
											<td>{unitDisplay}</td>
										)}
										<td>
											<strong>{record.title || 'Task'}</strong>
											{record.notes && record.notes !== '-' && (
												<>
													<br />
													<small style={{ color: '#666' }}>
														{record.notes}
													</small>
												</>
											)}
										</td>
										<td>
											{record.completedByName || record.completedBy || '-'}
										</td>
										<td>{record.completionNotes || record.notes || '-'}</td>
										<td>
											{record.completionFile && !record.isLegacy ? (
												<a
													href={record.completionFile.url}
													target='_blank'
													rel='noopener noreferrer'
													style={{ color: '#22c55e' }}>
													📎 {record.completionFile.name}
												</a>
											) : (
												'-'
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</GridTable>
				</GridContainer>
			) : (
				<EmptyState>
					<p>No maintenance history for this property</p>
				</EmptyState>
			)}
		</SectionContainer>
	);
};
