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
  LoginResult,
  TelecomExpense
} from '../types';
import { useFeedback } from './FeedbackContext';
import { apiFetch } from '../utils/api';

interface AppContextType {
  licenses: License[];
  telecomExpenses: TelecomExpense[];
  companies: Company[];
  users: User[];
  currentUser: User | null;
  authToken: string;
  notifications: AppNotification[];
  settings: { email: string; whatsapp: string; autoNotify: boolean };
  isDataLoading: boolean;
  dataError: string | null;
  refreshAppData: () => Promise<void>;
  dismissNotification: (id: string) => void;
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  userRole: UserRole;
  isClientAccess: boolean;
  theme: Theme;
  toggleTheme: () => void;
  addLicense: (license: Omit<License, 'id'>) => Promise<boolean>;
  updateLicense: (id: string, license: Partial<License>) => Promise<boolean>;
  deleteLicense: (id: string) => Promise<boolean>;
  addTelecomExpense: (expense: Omit<TelecomExpense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateTelecomExpense: (id: string, expense: Partial<TelecomExpense>) => Promise<boolean>;
  deleteTelecomExpense: (id: string) => Promise<boolean>;
  addCompany: (company: Omit<Company, 'id'>) => Promise<boolean>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<boolean>;
  deleteCompany: (id: string) => Promise<boolean>;
  addUser: (user: CreateUserInput) => Promise<boolean>;
  updateUser: (id: string, user: UpdateUserInput) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  getStats: () => DashboardStats;
  login: (email: string, password: string) => Promise<LoginResult>;
  loginClientAccess: () => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const DEFAULT_SETTINGS = { email: '', whatsapp: '', autoNotify: false };
const NOTIFICATION_DISMISS_DAYS = 90;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useFeedback();
  const [theme, setTheme] = useState<Theme>('dark');
  // A autenticação é mantida apenas em memória. Reabrir ou recarregar o endereço
  // exige um novo login, sem deixar um token reutilizável no navegador.
  const [authToken, setAuthToken] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isClientAccess, setIsClientAccess] = useState(false);

  const [licenses, setLicenses] = useState<License[]>([]);
  const [telecomExpenses, setTelecomExpenses] = useState<TelecomExpense[]>([]);
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
  const lastAutoNotifyDigestRef = useRef<string>('');

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissedNotifications));
  }, [dismissedNotifications]);

  useEffect(() => {
    // Remove sessões persistidas por versões anteriores do aplicativo.
    localStorage.removeItem('app_auth_token');
  }, []);

  const authHeaders = (tokenOverride?: string): HeadersInit => {
    const token = tokenOverride ?? authToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const clearSession = () => {
    setAuthToken('');
    setIsAuthenticated(false);
    setUserRole('user');
    setIsClientAccess(false);
    setCurrentUser(null);
    setUsers([]);
    setLicenses([]);
    setTelecomExpenses([]);
    setCompanies([]);
    setSettings(DEFAULT_SETTINGS);
    setDataError(null);
    setIsDataLoading(false);
    lastAutoNotifyDigestRef.current = '';
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
          setIsClientAccess(false);
          setCurrentUser(null);
          setIsAuthChecking(false);
        }
        return;
      }

      if (!cancelled) setIsAuthChecking(true);

      try {
        const res = await apiFetch('/api/auth/me', {
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
          setIsClientAccess(Boolean(data?.user?.isClientAccess));
          setCurrentUser(data?.user || null);
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
        apiFetch('/api/licenses', { headers: authHeaders() }),
        apiFetch('/api/companies', { headers: authHeaders() })
      ];

      if (!isClientAccess) {
        requests.push(apiFetch('/api/settings', { headers: authHeaders() }));
        requests.push(apiFetch('/api/telecom-expenses', { headers: authHeaders() }));
      }

      if (userRole === 'admin') {
        requests.push(apiFetch('/api/users', { headers: authHeaders() }));
      }

      const responses = await Promise.all(requests);
      if (responses.some(r => r.status === 401)) {
        handleUnauthorized();
        return;
      }

      const [lRes, cRes] = responses;
      const sRes = isClientAccess ? null : responses[2];
      const eRes = isClientAccess ? null : responses[3];
      const uRes = userRole === 'admin' ? responses[isClientAccess ? 2 : 4] : null;
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

      if (sRes?.ok) {
        setSettings(await sRes.json());
      } else if (!isClientAccess) {
        failedScopes.push('configurações');
      } else {
        setSettings(DEFAULT_SETTINGS);
      }

      if (eRes?.ok) {
        setTelecomExpenses(await eRes.json());
      } else if (!isClientAccess) {
        failedScopes.push('despesas');
      } else {
        setTelecomExpenses([]);
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
  }, [isAuthenticated, authToken, userRole, isClientAccess]);

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

      if (days > NOTIFICATION_DISMISS_DAYS || dismissedNotifications.includes(l.id)) {
        return;
      }

      let severity: AppNotification['severity'] = 'upcoming';
      let bandLabel = 'Planejamento';
      let priority = 3;
      let actionLabel = 'Planejar acompanhamento';

      if (days < 0) {
        severity = 'expired';
        bandLabel = 'Vencida';
        priority = 0;
        actionLabel = 'Resolver agora';
      } else if (days <= 7) {
        severity = 'critical';
        bandLabel = 'Crítica';
        priority = 1;
        actionLabel = 'Tratar hoje';
      } else if (days <= 30) {
        severity = 'warning';
        bandLabel = 'Atenção';
        priority = 2;
        actionLabel = 'Programar renovação';
      } else {
        severity = 'upcoming';
        bandLabel = 'Próxima';
        priority = 3;
        actionLabel = 'Monitorar';
      }

      list.push({
        id: l.id,
        licenseId: l.id,
        licenseName: l.name,
        companyName: company?.fantasyName || 'Empresa Desconhecida',
        daysRemaining: days,
        severity,
        priority,
        bandLabel,
        actionLabel,
        date: l.expirationDate
      });
    });

    return list.sort((a, b) => a.priority - b.priority || a.daysRemaining - b.daysRemaining);
  }, [licenses, companies, dismissedNotifications]);

  useEffect(() => {
    if (!settings.autoNotify) {
      lastAutoNotifyDigestRef.current = '';
      return;
    }

    if (notifications.length === 0) return;

    const counts = notifications.reduce(
      (acc, notification) => {
        acc[notification.severity] += 1;
        return acc;
      },
      { expired: 0, critical: 0, warning: 0, upcoming: 0 }
    );

    const digest = [
      counts.expired,
      counts.critical,
      counts.warning,
      counts.upcoming,
      notifications.length
    ].join(':');

    if (digest === lastAutoNotifyDigestRef.current) return;
    lastAutoNotifyDigestRef.current = digest;

    const summary = [
      counts.expired > 0 ? `${counts.expired} vencida(s)` : null,
      counts.critical > 0 ? `${counts.critical} crítica(s)` : null,
      counts.warning > 0 ? `${counts.warning} em atenção` : null,
      counts.upcoming > 0 ? `${counts.upcoming} futuras` : null
    ].filter(Boolean).join(', ');

    showToast({
      type: counts.expired > 0 ? 'error' : counts.critical > 0 ? 'warning' : 'info',
      title: 'Alertas automáticos atualizados',
      description: summary || 'Nenhuma pendência prioritária encontrada.'
    });
  }, [notifications, settings.autoNotify, showToast]);

  const dismissNotification = (id: string) => {
    setDismissedNotifications(prev => [...prev, id]);
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await apiFetch('/api/auth/login', {
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

      setAuthToken(data.token);
      setUserRole(data.user.role === 'admin' ? 'admin' : 'user');
      setIsClientAccess(false);
      setCurrentUser(data.user);
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

  const loginClientAccess = async (): Promise<LoginResult> => {
    try {
      const res = await apiFetch('/api/auth/client-access', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok || !data?.token || !data?.user?.isClientAccess) {
        return {
          ok: false,
          message: data?.error || 'Não foi possível liberar o acesso para impressão e download.',
          retryAfterSeconds: data?.retryAfterSeconds
        };
      }

      setAuthToken(data.token);
      setUserRole('user');
      setIsClientAccess(true);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      return { ok: true };
    } catch (e) {
      console.error('[client-access] Connection error:', e);
      return {
        ok: false,
        message: 'Não foi possível conectar. Verifique sua conexão e tente novamente.'
      };
    }
  };

  const logout = async () => {
    try {
      if (authToken) {
        await apiFetch('/api/auth/logout', {
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
      const res = await apiFetch('/api/licenses', {
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
      const res = await apiFetch(`/api/licenses/${id}`, {
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
      const res = await apiFetch(`/api/licenses/${id}`, {
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

  const addTelecomExpense = async (data: Omit<TelecomExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/telecom-expenses', {
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
        notifyError('Erro ao cadastrar despesa', result?.error || 'Revise os dados e tente novamente.');
        return false;
      }
      setTelecomExpenses(prev => [...prev, result]);
      return true;
    } catch (error) {
      console.error(error);
      notifyError('Erro de conexão', 'Não foi possível cadastrar a despesa.');
      return false;
    }
  };

  const updateTelecomExpense = async (id: string, data: Partial<TelecomExpense>): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/telecom-expenses/${id}`, {
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
        notifyError('Erro ao atualizar despesa', result?.error || 'Não foi possível salvar as alterações.');
        return false;
      }
      setTelecomExpenses(prev => prev.map(expense => expense.id === id ? result : expense));
      return true;
    } catch (error) {
      console.error(error);
      notifyError('Erro de conexão', 'Não foi possível atualizar a despesa.');
      return false;
    }
  };

  const deleteTelecomExpense = async (id: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/telecom-expenses/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        notifyError('Erro ao excluir despesa', result?.error || 'Não foi possível excluir este registro.');
        return false;
      }
      setTelecomExpenses(prev => prev.filter(expense => expense.id !== id));
      return true;
    } catch (error) {
      console.error(error);
      notifyError('Erro de conexão', 'Não foi possível excluir a despesa.');
      return false;
    }
  };

  const addCompany = async (data: Omit<Company, 'id'>): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/companies', {
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
      const res = await apiFetch(`/api/companies/${id}`, {
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
      const res = await apiFetch(`/api/companies/${id}`, {
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
      const res = await apiFetch('/api/users', {
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
      const res = await apiFetch(`/api/users/${id}`, {
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
      const res = await apiFetch(`/api/users/${id}`, {
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
        telecomExpenses,
        companies,
        users,
        authToken,
        notifications,
        settings,
        isDataLoading,
        dataError,
        refreshAppData,
        dismissNotification,
        isAuthenticated,
        isAuthChecking,
        userRole,
        isClientAccess,
        currentUser,
        theme,
        toggleTheme,
        addLicense,
        updateLicense,
        deleteLicense,
        addTelecomExpense,
        updateTelecomExpense,
        deleteTelecomExpense,
        addCompany,
        updateCompany,
        deleteCompany,
        addUser,
        updateUser,
        deleteUser,
        getStats,
        login,
        loginClientAccess,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
