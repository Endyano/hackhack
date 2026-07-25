'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EnergyCheckIn from '../../Components/AfterLogin/EnergyCheckIn';
import type { Mood } from '../../Components/AfterLogin/CheckinData';
import { createSupabaseBrowserClient } from '../../../lib/supabase/client';
import { saveDailyCheckin } from '../../../lib/checkins';

function EnergyCheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moodParam = searchParams.get('mood');
  const mood: Mood = moodParam === 'positive' || moodParam === 'negative' ? moodParam : 'neutral';
  const [energy, setEnergy] = useState(50);
  const [userName, setUserName] = useState('Athlete');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const supabase = createSupabaseBrowserClient();
      void supabase.auth.getUser().then(({ data }) => {
        if (!data.user) {
          router.replace('/login');
          return;
        }

        setUserName(data.user.user_metadata.full_name ?? data.user.email?.split('@')[0] ?? 'Athlete');
      });
    } catch {
      router.replace('/login');
    }
  }, [router]);

  const handleContinue = async () => {
    setError('');
    setIsSaving(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      await saveDailyCheckin(session.access_token, { bodyStatus: mood, readiness: energy });
      router.push(`/dashboard?mood=${mood}&energy=${energy}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save your check-in. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/checkin/mood');
  };

  return (
    <EnergyCheckIn
      userName={userName}
      energy={energy}
      onEnergyChange={setEnergy}
      onContinue={handleContinue}
      onBack={handleBack}
      isSaving={isSaving}
      error={error}
    />
  );
}

export default function EnergyCheckInRoute() {
  return (
    <Suspense fallback={null}>
      <EnergyCheckInContent />
    </Suspense>
  );
}
