import React, { useState } from 'react';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import DocumentViewer from '../DocumentViewer';

const TermsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	margin-top: 20px;
`;

const TermsSection = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 16px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #f8fafc;
`;

const Checkbox = styled.input`
	margin-top: 2px;
	flex-shrink: 0;
`;

const TermsContent = styled.div`
	flex: 1;
`;

const TermsTitle = styled.h4`
	margin: 0 0 8px 0;
	font-size: 16px;
	font-weight: 600;
	color: ${COLORS.primary};
`;

const TermsDescription = styled.p`
	margin: 0 0 12px 0;
	font-size: 14px;
	color: #64748b;
	line-height: 1.5;
`;

const ViewLink = styled.button`
	background: none;
	border: none;
	color: ${COLORS.primary};
	text-decoration: underline;
	cursor: pointer;
	font-size: 14px;
	padding: 0;
	transition: color 0.2s ease;

	&:hover {
		color: #2563eb;
	}
`;

const AcceptButton = styled.button<{ disabled: boolean }>`
	background: ${({ disabled }) => (disabled ? '#cbd5e1' : COLORS.primary)};
	color: ${({ disabled }) => (disabled ? '#64748b' : 'white')};
	border: none;
	padding: 12px 24px;
	border-radius: 8px;
	font-size: 16px;
	font-weight: 600;
	cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s ease;
	margin-top: 20px;
	align-self: center;

	&:hover {
		background: ${({ disabled }) => (disabled ? '#cbd5e1' : '#2563eb')};
		transform: ${({ disabled }) => (disabled ? 'none' : 'translateY(-1px)')};
	}

	&:active {
		transform: ${({ disabled }) => (disabled ? 'none' : 'translateY(0)')};
	}
`;

interface TermsAcceptanceStepProps {
	onAccept: () => void;
}

const TermsAcceptanceStep: React.FC<TermsAcceptanceStepProps> = ({
	onAccept,
}) => {
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
	const [acceptedMaintenance, setAcceptedMaintenance] = useState(false);
	const [selectedDocument, setSelectedDocument] = useState<{
		name: string;
		title: string;
	} | null>(null);

	const allAccepted = acceptedTerms && acceptedPrivacy && acceptedMaintenance;

	const handleViewDocument = (filename: string, title: string) => {
		setSelectedDocument({ name: filename, title });
	};

	const handleCloseViewer = () => {
		setSelectedDocument(null);
	};

	const handleAccept = () => {
		if (allAccepted) {
			onAccept();
		}
	};

	return (
		<>
			<TermsContainer>
				<TermsSection>
					<Checkbox
						type='checkbox'
						checked={acceptedTerms}
						onChange={(e) => setAcceptedTerms(e.target.checked)}
					/>
					<TermsContent>
						<TermsTitle>Terms of Service</TermsTitle>
						<TermsDescription>
							I agree to the terms of service that govern the use of Maintley
							and understand my rights and responsibilities as a user.
						</TermsDescription>
						<ViewLink
							onClick={() =>
								handleViewDocument('terms-of-service', 'Terms of Service')
							}>
							View Terms of Service
						</ViewLink>
					</TermsContent>
				</TermsSection>

				<TermsSection>
					<Checkbox
						type='checkbox'
						checked={acceptedPrivacy}
						onChange={(e) => setAcceptedPrivacy(e.target.checked)}
					/>
					<TermsContent>
						<TermsTitle>Privacy Policy</TermsTitle>
						<TermsDescription>
							I acknowledge and agree to the privacy policy regarding how my
							data is collected, used, and protected.
						</TermsDescription>
						<ViewLink
							onClick={() =>
								handleViewDocument('privacy-policy', 'Privacy Policy')
							}>
							View Privacy Policy
						</ViewLink>
					</TermsContent>
				</TermsSection>

				<TermsSection>
					<Checkbox
						type='checkbox'
						checked={acceptedMaintenance}
						onChange={(e) => setAcceptedMaintenance(e.target.checked)}
					/>
					<TermsContent>
						<TermsTitle>Maintenance Disclaimer</TermsTitle>
						<TermsDescription>
							I understand that Maintley is a property management tool and does
							not provide professional maintenance services or warranties.
						</TermsDescription>
						<ViewLink
							onClick={() =>
								handleViewDocument(
									'maintenance-disclaimer',
									'Maintenance Disclaimer',
								)
							}>
							View Maintenance Disclaimer
						</ViewLink>
					</TermsContent>
				</TermsSection>

				<AcceptButton disabled={!allAccepted} onClick={handleAccept}>
					{allAccepted ? 'Accept & Continue' : 'Please Accept All Terms'}
				</AcceptButton>
			</TermsContainer>

			<DocumentViewer
				documentName={selectedDocument?.name || ''}
				title={selectedDocument?.title || ''}
				isOpen={!!selectedDocument}
				onClose={handleCloseViewer}
			/>
		</>
	);
};

export default TermsAcceptanceStep;
