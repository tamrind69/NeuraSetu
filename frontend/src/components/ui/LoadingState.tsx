import React from 'react';
import { Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export type LoadingStatus = 'loading' | 'success' | 'error';
export type LoadingVariant = 'inline' | 'card' | 'overlay' | 'fullscreen';

export interface LoadingStateProps {
  message?: string;
  submessage?: string;
  progress?: number; // 0 - 100
  status?: LoadingStatus;
  variant?: LoadingVariant;
  icon?: React.ReactNode;
  errorMessage?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Processing...',
  submessage,
  progress,
  status = 'loading',
  variant = 'inline',
  icon,
  errorMessage,
  onCancel,
  onRetry,
  className = '',
}) => {
  const isError = status === 'error';
  const isSuccess = status === 'success';

  const defaultIcon = isError ? (
    <AlertCircle className="w-6 h-6 text-rose-500" />
  ) : isSuccess ? (
    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
  ) : (
    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
  );

  const content = (
    <div className={`flex flex-col items-center justify-center text-center space-y-3 ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center shadow-xs">
          {icon || defaultIcon}
        </div>
        {status === 'loading' && (
          <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
        )}
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-slate-900 tracking-tight">
          {isError ? errorMessage || 'Operation Failed' : message}
        </h4>
        {submessage && <p className="text-xs text-slate-500 leading-relaxed">{submessage}</p>}
      </div>

      {typeof progress === 'number' && status === 'loading' && (
        <div className="w-full max-w-xs space-y-1.5 pt-1">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-indigo-600 block">{Math.round(progress)}%</span>
        </div>
      )}

      {(onCancel || onRetry) && (
        <div className="flex items-center gap-2 pt-2">
          {isError && onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200">
          {content}
        </div>
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-xs rounded-2xl p-6">
        {content}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        {content}
      </div>
    );
  }

  return content;
};
