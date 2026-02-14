import styled from 'styled-components';
import { nav_height } from '../../../global.styles';

export const Wrapper = styled.div`
	width: 30%;
	border: 1px solid black;
	height: calc(500px - ${nav_height});
	padding: 10px;

	@media (max-width: 1024px) {
		width: 45%;
		padding: 12px;
		height: calc(500px - ${nav_height});
	}

	@media (max-width: 768px) {
		width: 70%;
		padding: 16px;
		height: auto;
		min-height: 350px;
	}

	@media (max-width: 480px) {
		width: 95%;
		padding: 20px;
		height: auto;
		min-height: 400px;
	}
`;

export const CardTitle = styled.h2`
	text-align: center;

	@media (max-width: 1024px) {
		font-size: 20px;
	}

	@media (max-width: 480px) {
		font-size: 18px;
	}
`;

export const CardBody = styled.div``;
