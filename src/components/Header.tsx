import React from 'react';
import { ShieldAlert, Clock, MapPin, Database, CalendarCheck2, BookmarkCheck, CheckCircle2 } from 'lucide-react';
import { DatabaseStatus } from '../types';

interface HeaderProps {
  dbStatus: DatabaseStatus | null;
  onOpenScheduler: () => void;
  onOpenManager: () => void;
  onOpenReviewerPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dbStatus,
  onOpenScheduler,
  onOpenManager,
  onOpenReviewerPanel,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Required Visible Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-200/70 px-4 py-2 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs font-semibold text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Administrative information only. This assistant does not provide medical advice.</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Clinic Brand & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0 tracking-tight">
              HDC
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Harbor Dental Care
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                  <CheckCircle2 className="w-3 h-3 text-teal-600" />
                  Official Practice Assistant
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Appointment & Clinic Information Assistant
              </p>
            </div>
          </div>

          {/* Quick Clinic Info Badges & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>123 Marina Medical Centre, Dubai</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Mon-Fri 8am-7pm | Sat 9am-2pm</span>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 ml-auto md:ml-0">
              <button
                id="btn-open-scheduler"
                onClick={onOpenScheduler}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium border border-teal-200 transition-colors cursor-pointer"
                title="View database appointment availability"
              >
                <CalendarCheck2 className="w-3.5 h-3.5 text-teal-600" />
                <span>View Slots</span>
              </button>

              <button
                id="btn-manage-booking"
                onClick={onOpenManager}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-300 transition-colors cursor-pointer"
                title="Reschedule or cancel existing booking"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Manage Booking</span>
              </button>

              <button
                id="btn-reviewer-panel"
                onClick={onOpenReviewerPanel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium border border-indigo-200 transition-colors cursor-pointer"
                title="Assessment verification suite for test criteria"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>Reviewer Tests (18)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
