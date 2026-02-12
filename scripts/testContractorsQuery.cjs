const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://maintley.firebaseio.com',
});

const db = admin.firestore();

async function testContractorsQuery() {
	try {
		console.log('Testing contractors query...');

		// Get user ID for property@example.com
		const userQuery = await db
			.collection('users')
			.where('email', '==', 'property@example.com')
			.get();
		if (userQuery.empty) {
			console.log('User not found');
			return;
		}

		const userId = userQuery.docs[0].id;
		console.log('User ID:', userId);

		// Get properties for this user
		const propertiesQuery = await db
			.collection('properties')
			.where('userId', '==', userId)
			.get();
		const propertyIds = propertiesQuery.docs.map((doc) => doc.id);
		console.log('Property IDs:', propertyIds);

		// Test contractors query for each property
		for (const propertyId of propertyIds) {
			console.log(`\nQuerying contractors for property ${propertyId}...`);
			const contractorsQuery = await db
				.collection('contractors')
				.where('propertyId', '==', propertyId)
				.get();

			console.log(
				`Found ${contractorsQuery.size} contractors for property ${propertyId}`,
			);
			contractorsQuery.docs.forEach((doc) => {
				const data = doc.data();
				console.log(`- ${data.name} (${data.category})`);
			});
		}
	} catch (error) {
		console.error('Error:', error);
	} finally {
		process.exit(0);
	}
}

testContractorsQuery();
