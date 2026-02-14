import {
	doc,
	getDoc,
	query,
	collection,
	where,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { PropertyShare, Suite, Unit } from '../../types/Property.types';
import { PropertyGroup, Property } from '../Slices/propertyDataSlice';
import { apiSlice, docToData } from './apiSlice';

const propertySlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Property endpoints
		// Property Group endpoints
		getPropertyGroups: builder.query<PropertyGroup[], void>({
			async queryFn() {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;
					// Get user's email for shared properties lookup
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userData = userDoc.data();
					const userEmail = userData?.email;
					const accountId = userData?.accountId;
					const isAccountOwner = userData?.isAccountOwner;

					// Determine which user's property groups to fetch
					// For family members, use the account owner's ID
					const targetUserId =
						!isAccountOwner && accountId ? accountId : userId;

					// Get property groups
					const q = query(
						collection(db, 'propertyGroups'),
						where('userId', '==', targetUserId),
					);
					const querySnapshot = await getDocs(q);
					const groups = querySnapshot.docs
						.map((doc) => docToData(doc) as PropertyGroup)
						.filter(Boolean) as PropertyGroup[];
					// Fetch properties for each group
					const groupsWithProperties = await Promise.all(
						groups.map(async (group) => {
							const isSharedGroup =
								group.name?.toLowerCase() === 'shared properties';
							const isMyPropertiesGroup =
								group.name?.toLowerCase() === 'my properties';
							// Get properties owned by user in this group
							const propertiesQuery = query(
								collection(db, 'properties'),
								where('groupId', '==', group.id),
							);
							const propertiesSnapshot = await getDocs(propertiesQuery);
							const ownedProperties = propertiesSnapshot.docs
								.map((doc) => docToData(doc) as Property)
								.filter(Boolean) as Property[];
							// Get shared properties that should appear in this group
							let sharedProperties: Property[] = [];
							if (userEmail) {
								const sharesQuery = query(
									collection(db, 'propertyShares'),
									where('sharedWithEmail', '==', userEmail),
								);
								const sharesSnapshot = await getDocs(sharesQuery);
								const shares = sharesSnapshot.docs
									.map((doc) => docToData(doc) as PropertyShare)
									.filter(Boolean) as PropertyShare[];

								// Fetch shared property documents
								const propertyIds = shares.map((share) => share.propertyId);
								if (propertyIds.length > 0) {
									// Process in batches of 10
									for (let i = 0; i < propertyIds.length; i += 10) {
										const batch = propertyIds.slice(i, i + 10);
										const sharedPropertiesQuery = query(
											collection(db, 'properties'),
											where('__name__', 'in', batch),
										);
										const sharedPropertiesSnapshot = await getDocs(
											sharedPropertiesQuery,
										);
										const properties = sharedPropertiesSnapshot.docs
											.map((doc) => docToData(doc) as Property)
											.filter(Boolean) as Property[];

										// Determine which properties should go in this group based on permission
										const groupSharedProperties = properties.filter((prop) => {
											const share = shares.find(
												(s) => s.propertyId === prop.id,
											);
											const permission = share?.permission || 'viewer';

											// Co-owners get properties in "My Properties", viewers/admins get them in "Shared Properties"
											if (permission === 'co-owner' && isMyPropertiesGroup) {
												return true;
											} else if (
												(permission === 'viewer' || permission === 'admin') &&
												isSharedGroup
											) {
												return true;
											}
											return false;
										});

										sharedProperties.push(...groupSharedProperties);
									}
								}
							}

							// Combine owned and shared properties, deduplicate
							const allProperties = [...ownedProperties, ...sharedProperties];
							const uniqueProperties = Array.from(
								new Map(allProperties.map((p) => [p.id, p])).values(),
							);

							return {
								...group,
								properties: uniqueProperties,
							};
						}),
					);

					// Check if we need to create a "Shared Properties" group
					const hasSharedPropertiesGroup = groupsWithProperties.some(
						(group) => group.name?.toLowerCase() === 'shared properties',
					);

					let finalGroups = [...groupsWithProperties];

					// If no Shared Properties group exists, check if user has shared properties
					if (!hasSharedPropertiesGroup && userEmail) {
						const sharesQuery = query(
							collection(db, 'propertyShares'),
							where('sharedWithEmail', '==', userEmail),
						);
						const sharesSnapshot = await getDocs(sharesQuery);
						if (!sharesSnapshot.empty) {
							// User has shared properties, create the group
							try {
								const sharedGroupData = {
									name: 'Shared Properties',
									userId,
									properties: [],
									createdAt: new Date().toISOString(),
									updatedAt: new Date().toISOString(),
								};
								const sharedGroupRef = await addDoc(
									collection(db, 'propertyGroups'),
									sharedGroupData,
								);
								finalGroups.push({
									id: sharedGroupRef.id,
									...sharedGroupData,
								});
								// Note: Properties will be loaded on next query refresh
							} catch (error) {
								console.error('Error creating Shared Properties group:', error);
							}
						}
					}

					return { data: finalGroups };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['PropertyGroups', 'Properties', 'PropertyShares'],
		}),

		getPropertyGroup: builder.query<PropertyGroup, string>({
			async queryFn(groupId: string) {
				try {
					const docRef = doc(db, 'propertyGroups', groupId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot) as PropertyGroup;
					return { data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['PropertyGroups'],
		}),

		createPropertyGroup: builder.mutation<
			PropertyGroup,
			Omit<PropertyGroup, 'id'>
		>({
			async queryFn(newGroup) {
				try {
					// Get current user to determine correct userId for family accounts
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}

					// Get user data to check for family account
					const userDocRef = doc(db, 'users', currentUser.uid);
					const userDoc = await getDoc(userDocRef);
					const userData = userDoc.data();
					const accountId = userData?.accountId;
					const isAccountOwner = userData?.isAccountOwner;

					// For family accounts, property groups should be owned by the account owner
					const targetUserId =
						!isAccountOwner && accountId ? accountId : currentUser.uid;

					const docRef = await addDoc(collection(db, 'propertyGroups'), {
						...newGroup,
						userId: targetUserId, // Ensure property group is owned by account owner
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return {
						data: {
							id: docRef.id,
							...newGroup,
							userId: targetUserId,
						} as PropertyGroup,
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyGroups'],
		}),

		updatePropertyGroup: builder.mutation<
			PropertyGroup,
			{ id: string; updates: Partial<PropertyGroup> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'propertyGroups', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as PropertyGroup };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyGroups'],
		}),

		deletePropertyGroup: builder.mutation<void, string>({
			async queryFn(groupId: string) {
				try {
					await deleteDoc(doc(db, 'propertyGroups', groupId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyGroups'],
		}),

		// Property endpoints
		getProperties: builder.query<Property[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					// Get user's email for shared properties lookup
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userData = userDoc.data();
					const userEmail = userData?.email;
					const accountId = userData?.accountId;
					const isAccountOwner = userData?.isAccountOwner;

					// Determine which user's data to fetch
					// For family members, use the account owner's ID
					const targetUserId =
						!isAccountOwner && accountId ? accountId : userId;

					// Get all property groups owned by this user
					const groupsQuery = query(
						collection(db, 'propertyGroups'),
						where('userId', '==', targetUserId),
					);
					const groupsSnapshot = await getDocs(groupsQuery);
					const groupIds = groupsSnapshot.docs.map((doc) => doc.id);

					// Fetch all properties owned by this user or where user is administrator
					const ownedProperties: Property[] = [];
					if (groupIds.length > 0) {
						// Process in batches of 10 (Firestore limitation)
						for (let i = 0; i < groupIds.length; i += 10) {
							const batch = groupIds.slice(i, i + 10);
							const propertiesQuery = query(
								collection(db, 'properties'),
								where('groupId', 'in', batch),
							);
							const propertiesSnapshot = await getDocs(propertiesQuery);
							const properties = propertiesSnapshot.docs
								.map((doc) => docToData(doc) as Property)
								.filter(Boolean) as Property[];
							ownedProperties.push(...properties);
						}
					}

					// Also fetch properties where user is a co-owner
					const coOwnerPropertiesQuery = query(
						collection(db, 'properties'),
						where('coOwners', 'array-contains', userId),
					);
					const coOwnerPropertiesSnapshot = await getDocs(
						coOwnerPropertiesQuery,
					);
					const coOwnerProperties = coOwnerPropertiesSnapshot.docs
						.map((doc) => docToData(doc) as Property)
						.filter(Boolean) as Property[];

					// Also fetch properties where user is an administrator
					const adminPropertiesQuery = query(
						collection(db, 'properties'),
						where('administrators', 'array-contains', userId),
					);
					const adminPropertiesSnapshot = await getDocs(adminPropertiesQuery);
					const adminProperties = adminPropertiesSnapshot.docs
						.map((doc) => docToData(doc) as Property)
						.filter(Boolean) as Property[];

					// Get shared properties - separate co-owners from regular shares
					const coOwnerSharedProperties: Property[] = [];
					const regularSharedProperties: Property[] = [];
					if (userEmail) {
						const sharesQuery = query(
							collection(db, 'propertyShares'),
							where('sharedWithEmail', '==', userEmail),
						);
						const sharesSnapshot = await getDocs(sharesQuery);
						const shares = sharesSnapshot.docs
							.map((doc) => docToData(doc) as PropertyShare)
							.filter(Boolean) as PropertyShare[];

						const coOwnerShares = shares.filter(
							(share) => share.permission === 'co-owner',
						);
						const regularShares = shares.filter(
							(share) => share.permission !== 'co-owner',
						);

						// Process co-owner shares (treated as ownership)
						const coOwnerPropertyIds = coOwnerShares.map(
							(share) => share.propertyId,
						);
						if (coOwnerPropertyIds.length > 0) {
							// Process in batches of 10
							for (let i = 0; i < coOwnerPropertyIds.length; i += 10) {
								const batch = coOwnerPropertyIds.slice(i, i + 10);
								const propertiesQuery = query(
									collection(db, 'properties'),
									where('__name__', 'in', batch),
								);
								const propertiesSnapshot = await getDocs(propertiesQuery);
								const properties = propertiesSnapshot.docs
									.map((doc) => docToData(doc) as Property)
									.filter(Boolean) as Property[];
								coOwnerSharedProperties.push(...properties);
							}
						}

						// Process regular shares
						const regularPropertyIds = regularShares.map(
							(share) => share.propertyId,
						);
						if (regularPropertyIds.length > 0) {
							// Process in batches of 10
							for (let i = 0; i < regularPropertyIds.length; i += 10) {
								const batch = regularPropertyIds.slice(i, i + 10);
								const propertiesQuery = query(
									collection(db, 'properties'),
									where('__name__', 'in', batch),
								);
								const propertiesSnapshot = await getDocs(propertiesQuery);
								const properties = propertiesSnapshot.docs
									.map((doc) => docToData(doc) as Property)
									.filter(Boolean) as Property[];
								regularSharedProperties.push(...properties);
							}
						}
					}

					// Combine and deduplicate
					const allProperties = [
						...ownedProperties,
						...coOwnerProperties,
						...coOwnerSharedProperties,
						...adminProperties,
						...regularSharedProperties,
					];
					const uniqueProperties = Array.from(
						new Map(allProperties.map((p) => [p.id, p])).values(),
					);

					return { data: uniqueProperties };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Properties', 'PropertyShares'],
		}),

		getProperty: builder.query<Property, string>({
			async queryFn(propertyId: string) {
				try {
					const docRef = doc(db, 'properties', propertyId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot) as Property;
					return { data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Properties'],
		}),

		createProperty: builder.mutation<Property, Omit<Property, 'id'>>({
			async queryFn(newProperty) {
				try {
					// Get current user to determine correct userId for family accounts
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}

					// Get user data to check for family account
					const userDocRef = doc(db, 'users', currentUser.uid);
					const userDoc = await getDoc(userDocRef);
					const userData = userDoc.data();
					const accountId = userData?.accountId;
					const isAccountOwner = userData?.isAccountOwner;

					// For family accounts, properties should be owned by the account owner
					const targetUserId =
						!isAccountOwner && accountId ? accountId : currentUser.uid;

					const docRef = await addDoc(collection(db, 'properties'), {
						...newProperty,
						userId: targetUserId, // Ensure property is owned by account owner
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					const savedSnapshot = await getDoc(doc(db, 'properties', docRef.id));
					const savedData = docToData(savedSnapshot) as Property;
					return { data: savedData };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Properties', 'PropertyGroups'],
		}),

		updateProperty: builder.mutation<
			Property,
			{ id: string; updates: Partial<Property> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'properties', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					const savedSnapshot = await getDoc(docRef);
					const savedData = docToData(savedSnapshot) as Property;
					return { data: savedData };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Properties', 'PropertyGroups'],
		}),

		deleteProperty: builder.mutation<void, string>({
			async queryFn(propertyId: string) {
				try {
					// Delete the property
					await deleteDoc(doc(db, 'properties', propertyId));

					// Delete all favorites for this property
					const favoritesQuery = query(
						collection(db, 'favorites'),
						where('propertyId', '==', propertyId),
					);
					const favoritesSnapshot = await getDocs(favoritesQuery);
					for (const favDoc of favoritesSnapshot.docs) {
						await deleteDoc(favDoc.ref);
					}

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Properties', 'PropertyGroups', 'Favorites'],
		}),

		// Suites endpoints
		getSuites: builder.query<Suite[], string>({
			async queryFn(propertyId: string) {
				try {
					const q = query(
						collection(db, 'suites'),
						where('propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);
					const suites = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as Suite[];
					return { data: suites };
				} catch (error) {
					return { error: (error as Error).message };
				}
			},
			providesTags: ['Suites'],
		}),

		getSuite: builder.query<Suite, string>({
			async queryFn(suiteId: string) {
				try {
					const docRef = doc(db, 'suites', suiteId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot) as Suite;
					return { data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Suites'],
		}),

		createSuite: builder.mutation<Suite, Omit<Suite, 'id'>>({
			async queryFn(newSuite) {
				try {
					const docRef = await addDoc(collection(db, 'suites'), {
						...newSuite,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return { data: { id: docRef.id, ...newSuite } as Suite };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Suites'],
		}),

		updateSuite: builder.mutation<
			Suite,
			{ id: string; updates: Partial<Suite> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'suites', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					const savedSnapshot = await getDoc(docRef);
					const savedData = docToData(savedSnapshot) as Suite;
					return { data: savedData };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Suites'],
		}),

		deleteSuite: builder.mutation<void, string>({
			async queryFn(suiteId: string) {
				try {
					await deleteDoc(doc(db, 'suites', suiteId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Suites'],
		}),

		// Units endpoints
		getUnits: builder.query<Unit[], string>({
			async queryFn(propertyId: string) {
				try {
					const q = query(
						collection(db, 'units'),
						where('propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);
					const units = querySnapshot.docs.map((doc) => docToData(doc) as Unit);
					return { data: units };
				} catch (error) {
					return { error: (error as Error).message };
				}
			},
			providesTags: ['Units'],
		}),

		getUnit: builder.query<Unit, string>({
			async queryFn(unitId: string) {
				try {
					const docRef = doc(db, 'units', unitId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot) as Unit;
					return { data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Units'],
		}),

		createUnit: builder.mutation<Unit, Omit<Unit, 'id'>>({
			async queryFn(newUnit) {
				try {
					const docRef = await addDoc(collection(db, 'units'), {
						...newUnit,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return { data: { id: docRef.id, ...newUnit } as Unit };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Units'],
		}),

		updateUnit: builder.mutation<Unit, { id: string; updates: Partial<Unit> }>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'units', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					const savedSnapshot = await getDoc(docRef);
					const savedData = docToData(savedSnapshot) as Unit;
					return { data: savedData };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Units'],
		}),

		deleteUnit: builder.mutation<void, string>({
			async queryFn(unitId: string) {
				try {
					await deleteDoc(doc(db, 'units', unitId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Units'],
		}),

		// Get all units across all properties (for reports)
		getAllUnits: builder.query<Unit[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					const q = query(
						collection(db, 'units'),
						where('userId', '==', userId),
					);
					const querySnapshot = await getDocs(q);
					const units = querySnapshot.docs.map((doc) => docToData(doc) as Unit);
					return { data: units };
				} catch (error) {
					return { error: (error as Error).message };
				}
			},
			providesTags: ['Units'],
		}),
	}),
});

export const {
	useGetPropertyGroupsQuery,
	useGetPropertyGroupQuery,
	useCreatePropertyGroupMutation,
	useUpdatePropertyGroupMutation,
	useDeletePropertyGroupMutation,
	useGetPropertiesQuery,
	useGetPropertyQuery,
	useCreatePropertyMutation,
	useUpdatePropertyMutation,
	useDeletePropertyMutation,
	useGetSuitesQuery,
	useGetSuiteQuery,
	useCreateSuiteMutation,
	useUpdateSuiteMutation,
	useDeleteSuiteMutation,
	useGetUnitsQuery,
	useGetUnitQuery,
	useCreateUnitMutation,
	useUpdateUnitMutation,
	useDeleteUnitMutation,
	useGetAllUnitsQuery,
} = propertySlice;
