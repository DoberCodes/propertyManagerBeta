import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDetailPageData } from '../Hooks/useDetailPageData';
import {
	SectionContainer,
	SectionHeader,
} from '../Components/Library/InfoCards/InfoCardStyles';
import {
	GridContainer,
	GridTable,
	EmptyState,
} from '../Components/Library/DataGrid/DataGridStyles';

export const MaintenanceHistoryGroupPage: React.FC = () => {
	const { slug, groupId } = useParams<{ slug: string; groupId: string }>();
	const { property, tasks, maintenanceHistory } = useDetailPageData({
		propertySlug: slug || '',
		entityType: 'property',
	});

	const groupRecords = useMemo(() => {
		if (!groupId) return [];
		const records = maintenanceHistory.filter((record: any) => {
			const recordGroupId =
				record.maintenanceGroupId || record.recurringTaskId || record.id;
			return recordGroupId && String(recordGroupId) === String(groupId);
		});
		return records.sort(
			(a: any, b: any) =>
				new Date(b.completionDate).getTime() -
				new Date(a.completionDate).getTime(),
		);
	}, [maintenanceHistory, groupId]);

	const linkedTaskIds = useMemo(() => {
		const ids = new Set<string>();
		groupRecords.forEach((record: any) => {
			(record.linkedTaskIds || []).forEach((id: string) => ids.add(id));
		});
		return Array.from(ids);
	}, [groupRecords]);

	const linkedTasks = useMemo(() => {
		if (!linkedTaskIds.length) return [];
		return tasks.filter((task: any) => linkedTaskIds.includes(task.id));
	}, [tasks, linkedTaskIds]);

	const missingLinkedTaskIds = useMemo(() => {
		const existing = new Set(linkedTasks.map((task: any) => task.id));
		return linkedTaskIds.filter((id) => !existing.has(id));
	}, [linkedTaskIds, linkedTasks]);

	const dateRange = useMemo(() => {
		if (!groupRecords.length) return 'N/A';
		const newest = groupRecords[0]?.completionDate;
		const oldest = groupRecords[groupRecords.length - 1]?.completionDate;
		if (!newest || !oldest) return 'N/A';
		return `${new Date(oldest).toLocaleDateString()} - ${new Date(
			newest,
		).toLocaleDateString()}`;
	}, [groupRecords]);

	if (!property) {
		return (
			<SectionContainer>
				<EmptyState>
					<p>Property not found</p>
				</EmptyState>
			</SectionContainer>
		);
	}

	return (
		<SectionContainer>
			<SectionHeader>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
					<div style={{ fontSize: '12px', color: '#6b7280' }}>
						<Link
							to={`/property/${property.slug}`}
							style={{
								color: '#3b82f6',
								textDecoration: 'none',
								fontWeight: 500,
							}}>
							{property.title}
						</Link>
						<span style={{ margin: '0 6px' }}>/</span>
						<span>Maintenance History</span>
					</div>
					<div>Maintenance History Group</div>
				</div>
			</SectionHeader>

			{groupRecords.length === 0 ? (
				<EmptyState>
					<p>No maintenance history found for this group</p>
				</EmptyState>
			) : (
				<>
					<div
						style={{
							background: 'white',
							border: '1px solid #e5e7eb',
							borderRadius: '8px',
							padding: '16px',
							marginBottom: '16px',
						}}>
						<div style={{ fontWeight: '600', marginBottom: '4px' }}>
							{groupRecords[0].title || 'Maintenance'}
						</div>
						<div style={{ fontSize: '12px', color: '#6b7280' }}>
							Instances: {groupRecords.length} | Date Range: {dateRange}
						</div>
					</div>

					<GridContainer>
						<GridTable>
							<thead>
								<tr>
									<th>Date</th>
									<th>Completed By</th>
									<th>Notes</th>
									<th>Attachments</th>
								</tr>
							</thead>
							<tbody>
								{groupRecords.map((record: any) => (
									<tr key={record.id}>
										<td>
											{record.completionDate
												? new Date(record.completionDate).toLocaleDateString()
												: '-'}
										</td>
										<td>
											{record.completedByName || record.completedBy || '-'}
										</td>
										<td>{record.completionNotes || record.notes || '-'}</td>
										<td>
											{record.completionFile?.url ? (
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
								))}
							</tbody>
						</GridTable>
					</GridContainer>

					<div
						style={{
							marginTop: '20px',
							background: 'white',
							border: '1px solid #e5e7eb',
							borderRadius: '8px',
							padding: '16px',
						}}>
						<div style={{ fontWeight: '600', marginBottom: '8px' }}>
							Linked Tasks
						</div>
						{linkedTasks.length === 0 ? (
							<p style={{ margin: 0, color: '#6b7280' }}>
								No tasks linked to this group
							</p>
						) : (
							<ul style={{ margin: 0, paddingLeft: '18px' }}>
								{linkedTasks.map((task: any) => (
									<li key={task.id} style={{ marginBottom: '6px' }}>
										{task.title} ({task.status}) - Due:{' '}
										{task.dueDate
											? new Date(task.dueDate).toLocaleDateString()
											: 'N/A'}
									</li>
								))}
							</ul>
						)}
						{missingLinkedTaskIds.length > 0 && (
							<div style={{ marginTop: '8px', color: '#9ca3af' }}>
								Missing task records: {missingLinkedTaskIds.join(', ')}
							</div>
						)}
					</div>
				</>
			)}
		</SectionContainer>
	);
};
