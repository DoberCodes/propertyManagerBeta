// mock axios early to prevent Jest trying to parse the ESM axios package
jest.mock('axios', () => ({
	get: jest.fn(),
	post: jest.fn(),
	create: jest.fn(() => ({ get: jest.fn(), post: jest.fn() })),
}));

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from './Redux/store';
import App from './App';

test('renders app', () => {
	render(
		<Provider store={store}>
			<App />
		</Provider>,
	);
	// Basic test that app renders without crashing
	expect(document.body).toBeInTheDocument();
});
