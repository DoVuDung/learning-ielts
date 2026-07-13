const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:3001') + '/admin';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token') || params.get('access_token');
    if (urlToken && urlToken !== 'null' && urlToken !== 'undefined') {
      localStorage.setItem('access_token', urlToken);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      return urlToken;
    }
  } catch {}
  return localStorage.getItem('access_token');
}

export function setAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token.trim());
  }
}

export function clearAccessToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
}

async function adminFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if ((res.status === 401 || res.status === 403) && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('admin:unauthorized', { detail: { status: res.status } }),
      );
    }
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
