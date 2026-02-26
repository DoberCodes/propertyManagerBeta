export const LEGAL_AGREEMENT_VERSION = '1.3';

export const LEGAL_DOCUMENT_KEYS = {
	termsOfService: 'termsOfService',
	privacyPolicy: 'privacyPolicy',
	maintenanceDisclaimer: 'maintenanceDisclaimer',
	subscriptionTerms: 'subscriptionTerms',
	eula: 'eula',
} as const;

export type LegalDocumentKey =
	(typeof LEGAL_DOCUMENT_KEYS)[keyof typeof LEGAL_DOCUMENT_KEYS];

export interface LegalDocumentAcceptance {
	accepted: boolean;
	agreedVersion: string;
	agreedAt: string;
	fileName: string;
	title: string;
}

export const createLegalAgreementDocuments = (
	agreedAt: string,
	agreedVersion: string = LEGAL_AGREEMENT_VERSION,
): Record<LegalDocumentKey, LegalDocumentAcceptance> => ({
	[LEGAL_DOCUMENT_KEYS.termsOfService]: {
		accepted: true,
		agreedVersion,
		agreedAt,
		fileName: 'terms-of-service',
		title: 'Terms of Service',
	},
	[LEGAL_DOCUMENT_KEYS.privacyPolicy]: {
		accepted: true,
		agreedVersion,
		agreedAt,
		fileName: 'privacy-policy',
		title: 'Privacy Policy',
	},
	[LEGAL_DOCUMENT_KEYS.maintenanceDisclaimer]: {
		accepted: true,
		agreedVersion,
		agreedAt,
		fileName: 'maintenance-disclaimer',
		title: 'Maintenance Disclaimer',
	},
	[LEGAL_DOCUMENT_KEYS.subscriptionTerms]: {
		accepted: true,
		agreedVersion,
		agreedAt,
		fileName: 'subscription-terms',
		title: 'Subscription Terms',
	},
	[LEGAL_DOCUMENT_KEYS.eula]: {
		accepted: true,
		agreedVersion,
		agreedAt,
		fileName: 'eula',
		title: 'End User License Agreement (EULA)',
	},
});
