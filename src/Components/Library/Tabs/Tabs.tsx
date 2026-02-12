import React, { useState, useEffect } from 'react';
import { FormSelect } from '../Modal/ModalStyles';

export interface TabsContextProps {
	property: any;
	currentUser: any;
	propertyMaintenanceRequests: any[];
	canApproveMaintenanceRequest: (role: any) => boolean;
}

interface TabsProps extends TabsContextProps {
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

interface tab {
	label: string;
	value: string;
	badgeCount?: number;
}

const Tabs: React.FC<TabsProps> = ({
	property,
	currentUser,
	propertyMaintenanceRequests,
	canApproveMaintenanceRequest,
	activeTab,
	setActiveTab,
}) => {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkIsMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkIsMobile();
		window.addEventListener('resize', checkIsMobile);

		return () => window.removeEventListener('resize', checkIsMobile);
	}, []);

	// Build tabs dynamically based on property attributes and user type
	const baseTabs: tab[] = [
		{ label: 'Details', value: 'details' },
		{ label: 'Devices', value: 'devices' },
		{ label: 'Tasks', value: 'tasks' },
		{ label: 'Maintenance History', value: 'maintenance' },
	];

	const tabsForProperty: tab[] = [...baseTabs];

	// Suites for commercial properties with suites enabled - temporarily hidden for commercial
	// if (property?.propertyType === 'Commercial' && hasCommercialSuites) {
	//     tabsForProperty.push({ label: 'Suites', value: 'suites' });
	// }

	// Units for multi-family properties
	if (property?.propertyType === 'Multi-Family') {
		tabsForProperty.push({ label: 'Units', value: 'units' });
	}

	// Tenants and Requests only for rental properties and non-homeowner users
	const isPropertyManager = currentUser?.subscription
		? currentUser.subscription.plan !== 'homeowner'
		: true;

	if (property?.isRental && isPropertyManager) {
		tabsForProperty.push({ label: 'Tenants', value: 'tenants' });
		tabsForProperty.push({
			label: 'Requests',
			value: 'requests',
			badgeCount: propertyMaintenanceRequests.filter(
				(request) =>
					request.status === 'pending' &&
					canApproveMaintenanceRequest(currentUser.role),
			).length,
		});
	}

	// Contractors tab always available
	tabsForProperty.push({ label: 'Contractors', value: 'contractors' });

	console.info(currentUser);

	const tabs = tabsForProperty;

	if (isMobile) {
		return (
			<div
				style={{
					width: '100%',
					padding: '0 16px',
					marginBottom: '8px',
				}}>
				<FormSelect
					value={activeTab}
					onChange={(e) => setActiveTab(e.target.value)}
					style={{
						width: '100%',
						padding: '12px 16px',
						border: '2px solid #e5e7eb',
						borderRadius: '8px',
						fontSize: '16px',
						fontWeight: '500',
						backgroundColor: '#ffffff',
						color: '#374151',
						cursor: 'pointer',
						transition: 'all 0.2s ease',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						outline: 'none',
					}}
					onFocus={(e) => {
						e.target.style.borderColor = '#10b981';
						e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
					}}
					onBlur={(e) => {
						e.target.style.borderColor = '#e5e7eb';
						e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
					}}>
					{tabs.map((tab) => (
						<option key={tab.value} value={tab.value}>
							{tab.label}
							{tab.badgeCount && tab.badgeCount > 0
								? ` (${tab.badgeCount})`
								: ''}
						</option>
					))}
				</FormSelect>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
			{tabs.map((tab) => (
				<button
					key={tab.value}
					style={{
						padding: '8px 16px',
						border: 'none',
						borderBottom:
							activeTab === tab.value
								? '2px solid #22c55e'
								: '2px solid transparent',
						background: 'none',
						color: activeTab === tab.value ? '#22c55e' : '#333',
						fontWeight: activeTab === tab.value ? 600 : 400,
						cursor: 'pointer',
						position: 'relative',
						whiteSpace: 'nowrap',
					}}
					onClick={() => setActiveTab(tab.value)}>
					{tab.label}
					{tab.badgeCount && tab.badgeCount > 0 && (
						<span
							style={{
								backgroundColor: '#f39c12',
								color: 'white',
								borderRadius: '10px',
								padding: '2px 8px',
								marginLeft: 6,
								fontSize: 12,
								position: 'absolute',
								top: -8,
								right: -12,
							}}>
							{tab.badgeCount}
						</span>
					)}
				</button>
			))}
		</div>
	);
};

export default Tabs;
