'use client';

import PageShell from '../Components/PageShell';
import SmartCalendarView from '../Components/SmartCalendar/SmartCalendarView';
import AIScheduler from '../Components/SmartCalendar/AIScheduler';
import { useDemoState } from '../Components/DemoStateContext';

export default function SmartCalendarPage() {
  const { currentUser, calendarEntries, addCalendarEntry } = useDemoState();

  return (
    <PageShell
      eyebrow="Fitur · Smart Calendar"
      title="Smart Calendar"
      description="Lihat jadwal dan waktu luangmu hari ini, lalu biarkan AI menuliskan kegiatan baru ke kalender lewat teks atau suara."
      contentMaxWidth="1440px"
      backgroundImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=80"
    >
      <SmartCalendarView />
      <AIScheduler calendarEntries={calendarEntries} onAddEntry={addCalendarEntry} friendName={currentUser.recommendation.friendName} />
    </PageShell>
  );
}
