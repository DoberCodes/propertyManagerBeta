import React from 'react';
import {
	Route,
	Routes,
	HashRouter as Router,
	Navigate,
} from 'react-router-dom';
import { ErrorPage } from './pages/ErrorPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage/ForgotPasswordPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { ProtectedRoutes } from './ProtectedRoutes';
import { FeatureDocsPage } from './pages/FeatureDocs/FeatureDocsPage';
import LegalPage from './pages/LegalPage/LegalPage';
import { Layout } from './pages/Layout';
import { DashboardTab } from './pages/DashboardTab';
import { TasksPage } from './pages/TasksPage/TasksPage';
import { Properties } from './Components/PropertiesTab';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { UnitDetailPage } from './pages/UnitDetailPage';
import { SuiteDetailPage } from './pages/SuiteDetailPage/SuiteDetailPage';
import TeamPage from './pages/TeamPage';
import { ReportPage } from './pages/ReportPage';
import { UserProfile } from './pages/UserProfile';
import { TenantProfilePage } from './pages/TenantProfilePage';
import { TEAM_VIEW_ROLES, FULL_ACCESS_ROLES } from './constants/roles';
import { isNativeApp } from './utils/platform';
import { useSelector } from 'react-redux';
import {
	selectIsHomeowner,
	selectCanAccessTeam,
} from './Redux/selectors/permissionSelectors';
import PaywallPageIndex from './pages/PaywallPage';
import { MaintenanceHistoryGroupPage } from 'pages/MaintenanceHistoryGroup';
import { SettingsPage } from 'pages/SettingsPage';

// Component to handle root route - redirects to login in mobile app
const RootRoute = () => {
	if (isNativeApp()) {
		return <Navigate to='/login' replace />;
	}
	return <LandingPage />;
};

export const RouterComponent = () => {
	const currentUser = useSelector((state: any) => state.user.currentUser);
	const isUserHomeowner = useSelector(selectIsHomeowner);
	const canAccessTeam = useSelector(selectCanAccessTeam);
	const shouldShowTeamRoute = !!currentUser && canAccessTeam;
	return (
		<Router>
			<Routes>
				{/* Public Routes */}
				<Route path='/' element={<RootRoute />} errorElement={<ErrorPage />} />
				<Route
					path='login'
					element={
						<ProtectedRoutes>
							<LoginPage />
						</ProtectedRoutes>
					}
				/>
				<Route
					path='forgot-password'
					element={
						<ProtectedRoutes>
							<ForgotPasswordPage />
						</ProtectedRoutes>
					}
				/>
				<Route path='registration' element={<RegistrationPage />} />
				<Route path='register' element={<RegistrationPage />} />
				<Route path='unauthorized' element={<UnauthorizedPage />} />
				{/* Paywall - accessible to authenticated users */}
				<Route
					path='paywall'
					element={
						<ProtectedRoutes>
							<PaywallPageIndex />
						</ProtectedRoutes>
					}
				/>
				{/* Feature Docs - public */}
				<Route path='docs' element={<FeatureDocsPage />} />
				<Route path='features' element={<FeatureDocsPage />} />
				{/* Legal Documents - public */}
				<Route path='legal' element={<LegalPage />} />

				{/* Protected Routes with Layout - Dashboard accessible to all authenticated users */}
				<Route
					element={
						<ProtectedRoutes>
							<Layout />
						</ProtectedRoutes>
					}>
					<Route path='dashboard' element={<DashboardTab />} />
					<Route path='tasks' element={<TasksPage />} />

					{/* Properties management - accessible to all authenticated users */}
					<Route
						path='properties'
						element={
							<ProtectedRoutes>
								<Properties />
							</ProtectedRoutes>
						}
					/>
					<Route
						path='property/:slug'
						element={
							<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
								<PropertyDetailPage />
							</ProtectedRoutes>
						}
					/>
					<Route
						path='property/:slug/unit/:unitName'
						element={
							<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
								<UnitDetailPage />
							</ProtectedRoutes>
						}
					/>
					<Route
						path='property/:slug/suite/:suiteName'
						element={
							<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
								<SuiteDetailPage />
							</ProtectedRoutes>
						}
					/>
					<Route
						path='property/:slug/maintenance-history/:groupId'
						element={
							<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
								<MaintenanceHistoryGroupPage />
							</ProtectedRoutes>
						}
					/>
					{shouldShowTeamRoute && (
						<Route
							path='team'
							element={
								<ProtectedRoutes requiredRoles={TEAM_VIEW_ROLES}>
									<TeamPage />
								</ProtectedRoutes>
							}
						/>
					)}

					{/* Reports - accessible to admin, PM, AM, ML with active subscription OR expired users */}
					<Route
						path='report'
						element={
							<ProtectedRoutes
								requiredRoles={FULL_ACCESS_ROLES}
								requireSubscription={true}
								allowExpiredUsers={true}>
								<ReportPage />
							</ProtectedRoutes>
						}
					/>

					{/* Settings - accessible to all authenticated users */}
					<Route path='settings' element={<SettingsPage />} />
					<Route path='features' element={<FeatureDocsPage />} />

					{/* User Profile - accessible to all authenticated users */}
					<Route
						path='profile'
						element={
							<ProtectedRoutes>
								<UserProfile />
							</ProtectedRoutes>
						}
					/>

					{/* Tenant Profile - accessible to tenant users */}
					<Route
						path='tenant-profile'
						element={
							<ProtectedRoutes>
								<TenantProfilePage />
							</ProtectedRoutes>
						}
					/>
				</Route>

				{/* Fallback redirect */}
				<Route path='*' element={<Navigate to='dashboard' replace />} />
			</Routes>
		</Router>
	);
};
