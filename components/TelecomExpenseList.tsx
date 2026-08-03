import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Edit2, FileBarChart2, Filter, Plus, Printer, ReceiptText, Trash2, WalletCards } from 'lucide-react';
import { Link, useSearchParams } from '../utils/router';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../context/FeedbackContext';
import { EXPENSE_CATEGORIES, EXPENSE_COMPANIES } from '../types';
import { EmptyState, ErrorState, LoadingState } from './AsyncState';
import { htmlEscape } from '../utils/htmlEscape';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatMonth = (value: string) => {
  const [year, month] = value.split('-').map(Number);
  return Number.isFinite(year) && Number.isFinite(month) ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1)) : value;
};

const TelecomExpenseList: React.FC = () => {
  const { telecomExpenses, userRole, deleteTelecomExpense, isDataLoading, dataError, refreshAppData } = useApp();
  const { confirmAction, showToast } = useFeedback();
  const [searchParams] = useSearchParams();
  const queryMonth = searchParams.get('month') || '';
  const queryCategory = searchParams.get('category') || 'all';
  const [month, setMonth] = useState(/^\d{4}-(0[1-9]|1[0-2])$/.test(queryMonth) ? queryMonth : '');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES.includes(queryCategory as typeof EXPENSE_CATEGORIES[number]) ? queryCategory : 'all');
  const [companyNameFilter, setCompanyNameFilter] = useState('all');
  useEffect(() => {
    setMonth(/^\d{4}-(0[1-9]|1[0-2])$/.test(queryMonth) ? queryMonth : '');
    setCategory(EXPENSE_CATEGORIES.includes(queryCategory as typeof EXPENSE_CATEGORIES[number]) ? queryCategory : 'all');
  }, [queryCategory, queryMonth]);
  const expenses = useMemo(() => telecomExpenses.filter(expense =>
    (!month || expense.dueMonth === month) &&
    (category === 'all' || expense.category === category) &&
    (companyNameFilter === 'all' || expense.companyName === companyNameFilter)
  ).sort((a, b) => b.dueMonth.localeCompare(a.dueMonth) || a.category.localeCompare(b.category)), [telecomExpenses, month, category, companyNameFilter]);
  const totals = useMemo(() => expenses.reduce((acc, expense) => ({ amount: acc.amount + expense.amount, lateFee: acc.lateFee + expense.lateFee }), { amount: 0, lateFee: 0 }), [expenses]);

  const printReport = () => {
    const report = window.open('', '_blank', 'width=1100,height=750');
    if (!report) {
      showToast({ type: 'warning', title: 'Permita a abertura do relatório', description: 'O navegador bloqueou a janela de impressão.' });
      return;
    }
    const rows = expenses.map(expense => `<tr><td>${htmlEscape(expense.companyName)}</td><td>${htmlEscape(expense.category)}</td><td>${htmlEscape(formatMonth(expense.dueMonth))}</td><td>${currency.format(expense.amount)}</td><td>${htmlEscape(formatMonth(expense.previousYearDueMonth))}</td><td>${currency.format(expense.previousYearAmount)}</td><td>${currency.format(expense.lateFee)}</td></tr>`).join('');
    report.document.write(`<!doctype html><html lang="pt-BR"><head><title>Relatório de despesas de telecom</title><style>body{font-family:Arial,sans-serif;color:#12213f;padding:32px}h1{margin:0;color:#173c91}p{color:#53647f}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:11px;border-bottom:1px solid #d9e1ee;text-align:left}th{background:#eff4fb;font-size:12px;text-transform:uppercase;letter-spacing:.06em}td:nth-last-child(-n+3),th:nth-last-child(-n+3){text-align:right}.total{margin-top:24px;display:flex;gap:24px;font-weight:bold}.total span{padding:12px 16px;background:#eff4fb;border-radius:8px}</style></head><body><h1>Despesas de telecom e serviços</h1><p>Relatório gerado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}. Itens exibidos: ${expenses.length}.</p><table><thead><tr><th>Unidade</th><th>Serviço</th><th>Período atual</th><th>Valor atual</th><th>Período anterior</th><th>Valor anterior</th><th>Multa</th></tr></thead><tbody>${rows || '<tr><td colspan="7">Nenhuma despesa no filtro atual.</td></tr>'}</tbody></table><div class="total"><span>Valor atual: ${currency.format(totals.amount)}</span><span>Multas: ${currency.format(totals.lateFee)}</span><span>Total: ${currency.format(totals.amount + totals.lateFee)}</span></div><script>window.print()</script></body></html>`);
    report.document.close();
  };

  if (isDataLoading && telecomExpenses.length === 0) return <LoadingState label="Carregando despesas..." />;
  if (dataError && telecomExpenses.length === 0) return <ErrorState message={dataError} onRetry={refreshAppData} />;

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 pb-14">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#8fb6ff]">Financeiro operacional</p><h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">Despesas de <span className="text-[#8fb6ff]">telecom</span></h1><p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#a6b7d4]"><ReceiptText className="h-4 w-4" /> Controle de telefonia, conectividade, ferramentas e serviços essenciais.</p></div>
        <div className="flex flex-wrap gap-3"><Link to="/despesas-telecom/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#21436e] bg-[#0b1d39] px-4 py-3 text-sm font-semibold text-[#dce8ff] transition-colors hover:bg-[#102a59]"><FileBarChart2 className="h-4 w-4" /> Dashboard</Link><button type="button" onClick={printReport} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#21436e] bg-[#0b1d39] px-4 py-3 text-sm font-semibold text-[#dce8ff] transition-colors hover:bg-[#102a59]"><Printer className="h-4 w-4" /> Imprimir relatório</button>{userRole === 'admin' && <Link to="/despesas-telecom/nova" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2859d6] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3868e5]"><Plus className="h-4 w-4" /> Nova despesa</Link>}</div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="legacy-panel p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#91a7cc]">Valor no filtro</p><p className="mt-3 font-display text-3xl font-bold text-white">{currency.format(totals.amount)}</p><p className="mt-2 text-sm text-[#a6b7d4]">{expenses.length} lançamento(s)</p></div>
        <div className="legacy-panel p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#91a7cc]">Multas registradas</p><p className="mt-3 font-display text-3xl font-bold text-amber-300">{currency.format(totals.lateFee)}</p><p className="mt-2 text-sm text-[#a6b7d4]">Incidências no período</p></div>
        <div className="legacy-panel p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#91a7cc]">Custo consolidado</p><p className="mt-3 font-display text-3xl font-bold text-[#8fb6ff]">{currency.format(totals.amount + totals.lateFee)}</p><p className="mt-2 text-sm text-[#a6b7d4]">Serviços + multas</p></div>
      </section>

      <section className="legacy-panel p-5"><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Filter className="h-4 w-4 text-[#8fb6ff]" /> Filtros do relatório</div><div className="grid gap-4 md:grid-cols-4"><label className="text-sm text-[#b9c9e3]">Mês<input type="month" value={month} onChange={event => setMonth(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[#21436e] bg-[#071a34] px-3 text-white" /></label><label className="text-sm text-[#b9c9e3]">Serviço<select value={category} onChange={event => setCategory(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[#21436e] bg-[#071a34] px-3 text-white"><option value="all">Todos</option>{EXPENSE_CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}</select></label><label className="text-sm text-[#b9c9e3]">Unidade<select value={companyNameFilter} onChange={event => setCompanyNameFilter(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[#21436e] bg-[#071a34] px-3 text-white"><option value="all">Todas</option>{EXPENSE_COMPANIES.map(company => <option key={company} value={company}>{company}</option>)}</select></label><div className="flex items-end"><button type="button" onClick={() => { setMonth(''); setCategory('all'); setCompanyNameFilter('all'); }} className="min-h-11 w-full rounded-lg border border-[#21436e] px-4 text-sm font-semibold text-[#dce8ff] transition-colors hover:bg-[#102a59]">Limpar filtros</button></div></div></section>

      {expenses.length === 0 ? <EmptyState title="Nenhuma despesa encontrada" description="Ajuste os filtros ou cadastre o primeiro serviço para começar o controle." action={userRole === 'admin' ? <Link to="/despesas-telecom/nova" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2859d6] px-5 py-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Cadastrar despesa</Link> : undefined} /> : <section className="legacy-panel overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-[#17345d]"><thead className="bg-[#0d213f]"><tr>{['Unidade', 'Serviço', 'Período atual', 'Valor atual', 'Período anterior', 'Valor anterior', 'Multa', 'Ações'].map(label => <th key={label} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.1em] text-[#91a7cc]">{label}</th>)}</tr></thead><tbody className="divide-y divide-[#17345d]">{expenses.map(expense => <tr key={expense.id} className="transition-colors hover:bg-[#0d213f]"><td className="px-5 py-4"><p className="font-semibold text-white">{expense.companyName}</p>{expense.notes && <p className="mt-1 max-w-xs truncate text-xs text-[#91a7cc]">{expense.notes}</p>}</td><td className="px-5 py-4 text-sm font-medium text-[#dce8ff]">{expense.category}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-sm text-[#b9c9e3]"><CalendarDays className="h-4 w-4 text-[#8fb6ff]" />{formatMonth(expense.dueMonth)}</span></td><td className="px-5 py-4 text-sm font-semibold text-white">{currency.format(expense.amount)}</td><td className="px-5 py-4 text-sm text-[#b9c9e3]">{formatMonth(expense.previousYearDueMonth)}</td><td className="px-5 py-4 text-sm font-semibold text-[#8fb6ff]">{currency.format(expense.previousYearAmount)}</td><td className="px-5 py-4 text-sm font-semibold text-amber-300">{expense.lateFee ? currency.format(expense.lateFee) : '—'}</td><td className="px-5 py-4">{userRole === 'admin' ? <div className="flex gap-2"><Link to={`/despesas-telecom/editar/${expense.id}`} title="Alterar despesa" aria-label={`Alterar ${expense.category}`} className="legacy-control grid place-items-center rounded-md border border-[#21436e] bg-[#0b1d39] text-[#b9c9e3] transition-colors hover:border-[#73a0ff] hover:text-white"><Edit2 className="h-4 w-4" /></Link><button type="button" title="Excluir despesa" aria-label={`Excluir ${expense.category}`} onClick={async () => { const confirmed = await confirmAction({ title: 'Excluir despesa?', description: 'Esse lançamento será removido do relatório financeiro.', confirmText: 'Excluir', tone: 'danger' }); if (!confirmed) return; if (await deleteTelecomExpense(expense.id)) showToast({ type: 'success', title: 'Despesa excluída', description: 'O lançamento foi removido com sucesso.' }); }} className="legacy-control grid place-items-center rounded-md border border-[#21436e] bg-[#0b1d39] text-rose-300 transition-colors hover:border-rose-400 hover:text-rose-100"><Trash2 className="h-4 w-4" /></button></div> : <span className="text-sm text-[#91a7cc]">Consulta</span>}</td></tr>)}</tbody></table></div></section>}

      <div className="flex items-center gap-2 text-xs text-[#91a7cc]"><FileBarChart2 className="h-4 w-4" /> O relatório respeita os filtros aplicados na tela.</div>
    </div>
  );
};

export default TelecomExpenseList;
