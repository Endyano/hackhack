'use client';

import PageShell from '../Components/PageShell';
import CalendarTimeline from '../Components/SmartCalendar/CalendarTimeline';
import AIScheduler from '../Components/SmartCalendar/AIScheduler';
import { useDemoState } from '../Components/DemoStateContext';

export default function SmartCalendarPage() {
  const { calendarEntries, addCalendarEntry } = useDemoState();

  return (
    <PageShell
      eyebrow="Fitur · Smart Calendar"
      title="Smart Calendar"
      description="Lihat jadwal dan waktu luangmu hari ini, lalu biarkan AI menuliskan kegiatan baru ke kalender lewat teks atau suara."
    >
      <CalendarTimeline entries={calendarEntries} />
      <AIScheduler calendarEntries={calendarEntries} onAddEntry={addCalendarEntry} />
    </PageShell>
  );
}
