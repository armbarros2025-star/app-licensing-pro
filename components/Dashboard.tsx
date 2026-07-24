
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  Building2,
  Files,
  Loader2,
  ShieldAlert,
  ChevronDown,
  RefreshCw,
  Target
} from 'lucide-react';
import { parseISO, format, differenceInDays, isBefore } from 'date-fns';
import { useApp } from '../context/AppContext';
import { analyzeLicensesStatus } from '../services/geminiService';
import { AuditAnalysis } from '../types';
import { ErrorState, LoadingState } from './AsyncState';
import { readRenewalFilterState, writeRenewalFilterState } from '../utils/filterPersistence';

const Dashboard: React.FC = () => {
  const { licenses, companies, currentUser, authToken, isDataLoading, dataError, refreshAppData } = useApp();
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
        const analysis = await analyzeLicensesStatus(filteredLicenses, companies, authToken);
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

  useEffect(() => {
    if (!filtersHydrated) return;
    setAiAnalysis(null);
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
  const pendingCount = stats.expired + stats.warning;

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
    <div className="mx-auto h-full max-w-[1120px] space-y-6 pb-10">
      {dataError && (licenses.length > 0 || companies.length > 0) && (
        <ErrorState message={dataError} onRetry={refreshAppData} />
      )}
      <header className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-end md:justify-between md:p-6">
        <div>
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Visão geral</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">Vencimentos e renovação</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{filterCompany === 'all' ? `Acompanhe ${companies.length} empresas e priorize o que precisa de ação.` : `Recorte atual: ${getCompanyName(filterCompany)}.`}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative">
            <span className="sr-only">Filtrar empresa</span>
            <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
              <option value="all">Todas as empresas</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.fantasyName}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </label>
          <Link to="/renovacoes" className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
            <Target className="h-4 w-4" /> Abrir renovações
          </Link>
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fila de renovação</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{pendingCount} licença{pendingCount === 1 ? '' : 's'} exige{pendingCount === 1 ? '' : 'm'} acompanhamento.</p>
          </div>
          <Link to={`/licencas?companyId=${filterCompany}`} className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300">Ver todas as licenças</Link>
        </div>
        <div className="overflow-x-auto">
          {upcomingLicenses.length > 0 ? (
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 dark:bg-slate-950/50 dark:text-slate-400"><tr><th className="px-5 py-3">Licença</th><th className="px-5 py-3">Vencimento</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"><span className="sr-only">Ação</span></th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingLicenses.map(l => {
                  const status = getStatusInfo(l.expirationDate);
                  return <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-4"><p className="font-semibold text-slate-900 dark:text-white">{l.name}</p><p className="mt-1 text-xs text-slate-500">{getCompanyName(l.companyId)}</p></td>
                    <td className="px-5 py-4 font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">{format(parseISO(l.expirationDate), 'dd/MM/yyyy')}</td>
                    <td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.color}`}>{status.label} · {differenceInDays(parseISO(l.expirationDate), new Date())}d</span></td>
                    <td className="px-5 py-4 text-right"><Link to={`/licencas/editar/${l.id}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-200"><RefreshCw className="h-4 w-4" /> Atualizar</Link></td>
                  </tr>;
                })}
              </tbody>
            </table>
          ) : <div className="p-8 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" /><h2 className="mt-3 font-bold text-slate-900 dark:text-white">Nenhuma pendência no recorte atual</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">As licenças deste recorte estão em dia.</p></div>}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCardSmall label="Vencidas" value={stats.expired} icon={ShieldAlert} variant="rose" />
        <KpiCardSmall label="Próximas de vencer" value={stats.warning} icon={Clock} variant="amber" />
        <KpiCardSmall label="Vigentes" value={stats.active} icon={CheckCircle2} variant="emerald" />
        <KpiCardSmall label="Conformidade" value={`${compliancePercentage}%`} icon={Files} variant="indigo" />
      </section>

      <details className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Análise de pendências <span className="ml-2 font-normal text-slate-500">— apoio sob demanda</span></summary>
        <div className="border-t border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">Gere uma leitura complementar do recorte atual. Confirme as conclusões com os documentos e prazos registrados.</p>
            <button onClick={runAudit} disabled={loadingAi} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"><RefreshCw className={`h-4 w-4 ${loadingAi ? 'animate-spin' : ''}`} />{loadingAi ? 'Analisando' : 'Analisar'}</button>
          </div>
          <div className="mt-4">
               {loadingAi ? (
                <div className="flex items-center gap-3 py-6 text-sm text-slate-600 dark:text-slate-300">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Processando dados do recorte atual…
                </div>
              ) : (
                <div className="space-y-4">
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
                    <p className="text-sm text-slate-600 dark:text-slate-300">Nenhuma análise foi executada para este recorte.</p>
                  )}
                </div>
              )}
          </div>
        </div>
      </details>
    </div>
  );
};

const StatPill = ({ label, value, tone }: { label: string; value: string; tone: 'rose' | 'emerald' | 'slate' }) => {
  const toneClasses = {
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-200 border-rose-100 dark:border-rose-900/40',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200 border-emerald-100 dark:border-emerald-900/40',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
  }[tone];

  return (
    <div className={`rounded-2xl border px-3.5 py-2.5 ${toneClasses}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-70">{label}</p>
      <p className="mt-1 text-sm font-black tracking-tight">{value}</p>
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
    <div className="p-5 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles[variant as keyof typeof styles]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="mt-4">
        <span className="block text-2xl font-black tracking-tighter text-slate-800 dark:text-slate-100">{value}</span>
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
