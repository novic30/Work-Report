import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createEventType, getEventType, updateEventType } from '../lib/api';
import type { EventType } from '../types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface AvailSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

function defaultAvailability(): AvailSlot[] {
  return DAY_NAMES.map((_, i) => ({
    dayOfWeek: i,
    startTime: '09:00',
    endTime: '17:00',
    enabled: i >= 1 && i <= 5, // Mon-Fri by default
  }));
}

export function EventTypeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [slotDuration, setSlotDuration] = useState(30);
  const [stepMinutes, setStepMinutes] = useState(30);
  const [leadTimeHours, setLeadTimeHours] = useState(24);
  const [bufferTimeMinutes, setBufferTimeMinutes] = useState(0);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);
  const [availability, setAvailability] = useState<AvailSlot[]>(defaultAvailability());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getEventType(parseInt(id))
      .then((res) => {
        const et = res.eventType;
        setName(et.name);
        setSlug(et.slug);
        setDescription(et.description || '');
        setSlotDuration(et.slot_duration_minutes);
        setStepMinutes(et.step_minutes);
        setLeadTimeHours(et.lead_time_hours);
        setBufferTimeMinutes(et.buffer_time_minutes || 0);
        setMaxAdvanceDays(et.max_advance_days || 30);

        // Merge saved availability with defaults
        const saved = new Map((et.availability || []).map((a) => [a.day_of_week, a]));
        setAvailability(
          DAY_NAMES.map((_, i) => {
            const s = saved.get(i);
            return {
              dayOfWeek: i,
              startTime: s ? s.start_time.slice(0, 5) : '09:00',
              endTime: s ? s.end_time.slice(0, 5) : '17:00',
              enabled: Boolean(s),
            };
          }),
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const avail = availability
      .filter((a) => a.enabled)
      .map((a) => ({ dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime }));

    const data = {
      name,
      slug: slug || undefined,
      description: description || undefined,
      slotDurationMinutes: slotDuration,
      stepMinutes,
      leadTimeHours,
      bufferTimeMinutes,
      maxAdvanceDays,
      availability: avail,
    };

    try {
      if (isEdit && id) {
        await updateEventType(parseInt(id), data);
      } else {
        await createEventType(data);
      }
      navigate('/event-types');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function toggleDay(dayIndex: number) {
    setAvailability((prev) =>
      prev.map((a, i) => (i === dayIndex ? { ...a, enabled: !a.enabled } : a)),
    );
  }

  function updateDayTime(dayIndex: number, field: 'startTime' | 'endTime', value: string) {
    setAvailability((prev) =>
      prev.map((a, i) => (i === dayIndex ? { ...a, [field]: value } : a)),
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Event Type' : 'New Event Type'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your scheduling form's details and availability.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Info</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., 30-Minute Consultation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
            <input
              type="text"
              className="input-field"
              placeholder="auto-generated from name"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-400">Leave blank to auto-generate from the name.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="What is this appointment for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Duration & Timing */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Duration & Timing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration (min)</label>
              <input
                type="number"
                className="input-field"
                min={5}
                max={480}
                value={slotDuration}
                onChange={(e) => setSlotDuration(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Step Interval (min)</label>
              <input
                type="number"
                className="input-field"
                min={5}
                max={120}
                value={stepMinutes}
                onChange={(e) => setStepMinutes(parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-400">Time between slot start times.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (hours)</label>
              <input
                type="number"
                className="input-field"
                min={0}
                max={720}
                value={leadTimeHours}
                onChange={(e) => setLeadTimeHours(parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-400">Minimum hours in advance for booking.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Time (min)</label>
              <input
                type="number"
                className="input-field"
                min={0}
                max={120}
                value={bufferTimeMinutes}
                onChange={(e) => setBufferTimeMinutes(parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-400">Gap before/after each booking.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Advance (days)</label>
              <input
                type="number"
                className="input-field"
                min={1}
                max={365}
                value={maxAdvanceDays}
                onChange={(e) => setMaxAdvanceDays(parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-400">How far ahead patients can book.</p>
            </div>
          </div>
        </div>

        {/* Weekly Availability */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Weekly Availability</h2>
          <p className="text-sm text-gray-500">Toggle which days are available and set the time window.</p>
          <div className="space-y-2">
            {availability.map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`w-20 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    a.enabled
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {DAY_NAMES[i].slice(0, 3)}
                </button>
                {a.enabled ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      className="input-field w-32"
                      value={a.startTime}
                      onChange={(e) => updateDayTime(i, 'startTime', e.target.value)}
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      className="input-field w-32"
                      value={a.endTime}
                      onChange={(e) => updateDayTime(i, 'endTime', e.target.value)}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Unavailable</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Event Type' : 'Create Event Type'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/event-types')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
