import React, { useEffect, useMemo, useState } from 'react';
import type { ConflictResult, Currency, PlanColor } from '../types';
import { useTripStore } from '../store/tripStore';
import { OptionCard } from './OptionCard';
import { ConflictBanner } from './ConflictBanner';
import { BudgetHealthBar } from './BudgetHealthBar';
import { evaluateBundleConflicts } from '../engines/conflictEngine';
import { Plus, Edit3, Trash2 } from 'lucide-react';

interface BundleColumnProps {
  planId: string;
  title: string;
  color?: PlanColor;
  currency: Currency;
  partySize: number;
  budgetCeiling: number;
  canDelete?: boolean;
  onRename: (newName: string) => void;
  onDelete?: () => void;
  onAddDirect: () => void;
}

const COLOR_MAP: Record<
  PlanColor,
  { border: string; header: string; dot: string; text: string }
> = {
  emerald: {
    border: 'border-emerald-300/80 dark:border-emerald-800',
    header: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
    dot: 'bg-emerald-500',
    text: 'text-emerald-950 dark:text-emerald-200',
  },
  blue: {
    border: 'border-blue-300/80 dark:border-blue-800',
    header: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
    dot: 'bg-blue-500',
    text: 'text-blue-950 dark:text-blue-200',
  },
  purple: {
    border: 'border-purple-300/80 dark:border-purple-800',
    header: 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
    dot: 'bg-purple-500',
    text: 'text-purple-950 dark:text-purple-200',
  },
  amber: {
    border: 'border-amber-300/80 dark:border-amber-800',
    header: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    dot: 'bg-amber-500',
    text: 'text-amber-950 dark:text-amber-200',
  },
  rose: {
    border: 'border-rose-300/80 dark:border-rose-800',
    header: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
    dot: 'bg-rose-500',
    text: 'text-rose-950 dark:text-rose-200',
  },
  cyan: {
    border: 'border-cyan-300/80 dark:border-cyan-800',
    header: 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900',
    dot: 'bg-cyan-500',
    text: 'text-cyan-950 dark:text-cyan-200',
  },
};

export const BundleColumn: React.FC<BundleColumnProps> = ({
  planId,
  title,
  color = 'emerald',
  currency,
  partySize,
  budgetCeiling,
  canDelete = false,
  onRename,
  onDelete,
  onAddDirect,
}) => {
  const allCards = useTripStore((s) => s.cards);
  const updateCardBundle = useTripStore((s) => s.updateCardBundle);
  const computeBasketSummary = useTripStore((s) => s.computeBasketSummary);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [conflicts, setConflicts] = useState<ConflictResult[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const cards = useMemo(
    () => (Array.isArray(allCards) ? allCards.filter((c) => c && c.bundle === planId) : []),
    [allCards, planId]
  );

  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  const basketSummary = computeBasketSummary(planId);

  // Stable dependency signature
  const cardsSignature = useMemo(
    () =>
      cards
        .map(
          (c) =>
            `${c.card_id}:${c.bundle}:${c.departure_or_checkin}:${c.arrival_or_checkout}:${c.spatial_anchor?.raw_query}`
        )
        .join('|'),
    [cards]
  );

  // Debounced conflict evaluation
  useEffect(() => {
    let isCancelled = false;

    const timer = setTimeout(async () => {
      try {
        setIsEvaluating(true);
        const results = await evaluateBundleConflicts(cards);
        if (!isCancelled) {
          setConflicts(results);
          setIsEvaluating(false);
        }
      } catch (err) {
        console.error('Conflict evaluation error:', err);
        if (!isCancelled) setIsEvaluating(false);
      }
    }, 1000);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [cardsSignature]);

  const handleTitleSubmit = () => {
    if (editedTitle.trim()) {
      onRename(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      updateCardBundle(cardId, planId);
    }
    setIsDragOver(false);
  };

  const palette = COLOR_MAP[color] || COLOR_MAP.emerald;

  // Build conflict lookup for individual cards
  const severeConflictMap = useMemo(() => {
    const map = new Map<string, string>();
    conflicts
      .filter((c) => c.severity === 'severe' || c.severity === 'error')
      .forEach((c) => {
        map.set(c.card_id, c.message);
      });
    return map;
  }, [conflicts]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white dark:bg-slate-900 rounded-2xl border-2 ${palette.border} shadow-xs flex flex-col h-full overflow-hidden transition-all duration-200 min-w-[290px] ${
        isDragOver
          ? 'ring-4 ring-teal-400/50 bg-teal-50/40 dark:bg-teal-950/30 border-dashed border-teal-500 scale-[1.005]'
          : ''
      }`}
    >
      {/* Column Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${palette.header}`}>
        <div className="flex items-center gap-2.5 flex-1 mr-2 min-w-0">
          <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${palette.dot}`} />
          {isEditingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="text-sm font-bold bg-white dark:bg-slate-800 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-hidden"
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className={`text-sm md:text-base font-bold truncate cursor-pointer hover:underline flex items-center gap-1.5 ${palette.text}`}
              title="Click to rename"
            >
              <span>{title}</span>
              <Edit3 className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
            </h3>
          )}
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/95 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs shrink-0">
            {cards.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onAddDirect}
            className="text-xs md:text-sm font-semibold px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
            title="Add card directly to this plan"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>

          {canDelete && onDelete && (
            <button
              onClick={() => {
                if (window.confirm(`Delete "${title}"? Cards will be returned to the Unsorted Deck.`)) {
                  onDelete();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
              title="Delete this plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Drag Over Banner */}
      {isDragOver && (
        <div className="bg-teal-500/10 border-b border-teal-500/30 text-teal-800 dark:text-teal-300 text-sm font-bold py-1.5 text-center animate-pulse">
          Drop here to add to {title} 📥
        </div>
      )}

      {/* Only Severe/Time-Sensitive Conflict Warnings shown on Board */}
      <div className="px-3.5 pt-2">
        <ConflictBanner conflicts={conflicts} showAll={false} />
      </div>

      {/* Cards Area (Simplified & Compact) */}
      <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto min-h-[300px]">
        {cards.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-12 px-4 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full">
            <span className="text-3xl mb-2 opacity-50">📋</span>
            <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm mb-1">Empty Plan</p>
            <p className="text-xs max-w-[200px] mb-3 text-slate-400 dark:text-slate-500">
              Drag options here or click Add.
            </p>
            <button
              onClick={onAddDirect}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs md:text-sm font-semibold cursor-pointer"
            >
              + Add Option
            </button>
          </div>
        ) : (
          cards.map((c) => (
            <OptionCard
              key={c.card_id}
              card={c}
              currency={currency}
              hasSevereConflict={severeConflictMap.has(c.card_id)}
              conflictText={severeConflictMap.get(c.card_id)}
            />
          ))
        )}

        {isEvaluating && (
          <div className="text-[10px] text-slate-400 dark:text-slate-500 italic px-1 flex items-center gap-1">
            <span>Evaluating transit schedule...</span>
          </div>
        )}
      </div>

      {/* Footer Summary & Budget Bar */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <BudgetHealthBar
          spent={basketSummary.basket_total}
          ceiling={budgetCeiling}
          currency={currency}
          partySize={partySize}
        />
      </div>
    </div>
  );
};
