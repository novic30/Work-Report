import { useEffect, useState } from 'react';
import { getBookings, cancelBooking } from '../lib/api';
import type { Booking } from '../types';

export function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('confirmed');

  function load() {
    setLoading(true);
    getBookings({ status: statusFilter })
      .then((res) => setBookings(res.bookings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function handleCancel(id: number) {
    if (!confirm('Cancel this booking? The client will be notified.')) return;
    try {
      await cancelBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to cancel');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all appointments.
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['confirmed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-12 space-y-2">
          <div className="text-4xl">📅</div>
          <h3 className="text-lg font-semibold text-gray-900">No {statusFilter} bookings</h3>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reminders</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{b.client_name}</p>
                    <p className="text-xs text-gray-500">{b.client_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900">{b.event_type_name}</span>
                  </td>
                  <td className="px-4 py-3">
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
                      })}{' '}
                      ({b.slot_duration_minutes || '?'} min)
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${b.reminder_24h ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        24h
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${b.reminder_1h ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        1h
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
