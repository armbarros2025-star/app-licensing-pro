import React from 'react';
import { assetUrl } from '../utils/assets';
import { getInstitutionLogo } from '../utils/institutionLogos';

interface InstitutionLogoProps {
  licenseName: string;
  licenseType?: string;
  className?: string;
}

export const InstitutionLogo: React.FC<InstitutionLogoProps> = ({ licenseName, licenseType, className = 'h-7 w-9' }) => {
  const logo = getInstitutionLogo(licenseName, licenseType);

  if (!logo) return null;

  return (
    <img
      src={assetUrl(`institution-logos-transparent/${logo.file}`)}
      alt={`Logo ${logo.name}`}
      className={`${className} shrink-0 object-contain`}
      decoding="async"
    />
  );
};
