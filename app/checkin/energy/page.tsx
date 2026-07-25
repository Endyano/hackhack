'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EnergyCheckIn from '../../Components/AfterLogin/EnergyCheckIn';
import { demoUsers } from '../../Components/DemoData';
import { useDemoState } from '../../Components/DemoStateContext';
import type { Mood } from '../../Components/AfterLogin/CheckinData';

function EnergyCheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { submitCheckInAndGenerate } = useDemoState();
  const userId = searchParams.get('user')?.trim() || 'eric';
  const mood: Mood = searchParams.get('mood') === 'positive' || searchParams.get('mood') === 'negative' ? (searchParams.get('mood') as Mood) : 'neutral';
  const userName = demoUsers.find((user) => user.id === userId)?.name ?? userId;

  const [energy, setEnergy] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (submitting) return;
    setSubmitting(true);
    // Sends the check-in to the backend and requests a real Foundry
    // recommendation before landing on the dashboard, so the hero card shows
    // the AI's actual response instead of a hardcoded one.
    await submitCheckInAndGenerate(userId, mood, energy);
    router.push(`/dashboard?user=${userId}&mood=${mood}&energy=${energy}`);
  };

  const handleBack = () => {
    router.push(`/checkin/mood?user=${userId}`);
  };

  return (
    <EnergyCheckIn
      userName={userName}
      energy={energy}
      onEnergyChange={setEnergy}
      onContinue={handleContinue}
      onBack={handleBack}
      submitting={submitting}
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
