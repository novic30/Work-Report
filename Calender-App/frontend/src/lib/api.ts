// ════════════════════════════════════════════════════════════════════════════
//  API Client — typed wrapper around fetch()
//  All admin endpoints auto-attach the Bearer token from localStorage.
// ════════════════════════════════════════════════════════════════════════════

const BASE = '';  // Vite proxy handles /api → backend

function getToken(): string | null {
  return localStorage.getItem('cliniscal_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ────────────────────────────────────────────────────────────────────
export function claimToken(claimToken: string) {
  return request<{ token: string; user: { email: string; name: string; slug: string } }>(
    `/api/auth/claim/${claimToken}`,
  );
}

export function getMe() {
  return request<{ user: { email: string; name: string; slug: string } }>('/api/me');
}

// ── Event Types ─────────────────────────────────────────────────────────────
export function getEventTypes() {
  return request<{ eventTypes: import('../types').EventType[] }>('/api/event-types');
}

export function getEventType(id: number) {
  return request<{ eventType: import('../types').EventType }>(`/api/event-types/${id}`);
}

export function createEventType(data: Record<string, unknown>) {
  return request<{ eventType: import('../types').EventType }>('/api/event-types', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateEventType(id: number, data: Record<string, unknown>) {
  return request<{ eventType: import('../types').EventType }>(`/api/event-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteEventType(id: number) {
  return request<{ success: boolean }>(`/api/event-types/${id}`, {
    method: 'DELETE',
  });
}

// ── Availability ────────────────────────────────────────────────────────────
export function getAvailability(eventTypeId: number) {
  return request<{ availability: import('../types').Availability[] }>(
    `/api/event-types/${eventTypeId}/availability`,
  );
}

export function updateAvailability(eventTypeId: number, availability: Array<{ dayOfWeek: number; startTime: string; endTime: string }>) {
  return request<{ availability: import('../types').Availability[] }>(
    `/api/event-types/${eventTypeId}/availability`,
    {
      method: 'PUT',
      body: JSON.stringify({ availability }),
    },
  );
}

// ── Bookings (admin) ────────────────────────────────────────────────────────
export function getBookings(params?: { status?: string; from?: string; to?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  const query = qs.toString();
  return request<{ bookings: import('../types').Booking[] }>(`/api/bookings${query ? `?${query}` : ''}`);
}

export function getStats() {
  return request<{ stats: import('../types').Stats }>('/api/bookings/stats');
}

export function cancelBooking(id: number) {
  return request<{ success: boolean }>(`/api/bookings/${id}`, {
    method: 'DELETE',
  });
}

// ── Public booking ──────────────────────────────────────────────────────────
export function getPublicClinic(clinicSlug: string) {
  return request<{ clinic: { email: string; name: string; slug: string }; eventTypes: Array<{ id: number; name: string; slug: string; description: string | null; slot_duration_minutes: number; lead_time_hours: number }> }>(
    `/api/public/${clinicSlug}`,
  );
}

export function getPublicEventType(clinicSlug: string, eventSlug: string) {
  return request<{ eventType: import('../types').PublicEventType }>(
    `/api/public/${clinicSlug}/${eventSlug}`,
  );
}

export function getSlots(clinicSlug: string, eventSlug: string, date: string) {
  return request<import('../types').SlotResponse>(
    `/api/public/${clinicSlug}/${eventSlug}/slots`,
    {
      method: 'POST',
      body: JSON.stringify({ date }),
    },
  );
}

export function createBooking(
  clinicSlug: string,
  eventSlug: string,
  data: { clientName: string; clientEmail: string; clientPhone?: string; date: string; time: string; customAnswers?: Record<string, string> },
) {
  return request<{ success: boolean; bookingId: number }>(
    `/api/public/${clinicSlug}/${eventSlug}/book`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}

export function cancelByToken(cancelToken: string) {
  return request<{ success: boolean; message: string }>(
    `/api/public/cancel/${cancelToken}`,
  );
}
