import { useRef, useState } from 'react';
import type { Appliance, Automation, TabId, MatchState, MatchHistoryEntry } from './types';
import { initialAppliances } from './data/appliances';
import { initialAutomations } from './data/automations';
import { insights } from './data/insights';
import { Dashboard } from './views/Dashboard';
import { EnergyRank } from './views/EnergyRank';
import { Home3D } from './views/Home3D';
import { GameView } from './views/GameView';
import { Discover } from './views/Discover';
import { ApplianceModal } from './components/ApplianceModal';
import { AutomationModal } from './components/AutomationModal';
import { BottomNav } from './components/BottomNav';
import { KiriScanner } from './components/KiriScanner.jsx';
import { Chatbot } from './views/Chatbot';
import { IntroScreen } from './components/IntroScreen';
import { lookupProduct, generateAutomations } from './utils/coachAgent';
import { pickIcon } from './utils/iconGuess';
import { NOT_STARTED_MATCH } from './utils/gameEngine';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [inspectedCard, setInspectedCard] = useState<Appliance | null>(null);
  const [inspectedAutomation, setInspectedAutomation] = useState<Automation | null>(null);
  const [appliances, setAppliances] = useState(initialAppliances);
  const [automations, setAutomations] = useState(initialAutomations);
  const [dashboardNotice, setDashboardNotice] = useState<{ message: string; tone: 'success' | 'warning' } | null>(null);
  const [scannedModelUrl, setScannedModelUrl] = useState('/models/appartement.glb');
  const [matchState, setMatchState] = useState<MatchState>(NOT_STARTED_MATCH);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  // Which Discover products the user has self-reported upgrading to (honor
  // system — no purchase/verification backend exists). A Set so re-reporting
  // the same product is a no-op, not a repeatable XP farm.
  const [upgradedProductIds, setUpgradedProductIds] = useState<Set<string>>(new Set());
  // Cards deleted while their background Coach Agent lookup is still in
  // flight must not come back to life (or gain orphaned automations) once
  // that lookup resolves — a ref survives across renders without needing to
  // be a dependency of the async resolver below.
  const deletedCardIdsRef = useRef(new Set<string>());

  const handleReportUpgrade = (productId: string) => {
    setUpgradedProductIds((prev) => {
      if (prev.has(productId)) return prev;
      return new Set(prev).add(productId);
    });
  };

  const handleMatchComplete = (entry: MatchHistoryEntry) => {
    setMatchHistory((prev) => [...prev, entry]);
  };

  const COACH_AGENT_FAILURE_NOTICE = "Couldn't verify live specs — using general guidance.";

  const handleToggleAutomation = (id: string) => {
    setAutomations((prev) => prev.map((auto) => (auto.id === id ? { ...auto, active: !auto.active } : auto)));
    if (inspectedAutomation && inspectedAutomation.id === id) {
      setInspectedAutomation((prev) => (prev ? { ...prev, active: !prev.active } : prev));
    }
  };

  const handleToggleAppliance = (id: string) => {
    setAppliances((prev) => prev.map((app) => (app.id === id ? { ...app, status: app.status === 'ON' ? 'OFF' : 'ON' } : app)));
    if (inspectedCard && inspectedCard.id === id) {
      setInspectedCard((prev) => (prev ? { ...prev, status: prev.status === 'ON' ? 'OFF' : 'ON' } : prev));
    }
  };

  // Runs after the card already exists on-screen — looks up real specs and
  // generates automations in the background, then patches the same card (and
  // adds its automations) in place once that resolves. Never awaited by the
  // caller; the card is fully usable (toggleable, deletable) the whole time.
  const resolveNewCardDetails = async (id: string, name: string, notes?: string) => {
    try {
      const spec = await lookupProduct(name, notes);
      const genResult = await generateAutomations(spec, name);

      if (deletedCardIdsRef.current.has(id)) return; // deleted mid-lookup — don't resurrect it

      const liveCallFailed = spec.liveCallFailed || genResult.liveCallFailed;
      const confidenceText = spec.status === 'specific'
        ? `Based on published specs for ${spec.matchedProductName}, not measured from your usage`
        : `No specific data found — showing typical ${spec.category} guidance`;
      const identified = spec.status === 'specific';
      const matchedProductName = spec.matchedProductName ?? undefined;
      const icon = pickIcon(spec.category, name);
      const baseWatts = Math.round((spec.estimatedWattsLow + spec.estimatedWattsHigh) / 2);
      const recommendation = genResult.automations[0]?.desc ?? 'No recommendation generated yet.';

      setAppliances((prev) => prev.map((a) => (a.id === id
        ? { ...a, type: spec.category, baseWatts, icon, recommendation, identified, matchedProductName }
        : a)));
      if (inspectedCard?.id === id) {
        setInspectedCard((prev) => (prev
          ? { ...prev, type: spec.category, baseWatts, icon, recommendation, identified, matchedProductName }
          : prev));
      }

      const autos: Automation[] = genResult.automations.map((g, i) => ({
        id: `${id}-auto-${i}`,
        name: g.name,
        desc: g.desc,
        savingVal: g.savingVal,
        active: false,
        why: g.why,
        evidence: g.evidence,
        confidence: confidenceText,
        tradeoff: g.tradeoff,
        ruleSource: 'generic',
        applianceIds: [id],
      }));
      setAutomations((prev) => [...prev, ...autos]);

      if (liveCallFailed) {
        setDashboardNotice({ message: COACH_AGENT_FAILURE_NOTICE, tone: 'warning' });
      }
    } catch (err) {
      console.error(err);
      if (deletedCardIdsRef.current.has(id)) return;
      // Leave the card's other placeholder fields as-is, but don't leave the
      // badge stuck on "Identifying…" forever — resolve it to "not identified".
      setAppliances((prev) => prev.map((a) => (a.id === id ? { ...a, identified: false } : a)));
      if (inspectedCard?.id === id) {
        setInspectedCard((prev) => (prev ? { ...prev, identified: false } : prev));
      }
      setDashboardNotice({ message: COACH_AGENT_FAILURE_NOTICE, tone: 'warning' });
    }
  };

  const handleAddCard = (name: string, notes: string | undefined, photo: string | undefined) => {
    const id = `card-${Date.now()}`;
    const appliance: Appliance = {
      id,
      name,
      type: 'Uncategorized',
      efficiency: 3,
      color: '#EAEAEA',
      accent: '#9B59B6',
      baseWatts: 0,
      todayKwh: 0,
      monthlyKwh: 0,
      weeklyKwh: 0,
      costMonthly: 0, // TODO: no measured usage yet, pending real data
      icon: pickIcon('', name),
      recommendation: 'Looking up automation ideas…',
      status: 'OFF',
      voltage: 'Unknown',
      runtime: 'Not yet measured',
      carbon: '— kg', // TODO: no measured usage yet, pending real data
      savings: '—',
      pos: { top: '50%', left: '50%' },
      ruleSource: 'generic',
      notes,
      photo,
      identified: undefined, // pending — Coach Agent lookup runs in the background below
    };

    setAppliances((prev) => [...prev, appliance]);
    resolveNewCardDetails(id, name, notes); // fire-and-forget; card is already live
  };

  const handleDeleteCard = (id: string) => {
    const removed = appliances.find((a) => a.id === id);
    if (!removed) return;

    deletedCardIdsRef.current.add(id);

    const before = appliances.reduce((acc, a) => acc + a.weeklyKwh, 0);
    const after = before - removed.weeklyKwh;

    setAppliances((prev) => prev.filter((a) => a.id !== id));
    setAutomations((prev) => prev.filter((auto) => !auto.applianceIds.includes(id)));

    if (inspectedCard?.id === id) setInspectedCard(null);
    if (inspectedAutomation && inspectedAutomation.applianceIds.includes(id)) setInspectedAutomation(null);

    setDashboardNotice({
      message: `${removed.name} removed. Weekly total updated: ${before.toFixed(2)} kWh → ${after.toFixed(2)} kWh.`,
      tone: 'success',
    });
  };

  const handleEditCard = async (id: string, updates: { name?: string; notes?: string; photo?: string }) => {
    const target = appliances.find((a) => a.id === id);
    if (!target) return;

    const nextName = updates.name?.trim() || target.name;
    const nextNotes = updates.notes?.trim();

    setAppliances((prev) => prev.map((a) => (a.id === id ? { ...a, name: nextName, notes: nextNotes, photo: updates.photo ?? a.photo } : a)));
    if (inspectedCard?.id === id) {
      setInspectedCard((prev) => (prev ? { ...prev, name: nextName, notes: nextNotes, photo: updates.photo ?? prev.photo } : prev));
    }

    // Measured cards are display-only — never regenerate their real, evidence-based automations.
    if (target.ruleSource !== 'generic') return;

    const nameChanged = updates.name !== undefined && updates.name.trim() !== target.name;
    const notesChanged = updates.notes !== undefined && updates.notes.trim() !== (target.notes ?? '');
    if (!nameChanged && !notesChanged) return;

    // A live-call failure here must never leave the card in an inconsistent
    // state (renamed but with automations no longer matching) — keep the old
    // automations untouched and surface a small non-blocking notice instead,
    // same fallback message/behavior as a coach-agent failure during creation.
    try {
      const spec = await lookupProduct(nextName, nextNotes);
      const genResult = await generateAutomations(spec, nextName);

      if (spec.liveCallFailed || genResult.liveCallFailed) {
        setDashboardNotice({ message: COACH_AGENT_FAILURE_NOTICE, tone: 'warning' });
        return;
      }

      const identified = spec.status === 'specific';
      const matchedProductName = spec.matchedProductName ?? undefined;
      setAppliances((prev) => prev.map((a) => (a.id === id ? { ...a, identified, matchedProductName } : a)));
      if (inspectedCard?.id === id) {
        setInspectedCard((prev) => (prev ? { ...prev, identified, matchedProductName } : prev));
      }

      const confidenceText = spec.status === 'specific'
        ? `Based on published specs for ${spec.matchedProductName}, not measured from your usage`
        : `No specific data found — showing typical ${spec.category} guidance`;

      const newAutos: Automation[] = genResult.automations.map((g, i) => ({
        id: `${id}-auto-${Date.now()}-${i}`,
        name: g.name,
        desc: g.desc,
        savingVal: g.savingVal,
        active: false,
        why: g.why,
        evidence: g.evidence,
        confidence: confidenceText,
        tradeoff: g.tradeoff,
        ruleSource: 'generic',
        applianceIds: [id],
      }));

      setAutomations((prev) => [...prev.filter((auto) => !auto.applianceIds.includes(id)), ...newAutos]);
    } catch (err) {
      console.error(err);
      setDashboardNotice({ message: COACH_AGENT_FAILURE_NOTICE, tone: 'warning' });
    }
  };

  if (showIntro) {
    return <IntroScreen onEnter={() => setShowIntro(false)} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto relative">
      {/* Main Content Router */}
      {activeTab === 'dashboard' && (
        <Dashboard
          appliances={appliances}
          automations={automations}
          insights={insights}
          onSelectAppliance={setInspectedCard}
          onToggleAppliance={handleToggleAppliance}
          onToggleAutomation={handleToggleAutomation}
          onSelectAutomation={setInspectedAutomation}
          onAddCard={handleAddCard}
          onDeleteCard={handleDeleteCard}
          dashboardNotice={dashboardNotice}
          onDismissDashboardNotice={() => setDashboardNotice(null)}
        />
      )}
      {activeTab === 'game' && (
        <GameView
          appliances={appliances}
          automations={automations}
          matchState={matchState}
          onMatchStateChange={setMatchState}
          onMatchComplete={handleMatchComplete}
          hasSeenTutorial={hasSeenTutorial}
          onTutorialSeen={() => setHasSeenTutorial(true)}
        />
      )}
      {activeTab === 'rank' && <EnergyRank matchHistory={matchHistory} upgradedCount={upgradedProductIds.size} />}
      {activeTab === '3dhome' && (
        <Home3D
          appliances={appliances}
          onSelectAppliance={setInspectedCard}
          initialModelUrl={scannedModelUrl}
        />
      )}
      {/* TODO(kiri): scan result URL is discarded, not wired to Home3D */}
      {activeTab === 'kiri' && (
        <div className="max-w-3xl mx-auto py-6">
          <KiriScanner onScanComplete={(url: string) => {
            if (url && url !== 'https://www.kiriengine.app/webapp/') {
              setScannedModelUrl(url);
            }
            setActiveTab('3dhome');
          }} />
        </div>
      )}
      {activeTab === 'discover' && (
        <Discover
          appliances={appliances}
          upgradedProductIds={upgradedProductIds}
          onReportUpgrade={handleReportUpgrade}
        />
      )}
      {activeTab === 'chatbot' && <Chatbot appliances={appliances} automations={automations} />}

      {/* FULL APPLIANCE INSPECTION MODAL */}
      {inspectedCard && (
        <ApplianceModal
          appliance={inspectedCard}
          onClose={() => setInspectedCard(null)}
          onToggle={handleToggleAppliance}
          onDelete={handleDeleteCard}
          onEdit={handleEditCard}
        />
      )}

      {/* AUTOMATION DETAIL MODAL */}
      {inspectedAutomation && (
        <AutomationModal
          automation={inspectedAutomation}
          onClose={() => setInspectedAutomation(null)}
          onToggle={handleToggleAutomation}
        />
      )}

      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}
