import React from 'react';

export const OrbitalLogo: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 28,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block ${className}`}
  >
    {/* Outer orbital ring */}
    <circle cx="50" cy="50" r="44" stroke="#1C2A3A" strokeWidth="2.5" />
    {/* Concentric seismic pulse wave */}
    <circle
      cx="50"
      cy="50"
      r="33"
      stroke="#62E8D0"
      strokeWidth="2"
      strokeDasharray="6 4"
      className="animate-[spin_20s_linear_infinite]"
    />
    {/* Middle energy contour */}
    <circle cx="50" cy="50" r="21" fill="#0D1420" stroke="#FFB45C" strokeWidth="2" />
    {/* Core focal epicenter */}
    <circle cx="50" cy="50" r="11" fill="#FF6D6D" />
    {/* Center pulse dot */}
    <circle cx="50" cy="50" r="4" fill="#EDF4F7" />
  </svg>
);
