import type { MatchHistoryEntry } from '../types';

// The 4 toggleable power-ups. fridge_alert is deliberately excluded — it has
// no toggle at all (passive, always-on, free, per its own real "alert only,
// not a savings claim" scope), so it can't be "used."
const TOGGLEABLE_AUTOMATION_IDS = ['ac_sleep', 'heater_stagger', 'laundry_stagger', 'lights_daylight'];

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  // upgradedCount = how many Discover products the user has self-reported
  // upgrading to (src/views/Discover.tsx) — 0 for the 3 match-based checks
  // below, which ignore it entirely.
  check: (history: MatchHistoryEntry[], upgradedCount: number) => boolean;
}

// Every achievement is a boolean computed from real state — either match
// history or a real (if self-reported) upgrade count. No fabricated stats,
// no static "done: true" flags.
export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  {
    id: 'zero_combos',
    title: 'Zero Combo Penalties',
    desc: 'Complete a match with no unmitigated overlap penalties.',
    check: (history) => {
      const latest = history[history.length - 1];
      return !!latest && latest.comboEventsTriggeredCount === 0;
    },
  },
  {
    id: 'power_user',
    title: 'Power User',
    desc: 'Activate all 4 power-ups at least once in a single match.',
    check: (history) => {
      const latest = history[history.length - 1];
      if (!latest) return false;
      return TOGGLEABLE_AUTOMATION_IDS.every((id) => latest.automationsUsedAtLeastOnce.includes(id));
    },
  },
  {
    id: 'personal_best',
    title: 'New Personal Best',
    desc: 'Beat your lowest previous match score (lower kWh is better).',
    check: (history) => {
      if (history.length < 2) return false;
      const latest = history[history.length - 1];
      const previousBest = Math.min(...history.slice(0, -1).map((m) => m.finalScoreKwh));
      return latest.finalScoreKwh < previousBest;
    },
  },
  {
    id: 'home_upgrader',
    title: 'Home Upgrader',
    desc: 'Self-reported: upgraded to a featured Samsung product from the Discover tab.',
    check: (_history, upgradedCount) => upgradedCount > 0,
  },
];
