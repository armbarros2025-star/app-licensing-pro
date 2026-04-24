export const assetUrl = (path: string) => {
  const normalized = path.replace(/^\/+/, '');
  const baseUrl = (import.meta as any)?.env?.BASE_URL || './';
  return `${baseUrl}${normalized}`;
};
