import { styled } from 'styled-components';

export const ActionButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	color: #374151;
	transition: background-color 0.2s ease;

	&:hover:not(:disabled) {
		background-color: #f3f4f6;
	}

	&:disabled {
		color: #9ca3af;
		cursor: not-allowed;
	}

	&.delete {
		color: #dc2626;

		&:hover:not(:disabled) {
			background-color: #fef2f2;
		}
	}
`;

export const TableContainer = styled.div`
	overflow-x: auto;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	background-color: #fff;
`;

export const StyledTable = styled.table`
	width: 100%;
	border-collapse: collapse;

	thead {
		background-color: #f3f4f6;
	}

	th,
	td {
		padding: 12px;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		text-align: left;
	}

	tbody tr:hover {
		background-color: #f9fafb;
	}

	select {
		width: auto;
		max-width: 100%;
		padding: 6px 8px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 14px;
		background-color: #fff;
		cursor: pointer;

		&:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}
	}
`;

export const EmptyState = styled.div`
	text-align: center;
	padding: 40px 20px;
	color: #6b7280;

	p {
		margin: 0;
		font-size: 14px;
	}
`;
