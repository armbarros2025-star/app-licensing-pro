
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Upload, File, Trash2, CheckCircle,
  FileText, AlertCircle, Building2, ChevronDown, Download,
  Printer, Lock, StickyNote, AlertTriangle, Archive, Calendar, Plus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useApp } from '../context/AppContext';
import { LICENSE_TYPES } from '../constants';
import { LicenseFile, Company } from '../types';
import { printFile } from '../utils/printUtils';

// Security Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

// --- Sub-Components ---

const FormHeader: React.FC<{
  isEditing: boolean;
  isAdmin: boolean;
  onBack: () => void;
}> = ({ isEditing, isAdmin, onBack }) => (
  <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
    <div>
      <button onClick={onBack} className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black uppercase text-[10px] tracking-widest mb-4">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel
      </button>
      <h1 className="text-5xl font-black tracking-tighter text-slate-800 dark:text-white font-display">
        {isEditing ? (isAdmin ? 'Editar' : 'Visualizar') : 'Nova'} <span className="text-indigo-600">Licença</span>
      </h1>
    </div>
    {!isAdmin && (
      <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl border border-amber-100 dark:border-amber-900/30">
        <Lock className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Modo de Leitura</span>
      </div>
    )}
  </div>
);

const InfoSection: React.FC<{
  name: string;
  setName: (v: string) => void;
  companyId: string;
  setCompanyId: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  expirationDate: string;
  setExpirationDate: (v: string) => void;
  isRenewing: boolean;
  setIsRenewing: (v: boolean) => void;
  renewalStartDate: string;
  setRenewalStartDate: (v: string) => void;
  companies: Company[];
  isAdmin: boolean;
}> = ({ name, setName, companyId, setCompanyId, type, setType, expirationDate, setExpirationDate, isRenewing, setIsRenewing, renewalStartDate, setRenewalStartDate, companies, isAdmin }) => (
  <div className="glass-card p-10 rounded-[3rem] border-white/20 dark:border-slate-800 shadow-sm space-y-10">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shadow-sm">
        <FileText className="w-8 h-8" />
      </div>
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Informações Principais</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados básicos do documento</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div className="space-y-3 lg:col-span-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Identificador</label>
        <input
          required
          readOnly={!isAdmin}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Licença Prévia LP-001/2024"
          className={`w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-100 ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
        />
      </div>

      <div className="space-y-3 lg:col-span-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unidade / Empresa</label>
        <div className="relative group">
          <select
            value={companyId}
            disabled={!isAdmin}
            onChange={e => setCompanyId(e.target.value)}
            className={`w-full appearance-none px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold pr-12 text-slate-700 dark:text-slate-100 ${!isAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
          >
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.fantasyName}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Órgão</label>
        <div className="relative group">
          <select
            value={type}
            disabled={!isAdmin}
            onChange={e => setType(e.target.value)}
            className={`w-full appearance-none px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold pr-12 text-slate-700 dark:text-slate-100 ${!isAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
          >
            {LICENSE_TYPES.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vencimento</label>
        <div className="relative h-[64px]">
          <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 pointer-events-none" />
          <input
            required
            readOnly={!isAdmin}
            type="date"
            value={expirationDate}
            onChange={e => setExpirationDate(e.target.value)}
            className={`w-full h-full pl-12 pr-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-100 ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
          />
        </div>
      </div>

      <div className="space-y-3 lg:col-span-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status de Renovação</label>
        <div className={`w-full h-[64px] px-5 py-2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl flex items-center justify-between gap-4 transition-all ${!isAdmin ? 'opacity-80' : ''}`}>

          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700 dark:text-slate-100 text-sm">Em Renovação</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isRenewing}
                disabled={!isAdmin}
                onChange={e => setIsRenewing(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {isRenewing && (
            <div className="relative flex-1 max-w-[200px] animate-in fade-in zoom-in duration-300 border-l border-slate-200 dark:border-slate-700 pl-4">
              <Calendar className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
              <input
                required={isRenewing}
                readOnly={!isAdmin}
                type="date"
                value={renewalStartDate}
                onChange={e => setRenewalStartDate(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 bg-amber-50/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-xs ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
                title="Data de Início da Renovação"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const NotesSection: React.FC<{
  notes: string;
  setNotes: (v: string) => void;
  isAdmin: boolean;
}> = ({ notes, setNotes, isAdmin }) => (
  <div className="glass-card p-10 rounded-[3rem] border-white/20 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 shadow-sm">
        <StickyNote className="w-8 h-8" />
      </div>
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Notas & Histórico</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações e detalhes internos</p>
      </div>
    </div>
    <textarea
      rows={5}
      readOnly={!isAdmin}
      value={notes}
      onChange={e => setNotes(e.target.value)}
      placeholder="Digite aqui observações importantes sobre esta licença, histórico de contatos ou pendências..."
      className={`w-full px-8 py-8 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[2rem] focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-100 resize-none ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
    />
  </div>
);

const FileList: React.FC<{
  files: LicenseFile[];
  isAdmin: boolean;
  onRemove: (id: string) => void;
  onPrint: (url: string) => void;
  onDownloadAll: () => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconColor: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ files, isAdmin, onRemove, onPrint, onDownloadAll, title, subtitle, icon, iconColor, onUpload }) => (
  <div className="glass-card p-10 rounded-[3rem] border-white/20 dark:border-slate-800 shadow-sm">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${iconColor}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">{title}</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
      {files.length > 1 && (
        <button
          type="button"
          onClick={onDownloadAll}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <Archive className="w-5 h-5" /> Baixar Pacote (.zip)
        </button>
      )}
    </div>

    <div className="space-y-4">
      {files.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {files.map(doc => (
            <div key={doc.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center justify-between group hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-sm">
              <div className="flex items-center gap-5 overflow-hidden">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <FileText className="w-7 h-7 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black truncate text-slate-800 dark:text-slate-100 leading-none mb-2">{doc.name}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Upload: {format(parseISO(doc.uploadedAt), 'dd/MM/yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a href={doc.url} download={doc.name} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm transition-all" title="Baixar">
                  <Download className="w-5 h-5" />
                </a>
                <button type="button" onClick={() => onPrint(doc.url)} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm transition-all" title="Imprimir">
                  <Printer className="w-5 h-5" />
                </button>
                {isAdmin && (
                  <button type="button" onClick={() => onRemove(doc.id)} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-rose-500 shadow-sm transition-all" title="Remover">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 text-center text-slate-300 border-4 border-dashed border-slate-50 dark:border-slate-800 rounded-[3rem] bg-slate-50/30">
          <File className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-black uppercase tracking-widest text-xs">Nenhum arquivo anexado</p>
        </div>
      )}

      {isAdmin && (
        <label className="block p-8 bg-slate-50 dark:bg-slate-800/30 border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-[2.5rem] hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-400 cursor-pointer transition-all text-center mt-8 group">
          <input type="file" className="hidden" multiple onChange={onUpload} accept={ALLOWED_TYPES.join(',')} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
              Clique ou arraste para anexar novos documentos
            </span>
          </div>
        </label>
      )}
    </div>
  </div>
);

// Tags removed by request

const LicenseForm: React.FC = () => {
  const { id: licenseId } = useParams();
  const navigate = useNavigate();
  const { licenses, companies, addLicense, updateLicense, deleteLicense, userRole } = useApp();

  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [type, setType] = useState('Cetesb');
  const [expirationDate, setExpirationDate] = useState('');
  const [currentFiles, setCurrentFiles] = useState<LicenseFile[]>([]);
  const [renewalDocs, setRenewalDocs] = useState<LicenseFile[]>([]);
  const [notes, setNotes] = useState('');
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewalStartDate, setRenewalStartDate] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (licenseId) {
      const existing = licenses.find(l => l.id === licenseId);
      if (existing) {
        setName(existing.name);
        setCompanyId(existing.companyId);
        setType(existing.type);
        setExpirationDate(existing.expirationDate.split('T')[0]);
        setCurrentFiles(existing.currentLicenseFiles || []);
        setRenewalDocs(existing.renewalDocuments || []);
        setNotes(existing.notes || '');
        setIsRenewing(!!existing.isRenewing);
        setRenewalStartDate(existing.renewalStartDate || '');
      }
    }
  }, [licenseId, licenses]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Formato de arquivo inválido. Use apenas PDF, JPG ou PNG.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Arquivo muito grande. O tamanho máximo permitido é 5MB.";
    }
    return null;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCurrent: boolean) => {
    if (!isAdmin) return;
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: LicenseFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        continue;
      }

      const base64Url = await fileToBase64(file);
      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: base64Url,
        uploadedAt: new Date().toISOString()
      });
    }

    if (isCurrent) setCurrentFiles(prev => [...prev, ...newFiles]);
    else setRenewalDocs(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (fileId: string, isCurrent: boolean) => {
    if (!isAdmin) return;
    if (isCurrent) setCurrentFiles(prev => prev.filter(f => f.id !== fileId));
    else setRenewalDocs(prev => prev.filter(f => f.id !== fileId));
  };

  const handlePrint = (url: string) => printFile(url);

  const handleDownloadAll = async (files: LicenseFile[], zipName: string) => {
    if (files.length === 0) return;

    files.forEach(file => {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name || 'documento';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!name || !expirationDate || !companyId) return;

    const data = {
      name,
      companyId,
      type,
      expirationDate: new Date(expirationDate).toISOString(),
      currentLicenseFiles: currentFiles,
      renewalDocuments: renewalDocs,
      notes,
      isRenewing,
      renewalStartDate
    };

    let success = false;
    if (licenseId) {
      success = await updateLicense(licenseId, data);
    } else {
      success = await addLicense(data);
    }

    if (success) {
      navigate('/licencas');
    }
  };

  const handleDelete = async () => {
    if (!licenseId) return;
    if (window.confirm('Tem certeza que deseja excluir esta licença? Esta ação não pode ser desfeita.')) {
      await deleteLicense(licenseId);
      navigate('/licencas');
    }
  };

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Building2 className="w-16 h-16 text-slate-300" />
        <h2 className="text-2xl font-black">Nenhuma empresa cadastrada</h2>
        <p className="text-slate-500">Cadastre uma empresa primeiro para vincular licenças.</p>
        {isAdmin && (
          <button onClick={() => navigate('/empresas/nova')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold">Cadastrar Empresa Agora</button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32">
      <FormHeader isEditing={!!licenseId} isAdmin={isAdmin} onBack={() => navigate(-1)} />

      <form onSubmit={handleSubmit} className="space-y-8">
        <InfoSection
          name={name} setName={setName}
          companyId={companyId} setCompanyId={setCompanyId}
          type={type} setType={setType}
          expirationDate={expirationDate} setExpirationDate={setExpirationDate}
          isRenewing={isRenewing} setIsRenewing={setIsRenewing}
          renewalStartDate={renewalStartDate} setRenewalStartDate={setRenewalStartDate}
          companies={companies}
          isAdmin={isAdmin}
        />

        <NotesSection notes={notes} setNotes={setNotes} isAdmin={isAdmin} />

        <div className="space-y-8">
          <FileList
            files={currentFiles}
            isAdmin={isAdmin}
            onUpload={(e) => handleFileUpload(e, true)}
            onRemove={(fileId) => removeFile(fileId, true)}
            onPrint={handlePrint}
            onDownloadAll={() => handleDownloadAll(currentFiles, `Licencas_${name.replace(/\s+/g, '_')}`)}
            title="Cópias das Licenças"
            subtitle="Documentos Finais Vigentes"
            icon={<CheckCircle className="w-6 h-6" />}
            iconColor="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
          />

          <FileList
            files={renewalDocs}
            isAdmin={isAdmin}
            onUpload={(e) => handleFileUpload(e, false)}
            onRemove={(fileId) => removeFile(fileId, false)}
            onPrint={handlePrint}
            onDownloadAll={() => handleDownloadAll(renewalDocs, `Documentos_Renovacao_${name.replace(/\s+/g, '_')}`)}
            title="Documentos de Renovação"
            subtitle="Protocolos, Formulários e Guias"
            icon={<AlertCircle className="w-6 h-6" />}
            iconColor="bg-amber-100 dark:bg-amber-900/30 text-amber-600"
          />
        </div>

        <div className="fixed bottom-10 right-10 z-50 flex gap-3">
          {isAdmin && licenseId && (
            <button
              type="button"
              onClick={handleDelete}
              className="h-12 px-6 min-w-[180px] bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:shadow-red-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir Licença
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/licencas')}
            className="h-12 px-6 min-w-[180px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:bg-slate-50 transition-all flex items-center justify-center"
          >
            {isAdmin ? 'Cancelar / Voltar' : 'Voltar para Lista'}
          </button>

          {isAdmin && (
            <button
              type="submit"
              className="h-12 px-6 min-w-[180px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Save className="w-3.5 h-3.5" /> Salvar Alterações
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default LicenseForm;
