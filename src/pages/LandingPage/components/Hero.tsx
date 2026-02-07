import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Hero,
	HeroContent,
	HeroTitle,
	HeroSubtitle,
	HeroCTA,
	HeroImage,
} from '../LandingPage.styles';

const HeroSection = () => {
	const navigate = useNavigate();

	return (
		<Hero>
			<HeroContent>
				<HeroTitle>Never Lose Track of Your Maintenance History</HeroTitle>
				<HeroSubtitle>
					Your maintenance records are your peace of mind. Whether managing
					properties, vehicles, or equipment, keep every repair, service, and
					update documented in one reliable place. You handle the logging—we
					provide the history you can trust.
				</HeroSubtitle>
				<HeroCTA onClick={() => navigate('/register')}>
					Get Started Free
				</HeroCTA>
			</HeroContent>
			<HeroImage>
				<img
					src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop'
					alt='Property management dashboard'
				/>
			</HeroImage>
		</Hero>
	);
};

export default HeroSection;
