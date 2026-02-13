import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	GenericModal,
	FormGroup,
	FormLabel,
	FormSelect,
} from '../../../Components/Library';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	Toolbar,
	ToolbarButton,
	EmptyState,
	GridContainer,
	GridTable,
} from './index.styles';
import { getDeviceNameUtil } from '../PropertyDetailPage.utils';
import {
	FilterBar,
	FilterConfig,
	FilterValues,
} from '../../../Components/Library/FilterBar';
import { applyFilters } from '../../../utils/tableFilters';
import { AddMaintenanceHistoryModal } from '../../../Components/Library/Modal/AddMaintenanceHistoryModal';

export interface MaintenanceTabProps {
	property: any;
	maintenanceHistoryRecords?: any[];
	units?: any[];
	teamMembers?: any[];
	contractors?: any[];
	familyMembers?: any[];
	sharedUsers?: any[];
	tasks?: any[];
	onAddMaintenanceHistory?: (data: {
		title: string;
		completionDate: string;
		completedBy?: string;
		completedByName?: string;
		completionNotes?: string;
		unitId?: string;
		completionFile?: File;
		recurringTaskId?: string;
		linkedTaskIds?: string[];
	}) => void;
	onUpdateMaintenanceHistory?: (id: string, updates: Partial<any>) => void;
	onDeleteMaintenanceHistory?: (historyId: string) => void;
}

export const MaintenanceTab = ({
	property,
	maintenanceHistoryRecords = [],
	units = [],
	teamMembers = [],
	contractors = [],
	familyMembers = [],
	sharedUsers = [],
	onAddMaintenanceHistory,
	onUpdateMaintenanceHistory,
	onDeleteMaintenanceHistory,
}: MaintenanceTabProps) => {
	const navigate = useNavigate();
	const [filters, setFilters] = useState<FilterValues>({});
	const [showAddModal, setShowAddModal] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(
		new Set(),
	);
	const [showBulkGroupModal, setShowBulkGroupModal] = useState(false);
	const canBulkEdit = Boolean(onUpdateMaintenanceHistory);

	// Mobile detection
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Bulk selection handlers
	const toggleRecordSelection = (recordId: string) => {
		setSelectedRecordIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(recordId)) {
				newSet.delete(recordId);
			} else {
				newSet.add(recordId);
			}
			return newSet;
		});
	};

	const toggleGroupSelection = (records: any[]) => {
		setSelectedRecordIds((prev) => {
			const newSet = new Set(prev);
			const recordIds = records
				.filter((record) => record && record.id)
				.map((record) => record.id);
			const isAllSelected = recordIds.every((id) => newSet.has(id));
			recordIds.forEach((id) => {
				if (isAllSelected) {
					newSet.delete(id);
				} else {
					newSet.add(id);
				}
			});
			return newSet;
		});
	};

	const createMaintenanceGroupId = () => {
		if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
			return `mg-${crypto.randomUUID()}`;
		}
		return `mg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
	};

	const handleBulkGroupRecords = async (selectedGroupId: string) => {
		const groupId =
			selectedGroupId === '__new__'
				? createMaintenanceGroupId()
				: selectedGroupId;
		if (!groupId) return;

		try {
			// Collect all records for updating
			const allRecords = [
				...Object.values(groupedRecords.groups).flat(),
				...groupedRecords.ungrouped,
			];

			const selectedRecords = Array.from(selectedRecordIds)
				.map((id) => allRecords.find((r) => r.id === id))
				.filter((r) => r !== undefined);

			// Update all selected records with the maintenanceGroupId
			for (const record of selectedRecords) {
				if (onUpdateMaintenanceHistory) {
					await onUpdateMaintenanceHistory(record.id, {
						maintenanceGroupId: groupId,
					});
				}
			}

			setSelectedRecordIds(new Set());
			setShowBulkGroupModal(false);
		} catch (error) {
			console.error('Error grouping maintenance history:', error);
			// Handle error - could show toast notification
		}
	};

	const handleDeleteGroup = async (records: any[]) => {
		if (!onDeleteMaintenanceHistory) return;

		const deletableRecords = records.filter(
			(record) => !record.isLegacy && record.id,
		);
		if (deletableRecords.length === 0) {
			window.alert(
				'No deletable maintenance history records found in this group.',
			);
			return;
		}

		const confirmed = window.confirm(
			`Delete ${deletableRecords.length} maintenance history record(s) in this group? This cannot be undone.`,
		);
		if (!confirmed) return;

		for (const record of deletableRecords) {
			await onDeleteMaintenanceHistory(record.id);
		}
	};

	const completedByLookup = useMemo(() => {
		const lookup = new Map<string, string>();

		sharedUsers
			.filter((share: any) => share.sharedWithUserId)
			.forEach((share: any) => {
				const fullName =
					share.sharedWithFirstName && share.sharedWithLastName
						? `${share.sharedWithFirstName} ${share.sharedWithLastName}`
						: share.sharedWithEmail?.split('@')[0] || 'Shared User';
				lookup.set(share.sharedWithUserId, fullName);
			});

		teamMembers.forEach((member: any) => {
			const name = `${member.firstName || ''} ${member.lastName || ''}`.trim();
			if (name) {
				lookup.set(member.id, name);
			}
		});

		contractors.forEach((contractor: any) => {
			const name = contractor.companyName || contractor.name || 'Contractor';
			lookup.set(contractor.id, name);
		});

		familyMembers.forEach((member: any) => {
			const name = `${member.firstName || ''} ${member.lastName || ''}`.trim();
			if (name) {
				lookup.set(member.id, name);
			}
		});

		return lookup;
	}, [sharedUsers, teamMembers, contractors, familyMembers]);

	const resolveCompletedByName = useCallback(
		(record: any) => {
			const completedById =
				record.completedBy || record.approvedBy || record.assignee || '';
			return (
				record.completedByName ||
				completedByLookup.get(completedById) ||
				undefined
			);
		},
		[completedByLookup],
	);

	// Filter configuration for maintenance history
	const maintenanceFilters: FilterConfig[] = [
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
				completedByName: resolveCompletedByName(record),
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
		[maintenanceHistoryRecords, property, resolveCompletedByName],
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

	const getMaintenanceGroupId = (record: any): string | undefined => {
		return record.maintenanceGroupId;
	};

	// Group maintenance records by maintenance group ID
	const groupedRecords = useMemo(() => {
		const groups: { [key: string]: any[] } = {};
		const ungrouped: any[] = [];

		filteredRecords.forEach((record) => {
			const groupId = getMaintenanceGroupId(record);
			if (groupId) {
				if (!groups[groupId]) {
					groups[groupId] = [];
				}
				groups[groupId].push(record);
			} else {
				ungrouped.push(record);
			}
		});

		// Sort records within each group by completion date (newest first)
		Object.keys(groups).forEach((key) => {
			groups[key].sort(
				(a, b) =>
					new Date(b.completionDate).getTime() -
					new Date(a.completionDate).getTime(),
			);
		});

		// Sort ungrouped records by completion date (newest first)
		ungrouped.sort(
			(a, b) =>
				new Date(b.completionDate).getTime() -
				new Date(a.completionDate).getTime(),
		);

		return { groups, ungrouped };
	}, [filteredRecords]);

	const maintenanceGroupOptions = useMemo(
		() =>
			Object.entries(groupedRecords.groups).map(([groupId, records]) => ({
				value: groupId,
				label: `${records[0]?.title || 'Maintenance'} (${
					records.length
				} items)`,
			})),
		[groupedRecords.groups],
	);

	return (
		<SectionContainer>
			<SectionHeader>Maintenance History</SectionHeader>

			{/* Toolbar with Add button */}
			{onAddMaintenanceHistory && (
				<Toolbar>
					<ToolbarButton onClick={() => setShowAddModal(true)}>
						+ Add History
					</ToolbarButton>
				</Toolbar>
			)}

			{/* Bulk Action Toolbar */}
			{canBulkEdit && selectedRecordIds.size > 0 && (
				<Toolbar
					style={{ background: '#eff6ff', borderBottom: '2px solid #3b82f6' }}>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							flex: 1,
						}}>
						<span
							style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
							{selectedRecordIds.size} record
							{selectedRecordIds.size !== 1 ? 's' : ''} selected
						</span>
					</div>
					<div style={{ display: 'flex', gap: '8px' }}>
						<button
							onClick={() => setShowBulkGroupModal(true)}
							style={{
								padding: '6px 12px',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '12px',
							}}>
							🧩 Group History
						</button>
						<button
							onClick={() => setSelectedRecordIds(new Set())}
							style={{
								padding: '6px 12px',
								background: '#e5e7eb',
								color: '#374151',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '12px',
							}}>
							Clear Selection
						</button>
					</div>
				</Toolbar>
			)}

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
						placeholder='Search history, notes...'
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
					<FilterBar
						filters={maintenanceFilters}
						onFiltersChange={setFilters}
					/>
				)}
			</div>

			{Object.keys(groupedRecords.groups).length > 0 ||
			groupedRecords.ungrouped.length > 0 ? (
				isMobile ? (
					<div>
						{/* Display grouped records first */}
						{Object.entries(groupedRecords.groups).map(([groupId, records]) => (
							<MaintenanceHistoryGroup
								key={groupId}
								groupId={groupId}
								records={records}
								units={units}
								propertySlug={property.slug}
								onDelete={onDeleteMaintenanceHistory}
								selectedRecordIds={selectedRecordIds}
								onToggleRecordSelection={
									canBulkEdit ? toggleRecordSelection : undefined
								}
								onDeleteGroup={
									onDeleteMaintenanceHistory ? handleDeleteGroup : undefined
								}
							/>
						))}
						{/* Display ungrouped records */}
						{groupedRecords.ungrouped.map((record) => (
							<MaintenanceHistoryCard
								key={record.id}
								record={record}
								units={units}
								propertySlug={property.slug}
								onDelete={onDeleteMaintenanceHistory}
								isSelected={selectedRecordIds.has(record.id)}
								onSelectionChange={
									canBulkEdit ? toggleRecordSelection : undefined
								}
							/>
						))}
					</div>
				) : (
					<GridContainer>
						<GridTable>
							<thead>
								<tr>
									{canBulkEdit && <th></th>}
									<th>Date</th>
									{property?.propertyType === 'Multi-Family' && <th>Unit</th>}
									<th>Task</th>
									<th>Completed By</th>
									<th>Notes</th>
									<th>Files</th>
									{onDeleteMaintenanceHistory && <th>Actions</th>}
								</tr>
							</thead>
							<tbody>
								{/* Display grouped records first */}
								{Object.entries(groupedRecords.groups).map(
									([groupId, records]) => {
										const groupLink = `/property/${
											property.slug
										}/maintenance-history/${encodeURIComponent(groupId)}`;
										return (
											<tr
												key={groupId}
												style={{ backgroundColor: '#f9fafb' }}
												onDoubleClick={() => {
													navigate(groupLink);
												}}>
												<td
													colSpan={
														(property?.propertyType === 'Multi-Family'
															? 7
															: 6) + (canBulkEdit ? 1 : 0)
													}
													style={{ padding: '12px' }}>
													<div
														style={{
															display: 'flex',
															alignItems: 'center',
															fontWeight: '600',
														}}>
														{canBulkEdit && (
															<input
																type='checkbox'
																checked={records.every((record) =>
																	selectedRecordIds.has(record.id),
																)}
																onChange={() => toggleGroupSelection(records)}
																style={{ marginRight: '8px' }}
															/>
														)}
														<span style={{ marginRight: '8px' }}>🔄</span>
														{records[0].title} ({records.length} instances)
														<button
															onClick={() => navigate(groupLink)}
															style={{
																marginLeft: '12px',
																fontSize: '12px',
																color: 'white',
																background: '#3b82f6',
																padding: '4px 8px',
																borderRadius: '4px',
																border: 'none',
																cursor: 'pointer',
															}}>
															View details
														</button>
														{onDeleteMaintenanceHistory && (
															<button
																onClick={() => handleDeleteGroup(records)}
																style={{
																	marginLeft: '8px',
																	fontSize: '12px',
																	color: 'white',
																	background: '#ef4444',
																	padding: '4px 8px',
																	borderRadius: '4px',
																	border: 'none',
																	cursor: 'pointer',
																}}>
																Delete group
															</button>
														)}
														<span
															style={{
																marginLeft: 'auto',
																fontSize: '12px',
																color: '#6b7280',
															}}>
															Latest:{' '}
															{new Date(
																records[0].completionDate,
															).toLocaleDateString()}
														</span>
													</div>
													{/* Show the last two instances in the group */}
													<div style={{ marginTop: '8px' }}>
														{records.slice(0, 2).map((record) => (
															<div
																key={record.id}
																style={{
																	marginBottom: '4px',
																	paddingLeft: '24px',
																}}>
																<span style={{ fontSize: '14px' }}>
																	{new Date(
																		record.completionDate,
																	).toLocaleDateString()}{' '}
																	- {record.completedByName || 'Unknown'}
																	{record.completionNotes &&
																		` - ${record.completionNotes}`}
																</span>
															</div>
														))}
														{records.length > 2 && (
															<div
																style={{
																	marginTop: '6px',
																	paddingLeft: '24px',
																	fontSize: '12px',
																	color: '#6b7280',
																}}>
																Showing last 2. View details for full history.
															</div>
														)}
													</div>
												</td>
											</tr>
										);
									},
								)}
								{/* Display ungrouped records */}
								{groupedRecords.ungrouped.map((record: any) => {
									// Find the unit name for this record (only for Multi-Family properties)
									const unitForRecord =
										property?.propertyType === 'Multi-Family' && record.unitId
											? units.find((unit: any) => unit.id === record.unitId)
											: null;
									const unitDisplay = unitForRecord
										? unitForRecord.unitNumber ||
										  unitForRecord.address ||
										  'Unit'
										: 'Property';
									const recordGroupId =
										getMaintenanceGroupId(record) || record.id;
									const recordLink =
										recordGroupId && !record.isLegacy
											? `/property/${
													property.slug
											  }/maintenance-history/${encodeURIComponent(
													recordGroupId,
											  )}`
											: null;

									return (
										<tr
											key={record.id || `record-${Math.random()}`}
											onDoubleClick={() => {
												if (recordLink) {
													navigate(recordLink);
												}
											}}>
											{canBulkEdit && (
												<td>
													<input
														type='checkbox'
														checked={selectedRecordIds.has(record.id)}
														onChange={() => toggleRecordSelection(record.id)}
													/>
												</td>
											)}
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
											{onDeleteMaintenanceHistory && (
												<td>
													{recordLink && (
														<button
															onClick={() => {
																navigate(recordLink);
															}}
															style={{
																padding: '4px 8px',
																background: '#3b82f6',
																color: 'white',
																border: 'none',
																borderRadius: '4px',
																cursor: 'pointer',
																fontSize: '12px',
																marginRight: '6px',
															}}>
															View details
														</button>
													)}
													<button
														onClick={() =>
															onDeleteMaintenanceHistory(record.id)
														}
														style={{
															padding: '4px 8px',
															background: '#ef4444',
															color: 'white',
															border: 'none',
															borderRadius: '4px',
															cursor: 'pointer',
															fontSize: '12px',
														}}>
														Delete
													</button>
												</td>
											)}
										</tr>
									);
								})}
							</tbody>
						</GridTable>
					</GridContainer>
				)
			) : (
				<EmptyState>
					<p>No maintenance history for this property</p>
				</EmptyState>
			)}

			{/* Add Maintenance History Modal */}
			{showAddModal && (
				<AddMaintenanceHistoryModal
					isOpen={showAddModal}
					onClose={() => setShowAddModal(false)}
					onSubmit={onAddMaintenanceHistory}
					property={property}
					units={units}
					teamMembers={teamMembers}
					contractors={contractors}
					familyMembers={familyMembers}
					groupOptions={maintenanceGroupOptions}
					onCreateGroupId={createMaintenanceGroupId}
				/>
			)}

			{showBulkGroupModal && (
				<GenericModal
					isOpen={showBulkGroupModal}
					onClose={() => setShowBulkGroupModal(false)}
					title='Group Maintenance History'
					showActions={true}
					primaryButtonLabel='Apply Group'
					secondaryButtonLabel='Cancel'
					onSubmit={(e) => {
						e.preventDefault();
						const form = e.target as HTMLFormElement;
						const selectedGroupId =
							(form.elements.namedItem('bulkGroupId') as HTMLSelectElement)
								.value || '';
						handleBulkGroupRecords(selectedGroupId);
					}}>
					<FormGroup>
						<FormLabel>Maintenance Group</FormLabel>
						<FormSelect name='bulkGroupId' defaultValue=''>
							<option value=''>Select a group...</option>
							<option value='__new__'>Create new group</option>
							{maintenanceGroupOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</FormSelect>
					</FormGroup>
				</GenericModal>
			)}
		</SectionContainer>
	);
};

// Maintenance History Card Component for Mobile Carousel
interface MaintenanceHistoryCardProps {
	record: any;
	units: any[];
	propertySlug: string;
	onDelete?: (id: string) => void;
	isGroupedView?: boolean;
	groupRecords?: any[];
	isSelected?: boolean;
	onSelectionChange?: (recordId: string) => void;
}

interface MaintenanceHistoryGroupProps {
	groupId: string;
	records: any[];
	units: any[];
	propertySlug: string;
	onDelete?: (historyId: string) => void;
	selectedRecordIds?: Set<string>;
	onToggleRecordSelection?: (recordId: string) => void;
	onDeleteGroup?: (records: any[]) => void;
}

const MaintenanceHistoryGroup: React.FC<MaintenanceHistoryGroupProps> = ({
	groupId,
	records,
	units,
	propertySlug,
	onDelete,
	selectedRecordIds = new Set(),
	onToggleRecordSelection,
	onDeleteGroup,
}) => {
	const navigate = useNavigate();
	const [isExpanded, setIsExpanded] = useState(false);
	const latestRecord = records[0]; // Records are sorted by date, newest first
	const groupLink = `/property/${propertySlug}/maintenance-history/${encodeURIComponent(
		groupId,
	)}`;

	const getUnitName = (unitId?: string) => {
		if (!unitId) return '';
		const unit = units.find((u) => u.id === unitId);
		return unit ? unit.unitName : '';
	};

	return (
		<div
			style={{
				background: 'white',
				borderRadius: '8px',
				padding: '16px',
				boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
				border: '1px solid #e5e7eb',
				marginBottom: '16px',
			}}>
			{/* Group Header */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					cursor: 'pointer',
					marginBottom: isExpanded ? '16px' : '0',
				}}
				onClick={() => setIsExpanded(!isExpanded)}>
				<div>
					<h3
						style={{
							margin: '0 0 4px 0',
							fontSize: '16px',
							fontWeight: '600',
						}}>
						🔄 {latestRecord.title} ({records.length} instances)
					</h3>
					<p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
						Latest: {new Date(latestRecord.completionDate).toLocaleDateString()}
						{latestRecord.unitId && (
							<span style={{ marginLeft: '8px', fontWeight: '500' }}>
								• {getUnitName(latestRecord.unitId)}
							</span>
						)}
					</p>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					{onDeleteGroup && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								onDeleteGroup(records);
							}}
							style={{
								fontSize: '12px',
								color: '#ef4444',
								background: 'none',
								border: 'none',
								padding: 0,
								cursor: 'pointer',
							}}>
							Delete group
						</button>
					)}
					<button
						onClick={(e) => {
							e.stopPropagation();
							navigate(groupLink);
						}}
						style={{
							fontSize: '12px',
							color: '#3b82f6',
							background: 'none',
							border: 'none',
							padding: 0,
							cursor: 'pointer',
						}}>
						View details
					</button>
					<span style={{ fontSize: '18px', color: '#6b7280' }}>
						{isExpanded ? '▼' : '▶'}
					</span>
				</div>
			</div>

			{isExpanded && (
				<>
					{records.slice(0, 2).map((record) => (
						<MaintenanceHistoryCard
							key={record.id}
							record={record}
							units={units}
							propertySlug={propertySlug}
							onDelete={onDelete}
							isGroupedView={true}
							groupRecords={records}
							isSelected={selectedRecordIds.has(record.id)}
							onSelectionChange={onToggleRecordSelection}
						/>
					))}
					{records.length > 2 && (
						<div
							style={{
								marginTop: '6px',
								fontSize: '12px',
								color: '#6b7280',
							}}>
							Showing last 2. View details for full history.
						</div>
					)}
				</>
			)}
		</div>
	);
};

const MaintenanceHistoryCard: React.FC<MaintenanceHistoryCardProps> = ({
	record,
	units,
	propertySlug,
	onDelete,
	isGroupedView: _isGroupedView = false,
	groupRecords: _groupRecords = [],
	isSelected = false,
	onSelectionChange,
}) => {
	const navigate = useNavigate();

	const getMaintenanceGroupId = (record: any): string | undefined => {
		return record.maintenanceGroupId;
	};

	const recordGroupId = getMaintenanceGroupId(record) || record.id;
	const recordLink =
		recordGroupId && !record.isLegacy
			? `/property/${propertySlug}/maintenance-history/${encodeURIComponent(
					recordGroupId,
			  )}`
			: null;

	const getUnitName = (unitId?: string) => {
		if (!unitId) return '';
		const unit = units.find((u) => u.id === unitId);
		return unit ? unit.unitName : '';
	};

	return (
		<>
			<div
				style={{
					background: isSelected ? '#eff6ff' : 'white',
					borderRadius: '8px',
					padding: '16px',
					boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
					border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
				}}>
				{/* Header */}
				<div
					style={{
						marginBottom: '12px',
						display: 'flex',
						alignItems: 'flex-start',
						gap: '12px',
					}}>
					{onSelectionChange && (
						<input
							type='checkbox'
							checked={isSelected}
							onChange={() => onSelectionChange(record.id)}
							style={{
								marginTop: '2px',
								cursor: 'pointer',
								width: '18px',
								height: '18px',
							}}
						/>
					)}
					<div style={{ flex: 1 }}>
						<h3
							style={{
								margin: '0 0 4px 0',
								fontSize: '16px',
								fontWeight: '600',
							}}>
							{record.title}
						</h3>
						<p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
							{new Date(record.completionDate).toLocaleDateString()}
							{record.unitId && (
								<span style={{ marginLeft: '8px', fontWeight: '500' }}>
									• {getUnitName(record.unitId)}
								</span>
							)}
						</p>
					</div>
				</div>

				{/* Completed By */}
				{record.completedByName && (
					<div style={{ marginBottom: '8px' }}>
						<span style={{ fontSize: '14px', fontWeight: '500' }}>
							Completed by:
						</span>
						<span
							style={{ marginLeft: '4px', fontSize: '14px', color: '#374151' }}>
							{record.completedByName}
						</span>
					</div>
				)}

				{/* Notes */}
				{record.completionNotes && (
					<div style={{ marginBottom: '8px' }}>
						<span style={{ fontSize: '14px', fontWeight: '500' }}>Notes:</span>
						<p
							style={{
								margin: '4px 0 0 0',
								fontSize: '14px',
								color: '#374151',
							}}>
							{record.completionNotes}
						</p>
					</div>
				)}

				{/* File Attachment */}
				{record.completionFile && (
					<div style={{ marginBottom: '8px' }}>
						<span style={{ fontSize: '14px', fontWeight: '500' }}>
							Attachment:
						</span>
						<a
							href={record.completionFile.url}
							target='_blank'
							rel='noopener noreferrer'
							style={{
								marginLeft: '4px',
								fontSize: '14px',
								color: '#3b82f6',
								textDecoration: 'none',
							}}>
							📎 {record.completionFile.name}
						</a>
					</div>
				)}

				{/* Action Buttons */}
				<div style={{ marginTop: '12px', textAlign: 'right' }}>
					{recordLink && (
						<button
							onClick={() => {
								navigate(recordLink);
							}}
							style={{
								padding: '4px 8px',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '12px',
								marginRight: '6px',
							}}>
							View details
						</button>
					)}
					{onDelete && (
						<button
							onClick={() => onDelete!(record.id)}
							style={{
								padding: '6px 12px',
								background: '#ef4444',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '12px',
							}}>
							Delete
						</button>
					)}
				</div>
			</div>
		</>
	);
};
