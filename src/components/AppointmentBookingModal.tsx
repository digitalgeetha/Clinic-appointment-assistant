import React, { useState } from 'react';
import { X, Calendar, Clock, User, Mail, Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AppointmentSlot, BookingConfirmation } from '../types';
import { BookingConfirmationCard } from './BookingConfirmationCard';

interface AppointmentBookingModalProps {
  slot: AppointmentSlot | null;
  onClose: () => void;
  onBookingSuccess: (confirmation: BookingConfirmation) => void;
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  slot,
  onClose,
  onBookingSuccess,
}) => {
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  if (!slot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientEmail.trim() || !patientPhone.trim()) {
      setError('Please provide your name, email, and phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: slot.id,
          date: slot.appointment_date,
          time: slot.appointment_time,
          patient_name: patientName.trim(),
          patient_email: patientEmail.trim(),
          patient_phone: patientPhone.trim(),
          notes: notes.trim(),
        }),
      });

      const data: BookingConfirmation = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'The selected slot could not be booked.');
        if (data.available_alternatives) {
          setConfirmation(data);
        }
      } else {
        setConfirmation(data);
        onBookingSuccess(data);
      }
    } catch (err: any) {
      setError(err.message || 'A network error occurred while confirming booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {confirmation?.success ? 'Appointment Confirmed' : 'Book Appointment Slot'}
            </h3>
            <p className="text-xs text-slate-500">Harbor Dental Care, Dubai</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {confirmation?.success ? (
            <div className="space-y-4">
              <BookingConfirmationCard confirmation={confirmation} />
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Close & Return to Chat
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selected Slot Information */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold">{slot.appointment_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold">{slot.appointment_time}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Inputs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. john.doe@example.com"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +971 50 123 4567"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Routine dental consultation"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming with Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Booking</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-400">
                Persistent database check: The slot will be atomically locked to prevent double-booking.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
