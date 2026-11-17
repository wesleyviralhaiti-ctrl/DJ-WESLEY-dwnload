import React from 'react';

interface BrandEmblemProps {
  size?: number;
  className?: string;
}

export const BrandEmblem: React.FC<BrandEmblemProps> = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wesleyBg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#070A12" />
        </linearGradient>
        <linearGradient id="wesleyRoyalBlue" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="62" height="62" rx="16" fill="url(#wesleyBg)" stroke="#2563EB" strokeOpacity="0.65" strokeWidth="1.5" />
      {/* DJ Headphone Arc */}
      <path
        d="M16 35V30C16 21.1634 23.1634 14 32 14C40.8366 14 48 21.1634 48 30V35"
        stroke="url(#wesleyRoyalBlue)"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      {/* Left Ear Cup */}
      <rect x="12.5" y="31.5" width="6.5" height="13" rx="3.25" fill="#2563EB" stroke="#38BDF8" strokeWidth="1.2" />
      {/* Right Ear Cup */}
      <rect x="45" y="31.5" width="6.5" height="13" rx="3.25" fill="#2563EB" stroke="#38BDF8" strokeWidth="1.2" />
      {/* Download Arrow */}
      <path
        d="M32 25V41M32 41L26 35M32 41L38 35"
        stroke="#F1F5F9"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Base Bar */}
      <path d="M24 47H40" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
};
