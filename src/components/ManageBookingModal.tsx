import React, { useState } from 'react';
import { X, Search, Calendar, Clock, User, AlertCircle, CheckCircle2, RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import { AppointmentSlot } from '../types';

interface ManageBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingChanged: () => void;
}

export const ManageBookingModal: React.FC<ManageBookingModalProps> = ({
  isOpen,
  onClose,
  onBookingChanged,
}) => {
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<AppointmentSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('2026-09-10');
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  if (!isOpen) return null;

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reference.trim()) {
      setError('Please enter your booking reference.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setBooking(null);

    try {
      const res = await fetch(`/api/appointments/booking/${encodeURIComponent(reference.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'No booking found with that reference.');
      } else {
        setBooking(data.booking);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to lookup booking.');
    } finally {
      setLoading(false);
    }
  };

  const loadSlotsForDate = async (date: string) => {
    setNewDate(date);
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/appointments/available?date=${date}`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleStartReschedule = () => {
    setIsRescheduling(true);
    loadSlotsForDate(newDate);
  };

  const handleConfirmReschedule = async (newSlotId: string) => {
    if (!booking?.booking_reference) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/appointments/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_reference: booking.booking_reference,
          new_slot_id: newSlotId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Rescheduling failed.');
      } else {
        setSuccessMessage(
          `Appointment successfully rescheduled to ${data.appointment_date} at ${data.appointment_time}!`
        );
        setIsRescheduling(false);
        // Refresh booking details
        handleLookup();
        onBookingChanged();
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while rescheduling.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking?.booking_reference) return;
    if (!confirm('Are you sure you want to cancel this appointment? The slot will be returned to availability.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_reference: booking.booking_reference,
          reason: 'Patient requested cancellation',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Cancellation failed.');
      } else {
        setSuccessMessage(data.message || 'Appointment cancelled successfully.');
        setBooking(null);
        onBookingChanged();
      }
    } catch (err: any) {
      setError(err.message || 'Cancellation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Manage Your Appointment</h3>
            <p className="text-xs text-slate-500">Reschedule or cancel your confirmed booking</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {/* Reference Lookup Bar */}
          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. HDC-849201"
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lookup</span>
            </button>
          </form>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Booking Found Details */}
          {booking && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Booking Reference</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{booking.booking_reference}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {booking.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Patient</span>
                  <span className="font-semibold text-slate-900">{booking.patient_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Phone</span>
                  <span className="font-semibold text-slate-900">{booking.patient_phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Date</span>
                  <span className="font-semibold text-slate-900">{booking.appointment_date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Time</span>
                  <span className="font-semibold text-slate-900">{booking.appointment_time}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {!isRescheduling && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={handleStartReschedule}
                    className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reschedule Slot</span>
                  </button>
                  <button
                    onClick={handleCancelBooking}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cancel Appointment</span>
                  </button>
                </div>
              )}

              {/* Rescheduling Mode */}
              {isRescheduling && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Select New Date & Slot:</span>
                    <button
                      onClick={() => setIsRescheduling(false)}
                      className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                    >
                      Cancel Rescheduling
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-14'].map((d) => (
                      <button
                        key={d}
                        onClick={() => loadSlotsForDate(d)}
                        className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer ${
                          newDate === d
                            ? 'bg-teal-600 text-white border-teal-600 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d.slice(5)}
                      </button>
                    ))}
                  </div>

                  {loadingSlots ? (
                    <p className="text-xs text-slate-400 py-2">Loading available slots...</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No available slots for this date.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleConfirmReschedule(s.id)}
                          className="p-2 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-400 text-xs font-semibold text-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          {s.appointment_time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="text-[11px] text-slate-500 p-3 bg-slate-50 rounded-xl">
            <span className="font-semibold block text-slate-700">Reception Assistance</span>
            Harbor Dental Care's reception handles cancellations and rescheduling directly during opening hours (Mon-Fri 8am-7pm, Sat 9am-2pm).
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
