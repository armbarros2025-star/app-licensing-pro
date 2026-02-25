
import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Edit2, Trash2, ExternalLink, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';

const CompanyList: React.FC = () => {
  const { companies, deleteCompany, licenses } = useApp();

  const getCompanyLicenseCount = (companyId: string) => {
    return licenses.filter(l => l.companyId === companyId).length;
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-800 dark:text-white font-display">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {companies.map(company => (
          <div key={company.id} className="glass-card p-8 rounded-[3rem] flex flex-col group hover:scale-[1.02] transition-all duration-500 border-white/20 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Link to={`/empresas/editar/${company.id}`} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all">
                  <Edit2 className="w-5 h-5" />
                </Link>
                <button 
                  onClick={() => confirm('Excluir empresa? Todas as licenças vinculadas também serão removidas.') && deleteCompany(company.id)}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 flex-grow relative z-10">
              <div>
                <Link to={`/licencas?companyId=${company.id}`} className="block group/title">
                  <h3 className="text-2xl font-black leading-tight text-slate-800 dark:text-slate-100 group-hover/title:text-indigo-600 transition-colors">{company.fantasyName}</h3>
                </Link>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">{company.name}</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tighter">CNPJ: <span className="font-mono text-slate-900 dark:text-white ml-1">{company.cnpj}</span></span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <ExternalLink className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tighter">{getCompanyLicenseCount(company.id)} Licenças Ativas</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center relative z-10">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${company.active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-50 text-slate-400'}`}>
                {company.active ? 'Unidade Ativa' : 'Inativa'}
              </span>
              <Link to={`/licencas?companyId=${company.id}`} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:text-indigo-500 uppercase tracking-widest transition-colors group/link">
                Ver Painel
                <Activity className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}

        <Link to="/empresas/nova" className="glass-card p-8 flex flex-col items-center justify-center text-slate-300 hover:text-indigo-500 hover:border-indigo-500/30 transition-all group min-h-[350px] rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-900">
           <div className="w-20 h-20 rounded-full border-4 border-dashed border-current flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <Plus className="w-10 h-10" />
           </div>
           <span className="font-black text-xl uppercase tracking-widest">Nova Empresa</span>
           <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Expandir Portfólio</p>
        </Link>
      </div>
    </div>
  );
};

export default CompanyList;
