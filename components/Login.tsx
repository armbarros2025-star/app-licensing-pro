
import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

const Login: React.FC = () => {
  const { login, theme, toggleTheme } = useApp();
  const [loading, setLoading] = useState<UserRole | null>(null);

  const handleLogin = (role: UserRole) => {
    setLoading(role);
    setTimeout(() => {
      login(role);
      setLoading(null);
    }, 800);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      
      {/* Botão de Troca de Tema na Tela de Login */}
      <div className="absolute top-8 right-8 z-50">
        <button 
          onClick={toggleTheme} 
          className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:scale-110 transition-all shadow-xl backdrop-blur-md"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
        </button>
      </div>

      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md p-8 relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className={`glass-card ${theme === 'dark' ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white/80 border-slate-200'} border p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-xl transition-all duration-500`}>
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-600/20 transform -rotate-3">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <h1 className={`text-3xl font-black tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Bem-vindo de volta</h1>
            <p className="text-slate-400 font-medium text-sm">Acesse o painel LicensePro Enterprise</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  defaultValue="usuario@empresa.com"
                  readOnly
                  className={`w-full pl-14 pr-6 py-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold cursor-not-allowed opacity-70 ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  defaultValue="12345678"
                  readOnly
                  className={`w-full pl-14 pr-6 py-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold cursor-not-allowed opacity-70 ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                />
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button 
                onClick={() => handleLogin('admin')}
                disabled={!!loading}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading === 'admin' ? 'Entrando...' : <>Entrar como Administrador <ShieldCheck className="w-4 h-4" /></>}
              </button>
              
              <button 
                onClick={() => handleLogin('user')}
                disabled={!!loading}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs border transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                {loading === 'user' ? 'Entrando...' : <>Entrar como Colaborador <User className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-8">
          &copy; 2024 LicensePro Enterprise System
        </p>
      </div>
    </div>
  );
};

export default Login;
