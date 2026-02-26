// Subscription plans and trial settings
export const TRIAL_DURATION_DAYS = 14; // 14-day free trial

export const SUBSCRIPTION_PLANS = {
	FREE: {
		id: 'free',
		name: 'Free',
		priceMonthly: 0,
		maxProperties: 1,
		features: ['Limited to 1 home', 'Basic features only'],
		permissions: {
			canManageTeam: false,
			canManageTenants: false,
			canViewReports: false,
			canExportData: false,
			canAdvancedAuditTrail: false,
			canManageMultiUnit: false,
			prioritySupport: false,
			canCreateProperties: true, // Can create properties
			canManageProperties: true, // Can manage properties
			canSubmitMaintenanceRequests: false, // Cannot submit maintenance requests
			canViewTenantInfo: false, // Cannot view tenant info
		},
	},
	GUEST: {
		id: 'guest',
		name: 'Guest',
		priceMonthly: 0,
		maxProperties: 0, // Cannot create properties, only access shared ones
		features: [
			'Access to shared properties only',
			'Cannot create new properties',
			'Limited to properties shared by others',
		],
		permissions: {
			canManageTeam: false,
			canManageTenants: false,
			canViewReports: false,
			canExportData: false,
			canAdvancedAuditTrail: false,
			canManageMultiUnit: false,
			prioritySupport: false,
			canCreateProperties: false, // Cannot create properties
			canManageProperties: false, // Cannot manage properties
			canSubmitMaintenanceRequests: false, // Cannot submit maintenance requests
			canViewTenantInfo: false, // Cannot view tenant info
		},
	},
	TENANT: {
		id: 'tenant',
		name: 'Tenant',
		priceMonthly: 0,
		maxProperties: 0, // Cannot create properties, only access assigned property/unit
		features: [
			'Access to assigned property/unit only',
			'Cannot create or manage properties',
			'Submit maintenance requests',
			'View tenant information (read-only)',
		],
		permissions: {
			canManageTeam: false,
			canManageTenants: false,
			canViewReports: false,
			canExportData: false,
			canAdvancedAuditTrail: false,
			canManageMultiUnit: false,
			prioritySupport: false,
			canCreateProperties: false, // Explicitly cannot create properties
			canManageProperties: false, // Cannot manage properties
			canSubmitMaintenanceRequests: true, // Can submit maintenance requests
			canViewTenantInfo: true, // Can view their own tenant information
		},
	},
	HOMEOWNER: {
		id: 'homeowner',
		name: 'Homeowner',
		priceMonthly: 1.99,
		maxProperties: 1,
		features: [
			'Single-family homes only',
			'Continuous service record for properties',
			'Unlimited maintenance tracking for devices and their maintenance history',
			'Maintain a complete record of contractor/vendor work',
			'Attach documents and photos to create a full property audit trail',
			'Export reports as reference/supporting documentation for insurance or resale',
		],
		permissions: {
			canManageTeam: false,
			canManageTenants: false,
			canViewReports: false,
			canExportData: true,
			canAdvancedAuditTrail: false,
			canManageMultiUnit: false,
			prioritySupport: false,
			canCreateProperties: true, // Can create properties
			canManageProperties: true, // Can manage properties
			canSubmitMaintenanceRequests: false, // Cannot submit maintenance requests
			canViewTenantInfo: false, // Cannot view tenant info
		},
	},
	BASIC: {
		id: 'basic',
		name: 'Basic',
		priceMonthly: 8.99,
		maxProperties: 5,
		features: [
			'All of Homeowner features, plus:',
			'Track maintenance for up to 5 properties',
			'Maintain per unit device history for each property',
			'Add team members to keep maintenance organized and well documented',
			'Invite tenants to submit maintenance requests directly into the propery history',
			'Tenant-requested maintenance becomes part of the property audit trail',
		],
		permissions: {
			canManageTeam: true,
			canManageTenants: true,
			canViewReports: false,
			canExportData: true,
			canAdvancedAuditTrail: true,
			canManageMultiUnit: true,
			prioritySupport: false,
			canCreateProperties: true, // Can create properties
			canManageProperties: true, // Can manage properties
			canSubmitMaintenanceRequests: false, // Cannot submit maintenance requests
			canViewTenantInfo: false, // Cannot view tenant info
		},
	},
	PROFESSIONAL: {
		id: 'professional',
		name: 'Professional',
		priceMonthly: 15.99,
		maxProperties: 10,
		features: [
			'Everything in Basic, plus:',
			'Track maintenance for up to 10 properties',
			'Advanced reporting & export (PDF/CSV) for insurance, resale, or audits as reference/supporting documentation',
			'Full audit trail for each property and unit',
		],
		permissions: {
			canManageTeam: true,
			canManageTenants: true,
			canViewReports: true,
			canExportData: true,
			canAdvancedAuditTrail: true,
			canManageMultiUnit: true,
			prioritySupport: true,
			canCreateProperties: true, // Can create properties
			canManageProperties: true, // Can manage properties
			canSubmitMaintenanceRequests: false, // Cannot submit maintenance requests
			canViewTenantInfo: false, // Cannot view tenant info
		},
	},
};

export const SUBSCRIPTION_STATUS = {
	ACTIVE: 'active',
	TRIAL: 'trial',
	CANCELLED: 'cancelled',
	EXPIRED: 'expired',
	PAST_DUE: 'past_due',
} as const;

export type SubscriptionStatus =
	(typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];
