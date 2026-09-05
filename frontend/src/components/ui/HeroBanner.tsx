import React from 'react';

export interface HeroBannerProps {
  tagText: string;
  tagIcon?: React.ReactNode;
  title: string | React.ReactNode;
  description: string | React.ReactNode;
  actions?: React.ReactNode;
  statBadge?: {
    label: string;
    value: string | number;
    valueColor?: string;
  };
  className?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  tagText,
  tagIcon,
  title,
  description,
  actions,
  statBadge,
  className = '',
}) => {
  const renderTagIcon = () => {
    if (!tagIcon) return null;
    if (React.isValidElement(tagIcon)) {
      return <span className="shrink-0">{tagIcon}</span>;
    }
    const IconComponent = tagIcon as React.ComponentType<{ className?: string }>;
    return (
      <span className="shrink-0">
        <IconComponent className="w-3.5 h-3.5 text-indigo-400" />
      </span>
    );
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-700/40 ${className}`}
    >
      {/* Decorative ambient blur spheres */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-32 -mb-16 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
            {renderTagIcon()}
            <span>{tagText}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {title}
          </h1>

          <div className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {description}
          </div>
        </div>

        {/* Right Action slot or Stat Badge */}
        {(actions || statBadge) && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {statBadge && (
              <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-right">
                <span className="text-[11px] text-slate-300 uppercase tracking-wider block font-medium">
                  {statBadge.label}
                </span>
                <span className={`text-2xl font-black ${statBadge.valueColor || 'text-teal-300'}`}>
                  {statBadge.value}
                </span>
              </div>
            )}
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
