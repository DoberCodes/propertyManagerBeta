import React from 'react';
import {
	ButtonWrapper,
	IconWrapper,
	NavAnchor,
	NavButton,
	NavRouteLink,
	NavTitle,
	NavWrapper,
} from './LandingNavbar.styles';
import TitleName from '../../../Assets/images/TitleName.png';

export const LandingNavbar = () => {
	return (
		<NavWrapper>
			<IconWrapper></IconWrapper>
			<NavTitle>
				<img src={TitleName} alt='Maintley' />
			</NavTitle>
			<ButtonWrapper>
				<NavAnchor
					to='#About'
					scroll={(el) =>
						el.scrollIntoView({
							behavior: 'auto',
							block: 'start',
						})
					}>
					About
				</NavAnchor>
				<NavAnchor
					to='#Mission'
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					Mission
				</NavAnchor>
				<NavAnchor
					to='#Features'
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					Feature Highlights
				</NavAnchor>
				<NavRouteLink to='/features'>Feature Catalog</NavRouteLink>
				<NavAnchor
					to='#Pricing'
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					Pricing
				</NavAnchor>
				<NavAnchor
					to='#Contact'
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					Contact
				</NavAnchor>
				<NavButton to='/login'>Login</NavButton>
			</ButtonWrapper>
		</NavWrapper>
	);
};
