import React from 'react';

export type CardVariant = 'default' | 'interactive' | 'muted' | 'gradient' | 'bordered';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white rounded-2xl border border-slate-200/80 shadow-xs',
  interactive:
    'bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer',
  muted: 'bg-slate-50/70 rounded-2xl border border-slate-200/60',
  gradient: 'bg-gradient-to-br from-indigo-50 to-teal-50 rounded-2xl border border-indigo-100',
  bordered: 'bg-white rounded-2xl border border-slate-200',
};

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'none',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 sm:p-6 pb-3 space-y-1.5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3
    className={`text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 sm:p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`p-5 sm:p-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 ${className}`}
    {...props}
  >
    {children}
  </div>
);
