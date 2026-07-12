const API_BASE = (import.meta.env?.VITE_API_URL || 'http://localhost:3001') + '/admin';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Look in localStorage first
  const localToken = localStorage.getItem('access_token');
  if (localToken) return localToken;

  // Otherwise check document.cookie
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function adminFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    let msg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data.message) {
        msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      }
    } catch {
      // Ignore non-json response
    }
    throw new Error(msg);
  }

  return res.json();
}

export async function fetchAdminStats() {
  return adminFetch('/stats');
}

export async function fetchAdminUsers(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return adminFetch(`/users${query}`);
}

export async function updateUserPremium(
  userId: string,
  isPremium: boolean,
  extendDays?: number,
) {
  return adminFetch(`/users/${userId}/premium`, {
    method: 'PATCH',
    body: JSON.stringify({ isPremium, extendDays }),
  });
}

export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
  return adminFetch(`/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function deleteAdminUser(userId: string) {
  return adminFetch(`/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function fetchAdminTransactions() {
  return adminFetch('/transactions');
}

export async function approveTransaction(orderId: string) {
  return adminFetch('/transactions/approve', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

export async function fetchAdminVideos() {
  return adminFetch('/videos');
}

export async function createAdminVideo(data: {
  youtubeId: string;
  title: string;
  category: string;
  level: string;
}) {
  return adminFetch('/videos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminVideo(
  id: string,
  data: {
    title?: string;
    category?: string;
    level?: string;
  },
) {
  return adminFetch(`/videos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminVideo(id: string) {
  return adminFetch(`/videos/${id}`, {
    method: 'DELETE',
  });
}

export async function importLlmNotesAdmin(userId: string, rawText: string) {
  return adminFetch(`/users/${userId}/notes/import-llm`, {
    method: 'POST',
    body: JSON.stringify({ rawText }),
  });
}
