'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EnergyCheckIn from '../../Components/AfterLogin/EnergyCheckIn';
import { demoUsers } from '../../Components/DemoData';

function EnergyCheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('user')?.trim() || 'eric';
  const mood = searchParams.get('mood') === 'positive' || searchParams.get('mood') === 'negative' ? searchParams.get('mood') : 'neutral';
  const userName = demoUsers.find((user) => user.id === userId)?.name ?? userId;

  const [energy, setEnergy] = useState(50);

  const handleContinue = () => {
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
