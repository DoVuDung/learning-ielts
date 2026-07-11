const API_BASE = 'http://localhost:3001/admin';

export async function fetchAdminStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchAdminUsers(search = '') {
  const url = search ? `${API_BASE}/users?search=${encodeURIComponent(search)}` : `${API_BASE}/users`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function updateUserPremium(userId: string, isPremium: boolean, extendDays?: number) {
  const res = await fetch(`${API_BASE}/users/${userId}/premium`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPremium, extendDays }),
  });
  if (!res.ok) throw new Error('Failed to update premium status');
  return res.json();
}

export async function fetchAdminTransactions() {
  const res = await fetch(`${API_BASE}/transactions`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function approveTransaction(orderId: string) {
  const res = await fetch(`${API_BASE}/transactions/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  if (!res.ok) throw new Error('Failed to approve transaction');
  return res.json();
}

export async function fetchAdminVideos() {
  const res = await fetch(`${API_BASE}/videos`);
  if (!res.ok) throw new Error('Failed to fetch videos');
  return res.json();
}

export async function createAdminVideo(data: {
  youtubeId: string;
  title: string;
  category: string;
  level: string;
}) {
  const res = await fetch(`${API_BASE}/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create video');
  return res.json();
}
