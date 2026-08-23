import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';

import { accountEntryPath, AuthProvider, useAuth } from '../Modules/Auth';
import { AdminDashboardPage, AdminProfilePage } from '../Modules/Admin';
import { ForgotPasswordPage, LoginPage, RegisterPage, VerificationPage } from '../Modules/Auth';
import {
  CredentialsPage,
  DashboardPage,
  OnboardingFlowPage,
  PendingReviewPage,
  ProfilePage,
  ReviewPage,
  StudiesPlaceholderPage,
} from '../Modules/Onboarding';
import type { AccountStatusEnum } from '../api/generated/model';
import { QueryProvider } from '../lib/query/QueryProvider';
import { PageLoader } from '../SharedComponents';
import { WorkspaceLayout } from './WorkspaceLayout';
import '../telepacs.css';
import '../telepacs-v2.css';

function AccountGate({
  statuses,
  children,
}: {
  statuses: AccountStatusEnum[];
  children: React.ReactNode;
}) {
  const { session, user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div
        className="tp-root"
        dir="rtl"
      >
        <PageLoader />
      </div>
    );
  if (!session)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  const currentStatus = user?.account_status || session.account_status;
  if (!statuses.includes(currentStatus)) {
    return (
      <Navigate
        to={accountEntryPath(currentStatus, user?.mobile_number, user?.is_staff)}
        replace
      />
    );
  }
  return <>{children}</>;
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const { session, user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  if (!user?.is_staff) {
    return (
      <Navigate
        to={accountEntryPath(
          user?.account_status || session.account_status,
          user?.mobile_number,
          session.is_staff
        )}
        replace
      />
    );
  }
  return <>{children}</>;
}

function LegacyAdminRequestRedirect() {
  const { requestId } = useParams<{ requestId: string }>();
  return (
    <Navigate
      to={requestId ? `/admin/requests/${requestId}` : '/admin'}
      replace
    />
  );
}

function ProductRoutes() {
  const { session, user, loading } = useAuth();
  if (loading) {
    return <PageLoader />;
  }
  const entryPath = session
    ? accountEntryPath(
        user?.account_status || session.account_status,
        user?.mobile_number,
        user?.is_staff || session.is_staff
      )
    : '/login';
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={entryPath}
            replace
          />
        }
      />
      <Route
        path="/login"
        element={<LoginPage />}
      />
      <Route
        path="/register"
        element={<RegisterPage />}
      />
      <Route
        path="/verify"
        element={<VerificationPage />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />
      <Route
        path="/admin"
        element={
          <AdminGate>
            <WorkspaceLayout />
          </AdminGate>
        }
      >
        <Route
          index
          element={<AdminDashboardPage />}
        />
        <Route
          path="requests/:requestId"
          element={<AdminDashboardPage />}
        />
        <Route
          path="profile"
          element={<AdminProfilePage />}
        />
        <Route
          path="applications/:requestId"
          element={<LegacyAdminRequestRedirect />}
        />
      </Route>
      <Route
        path="/onboarding"
        element={
          <AccountGate statuses={['ONBOARDING', 'PENDING_REVIEW']}>
            <OnboardingFlowPage />
          </AccountGate>
        }
      />
      <Route
        path="/reviewing"
        element={
          <AccountGate statuses={['PENDING_REVIEW']}>
            <PendingReviewPage />
          </AccountGate>
        }
      />
      <Route
        path="/app"
        element={
          <AccountGate statuses={['ACTIVE', 'ONBOARDING', 'REJECTED']}>
            <WorkspaceLayout />
          </AccountGate>
        }
      >
        <Route
          index
          element={
            <AccountGate statuses={['ACTIVE']}>
              <DashboardPage />
            </AccountGate>
          }
        />
        <Route
          path="profile"
          element={
            <AccountGate statuses={['ACTIVE', 'ONBOARDING', 'REJECTED']}>
              <ProfilePage />
            </AccountGate>
          }
        />
        <Route
          path="credentials"
          element={
            <AccountGate statuses={['ACTIVE', 'ONBOARDING', 'REJECTED']}>
              <CredentialsPage />
            </AccountGate>
          }
        />
        <Route
          path="review"
          element={
            <AccountGate statuses={['ACTIVE', 'ONBOARDING', 'REJECTED']}>
              <ReviewPage />
            </AccountGate>
          }
        />
        <Route
          path="studies"
          element={
            <AccountGate statuses={['ACTIVE']}>
              <StudiesPlaceholderPage />
            </AccountGate>
          }
        />
      </Route>
      <Route
        path="*"
        element={
          <Navigate
            to={entryPath}
            replace
          />
        }
      />
    </Routes>
  );
}

export default function TelePACSApp() {
  useEffect(() => {
    document.body.classList.add('telepacs-product');
    document.documentElement.lang = 'fa';
    document.documentElement.dir = 'rtl';
    return () => {
      document.body.classList.remove('telepacs-product');
      document.documentElement.dir = 'ltr';
    };
  }, []);

  return (
    <div className="tp-root">
      <QueryProvider>
        <AuthProvider>
          <ProductRoutes />
        </AuthProvider>
      </QueryProvider>
    </div>
  );
}
