import React, { useState, useEffect } from 'react';
import { Calendar, Clock, RefreshCw, CheckCircle2, AlertCircle, Sparkles, X, ChevronRight } from 'lucide-react';
import { AppointmentSlot, BookingConfirmation } from '../types';

interface AppointmentSchedulerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSlot: (slot: AppointmentSlot) => void;
  refreshTrigger?: number;
}

export const AppointmentSchedulerPanel: React.FC<AppointmentSchedulerPanelProps> = ({
  isOpen,
  onClose,
  onSelectSlot,
  refreshTrigger,
}) => {
  // Reference date: 2026-09-09
  const [selectedDate, setSelectedDate] = useState('2026-09-10');
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available upcoming dates
  const availableDates = [
    { date: '2026-09-09', label: 'Today', day: 'Wednesday', hours: '8:00 AM - 7:00 PM' },
    { date: '2026-09-10', label: 'Tomorrow', day: 'Thursday', hours: '8:00 AM - 7:00 PM' },
    { date: '2026-09-11', label: 'Sep 11', day: 'Friday', hours: '8:00 AM - 7:00 PM' },
    { date: '2026-09-12', label: 'Sep 12', day: 'Saturday', hours: '9:00 AM - 2:00 PM' },
    { date: '2026-09-13', label: 'Sep 13', day: 'Sunday', hours: 'Closed', isClosed: true },
    { date: '2026-09-14', label: 'Sep 14', day: 'Monday', hours: '8:00 AM - 7:00 PM' },
    { date: '2026-09-15', label: 'Sep 15', day: 'Tuesday', hours: '8:00 AM - 7:00 PM' },
  ];

  const fetchSlotsForDate = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/appointments/available?date=${date}`);
      if (!response.ok) {
        throw new Error('Failed to retrieve available slots');
      }
      const data = await response.json();
      setSlots(data.slots || []);
    } catch (err: any) {
      setError(err.message || 'Error loading slots from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSlotsForDate(selectedDate);
    }
  }, [isOpen, selectedDate, refreshTrigger]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Clinic Appointment Availability
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-800">
                Live Supabase / DB Source of Truth
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Harbor Dental Care • Select an available slot to book directly
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Date Picker Bar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Appointment Date:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {availableDates.map((item) => {
                const isSelected = selectedDate === item.date;
                return (
                  <button
                    key={item.date}
                    disabled={item.isClosed}
                    onClick={() => setSelectedDate(item.date)}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                      item.isClosed
                        ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed text-slate-400'
                        : isSelected
                        ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 hover:border-teal-300 text-slate-800'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold opacity-80">{item.day.slice(0, 3)}</div>
                    <div className="text-xs font-bold my-0.5">{item.label}</div>
                    <div className="text-[9px] opacity-75 truncate">{item.isClosed ? 'Closed' : item.hours.split(' ')[0]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots View */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-900">
                  Available Slots for {selectedDate}:
                </span>
              </div>
              <button
                onClick={() => fetchSlotsForDate(selectedDate)}
                className="text-xs text-teal-700 hover:text-teal-900 flex items-center gap-1 font-medium cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh from DB</span>
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
                Querying database for available slots...
              </div>
            ) : error ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
                No available appointment slots found for this date. The clinic may be closed or fully booked.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => {
                      onSelectSlot(slot);
                      onClose();
                    }}
                    className="p-2.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-400 rounded-xl text-center transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 group-hover:text-teal-700">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{slot.appointment_time}</span>
                    </div>
                    <span className="inline-block mt-1 text-[10px] text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      Available
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Double-Booking Protection Active</span>
              <p className="text-[11px] text-blue-800 mt-0.5">
                All bookings are atomic. Clicking a slot prompts your details and confirms the booking directly in the persistent database.
              </p>
            </div>
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
