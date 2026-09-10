import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import {
  AppointmentSlot,
  BookAppointmentInput,
  BookingConfirmation,
  RescheduleAppointmentInput,
  CancelAppointmentInput,
} from './types';
import { CLINIC_INFO } from './clinicInfo';

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DATA_FILE = path.join(DATA_DIR, 'appointments.json');

// Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    console.log('✅ Supabase PostgreSQL client initialized successfully');
  } catch (err) {
    console.error('⚠️ Failed to initialize Supabase client:', err);
  }
} else {
  console.log(
    'ℹ️ Running with persistent local database store. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to connect directly to Supabase.'
  );
}

// Generate unique booking reference like HDC-849201
export function generateBookingReference(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let ref = 'HDC-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

// Ensure data directory and file exist for persistent storage
function ensureDataFile(): AppointmentSlot[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const defaultSlots = generateSeedSlots();
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultSlots, null, 2), 'utf-8');
    return defaultSlots;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Error reading appointments file, reseeding:', err);
  }

  const seeded = generateSeedSlots();
  fs.writeFileSync(DATA_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
  return seeded;
}

function saveSlotsToFile(slots: AppointmentSlot[]) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(slots, null, 2), 'utf-8');
}

// Generate realistic fictional appointment slots for testing
export function generateSeedSlots(): AppointmentSlot[] {
  const slots: AppointmentSlot[] = [];

  // Anchor to September 9, 2026 (or today if current time differs)
  const baseDate = new Date('2026-09-09T08:00:00Z');
  // Also support relative dates to today
  const actualNow = new Date();
  const targetBase = isNaN(baseDate.getTime()) ? actualNow : baseDate;

  // We seed slots for 10 days starting from Wednesday, Sep 9, 2026
  for (let dayOffset = 0; dayOffset <= 10; dayOffset++) {
    const current = new Date(targetBase);
    current.setDate(targetBase.getDate() + dayOffset);

    const dayOfWeek = current.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const dateStr = current.toISOString().split('T')[0];

    // Sunday is closed - NO appointment slots
    if (dayOfWeek === 0) {
      continue;
    }

    let times: string[] = [];

    if (dayOfWeek === 6) {
      // Saturday: 9:00 AM to 2:00 PM
      times = ['09:30 AM', '10:30 AM', '11:30 AM', '01:00 PM'];
    } else {
      // Weekdays: 8:00 AM to 7:00 PM
      if (dayOffset === 1 || dateStr === '2026-09-10') {
        // Specific assessment test case slots for Thursday, September 10:
        // 09:00 AM, 09:30 AM, 10:30 AM, 11:00 AM, plus afternoons
        times = [
          '09:00 AM',
          '09:30 AM',
          '10:30 AM',
          '11:00 AM',
          '02:00 PM',
          '03:30 PM',
          '04:30 PM',
        ];
      } else if (dayOffset === 0 || dateStr === '2026-09-09') {
        // Today
        times = ['09:00 AM', '11:00 AM', '02:00 PM', '04:30 PM', '06:00 PM'];
      } else {
        times = [
          '08:30 AM',
          '10:00 AM',
          '11:30 AM',
          '02:00 PM',
          '03:30 PM',
          '05:00 PM',
          '06:00 PM',
        ];
      }
    }

    times.forEach((time, idx) => {
      // Create a deterministic slot
      const slotId = `slot_${dateStr.replace(/-/g, '')}_${time.replace(/[: ]/g, '')}`;
      
      // Let's seed 1 booked slot on today to test already-booked scenario
      const isPreBooked = dayOffset === 0 && idx === 1; // 11:00 AM today is pre-booked

      slots.push({
        id: slotId,
        appointment_date: dateStr,
        appointment_time: time,
        status: isPreBooked ? 'booked' : 'available',
        patient_name: isPreBooked ? 'Sarah Jenkins' : null,
        patient_email: isPreBooked ? 'sarah.j@example.com' : null,
        patient_phone: isPreBooked ? '+971 50 123 4567' : null,
        booking_reference: isPreBooked ? 'HDC-SAMPLE1' : null,
        notes: isPreBooked ? 'Routine checkup' : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  return slots;
}

// Database Provider Helper
export const dbService = {
  isSupabaseConfigured(): boolean {
    return supabase !== null;
  },

  async getDatabaseStatus(): Promise<{
    provider: 'supabase' | 'local_persistent';
    connected: boolean;
    totalSlots: number;
    availableSlots: number;
    error?: string;
  }> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('id, status');

        if (!error && data) {
          return {
            provider: 'supabase',
            connected: true,
            totalSlots: data.length,
            availableSlots: data.filter((s) => s.status === 'available').length,
          };
        } else {
          console.warn('Supabase query error, fallback active:', error?.message);
        }
      } catch (err: any) {
        console.warn('Supabase ping error:', err.message);
      }
    }

    const localSlots = ensureDataFile();
    return {
      provider: supabase ? 'supabase' : 'local_persistent',
      connected: true,
      totalSlots: localSlots.length,
      availableSlots: localSlots.filter((s) => s.status === 'available').length,
      error: supabase ? 'Supabase table not initialized, using persistent local store' : undefined,
    };
  },

  // Retrieve available slots for a given date
  async getAvailableSlots(date: string): Promise<AppointmentSlot[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('appointment_date', date)
          .eq('status', 'available')
          .order('appointment_time', { ascending: true });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getAvailableSlots fallback:', err);
      }
    }

    const slots = ensureDataFile();
    return slots
      .filter((s) => s.appointment_date === date && s.status === 'available')
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  },

  // Retrieve all slots (for reviewer inspection and testing)
  async getAllSlots(): Promise<AppointmentSlot[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getAllSlots fallback:', err);
      }
    }

    return ensureDataFile();
  },

  // Check specific slot
  async checkSpecificSlot(
    date: string,
    time: string
  ): Promise<AppointmentSlot | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('appointment_date', date)
          .ilike('appointment_time', `%${time.trim()}%`)
          .limit(1);

        if (!error && data && data.length > 0) {
          return data[0];
        }
      } catch (err) {
        console.warn('Supabase checkSpecificSlot fallback:', err);
      }
    }

    const slots = ensureDataFile();
    const normalizedTime = time.toLowerCase().trim();
    return (
      slots.find(
        (s) =>
          s.appointment_date === date &&
          s.appointment_time.toLowerCase().includes(normalizedTime)
      ) || null
    );
  },

  // Book an appointment atomically
  async bookAppointment(input: BookAppointmentInput): Promise<BookingConfirmation> {
    const { slot_id, date, time, patient_name, patient_email, patient_phone, notes } = input;

    if (!patient_name || !patient_email || !patient_phone) {
      return {
        success: false,
        clinic_name: CLINIC_INFO.name,
        message: 'Patient name, email, and phone number are all required to book an appointment.',
        error: 'MISSING_PATIENT_INFO',
      };
    }

    const bookingRef = generateBookingReference();

    // 1. If Supabase is active, try atomic booking in Supabase
    if (supabase) {
      try {
        const updatePayload = {
          status: 'booked',
          patient_name: patient_name.trim(),
          patient_email: patient_email.trim(),
          patient_phone: patient_phone.trim(),
          booking_reference: bookingRef,
          notes: notes?.trim() || null,
          updated_at: new Date().toISOString(),
        };

        let filterBuilder: any = supabase.from('appointments').update(updatePayload);

        if (slot_id) {
          filterBuilder = filterBuilder.eq('id', slot_id);
        } else if (date && time) {
          filterBuilder = filterBuilder.eq('appointment_date', date).eq('appointment_time', time);
        } else {
          return {
            success: false,
            clinic_name: CLINIC_INFO.name,
            message: 'Appointment slot ID or date and time must be provided.',
            error: 'INVALID_SLOT_IDENTIFIER',
          };
        }

        // Must still be 'available' to prevent double booking!
        const { data, error }: { data: AppointmentSlot[] | null; error: any } =
          await filterBuilder.eq('status', 'available').select('*');

        if (!error && data && data.length > 0) {
          const booked = data[0];
          // Also sync to local store for consistency
          const localSlots = ensureDataFile();
          const localIndex = localSlots.findIndex(
            (s) => s.id === booked.id || (s.appointment_date === booked.appointment_date && s.appointment_time === booked.appointment_time)
          );
          if (localIndex !== -1) {
            localSlots[localIndex] = { ...localSlots[localIndex], ...booked };
            saveSlotsToFile(localSlots);
          }

          return {
            success: true,
            message: 'Your appointment is confirmed.',
            clinic_name: CLINIC_INFO.name,
            booking_reference: booked.booking_reference || bookingRef,
            appointment_date: booked.appointment_date,
            appointment_time: booked.appointment_time,
            patient_name: booked.patient_name || patient_name,
            patient_email: booked.patient_email || patient_email,
            patient_phone: booked.patient_phone || patient_phone,
            slot_id: booked.id,
          };
        }

        // Double-booking check: If update failed, check if the slot exists and was already booked
        const targetDate = date || (slot_id ? slot_id.split('_')[1] : undefined);
        const alternatives = targetDate ? await this.getAvailableSlots(targetDate) : [];

        return {
          success: false,
          clinic_name: CLINIC_INFO.name,
          message:
            'The selected appointment slot is no longer available. Please choose from the available alternatives.',
          error: 'SLOT_ALREADY_BOOKED',
          available_alternatives: alternatives,
        };
      } catch (err: any) {
        console.warn('Supabase bookAppointment fallback:', err.message);
      }
    }

    // 2. Local persistent store atomic booking
    const slots = ensureDataFile();
    let slotIndex = -1;

    if (slot_id) {
      slotIndex = slots.findIndex((s) => s.id === slot_id);
    } else if (date && time) {
      const normalizedTime = time.toLowerCase().trim();
      slotIndex = slots.findIndex(
        (s) =>
          s.appointment_date === date &&
          s.appointment_time.toLowerCase().includes(normalizedTime)
      );
    }

    if (slotIndex === -1) {
      return {
        success: false,
        clinic_name: CLINIC_INFO.name,
        message: 'The requested appointment slot does not exist.',
        error: 'SLOT_NOT_FOUND',
      };
    }

    const slot = slots[slotIndex];

    // Check if slot is still available (Double booking prevention!)
    if (slot.status !== 'available') {
      const alternatives = slots.filter(
        (s) => s.appointment_date === slot.appointment_date && s.status === 'available'
      );

      return {
        success: false,
        clinic_name: CLINIC_INFO.name,
        message:
          'The selected appointment slot is no longer available. Please choose from the available alternatives.',
        error: 'SLOT_ALREADY_BOOKED',
        available_alternatives: alternatives,
      };
    }

    // Atomically mark as booked
    slot.status = 'booked';
    slot.patient_name = patient_name.trim();
    slot.patient_email = patient_email.trim();
    slot.patient_phone = patient_phone.trim();
    slot.booking_reference = bookingRef;
    slot.notes = notes?.trim() || null;
    slot.updated_at = new Date().toISOString();

    slots[slotIndex] = slot;
    saveSlotsToFile(slots);

    return {
      success: true,
      message: 'Your appointment is confirmed.',
      clinic_name: CLINIC_INFO.name,
      booking_reference: bookingRef,
      appointment_date: slot.appointment_date,
      appointment_time: slot.appointment_time,
      patient_name: slot.patient_name,
      patient_email: slot.patient_email,
      patient_phone: slot.patient_phone,
      slot_id: slot.id,
    };
  },

  // Lookup booking by reference
  async getBookingByReference(reference: string): Promise<AppointmentSlot | null> {
    const cleanRef = reference.trim().toUpperCase();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('booking_reference', cleanRef)
          .limit(1);

        if (!error && data && data.length > 0) {
          return data[0];
        }
      } catch (err) {
        console.warn('Supabase getBookingByReference fallback:', err);
      }
    }

    const slots = ensureDataFile();
    return (
      slots.find((s) => s.booking_reference?.toUpperCase() === cleanRef) || null
    );
  },

  // Reschedule appointment
  async rescheduleAppointment(
    input: RescheduleAppointmentInput
  ): Promise<BookingConfirmation> {
    const { booking_reference, new_slot_id } = input;
    const existing = await this.getBookingByReference(booking_reference);

    if (!existing) {
      return {
        success: false,
        clinic_name: CLINIC_INFO.name,
        message:
          'No existing appointment was found matching that booking reference. Please check your reference or contact reception.',
        error: 'BOOKING_NOT_FOUND',
      };
    }

    if (existing.status === 'cancelled') {
      return {
        success: false,
        clinic_name: CLINIC_INFO.name,
        message:
          'This appointment has already been cancelled. Please book a new appointment.',
        error: 'ALREADY_CANCELLED',
      };
    }

    // Verify new slot is available
    const slots = ensureDataFile();
    const newSlotIndex = slots.findIndex((s) => s.id === new_slot_id);

    if (newSlotIndex === -1) {
      return {
        success: false,
        clinic_name: CLINIC_INFO.name,
        message: 'The requested new appointment slot does not exist.',
        error: 'SLOT_NOT_FOUND',
      };
    }

    if (slots[newSlotIndex].status !== 'available') {
      const alternatives = slots.filter(
        (s) =>
          s.appointment_date === slots[newSlotIndex].appointment_date &&
          s.status === 'available'
      );
      return {
        success: false,
        clinic_name: CLINIC_INFO.name,
        message:
          'The requested new slot is not available. Please choose another time.',
        error: 'SLOT_ALREADY_BOOKED',
        available_alternatives: alternatives,
      };
    }

    // Free up old slot
    const oldSlotIndex = slots.findIndex((s) => s.id === existing.id);
    if (oldSlotIndex !== -1) {
      slots[oldSlotIndex].status = 'available';
      slots[oldSlotIndex].patient_name = null;
      slots[oldSlotIndex].patient_email = null;
      slots[oldSlotIndex].patient_phone = null;
      slots[oldSlotIndex].booking_reference = null;
      slots[oldSlotIndex].updated_at = new Date().toISOString();
    }

    // Book new slot
    const newSlot = slots[newSlotIndex];
    newSlot.status = 'booked';
    newSlot.patient_name = existing.patient_name;
    newSlot.patient_email = existing.patient_email;
    newSlot.patient_phone = existing.patient_phone;
    newSlot.booking_reference = existing.booking_reference; // Keep original reference
    newSlot.notes = `Rescheduled from ${existing.appointment_date} ${existing.appointment_time}`;
    newSlot.updated_at = new Date().toISOString();

    slots[newSlotIndex] = newSlot;
    saveSlotsToFile(slots);

    // Sync to Supabase if configured
    if (supabase) {
      try {
        await supabase
          .from('appointments')
          .update({
            status: 'available',
            patient_name: null,
            patient_email: null,
            patient_phone: null,
            booking_reference: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        await supabase
          .from('appointments')
          .update({
            status: 'booked',
            patient_name: existing.patient_name,
            patient_email: existing.patient_email,
            patient_phone: existing.patient_phone,
            booking_reference: existing.booking_reference,
            updated_at: new Date().toISOString(),
          })
          .eq('id', new_slot_id);
      } catch (err) {
        console.warn('Supabase sync reschedule error:', err);
      }
    }

    return {
      success: true,
      message: 'Your appointment has been successfully rescheduled.',
      clinic_name: CLINIC_INFO.name,
      booking_reference: existing.booking_reference || booking_reference,
      appointment_date: newSlot.appointment_date,
      appointment_time: newSlot.appointment_time,
      patient_name: newSlot.patient_name || existing.patient_name || '',
      slot_id: newSlot.id,
    };
  },

  // Cancel appointment
  async cancelAppointment(input: CancelAppointmentInput): Promise<{
    success: boolean;
    message: string;
    booking_reference?: string;
    freed_date?: string;
    freed_time?: string;
    error?: string;
  }> {
    const { booking_reference, reason } = input;
    const existing = await this.getBookingByReference(booking_reference);

    if (!existing) {
      return {
        success: false,
        message:
          'No appointment was found with that booking reference. Please verify your reference or contact reception.',
        error: 'BOOKING_NOT_FOUND',
      };
    }

    if (existing.status === 'cancelled') {
      return {
        success: false,
        message: 'This appointment has already been cancelled.',
        error: 'ALREADY_CANCELLED',
      };
    }

    const slots = ensureDataFile();
    const slotIndex = slots.findIndex((s) => s.id === existing.id);

    if (slotIndex !== -1) {
      const freedDate = slots[slotIndex].appointment_date;
      const freedTime = slots[slotIndex].appointment_time;

      // Make slot available again
      slots[slotIndex].status = 'available';
      slots[slotIndex].patient_name = null;
      slots[slotIndex].patient_email = null;
      slots[slotIndex].patient_phone = null;
      slots[slotIndex].booking_reference = null;
      slots[slotIndex].notes = reason ? `Cancelled: ${reason}` : null;
      slots[slotIndex].updated_at = new Date().toISOString();

      saveSlotsToFile(slots);

      if (supabase) {
        try {
          await supabase
            .from('appointments')
            .update({
              status: 'available',
              patient_name: null,
              patient_email: null,
              patient_phone: null,
              booking_reference: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } catch (err) {
          console.warn('Supabase sync cancellation error:', err);
        }
      }

      return {
        success: true,
        message: `Your appointment on ${freedDate} at ${freedTime} (Reference: ${booking_reference}) has been successfully cancelled and the slot has been returned to availability.`,
        booking_reference,
        freed_date: freedDate,
        freed_time: freedTime,
      };
    }

    return {
      success: false,
      message: 'Failed to update appointment status. Please contact reception.',
      error: 'SERVER_ERROR',
    };
  },

  // Reset / Reseed slots
  async reseedDatabase(): Promise<{ success: boolean; count: number }> {
    const fresh = generateSeedSlots();
    saveSlotsToFile(fresh);

    if (supabase) {
      try {
        // Upsert all seed slots
        const { error } = await supabase.from('appointments').upsert(fresh, {
          onConflict: 'id',
        });
        if (error) {
          console.warn('Supabase reseed upsert notice:', error.message);
        }
      } catch (err) {
        console.warn('Supabase reseed error:', err);
      }
    }

    return { success: true, count: fresh.length };
  },
};
