
import React, { useState, useEffect } from 'react';
import { Save, Bell, Mail, MessageSquare, ShieldCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Settings: React.FC = () => {
  const { theme } = useApp();
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [autoNotify, setAutoNotify] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setEmail(data.email || '');
        setWhatsapp(data.whatsapp || '');
        setAutoNotify(data.autoNotify || false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, whatsapp, autoNotify })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32">
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tighter text-slate-800 dark:text-slate-100">Configurações</h1>
        <p className="text-slate-500 font-medium mt-2">Personalize suas notificações e preferências do sistema.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
              <Bell className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Alertas de Vencimento</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configuração de Canais de Notificação</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                <Mail className="w-3 h-3" /> E-mail para Alertas
              </label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu-email@exemplo.com"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> WhatsApp (DDD + Número)
              </label>
              <input 
                type="text" 
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="Ex: 11999999999"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={autoNotify}
                  onChange={e => setAutoNotify(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:bg-indigo-600 transition-all"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-all"></div>
              </div>
              <div>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Ativar Disparo Automático</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">O sistema tentará enviar alertas 30 dias antes do vencimento</p>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div className="text-xs font-bold text-amber-800 dark:text-amber-200 leading-relaxed">
            <p className="uppercase tracking-widest mb-1">Nota sobre Integração:</p>
            <p>A integração com WhatsApp e E-mail em ambiente de demonstração simula o disparo. Em produção, utilizaremos APIs como Twilio ou SendGrid para garantir a entrega automatizada.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            className="px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-600/50 transition-all active:scale-95 flex items-center gap-3"
          >
            {saved ? <ShieldCheck className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Configurações Salvas!' : 'Salvar Preferências'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
