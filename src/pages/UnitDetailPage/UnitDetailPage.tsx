import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../Redux/store';
import { useDetailPageData } from '../../Hooks/useDetailPageData';
import {
	DetailPageLayout,
	TabContent,
	ReusableTable,
	EditTaskModal,
	GenericModal,
	FormGroup,
	FormLabel,
	FormInput,
	FormSelect,
	FormTextarea,
	PrimaryButton,
} from '../../Components/Library';
import { Toolbar } from '../PropertyDetailPage/PropertyDetailPage.styles';
import { AddTenantModal } from '../../Components/AddTenantModal';
import { MaintenanceRequestModal } from '../../Components/MaintenanceRequestModal';
import {
	useCreateDeviceMutation,
	useCreateTaskMutation,
} from '../../Redux/API/apiSlice';
import { getDeviceName } from '../../utils/detailPageUtils';
import { TabConfig } from '../../types/DetailPage.types';
import { addMaintenanceRequest } from '../../Redux/Slices/maintenanceRequestsSlice';
import { createMaintenanceRequestUtil } from '../PropertyDetailPage/PropertyDetailPage.utils';
import { MaintenanceRequest } from '../../types/MaintenanceRequest.types';
import {
	InfoGrid,
	InfoCard,
	InfoLabel,
	InfoValue,
	SectionContainer,
	SectionHeader,
} from '../../Components/Library/InfoCards/InfoCardStyles';
import {
	GridContainer,
	GridTable,
	EmptyState,
} from '../../Components/Library/DataGrid/DataGridStyles';

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;
	height: 100%;
	overflow-y: auto;
	background-color: #fafafa;
`;

const ContentContainer = styled.div`
	flex: 1;
	padding: 20px;
	max-width: 1200px;
	width: 100%;
	margin: 0 auto;
`;

export const UnitDetailPage: React.FC = () => {
	const navigate = useNavigate();
	const { slug, unitName } = useParams<{ slug: string; unitName: string }>();
	const [activeTab, setActiveTab] = React.useState<
		| 'info'
		| 'tenants'
		| 'occupants'
		| 'devices'
		| 'tasks'
		| 'history'
		| 'requests'
	>('info');

	// Modal states
	const [showAddTenantModal, setShowAddTenantModal] = React.useState(false);
	const [showAddDeviceModal, setShowAddDeviceModal] = React.useState(false);
	const [showCreateTaskModal, setShowCreateTaskModal] = React.useState(false);
	const [showMaintenanceRequestModal, setShowMaintenanceRequestModal] =
		React.useState(false);

	// Use the generic data hook
	const {
		property,
		entity: unit,
		tasks: unitTasks,
		maintenanceHistory: unitMaintenanceHistory,
		maintenanceRequests: unitRequests,
	} = useDetailPageData({
		propertySlug: slug!,
		entityName: decodeURIComponent(unitName || ''),
		entityType: 'unit',
		propertyType: 'Multi-Family',
	});

	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const dispatch = useDispatch();
	const [createDevice] = useCreateDeviceMutation();
	const [createTask] = useCreateTaskMutation();

	const handleMaintenanceRequestSubmit = (request: MaintenanceRequest) => {
		if (!property || !currentUser) return;

		const newRequest = createMaintenanceRequestUtil(
			request,
			property,
			currentUser,
		);
		dispatch(addMaintenanceRequest(newRequest));
		setShowMaintenanceRequestModal(false);
	};

	// Tab configuration
	const tabsConfig: TabConfig[] = [
		{ id: 'info', label: 'Unit Info' },
		{ id: 'occupants', label: `Occupants (${(unit?.occupants || []).length})` },
		{ id: 'devices', label: `Devices (${(unit?.deviceIds || []).length})` },
		{ id: 'tasks', label: `Tasks (${unitTasks.length})` },
		{
			id: 'history',
			label: `Maintenance History (${unitMaintenanceHistory.length})`,
		},
		{ id: 'requests', label: `Requests (${unitRequests.length})` },
	];

	if (!property || !unit) {
		return (
			<Wrapper>
				<ContentContainer>
					<EmptyState>
						<p>Unit not found</p>
					</EmptyState>
				</ContentContainer>
			</Wrapper>
		);
	}

	return (
		<DetailPageLayout
			title={unit.name}
			subtitle={property.title}
			badge={`${property.slug} / ${unit.name
				.replace(/\s+/g, '-')
				.toLowerCase()}`}
			backPath={`/property/${property.slug}`}
			tabs={tabsConfig}
			activeTab={activeTab}
			onTabChange={(tab) => setActiveTab(tab as any)}>
			<ContentContainer>
				{activeTab === 'info' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Unit Information</SectionHeader>
							<InfoGrid>
								<InfoCard>
									<InfoLabel>Unit Name</InfoLabel>
									<InfoValue>{unit.name}</InfoValue>
								</InfoCard>
								<InfoCard>
									<InfoLabel>Property</InfoLabel>
									<InfoValue>{property.title}</InfoValue>
								</InfoCard>
								<InfoCard>
									<InfoLabel>Property Address</InfoLabel>
									<InfoValue>{property.address || 'N/A'}</InfoValue>
								</InfoCard>
							</InfoGrid>
							{unit.notes && (
								<InfoCard>
									<InfoLabel>Notes</InfoLabel>
									<InfoValue>{unit.notes}</InfoValue>
								</InfoCard>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{/* Occupants Tab */}
				{activeTab === 'occupants' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Unit Occupants</SectionHeader>
							<Toolbar>
								<PrimaryButton onClick={() => setShowAddTenantModal(true)}>
									Add Occupant
								</PrimaryButton>
							</Toolbar>
							{unit.occupants && unit.occupants.length > 0 ? (
								<GridContainer>
									<GridTable>
										<thead>
											<tr>
												<th>Name</th>
												<th>Email</th>
												<th>Phone</th>
												<th>Lease Start</th>
												<th>Lease End</th>
											</tr>
										</thead>
										<tbody>
											{unit.occupants.map((occupant: any) => (
												<tr key={occupant.id}>
													<td>
														{occupant.firstName} {occupant.lastName}
													</td>
													<td>{occupant.email}</td>
													<td>{occupant.phone}</td>
													<td>{occupant.leaseStart || 'N/A'}</td>
													<td>{occupant.leaseEnd || 'N/A'}</td>
												</tr>
											))}
										</tbody>
									</GridTable>
								</GridContainer>
							) : (
								<EmptyState>
									<p>No occupants assigned to this unit</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{/* Devices Tab */}
				{activeTab === 'devices' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Unit Devices</SectionHeader>
							<Toolbar>
								<PrimaryButton onClick={() => setShowAddDeviceModal(true)}>
									Add Device
								</PrimaryButton>
							</Toolbar>
							{unit.deviceIds && unit.deviceIds.length > 0 ? (
								<GridContainer>
									<GridTable>
										<thead>
											<tr>
												<th>Device ID</th>
											</tr>
										</thead>
										<tbody>
											{unit.deviceIds.map((deviceId: string) => (
												<tr key={deviceId}>
													<td>{deviceId}</td>
												</tr>
											))}
										</tbody>
									</GridTable>
								</GridContainer>
							) : (
								<EmptyState>
									<p>No devices assigned to this unit</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{/* Tasks Tab */}
				{activeTab === 'tasks' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Unit Tasks</SectionHeader>
							<Toolbar>
								<PrimaryButton onClick={() => setShowCreateTaskModal(true)}>
									Add Task
								</PrimaryButton>
							</Toolbar>
							<ReusableTable
								rowData={unitTasks.map((task) => ({
									...task,
									assignedToNames: task.assignee || '',
									propertyTitle: property?.title || '',
								}))}
								columns={[
									{
										header: 'Task',
										accessor: 'title',
									},
									{
										header: 'Assignee',
										accessor: 'assignedToNames',
									},
									{
										header: 'Due Date',
										accessor: 'dueDate',
									},
									{
										header: 'Status',
										accessor: 'status',
									},
									{
										header: 'Notes',
										accessor: 'notes',
									},
								]}
								onRowDoubleClick={(taskId) => navigate(`/task/${taskId}`)}
								showCheckbox={false}
							/>
						</SectionContainer>
					</TabContent>
				)}

				{/* Maintenance History Tab */}
				{activeTab === 'history' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Unit Maintenance History</SectionHeader>
							{unitMaintenanceHistory.length > 0 ? (
								<GridContainer>
									<GridTable>
										<thead>
											<tr>
												<th>Date</th>
												<th>Description</th>
												<th>Device</th>
											</tr>
										</thead>
										<tbody>
											{unitMaintenanceHistory.map((record, idx) => (
												<tr
													key={`${
														record.originalTaskId || record.date || idx
													}`}>
													<td>
														{record.completionDate ||
															record.approvedAt ||
															record.dueDate ||
															record.date ||
															'-'}
													</td>
													<td>
														{record.title ||
															record.taskTitle ||
															record.description ||
															'Task'}
													</td>
													<td>
														{getDeviceName(
															(record as any).deviceId ||
																(Array.isArray((record as any).devices)
																	? (record as any).devices[0]
																	: undefined),
															property,
														)}
													</td>
												</tr>
											))}
										</tbody>
									</GridTable>
								</GridContainer>
							) : (
								<EmptyState>
									<p>No maintenance history for this unit</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{/* Maintenance Requests Tab */}
				{activeTab === 'requests' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Unit Maintenance Requests</SectionHeader>
							<Toolbar>
								<PrimaryButton
									onClick={() => setShowMaintenanceRequestModal(true)}>
									Add Request
								</PrimaryButton>
							</Toolbar>
							{unitRequests.length > 0 ? (
								<GridContainer>
									<GridTable>
										<thead>
											<tr>
												<th>Status</th>
												<th>Title</th>
												<th>Priority</th>
												<th>Submitted By</th>
												<th>Date</th>
											</tr>
										</thead>
										<tbody>
											{unitRequests.map((req) => (
												<tr key={req.id}>
													<td>{req.status}</td>
													<td>
														<strong>{req.title}</strong>
													</td>
													<td>{req.priority}</td>
													<td>{req.submittedByName}</td>
													<td>
														{req.submittedAt
															? new Date(req.submittedAt).toLocaleDateString()
															: 'N/A'}
													</td>
												</tr>
											))}
										</tbody>
									</GridTable>
								</GridContainer>
							) : (
								<EmptyState>
									<p>No maintenance requests for this unit</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}
			</ContentContainer>

			{/* Modals */}
			{showAddTenantModal && (
				<AddTenantModal
					open={showAddTenantModal}
					onClose={() => setShowAddTenantModal(false)}
					propertyId={property?.id || ''}
				/>
			)}

			{showAddDeviceModal && (
				<GenericModal
					isOpen={showAddDeviceModal}
					onClose={() => setShowAddDeviceModal(false)}
					title='Add Device'
					showActions={true}
					onSubmit={async (e) => {
						e.preventDefault();
						const formData = new FormData(e.target as HTMLFormElement);
						const data = {
							name: formData.get('name') as string,
							type: formData.get('type') as string,
							userId: currentUser?.id || '',
							location: {
								propertyId: property?.id || '',
								unitId: unit?.id || '',
							},
						};
						try {
							await createDevice(data).unwrap();
							setShowAddDeviceModal(false);
						} catch (error) {
							console.error('Failed to create device:', error);
						}
					}}
					primaryButtonLabel='Add Device'
					secondaryButtonLabel='Cancel'>
					<div
						style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<FormGroup>
							<FormLabel>Device Name *</FormLabel>
							<FormInput
								type='text'
								name='name'
								placeholder='Enter device name'
								required
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Device Type *</FormLabel>
							<FormSelect name='type' required>
								<option value=''>Select device type</option>
								<option value='thermostat'>Thermostat</option>
								<option value='lock'>Smart Lock</option>
								<option value='camera'>Security Camera</option>
								<option value='sensor'>Sensor</option>
								<option value='other'>Other</option>
							</FormSelect>
						</FormGroup>
					</div>
				</GenericModal>
			)}

			{showCreateTaskModal && (
				<GenericModal
					isOpen={showCreateTaskModal}
					onClose={() => setShowCreateTaskModal(false)}
					title='Create Task'
					showActions={true}
					onSubmit={async (e) => {
						e.preventDefault();
						const formData = new FormData(e.target as HTMLFormElement);
						const taskData = {
							title: formData.get('title') as string,
							dueDate: formData.get('dueDate') as string,
							status: 'Pending' as const,
							notes: formData.get('notes') as string,
							userId: currentUser?.id || '',
							property: property?.title || '',
							propertyId: property?.id || '',
							unitId: unit?.id || '',
						};
						try {
							await createTask(taskData).unwrap();
							setShowCreateTaskModal(false);
						} catch (error) {
							console.error('Failed to create task:', error);
						}
					}}
					primaryButtonLabel='Create Task'
					secondaryButtonLabel='Cancel'>
					<div
						style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<FormGroup>
							<FormLabel>Task Title *</FormLabel>
							<FormInput
								type='text'
								name='title'
								placeholder='Enter task title'
								required
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Due Date</FormLabel>
							<FormInput type='date' name='dueDate' />
						</FormGroup>

						<FormGroup>
							<FormLabel>Notes</FormLabel>
							<FormTextarea
								name='notes'
								placeholder='Enter task notes'
								rows={3}
							/>
						</FormGroup>
					</div>
				</GenericModal>
			)}

			{showMaintenanceRequestModal && (
				<MaintenanceRequestModal
					isOpen={showMaintenanceRequestModal}
					onClose={() => setShowMaintenanceRequestModal(false)}
					onSubmit={handleMaintenanceRequestSubmit}
					propertyTitle={property.title}
				/>
			)}
		</DetailPageLayout>
	);
};
