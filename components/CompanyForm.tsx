
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Building2, Briefcase, Hash, ToggleLeft, 
  ToggleRight, MapPin, Crosshair, Loader2, Globe, Link as LinkIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LICENSE_TYPES } from '../constants';

const CompanyForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companies, addCompany, updateCompany } = useApp();

  const [name, setName] = useState('');
  const [fantasyName, setFantasyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [active, setActive] = useState(true);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [renewalLinks, setRenewalLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      const existing = companies.find(c => c.id === id);
      if (existing) {
        setName(existing.name);
        setFantasyName(existing.fantasyName);
        setCnpj(existing.cnpj);
        setActive(existing.active);
        setLatitude(existing.latitude || '');
        setLongitude(existing.longitude || '');
        setRenewalLinks(existing.renewalLinks || {});
      }
    }
  }, [id, companies]);

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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não é suportada por este navegador.");
      return;
    }

    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setLocLoading(false);
      },
      (error) => {
        console.error(error);
        alert("Não foi possível obter a localização. Verifique as permissões do navegador.");
        setLocLoading(false);
      }
    );
  };

  const handleLinkChange = (typeName: string, url: string) => {
    setRenewalLinks(prev => ({
      ...prev,
      [typeName]: url
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cnpj) return;

    const data = { 
      name, 
      fantasyName, 
      cnpj, 
      active,
      latitude,
      longitude,
      renewalLinks
    };

    if (id) {
      updateCompany(id, data);
    } else {
      addCompany(data);
    }
    navigate('/empresas');
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="mb-10 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold uppercase text-xs tracking-widest">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Voltar
        </button>
        <h1 className="text-4xl font-black tracking-tighter text-slate-800 dark:text-slate-100">{id ? 'Editar Cadastro' : 'Nova Empresa'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Cadastrais */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
            <Building2 className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-black tracking-tight">Dados Cadastrais</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Building2 className="w-3 h-3" /> Razão Social
              </label>
              <input 
                required
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Empresa Brasileira de Serviços LTDA"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Briefcase className="w-3 h-3" /> Nome Fantasia
              </label>
              <input 
                type="text" 
                value={fantasyName}
                onChange={e => setFantasyName(e.target.value)}
                placeholder="Ex: Matriz"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Hash className="w-3 h-3" /> CNPJ
              </label>
              <input 
                required
                type="text" 
                value={cnpj}
                onChange={handleCnpjChange}
                placeholder="00.000.000/0000-00"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 font-mono"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Operacional</label>
              <button 
                type="button"
                onClick={() => setActive(!active)}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border transition-all ${active ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-900/30 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-800'}`}
              >
                <span className="font-bold">{active ? 'Empresa Ativa' : 'Empresa Inativa'}</span>
                {active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Portais de Renovação */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl space-y-8">
           <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
            <Globe className="w-6 h-6 text-sky-500" />
            <h2 className="text-xl font-black tracking-tight">Portais de Renovação</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure os links diretos para os sistemas de renovação de cada órgão para esta empresa.
          </p>

          <div className="grid grid-cols-1 gap-6">
            {LICENSE_TYPES.map(type => (
               <div key={type.id} className="space-y-2">
                 <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                   {type.icon} {type.name}
                 </label>
                 <div className="relative">
                   <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type="url" 
                     value={renewalLinks[type.name] || ''}
                     onChange={e => handleLinkChange(type.name, e.target.value)}
                     placeholder={`https://portal.exemplo.gov.br/${type.id}`}
                     className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all font-medium text-slate-600 dark:text-slate-300 placeholder:text-slate-300 text-sm"
                   />
                 </div>
               </div>
            ))}
          </div>
        </div>

        {/* Geolocalização */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl space-y-8">
           <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
             <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-rose-500" />
              <h2 className="text-xl font-black tracking-tight">Geolocalização</h2>
            </div>
            <button 
              type="button" 
              onClick={handleGetLocation}
              disabled={locLoading}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50"
            >
              {locLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
              {locLoading ? 'Buscando...' : 'Obter Localização Atual'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Latitude</label>
              <input 
                type="text" 
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                placeholder="-23.550520"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 font-mono"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Longitude</label>
              <input 
                type="text" 
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                placeholder="-46.633308"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
           <button 
            type="button"
            onClick={() => navigate('/empresas')}
            className="px-8 py-4 bg-transparent text-slate-500 font-black uppercase tracking-widest text-xs hover:text-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-600/40 transition-all flex items-center gap-3 active:scale-95"
          >
            <Save className="w-5 h-5" /> Salvar Empresa
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyForm;
