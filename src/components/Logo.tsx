import React from 'react';
import generatedLogo from '../assets/images/tradewhale_premium_logo_1779203248170.png';

interface LogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
}

export function Logo({ className = "", size = 32, withText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={generatedLogo} 
        alt="Tradewhale Logo" 
        style={{ width: size * 1.5, height: size * 1.5, objectFit: 'cover' }}
        className="shrink-0 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(56,189,248,0.3)] border border-gray-200 dark:border-white/10"
      />
      {withText && (
        <span 
          style={{ fontSize: size * 0.85 }}
          className="font-display font-bold tracking-tight text-gray-900 dark:text-white antialiased flex items-center drop-shadow-sm"
        >
          Trade<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 dark:from-emerald-400 dark:via-teal-400 dark:to-blue-500">whale</span>
        </span>
      )}
    </div>
  );
}
