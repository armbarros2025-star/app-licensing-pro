import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, Files, LayoutDashboard, LogOut, PlusCircle, RefreshCw, Settings, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { assetUrl } from '../utils/assets';

const Sidebar: React.FC = () => {
  const { logout, userRole, isClientAccess } = useApp();
  const menuItems = isClientAccess
    ? [{ icon: Files, label: 'Licenças', path: '/licencas' }]
    : [
        ...(userRole === 'admin' ? [{ icon: PlusCircle, label: 'Nova empresa', path: '/empresas/nova' }] : []),
        { icon: Building2, label: 'Empresas e unidades', path: '/empresas' },
        { icon: Files, label: 'Licenças', path: '/licencas' },
        { icon: RefreshCw, label: 'Renovação', path: '/renovacoes' },
        { icon: LayoutDashboard, label: 'Visão geral', path: '/' }
      ];

  if (userRole === 'admin') {
    menuItems.push({ icon: Users, label: 'Usuários', path: '/usuarios' });
  }

  const navClass = (isActive: boolean) => `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
  }`;

  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 px-5 py-5">
        <img src={assetUrl('logo_arbtech_yellow.png')} alt="Arbtech Info" className="h-9 w-9 object-contain" />
        <div>
          <p className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Licensing Pro</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Controle de licenças</p>
        </div>
      </div>

      <nav aria-label="Navegação principal" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return <NavLink key={item.path} to={item.path} className={({ isActive }) => navClass(isActive)}>
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>;
        })}
      </nav>

      <div className="space-y-1 border-t border-slate-200 p-3 dark:border-slate-800">
        {userRole === 'admin' && <NavLink to="/configuracoes" className={({ isActive }) => navClass(isActive)}><Settings className="h-5 w-5 shrink-0" />Configurações</NavLink>}
        <button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30 dark:hover:text-rose-200"><LogOut className="h-5 w-5 shrink-0" />Sair</button>
      </div>
    </aside>
  );
};

export default Sidebar;
