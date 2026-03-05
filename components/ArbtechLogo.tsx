import React from 'react';

interface ArbtechLogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
    textColor?: string;
}

const ArbtechLogo: React.FC<ArbtechLogoProps> = ({
    size = 32,
    showText = true,
    className = '',
    textColor = '#94a3b8'
}) => (
    <div className={`flex items-center gap-3 ${className}`}>
        <img
            src="/logo.png"
            alt="Arbtech Logo"
            style={{ width: size, height: 'auto', objectFit: 'contain' }}
        />
        {showText && (
            <span style={{ color: textColor }} className="text-[10px] font-semibold leading-tight">
                Criado por: Arbtech Info<br />Licensing Software
            </span>
        )}
    </div>
);

export default ArbtechLogo;
