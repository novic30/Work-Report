import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats, getBookings } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Stats, Booking } from '../types';

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStats(),
      getBookings({ status: 'confirmed' }),
    ])
      .then(([s, b]) => {
        setStats(s.stats);
        setUpcoming(b.bookings.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening with your scheduling.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Bookings" value={stats?.today ?? 0} icon="📅" />
        <StatCard label="Upcoming" value={stats?.upcoming ?? 0} icon="⏰" />
        <StatCard label="Active Event Types" value={stats?.activeEventTypes ?? 0} icon="📋" />
        <StatCard label="Total Bookings" value={stats?.total ?? 0} icon="📊" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/event-types" className="card hover:shadow-md transition-shadow group">
          <div className="text-2xl mb-2">➕</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Create Event Type</h3>
          <p className="text-sm text-gray-500">Set up a new scheduling form</p>
        </Link>
        <Link to="/bookings" className="card hover:shadow-md transition-shadow group">
          <div className="text-2xl mb-2">📋</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">View Bookings</h3>
          <p className="text-sm text-gray-500">Manage upcoming appointments</p>
        </Link>
        <a
          href={`/${user?.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="text-2xl mb-2">🔗</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Booking Page</h3>
          <p className="text-sm text-gray-500">View your public booking link</p>
        </a>
      </div>

      {/* Upcoming bookings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
          <Link to="/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No upcoming bookings.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcoming.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.client_name}</p>
                  <p className="text-xs text-gray-500">{b.event_type_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">
                    {new Date(b.start_time).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(b.start_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
