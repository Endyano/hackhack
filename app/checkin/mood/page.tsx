'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MoodCheckIn from '../../Components/AfterLogin/MoodCheckIn';
import type { Mood } from '../../Components/AfterLogin/CheckinData';
import { demoUsers } from '../../Components/DemoData';

function MoodCheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Any logged-in username is valid (not just the two hand-authored demo
  // personas) -- CareMatch and the rest of the backend resolve identity by
  // this raw username. Only the greeting/cosmetic name falls back to Eric's.
  const userId = searchParams.get('user')?.trim() || 'eric';
  const userName = demoUsers.find((user) => user.id === userId)?.name ?? userId;

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
