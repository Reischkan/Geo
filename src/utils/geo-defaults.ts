/**
 * Returns default map coordinates based on the tenant ID.
 * Prevents hardcoding a single city (CDMX) for all tenants.
 */

const TENANT_COORDS: Record<string, { lat: number; lng: number; label: string }> = {
    'tenant-mx': { lat: 19.4326, lng: -99.1332, label: 'Ciudad de México' },
    'tenant-co': { lat: 4.6510, lng: -74.0550, label: 'Bogotá' },
};

const FALLBACK = { lat: 19.4326, lng: -99.1332, label: 'Default' };

export function getDefaultCoordinates(tenantId?: string): { lat: number; lng: number; label: string } {
    if (!tenantId) return FALLBACK;
    return TENANT_COORDS[tenantId] || FALLBACK;
}
