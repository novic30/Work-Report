import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicClinic } from '../lib/api';

export function ClinicPage() {
  const { clinicSlug } = useParams<{ clinicSlug: string }>();
  const [clinic, setClinic] = useState<{ name: string; slug: string } | null>(null);
  const [eventTypes, setEventTypes] = useState<Array<{ id: number; name: string; slug: string; description: string | null; slot_duration_minutes: number; lead_time_hours: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicSlug) return;
    getPublicClinic(clinicSlug)
      .then((res) => {
        setClinic(res.clinic);
        setEventTypes(res.eventTypes);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [clinicSlug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="card max-w-md text-center space-y-4">
          <div className="text-4xl">🔍</div>
          <h1 className="text-xl font-semibold text-gray-900">Clinic not found</h1>
          <p className="text-sm text-gray-600">{error || 'This booking page does not exist.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white text-2xl font-bold shadow-lg mb-4">
            {clinic.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{clinic.name}</h1>
          <p className="mt-2 text-gray-600">Select an appointment type to book</p>
        </div>

        {/* Event types */}
        {eventTypes.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No appointment types available right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {eventTypes.map((et) => (
              <Link
                key={et.id}
                to={`/${clinicSlug}/${et.slug}`}
                className="card block hover:shadow-md hover:border-primary-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                      {et.name}
                    </h3>
                    {et.description && (
                      <p className="mt-1 text-sm text-gray-500">{et.description}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      {et.slot_duration_minutes} minutes · {et.lead_time_hours}h advance notice required
                    </p>
                  </div>
                  <div className="text-gray-400 group-hover:text-primary-500 text-xl">→</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
