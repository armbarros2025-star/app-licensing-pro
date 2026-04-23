
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Building2, Briefcase, Hash, ToggleLeft,
  ToggleRight, Globe, Link as LinkIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../context/FeedbackContext';
import { LICENSE_TYPES } from '../constants';
import { EmptyState, ErrorState, LoadingState } from './AsyncState';

const CompanyForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companies, addCompany, updateCompany, isDataLoading, dataError, refreshAppData } = useApp();
  const { showToast } = useFeedback();

  const [name, setName] = useState('');
  const [fantasyName, setFantasyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [active, setActive] = useState(true);
  const [renewalLinks, setRenewalLinks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const existingCompany = id ? companies.find(c => c.id === id) : null;

  useEffect(() => {
    setInitialized(false);
  }, [id]);

  useEffect(() => {
    if (initialized) return;

    const masterCompany = companies.find(c => c.cnpj.replace(/\D/g, '') === '02837072000113');
    const masterLinks = masterCompany?.renewalLinks || {};

    if (id) {
      const existing = existingCompany;
      if (existing) {
        setName(existing.name);
        setFantasyName(existing.fantasyName);
        setCnpj(existing.cnpj);
        setActive(existing.active);
        setRenewalLinks({ ...masterLinks, ...(existing.renewalLinks || {}) });
        setInitialized(true);
      } else if (!isDataLoading) {
        setInitialized(true);
      }
    } else {
      setRenewalLinks(masterLinks);
      setInitialized(true);
    }
  }, [id, companies, existingCompany, initialized, isDataLoading]);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 14) value = value.slice(0, 14);

    // CNPJ Masking: 00.000.000/0000-00
    value = value.replace(/^(\d{2})(\d)/, "$1.$2");
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
    value = value.replace(/(\d{4})(\d)/, "$1-$2");

    setCnpj(value);
  };

  const handleLinkChange = (typeName: string, url: string) => {
    setRenewalLinks(prev => ({
      ...prev,
      [typeName]: url
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && !existingCompany) return;
    if (!name || !cnpj || saving) return;

    const data = {
      name,
      fantasyName,
      cnpj,
      active,
      renewalLinks
    };

    setSaving(true);
    try {
      let success = false;
      if (id) {
        success = await updateCompany(id, data);
      } else {
        success = await addCompany(data);
      }
      if (success) {
        showToast({
          type: 'success',
          title: id ? 'Empresa atualizada' : 'Empresa cadastrada',
          description: `${fantasyName || name} foi salva com sucesso.`
        });
        navigate('/empresas');
      }
    } finally {
      setSaving(false);
    }
  };

  if (id && isDataLoading && !existingCompany) {
    return <LoadingState label="Carregando dados da empresa..." />;
  }

  if (id && dataError && !existingCompany) {
    return <ErrorState message={dataError} onRetry={refreshAppData} />;
  }

  if (id && !isDataLoading && !existingCompany) {
    return (
      <EmptyState
        title="Empresa não encontrada"
        description="Esse registro pode ter sido removido ou você não possui acesso a ele."
        action={
          <button
            type="button"
            onClick={() => navigate('/empresas')}
            className="inline-flex items-center rounded-2xl bg-indigo-600 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-500"
          >
            Voltar para empresas
          </button>
        }
      />
    );
  }

  return (
    <div className="max-w-[52rem] mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black uppercase text-[10px] tracking-widest mb-4">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar à Lista
          </button>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-800 dark:text-white font-display">
            {id ? 'Editar' : 'Nova'} <span className="text-indigo-600">Empresa</span>
          </h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={saving}>
        {/* Dados Cadastrais */}
        <div className="glass-card p-8 rounded-[3rem] border-white/20 dark:border-slate-800 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shadow-sm">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Dados Cadastrais</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação jurídica da unidade</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Razão Social
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Empresa Brasileira de Serviços LTDA"
                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-100 placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Nome Fantasia / Unidade
              </label>
              <input
                type="text"
                value={fantasyName}
                onChange={e => setFantasyName(e.target.value)}
                placeholder="Ex: Matriz São Paulo"
                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                CNPJ
              </label>
              <input
                required
                type="text"
                value={cnpj}
                onChange={handleCnpjChange}
                placeholder="00.000.000/0000-00"
                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status da Unidade</label>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl border-2 transition-all ${active ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/10 dark:border-emerald-900/30 dark:text-emerald-400 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-800'}`}
              >
                <span className="font-black uppercase tracking-widest text-[10px]">{active ? 'Unidade Ativa' : 'Unidade Inativa'}</span>
                {active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          </div>
        </div>

        {/* Portais de Renovação */}
        <div className="glass-card p-8 rounded-[3rem] border-white/20 dark:border-slate-800 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-600 shadow-sm">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Portais de Renovação</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Links diretos para órgãos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LICENSE_TYPES.map(type => (
              <div key={type.id} className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  {type.name}
                </label>
                <div className="relative group">
                  <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                  <input
                    type="url"
                    value={renewalLinks[type.name] || ''}
                    onChange={e => handleLinkChange(type.name, e.target.value)}
                    placeholder={`https://portal.exemplo.gov.br/${type.id}`}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-100 placeholder:text-slate-300 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-10 right-10 z-50 flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/empresas')}
            disabled={saving}
            className="px-8 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-slate-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-600/50 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
          >
            <Save className="w-5 h-5" /> {saving ? 'Salvando...' : 'Salvar Empresa'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyForm;
