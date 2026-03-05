
import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import ArbtechLogo from './ArbtechLogo';

const Login: React.FC = () => {
  const { login, theme, toggleTheme } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<UserRole | null>(null);
  const [error, setError] = useState('');

  const handleLogin = (role: UserRole) => {
    setError('');
    if (role === 'admin') {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      if (trimmedEmail !== 'armando@arbtechinfo.com.br' || trimmedPassword !== '49371028') {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.');
        return;
      }
    }

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
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="Arbtech Logo" className="h-20 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
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
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="seuemail@empresa.com.br"
                  autoComplete="off"
                  name="licensing-email"
                  className={`w-full pl-14 pr-6 py-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-300'}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  name="licensing-password"
                  className={`w-full pl-14 pr-6 py-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-300'}`}
                />
              </div>
            </div>
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
                {error}
              </div>
            )}

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

        <div className="flex items-center justify-center mt-8">
          <ArbtechLogo size={24} textColor="#64748b" className="text-slate-500 dark:text-slate-400" />
        </div>
      </div>
    </div>
  );
};

export default Login;
