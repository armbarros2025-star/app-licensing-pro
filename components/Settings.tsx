
import React, { useState, useEffect } from 'react';
import { Save, Bell, Mail, MessageSquare, ShieldCheck, AlertCircle, Lock, History, UserCog, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../context/FeedbackContext';
import { ErrorState, LoadingState } from './AsyncState';
import { AuditLog } from '../types';

const Settings: React.FC = () => {
  const { logout, refreshAppData } = useApp();
  const { showToast } = useFeedback();
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [autoNotify, setAutoNotify] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('app_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const res = await fetch('/api/audit-logs?limit=12', { headers: getAuthHeaders() });
      if (res.status === 401) {
        await logout();
        return;
      }
      if (!res.ok) {
        setAuditError('Não foi possível carregar os registros de auditoria.');
        return;
      }

      const data = await res.json();
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setAuditError('Erro de conexão ao carregar auditoria.');
    } finally {
      setAuditLoading(false);
    }
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    setSettingsError(null);

    try {
      const res = await fetch('/api/settings', { headers: getAuthHeaders() });
      if (res.status === 401) {
        await logout();
        return;
      }

      if (!res.ok) {
        setSettingsError('Não foi possível carregar as configurações.');
        return;
      }

      const data = await res.json();
      setEmail(data.email || '');
      setWhatsapp(data.whatsapp || '');
      setAutoNotify(data.autoNotify || false);
    } catch (e) {
      console.error(e);
      setSettingsError('Erro de conexão ao carregar as configurações.');
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadAuditLogs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsSaving) return;

    setSettingsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email, whatsapp, autoNotify })
      });
      if (res.status === 401) {
        await logout();
        return;
      }
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        showToast({
          type: 'success',
          title: 'Configurações salvas',
          description: 'As preferências foram atualizadas com sucesso.'
        });
        await refreshAppData();
        await loadAuditLogs();
      } else {
        showToast({
          type: 'error',
          title: 'Falha ao salvar',
          description: 'Não foi possível atualizar as configurações.'
        });
      }
    } catch (e) {
      console.error(e);
      showToast({
        type: 'error',
        title: 'Erro de conexão',
        description: 'Falha ao salvar configurações. Tente novamente.'
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'Preencha todos os campos da senha.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordFeedback({ type: 'error', message: 'A nova senha deve ter ao menos 8 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'A confirmação da nova senha não confere.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.status === 401) {
        await logout();
        return;
      }
      if (!res.ok) {
        setPasswordFeedback({ type: 'error', message: data?.error || 'Não foi possível alterar a senha.' });
        showToast({
          type: 'error',
          title: 'Falha na senha',
          description: data?.error || 'Não foi possível alterar a senha.'
        });
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFeedback({ type: 'success', message: 'Senha alterada com sucesso.' });
      showToast({
        type: 'success',
        title: 'Senha atualizada',
        description: 'Sua senha foi alterada com sucesso.'
      });
      await loadAuditLogs();
    } catch (e) {
      console.error(e);
      setPasswordFeedback({ type: 'error', message: 'Erro de conexão ao alterar senha.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (settingsLoading) {
    return <LoadingState label="Carregando configurações..." />;
  }

  if (settingsError) {
    return <ErrorState message={settingsError} onRetry={loadSettings} />;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32">
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tighter text-slate-800 dark:text-slate-100">Configurações</h1>
        <p className="text-slate-500 font-medium mt-2">Personalize suas notificações e preferências do sistema.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
              <Bell className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Alertas de Vencimento</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configuração de Canais de Notificação</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                <Mail className="w-3 h-3" /> E-mail para Alertas
              </label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu-email@exemplo.com"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> WhatsApp (DDD + Número)
              </label>
              <input 
                type="text" 
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="Ex: 11999999999"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={autoNotify}
                  onChange={e => setAutoNotify(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:bg-indigo-600 transition-all"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-all"></div>
              </div>
              <div>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Ativar Disparo Automático</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">O sistema tentará enviar alertas 30 dias antes do vencimento</p>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div className="text-xs font-bold text-amber-800 dark:text-amber-200 leading-relaxed">
            <p className="uppercase tracking-widest mb-1">Nota sobre Integração:</p>
            <p>A integração com WhatsApp e E-mail em ambiente de demonstração simula o disparo. Em produção, utilizaremos APIs como Twilio ou SendGrid para garantir a entrega automatizada.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={settingsSaving}
            className="px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-600/50 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {saved ? <ShieldCheck className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Configurações Salvas!' : settingsSaving ? 'Salvando...' : 'Salvar Preferências'}
          </button>
        </div>
      </form>

      <section className="mt-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Auditoria Recente</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ações críticas dos últimos registros</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadAuditLogs}
            disabled={auditLoading}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-xl">
          {auditLoading ? (
            <LoadingState label="Carregando auditoria..." />
          ) : auditError ? (
            <ErrorState message={auditError} onRetry={loadAuditLogs} />
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center">
              <UserCog className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="mt-4 text-sm font-black text-slate-800 dark:text-slate-100">Sem eventos ainda</p>
              <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                As ações críticas do sistema aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map(log => (
                <div key={log.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100">{log.summary}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {log.actorName || 'Sistema'} • {log.action} • {log.entityType}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {log.actorEmail && (
                    <p className="mt-2 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      {log.actorEmail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <form onSubmit={handleChangePassword} className="mt-8 space-y-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Segurança da Conta</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alteração de senha do usuário logado</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha Atual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50/70 px-5 py-4 text-xs font-bold text-violet-700 dark:border-violet-900/30 dark:bg-violet-900/10 dark:text-violet-300">
            Use uma senha com pelo menos 8 caracteres e prefira uma combinação única para este sistema.
          </div>

          {passwordFeedback && (
            <div className={`rounded-2xl border px-5 py-4 text-xs font-bold ${
              passwordFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {passwordFeedback.message}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-12 py-5 bg-violet-600 hover:bg-violet-700 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-violet-600/40 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {passwordLoading ? 'Atualizando Senha...' : 'Atualizar Senha'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;
