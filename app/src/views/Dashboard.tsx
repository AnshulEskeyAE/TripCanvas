import React, { useEffect, useState } from 'react';
import { useTripStore } from '../store/tripStore';
import { TripSetupModal } from '../components/TripSetupModal';
import { CardIntakeModal } from '../components/CardIntakeModal';
import { UnsortedDeck } from '../components/UnsortedDeck';
import { BundleColumn } from '../components/BundleColumn';
import { CanvasView } from '../components/CanvasView';
import { encodeShareHash } from '../engines/shareEngine';
import { analytics } from '../analytics';
import type { CardState, Currency } from '../types';
import { Palette, Share2, RotateCcw, Moon, Sun, DollarSign, PlusCircle } from 'lucide-react';

const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: 'INR', label: 'INR (₹)', symbol: '₹' },
  { code: 'USD', label: 'USD ($)', symbol: '$' },
  { code: 'EUR', label: 'EUR (€)', symbol: '€' },
  { code: 'GBP', label: 'GBP (£)', symbol: '£' },
  { code: 'JPY', label: 'JPY (¥)', symbol: '¥' },
];

export const Dashboard: React.FC = () => {
  const trip = useTripStore((s) => s.trip);
  const rawCards = useTripStore((s) => s.cards);
  const theme = useTripStore((s) => s.theme);
  const toggleTheme = useTripStore((s) => s.toggleTheme);
  const setCurrency = useTripStore((s) => s.setCurrency);
  const addPlan = useTripStore((s) => s.addPlan);
  const renamePlan = useTripStore((s) => s.renamePlan);
  const deletePlan = useTripStore((s) => s.deletePlan);
  const resetTrip = useTripStore((s) => s.resetTrip);

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [intakeTargetBundle, setIntakeTargetBundle] = useState<CardState>('UNSORTED');
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [convertValuesOnSwitch, setConvertValuesOnSwitch] = useState(true);

  // Sync theme with documentElement for Tailwind CSS v4 dark variant
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const cards = Array.isArray(rawCards) ? rawCards : [];

  // Extension Integration: Listen for clipped cards from content_bridge
  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'TRIPCANVAS_CARD_CLIPPED' && event.data?.card) {
        useTripStore.getState().upsertCard(event.data.card);
        setShareToast(`✓ Received "${event.data.card.title}" from Extension Clipper!`);
        setTimeout(() => setShareToast(null), 3500);
      }

      // If extension requests current trip metadata
      if (event.data?.type === 'TRIPCANVAS_REQUEST_SYNC') {
        const currentTrip = useTripStore.getState().trip;
        window.postMessage(
          {
            type: 'TRIPCANVAS_SYNC_RESPONSE',
            trip: currentTrip,
          },
          window.location.origin
        );
      }
    };

    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, []);

  // If no trip exists, show setup modal with a clean styled backdrop
  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-center text-white mb-6 animate-in fade-in duration-300">
          <span className="text-5xl block mb-2">✈️</span>
          <h1 className="text-2xl font-black tracking-tight">TripCanvas</h1>
          <p className="text-xs text-teal-400 font-medium">The Speculative Travel Comparison Workspace</p>
        </div>
        <TripSetupModal isOpen={true} />
      </div>
    );
  }

  const plans = Array.isArray(trip.plans) && trip.plans.length > 0 ? trip.plans : [];
  const unsortedCards = cards.filter((c) => c && c.bundle === 'UNSORTED');

  const handleOpenIntake = (targetBundle: CardState = 'UNSORTED') => {
    setIntakeTargetBundle(targetBundle);
    setIsIntakeOpen(true);
  };

  const handleCurrencySelect = (newCurr: Currency) => {
    setCurrency(newCurr, convertValuesOnSwitch);
    setIsCurrencyMenuOpen(false);
    setShareToast(`✓ Switched currency to ${newCurr} ${convertValuesOnSwitch ? '(values converted)' : ''}`);
    setTimeout(() => setShareToast(null), 3000);
  };

  const handleShareTrip = () => {
    try {
      const hash = encodeShareHash(trip, cards);
      const shareUrl = `${window.location.origin}${window.location.pathname}#${hash}`;
      navigator.clipboard.writeText(shareUrl);
      setShareToast('✓ Read-only share link copied to clipboard!');
      analytics.track('share_link_created', {
        card_count: cards.length,
        destination: trip.destination_city,
      });
      setTimeout(() => setShareToast(null), 3000);
    } catch (err) {
      console.error(err);
      setShareToast('⚠️ Trip is too large for URL sharing. Use Visual Canvas export.');
      setTimeout(() => setShareToast(null), 4000);
    }
  };

  const handleResetTripWithConfirm = () => {
    if (window.confirm('Are you sure you want to reset this trip? All local options will be cleared.')) {
      resetTrip();
    }
  };

  // Determine dynamic grid columns based on number of comparison plans
  const gridClass =
    plans.length === 1
      ? 'grid-cols-1 max-w-2xl mx-auto'
      : plans.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : plans.length === 3
      ? 'grid-cols-1 md:grid-cols-3'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30 px-5 md:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3.5">
          {/* Logo & Trip Anchors */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">✈️</span>
              <div>
                <span className="text-sm uppercase tracking-wider font-extrabold text-teal-400 block leading-tight">
                  TripCanvas
                </span>
                <span className="text-xs text-slate-400 font-medium block">
                  Multi-Plan Comparison Workspace
                </span>
              </div>
            </div>

            <div className="hidden sm:block h-6 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold text-slate-100 truncate max-w-[200px] md:max-w-none">
                {trip.trip_name}
              </h1>
              <span className="text-xs md:text-sm text-slate-400 hidden lg:inline">
                ({trip.destination_city} • {trip.start_date} to {trip.end_date})
              </span>
            </div>
          </div>

          {/* Controls: Currency + Theme + Add Plan + Canvas + Share + Reset */}
          <div className="flex items-center gap-2.5">
            {/* Dynamic Currency Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-lg text-xs md:text-sm font-bold transition-all shadow-2xs cursor-pointer"
                title="Change active currency"
              >
                <DollarSign className="w-4 h-4" />
                <span>{trip.currency}</span>
              </button>

              {isCurrencyMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Select Currency
                  </div>
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => handleCurrencySelect(c.code)}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                        trip.currency === c.code
                          ? 'text-teal-600 dark:text-teal-400 font-bold bg-teal-50/50 dark:bg-teal-950/30'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{c.label}</span>
                      <span className="font-mono text-xs opacity-60">{c.symbol}</span>
                    </button>
                  ))}
                  <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-800 px-3.5">
                    <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={convertValuesOnSwitch}
                        onChange={(e) => setConvertValuesOnSwitch(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-0"
                      />
                      <span>Scale existing prices</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            {/* Add Plan Button */}
            <button
              onClick={() => addPlan()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 rounded-lg text-xs md:text-sm font-bold transition-all shadow-2xs cursor-pointer"
              title="Add a new comparison plan"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Plan</span>
            </button>

            {/* Visual Canvas Button */}
            <button
              onClick={() => setIsCanvasOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-lg text-xs md:text-sm font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Canvas</span>
            </button>

            {/* Share Link Button */}
            <button
              onClick={handleShareTrip}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs md:text-sm font-bold transition-all shadow-xs cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Reset Trip */}
            <button
              onClick={handleResetTripWithConfirm}
              className="p-2 text-slate-400 hover:text-rose-400 text-sm transition-colors rounded-lg hover:bg-slate-800 cursor-pointer"
              title="Reset Trip Workspace"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Share Feedback Toast */}
        {shareToast && (
          <div className="absolute top-14 right-6 bg-teal-800 text-white text-sm px-4 py-2 rounded-xl shadow-xl border border-teal-600 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            {shareToast}
          </div>
        )}
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto w-full p-3 md:p-5 space-y-4 flex-1 flex flex-col">
        {/* Component 1: Unsorted Deck Tray (Collapsible & Drop Zone) */}
        <section>
          <UnsortedDeck
            cards={unsortedCards}
            currency={trip.currency}
            onAddOption={() => handleOpenIntake('UNSORTED')}
          />
        </section>

        {/* Component 2: Multi-Plan Arena (Plan A, Plan B, Plan C...) */}
        <section className={`flex-1 grid ${gridClass} gap-4 md:gap-5 items-stretch overflow-x-auto`}>
          {plans.map((plan) => (
            <BundleColumn
              key={plan.id}
              planId={plan.id}
              title={plan.name}
              color={plan.color}
              currency={trip.currency}
              partySize={trip.party_size || 1}
              budgetCeiling={trip.budget_ceiling || 0}
              canDelete={plans.length > 1}
              onRename={(newName) => renamePlan(plan.id, newName)}
              onDelete={() => deletePlan(plan.id)}
              onAddDirect={() => handleOpenIntake(plan.id)}
            />
          ))}
        </section>
      </main>

      {/* Modals */}
      <CardIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        initialBundle={intakeTargetBundle}
      />

      <CanvasView
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        trip={trip}
        cards={cards}
      />

      <TripSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
      />
    </div>
  );
};
