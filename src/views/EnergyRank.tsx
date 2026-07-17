import { Trophy, Zap, Gamepad2, Medal, CheckCircle2, Box } from 'lucide-react';
import type { MatchHistoryEntry } from '../types';
import { deriveRankProgress } from '../data/ranks';
import { ACHIEVEMENT_DEFINITIONS } from '../data/achievements';
import { UPGRADE_BONUS_XP } from '../utils/gameEngine';

interface EnergyRankProps {
  matchHistory: MatchHistoryEntry[];
  // How many Discover products the user has self-reported upgrading to
  // (App.tsx's upgradedProductIds.size) — real, but self-reported, not
  // verified. Adds UPGRADE_BONUS_XP per upgrade on top of match-earned XP.
  upgradedCount: number;
}

export function EnergyRank({ matchHistory, upgradedCount }: EnergyRankProps) {
  const matchXp = matchHistory.reduce((sum, m) => sum + m.xpEarned, 0);
  const bonusXp = upgradedCount * UPGRADE_BONUS_XP;
  const cumulativeXp = matchXp + bonusXp;
  const totalKwhSaved = matchHistory.reduce((sum, m) => sum + m.totalKwhSaved, 0);
  const matchesPlayed = matchHistory.length;
  const bestScore = matchesPlayed > 0 ? Math.min(...matchHistory.map((m) => m.finalScoreKwh)) : null;

  const { tier, nextTier, progressPct, xpToNext } = deriveRankProgress(cumulativeXp);

  const STATS = [
    { label: 'Cumulative XP', val: cumulativeXp.toLocaleString(), icon: Trophy, color: '#F1C40F' },
    { label: 'Energy Saved', val: `${totalKwhSaved.toFixed(2)} kWh`, icon: Zap, color: '#3498DB' },
    { label: 'Matches Played', val: String(matchesPlayed), icon: Gamepad2, color: '#9B59B6' },
    { label: 'Best Score', val: bestScore !== null ? `${bestScore.toFixed(2)} kWh` : '—', icon: Medal, color: '#2ECC71' },
  ];

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      <header className="flex flex-col items-center text-center space-y-4 pt-4">
        <div className="inline-block bg-[#F1C40F] border-4 border-[#2D3436] rounded-2xl px-6 py-2 shadow-[0_6px_0_0_#2D3436] transform -rotate-1">
          <h1
            className="text-3xl md:text-5xl font-black text-white tracking-wider uppercase"
            style={{ WebkitTextStroke: '1.5px #2D3436' }}
          >
            Samsung Rewards
          </h1>
        </div>
        <p className="text-lg font-bold text-slate-600 bg-white px-4 py-1 rounded-full border-2 border-slate-300 shadow-sm">
          Real XP from real matches — play the Game tab to earn it
        </p>
      </header>

      {/* Main Stats — all derived from real matchHistory, no fabricated figures */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <div
            key={i}
            className="bg-white border-4 border-[#2D3436] p-4 rounded-2xl shadow-[0_6px_0_0_#2D3436] text-center flex flex-col items-center"
          >
            <stat.icon className="w-8 h-8 mb-2" style={{ color: stat.color }} />
            <span className="text-xl font-black text-[#2D3436]">{stat.val}</span>
            <span className="text-xs font-bold text-slate-500 uppercase">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* XP Progress Bar — live, derived from cumulative XP against real rank tiers */}
      <div className="bg-white border-4 border-[#2D3436] rounded-2xl p-6 shadow-[0_8px_0_0_#2D3436]">
        <div className="flex justify-between text-sm font-black uppercase text-[#2D3436] mb-4">
          <span>Level: {tier.name}</span>
          {nextTier && <span>Next: {nextTier.minXp.toLocaleString()} XP</span>}
        </div>
        <div className="h-8 bg-[#F1F2F6] rounded-full border-4 border-[#2D3436] overflow-hidden relative">
          <div
            className="absolute h-full bg-[#F1C40F] xp-bar-fill border-r-4 border-[#2D3436]"
            style={{ width: `${progressPct}%` }}
          ></div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.2)_0%,transparent_50%)] bg-[length:20px_100%]"></div>
        </div>
        <p className="text-center text-xs font-bold text-slate-500 mt-3">
          {nextTier ? `${xpToNext?.toLocaleString()} XP remaining to unlock ${nextTier.name}` : 'Top rank reached!'}
        </p>
        {bonusXp > 0 && (
          <p className="text-center text-xs font-bold text-[#9B59B6] mt-1">
            Includes {bonusXp.toLocaleString()} bonus XP from {upgradedCount} self-reported upgrade{upgradedCount === 1 ? '' : 's'} (Discover tab, honor system)
          </p>
        )}
      </div>

      {/* Achievements — booleans checked against real match state only */}
      <div>
        <h2 className="text-2xl font-black uppercase text-[#2D3436] mb-6">Achievements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ACHIEVEMENT_DEFINITIONS.map((ach) => {
            const done = ach.check(matchHistory, upgradedCount);
            return (
              <div
                key={ach.id}
                className={`p-4 border-4 border-[#2D3436] rounded-2xl flex items-start gap-4 shadow-[0_6px_0_0_#2D3436] ${
                  done ? 'bg-[#D5F5E3]' : 'bg-slate-100 opacity-70'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 border-[#2D3436] flex items-center justify-center shrink-0 ${
                    done ? 'bg-[#2ECC71] text-white' : 'bg-slate-300'
                  }`}
                >
                  {done ? <CheckCircle2 className="w-6 h-6" /> : <Box className="w-5 h-5 text-slate-500" />}
                </div>
                <div>
                  <h4 className="font-black text-[#2D3436]">{ach.title}</h4>
                  <p className="text-xs font-bold text-slate-600">{ach.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {matchesPlayed === 0 && (
        <p className="text-center text-sm font-bold text-slate-400">
          No matches played yet — head to the Game tab to start your first one.
        </p>
      )}
    </div>
  );
}
