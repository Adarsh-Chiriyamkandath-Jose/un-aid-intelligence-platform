import { QueryClient, QueryFunction } from "@tanstack/react-query";

/** Error carrying the HTTP status so callers/retry logic can branch on it. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// Transient statuses worth retrying. The backend runs on Render's free tier,
// which cold-starts after idle and briefly returns 502/503/504 (or times out)
// while it wakes up. Retrying with backoff makes that invisible to the user.
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) return RETRYABLE_STATUS.has(error.status);
  // A bare TypeError from fetch means a network/connection failure — retry it.
  return error instanceof TypeError;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Exponential backoff with jitter, capped at 8s. */
export function retryDelay(attempt: number): number {
  return Math.min(8000, 2 ** attempt * 600) + Math.random() * 300;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text().catch(() => "")) || res.statusText;
    throw new ApiError(res.status, text);
  }
}

/**
 * fetch + automatic retry on transient failures, throwing ApiError on non-OK
 * responses. Use this for imperative calls outside React Query (e.g. forecast
 * and SHAP requests). React-Query-managed calls retry via the client defaults.
 */
export async function apiFetch(
  url: string,
  init?: RequestInit,
  retries = 3,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (RETRYABLE_STATUS.has(res.status) && attempt < retries) {
        await sleep(retryDelay(attempt));
        continue;
      }
      await throwIfResNotOk(res);
      return res;
    } catch (error) {
      lastError = error;
      if (isRetryableError(error) && attempt < retries) {
        await sleep(retryDelay(attempt));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/** Convenience: apiFetch + JSON parse. */
export async function apiJson<T = any>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await apiFetch(url, init);
  return res.json();
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  return apiFetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Vercel's /api proxy rewrite 404s on trailing slashes (e.g. "/api/countries/"),
    // so normalize them away. The FastAPI backend accepts both forms.
    const url = (queryKey.join("/") as string).replace(/\/+$/, "");
    const res = await fetch(url, { credentials: "include" });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      retry: (failureCount, error) => failureCount < 3 && isRetryableError(error),
      retryDelay,
    },
    mutations: {
      retry: (failureCount, error) => failureCount < 3 && isRetryableError(error),
      retryDelay,
    },
  },
});

/**
 * Nudge the backend awake as soon as the app loads so the first real
 * interaction doesn't pay the cold-start penalty. Fire-and-forget.
 */
export function warmUpBackend() {
  fetch("/api/health", { credentials: "include" }).catch(() => {});
}
