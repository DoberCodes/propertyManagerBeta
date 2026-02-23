import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../constants/colors';
import SEO from 'Components/SEO/SEO';
import { MobileCarousel } from 'Components/Library';

const SubTitle = styled.h3`
	font-size: 1.3rem;
	margin-bottom: 12px;
	color: ${COLORS.gray800};
	display: flex;
	align-items: center;
	font-weight: 600;
`;

const Paragraph = styled.p`
	font-size: 0.95rem;
	margin-bottom: 16px;
	line-height: 1.6;
	color: ${COLORS.gray600};
`;

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 40px 20px;
	background: ${COLORS.gray50};
	min-height: 100vh;
`;

const Header = styled.div`
	background: linear-gradient(
		135deg,
		${COLORS.primary} 0%,
		${COLORS.primaryDark} 100%
	);
	color: white;
	padding: 60px 40px;
	border-radius: 16px;
	text-align: center;
	margin-bottom: 50px;
	box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2);

	@media (max-width: 1024px) {
		padding: 40px 20px;
	}
`;

const Title = styled.h2`
	font-size: 2.5rem;
	margin-bottom: 16px;
	color: white;
	font-weight: 800;

	@media (max-width: 1024px) {
		font-size: 1.8rem;
	}
`;

const HeaderSubtitle = styled.p`
	font-size: 1.1rem;
	color: rgba(255, 255, 255, 0.9);
	margin: 0;
	font-weight: 300;
`;

const FeatureGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	gap: 24px;
	margin-bottom: 50px;
`;

const FeatureCard = styled.div`
	background: white;
	border-radius: 12px;
	padding: 32px;
	border-left: 4px solid ${COLORS.primary};
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	transition: all 0.3s ease;
	cursor: default;

	&:hover {
		box-shadow: 0 12px 32px rgba(16, 185, 129, 0.15);
		transform: translateY(-4px);
		border-left-color: ${COLORS.primaryHover};
	}
`;

const FeatureList = styled.ul`
	margin: 16px 0;
	padding-left: 20px;
	list-style: none;
`;

const FeatureItem = styled.li`
	margin-bottom: 10px;
	font-size: 0.95rem;
	color: ${COLORS.gray600};
	line-height: 1.6;
	position: relative;
	padding-left: 20px;

	&::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: ${COLORS.primary};
		font-weight: bold;
		font-size: 1.1rem;
	}
`;

const LinkButton = styled.button`
	display: inline-block;
	margin: 24px 0;
	padding: 12px 28px;
	background: linear-gradient(
		135deg,
		${COLORS.primary} 0%,
		${COLORS.primaryDark} 100%
	);
	color: white;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	transition: all 0.3s ease;
	border: none;
	cursor: pointer;
	font-size: 0.95rem;
	box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);

	&:hover {
		background: linear-gradient(
			135deg,
			${COLORS.primaryHover} 0%,
			${COLORS.primary} 100%
		);
		box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
		transform: translateY(-2px);
	}

	&:active {
		transform: translateY(0);
	}
`;

const FeatureIcon = styled.span`
	font-size: 1.6rem;
	margin-right: 12px;
	display: inline-block;
	min-width: 32px;
`;

const HeroCarouselWrapper = styled.div`
	width: 80vw;
	height: 80vh;
	max-width: 100vw;
	margin-left: 50%;
	transform: translateX(-50%);
	position: relative;
	background: #fff;
	box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
	overflow: hidden;
	border-radius: 0 0 24px 24px;
	margin-bottom: 40px;
	@media (max-width: 900px) {
		border-radius: 0 0 12px 12px;
	}
`;

const CarouselCaption = styled.div`
	position: absolute;
	left: 0;
	right: 0;
	bottom: 32px;
	text-align: center;
	color: #fff;
	background: rgba(0, 0, 0, 0.45);
	font-size: 1.25rem;
	font-weight: 600;
	padding: 12px 0;
	border-radius: 0 0 16px 16px;
	pointer-events: none;
	z-index: 2;
`;

export const FeatureDocsPage: React.FC = () => {
	const navigate = useNavigate();

	const screenshots = [
		`${window.location.origin}/screenshots/dashboard.png`,
		`${window.location.origin}/screenshots/devicemanagement.png`,
		`${window.location.origin}/screenshots/properties.png`,
		`${window.location.origin}/screenshots/propertyDetails.png`,
		`${window.location.origin}/screenshots/reporting.png`,
		`${window.location.origin}/screenshots/taskpage.png`,
		`${window.location.origin}/screenshots/teampage.png`,
		`${window.location.origin}/screenshots/unitmanagement.png`,
	];
	const captions = [
		'Dashboard: Overview of property health and tasks',
		'Device Management: Track and maintain all devices',
		'Properties: Manage all your properties in one place',
		'Property Details: Deep dive into each property',
		'Reporting: Visualize maintenance and performance',
		'Task Page: Assign, track, and complete tasks',
		'Team Page: Collaborate with your property team',
		'Unit Management: Organize and monitor every unit',
	];
	return (
		<React.Fragment>
			<Container>
				<SEO
					title='Features — Maintley'
					description='Feature overview: property & unit management, tasks, reporting, team collaboration and mobile access.'
					url={`${window.location.origin}/features`}
					image={screenshots[0]}
					keywords='property maintenance, features, maintenance history, property manager'
				/>
				<Header>
					<Title>Maintley Features</Title>
					<HeaderSubtitle>
						Everything you need to manage property maintenance efficiently
					</HeaderSubtitle>
				</Header>
				<LinkButton onClick={() => navigate('/dashboard')}>
					← Back to Dashboard
				</LinkButton>
				<FeatureGrid>
					<FeatureCard>
						<SubTitle>
							<FeatureIcon>🔐</FeatureIcon>User Authentication & Security
						</SubTitle>
						<Paragraph>
							Secure user authentication with Firebase Authentication, including
							email verification, password reset, and secure login/logout
							functionality.
						</Paragraph>
						<FeatureList>
							<FeatureItem>User registration and login</FeatureItem>
							<FeatureItem>Password reset via email</FeatureItem>
							<FeatureItem>Email verification</FeatureItem>
							<FeatureItem>Secure session management</FeatureItem>
						</FeatureList>
					</FeatureCard>
					{/* Additional FeatureCards omitted for brevity */}
				</FeatureGrid>
			</Container>
		</React.Fragment>
	);
};
