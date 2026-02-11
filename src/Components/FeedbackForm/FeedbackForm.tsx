import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import { useSubmitFeedbackMutation } from '../../Redux/API/apiSlice';

interface FeedbackFormProps {
	onClose?: () => void;
}

export type FeedbackType = 'feedback' | 'feature_request' | 'bug_report';

export interface FeedbackData {
	type: FeedbackType;
	subject: string;
	message: string;
	userEmail?: string;
	userId?: string;
	userName?: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose }) => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [formData, setFormData] = useState<FeedbackData>({
		type: 'feedback',
		subject: '',
		message: '',
		userEmail: currentUser?.email || '',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [error, setError] = useState('');

	const [submitFeedback] = useSubmitFeedbackMutation();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (!formData.subject.trim() || !formData.message.trim()) {
			setError('Please fill in all required fields.');
			return;
		}

		setIsSubmitting(true);

		try {
			await submitFeedback({
				...formData,
				userId: currentUser?.id,
				userEmail: formData.userEmail || currentUser?.email,
				userName:
					currentUser?.firstName && currentUser?.lastName
						? `${currentUser.firstName} ${currentUser.lastName}`
						: currentUser?.email?.split('@')[0],
			}).unwrap();

			setIsSubmitted(true);
			setTimeout(() => {
				onClose?.();
			}, 2000);
		} catch (err: any) {
			setError(err.message || 'Failed to submit feedback. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isSubmitted) {
		return (
			<SuccessContainer>
				<SuccessIcon>
					<FontAwesomeIcon icon={faCheckCircle} />
				</SuccessIcon>
				<SuccessTitle>Thank you for your feedback!</SuccessTitle>
				<SuccessMessage>
					Your feedback has been submitted successfully. We'll review it and get
					back to you if needed.
				</SuccessMessage>
			</SuccessContainer>
		);
	}

	return (
		<FormContainer onSubmit={handleSubmit}>
			<FormTitle>Share Your Feedback</FormTitle>
			<FormDescription>
				Help us improve Maintley by sharing your thoughts, reporting bugs, or
				requesting new features.
			</FormDescription>

			<FormGroup>
				<Label htmlFor='feedback-type'>Type of Feedback</Label>
				<Select
					id='feedback-type'
					value={formData.type}
					onChange={(e) =>
						setFormData({ ...formData, type: e.target.value as FeedbackType })
					}>
					<option value='feedback'>General Feedback</option>
					<option value='feature_request'>Feature Request</option>
					<option value='bug_report'>Bug Report</option>
				</Select>
			</FormGroup>

			<FormGroup>
				<Label htmlFor='subject'>Subject *</Label>
				<Input
					id='subject'
					type='text'
					value={formData.subject}
					onChange={(e) =>
						setFormData({ ...formData, subject: e.target.value })
					}
					placeholder='Brief description of your feedback'
					required
				/>
			</FormGroup>

			<FormGroup>
				<Label htmlFor='userEmail'>Email Address (Optional)</Label>
				<Input
					id='userEmail'
					type='email'
					value={formData.userEmail || ''}
					onChange={(e) =>
						setFormData({ ...formData, userEmail: e.target.value })
					}
					placeholder='your.email@example.com'
				/>
				<HelpText>
					Provide your email if you'd like us to follow up on your feedback
				</HelpText>
			</FormGroup>

			<FormGroup>
				<Label htmlFor='message'>Message *</Label>
				<TextArea
					id='message'
					value={formData.message}
					onChange={(e) =>
						setFormData({ ...formData, message: e.target.value })
					}
					placeholder='Please provide detailed information about your feedback, bug report, or feature request...'
					rows={6}
					required
				/>
			</FormGroup>

			{error && <ErrorMessage>{error}</ErrorMessage>}

			<ButtonGroup>
				{onClose && (
					<CancelButton type='button' onClick={onClose}>
						Cancel
					</CancelButton>
				)}
				<SubmitButton type='submit' disabled={isSubmitting}>
					{isSubmitting ? (
						<>
							<FontAwesomeIcon icon={faPaperPlane} spin />
							Sending...
						</>
					) : (
						<>
							<FontAwesomeIcon icon={faPaperPlane} />
							Submit Feedback
						</>
					)}
				</SubmitButton>
			</ButtonGroup>
		</FormContainer>
	);
};

export default FeedbackForm;

// Styled Components
const FormContainer = styled.form`
	max-width: 500px;
	width: 100%;
`;

const FormTitle = styled.h3`
	margin: 0 0 8px 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: #1f2937;
`;

const FormDescription = styled.p`
	margin: 0 0 24px 0;
	color: #6b7280;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const FormGroup = styled.div`
	margin-bottom: 20px;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 6px;
	font-weight: 500;
	color: #374151;
	font-size: 0.875rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}
`;

const TextArea = styled.textarea`
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	font-family: inherit;
	resize: vertical;
	min-height: 120px;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	background: white;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	margin-top: 24px;
`;

const BaseButton = styled.button`
	padding: 10px 20px;
	border-radius: 6px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 8px;
	border: none;

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const SubmitButton = styled(BaseButton)`
	background: #6366f1;
	color: white;

	&:hover:not(:disabled) {
		background: #4f46e5;
	}
`;

const CancelButton = styled(BaseButton)`
	background: #f3f4f6;
	color: #374151;
	border: 1px solid #d1d5db;

	&:hover:not(:disabled) {
		background: #e5e7eb;
	}
`;

const ErrorMessage = styled.div`
	color: #dc2626;
	font-size: 0.875rem;
	margin-bottom: 16px;
	padding: 8px 12px;
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 4px;
`;

const SuccessContainer = styled.div`
	text-align: center;
	padding: 40px 20px;
`;

const SuccessIcon = styled.div`
	font-size: 3rem;
	color: #10b981;
	margin-bottom: 16px;
`;

const SuccessTitle = styled.h3`
	margin: 0 0 8px 0;
	color: #1f2937;
	font-size: 1.25rem;
`;

const SuccessMessage = styled.p`
	margin: 0;
	color: #6b7280;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const HelpText = styled.p`
	margin: 4px 0 0 0;
	color: #6b7280;
	font-size: 0.75rem;
	line-height: 1.4;
`;
