#!/usr/bin/env node

/**
 * Migration script to remove all data not connected to current users
 * This cleans up orphaned data from deleted user accounts
 *
 * MAINTENANCE SCRIPT - Safe to run repeatedly as the app expands
 *
 * HOW TO MAINTAIN AS APP EXPANDS:
 * ===============================
 * 1. Add new user-owned collections to COLLECTION_CONFIG.userOwned
 * 2. Add new property-related collections to COLLECTION_CONFIG.propertyRelated
 * 3. Add new shared user array fields to COLLECTION_CONFIG.sharedUserArrays
 * 4. Run the script: node scripts/migrateRemoveOrphanedData.cjs
 *
 * The script handles:
 * - Direct user ownership (documents with userId fields)
 * - Property relationships (documents referencing propertyId)
 * - Shared user references (arrays containing user IDs)
 *
 * Run with: node scripts/migrateRemoveOrphanedData.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

/**
 * Configuration for collections and their relationships
 * Add new collections here as the app expands
 */
const COLLECTION_CONFIG = {
	// Collections with direct userId references
	userOwned: [
		'propertyGroups',
		'teamGroups',
		'teamMembers',
		'favorites',
		'tasks', // Tasks can be user-owned OR property-related
		'users', // USER PROFILE DATA - CRITICAL!
		'notifications', // User-specific notifications
		'contractors', // User-related contractor data
		// Future: 'userProfiles', 'userSettings', 'notificationPreferences'
	],

	// Collections that reference properties (cleaned based on owned properties)
	propertyRelated: [
		{ name: 'tasks', field: 'propertyId' },
		{ name: 'suites', field: 'propertyId' },
		{ name: 'units', field: 'propertyId' },
		{ name: 'devices', field: 'location.propertyId' }, // Nested field
		{ name: 'propertyShares', field: 'propertyId' },
		{ name: 'userInvitations', field: 'propertyId' },
		{ name: 'maintenanceHistory', field: 'propertyId' }, // Property-related maintenance
		// Future: { name: 'propertyDocuments', field: 'propertyId' },
		// Future: { name: 'propertyImages', field: 'propertyId' },
	],

	// Collections with shared user references (arrays of user IDs)
	sharedUserArrays: [
		{
			collection: 'properties',
			fields: ['coOwners', 'administrators', 'viewers'],
		},
		// Future: { collection: 'teamGroups', fields: ['memberIds', 'managerIds'] },
		// Future: { collection: 'projects', fields: ['collaboratorIds'] },
	],
};

async function getAllCurrentUserIds() {
	console.log('Fetching all current Firebase Auth users...');

	const userIds = new Set();
	let nextPageToken;

	try {
		do {
			const listUsersResult = await auth.listUsers(1000, nextPageToken);
			listUsersResult.users.forEach((userRecord) => {
				userIds.add(userRecord.uid);
			});
			nextPageToken = listUsersResult.pageToken;
		} while (nextPageToken);

		console.log(`Found ${userIds.size} current users in Firebase Auth`);
		return userIds;
	} catch (error) {
		console.error('Error fetching users from Firebase Auth:', error);
		throw error;
	}
}

async function cleanCollection(
	collectionName,
	userIds,
	userIdField = 'userId',
) {
	console.log(`\n🔍 Checking collection: ${collectionName}`);

	try {
		const collectionRef = db.collection(collectionName);
		const snapshot = await collectionRef.get();

		if (snapshot.empty) {
			console.log(`   📭 Collection ${collectionName} is empty`);
			return 0;
		}

		let orphanedCount = 0;
		const batch = db.batch();
		let batchSize = 0;

		for (const doc of snapshot.docs) {
			const data = doc.data();
			const userId = data[userIdField];

			// Skip documents without userId field (might be shared data)
			if (!userId) {
				continue;
			}

			// Check if user still exists
			if (!userIds.has(userId)) {
				console.log(
					`   🗑️  Deleting orphaned document ${doc.id} (userId: ${userId})`,
				);
				batch.delete(doc.ref);
				orphanedCount++;
				batchSize++;

				// Commit batch every 500 operations to avoid limits
				if (batchSize >= 500) {
					await batch.commit();
					batchSize = 0;
				}
			}
		}

		// Commit remaining operations
		if (batchSize > 0) {
			await batch.commit();
		}

		console.log(
			`   ✅ Removed ${orphanedCount} orphaned documents from ${collectionName}`,
		);
		return orphanedCount;
	} catch (error) {
		console.error(`   ❌ Error cleaning collection ${collectionName}:`, error);
		return 0;
	}
}

async function cleanPropertyRelatedData(userIds) {
	console.log('\n🔍 Checking property-related collections...');

	let totalRemoved = 0;

	try {
		// Get all properties owned by current users
		const propertiesRef = db.collection('properties');
		const ownedPropertiesSnapshot = await propertiesRef
			.where('userId', 'in', Array.from(userIds))
			.get();
		const ownedPropertyIds = new Set(
			ownedPropertiesSnapshot.docs.map((doc) => doc.id),
		);

		console.log(
			`Found ${ownedPropertyIds.size} properties owned by current users`,
		);

		// Clean collections that reference properties
		const propertyRelatedCollections = [
			{ name: 'tasks', field: 'propertyId' },
			{ name: 'suites', field: 'propertyId' },
			{ name: 'units', field: 'propertyId' },
			{ name: 'devices', field: 'location.propertyId' },
			{ name: 'propertyShares', field: 'propertyId' },
			{ name: 'userInvitations', field: 'propertyId' },
		];

		for (const { name, field } of propertyRelatedCollections) {
			console.log(`\n🔍 Checking ${name} for orphaned property references...`);

			const collectionRef = db.collection(name);
			const snapshot = await collectionRef.get();

			if (snapshot.empty) {
				console.log(`   📭 Collection ${name} is empty`);
				continue;
			}

			let orphanedCount = 0;
			const batch = db.batch();
			let batchSize = 0;

			for (const doc of snapshot.docs) {
				const data = doc.data();
				let propertyId;

				// Handle nested field path for devices
				if (field.includes('.')) {
					const [parent, child] = field.split('.');
					propertyId = data[parent]?.[child];
				} else {
					propertyId = data[field];
				}

				if (propertyId && !ownedPropertyIds.has(propertyId)) {
					console.log(
						`   🗑️  Deleting ${name} document ${doc.id} (orphaned propertyId: ${propertyId})`,
					);
					batch.delete(doc.ref);
					orphanedCount++;
					batchSize++;

					if (batchSize >= 500) {
						await batch.commit();
						batchSize = 0;
					}
				}
			}

			if (batchSize > 0) {
				await batch.commit();
			}

			console.log(
				`   ✅ Removed ${orphanedCount} orphaned documents from ${name}`,
			);
			totalRemoved += orphanedCount;
		}

		return totalRemoved;
	} catch (error) {
		console.error('   ❌ Error cleaning property-related data:', error);
		return 0;
	}
}

async function cleanSharedUserReferences(userIds) {
	console.log('\n🔍 Cleaning shared user references from collections...');

	let totalUpdated = 0;

	for (const config of COLLECTION_CONFIG.sharedUserArrays) {
		try {
			const { collection, fields } = config;
			console.log(`   📋 Processing ${collection} (${fields.join(', ')})...`);

			const collectionRef = db.collection(collection);
			const snapshot = await collectionRef.get();

			if (snapshot.empty) {
				console.log(`      📭 Collection ${collection} is empty`);
				continue;
			}

			let updatedCount = 0;
			const batch = db.batch();
			let batchSize = 0;

			for (const doc of snapshot.docs) {
				const data = doc.data();
				let needsUpdate = false;
				const updates = {};

				// Check each configured field
				for (const field of fields) {
					if (data[field] && Array.isArray(data[field])) {
						const cleanedArray = data[field].filter((id) => userIds.has(id));
						if (cleanedArray.length !== data[field].length) {
							updates[field] = cleanedArray;
							needsUpdate = true;
						}
					}
				}

				if (needsUpdate) {
					console.log(
						`      🧹 Cleaning shared user references in ${collection}/${doc.id}`,
					);
					batch.update(doc.ref, updates);
					updatedCount++;
					batchSize++;

					if (batchSize >= 500) {
						await batch.commit();
						batchSize = 0;
					}
				}
			}

			if (batchSize > 0) {
				await batch.commit();
			}

			console.log(
				`      ✅ Cleaned ${updatedCount} documents in ${collection}`,
			);
			totalUpdated += updatedCount;
		} catch (error) {
			console.error(`      ❌ Error cleaning ${config.collection}:`, error);
		}
	}

	console.log(
		`   ✅ Total documents with cleaned shared references: ${totalUpdated}`,
	);
	return totalUpdated;
}

async function runMigration() {
	console.log('🚀 Starting orphaned data cleanup migration...\n');
	console.log('📋 Configuration loaded for collections:');
	console.log(`   • User-owned: ${COLLECTION_CONFIG.userOwned.join(', ')}`);
	console.log(
		`   • Property-related: ${COLLECTION_CONFIG.propertyRelated
			.map((c) => c.name)
			.join(', ')}`,
	);
	console.log(
		`   • Shared user arrays: ${COLLECTION_CONFIG.sharedUserArrays
			.map((c) => `${c.collection}(${c.fields.join(',')})`)
			.join(', ')}\n`,
	);

	try {
		// Get all current user IDs
		const userIds = await getAllCurrentUserIds();

		let totalRemoved = 0;

		// Clean collections with direct userId references
		console.log('🧹 Phase 1: Cleaning user-owned collections...');
		for (const collectionName of COLLECTION_CONFIG.userOwned) {
			const removed = await cleanCollection(collectionName, userIds);
			totalRemoved += removed;
		}

		// Clean property-related orphaned data
		console.log('🏠 Phase 2: Cleaning property-related collections...');
		const propertyRelatedRemoved = await cleanPropertyRelatedData(userIds);
		totalRemoved += propertyRelatedRemoved;

		// Clean shared user references
		console.log('👥 Phase 3: Cleaning shared user references...');
		const sharedRefsCleaned = await cleanSharedUserReferences(userIds);

		console.log('\n🎉 Migration completed successfully!');
		console.log(`📊 Summary:`);
		console.log(`   • Total orphaned documents removed: ${totalRemoved}`);
		console.log(
			`   • Properties with cleaned shared references: ${sharedRefsCleaned}`,
		);
		console.log(`   • Active users preserved: ${userIds.size}`);
		console.log('\n💡 To add new collections as the app expands:');
		console.log('   1. Add to COLLECTION_CONFIG at the top of this file');
		console.log('   2. Run this script again');

		process.exit(0);
	} catch (error) {
		console.error('\n❌ Migration failed:', error);
		console.error('\n🔧 Troubleshooting:');
		console.error('   • Check Firebase Admin SDK permissions');
		console.error('   • Verify serviceAccountKey.json is valid');
		console.error('   • Check network connectivity to Firebase');
		process.exit(1);
	}
}

// Run the migration
runMigration();
