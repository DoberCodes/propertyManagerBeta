import {
	query,
	collection,
	where,
	getDocs,
	addDoc,
	doc,
	updateDoc,
	deleteDoc,
	getDoc,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { Contractor } from '../../types/Contractor.types';
import { PropertyShare } from '../../types/Property.types';
import { apiSlice, docToData } from './apiSlice';

const contractorSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Contractor endpoints
		getContractorsByProperty: builder.query<any[], string>({
			async queryFn(propertyId: string) {
				console.log(
					'getContractorsByProperty query called with propertyId:',
					propertyId,
				);
				try {
					if (!propertyId) {
						console.log('getContractorsByProperty: no propertyId provided');
						return { data: [] };
					}
					const contractorQuery = query(
						collection(db, 'contractors'),
						where('propertyId', '==', propertyId),
					);
					const snapshot = await getDocs(contractorQuery);
					console.log(
						'getContractorsByProperty query result:',
						snapshot.size,
						'documents',
					);
					const contractors = snapshot.docs
						.map((doc) => docToData(doc) as Contractor)
						.filter(Boolean) as Contractor[];
					return { data: contractors };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Contractors'],
		}),

		createContractor: builder.mutation<
			any,
			{
				propertyId: string;
				name: string;
				company: string;
				category: string;
				phone: string;
				address?: string;
				email?: string;
				notes?: string;
			}
		>({
			async queryFn({
				propertyId,
				name,
				company,
				category,
				phone,
				address,
				email,
				notes,
			}) {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}

					const contractorData = {
						propertyId,
						name,
						company,
						category,
						phone,
						address: address || '',
						email: email || '',
						notes: notes || '',
						userId: currentUser.uid,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};

					const docRef = await addDoc(
						collection(db, 'contractors'),
						contractorData,
					);

					return {
						data: {
							id: docRef.id,
							...contractorData,
						},
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Contractors'],
		}),

		updateContractor: builder.mutation<
			any,
			{
				contractorId: string;
				name?: string;
				company?: string;
				category?: string;
				phone?: string;
				address?: string;
				email?: string;
				notes?: string;
			}
		>({
			async queryFn({
				contractorId,
				name,
				company,
				category,
				phone,
				address,
				email,
				notes,
			}) {
				try {
					const docRef = doc(db, 'contractors', contractorId);
					const updates: any = {
						updatedAt: new Date().toISOString(),
					};

					if (name !== undefined) updates.name = name;
					if (company !== undefined) updates.company = company;
					if (category !== undefined) updates.category = category;
					if (phone !== undefined) updates.phone = phone;
					if (address !== undefined) updates.address = address;
					if (email !== undefined) updates.email = email;
					if (notes !== undefined) updates.notes = notes;

					await updateDoc(docRef, updates);

					return { data: { id: contractorId, ...updates } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Contractors'],
		}),

		deleteContractor: builder.mutation<void, string>({
			async queryFn(contractorId: string) {
				try {
					await deleteDoc(doc(db, 'contractors', contractorId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Contractors'],
		}),

		getContractors: builder.query<any[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					// Get user data to check for family account
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userData = userDoc.data();
					const accountId = userData?.accountId;
					const isAccountOwner = userData?.isAccountOwner;

					// Determine which user's data to fetch
					// For family members, use the account owner's ID
					const targetUserId =
						!isAccountOwner && accountId ? accountId : userId;

					// Get all properties for this user's groups
					const groupsQuery = query(
						collection(db, 'propertyGroups'),
						where('userId', '==', targetUserId),
					);
					const groupsSnapshot = await getDocs(groupsQuery);
					const groupIds = groupsSnapshot.docs.map((doc) => doc.id);

					let ownedPropertyIds: string[] = [];
					if (groupIds.length > 0) {
						// Get all property IDs for these groups
						for (let i = 0; i < groupIds.length; i += 10) {
							const batch = groupIds.slice(i, i + 10);
							const propertiesQuery = query(
								collection(db, 'properties'),
								where('groupId', 'in', batch),
							);
							const propertiesSnapshot = await getDocs(propertiesQuery);
							propertiesSnapshot.docs.forEach((doc) => {
								ownedPropertyIds.push(doc.id);
							});
						}
					}

					// Also get shared properties for this user
					let sharedPropertyIds: string[] = [];
					try {
						// Get user's email first
						const userDocRef = doc(db, 'users', userId);
						const userDoc = await getDoc(userDocRef);
						const userEmail = userDoc.data()?.email;

						if (userEmail) {
							// Find all shares where this user has access
							const sharesQuery = query(
								collection(db, 'propertyShares'),
								where('sharedWithEmail', '==', userEmail),
							);
							const sharesSnapshot = await getDocs(sharesQuery);
							sharedPropertyIds = sharesSnapshot.docs
								.map((doc) => docToData(doc) as PropertyShare)
								.filter(Boolean)
								.map((share) => share.propertyId);
						}
					} catch (shareError) {
						// If getting shared properties fails, continue with owned properties only
						console.warn('Could not fetch shared properties:', shareError);
					}

					// Combine and deduplicate property IDs
					const allPropertyIds = [
						...new Set([...ownedPropertyIds, ...sharedPropertyIds]),
					];

					if (allPropertyIds.length === 0) {
						return { data: [] };
					}

					// Fetch all contractors for these properties
					const allContractors: any[] = [];
					for (let i = 0; i < allPropertyIds.length; i += 10) {
						const batch = allPropertyIds.slice(i, i + 10);
						const contractorsQuery = query(
							collection(db, 'contractors'),
							where('propertyId', 'in', batch),
						);
						const contractorsSnapshot = await getDocs(contractorsQuery);
						const contractors = contractorsSnapshot.docs
							.map((doc) => docToData(doc) as Contractor)
							.filter(Boolean) as Contractor[];
						allContractors.push(...contractors);
					}

					return { data: allContractors };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Contractors'],
		}),
	}),
});

export const {
	useGetContractorsByPropertyQuery,
	useCreateContractorMutation,
	useUpdateContractorMutation,
	useDeleteContractorMutation,
	useGetContractorsQuery,
} = contractorSlice;
