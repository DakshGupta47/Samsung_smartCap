import { useState } from 'react';
import { Zap, Home, Sparkles, CheckCircle2, TrendingDown, Plus, Trash2, X } from 'lucide-react';
import type { Appliance, Automation, Insight } from '../types';
import { StarIcon } from '../components/StarIcon';
import { CreateCardModal } from '../components/CreateCardModal';
import { RuleSourceBadge } from '../components/RuleSourceBadge';
import { IdentifiedBadge } from '../components/IdentifiedBadge';

interface DashboardProps {
  appliances: Appliance[];
  automations: Automation[];
  insights: Insight[];
  onSelectAppliance: (appliance: Appliance) => void;
  onToggleAppliance: (id: string) => void;
  onToggleAutomation: (id: string) => void;
  onSelectAutomation: (automation: Automation) => void;
  onAddCard: (name: string, notes: string | undefined, photo: string | undefined) => void;
  onDeleteCard: (id: string) => void;
  dashboardNotice: { message: string; tone: 'success' | 'warning' } | null;
  onDismissDashboardNotice: () => void;
}

export function Dashboard({
  appliances,
  automations,
  insights,
  onSelectAppliance,
  onToggleAppliance,
  onToggleAutomation,
  onSelectAutomation,
  onAddCard,
  onDeleteCard,
  dashboardNotice,
  onDismissDashboardNotice,
}: DashboardProps) {
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const currentDrawWatts = appliances.reduce((acc, app) => acc + (app.status === 'ON' ? app.baseWatts : 0), 0);
  const totalDailyKwh = appliances.reduce((acc, app) => acc + app.todayKwh, 0).toFixed(1);
  const totalMonthlyCost = appliances.reduce((acc, app) => acc + app.costMonthly, 0);

  return (
    <div className="space-y-12 animate-fade-in">
      {/* HEADER */}
      <header className="flex flex-col items-center text-center space-y-4 pt-4">
        <div className="inline-block bg-[#3498DB] border-4 border-[#2D3436] rounded-2xl px-6 py-2 shadow-[0_6px_0_0_#2D3436] transform -rotate-2">
          <h1
            className="text-3xl md:text-5xl font-black text-white tracking-wider uppercase"
            style={{ WebkitTextStroke: '1.5px #2D3436' }}
          >
            SAMSAVE
          </h1>
        </div>
        <p className="text-lg font-bold text-slate-600 bg-white px-4 py-1 rounded-full border-2 border-slate-300 shadow-sm">
          Monitor, Optimize, and Save Power
        </p>
      </header>

      {/* Dashboard notice banner — card deletion confirmations (success) and
          Coach Agent live-call-failure heads-ups (warning) share this one banner,
          so the messaging is visually consistent across every call site. */}
      {dashboardNotice && (
        <div
          className={`flex items-center justify-between gap-3 border-4 rounded-2xl px-5 py-3 shadow-[0_6px_0_0_#2D3436] ${
            dashboardNotice.tone === 'success' ? 'bg-[#D5F5E3] border-[#2ECC71]' : 'bg-[#FFF3CD] border-[#F1C40F]'
          }`}
        >
          <p className="text-sm font-bold text-[#2D3436]">{dashboardNotice.message}</p>
          <button
            onClick={onDismissDashboardNotice}
            className="shrink-0 w-8 h-8 bg-white border-2 border-[#2D3436] rounded-full flex items-center justify-center hover:translate-y-0.5 transition-all"
          >
            <X className="w-4 h-4 text-[#2D3436]" strokeWidth={3} />
          </button>
        </div>
      )}

      {/* TOP SECTION: Live Energy Summary */}
      <section className="bg-white border-4 border-[#2D3436] rounded-[32px] p-6 md:p-10 shadow-[0_12px_0_0_#2D3436] relative overflow-hidden">
        <Zap className="absolute -top-10 -right-10 w-48 h-48 text-yellow-100 opacity-50 rotate-12" />

        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
          <div className="flex-1 w-full space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="text-2xl font-black text-[#2D3436] uppercase flex items-center gap-2">
                ⚡ Live Power Draw
              </h3>
              <span className="text-4xl font-black text-[#2ECC71]">
                {currentDrawWatts} <span className="text-xl text-slate-400">W</span>
              </span>
            </div>

            <div className="h-10 bg-[#F1F2F6] rounded-full border-4 border-[#2D3436] overflow-hidden relative shadow-inner">
              <div
                className="h-full energy-bar transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, (currentDrawWatts / 5000) * 100)}%` }}
              />
              <div className="absolute top-0 left-0 w-full h-1/3 bg-white opacity-30 rounded-full" />
            </div>
          </div>

          <div className="flex gap-4 flex-wrap justify-center">
            <div className="bg-[#D4E6F1] border-4 border-[#2D3436] rounded-2xl p-4 text-center shadow-[0_6px_0_0_#2D3436] min-w-[130px]">
              <span className="block text-sm font-black uppercase text-slate-600 mb-1">Today's Usage</span>
              <p className="text-2xl font-black text-[#3498DB]">
                {totalDailyKwh}
                <span className="text-sm">kWh</span>
              </p>
            </div>
            <div className="bg-[#D5F5E3] border-4 border-[#2D3436] rounded-2xl p-4 text-center shadow-[0_6px_0_0_#2D3436] min-w-[130px]">
              <span className="block text-sm font-black uppercase text-slate-600 mb-1">Est. Monthly</span>
              <p className="text-2xl font-black text-[#2ECC71]">₹{totalMonthlyCost}</p>
            </div>
          </div>
        </div>
      </section>

      {/* APPLIANCE DECK */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase text-[#2D3436] flex items-center gap-3 ml-2">
          <Home className="w-8 h-8 text-[#3498DB]" fill="#3498DB" />
          Connected Appliances
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {appliances.map((app) => {
            const Icon = app.icon;
            return (
              <div
                key={app.id}
                onClick={() => onSelectAppliance(app)}
                className={`toy-card relative flex flex-col p-6 ${app.status === 'OFF' ? 'status-off' : ''}`}
              >
                {/* Status Toggle + Delete (Top Right) */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCard(app.id);
                    }}
                    className="w-6 h-6 bg-white border-2 border-[#2D3436] rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                    title={`Remove ${app.name}`}
                  >
                    <Trash2 className="w-3 h-3 text-[#E74C3C]" />
                  </button>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleAppliance(app.id);
                    }}
                  >
                    {app.status === 'ON' ? (
                      <div className="w-12 h-6 bg-[#2ECC71] rounded-full border-2 border-[#2D3436] flex items-center p-1 cursor-pointer transition-colors shadow-sm">
                        <div className="w-4 h-4 bg-white rounded-full border-2 border-[#2D3436] transform translate-x-5 transition-transform" />
                      </div>
                    ) : (
                      <div className="w-12 h-6 bg-[#A4B0BE] rounded-full border-2 border-[#2D3436] flex items-center p-1 cursor-pointer transition-colors shadow-sm">
                        <div className="w-4 h-4 bg-white rounded-full border-2 border-[#2D3436] transform translate-x-0 transition-transform" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Efficiency Rating (Top Left) */}
                <div className="absolute top-4 left-4 flex flex-col gap-1 items-start">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} filled={i < app.efficiency} />
                    ))}
                  </div>
                  <RuleSourceBadge source={app.ruleSource} />
                  {app.ruleSource === 'generic' && (
                    <IdentifiedBadge identified={app.identified} matchedProductName={app.matchedProductName} />
                  )}
                </div>

                <div className="flex flex-col items-center mt-14 space-y-4">
                  <div className="w-20 h-20 rounded-full border-4 border-[#2D3436] flex items-center justify-center bg-white shadow-[0_4px_0_0_#2D3436]">
                    <Icon className="w-10 h-10" style={{ color: app.status === 'ON' ? app.accent : '#A4B0BE' }} />
                  </div>

                  <div className="text-center w-full">
                    <h3 className="text-lg font-black text-[#2D3436] tracking-tight leading-tight">{app.name}</h3>
                    <p className={`text-sm font-bold mt-1 ${app.status === 'ON' ? 'text-[#3498DB]' : 'text-slate-400'}`}>
                      {app.status === 'ON' ? `${app.baseWatts} W` : 'Standby'}
                    </p>
                  </div>
                </div>

                {/* Info List */}
                <div className="mt-4 pt-4 border-t-4 border-dashed border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-500">Today:</span>
                    <span className="text-[#2D3436]">{app.todayKwh} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-500">Est. Cost:</span>
                    <span className="text-[#2D3436]">₹{app.costMonthly}/mo</span>
                  </div>
                  <div className="mt-2 bg-[#FFF3CD] border-2 border-[#FFE69C] rounded-lg p-2 text-xs font-bold text-[#856404] flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    {app.recommendation}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Card tile */}
          <button
            onClick={() => setIsCreatingCard(true)}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-[24px] border-4 border-dashed border-slate-300 hover:border-[#9B59B6] hover:bg-purple-50 transition-colors min-h-[280px]"
          >
            <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <span className="text-sm font-black uppercase text-slate-400">Add Card</span>
          </button>
        </div>
      </section>

      {isCreatingCard && (
        <CreateCardModal onClose={() => setIsCreatingCard(false)} onCreate={onAddCard} />
      )}

      {/* AUTOMATIONS & INSIGHTS */}
      <section className="space-y-12 pb-12">
        <div className="space-y-6">
          <h2 className="text-2xl font-black uppercase text-[#2D3436] flex items-center gap-3 ml-2">
            <CheckCircle2 className="w-8 h-8 text-[#9B59B6]" fill="#9B59B6" />
            Smart Automations
          </h2>

          <div className="flex flex-col gap-5">
            {automations.map((auto) => (
              <div
                key={auto.id}
                onClick={() => onSelectAutomation(auto)}
                className={`flex items-center justify-between p-5 md:p-6 rounded-3xl border-4 border-[#2D3436] shadow-[0_8px_0_0_#2D3436] transition-all bg-white cursor-pointer ${
                  auto.active ? 'transform -translate-y-1' : ''
                }`}
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-black text-[#2D3436]">{auto.name}</h3>
                    <RuleSourceBadge source={auto.ruleSource} />
                  </div>
                  <p className="text-sm font-bold text-slate-500 mb-2 leading-tight">{auto.desc}</p>
                  <span className="inline-block bg-[#D5F5E3] text-[#2ECC71] border-2 border-[#2ECC71] px-3 py-1 rounded-lg text-xs font-black uppercase">
                    Est. Saving: {auto.savingVal}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAutomation(auto.id);
                  }}
                  className={`relative shrink-0 w-20 h-10 rounded-full border-4 border-[#2D3436] transition-colors duration-300 focus:outline-none ${
                    auto.active ? 'bg-[#3498DB]' : 'bg-[#F1F2F6]'
                  }`}
                >
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-4 border-[#2D3436] bg-white transition-transform duration-300 shadow-sm ${
                      auto.active ? 'left-[calc(55%)] ' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 bg-[#FFEAA7] border-4 border-[#2D3436] p-6 md:p-8 rounded-[32px] shadow-[0_12px_0_0_#2D3436]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black uppercase text-[#2D3436] flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-[#FF9F43]" />
              Smart Insights
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.map((insight) => (
              <div key={insight.id} className="bg-white p-5 rounded-2xl border-4 border-[#2D3436] shadow-[0_6px_0_0_#2D3436]">
                <h3 className="text-lg font-black text-[#2D3436] mb-2 flex items-center gap-2">
                  <insight.icon className="w-5 h-5" style={{ color: insight.color }} />
                  {insight.title}
                </h3>
                <p className="text-sm font-bold text-slate-600 mb-3">{insight.desc}</p>
                {insight.saving && (
                  <span className="bg-slate-100 border-2 border-slate-200 px-3 py-1 rounded-lg text-xs font-black text-slate-500">
                    Potential Saving: <span className="text-[#2ECC71]">{insight.saving}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
