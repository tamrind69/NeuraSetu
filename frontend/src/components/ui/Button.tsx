import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ghost'
  | 'gradient'
  | 'glass'
  | 'dark';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 active:translate-y-0 hover:-translate-y-0.5',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold',
  outline:
    'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold',
  success:
    'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 active:translate-y-0 hover:-translate-y-0.5',
  warning:
    'bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20 active:translate-y-0 hover:-translate-y-0.5',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 active:translate-y-0 hover:-translate-y-0.5',
  ghost:
    'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold',
  gradient:
    'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold shadow-lg shadow-teal-500/25 active:translate-y-0 hover:-translate-y-0.5',
  glass:
    'bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/10 backdrop-blur-xs',
  dark:
    'bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl gap-2',
  lg: 'px-6 py-3 text-sm font-bold rounded-xl gap-2',
  icon: 'p-2 rounded-xl flex items-center justify-center',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center transition-all cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:transform-none';

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return <span className="shrink-0">{icon}</span>;
    }
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return (
      <span className="shrink-0">
        <IconComponent className="w-4 h-4" />
      </span>
    );
  };

  return (
    <button
      className={`${baseClasses} ${variantStyles[variant]} ${sizeStyles[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icon && iconPosition === 'left' && renderIcon()
      )}
      {children && <span>{children}</span>}
      {!isLoading && icon && iconPosition === 'right' && renderIcon()}
    </button>
  );
};

