import React from 'react';
import { CheckCircle2, Calendar, Clock, User, Hash, AlertCircle, RefreshCw } from 'lucide-react';
import { BookingConfirmation, AppointmentSlot } from '../types';

interface BookingConfirmationCardProps {
  confirmation: BookingConfirmation;
  onSelectAlternative?: (slot: AppointmentSlot) => void;
}

export const BookingConfirmationCard: React.FC<BookingConfirmationCardProps> = ({
  confirmation,
  onSelectAlternative,
}) => {
  if (!confirmation.success) {
    return (
      <div className="mt-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 shadow-xs">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="font-semibold text-sm">Booking Not Completed</h4>
            <p className="text-xs text-rose-800">{confirmation.message}</p>
            {confirmation.available_alternatives &&
              confirmation.available_alternatives.length > 0 && (
                <div className="mt-3 pt-2 border-t border-rose-200">
                  <p className="text-xs font-semibold text-rose-900 mb-2">
                    Available alternative times from our database:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {confirmation.available_alternatives.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => onSelectAlternative && onSelectAlternative(slot)}
                        className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-md transition-colors cursor-pointer"
                      >
                        {slot.appointment_time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2.5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Verified Database Booking
            </span>
            <h3 className="text-base font-bold text-emerald-900">
              Your appointment is confirmed.
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/80 p-3 rounded-lg border border-emerald-200/80">
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Booking Reference</span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {confirmation.booking_reference}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Date</span>
                <span className="font-semibold text-slate-900">
                  {confirmation.appointment_date}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Time</span>
                <span className="font-semibold text-slate-900">
                  {confirmation.appointment_time}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Patient Name</span>
                <span className="font-semibold text-slate-900">
                  {confirmation.patient_name}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-emerald-800 flex items-center justify-between pt-1">
            <span>Clinic: <strong className="font-semibold">{confirmation.clinic_name}</strong></span>
            <span className="text-slate-500">Please bring valid ID</span>
          </div>
        </div>
      </div>
    </div>
  );
};
