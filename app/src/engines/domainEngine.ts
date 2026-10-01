import type { Category, Currency, FeeLineItem, OptionCard } from '../types';

export interface FeeTemplate {
  label: string;
  amount_pct?: number; // e.g. 0.14 = 14%
  flat_amount_by_currency?: Partial<Record<Currency, number>>;
  is_statutory_tax: boolean;
  is_estimate: boolean;
}

export interface DomainRule {
  domain: string;
  category: Category;
  fees: FeeTemplate[];
  defaultBufferPct: number;
}

const DOMAIN_RULES: DomainRule[] = [
  {
    domain: 'airbnb.',
    category: 'AIRBNB',
    defaultBufferPct: 5,
    fees: [
      {
        label: 'Airbnb Guest Service Fee (Est)',
        amount_pct: 0.14,
        is_statutory_tax: false,
        is_estimate: true,
      },
      {
        label: 'Cleaning Fee (Est)',
        flat_amount_by_currency: { INR: 1500, USD: 25, EUR: 25, GBP: 20, JPY: 3500 },
        is_statutory_tax: false,
        is_estimate: true,
      },
      {
        label: 'Occupancy Tax (Est)',
        amount_pct: 0.10,
        is_statutory_tax: true,
        is_estimate: true,
      },
    ],
  },
  {
    domain: 'booking.com',
    category: 'HOTEL',
    defaultBufferPct: 5,
    fees: [
      {
        label: 'Resort / City Tax (Est)',
        flat_amount_by_currency: { INR: 800, USD: 15, EUR: 15, GBP: 12, JPY: 2000 },
        is_statutory_tax: true,
        is_estimate: true,
      },
      {
        label: 'Hotel VAT / GST (Est)',
        amount_pct: 0.12,
        is_statutory_tax: true,
        is_estimate: true,
      },
    ],
  },
  {
    domain: 'makemytrip.com',
    category: 'FLIGHT',
    defaultBufferPct: 5,
    fees: [
      {
        label: 'Convenience Fee (Est)',
        flat_amount_by_currency: { INR: 350, USD: 5, EUR: 5, GBP: 4, JPY: 700 },
        is_statutory_tax: false,
        is_estimate: true,
      },
      {
        label: 'Aviation GST (Est)',
        amount_pct: 0.08,
        is_statutory_tax: true,
        is_estimate: true,
      },
    ],
  },
  {
    domain: 'cleartrip.com',
    category: 'FLIGHT',
    defaultBufferPct: 5,
    fees: [
      {
        label: 'Convenience Fee (Est)',
        flat_amount_by_currency: { INR: 350, USD: 5, EUR: 5, GBP: 4, JPY: 700 },
        is_statutory_tax: false,
        is_estimate: true,
      },
    ],
  },
  {
    domain: 'indigo.in',
    category: 'FLIGHT',
    defaultBufferPct: 5,
    fees: [
      {
        label: 'Checked Baggage Tier (Est)',
        flat_amount_by_currency: { INR: 1200, USD: 18, EUR: 18, GBP: 15, JPY: 2500 },
        is_statutory_tax: false,
        is_estimate: true,
      },
      {
        label: 'Airport Surcharge & GST (Est)',
        amount_pct: 0.08,
        is_statutory_tax: true,
        is_estimate: true,
      },
    ],
  },
  {
    domain: 'airindia.com',
    category: 'FLIGHT',
    defaultBufferPct: 5,
    fees: [
      {
        label: 'Aviation Tax / Fuel Surcharge (Est)',
        amount_pct: 0.08,
        is_statutory_tax: true,
        is_estimate: true,
      },
    ],
  },
  {
    domain: 'akasaair.com',
    category: 'FLIGHT',
    defaultBufferPct: 5,
    fees: [
      {
        label: 'Checked Baggage (Est)',
        flat_amount_by_currency: { INR: 1200, USD: 18, EUR: 18, GBP: 15, JPY: 2500 },
        is_statutory_tax: false,
        is_estimate: true,
      },
    ],
  },
  {
    domain: 'expedia.',
    category: 'HOTEL',
    defaultBufferPct: 5,
    fees: [
      {
        label: 'Destination / Resort Fee (Est)',
        flat_amount_by_currency: { INR: 800, USD: 15, EUR: 15, GBP: 12, JPY: 2000 },
        is_statutory_tax: false,
        is_estimate: true,
      },
      {
        label: 'Occupancy Tax (Est)',
        amount_pct: 0.12,
        is_statutory_tax: true,
        is_estimate: true,
      },
    ],
  },
  {
    domain: 'hotels.com',
    category: 'HOTEL',
    defaultBufferPct: 5,
    fees: [
      {
        label: 'Service & Tax Recovery (Est)',
        amount_pct: 0.14,
        is_statutory_tax: true,
        is_estimate: true,
      },
    ],
  },
];

export function detectDomain(url: string): DomainRule | null {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    for (const rule of DOMAIN_RULES) {
      if (host.includes(rule.domain) || host.endsWith(rule.domain.replace('.', ''))) {
        return rule;
      }
    }
  } catch {
    // Malformed URL, try fallback regex
    const lower = url.toLowerCase();
    for (const rule of DOMAIN_RULES) {
      if (lower.includes(rule.domain)) {
        return rule;
      }
    }
  }
  return null;
}

export function computeDefaultFees(
  rule: DomainRule | null,
  headlinePrice: number,
  currency: Currency = 'INR'
): FeeLineItem[] {
  if (!rule || headlinePrice <= 0) return [];

  return rule.fees.map((f) => {
    let amount = 0;
    if (f.amount_pct) {
      amount = Math.round(headlinePrice * f.amount_pct);
    } else if (f.flat_amount_by_currency) {
      amount = f.flat_amount_by_currency[currency] ?? f.flat_amount_by_currency.USD ?? 0;
    }
    return {
      label: f.label,
      amount,
      is_statutory_tax: f.is_statutory_tax,
      is_estimate: f.is_estimate,
    };
  });
}

export function calculateCardTrueTotal(card: OptionCard): number {
  const feesSum = card.fee_breakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const bufferAmount = Math.round(((Number(card.headline_price) || 0) * (Number(card.buffer_pct) || 0)) / 100);
  return (Number(card.headline_price) || 0) + feesSum + bufferAmount;
}
