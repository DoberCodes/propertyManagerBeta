export type LegalDocument = {
	title: string;
	description: string;
	filename: string;
};

export const legalDocuments: LegalDocument[] = [
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
	{
		title: 'Accessibility Statement',
		description:
			'Our commitment to digital accessibility and how we strive to make Maintley usable for everyone.',
		filename: 'accessibility-statement',
	},
	{
		title: 'Subscription Terms',
		description:
			'Specific terms related to our subscription plans, billing, and cancellation policies.',
		filename: 'subscription-terms',
	},
	{
		title: 'Copyright Notice',
		description:
			"Information about the intellectual property rights and copyright ownership of Maintley's content and software.",
		filename: 'copyright-notice',
	},
	{
		title: 'Cookie Policy',
		description:
			'Details about our use of cookies and similar technologies on our website and application.',
		filename: 'cookie-policy',
	},
	{
		title: 'End User License Agreement (EULA)',
		description:
			'The legal agreement that specifies the terms under which users can use the Maintley software.',
		filename: 'eula',
	},
	{
		title: 'User Generated Content Policy',
		description:
			'Guidelines and rules regarding content created and shared by users within the Maintley platform.',
		filename: 'user-content-policy',
	},
	{
		title: 'Data Export and Portability Policy',
		description:
			'Information about how users can export their data from Maintley and the formats available for data portability.',
		filename: 'data-export-policy',
	},
];
