import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';

export const ZeroStateContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 4rem 2rem;
	text-align: center;
	background-color: ${COLORS.gray50};
	border-radius: 12px;
	border: 2px dashed ${COLORS.border};
	min-height: 300px;

	@media (max-width: 1024px) {
		padding: 3.5rem 1.5rem;
		min-height: 280px;
	}

	@media (max-width: 480px) {
		padding: 3rem 1.5rem;
		min-height: 320px;
	}
`;

export const ZeroStateIcon = styled.div`
	font-size: 48px;
	margin-bottom: 1.5rem;
	opacity: 0.5;

	@media (max-width: 1024px) {
		font-size: 44px;
		margin-bottom: 1.25rem;
	}

	@media (max-width: 480px) {
		font-size: 40px;
		margin-bottom: 1.5rem;
	}
`;

export const ZeroStateTitle = styled.h3`
	font-size: 24px;
	font-weight: 700;
	color: ${COLORS.textPrimary};
	margin: 0 0 0.75rem 0;

	@media (max-width: 1024px) {
		font-size: 22px;
	}

	@media (max-width: 480px) {
		font-size: 20px;
	}
`;

export const ZeroStateDescription = styled.p`
	font-size: 16px;
	color: ${COLORS.textSecondary};
	margin: 0 0 2rem 0;
	max-width: 500px;
	line-height: 1.6;

	@media (max-width: 1024px) {
		font-size: 15px;
		margin-bottom: 1.75rem;
	}

	@media (max-width: 480px) {
		font-size: 16px;
		margin-bottom: 2rem;
		line-height: 1.5;
	}
`;

export const ZeroStateActions = styled.div`
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
	justify-content: center;

	@media (max-width: 480px) {
		flex-direction: column;
		width: 100%;
		max-width: 320px;
		gap: 0.75rem;
	}
`;

export const ZeroStatePrimaryButton = styled.button`
	padding: 0.875rem 1.75rem;
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.bgWhite};
	border: none;
	border-radius: 8px;
	font-weight: 600;
	font-size: 16px;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: ${COLORS.shadowMd};
	min-height: 44px; /* Better touch target */

	&:hover:not(:disabled) {
		background: linear-gradient(
			135deg,
			${COLORS.primaryDark} 0%,
			${COLORS.primaryDarker} 100%
		);
		box-shadow: ${COLORS.shadowLg};
		transform: translateY(-1px);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		width: 100%;
		padding: 1rem 1.75rem;
		font-size: 16px;
		min-height: 48px; /* Larger touch target on mobile */
	}
`;

export const ZeroStateSecondaryButton = styled.button`
	padding: 0.875rem 1.75rem;
	background-color: ${COLORS.bgWhite};
	color: ${COLORS.primary};
	border: 2px solid ${COLORS.primary};
	border-radius: 8px;
	font-weight: 600;
	font-size: 16px;
	cursor: pointer;
	transition: all 0.2s;
	min-height: 44px; /* Better touch target */

	&:hover:not(:disabled) {
		background-color: ${COLORS.primaryLight};
		border-color: ${COLORS.primaryDark};
		transform: translateY(-1px);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		width: 100%;
		padding: 1rem 1.75rem;
		font-size: 16px;
		min-height: 48px; /* Larger touch target on mobile */
	}
`;
