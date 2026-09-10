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
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  slots?: AppointmentSlot[];
  bookingConfirmation?: BookingConfirmation;
  isEmergency?: boolean;
  isClinicalBoundary?: boolean;
}

export interface ClinicInfo {
  name: string;
  location: string;
  hours: {
    weekday: string;
    saturday: string;
    sunday: string;
    mondayOpen: string;
    saturdayClose: string;
  };
  receptionDuties: string;
  whatToBring: string[];
  routinePreparation: string;
  procedurePreparationRule: string;
  phoneNumberMessage: string;
  unknownInfoMessage: string;
  disclaimer: string;
}

export interface DatabaseStatus {
  provider: 'supabase' | 'local_persistent';
  connected: boolean;
  totalSlots: number;
  availableSlots: number;
  error?: string;
}
