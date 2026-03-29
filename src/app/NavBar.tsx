type View = 'dashboard' | 'trips' | 'rules';

interface Props {
  activeView: View;
  onViewChange: (view: View) => void;
}

const TABS: { id: View; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'trips', label: 'Trips' },
  { id: 'rules', label: 'Rules' },
];

export function NavBar({ activeView, onViewChange }: Props): JSX.Element {
  return (
    <nav className="border-b border-gray-800 bg-gray-900">
      <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
        <span className="text-lg font-bold text-white">Nomad</span>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                activeView === tab.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
