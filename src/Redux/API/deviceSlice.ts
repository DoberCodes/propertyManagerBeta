import {
	query,
	collection,
	where,
	getDocs,
	doc,
	getDoc,
	addDoc,
	updateDoc,
	deleteDoc,
} from 'firebase/firestore';
import { auth } from '../../config/firebase';
import { db } from '../../config/firebase';
import { Device } from '../../types/Property.types';
import { apiSlice, docToData } from './apiSlice';

const deviceSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Device endpoints
		// Device endpoints
		getDevices: builder.query<Device[], string>({
			async queryFn(propertyId: string) {
				console.log('getDevices query called with propertyId:', propertyId);
				try {
					const q = query(
						collection(db, 'devices'),
						where('location.propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);
					console.log(
						'getDevices query result:',
						querySnapshot.size,
						'documents',
					);
					const devices = querySnapshot.docs
						.map((doc) => docToData(doc) as Device)
						.filter(Boolean) as Device[];
					return { data: devices };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Devices'],
		}),

		getUnitDevices: builder.query<Device[], string>({
			async queryFn(unitId: string) {
				try {
					const q = query(
						collection(db, 'devices'),
						where('location.unitId', '==', unitId),
					);
					const querySnapshot = await getDocs(q);
					const devices = querySnapshot.docs
						.map((doc) => docToData(doc) as Device)
						.filter(Boolean) as Device[];
					return { data: devices };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Devices'],
		}),

		getDevice: builder.query<Device, string>({
			async queryFn(deviceId: string) {
				try {
					const docRef = doc(db, 'devices', deviceId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot) as Device;
					return { data: data as Device };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Devices'],
		}),

		createDevice: builder.mutation<Device, Omit<Device, 'id'>>({
			async queryFn(newDevice) {
				try {
					const docRef = await addDoc(collection(db, 'devices'), {
						...newDevice,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return { data: { id: docRef.id, ...newDevice } as Device };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Devices'],
		}),

		updateDevice: builder.mutation<
			Device,
			{ id: string; updates: Partial<Device> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'devices', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as Device };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Devices'],
		}),

		deleteDevice: builder.mutation<void, string>({
			async queryFn(deviceId: string) {
				try {
					await deleteDoc(doc(db, 'devices', deviceId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Devices'],
		}),

		// Get all devices across all properties (for reports)
		getAllDevices: builder.query<Device[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					const q = query(
						collection(db, 'devices'),
						where('userId', '==', userId),
					);
					const querySnapshot = await getDocs(q);
					const devices = querySnapshot.docs
						.map((doc) => docToData(doc) as Device)
						.filter(Boolean) as Device[];
					return { data: devices };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Devices'],
		}),
	}),
});

export const {
	useGetDevicesQuery,
	useGetUnitDevicesQuery,
	useGetDeviceQuery,
	useCreateDeviceMutation,
	useUpdateDeviceMutation,
	useDeleteDeviceMutation,
	useGetAllDevicesQuery,
} = deviceSlice;
