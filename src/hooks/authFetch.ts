/**
 * Wrapper around fetch() that automatically adds the JWT Authorization header.
 * Use this for all direct API calls outside of the useApi hook.
 */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('geofield_token');
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (options.body && typeof options.body === 'string') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    return fetch(url, { ...options, headers });
}
