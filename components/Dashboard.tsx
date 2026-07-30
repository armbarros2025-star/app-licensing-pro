import React, { useEffect, useMemo, useState } from 'react';
import { Link } from '../utils/router';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FilePlus2,
  Files,
  Plus,
  RefreshCw,
  ShieldAlert,
  Target
} from 'lucide-react';
import { differenceInDays, format, isBefore, parseISO } from 'date-fns';
import { useApp } from '../context/AppContext';
import { analyzeLicensesStatus } from '../services/geminiService';
import { AuditAnalysis } from '../types';
import { ErrorState, LoadingState } from './AsyncState';
import { institutionLogos } from '../utils/institutionLogos';
import { assetUrl } from '../utils/assets';
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
    if (saved?.companyFilter === 'all' || companies.some((company) => company.id === saved?.companyFilter)) {
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

  const filteredLicenses = useMemo(
    () => filterCompany === 'all' ? licenses : licenses.filter((license) => license.companyId === filterCompany),
    [licenses, filterCompany]
  );

  const asOf = useMemo(() => new Date(), [licenses, filterCompany]);
  const referenceLabel = format(asOf, "dd/MM/yyyy 'às' HH:mm");

  const stats = useMemo(() => {
    const today = asOf;
    return filteredLicenses.reduce((total, license) => {
      const expiration = parseISO(license.expirationDate);
      if (isBefore(expiration, today)) total.expired += 1;
      else if (differenceInDays(expiration, today) < 30) total.warning += 1;
      else total.active += 1;
      total.total += 1;
      if (license.isRenewing) total.renewing += 1;
      return total;
    }, { expired: 0, warning: 0, active: 0, total: 0, renewing: 0 });
  }, [filteredLicenses, asOf]);

  const upcomingLicenses = useMemo(
    () => [...filteredLicenses].sort((a, b) => parseISO(a.expirationDate).getTime() - parseISO(b.expirationDate).getTime()).slice(0, 6),
    [filteredLicenses]
  );

  const getCompanyName = (id: string) => companies.find((company) => company.id === id)?.fantasyName || 'Não identificada';
  const getStatus = (date: string) => {
    const days = differenceInDays(parseISO(date), asOf);
    if (days < 0) return { label: 'Vencida', tone: 'text-rose-300 bg-rose-500/10 border-rose-500/20', marker: 'bg-rose-400', days };
    if (days < 15) return { label: 'Crítica', tone: 'text-rose-300 bg-rose-500/10 border-rose-500/20', marker: 'bg-rose-400', days };
    if (days < 30) return { label: 'Atenção', tone: 'text-amber-300 bg-amber-500/10 border-amber-500/20', marker: 'bg-amber-400', days };
    return { label: 'Vigente', tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20', marker: 'bg-emerald-400', days };
  };

  const runAudit = async () => {
    setLoadingAi(true);
    try {
      setAiAnalysis(await analyzeLicensesStatus(filteredLicenses, companies, authToken));
    } catch {
      setAiAnalysis({
        executiveSummary: 'Não foi possível concluir a leitura complementar deste recorte.',
        immediateRisks: [],
        bottlenecks: [],
        recommendedActions: [],
        confidence: 'low'
      });
    } finally {
      setLoadingAi(false);
    }
  };

  if (isDataLoading && !licenses.length && !companies.length) return <LoadingState label="Montando painel de conformidade..." />;
  if (dataError && !licenses.length && !companies.length) return <ErrorState message={dataError} onRetry={refreshAppData} />;
  if (!filtersHydrated && currentUser?.id) return <LoadingState label="Recuperando filtros salvos..." />;

  const riskTotal = stats.expired + stats.warning;

  return (
    <div className="mx-auto max-w-[1360px] space-y-4 pb-10 text-slate-100">
      {dataError && <ErrorState message={dataError} onRetry={refreshAppData} />}

      <header className="flex flex-col gap-4 border-b border-[#17345d] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#82abff]">Visão geral</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.03em] text-white">Painel de conformidade</h1>
          <p className="mt-1 text-sm text-[#a6b7d4]">Vencimentos, documentos e renovações no mesmo recorte operacional.</p>
          <p className="mt-2 text-xs text-[#7892bd]">Referência do painel: {referenceLabel}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <span className="sr-only">Filtrar empresa</span>
            <select value={filterCompany} onChange={(event) => setFilterCompany(event.target.value)} className="w-full appearance-none rounded-lg border border-[#21436e] bg-[#0b1d39] px-3 py-2.5 pr-9 text-sm font-semibold text-[#d9e4fa]">
              <option value="all">Todas as empresas</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.fantasyName}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#82abff]" />
          </label>
          <Link to="/renovacoes" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2859d6] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3868e5]">
            <Target className="h-4 w-4" /> Abrir renovações
          </Link>
        </div>
      </header>

      <section className="grid divide-y divide-[#17345d] overflow-hidden rounded-lg border border-[#17345d] bg-[#0a1a34] sm:grid-cols-3 sm:divide-x sm:divide-y-0" aria-label="Indicadores de conformidade">
        <Metric icon={Files} label="Licenças no recorte" value={stats.total} detail={`${stats.active} em situação vigente`} tone="blue" />
        <Metric icon={RefreshCw} label="Renovações em curso" value={stats.renewing} detail={stats.renewing ? 'Acompanhe as etapas abertas' : 'Nenhuma etapa aberta'} tone="blue" />
        <Metric icon={ShieldAlert} label="Em risco" value={riskTotal} detail={stats.expired ? `${stats.expired} vencida${stats.expired === 1 ? '' : 's'}` : 'Sem vencimentos'} tone="rose" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-4">
          <section className="overflow-hidden rounded-lg border border-[#17345d] bg-[#091a33]">
            <div className="flex flex-col gap-3 border-b border-[#17345d] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-semibold text-white">Renovações iminentes</h2><p className="mt-1 text-xs text-[#9bafd0]">Priorize a ação antes do vencimento e mantenha a evidência documental acessível.</p></div>
              <Link to={`/licencas?companyId=${filterCompany}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#71a1ff] hover:text-white">Ver todas <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div>
              {upcomingLicenses.length ? (
                <>
                <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#0c203e] text-xs font-semibold text-[#91a7cc]"><tr><th className="px-5 py-3">Licença</th><th className="px-4 py-3">Empresa</th><th className="px-4 py-3">Vencimento</th><th className="px-4 py-3">Renovação</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Ação</th></tr></thead>
                  <tbody className="divide-y divide-[#17345d]">
                    {upcomingLicenses.map((license) => {
                      const status = getStatus(license.expirationDate);
                      return <tr key={license.id} className="transition-colors hover:bg-[#0d2447]">
                        <td className="px-5 py-4"><p className="font-semibold text-white">{license.name}</p><p className="mt-1 text-xs text-[#8398bd]">{license.type}</p></td>
                        <td className="px-4 py-4 text-[#c2d0e7]">{getCompanyName(license.companyId)}</td>
                        <td className="px-4 py-4 font-mono text-xs font-semibold text-[#dce8ff]">{format(parseISO(license.expirationDate), 'dd/MM/yyyy')}</td>
                        <td className="px-4 py-4"><span className={license.isRenewing ? 'rounded border border-[#2458b4] bg-[#102a59] px-2 py-1 text-xs font-medium text-[#8fb6ff]' : 'rounded border border-[#2c4263] bg-[#11213b] px-2 py-1 text-xs font-medium text-[#b4c3d9]'}>{license.isRenewing ? 'Em andamento' : 'Não iniciada'}</span></td>
                        <td className="px-4 py-4"><span className={`rounded border px-2 py-1 text-xs font-semibold ${status.tone}`}>{status.label}</span></td>
                        <td className="px-5 py-4 text-right"><Link to={`/licencas/editar/${license.id}`} className="text-xs font-semibold text-[#71a1ff] hover:text-white">Atualizar</Link></td>
                      </tr>;
                    })}
                  </tbody>
                </table></div>
                <div className="divide-y divide-[#17345d] md:hidden">{upcomingLicenses.map((license) => {
                  const status = getStatus(license.expirationDate);
                  return <article key={license.id} className="space-y-3 px-5 py-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-white">{license.name}</p><p className="mt-1 text-xs text-[#8398bd]">{license.type} · {getCompanyName(license.companyId)}</p></div><span className={`shrink-0 rounded border px-2 py-1 text-xs font-semibold ${status.tone}`}>{status.label}</span></div><div className="flex items-center justify-between gap-3 text-xs"><span className="font-mono font-semibold text-[#dce8ff]">Vence em {format(parseISO(license.expirationDate), 'dd/MM/yyyy')}</span><span className={license.isRenewing ? 'text-[#8fb6ff]' : 'text-[#b4c3d9]'}>{license.isRenewing ? 'Renovação em andamento' : 'Renovação não iniciada'}</span></div><Link to={`/licencas/editar/${license.id}`} className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[#2859d6] px-3 text-sm font-semibold text-[#9fc0ff]">Atualizar licença</Link></article>;
                })}</div>
                </>
              ) : <EmptyPanel />}
            </div>
          </section>

          <section className="rounded-lg border border-[#17345d] bg-[#091a33] p-5"><h2 className="font-semibold text-white">Órgãos e entidades</h2><div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">{institutionLogos.slice(0, 6).map((logo) => <div key={logo.file} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-md bg-[#0d213f] px-2"><img src={assetUrl(`institution-logos-transparent/${logo.file}`)} loading="lazy" decoding="async" alt={logo.name} className="h-8 w-12 object-contain" /><span className="text-center text-[10px] font-semibold text-[#d4e0f5]">{logo.name}</span></div>)}</div></section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-[#17345d] bg-[#0b1d39] p-4"><h2 className="font-semibold text-white">Ações rápidas</h2><div className="mt-3 divide-y divide-[#17345d]"><QuickLink to="/renovacoes" icon={RefreshCw} label="Nova renovação" /><QuickLink to="/licencas/nova" icon={Plus} label="Nova licença" /><QuickLink to="/licencas" icon={FilePlus2} label="Adicionar documento" /></div></section>
          <section className="rounded-lg border border-[#17345d] bg-[#0b1d39] p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-white">Situação do recorte</h2><p className="mt-1 text-xs text-[#9eb2d1]">Calculado em {referenceLabel}</p></div><span className="rounded bg-[#142a4c] px-2 py-1 text-xs font-semibold text-[#dce8ff]">{stats.total} total</span></div><div className="mt-4 space-y-3"><SeverityRow tone="bg-rose-400" label="Vencidas" value={stats.expired} detail="ação imediata" /><SeverityRow tone="bg-amber-400" label="A vencer em 30 dias" value={stats.warning} detail="acompanhar" /><SeverityRow tone="bg-emerald-400" label="Vigentes" value={stats.active} detail="sem ação imediata" /></div><p className="mt-4 border-t border-[#17345d] pt-3 text-xs text-[#b8c9e4]"><strong className="text-white">{riskTotal}</strong> de {stats.total} licença{stats.total === 1 ? '' : 's'} exigem acompanhamento.</p></section>
        </aside>
      </div>

      <section className="rounded-lg border border-[#17345d] bg-[#091a33] p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-white">Análise de pendências</h2><p className="mt-1 text-xs text-[#9bafd0]">Leitura complementar de {filteredLicenses.length} licença{filteredLicenses.length === 1 ? '' : 's'} do recorte atual, com referência em {referenceLabel}.</p></div><button onClick={runAudit} disabled={loadingAi} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#2b5ab5] px-3 py-2 text-sm font-semibold text-[#9fc0ff] hover:bg-[#102a59] disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loadingAi ? 'animate-spin' : ''}`} />{loadingAi ? 'Analisando' : 'Analisar recorte'}</button></div>{aiAnalysis && <><div className="mt-4 grid gap-3 lg:grid-cols-3"><AnalysisBlock title="Resumo" text={aiAnalysis.executiveSummary} /><AnalysisBlock title="Riscos" text={aiAnalysis.immediateRisks.slice(0, 2).join(' · ') || 'Sem riscos imediatos no recorte atual.'} /><AnalysisBlock title="Ações" text={aiAnalysis.recommendedActions.slice(0, 2).map((item) => item.title).join(' · ') || 'Nenhuma ação adicional sugerida.'} /></div><div className="mt-4 flex flex-col gap-2 border-t border-[#17345d] pt-3 text-xs text-[#9bafd0] sm:flex-row sm:items-center sm:justify-between"><p>Base: registros do recorte atual. Confiança da leitura: <strong className="text-[#dce8ff]">{confidenceLabel(aiAnalysis.confidence)}</strong>.</p><div className="flex flex-wrap gap-x-3 gap-y-1">{filteredLicenses.slice(0, 3).map((license) => <Link key={license.id} to={`/licencas/editar/${license.id}`} className="font-medium text-[#8fb6ff] hover:text-white">{license.name}</Link>)}{filteredLicenses.length > 3 && <Link to={`/licencas?companyId=${filterCompany}`} className="font-medium text-[#8fb6ff] hover:text-white">+{filteredLicenses.length - 3} registros</Link>}</div></div></>}</section>
    </div>
  );
};

const Metric = ({ icon: Icon, label, value, detail, tone }: { icon: React.ElementType; label: string; value: number; detail: string; tone: 'blue' | 'rose' }) => {
  const color = tone === 'rose' ? 'text-rose-300 bg-rose-500/10' : 'text-[#8db4ff] bg-[#2453b7]/20';
  return <div className="flex items-center gap-3 px-5 py-4"><span className={`grid h-9 w-9 place-items-center rounded-full ${color}`}><Icon className="h-4 w-4" /></span><div><p className="text-xs text-[#a5b9d7]">{label}</p><p className="mt-0.5 text-2xl font-semibold tracking-tight text-white">{value}</p><p className={`mt-0.5 text-xs ${tone === 'rose' ? 'text-rose-300' : 'text-[#8db4ff]'}`}>{detail}</p></div></div>;
};
const QuickLink = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => <Link to={to} className="flex items-center gap-3 py-3 text-sm text-[#c8d6ed] transition-colors hover:text-white"><Icon className="h-4 w-4 text-[#79a6ff]" /><span className="flex-1">{label}</span><ArrowRight className="h-4 w-4 text-[#6d8dbc]" /></Link>;
const SeverityRow = ({ tone, label, value, detail }: { tone: string; label: string; value: number; detail: string }) => <div className="flex items-center gap-3"><i className={`h-2.5 w-2.5 rounded-full ${tone}`} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-[#dce8ff]">{label}</p><p className="text-xs text-[#91a7cc]">{detail}</p></div><strong className="text-lg text-white">{value}</strong></div>;
const confidenceLabel = (confidence: AuditAnalysis['confidence']) => ({ high: 'alta', medium: 'média', low: 'baixa' }[confidence]);
const AnalysisBlock = ({ title, text }: { title: string; text: string }) => <div className="rounded-md bg-[#0d213f] p-3"><p className="text-xs font-semibold text-[#8fb6ff]">{title}</p><p className="mt-2 text-xs leading-5 text-[#c7d5ec]">{text}</p></div>;
const EmptyPanel = () => <div className="p-10 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" /><p className="mt-3 font-semibold text-white">Nenhuma renovação no recorte atual</p><p className="mt-1 text-sm text-[#9bafd0]">As licenças selecionadas estão em dia.</p></div>;

export default Dashboard;
