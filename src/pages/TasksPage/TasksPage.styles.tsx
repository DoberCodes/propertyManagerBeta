import styled from 'styled-components';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
	height: 100%; /* Adjusted to prevent unnecessary scrolling */
	background-color: #f8f9fa;
`;

export const TaskGridSection = styled.div`
	background: white;
	border-radius: 8px;
	padding: 20px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

export const FilterSection = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	background: white;
	padding: 15px 20px;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

	label {
		font-weight: 500;
		color: #374151;
	}

	select {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		font-size: 14px;
		min-width: 120px;

		&:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}
	}
`;

export const CarouselSection = styled.div`
	width: 100%;
	display: none;

	@media (max-width: 1024px) {
		display: block;
	}
`;
