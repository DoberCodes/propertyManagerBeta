import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faBookOpen,
	faMagnifyingGlass,
	faShieldHalved,
	faLock,
	faUserShield,
	faMobileScreenButton,
	faDesktop,
	faGlobe,
	faCar,
	faScrewdriverWrench,
	faChartLine,
	faDownload,
	faBoxArchive,
} from '@fortawesome/free-solid-svg-icons';
import { LandingNavbar } from 'Components/Library/LandingNavbar';
import HeroSection from './components/Hero';
import MissionSectionComponent from './components/MissionSection';
import FeaturesSectionComponent from './components/FeaturesSection';
import PricingSectionComponent from './components/PricingSection';
import {
	Wrapper,
	StorySection,
	StoryContent,
	StoryTitle,
	StoryText,
	BenefitsSection,
	BenefitRow,
	BenefitImage,
	BenefitContent,
	BenefitTitle,
	BenefitDescription,
	BenefitList,
	BenefitItem,
	CTASection,
	CTATitle,
	CTADescription,
	CTAButtons,
	CTAButton,
	CTASecondary,
	ContactSection,
	ContactTitle,
	ContactContent,
	ContactForm,
	FormGroup,
	FormInput,
	FormTextarea,
	SubmitButton,
	FooterSection,
	FooterContent,
	FooterBrand,
	FooterLinks,
	FooterLegalLinks,
	FooterLink,
	FooterLegalLink,
	DownloadSection,
	DownloadContainer,
	DownloadHeading,
	DownloadSubtext,
	DownloadButton,
	DownloadInfo,
	InfoItem,
	FooterCopyright,
} from './LandingPage.styles';

import packageJson from '../../../package.json';
import { getAPKFileSize, getAPKDownloadURL } from '../../utils/versionCheck';
import SEO from 'Components/SEO/SEO';
import { TRIAL_DURATION_DAYS } from '../../constants/subscriptions';
import { legalDocuments } from '../LegalPage/legalDocuments';

const formatBytes = (bytes: number) => {
	var marker = 1024;
	var decimal = 2;
	var kiloBytes = marker;
	var megaBytes = marker * marker;

	if (bytes < kiloBytes) return bytes + ' Bytes';
	else if (bytes < megaBytes)
		return (bytes / kiloBytes).toFixed(decimal) + ' KB';
	else return (bytes / megaBytes).toFixed(decimal) + ' MB';
};

const LandingPageComponent = () => {
	const navigate = useNavigate();
	const apkDownloadUrl = getAPKDownloadURL();
	const handleFooterLink = (href: string) => {
		window.location.href = href;
	};

	// SEO — important for public landing page (site-wide defaults are in public/index.html)
	const seo = {
		title: 'Maintley — Maintenance & Property History',
		description:
			'Maintley helps property owners and managers capture, track and report maintenance — never lose a repair or invoice again.',
		url: 'https://maintleyapp.com/',
		image: `${window.location.origin}/Favicon.png`,
		keywords:
			'property maintenance, maintenance history, property manager, landlord tools',
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'Maintley',
			url: 'https://maintleyapp.com/',
			potentialAction: {
				'@type': 'SearchAction',
				target: 'https://maintleyapp.com/?s={search_term_string}',
				'query-input': 'required name=search_term_string',
			},
		},
	};
	// Use previous version (1.7.3) for the versioned APK download
	const previousVersion = '1.7.3';
	const versionedApkDownloadUrl = `https://github.com/DoberCodes/propertyManagerWebApp/releases/download/v${previousVersion}/app-release.apk`;
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		subject: '',
		message: '',
	});
	const [formStatus, setFormStatus] = useState<
		'idle' | 'sending' | 'success' | 'error'
	>('idle');

	const [apkFileSize, setApkFileSize] = useState('Unknown');
	const [versionedApkFileSize, setVersionedApkFileSize] = useState('Unknown');

	useEffect(() => {
		const fetchFileSizesAndVersionInfo = async () => {
			try {
				// Fetch latest release info
				const releaseResponse = await fetch(
					'https://api.github.com/repos/DoberCodes/propertyManagerWebApp/releases/latest',
				);
				if (releaseResponse.ok) {
					const release = await releaseResponse.json();
					// Get file sizes for both APKs
					const assets = release.assets || [];
					const latestApk = assets.find(
						(asset) =>
							asset.label === 'PropertyManager.apk' ||
							asset.name === 'PropertyManager.apk',
					);

					// For versioned APK, fetch the previous version release
					const previousReleaseResponse = await fetch(
						`https://api.github.com/repos/DoberCodes/propertyManagerWebApp/releases/tags/v${previousVersion}`,
					);
					let versionedApkSize = null;
					if (previousReleaseResponse.ok) {
						const previousRelease = await previousReleaseResponse.json();
						const previousAssets = previousRelease.assets || [];
						const versionedApk = previousAssets.find(
							(asset) =>
								asset.label === `PropertyManager-${previousVersion}.apk` ||
								asset.name === `PropertyManager-${previousVersion}.apk` ||
								asset.name === 'app-release.apk',
						);
						if (versionedApk?.size) {
							versionedApkSize = versionedApk.size;
						}
					}

					if (latestApk?.size) {
						setApkFileSize(formatBytes(latestApk.size));
					}
					if (versionedApkSize) {
						setVersionedApkFileSize(formatBytes(versionedApkSize));
					}
				}
			} catch (error) {
				console.warn('Error fetching version info:', error);
				// Fallback to basic file size fetching
				const size = await getAPKFileSize();
				setApkFileSize(size);
				setVersionedApkFileSize(size);
			}
		};
		fetchFileSizesAndVersionInfo();
	}, []);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormStatus('sending');

		try {
			// Using a simple mailto approach for now
			const mailtoLink = `mailto:maintleyapp@gmail.com?subject=${encodeURIComponent(
				formData.subject,
			)}&body=${encodeURIComponent(
				`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`,
			)}`;

			window.location.href = mailtoLink;

			setFormStatus('success');
			setFormData({ name: '', email: '', subject: '', message: '' });

			// Reset status after 3 seconds
			setTimeout(() => setFormStatus('idle'), 3000);
		} catch (error) {
			console.error('Error sending message:', error);
			setFormStatus('error');
			setTimeout(() => setFormStatus('idle'), 3000);
		}
	};

	return (
		<>
			{/* Page-specific SEO */}
			<SEO
				title={seo.title}
				description={seo.description}
				url={seo.url}
				image={seo.image}
				keywords={seo.keywords}
				structuredData={seo.structuredData}
			/>
			<LandingNavbar />
			<Wrapper>
				{/* Hero Section */}
				<HeroSection />

				{/* Our Story Section */}
				<StorySection id='About'>
					<StoryContent>
						<StoryTitle>How It All Started</StoryTitle>
						<StoryText>
							I bought my first home three years ago and quickly realized
							something: staying on top of home maintenance is harder than
							anyone tells you. Small things pile up, calendars and reminders
							get lost, and before you know it, a simple fix turns into a big
							headache.
						</StoryText>
						<StoryText>
							I wanted a way to keep track of it all — without needing to be a
							maintenance expert or spending hours digging through old notes and
							calendars. That’s why I built Maintley: a tool that helps
							homeowners, landlords, and DIYers stay organized and ahead of the
							little things before they become big problems.
						</StoryText>
						<StoryText>
							Maintley keeps things simple, practical, and genuinely useful. No
							fluff. No over-complication. Just a system to help you feel
							confident in your home and in your responsibilities.
						</StoryText>
						<StoryText>
							Today, people use Maintley to track home and property tasks, stay
							on top of maintenance, and manage responsibilities without the
							stress of trying to remember everything on their own.
						</StoryText>
						<StoryText>
							Whether it’s your own home or a rental property, Maintley is
							designed to make life a little easier — one task, one record, one
							win at a time.
						</StoryText>
						<StoryText>
							And we’re just getting started. We’re listening, improving, and
							building alongside the people who use Maintley — because this was
							made for homeowners like you (and me).
						</StoryText>
					</StoryContent>
				</StorySection>

				{/* Mission Section */}
				<MissionSectionComponent />

				{/* Features Section */}
				<FeaturesSectionComponent />

				{/* Pricing Section */}
				<PricingSectionComponent />

				{/* Benefits Section */}
				<BenefitsSection id='Benefits'>
					<BenefitRow>
						<BenefitImage>
							<img
								src={require('../../Assets/images/cabin_woods.jpg')}
								alt='Time efficiency'
							/>
						</BenefitImage>
						<BenefitContent>
							<BenefitTitle>
								Peace of Mind Through Reliable History
							</BenefitTitle>
							<BenefitDescription>
								Your maintenance history is your security blanket. When you
								diligently log every repair, service, and update, you build
								records you can trust. No guarantees—just the peace of mind that
								comes from knowing your history is complete and accessible.
							</BenefitDescription>
							<BenefitList>
								<BenefitItem>
									<FontAwesomeIcon className='benefit-icon' icon={faBookOpen} />
									Build comprehensive records
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faMagnifyingGlass}
									/>
									Access your history anytime
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faShieldHalved}
									/>
									Your logging, your peace of mind
								</BenefitItem>
							</BenefitList>
						</BenefitContent>
					</BenefitRow>

					<BenefitRow $reverse>
						<BenefitImage>
							<img
								src={require('../../Assets/images/privacy.jpg')}
								alt='Data security'
							/>
						</BenefitImage>
						<BenefitContent>
							<BenefitTitle>Your Privacy Matters</BenefitTitle>
							<BenefitDescription>
								Privacy you don’t have to think about. Your property data is
								never shared and always stays within your team. Built on secure,
								reliable infrastructure you can trust.
							</BenefitDescription>
							<BenefitList>
								<BenefitItem>
									<FontAwesomeIcon className='benefit-icon' icon={faLock} />
									Encrypted data
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faShieldHalved}
									/>
									Secure servers
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faUserShield}
									/>
									Privacy-first design
								</BenefitItem>
							</BenefitList>
						</BenefitContent>
					</BenefitRow>

					<BenefitRow>
						<BenefitImage>
							<img
								src={require('../../Assets/images/camper in the woods.jpg')}
								alt='Mobile access'
							/>
						</BenefitImage>
						<BenefitContent>
							<BenefitTitle>Check In Anytime, Anywhere</BenefitTitle>
							<BenefitDescription>
								Life doesn’t stop — and neither should updates. Check a repair,
								upload photos, and stay connected from anywhere. Your phone
								keeps everything close at hand.
							</BenefitDescription>
							<BenefitList>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faMobileScreenButton}
									/>
									Works on any device
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon className='benefit-icon' icon={faDesktop} />
									Desktop or mobile
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon className='benefit-icon' icon={faGlobe} />
									Always synced
								</BenefitItem>
							</BenefitList>
						</BenefitContent>
					</BenefitRow>

					<BenefitRow>
						<BenefitImage>
							<img
								src={require('../../Assets/images/more than property.jpg')}
								alt='Equipment management'
							/>
						</BenefitImage>
						<BenefitContent>
							<BenefitTitle>Manage More Than Properties</BenefitTitle>
							<BenefitDescription>
								From the truck in the driveway to the mower in the shed, we help
								you keep track of the things you rely on. Custom reminders you
								set, service history you build, and asset details — all in one
								place.
							</BenefitDescription>
							<BenefitList>
								<BenefitItem>
									<FontAwesomeIcon className='benefit-icon' icon={faCar} />
									Vehicle maintenance tracking
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faScrewdriverWrench}
									/>
									Equipment servicing schedules
								</BenefitItem>
								<BenefitItem>
									<FontAwesomeIcon
										className='benefit-icon'
										icon={faChartLine}
									/>
									Comprehensive asset overview
								</BenefitItem>
							</BenefitList>
						</BenefitContent>
					</BenefitRow>
				</BenefitsSection>

				{/* Contact Us Section */}
				<ContactSection id='Contact'>
					<ContactTitle>Get in Touch</ContactTitle>
					<ContactContent>
						<ContactForm onSubmit={handleSubmit}>
							<FormGroup>
								<FormInput
									type='text'
									name='name'
									placeholder='Your Name'
									value={formData.name}
									onChange={handleInputChange}
									required
								/>
							</FormGroup>
							<FormGroup>
								<FormInput
									type='email'
									name='email'
									placeholder='Your Email'
									value={formData.email}
									onChange={handleInputChange}
									required
								/>
							</FormGroup>
							<FormGroup>
								<FormInput
									type='text'
									name='subject'
									placeholder='Subject'
									value={formData.subject}
									onChange={handleInputChange}
									required
								/>
							</FormGroup>
							<FormGroup>
								<FormTextarea
									name='message'
									placeholder='Your Message'
									rows={5}
									value={formData.message}
									onChange={handleInputChange}
									required
								/>
							</FormGroup>
							<SubmitButton type='submit' disabled={formStatus === 'sending'}>
								{formStatus === 'sending' && 'Sending...'}
								{formStatus === 'success' && '✓ Message Sent!'}
								{formStatus === 'error' && 'Error - Try Again'}
								{formStatus === 'idle' && 'Send Message'}
							</SubmitButton>{' '}
						</ContactForm>
					</ContactContent>
				</ContactSection>
				{/* CTA Section */}
				<CTASection>
					<CTATitle>Stop Juggling Maintenance in Your Head</CTATitle>
					<CTATitle>Keep everything in one simple place.</CTATitle>
					<CTADescription>
						Take care of what you own — without the hassle. Join homeowners,
						landlords, and DIYers who track maintenance in one place and enjoy
						peace of mind every day. Start with a {TRIAL_DURATION_DAYS}-day free
						trial on any paid plan.
					</CTADescription>
					<CTAButtons>
						<CTAButton onClick={() => navigate('/register')}>
							Start {TRIAL_DURATION_DAYS}-Day Free Trial
						</CTAButton>
						<CTASecondary onClick={() => navigate('/login')}>
							Sign In
						</CTASecondary>
					</CTAButtons>
				</CTASection>
				{/* Download Section */}
				<DownloadSection id='Download'>
					<DownloadContainer>
						<DownloadHeading>Download the App</DownloadHeading>
						<DownloadSubtext>
							Get started with maintenance that feels manageable. Keep track of
							your property, vehicles, and equipment without the stress.
							Available on Android — download and get settled in.
						</DownloadSubtext>
						<DownloadButton href={apkDownloadUrl} download>
							<FontAwesomeIcon icon={faDownload} /> Download Latest APK (
							{apkFileSize})
						</DownloadButton>
						<DownloadButton href={versionedApkDownloadUrl} download>
							<FontAwesomeIcon icon={faBoxArchive} /> Download v
							{previousVersion} APK ({versionedApkFileSize})
						</DownloadButton>
						<DownloadInfo>
							<InfoItem>
								<strong>File Size</strong>
								<span>{apkFileSize}</span>
							</InfoItem>
							<InfoItem>
								<strong>Android Version</strong>
								<span>8.0 and above</span>
							</InfoItem>
							<InfoItem>
								<strong>Version</strong>
								<span>{`${packageJson.version} (latest)`}</span>
							</InfoItem>
						</DownloadInfo>
					</DownloadContainer>
				</DownloadSection>
				{/* Footer */}
				<FooterSection>
					<FooterContent>
						<FooterBrand>
							<h3>Maintley</h3>
							<p>
								Simple, friendly maintenance tracking for homeowners, small
								landlords, and folks who like to take care of their own.
							</p>
						</FooterBrand>

						<FooterLinks>
							<FooterLink
								onClick={() => {
									document
										.getElementById('About')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								About
							</FooterLink>
							<FooterLink
								onClick={() => {
									document
										.getElementById('Mission')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Mission
							</FooterLink>
							<FooterLink
								onClick={() => {
									document
										.getElementById('Features')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Feature Highlights
							</FooterLink>
							<FooterLink
								as='a'
								href='#/features'
								onClick={(e) => {
									e.preventDefault();
									window.location.href = '#/features';
								}}>
								Feature Catalog
							</FooterLink>
							<FooterLink
								onClick={() => {
									document
										.getElementById('Benefits')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Benefits
							</FooterLink>
							<FooterLink
								as='a'
								href='#/help'
								onClick={(e) => {
									e.preventDefault();
									window.location.href = '#/help';
								}}>
								Help Center
							</FooterLink>
							<FooterLink
								onClick={() => {
									document
										.getElementById('Contact')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Contact
							</FooterLink>
							<FooterLink
								onClick={() => {
									document
										.getElementById('Download')
										?.scrollIntoView({ behavior: 'smooth' });
								}}>
								Download
							</FooterLink>
						</FooterLinks>

						<FooterLegalLinks>
							<FooterLegalLink
								as='a'
								href='#/legal'
								onClick={(e) => {
									e.preventDefault();
									handleFooterLink('#/legal');
								}}>
								Legal Hub
							</FooterLegalLink>
							{legalDocuments.map((doc) => (
								<FooterLegalLink
									key={doc.filename}
									as='a'
									href={`#/legal/${doc.filename}`}
									onClick={(e) => {
										e.preventDefault();
										handleFooterLink(`#/legal/${doc.filename}`);
									}}>
									{doc.title}
								</FooterLegalLink>
							))}
						</FooterLegalLinks>
					</FooterContent>
					<FooterCopyright>
						&copy; 2026 Maintley. Built with ❤️ for property owners everywhere.
					</FooterCopyright>
				</FooterSection>
			</Wrapper>
		</>
	);
};

export default LandingPageComponent;
