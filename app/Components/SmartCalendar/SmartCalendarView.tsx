'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * CalendarEvent
 *
 * Shaped to be a drop-in target for a parsed Google Calendar API `Event` resource:
 *   - id          <- event.id
 *   - title       <- event.summary
 *   - date        <- event.start.date (all-day) or event.start.dateTime (date portion)
 *   - endDate     <- event.end.date / event.end.dateTime date portion (multi-day events)
 *   - startTime   <- event.start.dateTime (time portion, 24h "HH:mm")
 *   - endTime     <- event.end.dateTime (time portion, 24h "HH:mm")
 *   - color       <- resolved from event.colorId
 *   - allDay      <- true when start/end only carry `date`, no `dateTime`
 */
export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD' — set for multi-day events, omit for single-day
  startTime: string; // 'HH:mm' (24h)
  endTime: string; // 'HH:mm' (24h)
  color?: string; // hex, defaults to the macOS "Home" brown/orange
  allDay?: boolean;
}

type SmartCalendarViewProps = {
  events?: CalendarEvent[];
  focusDate?: string | null;
  animatedEventIds?: string[];
};

const DEFAULT_EVENT_COLOR = '#8B5E34';
const TODAY_RED = '#FF3B30';
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

function getEventsForDate(date: Date, events: CalendarEvent[]): CalendarEvent[] {
  const key = toDateKey(date);
  return events
    .filter((e) => key >= e.date && key <= (e.endDate ?? e.date))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function offsetDateKey(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'evt-1', title: 'Team Sync', date: offsetDateKey(0), startTime: '09:00', endTime: '09:30' },
  { id: 'evt-2', title: 'Easy Run', date: offsetDateKey(0), startTime: '16:30', endTime: '17:00' },
  { id: 'evt-3', title: 'Dentist Appointment', date: offsetDateKey(-2), startTime: '11:00', endTime: '11:45' },
  { id: 'evt-4', title: 'Hackathon Sprint', date: offsetDateKey(1), endDate: offsetDateKey(3), startTime: '10:00', endTime: '18:00' },
  { id: 'evt-5', title: 'Grocery Run', date: offsetDateKey(4), startTime: '18:00', endTime: '18:30' },
  { id: 'evt-6', title: 'Study Group', date: offsetDateKey(-1), startTime: '14:00', endTime: '15:30' },
  { id: 'evt-7', title: 'CareMatch w/ Daniel', date: offsetDateKey(-1), startTime: '16:30', endTime: '17:30' },
  { id: 'evt-8', title: 'Recovery Stretch', date: offsetDateKey(6), startTime: '08:00', endTime: '08:20' },
  { id: 'evt-9', title: 'Design Review', date: offsetDateKey(8), startTime: '13:00', endTime: '14:00' },
];

export default function SmartCalendarView({ events = MOCK_EVENTS, focusDate, animatedEventIds = [] }: SmartCalendarViewProps) {
  const today = useMemo(() => new Date(), []);
  const newlyAddedIds = useMemo(() => new Set(animatedEventIds), [animatedEventIds]);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  useEffect(() => {
    if (!focusDate) return;
    const [year, month] = focusDate.split('-').map(Number);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;
    const id = window.setTimeout(() => setCursor(new Date(year, month - 1, 1)), 0);
    return () => window.clearTimeout(id);
  }, [focusDate]);

  const grid = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  const goPrevMonth = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const goNextMonth = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  const goToday = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1));

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#111113] p-5 sm:p-7 text-white">
      <style>{`
        @keyframes calendarEventWrite {
          0% { opacity: 0; transform: translateY(18px) scale(.88); filter: brightness(1.8); }
          60% { opacity: 1; transform: translateY(-2px) scale(1.03); filter: brightness(1.35); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: brightness(1); }
        }
        @keyframes calendarEventGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,255,62,0); }
          45% { box-shadow: 0 0 0 3px rgba(212,255,62,.38), 0 0 26px rgba(212,255,62,.62); }
        }
        @keyframes calendarCellFlash {
          0% { background-color: rgba(212,255,62,0); }
          35% { background-color: rgba(212,255,62,.1); }
          100% { background-color: rgba(212,255,62,0); }
        }
        .calendar-event-new { animation: calendarEventWrite .52s cubic-bezier(.2,.85,.25,1.2) both, calendarEventGlow 1.6s ease-in-out .35s both; }
        .calendar-cell-new { animation: calendarCellFlash 1.5s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .calendar-event-new, .calendar-cell-new { animation: none; } }
      `}</style>
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {MONTH_LABELS[cursor.getMonth()]} {cursor.getFullYear()}
        </h2>

        <div className="flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <button
            onClick={goPrevMonth}
            aria-label="Previous month"
            className="px-3 py-1.5 text-gray-300 hover:bg-white/10 transition-colors"
          >
            ‹
          </button>
          <button
            onClick={goToday}
            className="px-4 py-1.5 text-sm font-medium text-gray-200 border-x border-white/10 hover:bg-white/10 transition-colors"
          >
            Today
          </button>
          <button
            onClick={goNextMonth}
            aria-label="Next month"
            className="px-3 py-1.5 text-gray-300 hover:bg-white/10 transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      <div className="w-full">
        <div className="w-full min-w-0">
          {/* WEEKDAY LABELS */}
          <div className="grid grid-cols-7">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
                {label}
              </div>
            ))}
          </div>

          {/* GRID */}
          <div className="grid grid-cols-7 gap-0 border-t border-l border-white/10">
            {grid.map((date) => {
              const inCurrentMonth = date.getMonth() === cursor.getMonth();
              const isToday = isSameDay(date, today);
              const dayEvents = getEventsForDate(date, events);
              const hasNewEvent = dayEvents.some((event) => newlyAddedIds.has(event.id));

              return (
                <div
                  key={toDateKey(date)}
                  className={`relative min-h-[160px] border-r border-b border-white/10 p-2 ${hasNewEvent ? 'calendar-cell-new' : ''}`}
                >
                  {/* DATE NUMBER — top right */}
                  <div className="flex justify-end">
                    {isToday ? (
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: TODAY_RED }}
                      >
                        {date.getDate()}
                      </span>
                    ) : (
                      <span className={`text-base font-medium ${inCurrentMonth ? 'text-gray-300' : 'text-gray-600'}`}>
                        {date.getDate()}
                      </span>
                    )}
                  </div>

                  {/* EVENTS */}
                  <div className="mt-2 flex flex-col gap-1.5">
                    {dayEvents.slice(0, 3).map((event) => {
                      const isFirstDay = toDateKey(date) === event.date;
                      return (
                        <div
                          key={`${event.id}-${toDateKey(date)}`}
                          className={`flex min-w-0 flex-col items-start rounded-[4px] px-2 py-1.5 text-[13px] leading-tight text-white ${newlyAddedIds.has(event.id) ? 'calendar-event-new' : ''}`}
                          style={{ backgroundColor: event.color ?? DEFAULT_EVENT_COLOR }}
                          title={`${event.title} · ${event.startTime}–${event.endTime}`}
                        >
                          <span className="w-full break-words font-medium">{isFirstDay ? event.title : `↳ ${event.title}`}</span>
                          {isFirstDay && (
                            <span className="mt-0.5 text-xs opacity-90">{event.startTime.replace(':', '.')}–{event.endTime.replace(':', '.')}</span>
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="px-2 text-xs text-gray-500">+{dayEvents.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
