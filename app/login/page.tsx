'use client';

import { useState, SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from '../Components/Login&Dashboard/LoginPage';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import { ensureUserProfile } from '../../lib/user-profile';

export default function LoginRoute() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      if (!data.session) throw new Error('Your session could not be created. Please try again.');

      await ensureUserProfile(data.session.access_token);

      router.push('/checkin/mood');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <LoginPage
      email={email}
      password={password}
      error={error}
      isSubmitting={isSubmitting}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onLogin={handleLoginSubmit}
      onBack={handleBack}
    />
  );
}
