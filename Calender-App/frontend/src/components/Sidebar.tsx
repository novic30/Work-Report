import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/event-types', label: 'Event Types', icon: '📋' },
  { to: '/bookings', label: 'Bookings', icon: '📅' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">C</div>
        <span className="text-lg font-bold text-gray-900">ClinicCal</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-gray-600 text-sm"
            title="Sign out"
          >
            ↗
          </button>
        </div>
      </div>
    </aside>
  );
}
