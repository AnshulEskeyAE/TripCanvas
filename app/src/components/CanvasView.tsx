import React, { useRef } from 'react';
import type { OptionCard, PlanColor, PlanDefinition, Trip } from '../types';
import { calculateCardTrueTotal } from '../engines/domainEngine';
import { Download, X } from 'lucide-react';

interface CanvasViewProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  cards: OptionCard[];
}

const COLOR_CONFIG: Record<
  PlanColor,
  {
    border: string;
    bg: string;
    dot: string;
    headerText: string;
    costText: string;
    statusText: string;
    cardBorder: string;
    badgeBg: string;
    badgeText: string;
    excalidrawStroke: string;
    excalidrawBg: string;
    icon: string;
  }
> = {
  emerald: {
    border: 'border-emerald-400 dark:border-emerald-800',
    bg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    dot: 'bg-emerald-600',
    headerText: 'text-emerald-950 dark:text-emerald-200',
    costText: 'text-emerald-800 dark:text-emerald-300',
    statusText: 'text-emerald-700 dark:text-emerald-400',
    cardBorder: 'border-emerald-200 dark:border-emerald-900/60',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    excalidrawStroke: '#10b981',
    excalidrawBg: '#ecfdf5',
    icon: '🟩',
  },
  blue: {
    border: 'border-blue-400 dark:border-blue-800',
    bg: 'bg-blue-50/60 dark:bg-blue-950/20',
    dot: 'bg-blue-600',
    headerText: 'text-blue-950 dark:text-blue-200',
    costText: 'text-blue-800 dark:text-blue-300',
    statusText: 'text-blue-700 dark:text-blue-400',
    cardBorder: 'border-blue-200 dark:border-blue-900/60',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    badgeText: 'text-blue-800 dark:text-blue-300',
    excalidrawStroke: '#3b82f6',
    excalidrawBg: '#eff6ff',
    icon: '🟦',
  },
  purple: {
    border: 'border-purple-400 dark:border-purple-800',
    bg: 'bg-purple-50/60 dark:bg-purple-950/20',
    dot: 'bg-purple-600',
    headerText: 'text-purple-950 dark:text-purple-200',
    costText: 'text-purple-800 dark:text-purple-300',
    statusText: 'text-purple-700 dark:text-purple-400',
    cardBorder: 'border-purple-200 dark:border-purple-900/60',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
    badgeText: 'text-purple-800 dark:text-purple-300',
    excalidrawStroke: '#a855f7',
    excalidrawBg: '#faf5ff',
    icon: '🟪',
  },
  amber: {
    border: 'border-amber-400 dark:border-amber-800',
    bg: 'bg-amber-50/60 dark:bg-amber-950/20',
    dot: 'bg-amber-600',
    headerText: 'text-amber-950 dark:text-amber-200',
    costText: 'text-amber-800 dark:text-amber-300',
    statusText: 'text-amber-700 dark:text-amber-400',
    cardBorder: 'border-amber-200 dark:border-amber-900/60',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    excalidrawStroke: '#f59e0b',
    excalidrawBg: '#fffbeb',
    icon: '🟨',
  },
  rose: {
    border: 'border-rose-400 dark:border-rose-800',
    bg: 'bg-rose-50/60 dark:bg-rose-950/20',
    dot: 'bg-rose-600',
    headerText: 'text-rose-950 dark:text-rose-200',
    costText: 'text-rose-800 dark:text-rose-300',
    statusText: 'text-rose-700 dark:text-rose-400',
    cardBorder: 'border-rose-200 dark:border-rose-900/60',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
    badgeText: 'text-rose-800 dark:text-rose-300',
    excalidrawStroke: '#f43f5e',
    excalidrawBg: '#fff1f2',
    icon: '🟥',
  },
  cyan: {
    border: 'border-cyan-400 dark:border-cyan-800',
    bg: 'bg-cyan-50/60 dark:bg-cyan-950/20',
    dot: 'bg-cyan-600',
    headerText: 'text-cyan-950 dark:text-cyan-200',
    costText: 'text-cyan-800 dark:text-cyan-300',
    statusText: 'text-cyan-700 dark:text-cyan-400',
    cardBorder: 'border-cyan-200 dark:border-cyan-900/60',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/60',
    badgeText: 'text-cyan-800 dark:text-cyan-300',
    excalidrawStroke: '#06b6d4',
    excalidrawBg: '#ecfeff',
    icon: '🔷',
  },
};

export const CanvasView: React.FC<CanvasViewProps> = ({
  isOpen,
  onClose,
  trip,
  cards,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const plans: PlanDefinition[] =
    trip.plans && trip.plans.length > 0
      ? trip.plans
      : [
          { id: 'PLAN_A', name: trip.plan_a_name || 'Plan A', color: 'emerald' },
          { id: 'PLAN_B', name: trip.plan_b_name || 'Plan B', color: 'blue' },
        ];

  // Pre-calculate per-plan cards and totals
  const planStats = plans.map((plan) => {
    const planCards = cards.filter((c) => c.bundle === plan.id);
    const total = planCards.reduce((sum, c) => sum + calculateCardTrueTotal(c), 0);
    const isUnderBudget = total <= trip.budget_ceiling;
    return {
      plan,
      cards: planCards,
      total,
      isUnderBudget,
    };
  });

  const minTotal = Math.min(...planStats.map((s) => s.total));
  const maxTotal = Math.max(...planStats.map((s) => s.total));
  const spreadDelta = maxTotal - minTotal;

  const handleExportExcalidrawFile = () => {
    const elements: any[] = [];
    const timestamp = Date.now();

    const makeBase = () => ({
      angle: 0,
      opacity: 100,
      groupIds: [],
      frameId: null,
      seed: Math.floor(Math.random() * 1000000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      boundElements: null,
      updated: timestamp,
      link: null,
      locked: false,
      strokeWidth: 2,
      roughness: 1,
      strokeStyle: 'solid',
    });

    const colWidth = 470;
    const colGap = 30;
    const outerWidth = Math.max(1040, 60 + plans.length * (colWidth + colGap));

    // Outer Board
    elements.push({
      ...makeBase(),
      id: 'outer_frame',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: outerWidth,
      height: 780,
      strokeColor: '#cbd5e1',
      backgroundColor: '#f8fafc',
      fillStyle: 'solid',
      roundness: { type: 3 },
    });

    // Title
    elements.push({
      ...makeBase(),
      id: 'title_text',
      type: 'text',
      x: 30,
      y: 30,
      text: `✈️ TripCanvas: ${trip.trip_name} [Budget: ${trip.currency} ${trip.budget_ceiling.toLocaleString()}]`,
      originalText: `✈️ TripCanvas: ${trip.trip_name} [Budget: ${trip.currency} ${trip.budget_ceiling.toLocaleString()}]`,
      fontSize: 22,
      fontFamily: 2,
      textAlign: 'left',
      verticalAlign: 'top',
      strokeColor: '#0f172a',
      width: 800,
      height: 30,
      baseline: 22,
      lineHeight: 1.2,
    });

    // Containers and Cards for each plan
    planStats.forEach((stat, planIdx) => {
      const cfg = COLOR_CONFIG[stat.plan.color] || COLOR_CONFIG.emerald;
      const colX = 30 + planIdx * (colWidth + colGap);

      // Container Frame
      elements.push({
        ...makeBase(),
        id: `frame_${stat.plan.id}`,
        type: 'rectangle',
        x: colX,
        y: 80,
        width: colWidth,
        height: 660,
        strokeColor: cfg.excalidrawStroke,
        backgroundColor: cfg.excalidrawBg,
        fillStyle: 'solid',
        roundness: { type: 3 },
      });

      // Header Text
      elements.push({
        ...makeBase(),
        id: `head_${stat.plan.id}`,
        type: 'text',
        x: colX + 20,
        y: 100,
        text: `${cfg.icon} ${stat.plan.name} - Total: ${trip.currency} ${stat.total.toLocaleString()} (${stat.isUnderBudget ? 'Under Budget' : 'Over Budget'})`,
        originalText: `${cfg.icon} ${stat.plan.name} - Total: ${trip.currency} ${stat.total.toLocaleString()} (${stat.isUnderBudget ? 'Under Budget' : 'Over Budget'})`,
        fontSize: 16,
        fontFamily: 2,
        textAlign: 'left',
        verticalAlign: 'top',
        strokeColor: cfg.excalidrawStroke,
        width: colWidth - 40,
        height: 25,
        baseline: 16,
        lineHeight: 1.2,
      });

      // Cards inside Container
      let cardY = 145;
      stat.cards.forEach((card, cardIdx) => {
        const cardTotal = calculateCardTrueTotal(card);
        // Card Box
        elements.push({
          ...makeBase(),
          id: `card_box_${stat.plan.id}_${cardIdx}`,
          type: 'rectangle',
          x: colX + 20,
          y: cardY,
          width: colWidth - 40,
          height: 64,
          strokeColor: '#e2e8f0',
          backgroundColor: '#ffffff',
          fillStyle: 'solid',
          roundness: { type: 2 },
        });

        // Card Text
        elements.push({
          ...makeBase(),
          id: `card_text_${stat.plan.id}_${cardIdx}`,
          type: 'text',
          x: colX + 32,
          y: cardY + 14,
          text: `${card.title}\n${trip.currency} ${cardTotal.toLocaleString()} • ${card.category}${card.spatial_anchor?.raw_query ? ` • 📍 ${card.spatial_anchor.raw_query}` : ''}`,
          originalText: `${card.title}\n${trip.currency} ${cardTotal.toLocaleString()} • ${card.category}${card.spatial_anchor?.raw_query ? ` • 📍 ${card.spatial_anchor.raw_query}` : ''}`,
          fontSize: 12,
          fontFamily: 2,
          strokeColor: '#1e293b',
          width: colWidth - 64,
          height: 36,
          lineHeight: 1.3,
        });

        cardY += 76;
      });
    });

    const excalidrawFile = {
      type: 'excalidraw',
      version: 2,
      source: 'https://tripcanvas.app',
      elements,
      appState: {
        viewBackgroundColor: '#ffffff',
        gridSize: null,
      },
    };

    const blob = new Blob([JSON.stringify(excalidrawFile, null, 2)], {
      type: 'application/json',
    });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${trip.trip_name.replace(/[^a-zA-Z0-9]/g, '_')}_Canvas.excalidraw`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col p-4 md:p-6 overflow-hidden">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 dark:bg-slate-900 text-white rounded-2xl px-6 py-4 flex items-center justify-between shadow-xl mb-4 border border-slate-800 shrink-0">
        <div className="flex items-center gap-3.5">
          <span className="text-3xl">🎨</span>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2.5">
              <span>TripCanvas Visual Whiteboard</span>
              <span className="text-xs px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono font-bold">
                {plans.length} Competing Plans
              </span>
            </h2>
            <p className="text-xs md:text-sm text-slate-400">
              Interactive spatial canvas for multi-plan trade-off alignment & visual wireframe export
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcalidrawFile}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs md:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download .excalidraw</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Presentation View */}
      <div
        ref={canvasRef}
        className="flex-1 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-300 dark:border-slate-800 p-6 overflow-y-auto shadow-inner"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Comparative Summary Header */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-300 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                Speculative Trip Trade-off Comparison
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {trip.trip_name} • {trip.destination_city}
              </div>
            </div>

            <div className="flex items-center gap-5 text-sm">
              <div className="text-right">
                <div className="text-slate-500 dark:text-slate-400 font-medium text-xs">Target Budget</div>
                <div className="font-black text-slate-800 dark:text-slate-200 text-base">
                  {trip.currency} {trip.budget_ceiling.toLocaleString()}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <div className="text-slate-500 dark:text-slate-400 font-medium text-xs">Cost Spread</div>
                <div className="font-extrabold text-base text-teal-700 dark:text-teal-400">
                  {spreadDelta === 0
                    ? 'All plans equal'
                    : `Spread: ${trip.currency} ${spreadDelta.toLocaleString()}`}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Multi-Plan Canvas Columns */}
          <div
            className={`grid gap-6 items-start ${
              plans.length === 1
                ? 'grid-cols-1 max-w-xl mx-auto'
                : plans.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : plans.length === 3
                ? 'grid-cols-1 md:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {planStats.map(({ plan, cards: planCards, total, isUnderBudget }) => {
              const cfg = COLOR_CONFIG[plan.color] || COLOR_CONFIG.emerald;
              return (
                <div
                  key={plan.id}
                  className={`${cfg.bg} rounded-2xl border-2 ${cfg.border} p-5 shadow-sm space-y-4`}
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-4 h-4 rounded-full ${cfg.dot} shrink-0`} />
                      <h3 className={`font-black text-lg ${cfg.headerText} truncate`}>
                        {plan.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm md:text-base font-black ${cfg.costText}`}>
                        {trip.currency} {total.toLocaleString()}
                      </div>
                      <div className={`text-xs ${cfg.statusText} font-bold`}>
                        {isUnderBudget ? '✓ Under Budget' : '⚠️ Over Budget'}
                      </div>
                    </div>
                  </div>

                  {/* Cards list */}
                  <div className="space-y-3">
                    {planCards.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 italic">
                        No options assigned to this plan yet.
                      </div>
                    ) : (
                      planCards.map((card) => {
                        const trueCost = calculateCardTrueTotal(card);
                        return (
                          <div
                            key={card.card_id}
                            className={`bg-white dark:bg-slate-900 rounded-xl p-3.5 border ${cfg.cardBorder} shadow-2xs space-y-2`}
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                {card.title}
                              </span>
                              <span className={`font-black ${cfg.costText} ml-2 shrink-0 text-sm md:text-base`}>
                                {trip.currency} {trueCost.toLocaleString()}
                              </span>
                            </div>
                            {card.spatial_anchor?.raw_query && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                📍 {card.spatial_anchor.raw_query}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1.5 text-xs">
                              {card.pros_tags.map((t, i) => (
                                <span
                                  key={i}
                                  className={`px-2 py-0.5 ${cfg.badgeBg} ${cfg.badgeText} rounded-md font-medium`}
                                >
                                  ✓ {t}
                                </span>
                              ))}
                              {card.cons_tags.map((t, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-md font-medium"
                                >
                                  ✕ {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
