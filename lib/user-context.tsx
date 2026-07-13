"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { authApi } from "./api-client";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isPremium: boolean;
}

export interface UserContextValue {
  user: UserProfile | null;
  loading: boolean;
  refetchUser: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refetchUser: async () => {},
});

export function UserProvider({
  children,
  initialUser = null,
}: Readonly<{ children: React.ReactNode; initialUser?: UserProfile | null }>) {
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  const refetchUser = useCallback(async () => {
    try {
      const profile = await authApi.me();
      if (profile && profile.id) {
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      console.log('[UserProvider] load() called, token present:', Boolean(token), token ? token.substring(0, 20) + '...' : 'null');
      try {
        const profile = await authApi.me();
        console.log('[UserProvider] me() success:', profile?.id);
        if (!cancelled) {
          if (profile && profile.id) {
            setUser(profile);
          } else {
            setUser(null);
          }
        }
      } catch (e) {
        console.error('[UserProvider] me() failed:', e);
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({ user, loading, refetchUser }),
    [user, loading, refetchUser]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
