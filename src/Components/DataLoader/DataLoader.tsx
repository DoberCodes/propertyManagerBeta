import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../Redux/store/store';
import { useGetPropertyGroupsQuery } from '../../Redux/API/apiSlice';
import { setPropertyGroups } from '../../Redux/Slices/propertyDataSlice';

/**
 * DataLoader component - Fetches data via RTK Query and syncs to Redux store
 * This ensures all data is loaded on app initialization and kept in sync
 */
export const DataLoader: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();

	// Fetch property groups and sync to Redux

	const { data: propertyGroups = [] } = useGetPropertyGroupsQuery();
	// Note: Team data is now handled directly by components using RTK Query hooks
	// instead of being synced to Redux store to avoid synchronization issues

	useEffect(() => {
		if (propertyGroups.length > 0) {
			const normalized = propertyGroups.map((group) => ({
				...group,
				properties: group.properties || [],
			}));
			dispatch(setPropertyGroups(normalized));
		}
	}, [propertyGroups, dispatch]);

	return null;
};
