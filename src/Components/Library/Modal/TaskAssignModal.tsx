import { useSelector } from 'react-redux';
import { RootState } from '../../../Redux/store';
import GenericModal from './GenericModal';
import { FormGroup, FormLabel, FormSelect } from './ModalStyles';
import React, { useCallback, useEffect, useState } from 'react';
import { useGetAllPropertySharesForUserQuery } from '../../../Redux/API/userSlice';
import { useGetContractorsByPropertyQuery } from '../../../Redux/API/contractorSlice';
import { getFamilyMembers } from '../../../services/authService';
import { useUpdateTaskMutation } from '../../../Redux/API/taskSlice';

interface TaskAssignModalProps {
	isOpen: boolean;
	onClose: () => void;
	task: any;
	propertyId: string;
	unitId?: string;
	selectedAssignee: any;
}

export const TaskAssignModal = (props: TaskAssignModalProps) => {
	const currentUser = useSelector((state: any) => state.user.currentUser);

	const { data: contractors = [] } = useGetContractorsByPropertyQuery(
		props.propertyId,
	);
	const { data: propertyShares = [] } = useGetAllPropertySharesForUserQuery(
		currentUser?.id || '',
	);

	const [selectedAssignee, setSelectedAssignee] = useState<any>(
		props.selectedAssignee ?? { id: '', name: '', email: '' },
	);

	useEffect(() => {
		setSelectedAssignee(
			props.selectedAssignee ?? { id: '', name: '', email: '' },
		);
	}, [props.selectedAssignee]);
	const teamMembers = useSelector((state: RootState) =>
		state.team.groups.flatMap((group) => group.members),
	);

	const [familyMembers, setFamilyMembers] = useState<any[]>([]);

	useEffect(() => {
		const fetchFamilyMembers = async () => {
			if (currentUser?.accountId) {
				try {
					const members = await getFamilyMembers(currentUser.accountId);
					setFamilyMembers(members || []);
				} catch (error) {
					console.error('Error fetching family members:', error);
					setFamilyMembers([]);
				}
			}
		};

		fetchFamilyMembers();
	}, [currentUser?.accountId]);

	console.info(contractors);

	const fetchAssignees = useCallback(() => {
		const family = familyMembers;
		const totalAssignees = [
			...teamMembers.map((member) => ({
				id: member?.id,
				name: member?.firstName
					? `${member?.firstName} ${member?.lastName || ''}`.trim()
					: member?.email,
				email: member?.email,
			})),
			...contractors.map((contractor) => ({
				id: contractor?.id,
				name: contractor?.name
					? `${contractor?.name} (${contractor?.category})`
					: contractor?.email,
				email: contractor?.email,
			})),
			...family.map((member) => ({
				id: member?.id,
				name: member?.firstName
					? `${member?.firstName} ${member?.lastName || ''}`.trim()
					: member?.email,
				email: member?.email,
			})),
			...propertyShares.map((share) => ({
				id: share?.sharedWithUserId,
				name: share?.sharedWithFirstName
					? `${share?.sharedWithFirstName} ${
							share?.sharedWithLastName || ''
					  }`.trim()
					: share?.sharedWithEmail,
				email: share?.sharedWithEmail,
			})),
		];

		const formattedAssignees = totalAssignees.filter(
			(assignee, index, self) =>
				index === self.findIndex((a) => a.id === assignee.id),
		); // Remove duplicates based on ID

		// If there's a currently selected assignee that's not in the list, add them
		if (
			props.selectedAssignee?.id &&
			!formattedAssignees.find((a) => a.id === props.selectedAssignee.id)
		) {
			formattedAssignees.push(props.selectedAssignee);
		}

		return formattedAssignees;
	}, [currentUser, contractors, propertyShares, familyMembers, teamMembers]);

	const [assignTask] = useUpdateTaskMutation();
	console.info(props.task, 'Task in TaskAssignModal');

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		console.info('Assigning task to:', selectedAssignee);
		if (!selectedAssignee?.id) {
			alert('Please select an assignee');
			return;
		}

		console.info('Selected Assignee:', selectedAssignee);
		const updatedTask = {
			assignedTo: {
				id: selectedAssignee.id,
				name: selectedAssignee.name,
				email: selectedAssignee.email,
			},
		};
		assignTask({ id: props.task.id, updates: updatedTask })
			.unwrap()
			.then(() => {
				props.onClose();
			})
			.catch((error) => {
				console.error('Failed to assign task:', error);
			});
	};

	return (
		<GenericModal
			isOpen={props.isOpen}
			onClose={props.onClose}
			title='Assign Task to Team Member'
			showActions={true}
			primaryButtonLabel='Assign'
			onSubmit={handleSubmit}
			primaryButtonDisabled={!selectedAssignee?.id}
			secondaryButtonLabel='Cancel'>
			<FormGroup>
				<FormLabel>Assign To</FormLabel>
				<FormSelect
					value={selectedAssignee?.id || ''}
					onChange={(e) => {
						const selectedId = e.target.value;
						setSelectedAssignee(
							fetchAssignees().find(
								(assignee) => assignee.id === selectedId,
							) || { id: '', name: '', email: '' },
						);
					}}>
					<option value=''>Select a user...</option>
					{fetchAssignees().map((assignee) => (
						<option key={assignee.id} value={assignee.id}>
							{assignee.name}
						</option>
					))}
				</FormSelect>
			</FormGroup>
		</GenericModal>
	);
};
