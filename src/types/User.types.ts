import { SharePermission } from '../constants/roles';

export interface UserInvitation {
	id: string;
	propertyId: string;
	propertyTitle: string;
	fromUserId: string;
	fromUserEmail: string;
	toEmail: string;
	permission: SharePermission;
	status: 'pending' | 'accepted' | 'rejected';
	createdAt: string;
	expiresAt: string;
	isGuestInvitation?: boolean; // New field to indicate this creates a property guest
}

export interface Favorite {
	id: string;
	userId: string;
	propertyId: string;
	title: string;
	slug: string;
	timestamp: number;
	createdAt?: string;
}
