
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Plus, FileText, Calendar, Trash2, Edit2, ChevronDown, Eye, Building2, ExternalLink, Printer, Download, Archive, MessageSquare, Mail, RefreshCw, ChevronRight
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useApp } from '../context/AppContext';
import { LICENSE_TYPES, STATUS_COLORS } from '../constants';
import { printFile } from '../utils/printUtils';

const LicenseList: React.FC = () => {
  const { licenses, companies, deleteLicense, userRole, settings } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCompanyFilter = searchParams.get('companyId') || 'all';

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCompany, setFilterCompany] = useState(initialCompanyFilter);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');

  // Sync state with URL params
  useEffect(() => {
    const companyId = searchParams.get('companyId');
    if (companyId && companyId !== filterCompany) {
      setFilterCompany(companyId);
    } else if (!companyId && filterCompany !== 'all') {
      setFilterCompany('all');
    }
  }, [searchParams, filterCompany]);

  const handleCompanyFilterChange = (companyId: string) => {
    setFilterCompany(companyId);
    if (companyId === 'all') {
      searchParams.delete('companyId');
    } else {
      searchParams.set('companyId', companyId);
    }
    setSearchParams(searchParams);
  };

  const getStatus = (date: string) => {
    const today = new Date();
    const expDate = parseISO(date);
    if (expDate < today) return 'expired';
    if (differenceInDays(expDate, today) < 30) return 'warning';
    return 'active';
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

  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.fantasyName || 'Desconhecida';

  const getCompanyLicenseCount = (id: string) => licenses.filter(l => l.companyId === id).length;

  const getRenewalLink = (companyId: string, type: string) => {
    const company = companies.find(c => c.id === companyId);
    const masterCompany = companies.find(c => c.cnpj.replace(/\D/g, '') === '02837072000113');
    return company?.renewalLinks?.[type] || masterCompany?.renewalLinks?.[type];
  };

  const handleQuickPrint = (url?: string) => {
    if (!url) { alert('Nenhum arquivo anexado para impressão.'); return; }
    printFile(url);
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

    const totalLicenses = licenses.length;

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
      <img src="data:image/png;base64,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" alt="Arbtech Logo" style="height: 50px; width: auto; object-fit: contain;" />
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) {
      alert('Permita pop-ups para imprimir o relatório.');
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
      alert("Nenhum arquivo para baixar.");
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
      alert("Configure o número de WhatsApp nas Configurações primeiro.");
      return;
    }
    const company = companies.find(c => c.id === license.companyId);
    const text = `*ALERTA DE VENCIMENTO - LICENSEPRO*%0A%0AOlá! A licença *${license.name}* da empresa *${company?.fantasyName}* está próxima do vencimento.%0A%0A📅 *Vencimento:* ${format(parseISO(license.expirationDate), 'dd/MM/yyyy')}%0A⚠️ *Status:* ${getStatus(license.expirationDate) === 'expired' ? 'EXPIRADO' : 'PRÓXIMO AO VENCIMENTO'}%0A%0APor favor, providencie a renovação.`;
    window.open(`https://wa.me/${whatsapp}?text=${text}`, '_blank');
  };

  const handleEmailAlert = (license: any) => {
    const { email } = settings;
    if (!email) {
      alert("Configure o e-mail nas Configurações primeiro.");
      return;
    }
    const company = companies.find(c => c.id === license.companyId);
    const subject = `ALERTA: Vencimento de Licença - ${license.name}`;
    const body = `Olá,\n\nEste é um alerta automático do LicensePro.\n\nA licença ${license.name} da empresa ${company?.fantasyName} está próxima do vencimento.\n\nData de Vencimento: ${format(parseISO(license.expirationDate), 'dd/MM/yyyy')}\nStatus: ${getStatus(license.expirationDate) === 'expired' ? 'EXPIRADO' : 'PRÓXIMO AO VENCIMENTO'}\n\nPor favor, acesse o sistema para mais detalhes.`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 print:hidden">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-800 dark:text-white font-display">
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
      <div className="glass-card p-8 rounded-[2.5rem] shadow-sm border-white/20 print:hidden space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            options={['all', ...companies.sort((a, b) => a.fantasyName.localeCompare(b.fantasyName)).map(c => c.id)]}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
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

          <div className="flex items-end h-full">
            <button
              onClick={() => {
                setSearch('');
                setFilterType('all');
                handleCompanyFilterChange('all');
                setFilterStatus('all');
                setFilterDateRange('all');
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
      <div className="pb-20 space-y-16">
        {filtered.length > 0 ? (
          Object.entries(
            filtered.reduce((acc, license) => {
              if (!acc[license.companyId]) acc[license.companyId] = [];
              acc[license.companyId].push(license);
              return acc;
            }, {} as Record<string, typeof filtered>)
          ).sort((a, b) => getCompanyName(a[0]).localeCompare(getCompanyName(b[0])))
            .map(([companyId, companyLicenses]: [string, any[]]) => (
              <div key={companyId} className="space-y-6">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 print:grid-cols-1 print:gap-4">
                  {companyLicenses.map(license => {
                    const statusType = getStatus(license.expirationDate);
                    const statusLabel = statusType === 'expired' ? 'CRÍTICO' : statusType === 'warning' ? 'ATENÇÃO' : 'VIGENTE';
                    const statusColor = statusType === 'expired' ? 'text-rose-600' : statusType === 'warning' ? 'text-amber-600' : 'text-emerald-600';
                    const statusBg = statusType === 'expired' ? 'bg-rose-50 dark:bg-rose-900/20' : statusType === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';
                    const hasFiles = Array.isArray(license.currentLicenseFiles) && license.currentLicenseFiles.length > 0;

                    return (
                      <div
                        key={license.id}
                        className="glass-card p-5 rounded-3xl flex flex-col group hover:scale-[1.02] transition-all duration-300 border-white/20 dark:border-slate-800 relative overflow-hidden bg-white/40 dark:bg-slate-900/40 print:shadow-none print:border-gray-300 print:rounded-lg"
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
                                  className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                                  title="Imprimir Cópia"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDownloadAll(license)}
                                  className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                                  title="Baixar Tudo"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleWhatsAppAlert(license)}
                                  className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <Link to={`/licencas/editar/${license.id}`} className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all">
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>

                        <div className="mb-4 flex-grow relative z-10 print:mb-2">
                          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 leading-tight group-hover:text-indigo-600 transition-colors print:text-lg">{license.name}</h3>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md uppercase tracking-widest">{license.type}</span>
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
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vencimento</p>
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
                              license.renewalDocuments.slice(0, 3).map((_, i) => (
                                <div key={i} className="w-8 h-8 rounded-lg border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                              ))
                            ) : <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Sem Anexos</span>}
                          </div>
                          <Link to={`/licencas/editar/${license.id}`} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:text-indigo-500 uppercase tracking-widest transition-colors group/link">
                            {userRole === 'admin' ? 'Gerenciar' : 'Visualizar'}
                            <ChevronRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
        ) : (
          <div className="col-span-full py-40 text-center glass-card rounded-[4rem] border-4 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30">
            <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Search className="w-10 h-10 text-slate-200" />
            </div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">Nenhum documento</h4>
            <p className="text-slate-400 font-medium mt-2">Tente ajustar seus filtros para encontrar o que procura.</p>
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
    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
  </div>
);

export default LicenseList;
