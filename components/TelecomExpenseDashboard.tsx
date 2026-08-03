import React, { useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, TrendingDown, TrendingUp, WalletCards } from 'lucide-react';
import { Link } from '../utils/router';
import { useApp } from '../context/AppContext';
import { EXPENSE_CATEGORIES } from '../types';
import { EmptyState, ErrorState, LoadingState } from './AsyncState';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const currentYear = new Date().getFullYear();
const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const currentBrazilMonth = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', month: '2-digit' }).format(new Date());

const describeVariation = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? { text: 'Sem variação', tone: 'text-[#a6b7d4]' } : { text: 'Sem base anterior', tone: 'text-amber-200' };
  const percentage = ((current - previous) / previous) * 100;
  if (percentage > 0) return { text: `Aumento de ${percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`, tone: 'text-rose-300' };
  if (percentage < 0) return { text: `Redução de ${Math.abs(percentage).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`, tone: 'text-emerald-300' };
  return { text: 'Sem variação', tone: 'text-[#a6b7d4]' };
};

const TelecomExpenseDashboard: React.FC = () => {
  const { telecomExpenses, isDataLoading, dataError, refreshAppData } = useApp();
  const [year, setYear] = useState(String(currentYear));
  const dashboard = useMemo(() => {
    const previousYear = String(Number(year) - 1);
    const current = telecomExpenses.filter(expense => expense.dueMonth.startsWith(year));
    const previous = telecomExpenses.filter(expense => expense.previousYearDueMonth.startsWith(previousYear));
    const currentTotal = current.reduce((sum, expense) => sum + expense.amount + expense.lateFee, 0);
    const previousTotal = previous.reduce((sum, expense) => sum + expense.previousYearAmount, 0);
    const month = `${year}-${currentBrazilMonth}`;
    const currentMonth = telecomExpenses.filter(expense => expense.dueMonth === month).reduce((sum, expense) => sum + expense.amount + expense.lateFee, 0);
    const priorComparableMonth = `${Number(year) - 1}-${currentBrazilMonth}`;
    const previousMonth = telecomExpenses.filter(expense => expense.previousYearDueMonth === priorComparableMonth).reduce((sum, expense) => sum + expense.previousYearAmount, 0);
    const months = monthLabels.map((label, index) => {
      const monthNumber = String(index + 1).padStart(2, '0');
      const currentPeriod = `${year}-${monthNumber}`;
      const previousPeriod = `${Number(year) - 1}-${monthNumber}`;
      return {
        label,
        current: telecomExpenses.filter(expense => expense.dueMonth === currentPeriod).reduce((sum, expense) => sum + expense.amount + expense.lateFee, 0),
        previous: telecomExpenses.filter(expense => expense.previousYearDueMonth === previousPeriod).reduce((sum, expense) => sum + expense.previousYearAmount, 0)
      };
    });
    const categories = EXPENSE_CATEGORIES.map(category => ({
      category,
      current: current.filter(expense => expense.category === category).reduce((sum, expense) => sum + expense.amount + expense.lateFee, 0),
      previous: previous.filter(expense => expense.category === category).reduce((sum, expense) => sum + expense.previousYearAmount, 0)
    })).filter(item => item.current || item.previous);
    return {
      current,
      currentTotal,
      previousTotal,
      currentMonth,
      previousMonth,
      months,
      categories,
      currentMonthsWithData: new Set(current.map(expense => expense.dueMonth)).size,
      previousMonthsWithData: new Set(previous.map(expense => expense.previousYearDueMonth)).size
    };
  }, [telecomExpenses, year]);
  const variation = dashboard.currentTotal - dashboard.previousTotal;
  const monthlyVariation = dashboard.currentMonth - dashboard.previousMonth;
  const annualVariation = describeVariation(dashboard.currentTotal, dashboard.previousTotal);
  const monthlyVariationLabel = describeVariation(dashboard.currentMonth, dashboard.previousMonth);
  const chartMax = Math.max(...dashboard.months.flatMap(month => [month.current, month.previous]), 1);
  const years = Array.from(new Set([String(currentYear), ...telecomExpenses.map(expense => expense.dueMonth.slice(0, 4)).filter(Boolean)])).sort().reverse();
  const referenceMonthName = monthLabels[Number(currentBrazilMonth) - 1] || currentBrazilMonth;

  if (isDataLoading && telecomExpenses.length === 0) return <LoadingState label="Carregando dashboard de despesas..." />;
  if (dataError && telecomExpenses.length === 0) return <ErrorState message={dataError} onRetry={refreshAppData} />;
  if (!telecomExpenses.length) return <EmptyState title="Ainda não há despesas para comparar" description="Cadastre os valores atual e do ano anterior para habilitar os indicadores financeiros." action={<Link to="/despesas-telecom/nova" className="rounded-lg bg-[#2859d6] px-5 py-3 text-sm font-semibold text-white">Cadastrar primeira despesa</Link>} />;

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 pb-14">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div><Link to="/despesas-telecom" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#a6b7d4] transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" /> Voltar para despesas</Link><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#8fb6ff]">Visão gerencial</p><h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">Dashboard de <span className="text-[#8fb6ff]">despesas</span></h1><p className="mt-3 text-sm font-medium text-[#a6b7d4]">Compare custos mensais e anuais com a referência do ano anterior.</p></div>
        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-[#21436e] bg-[#091a33] px-4 py-1 text-sm font-semibold text-[#dce8ff]"><span>Ano analisado</span><select value={year} onChange={event => setYear(event.target.value)} className="min-h-10 bg-transparent text-white outline-none">{years.map(item => <option key={item} value={item} className="bg-[#091a33]">{item}</option>)}</select></label>
      </header>

      <section className="legacy-panel overflow-hidden" aria-label="Resumo comparativo">
        <div className="grid lg:grid-cols-[1.4fr_1fr_1fr]">
          <article className="border-b border-[#17345d] bg-[#0d213f] px-6 py-6 lg:border-b-0 lg:border-r"><div className="flex items-center justify-between text-[#b9c9e3]"><span className="text-sm font-semibold">Variação anual</span>{variation > 0 ? <TrendingUp className="h-5 w-5 text-rose-300" aria-hidden="true" /> : <TrendingDown className="h-5 w-5 text-emerald-300" aria-hidden="true" />}</div><p className={`mt-5 font-display text-4xl font-bold tracking-[-0.03em] ${variation > 0 ? 'text-rose-300' : variation < 0 ? 'text-emerald-300' : 'text-white'}`}>{currency.format(variation)}</p><p className={`mt-2 text-base font-semibold ${annualVariation.tone}`}>{annualVariation.text}</p><p className="mt-4 text-xs text-[#91a7cc]">Base comparável: {dashboard.currentMonthsWithData} mês(es) em {year} · {dashboard.previousMonthsWithData} em {Number(year) - 1}</p></article>
          <article className="border-b border-[#17345d] px-6 py-6 lg:border-b-0 lg:border-r"><div className="flex items-center justify-between text-[#91a7cc]"><span className="text-sm font-semibold">Gasto anual</span><WalletCards className="h-5 w-5" aria-hidden="true" /></div><p className="mt-5 font-display text-3xl font-bold text-white">{currency.format(dashboard.currentTotal)}</p><p className="mt-2 text-sm text-[#a6b7d4]">{dashboard.current.length} lançamento(s) em {year}</p></article>
          <article className="px-6 py-6"><div className="flex items-center justify-between text-[#91a7cc]"><span className="text-sm font-semibold">Ano anterior</span><CalendarDays className="h-5 w-5" aria-hidden="true" /></div><p className="mt-5 font-display text-3xl font-bold text-[#8fb6ff]">{currency.format(dashboard.previousTotal)}</p><p className="mt-2 text-sm text-[#a6b7d4]">Valores informados para {Number(year) - 1}</p></article>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#17345d] px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[#dce8ff]">Variação de {referenceMonthName}</p><p className="mt-1 text-xs text-[#91a7cc]">{referenceMonthName} de {year} comparado a {referenceMonthName} de {Number(year) - 1}</p><Link to={`/despesas-telecom?month=${year}-${currentBrazilMonth}`} className="mt-3 inline-flex text-xs font-semibold text-[#8fb6ff] hover:text-white">Ver lançamentos deste mês</Link></div><div className="sm:text-right"><p className={`font-display text-2xl font-bold ${monthlyVariation > 0 ? 'text-rose-300' : monthlyVariation < 0 ? 'text-emerald-300' : 'text-white'}`}>{currency.format(monthlyVariation)}</p><p className={`mt-1 text-sm font-semibold ${monthlyVariationLabel.tone}`}>{monthlyVariationLabel.text}</p></div></div>
      </section>

      <section className="legacy-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#17345d] bg-[#0d213f] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-xl font-semibold text-white">Evolução mensal de despesas</h2><p className="mt-1 text-sm text-[#a6b7d4]">Comparação entre {year} e {Number(year) - 1}, por mês de vencimento.</p></div><div className="flex items-center gap-4 text-xs font-semibold text-[#b9c9e3]"><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-[#3868e5]" />{year}</span><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-[#6e83a7]" />{Number(year) - 1}</span></div></div>
        <div className="px-6 pb-6 pt-6"><p id="monthly-chart-description" className="mb-5 text-xs text-[#91a7cc]">Barras azuis representam {year}; barras cinza-azuladas representam {Number(year) - 1}. Consulte a tabela para valores exatos.</p><div className="grid grid-cols-6 items-end gap-x-3 gap-y-6 sm:grid-cols-12" role="img" aria-describedby="monthly-chart-description" aria-label={`Gráfico de despesas mensais de ${year} comparadas a ${Number(year) - 1}`}>
          {dashboard.months.map(month => <div key={month.label} className="flex min-h-[170px] flex-col justify-end sm:min-h-[240px]"><div className="flex flex-1 items-end justify-center gap-1.5 border-b border-[#21436e] pb-2" aria-hidden="true"><div className="w-3 rounded-t-sm bg-[#3868e5]" style={{ height: `${Math.max((month.current / chartMax) * 190, month.current ? 4 : 0)}px` }} /><div className="w-3 rounded-t-sm bg-[#6e83a7]" style={{ height: `${Math.max((month.previous / chartMax) * 190, month.previous ? 4 : 0)}px` }} /></div><p className="mt-3 text-center text-xs font-semibold text-[#a6b7d4]">{month.label}</p></div>)}
        </div><details className="mt-6 border-t border-[#17345d] pt-4"><summary className="cursor-pointer text-sm font-semibold text-[#8fb6ff]">Consultar valores mensais em tabela</summary><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><caption className="sr-only">Valores mensais de despesas de {year} e {Number(year) - 1}</caption><thead className="border-b border-[#21436e] text-xs text-[#a6b7d4]"><tr><th className="px-3 py-2 font-semibold">Mês</th><th className="px-3 py-2 text-right font-semibold">{year}</th><th className="px-3 py-2 text-right font-semibold">{Number(year) - 1}</th></tr></thead><tbody className="divide-y divide-[#17345d]">{dashboard.months.map(month => <tr key={`${month.label}-table`}><th scope="row" className="px-3 py-2 font-medium text-white">{month.label}</th><td className="px-3 py-2 text-right text-[#dce8ff]">{currency.format(month.current)}</td><td className="px-3 py-2 text-right text-[#b9c9e3]">{currency.format(month.previous)}</td></tr>)}</tbody></table></div></details></div>
      </section>

      <section className="legacy-panel overflow-hidden"><div className="border-b border-[#17345d] bg-[#0d213f] px-6 py-5"><h2 className="font-display text-xl font-semibold text-white">Comparação anual por serviço</h2><p className="mt-1 text-sm text-[#a6b7d4]">Custos consolidados, incluindo multas do período atual.</p></div><div className="divide-y divide-[#17345d]">{dashboard.categories.map(item => { const max = Math.max(item.current, item.previous, 1); const delta = item.current - item.previous; return <div key={item.category} className="grid gap-4 px-6 py-5 md:grid-cols-[minmax(170px,1fr)_minmax(0,2fr)_auto]"><div><p className="font-semibold text-white">{item.category}</p><p className={`mt-1 text-sm ${delta > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{delta > 0 ? '+' : ''}{currency.format(delta)}</p></div><div className="space-y-3"><div><div className="mb-1 flex justify-between text-xs text-[#b9c9e3]"><span>{year}</span><span>{currency.format(item.current)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#071a34]"><div className="h-full rounded-full bg-[#3868e5]" style={{ width: `${(item.current / max) * 100}%` }} /></div></div><div><div className="mb-1 flex justify-between text-xs text-[#b9c9e3]"><span>{Number(year) - 1}</span><span>{currency.format(item.previous)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#071a34]"><div className="h-full rounded-full bg-[#6e83a7]" style={{ width: `${(item.previous / max) * 100}%` }} /></div></div></div><div className="text-right text-xs text-[#91a7cc]">Atual<br />Anterior</div></div>; })}</div></section>
    </div>
  );
};

export default TelecomExpenseDashboard;
