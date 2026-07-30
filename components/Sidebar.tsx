import React from 'react';
import { NavLink } from '../utils/router';
import { Building2, Files, LayoutDashboard, LogOut, PlusCircle, RefreshCw, Settings, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { assetUrl } from '../utils/assets';

interface SidebarProps {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onNavigate }) => {
  const { logout, userRole, isClientAccess } = useApp();
  const isMobileNavigation = typeof onNavigate === 'function';
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

  const navClass = (isActive: boolean) => `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-[#173c91] text-white'
      : 'text-[#b9c9e3] hover:bg-[#10284d] hover:text-white'
  }`;

  return (
    <aside className={`${isMobileNavigation
      ? mobileOpen
        ? 'fixed inset-y-0 left-0 z-[60] flex w-72 shadow-2xl md:hidden'
        : 'hidden'
      : 'hidden h-screen w-60 shrink-0 md:flex'
    } flex-col border-r border-[#17345d] bg-[#08182f]`}>
      <div className="flex items-center gap-3 border-b border-[#17345d] px-5 py-5">
        <img src={assetUrl('logo_arbtech_yellow.png')} alt="Arbtech Info" className="h-9 w-9 object-contain" />
        <div>
          <p className="text-base font-semibold tracking-tight text-white">Licensing Pro</p>
          <p className="text-xs text-[#94a9cc]">Controle de licenças</p>
        </div>
      </div>

      <nav aria-label="Navegação principal" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={onNavigate} className={({ isActive }) => navClass(isActive)}>
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>;
        })}
      </nav>

      <div className="space-y-1 border-t border-[#17345d] p-3">
        {userRole === 'admin' && <NavLink to="/configuracoes" onClick={onNavigate} className={({ isActive }) => navClass(isActive)}><Settings className="h-5 w-5 shrink-0" />Configurações</NavLink>}
        <button type="button" onClick={() => { onNavigate?.(); logout(); }} className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-rose-300 transition-colors hover:bg-rose-950/30 hover:text-rose-200"><LogOut className="h-5 w-5 shrink-0" />Sair</button>
      </div>
    </aside>
  );
};

export default Sidebar;
