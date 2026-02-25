import { authFetch } from './authFetch';

/** Send the technician's current GPS position to the server. */
export function sendLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            authFetch('/api/technicians/me/location', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            }).catch(() => { /* silent */ });
        },
        () => { /* permission denied or error — silent */ },
        { enableHighAccuracy: true, timeout: 10000 },
    );
}
