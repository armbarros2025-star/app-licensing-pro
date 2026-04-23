
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Dashboard from './components/Dashboard';
import LicenseList from './components/LicenseList';
import LicenseForm from './components/LicenseForm';
import CompanyList from './components/CompanyList';
import CompanyForm from './components/CompanyForm';
import UserList from './components/UserList';
import UserForm from './components/UserForm';
import Settings from './components/Settings';
import RenewalCenter from './components/RenewalCenter';
import Login from './components/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AppProvider, useApp } from './context/AppContext';
import { FeedbackProvider } from './context/FeedbackContext';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        
        {/* Licenses: List is public, Create/Edit is Admin only */}
        <Route path="/licencas" element={<LicenseList />} />
        <Route path="/renovacoes" element={<RenewalCenter />} />
        
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
        <Route path="/empresas" element={<CompanyList />} />
        
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
    return <Login />;
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
