'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Dashboard from '../Components/Login&Dashboard/Dashboard';
import { useDemoState } from '../Components/DemoStateContext';
import type { Mood } from '../Components/AfterLogin/CheckinData';

function DashboardEntry() {
  const searchParams = useSearchParams();
  const { userId, setUser, setCheckin } = useDemoState();
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;

    const urlUser = searchParams.get('user');
    if (urlUser && urlUser !== userId) {
      setUser(urlUser);
    }

    const moodParam = searchParams.get('mood');
    const energyParam = searchParams.get('energy');
    const mood: Mood | null = moodParam === 'positive' || moodParam === 'neutral' || moodParam === 'negative' ? moodParam : null;
    if (mood && energyParam) {
      setCheckin(mood, Math.min(100, Math.max(0, Number(energyParam))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Dashboard />;
}

export default function DashboardRoute() {
  return (
    <Suspense fallback={null}>
      <DashboardEntry />
    </Suspense>
  );
}
