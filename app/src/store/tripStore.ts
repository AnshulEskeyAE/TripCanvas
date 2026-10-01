import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BasketSummary, CardState, Currency, OptionCard, PlanColor, PlanDefinition, ThemeMode, Trip } from '../types';

const USD_EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.0,
  INR: 86.5,
  EUR: 0.92,
  GBP: 0.77,
  JPY: 152.0,
};

const PLAN_COLORS: PlanColor[] = ['emerald', 'blue', 'purple', 'amber', 'rose', 'cyan'];

function getConversionFactor(from: Currency, to: Currency): number {
  if (from === to) return 1.0;
  const fromToUsd = 1.0 / (USD_EXCHANGE_RATES[from] || 1.0);
  const usdToTarget = USD_EXCHANGE_RATES[to] || 1.0;
  return fromToUsd * usdToTarget;
}

function normalizeTripPlans(trip: Trip | null): Trip | null {
  if (!trip) return null;
  if (Array.isArray(trip.plans) && trip.plans.length > 0) {
    return trip;
  }
  // Migration for legacy trips
  const planA = trip.plan_a_name || 'Plan A';
  const planB = trip.plan_b_name || 'Plan B';
  return {
    ...trip,
    plans: [
      { id: 'PLAN_A', name: planA, color: 'emerald' },
      { id: 'PLAN_B', name: planB, color: 'blue' },
    ],
  };
}

interface TripStoreState {
  trip: Trip | null;
  cards: OptionCard[];
  anonymous_id: string;
  theme: ThemeMode;

  // Actions
  initTrip: (trip: Trip) => void;
  updateTrip: (partial: Partial<Trip>) => void;
  setCurrency: (newCurrency: Currency, convertExisting?: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;

  // Multi-Plan Actions
  addPlan: (name?: string) => void;
  renamePlan: (planId: string, newName: string) => void;
  deletePlan: (planId: string) => void;

  upsertCard: (card: OptionCard) => void;
  updateCardBundle: (card_id: string, bundle: CardState) => void;
  rejectCard: (card_id: string) => void;
  deleteCard: (card_id: string) => void;
  resetTrip: () => void;

  // Helpers
  getCardsByBundle: (bundle: CardState) => OptionCard[];
  computeBasketSummary: (bundle: string) => BasketSummary;
}

export const useTripStore = create<TripStoreState>()(
  persist(
    (set, get) => ({
      trip: null,
      cards: [],
      theme: 'light',
      anonymous_id:
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,

      initTrip: (trip: Trip) => set({ trip: normalizeTripPlans(trip) }),

      updateTrip: (partial: Partial<Trip>) =>
        set((state) => ({
          trip: state.trip ? normalizeTripPlans({ ...state.trip, ...partial }) : null,
        })),

      addPlan: (name?: string) =>
        set((state) => {
          if (!state.trip) return state;
          const currentPlans = state.trip.plans || [];
          const nextIndex = currentPlans.length;
          const letter = String.fromCharCode(65 + nextIndex); // C, D, E...
          const planName = name?.trim() || `Plan ${letter}`;
          const color = PLAN_COLORS[nextIndex % PLAN_COLORS.length];
          const newPlanId = `PLAN_${letter}_${Date.now().toString(36)}`;

          const newPlan: PlanDefinition = {
            id: newPlanId,
            name: planName,
            color,
          };

          return {
            trip: {
              ...state.trip,
              plans: [...currentPlans, newPlan],
            },
          };
        }),

      renamePlan: (planId: string, newName: string) =>
        set((state) => {
          if (!state.trip || !newName.trim()) return state;
          const currentPlans = state.trip.plans || [];
          return {
            trip: {
              ...state.trip,
              plans: currentPlans.map((p) =>
                p.id === planId ? { ...p, name: newName.trim() } : p
              ),
            },
          };
        }),

      deletePlan: (planId: string) =>
        set((state) => {
          if (!state.trip) return state;
          const currentPlans = state.trip.plans || [];
          if (currentPlans.length <= 1) return state;
          const currentCards = Array.isArray(state.cards) ? state.cards : [];
          // Move any card in deleted plan back to UNSORTED
          const updatedCards = currentCards.map((c) =>
            c.bundle === planId ? { ...c, bundle: 'UNSORTED' } : c
          );

          return {
            trip: {
              ...state.trip,
              plans: currentPlans.filter((p) => p.id !== planId),
            },
            cards: updatedCards,
          };
        }),

      setCurrency: (newCurrency: Currency, convertExisting = false) =>
        set((state) => {
          if (!state.trip) return state;
          const oldCurrency = state.trip.currency;
          if (oldCurrency === newCurrency) return state;

          const factor = getConversionFactor(oldCurrency, newCurrency);
          const newCeiling = convertExisting
            ? Math.round(state.trip.budget_ceiling * factor)
            : state.trip.budget_ceiling;

          const currentCards = Array.isArray(state.cards) ? state.cards : [];
          const updatedCards = convertExisting
            ? currentCards.map((card) => {
                const fees = Array.isArray(card.fee_breakdown) ? card.fee_breakdown : [];
                return {
                  ...card,
                  headline_price: Math.round(card.headline_price * factor),
                  fee_breakdown: fees.map((f) => ({
                    ...f,
                    amount: Math.round(f.amount * factor),
                  })),
                };
              })
            : currentCards;

          return {
            trip: {
              ...state.trip,
              currency: newCurrency,
              budget_ceiling: newCeiling,
            },
            cards: updatedCards,
          };
        }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      setTheme: (theme: ThemeMode) => set({ theme }),

      upsertCard: (card: OptionCard) =>
        set((state) => {
          const currentCards = Array.isArray(state.cards) ? state.cards : [];
          const index = currentCards.findIndex((c) => c && c.card_id === card.card_id);
          if (index >= 0) {
            const updated = [...currentCards];
            updated[index] = card;
            return { cards: updated };
          }
          return { cards: [card, ...currentCards] };
        }),

      updateCardBundle: (card_id: string, bundle: CardState) =>
        set((state) => {
          const currentCards = Array.isArray(state.cards) ? state.cards : [];
          return {
            cards: currentCards.map((c) => (c && c.card_id === card_id ? { ...c, bundle } : c)),
          };
        }),

      rejectCard: (card_id: string) =>
        set((state) => {
          const currentCards = Array.isArray(state.cards) ? state.cards : [];
          return {
            cards: currentCards.map((c) =>
              c && c.card_id === card_id ? { ...c, bundle: 'REJECTED' } : c
            ),
          };
        }),

      deleteCard: (card_id: string) =>
        set((state) => {
          const currentCards = Array.isArray(state.cards) ? state.cards : [];
          return {
            cards: currentCards.filter((c) => c && c.card_id !== card_id),
          };
        }),

      resetTrip: () => set({ trip: null, cards: [] }),

      getCardsByBundle: (bundle: CardState) => {
        const state = get();
        const allCards = Array.isArray(state.cards) ? state.cards : [];
        return allCards.filter((c) => c && c.bundle === bundle);
      },

      computeBasketSummary: (bundle: string): BasketSummary => {
        const state = get();
        const allCards = Array.isArray(state.cards) ? state.cards : [];
        const bundleCards = allCards.filter((c) => c && c.bundle === bundle);
        const partySize = state.trip?.party_size && state.trip.party_size > 0 ? state.trip.party_size : 1;
        const budgetCeiling = state.trip?.budget_ceiling || 0;

        let headlineTotal = 0;
        let feesTotal = 0;
        let bufferTotal = 0;

        for (const card of bundleCards) {
          const headline = Number(card.headline_price) || 0;
          headlineTotal += headline;

          const feeBreakdown = Array.isArray(card.fee_breakdown) ? card.fee_breakdown : [];
          const cardFees = feeBreakdown.reduce((sum, f) => sum + (Number(f?.amount) || 0), 0);
          feesTotal += cardFees;

          const buffer = Math.round((headline * (Number(card.buffer_pct) || 0)) / 100);
          bufferTotal += buffer;
        }

        const basketTotal = headlineTotal + feesTotal + bufferTotal;
        const perPersonCost = Math.round(basketTotal / partySize);
        const budgetPercentage = budgetCeiling > 0 ? Math.round((basketTotal / budgetCeiling) * 100) : 0;

        return {
          basket_total: basketTotal,
          headline_total: headlineTotal,
          fees_total: feesTotal,
          buffer_total: bufferTotal,
          per_person_cost: perPersonCost,
          budget_percentage: budgetPercentage,
          is_over_budget: budgetCeiling > 0 && basketTotal > budgetCeiling,
        };
      },
    }),
    {
      name: 'tripcanvas_v1_store',
      onRehydrateStorage: () => (state) => {
        if (state && state.trip) {
          state.trip = normalizeTripPlans(state.trip);
        }
      },
    }
  )
);
