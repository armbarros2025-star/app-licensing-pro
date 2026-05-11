
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AppProvider, useApp } from './context/AppContext';
import { FeedbackProvider } from './context/FeedbackContext';

const Dashboard = lazy(() => import('./components/Dashboard'));
const LicenseList = lazy(() => import('./components/LicenseList'));
const LicenseForm = lazy(() => import('./components/LicenseForm'));
const CompanyList = lazy(() => import('./components/CompanyList'));
const CompanyForm = lazy(() => import('./components/CompanyForm'));
const UserList = lazy(() => import('./components/UserList'));
const UserForm = lazy(() => import('./components/UserForm'));
const Settings = lazy(() => import('./components/Settings'));
const RenewalCenter = lazy(() => import('./components/RenewalCenter'));
const Login = lazy(() => import('./components/Login'));

const RouteFallback: React.FC = () => (
  <div className="flex min-h-[320px] items-center justify-center">
    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Carregando módulo...</p>
  </div>
);

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const { isClientAccess } = useApp();
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location}>
          <Route path="/" element={isClientAccess ? <Navigate to="/licencas" replace /> : <Dashboard />} />
          
          {/* Licenses: List is public, Create/Edit is Admin only */}
          <Route path="/licencas" element={<LicenseList />} />
          <Route path="/renovacoes" element={isClientAccess ? <Navigate to="/licencas" replace /> : <RenewalCenter />} />
          
          <Route path="/licencas/nova" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <LicenseForm />
            </ProtectedRoute>
          } />
          
          <Route path="/licencas/editar/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'user']}>
              <LicenseForm />
            </ProtectedRoute>
          } />
          
          {/* Companies: List is public, Create/Edit is Admin only */}
          <Route path="/empresas" element={isClientAccess ? <Navigate to="/licencas" replace /> : <CompanyList />} />
          
          <Route path="/empresas/nova" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CompanyForm />
            </ProtectedRoute>
          } />
          
          <Route path="/empresas/editar/:id" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CompanyForm />
            </ProtectedRoute>
          } />

          {/* User Management: Strictly Admin Only */}
          <Route path="/usuarios" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserList />
            </ProtectedRoute>
          } />
          
          <Route path="/usuarios/nova" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserForm />
            </ProtectedRoute>
          } />
          
          <Route path="/usuarios/editar/:id" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserForm />
            </ProtectedRoute>
          } />

          <Route path="/configuracoes" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isAuthChecking } = useApp();

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Verificando sessão...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Login />
      </Suspense>
    );
  }

  return (
    <Layout>
      <AnimatedRoutes />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <FeedbackProvider>
      <AppProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AppProvider>
    </FeedbackProvider>
  );
};

export default App;
