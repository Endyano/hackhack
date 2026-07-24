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

    if ((username === 'eric' || username === 'daniel') && password === 'demo') {
      router.push(`/checkin/mood?user=${username}`);
    } else {
      setError('Username atau password salah. Coba gunakan eric / demo');
    }
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
