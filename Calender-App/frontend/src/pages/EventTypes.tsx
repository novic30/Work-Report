import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEventTypes, deleteEventType } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { EventType } from "../types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function EventTypes() {
  const { user } = useAuth();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    getEventTypes()
      .then((res) => setEventTypes(res.eventTypes))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This will also delete all its bookings.`))
      return;
    try {
      await deleteEventType(id);
      setEventTypes((prev) => prev.filter((et) => et.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Types</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage your scheduling forms.
          </p>
        </div>
        <Link to="/event-types/new" className="btn-primary">
          + New Event Type
        </Link>
      </div>

      {eventTypes.length === 0 ? (
        <div className="card text-center py-12 space-y-4">
          <div className="text-4xl">📋</div>
          <h3 className="text-lg font-semibold text-gray-900">
            No event types yet
          </h3>
          <p className="text-sm text-gray-500">
            Create your first scheduling form to start accepting bookings.
          </p>
          <Link to="/event-types/new" className="btn-primary">
            Create Event Type
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {eventTypes.map((et) => (
            <div key={et.id} className="card relative">
              {/* Status badge */}
              <div className="absolute top-4 right-4">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    et.is_active
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {et.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 pr-16">
                {et.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {et.description || "No description"}
              </p>

              {/* Details */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {et.slot_duration_minutes} min
                </span>
                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                  {et.lead_time_hours}h lead time
                </span>
                <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">
                  {et.buffer_time_minutes || 0}m buffer
                </span>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  {et.max_advance_days || 30}d advance
                </span>
              </div>

              {/* Availability preview */}
              {et.availability && et.availability.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {et.availability.map((a) => (
                    <span
                      key={a.day_of_week}
                      className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded"
                    >
                      {DAY_NAMES[a.day_of_week]} {a.start_time?.slice(0, 5)}-
                      {a.end_time?.slice(0, 5)}
                    </span>
                  ))}
                </div>
              )}

              {/* Public link */}
              <div className="mt-4 flex items-center gap-2">
                <code className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded flex-1 truncate">
                  {window.location.origin}/{user?.slug}/{et.slug}
                </code>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/${user?.slug}/${et.slug}`;
                    navigator.clipboard.writeText(url);
                    // alert("Link copied!");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                  title="Copy link"
                >
                  📋
                </button>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                <Link
                  to={`/event-types/${et.id}/edit`}
                  className="btn-secondary text-xs flex-1"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(et.id, et.name)}
                  className="btn-danger text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
