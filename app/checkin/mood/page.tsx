'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MoodCheckIn from '../../Components/AfterLogin/MoodCheckIn';
import type { Mood } from '../../Components/AfterLogin/CheckinData';
import { demoUsers } from '../../Components/DemoData';

function MoodCheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('user') === 'daniel' ? 'daniel' : 'eric';
  const userName = (demoUsers.find((user) => user.id === userId) ?? demoUsers[0]).name;

  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  const handleContinue = () => {
    if (!selectedMood) return;
    router.push(`/checkin/energy?user=${userId}&mood=${selectedMood}`);
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
