import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NavigationState {
	tabSelection: number;
	sidebarOpen: boolean;
	activeRoute: string;
}

const initialState: NavigationState = {
	tabSelection: 0,
	sidebarOpen: true,
	activeRoute: '/dashboard',
};

const navigationSlice = createSlice({
	name: 'navigation',
	initialState,
	reducers: {
		setTabSelection: (state, action: PayloadAction<number>) => {
			state.tabSelection = action.payload;
		},
		toggleSidebar: (state) => {
			state.sidebarOpen = !state.sidebarOpen;
		},
		setSidebarOpen: (state, action: PayloadAction<boolean>) => {
			state.sidebarOpen = action.payload;
		},
		setActiveRoute: (state, action: PayloadAction<string>) => {
			state.activeRoute = action.payload;
		},
	},
});

export const {
	setTabSelection,
	toggleSidebar,
	setSidebarOpen,
	setActiveRoute,
} = navigationSlice.actions;

export default navigationSlice.reducer;
