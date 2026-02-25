
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
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Sidebar: React.FC = () => {
  const { logout, userRole } = useApp();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', path: '/' },
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
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 transform -rotate-3 hover:rotate-0 transition-all duration-500 cursor-pointer group relative">
          <ShieldCheck className="text-white w-8 h-8" />
          <div className="absolute inset-0 bg-white/20 rounded-2xl scale-0 group-hover:scale-100 transition-transform duration-500"></div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-6 flex flex-col items-center">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 group
              ${isActive
                ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 scale-110'
                : 'text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400'
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

        <div className="space-y-4 w-full flex flex-col items-center">
          <NavLink
            to="/configuracoes"
            className={({ isActive }) => `
              relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 group
              ${isActive
                ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40'
                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
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
            className="relative flex items-center justify-center w-14 h-14 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all duration-500 group"
          >
            <LogOut className="w-6 h-6 group-hover:-translate-x-1 transition-all duration-500" />
            <span className="absolute left-full ml-6 px-4 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-50 shadow-2xl translate-x-[-10px] group-hover:translate-x-0">
              Sair do Sistema
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-rose-600 rotate-45"></div>
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
