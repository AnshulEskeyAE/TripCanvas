import type { ConflictResult, OptionCard } from '../types';

interface CoordinateCache {
  [query: string]: [number, number];
}

interface RouteDurationCache {
  [key: string]: number;
}

const geoCache: CoordinateCache = {};
const routeCache: RouteDurationCache = {};

// Nominatim Geocoding (Free, rate-respecting OpenStreetMap endpoint)
export async function geocode(query: string): Promise<[number, number] | null> {
  if (!query || query.trim().length < 2) return null;
  const clean = query.trim().toLowerCase();
  if (geoCache[clean]) return geoCache[clean];

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clean)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TripCanvas/1.0 (contact@tripcanvas.app)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data[0] && data[0].lat && data[0].lon) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geoCache[clean] = coords;
      return coords;
    }
  } catch (err) {
    // Non-blocking fallback
    console.debug('Nominatim geocode fallback:', err);
  }
  return null;
}

// OSRM Driving Duration (Free OpenStreetMap routing)
export async function getDrivingMinutes(
  from: [number, number],
  to: [number, number]
): Promise<number | null> {
  const cacheKey = `${from[0].toFixed(3)},${from[1].toFixed(3)}->${to[0].toFixed(3)},${to[1].toFixed(3)}`;
  if (routeCache[cacheKey] !== undefined) return routeCache[cacheKey];

  try {
    // OSRM coordinates format: {lon},{lat};{lon},{lat}
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=false`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TripCanvas/1.0 (contact@tripcanvas.app)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const durationSeconds = data?.routes?.[0]?.duration;
    if (typeof durationSeconds === 'number') {
      // Apply +25% urban friction buffer
      const bufferedMinutes = Math.max(15, Math.round((durationSeconds / 60) * 1.25));
      routeCache[cacheKey] = bufferedMinutes;
      return bufferedMinutes;
    }
  } catch (err) {
    console.debug('OSRM routing fallback to heuristic:', err);
  }
  return null;
}

// Main Conflict Evaluator for a specific bundle of cards
export async function evaluateBundleConflicts(bundleCards: OptionCard[]): Promise<ConflictResult[]> {
  const results: ConflictResult[] = [];
  if (!bundleCards || bundleCards.length === 0) return results;

  // Rule CR-03: Temporal Inversion Check on each individual card
  for (const card of bundleCards) {
    if (card.departure_or_checkin && card.arrival_or_checkout) {
      const start = new Date(card.departure_or_checkin).getTime();
      const end = new Date(card.arrival_or_checkout).getTime();
      if (!isNaN(start) && !isNaN(end) && end <= start) {
        results.push({
          card_id: card.card_id,
          rule: 'CR-03',
          severity: 'error',
          message:
            card.category === 'HOTEL' || card.category === 'AIRBNB'
              ? 'Checkout time must be after check-in time.'
              : 'Arrival time must be after departure time.',
          is_estimated_transit: false,
        });
      }
    }
  }

  const transitCards = bundleCards.filter(
    (c) => (c.category === 'FLIGHT' || c.category === 'TRAIN') && c.bundle !== 'REJECTED'
  );
  const stayCards = bundleCards.filter(
    (c) => (c.category === 'HOTEL' || c.category === 'AIRBNB') && c.bundle !== 'REJECTED'
  );

  if (transitCards.length === 0 || stayCards.length === 0) {
    return results;
  }

  // Cross-examine transit arrival with stay check-in (Rule CR-01)
  for (const transit of transitCards) {
    if (!transit.arrival_or_checkout) continue;
    const transitArrivalTime = new Date(transit.arrival_or_checkout).getTime();
    if (isNaN(transitArrivalTime)) continue;

    for (const stay of stayCards) {
      if (!stay.departure_or_checkin) continue;
      const stayCheckinTime = new Date(stay.departure_or_checkin).getTime();
      if (isNaN(stayCheckinTime)) continue;

      // Only compare if dates correlate (same day or within 24 hours)
      const diffHours = (stayCheckinTime - transitArrivalTime) / (1000 * 60 * 60);
      if (diffHours < -12 || diffHours > 36) continue;

      // Determine transit duration
      let transitMinutes = 60; // Default 1 hour fallback
      let isEstimated = true;

      // Attempt OSRM if locations are present
      const transitLoc = transit.spatial_anchor?.raw_query;
      const stayLoc = stay.spatial_anchor?.raw_query;

      if (transitLoc && stayLoc) {
        const [c1, c2] = await Promise.all([
          transit.spatial_anchor.latitude && transit.spatial_anchor.longitude
            ? ([transit.spatial_anchor.latitude, transit.spatial_anchor.longitude] as [number, number])
            : geocode(transitLoc),
          stay.spatial_anchor.latitude && stay.spatial_anchor.longitude
            ? ([stay.spatial_anchor.latitude, stay.spatial_anchor.longitude] as [number, number])
            : geocode(stayLoc),
        ]);

        if (c1 && c2) {
          const driveMins = await getDrivingMinutes(c1, c2);
          if (driveMins !== null) {
            transitMinutes = driveMins;
            isEstimated = false;
          }
        }
      }

      // Airport baggage & deboarding clearance: 45 minutes
      const clearanceMinutes = transit.category === 'FLIGHT' ? 45 : 20;
      const effectiveArrival = transitArrivalTime + (clearanceMinutes + transitMinutes) * 60 * 1000;
      const luggageGapHours = (stayCheckinTime - effectiveArrival) / (1000 * 60 * 60);

      // Evaluate CR-01
      if (luggageGapHours > 5.0) {
        results.push({
          card_id: stay.card_id,
          rule: 'CR-01',
          severity: 'severe',
          gap_hours: Math.round(luggageGapHours * 10) / 10,
          transit_minutes: transitMinutes,
          is_estimated_transit: isEstimated,
          message: `Critical ${luggageGapHours.toFixed(1)}h luggage gap before check-in. Traveler may be stranded with luggage half the day.`,
        });
      } else if (luggageGapHours > 2.0) {
        results.push({
          card_id: stay.card_id,
          rule: 'CR-01',
          severity: 'warning',
          gap_hours: Math.round(luggageGapHours * 10) / 10,
          transit_minutes: transitMinutes,
          is_estimated_transit: isEstimated,
          message: `Arrives ~${luggageGapHours.toFixed(1)}h before check-in. Consider requesting early check-in or luggage storage.`,
        });
      } else if (luggageGapHours < -0.5) {
        results.push({
          card_id: stay.card_id,
          rule: 'CR-01',
          severity: 'warning',
          gap_hours: Math.round(Math.abs(luggageGapHours) * 10) / 10,
          transit_minutes: transitMinutes,
          is_estimated_transit: isEstimated,
          message: `Transit arrives after check-in opens. Verify host/hotel front desk 24hr availability.`,
        });
      }

      // Check CR-02 (Checkout to Departure rush)
      if (stay.arrival_or_checkout && transit.departure_or_checkin) {
        const checkoutTime = new Date(stay.arrival_or_checkout).getTime();
        const departureTime = new Date(transit.departure_or_checkin).getTime();
        const checkoutToFlightHours = (departureTime - (checkoutTime + transitMinutes * 60 * 1000)) / (1000 * 60 * 60);

        if (checkoutToFlightHours > 0 && checkoutToFlightHours < 2.5) {
          results.push({
            card_id: transit.card_id,
            rule: 'CR-02',
            severity: 'warning',
            gap_hours: Math.round(checkoutToFlightHours * 10) / 10,
            transit_minutes: transitMinutes,
            is_estimated_transit: isEstimated,
            message: `Checkout leaves only ${checkoutToFlightHours.toFixed(1)}h airport buffer. High rush or missed flight risk.`,
          });
        }
      }
    }
  }

  return results;
}
