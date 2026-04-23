import React from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Carregando dados...' }) => (
  <div role="status" aria-live="polite" className="glass-card rounded-[2.5rem] border-white/20 p-16 text-center">
    <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-500" />
    <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-500">{label}</p>
  </div>
);

export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div role="alert" aria-live="assertive" className="glass-card rounded-[2.5rem] border-rose-200/60 bg-rose-50/50 p-12 text-center dark:border-rose-900/40 dark:bg-rose-900/10">
    <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
    <p className="mt-4 text-sm font-black text-rose-700 dark:text-rose-300">Falha ao carregar</p>
    <p className="mx-auto mt-2 max-w-xl text-xs font-semibold text-rose-600/90 dark:text-rose-200/90">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mx-auto mt-6 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-rose-500"
      >
        <RefreshCw className="h-4 w-4" /> Tentar novamente
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="glass-card rounded-[2.5rem] border-white/20 p-16 text-center">
    <p className="text-lg font-black text-slate-800 dark:text-slate-100">{title}</p>
    <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);
