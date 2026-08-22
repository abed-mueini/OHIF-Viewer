import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { accountEntryPath, AuthProvider, useAuth } from '../Modules/Auth';
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
import { ProductLayout } from './ProductLayout';
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
        to={accountEntryPath(currentStatus, user?.mobile_number)}
        replace
      />
    );
  }
  return <>{children}</>;
}

function ProductRoutes() {
  const { session, user, loading } = useAuth();
  if (loading) {
    return <PageLoader />;
  }
  const entryPath = session
    ? accountEntryPath(user?.account_status || session.account_status, user?.mobile_number)
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
          <AccountGate statuses={['ACTIVE']}>
            <ProductLayout />
          </AccountGate>
        }
      >
        <Route
          index
          element={<DashboardPage />}
        />
        <Route
          path="profile"
          element={<ProfilePage />}
        />
        <Route
          path="credentials"
          element={<CredentialsPage />}
        />
        <Route
          path="review"
          element={<ReviewPage />}
        />
        <Route
          path="studies"
          element={<StudiesPlaceholderPage />}
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
