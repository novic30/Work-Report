// ════════════════════════════════════════════════════════════════════════════
//  TypeScript types matching the backend API responses
// ════════════════════════════════════════════════════════════════════════════

export interface User {
  email: string;
  name: string;
  slug: string;
}

export interface Availability {
  id: number;
  event_type_id: number;
  day_of_week: number; // 0=Sun, 6=Sat
  start_time: string;  // "09:00:00"
  end_time: string;    // "17:00:00"
}

export interface CustomQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
}

export interface EventType {
  id: number;
  clinic_email: string;
  name: string;
  slug: string;
  description: string | null;
  google_calendar_id: string;
  lead_time_hours: number;
  slot_duration_minutes: number;
  step_minutes: number;
  buffer_time_minutes: number;
  max_advance_days: number;
  custom_questions: CustomQuestion[];
  custom_reminder_template: string | null;
  is_active: boolean;
  availability: Availability[];
}

export interface Booking {
  id: number;
  event_type_id: number;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  custom_answers: Record<string, string>;
  start_time: string;
  end_time: string;
  google_event_id: string | null;
  status: 'confirmed' | 'cancelled';
  reminder_24h: boolean;
  reminder_1h: boolean;
  cancel_token: string | null;
  created_at: string;
  event_type_name?: string;
  event_type_slug?: string;
  slot_duration_minutes?: number;
}

export interface Stats {
  upcoming: number;
  today: number;
  total: number;
  activeEventTypes: number;
}

export interface PublicEventType {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  slot_duration_minutes: number;
  lead_time_hours: number;
  buffer_time_minutes: number;
  max_advance_days: number;
  custom_questions: CustomQuestion[];
  clinic_name: string;
  clinic_slug: string;
}

export interface SlotResponse {
  date: string;
  slots: string[];
  durationMinutes?: number;
  message?: string;
}
