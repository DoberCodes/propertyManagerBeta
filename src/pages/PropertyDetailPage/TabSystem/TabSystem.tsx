import React from 'react';
import { DetailsTab } from './DetailsTab';
import { DevicesTab } from './DevicesTab';
import { SuitesTab } from './SuitesTab';
import { TasksTab } from './TasksTab';
import { MaintenanceTab } from './MaintenanceTab';
import { ContractorsTab } from './ContractorsTab';
import { RequestsTab } from './RequestsTab';
import { TenantsTab } from './TenantsTab';
import { UnitsTab } from './UnitsTab';
import { TabContentContainer, TabControlsContainer } from './index.styles';
import { TabController } from '../../../Components/Library';
import { Task } from '../../../types/Task.types';

interface TabsProps {
	property: any;
	propertyTasks: Task[];
	currentUser: any;
	propertyMaintenanceRequests: any[];
	canApproveMaintenanceRequest: (role: any) => boolean;
	maintenanceHistoryRecords: any[];
	propertyUnits: any[];
	teamMembers: any[];
	propertyContractors: any[];
	familyMembers: any[];
	allTasks: Task[];
	assigneeOptions?: { label: string; value: string; email?: string }[];
	handleAddMaintenanceHistory: (history: any) => void;
	handleDeleteMaintenanceHistory: (historyId: string) => void;
	setShowAddTenantModal: (show: boolean) => void;
	handleEditTenant: (tenant: any) => void;
	handleDeleteTenant: (tenantId: string) => void;
	handleViewTenantPromo: (tenantId: string) => void;
	handleCreateUnit: () => void;
	handleDeleteUnit: (unitId: string) => void;
	handleConvertRequestToTask: (requestId: string) => void;
	handleCreateTask: (task: any) => void;
	handleEditTask: (task: any) => void;
	hasCommercialSuites?: boolean;
}

export const TabSystem = ({
	property,
	currentUser,
	propertyMaintenanceRequests,
	canApproveMaintenanceRequest,
	propertyTasks,
	maintenanceHistoryRecords,
	propertyUnits,
	teamMembers,
	propertyContractors,
	familyMembers,
	allTasks,
	assigneeOptions = [],
	handleAddMaintenanceHistory,
	handleDeleteMaintenanceHistory,
	setShowAddTenantModal,
	handleEditTenant,
	handleDeleteTenant,
	handleViewTenantPromo,
	handleCreateUnit,
	handleDeleteUnit,
	handleConvertRequestToTask,
	hasCommercialSuites,
}: TabsProps) => {
	const [activeTab, setActiveTab] = React.useState('details');

	return (
		<>
			<TabControlsContainer>
				<TabController
					property={property}
					currentUser={currentUser}
					propertyMaintenanceRequests={propertyMaintenanceRequests}
					canApproveMaintenanceRequest={canApproveMaintenanceRequest}
					activeTab={activeTab}
					setActiveTab={setActiveTab}
				/>
			</TabControlsContainer>

			<TabContentContainer>
				{/* Details Tab */}
				{activeTab === 'details' && (
					<DetailsTab property={property} teamMembers={[]} />
				)}

				{/* Devices Tab */}
				{activeTab === 'devices' &&
					(() => {
						return <DevicesTab property={property} />;
					})()}

				{/* Suites Tab */}
				{activeTab === 'suites' &&
					property?.propertyType !== 'Commercial' &&
					property?.hasSuites && <SuitesTab property={property} />}

				{/* Tasks Tab */}
				{activeTab === 'tasks' && (
					<TasksTab
						property={property}
						propertyTasks={propertyTasks}
						currentUser={currentUser}
						assigneeOptions={assigneeOptions}
					/>
				)}

				{/* Maintenance History Tab */}
				{activeTab === 'maintenance' && (
					<MaintenanceTab
						property={property}
						maintenanceHistoryRecords={maintenanceHistoryRecords}
						units={propertyUnits}
						teamMembers={teamMembers}
						contractors={propertyContractors}
						familyMembers={familyMembers}
						tasks={allTasks}
						onAddMaintenanceHistory={handleAddMaintenanceHistory}
						onDeleteMaintenanceHistory={handleDeleteMaintenanceHistory}
					/>
				)}

				{/* Tenants Tab */}
				{activeTab === 'tenants' &&
					property?.isRental &&
					!hasCommercialSuites && (
						<TenantsTab
							property={property}
							currentUser={currentUser}
							setShowAddTenantModal={setShowAddTenantModal}
							onEditTenant={handleEditTenant}
							onDeleteTenant={handleDeleteTenant}
							onViewTenantPromo={handleViewTenantPromo}
						/>
					)}
				{/* Units Tab */}
				{activeTab === 'units' && property?.propertyType === 'Multi-Family' && (
					<UnitsTab
						property={property}
						units={propertyUnits}
						handleCreateUnit={handleCreateUnit}
						handleDeleteUnit={handleDeleteUnit}
					/>
				)}

				{/* Maintenance Requests Tab */}
				{activeTab === 'requests' && property?.isRental && (
					<RequestsTab
						propertyMaintenanceRequests={propertyMaintenanceRequests}
						currentUser={currentUser}
						canApproveMaintenanceRequest={canApproveMaintenanceRequest}
						handleConvertRequestToTask={handleConvertRequestToTask}
					/>
				)}

				{/* Contractors Tab */}
				{activeTab === 'contractors' &&
					(() => {
						console.log(
							'About to render ContractorsTab with propertyId:',
							property?.id,
						);
						return <ContractorsTab propertyId={property?.id || ''} />;
					})()}
			</TabContentContainer>
		</>
	);
};
