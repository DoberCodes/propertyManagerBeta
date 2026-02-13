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
	setFile: (file: File | null) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ setFile }) => {
	const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
	const [errors, setErrors] = React.useState<{ file?: string }>({});
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file size (max 25MB for Firebase Storage)
			if (file.size > 25 * 1024 * 1024) {
				setErrors({ ...errors, file: 'File size must be less than 25MB' });
				return;
			}

			// Validate file type (images and PDFs for Firebase Storage)
			const allowedTypes = [
				'image/jpeg',
				'image/png',
				'image/jpg',
				'image/gif',
				'image/webp',
				'application/pdf',
			];
			if (!allowedTypes.includes(file.type)) {
				setErrors({
					...errors,
					file: 'Invalid file type. Please upload an image or PDF file',
				});
				return;
			}

			setSelectedFile(file);
			setErrors({ ...errors, file: undefined });
			setFile(file);
		}
	};

	return (
		<FormGroup>
			<Label htmlFor='completionFile'>
				Upload Completion Document <span style={{ color: '#e74c3c' }}>*</span>
			</Label>
			<FileUploadArea>
				<FileInput
					type='file'
					id='completionFile'
					onChange={handleFileChange}
					accept='image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf'
				/>
				<FileUploadLabel htmlFor='completionFile'>
					{selectedFile ? (
						<FileInfo>
							<strong>Selected File:</strong>
							<br />
							{selectedFile.name}
							<br />
							<span style={{ fontSize: '0.85rem', color: '#666' }}>
								({(selectedFile.size / 1024).toFixed(1)} KB)
							</span>
						</FileInfo>
					) : (
						<>
							<span style={{ fontSize: '2rem' }}>📎</span>
							<br />
							Click to upload or drag and drop
							<br />
							<span style={{ fontSize: '0.85rem', color: '#666' }}>
								JPG, PNG, GIF, WEBP, PDF (max 25MB)
							</span>
						</>
					)}
				</FileUploadLabel>
			</FileUploadArea>
			{errors.file && <ErrorMessage>{errors.file}</ErrorMessage>}
		</FormGroup>
	);
};
