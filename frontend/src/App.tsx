import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { DashboardConfigProvider } from './contexts/DashboardConfigContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import ErrorBoundary from './components/ErrorBoundary';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import RequestUserPage from './pages/RequestUserPage';
import AdminRequestsPage from './pages/AdminRequestsPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import SuppliersPage from './pages/SuppliersPage';
import ImportPage from './pages/ImportPage';
import ReportsPage from './pages/ReportsPage';
import TeamPage from './pages/TeamPage';
import ProfilePage from './pages/ProfilePage';

// La landing va en su propio chunk: trae anime.js y los mockups, que la app no necesita.
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));

const PrivateRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean; requireOwner?: boolean }> = ({
  children,
  requireAdmin = false,
  requireOwner = false,
}) => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">{t('Cargando...', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireOwner && user.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  // El banner de licencia lo muestra Layout, dentro de la cabecera fija.
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <LoginPage />}
      />
      <Route
        path="/request-user"
        element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <RequestUserPage />}
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute requireAdmin>
            <AdminRequestsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <PrivateRoute>
            <ClientsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/products"
        element={
          <PrivateRoute>
            <ProductsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <PrivateRoute>
            <SalesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/suppliers"
        element={
          <PrivateRoute>
            <SuppliersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/import"
        element={
          <PrivateRoute>
            <ImportPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <ReportsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/team"
        element={
          <PrivateRoute requireOwner>
            <TeamPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      {/* Con sesión se va directo a la app; sin sesión se ve la landing pública.
          Mientras AuthProvider lee el storage no se renderiza nada, para no
          mostrar un parpadeo de la landing a quien ya está logueado. */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
          ) : loading ? null : (
            <Suspense fallback={null}>
              <LandingPage />
            </Suspense>
          )
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <Router>
          <ThemeProvider>
            <ToastProvider>
              <ConfirmProvider>
                <CurrencyProvider>
                  <AuthProvider>
                    <DashboardConfigProvider>
                      <AppRoutes />
                    </DashboardConfigProvider>
                  </AuthProvider>
                </CurrencyProvider>
              </ConfirmProvider>
            </ToastProvider>
          </ThemeProvider>
        </Router>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;

