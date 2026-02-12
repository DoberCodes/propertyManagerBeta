import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaintenanceTabProps } from '../../../types/PropertyDetailPage.types';
import { GenericModal } from '../../../Components/Library';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	GridContainer,
	GridTable,
	EmptyState,
	Toolbar,
	ToolbarButton,
} from '../PropertyDetailPage.styles';
import { getDeviceNameUtil } from '../PropertyDetailPage.utils';
import {
	FilterBar,
	FilterConfig,
	FilterValues,
} from '../../../Components/Library/FilterBar';
import { applyFilters } from '../../../utils/tableFilters';

// Link Task Modal Component
interface LinkTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit?: (linkedTaskIds: string[]) => void;
	tasks: any[];
	currentLinkedTaskIds?: string[];
	propertyId: string;
}

const LinkTaskModal: React.FC<LinkTaskModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	tasks,
	currentLinkedTaskIds = [],
	propertyId,
}) => {
	const [selectedTaskIds, setSelectedTaskIds] =
		useState<string[]>(currentLinkedTaskIds);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit?.(selectedTaskIds);
		setSelectedTaskIds([]);
		onClose();
	};

	const handleTaskToggle = (taskId: string) => {
		setSelectedTaskIds((prev) =>
			prev.includes(taskId)
				? prev.filter((id) => id !== taskId)
				: [...prev, taskId],
		);
	};

	// Filter tasks to only show those for the current property and not completed (unless already linked)
	const availableTasks = tasks.filter(
		(task) =>
			task.propertyId === propertyId &&
			(task.status !== 'Completed' || currentLinkedTaskIds.includes(task.id)),
	);

	return (
		<GenericModal
			isOpen={isOpen}
			title='Link Tasks to Maintenance History'
			onClose={onClose}
			showActions={true}
			primaryButtonLabel='Link Tasks'
			secondaryButtonLabel='Cancel'
			onSubmit={handleSubmit}>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
					Select tasks to link to this maintenance history record. Linked tasks
					will be associated with this maintenance activity.
				</p>

				<div style={{ maxHeight: '300px', overflowY: 'auto' }}>
					{availableTasks.length > 0 ? (
						availableTasks.map((task) => (
							<div
								key={task.id}
								style={{
									display: 'flex',
									alignItems: 'center',
									padding: '8px',
									border: '1px solid #e5e7eb',
									borderRadius: '4px',
									marginBottom: '8px',
									backgroundColor: selectedTaskIds.includes(task.id)
										? '#eff6ff'
										: 'white',
								}}>
								<input
									type='checkbox'
									checked={selectedTaskIds.includes(task.id)}
									onChange={() => handleTaskToggle(task.id)}
									style={{ marginRight: '8px' }}
								/>
								<div style={{ flex: 1 }}>
									<div style={{ fontWeight: '500', fontSize: '14px' }}>
										{task.title}
									</div>
									<div style={{ fontSize: '12px', color: '#6b7280' }}>
										Status: {task.status} • Due:{' '}
										{new Date(task.dueDate).toLocaleDateString()}
										{task.priority && ` • Priority: ${task.priority}`}
									</div>
								</div>
							</div>
						))
					) : (
						<p
							style={{
								textAlign: 'center',
								color: '#6b7280',
								fontSize: '14px',
							}}>
							No available tasks to link
						</p>
					)}
				</div>
			</div>
		</GenericModal>
	);
};

// Add Maintenance History Modal Component
interface AddMaintenanceHistoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit?: (data: {
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
	property: any;
	units: any[];
	teamMembers: any[];
	contractors: any[];
	familyMembers: any[];
	tasks: any[];
}

const AddMaintenanceHistoryModal: React.FC<AddMaintenanceHistoryModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	property,
	units,
	teamMembers,
	contractors,
	familyMembers,
	tasks,
}) => {
	const [formData, setFormData] = useState({
		title: '',
		completionDate: '',
		completedBy: '',
		completedByName: '',
		completionNotes: '',
		unitId: '',
		completionFile: null as File | null,
	});
	const [completedByMode, setCompletedByMode] = useState<'dropdown' | 'custom'>(
		'dropdown',
	);
	const [showLinkTaskModal, setShowLinkTaskModal] = useState(false);
	const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>([]);

	// Generate completed by options from available data sources
	const completedByOptions = React.useMemo(() => {
		const options: Array<{ value: string; label: string; type: string }> = [];

		// Add family members
		familyMembers.forEach((member) => {
			options.push({
				value: `family-${member.id}`,
				label: `${member.firstName} ${member.lastName} (Family)`,
				type: 'family',
			});
		});

		// Add contractors
		contractors.forEach((contractor) => {
			options.push({
				value: `contractor-${contractor.id}`,
				label: `${contractor.companyName || contractor.name} (Contractor)`,
				type: 'contractor',
			});
		});

		// Add team members
		teamMembers.forEach((member) => {
			options.push({
				value: `team-${member.id}`,
				label: `${member.firstName} ${member.lastName} (Team)`,
				type: 'team',
			});
		});

		// Add custom option
		options.push({
			value: 'custom',
			label: 'Enter custom name...',
			type: 'custom',
		});

		return options;
	}, [familyMembers, contractors, teamMembers]);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleCompletedByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		if (value === 'custom') {
			setCompletedByMode('custom');
			setFormData((prev) => ({
				...prev,
				completedBy: '',
				completedByName: '',
			}));
		} else {
			setCompletedByMode('dropdown');
			const [, id] = value.split('-');
			setFormData((prev) => ({
				...prev,
				completedBy: id,
				completedByName: '',
			}));
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] || null;
		setFormData((prev) => ({
			...prev,
			completionFile: file,
		}));
	};

	const handleLinkTasks = (taskIds: string[]) => {
		setLinkedTaskIds(taskIds);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const data = {
			title: formData.title,
			completionDate: formData.completionDate,
			completedBy:
				completedByMode === 'dropdown' ? formData.completedBy : undefined,
			completedByName:
				completedByMode === 'custom' ? formData.completedByName : undefined,
			completionNotes: formData.completionNotes,
			unitId: formData.unitId,
			completionFile: formData.completionFile || undefined,
			linkedTaskIds: linkedTaskIds.length > 0 ? linkedTaskIds : undefined,
		};

		onSubmit?.(data);

		// Reset form
		setFormData({
			title: '',
			completionDate: '',
			completedBy: '',
			completedByName: '',
			completionNotes: '',
			unitId: '',
			completionFile: null,
		});
		setCompletedByMode('dropdown');
		setLinkedTaskIds([]);
		setShowLinkTaskModal(false);
		onClose();
	};

	return [
		<GenericModal
			key='main-modal'
			isOpen={isOpen}
			title='Add Maintenance History'
			onClose={onClose}
			showActions={true}
			primaryButtonLabel='Add History'
			secondaryButtonLabel='Cancel'
			onSubmit={handleSubmit}>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<div>
					<label
						style={{
							display: 'block',
							marginBottom: '4px',
							fontWeight: 'bold',
						}}>
						Task Title *
					</label>
					<input
						type='text'
						name='title'
						value={formData.title}
						onChange={handleChange}
						placeholder='e.g., Fixed leaking faucet'
						style={{
							width: '100%',
							padding: '8px',
							border: '1px solid #ccc',
							borderRadius: '4px',
							fontSize: '14px',
						}}
						required
					/>
				</div>

				<div>
					<label
						style={{
							display: 'block',
							marginBottom: '4px',
							fontWeight: 'bold',
						}}>
						Completion Date *
					</label>
					<input
						type='date'
						name='completionDate'
						value={formData.completionDate}
						onChange={handleChange}
						style={{
							width: '100%',
							padding: '8px',
							border: '1px solid #ccc',
							borderRadius: '4px',
							fontSize: '14px',
						}}
						required
					/>
				</div>

				{property?.propertyType === 'Multi-Family' && units.length > 0 && (
					<div>
						<label
							style={{
								display: 'block',
								marginBottom: '4px',
								fontWeight: 'bold',
							}}>
							Unit
						</label>
						<select
							name='unitId'
							value={formData.unitId}
							onChange={handleChange}
							style={{
								width: '100%',
								padding: '8px',
								border: '1px solid #ccc',
								borderRadius: '4px',
								fontSize: '14px',
							}}>
							<option value=''>Property Level</option>
							{units.map((unit) => (
								<option key={unit.id} value={unit.id}>
									{unit.unitNumber || unit.address || `Unit ${unit.id}`}
								</option>
							))}
						</select>
					</div>
				)}

				<div>
					<label
						style={{
							display: 'block',
							marginBottom: '4px',
							fontWeight: 'bold',
						}}>
						Completed By
					</label>
					{completedByMode === 'dropdown' ? (
						<select
							value={
								formData.completedBy
									? familyMembers.find((m) => m.id === formData.completedBy)
										? `family-${formData.completedBy}`
										: contractors.find((c) => c.id === formData.completedBy)
										? `contractor-${formData.completedBy}`
										: teamMembers.find((t) => t.id === formData.completedBy)
										? `team-${formData.completedBy}`
										: ''
									: ''
							}
							onChange={handleCompletedByChange}
							style={{
								width: '100%',
								padding: '8px',
								border: '1px solid #ccc',
								borderRadius: '4px',
								fontSize: '14px',
							}}>
							<option value=''>Select from existing...</option>
							{completedByOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					) : (
						<div>
							<input
								type='text'
								name='completedByName'
								value={formData.completedByName}
								onChange={handleChange}
								placeholder='e.g., John Doe or ABC Plumbing'
								style={{
									width: '100%',
									padding: '8px',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '14px',
								}}
							/>
							<button
								type='button'
								onClick={() => {
									setCompletedByMode('dropdown');
									setFormData((prev) => ({
										...prev,
										completedBy: '',
										completedByName: '',
									}));
								}}
								style={{
									marginTop: '4px',
									padding: '4px 8px',
									background: 'none',
									border: 'none',
									color: '#3b82f6',
									cursor: 'pointer',
									fontSize: '12px',
									textDecoration: 'underline',
								}}>
								Select from existing instead
							</button>
						</div>
					)}
					{completedByMode === 'dropdown' && (
						<small
							style={{
								color: '#6b7280',
								fontSize: '12px',
								marginTop: '4px',
								display: 'block',
							}}>
							Can't find who you're looking for? Select "Enter custom name..."
							to add manually.
						</small>
					)}
				</div>

				<div>
					<label
						style={{
							display: 'block',
							marginBottom: '4px',
							fontWeight: 'bold',
						}}>
						Notes
					</label>
					<textarea
						name='completionNotes'
						value={formData.completionNotes}
						onChange={handleChange}
						placeholder='Additional details about the maintenance...'
						rows={3}
						style={{
							width: '100%',
							padding: '8px',
							border: '1px solid #ccc',
							borderRadius: '4px',
							fontSize: '14px',
							resize: 'vertical',
						}}
					/>
				</div>

				<div>
					<label
						style={{
							display: 'block',
							marginBottom: '4px',
							fontWeight: 'bold',
						}}>
						Attachment (optional)
					</label>
					<input
						type='file'
						accept='image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx'
						onChange={handleFileChange}
						style={{
							width: '100%',
							padding: '8px',
							border: '1px solid #ccc',
							borderRadius: '4px',
							fontSize: '14px',
						}}
					/>
					<small style={{ color: '#6b7280', fontSize: '12px' }}>
						Supported formats: Images, PDF, Word, Excel, Text (max 10MB)
					</small>
					{formData.completionFile && (
						<div
							style={{ marginTop: '4px', fontSize: '14px', color: '#059669' }}>
							Selected: {formData.completionFile.name}
						</div>
					)}
				</div>

				<div>
					<label
						style={{
							display: 'block',
							marginBottom: '4px',
							fontWeight: 'bold',
						}}>
						Link Tasks (optional)
					</label>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<button
							type='button'
							onClick={() => setShowLinkTaskModal(true)}
							style={{
								padding: '8px 16px',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '14px',
							}}>
							🔗 Link Tasks ({linkedTaskIds.length})
						</button>
						{linkedTaskIds.length > 0 && (
							<span style={{ fontSize: '14px', color: '#6b7280' }}>
								{linkedTaskIds.length} task
								{linkedTaskIds.length !== 1 ? 's' : ''} linked
							</span>
						)}
					</div>
					<small
						style={{
							color: '#6b7280',
							fontSize: '12px',
							marginTop: '4px',
							display: 'block',
						}}>
						Link related tasks to this maintenance history record for better
						tracking and auditing.
					</small>
				</div>
			</div>
		</GenericModal>,

		showLinkTaskModal ? (
			<LinkTaskModal
				key='link-task-modal'
				isOpen={showLinkTaskModal}
				onClose={() => setShowLinkTaskModal(false)}
				onSubmit={handleLinkTasks}
				tasks={tasks}
				currentLinkedTaskIds={linkedTaskIds}
				propertyId={property.id}
			/>
		) : null,
	];
};

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({
	property,
	maintenanceHistoryRecords = [],
	units = [],
	teamMembers = [],
	contractors = [],
	familyMembers = [],
	tasks = [],
	onAddMaintenanceHistory,
	onUpdateMaintenanceHistory,
	onDeleteMaintenanceHistory,
}) => {
	const navigate = useNavigate();
	const [filters, setFilters] = useState<FilterValues>({});
	const [showAddModal, setShowAddModal] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	// Mobile detection
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

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

	const getMaintenanceGroupId = (record: any): string | undefined => {
		return record.maintenanceGroupId || record.recurringTaskId;
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
						placeholder='Search tasks, notes...'
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
								tasks={tasks}
								propertyId={property.id}
								propertySlug={property.slug}
								onDelete={onDeleteMaintenanceHistory}
								onUpdate={onUpdateMaintenanceHistory}
							/>
						))}
						{/* Display ungrouped records */}
						{groupedRecords.ungrouped.map((record) => (
							<MaintenanceHistoryCard
								key={record.id}
								record={record}
								units={units}
								tasks={tasks}
								propertyId={property.id}
								onDelete={onDeleteMaintenanceHistory}
								onUpdate={onUpdateMaintenanceHistory}
							/>
						))}
					</div>
				) : (
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
														property?.propertyType === 'Multi-Family' ? 7 : 6
													}
													style={{ padding: '12px' }}>
													<div
														style={{
															display: 'flex',
															alignItems: 'center',
															fontWeight: '600',
														}}>
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
													{/* Show all instances in the group */}
													<div style={{ marginTop: '8px' }}>
														{records.map((record) => (
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
					tasks={tasks}
				/>
			)}
		</SectionContainer>
	);
};

// Maintenance History Card Component for Mobile Carousel
interface MaintenanceHistoryCardProps {
	record: any;
	units: any[];
	tasks: any[];
	propertyId: string;
	onDelete?: (id: string) => void;
	onUpdate?: (id: string, updates: Partial<any>) => void;
	isGroupedView?: boolean;
	groupRecords?: any[];
}

interface MaintenanceHistoryGroupProps {
	groupId: string;
	records: any[];
	units: any[];
	tasks: any[];
	propertyId: string;
	propertySlug: string;
	onDelete?: (historyId: string) => void;
	onUpdate?: (id: string, updates: Partial<any>) => void;
}

const MaintenanceHistoryGroup: React.FC<MaintenanceHistoryGroupProps> = ({
	groupId,
	records,
	units,
	tasks,
	propertyId,
	propertySlug,
	onDelete,
	onUpdate,
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
				<div>
					{records.map((record) => (
						<MaintenanceHistoryCard
							key={record.id}
							record={record}
							units={units}
							tasks={tasks}
							propertyId={propertyId}
							onDelete={onDelete}
							onUpdate={onUpdate}
							isGroupedView={true}
							groupRecords={records}
						/>
					))}
				</div>
			)}
		</div>
	);
};

const MaintenanceHistoryCard: React.FC<MaintenanceHistoryCardProps> = ({
	record,
	units,
	tasks,
	propertyId,
	onDelete,
	onUpdate,
	isGroupedView: _isGroupedView = false,
	groupRecords: _groupRecords = [],
}) => {
	const [showLinkTaskModal, setShowLinkTaskModal] = useState(false);
	const getUnitName = (unitId?: string) => {
		if (!unitId) return '';
		const unit = units.find((u) => u.id === unitId);
		return unit ? unit.unitName : '';
	};

	// Get linked tasks for this record
	const linkedTasks = React.useMemo(() => {
		if (!record.linkedTaskIds || !tasks.length) return [];
		return tasks.filter((task) => record.linkedTaskIds.includes(task.id));
	}, [record.linkedTaskIds, tasks]);

	// Handle linking tasks
	const handleLinkTasks = (linkedTaskIds: string[]) => {
		if (onUpdate) {
			const currentLinkedTaskIds = record.linkedTaskIds || [];
			const updatedLinkedTaskIds = [
				...new Set([...currentLinkedTaskIds, ...linkedTaskIds]),
			];
			onUpdate(record.id, { linkedTaskIds: updatedLinkedTaskIds });
		}
	};
	return (
		<>
			<div
				style={{
					background: 'white',
					borderRadius: '8px',
					padding: '16px',
					boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
					border: '1px solid #e5e7eb',
				}}>
				{/* Header */}
				<div style={{ marginBottom: '12px' }}>
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

				{/* Linked Tasks */}
				{linkedTasks.length > 0 && (
					<div style={{ marginBottom: '8px' }}>
						<span style={{ fontSize: '14px', fontWeight: '500' }}>
							Linked Tasks:
						</span>
						<div style={{ marginTop: '4px' }}>
							{linkedTasks.map((task) => (
								<div
									key={task.id}
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginBottom: '2px',
									}}>
									• {task.title} ({task.status})
								</div>
							))}
						</div>
					</div>
				)}

				{/* Link Task Button */}
				{onUpdate && (
					<div style={{ marginTop: '12px', textAlign: 'right' }}>
						<button
							onClick={() => setShowLinkTaskModal(true)}
							style={{
								padding: '4px 8px',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '12px',
								marginRight: '8px',
							}}>
							🔗 Link Task
						</button>
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
				)}
			</div>

			{/* Link Task Modal */}
			{showLinkTaskModal && (
				<LinkTaskModal
					isOpen={showLinkTaskModal}
					onClose={() => setShowLinkTaskModal(false)}
					onSubmit={handleLinkTasks}
					tasks={tasks}
					currentLinkedTaskIds={record.linkedTaskIds || []}
					propertyId={propertyId}
				/>
			)}
		</>
	);
};
