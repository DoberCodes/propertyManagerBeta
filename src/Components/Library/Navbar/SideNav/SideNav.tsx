import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../../Redux/store/store';
import { setActiveRoute } from '../../../../Redux/Slices/navigationSlice';
import {
	canManageTeam,
	canAccessReadOnlyFeatures,
} from '../../../../utils/subscriptionUtils';
import { useRecentlyViewed } from '../../../../Hooks/useRecentlyViewed';
import { useFavorites } from '../../../../Hooks/useFavorites';
import { UserRole } from '../../../../constants/roles';
import {
	DesktopWrapper,
	MenuSection,
	SectionTitle,
	MenuNav,
	MenuItem,
	Section,
	SectionContent,
	BottomSections,
	MobileBottomNav,
	MobileNavItem,
} from './SideNav.styles';

export const SideNav = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const activeRoute = useSelector(
		(state: RootState) => state.navigation.activeRoute,
	);
	const { recentProperties } = useRecentlyViewed(currentUser!.id);
	const { favorites } = useFavorites(currentUser!.id);

	// Update Redux when location changes
	React.useEffect(() => {
		const hash = location.hash.replace('#', '');
		// Extract the main route (e.g., '/dashboard' from '/dashboard' or '/property/:slug')
		const mainRoute = '/' + hash.split('/')[1];
		dispatch(setActiveRoute(mainRoute));
	}, [location.hash, dispatch]);

	// Check permissions based on subscription plan
	const canAccessTeam = currentUser?.subscription
		? canManageTeam(currentUser.subscription)
		: false;
	const canAccessProperties = currentUser?.subscription
		? currentUser.subscription.plan !== 'free'
		: false;
	const canViewReportsPermission = currentUser?.subscription
		? canAccessReadOnlyFeatures(currentUser.subscription)
		: false;
	const canExportDataPermission = currentUser?.subscription
		? canAccessReadOnlyFeatures(currentUser.subscription)
		: false;
	const canViewPages = currentUser?.subscription
		? currentUser.subscription.plan !== 'free'
		: false;
	const isUserTenant = currentUser ? currentUser.role === 'tenant' : false;
	const isHomeowner = currentUser?.subscription?.plan === 'homeowner';

	const isActive = (path: string) => activeRoute === path;

	// Desktop nav items
	const desktopMenuItems = [
		{ label: 'Dashboard', path: '/dashboard', visible: !isUserTenant },
		{
			label: 'Properties',
			path: '/properties',
			visible: !isUserTenant && (canAccessProperties || canViewPages),
		},
		{
			label: 'Team',
			path: '/team',
			visible: !isUserTenant && !isHomeowner && (canAccessTeam || canViewPages),
		},
		{
			label: 'Report',
			path: '/report',
			visible: !isUserTenant && (canAccessProperties || canViewPages),
		},
		{
			label: 'Tenant Profile',
			path: '/tenant-profile',
			visible:
				currentUser?.userType === 'tenant' ||
				currentUser?.userType === 'Tenant' ||
				currentUser?.userType === 'Shared Tenant',
		},
	];

	return (
		<DesktopWrapper>
			<MenuSection>
				<SectionTitle>Navigation</SectionTitle>
				<MenuNav>
					{desktopMenuItems
						.filter((item) => item.visible)
						.map((item) => (
							<MenuItem
								key={item.label}
								to={item.path}
								className={isActive(item.path) ? 'active' : ''}>
								{item.label}
							</MenuItem>
						))}
				</MenuNav>
			</MenuSection>
			{/* Bottom Sections */}
			<BottomSections>
				{/* Favorites Section */}
				<Section>
					<SectionTitle>Favorites</SectionTitle>
					<SectionContent>
						{favorites.length > 0 ? (
							<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
								{favorites.slice(0, 5).map((property) => (
									<li
										key={property.id}
										style={{
											padding: '8px 0',
											fontSize: '13px',
											color: '#666666',
											cursor: 'pointer',
											transition: 'color 0.2s ease',
											borderBottom: '1px solid #f0f0f0',
										}}
										onClick={() => navigate(`/property/${property.slug}`)}
										onMouseEnter={(e) =>
											(e.currentTarget.style.color = '#22c55e')
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.color = '#666666')
										}>
										{'★ ' + property.title}
									</li>
								))}
							</ul>
						) : (
							<div style={{ fontSize: '12px', color: '#999999' }}>
								No favorite properties
							</div>
						)}
					</SectionContent>
				</Section>

				{/* Recently Viewed Properties Section */}
				<Section>
					<SectionTitle>Recently Viewed Properties</SectionTitle>
					<SectionContent>
						{recentProperties.length > 0 ? (
							<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
								{recentProperties.slice(0, 5).map((property) => (
									<li
										key={property.id}
										style={{
											padding: '8px 0',
											fontSize: '13px',
											color: '#666666',
											cursor: 'pointer',
											transition: 'color 0.2s ease',
											borderBottom: '1px solid #f0f0f0',
										}}
										onClick={() => navigate(`/property/${property.slug}`)}
										onMouseEnter={(e) =>
											(e.currentTarget.style.color = '#22c55e')
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.color = '#666666')
										}>
										{property.title}
									</li>
								))}
							</ul>
						) : (
							<div style={{ fontSize: '12px', color: '#999999' }}>
								No recently viewed properties
							</div>
						)}
					</SectionContent>
				</Section>

				{/* Features Section */}
				<Section>
					<SectionTitle>Help & Resources</SectionTitle>
					<SectionContent>
						<div
							style={{
								padding: '8px 0',
								fontSize: '13px',
								color: '#666666',
								cursor: 'pointer',
								transition: 'color 0.2s ease',
							}}
							onClick={() => navigate('/features')}
							onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
							onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}>
							📋 View All Features
						</div>
					</SectionContent>
				</Section>
			</BottomSections>
		</DesktopWrapper>
	);
};

export const MobileNav = () => {
	const location = useLocation();
	const dispatch = useDispatch<AppDispatch>();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const activeRoute = useSelector(
		(state: RootState) => state.navigation.activeRoute,
	);

	// Update Redux when location changes
	React.useEffect(() => {
		const hash = location.hash.replace('#', '');
		// Extract the main route (e.g., '/dashboard' from '/dashboard' or '/property/:slug')
		const mainRoute = '/' + hash.split('/')[1];
		dispatch(setActiveRoute(mainRoute));
	}, [location.hash, dispatch]);

	// Check permissions based on subscription plan
	const canAccessTeam = currentUser?.subscription
		? canManageTeam(currentUser.subscription)
		: false;
	const canAccessProperties = currentUser?.subscription
		? currentUser.subscription.plan !== 'free'
		: false;
	const canViewReportsPermission = currentUser?.subscription
		? canAccessReadOnlyFeatures(currentUser.subscription)
		: false;
	const canExportDataPermission = currentUser?.subscription
		? canAccessReadOnlyFeatures(currentUser.subscription)
		: false;
	const canViewPages = currentUser?.subscription
		? currentUser.subscription.plan !== 'free'
		: false;
	const isUserTenant = currentUser ? currentUser.role === 'tenant' : false;
	const isHomeowner = currentUser?.subscription?.plan === 'homeowner';

	const menuItems = [
		{ label: 'Dashboard', path: '/dashboard', visible: !isUserTenant },
		{
			label: 'Properties',
			path: '/properties',
			visible: !isUserTenant && (canAccessProperties || canViewPages),
		},
		{
			label: 'Team',
			path: '/team',
			visible: !isUserTenant && !isHomeowner && (canAccessTeam || canViewPages),
		},
		{
			label: 'Report',
			path: '/report',
			visible: !isUserTenant && (canAccessProperties || canViewPages),
		},
		{
			label: 'Tenant Profile',
			path: '/tenant-profile',
			visible:
				currentUser?.userType === 'tenant' ||
				currentUser?.userType === 'Tenant' ||
				currentUser?.userType === 'Shared Tenant',
		},
	];

	const isActive = (path: string) => activeRoute === path;
	const visibleItems = menuItems.filter((item) => item.visible);

	return (
		<MobileBottomNav>
			{visibleItems.map((item) => (
				<MobileNavItem
					key={item.label}
					to={item.path}
					className={isActive(item.path) ? 'active' : ''}
					title={item.label}>
					{item.label}
				</MobileNavItem>
			))}
		</MobileBottomNav>
	);
};
