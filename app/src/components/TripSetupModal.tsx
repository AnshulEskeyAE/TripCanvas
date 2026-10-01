import React, { useState } from 'react';
import type { Currency, OptionCard, Trip } from '../types';
import { useTripStore } from '../store/tripStore';
import { analytics } from '../analytics';

interface TripSetupModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const TripSetupModal: React.FC<TripSetupModalProps> = ({ isOpen, onClose }) => {
  const initTrip = useTripStore((s) => s.initTrip);
  const upsertCard = useTripStore((s) => s.upsertCard);

  const [tripName, setTripName] = useState('Kyoto & Tokyo Autumn');
  const [destination, setDestination] = useState('Kyoto, Japan');
  const [origin, setOrigin] = useState('Bangalore (BLR)');
  const [startDate, setStartDate] = useState('2026-11-10');
  const [endDate, setEndDate] = useState('2026-11-16');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [budgetCeiling, setBudgetCeiling] = useState<number>(100000);
  const [partySize, setPartySize] = useState<number>(2);
  const [planAName, setPlanAName] = useState('Plan A (Budget Focus)');
  const [planBName, setPlanBName] = useState('Plan B (Comfort Route)');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName.trim()) {
      setError('Please enter a trip name.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('Trip end date must be after start date.');
      return;
    }
    if (budgetCeiling <= 0) {
      setError('Budget ceiling must be greater than zero.');
      return;
    }

    const newTrip: Trip = {
      trip_id: crypto.randomUUID ? crypto.randomUUID() : `trip_${Date.now()}`,
      trip_name: tripName.trim(),
      destination_city: destination.trim(),
      origin_city: origin.trim(),
      start_date: startDate,
      end_date: endDate,
      currency,
      budget_ceiling: Number(budgetCeiling),
      party_size: Math.max(1, Number(partySize) || 1),
      plan_a_name: planAName.trim() || 'Plan A',
      plan_b_name: planBName.trim() || 'Plan B',
      plans: [
        { id: 'PLAN_A', name: planAName.trim() || 'Plan A', color: 'emerald' },
        { id: 'PLAN_B', name: planBName.trim() || 'Plan B', color: 'blue' },
      ],
      created_at: Date.now(),
    };

    initTrip(newTrip);
    analytics.track('trip_initialized', {
      destination,
      currency,
      budgetCeiling,
      partySize,
    });

    if (onClose) onClose();
  };

  const handleLoadSampleData = () => {
    const isINR = currency === 'INR';
    const symFactor = isINR ? 85 : 1;

    const sampleTrip: Trip = {
      trip_id: 'sample_kyoto_trip',
      trip_name: 'Kyoto & Tokyo — Nov 10–16',
      destination_city: 'Kyoto, Japan',
      origin_city: 'Bangalore (BLR)',
      start_date: '2026-11-10',
      end_date: '2026-11-16',
      currency: currency || 'INR',
      budget_ceiling: isINR ? 100000 : 1200,
      party_size: 2,
      plan_a_name: 'Plan A: Budget Route',
      plan_b_name: 'Plan B: Comfort Central',
      plans: [
        { id: 'PLAN_A', name: 'Plan A: Budget Route', color: 'emerald' },
        { id: 'PLAN_B', name: 'Plan B: Comfort Central', color: 'blue' },
      ],
      created_at: Date.now(),
    };

    initTrip(sampleTrip);

    // Sample cards matching wireframe
    const card1: OptionCard = {
      card_id: 'c1_jal',
      trip_id: sampleTrip.trip_id,
      title: '✈️ JAL Morning Flight 6E-204',
      category: 'FLIGHT',
      headline_price: 300 * symFactor,
      fee_breakdown: [
        { label: 'Checked Baggage (Est)', amount: 25 * symFactor, is_statutory_tax: false, is_estimate: true },
        { label: 'Airport Surcharges (Est)', amount: 15 * symFactor, is_statutory_tax: true, is_estimate: true },
      ],
      buffer_pct: 5,
      departure_or_checkin: '2026-11-10T09:00',
      arrival_or_checkout: '2026-11-10T11:30',
      spatial_anchor: { raw_query: 'KIX Kansai International Airport' },
      pros_tags: ['Early Arrival', 'Direct'],
      cons_tags: ['Early Wake-up'],
      merchant_url: 'https://jal.co.jp',
      bundle: 'PLAN_A',
      created_at: Date.now() - 3000,
    };

    const card2: OptionCard = {
      card_id: 'c2_hotel_machiya',
      trip_id: sampleTrip.trip_id,
      title: '🏠 Traditional Kyoto Machiya Hotel',
      category: 'HOTEL',
      headline_price: 150 * symFactor,
      fee_breakdown: [
        { label: 'Hotel VAT/GST (Est)', amount: 18 * symFactor, is_statutory_tax: true, is_estimate: true },
        { label: 'City Tax (Est)', amount: 7 * symFactor, is_statutory_tax: true, is_estimate: true },
      ],
      buffer_pct: 5,
      departure_or_checkin: '2026-11-10T15:00',
      arrival_or_checkout: '2026-11-15T11:00',
      spatial_anchor: { raw_query: 'Gion, Kyoto, Japan' },
      pros_tags: ['Central Gion', 'Tatami Mat'],
      cons_tags: ['Late 3PM Checkin'],
      merchant_url: 'https://booking.com',
      bundle: 'PLAN_A',
      created_at: Date.now() - 2500,
    };

    const card3: OptionCard = {
      card_id: 'c3_ana',
      trip_id: sampleTrip.trip_id,
      title: '✈️ ANA Evening Flight NH-829',
      category: 'FLIGHT',
      headline_price: 150 * symFactor,
      fee_breakdown: [
        { label: 'Luggage Addon (Est)', amount: 20 * symFactor, is_statutory_tax: false, is_estimate: true },
        { label: 'Aviation Fee (Est)', amount: 10 * symFactor, is_statutory_tax: true, is_estimate: true },
      ],
      buffer_pct: 5,
      departure_or_checkin: '2026-11-10T19:00',
      arrival_or_checkout: '2026-11-10T21:30',
      spatial_anchor: { raw_query: 'Itami Airport, Osaka' },
      pros_tags: ['Cheaper Base Price', 'Sleep in'],
      cons_tags: ['Late Arrival'],
      merchant_url: 'https://ana.co.jp',
      bundle: 'PLAN_B',
      created_at: Date.now() - 2000,
    };

    const card4: OptionCard = {
      card_id: 'c4_capsule',
      trip_id: sampleTrip.trip_id,
      title: '🏠 Capsule Hotel & Lounge Shijo',
      category: 'HOTEL',
      headline_price: 50 * symFactor,
      fee_breakdown: [
        { label: 'Service Surcharge (Est)', amount: 5 * symFactor, is_statutory_tax: false, is_estimate: true },
      ],
      buffer_pct: 5,
      departure_or_checkin: '2026-11-10T22:30',
      arrival_or_checkout: '2026-11-15T10:00',
      spatial_anchor: { raw_query: 'Shijo Karasuma, Kyoto' },
      pros_tags: ['24h Reception', 'Subway Access'],
      cons_tags: ['Shared Bathroom'],
      merchant_url: 'https://booking.com',
      bundle: 'PLAN_B',
      created_at: Date.now() - 1500,
    };

    const card5: OptionCard = {
      card_id: 'c5_peach',
      trip_id: sampleTrip.trip_id,
      title: '✈️ Peach Aviation Red-Eye',
      category: 'FLIGHT',
      headline_price: 110 * symFactor,
      fee_breakdown: [
        { label: 'LCC Booking Fee (Est)', amount: 15 * symFactor, is_statutory_tax: false, is_estimate: true },
      ],
      buffer_pct: 5,
      departure_or_checkin: '2026-11-10T02:00',
      arrival_or_checkout: '2026-11-10T05:30',
      spatial_anchor: { raw_query: 'KIX Airport' },
      pros_tags: ['Budget King'],
      cons_tags: ['No Meals', 'Red Eye'],
      merchant_url: 'https://flypeach.com',
      bundle: 'UNSORTED',
      created_at: Date.now() - 1000,
    };

    const card6: OptionCard = {
      card_id: 'c6_airbnb',
      trip_id: sampleTrip.trip_id,
      title: '🏠 Riverfront Wooden Airbnb House',
      category: 'AIRBNB',
      headline_price: 200 * symFactor,
      fee_breakdown: [
        { label: 'Airbnb Service Fee (14%)', amount: 28 * symFactor, is_statutory_tax: false, is_estimate: true },
        { label: 'Cleaning Fee (Est)', amount: 25 * symFactor, is_statutory_tax: false, is_estimate: true },
      ],
      buffer_pct: 5,
      departure_or_checkin: '2026-11-10T16:00',
      arrival_or_checkout: '2026-11-15T11:00',
      spatial_anchor: { raw_query: 'Kamogawa, Kyoto' },
      pros_tags: ['Scenic View', 'Kitchen'],
      cons_tags: ['Steep Stairs'],
      merchant_url: 'https://airbnb.com',
      bundle: 'UNSORTED',
      created_at: Date.now() - 500,
    };

    [card1, card2, card3, card4, card5, card6].forEach(upsertCard);
    analytics.track('trip_initialized', { is_sample: true });

    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-7 py-6 text-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✈️</span>
            <div>
              <h2 className="text-2xl font-black">Welcome to TripCanvas</h2>
              <p className="text-xs md:text-sm text-teal-100 mt-0.5">Set your trip anchor to start comparing competing bundles</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-4.5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs md:text-sm text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Trip Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm md:text-base border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              placeholder="e.g. Kyoto & Tokyo Autumn — Nov 10–16"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Origin City / Code</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                placeholder="e.g. Bangalore (BLR)"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Destination <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                placeholder="e.g. Kyoto, Japan"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Default Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-bold cursor-pointer"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Target Budget Ceiling <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="10"
                step="100"
                value={budgetCeiling}
                onChange={(e) => setBudgetCeiling(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm md:text-base border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Party Size (Ppl)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm md:text-base border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Plan A Name</label>
              <input
                type="text"
                value={planAName}
                onChange={(e) => setPlanAName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Plan B Name</label>
              <input
                type="text"
                value={planBName}
                onChange={(e) => setPlanBName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleLoadSampleData}
              className="px-4 py-2.5 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              ⚡ Load Sample Kyoto Trip
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm md:text-base font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Create Workspace →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
