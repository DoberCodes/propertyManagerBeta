import { uploadMaintenanceFile } from './maintenanceFileUpload';

export type UploadedFile = {
	url: string;
	name: string;
	size: number;
	type: string;
};

export const uploadMaintenanceRequestFiles = async (
	files: File[] | undefined,
	propertyId: string,
): Promise<UploadedFile[]> => {
	if (!files || files.length === 0) return [];
	const uploadPromises = files.map((file) =>
		uploadMaintenanceFile(file, propertyId),
	);
	return Promise.all(uploadPromises);
};
