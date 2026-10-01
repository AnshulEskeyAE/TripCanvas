export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';
export type ThemeMode = 'light' | 'dark';
export type Category = 'FLIGHT' | 'TRAIN' | 'HOTEL' | 'AIRBNB' | 'EXCURSION';
export type CardState = 'DRAFT' | 'UNSORTED' | 'REJECTED' | string;

export type PlanColor = 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'cyan';

export interface PlanDefinition {
  id: string; // e.g. 'PLAN_A', 'PLAN_B', 'PLAN_C', or uuid
  name: string; // e.g. 'Plan A (Budget Focus)'
  color: PlanColor;
}

export interface FeeLineItem {
  label: string;
  amount: number;
  is_statutory_tax: boolean;
  is_estimate: boolean;
}

export interface SpatialAnchor {
  raw_query: string;
  latitude?: number;
  longitude?: number;
}

export interface OptionCard {
  card_id: string;
  trip_id: string;
  title: string;
  category: Category;
  headline_price: number;
  fee_breakdown: FeeLineItem[];
  buffer_pct: number; // default e.g. 5%
  departure_or_checkin: string; // ISO datetime string
  arrival_or_checkout: string; // ISO datetime string
  spatial_anchor: SpatialAnchor;
  pros_tags: string[];
  cons_tags: string[];
  merchant_url?: string;
  bundle: CardState;
  created_at: number;
}

export interface Trip {
  trip_id: string;
  trip_name: string;
  origin_city?: string;
  destination_city: string;
  start_date: string;
  end_date: string;
  currency: Currency;
  budget_ceiling: number;
  party_size: number;
  created_at: number;
  plans?: PlanDefinition[]; // Dynamic arbitrary number of plans!
  plan_a_name?: string; // legacy support
  plan_b_name?: string; // legacy support
}

export interface ConflictResult {
  card_id: string;
  rule: 'CR-01' | 'CR-02' | 'CR-03';
  severity: 'warning' | 'severe' | 'error';
  message: string;
  gap_hours?: number;
  transit_minutes?: number;
  is_estimated_transit: boolean;
}

export interface BasketSummary {
  basket_total: number;
  headline_total: number;
  fees_total: number;
  buffer_total: number;
  per_person_cost: number;
  budget_percentage: number;
  is_over_budget: boolean;
}
