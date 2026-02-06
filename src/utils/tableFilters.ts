import { FilterValues } from '../Components/Library/FilterBar/FilterBar';

export const filterText = (value: string, filterValue: string): boolean => {
	if (!filterValue) return true;
	return value?.toLowerCase().includes(filterValue.toLowerCase());
};

export const filterSelect = (value: string, filterValue: string): boolean => {
	if (!filterValue) return true;
	return value === filterValue;
};

export const filterMultiSelect = (
	value: string,
	filterValues: string[],
): boolean => {
	if (!filterValues || filterValues.length === 0) return true;
	return filterValues.includes(value);
};

export const filterDate = (dateString: string, filterDate: string): boolean => {
	if (!filterDate) return true;
	return dateString === filterDate;
};

export const filterDateRange = (
	dateString: string,
	startDate: string,
	endDate: string,
): boolean => {
	if (!startDate && !endDate) return true;

	const date = new Date(dateString);
	const start = startDate ? new Date(startDate) : null;
	const end = endDate ? new Date(endDate) : null;

	if (start && end) {
		return date >= start && date <= end;
	} else if (start) {
		return date >= start;
	} else if (end) {
		return date <= end;
	}

	return true;
};

export const applyFilters = <T>(
	data: T[],
	filters: FilterValues,
	filterConfig: {
		textFields?: (keyof T)[];
		selectFields?: {
			field: keyof T;
			filterKey: string;
			valueGetter?: (item: T) => string;
		}[];
		multiSelectFields?: {
			field: keyof T;
			filterKey: string;
			valueGetter?: (item: T) => string;
		}[];
		dateFields?: {
			field: keyof T;
			filterKey: string;
			valueGetter?: (item: T) => string;
		}[];
		dateRangeFields?: {
			field: keyof T;
			filterKey: string;
			valueGetter?: (item: T) => string;
		}[];
	},
): T[] => {
	return data.filter((item) => {
		// Text search across multiple fields
		if (filterConfig.textFields) {
			const searchTerm = filters.search as string;
			if (searchTerm) {
				const matchesSearch = filterConfig.textFields.some((field) => {
					const value = item[field];
					return typeof value === 'string' && filterText(value, searchTerm);
				});
				if (!matchesSearch) return false;
			}
		}

		// Select filters
		if (filterConfig.selectFields) {
			for (const {
				field,
				filterKey,
				valueGetter,
			} of filterConfig.selectFields) {
				const filterValue = filters[filterKey] as string;
				if (filterValue) {
					const value = valueGetter
						? valueGetter(item)
						: (item[field] as string);
					if (typeof value === 'string' && !filterSelect(value, filterValue)) {
						return false;
					}
				}
			}
		}

		// Multi-select filters
		if (filterConfig.multiSelectFields) {
			for (const {
				field,
				filterKey,
				valueGetter,
			} of filterConfig.multiSelectFields) {
				const filterValues = filters[filterKey] as string[];
				if (filterValues && filterValues.length > 0) {
					const value = valueGetter
						? valueGetter(item)
						: (item[field] as string);
					if (
						typeof value === 'string' &&
						!filterMultiSelect(value, filterValues)
					) {
						return false;
					}
				}
			}
		}

		// Date filters
		if (filterConfig.dateFields) {
			for (const { field, filterKey, valueGetter } of filterConfig.dateFields) {
				const filterValue = filters[filterKey] as string;
				if (filterValue) {
					const value = valueGetter
						? valueGetter(item)
						: (item[field] as string);
					if (typeof value === 'string' && !filterDate(value, filterValue)) {
						return false;
					}
				}
			}
		}

		// Date range filters
		if (filterConfig.dateRangeFields) {
			for (const {
				field,
				filterKey,
				valueGetter,
			} of filterConfig.dateRangeFields) {
				const startDate = filters[`${filterKey}_start`] as string;
				const endDate = filters[`${filterKey}_end`] as string;
				if (startDate || endDate) {
					const value = valueGetter
						? valueGetter(item)
						: (item[field] as string);
					if (
						typeof value === 'string' &&
						!filterDateRange(value, startDate, endDate)
					) {
						return false;
					}
				}
			}
		}

		return true;
	});
};
