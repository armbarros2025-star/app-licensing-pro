
import React from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Shield, User as UserIcon, Edit2, Trash2, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../context/FeedbackContext';
import { EmptyState, ErrorState, LoadingState } from './AsyncState';

const UserList: React.FC = () => {
  const { users, deleteUser, isDataLoading, dataError, refreshAppData } = useApp();
  const { confirmAction, showToast } = useFeedback();

  if (isDataLoading && users.length === 0) {
    return <LoadingState label="Carregando usuários..." />;
  }

  if (dataError && users.length === 0) {
    return <ErrorState message={dataError} onRetry={refreshAppData} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">Gestão de Usuários</h1>
          <p className="text-slate-500 dark:text-slate-400">Administre os acessos e permissões do sistema.</p>
        </div>
        <Link 
          to="/usuarios/nova" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 uppercase text-[10px] tracking-widest"
        >
          <UserPlus className="w-5 h-5" /> Adicionar Usuário
        </Link>
      </div>

      {users.length === 0 ? (
        <EmptyState
          title="Nenhum usuário encontrado"
          description="Cadastre usuários para distribuir acesso administrativo e operacional."
          action={
            <Link
              to="/usuarios/nova"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-500"
            >
              <UserPlus className="h-4 w-4" /> Adicionar usuário
            </Link>
          }
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
             {/* Decorative Background */}
             <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl ${user.role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-500'}`}></div>

             <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' : 'bg-slate-50 text-slate-500 dark:bg-slate-800'}`}>
                  {user.role === 'admin' ? <Shield className="w-7 h-7" /> : <UserIcon className="w-7 h-7" />}
                </div>
                
                <div className="flex gap-2">
                   <Link to={`/usuarios/editar/${user.id}`} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-all">
                    <Edit2 className="w-4 h-4" />
                   </Link>
                   <button 
                    onClick={async () => {
                        const adminCount = users.filter(u => u.role === 'admin').length;
                        if (user.role === 'admin' && adminCount <= 1) {
                            showToast({
                              type: 'warning',
                              title: 'Ação bloqueada',
                              description: 'Não é possível remover o único administrador do sistema.'
                            });
                            return;
                        }
                        const confirmed = await confirmAction({
                          title: 'Remover usuário?',
                          description: `Essa ação vai remover o acesso de ${user.name}.`,
                          confirmText: 'Remover',
                          cancelText: 'Cancelar',
                          tone: 'danger'
                        });
                        if (!confirmed) return;

                        const deleted = await deleteUser(user.id);
                        if (deleted) {
                          showToast({
                            type: 'success',
                            title: 'Usuário removido',
                            description: `${user.name} foi removido com sucesso.`
                          });
                        }
                    }}
                    className="p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 transition-all"
                   >
                    <Trash2 className="w-4 h-4" />
                   </button>
                </div>
             </div>

             <div className="space-y-4 relative z-10">
                <div>
                   <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">{user.name}</h3>
                   <div className="flex items-center gap-2 mt-2 text-slate-500 font-medium text-sm">
                      <Mail className="w-4 h-4" />
                      {user.email}
                   </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {user.role === 'admin' ? 'Administrador' : 'Colaborador'}
                   </span>
                   <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${user.active ? 'text-emerald-600' : 'text-rose-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      {user.active ? 'Ativo' : 'Inativo'}
                   </span>
                </div>
             </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default UserList;
