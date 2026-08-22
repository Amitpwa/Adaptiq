/**
 * Browser-side API client.
 *
 * Unwraps the { data } / { error } envelope so callers work with values and
 * exceptions rather than branching on response shape at every call site.
 */

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError('NETWORK', 'We could not reach the server. Check your connection.', 0);
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: { code: string; message: string; details?: Array<{ field: string; message: string }> } }
    | null;

  if (!response.ok || !payload || payload.error) {
    throw new ApiError(
      payload?.error?.code ?? 'UNKNOWN',
      payload?.error?.message ?? 'Something went wrong.',
      response.status,
      payload?.error?.details,
    );
  }

  return payload.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
};
