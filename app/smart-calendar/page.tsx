'use client';

import { useEffect, useState } from 'react';
import PageShell from '../Components/PageShell';
import SmartCalendarView, { type CalendarEvent } from '../Components/SmartCalendar/SmartCalendarView';
import AIScheduler, { type ParsedCalendarEntry } from '../Components/SmartCalendar/AIScheduler';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import { clearCalendarEvents, createCalendarEvent, getCalendarEvents } from '../../lib/calendar-events';

function toCalendarEvent(event: { id: string; title: string; startAt: string; endAt: string; type: string }): CalendarEvent {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  const time = (value: Date) => `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  return { id: event.id, title: event.title, date, startTime: time(start), endTime: time(end), color: event.type === 'recovery' ? '#60A5FA' : event.type === 'mobility' ? '#A78BFA' : undefined };
}

export default function SmartCalendarPage() {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [focusDate, setFocusDate] = useState<string | null>(null);
  const [newEventIds, setNewEventIds] = useState<string[]>([]);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      const events = await getCalendarEvents(data.session.access_token);
      setCalendarEvents(events.map(toCalendarEvent));
    };
    void loadEvents().catch(() => undefined);
  }, []);

  const addEntry = async (entries: ParsedCalendarEntry[]) => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('Please sign in before adding to your calendar.');
    const saved = await Promise.all(entries.map((entry) => createCalendarEvent(data.session.access_token, entry)));
    setCalendarEvents((current) => [...current, ...saved.map(toCalendarEvent)]);
    setNewEventIds(saved.map((event) => event.id));
    setFocusDate(entries[0]?.date ?? null);
    window.setTimeout(() => setNewEventIds([]), 2200);
  };

  const clearCalendar = async () => {
    if (!window.confirm('Clear every event from your calendar? This cannot be undone.')) return;
    setIsClearing(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error('Please sign in before clearing your calendar.');
      await clearCalendarEvents(data.session.access_token);
      setCalendarEvents([]);
      setNewEventIds([]);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <PageShell
      eyebrow="Feature · Smart Calendar"
      title="Smart Calendar"
      description="Plan training, mobility, and recovery around the real free time in your schedule."
      contentMaxWidth="1440px"
      backgroundImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=80"
    >
      <div className="flex justify-end">
        <button onClick={clearCalendar} disabled={isClearing || calendarEvents.length === 0} className="rounded-full border border-rose-400/40 bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-200 disabled:cursor-not-allowed disabled:opacity-40">
          {isClearing ? 'Clearing…' : 'Clear calendar'}
        </button>
      </div>
      <SmartCalendarView events={calendarEvents} focusDate={focusDate} animatedEventIds={newEventIds} />
      <AIScheduler onAddEntry={addEntry} />
    </PageShell>
  );
}
