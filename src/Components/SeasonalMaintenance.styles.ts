import styled from 'styled-components';

export const AnimatedTip = styled.p`
	font-size: 1.1rem;
	color: #333;
	font-weight: bold;
	text-align: center;
	margin: 15px 0;
	animation: fadeIn 0.5s ease-in-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

export const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	overflow: hidden;
	gap: 12px;
`;

export const ForecastGrid = styled.div`
	display: flex;
	gap: 12px;
	justify-content: center;
	flex-wrap: nowrap;
	overflow-x: auto;
	padding: 8px 0;
	width: 100%;
`;

export const ForecastDay = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 64px;
	font-size: 12px;
	color: #333;

	img {
		width: 48px;
		height: 48px;
	}
`;

export const HourlyGrid = styled(ForecastGrid)`
	/* reuse ForecastGrid but allow more compact items if needed */
	gap: 8px;
`;

export const AlertBanner = styled.div`
	width: 100%;
	background: #fef3c7; /* light yellow */
	color: #92400e;
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 13px;
	margin-bottom: 8px;
	text-align: center;
`;

export const ViewControls = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
	justify-content: center;
	width: 100%;
	margin-bottom: 8px;
`;

export const ViewButton = styled.button<{ $active?: boolean }>`
	padding: 6px 10px;
	border-radius: 6px;
	border: 1px solid #e5e7eb;
	background: ${({ $active }) => ($active ? '#10b981' : 'white')};
	color: ${({ $active }) => ($active ? 'white' : '#111827')};
	cursor: pointer;
	font-size: 13px;
`;

export const Header = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	margin-bottom: 15px;

	form {
		display: flex;
		flex-direction: column;
		align-items: center;

		label {
			font-size: 1rem;
			color: #555;
			margin-bottom: 8px;
		}

		input {
			padding: 10px;
			border: 1px solid #ddd;
			border-radius: 6px;
			margin-bottom: 10px;
			width: 100%;
			max-width: 320px;
		}

		button {
			padding: 10px 20px;
			background-color: #007bff;
			color: #fff;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			transition: background-color 0.3s;

			&:hover {
				background-color: #0056b3;
			}
		}
	}
`;

export const WeatherInfo = styled.div`
	text-align: center;
	margin-bottom: 10px;
	flex-grow: 1;

	h3 {
		margin: 0;
		font-size: 1.2rem;
		color: #333;
	}

	p {
		margin: 5px 0;
		font-size: 0.9rem;
		color: #555;
	}

	img {
		margin-top: 5px;
		max-height: 50px;
	}
`;

export const Recommendation = styled.p`
	font-size: 13px;
	color: #10b981;
	font-weight: 600;
	margin: 0;
`;

export const TipText = styled.p`
	font-size: 13px;
	color: #1f2937;
	font-weight: 500;
	margin: 0;
	text-align: center;
	line-height: 1.5;
	animation: fadeIn 0.5s ease-in-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

export const ZeroStateContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	text-align: center;

	icon {
		font-size: 48px;
		opacity: 0.3;
	}

	p {
		margin: 0;
		font-size: 14px;
		color: #999999;
	}
`;

/* New card-based layout for seasonal tips */
export const TipsContainer = styled.div`
	width: 100%;
	background: #ffffff;
	border: 1px solid rgba(16, 24, 40, 0.04);
	border-radius: 12px;
	padding: 20px;
	box-shadow: 0 10px 30px rgba(16, 24, 40, 0.06);
	max-width: 1200px;
	margin: 0 auto;
`;

export const TipsHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	color: #0f172a;
	padding: 6px 4px 16px 4px;
	margin-bottom: 10px;
	font-size: 1.15rem;
	font-weight: 800;
	border-left: 4px solid #0ea5a8;
	padding-left: 14px;
`;

export const CardGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 18px;
	padding: 6px 0 0 0;

	@media (max-width: 900px) {
		grid-template-columns: repeat(1, 1fr);
	}
`;

export const Card = styled.div`
	background: #ffffff;
	border: 1px solid rgba(16, 24, 40, 0.06);
	border-radius: 12px;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	min-height: 380px;
	box-shadow: 0 12px 30px rgba(16, 24, 40, 0.08);
	position: relative;
	transition: transform 220ms ease, box-shadow 220ms ease;
	&:hover {
		transform: translateY(-8px);
		box-shadow: 0 18px 40px rgba(16, 24, 40, 0.12);
	}
`;

export const CardImageWrapper = styled.div`
	position: relative;
	width: 100%;
	height: 190px;
	overflow: visible;
	background: #f3f4f6;
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	margin-bottom: 44px;
`;

export const OverlayBadge = styled.div<{ $season?: string }>`
	position: absolute;
	left: 0;
	right: 0;
	bottom: -24px;
	margin: 0 auto;
	height: 52px;
	border-radius: 0 0 12px 12px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 18px;
	font-size: 13px;
	box-shadow: 0 8px 22px rgba(16, 24, 40, 0.06);
	z-index: 3;
	background: ${({ $season }) =>
		$season === 'spring'
			? 'linear-gradient(90deg,#e6fffa,#ecfdf5)'
			: $season === 'summer'
			? 'linear-gradient(90deg,#fff7ed,#ffedd5)'
			: $season === 'fall'
			? 'linear-gradient(90deg,#fff7ed,#ffefec)'
			: 'linear-gradient(90deg,#eef2ff,#e5f0ff)'};
	color: ${({ $season }) =>
		$season === 'spring'
			? '#065f46'
			: $season === 'summer'
			? '#92400e'
			: $season === 'fall'
			? '#7c2d12'
			: '#0f172a'};
`;

export const PriorityPill = styled.span<{ level?: string }>`
	padding: 6px 10px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 700;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${({ level }) =>
		level === 'High'
			? '#6b1a1a'
			: level === 'Moderate'
			? '#7a4300'
			: '#374151'};
	background: ${({ level }) =>
		level === 'High'
			? 'rgba(185,28,28,0.10)'
			: level === 'Moderate'
			? 'rgba(180,83,9,0.10)'
			: 'rgba(107,114,128,0.08)'};
	border: 1px solid
		${({ level }) =>
			level === 'High'
				? '#b91c1c'
				: level === 'Moderate'
				? '#b45309'
				: 'rgba(99,102,106,0.25)'};
	box-shadow: none;
`;

export const CardTitle = styled.h4`
	margin: 8px 0 12px 0;
	font-size: 1.25rem;
	color: #0f172a;
	text-align: center;
	font-weight: 800;
	position: relative;
	&:after {
		content: '';
		display: block;
		width: 48px;
		height: 3px;
		background: #0f172a;
		margin: 8px auto 0 auto;
		border-radius: 2px;
	}
`;

export const CardList = styled.ul`
	margin: 0;
	padding: 0 24px;
	font-size: 14px;
	color: #111827;
	line-height: 1.6;
	li {
		margin-bottom: 8px;
	}
`;

export const CardFooter = styled.div`
	font-size: 12px;
	color: #6b7280;
	text-align: right;
`;

export const FooterRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 18px;
	height: 64px;
	background: linear-gradient(
		90deg,
		rgba(14, 165, 168, 0.02),
		rgba(14, 165, 168, 0.01)
	);
`;

export const FooterLeft = styled.div`
	font-size: 12px;
	color: #6b7280;
	text-transform: uppercase;
	font-weight: 600;
	letter-spacing: 0.6px;
`;

export const FooterRight = styled.div``;

export const SmallBadge = styled.span`
	display: inline-block;
	padding: 8px 16px;
	border-radius: 999px;
	background: #eef2ff;
	color: #3730a3;
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 0.2px;
`;

export const Controls = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 18px;
	width: 100%;
	margin-top: 18px;
`;

export const PageBadge = styled.div`
	background: white;
	color: #0ea5a8;
	padding: 6px 12px;
	border-radius: 16px;
	font-weight: 800;
	border: 1px solid rgba(14, 165, 168, 0.12);
`;
