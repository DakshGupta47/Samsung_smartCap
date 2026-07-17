import type { LucideIcon } from 'lucide-react';

export type ApplianceStatus = 'ON' | 'OFF';

export interface AppliancePosition {
  top: string;
  left: string;
}

export type RuleSource = 'measured' | 'generic';

export interface Appliance {
  id: string;
  name: string;
  type: string;
  efficiency: number;
  color: string;
  accent: string;
  baseWatts: number;
  todayKwh: number;
  monthlyKwh: number;
  weeklyKwh: number;
  costMonthly: number;
  icon: LucideIcon;
  recommendation: string;
  status: ApplianceStatus;
  voltage: string;
  runtime: string;
  carbon: string;
  savings: string;
  pos: AppliancePosition;
  ruleSource: RuleSource;
  notes?: string;
  photo?: string;
  // Only meaningful when ruleSource === 'generic' — whether the Coach Agent's
  // product lookup matched this card to a specific real product (true) or
  // fell back to generic category guidance because nothing specific/
  // unambiguous was found (false). Undefined for measured cards, which were
  // never looked up at all.
  identified?: boolean;
  matchedProductName?: string;
}

export interface Automation {
  id: string;
  name: string;
  desc: string;
  savingVal: string;
  active: boolean;
  why: string;
  evidence: string;
  confidence: string;
  tradeoff: string;
  ruleSource: RuleSource;
  applianceIds: string[];
}

export interface Insight {
  id: number;
  title: string;
  desc: string;
  // Omitted (not a placeholder string) until a real ₹/kWh tariff rate exists —
  // see CLAUDE.md. The UI only renders the "Potential Saving" badge when this
  // is set, so no card shows a fabricated figure in the meantime.
  saving?: string;
  icon: LucideIcon;
  color: string;
}

export type TabId = 'dashboard' | 'rank' | '3dhome' | 'kiri' | 'chatbot' | 'game' | 'discover';

// ─────────────────────────────────────────────────────────────
// Discover — static, vendor-published product listings (real
// Samsung.com models/specs/URLs the user supplied directly). Not part
// of the measured-household data model: no ruleSource, no automation
// ties, no kWh — these are marketing specs, not usage claims.
// ─────────────────────────────────────────────────────────────

export interface DiscoverProduct {
  id: string;
  category: string;
  name: string;
  model: string;
  icon: LucideIcon;
  accent: string;
  specs: string[];
  url: string;
  // Which of the user's real measured appliances (Appliance.id) this product
  // would replace — lets the Discover card show that appliance's real
  // weeklyKwh next to estimatedWeeklySavingsKwh below.
  matchesApplianceId: string;
  // DELIBERATE EXCEPTION to this repo's "never invent kWh/watts/₹" rule
  // (CLAUDE.md's Hard Rules) — explicitly requested and confirmed by the
  // project owner for this feature only, after two rounds of being offered
  // real alternatives (an ISEER-formula estimate for the AC; a live Coach
  // Agent lookup scaled against real weeklyKwh, which is what this replaced —
  // see git history). Neither Fridge nor Washer have any efficiency/wattage
  // figure in their published specs at all (capacity/features only), so no
  // real number could be derived for them regardless. Hardcoded, not
  // measured, not AI-estimated — do not present this as fact elsewhere.
  estimatedWeeklySavingsKwh: number;
}

// ─────────────────────────────────────────────────────────────
// Game loop — 7-round match built from the real measured
// appliances/automations. See CLAUDE.md's Planned Architecture
// and src/utils/gameEngine.ts for the derivation of every number.
// ─────────────────────────────────────────────────────────────

export type ComboId = 'ac_heater' | 'washer_heater';

export interface ComboDefinition {
  id: ComboId;
  automationIds: string[]; // activating ANY one of these that round breaks the combo
  atRiskKwh: number; // real per-round kWh share the multiplier applies to
}

export interface RoundDefinition {
  round: number; // 1-7
  isLaundryRound: boolean;
  activatableAutomationIds: string[]; // the 4 toggleable power-ups offered this round
  possibleCombos: ComboId[];
  baselineKwh: number; // this round's real slice of the total baseline
}

export interface ComboEvent {
  combo: ComboId;
  triggered: boolean;
  penaltyKwh: number; // 0 if averted
}

export interface RoundResult {
  round: number;
  activatedAutomationIds: string[];
  kwhSaved: number; // direct savings only (ac_sleep / lights_daylight)
  comboEvents: ComboEvent[];
  comboDamageKwh: number;
}

export type MatchStatus = 'not_started' | 'in_progress' | 'complete';

export interface MatchState {
  status: MatchStatus;
  currentRound: number; // 1-7 while playing
  controlPointsRemaining: number; // resets each round
  activationsThisRound: string[];
  roundResults: RoundResult[];
  rounds: RoundDefinition[]; // randomized fresh per match — see gameEngine.ts's createMatch
  totalKwhSaved: number;
  totalComboDamageKwh: number;
  finalScoreKwh: number | null;
  xpEarned: number | null;
}

export interface MatchHistoryEntry {
  id: string;
  completedAt: number;
  finalScoreKwh: number;
  totalKwhSaved: number;
  totalComboDamageKwh: number;
  xpEarned: number;
  comboEventsTriggeredCount: number;
  automationsUsedAtLeastOnce: string[]; // only the 4 toggleable ids — fridge_alert has no toggle
}

export interface RankTier {
  name: string;
  minXp: number;
}
