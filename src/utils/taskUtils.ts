import { Task, TaskStatus } from '../types/Task.types';

/**
 * Checks if a task is overdue based on its due date and current status
 */
export const isTaskOverdue = (task: Task): boolean => {
	if (!task.dueDate) return false;

	// Don't mark as overdue if already in a final state
	const finalStatuses: TaskStatus[] = ['Completed', 'Rejected', 'Overdue'];
	if (finalStatuses.includes(task.status)) return false;

	const dueDate = new Date(task.dueDate);
	const today = new Date();
	today.setHours(0, 0, 0, 0); // Start of today

	return dueDate < today;
};

/**
 * Updates tasks that are overdue in the provided array
 * This is a client-side utility that can be called when tasks are loaded
 */
export const updateOverdueTasks = async (tasks: Task[]): Promise<Task[]> => {
	const overdueTasks = tasks.filter(isTaskOverdue);

	if (overdueTasks.length === 0) return tasks;

	// In a real implementation, you would update these in the database
	// For now, we'll just return the updated tasks array
	// The scheduled Firebase function will handle the actual database updates

	return tasks.map((task) => {
		if (isTaskOverdue(task)) {
			return { ...task, status: 'Overdue' as TaskStatus };
		}
		return task;
	});
};
