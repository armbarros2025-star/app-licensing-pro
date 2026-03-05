
import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { parseISO, isBefore, differenceInDays } from 'date-fns';
import { License, Company, DashboardStats, UserRole, User, Theme, AppNotification } from '../types';

interface AppContextType {
  licenses: License[];
  companies: Company[];
  users: User[];
  notifications: AppNotification[];
  settings: { email: string; whatsapp: string; autoNotify: boolean };
  dismissNotification: (id: string) => void;
  isAuthenticated: boolean;
  userRole: UserRole;
  theme: Theme;
  toggleTheme: () => void;
  addLicense: (license: Omit<License, 'id'>) => void;
  updateLicense: (id: string, license: Partial<License>) => void;
  deleteLicense: (id: string) => void;
  addCompany: (company: Omit<Company, 'id'>) => void;
  updateCompany: (id: string, company: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getStats: () => DashboardStats;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme Management
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('app_theme') as Theme) || 'light');

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('app_auth_token') === 'valid';
  });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('app_user_role') as UserRole) || 'admin';
  });

  const [licenses, setLicenses] = useState<License[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState({ email: '', whatsapp: '', autoNotify: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lRes, cRes, sRes] = await Promise.all([
          fetch('/api/licenses'),
          fetch('/api/companies'),
          fetch('/api/settings')
        ]);
        if (lRes.ok) setLicenses(await lRes.json());
        if (cRes.ok) setCompanies(await cRes.json());
        if (sRes.ok) setSettings(await sRes.json());
      } catch (e) {
        console.error("Error fetching data:", e);
      }
    };
    fetchData();
  }, []);

  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissed_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissedNotifications));
  }, [dismissedNotifications]);

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

  const login = (role: UserRole) => {
    localStorage.setItem('app_auth_token', 'valid');
    localStorage.setItem('app_user_role', role);
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('app_auth_token');
    localStorage.removeItem('app_user_role');
    setIsAuthenticated(false);
  };

  const addLicense = async (data: Omit<License, 'id'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) {
        console.error('[addLicense] Server error:', result.error);
        alert(`Erro ao salvar licença: ${result.error}`);
        return false;
      }
      setLicenses(prev => [...prev, result]);
      return true;
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar licença. Confira o console.');
      return false;
    }
  };

  const updateLicense = async (id: string, data: Partial<License>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/licenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) {
        console.error('[updateLicense] Server error:', result.error);
        alert(`Erro ao atualizar licença: ${result.error}`);
        return false;
      }
      setLicenses(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
      return true;
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao atualizar licença. Confira o console.');
      return false;
    }
  };

  const deleteLicense = async (id: string) => {
    try {
      const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLicenses(prev => prev.filter(l => l.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addCompany = async (data: Omit<Company, 'id'>) => {
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const newC = await res.json();
        setCompanies(prev => [...prev, newC]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateCompany = async (id: string, data: Partial<Company>) => {
    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCompanies(prev => prev.filter(c => c.id !== id));
        setLicenses(prev => prev.filter(l => l.companyId !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addUser = (data: Omit<User, 'id'>) => {
    setUsers(prev => [...prev, { ...data, id: uuidv4() }]);
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
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
    <AppContext.Provider value={{
      licenses, companies, users, notifications, settings, dismissNotification, isAuthenticated, userRole, theme, toggleTheme,
      addLicense, updateLicense, deleteLicense,
      addCompany, updateCompany, deleteCompany,
      addUser, updateUser, deleteUser,
      getStats, login, logout
    }}>
      {children}
    </AppContext.Provider>
  );
};
