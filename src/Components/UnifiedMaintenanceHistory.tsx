import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UnifiedMaintenanceHistoryProps {
	records: Array<any>;
	units: Array<any>;
	onNavigate?: (record: any) => void;
	/*onDelete?: (record: any) => void;*/ // Commented out since individual delete is not currently used
	onDelete?: (record: any) => void;
	groupId?: string;
	onDeleteGroup?: (records: Array<any>) => void;
}

export const UnifiedMaintenanceHistory: React.FC<
	UnifiedMaintenanceHistoryProps
> = ({ records, units, onNavigate, /*onDelete,*/ groupId, onDeleteGroup }) => {
	const navigate = useNavigate();
	const [isExpanded, setIsExpanded] = useState(false);
	const latestRecord = records[0]; // Records are sorted by date, newest first

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
			{groupId && (
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
							Latest:{' '}
							{new Date(latestRecord.completionDate).toLocaleDateString()}
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
								onDeleteGroup?.(records);
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
						<button
							onClick={(e) => {
								e.stopPropagation();
								onNavigate?.(records);
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
			)}

			{/* Records */}
			{!groupId || isExpanded
				? records.map((record) => (
						<div key={record.id} style={{ marginBottom: '8px' }}>
							<p>{record.title}</p>
							{/* Additional record details */}
							<button
								onClick={(e) => {
									e.stopPropagation();
									onDeleteGroup?.(records);
								}}
								style={{
									fontSize: '12px',
									color: '#ef4444',
									background: 'none',
									border: 'none',
									padding: 0,
									cursor: 'pointer',
								}}>
								Delete record
							</button>
							<button
								onClick={(e) => {
									e.stopPropagation();
									onNavigate?.(record);
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
						</div>
				  ))
				: null}
		</div>
	);
};
