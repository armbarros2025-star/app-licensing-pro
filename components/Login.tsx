
import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ArbtechLogo from './ArbtechLogo';
import { assetUrl } from '../utils/assets';

const Login: React.FC = () => {
  const { login, theme, toggleTheme } = useApp();
  const logoSrc = theme === 'dark' ? assetUrl('logo_login_white.png') : assetUrl('logo.png');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatRetryDelay = (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'alguns minutos';
    if (seconds < 60) return `${seconds} segundo${seconds === 1 ? '' : 's'}`;
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `${minutes} minuto${minutes === 1 ? '' : 's'}`;
    const hours = Math.ceil(minutes / 60);
    return `${hours} hora${hours === 1 ? '' : 's'}`;
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setError('');
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError('Preencha e-mail e senha para continuar.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(normalizedEmail, password);
      if (!result.ok) {
        if (result.retryAfterSeconds) {
          setError(`Muitas tentativas. Tente novamente em aproximadamente ${formatRetryDelay(result.retryAfterSeconds)}.`);
        } else {
          setError(result.message || 'E-mail ou senha incorretos. Verifique suas credenciais.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.14),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.10),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.18),_transparent_45%)] pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.25] pointer-events-none bg-[linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]"></div>

      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:scale-110 transition-all shadow-xl backdrop-blur-md"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
        </button>
      </div>

      <div className="relative z-10 flex w-full justify-center px-4 py-10 md:px-8">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className={`glass-card ${theme === 'dark' ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/85 border-slate-200'} border p-8 md:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-xl transition-all duration-500 relative overflow-hidden`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500"></div>
            <div className="absolute -right-12 top-0 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl"></div>
            <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl"></div>

            <div className="text-center mb-8 relative z-10">
              <div className="flex justify-center mb-6">
                <img
                  src={logoSrc}
                  alt="Arbtech Info"
                  className="w-[144px] max-w-full md:w-[180px] h-auto object-contain drop-shadow-2xl hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
                LicensePro Enterprise
              </div>
              <h1 className={`mt-5 text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Bem-vindo de volta</h1>
              <p className="mt-3 text-slate-400 font-medium text-sm">Acesse o painel operacional com uma visão rápida do que está vencendo e do que já está em renovação.</p>
            </div>

            <form className="space-y-6 relative z-10" onSubmit={handleLogin} aria-busy={loading}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="seuemail@empresa.com.br"
                  autoComplete="username"
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
                  autoComplete="current-password"
                  name="licensing-password"
                  className={`w-full pl-14 pr-6 py-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-300'}`}
                />
              </div>
            </div>
            {error && (
              <div role="alert" aria-live="assertive" className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <div className="space-y-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 hover:from-indigo-500 hover:via-blue-500 hover:to-sky-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : <>Entrar no Painel <ShieldCheck className="w-4 h-4" /></>}
              </button>
            </div>
            </form>
          </div>

          <div className="flex items-center justify-center mt-8">
            <ArbtechLogo size={24} textColor="#64748b" className="text-slate-500 dark:text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
