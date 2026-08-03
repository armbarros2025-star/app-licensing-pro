import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building2, CalendarDays, ReceiptText, Save, ShieldAlert, WalletCards } from 'lucide-react';
import { useNavigate, useParams } from '../utils/router';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../context/FeedbackContext';
import { EXPENSE_CATEGORIES, EXPENSE_COMPANIES, ExpenseCategory } from '../types';
import { EmptyState, ErrorState, LoadingState } from './AsyncState';

const getBrazilMonth = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value || String(date.getFullYear());
  const month = parts.find(part => part.type === 'month')?.value || String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const TelecomExpenseForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { telecomExpenses, addTelecomExpense, updateTelecomExpense, isDataLoading, dataError, refreshAppData } = useApp();
  const { showToast } = useFeedback();
  const existing = id ? telecomExpenses.find(expense => expense.id === id) : null;
  const [companyName, setCompanyName] = useState('CHEMISCH-FABRICA');
  const [category, setCategory] = useState<ExpenseCategory>('Telefonia fixa');
  const [dueMonth, setDueMonth] = useState('');
  const [amount, setAmount] = useState('');
  const [lateFee, setLateFee] = useState('0');
  const [previousYearDueMonth, setPreviousYearDueMonth] = useState('');
  const [previousYearAmount, setPreviousYearAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setInitialized(false);
  }, [id]);

  useEffect(() => {
    if (initialized || isDataLoading) return;
    if (existing) {
      setCompanyName(existing.companyName);
      setCategory(existing.category);
      setDueMonth(existing.dueMonth);
      setAmount(String(existing.amount));
      setLateFee(String(existing.lateFee));
      setPreviousYearDueMonth(existing.previousYearDueMonth);
      setPreviousYearAmount(String(existing.previousYearAmount));
      setNotes(existing.notes || '');
    } else if (!id) {
      setCompanyName(EXPENSE_COMPANIES[0]);
      const currentMonth = getBrazilMonth(new Date());
      setDueMonth(currentMonth);
      setPreviousYearDueMonth(`${Number(currentMonth.slice(0, 4)) - 1}-${currentMonth.slice(5)}`);
    }
    setInitialized(true);
  }, [existing, id, initialized, isDataLoading]);

  const parseCurrency = (value: string) => {
    const cleaned = value.trim().replace(/[^\d,.-]/g, '');
    const normalized = cleaned.includes(',')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = parseCurrency(amount);
    const parsedLateFee = parseCurrency(lateFee || '0');
    const parsedPreviousYearAmount = parseCurrency(previousYearAmount);
    if (!companyName || !dueMonth || !previousYearDueMonth || parsedAmount === null || parsedAmount < 0 || parsedLateFee === null || parsedLateFee < 0 || parsedPreviousYearAmount === null || parsedPreviousYearAmount < 0 || saving) {
      showToast({ type: 'warning', title: 'Revise os dados', description: 'Informe unidade, os dois meses de referência e valores válidos.' });
      return;
    }

    setSaving(true);
    try {
      const payload = { companyName, category, dueMonth, amount: parsedAmount, lateFee: parsedLateFee, previousYearDueMonth, previousYearAmount: parsedPreviousYearAmount, notes };
      const success = id ? await updateTelecomExpense(id, payload) : await addTelecomExpense(payload);
      if (success) {
        showToast({
          type: 'success',
          title: id ? 'Despesa atualizada' : 'Despesa cadastrada',
          description: `${category} foi salva para o período informado.`
        });
        navigate('/despesas-telecom');
      }
    } finally {
      setSaving(false);
    }
  };

  if (isDataLoading && !initialized) return <LoadingState label="Carregando cadastro de despesa..." />;
  if (dataError && telecomExpenses.length === 0) return <ErrorState message={dataError} onRetry={refreshAppData} />;
  if (id && !isDataLoading && !existing) {
    return <EmptyState title="Despesa não encontrada" description="Esse registro pode ter sido removido." action={<button type="button" onClick={() => navigate('/despesas-telecom')} className="rounded-lg bg-[#2859d6] px-5 py-3 text-sm font-semibold text-white">Voltar para despesas</button>} />;
  }
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <button type="button" onClick={() => navigate('/despesas-telecom')} className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#a6b7d4] transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Voltar para despesas
          </button>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#8fb6ff]">Controle financeiro</p>
          <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">
            {id ? 'Alterar' : 'Cadastrar'} <span className="text-[#8fb6ff]">despesa</span>
          </h1>
          <p className="mt-3 text-sm font-medium text-[#a6b7d4]">Registre a recorrência mensal e deixe o custo por serviço rastreável.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#17345d] bg-[#091a33] px-4 py-3 text-sm text-[#b9c9e3]">
          <ReceiptText className="h-4 w-4 text-[#8fb6ff]" /> Dados protegidos por auditoria
        </div>
      </header>

      <form onSubmit={handleSubmit} aria-busy={saving} className="space-y-6">
        <section className="legacy-panel overflow-hidden">
          <div className="border-b border-[#17345d] bg-[#0d213f] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-[#173c91] text-white"><WalletCards className="h-5 w-5" /></div>
              <div><h2 className="font-display text-xl font-semibold text-white">Identificação da despesa</h2><p className="mt-1 text-sm text-[#a6b7d4]">Vincule o serviço à empresa responsável.</p></div>
            </div>
          </div>
          <div className="grid gap-5 p-6 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-[#dce8ff]">
              <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[#8fb6ff]" /> Empresa / unidade</span>
              <select value={companyName} onChange={event => setCompanyName(event.target.value)} className="h-12 w-full rounded-lg border border-[#21436e] bg-[#071a34] px-4 text-sm text-white outline-none transition-colors focus:border-[#73a0ff]">
                {!EXPENSE_COMPANIES.includes(companyName as typeof EXPENSE_COMPANIES[number]) && <option value={companyName}>{companyName}</option>}
                {EXPENSE_COMPANIES.map(company => <option key={company} value={company}>{company}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-[#dce8ff]">
              <span className="flex items-center gap-2"><ReceiptText className="h-4 w-4 text-[#8fb6ff]" /> Serviço contratado</span>
              <select value={category} onChange={event => setCategory(event.target.value as ExpenseCategory)} className="h-12 w-full rounded-lg border border-[#21436e] bg-[#071a34] px-4 text-sm text-white outline-none transition-colors focus:border-[#73a0ff]">
                {EXPENSE_CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="legacy-panel overflow-hidden">
          <div className="border-b border-[#17345d] bg-[#0d213f] px-6 py-5">
            <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-md bg-[#173c91] text-white"><CalendarDays className="h-5 w-5" /></div><div><h2 className="font-display text-xl font-semibold text-white">Vencimento e valores</h2><p className="mt-1 text-sm text-[#a6b7d4]">Use a competência mensal para manter o relatório organizado.</p></div></div>
          </div>
          <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm font-semibold text-[#dce8ff]">Mês de vencimento atual<input required type="month" value={dueMonth} onChange={event => setDueMonth(event.target.value)} className="h-12 w-full rounded-lg border border-[#21436e] bg-[#071a34] px-4 text-sm text-white outline-none transition-colors focus:border-[#73a0ff]" /></label>
            <label className="space-y-2 text-sm font-semibold text-[#dce8ff]">Valor atual (R$)<input required inputMode="decimal" type="text" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0,00" className="h-12 w-full rounded-lg border border-[#21436e] bg-[#071a34] px-4 text-sm text-white outline-none transition-colors focus:border-[#73a0ff]" /></label>
            <label className="space-y-2 text-sm font-semibold text-[#dce8ff]">Mês equivalente no ano anterior<input required type="month" value={previousYearDueMonth} onChange={event => setPreviousYearDueMonth(event.target.value)} className="h-12 w-full rounded-lg border border-[#21436e] bg-[#071a34] px-4 text-sm text-white outline-none transition-colors focus:border-[#73a0ff]" /></label>
            <label className="space-y-2 text-sm font-semibold text-[#dce8ff]">Valor no ano anterior (R$)<input required inputMode="decimal" type="text" value={previousYearAmount} onChange={event => setPreviousYearAmount(event.target.value)} placeholder="0,00" className="h-12 w-full rounded-lg border border-[#21436e] bg-[#071a34] px-4 text-sm text-white outline-none transition-colors focus:border-[#73a0ff]" /></label>
          </div>
          <div className="grid gap-5 border-t border-[#17345d] px-6 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <label className="space-y-2 text-sm font-semibold text-[#dce8ff]"><span className="flex items-center gap-2">Multa, se houver <ShieldAlert className="h-4 w-4 text-amber-300" /></span><input inputMode="decimal" type="text" value={lateFee} onChange={event => setLateFee(event.target.value)} placeholder="0,00" className="h-12 w-full rounded-lg border border-[#21436e] bg-[#071a34] px-4 text-sm text-white outline-none transition-colors focus:border-[#73a0ff]" /></label>
            <label className="space-y-2 text-sm font-semibold text-[#dce8ff]">Observações <span className="font-normal text-[#91a7cc]">(opcional)</span><textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={2000} rows={4} placeholder="Ex.: contrato, reajuste, número de linhas ou condição de cobrança." className="w-full rounded-lg border border-[#21436e] bg-[#071a34] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#6e83a7] focus:border-[#73a0ff]" /></label>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-[#17345d] pt-6 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => navigate('/despesas-telecom')} className="min-h-11 rounded-lg border border-[#21436e] px-5 py-3 text-sm font-semibold text-[#dce8ff] transition-colors hover:bg-[#102a59]">Cancelar</button>
          <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2859d6] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3868e5] disabled:opacity-70"><Save className="h-4 w-4" />{saving ? 'Salvando...' : 'Salvar despesa'}</button>
        </div>
      </form>
    </div>
  );
};

export default TelecomExpenseForm;
