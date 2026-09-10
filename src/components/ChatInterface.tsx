import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Clock,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';
import { ChatMessage, AppointmentSlot, BookingConfirmation } from '../types';
import { BookingConfirmationCard } from './BookingConfirmationCard';

interface ChatInterfaceProps {
  onSelectSlotToBook: (slot: AppointmentSlot) => void;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
}

const STARTER_PROMPTS = [
  'What are your opening hours?',
  'What should I bring?',
  'Do I need to fast?',
  'Check appointment availability',
  'I need to reschedule',
  'Where is the clinic?',
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSelectSlotToBook,
  externalPrompt,
  onClearExternalPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content:
        'Hello! Welcome to Harbor Dental Care. I am your administrative and appointment scheduling assistant. I can help you check appointment availability, book or reschedule dental appointments, review opening hours, and answer visit preparation questions.\n\n*Note: I provide administrative assistance only and do not provide medical or clinical advice.* How may I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle external prompt trigger from reviewer panel or starter chips
  useEffect(() => {
    if (externalPrompt) {
      sendMessage(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputValue('');
    setLoading(true);

    try {
      // Map history for server endpoint
      const payload = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'I am here to assist with Harbor Dental Care.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        slots: data.slots,
        bookingConfirmation: data.bookingConfirmation,
        isEmergency: data.isEmergency,
        isClinicalBoundary: data.isClinicalBoundary,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content:
          'I apologize for the delay. We are currently experiencing a brief connection issue. Please feel free to retry or contact reception directly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: `msg_welcome_${Date.now()}`,
        role: 'assistant',
        content:
          'Hello! Welcome to Harbor Dental Care. I am your administrative and appointment scheduling assistant. I can help you check appointment availability, book or reschedule dental appointments, review opening hours, and answer visit preparation questions.\n\n*Note: I provide administrative assistance only and do not provide medical or clinical advice.* How may I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Chat Top Bar */}
      <div className="bg-white px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Harbor Dental Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-[11px] text-slate-500">Live AI Assistant & Booking System</p>
          </div>
        </div>

        <button
          id="btn-reset-chat"
          onClick={handleResetConversation}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          title="Start a new conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.isEmergency
                      ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-300'
                      : 'bg-teal-600 text-white shadow-2xs'
                  }`}
                >
                  {msg.isEmergency ? <ShieldAlert className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[75%] rounded-2xl p-4 shadow-2xs text-sm leading-relaxed ${
                  isUser
                    ? 'bg-teal-600 text-white rounded-tr-xs'
                    : msg.isEmergency
                    ? 'bg-rose-50 border-2 border-rose-300 text-rose-950 rounded-tl-xs'
                    : msg.isClinicalBoundary
                    ? 'bg-amber-50/80 border border-amber-200 text-amber-950 rounded-tl-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                }`}
              >
                {/* Emergency Alert Badge */}
                {msg.isEmergency && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 mb-2 pb-2 border-b border-rose-200 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Immediate Urgent Medical Care Priority</span>
                  </div>
                )}

                {/* Message Content */}
                <div className="whitespace-pre-line break-words text-[13.5px]">
                  {msg.content}
                </div>

                {/* Interactive Slot Buttons if slots were returned */}
                {msg.slots && msg.slots.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-teal-600" />
                      <span>Select an appointment slot to book now:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.slots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => onSelectSlotToBook(slot)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-600 text-teal-800 hover:text-white font-medium text-xs rounded-xl border border-teal-200 hover:border-teal-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
                        >
                          <Clock className="w-3 h-3 text-teal-600 group-hover:text-white" />
                          <span>{slot.appointment_time}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking Confirmation Card if present */}
                {msg.bookingConfirmation && (
                  <BookingConfirmationCard confirmation={msg.bookingConfirmation} />
                )}

                <div
                  className={`text-[10px] mt-1.5 text-right ${
                    isUser ? 'text-teal-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-2xs flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span>Checking database & clinic policies...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts */}
      <div className="px-4 py-2 bg-white/70 border-t border-slate-200 overflow-x-auto">
        <div className="flex items-center gap-1.5 max-w-full">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Try:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto py-1">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="px-2.5 py-1 text-xs whitespace-nowrap bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(inputValue);
          }}
          className="flex items-center gap-2"
        >
          <input
            id="input-chat-message"
            type="text"
            placeholder="Ask about opening hours, what to bring, or book appointments..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all disabled:opacity-60"
          />
          <button
            id="btn-send-message"
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="w-11 h-11 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
