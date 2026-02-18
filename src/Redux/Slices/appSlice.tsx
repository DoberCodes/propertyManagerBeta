import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	isMobile: false,
};

const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		setIsMobile: (state, action) => {
			state.isMobile = action.payload;
		},
	},
});

export const { setIsMobile } = appSlice.actions;

export default appSlice.reducer;
