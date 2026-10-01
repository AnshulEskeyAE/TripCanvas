import React from 'react';
import type { Currency } from '../types';

interface BudgetHealthBarProps {
  spent: number;
  ceiling: number;
  currency: Currency;
  partySize: number;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

export const BudgetHealthBar: React.FC<BudgetHealthBarProps> = ({
  spent,
  ceiling,
  currency,
  partySize,
}) => {
  const sym = (currency && CURRENCY_SYMBOLS[currency]) || '$';
  const percentage = ceiling > 0 ? Math.round((spent / ceiling) * 100) : 0;
  const isOver = ceiling > 0 && spent > ceiling;

  let colorClass = 'bg-emerald-500';
  let badgeColor =
    'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
  let label = 'Within Budget';

  if (percentage >= 75 && percentage <= 95) {
    colorClass = 'bg-amber-500';
    badgeColor =
      'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    label = 'Approaching Ceiling';
  } else if (percentage > 95 || isOver) {
    colorClass = 'bg-rose-500';
    badgeColor =
      'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
    label = isOver ? '⚠️ Over Budget' : 'Critical Buffer';
  }

  const perPerson = partySize > 1 ? Math.round(spent / partySize) : spent;

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
      <div className="flex items-center justify-between text-sm mb-2 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Total:</span>
          <span className="text-base md:text-lg font-black text-slate-900 dark:text-slate-100">
            {sym}{spent.toLocaleString()}
          </span>
          {partySize > 1 && (
            <span className="text-slate-500 dark:text-slate-400 font-normal text-xs">
              ({sym}{perPerson.toLocaleString()} / person)
            </span>
          )}
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
          {percentage}% ({label})
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
        <div
          className={`h-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span>Target: {sym}{ceiling.toLocaleString()}</span>
        <span>
          {isOver ? (
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              +{sym}{(spent - ceiling).toLocaleString()} over limit
            </span>
          ) : (
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              {sym}{(ceiling - spent).toLocaleString()} remaining
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
