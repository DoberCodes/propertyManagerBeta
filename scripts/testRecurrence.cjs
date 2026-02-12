// Test the calculateNextDueDate function
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

	console.log('Final next date:', nextDate);

	// Return as YYYY-MM-DD format, ensuring we get the correct date regardless of timezone
	const year = nextDate.getFullYear();
	const month = String(nextDate.getMonth() + 1).padStart(2, '0');
	const day = String(nextDate.getDate()).padStart(2, '0');
	const result = `${year}-${month}-${day}`;

	return result;
}

const completionDate = '2026-02-07'; // The due date of the completed task
const frequency = 'weekly';
const interval = 1;

try {
	const nextDate = calculateNextDueDate(completionDate, frequency, interval);
	console.log('Next due date for "Pick up dog poop":', nextDate);
} catch (error) {
	console.error('Error calculating next due date:', error);
}
