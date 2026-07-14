import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getPublicEventType, getSlots, createBooking } from "../lib/api";
import type { PublicEventType, SlotResponse } from "../types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type Step = "date" | "slots" | "form" | "confirm";

export function BookingPage() {
  const { clinicSlug, eventSlug } = useParams<{
    clinicSlug: string;
    eventSlug: string;
  }>();
  const [eventType, setEventType] = useState<PublicEventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotResponse | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const [step, setStep] = useState<Step>("date");

  useEffect(() => {
    if (!clinicSlug || !eventSlug) return;
    getPublicEventType(clinicSlug, eventSlug)
      .then((res) => setEventType(res.eventType))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [clinicSlug, eventSlug]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<{
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
    }> = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, dateStr: "", isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ day: d, dateStr, isCurrentMonth: true });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, dateStr: "", isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  function isPastDate(dateStr: string): boolean {
    if (!dateStr) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr + "T00:00:00") < today;
  }

  async function handleDateSelect(dateStr: string) {
    if (!clinicSlug || !eventSlug || isPastDate(dateStr)) return;
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setSlotsLoading(true);
    setStep("slots");
    try {
      const res = await getSlots(clinicSlug, eventSlug, dateStr, timezone);
      setSlots(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load slots");
    } finally {
      setSlotsLoading(false);
    }
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    setStep("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicSlug || !eventSlug || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      const res = await createBooking(clinicSlug, eventSlug, {
        clientName,
        clientEmail,
        clientPhone: clientPhone || undefined,
        meetingNotes: meetingNotes || undefined,
        date: selectedDate,
        time: selectedTime,
        customAnswers,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setBookingId(res.bookingId);
      setStep("confirm");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !eventType) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="card max-w-md text-center space-y-4">
          <div className="text-4xl">🔍</div>
          <h1 className="text-xl font-semibold text-gray-900">Not found</h1>
          <p className="text-sm text-gray-600">
            {error || "This booking page does not exist."}
          </p>
        </div>
      </div>
    );
  }

  // Confirmation screen
  if (step === "confirm") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="card max-w-lg text-center space-y-6 mx-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Booking Confirmed!
          </h1>
          <div className="rounded-lg bg-gray-50 p-4 text-left space-y-2">
            <p>
              <strong className="text-gray-700">Event:</strong> {eventType.name}
            </p>
            <p>
              <strong className="text-gray-700">Date:</strong> {selectedDate}
            </p>
            <p>
              <strong className="text-gray-700">Time:</strong> {selectedTime}
            </p>
            <p>
              <strong className="text-gray-700">Duration:</strong>{" "}
              {eventType.slot_duration_minutes} minutes
            </p>
            <p>
              <strong className="text-gray-700">Name:</strong> {clientName}
            </p>
            <p>
              <strong className="text-gray-700">Email:</strong> {clientEmail}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            A confirmation email has been sent to {clientEmail}. You'll receive
            reminders 24 hours and 1 hour before your appointment.
          </p>
          <p className="text-xs text-gray-400">Booking ID: {bookingId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{eventType.name}</h1>
          {eventType.description && (
            <p className="mt-2 text-gray-600">{eventType.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-400">
            {eventType.slot_duration_minutes} minutes
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["date", "slots", "form"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  step === s
                    ? "bg-primary-600 text-white"
                    : ["date", "slots", "form"].indexOf(step) > i
                      ? "bg-primary-200 text-primary-700"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Calendar */}
        {step === "date" && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1,
                    ),
                  )
                }
                className="btn-secondary text-sm px-3 py-1"
              >
                ←
              </button>
              <h2 className="text-lg font-semibold">
                {MONTH_NAMES[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </h2>
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1,
                    ),
                  )
                }
                className="btn-secondary text-sm px-3 py-1"
              >
                →
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_NAMES.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-gray-500 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, i) => {
                const past = isPastDate(d.dateStr);
                const isSelected = d.dateStr === selectedDate;
                return (
                  <button
                    key={i}
                    disabled={!d.isCurrentMonth || past}
                    onClick={() => d.dateStr && handleDateSelect(d.dateStr)}
                    className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                      !d.isCurrentMonth
                        ? "text-gray-200 cursor-default"
                        : past
                          ? "text-gray-300 cursor-not-allowed"
                          : isSelected
                            ? "bg-primary-600 text-white"
                            : "text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                    }`}
                  >
                    {d.day}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Time slots */}
        {step === "slots" && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Available times for {selectedDate}
              </h2>
              <button
                onClick={() => {
                  setStep("date");
                  setSelectedDate(null);
                }}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                ← Change date
              </button>
            </div>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
              </div>
            ) : !slots || slots.slots.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <p className="text-gray-500">
                  {slots?.message || "No available slots on this date."}
                </p>
                <button
                  onClick={() => {
                    setStep("date");
                    setSelectedDate(null);
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Pick another date
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.slots.map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                      selectedTime === time
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Booking form */}
        {step === "form" && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your details</h2>
              <button
                onClick={() => {
                  setStep("slots");
                  setSelectedTime(null);
                }}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                ← Change time
              </button>
            </div>

            <div className="rounded-lg bg-primary-50 border border-primary-200 p-3 text-sm text-primary-700">
              <strong>{eventType.name}</strong> · {selectedDate} at{" "}
              {selectedTime} · {eventType.slot_duration_minutes} min
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="John Doe"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="john@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="(555) 123-4567"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Please share anything that will help prepare for our meeting
                  (optional)
                </label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Meeting agenda, special requests, additional information..."
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                />
              </div>

              {/* Custom questions */}
              {eventType.custom_questions &&
                eventType.custom_questions.length > 0 && (
                  <>
                    {eventType.custom_questions.map((q) => (
                      <div key={q.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {q.label} {q.required && "*"}
                        </label>
                        {q.type === "textarea" ? (
                          <textarea
                            className="input-field"
                            rows={3}
                            required={q.required}
                            value={customAnswers[q.id] || ""}
                            onChange={(e) =>
                              setCustomAnswers((prev) => ({
                                ...prev,
                                [q.id]: e.target.value,
                              }))
                            }
                          />
                        ) : q.type === "select" && q.options ? (
                          <select
                            className="input-field"
                            required={q.required}
                            value={customAnswers[q.id] || ""}
                            onChange={(e) =>
                              setCustomAnswers((prev) => ({
                                ...prev,
                                [q.id]: e.target.value,
                              }))
                            }
                          >
                            <option value="">Select...</option>
                            {q.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="input-field"
                            required={q.required}
                            value={customAnswers[q.id] || ""}
                            onChange={(e) =>
                              setCustomAnswers((prev) => ({
                                ...prev,
                                [q.id]: e.target.value,
                              }))
                            }
                          />
                        )}
                      </div>
                    ))}
                  </>
                )}

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={submitting}
              >
                {submitting ? "Booking..." : "Confirm Booking"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
