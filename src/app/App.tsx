import { useState } from 'react';
import { NavBar } from './NavBar';
import { DashboardView } from '../dashboard/DashboardView';
import { TripsView } from '../trips/TripsView';
import { RulesView } from '../rules/RulesView';

type View = 'dashboard' | 'trips' | 'rules';

export function App(): JSX.Element {
  const [activeView, setActiveView] = useState<View>('dashboard');

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar activeView={activeView} onViewChange={setActiveView} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'trips' && <TripsView />}
        {activeView === 'rules' && <RulesView />}
      </main>
    </div>
  );
}
