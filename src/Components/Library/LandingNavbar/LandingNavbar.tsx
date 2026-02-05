import React from 'react';
import {
	ButtonWrapper,
	IconWrapper,
	NavAnchor,
	NavButton,
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
					Our Story
				</NavAnchor>
				<NavAnchor
					to='#Mission'
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					Our Mission
				</NavAnchor>
				<NavAnchor
					to='#Contact'
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					Contact Us
				</NavAnchor>
				<NavButton to='/login'>Login</NavButton>
			</ButtonWrapper>
		</NavWrapper>
	);
};
