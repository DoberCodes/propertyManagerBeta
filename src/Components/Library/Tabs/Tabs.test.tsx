import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tabs from './Tabs';

const makeProps = (overrides: any = {}) => ({
	property: overrides.property || {},
	hasCommercialSuites: overrides.hasCommercialSuites || false,
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
			<Tabs {...makeProps({ property: { propertyType: 'Multi-Family' } })} />,
		);
		expect(screen.getByText('Units')).toBeInTheDocument();
	});

	test('shows Suites for Commercial properties when suites are enabled', () => {
		render(
			<Tabs
				{...makeProps({
					property: { propertyType: 'Commercial' },
					hasCommercialSuites: true,
				})}
			/>,
		);
		expect(screen.getByText('Suites')).toBeInTheDocument();
	});

	test('shows Tenants and Requests for rental properties for non-homeowner users', () => {
		render(
			<Tabs
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
			<Tabs
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
