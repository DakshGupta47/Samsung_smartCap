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
export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isNightMode, setIsNightMode] = useState(false);
  const [inspectedCard, setInspectedCard] = useState<Appliance | null>(null);
  const [inspectedAutomation, setInspectedAutomation] = useState<Automation | null>(null);
  const [appliances, setAppliances] = useState(initialAppliances);
  const [automations, setAutomations] = useState(initialAutomations);

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
        />
      )}
      {activeTab === 'rank' && <EnergyRank />}
      {activeTab === '3dhome' && (
        <Home3D
          appliances={appliances}
          isNightMode={isNightMode}
          onToggleNightMode={() => setIsNightMode(!isNightMode)}
          onSelectAppliance={setInspectedCard}
        />
      )}
      {/* TODO(kiri): scan result URL is discarded, not wired to Home3D */}
      {activeTab === 'kiri' && (
        <div className="max-w-3xl mx-auto py-6">
          <KiriScanner onScanComplete={() => setActiveTab('3dhome')} />
        </div>
      )}
      {activeTab === 'chatbot' && <Chatbot />}

      {/* FULL APPLIANCE INSPECTION MODAL */}
      {inspectedCard && (
        <ApplianceModal
          appliance={inspectedCard}
          onClose={() => setInspectedCard(null)}
          onToggle={handleToggleAppliance}
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
