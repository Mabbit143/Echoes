// Safe and resilient API client for Echoes: The Human Map

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**
 * Executes a fetch request with guaranteed JSON error handling,
 * timeout protection, and anti-crash response parsing.
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 12000
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, {
      ...init,
      signal: init?.signal || controller.signal,
    });

    clearTimeout(timer);

    const contentType = res.headers.get('content-type') || '';
    let parsedData: any = null;

    if (contentType.includes('application/json')) {
      try {
        parsedData = await res.json();
      } catch (jsonErr: any) {
        return {
          ok: false,
          status: res.status,
          error: `Malformed JSON response from server (${jsonErr?.message || 'Parse error'})`,
        };
      }
    } else {
      // Non-JSON response (e.g. text/html 404 or proxy error)
      const rawText = await res.text().catch(() => '');
      const trimmed = rawText.trim();
      const snippet = trimmed.startsWith('<')
        ? 'Server returned HTML instead of JSON (endpoint may be unavailable)'
        : trimmed.slice(0, 100);

      return {
        ok: false,
        status: res.status,
        error: snippet || `Unexpected response format (${contentType || 'unknown'})`,
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: parsedData,
        error: parsedData?.error || `Server returned error status ${res.status}`,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: parsedData,
    };
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return {
        ok: false,
        status: 408,
        error: 'Request timed out. Please check your network connection.',
      };
    }
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network connection failed. Operating in offline/cached mode.',
    };
  }
}
