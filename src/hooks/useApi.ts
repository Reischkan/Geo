import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch data from the GeoField backend API.
 * Falls back to provided default data if fetch fails.
 */
export function useApi<T>(url: string, fallback: T): { data: T; loading: boolean; error: string | null; refetch: () => void } {
    const [data, setData] = useState<T>(fallback);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trigger, setTrigger] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch(url)
            .then(res => {
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

    return { data, loading, error, refetch: () => setTrigger(t => t + 1) };
}
