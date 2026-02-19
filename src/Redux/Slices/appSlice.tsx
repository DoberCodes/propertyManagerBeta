import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	isMobile: false,
	activeTab: 'details', // Added for tab persistence
};

const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		setIsMobile: (state, action) => {
			state.isMobile = action.payload;
		},
		setActiveTab: (state, action) => {
			state.activeTab = action.payload; // Action to set the active tab
		},
		resetActiveTab: (state) => {
			state.activeTab = 'details'; // Action to reset the active tab
		},
	},
});

export const { setIsMobile, setActiveTab, resetActiveTab } = appSlice.actions;

export default appSlice.reducer;
