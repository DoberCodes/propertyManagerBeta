import React from 'react';
import GenericModal from './GenericModal';
import { FormGroup, FormInput, FormLabel } from './ModalStyles';
import { Property } from '../../../types/Property.types';
import { FileUploader } from '../FileUploader';

interface DeviceModalProps {
	// Props for controlling modal visibility and form data would go here
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (event: React.FormEvent) => void;
	property: Property; // The property to which the device will be added, can be used for context in the form
	units?: any[]; // Optional, in case we want to link devices to units
	deviceFormData: {
		type: string;
		brand: string;
		model: string;
		installationDate: string;
		associatedUnit?: string; // Optional field for linking to a unit
		file?: File | null; // For storing the uploaded file
	};
	onFormChange: (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => void;
}

export const DeviceModal = (props: DeviceModalProps) => {
	return (
		<GenericModal
			isOpen={props.isOpen}
			onClose={props.onClose}
			title='Add New Household Device'
			onSubmit={props.onSubmit}
			showActions={true}
			primaryButtonLabel='Add Device'
			secondaryButtonLabel='Cancel'>
			<FormGroup>
				<FormLabel>Device Type *</FormLabel>
				<FormInput
					type='text'
					name='type'
					value={props.deviceFormData.type}
					onChange={props.onFormChange}
					placeholder='e.g., HVAC System, Water Heater'
					required
				/>
			</FormGroup>

			<FormGroup>
				<FormLabel>Brand *</FormLabel>
				<FormInput
					type='text'
					name='brand'
					value={props.deviceFormData.brand}
					onChange={props.onFormChange}
					placeholder='e.g., Carrier, Rheem'
					required
				/>
			</FormGroup>

			<FormGroup>
				<FormLabel>Model *</FormLabel>
				<FormInput
					type='text'
					name='model'
					value={props.deviceFormData.model}
					onChange={props.onFormChange}
					placeholder='e.g., AquaEdge, Prestige'
					required
				/>
			</FormGroup>

			<FormGroup>
				<FormLabel>Installation Date *</FormLabel>
				<FormInput
					type='date'
					name='installationDate'
					value={props.deviceFormData.installationDate}
					onChange={props.onFormChange}
					required
				/>
			</FormGroup>
			{props.property.propertyType === 'Multi-Family' && (
				<FormGroup>
					<FormLabel>Associated Unit (optional)</FormLabel>
					<FormInput
						type='text'
						name='associatedUnit'
						value={props.deviceFormData.associatedUnit || ''}
						onChange={props.onFormChange}
						placeholder='e.g., Unit A1'
					/>
				</FormGroup>
			)}

			<FileUploader setFile={(file) => console.info(file)} />
		</GenericModal>
	);
};
