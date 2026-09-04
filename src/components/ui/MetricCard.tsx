import React from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  valueUnit?: string;
  valueColor?: string;
  icon: React.ComponentType<{ className?: string }> | React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  badge?: React.ReactNode;
  description?: string;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  valueUnit,
  valueColor = 'text-slate-900',
  icon,
  iconBg = 'bg-indigo-50',
  iconColor = 'text-indigo-600',
  badge,
  description,
  className = '',
  onClick,
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between text-slate-500 mb-3">
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl shrink-0 ${iconBg} ${iconColor}`}>
          {renderIcon()}
        </div>
      </div>

      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${valueColor}`}>
          {value}
        </span>
        {valueUnit && <span className="text-xs text-slate-500 font-medium">{valueUnit}</span>}
        {badge && <span className="shrink-0">{badge}</span>}
      </div>

      {description && (
        <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{description}</p>
      )}
    </div>
  );
};
