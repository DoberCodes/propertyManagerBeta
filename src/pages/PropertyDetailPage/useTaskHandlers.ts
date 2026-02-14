import { useState } from 'react';
import { AppDispatch } from '../../Redux/store';
import { useDispatch } from 'react-redux';
import {
	deleteTask as deleteTaskAction,
	addTask,
	updateTask,
} from '../../Redux/Slices/propertyDataSlice';
import { TaskHandlers, Task } from '../../types/Task.types';

interface UseTaskHandlersProps {
	onDeleteClick?: (taskIds: string[]) => void;
	deleteTaskMutation?: any;
	createTaskMutation?: any;
	updateTaskMutation?: any;
}

export const useTaskHandlers = (props?: UseTaskHandlersProps): TaskHandlers => {
	const dispatch = useDispatch<AppDispatch>();
	const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
	const [showTaskDialog, setShowTaskDialog] = useState(false);
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
	const [editingTask, setEditingTask] = useState<any | null>(null);
	const [showTaskAssignDialog, setShowTaskAssignDialog] = useState(false);
	const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
	const [selectedAssignee, setSelectedAssignee] = useState<any>(null);
	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

	const handleTaskCheckbox = (taskId: string) => {
		setSelectedTasks([taskId]);
	};

	const handleCreateTask = () => {
		setEditingTaskId(null);
		setEditingTask(null);
		setShowTaskDialog(true);
	};

	const handleEditTask = (task?: any) => {
		if (task?.length !== 1) return;
		setEditingTaskId(task[0]);
		setShowTaskDialog(true);
	};

	const handleDeleteTask = () => {
		if (selectedTasks.length === 0) return;
		if (props?.onDeleteClick) {
			props.onDeleteClick(selectedTasks);
		}
	};

	const handleAssignTask = (taskId?: string) => {
		const taskToAssign =
			taskId || (selectedTasks.length === 1 ? selectedTasks[0] : null);
		if (!taskToAssign) return;
		setAssigningTaskId(taskToAssign);
		setShowTaskAssignDialog(true);
	};

	const handleCompleteTask = () => {
		if (selectedTasks.length === 0) return;
		if (selectedTasks.length === 1) {
			setCompletingTaskId(selectedTasks[0]);
			setShowTaskCompletionModal(true);
		}
	};

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setCompletingTaskId(null);
		setSelectedTasks([]);
	};

	const confirmDeleteTask = async () => {
		// Delete from Redux
		selectedTasks.forEach((taskId) => {
			dispatch(deleteTaskAction(taskId));
		});

		// Delete from Firebase
		if (props?.deleteTaskMutation) {
			for (const taskId of selectedTasks) {
				try {
					await props.deleteTaskMutation(taskId).unwrap();
				} catch (error) {
					console.error('Failed to delete task from Firebase:', error);
				}
			}
		}

		setSelectedTasks([]);
	};

	return {
		selectedTasks,
		setSelectedTasks,
		showTaskDialog,
		setShowTaskDialog,
		editingTaskId,
		setEditingTaskId,
		showTaskAssignDialog,
		setShowTaskAssignDialog,
		assigningTaskId,
		setAssigningTaskId,
		selectedAssignee,
		setSelectedAssignee,
		showTaskCompletionModal,
		setShowTaskCompletionModal,
		completingTaskId,
		setCompletingTaskId,
		handleTaskCheckbox,
		handleCreateTask,
		handleEditTask,
		handleDeleteTask,
		handleAssignTask,
		handleCompleteTask,
		handleTaskCompletionSuccess,
		confirmDeleteTask,
	};
};
