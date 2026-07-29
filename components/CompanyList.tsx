
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
    <div className="mx-auto max-w-[1180px] space-y-6 pb-14">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">
            Empresas <span className="text-[#8fb6ff]">& unidades</span>
          </h1>
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#a6b7d4]">
            <Building2 className="w-4 h-4" />
            Gerencie as entidades jurídicas e operacionais sob sua custódia.
          </p>
        </div>
        <Link
          to="/empresas/nova"
          className="inline-flex min-h-11 items-center gap-3 rounded-lg bg-[#2859d6] px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#3868e5]"
        >
          <Plus className="h-5 w-5" />
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
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2859d6] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3868e5]"
            >
              <Plus className="h-4 w-4" /> Cadastrar primeira empresa
            </Link>
          }
        />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...companies].sort((a, b) => (a.cnpj || '').localeCompare(b.cnpj || '')).map(company => (
          <div key={company.id} className="legacy-panel flex flex-col p-4">
            <div className="mb-3 flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-[#102a59] text-[#8fb6ff]">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex gap-2">
                <Link to={`/empresas/editar/${company.id}`} aria-label={`Editar ${company.fantasyName}`} title="Editar empresa" className="legacy-control grid place-items-center rounded-md border border-[#21436e] bg-[#0b1d39] text-[#b9c9e3] transition-colors hover:border-[#73a0ff] hover:text-white">
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
                  className="legacy-control grid place-items-center rounded-md border border-[#21436e] bg-[#0b1d39] text-rose-300 transition-colors hover:border-rose-400 hover:text-rose-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-grow space-y-4">
              <div>
                <Link to={`/licencas?companyId=${company.id}`} className="block">
                  <h3 className="text-lg font-semibold leading-tight text-white transition-colors hover:text-[#8fb6ff]">{company.fantasyName}</h3>
                </Link>
                <p className="mt-1 text-xs font-medium text-[#91a7cc]">{company.name}</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2 rounded-md border border-[#17345d] bg-[#0d213f] p-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-medium text-[#b9c9e3]">CNPJ:<span className="ml-1 font-mono text-[#dce8ff]">{company.cnpj}</span></span>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-[#17345d] bg-[#0d213f] p-2">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-medium text-[#b9c9e3]">
                    <span className="mr-1 font-mono text-[#8fb6ff]">{getCompanyLicenseCount(company.id)}</span>
                    Licenças Ativas
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#17345d] pt-4">
              <span className={`rounded px-2.5 py-1 text-xs font-semibold ${company.active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-[#142a4c] text-[#b9c9e3]'}`}>
                {company.active ? 'Unidade Ativa' : 'Inativa'}
              </span>
              <Link to={`/licencas?companyId=${company.id}`} className="flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#8fb6ff] transition-colors hover:text-white">
                Ver Painel
                <Activity className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}

        <Link to="/empresas/nova" className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-[#2859d6] p-4 text-[#8fb6ff] transition-colors hover:bg-[#102a59] hover:text-white">
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-full border border-current">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold">Nova empresa</span>
        </Link>
      </div>
      )}
    </div>
  );
};

export default CompanyList;
