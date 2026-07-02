import { useAuth } from '../lib/auth';

export function Settings() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your clinic profile and preferences.
        </p>
      </div>

      {/* Profile */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Clinic Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
            <input
              type="text"
              className="input-field"
              value={user?.name || ''}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="input-field"
              value={user?.email || ''}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Booking URL</label>
            <div className="flex items-center gap-2">
              <code className="input-field text-sm text-primary-600 bg-gray-50">
                {window.location.origin}/{user?.slug}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/${user?.slug}`);
                  alert('Copied!');
                }}
                className="btn-secondary text-sm"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Google Calendar */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Google Calendar</h2>
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
          <span className="text-green-600 text-lg">✓</span>
          <div>
            <p className="text-sm font-medium text-green-800">Connected</p>
            <p className="text-xs text-green-600">
              Syncing with {user?.email}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Your Google Calendar is used to check for conflicts and create events.
          Any events you manually add to your calendar will block those time slots
          on your booking page automatically.
        </p>
      </div>

      {/* Sharing */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Share Your Booking Page</h2>
        <p className="text-sm text-gray-500">
          Share this link with clients so they can book appointments with you.
          Each event type has its own direct link.
        </p>
        <div className="rounded-lg bg-gray-50 p-4 space-y-2">
          <p className="text-sm"><strong>Main page:</strong> <code className="text-primary-600">{window.location.origin}/{user?.slug}</code></p>
          <p className="text-xs text-gray-400">
            This shows all your active event types. Clients can pick which one to book.
          </p>
        </div>
      </div>
    </div>
  );
}
