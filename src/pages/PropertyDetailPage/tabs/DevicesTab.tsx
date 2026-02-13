import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faPlus,
	faEdit,
	faTrash,
	faWrench,
} from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../Redux/store';
import { uploadDeviceFile } from '../../../utils/deviceFileUpload';
import {
	useGetDevicesQuery,
	useCreateDeviceMutation,
	useUpdateDeviceMutation,
	useDeleteDeviceMutation,
} from '../../../Redux/API/deviceSlice';
import { useGetUnitsQuery } from '../../../Redux/API/propertySlice';
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
	DeviceCard,
} from '../PropertyDetailPage.styles';
import { DeviceModal } from '../../../Components/Library/Modal';
import { Property } from '../../../types/Property.types';
import {
	MobileCarouselContainer,
	MobileCarouselViewport,
	MobileCarouselTrack,
	DeviceRow,
	MobileDots,
	MobileDot,
	DesktopTableWrapper,
} from './index.styles';
import { ReusableTable } from '../../../Components/Library';
import { Column } from '../../../Components/Library/ReusableTable';

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

	// Mobile carousel index
	const [carouselIndex, setCarouselIndex] = useState(0);

	const { data: devices = [], isLoading } = useGetDevicesQuery(property.id);
	const { data: units = [] } = useGetUnitsQuery(property.id);

	const columns: Column[] = [
		{ header: 'Type', accessor: 'type' },
		{ header: 'Brand', accessor: 'brand' },
		{ header: 'Model', accessor: 'model' },
		{ header: 'Installation Date', accessor: 'installationDate', type: 'date' },
		{ header: 'Status', accessor: 'status' },
		{
			header: 'Location',
			accessor: 'location.unitId',
			type: 'dropdown',
			options: (row) => {
				const unit = units.find((u) => u.id === row.location.unitId);
				return unit ? [unit.name] : [];
			},
		},
		{ header: 'Files', accessor: 'files', type: 'text' },
	];

	// Reset/ clamp carousel index when device list changes
	useEffect(() => {
		if (carouselIndex > devices.length - 1) {
			setCarouselIndex(Math.max(0, devices.length - 1));
		}
		if (devices.length === 0) setCarouselIndex(0);
	}, [devices.length, carouselIndex]);
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

			{/* Mobile carousel (shows when viewport <= 1024px) */}
			<MobileCarouselContainer>
				<MobileCarouselViewport>
					<MobileCarouselTrack index={carouselIndex}>
						{devices.map((device) => (
							<DeviceCard key={device.id}>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}>
									<div style={{ fontWeight: 700 }}>{device.type}</div>
									<div style={{ fontSize: 12, color: '#6b7280' }}>
										{device.brand}
									</div>
								</div>
								<DeviceRow>
									<div style={{ fontSize: 14 }}>{device.model || '—'}</div>
									<div
										style={{
											fontSize: 12,
											color: getStatusColor(device.status || 'Active'),
											fontWeight: 700,
										}}>
										{device.status || 'Active'}
									</div>
								</DeviceRow>
								<DeviceRow>
									<div style={{ fontSize: 12, color: '#6b7280' }}>
										{device.installationDate
											? new Date(device.installationDate).toLocaleDateString()
											: 'N/A'}
									</div>
									<div style={{ display: 'flex', gap: 8 }}>
										<button
											onClick={() => handleOpenEditModal(device)}
											style={{
												background: 'transparent',
												border: 'none',
												cursor: 'pointer',
											}}>
											<FontAwesomeIcon icon={faEdit} />
										</button>
										<button
											onClick={() => handleDeleteDevice(device.id)}
											style={{
												background: 'transparent',
												border: 'none',
												cursor: 'pointer',
												color: '#ef4444',
											}}>
											<FontAwesomeIcon icon={faTrash} />
										</button>
									</div>
								</DeviceRow>
								{device.files && device.files.length > 0 ? (
									<div
										style={{
											marginTop: 8,
											display: 'flex',
											gap: 8,
											flexWrap: 'wrap',
										}}>
										{device.files.map((file, i) => (
											<a
												key={i}
												href={file.url}
												target='_blank'
												rel='noopener noreferrer'
												style={{
													fontSize: 12,
													color: '#2563eb',
													textDecoration: 'none',
												}}>
												{file.name}
											</a>
										))}
									</div>
								) : null}
							</DeviceCard>
						))}
					</MobileCarouselTrack>
				</MobileCarouselViewport>
				<MobileDots>
					{devices.map((_, i) => (
						<MobileDot
							key={i}
							active={i === carouselIndex}
							onClick={() => setCarouselIndex(i)}
						/>
					))}
				</MobileDots>
			</MobileCarouselContainer>

			{devices.length === 0 ? (
				<EmptyState>
					<FontAwesomeIcon icon={faWrench} size='3x' color='#ccc' />
					<p>No devices added yet</p>
					<p>Click "Add Device" to get started</p>
				</EmptyState>
			) : (
				<DesktopTableWrapper>
					<ReusableTable columns={columns} rowData={devices}></ReusableTable>
				</DesktopTableWrapper>
			)}
			{/* Device Modal */}
			<DeviceModal
				isOpen={showDeviceModal}
				onClose={handleCloseModal}
				onSubmit={handleSubmit}
				deviceFormData={deviceFormData}
				onFormChange={(e) =>
					handleFormChange(e.currentTarget.name, e.currentTarget.value)
				}
				property={property}
			/>
		</SectionContainer>
	);
};
