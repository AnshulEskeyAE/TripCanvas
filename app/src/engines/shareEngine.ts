import type { OptionCard, Trip } from '../types';

export interface SharedTripPayload {
  trip: Trip;
  cards: OptionCard[];
  version: number;
}

// Lightweight LZ-String-compatible compression or safe Base64 URL codec
export function encodeShareHash(trip: Trip, cards: OptionCard[]): string {
  try {
    const payload: SharedTripPayload = {
      trip,
      cards,
      version: 1,
    };
    const jsonStr = JSON.stringify(payload);
    // Base64 URL safe encoding
    const encoded = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return encoded;
  } catch (err) {
    console.error('Failed to encode share hash:', err);
    throw new Error('ENCODE_FAILED');
  }
}

export function decodeShareHash(hash: string): SharedTripPayload | null {
  if (!hash || typeof hash !== 'string') return null;
  try {
    // Restore base64 standard padding and chars
    let base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(binary, (ch: string) => '%' + ('00' + ch.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonStr) as SharedTripPayload;
    if (!parsed || !parsed.trip || !Array.isArray(parsed.cards)) {
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn('Failed to decode share hash:', err);
    return null;
  }
}
