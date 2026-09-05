import React from 'react';

export type BadgeVariant =
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'blue'
  | 'purple'
  | 'slate'
  | 'teal'
  | 'glass';

export type BadgeShape = 'pill' | 'rounded';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  shape?: BadgeShape;
  size?: BadgeSize;
  icon?: React.ReactNode;
  pulseDot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
  emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200/70',
  rose: 'bg-rose-50 text-rose-700 border border-rose-200/70',
  blue: 'bg-blue-50 text-blue-700 border border-blue-200/70',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200/70',
  slate: 'bg-slate-100 text-slate-600 border border-slate-200',
  teal: 'bg-teal-50 text-teal-700 border border-teal-200/70',
  glass: 'bg-white/10 text-white border border-white/20 backdrop-blur-xs',
};

const shapeStyles: Record<BadgeShape, string> = {
  pill: 'rounded-full',
  rounded: 'rounded-md',
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-2 py-0.5 gap-1 font-semibold',
  sm: 'text-[11px] px-2.5 py-0.5 gap-1.5 font-bold',
  md: 'text-xs px-3 py-1 gap-1.5 font-bold',
};

const pulseColors: Record<BadgeVariant, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  slate: 'bg-slate-500',
  teal: 'bg-teal-500',
  glass: 'bg-white',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'indigo',
  shape = 'pill',
  size = 'sm',
  icon,
  pulseDot = false,
  className = '',
  ...props
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return <span className="shrink-0">{icon}</span>;
    }
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return (
      <span className="shrink-0">
        <IconComponent className="w-3 h-3" />
      </span>
    );
  };

  return (
    <span
      className={`inline-flex items-center tracking-tight leading-none ${variantStyles[variant]} ${shapeStyles[shape]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {pulseDot && (
        <span className="relative flex h-2 w-2 mr-0.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColors[variant]}`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${pulseColors[variant]}`}
          />
        </span>
      )}
      {renderIcon()}
      <span>{children}</span>
    </span>
  );
};

