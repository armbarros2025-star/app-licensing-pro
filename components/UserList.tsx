
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
    <div className="mx-auto max-w-[1180px] space-y-6 pb-14">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-white">Gestão de usuários</h1>
          <p className="text-sm text-[#a6b7d4]">Administre os acessos e permissões do sistema.</p>
        </div>
        <Link 
          to="/usuarios/nova" 
          className="inline-flex min-h-11 items-center justify-center gap-3 rounded-lg bg-[#2859d6] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3868e5]"
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
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2859d6] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3868e5]"
            >
              <UserPlus className="h-4 w-4" /> Adicionar usuário
            </Link>
          }
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map(user => (
          <div key={user.id} className="legacy-panel p-5">
             <div className="mb-4 flex items-start justify-between">
                <div className={`grid h-11 w-11 place-items-center rounded-md ${user.role === 'admin' ? 'bg-[#102a59] text-[#8fb6ff]' : 'bg-[#0d213f] text-[#b9c9e3]'}`}>
                  {user.role === 'admin' ? <Shield className="w-7 h-7" /> : <UserIcon className="w-7 h-7" />}
                </div>
                
                <div className="flex gap-2">
                   <Link to={`/usuarios/editar/${user.id}`} aria-label={`Editar ${user.name}`} className="legacy-control grid place-items-center rounded-md text-[#b9c9e3] transition-colors hover:bg-[#102a59] hover:text-white">
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
                    aria-label={`Remover ${user.name}`}
                    className="legacy-control grid place-items-center rounded-md text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-100"
                   >
                    <Trash2 className="w-4 h-4" />
                   </button>
                </div>
             </div>

             <div className="space-y-4">
                <div>
                   <h3 className="text-xl font-semibold leading-tight text-white">{user.name}</h3>
                   <div className="mt-2 flex min-w-0 items-center gap-2 text-sm font-medium text-[#a6b7d4]">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{user.email}</span>
                   </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#17345d] pt-4">
                   <span className={`rounded px-3 py-1.5 text-xs font-semibold ${user.role === 'admin' ? 'bg-[#102a59] text-[#8fb6ff]' : 'bg-[#142a4c] text-[#b9c9e3]'}`}>
                      {user.role === 'admin' ? 'Administrador' : 'Colaborador'}
                   </span>
                   <span className={`flex items-center gap-1.5 text-xs font-semibold ${user.active ? 'text-emerald-300' : 'text-rose-300'}`}>
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
