// Test the recurrence logic from TaskCompletionModal
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Mock the calculateNextDueDate function
function calculateNextDueDate(completionDate, frequency, interval, customUnit) {
	// Ensure interval is a number
	const numericInterval =
		typeof interval === 'string' ? parseInt(interval, 10) : interval;

	// Handle date parsing to avoid timezone issues
	let date;
	if (typeof completionDate === 'string') {
		// Parse date string as local date to avoid timezone conversion issues
		// Split YYYY-MM-DD and create date at local noon to avoid DST issues
		const [year, month, day] = completionDate.split('-').map(Number);
		date = new Date(year, month - 1, day, 12, 0, 0); // month is 0-indexed, noon time
	} else {
		date = completionDate;
	}

	const nextDate = new Date(date);

	switch (frequency) {
		case 'daily':
			nextDate.setDate(nextDate.getDate() + numericInterval);
			break;
		case 'weekly':
			nextDate.setDate(nextDate.getDate() + numericInterval * 7);
			break;
		case 'biweekly':
			nextDate.setDate(nextDate.getDate() + numericInterval * 14);
			break;
		case 'monthly':
			nextDate.setMonth(nextDate.getMonth() + numericInterval);
			break;
		case 'quarterly':
			nextDate.setMonth(nextDate.getMonth() + numericInterval * 3);
			break;
		case 'yearly':
			nextDate.setFullYear(nextDate.getFullYear() + numericInterval);
			break;
		case 'custom':
			if (!customUnit) {
				throw new Error('Custom unit is required for custom frequency');
			}
			switch (customUnit) {
				case 'days':
					nextDate.setDate(nextDate.getDate() + numericInterval);
					break;
				case 'weeks':
					nextDate.setDate(nextDate.getDate() + numericInterval * 7);
					break;
				case 'months':
					nextDate.setMonth(nextDate.getMonth() + numericInterval);
					break;
				case 'years':
					nextDate.setFullYear(nextDate.getFullYear() + numericInterval);
					break;
				default:
					throw new Error(`Unknown custom unit: ${customUnit}`);
			}
			break;
		default:
			throw new Error(`Unknown recurrence frequency: ${frequency}`);
	}

	// Return as YYYY-MM-DD format, ensuring we get the correct date regardless of timezone
	const year = nextDate.getFullYear();
	const month = String(nextDate.getMonth() + 1).padStart(2, '0');
	const day = String(nextDate.getDate()).padStart(2, '0');
	const result = `${year}-${month}-${day}`;

	return result;
}

async function testRecurrenceLogic() {
	console.log('🧪 Testing recurrence logic...\n');

	// Get the HVAC task
	const taskDoc = await db
		.collection('tasks')
		.doc('flZ4GHuSjczhH9aA2hGS')
		.get();
	if (!taskDoc.exists) {
		console.log('❌ Task not found');
		return;
	}

	const task = { id: taskDoc.id, ...taskDoc.data() };
	console.log('📋 Task data:', {
		id: task.id,
		title: task.title,
		isRecurring: task.isRecurring,
		recurrenceFrequency: task.recurrenceFrequency,
		recurrenceInterval: task.recurrenceInterval,
		recurrenceCustomUnit: task.recurrenceCustomUnit,
		propertyId: task.propertyId,
	});

	// Simulate the recurrence check
	console.log('\n🔄 RECURRENCE: Checking if task should recur. Task data:', {
		isRecurring: task.isRecurring,
		recurrenceFrequency: task.recurrenceFrequency,
		recurrenceInterval: task.recurrenceInterval,
		taskId: task.id,
		taskTitle: task.title,
	});

	if (task.isRecurring && task.recurrenceFrequency && task.recurrenceInterval) {
		console.log('✅ Recurrence condition met, proceeding...');

		try {
			const completionDate = new Date().toISOString().split('T')[0]; // Today's date
			const nextDueDate = calculateNextDueDate(
				completionDate,
				task.recurrenceFrequency,
				task.recurrenceInterval,
				task.recurrenceCustomUnit,
			);

			console.log('🔄 RECURRENCE: Calculated next due date:', nextDueDate);

			// Build recurring task object
			const recurringTaskData = {
				propertyId: task.propertyId,
				title: task.title,
				dueDate: nextDueDate,
				status: 'Pending',
				isRecurring: true,
				recurrenceFrequency: task.recurrenceFrequency,
				recurrenceInterval: task.recurrenceInterval,
				parentTaskId: task.id,
				lastRecurrenceDate: completionDate,
			};

			// Add optional fields
			if (task.notes) recurringTaskData.notes = task.notes;
			if (task.priority) recurringTaskData.priority = task.priority;
			if (task.assignee) recurringTaskData.assignee = task.assignee;
			if (task.recurrenceCustomUnit)
				recurringTaskData.recurrenceCustomUnit = task.recurrenceCustomUnit;

			console.log(
				'🔄 RECURRENCE: Creating recurring task with data:',
				recurringTaskData,
			);

			// Actually create the task
			const docRef = await db.collection('tasks').add({
				...recurringTaskData,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				userId: task.userId,
			});

			console.log(`✅ New recurring task created with ID: ${docRef.id}`);
			console.log(`📅 Task: "${task.title}" due on ${nextDueDate}`);
		} catch (recurringError) {
			console.error('❌ Failed to create recurring task copy:', recurringError);
		}
	} else {
		console.log('❌ Recurrence condition not met');
	}
}

testRecurrenceLogic()
	.then(() => {
		console.log('\n🎉 Test completed');
		process.exit(0);
	})
	.catch(console.error);
