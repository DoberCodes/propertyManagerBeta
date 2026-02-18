import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../Redux/store/store';
import { FormOptions, FormSelect } from '../Modal/ModalStyles';
import { DropdownButton } from '../DropdownButton/DropdownButton';

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

export interface tab {
	label: string;
	value: string;
	badgeCount?: number;
}

export const TabController: React.FC<TabsProps> = ({
	property,
	currentUser,
	propertyMaintenanceRequests,
	canApproveMaintenanceRequest,
	activeTab,
	setActiveTab,
}) => {
	const isMobile = useSelector((state: RootState) => state.app.isMobile);
	const isHomeowner = useSelector((state: RootState) =>
		state.user.currentUser
			? state.user.currentUser.subscription?.plan === 'homeowner'
			: false,
	);
	const isPropertyManager = currentUser ? !isHomeowner : true;
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

	const tabs = tabsForProperty;

	if (isMobile) {
		return (
			<div
				style={{
					width: '100%',
					padding: '0 16px',
					marginBottom: '8px',
					overflowX: 'auto',
				}}>
				<DropdownButton
					activeTab={activeTab}
					SetActiveTab={setActiveTab}
					availableTabs={tabs}
				/>
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
