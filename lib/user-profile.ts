export async function ensureUserProfile(accessToken: string) {
  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? 'Unable to prepare your CareShift profile.');
  }

  return response.json() as Promise<{ id: string; username: string; name: string; email: string }>;
}
