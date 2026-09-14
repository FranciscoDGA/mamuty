/**
 * booking/events.ts
 *
 * Booking event emission for future automation integration.
 * Currently logs events only — WhatsApp notifications are handled
 * separately by the existing automation system.
 *
 * Events:
 *   BOOKING_CREATED       — New booking confirmed
 *   BOOKING_CANCELLED     — Booking cancelled by customer or admin
 *   BOOKING_RESCHEDULED   — Booking moved to new date/time
 *   BOOKING_MISSED        — Customer didn't show (after tolerance)
 *   BOOKING_EXPIRED       — Booking passed without check-in
 *   PROFESSIONAL_CHANGED  — Barber swapped on existing booking
 */

export type BookingEventType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'BOOKING_MISSED'
  | 'BOOKING_EXPIRED'
  | 'PROFESSIONAL_CHANGED'
  | 'REMINDER_SCHEDULED'
  | 'REMINDER_SENT'
  | 'REMINDER_FAILED';

export interface BookingEvent {
  type: BookingEventType;
  appointmentId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type BookingEventListener = (event: BookingEvent) => Promise<void> | void;

const eventListeners: BookingEventListener[] = [];

/**
 * Register a listener to be called when booking events are emitted.
 */
export function registerBookingEventListener(listener: BookingEventListener): () => void {
  eventListeners.push(listener);
  return () => {
    const idx = eventListeners.indexOf(listener);
    if (idx !== -1) eventListeners.splice(idx, 1);
  };
}

/**
 * Emit a booking event.
 * Dispatches asynchronously to all registered listeners (e.g. notifications service).
 */
export async function emitBookingEvent(
  type: BookingEventType,
  appointmentId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const event: BookingEvent = {
    type,
    appointmentId,
    timestamp: new Date().toISOString(),
    metadata,
  };

  // Log for observability
  console.log(`[BookingEvent] ${type}:`, event);

  // Dispatch to registered listeners safely
  for (const listener of eventListeners) {
    try {
      await listener(event);
    } catch (err) {
      console.error(`[BookingEvent] Error in listener for ${type}:`, err);
    }
  }
}

/**
 * Convenience emitters for each event type.
 */
export const bookingEvents = {
  created: (appointmentId: string, data?: Record<string, unknown>) =>
    emitBookingEvent('BOOKING_CREATED', appointmentId, data),

  cancelled: (appointmentId: string, reason?: string) =>
    emitBookingEvent('BOOKING_CANCELLED', appointmentId, { reason }),

  rescheduled: (appointmentId: string, oldDate: string, oldTime: string, newDate: string, newTime: string) =>
    emitBookingEvent('BOOKING_RESCHEDULED', appointmentId, {
      oldDate, oldTime, newDate, newTime,
    }),

  missed: (appointmentId: string) =>
    emitBookingEvent('BOOKING_MISSED', appointmentId),

  expired: (appointmentId: string) =>
    emitBookingEvent('BOOKING_EXPIRED', appointmentId),

  professionalChanged: (appointmentId: string, oldBarberId: string, newBarberId: string) =>
    emitBookingEvent('PROFESSIONAL_CHANGED', appointmentId, {
      oldBarberId, newBarberId,
    }),

  reminderScheduled: (appointmentId: string, reminderType: string, scheduledFor: string) =>
    emitBookingEvent('REMINDER_SCHEDULED', appointmentId, { reminderType, scheduledFor }),

  reminderSent: (appointmentId: string, reminderType: string) =>
    emitBookingEvent('REMINDER_SENT', appointmentId, { reminderType }),

  reminderFailed: (appointmentId: string, reminderType: string, error: string) =>
    emitBookingEvent('REMINDER_FAILED', appointmentId, { reminderType, error }),
};

