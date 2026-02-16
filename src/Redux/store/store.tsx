import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../Slices/userSlice';
import navigationReducer from '../Slices/navigationSlice';
import propertyDataReducer from '../Slices/propertyDataSlice';
import teamReducer from '../Slices/teamSlice';
import maintenanceRequestsReducer from '../Slices/maintenanceRequestsSlice';
import { apiSlice } from '../API/apiSlice';
import { taskSlice } from '../API/taskSlice';
import '../API/deviceSlice';
import '../API/contractorSlice';
import '../API/propertySlice';
import '../API/userSlice';
import '../API/tenantSlice';
import '../API/teamSlice';
import '../API/notificationSlice';
import '../API/maintenanceSlice';
import '../API/unitSlice';
import notificationMiddleware from '../middleware/notificationMiddleware';

export const store = configureStore({
	reducer: {
		user: userReducer,
		[apiSlice.reducerPath]: apiSlice.reducer,
		navigation: navigationReducer,
		propertyData: propertyDataReducer,
		team: teamReducer,
		maintenanceRequests: maintenanceRequestsReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(apiSlice.middleware, notificationMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
