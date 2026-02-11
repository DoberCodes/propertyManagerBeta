import React from 'react';
import { GenericModal } from './GenericModal';
import { FormGroup, FormLabel, FormInput } from './ModalStyles';

interface UnitFormData {
	name: string;
	floor: string;
	area: string;
}

interface CreateUnitModalProps {
	isOpen: boolean;
	formData: UnitFormData;
	onClose: () => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onChange: (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => void;
}

/**
 * Create Unit Modal Component
 * Handles creating new units for a property
 */
export const CreateUnitModal: React.FC<CreateUnitModalProps> = ({
	isOpen,
	formData,
	onClose,
	onSubmit,
	onChange,
}) => {
	return (
		<GenericModal
			isOpen={isOpen}
			onClose={onClose}
			title='Create Unit'
			onSubmit={onSubmit}
			primaryButtonLabel='Create Unit'
			secondaryButtonLabel='Cancel'
			secondaryButtonAction={onClose}
			showActions={true}>
			<FormGroup>
				<FormLabel>Unit Name *</FormLabel>
				<FormInput
					type='text'
					name='name'
					value={formData.name}
					onChange={onChange}
					placeholder='e.g., Unit 101, Apartment A'
					required
				/>
			</FormGroup>

			<FormGroup>
				<FormLabel>Floor *</FormLabel>
				<FormInput
					type='number'
					name='floor'
					value={formData.floor}
					onChange={onChange}
					placeholder='e.g., 1'
					required
				/>
			</FormGroup>

			<FormGroup>
				<FormLabel>Area (sq ft) *</FormLabel>
				<FormInput
					type='number'
					name='area'
					value={formData.area}
					onChange={onChange}
					placeholder='e.g., 800'
					required
				/>
			</FormGroup>
		</GenericModal>
	);
};

export default CreateUnitModal;
