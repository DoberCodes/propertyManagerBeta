import * as functions from 'firebase-functions/v1';
import { processTaskNotifications } from '../utils/taskNotificationScheduler';

/**
 * Scheduled function to process task notifications
 * Runs daily at 9 AM EST (2 PM UTC)
 */
export const scheduledTaskNotifications = functions.pubsub
	.schedule('0 14 * * *') // Daily at 2 PM UTC (9 AM EST)
	.timeZone('America/New_York')
	.onRun(async (context) => {
		console.log('🔔 Starting scheduled task notification processing...');
		try {
			await processTaskNotifications();
			console.log('✅ Scheduled task notification processing completed');
		} catch (error) {
			console.error(
				'❌ Error in scheduled task notification processing:',
				error,
			);
			throw error;
		}
	});

/**
 * HTTP function to manually trigger task notification processing
 * Useful for testing or manual runs
 */
export const triggerTaskNotifications = functions.https.onRequest(
	async (req, res) => {
		// Only allow POST requests
		if (req.method !== 'POST') {
			res.status(405).send('Method not allowed');
			return;
		}

		try {
			console.log('🔄 Manually triggering task notification processing...');
			await processTaskNotifications();
			res.status(200).json({
				success: true,
				message: 'Task notification processing completed successfully',
			});
		} catch (error) {
			console.error('❌ Error in manual task notification processing:', error);
			res.status(500).json({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	},
);
