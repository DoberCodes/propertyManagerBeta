import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import {
	useCreateUnitMutation,
	useDeleteUnitMutation,
} from '../../Redux/API/propertySlice';

interface UnitFormData {
	name: string;
	floor: string;
	area: string;
}

export const useUnitHandlers = (propertyId: string) => {
	const [showUnitDialog, setShowUnitDialog] = useState(false);
	const [unitFormData, setUnitFormData] = useState<UnitFormData>({
		name: '',
		floor: '',
		area: '',
	});

	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [createUnit] = useCreateUnitMutation();
	const [deleteUnit] = useDeleteUnitMutation();

	const handleCreateUnit = () => {
		setUnitFormData({
			name: '',
			floor: '',
			area: '',
		});
		setShowUnitDialog(true);
	};

	const handleUnitFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setUnitFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleUnitFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!currentUser) return;
		if (!propertyId) {
			console.error('No property ID available for unit creation');
			return;
		}

		try {
			await createUnit({
				userId: currentUser.id,
				propertyId,
				name: unitFormData.name,
				floor: parseInt(unitFormData.floor) || 0,
				area: parseInt(unitFormData.area) || 0,
				isOccupied: false,
				deviceIds: [],
				occupants: [],
			}).unwrap();

			setShowUnitDialog(false);
			setUnitFormData({
				name: '',
				floor: '',
				area: '',
			});
		} catch (error) {
			console.error('Failed to create unit:', error);
		}
	};

	const handleDeleteUnit = async (unitId: string) => {
		try {
			await deleteUnit(unitId).unwrap();
		} catch (error) {
			console.error('Failed to delete unit:', error);
		}
	};

	return {
		showUnitDialog,
		setShowUnitDialog,
		unitFormData,
		handleCreateUnit,
		handleUnitFormChange,
		handleUnitFormSubmit,
		handleDeleteUnit,
	};
};
