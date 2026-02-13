import React, { useMemo } from 'react';
import { UnitsTabProps } from '../../../types/PropertyDetailPage.types';
import { useNavigate } from 'react-router-dom';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { useGetUnitDevicesQuery } from '../../../Redux/API/deviceSlice';
import {
	ReusableTable,
	Column,
	Action,
} from '../../../Components/Library/ReusableTable';
import { EmptyState, Toolbar, ToolbarButton } from './index.styles';
import { faTrash, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

const UnitDeviceCount: React.FC<{ unitId: string }> = ({ unitId }) => {
	const { data: unitDevices = [] } = useGetUnitDevicesQuery(unitId, {
		skip: !unitId,
	});
	return <>{unitDevices.length}</>;
};

export const UnitsTab: React.FC<UnitsTabProps> = ({
	property,
	units,
	handleCreateUnit,
	handleDeleteUnit,
}) => {
	const navigate = useNavigate();

	const handleNavigate = (unit: any) => {
		navigate(
			`/property/${property.slug}/unit/${unit.name
				.replace(/\s+/g, '-')
				.toLowerCase()}`,
		);
	};

	const columns: Column[] = [
		{
			header: 'Unit Name',
			key: 'name',
			render: (value: string) => <strong>{value}</strong>,
		},
		{
			header: 'Occupants',
			key: 'occupants',
			render: (value: any[]) => (value || []).length,
		},
		{
			header: 'Devices',
			key: 'id',
			render: (id: string) => <UnitDeviceCount unitId={id} />,
		},
	];

	const actions: Action[] = [
		{
			label: 'View',
			icon: faExternalLinkAlt,
			onClick: (unit: any) => handleNavigate(unit),
		},
		{
			label: 'Delete',
			icon: faTrash,
			onClick: (unit: any) => handleDeleteUnit(unit.id),
			className: 'delete',
		},
	];

	return (
		<SectionContainer>
			<SectionHeader>Units</SectionHeader>
			<Toolbar>
				<ToolbarButton onClick={handleCreateUnit}>+ Create Unit</ToolbarButton>
			</Toolbar>
			{units && units.length > 0 ? (
				<ReusableTable
					columns={columns}
					rowData={units}
					actions={actions}
					emptyMessage='No units added to this property'
				/>
			) : (
				<EmptyState>
					<p>No units added to this property</p>
				</EmptyState>
			)}
		</SectionContainer>
	);
};
