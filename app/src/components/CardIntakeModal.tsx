import React, { useState } from 'react';
import type { CardState, Category, FeeLineItem, OptionCard } from '../types';
import { useTripStore } from '../store/tripStore';
import { computeDefaultFees, detectDomain } from '../engines/domainEngine';
import { analytics } from '../analytics';
import { X, Sparkles } from 'lucide-react';

interface CardIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBundle?: CardState;
}

export const CardIntakeModal: React.FC<CardIntakeModalProps> = ({
  isOpen,
  onClose,
  initialBundle = 'UNSORTED',
}) => {
  const trip = useTripStore((s) => s.trip);
  const upsertCard = useTripStore((s) => s.upsertCard);

  const [url, setUrl] = useState('');
  const [detectedBadge, setDetectedBadge] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('FLIGHT');
  const [headlinePrice, setHeadlinePrice] = useState<number>(0);
  const [bufferPct, setBufferPct] = useState<number>(5);
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [spatialAnchor, setSpatialAnchor] = useState('');
  const [prosText, setProsText] = useState('');
  const [consText, setConsText] = useState('');
  const [bundle, setBundle] = useState<CardState>(initialBundle);
  const [fees, setFees] = useState<FeeLineItem[]>([]);
  const [newFeeLabel, setNewFeeLabel] = useState('');
  const [newFeeAmount, setNewFeeAmount] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen || !trip) return null;

  const handleUrlBlur = (inputUrl: string) => {
    if (!inputUrl.trim()) return;
    const rule = detectDomain(inputUrl);
    if (rule) {
      setCategory(rule.category);
      setDetectedBadge(`Auto-detected: ${rule.domain.replace('.', '').toUpperCase()} (${rule.category})`);
      if (headlinePrice > 0) {
        const autoFees = computeDefaultFees(rule, headlinePrice, trip.currency);
        setFees(autoFees);
      }
    } else {
      setDetectedBadge(null);
    }
  };

  const handleHeadlineChange = (price: number) => {
    setHeadlinePrice(price);
    const rule = detectDomain(url);
    if (rule && fees.length === 0) {
      setFees(computeDefaultFees(rule, price, trip.currency));
    }
  };

  const handleAddFeeItem = () => {
    if (!newFeeLabel.trim() || newFeeAmount <= 0) return;
    setFees([
      ...fees,
      {
        label: newFeeLabel.trim(),
        amount: Number(newFeeAmount),
        is_statutory_tax: false,
        is_estimate: false,
      },
    ]);
    setNewFeeLabel('');
    setNewFeeAmount(0);
  };

  const handleRemoveFee = (index: number) => {
    setFees(fees.filter((_, i) => i !== index));
  };

  const handleFeeAmountChange = (index: number, newAmount: number) => {
    const updated = [...fees];
    updated[index].amount = Number(newAmount);
    setFees(updated);
  };

  // Calculate live true total
  const feesSum = fees.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const bufferAmount = Math.round(((Number(headlinePrice) || 0) * (Number(bufferPct) || 0)) / 100);
  const liveTrueTotal = (Number(headlinePrice) || 0) + feesSum + bufferAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Please enter a card title or provider name.');
      return;
    }
    if (headlinePrice < 0) {
      setValidationError('Headline price cannot be negative.');
      return;
    }

    // Check dates
    if (departureTime && arrivalTime) {
      if (new Date(arrivalTime) <= new Date(departureTime)) {
        setValidationError('Arrival / Checkout must be after Departure / Check-in.');
        return;
      }
    }

    const newCard: OptionCard = {
      card_id: crypto.randomUUID ? crypto.randomUUID() : `card_${Date.now()}`,
      trip_id: trip.trip_id,
      title: title.trim(),
      category,
      headline_price: Number(headlinePrice),
      fee_breakdown: fees,
      buffer_pct: Number(bufferPct) || 0,
      departure_or_checkin: departureTime,
      arrival_or_checkout: arrivalTime,
      spatial_anchor: { raw_query: spatialAnchor.trim() },
      pros_tags: prosText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      cons_tags: consText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      merchant_url: url.trim() || undefined,
      bundle,
      created_at: Date.now(),
    };

    upsertCard(newCard);
    analytics.track('option_card_added', {
      category,
      has_url: !!url,
      bundle,
      true_total: liveTrueTotal,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>Add Candidate Option</span>
              {detectedBadge && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{detectedBadge}</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Capture option with automated fee and tax calculations</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {validationError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs md:text-sm text-rose-700 dark:text-rose-300 font-medium">
              {validationError}
            </div>
          )}

          {/* URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Booking or Listing URL (Domain Auto-Parser)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={(e) => handleUrlBlur(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              placeholder="Paste Airbnb, Booking.com, IndiGo, or airline link..."
            />
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Title / Provider <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                placeholder="e.g. IndiGo 6E-204 or Central Machiya Loft"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
              >
                <option value="FLIGHT">✈️ Flight</option>
                <option value="TRAIN">🚆 Train</option>
                <option value="HOTEL">🏨 Hotel</option>
                <option value="AIRBNB">🏠 Airbnb</option>
                <option value="EXCURSION">🎟️ Excursion</option>
              </select>
            </div>
          </div>

          {/* Pricing & Buffer */}
          <div className="grid grid-cols-3 gap-3.5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Base Price ({trip.currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={headlinePrice || ''}
                onChange={(e) => handleHeadlineChange(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-bold"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Buffer %</label>
              <input
                type="number"
                min="0"
                max="50"
                value={bufferPct}
                onChange={(e) => setBufferPct(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Assign to Bundle</label>
              <select
                value={bundle}
                onChange={(e) => setBundle(e.target.value as CardState)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="UNSORTED">📥 Unsorted Deck</option>
                {(trip.plans && trip.plans.length > 0 ? trip.plans : [
                  { id: 'PLAN_A', name: trip.plan_a_name || 'Plan A', color: 'emerald' },
                  { id: 'PLAN_B', name: trip.plan_b_name || 'Plan B', color: 'blue' },
                ]).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* True Basket Cost Live Bar */}
          <div className="p-3.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-xl flex items-center justify-between">
            <div className="text-sm">
              <span className="text-teal-900 dark:text-teal-200 font-bold">True Basket Total:</span>
              <span className="ml-1.5 text-teal-700 dark:text-teal-400 text-xs">
                (Base {headlinePrice} + Fees {feesSum} + Buffer {bufferAmount})
              </span>
            </div>
            <div className="text-lg md:text-xl font-black text-teal-800 dark:text-teal-300">
              {trip.currency} {liveTrueTotal.toLocaleString()}
            </div>
          </div>

          {/* Fee Line Items Section */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Fee Line Items & Taxes ({fees.length})
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {fees.map((fee, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <span className="text-slate-700 dark:text-slate-300 truncate font-medium flex-1">
                    {fee.label} {fee.is_estimate && <span className="text-[10px] text-amber-600 dark:text-amber-400">[ESTIMATE]</span>}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">{trip.currency}</span>
                    <input
                      type="number"
                      value={fee.amount}
                      onChange={(e) => handleFeeAmountChange(idx, Number(e.target.value))}
                      className="w-20 px-2 py-0.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded text-right text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFee(idx)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick add fee */}
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={newFeeLabel}
                onChange={(e) => setNewFeeLabel(e.target.value)}
                placeholder="Custom Fee (e.g. Resort Fee)"
                className="flex-1 px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg"
              />
              <input
                type="number"
                value={newFeeAmount || ''}
                onChange={(e) => setNewFeeAmount(Number(e.target.value))}
                placeholder="Amount"
                className="w-20 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-right"
              />
              <button
                type="button"
                onClick={handleAddFeeItem}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Timing & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {category === 'HOTEL' || category === 'AIRBNB' ? 'Check-in Time' : 'Departure Time'}
              </label>
              <input
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {category === 'HOTEL' || category === 'AIRBNB' ? 'Check-out Time' : 'Arrival Time'}
              </label>
              <input
                type="datetime-local"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location Anchor (Airport Code or Address)
            </label>
            <input
              type="text"
              value={spatialAnchor}
              onChange={(e) => setSpatialAnchor(e.target.value)}
              placeholder="e.g. Kansai Airport (KIX) or Gion, Kyoto"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Pros & Cons Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-800 dark:text-emerald-400 mb-1">
                Pros (comma-separated)
              </label>
              <input
                type="text"
                value={prosText}
                onChange={(e) => setProsText(e.target.value)}
                placeholder="e.g. Near Metro, Free Breakfast"
                className="w-full px-3 py-1.5 text-xs border border-emerald-300 dark:border-emerald-800 rounded-lg bg-emerald-50/30 dark:bg-emerald-950/20 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-800 dark:text-rose-400 mb-1">
                Cons (comma-separated)
              </label>
              <input
                type="text"
                value={consText}
                onChange={(e) => setConsText(e.target.value)}
                placeholder="e.g. Red-eye, Shared Bathroom"
                className="w-full px-3 py-1.5 text-xs border border-rose-300 dark:border-rose-800 rounded-lg bg-rose-50/30 dark:bg-rose-950/20 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Save Option Card →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
