'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MoodCheckIn from '../../Components/AfterLogin/MoodCheckIn';
import type { Mood } from '../../Components/AfterLogin/CheckinData';
import { createSupabaseBrowserClient } from '../../../lib/supabase/client';

function MoodCheckInContent() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [userName, setUserName] = useState('Athlete');

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

  const handleContinue = () => {
    if (!selectedMood) return;
    router.push(`/checkin/energy?mood=${selectedMood}`);
  };

  const handleBack = () => {
    router.push(`/login`);
  };

  return (
    <MoodCheckIn
      userName={userName}
      selectedMood={selectedMood}
      onSelectMood={setSelectedMood}
      onContinue={handleContinue}
      onBack={handleBack}
    />
  );
}

export default function MoodCheckInRoute() {
  return (
    <Suspense fallback={null}>
      <MoodCheckInContent />
    </Suspense>
  );
}
