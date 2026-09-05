import { useState, useCallback, useRef, useEffect, type Dispatch, type SetStateAction } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<TData> {
  /**
   * Current execution status: 'idle' | 'loading' | 'success' | 'error'
   */
  status: AsyncStatus;
  /**
   * Data returned by the successful execution, or null.
   */
  data: TData | null;
  /**
   * Error caught during execution, or null.
   */
  error: Error | string | null;
  /**
   * Convenience boolean: true when status === 'loading'
   */
  isLoading: boolean;
  /**
   * Convenience boolean: true when status === 'success'
   */
  isSuccess: boolean;
  /**
   * Convenience boolean: true when status === 'error'
   */
  isError: boolean;
  /**
   * Convenience boolean: true when status === 'idle'
   */
  isIdle: boolean;
}

export interface UseAsyncActionOptions<TData, TArgs extends any[] = any[]> {
  /**
   * Callback invoked immediately after successful async resolution.
   */
  onSuccess?: (data: TData, ...args: TArgs) => void | Promise<void>;
  /**
   * Callback invoked when the async action throws or rejects.
   */
  onError?: (error: Error, ...args: TArgs) => void | Promise<void>;
  /**
   * Callback invoked upon completion, whether success or error.
   */
  onSettled?: (data: TData | null, error: Error | null, ...args: TArgs) => void | Promise<void>;
  /**
   * Initial data value before any execution completes. Defaults to null.
   */
  initialData?: TData | null;
  /**
   * If true, triggers execute() immediately on component mount. Defaults to false.
   */
  immediate?: boolean;
  /**
   * Arguments to pass if immediate execution is enabled.
   */
  immediateArgs?: TArgs;
}

export interface UseAsyncActionReturn<TData, TArgs extends any[] = any[]>
  extends AsyncState<TData> {
  /**
   * Executes the asynchronous action with provided arguments.
   * Returns a promise resolving to the data or undefined on error.
   */
  execute: (...args: TArgs) => Promise<TData | undefined>;
  /**
   * Re-executes the async action with the most recent arguments provided to execute().
   */
  retry: () => Promise<TData | undefined>;
  /**
   * Resets status back to 'idle', clearing errors and restoring initial data.
   */
  reset: () => void;
  /**
   * Manually sets or overrides the stored data state.
   */
  setData: Dispatch<SetStateAction<TData | null>>;
  /**
   * Manually sets or overrides the stored error state.
   */
  setError: Dispatch<SetStateAction<Error | string | null>>;
}

/**
 * Reusable hook for orchestrating asynchronous frontend service operations consistently.
 * Generic across all service domains (Lesson Generation, RAG, TTS, Video, Chat, Evaluation, Translation).
 * Safely guards against unmounted state updates and out-of-order race conditions.
 */
export function useAsyncAction<TData, TArgs extends any[] = any[]>(
  asyncFn: (...args: TArgs) => Promise<TData>,
  options: UseAsyncActionOptions<TData, TArgs> = {}
): UseAsyncActionReturn<TData, TArgs> {
  const {
    onSuccess,
    onError,
    onSettled,
    initialData = null,
    immediate = false,
    immediateArgs,
  } = options;

  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [data, setData] = useState<TData | null>(initialData);
  const [error, setError] = useState<Error | string | null>(null);

  // Safety refs
  const isMountedRef = useRef<boolean>(true);
  const executionIdRef = useRef<number>(0);
  const lastArgsRef = useRef<TArgs | null>(null);

  // Keep latest callbacks in refs to prevent unnecessary re-creations
  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Primary execution function
   */
  const execute = useCallback(
    async (...args: TArgs): Promise<TData | undefined> => {
      lastArgsRef.current = args;
      const currentExecutionId = ++executionIdRef.current;

      setStatus('loading');
      setError(null);

      try {
        const result = await asyncFnRef.current(...args);

        // Guard against race conditions and unmounts
        if (!isMountedRef.current || currentExecutionId !== executionIdRef.current) {
          return undefined;
        }

        setData(result);
        setStatus('success');

        if (onSuccessRef.current) {
          await onSuccessRef.current(result, ...args);
        }

        if (onSettledRef.current) {
          await onSettledRef.current(result, null, ...args);
        }

        return result;
      } catch (err) {
        // Guard against race conditions and unmounts
        if (!isMountedRef.current || currentExecutionId !== executionIdRef.current) {
          return undefined;
        }

        const normalizedError = err instanceof Error ? err : new Error(String(err));
        setError(normalizedError);
        setStatus('error');

        if (onErrorRef.current) {
          await onErrorRef.current(normalizedError, ...args);
        }

        if (onSettledRef.current) {
          await onSettledRef.current(null, normalizedError, ...args);
        }

        return undefined;
      }
    },
    []
  );

  /**
   * Retries the previous invocation with the same arguments
   */
  const retry = useCallback(async (): Promise<TData | undefined> => {
    if (!lastArgsRef.current) {
      console.warn('[useAsyncAction] retry() called without previous arguments to execute.');
      return execute(...([] as unknown as TArgs));
    }
    return execute(...lastArgsRef.current);
  }, [execute]);

  /**
   * Resets hook to idle state
   */
  const reset = useCallback(() => {
    executionIdRef.current++;
    setStatus('idle');
    setData(initialData);
    setError(null);
  }, [initialData]);

  // Handle immediate execution if requested
  useEffect(() => {
    if (immediate) {
      const argsToUse = (immediateArgs || []) as unknown as TArgs;
      execute(...argsToUse);
    }
  }, [immediate]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    status,
    data,
    error,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle',
    execute,
    retry,
    reset,
    setData,
    setError,
  };
}
