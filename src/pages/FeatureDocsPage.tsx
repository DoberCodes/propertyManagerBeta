import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const SubTitle = styled.h3`
	font-size: 1.5rem;
	margin-bottom: 12px;
	color: #1f2937;
`;

const Paragraph = styled.p`
	font-size: 1.1rem;
	margin-bottom: 10px;
	line-height: 1.6;
	color: #4b5563;
`;

const Container = styled.div`
	max-width: 900px;
	margin: 40px auto;
	padding: 32px;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
`;

const Title = styled.h2`
	font-size: 2.5rem;
	margin-bottom: 24px;
	color: #1f2937;
	text-align: center;
`;

const Section = styled.section`
	margin-bottom: 40px;
	padding-bottom: 24px;
	border-bottom: 1px solid #e5e7eb;

	&:last-child {
		border-bottom: none;
	}
`;

const FeatureList = styled.ul`
	margin: 16px 0;
	padding-left: 20px;
`;

const FeatureItem = styled.li`
	margin-bottom: 8px;
	font-size: 1.1rem;
	color: #4b5563;
	line-height: 1.5;
`;

const LinkButton = styled.button`
	display: inline-block;
	margin: 16px 0;
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

const FeatureIcon = styled.span`
	font-size: 1.2rem;
	margin-right: 8px;
`;

export const FeatureDocsPage: React.FC = () => {
	const navigate = useNavigate();
	return (
		<Container>
			<Title>Maintley Features</Title>
			<LinkButton
				onClick={() => navigate('/dashboard')}
				style={{ marginBottom: 32 }}>
				← Back to Dashboard
			</LinkButton>

			<Section>
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
			</Section>

			<Section>
				<SubTitle>
					<FeatureIcon>🏢</FeatureIcon>Property & Unit Management
				</SubTitle>
				<Paragraph>
					Comprehensive property management with detailed unit and suite
					tracking. Create and manage multiple properties with complete
					organizational structure.
				</Paragraph>
				<FeatureList>
					<FeatureItem>Add, edit, and delete properties</FeatureItem>
					<FeatureItem>Manage units and suites within properties</FeatureItem>
					<FeatureItem>Detailed property information and history</FeatureItem>
					<FeatureItem>Property assignment to team members</FeatureItem>
					<FeatureItem>Visual property organization</FeatureItem>
				</FeatureList>
			</Section>

			<Section>
				<SubTitle>
					<FeatureIcon>📋</FeatureIcon>Task Management System
				</SubTitle>
				<Paragraph>
					Complete task tracking and management system with status updates,
					assignments, and approval workflows.
				</Paragraph>
				<FeatureList>
					<FeatureItem>Create and assign tasks to team members</FeatureItem>
					<FeatureItem>
						Task status tracking (Pending, In Progress, Awaiting Approval,
						Completed, Rejected)
					</FeatureItem>
					<FeatureItem>
						Task completion with notes and photo uploads
					</FeatureItem>
					<FeatureItem>Overdue task notifications and highlighting</FeatureItem>
					<FeatureItem>Task history and audit trail</FeatureItem>
					<FeatureItem>Maintenance request conversion to tasks</FeatureItem>
				</FeatureList>
			</Section>

			<Section>
				<SubTitle>
					<FeatureIcon>👥</FeatureIcon>Team Management
				</SubTitle>
				<Paragraph>
					Role-based team management with invitation system and permission
					controls.
				</Paragraph>
				<FeatureList>
					<FeatureItem>
						Role-based access control (Admin, Property Manager, Assistant
						Manager, Member, Tenant)
					</FeatureItem>
					<FeatureItem>Team member invitations via email</FeatureItem>
					<FeatureItem>Team member management and removal</FeatureItem>
					<FeatureItem>Property-specific team assignments</FeatureItem>
					<FeatureItem>Team collaboration features</FeatureItem>
				</FeatureList>
			</Section>

			<Section>
				<SubTitle>
					<FeatureIcon>📊</FeatureIcon>Dashboard & Analytics
				</SubTitle>
				<Paragraph>
					Real-time dashboard with visual analytics and efficiency tracking.
				</Paragraph>
				<FeatureList>
					<FeatureItem>
						Live efficiency pie chart showing task status breakdown
					</FeatureItem>
					<FeatureItem>Recent activity feed</FeatureItem>
					<FeatureItem>Team member overview</FeatureItem>
					<FeatureItem>Quick action shortcuts</FeatureItem>
					<FeatureItem>Real-time data updates</FeatureItem>
				</FeatureList>
			</Section>

			<Section>
				<SubTitle>
					<FeatureIcon>📈</FeatureIcon>Reporting & Analytics
				</SubTitle>
				<Paragraph>
					Comprehensive reporting tools for maintenance history, trends, and
					compliance.
				</Paragraph>
				<FeatureList>
					<FeatureItem>Detailed maintenance history reports</FeatureItem>
					<FeatureItem>Task completion analytics</FeatureItem>
					<FeatureItem>Property performance metrics</FeatureItem>
					<FeatureItem>Data export capabilities</FeatureItem>
					<FeatureItem>Custom report generation</FeatureItem>
					<FeatureItem>Historical trend analysis</FeatureItem>
				</FeatureList>
			</Section>

			<Section>
				<SubTitle>
					<FeatureIcon>📱</FeatureIcon>Mobile App Features
				</SubTitle>
				<Paragraph>
					Native Android app with additional mobile-specific features and
					optimizations.
				</Paragraph>
				<FeatureList>
					<FeatureItem>Native Android APK downloads</FeatureItem>
					<FeatureItem>Push notifications for task updates</FeatureItem>
					<FeatureItem>Automatic update notifications</FeatureItem>
					<FeatureItem>Mobile-optimized interface</FeatureItem>
					<FeatureItem>Offline-capable features</FeatureItem>
				</FeatureList>
			</Section>

			<Section>
				<SubTitle>
					<FeatureIcon>🔔</FeatureIcon>Notifications & Communication
				</SubTitle>
				<Paragraph>
					Comprehensive notification system for staying updated on property
					activities.
				</Paragraph>
				<FeatureList>
					<FeatureItem>Push notifications (native app)</FeatureItem>
					<FeatureItem>In-app notifications</FeatureItem>
					<FeatureItem>Task assignment notifications</FeatureItem>
					<FeatureItem>Overdue task alerts</FeatureItem>
					<FeatureItem>Update notifications</FeatureItem>
				</FeatureList>
			</Section>

			<Section>
				<SubTitle>
					<FeatureIcon>⚙️</FeatureIcon>Settings & Profile Management
				</SubTitle>
				<Paragraph>
					User profile management and application settings customization.
				</Paragraph>
				<FeatureList>
					<FeatureItem>User profile management</FeatureItem>
					<FeatureItem>Account settings</FeatureItem>
					<FeatureItem>Notification preferences</FeatureItem>
					<FeatureItem>Subscription management</FeatureItem>
					<FeatureItem>App configuration options</FeatureItem>
				</FeatureList>
			</Section>

			<Section>
				<SubTitle>
					<FeatureIcon>🔒</FeatureIcon>Subscription & Access Control
				</SubTitle>
				<Paragraph>
					Role-based access control and subscription management for different
					user tiers.
				</Paragraph>
				<FeatureList>
					<FeatureItem>Multiple subscription plans</FeatureItem>
					<FeatureItem>Feature access based on subscription level</FeatureItem>
					<FeatureItem>Paywall system for premium features</FeatureItem>
					<FeatureItem>Role-based feature restrictions</FeatureItem>
					<FeatureItem>Usage tracking and limits</FeatureItem>
				</FeatureList>
			</Section>

			<Section>
				<SubTitle>
					<FeatureIcon>🛠️</FeatureIcon>Maintenance History & Documentation
				</SubTitle>
				<Paragraph>
					Complete maintenance history tracking with visual documentation and
					contractor records.
				</Paragraph>
				<FeatureList>
					<FeatureItem>
						Detailed maintenance records for all properties and units
					</FeatureItem>
					<FeatureItem>Photo and document attachments</FeatureItem>
					<FeatureItem>Contractor work history tracking</FeatureItem>
					<FeatureItem>Searchable maintenance database</FeatureItem>
					<FeatureItem>Compliance and audit trail</FeatureItem>
					<FeatureItem>Visual maintenance documentation</FeatureItem>
				</FeatureList>
			</Section>

			<Section>
				<SubTitle>
					<FeatureIcon>🔄</FeatureIcon>Real-time Updates & Synchronization
				</SubTitle>
				<Paragraph>
					Real-time data synchronization across all devices and users.
				</Paragraph>
				<FeatureList>
					<FeatureItem>Real-time task updates</FeatureItem>
					<FeatureItem>Live dashboard updates</FeatureItem>
					<FeatureItem>Cross-device synchronization</FeatureItem>
					<FeatureItem>Instant notification delivery</FeatureItem>
					<FeatureItem>Collaborative editing</FeatureItem>
				</FeatureList>
			</Section>
		</Container>
	);
};
