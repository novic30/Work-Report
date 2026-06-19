# ClinicCal — Madison Tech Clinic Scheduling Application

## What This App Is About

Madison Tech Clinic has been using Calendly and Cal.com for scheduling consultations
for the last few years. Both tools help with scheduling and connect with Google Calendar.
However, Cal.com charges $12-28 per user per month, crashes frequently with 502 errors,
and is overbuilt for what the clinic actually needs. The open-source alternatives like
cal.diy were tried but are still too heavy and missing key features.

ClinicCal is a lightweight scheduling web application built specifically for the clinic.
It replaces Cal.com with a simple, free tool that does exactly three things: host multiple
scheduling forms, send automated reminders, and sync with the clinic's Google Calendar.
The entire app is around 3,000 lines of code compared to Cal.com's 16,000+, costs
nothing to run, and will not crash.

The app syncs with the techclinic.madison@gmail.com calendar. Google Calendar acts as
the source of truth for availability, meaning anything booked or blocked on the calendar
automatically disappears from the booking pages. No double-bookings are possible.

## Features

### Multiple Scheduling Forms

The clinic can create different event types, each acting as its own scheduling form with
independent settings:

- Each form has its own name, URL slug, duration, and description
- Each form has its own buffer time (gap before and after each booking)
- Each form has its own lead time (minimum hours in advance a patient can book)
- Each form has its own max advance booking window (e.g., book up to 30 days ahead)
- Each form has its own weekly availability schedule (e.g., Mon-Fri 9-5, Sat 10-2)
- Each form can have its own set of custom questions (e.g., "What device do you need help with?")
- Forms can be activated or deactivated without deleting them

Example forms the clinic might create:
- 30-Minute Consultation — general tech help
- 15-Minute Quick Fix — simple issues
- 1-Hour Deep Dive — complex problems
- Emergency Walk-in — same-day, limited slots

Each form gets a shareable public booking link (e.g., cliniccal.vercel.app/book/30-min-consultation).

### Public Booking Flow

Patients access a scheduling form through a shareable link:

1. Patient clicks the link for the type of appointment they need
2. A calendar shows available dates (days with open slots are highlighted)
3. Patient picks a date and sees available time slots for that day
4. Patient picks a time and fills in their name, email, phone, and answers custom questions
5. Patient confirms and is shown a confirmation page
6. Patient receives a confirmation email with booking details, location, a button to add
   the event to their calendar (.ics file), and a link to cancel or reschedule

### Google Calendar Sync

The app connects to the clinic's Google Calendar (techclinic.madison@gmail.com) through
the Google Calendar API using OAuth2 authentication. The sync works in both directions:

- Reading: When a patient views available slots, the app queries Google Calendar for any
  existing events on that date. Those time slots (plus buffer time) are removed from
  the available options. If someone manually blocks time on Google Calendar, it
  automatically disappears from the booking page.

- Writing: When a patient books an appointment, the app creates a corresponding event
  in Google Calendar with the patient's name, contact info, and notes. The Google event
  ID is stored so the two stay linked.

- Cancellation: When a booking is cancelled, the app removes the event from Google
  Calendar and marks it as cancelled in the local database.

This means the clinic can continue using Google Calendar to manually block off time for
meetings, holidays, or other reasons, and the booking page will respect those blocks
automatically.

### Automated Reminders

The app sends email reminders before each consultation on a configurable schedule:

- At booking time: The patient gets a confirmation email immediately. Staff also get a
  notification email that a new booking was made.

- 24 hours before: The patient gets a reminder email with their booking details.

- 1 hour before: The patient gets a final reminder. Staff also get an alert email so they
  know someone is coming soon.

Reminders are sent through Gmail SMTP (the same techclinic.madison@gmail.com account).
The system tracks which reminders have been sent so patients never receive duplicates.
A cron job runs every hour to check for upcoming bookings that need reminders.

Both 24-hour and 1-hour reminders can be individually enabled or disabled from the
admin settings.

### Admin Dashboard

Clinic staff access a password-protected admin panel to manage everything:

- Dashboard: A summary of upcoming bookings, recent activity, and key stats.

- Event Types: Create, edit, and deactivate scheduling forms. Configure duration,
  buffer time, lead time, availability, and custom questions for each form.

- Bookings: View all bookings in a list. See patient details, booking status, and
  linked Google Calendar events. Cancel bookings from here (which also removes them
  from Google Calendar).

- Settings: Configure clinic name, timezone, notification email, reminder preferences,
  and the Google Calendar connection.

### Website Embed

The booking widget can be embedded directly on the clinic's existing website in two ways:

- Full-page iframe: Shows the complete booking page inside the clinic's website.
- Popup widget: A floating button on the clinic's website that opens the booking form
  in a popup when clicked.

### Email Notifications

Four types of emails are sent by the system:

- Confirmation email: Sent to the patient immediately after booking. Includes booking
  details, location, calendar link, and cancellation link.

- Staff notification: Sent to clinic staff when a new booking is made.

- Reminder emails: Sent at 24 hours and 1 hour before the appointment.

- Cancellation email: Sent to the patient when a booking is cancelled.
