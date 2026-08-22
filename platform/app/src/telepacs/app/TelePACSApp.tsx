import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from '../Modules/Auth';
import { ForgotPasswordPage, LoginPage, RegisterPage, VerificationPage } from '../Modules/Auth';
import {
  CredentialsPage,
  DashboardPage,
  ProfilePage,
  ReviewPage,
  StudiesPlaceholderPage,
} from '../Modules/Onboarding';
import { QueryProvider } from '../lib/query/QueryProvider';
import { PageLoader, ProductLayout } from '../SharedComponents';
import '../telepacs.css';

function ProtectedProduct() {
  const { session, loading } = useAuth();
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
  return <ProductLayout />;
}

function ProductRoutes() {
  const { session } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={session ? '/app' : '/login'}
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
        path="/app"
        element={<ProtectedProduct />}
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
            to={session ? '/app' : '/login'}
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
