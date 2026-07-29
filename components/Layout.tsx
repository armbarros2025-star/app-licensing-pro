
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, X, AlertTriangle, Clock, ChevronRight, Rocket, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useApp } from '../context/AppContext';
import { format, parseISO } from 'date-fns';
import { assetUrl } from '../utils/assets';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userRole, isClientAccess, notifications, dismissNotification } = useApp();
  const logoSrc = assetUrl('logo_arbtech_yellow.png');
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationCounts = notifications.reduce(
    (acc, notification) => {
      acc[notification.severity] += 1;
      return acc;
    },
    { expired: 0, critical: 0, warning: 0, upcoming: 0 }
  );

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
    <div className="min-h-screen flex bg-[#07162d] text-slate-100">
      <a href="#main-content" className="skip-link">Pular para conteúdo principal</a>
      <Sidebar />
      {mobileNavOpen && <button type="button" aria-label="Fechar menu" className="fixed inset-0 z-50 bg-[#030b18]/70 md:hidden" onClick={() => setMobileNavOpen(false)} />}
      <Sidebar mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-[70px] min-h-[70px] border-b border-[#17345d] bg-[#08182f] flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 rounded-none shadow-none">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setMobileNavOpen(true)} className="-ml-2 grid min-h-11 min-w-11 place-items-center rounded-md text-[#c8d6ed] hover:bg-[#10284d] md:hidden" aria-label="Abrir menu de navegação"><Menu className="h-5 w-5" /></button>
            <div className="md:hidden w-9 flex items-center justify-center">
              <img src={logoSrc} alt="Arbtech Logo" className="w-full h-auto object-contain drop-shadow-sm" />
            </div>
            <div className="hidden md:block">
              <h2 className="text-lg font-bold tracking-[-0.03em] text-white font-display">
                Licensing Pro <span className="ml-3 border-l border-[#24466f] pl-3 text-sm font-medium tracking-normal text-[#91a7cc]">Painel de conformidade</span>
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
                className="relative rounded-lg p-2.5 text-[#9eb3d5] transition-colors hover:bg-[#10284d] hover:text-white group"
              >
                <Bell className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#08182f]"></span>
                )}
              </button>

              {showNotifications && (
                <div
                  id="notifications-panel"
                  role="dialog"
                  aria-label="Central de notificações"
                  className="absolute right-0 mt-4 w-80 sm:w-[450px] rounded-lg border border-[#21436e] bg-[#0a1a34] shadow-3xl z-50 overflow-hidden"
                >
                  <div className="p-5 border-b border-[#17345d] flex items-center justify-between bg-[#0c203e]">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-white">Notificações</h3>
                      <p className="text-xs text-[#9eb3d5] mt-1">Sua central de conformidade</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1.5 bg-[#2859d6] text-white rounded text-[10px] font-bold">
                        {notifications.length} ALERTAS
                      </span>
                      <div className="flex flex-wrap justify-end gap-2">
                        {notificationCounts.expired > 0 && (
                          <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
                            {notificationCounts.expired} vencida(s)
                          </span>
                        )}
                        {notificationCounts.critical > 0 && (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-700 dark:bg-orange-900/30 dark:text-orange-200">
                            {notificationCounts.critical} crítica(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                    <div className="divide-y divide-[#17345d]">
                        {notifications.map((n) => (
                          <div key={n.id} className="p-5 hover:bg-[#0d2447] transition-colors group relative">
                            <div className="flex gap-6">
                              <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                n.severity === 'expired'
                                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                                  : n.severity === 'critical'
                                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20'
                                    : n.severity === 'warning'
                                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'
                                      : 'bg-sky-50 text-sky-600 dark:bg-sky-900/20'
                              }`}>
                                {n.severity === 'expired'
                                  ? <AlertTriangle className="w-7 h-7" />
                                  : n.severity === 'critical'
                                    ? <ShieldAlert className="w-7 h-7" />
                                    : n.severity === 'warning'
                                      ? <Clock className="w-7 h-7" />
                                      : <Rocket className="w-7 h-7" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{n.licenseName}</p>
                                <p className="text-xs text-[#9eb3d5] mt-1 truncate">{n.companyName}</p>
                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                  <span className={`text-[10px] font-semibold px-2 py-1 rounded ${
                                    n.severity === 'expired'
                                      ? 'bg-rose-100 text-rose-600'
                                      : n.severity === 'critical'
                                        ? 'bg-orange-100 text-orange-700'
                                        : n.severity === 'warning'
                                          ? 'bg-amber-100 text-amber-600'
                                          : 'bg-sky-100 text-sky-600'
                                  }`}>
                                    {n.bandLabel}
                                  </span>
                                  <span className="text-[10px] font-semibold px-2 py-1 rounded bg-[#17345d] text-[#c5d5ed]">
                                    {n.actionLabel}
                                  </span>
                                  <span className="text-[10px] font-mono font-semibold text-[#9eb3d5]">
                                    {format(parseISO(n.date), 'dd/MM/yyyy')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                <button
                                  onClick={() => dismissNotification(n.id)}
                                  aria-label={`Dispensar alerta de ${n.licenseName}`}
                                  className="p-2 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <Link
                                  to={`/licencas/editar/${n.licenseId}`}
                                  onClick={() => setShowNotifications(false)}
                                  aria-label={`Abrir licença ${n.licenseName}`}
                                  className="p-2 text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-[#10284d] rounded-full flex items-center justify-center mx-auto mb-5">
                          <Bell className="w-7 h-7 text-[#82abff]" />
                        </div>
                        <p className="text-lg font-semibold text-white">Sem alertas novos</p>
                        <p className="text-xs text-[#9eb3d5] mt-2">Nenhuma pendência regulatória encontrada.</p>
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-4 bg-[#0c203e] border-t border-[#17345d]">
                      <Link
                        to="/licencas"
                        onClick={() => setShowNotifications(false)}
                        className="block w-full py-3 bg-[#2859d6] text-white rounded-lg text-center text-xs font-semibold hover:bg-[#3868e5] transition-colors"
                      >
                        Ver Painel Completo
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="w-px h-8 bg-[#24466f]"></div>
            <div className="flex items-center gap-4 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold leading-none text-white">
                  {isClientAccess ? 'Clientes' : userRole === 'admin' ? 'Administrador' : 'Colaborador'}
                </p>
                <p className="text-[10px] font-semibold text-[#9eb3d5] uppercase mt-1.5 tracking-widest">
                  {isClientAccess ? 'Impressão e download' : userRole === 'admin' ? 'Acesso Total' : 'Visualização'}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full ${userRole === 'admin' ? 'bg-[#2859d6]' : 'bg-emerald-600'} flex items-center justify-center text-white font-bold ring-2 ring-[#3868e5]/40`}>
                {isClientAccess ? 'AC' : userRole === 'admin' ? 'AD' : 'CL'}
              </div>
            </div>
          </div>
        </header>

        <div id="main-content" className="flex-1 overflow-y-auto bg-[#07162d] p-4 md:p-5 lg:p-6 custom-scrollbar relative z-10" tabIndex={-1}>
          <div className="mx-auto w-full max-w-[1360px]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
