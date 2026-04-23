
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, User, Mail, Shield, ShieldCheck,
  ToggleLeft, ToggleRight, Fingerprint, Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../context/FeedbackContext';
import { UserRole } from '../types';
import { EmptyState, ErrorState, LoadingState } from './AsyncState';

const UserForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, addUser, updateUser, isDataLoading, dataError, refreshAppData } = useApp();
  const { showToast } = useFeedback();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [active, setActive] = useState(true);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const existingUser = id ? users.find(u => u.id === id) : null;

  useEffect(() => {
    setInitialized(false);
  }, [id]);

  useEffect(() => {
    if (initialized) return;

    if (!id) {
      setInitialized(true);
      return;
    }

    if (existingUser) {
      setName(existingUser.name);
      setEmail(existingUser.email);
      setRole(existingUser.role);
      setActive(existingUser.active);
      setPassword('');
      setInitialized(true);
      return;
    }

    if (!isDataLoading) {
      setInitialized(true);
    }
  }, [id, existingUser, initialized, isDataLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && !existingUser) return;
    if (saving) return;
    if (!name || !email) return;
    if (!id && password.trim().length < 8) {
      showToast({
        type: 'warning',
        title: 'Senha muito curta',
        description: 'Defina uma senha com ao menos 8 caracteres.'
      });
      return;
    }
    if (id && password && password.trim().length < 8) {
      showToast({
        type: 'warning',
        title: 'Senha inválida',
        description: 'Se preencher nova senha, ela deve ter ao menos 8 caracteres.'
      });
      return;
    }

    setSaving(true);
    try {
      let success = false;
      if (id) {
        success = await updateUser(id, {
          name,
          email,
          role,
          active,
          password: password.trim() || undefined
        });
      } else {
        success = await addUser({
          name,
          email,
          role,
          active,
          password: password.trim()
        });
      }

      if (success) {
        showToast({
          type: 'success',
          title: id ? 'Usuário atualizado' : 'Usuário criado',
          description: `${name} foi salvo com sucesso.`
        });
        navigate('/usuarios');
      }
    } finally {
      setSaving(false);
    }
  };

  if (id && isDataLoading && !existingUser) {
    return <LoadingState label="Carregando dados do usuário..." />;
  }

  if (id && dataError && !existingUser) {
    return <ErrorState message={dataError} onRetry={refreshAppData} />;
  }

  if (id && !isDataLoading && !existingUser) {
    return (
      <EmptyState
        title="Usuário não encontrado"
        description="Esse usuário pode ter sido removido ou você não possui acesso para editá-lo."
        action={
          <button
            type="button"
            onClick={() => navigate('/usuarios')}
            className="inline-flex items-center rounded-2xl bg-indigo-600 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-500"
          >
            Voltar para usuários
          </button>
        }
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-14">
      <div className="mb-8 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold uppercase text-xs tracking-widest">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Voltar
        </button>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-800 dark:text-slate-100">{id ? 'Editar Usuário' : 'Novo Usuário'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" aria-busy={saving}>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl space-y-6">
          
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
            <User className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-black tracking-tight">Dados de Acesso</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <User className="w-3 h-3" /> Nome Completo
              </label>
              <input 
                required
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Mail className="w-3 h-3" /> E-mail Corporativo
              </label>
              <input 
                required
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Lock className="w-3 h-3" /> {id ? 'Nova Senha (Opcional)' : 'Senha Inicial'}
              </label>
              <input
                required={!id}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={id ? 'Deixe em branco para manter a senha atual' : 'Mínimo 8 caracteres'}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <ShieldCheck className="w-3 h-3" /> Nível de Permissão
                  </label>
                  <div className="relative">
                    <select 
                        value={role}
                        disabled={false}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full appearance-none px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                        <option value="user">Colaborador (Visualização)</option>
                        <option value="admin">Administrador (Total)</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <Shield className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status da Conta</label>
                  <button 
                    type="button"
                    onClick={() => setActive(!active)}
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border transition-all ${active ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-900/30 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-800'}`}
                  >
                    <span className="font-bold">{active ? 'Acesso Liberado' : 'Acesso Bloqueado'}</span>
                    {active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                </div>
            </div>

            {!id && (
                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex gap-4">
                    <Fingerprint className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Orientação de senha</h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">Use ao menos 8 caracteres. Uma senha mais longa e única reduz riscos de acesso indevido.</p>
                    </div>
                </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
           <button 
            type="button"
            onClick={() => navigate('/usuarios')}
            disabled={saving}
            className="px-8 py-4 bg-transparent text-slate-500 font-black uppercase tracking-widest text-xs hover:text-slate-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-600/40 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" /> {saving ? 'Salvando...' : (id ? 'Salvar Alterações' : 'Criar Usuário')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
