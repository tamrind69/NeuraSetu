/// <reference types="vite/client" />
/**
 * Centralized API Client
 * Facilitates communication with the Express backend (/api) with graceful
 * fallback to local mock generators in case of network unavailability.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Executes an HTTP fetch request against the backend API.
 * If the request fails and a fallback function is provided, executes the fallback.
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: ApiFetchOptions,
  fallback?: () => Promise<T>
): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  try {
    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs ?? 8000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (fallback) {
      console.warn(
        `[apiClient] Request to ${url} failed; engaging local fallback generator:`,
        error
      );
      return await fallback();
    }
    throw error;
  }
}

/**
 * Helper to perform GET requests.
 */
export async function apiGet<T>(
  endpoint: string,
  fallback?: () => Promise<T>,
  options?: ApiFetchOptions
): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'GET', ...options }, fallback);
}

/**
 * Helper to perform POST requests.
 */
export async function apiPost<T>(
  endpoint: string,
  body: any,
  fallback?: () => Promise<T>,
  options?: ApiFetchOptions
): Promise<T> {
  return apiFetch<T>(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    },
    fallback
  );
}
