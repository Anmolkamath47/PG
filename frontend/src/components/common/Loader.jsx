import React from 'react';

export const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-10 h-10">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{message}</p>
    </div>
  );
};
