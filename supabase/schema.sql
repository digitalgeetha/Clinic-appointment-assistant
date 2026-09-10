-- Supabase PostgreSQL Schema for Harbor Dental Care
-- Clinic Appointment Assistant

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'cancelled')),
    patient_name VARCHAR(150),
    patient_email VARCHAR(150),
    patient_phone VARCHAR(50),
    booking_reference VARCHAR(50) UNIQUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint to prevent duplicate slots for the same date and time
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_date_time ON public.appointments(appointment_date, appointment_time);

-- Index for fast retrieval of available slots by date
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments(appointment_date, status);

-- Index for booking reference lookups
CREATE INDEX IF NOT EXISTS idx_appointments_reference ON public.appointments(booking_reference);

-- Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access for available appointments
CREATE POLICY "Allow public read for available appointments"
    ON public.appointments
    FOR SELECT
    USING (status = 'available' OR booking_reference IS NOT NULL);

-- Allow service role full access
CREATE POLICY "Allow service role full access"
    ON public.appointments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_appointments_updated_at ON public.appointments;
CREATE TRIGGER set_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
