import React, { useState, useEffect, createContext, useContext, useMemo, useRef, useCallback } from 'react';
import { parseISO, isBefore, differenceInDays } from 'date-fns';
import {
  License,
  Company,
  DashboardStats,
  UserRole,
  User,
  Theme,
  AppNotification,
  CreateUserInput,
  UpdateUserInput,
  LoginResult
} from '../types';
import { useFeedback } from './FeedbackContext';

interface AppContextType {
  licenses: License[];
  companies: Company[];
  users: User[];
  notifications: AppNotification[];
  settings: { email: string; whatsapp: string; autoNotify: boolean };
  isDataLoading: boolean;
  dataError: string | null;
  refreshAppData: () => Promise<void>;
  dismissNotification: (id: string) => void;
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  userRole: UserRole;
  theme: Theme;
  toggleTheme: () => void;
  addLicense: (license: Omit<License, 'id'>) => Promise<boolean>;
  updateLicense: (id: string, license: Partial<License>) => Promise<boolean>;
  deleteLicense: (id: string) => Promise<boolean>;
  addCompany: (company: Omit<Company, 'id'>) => Promise<boolean>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<boolean>;
  deleteCompany: (id: string) => Promise<boolean>;
  addUser: (user: CreateUserInput) => Promise<boolean>;
  updateUser: (id: string, user: UpdateUserInput) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  getStats: () => DashboardStats;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AUTH_TOKEN_KEY = 'app_auth_token';
const DEFAULT_SETTINGS = { email: '', whatsapp: '', autoNotify: false };

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useFeedback();
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('app_theme') as Theme) || 'light');
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem(AUTH_TOKEN_KEY) || '');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole>('user');

  const [licenses, setLicenses] = useState<License[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissed_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const lastUnauthorizedToastRef = useRef<number>(0);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissedNotifications));
  }, [dismissedNotifications]);

  const authHeaders = (tokenOverride?: string): HeadersInit => {
    const token = tokenOverride ?? authToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const clearSession = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuthToken('');
    setIsAuthenticated(false);
    setUserRole('user');
    setUsers([]);
    setLicenses([]);
    setCompanies([]);
    setSettings(DEFAULT_SETTINGS);
    setDataError(null);
    setIsDataLoading(false);
  };

  const notifyError = (title: string, description: string) => {
    showToast({ type: 'error', title, description });
  };

  const handleUnauthorized = (notify = true) => {
    clearSession();
    setIsAuthChecking(false);
    if (!notify) return;

    const now = Date.now();
    if (now - lastUnauthorizedToastRef.current > 5000) {
      showToast({
        type: 'warning',
        title: 'Sessão expirada',
        description: 'Faça login novamente para continuar.'
      });
      lastUnauthorizedToastRef.current = now;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrapAuth = async () => {
      if (!authToken) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setUserRole('user');
          setIsAuthChecking(false);
        }
        return;
      }

      if (!cancelled) setIsAuthChecking(true);

      try {
        const res = await fetch('/api/auth/me', {
          headers: authHeaders(authToken)
        });
        if (!res.ok) {
          if (!cancelled) handleUnauthorized(false);
          return;
        }

        const data = await res.json();
        const role: UserRole = data?.user?.role === 'admin' ? 'admin' : 'user';
        if (!cancelled) {
          setUserRole(role);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('[auth/bootstrap] Error:', e);
        if (!cancelled) handleUnauthorized(false);
      } finally {
        if (!cancelled) setIsAuthChecking(false);
      }
    };

    bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const refreshAppData = useCallback(async () => {
    if (!isAuthenticated || !authToken) return;

    setIsDataLoading(true);
    setDataError(null);

    try {
      const requests = [
        fetch('/api/licenses', { headers: authHeaders() }),
        fetch('/api/companies', { headers: authHeaders() }),
        fetch('/api/settings', { headers: authHeaders() })
      ];

      if (userRole === 'admin') {
        requests.push(fetch('/api/users', { headers: authHeaders() }));
      }

      const responses = await Promise.all(requests);
      if (responses.some(r => r.status === 401)) {
        handleUnauthorized();
        return;
      }

      const [lRes, cRes, sRes, uRes] = responses;
      const failedScopes: string[] = [];

      if (lRes.ok) {
        setLicenses(await lRes.json());
      } else {
        failedScopes.push('licenças');
      }

      if (cRes.ok) {
        setCompanies(await cRes.json());
      } else {
        failedScopes.push('empresas');
      }

      if (sRes.ok) {
        setSettings(await sRes.json());
      } else {
        failedScopes.push('configurações');
      }

      if (userRole === 'admin') {
        if (uRes?.ok) {
          setUsers(await uRes.json());
        } else {
          failedScopes.push('usuários');
        }
      } else {
        setUsers([]);
      }

      if (failedScopes.length > 0) {
        setDataError(`Não foi possível carregar: ${failedScopes.join(', ')}.`);
      }
    } catch (e) {
      console.error('[refreshAppData] Error fetching data:', e);
      setDataError('Erro de conexão ao carregar os dados do sistema.');
    } finally {
      setIsDataLoading(false);
    }
  }, [isAuthenticated, authToken, userRole]);

  useEffect(() => {
    refreshAppData();
  }, [refreshAppData]);

  const notifications = useMemo(() => {
    const today = new Date();
    const list: AppNotification[] = [];

    licenses.forEach(l => {
      const expDate = parseISO(l.expirationDate);
      const days = differenceInDays(expDate, today);
      const company = companies.find(c => c.id === l.companyId);

      if (days <= 30 && !dismissedNotifications.includes(l.id)) {
        list.push({
          id: l.id,
          licenseId: l.id,
          licenseName: l.name,
          companyName: company?.fantasyName || 'Empresa Desconhecida',
          daysRemaining: days,
          type: days < 0 ? 'expired' : 'warning',
          date: l.expirationDate
        });
      }
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [licenses, companies, dismissedNotifications]);

  const dismissNotification = (id: string) => {
    setDismissedNotifications(prev => [...prev, id]);
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data?.token || !data?.user) {
        const message = data?.error || 'Credenciais inválidas ou usuário inativo.';
        console.error('[login] Error:', message);
        return {
          ok: false,
          message,
          retryAfterSeconds: data?.retryAfterSeconds,
          lockedUntil: data?.lockedUntil
        };
      }

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setAuthToken(data.token);
      setUserRole(data.user.role === 'admin' ? 'admin' : 'user');
      setIsAuthenticated(true);
      return { ok: true };
    } catch (e) {
      console.error('[login] Connection error:', e);
      return {
        ok: false,
        message: 'Não foi possível conectar. Verifique sua conexão e tente novamente.'
      };
    }
  };

  const logout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: authHeaders()
        });
      }
    } catch (e) {
      console.error('[logout] Error:', e);
    } finally {
      clearSession();
      setIsAuthChecking(false);
    }
  };

  const addLicense = async (data: Omit<License, 'id'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (!res.ok) {
        console.error('[addLicense] Server error:', result.error);
        notifyError('Erro ao salvar licença', result?.error || 'Tente novamente em instantes.');
        return false;
      }
      setLicenses(prev => [...prev, result]);
      return true;
    } catch (e) {
      console.error(e);
      notifyError('Erro de conexão', 'Não foi possível salvar a licença.');
      return false;
    }
  };

  const updateLicense = async (id: string, data: Partial<License>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/licenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (!res.ok) {
        console.error('[updateLicense] Server error:', result.error);
        notifyError('Erro ao atualizar licença', result?.error || 'Tente novamente em instantes.');
        return false;
      }
      setLicenses(prev => prev.map(l => (l.id === id ? { ...l, ...data } : l)));
      return true;
    } catch (e) {
      console.error(e);
      notifyError('Erro de conexão', 'Não foi possível atualizar a licença.');
      return false;
    }
  };

  const deleteLicense = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/licenses/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        notifyError('Erro ao excluir licença', result?.error || 'Não foi possível excluir este registro.');
        return false;
      }
      setLicenses(prev => prev.filter(l => l.id !== id));
      return true;
    } catch (e) {
      console.error(e);
      notifyError('Erro de conexão', 'Não foi possível excluir a licença.');
      return false;
    }
  };

  const addCompany = async (data: Omit<Company, 'id'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        notifyError('Erro ao cadastrar empresa', result?.error || 'Revise os dados e tente novamente.');
        return false;
      }
      const newCompany = await res.json();
      setCompanies(prev => [...prev, newCompany]);
      return true;
    } catch (e) {
      console.error(e);
      notifyError('Erro de conexão', 'Não foi possível cadastrar a empresa.');
      return false;
    }
  };

  const updateCompany = async (id: string, data: Partial<Company>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        notifyError('Erro ao atualizar empresa', result?.error || 'Não foi possível salvar as alterações.');
        return false;
      }
      setCompanies(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
      return true;
    } catch (e) {
      console.error(e);
      notifyError('Erro de conexão', 'Não foi possível atualizar a empresa.');
      return false;
    }
  };

  const deleteCompany = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        notifyError('Erro ao excluir empresa', result?.error || 'Não foi possível excluir a empresa.');
        return false;
      }
      setCompanies(prev => prev.filter(c => c.id !== id));
      setLicenses(prev => prev.filter(l => l.companyId !== id));
      return true;
    } catch (e) {
      console.error(e);
      notifyError('Erro de conexão', 'Não foi possível excluir a empresa.');
      return false;
    }
  };

  const addUser = async (data: CreateUserInput): Promise<boolean> => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (!res.ok) {
        notifyError('Erro ao criar usuário', result?.error || 'Revise os dados e tente novamente.');
        return false;
      }
      setUsers(prev => [...prev, result]);
      return true;
    } catch (e) {
      console.error(e);
      notifyError('Erro de conexão', 'Não foi possível criar o usuário.');
      return false;
    }
  };

  const updateUser = async (id: string, data: UpdateUserInput): Promise<boolean> => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (!res.ok) {
        notifyError('Erro ao atualizar usuário', result?.error || 'Não foi possível salvar as alterações.');
        return false;
      }
      setUsers(prev => prev.map(u => (u.id === id ? result : u)));
      return true;
    } catch (e) {
      console.error(e);
      notifyError('Erro de conexão', 'Não foi possível atualizar o usuário.');
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const result = await res.json();
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (!res.ok) {
        notifyError('Erro ao excluir usuário', result?.error || 'Não foi possível remover este usuário.');
        return false;
      }
      setUsers(prev => prev.filter(u => u.id !== id));
      return true;
    } catch (e) {
      console.error(e);
      notifyError('Erro de conexão', 'Não foi possível excluir o usuário.');
      return false;
    }
  };

  const getStats = (): DashboardStats => {
    const today = new Date();
    const stats = { expired: 0, warning: 0, active: 0, total: licenses.length, companiesCount: companies.length };

    licenses.forEach(l => {
      const expDate = parseISO(l.expirationDate);
      if (isBefore(expDate, today)) {
        stats.expired++;
      } else if (differenceInDays(expDate, today) < 30) {
        stats.warning++;
      } else {
        stats.active++;
      }
    });

    return stats;
  };

  return (
    <AppContext.Provider
      value={{
        licenses,
        companies,
        users,
        notifications,
        settings,
        isDataLoading,
        dataError,
        refreshAppData,
        dismissNotification,
        isAuthenticated,
        isAuthChecking,
        userRole,
        theme,
        toggleTheme,
        addLicense,
        updateLicense,
        deleteLicense,
        addCompany,
        updateCompany,
        deleteCompany,
        addUser,
        updateUser,
        deleteUser,
        getStats,
        login,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
