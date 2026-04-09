import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to fetch data from the GeoField backend API.
 * Sends JWT token from localStorage. Falls back to provided default data if fetch fails.
 * @param pollInterval — optional polling interval in milliseconds for auto-refresh
 */
export function useApi<T>(url: string, fallback: T, pollInterval?: number): { data: T; loading: boolean; error: string | null; refetch: () => void } {
    const [data, setData] = useState<T>(fallback);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trigger, setTrigger] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const token = localStorage.getItem('geofield_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch(url, { headers })
            .then(res => {
                if (res.status === 401) {
                    // Token expired — force logout
                    localStorage.removeItem('geofield_token');
                    window.location.href = '/login';
                    throw new Error('Unauthorized');
                }
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(json => {
                if (!cancelled) {
                    setData(json);
                    setError(null);
                }
            })
            .catch(err => {
                if (!cancelled) {
                    setError(err.message);
                    // Keep fallback data on error
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [url, trigger]);

    // Polling: auto-refetch at the given interval
    const refetch = useCallback(() => setTrigger(t => t + 1), []);
    const refetchRef = useRef(refetch);
    refetchRef.current = refetch;

    useEffect(() => {
        if (!pollInterval || pollInterval <= 0) return;
        const id = setInterval(() => refetchRef.current(), pollInterval);
        return () => clearInterval(id);
    }, [pollInterval]);

    return { data, loading, error, refetch };
}
