export type RenewalUrgencyFilter = 'all' | 'critical' | 'upcoming' | 'renewing';

export interface RenewalFilterState {
  companyFilter?: string;
  urgencyFilter?: RenewalUrgencyFilter;
  search?: string;
  sortBy?: string;
  viewMode?: string;
}

export interface LicenseListFilterState {
  search?: string;
  filterType?: string;
  filterCompany?: string;
  filterStatus?: string;
  filterDateRange?: string;
  sortBy?: string;
  viewMode?: string;
}

const STORAGE_PREFIX = 'renewal-center-filters';
const LICENSE_LIST_STORAGE_PREFIX = 'license-list-filters';

export const getRenewalFilterStorageKey = (userId?: string | null) =>
  `${STORAGE_PREFIX}:${userId || 'anonymous'}`;

export const readRenewalFilterState = (userId?: string | null): RenewalFilterState | null => {
  try {
    const raw = localStorage.getItem(getRenewalFilterStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RenewalFilterState;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export const writeRenewalFilterState = (userId: string | null | undefined, state: RenewalFilterState) => {
  try {
    localStorage.setItem(getRenewalFilterStorageKey(userId), JSON.stringify(state));
  } catch {
    // Ignore storage failures in private browsing / quota limits.
  }
};

export const getLicenseListFilterStorageKey = (userId?: string | null) =>
  `${LICENSE_LIST_STORAGE_PREFIX}:${userId || 'anonymous'}`;

export const readLicenseListFilterState = (userId?: string | null): LicenseListFilterState | null => {
  try {
    const raw = localStorage.getItem(getLicenseListFilterStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LicenseListFilterState;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export const writeLicenseListFilterState = (userId: string | null | undefined, state: LicenseListFilterState) => {
  try {
    localStorage.setItem(getLicenseListFilterStorageKey(userId), JSON.stringify(state));
  } catch {
    // Ignore storage failures in private browsing / quota limits.
  }
};
