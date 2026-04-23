import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  List,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  Undo2
} from 'lucide-react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../context/FeedbackContext';
import { License } from '../types';
import { ErrorState, EmptyState, LoadingState } from './AsyncState';
import {
  RenewalUrgencyFilter,
  readRenewalFilterState,
  writeRenewalFilterState
} from '../utils/filterPersistence';

type RenewalStatus = 'critical' | 'upcoming' | 'renewing' | 'stable';

interface RenewalItem {
  license: License;
  companyId: string;
  companyName: string;
  companyCnpj: string;
  companyActive: boolean;
  daysRemaining: number;
  urgency: RenewalStatus;
  statusLabel: string;
  urgencyRank: number;
}

interface RenewalGroup {
  companyId: string;
  companyName: string;
  companyCnpj: string;
  companyActive: boolean;
  items: RenewalItem[];
  criticalCount: number;
  upcomingCount: number;
  renewingCount: number;
}

const todayIso = () => format(new Date(), 'yyyy-MM-dd');
const VALID_URGENCY_FILTERS: RenewalUrgencyFilter[] = ['all', 'critical', 'upcoming', 'renewing'];

const RenewalCenter: React.FC = () => {
  const {
    licenses,
    companies,
    currentUser,
    userRole,
    updateLicense,
    isDataLoading,
    dataError,
    refreshAppData
  } = useApp();
  const { confirmAction, showToast } = useFeedback();
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState<RenewalUrgencyFilter>('all');
  const [sortBy, setSortBy] = useState('urgency');
  const [viewMode, setViewMode] = useState('grouped');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filtersHydrated, setFiltersHydrated] = useState(false);

  const items = useMemo<RenewalItem[]>(() => {
    const now = new Date();

    return licenses
      .map((license) => {
        const company = companies.find(item => item.id === license.companyId);
        const expirationDate = parseISO(license.expirationDate);
        const daysRemaining = differenceInDays(expirationDate, now);
        const renewing = Boolean(license.isRenewing);
        const statusLabel = renewing
          ? 'Em renovação'
          : daysRemaining < 0
            ? 'Vencida'
            : daysRemaining <= 30
              ? 'Crítica'
              : daysRemaining <= 90
                ? 'Próxima'
                : 'Estável';

        let urgency: RenewalStatus = 'stable';
        if (renewing) urgency = 'renewing';
        else if (daysRemaining < 0 || daysRemaining <= 30) urgency = 'critical';
        else if (daysRemaining <= 90) urgency = 'upcoming';

        const urgencyRank = renewing ? 0 : daysRemaining < 0 ? 1 : daysRemaining <= 30 ? 2 : 3;

        return {
          license,
          companyId: license.companyId,
          companyName: company?.fantasyName || 'Empresa não encontrada',
          companyCnpj: company?.cnpj || 'N/A',
          companyActive: company?.active ?? false,
          daysRemaining,
          urgency,
          statusLabel,
          urgencyRank
        };
      })
      .filter(item => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          query.length === 0 ||
          item.license.name.toLowerCase().includes(query) ||
          item.companyName.toLowerCase().includes(query) ||
          item.license.type.toLowerCase().includes(query);
        const matchesCompany = companyFilter === 'all' || item.license.companyId === companyFilter;
        const matchesUrgency = urgencyFilter === 'all' || item.urgency === urgencyFilter;
        return item.urgency !== 'stable' && matchesSearch && matchesCompany && matchesUrgency;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'company':
            return a.companyName.localeCompare(b.companyName) || a.urgencyRank - b.urgencyRank || a.daysRemaining - b.daysRemaining;
          case 'name':
            return a.license.name.localeCompare(b.license.name) || a.urgencyRank - b.urgencyRank || a.daysRemaining - b.daysRemaining;
          case 'expiry':
            return a.daysRemaining - b.daysRemaining || a.urgencyRank - b.urgencyRank;
          case 'urgency':
          default:
            return a.urgencyRank - b.urgencyRank || a.daysRemaining - b.daysRemaining;
        }
      });
  }, [licenses, companies, search, companyFilter, urgencyFilter, sortBy]);

  const groupedItems = useMemo<RenewalGroup[]>(() => {
    const groups = new Map<string, RenewalGroup>();

    items.forEach(item => {
      if (!groups.has(item.companyId)) {
        groups.set(item.companyId, {
          companyId: item.companyId,
          companyName: item.companyName,
          companyCnpj: item.companyCnpj,
          companyActive: item.companyActive,
          items: [],
          criticalCount: 0,
          upcomingCount: 0,
          renewingCount: 0
        });
      }

      const group = groups.get(item.companyId)!;
      group.items.push(item);
      if (item.urgency === 'critical') group.criticalCount += 1;
      if (item.urgency === 'upcoming') group.upcomingCount += 1;
      if (item.urgency === 'renewing') group.renewingCount += 1;
    });

    return Array.from(groups.values()).sort((a, b) => a.companyName.localeCompare(b.companyName));
  }, [items]);

  React.useEffect(() => {
    if (!currentUser?.id) return;

    const saved = readRenewalFilterState(currentUser.id);
    if (saved) {
          if (saved.companyFilter === 'all' || companies.some(company => company.id === saved.companyFilter)) {
        setCompanyFilter(saved.companyFilter || 'all');
      }
      if (saved.urgencyFilter && VALID_URGENCY_FILTERS.includes(saved.urgencyFilter)) {
        setUrgencyFilter(saved.urgencyFilter);
      }
      if (typeof saved.search === 'string') {
        setSearch(saved.search);
      }
      if (typeof saved.sortBy === 'string') {
        setSortBy(saved.sortBy);
      }
      if (typeof saved.viewMode === 'string') {
        setViewMode(saved.viewMode);
      }
    }

    setFiltersHydrated(true);
  }, [currentUser?.id, companies]);

  React.useEffect(() => {
    if (!filtersHydrated || !currentUser?.id) return;

    writeRenewalFilterState(currentUser.id, { companyFilter, urgencyFilter, search, sortBy, viewMode });
  }, [companyFilter, urgencyFilter, search, sortBy, viewMode, currentUser?.id, filtersHydrated]);

  const selectedItems = useMemo(
    () => items.filter(item => selectedIds.includes(item.license.id)),
    [items, selectedIds]
  );

  const selectedRenewingCount = selectedItems.filter(item => item.license.isRenewing).length;
  const selectedOpenCount = selectedItems.length - selectedRenewingCount;

  const stats = useMemo(() => {
    const now = new Date();
    const base = {
      critical: 0,
      upcoming: 0,
      renewing: 0,
      stable: 0
    };

    licenses.forEach((license) => {
      const daysRemaining = differenceInDays(parseISO(license.expirationDate), now);
      if (license.isRenewing) {
        base.renewing += 1;
      } else if (daysRemaining < 0 || daysRemaining <= 30) {
        base.critical += 1;
      } else if (daysRemaining <= 90) {
        base.upcoming += 1;
      } else {
        base.stable += 1;
      }
    });

    return base;
  }, [licenses]);

  const handleRenewalToggle = async (licenseId: string, isRenewing: boolean) => {
    const license = licenses.find(item => item.id === licenseId);
    if (!license) return;

    const confirmed = await confirmAction({
      title: isRenewing ? 'Encerrar renovação?' : 'Iniciar renovação?',
      description: isRenewing
        ? `Vamos marcar ${license.name} como fora de renovação.`
        : `Vamos marcar ${license.name} como em renovação a partir de hoje.`,
      confirmText: isRenewing ? 'Encerrar' : 'Iniciar',
      cancelText: 'Cancelar',
      tone: isRenewing ? 'danger' : 'primary'
    });

    if (!confirmed) return;

    setSavingId(licenseId);
    try {
      const updated = await updateLicense(licenseId, isRenewing
        ? { isRenewing: false, renewalStartDate: '' }
        : { isRenewing: true, renewalStartDate: todayIso() }
      );

      if (updated) {
        showToast({
          type: 'success',
          title: isRenewing ? 'Renovação encerrada' : 'Renovação iniciada',
          description: `${license.name} foi atualizada com sucesso.`
        });
      }
    } finally {
      setSavingId(null);
    }
  };

  const toggleSelected = (licenseId: string) => {
    setSelectedIds(prev => (
      prev.includes(licenseId)
        ? prev.filter(id => id !== licenseId)
        : [...prev, licenseId]
    ));
  };

  const clearSelection = () => setSelectedIds([]);

  const clearFilters = () => {
    setSearch('');
    setCompanyFilter('all');
    setUrgencyFilter('all');
    setSortBy('urgency');
    setViewMode('grouped');
  };

  const toggleCompanySelection = (companyId: string) => {
    const companyItems = items.filter(item => item.companyId === companyId);
    const ids = companyItems.map(item => item.license.id);
    const allSelected = ids.length > 0 && ids.every(id => selectedIds.includes(id));

    setSelectedIds(prev => {
      if (allSelected) {
        return prev.filter(id => !ids.includes(id));
      }
      return Array.from(new Set([...prev, ...ids]));
    });
  };

  const handleSelectVisible = () => {
    const visibleIds = items.map(item => item.license.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    setSelectedIds(allVisibleSelected ? [] : visibleIds);
  };

  const handleBulkRenewalUpdate = async (nextState: boolean) => {
    const scope = selectedItems.filter(item => Boolean(item.license.isRenewing) !== nextState);
    if (scope.length === 0) {
      showToast({
        type: 'info',
        title: 'Nada para atualizar',
        description: nextState
          ? 'As licenças selecionadas já estão em renovação.'
          : 'As licenças selecionadas já estão fora de renovação.'
      });
      return;
    }

    const confirmed = await confirmAction({
      title: nextState ? 'Iniciar renovação em lote?' : 'Encerrar renovação em lote?',
      description: nextState
        ? `Vamos marcar ${scope.length} licença(s) como em renovação a partir de hoje.`
        : `Vamos encerrar a renovação de ${scope.length} licença(s) selecionada(s).`,
      confirmText: nextState ? 'Iniciar' : 'Encerrar',
      cancelText: 'Cancelar',
      tone: nextState ? 'primary' : 'danger'
    });

    if (!confirmed) return;

    setSavingId('bulk');
    try {
      const results = await Promise.all(
        scope.map(item => updateLicense(
          item.license.id,
          nextState
            ? { isRenewing: true, renewalStartDate: todayIso() }
            : { isRenewing: false, renewalStartDate: '' }
        ))
      );

      const successCount = results.filter(Boolean).length;
      if (successCount > 0) {
        showToast({
          type: 'success',
          title: nextState ? 'Renovação em lote iniciada' : 'Renovação em lote encerrada',
          description: `${successCount} licença(s) atualizada(s) com sucesso.`
        });
      }
      clearSelection();
    } finally {
      setSavingId(null);
    }
  };

  const handleExportCsv = () => {
    const exportScope = selectedItems.length > 0 ? selectedItems : items;

    if (exportScope.length === 0) {
      showToast({
        type: 'info',
        title: 'Nada para exportar',
        description: 'Não há licenças no recorte atual para gerar relatório.'
      });
      return;
    }

    const rows = exportScope.map(item => [
      item.companyName,
      item.companyCnpj,
      item.license.name,
      item.license.type,
      item.statusLabel,
      format(parseISO(item.license.expirationDate), 'dd/MM/yyyy'),
      item.daysRemaining,
      item.license.isRenewing ? 'Sim' : 'Não',
      item.license.renewalStartDate ? format(parseISO(item.license.renewalStartDate), 'dd/MM/yyyy') : ''
    ]);

    const csv = [
      ['Empresa', 'CNPJ', 'Licença', 'Órgão', 'Status', 'Vencimento', 'Dias Restantes', 'Em Renovação', 'Início da Renovação'],
      ...rows
    ]
      .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `centro-renovacao-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Relatório exportado',
      description: `${exportScope.length} licença(s) exportada(s) em CSV.`
    });
  };

  const handleExportPdf = () => {
    const exportScope = selectedItems.length > 0 ? selectedItems : items;

    if (exportScope.length === 0) {
      showToast({
        type: 'info',
        title: 'Nada para exportar',
        description: 'Não há licenças no recorte atual para gerar relatório.'
      });
      return;
    }

    const grouped = new Map<string, RenewalGroup>();
    exportScope.forEach(item => {
      if (!grouped.has(item.companyId)) {
        grouped.set(item.companyId, {
          companyId: item.companyId,
          companyName: item.companyName,
          companyCnpj: item.companyCnpj,
          companyActive: item.companyActive,
          items: [],
          criticalCount: 0,
          upcomingCount: 0,
          renewingCount: 0
        });
      }
      const group = grouped.get(item.companyId)!;
      group.items.push(item);
      if (item.urgency === 'critical') group.criticalCount += 1;
      if (item.urgency === 'upcoming') group.upcomingCount += 1;
      if (item.urgency === 'renewing') group.renewingCount += 1;
    });

    const groups = Array.from(grouped.values()).sort((a, b) => a.companyName.localeCompare(b.companyName));
    const totalCritical = exportScope.filter(item => item.urgency === 'critical').length;
    const totalUpcoming = exportScope.filter(item => item.urgency === 'upcoming').length;
    const totalRenewing = exportScope.filter(item => item.urgency === 'renewing').length;

    const htmlEscape = (value: string) =>
      value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');

    const groupMarkup = groups.map(group => {
      const rows = group.items.map(item => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a">${htmlEscape(item.license.name)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#475569">${htmlEscape(item.license.type)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;color:#334155">${format(parseISO(item.license.expirationDate), 'dd/MM/yyyy')}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;background:${item.urgency === 'critical' ? '#fee2e2' : item.urgency === 'renewing' ? '#e0e7ff' : '#fef3c7'};color:${item.urgency === 'critical' ? '#b91c1c' : item.urgency === 'renewing' ? '#4338ca' : '#b45309'}">
              ${htmlEscape(item.statusLabel)}
            </span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#475569">${item.daysRemaining < 0 ? `Venceu há ${Math.abs(item.daysRemaining)} dia(s)` : `Vence em ${item.daysRemaining} dia(s)`}</td>
        </tr>
      `).join('');

      return `
        <section style="margin-bottom:24px;page-break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;background:#0f172a;color:white;padding:12px 16px;border-radius:16px 16px 0 0;">
            <div>
              <div style="font-size:14px;font-weight:900;letter-spacing:-0.02em">${htmlEscape(group.companyName)}</div>
              <div style="margin-top:2px;font-size:11px;font-weight:700;opacity:.85">CNPJ ${htmlEscape(group.companyCnpj)}</div>
            </div>
            <div style="text-align:right;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">
              ${group.items.length} licença(s)
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-top:none;background:white">
            <thead>
              <tr style="background:#f8fafc">
                <th style="text-align:left;padding:10px 12px;font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#64748b;font-weight:800;border-bottom:2px solid #e2e8f0;">Licença</th>
                <th style="text-align:left;padding:10px 12px;font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#64748b;font-weight:800;border-bottom:2px solid #e2e8f0;">Órgão</th>
                <th style="text-align:left;padding:10px 12px;font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#64748b;font-weight:800;border-bottom:2px solid #e2e8f0;">Vencimento</th>
                <th style="text-align:center;padding:10px 12px;font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#64748b;font-weight:800;border-bottom:2px solid #e2e8f0;">Status</th>
                <th style="text-align:left;padding:10px 12px;font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#64748b;font-weight:800;border-bottom:2px solid #e2e8f0;">Dias</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>
      `;
    }).join('');

    const win = window.open('', '_blank', 'width=1200,height=900');
    if (!win) {
      showToast({
        type: 'warning',
        title: 'Pop-up bloqueado',
        description: 'Permita pop-ups para abrir o relatório em PDF.'
      });
      return;
    }

    const generatedAt = format(new Date(), 'dd/MM/yyyy HH:mm');
    win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Centro de Renovação</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: white;
      color: #0f172a;
      padding: 32px 40px 64px;
      font-size: 13px;
    }
    h1 { font-size: 30px; font-weight: 900; letter-spacing: -0.03em; }
    .muted { color: #64748b; }
    .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 20px 0 28px; }
    .summary-card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 16px; }
    .summary-card p:first-child { font-size: 10px; text-transform: uppercase; letter-spacing: .12em; color: #64748b; font-weight: 800; }
    .summary-card p:last-child { font-size: 28px; font-weight: 900; margin-top: 8px; }
    @page { size: A4 landscape; margin: 12mm 15mm 18mm 15mm; }
    @media print {
      body { padding: 18px 22px 40px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:3px solid #0f172a;padding-bottom:14px;">
    <div>
      <h1>Centro de Renovação</h1>
      <p class="muted" style="margin-top:4px;text-transform:uppercase;letter-spacing:.08em;font-size:11px;font-weight:800;">
        Relatório consolidado de licenças e alvarás
      </p>
    </div>
    <div style="text-align:right;">
      <p class="muted" style="font-size:11px;font-weight:600;">Gerado em</p>
      <p style="font-size:14px;font-weight:900;margin-top:2px;">${generatedAt}</p>
    </div>
  </div>

  <div class="summary">
    <div class="summary-card"><p>Total</p><p>${exportScope.length}</p></div>
    <div class="summary-card"><p>Críticas</p><p>${totalCritical}</p></div>
    <div class="summary-card"><p>Em renovação</p><p>${totalRenewing}</p></div>
  </div>

  ${groupMarkup}
</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);

    showToast({
      type: 'success',
      title: 'Relatório em PDF aberto',
      description: 'Use a janela de impressão do navegador para salvar em PDF.'
    });
  };

  if (isDataLoading && licenses.length === 0) {
    return <LoadingState label="Montando centro de renovação..." />;
  }

  if (dataError && licenses.length === 0) {
    return <ErrorState message={dataError} onRetry={refreshAppData} />;
  }

  return (
    <div className="mx-auto max-w-[1240px] space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-16">
      <header className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative p-8 md:p-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
                <Sparkles className="h-4 w-4" />
                Centro de Renovação
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white md:text-5xl">
                  Priorize o que está perto de vencer
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  Esta visão reúne licenças críticas, próximas do vencimento e em renovação para você agir mais rápido sem abrir várias telas.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/licencas"
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-500"
                >
                  Ver todas as licenças <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                >
                  <Printer className="h-4 w-4" />
                  Exportar PDF
                </button>
                <button
                  type="button"
                  onClick={refreshAppData}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                >
                  <RefreshCw className="h-4 w-4" /> Atualizar dados
                </button>
              </div>
            </div>

            <div className="grid w-full max-w-2xl grid-cols-2 gap-4 lg:max-w-[32rem]">
              <MetricCard label="Críticas" value={stats.critical} icon={ShieldAlert} tone="rose" />
              <MetricCard label="Próximas" value={stats.upcoming} icon={Clock3} tone="amber" />
              <MetricCard label="Em renovação" value={stats.renewing} icon={RefreshCw} tone="indigo" />
              <MetricCard label="Sem urgência" value={stats.stable} icon={CheckCircle2} tone="emerald" />
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1.4fr_0.8fr_0.8fr] md:p-5">
        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por licença, empresa ou órgão"
            className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
        </label>

        <div className="relative">
          <select
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
            className="h-full w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100"
          >
            <option value="all">Todas as empresas</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.fantasyName}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Tudo' },
            { id: 'critical', label: 'Críticas' },
            { id: 'upcoming', label: 'Próximas' },
            { id: 'renewing', label: 'Renovação' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setUrgencyFilter(item.id as RenewalUrgencyFilter)}
              className={`rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                urgencyFilter === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2 md:p-5">
        <div className="grid gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Ordenação</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'urgency', label: 'Urgência' },
              { id: 'company', label: 'Empresa' },
              { id: 'name', label: 'Nome' },
              { id: 'expiry', label: 'Vencimento' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSortBy(item.id)}
                className={`rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  sortBy === item.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Visualização</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'grouped', label: 'Agrupada', icon: Building2 },
              { id: 'flat', label: 'Lista contínua', icon: List }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setViewMode(item.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    viewMode === item.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {userRole === 'admin' && items.length > 0 && (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Ações em lote</p>
              <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {selectedIds.length > 0
                  ? `${selectedIds.length} licença(s) selecionada(s), sendo ${selectedRenewingCount} em renovação e ${selectedOpenCount} abertas.`
                  : 'Selecione uma ou mais licenças para atualizar várias de uma vez.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSelectVisible}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {items.length > 0 && items.every(item => selectedIds.includes(item.license.id))
                  ? 'Desmarcar visíveis'
                  : 'Selecionar visíveis'}
              </button>

              <button
                type="button"
                disabled={selectedIds.length === 0 || selectedOpenCount === 0 || savingId === 'bulk'}
                onClick={() => handleBulkRenewalUpdate(true)}
                className="rounded-2xl bg-indigo-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Iniciar em lote
              </button>

              <button
                type="button"
                disabled={selectedIds.length === 0 || selectedRenewingCount === 0 || savingId === 'bulk'}
                onClick={() => handleBulkRenewalUpdate(false)}
                className="rounded-2xl bg-slate-700 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-600 dark:hover:bg-slate-500"
              >
                Encerrar em lote
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                Limpar filtros
              </button>

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                >
                  Limpar seleção
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {dataError && (licenses.length > 0 || companies.length > 0) && (
        <ErrorState message={dataError} onRetry={refreshAppData} />
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Nenhuma licença urgente encontrada"
          description="Tudo está sob controle no recorte atual. Ajuste os filtros ou acesse a lista completa para revisar todos os registros."
          action={
            <Link
              to="/licencas"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-500"
            >
              Abrir lista completa <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {viewMode === 'flat' ? (
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3 md:p-6">
                {items.map(item => (
                  <article
                    key={item.license.id}
                    className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 transition-transform hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        {userRole === 'admin' && (
                          <label className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.license.id)}
                              onChange={() => toggleSelected(item.license.id)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              aria-label={`Selecionar ${item.license.name}`}
                            />
                          </label>
                        )}
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                          item.urgency === 'critical'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                            : item.urgency === 'renewing'
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'
                        }`}>
                          {item.urgency === 'critical' ? <AlertTriangle className="h-7 w-7" /> : <Target className="h-7 w-7" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-white">
                              {item.license.name}
                            </h4>
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                              item.urgency === 'critical'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200'
                                : item.urgency === 'renewing'
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                            }`}>
                              {item.statusLabel}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {item.companyName}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Clock3 className="h-4 w-4" />
                              {item.daysRemaining < 0
                                ? `Venceu há ${Math.abs(item.daysRemaining)} dia(s)`
                                : `Vence em ${item.daysRemaining} dia(s)`}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                              Órgão: {item.license.type}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                              Vencimento: {format(parseISO(item.license.expirationDate), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 md:justify-end">
                        <Link
                          to={`/licencas/editar/${item.license.id}`}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                        >
                          Abrir licença
                        </Link>

                        {userRole === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleRenewalToggle(item.license.id, item.license.isRenewing ?? false)}
                            disabled={savingId === item.license.id || savingId === 'bulk'}
                            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                              item.license.isRenewing
                                ? 'bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500'
                                : 'bg-indigo-600 hover:bg-indigo-500'
                            }`}
                          >
                            {item.license.isRenewing ? <Undo2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                            {item.license.isRenewing ? 'Encerrar renovação' : 'Iniciar renovação'}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            groupedItems.map(group => {
            const groupSelectedCount = group.items.filter(item => selectedIds.includes(item.license.id)).length;
            const allSelected = group.items.length > 0 && group.items.every(item => selectedIds.includes(item.license.id));
            const someSelected = groupSelectedCount > 0 && !allSelected;

            return (
              <section
                key={group.companyId}
                className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between md:p-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-white">
                        {group.companyName}
                      </h3>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                        group.companyActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {group.companyActive ? 'Empresa ativa' : 'Empresa inativa'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      CNPJ {group.companyCnpj} · {group.items.length} licença(s), {group.criticalCount} crítica(s), {group.renewingCount} em renovação
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCompanySelection(group.companyId)}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        allSelected
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : someSelected
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200'
                            : 'border border-slate-200 bg-slate-50 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {allSelected ? 'Desmarcar empresa' : 'Selecionar empresa'}
                    </button>

                    <Link
                      to={`/licencas?companyId=${group.companyId}`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    >
                      Ver empresa
                    </Link>

                    <span className="rounded-2xl bg-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      {groupSelectedCount} selecionada(s)
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 p-5 md:p-6">
                  {group.items.map(item => (
                    <article
                      key={item.license.id}
                      className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 transition-transform hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          {userRole === 'admin' && (
                            <label className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item.license.id)}
                                onChange={() => toggleSelected(item.license.id)}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                aria-label={`Selecionar ${item.license.name}`}
                              />
                            </label>
                          )}
                          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                            item.urgency === 'critical'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                              : item.urgency === 'renewing'
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'
                          }`}>
                            {item.urgency === 'critical' ? <AlertTriangle className="h-7 w-7" /> : <Target className="h-7 w-7" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-white">
                                {item.license.name}
                              </h4>
                              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                                item.urgency === 'critical'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200'
                                  : item.urgency === 'renewing'
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                              }`}>
                                {item.statusLabel}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              <span className="inline-flex items-center gap-2">
                                <Clock3 className="h-4 w-4" />
                                {item.daysRemaining < 0
                                  ? `Venceu há ${Math.abs(item.daysRemaining)} dia(s)`
                                  : `Vence em ${item.daysRemaining} dia(s)`}
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                {item.companyActive ? 'Empresa ativa' : 'Empresa inativa'}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                                Órgão: {item.license.type}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                                Vencimento: {format(parseISO(item.license.expirationDate), 'dd/MM/yyyy')}
                              </span>
                              {item.license.isRenewing && item.license.renewalStartDate && (
                                <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                                  Renovação desde {format(parseISO(item.license.renewalStartDate), 'dd/MM/yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 md:justify-end">
                          <Link
                            to={`/licencas/editar/${item.license.id}`}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                          >
                            Abrir licença
                          </Link>

                          {userRole === 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleRenewalToggle(item.license.id, item.license.isRenewing ?? false)}
                              disabled={savingId === item.license.id || savingId === 'bulk'}
                              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                                item.license.isRenewing
                                  ? 'bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500'
                                  : 'bg-indigo-600 hover:bg-indigo-500'
                              }`}
                            >
                              {item.license.isRenewing ? <Undo2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                              {item.license.isRenewing ? 'Encerrar renovação' : 'Iniciar renovação'}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })
          )}
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'rose' | 'amber' | 'indigo' | 'emerald';
}> = ({ label, value, icon: Icon, tone }) => {
  const toneClasses = {
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300'
  }[tone];

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses}`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{value}</p>
    </div>
  );
};

export default RenewalCenter;
