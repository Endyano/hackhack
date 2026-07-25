'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageShell from '../Components/PageShell';
import SmartCalendarView, { toDateKey, pad2, type CalendarEvent as ViewCalendarEvent } from '../Components/SmartCalendar/SmartCalendarView';
import AIScheduler from '../Components/SmartCalendar/AIScheduler';
import { useDemoState } from '../Components/DemoStateContext';
import {
  getCalendarEvents,
  getFreeSlots,
  getGoogleConnectionStatus,
  syncGoogleCalendar,
  disconnectGoogleCalendar,
  googleConnectUrl,
  formatLocalTime,
  ApiError,
  type CalendarEventDto,
  type FreeSlotsResponse,
  type GoogleConnectionStatus,
} from '@/lib/api';

const bgDark = '#090C0B';
const accentLime = '#D4FF3E';
const textGray = '#9CA3AF';

function toViewEvents(dtos: CalendarEventDto[]): ViewCalendarEvent[] {
  return dtos.map((event) => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const startKey = toDateKey(start);
    const endKey = toDateKey(end);
    return {
      id: event.id,
      title: event.title,
      date: startKey,
      endDate: endKey !== startKey ? endKey : undefined,
      startTime: `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
      endTime: `${pad2(end.getHours())}:${pad2(end.getMinutes())}`,
      // Google blue, so synced events read as visually distinct from the
      // default mock-event color even before you look at the badge.
      color: event.source === 'google_calendar' ? '#4285F4' : undefined,
    };
  });
}

const pillButtonStyle = (variant: 'primary' | 'ghost' | 'danger', disabled: boolean) => ({
  padding: '11px 20px',
  borderRadius: '100px',
  fontWeight: 800,
  fontSize: '13px',
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.6 : 1,
  border:
    variant === 'primary' ? 'none' : variant === 'danger' ? '1px solid rgba(248, 113, 113, 0.35)' : '1px solid rgba(255,255,255,0.18)',
  background: variant === 'primary' ? accentLime : variant === 'danger' ? 'rgba(248, 113, 113, 0.08)' : 'rgba(255,255,255,0.04)',
  color: variant === 'primary' ? bgDark : variant === 'danger' ? '#fca5a5' : '#e2e8f0',
});

function SmartCalendarContent() {
  const { currentUser, backendUserId, calendarEntries, addCalendarEntry } = useDemoState();
  const searchParams = useSearchParams();

  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [status, setStatus] = useState<GoogleConnectionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEventDto[] | null>(null);
  const [freeSlots, setFreeSlots] = useState<FreeSlotsResponse | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // One-time: surface the OAuth callback redirect's outcome as a banner.
  useEffect(() => {
    const google = searchParams.get('google');
    if (google === 'connected') {
      setBanner({ kind: 'success', text: 'Google Calendar connected -- syncing your events...' });
    } else if (google === 'error') {
      const reason = searchParams.get('reason') ?? 'unknown_error';
      setBanner({ kind: 'error', text: `Couldn't connect Google Calendar (${reason}). Please try again.` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEventsAndFreeSlots = async (userId: string) => {
    setDataError(null);
    try {
      const [eventsResult, freeSlotsResult] = await Promise.all([getCalendarEvents(userId), getFreeSlots(userId)]);
      setEvents(eventsResult);
      setFreeSlots(freeSlotsResult);
    } catch (err) {
      // A real sync/fetch error must be shown, not silently swallowed into
      // the mock-data fallback -- see the dataError banner below.
      setDataError(err instanceof ApiError ? err.message : 'Could not load your synced calendar.');
      setEvents(null);
      setFreeSlots(null);
    }
  };

  const refreshStatus = async (userId: string) => {
    setStatusLoading(true);
    try {
      const result = await getGoogleConnectionStatus(userId);
      setStatus(result);
      if (result.connected) {
        await loadEventsAndFreeSlots(userId);
      }
    } catch {
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (backendUserId) {
      refreshStatus(backendUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUserId]);

  const handleConnect = () => {
    if (!backendUserId) return;
    // Real browser navigation to Google's consent screen, not a fetch call.
    window.location.href = googleConnectUrl(backendUserId);
  };

  const handleSync = async () => {
    if (!backendUserId) return;
    setSyncing(true);
    setDataError(null);
    try {
      await syncGoogleCalendar(backendUserId);
      await refreshStatus(backendUserId);
      setBanner({ kind: 'success', text: 'Calendar synced.' });
    } catch (err) {
      setDataError(err instanceof ApiError ? err.message : 'Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!backendUserId) return;
    setDisconnecting(true);
    try {
      await disconnectGoogleCalendar(backendUserId);
      setStatus({ connected: false, connected_at: null, last_synced_at: null });
      setEvents(null);
      setFreeSlots(null);
      setDataError(null);
      setBanner(null);
    } finally {
      setDisconnecting(false);
    }
  };

  const connected = status?.connected ?? false;
  // Only treat this as "real data" once events actually loaded without
  // error -- a connected-but-failed-to-fetch state must NOT show as synced.
  const showingRealData = connected && events !== null && !dataError;
  const viewEvents = showingRealData ? toViewEvents(events!) : undefined;

  return (
    <PageShell
      eyebrow="Feature · Smart Calendar"
      title="Smart Calendar"
      description="See today's schedule and free time, then let AI add new activities to your calendar by text or voice."
      contentMaxWidth="1440px"
      backgroundImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=80"
    >
      {/* GOOGLE CALENDAR CONNECT PANEL */}
      <section
        style={{
          borderRadius: '24px',
          padding: '22px 26px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>Google Calendar</p>
          <p style={{ margin: '4px 0 0', color: textGray, fontSize: '13px' }}>
            {statusLoading
              ? 'Checking connection...'
              : connected
                ? `Connected${status?.last_synced_at ? ` · last synced ${formatLocalTime(status.last_synced_at)}` : ''}`
                : "Not connected -- showing sample calendar data below."}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {connected ? (
            <>
              <button onClick={handleSync} disabled={syncing} className="dash-btn" style={pillButtonStyle('ghost', syncing)}>
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <button onClick={handleDisconnect} disabled={disconnecting} className="dash-btn" style={pillButtonStyle('danger', disconnecting)}>
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={!backendUserId || statusLoading}
              className="dash-btn"
              style={pillButtonStyle('primary', !backendUserId || statusLoading)}
            >
              Connect Google Calendar
            </button>
          )}
        </div>
      </section>

      {banner && (
        <p
          style={{
            margin: 0,
            padding: '14px 18px',
            borderRadius: '14px',
            fontSize: '13px',
            fontWeight: 700,
            color: banner.kind === 'success' ? accentLime : '#fca5a5',
            background: banner.kind === 'success' ? 'rgba(212,255,62,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${banner.kind === 'success' ? 'rgba(212,255,62,0.3)' : 'rgba(248,113,113,0.3)'}`,
          }}
        >
          {banner.text}
        </p>
      )}

      {connected && dataError && (
        <p style={{ margin: 0, color: '#fca5a5', fontSize: '13px', fontWeight: 700 }}>⚠ {dataError}</p>
      )}

      <SmartCalendarView events={viewEvents} usingMockData={!showingRealData} />

      {showingRealData && freeSlots && (
        <section
          style={{
            padding: '22px 26px',
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <p style={{ margin: 0, color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Free time today
          </p>
          {freeSlots.free_slots.length === 0 ? (
            <p style={{ margin: '10px 0 0', color: textGray, fontSize: '14px' }}>No free time detected today.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
              {freeSlots.free_slots.map((slot, index) => (
                <span
                  key={`${slot.start_time}-${index}`}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '100px',
                    background: 'rgba(212, 255, 62, 0.1)',
                    border: '1px solid rgba(212, 255, 62, 0.3)',
                    color: accentLime,
                    fontSize: '13px',
                    fontWeight: 800,
                  }}
                >
                  {formatLocalTime(slot.start_time)}–{formatLocalTime(slot.end_time)} · {slot.duration_minutes} min
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      <AIScheduler calendarEntries={calendarEntries} onAddEntry={addCalendarEntry} friendName={currentUser.recommendation.friendName} />
    </PageShell>
  );
}

export default function SmartCalendarPage() {
  return (
    <Suspense fallback={null}>
      <SmartCalendarContent />
    </Suspense>
  );
}
