import React, { useState } from 'react';
import type { Currency, OptionCard as OptionCardType } from '../types';
import { useTripStore } from '../store/tripStore';
import { OptionCard } from './OptionCard';
import { ChevronDown, ChevronUp, Plus, Inbox } from 'lucide-react';

interface UnsortedDeckProps {
  cards: OptionCardType[];
  currency: Currency;
  onAddOption: () => void;
}

export const UnsortedDeck: React.FC<UnsortedDeckProps> = ({
  cards,
  currency,
  onAddOption,
}) => {
  const updateCardBundle = useTripStore((s) => s.updateCardBundle);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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
      updateCardBundle(cardId, 'UNSORTED');
    }
    setIsDragOver(false);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl transition-all duration-200 shadow-2xs ${
        isDragOver
          ? 'ring-4 ring-teal-400/50 bg-teal-50/40 dark:bg-teal-950/20 border-dashed border-teal-500'
          : ''
      }`}
    >
      {/* Header Row */}
      <div className="px-5 py-3 flex items-center justify-between">
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <Inbox className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 tracking-normal flex items-center gap-2">
            <span>UNSORTED DECK</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              {cards.length}
            </span>
          </h3>
          <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isDragOver && (
            <span className="text-xs md:text-sm font-bold text-teal-700 dark:text-teal-300 animate-pulse hidden sm:inline">
              Drop here to unassign 📥
            </span>
          )}
          <button
            onClick={onAddOption}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs md:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Option</span>
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {!isCollapsed && (
        <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 mt-1">
          {cards.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-6 text-center text-slate-400 dark:text-slate-500 text-sm">
              <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Intake deck is empty.</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Click "+ Add Option", clip from the browser extension, or drag cards here to unassign.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
              {cards.map((card) => (
                <OptionCard
                  key={card.card_id}
                  card={card}
                  currency={currency}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
