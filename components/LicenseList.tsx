import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Plus, FileText, Calendar, Trash2, Edit2, ChevronDown, ChevronRight, Eye, Building2, ExternalLink, Printer, Download, Archive, MessageSquare, Mail, RefreshCw
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useApp } from '../context/AppContext';
import { LICENSE_TYPES, STATUS_COLORS } from '../constants';

const LicenseList: React.FC = () => {
  const { licenses, companies, deleteLicense, userRole, settings } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCompanyFilter = searchParams.get('companyId') || 'all';

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCompany, setFilterCompany] = useState(initialCompanyFilter);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterTag, setFilterTag] = useState('all');

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

  const allTags = Array.from(new Set(licenses.flatMap(l => l.tags || []))).sort();

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
    const matchesTag = filterTag === 'all' || (l.tags && l.tags.includes(filterTag));

    let matchesDate = true;
    if (filterDateRange === 'expired') matchesDate = daysToExpiry < 0;
    else if (filterDateRange === '30') matchesDate = daysToExpiry >= 0 && daysToExpiry <= 30;
    else if (filterDateRange === '60') matchesDate = daysToExpiry >= 0 && daysToExpiry <= 60;
    else if (filterDateRange === '90') matchesDate = daysToExpiry >= 0 && daysToExpiry <= 90;

    return matchesSearch && matchesType && matchesCompany && matchesStatus && matchesTag && matchesDate;
  });

  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.fantasyName || 'Desconhecida';

  const getCompanyLicenseCount = (id: string) => licenses.filter(l => l.companyId === id).length;

  const getRenewalLink = (companyId: string, type: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.renewalLinks?.[type];
  };

  const handleQuickPrint = (url?: string) => {
    if (!url) {
      alert("Nenhum arquivo anexado para impressão.");
      return;
    }
    const w = window.open(url, '_blank');
    if (w) {
      w.onload = () => {
        w.focus();
        setTimeout(() => w.print(), 500);
      };
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadAll = async (license: any) => {
    const zip = new JSZip();
    const folder = zip.folder(license.name.replace(/\s+/g, '_'));
    if (!folder) return;

    const currentFiles = Array.isArray(license.currentLicenseFiles) ? license.currentLicenseFiles : [];
    const renewalDocs = Array.isArray(license.renewalDocuments) ? license.renewalDocuments : [];
    const allFiles = [...currentFiles, ...renewalDocs];

    if (allFiles.length === 0) {
      alert("Nenhum arquivo para baixar.");
      return;
    }

    const promises = allFiles.map(async (file) => {
      try {
        const response = await fetch(file.url);
        const blob = await response.blob();
        folder.file(file.name, blob);
      } catch (e) {
        console.error("Error fetching file:", file.name, e);
      }
    });

    await Promise.all(promises);
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${license.name.replace(/\s+/g, '_')} _completo.zip`);
  };

  const handleWhatsAppAlert = (license: any) => {
    const { whatsapp } = settings;
    if (!whatsapp) {
      alert("Configure o número de WhatsApp nas Configurações primeiro.");
      return;
    }
    const company = companies.find(c => c.id === license.companyId);
    const text = `* ALERTA DE VENCIMENTO - LICENSEPRO *% 0A % 0AOlá! A licença * ${license.name}* da empresa * ${company?.fantasyName}* está próxima do vencimento.% 0A % 0A📅 * Vencimento:* ${format(parseISO(license.expirationDate), 'dd/MM/yyyy')}% 0A⚠️ * Status:* ${getStatus(license.expirationDate) === 'expired' ? 'EXPIRADO' : 'PRÓXIMO AO VENCIMENTO'}% 0A % 0APor favor, providencie a renovação.`;
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

      {/* Título para Impressão */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-bold">Relatório de Licenças e Alvarás</h1>
        <p className="text-sm text-gray-500">Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      </div>

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
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 text-sm"
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

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <FilterSelect
                value={filterTag}
                onChange={setFilterTag}
                options={['all', ...allTags]}
                label="Tag"
                getLabel={(val: string) => val === 'all' ? 'Todas as Tags' : val}
              />
            </div>
            <button
              onClick={() => {
                setSearch('');
                setFilterType('all');
                handleCompanyFilterChange('all');
                setFilterStatus('all');
                setFilterDateRange('all');
                setFilterTag('all');
              }}
              className="p-4 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all"
              title="Limpar Filtros"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20 print:grid-cols-1 print:gap-4">
        {filtered.length > 0 ? (
          filtered.map(license => {
            const statusType = getStatus(license.expirationDate);
            const statusLabel = statusType === 'expired' ? 'CRÍTICO' : statusType === 'warning' ? 'ATENÇÃO' : 'VIGENTE';
            const statusColor = statusType === 'expired' ? 'text-rose-600' : statusType === 'warning' ? 'text-amber-600' : 'text-emerald-600';
            const statusBg = statusType === 'expired' ? 'bg-rose-50 dark:bg-rose-900/20' : statusType === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';
            const hasFiles = Array.isArray(license.currentLicenseFiles) && license.currentLicenseFiles.length > 0;

            return (
              <div
                key={license.id}
                className="glass-card p-8 rounded-[3rem] flex flex-col group hover:scale-[1.02] transition-all duration-500 border-white/20 dark:border-slate-800 relative overflow-hidden print:shadow-none print:border-gray-300 print:rounded-lg"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 ${statusBg.replace('bg-', 'bg-')}/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>

                <div className="flex justify-between items-start mb-8 relative z-10 print:mb-2">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm ${statusBg} ${statusColor}`}>
                    {statusLabel}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 print:hidden">
                    {hasFiles && (
                      <>
                        <button
                          onClick={() => handleQuickPrint(license.currentLicenseFiles?.[0]?.url)}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                          title="Imprimir Cópia"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadAll(license)}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                          title="Baixar Tudo"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleWhatsAppAlert(license)}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <Link to={`/licencas/editar/${license.id}`} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="mb-8 flex-grow relative z-10 print:mb-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">
                    <Building2 className="w-3.5 h-3.5" />
                    {getCompanyName(license.companyId)}
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3 leading-tight group-hover:text-indigo-600 transition-colors print:text-lg">{license.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg uppercase tracking-widest">{license.type}</span>
                    {license.tags?.map(tag => (
                      <span key={tag} className="text-[10px] font-bold text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">#{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 mb-8 relative z-10 print:mb-2">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vencimento</p>
                      <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100">{format(parseISO(license.expirationDate), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-auto border-t border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-10 print:hidden">
                  <div className="flex -space-x-3">
                    {license.renewalDocuments.length > 0 ? (
                      license.renewalDocuments.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-10 h-10 rounded-xl border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                          <FileText className="w-4 h-4 text-slate-400" />
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
          })
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
      className={`w-full appearance-none ${icon ? 'pl-11' : 'pl-4'} pr-10 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900 rounded-2xl outline-none transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer text-slate-500 focus:ring-2 focus:ring-indigo-500`}
    >
      {options.map((opt: string) => (
        <option key={opt} value={opt}>{getLabel ? getLabel(opt) : opt.toUpperCase()}</option>
      ))}
    </select>
    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
  </div>
);

export default LicenseList;
