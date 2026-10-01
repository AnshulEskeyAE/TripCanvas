import React, { useEffect, useState } from 'react';
import { decodeShareHash, type SharedTripPayload } from '../engines/shareEngine';
import { calculateCardTrueTotal } from '../engines/domainEngine';
import { analytics } from '../analytics';

interface ShareViewProps {
  hash: string;
}

export const ShareView: React.FC<ShareViewProps> = ({ hash }) => {
  const [data, setData] = useState<SharedTripPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [votedPlan, setVotedPlan] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    const parsed = decodeShareHash(hash);
    setData(parsed);
    if (parsed) {
      analytics.track('shared_view_opened', {
        destination: parsed.trip.destination_city,
        card_count: parsed.cards.length,
      });
    }
  }, [hash]);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
          <span className="text-4xl mb-4 block">🔍</span>
          <h2 className="text-xl font-bold mb-2">Invalid or Expired Trip Link</h2>
          <p className="text-sm text-slate-400 mb-6">
            The shared trip link could not be decoded. Please ask the trip organizer for an updated link.
          </p>
          <a
            href="/"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors inline-block"
          >
            Create Your Own Trip →
          </a>
        </div>
      </div>
    );
  }

  const { trip, cards } = data;
  const planACards = cards.filter((c) => c.bundle === 'PLAN_A');
  const planBCards = cards.filter((c) => c.bundle === 'PLAN_B');

  const totalA = planACards.reduce((sum, c) => sum + calculateCardTrueTotal(c), 0);
  const totalB = planBCards.reduce((sum, c) => sum + calculateCardTrueTotal(c), 0);

  const perPersonA = Math.round(totalA / (trip.party_size || 1));
  const perPersonB = Math.round(totalB / (trip.party_size || 1));

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Top Banner for Co-Travelers */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-4 md:px-8 py-3.5 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✈️</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-white">TripCanvas</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">
                  Read-Only Co-Traveler View
                </span>
              </div>
              <h1 className="text-sm font-bold text-slate-200">
                {trip.trip_name} ({trip.destination_city})
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🔗</span>
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <a
              href="/"
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              Start New Trip →
            </a>
          </div>
        </div>
      </header>

      {/* Main Comparison Container */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Voting & Alignment Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold text-teal-700 tracking-wider">Group Consensus Vote</div>
            <h2 className="text-base font-bold text-slate-900">Which option do you prefer?</h2>
            <p className="text-xs text-slate-500">
              Vote to help the lead trip planner finalize booking before flight prices surge.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setVotedPlan('A')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                votedPlan === 'A'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {votedPlan === 'A' ? '✓ You Voted for Plan A' : `Vote ${trip.plan_a_name}`}
            </button>
            <button
              onClick={() => setVotedPlan('B')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                votedPlan === 'B'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-400'
                  : 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
              }`}
            >
              {votedPlan === 'B' ? '✓ You Voted for Plan B' : `Vote ${trip.plan_b_name}`}
            </button>
          </div>
        </div>

        {/* Comparison Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan A Column */}
          <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-emerald-50 p-4 border-b border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Option A</span>
                <h3 className="font-extrabold text-base text-emerald-950">{trip.plan_a_name}</h3>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-emerald-900">
                  {trip.currency} {totalA.toLocaleString()}
                </div>
                <div className="text-[11px] font-semibold text-emerald-700">
                  {trip.currency} {perPersonA.toLocaleString()} / person
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3 flex-1">
              {planACards.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">No items in Plan A</div>
              ) : (
                planACards.map((card) => {
                  const trueCost = calculateCardTrueTotal(card);
                  return (
                    <div
                      key={card.card_id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">{card.title}</span>
                        <span className="font-extrabold text-xs text-teal-800">
                          {trip.currency} {trueCost.toLocaleString()}
                        </span>
                      </div>

                      {card.spatial_anchor?.raw_query && (
                        <div className="text-[11px] text-slate-500">📍 {card.spatial_anchor.raw_query}</div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {card.pros_tags.map((t, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                            ✓ {t}
                          </span>
                        ))}
                        {card.cons_tags.map((t, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded">
                            ✕ {t}
                          </span>
                        ))}
                      </div>

                      {card.merchant_url && (
                        <div className="pt-1.5 border-t border-slate-200 text-right">
                          <a
                            href={card.merchant_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-800"
                          >
                            <span>Book on official site</span>
                            <span>↗</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Plan B Column */}
          <div className="bg-white rounded-2xl border-2 border-blue-300 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-blue-50 p-4 border-b border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Option B</span>
                <h3 className="font-extrabold text-base text-blue-950">{trip.plan_b_name}</h3>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-blue-900">
                  {trip.currency} {totalB.toLocaleString()}
                </div>
                <div className="text-[11px] font-semibold text-blue-700">
                  {trip.currency} {perPersonB.toLocaleString()} / person
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3 flex-1">
              {planBCards.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">No items in Plan B</div>
              ) : (
                planBCards.map((card) => {
                  const trueCost = calculateCardTrueTotal(card);
                  return (
                    <div
                      key={card.card_id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">{card.title}</span>
                        <span className="font-extrabold text-xs text-teal-800">
                          {trip.currency} {trueCost.toLocaleString()}
                        </span>
                      </div>

                      {card.spatial_anchor?.raw_query && (
                        <div className="text-[11px] text-slate-500">📍 {card.spatial_anchor.raw_query}</div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {card.pros_tags.map((t, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                            ✓ {t}
                          </span>
                        ))}
                        {card.cons_tags.map((t, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded">
                            ✕ {t}
                          </span>
                        ))}
                      </div>

                      {card.merchant_url && (
                        <div className="pt-1.5 border-t border-slate-200 text-right">
                          <a
                            href={card.merchant_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-800"
                          >
                            <span>Book on official site</span>
                            <span>↗</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
