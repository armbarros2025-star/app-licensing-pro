
export enum LicenseStatus {
  EXPIRED = 'expired',
  WARNING = 'warning',
  ACTIVE = 'active'
}

export interface LicenseFile {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Company {
  id: string;
  name: string;
  fantasyName: string;
  cnpj: string;
  active: boolean;
  renewalLinks?: Record<string, string>; // Key: License Type Name, Value: URL
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatar?: string;
}

export interface License {
  id: string;
  companyId: string;
  name: string;
  type: string;
  expirationDate: string;
  currentLicenseFiles: LicenseFile[];
  renewalDocuments: LicenseFile[];
  notes?: string;
  isRenewing?: boolean;
  renewalStartDate?: string;
}

export type Theme = 'light' | 'dark';
export type UserRole = 'admin' | 'user';

export interface DashboardStats {
  expired: number;
  warning: number;
  active: number;
  total: number;
  companiesCount: number;
}

export interface AppNotification {
  id: string;
  licenseId: string;
  licenseName: string;
  companyName: string;
  daysRemaining: number;
  type: 'warning' | 'expired';
  date: string;
}
