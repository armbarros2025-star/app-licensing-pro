
import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Bell, X, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useApp } from '../context/AppContext';
import { format, parseISO } from 'date-fns';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userRole, theme, toggleTheme, notifications, dismissNotification } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <div className={`min-h-screen flex transition-all duration-700 ease-in-out ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <a href="#main-content" className="skip-link">Pular para conteúdo principal</a>
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <header className="h-20 glass-card border-t-0 border-x-0 border-b border-white/10 dark:border-white/5 flex items-center justify-between px-10 backdrop-blur-2xl sticky top-0 z-40 rounded-none shadow-none">
          <div className="flex items-center gap-4">
            <div className="md:hidden w-10 flex items-center justify-center">
              <img src="/logo.png" alt="Arbtech Logo" className="w-full h-auto object-contain drop-shadow-sm" />
            </div>
            <div className="hidden md:block">
              <h2 className="text-xl font-black tracking-tighter text-slate-800 dark:text-slate-100 font-display">
                License<span className="text-indigo-600">Pro</span> <span className="text-xs font-bold text-slate-400 ml-2 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">Enterprise</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Abrir notificações"
                aria-haspopup="dialog"
                aria-expanded={showNotifications}
                aria-controls="notifications-panel"
                className="relative p-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 group"
              >
                <Bell className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div
                  id="notifications-panel"
                  role="dialog"
                  aria-label="Central de notificações"
                  className="absolute right-0 mt-4 w-80 sm:w-[450px] glass-card rounded-[2.5rem] shadow-3xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300 border-white/20 dark:border-slate-800"
                >
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">Notificações</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sua central de conformidade</p>
                    </div>
                    <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-indigo-600/20">
                      {notifications.length} ALERTAS
                    </span>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {notifications.map((n) => (
                          <div key={n.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group relative">
                            <div className="flex gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${n.type === 'expired' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'}`}>
                                {n.type === 'expired' ? <AlertTriangle className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{n.licenseName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">{n.companyName}</p>
                                <div className="flex items-center gap-3 mt-3">
                                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${n.type === 'expired' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {n.daysRemaining < 0
                                      ? `Expirado`
                                      : `Expira em ${n.daysRemaining} dias`}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-slate-400">
                                    {format(parseISO(n.date), 'dd/MM/yyyy')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => dismissNotification(n.id)}
                                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <Link
                                  to={`/licencas/editar/${n.licenseId}`}
                                  onClick={() => setShowNotifications(false)}
                                  className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-20 text-center">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Bell className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                        </div>
                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">Silêncio Absoluto</p>
                        <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-widest">Nenhuma pendência regulatória encontrada.</p>
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        to="/licencas"
                        onClick={() => setShowNotifications(false)}
                        className="block w-full py-4 bg-indigo-600 text-white rounded-2xl text-center text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
                      >
                        Ver Painel Completo
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
              className="p-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
            >
              {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6 text-amber-400" />}
            </button>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex items-center gap-4 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black leading-none text-slate-800 dark:text-slate-100">{userRole === 'admin' ? 'Administrador' : 'Colaborador'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 tracking-widest">
                  {userRole === 'admin' ? 'Acesso Total' : 'Visualização'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${userRole === 'admin' ? 'from-indigo-500 to-purple-600' : 'from-emerald-500 to-teal-600'} flex items-center justify-center text-white font-black ring-4 ring-indigo-500/10 shadow-lg`}>
                {userRole === 'admin' ? 'AD' : 'CL'}
              </div>
            </div>
          </div>
        </header>

        <div id="main-content" className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar relative z-10" tabIndex={-1}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
