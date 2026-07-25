export type CareMatchFriend = { id: string; friendId: string; name: string; email: string; status: 'pending' | 'accepted'; incoming: boolean };
export type CareMatchInvitation = { id: string; senderName: string; activity: string; proposedStart: string; proposedEnd: string };

async function request<T>(accessToken: string, path: string, options?: RequestInit) {
  const response = await fetch(`/api/carematch/${path}`, { ...options, headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...options?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? 'CareMatch request failed.');
  }
  return response.json() as Promise<T>;
}

export const getFriends = (token: string) => request<CareMatchFriend[]>(token, 'friends');
export const requestFriend = (token: string, email: string) => request<CareMatchFriend>(token, 'friends', { method: 'POST', body: JSON.stringify({ email }) });
export const respondToFriendRequest = (token: string, id: string, status: 'accepted' | 'declined') => request<{ ok: boolean }>(token, 'friends', { method: 'PATCH', body: JSON.stringify({ id, status }) });
export const getInvitations = (token: string) => request<CareMatchInvitation[]>(token, 'invitations');
export const sendInvitation = (token: string, receiverId: string, proposedStart: string, proposedEnd: string) => request<{ ok: boolean }>(token, 'invitations', { method: 'POST', body: JSON.stringify({ receiverId, activityName: 'Easy run together', proposedStart, proposedEnd }) });
export const respondToInvitation = (token: string, id: string, status: 'accepted' | 'declined') => request<{ ok: boolean }>(token, 'invitations', { method: 'PATCH', body: JSON.stringify({ id, status }) });
