import React, { useState } from 'react';
import { Task } from '../../../Redux/API/apiSlice';
import { GenericModal } from './GenericModal';
import {
	FormGroup,
	FormGrid,
	FormLabel,
	FormInput,
	FormSelect,
	FormTextarea,
	FormGroupFull,
} from './ModalStyles';
import styled from 'styled-components';

interface TaskDetailModalProps {
	isOpen: boolean;
	task: Task;
	onClose: () => void;
	onUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
	onDelete?: (taskId: string) => Promise<void>;
	onComplete?: (taskId: string) => void;
}

const ButtonGroup = styled.div`
	display: flex;
	gap: 10px;
	margin-top: 20px;
	border-top: 1px solid #e5e7eb;
	padding-top: 20px;
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' }>`
	flex: 1;
	padding: 10px 16px;
	border: none;
	border-radius: 6px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	background: ${(props) =>
		props.variant === 'danger' ? '#ef4444' : '#3b82f6'};
	color: white;

	&:hover {
		opacity: 0.9;
	}

	&:active {
		transform: scale(0.98);
	}
`;

const InfoRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px;
	background: #f9fafb;
	border-radius: 6px;
	margin-bottom: 12px;

	&:last-child {
		margin-bottom: 0;
	}
`;

const InfoLabel = styled.span`
	font-size: 13px;
	color: #6b7280;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.3px;
`;

const InfoValue = styled.span<{ color?: string }>`
	font-size: 14px;
	font-weight: 500;
	color: ${(props) => props.color || '#374151'};
`;

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
	isOpen,
	task,
	onClose,
	onUpdate,
	onDelete,
	onComplete,
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState<Partial<Task>>(task);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const getStatusColor = (status?: string) => {
		switch (status?.toLowerCase()) {
			case 'completed':
				return '#10b981';
			case 'in progress':
				return '#3b82f6';
			case 'pending':
				return '#f59e0b';
			case 'awaiting approval':
				return '#8b5cf6';
			case 'rejected':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	};

	const getPriorityColor = (priority?: string) => {
		switch (priority?.toLowerCase()) {
			case 'high':
				return '#dc2626';
			case 'medium':
				return '#f59e0b';
			case 'low':
				return '#10b981';
			default:
				return '#6b7280';
		}
	};

	const handleSave = async () => {
		if (!onUpdate) return;

		setIsSaving(true);
		try {
			await onUpdate(task.id, editData);
			setIsEditing(false);
			onClose();
		} catch (error) {
			console.error('Failed to update task:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (
			!onDelete ||
			!window.confirm('Are you sure you want to delete this task?')
		)
			return;

		setIsDeleting(true);
		try {
			await onDelete(task.id);
			onClose();
		} catch (error) {
			console.error('Failed to delete task:', error);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleComplete = () => {
		if (onComplete) {
			onComplete(task.id);
			onClose();
		}
	};

	return (
		<GenericModal
			isOpen={isOpen}
			onClose={onClose}
			title={isEditing ? 'Edit Task' : task.title}>
			{isEditing ? (
				<div>
					<FormGroupFull>
						<FormLabel>Title</FormLabel>
						<FormInput
							type='text'
							value={editData.title || ''}
							onChange={(e) =>
								setEditData({ ...editData, title: e.target.value })
							}
							placeholder='Task title'
						/>
					</FormGroupFull>

					<FormGrid>
						<FormGroup>
							<FormLabel>Status</FormLabel>
							<FormSelect
								value={editData.status || 'Pending'}
								onChange={(e) =>
									setEditData({ ...editData, status: e.target.value as any })
								}>
								<option>Pending</option>
								<option>In Progress</option>
								<option>Awaiting Approval</option>
								<option>Completed</option>
								<option>Rejected</option>
							</FormSelect>
						</FormGroup>

						<FormGroup>
							<FormLabel>Priority</FormLabel>
							<FormSelect
								value={editData.priority || 'Low'}
								onChange={(e) =>
									setEditData({ ...editData, priority: e.target.value as any })
								}>
								<option>Low</option>
								<option>Medium</option>
								<option>High</option>
								<option>Urgent</option>
							</FormSelect>
						</FormGroup>
					</FormGrid>

					<FormGrid>
						<FormGroup>
							<FormLabel>Due Date</FormLabel>
							<FormInput
								type='date'
								value={editData.dueDate || ''}
								onChange={(e) =>
									setEditData({ ...editData, dueDate: e.target.value })
								}
							/>
						</FormGroup>
					</FormGrid>

					<FormGroupFull>
						<FormLabel>Notes</FormLabel>
						<FormTextarea
							value={editData.notes || ''}
							onChange={(e) =>
								setEditData({ ...editData, notes: e.target.value })
							}
							placeholder='Task notes'
							rows={4}
						/>
					</FormGroupFull>

					<ButtonGroup>
						<Button onClick={() => setIsEditing(false)}>Cancel</Button>
						<Button onClick={handleSave} disabled={isSaving}>
							{isSaving ? 'Saving...' : 'Save Changes'}
						</Button>
					</ButtonGroup>
				</div>
			) : (
				<div>
					<InfoRow>
						<InfoLabel>Status</InfoLabel>
						<InfoValue color={getStatusColor(task.status)}>
							{task.status || 'Pending'}
						</InfoValue>
					</InfoRow>

					<InfoRow>
						<InfoLabel>Priority</InfoLabel>
						<InfoValue color={getPriorityColor(task.priority)}>
							{task.priority || 'Normal'}
						</InfoValue>
					</InfoRow>

					<InfoRow>
						<InfoLabel>Property</InfoLabel>
						<InfoValue>{task.property || 'Unknown'}</InfoValue>
					</InfoRow>

					{task.dueDate && (
						<InfoRow>
							<InfoLabel>Due Date</InfoLabel>
							<InfoValue>
								{new Date(task.dueDate).toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
								})}
							</InfoValue>
						</InfoRow>
					)}

					{task.assignedTo && (
						<InfoRow>
							<InfoLabel>Assigned To</InfoLabel>
							<InfoValue>{task.assignedTo.name}</InfoValue>
						</InfoRow>
					)}

					{task.notes && (
						<div style={{ marginTop: 16 }}>
							<FormLabel>Notes</FormLabel>
							<div
								style={{
									padding: '12px',
									background: '#f9fafb',
									borderRadius: '6px',
									fontSize: '14px',
									color: '#4b5563',
									lineHeight: '1.5',
									marginTop: '8px',
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word',
								}}>
								{task.notes}
							</div>
						</div>
					)}

					<ButtonGroup>
						{task.status !== 'Completed' && (
							<Button
								onClick={handleComplete}
								style={{ backgroundColor: '#10b981' }}>
								✓ Complete
							</Button>
						)}
						<Button onClick={() => setIsEditing(true)}>Edit</Button>
						{onDelete && (
							<Button
								onClick={handleDelete}
								variant='danger'
								disabled={isDeleting}>
								{isDeleting ? 'Deleting...' : 'Delete'}
							</Button>
						)}
					</ButtonGroup>
				</div>
			)}
		</GenericModal>
	);
};

export default TaskDetailModal;
