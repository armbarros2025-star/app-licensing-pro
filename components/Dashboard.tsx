
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Building2,
  Files,
  Loader2,
  TrendingUp,
  ShieldAlert,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  FileSearch,
  Target
} from 'lucide-react';
import { parseISO, format, differenceInDays, isBefore } from 'date-fns';
import { useApp } from '../context/AppContext';
import { analyzeLicensesStatus } from '../services/geminiService';
import { AuditAnalysis } from '../types';
import { ErrorState, LoadingState } from './AsyncState';
import { readRenewalFilterState, writeRenewalFilterState } from '../utils/filterPersistence';

const Dashboard: React.FC = () => {
  const { licenses, companies, currentUser, isDataLoading, dataError, refreshAppData } = useApp();
  const [filterCompany, setFilterCompany] = useState('all');
  const [aiAnalysis, setAiAnalysis] = useState<AuditAnalysis | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [filtersHydrated, setFiltersHydrated] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) return;

    const saved = readRenewalFilterState(currentUser.id);
    if (saved?.companyFilter === 'all' || companies.some(company => company.id === saved?.companyFilter)) {
      setFilterCompany(saved?.companyFilter || 'all');
    }

    setFiltersHydrated(true);
  }, [currentUser?.id, companies]);

  useEffect(() => {
    if (!filtersHydrated || !currentUser?.id) return;

    const saved = readRenewalFilterState(currentUser.id);
    writeRenewalFilterState(currentUser.id, {
      companyFilter: filterCompany,
      urgencyFilter: saved?.urgencyFilter || 'all',
      search: saved?.search || ''
    });
  }, [filterCompany, currentUser?.id, filtersHydrated]);

  const filteredLicenses = useMemo(() => {
    if (filterCompany === 'all') return licenses;
    return licenses.filter(l => l.companyId === filterCompany);
  }, [licenses, filterCompany]);

  const stats = useMemo(() => {
    const today = new Date();
    const result = { expired: 0, warning: 0, active: 0, total: filteredLicenses.length };
    
    filteredLicenses.forEach(l => {
      const expDate = parseISO(l.expirationDate);
      if (isBefore(expDate, today)) {
        result.expired++;
      } else if (differenceInDays(expDate, today) < 30) {
        result.warning++;
      } else {
        result.active++;
      }
    });
    return result;
  }, [filteredLicenses]);

  const runAudit = async () => {
    if (filteredLicenses.length > 0) {
      setLoadingAi(true);
      try {
        const analysis = await analyzeLicensesStatus(filteredLicenses, companies);
        setAiAnalysis(analysis);
      } catch (err) {
        setAiAnalysis({
          executiveSummary: 'Falha ao processar auditoria. Verifique sua conexão ou API Key.',
          immediateRisks: [],
          bottlenecks: [],
          recommendedActions: [],
          confidence: 'low'
        });
      } finally {
        setLoadingAi(false);
      }
    } else {
      setAiAnalysis({
        executiveSummary: 'Não há dados suficientes para realizar os testes de conformidade.',
        immediateRisks: [],
        bottlenecks: [],
        recommendedActions: [],
        confidence: 'low'
      });
    }
  };

  // Efeito para rodar a auditoria sempre que o filtro ou os dados mudarem
  useEffect(() => {
    if (!filtersHydrated) return;
    const timer = setTimeout(() => {
      runAudit();
    }, 500);
    return () => clearTimeout(timer);
  }, [filterCompany, licenses, filtersHydrated]);

  const upcomingLicenses = [...filteredLicenses]
    .sort((a, b) => parseISO(a.expirationDate).getTime() - parseISO(b.expirationDate).getTime())
    .slice(0, 5);

  const getStatusInfo = (date: string) => {
    const today = new Date();
    const expDate = parseISO(date);
    if (expDate < today) return { label: 'Crítico', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' };
    if (differenceInDays(expDate, today) < 30) return { label: 'Atenção', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' };
    return { label: 'Vigente', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
  };

  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.fantasyName || 'N/A';

  const compliancePercentage = stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : '0.0';

  if (isDataLoading && licenses.length === 0 && companies.length === 0) {
    return <LoadingState label="Montando dashboard..." />;
  }

  if (dataError && licenses.length === 0 && companies.length === 0) {
    return <ErrorState message={dataError} onRetry={refreshAppData} />;
  }

  if (!filtersHydrated && currentUser?.id) {
    return <LoadingState label="Recuperando filtros salvos..." />;
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 h-full pb-14">
      {dataError && (licenses.length > 0 || companies.length > 0) && (
        <ErrorState message={dataError} onRetry={refreshAppData} />
      )}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-800 dark:text-white font-display">
            Dashboard <span className="text-indigo-600">Pro</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {filterCompany === 'all' ? `Monitorando ${companies.length} entidades.` : `Focado em ${getCompanyName(filterCompany)}.`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            to="/renovacoes"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
          >
            <Target className="h-4 w-4" />
            Centro de Renovação
          </Link>
          <div className="relative w-full sm:w-64 group">
            <select 
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full appearance-none px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold cursor-pointer text-xs shadow-sm group-hover:border-indigo-200 dark:group-hover:border-indigo-900"
            >
              <option value="all">Todas as Empresas</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.fantasyName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
          </div>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-5">
        {/* Main Stats Bento */}
        <div className="md:col-span-2 lg:col-span-2 space-y-6">
          <div className="p-6 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden group h-full flex flex-col justify-between">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-70">Conformidade Global</h3>
              <div className="text-6xl font-black tracking-tighter mt-2">{compliancePercentage}%</div>
            </div>
            <div className="relative z-10 mt-8">
              <p className="text-xs font-medium opacity-80 leading-relaxed">
                {Number(compliancePercentage) > 90 
                  ? "Sua operação está em nível de excelência regulatória." 
                  : "Atenção necessária em documentos pendentes."}
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6">
          <KpiCardSmall label="Vencidas" value={stats.expired} icon={ShieldAlert} variant="rose" />
          <KpiCardSmall label="Atenção" value={stats.warning} icon={Clock} variant="amber" />
          <KpiCardSmall label="Vigentes" value={stats.active} icon={CheckCircle2} variant="emerald" />
          <KpiCardSmall label="Empresas" value={companies.length} icon={Building2} variant="indigo" />
        </div>

        {/* AI Audit Bento */}
        <div className="md:col-span-4 lg:col-span-2">
          <div className="bg-slate-900 dark:bg-slate-900/40 p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group h-full border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black uppercase tracking-widest">Auditoria IA</h3>
              </div>
              <button 
                  onClick={runAudit}
                  disabled={loadingAi}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all disabled:opacity-50"
              >
                  <RefreshCw className={`w-4 h-4 ${loadingAi ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
               {loadingAi ? (
                <div className="flex flex-col items-center justify-center flex-1 py-10 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Processando...</p>
                </div>
              ) : (
                <div className="flex-1 custom-scrollbar overflow-y-auto max-h-[260px] pr-2 space-y-5">
                  {aiAnalysis ? (
                    <>
                      <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Resumo Executivo</p>
                          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                            aiAnalysis.confidence === 'high'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : aiAnalysis.confidence === 'medium'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-500/20 text-slate-300'
                          }`}>
                            {aiAnalysis.confidence === 'high' ? 'Alta confiança' : aiAnalysis.confidence === 'medium' ? 'Confiança média' : 'Baixa confiança'}
                          </span>
                        </div>
                        <p className="text-indigo-100/90 leading-relaxed text-sm font-medium">
                          {aiAnalysis.executiveSummary}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <AnalysisList
                          title="Riscos imediatos"
                          items={aiAnalysis.immediateRisks}
                          emptyLabel="Sem riscos imediatos no recorte atual."
                        />
                        <AnalysisList
                          title="Gargalos"
                          items={aiAnalysis.bottlenecks}
                          emptyLabel="Sem gargalos relevantes identificados."
                        />
                      </div>

                      <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-3">Ações recomendadas</p>
                        {aiAnalysis.recommendedActions.length > 0 ? (
                          <div className="space-y-3">
                            {aiAnalysis.recommendedActions.slice(0, 3).map((action) => (
                              <div key={action.title} className="rounded-xl bg-slate-950/50 border border-white/5 p-3">
                                <p className="text-xs font-black text-white">{action.title}</p>
                                <p className="mt-1 text-[11px] font-medium text-slate-300 leading-relaxed">{action.detail}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-slate-400">Nenhuma ação foi sugerida para este recorte.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-500 text-xs font-medium">Clique em atualizar para iniciar auditoria preditiva.</p>
                  )}
                </div>
              )}
              <div className="grid gap-3 mt-6">
                <Link
                  to="/renovacoes"
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-center"
                >
                  Abrir Centro de Renovação
                </Link>
                <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                  Relatório Completo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Priorities Bento */}
        <div className="md:col-span-4 lg:col-span-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                  <Files className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Prioridades de Renovação</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documentos com vencimento próximo</p>
                </div>
              </div>
              <Link to={`/licencas?companyId=${filterCompany}`} className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-all">
                Gerenciar Todos
              </Link>
            </div>

            <div className="overflow-x-auto">
              {upcomingLicenses.length > 0 ? (
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {upcomingLicenses.map(l => {
                      const status = getStatusInfo(l.expirationDate);
                      return (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-indigo-900/5 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-2 h-2 rounded-full ${status.bg.replace('bg-', 'bg-')}`} />
                              <div>
                                <p className="text-sm font-black text-slate-800 dark:text-slate-100">{l.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getCompanyName(l.companyId)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                              {format(parseISO(l.expirationDate), 'dd/MM/yyyy')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ${status.bg} ${status.color}`}>
                                {status.label}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {differenceInDays(parseISO(l.expirationDate), new Date())}d restantes
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/licencas/editar/${l.id}`} aria-label={`Editar ${l.name}`} title="Editar licença" className="p-2 text-slate-500 hover:text-indigo-600 transition-colors">
                              <RefreshCw className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                  </div>
                  <h4 className="text-lg font-black text-slate-800 dark:text-slate-100">Tudo em Conformidade</h4>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">Nenhuma licença requer atenção imediata no momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCardSmall = ({ label, value, icon: Icon, variant }: any) => {
  const styles = {
    rose: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
  };

  return (
    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles[variant as keyof typeof styles]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="mt-4">
        <span className="block text-3xl font-black tracking-tighter text-slate-800 dark:text-slate-100">{value}</span>
        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
};

const AnalysisList: React.FC<{
  title: string;
  items: string[];
  emptyLabel: string;
}> = ({ title, items, emptyLabel }) => (
  <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-3">{title}</p>
    {items.length > 0 ? (
      <ul className="space-y-2">
        {items.slice(0, 3).map((item) => (
          <li key={item} className="text-[11px] font-medium text-indigo-100/80 leading-relaxed flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-[11px] font-medium leading-relaxed text-slate-400">{emptyLabel}</p>
    )}
  </div>
);

export default Dashboard;
