/**
 * Team-related types for the application
 * Centralized domain-specific type definitions
 */

export interface TeamMember {
	id: string;
	groupId: string;
	userId: string;
	firstName: string;
	lastName: string;
	title: string;
	email: string;
	phone: string;
	role: string;
	address: string;
	image?: string;
	notes: string;
	linkedProperties: string[];
	taskHistory: Array<{ date: string; task: string }>;
	files: Array<{ name: string; id: string }>;
	invitationCodeId?: string; // ID of the associated invitation code
	invitationCodeStatus?: 'active' | 'revoked'; // Status of the invitation code
	invitationCodeExpiresAt?: string; // Expiration date of the invitation code
	createdAt?: string;
	updatedAt?: string;
}

export interface TeamGroup {
	id: string;
	userId: string;
	name: string;
	isEditingName?: boolean;
	linkedProperties: string[];
	members?: TeamMember[];
	createdAt?: string;
	updatedAt?: string;
}
