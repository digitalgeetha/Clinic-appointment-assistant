import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { AppointmentBookingModal } from './components/AppointmentBookingModal';
import { AppointmentSchedulerPanel } from './components/AppointmentSchedulerPanel';
import { ManageBookingModal } from './components/ManageBookingModal';
import { ReviewerVerificationPanel } from './components/ReviewerVerificationPanel';
import { AppointmentSlot, BookingConfirmation, DatabaseStatus } from './types';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  PhoneCall,
  CalendarPlus,
} from 'lucide-react';

export default function App() {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<AppointmentSlot | null>(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isReviewerOpen, setIsReviewerOpen] = useState(false);
  const [activeExternalPrompt, setActiveExternalPrompt] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  // Load database and system status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data.database);
      }
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [refreshKey]);

  const handleBookingCompleted = (confirmation: BookingConfirmation) => {
    setRefreshKey((k) => k + 1);
  };

  const handleTriggerTestPrompt = (promptText: string) => {
    setActiveExternalPrompt(promptText);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Clinic Header with Visible Disclaimer */}
      <Header
        dbStatus={dbStatus}
        onOpenScheduler={() => setIsSchedulerOpen(true)}
        onOpenManager={() => setIsManagerOpen(true)}
        onOpenReviewerPanel={() => setIsReviewerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Left / Center: Interactive Chat Assistant */}
        <div className="flex-1 flex flex-col min-h-[580px] lg:min-h-[680px]">
          <ChatInterface
            onSelectSlotToBook={(slot) => setSelectedSlotForBooking(slot)}
            externalPrompt={activeExternalPrompt}
            onClearExternalPrompt={() => setActiveExternalPrompt(undefined)}
          />
        </div>

        {/* Right: Clinic Quick Guide & Live Booking Widget */}
        <div className="w-full lg:w-80 shrink-0 space-y-5">
          {/* Quick Clinic Facts Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Clinic Information
              </h2>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Approved Data
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">Location</span>
                  <span className="text-slate-600">123 Marina Medical Centre, Dubai, UAE</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">Opening Hours</span>
                  <div className="text-slate-600 space-y-0.5 mt-0.5">
                    <div>Mon – Fri: 8:00 AM – 7:00 PM</div>
                    <div>Saturday: 9:00 AM – 2:00 PM</div>
                    <div className="text-rose-600 font-medium">Sunday: Closed</div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">What to Bring</span>
                  <ul className="text-slate-600 list-disc list-inside space-y-0.5 mt-0.5">
                    <li>Valid government ID</li>
                    <li>Appointment confirmation</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">Routine Fasting</span>
                  <span className="text-slate-600">
                    No fasting required unless specifically instructed otherwise.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsSchedulerOpen(true)}
                className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Browse Available Slots</span>
              </button>
            </div>
          </div>

          {/* Database System & Safety Boundary Notice */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Clinical Safety Guardrails</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              This assistant strictly enforces administrative boundaries. Symptom queries are routed to clinicians; acute emergencies trigger immediate 999/urgent care guidance.
            </p>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Database Slots:</span>
              <span className="font-mono font-bold text-slate-800">
                {dbStatus ? `${dbStatus.availableSlots} available / ${dbStatus.totalSlots} total` : 'Loading...'}
              </span>
            </div>

            <button
              onClick={() => setIsReviewerOpen(true)}
              className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Open Assessment Test Suite</span>
            </button>
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      {selectedSlotForBooking && (
        <AppointmentBookingModal
          slot={selectedSlotForBooking}
          onClose={() => setSelectedSlotForBooking(null)}
          onBookingSuccess={handleBookingCompleted}
        />
      )}

      {/* Appointment Availability Scheduler Panel */}
      <AppointmentSchedulerPanel
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        onSelectSlot={(slot) => setSelectedSlotForBooking(slot)}
        refreshTrigger={refreshKey}
      />

      {/* Manage Booking (Reschedule & Cancel) Modal */}
      <ManageBookingModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        onBookingChanged={() => setRefreshKey((k) => k + 1)}
      />

      {/* Reviewer Verification & Database Inspector Panel */}
      <ReviewerVerificationPanel
        isOpen={isReviewerOpen}
        onClose={() => setIsReviewerOpen(false)}
        onRunTestPrompt={handleTriggerTestPrompt}
        dbStatus={dbStatus}
        onRefreshDb={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
