import React from 'react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendPositive = true,
  iconBg = 'bg-brand-50 text-brand-600',
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {(subtext || trend) && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            {trend && (
              <span
                className={`font-semibold ${
                  trendPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend}
              </span>
            )}
            {subtext && <span>{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
