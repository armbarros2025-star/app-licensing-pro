
import React from 'react';
import {
  Shield,
  FileText,
  TreePine,
  Flame,
  Building2,
  Landmark,
  HelpCircle,
  Sword,
  ShieldAlert,
  BadgeCheck,
  ClipboardList,
  Activity,
  Globe,
  Droplets,
  Radio
} from 'lucide-react';

export const LICENSE_TYPES = [
  { id: 'pf', name: 'Polícia Federal', icon: <Shield className="w-4 h-4" /> },
  { id: 'pc', name: 'Polícia Civil', icon: <Landmark className="w-4 h-4" /> },
  { id: 'ibama', name: 'IBAMA', icon: <TreePine className="w-4 h-4" /> },
  { id: 'cetesb', name: 'Cetesb', icon: <FileText className="w-4 h-4" /> },
  { id: 'bombeiros', name: 'Bombeiro', icon: <Flame className="w-4 h-4" /> },
  { id: 'prefeitura', name: 'Prefeitura', icon: <Building2 className="w-4 h-4" /> },
  { id: 'exercito', name: 'Exército', icon: <Sword className="w-4 h-4" /> },
  { id: 'brigada', name: 'Brigada de Incêndio', icon: <ShieldAlert className="w-4 h-4" /> },
  { id: 'certificado_digital', name: 'Certificado Digital', icon: <BadgeCheck className="w-4 h-4" /> },
  { id: 'cadri', name: 'CADRI', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'vigilancia_sanitaria', name: 'Vigilância Sanitária', icon: <Activity className="w-4 h-4" /> },
  { id: 'registro_br', name: 'Registro.br', icon: <Globe className="w-4 h-4" /> },
  { id: 'outorga_poco', name: 'Outorga do Poço', icon: <Droplets className="w-4 h-4" /> },
  { id: 'anatel', name: 'Anatel', icon: <Radio className="w-4 h-4" /> },
];

export const STATUS_COLORS = {
  expired: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  active: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
};
