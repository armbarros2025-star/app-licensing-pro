
import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Edit2, Trash2, ExternalLink, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../context/FeedbackContext';
import { EmptyState, ErrorState, LoadingState } from './AsyncState';

const CompanyList: React.FC = () => {
  const { companies, deleteCompany, licenses, isDataLoading, dataError, refreshAppData } = useApp();
  const { confirmAction, showToast } = useFeedback();

  const getCompanyLicenseCount = (companyId: string) => {
    return licenses.filter(l => l.companyId === companyId).length;
  };

  if (isDataLoading && companies.length === 0) {
    return <LoadingState label="Carregando empresas..." />;
  }

  if (dataError && companies.length === 0) {
    return <ErrorState message={dataError} onRetry={refreshAppData} />;
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-14">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-800 dark:text-white font-display">
            Empresas & <span className="text-indigo-600">Unidades</span>
          </h1>
          <p className="text-slate-500 font-medium mt-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Gerencie as entidades jurídicas e operacionais sob sua custódia.
          </p>
        </div>
        <Link
          to="/empresas/nova"
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-3 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Cadastrar Empresa
        </Link>
      </header>

      {companies.length === 0 ? (
        <EmptyState
          title="Nenhuma empresa cadastrada"
          description="Cadastre sua primeira empresa para começar a organizar licenças e alvarás."
          action={
            <Link
              to="/empresas/nova"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" /> Cadastrar primeira empresa
            </Link>
          }
        />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...companies].sort((a, b) => (a.cnpj || '').localeCompare(b.cnpj || '')).map(company => (
          <div key={company.id} className="glass-card p-4 rounded-2xl flex flex-col group hover:scale-[1.02] transition-all duration-300 border-white/20 dark:border-slate-800 relative overflow-hidden bg-white/40 dark:bg-slate-900/40">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Link to={`/empresas/editar/${company.id}`} aria-label={`Editar ${company.fantasyName}`} title="Editar empresa" className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all">
                  <Edit2 className="w-4 h-4" />
                </Link>
                <button
                  onClick={async () => {
                    const confirmed = await confirmAction({
                      title: 'Excluir empresa?',
                      description: 'Todas as licenças vinculadas também serão removidas.',
                      confirmText: 'Excluir',
                      cancelText: 'Cancelar',
                      tone: 'danger'
                    });
                    if (!confirmed) return;

                    const deleted = await deleteCompany(company.id);
                    if (deleted) {
                      showToast({
                        type: 'success',
                        title: 'Empresa removida',
                        description: `${company.fantasyName} foi excluída com sucesso.`
                      });
                    }
                  }}
                  aria-label={`Excluir ${company.fantasyName}`}
                  title="Excluir empresa"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 flex-grow relative z-10">
              <div>
                <Link to={`/licencas?companyId=${company.id}`} className="block group/title">
                  <h3 className="text-lg font-black leading-tight text-slate-800 dark:text-slate-100 group-hover/title:text-indigo-600 transition-colors">{company.fantasyName}</h3>
                </Link>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{company.name}</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tighter">CNPJ:<span className="font-mono text-slate-900 dark:text-white ml-1">{company.cnpj}</span></span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tighter">
                    <span className="font-mono text-indigo-600 mr-1">{getCompanyLicenseCount(company.id)}</span>
                    Licenças Ativas
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center relative z-10">
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${company.active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-50 text-slate-400'}`}>
                {company.active ? 'Unidade Ativa' : 'Inativa'}
              </span>
              <Link to={`/licencas?companyId=${company.id}`} className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 hover:text-indigo-500 uppercase tracking-widest transition-colors group/link">
                Ver Painel
                <Activity className="w-2.5 h-2.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}

        <Link to="/empresas/nova" className="glass-card p-4 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500/30 transition-all group min-h-[160px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-full border-[2px] border-dashed border-current flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-black text-sm uppercase tracking-widest">Nova Empresa</span>
        </Link>
      </div>
      )}
    </div>
  );
};

export default CompanyList;
