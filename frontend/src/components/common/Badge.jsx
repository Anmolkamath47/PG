import React from 'react';
import { getStatusBadgeClass } from '../../utils/formatters.js';

export const Badge = ({ status, label, className = '' }) => {
  const displayLabel = label || status?.replace(/_/g, ' ') || 'Unknown';
  const badgeClass = getStatusBadgeClass(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border capitalize ${badgeClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {displayLabel}
    </span>
  );
};
