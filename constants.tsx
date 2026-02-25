
import React from 'react';
import { Shield, FileText, TreePine, Flame, Building2, Landmark, HelpCircle } from 'lucide-react';

export const LICENSE_TYPES = [
  { id: 'pf', name: 'Polícia Federal', icon: <Shield className="w-4 h-4" /> },
  { id: 'pc', name: 'Polícia Civil', icon: <Landmark className="w-4 h-4" /> },
  { id: 'ibama', name: 'IBAMA', icon: <TreePine className="w-4 h-4" /> },
  { id: 'cetesb', name: 'Cetesb', icon: <FileText className="w-4 h-4" /> },
  { id: 'bombeiros', name: 'Corpo de Bombeiros', icon: <Flame className="w-4 h-4" /> },
  { id: 'prefeitura', name: 'Prefeitura', icon: <Building2 className="w-4 h-4" /> },
  { id: 'outro', name: 'Outro', icon: <HelpCircle className="w-4 h-4" /> },
];

export const STATUS_COLORS = {
  expired: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  active: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
};
