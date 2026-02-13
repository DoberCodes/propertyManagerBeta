import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faPlus,
	faEdit,
	faTrash,
	faWrench,
	faUpload,
	faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../Redux/store';
import { Property } from '../../../Redux/API/apiSlice';
import { uploadDeviceFile } from '../../../utils/deviceFileUpload';
import {
	useGetDevicesQuery,
	useCreateDeviceMutation,
	useUpdateDeviceMutation,
	useDeleteDeviceMutation,
	useGetUnitsQuery,
} from '../../../Redux/API/apiSlice';
import { GenericModal } from '../../../Components/Library';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	Toolbar,
	ToolbarButton,
	GridContainer,
	GridTable,
	EmptyState,
} from '../PropertyDetailPage.styles';

interface DeviceFormData {
	type: string;
	brand: string;
	model: string;
	installationDate: string;
	status: 'Active' | 'Maintenance' | 'Broken' | 'Decommissioned';
	location: {
		propertyId: string;
		unitId?: string;
		suiteId?: string;
	};
	files?: Array<{
		name: string;
		url: string;
		size: number;
		type: string;
	}>;
}

interface DevicesTabProps {
	property: Property;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({ property }) => {
	const [showDeviceModal, setShowDeviceModal] = useState(false);
	const [editingDevice, setEditingDevice] = useState<any>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [deviceFormData, setDeviceFormData] = useState<DeviceFormData>({
		type: '',
		brand: '',
		model: '',
		installationDate: '',
		status: 'Active',
		location: {
			propertyId: property.id,
		},
		files: [],
	});
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { data: devices = [], isLoading } = useGetDevicesQuery(property.id);
	const { data: units = [] } = useGetUnitsQuery(property.id);
	const [createDevice] = useCreateDeviceMutation();
	const [updateDevice] = useUpdateDeviceMutation();
	const [deleteDevice] = useDeleteDeviceMutation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	const resetForm = () => {
		setDeviceFormData({
			type: '',
			brand: '',
			model: '',
			installationDate: '',
			status: 'Active',
			location: {
				propertyId: property.id,
			},
			files: [],
		});
		setEditingDevice(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleOpenCreateModal = () => {
		resetForm();
		setShowDeviceModal(true);
	};

	const handleOpenEditModal = (device: any) => {
		setDeviceFormData({
			type: device.type || '',
			brand: device.brand || '',
			model: device.model || '',
			installationDate: device.installationDate || '',
			status: device.status || 'Active',
			location: device.location || { propertyId: property.id },
			files: device.files || [],
		});
		setEditingDevice(device);
		setShowDeviceModal(true);
	};

	const handleCloseModal = () => {
		setShowDeviceModal(false);
		resetForm();
	};

	const handleFormChange = (field: string, value: any) => {
		if (field.startsWith('location.')) {
			const locationField = field.split('.')[1];
			setDeviceFormData((prev) => ({
				...prev,
				location: {
					...prev.location,
					[locationField]: value,
				},
			}));
		} else {
			setDeviceFormData((prev) => ({
				...prev,
				[field]: value,
			}));
		}
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		try {
			const fileArray = Array.from(files);
			const uploadPromises = fileArray.map(async (file) => {
				const uploadedFile = await uploadDeviceFile(
					file,
					property.id,
					editingDevice?.id,
				);
				return uploadedFile;
			});

			const uploadedFiles = await Promise.all(uploadPromises);
			setDeviceFormData((prev) => ({
				...prev,
				files: [...(prev.files || []), ...uploadedFiles],
			}));

			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		} catch (error) {
			console.error('Error uploading files:', error);
			alert(
				error instanceof Error
					? error.message
					: 'Failed to upload files. Please try again.',
			);
		}
	};

	const handleRemoveFile = (index: number) => {
		setDeviceFormData((prev) => ({
			...prev,
			files: prev.files?.filter((_, i) => i !== index) || [],
		}));
	};

	const handleSubmit = async () => {
		if (isSubmitting) return;

		setIsSubmitting(true);
		try {
			const deviceData = {
				...deviceFormData,
				userId: currentUser!.id,
			};

			if (editingDevice) {
				await updateDevice({
					id: editingDevice.id,
					updates: deviceData,
				});
			} else {
				await createDevice(deviceData);
			}

			handleCloseModal();
		} catch (error) {
			console.error('Error saving device:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteDevice = async (deviceId: string) => {
		if (window.confirm('Are you sure you want to delete this device?')) {
			try {
				await deleteDevice(deviceId);
			} catch (error) {
				console.error('Error deleting device:', error);
			}
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'Active':
				return '#22c55e';
			case 'Maintenance':
				return '#f59e0b';
			case 'Broken':
				return '#ef4444';
			case 'Decommissioned':
				return '#6b7280';
			default:
				return '#6b7280';
		}
	};

	if (isLoading) {
		return (
			<SectionContainer>
				<SectionHeader>Household Devices</SectionHeader>
				<div>Loading devices...</div>
			</SectionContainer>
		);
	}

	return (
		<SectionContainer>
			<SectionHeader>Household Devices</SectionHeader>

			<Toolbar>
				<ToolbarButton onClick={handleOpenCreateModal}>
					<FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
					Add Device
				</ToolbarButton>
			</Toolbar>

			{devices.length === 0 ? (
				<EmptyState>
					<FontAwesomeIcon icon={faWrench} size='3x' color='#ccc' />
					<p>No devices added yet</p>
					<p>Click "Add Device" to get started</p>
				</EmptyState>
			) : (
				<GridContainer>
					<GridTable>
						<thead>
							<tr>
								<th>Type</th>
								<th>Brand</th>
								<th>Model</th>
								<th>Status</th>
								<th>Installation Date</th>
								<th>Files</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{devices.map((device) => (
								<tr key={device.id}>
									<td>{device.type}</td>
									<td>{device.brand}</td>
									<td>{device.model}</td>
									<td>
										<span
											style={{
												color: getStatusColor(device.status || 'Active'),
												fontWeight: 'bold',
											}}>
											{device.status || 'Active'}
										</span>
									</td>
									<td>
										{device.installationDate
											? new Date(device.installationDate).toLocaleDateString()
											: 'N/A'}
									</td>
									<td>
										{device.files && device.files.length > 0 ? (
											<div style={{ display: 'flex', gap: '4px' }}>
												{device.files.map((file, index) => (
													<a
														key={index}
														href={file.url}
														target='_blank'
														rel='noopener noreferrer'
														title={file.name}
														style={{
															padding: '4px 8px',
															background: '#e0e7ff',
															borderRadius: '4px',
															fontSize: '12px',
															textDecoration: 'none',
															color: '#4f46e5',
															whiteSpace: 'nowrap',
														}}>
														📄 {file.name.slice(0, 15)}
														{file.name.length > 15 ? '...' : ''}
													</a>
												))}
											</div>
										) : (
											<span style={{ color: '#999', fontSize: '12px' }}>
												No files
											</span>
										)}
									</td>
									<td>
										<ToolbarButton
											onClick={() => handleOpenEditModal(device)}
											style={{ marginRight: '8px' }}>
											<FontAwesomeIcon icon={faEdit} />
										</ToolbarButton>
										<ToolbarButton
											className='delete'
											onClick={() => handleDeleteDevice(device.id)}>
											<FontAwesomeIcon icon={faTrash} />
										</ToolbarButton>
									</td>
								</tr>
							))}
						</tbody>
					</GridTable>
				</GridContainer>
			)}

			{/* Device Modal */}
			{showDeviceModal && (
				<GenericModal
					isOpen={showDeviceModal}
					onClose={handleCloseModal}
					title={editingDevice ? 'Edit Device' : 'Add New Device'}
					showActions={true}
					onSubmit={handleSubmit}
					primaryButtonLabel={
						isSubmitting
							? 'Saving...'
							: editingDevice
							? 'Update Device'
							: 'Add Device'
					}
					primaryButtonDisabled={isSubmitting}
					secondaryButtonLabel='Cancel'>
					<div
						style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<div>
							<label
								style={{
									display: 'block',
									marginBottom: '4px',
									fontWeight: 'bold',
								}}>
								Device Type *
							</label>
							<input
								type='text'
								value={deviceFormData.type}
								onChange={(e) => handleFormChange('type', e.target.value)}
								placeholder='e.g., HVAC System, Water Heater'
								style={{
									width: '100%',
									padding: '8px',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '14px',
								}}
								required
							/>
						</div>

						<div>
							<label
								style={{
									display: 'block',
									marginBottom: '4px',
									fontWeight: 'bold',
								}}>
								Brand
							</label>
							<input
								type='text'
								value={deviceFormData.brand}
								onChange={(e) => handleFormChange('brand', e.target.value)}
								placeholder='Brand name'
								style={{
									width: '100%',
									padding: '8px',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '14px',
								}}
							/>
						</div>

						<div>
							<label
								style={{
									display: 'block',
									marginBottom: '4px',
									fontWeight: 'bold',
								}}>
								Model
							</label>
							<input
								type='text'
								value={deviceFormData.model}
								onChange={(e) => handleFormChange('model', e.target.value)}
								placeholder='Model number'
								style={{
									width: '100%',
									padding: '8px',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '14px',
								}}
							/>
						</div>

						<div>
							<label
								style={{
									display: 'block',
									marginBottom: '4px',
									fontWeight: 'bold',
								}}>
								Status
							</label>
							<select
								value={deviceFormData.status}
								onChange={(e) => handleFormChange('status', e.target.value)}
								style={{
									width: '100%',
									padding: '8px',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '14px',
								}}>
								<option value='Active'>Active</option>
								<option value='Maintenance'>Maintenance</option>
								<option value='Broken'>Broken</option>
								<option value='Decommissioned'>Decommissioned</option>
							</select>
						</div>

						<div>
							<label
								style={{
									display: 'block',
									marginBottom: '4px',
									fontWeight: 'bold',
								}}>
								Installation Date
							</label>
							<input
								type='date'
								value={deviceFormData.installationDate}
								onChange={(e) =>
									handleFormChange('installationDate', e.target.value)
								}
								style={{
									width: '100%',
									padding: '8px',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '14px',
								}}
							/>
						</div>

						{property.propertyType === 'Multi-Family' && (
							<div>
								<label
									style={{
										display: 'block',
										marginBottom: '4px',
										fontWeight: 'bold',
									}}>
									Unit (Optional)
								</label>
								<select
									value={deviceFormData.location.unitId || ''}
									onChange={(e) =>
										handleFormChange('location.unitId', e.target.value)
									}
									style={{
										width: '100%',
										padding: '8px',
										border: '1px solid #ccc',
										borderRadius: '4px',
										fontSize: '14px',
									}}>
									<option value=''>Property Level (no specific unit)</option>
									{units.map((unit: any) => (
										<option key={unit.id} value={unit.id}>
											{unit.name}
										</option>
									))}
								</select>
							</div>
						)}

						<div>
							<label
								style={{
									display: 'block',
									marginBottom: '4px',
									fontWeight: 'bold',
								}}>
								Manuals & Documentation
							</label>
							<input
								ref={fileInputRef}
								type='file'
								multiple
								accept='.pdf,.doc,.docx,.txt,image/*'
								onChange={handleFileUpload}
								style={{ display: 'none' }}
								id='device-file-upload'
							/>
							<button
								type='button'
								onClick={() => fileInputRef.current?.click()}
								style={{
									width: '100%',
									padding: '10px',
									border: '2px dashed #ccc',
									borderRadius: '4px',
									background: '#f9f9f9',
									cursor: 'pointer',
									fontSize: '14px',
									color: '#666',
								}}>
								<FontAwesomeIcon
									icon={faUpload}
									style={{ marginRight: '8px' }}
								/>
								Upload Files (Manuals, Warranties, etc.)
							</button>
							{deviceFormData.files && deviceFormData.files.length > 0 && (
								<div style={{ marginTop: '8px' }}>
									{deviceFormData.files.map((file, index) => (
										<div
											key={index}
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												padding: '8px',
												background: '#f0f0f0',
												borderRadius: '4px',
												marginBottom: '4px',
											}}>
											<span
												style={{
													fontSize: '13px',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
												}}>
												{file.name} ({Math.round(file.size / 1024)} KB)
											</span>
											<button
												type='button'
												onClick={() => handleRemoveFile(index)}
												style={{
													background: 'transparent',
													border: 'none',
													cursor: 'pointer',
													color: '#ef4444',
													padding: '4px',
												}}>
												<FontAwesomeIcon icon={faTimes} />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</GenericModal>
			)}
		</SectionContainer>
	);
};
