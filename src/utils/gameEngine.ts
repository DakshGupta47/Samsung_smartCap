// ─────────────────────────────────────────────────────────────
// Game engine — pure logic, no React. Every number here traces to a real
// figure already in src/data/appliances.ts / src/data/automations.ts (see
// CLAUDE.md's household table). Nothing is invented except the two constants
// explicitly flagged as game-balance choices below.
// ─────────────────────────────────────────────────────────────

import type {
  Appliance,
  Automation,
  ComboDefinition,
  ComboEvent,
  ComboId,
  MatchHistoryEntry,
  MatchState,
  RoundDefinition,
  RoundResult,
} from '../types';

// ── Game-balance constants (confirmed with the user, not derived from data) ──
// Lowered from 3→2: with 3-4 activatable power-ups per round, 3 CP left enough
// slack to cover everything and never take a combo hit. 2 CP forces a genuine
// tradeoff every round — the 2 devices' full overlap (not just one appliance's
// share, see atRiskKwh below) is truly at stake if you can't cover both combos.
export const CONTROL_POINTS_PER_ROUND = 2;
export const XP_PER_KWH = 50;

// One-time bonus for self-reporting a real-world appliance upgrade from the
// Discover tab (src/views/Discover.tsx). Unlike XP_PER_KWH, this has no kWh
// to derive from — there's no purchase/verification backend, so this is
// entirely self-reported (honor system), clearly labeled as such in the UI.
export const UPGRADE_BONUS_XP = 1000;

// Average of the two real measured overlap ratios: 6,777W/4,700W and 6,703W/4,700W
// (laundry_stagger's own evidence text) — a ~43.4% penalty, not rounded further.
export const COMBO_PENALTY_MULTIPLIER = (6777 / 4700 + 6703 / 4700) / 2;

export const TOTAL_ROUNDS = 7;
// The washing machine's only two real dated events (May 8, May 11 —
// laundry_stagger.evidence) are 3 calendar days apart. Each match randomizes
// WHERE that pair falls in the 7-round sequence, but always keeps them
// exactly 3 rounds apart to preserve that real gap — so the possible laundry
// round pairs are (1,4), (2,5), (3,6), (4,7), chosen fresh per match.
const LAUNDRY_ROUND_START_OPTIONS = [1, 2, 3, 4];

// Real sum of appliances.ts's weeklyKwh fields (208.48+74.99+8.80+14.27+34.85),
// matching CLAUDE.md's table exactly.
export const TOTAL_BASELINE_KWH = 341.39;

const REQUIRED_APPLIANCE_IDS = ['ac', 'heater', 'washer', 'lights', 'fridge'];
const REQUIRED_AUTOMATION_IDS = ['ac_sleep', 'heater_stagger', 'laundry_stagger', 'lights_daylight', 'fridge_alert'];

// Only ac_sleep and lights_daylight have a genuine, real, standalone kWh-saving
// figure when activated — their own savingVal text states a kWh exposure.
// heater_stagger's savingVal explicitly says "No added kWh — reduces peak-hour
// overlap", and laundry_stagger's says "~40% peak-demand spike avoided" (a %,
// not a kWh figure) — both exist purely to prevent the combo penalties below,
// never to bank a direct saving.
//
// Note ac_sleep's 43.9 kWh/week is NOT the AC's full weekly total (208.48) —
// it's specifically the flat overnight window WindFree/Sleep mode addresses
// (21% of the AC's own weekly use, per ac_sleep.evidence). The remaining 79%
// of the AC's consumption happens outside that window and is unaffected by
// this power-up either way — it's still counted in the baseline below, just
// never reducible by anything in this game.
const DIRECT_SAVING_PER_ROUND: Record<string, number> = {
  ac_sleep: 43.9 / 7,
  lights_daylight: 14.27 / 7,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fullApplianceShare(appliances: Appliance[], applianceId: string, days: number): number {
  const appliance = appliances.find((a) => a.id === applianceId);
  return appliance ? appliance.weeklyKwh / days : 0;
}

export interface ApplianceShares {
  ac: number;
  heater: number;
  lights: number;
  fridge: number;
  washer: number; // per laundry-round share, not per-round-of-7
}

export interface GameConfigReady {
  ready: true;
  combos: ComboDefinition[];
  shares: ApplianceShares;
}

export interface GameConfigNotReady {
  ready: false;
  missingApplianceIds: string[];
  missingAutomationIds: string[];
}

export type GameConfig = GameConfigReady | GameConfigNotReady;

export function buildGameConfig(appliances: Appliance[], automations: Automation[]): GameConfig {
  const measuredIds = new Set(automations.filter((a) => a.ruleSource === 'measured').map((a) => a.id));
  const applianceIds = new Set(appliances.map((a) => a.id));

  // A user can delete any real appliance/automation via the Coach Agent card
  // flows built earlier this session — the game must not crash on a missing
  // appliance's weeklyKwh, it must fail gracefully instead.
  const missingApplianceIds = REQUIRED_APPLIANCE_IDS.filter((id) => !applianceIds.has(id));
  const missingAutomationIds = REQUIRED_AUTOMATION_IDS.filter((id) => !measuredIds.has(id));

  if (missingApplianceIds.length > 0 || missingAutomationIds.length > 0) {
    return { ready: false, missingApplianceIds, missingAutomationIds };
  }

  const shares: ApplianceShares = {
    ac: fullApplianceShare(appliances, 'ac', 7),
    heater: fullApplianceShare(appliances, 'heater', 7),
    lights: fullApplianceShare(appliances, 'lights', 7),
    fridge: fullApplianceShare(appliances, 'fridge', 7),
    washer: fullApplianceShare(appliances, 'washer', 2), // only on the 2 real laundry rounds
  };

  // heater_stagger.applianceIds is already ['heater','ac'] and laundry_stagger's
  // is already ['washer','heater'] in the real data — the heater automation is
  // already, in the real data, a party to both combo pairs.
  //
  // atRiskKwh covers BOTH overlapping appliances' real per-round shares, not
  // just one — an unmitigated overlap puts the whole shared load at risk, not
  // a single device's slice of it. Still 100% real weeklyKwh-derived numbers,
  // just widening which of them the penalty multiplier applies to.
  const combos: ComboDefinition[] = [
    { id: 'ac_heater', automationIds: ['ac_sleep', 'heater_stagger'], atRiskKwh: shares.heater + shares.ac },
    { id: 'washer_heater', automationIds: ['laundry_stagger', 'heater_stagger'], atRiskKwh: shares.washer + shares.heater },
  ];

  return { ready: true, combos, shares };
}

/** Randomizes which 2 (3-rounds-apart) rounds are laundry-active this match. */
function buildRounds(shares: ApplianceShares): RoundDefinition[] {
  const start = LAUNDRY_ROUND_START_OPTIONS[Math.floor(Math.random() * LAUNDRY_ROUND_START_OPTIONS.length)];
  const laundryRounds = [start, start + 3];

  const rounds: RoundDefinition[] = [];
  for (let round = 1; round <= TOTAL_ROUNDS; round++) {
    const isLaundryRound = laundryRounds.includes(round);
    const activatableAutomationIds = isLaundryRound
      ? ['ac_sleep', 'heater_stagger', 'laundry_stagger', 'lights_daylight']
      : ['ac_sleep', 'heater_stagger', 'lights_daylight'];
    const possibleCombos: ComboId[] = isLaundryRound ? ['ac_heater', 'washer_heater'] : ['ac_heater'];
    const baselineKwh = shares.ac + shares.heater + shares.lights + shares.fridge + (isLaundryRound ? shares.washer : 0);
    rounds.push({ round, isLaundryRound, activatableAutomationIds, possibleCombos, baselineKwh });
  }

  // Fail fast if the real numbers ever drift (mirrors checkShutoffGuard's
  // module-load fail-fast spirit in src/data/automations.ts) — true regardless
  // of which 2 rounds ended up as the laundry pair.
  const summedBaseline = rounds.reduce((sum, r) => sum + r.baselineKwh, 0);
  console.assert(
    Math.abs(summedBaseline - TOTAL_BASELINE_KWH) < 0.01,
    `Game round baselines sum to ${summedBaseline.toFixed(2)}, expected ${TOTAL_BASELINE_KWH}`
  );

  return rounds;
}

// Initial value before the user has ever pressed "Start Match" this session.
export const NOT_STARTED_MATCH: MatchState = {
  status: 'not_started',
  currentRound: 0,
  controlPointsRemaining: 0,
  activationsThisRound: [],
  roundResults: [],
  rounds: [],
  totalKwhSaved: 0,
  totalComboDamageKwh: 0,
  finalScoreKwh: null,
  xpEarned: null,
};

/** Starts a fresh match — randomizes the laundry-round placement anew each call. */
export function createMatch(config: GameConfigReady): MatchState {
  return {
    status: 'in_progress',
    currentRound: 1,
    controlPointsRemaining: CONTROL_POINTS_PER_ROUND,
    activationsThisRound: [],
    roundResults: [],
    rounds: buildRounds(config.shares),
    totalKwhSaved: 0,
    totalComboDamageKwh: 0,
    finalScoreKwh: null,
    xpEarned: null,
  };
}

/** Toggles a power-up for the current round. No-op if insufficient control points. */
export function activatePowerUp(match: MatchState, automationId: string): MatchState {
  if (match.status !== 'in_progress') return match;

  if (match.activationsThisRound.includes(automationId)) {
    return {
      ...match,
      activationsThisRound: match.activationsThisRound.filter((id) => id !== automationId),
      controlPointsRemaining: match.controlPointsRemaining + 1,
    };
  }

  if (match.controlPointsRemaining <= 0) return match;

  return {
    ...match,
    activationsThisRound: [...match.activationsThisRound, automationId],
    controlPointsRemaining: match.controlPointsRemaining - 1,
  };
}

/** Resolves the current round, advances to the next (or completes the match on round 7). */
export function resolveRound(match: MatchState, config: GameConfigReady): MatchState {
  if (match.status !== 'in_progress') return match;
  const roundDef = match.rounds.find((r) => r.round === match.currentRound);
  if (!roundDef) return match;

  const activated = new Set(match.activationsThisRound);

  let kwhSaved = 0;
  for (const automationId of Object.keys(DIRECT_SAVING_PER_ROUND)) {
    if (activated.has(automationId)) kwhSaved += DIRECT_SAVING_PER_ROUND[automationId];
  }

  const comboEvents: ComboEvent[] = roundDef.possibleCombos.map((comboId) => {
    const combo = config.combos.find((c) => c.id === comboId)!;
    const mitigated = combo.automationIds.some((id) => activated.has(id));
    return {
      combo: comboId,
      triggered: !mitigated,
      penaltyKwh: mitigated ? 0 : round2(combo.atRiskKwh * (COMBO_PENALTY_MULTIPLIER - 1)),
    };
  });

  const comboDamageKwh = round2(comboEvents.reduce((sum, e) => sum + e.penaltyKwh, 0));

  const roundResult: RoundResult = {
    round: match.currentRound,
    activatedAutomationIds: [...match.activationsThisRound],
    kwhSaved: round2(kwhSaved),
    comboEvents,
    comboDamageKwh,
  };

  const totalKwhSaved = round2(match.totalKwhSaved + kwhSaved);
  const totalComboDamageKwh = round2(match.totalComboDamageKwh + comboDamageKwh);
  const isLastRound = match.currentRound >= TOTAL_ROUNDS;

  return {
    status: isLastRound ? 'complete' : 'in_progress',
    currentRound: isLastRound ? match.currentRound : match.currentRound + 1,
    controlPointsRemaining: CONTROL_POINTS_PER_ROUND,
    activationsThisRound: [],
    roundResults: [...match.roundResults, roundResult],
    rounds: match.rounds,
    totalKwhSaved,
    totalComboDamageKwh,
    finalScoreKwh: isLastRound ? round2(TOTAL_BASELINE_KWH - totalKwhSaved + totalComboDamageKwh) : null,
    xpEarned: isLastRound ? Math.round(Math.max(0, totalKwhSaved - totalComboDamageKwh) * XP_PER_KWH) : null,
  };
}

export function toHistoryEntry(match: MatchState): MatchHistoryEntry {
  const comboEventsTriggeredCount = match.roundResults.reduce(
    (sum, r) => sum + r.comboEvents.filter((e) => e.triggered).length,
    0
  );
  const automationsUsedAtLeastOnce = Array.from(
    new Set(match.roundResults.flatMap((r) => r.activatedAutomationIds))
  );
  return {
    id: `match-${Date.now()}`,
    completedAt: Date.now(),
    finalScoreKwh: match.finalScoreKwh ?? TOTAL_BASELINE_KWH,
    totalKwhSaved: match.totalKwhSaved,
    totalComboDamageKwh: match.totalComboDamageKwh,
    xpEarned: match.xpEarned ?? 0,
    comboEventsTriggeredCount,
    automationsUsedAtLeastOnce,
  };
}
