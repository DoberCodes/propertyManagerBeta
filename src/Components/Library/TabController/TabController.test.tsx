import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabController } from './TabController';

const makeProps = (overrides: any = {}) => ({
	property: overrides.property || {},
	currentUser: overrides.currentUser || {
		subscription: { plan: 'basic' },
		role: 'manager',
	},
	propertyMaintenanceRequests: overrides.propertyMaintenanceRequests || [],
	canApproveMaintenanceRequest: overrides.canApprove || (() => true),
	activeTab: overrides.activeTab || 'details',
	setActiveTab: overrides.setActiveTab || (() => {}),
});

describe('Tabs component', () => {
	test('shows Units for Multi-Family properties', () => {
		render(
			<TabController
				{...makeProps({ property: { propertyType: 'Multi-Family' } })}
			/>,
		);
		expect(screen.getByText('Units')).toBeInTheDocument();
	});

	test('does not show Suites for Commercial properties (temporarily hidden)', () => {
		render(
			<TabController
				{...makeProps({
					property: { propertyType: 'Commercial' },
				})}
			/>,
		);
		expect(screen.queryByText('Suites')).not.toBeInTheDocument();
	});

	test('shows Tenants and Requests for rental properties for non-homeowner users', () => {
		render(
			<TabController
				{...makeProps({
					property: { isRental: true, propertyType: 'Single Family' },
					propertyMaintenanceRequests: [{ id: 'r1', status: 'pending' }],
				})}
			/>,
		);

		expect(screen.getByText('Tenants')).toBeInTheDocument();
		expect(screen.getByText('Requests')).toBeInTheDocument();
		// badge count should be rendered somewhere as '1'
		expect(screen.getByText('1')).toBeInTheDocument();
	});

	test('does not show Tenants/Requests for homeowner plan even if isRental is true', () => {
		render(
			<TabController
				{...makeProps({
					property: { isRental: true },
					currentUser: {
						subscription: { plan: 'homeowner' },
						role: 'homeowner',
					},
				})}
			/>,
		);

		expect(screen.queryByText('Tenants')).not.toBeInTheDocument();
		expect(screen.queryByText('Requests')).not.toBeInTheDocument();
	});
});
