import { useState } from 'react';
import type { Appliance, Automation, TabId } from './types';
import { initialAppliances } from './data/appliances';
import { initialAutomations } from './data/automations';
import { insights } from './data/insights';
import { Dashboard } from './views/Dashboard';
import { EnergyRank } from './views/EnergyRank';
import { Home3D } from './views/Home3D';
import { ApplianceModal } from './components/ApplianceModal';
import { AutomationModal } from './components/AutomationModal';
import { BottomNav } from './components/BottomNav';
import { KiriScanner } from './components/KiriScanner.jsx';
import { Chatbot } from './views/Chatbot';
import { IntroScreen } from './components/IntroScreen';
import { lookupProduct, generateAutomations } from './utils/coachAgent';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [inspectedCard, setInspectedCard] = useState<Appliance | null>(null);
  const [inspectedAutomation, setInspectedAutomation] = useState<Automation | null>(null);
  const [appliances, setAppliances] = useState(initialAppliances);
  const [automations, setAutomations] = useState(initialAutomations);
  const [dashboardNotice, setDashboardNotice] = useState<{ message: string; tone: 'success' | 'warning' } | null>(null);
  const [scannedModelUrl, setScannedModelUrl] = useState('/models/appartement.glb');

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

  const handleAddCard = (appliance: Appliance, autos: Automation[], liveCallFailed?: boolean) => {
    setAppliances((prev) => [...prev, appliance]);
    setAutomations((prev) => [...prev, ...autos]);
    if (liveCallFailed) {
      setDashboardNotice({ message: COACH_AGENT_FAILURE_NOTICE, tone: 'warning' });
    }
  };

  const handleDeleteCard = (id: string) => {
    const removed = appliances.find((a) => a.id === id);
    if (!removed) return;

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
      {activeTab === 'rank' && <EnergyRank />}
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
