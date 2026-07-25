'use client';

import PageShell from '../Components/PageShell';
import SmartCalendarView from '../Components/SmartCalendar/SmartCalendarView';
import AIScheduler from '../Components/SmartCalendar/AIScheduler';
import { useDemoState } from '../Components/DemoStateContext';

export default function SmartCalendarPage() {
  const { currentUser, calendarEntries, addCalendarEntry } = useDemoState();
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const calendarEvents = calendarEntries.map((entry, index) => ({
    id: `planned-session-${index}-${entry.start}`,
    title: entry.title,
    date,
    startTime: entry.start,
    endTime: entry.end,
    color: entry.type === 'match' ? '#D4FF3E' : undefined,
  }));

  return (
    <PageShell
      eyebrow="Feature · Smart Calendar"
      title="Smart Calendar"
      description="Plan training, mobility, and recovery around the real free time in your schedule."
      contentMaxWidth="1440px"
      backgroundImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=80"
    >
      <SmartCalendarView events={calendarEvents} />
      <AIScheduler onAddEntry={addCalendarEntry} friendName={currentUser.recommendation.friendName} />
    </PageShell>
  );
}
