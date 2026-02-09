import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import DocumentViewer from '../Components/DocumentViewer';

const Container = styled.div`
	max-width: 1000px;
	margin: 40px auto;
	padding: 32px;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
`;

const Title = styled.h2`
	font-size: 2.5rem;
	margin-bottom: 24px;
	text-align: center;
	color: #1f2937;
`;

const BackButton = styled.button`
	display: inline-block;
	margin-bottom: 32px;
	padding: 12px 24px;
	background: #6366f1;
	color: #fff;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	transition: background 0.2s;
	border: none;
	cursor: pointer;
	&:hover {
		background: #4f46e5;
	}
`;

const DocumentGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 24px;
	margin-top: 32px;
`;

const DocumentCard = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	padding: 24px;
	background: #f9fafb;
	transition: all 0.2s ease;
	cursor: pointer;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
		border-color: #d1d5db;
	}
`;

const DocumentTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 12px 0;
	color: #1f2937;
`;

const DocumentDescription = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0 0 16px 0;
	line-height: 1.5;
`;

const DocumentLink = styled.button`
	display: inline-block;
	padding: 8px 16px;
	background: #10b981;
	color: #fff;
	border-radius: 6px;
	text-decoration: none;
	font-weight: 500;
	font-size: 0.875rem;
	transition: background 0.2s;
	border: none;
	cursor: pointer;

	&:hover {
		background: #059669;
		text-decoration: none;
		color: #fff;
	}
`;

const LegalPage: React.FC = () => {
	const navigate = useNavigate();
	const [selectedDocument, setSelectedDocument] = useState<{
		name: string;
		title: string;
	} | null>(null);

	const documents = [
		{
			title: 'Terms of Service',
			description:
				'The legal agreement that governs your use of Maintley, including user rights, responsibilities, and service limitations.',
			filename: 'terms-of-service',
		},
		{
			title: 'Privacy Policy',
			description:
				'Information about how we collect, use, and protect your personal data and maintain your privacy.',
			filename: 'privacy-policy',
		},
		{
			title: 'Maintenance Disclaimer',
			description:
				'Important limitations regarding the use of Maintley as a maintenance tracking tool and professional service disclaimers.',
			filename: 'maintenance-disclaimer',
		},
	];

	const handleViewDocument = (filename: string, title: string) => {
		setSelectedDocument({ name: filename, title });
	};

	const handleCloseViewer = () => {
		setSelectedDocument(null);
	};

	return (
		<Container>
			<BackButton onClick={() => navigate(-1)}>← Back</BackButton>

			<Title>Legal Documents</Title>

			<p
				style={{
					textAlign: 'center',
					color: '#6b7280',
					marginBottom: '32px',
					fontSize: '1.1rem',
				}}>
				Review our legal documents and terms of service. These documents are
				also available during account registration and in various places
				throughout the app.
			</p>

			<DocumentGrid>
				{documents.map((doc, index) => (
					<DocumentCard key={index}>
						<DocumentTitle>{doc.title}</DocumentTitle>
						<DocumentDescription>{doc.description}</DocumentDescription>
						<DocumentLink
							as='button'
							onClick={() => handleViewDocument(doc.filename, doc.title)}>
							View Document
						</DocumentLink>
					</DocumentCard>
				))}
			</DocumentGrid>

			<DocumentViewer
				documentName={selectedDocument?.name || ''}
				title={selectedDocument?.title || ''}
				isOpen={!!selectedDocument}
				onClose={handleCloseViewer}
			/>
		</Container>
	);
};

export default LegalPage;
