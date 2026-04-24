
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  PlusCircle,
  Building2,
  ShieldCheck,
  PieChart,
  Settings,
  LogOut,
  Users,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ArbtechLogo from './ArbtechLogo';
import { assetUrl } from '../utils/assets';

const Sidebar: React.FC = () => {
  const { logout, userRole } = useApp();
  const logoSrc = assetUrl('logo.png');

  const menuItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', path: '/' },
    { icon: RefreshCw, label: 'Centro de Renovação', path: '/renovacoes' },
    { icon: Building2, label: 'Empresas / Unidades', path: '/empresas' },
    { icon: Files, label: 'Licenças e Alvarás', path: '/licencas' },
  ];

  // Only Admin can see "Nova Licença" shortcut and "Usuários"
  if (userRole === 'admin') {
    menuItems.push({ icon: PlusCircle, label: 'Nova Licença', path: '/licencas/nova' });
    menuItems.push({ icon: Users, label: 'Gestão de Usuários', path: '/usuarios' });
  }

  return (
    <aside className="w-24 glass-card border-r-0 h-screen sticky top-0 flex flex-col z-50 transition-all duration-500 rounded-r-[3rem] my-0 shadow-none">
      <div className="py-10 flex flex-col items-center">
        <div className="w-14 flex items-center justify-center cursor-pointer group hover:scale-110 transition-transform duration-500">
          <img src={logoSrc} alt="Arbtech Logo" className="w-full h-auto object-contain drop-shadow-lg" />
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-6 flex flex-col items-center">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            aria-label={item.label}
            title={item.label}
            className={({ isActive }) => `
              relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 group
              ${isActive
                ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 scale-110'
                : 'text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-6 h-6 transition-all duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'}`} />
                <span className="absolute left-full ml-6 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-50 shadow-2xl translate-x-[-10px] group-hover:translate-x-0 border border-white/10">
                  {item.label}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45"></div>
                </span>
                {isActive && (
                  <div className="absolute -left-2 w-1 h-6 bg-white rounded-full"></div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 mt-auto flex flex-col items-center gap-6">
        <div className="group relative">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-800 cursor-help transition-all duration-500 hover:border-indigo-200">
            <PieChart className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="absolute left-full ml-6 bottom-0 p-6 bg-slate-900 dark:bg-slate-800 text-white rounded-[2rem] opacity-0 group-hover:opacity-100 transition-all duration-500 whitespace-nowrap pointer-events-none z-50 shadow-2xl translate-x-[-10px] group-hover:translate-x-0 w-56 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <PieChart className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Enterprise AI</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full mb-3 overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: '65%' }}></div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Monitoramento Ativo 24/7</p>
            <div className="absolute bottom-6 -left-1 w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45"></div>
          </div>
        </div>

        <div className="space-y-4 w-full flex flex-col items-center">
          <NavLink
            to="/configuracoes"
            aria-label="Configurações"
            title="Configurações"
            className={({ isActive }) => `
              relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 group
              ${isActive
                ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40'
                : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              }
            `}
          >
            <Settings className="w-6 h-6 group-hover:rotate-90 transition-all duration-500" />
            <span className="absolute left-full ml-6 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-50 shadow-2xl translate-x-[-10px] group-hover:translate-x-0 border border-white/10">
              Configurações
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45"></div>
            </span>
          </NavLink>

          <button
            onClick={logout}
            aria-label="Sair do sistema"
            title="Sair do sistema"
            className="relative flex items-center justify-center w-14 h-14 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all duration-500 group"
          >
            <LogOut className="w-6 h-6 group-hover:-translate-x-1 transition-all duration-500" />
            <span className="absolute left-full ml-6 px-4 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-50 shadow-2xl translate-x-[-10px] group-hover:translate-x-0">
              Sair do Sistema
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-rose-600 rotate-45"></div>
            </span>
          </button>
        </div>
        <div className="mt-4 mb-2 flex justify-center">
          <ArbtechLogo size={20} showText={false} className="text-slate-400 dark:text-slate-500 opacity-80 hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
