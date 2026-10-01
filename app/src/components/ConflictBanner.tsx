import React from 'react';
import type { ConflictResult } from '../types';

interface ConflictBannerProps {
  conflicts: ConflictResult[];
  showAll?: boolean; // if true (e.g. inside details modal), shows all warnings; if false (board view), only shows critical/time-sensitive
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({ conflicts, showAll = false }) => {
  if (!Array.isArray(conflicts) || conflicts.length === 0) return null;

  // On the main screen, ONLY show time-sensitive and severe warnings
  const visibleConflicts = showAll
    ? conflicts
    : conflicts.filter((c) => c.severity === 'severe' || c.severity === 'error');

  if (visibleConflicts.length === 0) return null;

  return (
    <div className="space-y-1.5 my-2">
      {visibleConflicts.map((c, i) => {
        const isSevere = c.severity === 'severe' || c.severity === 'error';
        const bg = isSevere
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200';
        const icon = isSevere ? '🔴' : '🟡';

        return (
          <div
            key={`${c.rule}-${i}`}
            className={`px-3 py-2 rounded-xl border text-xs md:text-sm flex items-center gap-2.5 shadow-2xs ${bg}`}
          >
            <span className="text-sm shrink-0 select-none">{icon}</span>
            <div className="flex-1 min-w-0">
              <span className="font-black uppercase text-xs tracking-wider mr-2">
                {c.rule === 'CR-01' ? 'Luggage Gap' : c.rule === 'CR-02' ? 'Flight Rush' : 'Date Error'}
              </span>
              <span className="leading-normal font-medium">{c.message}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
