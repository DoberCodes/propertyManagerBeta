import styled from 'styled-components';
import { COLORS } from 'constants/colors';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 30px;
	padding: 40px;

	@media (max-width: 1024px) {
		padding: 15px;
		gap: 15px;
	}

	@media (max-width: 480px) {
		padding: 10px;
		gap: 10px;
	}
`;

export const TaskGridSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;
	flex: 1;
	min-height: clamp(240px, 35vh, 400px);

	@media (max-width: 1024px) {
		display: none;
	}
`;

export const TaskGridHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 10px;

	@media (max-width: 480px) {
		gap: 5px;
	}
`;

export const FilterSection = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;

	label {
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	select {
		padding: 6px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		color: #1f2937;
		background: white;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			border-color: #3b82f6;
		}

		&:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}
	}

	@media (max-width: 480px) {
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		padding: 10px;
	}
`;

export const TaskGridTitle = styled.h2`
	font-size: 20px;
	font-weight: 700;
	color: #1f2937;
	margin: 0;

	@media (max-width: 1024px) {
		font-size: 18px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;

export const ActionButton = styled.button`
	position: relative;
	background-color: transparent;
	color: #999999;
	border: none;
	border-radius: 50%;
	width: 40px;
	height: 40px;
	font-size: 24px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.2s ease;

	&:hover {
		color: #666666;
	}

	@media (max-width: 480px) {
		width: 36px;
		height: 36px;
		font-size: 20px;
	}
`;

export const ActionDropdown = styled.div`
	position: absolute;
	top: 100%;
	right: 0;
	background-color: white;
	border: 1px solid #ccc;
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	z-index: 1000;
	min-width: 150px;
	margin-top: 8px;
	overflow: hidden;

	@media (max-width: 480px) {
		min-width: 130px;
		margin-top: 4px;
	}
`;

export const DropdownItem = styled.button`
	display: block;
	width: 100%;
	padding: 12px 15px;
	background: none;
	border: none;
	color: black;
	text-align: left;
	font-size: 14px;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:first-child {
		border-radius: 4px 4px 0 0;
	}

	&:last-child {
		border-radius: 0 0 4px 4px;
	}

	&:hover {
		background-color: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}

	@media (max-width: 480px) {
		padding: 10px 12px;
		font-size: 12px;
	}
`;

export const TableWrapper = styled.div`
	overflow-x: auto;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	flex: 1;

	@media (max-width: 480px) {
		border-radius: 2px;
	}
`;

export const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	background-color: white;

	thead {
		background-color: #f5f5f5;
		border-bottom: 2px solid #e0e0e0;
		position: sticky;
		top: 0;
	}

	th {
		padding: 12px 16px;
		text-align: left;
		font-weight: 600;
		color: black;
		font-size: 14px;

		@media (max-width: 1024px) {
			padding: 10px 12px;
			font-size: 12px;
		}

		@media (max-width: 480px) {
			padding: 8px 10px;
			font-size: 11px;
		}
	}

	td {
		padding: 12px 16px;
		border-bottom: 1px solid #e0e0e0;
		color: black;
		font-size: 14px;

		@media (max-width: 1024px) {
			padding: 10px 12px;
			font-size: 12px;
		}

		@media (max-width: 480px) {
			padding: 8px 10px;
			font-size: 11px;
		}
	}

	tr:hover {
		background-color: #fafafa;
	}
`;

export const BottomSectionsWrapper = styled.div`
	display: flex;
	gap: 20px;
	justify-content: center;
	flex-shrink: 0;
	width: 100%;
	@media (max-width: 1024px) {
		gap: 14px;
	}

	@media (max-width: 480px) {
		gap: 10px;
	}
`;

export const TopChartsContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20px;
	flex-shrink: 0;
	min-height: clamp(200px, 25vh, 320px);

	@media (max-width: 1024px) {
		gap: 16px;
	}

	@media (max-width: 1024px) {
		display: none;
	}
`;

export const Section = styled.div`
	background-color: white;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	height: 100%;
	width: 100%;
	min-height: clamp(200px, 25vh, 320px);

	&.mobile-seasonal {
		display: none;

		@media (max-width: 1024px) {
			display: flex;
		}
	}

	@media (max-width: 1024px) {
		border-radius: 6px;
		min-height: auto;
		height: auto;
	}

	@media (max-width: 480px) {
		border-radius: 4px;
	}
`;

export const SectionTitle = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	font-size: 16px;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	padding: 16px 20px;
	border-bottom: 1px solid #e0e0e0;
	background: #f9fafb;
	flex-shrink: 0;
	height: 56px;
	flex-wrap: nowrap;
	white-space: nowrap;

	h3 {
		margin: 0;
		font-size: inherit;
		font-weight: inherit;
		color: inherit;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (max-width: 1024px) {
		font-size: 14px;
		padding: 12px 16px;
		height: 48px;
	}

	@media (max-width: 480px) {
		font-size: 12px;
		padding: 10px 12px;
		height: 44px;
	}
`;
export const TempToggle = styled.div`
	display: flex;
	align-items: center;
	background-color: #e5e7eb;
	border-radius: 20px;
	padding: 3px;
	gap: 0;
	flex-shrink: 0;

	button {
		padding: 4px 10px;
		margin: 0;
		background-color: transparent;
		color: #6b7280;
		border: none;
		border-radius: 18px;
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: 500;
		transition: all 0.3s ease;
		white-space: nowrap;

		&:hover {
			color: #4b5563;
		}

		&.active {
			background-color: #10b981;
			color: #fff;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		}
	}

	@media (max-width: 1024px) {
		padding: 2px;

		button {
			padding: 3px 8px;
			font-size: 0.7rem;
		}
	}
`;

export const SectionContent = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 16px 20px;
	color: #999999;
	font-size: 14px;
	overflow-y: auto;
	min-height: 0;

	@media (max-width: 1024px) {
		font-size: 12px;
		padding: 12px 16px;
	}

	@media (max-width: 480px) {
		font-size: 11px;
		padding: 10px 12px;
	}
`;

export const ZeroState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	gap: 12px;
	padding: 20px;

	svg {
		font-size: 48px;
		opacity: 0.3;
		margin-bottom: 8px;
	}

	p {
		margin: 0;
		font-size: 14px;
		color: #999999;
		font-weight: 500;
	}

	@media (max-width: 1024px) {
		padding: 16px;

		svg {
			font-size: 40px;
		}

		p {
			font-size: 12px;
		}
	}

	/* Center content */
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
`;

export const TaskStatusBanners = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16px;
	margin-bottom: 20px;

	@media (max-width: 768px) {
		gap: 12px;
	}

	@media (max-width: 480px) {
		gap: 8px;
	}
`;

export const TaskStatusBanner = styled.div<{
	$type: 'overdue' | 'upcoming' | 'completed';
}>`
	background: white;
	border-radius: 8px;
	padding: 20px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	border-left: 4px solid
		${(props) => {
			switch (props.$type) {
				case 'overdue':
					return '#ef4444';
				case 'upcoming':
					return '#f59e0b';
				case 'completed':
					return '#10b981';
				default:
					return '#6b7280';
			}
		}};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	@media (max-width: 480px) {
		padding: 16px;
	}
`;

export const TaskStatusCount = styled.div<{
	$type: 'overdue' | 'upcoming' | 'completed';
}>`
	font-size: 40px;
	font-weight: 800;
	color: ${(props) => {
		switch (props.$type) {
			case 'overdue':
				return COLORS.errorDark || '#ef4444';
			case 'upcoming':
				return COLORS.warningDark || '#f59e0b';
			case 'completed':
				return COLORS.successDark || '#10b981';
			default:
				return COLORS.textPrimary || '#6b7280';
		}
	}};
	margin-bottom: 8px;

	@media (max-width: 480px) {
		font-size: 28px;
	}
`;

export const TaskStatusLabel = styled.div`
	font-size: 14px;
	font-weight: 500;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-bottom: 4px;
`;

export const TaskStatusText = styled.div`
	font-size: 16px;
	font-weight: 600;
	color: #1f2937;

	@media (max-width: 480px) {
		font-size: 14px;
	}
`;

export const PropertyScoreSection = styled.div`
	background: white;
	border-radius: 8px;
	padding: 24px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	margin-bottom: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;

	@media (max-width: 768px) {
		padding: 20px;
		margin-bottom: 16px;
	}

	@media (max-width: 480px) {
		padding: 16px;
		margin-bottom: 12px;
	}
`;

export const PropertyScoreTitle = styled.h3`
	font-size: 18px;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	text-align: center;

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;

export const ScoreGaugeContainer = styled.div`
	position: relative;
	width: 200px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: 8px;

	@media (max-width: 480px) {
		width: 160px;
	}
`;

export const ScoreGauge = styled.div`
	position: relative;
	width: 180px;
	height: 90px;
	border-radius: 90px 90px 0 0;
	background: conic-gradient(
		from 270deg,
		#ef4444 0deg 60deg,
		#f59e0b 60deg 120deg,
		#10b981 120deg 180deg
	);
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 45px;
		background: white;
	}

	@media (max-width: 480px) {
		width: 144px;
		height: 72px;

		&::before {
			height: 36px;
		}
	}
`;

export const ScoreNeedle = styled.div<{ $score: number }>`
	position: absolute;
	bottom: 0;
	left: 50%;
	width: 2px;
	height: 90px;
	background: #1f2937;
	z-index: 2;
	transform-origin: bottom center;
	transform: translateX(-50%)
		rotate(
			${(props) => {
				// Convert score (0-100) to angle (-90deg to 90deg)
				const angle = (props.$score / 100) * 180 - 90;
				return `${angle}deg`;
			}}
		);

	&::before {
		content: '';
		position: absolute;
		bottom: -4px;
		left: -4px;
		width: 10px;
		height: 10px;
		background: #1f2937;
		border-radius: 50%;
	}

	@media (max-width: 480px) {
		height: 72px;
		bottom: 0;

		&::before {
			bottom: -3px;
			left: -3px;
			width: 8px;
			height: 8px;
		}
	}
`;

export const ScoreValue = styled.div`
	font-size: 64px;
	font-weight: 900;
	color: ${COLORS.gray900};
	text-align: center;
	margin-top: 8px;

	@media (max-width: 480px) {
		font-size: 48px;
		margin-top: 6px;
	}
`;
