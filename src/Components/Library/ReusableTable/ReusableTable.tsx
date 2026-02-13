import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
	TableContainer,
	StyledTable,
	ActionButton,
	EmptyState,
} from './ReusableTable.styles';

export interface Column {
	header: string;
	accessor: string;
	type?: 'text' | 'dropdown' | 'date';
	options?: string[] | ((row: any) => string[]);
}

export interface Action {
	label: string;
	icon: IconDefinition;
	onClick: (row: any, index: number) => void;
	className?: string;
	disabled?: (row: any) => boolean;
}

export interface ReusableTableProps {
	columns: Column[];
	rowData: any[];
	onRowSelect?: (selectedRowIds: Set<string>) => void;
	onRowEdit?: (rowIndex: number, updatedRow: any) => void;
	onRowDoubleClick?: (rowId: string) => void;
	selectedRows?: Set<string>;
	onSelectAll?: (checked: boolean, selectedRowIds: string[]) => void;
	onRowUpdate?: (updatedRow: any) => void;
	showCheckbox?: boolean;
	actions?: Action[];
	showActionsColumn?: boolean;
	emptyMessage?: string;
}

export const ReusableTable: React.FC<ReusableTableProps> = ({
	columns,
	rowData,
	onRowSelect,
	onRowEdit,
	onRowDoubleClick,
	selectedRows = new Set(),
	onSelectAll,
	onRowUpdate,
	showCheckbox = true,
	actions = [],
	showActionsColumn = true,
	emptyMessage = 'No data available',
}) => {
	const handleRowSelect = (rowId: string) => {
		const updatedSelection = new Set(selectedRows);
		if (updatedSelection.has(rowId)) {
			updatedSelection.delete(rowId);
		} else {
			updatedSelection.add(rowId);
		}
		onRowSelect?.(updatedSelection);
	};

	const handleRowEdit = (index: number, updatedRow: any) => {
		const updatedRowData = [...rowData];
		updatedRowData[index] = updatedRow;
		onRowEdit?.(index, updatedRow);
		onRowUpdate?.(updatedRow);
	};

	return (
		<TableContainer>
			{rowData.length === 0 ? (
				<EmptyState>
					<p>{emptyMessage}</p>
				</EmptyState>
			) : (
				<StyledTable>
					<thead>
						<tr>
							{showCheckbox && (
								<th>
									<input
										type='checkbox'
										onChange={(e) => {
											const allSelected = e.target.checked;
											const updatedSelection = allSelected
												? rowData.map((row) => row.id)
												: [];
											onSelectAll?.(allSelected, updatedSelection);
										}}
										checked={
											selectedRows.size === rowData.length && rowData.length > 0
										}
									/>
								</th>
							)}
							{columns.map((col, index) => (
								<th key={index}>{col.header}</th>
							))}
							{showActionsColumn && actions.length > 0 && <th>Actions</th>}
						</tr>
					</thead>
					<tbody>
						{rowData.map((row, index) => (
							<tr key={index} onDoubleClick={() => onRowDoubleClick?.(row.id)}>
								{showCheckbox && (
									<td>
										<input
											type='checkbox'
											checked={selectedRows.has(row.id)}
											onChange={() => handleRowSelect(row.id)}
										/>
									</td>
								)}
								{columns.map((col, colIndex) => {
									const columnOptions = col.options
										? typeof col.options === 'function'
											? col.options(row)
											: col.options
										: [];

									return (
										<td key={colIndex}>
											{col.type === 'dropdown' && columnOptions.length > 0 ? (
												<select
													value={row[col.accessor] || ''}
													onChange={(e) =>
														handleRowEdit(index, {
															...row,
															[col.accessor]: e.target.value,
														})
													}>
													<option value=''>-- Select --</option>
													{columnOptions.map((option, optIndex) => (
														<option key={optIndex} value={option}>
															{option}
														</option>
													))}
												</select>
											) : (
												<div
													contentEditable
													suppressContentEditableWarning
													onBlur={(e) =>
														handleRowEdit(index, {
															...row,
															[col.accessor]: e.currentTarget.textContent,
														})
													}>
													{row[col.accessor]}
												</div>
											)}
										</td>
									);
								})}
								{showActionsColumn && actions.length > 0 && (
									<td>
										<div style={{ display: 'flex', gap: '8px' }}>
											{actions.map((action, actionIndex) => {
												const isDisabled = action.disabled?.(row) || false;
												return (
													<ActionButton
														key={actionIndex}
														onClick={() => action.onClick(row, index)}
														className={action.className}
														disabled={isDisabled}
														title={action.label}>
														<FontAwesomeIcon icon={action.icon} />
													</ActionButton>
												);
											})}
										</div>
									</td>
								)}
							</tr>
						))}
					</tbody>
				</StyledTable>
			)}
		</TableContainer>
	);
};
