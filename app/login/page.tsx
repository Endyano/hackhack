'use client';

import { useState, SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from '../Components/Login&Dashboard/LoginPage';

export default function LoginRoute() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Demo build: no real auth (per CLAUDE.md, out of scope for the MVP) --
    // any username/password succeeds so every seeded dummy account is
    // reachable. Unrecognized usernames fall back to the first demo persona
    // (handled by DemoStateContext's setUser).
    const targetUser = username.trim() || 'eric';
    router.push(`/checkin/mood?user=${encodeURIComponent(targetUser)}`);
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <LoginPage
      username={username}
      password={password}
      error={error}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onLogin={handleLoginSubmit}
      onBack={handleBack}
    />
  );
}
