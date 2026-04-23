
import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Plus, FileText, Calendar, Edit2, ChevronDown, Building2, Printer, Archive, MessageSquare, RefreshCw, ChevronRight
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../context/FeedbackContext';
import { LICENSE_TYPES } from '../constants';
import { printFile } from '../utils/printUtils';
import {
  readLicenseListFilterState,
  writeLicenseListFilterState,
} from '../utils/filterPersistence';
import { ErrorState, LoadingState } from './AsyncState';

const LicenseList: React.FC = () => {
  const { licenses, companies, userRole, settings, isDataLoading, dataError, refreshAppData, currentUser } = useApp();
  const { showToast } = useFeedback();
  const [searchParams, setSearchParams] = useSearchParams();
  const companyParam = searchParams.get('companyId');
  const companyParamRef = useRef(companyParam);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('company');
  const [viewMode, setViewMode] = useState('grouped');
  const [filtersHydrated, setFiltersHydrated] = useState(false);

  useEffect(() => {
    companyParamRef.current = companyParam;
  }, [companyParam]);

  useEffect(() => {
    const savedState = readLicenseListFilterState(currentUser?.id);
    setSearch(savedState?.search ?? '');
    setFilterType(savedState?.filterType ?? 'all');
    setFilterCompany(companyParamRef.current || savedState?.filterCompany || 'all');
    setFilterStatus(savedState?.filterStatus ?? 'all');
    setFilterDateRange(savedState?.filterDateRange ?? 'all');
    setSortBy(savedState?.sortBy ?? 'company');
    setViewMode(savedState?.viewMode ?? 'grouped');
    setFiltersHydrated(true);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!filtersHydrated || !companyParam) {
      return;
    }
    if (companyParam !== filterCompany) {
      setFilterCompany(companyParam);
    }
  }, [companyParam, filterCompany, filtersHydrated]);

  useEffect(() => {
    if (!filtersHydrated) {
      return;
    }
    writeLicenseListFilterState(currentUser?.id, {
      search,
      filterType,
      filterCompany,
      filterStatus,
      filterDateRange,
      sortBy,
      viewMode,
    });
  }, [currentUser?.id, filtersHydrated, search, filterType, filterCompany, filterStatus, filterDateRange, sortBy, viewMode]);

  const handleCompanyFilterChange = (companyId: string) => {
    setFilterCompany(companyId);
    const nextParams = new URLSearchParams(searchParams);
    if (companyId === 'all') {
      nextParams.delete('companyId');
    } else {
      nextParams.set('companyId', companyId);
    }
    setSearchParams(nextParams);
  };

  if (isDataLoading && licenses.length === 0) {
    return <LoadingState label="Carregando licenças e alvarás..." />;
  }

  if (dataError && licenses.length === 0) {
    return <ErrorState message={dataError} onRetry={refreshAppData} />;
  }

  const getStatus = (date: string) => {
    const today = new Date();
    const expDate = parseISO(date);
    if (expDate < today) return 'expired';
    if (differenceInDays(expDate, today) < 30) return 'warning';
    return 'active';
  };

  const getStatusWeight = (status: string) => {
    if (status === 'expired') return 0;
    if (status === 'warning') return 1;
    return 2;
  };

  const filtered = licenses.filter(l => {
    const status = getStatus(l.expirationDate);
    const today = new Date();
    const expDate = parseISO(l.expirationDate);
    const daysToExpiry = differenceInDays(expDate, today);

    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || l.type === filterType;
    const matchesCompany = filterCompany === 'all' || l.companyId === filterCompany;
    const matchesStatus = filterStatus === 'all' || status === filterStatus;

    let matchesDate = true;
    if (filterDateRange === 'expired') matchesDate = daysToExpiry < 0;
    else if (filterDateRange === '30') matchesDate = daysToExpiry >= 0 && daysToExpiry <= 30;
    else if (filterDateRange === '60') matchesDate = daysToExpiry >= 0 && daysToExpiry <= 60;
    else if (filterDateRange === '90') matchesDate = daysToExpiry >= 0 && daysToExpiry <= 90;

    return matchesSearch && matchesType && matchesCompany && matchesStatus && matchesDate;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const today = new Date();
    const aStatus = getStatus(a.expirationDate);
    const bStatus = getStatus(b.expirationDate);

    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'expiry':
        return differenceInDays(parseISO(a.expirationDate), today) - differenceInDays(parseISO(b.expirationDate), today);
      case 'status':
        return getStatusWeight(aStatus) - getStatusWeight(bStatus) || getCompanyName(a.companyId).localeCompare(getCompanyName(b.companyId)) || a.name.localeCompare(b.name);
      case 'company':
      default:
        return getCompanyName(a.companyId).localeCompare(getCompanyName(b.companyId)) || a.name.localeCompare(b.name);
    }
  });

  const groupedByCompany = sortedFiltered.reduce((acc, license) => {
    if (!acc[license.companyId]) acc[license.companyId] = [];
    acc[license.companyId].push(license);
    return acc;
  }, {} as Record<string, typeof sortedFiltered>);

  function getCompanyName(id: string) {
    return companies.find(c => c.id === id)?.fantasyName || 'Desconhecida';
  }

  function getCompanyLicenseCount(id: string) {
    return licenses.filter(l => l.companyId === id).length;
  }

  const getRenewalLink = (companyId: string, type: string) => {
    const company = companies.find(c => c.id === companyId);
    const masterCompany = companies.find(c => c.cnpj.replace(/\D/g, '') === '02837072000113');
    return company?.renewalLinks?.[type] || masterCompany?.renewalLinks?.[type];
  };

  const handleQuickPrint = (url?: string) => {
    if (!url) {
      showToast({
        type: 'info',
        title: 'Sem arquivo para imprimir',
        description: 'Anexe um documento para habilitar a impressão rápida.'
      });
      return;
    }

    const result = printFile(url);
    if (!result.ok) {
      showToast({
        type: 'warning',
        title: 'Não foi possível iniciar a impressão',
        description: result.message || 'Verifique seu navegador e tente novamente.'
      });
    }
  };

  const handlePrintReport = () => {
    const today = new Date();

    // Group ALL licenses by company (ignores any active filters)
    const grouped = companies
      .slice()
      .sort((a, b) => a.cnpj.localeCompare(b.cnpj))
      .map(company => ({
        company,
        licenses: licenses
          .filter(l => l.companyId === company.id)
          .sort((a, b) => a.name.localeCompare(b.name))
      }));

    const getStatusLabel = (date: string) => {
      const exp = parseISO(date);
      const days = differenceInDays(exp, today);
      if (exp < today) return { label: 'EXPIRADO', color: '#dc2626' };
      if (days < 30) return { label: 'ATENÇÃO', color: '#d97706' };
      return { label: 'VIGENTE', color: '#16a34a' };
    };

    const rows = grouped.map(({ company, licenses: compLicenses }) => {
      const licenseRows = compLicenses.map(l => {
        const { label, color } = getStatusLabel(l.expirationDate);
        const exp = parseISO(l.expirationDate);
        const days = differenceInDays(exp, today);
        return `
          <tr>
            <td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:12px; font-weight:600; color:#1e293b;">${l.name}</td>
            <td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:11px; color:#475569;">${l.type}</td>
            <td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:11px; font-family:'Courier New',monospace; color:#334155;">
              ${format(exp, 'dd/MM/yyyy')}
            </td>
            <td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; text-align:center;">
              <div style="background:${color}15; color:${color}; font-weight:800; font-size:9px;
                padding:3px 10px; border-radius:4px; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:2px; display:inline-block;">
                ${label}${days >= 0 && days < 30 ? ` (${days}d)` : ''}
              </div>
              ${l.isRenewing ? `<div style="color:#d97706; font-weight:800; font-size:8px; text-transform:uppercase; margin-top:2px;">EM RENOVAÇÃO ${l.renewalStartDate ? `<br/><span style="opacity:0.8">DESDE ${format(parseISO(l.renewalStartDate), 'dd/MM/yy')}</span>` : ''}</div>` : ''}
            </td>
            <td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:11px; color:#64748b;">
              ${l.notes ? l.notes.substring(0, 60) + (l.notes.length > 60 ? '…' : '') : '—'}
            </td>
          </tr>`;
      }).join('');

      return `
        <div style="margin-bottom:24px; page-break-inside:avoid;">
          <div style="background:#1a3a5c; color:white; padding:10px 16px;
            display:flex; align-items:center; justify-content:space-between;">
            <div>
              <div style="font-weight:800; font-size:13px; letter-spacing:0.02em; text-transform:uppercase;">${company.name}</div>
              <div style="font-size:11px; opacity:.85; margin-top:1px; font-weight:600; text-transform:uppercase;">${company.fantasyName}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:11px; font-weight:700; letter-spacing:0.02em;">CNPJ: ${company.cnpj}</div>
              <div style="font-size:11px; font-weight:800; margin-top:1px; letter-spacing:0.04em; text-transform:uppercase;">${compLicenses.length} LICENÇA${compLicenses.length !== 1 ? 'S' : ''}</div>
            </div>
          </div>
          ${compLicenses.length > 0 ? `
          <table style="width:100%; border-collapse:collapse; background:white; border:1px solid #e2e8f0; border-top:none;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="text-align:left; padding:8px 12px; font-size:9px; text-transform:uppercase;
                  letter-spacing:.1em; color:#64748b; font-weight:700; border-bottom:2px solid #e2e8f0;">Licença</th>
                <th style="text-align:left; padding:8px 12px; font-size:9px; text-transform:uppercase;
                  letter-spacing:.1em; color:#64748b; font-weight:700; border-bottom:2px solid #e2e8f0;">Órgão</th>
                <th style="text-align:left; padding:8px 12px; font-size:9px; text-transform:uppercase;
                  letter-spacing:.1em; color:#64748b; font-weight:700; border-bottom:2px solid #e2e8f0;">Vencimento</th>
                <th style="text-align:center; padding:8px 12px; font-size:9px; text-transform:uppercase;
                  letter-spacing:.1em; color:#64748b; font-weight:700; border-bottom:2px solid #e2e8f0;">Status</th>
                <th style="text-align:left; padding:8px 12px; font-size:9px; text-transform:uppercase;
                  letter-spacing:.1em; color:#64748b; font-weight:700; border-bottom:2px solid #e2e8f0;">Obs.</th>
              </tr>
            </thead>
            <tbody>
              ${licenseRows}
            </tbody>
          </table>` : ''}
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório de Licenças — LicensePro</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #111827; background: #fff; padding: 32px 40px 80px 40px; font-size: 13px;
    }
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body { padding: 20px 24px 80px 24px; }
      @page { size: A4 landscape; margin: 12mm 15mm 20mm 15mm; }
    }
    .report-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px 40px 16px 40px;
      background: white;
      border-top: 1px solid #1a3a5c;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="margin-bottom:24px; padding-bottom:12px; border-bottom:3px solid #1a3a5c;">
    <div style="display:flex; align-items:flex-start; justify-content:space-between;">
      <div>
        <h1 style="font-size:32px; font-weight:900; letter-spacing:-0.03em; color:#111827; line-height:1;">
          LicensePro
        </h1>
        <p style="font-size:12px; color:#1a3a5c; margin-top:4px; text-transform:uppercase;
          letter-spacing:.06em; font-weight:800;">Relatório Completo de Licenças e Alvarás</p>
      </div>
      <div style="text-align:right;">
        <p style="font-size:11px; color:#64748b; font-weight:500;">Gerado em</p>
        <p style="font-size:14px; font-weight:800; color:#1a3a5c;">${format(today, 'dd/MM/yyyy')}</p>
      </div>
    </div>
  </div>

  <!-- Company blocks -->
  ${rows.length > 0 ? rows : '<p style="color:#94a3b8; text-align:center; padding:60px; font-size:14px;">Nenhuma licença cadastrada.</p>'}

  <!-- Footer -->
  <div class="report-footer">
    <div style="display:flex; justify-content:flex-end;">
      <img src="/logo.png" alt="Arbtech Logo" style="height: 50px; width: auto; object-fit: contain;" />
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) {
      showToast({
        type: 'warning',
        title: 'Pop-up bloqueado',
        description: 'Permita pop-ups para imprimir o relatório completo.'
      });
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  const handleDownloadAll = async (license: any) => {
    const currentFiles = Array.isArray(license.currentLicenseFiles) ? license.currentLicenseFiles : [];
    const renewalDocs = Array.isArray(license.renewalDocuments) ? license.renewalDocuments : [];
    const allFiles = [...currentFiles, ...renewalDocs];

    if (allFiles.length === 0) {
      showToast({
        type: 'info',
        title: 'Sem arquivos para baixar',
        description: 'Essa licença ainda não possui anexos.'
      });
      return;
    }

    allFiles.forEach(file => {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name || 'documento';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleWhatsAppAlert = (license: any) => {
    const { whatsapp } = settings;
    if (!whatsapp) {
      showToast({
        type: 'info',
        title: 'WhatsApp não configurado',
        description: 'Defina o número nas Configurações para enviar alertas.'
      });
      return;
    }
    const company = companies.find(c => c.id === license.companyId);
    const text = `*ALERTA DE VENCIMENTO - LICENSEPRO*%0A%0AOlá! A licença *${license.name}* da empresa *${company?.fantasyName}* está próxima do vencimento.%0A%0A📅 *Vencimento:* ${format(parseISO(license.expirationDate), 'dd/MM/yyyy')}%0A⚠️ *Status:* ${getStatus(license.expirationDate) === 'expired' ? 'EXPIRADO' : 'PRÓXIMO AO VENCIMENTO'}%0A%0APor favor, providencie a renovação.`;
    window.open(`https://wa.me/${whatsapp}?text=${text}`, '_blank');
  };

  const handleEmailAlert = (license: any) => {
    const { email } = settings;
    if (!email) {
      showToast({
        type: 'info',
        title: 'E-mail não configurado',
        description: 'Defina um e-mail nas Configurações para enviar alertas.'
      });
      return;
    }
    const company = companies.find(c => c.id === license.companyId);
    const subject = `ALERTA: Vencimento de Licença - ${license.name}`;
    const body = `Olá,\n\nEste é um alerta automático do LicensePro.\n\nA licença ${license.name} da empresa ${company?.fantasyName} está próxima do vencimento.\n\nData de Vencimento: ${format(parseISO(license.expirationDate), 'dd/MM/yyyy')}\nStatus: ${getStatus(license.expirationDate) === 'expired' ? 'EXPIRADO' : 'PRÓXIMO AO VENCIMENTO'}\n\nPor favor, acesse o sistema para mais detalhes.`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const renderLicenseCard = (license: any, showCompanyTag = false) => {
    const statusType = getStatus(license.expirationDate);
    const statusLabel = statusType === 'expired' ? 'CRÍTICO' : statusType === 'warning' ? 'ATENÇÃO' : 'VIGENTE';
    const statusColor = statusType === 'expired' ? 'text-rose-600' : statusType === 'warning' ? 'text-amber-600' : 'text-emerald-600';
    const statusBg = statusType === 'expired' ? 'bg-rose-50 dark:bg-rose-900/20' : statusType === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';
    const hasFiles = Array.isArray(license.currentLicenseFiles) && license.currentLicenseFiles.length > 0;
    const companyName = getCompanyName(license.companyId);

    return (
      <div
        key={license.id}
        className="glass-card p-4 rounded-3xl flex flex-col group hover:scale-[1.02] transition-all duration-300 border-white/20 dark:border-slate-800 relative overflow-hidden bg-white/40 dark:bg-slate-900/40 print:shadow-none print:border-gray-300 print:rounded-lg"
      >
        <div className={`absolute top-0 right-0 w-32 h-32 ${statusBg.replace('bg-', 'bg-')}/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>

        <div className="flex justify-between items-start mb-4 relative z-10 print:mb-2">
          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm ${statusBg} ${statusColor}`}>
            {statusLabel}
          </span>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 print:hidden">
            {hasFiles && (
              <>
                <button
                  onClick={() => handleQuickPrint(license.currentLicenseFiles?.[0]?.url)}
                  aria-label={`Imprimir cópia de ${license.name}`}
                  title="Imprimir cópia"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownloadAll(license)}
                  aria-label={`Baixar anexos de ${license.name}`}
                  title="Baixar anexos"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleWhatsAppAlert(license)}
                  aria-label={`Enviar alerta por WhatsApp de ${license.name}`}
                  title="WhatsApp"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-emerald-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </>
            )}
            <Link to={`/licencas/editar/${license.id}`} aria-label={`Editar ${license.name}`} title="Editar licença" className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all">
              <Edit2 className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="mb-4 flex-grow relative z-10 print:mb-2">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 leading-tight group-hover:text-indigo-600 transition-colors print:text-lg">{license.name}</h3>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md uppercase tracking-widest">{license.type}</span>
            {showCompanyTag && (
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-md uppercase tracking-widest">
                {companyName}
              </span>
            )}
            {license.isRenewing && (
              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 px-2.5 py-1 rounded-md uppercase tracking-widest">Em Renovação</span>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-5 relative z-10 print:mb-2">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Vencimento</p>
                <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100">{format(parseISO(license.expirationDate), 'dd/MM/yyyy')}</p>
              </div>
            </div>
            {license.isRenewing && license.renewalStartDate && (
              <div className="text-right">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Início Renov.</p>
                <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{format(parseISO(license.renewalStartDate), 'dd/MM/yyyy')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-10 print:hidden">
          <div className="flex -space-x-3">
            {license.renewalDocuments.length > 0 ? (
              license.renewalDocuments.slice(0, 3).map((_: any, i: number) => (
                <div key={i} className="w-8 h-8 rounded-lg border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                </div>
              ))
            ) : <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sem anexos</span>}
          </div>
          <Link to={`/licencas/editar/${license.id}`} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:text-indigo-500 uppercase tracking-widest transition-colors group/link">
            {userRole === 'admin' ? 'Gerenciar' : 'Visualizar'}
            <ChevronRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1180px] space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-14">
      {dataError && licenses.length > 0 && (
        <ErrorState message={dataError} onRetry={refreshAppData} />
      )}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-800 dark:text-white font-display">
            Licenças & <span className="text-indigo-600">Alvarás</span>
          </h1>
          <p className="text-slate-500 font-medium mt-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Gerenciamento centralizado de documentos regulatórios.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handlePrintReport}
            className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm hover:bg-slate-50 flex items-center gap-3"
          >
            <Printer className="w-5 h-5" /> Imprimir Relatório
          </button>
          {userRole === 'admin' && (
            <Link
              to="/licencas/nova"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-3 group"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              Novo Documento
            </Link>
          )}
        </div>
      </header>



      {/* Filters Section - Hidden on Print */}
      <div className="glass-card p-6 rounded-[2.5rem] shadow-sm border-white/20 print:hidden space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou observações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-white dark:placeholder-slate-400 text-sm"
            />
          </div>

          <FilterSelect
            value={filterCompany}
            onChange={handleCompanyFilterChange}
            options={['all', ...companies.slice().sort((a, b) => a.fantasyName.localeCompare(b.fantasyName)).map(c => c.id)]}
            label="Empresa"
            getLabel={(id: string) => id === 'all' ? 'Todas as Empresas' : `${companies.find(c => c.id === id)?.fantasyName} (${getCompanyLicenseCount(id)})`}
            icon={<Building2 className="w-4 h-4" />}
          />

          <FilterSelect
            value={filterType}
            onChange={setFilterType}
            options={['all', ...LICENSE_TYPES.map(t => t.name)]}
            label="Tipo"
            getLabel={(val: string) => val === 'all' ? 'Todos os Tipos' : val}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-5 border-t border-slate-100 dark:border-slate-800">
          <FilterSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={['all', 'active', 'warning', 'expired']}
            label="Status"
            getLabel={(val: string) => val === 'all' ? 'Todos os Status' : val === 'active' ? 'Vigente' : val === 'warning' ? 'Atenção' : 'Expirado'}
          />

          <FilterSelect
            value={filterDateRange}
            onChange={setFilterDateRange}
            options={['all', 'expired', '30', '60', '90']}
            label="Expiração"
            getLabel={(val: string) => val === 'all' ? 'Qualquer Data' : val === 'expired' ? 'Já Expirados' : `Vencendo em ${val} dias`}
          />

          <FilterSelect
            value={sortBy}
            onChange={setSortBy}
            options={['company', 'name', 'expiry', 'status']}
            label="Ordenação"
            getLabel={(val: string) => val === 'company' ? 'Empresa' : val === 'name' ? 'Nome' : val === 'expiry' ? 'Vencimento' : 'Status'}
          />

          <FilterSelect
            value={viewMode}
            onChange={setViewMode}
            options={['grouped', 'flat']}
            label="Visualização"
            getLabel={(val: string) => val === 'grouped' ? 'Agrupada' : 'Lista contínua'}
          />

          <div className="flex items-end h-full">
            <button
              onClick={() => {
                setSearch('');
                setFilterType('all');
                handleCompanyFilterChange('all');
                setFilterStatus('all');
                setFilterDateRange('all');
                setSortBy('company');
                setViewMode('grouped');
              }}
              className="px-8 py-4 w-full md:w-auto flex items-center justify-center gap-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest"
              title="Limpar Filtros"
            >
              <RefreshCw className="w-4 h-4" /> Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* List Grid Grouped by Company */}
      <div className="pb-12 space-y-10">
        {sortedFiltered.length > 0 ? (
          viewMode === 'flat' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 print:grid-cols-1 print:gap-4">
              {sortedFiltered.map(license => renderLicenseCard(license, true))}
            </div>
          ) : (
            Object.entries(groupedByCompany)
              .sort((a, b) => getCompanyName(a[0]).localeCompare(getCompanyName(b[0])))
              .map(([companyId, companyLicenses]: [string, any[]]) => (
                <div key={companyId} className="space-y-4">
                  <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print:border-none print:pb-2">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 print:hidden">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-none mb-1">
                        {getCompanyName(companyId)}
                      </h2>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        {companyLicenses.length} documento{companyLicenses.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 print:grid-cols-1 print:gap-4">
                    {companyLicenses.map(license => renderLicenseCard(license, false))}
                  </div>
                </div>
              ))
          )
        ) : (
          <div className="col-span-full py-24 text-center glass-card rounded-[4rem] border-4 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30">
            <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-500" />
            </div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">Nenhum documento</h4>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Tente ajustar seus filtros para encontrar o que procura.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FilterSelect = ({ value, onChange, options, label, getLabel, icon }: any) => (
  <div className="relative group">
    {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</div>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full appearance-none ${icon ? 'pl-11' : 'pl-4'} pr-10 py-4 bg-slate-50 dark:bg-slate-900 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 rounded-2xl outline-none transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer text-slate-500 dark:text-white focus:ring-2 focus:ring-indigo-500`}
    >
      {options.map((opt: string) => (
        <option key={opt} value={opt} className="bg-white dark:bg-slate-900 dark:text-white">{getLabel ? getLabel(opt) : opt.toUpperCase()}</option>
      ))}
    </select>
    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-indigo-500 transition-colors" />
  </div>
);

export default LicenseList;
