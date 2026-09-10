export type AppointmentStatus = 'available' | 'booked' | 'cancelled';

export interface AppointmentSlot {
  id: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // e.g. "09:00 AM"
  status: AppointmentStatus;
  patient_name?: string | null;
  patient_email?: string | null;
  patient_phone?: string | null;
  booking_reference?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BookAppointmentInput {
  slot_id?: string;
  date?: string;
  time?: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  notes?: string;
}

export interface RescheduleAppointmentInput {
  booking_reference: string;
  new_slot_id: string;
}

export interface CancelAppointmentInput {
  booking_reference: string;
  reason?: string;
}

export interface BookingConfirmation {
  success: boolean;
  message: string;
  booking_reference?: string;
  clinic_name: string;
  appointment_date?: string;
  appointment_time?: string;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  slot_id?: string;
  error?: string;
  available_alternatives?: AppointmentSlot[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  slots?: AppointmentSlot[];
  bookingConfirmation?: BookingConfirmation;
}
