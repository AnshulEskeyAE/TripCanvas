import React, { useState } from 'react';
import type { CardState, Currency, OptionCard as OptionCardType } from '../types';
import { useTripStore } from '../store/tripStore';
import { calculateCardTrueTotal } from '../engines/domainEngine';
import { GripVertical, ExternalLink, Trash2, X, AlertCircle } from 'lucide-react';

interface OptionCardProps {
  card: OptionCardType;
  currency: Currency;
  hasSevereConflict?: boolean;
  conflictText?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  FLIGHT: '✈️',
  TRAIN: '🚆',
  HOTEL: '🏨',
  AIRBNB: '🏠',
  EXCURSION: '🎟️',
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

export const OptionCard: React.FC<OptionCardProps> = ({
  card,
  currency,
  hasSevereConflict = false,
  conflictText,
}) => {
  const trip = useTripStore((s) => s.trip);
  const updateCardBundle = useTripStore((s) => s.updateCardBundle);
  const deleteCard = useTripStore((s) => s.deleteCard);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!card) return null;

  const sym = (currency && CURRENCY_SYMBOLS[currency]) || '$';
  const trueTotal = calculateCardTrueTotal(card);
  const feeBreakdown = Array.isArray(card.fee_breakdown) ? card.fee_breakdown : [];
  const prosTags = Array.isArray(card.pros_tags) ? card.pros_tags : [];
  const consTags = Array.isArray(card.cons_tags) ? card.cons_tags : [];
  const feesSum = feeBreakdown.reduce((sum, f) => sum + (Number(f?.amount) || 0), 0);
  const bufferAmount = Math.round(((Number(card.headline_price) || 0) * (Number(card.buffer_pct) || 0)) / 100);

  // Time & date formatters
  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const timeSnippet =
    card.departure_or_checkin && card.arrival_or_checkout
      ? `${formatTime(card.departure_or_checkin)} → ${formatTime(card.arrival_or_checkout)}`
      : card.departure_or_checkin
      ? `${formatDate(card.departure_or_checkin)} ${formatTime(card.departure_or_checkin)}`
      : '';

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', card.card_id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const plans = trip?.plans || [];

  return (
    <>
      {/* Simplified Card View with Comfortable Typography & Breathing Room */}
      <div
        draggable={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => setIsDetailsOpen(true)}
        className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-teal-400 dark:hover:border-teal-600 transition-all p-3.5 relative group select-none cursor-pointer flex flex-col justify-between gap-2.5 ${
          isDragging ? 'opacity-40 scale-95 ring-2 ring-teal-500 shadow-xl' : ''
        }`}
      >
        {/* Top Row: Grip + Icon + Title + True Price */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <span className="text-base select-none shrink-0">{CATEGORY_ICONS[card.category] || '📌'}</span>
            <h4
              className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-[15px] truncate leading-tight"
              title={card.title}
            >
              {card.title || 'Untitled Option'}
            </h4>
          </div>

          <div className="text-right shrink-0">
            <span className="text-sm md:text-base font-black text-teal-700 dark:text-teal-400">
              {sym}{trueTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Bottom Row: Time Snippet + Location or Critical Alert Badge */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pl-7">
          <div className="flex items-center gap-2 truncate">
            {timeSnippet && (
              <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300">
                {timeSnippet}
              </span>
            )}
            {card.spatial_anchor?.raw_query && (
              <span className="truncate text-xs text-slate-400 dark:text-slate-500">
                • {card.spatial_anchor.raw_query}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasSevereConflict && (
              <span
                className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-md text-xs font-extrabold flex items-center gap-1"
                title={conflictText}
              >
                <AlertCircle className="w-3 h-3" />
                <span>Alert</span>
              </span>
            )}
            <span className="text-xs text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 font-semibold transition-colors">
              Details →
            </span>
          </div>
        </div>
      </div>

      {/* Clickable Card Details Drawer/Modal (Progressive Disclosure) */}
      {isDetailsOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsDetailsOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CATEGORY_ICONS[card.category] || '📌'}</span>
                <div>
                  <h3 className="font-bold text-base text-slate-100 truncate max-w-sm">{card.title}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-teal-300 font-semibold border border-slate-700">
                    {card.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
              {/* Critical Warning if any */}
              {conflictText && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm">Schedule Alert Detected</div>
                    <div className="text-xs mt-0.5">{conflictText}</div>
                  </div>
                </div>
              )}

              {/* Price & True Cost Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Headline Base Price:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    {sym}{card.headline_price.toLocaleString()}
                  </span>
                </div>

                {feeBreakdown.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider block">
                      Fee Line Items & Taxes (+{sym}{feesSum.toLocaleString()})
                    </span>
                    {feeBreakdown.map((f, i) => (
                      <div key={i} className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                        <span>
                          {f.label} {f.is_statutory_tax && <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">[TAX]</span>}
                        </span>
                        <span className="font-mono font-medium">+{sym}{f.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    {bufferAmount > 0 && (
                      <div className="flex justify-between text-slate-500 dark:text-slate-400 italic text-sm">
                        <span>Custom Buffer ({card.buffer_pct}%)</span>
                        <span className="font-mono">+{sym}{bufferAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-baseline justify-between">
                  <span className="font-bold text-teal-800 dark:text-teal-300 text-sm md:text-base">True All-In Basket Cost:</span>
                  <span className="font-black text-teal-700 dark:text-teal-400 text-lg md:text-xl">
                    {sym}{trueTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Schedule & Spatial Anchor */}
              <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-3.5">
                <span className="font-bold text-xs text-slate-400 uppercase tracking-wider block">
                  Schedule & Location
                </span>
                <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">
                      {card.category === 'HOTEL' || card.category === 'AIRBNB' ? 'Check-in Time' : 'Departure'}
                    </span>
                    <span className="font-medium text-sm">
                      {formatDate(card.departure_or_checkin)} {formatTime(card.departure_or_checkin) || 'Unspecified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">
                      {card.category === 'HOTEL' || card.category === 'AIRBNB' ? 'Check-out Time' : 'Arrival'}
                    </span>
                    <span className="font-medium text-sm">
                      {formatDate(card.arrival_or_checkout)} {formatTime(card.arrival_or_checkout) || 'Unspecified'}
                    </span>
                  </div>
                </div>

                {card.spatial_anchor?.raw_query && (
                  <div className="mt-1 text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-base">📍</span>
                    <span className="font-medium">{card.spatial_anchor.raw_query}</span>
                  </div>
                )}
              </div>

              {/* Pros & Cons Tags */}
              {(prosTags.length > 0 || consTags.length > 0) && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3.5">
                  <span className="font-bold text-xs text-slate-400 uppercase tracking-wider block">
                    Tags & Attributes
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {prosTags.map((tag, i) => (
                      <span
                        key={`pro-${i}`}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                    {consTags.map((tag, i) => (
                      <span
                        key={`con-${i}`}
                        className="px-2.5 py-1 text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-md"
                      >
                        ✕ {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Controls: Bundle Selector + Booking Link + Delete */}
              <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Plan:</span>
                  <select
                    value={card.bundle || 'UNSORTED'}
                    onChange={(e) => {
                      updateCardBundle(card.card_id, e.target.value as CardState);
                    }}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-1.5 text-xs md:text-sm font-bold focus:outline-hidden cursor-pointer"
                  >
                    <option value="UNSORTED">📥 Unsorted Deck</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    <option value="REJECTED">🚫 Rejected</option>
                  </select>
                </div>

                <div className="flex items-center gap-2.5">
                  {card.merchant_url && (
                    <a
                      href={card.merchant_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>Book on Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      deleteCard(card.card_id);
                      setIsDetailsOpen(false);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Delete card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
