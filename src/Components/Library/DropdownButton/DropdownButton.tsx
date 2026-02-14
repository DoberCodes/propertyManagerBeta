import React, { useState } from 'react';
import styled from 'styled-components';
import COLORS from '../../../constants/colors';
import { tab } from '../TabController/TabController';

export const DropdownMenu = styled.div`
	position: absolute;
	width: 337px;
	background-color: white;
	border: 1px solid #ccc;
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	z-index: 10000;
	min-width: 150px;
	pointer-events: auto;
`;

export const DropdownItem = styled.button`
	display: block;
	width: 100%;
	padding: 10px 12px;
	background: none;
	border: none;
	color: ${COLORS.primary};
	text-align: left;
	font-size: 16px;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:first-child {
		border-radius: 4px 4px 0 0;
	}

	&:last-child {
		border-radius: 0 0 4px 4px;
	}

	@media (max-width: 480px) {
		padding: 8px 10px;
		font-size: 12px;
	}
`;

const Label = styled.div`
	font-size: 16px;
`;

const Button = styled.div`
	width: 100%;
	display: flex;
	background: none;
	color: ${COLORS.primary};
	border: 1.5px solid ${COLORS.gray300};
	border-radius: 6px;
	padding: 10px 15px;
	font-size: 16px;

	cursor: pointer;
	transition: background-color 0.2s ease;

	@media (max-width: 480px) {
		padding: 12px 16px; /* Increase padding for better touch target */
		font-size: 16px; /* Larger font size for better readability */
		min-height: 48px; /* Ensure minimum touch target size */
	}
`;

export const DropdownButton = (props: {
	SetActiveTab: (tab: string) => void;
	activeTab: string;
	availableTabs: tab[];
}) => {
	const [isExtended, setIsExtended] = useState(false);

	const filteredTabs = props.availableTabs.filter(
		(tab) => tab.value !== props.activeTab,
	);

	const handleTabClick = (tabValue: string) => {
		props.SetActiveTab(tabValue);
		setIsExtended(false);
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (
			containerRef.current &&
			!containerRef.current.contains(event.target as Node)
		) {
			setIsExtended(false);
		}
	};

	const containerRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<div ref={containerRef}>
			<Button onClick={() => setIsExtended((prev) => !prev)}>
				<div style={{ justifyContent: 'flex-start' }}>
					{
						props.availableTabs.find((tab) => tab.value === props.activeTab)
							?.label
					}
				</div>
				<div style={{ marginLeft: 'auto' }}>
					{isExtended ? (
						<svg
							xmlns='http://www.w3.org/2000/svg'
							width='16'
							height='16'
							fill='currentColor'
							viewBox='0 0 16 16'>
							<path d='M1.5 5.5l6 6 6-6' />
						</svg>
					) : (
						<svg
							xmlns='http://www.w3.org/2000/svg'
							width='16'
							height='16'
							fill='currentColor'
							viewBox='0 0 16 16'>
							<path d='M1.5 10.5l6-6 6 6' />
						</svg>
					)}
				</div>
			</Button>
			{isExtended && (
				<DropdownMenu>
					{filteredTabs.map((tab) => (
						<DropdownItem
							key={tab.value}
							onClick={() => handleTabClick(tab.value)}>
							<Label>{tab.label}</Label>
						</DropdownItem>
					))}
				</DropdownMenu>
			)}
		</div>
	);
};
