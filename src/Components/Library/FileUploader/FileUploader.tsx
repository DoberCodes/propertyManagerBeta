import React from 'react';
import { FormGroup } from '../Modal';
import { FileInput, Label } from '../../PropertiesTab/PropertyDialog.styles';
import {
	ErrorMessage,
	FileInfo,
	FileUploadArea,
	FileUploadLabel,
} from '../../TaskCompletionModal/TaskCompletionModal.styles';

interface FileUploaderProps {
	setFile?: (file: File | null) => void;
	setFiles?: (files: File[]) => void;
	label?: string;
	required?: boolean;
	helperText?: string;
	accept?: string;
	allowedTypes?: string[];
	maxSizeBytes?: number;
	multiple?: boolean;
	showSelectedFiles?: boolean;
	disabled?: boolean;
	id?: string;
	variant?: 'dropzone' | 'hidden';
	onError?: (message: string) => void;
}

const formatBytes = (value: number) => {
	const kb = value / 1024;
	if (kb < 1024) return `${kb.toFixed(1)} KB`;
	return `${(kb / 1024).toFixed(1)} MB`;
};

const isAllowedFileType = (file: File, allowedTypes?: string[]) => {
	if (!allowedTypes || allowedTypes.length === 0) return true;
	return allowedTypes.some((type) => {
		if (type.endsWith('/*')) {
			const prefix = type.slice(0, -1);
			return file.type.startsWith(prefix);
		}
		return file.type === type;
	});
};

export const FileUploader: React.FC<FileUploaderProps> = ({
	setFile,
	setFiles,
	label = 'Upload File',
	required = false,
	helperText,
	accept,
	allowedTypes,
	maxSizeBytes = 25 * 1024 * 1024,
	multiple = false,
	showSelectedFiles = true,
	disabled = false,
	id,
	variant = 'dropzone',
	onError,
}) => {
	const inputId = React.useId();
	const resolvedId = id || inputId;
	const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
	const [errors, setErrors] = React.useState<{ file?: string }>({});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) {
			setSelectedFiles([]);
			setErrors({ file: undefined });
			setFile?.(null);
			setFiles?.([]);
			return;
		}

		const overLimit = files.find((file) => file.size > maxSizeBytes);
		if (overLimit) {
			const message = `File size must be less than ${formatBytes(
				maxSizeBytes,
			)}`;
			setErrors({ file: message });
			onError?.(message);
			return;
		}

		const invalidType = files.find(
			(file) => !isAllowedFileType(file, allowedTypes),
		);
		if (invalidType) {
			const message = 'Invalid file type. Please choose a supported file.';
			setErrors({ file: message });
			onError?.(message);
			return;
		}

		const nextFiles = multiple ? files : files.slice(0, 1);
		setSelectedFiles(nextFiles);
		setErrors({ file: undefined });
		setFile?.(nextFiles[0] || null);
		setFiles?.(nextFiles);
	};

	if (variant === 'hidden') {
		return (
			<FileInput
				type='file'
				id={resolvedId}
				onChange={handleFileChange}
				accept={accept}
				multiple={multiple}
				disabled={disabled}
				style={{ display: 'none' }}
			/>
		);
	}

	return (
		<FormGroup>
			<Label htmlFor={resolvedId}>
				{label} {required && <span style={{ color: '#e74c3c' }}>*</span>}
			</Label>
			<FileUploadArea>
				<FileInput
					type='file'
					id={resolvedId}
					onChange={handleFileChange}
					accept={accept}
					multiple={multiple}
					disabled={disabled}
				/>
				<FileUploadLabel htmlFor={resolvedId}>
					{selectedFiles.length > 0 && showSelectedFiles ? (
						<FileInfo>
							<strong>Selected File{multiple ? 's' : ''}:</strong>
							<br />
							{multiple ? (
								selectedFiles.map((file) => (
									<div key={`${file.name}-${file.size}`}>
										{file.name} ({formatBytes(file.size)})
									</div>
								))
							) : (
								<>
									{selectedFiles[0].name}
									<br />
									<span style={{ fontSize: '0.85rem', color: '#666' }}>
										({formatBytes(selectedFiles[0].size)})
									</span>
								</>
							)}
						</FileInfo>
					) : (
						<>
							<span style={{ fontSize: '2rem' }}>📎</span>
							<br />
							Click to upload or drag and drop
							<br />
							<span style={{ fontSize: '0.85rem', color: '#666' }}>
								{helperText || 'Max 25MB'}
							</span>
						</>
					)}
				</FileUploadLabel>
			</FileUploadArea>
			{errors.file && <ErrorMessage>{errors.file}</ErrorMessage>}
		</FormGroup>
	);
};
