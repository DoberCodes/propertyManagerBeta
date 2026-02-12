import React, { useState, useEffect, useMemo } from 'react';
import {
	useGetContractorsByPropertyQuery,
	useDeleteContractorMutation,
} from '../../../Redux/API/apiSlice';
import {
	Contractor,
	ContractorCategory,
} from '../../../types/Contractor.types';
import { ContractorForm } from './ContractorForm';
import { DeleteConfirmationModal } from '../../../Components/Library/Modal/DeleteConfirmationModal';
import {
	FilterBar,
	FilterConfig,
	FilterValues,
} from '../../../Components/Library/FilterBar';
import { applyFilters } from '../../../utils/tableFilters';
import { SmallButton } from '../../../Components/Library/Buttons/ButtonStyles';
import { ToolbarButton, Toolbar } from '../PropertyDetailPage.styles';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import styled from 'styled-components';

interface ContractorsTabProps {
	propertyId: string;
}

const HeaderContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
	gap: 1rem;

	h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #333;
	}

	@media (max-width: 480px) {
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;

		h2 {
			font-size: 1.25rem;
			flex-basis: 100%;
			text-align: center;
		}
	}
`;

const TableContainer = styled.div`
	overflow-x: auto;
	border: 1px solid #ddd;
	border-radius: 4px;

	@media (max-width: 768px) {
		display: none;
	}
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;

	thead {
		background-color: #f5f5f5;
		font-weight: 600;
	}

	th,
	td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #ddd;

		&:last-child {
			text-align: center;
		}
	}

	tbody tr:hover {
		background-color: #f9f9f9;
	}
`;

const MobileCarouselContainer = styled.div`
	display: none;

	@media (max-width: 768px) {
		display: flex;
		flex-direction: column;
		gap: 16px;
		background: #f9fafb;
		border-radius: 10px;
		padding: 16px;
	}
`;

const MobileCarouselViewport = styled.div`
	width: 100%;
	overflow: hidden;
	border-radius: 8px;
`;

const MobileCarouselTrack = styled.div`
	display: flex;
	transition: transform 0.3s ease-out;
	user-select: none;
	-webkit-user-select: none;
`;

const ContractorCard = styled.div`
	min-width: 100%;
	flex: 0 0 100%;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 10px;
	padding: 16px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	display: flex;
	flex-direction: column;
	gap: 12px;
	margin-right: 12px;
`;

const ContractorHeader = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const ContractorCompany = styled.div`
	font-size: 16px;
	font-weight: 700;
	color: #111827;
`;

const ContractorName = styled.div`
	font-size: 14px;
	color: #4b5563;
`;

const ContractorRow = styled.div`
	font-size: 14px;
	color: #374151;

	a {
		color: #2563eb;
		text-decoration: none;
	}
`;

const MobileActions = styled.div`
	display: flex;
	gap: 8px;
`;

const MobileDots = styled.div`
	display: flex;
	justify-content: center;
	gap: 6px;
`;

const MobileDot = styled.button<{ active?: boolean }>`
	width: 8px;
	height: 8px;
	border-radius: 999px;
	border: none;
	background: ${(props) => (props.active ? '#22c55e' : '#d1d5db')};
	cursor: pointer;
`;

const CategoryBadge = styled.span<{ category: ContractorCategory }>`
	display: inline-block;
	padding: 0.25rem 0.75rem;
	border-radius: 12px;
	font-size: 0.85rem;
	font-weight: 500;
	background-color: ${(props) => {
		const colors: Record<ContractorCategory, string> = {
			Landscaper: '#E8F5E9',
			Contractor: '#E3F2FD',
			'Pest Control': '#FFF3E0',
			Plumber: '#FCE4EC',
			Electrician: '#F3E5F5',
			HVAC: '#E0F2F1',
			Roofer: '#EFEBE9',
			Painter: '#FBE9E7',
			'Cleaning Service': '#F1F8E9',
			Handyman: '#E8EAF6',
			Other: '#EEEEEE',
		};
		return colors[props.category] || '#EEEEEE';
	}};
	color: ${(props) => {
		const colors: Record<ContractorCategory, string> = {
			Landscaper: '#1B5E20',
			Contractor: '#0D47A1',
			'Pest Control': '#E65100',
			Plumber: '#880E4F',
			Electrician: '#4A148C',
			HVAC: '#004D40',
			Roofer: '#3E2723',
			Painter: '#BF360C',
			'Cleaning Service': '#33691E',
			Handyman: '#311B92',
			Other: '#424242',
		};
		return colors[props.category] || '#424242';
	}};
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 2rem;
	color: #666;

	p {
		margin: 0 0 1rem 0;
		font-size: 1rem;
	}
`;

const LoadingSpinner = styled.div`
	text-align: center;
	padding: 2rem;
	color: #666;
`;

export const ContractorsTab: React.FC<ContractorsTabProps> = ({
	propertyId,
}) => {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingContractor, setEditingContractor] = useState<Contractor | null>(
		null,
	);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [contractorToDelete, setContractorToDelete] =
		useState<Contractor | null>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState(0);
	const [filters, setFilters] = useState<FilterValues>({});
	const [showFilters, setShowFilters] = useState(false);

	const {
		data: contractors = [],
		isLoading,
		error,
	} = useGetContractorsByPropertyQuery(propertyId, {
		skip: !propertyId,
	});
	const [deleteContractor, { isLoading: isDeleting }] =
		useDeleteContractorMutation();

	useEffect(() => {
		setCurrentIndex(0);
	}, [contractors.length]);

	// Filter configuration for contractors
	const contractorFilters: FilterConfig[] = [
		{
			key: 'category',
			label: 'Category',
			type: 'select',
			options: [
				{ value: 'Landscaper', label: 'Landscaper' },
				{ value: 'Contractor', label: 'Contractor' },
				{ value: 'Pest Control', label: 'Pest Control' },
				{ value: 'Plumber', label: 'Plumber' },
				{ value: 'Electrician', label: 'Electrician' },
				{ value: 'HVAC', label: 'HVAC' },
				{ value: 'Roofer', label: 'Roofer' },
				{ value: 'Painter', label: 'Painter' },
				{ value: 'Cleaning Service', label: 'Cleaning Service' },
			],
		},
	];

	// Apply filters to contractors
	const filteredContractors = useMemo(() => {
		return applyFilters(contractors, filters, {
			textFields: ['company', 'name', 'email', 'phone', 'address'],
			selectFields: [{ field: 'category', filterKey: 'category' }],
		});
	}, [contractors, filters]);

	const handleDragEnd = (endPos: number) => {
		if (!isDragging) return;
		setIsDragging(false);
		const diff = dragStart - endPos;
		const threshold = 50;
		if (Math.abs(diff) > threshold) {
			if (diff > 0 && currentIndex < contractors.length - 1) {
				setCurrentIndex(currentIndex + 1);
			} else if (diff < 0 && currentIndex > 0) {
				setCurrentIndex(currentIndex - 1);
			}
		}
	};

	const handleDeleteClick = (contractor: Contractor) => {
		setContractorToDelete(contractor);
		setIsDeleteModalOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!contractorToDelete) {
			return;
		}
		try {
			await deleteContractor(contractorToDelete.id).unwrap();
			setIsDeleteModalOpen(false);
			setContractorToDelete(null);
		} catch (error) {
			console.error('Failed to delete contractor:', error);
		}
	};

	const handleDeleteCancel = () => {
		setIsDeleteModalOpen(false);
		setContractorToDelete(null);
	};

	const handleEdit = (contractor: Contractor) => {
		setEditingContractor(contractor);
		setIsFormOpen(true);
	};

	const handleAddNew = () => {
		setEditingContractor(null);
		setIsFormOpen(true);
	};

	const handleFormClose = () => {
		setIsFormOpen(false);
		setEditingContractor(null);
	};

	if (!propertyId) {
		return (
			<EmptyState>
				<p>Property not loaded yet.</p>
				<p>Please try again in a moment.</p>
			</EmptyState>
		);
	}

	if (isLoading) {
		return <LoadingSpinner>Loading contractors...</LoadingSpinner>;
	}

	if (error) {
		return (
			<EmptyState>
				<p>Unable to load contractors.</p>
				<p>Please try again in a moment.</p>
			</EmptyState>
		);
	}

	return (
		<SectionContainer>
			<SectionHeader>Contractors & Vendors</SectionHeader>
			<Toolbar>
				<ToolbarButton onClick={handleAddNew}>+ Add Contractor</ToolbarButton>
			</Toolbar>

			{/* Collapsable Filter Section */}
			<div style={{ marginBottom: '16px' }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						marginBottom: showFilters ? '12px' : '0',
					}}>
					<input
						type='text'
						placeholder='Search contractors...'
						value={(filters.search as string) || ''}
						onChange={(e) =>
							setFilters((prev) => ({
								...prev,
								search: e.target.value,
							}))
						}
						style={{
							flex: 1,
							padding: '8px 12px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							fontSize: '14px',
						}}
					/>
					<button
						onClick={() => setShowFilters(!showFilters)}
						style={{
							padding: '8px 10px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							background: '#f9fafb',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							whiteSpace: 'nowrap',
						}}
						title={showFilters ? 'Hide filters' : 'Show filters'}>
						{showFilters ? '▲ Hide Filters' : '▼ Filters'}
					</button>
				</div>
				{showFilters && (
					<FilterBar
						filters={contractorFilters}
						onFiltersChange={setFilters}
						hideOnMobile={true}
					/>
				)}
			</div>

			{isFormOpen && (
				<ContractorForm
					propertyId={propertyId}
					contractor={editingContractor}
					onClose={handleFormClose}
				/>
			)}
			{filteredContractors.length === 0 ? (
				<EmptyState>
					<p>No contractors found matching your filters.</p>
					<p>Try adjusting your search criteria.</p>
				</EmptyState>
			) : (
				<>
					<TableContainer>
						<Table>
							<thead>
								<tr>
									<th>Company</th>
									<th>Contact Name</th>
									<th>Phone</th>
									<th>Category</th>
									<th>Address</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredContractors.map((contractor: Contractor) => (
									<tr key={contractor.id}>
										<td>
											<strong>{contractor.company}</strong>
										</td>
										<td>{contractor.name}</td>
										<td>
											<a href={`tel:${contractor.phone}`}>{contractor.phone}</a>
										</td>
										<td>
											<CategoryBadge category={contractor.category}>
												{contractor.category}
											</CategoryBadge>
										</td>
										<td>{contractor.address || '—'}</td>
										<td>
											<div
												style={{
													display: 'flex',
													gap: '0.5rem',
													justifyContent: 'center',
												}}>
												<ToolbarButton
													onClick={() => handleEdit(contractor)}
													style={{
														padding: '0.25rem 0.5rem',
														fontSize: '0.8rem',
													}}>
													Edit
												</ToolbarButton>
												<ToolbarButton
													className='delete'
													onClick={() => handleDeleteClick(contractor)}
													style={{
														padding: '0.25rem 0.5rem',
														fontSize: '0.8rem',
													}}>
													Delete
												</ToolbarButton>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</Table>
					</TableContainer>

					<MobileCarouselContainer>
						<MobileCarouselViewport>
							<MobileCarouselTrack
								onMouseDown={(e) => {
									setIsDragging(true);
									setDragStart(e.clientX);
								}}
								onMouseUp={(e) => handleDragEnd(e.clientX)}
								onTouchStart={(e) => {
									setIsDragging(true);
									setDragStart(e.touches[0].clientX);
								}}
								onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
								style={{
									transform: `translateX(calc(-${currentIndex} * (100% + 12px)))`,
									cursor: isDragging ? 'grabbing' : 'grab',
								}}>
								{filteredContractors.map((contractor) => (
									<ContractorCard key={contractor.id}>
										<ContractorHeader>
											<ContractorCompany>
												{contractor.company}
											</ContractorCompany>
											<ContractorName>{contractor.name}</ContractorName>
										</ContractorHeader>
										<ContractorRow>
											Phone:{' '}
											<a href={`tel:${contractor.phone}`}>{contractor.phone}</a>
										</ContractorRow>
										<ContractorRow>
											Category:{' '}
											<CategoryBadge category={contractor.category}>
												{contractor.category}
											</CategoryBadge>
										</ContractorRow>
										{contractor.address && (
											<ContractorRow>
												Address: {contractor.address}
											</ContractorRow>
										)}
										{contractor.email && (
											<ContractorRow>
												Email:{' '}
												<a href={`mailto:${contractor.email}`}>
													{contractor.email}
												</a>
											</ContractorRow>
										)}
										<MobileActions>
											<ToolbarButton
												onClick={() => handleEdit(contractor)}
												style={{ flex: 1, padding: '0.5rem' }}>
												Edit
											</ToolbarButton>
											<ToolbarButton
												className='delete'
												onClick={() => handleDeleteClick(contractor)}
												style={{ flex: 1, padding: '0.5rem' }}>
												Delete
											</ToolbarButton>
										</MobileActions>
									</ContractorCard>
								))}
							</MobileCarouselTrack>
						</MobileCarouselViewport>

						{filteredContractors.length > 1 && (
							<MobileDots>
								{filteredContractors.map((_, index) => (
									<MobileDot
										key={index}
										active={index === currentIndex}
										onClick={() => setCurrentIndex(index)}
									/>
								))}
							</MobileDots>
						)}
					</MobileCarouselContainer>
				</>
			)}
		</SectionContainer>
	);
};
